#!/bin/bash
NAME=app_sdk
VERSION=0.2.0

docker rmi docker.io/frikky/shuffle:$NAME --force
docker build . -t docker.io/frikky/shuffle:$NAME -t docker.io/frikky/$NAME:$VERSION

docker push docker.io/frikky/shuffle:$NAME
docker push docker.io/frikky/$NAME:$VERSION
