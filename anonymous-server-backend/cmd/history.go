package cmd

import (
	"encoding/json"
	"net/http"

	"github.com/zelshahawy/Anonymous_backend/services"
)

// HistoryHandler returns the last N messages between the
// authenticated user and the peer specified in ?peer={peerID}.
func HistoryHandler(w http.ResponseWriter, r *http.Request) {
	// 1) Authenticated user ID from context
	userID, ok := services.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// 2) Peer ID from query string
	peerID := r.URL.Query().Get("peer")
	if peerID == "" {
		http.Error(w, "missing peer parameter", http.StatusBadRequest)
		return
	}

	// 3) Load history (e.g. last 50 messages)
	msgs, err := services.LoadRecentMessages(r.Context(), userID, peerID, 50)
	if err != nil {
		http.Error(w, "could not load messages: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 4) Encode as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msgs)
}
