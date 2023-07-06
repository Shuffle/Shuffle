module shuffle

go 1.13

replace github.com/shuffle/shuffle-shared => ../../../../git/shuffle-shared

//replace github.com/frikky/kin-openapi => ../../../../git/kin-openapi

require (
	cloud.google.com/go/datastore v1.4.0
	cloud.google.com/go/pubsub v1.3.1
	cloud.google.com/go/storage v1.12.0
	github.com/basgys/goxml2json v1.1.0
	github.com/bitly/go-simplejson v0.5.1 // indirect
	github.com/carlescere/scheduler v0.0.0-20170109141437-ee74d2f83d82
	github.com/docker/distribution v2.7.1+incompatible // indirect
	github.com/docker/docker v20.10.3-0.20210216175712-646072ed6524+incompatible
	github.com/frikky/kin-openapi v0.41.0
	github.com/fsouza/go-dockerclient v1.7.2
	github.com/ghodss/yaml v1.0.0
	github.com/go-git/go-billy/v5 v5.0.0
	github.com/go-git/go-git/v5 v5.0.0
	github.com/gorilla/mux v1.8.0
	github.com/h2non/filetype v1.0.12
	github.com/opensearch-project/opensearch-go v1.1.0 // indirect
	github.com/opensearch-project/opensearch-go/v2 v2.3.0 // indirect
	github.com/satori/go.uuid v1.2.0
	github.com/shuffle/shuffle-shared v0.1.15
	golang.org/x/crypto v0.0.0-20210921155107-089bfa567519
	google.golang.org/api v0.36.0
	google.golang.org/appengine v1.6.7
	google.golang.org/grpc v1.34.1
	gopkg.in/src-d/go-git.v4 v4.13.1
	gopkg.in/yaml.v3 v3.0.1
)
