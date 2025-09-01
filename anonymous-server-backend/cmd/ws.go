package cmd

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/zelshahawy/Anonymous_backend/config"
	"github.com/zelshahawy/Anonymous_backend/internal/hub"
	"github.com/zelshahawy/Anonymous_backend/services"
)

const (
	pongWait   = 60 * time.Second
	pingPeriod = 30 * time.Second
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		frontend := config.Config().GetString("frontend_url")
		base := strings.TrimSuffix(frontend, "/")

		log.Printf("frontendurl: %v", base)
		return strings.HasPrefix(origin, "http://localhost:3000") ||
			strings.HasPrefix(origin, base)
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
		log.Printf("websocket upgrade failed: %v", err)
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

// processBotCommands handles all bot commands and sends responses
func processBotCommands(ctx context.Context, msg *hub.Message) {
	log.Printf("Processing bot commands for message: %s", msg.Body)

	// Get all bot responses from different command handlers
	var allBotResponses []services.BotResponse

	// Collect responses from stock command handler
	stockResponses := services.HandleStockCommand(msg)
	log.Printf("Stock command returned %d responses", len(stockResponses))
	allBotResponses = append(allBotResponses, stockResponses...)

	// Collect responses from top movers command handler
	topMoversResponses := services.HandleTopMoversCommand(msg)
	log.Printf("Top movers command returned %d responses", len(topMoversResponses))
	allBotResponses = append(allBotResponses, topMoversResponses...)

	log.Printf("Total bot responses: %d", len(allBotResponses))

	// Process each bot response
	for i, bot := range allBotResponses {
		log.Printf("Processing bot response %d: %s", i+1, bot.Body)

		botMsg := hub.Message{
			Type:      "bot",
			Messageid: hub.GenerateMessageID(),
			From:      msg.From,
			To:        msg.To,
			Body:      bot.Body,
		}

		if err := services.SaveMessage(ctx, &services.MessageDoc{
			MsgID: botMsg.Messageid,
			From:  botMsg.From,
			To:    botMsg.To,
			Body:  botMsg.Body,
			Type:  botMsg.Type, // Save the type
		}); err != nil {
			log.Printf("failed to save bot message %s: %v", botMsg.Messageid, err)
		} else {
			log.Printf("Successfully saved bot message %s", botMsg.Messageid)
		}

		hub.GlobalHub.Send(msg.From, &botMsg)
		hub.GlobalHub.Send(msg.To, &botMsg)
		log.Printf("Sent bot message to users %s and %s", msg.From, msg.To)
	}
}

func readPump(ctx context.Context, c *hub.Client) {
	defer func() {
		hub.GlobalHub.Unregister(c)
		c.Conn.Close()
	}()

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
				msgType := m.Type
				if msgType == "" {
					msgType = "chat" // Default for old messages
				}
				_ = c.Conn.WriteJSON(hub.Message{
					Type:      msgType, // Use the stored type
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
				Type:  msg.Type,
			}); err != nil {
				log.Printf("failed to save message %s: %v", msg.Messageid, err)
			}

			// Send to both users (online or offline)
			hub.GlobalHub.Send(msg.From, &msg)
			hub.GlobalHub.Send(msg.To, &msg)

			// Process bot commands
			processBotCommands(ctx, &msg)

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
