#!/bin/bash
docker rmi frikky/shuffle:app_sdk
docker build . -t frikky/shuffle:app_sdk --no-cache
docker push frikky/shuffle:app_sdk
