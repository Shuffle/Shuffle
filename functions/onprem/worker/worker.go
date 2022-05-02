package main

import (
	"github.com/shuffle/shuffle-shared"

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
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	//"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/swarm"
	dockerclient "github.com/docker/docker/client"
	//"github.com/go-git/go-billy/v5/memfs"

	//newdockerclient "github.com/fsouza/go-dockerclient"
	//"github.com/satori/go.uuid"

	"github.com/gorilla/mux"
	"github.com/patrickmn/go-cache"
	"github.com/satori/go.uuid"

	// No necessary outside shared
	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
)

// This is getting out of hand :)
var environment = os.Getenv("ENVIRONMENT_NAME")
var baseUrl = os.Getenv("BASE_URL")
var appCallbackUrl = os.Getenv("BASE_URL")
var cleanupEnv = strings.ToLower(os.Getenv("CLEANUP"))
var dockerApiVersion = strings.ToLower(os.Getenv("DOCKER_API_VERSION"))
var swarmNetworkName = os.Getenv("SHUFFLE_SWARM_NETWORK_NAME")
var timezone = os.Getenv("TZ")
var baseimagename = "frikky/shuffle"
var registryName = "registry.hub.docker.com"
var sleepTime = 2
var requestCache *cache.Cache
var topClient *http.Client
var data string
var requestsSent = 0
var appsInitialized = false

var hostname string

/*
var environments []string
var parents map[string][]string
var children map[string][]string
var visited []string
var executed []string
var nextActions []string
var extra int
var startAction string
*/
//var results []shuffle.ActionResult
//var allLogs map[string]string
//var containerIds []string
var downloadedImages []string

// Images to be autodeployed in the latest version of Shuffle.
var autoDeploy = map[string]string{
	"shuffle-subflow:1.0.0": "frikky/shuffle:shuffle-subflow_1.0.0",
	"http:1.3.0":            "frikky/shuffle:http_1.3.0",
	"shuffle-tools:1.2.0":   "frikky/shuffle:shuffle-tools_1.2.0",
	"testing:1.0.0":         "frikky/shuffle:testing_1.0.0",
}

//fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, action.ID)

// New Worker mappings
var portMappings map[string]int
var baseport = 33333

type UserInputSubflow struct {
	Argument    string `json:"execution_argument"`
	ContinueUrl string `json:"continue_url"`
	CancelUrl   string `json:"cancel_url"`
}

// removes every container except itself (worker)
func shutdown(workflowExecution shuffle.WorkflowExecution, nodeId string, reason string, handleResultSend bool) {
	log.Printf("[INFO][%s] Shutdown (%s) started with reason %#v. Result amount: %d. ResultsSent: %d, Send result: %#v, Parenent: %#v", workflowExecution.ExecutionId, workflowExecution.Status, reason, len(workflowExecution.Results), requestsSent, handleResultSend, workflowExecution.ExecutionParent)
	//reason := "Error in execution"

	sleepDuration := 1
	if handleResultSend && requestsSent < 2 {
		shutdownData, err := json.Marshal(workflowExecution)
		if err == nil {
			sendResult(workflowExecution, shutdownData)
			log.Printf("[WARNING][%s] Sent shutdown update with %d results and result value %s", workflowExecution.ExecutionId, len(workflowExecution.Results), reason)
		} else {
			log.Printf("[WARNING][%s] Failed to send update: %s", workflowExecution.ExecutionId, err)
		}

		time.Sleep(time.Duration(sleepDuration) * time.Second)
	}

	// Might not be necessary because of cleanupEnv hostconfig autoremoval
	//if cleanupEnv == "true" && len(containerIds) > 0 && (os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm") {
	if cleanupEnv == "true" && (os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm") {
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
		if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
			log.Printf("[DEBUG][%s] NOT cleaning up containers. IDS: %d, CLEANUP env: %s", workflowExecution.ExecutionId, 0, cleanupEnv)
		}
	}

	if len(reason) > 0 && len(nodeId) > 0 {
		//log.Printf("[INFO] Running abort of workflow because it should be finished")

		abortUrl := fmt.Sprintf("%s/api/v1/workflows/%s/executions/%s/abort", baseUrl, workflowExecution.Workflow.ID, workflowExecution.ExecutionId)
		path := fmt.Sprintf("?reason=%s", url.QueryEscape(reason))
		if len(nodeId) > 0 {
			path += fmt.Sprintf("&node=%s", url.QueryEscape(nodeId))
		}
		if len(environment) > 0 {
			path += fmt.Sprintf("&env=%s", url.QueryEscape(environment))
		}

		//fmt.Printf(url.QueryEscape(query))
		abortUrl += path
		log.Printf("[DEBUG][%s] Abort URL: %s", workflowExecution.ExecutionId, abortUrl)

		req, err := http.NewRequest(
			"GET",
			abortUrl,
			nil,
		)

		if err != nil {
			log.Printf("[INFO][%s] Failed building request: %s", workflowExecution.ExecutionId, err)
		}

		// FIXME: Add an API call to the backend
		if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
			authorization := os.Getenv("AUTHORIZATION")
			if len(authorization) > 0 {
				req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authorization))
			} else {
				log.Printf("[ERROR][%s] No authorization specified for abort", workflowExecution.ExecutionId)
			}
		} else {
			req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", workflowExecution.Authorization))
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
				log.Printf("[INFO][%s] Running with HTTP proxy %s (env: HTTP_PROXY)", workflowExecution.ExecutionId, httpProxy)
			}
			if len(httpsProxy) > 0 {
				log.Printf("[INFO][%s] Running with HTTPS proxy %s (env: HTTPS_PROXY)", workflowExecution.ExecutionId, httpsProxy)
			}
		}

		//log.Printf("[DEBUG][%s] All App Logs: %#v", workflowExecution.ExecutionId, allLogs)
		_, err = client.Do(req)
		if err != nil {
			log.Printf("[WARNING][%s] Failed abort request: %s", workflowExecution.ExecutionId, err)
		}
	} else {
		//log.Printf("[INFO][%s] NOT running abort during shutdown.", workflowExecution.ExecutionId)
	}

	log.Printf("[INFO][%s] Finished shutdown (after %d seconds). ", workflowExecution.ExecutionId, sleepDuration)
	//Finished shutdown (after %d seconds). ", sleepDuration)

	// Allows everything to finish in subprocesses (apps)
	if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		time.Sleep(time.Duration(sleepDuration) * time.Second)
		os.Exit(3)
	} else {
		log.Printf("[DEBUG][%s] Sending result and resetting values (K8s & Swarm).", workflowExecution.ExecutionId)
		//UpdateExecutionVariables(ctx, workflowExecution.ExecutionId, startAction, children, parents, visited, executed, nextActions, environments, extra)

		/*
			environments = []string{}
			parents = map[string][]string{}
			children = map[string][]string{}
			visited = []string{}
			executed = []string{}
			nextActions = []string{}
			containerIds = []string{}
			extra = 0
			startAction = ""
			results = []shuffle.ActionResult{}
			allLogs = map[string]string{}
		*/
		//requestsSent = 0
		//executionRunning = false
	}
	//cacheKey := fmt.Sprintf("workflowexecution-%s", workflowExecution.ExecutionId)
}

// Deploys the internal worker whenever something happens
func deployApp(cli *dockerclient.Client, image string, identifier string, env []string, workflowExecution shuffle.WorkflowExecution, action shuffle.Action) error {
	// form basic hostConfig
	ctx := context.Background()

	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		//identifier := fmt.Sprintf("%s_%s_%s_%s", appname, appversion, action.ID, workflowExecution.ExecutionId)

		appName := strings.Replace(identifier, fmt.Sprintf("_%s", action.ID), "", -1)
		appName = strings.Replace(appName, fmt.Sprintf("_%s", workflowExecution.ExecutionId), "", -1)
		appName = strings.ToLower(appName)
		//log.Printf("[INFO][%s] New appname: %s, image: %s", workflowExecution.ExecutionId, appName, image)

		if !shuffle.ArrayContains(downloadedImages, image) {
			log.Printf("[DEBUG] Downloading image %s from backend as it's first iteration for this image on the worker.", image)
			// FIXME: Not caring if it's ok or not. Just continuing
			// This is working as intended, just designed to download an updated
			// image on every Orborus/new worker restart.

			// Running as coroutine for eventual completeness
			//go downloadDockerImageBackend(&http.Client{}, image)
			// FIXME: With goroutines it got too much trouble of deploying with an older version
			// Allowing slow startups, as long as it's eventually fast, and uses the same registry as on host.
			downloadDockerImageBackend(&http.Client{}, image)
		}

		exposedPort, err := findAppInfo(image, appName)
		if err != nil {
			log.Printf("[ERROR] Failed finding and creating port for %s: %s", appName, err)
			return err
		}

		log.Printf("[DEBUG][%s] Should run towards port %d for app %s. DELAY: %d", workflowExecution.ExecutionId, exposedPort, appName, action.ExecutionDelay)
		if action.ExecutionDelay > 0 {
			//log.Printf("[DEBUG] Running app %s with delay of %d", action.Name, action.ExecutionDelay)
			waitTime := time.Duration(action.ExecutionDelay) * time.Second

			time.AfterFunc(waitTime, func() {
				err = sendAppRequest(baseUrl, appName, exposedPort, action, workflowExecution)
				if err != nil {
					log.Printf("[ERROR] Failed sending SCHEDULED request to app %s on port %d: %s", appName, exposedPort, err)
				}
			})

		} else {
			//log.Printf("[DEBUG] Running app %s NORMALLY as there is no delay set", action.Name)
			err = sendAppRequest(baseUrl, appName, exposedPort, action, workflowExecution)
			if err != nil {
				log.Printf("[ERROR] Failed sending request to app %s on port %d: %s", appName, exposedPort, err)
				return err
			}
		}

		//log.Printf("[DEBUG] Successfully ran request towards port %d for app %s", exposedPort, appName)
		return nil
	}

	// Max 10% CPU every second
	//CPUShares: 128,
	//CPUQuota:  10000,
	//CPUPeriod: 100000,
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type: "json-file",
			Config: map[string]string{
				"max-size": "10m",
			},
		},
		Resources: container.Resources{},
	}

	if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:worker-%s", workflowExecution.ExecutionId))
		//log.Printf("Environments: %#v", env)
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
		//log.Printf("[WARNING] Not mounting folders")
	}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	// Checking as late as possible, just in case.
	newExecId := fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, action.ID)
	_, err := shuffle.GetCache(ctx, newExecId)
	if err == nil {
		log.Printf("\n\n[DEBUG] Result for %s already found - returning\n\n", newExecId)
		return nil
	}

	cacheData := []byte("1")
	err = shuffle.SetCache(ctx, newExecId, cacheData)
	if err != nil {
		log.Printf("[WARNING] Failed setting cache for action %s: %s", newExecId, err)
	} else {
		log.Printf("[DEBUG] Adding %s to cache. Name: %s", newExecId, action.Name)
	}

	if action.ExecutionDelay > 0 {
		log.Printf("[DEBUG] Running app %s in docker with delay of %d", action.Name, action.ExecutionDelay)
		waitTime := time.Duration(action.ExecutionDelay) * time.Second

		time.AfterFunc(waitTime, func() {
			DeployContainer(ctx, cli, config, hostConfig, identifier, workflowExecution, newExecId)
		})
	} else {
		log.Printf("[DEBUG] Running app %s in docker NORMALLY as there is no delay set with identifier %s", action.Name, identifier)
		returnvalue := DeployContainer(ctx, cli, config, hostConfig, identifier, workflowExecution, newExecId)
		log.Printf("[DEBUG] Normal deploy ret: %s", returnvalue)
		return returnvalue
	}

	return nil
}

