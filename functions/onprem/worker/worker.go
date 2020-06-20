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
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	network "github.com/docker/docker/api/types/network"
	dockerclient "github.com/docker/docker/client"
)

var environment = os.Getenv("ENVIRONMENT_NAME")
var baseUrl = os.Getenv("BASE_URL")
var baseimagename = "frikky/shuffle"
var sleepTime = 2

type Condition struct {
	AppName     string   `json:"app_name"`
	AppVersion  string   `json:"app_version"`
	Conditional string   `json:"conditional"`
	Errors      []string `json:"errors"`
	ID          string   `json:"id"`
	IsValid     bool     `json:"is_valid"`
	Label       string   `json:"label"`
	Name        string   `json:"name"`
	Position    struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
}

type User struct {
	Username string `datastore:"Username"`
	Password string `datastore:"password,noindex"`
	Session  string `datastore:"session,noindex"`
	Verified bool   `datastore:"verified,noindex"`
	ApiKey   string `datastore:"apikey,noindex"`
	Id       string `datastore:"id" json:"id"`
	Orgs     string `datastore:"orgs" json:"orgs"`
}

type Org struct {
	Name  string `json:"name"`
	Org   string `json:"org"`
	Users []User `json:"users"`
	Id    string `json:"id"`
}

type WorkflowExecution struct {
	Type               string         `json:"type" datastore:"type"`
	Status             string         `json:"status" datastore:"status"`
	Start              string         `json:"start" datastore:"start"`
	ExecutionArgument  string         `json:"execution_argument" datastore:"execution_argument"`
	ExecutionId        string         `json:"execution_id" datastore:"execution_id"`
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
	Priority int `json:"priority" datastore:"priority"`
}

type Branch struct {
	DestinationID string `json:"destination_id" datastore:"destination_id"`
	ID            string `json:"id" datastore:"id"`
	SourceID      string `json:"source_id" datastore:"source_id"`
	HasError      bool   `json:"has_errors" datastore: "has_errors"`
}

type Schedule struct {
	Name              string `json:"name" datastore:"name"`
	Frequency         string `json:"frequency" datastore:"frequency"`
	ExecutionArgument string `json:"execution_argument" datastore:"execution_argument"`
	Id                string `json:"id" datastore:"id"`
}

type Trigger struct {
	AppName     string                       `json:"app_name" datastore:"app_name"`
	Status      string                       `json:"status" datastore:"status"`
	AppVersion  string                       `json:"app_version" datastore:"app_version"`
	Errors      []string                     `json:"errors" datastore:"errors"`
	ID          string                       `json:"id" datastore:"id"`
	IsValid     bool                         `json:"is_valid" datastore:"is_valid"`
	IsStartNode bool                         `json:"isStartNode" datastore:"isStartNode"`
	Label       string                       `json:"label" datastore:"label"`
	SmallImage  string                       `json:"small_image" datastore:"small_image,noindex" required:false yaml:"small_image"`
	LargeImage  string                       `json:"large_image" datastore:"large_image,noindex" yaml:"large_image" required:false`
	Environment string                       `json:"environment" datastore:"environment"`
	TriggerType string                       `json:"trigger_type" datastore:"trigger_type"`
	Name        string                       `json:"name" datastore:"name"`
	Parameters  []WorkflowAppActionParameter `json:"parameters" datastore: "parameters"`
	Position    struct {
		X float64 `json:"x" datastore:"x"`
		Y float64 `json:"y" datastore:"y"`
	} `json:"position"`
	Priority int `json:"priority" datastore:"priority"`
}

