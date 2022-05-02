import re
import json

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

# Parses the deepest part
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

def parse_type(data, thistype): 
    if data == None:
        return "Empty"

    if "int" in thistype:
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
        # Should be able to split anything
        return data.split()
    if "len" in thistype or "length" in thistype:
        return len(data)
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
            print(parsedlist)
            print(lastsplit)

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

    print("Running %s" % data)

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
    print("INNER: ", outervalue)
    print("OUTER: ", outervalue)

    if outervalue != innervalue:
        #print("Outer: ", outervalue, " inner: ", innervalue)
        for key in range(len(innervalue)):
            # Replace OUTERVALUE[key] with INNERVALUE[key] in data.
            print("Replace %s with %s in %s" % (outervalue[key], innervalue[key], data))
            data = data.replace(outervalue[key], innervalue[key])
    else:
        for thistype in wrappers:
            if thistype not in data.lower():
                continue

            parsed_value = parse_type(innervalue[0], thistype)
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
        print("Casting back to string because multi: ", parsedlist)
        newlist = []
        for item in parsedlist:
            try:
                newlist.append(str(item))
            except ValueError:
                newlist.append("parsing_error")
        return " ".join(newlist)

data = "split(hello there)"
data = """parse(["testing", "what", "is this"], 0:2)"""
#data = "int(int(2))"
print("RET: ", parse_wrapper_start(data))
