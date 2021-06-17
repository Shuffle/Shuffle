package main

import (
	"github.com/frikky/shuffle-shared"

	//"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	//"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	dockerclient "github.com/docker/docker/client"
	//"github.com/go-git/go-billy/v5/memfs"

	//newdockerclient "github.com/fsouza/go-dockerclient"
	//"github.com/satori/go.uuid"

	"github.com/gorilla/mux"
	"github.com/patrickmn/go-cache"
)

// This is getting out of hand :)
var environment = os.Getenv("ENVIRONMENT_NAME")
var baseUrl = os.Getenv("BASE_URL")
var appCallbackUrl = os.Getenv("BASE_URL")
var cleanupEnv = strings.ToLower(os.Getenv("CLEANUP"))
var baseimagename = "frikky/shuffle"
var registryName = "registry.hub.docker.com"
var fallbackName = "shuffle-orborus"
var sleepTime = 2
var requestCache *cache.Cache
var topClient *http.Client
var data string
var requestsSent = 0

var environments []string
var parents map[string][]string
var children map[string][]string
var visited []string
var executed []string
var nextActions []string
var containerIds []string
var extra int
var startAction string
var results []shuffle.ActionResult
var allLogs map[string]string

var containerId string

// form container id of current running container
func getThisContainerId() string {
	if len(containerId) > 0 {
		return containerId
	}

	id := ""
	cmd := fmt.Sprintf("cat /proc/self/cgroup | grep memory | tail -1 | cut -d/ -f3 | grep -o -E '[0-9A-z]{64}'")
	out, err := exec.Command("bash", "-c", cmd).Output()
	if err == nil {
		id = strings.TrimSpace(string(out))

		//log.Printf("Checking if %s is in %s", ".scope", string(out))
		if strings.Contains(string(out), ".scope") {
			id = fallbackName
		}
	}

	return id
}

func init() {
	containerId = getThisContainerId()
	if len(containerId) == 0 {
		log.Printf("[WARNING] No container ID found. Not running containerized? This should only show during testing")
	} else {
		log.Printf("[INFO] Found container ID for this worker: %s", containerId)
	}
}

// removes every container except itself (worker)
func shutdown(workflowExecution shuffle.WorkflowExecution, nodeId string, reason string, handleResultSend bool) {
	log.Printf("[INFO] Shutdown (%s) started with reason %#v. Result amount: %d. ResultsSent: %d, Send result: %#v", workflowExecution.Status, reason, len(workflowExecution.Results), requestsSent, handleResultSend)
	//reason := "Error in execution"

	sleepDuration := 1
	if handleResultSend && requestsSent < 2 {
		shutdownData, err := json.Marshal(workflowExecution)
		if err == nil {
			sendResult(workflowExecution, shutdownData)
			log.Printf("[WARNING] Sent shutdown update with %d results and result value %s", len(workflowExecution.Results), reason)
		} else {
			log.Printf("[WARNING] Failed to send update: %s", err)
		}

		time.Sleep(time.Duration(sleepDuration) * time.Second)
	}

	// Might not be necessary because of cleanupEnv hostconfig autoremoval
	if cleanupEnv == "true" && len(containerIds) > 0 {
		/*
			ctx := context.Background()
			dockercli, err := dockerclient.NewEnvClient()
			if err == nil {
				log.Printf("[INFO] Cleaning up %d containers", len(containerIds))
				removeOptions := types.ContainerRemoveOptions{
					RemoveVolumes: true,
					Force:         true,
				}

				for _, containername := range containerIds {
					log.Printf("[INFO] Should stop and and remove container %s (deprecated)", containername)
					//dockercli.ContainerStop(ctx, containername, nil)
					//dockercli.ContainerRemove(ctx, containername, removeOptions)
					//removeContainers = append(removeContainers, containername)
				}
			}
		*/
	} else {
		log.Printf("[INFO] NOT cleaning up containers. IDS: %d, CLEANUP env: %s", len(containerIds), cleanupEnv)
	}

	abortUrl := fmt.Sprintf("%s/api/v1/workflows/%s/executions/%s/abort", baseUrl, workflowExecution.Workflow.ID, workflowExecution.ExecutionId)

	path := fmt.Sprintf("?reason=%s", url.QueryEscape(reason))
	if len(nodeId) > 0 {
		path += fmt.Sprintf("&node=%s", url.QueryEscape(nodeId))
	}
	if len(environment) > 0 {
		path += fmt.Sprintf("&env=%s", url.QueryEscape(environment))
	}

	//fmt.Println(url.QueryEscape(query))
	abortUrl += path
	log.Printf("[INFO] Abort URL: %s", abortUrl)

	req, err := http.NewRequest(
		"GET",
		abortUrl,
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

	log.Printf("[INFO] All App Logs: %#v", allLogs)
	_, err = client.Do(req)
	if err != nil {
		log.Printf("[WARNING] Failed abort request: %s", err)
	}

	log.Printf("[INFO] Finished shutdown (after %d seconds). ", sleepDuration)
	//Finished shutdown (after %d seconds). ", sleepDuration)

	// Allows everything to finish in subprocesses (apps)
	time.Sleep(time.Duration(sleepDuration) * time.Second)
	os.Exit(3)
}

// Deploys the internal worker whenever something happens
func deployApp(cli *dockerclient.Client, image string, identifier string, env []string, workflowExecution shuffle.WorkflowExecution, actionId string) error {
	// form basic hostConfig
	ctx := context.Background()

	// Max 10% CPU every second
	//CPUShares: 128,
	//CPUQuota:  10000,
	//CPUPeriod: 100000,
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type:   "json-file",
			Config: map[string]string{},
		},
		Resources: container.Resources{},
	}

	// form container id and use it as network source if it's not empty
	containerId = getThisContainerId()
	if containerId != "" {
		hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:%s", containerId))
	} else {
		log.Printf("[WARNING] Empty self container id, continue without NetworkMode")
	}

	// Removing because log extraction should happen first
	if cleanupEnv == "true" {
		hostConfig.AutoRemove = true
	}

	// FIXME: Add proper foldermounts here
	//log.Printf("\n\nPRE FOLDERMOUNT\n\n")
	//volumeBinds := []string{"/tmp/shuffle-mount:/rules"}
	//volumeBinds := []string{"/tmp/shuffle-mount:/rules"}
	volumeBinds := []string{}
	if len(volumeBinds) > 0 {
		log.Printf("[INFO] Setting up binds for container!")
		hostConfig.Binds = volumeBinds
		hostConfig.Mounts = []mount.Mount{}
		for _, bind := range volumeBinds {
			if !strings.Contains(bind, ":") || strings.Contains(bind, "..") || strings.HasPrefix(bind, "~") {
				log.Printf("[WARNING] Bind %s is invalid.", bind)
				continue
			}

			log.Printf("[INFO] Appending bind %s", bind)
			bindSplit := strings.Split(bind, ":")
			sourceFolder := bindSplit[0]
			destinationFolder := bindSplit[0]
			hostConfig.Mounts = append(hostConfig.Mounts, mount.Mount{
				Type:   mount.TypeBind,
				Source: sourceFolder,
				Target: destinationFolder,
			})
		}
	} else {
		log.Printf("[WARNING] No mounted folders")
	}
	//	hostConfig.Binds = volumeBinds
	//}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	cont, err := cli.ContainerCreate(
		ctx,
		config,
		hostConfig,
		nil,
		nil,
		identifier,
	)

	if err != nil {
		if !strings.Contains(err.Error(), "Conflict. The container name") {
			log.Printf("[ERROR] Container CREATE error: %s", err)
		}

		return err
	}

	err = cli.ContainerStart(ctx, cont.ID, types.ContainerStartOptions{})
	if err != nil {
		log.Printf("[ERROR] Failed to start container in environment %s: %s", environment, err)
		//shutdown(workflowExecution, workflowExecution.Workflow.ID, true)
		return err
	}

	log.Printf("[INFO] Container %s was created for %s", cont.ID, identifier)

	// Waiting to see if it exits.. Stupid, but stable(r)
	if workflowExecution.ExecutionSource != "default" {
		log.Printf("[INFO] Handling NON-default execution source %s - NOT waiting or validating!", workflowExecution.ExecutionSource)
	} else if workflowExecution.ExecutionSource == "default" {
		time.Sleep(2 * time.Second)

		stats, err := cli.ContainerInspect(ctx, cont.ID)
		if err != nil {
			log.Printf("[ERROR] Failed getting container stats")
		} else {
			//log.Printf("[INFO] Info for container: %#v", stats)
			//log.Printf("%#v", stats.Config)
			//log.Printf("%#v", stats.ContainerJSONBase.State)
			log.Printf("[INFO] EXECUTION STATUS: %s", stats.ContainerJSONBase.State.Status)
			logOptions := types.ContainerLogsOptions{
				ShowStdout: true,
			}

			exit := false
			out, err := cli.ContainerLogs(ctx, cont.ID, logOptions)
			if err != nil {
				log.Printf("[INFO] Failed getting logs: %s", err)
			} else {
				buf := new(strings.Builder)
				io.Copy(buf, out)
				logs := buf.String()

				// FIXME: Re-add log tracking which can be sent to backend
				//allLogs[actionId] = logs

				if stats.ContainerJSONBase.State.Status == "exited" && !strings.Contains(logs, "Normal execution.") {
					log.Printf("[WARNING] BAD Execution Logs for %s: %s", actionId, logs)
					exit = true
				}
			}

			if exit {
				log.Printf("ERROR IN CONTAINER DEPLOYMENT - ITS EXITED!")
				return errors.New(fmt.Sprintf(`{"success": false, "reason": "Container %s exited prematurely.","debug": "docker logs -f %s"}`, cont.ID, cont.ID))
			}
		}
	}

	/*
		//log.Printf("%#v", stats.Config.Status)
		//ContainerJSONtoConfig(cj dockType.ContainerJSON) ContainerConfig {
			listOptions := types.ContainerListOptions{
				Filters: filters.Args{
					map[string][]string{"ancestor": {"<imagename>:<version>"}},
				},
			}
			containers, err := cli.ContainerList(ctx, listOptions)
	*/

	//log.Printf("%#v", cont.Status)
	//config := ContainerJSONtoConfig(stats)
	//log.Printf("CONFIG: %#v", config)

	/*
		logOptions := types.ContainerLogsOptions{
			ShowStdout: true,
		}
	*/

	containerIds = append(containerIds, cont.ID)
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

