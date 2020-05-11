# Deploys to backend
echo "Deploying to appengine."
mkdir -p $GOPATH/src/github.com/frikky/shuffle
cp -r go-app/* $GOPATH/src/github.com/frikky/shuffle
cd $GOPATH/src/github.com/frikky/shuffle
go build
go test
gcloud app deploy $GOPATH/src/github.com/frikky/shuffle/app.yaml
