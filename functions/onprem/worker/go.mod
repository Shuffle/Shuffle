module worker

go 1.15

//replace github.com/shuffle/shuffle-shared => ../../../../../git/shuffle-shared

require (
	cloud.google.com/go/datastore v1.4.0
	cloud.google.com/go/storage v1.12.0
	github.com/containerd/containerd v1.6.12 // indirect
	github.com/docker/docker v20.10.9+incompatible
	github.com/gorilla/mux v1.8.0
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/satori/go.uuid v1.2.0
	github.com/shuffle/shuffle-shared v0.3.24
)
