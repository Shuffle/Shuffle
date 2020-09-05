package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	//"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	dockerclient "github.com/docker/docker/client"
)

var environment = os.Getenv("ENVIRONMENT_NAME")
var baseUrl = os.Getenv("BASE_URL")
var baseimagename = "frikky/shuffle"
var sleepTime = 2

var containerId string

// form container id of current running container
func getThisContainerId() string {
	id := ""
	cmd := fmt.Sprintf("cat /proc/self/cgroup | grep memory | tail -1 | cut -d/ -f3")
	out, err := exec.Command("bash", "-c", cmd).Output()
	if err == nil {
		id = strings.TrimSpace(string(out))
	}

	return id
}

func init() {
	containerId = getThisContainerId()
	if len(containerId) == 0 {
		log.Printf("[ERROR] No container ID found.")
	} else {
		log.Printf("[INFO] Found container ID: %s", containerId)
	}
}

type User struct {
	Username          string        `datastore:"Username" json:"username"`
	Password          string        `datastore:"password,noindex" password:"password,omitempty"`
	Session           string        `datastore:"session,noindex" json:"session"`
	Verified          bool          `datastore:"verified,noindex" json:"verified"`
	PrivateApps       []WorkflowApp `datastore:"privateapps" json:"privateapps":`
	Role              string        `datastore:"role" json:"role"`
	Roles             []string      `datastore:"roles" json:"roles"`
	VerificationToken string        `datastore:"verification_token" json:"verification_token"`
	ApiKey            string        `datastore:"apikey" json:"apikey"`
	ResetReference    string        `datastore:"reset_reference" json:"reset_reference"`
	ResetTimeout      int64         `datastore:"reset_timeout,noindex" json:"reset_timeout"`
	Id                string        `datastore:"id" json:"id"`
	Orgs              []string      `datastore:"orgs" json:"orgs"`
	CreationTime      int64         `datastore:"creation_time" json:"creation_time"`
	Active            bool          `datastore:"active" json:"active"`
}

type ExecutionRequest struct {
	ExecutionId       string   `json:"execution_id"`
	ExecutionArgument string   `json:"execution_argument"`
	ExecutionSource   string   `json:"execution_source"`
	WorkflowId        string   `json:"workflow_id"`
	Environments      []string `json:"environments"`
	Authorization     string   `json:"authorization"`
	Status            string   `json:"status"`
	Start             string   `json:"start"`
	Type              string   `json:"type"`
}

type Org struct {
	Name  string `json:"name"`
	Org   string `json:"org"`
	Users []User `json:"users"`
	Id    string `json:"id"`
}

type AppAuthenticationStorage struct {
	Active        bool                  `json:"active" datastore:"active"`
	Label         string                `json:"label" datastore:"label"`
	Id            string                `json:"id" datastore:"id"`
	App           WorkflowApp           `json:"app" datastore:"app"`
	Fields        []AuthenticationStore `json:"fields" datastore:"fields"`
	Usage         []AuthenticationUsage `json:"usage" datastore:"usage"`
	WorkflowCount int64                 `json:"workflow_count" datastore:"workflow_count"`
	NodeCount     int64                 `json:"node_count" datastore:"node_count"`
}

type AuthenticationUsage struct {
	WorkflowId string   `json:"workflow_id" datastore:"workflow_id"`
	Nodes      []string `json:"nodes" datastore:"nodes"`
}

