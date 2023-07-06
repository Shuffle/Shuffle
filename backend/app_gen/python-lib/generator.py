# Read a directory
# Find python functions
# Generate yaml

# FIXME:
# Position, default_value and function in params



# TO ADD:
# from walkoff_app_sdk.app_base import AppBase
# class TheHive(AppBase): <-- Add appbase
# __version__ = version within class
# app_name = app_name in class
# if __name__ == "__main__":
#    asyncio.run(TheHive.run(), debug=True) <-- APPEND SHIT HERE
# async infront of every function?
# Add async library to imports

# Make wrapper class? <-- within app.py


# 1. Generate app.yaml (functions with returns etc)
# 2. Generate app.py (with imports to the original function etc
# 3. Build requirements.txt based on the items necessary
# 4. Check whether it runs?

import os
import yaml
import jedi
import shutil

# Testing generator
entrypoint_directory = "thehive4py"
include_requirements = False
if not os.path.exists(entrypoint_directory):
    include_requirements = True 
    print("Requires library in requirements")
    

source = '''
import %s
%s.
''' % (entrypoint_directory, entrypoint_directory)
splitsource = source.split("\n")

# Find modules AKA files
def get_modules():
    curline = splitsource[-2]
    print(splitsource, curline)
    entrypoint = jedi.Script(source, line=len(splitsource)-1, column=len(curline))

    modules = []
    completions = entrypoint.completions()
    for item in completions:
        if item.type != "module":
            continue
        
        
        modules.append(item.name)

    return modules

