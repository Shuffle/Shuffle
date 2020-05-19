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
	dockerclient "github.com/docker/docker/client"
	//network "github.com/docker/docker/api/types/network"
	//natting "github.com/docker/go-connections/nat"
)

var baseUrl = os.Getenv("BASE_URL")
var baseimagename = "frikky/shuffle"
var dockerApiVersion = os.Getenv("DOCKER_API_VERSION")
var environment = os.Getenv("ENVIRONMENT_NAME")
var orgId = os.Getenv("ORG_ID")
var workerTimeout = 600

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

// Deploys the internal worker whenever something happens
func deployWorker(cli *dockerclient.Client, image string, identifier string, env []string) error {
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
	//Volumes: map[string]struct{}{
	//	"/var/run/docker.sock": {},
	//},

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
	log.Printf("Container %s is created", cont.ID)
	return nil
}

func stopWorker(containername string) error {
	ctx := context.Background()

	cli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Println("Unable to create docker client")
		return err
	}

	//	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
	//		All: true,
	//	})

	if err := cli.ContainerStop(ctx, containername, nil); err != nil {
		log.Printf("Unable to stop container %s - running removal anyway, just in case: %s", containername, err)
	}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	if err := cli.ContainerRemove(ctx, containername, removeOptions); err != nil {
		log.Printf("Unable to remove container: %s", err)
	}

	return nil
}

func initializeImages(dockercli *dockerclient.Client) {
	ctx := context.Background()

	// check whether theyre the same first
	images := []string{
		fmt.Sprintf("docker.io/%s:app_sdk", baseimagename),
		fmt.Sprintf("docker.io/%s:worker", baseimagename),
	}

	pullOptions := types.ImagePullOptions{}
	for _, image := range images {
		reader, err := dockercli.ImagePull(ctx, image, pullOptions)
		if err != nil {
			log.Printf("Failed getting %s", image)
			continue
		}

		io.Copy(os.Stdout, reader)
		log.Printf("Successfully downloaded and built %s", image)
	}
}

// Initial loop etc
func main() {
	zombiecheck()
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

	if environment == "" {
		environment = "onprem"
		log.Printf("Defaulting to environment name %s. Set environment variable ENVIRONMENT_NAME to change. This should be the same as in the frontend action.", environment)
	}

	// FIXME - during init, BUILD and/or LOAD worker and app_sdk
	// Build/load app_sdk so it can be loaded as 127.0.0.1:5000/walkoff_app_sdk
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		fmt.Println("Unable to create docker client")
		os.Exit(3)
	}

	log.Printf("--- Setting up Docker environment. Downloading worker and App SDK! ---")
	initializeImages(dockercli)
	workerImage := fmt.Sprintf("%s:worker", baseimagename)

	log.Printf("--- Finished configuring docker environment ---\n")

	// FIXME - time limit
	sleepTime := 10
	client := &http.Client{}

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
				zombiecheck()
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
				zombiecheck()
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
				zombiecheck()
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
				zombiecheck()
				zombiecounter = 0
			}
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		// New, abortable version. Should check executionid and remove everything else
		var toBeRemoved ExecutionRequestWrapper
		for _, execution := range executionRequests.Data {
			log.Printf("Argument: %#v", execution.ExecutionArgument)

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
				fmt.Sprintf("DOCKER_API_VERSION=%s", dockerApiVersion),
				fmt.Sprintf("ENVIRONMENT_NAME=%s", environment),
				fmt.Sprintf("BASE_URL=%s", baseUrl),
			}

			err = deployWorker(dockercli, workerImage, containerName, env)
			if err != nil {
				stats, err := dockercli.ContainerInspect(context.Background(), containerName)
				if err != nil {
					log.Printf("Failed checking worker %s", execution.ExecutionId)
					continue
				}

				containerStatus := stats.ContainerJSONBase.State.Status
				if containerStatus != "running" {
					log.Printf("Status of %s is %s. Should be running. Will reset", containerName, containerStatus)
					err = stopWorker(containerName)
					if err != nil {
						log.Printf("Failed stopping worker %s", execution.ExecutionId)
						continue
					}

					err = deployWorker(dockercli, workerImage, containerName, env)
					if err != nil {
						log.Printf("Failed executing worker %s in state %s", execution.ExecutionId, containerStatus)
					}
				} else {
					// Should basically never hit here rofl
					log.Printf("ERROR: I HAVE NO IDEA WHAT WENT WRONG. CHECK %s", containerName)
				}
			}

			log.Printf("%s is deployed and to being removed from queue.", execution.ExecutionId)
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

			log.Println(string(body))

			// FIXME - remove these
			//log.Println(string(body))
			//log.Println(resultResp)
			if len(toBeRemoved.Data) == len(executionRequests.Data) {
				log.Println("Should remove ALL!")
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
	log.Println("Running zombiecheck")
	ctx := context.Background()

	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Println("Unable to create docker client")
		return err
	}

	containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
		All: true,
	})

	stopContainers := []string{}
	removeContainers := []string{}
	for _, container := range containers {
		for _, name := range container.Names {
			// FIXME - add name_version_uid_uid regex check as well
			if !strings.HasPrefix(name, "/worker") {
				continue
			}

			if container.State != "running" {
				removeContainers = append(removeContainers, container.ID)
			}

			// stopcontainer & removecontainer
			currenttime := time.Now().Unix()
			if container.State == "running" && currenttime-container.Created > int64(workerTimeout) {
				stopContainers = append(stopContainers, container.ID)
			}
		}
	}

	// FIXME - add killing of apps with same execution ID too
	for _, containername := range stopContainers {
		if err := dockercli.ContainerStop(ctx, containername, nil); err != nil {
			log.Printf("Unable to stop container: %s", err)
		} else {
			log.Printf("Stopped container %s", containername)
		}
	}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	for _, containername := range removeContainers {
		if err := dockercli.ContainerRemove(ctx, containername, removeOptions); err != nil {
			log.Printf("Unable to remove container: %s", err)
		} else {
			log.Printf("Removed container %s", containername)
		}
	}

	return nil
}
