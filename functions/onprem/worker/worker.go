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
	dockerclient "github.com/docker/docker/client"
)

var environment = os.Getenv("ENVIRONMENT_NAME")
var baseUrl = os.Getenv("BASE_URL")
var baseimagename = "frikky/shuffle"

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

// FIXME: Generate a callback authentication ID?
type WorkflowExecution struct {
	Type              string         `json:"type"`
	Status            string         `json:"status"`
	ExecutionId       string         `json:"execution_id"`
	ExecutionArgument string         `json:"execution_argument"`
	WorkflowId        string         `json:"workflow_id"`
	LastNode          string         `json:"last_node"`
	Authorization     string         `json:"authorization"`
	Result            string         `json:"result"`
	StartedAt         int64          `json:"started_at"`
	CompletedAt       int64          `json:"completed_at"`
	ProjectId         string         `json:"project_id"`
	Locations         []string       `json:"locations"`
	Workflow          Workflow       `json:"workflow"`
	Results           []ActionResult `json:"results"`
}

// Added environment for location to execute
type Action struct {
	AppName     string                       `json:"app_name" datastore:"app_name"`
	AppVersion  string                       `json:"app_version" datastore:"app_version"`
	Errors      []string                     `json:"errors" datastore:"errors"`
	ID          string                       `json:"id" datastore:"id"`
	IsValid     bool                         `json:"is_valid" datastore:"is_valid"`
	IsStartNode bool                         `json:"isStartNode" datastore:"isStartNode"`
	Label       string                       `json:"label" datastore:"label"`
	Environment string                       `json:"environment" datastore:"environment"`
	Name        string                       `json:"name" datastore:"name"`
	Parameters  []WorkflowAppActionParameter `json:"parameters" datastore: "parameters"`
	Position    struct {
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
	Actions           []Action   `json:"actions" datastore:"actions"`
	Branches          []Branch   `json:"branches" datastore:"branches"`
	Triggers          []Trigger  `json:"triggers" datastore:"triggers"`
	Schedules         []Schedule `json:"schedules" datastore:"schedules"`
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

type WorkflowAppAction struct {
	Description string                       `json:"description" datastore:"description"`
	ID          string                       `json:"id" datastore:"id"`
	Name        string                       `json:"name" datastore:"name"`
	NodeType    string                       `json:"node_type" datastore:"node_type"`
	Environment string                       `json:"environment" datastore:"environment"`
	Parameters  []WorkflowAppActionParameter `json:"parameters" datastore: "parameters"`
	Returns     struct {
		Description string `json:"description" datastore:"returns"`
		ID          string `json:"id" datastore:"id"`
		Schema      struct {
			Type string `json:"type" datastore:"type"`
		} `json:"schema" datastore:"schema"`
	} `json:"returns" datastore:"returns"`
}

// removes every container except itself (worker)
func shutdown(executionId string) {
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		shutdown(executionId)
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

	// FIXME: Add an API call to the backend
	workflowid := "d0496ad4-d682-4506-bbf9-f926358a4b2a"
	fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/executions/%s/abort", baseUrl, workflowid, executionId)
	log.Printf("ShutdownURL: %s", fullUrl)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Println("Failed building request: %s", err)
	}

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

	cont, err := cli.ContainerCreate(
		context.Background(),
		config,
		hostConfig,
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

func handleExecution(client *http.Client, req *http.Request, workflowExecution WorkflowExecution) error {
	// if no onprem runs (shouldn't happen, but extra check), exit
	// if there are some, load the images ASAP for the app
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		shutdown(workflowExecution.ExecutionId)
	}

	onpremApps := []string{}
	startAction := workflowExecution.Workflow.Start
	sleepTime := 5
	toExecuteOnprem := []string{}
	parents := map[string][]string{}
	children := map[string][]string{}

	// source = parent, dest = child
	// parent can have more children, child can have more parents
	for _, branch := range workflowExecution.Workflow.Branches {
		parents[branch.DestinationID] = append(parents[branch.DestinationID], branch.SourceID)
		children[branch.SourceID] = append(children[branch.SourceID], branch.DestinationID)
	}

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
		return errors.New("No apps to handle onprem")
	}

	pullOptions := types.ImagePullOptions{}
	for _, image := range onpremApps {
		log.Printf("Image: %s", image)
		if strings.Contains(image, " ") {
			image = strings.ReplaceAll(image, " ", "-")
		}

		reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
		if err != nil {
			log.Printf("Failed getting %s. The app is missing or some other issue", image)
			//shutdown(workflowExecution.ExecutionId)
		}

		//io.Copy(os.Stdout, reader)
		_ = reader
		log.Printf("Successfully downloaded and built %s", image)
	}

	// Process the parents etc. How?
	// while queue:
	// while len(self.in_process) > 0 or len(self.parallel_in_process) > 0:
	// check if its their own turn to continue
	// visited = {self.start_action}
	visited := []string{}
	nextActions := []string{}
	queueNodes := []string{}

	for {
		//if len(queueNodes) > 0 {
		//	log.Println(queueNodes)
		//	nextActions = queueNodes
		//} else {
		//	nextActions := []string{}
		//}
		// FIXME - this might actually work, but probably not
		//queueNodes = []string{}

		if len(workflowExecution.Results) == 0 {
			nextActions = []string{startAction}
		} else {
			for _, item := range workflowExecution.Results {
				visited = append(visited, item.Action.ID)
				nextActions = children[item.Action.ID]
				// FIXME: check if nextActions items are finished?
			}
		}

		if len(nextActions) == 0 {
			log.Println("No next action. Finished?")
			//shutdown(workflowExecution.ExecutionId)
		}

		for _, node := range nextActions {
			nodeChildren := children[node]
			for _, child := range nodeChildren {
				if !arrayContains(queueNodes, child) {
					queueNodes = append(queueNodes, child)
				}
			}
		}

		//log.Println(queueNodes)

		// IF NOT VISITED && IN toExecuteOnPrem
		// SKIP if it's not onprem
		// FIXME: Find next node(s)
		//for _, result := range workflowExecution.Results {
		//	log.Println(result.Status)
		//}

		for _, nextAction := range nextActions {
			action := getAction(workflowExecution, nextAction)
			// FIXME - remove this. Should always need to be valid.
			//if action.IsValid == false {
			//	log.Printf("%#v", action)
			//	log.Printf("Action %s (%s) isn't valid. Exiting, BUT SHOULD CALLBACK TO SET FAILURE.", action.ID, action.Name)
			//	os.Exit(3)
			//}

			// check visited and onprem
			if arrayContains(visited, nextAction) {
				log.Printf("ALREADY VISITIED: %s", nextAction)
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
					if parentResult.Status == "FINISHED" || parentResult.Status == "SUCCESS" {
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
				log.Printf("Parents of %s aren't finished: %s", nextAction, strings.Join(parents[nextAction], ", "))
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
			log.Printf("Time to execute %s with app %s:%s, function %s, env %s with %d parameters.", action.ID, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))
			actionData, err := json.Marshal(action)
			if err != nil {
				log.Printf("Failed unmarshalling action: %s", err)
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
				//shutdown(workflowExecution.ExecutionId)
			}

			visited = append(visited, action.ID)
			//log.Printf("%#v", action)
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
			shutdown(workflowExecution.ExecutionId)
		}

		log.Printf("Status: %s, Results: %d, actions: %d", workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
		if workflowExecution.Status != "EXECUTING" {
			log.Printf("Exiting as worker execution has status %s!", workflowExecution.Status)
			shutdown(workflowExecution.ExecutionId)
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
				shutdown(workflowExecution.ExecutionId)
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

// Initial loop etc
func main() {
	log.Printf("Setting up worker environment")

	sleepTime := 5
	client := &http.Client{}
	authorization := os.Getenv("AUTHORIZATION")
	executionId := os.Getenv("EXECUTIONID")

	if len(authorization) == 0 {
		log.Println("No AUTHORIZATION key set in env")
		shutdown(executionId)
	}

	if len(executionId) == 0 {
		log.Println("No EXECUTIONID key set in env")
		shutdown(executionId)
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
		shutdown(executionId)
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
			shutdown(executionId)
		}

		if workflowExecution.Status == "EXECUTING" || workflowExecution.Status == "RUNNING" {
			//log.Printf("Status: %s", workflowExecution.Status)
			err = handleExecution(client, req, workflowExecution)
			if err != nil {
				log.Printf("Workflow %s is finished: %s", workflowExecution.ExecutionId, err)
				shutdown(executionId)
			}
		} else {
			log.Printf("Workflow %s has status %s. Exiting worker.", workflowExecution.ExecutionId, workflowExecution.Status)
			shutdown(executionId)
		}

		//log.Println(string(body))
		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}
