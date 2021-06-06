curl -XPUT http://localhost:9200/_cluster/settings -H "Content-Type:application/json" -d \
'{
	"transient": {
		"cluster.routing.allocation.disk.threshold_enabled": false
	}
}'

curl -XPUT http://localhost:9200/_all/_settings -H "Content-Type: application/json" -d \
'{
	    "index.blocks.read_only_allow_delete": null
}'
