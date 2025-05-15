package services

import (
	"context"
	"fmt"
	"net/http"

	"github.com/dgrijalva/jwt-go"
)

type contextKey string

const userIDKey contextKey = "userID"

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
		ctx := context.WithValue(r.Context(), userIDKey, claims.Subject)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserIDFromContext retrieves the user ID from the request context.
// Returns the ID and a boolean indicating whether it was present.
func UserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}
