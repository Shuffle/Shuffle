#!/bin/bash
# Check if ifconfig is present and use it to get the default IP
if command -v ifconfig &> /dev/null; then
    default_ip=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}')
# Check if ip is present and use it if ifconfig is not available
elif command -v ip &> /dev/null; then
    default_ip=$(ip addr show | grep -oP 'inet \K[\d.]+' |  sed -n '2p')
# If both tools are not available, error out
else
    echo "Error: Neither ifconfig nor ip command found in the machine. Exiting.."
    exit 1
fi


read -p "Enter your node IP to use for cert generation (default is $default_ip): " custom_ip
# Use localhost as the default value
node_ip=${custom_ip:-$default_ip}

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

echo "Set up certs and launched docker registry successfully!"

echo "Please put $node_ip:5000 as the REGISTRY_URL in all-in-one.yaml file"