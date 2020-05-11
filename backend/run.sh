#!/bin/sh
# docker stop nginx
# docker rm nginx
# docker rmi nginx
# 
# echo "Running build for website"
# sudo npm run build
# docker build . -t nginx

echo "Starting server"
docker run -it \
	-p 5001:5001 \
	-v /var/run/docker.sock:/var/run/docker.sock \
	--env DATASTORE_EMULATOR_HOST=192.168.3.6:8000 \
	frikky/shuffle:backend	