func runFilter(workflowExecution shuffle.WorkflowExecution, action shuffle.Action) {
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

func handleSubworkflowExecution(client *http.Client, workflowExecution shuffle.WorkflowExecution, action shuffle.Trigger, baseAction shuffle.Action) error {
	apikey := ""
	workflowId := ""
	executionArgument := ""
	for _, parameter := range action.Parameters {
		log.Printf("Parameter name: %s", parameter.Name)
		if parameter.Name == "user_apikey" {
			apikey = parameter.Value
		} else if parameter.Name == "workflow" {
			workflowId = parameter.Value
		} else if parameter.Name == "data" {
			executionArgument = parameter.Value
		}
	}

	//handleSubworkflowExecution(workflowExecution, action)
	status := "SUCCESS"
	baseResult := `{"success": true}`
	if len(apikey) == 0 || len(workflowId) == 0 {
		status = "FAILURE"
		baseResult = `{"success": false}`
	} else {
		log.Printf("Should execute workflow %s with APIKEY %s and data %s", workflowId, apikey, executionArgument)
		executeUrl := fmt.Sprintf("%s/api/workflows/%s/execute", baseUrl, workflowId)
		req, err := http.NewRequest(
			"POST",
			executeUrl,
			bytes.NewBuffer([]byte(executionArgument)),
		)

		if err != nil {
			log.Printf("[WARNING] Error building test request: %s", err)
			return err
		}

		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apikey))
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("[DEBUG] Error running test request: %s", err)
			return err
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("Failed reading body when waiting: %s", err)
			return err
		}

		log.Printf("Execution Result: %s", body)
	}

	timeNow := time.Now().Unix()
	//curaction := shuffle.Action{
	//	AppName:    baseAction.AppName,
	//	AppVersion: baseAction.AppVersion,
	//	Label:      baseAction.Label,
	//	Name:       baseAction.Name,
	//	ID:         baseAction.ID,
	//}
	result := shuffle.ActionResult{
		Action:        baseAction,
		ExecutionId:   workflowExecution.ExecutionId,
		Authorization: workflowExecution.Authorization,
		Result:        baseResult,
		StartedAt:     timeNow,
		CompletedAt:   0,
		Status:        status,
	}

	resultData, err := json.Marshal(result)
	if err != nil {
		return err
	}

	streamUrl := fmt.Sprintf("%s/api/v1/streams", baseUrl)
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(resultData)),
	)

	if err != nil {
		log.Printf("Error building test request: %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("Error running test request: %s", err)
		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body when waiting: %s", err)
		return err
	}

	log.Printf("[INFO] Subworkflow Body: %s", string(body))

	if status == "FAILURE" {
		return errors.New("[ERROR] Failed to execute subworkflow")
	} else {
		return nil
	}
}

func removeIndex(s []string, i int) []string {
	s[len(s)-1], s[i] = s[i], s[len(s)-1]
	return s[:len(s)-1]
}

