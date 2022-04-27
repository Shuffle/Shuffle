module worker

go 1.15
	
//replace github.com/shuffle/shuffle-shared => ../../../../../git/shuffle-shared

require (
	github.com/containerd/containerd v1.6.3 // indirect
	github.com/docker/docker v20.10.9+incompatible
	github.com/docker/go-connections v0.4.0 // indirect
	github.com/gorilla/mux v1.8.0
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/shuffle/shuffle-shared v0.2.27
	go4.org v0.0.0-20201209231011-d4a079459e60 // indirect
)
