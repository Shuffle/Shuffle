import asyncio
import logging
import json
import sys
import os
import signal
import requests
import os
import time
from collections import deque
from inspect import getcoroutinelocals

from google.cloud import pubsub

import aiohttp
import aioredis

from message_types import message_dumps, message_loads, NodeStatusMessage, WorkflowStatusMessage, StatusEnum
from helpers import get_walkoff_auth_header 
from redis_helpers import connect_to_redis_pool, xdel, deref_stream_message
from workflow_types import (Node, Action, Condition, Transform, Parameter, Trigger,
                                   ParameterVariant, Workflow, workflow_dumps, workflow_loads, ConditionException)

logging.basicConfig(level=logging.INFO, format="{asctime} - {name} - {levelname}:{message}", style='{')
logger = logging.getLogger("WORKER")
# logging.getLogger("asyncio").setLevel(logging.DEBUG)
# logger.setLevel(logging.DEBUG)

CONTAINER_ID = ""#os.getenv("HOSTNAME")
APIKEY = ""#os.getenv("FUNCTION_APIKEY")

# FIXME
#apiurl = "http://localhost:5001"
apiurl = "https://shuffler.io"

class Worker:
    def __init__(self, workflow: Workflow = None, start_action: str = None, redis: aioredis.Redis = None,
                 session: aiohttp.ClientSession = None):
        self.workflow = workflow
        self.start_action = start_action if start_action is not None else self.workflow.start
        self.results_stream = f"{workflow.execution_id}:results"
        self.parallel_accumulator = {}
        self.accumulator = {}
        self.parallel_in_process = {}
        self.in_process = {}
        self.redis = redis
        self.streams = set()
        self.scheduling_tasks = set()
        self.results_getter_task = None
        self.parallel_tasks = set()
        self.workflow_tasks = set()
        self.execution_task = None
        self.session = session
        self.token = None
        self.parent_map = {}
        self.cancelled = []
        self.results = {}

        self.execution_id = ""
        self.workflow_id = ""
        self.id = ""
        self.locations = []
        self.project_id = ""
        self.authorization = ""
        self.start_id = start_action.id if start_action is not None else ""

    async def cancel_subgraph(self, node):
        """
            Cancels the task related to the current node as well as the tasks related to every child of that node.
            Also removes them from the worker's internal in_process queue.
        """
        # dependents = self.workflow.get_dependents(node)
        cancelled_tasks = set()

        self.cancelled.append(node.id)
        to_cancel = await self.cancel_helper(node, [node.id])

        for task in self.scheduling_tasks:
            for _, arg in getcoroutinelocals(task._coro).items():
                if isinstance(arg, Node):
                    if arg.id in to_cancel:
                        self.in_process.pop(arg.id)
                        self.accumulator[arg.id] = None
                        self.cancelled.append(arg.id)
                        task.cancel()
                        cancelled_tasks.add(task)

        await asyncio.gather(*cancelled_tasks, return_exceptions=True)

    # This is a very specific one, that might be fucked up by an action named the same thing. 
    # Its this way because of a weird translation from Triggers to Actions that didn't 
    # really work very well
    def handle_user_input_node(self, node):
        print("Handle user input. Params: %d!" % len(node.parameters))

        data = ""
        options = ""
        actiontypes = []
        for parameter in node.parameters:
            print("Param: %s" % parameter)
            if parameter.name == "alertinfo":
                data = parameter.value
            elif parameter.name == "options":
                options = parameter.value
            elif parameter.name == "type":
                actiontypes = parameter.value.split(",")

        print("Data: ", data)
        print("Options: ", options)
        print("Types: ", actiontypes)

        executed = False
        headers = {
            "Authorization": "Bearer %s" % APIKEY,
            "Content-Type": "application/json",
        }

        for actiontype in actiontypes:
            if actiontype == "email":
                print("SEND EMAIL!")
                
                #apiurl = "http://localhost:5001"
                mailurl = "%s/functions/sendmail" % apiurl
                data = {
                    "targets": ["frikky@shuffler.io"],
                    "body": data,
                    "subject": "Shuffle alert requires input!",
                    "type": "User input",
                    "sender_company": "Shuffle",
                    "reference_execution": self.execution_id,
                    "workflow_id": self.workflow_id,
                    "execution_type": options,
                    "start": node.id,
                }

                # Add it to actionResult here because of start time!
                params = self.dereference_params_pubsub(node)

                ret = requests.post(mailurl, headers=headers, json=data)
                logger.debug("Ret: %s" % ret.text)
                logger.debug("Status: %d" % ret.status_code)

                if ret.status_code == 200 or ret.status_code == 201:
                    executed = True
            elif actiontype.lower() == "sms":
                print("Handle SMS!")
                executed = True

        if executed:
            actionurl = "%s/api/v1/streams" % apiurl
            action = {
                "name": node.name,
                "app_name": node.app_name,
                "app_version": node.app_version,
                "label": node.label,
                "environment": node.environment,
                "id": node.id,
            }

            action_result = {
                "action": action,
                "authorization": self.authorization,
                "execution_id": self.execution_id,
                "result": "",
                "started_at": int(time.time()),
                "status": "WAITING",
            }


            actionret = requests.post(actionurl, headers=headers, json=action_result)
            logger.debug("Actionret: %d", actionret.status_code)
            logger.debug("Actionret: %s", actionret.text)

        print("SHOULD KILL THE EXECUTION (stop this branch)!")

    def execute_workflow_pubsub(self):
        """
            Do a simple BFS to visit and schedule each node in the workflow. We assume every node will run and thus preemptively schedule them all. We will clean up any nodes that will not run due to conditions or triggers
        """
        visited = {self.start_action}
        queue = deque([self.start_action])
        self.scheduling_tasks = set()
        while queue:
            node = queue.pop()
            logger.debug("NODE INFO: %s, %s, %s, %s" % (node.name, node.app_name, node.app_version, node.label))
            parents = {n.id: n for n in self.workflow.predecessors(node)} if node is not self.start_action and node.id is not self.workflow.start else {}
            children = {n.id: n for n in self.workflow.successors(node)}

            for parent_id in parents:
                if node.id not in self.parent_map.keys():
                    self.parent_map[node.id] = 1
                else:
                    self.parent_map[node.id] = self.parent_map[node.id] + 1

            self.in_process[node.id] = node

            if isinstance(node, Action):
                node.execution_id = self.workflow.execution_id  # the app needs this as a key for the redis queue

            # Custom for trigger actions
            if node.name == "User Input" and node.app_name == "User Input":
                logger.info("Handling user input!")

                # Skipping new nodes
                if self.start_id != node.id:
                    self.handle_user_input_node(node)
                    break
                else:
                    logger.info("Skipping user input as its start node!") 

            print("NAME: %s, ENV: %s, LABEL" % (node.name, node.environment))
            if node.environment == "cloud":
                self.scheduling_tasks.add(self.schedule_node_pubsub(node, parents, children))

            print("EXIT NAME: %s, ENV: %s, LABEL" % (node.name, node.environment))
            for child in sorted(children.values(), reverse=True):
                if child not in visited:
                    queue.appendleft(child)
                    visited.add(child)

            # Checks whether all actions are finished
            finished = self.get_action_results_pubsub()
            if finished:
                print("Got finished and will return!")
                break

    def dereference_params_pubsub(self, action: Action):
        param_ret = []
        global_vars = {}

        print(action.parameters)
        for param in action.parameters:
            data = {"value": param.value, "name": param.name, "action_field": param.action_field, "variant": "STATIC_VALUE"}

            if param.variant == ParameterVariant.STATIC_VALUE:
                data["variant"] = "STATIC_VALUE"
            elif param.variant == ParameterVariant.ACTION_RESULT:
                data["variant"] = "ACTION_RESULT"
            elif param.variant == ParameterVariant.WORKFLOW_VARIABLE:
                data["variant"] = "WORKFLOW_VARIABLE"
            elif param.variant == ParameterVariant.GLOBAL:
                data["variant"] = "GLOBAL"
            else:
                logger.error(f"Unable to dereference parameter:{param} for action:{action}")
                break
    
            param_ret.append(data)

        return param_ret
 
    def abort(self):
        logger.info("ABORTING %s BECAUSE OF ERROR WITH FUNCTION EXECUTION" % self.execution_id)
        url = f"{apiurl}/api/v1/workflows/{self.workflow_id}/executions/{self.execution_id}/abort"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {APIKEY}"
        }

        ret = requests.get(url, headers=headers, timeout=5)
        logger.info("Aborted with status: %d and text:\n%s" % (ret.status_code, ret.text))
        sys.exit(0)

    def schedule_node_pubsub(self, node, parents, children):
        """ Waits until all dependencies of an action are met and then schedules the action """
        logger.info(f"Scheduling node {node.id} ({node.name})...")

        logger.info(self.accumulator)
        while not all(parent.id in self.accumulator for parent in parents.values()):
            time.sleep(1)
            #await asyncio.sleep(0)

        logger.info(f"Node {node.id} ({node.name}) ready to execute.")

        # node has more than one parent, check if both parent nodes have been cancelled
        if len(parents) > 1:
            count = 0
            for parent in parents:
                if parent in self.cancelled:
                    count = count + 1

            if count == self.parent_map[node.id]:
                self.cancel_subgraph(node)

        print(type(node))

        if isinstance(node, Action):
            print("NODE: %s" % node)
            params = self.dereference_params_pubsub(node)
            print("PARAMS: %s" % params)

            # Added authorization to send to function
            message = {
                "parameters": params,
                "execution_id": self.execution_id,
                "authorization": self.authorization,
                "node_project": self.project_id,
                "name": node.name,
                "app_name": node.app_name,
                "app_version": node.app_version,
                "id": node.id,
                "label": node.name,
            }

            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {APIKEY}"
            }

            # Uses version for production apps, but ID for private apps
            functionname = f"{node.app_name}-{node.app_version}"
            if not node.sharing:
                functionname = f"{node.app_name}-{node.private_id}" 

            print(f"Functionname (pre): {functionname}") 

            functionname = functionname.replace("_", "-")
            functionname = functionname.replace(":", "-")
            functionname = functionname.replace(".", "-")
            functionname = functionname.replace(" ", "-")

            print(f"Functionname (post): {functionname}") 

            logger.info(self.locations)
            logger.info(self.project_id)
            for location in self.locations:
                url = f"https://{location}-{self.project_id}.cloudfunctions.net/{functionname}"

                #print(message)
                try:
                    ret = requests.post(url, headers=headers, json=message)

                    # If any error at all, just quit the entire thing (abort)
                    if ret.status_code == 500 or ret.status_code == 401:
                        logger.info("Status: %d. There is an error with ret when starting %s. Should cancel execution and exit. RAW: %s" % (ret.status_code, url, ret.text))
                        self.abort()
                except requests.exceptions.ReadTimeout as e:
                    logger.debug(e)
                    logger.info("There is an error with ret (readtimeout). Should cancel execution and exit.")
                    self.abort()
                except requests.exceptions.ConnectionError as e:
                    logger.debug(e)
                    logger.info("There is an error with ret (connectionerror). Should cancel execution and exit.")
                    self.abort()

                #logger.debug(ret.text)
                logger.debug(ret.status_code)

                # FIXME - only in one location, e.g. eu-west?
                break

            group = f"{node.app_name}:{node.app_version}"
            stream = f"{node.execution_id}:{group}"

        logger.info(f"Scheduled {node}")

    
    def get_action_results_pubsub(self):
        """ Continuously monitors the results queue until all scheduled actions have been completed """
        results_stream = f"{self.workflow.execution_id}:results"

        # 1. Get the results for the workflowexecution. POST with authorization and ID should do the trick
        # 2. Check whether the whole thing is still executing
        # 3. Check whether the status of self.in_process is updated, if so, remove it from in progress
        # 4. Schedule the next nodes somehow
        print(len(self.in_process), len(self.parallel_in_process))
        print(self.in_process, len(self.parallel_in_process))

        url = f"{apiurl}/api/v1/streams/results"
        #if self.project_id != "":
        #    url = f"https://{self.project_id}.appspot.com/api/v1/streams/results"
        #    

        headers = {"Content-Type": "application/json"}

        # Uses workflow specific authorization generated for priviliged access
        message = {"authorization": self.authorization, "execution_id": self.execution_id}
        
        sleeptime = 2
        logger.info(url)

        logger.info(f"Waiting {sleeptime} seconds for new updates in the nodestream...")
        while len(self.in_process) > 0 or len(self.parallel_in_process) > 0:
            # Ask for all nodes, and check every single one that's in progress
            print("Items in process: %s" % self.in_process)
            ret = requests.post(url, headers=headers, json=message)
            if ret.status_code != 200:
                logger.exception("Something went wrong getting workflow status for %s with auth %s. Raw: %s. Status: %d" % (self.execution_id, self.authorization, ret.text, ret.status_code))
                time.sleep(sleeptime)
                continue

            # PAUSED, AWAITING_DATA, PENDING, COMPLETED, ABORTED, EXECUTING, SUCCESS, FAILURE
            # FIXME - have this?
            if ret.json()["status"] == "FINISHED" or ret.json()["status"] == "ABORTED" or ret.json()["status"] == "FAILURE":
                print("Entire thing is done with status %s - exiting" % ret.json()["status"])
                return True
                
            self.results = ret.json()

            # FIXME - REMOVE COMMENTS
            # FIXME - This might be wrong for multiple reasons
            if self.results.get("results") == "" or self.results.get("results") == None:
                print("Couldn't find results in results - getting new")
                logger.info(self.results)
                self.results["results"] = []
                #print("IS IT DONE? - RETURNING TRUE")
                #return  

            for node_message in self.results["results"]:
                # Ensure that the received NodeStatusMessage is for an action we launched
                #print(node_message)
                #print(self.in_process)
                # FIXME - might be an issue with same kind of node with same ID here
                if node_message["action"]["id"] in self.in_process:
                    if node_message["status"] == "EXECUTING":
                        logger.info(f"Got EXECUTING result for: {node_message['action']['name']}-{node_message['execution_id']}")
                    elif node_message["status"] == "WAITING":
                        # This is just for user-inputted items
                        logger.info("Should only be here the SECOND time around (after user inputted)!")
                        logger.info(f"Got WAITING result for: {node_message['action']['name']}-{node_message['execution_id']}. Updating it to SUCCESS now that a user continued.")
                        self.accumulator[node_message["action"]["id"]] = "SUCCESS"
                        self.in_process.pop(node_message["action"]["id"], None)

                        logger.debug("start_id: %s, node.id: %s", self.start_id, node_message["action"]["id"])
                        if self.start_id == node_message["action"]["id"]:
                            logger.info("HANDLING USER INPUT AS START NODE - SETTING TO SUCCESS!") 
                            # Check if its the same, then update it to success
                            headers = {
                                "Authorization": "Bearer %s" % APIKEY,
                                "Content-Type": "application/json",
                            }

                            # Set it to successful here?
                            actionurl = "%s/api/v1/streams" % apiurl
                            action_result = node_message
                            action_result["status"] = "SUCCESS"
                            action_result["authorization"] = self.authorization
                            action_result["completed_at"] = int(time.time())
                            action_result["result"] = "User clicked continue!"
                            actionret = requests.post(actionurl, headers=headers, json=action_result)
                    elif node_message["status"] == "SKIPPED":
                        # FIXME - handle SKIPPED - these are 
                        logger.info(f"GOT SKIPPEED result for: {node_message['action']['name']}-{node_message['execution_id']}")

                    elif node_message["status"] == "SUCCESS":
                        # Adds the data to accumulator with success AND
                        # removes the successful ones, which breaks the loop
                        self.accumulator[node_message["action"]["id"]] = node_message["result"]
                        logger.info(f"Worker received result for: {node_message['action']['name']}-{node_message['execution_id']}: {node_message['result']}")
                        self.in_process.pop(node_message["action"]["id"], None)
                    elif node_message["status"] == "FAILURE":
                        self.accumulator[node_message["action"]["id"]] = node_message["result"]

                        # FIXME - cancel nodes
                        #await self.cancel_subgraph(self.workflow.nodes[node_message.node_id])  # kill the children!
                        logger.info(f"Worker received error \"{node_message['result']}\" for: {node_message['action']['name']}-"
                                    f"{node_message['execution_id']}")

                    else:
                        logger.error(f"Unknown message status received: {node_message}")
                        node_message = None

            time.sleep(sleeptime)

        return False

