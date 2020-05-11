#curl -X POST -H "Content-Type: application/json" shuffler.io/functions/sendmail -H "Authorization: Bearer " -d '{"target": "frikky@shuffler.io", "body": "Hey, this is a body for something to look at", "subject": "SOS check me", "type": "alert", "sender_company": "shuffler"}'

curl -X POST -H "Content-Type: application/json" localhost:5001/functions/sendmail -H "Authorization: Bearer " -d '{"targets": ["frikky@shuffler.io", "rheyix.yt@gmail.com"], "body": "Hey, this is a body for something to look at", "subject": "SOS check me", "type": "alert", "sender_company": "shuffler"}'
