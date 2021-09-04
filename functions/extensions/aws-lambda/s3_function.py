import json
import urllib.parse
import requests
import os

#print('Loading function')

def lambda_handler(event, context):
    #print("Received event: " + json.dumps(event, indent=2))

    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    
    print(type(event))
    print("Getting bucket: %s" % bucket)
    webhook = os.environ.get("SHUFFLE_WEBHOOK")
    if not webhook:
        return "No webhook environment defined: SHUFFLE_WEBHOOK"
        
    ret = requests.post(webhook, json=event["Records"][0])
    if ret.status_code != 200:
        return "Bad status code for webhook: %d" % ret.status_code
        
    print("Status code: %d\nData: %s" % (ret.status_code, ret.text))
    
    #    response = s3.get_object(Bucket=bucket, Key=key)
