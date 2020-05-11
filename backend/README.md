# Backend setup
1 Go to https://console.cloud.google.com/apis/credentials?project=shuffle-241517&folder&organizationId and get credentials
2. Move the file to current folder (or make step 3 be your download folder or w/e)
3. export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/Shuffle-2a19ff64af66.json

# Backend run testserver (appengine)
1. Set up gcloud locally
```bash
dev_appserver.py go-app/ --port=5001 --host=0.0.0.0 --enable_host_checking=false
```

# Backend deploy
* I created a simple script that moves the data into your GOPATH and deploys for you. This will require more tests in the future. 

# OpenAPI spec checks
Paths: 
* /path/{variablename}?queryvar= <-- variable
* ^variablename needs to be part of parameters too. 
* ^queryvar needs to be part of parameters too.
```
parameters:
- name: variablename
  in: path
  description: Blah blah
  required: true/false
  schema:
    type: string
	enum: [a, b, c] # <-- not necessary, but could be great
- name: queryvar
  in: query
  description: blah blah
  required: true/false
  schema:
    type: string
	enum: [a, b, c]
```
* requestBody? Not in GET, DELETE & HEAD. Can consume JSON, XML, form data, plai ntext & others. Can use markdown for the description.  
* Do I care about the response? Maybe :o

```
requestBody:
  description: Optional kind of description
  required: false/true
  content:
    application/json:
	  schema:
	    type: object
		additionalProperties: true
		properties:
		  name:
		    type: string
		  fav_number:
		    type: integer
		  required:
		    - name
			- email
	  encoding:
	    color:
		  style: form
		  explode: false
```
