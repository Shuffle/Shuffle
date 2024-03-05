#!/bin/sh

TAG="nightly"

if [ "$1" = "--latest" ]; then
	echo "Using latest tag for image!"
    TAG="latest"
fi

docker stop shuffle-frontend
docker rm shuffle-frontend

echo "Running build for website"
# sudo npm run build
docker build . -t ghcr.io/frikky/shuffle-frontend:$TAG
docker tag ghcr.io/frikky/shuffle-frontend:$TAG ghcr.io/shuffle/shuffle-frontend:$TAG

echo "Image built as ghcr.io/frikky/shuffle-frontend:$TAG!"

echo "Starting server"
# Rerun build locally for it to update :)
docker run -it \
  -p 3001:80 \
  -p 3002:443 \
  -v $(pwd)/build:/usr/share/nginx/html:ro \
  --rm \
  ghcr.io/frikky/shuffle-frontend:$TAG
