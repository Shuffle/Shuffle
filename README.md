# Shuffle 
[Shuffle](https://shuffler.io) is an automation platform for your security stack (SOAR). It uses Docker for scaling and OpenAPI for integrations. Shuffle has the possibility to run across multiple isolated environments and tracks progress for you.

**It's in BETA**, but if you want to implement Shuffle - [get in touch](https://shuffler.io/contact), send a mail to [frikky@shuffler.io](mailto:frikky@shuffler.io) or on twitter [@frikkylikeme](https://twitter.com/frikkylikeme)

![Example Shuffle webhook integration](shuffle_webhook.png)

## Try it
* Self-hosted: Check out the [installation guide](https://github.com/frikky/shuffle/blob/master/install-guide.md). 
* Cloud: Register at https://shuffler.io/register and get cooking (there are some differences!)

## Related repositories
* Apps: https://github.com/frikky/shuffle-apps
* Workflows: https://github.com/frikky/shuffle-workflows (empty)
* Documentation: https://github.com/frikky/shuffle-docs
* OpenAPI apps: https://github.com/frikky/OpenAPI-security-definitions

## Documentation
Documentation can be found on https://shuffler.io/docs/about or in your own instance. Currently lacking: 
* API documentation 
* Updates after migrating from SaaS to open source

## Features
* Premade workflows for TheHive and MISP
* Premade apps for a number of security tools
* Simple workflow editor 
* App creator for [OpenAPI](https://github.com/frikky/OpenAPI-security-definitions)
* Easy to learn Python library for custom apps

## In the works
* Dashboard - Statistics are implemented
* Debug view for manual executions
* App versioning


### Setup - Local development 
Frontend - requires [npm](https://nodejs.org/en/download/)/[yarn](https://yarnpkg.com/lang/en/docs/install/#debian-stable)/your preferred manager. Runs independently from backend - edit frontend/src/App.yaml (line 46~) from window.location.origin to http://YOUR IP:5001
```bash
cd frontend
npm i
npm start
```

Backend - API calls - requires [>=go1.13](https://golang.org/dl/) and [gcloud](https://cloud.google.com/sdk/install) 
```bash
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


### Project overview
Below is the folder structure with a short explanation
```bash
├── README.md				# :)
├── backend					# Contains directly backend related code. Go with sh tests
├── frontend				# Contains frontend code. ReactJS and cytoscape. Horrible code :)
├── app_gen					# Contains code generation projects for OpenAPI or PythonLib -> Shuffler app 
├── functions				# Contains google cloud function code mainly.
│   ├── static_baseline.py	# Static code used by stitcher.go to generate code
│   ├── stitcher.go		# Attempts to stitch together an app - part of backend now
│   ├── onprem				# Code for onprem solutions
│   │   ├── Orborus 	# Distributes execution locations
│   │   ├── Worker		# Runs a workflow
│   │   └── App_SDK		# Backend of individual apps
│   └── triggers 			# Custom triggers used in https://shuffler.io/workflows
└ docker-compose.yml 	# Used for deployments
```

# Technology
GCP was chosen because why not use the best thingies. "Serverless" \o/
```bash
├── languages 
│   ├── Go 						# I like go, which is why go.
│   ├── Python3.7 		# 3.7 specifically because of f-strings and 2.7 deprecation in 2020
│   ├── Javascript 		# Frontend stuff. Uses ReactJS + Cytoscape for visualization
│   ├── sh/Bash				# Basic testing and some deployments
├── gcloud					
│   ├── datastore 		# TODO: Move away from this
├── onprem					
│   ├── Docker				# Runs the same cloud functions. I didn't like the thought of proxies
```

# Migration
Shuffle was initially built for cloud and SaaS, and a lot broke when it was moved to local execution. 
There will be a major overhaul to the backend specifically. I'm currently moving and updating the following:
- Create dockerfiles and a single runscript
- * App creator - (Cloud function -> Docker)
- * Workflows 	- Run workflows locally
- * App list 		- IMPORT EXISTING APPS 
- * Dockerfiles - Load the ones that are in workflows with a new version 
- * Docker-compose- Frontend, backend, db & orborus 
- * Configuration - Write setup documentation - Did for docker
- * Remove orborus? Can deploy straight, but that would be weird - Won't do this yet
- * Full OpenAPI support with authentication schemes in App creator (not Oauth2 yet)
- * Change workflow name
- * User run statistics 
- Extended result data usage, build json with answers, not just "from previous action"
- Workflows 		- IMPORT DEFAULT WORKFLOWS - Create some towards e.g. TheHive & MISP.
- Documentation - General documentation /docs rewrite
- API doc				- 1. In Shuffle. 2. In e.g. python
- Fix scheduler
- Use variables in e.g. JSON body
- Add random secret to orborus 

```
# 1. export DATASTORE_EMULATOR_HOST=0.0.0.0:8000
# 2. docker run -p 8000:8000 google/cloud-sdk gcloud beta emulators datastore start --project=shuffle --host-port 0.0.0.0:8000 --no-store-on-disk
```
* Mail: Use appengine and connect to sendmail

# Update for users:
* Build from scratch (docker-compose)
* Push stable builds to Dockerhub 

### Migration issues:
* Some workflows where items have multiple parents don't work.
* Fix dummy.json (GCP config) - bypass this somehow.