func DeployContainer(ctx context.Context, cli *dockerclient.Client, config *container.Config, hostConfig *container.HostConfig, identifier string, workflowExecution shuffle.WorkflowExecution, newExecId string) error {
	cont, err := cli.ContainerCreate(
		ctx,
		config,
		hostConfig,
		nil,
		nil,
		identifier,
	)

	if err != nil {
		//log.Printf("[ERROR] Failed creating container: %s", err)
		if !strings.Contains(err.Error(), "Conflict. The container name") {
			log.Printf("[ERROR] Container CREATE error (1): %s", err)

			cacheErr := shuffle.DeleteCache(ctx, newExecId)
			if cacheErr != nil {
				log.Printf("[ERROR] FAILED Deleting cache for %s: %s", newExecId, cacheErr)
			}

			return err
		} else {
			parsedUuid := uuid.NewV4()
			identifier = fmt.Sprintf("%s-%s", identifier, parsedUuid)
			//hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:worker-%s", workflowExecution.ExecutionId))

			log.Printf("[INFO] 2 - Identifier: %s", identifier)
			cont, err = cli.ContainerCreate(
				context.Background(),
				config,
				hostConfig,
				nil,
				nil,
				identifier,
			)

			if err != nil {
				log.Printf("[ERROR] Container create error (2): %s", err)

				cacheErr := shuffle.DeleteCache(ctx, newExecId)
				if cacheErr != nil {
					log.Printf("[ERROR] FAILED Deleting cache for %s: %s", newExecId, cacheErr)
				}

				return err
			}

			//log.Printf("[DEBUG] Made new container ID
		}
	}

	err = cli.ContainerStart(ctx, cont.ID, types.ContainerStartOptions{})
	if err != nil {
		if strings.Contains(fmt.Sprintf("%s", err), "cannot join network") || strings.Contains(fmt.Sprintf("%s", err), "No such container") {
			parsedUuid := uuid.NewV4()
			identifier = fmt.Sprintf("%s-%s-nonetwork", identifier, parsedUuid)
			hostConfig = &container.HostConfig{
				LogConfig: container.LogConfig{
					Type: "json-file",
					Config: map[string]string{
						"max-size": "10m",
					},
				},
				Resources: container.Resources{},
			}

			cont, err = cli.ContainerCreate(
				context.Background(),
				config,
				hostConfig,
				nil,
				nil,
				identifier,
			)

			if err != nil {
				log.Printf("[ERROR] Container create error (3): %s", err)

				cacheErr := shuffle.DeleteCache(ctx, newExecId)
				if cacheErr != nil {
					log.Printf("[ERROR] FAILED Deleting cache for %s: %s", newExecId, cacheErr)
				}

				return err
			}

			log.Printf("[DEBUG] Running secondary check without network with worker")
			err = cli.ContainerStart(ctx, cont.ID, types.ContainerStartOptions{})
		}

		if err != nil {
			log.Printf("[ERROR] Failed to start container in environment %s: %s", environment, err)

			cacheErr := shuffle.DeleteCache(ctx, newExecId)
			if cacheErr != nil {
				log.Printf("[ERROR] FAILED Deleting cache for %s: %s", newExecId, cacheErr)
			}

			//shutdown(workflowExecution, workflowExecution.Workflow.ID, true)
			return err
		}
	}

	log.Printf("[INFO] Container %s was created for %s", cont.ID, identifier)

	// Waiting to see if it exits.. Stupid, but stable(r)
	if workflowExecution.ExecutionSource != "default" {
		log.Printf("[INFO] Handling NON-default execution source %s - NOT waiting or validating!", workflowExecution.ExecutionSource)
	} else if workflowExecution.ExecutionSource == "default" {
		log.Printf("[INFO] Handling DEFAULT execution source %s - SKIPPING wait anyway due to exited issues!", workflowExecution.ExecutionSource)
	}

	log.Printf("[DEBUG] Deployed container ID %s", cont.ID)
	//containerIds = append(containerIds, cont.ID)

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

	if apikey == "" {
		log.Printf("[DEBUG][%s] Replacing apikey with parent auth", workflowExecution.ExecutionId)
		apikey = workflowExecution.Authorization
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
			log.Printf("[WARNING] Error building test request (4): %s", err)
			return err
		}

		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apikey))
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("[DEBUG] Error running test request (4): %s", err)
			return err
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("[WARNING] Failed reading body when waiting (4): %s", err)
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
		log.Printf("[WARNING] Error building test request (5): %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[WARNING] Error running test request (5): %s", err)
		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body when waiting (5): %s", err)
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
	ctx := context.Background()

	startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)
	log.Printf("[DEBUG][%s] Getting info for %s. Extra: %d", workflowExecution.ExecutionId, workflowExecution.ExecutionId, extra)
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client (3): %s", err)
		return
	}

	log.Printf("[INFO][%s] Inside execution results with %d / %d results", workflowExecution.ExecutionId, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)

	if len(startAction) == 0 {
		startAction = workflowExecution.Start
		if len(startAction) == 0 {
			log.Printf("Didn't find execution start action. Setting it to workflow start action.")
			startAction = workflowExecution.Workflow.Start
		}
	}

	//log.Printf("NEXTACTIONS: %s", nextActions)
	//if len(nextActions) == 0 {
	//	nextActions = append(nextActions, startAction)
	//}

	queueNodes := []string{}
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
						//log.Printf("[INFO][%s] Adding visited (1): %s", workflowExecution.ExecutionId, item.Action.Label)
						visited = append(visited, item.Action.ID)
					}
				} else {
					log.Printf("[INFO][%s] Continuing %s as all parents are NOT done", workflowExecution.ExecutionId, item.Action.Label)
					appendActions = append(appendActions, item.Action.ID)
				}
			} else {
				if item.Status == "FINISHED" {
					//log.Printf("[INFO][%s] Adding visited (2): %s", workflowExecution.ExecutionId, item.Action.Label)
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
				//log.Printf("APPENDED NODES: %#v", appendActions)
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
		log.Printf("[INFO][%s] No next action. Finished? Result vs shuffle.Actions: %d - %d", workflowExecution.ExecutionId, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
		exit := true
		for _, item := range workflowExecution.Results {
			if item.Status == "EXECUTING" {
				exit = false
				break
			}
		}

		if len(environments) == 1 {
			log.Printf("[INFO][%s] Should send results to the backend because environments are %s", workflowExecution.ExecutionId, environments)
			validateFinished(workflowExecution)
		}

		if exit && len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions) {
			log.Printf("[DEBUG][%s] Shutting down (1)", workflowExecution.ExecutionId)
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
	// FIXME: In this loop, there may be an ordering issue where a subflow and other triggers don't wait for all parent nodes to finish, due to that happening farther down in the loop. That means they may execute with only a single parent node actually being finishing.
	// FIXME: Look at how to fix it by moving it farther down. PS: Fixing this, means it should be fixed in the worker too. Make them generic in shuffle mod
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

			continue
		}

		// get action status
		actionResult := getResult(workflowExecution, nextAction)
		if actionResult.Action.ID == action.ID {
			//log.Printf("[INFO] %s already has status %s.", action.ID, actionResult.Status)

			continue
		} else {
			log.Printf("[INFO][%s] %s:%s has no status result yet. Should execute.", workflowExecution.ExecutionId, action.Name, action.ID)

			// Check cache here too.
		}

		// Rerunning this multiple places, as timing is the hardest part here.
		newExecId := fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, nextAction)
		_, err := shuffle.GetCache(ctx, newExecId)
		if err == nil {
			//log.Printf("\n\n[DEBUG] Already found %s (1) - returning\n\n", newExecId)
			continue
		}

		/*
			cacheData := []byte("1")
			err = shuffle.SetCache(ctx, newExecId, cacheData)
			if err != nil {
				log.Printf("[WARNING] Failed setting cache for action %s: %s", newExecId, err)
			} else {
				log.Printf("\n\n[DEBUG] Adding %s to cache. Name: %s\n\n", newExecId, action.Name)
			}
		*/

		if action.AppName == "Shuffle Tools" && (action.Name == "skip_me" || action.Name == "router" || action.Name == "route") {
			topClient := &http.Client{
				Timeout: 3 * time.Second,
			}
			err := runSkipAction(topClient, action, workflowExecution.Workflow.ID, workflowExecution.ExecutionId, workflowExecution.Authorization, "SKIPPED")
			if err != nil {
				log.Printf("[DEBUG][%s] Error in skipme for %s: %s", workflowExecution.ExecutionId, action.Label, err)
			} else {
				//log.Printf("[INFO][%s] Adding visited (4): %s", workflowExecution.ExecutionId, action.Label)

				visited = append(visited, action.ID)
				executed = append(executed, action.ID)
				continue
			}
		} else if action.AppName == "Shuffle Workflow" {
			//log.Printf("SHUFFLE WORKFLOW: %#v", action)
			branchesFound := 0
			parentFinished := 0

			for _, item := range workflowExecution.Workflow.Branches {
				if item.DestinationID == action.ID {
					branchesFound += 1

					for _, result := range workflowExecution.Results {
						if result.Action.ID == item.SourceID {
							// Check for fails etc
							if result.Status == "SUCCESS" || result.Status == "SKIPPED" {
								parentFinished += 1
							} else {
								log.Printf("Parent %s has status %s", result.Action.Label, result.Status)
							}

							break
						}
					}
				}
			}

			log.Printf("[DEBUG] Should execute %s (?). Branches: %d. Parents done: %d", action.AppName, branchesFound, parentFinished)
			if branchesFound == parentFinished {
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
				action.ExecutionDelay = trigger.ExecutionDelay
				action.Label = trigger.Label
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

				action.Parameters = append(action.Parameters, shuffle.WorkflowAppActionParameter{
					Name:  "source_node",
					Value: trigger.ID,
				})

				action.Parameters = append(action.Parameters, shuffle.WorkflowAppActionParameter{
					Name:  "source_auth",
					Value: workflowExecution.Authorization,
				})

				//trigger.LargeImage = ""
				//err = handleSubworkflowExecution(client, workflowExecution, trigger, action)
				//if err != nil {
				//	log.Printf("[ERROR] Failed to execute subworkflow: %s", err)
				//} else {
				//	log.Printf("[INFO] Executed subworkflow!")
				//}
				//continue
			}
		} else if action.AppName == "User Input" {
			log.Printf("[DEBUG] RUNNING USER INPUT!")
			branchesFound := 0
			parentFinished := 0

			for _, item := range workflowExecution.Workflow.Branches {
				if item.DestinationID == action.ID {
					branchesFound += 1

					for _, result := range workflowExecution.Results {
						if result.Action.ID == item.SourceID {
							// Check for fails etc
							if result.Status == "SUCCESS" || result.Status == "SKIPPED" {
								parentFinished += 1
							} else {
								log.Printf("Parent %s has status %s", result.Action.Label, result.Status)
							}

							break
						}
					}
				}
			}

			log.Printf("[DEBUG] Should execute %s (?). Branches: %d. Parents done: %d", action.AppName, branchesFound, parentFinished)
			if branchesFound == parentFinished {

				if action.ID == workflowExecution.Start {
					log.Printf("[DEBUG] Skipping user input because it's the startnode")
					visited = append(visited, action.ID)
					executed = append(executed, action.ID)
					continue
				} else {
					log.Printf("[DEBUG] Should stop after this iteration because it's user-input based. %#v", action)
					trigger := shuffle.Trigger{}
					for _, innertrigger := range workflowExecution.Workflow.Triggers {
						if innertrigger.ID == action.ID {
							trigger = innertrigger
							break
						}
					}

					action.Label = action.Label
					action.Parameters = []shuffle.WorkflowAppActionParameter{}
					for _, parameter := range trigger.Parameters {
						action.Parameters = append(action.Parameters, shuffle.WorkflowAppActionParameter{
							Name:  parameter.Name,
							Value: parameter.Value,
						})
					}

					trigger.LargeImage = ""
					triggerData, err := json.Marshal(trigger)
					if err != nil {
						log.Printf("[WARNING] Failed unmarshalling action: %s", err)
						triggerData = []byte("Failed unmarshalling. Cancel execution!")
					}

					err = runUserInput(topClient, action, workflowExecution.Workflow.ID, workflowExecution, workflowExecution.Authorization, string(triggerData), dockercli)
					if err != nil {
						log.Printf("[ERROR] Failed launching backend magic: %s", err)
						os.Exit(3)
					} else {
						log.Printf("[INFO] Launched user input node succesfully!")
						os.Exit(3)
					}

					break
				}
			}
		} else {
			//log.Printf("Handling action %#v", action)
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

		stats, err := dockercli.ContainerInspect(context.Background(), identifier)
		if err != nil || stats.ContainerJSONBase.State.Status != "running" {
			// REMOVE
			if err == nil {
				log.Printf("[DEBUG][%s] Docker Container Status: %s, should kill: %s", workflowExecution.ExecutionId, stats.ContainerJSONBase.State.Status, identifier)
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
		log.Printf("[INFO][%s] Time to execute %s (%s) with app %s:%s, function %s, env %s with %d parameters.", workflowExecution.ExecutionId, action.ID, action.Label, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))

		actionData, err := json.Marshal(action)
		if err != nil {
			log.Printf("[WARNING] Failed unmarshalling action: %s", err)
			continue
		}

		if action.AppID == "0ca8887e-b4af-4e3e-887c-87e9d3bc3d3e" {
			log.Printf("[DEBUG] Should run filter: %#v\n\n", action)
			runFilter(workflowExecution, action)
			continue
		}

		executionData, err := json.Marshal(workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed marshalling executiondata: %s", err)
			executionData = []byte("")
		}

		// Sending full execution so that it won't have to load in every app
		// This might be an issue if they can read environments, but that's alright
		// if everything is generated during execution
		//log.Printf("[DEBUG][%s] Deployed with CALLBACK_URL %s and BASE_URL %s", workflowExecution.ExecutionId, appCallbackUrl, baseUrl)
		env := []string{
			fmt.Sprintf("EXECUTIONID=%s", workflowExecution.ExecutionId),
			fmt.Sprintf("AUTHORIZATION=%s", workflowExecution.Authorization),
			fmt.Sprintf("CALLBACK_URL=%s", baseUrl),
			fmt.Sprintf("BASE_URL=%s", appCallbackUrl),
			fmt.Sprintf("TZ=%s", timezone),
			fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", os.Getenv("SHUFFLE_LOGS_DISABLED")),
		}

		if len(actionData) >= 100000 {
			log.Printf("[WARNING] Omitting some data from action execution. Length: %d. Fix in SDK!", len(actionData))
			newParams := []shuffle.WorkflowAppActionParameter{}
			for _, param := range action.Parameters {
				paramData, err := json.Marshal(param)
				if err != nil {
					log.Printf("[WARNING] Failed to marshal param %s: %s", param.Name, err)
					newParams = append(newParams, param)
					continue
				}

				if len(paramData) >= 50000 {
					log.Printf("[WARNING] Removing a lot of data from param %s with length %d", param.Name, len(paramData))
					param.Value = "SHUFFLE_AUTO_REMOVED"
				}

				newParams = append(newParams, param)
			}

			action.Parameters = newParams
			actionData, err = json.Marshal(action)
			if err == nil {
				log.Printf("[DEBUG] Ran data replace on action %s. new length: %d", action.Name, len(actionData))
			} else {
				log.Printf("[WARNING] Failed to marshal new actionData: %s", err)

			}
		} else {
			log.Printf("[DEBUG] Actiondata is NOT 100000 in length. Adding as normal.")
		}

		actionEnv := fmt.Sprintf("ACTION=%s", string(actionData))
		env = append(env, actionEnv)

		if strings.ToLower(os.Getenv("SHUFFLE_PASS_APP_PROXY")) == "true" {
			//log.Printf("APPENDING PROXY TO THE APP!")
			env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
			env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
			env = append(env, fmt.Sprintf("NO_PROXY=%s", os.Getenv("NO_PROXY")))
		}

		// Fixes issue:
		// standard_go init_linux.go:185: exec user process caused "argument list too long"
		// https://devblogs.microsoft.com/oldnewthing/20100203-00/?p=15083

		// FIXME: Ensure to NEVER do this anymore
		// This potentially breaks too much stuff. Better to have the app poll the data.
		_ = executionData
		/*
			maxSize := 32700 - len(string(actionData)) - 2000
			if len(executionData) < maxSize {
				log.Printf("[INFO] ADDING FULL_EXECUTION because size is smaller than %d", maxSize)
				env = append(env, fmt.Sprintf("FULL_EXECUTION=%s", string(executionData)))
			} else {
				log.Printf("[WARNING] Skipping FULL_EXECUTION because size is larger than %d", maxSize)
			}
		*/

		// Uses a few ways of getting / checking if an app is available
		// 1. Try original with lowercase
		// 2. Go to original (no spaces)
		// 3. Add remote repo location
		images := []string{
			image,
			fmt.Sprintf("%s:%s_%s", baseimagename, parsedAppname, action.AppVersion),
			fmt.Sprintf("%s/%s:%s_%s", registryName, baseimagename, parsedAppname, action.AppVersion),
		}

		// If cleanup is set, it should run for efficiency
		pullOptions := types.ImagePullOptions{}
		if cleanupEnv == "true" {
			err = deployApp(dockercli, images[0], identifier, env, workflowExecution, action)
			if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
				if strings.Contains(err.Error(), "exited prematurely") {
					log.Printf("[DEBUG] Shutting down (2)")
					shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
					return
				}

				err := downloadDockerImageBackend(topClient, image)
				executed := false
				if err == nil {
					log.Printf("[DEBUG] Downloaded image %s from backend (CLEANUP)", image)
					//err = deployApp(dockercli, image, identifier, env, workflow, action)
					err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
					if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
						if strings.Contains(err.Error(), "exited prematurely") {
							log.Printf("[DEBUG] Shutting down (41)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							return
						}
					} else {
						executed = true
					}
				}

				if !executed {
					image = images[2]
					err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
					if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
						if strings.Contains(err.Error(), "exited prematurely") {
							log.Printf("[DEBUG] Shutting down (3)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							return
						}

						//log.Printf("[WARNING] Failed CLEANUP execution. Downloading image %s remotely.", image)

						log.Printf("[WARNING] Failed to download image %s (CLEANUP): %s", image, err)

						reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
						if err != nil {
							log.Printf("[ERROR] Failed getting %s. Couldn't be find locally, AND is missing.", image)
							log.Printf("[DEBUG] Shutting down (4)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							return
						}

						buildBuf := new(strings.Builder)
						_, err = io.Copy(buildBuf, reader)
						if err != nil && !strings.Contains(fmt.Sprintf("%s", err.Error()), "Conflict. The container name") {
							log.Printf("[ERROR] Error in IO copy: %s", err)
							log.Printf("[DEBUG] Shutting down (5)")
							shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
							return
						} else {
							if strings.Contains(buildBuf.String(), "errorDetail") {
								log.Printf("[ERROR] Docker build:\n%s\nERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), image)
								log.Printf("[DEBUG] Shutting down (6)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}

							log.Printf("[INFO] Successfully downloaded %s", image)
						}

						err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {

							log.Printf("[ERROR] Failed deploying image for the FOURTH time. Aborting if the image doesn't exist")
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (7)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}

							if strings.Contains(err.Error(), "No such image") {
								//log.Printf("[WARNING] Failed deploying %s from image %s: %s", identifier, image, err)
								log.Printf("[ERROR] Image doesn't exist. Shutting down")
								log.Printf("[DEBUG] Shutting down (8)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}
						}
					}
				}
			}
		} else {

			err = deployApp(dockercli, images[0], identifier, env, workflowExecution, action)
			if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
				log.Printf("[DEBUG] Failed deploying app? %s", err)
				if strings.Contains(err.Error(), "exited prematurely") {
					log.Printf("[DEBUG] Shutting down (9)")
					shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
					return
				}

				// Trying to replace with lowercase to deploy again. This seems to work with Dockerhub well.
				// FIXME: Should try to remotely download directly if this persists.
				image = images[1]
				err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
				if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
					if strings.Contains(err.Error(), "exited prematurely") {
						log.Printf("[DEBUG] Shutting down (10)")
						shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
						return
					}

					log.Printf("[DEBUG][%s] Failed deploy. Downloading image %s: %s", workflowExecution.ExecutionId, image, err)
					err := downloadDockerImageBackend(topClient, image)
					executed := false
					if err == nil {
						log.Printf("[DEBUG] Downloaded image %s from backend (CLEANUP)", image)
						//err = deployApp(dockercli, image, identifier, env, workflow, action)
						err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (40)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}
						} else {
							executed = true
						}
					}

					if !executed {
						image = images[2]
						err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (11)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}

							log.Printf("[WARNING] Failed deploying image THREE TIMES. Attempting to download %s as last resort from backend and dockerhub: %s", image, err)

							reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
							if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
								log.Printf("[ERROR] Failed getting %s. The couldn't be find locally, AND is missing.", image)
								log.Printf("[DEBUG] Shutting down (12)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}

							buildBuf := new(strings.Builder)
							_, err = io.Copy(buildBuf, reader)
							if err != nil {
								log.Printf("[ERROR] Error in IO copy: %s", err)
								log.Printf("[DEBUG] Shutting down (13)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							} else {
								if strings.Contains(buildBuf.String(), "errorDetail") {
									log.Printf("[ERROR] Docker build:\n%s\nERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), image)
									log.Printf("[DEBUG] Shutting down (14)")
									shutdown(workflowExecution, action.ID, fmt.Sprintf("Error deploying container: %s", buildBuf.String()), true)
									return
								}

								log.Printf("[INFO] Successfully downloaded %s", image)
							}
						}

						err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
							log.Printf("[ERROR] Failed deploying image for the FOURTH time. Aborting if the image doesn't exist")
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (15)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}

							if strings.Contains(err.Error(), "No such image") {
								//log.Printf("[WARNING] Failed deploying %s from image %s: %s", identifier, image, err)
								log.Printf("[ERROR] Image doesn't exist. Shutting down")
								log.Printf("[DEBUG] Shutting down (16)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}
						}
					}
				}
			}
		}

		//log.Printf("[INFO][%s] Adding visited (3): %s (%s). Actions: %d, Results: %d", workflowExecution.ExecutionId, action.Label, action.ID, len(workflowExecution.Workflow.Actions), len(workflowExecution.Results))

		visited = append(visited, action.ID)
		executed = append(executed, action.ID)

		// If children of action.ID are NOT in executed:
		// Remove them from visited.
		//log.Printf("EXECUTED: %#v", executed)
	}

	//log.Printf(nextAction)
	//log.Printf(startAction, children[startAction])

	// FIXME - new request here
	// FIXME - clean up stopped (remove) containers with this execution id
	err = shuffle.UpdateExecutionVariables(ctx, workflowExecution.ExecutionId, startAction, children, parents, visited, executed, nextActions, environments, extra)
	if err != nil {
		log.Printf("\n\n[ERROR] Failed to update exec variables for execution %s: %s (2)\n\n", workflowExecution.ExecutionId, err)
	}

	if len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions)+extra {
		shutdownCheck := true
		for _, result := range workflowExecution.Results {
			if result.Status == "EXECUTING" || result.Status == "WAITING" {
				// Cleaning up executing stuff
				shutdownCheck = false
				// USED TO BE CONTAINER REMOVAL
				//  FIXME - send POST request to kill the container
				//log.Printf("Should remove (POST request) stopped containers")
				//ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
			}
		}

		if shutdownCheck {
			log.Printf("[INFO][%s] BREAKING BECAUSE RESULTS IS SAME LENGTH AS ACTIONS. SHOULD CHECK ALL RESULTS FOR WHETHER THEY'RE DONE", workflowExecution.ExecutionId)
			validateFinished(workflowExecution)
			log.Printf("[DEBUG][%s] Shutting down (17)", workflowExecution.ExecutionId)
			shutdown(workflowExecution, "", "", true)
			return
		}
	}

	time.Sleep(time.Duration(sleepTime) * time.Second)
	return
}

func executionInit(workflowExecution shuffle.WorkflowExecution) error {
	parents := map[string][]string{}
	children := map[string][]string{}
	nextActions := []string{}
	extra := 0

	//results = workflowExecution.Results

	startAction := workflowExecution.Start
	log.Printf("[INFO][%s] STARTACTION: %s", workflowExecution.ExecutionId, startAction)
	if len(startAction) == 0 {
		log.Printf("[INFO][%s] Didn't find execution start action. Setting it to workflow start action.", workflowExecution.ExecutionId)
		startAction = workflowExecution.Workflow.Start
	}

	// Setting up extra counter
	for _, trigger := range workflowExecution.Workflow.Triggers {
		//log.Printf("[DEBUG] Appname trigger (0): %s", trigger.AppName)
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
					//log.Printf("[INFO] shuffle.Trigger %s is the source!", trigger.AppName)
					sourceFound = true
				} else if trigger.ID == branch.DestinationID {
					//log.Printf("[INFO] shuffle.Trigger %s is the destination!", trigger.AppName)
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

	log.Printf("[INFO][%s] shuffle.Actions: %d + Special shuffle.Triggers: %d", workflowExecution.ExecutionId, len(workflowExecution.Workflow.Actions), extra)
	onpremApps := []string{}
	toExecuteOnprem := []string{}
	for _, action := range workflowExecution.Workflow.Actions {
		if strings.ToLower(action.Environment) != strings.ToLower(environment) {
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
		//log.Printf("[INFO] Image: %s", image)
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

	ctx := context.Background()

	visited := []string{}
	executed := []string{}
	environments := []string{}
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
	//var visited []string
	//var executed []string
	err := shuffle.UpdateExecutionVariables(ctx, workflowExecution.ExecutionId, startAction, children, parents, visited, executed, nextActions, environments, extra)
	if err != nil {
		log.Printf("\n\n[ERROR] Failed to update exec variables for execution %s: %s\n\n", workflowExecution.ExecutionId, err)
	}

	return nil
}

func handleDefaultExecution(client *http.Client, req *http.Request, workflowExecution shuffle.WorkflowExecution) error {
	// if no onprem runs (shouldn't happen, but extra check), exit
	// if there are some, load the images ASAP for the app
	ctx := context.Background()
	//startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)
	startAction, extra, _, _, _, _, _, _ := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)

	err := executionInit(workflowExecution)
	if err != nil {
		log.Printf("[INFO] Workflow setup failed for %s: %s", workflowExecution.ExecutionId, err)
		log.Printf("[DEBUG] Shutting down (18)")
		shutdown(workflowExecution, "", "", true)
	}

	log.Printf("[DEBUG] DEFAULT EXECUTION Startaction: %s", startAction)

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
			log.Printf("[ERROR] Failed making request (1): %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("[ERROR] Failed reading body (1): %s", err)
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
		log.Printf("[WARNING] Error building skip request (0): %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[WARNING] Error running skip request (0): %s", err)
		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[WARNING] Failed reading body when skipping (0): %s", err)
		return err
	}

	log.Printf("[INFO] Skip Action Body: %s", string(body))
	return nil
}

// Sends request back to backend to handle the node
func runUserInput(client *http.Client, action shuffle.Action, workflowId string, workflowExecution shuffle.WorkflowExecution, authorization string, configuration string, dockercli *dockerclient.Client) error {
	timeNow := time.Now().Unix()
	result := shuffle.ActionResult{
		Action:        action,
		ExecutionId:   workflowExecution.ExecutionId,
		Authorization: authorization,
		Result:        configuration,
		StartedAt:     timeNow,
		CompletedAt:   0,
		Status:        "WAITING",
	}

	// Checking for userinput to deploy subflow for it
	subflow := false
	subflowId := ""
	argument := ""
	continueUrl := "testing continue"
	cancelUrl := "testing cancel"
	for _, item := range action.Parameters {
		if item.Name == "subflow" {
			subflow = true
			subflowId = item.Value
		} else if item.Name == "alertinfo" {
			argument = item.Value
		}
	}

	if subflow {
		log.Printf("[DEBUG] Should run action with subflow app with argument %#v", argument)
		newAction := shuffle.Action{
			AppName:    "shuffle-subflow",
			Name:       "run_subflow",
			AppVersion: "1.0.0",
			Label:      "User Input Subflow Execution",
		}

		identifier := fmt.Sprintf("%s_%s_%s_%s", newAction.AppName, newAction.AppVersion, action.ID, workflowExecution.ExecutionId)
		if strings.Contains(identifier, " ") {
			identifier = strings.ReplaceAll(identifier, " ", "-")
		}

		inputValue := UserInputSubflow{
			Argument:    argument,
			ContinueUrl: continueUrl,
			CancelUrl:   cancelUrl,
		}

		parsedArgument, err := json.Marshal(inputValue)
		if err != nil {
			log.Printf("[ERROR] Failed to parse arguments: %s", err)
			parsedArgument = []byte(argument)
		}

		newAction.Parameters = []shuffle.WorkflowAppActionParameter{
			shuffle.WorkflowAppActionParameter{
				Name:  "user_apikey",
				Value: workflowExecution.Authorization,
			},
			shuffle.WorkflowAppActionParameter{
				Name:  "workflow",
				Value: subflowId,
			},
			shuffle.WorkflowAppActionParameter{
				Name:  "argument",
				Value: string(parsedArgument),
			},
		}

		newAction.Parameters = append(newAction.Parameters, shuffle.WorkflowAppActionParameter{
			Name:  "source_workflow",
			Value: workflowExecution.Workflow.ID,
		})

		newAction.Parameters = append(newAction.Parameters, shuffle.WorkflowAppActionParameter{
			Name:  "source_execution",
			Value: workflowExecution.ExecutionId,
		})

		newAction.Parameters = append(newAction.Parameters, shuffle.WorkflowAppActionParameter{
			Name:  "source_node",
			Value: action.ID,
		})

		newAction.Parameters = append(newAction.Parameters, shuffle.WorkflowAppActionParameter{
			Name:  "source_auth",
			Value: workflowExecution.Authorization,
		})

		newAction.Parameters = append(newAction.Parameters, shuffle.WorkflowAppActionParameter{
			Name:  "startnode",
			Value: "",
		})

		// If cleanup is set, it should run for efficiency
		//appName := strings.Replace(identifier, fmt.Sprintf("_%s", action.ID), "", -1)
		//appName = strings.Replace(appName, fmt.Sprintf("_%s", workflowExecution.ExecutionId), "", -1)
		actionData, err := json.Marshal(newAction)
		if err != nil {
			return err
		}

		env := []string{
			fmt.Sprintf("ACTION=%s", string(actionData)),
			fmt.Sprintf("EXECUTIONID=%s", workflowExecution.ExecutionId),
			fmt.Sprintf("AUTHORIZATION=%s", workflowExecution.Authorization),
			fmt.Sprintf("CALLBACK_URL=%s", baseUrl),
			fmt.Sprintf("BASE_URL=%s", appCallbackUrl),
			fmt.Sprintf("TZ=%s", timezone),
			fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", os.Getenv("SHUFFLE_LOGS_DISABLED")),
		}

		if strings.ToLower(os.Getenv("SHUFFLE_PASS_APP_PROXY")) == "true" {
			//log.Printf("APPENDING PROXY TO THE APP!")
			env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
			env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
			env = append(env, fmt.Sprintf("NO_PROXY=%s", os.Getenv("NO_PROXY")))
		}

		err = deployApp(dockercli, "frikky/shuffle:shuffle-subflow_1.0.0", identifier, env, workflowExecution, newAction)
		if err != nil {
			log.Printf("[ERROR] Failed to deploy subflow for user input trigger %s: %s", action.ID, err)
		}
	} else {
		log.Printf("[DEBUG] Running user input WITHOUT subflow")
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
		log.Printf("[WARNING] Error building test request (2): %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[WARNING] Error running test request (2): %s", err)
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
		log.Printf("[WARNING] Error running test request (3): %s", err)
		return "", ""
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[WARNING] Failed reading body: %s", err)
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
		log.Printf("[WARNING] (3) Failed reading body for workflowqueue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}
	log.Printf("[DEBUG] In workflowQueue with body length %d", len(body))

	//log.Printf("Got result: %s", string(body))
	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("[ERROR] Failed shuffle.ActionResult unmarshaling: %s", err)
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
		log.Printf("[ERROR][%s] Failed getting execution (workflowqueue) %s: %s", actionResult.ExecutionId, actionResult.ExecutionId, err)
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
		log.Printf("[DEBUG] Workflowexecution is already FINISHED. No further action can be taken")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is already finished because it has status %s. Lastnode: %s"}`, workflowExecution.Status, workflowExecution.LastNode)))
		return
	}

	if workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {

		if workflowExecution.Workflow.Configuration.ExitOnError {
			log.Printf("[WARNING] Workflowexecution already has status %s. No further action can be taken", workflowExecution.Status)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is aborted because of %s with result %s and status %s"}`, workflowExecution.LastNode, workflowExecution.Result, workflowExecution.Status)))
			return
		} else {
			log.Printf("Continuing even though it's aborted.")
		}
	}

	//results = append(results, actionResult)

	log.Printf("[DEBUG][%s] In workflowQueue with transaction", workflowExecution.ExecutionId)
	runWorkflowExecutionTransaction(ctx, 0, workflowExecution.ExecutionId, actionResult, resp)

}

// Will make sure transactions are always ran for an execution. This is recursive if it fails. Allowed to fail up to 5 times
func runWorkflowExecutionTransaction(ctx context.Context, attempts int64, workflowExecutionId string, actionResult shuffle.ActionResult, resp http.ResponseWriter) {
	log.Printf("[DEBUG][%s] IN WORKFLOWEXECUTION SUB!", actionResult.ExecutionId)
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

	log.Printf(`[DEBUG][%s] Got result %s from %s. Execution status: %s. Save: %#v. Parent: %#v`, actionResult.ExecutionId, actionResult.Status, actionResult.Action.ID, workflowExecution.Status, dbSave, workflowExecution.ExecutionParent)
	//dbSave := false

	//if len(results) != len(workflowExecution.Results) {
	//	log.Printf("[DEBUG][%s] There may have been an issue in transaction queue. Result lengths: %d vs %d. Should check which exists the base results, but not in entire execution, then append.", workflowExecution.ExecutionId, len(results), len(workflowExecution.Results))
	//}

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
		log.Printf("[INFO][%s] Running setexec with status %s", workflowExecution.ExecutionId, workflowExecution.Status)
		err = setWorkflowExecution(ctx, *workflowExecution, dbSave)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed setting workflowexecution actionresult: %s"}`, err)))
			return
		}

		if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
			finished := validateFinished(*workflowExecution)
			if !finished {
				log.Printf("[DEBUG][%s] Handling next node since it's not finished!", workflowExecution.ExecutionId)
				handleExecutionResult(*workflowExecution)
			}
		}
	} else {
		log.Printf("[INFO][%s] Skipping setexec with status %s", workflowExecution.ExecutionId, workflowExecution.Status)

		// Just in case. Should MAYBE validate finishing another time as well.
		// This fixes issues with e.g. shuffle.Action -> shuffle.Trigger -> shuffle.Action.
		handleExecutionResult(*workflowExecution)
		//validateFinished(workflowExecution)
	}

	//if newExecutions && len(nextActions) > 0 {
	//	log.Printf("[DEBUG][%s] New execution: %#v. NextActions: %#v", newExecutions, nextActions)
	//	//handleExecutionResult(*workflowExecution)
	//}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
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
	if workflowExecution.ExecutionSource == "default" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		log.Printf("[INFO][%s] Not sending backend info since source is default", workflowExecution.ExecutionId)
		return
	}

	streamUrl := fmt.Sprintf("%s/api/v1/streams", baseUrl)
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		log.Printf("[ERROR][%s] Failed creating finishing request: %s", workflowExecution.ExecutionId, err)
		log.Printf("[DEBUG][%s] Shutting down (22)", workflowExecution.ExecutionId)
		shutdown(workflowExecution, "", "", false)
	}

	newresp, err := topClient.Do(req)
	if err != nil {
		log.Printf("[ERROR][%s] Error running finishing request: %s", workflowExecution.ExecutionId, err)
		log.Printf("[DEBUG][%s] Shutting down (23)", workflowExecution.ExecutionId)
		shutdown(workflowExecution, "", "", false)
	}

	body, err := ioutil.ReadAll(newresp.Body)
	//log.Printf("[INFO] BACKEND STATUS: %d", newresp.StatusCode)
	if err != nil {
		log.Printf("[ERROR][%s] Failed reading body: %s", workflowExecution.ExecutionId, err)
	} else {
		log.Printf("[INFO][%s] NEWRESP (from backend): %s", workflowExecution.ExecutionId, string(body))
	}
}