def abort(message, workflow_id, execution_id):
    logger.info("ABORTING %s BECAUSE OF ERROR WITH FUNCTION STARTUP" % execution_id)
    logger.info("Message: %s" % message)
    url = f"{apiurl}/api/v1/workflows/{workflow_id}/executions/{execution_id}/abort"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {APIKEY}"
    }

    ret = requests.get(url, headers=headers, timeout=5)
    logger.info("Aborted with status: %d and text:\n%s" % (ret.status_code, ret.text))
    sys.exit(0)

def run_function(message):
    messagedata = message

    # Raise exception?
    if messagedata["type"] != "workflow":
        return f"Wrong type" % e, 500

    # Required fields
    execution_id = messagedata["execution_id"]
    workflow_id = messagedata["workflow_id"]

    # FIXME - add exception handler -> abort
    workflow = workflow_loads(json.dumps(messagedata["workflow"]))

    id = messagedata["workflow"]["id"]
    locations = messagedata["locations"]
    project_id = messagedata["project_id"]
    authorization = messagedata["authorization"]
    execution_id = messagedata["execution_id"]
    workflow_id = messagedata["workflow_id"]

    logger.info("Exec_id: %s, authorization: %s" % (execution_id, authorization))

    if execution_id == None:
        logger.info("NO EXECUTION ID")
        abort("NO EXECUTION ID", workflow_id, execution_id)

    if len(locations) <= 0:
        logger.info("NO LOCATIONS")
        abort("NO LOCATIONS", workflow_id, execution_id)
    if not project_id:
        logger.info("NO PROJECT_ID")
        abort("NO PROJECT_ID", workflow_id, execution_id)
    if not authorization:
        logger.info("NO AUTHORIZATION")
        abort("NO AUTHORIZATION", workflow_id, execution_id)
    if not workflow_id:
        logger.info("NO workflow_id")
        abort("NO WORKFLOW_ID", workflow_id, execution_id)

    worker = Worker(workflow)
    worker.locations = locations
    worker.execution_id = execution_id
    worker.id = id
    worker.project_id = project_id
    worker.authorization = authorization
    worker.workflow_id = workflow_id 

    try:
        worker.start_id = messagedata["start"] 
        logger.debug("Start node is %s!" % messagedata["start"])
    except KeyError:
        try:
            worker.start_id = messagedata["workflow"]["start"] 
        except KeyError:
            pass

    logger.info("STARTING EXECUTION TASK FOR %s" % execution_id)
    try:
        worker.execution_task = worker.execute_workflow_pubsub()
    except Exception as e:
        logger.error("Execution exception: %s" % e)
        abort(e, workflow_id, execution_id)

    # def abort(self):

    logger.info(worker.execution_task)
    return f"OK", 200

def authorization(data, context):
    logger.info("JUST STARTED")
    
    # Rofl
    import base64
    data = base64.b64decode(data['data']).decode('utf-8')
    return main(data)

def main(data):
    import argparse

    LOG_LEVELS = ("debug", "info", "error", "warn", "fatal", "DEBUG", "INFO", "ERROR", "WARN", "FATAL")
    parser = argparse.ArgumentParser()
    parser.add_argument("--log-level", dest="log_level", choices=LOG_LEVELS, default="DEBUG")
    parser.add_argument("--debug", "-d", dest="debug", action="store_true",
                        help="Enables debug level logging for the umpire as well as asyncio debug mode.")
    args = parser.parse_args()

    logger.setLevel(args.log_level.upper())
    logger.info("STARTED")

    if isinstance(data, str):
        data = json.loads(data)

    return run_function(data)

def test():
    # Used for testing
    with open("data.json", "r") as tmp:
        print(main(tmp.read()))

if __name__ == "__main__":
    test() 
