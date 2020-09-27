package main

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"strconv"
	"strings"

	"cloud.google.com/go/storage"
	"github.com/getkin/kin-openapi/openapi3"
	//"github.com/satori/go.uuid"
	"gopkg.in/yaml.v2"
)

func copyFile(fromfile, tofile string) error {
	from, err := os.Open(fromfile)
	if err != nil {
		return err
	}
	defer from.Close()

	to, err := os.OpenFile(tofile, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		return err
	}
	defer to.Close()

	_, err = io.Copy(to, from)
	if err != nil {
		return err
	}

	return nil
}

func formatAppfile(filedata string) (string, string) {
	lines := strings.Split(filedata, "\n")

	newfile := []string{}
	classname := ""
	for _, line := range lines {
		if strings.Contains(line, "walkoff_app_sdk") {
			continue
		}

		// Remap logging. CBA this right now
		// This issue also persists in onprem apps because of await thingies.. :(
		// FIXME
		if strings.Contains(line, "console_logger") && strings.Contains(line, "await") {
			continue
			//line = strings.Replace(line, "console_logger", "logger", -1)
			//log.Println(line)
		}

		// Might not work with different import names
		// Could be fucked up with spaces everywhere? Idk
		if strings.Contains(line, "class") && strings.Contains(line, "(AppBase)") {
			items := strings.Split(line, " ")
			if len(items) > 0 && strings.Contains(items[1], "(AppBase)") {
				classname = strings.Split(items[1], "(")[0]
			} else {
				// This could break something..
				classname = "TMP"
			}
		}

		if strings.Contains(line, "if __name__ ==") {
			break
		}

		// asyncio.run(HelloWorld.run(), debug=True)

		newfile = append(newfile, line)
	}

	filedata = strings.Join(newfile, "\n")
	return classname, filedata
}

// Streams the data into a zip to be used for a cloud function
func streamZipdata(ctx context.Context, identifier, pythoncode, requirements string) (string, error) {
	filename := fmt.Sprintf("generated_cloudfunctions/%s.zip", identifier)

	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	zipFile, err := zipWriter.Create("main.py")
	if err != nil {
		log.Printf("Packing failed to create zip file from bucket: %v", err)
		return filename, err
	}

	// Have to use Fprintln otherwise it tries to parse all strings etc.
	if _, err := fmt.Fprintln(zipFile, pythoncode); err != nil {
		return filename, err
	}

	zipFile, err = zipWriter.Create("requirements.txt")
	if err != nil {
		log.Printf("Packing failed to create zip file from bucket: %v", err)
		return filename, err
	}
	if _, err := fmt.Fprintln(zipFile, requirements); err != nil {
		return filename, err
	}

	err = zipWriter.Close()
	if err != nil {
		log.Printf("Packing failed to close zip file writer from bucket: %v", err)
		return filename, err
	}

	return filename, nil
}

func getAppbase() ([]byte, []byte, error) {
	// 1. Have baseline in bucket/generated_apps/baseline
	// 2. Copy the baseline to a new folder with identifier name
	static := "../app_sdk/static_baseline.py"
	appbase := "../app_sdk/app_base.py"

	staticData, err := ioutil.ReadFile(static)
	if err != nil {
		return []byte{}, []byte{}, err
	}

	appbaseData, err := ioutil.ReadFile(appbase)
	if err != nil {
		return []byte{}, []byte{}, err
	}

	return appbaseData, staticData, nil
}

// Builds the structure for the new generated app in storage (copying baseline files)
func getAppbaseGCP(ctx context.Context, client *storage.Client) ([]byte, []byte, error) {
	// 1. Have baseline in bucket/generated_apps/baseline
	// 2. Copy the baseline to a new folder with identifier name
	basePath := "generated_apps/baseline"
	static, err := client.Bucket(bucketName).Object(fmt.Sprintf("%s/static_baseline.py", basePath)).NewReader(ctx)
	if err != nil {
		return []byte{}, []byte{}, err
	}
	appbase, err := client.Bucket(bucketName).Object(fmt.Sprintf("%s/app_base.py", basePath)).NewReader(ctx)
	if err != nil {
		return []byte{}, []byte{}, err
	}

	defer static.Close()
	defer appbase.Close()

	staticData, err := ioutil.ReadAll(static)
	if err != nil {
		return []byte{}, []byte{}, err
	}

	appbaseData, err := ioutil.ReadAll(appbase)
	if err != nil {
		return []byte{}, []byte{}, err
	}

	return appbaseData, staticData, nil
}

func fixAppbase(appbase []byte) []string {
	record := false
	validLines := []string{}
	for _, line := range strings.Split(string(appbase), "\n") {
		if strings.Contains(line, "#STOPCOPY") {
			//log.Println("Stopping copy")
			break
		}

		if record {
			validLines = append(validLines, line)
		}

		if strings.Contains(line, "#STARTCOPY") {
			//log.Println("Starting copy")
			record = true
		}
	}

	return validLines
}

// Builds the structure for the new generated app in storage (copying baseline files)
func buildStructureGCP(ctx context.Context, client *storage.Client, swagger *openapi3.Swagger, curHash string) (string, error) {
	// 1. Have baseline in bucket/generated_apps/baseline
	// 2. Copy the baseline to a new folder with identifier name

	basePath := "generated_apps"
	identifier := fmt.Sprintf("%s-%s", swagger.Info.Title, curHash)
	appPath := fmt.Sprintf("%s/%s", basePath, identifier)
	fileNames := []string{"Dockerfile", "requirements.txt"}
	for _, file := range fileNames {
		src := client.Bucket(bucketName).Object(fmt.Sprintf("%s/baseline/%s", basePath, file))
		dst := client.Bucket(bucketName).Object(fmt.Sprintf("%s/%s", appPath, file))
		if _, err := dst.CopierFrom(src).Run(ctx); err != nil {
			return "", err
		}
	}

	return appPath, nil
}

// Builds the base structure for the app that we're making
// Returns error if anything goes wrong. This has to work if
// the python code is supposed to be generated
func buildStructure(swagger *openapi3.Swagger, curHash string) (string, error) {
	//log.Printf("%#v", swagger)

	// adding md5 based on input data to not overwrite earlier data.
	generatedPath := "generated"
	subpath := "../app_gen/openapi/"
	identifier := fmt.Sprintf("%s-%s", swagger.Info.Title, curHash)
	appPath := fmt.Sprintf("%s/%s", generatedPath, identifier)

	os.MkdirAll(appPath, os.ModePerm)
	os.Mkdir(fmt.Sprintf("%s/src", appPath), os.ModePerm)

	err := copyFile(fmt.Sprintf("%sbaseline/Dockerfile", subpath), fmt.Sprintf("%s/%s", appPath, "Dockerfile"))
	if err != nil {
		log.Println("Failed to move Dockerfile")
		return appPath, err
	}

	err = copyFile(fmt.Sprintf("%sbaseline/requirements.txt", subpath), fmt.Sprintf("%s/%s", appPath, "requirements.txt"))
	if err != nil {
		log.Println("Failed to move requrements.txt")
		return appPath, err
	}

	return appPath, nil
}

