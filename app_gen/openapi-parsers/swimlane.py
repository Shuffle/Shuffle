import requests
import yaml 

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

    category = data["category"]

    filename = "%s.yaml" % data["title"].replace(" ", "_").lower()
    openapi["info"]["title"] = data["title"]
    openapi["info"]["description"] = "Automated generation of %s" % data["title"]
    # data["description"]

    cnt = 0
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

        #taskname = task["name"]
        #taskdescription = task["description"]
        taskcategory = task["family"]

        # This doesn't really do much except build the return value structures
        for parameter in task["input_parameters"]:
            example = parameter["example"]

            inVar = "query"

            if parameter["type"] == 6:
                inVar = "body"

            schema = "string"
            schemaset = False
            if parameter["type"] != 1:
                if (parameter["type"] == 7):
                    schema = "boolean"
                    schemaset = True

            if schema == "string" and schemaset:
                print("Should change type: %d" % parameter["type"])
                print(task["name"])
                print(parameter["name"])
                print()


            if len(example) == 1:
                print("Change to number?")
            if example.startswith("{"):
                print("Change to json object?")
            if example.startswith("["):
                print("Change to array object?")

            # Not sure how to tackle this
            openapi["paths"]["tmp%d" % cnt][method]["parameters"].append({
                "in": inVar,
                "name": parameter["name"],
                "required": parameter["required"],
                "description": parameter["description"],
                "schema": {"type": schema}
            })

        if len(task["available_output_variables"]) > 0:
            openapi["paths"]["tmp%d" % cnt][method]["responses"]["200"]["content"]: {
                "application/json": {
                    "schema": {
                        "$ref": "#/components/schemas/tmp%d" % cnt
                    }
                }
            }

            openapi["components"]["schemas"]["tmp%d" % cnt] = {
                "type": "object",
                "properties": {},
            }

            for output in task["available_output_variables"]:
                openapi["components"]["schemas"]["tmp%d" % cnt]["properties"][output["key"]] = {"type": "string"}


        cnt += 1

    #print(openapi)
    #print(filename)

    return filename, openapi

def dump_data(filename, openapi):
    generatedfile = "generated/%s" % filename
    with open(generatedfile, "w+") as tmp:
        tmp.write(yaml.dump(openapi))

    print("Generated %s" % generatedfile)

if __name__ == "__main__":
    url = "https://apphub.swimlane.com/api/v1/bundles/cjuspytpz00rh0hpjo5chqg10"
    url = "https://apphub.swimlane.com/api/v1/bundles/cjyoy62ch04920lr26id5sr0e"
    url = "https://apphub.swimlane.com/api/v1/bundles/cjqrdc2yr02rs0fli6jrosiqb"
    url = "https://apphub.swimlane.com/api/v1/bundles/cjqrdat0u01ux0flipb68a0a0"
    url = "https://apphub.swimlane.com/api/v1/bundles/cjqrdhbwp07nf0fli23lyb52h"
    data = requests.get(url).json()
    filename, openapi = parse_data(data)
    dump_data(filename, openapi)
