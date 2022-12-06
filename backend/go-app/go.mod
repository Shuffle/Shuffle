module shuffle

go 1.16

//replace github.com/shuffle/shuffle-shared => ../../../shuffle-shared

require (
	cloud.google.com/go/datastore v1.10.0
	cloud.google.com/go/pubsub v1.28.0
	cloud.google.com/go/storage v1.28.1
	github.com/basgys/goxml2json v1.1.0
	github.com/carlescere/scheduler v0.0.0-20170109141437-ee74d2f83d82
	github.com/docker/docker v20.10.21+incompatible
	github.com/frikky/kin-openapi v0.42.0
	github.com/fsouza/go-dockerclient v1.9.0
	github.com/ghodss/yaml v1.0.0
	github.com/go-git/go-billy/v5 v5.3.1
	github.com/go-git/go-git/v5 v5.5.0
	github.com/gorilla/mux v1.8.0
	github.com/h2non/filetype v1.1.3
	github.com/satori/go.uuid v1.2.0
	github.com/shuffle/shuffle-shared v0.3.34
	golang.org/x/crypto v0.3.0
	google.golang.org/api v0.103.0
	google.golang.org/appengine v1.6.7
	google.golang.org/grpc v1.51.0
	gopkg.in/src-d/go-git.v4 v4.13.1
	gopkg.in/yaml.v3 v3.0.1
)
