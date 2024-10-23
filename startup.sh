#!/bin/bash

# Update and install dependencies
apt-get update
apt-get install -y docker.io docker-compose curl git

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Clone Shuffle repository
git clone --branch 2.0.0 https://github.com/Shuffle/Shuffle.git
cd Shuffle

# Setup directories and permissions
mkdir shuffle-database && chmod -R 777 shuffle-database

# Start services
docker-compose up -d

# Wait for initial startup
echo "Waiting 30 seconds for initial startup..."
sleep 30

# Check for restarting containers
echo "Checking for restarting containers..."
ATTEMPTS=30
for i in $(seq 1 $ATTEMPTS); do
  RESTARTING_CONTAINERS=$(docker ps --filter "status=restarting" --format "{{.Names}}")
  if [ -n "$RESTARTING_CONTAINERS" ]; then
    echo "The following containers are restarting:"
    echo "$RESTARTING_CONTAINERS"
    exit 1
  fi
  echo "No containers are restarting. Attempt $i/$ATTEMPTS."
  sleep 1
done
echo "No containers were found in a restarting state after $ATTEMPTS checks."

# Check frontend response
echo "Checking frontend response..."
RESPONSE=$(curl -s http://localhost:3001)
if echo "$RESPONSE" | grep -q "Shuffle"; then
  echo "The word 'Shuffle' was found in the response."
else
  echo "The word 'Shuffle' was not found in the response."
  exit 1
fi

# Register user
echo "Attempting to register user..."
MAX_RETRIES=30
RETRY_INTERVAL=10
CONTAINER_NAME="shuffle-backend"

for (( i=1; i<=$MAX_RETRIES; i++ ))
do
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" 'http://localhost:3001/api/v1/register' \
    -H 'Accept: */*' \
    -H 'Accept-Language: en-US,en;q=0.9' \
    -H 'Connection: keep-alive' \
    -H 'Content-Type: application/json' \
    --data-raw '{"username":"demo@demo.io","password":"supercoolpassword"}')
    
  if [ "$STATUS_CODE" -eq 200 ]; then
    echo "User registration was successful with status code 200."
    exit 0
  elif [ "$STATUS_CODE" -ne 502 ]; then
    echo "User registration failed with status code $STATUS_CODE."
    exit 1
  fi
  
  echo "Received status code $STATUS_CODE. Retrying in $RETRY_INTERVAL seconds... ($i/$MAX_RETRIES)"
  echo "Fetching last 30 lines of logs from container $CONTAINER_NAME..."
  docker logs --tail 30 "$CONTAINER_NAME"
  echo "Fetching last 30 lines of logs from container shuffle-opensearch..."
  docker logs --tail 30 shuffle-opensearch
  
  sleep $RETRY_INTERVAL
done

echo "User registration failed after $MAX_RETRIES attempts."
exit 1