type Workflow struct {
	Actions           []Action   `json:"actions" datastore:"actions,noindex"`
	Branches          []Branch   `json:"branches" datastore:"branches,noindex"`
	Triggers          []Trigger  `json:"triggers" datastore:"triggers,noindex"`
	Schedules         []Schedule `json:"schedules" datastore:"schedules,noindex"`
	Errors            []string   `json:"errors,omitempty" datastore:"errors"`
	Tags              []string   `json:"tags,omitempty" datastore:"tags"`
	ID                string     `json:"id" datastore:"id"`
	IsValid           bool       `json:"is_valid" datastore:"is_valid"`
	Name              string     `json:"name" datastore:"name"`
	Description       string     `json:"description" datastore:"description"`
	Start             string     `json:"start" datastore:"start"`
	Owner             string     `json:"owner" datastore:"owner"`
	Sharing           string     `json:"sharing" datastore:"sharing"`
	Org               []Org      `json:"org,omitempty" datastore:"org"`
	ExecutingOrg      Org        `json:"execution_org,omitempty" datastore:"execution_org"`
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
	} `json:"execution_variables,omitempty" datastore:"execution_variables,omitempty"`
}

type ActionResult struct {
	Action        Action `json:"action" datastore:"action"`
	ExecutionId   string `json:"execution_id" datastore:"execution_id"`
	Authorization string `json:"authorization" datastore:"authorization"`
	Result        string `json:"result" datastore:"result"`
	StartedAt     int64  `json:"started_at" datastore:"started_at"`
	CompletedAt   int64  `json:"completed_at" datastore:"completed_at"`
	Status        string `json:"status" datastore:"status"`
}

type WorkflowApp struct {
	Name        string `json:"name" yaml:"name" required:true datastore:"name"`
	IsValid     bool   `json:"is_valid" yaml:"is_valid" required:true datastore:"is_valid"`
	ID          string `json:"id" yaml:"id" required:false datastore:"id"`
	Link        string `json:"link" yaml:"link" required:false datastore:"link"`
	AppVersion  string `json:"app_version" yaml:"app_version" required:true datastore:"app_version"`
	Description string `json:"description" datastore:"description" required:false yaml:"description"`
	Environment string `json:"environment" datastore:"environment" required:true yaml:"environment"`
	ContactInfo struct {
		Name string `json:"name" datastore:"name" yaml:"name"`
		Url  string `json:"url" datastore:"url" yaml:"url"`
	} `json:"contact_info" datastore:"contact_info" yaml:"contact_info" required:false`
	Actions []WorkflowAppAction `json:"actions" yaml:"actions" required:true datastore:"actions"`
}

// Name = current field
// action_field is the field that it's set to
// value, if Variant = ACTION_RESULT = the second field thingy, which will be
type WorkflowAppActionParameter struct {
	Description string `json:"description" datastore:"description"`
	ID          string `json:"id" datastore:"id"`
	Name        string `json:"name" datastore:"name"`
	Value       string `json:"value" datastore:"value"`
	ActionField string `json:"action_field" datastore:"action_field"`
	Variant     string `json:"variant", datastore:"variant"`
	Required    bool   `json:"required" datastore:"required"`
	Schema      struct {
		Type string `json:"type" datastore:"type"`
	} `json:"schema"`
}

type AuthenticationStore struct {
	Key   string `json:"key" datastore:"key"`
	Value string `json:"value" datastore:"value"`
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
		ID          string           `json:"id" datastore:"id" yaml:"id,omitempty"`
		Schema      SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
	} `json:"returns" datastore:"returns"`
}

type SchemaDefinition struct {
	Type string `json:"type" datastore:"type"`
}

// removes every container except itself (worker)
func shutdown(executionId, workflowId string) {
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
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
		log.Println("Failed building request: %s", err)
	}

	// FIXME: Add an API call to the backend
	authorization := os.Getenv("AUTHORIZATION")
	if len(authorization) > 0 {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authorization))
	}

	req.Header.Add("Content-Type", "application/json")
	//req.Header.Add("Authorization", authorization)
	client := &http.Client{}
	_, err = client.Do(req)
	if err != nil {
		log.Printf("Failed abort request: %s", err)
	}

	log.Printf("Finished shutdown.")
	os.Exit(3)
}

