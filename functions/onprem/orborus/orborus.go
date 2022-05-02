package main

/*
	Orborus exists to listen for new workflow executions whcih are deployed as workers.
*/

// FIXME:
// 2022/01/12 17:13:36 [WARNING] Swarm init: Error response from daemon: manager stopped: failed to listen on remote API address: listen tcp: address tcp/2377%!(EXTRA string=172.23.0.2): unknown port

// frikky@debian:~/git/shuffle/functions/onprem/worker$ docker service create --replicas 5 --name shuffle-workers --env SHUFFLE_SWARM_CONFIG=run --publish published=33333,target=33333 ghcr.io/frikky/shuffle-worker:nightly

//  Potential issues:
// Default network could be same as on the host
// Ingress network may not exist (default)

import (
	"github.com/shuffle/shuffle-shared"

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
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/swarm"

	//"github.com/docker/docker/api/types/filters"
	dockerclient "github.com/docker/docker/client"
	uuid "github.com/satori/go.uuid"

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

// Used for cloud with auth
var auth = os.Getenv("AUTH")
var org = os.Getenv("ORG")

//var orgId = os.Getenv("ORG_ID")
var baseUrl = os.Getenv("BASE_URL")
var environment = os.Getenv("ENVIRONMENT_NAME")
var dockerApiVersion = os.Getenv("DOCKER_API_VERSION")
var runningMode = strings.ToLower(os.Getenv("RUNNING_MODE"))
var cleanupEnv = strings.ToLower(os.Getenv("CLEANUP"))
var timezone = os.Getenv("TZ")
var containerName = os.Getenv("ORBORUS_CONTAINER_NAME")
var swarmConfig = os.Getenv("SHUFFLE_SWARM_CONFIG")
var swarmNetworkName = os.Getenv("SHUFFLE_SWARM_NETWORK_NAME")
var executionIds = []string{}

var dockercli *dockerclient.Client
var containerId string

func init() {
	var err error

	dockercli, err = dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
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
			log.Printf("[DEBUG] Set containerId network to %s", containerId)

			// cgroup error. Use fallback strategy below.
			// https://github.com/moby/moby/issues/7015
			//log.Printf("Checking if %s is in %s", ".scope", string(out))
			if strings.Contains(string(out), ".scope") {
				log.Printf("[DEBUG] ContainerId contains scope. setting to empty.")
				containerId = ""
				//docker-76c537e9a4b7c7233011f5d70e6b7f2d600b6413ac58a96519b8dca7a3f7117a.scope
			}
		} else {
			log.Printf("[WARNING] Failed getting container ID: %s", err)
		}
	}

	if containerId == "" {
		if containerName != "" {
			containerId = containerName
			log.Printf("[INFO] Falling back to CONTAINER_NAME as container ID")
		} else {
			containerId = "shuffle-orborus"
			log.Printf(`[WARNING] CONTAINER_NAME is not set. Falling back to default name "%s" as container ID`, containerId)
		}
	}

	log.Printf(`[INFO] Started with containerId "%s"`, containerId)
}

func cleanupExistingNodes(ctx context.Context) error {
	serviceListOptions := types.ServiceListOptions{}
	services, err := dockercli.ServiceList(
		context.Background(),
		serviceListOptions,
	)

	if err != nil {
		log.Printf("[DEBUG] Failed finding containers: %s", err)
		return err
	}

	//log.Printf("\n\nFound %d contaienrs", len(services))

	for _, service := range services {
		//log.Printf("[INFO] Service: %#v", service.Spec.Annotations.Name)

		//portFound := false
		//for _, endpoint := range service.Spec.EndpointSpec.Ports {
		//	if strings.Contains(endpoint.Name, "port") {
		//		//portFound = true
		//	}
		//}

		if strings.Contains(service.Spec.Annotations.Name, "opensearch") {
			continue
		}

		if strings.Contains(service.Spec.TaskTemplate.ContainerSpec.Image, "shuffle") {

			if !strings.Contains(service.Spec.TaskTemplate.ContainerSpec.Image, "shuffle-frontend") &&
				!strings.Contains(service.Spec.TaskTemplate.ContainerSpec.Image, "shuffle-backend") &&
				!strings.Contains(service.Spec.TaskTemplate.ContainerSpec.Image, "shuffle-orborus") {

				err = dockercli.ServiceRemove(ctx, service.ID)
				if err != nil {
					log.Printf("[DEBUG] Failed to remove service %s", service.Spec.Annotations.Name)
				} else {
					log.Printf("[DEBUG] Removed service %#v", service.Spec.TaskTemplate.ContainerSpec.Image)
				}
			}
		}
	}

	return nil
}

