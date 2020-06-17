#!/bin/bash
docker rmi frikky/shuffle:app_sdk --force
docker build . -t frikky/shuffle:app_sdk
docker push frikky/shuffle:app_sdk
