package services

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
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
func GenerateJWTToken(user User) (string, error) {
	claims := jwt.StandardClaims{
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
	Username     string `json:"username"`
	Password     string `json:"password"`
	PasswordHash string `bson:"passwordHash,omitempty"` // only for local users
	GoogleID     string `bson:"googleID,omitempty"`     // only for Google users
	Email        string `bson:"email,omitempty"`
	Active       bool   `bson:"active"`
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
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ProcessLogin looks up the user, checks bcrypt, and returns a JWT.
func ProcessLogin(req LoginRequest) (LoginResponse, error) {
	// 1) Basic validation
	if err := req.Validate(); err != nil {
		fmt.Println("Invalid login request:", err)
		return LoginResponse{}, err
	}
	req.Username = strings.TrimSpace(req.Username)
	req.Password = strings.TrimSpace(req.Password)
	fmt.Printf("ProcessLogin → incoming username=%q password=%q\n", req.Username, req.Password)

	ctx := context.Background()
	// 2) Fetch user record from Mongo
	userDoc, err := FindUserByUsername(ctx, req.Username)
	if err == ErrUserNotFound {
		fmt.Println("User not found:", req.Username)
		return LoginResponse{}, fmt.Errorf("invalid credentials")
	} else if err != nil {
		fmt.Println("Error finding user:", err)
		return LoginResponse{}, err
	}
	fmt.Println("Found user:", userDoc.Username)
	fmt.Println("passwordHash:", userDoc.PasswordHash)
	// 3) Compare password hash
	if bcrypt.CompareHashAndPassword(
		[]byte(userDoc.PasswordHash),
		[]byte(req.Password),
	) != nil {
		return LoginResponse{}, fmt.Errorf("invalid credentials")
	}

	// 4) Generate JWT
	svcUser := User{Username: userDoc.Username}
	token, err := GenerateJWTToken(svcUser)
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{Token: token}, nil
}

// services/user.go

func FindUserByUsername(ctx context.Context, username string) (*UserDoc, error) {
	col := usersCollection()
	var user UserDoc
	err := col.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, ErrUserNotFound
	}
	return &user, err
}
