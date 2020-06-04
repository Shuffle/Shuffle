# Installation guide
Installation of Shuffle is currently only available in docker. 

There are four parts to the infrastructure:
* Frontend - GUI, React
* Backend  - Go
* Database - Google Datastore
* Orborus  - Go, controls the workers to deploy. Can be used to connect to others' setup
* Worker 	 - Controls each workflow execution
* App_sdk  - Used

## Docker
The Docker setup is done with docker-compose and is a single command to get set up.

1. Make sure you have Docker and [docker-compose](https://docs.docker.com/compose/install/) installed.

2. Run docker-compose.
```
git clone https://github.com/frikky/Shuffle
cd Shuffle
docker-compose up -d
```

### After installation 
1. After installation, go to http://localhost:3001/adminsetup (or your servername)

2. Now set up your admin account (username & password). Shuffle doesn't have a default username and password.

![Admin account setup](shuffle_adminaccount.png)

### Useful info
* The server is available on http://localhost:3001 (or your servername)
* Further configurations can be done in docker-compose.yml and .env.
* Default database location is /etc/shuffle



## Local development installation 
Frontend - requires [npm](https://nodejs.org/en/download/)/[yarn](https://yarnpkg.com/lang/en/docs/install/#debian-stable)/your preferred manager. Runs independently from backend - edit frontend/src/App.yaml (line 44~) from window.location.origin to http://YOUR IP:5001
```bash
cd frontend
npm i
npm start
```

Backend - API calls - requires [>=go1.13](https://golang.org/dl/) 
```bash
export DATASTORE_EMULATOR_HOST=0.0.0.0:8000
cd backend/go-app
go build
go run *.go
```

Database - Datastore:
```
docker run -p 8000:8000 google/cloud-sdk gcloud beta emulators datastore start --project=shuffle --host-port 0.0.0.0:8000 --no-store-on-disk
```

Orborus - Execution of Workflows:
PS: This requires some specific environment variables.
```
cd functions/onprem/orborus
go run orborus.go
```


