#!/bin/sh
curl -XPOST http://localhost:5001/api/v1/get_docker_image -d '{"name":"frikky/shuffle:Testing_1.0.0"}' -H "Authorization: Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4" --output tarball.tgz