func handleExecutionResult(workflowExecution shuffle.WorkflowExecution) {
	log.Printf("[INFO] Inside execution results with %d / %d results", len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)
	if len(startAction) == 0 {
		startAction = workflowExecution.Start
		if len(startAction) == 0 {
			log.Printf("Didn't find execution start action. Setting it to workflow start action.")
			startAction = workflowExecution.Workflow.Start
		}
	}

	//log.Printf("NEXTACTIONS: %s", nextActions)
	queueNodes := []string{}
	//if len(nextActions) == 0 {
	//	nextActions = append(nextActions, startAction)
	//}

	if len(workflowExecution.Results) == 0 {
		nextActions = []string{startAction}
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
									//log.Printf("\n\n\nSUBRESULT PARENT STATUS: %s\n\n\n", subresult.Status)
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
						log.Printf("[INFO] Adding visited (1): %s\n", item.Action.Label)
						visited = append(visited, item.Action.ID)
					}
				} else {
					log.Printf("[INFO] Continuing %s as all parents are NOT done", item.Action.Label)
					appendActions = append(appendActions, item.Action.ID)
				}
			} else {
				if item.Status == "FINISHED" {
					log.Printf("[INFO] Adding visited (2): %s\n", item.Action.Label)
					visited = append(visited, item.Action.ID)
				}
			}

			//if len(nextActions) == 0 {
			//nextActions = append(nextActions, children[item.Action.ID]...)
			for _, child := range children[item.Action.ID] {
				if !arrayContains(nextActions, child) && !arrayContains(visited, child) && !arrayContains(visited, child) {
					nextActions = append(nextActions, child)
				}
			}

			if len(appendActions) > 0 {
				log.Printf("APPENDED NODES: %#v", appendActions)
				nextActions = append(nextActions, appendActions...)
			}
		}
	}

	//log.Printf("Nextactions: %s", nextActions)
	// This is a backup in case something goes wrong in this complex hellhole.
	// Max default execution time is 5 minutes for now anyway, which should take
	// care if it gets stuck in a loop.
	// FIXME: Force killing a worker should result in a notification somewhere
	if len(nextActions) == 0 {
		log.Printf("[INFO] No next action. Finished? Result vs shuffle.Actions: %d - %d", len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
		exit := true
		for _, item := range workflowExecution.Results {
			if item.Status == "EXECUTING" {
				exit = false
				break
			}
		}

		if len(environments) == 1 {
			log.Printf("[INFO] Should send results to the backend because environments are %s", environments)
			validateFinished(workflowExecution)
		}

		if exit && len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions) {
			log.Printf("[DEBUG] Shutting down (1)")
			shutdown(workflowExecution, "", "", true)
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
				return
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

	//log.Printf("Checking nextactions: %s", nextActions)
	for _, node := range nextActions {
		nodeChildren := children[node]
		for _, child := range nodeChildren {
			if !arrayContains(queueNodes, child) {
				queueNodes = append(queueNodes, child)
			}
		}
	}

	// IF NOT VISITED && IN toExecuteOnPrem
	// SKIP if it's not onprem
	toRemove := []int{}
	//log.Printf("\n\nNEXTACTIONS: %#v\n\n", nextActions)
	for index, nextAction := range nextActions {
		action := getAction(workflowExecution, nextAction, environment)
		// check visited and onprem
		if arrayContains(visited, nextAction) {
			//log.Printf("ALREADY VISITIED (%s): %s", action.Label, nextAction)
			toRemove = append(toRemove, index)
			//nextActions = removeIndex(nextActions, index)

			//validateFinished(workflowExecution)
			_ = index

			continue
		}

		if action.AppName == "Shuffle Tools" && (action.Name == "skip_me" || action.Name == "router" || action.Name == "route") {
			err := runSkipAction(topClient, action, workflowExecution.Workflow.ID, workflowExecution.ExecutionId, workflowExecution.Authorization, "SKIPPED")
			if err != nil {
				log.Printf("[DEBUG] Error in skipme for %s: %s", action.Label, err)
			} else {
				log.Printf("[INFO] Adding visited (4): %s\n", action.Label)

				visited = append(visited, action.ID)
				executed = append(executed, action.ID)
				continue
			}
		} else if action.AppName == "Shuffle Workflow" {
			//log.Printf("SHUFFLE WORKFLOW: %#v", action)
			action.Environment = environment
			action.AppName = "shuffle-subflow"
			action.Name = "run_subflow"
			action.AppVersion = "1.0.0"

			//appname := action.AppName
			//appversion := action.AppVersion
			//appname = strings.Replace(appname, ".", "-", -1)
			//appversion = strings.Replace(appversion, ".", "-", -1)
			//	shuffle-subflow_1.0.0

			//visited = append(visited, action.ID)
			//executed = append(executed, action.ID)

			trigger := shuffle.Trigger{}
			for _, innertrigger := range workflowExecution.Workflow.Triggers {
				if innertrigger.ID == action.ID {
					trigger = innertrigger
					break
				}
			}

			// FIXME: Add startnode from frontend
			action.Parameters = []shuffle.WorkflowAppActionParameter{}
			for _, parameter := range trigger.Parameters {
				parameter.Variant = "STATIC_VALUE"
				action.Parameters = append(action.Parameters, parameter)
			}

			action.Parameters = append(action.Parameters, shuffle.WorkflowAppActionParameter{
				Name:  "source_workflow",
				Value: workflowExecution.Workflow.ID,
			})

			action.Parameters = append(action.Parameters, shuffle.WorkflowAppActionParameter{
				Name:  "source_execution",
				Value: workflowExecution.ExecutionId,
			})

			//trigger.LargeImage = ""
			//err = handleSubworkflowExecution(client, workflowExecution, trigger, action)
			//if err != nil {
			//	log.Printf("[ERROR] Failed to execute subworkflow: %s", err)
			//} else {
			//	log.Printf("[INFO] Executed subworkflow!")
			//}
			//continue
		} else if action.AppName == "User Input" {
			log.Printf("USER INPUT!")

			if action.ID == workflowExecution.Start {
				log.Printf("Skipping because it's the startnode")
				visited = append(visited, action.ID)
				executed = append(executed, action.ID)
				continue
			} else {
				log.Printf("Should stop after this iteration because it's user-input based. %#v", action)
				trigger := shuffle.Trigger{}
				for _, innertrigger := range workflowExecution.Workflow.Triggers {
					if innertrigger.ID == action.ID {
						trigger = innertrigger
						break
					}
				}

				trigger.LargeImage = ""
				triggerData, err := json.Marshal(trigger)
				if err != nil {
					log.Printf("Failed unmarshalling action: %s", err)
					triggerData = []byte("Failed unmarshalling. Cancel execution!")
				}

				err = runUserInput(topClient, action, workflowExecution.Workflow.ID, workflowExecution.ExecutionId, workflowExecution.Authorization, string(triggerData))
				if err != nil {
					log.Printf("Failed launching backend magic: %s", err)
					os.Exit(3)
				} else {
					log.Printf("Launched user input node succesfully!")
					os.Exit(3)
				}

				break
			}
		} else {
			//log.Printf("Handling action %#v", action)
		}

		if len(toRemove) > 0 {
			//toRemove = []int{}
			//for index, nextAction := range nextActions {
		}

		// Not really sure how this edgecase happens.

		// FIXME
		// Execute, as we don't really care if env is not set? IDK
		if action.Environment != environment { //&& action.Environment != "" {
			//log.Printf("Action: %#v", action)
			log.Printf("[WARNING] Bad environment for node: %#v. Want %s. Skipping if NOT empty env.", action.Environment, environment)
			if len(action.Environment) > 0 {
				continue
			}
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
			log.Printf("[INFO] Parents of %s aren't finished: %s", nextAction, strings.Join(parents[nextAction], ", "))
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
			log.Printf("[INFO] %s already has status %s.", action.ID, actionResult.Status)
			continue
		} else {
			log.Printf("[INFO] %s:%s has no status result yet. Should execute.", action.Name, action.ID)
		}

		appname := action.AppName
		appversion := action.AppVersion
		appname = strings.Replace(appname, ".", "-", -1)
		appversion = strings.Replace(appversion, ".", "-", -1)

		parsedAppname := strings.Replace(strings.ToLower(action.AppName), " ", "-", -1)
		image := fmt.Sprintf("%s:%s_%s", baseimagename, parsedAppname, action.AppVersion)
		if strings.Contains(image, " ") {
			image = strings.ReplaceAll(image, " ", "-")
		}

		// Added UUID to identifier just in case
		//identifier := fmt.Sprintf("%s_%s_%s_%s_%s", appname, appversion, action.ID, workflowExecution.ExecutionId, uuid.NewV4())
		identifier := fmt.Sprintf("%s_%s_%s_%s", appname, appversion, action.ID, workflowExecution.ExecutionId)
		if strings.Contains(identifier, " ") {
			identifier = strings.ReplaceAll(identifier, " ", "-")
		}

		//if arrayContains(executed, action.ID) || arrayContains(visited, action.ID) {
		//	log.Printf("[WARNING] Action %s is already executed")
		//	continue
		//}
		//visited = append(visited, action.ID)
		//executed = append(executed, action.ID)

		// FIXME - check whether it's running locally yet too
		dockercli, err := dockerclient.NewEnvClient()
		if err != nil {
			log.Printf("[ERROR] Unable to create docker client (2): %s", err)
			//return err
			continue
		}

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
			//log.Printf("
			continue
		}

		if len(action.Parameters) == 0 {
			action.Parameters = []shuffle.WorkflowAppActionParameter{}
		}

		if len(action.Errors) == 0 {
			action.Errors = []string{}
		}

		// marshal action and put it in there rofl
		log.Printf("[INFO] Time to execute %s (%s) with app %s:%s, function %s, env %s with %d parameters.", action.ID, action.Label, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))

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
		log.Printf("[INFO] Deployed with CALLBACK_URL %s and BASE_URL %s", appCallbackUrl, baseUrl)
		env := []string{
			fmt.Sprintf("ACTION=%s", string(actionData)),
			fmt.Sprintf("EXECUTIONID=%s", workflowExecution.ExecutionId),
			fmt.Sprintf("AUTHORIZATION=%s", workflowExecution.Authorization),
			fmt.Sprintf("CALLBACK_URL=%s", baseUrl),
			fmt.Sprintf("BASE_URL=%s", appCallbackUrl),
		}

		if strings.ToLower(os.Getenv("SHUFFLE_PASS_APP_PROXY")) == "true" {
			//log.Printf("APPENDING PROXY TO THE APP!")
			env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
			env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
		}

		// Fixes issue:
		// standard_init_linux.go:185: exec user process caused "argument list too long"
		// https://devblogs.microsoft.com/oldnewthing/20100203-00/?p=15083
		maxSize := 32700 - len(string(actionData)) - 2000
		if len(executionData) < maxSize {
			log.Printf("[INFO] ADDING FULL_EXECUTION because size is smaller than %d", maxSize)
			env = append(env, fmt.Sprintf("FULL_EXECUTION=%s", string(executionData)))
		} else {
			log.Printf("[WARNING] Skipping FULL_EXECUTION because size is larger than %d", maxSize)
		}

		// Uses a few ways of getting / checking if an app is available
		// 1. Try original with lowercase
		// 2. Go to original (no spaces)
		// 3. Add remote repo location
		images := []string{
			image,
			fmt.Sprintf("%s:%s_%s", baseimagename, strings.Replace(action.AppName, " ", "-", -1), action.AppVersion),
			fmt.Sprintf("%s/%s:%s_%s", registryName, baseimagename, parsedAppname, action.AppVersion),
		}

		// If cleanup is set, it should run for efficiency
		pullOptions := types.ImagePullOptions{}
		if cleanupEnv == "true" {
			err = deployApp(dockercli, images[0], identifier, env, workflowExecution, action.ID)
			if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
				if strings.Contains(err.Error(), "exited prematurely") {
					log.Printf("[DEBUG] Shutting down (2)")
					shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
				}

				err := downloadDockerImageBackend(topClient, image)
				executed := false
				if err == nil {
					log.Printf("[DEBUG] Downloaded image %s from backend (CLEANUP)", image)
					//err = deployApp(dockercli, image, identifier, env, workflow, action.ID)
					err = deployApp(dockercli, image, identifier, env, workflowExecution, action.ID)
					if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
						if strings.Contains(err.Error(), "exited prematurely") {
							log.Printf("[DEBUG] Shutting down (41)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
						}
					} else {
						executed = true
					}
				}

				if !executed {
					image = images[2]
					err = deployApp(dockercli, image, identifier, env, workflowExecution, action.ID)
					if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
						if strings.Contains(err.Error(), "exited prematurely") {
							log.Printf("[DEBUG] Shutting down (3)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
						}

						//log.Printf("[WARNING] Failed CLEANUP execution. Downloading image %s remotely.", image)

						log.Printf("[WARNING] Failed to download image %s (CLEANUP): %s", image, err)

						reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
						if err != nil {
							log.Printf("[ERROR] Failed getting %s. Couldn't be find locally, AND is missing.", image)
							log.Printf("[DEBUG] Shutting down (4)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
						}

						buildBuf := new(strings.Builder)
						_, err = io.Copy(buildBuf, reader)
						if err != nil && !strings.Contains(fmt.Sprintf("%s", err.Error()), "Conflict. The container name") {
							log.Printf("[ERROR] Error in IO copy: %s", err)
							log.Printf("[DEBUG] Shutting down (5)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
						} else {
							if strings.Contains(buildBuf.String(), "errorDetail") {
								log.Printf("[ERROR] Docker build:\n%s\nERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), image)
								log.Printf("[DEBUG] Shutting down (6)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}

							log.Printf("[INFO] Successfully downloaded %s", image)
						}

						err = deployApp(dockercli, image, identifier, env, workflowExecution, action.ID)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {

							log.Printf("[ERROR] Failed deploying image for the FOURTH time. Aborting if the image doesn't exist")
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (7)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}

							if strings.Contains(err.Error(), "No such image") {
								//log.Printf("[WARNING] Failed deploying %s from image %s: %s", identifier, image, err)
								log.Printf("[ERROR] Image doesn't exist. Shutting down")
								log.Printf("[DEBUG] Shutting down (8)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}
						}
					}
				}
			}
		} else {

			err = deployApp(dockercli, images[0], identifier, env, workflowExecution, action.ID)
			if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
				if strings.Contains(err.Error(), "exited prematurely") {
					log.Printf("[DEBUG] Shutting down (9)")
					shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
				}

				// Trying to replace with lowercase to deploy again. This seems to work with Dockerhub well.
				// FIXME: Should try to remotely download directly if this persists.
				image = images[1]
				err = deployApp(dockercli, image, identifier, env, workflowExecution, action.ID)
				if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
					if strings.Contains(err.Error(), "exited prematurely") {
						log.Printf("[DEBUG] Shutting down (10)")
						shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
					}

					log.Printf("[DEBUG] Failed deploy. Downloading image %s", image)
					err := downloadDockerImageBackend(topClient, image)
					executed := false
					if err == nil {
						log.Printf("[DEBUG] Downloaded image %s from backend (CLEANUP)", image)
						//err = deployApp(dockercli, image, identifier, env, workflow, action.ID)
						err = deployApp(dockercli, image, identifier, env, workflowExecution, action.ID)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (40)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}
						} else {
							executed = true
						}
					}

					if !executed {
						image = images[2]
						err = deployApp(dockercli, image, identifier, env, workflowExecution, action.ID)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (11)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}

							log.Printf("[WARNING] Failed deploying image THREE TIMES. Attempting to download %s as last resort from backend and dockerhub.", image)

							reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
							if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
								log.Printf("[ERROR] Failed getting %s. The couldn't be find locally, AND is missing.", image)
								log.Printf("[DEBUG] Shutting down (12)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}

							buildBuf := new(strings.Builder)
							_, err = io.Copy(buildBuf, reader)
							if err != nil {
								log.Printf("[ERROR] Error in IO copy: %s", err)
								log.Printf("[DEBUG] Shutting down (13)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							} else {
								if strings.Contains(buildBuf.String(), "errorDetail") {
									log.Printf("[ERROR] Docker build:\n%s\nERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), image)
									log.Printf("[DEBUG] Shutting down (14)")
									shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								}

								log.Printf("[INFO] Successfully downloaded %s", image)
							}
						}

						err = deployApp(dockercli, image, identifier, env, workflowExecution, action.ID)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
							log.Printf("[ERROR] Failed deploying image for the FOURTH time. Aborting if the image doesn't exist")
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (15)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}

							if strings.Contains(err.Error(), "No such image") {
								//log.Printf("[WARNING] Failed deploying %s from image %s: %s", identifier, image, err)
								log.Printf("[ERROR] Image doesn't exist. Shutting down")
								log.Printf("[DEBUG] Shutting down (16)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							}
						}
					}
				}
			}
		}

		log.Printf("[INFO] Adding visited (3): %s\n", action.Label)

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

	if len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions)+extra {
		shutdownCheck := true
		for _, result := range workflowExecution.Results {
			if result.Status == "EXECUTING" {
				// Cleaning up executing stuff
				shutdownCheck = false
				// USED TO BE CONTAINER REMOVAL
				//  FIXME - send POST request to kill the container
				//log.Printf("Should remove (POST request) stopped containers")
				//ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
			}
		}

		if shutdownCheck {
			log.Println("[INFO] BREAKING BECAUSE RESULTS IS SAME LENGTH AS ACTIONS. SHOULD CHECK ALL RESULTS FOR WHETHER THEY'RE DONE")
			validateFinished(workflowExecution)
			log.Printf("[DEBUG] Shutting down (17)")
			shutdown(workflowExecution, "", "", true)
		}
	}

	time.Sleep(time.Duration(sleepTime) * time.Second)
	return
}

func executionInit(workflowExecution shuffle.WorkflowExecution) error {
	parents = map[string][]string{}
	children = map[string][]string{}

	results = workflowExecution.Results

	startAction = workflowExecution.Start
	log.Printf("[INFO] STARTACTION: %s", startAction)
	if len(startAction) == 0 {
		log.Printf("[INFO] Didn't find execution start action. Setting it to workflow start action.")
		startAction = workflowExecution.Workflow.Start
	}

	// Setting up extra counter
	for _, trigger := range workflowExecution.Workflow.Triggers {
		//log.Printf("Appname trigger (0): %s", trigger.AppName)
		if trigger.AppName == "User Input" || trigger.AppName == "Shuffle Workflow" {
			extra += 1
		}
	}

	nextActions = append(nextActions, startAction)
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

		for _, trigger := range workflowExecution.Workflow.Triggers {
			//log.Printf("Appname trigger (0): %s", trigger.AppName)
			if trigger.AppName == "User Input" || trigger.AppName == "Shuffle Workflow" {
				if branch.SourceID == "c9560766-3f85-4589-8324-311acd6be820" {
					log.Printf("BRANCH: %#v", branch)
				}

				if trigger.ID == branch.SourceID {
					log.Printf("[INFO] shuffle.Trigger %s is the source!", trigger.AppName)
					sourceFound = true
				} else if trigger.ID == branch.DestinationID {
					log.Printf("[INFO] shuffle.Trigger %s is the destination!", trigger.AppName)
					destinationFound = true
				}
			}
		}

		if sourceFound {
			parents[branch.DestinationID] = append(parents[branch.DestinationID], branch.SourceID)
		} else {
			log.Printf("[INFO] ID %s was not found in actions! Skipping parent. (TRIGGER?)", branch.SourceID)
		}

		if destinationFound {
			children[branch.SourceID] = append(children[branch.SourceID], branch.DestinationID)
		} else {
			log.Printf("[INFO] ID %s was not found in actions! Skipping child. (TRIGGER?)", branch.SourceID)
		}
	}

	/*
		log.Printf("\n\n\n[INFO] CHILDREN FOUND: %#v", children)
		log.Printf("[INFO] PARENTS FOUND: %#v", parents)
		log.Printf("[INFO] NEXT ACTIONS: %#v\n\n", nextActions)
	*/

	log.Printf("[INFO] shuffle.Actions: %d + Special shuffle.Triggers: %d", len(workflowExecution.Workflow.Actions), extra)
	onpremApps := []string{}
	toExecuteOnprem := []string{}
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
		log.Printf("[INFO] Image: %s", image)
		// Kind of gambling that the image exists.
		if strings.Contains(image, " ") {
			image = strings.ReplaceAll(image, " ", "-")
		}

		// FIXME: Reimplement for speed later
		// Skip to make it faster
		//reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
		//if err != nil {
		//	log.Printf("Failed getting %s. The app is missing or some other issue", image)
		//	shutdown(workflowExecution)
		//}

		////io.Copy(os.Stdout, reader)
		//_ = reader
		//log.Printf("Successfully downloaded and built %s", image)
	}

	return nil
}

