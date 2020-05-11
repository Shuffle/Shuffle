package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func webhook() {
	// FIXME - remove static
	port := ":8080"
	baseFilePath := "/"

	mux := mux.NewRouter()
	mux.SkipClean(true)

	// FIXME - Add path for updating the hook? Can be a specific POST requeuest from backend
	mux.HandleFunc(baseFilePath, Authorization).Methods("POST")

	handlers.LoggingHandler(os.Stdout, mux)
	loggedRouter := handlers.LoggingHandler(os.Stdout, mux)

	err := http.ListenAndServe(
		port,
		loggedRouter,
	)

	if err != nil {
		log.Fatal("ListenAndServer: ", err)
	}

}

func main() {
	webhook()
}
