NAME=worker
VERSION=0.1.0

echo "Running docker build with $NAME:$VERSION"
CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker.bin .
docker build . -t docker.io/frikky/shuffle:$NAME -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t docker.io/frikky/$NAME:$VERSION

# Push both for now..
docker push docker.io/frikky/$NAME:$VERSION
docker push docker.io/frikky/shuffle:$NAME
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
