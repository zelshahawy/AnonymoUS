package cmd

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/zelshahawy/Anonymous_backend/internal/hub"
	"github.com/zelshahawy/Anonymous_backend/services"
)

const (
	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second
	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = 30 * time.Second
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return strings.HasPrefix(r.Header.Get("Origin"), "https://anonymous-sigma-three.vercel.app")
	},
}

// WsHandler handles WebSocket requests from clients.
func WsHandler(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
		return
	}
	claim, err := services.ValidateToken(token)
	if err != nil {
		log.Printf("invalid token: %v", err)
		http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
		return
	}
	userID := claim.Subject
	if userID == "" {
		http.Error(w, "Unauthorized: empty user ID", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "could not upgrade to websocket", http.StatusInternalServerError)
		return
	}

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

// readPump pumps messages from the WebSocket to the hub.
// It also handles history requests and chat messages.
func readPump(ctx context.Context, c *hub.Client) {
	defer func() {
		hub.GlobalHub.Unregister(c)
		c.Conn.Close()
	}()

	// Configure read deadline and pong handler
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		return c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		var msg hub.Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			break
		}

		switch msg.Type {
		case "history":
			history, err := services.LoadRecentMessages(ctx, c.UserID, msg.To, 50)
			if err != nil {
				log.Printf("error loading history: %v", err)
				continue
			}
			for _, m := range history {
				_ = c.Conn.WriteJSON(hub.Message{
					Type:      "history",
					Messageid: m.MsgID,
					From:      m.From,
					To:        m.To,
					Body:      m.Body,
				})
			}

		case "chat":
			msg.From = c.UserID
			msg.Messageid = hub.GenerateMessageID()

			if err := services.SaveMessage(ctx, &services.MessageDoc{
				MsgID: msg.Messageid,
				From:  msg.From,
				To:    msg.To,
				Body:  msg.Body,
			}); err != nil {
				log.Printf("failed to save message %s: %v", msg.Messageid, err)
			}

			hub.GlobalHub.Send(msg.From, &msg)
			hub.GlobalHub.Send(msg.To, &msg)

			for _, bot := range services.HandleStockCommand(&msg) {
				botMsg := hub.Message{
					Type:      "chat", // or "bot" if you handle that specially
					Messageid: hub.GenerateMessageID(),
					From:      bot.From,
					To:        msg.To,
					Body:      bot.Body,
				}
				hub.GlobalHub.Send(botMsg.From, &botMsg)
				hub.GlobalHub.Send(botMsg.To, &botMsg)
			}

		default:
			log.Printf("unknown message type: %q", msg.Type)
		}
	}
}

// writePump pumps messages from the hub to the WebSocket.
func writePump(c *hub.Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				// Hub closed the channel.
				return
			}
			if err := c.Conn.WriteJSON(msg); err != nil {
				return
			}

		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