func validateFinished(workflowExecution shuffle.WorkflowExecution) bool {
	ctx := context.Background()
	//startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)
	_, extra, _, _, _, _, _, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)

	log.Printf("[INFO][%s] VALIDATION. Status: %s, shuffle.Actions: %d, Extra: %d, Results: %d. Parent: %#v\n", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Workflow.Actions), extra, len(workflowExecution.Results), workflowExecution.ExecutionParent)

	//if len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions)+extra {
	if (len(environments) == 1 && requestsSent == 0 && len(workflowExecution.Results) >= 1 && os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm") || (len(workflowExecution.Results) >= len(workflowExecution.Workflow.Actions)+extra && len(workflowExecution.Workflow.Actions) > 0) {
		if workflowExecution.Status == "FINISHED" {
			for _, result := range workflowExecution.Results {
				if result.Status == "EXECUTING" || result.Status == "WAITING" {
					log.Printf("[WARNING] NOT returning full result, as a result may be unfinished: %s (%s) - %s", result.Action.Label, result.Action.ID, result.Status)
					return false
				}
			}
		}

		if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
			requestsSent += 1
		}

		log.Printf("[DEBUG][%s] Should send full result to %s", workflowExecution.ExecutionId, baseUrl)

		//data = fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, executionId, authorization)
		shutdownData, err := json.Marshal(workflowExecution)
		if err != nil {
			log.Printf("[ERROR][%s] Shutting down (24):  Failed to unmarshal data for backend: %s", workflowExecution.ExecutionId, err)
			shutdown(workflowExecution, "", "", true)
		}

		sendResult(workflowExecution, shutdownData)
		return true
	}

	return false
}

