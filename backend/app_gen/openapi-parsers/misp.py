import json
import yaml

items = []

openapi = {
    "openapi": "3.0.2", 
    "info": {
        "title": "MISP",
        "description": "MISP API generated from the misp book: https://github.com/MISP/misp-book/blob/master/automation/README.md",
        "version": "1.0.0",
        "contact": {
            "name": "@frikkylikeme",
            "url": "https://twitter.com/frikkylikeme",
            "email": "frikky@shuffler.io"
        }
    },
    "paths": {},
    "components": {
        "schemas": {}, 
        "securitySchemes": {
            "ApiKeyAuth": {
                "type": "apikey",
                "in": "header",
                "name": "Authorization",
            }
        },
    }
}

with open("misp.txt", "r") as tmp:
    newitem = {}
    recorditem = False

    counter = 0
    itemsplit = tmp.read().split("\n")
    for item in itemsplit:
        counter += 1
        if item.startswith("### ") and "/" in item:
            try:
                path = item.split(" ")[2]
                method = item.split(" ")[1].lower()
                newitem = {
                    "path": path,
                    "method": method,
                }

                try:
                    openapi["paths"][path][method] = {}
                except KeyError:
                    openapi["paths"][path] = {}
                    openapi["paths"][path][method] = {}

            except IndexError:
                newitem = {}
                continue

            recorditem = True
            #print(newitem)

        if not recorditem:
            continue

        if "Description" in item:
            openapi["paths"][newitem["path"]][newitem["method"]]["description"] = itemsplit[counter+1]
        elif "URL Arguments" in item:
            parameters = []
            innercnt = 0

            openapi["paths"][newitem["path"]][newitem["method"]]["parameters"] = []
            while True:
                curline = itemsplit[counter+1+innercnt]
                if "#" in curline:
                    break

                innercnt += 1
                if not curline:
                    continue

                print(curline)
                parameters.append({
                    "description": curline.split(" ")[1],
                    "in": "query",
                    "name": curline.split(" ")[1],
                    "required": True,
                    "schema": {"type": "string"},
                }) 

            openapi["paths"][newitem["path"]][newitem["method"]]["parameters"] = parameters
        elif "Output" in item:
            # FIXME
            innercnt = 0
            while True:
                curline = itemsplit[counter+1+innercnt]

                if "#" in curline:
                    break

                innercnt += 1
                if "json" in curline:
                    continue
                #print(curline)

print(json.dumps(openapi, indent=4))


generatedfile = "generated/misp.yaml"
with open(generatedfile, "w+") as tmp:
    tmp.write(yaml.dump(openapi))