func handleDefaultExecution(client *http.Client, req *http.Request, workflowExecution shuffle.WorkflowExecution) error {
	// if no onprem runs (shouldn't happen, but extra check), exit
	// if there are some, load the images ASAP for the app

	err := executionInit(workflowExecution)
	if err != nil {
		log.Printf("[INFO] Workflow setup failed: %s", workflowExecution.ExecutionId, err)
		log.Printf("[DEBUG] Shutting down (18)")
		shutdown(workflowExecution, "", "", true)
	}

	log.Printf("[DEBUG] DEFAULT EXECUTION Startaction: %s", startAction)

	ctx := context.Background()
	setWorkflowExecution(ctx, workflowExecution, false)

	streamResultUrl := fmt.Sprintf("%s/api/v1/streams/results", baseUrl)
	for {
		//fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/executions/%s/abort", baseUrl, workflowExecution.Workflow.ID, workflowExecution.ExecutionId)
		//log.Printf("[INFO] URL: %s", fullUrl)
		req, err := http.NewRequest(
			"POST",
			streamResultUrl,
			bytes.NewBuffer([]byte(data)),
		)

		newresp, err := topClient.Do(req)
		if err != nil {
			log.Printf("[ERROR] Failed making request: %s", err)
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
			log.Printf("[ERROR] Bad statuscode: %d, %s", newresp.StatusCode, string(body))

			if strings.Contains(string(body), "Workflowexecution is already finished") {
				log.Printf("[DEBUG] Shutting down (19)")
				shutdown(workflowExecution, "", "", true)
			}

			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		err = json.Unmarshal(body, &workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("[INFO] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			log.Printf("[DEBUG] Shutting down (20)")
			shutdown(workflowExecution, "", "", true)
		}

		log.Printf("[INFO] Status: %s, Results: %d, actions: %d", workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)
		if workflowExecution.Status != "EXECUTING" {
			log.Printf("[WARNING] Exiting as worker execution has status %s!", workflowExecution.Status)
			log.Printf("[DEBUG] Shutting down (21)")
			shutdown(workflowExecution, "", "", true)
		}

		setWorkflowExecution(ctx, workflowExecution, false)
		//handleExecutionResult(workflowExecution)
	}

	return nil
}

func arrayContains(visited []string, id string) bool {
	found := false
	for _, item := range visited {
		if item == id {
			found = true
			break
		}
	}

	return found
}

func getResult(workflowExecution shuffle.WorkflowExecution, id string) shuffle.ActionResult {
	for _, actionResult := range workflowExecution.Results {
		if actionResult.Action.ID == id {
			return actionResult
		}
	}

	return shuffle.ActionResult{}
}

func getAction(workflowExecution shuffle.WorkflowExecution, id, environment string) shuffle.Action {
	for _, action := range workflowExecution.Workflow.Actions {
		if action.ID == id {
			return action
		}
	}

	for _, trigger := range workflowExecution.Workflow.Triggers {
		if trigger.ID == id {
			return shuffle.Action{
				ID:          trigger.ID,
				AppName:     trigger.AppName,
				Name:        trigger.AppName,
				Environment: environment,
				Label:       trigger.Label,
			}
			log.Printf("FOUND TRIGGER: %#v!", trigger)
		}
	}

	return shuffle.Action{}
}

func runSkipAction(client *http.Client, action shuffle.Action, workflowId, workflowExecutionId, authorization string, configuration string) error {
	timeNow := time.Now().Unix()
	result := shuffle.ActionResult{
		Action:        action,
		ExecutionId:   workflowExecutionId,
		Authorization: authorization,
		Result:        configuration,
		StartedAt:     timeNow,
		CompletedAt:   0,
		Status:        "SUCCESS",
	}

	resultData, err := json.Marshal(result)
	if err != nil {
		return err
	}

	streamUrl := fmt.Sprintf("%s/api/v1/streams", baseUrl)
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(resultData)),
	)

	if err != nil {
		log.Printf("Error building test request: %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("Error running test request: %s", err)
		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body when waiting: %s", err)
		return err
	}

	log.Printf("[INFO] User Input Body: %s", string(body))
	return nil
}

func runUserInput(client *http.Client, action shuffle.Action, workflowId, workflowExecutionId, authorization string, configuration string) error {
	timeNow := time.Now().Unix()
	result := shuffle.ActionResult{
		Action:        action,
		ExecutionId:   workflowExecutionId,
		Authorization: authorization,
		Result:        configuration,
		StartedAt:     timeNow,
		CompletedAt:   0,
		Status:        "WAITING",
	}

	resultData, err := json.Marshal(result)
	if err != nil {
		return err
	}

	streamUrl := fmt.Sprintf("%s/api/v1/streams", baseUrl)
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(resultData)),
	)

	if err != nil {
		log.Printf("Error building test request: %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("Error running test request: %s", err)
		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body when waiting: %s", err)
		return err
	}

	log.Printf("[INFO] User Input Body: %s", string(body))
	return nil
}

