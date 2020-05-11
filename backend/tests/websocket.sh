#!/bin/bash
curl http://localhost:5001/ws -H "Connections: Upgrade"

#curl -X POST "https://europe-west1-shuffle-241517.cloudfunctions.net/webhook_982995716e67c3a549092d3a3a7921cd" -H "Content-Type:application/json" -H "Authorization: Bearer 144308d0-6aab-4d4f-8bb2-75189281ee26" --data '{"name":"Keyboard Cat"}' -v
