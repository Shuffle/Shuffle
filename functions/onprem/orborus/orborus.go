package main

/*
	Orborus exists to listen for new workflow executions and deploy workers.
*/

import (
	"github.com/frikky/shuffle-shared"

	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	//"github.com/docker/docker/api/types/filters"
	dockerclient "github.com/docker/docker/client"
	"github.com/satori/go.uuid"
	//network "github.com/docker/docker/api/types/network"
	//natting "github.com/docker/go-connections/nat"
	"github.com/mackerelio/go-osstat/cpu"
	"github.com/mackerelio/go-osstat/memory"
)

// Starts jobs in bulk, so this could be increased
var sleepTime = 3
var maxConcurrency = 50

// Timeout if something rashes
var workerTimeoutEnv = os.Getenv("SHUFFLE_ORBORUS_EXECUTION_TIMEOUT")
var concurrencyEnv = os.Getenv("SHUFFLE_ORBORUS_EXECUTION_CONCURRENCY")
var appSdkVersion = os.Getenv("SHUFFLE_APP_SDK_VERSION")
var workerVersion = os.Getenv("SHUFFLE_WORKER_VERSION")

//var baseimagename = "docker.pkg.github.com/frikky/shuffle"
//var baseimagename = "ghcr.io/frikky"
// var baseimagename = "frikky/shuffle"
var baseimagename = os.Getenv("SHUFFLE_BASE_IMAGE_NAME")
var baseimageregistry = os.Getenv("SHUFFLE_BASE_IMAGE_REGISTRY")
var baseimagetagsuffix = os.Getenv("SHUFFLE_BASE_IMAGE_TAG_SUFFIX")

var orgId = os.Getenv("ORG_ID")
var baseUrl = os.Getenv("BASE_URL")

var environment = os.Getenv("ENVIRONMENT_NAME")
var dockerApiVersion = os.Getenv("DOCKER_API_VERSION")
var runningMode = strings.ToLower(os.Getenv("RUNNING_MODE"))
var cleanupEnv = strings.ToLower(os.Getenv("CLEANUP"))
var executionIds = []string{}

var dockercli *dockerclient.Client
var containerId string

func init() {
	var err error

	dockercli, err = dockerclient.NewEnvClient()
	if err != nil {
		panic(fmt.Sprintf("Unable to create docker client: %s", err))
	}

	getThisContainerId()
}

// form id of current running container
func getThisContainerId() {
	fCol := ""

	// some adjusting based on current running mode
	switch runningMode {
	case "kubernetes":
		// cgroup will be like:
		// 11:net_cls,net_prio:/kubepods/besteffort/podf132b44d-cfcf-43f7-9906-79f58e268333/851466f8b5ed5aa0f265b1c95c6d2bafbc51a38dd5c5a1621b6e586572150009
		fCol = "5"
		log.Printf("[INFO] Running containerized in Kubernetes!")

	case "docker":
		// cgroup will be like:
		// 12:perf_event:/docker/0f06810364f52a2cd6e80bfba27419cb8a29758a204cd676388f4913bb366f2b
		fCol = "3"
		log.Printf("[INFO] Running containerized in Docker!")

	default:
		fCol = "3" // for backward-compatibility with production
		log.Printf("[WARNING] RUNNING_MODE not set - defaulting to Docker (NOT Kubernetes).")
	}

	if fCol != "" {
		cmd := fmt.Sprintf("cat /proc/self/cgroup | grep memory | tail -1 | cut -d/ -f%s | grep -o -E '[0-9A-z]{64}'", fCol)
		out, err := exec.Command("bash", "-c", cmd).Output()
		if err == nil {
			containerId = strings.TrimSpace(string(out))

			// cgroup error. Hardcoding this.
			// https://github.com/moby/moby/issues/7015
			//log.Printf("Checking if %s is in %s", ".scope", string(out))
			if strings.Contains(string(out), ".scope") {
				containerId = "shuffle-orborus"
				//docker-76c537e9a4b7c7233011f5d70e6b7f2d600b6413ac58a96519b8dca7a3f7117a.scope
			}
		} else {
			if fCol == "0" {
				containerId = "shuffle-orborus"
				log.Printf("[WARNING] Failed getting container ID: %s", err)
			}
		}
	}

	log.Printf(`[INFO] Started with containerId "%s"`, containerId)
}