// This function generates the python code that's being used.
// This is really meta when you program it. Handling parameters is hard here.
func makePythoncode(swagger *openapi3.Swagger, name, url, method string, parameters, optionalQueries, headers []string) (string, string) {
	method = strings.ToLower(method)
	queryString := ""
	queryData := ""

	// FIXME - this might break - need to check if ? or & should be set as query
	parameterData := ""
	if len(optionalQueries) > 0 {
		queryString += ", "
		for index, query := range optionalQueries {
			// Check if it's a part of the URL already
			queryString += fmt.Sprintf("%s=\"\"", query)
			if index != len(optionalQueries)-1 {
				queryString += ", "
			}

			queryData += fmt.Sprintf(`
        if %s:
            url += f"&%s={%s}"`, query, query, query)
		}
	} else {
		//log.Printf("No optional queries?")
	}

	// api.Authentication.Parameters[0].Value = "BearerAuth"
	authenticationParameter := ""
	authenticationSetup := ""
	authenticationAddin := ""
	// Python configuration code that should work :)
	if swagger.Components.SecuritySchemes != nil {
		if swagger.Components.SecuritySchemes["BearerAuth"] != nil {
			authenticationParameter = ", apikey"
			authenticationSetup = "if apikey != \" \": headers[\"Authorization\"] = f\"Bearer {apikey}\""
		} else if swagger.Components.SecuritySchemes["BasicAuth"] != nil {
			authenticationParameter = ", username_basic, password_basic"
			authenticationAddin = ", auth=(username_basic, password_basic)"
		} else if swagger.Components.SecuritySchemes["ApiKeyAuth"] != nil {
			authenticationParameter = ", apikey"
			if swagger.Components.SecuritySchemes["ApiKeyAuth"].Value.In == "header" {
				// This is a way to bypass apikeys by passing " "
				authenticationSetup = fmt.Sprintf(`if apikey != " ": headers["%s"] = apikey`, swagger.Components.SecuritySchemes["ApiKeyAuth"].Value.Name)
			} else if swagger.Components.SecuritySchemes["ApiKeyAuth"].Value.In == "query" {
				// This might suck lol
				key := "?"
				if strings.Contains(url, "?") {
					key = "&"
				}

				authenticationSetup = fmt.Sprintf("if apikey != \" \": url+=f\"%s%s={apikey}\"", key, swagger.Components.SecuritySchemes["ApiKeyAuth"].Value.Name)
			}
		}
	}

	//baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)
	// This is a quickfix for onpremises stuff. Does work, but should really be
	// part of the authentication scheme from openapi3
	urlParameter := ""
	urlInline := ""
	//log.Printf("URL: %s", url)
	if !strings.HasPrefix(strings.ToLower(url), "http") {
		urlParameter = ", url"
		urlInline = "{url}"
	}

	// Specific check for SSL verification
	// This is critical for onprem stuff.
	//verifyParam := ""
	//verifyWrapper := ""
	//verifyAddin := ""
	verifyParam := ", ssl_verify=False"
	verifyWrapper := `if type(ssl_verify) == str: ssl_verify = False if ssl_verify.lower() == "false" or ssl_verify == "0" else True`
	verifyAddin := ", verify=ssl_verify"

	if len(parameters) > 0 {
		parameterData = fmt.Sprintf(", %s", strings.Join(parameters, ", "))
	}

	// FIXME - add checks for query data etc

	functionname := strings.ToLower(fmt.Sprintf("%s_%s", method, name))
	if strings.Contains(strings.ToLower(name), strings.ToLower(method)) {
		functionname = strings.ToLower(name)
	}

	bodyParameter := ""
	bodyAddin := ""
	bodyFormatter := ""
	postParameters := []string{"post", "patch", "put"}
	for _, item := range postParameters {
		if method == item {
			bodyParameter = ", body=\"\""
			bodyAddin = ", data=body"

			// FIXME: Does JSON data work?
			bodyFormatter = `body = " ".join(body.strip().split()).encode("utf-8")`
		}
	}

	preparedHeaders := "headers={}"
	if len(headers) > 0 {
		preparedHeaders = "headers={"
		for count, header := range headers {
			headerSplit := strings.Split(header, "=")
			added := false
			if len(headerSplit) == 2 {
				if strings.Contains(preparedHeaders, headerSplit[0]) {
					continue
				}

				preparedHeaders += fmt.Sprintf(`"%s": "%s"`, headerSplit[0], headerSplit[1])
				added = true
			}

			if count != len(headers)-1 && added {
				preparedHeaders += ","
			}
		}

		preparedHeaders += "}"
	}

	// Extra param for url if it's changeable
	// Extra param for authentication scheme(s)
	// The last weird one is the body.. Tabs & spaces sucks.
	data := fmt.Sprintf(`    async def %s(self%s%s%s%s%s%s):
        %s
        url=f"%s%s"
        %s
        %s
        %s
        %s
        return requests.%s(url, headers=headers%s%s%s).text
		`,
		functionname,
		authenticationParameter,
		urlParameter,
		parameterData,
		queryString,
		bodyParameter,
		verifyParam,
		preparedHeaders,
		urlInline,
		url,
		verifyWrapper,
		authenticationSetup,
		queryData,
		bodyFormatter,
		method,
		authenticationAddin,
		bodyAddin,
		verifyAddin,
	)
	//if strings.Contains(functionname, "get_returns_the_vuln") {
	//	log.Println(data)
	//	log.Printf("Queries: %s", queryString)
	//}

	//log.Printf(data)
	return functionname, data
}

