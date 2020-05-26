#!/bin/sh
docker stop shuffle-frontend
docker rm shuffle-frontend
docker rmi frikky/shuffle:frontend

echo "Running build for website"
#sudo npm run build
docker build . -t frikky/shuffle:frontend

echo "Starting server"
# Rerun build locally for it to update :)
#docker run -it \
#	-p 3001:80 \
#	-p 3002:443 \
#	-v $(pwd)/build:/usr/share/nginx/html:ro \
#	--rm \
#	nginx	
