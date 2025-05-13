package services

import (
	"context"
	"fmt"
	"net/http"

	"github.com/dgrijalva/jwt-go"
)

// AuthMiddleware checks for a valid auth_token cookie, verifies the JWT,
// and injects the user ID (sub) into the request context.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("auth_token")
		if err != nil {
			http.Error(w, "unauthorized - missing cookie", http.StatusUnauthorized)
			return
		}

		// parse & validate JWT
		claims := &jwt.StandardClaims{}
		token, err := jwt.ParseWithClaims(c.Value, claims, func(t *jwt.Token) (interface{}, error) {
			// ensure token is signed with HMAC
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return SecretKey, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "unauthorized - invalid token", http.StatusUnauthorized)
			return
		}

		// inject user ID into context and call next
		ctx := context.WithValue(r.Context(), "userID", claims.Subject)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