func handleGetStreamResults(resp http.ResponseWriter, request *http.Request) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Failed reading body for stream result queue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}
	log.Printf("[DEBUG] In get stream results with body length %d", len(body))

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

	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		return nil
	}

	handleExecutionResult(workflowExecution)
	validateFinished(workflowExecution)

	// FIXME: Should this shutdown OR send the result?
	// The worker may not be running the backend hmm
	if dbSave {
		if workflowExecution.ExecutionSource == "default" {
			log.Printf("[DEBUG][%s] Shutting down (25)", workflowExecution.ExecutionId)
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

	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		name, err := os.Hostname()
		if err != nil {
			log.Printf("[ERROR] Couldn't find hostanme of worker: %s", err)
			os.Exit(3)
		}

		log.Printf("[DEBUG] Found hostname %s since worker is running with \"run\" command", name)
		return name

		/**
			Everything below was a test to see if we needed to match directly to a network interface. May require docker network API.
		**/

		log.Printf("[DEBUG] Looking for IP for the external docker-network %s", swarmNetworkName)
		// Different process to ensure we find the right IP.
		// Necessary due to Ingress being added to docker ser
		ifaces, err := net.Interfaces()
		if err != nil {
			log.Printf("[ERROR] FATAL: networks the container is listening in %s: %s", swarmNetworkName, err)
			os.Exit(3)
		}

		foundIP := ""
		for _, i := range ifaces {
			log.Printf("NETWORK: %s", i.Name)
			//If i.Name != swarmNetworkName {
			//	continue
			//}

			addrs, err := i.Addrs()
			if err != nil {
				log.Printf("[ERROR] FATAL: Failed getting address for listener in network %s: %s", swarmNetworkName, err)
				continue
			}

			for _, addr := range addrs {
				var ip net.IP
				switch v := addr.(type) {
				case *net.IPNet:
					ip = v.IP
				case *net.IPAddr:
					ip = v.IP
				}

				log.Printf("%s: IP: %#v", i.Name, ip)

				// FIXME: Allow for IPv6 too!
				//if strings.Count(ip.String(), ".") == 3 {
				//	foundIP = ip.String()
				//	break
				//}
				// process IP address
			}
		}

		if len(foundIP) == 0 {
			log.Printf("[ERROR] FATAL: No valid IP found for network %s. Defaulting to base IP", swarmNetworkName)
		} else {
			return foundIP
		}
	}

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
	hostname = getLocalIP()

	// FIXME: This MAY not work because of speed between first
	// container being launched and port being assigned to webserver
	listener, err := getAvailablePort()
	if err != nil {
		log.Printf("[ERROR] Failed to create init listener: %s", err)
		return listener
	}

	log.Printf("[DEBUG] OLD HOSTNAME: %s", appCallbackUrl)
	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		log.Printf("\n\nStarting webserver on port %d with hostname: %s\n\n", baseport, hostname)

		appCallbackUrl = fmt.Sprintf("http://%s:%d", hostname, baseport)
		listener, err = net.Listen("tcp", fmt.Sprintf(":%d", baseport))
		if err != nil {
			log.Printf("[ERROR] Failed to assign port to %d: %s", baseport, err)
			return nil
		}

		return listener
	} else {
		port := listener.Addr().(*net.TCPAddr).Port

		log.Printf("\n\nStarting webserver on port %d with hostname: %s\n\n", port, hostname)
		appCallbackUrl = fmt.Sprintf("http://%s:%d", hostname, port)
	}
	log.Printf("NEW HOSTNAME: %s", appCallbackUrl)

	return listener
}

