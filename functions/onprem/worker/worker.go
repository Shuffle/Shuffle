package main

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
	"net/http/pprof"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	dockerclient "github.com/docker/docker/client"

	// This is for automatic removal of certain code :)
	/*** STARTREMOVE ***/
	"math/rand"

	"github.com/docker/docker/api/types/swarm"
	uuid "github.com/satori/go.uuid"

	/*** ENDREMOVE ***/

	"github.com/gorilla/mux"

	//k8s deps
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
)

// This is getting out of hand :)
var timezone = os.Getenv("TZ")
var baseUrl = os.Getenv("BASE_URL")
var appCallbackUrl = os.Getenv("BASE_URL")
var isKubernetes = os.Getenv("IS_KUBERNETES")
var environment = os.Getenv("ENVIRONMENT_NAME")
var logsDisabled = os.Getenv("SHUFFLE_LOGS_DISABLED")
var cleanupEnv = strings.ToLower(os.Getenv("CLEANUP"))
var swarmNetworkName = os.Getenv("SHUFFLE_SWARM_NETWORK_NAME")
var dockerApiVersion = strings.ToLower(os.Getenv("DOCKER_API_VERSION"))

var baseimagename = "frikky/shuffle"
var kubernetesNamespace = os.Getenv("KUBERNETES_NAMESPACE")

// var baseimagename = os.Getenv("SHUFFLE_BASE_IMAGE_NAME")

// var baseimagename = "registry.hub.docker.com/frikky/shuffle"
var registryName = "registry.hub.docker.com"
var sleepTime = 2
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

type ImageDownloadBody struct {
	Image string `json:"image"`
}

type ImageRequest struct {
	Image string `json:"image"`
}

var finishedExecutions []string
var imagesDistributed []string
var imagedownloadTimeout = time.Second * 300

// Images to be autodeployed in the latest version of Shuffle.
var autoDeploy = map[string]string{
	"http:1.4.0":            "frikky/shuffle:http_1.4.0",
	"http:1.3.0":            "frikky/shuffle:http_1.3.0",
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

// Not using shuffle.SetWorkflowExecution as we only want to use cache in reality
func setWorkflowExecution(ctx context.Context, workflowExecution shuffle.WorkflowExecution, dbSave bool) error {
	if len(workflowExecution.ExecutionId) == 0 {
		log.Printf("[DEBUG] Workflowexecution executionId can't be empty.")
		return errors.New("ExecutionId can't be empty.")
	}

	//log.Printf("[DEBUG][%s] Setting with %d results (pre)", workflowExecution.ExecutionId, len(workflowExecution.Results))
	workflowExecution, _ = shuffle.Fixexecution(ctx, workflowExecution)
	cacheKey := fmt.Sprintf("workflowexecution_%s", workflowExecution.ExecutionId)

	execData, err := json.Marshal(workflowExecution)
	if err != nil {
		log.Printf("[ERROR] Failed marshalling execution during set: %s", err)
		return err
	}

	err = shuffle.SetCache(ctx, cacheKey, execData, 30)
	if err != nil {
		log.Printf("[ERROR][%s] Failed adding to cache during setexecution", workflowExecution.ExecutionId)
		return err
	}

	handleExecutionResult(workflowExecution)
	validated := shuffle.ValidateFinished(ctx, -1, workflowExecution)
	if validated {
		shutdownData, err := json.Marshal(workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed marshalling shutdowndata during set: %s", err)
		}

		log.Printf("[DEBUG][%s] Sending result (set)", workflowExecution.ExecutionId)
		sendResult(workflowExecution, shutdownData)
		return nil
	}

	// FIXME: Should this shutdown OR send the result?
	// The worker may not be running the backend hmm
	if dbSave {
		if workflowExecution.ExecutionSource == "default" {
			log.Printf("[DEBUG][%s] Shutting down (25)", workflowExecution.ExecutionId)
			shutdown(workflowExecution, "", "", true)
			//return
		} else {
			log.Printf("[DEBUG][%s] NOT shutting down with dbSave (%s). Instead sending result to backend and start polling until subflow is updated", workflowExecution.ExecutionId, workflowExecution.ExecutionSource)

			shutdownData, err := json.Marshal(workflowExecution)
			if err != nil {
				log.Printf("[ERROR] Failed marshalling shutdowndata during dbSave handler: %s", err)
			}

			sendResult(workflowExecution, shutdownData)

			// Poll for 1 minute max if there is a "wait for results" subflow
			subflowId := ""
			for _, result := range workflowExecution.Results {
				if result.Status == "WAITING" {
					//log.Printf("[DEBUG][%s] Found waiting result", workflowExecution.ExecutionId)
					subflowId = result.Action.ID
				}
			}

			if len(subflowId) == 0 {
				log.Printf("[DEBUG][%s] No waiting result found. Not polling", workflowExecution.ExecutionId)

				for _, action := range workflowExecution.Workflow.Actions {
					if action.AppName == "User Input" || action.AppName == "Shuffle Workflow" || action.AppName == "shuffle-subflow" {
						workflowExecution.Workflow.Triggers = append(workflowExecution.Workflow.Triggers, shuffle.Trigger{
							AppName:    action.AppName,
							Parameters: action.Parameters,
							ID:         action.ID,
						})
					}
				}

				for _, trigger := range workflowExecution.Workflow.Triggers {
					//log.Printf("[DEBUG] Found trigger %s", trigger.AppName)
					if trigger.AppName != "User Input" && trigger.AppName != "Shuffle Workflow" && trigger.AppName != "shuffle-subflow" {
						continue
					}

					// check if it has wait for results in params
					wait := false
					for _, param := range trigger.Parameters {
						//log.Printf("[DEBUG] Found param %s with value %s", param.Name, param.Value)
						if param.Name == "check_result" && strings.ToLower(param.Value) == "true" {
							//log.Printf("[DEBUG][%s] Found check result param!", workflowExecution.ExecutionId)
							wait = true
							break
						}
					}

					if wait {
						// Check if it has a result or not
						found := false
						for _, result := range workflowExecution.Results {
							//log.Printf("[DEBUG][%s] Found result %s", workflowExecution.ExecutionId, result.Action.ID)
							if result.Action.ID == trigger.ID && result.Status != "SUCCESS" && result.Status != "FAILURE" {
								//log.Printf("[DEBUG][%s] Found subflow result that is not handled. Waiting for results", workflowExecution.ExecutionId)

								subflowId = result.Action.ID
								found = true
								break
							}
						}

						if !found {
							log.Printf("[DEBUG][%s] No result found for subflow. Setting subflowId to %s", workflowExecution.ExecutionId, trigger.ID)
							subflowId = trigger.ID
						}
					}

					if len(subflowId) > 0 {
						break
					}
				}
			}

			if len(subflowId) > 0 {
				// Under rerun period timeout
				timeComparison := 120
				log.Printf("[DEBUG][%s] Starting polling for %d seconds to see if new subflow updates are found on the backend that are not handled. Subflow ID: %s", workflowExecution.ExecutionId, timeComparison, subflowId)
				timestart := time.Now()
				streamResultUrl := fmt.Sprintf("%s/api/v1/streams/results", baseUrl)
				for {
					err = handleSubflowPoller(ctx, workflowExecution, streamResultUrl, subflowId)
					if err == nil {
						log.Printf("[DEBUG] Subflow is finished and we are breaking the thingy")

						if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" && workflowExecution.ExecutionSource != "default" {
							log.Printf("[DEBUG] Force shutdown of worker due to optimized run with webserver. Expecting reruns to take care of this")
							os.Exit(0)
						}

						break
					}

					timepassed := time.Since(timestart)
					if timepassed.Seconds() > float64(timeComparison) {
						log.Printf("[DEBUG][%s] Max poll time reached to look for updates. Stopping poll. This poll is here to send personal results back to itself to be handled, then to stop this thread.", workflowExecution.ExecutionId)
						break
					}

					// Sleep for 1 second
					time.Sleep(1 * time.Second)
				}
			} else {
				log.Printf("[DEBUG][%s] No need to poll for results. Not polling", workflowExecution.ExecutionId)
			}
		}
	}

	return nil
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

	// Might not be necessary because of cleanupEnv hostconfig autoremoval
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

		/*** STARTREMOVE ***/
		if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
			log.Printf("[DEBUG][%s] NOT cleaning up containers. IDS: %d, CLEANUP env: %s", workflowExecution.ExecutionId, 0, cleanupEnv)
		}
		/*** ENDREMOVE ***/
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

		//log.Printf("[DEBUG][%s] All App Logs: %#v", workflowExecution.ExecutionId, allLogs)
		client := shuffle.GetExternalClient(abortUrl)
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
	if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" && isKubernetes != "true" {
		time.Sleep(time.Duration(sleepDuration) * time.Second)
		os.Exit(3)
	} else {
		log.Printf("[DEBUG][%s] Sending result and resetting values (K8s & Swarm).", workflowExecution.ExecutionId)
	}
}

func int32Ptr(i int32) *int32 { return &i }

