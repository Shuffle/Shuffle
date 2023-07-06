docker run \
	--env ORG_ID=$ORG_ID \
	--env ENVIRONMENT_NAME="Shuffle" \
	--env BASE_URL=http://shuffle-backend:5001 \
	--env DOCKER_API_VERSION=1.42 \
	--env RUNNING_MODE="Docker" \
	--network "shuffle_shuffle" \
	-v /var/run/docker.sock:/var/run/docker.sock \
	frikky/shuffle:orborus
