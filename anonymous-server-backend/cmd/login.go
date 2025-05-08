package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/zelshahawy/Anonymous_backend/services"
)

// LoginHandler handles the login request
// It validates the request, processes the login, and returns a JWT token
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Set the content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// Parse the request body
	var loginRequest services.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding request: %v", err), http.StatusBadRequest)
		return
	}

	// Validate the login request
	if err := loginRequest.Validate(); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Process the login request
	response, err := services.ProcessLogin(loginRequest)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error processing login: %v", err), http.StatusInternalServerError)
		return
	}

	// Write the response
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, fmt.Sprintf("Error encoding response: %v", err), http.StatusInternalServerError)
	}
}
