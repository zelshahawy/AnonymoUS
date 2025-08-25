package services

import (
	"context"
	"log"

	"github.com/zelshahawy/Anonymous_backend/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// LoadRecentMessages loads the most recent messages between two users.
func LoadRecentMessages(ctx context.Context, userID, otherUserID string, limit int) ([]MessageDoc, error) {
	var messages []MessageDoc

	cursor, err := config.DBClients.MessagesCollection.Find(ctx, bson.M{
		"$or": []bson.M{
			{"from": userID, "to": otherUserID},
			{"from": otherUserID, "to": userID},
		},
	}, &options.FindOptions{
		Sort:  bson.M{"_id": -1},
		Limit: &[]int64{int64(limit)}[0],
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var msg MessageDoc
		if err := cursor.Decode(&msg); err != nil {
			log.Printf("failed to decode message: %v", err)
			continue
		}
		messages = append(messages, msg)
	}

	// Reverse to get chronological order
	for i := len(messages)/2 - 1; i >= 0; i-- {
		opp := len(messages) - 1 - i
		messages[i], messages[opp] = messages[opp], messages[i]
	}

	return messages, nil
}