func generateYaml(swagger *openapi3.Swagger, newmd5 string) (*openapi3.Swagger, WorkflowApp, []string, error) {
	api := WorkflowApp{}
	//log.Printf("%#v", swagger.Info)

	if len(swagger.Info.Title) == 0 {
		return swagger, WorkflowApp{}, []string{}, errors.New("Swagger.Info.Title can't be empty.")
	}

	if len(swagger.Servers) == 0 {
		return swagger, WorkflowApp{}, []string{}, errors.New("Swagger.Servers can't be empty. Add 'servers':[{'url':'hostname.com'}'")
	}

	api.Name = swagger.Info.Title
	api.Description = swagger.Info.Description

	// FIXME: Versioning issue?
	api.ID = newmd5
	//uuid.NewV4().String()

	api.IsValid = true
	api.Link = swagger.Servers[0].URL // host doesnt exist lol
	if strings.HasSuffix(api.Link, "/") {
		api.Link = api.Link[:len(api.Link)-1]
	}

	api.AppVersion = "1.0.0"
	api.Environment = "Shuffle"
	api.SmallImage = ""
	api.LargeImage = ""
	api.Sharing = false
	api.Verified = false
	api.Tested = false
	api.PrivateID = newmd5
	api.Generated = true
	api.Activated = true
	// Setting up security schemes
	extraParameters := []WorkflowAppActionParameter{}

	if val, ok := swagger.Info.ExtensionProps.Extensions["x-logo"]; ok {
		j, err := json.Marshal(&val)
		if err == nil {
			if j[0] == 0x22 && j[len(j)-1] == 0x22 {
				j = j[1 : len(j)-1]
			}

			//log.Printf("%s", j)
			api.SmallImage = string(j)
			api.LargeImage = string(j)
		}
	}

	// Jesus what a clusterfuck.
	// Handles parsing of categories from OpenApi3 custom field
	if val, ok := swagger.Info.ExtensionProps.Extensions["x-categories"]; ok {
		//log.Printf("Categories: %#v", val)
		j, err := json.Marshal(&val)
		if err == nil {
			if j[0] == 0x22 && j[len(j)-1] == 0x22 {
				j = j[1 : len(j)-1]
			}

			parsedCategories := fmt.Sprintf(`{"categories": %s}`, string(j))
			type parsed struct {
				Categories []string `json:"categories"`
			}

			var parse parsed
			err := json.Unmarshal([]byte(parsedCategories), &parse)
			if err != nil {
				log.Printf("Failed unmarshaling categories", err)
			} else {
				api.Categories = parse.Categories
			}
		}
	}

	if len(swagger.Tags) > 0 {
		newTags := []string{}
		for _, tag := range swagger.Tags {
			newTags = append(newTags, tag.Name)
		}

		api.Tags = newTags
	}

	securitySchemes := swagger.Components.SecuritySchemes
	if securitySchemes != nil {
		//log.Printf("%#v", securitySchemes)

		api.Authentication = Authentication{
			Required:   true,
			Parameters: []AuthenticationParams{},
		}

		// Used for python code generation lol
		// Not sure how this should work with oauth
		if securitySchemes["BearerAuth"] != nil {
			api.Authentication.Parameters = append(api.Authentication.Parameters, AuthenticationParams{
				Name:        "apikey",
				Value:       "",
				Example:     "******",
				Description: securitySchemes["BearerAuth"].Value.Description,
				In:          securitySchemes["BearerAuth"].Value.In,
				Scheme:      securitySchemes["BearerAuth"].Value.Scheme,
				Schema: SchemaDefinition{
					Type: securitySchemes["BearerAuth"].Value.Scheme,
				},
			})

			//log.Printf("HANDLE BEARER AUTH")
			extraParameters = append(extraParameters, WorkflowAppActionParameter{
				Name:          "apikey",
				Description:   "The apikey to use",
				Multiline:     false,
				Required:      true,
				Example:       "The API key to use. Space = skip",
				Configuration: true,
				Schema: SchemaDefinition{
					Type: "string",
				},
			})
		} else if securitySchemes["ApiKeyAuth"] != nil {
			api.Authentication.Parameters = append(api.Authentication.Parameters, AuthenticationParams{
				Name:        "apikey",
				Value:       "",
				Example:     "******",
				Description: securitySchemes["ApiKeyAuth"].Value.Description,
				In:          securitySchemes["ApiKeyAuth"].Value.In,
				Scheme:      securitySchemes["ApiKeyAuth"].Value.Scheme,
				Schema: SchemaDefinition{
					Type: securitySchemes["ApiKeyAuth"].Value.Scheme,
				},
			})

			//log.Printf("HANDLE APIKEY AUTH")
			extraParameters = append(extraParameters, WorkflowAppActionParameter{
				Name:          "apikey",
				Description:   "The apikey to use",
				Multiline:     false,
				Required:      true,
				Example:       "**********",
				Configuration: true,
				Schema: SchemaDefinition{
					Type: "string",
				},
			})
		} else if securitySchemes["BasicAuth"] != nil {
			api.Authentication.Parameters = append(api.Authentication.Parameters, AuthenticationParams{
				Name:        "username_basic",
				Value:       "",
				Example:     "username",
				Description: securitySchemes["BasicAuth"].Value.Description,
				In:          securitySchemes["BasicAuth"].Value.In,
				Scheme:      securitySchemes["BasicAuth"].Value.Scheme,
				Schema: SchemaDefinition{
					Type: securitySchemes["BasicAuth"].Value.Scheme,
				},
			})

			api.Authentication.Parameters = append(api.Authentication.Parameters, AuthenticationParams{
				Name:        "password_basic",
				Value:       "",
				Example:     "*****",
				Description: securitySchemes["BasicAuth"].Value.Description,
				In:          securitySchemes["BasicAuth"].Value.In,
				Scheme:      securitySchemes["BasicAuth"].Value.Scheme,
				Schema: SchemaDefinition{
					Type: securitySchemes["BasicAuth"].Value.Scheme,
				},
			})

			extraParameters = append(extraParameters, WorkflowAppActionParameter{
				Name:          "username_basic",
				Description:   "The username to use",
				Multiline:     false,
				Required:      true,
				Example:       "The username to use",
				Configuration: true,
				Schema: SchemaDefinition{
					Type: "string",
				},
			})
			extraParameters = append(extraParameters, WorkflowAppActionParameter{
				Name:          "password_basic",
				Description:   "The password to use",
				Multiline:     false,
				Required:      true,
				Example:       "***********",
				Configuration: true,
				Schema: SchemaDefinition{
					Type: "string",
				},
			})
		}
	}

	// Adds a link parameter if it's not already defined
	if len(api.Link) == 0 {
		api.Authentication.Parameters = append(api.Authentication.Parameters, AuthenticationParams{
			Name:        "url",
			Description: "The URL of the app",
			Multiline:   false,
			Required:    true,
			Example:     "https://shuffler.io",
			Schema: SchemaDefinition{
				Type: "string",
			},
		})

		extraParameters = append(extraParameters, WorkflowAppActionParameter{
			Name:          "url",
			Description:   "The URL of the app",
			Multiline:     false,
			Required:      true,
			Configuration: true,
			Schema: SchemaDefinition{
				Type: "string",
			},
		})
	}

	// This is the python code to be generated
	// Could just as well be go at this point lol
	pythonFunctions := []string{}
	for actualPath, path := range swagger.Paths {
		actualPath = strings.Replace(actualPath, " ", "_", -1)
		//actualPath = strings.Replace(actualPath, ".", "", -1)
		actualPath = strings.Replace(actualPath, "\\", "", -1)

		// FIXME: Handle everything behind questionmark (?) with dots as well.
		// https://godoc.org/github.com/getkin/kin-openapi/openapi3#PathItem
		if path.Get != nil {
			action, curCode := handleGet(swagger, api, extraParameters, path, actualPath)
			api.Actions = append(api.Actions, action)
			pythonFunctions = append(pythonFunctions, curCode)
		}
		if path.Connect != nil {
			action, curCode := handleConnect(swagger, api, extraParameters, path, actualPath)
			api.Actions = append(api.Actions, action)
			pythonFunctions = append(pythonFunctions, curCode)
		}
		if path.Head != nil {
			action, curCode := handleHead(swagger, api, extraParameters, path, actualPath)
			api.Actions = append(api.Actions, action)
			pythonFunctions = append(pythonFunctions, curCode)
		}
		if path.Delete != nil {
			action, curCode := handleDelete(swagger, api, extraParameters, path, actualPath)
			api.Actions = append(api.Actions, action)
			pythonFunctions = append(pythonFunctions, curCode)
		}
		if path.Post != nil {
			action, curCode := handlePost(swagger, api, extraParameters, path, actualPath)
			api.Actions = append(api.Actions, action)
			pythonFunctions = append(pythonFunctions, curCode)
		}
		if path.Patch != nil {
			action, curCode := handlePatch(swagger, api, extraParameters, path, actualPath)
			api.Actions = append(api.Actions, action)
			pythonFunctions = append(pythonFunctions, curCode)
		}
		if path.Put != nil {
			action, curCode := handlePut(swagger, api, extraParameters, path, actualPath)
			api.Actions = append(api.Actions, action)
			pythonFunctions = append(pythonFunctions, curCode)
		}

		// Has to be here because its used differently above.
		// FIXING this is done during export instead?
		//log.Printf("OLDPATH: %s", actualPath)
		//if strings.Contains(actualPath, "?") {
		//	actualPath = strings.Split(actualPath, "?")[0]
		//}

		//log.Printf("NEWPATH: %s", actualPath)
		//newPaths[actualPath] = path
	}

	return swagger, api, pythonFunctions, nil
}

