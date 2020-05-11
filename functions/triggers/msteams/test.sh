curl -XPOST http://localhost:8080 -d '{
    "membersAdded": [
        {
            "id": "28:f5d48856-5b42-41a0-8c3a-c5f944b679b0"
        }
    ],
    "type": "conversationUpdate",
    "timestamp": "2017-02-23T19:38:35.312Z",
    "localTimestamp": "2017-02-23T12:38:35.312-07:00",
    "id": "f:5f85c2ad",
    "channelId": "msteams",
    "serviceUrl": "https://smba.trafficmanager.net/amer-client-ss.msg/",
    "from": {
        "id": "29:1I9Is_Sx0OIy2rQ7Xz1lcaPKlO9eqmBRTBuW6XzkFtcjqxTjPaCMij8BVMdBcL9L_RwWNJyAHFQb0TRzXgyQvA"
    },
    "conversation": {
        "isGroup": true,
        "conversationType": "channel",
        "id": "19:efa9296d959346209fea44151c742e73@thread.skype"
    },
    "recipient": {
        "id": "28:f5d48856-5b42-41a0-8c3a-c5f944b679b0",
        "name": "SongsuggesterBot"
    },
    "channelData": {
        "team": {
            "id": "19:efa9296d959346209fea44151c742e73@thread.skype"
        },
        "eventType": "teamMemberAdded",
        "tenant": {
            "id": "72f988bf-86f1-41af-91ab-2d7cd011db47"
        }
    }
}'
#{"type":"message","id":"4oN7bHB4dit7scwHygF1pf-h|0000000","timestamp":"2019-09-06T15:21:21.9035613Z","serviceUrl":"https://webchat.botframework.com/","channelId":"webchat","from":{"id":"4ccfb6b9-5755-426e-914d-641dd74f5e0f"},"conversation":{"id":"4oN7bHB4dit7scwHygF1pf-h"},"recipient":{"id":"Shuffle@qKw6tMx9fE8","name":"Shuffler"},"textFormat":"plain","locale":"en-US","text":"hi","entities":[{"type":"ClientCapabilities","requiresBotState":true,"supportsListening":true,"supportsTts":true}],"channelData":{"clientActivityID":"15677832808420.ishosdmdfbd"}}
