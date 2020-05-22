docker run \
	--env ORG_ID=$ORG_ID \
	--env ENVIRONMENT_NAME="Shuffle" \
	--env BASE_URL=http://shuffle-backend:5001 \
	--network "shuffle_shuffle" \
	-v /var/run/docker.sock:/var/run/docker.sock \
	frikky/shuffle:orborus
