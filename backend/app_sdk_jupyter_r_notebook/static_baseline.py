import os
import sys
import time 
import logging
import requests

# Goal here:
# * Make an app from WALKOFF able to run without app_base.py from WALKOFF
# # How:
# * Make it rely 100% on INPUT throug HTTP invocations instead of redis READS 
# # But really, how?
# * Make a WORKER that reads the queue, and reuses a function 

# Here to get it global
apikey = ""
try:
    apikey = os.environ["FUNCTION_APIKEY"]
except KeyError:
    pass

# Authorize the execution 
def authorization(request):
    # This is basically my issue, but it enforces the use of an internal API key for execution
    try:
        apikey = os.environ["FUNCTION_APIKEY"]
    except KeyError:
        return f"Internal server error", 500


    # Check API key from ENV authentication
    authentication = request.headers.get("Authorization")
    if authentication == None: return f"Unauthorized", 401

    apikey_split = authentication.split(" ")
    if apikey_split[0] != "Bearer" or len(apikey_split) != 2:
        return f"Apikey error", 401

    if apikey != apikey_split[1]:
        return f"Unauthorized", 401

    return run(request)

class AppBase:
    """ The base class for Python-based Walkoff applications, handles Redis and logging configurations. """
    __version__ = None
    app_name = None

    def __init__(self, redis=None, logger=None, console_logger=None):#, docker_client=None):
        self.logger = logger if logger is not None else logging.getLogger("AppBaseLogger")
        self.redis=redis
        self.console_logger=console_logger 
        self.current_execution_id = None
        self.url = "https://shuffler.io"
        self.apikey = apikey

    @classmethod
    async def run(cls, action):
        """ Connect to Redis and HTTP session, await actions """
        logging.basicConfig(format="{asctime} - {name} - {levelname}:{message}", style='{')
        logger = logging.getLogger(f"{cls.__name__}")
        logger.setLevel(logging.DEBUG)

        app = cls(redis=None, logger=logger, console_logger=logger)

        # Authorization for the app/function to control the workflow
        # Function will crash if its wrong, which it probably should. 

        await app.execute_action(action)
    
    async def execute_action(self, action):
        # FIXME - add request for the function STARTING here. Use "results stream" or something
        # PAUSED, AWAITING_DATA, PENDING, COMPLETED, ABORTED, EXECUTING, SUCCESS, FAILURE

        self.authorization = action["authorization"]
        self.execution_id = action["execution_id"]
        self.current_execution_id = action["execution_id"]
