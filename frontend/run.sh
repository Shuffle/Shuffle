#!/bin/sh
docker stop shuffle-frontend
docker rm shuffle-frontend
#docker rmi ghcr.io/frikky/shuffle-frontend:nightly

echo "Running build for website"
#sudo npm run build
docker build . -t ghcr.io/frikky/shuffle-frontend:nightly
docker tag ghcr.io/frikky/shuffle-frontend:nightly ghcr.io/shuffle/shuffle-frontend:nightly

echo "Starting server"
# Rerun build locally for it to update :)
docker run -it \
	-p 3001:80 \
	-p 3002:443 \
	-v $(pwd)/build:/usr/share/nginx/html:ro \
	--rm \
	ghcr.io/frikky/shuffle-frontend:nightly