func deployServiceWorkers(image string) {
	log.Printf("[DEBUG] Validating deployment of workers as services IF swarmConfig = run (value: %#v)", swarmConfig)
	if swarmConfig == "run" || swarmConfig == "swarm" {
		ctx := context.Background()
		// Looks for and cleans up all existing items in swarm we can't re-use (Shuffle only)

		// frikky@debian:~/git/shuffle/functions/onprem/worker$ docker service create --replicas 5 --name shuffle-workers --env SHUFFLE_SWARM_CONFIG=run --publish published=33333,target=33333 ghcr.io/frikky/shuffle-worker:nightly
		networkName := "shuffle_swarm_executions"
		if len(swarmNetworkName) > 0 {
			networkName = swarmNetworkName
		}

		ingressOptions := types.NetworkCreate{
			Driver:     "overlay",
			Attachable: false,
			Ingress:    true,
			IPAM: &network.IPAM{
				Driver: "default",
				Config: []network.IPAMConfig{
					network.IPAMConfig{
						Subnet:  "10.225.225.0/24",
						Gateway: "10.225.225.1",
					},
				},
			},
		}

		_, err := dockercli.NetworkCreate(
			ctx,
			"ingress",
			ingressOptions,
		)

		if err != nil {
			log.Printf("[WARNING] Ingress network may already exist: %s", err)
		}

		//docker network create --driver=overlay workers
		// Specific subnet?
		networkCreateOptions := types.NetworkCreate{
			Driver:     "overlay",
			Attachable: true,
			Ingress:    false,
			IPAM: &network.IPAM{
				Driver: "default",
				Config: []network.IPAMConfig{
					network.IPAMConfig{
						Subnet:  "10.224.224.0/24",
						Gateway: "10.224.224.1",
					},
				},
			},
		}
		_, err = dockercli.NetworkCreate(
			ctx,
			networkName,
			networkCreateOptions,
		)

		if err != nil {
			if strings.Contains(fmt.Sprintf("%s", err), "already exists") {
				// Try patching for attachable

			} else {
				log.Printf("[DEBUG] Failed to create network %s for workers: %s. This is not critical, and containers will still be added", networkName, err)
			}
		}

		defaultNetworkAttach := false
		if containerId != "" {
			log.Printf("[DEBUG] Should connect orborus container to worker network as it's running in Docker with name %#v!", containerId)
			// https://pkg.go.dev/github.com/docker/docker@v20.10.12+incompatible/api/types/network#EndpointSettings
			networkConfig := &network.EndpointSettings{}
			err := dockercli.NetworkConnect(ctx, networkName, containerId, networkConfig)
			if err != nil {
				log.Printf("[ERROR] Failed connecting Orborus to docker network %s: %s", networkName, err)
			}

			if len(containerId) == 64 && baseUrl == "http://shuffle-backend:5001" {
				log.Printf("[WARNING] Network MAY not work due to backend being %s and container length 64. Will try to attach shuffle_shuffle network", baseUrl)
				defaultNetworkAttach = true
			}
		}

		//serviceOptions := types.ServiceCreateOptions{}
		//service, err := dockercli.ServiceCreate(
		//	context.Background(),
		//	serviceSpec,
		//	serviceOptions,
		//)

		//containerName := fmt.Sprintf("shuffle-worker-%s", parsedUuid)

		replicas := uint64(1)
		scaleReplicas := os.Getenv("SHUFFLE_SCALE_REPLICAS")
		if len(scaleReplicas) > 0 {
			tmpInt, err := strconv.Atoi(scaleReplicas)
			if err != nil {
				log.Printf("[ERROR] %s is not a valid number for replication", scaleReplicas)
			} else {
				replicas = uint64(tmpInt)
			}

			log.Printf("[DEBUG] SHUFFLE_SCALE_REPLICAS set to value %#v. Trying to overwrite default (%d/node)", scaleReplicas, replicas)
		}

		innerContainerName := fmt.Sprintf("shuffle-workers")

		cnt, _ := findActiveSwarmNodes()
		nodeCount := uint64(1)
		if cnt > 0 {
			nodeCount = uint64(cnt)
		}

		if cnt == 0 {
			cnt = 1
		}

		log.Printf("[DEBUG] Found %d node(s) to replicate over. Defaulting to 1 IF we can't auto-discover them.", cnt)
		replicatedJobs := uint64(replicas * nodeCount)

		log.Printf("[DEBUG] Deploying %d container(s) for worker with swarm to each node. Service name: %s. Image: %s", replicas, innerContainerName, image)

		if timezone == "" {
			timezone = "Europe/Amsterdam"
		}

		// FIXME: May not need ingress ports. Could use internal services and DNS of swarm itself
		// https://github.com/moby/moby/blob/e2f740de442bac52b280bc485a3ca5b31567d938/api/types/swarm/service.go#L46
		serviceSpec := swarm.ServiceSpec{
			Annotations: swarm.Annotations{
				Name:   innerContainerName,
				Labels: map[string]string{},
			},
			Mode: swarm.ServiceMode{
				Replicated: &swarm.ReplicatedService{
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
						Name:          "worker-port",
						PublishedPort: 33333,
						TargetPort:    33333,
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
						fmt.Sprintf("SHUFFLE_SWARM_CONFIG=%s", os.Getenv("SHUFFLE_SWARM_CONFIG")),
						fmt.Sprintf("SHUFFLE_SWARM_NETWORK_NAME=%s", networkName),
						fmt.Sprintf("SHUFFLE_APP_REPLICAS=%d", cnt),
						fmt.Sprintf("TZ=%s", timezone),
						fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", os.Getenv("SHUFFLE_LOGS_DISABLED")),
					},
					Hosts: []string{
						innerContainerName,
					},
				},
				RestartPolicy: &swarm.RestartPolicy{
					Condition: swarm.RestartPolicyConditionOnFailure,
				},
				Placement: &swarm.Placement{
					MaxReplicas: replicas,
				},
			},
		}

		if defaultNetworkAttach == true {
			serviceSpec.Networks = append(serviceSpec.Networks, swarm.NetworkAttachmentConfig{
				Target: "shuffle_shuffle",
			})

			// FIXM: Remove this if deployment fails?
			serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("SHUFFLE_SWARM_OTHER_NETWORK=shuffle_shuffle"))
		}

		if dockerApiVersion != "" {
			serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("DOCKER_API_VERSION=%s", dockerApiVersion))
		}

		if len(os.Getenv("SHUFFLE_SCALE_REPLICAS")) > 0 {
			serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("SHUFFLE_SCALE_REPLICAS=%s", os.Getenv("SHUFFLE_SCALE_REPLICAS")))
		}

		if strings.ToLower(os.Getenv("SHUFFLE_PASS_WORKER_PROXY")) == "true" {
			serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
			serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
			serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("NO_PROXY=%s", os.Getenv("NO_PROXY")))
		}

		if len(os.Getenv("DOCKER_HOST")) > 0 {
			serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("DOCKER_HOST=%s", os.Getenv("DOCKER_HOST")))
		} else {
			serviceSpec.TaskTemplate.ContainerSpec.Mounts = []mount.Mount{
				mount.Mount{
					Source: "/var/run/docker.sock",
					Target: "/var/run/docker.sock",
					Type:   mount.TypeBind,
				},
			}
		}

		serviceOptions := types.ServiceCreateOptions{}
		_, err = dockercli.ServiceCreate(
			ctx,
			serviceSpec,
			serviceOptions,
		)

		if err == nil {
			log.Printf("[DEBUG] Successfully deployed workers with %d replica(s) on %d node(s)", replicas, cnt)
			//time.Sleep(time.Duration(10) * time.Second)
			//log.Printf("[DEBUG] Servicecreate request: %#v %#v", service, err)
		} else {
			if !strings.Contains(fmt.Sprintf("%s", err), "Already Exists") && !strings.Contains(fmt.Sprintf("%s", err), "is already in use by service") {
				log.Printf("[ERROR] Failed making service: %s", err)
			} else {
				log.Printf("[WARNING] Failed deploying workers: %s", err)
				if len(serviceSpec.Networks) > 1 {
					serviceSpec.Networks = []swarm.NetworkAttachmentConfig{
						swarm.NetworkAttachmentConfig{
							Target: "shuffle_shuffle",
						},
					}

					_, _ = dockercli.ServiceCreate(
						ctx,
						serviceSpec,
						serviceOptions,
					)
				}
			}
		}

	}
}

