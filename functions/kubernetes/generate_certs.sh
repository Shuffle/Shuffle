#!/bin/bash

read -p "Are you using Minikube? (yes/no): " is_minikube

default_ip=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}')

if [ "$is_minikube" == "yes" ]; then
  node_ip=$(minikube ip)
else
  read -p "Enter your node IP (default is $default_ip): " custom_ip
  # Use localhost as the default value
  node_ip=${custom_ip:-$default_ip}
fi

echo "Using node IP: $node_ip to generate SSL certs!"

mkdir -p certs

# Generate CA key
openssl req -newkey rsa:4096 -nodes -sha256 -keyout certs/reg.key -x509 -days 365 -out certs/reg.crt -subj "/CN=$node_ip"

# generate a random string
random_string=$(openssl rand -hex 3)

echo "Starting docker registry with name shuffle-local-registry-$random_string.."

docker run -d -p 5000:5000 --restart=always --name "shuffle-local-registry-$random_string" \
  -v $(pwd)/certs:/certs \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/reg.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/reg.key \
  registry:2

echo "Done!"

