import re
import json

input_data = """{
  "test4": $test,
  "test5": ,
  "test6": "what"
  }
"""

input_data = """{
  "test0": {{ '' | default: [] }},
  "test": {{ | default: [] }},
  "test2": {{ $test.asd | default: [] }},
  "test3": {{ {"key": "val} | default: [] }},
  "test4": $test,
  "test5": ,
  "test6": "what"
  }
"""


liquiddata = "{{ $test.asd | some other stuff {{ $test.xyz | more stuff"
pattern = r'\{\{\s*\$[^|}]+\s*\|'

replaced_data = re.sub(pattern, "{{ '' |", liquiddata)
print(replaced_data)


def patternfix_string(liquiddata, patterns, regex_patterns, inputtype="liquid"):
    if not inputtype or inputtype == "liquid":
        if "{{" not in liquiddata or "}}" not in liquiddata:
            return liquiddata 
    elif inputtype == "json":
        liquiddata = liquiddata.strip()

        # Validating if it looks like json or not
        if liquiddata[0] == "{" and liquiddata[len(liquiddata)-1] == "}":
            pass
        else:
            if liquiddata[0] == "[" and liquiddata[len(liquiddata)-1] == "]":
                pass
            else:
                return liquiddata

        # If it's already json, don't touch it
        try:
            json.loads(liquiddata)
            return liquiddata
        except Exception as e:
            pass
    else:
        print("No replace handler for %s" % inputtype)
        return liquiddata

    skipkeys = [" "]
    newoutput = liquiddata[:]
    for pattern in patterns:
        keylocations = []
        parsedvalue = ""
        record = False
        index = -1
        for key in liquiddata:

            # Return instant if possible
            if inputtype == "json":
                try:
                    json.loads(newoutput)
                    return newoutput
                except:
                    pass

            index += 1
            if not key:
                if record:
                    keylocations.append(index)
                    parsedvalue += key

                continue

            if key in skipkeys:
                if record:
                    keylocations.append(index)
                    parsedvalue += key

                continue

            if key == pattern[0] and not record:
                record = True

            if key not in pattern:
                keylocations = []
                parsedvalue = ""
                record = False

            if record:
                keylocations.append(index)
                parsedvalue += key

            if len(parsedvalue) == 0:
                continue

            evaluated_value = parsedvalue[:]
            for skipkey in skipkeys:
                evaluated_value = "".join(evaluated_value.split(skipkey))

            if evaluated_value == pattern:
                #print("Found matching: %s (%s)" % (parsedvalue, keylocations))
                #print("Should replace with: %s" % patterns[pattern])

                newoutput = newoutput.replace(parsedvalue, patterns[pattern], -1)

        # Return instant if possible
        if inputtype == "json":
            try:
                json.loads(newoutput)
                return newoutput
            except:
                pass


    for pattern in regex_patterns:
        newlines = []
        for line in newoutput.split("\n"):
            replaced_line = re.sub(pattern, regex_patterns[pattern], line)
            newlines.append(replaced_line)

        newoutput = "\n".join(newlines)

        # Return instant if possible
        if inputtype == "json":
            try:
                json.loads(newoutput)
                return newoutput
            except:
                pass

    # Dont return json properly unless actually json
    if inputtype == "json":
        try:
            json.loads(newoutput)
            return newoutput
        except:
            # Returns original if json fixing didn't work
            return liquiddata

    return newoutput 

print("Start:\n%s" % input_data)

try:
    newinput = patternfix_string(input_data, 
        {
            "{{|": '{{ "" |',
        },
        {
            #r'\{\{\s*|': "{{ '' |",
            r'\{\{\s*\$[^|}]+\s*\|': '{{ "" |',
        }
        , 
        inputtype="liquid"
    )
except Exception as e:
    print("[ERROR} Failed liquid parsing fix: %s" % e)
    newinput = input_data

try:
    newinput = patternfix_string(newinput, 
        {
        },
        {
            r'\"\s*\:\s*,': '\": "",',
            r'\"\s*\:\s*\$[^,]+\w*\,': '\": "",',
        }
        , 
        inputtype="json"
    )

    try:
        json.loads(newinput)
        print("It's json! Override.")
    except Exception as e:
        print("Bad json. DONT use the value at all: %s" % e)
except Exception as e:
    print("[ERROR} Failed json parsing fix: %s" % e)

print("\nEnd:\n%s" % newinput)