// ** STARTREMOVE ***/
func deployk8sApp(image string, identifier string, env []string) error {
	if len(os.Getenv("KUBERNETES_NAMESPACE")) > 0 {
		kubernetesNamespace = os.Getenv("KUBERNETES_NAMESPACE")
	} else {
		kubernetesNamespace = "default"
	}

	envMap := make(map[string]string)
	for _, envStr := range env {
		parts := strings.SplitN(envStr, "=", 2)
		if len(parts) == 2 {
			envMap[parts[0]] = parts[1]
		}
	}

	// add to env
	// fmt.Sprintf("SHUFFLE_APP_EXPOSED_PORT=%d", deployport),
	// fmt.Sprintf("SHUFFLE_SWARM_CONFIG=%s", os.Getenv("SHUFFLE_SWARM_CONFIG")),
	envMap["SHUFFLE_APP_EXPOSED_PORT"] = "80"
	envMap["SHUFFLE_SWARM_CONFIG"] = os.Getenv("SHUFFLE_SWARM_CONFIG")
	envMap["BASE_URL"] = "http://shuffle-workers:33333"

	clientset, _, err := shuffle.GetKubernetesClient()
	if err != nil {
		log.Printf("[ERROR] Failed getting kubernetes: %s", err)
		return err
	}

	// str := strings.ToLower(identifier)
	// strSplit := strings.Split(str, "_")
	// value := strSplit[0]
	// value = strings.ReplaceAll(value, "_", "-")
	value := identifier

	baseDeployMode := false

	// check if autoDeploy contains a value 
	// that is equal to the image being deployed.
	for _, value := range autoDeploy {
		if value == image {
			baseDeployMode = true
		}
	}

	autoDeployOverride := os.Getenv("SHUFFLE_USE_GHCR_OVERRIDE_FOR_AUTODEPLOY") == "true"

	localRegistry := ""

	// Checking if app is generated or not
	if !(baseDeployMode && autoDeployOverride) {
		localRegistry = os.Getenv("REGISTRY_URL")
	} else {
		log.Printf("[DEBUG] Detected baseDeploy image (%s) and ghcr override. Resorting to using ghcr instead of registry", image)
	}

	/*
		appDetails := strings.Split(image, ":")[1]
		appDetailsSplit := strings.Split(appDetails, "_")
		appName := strings.Join(appDetailsSplit[:len(appDetailsSplit)-1], "_")
		appVersion := appDetailsSplit[len(appDetailsSplit)-1]
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
	*/

	if (len(localRegistry) == 0 && len(os.Getenv("SHUFFLE_BASE_IMAGE_REGISTRY")) > 0) && !(baseDeployMode && autoDeployOverride) {
		localRegistry = os.Getenv("SHUFFLE_BASE_IMAGE_REGISTRY")
	}

	if (len(localRegistry) > 0 && strings.Count(image, "/") <= 2) && !(baseDeployMode && autoDeployOverride) {
		log.Printf("[DEBUG] Using REGISTRY_URL %s", localRegistry)
		image = fmt.Sprintf("%s/%s", localRegistry, image)
	} else {
		if strings.Count(image, "/") <= 2 && !strings.HasPrefix(image, "frikky/shuffle:") {
			image = fmt.Sprintf("frikky/shuffle:%s", image)
		}
	}

	log.Printf("[DEBUG] Got kubernetes with namespace %#v to run image '%s'", kubernetesNamespace, image)

	//fix naming convention
	// podUuid := uuid.NewV4().String()
	// podName := fmt.Sprintf("%s-%s", value, podUuid)
	// replace identifier "_" with "-"
	podName := strings.ReplaceAll(identifier, "_", "-")

	// pod := &corev1.Pod{
	// 	ObjectMeta: metav1.ObjectMeta{
	// 		Name: podName,
	// 		Labels: map[string]string{
	// 			"app": podName,
	// 			// "executionId": workflowExecution.ExecutionId,
	// 		},
	// 	},
	// 	Spec: corev1.PodSpec{
	// 		RestartPolicy: "Never", // As a crash is not useful in this context
	// 		// DNSPolicy:     "Default",
	// 		DNSPolicy: corev1.DNSClusterFirst,
	// 		// NodeName:      "worker1"
	// 		Containers: []corev1.Container{
	// 			{
	// 				Name:  value,
	// 				Image: image,
	// 				Env:   buildEnvVars(envMap),

	// 				// Pull if not available
	// 				ImagePullPolicy: corev1.PullIfNotPresent,
	// 			},
	// 		},
	// 	},
	// }

	// createdPod, err := clientset.CoreV1().Pods(kubernetesNamespace).Create(context.Background(), pod, metav1.CreateOptions{})
	// if err != nil {
	// 	log.Printf("[ERROR] Failed creating pod: %v", err)
	// 	// os.Exit(1)
	// } else {
	// 	log.Printf("[DEBUG] Created pod %#v in namespace %#v", createdPod.Name, kubernetesNamespace)
	// }

	// service := &corev1.Service{
	// 	ObjectMeta: metav1.ObjectMeta{
	// 		Name: identifier,
	// 	},
	// 	Spec: corev1.ServiceSpec{
	// 		Selector: map[string]string{
	// 			"app": podName,
	// 		},
	// 		Ports: []corev1.ServicePort{
	// 			{
	// 				Protocol:   "TCP",
	// 				Port:       80,
	// 				TargetPort: intstr.FromInt(80),
	// 			},
	// 		},
	// 		Type: corev1.ServiceTypeNodePort,
	// 	},
	// }

	// _, err = clientset.CoreV1().Services(kubernetesNamespace).Create(context.TODO(), service, metav1.CreateOptions{})
	// if err != nil {
	// 	log.Printf("[ERROR] Failed creating service: %v", err)
	// 	return err
	// }

	// use deployment instead of pod
	// then expose a service similarly.
	// number of replicas can be set to os.Getenv("SHUFFLE_SCALE_REPLICAS")
	replicaNumberStr := os.Getenv("SHUFFLE_SCALE_REPLICAS")
	replicaNumber := 1
	if len(replicaNumberStr) > 0 {
		tmpInt, err := strconv.Atoi(replicaNumberStr)
		if err != nil {
			log.Printf("[ERROR] %s is not a valid number for replication", replicaNumberStr)
		} else {
			replicaNumber = tmpInt

		}
	}

	replicaNumberInt32 := int32(replicaNumber)

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: podName,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(replicaNumberInt32),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": podName,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": podName,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  value,
							Image: image,
							Env:   buildEnvVars(envMap),
						},
					},
				},
			},
		},
	}

	_, err = clientset.AppsV1().Deployments(kubernetesNamespace).Create(context.Background(), deployment, metav1.CreateOptions{})
	if err != nil {
		log.Printf("[ERROR] Failed creating deployment: %v", err)
		return err
	}

	// kubectl expose deployment {podName} --type=NodePort --port=80 --target-port=80
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: podName,
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app": podName,
			},
			Ports: []corev1.ServicePort{
				{
					Protocol:   "TCP",
					Port:       80,
					TargetPort: intstr.FromInt(80),
				},
			},
			Type: corev1.ServiceTypeNodePort,
		},
	}

	_, err = clientset.CoreV1().Services(kubernetesNamespace).Create(context.TODO(), service, metav1.CreateOptions{})
	if err != nil {
		log.Printf("[ERROR] Failed creating service: %v", err)
		return err
	}

	return nil
}

//** ENDREMOVE ***/

// Deploys the internal worker whenever something happens
func deployApp(cli *dockerclient.Client, image string, identifier string, env []string, workflowExecution shuffle.WorkflowExecution, action shuffle.Action) error {
	// if isKubernetes == "true" {
	// 	if len(os.Getenv("KUBERNETES_NAMESPACE")) > 0 {
	// 		kubernetesNamespace = os.Getenv("KUBERNETES_NAMESPACE")
	// 	} else {
	// 		kubernetesNamespace = "default"
	// 	}

	// 	envMap := make(map[string]string)
	// 	for _, envStr := range env {
	// 		parts := strings.SplitN(envStr, "=", 2)
	// 		if len(parts) == 2 {
	// 			envMap[parts[0]] = parts[1]
	// 		}
	// 	}

	// 	clientset, _, err := shuffle.GetKubernetesClient()
	// 	if err != nil {
	// 		log.Printf("[ERROR] Failed getting kubernetes: %s", err)
	// 		return err
	// 	}

	// 	str := strings.ToLower(identifier)
	// 	strSplit := strings.Split(str, "_")
	// 	value := strSplit[0]
	// 	value = strings.ReplaceAll(value, "_", "-")

	// 	// Checking if app is generated or not
	// 	localRegistry := os.Getenv("REGISTRY_URL")
	// 	/*
	// 		appDetails := strings.Split(image, ":")[1]
	// 		appDetailsSplit := strings.Split(appDetails, "_")
	// 		appName := strings.Join(appDetailsSplit[:len(appDetailsSplit)-1], "_")
	// 		appVersion := appDetailsSplit[len(appDetailsSplit)-1]
	// 		for _, app := range workflowExecution.Workflow.Actions {
	// 			// log.Printf("[DEBUG] App: %s, Version: %s", appName, appVersion)
	// 			// log.Printf("[DEBUG] Checking app %s with version %s", app.AppName, app.AppVersion)
	// 			if app.AppName == appName && app.AppVersion == appVersion {
	// 				if app.Generated == true {
	// 					log.Printf("[DEBUG] Generated app, setting local registry")
	// 					image = fmt.Sprintf("%s/%s", localRegistry, image)
	// 					break
	// 				} else {
	// 					log.Printf("[DEBUG] Not generated app, setting shuffle registry")
	// 				}
	// 			}
	// 		}
	// 	*/

	// 	if len(localRegistry) == 0 && len(os.Getenv("SHUFFLE_BASE_IMAGE_REGISTRY")) > 0 {
	// 		localRegistry = os.Getenv("SHUFFLE_BASE_IMAGE_REGISTRY")
	// 	}

	// 	if len(localRegistry) > 0 && strings.Count(image, "/") <= 2 {
	// 		log.Printf("[DEBUG] Using REGISTRY_URL %s", localRegistry)
	// 		image = fmt.Sprintf("%s/%s", localRegistry, image)
	// 	} else {
	// 		if strings.Count(image, "/") <= 2 {
	// 			image = fmt.Sprintf("frikky/shuffle:%s", image)
	// 		}
	// 	}

	// 	log.Printf("[DEBUG] Got kubernetes with namespace %#v to run image '%s'", kubernetesNamespace, image)

	// 	//fix naming convention
	// 	podUuid := uuid.NewV4().String()
	// 	podName := fmt.Sprintf("%s-%s", value, podUuid)

	// 	pod := &corev1.Pod{
	// 		ObjectMeta: metav1.ObjectMeta{
	// 			Name: podName,
	// 			Labels: map[string]string{
	// 				"app":         "shuffle-app",
	// 				"executionId": workflowExecution.ExecutionId,
	// 			},
	// 		},
	// 		Spec: corev1.PodSpec{
	// 			RestartPolicy: "Never", // As a crash is not useful in this context
	// 			// DNSPolicy:     "Default",
	// 			DNSPolicy: corev1.DNSClusterFirst,
	// 			// NodeName:      "worker1"
	// 			Containers: []corev1.Container{
	// 				{
	// 					Name:  value,
	// 					Image: image,
	// 					Env:   buildEnvVars(envMap),

	// 					// Pull if not available
	// 					ImagePullPolicy: corev1.PullIfNotPresent,
	// 				},
	// 			},
	// 		},
	// 	}

	// 	createdPod, err := clientset.CoreV1().Pods(kubernetesNamespace).Create(context.Background(), pod, metav1.CreateOptions{})
	// 	if err != nil {
	// 		log.Printf("[ERROR] Failed creating pod: %v", err)
	// 		// os.Exit(1)
	// 	} else {
	// 		log.Printf("[DEBUG] Created pod %#v in namespace %#v", createdPod.Name, kubernetesNamespace)
	// 	}

	// 	return nil
	// }

	// form basic hostConfig
	ctx := context.Background()

	// Check action if subflow
	// Check if url is default (shuffle-backend)
	// If it doesn't exist, add it

	// FIXME: This does NOT replace it in all cases as the data
	// is not saved in the database as the correct param.
	if action.AppName == "shuffle-subflow" {
		// Automatic replacement of URL
		for paramIndex, param := range action.Parameters {
			if param.Name != "backend_url" {
				continue
			}

			if !strings.Contains(param.Value, "shuffle-backend") {
				continue
			}

			// Automatic replacement as this is default
			if len(os.Getenv("BASE_URL")) > 0 {
				action.Parameters[paramIndex].Value = os.Getenv("BASE_URL")
				log.Printf("[DEBUG][%s] Replaced backend_url with base_url %s", workflowExecution.ExecutionId, os.Getenv("BASE_URL"))
			}

			if len(os.Getenv("SHUFFLE_CLOUDRUN_URL")) > 0 {
				action.Parameters[paramIndex].Value = os.Getenv("SHUFFLE_CLOUDRUN_URL")
				log.Printf("[DEBUG][%s] Replaced backend_url with cloudrun %s", workflowExecution.ExecutionId, os.Getenv("SHUFFLE_CLOUDRUN_URL"))
			}
		}
	}

	/*** STARTREMOVE ***/
	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {

		appName := strings.Replace(identifier, fmt.Sprintf("_%s", action.ID), "", -1)
		appName = strings.Replace(appName, fmt.Sprintf("_%s", workflowExecution.ExecutionId), "", -1)
		appName = strings.ToLower(appName)
		//log.Printf("[INFO][%s] New appname: %s, image: %s", workflowExecution.ExecutionId, appName, image)

		if !shuffle.ArrayContains(downloadedImages, image) && isKubernetes != "true" {
			log.Printf("[DEBUG] Downloading image %s from backend as it's first iteration for this image on the worker. Timeout: 60", image)
			// FIXME: Not caring if it's ok or not. Just continuing
			// This is working as intended, just designed to download an updated
			// image on every Orborus/new worker restart.

			// Running as coroutine for eventual completeness
			//go shuffle.DownloadDockerImageBackend(&http.Client{}, image)
			// FIXME: With goroutines it got too much trouble of deploying with an older version
			// Allowing slow startups, as long as it's eventually fast, and uses the same registry as on host.
			shuffle.DownloadDockerImageBackend(&http.Client{Timeout: imagedownloadTimeout}, image)
		}

		var exposedPort int
		var err error

		if isKubernetes != "true" {
			exposedPort, err = findAppInfo(image, appName)
			if err != nil {
				log.Printf("[ERROR] Failed finding and creating port for %s: %s", appName, err)
				return err
			}
		} else {
			// ** STARTREMOVE ***/
			exposedPort = 80
			err = findAppInfoKubernetes(image, appName, env)
			if err != nil {
				log.Printf("[ERROR] Failed finding and creating port for %s: %s", appName, err)
				return err
			}
			// ** ENDREMOVE ***/
		}

		/*
			// Makes it not run at all.
			cacheData := []byte("1")
			newExecId := fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, action.ID)
			err = shuffle.SetCache(ctx, newExecId, cacheData, 30)
			if err != nil {
				log.Printf("[WARNING] (1) Failed setting cache for action %s: %s", newExecId, err)
			} else {
				log.Printf("[DEBUG][%s] (1) Adding %s to cache (%#v)", workflowExecution.ExecutionId, newExecId, action.Name)
			}
		*/

		log.Printf("[DEBUG][%s] Should run towards port %d for app %s. DELAY: %d", workflowExecution.ExecutionId, exposedPort, appName, action.ExecutionDelay)
		ctx := context.Background()
		if action.ExecutionDelay > 0 {
			//log.Printf("[DEBUG] Running app %s with delay of %d", action.Name, action.ExecutionDelay)
			waitTime := time.Duration(action.ExecutionDelay) * time.Second

			time.AfterFunc(waitTime, func() {
				err = sendAppRequest(ctx, baseUrl, appName, exposedPort, &action, &workflowExecution)
				if err != nil {
					log.Printf("[ERROR] Failed sending SCHEDULED request to app %s on port %d: %s", appName, exposedPort, err)
				}
			})

		} else {
			rand.Seed(time.Now().UnixNano())
			waitTime := time.Duration(rand.Intn(500)) * time.Millisecond

			// Added a random delay + context timeout to ensure that the function returns, and only once
			time.AfterFunc(waitTime, func() {
				ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
				defer cancel() // Cancel the context to release resources even if not used

				go sendAppRequest(ctx, baseUrl, appName, exposedPort, &action, &workflowExecution)
			})
		}

		return nil
	}
	/*** ENDREMOVE ***/

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

	// Get environment for certificates
	volumeBinds := []string{}
	volumeBindString := os.Getenv("SHUFFLE_VOLUME_BINDS")
	if len(volumeBindString) > 0 {
		volumeBindSplit := strings.Split(volumeBindString, ",")
		for _, volumeBind := range volumeBindSplit {
			if strings.Contains(volumeBind, ":") {
				volumeBinds = append(volumeBinds, volumeBind)
			} else {
				log.Printf("[ERROR] Volume bind '%s' is invalid.", volumeBind)
			}
		}
	}

	// Add more volume binds if possible
	if len(volumeBinds) > 0 {
		log.Printf("[DEBUG] Setting up binds for container. Got %d volume binds.", len(volumeBinds))

		hostConfig.Binds = volumeBinds
		hostConfig.Mounts = []mount.Mount{}
		for _, bind := range volumeBinds {
			if !strings.Contains(bind, ":") || strings.Contains(bind, "..") || strings.HasPrefix(bind, "~") {
				log.Printf("[ERROR] Volume bind '%s' is invalid. Use absolute paths.", bind)
				continue
			}

			log.Printf("[DEBUG] Appending bind %s to app container", bind)
			bindSplit := strings.Split(bind, ":")
			sourceFolder := bindSplit[0]
			destinationFolder := bindSplit[1]
			hostConfig.Mounts = append(hostConfig.Mounts, mount.Mount{
				Type:   mount.TypeBind,
				Source: sourceFolder,
				Target: destinationFolder,
			})
		}
	}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	// Checking as late as possible, just in case.
	newExecId := fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, action.ID)
	_, err := shuffle.GetCache(ctx, newExecId)
	if err == nil {
		log.Printf("[DEBUG][%s] Result for action %s already found - returning", newExecId, action.ID)
		return nil
	}

	cacheData := []byte("1")
	err = shuffle.SetCache(ctx, newExecId, cacheData, 30)
	if err != nil {
		//log.Printf("[WARNING][%s] Failed setting cache for action: %s", newExecId, err)
	} else {
		//log.Printf("[DEBUG][%s] Adding to cache. Name: %s", workflowExecution.ExecutionId, action.Name)
	}

	if action.ExecutionDelay > 0 {
		log.Printf("[DEBUG][%s] Running app '%s' with label '%s' in docker with delay of %d", workflowExecution.ExecutionId, action.AppName, action.Label, action.ExecutionDelay)
		waitTime := time.Duration(action.ExecutionDelay) * time.Second

		time.AfterFunc(waitTime, func() {
			DeployContainer(ctx, cli, config, hostConfig, identifier, workflowExecution, newExecId)
		})
	} else {
		log.Printf("[DEBUG][%s] Running app %s in docker NORMALLY as there is no delay set with identifier %s", workflowExecution.ExecutionId, action.Name, identifier)
		returnvalue := DeployContainer(ctx, cli, config, hostConfig, identifier, workflowExecution, newExecId)
		//log.Printf("[DEBUG][%s] Normal deploy ret: %s", workflowExecution.ExecutionId, returnvalue)
		return returnvalue
	}

	return nil
}

