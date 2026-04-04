package services

import (
	"context"
	"log"

	"github.com/zelshahawy/Anonymous_backend/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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

// LoadUnreadChatCounts returns unread chat-message counts grouped by sender.
func LoadUnreadChatCounts(ctx context.Context, userID string) (map[string]int, error) {
	counts := make(map[string]int)

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"to":       userID,
			"type":     "chat",
			"notified": false,
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$from",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := config.DBClients.MessagesCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var row struct {
		From  string `bson:"_id"`
		Count int    `bson:"count"`
	}

	for cursor.Next(ctx) {
		if err := cursor.Decode(&row); err != nil {
			log.Printf("failed to decode unread-count row: %v", err)
			continue
		}
		if row.From == "" || row.Count <= 0 {
			continue
		}
		counts[row.From] = row.Count
	}

	return counts, nil
}

// MarkUnreadChatMessagesNotified marks unread chat messages to user as notified.
func MarkUnreadChatMessagesNotified(ctx context.Context, userID string) error {
	_, err := config.DBClients.MessagesCollection.UpdateMany(
		ctx,
		bson.M{
			"to":       userID,
			"type":     "chat",
			"notified": false,
		},
		bson.M{
			"$set": bson.M{"notified": true},
		},
	)
	return err
}