// FIXME - have this give a real version?
func verifyApi(api WorkflowApp) WorkflowApp {
	if api.AppVersion == "" {
		api.AppVersion = "1.0.0"
	}

	return api
}

func getBasePython() string {
	baseString := `import requests
import asyncio
import json
import urllib3

from walkoff_app_sdk.app_base import AppBase

class %s(AppBase):
    """
    Autogenerated class by Shuffler
    """
    
    __version__ = "%s"
    app_name = "%s"
    
    def __init__(self, redis, logger, console_logger=None):
    	self.verify = False
    	urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    	super().__init__(redis, logger, console_logger)

%s

if __name__ == "__main__":
    asyncio.run(%s.run(), debug=True)
`
	return baseString
}

func dumpPythonGCP(ctx context.Context, client *storage.Client, basePath, name, version string, pythonFunctions []string) (string, error) {
	parsedCode := fmt.Sprintf(getBasePython(), name, version, name, strings.Join(pythonFunctions, "\n"), name)

	// Create bucket handle
	bucket := client.Bucket(bucketName)
	obj := bucket.Object(fmt.Sprintf("%s/src/app.py", basePath))
	w := obj.NewWriter(ctx)
	if _, err := fmt.Fprintf(w, parsedCode); err != nil {
		return "", err
	}
	// Close, just like writing a file.
	if err := w.Close(); err != nil {
		return "", err
	}

	return parsedCode, nil
}

func dumpPython(basePath, name, version string, pythonFunctions []string) (string, error) {
	//log.Printf("%#v", api)
	//log.Printf(strings.Join(pythonFunctions, "\n"))

	parsedCode := fmt.Sprintf(getBasePython(), name, version, name, strings.Join(pythonFunctions, "\n"), name)

	err := ioutil.WriteFile(fmt.Sprintf("%s/src/app.py", basePath), []byte(parsedCode), os.ModePerm)
	if err != nil {
		return "", err
	}
	//fmt.Println(parsedCode)
	//log.Println(string(data))
	return parsedCode, nil
}

func dumpApiGCP(ctx context.Context, client *storage.Client, swagger *openapi3.Swagger, basePath string, api WorkflowApp) error {
	//log.Printf("%#v", api)
	data, err := yaml.Marshal(api)
	if err != nil {
		log.Printf("Error with yaml marshal: %s", err)
		return err
	}

	// Create bucket handle
	bucket := client.Bucket(bucketName)
	obj := bucket.Object(fmt.Sprintf("%s/app.yaml", basePath))
	w := obj.NewWriter(ctx)
	if _, err := fmt.Fprintln(w, string(data)); err != nil {
		return err
	}
	// Close, just like writing a file.
	if err := w.Close(); err != nil {
		return err
	}

	openapidata, err := yaml.Marshal(swagger)
	if err != nil {
		log.Printf("Error with yaml marshal: %s", err)
		return err
	}
	obj = bucket.Object(fmt.Sprintf("%s/openapi.yaml", basePath))
	//log.Println(string(openapidata))
	w = obj.NewWriter(ctx)
	if _, err := fmt.Fprintln(w, string(openapidata)); err != nil {
		return err
	}
	// Close, just like writing a file.
	if err := w.Close(); err != nil {
		return err
	}

	//log.Println(string(data))
	return nil
}

func dumpApi(basePath string, api WorkflowApp) error {
	//log.Printf("%#v", api)
	data, err := yaml.Marshal(api)
	if err != nil {
		log.Printf("Error with yaml marshal: %s", err)
		return err
	}

	err = ioutil.WriteFile(fmt.Sprintf("%s/api.yaml", basePath), []byte(data), os.ModePerm)
	if err != nil {
		return err
	}

	//log.Println(string(data))
	return nil
}

func getRunner(classname string) string {
	return fmt.Sprintf(`
# Run the actual thing after we've checked params
def run(request):
    print("Started execution!")
    action = request.get_json() 
    print(action)
    print(type(action))
    authorization_key = action.get("authorization")
    current_execution_id = action.get("execution_id")
	
    if action and "name" in action and "app_name" in action:
        asyncio.run(%s.run(action), debug=True)
        return f'Attempting to execute function {action["name"]} in app {action["app_name"]}' 
    else:
        return f'Invalid action'

	`, classname)
}

func deployAppToDatastore(ctx context.Context, workflowapp WorkflowApp) error {
	err := setWorkflowAppDatastore(ctx, workflowapp, workflowapp.ID)
	if err != nil {
		log.Printf("Failed setting workflowapp: %s", err)
		return err
	} else {
		log.Printf("Added %s:%s to the database", workflowapp.Name, workflowapp.AppVersion)
	}

	return nil
}

// FIXME:
// https://docs.python.org/3.2/reference/lexical_analysis.html#identifiers
// This is used to build the python functions.
func fixFunctionName(functionName, actualPath string) string {
	if len(functionName) == 0 {
		functionName = actualPath
	}

	// REGEX THIS SHIT
	// ROFL

	//log.Printf("Fixing function name for %s", functionName)
	functionName = strings.Replace(functionName, ".", "", -1)
	functionName = strings.Replace(functionName, ",", "", -1)
	functionName = strings.Replace(functionName, ".", "", -1)
	functionName = strings.Replace(functionName, "&", "", -1)
	functionName = strings.Replace(functionName, "/", "", -1)
	functionName = strings.Replace(functionName, "\\", "", -1)

	functionName = strings.Replace(functionName, "!", "", -1)
	functionName = strings.Replace(functionName, "?", "", -1)
	functionName = strings.Replace(functionName, "@", "", -1)
	functionName = strings.Replace(functionName, "#", "", -1)
	functionName = strings.Replace(functionName, "$", "", -1)
	functionName = strings.Replace(functionName, "&", "", -1)
	functionName = strings.Replace(functionName, "*", "", -1)
	functionName = strings.Replace(functionName, "(", "", -1)
	functionName = strings.Replace(functionName, ")", "", -1)
	functionName = strings.Replace(functionName, "[", "", -1)
	functionName = strings.Replace(functionName, "]", "", -1)
	functionName = strings.Replace(functionName, "{", "", -1)
	functionName = strings.Replace(functionName, "}", "", -1)
	functionName = strings.Replace(functionName, `"`, "", -1)
	functionName = strings.Replace(functionName, `'`, "", -1)
	functionName = strings.Replace(functionName, `|`, "", -1)
	functionName = strings.Replace(functionName, `~`, "", -1)

	functionName = strings.Replace(functionName, " ", "_", -1)
	functionName = strings.Replace(functionName, "-", "_", -1)

	functionName = strings.ToLower(functionName)

	return functionName
}

// Returns a valid param name
func validateParameterName(name string) string {
	invalid := []string{"False",
		"await",
		"else",
		"import",
		"pass",
		"None",
		"break",
		"except",
		"in",
		"raise",
		"True",
		"class",
		"finally",
		"is",
		"return",
		"and",
		"continue",
		"for",
		"lambda",
		"try",
		"as",
		"def",
		"from",
		"nonlocal",
		"while",
		"assert",
		"del",
		"global",
		"not",
		"with",
		"async",
		"elif",
		"if",
		"or",
		"yield",
	}

	newname := name
	for _, item := range invalid {
		if item == name {
			//log.Printf("%s is NOT a valid parameter name!", item)
			newname = fmt.Sprintf("%s_shuffle", item)
			break
		}
	}

	return newname
}

