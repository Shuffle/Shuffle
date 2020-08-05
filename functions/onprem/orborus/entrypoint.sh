#!/bin/bash

# prepare variables
BASE_URL=${BASE_URL:-http://shuffle-backend:5001}

# wait for backend readiness
while [ "$(curl -s $BASE_URL/api/v1/_ah/health)" != "OK" ]; do
    echo "Waiting for backend readiness..."
    sleep 5
done

# run main command
exec "$@"
