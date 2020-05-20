import re
import json

fullexecution = {'type': 'workflow', 'status': 'EXECUTING', 'start': '', 'execution_argument': '', 'execution_id': 'a0a1c723-772e-4569-867e-0228ced98ace', 'workflow_id': '74ab469b-5323-41b9-96c8-4214f49185d2', 'last_node': '', 'authorization': '05205468-6b13-485b-9716-6859e0a5a2a6', 'result': '', 'started_at': 1589450462, 'completed_at': 0, 'project_id': 'shuffle', 'locations': ['europe-west2'], 'workflow': {'actions': [{'app_name': 'testing', 'app_version': '1.0.0', 'app_id': 'ab9549af-d6d5-470a-ae64-1fbe50783f05', 'errors': None, 'id': '6e74deef-4f3b-4ab9-97b1-9370e2040a6f', 'is_valid': True, 'isStartNode': True, 'sharing': True, 'private_id': '', 'label': 'testing_1', 'small_image': '', 'large_image': '', 'environment': 'Shuffle', 'name': 'repeat_back_to_me', 'parameters': [{'description': 'message to repeat', 'id': '', 'name': 'call', 'example': '', 'value': '', 'multiline': False, 'action_field': 'Execution Argument', 'variant': 'ACTION_RESULT', 'required': True, 'schema': {'type': 'string'}}], 'position': {'x': 598, 'y': 559}, 'priority': 0}, {'app_name': 'testing', 'app_version': '1.0.0', 'app_id': 'dd1bd74b-bf84-48a2-99c6-8bca8d7c9ce6', 'errors': None, 'id': '3de7817c-aeda-432f-b780-69f5549c01c7', 'is_valid': True, 'isStartNode': False, 'sharing': True, 'private_id': '', 'label': 'testing_2', 'small_image': '', 'large_image': '', 'environment': 'Shuffle', 'name': 'repeat_back_to_me', 'parameters': [{'description': 'message to repeat', 'id': '', 'name': 'call', 'example': '', 'value': '{"data": "$testing2"}', 'multiline': False, 'action_field': 'testing_2', 'variant': 'STATIC_VALUE', 'required': True, 'schema': {'type': 'string'}}], 'position': {'x': 384.125, 'y': 617.625}, 'priority': 0}, {'app_name': 'testing', 'app_version': '1.0.0', 'app_id': 'dd1bd74b-bf84-48a2-99c6-8bca8d7c9ce6', 'errors': None, 'id': '40066e27-7a9f-4bb6-89cf-cea7575694ba', 'is_valid': True, 'isStartNode': False, 'sharing': True, 'private_id': '', 'label': 'testing_3', 'small_image': '', 'large_image': '', 'environment': 'Shuffle', 'name': 'repeat_back_to_me', 'parameters': [{'description': 'message to repeat', 'id': '', 'name': 'call', 'example': '', 'value': '{"data": "$testing2"}', 'multiline': False, 'action_field': 'testing_2', 'variant': 'STATIC_VALUE', 'required': True, 'schema': {'type': 'string'}}], 'position': {'x': 166.125, 'y': 561.125}, 'priority': 0}], 'branches': [{'destination_id': '6e74deef-4f3b-4ab9-97b1-9370e2040a6f', 'id': '48bbbe8e-e49a-48db-a5ad-16c21e52dd95', 'source_id': '43e4667a-e3c5-472e-8748-80cbd4984ea8', 'label': '', 'has_errors': False, 'conditions': None}, {'destination_id': '3de7817c-aeda-432f-b780-69f5549c01c7', 'id': '8a78af67-bea8-48d1-a52d-84af5fb77d32', 'source_id': '6e74deef-4f3b-4ab9-97b1-9370e2040a6f', 'label': '', 'has_errors': False, 'conditions': None}, {'destination_id': '40066e27-7a9f-4bb6-89cf-cea7575694ba', 'id': 'ddca1983-c591-44ff-932b-617ac419ac6b', 'source_id': '3de7817c-aeda-432f-b780-69f5549c01c7', 'label': '', 'has_errors': False, 'conditions': None}], 'triggers': [{'app_name': 'Webhook', 'description': 'Simple HTTP webhook', 'long_description': 'Execute a workflow with an unauthicated POST request', 'status': 'running', 'app_version': '1.0.0', 'errors': None, 'id': '43e4667a-e3c5-472e-8748-80cbd4984ea8', 'is_valid': True, 'isStartNode': False, 'label': 'Webhook', 'small_image': '', 'large_image': 'data:image/png;base64,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', 'environment': 'Shuffle', 'trigger_type': 'WEBHOOK', 'name': 'Webhook', 'parameters': [{'description': '', 'id': '', 'name': 'url', 'example': '', 'value': 'http://192.168.3.6:5001/api/v1/hooks/webhook_43e4667a-e3c5-472e-8748-80cbd4984ea8', 'multiline': False, 'action_field': '', 'variant': '', 'required': False, 'schema': {'type': ''}}, {'description': '', 'id': '', 'name': 'tmp', 'example': '', 'value': 'webhook_43e4667a-e3c5-472e-8748-80cbd4984ea8', 'multiline': False, 'action_field': '', 'variant': '', 'required': False, 'schema': {'type': ''}}], 'position': {'x': 220.75, 'y': 375.75}, 'priority': 0}], 'schedules': None, 'id': '74ab469b-5323-41b9-96c8-4214f49185d2', 'is_valid': True, 'name': 'Webhook', 'description': '', 'start': '6e74deef-4f3b-4ab9-97b1-9370e2040a6f', 'owner': '16c6e4ff-58c3-49a2-a064-8abf0c37a108', 'sharing': 'private', 'execution_org': {'name': '', 'org': '', 'users': None, 'id': ''}, 'workflow_variables': None}, 'results': [{'action': {'app_name': 'testing', 'app_version': '1.0.0', 'app_id': '', 'errors': None, 'id': '6e74deef-4f3b-4ab9-97b1-9370e2040a6f', 'is_valid': True, 'isStartNode': True, 'sharing': False, 'private_id': '', 'label': 'testing_1', 'small_image': '', 'large_image': '', 'environment': 'Shuffle', 'name': 'repeat_back_to_me', 'parameters': [{'description': 'message to repeat', 'id': '', 'name': 'call', 'example': '', 'value': '', 'multiline': False, 'action_field': 'Execution Argument', 'variant': 'ACTION_RESULT', 'required': True, 'schema': {'type': 'string'}}], 'position': {'x': 598, 'y': 559}, 'priority': 0}, 'execution_id': 'a0a1c723-772e-4569-867e-0228ced98ace', 'authorization': '05205468-6b13-485b-9716-6859e0a5a2a6', 'result': '[ { "severity": 2, "owner": "frikky", "_routing": "6UhYGXIBGUwc2QpmoXZI", "flag": false, "customFields": {}, "_type": "case", "description": "This is a desc", "title": "Aaaaand another case here :)", "tags": [], "createdAt": 1589563137969, "_parent": null, "createdBy": "frikky", "caseId": 6, "tlp": 2, "metrics": {}, "_id": "6UhYGXIBGUwc2QpmoXZI", "id": "6UhYGXIBGUwc2QpmoXZI", "_version": 1, "pap": 2, "startDate": 1589563080000, "status": "Open" }, { "severity": 2, "owner": "frikky", "_routing": "60heGXIBGUwc2QpmgXbc", "flag": false, "customFields": {}, "_type": "case", "description": ":)", "title": "The last challenge", "tags": [], "createdAt": 1589563522665, "_parent": null, "createdBy": "frikky", "caseId": 7, "tlp": 2, "metrics": {}, "_id": "60heGXIBGUwc2QpmgXbc", "id": "60heGXIBGUwc2QpmgXbc", "_version": 1, "pap": 2, "startDate": 1589563500000, "status": "Open" }, { "severity": 2, "owner": "frikky", "_routing": "5UhLGXIBGUwc2Qpmj3YR", "flag": false, "customFields": {}, "_type": "case", "description": "Description", "title": "This is a cool title for a case, right?", "tags": [], "createdAt": 1589562281320, "_parent": null, "createdBy": "frikky", "caseId": 4, "tlp": 2, "metrics": {}, "_id": "5UhLGXIBGUwc2Qpmj3YR", "id": "5UhLGXIBGUwc2Qpmj3YR", "_version": 1, "pap": 2, "startDate": 1589562240000, "status": "Open" }, { "severity": 2, "owner": "frikky", "_routing": "50hXGXIBGUwc2QpmDnZC", "flag": false, "customFields": {}, "_type": "case", "description": "Case desc", "title": "Another case!", "tags": [], "createdAt": 1589563034722, "_parent": null, "createdBy": "frikky", "caseId": 5, "tlp": 2, "metrics": {}, "_id": "50hXGXIBGUwc2QpmDnZC", "id": "50hXGXIBGUwc2QpmDnZC", "_version": 1, "pap": 2, "startDate": 1589563020000, "status": "Open" }, { "severity": 2, "owner": "frikky", "_routing": "4UgXGXIBGUwc2QpmBXa3", "flag": false, "customFields": {}, "_type": "case", "description": "This is a webhook test", "title": "TheHive webhook test", "tags": [ "Integration", "Shuffle", "Test", "TheHive" ], "createdAt": 1589558837830, "_parent": null, "createdBy": "frikky", "caseId": 2, "tlp": 0, "metrics": {}, "_id": "4UgXGXIBGUwc2QpmBXa3", "id": "4UgXGXIBGUwc2QpmBXa3", "_version": 1, "pap": 2, "startDate": 1589558820000, "status": "Open" }, { "severity": 2, "owner": "frikky", "_routing": "40g4GXIBGUwc2Qpmy3Zn", "flag": false, "customFields": {}, "_type": "case", "description": "Case for testing webhook 2", "title": "My new case testing webhook", "tags": [], "createdAt": 1589561051232, "_parent": null, "createdBy": "frikky", "caseId": 3, "tlp": 2, "metrics": {}, "_id": "40g4GXIBGUwc2Qpmy3Zn", "id": "40g4GXIBGUwc2Qpmy3Zn", "_version": 1, "pap": 2, "startDate": 1589561040000, "status": "Open" }, { "severity": 2, "owner": "frikky", "_routing": "30gKGXIBGUwc2Qpm1nZs", "flag": false, "customFields": {}, "_type": "case", "description": "asd", "title": "testing", "tags": [], "createdAt": 1589558039989, "_parent": null, "createdBy": "frikky", "caseId": 1, "tlp": 2, "metrics": {}, "_id": "30gKGXIBGUwc2Qpm1nZs", "id": "30gKGXIBGUwc2Qpm1nZs", "_version": 1, "pap": 2, "startDate": 1589557980000, "status": "Open" } ]', 'started_at': 1589450468, 'completed_at': 1589450468, 'status': 'SUCCESS'}, {'action': {'app_name': 'testing', 'app_version': '1.0.0', 'app_id': '', 'errors': None, 'id': '3de7817c-aeda-432f-b780-69f5549c01c7', 'is_valid': True, 'isStartNode': False, 'sharing': False, 'private_id': '', 'label': 'testing_2', 'small_image': '', 'large_image': '', 'environment': 'Shuffle', 'name': 'repeat_back_to_me', 'parameters': [{'description': 'message to repeat', 'id': '', 'name': 'call', 'example': '', 'value': '{"data": "$testing2"}', 'multiline': False, 'action_field': 'testing_2', 'variant': 'STATIC_VALUE', 'required': True, 'schema': {'type': 'string'}}], 'position': {'x': 384.125, 'y': 617.625}, 'priority': 0}, 'execution_id': 'a0a1c723-772e-4569-867e-0228ced98ace', 'authorization': '05205468-6b13-485b-9716-6859e0a5a2a6', 'result': '{"data": "$testing2"}', 'started_at': 1589450479, 'completed_at': 1589450479, 'status': 'SUCCESS'}, {'action': {'app_name': 'testing', 'app_version': '1.0.0', 'app_id': '', 'errors': None, 'id': '40066e27-7a9f-4bb6-89cf-cea7575694ba', 'is_valid': True, 'isStartNode': False, 'sharing': False, 'private_id': '', 'label': 'testing_3', 'small_image': '', 'large_image': '', 'environment': 'Shuffle', 'name': 'repeat_back_to_me', 'parameters': [{'description': 'message to repeat', 'id': '', 'name': 'call', 'example': '', 'value': '{"data": "$testing2"}', 'multiline': False, 'action_field': 'testing_2', 'variant': 'STATIC_VALUE', 'required': True, 'schema': {'type': 'string'}}], 'position': {'x': 166.125, 'y': 561.125}, 'priority': 0}, 'execution_id': 'a0a1c723-772e-4569-867e-0228ced98ace', 'authorization': '05205468-6b13-485b-9716-6859e0a5a2a6', 'result': '', 'started_at': 1589450489, 'completed_at': 0, 'status': 'EXECUTING'}]}


