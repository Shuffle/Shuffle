#!/bin/bash
NAME=app_sdk
VERSION=0.6.0

docker rmi docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION --force
docker build . -t frikky/shuffle:$NAME -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/app_sdk:0.6.0

#docker push frikky/shuffle:$NAME
#docker push frikky/$NAME:$VERSION
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
#docker push ghcr.io/frikky/$NAME:$VERSION

docker push ghcr.io/frikky/$NAME:$VERSION