func downloadDockerImageBackend(client *http.Client, imageName string) error {
	log.Printf("[DEBUG] Trying to download image %s from backend as it doesn't exist", imageName)

	downloadedImages = append(downloadedImages, imageName)

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
		log.Printf("[ERROR] Error loading images: %s", err)
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

func deploySwarmService(dockercli *dockerclient.Client, name, image string, deployport int) error {
	log.Printf("[DEBUG] Deploying service for %s to swarm on port %d", name, deployport)
	//containerName := fmt.Sprintf("shuffle-worker-%s", parsedUuid)

	if len(baseimagename) == 0 {
		baseimagename = "frikky/shuffle"
		//var baseimagename = "frikky/shuffle"
		//var registryName = "registry.hub.docker.com"
	}

	//image := fmt.Sprintf("%s:%s", baseimagename, name)
	networkName := "shuffle-executions"
	if len(swarmNetworkName) > 0 {
		networkName = swarmNetworkName
	}

	replicatedJobs := uint64(1)

	// Sent from Orborus
	// Should be equal to
	scaleReplicas := os.Getenv("SHUFFLE_APP_REPLICAS")
	if len(scaleReplicas) > 0 {
		tmpInt, err := strconv.Atoi(scaleReplicas)
		if err != nil {
			log.Printf("[ERROR] %s is not a valid number for replication", scaleReplicas)
		} else {
			replicatedJobs = uint64(tmpInt)
		}

		log.Printf("[DEBUG] SHUFFLE_APP_REPLICAS set to value %#v. Trying to overwrite default (%d/node)", scaleReplicas, replicatedJobs)
	}

	log.Printf("[DEBUG] Deploying app with name %s with image %s", name, image)

	containerName := fmt.Sprintf(strings.Replace(name, ".", "-", -1))
	serviceSpec := swarm.ServiceSpec{
		Annotations: swarm.Annotations{
			Name:   containerName,
			Labels: map[string]string{},
		},
		Mode: swarm.ServiceMode{
			Replicated: &swarm.ReplicatedService{
				// Max total
				Replicas: &replicatedJobs,
			},
		},
		Networks: []swarm.NetworkAttachmentConfig{
			swarm.NetworkAttachmentConfig{
				Target: networkName,
			},
		},
		EndpointSpec: &swarm.EndpointSpec{
			Ports: []swarm.PortConfig{
				swarm.PortConfig{
					Protocol:      swarm.PortConfigProtocolTCP,
					PublishMode:   swarm.PortConfigPublishModeIngress,
					Name:          "app-port",
					PublishedPort: uint32(deployport),
					TargetPort:    uint32(deployport),
				},
			},
		},
		TaskTemplate: swarm.TaskSpec{
			Resources: &swarm.ResourceRequirements{
				Reservations: &swarm.Resources{},
			},
			LogDriver: &swarm.Driver{
				Name: "json-file",
				Options: map[string]string{
					"max-size": "10m",
				},
			},
			ContainerSpec: &swarm.ContainerSpec{
				Image: image,
				Env: []string{
					fmt.Sprintf("SHUFFLE_APP_EXPOSED_PORT=%d", deployport),
					fmt.Sprintf("SHUFFLE_SWARM_CONFIG=%s", os.Getenv("SHUFFLE_SWARM_CONFIG")),
					fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", os.Getenv("SHUFFLE_LOGS_DISABLED")),
				},
				Hosts: []string{
					containerName,
				},
			},
			RestartPolicy: &swarm.RestartPolicy{
				Condition: swarm.RestartPolicyConditionNone,
			},
			Placement: &swarm.Placement{
				// Max per node
				MaxReplicas: 1,
			},
		},
	}

	if len(os.Getenv("SHUFFLE_SWARM_OTHER_NETWORK")) > 0 {
		serviceSpec.Networks = append(serviceSpec.Networks, swarm.NetworkAttachmentConfig{
			Target: "shuffle_shuffle",
		})
	}

	if strings.ToLower(os.Getenv("SHUFFLE_PASS_APP_PROXY")) == "true" {
		serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
		serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
		serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("NO_PROXY=%s", os.Getenv("NO_PROXY")))
	}

	/*
		Mounts: []mount.Mount{
			mount.Mount{
				Source: "/var/run/docker.sock",
				Target: "/var/run/docker.sock",
				Type:   mount.TypeBind,
			},
		},
	*/

	if dockerApiVersion != "" {
		serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("DOCKER_API_VERSION=%s", dockerApiVersion))
	}

	// Required for certain apps
	if timezone == "" {
		timezone = "Europe/Amsterdam"
	}

	serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("TZ=%s", timezone))

	serviceOptions := types.ServiceCreateOptions{}
	service, err := dockercli.ServiceCreate(
		context.Background(),
		serviceSpec,
		serviceOptions,
	)
	_ = service

	if err != nil {
		log.Printf("[DEBUG] Failed deploying %s with image %s: %s", name, image, err)
		return err
	}

	log.Printf("[DEBUG] Successfully deployed service %s with image %s on port %d", name, image, deployport)

	return nil
}

