#!/bin/bash

# generate configs
/usr/local/bin/confd -backend="env" -confdir="/etc/confd" -onetime

# run main command
exec "$@"
