# Outlook trigger
Makes it possible to trigger a workflow based on an email

## Local testing - Same as ../webhook
```bash
mv ../main.go
go run main.go hook.go
```

# Deploy gcloud 
gcloud functions deploy outlooktrigger --runtime go111 --entry-point Authorization --trigger-http --project shuffler --memory=128 --set-env-vars=FUNCTION_APIKEY=asdasd,CALLBACKURL=shuffler.io,TRIGGERID=test123,WORKFLOW_ID=YOUR_WORKFLOW_ID

# Build and deploy 
1. Set hook.go line 1 from "package main" to "package function"
2. zip outlooktrigger.tar hook.go
3. Upload to bucket https://console.cloud.google.com/storage/browser/shuffler.appspot.com?project=shuffler
4. Go to the functions https://console.cloud.google.com/functions/list?project=shuffler


## How it works (from frontend to backend)
### Choose mailfolders
1. Use microsoft graph api to get the folders the user wants to listen to
* Have the user write their primary email (default) or another one
* Have it show the folders for the email with chooseable buttons somehow
|inbox
|-subinbox
|--subsubinbox <-- choose e.g. this one
|otherfolder

API:
// requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/me/mailfolders")

### Add callback subscription
2. Make an APIcall to ("https://outlook.office.com/api/v2.0/me/mailfolders('inbox')/messages") with callback url defined as "https://shuffler.io/api/v1/workflows/{key}/email/authorize"
* Should this be set up whenever the user clicked start or when the workflow is created? 
* Start click ->
1. Add another cloud function for the item
2. When it's ready, deploy it to authorize
3. Show it as ready

### Remove a subscription
* Since everything is already generated above, one would need to 
* https://docs.microsoft.com/en-us/graph/api/subscription-delete?view=graph-rest-1.0&tabs=http
* DELETE https://graph.microsoft.com/v1.0/subscriptions/{id}


## CREATE - Fixme: LIST all current subscriptions, and stop them if they're towards the same endpoint
* POST /api/v1/workflows/{key}/outlook
* createOutlookSub(resp, request)
* getOutlookSubscriptions(client) // Used to remove all existing for same endpoint
* makeOutlookSubscription(client, folderIds, notificationUrl)
* Add data from ^ to triggerAuth

## DELETE
* DELETE /api/v1/workflows/{key}/outlook/{triggerId}
* handleDeleteOutlookSub(resp, request)
* handleOutlookSubRemoval(workflowId, triggerId)
