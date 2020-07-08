package main

/*
	Orborus exists to listen for new workflow executions and deploy workers.
*/

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
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
	//network "github.com/docker/docker/api/types/network"
	//natting "github.com/docker/go-connections/nat"
)

var baseUrl = os.Getenv("BASE_URL")
var baseimagename = "frikky/shuffle"
var shuffleNetwork = "" // Filled in init if found

var dockerApiVersion = os.Getenv("DOCKER_API_VERSION")
var sysApiKey = os.Getenv("SYS_API_KEY")
var environment = os.Getenv("ENVIRONMENT_NAME")
var orgId = os.Getenv("ORG_ID")

// Starts jobs in bulk, so this could be increased
var sleepTime = 3

// Timeout if somethinc rashes
//var workerTimeout = 600
var workerTimeout = 300

type ExecutionRequestWrapper struct {
	Data []ExecutionRequest `json:"data"`
}

type ExecutionRequest struct {
	ExecutionId       string `json:"execution_id"`
	ExecutionArgument string `json:"execution_argument"`
	WorkflowId        string `json:"workflow_id"`
	Authorization     string `json:"authorization"`
	Status            string `json:"status"`
	Type              string `json:"type"`
}

var dockercli *dockerclient.Client

func init() {
	var err error

	dockercli, err = dockerclient.NewEnvClient()
	if err != nil {
		panic(fmt.Sprintf("Unable to create docker client: %s", err))
	}

	// BElow:
	// Checking if orborus is running on docker within a specific network
	ctx := context.Background()
	networkName := ""
	dockerNetworks, err := dockercli.NetworkList(ctx, types.NetworkListOptions{})
	for _, item := range dockerNetworks {
		if strings.Contains(strings.ToLower(item.Name), "shuffle") {
			networkName = item.Name
			break
		}
	}

	if len(networkName) > 0 {
		containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
			All: true,
		})
		if err != nil {
			log.Printf("Failed getting containers during init - running without network check: %s", err)
		}
		_ = networkName

		// Skip random containers. Only handle things related to Shuffle.
		for _, container := range containers {
			for key, value := range container.NetworkSettings.Networks {
				_ = value
				if key == networkName {
					for _, name := range container.Names {
						if strings.Contains(strings.ToLower(name), "orborus") {
							// BEING HERE MEANS THAT ORBORUS HAS BEEN FOUND IN THE SPECIFIED NETWORK
							shuffleNetwork = networkName
							break
						}
					}
				}
			}
		}
	}
}

// Deploys the internal worker whenever something happens
func deployWorker(image string, identifier string, env []string) {
	// Binds is the actual "-v" volume.
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type:   "json-file",
			Config: map[string]string{},
		},
		Binds: []string{
			"/var/run/docker.sock:/var/run/docker.sock:rw",
		},
	}

	// ROFL: https://docker-py.readthedocs.io/en/1.4.0/volumes/
	config := &container.Config{
		Image: image,
		Env:   env,
	}

	// Look for Shuffle network and set it

	// FIXME: Move this out of here and have it be a global setting. During init?
	networkConfig := &network.NetworkingConfig{}
	if len(shuffleNetwork) > 0 {
		networkConfig = &network.NetworkingConfig{
			EndpointsConfig: map[string]*network.EndpointSettings{
				shuffleNetwork: {
					NetworkID: shuffleNetwork,
				},
			},
		}
		env = append(env, fmt.Sprintf("DOCKER_NETWORK", shuffleNetwork))
	}

	//test := &network.EndpointSettings{
	//	Gateway: "helo",
	//}
	//NetworkID
	//if connect.EndpointConfig.NetworkID != "NetworkID" {

	cont, err := dockercli.ContainerCreate(
		context.Background(),
		config,
		hostConfig,
		networkConfig,
		nil,
		identifier,
	)

	if err != nil {
		log.Println(err)
		return
	}

	err = dockercli.ContainerStart(context.Background(), cont.ID, types.ContainerStartOptions{})
	if err != nil {
		log.Printf("Failed to start container in environment %s: %s", environment, err)
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
		log.Printf("Container %s was created under environment %s", cont.ID, environment)
	}

	return
}

