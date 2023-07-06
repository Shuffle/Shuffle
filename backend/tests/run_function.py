# This is a script to test a function by itself

import requests
import json

def invoke(url, headers, message): 
    # Used for testing
    try:
        ret = requests.post(url, headers=headers, json=message, timeout=5)
        print(ret.text)
        print(ret.status_code)
    except requests.exceptions.ConnectionError as e:
        print(f"Requesterror: {e}")

def invoke_multi(url, headers, message):
    cnt = 0
    maxcnt = 100
    print("Running %d requests towards %s." % (maxcnt, url))
    while(1):
        try:
            ret = requests.post(url, headers=headers, json=message, timeout=1)
            print(ret.status_code)
        except requests.exceptions.ConnectionError as e:
            print(f"Connectionerror: {e}")
        except requests.exceptions.ReadTimeout as e:
            print(f"Readtimeout: {e}")

        cnt += 1
        if cnt == maxcnt:
            break

    print("Done :)")

if __name__ == "__main__":
    # Specific thingies for hello_world
    message = {
        "parameters": [{
            "id_": "asd",
            "name": "call",
            "value": "REPEAT THIS DATA PLEASE THANKS",
            "variant": "STATIC_VALUE",
        }],
        "name": "repeat_back_to_me",
        "execution_id": "asd",
        "label": "",
        "position": "",
        "app_name": "hello_world",
        "app_version": "1.0.0",
        "label": "lul",
        "priority": "1",
        "id_": "test",
        "id": "test",
        "authorization": "hey",
    }

    apikey = ""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {apikey}" 
    }

    location = "europe-west2"
    functionname = "hello-world-1-0-6"
    project = "shuffler"

    url = f"https://{location}-{project}.cloudfunctions.net/{functionname}"
    print(url)
    invoke(url, headers, message)
    #invoke_multi(url, headers, message)
