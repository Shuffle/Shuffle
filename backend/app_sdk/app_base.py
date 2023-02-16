import os
import ast
import copy
import sys
import re
import time 
import base64
import json
import liquid
import logging
import urllib3
import hashlib
import zipfile
import asyncio
import requests
import http.client
import urllib.parse
import jinja2 
import datetime
import dateutil
from io import StringIO as StringBuffer
from io import BytesIO
from liquid import Liquid, defaults

runtime = os.getenv("SHUFFLE_SWARM_CONFIG", "")

###
###
###
#### Filters for liquidpy
###
###
###

defaults.MODE = 'wild'
defaults.FROM_FILE = False
from liquid.filters.manager import FilterManager
from liquid.filters.standard import standard_filter_manager

shuffle_filters = FilterManager()
for key, value in standard_filter_manager.filters.items():
    shuffle_filters.filters[key] = value

#@shuffle_filters.register
#def plus(a, b):
#    try:
#        a = int(a)
#    except:
#        a = 0
#
#    try:
#        b = int(b)
#    except:
#        b = 0
#
#    return standard_filter_manager.filters["plus"](a, b)
#
#@shuffle_filters.register
#def minus(a, b):
#    a = int(a)
#    b = int(b)
#    return standard_filter_manager.filters["minus"](a, b)
#
#@shuffle_filters.register
#def multiply(a, b):
#    a = int(a)
#    b = int(b)
#    return standard_filter_manager.filters["multiply"](a, b)
#
#@shuffle_filters.register
#def divide(a, b):
#    a = int(a)
#    b = int(b)
#    return standard_filter_manager.filters["divide"](a, b)

@shuffle_filters.register
def md5(a):
    a = str(a)
    return hashlib.md5(a.encode('utf-8')).hexdigest()
    
@shuffle_filters.register
def sha256(a):
    a = str(a)
    return hashlib.sha256(str(a).encode("utf-8")).hexdigest() 

@shuffle_filters.register
def md5_base64(a):
    a = str(a)
    foundhash = hashlib.md5(a.encode('utf-8')).hexdigest()
    return base64.b64encode(foundhash.encode('utf-8'))
    
@shuffle_filters.register
def base64_encode(a):
    a = str(a)
    try:
        return base64.b64encode(a.encode('utf-8')).decode()
    except:
        return base64.b64encode(a).decode()

@shuffle_filters.register
def base64_decode(a):
    a = str(a)
    try:
        return base64.b64decode(a).decode()
    except:
        return base64.b64decode(a)

@shuffle_filters.register
def json_parse(a):
    return json.loads(str(a))

@shuffle_filters.register
def as_object(a):
    return json.loads(str(a))

@shuffle_filters.register
def ast(a):
    return ast.literal_eval(str(a))

@shuffle_filters.register
def escape_string(a):
    a = str(a)
    return a.replace("\\\'", "\'", -1).replace("\\\"", "\"", -1).replace("'", "\\\'", -1).replace("\"", "\\\"", -1)

@shuffle_filters.register
def json_escape(a):
    a = str(a)
    return a.replace("\\\'", "\'", -1).replace("\\\"", "\"", -1).replace("'", "\\\\\'", -1).replace("\"", "\\\\\"", -1)

@shuffle_filters.register
def escape_json(a):
    a = str(a)
    return a.replace("\\\'", "\'", -1).replace("\\\"", "\"", -1).replace("'", "\\\\\'", -1).replace("\"", "\\\\\"", -1)

# By default using json escape to add all backslashes
@shuffle_filters.register
def escape(a):
    a = str(a)
    return json_escape(a)

@shuffle_filters.register
def flatten(a):
    a = list(a)

    flat_list = [a for xs in a for a in xs]
    return flat_list


@shuffle_filters.register
def csv_parse(a):
    a = str(a)
    splitdata = a.split("\n")
    columns = []
    if len(splitdata) > 1:
        columns = splitdata[0].split(",")
    else:
        return a.split("\n")

    allitems = []
    cnt = -1
    for item in splitdata[1:]:
        cnt += 1
        commasplit = item.split(",")

        fullitem = {}
        fullitem["unparsed"] = item
        fullitem["index"] = cnt 
        fullitem["parsed"] = {}
        if len(columns) != len(commasplit):

            if len(commasplit) > len(columns):
                diff = len(commasplit)-len(columns)

                try:
                    commasplit = commasplit[0:len(commasplit)-diff]
                except:
                    pass
            else:
                for item in range(0, len(columns)-len(commasplit)):
                    commasplit.append("")

        for key in range(len(columns)):
            try:
                fullitem["parsed"][columns[key]] = commasplit[key]
            except:
                continue 
        
        allitems.append(fullitem)

    try:
        return json.dumps(allitems)
    except:
        print("[ERROR] Failed dumping from JSON in csv parse")
        return allitems

@shuffle_filters.register
def parse_csv(a):
    return csv_parse(a)

@shuffle_filters.register
def format_csv(a):
    return csv_parse(a)

@shuffle_filters.register
def csv_format(a):
    return csv_parse(a)@standard_filter_manager.register

@shuffle_filters.register
def split(base, sep):
    if not sep:
        try:
            return json.dumps(list(base))
        except:
            return list(base)

    try:
        return json.dumps(base.split(sep))
    except:
        return base.split(sep)

#print(shuffle_filters.filters)
#print(Liquid("{{ '10' | plus: 1}}", filters=shuffle_filters.filters).render())
#print(Liquid("{{ '10' | minus: 1}}", filters=shuffle_filters.filters).render())
#print(Liquid("{{ asd | size }}", filters=shuffle_filters.filters).render())
#print(Liquid("{{ 'asd' | md5 }}", filters=shuffle_filters.filters).render())
#print(Liquid("{{ 'asd' | sha256 }}", filters=shuffle_filters.filters).render())
#print(Liquid("{{ 'asd' | md5_base64 | base64_decode }}", filters=shuffle_filters.filters).render())

###
###
###
###
###
###
###

