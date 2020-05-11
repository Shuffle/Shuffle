#!/bin/bash
# Should give 401
curl localhost:5000/api/v1/uploadResult/asdasd -d {}
echo

# Should give 200 if it exists
curl localhost:5000/api/v1/uploadResult/e07910a06a086c83ba41827aa00b26ed -d '{"title": "helo","description": "wut", "type": "hi", "source": "wutface", "sourceRef": "halvor hei"}'
