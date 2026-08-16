// services/user.go
package services

import (
	"context"
	"errors"
	"time"

	"github.com/zelshahawy/Anonymous_backend/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// ErrUserNotFound is returned when no user matches the query.
var ErrUserNotFound = errors.New("user not found")

// Profile pic
type ProfilePic struct {
	Data        []byte `bson:"data" json:"-"`
	ContentType string `bson:"contentType" json:"contentType"`
}

// UserDoc represents a user record in MongoDB.
type UserDoc struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Username     string             `bson:"username"`
	PasswordHash string             `bson:"passwordHash,omitempty"`
	GoogleID     string             `bson:"googleID,omitempty"`
	Email        string             `bson:"email,omitempty"`
	Active       bool               `bson:"active"`
	CreatedAt    time.Time          `bson:"createdAt"`
	ProfilePic   *ProfilePic        `bson:"profilePic,omitempty" json:"profilePic"`
}

// usersCollection returns the MongoDB collection handle for users.
func usersCollection() *mongo.Collection {
	dbName := config.Configuration.Database
	return config.DBClients.MongoClient.Database(dbName).Collection("users")
}

// FindUserByGoogleID looks up a user by their GoogleID.
func FindUserByGoogleID(ctx context.Context, googleID string) (*UserDoc, error) {
	col := usersCollection()
	var user UserDoc
	err := col.FindOne(ctx, bson.M{"googleID": googleID}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateExternalUser creates a new user linked to a GoogleID and hashes the password.
func CreateExternalUser(ctx context.Context, googleID, email, username, password string) (*UserDoc, error) {
	col := usersCollection()

	// Ensure username is unique
	count, err := col.CountDocuments(ctx, bson.M{"username": username})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("username already in use")
	}

	// Hash the password
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	user := UserDoc{
		Username:     username,
		PasswordHash: string(hashed),
		GoogleID:     googleID,
		Email:        email,
		Active:       true,
		CreatedAt:    now,
	}

	res, err := col.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}
	user.ID = res.InsertedID.(primitive.ObjectID)
	return &user, nil
}

// UpdateUserProfilePic stores the profile picture for the given username.
// Returns ErrUserNotFound if no user matches.
func UpdateUserProfilePic(
	ctx context.Context,
	username string,
	profilePic *ProfilePic,
) error {
	result, err := usersCollection().UpdateOne(
		ctx,
		bson.M{"username": username},
		bson.M{
			"$set": bson.M{
				"profilePic": profilePic,
			},
		},
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrUserNotFound
	}

	return nil
}

// GetUserProfilePic returns the stored profile picture for the given username.
// It projects away every other field so the image bytes are the only payload
// pulled from Mongo. Returns ErrUserNotFound if the user does not exist, and a
// nil picture if the user exists but has not uploaded one.
func GetUserProfilePic(ctx context.Context, username string) (*ProfilePic, error) {
	var doc struct {
		ProfilePic *ProfilePic `bson:"profilePic"`
	}

	err := usersCollection().FindOne(
		ctx,
		bson.M{"username": username},
		options.FindOne().SetProjection(bson.M{"profilePic": 1}),
	).Decode(&doc)
	if err == mongo.ErrNoDocuments {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return doc.ProfilePic, nil
}
