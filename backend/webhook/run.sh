docker stop webhook
docker rm webhook
docker rmi webhook

docker build . -t webhook
docker run -d \
	-e "HOOKPORT=5001" \
	-e "URIPATH=/webhook" \
	-e "CALLBACKURL=http://192.168.159.151:5000/api/v1/hooks/d6ef8912e8bd37776e654cbc14c2629c/result" \
	-p 5001:5001 \
	--name webhook \
	-h webhook \
	--restart always \
	webhook

docker logs -f webhook