// Runs data discovery
func findAppInfo(image, name string) (int, error) {
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client (2): %s", err)
		return -1, err
	}

	highest := baseport
	exposedPort := -1

	// Exists as a "cache" layer
	if portMappings != nil {
		for key, value := range portMappings {
			if value > highest {
				highest = value
			}

			if key == name {
				exposedPort = value
				break
			}
		}
	} else {
		portMappings = make(map[string]int)
	}

	//Filters:
	if exposedPort == -1 {
		serviceListOptions := types.ServiceListOptions{}
		services, err := dockercli.ServiceList(
			context.Background(),
			serviceListOptions,
		)

		// Basic self-correction
		if err != nil {
			log.Printf("[ERROR] Unable to list services: %s (may continue anyway?)", err)
			if strings.Contains(fmt.Sprintf("%s", err), "is too new") {
				// Static for some reason
				defaultVersion := "1.40"
				dockerApiVersion = defaultVersion
				os.Setenv("DOCKER_API_VERSION", defaultVersion)
				log.Printf("[DEBUG] Setting Docker API to %s default and retrying listing requests", defaultVersion)
			} else {
				return -1, err
			}

			services, err = dockercli.ServiceList(
				context.Background(),
				serviceListOptions,
			)

			if err != nil {
				log.Printf("[ERROR] Unable to list services (2): %s", err)
				return -1, err
			}
		}

		for _, service := range services {
			//log.Printf("[INFO] Service: %#v", service.Spec.Annotations.Name)

			for _, endpoint := range service.Spec.EndpointSpec.Ports {
				if strings.Contains(endpoint.Name, "port") {
					portMappings[service.Spec.Annotations.Name] = int(endpoint.PublishedPort)
					if int(endpoint.PublishedPort) > highest {
						highest = int(endpoint.PublishedPort)
					}

					if service.Spec.Annotations.Name == name || service.Spec.Annotations.Name == strings.Replace(name, ".", "-", -1) {
						exposedPort = int(endpoint.PublishedPort)
						//break
					}
				}
			}

			//log.Printf("%s - %s", service.Spec.Annotations.Name, strings.Replace(name, ".", "-", -1))
			if service.Spec.Annotations.Name != name && service.Spec.Annotations.Name != strings.Replace(name, ".", "-", -1) {
				continue
			}

			// Break if it's the correct port, as it's the right service
			if exposedPort >= 0 {
				break
			}
		}
	}

	//log.Printf("[DEBUG] Portmappings: %#v", portMappings)

	if exposedPort >= 0 {
		//log.Printf("[INFO] Found service %s on port %d - no need to deploy another", name, exposedPort)
	} else {
		// Increment by 1 for highest port
		if highest <= baseport {
			highest = baseport
		}

		highest += 1
		err = deploySwarmService(dockercli, name, image, highest)
		if err != nil {
			log.Printf("[WARNING] NOT Found service: %s. error: %s", name, err)
			return highest, err
		} else {
			log.Printf("[INFO] Deployed app with name %s", name)
		}

		exposedPort = highest

		if appsInitialized {
			log.Printf("[DEBUG] Waiting 30 seconds before moving on to let app start")
			time.Sleep(time.Duration(30) * time.Second)
		}
	}

	return exposedPort, nil
}