// An app inside Shuffle
type WorkflowApp struct {
	Name        string `json:"name" yaml:"name" required:true datastore:"name"`
	IsValid     bool   `json:"is_valid" yaml:"is_valid" required:true datastore:"is_valid"`
	ID          string `json:"id" yaml:"id,omitempty" required:false datastore:"id"`
	Link        string `json:"link" yaml:"link" required:false datastore:"link,noindex"`
	AppVersion  string `json:"app_version" yaml:"app_version" required:true datastore:"app_version"`
	Generated   bool   `json:"generated" yaml:"generated" required:false datastore:"generated"`
	Downloaded  bool   `json:"downloaded" yaml:"downloaded" required:false datastore:"downloaded"`
	Sharing     bool   `json:"sharing" yaml:"sharing" required:false datastore:"sharing"`
	Verified    bool   `json:"verified" yaml:"verified" required:false datastore:"verified"`
	Activated   bool   `json:"activated" yaml:"activated" required:false datastore:"activated"`
	Tested      bool   `json:"tested" yaml:"tested" required:false datastore:"tested"`
	Owner       string `json:"owner" datastore:"owner" yaml:"owner"`
	Hash        string `json:"hash" datastore:"hash" yaml:"hash"` // api.yaml+dockerfile+src/app.py for apps
	PrivateID   string `json:"private_id" yaml:"private_id" required:false datastore:"private_id"`
	Description string `json:"description" datastore:"description,noindex" required:false yaml:"description"`
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

type WorkflowAppActionParameter struct {
	Description   string           `json:"description" datastore:"description" yaml:"description"`
	ID            string           `json:"id" datastore:"id" yaml:"id,omitempty"`
	Name          string           `json:"name" datastore:"name" yaml:"name"`
	Example       string           `json:"example" datastore:"example" yaml:"example"`
	Value         string           `json:"value" datastore:"value" yaml:"value,omitempty"`
	Multiline     bool             `json:"multiline" datastore:"multiline" yaml:"multiline"`
	ActionField   string           `json:"action_field" datastore:"action_field" yaml:"actionfield,omitempty"`
	Variant       string           `json:"variant" datastore:"variant" yaml:"variant,omitempty"`
	Required      bool             `json:"required" datastore:"required" yaml:"required"`
	Configuration bool             `json:"configuration" datastore:"configuration" yaml:"configuration"`
	Schema        SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
}

type SchemaDefinition struct {
	Type string `json:"type" datastore:"type"`
}

type WorkflowAppAction struct {
	Description       string                       `json:"description" datastore:"description"`
	ID                string                       `json:"id" datastore:"id" yaml:"id,omitempty"`
	Name              string                       `json:"name" datastore:"name"`
	Label             string                       `json:"label" datastore:"label"`
	NodeType          string                       `json:"node_type" datastore:"node_type"`
	Environment       string                       `json:"environment" datastore:"environment"`
	Sharing           bool                         `json:"sharing" datastore:"sharing"`
	PrivateID         string                       `json:"private_id" datastore:"private_id"`
	AppID             string                       `json:"app_id" datastore:"app_id"`
	Authentication    []AuthenticationStore        `json:"authentication" datastore:"authentication" yaml:"authentication,omitempty"`
	Tested            bool                         `json:"tested" datastore:"tested" yaml:"tested"`
	Parameters        []WorkflowAppActionParameter `json:"parameters" datastore: "parameters"`
	ExecutionVariable struct {
		Description string `json:"description" datastore:"description"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value"`
	} `json:"execution_variable" datastore:"execution_variables"`
	Returns struct {
		Description string           `json:"description" datastore:"returns" yaml:"description,omitempty"`
		Example     string           `json:"example" datastore:"example" yaml:"example"`
		ID          string           `json:"id" datastore:"id" yaml:"id,omitempty"`
		Schema      SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
	} `json:"returns" datastore:"returns"`
	AuthenticationId string `json:"authentication_id" datastore:"authentication_id"`
	Example          string `json:"example" datastore:"example" yaml:"example"`
	AuthNotRequired  bool   `json:"auth_not_required" datastore:"auth_not_required" yaml:"auth_not_required"`
}

// FIXME: Generate a callback authentication ID?
type WorkflowExecution struct {
	Type               string         `json:"type" datastore:"type"`
	Status             string         `json:"status" datastore:"status"`
	Start              string         `json:"start" datastore:"start"`
	ExecutionArgument  string         `json:"execution_argument" datastore:"execution_argument"`
	ExecutionId        string         `json:"execution_id" datastore:"execution_id"`
	ExecutionSource    string         `json:"execution_source" datastore:"execution_source"`
	WorkflowId         string         `json:"workflow_id" datastore:"workflow_id"`
	LastNode           string         `json:"last_node" datastore:"last_node"`
	Authorization      string         `json:"authorization" datastore:"authorization"`
	Result             string         `json:"result" datastore:"result,noindex"`
	StartedAt          int64          `json:"started_at" datastore:"started_at"`
	CompletedAt        int64          `json:"completed_at" datastore:"completed_at"`
	ProjectId          string         `json:"project_id" datastore:"project_id"`
	Locations          []string       `json:"locations" datastore:"locations"`
	Workflow           Workflow       `json:"workflow" datastore:"workflow,noindex"`
	Results            []ActionResult `json:"results" datastore:"results,noindex"`
	ExecutionVariables []struct {
		Description string `json:"description" datastore:"description"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value"`
	} `json:"execution_variables,omitempty" datastore:"execution_variables,omitempty"`
}

// This is for the nodes in a workflow, NOT the app action itself.
type Action struct {
	AppName           string                       `json:"app_name" datastore:"app_name"`
	AppVersion        string                       `json:"app_version" datastore:"app_version"`
	AppID             string                       `json:"app_id" datastore:"app_id"`
	Errors            []string                     `json:"errors" datastore:"errors"`
	ID                string                       `json:"id" datastore:"id"`
	IsValid           bool                         `json:"is_valid" datastore:"is_valid"`
	IsStartNode       bool                         `json:"isStartNode" datastore:"isStartNode"`
	Sharing           bool                         `json:"sharing" datastore:"sharing"`
	PrivateID         string                       `json:"private_id" datastore:"private_id"`
	Label             string                       `json:"label" datastore:"label"`
	SmallImage        string                       `json:"small_image" datastore:"small_image,noindex" required:false yaml:"small_image"`
	LargeImage        string                       `json:"large_image" datastore:"large_image,noindex" yaml:"large_image" required:false`
	Environment       string                       `json:"environment" datastore:"environment"`
	Name              string                       `json:"name" datastore:"name"`
	Parameters        []WorkflowAppActionParameter `json:"parameters" datastore: "parameters,noindex"`
	ExecutionVariable struct {
		Description string `json:"description" datastore:"description"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value"`
	} `json:"execution_variable,omitempty" datastore:"execution_variable,omitempty"`
	Position struct {
		X float64 `json:"x" datastore:"x"`
		Y float64 `json:"y" datastore:"y"`
	} `json:"position"`
	Priority         int    `json:"priority" datastore:"priority"`
	AuthenticationId string `json:"authentication_id" datastore:"authentication_id"`
	Example          string `json:"example" datastore:"example"`
	AuthNotRequired  bool   `json:"auth_not_required" datastore:"auth_not_required" yaml:"auth_not_required"`
}

// Added environment for location to execute
type Trigger struct {
	AppName         string                       `json:"app_name" datastore:"app_name"`
	Description     string                       `json:"description" datastore:"description"`
	LongDescription string                       `json:"long_description" datastore:"long_description"`
	Status          string                       `json:"status" datastore:"status"`
	AppVersion      string                       `json:"app_version" datastore:"app_version"`
	Errors          []string                     `json:"errors" datastore:"errors"`
	ID              string                       `json:"id" datastore:"id"`
	IsValid         bool                         `json:"is_valid" datastore:"is_valid"`
	IsStartNode     bool                         `json:"isStartNode" datastore:"isStartNode"`
	Label           string                       `json:"label" datastore:"label"`
	SmallImage      string                       `json:"small_image" datastore:"small_image,noindex" required:false yaml:"small_image"`
	LargeImage      string                       `json:"large_image" datastore:"large_image,noindex" yaml:"large_image" required:false`
	Environment     string                       `json:"environment" datastore:"environment"`
	TriggerType     string                       `json:"trigger_type" datastore:"trigger_type"`
	Name            string                       `json:"name" datastore:"name"`
	Parameters      []WorkflowAppActionParameter `json:"parameters" datastore: "parameters,noindex"`
	Position        struct {
		X float64 `json:"x" datastore:"x"`
		Y float64 `json:"y" datastore:"y"`
	} `json:"position"`
	Priority int `json:"priority" datastore:"priority"`
}

type Branch struct {
	DestinationID string      `json:"destination_id" datastore:"destination_id"`
	ID            string      `json:"id" datastore:"id"`
	SourceID      string      `json:"source_id" datastore:"source_id"`
	Label         string      `json:"label" datastore:"label"`
	HasError      bool        `json:"has_errors" datastore: "has_errors"`
	Conditions    []Condition `json:"conditions" datastore: "conditions"`
}

// Same format for a lot of stuff
type Condition struct {
	Condition   WorkflowAppActionParameter `json:"condition" datastore:"condition"`
	Source      WorkflowAppActionParameter `json:"source" datastore:"source"`
	Destination WorkflowAppActionParameter `json:"destination" datastore:"destination"`
}

type Schedule struct {
	Name              string `json:"name" datastore:"name"`
	Frequency         string `json:"frequency" datastore:"frequency"`
	ExecutionArgument string `json:"execution_argument" datastore:"execution_argument"`
	Id                string `json:"id" datastore:"id"`
}

type Workflow struct {
	Actions       []Action   `json:"actions" datastore:"actions,noindex"`
	Branches      []Branch   `json:"branches" datastore:"branches,noindex"`
	Triggers      []Trigger  `json:"triggers" datastore:"triggers,noindex"`
	Schedules     []Schedule `json:"schedules" datastore:"schedules,noindex"`
	Configuration struct {
		ExitOnError  bool `json:"exit_on_error" datastore:"exit_on_error"`
		StartFromTop bool `json:"start_from_top" datastore:"start_from_top"`
	} `json:"configuration,omitempty" datastore:"configuration"`
	Errors            []string `json:"errors,omitempty" datastore:"errors"`
	Tags              []string `json:"tags,omitempty" datastore:"tags"`
	ID                string   `json:"id" datastore:"id"`
	IsValid           bool     `json:"is_valid" datastore:"is_valid"`
	Name              string   `json:"name" datastore:"name"`
	Description       string   `json:"description" datastore:"description"`
	Start             string   `json:"start" datastore:"start"`
	Owner             string   `json:"owner" datastore:"owner"`
	Sharing           string   `json:"sharing" datastore:"sharing"`
	Org               []Org    `json:"org,omitempty" datastore:"org"`
	ExecutingOrg      Org      `json:"execution_org,omitempty" datastore:"execution_org"`
	WorkflowVariables []struct {
		Description string `json:"description" datastore:"description"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value"`
	} `json:"workflow_variables" datastore:"workflow_variables"`
	ExecutionVariables []struct {
		Description string `json:"description" datastore:"description"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value"`
	} `json:"execution_variables,omitempty" datastore:"execution_variables"`
}

type ActionResult struct {
	Action        Action `json:"action" datastore:"action"`
	ExecutionId   string `json:"execution_id" datastore:"execution_id"`
	Authorization string `json:"authorization" datastore:"authorization"`
	Result        string `json:"result" datastore:"result,noindex"`
	StartedAt     int64  `json:"started_at" datastore:"started_at"`
	CompletedAt   int64  `json:"completed_at" datastore:"completed_at"`
	Status        string `json:"status" datastore:"status"`
}

type Authentication struct {
	Required   bool                   `json:"required" datastore:"required" yaml:"required" `
	Parameters []AuthenticationParams `json:"parameters" datastore:"parameters" yaml:"parameters"`
}

type AuthenticationParams struct {
	Description string           `json:"description" datastore:"description" yaml:"description"`
	ID          string           `json:"id" datastore:"id" yaml:"id"`
	Name        string           `json:"name" datastore:"name" yaml:"name"`
	Example     string           `json:"example" datastore:"example" yaml:"example"`
	Value       string           `json:"value,omitempty" datastore:"value" yaml:"value"`
	Multiline   bool             `json:"multiline" datastore:"multiline" yaml:"multiline"`
	Required    bool             `json:"required" datastore:"required" yaml:"required"`
	In          string           `json:"in" datastore:"in" yaml:"in"`
	Schema      SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
	Scheme      string           `json:"scheme" datastore:"scheme" yaml:"scheme"` // Deprecated
}

type AuthenticationStore struct {
	Key   string `json:"key" datastore:"key"`
	Value string `json:"value" datastore:"value"`
}

type ExecutionRequestWrapper struct {
	Data []ExecutionRequest `json:"data"`
}

// removes every container except itself (worker)
func shutdown(executionId, workflowId string) {
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client: %s", err)
		os.Exit(3)
	}

	containerOptions := types.ContainerListOptions{
		All: true,
	}

	containers, err := dockercli.ContainerList(context.Background(), containerOptions)
	if err != nil {
		panic(err)
	}
	_ = containers

	for _, container := range containers {
		for _, name := range container.Names {
			if strings.Contains(name, executionId) {
				// FIXME - reinstate - not here for debugging
				//err = removeContainer(container.ID)
				//if err != nil {
				//	log.Printf("Failed removing %s before shutdown.", name)
				//}

				break
			}
		}

	}

	fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/executions/%s/abort", baseUrl, workflowId, executionId)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Println("[INFO] Failed building request: %s", err)
	}

	// FIXME: Add an API call to the backend
	authorization := os.Getenv("AUTHORIZATION")
	if len(authorization) > 0 {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authorization))
	} else {
		log.Printf("[ERROR] No authorization specified for abort")
	}

	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{
		Transport: &http.Transport{
			Proxy: nil,
		},
	}

	httpProxy := os.Getenv("HTTP_PROXY")
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if (len(httpProxy) > 0 || len(httpsProxy) > 0) && baseUrl != "http://shuffle-backend:5001" {
		client = &http.Client{}
	} else {
		if len(httpProxy) > 0 {
			log.Printf("[INFO] Running with HTTP proxy %s (env: HTTP_PROXY)", httpProxy)
		}
		if len(httpsProxy) > 0 {
			log.Printf("[INFO] Running with HTTPS proxy %s (env: HTTPS_PROXY)", httpsProxy)
		}
	}
	_, err = client.Do(req)
	if err != nil {
		log.Printf("[INFO] Failed abort request: %s", err)
	}

	log.Printf("[INFO] Finished shutdown.")
	os.Exit(3)
}

