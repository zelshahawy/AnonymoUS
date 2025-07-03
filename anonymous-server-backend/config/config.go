package config

import (
	"context"
	"log"
	"strings"
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
	SetDefault(key string, value interface{})
	GetStringMap(key string) map[string]interface{}
	GetStringMapString(key string) map[string]string
	GetStringMapStringSlice(key string) map[string][]string
	GetStringSlice(key string) []string
	GetTime(key string) time.Time
	InConfig(key string) bool
	IsSet(key string) bool
	AllSettings() map[string]interface{}
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
	v.SetDefault("mongo_uri", "mongodb://localhost:27017")
	v.SetDefault("mongo_database", "chatapp")
	v.SetDefault("frontend_url", "http://localhost:3000")
	v.SetDefault("stock_api", "http://localhost:5550/api/stocks/")
	v.SetDefault("backend_url", "http://localhost:8081")
	return v
}

func ValidateRequired(keys ...string) {
	missing := []string{}
	for _, key := range keys {
		if !Config().IsSet(key) || strings.TrimSpace(Config().GetString(key)) == "" {
			missing = append(missing, key)
		}
	}
	if len(missing) > 0 {
		log.Fatalf("Missing required config keys: %s", strings.Join(missing, ", "))
	}
}

func PrintEnvironment() {
	log.Println("Environment Variables:")
	for _, key := range Config().AllSettings() {
		if value, ok := key.(string); ok && strings.TrimSpace(value) != "" {
			log.Printf("%s: %s", key, value)
		}
	}
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
	Configuration.MongoURI = Config().GetString("mongo_uri")
	Configuration.Database = Config().GetString("mongo_database")
}

// InitDBClients establishes the MongoDB connection and initializes collections.
func InitDBClients() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	clientOpts := options.Client().ApplyURI(Configuration.MongoURI)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v Here is the link %s", err, Configuration.MongoURI)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB: %v Here is the link %s", err, Configuration.MongoURI)
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
