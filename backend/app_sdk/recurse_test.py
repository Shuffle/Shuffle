## A test script of the recurse_json function
## to validate that it can handle the different types of data
## and follow the dot formation format


import re
import json

def recurse_json(basejson, parsersplit):
    match = "#([0-9a-z]+):?-?([0-9a-z]+)?#?"
    try:
        outercnt = 0

        # Loops over split values
        splitcnt = -1 
        for value in parsersplit:
            splitcnt += 1
            #if " " in value:
            #    value = value.replace(" ", "_", -1)

            actualitem = re.findall(match, value, re.MULTILINE)
            # Goes here if loop 
            if value == "#":
                newvalue = []

                if basejson == None:
                    return "", False

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

                #print("[DEBUG] ACTUAL PARSED: %s" % actualitem)

                # Means it's a single item -> continue
                if seconditem == "":
                    #print("[INFO] In first - handling %s. Len: %d" % (firstitem, len(basejson)))
                    if str(firstitem).lower() == "max" or str(firstitem).lower() == "last" or str(firstitem).lower() == "end": 
                        firstitem = len(basejson)-1
                    elif str(firstitem).lower() == "min" or str(firstitem).lower() == "first": 
                        firstitem = 0
                    else:
                        firstitem = int(firstitem)

                    #print(f"[DEBUG] Post lower checks with item {firstitem}")
                    tmpitem = basejson[int(firstitem)]
                    try:
                        newvalue, is_loop = recurse_json(tmpitem, parsersplit[outercnt+1:])
                    except IndexError:
                        newvalue, is_loop = (tmpitem, parsersplit[outercnt+1:])
                else:
                    #print("[INFO] In ELSE - handling %s and %s" % (firstitem, seconditem))
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
                        if str(seconditem).lower() == "max" or str(seconditem).lower() == "last" or str(firstitem).lower() == "end": 
                            seconditem = len(basejson)-1
                        elif str(seconditem).lower() == "min" or str(seconditem).lower() == "first": 
                            seconditem = 0
                        else:
                            seconditem = int(seconditem)
                    else:
                        seconditem = int(seconditem)

                    #print(f"[DEBUG] Post lower checks 2: {firstitem} AND {seconditem}")
                    newvalue = []
                    if int(seconditem) > len(basejson):
                        seconditem = len(basejson)

                    for i in range(int(firstitem), int(seconditem)+1):
                        # 1. Check the next item (message)
                        # 2. Call this function again

                        try:
                            ret, tmp_loop = recurse_json(basejson[i], parsersplit[outercnt+1:])
                        except IndexError:
                            #print("[DEBUG] INDEXERROR (1): ", parsersplit[outercnt])
                            #ret = innervalue
                            ret, tmp_loop = recurse_json(basejson[i], parsersplit[outercnt:])
                            
                        newvalue.append(ret)

                return newvalue, is_loop 

            else:
                if len(value) == 0:
                    return basejson, False

                try:
                    if isinstance(basejson, list): 
                        #print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (list): %s" % value)
                        return basejson, False
                    elif isinstance(basejson, bool):
                        #print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (bool): %s" % value)
                        return basejson, False
                    elif isinstance(basejson, int):
                        #print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (int): %s" % value)
                        return basejson, False
                    elif isinstance(basejson[value], str):
                        try:
                            if (basejson[value].endswith("}") and basejson[value].endswith("}")) or (basejson[value].startswith("[") and basejson[value].endswith("]")):
                                basejson = json.loads(basejson[value])
                            else:
                                # Should we sanitize here?
                                #print("[DEBUG] VALUE TO SANITIZE FOR KEY '%s'?: %s" % (value, basejson[value]))

                                # Check if we are on the last item?
                                if outercnt == len(parsersplit)-1:
                                    #print("[DEBUG] LAST KEY")
                                    return str(basejson[value]), False
                                else:
                                    #print("[DEBUG] NOT LAST KEY")
                                    pass

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

                    try:
                        if isinstance(basejson, list): 
                            #print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (list): %s" % value)
                            return basejson, False
                        elif isinstance(basejson, bool):
                            #print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (bool): %s" % value)
                            return basejson, False
                        elif isinstance(basejson, int):
                            #print("[WARNING] VALUE IN ISINSTANCE IS NOT TO BE USED (int): %s" % value)
                            return basejson, False
                        elif isinstance(basejson[value], str):
                            #print(f"[INFO] LOADING STRING '%s' AS JSON" % basejson[value]) 
                            try:
                                #print("[DEBUG] BASEJSON: %s" % basejson)
                                if (basejson[value].endswith("}") and basejson[value].endswith("}")) or (basejson[value].startswith("[") and basejson[value].endswith("]")):
                                    basejson = json.loads(basejson[value])
                                else:

                                    if outercnt == len(parsersplit)-1:
                                        #print("LAST KEY (2)")
                                        return str(basejson[value]), False
                                    else:
                                        #print("NOT LAST KEY (2)")
                                        pass

                            except json.decoder.JSONDecodeError as e:
                                #print("[DEBUG] RETURNING BECAUSE '%s' IS A NORMAL STRING (1)" % basejson[value])
                                return str(basejson[value]), False
                        else:
                            basejson = basejson[value]
                    except KeyError as e:
                        # Check if previous key was handled or not
                        previouskey = parsersplit[outercnt-1]
                        #print("[DEBUG] PREVIOUS KEY: ", previouskey)

                        tmpval = previouskey + "." + value
                        #print("\n\n[WARNING] Running third dot notation fix '%s' on data %s: %s" % (value, basejson, e))
                        if tmpval in basejson:
                            return basejson[tmpval], False

                        try:
                            currentsplitcnt = splitcnt 

                            recursed_value = value
                            handled = False

                            #tmpbase = basejson
                            previouskey = value
                            while True:
                                #print("\n\n[DEBUG] CURRENTSPLITCNT: ", currentsplitcnt)
                                newvalue = parsersplit[currentsplitcnt+1]
                                if newvalue == "#" or newvalue == "":
                                    break 

                                recursed_value += "." + newvalue
                                #print("\n\nRECURSED: ", recursed_value)

                                found = False
                                for key, value in basejson.items():
                                    if recursed_value.lower() in key.lower(): 
                                        found = True

                                if found == False:
                                    #print("[INFO] DIDN'T FIND similar VALUE: ", recursed_value)

                                    # Check if we are on the last key or not
                                    return "", False
                                    #if outercnt == len(parsersplit)-1:
                                    #    print("[DEBUG] LAST KEY (3)")
                                    #    break
                                    #else:
                                    #    print("[DEBUG] NOT LAST KEY (3)")
                                    #    return "", False

                                if recursed_value in basejson:
                                    #print("[INFO] FOUND RECURSED VALUE: ", recursed_value)
                                    basejson = basejson[recursed_value]

                                    # Whether to dig deeper or not
                                    if isinstance(basejson, bool) or isinstance(basejson, int) or isinstance(basejson, str):
                                        handled = False 
                                    else:
                                        handled = True 

                                    break

                                currentsplitcnt += 1

                            if handled:
                                continue
                            
                            break
                        except IndexError as e:
                            print("[DEBUG] INDEXERROR (2):", parsersplit[outercnt])
                            return "", False

            outercnt += 1

    except KeyError as e:
        print("[INFO] Lower keyerror: %s" % e)
        return "", False
    except Exception as e:
        print("[WARNING] Exception: %s" % e)
        return "", False

    return basejson, False

