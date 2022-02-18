data = ""
with open("categories.rtf", "r") as tmp:
    data = tmp.read()

fixed_json = {}
linearity = 0
heading = ""
subheading = ""
subsubheading = ""
for line in data.split("\n"):
    if line == "rich":
        continue

    if "li" in line:
        lisplit = line.split("\\")
        try:
            linearity = int(lisplit[-1][2])
        except:
            pass

        #print("Linearity: %s" % linearity)

    if line.startswith("{") or line.startswith("}"):
        continue

    if line.startswith("\\"):
        continue

    if linearity == 0:
        continue

    if linearity == 2:
        fixed_json[line] = {} 
        heading = line 
    elif linearity == 4:
        fixed_json[heading][line] = {"name": "", "description": "", "image": ""} 
        subheading = line
    elif linearity == 6:
        fixed_json[heading][subheading][line] = {"name": "", "description": "", "image": ""} 
        subsubheading = line
    elif linearity == 8:
        fixed_json[heading][subheading][subsubheading][line] = {"name": "", "description": "", "image": ""} 
    else:
        print("No handler for %s" % line)

#print(line)
#print(data)
import json
filename = "categories.json"
with open(filename, "w+") as tmp:
    tmp.write(json.dumps(fixed_json, indent=4))

print("Wrote to file %s" % filename)
