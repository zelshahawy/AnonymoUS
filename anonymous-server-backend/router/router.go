package router

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

func StartServer() {
	router := mux.NewRouter()

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Default port if not specified
	}
	fmt.Printf("Starting server on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		fmt.Printf("Error starting server: %v\n", err)
	}
}