func stopWorker(containername string) error {
	ctx := context.Background()

	//	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
	//		All: true,
	//	})

	if err := dockercli.ContainerStop(ctx, containername, nil); err != nil {
		log.Printf("Unable to stop container %s - running removal anyway, just in case: %s", containername, err)
	}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	if err := dockercli.ContainerRemove(ctx, containername, removeOptions); err != nil {
		log.Printf("Unable to remove container: %s", err)
	}

	return nil
}

func initializeImages() {
	ctx := context.Background()

	// check whether theyre the same first
	//version := "0.1.0"
	// fmt.Sprintf("docker.pkg.github.com/frikky/shuffle/orborus:%s", version),
	// fmt.Sprintf("docker.pkg.github.com/frikky/shuffle/worker:%s", version),
	images := []string{
		fmt.Sprintf("docker.io/%s:app_sdk", baseimagename),
		fmt.Sprintf("docker.io/%s:worker", baseimagename),
	}

	pullOptions := types.ImagePullOptions{}
	for _, image := range images {
		reader, err := dockercli.ImagePull(ctx, image, pullOptions)
		if err != nil {
			log.Printf("Failed getting %s: %s", image, err)
			continue
		}

		io.Copy(os.Stdout, reader)
		log.Printf("Successfully downloaded and built %s", image)
	}
}