def loop_modules(modules, data):
# Loop modules AKA files - this is garbage but works lmao
    for module in modules:
        modulesplit = list(splitsource)
        modulesplit[2] = "%s%s." % (modulesplit[2], module)

        #print(modulesplit)
        source = "\n".join(modulesplit) 
        entrypoint = jedi.Script(source, line=len(modulesplit)-1, column=len(modulesplit[2]))

        # Loop classes in the files
        for classcompletion in entrypoint.completions():
            if classcompletion.type != "class":
                continue

            if not classcompletion.full_name.startswith(modulesplit[2]):
                continue

            # Same thing again, but for functions within classes
            # CBA with subclasses etc atm

            #print(classcompletion.full_name, modulesplit[2])
        
            classplit = list(modulesplit)
            classplit[2] = "%s." % (classcompletion.full_name)

            #print(modulesplit)
            source = "\n".join(classplit) 
            entrypoint = jedi.Script(source, line=len(classplit)-1, column=len(classplit[2]))

            # List of functions sorted by their name 
            nameinternalfunctions = []
            for functioncompletion in entrypoint.completions():
                if functioncompletion.type != "function":
                    continue

                if not functioncompletion.full_name.startswith(classplit[2]):
                    continue

                nameinternalfunctions.append(functioncompletion)

            #print(nameinternalfunctions)

            # List of functions sorted by their line in the file (reversed)
            # CODE USED TO ACTUALLY PRINT THE CODE

            #prevnumber = 0
            #numberinternalfunctions = sorted(nameinternalfunctions, key=lambda k: k.line, reverse=True) 
            numberinternalfunctions = sorted(nameinternalfunctions, key=lambda k: k.line) 
            prevnumber = 0

            origparent = "TheHiveApi"
            # Predefined functions? - maybe skip: __init__ 
            skip_functions = ["__init__"]
            skip_parameters = [""]
            cnt = 0
            for item in numberinternalfunctions:
                if item.parent().name != origparent:
                    continue

                # FIXME - prolly wrong
                if item.name in skip_functions or (item.name.startswith("__") and item.name.endswith("__")):
                    continue

                # FIXME - remove
                #print(item.get_line_code())
                #if "=" not in item.get_line_code():
                #    continue

                #if item.docstring() in item.get_line_code():
                #    print("NO DOCSTRING FOR: %s. Skipping!" % item.name)
                #    cnt += 1
                #    continue

                curfunction = {
                    "name": item.name,
                    "description": "HEY",
                }

                params = []
                curreturn = {}

                function = item.docstring().split("\n")[0]
                for line in item.docstring().split("\n"):
                    if not line:
                        continue

                    linesplit = line.split(" ")
                    try:
                        curname = linesplit[1][:-1]
                    except IndexError as e:
                        print("IndexError: %s. Line: %s" % (e, line))
                        continue

                    paramfound = False
                    foundindex = 0
                    cnt = 0
                    for param in params:
                        #print(param["name"], curname)
                        if param["name"] == curname:
                            #print("ALREADY EXISTS: %s" % curname)
                            paramfound = True
                            foundindex = cnt
                            break

                        cnt += 1

                    # CBA finding a good parser, as that seemed impossible :(
                    # Skipped :return
                    if line.startswith(":param"):
                        if not paramfound:
                            #print("HERE!: %s" % line)

                            curparam = {}
                            #print(line)
                            curparam["name"] = curname 
                            curparam["description"] = " ".join(linesplit[2:])
                            #print(curparam["description"])
                            if "\r\n" in curparam["description"]:
                                curparam["description"] = " ".join(curparam["description"].split("\r\n"))
                            if "\n" in curparam["description"]:
                                curparam["description"] = " ".join(curparam["description"].split("\n"))

                            curparam["function"] = function

                            #curparam["docstring"] = item.docstring() 
                            params.append(curparam)
                    elif line.startswith(":type"):
                        if paramfound:
                            params[foundindex]["schema"] = {}
                            params[foundindex]["schema"]["type"] = " ".join(linesplit[2:])
                            #print(params)

                            #print(line)
                    elif line.startswith(":rtype"): 
                        curreturn["type"] = " ".join(linesplit[1:])


                # Check whether param is required
                # FIXME - remove
                #if len(params) != 0:
                #    print(params)
                #    continue

                #print(function)
                #print(params)

                # FIXME - this might crash when missing docstrings
                # FIXME - is also bad splitt (can be written without e.g. spaces
                # This should maybe be done first? idk
                fields = function.split("(")[1][:-1].split(", ")
                if len(params) == 0:
                    # Handle missing docstrings
                    params = []
                    for item in fields:
                        params.append({
                            "name": item,
                            "description": "",
                            "schema": {},
                            "function": function,
                        })

                cnt = 0
                for param in params:
                    found = False

                    for field in fields:
                        if param["name"] in field:
                            if "=" in field:
                                param["required"] = False
                                param["default_value"] = field
                            else:
                                param["required"] = True

                            found = True
                            break

                    if not param.get("schema"):
                        #print("Defining object schema for %s" % param["name"])
                        param["schema"] = {}
                        param["schema"]["type"] = "object"

                    param["position"] = cnt

                    if not found:
                        # FIXME - what here?
                        pass
                        #print("HANDLE NOT FOUND")
                        #print(param)
                        #print(fields)

                    cnt += 1

                if len(params) > 0:
                    curfunction["parameters"] = params

                if not curfunction.get("returns"):
                    curfunction["returns"] = {}
                    curfunction["returns"]["schema"] = {}
                    curfunction["returns"]["schema"]["type"] = "object"

                #print(curfunction)
                try:
                    print("Finished prepping %s with %d parameters and return %s" % (item.name, len(curfunction["parameters"]), curfunction["returns"]["schema"]["type"]))
                except KeyError as e:
                    print("Error: %s" % e)
                    #print("Finished prepping %s with 0 parameters and return %s" % (item.name, curfunction["returns"]["schema"]["type"]))
                    curfunction["parameters"] = []
                except AttributeError as e:
                    pass

                try:
                    data["actions"].append(curfunction)
                except KeyError:
                    data["actions"] = []
                    data["actions"].append(curfunction)

                #return data

                # FIXME
                #if cnt == breakcnt:
                #    break

                #cnt += 1

                # Check if 


                # THIS IS TO GET READ THE ACTUAL CODE
                #functioncode = item.get_line_code(after=prevnumber-item.line-1)
                #prevnumber = item.line

        # break
    return data

# Generates the base information necessary to make an api.yaml file
def generate_base_yaml(filename, version, appname):
    print("Generating base app for library %s with version %s" % (appname, version))
    data = {
        "walkoff_version": "0.0.1",
        "app_version": version,
        "name": appname,
        "description": "Autogenerated yaml with @Frikkylikeme's generator",
        "contact_info": {
            "name": "@frikkylikeme",
            "url": "https://github.com/frikky",
        }
    }

    return data