func cleanupKubernetesExecution(clientset *kubernetes.Clientset, workflowExecution shuffle.WorkflowExecution, namespace string) error {
	// workerName := fmt.Sprintf("worker-%s", workflowExecution.ExecutionId)
	labelSelector := fmt.Sprintf("app=shuffle-app,executionId=%s", workflowExecution.ExecutionId)

	podList, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return fmt.Errorf("[ERROR] Failed to list apps with label selector %s: %#vv", labelSelector, err)
	}

	for _, pod := range podList.Items {
		err := clientset.CoreV1().Pods(namespace).Delete(context.TODO(), pod.Name, metav1.DeleteOptions{})
		if err != nil {
			return fmt.Errorf("failed to delete app %s: %v", pod.Name, err)
		}
		log.Printf("App %s in namespace %s deleted.", pod.Name, namespace)
	}

	// podErr := clientset.CoreV1().Pods(namespace).Delete(context.TODO(), workerName, metav1.DeleteOptions{})
	// if podErr != nil {
	// 	return fmt.Errorf("[ERROR] failed to delete the worker %s in namespace %s: %v", workerName, namespace, podErr)
	// }
	// log.Printf("[DEBUG]  %s in namespace %s deleted.", workerName, namespace)
	return nil
}

func DeployContainer(ctx context.Context, cli *dockerclient.Client, config *container.Config, hostConfig *container.HostConfig, identifier string, workflowExecution shuffle.WorkflowExecution, actionExecId string) error {
	cont, err := cli.ContainerCreate(
		ctx,
		config,
		hostConfig,
		nil,
		nil,
		identifier,
	)

	//log.Printf("[DEBUG] config set: %#v", config)

	if err != nil {
		//log.Printf("[ERROR] Failed creating container: %s", err)
		if !strings.Contains(err.Error(), "Conflict. The container name") {
			log.Printf("[ERROR] Container CREATE error (1): %s", err)

			cacheErr := shuffle.DeleteCache(ctx, actionExecId)
			if cacheErr != nil {
				log.Printf("[ERROR] FAILURE Deleting cache for %s: %s", actionExecId, cacheErr)
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

				cacheErr := shuffle.DeleteCache(ctx, actionExecId)
				if cacheErr != nil {
					log.Printf("[ERROR] FAILURE Deleting cache for %s: %s", actionExecId, cacheErr)
				}

				return err
			}

			//log.Printf("[DEBUG] Made new container ID
		}
	}

	err = cli.ContainerStart(ctx, cont.ID, container.StartOptions{})
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

				cacheErr := shuffle.DeleteCache(ctx, actionExecId)
				if cacheErr != nil {
					log.Printf("[ERROR] FAILURE Deleting cache for %s: %s", actionExecId, cacheErr)
				}

				return err
			}

			log.Printf("[DEBUG] Running secondary check without network with worker")
			err = cli.ContainerStart(ctx, cont.ID, container.StartOptions{})
		}

		if err != nil {
			log.Printf("[ERROR] Failed to start container in environment %s: %s", environment, err)

			cacheErr := shuffle.DeleteCache(ctx, actionExecId)
			if cacheErr != nil {
				log.Printf("[ERROR] FAILURE Deleting cache for %s: %s", actionExecId, cacheErr)
			}

			//shutdown(workflowExecution, workflowExecution.Workflow.ID, true)
			return err
		}
	}

	log.Printf("[DEBUG][%s] Container %s was created for %s", workflowExecution.ExecutionId, cont.ID, identifier)

	// Waiting to see if it exits.. Stupid, but stable(r)
	if workflowExecution.ExecutionSource != "default" {
		log.Printf("[INFO][%s] Handling NON-default execution source %s - NOT waiting or validating!", workflowExecution.ExecutionId, workflowExecution.ExecutionSource)
	} else if workflowExecution.ExecutionSource == "default" {
		log.Printf("[INFO][%s] Handling DEFAULT execution source %s - SKIPPING wait anyway due to exited issues!", workflowExecution.ExecutionId, workflowExecution.ExecutionSource)
	}

	//log.Printf("[DEBUG] Deployed container ID %s", cont.ID)
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

	defer cli.Close()

	// FIXME - ucnomment
	//	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
	//		All: true,
	//	})

	_ = ctx
	_ = cli
	//if err := cli.ContainerStop(ctx, containername, nil); err != nil {
	//	log.Printf("Unable to stop container %s - running removal anyway, just in case: %s", containername, err)
	//}

	removeOptions := container.RemoveOptions{
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

func getWorkerURLs() ([]string, error) {
	workerUrls := []string{}

	if isKubernetes == "true" {
		workerUrls = append(workerUrls, "http://shuffle-workers:33333")
		// workerUrls = append(workerUrls, "http://192.168.29.16:33333")

		// get service "shuffle-workers" "Endpoints"
		// serviceName := "shuffle-workers"
		// clientset, _, err := shuffle.GetKubernetesClient()
		// if err != nil {
		// 	log.Println("[ERROR] Failed to get Kubernetes client:", err)
		// 	return workerUrls, err
		// }

		// services, err := clientset.CoreV1().Services("default").List(context.Background(), metav1.ListOptions{})
		// if err != nil {
		// 	log.Println("[ERROR] Failed to list services:", err)
		// 	return workerUrls, err
		// }

		// for _, service := range services.Items {
		// 	if service.Name == serviceName {
		// 		endpoints, err := clientset.CoreV1().Endpoints("default").Get(context.Background(), serviceName, metav1.GetOptions{})
		// 		if err != nil {
		// 			log.Println("[ERROR] Failed to get endpoints for service:", err)
		// 			return workerUrls, err
		// 		}

		// 		for _, subset := range endpoints.Subsets {
		// 			for _, address := range subset.Addresses {
		// 				for _, port := range subset.Ports {
		// 					url := fmt.Sprintf("http://%s:%d", address.IP, port.Port)
		// 					workerUrls = append(workerUrls, url)
		// 				}
		// 			}
		// 		}
		// 	}
		// }

		log.Printf("[DEBUG] Worker URLs for k8s: %#v", workerUrls)

		return workerUrls, nil
	}

	// Create a new Docker client
	cli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Println("[ERROR] Failed to create Docker client:", err)
		return workerUrls, err
	}

	defer cli.Close()

	// Specify the name of the service for which you want to list tasks
	serviceName := "shuffle-workers"

	// Get the list of tasks for the service
	tasks, err := cli.TaskList(context.Background(), types.TaskListOptions{
		Filters: filters.NewArgs(filters.Arg("service", serviceName)),
	})

	if err != nil {
		log.Println("[ERROR] Failed to list tasks for service:", err)
		return workerUrls, err
	}

	// Print task information
	for _, task := range tasks {
		url := fmt.Sprintf("http://%s.%d.%s:33333", serviceName, task.Slot, task.ID)
		workerUrls = append(workerUrls, url)
	}

	return workerUrls, nil
}

