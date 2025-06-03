package services

import (
	"context"
	"log"
	"time"

	"github.com/zelshahawy/Anonymous_backend/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MessageDoc represents a chat message stored in MongoDB.
type MessageDoc struct {
	MsgID     string    `bson:"msgId"`
	From      string    `bson:"from"`
	To        string    `bson:"to"`
	Body      string    `bson:"body"`
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

// LoadRecentMessages fetches the last 'limit' messages exchanged between userA and userB.
func LoadRecentMessages(ctx context.Context, userA, userB string, limit int64) ([]MessageDoc, error) {
	// Filter for messages where (from=userA AND to=userB) OR (from=userB AND to=userA)
	filter := bson.M{
		"$or": []bson.M{
			{"from": userA, "to": userB},
			{"from": userB, "to": userA},
		},
	}
	// Sort by timestamp descending and limit
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}).SetLimit(limit)
	cursor, err := config.DBClients.MessagesCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var msgs []MessageDoc
	for cursor.Next(ctx) {
		var m MessageDoc
		if err := cursor.Decode(&m); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}

	// Reverse slice to chronological order
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}

	return msgs, nil
}
