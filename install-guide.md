# Installation guide
Installation of Shuffle is currently only available in docker. Looking for how to update Shuffle? Check the [updating guide](https://shuffler.io/docs/configuration#updating_shuffle)

There are four parts to the infrastructure:
* Frontend - GUI, React
* Backend  - Go
* Database - Google Datastore
* Orborus  - Go, controls the workers to deploy. Can be used to connect to others' setup
* Worker 	 - Controls each workflow execution
* App_sdk  - Used

## Docker
The Docker setup is done with docker-compose and is a single command to get set up.

**PS: if you're setting up Shuffle on Windows, go to the next step (Windows Docker setup)**

1. Make sure you have Docker and [docker-compose](https://docs.docker.com/compose/install/) installed.

2. Run docker-compose.
```
git clone https://github.com/frikky/Shuffle
cd Shuffle
docker-compose up -d
```

When you're done, skip to the "After installation" step below.

## Windows Docker setup 
This step is for setting up with Docker on windows from scratch.

1. Make sure you have [Docker](https://docs.docker.com/docker-for-windows/install/) and [docker-compose](https://docs.docker.com/compose/install/) installed
2. Go to https://github.com/frikky/shuffle/releases and download the latest .zip release (or install git)
3. Unzip the folder and enter it
4. Open the .env file and change the line with "OUTER_HOSTNAME" to contain your IP:
```
OUTER_HOSTNAME=YOUR.IP.HERE
```
5. Run docker-compose
```
docker-compose up -d
```

### Configurations (proxies, default users etc.)
https://shuffler.io/docs/configuration

### After installation 
1. After installation, go to http://localhost:3001/adminsetup (or your servername)

2. Now set up your admin account (username & password). Shuffle doesn't have a default username and password.
3. Check out https://shuffler.io/docs/configuration as it has a lot of useful information to get started

![Admin account setup](https://github.com/frikky/Shuffle/blob/master/frontend/src/assets/img/shuffle_adminaccount.png)

### Useful info
* The server is available on http://localhost:3001 (or your servername)
* Further configurations can be done in docker-compose.yml and .env.
* Default database location is /etc/shuffle

### Execution problems
If you have problems with your first execution (hello world), you might need to set the correct Docker API version. Here's how:

1. Find your API version by running "docker version"
```
$ docker version

Client:
 Version:      17.09.1-ce
 API version:  1.32 # <-- this one
 Go version:   go1.8.3
 Git commit:   19e2cf6
 Built:        Thu Dec  7 22:24:16 2017
 OS/Arch:      linux/amd64

Server:
 Version:      17.09.1-ce
 API version:  1.32 (minimum version 1.12)
 Go version:   go1.8.3
 Git commit:   19e2cf6
 Built:        Thu Dec  7 22:22:56 2017
 OS/Arch:      linux/amd64
 Experimental: false
```

2. Open docker-compose.yml and change the line with "DOCKER_API_VERSION" to your version.
3. Restart docker-compose
```
docker-compose down
docker-compose up
```

Related issue: #47

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