// Deploys the internal worker whenever something happens
func deployApp(cli *dockerclient.Client, image string, identifier string, env []string) error {
	// form basic hostConfig
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type:   "json-file",
			Config: map[string]string{},
		},
	}

	// form container id and use it as network source if it's not empty
	if containerId != "" {
		hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:%s", containerId))
	} else {
		log.Printf("[WARNING] Empty self container id, continue without NetworkMode")
	}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	cont, err := cli.ContainerCreate(
		context.Background(),
		config,
		hostConfig,
		nil,
		nil,
		identifier,
	)

	if err != nil {
		log.Printf("Container error: %s", err)
		return err
	}

	cli.ContainerStart(context.Background(), cont.ID, types.ContainerStartOptions{})
	log.Printf("[INFO] Container %s is created", cont.ID)
	return nil
}

func removeContainer(containername string) error {
	ctx := context.Background()

	cli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[INFO] Unable to create docker client: %s", err)
		return err
	}

	// FIXME - ucnomment
	//	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
	//		All: true,
	//	})

	_ = ctx
	_ = cli
	//if err := cli.ContainerStop(ctx, containername, nil); err != nil {
	//	log.Printf("Unable to stop container %s - running removal anyway, just in case: %s", containername, err)
	//}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	// FIXME - remove comments etc
	_ = removeOptions
	//if err := cli.ContainerRemove(ctx, containername, removeOptions); err != nil {
	//	log.Printf("Unable to remove container: %s", err)
	//}

	return nil
}

