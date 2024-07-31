#!/usr/bin/env sh
set -eu

envsubst '${BACKEND_HOSTNAME}' < /etc/nginx/nginx.conf.tmpl > /etc/nginx/nginx.conf

exec "$@"
