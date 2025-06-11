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
	clients map[string][]*Client
	mu      sync.RWMutex
}

var GlobalHub = &Hub{
	clients: make(map[string][]*Client),
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c.UserID] = append(h.clients[c.UserID], c)
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	conns := h.clients[c.UserID]
	// filter out this client
	for i, cli := range conns {
		if cli == c {
			conns = append(conns[:i], conns[i+1:]...)
			break
		}
	}
	if len(conns) == 0 {
		delete(h.clients, c.UserID)
	} else {
		h.clients[c.UserID] = conns
	}
	close(c.Send)
}

func (h *Hub) Send(to string, msg *Message) {
	for _, c := range h.clients[to] {
		// avoid blocking the loop if one channel is full
		select {
		case c.Send <- msg:
		default:
		}
	}
}

// (optional) you can add a Run loop if you want centralized broadcast logic.
