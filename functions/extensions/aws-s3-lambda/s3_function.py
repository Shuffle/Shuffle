import json
import urllib.parse
import urllib3 
import os

print('Loading function')

def lambda_handler(event, context):
    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    
    webhook = os.environ.get("SHUFFLE_WEBHOOK")
    if not webhook:
        return "No webhook environment defined: SHUFFLE_WEBHOOK"
        
    http = urllib3.PoolManager()
    ret = http.request('POST', webhook, body=json.dumps(event["Records"][0]).encode("utf-8"))
    if ret.status != 200:
        return "Bad status code for webhook: %d" % ret.status
        
    print("Status code: %d\nData: %s" % (ret.status, ret.data))
    return "Successfully started with data %s" % ret.data
