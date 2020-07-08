docker run \
	--env ORG_ID=$ORG_ID \
	--env ENVIRONMENT_NAME="Shuffle" \
	--env BASE_URL=http://shuffle-backend:5001 \
	--env DOCKER_API_VERSION=1.42 \
	--network "shuffle_shuffle" \
	-v /var/run/docker.sock:/var/run/docker.sock \
	docker.io/frikky/shuffle:orborus