// Deploys the internal worker whenever something happens
// https://docs.docker.com/engine/api/sdk/examples/
func deployWorker(image string, identifier string, env []string, executionRequest shuffle.ExecutionRequest) error {
	// Binds is the actual "-v" volume.
	// Max 20% CPU every second

	//CPUQuota:  25000,
	//CPUPeriod: 100000,
	//CPUShares: 256,
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type: "json-file",
			Config: map[string]string{
				"max-size": "10m",
			},
		},
		Resources: container.Resources{},
	}

	if len(os.Getenv("DOCKER_HOST")) == 0 {
		hostConfig.Binds = []string{"/var/run/docker.sock:/var/run/docker.sock:rw"}
	}

	hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:%s", containerId))

	if cleanupEnv == "true" {
		hostConfig.AutoRemove = true
	}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	//var swarmConfig = os.Getenv("SHUFFLE_SWARM_CONFIG")
	parsedUuid := uuid.NewV4()
	if swarmConfig == "run" || swarmConfig == "swarm" {
		// FIXME: Should we handle replies properly?
		// In certain cases, a workflow may e.g. be aborted already. If it's aborted, that returns
		// a 401 from the worker, which returns an error here
		go sendWorkerRequest(executionRequest)
		//sendWorkerRequest(executionRequest)

		//err := sendWorkerRequest(executionRequest)
		//if err != nil {
		//	log.Printf("[ERROR] Failed worker request for %s: %s", executionRequest.ExecutionId, err)

		//	if strings.Contains(fmt.Sprintf("%s", err), "connection refused") || strings.Contains(fmt.Sprintf("%s", err), "EOF") {
		//		workerImage := fmt.Sprintf("%s/%s/shuffle-worker:%s", baseimageregistry, baseimagename, workerVersion)
		//		deployServiceWorkers(workerImage)

		//		time.Sleep(time.Duration(10) * time.Second)
		//		err = sendWorkerRequest(executionRequest)
		//	}
		//}

		//if err == nil {
		//	// FIXME: Readd this? Removed for rerun reasons
		//	// executionIds = append(executionIds, executionRequest.ExecutionId)
		//}
		//}()

		return nil
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
			identifier = fmt.Sprintf("%s-%s", identifier, parsedUuid)
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
				return err
			}
		} else {
			log.Printf("[ERROR] Container create error: %s", err)
			return err
		}
	}

	containerStartOptions := types.ContainerStartOptions{}
	err = dockercli.ContainerStart(context.Background(), cont.ID, containerStartOptions)
	if err != nil {
		// Trying to recreate and start WITHOUT network if it's possible. No extended checks. Old execution system (<0.9.30)
		if strings.Contains(fmt.Sprintf("%s", err), "cannot join network") || strings.Contains(fmt.Sprintf("%s", err), "No such container") {
			hostConfig.NetworkMode = ""
			//container.NetworkMode(fmt.Sprintf("container:%s", containerId))
			cont, err = dockercli.ContainerCreate(
				context.Background(),
				config,
				hostConfig,
				nil,
				nil,
				identifier+"-2",
			)
			if err != nil {
				log.Printf("[ERROR] Failed to CREATE container (2): %s", err)
			}

			err = dockercli.ContainerStart(context.Background(), cont.ID, containerStartOptions)
			if err != nil {
				log.Printf("[ERROR] Failed to start container (2): %s", err)
			}
		} else {
			log.Printf("[ERROR] Failed initial container start. Quitting as this is NOT a simple network issue. Err: %s", err)
		}

		if err != nil {
			log.Printf("[ERROR] Failed to start worker container in environment %s: %s", environment, err)
			return err
		} else {
			log.Printf("[INFO] Worker Container %s was created under environment %s for execution %s: docker logs %s", cont.ID, environment, executionRequest.ExecutionId, cont.ID)
		}

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

		//	err = deployWorke(cli, workerImage, containerName, env)
		//	if err != nil {
		//		log.Printf("Failed executing worker %s in state %s", execution.ExecutionId, containerStatus)
		//		return
		//	}
		//}
	} else {
		log.Printf("[INFO] Worker Container %s was created under environment %s: docker logs %s", cont.ID, environment, cont.ID)
	}

	return nil
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
		log.Printf("[DEBUG] Setting baseimageregistry")
	}
	if baseimagename == "" {
		baseimagename = "frikky/shuffle"
		baseimagename = "frikky"
		log.Printf("[DEBUG] Setting baseimagename")
	}

	log.Printf("[DEBUG] Setting swarm config to %#v. Default is empty.", swarmConfig)

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
		log.Printf("[DEBUG] Pulling image %s", image)
		reader, err := dockercli.ImagePull(ctx, image, pullOptions)
		if err != nil {
			log.Printf("[ERROR] Failed getting image %s: %s", image, err)
			continue
		}

		io.Copy(os.Stdout, reader)
		log.Printf("[DEBUG] Successfully downloaded and built %s", image)
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

