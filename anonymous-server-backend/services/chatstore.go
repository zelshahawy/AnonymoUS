package services

import (
	"context"
	"log"
	"time"

	"github.com/zelshahawy/Anonymous_backend/config"
	"go.mongodb.org/mongo-driver/bson"
)

type MessageDoc struct {
	MsgID     string    `bson:"msgId"`
	From      string    `bson:"from"`
	To        string    `bson:"to"`
	Body      string    `bson:"body"`
	Type      string    `bson:"type, omitempty"`
	Notified  bool      `bson:"notified"`
	Timestamp time.Time `bson:"timestamp"`
}

func SaveMessage(ctx context.Context, doc *MessageDoc) error {
	doc.Timestamp = time.Now()
	_, err := config.DBClients.MessagesCollection.InsertOne(ctx, doc)
	return err
}

func DeleteConversation(ctx context.Context, userA, userB string) error {
	filter := bson.M{"$or": []bson.M{
		{"from": userA, "to": userB},
		{"from": userB, "to": userA},
	}}

	res, err := config.DBClients.MessagesCollection.DeleteMany(ctx, filter)
	if err != nil {
		log.Printf("failed to delete conversation between %s and %s: %v", userA, userB, err)
		return err
	}
	log.Printf("deleted %d messages between %s and %s", res.DeletedCount, userA, userB)
	return nil
}

func DeleteUserData(username string) error {
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