data = """{
    "data": "$exec.test",
    "lul": "helo",
    "data2": "$testing_2.data",
    "data3": "$testing_1"
    "data5": "$testing_1.#.lol"
    "data7": "$testing 1.#.id"
}"""

# Takes a workflow execution as argument
# Returns a string if the result is single, or a list if it's a list

# Not implemented: lists
multiexecutions = True
def get_json_value(execution_data, input_data):
    parsersplit = input_data.split(".")
    actionname = parsersplit[0][1:].replace(" ", "_", -1)
    print(f"Actionname: {actionname}")

    # 1. Find the action
    baseresult = ""
    try: 
        if actionname.lower() == "exec": 
            baseresult = execution_data["execution_argument"]
        else:
            for result in execution_data["results"]:
                resultlabel = result["action"]["label"].replace(" ", "_", -1).lower()
                if resultlabel.lower() == actionname.lower():
                    baseresult = result["result"]
                    break

    except KeyError as error:
        print(f"Error: {error}")

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

    def loop_recursion(data):
        for value in data:
            pass

    try:
        cnt = 0
        for value in parsersplit[1:]:
            cnt += 1

            if value == "#":
                # FIXME - not recursive 
                print("HANDLE RECURSIVE LOOP ")
                returnlist = []
                for value in basejson:
                    print("Value: %s" % value[parsersplit[cnt+1]])
                    returnlist.append(value[parsersplit[cnt+1]])

                return returnlist

            else:
                print("BASE: ", basejson)
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
        print(f"Keyerror: {e}")
        return basejson
    except IndexError as e:
        print(f"Indexerror: {e}")
        return basejson

    return basejson

match = ".*([$]{1}([a-zA-Z0-9()# _-]+\.?){1,})"
actualitem = re.findall(match, data, re.MULTILINE)
if len(actualitem) > 0:
    parameter = {
        "value": "VAL"
    }
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
        elif isinstance(value, list):
            parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
            print("ITS A FUCKING LIST: %s" % value)

        print(parameter["value"])

asd = '["123"]'
all_executions = []
try:
    newlist = json.loads(asd)
    if isinstance(newlist, list):
        print("LIST!")

    print(newlist)
except ValueError:
    print("VAL!")
except AttributeError:
    print("ATT!")

if isinstance(asd, list):
    print("HELO")
    print(list(asd))
else:
    print("no")

#print(data)
