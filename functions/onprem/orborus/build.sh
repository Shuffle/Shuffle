NAME=orborus
VERSION=0.1.0

echo "Running docker build with $NAME:$VERSION"
#docker rmi docker.io/frikky/shuffle:$NAME --force
docker build . -t docker.io/frikky/shuffle:$NAME -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t docker.io/frikky/$NAME:$VERSION

docker push docker.io/frikky/$NAME:$VERSION
docker push docker.io/frikky/shuffle:$NAME
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
