GOOS=linux go build main.go
zip function.zip main

aws lambda update-function-code \
	--function-name shuffler-forwarder \
	--runtime go1.* \
  --zip-file fileb://function.zip \
	--handler main \
	--role arn:aws:iam::123456789012:role/execution_role
