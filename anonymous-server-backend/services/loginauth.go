package services

import (
	"fmt"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/oklog/ulid/v2"
)

// LoginRequest represents the login request payload

type LoginRequest struct {
	Username       string `json:"username"`
	Password       string `json:"password"`
	RecaptchaToken string `json:"recaptchaToken"`
}

var secretInput = os.Getenv("SECRET_KEY")
var SecretKey = []byte(secretInput)

// generateJWTToken generates a JWT token for the given user
func generateJWTToken(user User) (string, error) {
	jti := ulid.Make().String()
	claims := jwt.StandardClaims{
		Id:        jti,
		Subject:   user.Username,
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
		IssuedAt:  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(SecretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %v", err)
	}
	return tokenString, nil
}

type LoginResponse struct {
	Token string `json:"access_token"`
}

type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Validate validates the login request
func (lr *LoginRequest) Validate() error {
	if lr.Username == "" {
		return fmt.Errorf("username is required")
	}
	if lr.Password == "" {
		return fmt.Errorf("password is required")
	}
	return nil
}

func ValidateToken(tokenString string) (*jwt.StandardClaims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &jwt.StandardClaims{}, func(t *jwt.Token) (interface{}, error) {
		// Ensure the token is signed with HMAC
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return SecretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %v", err)
	}

	if claims, ok := token.Claims.(*jwt.StandardClaims); ok && token.Valid {
		if IsJTIRevoked(claims.Id) {
			return nil, fmt.Errorf("token revoked")
		}
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ProcessLogin processes the login request and generates a JWT token
func ProcessLogin(loginRequest LoginRequest) (LoginResponse, error) {
	// Validate the login request

	if err := loginRequest.Validate(); err != nil {
		return LoginResponse{}, err
	}

	// Simulate user authentication (replace with actual authentication logic)
	user := User{
		Username: loginRequest.Username,
		Password: loginRequest.Password,
	}

	if user.Username != "testuser1" || user.Password != "testpassword1" {
		if user.Username != "testuser2" || user.Password != "testpassword2" {
			return LoginResponse{}, fmt.Errorf("user is not active")
		}
	}

	// Generate JWT token
	token, err := generateJWTToken(user)
	if err != nil {
		return LoginResponse{}, err
	}

	// fmt.Println("Generated JWT Token:", token)
	return LoginResponse{Token: token}, nil

}
