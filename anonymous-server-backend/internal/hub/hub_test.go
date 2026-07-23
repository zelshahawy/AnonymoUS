package hub

import (
	"testing"
	"time"
)

func newTestHub() *Hub {
	return &Hub{
		clients:  make(map[string][]*Client),
		watchers: make(map[string]map[string]bool),
	}
}

func newTestClient(userID string) *Client {
	return &Client{UserID: userID, Send: make(chan *Message, 8)}
}

func recvPresence(t *testing.T, c *Client) *Message {
	t.Helper()
	select {
	case msg := <-c.Send:
		if msg.Type != "presence" {
			t.Fatalf("expected presence message, got type %q", msg.Type)
		}
		return msg
	case <-time.After(time.Second):
		t.Fatalf("timed out waiting for presence message")
		return nil
	}
}

func TestSubscribeReportsCurrentState(t *testing.T) {
	h := newTestHub()
	a := newTestClient("a")
	h.Register(a)

	if h.Subscribe("a", "b") {
		t.Fatalf("b is not connected; Subscribe should report offline")
	}

	b := newTestClient("b")
	h.Register(b)

	if !h.Subscribe("a", "b") {
		t.Fatalf("b is connected; Subscribe should report online")
	}
}

func TestRegisterNotifiesWatchers(t *testing.T) {
	h := newTestHub()
	a := newTestClient("a")
	h.Register(a)
	h.Subscribe("a", "b")

	b := newTestClient("b")
	h.Register(b)

	msg := recvPresence(t, a)
	if msg.From != "b" || msg.Body != "online" {
		t.Fatalf("expected online notice for b, got from=%q body=%q", msg.From, msg.Body)
	}
}

func TestUnregisterNotifiesWatchersOnLastConnection(t *testing.T) {
	h := newTestHub()
	a := newTestClient("a")
	h.Register(a)

	b1 := newTestClient("b")
	b2 := newTestClient("b")
	h.Register(b1)
	h.Register(b2)
	h.Subscribe("a", "b")

	// Closing one of two connections must not announce offline.
	h.Unregister(b1)
	select {
	case msg := <-a.Send:
		t.Fatalf("unexpected message after closing one of two connections: %+v", msg)
	case <-time.After(50 * time.Millisecond):
	}

	// Closing the last connection announces offline.
	h.Unregister(b2)
	msg := recvPresence(t, a)
	if msg.From != "b" || msg.Body != "offline" {
		t.Fatalf("expected offline notice for b, got from=%q body=%q", msg.From, msg.Body)
	}
}

func TestWatcherSubscriptionsDroppedOnDisconnect(t *testing.T) {
	h := newTestHub()
	a := newTestClient("a")
	h.Register(a)
	h.Subscribe("a", "b")
	h.Unregister(a)

	// a is gone; b coming online must not panic or send to a stale channel.
	b := newTestClient("b")
	h.Register(b)

	if len(h.watchersOf("b")) != 0 {
		t.Fatalf("expected a's subscription to be dropped on disconnect")
	}
}
