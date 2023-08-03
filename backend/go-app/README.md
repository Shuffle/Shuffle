# Run
go run main.go walkoff.go docker.go

## Modify
- Make sure it's connected with the latest version of the shuffle-shared library, which is used to get resources from Shuffle

## Database
- The database is Opensearch and can be modified with the SHUFFLE_OPENSEARCH_URL environment variable. See .env in the root directory for more. This requires Opensearch to be running (typically started from docker-compose.yml)
```
docker-compose up -d
docker stop shuffle-backend
docker stop shuffle-frontend
docker stop shuffle-orborus
```

## Caching
- To handle caching, it by default runs it in memory of the application itself. If you want to offload this, it can be done using the SHUFFLE_MEMCACHED environment variable, connecting to a memcached instance. 
```
docker run --name shuffle-cache -p 11211:11211 -d memcached -m 1024
```
