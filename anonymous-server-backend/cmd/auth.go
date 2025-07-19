// cmd/auth.go
package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/zelshahawy/Anonymous_backend/config"
	"github.com/zelshahawy/Anonymous_backend/services"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var (
	googleCfg = &oauth2.Config{
		ClientID:     config.Config().GetString("google_client_id"),
		ClientSecret: config.Config().GetString("google_client_secret"),
		RedirectURL:  config.Config().GetString("frontend_url") + "/auth/google/callback",
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
	oauthStateString = config.Config().GetString("oauth_state_string")
)

// HandleGoogleLogin redirects the user to Google's OAuth consent page.
func HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	url := googleCfg.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// HandleGoogleCallback handles the OAuth callback from Google.
func HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	// Validate state
	if r.FormValue("state") != oauthStateString {
		http.Error(w, "Invalid OAuth state", http.StatusBadRequest)
		return
	}

	// Exchange code for token
	tok, err := googleCfg.Exchange(r.Context(), r.FormValue("code"))
	if err != nil {
		http.Error(w, "Failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch user info
	client := googleCfg.Client(r.Context(), tok)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Error(w, "Failed to get user info: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var info struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		http.Error(w, "Failed to decode user info: "+err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := r.Context()
	// Look up existing user by GoogleID
	userDoc, err := services.FindUserByGoogleID(ctx, info.ID)
	if err == services.ErrUserNotFound {
		// New user: redirect to registration page
		redirectURL := fmt.Sprintf(
			"%s/register?googleID=%s&email=%s",
			config.Config().GetString("frontend_url"),
			url.QueryEscape(info.ID),
			url.QueryEscape(info.Email),
		)
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}
	if err != nil {
		http.Error(w, "Lookup error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Existing user: generate JWT and set cookie
	// Construct services.User for token generation
	svcUser := services.User{Username: userDoc.Username}
	tokenStr, err := services.GenerateJWTToken(svcUser)
	if err != nil {
		http.Error(w, "Token generation error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	// Set HttpOnly session cookie
	setSessionCookie(w, tokenStr)

	http.Redirect(w, r, config.Config().GetString("frontend_url")+"/chat", http.StatusSeeOther)
}

func HandleExternalRegister(w http.ResponseWriter, r *http.Request) {
	var p struct {
		GoogleID, Email, Username, Password, RecaptchaToken string
	}
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	user, err := services.CreateExternalUser(ctx, p.GoogleID, p.Email, p.Username, p.Password)
	if err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// generate JWT & set cookie
	svcUser := services.User{Username: user.Username}
	tok, err := services.GenerateJWTToken(svcUser)
	if err != nil {
		http.Error(w, "Token generation error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	setSessionCookie(w, tok)

	// Return JSON response with token as expected by frontend
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tok})
}

// setSessionCookie sets a session_token cookie with the given token string.
func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
