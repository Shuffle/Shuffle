#docker run \
#	--env DOCKER_API_VERSION=1.40 \
#	--env ENVIRONMENT_NAME="Shuffle" \
#	--env BASE_URL="http://192.168.86.45:5001" \
#	--env HTTP_PROXY="http://192.168.86.45:8082" \
#	--env HTTPS_PROXY="https://192.168.86.45:8082" \
#	--env SHUFFLE_PASS_WORKER_PROXY=true \
#	--env SHUFFLE_PASS_APP_PROXY=true \
#	-v /var/run/docker.sock:/var/run/docker.sock \
#	ghcr.io/frikky/shuffle-orborus:nightly

docker run \
	--env DOCKER_API_VERSION=1.40 \
	--env ENVIRONMENT_NAME="Another env" \
	--env ORG="2e7b6a08-b63b-4fc2-bd70-718091509db1" \
	--env AUTH="env auth" \
	--env BASE_URL="https://shuffler.io" \
	-v /var/run/docker.sock:/var/run/docker.sock \
	ghcr.io/frikky/shuffle-orborus:nightly
