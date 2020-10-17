import requests
import yaml 
import json
import os

# USAGE:
# 1. Find the item here:
# https://apphub.swimlane.com/swimbundles/swimlane/sw_alienvault_threatcrowd
# 2. 
# https://jsonlint.com/

# META: data["meta"]. Stuff like count. May be useful :)

def parse_data(data):
    openapi = {
        "openapi": "3.0.2", 
        "info": {
            "title": "",
            "description": "",
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
            "securitySchemes": {},
        }
    }

    data = data["swimbundle"]
    filename = "%s.yaml" % data["product"].replace(" ", "_").lower()
    openapi["info"]["title"] = "%s %s" % (data["vendor"], data["product"])
    openapi["info"]["description"] = "Automated generation of %s" % (openapi["info"]["title"])
    # data["description"]

    # https://swagger.io/docs/specification/authentication/
    try:
        asset = data["asset"]
        inputparams = asset["inputParameters"]

        try:
            openapi["servers"] = [inputparams["api_url"]["example"]]
        except KeyError as e:
            #print(inputparams)
            #print("Field error: %s" % e)
            pass

        authset = False
        try:
            tmpauth = inputparams["api_user"]
            tmpauth = inputparams["api_key"]
    
            openapi["components"]["securitySchemes"] = {
                "BasicAuth": {
                    "type": "http",
                    "scheme": "basic"
                }
            }
            authset = True
        except KeyError as e:
            pass

        try:
            tmpauth = inputparams["username"]
            tmpauth = inputparams["password"]
    
            openapi["components"]["securitySchemes"] = {
                "BasicAuth": {
                    "type": "http",
                    "scheme": "basic"
                }
            }
            authset = True
        except KeyError as e:
            pass

        #if not authset:
        #    print("AUTH NOT SET: %s" % inputparams)

    except KeyError as e:
        print("KeyError asset: %s" % e)

    cnt = 0
    paramnames = []
    for task in data["tasks"]:
        method = "post"

        openapi["paths"]["tmp%d" % cnt] = {}
        openapi["paths"]["tmp%d" % cnt][method] = {
            "summary": task["name"],
            "description": task["description"],
            "parameters": [],
            "responses": {
                "200": {
                    "description": "Successful request",
                    
                }
            },
        }

        taskcategory = task["family"]
        taskname = task["name"]
        paramnames.append(taskname)

        for key, value in task["inputParameters"].items():
            schema = "string"
            inVar = "query"

            if value["type"] == 6:
                inVar = "body"

            schema = "string"
            schemaset = False
            if value["type"] != 1:
                if (value["type"] == 7):
                    schema = "boolean"
                    schemaset = True

            if schema == "string" and schemaset:
                print("Should change type: %d" % value["type"])
                print(task["name"])
                print(value["name"])

            example = ""
            try:
                example = value["example"]
            except KeyError:
                pass

            description = ""
            try:
                description = value["description"]
            except KeyError:
                pass

            required = False
            try:
                required = value["required"]
            except KeyError:
                pass
                
            openapi["paths"]["tmp%d" % cnt][method]["parameters"].append({
                "name": value["name"],
                "required": required,
                "example": example, 
                "description": description,
                "schema": {"type": schema},
                "in": inVar
            })

        if len(task["availableOutputVariables"]) > 0:
            openapi["paths"]["tmp%d" % cnt][method]["responses"]["200"]["content"] = {
                "application/json": {
                    "schema": {
                        "$ref": "#/components/schemas/tmp%d" % cnt
                    }
                }
            }

              #responses:
              #  '200':
              #    content:
              #      application/json:
              #        schema:
              #  $ref: '#/components/schemas/tmp1'
          #description: Successful request

            openapi["components"]["schemas"]["tmp%d" % cnt] = {
                "type": "object",
                "properties": {},
            }

            for key, value in task["availableOutputVariables"].items():
                if key == "response_code": 
                    continue

                openapi["components"]["schemas"]["tmp%d" % cnt]["properties"][key] = {
                    "type": "string"
                }

        cnt += 1

    print("%s: %d" % (openapi["info"]["title"], len(paramnames)))

    return filename, openapi

def dump_data(filename, openapi, category):
    generatedfile = "generated/%s/%s" % (category, filename) 
    try:
        with open(generatedfile, "w+") as tmp:
            tmp.write(yaml.dump(openapi))
    except FileNotFoundError:
        os.mkdir("generated/%s" % category)

    with open(generatedfile, "w+") as tmp:
        tmp.write(yaml.dump(openapi))

    print("Generated %s" % generatedfile)

if __name__ == "__main__":
    number = 1
    #https://apphub.swimlane.com/
    categories = [
        "Endpoint Security & Management",
        "SIEM & Log Management",
        "Ticket Management",
    ]

    search_category = categories[2]
    total = 0
    while(True):
        url = "https://apphub.swimlane.io/api/search/swimbundles?page=%d" % number
        
        json = {"fields": {"family": search_category}}
        ret = requests.post(
            url,
            json=json,
        )

        if ret.status_code != 201:
            print("RET NOT 201: %d" % ret.status_code)
            break

        parsed = ret.json()
        try:
            category = parsed["data"][0]["swimbundleMeta"]["family"][0]
        except KeyError:
            category = ""
        except IndexError:
            category = ""

        if category == "":
            break

        for data in parsed["data"]:
            filename, openapi = parse_data(data)
            openapi["tags"] = [category]
            dump_data(filename, openapi, category)
            total += 1

        number += 1

    print("Created %d openapi specs from Swimlane with category %s" % (total, search_category))
