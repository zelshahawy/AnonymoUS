package router

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/zelshahawy/Anonymous_backend/cmd"
	"github.com/zelshahawy/Anonymous_backend/config"
	"github.com/zelshahawy/Anonymous_backend/services"
)

func StartServer() {
	config.LoadConfig()
	config.InitDBClients()
	defer config.DisconnectDB()

	// Set up CORS middleware
	corsMiddleware := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3000", "https://anonymous-sigma-three.vercel.app"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
		handlers.AllowCredentials(),
	)

	router := mux.NewRouter()
	router.Use(corsMiddleware)

	// Define public routes
	router.HandleFunc("/login", cmd.LoginHandler).Methods("POST", "OPTIONS")
	router.HandleFunc("/logout", cmd.LogoutHandler).Methods("GET", "OPTIONS")
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	router.HandleFunc("/ws", cmd.WsHandler).Methods("GET", "OPTIONS")

	// Protected routes
	protected := router.NewRoute().Subrouter()
	protected.Use(services.AuthMiddleware)
	protected.HandleFunc("/heartbeat", cmd.HeartbeatHandler).Methods("GET", "OPTIONS")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	fmt.Printf("Starting server on port %s...\n", port)

	if err := http.ListenAndServe(":"+port, router); err != nil {
		fmt.Printf("Error starting server: %v\n", err)
	}
}
