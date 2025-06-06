package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/spf13/viper"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Provider defines a set of read-only methods for accessing the application
// configuration params as defined in one of the config files.
type Provider interface {
	ConfigFileUsed() string
	Get(key string) interface{}
	GetBool(key string) bool
	GetDuration(key string) time.Duration
	GetFloat64(key string) float64
	GetInt(key string) int
	GetInt64(key string) int64
	GetSizeInBytes(key string) uint
	GetString(key string) string
	GetStringMap(key string) map[string]interface{}
	GetStringMapString(key string) map[string]string
	GetStringMapStringSlice(key string) map[string][]string
	GetStringSlice(key string) []string
	GetTime(key string) time.Time
	InConfig(key string) bool
	IsSet(key string) bool
}

var defaultConfig *viper.Viper

// Config returns a default config providers
func Config() Provider {
	return defaultConfig
}

// LoadConfigProvider returns a configured viper instance
func LoadConfigProvider(appName string) Provider {
	return readViperConfig(appName)
}

func init() {
	defaultConfig = readViperConfig("ANONYMOUS_BACKEND")
}

func readViperConfig(appName string) *viper.Viper {
	v := viper.New()
	v.SetEnvPrefix(appName)
	v.AutomaticEnv()

	// global defaults

	v.SetDefault("json_logs", false)
	v.SetDefault("loglevel", "debug")

	return v
}

type Clients struct {
	// MongoClient is the primary MongoDB client used for database operations.
	MongoClient *mongo.Client
	// MessagesCollection is the MongoDB collection for chat messages.
	MessagesCollection *mongo.Collection
}

// DataConfig carries configuration values for connecting to services.
type DataConfig struct {
	MongoURI string
	Database string
}

var (
	DBClients     Clients
	Configuration DataConfig
)

// LoadConfig reads required configuration from environment variables.
func LoadConfig() {
	Configuration.MongoURI = os.Getenv("MONGO_URI")
	if Configuration.MongoURI == "" {
		log.Fatal("MONGO_URI environment variable is required")
	}
	// Optionally allow overriding the database name; default to "chatapp".
	Configuration.Database = os.Getenv("MONGO_DATABASE")
	if Configuration.Database == "" {
		Configuration.Database = "chatapp"
	}
}

// InitDBClients establishes the MongoDB connection and initializes collections.
func InitDBClients() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	clientOpts := options.Client().ApplyURI(Configuration.MongoURI)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	// Assign the client and messages collection for use in other services.
	DBClients.MongoClient = client
	DBClients.MessagesCollection = client.Database(Configuration.Database).Collection("messages")

	log.Printf("Connected to MongoDB at %s, using database %s\n", Configuration.MongoURI, Configuration.Database)
}

// DisconnectDB gracefully disconnects from MongoDB when the application shuts down.
func DisconnectDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := DBClients.MongoClient.Disconnect(ctx); err != nil {
		log.Printf("Error disconnecting MongoDB: %v", err)
	} else {
		log.Println("MongoDB connection closed")
	}
}