// Deploys the internal worker whenever something happens
// https://docs.docker.com/engine/api/sdk/examples/
func deployWorker(image string, identifier string, env []string) {
	// Binds is the actual "-v" volume.
	// Max 20% CPU every second

	//CPUQuota:  25000,
	//CPUPeriod: 100000,
	//CPUShares: 256,
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type:   "json-file",
			Config: map[string]string{},
		},
		Resources: container.Resources{},
		Binds: []string{
			"/var/run/docker.sock:/var/run/docker.sock:rw",
		},
	}

	// form container id and use it as network source if it's not empty
	if containerId != "" {
		//log.Printf("[INFO] Found container ID %s", containerId)
		hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:%s", containerId))
	} else {
		//log.Printf("[INFO] Empty self container id, continue without NetworkMode")
	}

	if cleanupEnv == "true" {
		hostConfig.AutoRemove = true
	}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	//log.Printf("[INFO] Identifier: %s", identifier)
	cont, err := dockercli.ContainerCreate(
		context.Background(),
		config,
		hostConfig,
		nil,
		nil,
		identifier,
	)

	if err != nil {
		if strings.Contains(fmt.Sprintf("%s", err), "Conflict. The container name ") {
			uuid := uuid.NewV4()
			identifier = fmt.Sprintf("%s-%s", identifier, uuid)
			log.Printf("[INFO] 2 - Identifier: %s", identifier)
			cont, err = dockercli.ContainerCreate(
				context.Background(),
				config,
				hostConfig,
				nil,
				nil,
				identifier,
			)

			if err != nil {
				log.Printf("[ERROR] Container create error(2): %s", err)
				return
			}
		} else {
			log.Printf("[ERROR] Container create error: %s", err)
			return
		}
	}

	containerStartOptions := types.ContainerStartOptions{}
	err = dockercli.ContainerStart(context.Background(), cont.ID, containerStartOptions)
	if err != nil {
		log.Printf("[ERROR] Failed to start container in environment %s: %s", environment, err)
		return

		//stats, err := cli.ContainerInspect(context.Background(), containerName)
		//if err != nil {
		//	log.Printf("Failed checking worker %s", containerName)
		//	return
		//}

		//containerStatus := stats.ContainerJSONBase.State.Status
		//if containerStatus != "running" {
		//	log.Printf("Status of %s is %s. Should be running. Will reset", containerName, containerStatus)
		//	err = stopWorker(containerName)
		//	if err != nil {
		//		log.Printf("Failed stopping worker %s", execution.ExecutionId)
		//		return
		//	}

		//	err = deployWorker(cli, workerImage, containerName, env)
		//	if err != nil {
		//		log.Printf("Failed executing worker %s in state %s", execution.ExecutionId, containerStatus)
		//		return
		//	}
		//}
	} else {
		log.Printf("[INFO] Container %s was created under environment %s", cont.ID, environment)
	}

	return
}

func stopWorker(containername string) error {
	ctx := context.Background()

	//	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
	//		All: true,
	//	})

	if err := dockercli.ContainerStop(ctx, containername, nil); err != nil {
		log.Printf("[ERROR] Unable to stop container %s - running removal anyway, just in case: %s", containername, err)
	}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	if err := dockercli.ContainerRemove(ctx, containername, removeOptions); err != nil {
		log.Printf("[ERROR] Unable to remove container: %s", err)
	}

	return nil
}

