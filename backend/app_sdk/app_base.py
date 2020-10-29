import os
import sys
import re
import time 
import json
import logging
import requests
import urllib.parse

class AppBase:
    """ The base class for Python-based apps in Shuffle, handles logging and callbacks configurations"""
    __version__ = None
    app_name = None

    def __init__(self, redis=None, logger=None, console_logger=None):#, docker_client=None):
        self.logger = logger if logger is not None else logging.getLogger("AppBaseLogger")
        self.redis=redis
        self.console_logger = logger if logger is not None else logging.getLogger("AppBaseLogger")

        # apikey is for the user / org
        # authorization is for the specific workflow
        self.url = os.getenv("CALLBACK_URL", "https://shuffler.io")
        self.action = os.getenv("ACTION", "")
        self.authorization = os.getenv("AUTHORIZATION", "")
        self.current_execution_id = os.getenv("EXECUTIONID", "")
        self.full_execution = os.getenv("FULL_EXECUTION", "") 

        if isinstance(self.action, str):
            self.action = json.loads(self.action)

    def send_result(self, action_result, headers, stream_path):
        if action_result["status"] == "EXECUTING":
            action_result["status"] = "FAILURE"

        # I wonder if this actually works 
        self.logger.info("Before last stream result")
        try:
            ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
            self.logger.info("Result: %d" % ret.status_code)
            if ret.status_code != 200:
                self.logger.info(ret.text)
        except requests.exceptions.ConnectionError as e:
            self.logger.exception(e)
            return
        except TypeError as e:
            self.logger.exception(e)
            action_result["status"] = "FAILURE"
            action_result["result"] = "POST error: %s" % e
            self.logger.info("Before typeerror stream result")
            ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
            self.logger.info("Result: %d" % ret.status_code)
            if ret.status_code != 200:
                self.logger.info(ret.text)
    
    async def execute_action(self, action):
        # FIXME - add request for the function STARTING here. Use "results stream" or something
        # PAUSED, AWAITING_DATA, PENDING, COMPLETED, ABORTED, EXECUTING, SUCCESS, FAILURE

        # !!! Let this line stay - its used for some horrible codegeneration / stitching !!! # 
        #STARTCOPY
        stream_path = "/api/v1/streams"
        action_result = {
            "action": action,
            "authorization": self.authorization,
            "execution_id": self.current_execution_id,
            "result": "",
            "started_at": int(time.time()),
            "status": "EXECUTING"
        }
        self.logger.info("ACTION RESULT (start): %s", action_result)

        if len(self.action) == 0:
            print("ACTION env not defined")
            action_result["result"] = "Error in setup ENV: ACTION not defined"
            self.send_result(action_result, headers, stream_path) 
            return
        if len(self.authorization) == 0:
            print("AUTHORIZATION env not defined")
            action_result["result"] = "Error in setup ENV: AUTHORIZATION not defined"
            self.send_result(action_result, headers, stream_path) 
            return
        if len(self.current_execution_id) == 0:
            print("EXECUTIONID env not defined")
            action_result["result"] = "Error in setup ENV: EXECUTIONID not defined"
            self.send_result(action_result, headers, stream_path) 
            return

        headers = {
            "Content-Type": "application/json",     
            "Authorization": "Bearer %s" % self.authorization
        }

        # Add async logger
        # self.console_logger.handlers[0].stream.set_execution_id()
        #self.logger.info("Before initial stream result")
        try:
            ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
            self.logger.info("Workflow: %d" % ret.status_code)
            if ret.status_code != 200:
                self.logger.info(ret.text)
        except requests.exceptions.ConnectionError as e:
            print("Connectionerror: %s" %  e)

            action_result["result"] = "Bad setup during startup: %s" % e 
            self.send_result(action_result, headers, stream_path) 
            return

        # Verify whether there are any parameters with ACTION_RESULT required
        # If found, we get the full results list from backend
        fullexecution = {}
        if len(self.full_execution) == 0:
            print("NO EXECUTION - LOADING!")
            try:
                tmpdata = {
                    "authorization": self.authorization,
                    "execution_id": self.current_execution_id
                }

                self.logger.info("Before FULLEXEC stream result")
                ret = requests.post(
                    "%s/api/v1/streams/results" % (self.url), 
                    headers=headers, 
                    json=tmpdata
                )

                if ret.status_code == 200:
                    fullexecution = ret.json()
                else:
                    self.logger.info("Error: Data: ", ret.json())
                    self.logger.info("Error with status code for results. Crashing because ACTION_RESULTS or WORKFLOW_VARIABLE can't be handled. Status: %d" % ret.status_code)
                    action_result["result"] = "Bad result from backend: %d" % ret.status_code
                    self.send_result(action_result, headers, stream_path) 
                    return
            except requests.exceptions.ConnectionError as e:
                self.logger.info("Connectionerror: %s" %  e)
                action_result["result"] = "Connection error during startup: %s" % e
                self.send_result(action_result, headers, stream_path) 
                return
        else:
            try:
                fullexecution = json.loads(self.full_execution)
            except json.decoder.JSONDecodeError as e:
                print("Json decode execution error: %s" % e)  
                action_result["result"] = "Json error during startup: %s" % e
                self.send_result(action_result, headers, stream_path) 
                return

            print("")


        self.logger.info("AFTER FULLEXEC stream result")

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
                    print("ValueError while casting %s" % data)
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
            if "len" in thistype or "length" in thistype:
                tmp = "" 
                try:
                    tmp = json.loads(data)
                except: 
                    pass

                if isinstance(tmp, list):
                    return str(len(tmp))

                return str(len(data))
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

                    print(tmp)
                    return tmp
                except IndexError as e:
                    return default_error
        
        # Parses the INNER value and recurses until everything is done
        def parse_wrapper(data):
            try:
                if "(" not in data or ")" not in data:
                    return data
            except TypeError:
                return data
        
            #print("Running %s" % data)
        
            # Look for the INNER wrapper first, then move out
            wrappers = ["int", "number", "lower", "upper", "trim", "strip", "split", "parse", "len", "length"]
            found = False
            for wrapper in wrappers:
                if wrapper not in data.lower():
                    continue
        
                found = True
                break
        
            if not found:
                return data
        
            # Do stuff here.
            innervalue = parse_nested_param(data, maxDepth(data)-0)
            outervalue = parse_nested_param(data, maxDepth(data)-1)
            print("INNER: ", innervalue)
            print("OUTER: ", outervalue)
        
            if outervalue != innervalue:
                #print("Outer: ", outervalue, " inner: ", innervalue)
                for key in range(len(innervalue)):
                    # Replace OUTERVALUE[key] with INNERVALUE[key] in data.
                    print("Replace %s with %s in %s" % (outervalue[key], innervalue[key], data))
                    data = data.replace(outervalue[key], innervalue[key])
            else:
                for thistype in wrappers:
                    if thistype.lower() not in data.lower():
                        continue
        
                    parsed_value = parse_type(innervalue[0], thistype.lower())
                    return parsed_value
        
            print("DATA: %s\n" % data)
            return parse_wrapper(data)

        def parse_wrapper_start(data):
            newdata = []
            newstring = ""
            record = True
            paranCnt = 0
            for char in data:
                if char == "(":
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
        
            if len(newstring) > 0:
                newdata.append(newstring)
        
            #print(newdata)
            parsedlist = []
            non_string = False
            for item in newdata:
                ret = parse_wrapper(item)
                if not isinstance(ret, str):
                    non_string = True
        
                parsedlist.append(ret)
        
            if len(parsedlist) > 0 and not non_string:
                return " ".join(parsedlist)
            elif len(parsedlist) == 1 and non_string:
                return parsedlist[0]
            else:
                #print("Casting back to string because multi: ", parsedlist)
                newlist = []
                for item in parsedlist:
                    try:
                        newlist.append(str(item))
                    except ValueError:
                        newlist.append("parsing_error")
                return " ".join(newlist)

        # Parses JSON loops and such down to the item you're looking for
        def recurse_json(basejson, parsersplit):
            match = "#(\d+):?-?([0-9a-z]+)?#?"
            print("Split: %s\n%s" % (parsersplit, basejson))
            try:
                outercnt = 0

                # Loops over split values
                for value in parsersplit:
                    print("VALUE: %s\n" % value)
                    actualitem = re.findall(match, value, re.MULTILINE)
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
                    elif len(actualitem) > 0:
                        # FIXME: This is absolutely not perfect. 
                        print("In recursion v2: ", actualitem)

                        is_loop = True
                        newvalue = []
                        firstitem = actualitem[0][0]
                        seconditem = actualitem[0][1]

                        # Means it's a single item -> continue
                        if seconditem == "":
                            print("In first - handling %s" % seconditem)
                            tmpitem = basejson[int(firstitem)]
                            try:
                                newvalue, is_loop = recurse_json(tmpitem, parsersplit[outercnt+1:])
                            except IndexError:
                                newvalue, is_loop = (tmpitem, parsersplit[outercnt+1:])
                        else:
                            if seconditem == "max": 
                                seconditem = len(basejson)
                            if seconditem == "min": 
                                seconditem = 0

                            newvalue = []
                            for i in range(int(firstitem), int(seconditem)):
                                # 1. Check the next item (message)
                                # 2. Call this function again
                                print("Base: %s" % basejson[i])

                                try:
                                    ret, is_loop  = recurse_json(basejson[i], parsersplit[outercnt+1:])
                                except IndexError:
                                    print("INDEXERROR: ", parsersplit[outercnt])
                                    #ret = innervalue
                                    ret, is_loop  = recurse_json(innervalue, parsersplit[outercnt:])
                                    
                                print(ret)
                                #exit()
                                newvalue.append(ret)

                        return newvalue, is_loop 

                    # FIXME: Add specific loop for other indexes
                    else:
                        #print("BEFORE NORMAL VALUE: ", basejson, value)
                        if len(value) == 0:
                            return basejson, False
        
                        if isinstance(basejson[value], str):
                            print(f"LOADING STRING '%s' AS JSON" % basejson[value]) 
                            try:
                                basejson = json.loads(basejson[value])
                            except json.decoder.JSONDecodeError as e:
                                print("RETURNING BECAUSE '%s' IS A NORMAL STRING" % basejson[value])
                                return basejson[value], False
                        else:
                            basejson = basejson[value]
        
                    outercnt += 1
        
            except KeyError as e:
                print("Lower keyerror: %s" % e)
                #return basejson
                #return "KeyError: Couldn't find key: %s" % e

            return basejson, False

        # Takes a workflow execution as argument
        # Returns a string if the result is single, or a list if it's a list
        def get_json_value(execution_data, input_data):
            parsersplit = input_data.split(".")
            actionname_lower = parsersplit[0][1:].lower()

            #Actionname: Start_node

            print(f"Actionname: {actionname}")

            # 1. Find the action
            baseresult = ""

            appendresult = "" 
            print("Parsersplit length: %d" % len(parsersplit))
            if (actionname_lower.startswith("exec ") or actionname_lower.startswith("webhook ") or actionname_lower.startswith("schedule ") or actionname_lower.startswith("userinput ") or actionname_lower.startswith("email_trigger ") or actionname_lower.startswith("trigger ")) and len(parsersplit) == 1:
                record = False
                for char in actionname_lower:
                    if char == " ":
                        record = True

                    if record:
                        appendresult += char

                actionname_lower = "exec"

            actionname_lower = actionname_lower.replace(" ", "_", -1)

            try: 
                if actionname_lower == "exec" or actionname_lower == "webhook" or actionname_lower == "schedule" or actionname_lower == "userinput" or actionname_lower == "email_trigger" or actionname_lower == "trigger": 
                    baseresult = execution_data["execution_argument"]
                else:
                    #print("Within execution data check. Execution data: %s", execution_data["results"])
                    if execution_data["results"] != None:
                        for result in execution_data["results"]:
                            resultlabel = result["action"]["label"].replace(" ", "_", -1).lower()
                            if resultlabel.lower() == actionname_lower:
                                baseresult = result["result"]
                                break
                    else:
                        print("No results to get values from.")
                        baseresult = "$" + parsersplit[0][1:] 
                    
                    print("BEFORE VARIABLES!")
                    if len(baseresult) == 0:
                        try:
                            #print("WF Variables: %s" % execution_data["workflow"]["workflow_variables"])
                            for variable in execution_data["workflow"]["workflow_variables"]:
                                variablename = variable["name"].replace(" ", "_", -1).lower()
        
                                if variablename.lower() == actionname_lower:
                                    baseresult = variable["value"]
                                    break
                        except KeyError as e:
                            print("KeyError wf variables: %s" % e)
                            pass
                        except TypeError as e:
                            print("TypeError wf variables: %s" % e)
                            pass
        
                    print("BEFORE EXECUTION VAR")
                    if len(baseresult) == 0:
                        try:
                            #print("Execution Variables: %s" % execution_data["execution_variables"])
                            for variable in execution_data["execution_variables"]:
                                variablename = variable["name"].replace(" ", "_", -1).lower()
                                if variablename.lower() == actionname_lower:
                                    baseresult = variable["value"]
                                    break
                        except KeyError as e:
                            print("KeyError exec variables: %s" % e)
                            pass
                        except TypeError as e:
                            print("TypeError exec variables: %s" % e)
                            pass
        
            except KeyError as error:
                print(f"KeyError in JSON: {error}")
        
            print(f"After first trycatch")
        
            # 2. Find the JSON data
            if len(baseresult) == 0:
                return ""+appendresult, False
        
            if len(parsersplit) == 1:
                return baseresult+appendresult, False
        
            baseresult = baseresult.replace("\'", "\"")
            basejson = {}
            try:
                basejson = json.loads(baseresult)
            except json.decoder.JSONDecodeError as e:
                return baseresult+appendresult, False
        
            data, is_loop = recurse_json(basejson, parsersplit[1:])
            parseditem = data
            if is_loop:
                print("DATA IS A LOOP - SHOULD WRAP")
                if parsersplit[-1] == "#":
                    print("SET DATA WRAPPER TO NORMAL!")
                    parseditem = "${SHUFFLE_NO_SPLITTER%s}$" % json.dumps(data)
                else:
                    # Return value: ${id[12345, 45678]}$
                    print("SET DATA WRAPPER TO %s!" % parsersplit[-1])
                    parseditem = "${%s%s}$" % (parsersplit[-1], json.dumps(data))

            return parseditem+appendresult, is_loop

        # Parses parameters sent to it and returns whether it did it successfully with the values found
        def parse_params(action, fullexecution, parameter):
            # Skip if it starts with $?
            jsonparsevalue = "$."
            is_loop = False

            # Matches with space in the first part, but not in subsequent parts.
            # JSON / yaml etc shouldn't have spaces in their fields anyway.
            match = ".*?([$]{1}([a-zA-Z0-9 _-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,})"

            # Regex to find all the things
            if parameter["variant"] == "STATIC_VALUE":
                data = parameter["value"]
                actualitem = re.findall(match, data, re.MULTILINE)
                #self.logger.debug(f"\n\nHandle static data with JSON: {data}\n\n")
                #self.logger.info("STATIC PARSED: %s" % actualitem)
                if len(actualitem) > 0:
                    print("ACTUAL: ", actualitem)
                    for replace in actualitem:
                        try:
                            to_be_replaced = replace[0]
                        except IndexError:
                            continue

                        # Handles for loops etc. 
                        value, is_loop = get_json_value(fullexecution, to_be_replaced) 

                        if isinstance(value, str):
                            parameter["value"] = parameter["value"].replace(to_be_replaced, value)
                        elif isinstance(value, dict):
                            parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                        else:
                            print("Unknown type %s" % type(value))
                            try:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                            except json.decoder.JSONDecodeError as e:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, value)


            if parameter["variant"] == "WORKFLOW_VARIABLE":
                print("Handling workflow variable")
                found = False
                try:
                    for item in fullexecution["workflow"]["workflow_variables"]:
                        if parameter["action_field"] == item["name"]:
                            found = True
                            parameter["value"] = item["value"]
                            break
                except KeyError as e:
                    print("KeyError WF variable 1: %s" % e)
                    pass
                except TypeError as e:
                    print("TypeError WF variables 1: %s" % e)
                    pass

                if not found:
                    try:
                        for item in fullexecution["execution_variables"]:
                            if parameter["action_field"] == item["name"]:
                                parameter["value"] = item["value"]
                                break
                    except KeyError as e:
                        print("KeyError WF variable 2: %s" % e)
                        pass
                    except TypeError as e:
                        print("TypeError WF variables 2: %s" % e)
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
                            print("Nothing to replace?: " % e)
                            continue
                        
                        # This will never be a loop aka multi argument
                        parameter["value"] = to_be_replaced 

                        value, is_loop = get_json_value(fullexecution, to_be_replaced)
                        print("Loop: %s" % is_loop)
                        if isinstance(value, str):
                            parameter["value"] = parameter["value"].replace(to_be_replaced, value)
                        elif isinstance(value, dict):
                            parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                        else:
                            print("Unknown type %s" % type(value))
                            try:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
                            except json.decoder.JSONDecodeError as e:
                                parameter["value"] = parameter["value"].replace(to_be_replaced, value)

            return "", parameter["value"], is_loop

        def run_validation(sourcevalue, check, destinationvalue):
            self.logger.info("Checking %s %s %s" % (sourcevalue, check, destinationvalue))

            if check == "=" or check.lower() == "equals":
                if sourcevalue.lower() == destinationvalue.lower():
                    return True
            elif check == "!=" or check.lower() == "does not equal":
                if sourcevalue.lower() != destinationvalue.lower():
                    return True
            elif check.lower() == "startswith":
                if sourcevalue.lower().startswith(destinationvalue.lower()):
                    return True
            elif check.lower() == "endswith":
                if sourcevalue.lower().endswith(destinationvalue.lower()):
                    return True
            elif check.lower() == "contains":
                if destinationvalue.lower() in sourcevalue.lower():
                    return True
            elif check.lower() == "larger than":
                try:
                    if sourcevalue.isdigit() and destinationvalue.isdigit():
                        if int(sourcevalue) > int(destinationvalue):
                            return True
                except AttributeError as e:
                    self.logger.error("Condition larger than failed with values %s and %s: %s" % (sourcevalue, destinationvalue, e))
                    return False
            elif check.lower() == "smaller than":
                try:
                    if sourcevalue.isdigit() and destinationvalue.isdigit():
                        if int(sourcevalue) < int(destinationvalue):
                            return True
                except AttributeError as e:
                    self.logger.error("Condition smaller than failed with values %s and %s: %s" % (sourcevalue, destinationvalue, e))
                    return False
            else:
                self.logger.info("Condition: can't handle %s yet. Setting to true" % check)
                    
            return False

        def check_branch_conditions(action, fullexecution):
            # relevantbranches = workflow.branches where destination = action
            try:
                if fullexecution["workflow"]["branches"] == None or len(fullexecution["workflow"]["branches"]) == 0:
                    return True, ""
            except KeyError:
                return True, ""

            relevantbranches = []
            for branch in fullexecution["workflow"]["branches"]:
                if branch["destination_id"] != action["id"]:
                    continue

                # Remove anything without a condition
                try:
                    if (branch["conditions"]) == 0 or branch["conditions"] == None:
                        continue
                except KeyError:
                    continue

                self.logger.info("Relevant conditions: %s" % branch["conditions"])
                successful_conditions = []
                failed_conditions = []
                for condition in branch["conditions"]:
                    self.logger.info("Getting condition value of %s" % condition)

                    # Parse all values first here
                    sourcevalue = condition["source"]["value"]
                    check, sourcevalue, is_loop = parse_params(action, fullexecution, condition["source"])
                    if check:
                        return False, "Failed condition: %s %s %s because %s" % (sourcevalue, condition["condition"]["value"], destinationvalue, check)


                    #sourcevalue = sourcevalue.encode("utf-8")
                    sourcevalue = parse_wrapper_start(sourcevalue)
                    destinationvalue = condition["destination"]["value"]

                    check, destinationvalue, is_loop = parse_params(action, fullexecution, condition["destination"])
                    if check:
                        return False, "Failed condition: %s %s %s because %s" % (sourcevalue, condition["condition"]["value"], destinationvalue, check)

                    #destinationvalue = destinationvalue.encode("utf-8")
                    destinationvalue = parse_wrapper_start(destinationvalue)
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
                        "re",
                        "matches regex",
                    ]

                    # FIXME - what should I do here?
                    if not condition["condition"]["value"] in available_checks:
                        self.logger.info("Skipping %s %s %s because %s is invalid." % (sourcevalue, condition["condition"]["value"], destinationvalue, condition["condition"]["value"]))
                        continue

                    #print(destinationvalue)
                    # NEGATE 
                    validation = run_validation(sourcevalue, condition["condition"]["value"], destinationvalue)

                    # Configuration = negated because of WorkflowAppActionParam..
                    try:
                        if condition["condition"]["configuration"]:
                            validation = not validation
                    except KeyError:
                        pass

                    if not validation:
                        self.logger.info("Failed condition check for %s %s %s." % (sourcevalue, condition["condition"]["value"], destinationvalue))
                        return False, "Failed condition: %s %s %s" % (sourcevalue, condition["condition"]["value"], destinationvalue)


                # Make a general parser here, at least to get param["name"] = param["value"] in maparameter[string]string
                #for condition in branch.conditons:
    
            return True, ""

        # Checks whether conditions are met, otherwise set 
        branchcheck, tmpresult = check_branch_conditions(action, fullexecution)
        if not branchcheck:
            self.logger.info("Failed one or more branch conditions.")
            action_result["result"] = tmpresult
            action_result["status"] = "FAILURE"
            try:
                ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
                self.logger.info("Result: %d" % ret.status_code)
                if ret.status_code != 200:
                    self.logger.info(ret.text)
            except requests.exceptions.ConnectionError as e:
                self.logger.exception(e)

            print("\n\nRETURNING BECAUSE A BRANCH FAILED\n\n")
            return

        # Replace name cus there might be issues
        # Not doing lower() as there might be user-made functions
        actionname = action["name"]
        if " " in actionname:
            actionname.replace(" ", "_", -1) 
        #if action.generated:
        #    actionname = actionname.lower()
        
        # Runs the actual functions
        try:
            func = getattr(self, actionname, None)
            if func == None:
                self.logger.debug("Failed executing %s because func is None." % actionname)
                action_result["status"] = "FAILURE" 
                action_result["result"] = "Function %s doesn't exist." % actionname
            elif callable(func):
                try:
                    if len(action["parameters"]) < 1:
                        result = await func()
                    else:
                        # Potentially parse JSON here
                        # FIXME - add potential authentication as first parameter(s) here
                        # params[parameter["name"]] = parameter["value"]
                        #print(fullexecution["authentication"]
                        # What variables are necessary here tho hmm

                        params = {}
                        try:
                            for item in action["authentication"]:
                                print("AUTH: ", key, value)
                                params[item["key"]] = item["value"]
                        except KeyError:
                            print("No authentication specified!")
                            pass
                                #action["authentication"] 

                        # calltimes is used to handle forloops in the app itself.
                        # 2 kinds of loop - one in gui with one app each, and one like this,
                        # which is super fast, but has a bad overview (potentially good tho)
                        calltimes = 1
                        result = ""

                        all_executions = []

                        # Multi_parameter has the data for each. variable
                        minlength = 0
                        multi_parameters = json.loads(json.dumps(params))
                        multiexecution = False
                        multi_execution_lists = []
                        for parameter in action["parameters"]:
                            check, value, is_loop = parse_params(action, fullexecution, parameter)

                            if check:
                                raise "Value check error: %s" % Exception(check)

                            # Custom format for ${name[0,1,2,...]}$
                            #submatch = "([${]{2}([0-9a-zA-Z_-]+)(\[.*\])[}$]{2})"
                            submatch = "([${]{2}#?([0-9a-zA-Z_-]+)#?(\[.*\])[}$]{2})"
                            actualitem = re.findall(submatch, value, re.MULTILINE)
                            try:
                                if action["skip_multicheck"]:
                                    print("Skipping multicheck")
                                    actualitem = []
                            except KeyError:
                                pass

                            print("Return value: %s" % value)
                            actionname = action["name"]
                            #print("Multicheck ", actualitem)
                            print("ITEM LENGTH: %d, Actual item: %s" % (len(actualitem), actualitem))
                            if len(actualitem) > 0:
                                multiexecution = True

                                # Loop WITHOUT JSON variables go here. 
                                # Loop WITH variables go in else.
                                print("Before first part in multiexec!")
                                handled = False
                                if len(actualitem[0]) > 2 and actualitem[0][1] == "SHUFFLE_NO_SPLITTER":
                                    print("Pre replacement: %s" % actualitem[0][2])
                                    tmpitem = value

                                    replacement = actualitem[0][2]
                                    if replacement.startswith("\"") and replacement.endswith("\""):
                                        replacement = replacement[1:len(replacement)-1]

                                    replacement = replacement.replace("\'", "\"", -1)
                                    print("POST replacement: %s" % replacement)

                                    json_replacement = replacement
                                    try:
                                        json_replacement = json.loads(replacement)
                                    except json.decoder.JSONDecodeError as e:
                                        print("JSON error singular: %s" % e)

                                    if len(json_replacement) > minlength:
                                        minlength = len(json_replacement)

                                    tmpitem = tmpitem.replace(actualitem[0][0], replacement, 1)
                                    params[parameter["name"]] = tmpitem
                                    multi_execution_lists.append(json_replacement)
                                    multi_parameters[parameter["name"]] = json_replacement 

                                    #print("LENGTH OF ARR: %d" % len(resultarray))
                                    #print("RESULTARRAY: %s" % resultarray)
                                    print("MULTI finished: %s" % replacement)
                                else:
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
                                        except IndexError:
                                            continue

                                        try:
                                            itemlist = json.loads(actualitem)
                                            if len(itemlist) > minlength:
                                                minlength = len(itemlist)

                                            if len(itemlist) > curminlength:
                                                curminlength = len(itemlist)
                                        except json.decoder.JSONDecodeError as e:
                                            print("JSON Error: %s in %s" % (e, actualitem))

                                        replacements[to_be_replaced] = actualitem

                                    # This is a result array for JUST this value.. 
                                    # What if there are more?
                                    print("LENGTH: %d. In second part of else: %s" % (len(itemlist), replacements))
                                    resultarray = []
                                    for i in range(0, curminlength): 
                                        tmpitem = json.loads(json.dumps(parameter["value"]))
                                        for key, value in replacements.items():
                                            replacement = json.dumps(json.loads(value)[i])
                                            if replacement.startswith("\"") and replacement.endswith("\""):
                                                replacement = replacement[1:len(replacement)-1]
                                            #except json.decoder.JSONDecodeError as e:

                                            #print("REPLACING %s with %s" % (key, replacement))
                                            #replacement = parse_wrapper_start(replacement)
                                            tmpitem = tmpitem.replace(key, replacement, -1)

                                        resultarray.append(tmpitem)

                                    # With this parameter ready, add it to... a greater list of parameters. Rofl
                                    print("LENGTH OF ARR: %d" % len(resultarray))
                                    print("RESULTARRAY: %s" % resultarray)
                                    if resultarray not in multi_execution_lists:
                                        multi_execution_lists.append(resultarray)

                                    multi_parameters[parameter["name"]] = resultarray
                            else:
                                # Parses things like int(value)
                                print("Normal parsing (not looping) with data %s" % value)
                                value = parse_wrapper_start(value)

                                params[parameter["name"]] = value
                                multi_parameters[parameter["name"]] = value 

                        # Fix lists here
                        print("CHECKING multi execution list!")
                        if len(multi_execution_lists) > 0:
                            print("\n Multi execution list has more data: %d" % len(multi_execution_lists))
                            filteredlist = []
                            for listitem in multi_execution_lists:
                                if listitem in filteredlist:
                                    continue

                                filteredlist.append(listitem)

                            #print("New list length: %d" % len(filteredlist))
                            if len(filteredlist) > 1:
                                print("Calculating new multi-loop length with %d lists" % len(filteredlist))
                                tmplength = 1
                                for innerlist in filteredlist:
                                    print("List length: %d. %d*%d" % (len(innerlist), len(innerlist), tmplength))
                                    tmplength = len(innerlist)*tmplength

                                minlength = tmplength

                                print("New multi execution length: %d\n" % tmplength)
                        
                        # FIXME - this is horrible, but works for now
                        #for i in range(calltimes):
                        if not multiexecution:
                            print("APP_SDK DONE: Starting NORMAL execution of function")
                            newres = await func(**params)
                            #print("NEWRES: ", newres)
                            if isinstance(newres, str):
                                result += newres
                            else:
                                try:
                                    result += str(newres)
                                except ValueError:
                                    result += "Failed autocasting. Can't handle %s type from function. Must be string" % type(newres)
                                    print("Can't handle type %s value from function" % (type(newres)))
                            print("POST NEWRES RESULT: ", result)
                        else:
                            print("APP_SDK DONE: Starting MULTI execution with values %s of length %d" % (multi_parameters, minlength))
                            # 1. Use number of executions based on the arrays being similar
                            # 2. Find the right value from the parsed multi_params
                            results = []
                            json_object = False
                            for i in range(0, minlength):
                                # To be able to use the results as a list:
                                baseparams = json.loads(json.dumps(multi_parameters))
                                # {'call': ['GoogleSafebrowsing_2_0', 'VirusTotal_GetReport_3_0']}
                                # 1. Check if list length is same as minlength
                                # 2. If NOT same length, duplicate based on length of array
                                # arraylength = 3 ["1", "2", "3"]
                                # arraylength = 4 ["1", "2", "3", "4"]
                                # minlength = 12 - 12/3 = 4 per item = ["1", "1", "1", "1", "2", "2", ...]

                                try:
                                    firstlist = True
                                    for key, value in baseparams.items():

                                        if isinstance(value, list):
                                            try:
                                                newvalue = value[i]
                                            except IndexError:
                                                pass

                                            if len(value) != minlength and len(value) > 0:
                                                newarray = []
                                                print("VALUE: ", value)
                                                additiontime = minlength/len(value)
                                                print("Bad length for value: %d - should be %d. Additiontime: %d" % (len(value), minlength, additiontime))
                                                if firstlist:
                                                    print("Running normal list (FIRST)")
                                                    for subvalue in value:
                                                        for number in range(int(additiontime)):
                                                            newarray.append(subvalue)
                                                else:
                                                    #print("Running secondary lists")
                                                    ## 1. Set up length of array
                                                    ## 2. Put values spread out
                                                    # FIXME: This works well, except if lists are same length
                                                    newarray = [""] * minlength

                                                    cnt = 0
                                                    for number in range(int(additiontime)):
                                                        for subvaluerange in range(len(value)):
                                                            # newlocation = number+(additiontime*subvaluerange)
                                                            # print("%d+(%d*%d) = %d. VAL: %s" % (number, additiontime, subvaluerange, newlocation, value[subvaluerange]))
                                                            # Reverse if same length?
                                                            if int(minlength/len(value)) == len(value):
                                                                tmp = int(len(value)-subvaluerange-1)
                                                                print("NEW: %d" % tmp)
                                                                newarray[cnt] = value[tmp] 
                                                            else:
                                                                newarray[cnt] = value[subvaluerange] 
                                                            cnt += 1

                                                #print("Newarray =", newarray)
                                                newvalue = newarray[i]
                                                firstlist = False

                                            baseparams[key] = newvalue
                                except IndexError as e:
                                    print("IndexError: %s" % e)
                                    baseparams[key] = "IndexError: %s" % e
                                except KeyError as e:
                                    print("KeyError: %s" % e)
                                    baseparams[key] = "KeyError: %s" % e

                                print("Running with params %s" % baseparams) 
                                ret = await func(**baseparams)
                                if isinstance(ret, dict) or isinstance(ret, list):
                                    results.append(ret)
                                    json_object = True
                                else:
                                    ret = ret.replace("\"", "\\\"", -1)

                                    try:
                                        results.append(json.loads(ret))
                                        json_object = True
                                    except json.decoder.JSONDecodeError as e:
                                        #print("Json: %s" % e)
                                        results.append(ret)

                                #print("Inner ret parsed: %s" % ret)

                            # Dump the result as a string of a list
                            #print("RESULTS: %s" % results)
                            if isinstance(results, list):
                                print("JSON OBJECT? ", json_object)
                                if json_object:
                                    result = json.dumps(results)
                                else:
                                    result = "["
                                    for item in results:
                                        try:
                                            json.loads(item)
                                            result += item
                                        except json.decoder.JSONDecodeError as e:
                                            # Common nested issue which puts " around everything
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
                                print("Normal result?")
                                result = results
                                
                    print("RESULT: %s" % result)
                    action_result["status"] = "SUCCESS" 
                    action_result["result"] = str(result)
                    if action_result["result"] == "":
                        action_result["result"] = result

                    self.logger.debug(f"Executed {action['label']}-{action['id']} with result: {result}")
                    #self.logger.debug(f"Data: %s" % action_result)
                except TypeError as e:
                    print("TypeError issue: %s" % e)
                    action_result["status"] = "FAILURE" 
                    action_result["result"] = "TypeError: %s" % str(e)
            else:
                print("Function %s doesn't exist?" % action["name"])
                self.logger.error(f"App {self.__class__.__name__}.{action['name']} is not callable")
                action_result["status"] = "FAILURE" 
                action_result["result"] = "Function %s is not callable." % actionname

        except Exception as e:
            print(f"Failed to execute: {e}")
            self.logger.exception(f"Failed to execute {e}-{action['id']}")
            action_result["status"] = "FAILURE" 
            action_result["result"] = f"General exception: {e}" 

        action_result["completed_at"] = int(time.time())

        # Send the result :)
        self.send_result(action_result, headers, stream_path)
        return


        #STOPCOPY
        # !!! Let the above line stay - its used for some horrible codegeneration / stitching !!! # 

    @classmethod
    async def run(cls):
        """ Connect to Redis and HTTP session, await actions """
        logging.basicConfig(format="{asctime} - {name} - {levelname}:{message}", style='{')
        logger = logging.getLogger(f"{cls.__name__}")
        logger.setLevel(logging.DEBUG)
        print("Started execution!!")

        app = cls(redis=None, logger=logger, console_logger=logger)

        # Authorization for the app/function to control the workflow
        # Function will crash if its wrong, which it probably should. 

        await app.execute_action(app.action)
