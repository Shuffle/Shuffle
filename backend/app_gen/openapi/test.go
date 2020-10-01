package main

import (
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/getkin/kin-openapi/openapi3"
	"gopkg.in/yaml.v2"
	"io"
	"io/ioutil"
	"log"
	"os"
	"strings"
)

type WorkflowApp struct {
	Name        string `json:"name" yaml:"name" required:true datastore:"name"`
	IsValid     bool   `json:"is_valid" yaml:"is_valid" required:true datastore:"is_valid"`
	ID          string `json:"id" yaml:"id,omitempty" required:false datastore:"id"`
	Link        string `json:"link" yaml:"link" required:false datastore:"link,noindex"`
	AppVersion  string `json:"app_version" yaml:"app_version" required:true datastore:"app_version"`
	Description string `json:"description" datastore:"description" required:false yaml:"description"`
	Environment string `json:"environment" datastore:"environment" required:true yaml:"environment"`
	SmallImage  string `json:"small_image" datastore:"small_image,noindex" required:false yaml:"small_image"`
	LargeImage  string `json:"large_image" datastore:"large_image,noindex" yaml:"large_image" required:false`
	ContactInfo struct {
		Name string `json:"name" datastore:"name" yaml:"name"`
		Url  string `json:"url" datastore:"url" yaml:"url"`
	} `json:"contact_info" datastore:"contact_info" yaml:"contact_info" required:false`
	Actions        []WorkflowAppAction `json:"actions" yaml:"actions" required:true datastore:"actions"`
	Authentication Authentication      `json:"authentication" yaml:"authentication" required:false datastore:"authentication"`
}

type AuthenticationParams struct {
	Description string `json:"description" datastore:"description" yaml:"description"`
	ID          string `json:"id" datastore:"id" yaml:"id"`
	Name        string `json:"name" datastore:"name" yaml:"name"`
	Example     string `json:"example" datastore:"example" yaml:"example"s`
	Value       string `json:"value,omitempty" datastore:"value" yaml:"value"`
	Multiline   bool   `json:"multiline" datastore:"multiline" yaml:"multiline"`
	Required    bool   `json:"required" datastore:"required" yaml:"required"`
}

type Authentication struct {
	Required   bool                   `json:"required" datastore:"required" yaml:"required" `
	Parameters []AuthenticationParams `json:"parameters" datastore:"parameters" yaml:"parameters"`
}

type AuthenticationStore struct {
	Key   string `json:"key" datastore:"key"`
	Value string `json:"value" datastore:"value"`
}

type WorkflowAppActionParameter struct {
	Description string           `json:"description" datastore:"description" yaml:"description"`
	ID          string           `json:"id" datastore:"id" yaml:"id,omitempty"`
	Name        string           `json:"name" datastore:"name" yaml:"name"`
	Example     string           `json:"example" datastore:"example" yaml:"example"`
	Value       string           `json:"value" datastore:"value" yaml:"value,omitempty"`
	Multiline   bool             `json:"multiline" datastore:"multiline" yaml:"multiline"`
	ActionField string           `json:"action_field" datastore:"action_field" yaml:"actionfield,omitempty"`
	Variant     string           `json:"variant" datastore:"variant" yaml:"variant,omitempty"`
	Required    bool             `json:"required" datastore:"required" yaml:"required"`
	Schema      SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
}

type SchemaDefinition struct {
	Type string `json:"type" datastore:"type"`
}

type WorkflowAppAction struct {
	Description    string                       `json:"description" datastore:"description"`
	ID             string                       `json:"id" datastore:"id" yaml:"id,omitempty"`
	Name           string                       `json:"name" datastore:"name"`
	NodeType       string                       `json:"node_type" datastore:"node_type"`
	Environment    string                       `json:"environment" datastore:"environment"`
	Authentication []AuthenticationStore        `json:"authentication" datastore:"authentication" yaml:"authentication,omitempty"`
	Parameters     []WorkflowAppActionParameter `json:"parameters" datastore: "parameters"`
	Returns        struct {
		Description string           `json:"description" datastore:"returns" yaml:"description,omitempty"`
		ID          string           `json:"id" datastore:"id" yaml:"id,omitempty"`
		Schema      SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
	} `json:"returns" datastore:"returns"`
}

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

