#!/usr/bin/env python3
# -*- coding: utf-8 -*-

print("Running imports")
import sys
import zmq
import json
import time
import pprint
import os
import sys
import requests

forward_url = os.getenv("ZMQ_FORWARD_URL", "")
print("Checking forward url (ZMQ_FORWARD_URL): %s" % forward_url)
def handle_hook(data):
    ret = requests.post(forward_url, json=data)
    print(ret.text)
    print(ret.status_code)

def main():
    host = os.getenv("ZMQ_HOST", "localhost")
    port = os.getenv("ZMQ_PORT", "50000")

    if len(forward_url) == 0:
        print("Failed to start - define ZMQ_FORWARD_URL for webhook forwarder")
        exit(0)

    print("Starting connection setup to %s:%s" % (host, port))
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    socket.connect ("tcp://%s:%s" % (host, port))
    socket.setsockopt(zmq.SUBSCRIBE, b'')
    
    poller = zmq.Poller()
    poller.register(socket, zmq.POLLIN)
    
    print("Starting zmq check for %s:%s" % (host, port))
    while True:
        socks = dict(poller.poll(timeout=None))
        if socket in socks and socks[socket] == zmq.POLLIN:
            message = socket.recv()
            #print(message)
            topic, s, m = message.decode('utf-8').partition(" ")
    
            d = json.loads(m)
            try:
                # print test if you want status (heartbeat)
                test = d["status"]
            except KeyError:
                handle_hook(d)
    
            time.sleep(1)

if __name__ == "__main__":
    print("In init ")
    main()
