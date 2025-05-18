package cmd

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/zelshahawy/Anonymous_backend/services"

	"github.com/zelshahawy/Anonymous_backend/internal/hub"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // tighten in prod!
}

func WsHandler(w http.ResponseWriter, r *http.Request) {
	// 1) get userID from context (set by your AuthMiddleware)
	userID, ok := services.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized - missing userID", http.StatusUnauthorized)
		return
	}
	if userID == "" {
		http.Error(w, "unauthorized - empty userID", http.StatusUnauthorized)
		return
	} else {
		fmt.Println("userID", userID, "Has connected.")
	}

	// 2) upgrade to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "could not upgrade", http.StatusInternalServerError)
		return
	}

	// 3) wrap in a client and register
	client := &hub.Client{
		Conn:   conn,
		UserID: userID,
		Send:   make(chan *hub.Message, 256),
	}
	hub.GlobalHub.Register(client)

	ctx := r.Context()

	go writePump(client)
	readPump(ctx, client)
}

// change readPump to accept a context
func readPump(ctx context.Context, c *hub.Client) {
	defer func() {
		hub.GlobalHub.Unregister(c)
		c.Conn.Close()
	}()

	for {
		var msg hub.Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			break
		}

		switch msg.Type {
		case "history":
			// client is asking for history with msg.To
			history, err := services.LoadRecentMessages(ctx, c.UserID, msg.To, 50)
			if err != nil {
				log.Printf("error loading history: %v", err)
				continue
			}
			// send each historical message back over the socket
			for _, m := range history {
				c.Conn.WriteJSON(hub.Message{
					Type:      "history",
					Messageid: m.MsgID,
					From:      m.From,
					To:        m.To,
					Body:      m.Body,
				})
			}

		case "chat":
			// a real-time chat message
			msg.From = c.UserID
			msg.Messageid = hub.GenerateMessageID()

			// persist it
			if err := services.SaveMessage(ctx, &services.MessageDoc{
				MsgID: msg.Messageid,
				From:  msg.From,
				To:    msg.To,
				Body:  msg.Body,
			}); err != nil {
				log.Printf("failed to save message %s: %v", msg.Messageid, err)
			}

			// route to the recipient
			hub.GlobalHub.Send(msg.To, &msg)

		default:
			log.Printf("unknown message type: %q", msg.Type)
		}
	}
}

func writePump(c *hub.Client) {
	for msg := range c.Send {
		c.Conn.WriteJSON(msg)
	}
}

func close(c *hub.Client) {
	c.Conn.Close()
	hub.GlobalHub.Unregister(c)
}
