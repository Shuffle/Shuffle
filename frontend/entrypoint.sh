#!/bin/bash

# prepare variables
BACKEND_HOSTNAME=${BACKEND_HOSTNAME:-shuffle-backend}

# wait for backend readiness
while [ "$(curl -s http://$BACKEND_HOSTNAME:5001/api/v1/_ah/health)" != "OK" ]; do
    echo "Waiting for backend readiness..."
    sleep 5
done

# generate configs
/usr/local/bin/confd -backend="env" -confdir="/etc/confd" -onetime

# run main command
exec "$@"
