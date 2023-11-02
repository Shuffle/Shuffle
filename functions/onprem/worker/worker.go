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
	"github.com/satori/go.uuid"

	// No necessary outside shared
	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"

	//k8s deps
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
	"path/filepath"
	// "k8s.io/client-go/util/retry"
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

// var baseimagename = "registry.hub.docker.com/frikky/shuffle"
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
	"http:1.3.0":            "frikky/shuffle:http_1.3.0",
	"http:1.4.0":            "frikky/shuffle:http_1.4.0",
	"shuffle-tools:1.2.0":   "frikky/shuffle:shuffle-tools_1.2.0",
	"shuffle-subflow:1.0.0": "frikky/shuffle:shuffle-subflow_1.0.0",
	"shuffle-subflow:1.1.0": "frikky/shuffle:shuffle-subflow_1.1.0",
}

//"testing:1.0.0":         "frikky/shuffle:testing_1.0.0",
//fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, action.ID)

// New Worker mappings
// visited, appendActions, nextActions, notFound, queueNodes, toRemove, executed, env
var portMappings map[string]int
var baseport = 33333

type UserInputSubflow struct {
	Argument    string `json:"execution_argument"`
	ContinueUrl string `json:"continue_url"`
	CancelUrl   string `json:"cancel_url"`
}

// removes every container except itself (worker)
func shutdown(workflowExecution shuffle.WorkflowExecution, nodeId string, reason string, handleResultSend bool) {
	log.Printf("[DEBUG][%s] Shutdown (%s) started with reason %#v. Result amount: %d. ResultsSent: %d, Send result: %#v, Parent: %#v", workflowExecution.ExecutionId, workflowExecution.Status, reason, len(workflowExecution.Results), requestsSent, handleResultSend, workflowExecution.ExecutionParent)
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
			log.Printf("[WARNING][%s] Failed building request: %s", workflowExecution.ExecutionId, err)
		}

		authorization := os.Getenv("AUTHORIZATION")
		if len(authorization) > 0 {
			req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authorization))
		} else {
			log.Printf("[ERROR][%s] No authorization specified for abort", workflowExecution.ExecutionId)
		}

		req.Header.Add("Content-Type", "application/json")

		client := shuffle.GetExternalClient(baseUrl)

		//log.Printf("[DEBUG][%s] All App Logs: %#v", workflowExecution.ExecutionId, allLogs)
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("[WARNING][%s] Failed abort request: %s", workflowExecution.ExecutionId, err)
		} else {
			defer newresp.Body.Close()
		}
	} else {
		//log.Printf("[INFO][%s] NOT running abort during shutdown.", workflowExecution.ExecutionId)
	}

	log.Printf("[DEBUG][%s] Finished shutdown (after %d seconds). ", workflowExecution.ExecutionId, sleepDuration)
	//Finished shutdown (after %d seconds). ", sleepDuration)

	// Allows everything to finish in subprocesses (apps)
	time.Sleep(time.Duration(sleepDuration) * time.Second)
	os.Exit(3)
}

// }

func isRunningInCluster() bool {
	_, existsHost := os.LookupEnv("KUBERNETES_SERVICE_HOST")
	_, existsPort := os.LookupEnv("KUBERNETES_SERVICE_PORT")
	return existsHost && existsPort
}

func buildEnvVars(envMap map[string]string) []corev1.EnvVar {
	var envVars []corev1.EnvVar
	for key, value := range envMap {
		envVars = append(envVars, corev1.EnvVar{Name: key, Value: value})
	}
	return envVars
}

func getKubernetesClient() (*kubernetes.Clientset, error) {
	if isRunningInCluster() {
		config, err := rest.InClusterConfig()
		if err != nil {
			return nil, err
		}
		clientset, err := kubernetes.NewForConfig(config)
		if err != nil {
			return nil, err
		}
		return clientset, nil
	} else {
		home := homedir.HomeDir()
		kubeconfigPath := filepath.Join(home, ".kube", "config")
		config, err := clientcmd.BuildConfigFromFlags("", kubeconfigPath)
		if err != nil {
			return nil, err
		}
		clientset, err := kubernetes.NewForConfig(config)
		if err != nil {
			return nil, err
		}
		return clientset, nil
	}
}

