package services

import (
	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
)

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

var SecretKey = []byte("KDSJBASJKBA")

// generateJWTToken generates a JWT token for the given user
func generateJWTToken(user User) (string, error) {
	// Define the JWT secret key (replace with your own secret)
	// Create a new JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"exp":      jwt.TimeFunc().Add(1 * time.Minute).Unix(), // Token expiration time
	})
	// Sign the token with the secret key
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