// Deploys the internal worker whenever something happens
func deployApp(cli *dockerclient.Client, image string, identifier string, env []string) error {
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type:   "json-file",
			Config: map[string]string{},
		},
	}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	networkConfig := &network.NetworkingConfig{}
	if baseUrl == "http://shuffle-backend:5001" {
		networkConfig = &network.NetworkingConfig{
			EndpointsConfig: map[string]*network.EndpointSettings{
				"shuffle_shuffle": {
					NetworkID: "shuffle_shuffle",
				},
			},
		}
	} else {
		// FIXME: Default config
		//log.Printf("Bad config: %s. Using default network", baseUrl)
	}

	cont, err := cli.ContainerCreate(
		context.Background(),
		config,
		hostConfig,
		networkConfig,
		nil,
		identifier,
	)

	if err != nil {
		log.Println(err)
		return err
	}

	cli.ContainerStart(context.Background(), cont.ID, types.ContainerStartOptions{})
	fmt.Printf("\n")
	log.Printf("Container %s is created", cont.ID)
	return nil
}

func removeContainer(containername string) error {
	ctx := context.Background()

	cli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
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
				log.Printf("Bad environment: %s", action.Environment)
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

			//log.Println(string(actionData))
			// FIXME - add proper FUNCTION_APIKEY from user definition
			env := []string{
				fmt.Sprintf("ACTION=%s", string(actionData)),
				fmt.Sprintf("EXECUTIONID=%s", workflowExecution.ExecutionId),
				fmt.Sprintf("FUNCTION_APIKEY=%s", "asdasd"),
				fmt.Sprintf("AUTHORIZATION=%s", workflowExecution.Authorization),
				fmt.Sprintf("CALLBACK_URL=%s", baseUrl),
			}

			err = deployApp(dockercli, image, identifier, env)
			if err != nil {
				log.Printf("Failed deploying %s from image %s: %s", identifier, image, err)
				log.Printf("Should send status and exit the entire thing?")
				//shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
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

	log.Printf("Body: %s", string(body))
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
	log.Printf("Setting up worker environment")
	sleepTime := 5
	client := &http.Client{}

	// WORKER_TESTING_WORKFLOW should be a workflow ID
	authorization := ""
	executionId := ""
	testing := os.Getenv("WORKER_TESTING_WORKFLOW")
	shuffle_apikey := os.Getenv("WORKER_TESTING_APIKEY")
	if len(testing) > 0 && len(shuffle_apikey) > 0 {
		// Execute a workflow and use that info
		log.Printf("!! Running test environment for worker by executing workflow %s", testing)
		authorization, executionId = runTestExecution(client, testing, shuffle_apikey)

		//os.Exit(3)
	} else {
		authorization = os.Getenv("AUTHORIZATION")
		executionId = os.Getenv("EXECUTIONID")
	}

	if len(authorization) == 0 {
		log.Println("No AUTHORIZATION key set in env")
		shutdown(executionId, "")
	}

	if len(executionId) == 0 {
		log.Println("No EXECUTIONID key set in env")
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
		log.Println("Failed making request builder")
		shutdown(executionId, "")
	}

	for {
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("Failed request: %s", err)
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

		var workflowExecution WorkflowExecution
		err = json.Unmarshal(body, &workflowExecution)
		if err != nil {
			log.Printf("Failed workflowExecution unmarshal: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			shutdown(executionId, workflowExecution.Workflow.ID)
		}

		if workflowExecution.Status == "EXECUTING" || workflowExecution.Status == "RUNNING" {
			//log.Printf("Status: %s", workflowExecution.Status)
			err = handleExecution(client, req, workflowExecution)
			if err != nil {
				log.Printf("Workflow %s is finished: %s", workflowExecution.ExecutionId, err)
				shutdown(executionId, workflowExecution.Workflow.ID)
			}
		} else {
			log.Printf("Workflow %s has status %s. Exiting worker.", workflowExecution.ExecutionId, workflowExecution.Status)
			shutdown(executionId, workflowExecution.Workflow.ID)
		}

		//log.Println(string(body))
		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}
