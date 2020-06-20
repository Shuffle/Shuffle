#!/bin/bash
NAME=app_sdk
VERSION=0.2.0

docker rmi frikky/shuffle:$NAME --force
docker build . -t frikky/shuffle:$NAME -t frikky/$NAME:$VERSION

docker push frikky/shuffle:$NAME
docker push frikky/$NAME:$VERSION