// Initial loop etc
func main() {
	go zombiecheck()
	log.Println("Setting up execution environment")

	//FIXME
	if baseUrl == "" {
		baseUrl = "https://shuffler.io"
		//baseUrl = "http://localhost:5001"
	}

	if orgId == "" {
		log.Printf("Org not defined. Set variable ORG_ID based on your org")
		os.Exit(3)
	}

	log.Printf("Running towards %s with Org %s", baseUrl, orgId)
	httpProxy := os.Getenv("HTTP_PROXY")
	httpsProxy := os.Getenv("HTTPS_PROXY")

	if environment == "" {
		environment = "onprem"
		log.Printf("Defaulting to environment name %s. Set environment variable ENVIRONMENT_NAME to change. This should be the same as in the frontend action.", environment)
	}

	// FIXME - during init, BUILD and/or LOAD worker and app_sdk
	// Build/load app_sdk so it can be loaded as 127.0.0.1:5000/walkoff_app_sdk
	log.Printf("--- Setting up Docker environment. Downloading worker and App SDK! ---")
	initializeImages()

	//workerName := "worker"
	//workerVersion := "0.1.0"
	//workerImage := fmt.Sprintf("docker.pkg.github.com/frikky/shuffle/%s:%s", workerName, workerVersion)
	workerImage := fmt.Sprintf("%s:worker", baseimagename)

	log.Printf("--- Finished configuring docker environment ---\n")

	// FIXME - time limit
	client := &http.Client{
		Transport: &http.Transport{
			Proxy: nil,
		},
	}

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

	fullUrl := fmt.Sprintf("%s/api/v1/workflows/queue", baseUrl)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Printf("Failed making request builder: %s", err)
		os.Exit(3)
	}

	zombiecounter := 0
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Org-Id", orgId)
	log.Printf("Getting data from %s", fullUrl)
	hasStarted := false
	for {
		//log.Printf("Prerequest")
		newresp, err := client.Do(req)
		//log.Printf("Postrequest")
		if err != nil {
			log.Printf("Failed making request: %s", err)
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck()
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		// FIXME - add check for StatusCode
		if newresp.StatusCode != 200 {
			if hasStarted {
				log.Printf("Bad statuscode: %d", newresp.StatusCode)
			}
		} else {
			hasStarted = true
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("Failed reading body: %s", err)
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck()
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		var executionRequests ExecutionRequestWrapper
		err = json.Unmarshal(body, &executionRequests)
		if err != nil {
			log.Printf("Failed executionrequest in queue unmarshaling: %s", err)
			sleepTime = 10
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck()
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if hasStarted && len(executionRequests.Data) > 0 {
			log.Printf("Body: %s", string(body))
			// Type string `json:"type"`
		}

		if len(executionRequests.Data) == 0 {
			zombiecounter += 1
			if zombiecounter*sleepTime > workerTimeout {
				go zombiecheck()
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		// New, abortable version. Should check executionid and remove everything else
		var toBeRemoved ExecutionRequestWrapper
		for _, execution := range executionRequests.Data {
			if len(execution.ExecutionArgument) > 0 {
				log.Printf("Argument: %#v", execution.ExecutionArgument)
			}

			if execution.Type == "schedule" {
				log.Printf("SOMETHING ELSE :O: %s", execution.Type)
				continue
			}

			if execution.Status == "ABORT" || execution.Status == "FAILED" {
				log.Printf("Executionstatus issue: ", execution.Status)
			}
			// Now, how do I execute this one?
			// FIXME - if error, check the status of the running one. If it's bad, send data back.
			containerName := fmt.Sprintf("worker-%s", execution.ExecutionId)
			env := []string{
				fmt.Sprintf("AUTHORIZATION=%s", execution.Authorization),
				fmt.Sprintf("EXECUTIONID=%s", execution.ExecutionId),
				fmt.Sprintf("ENVIRONMENT_NAME=%s", environment),
				fmt.Sprintf("BASE_URL=%s", baseUrl),
			}

			if strings.ToLower(os.Getenv("SHUFFLE_PASS_WORKER_PROXY")) != "false" {
				env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
				env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
			}

			if dockerApiVersion != "" {
				env = append(env, fmt.Sprintf("DOCKER_API_VERSION=%s", dockerApiVersion))
			}

			if sysApiKey != "" {
				env = append(env, fmt.Sprintf("SYS_API_KEY=%s", sysApiKey))
			}

			go deployWorker(workerImage, containerName, env)

			log.Printf("%s is deployed and to be removed from queue.", execution.ExecutionId)
			zombiecounter += 1
			toBeRemoved.Data = append(toBeRemoved.Data, execution)
		}

		// Removes handled workflows (worker is made)
		if len(toBeRemoved.Data) > 0 {
			confirmUrl := fmt.Sprintf("%s/api/v1/workflows/queue/confirm", baseUrl)

			data, err := json.Marshal(toBeRemoved)
			if err != nil {
				log.Printf("Failed removal marshalling: %s", err)
				time.Sleep(time.Duration(sleepTime) * time.Second)
				continue
			}

			result, err := http.NewRequest(
				"POST",
				confirmUrl,
				bytes.NewBuffer([]byte(data)),
			)

			if err != nil {
				log.Printf("Failed building confirm request: %s", err)
				time.Sleep(time.Duration(sleepTime) * time.Second)
				continue
			}

			result.Header.Add("Content-Type", "application/json")
			result.Header.Add("Org-Id", orgId)

			resultResp, err := client.Do(result)
			if err != nil {
				log.Printf("Failed making confirm request: %s", err)
				time.Sleep(time.Duration(sleepTime) * time.Second)
				continue
			}

			body, err := ioutil.ReadAll(resultResp.Body)
			if err != nil {
				log.Printf("Failed reading confirm body: %s", err)
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
				log.Printf("NOT IMPLEMENTED: Should remove %d workflows from backend because they're executed!", len(toBeRemoved.Data))
			}
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}

// FIXME - add this to remove exited workers
// Should it check what happened to the execution? idk
func zombiecheck() error {
	log.Println("Looking for old containers")
	ctx := context.Background()

	containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
		All: true,
	})

	if err != nil {
		log.Printf("Failed creating Containerlist: %s", err)
		return err
	}

	containerNames := map[string]string{}

	stopContainers := []string{}
	removeContainers := []string{}
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
			if strings.HasPrefix(name, "/shuffle") {
				continue
			}

			log.Printf("NAME: %s", name)

			// Need to check time here too because a container can be removed the same instant as its created
			currenttime := time.Now().Unix()
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
	for _, containername := range stopContainers {
		log.Printf("Stopping and removing container %s", containerNames[containername])
		go dockercli.ContainerStop(ctx, containername, nil)
		removeContainers = append(removeContainers, containername)
	}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	for _, containername := range removeContainers {
		go dockercli.ContainerRemove(ctx, containername, removeOptions)
	}

	return nil
}
