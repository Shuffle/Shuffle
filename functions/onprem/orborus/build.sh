docker rmi frikky/shuffle:orborus --force

docker build . -t frikky/shuffle:orborus
docker push frikky/shuffle:orborus
