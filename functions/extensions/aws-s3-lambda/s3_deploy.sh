#GOOS=linux go build main.go
zip s3_function.zip s3_function.py 

WEBHOOK=https://shuffler.io/api/v1/hooks/webhook_eccf47b1-8f6a-49fc-b2b8-383365a22353
ROLE=arn:aws:iam::202262580068:role/service-role/shuffle-forwarder
REGION=us-east-1
BUCKETNAME=helo

aws lambda create-function \
	--role $ROLE \
	--region $REGION \
	--function-name shuffler-webhook-forwarder-3 \
	--zip-file fileb://s3_function.zip \
	--runtime python3.9 \
	--environment Variables={SHUFFLE_WEBHOOK=$WEBHOOK} \
	--handler lambda_handler 
