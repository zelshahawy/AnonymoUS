package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// HeartbeatHandler handles the heartbeat request
func HeartbeatHandler(w http.ResponseWriter, r *http.Request) {
	// Set the content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// Create a heartbeat response
	response := map[string]string{
		"status":  "ok",
		"message": "Server is running :)",
		"time":    time.Now().Format(time.RFC3339),
	}

	// Write the response
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, fmt.Sprintf("Error encoding response: %v", err), http.StatusInternalServerError)
	}
}