func askOtherWorkersToDownloadImage(image string) {
	if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		return
	}

	// Check environment SHUFFLE_AUTO_IMAGE_DOWNLOAD
	if os.Getenv("SHUFFLE_AUTO_IMAGE_DOWNLOAD") == "false" {
		log.Printf("[DEBUG] SHUFFLE_AUTO_IMAGE_DOWNLOAD is false. NOT distributing images %s", image)
		return
	}

	if shuffle.ArrayContains(imagesDistributed, image) {
		return
	}

	urls, err := getWorkerURLs()
	if err != nil {
		log.Printf("[ERROR] Error in listing worker urls: %s", err)
		return
	}

	if len(urls) < 2 {
		return
	}

	httpClient := &http.Client{}
	distributed := false
	for _, url := range urls {
		//log.Printf("[DEBUG] Trying to speak to: %s", url)
		imagesRequest := ImageRequest{
			Image: image,
		}

		url = fmt.Sprintf("%s/api/v1/download", url)

		//log.Printf("[INFO] Making a request to %s to download images", url)
		imageJSON, err := json.Marshal(imagesRequest)
		req, err := http.NewRequest(
			"POST",
			url,
			bytes.NewBuffer(imageJSON),
		)

		if err != nil {
			log.Printf("[ERROR] Error in making request to %s : %s", url, err)
			continue
		}

		resp, err := httpClient.Do(req)
		if err != nil {
			log.Printf("[ERROR] Error in making request to %s : %s", url, err)
			continue
		}

		defer resp.Body.Close()
		respBody, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Printf("[ERROR] Error in reading response body : %s", err)
			continue
		}

		log.Printf("[INFO] Response body when tried sending images for nodes to download: %s", respBody)
		distributed = true
	}

	if distributed {
		imagesDistributed = append(imagesDistributed, image)
	}
}

func handleExecutionResult(workflowExecution shuffle.WorkflowExecution) {
	ctx := context.Background()

	workflowExecution, relevantActions := shuffle.DecideExecution(ctx, workflowExecution, environment)
	if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "FAILURE" || workflowExecution.Status == "ABORTED" {
		log.Printf("[DEBUG][%s] Shutting down because status is %s", workflowExecution.ExecutionId, workflowExecution.Status)
		shutdown(workflowExecution, "", "Workflow run is already finished", true)
		return
	}

	startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)

	var dockercli *dockerclient.Client
	var err error

	if isKubernetes != "true" {
		dockercli, err = dockerclient.NewEnvClient()
		if err != nil {
			log.Printf("[ERROR] Unable to create docker client (3): %s", err)
			return
		}
		defer dockercli.Close()
	}

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

		askOtherWorkersToDownloadImage(image)

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
		// take care of auto clean up later on for k8s
		if isKubernetes != "true" {
			stats, err := dockercli.ContainerInspect(context.Background(), identifier)
			if err != nil || stats.ContainerJSONBase.State.Status != "running" {
				// REMOVE
				if err == nil {
					log.Printf("[DEBUG][%s] Docker Container Status: %s, should kill: %s", workflowExecution.ExecutionId, stats.ContainerJSONBase.State.Status, identifier)
					err = removeContainer(identifier)
					if err != nil {
						log.Printf("[ERROR] Error killing container: %s", err)
					}
				} else {
					//log.Printf("WHAT TO DO HERE?: %s", err)
				}
			} else if stats.ContainerJSONBase.State.Status == "running" {
				//log.Printf("
				continue
			}
		}

		if len(action.Parameters) == 0 {
			action.Parameters = []shuffle.WorkflowAppActionParameter{}
		}

		if len(action.Errors) == 0 {
			action.Errors = []string{}
		}

		// marshal action and put it in there rofl
		//log.Printf("[INFO][%s] Time to execute %s (%s) with app %s:%s, function %s, env %s with %d parameters.", workflowExecution.ExecutionId, action.ID, action.Label, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))

		log.Printf("[DEBUG][%s] Action: Send, Label: '%s', Action: '%s', Run status: %s, Extra=", workflowExecution.ExecutionId, action.Label, action.AppName, workflowExecution.Status)

		actionData, err := json.Marshal(action)
		if err != nil {
			log.Printf("[WARNING] Failed unmarshalling action: %s", err)
			continue
		}

		if action.AppID == "0ca8887e-b4af-4e3e-887c-87e9d3bc3d3e" {
			log.Printf("[DEBUG] Should run filter: %#v", action)
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
			fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", logsDisabled),
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

		overrideHttpProxy := os.Getenv("SHUFFLE_INTERNAL_HTTP_PROXY")
		overrideHttpsProxy := os.Getenv("SHUFFLE_INTERNAL_HTTPS_PROXY")
		if overrideHttpProxy != "" {
			env = append(env, fmt.Sprintf("SHUFFLE_INTERNAL_HTTP_PROXY=%s", overrideHttpProxy))
		}

		if overrideHttpsProxy != "" {
			env = append(env, fmt.Sprintf("SHUFFLE_INTERNAL_HTTPS_PROXY=%s", overrideHttpsProxy))
		}

		if len(os.Getenv("SHUFFLE_APP_SDK_TIMEOUT")) > 0 {
			env = append(env, fmt.Sprintf("SHUFFLE_APP_SDK_TIMEOUT=%s", os.Getenv("SHUFFLE_APP_SDK_TIMEOUT")))
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
			fmt.Sprintf("%s/%s:%s_%s", registryName, baseimagename, parsedAppname, action.AppVersion),
			fmt.Sprintf("%s:%s_%s", baseimagename, parsedAppname, action.AppVersion),
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

				err := shuffle.DownloadDockerImageBackend(&http.Client{Timeout: imagedownloadTimeout}, image)
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
							defer reader.Close()
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
								log.Printf("[ERROR] Docker build:%sERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), image)
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
					err := shuffle.DownloadDockerImageBackend(&http.Client{Timeout: imagedownloadTimeout}, image)

					executed := false
					if err == nil {
						log.Printf("[DEBUG] Downloaded image %s from backend (CLEANUP)", image)
						//err = deployApp(dockercli, image, identifier, env, workflow, action)
						err = deployApp(dockercli, image, identifier, env, workflowExecution, action)
						if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
							log.Printf("[ERROR] Err: %s", err)
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
							log.Printf("[ERROR] Err: %s", err)
							if strings.Contains(err.Error(), "exited prematurely") {
								log.Printf("[DEBUG] Shutting down (11)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							}

							log.Printf("[WARNING] Failed deploying image THREE TIMES. Attempting to download %s as last resort from backend and dockerhub: %s", image, err)

							if isKubernetes == "true" {
								log.Printf("[ERROR] Image %s doesn't exist. Returning error for now")
								return
							}

							reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
							if err != nil && !strings.Contains(err.Error(), "Conflict. The container name") {
								log.Printf("[ERROR] Failed getting %s. The couldn't be find locally, AND is missing.", image)
								log.Printf("[DEBUG] Shutting down (12)")
								shutdown(workflowExecution, action.ID, fmt.Sprintf("%s", err.Error()), true)
								return
							} else {
								defer reader.Close()
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
									log.Printf("[ERROR] Docker build:%sERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), image)
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
		log.Printf("[ERROR] Failed to update exec variables for execution %s: %s (2)", workflowExecution.ExecutionId, err)
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
			validated := shuffle.ValidateFinished(ctx, -1, workflowExecution)
			if validated {
				shutdownData, err := json.Marshal(workflowExecution)
				if err != nil {
					log.Printf("[ERROR] Failed marshalling shutdowndata during set: %s", err)
				}

				sendResult(workflowExecution, shutdownData)
			}

			log.Printf("[DEBUG][%s] Shutting down (17)", workflowExecution.ExecutionId)
			if isKubernetes == "true" {
				// log.Printf("workflow execution: %#v", workflowExecution)
				clientset, _, err := shuffle.GetKubernetesClient()
				if err != nil {
					log.Println("[ERROR] Error getting kubernetes client (1):", err)
					os.Exit(1)
				}
				cleanupKubernetesExecution(clientset, workflowExecution, kubernetesNamespace)
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
			//log.Printf("Appname trigger (0): %s (%s)", trigger.AppName, trigger.ID)
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
			log.Printf("[DEBUG] Parent ID %s was not found in actions! Skipping parent. (TRIGGER?)", branch.SourceID)
		}

		if destinationFound {
			children[branch.SourceID] = append(children[branch.SourceID], branch.DestinationID)
		} else {
			log.Printf("[DEBUG] Child ID %s was not found in actions! Skipping child. (TRIGGER?)", branch.SourceID)
		}
	}

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

	err := shuffle.UpdateExecutionVariables(ctx, workflowExecution.ExecutionId, startAction, children, parents, visited, executed, nextActions, environments, extra)
	if err != nil {
		log.Printf("[ERROR] Failed to update exec variables for execution %s: %s", workflowExecution.ExecutionId, err)
	}

	return nil
}

func handleSubflowPoller(ctx context.Context, workflowExecution shuffle.WorkflowExecution, streamResultUrl, subflowId string) error {
	// FIXME: If MEMCACHE is enabled, check in this order:

	extra := 0
	for _, trigger := range workflowExecution.Workflow.Triggers {
		if trigger.AppName == "User Input" || trigger.AppName == "Shuffle Workflow" {
			extra += 1
		}
	}

	req, err := http.NewRequest(
		"POST",
		streamResultUrl,
		bytes.NewBuffer([]byte(data)),
	)

	client := shuffle.GetExternalClient(streamResultUrl)
	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed making request (1): %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return err
	}

	defer newresp.Body.Close()
	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading body (1): %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return err
	}

	if newresp.StatusCode != 200 {
		log.Printf("[ERROR] Bad statuscode: %d, %s", newresp.StatusCode, string(body))

		if strings.Contains(string(body), "Workflowexecution is already finished") {
			log.Printf("[DEBUG] Shutting down (19)")
			shutdown(workflowExecution, "", "", true)
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
		return errors.New(fmt.Sprintf("Bad statuscode: %d", newresp.StatusCode))
	}

	err = json.Unmarshal(body, &workflowExecution)
	if err != nil {
		log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return err
	}

	if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
		log.Printf("[INFO][%s] Workflow execution is finished. Exiting worker.", workflowExecution.ExecutionId)
		log.Printf("[DEBUG] Shutting down (20)")
		if isKubernetes == "true" {
			// log.Printf("workflow execution: %#v", workflowExecution)
			clientset, _, err := shuffle.GetKubernetesClient()
			if err != nil {
				log.Println("[ERROR] Error getting kubernetes client (2):", err)
				os.Exit(1)
			}

			cleanupKubernetesExecution(clientset, workflowExecution, kubernetesNamespace)
		} else {
			shutdown(workflowExecution, "", "", true)
		}
	}

	hasUserinput := false
	for _, result := range workflowExecution.Results {
		if result.Action.ID != subflowId {
			continue
		}

		if result.Action.AppName == "User Input" {
			hasUserinput = true
		}

		log.Printf("[DEBUG][%s] Found subflow to handle: %s (%s)", workflowExecution.ExecutionId, result.Action.AppName, result.Status)
		if result.Status == "SUCCESS" || result.Status == "FINISHED" || result.Status == "FAILURE" || result.Status == "ABORTED" {
			// Check for results

			setWorkflowExecution(ctx, workflowExecution, false)
			return nil
		}
	}

	if workflowExecution.Status == "WAITING" && workflowExecution.ExecutionSource != "default" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		log.Printf("[INFO][%s] Workflow execution is waiting. Exiting worker, as backend will restart it.", workflowExecution.ExecutionId)
		shutdown(workflowExecution, "", "", true)
	}

	log.Printf("[INFO][%s] (2) Status: %s, Results: %d, actions: %d. Userinput: %#v", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra, hasUserinput)
	return errors.New("Subflow status not found yet")
}

func handleDefaultExecutionWrapper(ctx context.Context, workflowExecution shuffle.WorkflowExecution, streamResultUrl string, extra int) error {
	if extra == -1 {
		extra = 0
		for _, trigger := range workflowExecution.Workflow.Triggers {
			if trigger.AppName == "User Input" || trigger.AppName == "Shuffle Workflow" {
				extra += 1
			}
		}
	}

	req, err := http.NewRequest(
		"POST",
		streamResultUrl,
		bytes.NewBuffer([]byte(data)),
	)

	newresp, err := topClient.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed making request (1): %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return err
	}

	defer newresp.Body.Close()
	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading body (1): %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return err
	}

	if newresp.StatusCode != 200 {
		log.Printf("[ERROR] Bad statuscode: %d, %s", newresp.StatusCode, string(body))

		if strings.Contains(string(body), "Workflowexecution is already finished") {
			log.Printf("[DEBUG] Shutting down (19)")
			shutdown(workflowExecution, "", "", true)
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
		return errors.New(fmt.Sprintf("Bad statuscode: %d", newresp.StatusCode))
	}

	err = json.Unmarshal(body, &workflowExecution)
	if err != nil {
		log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return err
	}

	if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
		log.Printf("[INFO][%s] Workflow execution is finished. Exiting worker.", workflowExecution.ExecutionId)
		log.Printf("[DEBUG] Shutting down (20)")
		if isKubernetes == "true" {
			// log.Printf("workflow execution: %#v", workflowExecution)
			clientset, _, err := shuffle.GetKubernetesClient()
			if err != nil {
				log.Println("[ERROR] Error getting kubernetes client (2):", err)
				os.Exit(1)
			}
			cleanupKubernetesExecution(clientset, workflowExecution, kubernetesNamespace)
		} else {
			shutdown(workflowExecution, "", "", true)
		}
	}

	log.Printf("[INFO][%s] (3) Status: %s, Results: %d, actions: %d", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)
	if workflowExecution.Status != "EXECUTING" {
		log.Printf("[WARNING][%s] Exiting as worker execution has status %s!", workflowExecution.ExecutionId, workflowExecution.Status)
		log.Printf("[DEBUG] Shutting down (21)")
		if isKubernetes == "true" {
			// log.Printf("workflow execution: %#v", workflowExecution)
			clientset, _, err := shuffle.GetKubernetesClient()
			if err != nil {
				log.Println("[ERROR] Error getting kubernetes client (3):", err)
				os.Exit(1)
			}

			cleanupKubernetesExecution(clientset, workflowExecution, kubernetesNamespace)
		} else {
			shutdown(workflowExecution, "", "", true)
		}
	}

	setWorkflowExecution(ctx, workflowExecution, false)
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
		err = handleDefaultExecutionWrapper(ctx, workflowExecution, streamResultUrl, extra)
		if err != nil {
			log.Printf("[ERROR] Failed handling default execution: %s", err)
		}
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

	newresp, err := topClient.Do(req)
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
	newresp, err := topClient.Do(req)
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

func handleWorkflowQueue(resp http.ResponseWriter, request *http.Request) {
	if request.Body == nil {
		resp.WriteHeader(http.StatusBadRequest)
		return
	}

	defer request.Body.Close()
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] (3) Failed reading body for workflowqueue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("[ERROR] Failed shuffle.ActionResult unmarshaling (2): %s", err)
		//resp.WriteHeader(401)
		//resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		//return
	}

	if len(actionResult.ExecutionId) == 0 {
		log.Printf("[ERROR] No workflow execution id in action result. Data: %s", string(body))
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
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution ID %s because it doesn't exist locally."}`, actionResult.ExecutionId)))
		return
	}

	if workflowExecution.Authorization != actionResult.Authorization {
		log.Printf("[ERROR][%s] Bad authorization key when updating node (workflowQueue). Want: %s, Have: %s", actionResult.ExecutionId, workflowExecution.Authorization, actionResult.Authorization)
		resp.WriteHeader(403)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key"}`)))
		return
	}

	if workflowExecution.Status == "FINISHED" {
		log.Printf("[DEBUG][%s] Workflowexecution is already FINISHED. No further action can be taken", workflowExecution.ExecutionId)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is already finished because it has status %s. Lastnode: %s"}`, workflowExecution.Status, workflowExecution.LastNode)))
		return
	}

	if workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {
		log.Printf("[WARNING][%s] Workflowexecution already has status %s. No further action can be taken", workflowExecution.ExecutionId, workflowExecution.Status)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is aborted because of %s with result %s and status %s"}`, workflowExecution.LastNode, workflowExecution.Result, workflowExecution.Status)))
		return
	}

	retries := 0
	retry, retriesok := request.URL.Query()["retries"]
	if retriesok && len(retry) > 0 {
		val, err := strconv.Atoi(retry[0])
		if err == nil {
			retries = val
		}
	}

	log.Printf("[DEBUG][%s] Action: Received, Label: '%s', Action: '%s', Status: %s, Run status: %s, Extra=Retry:%d", workflowExecution.ExecutionId, actionResult.Action.Label, actionResult.Action.AppName, actionResult.Status, workflowExecution.Status, retries)

	// results = append(results, actionResult)
	// log.Printf("[INFO][%s] Time to execute %s (%s) with app %s:%s, function %s, env %s with %d parameters.", workflowExecution.ExecutionId, action.ID, action.Label, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))
	// log.Printf("[DEBUG][%s] In workflowQueue with transaction", workflowExecution.ExecutionId)
	runWorkflowExecutionTransaction(ctx, 0, workflowExecution.ExecutionId, actionResult, resp)
}

