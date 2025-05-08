package router

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/zelshahawy/Anonymous_backend/cmd"
	"github.com/zelshahawy/Anonymous_backend/services"
)

func StartServer() {
	router := mux.NewRouter()

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Default port if not specified
	}
	fmt.Printf("Starting server on port %s...\n", port)

	// Define the login route
	router.HandleFunc("/login", cmd.LoginHandler).Methods("POST")

	// Define the static file route
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	protected := router.NewRoute().Subrouter()
	protected.Use(services.RequireJWT)
	protected.HandleFunc("/heartbeat", cmd.HeartbeatHandler).Methods("GET")

	if err := http.ListenAndServe(":"+port, router); err != nil {
		fmt.Printf("Error starting server: %v\n", err)
	}
}
