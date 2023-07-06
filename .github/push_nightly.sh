# This can be done in the dockerpush workflow itself
# Done manually for now since GHCR isn't being pushed to easily with the current Github action CI. Nightly = Latest IF we run hotfixes on latest

### Pull latest from ghcr CI/CD
docker pull ghcr.io/shuffle/shuffle-app_sdk:nightly
docker pull ghcr.io/shuffle/shuffle-worker:nightly
docker pull ghcr.io/shuffle/shuffle-orborus:nightly
docker pull ghcr.io/shuffle/shuffle-frontend:nightly
#docker pull ghcr.io/shuffle/shuffle-backend:nightly
#
### NIGHTLY releases
docker tag ghcr.io/shuffle/shuffle-app_sdk:nightly ghcr.io/frikky/shuffle-app_sdk:nightly
docker tag ghcr.io/shuffle/shuffle-worker:nightly  ghcr.io/frikky/shuffle-worker:nightly
docker tag ghcr.io/shuffle/shuffle-orborus:nightly ghcr.io/frikky/shuffle-orborus:nightly
docker tag ghcr.io/shuffle/shuffle-frontend:nightly ghcr.io/frikky/shuffle-frontend:nightly
docker tag ghcr.io/shuffle/shuffle-backend:nightly ghcr.io/frikky/shuffle-backend:nightly

docker push ghcr.io/frikky/shuffle-app_sdk:nightly
docker push ghcr.io/frikky/shuffle-worker:nightly
docker push ghcr.io/frikky/shuffle-orborus:nightly
docker push ghcr.io/frikky/shuffle-frontend:nightly
docker push ghcr.io/frikky/shuffle-backend:nightly

### LATEST releases:
## shuffle/shuffle 
docker tag ghcr.io/shuffle/shuffle-app_sdk:nightly ghcr.io/shuffle/shuffle-app_sdk:latest
docker tag ghcr.io/shuffle/shuffle-worker:nightly  ghcr.io/shuffle/shuffle-worker:latest
docker tag ghcr.io/shuffle/shuffle-orborus:nightly ghcr.io/shuffle/shuffle-orborus:latest
docker tag ghcr.io/shuffle/shuffle-frontend:nightly ghcr.io/shuffle/shuffle-frontend:latest
docker tag ghcr.io/shuffle/shuffle-backend:nightly ghcr.io/shuffle/shuffle-backend:latest

docker push ghcr.io/shuffle/shuffle-app_sdk:latest
docker push ghcr.io/shuffle/shuffle-worker:latest
docker push ghcr.io/shuffle/shuffle-orborus:latest
docker push ghcr.io/shuffle/shuffle-frontend:latest
docker push ghcr.io/shuffle/shuffle-backend:latest

## frikky/shuffle
docker tag ghcr.io/shuffle/shuffle-app_sdk:nightly ghcr.io/frikky/shuffle-app_sdk:latest
docker tag ghcr.io/shuffle/shuffle-worker:nightly  ghcr.io/frikky/shuffle-worker:latest
docker tag ghcr.io/shuffle/shuffle-orborus:nightly ghcr.io/frikky/shuffle-orborus:latest
docker tag ghcr.io/shuffle/shuffle-frontend:nightly ghcr.io/frikky/shuffle-frontend:latest
docker tag ghcr.io/shuffle/shuffle-backend:nightly ghcr.io/frikky/shuffle-backend:latest

docker push ghcr.io/frikky/shuffle-app_sdk:latest
docker push ghcr.io/frikky/shuffle-worker:latest
docker push ghcr.io/frikky/shuffle-orborus:latest
docker push ghcr.io/frikky/shuffle-frontend:latest
docker push ghcr.io/frikky/shuffle-backend:latest


### 1.1.0 releases:
## shuffle/shuffle
docker tag ghcr.io/shuffle/shuffle-app_sdk:nightly ghcr.io/shuffle/shuffle-app_sdk:1.1.0
docker tag ghcr.io/shuffle/shuffle-worker:nightly  ghcr.io/shuffle/shuffle-worker:1.1.0
docker tag ghcr.io/shuffle/shuffle-orborus:nightly ghcr.io/shuffle/shuffle-orborus:1.1.0
docker tag ghcr.io/shuffle/shuffle-frontend:nightly ghcr.io/shuffle/shuffle-frontend:1.1.0
docker tag ghcr.io/shuffle/shuffle-backend:nightly ghcr.io/shuffle/shuffle-backend:1.1.0

docker push ghcr.io/shuffle/shuffle-app_sdk:1.1.0
docker push ghcr.io/shuffle/shuffle-worker:1.1.0
docker push ghcr.io/shuffle/shuffle-orborus:1.1.0
docker push ghcr.io/shuffle/shuffle-frontend:1.1.0
docker push ghcr.io/shuffle/shuffle-backend:1.1.0

## frikky/shuffle
docker tag ghcr.io/shuffle/shuffle-app_sdk:nightly 	ghcr.io/frikky/shuffle-app_sdk:1.1.0
docker tag ghcr.io/shuffle/shuffle-worker:nightly  	ghcr.io/frikky/shuffle-worker:1.1.0
docker tag ghcr.io/shuffle/shuffle-orborus:nightly 	ghcr.io/frikky/shuffle-orborus:1.1.0
docker tag ghcr.io/shuffle/shuffle-frontend:nightly ghcr.io/frikky/shuffle-frontend:1.1.0
docker tag ghcr.io/shuffle/shuffle-backend:nightly 	ghcr.io/frikky/shuffle-backend:1.1.0

docker push ghcr.io/frikky/shuffle-app_sdk:1.1.0
docker push ghcr.io/frikky/shuffle-worker:1.1.0
docker push ghcr.io/frikky/shuffle-orborus:1.1.0
docker push ghcr.io/frikky/shuffle-frontend:1.1.0
docker push ghcr.io/frikky/shuffle-backend:1.1.0

### Manage worker-scale upload (Requires auth)
# This is supposed to be unavailable, and only be downloadable by customers 
docker pull ghcr.io/shuffle/shuffle-worker-scale:latest
docker save ghcr.io/shuffle/shuffle-worker-scale:latest -o shuffle-worker.zip
echo "1. Upload shuffle-worker.zip to the shuffler.io public repo. If in Github Dev env, download the file, and upload manually."
echo "2. Have customers download it with: $ wget URL"
echo "3. Have customers use with with: docker load shuffle-worker.zip"