// Will make sure transactions are always ran for an execution. This is recursive if it fails. Allowed to fail up to 5 times
func runWorkflowExecutionTransaction(ctx context.Context, attempts int64, workflowExecutionId string, actionResult shuffle.ActionResult, resp http.ResponseWriter) {
	//log.Printf("[DEBUG][%s] IN WORKFLOWEXECUTION SUB!", actionResult.ExecutionId)
	workflowExecution, err := shuffle.GetWorkflowExecution(ctx, workflowExecutionId)
	if err != nil {
		log.Printf("[ERROR] Failed getting execution cache: %s", err)
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution"}`)))
		return
	}

	resultLength := len(workflowExecution.Results)
	setExecution := true

	workflowExecution, dbSave, err := shuffle.ParsedExecutionResult(ctx, *workflowExecution, actionResult, true, 0)
	if err == nil {
		if workflowExecution.Status != "EXECUTING" && workflowExecution.Status != "WAITING" {
			log.Printf("[WARNING][%s] Execution is not executing, but %s. Stopping Transaction update.", workflowExecution.ExecutionId, workflowExecution.Status)
			if resp != nil {
				resp.WriteHeader(200)
				resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Execution is not executing, but %s"}`, workflowExecution.Status)))
			}

			log.Printf("[DEBUG][%s] Shutting down (35)", workflowExecution.ExecutionId)

			// Force sending result
			shutdownData, err := json.Marshal(workflowExecution)
			if err != nil {
				log.Printf("[ERROR][%s] Failed marshalling execution (35): %s", workflowExecution.ExecutionId, err)
			}

			sendResult(*workflowExecution, shutdownData)
			shutdown(*workflowExecution, "", "", false)
			return
		}

		/*** STARTREMOVE ***/
		if workflowExecution.Status == "WAITING" && (os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm") {
			log.Printf("[INFO][%s] Workflow execution is waiting while in swarm. Sending info to backend to ensure execution stops.", workflowExecution.ExecutionId)

			shutdownData, err := json.Marshal(workflowExecution)
			if err != nil {
				log.Printf("[ERROR][%s] Failed marshalling execution (36) - not sending backend WAITING: %s", workflowExecution.ExecutionId, err)
			} else {
				sendResult(*workflowExecution, shutdownData)
				shutdown(*workflowExecution, "", "", false)
			}
		}
		/*** ENDREMOVE ***/
	} else {
		if strings.Contains(strings.ToLower(fmt.Sprintf("%s", err)), "already been ran") || strings.Contains(strings.ToLower(fmt.Sprintf("%s", err)), "already finished") {
			log.Printf("[ERROR][%s] Skipping rerun of action result as it's already been ran: %s", workflowExecution.ExecutionId)
			return
		}

		log.Printf("[DEBUG] Rerunning transaction? %s", err)
		if strings.Contains(fmt.Sprintf("%s", err), "Rerun this transaction") {
			workflowExecution, err := shuffle.GetWorkflowExecution(ctx, workflowExecutionId)
			if err != nil {
				log.Printf("[ERROR][%s] Failed getting execution cache (2): %s", workflowExecution.ExecutionId, err)
				resp.WriteHeader(400)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution (2)"}`)))
				return
			}

			resultLength = len(workflowExecution.Results)
			setExecution = true

			workflowExecution, dbSave, err = shuffle.ParsedExecutionResult(ctx, *workflowExecution, actionResult, false, 0)
			if err != nil {
				log.Printf("[ERROR][%s] Failed execution of parsedexecution (2): %s", workflowExecution.ExecutionId, err)
				resp.WriteHeader(401)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution (2)"}`)))
				return
			} else {
				log.Printf("[DEBUG][%s] Successfully got ParsedExecution with %d results!", workflowExecution.ExecutionId, len(workflowExecution.Results))
			}
		} else {
			log.Printf("[ERROR][%s] Failed execution of parsedexecution: %s", workflowExecution.ExecutionId, err)
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
			log.Printf("[ERROR][%s] Failed unmarshalling workflowexecution: %s", workflowExecution.ExecutionId, err)
		}

		if len(parsedValue.Results) > 0 && len(parsedValue.Results) != resultLength {
			setExecution = false
			if attempts > 5 {
			}

			attempts += 1
			log.Printf("[DEBUG][%s] Rerunning transaction as results has changed. %d vs %d", workflowExecution.ExecutionId, len(parsedValue.Results), resultLength)
			/*
				if len(workflowExecution.Results) <= len(workflowExecution.Workflow.Actions) {
					log.Printf("[DEBUG][%s] Rerunning transaction as results has changed. %d vs %d", workflowExecution.ExecutionId, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
					runWorkflowExecutionTransaction(ctx, attempts, workflowExecutionId, actionResult, resp)
					return
				}
			*/
		}
	}

	if setExecution || workflowExecution.Status == "FINISHED" || workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {
		log.Printf("[DEBUG][%s] Running setexec with status %s and %d/%d results", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
		//result(s)", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results))
		err = setWorkflowExecution(ctx, *workflowExecution, dbSave)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed setting workflowexecution actionresult: %s"}`, err)))
			return
		}

		/*** STARTREMOVE ***/
		if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
			finished := shuffle.ValidateFinished(ctx, -1, *workflowExecution)
			if !finished {
				log.Printf("[DEBUG][%s] Handling next node since it's not finished!", workflowExecution.ExecutionId)
				handleExecutionResult(*workflowExecution)
			} else {
				shutdownData, err := json.Marshal(workflowExecution)
				if err != nil {
					log.Printf("[ERROR] Failed marshalling shutdowndata during set: %s", err)
				}

				sendResult(*workflowExecution, shutdownData)
			}
		}
		/*** ENDREMOVE ***/
	} else {
		log.Printf("[INFO][%s] Skipping setexec with status %s", workflowExecution.ExecutionId, workflowExecution.Status)

		// Just in case. Should MAYBE validate finishing another time as well.
		// This fixes issues with e.g. shuffle.Action -> shuffle.Trigger -> shuffle.Action.
		handleExecutionResult(*workflowExecution)
	}

	//if newExecutions && len(nextActions) > 0 {
	//	log.Printf("[DEBUG][%s] New execution: %#v. NextActions: %#v", newExecutions, nextActions)
	//	//handleExecutionResult(*workflowExecution)
	//}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func sendSelfRequest(actionResult shuffle.ActionResult) {

	/*** STARTREMOVE ***/
	if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		log.Printf("[INFO][%s] Not sending self request info since source is default (not swarm)", actionResult.ExecutionId)
		return
	}
	/*** ENDREMOVE ***/

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

	client := shuffle.GetExternalClient(streamUrl)
	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR][%s] Error running finishing request (2): %s", actionResult.ExecutionId, err)
		return
	}

	defer newresp.Body.Close()
	if newresp.Body != nil {
		body, err := ioutil.ReadAll(newresp.Body)
		//log.Printf("[INFO] BACKEND STATUS: %d", newresp.StatusCode)
		if err != nil {
			log.Printf("[ERROR][%s] Failed reading body: %s", actionResult.ExecutionId, err)
		} else {
			log.Printf("[DEBUG][%s] NEWRESP (from backend): %s", actionResult.ExecutionId, string(body))
		}
	}
}