func runTestExecution(client *http.Client, workflowId, apikey string) (string, string) {
	executeUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute", baseUrl, workflowId)
	req, err := http.NewRequest(
		"GET",
		executeUrl,
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

	log.Printf("[INFO] Test Body: %s", string(body))
	var workflowExecution shuffle.WorkflowExecution
	err = json.Unmarshal(body, &workflowExecution)
	if err != nil {
		log.Printf("Failed workflowExecution unmarshal: %s", err)
		return "", ""
	}

	return workflowExecution.Authorization, workflowExecution.ExecutionId
}

func handleWorkflowQueue(resp http.ResponseWriter, request *http.Request) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("(3) Failed reading body for workflowqueue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	//log.Printf("Got result: %s", string(body))
	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("Failed shuffle.ActionResult unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// 1. Get the shuffle.WorkflowExecution(ExecutionId) from the database
	// 2. if shuffle.ActionResult.Authentication != shuffle.WorkflowExecution.Authentication -> exit
	// 3. Add to and update actionResult in workflowExecution
	// 4. Push to db
	// IF FAIL: Set executionstatus: abort or cancel

	ctx := context.Background()
	workflowExecution, err := getWorkflowExecution(ctx, actionResult.ExecutionId)
	if err != nil {
		log.Printf("[ERROR] Failed getting execution (workflowqueue) %s: %s", actionResult.ExecutionId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution ID %s because it doesn't exist locally."}`, actionResult.ExecutionId)))
		return
	}

	if workflowExecution.Authorization != actionResult.Authorization {
		log.Printf("[INFO] Bad authorization key when updating node (workflowQueue) %s. Want: %s, Have: %s", actionResult.ExecutionId, workflowExecution.Authorization, actionResult.Authorization)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key"}`)))
		return
	}

	if workflowExecution.Status == "FINISHED" {
		log.Printf("Workflowexecution is already FINISHED. No further action can be taken")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is already finished because it has status %s"}`, workflowExecution.LastNode, workflowExecution.Status)))
		return
	}

	if workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {

		if workflowExecution.Workflow.Configuration.ExitOnError {
			log.Printf("Workflowexecution already has status %s. No further action can be taken", workflowExecution.Status)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is aborted because of %s with result %s and status %s"}`, workflowExecution.LastNode, workflowExecution.Result, workflowExecution.Status)))
			return
		} else {
			log.Printf("Continuing even though it's aborted.")
		}
	}

	results = append(results, actionResult)

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
	runWorkflowExecutionTransaction(ctx, 0, workflowExecution.ExecutionId, actionResult, resp)

}

// Will make sure transactions are always ran for an execution. This is recursive if it fails. Allowed to fail up to 5 times
func runWorkflowExecutionTransaction(ctx context.Context, attempts int64, workflowExecutionId string, actionResult shuffle.ActionResult, resp http.ResponseWriter) {
	//log.Printf("IN WORKFLOWEXECUTION SUB!")
	// Should start a tx for the execution here
	workflowExecution, err := getWorkflowExecution(ctx, workflowExecutionId)
	if err != nil {
		log.Printf("[ERROR] Failed getting execution cache: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution"}`)))
		return
	}

	resultLength := len(workflowExecution.Results)
	setExecution := true

	workflowExecution, dbSave, err := shuffle.ParsedExecutionResult(ctx, *workflowExecution, actionResult, true)
	if err != nil {
		log.Printf("[DEBUG] Rerunning transaction? %s", err)
		if strings.Contains(fmt.Sprintf("%s", err), "Rerun this transaction") {
			workflowExecution, err := getWorkflowExecution(ctx, workflowExecutionId)
			if err != nil {
				log.Printf("[ERROR] Failed getting execution cache (2): %s", err)
				resp.WriteHeader(401)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution (2)"}`)))
				return
			}

			resultLength = len(workflowExecution.Results)
			setExecution = true

			workflowExecution, dbSave, err = shuffle.ParsedExecutionResult(ctx, *workflowExecution, actionResult, false)
			if err != nil {
				log.Printf("[ERROR] Failed execution of parsedexecution (2): %s", err)
				resp.WriteHeader(401)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution (2)"}`)))
				return
			} else {
				log.Printf("[DEBUG] Successfully got ParsedExecution with %d results!", len(workflowExecution.Results))
			}
		} else {
			log.Printf("[ERROR] Failed execution of parsedexecution: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution"}`)))
			return
		}
	}
	//log.Printf(`[INFO] Got result %s from %s`, actionResult.Status, actionResult.Action.ID)
	//dbSave := false

	if len(results) != len(workflowExecution.Results) {
		log.Printf("[DEBUG] There may have been an issue in transaction queue. Result lengths: %d vs %d. Should check which exists the base results, but not in entire execution, then append.", len(results), len(workflowExecution.Results))
	}

	// Validating that action results hasn't changed
	// Handled using cachhing, so actually pretty fast
	cacheKey := fmt.Sprintf("workflowexecution-%s", workflowExecution.ExecutionId)
	if value, found := requestCache.Get(cacheKey); found {
		parsedValue := value.(*shuffle.WorkflowExecution)
		if len(parsedValue.Results) > 0 && len(parsedValue.Results) != resultLength {
			setExecution = false
			if attempts > 5 {
				//log.Printf("\n\nSkipping execution input - %d vs %d. Attempts: (%d)\n\n", len(parsedValue.Results), resultLength, attempts)
			}

			attempts += 1
			if len(workflowExecution.Results) <= len(workflowExecution.Workflow.Actions) {
				runWorkflowExecutionTransaction(ctx, attempts, workflowExecutionId, actionResult, resp)
				return
			}
		}
	}

	if setExecution || workflowExecution.Status == "FINISHED" || workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {
		err = setWorkflowExecution(ctx, *workflowExecution, dbSave)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed setting workflowexecution actionresult: %s"}`, err)))
			return
		}
	} else {
		log.Printf("[INFO] Skipping setexec with status %s", workflowExecution.Status)

		// Just in case. Should MAYBE validate finishing another time as well.
		// This fixes issues with e.g. shuffle.Action -> shuffle.Trigger -> shuffle.Action.
		handleExecutionResult(*workflowExecution)
		//validateFinished(workflowExecution)
	}

	//if newExecutions && len(nextActions) > 0 {
	//	handleExecutionResult(*workflowExecution)
	//}

	//resp.WriteHeader(200)
	//resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func getWorkflowExecution(ctx context.Context, id string) (*shuffle.WorkflowExecution, error) {
	//log.Printf("IN GET WORKFLOW EXEC!")
	cacheKey := fmt.Sprintf("workflowexecution-%s", id)
	if value, found := requestCache.Get(cacheKey); found {
		parsedValue := value.(*shuffle.WorkflowExecution)
		//log.Printf("Found execution for id %s with %d results", parsedValue.ExecutionId, len(parsedValue.Results))

		//validateFinished(*parsedValue)
		return parsedValue, nil
	}

	return &shuffle.WorkflowExecution{}, errors.New("No workflowexecution defined yet")
}

