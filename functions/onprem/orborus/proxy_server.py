#
# curl -H "Org-id: Shuffle" --proxy "http://192.168.86.45:8081" http://192.168.86.45:5001/api/v1/workflows/queue

import SocketServer
import SimpleHTTPServer
import requests
import json

PORT = 8082

class MyProxy(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        url=self.path[:]
        allheaders = {}
        for item in ("%s" % self.headers).split("\n"):
            headersplit = item.split(":")
            if len(headersplit) == 2:
                allheaders[headersplit[0]] = (headersplit[1][:-1]).strip()

        ret = requests.get(url, headers=allheaders)
        print("RESP (%s) - %d - %s" % (url, ret.status_code, ret.text))

        self.send_response(ret.status_code)
        self.end_headers()
        self.wfile.write(ret.text)

    def do_POST(self):
        url=self.path[:]
        allheaders = {}
        for item in ("%s" % self.headers).split("\n"):
            headersplit = item.split(":")
            if len(headersplit) == 2:
                allheaders[headersplit[0]] = (headersplit[1][:-1]).strip()

        length = int(self.headers.getheader('content-length'))
        try:
            message = json.loads(self.rfile.read(length))
            print("Got message: %s" % message)
            ret = requests.post(url, headers=allheaders, json=message)
        except:
            message = self.rfile.read(length)
            print("Got message: %s" % message)
            ret = requests.post(url, headers=allheaders, data=message)
            
        print("RESP (%s) - %d - %s" % (url, ret.status_code, ret.text))

        self.send_response(ret.status_code)
        self.end_headers()
        self.wfile.write(ret.text)

httpd = SocketServer.ForkingTCPServer(('', PORT), MyProxy)
print("Now serving at %d" % PORT)
httpd.serve_forever()

