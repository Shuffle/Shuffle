docker run \
	--env ORG_ID=$ORG_ID \
	--env BASE_URL=$BASE_URL \
	-v /var/run/docker.sock:/var/run/docker.sock \
	frikky/shuffle:orborus
