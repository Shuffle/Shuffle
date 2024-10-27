#!/bin/bash

# Find 'shuffle-opensearch' docker ip
ip_address=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' shuffle-opensearch)
# validate if ip was found
if [ -z "$ip_address" ]; then
    echo "Error: Unable to obtain the IP of the container 'shuffle-opensearch'"
    exit 1
fi
export SHUFFLE_OPENSEARCH_URL="https://${ip_address}:9200"
export SHUFFLE_ELASTIC=true
export SHUFFLE_OPENSEARCH_USERNAME=admin
# Since the latest updates to OpenSearch, the password complexity directive has been activated, and this value has not yet been changed to the current .env default.
export SHUFFLE_OPENSEARCH_PASSWORD="StrongShufflePassword321!"
export SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY=true
# Variables needed to test the changes
export SHUFFLE_APP_HOTLOAD_FOLDER=/opt/Shuffle/shuffle-apps
export SHUFFLE_APP_HOTLOAD_LOCATION=/opt/Shuffle/shuffle-apps
#cd backend/go-app
go run main.go walkoff.go docker.go