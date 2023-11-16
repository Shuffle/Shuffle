# Backend 
This folder has all parts necessary for the backend to run locally and in Docker

## Structure
* go-app: 	The backend. Modify these to edit the backend API.
* database: The datastore database.
* app_sdk: 	The app_sdk for apps. MIT licensed. 
* app_gen: 	Code used when generating docker images. MIT licensed
* tests: 		A bunch of cronscripts. There are no real, good tests yet

## Development
Shuffle's backend is written in Go, with apps being python (for now). More about local development can be seen in the main README.

Running the backend:
```bash
cd go-app
go run main.go docker.go walkoff.go
```