print("[INFO] Starting")

#input_data = "test"
#input_data = "test2.data"



# Matchwith
basejson = {
    "test": "hello",
    "test2": {
        "test3": "hello2",
        "test3.data": "hello3",
        "test4.data.testing": {
            "value": "hello4"
        },
        "test5.data.hello": "wut",
    },
    "test3": ["hello", "hello2", "hello3"],
    "test4": [{
        "id": "1",
    }]
}

# Inputexamples (ALL should be True)
inputs = {
    #"": "",
    "badkey": "",
    "test": "hello",
    "test2.badkey": "",
    "test2.test3": "hello2",
    "test2.test3.data": "hello3",
    "test2.test4.data.testing": "{'value': 'hello4'}", # FIXME: Doesn't work due to break vs return "", False in last exception
    "test2.test4.data.testing.value": "hello4",  # FIXME: Doesn't work due to break vs return "", False in last exception. Not fixed as we didn't find one of these yet.
    "test2.test5.data.hello": "wut",
    "test2.test5.data.badkey": "",
    "test3.#1": "hello2",
    "test4.#0.id": "1",
    "test4.#1.id": "",
}

outputs = []
for key, value in inputs.items(): 
    parsersplit = key.split(".")
    ret, is_loop = recurse_json(basejson, parsersplit)
    print("\n\nOUTPUT RET (%s): %s" % (key, ret))

    outputs.append("[%s]: %s = '%s' vs '%s'" % (str(ret) == str(value), key, ret, value))

print("\n\n%s" % "\n".join(outputs))

#input_data = ""
#input_data = "badkey"
#input_data = "test"
#input_data = "test2.data"
#input_data = "test2.test3.data"
#input_data = "test2.test4.data.testing.value.as"
#input_data = "test2.test5.data.hello"




