#!/bin/bash
NAME=shuffle-app_sdk
VERSION=0.8.61

docker rmi docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION --force
docker build . -t frikky/shuffle:app_sdk -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION

#docker push frikky/$NAME:$VERSION
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
#docker push ghcr.io/frikky/$NAME:$VERSION
#docker tag ghcr.io/frikky/$NAME:$VERSION frikky/shuffle:app_sdk

docker push frikky/shuffle:app_sdk
docker push ghcr.io/frikky/$NAME:$VERSION
