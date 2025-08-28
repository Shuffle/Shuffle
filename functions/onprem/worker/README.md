# Worker
A worker implementation in Golang. This runs ALL Shuffle workflows onprem. In general receives jobs from Orborus.

## Development
The ideal way to test the Worker is with a single workflow execution, standalone. Here are some environment variables you can use:

```
# Control what to run
export ENVIRONMENT_NAME=""
export SHUFFLE_CLOUDRUN_URL="https://shuffler.io"
export AUTHORIZATION=""
export EXECUTIONID=""

# Control debugging and shutdown mechanisms 
export DEBUG="true"
export SHUFFLE_WORKER_SHUTDOWN_DISABLED="true"
```