func sendResult(workflowExecution shuffle.WorkflowExecution, data []byte) {
	if workflowExecution.ExecutionSource == "default" {
		log.Printf("[INFO] Not sending backend info since source is default")
		return
	}

	streamUrl := fmt.Sprintf("%s/api/v1/streams", baseUrl)
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		log.Printf("[ERROR] Failed creating finishing request: %s", err)
		log.Printf("[DEBUG] Shutting down (22)")
		shutdown(workflowExecution, "", "", false)
	}

	newresp, err := topClient.Do(req)
	if err != nil {
		log.Printf("[ERROR] Error running finishing request: %s", err)
		log.Printf("[DEBUG] Shutting down (23)")
		shutdown(workflowExecution, "", "", false)
	}

	body, err := ioutil.ReadAll(newresp.Body)
	//log.Printf("[INFO] BACKEND STATUS: %d", newresp.StatusCode)
	if err != nil {
		log.Printf("[ERROR] Failed reading body: %s", err)
	} else {
		log.Printf("[INFO] NEWRESP (from backend): %s", string(body))
	}
}

func validateFinished(workflowExecution shuffle.WorkflowExecution) {
	log.Printf("[INFO] VALIDATION. Status: %s, shuffle.Actions: %d, Extra: %d, Results: %d\n", workflowExecution.Status, len(workflowExecution.Workflow.Actions), extra, len(workflowExecution.Results))

	//if len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions)+extra {
	if (len(environments) == 1 && requestsSent == 0 && len(workflowExecution.Results) >= 1) || (len(workflowExecution.Results) >= len(workflowExecution.Workflow.Actions) && len(workflowExecution.Workflow.Actions) > 0) {
		requestsSent += 1
		//log.Printf("[FINISHED] Should send full result to %s", baseUrl)

		//data = fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, executionId, authorization)
		shutdownData, err := json.Marshal(workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed to unmarshal data for backend")
			log.Printf("[DEBUG] Shutting down (24)")
			shutdown(workflowExecution, "", "", true)
		}

		sendResult(workflowExecution, shutdownData)
	}
}

