#!/bin/bash
NAME=app_sdk
VERSION=0.7.3

docker rmi docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION --force
docker build . -t frikky/shuffle:$NAME -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION

#docker push frikky/$NAME:$VERSION
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
#docker push ghcr.io/frikky/$NAME:$VERSION

docker push frikky/shuffle:$NAME
docker push ghcr.io/frikky/$NAME:$VERSION
