<h1 align="center">

[![Shuffle Logo](https://github.com/Shuffle/Shuffle/blob/main/frontend/public/images/Shuffle_logo_new.png)](https://shuffler.io)

Shuffle Installation

</h1>

Installation of Shuffle is currently available for [docker](https://shuffler.io/docs/configuration#production-readiness) and [kubernetes](https://shuffler.io/docs/configuration#Kubernetes). 

- Looking to run workflows onprem, but don't want to run the entire stack? Looks into [Environments & Orborus hosting Onprem](https://shuffler.io/docs/organizations#Environments)
- Looking for how to update Shuffle? Check the [updating guide](https://shuffler.io/docs/configuration#updating_shuffle)

This document outlines an introduction environment which is **not** scalable. [Read here](https://shuffler.io/docs/configuration#production_readiness) for information on production readiness and scalability. This also includes system requirements and configurations for **Docker Swarm** or **Kubernetes**. 

# Docker - *nix
The Docker setup is the default setup, and is ran with docker compose. This is [NOT a scalable build](https://shuffler.io/docs/configuration#production-readiness) without changes.

**PS: if you're setting up Shuffle on Windows, go to the next step (Windows Docker setup)**

1. Make sure you have [Docker](https://docs.docker.com/get-docker/) installed, and that you have a minimum of **2Gb of RAM** available.
2. Download Shuffle
```bash
git clone https://github.com/Shuffle/Shuffle
cd Shuffle
```

3. Fix prerequisites for the Opensearch database (Elasticsearch): 
```bash
mkdir shuffle-database                    # Create a database folder
sudo chown -R 1000:1000 shuffle-database  # IF you get an error using 'chown', add the user first with 'sudo useradd opensearch'

sudo swapoff -a                           # Disable swap
```

4. Run docker-compose.
```bash
docker compose up -d
```

5. Recommended for Opensearch to work well
```bash
sudo sysctl -w vm.max_map_count=262144             # https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html
```

When you're done, go to the [After installation](#after-installation) step below.

## Windows with WSL  
This step is for setting up with Docker on windows from scratch.

1. Make sure you have [Docker](https://docs.docker.com/docker-for-windows/install/) and [docker-compose](https://docs.docker.com/compose/install/) installed. WSL2 may be required.

2. Go to https://github.com/frikky/shuffle/releases and download the latest .zip release (or install git)

3. Unzip the folder and enter it

4. Open the .env file and change the line with "OUTER_HOSTNAME" to contain your IP:

```bash
OUTER_HOSTNAME=YOUR.IP.HERE
```

5. Run docker compose
```bash
docker compose up -d
```

### Configurations (high availability, scale, proxies, default users etc.)
https://shuffler.io/docs/configuration

![architecture](https://github.com/frikky/Shuffle/raw/main/frontend/src/assets/img/shuffle_architecture.png)

### After installation 
1. After installation, go to http://localhost:3001 (or your servername - https is on port 3443)
2. Now set up your admin account (username & password). Shuffle doesn't have a default username and password. 
3. Sign in with the same Username & Password! Go to /apps and see if you have any apps yet. If not - you may need to [configure proxies](https://shuffler.io/docs/configuration#production_readiness)
4. Check out https://shuffler.io/docs/configuration as it has a lot of useful information to get started

![Admin account setup](https://github.com/Shuffle/Shuffle/blob/main/frontend/src/assets/img/shuffle_adminaccount.png?raw=true)

### Useful info
* Check out [getting started](https://shuffler.io/docs/getting_started)
* The default state of Shuffle is NOT scalable. See [production setup](https://shuffler.io/docs/configuration#production_readiness) for more info
* The server is available on http://localhost:3001 (or your servername)
* Further configurations can be done in docker-compose.yml and .env.
* Default database location is in the same folder: ./shuffle-database

# Local development installation

Local development is pretty straight forward with **ReactJS** and **Golang**. This part is intended to help you run the code for development purposes. We recommend having Shuffle running with the Docker-compose, then manually running the portion that you want to test and/or edit.

**PS: You have to stop the Backend Docker container to get this one working**

**PPS: Use the "main" branch when developing to get it set up easier**

## Frontend - ReactJS /w cytoscape
http://localhost:3000 - Requires [npm](https://nodejs.org/en/download/)/[yarn](https://yarnpkg.com/lang/en/docs/install/#debian-stable)/your preferred manager. Runs independently from backend.
```bash
cd frontend
yarn install
yarn start
```

## Backend - Golang
http://localhost:5001 - REST API - requires [>=go1.13](https://golang.org/dl/)
```bash
export SHUFFLE_OPENSEARCH_URL="https://localhost:9200"
export SHUFFLE_ELASTIC=true
export SHUFFLE_OPENSEARCH_USERNAME=admin
export SHUFFLE_OPENSEARCH_PASSWORD=admin
export SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY=true
cd backend/go-app
go run main.go walkoff.go docker.go
```
**WINDOWS USERS:** Follow [this guide](https://www.wikihow.com/Create-an-Environment-Variable-in-Windows-10) to add environment variables in your machine.

Large portions of the backend is written in another repository - [shuffle-shared](https://github.com/frikky/shuffle-shared). If you want to update any of this code and test in realtime, we recommend following these steps:
1. Clone shuffle-shared to a local repository
2. Open the Shuffle backend's go.mod file (./shuffle/backend/go.mod)  (**NOT** in shuffle-shared)
3. Change the following line to point to your directory AFTER the =>
```
//replace github.com/frikky/shuffle-shared => ../../shuffle-shared
```
4. Make the changes you want, then restart the backend server!
5. With your changes made, make a pull request :fire:

## Database - Opensearch 
Make sure this is running through the docker-compose, and that the backend points to it with SHUFFLE_OPENSEARCH_URL defined.

What it means:
1. Make sure you have docker compose installed
2. Make sure you have the docker-compose.yml file from this repository
3. Run `docker-compose up opensearch -d`

## Orborus
Execution of Workflows:
PS: This requires some specific environment variables
```
cd functions/onprem/orborus
go run orborus.go
```

Environments (modify for Windows):
```
export ORG_ID=Shuffle
export ENVIRONMENT_NAME=Shuffle
export BASE_URL=http://YOUR-IP:5001
export DOCKER_API_VERSION=1.40
```

AND THAT's it - hopefully it worked. If it didn't please email [frikky@shuffler.io](mailto:frikky@shuffler.io)
