package router

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/zelshahawy/Anonymous_backend/cmd"
)

func StartServer() {
	router := mux.NewRouter()

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Default port if not specified
	}
	fmt.Printf("Starting server on port %s...\n", port)

	// Define the heartbeat route
	router.HandleFunc("/heartbeat", cmd.HeartbeatHandler).Methods("GET")
	// Define the login route
	router.HandleFunc("/login", cmd.LoginHandler).Methods("POST")

	if err := http.ListenAndServe(":"+port, router); err != nil {
		fmt.Printf("Error starting server: %v\n", err)
	}
}
