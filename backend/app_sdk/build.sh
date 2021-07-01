#!/bin/bash


### DEFAULT 
NAME=shuffle-app_sdk
VERSION=0.8.104

docker rmi docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION --force
docker build . -f Dockerfile -t frikky/shuffle:app_sdk -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION

#docker push frikky/$NAME:$VERSION
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
#docker push ghcr.io/frikky/$NAME:$VERSION
#docker tag ghcr.io/frikky/$NAME:$VERSION frikky/shuffle:app_sdk

docker push frikky/shuffle:app_sdk
docker push ghcr.io/frikky/$NAME:$VERSION
docker push ghcr.io/frikky/$NAME:nightly

#### BLACKARCH ###
NAME=shuffle-app_sdk_kali
docker build . -f Dockerfile_kali -t frikky/shuffle:app_sdk_kali -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION

docker push frikky/shuffle:app_sdk_kali
docker push ghcr.io/frikky/$NAME:$VERSION
docker push ghcr.io/frikky/$NAME:nightly

### BLACKARCH ###
NAME=shuffle-app_sdk_blackarch
docker build . -f Dockerfile_blackarch -t frikky/shuffle:app_sdk_blackarch -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION

docker push frikky/shuffle:app_sdk_blackarch
docker push ghcr.io/frikky/$NAME:$VERSION
docker push ghcr.io/frikky/$NAME:nightly

