package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/zelshahawy/Anonymous_backend/services"
)

// RegisterHandler handles user registration with username/password
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("RegisterHandler called")
	ct := r.Header.Get("Content-Type")

	var registerRequest struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	switch {
	case strings.HasPrefix(ct, "application/json"):
		if err := json.NewDecoder(r.Body).Decode(&registerRequest); err != nil {
			http.Error(w, fmt.Sprintf("Error decoding JSON request: %v", err), http.StatusBadRequest)
			return
		}

	case strings.HasPrefix(ct, "application/x-www-form-urlencoded"):
		if err := r.ParseForm(); err != nil {
			http.Error(w, fmt.Sprintf("Error parsing form: %v", err), http.StatusBadRequest)
			return
		}
		registerRequest.Username = r.PostFormValue("username")
		registerRequest.Email = r.PostFormValue("email")
		registerRequest.Password = r.PostFormValue("password")

	default:
		http.Error(w, "Unsupported Content-Type", http.StatusUnsupportedMediaType)
		return
	}

	// Basic validation
	if registerRequest.Username == "" || registerRequest.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	// Check if user already exists
	ctx := r.Context()
	if _, err := services.FindUserByUsername(ctx, registerRequest.Username); err == nil {
		http.Error(w, "Username already exists", http.StatusConflict)
		return
	}

	// Create the user
	user, err := services.CreateUser(ctx, registerRequest.Username, registerRequest.Email, registerRequest.Password)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create user: %v", err), http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	svcUser := services.User{Username: user.Username}
	token, err := services.GenerateJWTToken(svcUser)
	if err != nil {
		http.Error(w, fmt.Sprintf("Token generation error: %v", err), http.StatusInternalServerError)
		return
	}

	// Set cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":   token,
		"message": "User registered successfully",
	})

	fmt.Println("RegisterHandler completed successfully")
}