class AppBase:
    __version__ = None
    app_name = None

    def __init__(self, redis=None, logger=None, console_logger=None):#, docker_client=None):
        self.logger = logger if logger is not None else logging.getLogger("AppBaseLogger")

        if not os.getenv("SHUFFLE_LOGS_DISABLED") == "true":
            self.log_capture_string = StringBuffer()
            ch = logging.StreamHandler(self.log_capture_string)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            ch.setFormatter(formatter)
            logger.addHandler(ch)

        self.redis=redis
        self.console_logger = logger if logger is not None else logging.getLogger("AppBaseLogger")

        # apikey is for the user / org
        # authorization is for the specific workflow

        self.url = os.getenv("CALLBACK_URL",  "https://shuffler.io")
        self.base_url = os.getenv("BASE_URL", "https://shuffler.io")
        self.action = os.getenv("ACTION", "")
        self.original_action = os.getenv("ACTION", "")
        self.authorization = os.getenv("AUTHORIZATION", "")
        self.current_execution_id = os.getenv("EXECUTIONID", "")
        self.full_execution = os.getenv("FULL_EXECUTION", "") 
        self.start_time = int(time.time())
        self.result_wrapper_count = 0

        self.action_result = {
            "action": self.action,
            "authorization": self.authorization,
            "execution_id": self.current_execution_id,
            "result": f"",
            "started_at": self.start_time,
            "status": "",
            "completed_at": int(time.time()),
        }

        if isinstance(self.action, str):
            try:
                self.action = json.loads(self.action)
                self.original_action = json.loads(self.action)
            except Exception as e:
                self.logger.info(f"[DEBUG] Failed parsing action as JSON (init): {e}. NOT important if running apps with webserver. This is NOT critical.")

        #print(f"ACTION: {self.action}")

        if len(self.base_url) == 0:
            self.base_url = self.url

    # Checks output for whether it should be automatically parsed or not
    def run_magic_parser(self, input_data):
        if not isinstance(input_data, str):
            self.logger.info("[DEBUG] Not string. Returning from magic")
            return input_data

        # Don't touch existing JSON/lists
        if (input_data.startswith("[") and input_data.endswith("]")) or (input_data.startswith("{") and input_data.endswith("}")):
            self.logger.info("[DEBUG] Already JSON-like. Returning from magic")
            return input_data

        if len(input_data) < 3:
            self.logger.info("[DEBUG] Too short input data")
            return input_data

        # Don't touch large data.
        if len(input_data) > 100000:
            self.logger.info("[DEBUG] Value too large. Returning from magic")
            return input_data

        if not "\n" in input_data and not "," in input_data: 
            self.logger.info("[DEBUG] No data to autoparse - requires newline or comma")
            return input_data

        new_input = input_data
        try:
            #new_input.strip()
            new_input = input_data.split()
            new_return = []

            index = 0
            for item in new_input:
                splititem = ","
                if ", " in item:
                    splititem = ", "
                elif "," in item:
                    splititem = ","
                else:
                    new_return.append(item)

                    index += 1
                    continue

                #print("FIX ITEM %s" % item)
                for subitem in item.split(splititem):
                    new_return.insert(index, subitem) 

                    index += 1

                    # Prevent large data or infinite loops
                    if index > 10000:
                        self.logger.info(f"[DEBUG] Infinite loop. Returning default data.")
                        return input_data

            fixed_return = []
            for item in new_return:
                if not item:
                    continue

                if not isinstance(item, str):
                    fixed_return.append(item)
                    continue

                if item.endswith(","):
                    item = item[0:-1]
                
                fixed_return.append(item)

            new_input = fixed_return
        except Exception as e:
            # Not used anymore
            #self.logger.info(f"[ERROR] Failed to run magic parser (2): {e}")
            return input_data

        try:
            new_input = input_data.split()
        except Exception as e:
            self.logger.info(f"[ERROR] Failed to run magic parser during split (1): {e}")
            return input_data

        # Won't ever touch this one?
        if isinstance(new_input, list) or isinstance(new_input, object):
            try:
                return json.dumps(new_input)
            except Exception as e:
                self.logger.info(f"[ERROR] Failed to run magic parser (3): {e}")
            
        return new_input

    def prepare_response(self, request):
        try:
            parsedheaders = {}
            for key, value in request.headers.items():
                parsedheaders[key] = value

            cookies = {}
            if request.cookies:
                for key, value in request.cookies.items():
                    cookies[key] = value

            
            jsondata = request.text
            try:
                jsondata = json.loads(jsondata)
            except:
                pass

            return json.dumps({
                "success": True,
                "status": request.status_code,
                "url": request.url,
                "headers": parsedheaders,
                "body": jsondata,
                "cookies":cookies,
            })
        except Exception as e:
            print(f"[WARNING] Failed in request: {e}")
            return request.text

    # FIXME: Add more info like logs in here.
    # Docker logs: https://forums.docker.com/t/docker-logs-inside-the-docker-container/68190/2
    def send_result(self, action_result, headers, stream_path):
        if action_result["status"] == "EXECUTING":
            action_result["status"] = "FAILURE"

        try:
            #self.logger.info(f"[DEBUG] ACTION: {self.action}")
            if self.action["run_magic_output"] == True:
                self.logger.warning(f"[INFO] Action result ran with Magic parser output.")
                action_result["result"] = self.run_magic_parser(action_result["result"])
            else:
                self.logger.warning(f"[WARNING] Magic output not defined.")
        except KeyError as e:
            self.logger.warning(f"[DEBUG] Failed to run magic autoparser (send result) - keyerror: {e}")
        except Exception as e:
            self.logger.warning(f"[DEBUG] Failed to run magic autoparser (send result): {e}")

        # Try it with some magic

        action_result["completed_at"] = int(time.time())
        self.logger.info(f"""[DEBUG] Inside Send result with status {action_result["status"]}""")
        #if isinstance(action_result, 

        # FIXME: Add cleanup of parameters to not send to frontend here
        params = {}

        # I wonder if this actually works 
        self.logger.info(f"[DEBUG] Before last stream result")
        url = "%s%s" % (self.base_url, stream_path)
        self.logger.info(f"[INFO] URL FOR RESULT (URL): {url}")

        try:
            log_contents = "disabled: add env SHUFFLE_LOGS_DISABLED=true to Orborus to re-enable logs for apps"
            if not os.getenv("SHUFFLE_LOGS_DISABLED") == "true":
                log_contents = self.log_capture_string.getvalue()

            #print("RESULTS: %s" % log_contents)
            self.logger.info(f"[WARNING] Got logs of length {len(log_contents)}")
            if len(action_result["action"]["parameters"]) == 0:
                action_result["action"]["parameters"] = []

            param_found = False
            for param in action_result["action"]["parameters"]:
                if param["name"] == "shuffle_action_logs": 
                    param_found = True
                    break

            if not param_found:
                action_result["action"]["parameters"].append({
                    "name": "shuffle_action_logs",
                    "value": log_contents,
                })

        except Exception as e:
            print(f"[WARNING] Failed adding parameter for logs: {e}") 

        # FIXME: Adding retries here.
        try:
            finished = False
            for i in range (0, 10):
                try:
                    ret = requests.post(url, headers=headers, json=action_result, timeout=10, verify=False)

                    self.logger.info(f"[DEBUG] Result: {ret.status_code} (break on 200 or 201)")
                    if ret.status_code == 200 or ret.status_code == 201:
                        finished = True
                        break
                    else:
                        self.logger.info(f"[ERROR] RESP: {ret.text}")

                except requests.exceptions.RequestException as e:
                    self.logger.info(f"[DEBUG] Request problem: {e}")
                    time.sleep(0.1)

                    #time.sleep(5)
                    continue
                except TimeoutError as e:
                    self.logger.info(f"[DEBUG] Timeout or request: {e}")
                    time.sleep(0.1)

                    #time.sleep(5)
                    continue
                except requests.exceptions.ConnectionError as e:
                    self.logger.info(f"[DEBUG] Connectionerror: {e}")
                    time.sleep(0.1)

                    #time.sleep(5)
                    continue
                except http.client.RemoteDisconnected as e:
                    self.logger.info(f"[DEBUG] Remote: {e}")
                    time.sleep(0.1)

                    #time.sleep(5)
                    continue
                except urllib3.exceptions.ProtocolError as e:
                    self.logger.info(f"[DEBUG] Protocol err: {e}")
                    time.sleep(0.1)

                    #time.sleep(5)
                    continue

                #time.sleep(5)

            if not finished:
                # Not sure why this would work tho :)
                action_result["status"] = "FAILURE"
                action_result["result"] = json.dumps({"success": False, "reason": "POST error: Failed connecting to %s over 10 retries to the backend" % url})
                self.logger.info(f"[DEBUG] Before typeerror stream result - NOT finished after 10 requests")
                ret = requests.post("%s%s" % (self.base_url, stream_path), headers=headers, json=action_result, verify=False)
        
            self.logger.info(f"""[DEBUG] Successful request result request: Status= {ret.status_code} & Response= {ret.text}. Action status: {action_result["status"]}""")
        except requests.exceptions.ConnectionError as e:
            self.logger.info(f"[DEBUG] Unexpected ConnectionError happened: {e}")
        except TypeError as e:
            action_result["status"] = "FAILURE"
            action_result["result"] = json.dumps({"success": False, "reason": "Typeerror when sending to backend URL %s" % url})

            self.logger.info(f"[DEBUG] Before typeerror stream result: {e}")
            ret = requests.post("%s%s" % (self.base_url, stream_path), headers=headers, json=action_result, verify=False)
            #self.logger.info(f"[DEBUG] Result: {ret.status_code}")
            #if ret.status_code != 200:
            #    pr
                
            self.logger.info(f"[DEBUG] TypeError request: Status= {ret.status_code} & Response= {ret.text}")
        except http.client.RemoteDisconnected as e:
            self.logger.info(f"[DEBUG] Expected Remotedisconnect happened: {e}")
        except urllib3.exceptions.ProtocolError as e:
            self.logger.info(f"[DEBUG] Expected ProtocolError happened: {e}")

        
        # FIXME: Re-enable data flushing otherwise we'll overload it all
        # Or nah?
        if not os.getenv("SHUFFLE_LOGS_DISABLED") == "true":
            try:
                self.log_capture_string.flush()
                #self.log_capture_string.close()
                #pass
            except Exception as e:
                print(f"[WARNING] Failed to flush logs: {e}") 
                pass

    #async def cartesian_product(self, L):
    def cartesian_product(self, L):
        if L:
            #return {(a, ) + b for a in L[0] for b in await self.cartesian_product(L[1:])}
            return {(a, ) + b for a in L[0] for b in self.cartesian_product(L[1:])}
        else:
            return {()}

    # Handles unique fields by negoiating with the backend 
    def validate_unique_fields(self, params):
        #self.logger.info("IN THE UNIQUE FIELDS PLACE!")

        newlist = [params]
        if isinstance(params, list):
            #self.logger.info("ITS A LIST!")
            newlist = params

        #self.full_execution = os.getenv("FULL_EXECUTION", "") 
        #self.logger.info(len(params))
        #self.logger.info(params.items())
        #self.logger.info(list(params.items()))
        #self.logger.info(f"PARAM: {params}")
        #self.logger.info(f"NEWLIST: {newlist}")

        # FIXME: Also handle MULTI PARAM
        values = []
        param_names = []
        all_values = {}
        index = 0
        for outerparam in newlist:

            #self.logger.info(f"INNERTYPE: {type(outerparam)}")
            #self.logger.info(f"HANDLING PARAM {key}")
            param_value = ""
            for key, value in outerparam.items():
                #self.logger.info("KEY: %s" % key)
                #value = params[key]
                for param in self.action["parameters"]:
                    try:
                        if param["name"] == key and param["unique_toggled"]:
                            self.logger.info(f"[DEBUG] FOUND: {key} with param {param}!")
                            if isinstance(value, dict) or isinstance(value, list):
                                try:
                                    value = json.dumps(value)
                                except json.decoder.JSONDecodeError as e:
                                    self.logger.info(f"[WARNING] Error in json decode for param {value}: {e}")
                                    continue
                            elif isinstance(value, int) or isinstance(value, float):
                                value = str(value)
                            elif value == False:
                                value = "False"
                            elif value == True:
                                value = "True"

                            self.logger.info(f"[DEBUG] VALUE APPEND: {value}")
                            param_value += value
                            if param["name"] not in param_names:
                                param_names.append(param["name"])

                    except (KeyError, NameError) as e:
                        self.logger.info(f"""Key/NameError in param handler for {param["name"]}: {e}""")

            self.logger.info(f"[DEBUG] OUTER VALUE: {param_value}")
            if len(param_value) > 0:
                md5 = hashlib.md5(param_value.encode('utf-8')).hexdigest()
                values.append(md5)
                all_values[md5] = {
                    "index": index, 
                }

            index += 1

            # When in here, it means it should be unique
            # Should this be done by the backend? E.g. ask it if the value is valid?
            # 1. Check if it's unique towards key:value store in org for action
            # 2. Check if COMBINATION is unique towards key:value store of action for org
            # 3. Have a workflow configuration for unique ID's in unison or per field? E.g. if toggled, then send a hash of all fields together alphabetically, but if not, send one field at a time

            # org_id = full_execution["workflow"]["execution_org"]["id"]

            # USE ARRAY?

        new_params = []
        if len(values) > 0:
            org_id = self.full_execution["workflow"]["execution_org"]["id"]
            data = {
                "append": True,
                "workflow_check": False,
                "authorization": self.authorization,
                "execution_ref": self.current_execution_id,
                "org_id": org_id,
                "values": [{
                        "app": self.action["app_name"],
                        "action": self.action["name"],
                        "parameternames": param_names,
                        "parametervalues": values,
                }]
            }

            #self.logger.info(f"DATA: {data}")
            # 1594869a676630b397bc34f7dc0951a3

            #self.logger.info(f"VALUE URL: {url}") 
            #self.logger.info(f"RET: {ret.text}")
            #self.logger.info(f"ID: {ret.status_code}")
            url = f"{self.url}/api/v1/orgs/{org_id}/validate_app_values"
            ret = requests.post(url, json=data, verify=False)
            if ret.status_code == 200:
                json_value = ret.json()
                if len(json_value["found"]) > 0: 
                    modifier = 0
                    for item in json_value["found"]:
                        self.logger.info(f"Should remove {item}")

                        try:
                            self.logger.info(f"FOUND: {all_values[item]}")
                            self.logger.info(f"SHOULD REMOVE INDEX: {all_values[item]['index']}")

                            try:
                                newlist.pop(all_values[item]["index"]-modifier)
                                modifier += 1
                            except IndexError as e:
                                self.logger.info(f"Error popping value from array: {e}")
                        except (NameError, KeyError) as e:
                            self.logger.info(f"Failed removal: {e}")
                        
                            
                    #return False
                else:
                    self.logger.info("None of the items were found!")
                    return newlist
            else:
                self.logger.info(f"[WARNING] Failed checking values with status code {ret.status_code}!")

        #return True
        return newlist

    # Returns a list of all the executions to be done in the inner loop
    # FIXME: Doesn't take into account whether you actually WANT to loop or not
    # Check if the last part of the value is #?
    #async def get_param_multipliers(self, baseparams):
    def get_param_multipliers(self, baseparams):
        # Example:
        # {'call': ['hello', 'hello4'], 'call2': ['hello2', 'hello3'], 'call3': '1'}
        # 
        # Should become this because of pairs (all same-length arrays, PROBABLY indicates same source node's values.
        # [
        #   {'call': 'hello', 'call2': 'hello2', 'call3': '1'},
        #   {'call': 'hello4', 'call2': 'hello3', 'call3': '1'}
        # ] 
        # 
        # ----------------------------------------------------------------------
        # Example2:
        # {'call': ['hello'], 'call2': ['hello2', 'hello3'], 'call3': '1'}
        # 
        # Should become this because NOT pairs/triplets:
        # [
        #   {'call': 'hello', 'call2': 'hello2', 'call3': '1'},
        #   {'call': 'hello', 'call2': 'hello3', 'call3': '1'}
        # ] 
        # 
        # ----------------------------------------------------------------------
        # Example3:
        # {'call': ['hello', 'hello2'], 'call2': ['hello3', 'hello4', 'hello5'], 'call3': '1'}
        # 
        # Should become this because arrays are not same length, aka no pairs/triplets. This is the multiplier effect. 2x3 arrays = 6 iterations
        # [
        #   {'call': 'hello', 'call2': 'hello3', 'call3': '1'},
        #   {'call': 'hello', 'call2': 'hello4', 'call3': '1'},
        #   {'call': 'hello', 'call2': 'hello5', 'call3': '1'},
        #   {'call': 'hello2', 'call2': 'hello3', 'call3': '1'},
        #   {'call': 'hello2', 'call2': 'hello4', 'call3': '1'},
        #   {'call': 'hello2', 'call2': 'hello5', 'call3': '1'}
        # ] 
        # To achieve this, we'll do this:
        # 1. For the first array, take the total amount(y) (2x3=6) and divide it by the current array (x): 2. x/y = 3. This means do 3 of each value
        # 2. For the second array, take the total amount(y) (2x3=6) and divide it by the current array (x): 3. x/y = 2. 
        # 3. What does the 3rd array do? Same, but ehhh?
        # 
        # Example4:
        # What if there are multiple loops inside a single item?
        # 
        #

        paramlist = []
        listitems = []
        listlengths = []
        all_lists = []
        all_list_keys = []

        #check_value = "$Filter_list_testing.wrapper.#.tmp"
        #self.action = action

        loopnames = []
        #self.logger.info(f"Baseparams to check!!: {baseparams}")
        for key, value in baseparams.items():
            check_value = ""
            for param in self.original_action["parameters"]:
                if param["name"] == key:
                    #self.logger.info("PARAM: %s" % param)
                    check_value = param["value"]
                    # self.result_wrapper_count = 0

                octothorpe_count = param["value"].count(".#")
                if octothorpe_count > self.result_wrapper_count:
                    self.result_wrapper_count = octothorpe_count
                    self.logger.info("[INFO] NEW OCTOTHORPE WRAPPER: %d" % octothorpe_count)


            # This whole thing is hard.
            # item = [{"data": "1.2.3.4", "dataType": "ip"}] 
            # $item         = DONT loop items. 
            # $item.#       = Loop items
            # $item.#.data  = Loop items
            # With a single item, this is fine.

            # item = [{"list": [{"data": "1.2.3.4", "dataType": "ip"}]}] 
            # $item                 = DONT loop items
            # $item.#               = Loop items
            # $item.#.list          = DONT loop items
            # $item.#.list.#        = Loop items
            # $item.#.list.#.data   = Loop items
            # If the item itself is a list.. hmm
            
            # FIXME: Check the above, and fix so that nested looped items can be 
            # Skipped if wanted

            #self.logger.info("\nCHECK: %s" % check_value)
            #try:
            #    values = parameter["value_replace"]
            #    if values != None:
            #        self.logger.info(values)
            #        for val in values:
            #            self.logger.info(val)
            #except:
            #    pass

            should_merge = False
            if "#" in check_value:
                should_merge = True

            # Specific for OpenAPI body replacement
            #self.logger.info("\n\n\nDOING STUFF BELOW HERE")
            if not should_merge:
                for parameter in self.original_action["parameters"]:
                    if parameter["name"] == key:
                        #self.logger.info("CHECKING BODY FOR VALUE REPLACE DATA!")
                        try:
                            values = parameter["value_replace"]
                            if values != None:
                                self.logger.info(values)
                                for val in values:
                                    if "#" in val["value"]:
                                        should_merge = True
                                        break
                        except:
                            pass

            #self.logger.info(f"MERGE: {should_merge}")
            if isinstance(value, list):
                self.logger.info(f"[DEBUG] Item {value} is a list.")
                if len(value) <= 1:
                    if len(value) == 1:
                        baseparams[key] = value[0]

                    #if "#" in check_value:
                    #    should_merge = True
                else:
                    if not should_merge: 
                        self.logger.info("[DEBUG] Adding WITHOUT looping list")
                    else:
                        if len(value) not in listlengths:
                            listlengths.append(len(value))

                        listitems.append(
                            {
                                key: len(value)
                            }
                        )
                    
                all_list_keys.append(key)
                all_lists.append(baseparams[key])
            else:
                #self.logger.info(f"{value} is not a list")
                pass

        self.logger.info("[DEBUG] Listlengths: %s" % listlengths)
        if len(listlengths) == 0:
            self.logger.info("[DEBUG] NO multiplier. Running a single iteration.")
            paramlist.append(baseparams)
        elif len(listlengths) == 1:
            self.logger.info("[DEBUG] NO MULTIPLIER NECESSARY. Length is %d" % len(listitems))

            for item in listitems:
                # This loops should always be length 1
                for key, value in item.items():
                    if isinstance(value, int):
                        self.logger.info("\n[DEBUG] Should run key %s %d times from %s" % (key, value, baseparams[key]))
                        if len(paramlist) == value:
                            self.logger.info("[DEBUG] List ALREADY exists - just changing values")
                            for subloop in range(value):
                                baseitem = copy.deepcopy(baseparams)
                                paramlist[subloop][key] = baseparams[key][subloop]
                        else:
                            self.logger.info("[DEBUG] List DOESNT exist - ADDING values")
                            for subloop in range(value):
                                baseitem = copy.deepcopy(baseparams)
                                baseitem[key] = baseparams[key][subloop]
                                paramlist.append(baseitem)
                
        else:
            self.logger.info("[DEBUG] Multipliers to handle: %s" % listitems)
            newlength = 1
            for item in listitems:
                for key, value in item.items():
                    newlength = newlength * value

            self.logger.info("[DEBUG] Newlength of array: %d. Lists: %s" % (newlength, all_lists))
            # Get the cartesian product of the arrays
            #cartesian = await self.cartesian_product(all_lists)
            cartesian = self.cartesian_product(all_lists)
            newlist = []
            for item in cartesian:
                newlist.append(list(item))

            newobject = {}
            for subitem in range(len(newlist)):
                baseitem = copy.deepcopy(baseparams)
                for key in range(len(newlist[subitem])):
                    baseitem[all_list_keys[key]] = newlist[subitem][key]

                paramlist.append(baseitem)

            #self.logger.info("PARAMLIST: %s" % paramlist)

            #newlist[subitem[0]]
            #if len(newlist) > 0:
            #    itemlength = len(newlist[0])

            # How do we get it back, ordered?
            #for item in cartesian:
            #self.logger.info("Listlengths: %s" % listlengths)
            #paramlist = [baseparams]

        #self.logger.info("[INFO] Return paramlist: %s" % paramlist)
        return paramlist
            

    # Runs recursed versions with inner loops and such 
    #async def run_recursed_items(self, func, baseparams, loop_wrapper):
    def run_recursed_items(self, func, baseparams, loop_wrapper):
        #self.logger.info(f"RECURSED ITEMS: {baseparams}")
        has_loop = False

        newparams = {}
        for key, value in baseparams.items():
            if isinstance(value, list) and len(value) > 0:
                self.logger.info(f"[DEBUG] In list check for {key}")

                try:
                    # Added skip for body (OpenAPI) which uses data= in requests
                    # Can be screwed up if they name theirs body too 
                    if key != "body":
                        value[0] = json.loads(value[0])
                except json.decoder.JSONDecodeError as e:
                    self.logger.info("[WARNING] JSON casting error (1): %s" % e)
                except TypeError as e:
                    self.logger.info("[WARNING] TypeError: %s" % e)

                self.logger.info("[DEBUG] POST initial list check")

            try:
                if isinstance(value, list) and len(value) == 1 and isinstance(value[0], list):
                    try:
                        loop_wrapper[key] += 1
                    except Exception as e:
                        self.logger.info("[WARNING] Exception in loop wrapper: {e}")
                        loop_wrapper[key] = 1

                    self.logger.info(f"[DEBUG] Key {key} is a list: {value}")
                    newparams[key] = value[0]
                    has_loop = True 
                else:
                    #self.logger.info(f"Key {key} is NOT a list within a list. Value: {value}")
                    newparams[key] = value
            except Exception as e:
                self.logger.info(f"[WARNING] Error in baseparams list: {e}")
                newparams[key] = value
        
        results = []
        if has_loop:
            #self.logger.info(f"[DEBUG] Should run inner loop: {newparams}")
            self.logger.info(f"[DEBUG] Should run inner loop")
            #ret = await self.run_recursed_items(func, newparams, loop_wrapper)
            ret = self.run_recursed_items(func, newparams, loop_wrapper)
        else:
            #self.logger.info(f"[DEBUG] Should run multiplier check with params (inner): {newparams}")
            self.logger.info(f"[DEBUG] Should run multiplier check with params (inner)")
            # 1. Find the loops that are required and create new multipliers
            # If here: check for multipliers within this scope.
            ret = []
            #param_multiplier = await self.get_param_multipliers(newparams)
            param_multiplier = self.get_param_multipliers(newparams)

            # FIXME: This does a deduplication of the data
            new_params = self.validate_unique_fields(param_multiplier)
            #self.logger.info(f"NEW PARAMS: {new_params}")
            if len(new_params) == 0:
                self.logger.info("[WARNING] SHOULD STOP MULTI-EXECUTION BECAUSE FIELDS AREN'T UNIQUE")
                self.action_result = {
                    "action": self.action,
                    "authorization": self.authorization,
                    "execution_id": self.current_execution_id,
                    "result": f"All {len(param_multiplier)} values were non-unique",
                    "started_at": self.start_time,
                    "status": "SKIPPED",
                    "completed_at": int(time.time()),
                }

                self.send_result(self.action_result, {"Content-Type": "application/json", "Authorization": "Bearer %s" % self.authorization}, "/api/v1/streams")
                if runtime != "run":
                    exit()
                else:
                    return
            else:
                #subparams = new_params
                #self.logger.info(f"NEW PARAMS: {new_params}")
                param_multiplier = new_params

            #self.logger.info("Returned with newparams of length %d", len(new_params))
            #if isinstance(new_params, list) and len(new_params) == 1:
            #    params = new_params[0]
            #else:
            #    self.logger.info("[WARNING] SHOULD STOP EXECUTION BECAUSE FIELDS AREN'T UNIQUE")
            #    action_result["status"] = "SKIPPED"
            #    action_result["result"] = f"A non-unique value was found"  
            #    action_result["completed_at"] = int(time.time())
            #    self.send_result(action_result, headers, stream_path)
            #    return

            self.logger.info("[INFO] Multiplier length: %d" % len(param_multiplier))
            #tmp = ""
            for subparams in param_multiplier:
                #self.logger.info(f"SUBPARAMS IN MULTI: {subparams}")
                try:
                    #tmp = await func(**subparams)

                    while True:
                        try:
                            #tmp = await func(**subparams)
                            tmp = func(**subparams)
                            break
                        except TypeError as e:
                            self.logger.info("BASE TYPEERROR: %s" % e)
                            errorstring = "%s" % e
                            if "got an unexpected keyword argument" in errorstring:
                                fieldsplit = errorstring.split("'")
                                if len(fieldsplit) > 1:
                                    field = fieldsplit[1]
                    
                                    try:
                                        del subparams[field]
                                        self.logger.info("Removed field invalid field %s" % field)
                                    except KeyError:
                                        break
                            else:
                                raise Exception(json.dumps({
                                    "success": False,
                                    "reason": "You may be running an old version of this action. Please delete and remake the node.",
                                    "exception": f"TypeError: {e}",
                                }))
                                break
                                

                except:
                    e = ""
                    try:
                        e = sys.exc_info()[1]
                    except:
                        self.logger.info("Exec check fail: %s" % e)
                        pass

                    tmp = json.dumps({
                        "success": False,
                        "reason": f"An error occured during execution: {e}",
                    })


                # An attempt at decomposing coroutine results
                # Backwards compatibility
                try:
                    if asyncio.iscoroutine(tmp):
                        self.logger.info("[DEBUG] In coroutine (2)")
                        async def parse_value(tmp):
                            value = await asyncio.gather(
                                tmp 
                            )

                            return value[0]


                        tmp = asyncio.run(parse_value(tmp))
                    else:
                        #self.logger.info("[DEBUG] Not in coroutine (2)")
                        pass
                except Exception as e:
                    self.logger.warning("[ERROR] Failed to parse coroutine value for old app: {e}")

                #self.logger.info("RET from execution: %s" % ret)
                new_value = tmp
                if tmp == None:
                    new_value = ""
                elif isinstance(tmp, dict):
                    new_value = json.dumps(tmp)
                elif isinstance(tmp, list):
                    new_value = json.dumps(tmp)
                #else:
                #tmp = tmp.replace("\"", "\\\"", -1)

                try:
                    new_value = json.loads(new_value)
                except json.decoder.JSONDecodeError as e:
                    pass
                except TypeError as e:
                    pass
                except:
                    pass
                        #self.logger.info("Json: %s" % e)
                        #ret.append(tmp)
                
                #if self.result_wrapper_count > 0:
                #    ret.append("["*(self.result_wrapper_count-1)+new_value+"]"*(self.result_wrapper_count-1))
                #else:
                ret.append(new_value)

            self.logger.info("[INFO] Ret length: %d" % len(ret))
            if len(ret) == 1:
                #ret = ret[0]
                self.logger.info("[DEBUG] DONT make list of 1 into 0!!")

        self.logger.info("Return from execution: %s" % ret)
        if ret == None:
            results.append("")
            json_object = False
        elif isinstance(ret, dict):
            results.append(ret)
            json_object = True
        elif isinstance(ret, list):
            results = ret
            json_object = True
        else:
            ret = ret.replace("\"", "\\\"", -1)

            try:
                results.append(json.loads(ret))
                json_object = True
            except json.decoder.JSONDecodeError as e:
                #self.logger.info("Json: %s" % e)
                results.append(ret)
            except TypeError as e:
                results.append(ret)
            except:
                results.append(ret)

        if len(results) == 1: 
            #results = results[0]
            self.logger.info("DONT MAKE LIST FROM 1 TO 0!!")

        self.logger.info("\nLOOP: %s\nRESULTS: %s" % (loop_wrapper, results))
        return results

    # Downloads all files from a namespace
    # Currently only working on local version of Shuffle
    def get_file_category_ids(self, category):
        org_id = self.full_execution["workflow"]["execution_org"]["id"]

        get_path = "/api/v1/files/namespaces/%s?execution_id=%s&ids=true" % (category, self.full_execution["execution_id"])
        headers = {
            "Authorization": "Bearer %s" % self.authorization,
            "User-Agent": "Shuffle 1.1.0",
        }

        ret = requests.get("%s%s" % (self.url, get_path), headers=headers, verify=False)
        return ret.json()
        #if ret1.status_code != 200:
        #    return {
        #        "success": False,
        #        "reason": "Status code is %d from backend for category %s" % category,
        #        "list": [],
        #    }

        #return {
        #    "success": True,
        #    "ids": ret1.json(),
        #}


    # Downloads all files from a namespace
    # Currently only working on local version of Shuffle
    def get_file_namespace(self, namespace):
        org_id = self.full_execution["workflow"]["execution_org"]["id"]

        get_path = "/api/v1/files/namespaces/%s?execution_id=%s" % (namespace, self.full_execution["execution_id"])
        headers = {
            "Authorization": "Bearer %s" % self.authorization,
            "User-Agent": "Shuffle 1.1.0",
        }

        ret1 = requests.get("%s%s" % (self.url, get_path), headers=headers, verify=False)
        if ret1.status_code != 200:
            return None 

        filebytes = BytesIO(ret1.content)
        myzipfile = zipfile.ZipFile(filebytes)

        # Unzip and build here!
        #for member in files.namelist():
        #    filename = os.path.basename(member)
        #    if not filename:
        #        continue

        #    self.logger.info("File: %s" % member)
        #    source = files.open(member)
        #    with open("%s/%s" % (basedir, source.name), "wb+") as tmp:
        #        filedata = source.read()
        #        self.logger.info("Filedata (%s): %s" % (source.name, filedata))
        #        tmp.write(filedata)

        return myzipfile

    def get_file_namespace_ids(self, namespace):
        return self.get_file_category_ids(self, namespace)

    def get_file_category(self, category):
        return self.get_file_namespace(self, category)

    # Things to consider for files:
    # - How can you download / stream a file? 
    # - Can you decide if you want a stream or the files directly?
    def get_file(self, value):
        full_execution = self.full_execution
        org_id = full_execution["workflow"]["execution_org"]["id"]

        self.logger.info("SHOULD GET FILES BASED ON ORG %s, workflow %s and value(s) %s" % (org_id, full_execution["workflow"]["id"], value))

        if isinstance(value, list):
            self.logger.info("IS LIST!")
            #if len(value) == 1:
            #    value = value[0]
        else:
            value = [value]

        returns = []
        for item in value:
            self.logger.info("VALUE: %s" % item)
            if len(item) != 36 and not item.startswith("file_"):
                self.logger.info("Bad length for file value %s" % item)
                continue
                #return {
                #    "filename": "",
                #    "data": "",
                #    "success": False,
                #}

            get_path = "/api/v1/files/%s?execution_id=%s" % (item, full_execution["execution_id"])
            headers = {
                "Content-Type": "application/json",     
                "Authorization": "Bearer %s" % self.authorization,
                "User-Agent": "Shuffle 1.1.0",
            }

            ret1 = requests.get("%s%s" % (self.url, get_path), headers=headers, verify=False)
            self.logger.info("RET1 (file get): %s" % ret1.text)
            if ret1.status_code != 200:
                returns.append({
                    "filename": "",
                    "data": "",
                    "success": False,
                })
                continue

            content_path = "/api/v1/files/%s/content?execution_id=%s" % (item, full_execution["execution_id"])
            ret2 = requests.get("%s%s" % (self.url, content_path), headers=headers, verify=False)
            self.logger.info("RET2 (file get) done")
            if ret2.status_code == 200:
                tmpdata = ret1.json()
                returndata = {
                    "success": True,
                    "filename": tmpdata["filename"],
                    "data": ret2.content,
                }
                returns.append(returndata)

            self.logger.info("RET3 (file get done)")

        if len(returns) == 0:
            return {
                "success": False,
                "filename": "",
                "data": b"",
            }
        elif len(returns) == 1:
            return returns[0]
        else:
            return returns

    def set_cache(self, key, value):
        org_id = self.full_execution["workflow"]["execution_org"]["id"]
        url = "%s/api/v1/orgs/%s/set_cache" % (self.url, org_id)
        data = {
            "workflow_id": self.full_execution["workflow"]["id"],
            "execution_id": self.current_execution_id,
            "authorization": self.authorization,
            "org_id": org_id,
            "key": key,
            "value": str(value),
        }

        response = requests.post(url, json=data, verify=False)
        try:
            allvalues = response.json()
            allvalues["key"] = key
            allvalues["value"] = str(value)
            return allvalues
        except:
            self.logger.info("Value couldn't be parsed")
            #return response.json()
            return {"success": False}

    def get_cache(self, key):
        org_id = self.full_execution["workflow"]["execution_org"]["id"]
        url = "%s/api/v1/orgs/%s/get_cache" % (self.url, org_id)
        data = {
            "workflow_id": self.full_execution["workflow"]["id"],
            "execution_id": self.current_execution_id,
            "authorization": self.authorization,
            "org_id": org_id,
            "key": key,
        }

        value = requests.post(url, json=data, verify=False)
        try:
            allvalues = value.json()
            self.logger.info("VAL1: ", allvalues)
            allvalues["key"] = key 
            self.logger.info("VAL2: ", allvalues)

            try:
                parsedvalue = json.loads(allvalues["value"])
                allvalues["value"] = parsedvalue
            except:
                self.logger.info("Parsing of value as JSON failed. Continue anyway!")

            return allvalues
        except:
            self.logger.info("Value couldn't be parsed, or json dump of value failed")
            #return value.json()
            return {"success": False}

    # Wrapper for set_files
    def set_file(self, infiles):
        return self.set_files(infiles)

    # Sets files in the backend
    def set_files(self, infiles):
        full_execution = self.full_execution
        workflow_id = full_execution["workflow"]["id"]
        org_id = full_execution["workflow"]["execution_org"]["id"]
        headers = {
            "Content-Type": "application/json",     
            "Authorization": "Bearer %s" % self.authorization,
            "User-Agent": "Shuffle 1.1.0",
        }

        if not isinstance(infiles, list):
            infiles = [infiles]

        create_path = "/api/v1/files/create?execution_id=%s" % full_execution["execution_id"]
        file_ids = []
        for curfile in infiles:
            filename = "unspecified"
            data = {
                "filename": filename,
                "workflow_id": workflow_id,
                "org_id": org_id,
            }

            try:
                data["filename"] = curfile["filename"]
                filename = curfile["filename"]
            except KeyError as e:
                self.logger.info(f"KeyError in file setup: {e}")
                pass

            ret = requests.post("%s%s" % (self.url, create_path), headers=headers, json=data, verify=False)
            #self.logger.info(f"Ret CREATE: {ret.text}")
            cur_id = ""
            if ret.status_code == 200:
                #self.logger.info("RET: %s" % ret.text)
                ret_json = ret.json()
                if not ret_json["success"]:
                    self.logger.info("Not success in file upload creation.")
                    continue

                self.logger.info("Should handle ID %s" % ret_json["id"])
                file_ids.append(ret_json["id"])
                cur_id = ret_json["id"]
            else:
                self.logger.info("Bad status code: %d" % ret.status_code)
                continue

            if len(cur_id) == 0:
                self.logger.info("No file ID specified from backend")
                continue

            new_headers = {
                "Authorization": f"Bearer {self.authorization}",
                "User-Agent": "Shuffle 1.1.0",
            }

            upload_path = "/api/v1/files/%s/upload?execution_id=%s" % (cur_id, full_execution["execution_id"])
            self.logger.info("Create path: %s" % create_path)

            files={"shuffle_file": (filename, curfile["data"])}
            #open(filename,'rb')}

            ret = requests.post("%s%s" % (self.url, upload_path), files=files, headers=new_headers, verify=False)
            self.logger.info("Ret UPLOAD: %s" % ret.text)
            self.logger.info("Ret2 UPLOAD: %d" % ret.status_code)

        self.logger.info("IDS TO RETURN: %s" % file_ids)
        return file_ids
    
    #async def execute_action(self, action):
    def execute_action(self, action):
        # !!! Let this line stay - its used for some horrible codegeneration / stitching !!! # 
        #STARTCOPY
        stream_path = "/api/v1/streams"
        self.action_result = {
            "action": action,
            "authorization": self.authorization,
            "execution_id": self.current_execution_id,
            "result": "",
            "started_at": int(time.time()),
            "status": "EXECUTING"
        }

        # Simple validation of parameters in general
        replace_params = False
        try:
            tmp_parameters = action["parameters"]
            for param in tmp_parameters:
                if param["value"] == "SHUFFLE_AUTO_REMOVED":
                    replace_params = True
        except KeyError:
            action["parameters"] = []
        except TypeError:
            pass

        self.action = copy.deepcopy(action)
        self.logger.info(f"[DEBUG] Sending starting action result (EXECUTING). Param replace: {replace_params}")

        headers = {
            "Content-Type": "application/json",     
            "Authorization": f"Bearer {self.authorization}",
            "User-Agent": "Shuffle 1.1.0",
        }

        if len(self.action) == 0:
            self.logger.info("[WARNING] ACTION env not defined")
            self.action_result["result"] = "Error in setup ENV: ACTION not defined"
            self.send_result(self.action_result, headers, stream_path) 
            return

        if len(self.authorization) == 0:
            self.logger.info("[WARING] AUTHORIZATION env not defined")
            self.action_result["result"] = "Error in setup ENV: AUTHORIZATION not defined"
            self.send_result(self.action_result, headers, stream_path) 
            return

        if len(self.current_execution_id) == 0:
            self.logger.info("[WARNING] EXECUTIONID env not defined")
            self.action_result["result"] = "Error in setup ENV: EXECUTIONID not defined"
            self.send_result(self.action_result, headers, stream_path) 
            return


        # Add async logger
        # self.console_logger.handlers[0].stream.set_execution_id()
        #self.logger.info("Before initial stream result")

        # FIXME: Shouldn't skip this, but it's good for minimzing API calls
        #try:
        #    ret = requests.post("%s%s" % (self.base_url, stream_path), headers=headers, json=action_result, verify=False)
        #    self.logger.info("Workflow: %d" % ret.status_code)
        #    if ret.status_code != 200:
        #        self.logger.info(ret.text)
        #except requests.exceptions.ConnectionError as e:
        #    self.logger.info("Connectionerror: %s" %  e)

        #    action_result["result"] = "Bad setup during startup: %s" % e 
        #    self.send_result(action_result, headers, stream_path) 
        #    return

        # Verify whether there are any parameters with ACTION_RESULT required
        # If found, we get the full results list from backend
        fullexecution = {}
        if isinstance(self.full_execution, str) and len(self.full_execution) == 0:
            self.logger.info("[DEBUG] NO EXECUTION - LOADING!")
            try:
                failed = False
                rettext = ""
                for i in range(0, 5):
                    tmpdata = {
                        "authorization": self.authorization,
                        "execution_id": self.current_execution_id
                    }

                    self.logger.info("[ERROR] Before FULLEXEC stream result")
                    ret = requests.post(
                        "%s/api/v1/streams/results" % (self.base_url), 
                        headers=headers, 
                        json=tmpdata,
                        verify=False
                    )

                    if ret.status_code == 200:
                        fullexecution = ret.json()
                        failed = False
                        break

                    #elif ret.status_code == 500 or ret.status_code == 400:
                    elif ret.status_code >= 400:
                        self.logger.info("[ERROR] (fails: %d) Error in app with status code %d for results (1). RETRYING because results can't be handled" % (i+1, ret.status_code))
                    
                        rettext = ret.text
                        failed = True 
                        time.sleep(8)
                        continue

                    else:
                        self.logger.info("[ERROR] Error in app with status code %d for results (2). Crashing because results can't be handled" % ret.status_code)

                        rettext = ret.text
                        failed = True 
                        break

                if failed:
                    self.action_result["result"] = json.dumps({
                        "success": False,
                        "reason": f"Bad result from backend during startup of app: {ret.status_code}",
                        "extended_reason": f"{rettext}"
                    })

                    self.send_result(self.action_result, headers, stream_path) 
                    return

            except requests.exceptions.ConnectionError as e:
                self.logger.info("[ERROR] FullExec Connectionerror: %s" %  e)
                self.action_result["result"] = json.dumps({
                    "success": False,
                    "reason": f"Connection error during startup: {e}"
                })

                self.send_result(self.action_result, headers, stream_path) 
                return
        else:
            self.logger.info(f"[DEBUG] Setting execution to default value with type {type(self.full_execution)}")
            try:
                fullexecution = json.loads(self.full_execution)
            except json.decoder.JSONDecodeError as e:
                self.logger.info("[ERROR] Json decode execution error: %s" % e)  
                self.action_result["result"] = "Json error during startup: %s" % e
                self.send_result(self.action_result, headers, stream_path) 
                return

            self.logger.info("")


        self.full_execution = fullexecution

        #try:
        #    if "backend_url" in self.full_execution:
        #        self.url = self.full_execution["backend_url"]
        #        self.base_url = self.full_execution["backend_url"]
        #except KeyError:
        #    pass

        try:
            if replace_params == True:
                for inner_action in self.full_execution["workflow"]["actions"]:
                    self.logger.info("[DEBUG] ID: %s vs %s" % (inner_action["id"], self.action["id"]))

                    # In case of some kind of magic, we're just doing params
                    if inner_action["id"] == self.action["id"]:
                        self.logger.info("FOUND!")

                        if isinstance(self.action, str):
                            self.logger.info("Params is in string object for self.action?")
                        else:
                            self.action["parameters"] = inner_action["parameters"]
                            self.action_result["action"]["parameters"] = inner_action["parameters"]

                        if isinstance(self.original_action, str):
                            self.logger.info("Params for original actions is in string object?")
                        else:
                            self.original_action["parameters"] = inner_action["parameters"]

                        break

        except Exception as e:
            self.logger.info(f"[WARNING] Failed in replace params action parsing: {e}")

        self.logger.info(f"[DEBUG] AFTER FULLEXEC stream result (init): {self.current_execution_id}")

        # Gets the value at the parenthesis level you want
        def parse_nested_param(string, level):
            """
            Generate strings contained in nested (), indexing i = level
            """
            if len(re.findall("\(", string)) == len(re.findall("\)", string)):
                LeftRightIndex = [x for x in zip(
                [Left.start()+1 for Left in re.finditer('\(', string)], 
                reversed([Right.start() for Right in re.finditer('\)', string)]))]
        
            elif len(re.findall("\(", string)) > len(re.findall("\)", string)):
                return parse_nested_param(string + ')', level)
            elif len(re.findall("\(", string)) < len(re.findall("\)", string)):
                return parse_nested_param('(' + string, level)
            else:
                return 'Failed to parse params'
        
            try:
                return [string[LeftRightIndex[level][0]:LeftRightIndex[level][1]]]
            except IndexError:
                return [string[LeftRightIndex[level+1][0]:LeftRightIndex[level+1][1]]]
        
        # Finds the deepest level parenthesis in a string
        def maxDepth(S): 
            current_max = 0
            max = 0
            n = len(S) 
          
            # Traverse the input string 
            for i in range(n): 
                if S[i] == '(': 
                    current_max += 1
          
                    if current_max > max: 
                        max = current_max 
                elif S[i] == ')': 
                    if current_max > 0: 
                        current_max -= 1
                    else: 
                        return -1
          
            # finally check for unbalanced string 
            if current_max != 0: 
                return -1
          
            return max-1
        
        # Specific type parsing
        def parse_type(data, thistype): 
            if data == None:
                return "Empty"
        
            if "int" in thistype or "number" in thistype:
                try:
                    return int(data)
                except ValueError:
                    return data

            if "lower" in thistype:
                return data.lower()
            if "upper" in thistype:
                return data.upper()
            if "trim" in thistype:
                return data.strip()
            if "strip" in thistype:
                return data.strip()
            if "split" in thistype:
                return data.split()
            if "replace" in thistype:
                splitvalues = data.split(",")

                if len(splitvalues) > 2:
                    for i in range(len(splitvalues)):
                        if i != 0:
                            if splitvalues[i] == "  ":
                                splitvalues[i] = " "
                                continue

                            splitvalues[i] = splitvalues[i].strip()

                            if splitvalues[i] == "\"\"":
                                splitvalues[i] = ""
                            if splitvalues[i] == "\" \"":
                                splitvalues[i] = " "
                            if len(splitvalues[i]) > 2:
                                if splitvalues[i][0] == "\"" and splitvalues[i][len(splitvalues[i])-1] == "\"":
                                    splitvalues[i] = splitvalues[i][1:-1]
                                if splitvalues[i][0] == "'" and splitvalues[i][len(splitvalues[i])-1] == "'":
                                    splitvalues[i] = splitvalues[i][1:-1]
                            

                    replacementvalue = splitvalues[0]
                    return replacementvalue.replace(splitvalues[1], splitvalues[2], -1) 
                else: 
                    return f"replace({data})"
            if "join" in thistype:
                try:
                    splitvalues = data.split(",")
                    if "," not in data:
                        return f"join({data})"

                    if len(splitvalues) >= 2:

                        # 1. Take the list and parse it from string
                        # 2. Take all the items and join them
                        # 3. Parse them back as string and return
                        values = ",".join(splitvalues[0:-1])
                        tmp = json.loads(values)
                        try:
                            newvalues = splitvalues[-1].join(str(item).strip() for item in tmp)
                        except TypeError:
                            newvalues = splitvalues[-1].join(json.dumps(item).strip() for item in tmp)

                        return newvalues
                    else:
                        return f"join({data})"

                except (KeyError, IndexError) as e:
                    print(f"ERROR in join(): {e}")
                except json.decoder.JSONDecodeError as e:
                    print(f"JSON ERROR in join(): {e}")

            if "len" in thistype or "length" in thistype or "lenght" in thistype:
                #self.logger.info(f"Trying to length-parse: {data}")
                try:
                    tmp_len = json.loads(data, parse_float=str, parse_int=str, parse_constant=str)
                except (NameError, KeyError, TypeError, json.decoder.JSONDecodeError) as e:
                    try:
                        #self.logger.info(f"[WARNING] INITIAL Parsing bug for length in app sdk: {e}")
                        # data = data.replace("\'", "\"")
                        data = data.replace("True", "true")
                        data = data.replace("False", "false")
                        data = data.replace("None", "null")
                        data = data.replace("\"", "\\\"")
                        data = data.replace("'", "\"")

                        tmp_len = json.loads(data, parse_float=str, parse_int=str, parse_constant=str)
                    except (NameError, KeyError, TypeError, json.decoder.JSONDecodeError) as e:
                        tmp_len = str(data)

                return str(len(tmp_len))

            if "parse" in thistype:
                splitvalues = []
                default_error = """Error. Expected syntax: parse(["hello","test1"],0:1)""" 
                if "," in data:
                    splitvalues = data.split(",")

                    for item in range(len(splitvalues)):
                        splitvalues[item] = splitvalues[item].strip()
                else:
                    return default_error 

                lastsplit = []
                if ":" in splitvalues[-1]:
                    lastsplit = splitvalues[-1].split(":")
                else:
                    try:
                        lastsplit = [int(splitvalues[-1])]
                    except ValueError:
                        return default_error

                try:
                    parsedlist = ",".join(splitvalues[0:-1])
                    if len(lastsplit) > 1:
                        tmp = json.loads(parsedlist)[int(lastsplit[0]):int(lastsplit[1])]
                    else:
                        tmp = json.loads(parsedlist)[lastsplit[0]]

                    return tmp
                except IndexError as e:
                    return default_error

        # Parses the INNER value and recurses until everything is done
        # Looks for a way to use e.g. int() or number() as a value
        def parse_wrapper(data):
            try:
                if "(" not in data or ")" not in data:
                    return data, False
            except TypeError:
                return data, False

            # Because liquid can handle ALL of this now.
            # Implemented for >0.9.25
            #self.logger.info("[DEBUG] Skipping parser because use of its been deprecated >0.9.25 due to Liquid implementation")
            return data, False

            wrappers = ["int", "number", "lower", "upper", "trim", "strip", "split", "parse", "len", "length", "lenght", "join", "replace"]

            if not any(wrapper in data for wrapper in wrappers):
                return data, False

            # Do stuff here.
            inner_value = parse_nested_param(data, maxDepth(data) - 0)
            outer_value = parse_nested_param(data, maxDepth(data) - 1)

            wrapper_group = "|".join(wrappers)
            parse_string = data
            max_depth = maxDepth(parse_string)

            if outer_value != inner_value:
                for casting_items in reversed(range(max_depth + 1)):
                    c_parentheses = parse_nested_param(parse_string, casting_items)[0]
                    match_string = re.escape(c_parentheses)
                    custom_casting = re.findall(fr"({wrapper_group})\({match_string}", parse_string)

                    # no matching ; go next group
                    if len(custom_casting) == 0:
                        continue

                    inner_result = parse_type(c_parentheses, custom_casting[0])

                    # if result is a string then parse else return
                    if isinstance(inner_result, str):
                        parse_string = parse_string.replace(f"{custom_casting[0]}({c_parentheses})", inner_result)
                    elif isinstance(inner_result, list):
                        parse_string = parse_string.replace(f"{custom_casting[0]}({c_parentheses})",
                                                            json.dumps(inner_result))
                    else:
                        parse_string = inner_result
                        break
            else:
                c_parentheses = parse_nested_param(parse_string, 0)[0]
                match_string = re.escape(c_parentheses)
                custom_casting = re.findall(fr"({wrapper_group})\({match_string}", parse_string)
                print("[DEBUG] In ELSE: %s" % custom_casting)
                # check if a wrapper was found
                if len(custom_casting) != 0:
                    inner_result = parse_type(c_parentheses, custom_casting[0])
                    if isinstance(inner_result, str):
                        parse_string = parse_string.replace(f"{custom_casting[0]}({c_parentheses})", inner_result)
                    elif isinstance(inner_result, list):
                        parse_string = parse_string.replace(f"{custom_casting[0]}({c_parentheses})",
                                                            json.dumps(inner_result))
                    else:
                        parse_string = inner_result

            print("PARSE STRING: %s" % parse_string)
            return parse_string, True

        # Looks for parantheses to grab special cases within a string, e.g:
        # int(1) lower(HELLO) or length(what's the length)
        # FIXME: 
        # There is an issue in here where it returns data wrong. Example:
        # Authorization=Bearer authkey
        # =
        # Authorization=Bearer  authkey
        # ^ Double space.
        def parse_wrapper_start(data, self):
            try:
                data = parse_liquid(data, self)
            except:
                pass

            if "(" not in data or ")" not in data:
                return data

            if isinstance(data, str) and len(data) > 4:
                if (data[0] == "{" or data[0] == "[") and (data[len(data)-1] == "]" or data[len(data)-1] == "}"):
                    self.logger.info("[DEBUG] Skipping parser because use of {[ and ]}")
                    return data

            newdata = []
            newstring = ""
            record = True
            paranCnt = 0
            charcnt = 0 
            for char in data:
                if char == "(":
                    charskip = False
                    if charcnt > 0:
                        if data[charcnt-1] == " ":
                            charskip = True 

                    if not charskip:
                        paranCnt += 1
            
                        if not record:
                            record = True 
        
                if record:
                    newstring += char
        
                if paranCnt == 0 and char == " ":
                    newdata.append(newstring)
                    newstring = ""
                    record = True
        
                if char == ")":
                    paranCnt -= 1
        
                    if paranCnt == 0:
                        record = False
            
                charcnt += 1
        
            if len(newstring) > 0:
                newdata.append(newstring)
        
            parsedlist = []
            non_string = False
            parsed = False
            for item in newdata:
                ret = parse_wrapper(item)
                if not isinstance(ret[0], str):
                    non_string = True
            
                parsedlist.append(ret[0])
                if ret[1]:
                    parsed = True
            
            if not parsed:
                return data
        
            if len(parsedlist) > 0 and not non_string:
                #self.logger.info("Returning parsed list: ", parsedlist)
                return " ".join(parsedlist)
            elif len(parsedlist) == 1 and non_string:
                return parsedlist[0]
            else:
                #self.logger.info("Casting back to string because multi: ", parsedlist)
                newlist = []
                for item in parsedlist:
                    try:
                        newlist.append(str(item))
                    except ValueError:
                        newlist.append("parsing_error")

                # Does this create the issue?
                return " ".join(newlist)

        # Parses JSON loops and such down to the item you're looking for
        # $nodename.#.id 
        # $nodename.data.#min-max.info.id
        def recurse_json(basejson, parsersplit):
            match = "#([0-9a-z]+):?-?([0-9a-z]+)?#?"
            try:
                outercnt = 0

                # Loops over split values
                for value in parsersplit:
                    #if " " in value:
                    #    value = value.replace(" ", "_", -1)

                    actualitem = re.findall(match, value, re.MULTILINE)
                    # Goes here if loop 
                    if value == "#":
                        newvalue = []
                        for innervalue in basejson:
                            # 1. Check the next item (message)
                            # 2. Call this function again
        
                            try:
                                ret, is_loop = recurse_json(innervalue, parsersplit[outercnt+1:])
                            except IndexError:
                                # Only in here if it's the last loop without anything in it?
                                ret, is_loop = recurse_json(innervalue, parsersplit[outercnt:])
                                
                            newvalue.append(ret)
                        
                        # Magical way of returning which makes app sdk identify 
                        # it as multi execution
                        return newvalue, True

                    # Checks specific regex like #1-2 for index 1-2 in a loop
                    elif len(actualitem) > 0:

                        is_loop = True
                        newvalue = []
                        firstitem = actualitem[0][0]
                        seconditem = actualitem[0][1]
                        if isinstance(firstitem, int):
                            firstitem = str(firstitem)
                        if isinstance(seconditem, int):
                            seconditem = str(seconditem)

                        print("[DEBUG] ACTUAL PARSED: %s" % actualitem)

                        # Means it's a single item -> continue
                        if seconditem == "":
                            print("[INFO] In first - handling %s. Len: %d" % (firstitem, len(basejson)))
                            if firstitem.lower() == "max" or firstitem.lower() == "last" or firstitem.lower() == "end": 
                                firstitem = len(basejson)-1
                            elif firstitem.lower() == "min" or firstitem.lower() == "first": 
                                firstitem = 0
                            else:
                                firstitem = int(firstitem)

                            print(f"[DEBUG] Post lower checks with item {firstitem}")
                            tmpitem = basejson[int(firstitem)]
                            try:
                                newvalue, is_loop = recurse_json(tmpitem, parsersplit[outercnt+1:])
                            except IndexError:
                                newvalue, is_loop = (tmpitem, parsersplit[outercnt+1:])
                        else:
                            print("[INFO] In ELSE - handling %s and %s" % (firstitem, seconditem))
                            if isinstance(firstitem, str):
                                if firstitem.lower() == "max" or firstitem.lower() == "last" or firstitem.lower() == "end": 
                                    firstitem = len(basejson)-1
                                elif firstitem.lower() == "min" or firstitem.lower() == "first": 
                                    firstitem = 0
                                else:
                                    firstitem = int(firstitem)
                            else:
                                firstitem = int(firstitem)

                            if isinstance(seconditem, str): 
                                if seconditem.lower() == "max" or seconditem.lower() == "last" or firstitem.lower() == "end": 
                                    seconditem = len(basejson)-1
                                elif seconditem.lower() == "min" or seconditem.lower() == "first": 
                                    seconditem = 0
                                else:
                                    seconditem = int(seconditem)
                            else:
                                seconditem = int(seconditem)

                            print(f"[DEBUG] Post lower checks 2: {firstitem} AND {seconditem}")
                            newvalue = []
                            if int(seconditem) > len(basejson):
                                seconditem = len(basejson)

                            for i in range(int(firstitem), int(seconditem)+1):
                                # 1. Check the next item (message)
                                # 2. Call this function again
                                #self.logger.info("Base: %s" % basejson[i])

                                try:
                                    ret, tmp_loop = recurse_json(basejson[i], parsersplit[outercnt+1:])
                                except IndexError:
                                    print("[DEBUG] INDEXERROR: ", parsersplit[outercnt])
                                    #ret = innervalue
                                    ret, tmp_loop = recurse_json(basejson[i], parsersplit[outercnt:])
                                    
                                newvalue.append(ret)

                        return newvalue, is_loop 

                    else:
                        if len(value) == 0:
                            return basejson, False
        
                        try:
                            if isinstance(basejson, list): 
                                print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (list): %s" % value)
                                return basejson, False
                            elif isinstance(basejson[value], str):
                                try:
                                    if (basejson[value].endswith("}") and basejson[value].endswith("}")) or (basejson[value].startswith("[") and basejson[value].endswith("]")):
                                        basejson = json.loads(basejson[value])
                                    else:
                                        return str(basejson[value]), False
                                except json.decoder.JSONDecodeError as e:
                                    return str(basejson[value]), False
                            else:
                                basejson = basejson[value]
                        except KeyError as e:
                            print("[WARNING] Running secondary value check with replacement of underscore in %s: %s" % (value, e))
                            if "_" in value:
                                value = value.replace("_", " ", -1)
                            elif " " in value:
                                value = value.replace(" ", "_", -1)

                            if isinstance(basejson, list): 
                                print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (list): %s" % value)
                                return basejson, False
                            elif isinstance(basejson[value], str):
                                print(f"[INFO] LOADING STRING '%s' AS JSON" % basejson[value]) 
                                try:
                                    print("[DEBUG] BASEJSON: %s" % basejson)
                                    if (basejson[value].endswith("}") and basejson[value].endswith("}")) or (basejson[value].startswith("[") and basejson[value].endswith("]")):
                                        basejson = json.loads(basejson[value])
                                    else:
                                        return str(basejson[value]), False
                                except json.decoder.JSONDecodeError as e:
                                    print("[DEBUG] RETURNING BECAUSE '%s' IS A NORMAL STRING (1)" % basejson[value])
                                    return str(basejson[value]), False
                            else:
                                basejson = basejson[value]
                            

                    outercnt += 1
        
            except KeyError as e:
                print("[INFO] Lower keyerror: %s" % e)
                return "", False

                #return basejson
                #return "KeyError: Couldn't find key: %s" % e

            return basejson, False

        # Takes a workflow execution as argument
        # Returns a string if the result is single, or a list if it's a list
        def get_json_value(execution_data, input_data):
            parsersplit = input_data.split(".")
            actionname_lower = parsersplit[0][1:].lower()

            #Actionname: Start_node
            print(f"\n[INFO] Actionname: {actionname_lower}")

            # 1. Find the action
            baseresult = ""

            appendresult = "" 
            print("[INFO] Parsersplit length: %d" % len(parsersplit))
            if (actionname_lower.startswith("exec ") or actionname_lower.startswith("webhook ") or actionname_lower.startswith("schedule ") or actionname_lower.startswith("userinput ") or actionname_lower.startswith("email_trigger ") or actionname_lower.startswith("trigger ")) and len(parsersplit) == 1:
                record = False
                for char in actionname_lower:
                    if char == " ":
                        record = True

                    if record:
                        appendresult += char

                actionname_lower = "exec"
            elif actionname_lower.startswith("shuffle_cache ") or actionname_lower.startswith("shuffle_db "): 
                actionname_lower = "shuffle_cache"

            actionname_lower = actionname_lower.replace(" ", "_", -1)

            try: 
                if actionname_lower == "exec" or actionname_lower == "webhook" or actionname_lower == "schedule" or actionname_lower == "userinput" or actionname_lower == "email_trigger" or actionname_lower == "trigger": 
                    baseresult = execution_data["execution_argument"]
                elif actionname_lower == "shuffle_cache":
                    print("[DEBUG] SHOULD GET CACHE KEY: %s" % parsersplit) 
                    if len(parsersplit) > 1:
                        actual_key = parsersplit[1]
                        print("[DEBUG] KEY: %s" % actual_key)
                        cachedata = self.get_cache(actual_key)
                        print("CACHE: %s" % cachedata)
                        parsersplit.pop(1)
                        try:
                            baseresult = json.dumps(cachedata)
                        except json.decoder.JSONDecodeError as e:
                            print("[WARNING] Failed json dumping: %s" % e)

                else:
                    if execution_data["results"] != None:
                        for result in execution_data["results"]:
                            resultlabel = result["action"]["label"].replace(" ", "_", -1).lower()
                            if resultlabel.lower() == actionname_lower:
                                baseresult = result["result"]
                                break
                    else:
                        print("[DEBUG] No results to get values from.")
                        baseresult = "$" + parsersplit[0][1:] 
                    
                    print("[DEBUG] BEFORE VARIABLES!")
                    if len(baseresult) == 0:
                        try:
                            for variable in execution_data["workflow"]["workflow_variables"]:
                                variablename = variable["name"].replace(" ", "_", -1).lower()
        
                                if variablename.lower() == actionname_lower:
                                    baseresult = variable["value"]
                                    break

                        except KeyError as e:
                            print("[INFO] KeyError wf variables: %s" % e)
                            pass
                        except TypeError as e:
                            print("[INFO] TypeError wf variables: %s" % e)
                            pass
        
                    print("[DEBUG] BEFORE EXECUTION VAR")
                    if len(baseresult) == 0:
                        try:
                            for variable in execution_data["execution_variables"]:
                                variablename = variable["name"].replace(" ", "_", -1).lower()
                                if variablename.lower() == actionname_lower:
                                    baseresult = variable["value"]
                                    break
                        except KeyError as e:
                            #print("[INFO] KeyError exec variables: %s" % e)
                            pass
                        except TypeError as e:
                            #print("[INFO] TypeError exec variables: %s" % e)
                            pass
        
            except KeyError as error:
                print(f"[DEBUG] KeyError in JSON: {error}")
        
            print(f"[INFO] After first trycatch. Baseresult")#, baseresult)
        
            # 2. Find the JSON data
            # Returns if there isn't any JSON in the base ($nodename)
            if len(baseresult) == 0:
                return ""+appendresult, False
        
            print("[INFO] After second return")
            # Returns if the result is JUST something like $nodename, not $nodename.value
            if len(parsersplit) == 1:
                returndata = str(baseresult)+str(appendresult)
                print("[DEBUG] RETURNING!")#: %s" % returndata)
                return returndata, False
        
            baseresult = baseresult.replace(" True,", " true,")
            baseresult = baseresult.replace(" False", " false,")

            # Tries to actually read it as JSON with some stupid formatting
            print("[INFO] After third parser return - Formatted")#, baseresult)
            basejson = {}
            try:
                basejson = json.loads(baseresult)
            except json.decoder.JSONDecodeError as e:
                try:
                    baseresult = baseresult.replace("\'", "\"")
                    basejson = json.loads(baseresult)
                except json.decoder.JSONDecodeError as e:
                    print(f"[ERROR] Parser issue with JSON for {baseresult}: {e}")
                    return str(baseresult)+str(appendresult), False

            print("[INFO] After fourth parser return as JSON")
            # Finds the ACTUAL value which is in the $nodename.value.test - focusing on value.test
            data, is_loop = recurse_json(basejson, parsersplit[1:])
            parseditem = data

            if isinstance(parseditem, dict) or isinstance(parseditem, list):
                try:
                    parseditem = json.dumps(parseditem)
                except json.decoder.JSONDecodeError as e:
                    print("[WARNING] Parseditem issue: %s" % e)
                    pass

            print("[DEBUG] DATA: (%s) %s" % (type(data), data))
            if is_loop:
                print("[DEBUG] DATA IS A LOOP - SHOULD WRAP")
                if parsersplit[-1] == "#":
                    print("[WARNING] SET DATA WRAPPER TO NORMAL!")
                    parseditem = "${SHUFFLE_NO_SPLITTER%s}$" % json.dumps(data)
                else:
                    # Return value: ${id[12345, 45678]}$
                    print("[WARNING] SET DATA WRAPPER TO %s!" % parsersplit[-1])
                    parseditem = "${%s%s}$" % (parsersplit[-1], json.dumps(data))


            print("[DEBUG] Before last return with %s" % appendresult)
            returndata = str(parseditem)+str(appendresult)

            # New in 0.8.97: Don't return items without lists
            #self.logger.info("RETURNDATA: %s" % returndata)
            #return returndata, is_loop

            # 0.9.70:
            # The {} and [] checks are required because e.g. 7e7 is valid JSON for some reason...
            # This breaks EVERYTHING
            try:
                if (returndata.endswith("}") and returndata.endswith("}")) or (returndata.startswith("[") and returndata.endswith("]")):
                    return json.dumps(json.loads(returndata)), is_loop
                else:
                    return returndata, is_loop
            except json.decoder.JSONDecodeError as e:
                return returndata, is_loop

        # Sending self as it's not a normal function
        def parse_liquid(template, self):
            
            errors = False
            error_msg = ""
            try:
                if len(template) > 10000000:
                    self.logger.info("[DEBUG] Skipping liquid - size too big (%d)" % len(template))
                    return template

                if "${" in template and "}$" in template:
                    self.logger.info("[DEBUG] Shuffle loop shouldn't run in liquid. Data length: %d" % len(template))
                    return template

                #if not "{{" in template or not "}}" in template: 
                #    if not "{%" in template or not "%}" in template: 
                #        self.logger.info("Skipping liquid - missing {{ }} and {% %}")
                #        return template

                #if not "{{" in template or not "}}" in template: 
                #    return template

                #self.logger.info(globals())
                #if len(template) > 100:
                #    self.logger.info("[DEBUG] Running liquid with data of length %d" % len(template))
                #self.logger.info(f"[DEBUG] Data: {template}")
                run = Liquid(template, mode="wild", from_file=False, filters=shuffle_filters.filters)

                # Can't handle self yet (?)
                ret = run.render(**globals())
                return ret
            except jinja2.exceptions.TemplateNotFound as e:
                self.logger.info(f"[ERROR] Liquid Template error: {e}")
                error = True
                error_msg = e

                self.action["parameters"].append({
                    "name": "liquid_template_error",
                    "value": f"There was a Liquid input error (1). Details: {e}",
                })

                self.action_result["action"] = self.action
            except SyntaxError as e:
                self.logger.info(f"[ERROR] Liquid Syntax error: {e}")
                error = True
                error_msg = e

                self.action["parameters"].append({
                    "name": "liquid_python_syntax_error",
                    "value": f"There was a syntax error in your Liquid input (2). Details: {e}",
                })

                self.action_result["action"] = self.action
            except IndentationError as e:
                self.logger.info(f"[ERROR] Liquid IndentationError: {e}")
                error = True
                error_msg = e

                self.action["parameters"].append({
                    "name": "liquid_indentiation_error",
                    "value": f"There was an indentation error in your Liquid input (2). Details: {e}",
                })

                self.action_result["action"] = self.action
            except jinja2.exceptions.TemplateSyntaxError as e:
                self.logger.info(f"[ERROR] Liquid Syntax error: {e}")
                error = True
                error_msg = e

                self.action["parameters"].append({
                    "name": "liquid_syntax_error",
                    "value": f"There was a syntax error in your Liquid input (2). Details: {e}",
                })

                self.action_result["action"] = self.action
            except json.decoder.JSONDecodeError as e:
                self.logger.info(f"[ERROR] Liquid JSON Syntax error: {e}")
                
                replace = False
                skip_next = False
                newlines = []
                thisline = []
                for line in template.split("\n"):
                    #print("LINE: %s" % repr(line))
                    if "\"\"\"" in line or "\'\'\'" in line:
                        if replace:
                            skip_next = True
                        else:
                            replace = not replace 

                    if replace == True:
                        thisline.append(line)
                        if skip_next == True:
                            if len(thisline) > 0:
                                #print(thisline)
                                newlines.append(" ".join(thisline))
                                thisline = []

                            replace = False
                    else:
                        newlines.append(line)

                new_template = "\n".join(newlines)
                if new_template != template:
                    #check_template(new_template)
                    return parse_liquid(new_template, self)
                else:
                    error = True
                    error_msg = e

                    self.action["parameters"].append({
                        "name": "liquid_json_error",
                        "value": f"There was a syntax error in your input JSON(2). This is typically an issue with escaping newlines. Details: {e}",
                    })

                    self.action_result["action"] = self.action
            except TypeError as e:
                try:
                    if "string as left operand" in f"{e}":
                        #print(f"HANDLE REPLACE: {template}")
                        split_left = template.split("|")
                        if len(split_left) < 2:
                            return template

                        splititem = split_left[0]
                        additem = "{{"
                        if "{{" in splititem:
                            splititem = splititem.replace("{{", "", -1)

                        if "{%" in splititem:
                            splititem = splititem.replace("{%", "", -1)
                            additem = "{%"

                        splititem = "%s \"%s\"" % (additem, splititem.strip())
                        parsed_template = template.replace(split_left[0], splititem)
                        run = Liquid(parsed_template, mode="wild", from_file=False)
                        return run.render(**globals())

                except Exception as e:
                    print(f"SubError in Liquid: {e}")

                    self.action["parameters"].append({
                        "name": "liquid_general_error",
                        "value": f"There was general error Liquid input (2). Details: {e}",
                    })

                    self.action_result["action"] = self.action
                    #return template

                self.logger.info(f"[ERROR] Liquid TypeError error: {e}")
                error = True
                error_msg = e

            except Exception as e:
                self.logger.info(f"[ERROR] General exception for liquid: {e}")
                error = True
                error_msg = e

                self.action["parameters"].append({
                    "name": "liquid_general_exception",
                    "value": f"There was general exception Liquid input (2). Details: {e}",
                })

                self.action_result["action"] = self.action

            if "fmt" in error_msg and "liquid_date" in error_msg:
                return template

            self.logger.info("Done in liquid")
            if error == True:
                self.action_result["status"] = "FAILURE" 
                data = {
                    "success": False,
                    "reason": f"Failed to parse LiquidPy: {error_msg}",
                    "input": template,
                }

                try:
                    self.action_result["result"] = json.dumps(data)
                except Exception as e:
                    self.action_result["result"] = f"Failed to parse LiquidPy: {error_msg}"
                    print("[WARNING] Failed to set LiquidPy result")

                self.action_result["completed_at"] = int(time.time())
                self.send_result(self.action_result, headers, stream_path)

                self.logger.info(f"[ERROR] Sent FAILURE response to backend due to : {e}")
        
                if runtime == "run":
                    return template
                else:
                    os.exit()

            return template

        # Suboptimal cleanup script for BOdy parsing of OpenAPI
        # Should have a regex which looks for the value, then goes out and cleans up the key
        def recurse_cleanup_script(data):
            deletekeys = []
            newvalue = data
            try:
                if not isinstance(data, dict):
                    newvalue = json.loads(data)
                else:
                    newvalue = data
        
                for key, value in newvalue.items():
                    if isinstance(value, str) and len(value) == 0:
                        deletekeys.append(key)
                        continue
                            
                    if isinstance(value, list):
                        try:
                            value = json.dumps(value)
                        except:
                            print("[WARNING] Json parsing issue in recursed value")
                            pass
        
                    if value == "${%s}" % key:
                        print("[WARNING] Deleting %s because key = value" % key)
                        deletekeys.append(key)
                        continue
                    elif "${" in value and "}" in value:
                        print("[WARNING] Deleting %s because it contains ${ and }" % key)
                        deletekeys.append(key)
                        continue
        
                    if isinstance(value, dict):
                        newvalue[key] = recurse_cleanup_script(value)
        
            except json.decoder.JSONDecodeError as e:
                # Since here the data isn't at all JSON compatible..?
                # Seems to happen with newlines in variables being parsed in as strings?
                print(f"[ERROR] Failed JSON replacement for OpenAPI keys (3) {e}. Value: {data}")
            except Exception as e:
                print(f"[ERROR] Failed as an exception (1): {e}") 
                
            try:
                for deletekey in deletekeys:
                    try:
                        del newvalue[deletekey]
                    except:
                        pass
            except Exception as e:
                print(f"[WARNING] Failed in deletekeys: {e}") 
                return data
        
            try:
                for key, value in newvalue.items():
                    if isinstance(value, bool):
                        continue
                    elif isinstance(value, dict) and not bool(value):
                        continue
        
                    try:
                        value = json.loads(value)
                        newvalue[key] = value
                    except json.decoder.JSONDecodeError as e:
                        continue
                    except Exception as e:
                        continue
        
                try:
                    data = json.dumps(newvalue)
                except json.decoder.JSONDecodeError as e:
                    print("[WARNING] JsonDecodeError: %s" % e)
                    data = newvalue
        
            except json.decoder.JSONDecodeError as e:
                print("[WARNING] Failed JSON replacement for OpenAPI keys (2) {e}")
            except Exception as e:
                print(f"[WARNING] Failed as an exception (2): {e}") 
        
            return data 

        # Parses parameters sent to it and returns whether it did it successfully with the values found
        def parse_params(action, fullexecution, parameter, self):
            # Skip if it starts with $?
            jsonparsevalue = "$."
            is_loop = False

            # Matches with space in the first part, but not in subsequent parts.
            # JSON / yaml etc shouldn't have spaces in their fields anyway.
            #match = ".*?([$]{1}([a-zA-Z0-9 _-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,})[$/, ]?"
            #match = ".*?([$]{1}([a-zA-Z0-9 _-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,})"

            #match = ".*?([$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,})" # Removed space - no longer ok. Force underscore.
            match = "([$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,})" # Removed .*? to make it work with large amounts of data

            # Extra replacements for certain scenarios
            escaped_dollar = "\\$"
            escape_replacement = "\\%\\%\\%\\%\\%"
            end_variable = "^_^"

            #self.logger.info("Input value: %s" % parameter["value"])
            try:
                parameter["value"] = parameter["value"].replace(escaped_dollar, escape_replacement, -1)
            except:
                self.logger.info("Error in initial replacement of escaped dollar!")

            paramname = ""
            try:
                paramname = parameter["name"]
            except:
                pass

            # Basic fix in case variant isn't set
            # Variant is ALWAYS STATIC_VALUE from mid 2021~ 
            try:
                self.logger.info(f"[DEBUG] Parameter '{paramname}' of length {len(parameter['value'])}")
                parameter["variant"] = parameter["variant"]
            except:
                parameter["variant"] = "STATIC_VALUE"

            # Regex to find all the things
            # Should just go in here if data is ... not so big
            #if parameter["variant"] == "STATIC_VALUE" and len(parameter["value"]) < 1000000:
            #if parameter["variant"] == "STATIC_VALUE" and len(parameter["value"]) < 5000000:
            if parameter["variant"] == "STATIC_VALUE":
                data = parameter["value"]
                actualitem = re.findall(match, data, re.MULTILINE)
                #self.logger.debug(f"\n\nHandle static data with JSON: {data}\n\n")
                #self.logger.info("STATIC PARSED: %s" % actualitem)
                #self.logger.info("[INFO] Done with regex matching")
                if len(actualitem) > 0:
                    for replace in actualitem:
                        try:
                            to_be_replaced = replace[0]
                        except IndexError:
                            continue

                        # Handles for loops etc. 
                        # FIXME: Should it dump to string here? Doesn't that defeat the purpose?
                        # Trying without string dumping.

                        value, is_loop = get_json_value(fullexecution, to_be_replaced) 
                        #self.logger.info(f"\n\nType of value: {type(value)}")
                        if isinstance(value, str):
                            parameter["value"] = parameter["value"].replace(to_be_replaced, value)
                        elif isinstance(value, dict) or isinstance(value, list):
                            # Changed from JSON dump to str() 28.05.2021
                            # This makes it so the parameters gets lists and dicts straight up
                            parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))

                            #try:
                            #    parameter["value"] = parameter["value"].replace(to_be_replaced, str(value))
                            #except:
                            #    parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                            #    self.logger.info("Failed parsing value as string?")
                        else:
                            self.logger.info("[WARNING] Unknown type %s" % type(value))
                            try:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                            except json.decoder.JSONDecodeError as e:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, value)

                        #self.logger.info("VALUE: %s" % parameter["value"])
            else:
                self.logger.info(f"[ERROR] Not running static variant regex parsing (slow) on value with length {len(parameter['value'])}. Max is 5Mb~.")

            if parameter["variant"] == "WORKFLOW_VARIABLE":
                self.logger.info("[DEBUG] Handling workflow variable")
                found = False
                try:
                    for item in fullexecution["workflow"]["workflow_variables"]:
                        if parameter["action_field"] == item["name"]:
                            found = True
                            parameter["value"] = item["value"]
                            break
                except KeyError as e:
                    self.logger.info("KeyError WF variable 1: %s" % e)
                    pass
                except TypeError as e:
                    self.logger.info("TypeError WF variables 1: %s" % e)
                    pass

                if not found:
                    try:
                        for item in fullexecution["execution_variables"]:
                            if parameter["action_field"] == item["name"]:
                                parameter["value"] = item["value"]
                                break
                    except KeyError as e:
                        self.logger.info("KeyError WF variable 2: %s" % e)
                        pass
                    except TypeError as e:
                        self.logger.info("TypeError WF variables 2: %s" % e)
                        pass

            elif parameter["variant"] == "ACTION_RESULT":
                # FIXME - calculate value based on action_field and $if prominent
                # FIND THE RIGHT LABEL
                # GET THE LABEL'S RESULT 
                
                tmpvalue = ""
                self.logger.info("ACTION FIELD: %s" % parameter["action_field"])

                fullname = "$"
                if parameter["action_field"] == "Execution Argument":
                    tmpvalue = fullexecution["execution_argument"]
                    fullname += "exec"
                else:
                    fullname += parameter["action_field"]

                self.logger.info("PRE Fullname: %s" % fullname)

                if parameter["value"].startswith(jsonparsevalue):
                    fullname += parameter["value"][1:]
                #else:
                #    fullname = "$%s" % parameter["action_field"]

                self.logger.info("Fullname: %s" % fullname)
                actualitem = re.findall(match, fullname, re.MULTILINE)
                self.logger.info("ACTION PARSED: %s" % actualitem)
                if len(actualitem) > 0:
                    for replace in actualitem:
                        try:
                            to_be_replaced = replace[0]
                        except IndexError:
                            self.logger.info("Nothing to replace?: " % e)
                            continue
                        
                        # This will never be a loop aka multi argument
                        parameter["value"] = to_be_replaced 

                        value, is_loop = get_json_value(fullexecution, to_be_replaced)
                        self.logger.info("Loop: %s" % is_loop)
                        if isinstance(value, str):
                            parameter["value"] = parameter["value"].replace(to_be_replaced, value)
                        elif isinstance(value, dict):
                            parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                        else:
                            self.logger.info("Unknown type %s" % type(value))
                            try:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                            except json.decoder.JSONDecodeError as e:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, value)

            #self.logger.info("PRE Replaced data: %s" % parameter["value"])

            try:
                parameter["value"] = parameter["value"].replace(end_variable, "", -1)
                parameter["value"] = parameter["value"].replace(escape_replacement, "$", -1)
            except:
                self.logger.info(f"[ERROR] Problem in datareplacement: {e}")

            # Just here in case it breaks 
            # Implemented 02.08.2021
            #self.logger.info("Pre liquid: %s" % parameter["value"])
            try:
                parameter["value"] = parse_liquid(parameter["value"], self)
            except:
                pass

            return "", parameter["value"], is_loop

        def run_validation(sourcevalue, check, destinationvalue):
            print("[DEBUG] Checking %s %s %s" % (sourcevalue, check, destinationvalue))

            if check == "=" or check.lower() == "equals":
                if str(sourcevalue).lower() == str(destinationvalue).lower():
                    return True
            elif check == "!=" or check.lower() == "does not equal":
                if str(sourcevalue).lower() != str(destinationvalue).lower():
                    return True
            elif check.lower() == "startswith":
                if str(sourcevalue).lower().startswith(str(destinationvalue).lower()):
                    return True
            elif check.lower() == "endswith":
                if str(sourcevalue).lower().endswith(str(destinationvalue).lower()):
                    return True
            elif check.lower() == "contains":
                if destinationvalue.lower() in sourcevalue.lower():
                    return True

            elif check.lower() == "is empty":
                if len(sourcevalue) == 0:
                    return True

                if str(sourcevalue) == 0:
                    return True

                return False

            elif check.lower() == "contains_any_of":
                newvalue = [destinationvalue.lower()]
                if "," in destinationvalue:
                    newvalue = destinationvalue.split(",")
                elif ", " in destinationvalue:
                    newvalue = destinationvalue.split(", ")

                for item in newvalue:
                    if not item:
                        continue

                    if item.strip() in sourcevalue:
                        print("[INFO] Found %s in %s" % (item, sourcevalue))
                        return True
                    
                return False 
            elif check.lower() == "larger than" or check.lower() == "bigger than":
                try:
                    if str(sourcevalue).isdigit() and str(destinationvalue).isdigit():
                        if int(sourcevalue) > int(destinationvalue):
                            return True

                except AttributeError as e:
                    print("[WARNING] Condition larger than failed with values %s and %s: %s" % (sourcevalue, destinationvalue, e))
                    return False
            elif check.lower() == "smaller than" or check.lower() == "less than":
                try:
                    if str(sourcevalue).isdigit() and str(destinationvalue).isdigit():
                        if int(sourcevalue) < int(destinationvalue):
                            return True

                except AttributeError as e:
                    print("[WARNING] Condition smaller than failed with values %s and %s: %s" % (sourcevalue, destinationvalue, e))
                    return False
            elif check.lower() == "re" or check.lower() == "matches regex":
                try:
                    found = re.search(destinationvalue, sourcevalue)
                except re.error as e:
                    print("[WARNING] Regex error in condition: %s" % e)
                    return False

                if found == None:
                    return False

                return True
            else:
                print("[DEBUG] Condition: can't handle %s yet. Setting to true" % check)

            return False

        def check_branch_conditions(action, fullexecution, self):
            # relevantbranches = workflow.branches where destination = action
            try:
                if fullexecution["workflow"]["branches"] == None or len(fullexecution["workflow"]["branches"]) == 0:
                    return True, ""
            except KeyError:
                return True, ""

            # Startnode should always run - no need to check incoming
            try:
                if action["id"] == fullexecution["start"]:
                    return True, ""
            except Exception as error:
                self.logger.info(f"[WARNING] Failed checking startnode: {error}")

            available_checks = [
                "=",
                "equals",
                "!=",
                "does not equal",
                ">",
                "larger than",
                "<",
                "less than",
                ">=",
                "<=",
                "startswith",
                "endswith",
                "contains",
                "contains_any_of",
                "re",
                "matches regex",
            ]

            relevantbranches = []
            correct_branches = 0
            matching_branches = 0
            for branch in fullexecution["workflow"]["branches"]:
                if branch["destination_id"] != action["id"]:
                    continue

                matching_branches += 1

                # Find if previous is skipped or failed. Skipped != correct branch
                try:
                    should_skip = False
                    for res in fullexecution["results"]:
                        if res["action"]["id"] == branch["source_id"]:
                            if res["status"] == "FAILURE" or res["status"] == "SKIPPED":
                                should_skip = True 

                            break

                    if should_skip:
                        continue
                except Exception as e:
                    self.logger.info("[WARNING] Failed handling check of if parent is skipped") 


                # Remove anything without a condition
                try:
                    if (branch["conditions"]) == 0 or branch["conditions"] == None:
                        correct_branches += 1
                        continue
                except KeyError:
                    correct_branches += 1
                    continue

                successful_conditions = []
                failed_conditions = []
                successful_conditions = 0
                total_conditions = len(branch["conditions"])
                for condition in branch["conditions"]:
                    self.logger.info("[DEBUG] Getting condition value of %s" % condition)

                    # Parse all values first here
                    sourcevalue = condition["source"]["value"]
                    check, sourcevalue, is_loop = parse_params(action, fullexecution, condition["source"], self)
                    if check:
                        continue

                    sourcevalue = parse_wrapper_start(sourcevalue, self)
                    destinationvalue = condition["destination"]["value"]

                    check, destinationvalue, is_loop = parse_params(action, fullexecution, condition["destination"], self)
                    if check:
                        continue

                    destinationvalue = parse_wrapper_start(destinationvalue, self)

                    if not condition["condition"]["value"] in available_checks:
                        self.logger.warning("Skipping %s %s %s because %s is invalid." % (sourcevalue, condition["condition"]["value"], destinationvalue, condition["condition"]["value"]))
                        continue

                    # Configuration = negated because of WorkflowAppActionParam..
                    validation = run_validation(sourcevalue, condition["condition"]["value"], destinationvalue)
                    try:
                        if condition["condition"]["configuration"]:
                            validation = not validation
                    except KeyError:
                        pass

                    if validation == True:
                        successful_conditions += 1

                if total_conditions == successful_conditions:
                    correct_branches += 1
    
            if matching_branches == 0:
                return True, ""

            if matching_branches > 0 and correct_branches > 0:
                return True, ""

            self.logger.info("[DEBUG] Correct branches vs matching branches: %d vs %d" % (correct_branches, matching_branches))
            return False, {"success": False, "reason": "Minimum of one branch's conditions must be correct to continue. Total: %d of %d" % (correct_branches, matching_branches)}


        #
        #
        #
        #
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        # CONT
        #
        #
        #
        #

        # THE START IS ACTUALLY RIGHT HERE :O
        # Checks whether conditions are met, otherwise set 
        branchcheck, tmpresult = check_branch_conditions(action, fullexecution, self)
        if isinstance(tmpresult, object) or isinstance(tmpresult, list) or isinstance(tmpresult, dict):
            self.logger.info("[DEBUG] Fixing branch return as object -> string")
            try:
                #tmpresult = tmpresult.replace("'", "\"")
                tmpresult = json.dumps(tmpresult) 
            except json.decoder.JSONDecodeError as e:
                self.logger.info(f"[WARNING] Failed condition parsing {tmpresult} to string")

        # IF branches fail: Exit!
        if not branchcheck:
            self.logger.info("Failed one or more branch conditions.")
            self.action_result["result"] = tmpresult
            self.action_result["status"] = "SKIPPED"
            self.action_result["completed_at"] = int(time.time())

            self.send_result(self.action_result, headers, stream_path)
            return

        # Replace name cus there might be issues
        # Not doing lower() as there might be user-made functions
        actionname = action["name"]
        if " " in actionname:
            actionname.replace(" ", "_", -1) 

        #print("ACTION: ", action)
        #print("exec: ", self.full_execution)
        #if action.generated:
        #    actionname = actionname.lower()

        # Runs the actual functions
        try:
            func = getattr(self, actionname, None)
            if func == None:
                self.logger.debug(f"[DEBUG] Failed executing {actionname} because func is None (no function specified).")
                self.action_result["status"] = "FAILURE" 
                self.action_result["result"] = json.dumps({
                    "success": False,
                    "reason": f"Function {actionname} doesn't exist, or the App is out of date.",
                    "details": "If this persists, please restart delete the Docker image locally, restart your Orborus instance and then try again to force-download the latest version. Contact support@shuffler.io with this data if the issue persists.",
                })
            elif callable(func):
                try:
                    if len(action["parameters"]) < 1:
                        #result = await func()
                        result = func()
                    else:
                        # Potentially parse JSON here
                        # FIXME - add potential authentication as first parameter(s) here
                        # params[parameter["name"]] = parameter["value"]
                        #self.logger.info(fullexecution["authentication"]
                        # What variables are necessary here tho hmm

                        params = {}
                        # This replacement should happen in backend as part of params
                        # error log is useless
                        #try:
                        #    for item in action["authentication"]:
                        #        self.logger.info("AUTH PARAM: ", key, value)
                        #        #params[item["key"]] = item["value"]
                        #except KeyError as e:
                        #    self.logger.info(f"[WARNING] No authentication specified! Is this correct? err: {e}")

                        # Fixes OpenAPI body parameters for later.
                        newparams = []
                        counter = -1
                        bodyindex = -1
                        for parameter in action["parameters"]:
                            counter += 1

                            # Hack for key:value in options using ||
                            try:
                                if parameter["options"] != None and len(parameter["options"]) > 0:
                                    #self.logger.info(f'OPTIONS: {parameter["options"]}')
                                    #self.logger.info(f'OPTIONS VAL: {parameter}')
                                    if "||" in parameter["value"]:
                                        splitvalue = parameter["value"].split("||")
                                        if len(splitvalue) > 1:
                                            #self.logger.info(f'[INFO] Parsed split || options of actions["parameters"]["name"]')
                                            action["parameters"][counter]["value"] = splitvalue[1]

                            except (IndexError, KeyError, TypeError) as e:
                                self.logger.info("[WARNING] Options err: {e}")

                            # This part is purely for OpenAPI accessibility. 
                            # It replaces the data back into the main item
                            # Earlier, we handled each of the items and did later string replacement, 
                            # but this has changed to do lists within items and such
                            if parameter["name"] == "body": 
                                bodyindex = counter
                                #self.logger.info("PARAM: %s" % parameter)

                                # FIXMe: This should also happen after liquid & param parsing..
                                try:
                                    values = parameter["value_replace"]
                                    if values != None:
                                        added = 0
                                        for val in values:
                                            replace_value = val["value"]
                                            replace_key = val["key"]

                                            if (val["value"].startswith("{") and val["value"].endswith("}")) or (val["value"].startswith("[") and val["value"].endswith("]")):
                                                self.logger.info(f"""Trying to parse as JSON: {val["value"]}""")
                                                try:
                                                    newval = val["value"]

                                                    # If it gets here, remove the "" infront and behind the key as well 
                                                    # since this is preventing the JSON from being loaded
                                                    tmpvalue = json.loads(newval)
                                                    replace_key = f"\"{replace_key}\""
                                                except json.decoder.JSONDecodeError as e:
                                                    self.logger.info("[WARNING] Failed JSON replacement for OpenAPI %s", val["key"])

                                            elif val["value"].lower() == "true" or val["value"].lower() == "false":
                                                replace_key = f"\"{replace_key}\""
                                            else:
                                                if "\"" in replace_value and not "\\\"" in replace_value:
                                                    replace_value = replace_value.replace("\"", "\\\"", -1)

                                            action["parameters"][counter]["value"] = action["parameters"][counter]["value"].replace(replace_key, replace_value, 1)

                                            self.logger.info(f'[INFO] Added param {val["key"]} for body (using OpenAPI)')
                                            added += 1

                                        #action["parameters"]["body"]

                                        self.logger.info("ADDED %d parameters for body" % added)
                                except KeyError as e:
                                    self.logger.info("KeyError body OpenAPI: %s" % e)
                                    pass

                                 
                                self.logger.info(f"""HANDLING BODY: {action["parameters"][counter]["value"]}""")
                                action["parameters"][counter]["value"] = recurse_cleanup_script(action["parameters"][counter]["value"])

                        #self.logger.info(action["parameters"])

                        # This seems redundant now 
                        self.logger.info("[DEBUG] Pre parameters")
                        for parameter in newparams:
                            action["parameters"].append(parameter)

                        self.action = action

                        # Setting due to them being overwritten, but still later useful
                        try:
                            self.original_action = json.loads(json.dumps(action))
                        except Exception as e:
                            self.logger.info(f"[ERROR] Failed parsing action as JSON to original action. This COULD have bad effects on LOOPED executions: {e}")

                        # calltimes is used to handle forloops in the app itself.
                        # 2 kinds of loop - one in gui with one app each, and one like this,
                        # which is super fast, but has a bad overview (potentially good tho)
                        calltimes = 1
                        result = ""

                        all_executions = []

                        # Multi_parameter has the data for each. variable
                        minlength = 0
                        self.logger.info("[DEBUG] Pre-loading parameters")
                        multi_parameters = json.loads(json.dumps(params))
                        multiexecution = False
                        multi_execution_lists = []
                        remove_params = []
                        for parameter in action["parameters"]:
                            check, value, is_loop = parse_params(action, fullexecution, parameter, self)
                            if check:
                                raise Exception(json.dumps({
                                    "success": False,
                                    "reason": "Parameter {parameter} has an issue",
                                    "exception": f"Value Error: {check}",
                                }))

                            if parameter["name"] == "body": 
                                self.logger.info(f"[INFO] Should debug field with liquid and other checks as it's BODY: {value}")

                            # Custom format for ${name[0,1,2,...]}$
                            #submatch = "([${]{2}([0-9a-zA-Z_-]+)(\[.*\])[}$]{2})"
                            #self.logger.info(f"Returnedvalue: {value}")
                            # OLD: Used until 13.03.2021: submatch = "([${]{2}#?([0-9a-zA-Z_-]+)#?(\[.*\])[}$]{2})"
                            # \${[0-9a-zA-Z_-]+#?(\[.*?]}\$)
                            submatch = "([${]{2}#?([0-9a-zA-Z_-]+)#?(\[.*?]}\$))"
                            actualitem = re.findall(submatch, value, re.MULTILINE)
                            try:
                                if action["skip_multicheck"]:
                                    self.logger.info("Skipping multicheck")
                                    actualitem = []
                            except KeyError:
                                pass

                            #self.logger.info("Return value: %s" % value)
                            actionname = action["name"]
                            #self.logger.info("Multicheck ", actualitem)
                            #self.logger.info("ITEM LENGTH: %d, Actual item: %s" % (len(actualitem), actualitem))
                            if len(actualitem) > 0:
                                multiexecution = True

                                # Loop WITHOUT JSON variables go here. 
                                # Loop WITH variables go in else.
                                self.logger.info("Before first part in multiexec!")
                                handled = False

                                # Has a loop without a variable used inside
                                if len(actualitem[0]) > 2 and actualitem[0][1] == "SHUFFLE_NO_SPLITTER":

                                    self.logger.info("(1) Pre replacement: %s" % actualitem[0][2])
                                    tmpitem = value

                                    index = 0
                                    replacement = actualitem[index][2]
                                    if replacement.endswith("}$"):
                                        replacement = replacement[:-2]

                                    if replacement.startswith("\"") and replacement.endswith("\""):
                                        replacement = replacement[1:len(replacement)-1]

                                    self.logger.info("POST replacement: %s" % replacement)

                                    #json_replacement = tmpitem.replace(actualitem[index][0], replacement, 1)
                                    #self.logger.info("AFTER POST replacement: %s" % json_replacement)
                                    json_replacement = replacement
                                    try:
                                        json_replacement = json.loads(replacement)
                                    except json.decoder.JSONDecodeError as e:
                                        try:
                                            replacement = replacement.replace("\'", "\"", -1)
                                            json_replacement = json.loads(replacement)
                                        except:
                                            self.logger.info("JSON error singular: %s" % e)

                                    if len(json_replacement) > minlength:
                                        minlength = len(json_replacement)

                                    self.logger.info("PRE new_replacement")
                                    
                                    new_replacement = []
                                    for i in range(len(json_replacement)):
                                        if isinstance(json_replacement[i], dict) or isinstance(json_replacement[i], list):
                                            tmp_replacer = json.dumps(json_replacement[i])
                                            newvalue = tmpitem.replace(str(actualitem[index][0]), str(tmp_replacer), 1)
                                        else:
                                            newvalue = tmpitem.replace(str(actualitem[index][0]), str(json_replacement[i]), 1)

                                        try:
                                            newvalue = parse_liquid(newvalue, self)
                                        except Exception as e:
                                            self.logger.info(f"[WARNING] Failed liquid parsing in loop (2): {e}")

                                        try:
                                            newvalue = json.loads(newvalue)
                                        except json.decoder.JSONDecodeError as e:
                                            self.logger.info("DECODER ERROR: %s" % e)
                                            pass

                                        new_replacement.append(newvalue)

                                    self.logger.info("New replacement: %s" % new_replacement)

                                    # FIXME: Should this use new_replacement?
                                    tmpitem = tmpitem.replace(actualitem[index][0], replacement, 1)

                                    # This code handles files.
                                    resultarray = []
                                    isfile = False
                                    try:
                                        self.logger.info("(1) ------------ PARAM: %s" % parameter["schema"]["type"])
                                        if parameter["schema"]["type"] == "file" and len(value) > 0:
                                            self.logger.info("(1) SHOULD HANDLE FILE IN MULTI. Get based on value %s" % tmpitem) 
                                            # This is silly :)
                                            # Q: Is there something wrong with the download system?
                                            # It seems to return "FILE CONTENT: %s" with the ID as %s
                                            for tmp_file_split in json.loads(tmpitem):
                                                self.logger.info("(1) PRE GET FILE %s" % tmp_file_split)
                                                file_value = self.get_file(tmp_file_split)
                                                self.logger.info("(1) POST AWAIT %s" % file_value)
                                                resultarray.append(file_value)
                                                self.logger.info("(1) FILE VALUE FOR VAL %s: %s" % (tmp_file_split, file_value))

                                            isfile = True
                                    except NameError as e:
                                        self.logger.info("(1) SCHEMA NAMEERROR IN FILE HANDLING: %s" % e)
                                    except KeyError as e:
                                        self.logger.info("(1) SCHEMA KEYERROR IN FILE HANDLING: %s" % e)
                                    except json.decoder.JSONDecodeError as e:
                                        self.logger.info("(1) JSON ERROR IN FILE HANDLING: %s" % e)

                                    if not isfile:
                                        self.logger.info("Resultarray (NOT FILE): %s" % resultarray)
                                        params[parameter["name"]] = tmpitem
                                        multi_parameters[parameter["name"]] = new_replacement 
                                    else:
                                        self.logger.info("Resultarray (FILE): %s" % resultarray)
                                        params[parameter["name"]] = resultarray 
                                        multi_parameters[parameter["name"]] = resultarray 

                                    #if len(resultarray) == 0:
                                    #    self.logger.info("[WARNING] Returning empty array because the array length to be looped is 0 (1)")
                                    #    action_result["status"] = "SUCCESS" 
                                    #    action_result["result"] = "[]"
                                    #    self.send_result(action_result, headers, stream_path)
                                    #    return

                                    multi_execution_lists.append(new_replacement)
                                    #self.logger.info("MULTI finished: %s" % json_replacement)
                                else:
                                    self.logger.info(f"(2) Pre replacement (loop with variables). Variables: {actualitem}") #% actualitem)
                                    # This is here to handle for loops within variables.. kindof
                                    # 1. Find the length of the longest array
                                    # 2. Build an array with the base values based on parameter["value"] 
                                    # 3. Get the n'th value of the generated list from values
                                    # 4. Execute all n answers 
                                    replacements = {}
                                    curminlength = 0
                                    for replace in actualitem:
                                        try:
                                            to_be_replaced = replace[0]
                                            actualitem = replace[2]
                                            if actualitem.endswith("}$"):
                                                actualitem = actualitem[:-2]

                                        except IndexError:
                                            self.logger.info("[WARNING] Indexerror")
                                            continue

                                        #self.logger.info(f"\n\nTMPITEM: {actualitem}\n\n")
                                        #actualitem = parse_wrapper_start(actualitem)
                                        #self.logger.info(f"\n\nTMPITEM2: {actualitem}\n\n")

                                        try:
                                            itemlist = json.loads(actualitem)
                                            if len(itemlist) > minlength:
                                                minlength = len(itemlist)

                                            if len(itemlist) > curminlength:
                                                curminlength = len(itemlist)
                                            
                                        except json.decoder.JSONDecodeError as e:
                                            self.logger.info("JSON Error (replace): %s in %s" % (e, actualitem))

                                        replacements[to_be_replaced] = actualitem


                                    # Parses the data as string with length, split etc. before moving on. 


                                    #self.logger.info("In second part of else: %s" % (len(itemlist)))
                                    # This is a result array for JUST this value.. 
                                    # What if there are more?
                                    resultarray = []
                                    for i in range(0, curminlength): 
                                        tmpitem = json.loads(json.dumps(parameter["value"]))
                                        for key, value in replacements.items():
                                            replacement = value
                                            try:
                                                replacement = json.dumps(json.loads(value)[i])
                                            except IndexError as e:
                                                self.logger.info(f"[ERROR] Failed handling value parsing with index: {e}")
                                                pass

                                            if replacement.startswith("\"") and replacement.endswith("\""):
                                                replacement = replacement[1:len(replacement)-1]
                                            #except json.decoder.JSONDecodeError as e:

                                            #self.logger.info("REPLACING %s with %s" % (key, replacement))
                                            #replacement = parse_wrapper_start(replacement)
                                            tmpitem = tmpitem.replace(key, replacement, -1)
                                            try:
                                                tmpitem = parse_liquid(tmpitem, self)
                                            except Exception as e:
                                                self.logger.info(f"[WARNING] Failed liquid parsing in loop (2): {e}")


                                        # This code handles files.
                                        self.logger.info("(2) ------------ PARAM: %s" % parameter["schema"]["type"])
                                        isfile = False
                                        try:
                                            if parameter["schema"]["type"] == "file" and len(value) > 0:
                                                self.logger.info("(2) SHOULD HANDLE FILE IN MULTI. Get based on value %s" % parameter["value"]) 

                                                for tmp_file_split in json.loads(parameter["value"]):
                                                    self.logger.info("(2) PRE GET FILE %s" % tmp_file_split)
                                                    file_value = self.get_file(tmp_file_split)
                                                    self.logger.info("(2) POST AWAIT %s" % file_value)
                                                    resultarray.append(file_value)
                                                    self.logger.info("(2) FILE VALUE FOR VAL %s: %s" % (tmp_file_split, file_value))


                                                isfile = True
                                        except KeyError as e:
                                            self.logger.info("(2) SCHEMA ERROR IN FILE HANDLING: %s" % e)
                                        except json.decoder.JSONDecodeError as e:
                                            self.logger.info("(2) JSON ERROR IN FILE HANDLING: %s" % e)

                                        if not isfile:
                                            tmpitem = tmpitem.replace("\\\\", "\\", -1)
                                            resultarray.append(tmpitem)

                                    # With this parameter ready, add it to... a greater list of parameters. Rofl
                                    self.logger.info("LENGTH OF ARR: %d" % len(resultarray))
                                    if len(resultarray) == 0:
                                        self.logger.info("[WARNING] Returning empty array because the array length to be looped is 0 (0)")
                                        self.action_result["status"] = "SUCCESS" 
                                        self.action_result["result"] = "[]"
                                        self.send_result(self.action_result, headers, stream_path)
                                        return

                                    #self.logger.info("RESULTARRAY: %s" % resultarray)
                                    if resultarray not in multi_execution_lists:
                                        multi_execution_lists.append(resultarray)

                                    multi_parameters[parameter["name"]] = resultarray
                            else:
                                # Parses things like int(value)
                                #self.logger.info("[DEBUG] Normal parsing (not looping)")#with data %s" % value)
                                # This part has fucked over so many random JSON usages because of weird paranthesis parsing

                                value = parse_wrapper_start(value, self)
                                #self.logger.info("[DEBUG] Post return: %s" % value)

                                #self.logger.info("POST data value: %s" % value)

                                try:
                                    if str(value).startswith("b'") and str(value).endswith("'"):
                                        value = value[2:-1]
                                except Exception as e:
                                    print(f"Value rawbytes Exception: {e}")

                                params[parameter["name"]] = value
                                multi_parameters[parameter["name"]] = value 

                                # This code handles files.
                                try:
                                    if parameter["schema"]["type"] == "file" and len(value) > 0:
                                        self.logger.info("\n SHOULD HANDLE FILE. Get based on value %s. <--- is this a valid ID?" % parameter["value"]) 
                                        file_value = self.get_file(value)
                                        self.logger.info("FILE VALUE: %s \n" % file_value)

                                        params[parameter["name"]] = file_value 
                                        multi_parameters[parameter["name"]] = file_value 
                                except KeyError as e:
                                    self.logger.info("SCHEMA ERROR IN FILE HANDLING: %s" % e)


                        #remove_params.append(parameter["name"])
                        # Fix lists here
                        # FIXME: This doesn't really do anything anymore
                        self.logger.info("[DEBUG] CHECKING multi execution list: %d!" % len(multi_execution_lists))
                        if len(multi_execution_lists) > 0:
                            self.logger.info("\n [DEBUG] Multi execution list has more data: %d" % len(multi_execution_lists))
                            filteredlist = []
                            for listitem in multi_execution_lists:
                                if listitem in filteredlist:
                                    continue

                                # FIXME: Subsub required?. Recursion! 
                                # Basically multiply what we have with the outer loop?
                                # 
                                #if isinstance(listitem, list):
                                #    for subitem in listitem:
                                #        filteredlist.append(subitem)
                                #else:
                                #    filteredlist.append(listitem)

                            #self.logger.info("New list length: %d" % len(filteredlist))
                            if len(filteredlist) > 1:
                                self.logger.info(f"Calculating new multi-loop length with {len(filteredlist)} lists")
                                tmplength = 1
                                for innerlist in filteredlist:
                                    tmplength = len(innerlist)*tmplength
                                    self.logger.info("List length: %d. %d*%d" % (tmplength, len(innerlist), tmplength))

                                minlength = tmplength

                                self.logger.info("New multi execution length: %d\n" % tmplength)

                        # Cleaning up extra list params
                        for subparam in remove_params:
                            #self.logger.info(f"DELETING {subparam}")
                            try:
                                del params[subparam]
                            except:
                                pass
                                #self.logger.info(f"Error with subparam deletion of {subparam} in {params}")
                            try:
                                del multi_parameters[subparam]
                            except:
                                #self.logger.info(f"Error with subparam deletion of {subparam} in {multi_parameters} (2)")
                                pass

                        #self.logger.info()
                        #self.logger.info(f"Param: {params}")
                        #self.logger.info(f"Multiparams: {multi_parameters}")
                        #self.logger.info()
                        
                        if not multiexecution:
                            # Runs a single iteration here
                            new_params = self.validate_unique_fields(params)
                            self.logger.info(f"[DEBUG] Returned with newparams of length {len(new_params)}")
                            if isinstance(new_params, list) and len(new_params) == 1:
                                params = new_params[0]
                            else:
                                self.logger.info("[WARNING] SHOULD STOP EXECUTION BECAUSE FIELDS AREN'T UNIQUE")
                                self.action_result["status"] = "SKIPPED"
                                self.action_result["result"] = f"A non-unique value was found"  
                                self.action_result["completed_at"] = int(time.time())
                                self.send_result(self.action_result, headers, stream_path)
                                return

                            self.logger.info("[INFO] Running normal execution (not loop)\n\n") 

                            # Added literal evaluation of anything resembling a string
                            # The goal is to parse objects that e.g. use single quotes and the like
                            # FIXME: add this to Multi exec as well.
                            try:
                                for key, value in params.items():
                                    if "-" in key:
                                        try:
                                            newkey = key.replace("-", "_", -1).lower()
                                            params[newkey] = params[key]
                                        except Exception as e:
                                            self.logger.info("[DEBUG] Failed updating key with dash in it: %s" % e)

                                    try:
                                        if isinstance(value, str) and ((value.startswith("{") and value.endswith("}")) or (value.startswith("[") and value.endswith("]"))):
                                            params[key] = json.loads(value)
                                    except Exception as e:
                                        try:
                                            if isinstance(value, str) and ((value.startswith("{") and value.endswith("}")) or (value.startswith("[") and value.endswith("]"))):
                                                params[key] = ast.literal_eval(value)
                                        except Exception as e:
                                            self.logger.info(f"[DEBUG] Failed parsing value with ast and json.loads - noncritical. Trying next: {e}")
                                            continue
                            except Exception as e:
                                self.logger.info("[DEBUG] Failed looping objects. Non critical: {e}")

                            # Uncomment below to get the param input
                            # self.logger.info(f"[DEBUG] PARAMS: {params}")

                            #newres = ""
                            iteration_count = 0
                            found_error = ""
                            while True:
                                iteration_count += 1
                                if iteration_count >= 10:
                                    newres = {
                                        "success": False,
                                        "reason": "Iteration count more than 10. This happens if the input to the action is wrong. Try remaking the action, and contact support@shuffler.io if this persists.", 
                                        "details": found_error,
                                    }
                                    break

                                try:
                                    newres = func(**params)
                                    break
                                except TypeError as e:
                                    newres = ""
                                    self.logger.info(f"[DEBUG] Got exec type error: {e}")
                                    try:
                                        e = json.loads(f"{e}")
                                    except:
                                        e = f"{e}"

                                    found_error = e 
                                    errorstring = f"{e}"

                                    if "the JSON object must be" in errorstring:
                                        self.logger.info("[ERROR] Something is wrong with the input for this function. Are lists and JSON data handled parsed properly (0)? the JSON object must be in...")
                                        try:
                                            e = json.loads(f"{e}")
                                        except:
                                            e = f"{e}"

                                        newres = json.dumps({
                                            "success": False,
                                            "reason": "An exception occurred while running this function (1). See exception for more details and contact support if this persists (support@shuffler.io)",
                                            "exception": e,
                                        })
                                        break
                                    elif "got an unexpected keyword argument" in errorstring:
                                        fieldsplit = errorstring.split("'")
                                        if len(fieldsplit) > 1:
                                            field = fieldsplit[1]
                            
                                            try:
                                                del params[field]
                                                self.logger.info("[WARNING] Removed field invalid field %s" % field)
                                            except KeyError:
                                                break
                                    else:
                                        newres = json.dumps({
                                            "success": False,
                                            "reason": "You may be running an old version of this action. Try remaking the node, then contact us at support@shuffler.io if it doesn't work with all these details.",
                                            "exception": f"TypeError: {e}",
                                        })
                                        break
                                except Exception as e:
                                    self.logger.info(f"[ERROR] Something is wrong with the input for this function. Are lists and JSON data handled parsed properly (1)? err: {e}")

                                    try:
                                        e = json.loads(f"{e}")
                                    except:
                                        e = f"{e}"

                                    newres = json.dumps({
                                        "success": False,
                                        "reason": "An exception occurred while running this function (2). See exception for more details and contact support if this persists (support@shuffler.io)",
                                        "exception": e,
                                    })
                                    break

                            # Forcing async wait in case of old apps that use async (backwards compatibility)
                            try:
                                if asyncio.iscoroutine(newres):
                                    self.logger.info("[DEBUG] In coroutine (1)")
                                    async def parse_value(newres):
                                        value = await asyncio.gather(
                                            newres 
                                        )

                                        return value[0]

                                    newres = asyncio.run(parse_value(newres))
                                else:
                                    #self.logger.info("[DEBUG] Not in coroutine (1)")
                                    pass
                            except Exception as e:
                                self.logger.warning("[ERROR] Failed to parse coroutine value for old app: {e}")

                            self.logger.info("\n\n\n[INFO] Returned from execution with type(s) %s" % type(newres))
                            #self.logger.info("\n[INFO] Returned from execution with %s of types %s" % (newres, type(newres)))#, newres)
                            if isinstance(newres, tuple):
                                self.logger.info(f"[INFO] Handling return as tuple: {newres}")
                                # Handles files.
                                filedata = ""
                                file_ids = []
                                self.logger.info("TUPLE: %s" % newres[1])
                                if isinstance(newres[1], list):
                                    self.logger.info("[INFO] HANDLING LIST FROM RET")
                                    file_ids = self.set_files(newres[1])
                                elif isinstance(newres[1], object):
                                    self.logger.info("[INFO] Handling JSON from ret")
                                    file_ids = self.set_files([newres[1]])
                                elif isinstance(newres[1], str):
                                    self.logger.info("[INFO] Handling STRING from ret")
                                    file_ids = self.set_files([newres[1]])
                                else:
                                    self.logger.info("[INFO] NO FILES TO HANDLE")

                                tmp_result = {
                                    "success": True,
                                    "result": newres[0], 
                                    "file_ids": file_ids
                                }
                                
                                result = json.dumps(tmp_result)
                            elif isinstance(newres, str):
                                self.logger.info("[INFO] Handling return as string of length %d" % len(newres))
                                result += newres
                            elif isinstance(newres, dict) or isinstance(newres, list):
                                try:
                                    result += json.dumps(newres, indent=4)
                                except json.JSONDecodeError as e:
                                    self.logger.info("[WARNING] Failed decoding result: %s" % e)
                                    try:
                                        result += str(newres)
                                    except ValueError:
                                        result += "Failed autocasting. Can't handle %s type from function. Must be string" % type(newres)
                                        self.logger.info("Can't handle type %s value from function" % (type(newres)))
                                except Exception as e:
                                    self.logger.info("[ERROR] Failed to json dump. Returning as string.")
                                    result += str(newres)
                            else:
                                try:
                                    result += str(newres)
                                except ValueError:
                                    result += "Failed autocasting. Can't handle %s type from function. Must be string" % type(newres)
                                    self.logger.info("Can't handle type %s value from function" % (type(newres)))

                            self.logger.info("[INFO] POST NEWRES RESULT!")#, result)
                        else:
                            #self.logger.info("[INFO] APP_SDK DONE: Starting MULTI execution (length: %d) with values %s" % (minlength, multi_parameters))
                            # 1. Use number of executions based on the arrays being similar
                            # 2. Find the right value from the parsed multi_params

                            self.logger.info("[INFO] Running WITHOUT outer loop (looping)")
                            json_object = False
                            #results = await self.run_recursed_items(func, multi_parameters, {})
                            results = self.run_recursed_items(func, multi_parameters, {})
                            if isinstance(results, dict) or isinstance(results, list):
                                json_object = True

                            # Dump the result as a string of a list
                            #self.logger.info("RESULTS: %s" % results)
                            if isinstance(results, list) or isinstance(results, dict):
                                self.logger.info(f"JSON OBJECT? {json_object}")

                                # This part is weird lol
                                if json_object:
                                    try:
                                        result = json.dumps(results)
                                    except json.JSONDecodeError as e:
                                        self.logger.info(f"Failed to decode: {e}")
                                        result = results
                                else:
                                    result = "["
                                    for item in results:
                                        try:
                                            json.loads(item)
                                            result += item
                                        except json.decoder.JSONDecodeError as e:
                                            # Common nested issue which puts " around everything
                                            self.logger.info("Decodingerror: %s" % e)
                                            try:
                                                tmpitem = item.replace("\\\"", "\"", -1)
                                                json.loads(tmpitem)
                                                result += tmpitem

                                            except:
                                                result += "\"%s\"" % item

                                        result += ", "

                                    result = result[:-2]
                                    result += "]"
                            else:
                                self.logger.info("Normal result - no list?")
                                result = results

                    self.action_result["status"] = "SUCCESS" 
                    self.action_result["result"] = str(result)
                    if self.action_result["result"] == "":
                        self.action_result["result"] = result

                    self.logger.debug(f"[DEBUG] Executed {action['label']}-{action['id']}")#with result: {result}")
                    #self.logger.debug(f"Data: %s" % action_result)
                except TypeError as e:
                    self.logger.info("[ERROR] TypeError issue: %s" % e)
                    self.action_result["status"] = "FAILURE" 
                    self.action_result["result"] = json.dumps({
                        "success": False, 
                        "reason": f"Typeerror. Most likely due to a list that should've been a string. See details for more info.",
                        "details": e,
                    })
                    #self.action_result["result"] = "TypeError: %s" % str(e)
            else:
                self.logger.info("[DEBUG] Function %s doesn't exist?" % action["name"])
                self.logger.error(f"[ERROR] App {self.__class__.__name__}.{action['name']} is not callable")
                self.action_result["status"] = "FAILURE" 
                #self.action_result["result"] = "Function %s is not callable." % actionname

                self.action_result["result"] = json.dumps({
                    "success": False, 
                    "reason": f"Function %s doesn't exist." % actionname,
                })

        # https://ptb.discord.com/channels/747075026288902237/882017498550112286/882043773138382890
        except (requests.exceptions.RequestException, TimeoutError) as e:
            self.logger.info(f"[ERROR] Failed to execute request (requests): {e}")
            self.logger.exception(f"[ERROR] Failed to execute {e}-{action['id']}")
            self.action_result["status"] = "SUCCESS" 
            try:
                e = json.loads(f"{e}")
            except:
                e = f"{e}"

            try:
                self.action_result["result"] = json.dumps({
                    "success": False, 
                    "reason": f"Request error - failing silently. Details in detail section",
                    "details": e,
                })
            except json.decoder.JSONDecodeError as e:
                self.action_result["result"] = f"Request error: {e}"

        except Exception as e:
            self.logger.info(f"[ERROR] Failed to execute: {e}")
            self.logger.exception(f"[ERROR] Failed to execute {e}-{action['id']}")
            self.action_result["status"] = "FAILURE" 
            try:
                e = json.loads(f"{e}")
            except:
                e = f"{e}"

            self.action_result["result"] = json.dumps({
                "success": False,
                "reason": f"General exception in the app. See shuffle action logs for more details.",
                "details": e,
            })

        # Send the result :)
        self.action_result["completed_at"] = int(time.time())
        self.send_result(self.action_result, headers, stream_path)

        #try:
        #    try:
        #        self.log_capture_string.flush()
        #    except Exception as e:
        #        print(f"[WARNING] Failed to flush logs (2): {e}") 
        #        pass

        #    self.log_capture_string.close()
        #except:
        #    print(f"[WARNING] Failed to close logs (2): {e}") 

        return

    @classmethod
    def run(cls, action=""):
        logging.basicConfig(format="{asctime} - {name} - {levelname}:{message}", style='{')
        logger = logging.getLogger(f"{cls.__name__}")
        logger.setLevel(logging.DEBUG)
                
        logger.info("[DEBUG] Normal execution.")

        ##############################################

        exposed_port = os.getenv("SHUFFLE_APP_EXPOSED_PORT", "")
        logger.info(f"[DEBUG] \"{runtime}\" - run indicates microservices. Port: \"{exposed_port}\"")
        if runtime == "run" and exposed_port != "":
            # Base port is 33334. Exposed port may differ based on discovery from Worker
            port = int(exposed_port)
            logger.info(f"[DEBUG] Starting webserver on port {port} (same as exposed port)")
            from flask import Flask, request
            from waitress import serve
        
            flask_app = Flask(__name__)
            #flask_app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(minutes=5)
        
            #async def execute():
            @flask_app.route("/api/v1/health", methods=["GET", "POST"])
            def check_health():
                return "OK"

            @flask_app.route("/api/v1/run", methods=["POST"])
            def execute():
                if request.method == "POST":
                    #print(request.get_json(force=True))
                    requestdata = {}
                    try:
                        requestdata = json.loads(request.data)
                    except Exception as e:
                        return {
                            "success": False,
                            "reason": f"Invalid Action data {e}",
                        }
        
                    #logger.info(f"[DEBUG] Datatype: {type(requestdata)}: {requestdata}")

                    # Remaking class for each request
                    #print(f"APP: {app}")
        
                    app = cls(redis=None, logger=logger, console_logger=logger)
                    extra_info = ""
                    try:
                        #asyncio.run(AppBase.run(action=requestdata), debug=True)
                        #value = json.dumps(value)
                        try:
                            app.full_execution = json.dumps(requestdata["workflow_execution"])
                        except Exception as e:
                            logger.info(f"[ERROR] Failed parsing full execution from workflow_execution: {e}")
                            extra_info += f"\n{e}"

                        try:
                            app.action = requestdata["action"] 
                        except Exception as e:
                            logger.info(f"[ERROR] Failed parsing action: {e}")
                            extra_info += f"\n{e}"

                        try:
                            app.authorization = requestdata["authorization"]
                            app.current_execution_id = requestdata["execution_id"]
                        except Exception as e:
                            logger.info(f"[ERROR] Failed parsing auth and exec id: {e}")
                            extra_info += f"\n{e}"

                        # BASE URL (backend)
                        try:
                            app.url = requestdata["url"]
                            logger.info(f"BACKEND URL: {app.url}")
                        except Exception as e:
                            logger.info(f"[ERROR] Failed parsing url (backend): {e}")
                            extra_info += f"\n{e}"

                        # URL (worker)
                        try:
                            app.base_url = requestdata["base_url"]
                            logger.info(f"WORKER URL: {app.base_url}")
                        except Exception as e:
                            logger.info(f"[ERROR] Failed parsing base url (worker): {e}")
                            extra_info += f"\n{e}"
                        
                        #await 
                        app.execute_action(app.action)
                        logger.info("[DEBUG] Done awaiting app action running")
                    except Exception as e:
                        return {
                            "success": False,
                            "reason": f"Problem in execution {e}",
                            "execution_issues": extra_info,
                        }
        
                    return {
                        "success": True,
                        "reason": "App successfully finished",
                        "execution_issues": extra_info,
                    }
                else:
                    return {
                        "success": False,
                        "reason": f"HTTP method {request.method} not allowed",
                    }
        
            logger.info(f"[DEBUG] Serving on port {port}")

            #flask_app.run(
            #    host="0.0.0.0", 
            #    port=port, 
            #    threaded=True, 
            #    processes=1, 
            #    debug=False,
            #)

            serve(
                flask_app, 
                host="0.0.0.0", 
                port=port, 
                threads=8,
                channel_timeout=30,
                expose_tracebacks=True,
                asyncore_use_poll=True,
            )
            #######################
        else:
            # Has to start like this due to imports in other apps
            # Move it outside everything?
            app = cls(redis=None, logger=logger, console_logger=logger)
            #logger.info(f"[DEBUG] Action: {action}")
            
            if isinstance(action, str):
                logger.info("[DEBUG] Normal execution (env var). Action is a string.")
            elif isinstance(action, object):
                logger.info("[DEBUG] OBJECT execution (cloud). Action is NOT a string.")
                app.action = action

                try:
                    app.authorization = action["authorization"]
                    app.current_execution_id = action["execution_id"]
                except:
                    pass

                # BASE URL (worker)
                try:
                    app.url = action["url"]
                except:
                    pass

                # Callback URL (backend)
                try:
                    app.base_url = action["base_url"]
                except:
                    pass
            else:
                self.logger.info("ACTION TYPE (unhandled): %s" % type(action))

            #await app.execute_action(app.action)
            app.execute_action(app.action)

    #app.run(host="0.0.0.0", port=33334)

if __name__ == "__main__":
    AppBase.run()
    #asyncio.run(AppBase.run(), debug=True)