// Deploys the internal worker whenever something happens
func deployApp(cli *dockerclient.Client, image string, identifier string, env []string, workflowExecution shuffle.WorkflowExecution, action shuffle.Action) error {
	// log.Printf("################################### new call to deployApp ###################################")
	// log.Printf("image: %s", image)
	// log.Printf("identifier: %s", identifier)
	// log.Printf("execution: %+v", workflowExecution)
	log.Printf("[DEBUG] Adding SHUFFLE_APP_SDK_TIMEOUT=%s", os.Getenv("SHUFFLE_APP_SDK_TIMEOUT"))
	env = append(env, fmt.Sprintf("SHUFFLE_APP_SDK_TIMEOUT=%s", os.Getenv("SHUFFLE_APP_SDK_TIMEOUT")))

	if os.Getenv("IS_KUBERNETES") == "true" {

		namespace := "shuffle"
		localRegistry := os.Getenv("REGISTRY_URL")

		envMap := make(map[string]string)
		for _, envStr := range env {
			parts := strings.SplitN(envStr, "=", 2)
			if len(parts) == 2 {
				envMap[parts[0]] = parts[1]
			}
		}

		clientset, err := getKubernetesClient()
		if err != nil {
			fmt.Println("[ERROR]Error getting kubernetes client:", err)
			// os.Exit(1)
		}

		log.Printf("[DEBUG] Got kubernetes client")
		str := strings.ToLower(identifier)
		strSplit := strings.Split(str, "_")
		value := strSplit[0]
		value = strings.ReplaceAll(value, "_", "-")

		// checking if app is generated or not
		appDetails := strings.Split(image, ":")[1]
		appDetailsSplit := strings.Split(appDetails, "_")
		appName := strings.Join(appDetailsSplit[:len(appDetailsSplit)-1], "_")
		appVersion := appDetailsSplit[len(appDetailsSplit)-1]

		// log.Printf("APP VERSION IS: %s", appVersion)

		for _, app := range workflowExecution.Workflow.Actions {
			// log.Printf("[DEBUG] App: %s, Version: %s", appName, appVersion)
			// log.Printf("[DEBUG] Checking app %s with version %s", app.AppName, app.AppVersion)
			if app.AppName == appName && app.AppVersion == appVersion {
				if app.Generated == true {
					log.Printf("[DEBUG] Generated app, setting local registry")
					image = fmt.Sprintf("%s/%s", localRegistry, image)
					break
				} else {
					log.Printf("[DEBUG] Not generated app, setting shuffle registry")
				}
			}
		}

		//fix naming convention
		podUuid := uuid.NewV4().String()
		podName := fmt.Sprintf("%s-%s", value, podUuid)

		pod := &corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name: podName,
				Labels: map[string]string{
					"app":         "shuffle-app",
					"executionId": workflowExecution.ExecutionId,
				},
			},
			Spec: corev1.PodSpec{
				// NodeName:      "worker1"
				RestartPolicy: "Never",
				Containers: []corev1.Container{
					{
						Name:            value,
						Image:           image,
						Env:             buildEnvVars(envMap),
						// ImagePullPolicy: corev1.PullAlways,
					},
				},
			},
		}

		createdPod, err := clientset.CoreV1().Pods(namespace).Create(context.Background(), pod, metav1.CreateOptions{})
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error creating pod: %v\n", err)
			// os.Exit(1)
		}
		fmt.Printf("[DEBUG] Created pod %q in namespace %q\n", createdPod.Name, createdPod.Namespace)
	} else {
		// form basic hostConfig
		ctx := context.Background()

		if action.AppName == "shuffle-subflow" {
			// Automatic replacement of URL
			for paramIndex, param := range action.Parameters {
				if param.Name != "backend_url" {
					continue
				}

				if strings.Contains(param.Value, "shuffle-backend") {
					// Automatic replacement as this is default
					action.Parameters[paramIndex].Value = os.Getenv("BASE_URL")
					log.Printf("[DEBUG][%s] Replaced backend_url with %s", workflowExecution.ExecutionId, os.Getenv("BASE_URL"))
				}
			}
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

		hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:worker-%s", workflowExecution.ExecutionId))

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
			log.Printf("[DEBUG] Setting up binds for container!")
			hostConfig.Binds = volumeBinds
			hostConfig.Mounts = []mount.Mount{}
			for _, bind := range volumeBinds {
				if !strings.Contains(bind, ":") || strings.Contains(bind, "..") || strings.HasPrefix(bind, "~") {
					log.Printf("[WARNING] Bind %s is invalid.", bind)
					continue
				}

				log.Printf("[DEBUG] Appending bind %s", bind)
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
		err = shuffle.SetCache(ctx, newExecId, cacheData, 30)
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
	return nil
}

func cleanupExecution(clientset *kubernetes.Clientset, workflowExecution shuffle.WorkflowExecution, namespace string) error {

	workerName := fmt.Sprintf("worker-%s", workflowExecution.ExecutionId)
	labelSelector := fmt.Sprintf("app=shuffle-app,executionId=%s", workflowExecution.ExecutionId)

	podList, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return fmt.Errorf("[ERROR]failed to list apps with label selector %s: %v", labelSelector, err)
	}

	for _, pod := range podList.Items {
		err := clientset.CoreV1().Pods(namespace).Delete(context.TODO(), pod.Name, metav1.DeleteOptions{})
		if err != nil {
			return fmt.Errorf("failed to delete app %s: %v", pod.Name, err)
		}
		fmt.Printf("App %s in namespace %s deleted.\n", pod.Name, namespace)
	}

	podErr := clientset.CoreV1().Pods(namespace).Delete(context.TODO(), workerName, metav1.DeleteOptions{})
	if podErr != nil {
		return fmt.Errorf("[ERROR] failed to delete the worker %s in namespace %s: %v", workerName, namespace, podErr)
	}
	fmt.Printf("[DEBUG]  %s in namespace %s deleted.\n", workerName, namespace)
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

			log.Printf("[DEBUG] 2 - Identifier: %s", identifier)
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

	log.Printf("[DEBUG] Container %s was created for %s", cont.ID, identifier)

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
		log.Printf("[DEBUG] Unable to create docker client: %s", err)
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

func removeIndex(s []string, i int) []string {
	s[len(s)-1], s[i] = s[i], s[len(s)-1]
	return s[:len(s)-1]
}

func handleExecutionResult(workflowExecution shuffle.WorkflowExecution) {
	ctx := context.Background()

	//log.Printf("[DEBUG][%s] Pre DecideExecution", workflowExecution.ExecutionId)
	workflowExecution, relevantActions := shuffle.DecideExecution(ctx, workflowExecution, environment)
	startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)

	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client (3): %s", err)
		return
	}

	//	log.Printf("\n\n[DEBUG] Got %d relevant action(s) to run!\n\n", len(relevantActions))
	for _, action := range relevantActions {
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
			//log.Printf("[DEBUG] Actiondata is NOT 100000 in length. Adding as normal.")
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

				err := downloadDockerImageBackend(&http.Client{Timeout: 60 * time.Second}, image)
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
						} else {
							baseTag := strings.Split(image, ":")
							if len(baseTag) > 1 {
								tag := baseTag[1]
								log.Printf("[DEBUG] Creating tag copies of registry downloaded containers from tag %s", tag)

								// Remapping
								ctx := context.Background()
								dockercli.ImageTag(ctx, image, fmt.Sprintf("frikky/shuffle:%s", tag))
								dockercli.ImageTag(ctx, image, fmt.Sprintf("registry.hub.docker.com/frikky/shuffle:%s", tag))
							}
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
					err := downloadDockerImageBackend(&http.Client{Timeout: 60 * time.Second}, image)
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
							} else {
								baseTag := strings.Split(image, ":")
								if len(baseTag) > 1 {
									tag := baseTag[1]
									log.Printf("[DEBUG] Creating tag copies of registry downloaded containers from tag %s", tag)

									// Remapping
									ctx := context.Background()
									dockercli.ImageTag(ctx, image, fmt.Sprintf("frikky/shuffle:%s", tag))
									dockercli.ImageTag(ctx, image, fmt.Sprintf("registry.hub.docker.com/frikky/shuffle:%s", tag))
								}
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
			if os.Getenv("IS_KUBERNETES") == "true" {
				// log.Printf("workflow execution: %#v", workflowExecution)
				clientset, err := getKubernetesClient()
				if err != nil {
					fmt.Println("[ERROR]Error getting kubernetes client:", err)
					os.Exit(1)
				}
				cleanupExecution(clientset, workflowExecution, "shuffle")
			} else {
				shutdown(workflowExecution, "", "", true)
			}
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

	startAction := workflowExecution.Start
	//log.Printf("[INFO][%s] STARTACTION: %s", workflowExecution.ExecutionId, startAction)
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
				if trigger.ID == branch.SourceID {
					sourceFound = true
				} else if trigger.ID == branch.DestinationID {
					destinationFound = true
				}
			}
		}

		if sourceFound {
			parents[branch.DestinationID] = append(parents[branch.DestinationID], branch.SourceID)
		} else {
			log.Printf("[DEBUG] ID %s was not found in actions! Skipping parent. (TRIGGER?)", branch.SourceID)
		}

		if destinationFound {
			children[branch.SourceID] = append(children[branch.SourceID], branch.DestinationID)
		} else {
			log.Printf("[DEBUG] ID %s was not found in actions! Skipping child. (TRIGGER?)", branch.SourceID)
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

		defer newresp.Body.Close()
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
			log.Printf("[INFO][%s] Workflow execution is finished. Exiting worker.", workflowExecution.ExecutionId)
			log.Printf("[DEBUG] Shutting down (20)")
			//handle workerssssssssss
			if os.Getenv("IS_KUBERNETES") == "true" {
				// log.Printf("workflow execution: %#v", workflowExecution)
				clientset, err := getKubernetesClient()
				if err != nil {
					fmt.Println("[ERROR]Error getting kubernetes client:", err)
					os.Exit(1)
				}
				cleanupExecution(clientset, workflowExecution, "shuffle")
			} else {
				shutdown(workflowExecution, "", "", true)
			}
		}

		log.Printf("[INFO][%s] Status: %s, Results: %d, actions: %d", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)
		if workflowExecution.Status != "EXECUTING" {
			log.Printf("[WARNING][%s] Exiting as worker execution has status %s!", workflowExecution.ExecutionId, workflowExecution.Status)
			log.Printf("[DEBUG] Shutting down (21)")
			if os.Getenv("IS_KUBERNETES") == "true" {
				// log.Printf("workflow execution: %#v", workflowExecution)
				clientset, err := getKubernetesClient()
				if err != nil {
					fmt.Println("[ERROR]Error getting kubernetes client:", err)
					os.Exit(1)
				}
				cleanupExecution(clientset, workflowExecution, "shuffle")
			} else {
				shutdown(workflowExecution, "", "", true)
			}
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

	defer newresp.Body.Close()
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

	defer newresp.Body.Close()
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

	defer newresp.Body.Close()
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
	if request.Body == nil {
		resp.WriteHeader(http.StatusBadRequest)
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] (3) Failed reading body for workflowqueue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	defer request.Body.Close()

	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("[ERROR] Failed shuffle.ActionResult unmarshaling (2): %s", err)
		//resp.WriteHeader(401)
		//resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		//return
	}

	if len(actionResult.ExecutionId) == 0 {
		log.Printf("[WARNING] No workflow execution id in action result. Data: %s", string(body))
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "No workflow execution id in action result"}`)))
		return
	}

	// 1. Get the shuffle.WorkflowExecution(ExecutionId) from the database
	// 2. if shuffle.ActionResult.Authentication != shuffle.WorkflowExecution.Authentication -> exit
	// 3. Add to and update actionResult in workflowExecution
	// 4. Push to db
	// IF FAIL: Set executionstatus: abort or cancel

	ctx := context.Background()
	workflowExecution, err := shuffle.GetWorkflowExecution(ctx, actionResult.ExecutionId)
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

	log.Printf("[INFO][%s] Got result '%s' from '%s' with app '%s':'%s'", actionResult.ExecutionId, actionResult.Status, actionResult.Action.Label, actionResult.Action.AppName, actionResult.Action.AppVersion)

	//results = append(results, actionResult)
	//log.Printf("[INFO][%s] Time to execute %s (%s) with app %s:%s, function %s, env %s with %d parameters.", workflowExecution.ExecutionId, action.ID, action.Label, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))
	//log.Printf("[DEBUG][%s] In workflowQueue with transaction", workflowExecution.ExecutionId)
	runWorkflowExecutionTransaction(ctx, 0, workflowExecution.ExecutionId, actionResult, resp)

}

// Will make sure transactions are always ran for an execution. This is recursive if it fails. Allowed to fail up to 5 times
func runWorkflowExecutionTransaction(ctx context.Context, attempts int64, workflowExecutionId string, actionResult shuffle.ActionResult, resp http.ResponseWriter) {
	//log.Printf("[DEBUG][%s] IN WORKFLOWEXECUTION SUB!", actionResult.ExecutionId)
	workflowExecution, err := shuffle.GetWorkflowExecution(ctx, workflowExecutionId)
	if err != nil {
		log.Printf("[ERROR] Failed getting execution cache: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution"}`)))
		return
	}

	resultLength := len(workflowExecution.Results)
	setExecution := true

	workflowExecution, dbSave, err := shuffle.ParsedExecutionResult(ctx, *workflowExecution, actionResult, true, 0)
	if err != nil {
		log.Printf("[DEBUG] Rerunning transaction? %s", err)
		if strings.Contains(fmt.Sprintf("%s", err), "Rerun this transaction") {
			workflowExecution, err := shuffle.GetWorkflowExecution(ctx, workflowExecutionId)
			if err != nil {
				log.Printf("[ERROR] Failed getting execution cache (2): %s", err)
				resp.WriteHeader(401)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution (2)"}`)))
				return
			}

			resultLength = len(workflowExecution.Results)
			setExecution = true

			workflowExecution, dbSave, err = shuffle.ParsedExecutionResult(ctx, *workflowExecution, actionResult, false, 0)
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

	//log.Printf(`[DEBUG][%s] Got result %s from %s. Execution status: %s. Save: %#v. Parent: %#v`, actionResult.ExecutionId, actionResult.Status, actionResult.Action.ID, workflowExecution.Status, dbSave, workflowExecution.ExecutionParent)
	//dbSave := false

	//if len(results) != len(workflowExecution.Results) {
	//	log.Printf("[DEBUG][%s] There may have been an issue in transaction queue. Result lengths: %d vs %d. Should check which exists the base results, but not in entire execution, then append.", workflowExecution.ExecutionId, len(results), len(workflowExecution.Results))
	//}

	// Validating that action results hasn't changed
	// Handled using cachhing, so actually pretty fast
	cacheKey := fmt.Sprintf("workflowexecution_%s", workflowExecution.ExecutionId)
	cache, err := shuffle.GetCache(ctx, cacheKey)
	if err == nil {
		//parsedValue := value.(*shuffle.WorkflowExecution)

		parsedValue := &shuffle.WorkflowExecution{}
		cacheData := []byte(cache.([]uint8))
		err = json.Unmarshal(cacheData, &workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed unmarshalling workflowexecution: %s", err)
		}

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

	/*
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
	*/

	if setExecution || workflowExecution.Status == "FINISHED" || workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {
		log.Printf("[DEBUG][%s] Running setexec with status %s and %d results", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results))
		err = setWorkflowExecution(ctx, *workflowExecution, dbSave)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed setting workflowexecution actionresult: %s"}`, err)))
			return
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

func sendSelfRequest(actionResult shuffle.ActionResult) {
	log.Printf("[INFO][%s] Not sending backend info since source is default (not swarm)", actionResult.ExecutionId)
	return

	data, err := json.Marshal(actionResult)
	if err != nil {
		log.Printf("[ERROR][%s] Shutting down (24):  Failed to unmarshal data for backend: %s", actionResult.ExecutionId, err)
		return
	}

	if actionResult.ExecutionId == "TBD" {
		return
	}

	log.Printf("[DEBUG][%s] Sending FAILURE to self to stop the workflow execution. Action: %s (%s), app %s:%s", actionResult.ExecutionId, actionResult.Action.Label, actionResult.Action.ID, actionResult.Action.AppName, actionResult.Action.AppVersion)

	// Literally sending to same worker to run it as a new request
	streamUrl := fmt.Sprintf("http://localhost:33333/api/v1/streams")
	hostenv := os.Getenv("WORKER_HOSTNAME")
	if len(hostenv) > 0 {
		streamUrl = fmt.Sprintf("http://%s:33333/api/v1/streams", hostenv)
	}

	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		log.Printf("[ERROR][%s] Failed creating self request (1): %s", actionResult.ExecutionId, err)
		return
	}

	newresp, err := topClient.Do(req)
	if err != nil {
		log.Printf("[ERROR][%s] Error running self request (2): %s", actionResult.ExecutionId, err)
		return
	}

	defer newresp.Body.Close()
	if newresp.Body != nil {
		body, err := ioutil.ReadAll(newresp.Body)
		//log.Printf("[INFO] BACKEND STATUS: %d", newresp.StatusCode)
		if err != nil {
			log.Printf("[ERROR][%s] Failed reading self request body: %s", actionResult.ExecutionId, err)
		} else {
			log.Printf("[DEBUG][%s] NEWRESP (from self - 1): %s", actionResult.ExecutionId, string(body))
		}
	}
}

func sendResult(workflowExecution shuffle.WorkflowExecution, data []byte) {
	if workflowExecution.ExecutionSource == "default" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		//log.Printf("[INFO][%s] Not sending backend info since source is default (not swarm)", workflowExecution.ExecutionId)
		//return
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
		return
	}

	newresp, err := topClient.Do(req)
	if err != nil {
		log.Printf("[ERROR][%s] Error running finishing request: %s", workflowExecution.ExecutionId, err)
		log.Printf("[DEBUG][%s] Shutting down (23)", workflowExecution.ExecutionId)
		shutdown(workflowExecution, "", "", false)
		return
	}

	defer newresp.Body.Close()
	if newresp.Body != nil {
		body, err := ioutil.ReadAll(newresp.Body)
		//log.Printf("[INFO] BACKEND STATUS: %d", newresp.StatusCode)
		if err != nil {
			log.Printf("[ERROR][%s] Failed reading body: %s", workflowExecution.ExecutionId, err)
		} else {
			log.Printf("[DEBUG][%s] NEWRESP (from backend): %s", workflowExecution.ExecutionId, string(body))
		}
	}
}

func validateFinished(workflowExecution shuffle.WorkflowExecution) bool {
	ctx := context.Background()

	newexec, err := shuffle.GetWorkflowExecution(ctx, workflowExecution.ExecutionId)
	if err != nil {
		log.Printf("[ERROR][%s] Failed getting workflow execution: %s", workflowExecution.ExecutionId, err)
	} else {
		workflowExecution = *newexec
	}

	//startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)
	workflowExecution = shuffle.Fixexecution(ctx, workflowExecution)
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

		requestsSent += 1

		log.Printf("[DEBUG][%s] Should send full result to %s", workflowExecution.ExecutionId, baseUrl)

		//data = fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, executionId, authorization)
		shutdownData, err := json.Marshal(workflowExecution)
		if err != nil {
			log.Printf("[ERROR][%s] Shutting down (32):  Failed to unmarshal data for backend: %s", workflowExecution.ExecutionId, err)
			shutdown(workflowExecution, "", "", true)
		}

		cacheKey := fmt.Sprintf("workflowexecution_%s", workflowExecution.ExecutionId)
		err = shuffle.SetCache(ctx, cacheKey, shutdownData, 30)
		if err != nil {
			log.Printf("[ERROR][%s] Failed adding to cache during validateFinished", workflowExecution)
		}

		shuffle.RunCacheCleanup(ctx, workflowExecution)
		sendResult(workflowExecution, shutdownData)
		return true
	}

	return false
}