func sendAppRequest(incomingUrl, appName string, port int, action shuffle.Action, workflowExecution shuffle.WorkflowExecution) error {
	parsedRequest := shuffle.OrborusExecutionRequest{
		ExecutionId:           workflowExecution.ExecutionId,
		Authorization:         workflowExecution.Authorization,
		EnvironmentName:       os.Getenv("ENVIRONMENT_NAME"),
		Timezone:              os.Getenv("TZ"),
		Cleanup:               os.Getenv("CLEANUP"),
		HTTPProxy:             os.Getenv("HTTP_PROXY"),
		HTTPSProxy:            os.Getenv("HTTPS_PROXY"),
		ShufflePassProxyToApp: os.Getenv("SHUFFLE_PASS_APP_PROXY"),
		BaseUrl:               baseUrl,
		Action:                action,
		FullExecution:         workflowExecution,
	}
	//var baseUrl = os.Getenv("BASE_URL")
	//var appCallbackUrl = os.Getenv("BASE_URL")

	parsedBaseurl := incomingUrl
	if strings.Count(baseUrl, ":") >= 2 {
		baseUrlSplit := strings.Split(baseUrl, ":")
		if len(baseUrlSplit) >= 3 {
			parsedBaseurl = strings.Join(baseUrlSplit[0:2], ":")
			//parsedRequest.BaseUrl = fmt.Sprintf("%s:33333", parsedBaseurl)
		}
	}

	if len(parsedRequest.Url) == 0 {
		// Fixed callback url to the worker itself
		if strings.Count(parsedBaseurl, ":") >= 2 {
			parsedRequest.Url = parsedBaseurl
		} else {
			// Callback to worker
			parsedRequest.Url = fmt.Sprintf("%s:%d", parsedBaseurl, baseport)

			//parsedRequest.Url
		}

		//log.Printf("[DEBUG][%s] Should add a baseurl for the app to get back to: %s", workflowExecution.ExecutionId, parsedRequest.Url)
	}

	// FIXME: Swapping because this was confusing during dev
	tmp := parsedRequest.Url
	parsedRequest.Url = parsedRequest.BaseUrl
	parsedRequest.BaseUrl = tmp

	//http://3e05d1e7d7a0:33333,

	// Run with proper hostname, but set to shuffle-worker to avoid specific host target.
	// This means running with VIP instead.
	if len(hostname) > 0 {
		parsedRequest.BaseUrl = fmt.Sprintf("http://%s:%d", hostname, baseport)
		//parsedRequest.BaseUrl = fmt.Sprintf("http://shuffle-workers:%d", baseport)
		//log.Printf("[DEBUG][%s] Changing hostname to local hostname in Docker network for WORKER URL: %s", workflowExecution.ExecutionId, parsedRequest.BaseUrl)
	}

	data, err := json.Marshal(parsedRequest)
	if err != nil {
		log.Printf("[ERROR] Failed marshalling worker request: %s", err)
		return err
	}

	//streamUrl := fmt.Sprintf("%s:%d/api/v1/run", parsedBaseurl, port)
	streamUrl := fmt.Sprintf("http://%s:%d/api/v1/run", appName, port)
	log.Printf("[DEBUG][%s] Worker URL: %s, Backend URL: %s, Target App: %s", workflowExecution.ExecutionId, parsedRequest.BaseUrl, parsedRequest.Url, streamUrl)
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(data)),
	)

	client := &http.Client{}
	if err != nil {
		log.Printf("[ERROR] Failed creating app run request: %s", err)
		return err
	}

	// Checking as LATE as possible, ensuring we don't rerun what's already ran
	ctx := context.Background()
	newExecId := fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, action.ID)
	_, err = shuffle.GetCache(ctx, newExecId)
	if err == nil {
		log.Printf("\n\n[DEBUG] Result for %s already found (PRE REQUEST) - returning\n\n", newExecId)
		return nil
	}

	cacheData := []byte("1")
	err = shuffle.SetCache(ctx, newExecId, cacheData)
	if err != nil {
		log.Printf("[WARNING] Failed setting cache for action %s: %s", newExecId, err)
	} else {
		log.Printf("[DEBUG] Adding %s to cache (%s)", newExecId, action.Name)
	}

	// FIXME:

	newresp, err := client.Do(req)
	if err != nil {
		if strings.Contains(fmt.Sprintf("%s", err), "timeout awaiting response") {
			return nil
		}

		log.Printf("[ERROR] Error running app run request: %s", err)

		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading app request body body: %s", err)
		return err
	} else {
		log.Printf("[INFO][%s] NEWRESP (from app): %s", workflowExecution.ExecutionId, string(body))
	}

	// FIXME: Remove
	/*
		if len(hostname) > 0 {
			//streamUrl := fmt.Sprintf("%s:%d/api/v1/run", parsedBaseurl, port)
			streamUrl := fmt.Sprintf("http://%s:%d/api/v1/run", appName, port)
			log.Printf("\n\n[DEBUG] Trying execution towards %s", streamUrl)
			req, err := http.NewRequest(
				"POST",
				streamUrl,
				bytes.NewBuffer([]byte(data)),
			)

			client := &http.Client{}
			if err != nil {
				log.Printf("[ERROR] Failed creating app run request: %s", err)
				return err
			}

			newresp, err := client.Do(req)
			if err != nil {
				log.Printf("[ERROR] Error running app run request: %s", err)
				return err
			}

			body, err := ioutil.ReadAll(newresp.Body)
			if err != nil {
				log.Printf("[ERROR] Failed reading body: %s", err)
				return err
			} else {
				log.Printf("[INFO] NEWRESP (from app): %s", string(body))
			}
		}
	*/

	return nil
}

// Function to auto-deploy certain apps if "run" is set
// Has some issues with loading when running multiple workers and such.
func baseDeploy() {
	//return

	cli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client (3): %s", err)
		return
	}

	for key, value := range autoDeploy {
		newNameSplit := strings.Split(key, ":")

		action := shuffle.Action{
			AppName:    newNameSplit[0],
			AppVersion: newNameSplit[1],
			ID:         "TBD",
		}

		workflowExecution := shuffle.WorkflowExecution{
			ExecutionId: "TBD",
		}

		appname := action.AppName
		appversion := action.AppVersion
		appname = strings.Replace(appname, ".", "-", -1)
		appversion = strings.Replace(appversion, ".", "-", -1)

		env := []string{
			fmt.Sprintf("EXECUTIONID=%s", workflowExecution.ExecutionId),
			fmt.Sprintf("AUTHORIZATION=%s", workflowExecution.Authorization),
			fmt.Sprintf("CALLBACK_URL=%s", baseUrl),
			fmt.Sprintf("BASE_URL=%s", appCallbackUrl),
			fmt.Sprintf("TZ=%s", timezone),
			fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", os.Getenv("SHUFFLE_LOGS_DISABLED")),
		}

		if strings.ToLower(os.Getenv("SHUFFLE_PASS_APP_PROXY")) == "true" {
			//log.Printf("APPENDING PROXY TO THE APP!")
			env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
			env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
			env = append(env, fmt.Sprintf("NO_PROXY=%s", os.Getenv("NO_PROXY")))
		}

		identifier := fmt.Sprintf("%s_%s_%s_%s", appname, appversion, action.ID, workflowExecution.ExecutionId)
		if strings.Contains(identifier, " ") {
			identifier = strings.ReplaceAll(identifier, " ", "-")
		}

		//deployApp(cli, value, identifier, env, workflowExecution, action)
		log.Printf("[DEBUG] Deploying app with identifier %s to ensure basic apps are available from the get-go", identifier)
		err = deployApp(cli, value, identifier, env, workflowExecution, action)
		_ = err
		//err := deployApp(cli, value, identifier, env, workflowExecution, action)
		//if err != nil {
		//	log.Printf("[DEBUG] Failed deploying app %s: %s", value, err)
		//}
	}

	appsInitialized = true
}

