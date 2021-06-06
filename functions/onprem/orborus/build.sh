NAME=shuffle-orborus
VERSION=0.8.98

echo "Running docker build with $NAME:$VERSION"
#docker rmi frikky/shuffle:$NAME --force
docker build . -t frikky/shuffle:$NAME -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t frikky/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION -t ghcr.io/frikky/$NAME:nightly

#docker push frikky/$NAME:$VERSION
# docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
docker push frikky/shuffle:$NAME
docker push ghcr.io/frikky/$NAME:$VERSION
docker push ghcr.io/frikky/$NAME:nightly
