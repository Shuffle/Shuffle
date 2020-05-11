# Build script to make it work as an open source platform 

# 1. Grab builtin functions - Done in backend as a button click 
# 2. Upload to database & build docker images
# 3. Run docker-compose: frontend, backend, database & orborus
# 4. Set up docker swarm for apps?

# Basic overview of how it works:
# 
# Backend:			o
# 							|
# Orborus:			o
#  		 				 / \
# Workers: 		o   o
# 	 				 /   / \
# Apps: 		o   o   o

# 1. Grab builtin functions
# Where should I have these? Maybe OpenAPI github repo and just preload?

echo "Building frontend"
cd frontend
npm run build
rm -rf ../backend/go-app/build
cp -r build/ ../backend/go-app/build

echo "Setting up backend"
cd ../backend/go-app
go build
go test

#gcloud app deploy $GOPATH/src/github.com/frikky/shuffle/app.yaml
echo "This script is not finished. Please follow the docker installation guide here: https://github.com/frikky/shuffle/blob/master/install-guide.md"
