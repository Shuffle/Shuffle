# app_sdk.py
This is the SDK used for apps to behave like they should. 

## If you want to update apps.. PS: downloads from docker hub do overrides.. :)
1. Write your code & check if runtime works
2. Build app_base image
3. docker rm $(docker ps -aq) # Remove all stopped containers
4. Delete the specific app's Docker image (docker rmi frikky/shuffle:...)
5. Rebuild the Docker image (click load in GUI?)

## Cloud updates
1. Go to shuffle cloud on GCP
2. Go to Cloud Storage
3. Find shuffler.appspot.com
4. Navigate to generated_apps/baseline
5. Update SDK there. This will make all new apps run with the new SDK

## Cloud app force-updates
1. Run the "stitcher.go" program in the public shuffle-shared repository.

# LICENSE 
Everything in here is MIT, not AGPLv3 as indicated by the license.
