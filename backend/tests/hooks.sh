#curl localhost:5000/api/v1/hooks

# Starts a webhook
#curl localhost:5000/api/v1/hooks/d6ef8912e8bd37776e654cbc14c2629c/start

# Runs a request towards the webhook created
#curl -XPOST localhost:5002/webhook -d '{"helo": "hi"}'

# Gets the ID of a new hook

#curl -X PUT localhost:5001/api/v1/hooks/e6f77059e6d469a6c4c314cc06d5a4c0 -d '{"name": "asd", "description": "hola", "type": "webhook", "id": "e6f77059e6d469a6c4c314cc06d5a4c0", "status": "stopped", "info": {"name": "lul", "url": "http://test"}}'

#curl -X POST localhost:5000/api/v1/hooks/new -d '{"name": "asd", "description": "hola", "type": "webhook"}'

#curl -X POST "https://europe-west1-shuffle-241517.cloudfunctions.net/webhook_982995716e67c3a549092d3a3a7921cd" -H "Content-Type:application/json" -H "Authorization: Bearer 144308d0-6aab-4d4f-8bb2-75189281ee26" --data '{"name":"Keyboard Cat"}' -v

## GET HOOK
#curl http://localhost:5001/api/v1/hooks/b4ba07c9-45d4-41f2-b260-83c8e99eba0c -H "Authorization: Bearer "

#curl https://shuffler.io/api/v1/hooks/b4ba07c9-45d4-41f2-b260-83c8e99eba0c -H "Authorization: Bearer "


#curl -X POST "https://europe-west1-shuffle-241517.cloudfunctions.net/webhook_3ceff795-ce9a-43a2-a2f5-d4401a6e772d" -H "Authorization: Bearer 144308d0-6aab-4d4f-8bb2-75189281ee26" --data 'wut' 
#curl POST "https://europe-west1-shuffler.cloudfunctions.net/outlooktrigger_be4dbb0a-d396-4544-bc36-e57d1bdb2e40" -H "Authorization: Bearer 144308d0-6aab-4d4f-8bb2-75189281ee26" --data 'wut' -vvv

curl -X POST "http://localhost:5002/api/v1/hooks/webhook_f22b5e54-e55d-48e5-a1d1-f40453513fd3" -H "Content-Type:application/json" --data '{"test": {"hello": "HEYOOOO"}}'
