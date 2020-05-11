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
git clone https://github.com/frikky/shuffle
cd shuffle
docker-compose up -d
```

3. Useful info:
* The server is available on http://localhost:3001 (or your servername)
* Further configuration in docker-compose.yml and .env.
* Default database location is /etc/shuffle
