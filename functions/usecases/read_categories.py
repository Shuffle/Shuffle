data = ""
with open("categories.rtf", "r") as tmp:
    data = tmp.read()

fixed_json = []
linearity = 0
heading = ""
subheading = ""
subsubheading = ""

cnt = -1
subcnt = -1

colors = ["#c51152", "#3cba54", "#4885ed", "#4a148c", "#f4c20d"]
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
        #if cnt >= 0:
        #    for key, value in fixed_json[cnt].items():
        #        print(key, value)


        cnt += 1 
        subcnt = -1
        fixed_json.append({"name": line, "color": colors[cnt], "list": []})
        heading = line 
    elif linearity == 4:
        subheading = line
        fixed_json[cnt]["list"].append({"name": line, "items": {}})
        subcnt += 1
    elif linearity == 6:
        fixed_json[cnt]["list"][subcnt]["items"] = {"name": line, "items": {}}
    elif linearity == 8:
        fixed_json[cnt]["list"][subcnt]["items"]["items"] = {"name": line, "items": {}}
    else:
        print("No handler for %s" % line)

#print(line)
#print(data)
import json
filename = "categories.json"
fixed_json.sort(key=lambda x: x["name"])
with open(filename, "w+") as tmp:
    tmp.write(json.dumps(fixed_json, indent=4))

print("Wrote to file %s" % filename)