func handleGetStreamResults(resp http.ResponseWriter, request *http.Request) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] Failed reading body for stream result queue")
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	defer request.Body.Close()
	//log.Printf("[DEBUG] In get stream results with body length %d: %s", len(body), string(body))

	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("[WARNING] Failed shuffle.ActionResult unmarshaling: %s", err)
		//resp.WriteHeader(400)
		//resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		//return
	}

	if len(actionResult.ExecutionId) == 0 {
		log.Printf("[WARNING] No workflow execution id in action result (2). Data: %s", string(body))
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "No workflow execution id in action result"}`)))
		return
	}

	ctx := context.Background()
	workflowExecution, err := shuffle.GetWorkflowExecution(ctx, actionResult.ExecutionId)
	if err != nil {
		log.Printf("[INFO] Failed getting execution (streamresult) %s: %s", actionResult.ExecutionId, err)
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
		log.Printf("[DEBUG] Workflowexecution executionId can't be empty.")
		return errors.New("ExecutionId can't be empty.")
	}

	//log.Printf("[DEBUG][%s] Setting with %d results (pre)", workflowExecution.ExecutionId, len(workflowExecution.Results))
	workflowExecution = shuffle.Fixexecution(ctx, workflowExecution)
	//log.Printf("[DEBUG][%s] Setting with %d results (post)", workflowExecution.ExecutionId, len(workflowExecution.Results))

	cacheKey := fmt.Sprintf("workflowexecution_%s", workflowExecution.ExecutionId)

	execData, err := json.Marshal(workflowExecution)
	if err != nil {
		log.Printf("[ERROR] Failed marshalling execution during set: %s", err)
		return err
	}

	err = shuffle.SetCache(ctx, cacheKey, execData, 30)
	if err != nil {
		log.Printf("[ERROR][%s] Failed adding to cache during setexecution", workflowExecution)
		return err
	}
	//requestCache.Set(cacheKey, &workflowExecution, cache.DefaultExpiration)

	handleExecutionResult(workflowExecution)
	validateFinished(workflowExecution)

	// FIXME: Should this shutdown OR send the result?
	// The worker may not be running the backend hmm
	if dbSave {
		if workflowExecution.ExecutionSource == "default" {
			log.Printf("[DEBUG][%s] Shutting down (25)", workflowExecution.ExecutionId)
			shutdown(workflowExecution, "", "", true)
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

	//defer listener.Close()

	return listener, nil
	//return fmt.Sprintf(":%d", port)
}

func webserverSetup(workflowExecution shuffle.WorkflowExecution) net.Listener {
	hostname = getLocalIP()

	os.Setenv("WORKER_HOSTNAME", hostname)

	// FIXME: This MAY not work because of speed between first
	// container being launched and port being assigned to webserver
	listener, err := getAvailablePort()
	if err != nil {
		log.Printf("[ERROR] Failed to create init listener: %s", err)
		return listener
	}

	log.Printf("[DEBUG] OLD HOSTNAME: %s", appCallbackUrl)
	port := listener.Addr().(*net.TCPAddr).Port

	log.Printf("\n\n[DEBUG] Starting webserver (2) on port %d with hostname: %s\n\n", port, hostname)
	appCallbackUrl = fmt.Sprintf("http://%s:%d", hostname, port)

	log.Printf("[INFO] NEW WORKER HOSTNAME: %s", appCallbackUrl)
	return listener
}

func downloadDockerImageBackend(client *http.Client, imageName string) error {
	log.Printf("[DEBUG] Trying to download image %s from backend %s as it doesn't exist. All images: %#v", imageName, baseUrl, downloadedImages)

	if arrayContains(downloadedImages, imageName) {
		log.Printf("[DEBUG] Image %s already downloaded", imageName)
		return nil
	}

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
		log.Printf("[ERROR] Failed download request for %s: %s", imageName, err)
		return err
	}

	defer newresp.Body.Close()
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

	baseTag := strings.Split(imageName, ":")
	if len(baseTag) > 1 {
		tag := baseTag[1]
		log.Printf("[DEBUG] Creating tag copies of downloaded containers from tag %s", tag)

		// Remapping
		ctx := context.Background()
		dockercli.ImageTag(ctx, imageName, fmt.Sprintf("frikky/shuffle:%s", tag))
		dockercli.ImageTag(ctx, imageName, fmt.Sprintf("registry.hub.docker.com/frikky/shuffle:%s", tag))

		downloadedImages = append(downloadedImages, fmt.Sprintf("frikky/shuffle:%s", tag))
		downloadedImages = append(downloadedImages, fmt.Sprintf("registry.hub.docker.com/frikky/shuffle:%s", tag))

	}

	os.Remove(newFileName)

	log.Printf("[INFO] Successfully loaded image %s: %s", imageName, string(body))
	return nil
}

// Initial loop etc
func main() {
	// Elasticsearch necessary to ensure we'ren ot running with Datastore configurations for minimal/maximal data sizes
	_, err := shuffle.RunInit(datastore.Client{}, storage.Client{}, "", "worker", true, "elasticsearch")
	if err != nil {
		log.Printf("[ERROR] Failed to run worker init: %s", err)
	} else {
		log.Printf("[DEBUG] Ran init for worker to set up cache system. Docker version: %s", dockerApiVersion)
	}

	log.Printf("[INFO] Setting up worker environment")
	sleepTime := 5
	client := shuffle.GetExternalClient(baseUrl)

	if timezone == "" {
		timezone = "Europe/Amsterdam"
	}

	log.Printf("[INFO] Running with timezone %s and swarm config %#v", timezone, os.Getenv("SHUFFLE_SWARM_CONFIG"))

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

		defer newresp.Body.Close()
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

			ctx := context.Background()
			cacheKey := fmt.Sprintf("workflowexecution_%s", workflowExecution.ExecutionId)
			execData, err := json.Marshal(workflowExecution)
			if err != nil {
				log.Printf("[ERROR][%s] Failed marshalling execution during set (3): %s", workflowExecution.ExecutionId, err)
			} else {
				err = shuffle.SetCache(ctx, cacheKey, execData, 30)
				if err != nil {
					log.Printf("[ERROR][%s] Failed adding to cache during setexecution (3): %s", workflowExecution.ExecutionId, err)
				}
			}

			//requestCache = cache.New(60*time.Minute, 120*time.Minute)
			//requestCache.Set(cacheKey, &workflowExecution, cache.DefaultExpiration)

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
			childNodes := shuffle.FindChildNodes(workflowExecution, workflowExecution.Start, []string{}, []string{})
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
				log.Printf("\n\n[DEBUG] Running OPTIMIZED execution (not manual)\n\n")
				listener := webserverSetup(workflowExecution)
				err := executionInit(workflowExecution)
				if err != nil {
					log.Printf("[DEBUG] Workflow setup failed: %s", workflowExecution.ExecutionId, err)
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
				log.Printf("\n\n[DEBUG] Running NON-OPTIMIZED execution for type %s with %d environment(s). This only happens when ran manually OR when running with subflows. Status: %s\n\n", workflowExecution.ExecutionSource, len(environments), workflowExecution.Status)
				err := executionInit(workflowExecution)
				if err != nil {
					log.Printf("[DEBUG] Workflow setup failed: %s", workflowExecution.ExecutionId, err)
					shutdown(workflowExecution, "", "", true)
				}

				// Trying to make worker into microservice~ :)
			}
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("[DEBUG] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			log.Printf("[DEBUG] Shutting down (31)")
			shutdown(workflowExecution, "", "", true)
		}

		if workflowExecution.Status == "EXECUTING" || workflowExecution.Status == "RUNNING" {
			//log.Printf("Status: %s", workflowExecution.Status)
			err = handleDefaultExecution(client, req, workflowExecution)
			if err != nil {
				log.Printf("[DEBUG] Workflow %s is finished: %s", workflowExecution.ExecutionId, err)
				log.Printf("[DEBUG] Shutting down (32)")
				shutdown(workflowExecution, "", "", true)
			}
		} else {
			log.Printf("[DEBUG] Workflow %s has status %s. Exiting worker.", workflowExecution.ExecutionId, workflowExecution.Status)
			log.Printf("[DEBUG] Shutting down (33)")
			shutdown(workflowExecution, workflowExecution.Workflow.ID, "", true)
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}

func checkUnfinished(resp http.ResponseWriter, request *http.Request, execRequest shuffle.OrborusExecutionRequest) {
	// Meant as a function that periodically checks whether previous executions have finished or not.
	// Should probably be based on executedIds and finishedIds
	// Schedule a check in the future instead?

	ctx := context.Background()
	exec, err := shuffle.GetWorkflowExecution(ctx, execRequest.ExecutionId)
	log.Printf("[DEBUG][%s] Rechecking execution and it's status to send to backend IF the status is EXECUTING (%s - %d/%d finished)", execRequest.ExecutionId, exec.Status, len(exec.Results), len(exec.Workflow.Actions))
	if err != nil {
		return
	}

	// FIXMe: Does this create issue with infinite loops?
	// Usually caused by issue during startup
	if exec.Status == "" {
		//handleRunExecution(resp, request)
		return
	}

	if exec.Status != "EXECUTING" {
		return
	}

	log.Printf("[DEBUG][%s] Should send full result for execution to backend as it has %d results. Status: %s", execRequest.ExecutionId, len(exec.Results), exec.Status)
	data, err := json.Marshal(exec)
	if err != nil {
		return
	}

	sendResult(*exec, data)
}

func handleRunExecution(resp http.ResponseWriter, request *http.Request) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] Failed reading body for stream result queue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	defer request.Body.Close()

	//log.Printf("[DEBUG] In run execution with body length %d", len(body))
	var execRequest shuffle.OrborusExecutionRequest
	err = json.Unmarshal(body, &execRequest)
	if err != nil {
		log.Printf("[WARNING] Failed shuffle.WorkflowExecution unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// Checks if a workflow is done 30 seconds later, and sends info to backend no matter what
	go func() {
		time.Sleep(time.Duration(30) * time.Second)
		checkUnfinished(resp, request, execRequest)
	}()

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
		log.Printf("[DEBUG] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
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

	log.Printf("[INFO][%s] Status: %s, Results: %d, actions: %d", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)

	if workflowExecution.Status != "EXECUTING" {
		log.Printf("[WARNING] Exiting as worker execution has status %s!", workflowExecution.Status)
		log.Printf("[DEBUG] Shutting down (21)")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad status %s for the workflow execution %s"}`, workflowExecution.Status, workflowExecution.ExecutionId)))
		return
	}

	//log.Printf("[DEBUG] Starting execution :O")

	cacheKey := fmt.Sprintf("workflowexecution_%s", workflowExecution.ExecutionId)
	execData, err := json.Marshal(workflowExecution)
	if err != nil {
		log.Printf("[ERROR][%s] Failed marshalling execution during set (3): %s", workflowExecution.ExecutionId, err)
	} else {
		err = shuffle.SetCache(ctx, cacheKey, execData, 30)
		if err != nil {
			log.Printf("[ERROR][%s] Failed adding to cache during setexecution (3): %s", workflowExecution.ExecutionId, err)
		}
	}

	//requestCache.Set(cacheKey, &workflowExecution, cache.DefaultExpiration)

	err = executionInit(workflowExecution)
	if err != nil {
		log.Printf("[DEBUG][%s] Shutting down (30) - Workflow setup failed: %s", workflowExecution.ExecutionId, workflowExecution.ExecutionId, err)
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

	//log.Fatal(http.ListenAndServe(port, nil))
	//srv := http.Server{
	//	Addr:         ":8888",
	//	WriteTimeout: 1 * time.Second,
	//	Handler:      http.HandlerFunc(slowHandler),
	//}

	//log.Fatal(http.Serve(listener, nil))

	log.Printf("\n\n[DEBUG] NEW webserver setup\n\n")

	http.Handle("/", r)
	srv := http.Server{
		Handler:           r,
		ReadTimeout:       60 * time.Second,
		ReadHeaderTimeout: 60 * time.Second,
		IdleTimeout:       60 * time.Second,
		WriteTimeout:      60 * time.Second,
	}

	err := srv.Serve(listener)
	if err != nil {
		log.Printf("serveIssue: %#v", err)
	}
	log.Printf("[DEBUG] Do we see this?")
}