func findActiveSwarmNodes() (int64, error) {
	ctx := context.Background()
	nodes, err := dockercli.NodeList(ctx, types.NodeListOptions{})
	if err != nil {
		return 0, err
	}

	nodeCount := int64(0)
	for _, node := range nodes {
		//log.Printf("ID: %s - %#v", node.ID, node.Status.State)
		if node.Status.State == "ready" {
			nodeCount += 1
		}
	}

	return nodeCount, nil

	/*
		containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
			All: true,
		})
	*/
}

// Get IP
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

func checkSwarmService(ctx context.Context) {
	// https://docs.docker.com/engine/reference/commandline/swarm_init/
	ip := getLocalIP()
	log.Printf("[DEBUG] Attempting swarm setup on %s", ip)
	req := swarm.InitRequest{
		ListenAddr:    fmt.Sprintf("0.0.0.0:2377", ip),
		AdvertiseAddr: fmt.Sprintf("%s:2377", ip),
	}

	ret, err := dockercli.SwarmInit(ctx, req)
	if err != nil {
		log.Printf("[WARNING] Swarm init: %s", err)
	}

	log.Printf("[DEBUG] Swarm info: %s\n\n", ret)
}

// Initial loop etc
func main() {
	log.Println("[INFO] Setting up execution environment")

	//FIXME
	if baseUrl == "" {
		baseUrl = "https://shuffler.io"
		//baseUrl = "http://localhost:5001"
	}

	//if orgId == "" {
	//	log.Printf("[ERROR] Org not defined. Set variable ORG_ID based on your org")
	//	os.Exit(3)
	//}
	if environment == "" {
		log.Printf("[ERROR] Environment not defined. Set variable ENVIRONMENT_NAME to configure it.")
		os.Exit(3)
	}

	if timezone == "" {
		timezone = "Europe/Amsterdam"
	}

	log.Printf("[INFO] Running with timezone %s", timezone)

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

	if len(os.Getenv("DOCKER_HOST")) > 0 {
		log.Printf("[DEBUG] Running docker with socket proxy %s instead of default", os.Getenv("DOCKER_HOST"))
	} else {
		log.Printf("[DEBUG] Running docker with default socket /var/run/docker.sock")
	}

	ctx := context.Background()
	// Run by default from now
	zombiecheck(ctx, workerTimeout)

	log.Printf("[INFO] Running towards %s (BASE_URL) with environment name %s", baseUrl, environment)
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

	workerImage := fmt.Sprintf("%s/%s/shuffle-worker:%s", baseimageregistry, baseimagename, workerVersion)
	if swarmConfig == "run" || swarmConfig == "swarm" {
		checkSwarmService(ctx)

		log.Printf("[DEBUG] Cleaning up containers from previous run")
		cleanupExistingNodes(ctx)
		time.Sleep(time.Duration(5) * time.Second)

		log.Printf("[DEBUG] Deploying worker image %s to swarm", workerImage)
		deployServiceWorkers(workerImage)
		log.Printf("[DEBUG] Waiting 45 seconds to ensure workers are deployed. Run: \"docker service ls\" for more info")
		time.Sleep(time.Duration(45) * time.Second)

		//deployServiceWorkers(workerImage)
	}

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

	client.Timeout = 10 * time.Second

	fullUrl := fmt.Sprintf("%s/api/v1/workflows/queue", baseUrl)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Printf("[ERROR] Failed making request builder during init: %s", err)
		return
	}

	zombiecounter := 0
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Org-Id", environment)

	if len(auth) > 0 {
		req.Header.Add("Authorization", auth)
	}

	if len(org) > 0 {
		req.Header.Add("Org", org)
	}

	log.Printf("[INFO] Waiting for executions at %s with Environment %s", fullUrl, environment)
	hasStarted := false
	for {
		//go getStats()
		//log.Printf("Prerequest")
		//log.Printf("Postrequest")
		newresp, err := client.Do(req)
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
				log.Printf("[WARNING] Bad statuscode from backend: %d", newresp.StatusCode)
			}
		} else {
			if !hasStarted {
				log.Printf("[DEBUG] Starting iteration. Got statuscode %d from backend on first request", newresp.StatusCode)
			}

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

		// Skipping throttling with swarm
		if swarmConfig != "run" && swarmConfig != "swarm" {
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

			/*
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
				}
			*/

			// Now, how do I execute this one?
			// FIXME - if error, check the status of the running one. If it's bad, send data back.
			containerName := fmt.Sprintf("worker-%s", execution.ExecutionId)
			env := []string{
				fmt.Sprintf("AUTHORIZATION=%s", execution.Authorization),
				fmt.Sprintf("EXECUTIONID=%s", execution.ExecutionId),
				fmt.Sprintf("ENVIRONMENT_NAME=%s", environment),
				fmt.Sprintf("BASE_URL=%s", baseUrl),
				fmt.Sprintf("CLEANUP=%s", cleanupEnv),
				fmt.Sprintf("TZ=%s", timezone),
				fmt.Sprintf("SHUFFLE_PASS_APP_PROXY=%s", os.Getenv("SHUFFLE_PASS_APP_PROXY")),
				fmt.Sprintf("SHUFFLE_SWARM_CONFIG=%s", os.Getenv("SHUFFLE_SWARM_CONFIG")),
				fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", os.Getenv("SHUFFLE_LOGS_DISABLED")),
			}

			//log.Printf("Running worker with proxy? %s", os.Getenv("SHUFFLE_PASS_WORKER_PROXY"))
			if strings.ToLower(os.Getenv("SHUFFLE_PASS_WORKER_PROXY")) == "true" {
				env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
				env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
				env = append(env, fmt.Sprintf("NO_PROXY=%s", os.Getenv("NO_PROXY")))
			}

			if dockerApiVersion != "" {
				env = append(env, fmt.Sprintf("DOCKER_API_VERSION=%s", dockerApiVersion))
			}

			if len(os.Getenv("DOCKER_HOST")) > 0 {
				env = append(env, fmt.Sprintf("DOCKER_HOST=%s", os.Getenv("DOCKER_HOST")))
			}

			err = deployWorker(workerImage, containerName, env, execution)
			zombiecounter += 1
			if err == nil {
				//log.Printf("[DEBUG] ExecutionID %s was deployed and to be removed from queue.", execution.ExecutionId)
				toBeRemoved.Data = append(toBeRemoved.Data, execution)
				executionIds = append(executionIds, execution.ExecutionId)
			} else {
				log.Printf("[WARNING] Execution ID %s failed to deploy: %s", execution.ExecutionId, err)
			}
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
			result.Header.Add("Org-Id", environment)

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
	//log.Printf("[DEBUG] Getting running workers with API version %s", dockerApiVersion)
	containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
		All: true,
	})

	// Automatically updates the version
	if err != nil {
		log.Printf("[ERROR] Error getting containers: %s", err)

		newVersionSplit := strings.Split(fmt.Sprintf("%s", err), "version is")
		if len(newVersionSplit) > 1 {
			//dockerApiVersion = strings.TrimSpace(newVersionSplit[1])
			log.Printf("[DEBUG] WANT to change the API version to default to %s?", strings.TrimSpace(newVersionSplit[1]))
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
	if swarmConfig == "run" || swarmConfig == "swarm" {
		//log.Printf("[DEBUG] Skipping Zombie check due to new execution model (swarm)")
		return nil
	}

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

func sendWorkerRequest(workflowExecution shuffle.ExecutionRequest) error {
	parsedRequest := shuffle.OrborusExecutionRequest{
		ExecutionId:           workflowExecution.ExecutionId,
		Authorization:         workflowExecution.Authorization,
		BaseUrl:               os.Getenv("BASE_URL"),
		EnvironmentName:       os.Getenv("ENVIRONMENT_NAME"),
		Timezone:              os.Getenv("TZ"),
		Cleanup:               os.Getenv("CLEANUP"),
		HTTPProxy:             os.Getenv("HTTP_PROXY"),
		HTTPSProxy:            os.Getenv("HTTPS_PROXY"),
		ShufflePassProxyToApp: os.Getenv("SHUFFLE_PASS_APP_PROXY"),
	}

	parsedBaseurl := baseUrl
	if strings.Contains(baseUrl, ":") {
		baseUrlSplit := strings.Split(baseUrl, ":")
		if len(baseUrlSplit) >= 3 {
			parsedBaseurl = strings.Join(baseUrlSplit[0:2], ":")
			//parsedRequest.BaseUrl = fmt.Sprintf("%s:33333", parsedBaseurl)
		}
	}

	data, err := json.Marshal(parsedRequest)
	if err != nil {
		log.Printf("[ERROR] Failed marshalling worker request: %s", err)
		return err
	}

	//log.Printf("[DEBUG] Data: %s", string(data))

	//streamUrl := fmt.Sprintf("http://shuffle-workers:33333/api/v1/execute", parsedBaseurl)
	streamUrl := fmt.Sprintf("http://shuffle-workers:33333/api/v1/execute")
	if containerId == "" || containerId == "shuffle-orborus" {
		streamUrl = fmt.Sprintf("%s:33333/api/v1/execute", parsedBaseurl)
	}

	client := &http.Client{}
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		log.Printf("[ERROR] Failed creating worker request: %s", err)
		if strings.Contains(fmt.Sprintf("%s", err), "connection refused") || strings.Contains(fmt.Sprintf("%s", err), "EOF") {
			workerImage := fmt.Sprintf("%s/%s/shuffle-worker:%s", baseimageregistry, baseimagename, workerVersion)
			deployServiceWorkers(workerImage)

			time.Sleep(time.Duration(10) * time.Second)
			//err = sendWorkerRequest(executionRequest)
		}

		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] Error running worker request to %s (1): %s", streamUrl, err)
		if strings.Contains(fmt.Sprintf("%s", err), "connection refused") || strings.Contains(fmt.Sprintf("%s", err), "EOF") {
			workerImage := fmt.Sprintf("%s/%s/shuffle-worker:%s", baseimageregistry, baseimagename, workerVersion)
			deployServiceWorkers(workerImage)

			time.Sleep(time.Duration(10) * time.Second)
			//err = sendWorkerRequest(executionRequest)
		}

		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading body in worker request body to worker on %s: %s", streamUrl, err)
		return err
	}

	if newresp.StatusCode != 200 {
		log.Printf("[WARNING] POTENTIAL error running worker request (2) - status code is %d for %s, not 200. Body: %s", newresp.StatusCode, streamUrl, string(body))

		// In case of old executions
		if strings.Contains(string(body), "Bad status ") {
			return nil
		}

		//workerImage := fmt.Sprintf("%s/%s/shuffle-worker:%s", baseimageregistry, baseimagename, workerVersion)
		//deployServiceWorkers(workerImage)

		//time.Sleep(time.Duration(10) * time.Second)
		//err = sendWorkerRequest(executionRequest)

		return errors.New(fmt.Sprintf("Bad statuscode from worker: %d - expecting 200", newresp.StatusCode))
	}

	_ = body

	log.Printf("[DEBUG] Ran worker from request with execution ID: %s. Worker URL: %s. DEBUGGING: docker service logs shuffle-workers | grep %s", workflowExecution.ExecutionId, streamUrl, workflowExecution.ExecutionId)
	return nil
}