func sendResult(workflowExecution shuffle.WorkflowExecution, data []byte) {
	if workflowExecution.ExecutionSource == "default" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
		//log.Printf("[INFO][%s] Not sending backend info since source is default (not swarm)", workflowExecution.ExecutionId)
		//return
	} else {
	}

	// Basically to reduce backend strain
	/*
		if shuffle.ArrayContains(finishedExecutions, workflowExecution.ExecutionId) {
			log.Printf("[INFO][%s] NOT sending backend info since it's already been sent before.", workflowExecution.ExecutionId)
			return
		}
	*/

	// Take it down again
	/*
		if len(finishedExecutions) > 100 {
			log.Printf("[DEBUG][%s] Removing old execution from finishedExecutions: %s", workflowExecution.ExecutionId, finishedExecutions[0])
			finishedExecutions = finishedExecutions[99:]
		}

		finishedExecutions = append(finishedExecutions, workflowExecution.ExecutionId)
	*/

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

	client := shuffle.GetExternalClient(streamUrl)
	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR][%s] Error running finishing request (1): %s", workflowExecution.ExecutionId, err)
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
		return false
	} else {
		workflowExecution = *newexec
	}

	//startAction, extra, children, parents, visited, executed, nextActions, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)
	workflowExecution, _ = shuffle.Fixexecution(ctx, workflowExecution)
	_, extra, _, _, _, _, _, environments := shuffle.GetExecutionVariables(ctx, workflowExecution.ExecutionId)

	log.Printf("[INFO][%s] VALIDATION. Status: %s, shuffle.Actions: %d, Extra: %d, Results: %d. Parent: %#v", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Workflow.Actions), extra, len(workflowExecution.Results), workflowExecution.ExecutionParent)

	if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "ABORTED" || (len(environments) == 1 && requestsSent == 0 && len(workflowExecution.Results) >= 1 && os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm") || (len(workflowExecution.Results) >= len(workflowExecution.Workflow.Actions)+extra && len(workflowExecution.Workflow.Actions) > 0) {

		if workflowExecution.Status == "FINISHED" {
			for _, result := range workflowExecution.Results {
				if result.Status == "EXECUTING" || result.Status == "WAITING" {
					log.Printf("[WARNING] NOT returning full result, as a result may be unfinished: %s (%s) - %s", result.Action.Label, result.Action.ID, result.Status)
					return false
				}
			}
		}

		/*** STARTREMOVE ***/
		if os.Getenv("SHUFFLE_SWARM_CONFIG") != "run" && os.Getenv("SHUFFLE_SWARM_CONFIG") != "swarm" {
			requestsSent += 1
		}
		/*** ENDREMOVE ***/

		log.Printf("[DEBUG][%s] Should send full result to %s", workflowExecution.ExecutionId, baseUrl)

		//data = fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, executionId, authorization)
		shutdownData, err := json.Marshal(workflowExecution)
		if err != nil {
			log.Printf("[ERROR][%s] Shutting down (32):  Failed to unmarshal data for backend: %s", workflowExecution.ExecutionId, err)
			shutdown(workflowExecution, "", "", true)
		}

		cacheKey := fmt.Sprintf("workflowexecution_%s", workflowExecution.ExecutionId)
		if len(workflowExecution.Authorization) > 0 {
			err = shuffle.SetCache(ctx, cacheKey, shutdownData, 31)
			if err != nil {
				log.Printf("[ERROR][%s] Failed adding to cache during ValidateFinished", workflowExecution)
			}
		}

		shuffle.RunCacheCleanup(ctx, workflowExecution)
		sendResult(workflowExecution, shutdownData)
		return true
	}

	return false
}

