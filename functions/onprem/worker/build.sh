NAME=shuffle-worker
VERSION=0.8.3

echo "Running docker build with $NAME:$VERSION"
#CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker.bin .
docker build . -t frikky/shuffle:$NAME -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION

# Push both for now..
#docker push frikky/$NAME:$VERSION 
docker push frikky/shuffle:$NAME
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
docker push ghcr.io/frikky/$NAME:$VERSION
