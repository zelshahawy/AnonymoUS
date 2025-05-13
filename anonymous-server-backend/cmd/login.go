package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/zelshahawy/Anonymous_backend/services"
)

// LoginHandler handles the login request, parses either JSON or form data,
// validates it, and returns a JWT token.
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ct := r.Header.Get("Content-Type")

	var loginRequest services.LoginRequest

	switch {
	case strings.HasPrefix(ct, "application/json"):
		if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
			http.Error(w, fmt.Sprintf("Error decoding JSON request: %v", err), http.StatusBadRequest)
			return
		}

	case strings.HasPrefix(ct, "application/x-www-form-urlencoded"):
		if err := r.ParseForm(); err != nil {
			http.Error(w, fmt.Sprintf("Error parsing form: %v", err), http.StatusBadRequest)
			return
		}
		loginRequest.Username = r.PostFormValue("username")
		loginRequest.Password = r.PostFormValue("password")

	default:
		http.Error(w, "Unsupported Content-Type", http.StatusUnsupportedMediaType)
		return
	}

	if err := loginRequest.Validate(); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	response, err := services.ProcessLogin(loginRequest)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error processing login: %v", err), http.StatusInternalServerError)
		return
	}

	// set the JSON content-type
	w.Header().Set("Content-Type", "application/json")

	// set the cookie before sending headers
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    response.Token,
		Path:     "/",
		Expires:  time.Now().Add(1 * time.Minute),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	// now send status code and JSON body
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "logged in",
	})
}
