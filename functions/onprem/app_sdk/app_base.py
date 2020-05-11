import os
import sys
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
        self.logger.info("Before initial stream result")
        try:
            ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
            self.logger.info("Workflow: %d" % ret.status_code)
            if ret.status_code != 200:
                self.logger.info(ret.text)
        except requests.exceptions.ConnectionError as e:
            print("Connectionerror: %s" %  e)
            return
        self.logger.info("AFTER initial stream result")

        # Verify whether there are any parameters with ACTION_RESULT required
        # If found, we get the full results list from backend
        
        fullexecution = {}
        try:
            tmpdata = {
                "authorization": self.authorization,
                "execution_id": self.current_execution_id
            }

            self.logger.info("Auth: %s", tmpdata)

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

        def parse_params(action, fullexecution, parameter):
            jsonparsevalue = "$."
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
                print(parameter["action_field"])

                if parameter["action_field"] == "Execution Argument":
                    tmpvalue = fullexecution["execution_argument"]
                else:
                    self.logger.info("WORKFLOW EXEC BELOW")
                    self.logger.info(fullexecution)
                    self.logger.info(fullexecution["results"])
                    self.logger.info(fullexecution["workflow"]["actions"])
                    self.logger.info("ACTIONS ABOVE")
                    # redundancy..

                    tmpid = ""
                    for item in fullexecution["workflow"]["actions"]:
                        if item["label"] == parameter["action_field"]:
                            tmpid = item["id"]

                    if not tmpid:
                        self.logger.error("Value not found for that id: %s. Exiting" % parameter["action_field"])
                        raise Exception("Value for %s was not found in workflow actions" % parameter["action_field"])

                    for subresult in fullexecution["results"]:
                        if subresult["action"]["id"] == tmpid:
                            tmpvalue = subresult["result"]
                            break

                    if not tmpvalue:
                        self.logger.error("Value not found for label %s. Exiting" % parameter["action_field"])
                        raise Exception("Value for %s was not found" % parameter["action_field"])

                # Override locally with JSON data 
                if parameter["value"].startswith(jsonparsevalue):
                    parsersplit = parameter["value"].split(".")

                    # Convert to json here
                    self.logger.info("JSON HANDLING: %s" % tmpvalue)
                    tmpvalue = tmpvalue.replace("\'", "\"")
                    try:
                        if isinstance(tmpvalue, str):
                            newtmp = json.loads(tmpvalue)
                    except json.decoder.JSONDecodeError as e:
                        raise Exception("JSON error: %s" % e)

                    try:
                        #previousvalue = parsersplit[1]
                        for value in parsersplit[1:]:
                            # Might need to be recursive here, because it can go
                            # multiple layers ($.result.#.test.users.#.name)
                            # That would give executions of:
                            # 1 + result.length + users.length
                            # This is also just for one param
                            #if parsersplit[1:][count] == "#":
                            if value == "#":
                                # This means we already have an array
                                # for item in newtmp:
                                self.logger.info("THERE SHOULD BE A LOOP HERE")
                                # This works, but it needs to be split into multiples hurr
                                # Whenever there is a loop, there is a need to 
                                # check whether there are more loops, then do 
                                # recursion to all the bottom leaves

                                #paramnamevalue.append(newtmp
                                newtmp = newtmp[0]
                                # Choose numero uno which will then be handled by the next again
                                # params[parameter["name"]].append(value.nextitem)
                            else:
                                newtmp = newtmp[value]
                    except KeyError as e:
                        return "KeyError: %s" % e, ""
                    except IndexError as e:
                        return "IndexError: %s" % e, ""

                    parameter["value"] = str(newtmp)
                else:
                    parameter["value"] = tmpvalue

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
                                print(key, value)
                                params[item["key"]] = item["value"]
                        except KeyError:
                            pass
                                #action["authentication"] 

                        # calltimes is used to handle forloops in the app itself.
                        # 2 kinds of loop - one in gui with one app each, and one like this,
                        # which is super fast, but has a bad overview (potentially good tho)
                        calltimes = 1
                        result = ""
                        paramiter = []
                        for parameter in action["parameters"]:
                            #self.logger.info(parameter)
                            #print(fullexecution)

                            
                            check, value = parse_params(action, fullexecution, parameter)
                            if check:
                                raise Exception(check)

                            params[parameter["name"]] = value
                            # p["value"]
                        
                        # FIXME - this is horrible, but works for now
                        #for i in range(calltimes):
                        result += await func(**params)

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

        app = cls(redis=None, logger=logger, console_logger=logger)

        # Authorization for the app/function to control the workflow
        # Function will crash if its wrong, which it probably should. 

        await app.execute_action(app.action)
