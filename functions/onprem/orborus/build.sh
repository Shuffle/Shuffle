NAME=shuffle-orborus
VERSION=1.3.0

echo "Running docker build with $NAME:$VERSION"
#docker rmi frikky/shuffle:$NAME --force
docker build . -t frikky/shuffle:$NAME -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t frikky/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION -t ghcr.io/frikky/$NAME:nightly -t  ghcr.io/shuffle/$NAME:$VERSION -t ghcr.io/shuffle/$NAME:nightly

#docker push frikky/$NAME:$VERSION
# docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
docker push frikky/shuffle:$NAME
docker push ghcr.io/frikky/$NAME:$VERSION
docker push ghcr.io/frikky/$NAME:nightly

docker push shuffle/shuffle:$NAME
docker push ghcr.io/shuffle/$NAME:$VERSION
docker push ghcr.io/shuffle/$NAME:nightly
