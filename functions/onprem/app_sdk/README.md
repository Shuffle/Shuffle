# app_sdk
This is the SDK used for apps to behave like they should. 
To change it in the backend, upload it to Buckets/shuffler.appspot.com/generated_apps/baseline.

## If you want to update apps.. PS: downloads from docker hub do overrides.. :)
1. Write your code & check if runtime works
2. Build app_base image
3. docker rm $(docker ps -aq) # Remove all stopped containers
4. Delete the specific app's Docker image (docker rmi frikky/shuffle:...)
5. Rebuild the Docker image (click load in GUI?)
