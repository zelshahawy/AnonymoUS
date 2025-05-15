package cmd

import (
	"fmt"
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
		fmt.Println("userID", userID)
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

	// 4) start pumps
	go writePump(client)
	readPump(client)

	// 5) close connection
	defer close(client)
}

func readPump(c *hub.Client) {
	defer func() {
		hub.GlobalHub.Unregister(c)
		c.Conn.Close()
	}()
	for {
		var msg hub.Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			break
		}
		// tag the sender
		msg.From = c.UserID
		msg.Messageid = hub.GenerateMessageID()
		// route it
		hub.GlobalHub.Send(msg.To, &msg)
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