func initializeImages() {
	ctx := context.Background()

	if appSdkVersion == "" {
		appSdkVersion = "0.8.97"
		log.Printf("[WARNING] SHUFFLE_APP_SDK_VERSION not defined. Defaulting to %s", appSdkVersion)
	}
	if workerVersion == "" {
		workerVersion = "nightly"
		log.Printf("[WARNING] SHUFFLE_WORKER_VERSION not defined. Defaulting to %s", workerVersion)
	}

	if baseimageregistry == "" {
		baseimageregistry = "docker.io"
		baseimageregistry = "ghcr.io"
		log.Printf("Setting baseimageregistry")
	}
	if baseimagename == "" {
		baseimagename = "frikky/shuffle"
		baseimagename = "frikky"
		log.Printf("Setting baseimagename")
	}

	// check whether they are the same first
	images := []string{
		fmt.Sprintf("frikky/shuffle:app_sdk"),
		fmt.Sprintf("%s/%s/shuffle-app_sdk:%s", baseimageregistry, baseimagename, appSdkVersion),
		fmt.Sprintf("%s/%s/shuffle-worker:%s", baseimageregistry, baseimagename, workerVersion),
		// fmt.Sprintf("docker.io/%s:app_sdk", baseimagename),
		// fmt.Sprintf("docker.io/%s:worker", baseimagename),

		//fmt.Sprintf("%s/worker:%s", baseimagename, workerVersion),
		//fmt.Sprintf("%s/app_sdk:%s", baseimagename, appSdkVersion),
		//fmt.Sprintf("frikky/shuffle:app_sdk"),
	}

	pullOptions := types.ImagePullOptions{}
	for _, image := range images {
		log.Printf("[INFO] Pulling image %s", image)
		reader, err := dockercli.ImagePull(ctx, image, pullOptions)
		if err != nil {
			log.Printf("[ERROR] Failed getting image %s: %s", image, err)
			continue
		}

		io.Copy(os.Stdout, reader)
		log.Printf("[INFO] Successfully downloaded and built %s", image)
	}
}

// Will be used for checking if there's enough to deploy based on a threshold
// E.g. having maximum CPU and maxmimum RAM
// Does this work containerized?
func getStats() {
	fmt.Printf("\n")

	memory, err := memory.Get()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		return
	}

	before, err := cpu.Get()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		return
	}
	time.Sleep(time.Duration(250) * time.Millisecond)
	after, err := cpu.Get()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		return
	}
	total := float64(after.Total - before.Total)

	fmt.Printf("[INFO] memory total: %d bytes\n", memory.Total)
	fmt.Printf("[INFO] memory used: %d bytes\n", memory.Used)
	fmt.Printf("[INFO] cpu used  : %f%%\n", float64(after.User-before.User)/total*100)
	fmt.Printf("[INFO] cpu system: %f%%\n", float64(after.System-before.System)/total*100)
	fmt.Printf("[INFO] cpu idle  : %f%%\n", float64(after.Idle-before.Idle)/total*100)

	fmt.Printf("\n")
}

