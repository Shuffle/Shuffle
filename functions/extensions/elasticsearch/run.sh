#docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e ELASTICSEARCH_USERNAME=frikky -e ELASTICSEARCH_PASSWORD=likeme -e xpack.security.enabled=true docker.elastic.co/elasticsearch/elasticsearch:7.12.1 
#docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.12.1 
#
#
#
#echo "\nWaiting for 1.5 minute, then adding data"
#sleep 90
#echo "\nSlept 90 seconds: ADDING DATA"
#curl -XPOST http://localhost:9200/_security/user/frikky -H "Content-Type: application/json" -d '{"enabled": true, "email": "frikky@shuffler.io"}'

#curl -XPOST -u frikky:likeme http://localhost:9200/samples/_doc -H "Content-Type: application/json" -d '{"src": "122.14.137.67", "dst": "103.35.191.16", "message": "alert", "md5": "CAEF973033E593C625FB2AA34F7026DC", "sha256": "DB1AEC5222075800EDA75D7205267569679B424E5C58A28102417F46D3B5790D", "hits": 0}'
#echo
#curl -XPOST -u frikky:likeme http://localhost:9200/samples/_doc -H "Content-Type: application/json" -d '{"src": "134.119.219.71", "dst": "103.35.191.41", "message": "alert", "md5": "9498FF82A64FF445398C8426ED63EA5B", "sha256": "8B2E701E91101955C73865589A4C72999AEABC11043F712E05FDB1C17C4AB19A", "hits": 0}'
#
#echo
#curl -XPOST -u frikky:likeme http://localhost:9200/samples2/_doc -H "Content-Type: application/json" -d '{"src": "122.14.137.67", "dst": "103.35.191.16", "message": "alert", "md5": "CAEF973033E593C625FB2AA34F7026DC", "sha256": "DB1AEC5222075800EDA75D7205267569679B424E5C58A28102417F46D3B5790D"}'
#echo
#curl -XPOST -u frikky:likeme http://localhost:9200/samples2/_doc -H "Content-Type: application/json" -d '{"src": "134.119.219.71", "dst": "103.35.191.41", "message": "alert", "md5": "9498FF82A64FF445398C8426ED63EA5B", "sha256": "8B2E701E91101955C73865589A4C72999AEABC11043F712E05FDB1C17C4AB19A"}'
#echo
