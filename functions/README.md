# Functions
The point of this folder is to make GCP Cloud functions able to run default WALKOFF apps. 

# How it works:
* Subsequent info is based on the appname in main
1. stitcher.go deploys the config to the app part of the website 
2. stitcher.go deploys the cloud function based on baseline.py
3. stitcher.go SHOULD deploy the app to dockerhub for onpremise usecases

## How to fix an appfile (done in stitcher.go)
* Remove walkoff_app_sdk.app_base import
* Remove anything with __name__ == "__main"__ (runner)

## Stitching order:
* Base imports
* Authorization
* class AppBase
* class <APP>
* Runner

## Update may 2020:
Moved static_baseline to ./onprem/app_sdk because of license.