func handleConnect(swagger *openapi3.Swagger, api WorkflowApp, extraParameters []WorkflowAppActionParameter, path *openapi3.PathItem, actualPath string) (WorkflowAppAction, string) {
	// What to do with this, hmm
	functionName := fixFunctionName(path.Connect.Summary, actualPath)

	action := WorkflowAppAction{
		Description: path.Connect.Description,
		Name:        fmt.Sprintf("%s %s", "Connect", path.Connect.Summary),
		Label:       fmt.Sprintf(path.Connect.Summary),
		NodeType:    "action",
		Environment: api.Environment,
		Parameters:  extraParameters,
	}

	action.Returns.Schema.Type = "string"
	baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

	//log.Println(path.Parameters)

	// Parameters:  []WorkflowAppActionParameter{},
	// FIXME - add data for POST stuff
	firstQuery := true
	optionalQueries := []string{}
	parameters := []string{}
	optionalParameters := []WorkflowAppActionParameter{}
	optionalParameters = append(optionalParameters, WorkflowAppActionParameter{
		Name:        "ssl_verify",
		Description: "Check if you want to verify request",
		Multiline:   false,
		Required:    false,
		Example:     "True",
		Schema: SchemaDefinition{
			Type: "string",
		},
	})

	headersFound := []string{}
	if len(path.Connect.Parameters) > 0 {
		for counter, param := range path.Connect.Parameters {
			if param.Value.Schema == nil {
				continue
			} else if param.Value.In == "header" {
				headersFound = append(headersFound, fmt.Sprintf("%s=%s", param.Value.Name, param.Value.Example))
				continue
			}

			parsedName := param.Value.Name
			parsedName = strings.ReplaceAll(parsedName, " ", "_")
			parsedName = strings.ReplaceAll(parsedName, ",", "_")
			parsedName = strings.ReplaceAll(parsedName, ".", "_")
			parsedName = strings.ReplaceAll(parsedName, "|", "_")
			parsedName = validateParameterName(parsedName)
			param.Value.Name = parsedName
			path.Connect.Parameters[counter].Value.Name = parsedName

			curParam := WorkflowAppActionParameter{
				Name:        parsedName,
				Description: param.Value.Description,
				Multiline:   false,
				Required:    param.Value.Required,
				Schema: SchemaDefinition{
					Type: param.Value.Schema.Value.Type,
				},
			}

			// FIXME: Example & Multiline
			if param.Value.Example != nil {
				curParam.Example = param.Value.Example.(string)

				if param.Value.Name == "body" {
					curParam.Value = param.Value.Example.(string)
				}
			}
			if val, ok := param.Value.ExtensionProps.Extensions["multiline"]; ok {
				j, err := json.Marshal(&val)
				if err == nil {
					b, err := strconv.ParseBool(string(j))
					if err == nil {
						curParam.Multiline = b
					}
				}
			}

			if param.Value.In == "path" {
				parameters = append(parameters, curParam.Name)
				//baseUrl = fmt.Sprintf("%s%s", baseUrl)
			} else if param.Value.In == "query" {
				//log.Printf("QUERY!: %s", param.Value.Name)
				if !param.Value.Required {
					optionalQueries = append(optionalQueries, param.Value.Name)
					continue
				}

				parameters = append(parameters, param.Value.Name)

				if strings.Contains(baseUrl, fmt.Sprintf("%s={%s}", param.Value.Name, param.Value.Name)) {
					continue
				}

				if strings.Contains(baseUrl, fmt.Sprintf("{%s}", param.Value.Name)) {
					continue
				}

				if firstQuery && !strings.Contains(baseUrl, "?") {
					baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				} else {
					baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				}
				firstQuery = false
			}

			if param.Value.Required {
				action.Parameters = append(action.Parameters, curParam)
			} else {
				optionalParameters = append(optionalParameters, curParam)
			}

		}
	}

	// ensuring that they end up last in the specification
	// (order is ish important for optional params) - they need to be last.
	for _, optionalParam := range optionalParameters {
		action.Parameters = append(action.Parameters, optionalParam)
	}

	functionname, curCode := makePythoncode(swagger, functionName, baseUrl, "connect", parameters, optionalQueries, headersFound)

	if len(functionname) > 0 {
		action.Name = functionname
	}

	return action, curCode
}

func handleGet(swagger *openapi3.Swagger, api WorkflowApp, extraParameters []WorkflowAppActionParameter, path *openapi3.PathItem, actualPath string) (WorkflowAppAction, string) {
	// What to do with this, hmm
	functionName := fixFunctionName(path.Get.Summary, actualPath)

	action := WorkflowAppAction{
		Description: path.Get.Description,
		Name:        fmt.Sprintf("%s %s", "Get", path.Get.Summary),
		Label:       fmt.Sprintf(path.Get.Summary),
		NodeType:    "action",
		Environment: api.Environment,
		Parameters:  extraParameters,
	}

	action.Returns.Schema.Type = "string"
	baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

	// Parameters:  []WorkflowAppActionParameter{},
	// FIXME - add data for POST stuff
	firstQuery := true
	optionalQueries := []string{}

	// FIXME - remove this when authentication is properly introduced
	parameters := []string{}
	optionalParameters := []WorkflowAppActionParameter{}
	optionalParameters = append(optionalParameters, WorkflowAppActionParameter{
		Name:        "ssl_verify",
		Description: "Check if you want to verify the SSL certificate request",
		Multiline:   false,
		Required:    false,
		Example:     "False - default=True",
		Schema: SchemaDefinition{
			Type: "string",
		},
	})

	headersFound := []string{}
	if len(path.Get.Parameters) > 0 {
		for counter, param := range path.Get.Parameters {
			if param.Value.Schema == nil {
				continue
			} else if param.Value.In == "header" {
				headersFound = append(headersFound, fmt.Sprintf("%s=%s", param.Value.Name, param.Value.Example))
				continue
			}

			parsedName := param.Value.Name
			parsedName = strings.ReplaceAll(parsedName, " ", "_")
			parsedName = strings.ReplaceAll(parsedName, ",", "_")
			parsedName = strings.ReplaceAll(parsedName, ".", "_")
			parsedName = strings.ReplaceAll(parsedName, "|", "_")
			parsedName = validateParameterName(parsedName)
			param.Value.Name = parsedName
			path.Get.Parameters[counter].Value.Name = parsedName

			curParam := WorkflowAppActionParameter{
				Name:        parsedName,
				Description: param.Value.Description,
				Multiline:   false,
				Required:    param.Value.Required,
				Schema: SchemaDefinition{
					Type: param.Value.Schema.Value.Type,
				},
			}

			// FIXME: Example & Multiline
			if param.Value.Example != nil {
				curParam.Example = param.Value.Example.(string)

				if param.Value.Name == "body" {
					curParam.Value = param.Value.Example.(string)
				}
			}
			if val, ok := param.Value.ExtensionProps.Extensions["multiline"]; ok {
				j, err := json.Marshal(&val)
				if err == nil {
					b, err := strconv.ParseBool(string(j))
					if err == nil {
						curParam.Multiline = b
					}
				}
			}

			if param.Value.In == "path" {
				parameters = append(parameters, curParam.Name)
				//baseUrl = fmt.Sprintf("%s%s", baseUrl)
			} else if param.Value.In == "query" {
				//log.Printf("QUERY!: %s", param.Value.Name)
				if !param.Value.Required {
					optionalQueries = append(optionalQueries, param.Value.Name)
					continue
				}

				parameters = append(parameters, param.Value.Name)

				// Skipping simial
				if strings.Contains(baseUrl, fmt.Sprintf("%s={%s}", param.Value.Name, param.Value.Name)) {
					continue
				}

				if strings.Contains(baseUrl, fmt.Sprintf("{%s}", param.Value.Name)) {
					continue
				}

				if firstQuery && !strings.Contains(baseUrl, "?") {
					baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				} else {
					baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				}
				firstQuery = false
			}
			if param.Value.Required {
				action.Parameters = append(action.Parameters, curParam)
			} else {
				optionalParameters = append(optionalParameters, curParam)
			}

		}
	}

	// ensuring that they end up last in the specification
	// (order is ish important for optional params) - they need to be last.
	for _, optionalParam := range optionalParameters {
		action.Parameters = append(action.Parameters, optionalParam)
	}

	functionname, curCode := makePythoncode(swagger, functionName, baseUrl, "get", parameters, optionalQueries, headersFound)

	if len(functionname) > 0 {
		action.Name = functionname
	}

	return action, curCode
}

