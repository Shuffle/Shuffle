#!/bin/bash

read -p "Are you using Minikube? (yes/no): " is_minikube

if [ "$is_minikube" == "yes" ]; then
  node_ip=$(minikube ip)
else
  read -p "Enter your node IP (default is localhost): " custom_ip
  # Use localhost as the default value
  node_ip=${custom_ip:-localhost}
fi

echo "Using node IP: $node_ip to generate SSL certs!"

# Generate CA key
openssl req -newkey rsa:4096 -nodes -sha256 -keyout certs/reg.key -x509 -days 365 -out certs/reg.crt -subj "/CN=$node_ip"


