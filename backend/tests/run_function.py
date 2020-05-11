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

    apikey = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjYwZjQwNjBlNThkNzVmZDNmNzBiZWZmODhjNzk0YTc3NTMyN2FhMzEiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJodHRwczovL3NodWZmbGVyLmlvL2FwaS92MS93b3JrZmxvd3MvMWQ5ZDhjZTItNTY2ZS00YzNmLThhMzctNWQ2YzdkMjAwMGI1L2V4ZWN1dGUiLCJhenAiOiIxMDMwNzY3ODIwNjE0MjQ2MTg0MjIiLCJlbWFpbCI6InNjaGVkdWxlckBzaHVmZmxlLTI0MTUxNy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1NjU1Mjc1NTEsImlhdCI6MTU2NTUyMzk1MSwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwic3ViIjoiMTAzMDc2NzgyMDYxNDI0NjE4NDIyIn0.r0EDq9fjhf_5CPTiltyfk_L3uYJp577Uy0yYPcCAl2nv50_z_oUtbWGBpQLL8gcj-NGd3g4E52Qur8k6hCMIQweLS6WAb1279vGffEoCNDfkWb3Oy-yJGP1kzwLvqFJqnHLkSWYXNWvSyWnEimW8Rryx_m1BXS5wcA8l4NIr83kS7fPZrTwjnwFSeGSThwk91DVARzapQb8r0GEgOUyHZ1aBXnV98mikzSUt-5xFKe9eMdD22YJAj0Ru-DxAxs5nOqghX4PMRysWjshjOMrlR1piPWxqAmewp8YKZDCQ5gXskpeAFBDoULT971Wsx_NCohnJsFqx1JfPS9ZYMTW2oQ"
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
