set -a
source ../../.env
set +a

export SHUFFLE_OPENSEARCH_URL=https://100.104.105.63:9200
export SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY=true DEBUG=true
export SHUFFLE_MEMCACHED=100.104.105.63:11211

go run -tags=integration ./test-suite -test.v