def generate_app(filepath, data):

    tbd = [
        "library_path",
        "import_class",
        "required_init"
    ]

    # FIXME - add to data dynamically and remove
    data["library_path"] = "thehive4py.api"
    data["import_class"] = "TheHiveApi"
    data["required_init"] = {"url": "http://localhost:9000", "principal": "asd"}

    wrapperstring = ""
    cnt = 0
    # FIXME - only works for strings currently
    for key, value in data["required_init"].items():
        if cnt != len(data["required_init"]):
            wrapperstring += "%s=\"%s\", " % (key, value)

        cnt += 1
            
    wrapperstring = wrapperstring[:-2]
    wrapper = "self.wrapper = %s(%s)" % (data["import_class"], wrapperstring)

    name = data["name"]
    if ":" in data["name"]:
        name = data["name"].split(":")[0]

    if not data.get("actions"):
        print("No actions found for %s in path %s" % (entrypoint_directory, data["library_path"]))
        print("Folder might be missing (or unexported (__init__.py), library not installed (pip) or library action missing")
        exit()

    functions = []
    for action in data["actions"]:
        internalparamstring = ""
        paramstring = ""
        try:
            for param in action["parameters"]:
                if param["required"] == False:
                    paramstring += "%s, " % (param["default_value"])
                else:
                    paramstring += "%s, " % param["name"]
        except KeyError:
            action["parameters"] = []

            #internalparamstring += "%s, " % param["name"]

        paramstring = paramstring[:-2]
        #internalparamstring = internalparamstring[:-2]

        functionstring = '''    async def %s(%s):
        return self.wrapper.%s(%s)
        ''' % (action["name"], paramstring, action["name"], paramstring)

        functions.append(functionstring)

    filedata = '''from walkoff_app_sdk.app_base import AppBase
import asyncio

from %s import %s

class %sWrapper(AppBase):

    __version__ = "%s"
    app_name = "%s"

    def __init__(self, redis, logger, console_logger=None):
        """
        Each app should have this __init__ to set up Redis and logging.
        :param redis:
        :param logger:
        :param console_logger:
        """

        super().__init__(redis, logger, console_logger)   
        %s

%s

if __name__ == "__main__":
    asyncio.run(%sWrapper.run(), debug=True)
''' % ( \
        data["library_path"],
        data["import_class"],
        name, 
        data["app_version"],
        name, 
        wrapper,
        "\n".join(functions),
        name 
    )

    # Simple key cleanup
    for item in tbd:
        try:
            del data[item]
        except KeyError:
            pass


    tbd_action = []

    tbd_param = [
        "position",
        "default_value",
        "function"
    ]

    for action in data["actions"]:
        for param in action["parameters"]: 
            for item in tbd_param:
                try:
                    del param[item]
                except KeyError:
                    pass

        for item in tbd_action:
            try:
                del action[item]
            except KeyError:
                pass

    # FIXME - add how to initialize the class
    with open(filepath, "w") as tmp:
        tmp.write(filedata)

    return data

def dump_yaml(filename, data):
    with open(filename, 'w') as outfile:
        yaml.dump(data, outfile, default_flow_style=False)

def build_base_structure(appname, version):
    outputdir = "generated"
    app_path = "%s/%s" % (outputdir, appname)
    filepath = "%s/%s" % (app_path, version)
    srcdir_path = "%s/src" % (filepath)

    directories = [
        outputdir,
        app_path,
        filepath,
        srcdir_path
    ]

    for directory in directories:
        try:
            os.mkdir(directory)
        except FileExistsError:
            print("%s already exists. Skipping." % directory)

    # "docker-compose.yml", 
    # "env.txt",
    filenames = [
        "Dockerfile", 
        "requirements.txt"
    ]
    
    #if strings.
    # include_requirements = False

    for filename in filenames:
        ret = shutil.copyfile("baseline/%s" % filename, "%s/%s" % (filepath, filename))
        print("Copied baseline/%s." % filename) 

def move_files(appname, version): 
    applocation = "../../functions/apps/%s" % appname
    if not os.path.exists("../../functions/apps"):
        os.mkdir("../../functions/apps")

    if not os.path.exists(applocation):
        os.mkdir(applocation)

    versionlocation = "%s/%s" % (applocation, version)
    if not os.path.exists(versionlocation):
        os.mkdir(versionlocation)

    shutil.rmtree(versionlocation)
    shutil.move("generated/%s/%s" % (appname, version), versionlocation)

    print("\nMoved files to %s" % versionlocation)


def main():
    appname = entrypoint_directory
    version = "0.0.1"
    output_path = "generated/%s/%s" % (appname, version)
    api_yaml_path = "%s/api.yaml" % (output_path)
    app_python_path = "%s/src/app.py" % (output_path)

    # Builds the directory structure for the app
    build_base_structure(appname, version)

    # Generates the yaml based on input library etc
    data = generate_base_yaml(api_yaml_path, version, appname)
    modules = get_modules()
    data = loop_modules(modules, data)

    # Generates app file  
    data = generate_app(app_python_path, data)

    # Dumps the yaml to specified directory 
    dump_yaml(api_yaml_path, data)

    # Move the file to functions/apps repository
    move_files(appname, version)
    
if __name__ == "__main__":
    main()
