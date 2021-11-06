docker swarm init
chown 1000:1000 -R shuffle-database/
docker stack deploy --compose-file=docker-compose.yml shuffle_swarm
