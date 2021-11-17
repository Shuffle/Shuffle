module main

go 1.15

//replace github.com/shuffle/shuffle-shared => ../../../../git/shuffle-shared

//replace github.com/frikky/kin-openapi => ../../../../git/kin-openapi
//replace github.com/frikky/go-elasticsearch => ../../../../git/go-elasticsearch

require (
	cloud.google.com/go/datastore v1.6.0
	cloud.google.com/go/pubsub v1.17.0
	cloud.google.com/go/storage v1.18.1
	github.com/basgys/goxml2json v1.1.0
	github.com/carlescere/scheduler v0.0.0-20170109141437-ee74d2f83d82
	github.com/docker/docker v20.10.9+incompatible
	github.com/frikky/kin-openapi v0.40.0
	github.com/fsouza/go-dockerclient v1.7.4
	github.com/ghodss/yaml v1.0.0
	github.com/go-git/go-billy/v5 v5.3.1
	github.com/go-git/go-git/v5 v5.4.2
	github.com/gorilla/mux v1.8.0
	github.com/h2non/filetype v1.1.1
	github.com/satori/go.uuid v1.2.0
	github.com/shuffle/shuffle-shared v0.1.36
	github.com/skip2/go-qrcode v0.0.0-20200617195104-da1b6568686e // indirect
	go4.org v0.0.0-20201209231011-d4a079459e60 // indirect
	golang.org/x/crypto v0.0.0-20210921155107-089bfa567519
	google.golang.org/api v0.58.0
	google.golang.org/appengine v1.6.7
	google.golang.org/grpc v1.41.0
	gopkg.in/src-d/go-git.v4 v4.13.1
	gopkg.in/yaml.v3 v3.0.0-20210107192922-496545a6307b
)
