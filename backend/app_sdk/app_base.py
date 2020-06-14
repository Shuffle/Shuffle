import os
import sys
import re
import time 
import json
import logging
import requests

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
        self.apikey = os.getenv("FUNCTION_APIKEY", "")
        self.authorization = os.getenv("AUTHORIZATION", "")
        self.current_execution_id = os.getenv("EXECUTIONID", "")

        if len(self.action) == 0:
            print("ACTION env not defined")
            sys.exit(0)
        if len(self.apikey) == 0:
            print("FUNCTION_APIKEY env not defined")
            sys.exit(0)
        if len(self.authorization) == 0:
            print("AUTHORIZATION env not defined")
            sys.exit(0)
        if len(self.current_execution_id) == 0:
            print("EXECUTIONID env not defined")
            sys.exit(0)

        if isinstance(self.action, str):
            self.action = json.loads(self.action)
    
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
        self.logger.info("ACTION RESULT: %s", action_result)

        headers = {
            "Content-Type": "application/json",     
            "Authorization": "Bearer %s" % self.apikey
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
            return

        # Verify whether there are any parameters with ACTION_RESULT required
        # If found, we get the full results list from backend
        fullexecution = {}
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
                return
        except requests.exceptions.ConnectionError as e:
            self.logger.info("Connectionerror: %s" %  e)
            return

        self.logger.info("AFTER FULLEXEC stream result")

        # Takes a workflow execution as argument
        # Returns a string if the result is single, or a list if it's a list
        def get_json_value(execution_data, input_data):
            parsersplit = input_data.split(".")
            actionname = parsersplit[0][1:].replace(" ", "_", -1)
            print(f"Actionname: {actionname}")
        
            # 1. Find the action
            baseresult = ""
            actionname_lower = actionname.lower()
            try: 
                if actionname_lower == "exec": 
                    baseresult = execution_data["execution_argument"]
                else:
                    for result in execution_data["results"]:
                        resultlabel = result["action"]["label"].replace(" ", "_", -1).lower()
                        if resultlabel.lower() == actionname_lower:
                            baseresult = result["result"]
                            break
                    
                    print("BEFORE VARIABLES!")
                    if len(baseresult) == 0:
                        print("Variables: %s" % execution_data["workflow"]["workflow_variables"])
                        for variable in execution_data["workflow"]["workflow_variables"]:
                            variablename = variable["name"].replace(" ", "_", -1).lower()

                            if variablename.lower() == actionname_lower:
                                baseresult = variable["value"]
                                break
        
            except KeyError as error:
                print(f"KeyError in JSON: {error}")
        
            print(f"After first trycatch")
        
            # 2. Find the JSON data
            if len(baseresult) == 0:
                return ""
        
            if len(parsersplit) == 1:
                return baseresult
        
            baseresult = baseresult.replace("\'", "\"")
            basejson = {}
            try:
                basejson = json.loads(baseresult)
            except json.decoder.JSONDecodeError as e:
                return baseresult
        
            try:
                cnt = 0
                for value in parsersplit[1:]:
                    cnt += 1
        
                    if value == "#":
                        # FIXME - not recursive - should go deeper if there are more #
                        print("HANDLE RECURSIVE LOOP ")
                        returnlist = []
                        for innervalue in basejson:
                            #print("Value: %s" % value[parsersplit[cnt+1]])
                            returnlist.append(innervalue[parsersplit[cnt+1]])
        
                        # Example format: ${[]}$
                        return "${%s%s}$" % (parsersplit[cnt+1], json.dumps(returnlist))
        
                    else:
                        if isinstance(basejson[value], str):
                            print(f"LOADING STRING '%s' AS JSON" % basejson[value]) 
                            try:
                                basejson = json.loads(basejson[value])
                            except json.decoder.JSONDecodeError as e:
                                print("RETURNING BECAUSE '%s' IS A NORMAL STRING" % basejson[value])
                                return basejson[value]
                        else:
                            basejson = basejson[value]
        
            except KeyError as e:
                return "KeyError: %s" % e
            except IndexError as e:
                return "IndexError: %s" % e
        
            return basejson

        def parse_params(action, fullexecution, parameter):
            jsonparsevalue = "$."
            match = ".*([$]{1}([a-zA-Z0-9()# _-]+\.?){1,})"

            # Regex to find all the things
            if parameter["variant"] == "STATIC_VALUE":
                data = parameter["value"]
                actualitem = re.findall(match, data, re.MULTILINE)
                #self.logger.debug(f"\n\nHandle static data with JSON: {data}\n\n")
                #self.logger.info("STATIC PARSED: %s" % actualitem)
                if len(actualitem) > 0:
                    for replace in actualitem:
                        try:
                            to_be_replaced = replace[0]
                        except IndexError:
                            continue

                        value = get_json_value(fullexecution, to_be_replaced)
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
                for item in fullexecution["workflow"]["workflow_variables"]:
                    if parameter["action_field"] == item["name"]:
                        parameter["value"] = item["value"]
                        break

            elif parameter["variant"] == "ACTION_RESULT":
                # FIXME - calculate value based on action_field and $if prominent
                # FIND THE RIGHT LABEL
                # GET THE LABEL'S RESULT 
                
                tmpvalue = ""
                self.logger.info("ACTION FIELD: %s" % parameter["action_field"])

                #"$%s%s" % 
                fullname = "$"

                if parameter["action_field"] == "Execution Argument":
                    tmpvalue = fullexecution["execution_argument"]
                    fullname += "exec"
                else:
                    fullname += parameter["action_field"]

                if parameter["value"].startswith(jsonparsevalue):
                    fullname += parameter["value"][2:]
                else:
                    fullname = "$%s" % parameter["action_field"]

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

                        value = get_json_value(fullexecution, to_be_replaced)
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

            return "", parameter["value"]

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
            
                self.logger.info("Relevant branch: %s" % branch)

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
                    if condition["source"]["variant"] == "" or condition["source"]["variant"]== "STATIC_VALUE":
                        condition["source"]["variant"]= "STATIC_VALUE"
                    else:
                        check, sourcevalue = parse_params(action, fullexecution, condition["source"])
                        if check:
                            return False, "Failed condition: %s %s %s because %s" % (sourcevalue, condition["condition"]["value"], destinationvalue, check)

                    print(sourcevalue)
                    destinationvalue = condition["destination"]["value"]

                    if condition["destination"]["variant"]== "" or condition["destination"]["variant"]== "STATIC_VALUE":
                        condition["destination"]["variant"] = "STATIC_VALUE"
                    else:
                        check, destinationvalue = parse_params(action, fullexecution, condition["destination"])
                        if check:
                            return False, "Failed condition: %s %s %s because %s" % (sourcevalue, condition["condition"]["value"], destinationvalue, check)

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
                    if not run_validation(sourcevalue, condition["condition"]["value"], destinationvalue):
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
            action_result["status"] = "SKIPPED"
            try:
                ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
                self.logger.info("Result: %d" % ret.status_code)
                if ret.status_code != 200:
                    self.logger.info(ret.text)
            except requests.exceptions.ConnectionError as e:
                self.logger.exception(e)

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
                        for parameter in action["parameters"]:
                            check, value = parse_params(action, fullexecution, parameter)
                            if check:
                                raise Exception(check)

                            # Custom format for ${name[0,1,2,...]}$
                            submatch = "([${]{2}([0-9a-zA-Z_-]+)(\[.*\])[}$]{2})"
                            actualitem = re.findall(submatch, value, re.MULTILINE)
                            if len(actualitem) > 0:
                                multiexecution = True
                                
                                # This is here to handle for loops within variables.. kindof
                                # 1. Find the length of the longest array
                                # 2. Build an array with the base values based on parameter["value"] 
                                # 3. Get the n'th value of the generated list from values
                                # 4. Execute all n answers 
                                replacements = {}
                                for replace in actualitem:
                                    try:
                                        to_be_replaced = replace[0]
                                        actualitem = replace[2]
                                    except IndexError:
                                        continue

                                    itemlist = json.loads(actualitem)
                                    if len(itemlist) > minlength:
                                        minlength = len(itemlist)

                                    replacements[to_be_replaced] = actualitem

                                # This is a result array for JUST this value.. 
                                # What if there are more?
                                resultarray = []
                                for i in range(0, minlength): 
                                    tmpitem = json.loads(json.dumps(parameter["value"]))
                                    for key, value in replacements.items():
                                        replacement = json.loads(value)[i]
                                        tmpitem = tmpitem.replace(key, replacement, -1)

                                    resultarray.append(tmpitem)

                                # With this parameter ready, add it to... a greater list of parameters. Rofl
                                multi_parameters[parameter["name"]] = resultarray
                            else:
                                params[parameter["name"]] = value
                                multi_parameters[parameter["name"]] = value 
                        
                        # FIXME - this is horrible, but works for now
                        #for i in range(calltimes):
                        if not multiexecution:
                            print("Params: %s" % params)
                            print("RUNNING NORMAL EXECUTION")
                            result += await func(**params)
                        else:
                            print("MULTI EXECUTION: ", multi_parameters)
                            # 1. Use number of executions based on longest array
                            # 2. Find the right value from the parsed multi_params

                            results = []
                            json_object = False
                            for i in range(0, minlength):
                                # To be able to use the results as a list:
                                baseparams = json.loads(json.dumps(multi_parameters))
                                
                                try:
                                    for key, value in baseparams.items():
                                        if isinstance(value, list):
                                            baseparams[key] = value[i]
                                except IndexError as e:
                                    print("IndexError: %s" % e)
                                    baseparams[key] = "IndexError: %s" % e
                                except KeyError as e:
                                    print("KeyError: %s" % e)
                                    baseparams[key] = "KeyError: %s" % e

                                #print("Running with params %s" % baseparams) 
                                ret = await func(**baseparams)
                                print("Inner ret: %s" % ret)
                                    
                                try:
                                    results.append(json.loads(ret))
                                    json_object = True
                                except json.decoder.JSONDecodeError as e:
                                    results.append(ret)

                            # Dump the result as a string of a list
                            print("RESULTS: %s" % results)
                            if isinstance(results, list):
                                print("JSON OBJECT? ", json_object)
                                if json_object:
                                    result = json.dumps(results)
                                else:
                                    result = "[\""+"\", \"".join(results)+"\"]"
                            else:
                                print("Normal result?")
                                result = results
                                
                            print("RESULT: %s" % result)

                    action_result["status"] = "SUCCESS" 
                    action_result["result"] = str(result)
                    if action_result["result"] == "":
                        action_result["result"] = result

                    self.logger.debug(f"Executed {action['label']}-{action['id']} with result: {result}")
                    self.logger.debug(f"Data: %s" % action_result)
                except TypeError as e:
                    action_result["status"] = "FAILURE" 
                    action_result["result"] = "TypeError: %s" % str(e)
            else:
                print("Not callable?")
                self.logger.error(f"App {self.__class__.__name__}.{action['name']} is not callable")
                action_result["status"] = "FAILURE" 
                action_result["result"] = "Function %s is not callable." % actionname

        except Exception as e:
            print(f"Failed to execute: {e}")
            self.logger.exception(f"Failed to execute {e}-{action['id']}")
            action_result["status"] = "FAILURE" 
            action_result["result"] = "Exception: %s" % e

        action_result["completed_at"] = int(time.time())

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
