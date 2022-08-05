# This can be done in the dockerpush workflow itself
# Done manually for now since GHCR isn't being pushed to easily with the current Github action CI. Nightly = Latest IF we run hotfixes on latest

docker pull frikky/shuffle-backend:nightly
docker pull frikky/shuffle-frontend:nightly

docker tag frikky/shuffle-backend:nightly ghcr.io/frikky/shuffle-backend:latest
docker tag frikky/shuffle-frontend:nightly ghcr.io/frikky/shuffle-frontend:latest

docker push ghcr.io/frikky/shuffle-backend:nightly
docker push ghcr.io/frikky/shuffle-frontend:nightly

docker push ghcr.io/frikky/shuffle-backend:latest
docker push ghcr.io/frikky/shuffle-frontend:latest
