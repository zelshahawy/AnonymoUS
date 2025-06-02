package cmd

import (
	"net/http"
	"os"
	"time"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	frontend := os.Getenv("FRONTEND_URL")
	w.Header().Set("Content-Type", "application/json")

	// Clear the JWT token from the response
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0), // Set expiration to the past
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	// Redirect to the frontend logout page
	http.Redirect(w, r, frontend+"/", http.StatusSeeOther)
}
