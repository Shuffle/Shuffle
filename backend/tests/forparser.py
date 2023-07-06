import re
import json

fullexecution = {"type":"workflow","status":"FINISHED","start":"40447f30-fa44-4a4f-a133-4ee710368737","execution_argument":"","execution_id":"083eaa87-17ff-4aba-996c-83245051cf3d","execution_source":"default","workflow_id":"d7b73e8a-08fe-460e-987b-971cb6f1857f","last_node":"40447f30-fa44-4a4f-a133-4ee710368737","authorization":"b1264cd6-ed7a-4839-8caf-187eee8804b9","result":"TypeError: list indices must be integers or slices, not str","started_at":1593236788,"completed_at":1593236790,"project_id":"shuffle","locations":["europe-west2"],"workflow":{"actions":[{"app_name":"Testing","app_version":"1.0.0","app_id":"5411f573-9bba-44c4-a8d3-0e2bb704546d","errors":"null","id":"40447f30-fa44-4a4f-a133-4ee710368737","is_valid":True,"isStartNode":True,"sharing":True,"private_id":"","label":"Hello this is a name","small_image":"","large_image":"","environment":"Shuffle","name":"repeat_back_to_me","parameters":[{"description":"The message to repeat","id":"","name":"call","example":"REPEATING: Hello world","value":"$this is a test.name is not the same as $this is a test.name2 \n\n\nNot list $this is a test.loop.# either","multiline":True,"action_field":"","variant":"STATIC_VALUE","required":True,"schema":{"type":"string"}}],"execution_variable":{"description":"","id":"","name":"","value":""},"position":{"x":360.5,"y":454.5},"priority":0}],"branches":"null","triggers":"null","schedules":"null","configuration":{"exit_on_error":False,"start_from_top":False},"id":"d7b73e8a-08fe-460e-987b-971cb6f1857f","is_valid":True,"name":"App sdk parser testing","description":"","start":"40447f30-fa44-4a4f-a133-4ee710368737","owner":"43c36230-0a6e-40fc-aebc-a8ef57c81a88","sharing":"private","execution_org":{"name":"","org":"","users":"null","id":""},"workflow_variables":[{"description":"","id":"a034abee-5a5f-4347-9e58-6d2e58ce70f2","name":"This is a test","value":"[{\"data\": \"1.1.1.1\", \"data_type\": \"ip\"}]"}]},"results":[{"action":{"app_name":"Testing","app_version":"1.0.0","app_id":"5411f573-9bba-44c4-a8d3-0e2bb704546d","errors":"null","id":"40447f30-fa44-4a4f-a133-4ee710368737","is_valid":True,"isStartNode":True,"sharing":True,"private_id":"","label":"Hello this is a name","small_image":"","large_image":"","environment":"Shuffle","name":"repeat_back_to_me","parameters":[{"description":"The message to repeat","id":"","name":"call","example":"","value":"testing is not the same as testing2 \n\n\nNot list $this is a test.loop.# either","multiline":"false","action_field":"","variant":"STATIC_VALUE","required":True,"schema":{"type":"string"}}],"execution_variable":{"description":"","id":"","name":"","value":""},"position":{"x":360.5,"y":454.5},"priority":0},"execution_id":"083eaa87-17ff-4aba-996c-83245051cf3d","authorization":"b1264cd6-ed7a-4839-8caf-187eee8804b9","result":"TypeError: list indices must be integers or slices, not str","started_at":1593236790,"completed_at":1593236790,"status":"FAILURE"}]}


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
        return ""

    if len(parsersplit) == 1:
        return baseresult

    baseresult = baseresult.replace("\'", "\"")
    basejson = {}
    try:
        basejson = json.loads(baseresult)
    except json.decoder.JSONDecodeError as e:
        return baseresult

    # This whole thing should be recursive.
    try:
        cnt = 0
        for value in parsersplit[1:]:
            cnt += 1

            print("VALUE: %s" % value)
            if value == "#":
                # FIXME - not recursive - should go deeper if there are more #
                print("HANDLE RECURSIVE LOOP OF %s" % basejson)
                returnlist = []
                try:
                    for innervalue in basejson:
                        print("Value: %s" % innervalue[parsersplit[cnt+1]])
                        returnlist.append(innervalue[parsersplit[cnt+1]])
                except IndexError as e:
                    print("Indexerror inner: %s" % e)
                    # Basically means its a normal list, not a crazy one :)
                    # Custom format for ${name[0,1,2,...]}$
                    indexvalue = "${NO_SPLITTER%s}$" % json.dumps(basejson)
                    if len(returnlist) > 0:
                        indexvalue = "${NO_SPLITTER%s}$" % json.dumps(returnlist)

                    print("INDEXVAL: ", indexvalue)
                    return indexvalue
                except TypeError as e:
                    print("TypeError inner: %s" % e)

                # Example format: ${[]}$
                parseditem = "${%s%s}$" % (parsersplit[cnt+1], json.dumps(returnlist))
                print("PARSED LOOP ITEM: %s" % parseditem)
                return parseditem

            else:
                print("BEFORE NORMAL VALUE: ", basejson, value)
                if len(value) == 0:
                    return basejson

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
        print("Lower keyerror: %s" % e)
        return "KeyError: Couldn't find key: %s" % e

    return basejson

parameter = {
    "value": """{
        "data8": "Not list $this is a test.#.data either with the items $this is a test.#.data_type"
    }"""
}

match = ".*?([$]{1}([a-zA-Z0-9 _-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,})"
actualitem = re.findall(match, parameter["value"], re.MULTILINE)
print("ACTUAL: ", actualitem)
if len(actualitem) > 0:
    data = parameter["value"]

    counter = 0
    for replace in actualitem:
        try:
            to_be_replaced = replace[0]
        except IndexError:
            continue

        value = get_json_value(fullexecution, to_be_replaced)
        if isinstance(value, str):
            if "${" in value and "}$" in value:
                counter += 1

            parameter["value"] = parameter["value"].replace(to_be_replaced, value)
        elif isinstance(value, dict):
            parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))
        elif isinstance(value, list):
            parameter["value"] = parameter["value"].replace(to_be_replaced, json.dumps(value))


print(parameter["value"])
submatch = "([${]{2}([0-9a-zA-Z_-]+)(\[.*\])[}$]{2})"
actualitem = re.findall(submatch, parameter["value"], re.MULTILINE)
print()
# Kind of the same thing again, but different usage
if len(actualitem) > 0:
    minlength = 0
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

    resultarray = []
    for i in range(0, minlength): 
        tmpitem = json.loads(json.dumps(parameter["value"]))

        for key, value in replacements.items():
            replacement = json.loads(value)[i]
            tmpitem = tmpitem.replace(key, replacement, -1)

        resultarray.append(tmpitem)

    # With this parameter ready, add it to... a greater list of parameters. Rofl
    print(resultarray[0])
else:
    print("Normal execution")
    pass
