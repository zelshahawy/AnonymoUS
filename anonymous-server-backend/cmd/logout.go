package cmd

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/zelshahawy/Anonymous_backend/services"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	frontend := os.Getenv("FRONTEND_URL")

	// 1) Try to parse the JWT so we know which user is logging out
	if cookie, err := r.Cookie("auth_token"); err == nil {
		token, err := jwt.ParseWithClaims(cookie.Value, &jwt.StandardClaims{}, func(t *jwt.Token) (interface{}, error) {
			return services.SecretKey, nil
		})
		if err == nil {
			if claims, ok := token.Claims.(*jwt.StandardClaims); ok && token.Valid {
				user := claims.Subject
				// 2) If it's one of the test accounts, delete their data
				if user == "testuser1" || user == "testuser2" {
					if err := services.DeleteUserData(user); err != nil {
						log.Printf("failed to delete data for %s: %v", user, err)
					}
				}
			}
		}
	}

	// 3) Clear the auth_token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	// 4) Redirect back to your frontend
	http.Redirect(w, r, frontend+"/", http.StatusSeeOther)
}