func runFilter(workflowExecution WorkflowExecution, action Action) {
	// 1. Get the parameter $.#.id
	if action.Label == "filter_cases" && len(action.Parameters) > 0 {
		if action.Parameters[0].Variant == "ACTION_RESULT" {
			param := action.Parameters[0]
			value := param.Value
			_ = value

			// Loop cases.. Hmm, that's tricky
		}
	} else {
		log.Printf("No handler for filter %s with %d params", action.Label, len(action.Parameters))
	}

}

func handleExecution(client *http.Client, req *http.Request, workflowExecution WorkflowExecution) error {
	// if no onprem runs (shouldn't happen, but extra check), exit
	// if there are some, load the images ASAP for the app
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
	}

	onpremApps := []string{}
	startAction := workflowExecution.Start
	if len(startAction) == 0 {
		log.Printf("Didn't find execution start action. Setting it to workflow start action.")
		startAction = workflowExecution.Workflow.Start
	}

	log.Printf("Startaction: %s", startAction)
	toExecuteOnprem := []string{}
	parents := map[string][]string{}
	children := map[string][]string{}

	// source = parent node, dest = child node
	// parent can have more children, child can have more parents
	for _, branch := range workflowExecution.Workflow.Branches {
		// Check what the parent is first. If it's trigger - skip
		sourceFound := false
		destinationFound := false
		for _, action := range workflowExecution.Workflow.Actions {
			if action.ID == branch.SourceID {
				sourceFound = true
			}

			if action.ID == branch.DestinationID {
				destinationFound = true
			}
		}

		if sourceFound {
			parents[branch.DestinationID] = append(parents[branch.DestinationID], branch.SourceID)
		} else {
			log.Printf("ID %s was not found in actions! Skipping parent. (TRIGGER?)", branch.SourceID)
		}

		if destinationFound {
			children[branch.SourceID] = append(children[branch.SourceID], branch.DestinationID)
		} else {
			log.Printf("ID %s was not found in actions! Skipping child. (TRIGGER?)", branch.SourceID)
		}
	}

	log.Printf("Actions: %d", len(workflowExecution.Workflow.Actions))
	for _, action := range workflowExecution.Workflow.Actions {
		if action.Environment != environment {
			continue
		}

		toExecuteOnprem = append(toExecuteOnprem, action.ID)
		actionName := fmt.Sprintf("%s:%s_%s", baseimagename, action.AppName, action.AppVersion)
		found := false
		for _, app := range onpremApps {
			if actionName == app {
				found = true
			}
		}

		if !found {
			onpremApps = append(onpremApps, actionName)
		}
	}

	if len(onpremApps) == 0 {
		return errors.New(fmt.Sprintf("No apps to handle onprem (%s)", environment))
	}

	pullOptions := types.ImagePullOptions{}
	_ = pullOptions
	for _, image := range onpremApps {
		log.Printf("Image: %s", image)
		// Kind of gambling that the image exists.
		if strings.Contains(image, " ") {
			image = strings.ReplaceAll(image, " ", "-")
		}

		// FIXME: Reimplement for speed later
		// Skip to make it faster
		//reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
		//if err != nil {
		//	log.Printf("Failed getting %s. The app is missing or some other issue", image)
		//	shutdown(workflowExecution.ExecutionId)
		//}

		////io.Copy(os.Stdout, reader)
		//_ = reader
		//log.Printf("Successfully downloaded and built %s", image)
	}

	// Process the parents etc. How?
	visited := []string{}
	executed := []string{}
	nextActions := []string{startAction}
	firstIteration := true
	for {
		queueNodes := []string{}

		if len(workflowExecution.Results) == 0 {
			nextActions = []string{startAction}
		} else if firstIteration {
			firstIteration = false
		} else {
			// This is to re-check the nodes that exist and whether they should continue
			appendActions := []string{}
			for _, item := range workflowExecution.Results {

				// FIXME: Check whether the item should be visited or not
				// Do the same check as in walkoff.go - are the parents done?
				// If skipped and both parents are skipped: keep as skipped, otherwise queue
				if item.Status == "SKIPPED" {
					isSkipped := true

					for _, branch := range workflowExecution.Workflow.Branches {
						// 1. Finds branches where the destination is our node
						// 2. Finds results of those branches, and sees the status
						// 3. If the status isn't skipped or failure, then it will still run this node
						if branch.DestinationID == item.Action.ID {
							for _, subresult := range workflowExecution.Results {
								if subresult.Action.ID == branch.SourceID {
									if subresult.Status != "SKIPPED" && subresult.Status != "FAILURE" {
										log.Printf("\n\n\nSUBRESULT PARENT STATUS: %s\n\n\n", subresult.Status)
										isSkipped = false

										break
									}
								}
							}
						}
					}

					if isSkipped {
						//log.Printf("Skipping %s as all parents are done", item.Action.Label)
						if !arrayContains(visited, item.Action.ID) {
							log.Printf("Adding visited (1): %s", item.Action.Label)
							visited = append(visited, item.Action.ID)
						}
					} else {
						log.Printf("Continuing %s as all parents are NOT done", item.Action.Label)
						appendActions = append(appendActions, item.Action.ID)
					}
				} else {
					if item.Status == "FINISHED" {
						log.Printf("Adding visited (2): %s", item.Action.Label)
						visited = append(visited, item.Action.ID)
					}
				}

				nextActions = children[item.Action.ID]
				if len(appendActions) > 0 {
					log.Printf("APPENDED NODES: %#v", appendActions)
					nextActions = append(nextActions, appendActions...)
				}
			}
		}

		// This is a backup in case something goes wrong in this complex hellhole.
		// Max default execution time is 5 minutes for now anyway, which should take
		// care if it gets stuck in a loop.
		// FIXME: Force killing a worker should result in a notification somewhere
		if len(nextActions) == 0 {
			log.Printf("No next action. Finished? Result vs Actions: %d - %d", len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
			if len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions) {
				shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
			}

			// Look for the NEXT missing action
			notFound := []string{}
			for _, action := range workflowExecution.Workflow.Actions {
				found := false
				for _, result := range workflowExecution.Results {
					if action.ID == result.Action.ID {
						found = true
						break
					}
				}

				if !found {
					notFound = append(notFound, action.ID)
				}
			}

			//log.Printf("SOMETHING IS MISSING!: %#v", notFound)
			for _, item := range notFound {
				if arrayContains(executed, item) {
					log.Printf("%s has already executed but no result!", item)
					continue
				}

				// Visited means it's been touched in any way.
				outerIndex := -1
				for index, visit := range visited {
					if visit == item {
						outerIndex = index
						break
					}
				}

				if outerIndex >= 0 {
					log.Printf("Removing index %s from visited")
					visited = append(visited[:outerIndex], visited[outerIndex+1:]...)
				}

				fixed := 0
				for _, parent := range parents[item] {
					parentResult := getResult(workflowExecution, parent)
					if parentResult.Status == "FINISHED" || parentResult.Status == "SUCCESS" || parentResult.Status == "SKIPPED" || parentResult.Status == "FAILURE" {
						fixed += 1
					}
				}

				if fixed == len(parents[item]) {
					nextActions = append(nextActions, item)
				}

				// If it's not executed and not in nextActions
				// FIXME: Check if the item's parents are finished. If they're not, skip.
			}
		}

		for _, node := range nextActions {
			nodeChildren := children[node]
			for _, child := range nodeChildren {
				if !arrayContains(queueNodes, child) {
					queueNodes = append(queueNodes, child)
				}
			}
		}
		//log.Printf("NEXT: %s", nextActions)
		//log.Printf("queueNodes: %s", queueNodes)

		// IF NOT VISITED && IN toExecuteOnPrem
		// SKIP if it's not onprem
		for _, nextAction := range nextActions {
			action := getAction(workflowExecution, nextAction)

			// check visited and onprem
			if arrayContains(visited, nextAction) {
				log.Printf("ALREADY VISITIED (%s): %s", action.Label, nextAction)
				continue
			}

			// Not really sure how this edgecase happens.

			// FIXME
			// Execute, as we don't really care if env is not set? IDK
			if action.Environment != environment { //&& action.Environment != "" {
				log.Printf("Bad environment for node: %s. Want %s", action.Environment, environment)
				continue
			}

			// check whether the parent is finished executing
			//log.Printf("%s has %d parents", nextAction, len(parents[nextAction]))

			continueOuter := true
			if action.IsStartNode {
				continueOuter = false
			} else if len(parents[nextAction]) > 0 {
				// FIXME - wait for parents to finishe executing
				fixed := 0
				for _, parent := range parents[nextAction] {
					parentResult := getResult(workflowExecution, parent)
					if parentResult.Status == "FINISHED" || parentResult.Status == "SUCCESS" || parentResult.Status == "SKIPPED" || parentResult.Status == "FAILURE" {
						fixed += 1
					}
				}

				if fixed == len(parents[nextAction]) {
					continueOuter = false
				}
			} else {
				continueOuter = false
			}

			if continueOuter {
				//log.Printf("Parents of %s aren't finished: %s", nextAction, strings.Join(parents[nextAction], ", "))
				//for _, tmpaction := range parents[nextAction] {
				//	action := getAction(workflowExecution, tmpaction)
				//	_ = action
				//	//log.Printf("Parent: %s", action.Label)
				//}
				// Find the result of the nodes?
				continue
			}

			// get action status
			actionResult := getResult(workflowExecution, nextAction)
			if actionResult.Action.ID == action.ID {
				log.Printf("%s already has status %s.", action.ID, actionResult.Status)
				continue
			} else {
				log.Printf("%s:%s has no status result yet. Should execute.", action.Name, action.ID)
			}

			appname := action.AppName
			appversion := action.AppVersion
			appname = strings.Replace(appname, ".", "-", -1)
			appversion = strings.Replace(appversion, ".", "-", -1)

			image := fmt.Sprintf("%s:%s_%s", baseimagename, action.AppName, action.AppVersion)
			if strings.Contains(image, " ") {
				image = strings.ReplaceAll(image, " ", "-")
			}

			identifier := fmt.Sprintf("%s_%s_%s_%s", appname, appversion, action.ID, workflowExecution.ExecutionId)
			if strings.Contains(identifier, " ") {
				identifier = strings.ReplaceAll(identifier, " ", "-")
			}

			// FIXME - check whether it's running locally yet too
			stats, err := dockercli.ContainerInspect(context.Background(), identifier)
			if err != nil || stats.ContainerJSONBase.State.Status != "running" {
				// REMOVE
				if err == nil {
					log.Printf("Status: %s, should kill: %s", stats.ContainerJSONBase.State.Status, identifier)
					err = removeContainer(identifier)
					if err != nil {
						log.Printf("Error killing container: %s", err)
					}
				} else {
					//log.Printf("WHAT TO DO HERE?: %s", err)
				}
			} else if stats.ContainerJSONBase.State.Status == "running" {
				continue
			}

			if len(action.Parameters) == 0 {
				action.Parameters = []WorkflowAppActionParameter{}
			}

			if len(action.Errors) == 0 {
				action.Errors = []string{}
			}

			// marshal action and put it in there rofl
			log.Printf("Time to execute %s (%s) with app %s:%s, function %s, env %s with %d parameters.", action.ID, action.Label, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))

			actionData, err := json.Marshal(action)
			if err != nil {
				log.Printf("Failed unmarshalling action: %s", err)
				continue
			}

			if action.AppID == "0ca8887e-b4af-4e3e-887c-87e9d3bc3d3e" {
				log.Printf("\nShould run filter: %#v\n\n", action)
				runFilter(workflowExecution, action)
				continue
			}

			executionData, err := json.Marshal(workflowExecution)
			if err != nil {
				log.Printf("Failed marshalling executiondata: %s", err)
				executionData = []byte("")
			}

			// Sending full execution so that it won't have to load in every app
			// This might be an issue if they can read environments, but that's alright
			// if everything is generated during execution
			env := []string{
				fmt.Sprintf("ACTION=%s", string(actionData)),
				fmt.Sprintf("EXECUTIONID=%s", workflowExecution.ExecutionId),
				fmt.Sprintf("AUTHORIZATION=%s", workflowExecution.Authorization),
				fmt.Sprintf("CALLBACK_URL=%s", baseUrl),
				fmt.Sprintf("FULL_EXECUTION=%s", string(executionData)),
			}

			err = deployApp(dockercli, image, identifier, env)
			if err != nil {
				log.Printf("[ERROR] Failed deploying %s from image %s: %s", identifier, image, err)
				if strings.Contains(err.Error(), "No such image") {
					log.Printf("[ERROR] Image doesn't exist. Shutting down")
					shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
				}
			}

			log.Printf("Adding visited (3): %s", action.Label)

			visited = append(visited, action.ID)
			executed = append(executed, action.ID)

			// If children of action.ID are NOT in executed:
			// Remove them from visited.
			//log.Printf("EXECUTED: %#v", executed)
		}

		//log.Println(nextAction)
		//log.Println(startAction, children[startAction])

		// FIXME - new request here
		// FIXME - clean up stopped (remove) containers with this execution id
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("Failed making request: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("Failed reading body: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if newresp.StatusCode != 200 {
			log.Printf("Err: %s\nStatusCode: %d", string(body), newresp.StatusCode)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		err = json.Unmarshal(body, &workflowExecution)
		if err != nil {
			log.Printf("Failed workflowExecution unmarshal: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
		}

		log.Printf("Status: %s, Results: %d, actions: %d", workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
		if workflowExecution.Status != "EXECUTING" {
			log.Printf("Exiting as worker execution has status %s!", workflowExecution.Status)
			shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
		}

		if len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions) {
			shutdownCheck := true
			ctx := context.Background()
			for _, result := range workflowExecution.Results {
				if result.Status == "EXECUTING" {
					// Cleaning up executing stuff
					shutdownCheck = false
					// Check status

					containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
						All: true,
					})
					if err != nil {
						log.Printf("Failed listing containers: %s", err)
						continue
					}

					stopContainers := []string{}
					removeContainers := []string{}
					for _, container := range containers {
						for _, name := range container.Names {
							if !strings.Contains(name, result.Action.ID) {
								continue
							}

							if container.State != "running" {
								removeContainers = append(removeContainers, container.ID)
								stopContainers = append(stopContainers, container.ID)
							}
						}
					}

					// FIXME - add killing of apps with same execution ID too
					// FIXME - stahp
					//for _, containername := range stopContainers {
					//	if err := dockercli.ContainerStop(ctx, containername, nil); err != nil {
					//		log.Printf("Unable to stop container: %s", err)
					//	} else {
					//		log.Printf("Stopped container %s", containername)
					//	}
					//}

					removeOptions := types.ContainerRemoveOptions{
						RemoveVolumes: true,
						Force:         true,
					}

					_ = removeOptions

					// FIXME - this
					//for _, containername := range removeContainers {
					//	if err := dockercli.ContainerRemove(ctx, containername, removeOptions); err != nil {
					//		log.Printf("Unable to remove container: %s", err)
					//	} else {
					//		log.Printf("Removed container %s", containername)
					//	}
					//}

					//  FIXME - send POST request to kill the container
					log.Printf("Should remove (POST request) stopped containers")
					//ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
				}
			}

			if shutdownCheck {
				log.Println("BREAKING BECAUSE RESULTS IS SAME LENGTH AS ACTIONS. SHOULD CHECK ALL RESULTS FOR WHETHER THEY'RE DONE")
				shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
			}
		}
		time.Sleep(time.Duration(sleepTime) * time.Second)
	}

	return nil
}

