package hub

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Message struct {
	Messageid string `json:"messageid"`
	From      string `json:"from"`
	To        string `json:"to"`
	Body      string `json:"body"`
	Type      string `json:"type"` // "chat" or "history"
}

type Client struct {
	Conn   *websocket.Conn
	UserID string
	Send   chan *Message
}

type Hub struct {
	// map of userID → client
	clients map[string]*Client
	mu      sync.RWMutex
}

var GlobalHub = &Hub{
	clients: make(map[string]*Client),
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c.UserID] = c
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c.UserID)
	close(c.Send)
}

func (h *Hub) Send(to string, msg *Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if c, ok := h.clients[to]; ok {
		c.Send <- msg
	}
}

// (optional) you can add a Run loop if you want centralized broadcast logic.
