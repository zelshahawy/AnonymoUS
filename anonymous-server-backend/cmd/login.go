package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/zelshahawy/Anonymous_backend/config"
	"github.com/zelshahawy/Anonymous_backend/services"
)

var RecaptchaSecret = config.Config().GetString("recaptcha_secret")

// LoginHandler handles the login request, parses either JSON or form data,
// validates it, and returns a JWT token.
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("LoginHandler called")
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
		loginRequest.RecaptchaToken = r.PostFormValue("recaptcha_token")

	default:
		http.Error(w, "Unsupported Content-Type", http.StatusUnsupportedMediaType)
		return
	}

	// fmt.Printf("recaptchaToken=%q\n", loginRequest.RecaptchaToken)

	if err := loginRequest.Validate(); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	/* resp, err := http.PostForm(
		"https://www.google.com/recaptcha/api/siteverify",
		url.Values{
			"secret":   {RecaptchaSecret},
			"response": {loginRequest.RecaptchaToken},
		},
	)
	if err != nil {
		// http.Error(w, "recaptcha verification failed", http.StatusInternalServerError)
		fmt.Printf("Error verifying recaptcha: %v\n", err)
	}
	defer resp.Body.Close()

	var rc struct {
		Success bool `json:"success"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rc); err != nil || !rc.Success {
		//http.Error(w, "recaptcha validation failed", http.StatusBadRequest)
		//return
		fmt.Printf("Recaptcha validation failed: %v\n", err)
	}
	*/

	response, err := services.ProcessLogin(loginRequest)
	if err != nil {
		fmt.Printf("Error processing login: %v\n", err)
		http.Error(w, fmt.Sprintf("Error processing login: %v", err), http.StatusInternalServerError)
		return
	}

	// set the cookie before sending headers
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    response.Token,
		Path:     "/",                            // or whatever path your app uses
		Expires:  time.Now().Add(24 * time.Hour), // time.Time
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding login response: %v\n", err)
	}
	fmt.Println("LoginHandler completed successfully")
}