func arrayContains(visited []string, id string) bool {
	found := false
	for _, item := range visited {
		if item == id {
			found = true
		}
	}

	return found
}

func getResult(workflowExecution WorkflowExecution, id string) ActionResult {
	for _, actionResult := range workflowExecution.Results {
		if actionResult.Action.ID == id {
			return actionResult
		}
	}

	return ActionResult{}
}

func getAction(workflowExecution WorkflowExecution, id string) Action {
	for _, action := range workflowExecution.Workflow.Actions {
		if action.ID == id {
			return action
		}
	}

	return Action{}
}

func runTestExecution(client *http.Client, workflowId, apikey string) (string, string) {
	fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute", baseUrl, workflowId)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Printf("Error building test request: %s", err)
		return "", ""
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apikey))
	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("Error running test request: %s", err)
		return "", ""
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body: %s", err)
		return "", ""
	}

	log.Printf("[INFO] Body: %s", string(body))
	var workflowExecution WorkflowExecution
	err = json.Unmarshal(body, &workflowExecution)
	if err != nil {
		log.Printf("Failed workflowExecution unmarshal: %s", err)
		return "", ""
	}

	return workflowExecution.Authorization, workflowExecution.ExecutionId
}

// Initial loop etc
func main() {
	log.Printf("[INFO] Setting up worker environment")
	sleepTime := 5

	client := &http.Client{
		Transport: &http.Transport{
			Proxy: nil,
		},
	}

	httpProxy := os.Getenv("HTTP_PROXY")
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if (len(httpProxy) > 0 || len(httpsProxy) > 0) && baseUrl != "http://shuffle-backend:5001" {
		client = &http.Client{}
	} else {
		if len(httpProxy) > 0 {
			log.Printf("Running with HTTP proxy %s (env: HTTP_PROXY)", httpProxy)
		}
		if len(httpsProxy) > 0 {
			log.Printf("Running with HTTPS proxy %s (env: HTTPS_PROXY)", httpsProxy)
		}
	}

	// WORKER_TESTING_WORKFLOW should be a workflow ID
	authorization := ""
	executionId := ""
	testing := os.Getenv("WORKER_TESTING_WORKFLOW")
	shuffle_apikey := os.Getenv("WORKER_TESTING_APIKEY")
	if len(testing) > 0 && len(shuffle_apikey) > 0 {
		// Execute a workflow and use that info
		log.Printf("[WARNING] Running test environment for worker by executing workflow %s", testing)
		authorization, executionId = runTestExecution(client, testing, shuffle_apikey)

		//os.Exit(3)
	} else {
		authorization = os.Getenv("AUTHORIZATION")
		executionId = os.Getenv("EXECUTIONID")
		log.Printf("Running normal execution with auth %s and ID %s", authorization, executionId)
	}

	if len(authorization) == 0 {
		log.Println("[INFO] No AUTHORIZATION key set in env")
		shutdown(executionId, "")
	}

	if len(executionId) == 0 {
		log.Println("[INFO] No EXECUTIONID key set in env")
		shutdown(executionId, "")
	}

	// FIXME - tmp
	data := fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, executionId, authorization)
	fullUrl := fmt.Sprintf("%s/api/v1/streams/results", baseUrl)
	req, err := http.NewRequest(
		"POST",
		fullUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		log.Println("[ERROR] Failed making request builder for backend")
		shutdown(executionId, "")
	}

	for {
		// Because of this, it always has updated data.
		// Removed request requirement from app_sdk
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("[ERROR] Failed request: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("[ERROR] Failed reading body: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if newresp.StatusCode != 200 {
			log.Printf("[ERROR] %s\nStatusCode: %d", string(body), newresp.StatusCode)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		var workflowExecution WorkflowExecution
		err = json.Unmarshal(body, &workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("[INFO] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			shutdown(executionId, workflowExecution.Workflow.ID)
		}

		if workflowExecution.Status == "EXECUTING" || workflowExecution.Status == "RUNNING" {
			//log.Printf("Status: %s", workflowExecution.Status)
			err = handleExecution(client, req, workflowExecution)
			if err != nil {
				log.Printf("[INFO] Workflow %s is finished: %s", workflowExecution.ExecutionId, err)
				shutdown(executionId, workflowExecution.Workflow.ID)
			}
		} else {
			log.Printf("[INFO] Workflow %s has status %s. Exiting worker.", workflowExecution.ExecutionId, workflowExecution.Status)
			shutdown(executionId, workflowExecution.Workflow.ID)
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}