// Builds the base structure for the app that we're making
// Returns error if anything goes wrong. This has to work if
// the python code is supposed to be generated
func buildStructure(swagger *openapi3.Swagger, curHash string) (string, error) {
	//log.Printf("%#v", swagger)

	// adding md5 based on input data to not overwrite earlier data.
	generatedPath := "generated"
	identifier := fmt.Sprintf("%s-%s", swagger.Info.Title, curHash)
	appPath := fmt.Sprintf("%s/%s", generatedPath, identifier)

	os.MkdirAll(appPath, os.ModePerm)
	os.Mkdir(fmt.Sprintf("%s/src", appPath), os.ModePerm)

	err := copyFile("baseline/Dockerfile", fmt.Sprintf("%s/%s", appPath, "Dockerfile"))
	if err != nil {
		log.Println("Failed to move Dockerfile")
		return appPath, err
	}

	err = copyFile("baseline/requirements.txt", fmt.Sprintf("%s/%s", appPath, "requirements.txt"))
	if err != nil {
		log.Println("Failed to move requrements.txt")
		return appPath, err
	}

	return appPath, nil
}

func makePythoncode(name, url, method string, parameters, optionalQueries []string) string {
	method = strings.ToLower(method)
	queryString := ""
	queryData := ""

	// FIXME - this might break - need to check if ? or & should be set as query
	parameterData := ""
	if len(optionalQueries) > 0 {
		queryString += ", "
		for _, query := range optionalQueries {
			queryString += fmt.Sprintf("%s=\"\"", query)
			queryData += fmt.Sprintf(`
        if %s:
            url += f"&%s={%s}"`, query, query, query)
		}
	}

	if len(parameters) > 0 {
		parameterData = fmt.Sprintf(", %s", strings.Join(parameters, ", "))
	}

	// FIXME - add checks for query data etc
	data := fmt.Sprintf(`    async def %s_%s(self%s%s):
        url=f"%s"
        %s
        return requests.%s(url).text
	`, name, method, parameterData, queryString, url, queryData, method)

	return data
}

