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
	Type      string `json:"type"` // "chat", "history", "bot", "notification", "presence" or "clear"
	Count     int    `json:"count,omitempty"`
	Ts        int64  `json:"ts,omitempty"` // unix milliseconds
}

type Client struct {
	Conn   *websocket.Conn
	UserID string
	Send   chan *Message
}

type Hub struct {
	// map of userID -> client
	clients map[string][]*Client
	// watchers maps a target userID -> set of userIDs subscribed to its presence
	watchers map[string]map[string]bool
	mu       sync.RWMutex
}

var GlobalHub = &Hub{
	clients:  make(map[string][]*Client),
	watchers: make(map[string]map[string]bool),
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	wasOffline := len(h.clients[c.UserID]) == 0
	h.clients[c.UserID] = append(h.clients[c.UserID], c)
	var watchers []string
	if wasOffline {
		watchers = h.watchersOf(c.UserID)
	}
	h.mu.Unlock()

	// Announce presence only on the offline -> online transition.
	if wasOffline {
		h.notifyPresence(c.UserID, true, watchers)
	}
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	conns := h.clients[c.UserID]
	// filter out this client
	for i, cli := range conns {
		if cli == c {
			conns = append(conns[:i], conns[i+1:]...)
			break
		}
	}
	nowOffline := len(conns) == 0
	var watchers []string
	if nowOffline {
		delete(h.clients, c.UserID)
		watchers = h.watchersOf(c.UserID)
		// This user's last connection is gone; drop their presence subscriptions.
		for target, subs := range h.watchers {
			delete(subs, c.UserID)
			if len(subs) == 0 {
				delete(h.watchers, target)
			}
		}
	} else {
		h.clients[c.UserID] = conns
	}
	h.mu.Unlock()

	close(c.Send)

	// Announce presence only on the online -> offline transition.
	if nowOffline {
		h.notifyPresence(c.UserID, false, watchers)
	}
}

// Subscribe records that watcher wants presence updates for target and returns
// target's current online state so the caller can reply immediately.
func (h *Hub) Subscribe(watcher, target string) bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.watchers[target] == nil {
		h.watchers[target] = make(map[string]bool)
	}
	h.watchers[target][watcher] = true
	return len(h.clients[target]) > 0
}

// watchersOf returns the userIDs subscribed to target's presence.
// Callers must hold h.mu.
func (h *Hub) watchersOf(target string) []string {
	subs := h.watchers[target]
	if len(subs) == 0 {
		return nil
	}
	out := make([]string, 0, len(subs))
	for w := range subs {
		out = append(out, w)
	}
	return out
}

// notifyPresence pushes a presence update for user to each watcher.
// It must be called without holding h.mu (it acquires the read lock via Send).
func (h *Hub) notifyPresence(user string, online bool, watchers []string) {
	if len(watchers) == 0 {
		return
	}
	body := "offline"
	if online {
		body = "online"
	}
	for _, w := range watchers {
		h.Send(w, &Message{
			Type:      "presence",
			Messageid: GenerateMessageID(),
			From:      user,
			To:        w,
			Body:      body,
		})
	}
}

func (h *Hub) Send(to string, msg *Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, c := range h.clients[to] {
		// avoid blocking the loop if one channel is full
		select {
		case c.Send <- msg:
		default:
		}
	}
}

func (h *Hub) IsUserConnected(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return len(h.clients[userID]) > 0
}
