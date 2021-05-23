# Database folder
This is a folder used by the Shuffle database. It has to exist with WITHOUT root permissions before starting Shuffle.

All database files will recide here. IF you can't get Elasticsearch to work, this most likely has to do with permissions. To fix it, run this:

```
docker-compose down
sudo chown 1000:1000 -R shuffle-database 
docker-compose up -d
```

This restarts the database, and assigns 1000 (Elasticsearch process) as the owner of the database folder.
