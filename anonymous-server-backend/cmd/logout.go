package cmd

import (
	"log"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/zelshahawy/Anonymous_backend/config"
	"github.com/zelshahawy/Anonymous_backend/services"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	frontend := config.Config().GetString("frontend_url")

	if cookie, err := r.Cookie("auth_token"); err == nil {
		token, err := jwt.ParseWithClaims(cookie.Value, &jwt.StandardClaims{}, func(t *jwt.Token) (any, error) {
			return services.SecretKey, nil
		})
		if err == nil {
			if claims, ok := token.Claims.(*jwt.StandardClaims); ok && token.Valid {
				services.RevokeJTI(claims.Id, time.Unix(claims.ExpiresAt, 0))
				user := claims.Subject
				if user == "testuser1" || user == "testuser2" {
					if err := services.DeleteUserData(user); err != nil {
						log.Printf("failed to delete data for %s: %v", user, err)
					}
				}
			}
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	http.Redirect(w, r, frontend+"/", http.StatusSeeOther)
}