func generateYaml(swagger *openapi3.Swagger) (WorkflowApp, []string, error) {
	api := WorkflowApp{}
	log.Printf("%#v", swagger.Info)

	if len(swagger.Info.Title) == 0 {
		return WorkflowApp{}, []string{}, errors.New("Swagger.Info.Title can't be empty.")
	}

	if len(swagger.Servers) == 0 {
		return WorkflowApp{}, []string{}, errors.New("Swagger.Servers can't be empty. Add 'servers':[{'url':'hostname.com'}'")
	}

	api.Name = swagger.Info.Title
	api.Description = swagger.Info.Description
	api.IsValid = true
	api.Link = swagger.Servers[0].URL // host does not exist lol
	api.AppVersion = "1.0.0"
	api.Environment = "cloud"
	api.ID = ""
	api.SmallImage = ""
	api.LargeImage = ""

	// This is the python code to be generated
	// Could just as well be go at this point lol
	pythonFunctions := []string{}

	for actualPath, path := range swagger.Paths {
		//log.Printf("%#v", path)
		//log.Printf("%#v", actualPath)
		// Find the path name and add it to makeCode() param

		firstQuery := true
		if path.Get != nil {
			// What to do with this, hmm
			functionName := strings.ReplaceAll(path.Get.Summary, " ", "_")
			functionName = strings.ToLower(functionName)

			action := WorkflowAppAction{
				Description: path.Get.Description,
				Name:        path.Get.Summary,
				NodeType:    "action",
				Environment: api.Environment,
				Parameters:  []WorkflowAppActionParameter{},
			}

			action.Returns.Schema.Type = "string"
			baseUrl := fmt.Sprintf("%s%s", api.Link, actualPath)

			//log.Println(path.Parameters)

			// Parameters:  []WorkflowAppActionParameter{},
			// FIXME - add data for POST stuff
			firstQuery = true
			optionalQueries := []string{}
			parameters := []string{}
			optionalParameters := []WorkflowAppActionParameter{}
			if len(path.Get.Parameters) > 0 {
				for _, param := range path.Get.Parameters {
					curParam := WorkflowAppActionParameter{
						Name:        param.Value.Name,
						Description: param.Value.Description,
						Multiline:   false,
						Required:    param.Value.Required,
						Schema: SchemaDefinition{
							Type: param.Value.Schema.Value.Type,
						},
					}

					if param.Value.Required {
						action.Parameters = append(action.Parameters, curParam)
					} else {
						optionalParameters = append(optionalParameters, curParam)
					}

					if param.Value.In == "path" {
						log.Printf("PATH!: %s", param.Value.Name)
						parameters = append(parameters, param.Value.Name)
						//baseUrl = fmt.Sprintf("%s%s", baseUrl)
					} else if param.Value.In == "query" {
						log.Printf("QUERY!: %s", param.Value.Name)
						if !param.Value.Required {
							optionalQueries = append(optionalQueries, param.Value.Name)
							continue
						}

						parameters = append(parameters, param.Value.Name)

						if firstQuery {
							baseUrl = fmt.Sprintf("%s?%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
							firstQuery = false
						} else {
							baseUrl = fmt.Sprintf("%s&%s={%s}", baseUrl, param.Value.Name, param.Value.Name)
							firstQuery = false
						}
					}

				}
			}

			// ensuring that they end up last in the specification
			// (order is ish important for optional params) - they need to be last.
			for _, optionalParam := range optionalParameters {
				action.Parameters = append(action.Parameters, optionalParam)
			}

			curCode := makePythoncode(functionName, baseUrl, "get", parameters, optionalQueries)
			pythonFunctions = append(pythonFunctions, curCode)

			api.Actions = append(api.Actions, action)
		}
	}

	return api, pythonFunctions, nil
}

func verifyApi(api WorkflowApp) WorkflowApp {
	if api.AppVersion == "" {
		api.AppVersion = "1.0.0"
	}

	return api
}

func dumpPython(basePath, name, version string, pythonFunctions []string) error {
	//log.Printf("%#v", api)
	log.Printf(strings.Join(pythonFunctions, "\n"))

	parsedCode := fmt.Sprintf(`import requests
import asyncio
import json

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
    asyncio.run(CarbonBlack.run(), debug=True)
`, name, version, name, strings.Join(pythonFunctions, "\n"))

	err := ioutil.WriteFile(fmt.Sprintf("%s/src/app.py", basePath), []byte(parsedCode), os.ModePerm)
	if err != nil {
		return err
	}
	fmt.Println(parsedCode)

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

func main() {
	data := []byte(`{"swagger":"3.0","info":{"title":"hi","description":"you","version":"1.0"},"servers":[{"url":"https://shuffler.io/api/v1"}],"host":"shuffler.io","basePath":"/api/v1","schemes":["https:"],"paths":{"/workflows":{"get":{"responses":{"default":{"description":"default","schema":{}}},"summary":"Get workflows","description":"Get workflows","parameters":[]}},"/workflows/{id}":{"get":{"responses":{"default":{"description":"default","schema":{}}},"summary":"Get workflow","description":"Get workflow","parameters":[{"in":"query","name":"forgetme","description":"Generated by shuffler.io OpenAPI","required":true,"schema":{"type":"string"}},{"in":"query","name":"anotherone","description":"Generated by shuffler.io OpenAPI","required":false,"schema":{"type":"string"}},{"in":"query","name":"hi","description":"Generated by shuffler.io OpenAPI","required":true,"schema":{"type":"string"}},{"in":"path","name":"id","description":"Generated by shuffler.io OpenAPI","required":true,"schema":{"type":"string"}}]}}},"securityDefinitions":{}}`)

	hasher := md5.New()
	hasher.Write(data)
	newmd5 := hex.EncodeToString(hasher.Sum(nil))

	swagger, err := openapi3.NewSwaggerLoader().LoadSwaggerFromData(data)
	if err != nil {
		log.Printf("Swagger validation error: %s", err)
		os.Exit(3)
	}

	if strings.Contains(swagger.Info.Title, " ") {
		strings.ReplaceAll(swagger.Info.Title, " ", "")
	}

	basePath, err := buildStructure(swagger, newmd5)
	if err != nil {
		log.Printf("Failed to build base structure: %s", err)
		os.Exit(3)
	}

	api, pythonfunctions, err := generateYaml(swagger)
	if err != nil {
		log.Printf("Failed building and generating yaml: %s", err)
		os.Exit(3)
	}

	err = dumpApi(basePath, api)
	if err != nil {
		log.Printf("Failed dumping yaml: %s", err)
		os.Exit(3)
	}

	err = dumpPython(basePath, swagger.Info.Title, swagger.Info.Version, pythonfunctions)
	if err != nil {
		log.Printf("Failed dumping python: %s", err)
		os.Exit(3)
	}
}
