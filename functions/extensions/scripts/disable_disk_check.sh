curl -XPUT -u admin:admin https://localhost:9200/_cluster/settings -H "Content-Type:application/json" -k -d \
'{
	"transient": {
		"cluster.routing.allocation.disk.threshold_enabled": false
	}
}'

curl -XPUT -u admin:admin https://localhost:9200/_all/_settings -H "Content-Type: application/json" -k -d \
'{
	    "index.blocks.read_only_allow_delete": null
}'