func handleHead(swagger *openapi3.Swagger, api WorkflowApp, extraParameters []WorkflowAppActionParameter, path *openapi3.PathItem, actualPath string) (WorkflowAppAction, string) {
	// What to do with this, hmm
	functionName := fixFunctionName(path.Head.Summary, actualPath)

	action := WorkflowAppAction{
		Description: path.Head.Description,
		Name:        fmt.Sprintf("%s %s", "Head", path.Head.Summary),
		Label:       fmt.Sprintf(path.Head.Summary),
		NodeType:    "action",
		Environment: api.Environment,
		Parameters:  extraParameters,
	}

	action.Returns.Schema.Type = "string"
	baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

	//log.Println(path.Parameters)

	// Parameters:  []WorkflowAppActionParameter{},
	// FIXME - add data for POST stuff
	firstQuery := true
	optionalQueries := []string{}
	parameters := []string{}
	optionalParameters := []WorkflowAppActionParameter{}
	optionalParameters = append(optionalParameters, WorkflowAppActionParameter{
		Name:        "ssl_verify",
		Description: "Check if you want to verify request",
		Multiline:   false,
		Required:    false,
		Example:     "True",
		Schema: SchemaDefinition{
			Type: "string",
		},
	})

	headersFound := []string{}
	if len(path.Head.Parameters) > 0 {
		for counter, param := range path.Head.Parameters {
			if param.Value.Schema == nil {
				continue
			} else if param.Value.In == "header" {
				headersFound = append(headersFound, fmt.Sprintf("%s=%s", param.Value.Name, param.Value.Example))
				continue
			}

			parsedName := param.Value.Name
			parsedName = strings.ReplaceAll(parsedName, " ", "_")
			parsedName = strings.ReplaceAll(parsedName, ",", "_")
			parsedName = strings.ReplaceAll(parsedName, ".", "_")
			parsedName = strings.ReplaceAll(parsedName, "|", "_")
			parsedName = validateParameterName(parsedName)
			param.Value.Name = parsedName
			path.Head.Parameters[counter].Value.Name = parsedName

			curParam := WorkflowAppActionParameter{
				Name:        parsedName,
				Description: param.Value.Description,
				Multiline:   false,
				Required:    param.Value.Required,
				Schema: SchemaDefinition{
					Type: param.Value.Schema.Value.Type,
				},
			}

			// FIXME: Example & Multiline
			if param.Value.Example != nil {
				curParam.Example = param.Value.Example.(string)

				if param.Value.Name == "body" {
					curParam.Value = param.Value.Example.(string)
				}
			}
			if val, ok := param.Value.ExtensionProps.Extensions["multiline"]; ok {
				j, err := json.Marshal(&val)
				if err == nil {
					b, err := strconv.ParseBool(string(j))
					if err == nil {
						curParam.Multiline = b
					}
				}
			}

			if param.Value.In == "path" {
				parameters = append(parameters, curParam.Name)
				//baseUrl = fmt.Sprintf("%s%s", baseUrl)
			} else if param.Value.In == "query" {
				//log.Printf("QUERY!: %s", param.Value.Name)
				if !param.Value.Required {
					optionalQueries = append(optionalQueries, param.Value.Name)
					continue
				}

				parameters = append(parameters, param.Value.Name)

				if strings.Contains(baseUrl, fmt.Sprintf("%s={%s}", param.Value.Name, param.Value.Name)) {
					continue
				}

				if strings.Contains(baseUrl, fmt.Sprintf("{%s}", param.Value.Name)) {
					continue
				}

				if firstQuery && !strings.Contains(baseUrl, "?") {
					baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				} else {
					baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				}
				firstQuery = false
			}

			if param.Value.Required {
				action.Parameters = append(action.Parameters, curParam)
			} else {
				optionalParameters = append(optionalParameters, curParam)
			}

		}
	}

	// ensuring that they end up last in the specification
	// (order is ish important for optional params) - they need to be last.
	for _, optionalParam := range optionalParameters {
		action.Parameters = append(action.Parameters, optionalParam)
	}

	functionname, curCode := makePythoncode(swagger, functionName, baseUrl, "head", parameters, optionalQueries, headersFound)

	if len(functionname) > 0 {
		action.Name = functionname
	}

	return action, curCode
}

