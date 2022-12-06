#!/bin/bash

### DEFAULT 
NAME=shuffle-app_sdk
VERSION=1.1.0

docker rmi docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION --force
docker build . -f Dockerfile -t frikky/shuffle:app_sdk -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION -t ghcr.io/frikky/$NAME:nightly -t shuffle/shuffle:app_sdk -t shuffle/$NAME:$VERSION -t docker.pkg.github.com/shuffle/shuffle/$NAME:$VERSION -t ghcr.io/shuffle/$NAME:$VERSION -t ghcr.io/shuffle/$NAME:nightly

docker push frikky/shuffle:app_sdk
docker push ghcr.io/frikky/$NAME:$VERSION
docker push ghcr.io/frikky/$NAME:nightly
docker push ghcr.io/frikky/$NAME:latest

docker push shuffle/shuffle:app_sdk
docker push ghcr.io/shuffle/$NAME:$VERSION
docker push ghcr.io/shuffle/$NAME:nightly
docker push ghcr.io/shuffle/$NAME:latest




#### UBUNTU
NAME=shuffle-app_sdk_ubuntu
docker build . -f Dockerfile_ubuntu -t frikky/shuffle:app_sdk_ubuntu -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION
docker push frikky/shuffle:app_sdk_ubuntu
docker push ghcr.io/frikky/$NAME:$VERSION

#### Alpine GRPC 
NAME=shuffle-app_sdk_grpc
docker build . -f Dockerfile_alpine_grpc -t frikky/shuffle:app_sdk_grpc -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION
docker push frikky/shuffle:app_sdk_grpc
docker push ghcr.io/frikky/$NAME:$VERSION



#### KALI ###
#NAME=shuffle-app_sdk_kali
#docker build . -f Dockerfile_kali -t frikky/shuffle:app_sdk_kali -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION
#
#docker push frikky/shuffle:app_sdk_kali
#docker push ghcr.io/frikky/$NAME:$VERSION
#docker push ghcr.io/frikky/$NAME:nightly

### BLACKARCH ###
#NAME=shuffle-app_sdk_blackarch
#docker build . -f Dockerfile_blackarch -t frikky/shuffle:app_sdk_blackarch -t frikky/$NAME:$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION
#
#docker push frikky/shuffle:app_sdk_blackarch
#docker push ghcr.io/frikky/$NAME:$VERSION
#docker push ghcr.io/frikky/$NAME:nightly
