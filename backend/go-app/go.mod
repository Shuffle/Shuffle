module shuffle

go 1.13

replace github.com/frikky/shuffle-shared => ../../../../git/shuffle-shared
//replace github.com/frikky/kin-openapi => ../../../../git/kin-openapi

require (
	cloud.google.com/go v0.75.0
	cloud.google.com/go/datastore v1.4.0
	cloud.google.com/go/pubsub v1.3.1
	cloud.google.com/go/storage v1.12.0
	github.com/Microsoft/go-winio v0.4.14 // indirect
	github.com/basgys/goxml2json v1.1.0
	github.com/frikky/kin-openapi v0.38.0
	github.com/carlescere/scheduler v0.0.0-20170109141437-ee74d2f83d82
	github.com/docker/distribution v2.7.1+incompatible // indirect
	github.com/docker/docker v1.13.1
	github.com/docker/go-connections v0.4.0
	github.com/docker/go-units v0.4.0 // indirect
	github.com/frikky/shuffle-shared v0.0.23
	github.com/ghodss/yaml v1.0.0
	github.com/go-git/go-billy/v5 v5.0.0
	github.com/go-git/go-git/v5 v5.0.0
	github.com/google/go-github/v28 v28.1.1
	github.com/gorilla/handlers v1.4.2 // indirect
	github.com/gorilla/mux v1.8.0
	github.com/h2non/filetype v1.0.12
	github.com/opencontainers/go-digest v1.0.0-rc1 // indirect
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/satori/go.uuid v1.2.0
	golang.org/x/crypto v0.0.0-20200622213623-75b288015ac9
	golang.org/x/oauth2 v0.0.0-20210113160501-8b1d76fa0423
	google.golang.org/api v0.36.0
	google.golang.org/appengine v1.6.7
	google.golang.org/genproto v0.0.0-20210113195801-ae06605f4595
	google.golang.org/grpc v1.34.1
	gopkg.in/src-d/go-git.v4 v4.13.1
	gopkg.in/yaml.v2 v2.4.0
	gopkg.in/yaml.v3 v3.0.0-20210107192922-496545a6307b
)
