#!/bin/bash

# Sekerovic Dragan, oneStep2 GmbH - 2023-09-08 - quick and dirty
# purpose of the script: make shuffle reverse proxyable/run shuffle on a subpath instead of root

if $(ls frontend/src/App.jsx.orig.* 1>/dev/null 2>&1); then
    echo "shuffle src already patched for subpathing!"
    echo "Aborting ..."
    exit 1
fi

[[ "$1" != "" ]] && SUBPATH=$1 || SUBPATH="/shuffle"

cat $0.tpl | sed "s,SUBPATH,$SUBPATH," > $0.run
chmod 700 $0.run
./$0.run
rm ./$0.run

exit 0
