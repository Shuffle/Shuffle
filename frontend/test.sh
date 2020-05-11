#curl -XPOST https://localhost:8443/login -k -d '{"username": "asdasd", "password": "lel"}'

#curl -XPOST https://localhost:8443/passwordreset -k --cookie "session_token=212921dd-0357-411a-8eb6-8c36786c0ab6" -d '{"password1": "asdASD123aa", "password2": "asdASD123aa", "password3": "asdASD123a"}'


# Register user
#curl -XPOST -k https://localhost:8443/register -d '{"username": "test@test.noooooo", "password": "asdASD123a"}' 

# Get queue with apikey
#curl https://localhost:8443/api/v1/apk/queue -k -H "apikey: 8631d3f2-8fcc-44dd-961e-ac358d229408"

# Get apk scan 
#curl -k https://localhost:8443/api/v1/apk/e9d8f6752c6551a68a5dbf1ae4d8b51f -H "apikey: 8631d3f2-8fcc-44dd-961e-ac358d229408"

# 
#curl -k https://localhost:8443/scan/e9d8f6752c6551a68a5dbf1ae4d8b51f
curl -k https://localhost:8443/scan -k
