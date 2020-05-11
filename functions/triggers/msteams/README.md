# Local testing
1. Change hook.go package to main
```bash
mv ../main.go .
go run main.go hook.go
```

# Deploy local
```bash
gcloud functions deploy webhook --runtime go111 --entry-point Authorization --trigger-http --project shuffle-241517 --memory=128 --set-env-vars=FUNCTION_APIKEY=asdasd,CALLBACKURL=shuffler.io,HOOKID=test123
```

# Build and deploy from gui
1. rm webhook.zip
2. zip webhook.zip hook.go
3. Upload to bucket https://console.cloud.google.com/storage/browser/shuffle-241517.appspot.com?project=shuffle-241517
4. Restart hook(s) (https://shuffler.io/webhooks)