func handleGetStreamResults(resp http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] Failed reading body for stream result queue")
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

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
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key or execution_id might not exist."}`)))
		return
	}

	// Authorization is done here
	if workflowExecution.Authorization != actionResult.Authorization {
		log.Printf("[ERROR] Bad authorization key when getting stream results from cache %s.", actionResult.ExecutionId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key or execution_id might not exist."}`)))
		return
	}

	newjson, err := json.Marshal(workflowExecution)
	if err != nil {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking workflow execution"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newjson)

}

// GetLocalIP returns the non loopback local IP of the host
func getLocalIP() string {

	/*** STARTREMOVE ***/
	if os.Getenv("IS_KUBERNETES") == "true" {
		return "shuffle-workers"
	}

	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		name, err := os.Hostname()
		if err != nil {
			log.Printf("[ERROR] Couldn't find hostname of worker: %s", err)
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
	/*** ENDREMOVE ***/

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
	if isKubernetes == "true" {
		os.Setenv("WORKER_HOSTNAME", "shuffle-workers")
	} else {
		os.Setenv("WORKER_HOSTNAME", hostname)
	}

	// FIXME: This MAY not work because of speed between first
	// container being launched and port being assigned to webserver
	listener, err := getAvailablePort()
	if err != nil {
		log.Printf("[ERROR] Failed to create init listener: %s", err)
		return listener
	}

	log.Printf("[DEBUG] OLD HOSTNAME: %s", appCallbackUrl)

	/*** STARTREMOVE ***/
	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		log.Printf("[DEBUG] Starting webserver (1) on port %d with hostname: %s", baseport, hostname)

		os.Setenv("WORKER_PORT", fmt.Sprintf("%d", baseport))
		appCallbackUrl = fmt.Sprintf("http://%s:%d", hostname, baseport)
		if os.Getenv("IS_KUBERNETES") == "true" {
			appCallbackUrl = fmt.Sprintf("http://%s:%d", "shuffle-workers", baseport)
			log.Printf("[DEBUG] NEW WORKER APP: %s", appCallbackUrl)
			hostname = "shuffle-workers"
		}

		listener, err = net.Listen("tcp", fmt.Sprintf(":%d", baseport))
		if err != nil {
			log.Printf("[ERROR] Failed to assign port to %d: %s", baseport, err)
			return nil
		}

		return listener
	}
	/*** ENDREMOVE ***/

	port := listener.Addr().(*net.TCPAddr).Port
	// Set the port environment variable
	os.Setenv("WORKER_PORT", fmt.Sprintf("%d", port))

	log.Printf("[DEBUG] Starting webserver (2) on port %d with hostname: %s", port, hostname)
	appCallbackUrl = fmt.Sprintf("http://%s:%d", hostname, port)

	log.Printf("[INFO] NEW WORKER HOSTNAME: %s", appCallbackUrl)
	return listener
}

func findActiveSwarmNodes(dockercli *dockerclient.Client) (int64, error) {
	ctx := context.Background()
	nodes, err := dockercli.NodeList(ctx, types.NodeListOptions{})
	if err != nil {
		return 1, err
	}

	nodeCount := int64(0)
	for _, node := range nodes {
		//log.Printf("ID: %s - %#v", node.ID, node.Status.State)
		if node.Status.State == "ready" {
			nodeCount += 1
		}
	}

	// Check for SHUFFLE_MAX_NODES
	maxNodesString := os.Getenv("SHUFFLE_MAX_SWARM_NODES")
	// Make it into a number and check if it's lower than nodeCount
	if len(maxNodesString) > 0 {
		maxNodes, err := strconv.ParseInt(maxNodesString, 10, 64)
		if err != nil {
			return nodeCount, err
		}

		if nodeCount > maxNodes {
			nodeCount = maxNodes
		}
	}

	return nodeCount, nil

	/*
		containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
			All: true,
		})
	*/
}

/*** STARTREMOVE ***/
func deploySwarmService(dockercli *dockerclient.Client, name, image string, deployport int) error {
	log.Printf("[DEBUG] Deploying service for %s to swarm on port %d", name, deployport)
	//containerName := fmt.Sprintf("shuffle-worker-%s", parsedUuid)

	if len(baseimagename) == 0 || baseimagename == "/" {
		baseimagename = "frikky/shuffle"
		//var baseimagename = "frikky/shuffle"
		//var registryName = "registry.hub.docker.com"
	}

	//image := fmt.Sprintf("%s:%s", baseimagename, name)
	networkName := "shuffle-executions"
	if len(swarmNetworkName) > 0 {
		networkName = swarmNetworkName
	}

	replicas := uint64(1)

	// Sent from Orborus
	// Should be equal to
	scaleReplicas := os.Getenv("SHUFFLE_APP_REPLICAS")
	if len(scaleReplicas) > 0 {
		tmpInt, err := strconv.Atoi(scaleReplicas)
		if err != nil {
			log.Printf("[ERROR] %s is not a valid number for replication", scaleReplicas)
		} else {
			replicas = uint64(tmpInt)
		}

		log.Printf("[DEBUG] SHUFFLE_APP_REPLICAS set to value %#v. Trying to overwrite default (%d/node)", scaleReplicas, replicas)
	}

	cnt, err := findActiveSwarmNodes(dockercli)
	if err != nil {
		log.Printf("[ERROR] Unable to find active swarm nodes: %s", err)
	}

	nodeCount := uint64(1)
	if cnt > 0 {
		nodeCount = uint64(cnt)
	}

	replicatedJobs := uint64(replicas * nodeCount)
	log.Printf("[DEBUG] Deploying app with name %s with image %s", name, image)

	containerName := fmt.Sprintf(strings.Replace(name, ".", "-", -1))
	serviceSpec := swarm.ServiceSpec{
		Annotations: swarm.Annotations{
			Name:   containerName,
			Labels: map[string]string{},
		},
		Mode: swarm.ServiceMode{
			Replicated: &swarm.ReplicatedService{
				// Max replicas total (?)
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
					fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", logsDisabled),
				},
				Hosts: []string{
					containerName,
				},
			},
			RestartPolicy: &swarm.RestartPolicy{
				Condition: swarm.RestartPolicyConditionAny,
			},
			Placement: &swarm.Placement{
				// Max per node
				MaxReplicas: replicatedJobs,
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

	overrideHttpProxy := os.Getenv("SHUFFLE_INTERNAL_HTTP_PROXY")
	overrideHttpsProxy := os.Getenv("SHUFFLE_INTERNAL_HTTPS_PROXY")
	if overrideHttpProxy != "" {
		serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("SHUFFLE_INTERNAL_HTTP_PROXY=%s", overrideHttpProxy))

	}

	if overrideHttpsProxy != "" {
		serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("SHUFFLE_INTERNAL_HTTPS_PROXY=%s", overrideHttpsProxy))
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

	if len(os.Getenv("SHUFFLE_APP_SDK_TIMEOUT")) > 0 {
		serviceSpec.TaskTemplate.ContainerSpec.Env = append(serviceSpec.TaskTemplate.ContainerSpec.Env, fmt.Sprintf("SHUFFLE_APP_SDK_TIMEOUT=%s", os.Getenv("SHUFFLE_APP_SDK_TIMEOUT")))
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

/*** ENDREMOVE ***/

// Runs data discovery
/*** STARTREMOVE ***/

func findAppInfoKubernetes(image, name string, env []string) error {
	clientset, _, err := shuffle.GetKubernetesClient()
	if err != nil {
		log.Printf("[ERROR] Failed getting kubernetes: %s", err)
		return err
	}

	// Check if it exists as a pod
	namespace := "default"
	if len(kubernetesNamespace) > 0 {
		namespace = kubernetesNamespace
	}

	// check deployments
	deployments, err := clientset.AppsV1().Deployments(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		log.Printf("[ERROR] Failed listing deployments: %s", err)
		return err
	}

	name = strings.Replace(name, "_", "-", -1)

	// check if it exists as a pod
	// for _, pod := range pods.Items {
	// 	if pod.Name == name {
	// 		log.Printf("[INFO] Found pod %s - no need to deploy another", name)
	// 		return nil
	// 	}
	// }

	for _, deployment := range deployments.Items {
		if deployment.Name == name {
			log.Printf("[INFO] Found deployment %s - no need to deploy another", name)
			return nil
		}
	}

	err = deployk8sApp(image, name, env)
	return err
}

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
			log.Printf("[DEBUG] Deployed app with name %s", name)
		}

		exposedPort = highest

		if appsInitialized {
			log.Printf("[DEBUG] Waiting 30 seconds before moving on to let app start")
			time.Sleep(time.Duration(30) * time.Second)
		}
	}

	return exposedPort, nil
}

/*** ENDREMOVE ***/

func sendAppRequest(ctx context.Context, incomingUrl, appName string, port int, action *shuffle.Action, workflowExecution *shuffle.WorkflowExecution) error {
	parsedRequest := shuffle.OrborusExecutionRequest{
		Cleanup:               cleanupEnv,
		ExecutionId:           workflowExecution.ExecutionId,
		Authorization:         workflowExecution.Authorization,
		EnvironmentName:       os.Getenv("ENVIRONMENT_NAME"),
		Timezone:              os.Getenv("TZ"),
		HTTPProxy:             os.Getenv("HTTP_PROXY"),
		HTTPSProxy:            os.Getenv("HTTPS_PROXY"),
		ShufflePassProxyToApp: os.Getenv("SHUFFLE_PASS_APP_PROXY"),
		Url:                   baseUrl,
		BaseUrl:               baseUrl,
		Action:                *action,
		FullExecution:         *workflowExecution,
	}
	// Sometimes makes it have the wrong data due to timing

	// Specific for subflow to ensure worker matches the backend correctly

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

	// Swapping because this was confusing during dev
	// No real reason, just variable names
	tmp := parsedRequest.Url
	parsedRequest.Url = parsedRequest.BaseUrl
	parsedRequest.BaseUrl = tmp

	// Run with proper hostname, but set to shuffle-worker to avoid specific host target.
	// This means running with VIP instead.
	if len(hostname) > 0 {
		parsedRequest.BaseUrl = fmt.Sprintf("http://%s:%d", hostname, baseport)
		//parsedRequest.BaseUrl = fmt.Sprintf("http://shuffle-workers:%d", baseport)
		//log.Printf("[DEBUG][%s] Changing hostname to local hostname in Docker network for WORKER URL: %s", workflowExecution.ExecutionId, parsedRequest.BaseUrl)

		if parsedRequest.Action.AppName == "shuffle-subflow" || parsedRequest.Action.AppName == "shuffle-subflow-v2" || parsedRequest.Action.AppName == "User Input" {
			parsedRequest.BaseUrl = fmt.Sprintf("http://%s:%d", hostname, baseport)
			//parsedRequest.Url = parsedRequest.BaseUrl
		}
	}

	// Making sure to get the LATEST execution data
	// This is due to cache timing issues
	exec, err := shuffle.GetWorkflowExecution(ctx, workflowExecution.ExecutionId)
	if err == nil && len(exec.ExecutionId) > 0 {
		parsedRequest.FullExecution = *exec
	}

	data, err := json.Marshal(parsedRequest)
	if err != nil {
		log.Printf("[ERROR] Failed marshalling worker request: %s", err)
		return err
	}

	if isKubernetes == "true" {
		appName = strings.Replace(appName, "_", "-", -1)
	}

	streamUrl := fmt.Sprintf("http://%s:%d/api/v1/run", appName, port)
	// log.Printf("[DEBUG][%s] Worker URL: %s, Backend URL: %s, Target App: %s", workflowExecution.ExecutionId, parsedRequest.BaseUrl, parsedRequest.Url, streamUrl)
	req, err := http.NewRequest(
		"POST",
		streamUrl,
		bytes.NewBuffer([]byte(data)),
	)

	// Checking as LATE as possible, ensuring we don't rerun what's already ran
	// ctx = context.Background()
	newExecId := fmt.Sprintf("%s_%s", workflowExecution.ExecutionId, action.ID)
	_, err = shuffle.GetCache(ctx, newExecId)
	if err == nil {
		log.Printf("[DEBUG] Result for %s already found (PRE REQUEST) - returning", newExecId)
		return nil
	}

	cacheData := []byte("1")
	err = shuffle.SetCache(ctx, newExecId, cacheData, 30)
	if err != nil {
		log.Printf("[WARNING] Failed setting cache for action %s: %s", newExecId, err)
	} else {
		//log.Printf("[DEBUG][%s] Adding %s to cache (%#v)", workflowExecution.ExecutionId, newExecId, action.Name)
	}

	client := shuffle.GetExternalClient(streamUrl)
	customTimeout := os.Getenv("SHUFFLE_APP_REQUEST_TIMEOUT")
	if len(customTimeout) > 0 {
		// convert to int
		timeoutInt, err := strconv.Atoi(customTimeout)
		if err != nil {
			log.Printf("[ERROR] Failed converting SHUFFLE_APP_REQUEST_TIMEOUT to int: %s", err)
		} else {
			log.Printf("[DEBUG] Setting client timeout to %d seconds for app request", timeoutInt)
			client.Timeout = time.Duration(timeoutInt) * time.Second
		}
	}

	newresp, err := client.Do(req)
	if err != nil {
		// Another timeout issue here somewhere
		// context deadline
		if strings.Contains(fmt.Sprintf("%s", err), "context deadline exceeded") || strings.Contains(fmt.Sprintf("%s", err), "Client.Timeout exceeded") {
			return nil
		}

		if strings.Contains(fmt.Sprintf("%s", err), "timeout awaiting response") {
			return nil
		}

		newerr := fmt.Sprintf("%s", err)
		if strings.Contains(newerr, "connection refused") || strings.Contains(newerr, "no such host") {
			newerr = fmt.Sprintf("Failed connecting to app %s. Is the Docker image available?", appName)
		} else {
			// escape quotes and newlines
			newerr = strings.ReplaceAll(strings.ReplaceAll(newerr, "\"", "\\\""), "\n", "\\n")
		}

		if strings.Contains(fmt.Sprintf("%s", err), "no such host") {
			log.Printf("[DEBUG] SHOULD be Removing references to location for app %s as to be rediscovered", action.AppName)

			//for k, v := range portMappings {
			//	if strings.Contains(strings.ToLower(strings.ReplaceAll(action.AppName, " ", "_"))) {
			//	}
			//}

			//var portMappings map[string]int
		}

		log.Printf("[ERROR][%s] Error running app run request: %s", workflowExecution.ExecutionId, err)
		actionResult := shuffle.ActionResult{
			Action:        *action,
			ExecutionId:   workflowExecution.ExecutionId,
			Authorization: workflowExecution.Authorization,
			Result:        fmt.Sprintf(`{"success": false, "reason": "Failed to connect to app %s in swarm. Try the action again, restart Orborus if this is recurring, or contact support@shuffler.io.", "details": "%s"}`, streamUrl, newerr),
			StartedAt:     int64(time.Now().Unix()),
			CompletedAt:   int64(time.Now().Unix()),
			Status:        "FAILURE",
		}

		// If this happens - send failure signal to stop the workflow?
		sendSelfRequest(actionResult)
		return err
	}

	defer newresp.Body.Close()
	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading app request body body: %s", err)
		return err
	} else {
		log.Printf("[DEBUG][%s] NEWRESP (from app): %s", workflowExecution.ExecutionId, string(body))
	}

	return nil
}

