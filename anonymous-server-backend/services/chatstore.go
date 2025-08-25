package services

import (
	"context"
	"log"
	"time"

	"github.com/zelshahawy/Anonymous_backend/config"
	"go.mongodb.org/mongo-driver/bson"
)

// MessageDoc represents a chat message stored in MongoDB.
type MessageDoc struct {
	MsgID     string    `bson:"msgId"`
	From      string    `bson:"from"`
	To        string    `bson:"to"`
	Body      string    `bson:"body"`
	Type      string    `bson:"type, omitempty"` // Add this field
	Timestamp time.Time `bson:"timestamp"`
}

// SaveMessage persists a MessageDoc to the messages collection.
func SaveMessage(ctx context.Context, doc *MessageDoc) error {
	doc.Timestamp = time.Now()
	_, err := config.DBClients.MessagesCollection.InsertOne(ctx, doc)
	return err
}

func DeleteUserData(username string) error {
	// remove all messages sent or received by this user
	filter := bson.M{"$or": []bson.M{
		{"from": username},
		{"to": username},
	}}

	res, err := config.DBClients.MessagesCollection.DeleteMany(context.Background(), filter)
	if err != nil {
		log.Printf("failed to delete messages for user %s: %v", username, err)
		return err
	}
	log.Printf("deleted %d messages for user %s", res.DeletedCount, username)
	return nil
}
