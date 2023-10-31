NAME=shuffle-worker
VERSION=1.3.0

echo "Running docker build with $NAME:$VERSION"
#CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker.bin .
docker build . -t frikky/shuffle:$NAME -t frikky/shuffle:$NAME_$VERSION -t docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION -t ghcr.io/frikky/$NAME:$VERSION -t ghcr.io/frikky/$NAME:nightly -t ghcr.io/shuffle/$NAME:$VERSION -t ghcr.io/shuffle/$NAME:nightly

# Push both for now..
#docker push frikky/$NAME:$VERSION 
#docker push frikky/shuffle:$NAME_$VERSION
#docker push docker.pkg.github.com/frikky/shuffle/$NAME:$VERSION
#docker tag frikky/shuffle:0.8.51 ghcr.io/frikky/shuffle-worker:0.8.5
#docker tag frikky/shuffle:$NAME ghcr.io/frikky/shuffle-worker:0.8.52
#docker push frikky/shuffle:$NAME
#docker push ghcr.io/frikky/$NAME:$VERSION
#docker push ghcr.io/frikky/$NAME:nightly
#
#docker push shuffle/shuffle:$NAME
#docker push ghcr.io/shuffle/$NAME:$VERSION
#docker push ghcr.io/shuffle/$NAME:nightly