func handleDelete(swagger *openapi3.Swagger, api WorkflowApp, extraParameters []WorkflowAppActionParameter, path *openapi3.PathItem, actualPath string) (WorkflowAppAction, string) {
	// What to do with this, hmm
	functionName := fixFunctionName(path.Delete.Summary, actualPath)

	action := WorkflowAppAction{
		Description: path.Delete.Description,
		Name:        fmt.Sprintf("%s %s", "Delete", path.Delete.Summary),
		Label:       fmt.Sprintf(path.Delete.Summary),
		NodeType:    "action",
		Environment: api.Environment,
		Parameters:  extraParameters,
	}

	action.Returns.Schema.Type = "string"
	baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

	//log.Println(path.Parameters)

	// Parameters:  []WorkflowAppActionParameter{},
	// FIXME - add data for POST stuff
	firstQuery := true
	optionalQueries := []string{}
	parameters := []string{}
	optionalParameters := []WorkflowAppActionParameter{}
	optionalParameters = append(optionalParameters, WorkflowAppActionParameter{
		Name:        "ssl_verify",
		Description: "Check if you want to verify request",
		Multiline:   false,
		Required:    false,
		Example:     "True",
		Schema: SchemaDefinition{
			Type: "string",
		},
	})

	headersFound := []string{}
	if len(path.Delete.Parameters) > 0 {
		for counter, param := range path.Delete.Parameters {
			if param.Value.Schema == nil {
				continue
			} else if param.Value.In == "header" {
				headersFound = append(headersFound, fmt.Sprintf("%s=%s", param.Value.Name, param.Value.Example))
				continue
			}

			parsedName := param.Value.Name
			parsedName = strings.ReplaceAll(parsedName, " ", "_")
			parsedName = strings.ReplaceAll(parsedName, ",", "_")
			parsedName = strings.ReplaceAll(parsedName, ".", "_")
			parsedName = strings.ReplaceAll(parsedName, "|", "_")
			parsedName = validateParameterName(parsedName)
			param.Value.Name = parsedName
			path.Delete.Parameters[counter].Value.Name = parsedName

			curParam := WorkflowAppActionParameter{
				Name:        parsedName,
				Description: param.Value.Description,
				Multiline:   false,
				Required:    param.Value.Required,
				Schema: SchemaDefinition{
					Type: param.Value.Schema.Value.Type,
				},
			}

			// FIXME: Example & Multiline
			if param.Value.Example != nil {
				curParam.Example = param.Value.Example.(string)

				if param.Value.Name == "body" {
					curParam.Value = param.Value.Example.(string)
				}
			}
			if val, ok := param.Value.ExtensionProps.Extensions["multiline"]; ok {
				j, err := json.Marshal(&val)
				if err == nil {
					b, err := strconv.ParseBool(string(j))
					if err == nil {
						curParam.Multiline = b
					}
				}
			}

			if param.Value.In == "path" {
				parameters = append(parameters, curParam.Name)
				//baseUrl = fmt.Sprintf("%s%s", baseUrl)
			} else if param.Value.In == "query" {
				//log.Printf("QUERY!: %s", param.Value.Name)
				if !param.Value.Required {
					optionalQueries = append(optionalQueries, param.Value.Name)
					continue
				}

				parameters = append(parameters, param.Value.Name)

				if strings.Contains(baseUrl, fmt.Sprintf("%s={%s}", param.Value.Name, param.Value.Name)) {
					continue
				}

				if strings.Contains(baseUrl, fmt.Sprintf("{%s}", param.Value.Name)) {
					continue
				}

				if firstQuery && !strings.Contains(baseUrl, "?") {
					baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				} else {
					baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				}
				firstQuery = false
			}

			if param.Value.Required {
				action.Parameters = append(action.Parameters, curParam)
			} else {
				optionalParameters = append(optionalParameters, curParam)
			}

		}
	}

	// ensuring that they end up last in the specification
	// (order is ish important for optional params) - they need to be last.
	for _, optionalParam := range optionalParameters {
		action.Parameters = append(action.Parameters, optionalParam)
	}

	functionname, curCode := makePythoncode(swagger, functionName, baseUrl, "delete", parameters, optionalQueries, headersFound)

	if len(functionname) > 0 {
		action.Name = functionname
	}

	return action, curCode
}

func handlePost(swagger *openapi3.Swagger, api WorkflowApp, extraParameters []WorkflowAppActionParameter, path *openapi3.PathItem, actualPath string) (WorkflowAppAction, string) {
	// What to do with this, hmm
	//log.Printf("PATH: %s", actualPath)
	functionName := fixFunctionName(path.Post.Summary, actualPath)

	action := WorkflowAppAction{
		Description: path.Post.Description,
		Name:        fmt.Sprintf("%s %s", "Post", path.Post.Summary),
		Label:       fmt.Sprintf(path.Post.Summary),
		NodeType:    "action",
		Environment: api.Environment,
		Parameters:  extraParameters,
	}

	action.Returns.Schema.Type = "string"
	baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

	// Parameters:  []WorkflowAppActionParameter{},
	// FIXME - add data for POST stuff
	firstQuery := true
	optionalQueries := []string{}
	parameters := []string{}
	optionalParameters := []WorkflowAppActionParameter{}
	optionalParameters = append(optionalParameters, WorkflowAppActionParameter{
		Name:        "ssl_verify",
		Description: "Check if you want to verify request",
		Multiline:   false,
		Required:    false,
		Example:     "True",
		Schema: SchemaDefinition{
			Type: "string",
		},
	})

	headersFound := []string{}
	if len(path.Post.Parameters) > 0 {
		for counter, param := range path.Post.Parameters {
			if param.Value.Schema == nil {
				continue
			} else if param.Value.In == "header" {
				headersFound = append(headersFound, fmt.Sprintf("%s=%s", param.Value.Name, param.Value.Example))
				continue
			}

			parsedName := param.Value.Name
			parsedName = strings.ReplaceAll(parsedName, " ", "_")
			parsedName = strings.ReplaceAll(parsedName, ",", "_")
			parsedName = strings.ReplaceAll(parsedName, ".", "_")
			parsedName = strings.ReplaceAll(parsedName, "|", "_")
			parsedName = validateParameterName(parsedName)
			param.Value.Name = parsedName
			path.Post.Parameters[counter].Value.Name = parsedName

			curParam := WorkflowAppActionParameter{
				Name:        parsedName,
				Description: param.Value.Description,
				Multiline:   false,
				Required:    param.Value.Required,
				Schema: SchemaDefinition{
					Type: param.Value.Schema.Value.Type,
				},
			}

			// FIXME: Example & Multiline
			if param.Value.Example != nil {
				curParam.Example = param.Value.Example.(string)

				if parsedName == "body" {
					curParam.Value = param.Value.Example.(string)
				}
			}
			if val, ok := param.Value.ExtensionProps.Extensions["multiline"]; ok {
				j, err := json.Marshal(&val)
				if err == nil {
					b, err := strconv.ParseBool(string(j))
					if err == nil {
						curParam.Multiline = b
					}
				}
			}

			if param.Value.In == "path" {
				parameters = append(parameters, curParam.Name)
				//baseUrl = fmt.Sprintf("%s%s", baseUrl)
			} else if param.Value.In == "query" {
				//log.Printf("QUERY!: %s", param.Value.Name)
				if !param.Value.Required {
					optionalQueries = append(optionalQueries, param.Value.Name)
					continue
				}

				parameters = append(parameters, param.Value.Name)

				if strings.Contains(baseUrl, fmt.Sprintf("%s={%s}", param.Value.Name, param.Value.Name)) {
					continue
				}

				if strings.Contains(baseUrl, fmt.Sprintf("{%s}", param.Value.Name)) {
					continue
				}

				if firstQuery && !strings.Contains(baseUrl, "?") {
					baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				} else {
					baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				}
				firstQuery = false
			}

			if param.Value.Required {
				action.Parameters = append(action.Parameters, curParam)
			} else {
				optionalParameters = append(optionalParameters, curParam)
			}
		}
	}

	// ensuring that they end up last in the specification
	// (order is ish important for optional params) - they need to be last.
	for _, optionalParam := range optionalParameters {
		action.Parameters = append(action.Parameters, optionalParam)
	}

	functionname, curCode := makePythoncode(swagger, functionName, baseUrl, "post", parameters, optionalQueries, headersFound)

	if len(functionname) > 0 {
		action.Name = functionname
	}

	return action, curCode
}