// Initial loop etc
func main() {
	/*
		appName := "shuffle-tools_1.1.0"
		image := "frikky/shuffle:shuffle-tools_1.1.0"
		exposedPort, err := findAppInfo(image, appName)
		if err != nil {
			log.Printf("[ERROR] Failed finding and creating port for %s: %s", appName, err)
			os.Exit(3)
		}

		log.Printf("[DEBUG] Should run towards port %d for app %s", exposedPort, appName)
		err = sendAppRequest(appCallbackUrl, exposedPort, shuffle.Action{}, shuffle.WorkflowExecution{})
		if err != nil {
			log.Printf("[ERROR] Failed sending request to app %s on port %d: %s", appName, exposedPort, err)
			os.Exit(3)
		}
	*/

	// Elasticsearch necessary to ensure we'ren ot running with Datastore configurations for minimal/maximal data sizes
	_, err := shuffle.RunInit(datastore.Client{}, storage.Client{}, "", "", true, "elasticsearch")
	if err != nil {
		log.Printf("[ERROR] Failed to run worker init: %s", err)
	} else {
		log.Printf("[DEBUG] Ran init for worker to set up cache system. Docker version: %s", dockerApiVersion)
	}

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

	if timezone == "" {
		timezone = "Europe/Amsterdam"
	}

	log.Printf("[INFO] Running with timezone %s and swarm config %#v", timezone, os.Getenv("SHUFFLE_SWARM_CONFIG"))
	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		// Forcing download just in case on the first iteration.
		workflowExecution := shuffle.WorkflowExecution{}

		//var autoDeploy = []string{"frikky/shuffle:shuffle-subflow_1.0.0", "frikky/shuffle:http_1.1.0", "frikky/shuffle:shuffle-tools_1.1.0", "frikky/shuffle:testing_1.0.0"}

		go baseDeploy()
		//baseDeploy()

		listener := webserverSetup(workflowExecution)
		runWebserver(listener)
		log.Printf("[ERROR] Stopped listener %#v - exiting.", listener)
		os.Exit(3)
	}

	//imageName := fmt.Sprintf("%s/%s:shuffle_openapi_1.0.0", registryName, baseimagename)

	// WORKER_TESTING_WORKFLOW should be a workflow ID
	authorization := ""
	executionId := ""

	// INFO: Allows you to run a test execution
	testing := os.Getenv("WORKER_TESTING_WORKFLOW")
	shuffle_apikey := os.Getenv("WORKER_TESTING_APIKEY")
	if len(testing) > 0 && len(shuffle_apikey) > 0 {
		// Execute a workflow and use that info
		log.Printf("[WARNING] Running test environment for worker by executing workflow %s. PS: This may NOT reach the worker in real time, but rather be deployed as a docker container (bad). Instead use AUTHORIZATION and EXECUTIONID for direct testing", testing)
		authorization, executionId = runTestExecution(client, testing, shuffle_apikey)

	} else {
		authorization = os.Getenv("AUTHORIZATION")
		executionId = os.Getenv("EXECUTIONID")
		log.Printf("[INFO] Running normal execution with auth %s and ID %s", authorization, executionId)
	}

	workflowExecution := shuffle.WorkflowExecution{
		ExecutionId: executionId,
	}
	if len(authorization) == 0 {
		log.Printf("[INFO] No AUTHORIZATION key set in env")
		log.Printf("[DEBUG] Shutting down (27)")
		shutdown(workflowExecution, "", "", false)
	}

	if len(executionId) == 0 {
		log.Printf("[INFO] No EXECUTIONID key set in env")
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
		log.Printf("[ERROR] Failed making request builder for backend")
		log.Printf("[DEBUG] Shutting down (29)")
		shutdown(workflowExecution, "", "", true)
	}

	topClient = client

	firstRequest := true
	environments := []string{}
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
			requestCache = cache.New(60*time.Minute, 120*time.Minute)
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
				log.Printf("\n\n[INFO] Running NON-OPTIMIZED execution for type %s with %d environment(s). This only happens when ran manually OR when running with subflows. Status: %s\n\n", workflowExecution.ExecutionSource, len(environments), workflowExecution.Status)
				err := executionInit(workflowExecution)
				if err != nil {
					log.Printf("[INFO] Workflow setup failed: %s", workflowExecution.ExecutionId, err)
					shutdown(workflowExecution, "", "", true)
				}

				// Trying to make worker into microservice~ :)
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

func checkUnfinishedExecutions() {
	// Meant as a function that periodically checks whether previous executions have finished or not.
	// Should probably be based on executedIds and finishedIds
}

func handleRunExecution(resp http.ResponseWriter, request *http.Request) {
	checkUnfinishedExecutions()

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] Failed reading body for stream result queue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}
	log.Printf("[DEBUG] In run execution with body length %d", len(body))

	var execRequest shuffle.OrborusExecutionRequest
	err = json.Unmarshal(body, &execRequest)
	if err != nil {
		log.Printf("[WARNING] Failed shuffle.WorkflowExecution unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// FIXME: This should be PER EXECUTION
	//if strings.ToLower(os.Getenv("SHUFFLE_PASS_APP_PROXY")) == "true" {
	// Is it ok if these are standard? Should they be update-able after launch? Hmm
	if len(execRequest.HTTPProxy) > 0 {
		log.Printf("[DEBUG] Sending proxy info to child process")
		os.Setenv("SHUFFLE_PASS_APP_PROXY", execRequest.ShufflePassProxyToApp)
	}
	if len(execRequest.HTTPProxy) > 0 {
		log.Printf("[DEBUG] Running with default HTTP proxy %s", execRequest.HTTPProxy)
		os.Setenv("HTTP_PROXY", execRequest.HTTPProxy)
	}
	if len(execRequest.HTTPSProxy) > 0 {
		log.Printf("[DEBUG] Running with default HTTPS proxy %s", execRequest.HTTPSProxy)
		os.Setenv("HTTPS_PROXY", execRequest.HTTPSProxy)
	}
	if len(execRequest.EnvironmentName) > 0 {
		os.Setenv("ENVIRONMENT_NAME", execRequest.EnvironmentName)
		environment = execRequest.EnvironmentName
	}
	if len(execRequest.Timezone) > 0 {
		os.Setenv("TZ", execRequest.Timezone)
		timezone = execRequest.Timezone
	}
	if len(execRequest.Cleanup) > 0 {
		os.Setenv("CLEANUP", execRequest.Cleanup)
		cleanupEnv = execRequest.Cleanup
	}
	if len(execRequest.BaseUrl) > 0 {
		os.Setenv("BASE_URL", execRequest.BaseUrl)
		baseUrl = execRequest.BaseUrl
	}

	// Setting to just have an auth available.
	if len(execRequest.Authorization) > 0 && len(os.Getenv("AUTHORIZATION")) == 0 {
		//log.Printf("[DEBUG] Sending proxy info to child process")
		os.Setenv("AUTHORIZATION", execRequest.Authorization)
	}

	topClient = &http.Client{}
	var workflowExecution shuffle.WorkflowExecution
	data = fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, execRequest.ExecutionId, execRequest.Authorization)
	streamResultUrl := fmt.Sprintf("%s/api/v1/streams/results", baseUrl)

	req, err := http.NewRequest(
		"POST",
		streamResultUrl,
		bytes.NewBuffer([]byte(data)),
	)

	newresp, err := topClient.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed making request (2): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	body, err = ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading body (2): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	if newresp.StatusCode != 200 {
		log.Printf("[ERROR] Bad statuscode: %d, %s", newresp.StatusCode, string(body))

		if strings.Contains(string(body), "Workflowexecution is already finished") {
			log.Printf("[DEBUG] Shutting down (19)")
			//shutdown(workflowExecution, "", "", true)
		}

		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad statuscode: %d"}`, newresp.StatusCode)))
		return
	}

	err = json.Unmarshal(body, &workflowExecution)
	if err != nil {
		log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	ctx := context.Background()
	err = setWorkflowExecution(ctx, workflowExecution, true)
	if err != nil {
		log.Printf("[ERROR] Failed initializing execution saving for %s: %s", workflowExecution.ExecutionId, err)
	}

	if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
		log.Printf("[INFO] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
		log.Printf("[DEBUG] Shutting down (20)")

		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad status for execution - already %s. Returning with 200 OK"}`, workflowExecution.Status)))
		return
	}

	//startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)

	extra := 0
	for _, trigger := range workflowExecution.Workflow.Triggers {
		//log.Printf("Appname trigger (0): %s", trigger.AppName)
		if trigger.AppName == "User Input" || trigger.AppName == "Shuffle Workflow" {
			extra += 1
		}
	}

	log.Printf("[INFO] Status: %s, Results: %d, actions: %d", workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)
	if workflowExecution.Status != "EXECUTING" {
		log.Printf("[WARNING] Exiting as worker execution has status %s!", workflowExecution.Status)
		log.Printf("[DEBUG] Shutting down (21)")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad status %s"}`, workflowExecution.Status)))
		return
	}

	//log.Printf("[DEBUG] Starting execution :O")

	cacheKey := fmt.Sprintf("workflowexecution-%s", workflowExecution.ExecutionId)
	requestCache.Set(cacheKey, &workflowExecution, cache.DefaultExpiration)

	err = executionInit(workflowExecution)
	if err != nil {
		log.Printf("[INFO][%s] Shutting down (30) - Workflow setup failed: %s", workflowExecution.ExecutionId, workflowExecution.ExecutionId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Error in execution init: %s"}`, err)))
		return
		//shutdown(workflowExecution, "", "", true)
	}

	//go handleExecutionResult(workflowExecution)
	handleExecutionResult(workflowExecution)
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func runWebserver(listener net.Listener) {
	r := mux.NewRouter()
	r.HandleFunc("/api/v1/streams", handleWorkflowQueue).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/streams/results", handleGetStreamResults).Methods("POST", "OPTIONS")

	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		/*
			err = dockercli.ServiceRemove(ctx, "shuffle-workers")
			if err != nil {}
		*/

		requestCache = cache.New(60*time.Minute, 120*time.Minute)
		log.Printf("[DEBUG] Running webserver config for SWARM and K8s")
		r.HandleFunc("/api/v1/execute", handleRunExecution).Methods("POST", "OPTIONS")
	}

	//log.Fatal(http.ListenAndServe(port, nil))
	http.Handle("/", r)
	log.Fatal(http.Serve(listener, nil))
	log.Printf("[DEBUG] Do we see this?")
}
