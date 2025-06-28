package services

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/dgrijalva/jwt-go"
)

var (
	mu          sync.RWMutex
	revokedJTIs = make(map[string]time.Time)
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
		token, err := jwt.ParseWithClaims(c.Value, claims, func(t *jwt.Token) (any, error) {
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

// RevokeJTI marks a JWT ID as revoked until its expiration time.
func RevokeJTI(jti string, exp time.Time) {
	mu.Lock()
	revokedJTIs[jti] = exp
	mu.Unlock()
}

// IsJTIRevoked reports true if the JTI has been revoked.
// It also auto-cleans any entries that have expired.
func IsJTIRevoked(jti string) bool {
	mu.RLock()
	exp, ok := revokedJTIs[jti]
	mu.RUnlock()
	if !ok {
		return false
	}
	if time.Now().After(exp) {
		mu.Lock()
		delete(revokedJTIs, jti)
		mu.Unlock()
		return false
	}
	return true
}