func handleGetStreamResults(resp http.ResponseWriter, request *http.Request) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body for stream result queue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("Failed shuffle.ActionResult unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	ctx := context.Background()
	workflowExecution, err := getWorkflowExecution(ctx, actionResult.ExecutionId)
	if err != nil {
		//log.Printf("Failed getting execution (streamresult) %s: %s", actionResult.ExecutionId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key or execution_id might not exist."}`)))
		return
	}

	// Authorization is done here
	if workflowExecution.Authorization != actionResult.Authorization {
		log.Printf("Bad authorization key when getting stream results %s.", actionResult.ExecutionId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key or execution_id might not exist."}`)))
		return
	}

	newjson, err := json.Marshal(workflowExecution)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking workflow execution"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newjson)

}

func setWorkflowExecution(ctx context.Context, workflowExecution shuffle.WorkflowExecution, dbSave bool) error {
	if len(workflowExecution.ExecutionId) == 0 {
		log.Printf("[INFO] Workflowexecution executionId can't be empty.")
		return errors.New("ExecutionId can't be empty.")
	}

	cacheKey := fmt.Sprintf("workflowexecution-%s", workflowExecution.ExecutionId)
	requestCache.Set(cacheKey, &workflowExecution, cache.DefaultExpiration)

	handleExecutionResult(workflowExecution)
	validateFinished(workflowExecution)

	// FIXME: Should this shutdown OR send the result?
	// The worker may not be running the backend hmm
	if dbSave {
		if workflowExecution.ExecutionSource == "default" {
			log.Printf("[DEBUG] Shutting down (25)")
			shutdown(workflowExecution, "", "", true)
			//log.Printf("[INFO] Not sending backend info since source is default")
			//return
		} else {
			log.Printf("[DEBUG] NOT shutting down with dbSave (%s)", workflowExecution.ExecutionSource)
		}

	}

	return nil
}

// GetLocalIP returns the non loopback local IP of the host
func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, address := range addrs {
		// check the address type and if it is not a loopback the display it
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return ""
}

func getAvailablePort() (net.Listener, error) {
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		log.Printf("[WARNING] Failed to assign port by default. Defaulting to 5001")
		//return ":5001"
		return nil, err
	}

	return listener, nil
	//return fmt.Sprintf(":%d", port)
}

func webserverSetup(workflowExecution shuffle.WorkflowExecution) net.Listener {
	hostname := getLocalIP()

	// FIXME: This MAY not work because of speed between first
	// container being launched and port being assigned to webserver
	listener, err := getAvailablePort()
	if err != nil {
		log.Printf("Failed to created listener: %s", err)
		log.Printf("[DEBUG] Shutting down (26)")
		shutdown(workflowExecution, "", "", true)
	}
	port := listener.Addr().(*net.TCPAddr).Port

	log.Printf("\n\nStarting webserver on port %d with hostname: %s\n\n", port, hostname)
	log.Printf("OLD HOSTNAME: %s", appCallbackUrl)
	appCallbackUrl = fmt.Sprintf("http://%s:%d", hostname, port)
	log.Printf("NEW HOSTNAME: %s", appCallbackUrl)

	return listener
}

