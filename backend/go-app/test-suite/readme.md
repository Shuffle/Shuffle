# Shuffle test suite

The suite has two layers. Direct integration tests exercise Shuffle's storage
and cache behavior against OpenSearch and Memcached without running the
backend. End-to-end tests send HTTP requests to an already-running backend.

Build tags keep both layers out of the normal unit-test command.

## Direct OpenSearch and Memcached integration tests

These tests initialize `shuffle-shared` with database caching enabled. They
cover Memcached set/update/delete behavior, statistics counter updates, the
workflow and execution storage lifecycle, and the interaction between the
workflow cache and OpenSearch. A backend process is not needed.

Set the same OpenSearch and Memcached connection variables used by the backend
and run:

```sh
SHUFFLE_OPENSEARCH_URL=https://localhost:9200 \
SHUFFLE_OPENSEARCH_USERNAME=admin \
SHUFFLE_OPENSEARCH_PASSWORD=<password> \
SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY=true \
SHUFFLE_MEMCACHED=localhost:11211 \
  go run -tags=integration ./test-suite -test.v
```

API-key authentication is also supported through
`SHUFFLE_OPENSEARCH_APIKEY`. `SHUFFLE_OPENSEARCH_URL` is required so the test
cannot silently connect to the connector's default hostname.

`SHUFFLE_MEMCACHED` must be present when `go test` starts because
`shuffle-shared` reads it during package initialization. The similarly named
`SHUFFLE_MEMCACHED_URL` variable is not used by `shuffle-shared`.

Test documents use the `shuffle_integration_test` index prefix by default. It
can be changed without affecting the backend's normal prefix:

```sh
SHUFFLE_TEST_OPENSEARCH_INDEX_PREFIX=my_shuffle_tests \
  go run -tags=integration ./test-suite -test.v
```

Every workflow, execution, environment, and cache entry uses unique IDs and is
deleted with `t.Cleanup`. OpenSearch may retain the empty test indexes after the
documents are removed.

The direct suite uses a normal runner instead of `go test` because
`shuffle-shared` versions through v1.2.77 reject Go test binaries during package
initialization and deliberately sleep before exiting. The runner still uses
Go's `testing` package for assertions, logs, and `t.Cleanup`.

## Backend HTTP end-to-end tests

Start OpenSearch and the backend, then run:

```sh
go run .
```

In another terminal:

```sh
go test -tags=e2e ./test-suite -v
```

The E2E suite targets `http://localhost:5001` by default. Override it with
`SHUFFLE_TEST_BASE_URL`. Health, anonymous-authentication, and CORS checks need
no user credentials. The authenticated workflow-list check also runs when
`SHUFFLE_TEST_API_KEY` is set.

Use only a development or dedicated test OpenSearch instance and test account.