func handlePatch(swagger *openapi3.Swagger, api WorkflowApp, extraParameters []WorkflowAppActionParameter, path *openapi3.PathItem, actualPath string) (WorkflowAppAction, string) {
	// What to do with this, hmm
	functionName := fixFunctionName(path.Patch.Summary, actualPath)

	action := WorkflowAppAction{
		Description: path.Patch.Description,
		Name:        fmt.Sprintf("%s %s", "Patch", path.Patch.Summary),
		Label:       fmt.Sprintf(path.Patch.Summary),
		NodeType:    "action",
		Environment: api.Environment,
		Parameters:  extraParameters,
	}

	action.Returns.Schema.Type = "string"
	baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

	//log.Println(path.Parameters)

	// Parameters:  []WorkflowAppActionParameter{},
	// FIXME - add data for POST stuff
	firstQuery := true
	optionalQueries := []string{}
	parameters := []string{}
	optionalParameters := []WorkflowAppActionParameter{}
	optionalParameters = append(optionalParameters, WorkflowAppActionParameter{
		Name:        "ssl_verify",
		Description: "Check if you want to verify request",
		Multiline:   false,
		Required:    false,
		Example:     "True",
		Schema: SchemaDefinition{
			Type: "string",
		},
	})

	headersFound := []string{}
	if len(path.Patch.Parameters) > 0 {
		for counter, param := range path.Patch.Parameters {
			if param.Value.Schema == nil {
				continue
			} else if param.Value.In == "header" {
				headersFound = append(headersFound, fmt.Sprintf("%s=%s", param.Value.Name, param.Value.Example))
				continue
			}

			parsedName := param.Value.Name
			parsedName = strings.ReplaceAll(parsedName, " ", "_")
			parsedName = strings.ReplaceAll(parsedName, ",", "_")
			parsedName = strings.ReplaceAll(parsedName, ".", "_")
			parsedName = strings.ReplaceAll(parsedName, "|", "_")
			parsedName = validateParameterName(parsedName)
			param.Value.Name = parsedName
			path.Patch.Parameters[counter].Value.Name = parsedName

			curParam := WorkflowAppActionParameter{
				Name:        parsedName,
				Description: param.Value.Description,
				Multiline:   false,
				Required:    param.Value.Required,
				Schema: SchemaDefinition{
					Type: param.Value.Schema.Value.Type,
				},
			}

			// FIXME: Example & Multiline
			if param.Value.Example != nil {
				curParam.Example = param.Value.Example.(string)

				if param.Value.Name == "body" {
					curParam.Value = param.Value.Example.(string)
				}
			}
			if val, ok := param.Value.ExtensionProps.Extensions["multiline"]; ok {
				j, err := json.Marshal(&val)
				if err == nil {
					b, err := strconv.ParseBool(string(j))
					if err == nil {
						curParam.Multiline = b
					}
				}
			}

			if param.Value.In == "path" {
				parameters = append(parameters, curParam.Name)
				//baseUrl = fmt.Sprintf("%s%s", baseUrl)
			} else if param.Value.In == "query" {
				//log.Printf("QUERY!: %s", param.Value.Name)
				if !param.Value.Required {
					optionalQueries = append(optionalQueries, param.Value.Name)
					continue
				}

				parameters = append(parameters, param.Value.Name)

				if strings.Contains(baseUrl, fmt.Sprintf("%s={%s}", param.Value.Name, param.Value.Name)) {
					continue
				}

				if strings.Contains(baseUrl, fmt.Sprintf("{%s}", param.Value.Name)) {
					continue
				}

				if firstQuery && !strings.Contains(baseUrl, "?") {
					baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				} else {
					baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				}
				firstQuery = false
			}

			if param.Value.Required {
				action.Parameters = append(action.Parameters, curParam)
			} else {
				optionalParameters = append(optionalParameters, curParam)
			}
		}
	}

	// ensuring that they end up last in the specification
	// (order is ish important for optional params) - they need to be last.
	for _, optionalParam := range optionalParameters {
		action.Parameters = append(action.Parameters, optionalParam)
	}

	functionname, curCode := makePythoncode(swagger, functionName, baseUrl, "delete", parameters, optionalQueries, headersFound)

	if len(functionname) > 0 {
		action.Name = functionname
	}

	return action, curCode
}

func handlePut(swagger *openapi3.Swagger, api WorkflowApp, extraParameters []WorkflowAppActionParameter, path *openapi3.PathItem, actualPath string) (WorkflowAppAction, string) {
	// What to do with this, hmm
	functionName := fixFunctionName(path.Put.Summary, actualPath)

	action := WorkflowAppAction{
		Description: path.Put.Description,
		Name:        fmt.Sprintf("%s %s", "Put", path.Put.Summary),
		Label:       fmt.Sprintf(path.Put.Summary),
		NodeType:    "action",
		Environment: api.Environment,
		Parameters:  extraParameters,
	}

	action.Returns.Schema.Type = "string"
	baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

	//log.Println(path.Parameters)

	// Parameters:  []WorkflowAppActionParameter{},
	// FIXME - add data for POST stuff
	firstQuery := true
	optionalQueries := []string{}
	parameters := []string{}
	optionalParameters := []WorkflowAppActionParameter{}
	optionalParameters = append(optionalParameters, WorkflowAppActionParameter{
		Name:        "ssl_verify",
		Description: "Check if you want to verify request",
		Multiline:   false,
		Required:    false,
		Example:     "True",
		Schema: SchemaDefinition{
			Type: "string",
		},
	})

	headersFound := []string{}
	if len(path.Put.Parameters) > 0 {
		for counter, param := range path.Put.Parameters {
			if param.Value.Schema == nil {
				continue
			} else if param.Value.In == "header" {
				headersFound = append(headersFound, fmt.Sprintf("%s=%s", param.Value.Name, param.Value.Example))
				continue
			}

			parsedName := param.Value.Name
			parsedName = strings.ReplaceAll(parsedName, " ", "_")
			parsedName = strings.ReplaceAll(parsedName, ",", "_")
			parsedName = strings.ReplaceAll(parsedName, ".", "_")
			parsedName = strings.ReplaceAll(parsedName, "|", "_")
			parsedName = validateParameterName(parsedName)
			param.Value.Name = parsedName
			path.Put.Parameters[counter].Value.Name = parsedName

			curParam := WorkflowAppActionParameter{
				Name:        parsedName,
				Description: param.Value.Description,
				Multiline:   false,
				Required:    param.Value.Required,
				Schema: SchemaDefinition{
					Type: param.Value.Schema.Value.Type,
				},
			}

			// FIXME: Example & Multiline
			if param.Value.Example != nil {
				curParam.Example = param.Value.Example.(string)

				if param.Value.Name == "body" {
					curParam.Value = param.Value.Example.(string)
				}
			}
			if val, ok := param.Value.ExtensionProps.Extensions["multiline"]; ok {
				j, err := json.Marshal(&val)
				if err == nil {
					b, err := strconv.ParseBool(string(j))
					if err == nil {
						curParam.Multiline = b
					}
				}
			}

			if param.Value.In == "path" {
				parameters = append(parameters, param.Value.Name)
				//baseUrl = fmt.Sprintf("%s%s", baseUrl)
			} else if param.Value.In == "query" {
				//log.Printf("QUERY!: %s", param.Value.Name)
				if !param.Value.Required {
					optionalQueries = append(optionalQueries, param.Value.Name)
					continue
				}

				parameters = append(parameters, param.Value.Name)

				if strings.Contains(baseUrl, fmt.Sprintf("%s={%s}", param.Value.Name, param.Value.Name)) {
					continue
				}

				if strings.Contains(baseUrl, fmt.Sprintf("{%s}", param.Value.Name)) {
					continue
				}

				if firstQuery && !strings.Contains(baseUrl, "?") {
					baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				} else {
					baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
				}
				firstQuery = false
			}

			if param.Value.Required {
				action.Parameters = append(action.Parameters, curParam)
			} else {
				optionalParameters = append(optionalParameters, curParam)
			}

		}
	}

	// ensuring that they end up last in the specification
	// (order is ish important for optional params) - they need to be last.
	for _, optionalParam := range optionalParameters {
		action.Parameters = append(action.Parameters, optionalParam)
	}

	functionname, curCode := makePythoncode(swagger, functionName, baseUrl, "delete", parameters, optionalQueries, headersFound)

	if len(functionname) > 0 {
		action.Name = functionname
	}

	return action, curCode
}
