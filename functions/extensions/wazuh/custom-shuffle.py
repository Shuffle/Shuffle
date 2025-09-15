#!/usr/bin/env python3
# Created by Shuffle, AS. <frikky@shuffler.io>.
# Based on the Slack integration using Webhooks

import json
import sys
import time
import os

try:
    import requests
    from requests.auth import HTTPBasicAuth
except Exception as e:
    print("No module 'requests' found. Install: pip install requests")
    sys.exit(1)

# ADD THIS TO ossec.conf configuration:
#  <integration>
#      <name>custom-shuffle</name>
#      <hook_url>http://<IP>:3001/api/v1/hooks/<HOOK_ID></hook_url>
#      <level>3</level>
#      <alert_format>json</alert_format>
#  </integration>

# Global vars
debug_enabled = False 
pwd = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
json_alert = {}
now = time.strftime("%a %b %d %H:%M:%S %Z %Y")

# Set paths
log_file = '{0}/logs/integrations.log'.format(pwd)

try:
    with open("/tmp/shuffle_start.txt", "w+") as tmp:
        tmp.write("Script started")
except:
    pass


def main(args):
    debug("# Starting")

    # Read args
    alert_file_location = args[1]
    webhook = args[3]

    debug("# Webhook")
    debug(webhook)

    debug("# File location")
    debug(alert_file_location)

    # Load alert. Parse JSON object.
    try:
        with open(alert_file_location) as alert_file:
            json_alert = json.load(alert_file)
    except:
        debug("# Alert file %s doesn't exist" % alert_file_location)

    debug("# Processing alert")
    try:
        debug(json_alert)
    except Exception as e:
        debug("Failed getting json_alert %s" % e)
        sys.exit(1)

    debug("# Generating message")
    msg = generate_msg(json_alert)
    if isinstance(msg, str):
        if len(msg) == 0:
            return
    debug(msg)

    debug("# Sending message")

    try:
        with open("/tmp/shuffle_end.txt", "w+") as tmp:
            tmp.write("Script done pre-msg sending")
    except:
        pass


    send_msg(msg, webhook)


def debug(msg):
    if debug_enabled:
        msg = "{0}: {1}\n".format(now, msg)
        print(msg)
        f = open(log_file, "a")
        f.write(msg)
        f.close()

# Skips container kills to stop self-recursion
def filter_msg(alert):
    # These are things that recursively happen because Shuffle starts Docker containers
    skip = ["87924", "87900", "87901", "87902", "87903", "87904", "86001", "86002", "86003", "87932", "80710", "87929", "87928", "5710"]
    if alert["rule"]["id"] in skip:
        return False

    #try:
    #    if "docker" in alert["rule"]["description"].lower() and "
    #msg['text'] = alert.get('full_log')
    #except:
    #    pass
    #msg['title'] = alert['rule']['description'] if 'description' in alert['rule'] else "N/A"

    return True

def generate_msg(alert):
    if not filter_msg(alert):
        print("Skipping rule %s" % alert["rule"]["id"])
        return ""

    level = alert['rule']['level']

    if (level <= 4):
        severity = 1
    elif (level >= 5 and level <= 7):
        severity = 2
    else:
        severity = 3

    msg = {}
    msg['severity'] = severity 
    msg['pretext'] = "WAZUH Alert"
    msg['title'] = alert['rule']['description'] if 'description' in alert['rule'] else "N/A"
    msg['text'] = alert.get('full_log')
    msg['rule_id'] = alert["rule"]["id"]
    msg['timestamp'] = alert["timestamp"]
    msg['id'] = alert['id']
    msg["all_fields"] = alert

    #msg['fields'] = []
    #    msg['fields'].append({
    #        "title": "Agent",
    #        "value": "({0}) - {1}".format(
    #            alert['agent']['id'],
    #            alert['agent']['name']
    #        ),
    #    })
    #if 'agentless' in alert:
    #    msg['fields'].append({
    #        "title": "Agentless Host",
    #        "value": alert['agentless']['host'],
    #    })

    #msg['fields'].append({"title": "Location", "value": alert['location']})
    #msg['fields'].append({
    #    "title": "Rule ID",
    #    "value": "{0} _(Level {1})_".format(alert['rule']['id'], level),
    #})

    #attach = {'attachments': [msg]}

    return json.dumps(msg)


def send_msg(msg, url):
    debug("# In send msg")
    headers = {'content-type': 'application/json', 'Accept-Charset': 'UTF-8'}
    res = requests.post(url, data=msg, headers=headers, verify=False)
    debug("# After send msg: %s" % res)


if __name__ == "__main__":
    try:
        # Read arguments
        bad_arguments = False
        if len(sys.argv) >= 4:
            msg = '{0} {1} {2} {3} {4}'.format(
                now,
                sys.argv[1],
                sys.argv[2],
                sys.argv[3],
                sys.argv[4] if len(sys.argv) > 4 else '',
            )
            #debug_enabled = (len(sys.argv) > 4 and sys.argv[4] == 'debug')
            debug_enabled = True
        else:
            msg = '{0} Wrong arguments'.format(now)
            bad_arguments = True

        # Logging the call
        try:
            f = open(log_file, 'a')
        except:
            f = open(log_file, 'w+')
            f.write("")
            f.close()

        f = open(log_file, 'a')
        f.write(msg + '\n')
        f.close()

        if bad_arguments:
            debug("# Exiting: Bad arguments. Inputted: %s" % sys.argv)
            sys.exit(1)

        # Main function
        main(sys.argv)

    except Exception as e:
        debug(str(e))
        raise
