#!/bin/bash

# generate configs - is this necessary? 
# Removing confd if possible
#/usr/local/bin/confd -backend="env" -confdir="/etc/confd" -onetime

# run main command
exec "$@"