// Function to auto-deploy certain apps if "run" is set
// Has some issues with loading when running multiple workers and such.
func baseDeploy() {

	var cli *dockerclient.Client
	var err error

	if isKubernetes != "true" {
		cli, err := dockerclient.NewEnvClient()
		if err != nil {
			log.Printf("[ERROR] Unable to create docker client (3): %s", err)
			return
		}
		defer cli.Close()
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
			fmt.Sprintf("SHUFFLE_LOGS_DISABLED=%s", logsDisabled),
		}

		if strings.ToLower(os.Getenv("SHUFFLE_PASS_APP_PROXY")) == "true" {
			//log.Printf("APPENDING PROXY TO THE APP!")
			env = append(env, fmt.Sprintf("HTTP_PROXY=%s", os.Getenv("HTTP_PROXY")))
			env = append(env, fmt.Sprintf("HTTPS_PROXY=%s", os.Getenv("HTTPS_PROXY")))
			env = append(env, fmt.Sprintf("NO_PROXY=%s", os.Getenv("NO_PROXY")))
		}

		if len(os.Getenv("SHUFFLE_APP_SDK_TIMEOUT")) > 0 {
			log.Printf("[DEBUG] Setting SHUFFLE_APP_SDK_TIMEOUT to %s", os.Getenv("SHUFFLE_APP_SDK_TIMEOUT"))
			env = append(env, fmt.Sprintf("SHUFFLE_APP_SDK_TIMEOUT=%s", os.Getenv("SHUFFLE_APP_SDK_TIMEOUT")))
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

func getStreamResultsWrapper(client *http.Client, req *http.Request, workflowExecution shuffle.WorkflowExecution, firstRequest bool, environments []string) ([]string, error) {
	// Because of this, it always has updated data.
	// Removed request requirement from app_sdk
	newresp, err := topClient.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed request: %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return environments, err
	}

	defer newresp.Body.Close()
	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading body: %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return environments, err
	}

	if newresp.StatusCode != 200 {
		log.Printf("[ERROR] %sStatusCode (1): %d", string(body), newresp.StatusCode)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return environments, errors.New(fmt.Sprintf("Bad status code: %d", newresp.StatusCode))
	}

	err = json.Unmarshal(body, &workflowExecution)
	if err != nil {
		log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
		time.Sleep(time.Duration(sleepTime) * time.Second)
		return environments, err
	}

	if firstRequest {
		firstRequest = false

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
		childNodes := shuffle.FindChildNodes(workflowExecution.Workflow, workflowExecution.Start, []string{}, []string{})
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

		log.Printf("[DEBUG] Environments: %s. Source: %s. 1 env = webserver, 0 or >1 = default. Subflow exists: %#v", environments, workflowExecution.ExecutionSource, subflowFound)
		if len(environments) == 1 && workflowExecution.ExecutionSource != "default" && !subflowFound {
			log.Printf("[DEBUG] Running OPTIMIZED execution (not manual)")
			os.Setenv("SHUFFLE_OPTIMIZED", "true")
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

			log.Printf("[DEBUG] Running with port %#v", os.Getenv("WORKER_PORT"))

			runWebserver(listener)

			// Set environment variable

			//log.Printf("Before wait")
			//wg := sync.WaitGroup{}
			//wg.Add(1)
			//wg.Wait()
		} else {
			log.Printf("[DEBUG] Running NON-OPTIMIZED execution for type %s with %d environment(s). This only happens when ran manually OR when running with subflows. Status: %s", workflowExecution.ExecutionSource, len(environments), workflowExecution.Status)
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
		log.Printf("[DEBUG] Workflow %s has status %s. Exiting worker (if WAITING, rerun will happen).", workflowExecution.ExecutionId, workflowExecution.Status)
		log.Printf("[DEBUG] Shutting down (33)")
		shutdown(workflowExecution, workflowExecution.Workflow.ID, "", true)
	}

	time.Sleep(time.Duration(sleepTime) * time.Second)
	return environments, nil
}

// Initial loop etc
func main() {
	/*** STARTREMOVE ***/
	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		logsDisabled = "true"
	}
	/*** ENDREMOVE ***/
	// Elasticsearch necessary to ensure we'ren ot running with Datastore configurations for minimal/maximal data sizes
	// Recursive import kind of :)
	_, err := shuffle.RunInit(*shuffle.GetDatastore(), *shuffle.GetStorage(), "", "worker", true, "elasticsearch", false, 0)
	if err != nil {
		if !strings.Contains(fmt.Sprintf("%s", err), "no such host") {
			log.Printf("[ERROR] Failed to run worker init: %s", err)
		}
	} else {
		if isKubernetes != "true" {
			log.Printf("[DEBUG] Ran init for worker to set up cache system. Docker version: %s", dockerApiVersion)
		} else {
			log.Printf("[DEBUG] Ran init for worker to set up cache system on Kubernetes")
		}
	}

	log.Printf("[INFO] Setting up worker environment")
	sleepTime = 5
	client := shuffle.GetExternalClient(baseUrl)

	if timezone == "" {
		timezone = "Europe/Amsterdam"
	}

	if baseimagename == "" {
		log.Printf("[DEBUG] Setting baseimagename")
		baseimagename = "frikky/shuffle" // Dockerhub
		//baseimagename = "shuffle"        // Github 		(ghcr.io)
	}

	topClient = client
	swarmConfig := os.Getenv("SHUFFLE_SWARM_CONFIG")
	log.Printf("[INFO] Running with timezone %s and swarm config %#v", timezone, swarmConfig)

	/*** STARTREMOVE ***/
	if swarmConfig == "run" || swarmConfig == "swarm" {
		// Forcing download just in case on the first iteration.
		log.Printf("[INFO] Running in swarm mode - forcing download of apps")
		workflowExecution := shuffle.WorkflowExecution{}

		go baseDeploy()

		listener := webserverSetup(workflowExecution)
		runWebserver(listener)

		// Should never get down here
		log.Printf("[ERROR] Stopped listener %#v - exiting.", listener)
		os.Exit(3)
	}
	/*** ENDREMOVE ***/

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

	firstRequest := true
	environments := []string{}
	for {
		environments, err = getStreamResultsWrapper(client, req, workflowExecution, firstRequest, environments)
		if err != nil {
			log.Printf("[ERROR] Failed getting stream results: %s", err)
		}
	}
}

func checkUnfinished(resp http.ResponseWriter, request *http.Request, execRequest shuffle.OrborusExecutionRequest) {
	// Meant as a function that periodically checks whether previous executions have finished or not.
	// Should probably be based on executedIds and finishedIds
	// Schedule a check in the future instead?

	ctx := context.Background()
	exec, err := shuffle.GetWorkflowExecution(ctx, execRequest.ExecutionId)
	log.Printf("[DEBUG][%s] Rechecking execution and it's status to send to backend IF the status is EXECUTING (%s - %d/%d finished)", execRequest.ExecutionId, exec.Status, len(exec.Results), len(exec.Workflow.Actions))

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
	defer request.Body.Close()
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] Failed reading body for stream result queue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

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
	ctx := context.Background()

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

	var workflowExecution shuffle.WorkflowExecution
	streamResultUrl := fmt.Sprintf("%s/api/v1/streams/results", baseUrl)
	req, err := http.NewRequest(
		"POST",
		streamResultUrl,
		bytes.NewBuffer([]byte(fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, execRequest.ExecutionId, execRequest.Authorization))),
	)
	if err != nil {
		log.Printf("[ERROR][%s] Failed to create a new request", execRequest.ExecutionId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	client := shuffle.GetExternalClient(streamResultUrl)
	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed making request (2): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	defer newresp.Body.Close()
	body, err = ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR][%s] Failed reading body (2): %s", execRequest.ExecutionId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	if newresp.StatusCode != 200 {
		log.Printf("[ERROR][%s] Bad statuscode: %d, %s", execRequest.ExecutionId, newresp.StatusCode, string(body))

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

	//err = shuffle.SetWorkflowExecution(ctx, workflowExecution, true)
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

	log.Printf("[INFO][%s] (1) Status: %s, Results: %d, actions: %d", workflowExecution.ExecutionId, workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)

	if workflowExecution.Status != "EXECUTING" {
		log.Printf("[WARNING] Exiting as worker execution has status %s!", workflowExecution.Status)
		log.Printf("[DEBUG] Shutting down (38)")
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
		err = shuffle.SetCache(ctx, cacheKey, execData, 31)
		if err != nil {
			log.Printf("[ERROR][%s] Failed adding to cache during setexecution (3): %s", workflowExecution.ExecutionId, err)
		}
	}

	err = executionInit(workflowExecution)
	if err != nil {
		log.Printf("[DEBUG][%s] Shutting down (30) - Workflow setup failed: %s", workflowExecution.ExecutionId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Error in execution init: %s"}`, err)))
		return
		//shutdown(workflowExecution, "", "", true)
	}

	handleExecutionResult(workflowExecution)
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func handleDownloadImage(resp http.ResponseWriter, request *http.Request) {
	// Read the request body
	defer request.Body.Close()
	bodyBytes, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[ERROR] Failed reading body for stream result queue. Error: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// get images from request
	image := &ImageDownloadBody{}
	err = json.Unmarshal(bodyBytes, image)
	if err != nil {
		log.Printf("[ERROR] Error in unmarshalling body: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	client, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client (4): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	defer client.Close()

	// check if images are already downloaded
	// Retrieve a list of Docker images
	images, err := client.ImageList(context.Background(), types.ImageListOptions{})
	if err != nil {
		log.Printf("[ERROR] listing images: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	for _, img := range images {
		for _, tag := range img.RepoTags {
			splitTag := strings.Split(tag, ":")
			baseTag := tag
			if len(splitTag) > 1 {
				baseTag = splitTag[1]
			}

			var possibleNames []string
			possibleNames = append(possibleNames, fmt.Sprintf("frikky/shuffle:%s", baseTag))
			possibleNames = append(possibleNames, fmt.Sprintf("registry.hub.docker.com/frikky/shuffle:%s", baseTag))

			if arrayContains(possibleNames, image.Image) {
				log.Printf("[DEBUG] Image %s already downloaded that has been requested to download", image.Image)
				resp.WriteHeader(200)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "image already present"}`)))
				return
			}
		}
	}

	log.Printf("[INFO] Downloading image %s", image.Image)
	shuffle.DownloadDockerImageBackend(&http.Client{Timeout: imagedownloadTimeout}, image.Image)

	// return success
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "status": "starting download"}`)))
}

func runWebserver(listener net.Listener) {
	r := mux.NewRouter()
	r.HandleFunc("/api/v1/streams", handleWorkflowQueue).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/streams/results", handleGetStreamResults).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/download", handleDownloadImage).Methods("POST", "OPTIONS")

	// Synonyms. Require an execution ID + auth + shuffle backend
	r.HandleFunc("/api/v1/execute", handleRunExecution).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/run", handleRunExecution).Methods("POST", "OPTIONS")

	// What would be require to run a workflow otherwise?
	// Maybe directly /workflow/run

	/*** STARTREMOVE ***/
	if os.Getenv("SHUFFLE_SWARM_CONFIG") == "run" || os.Getenv("SHUFFLE_SWARM_CONFIG") == "swarm" {
		log.Printf("[DEBUG] Running webserver config for SWARM and K8s")
	}
	/*** ENDREMOVE ***/

	if strings.ToLower(os.Getenv("SHUFFLE_DEBUG_MEMORY")) == "true" {
		r.HandleFunc("/debug/pprof/", pprof.Index)
		r.HandleFunc("/debug/pprof/heap", pprof.Handler("heap").ServeHTTP)
		r.HandleFunc("/debug/pprof/profile", pprof.Profile)
		r.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
		r.HandleFunc("/debug/pprof/trace", pprof.Trace)
	}

	//log.Fatal(http.ListenAndServe(port, nil))
	//srv := http.Server{
	//	Addr:         ":8888",
	//	WriteTimeout: 1 * time.Second,
	//	Handler:      http.HandlerFunc(slowHandler),
	//}

	//log.Fatal(http.Serve(listener, nil))

	log.Printf("[DEBUG] NEW webserver setup")

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
		log.Printf("[ERROR] Serve issue in worker: %#v", err)
	}
}
