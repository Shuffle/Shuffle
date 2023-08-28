#!/bin/sh
docker stop shuffle-backend
docker rm shuffle-backend
docker rmi ghcr.io/shuffle/shuffle-backend:nightly

docker build . -t ghcr.io/shuffle/shuffle-backend:nightly
docker push ghcr.io/shuffle/shuffle-backend:nightly

echo "Starting server"
#docker run -it \
#	-p 5001:5001 \
#	-v /var/run/docker.sock:/var/run/docker.sock \
#	--env DATASTORE_EMULATOR_HOST=192.168.3.6:8000 \
#	frikky/shuffle:backend	
