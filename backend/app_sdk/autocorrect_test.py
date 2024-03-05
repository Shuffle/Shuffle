import re

input_data = """{
  "test0": {{ '' | default: [] }},
  "test": {{ | default: [] }},
  "test2": {{ $test.asd | default: [] }},
  "test3": {{ {"key": "val} | default: [] }},
}"""

#
#  "test4": $test,
#  "test5": ,
#  "test6": "what"
#}"""


liquiddata = "{{ $test.asd | some other stuff {{ $test.xyz | more stuff"
pattern = r'\{\{\s*\$[^|}]+\s*\|'

replaced_data = re.sub(pattern, "{{ '' |", liquiddata)
print(replaced_data)


def patternfix_liquid(liquiddata):
    if "{{" not in liquiddata or "}}" not in liquiddata:
        return liquiddata 

    patterns = {
        "{{|": "{{ '' |",
    }

    regex_patterns = {
        r'\{\{\s*\$[^|}]+\s*\|': "{{ '' |",
    }

    skipkeys = [" "]
    newoutput = liquiddata[:]
    for pattern in patterns:
        keylocations = []
        parsedvalue = ""
        record = False
        index = -1
        for key in liquiddata:
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
                print("Found matching: %s (%s)" % (parsedvalue, keylocations))
                print("Should replace with: %s" % patterns[pattern])

                newoutput = newoutput.replace(parsedvalue, patterns[pattern], -1)
                break

    for pattern in regex_patterns:
        newlines = []
        for line in newoutput.split("\n"):
            replaced_line = re.sub(pattern, regex_patterns[pattern], line)
            newlines.append(replaced_line)

        newoutput = "\n".join(newlines)

    return newoutput 

print("Start:\n%s" % input_data)
try:
    newinput = patternfix_liquid(input_data)
except Exception as e:
    print("[ERROR} Failed liquid parsing fix: %s" % e)
    newinput = input_data

print("\nEnd:\n%s" % newinput)