// Initial loop etc
func main() {
	log.Println("[INFO] Setting up execution environment")

	//FIXME
	if baseUrl == "" {
		baseUrl = "https://shuffler.io"
		//baseUrl = "http://localhost:5001"
	}

	if orgId == "" {
		log.Printf("[ERROR] Org not defined. Set variable ORG_ID based on your org")
		os.Exit(3)
	}

	workerTimeout := 600
	if workerTimeoutEnv != "" {
		tmpInt, err := strconv.Atoi(workerTimeoutEnv)
		if err == nil {
			workerTimeout = tmpInt
		} else {
			log.Printf("[WARNING] Env SHUFFLE_ORBORUS_EXECUTION_TIMEOUT must be a number, not %s", workerTimeoutEnv)
		}

		log.Printf("[INFO] Cleanup process running every %d seconds", workerTimeout)
	}

	if concurrencyEnv != "" {
		//var concurrencyEnv = os.Getenv("SHUFFLE_ORBORUS_EXECUTION_CONCURRENCY")
		tmpInt, err := strconv.Atoi(concurrencyEnv)
		if err == nil {
			maxConcurrency = tmpInt
			log.Printf("[INFO] Max workflow execution concurrency set to %d", maxConcurrency)
		} else {
			log.Printf("[WARNING] Env SHUFFLE_ORBORUS_EXECUTION_CONCURRENCY must be a number, not %s. Defaulted to %d", workerTimeoutEnv, maxConcurrency)
		}
	}

	ctx := context.Background()
	go zombiecheck(ctx, workerTimeout)

	log.Printf("[INFO] Running towards %s with Org %s", baseUrl, orgId)
	httpProxy := os.Getenv("HTTP_PROXY")
	httpsProxy := os.Getenv("HTTPS_PROXY")

	if environment == "" {
		environment = "onprem"
		log.Printf("[INFO] Defaulting to environment name %s. Set environment variable ENVIRONMENT_NAME to change. This should be the same as in the frontend action.", environment)
	}

	// FIXME - during init, BUILD and/or LOAD worker and app_sdk
	// Build/load app_sdk so it can be loaded as 127.0.0.1:5000/walkoff_app_sdk
	log.Printf("[INFO] Setting up Docker environment. Downloading worker and App SDK!")

	initializeImages()

	//workerName := "worker"
	//workerVersion := "0.1.0"
	//workerImage := fmt.Sprintf("docker.pkg.github.com/frikky/shuffle/%s:%s", workerName, workerVersion)
	//workerImage := fmt.Sprintf("%s/worker:%s", baseimagename, workerVersion)
	// workerImage := fmt.Sprintf("docker.io/%s:worker", baseimagename)
	// fmt.Sprintf("%s/%s:app_sdk%s", baseimageregistry, baseimagename, baseimagetagsuffix),
	//workerImage := fmt.Sprintf("%s/%s:worker%s", baseimageregistry, baseimagename, baseimagetagsuffix)
	workerImage := fmt.Sprintf("%s/%s/shuffle-worker:%s", baseimageregistry, baseimagename, workerVersion)

	log.Printf("[INFO] Finished configuring docker environment")

	// FIXME - time limit
	client := &http.Client{
		Transport: &http.Transport{
			Proxy: nil,
		},
	}

	//getStats()

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

	fullUrl := fmt.Sprintf("%s/api/v1/workflows/queue", baseUrl)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Printf("[ERROR] Failed making request builder: %s", err)
		os.Exit(3)
	}

	zombiecounter := 0
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Org-Id", orgId)
	log.Printf("[INFO] Waiting for executions at %s", fullUrl)
	hasStarted := false
	for {
		//log.Printf("Prerequest")
		//go getStats()
		newresp, err := client.Do(req)
		//log.Printf("Postrequest")
		if err != nil {
			log.Printf("[WARNING] Failed making request: %s", err)
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck(ctx, workerTimeout)
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		// FIXME - add check for StatusCode
		if newresp.StatusCode != 200 {
			if hasStarted {
				log.Printf("[WARNING] Bad statuscode: %d", newresp.StatusCode)
			}
		} else {
			hasStarted = true
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("[ERROR] Failed reading body: %s", err)
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck(ctx, workerTimeout)
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		var executionRequests shuffle.ExecutionRequestWrapper
		err = json.Unmarshal(body, &executionRequests)
		if err != nil {
			log.Printf("[WARNING] Failed executionrequest in queue unmarshaling: %s", err)
			sleepTime = 10
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck(ctx, workerTimeout)
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if hasStarted && len(executionRequests.Data) > 0 {
			//log.Printf("[INFO] Body: %s", string(body))
			// Type string `json:"type"`
		}

		if len(executionRequests.Data) == 0 {
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck(ctx, workerTimeout)
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		// Anything below here verifies concurrency
		executionCount := getRunningWorkers(ctx, workerTimeout)
		if executionCount >= maxConcurrency {
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck(ctx, workerTimeout)
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		allowed := maxConcurrency - executionCount
		if len(executionRequests.Data) > allowed {
			log.Printf("[WARNING] Throttle - Cutting down requests from %d to %d (MAX: %d, CUR: %d)", len(executionRequests.Data), allowed, maxConcurrency, executionCount)
			executionRequests.Data = executionRequests.Data[0:allowed]
		}

		// New, abortable version. Should check executionid and remove everything else
		var toBeRemoved shuffle.ExecutionRequestWrapper
		for _, execution := range executionRequests.Data {
			if len(execution.ExecutionArgument) > 0 {
				log.Printf("[INFO] Argument: %#v", execution.ExecutionArgument)
			}

			if execution.Type == "schedule" {
				log.Printf("[INFO] SOMETHING ELSE :O: %s", execution.Type)
				continue
			}

			if execution.Status == "ABORT" || execution.Status == "FAILED" {
				log.Printf("[INFO] Executionstatus issue: ", execution.Status)
			}

			found := false
			for _, executionId := range executionIds {
				if execution.ExecutionId == executionId {
					found = true
					break
				}
			}

			// Doesn't work because of USER INPUT
			if found {
				log.Printf("[INFO] Skipping duplicate %s", execution.ExecutionId)
				continue
			} else {
				//log.Printf("[INFO] Adding to be ran %s", execution.ExecutionId)
				executionIds = append(executionIds, execution.ExecutionId)
			}

			// Now, how do I execute this one?
			// FIXME - if error, check the status of the running one. If it's bad, send data back.
			containerName := fmt.Sprintf("worker-%s", execution.ExecutionId)
			env := []string{
				fmt.Sprintf("AUTHORIZATION=%s", execution.Authorization),
				fmt.Sprintf("EXECUTIONID=%s", execution.ExecutionId),
				fmt.Sprintf("ENVIRONMENT_NAME=%s", environment),
				fmt.Sprintf("BASE_URL=%s", baseUrl),
				fmt.Sprintf("CLEANUP=%s", cleanupEnv),
				fmt.Sprintf("SHUFFLE_PASS_APP_PROXY=%s", os.Getenv("SHUFFLE_PASS_APP_PROXY")),
			}

			//log.Printf("Running worker with proxy? %s", os.Getenv("SHUFFLE_PASS_WORKER_PROXY"))
			if strings.ToLower(os.Getenv("SHUFFLE_PASS_WORKER_PROXY")) == "true" {
				env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
				env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
			}

			if dockerApiVersion != "" {
				env = append(env, fmt.Sprintf("DOCKER_API_VERSION=%s", dockerApiVersion))
			}

			go deployWorker(workerImage, containerName, env)

			log.Printf("[INFO] ExecutionID %s was deployed and to be removed from queue.", execution.ExecutionId)
			zombiecounter += 1
			toBeRemoved.Data = append(toBeRemoved.Data, execution)
		}

		// Removes handled workflows (worker is made)
		if len(toBeRemoved.Data) > 0 {
			confirmUrl := fmt.Sprintf("%s/api/v1/workflows/queue/confirm", baseUrl)

			data, err := json.Marshal(toBeRemoved)
			if err != nil {
				log.Printf("[WARNING] Failed removal marshalling: %s", err)
				time.Sleep(time.Duration(sleepTime) * time.Second)
				continue
			}

			result, err := http.NewRequest(
				"POST",
				confirmUrl,
				bytes.NewBuffer([]byte(data)),
			)

			if err != nil {
				log.Printf("[ERROR] Failed building confirm request: %s", err)
				time.Sleep(time.Duration(sleepTime) * time.Second)
				continue
			}

			result.Header.Add("Content-Type", "application/json")
			result.Header.Add("Org-Id", orgId)

			resultResp, err := client.Do(result)
			if err != nil {
				log.Printf("[ERROR] Failed making confirm request: %s", err)
				time.Sleep(time.Duration(sleepTime) * time.Second)
				continue
			}

			body, err := ioutil.ReadAll(resultResp.Body)
			if err != nil {
				log.Printf("[ERROR] Failed reading confirm body: %s", err)
				time.Sleep(time.Duration(sleepTime) * time.Second)
				continue
			}

			_ = body
			//log.Println(string(body))

			// FIXME - remove these
			//log.Println(string(body))
			//log.Println(resultResp)
			if len(toBeRemoved.Data) == len(executionRequests.Data) {
				//log.Println("Should remove ALL!")
			} else {
				log.Printf("[INFO] NOT IMPLEMENTED: Should remove %d workflows from backend because they're executed!", len(toBeRemoved.Data))
			}
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}

// Is this ok to do with Docker? idk :)
func getRunningWorkers(ctx context.Context, workerTimeout int) int {
	containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
		All: true,
	})

	// Automatically updates the version
	if err != nil {
		log.Printf("[ERROR] Error getting containers: %s", err)

		newVersionSplit := strings.Split(fmt.Sprintf("%s", err), "version is")
		if len(newVersionSplit) > 1 {
			dockerApiVersion = strings.TrimSpace(newVersionSplit[1])
			log.Printf("[INFO] Changed the API version to default to %s", dockerApiVersion)
		}

		return maxConcurrency
	}

	currenttime := time.Now().Unix()
	counter := 0
	for _, container := range containers {
		// Skip random containers. Only handle things related to Shuffle.
		if !strings.Contains(container.Image, baseimagename) {
			shuffleFound := false
			for _, item := range container.Labels {
				if item == "shuffle" {
					shuffleFound = true
					break
				}
			}

			// Check image name
			if !shuffleFound {
				continue
			}
			//} else {
			//	log.Printf("NAME: %s", container.Image)
		}

		for _, name := range container.Names {
			// FIXME - add name_version_uid_uid regex check as well
			if !strings.HasPrefix(name, "/worker") {
				continue
			}

			//log.Printf("Time: %d - %d", currenttime-container.Created, int64(workerTimeout))
			if container.State == "running" && currenttime-container.Created < int64(workerTimeout) {
				counter += 1
				break
			}
		}
	}

	return counter
}

// FIXME - add this to remove exited workers
// Should it check what happened to the execution? idk
func zombiecheck(ctx context.Context, workerTimeout int) error {
	executionIds = []string{}
	log.Println("[INFO] Looking for old containers (zombies)")
	containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
		All: true,
	})

	//log.Printf("Len: %d", len(containers))

	if err != nil {
		log.Printf("[ERROR] Failed creating Containerlist: %s", err)
		return err
	}

	containerNames := map[string]string{}

	stopContainers := []string{}
	removeContainers := []string{}
	log.Printf("[INFO] Baseimage: %s, Workertimeout: %d", baseimagename, int64(workerTimeout))
	baseString := `/bin/sh -c 'python app.py --log-level DEBUG'`
	for _, container := range containers {
		// Skip random containers. Only handle things related to Shuffle.
		if !strings.Contains(container.Image, baseimagename) && container.Command != baseString && container.Command != "./worker" {
			shuffleFound := false
			for _, item := range container.Labels {
				if item == "shuffle" {
					shuffleFound = true
					break
				}
			}

			// Check image name
			if !shuffleFound {
				//log.Printf("[WARNING] Zombie container skip: %#v, %s", container.Labels, container.Image)
				continue
			}
			//} else {
			//	log.Printf("NAME: %s", container.Image)
		} else {
			//log.Printf("Img: %s", container.Image)
			//log.Printf("Names: %s", container.Names)
		}

		for _, name := range container.Names {
			// FIXME - add name_version_uid_uid regex check as well
			if strings.HasPrefix(name, "/shuffle") && !strings.HasPrefix(name, "/shuffle-subflow") {
				continue
			}

			currenttime := time.Now().Unix()
			//log.Printf("[INFO] (%s) NAME: %s. TIME: %d", container.State, name, currenttime-container.Created)

			// Need to check time here too because a container can be removed the same instant as its created
			if container.State != "running" && currenttime-container.Created > int64(workerTimeout) {
				removeContainers = append(removeContainers, container.ID)
				containerNames[container.ID] = name
			}

			// stopcontainer & removecontainer
			//log.Printf("Time: %d - %d", currenttime-container.Created, int64(workerTimeout))
			if container.State == "running" && currenttime-container.Created > int64(workerTimeout) {
				stopContainers = append(stopContainers, container.ID)
				containerNames[container.ID] = name
			}
		}
	}

	// FIXME - add killing of apps with same execution ID too
	log.Printf("[INFO] Should STOP %d containers.", len(stopContainers))
	for _, containername := range stopContainers {
		log.Printf("[INFO] Stopping and removing container %s", containerNames[containername])
		dockercli.ContainerStop(ctx, containername, nil)
		removeContainers = append(removeContainers, containername)
	}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	log.Printf("[INFO] Should REMOVE %d containers.", len(removeContainers))
	for _, containername := range removeContainers {
		dockercli.ContainerRemove(ctx, containername, removeOptions)
	}

	return nil
}