func runWebserver(listener net.Listener) {
	r := mux.NewRouter()
	r.HandleFunc("/api/v1/streams", handleWorkflowQueue).Methods("POST")
	r.HandleFunc("/api/v1/streams/results", handleGetStreamResults).Methods("POST", "OPTIONS")
	http.Handle("/", r)

	//log.Fatal(http.ListenAndServe(port, nil))
	log.Fatal(http.Serve(listener, nil))
}

func downloadDockerImageBackend(client *http.Client, imageName string) error {
	log.Printf("[DEBUG] Trying to download image %s from backend as it doesn't exist", imageName)
	data := fmt.Sprintf(`{"name": "%s"}`, imageName)
	dockerImgUrl := fmt.Sprintf("%s/api/v1/get_docker_image", baseUrl)

	req, err := http.NewRequest(
		"POST",
		dockerImgUrl,
		bytes.NewBuffer([]byte(data)),
	)

	authorization := os.Getenv("AUTHORIZATION")
	if len(authorization) > 0 {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authorization))
	} else {
		log.Printf("[WARNING] No auth found - running backend download without it.")
		//req.Header.Add("Authorization", fmt.Sprintf("Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4"))
		//return
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed request: %s", err)
		return err
	}

	if newresp.StatusCode != 200 {
		log.Printf("[ERROR] Docker download for image %s (backend) StatusCode (1): %d", imageName, newresp.StatusCode)
		return errors.New(fmt.Sprintf("Failed to get image - status code %d", newresp.StatusCode))
	}

	newImageName := strings.Replace(imageName, "/", "_", -1)
	newFileName := newImageName + ".tar"

	tar, err := os.Create(newFileName)
	if err != nil {
		log.Printf("[WARNING] Failed creating file: %s", err)
		return err
	}

	defer tar.Close()
	_, err = io.Copy(tar, newresp.Body)
	if err != nil {
		log.Printf("[WARNING] Failed response body copying: %s", err)
		return err
	}
	tar.Seek(0, 0)

	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client (3): %s", err)
		return err
	}

	imageLoadResponse, err := dockercli.ImageLoad(context.Background(), tar, true)
	if err != nil {
		log.Printf("[ERROR] Error loading: %s", err)
		return err
	}

	body, err := ioutil.ReadAll(imageLoadResponse.Body)
	if err != nil {
		log.Printf("[ERROR] Error reading: %s", err)
		return err
	}

	if strings.Contains(string(body), "no such file") {
		return errors.New(string(body))
	}

	os.Remove(newFileName)

	log.Printf("[INFO] Successfully loaded image %s: %s", imageName, string(body))
	return nil
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

	//imageName := fmt.Sprintf("%s/%s:shuffle_openapi_1.0.0", registryName, baseimagename)
	//downloadDockerImageBackend(client, imageName)

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
		log.Printf("[INFO] Running normal execution with auth %s and ID %s", authorization, executionId)
	}

	workflowExecution := shuffle.WorkflowExecution{
		ExecutionId: executionId,
	}
	if len(authorization) == 0 {
		log.Println("[INFO] No AUTHORIZATION key set in env")
		log.Printf("[DEBUG] Shutting down (27)")
		shutdown(workflowExecution, "", "", false)
	}

	if len(executionId) == 0 {
		log.Println("[INFO] No EXECUTIONID key set in env")
		log.Printf("[DEBUG] Shutting down (28)")
		shutdown(workflowExecution, "", "", false)
	}

	data = fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, executionId, authorization)
	streamResultUrl := fmt.Sprintf("%s/api/v1/streams/results", baseUrl)
	req, err := http.NewRequest(
		"POST",
		streamResultUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		log.Println("[ERROR] Failed making request builder for backend")
		log.Printf("[DEBUG] Shutting down (29)")
		shutdown(workflowExecution, "", "", true)
	}
	topClient = client

	firstRequest := true
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
			log.Printf("[ERROR] %s\nStatusCode (1): %d", string(body), newresp.StatusCode)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		err = json.Unmarshal(body, &workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if firstRequest {
			firstRequest = false
			//workflowExecution.StartedAt = int64(time.Now().Unix())

			cacheKey := fmt.Sprintf("workflowexecution-%s", workflowExecution.ExecutionId)
			requestCache = cache.New(5*time.Minute, 10*time.Minute)
			requestCache.Set(cacheKey, &workflowExecution, cache.DefaultExpiration)
			for _, action := range workflowExecution.Workflow.Actions {
				found := false
				for _, environment := range environments {
					if action.Environment == environment {
						found = true
						break
					}
				}

				if !found {
					environments = append(environments, action.Environment)
				}
			}

			// Checks if a subflow is child of the startnode, as sub-subflows aren't working properly yet
			childNodes := shuffle.FindChildNodes(workflowExecution, workflowExecution.Start)
			log.Printf("[DEBUG] Looking for subflow in %#v to check execution pattern as child of %s", childNodes, workflowExecution.Start)
			subflowFound := false
			for _, childNode := range childNodes {
				for _, trigger := range workflowExecution.Workflow.Triggers {
					if trigger.ID != childNode {
						continue
					}

					if trigger.AppName == "Shuffle Workflow" {
						subflowFound = true
						break
					}
				}

				if subflowFound {
					break
				}
			}

			log.Printf("\n\nEnvironments: %s. Source: %s. 1 env = webserver, 0 or >1 = default. Subflow exists: %#v\n\n", environments, workflowExecution.ExecutionSource, subflowFound)
			if len(environments) == 1 && workflowExecution.ExecutionSource != "default" && !subflowFound {
				log.Printf("\n\n[INFO] Running OPTIMIZED execution (not manual)\n\n")
				listener := webserverSetup(workflowExecution)
				err := executionInit(workflowExecution)
				if err != nil {
					log.Printf("[INFO] Workflow setup failed: %s", workflowExecution.ExecutionId, err)
					log.Printf("[DEBUG] Shutting down (30)")
					shutdown(workflowExecution, "", "", true)
				}

				go func() {
					time.Sleep(time.Duration(1))
					handleExecutionResult(workflowExecution)
				}()

				runWebserver(listener)
				//log.Printf("Before wait")
				//wg := sync.WaitGroup{}
				//wg.Add(1)
				//wg.Wait()
			} else {
				log.Printf("\n\n[INFO] Running NON-OPTIMIZED execution for type %s with %d environments. This only happens when ran manually. Status: %s\n\n", workflowExecution.ExecutionSource, len(environments), workflowExecution.Status)
				//err := executionInit(workflowExecution)
				//if err != nil {
				//	log.Printf("[INFO] Workflow setup failed: %s", workflowExecution.ExecutionId, err)
				//	shutdown(workflowExecution, "", "", true)
				//}
			}
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("[INFO] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			log.Printf("[DEBUG] Shutting down (31)")
			shutdown(workflowExecution, "", "", true)
		}

		if workflowExecution.Status == "EXECUTING" || workflowExecution.Status == "RUNNING" {
			//log.Printf("Status: %s", workflowExecution.Status)
			err = handleDefaultExecution(client, req, workflowExecution)
			if err != nil {
				log.Printf("[INFO] Workflow %s is finished: %s", workflowExecution.ExecutionId, err)
				log.Printf("[DEBUG] Shutting down (32)")
				shutdown(workflowExecution, "", "", true)
			}
		} else {
			log.Printf("[INFO] Workflow %s has status %s. Exiting worker.", workflowExecution.ExecutionId, workflowExecution.Status)
			log.Printf("[DEBUG] Shutting down (33)")
			shutdown(workflowExecution, workflowExecution.Workflow.ID, "", true)
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}
