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
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	dockerclient "github.com/docker/docker/client"

	//gyaml "github.com/ghodss/yaml"

	"github.com/h2non/filetype"
	uuid "github.com/satori/go.uuid"

	newscheduler "github.com/carlescere/scheduler"
	"github.com/frikky/kin-openapi/openapi3"
	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/storage/memory"
	http2 "gopkg.in/src-d/go-git.v4/plumbing/transport/http"

	//"github.com/gorilla/websocket"
	//"google.golang.org/appengine"
	//"google.golang.org/appengine/memcache"
	//"cloud.google.com/go/firestore"
	// "google.golang.org/api/option"
	gyaml "github.com/ghodss/yaml"
)

var localBase = "http://localhost:5001"
var baseEnvironment = "onprem"

var cloudname = "cloud"

var scheduledJobs = map[string]*newscheduler.Job{}
var scheduledOrgs = map[string]*newscheduler.Job{}

// Frequency = cronjob OR minutes between execution
func createSchedule(ctx context.Context, scheduleId, workflowId, name, startNode, frequency, orgId string, body []byte) error {
	var err error
	testSplit := strings.Split(frequency, "*")
	cronJob := ""
	newfrequency := 0

	if len(testSplit) > 5 {
		cronJob = frequency
	} else {
		newfrequency, err = strconv.Atoi(frequency)
		if err != nil {
			log.Printf("Failed to parse time: %s", err)
			return err
		}

		//if int(newfrequency) < 60 {
		//	cronJob = fmt.Sprintf("*/%s * * * *")
		//} else if int(newfrequency) <
	}

	// Reverse. Can't handle CRON, only numbers
	if len(cronJob) > 0 {
		return errors.New("cronJob isn't formatted correctly")
	}

	if newfrequency < 1 {
		return errors.New("Frequency has to be more than 0")
	}

	//log.Printf("CRON: %s, body: %s", cronJob, string(body))

	// FIXME:
	// This may run multiple places if multiple servers,
	// but that's a future problem
	//log.Printf("BODY: %s", string(body))
	parsedArgument := strings.Replace(string(body), "\"", "\\\"", -1)
	bodyWrapper := fmt.Sprintf(`{"start": "%s", "execution_source": "schedule", "execution_argument": "%s"}`, startNode, parsedArgument)
	log.Printf("[INFO] Body for schedule %s in workflow %s: \n%s", scheduleId, workflowId, bodyWrapper)
	job := func() {
		request := &http.Request{
			URL:    &url.URL{},
			Method: "POST",
			Body:   ioutil.NopCloser(strings.NewReader(bodyWrapper)),
		}

		_, _, err := handleExecution(workflowId, shuffle.Workflow{ExecutingOrg: shuffle.OrgMini{Id: orgId}}, request, orgId)
		if err != nil {
			log.Printf("Failed to execute %s: %s", workflowId, err)
		}
	}

	log.Printf("[INFO] Starting frequency for execution: %d", newfrequency)

	//jobret, err := newscheduler.Every(newfrequency).Seconds().NotImmediately().Run(job)
	jobret, err := newscheduler.Every(newfrequency).Seconds().Run(job)
	if err != nil {
		log.Printf("Failed to schedule workflow: %s", err)
		return err
	}

	//scheduledJobs = append(scheduledJobs, jobret)
	scheduledJobs[scheduleId] = jobret

	// Doesn't need running/not running. If stopped, we just delete it.
	timeNow := int64(time.Now().Unix())
	schedule := shuffle.ScheduleOld{
		Id:                   scheduleId,
		WorkflowId:           workflowId,
		StartNode:            startNode,
		Argument:             string(body),
		WrappedArgument:      bodyWrapper,
		Seconds:              newfrequency,
		CreationTime:         timeNow,
		LastModificationtime: timeNow,
		LastRuntime:          timeNow,
		Org:                  orgId,
		Environment:          "onprem",
	}

	err = shuffle.SetSchedule(ctx, schedule)
	if err != nil {
		log.Printf("Failed to set schedule: %s", err)
		return err
	}

	// FIXME - Create a real schedule based on cron:
	// 1. Parse the cron in a function to match this schedule
	// 2. Make main init check for schedules that aren't running

	return nil
}

func handleGetWorkflowqueueConfirm(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// FIXME: Add authentication?
	// Cloud has auth.
	id := request.Header.Get("Org-Id")
	if len(id) == 0 {
		log.Printf("[ERROR] No Org-Id header set - confirm")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Specify the org-id header."}`)))
		return
	}

	//setWorkflowqueuetest(id)
	ctx := context.Background()
	executionRequests, err := shuffle.GetWorkflowQueue(ctx, id, 100)
	if err != nil {
		log.Printf("[WARNING] (1) Failed reading body for workflowqueue: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Entity parsing error - confirm"}`)))
		return
	}

	if len(executionRequests.Data) == 0 {
		log.Printf("[INFO] No requests to handle from queue")
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Nothing in queue"}`)))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("[WARNING] Failed reading body for stream result queue")
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// Getting from the request
	//log.Println(string(body))
	var removeExecutionRequests shuffle.ExecutionRequestWrapper
	err = json.Unmarshal(body, &removeExecutionRequests)
	if err != nil {
		log.Printf("[WARNING] Failed executionrequest in queue unmarshaling: %s", err)
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	if len(removeExecutionRequests.Data) == 0 {
		log.Printf("[WARNING] No requests to fix remove from DB")
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Queue removal error"}`)))
		return
	}

	// remove items from DB
	parsedId := fmt.Sprintf("workflowqueue-%s", id)
	ids := []string{}
	for _, execution := range removeExecutionRequests.Data {
		ids = append(ids, execution.ExecutionId)
	}

	err = shuffle.DeleteKeys(ctx, parsedId, ids)
	if err != nil {
		log.Printf("[ERROR] Failed deleting %d execution keys for org %s: %s", len(ids), id, err)
	} else {
		//log.Printf("[INFO] Deleted %d keys from org %s", len(ids), parsedId)
	}

	//var newExecutionRequests ExecutionRequestWrapper
	//for _, execution := range executionRequests.Data {
	//	found := false
	//	for _, removeExecution := range removeExecutionRequests.Data {
	//		if removeExecution.ExecutionId == execution.ExecutionId && removeExecution.WorkflowId == execution.WorkflowId {
	//			found = true
	//			break
	//		}
	//	}

	//	if !found {
	//		newExecutionRequests.Data = append(newExecutionRequests.Data, execution)
	//	}
	//}

	// Push only the remaining to the DB (remove)
	//if len(executionRequests.Data) != len(newExecutionRequests.Data) {
	//	err := shuffle.SetWorkflowQueue(ctx, newExecutionRequests, id)
	//	if err != nil {
	//		log.Printf("Fail: %s", err)
	//	}
	//}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

// FIXME: Authenticate this one? Can org ID be auth enough?
// (especially since we have a default: shuffle)
func handleGetWorkflowqueue(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// This is really the environment's name - NOT org-id
	orgId := request.Header.Get("Org-Id")
	if len(orgId) == 0 {
		log.Printf("[AUDIT] No org-id header set")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Specify the org-id header."}`)))
		return
	}

	environment := request.Header.Get("org")
	if len(environment) == 0 {
		//log.Printf("[AUDIT] No 'org' header set (get workflow queue). ")
		/*
			resp.WriteHeader(403)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Specify the org header. This can be done by setting the 'ORG' environment variable for Orborus to your Org ID in Shuffle"}`)))
			return
		*/
	}

	orborusLabel := request.Header.Get("x-orborus-label")

	// This section is cloud custom for now
	auth := request.Header.Get("Authorization")
	if len(auth) == 0 {
		//log.Printf("[AUDIT] No Authorization header set. Env: %s, org: %s", orgId, environment)
		/*
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Specify the auth header (only applicable for cloud for now)."}`)))
			return
		*/
	}

	//log.Printf("[AUDIT] Get workflow queue for org %s, env %s, orborus label %s", orgId, environment, orborusLabel)

	ctx := shuffle.GetContext(request)
	env, err := shuffle.GetEnvironment(ctx, orgId, "")
	timeNow := time.Now().Unix()
	if err == nil && len(env.Id) > 0 && len(env.Name) > 0 && request.Method == "POST" { 
		// Updates every 60 seconds~
		if time.Now().Unix() > env.Edited+60 {
			env.RunningIp = shuffle.GetRequestIp(request)

			// Orborus label = custom label for Orborus
			if len(orborusLabel) > 0 {
				env.RunningIp = orborusLabel
			}

			// Set the checkin cache


			body, err := ioutil.ReadAll(request.Body)
			if err == nil {
				var envData shuffle.OrborusStats
				err = json.Unmarshal(body, &envData)
				if err == nil {
					envData.RunningIp = env.RunningIp

					marshalled, err := json.Marshal(envData)
					if err == nil {
						cacheKey := fmt.Sprintf("queueconfig-%s-%s", env.Name, env.OrgId)
						go shuffle.SetCache(context.Background(), cacheKey, marshalled, 2)
					}



					if envData.Swarm {
						env.Licensed = true
						env.RunType = "docker"
					} 

					if envData.Kubernetes {
						env.RunType = "k8s"
					}

					envData.DataLake = env.DataLake
				}
			}

			env.Checkin = timeNow
			err = shuffle.SetEnvironment(ctx, env)
			if err != nil {
				log.Printf("[ERROR] Failed updating environment: %s", err)
			}
		}
	}

	//log.Printf("Found env: %#v", env)
	if len(env.OrgId) > 0 {
		environment = env.OrgId
	}

	// FIXME: Workflow stats disabled for now
	// as it caused too many problems
	// goal: track docker stuff once a minute and graph it
	// For now: Disable this as it caused too many problems
	if request.Method == "POST" && true == false {
		//log.Printf("[DEBUG] POST to workflowqueue")
		if rand.Intn(10) == 0 {
			// Parse out body
			body, err := ioutil.ReadAll(request.Body)
			if err == nil {

				// Parse out CPU, memory and disk.

				var envData shuffle.OrborusStats
				err = json.Unmarshal(body, &envData)
				if err == nil && !envData.Swarm && !envData.Kubernetes && (envData.CPU > 0 || envData.Memory > 0 || envData.Disk > 0) {

					// Set the input in memory
					envData.OrgId = orgId
					envData.Environment = environment
					envData.OrborusLabel = orborusLabel
					envData.Timestamp = time.Now().Unix()

					if envData.CPU > 0 && envData.MaxCPU > 0 {
						envData.CPUPercent = float64(envData.CPU) / float64(envData.MaxCPU)
					}

					if envData.Memory > 0 && envData.MaxMemory > 0 {
						envData.MemoryPercent = float64(envData.Memory) / float64(envData.MaxMemory)
					}

					// Check if CPU percent constantly has stayed above X% for the last Y requests
					percentageCheck := 90
					concurrentChecks := 2

					//if int(envData.CPUPercent) > percentageCheck {
					// Get cached data
					percentages := []float64{}
					cacheKey := fmt.Sprintf("%s_%s_percent", orgId, strings.ToLower(environment))

					// Marshal float list into []byte
					cacheData := []byte{}
					cache, err := shuffle.GetCache(ctx, cacheKey)
					if err == nil {
						// Unmarshal into percentages
						cacheData := []byte(cache.([]uint8))
						err = json.Unmarshal(cacheData, &percentages)
						if err != nil {
							log.Printf("[INFO] error in cache unmarshal for percentages: %s", err)
						}

						if len(percentages) > concurrentChecks {
							percentages = percentages[:concurrentChecks]
						}

						percentages = append(percentages, envData.CPUPercent)
						if len(percentages) > concurrentChecks {
							//log.Printf("[INFO] Checking percentages: %v", percentages)

							// percentageCheck := 1
							sendAlert := true
							for _, p := range percentages {
								if int(p) < percentageCheck {
									//log.Printf("[AUDIT] CPU percent is below %d: %d", percentageCheck, int(p))
									sendAlert = false
									break
								}
							}

							if sendAlert {
								log.Printf("[INFO] CPU percent has been above %d percent for the last 5 requests. Sending alert. Env: %s, org: %s", percentageCheck, environment, orgId)

								// Set notification + alert for organization
								err = shuffle.CreateOrgNotification(
									ctx,
									fmt.Sprintf("CPU percent has been above %d percent", percentageCheck),
									fmt.Sprintf("A environment %s has been using more than %d\\% CPU for the last 5 requests.", environment, percentageCheck),
									fmt.Sprintf("/admin?tab=environments"),
									environment,
									true,
								)

								if err != nil {
									log.Printf("[ERROR] error creating notification: %s", err)
								}

								org, err := shuffle.GetOrg(ctx, environment)
								if err == nil {
									foundRecommendation := false
									for _, recommendation := range org.Priorities {
										if strings.Contains(recommendation.Name, "CPU") {
											foundRecommendation = true
											break
										}
									}

									if !foundRecommendation {
										// Add to start of org.Priorities
										org, _ = shuffle.AddPriority(*org, shuffle.Priority{
											Name:        fmt.Sprintf("High CPU in environment %s", orgId),
											Description: fmt.Sprintf("The environment %s has been using more than %d percent CPU. This indicates you may need to look at scaling.", orgId, percentageCheck),
											Type:        "scale",
											Active:      true,
											URL:         fmt.Sprintf("/admin?tab=environments"),
											Severity:    1,
										}, false)

										//Make last item the first item
										org.Priorities = append([]shuffle.Priority{org.Priorities[len(org.Priorities)-1]}, org.Priorities[:len(org.Priorities)-1]...)
										err = shuffle.SetOrg(ctx, *org, org.Id)
										if err != nil {
											log.Printf("[ERROR] Problem setting org: %s", err)
										}
									}
								}
							}

							if len(percentages) > 1 {
								percentages = percentages[1:]
							}
						}

						// Marshal float list into []byte
					} else {
						//log.Printf("[ERROR] Failed getting cache: %s", err)
						percentages = append(percentages, envData.CPUPercent)
					}

					if len(percentages) > 0 {
						//log.Printf("[DEBUG] Setting cache for %s: %#v", cacheKey, percentages)
						cacheData, err = json.Marshal(percentages)
						if err != nil {
							log.Printf("[INFO] error in cache marshal: %s", err)
						}

						// Add the new data
						go shuffle.SetCache(ctx, cacheKey, cacheData, 5)
					}
				}

				//log.Printf("CPU percent: %f", envData.CPUPercent)
				//log.Printf("Memory percent: %f", envData.MemoryPercent*100)

				go shuffle.SetenvStats(ctx, envData)
			}
		}
	}

	executionRequests, err := shuffle.GetWorkflowQueue(ctx, orgId, 100)
	if err != nil {
		// Skipping as this comes up over and over
		//log.Printf("(2) Failed reading body for workflowqueue: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// Checking and updating the environment related to the first execution
	if len(executionRequests.Data) == 0 {
		executionRequests.Data = []shuffle.ExecutionRequest{}
	} else {
		//log.Printf("In workflowqueue with %d", len(executionRequests.Data))

		// Try again :)
		if len(env.Id) == 0 && len(env.Name) == 0 {
			foundId := ""
			for _, requestData := range executionRequests.Data {
				execution, err := shuffle.GetWorkflowExecution(ctx, requestData.ExecutionId)
				if err == nil {
					if len(execution.ExecutionOrg) > 0 {
						foundId = execution.ExecutionOrg
						break
					}
				}
			}

			if len(orgId) > 0 {
				env, err := shuffle.GetEnvironment(ctx, orgId, foundId)
				if err != nil {
					log.Printf("[WARNING] No env found matching %s - continuing without updating orborus anyway: %s", orgId, err)
					//resp.WriteHeader(401)
					//resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "No env found matching %s"}`, id)))
					//return
				} else {
					if timeNow > env.Edited+60 {
						env.RunningIp = request.RemoteAddr
						env.Checkin = timeNow
						err = shuffle.SetEnvironment(ctx, env)
						if err != nil {
							log.Printf("[WARNING] Failed updating environment: %s", err)
						}
					}
				}
			}
		}

		if len(executionRequests.Data) > 50 {
			executionRequests.Data = executionRequests.Data[0:49]
		}
	}

	newjson, err := json.Marshal(executionRequests)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking workflow execution"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newjson)
}

func handleGetStreamResults(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	if request.Body == nil {
		resp.WriteHeader(http.StatusBadRequest)
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body for stream result queue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	//log.Printf("Data: %s", string(body))
	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("[WARNING] Failed ActionResult unmarshaling (stream result): %s", err)
		//resp.WriteHeader(401)
		//resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		//return
	}

	if len(actionResult.ExecutionId) == 0 {
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Provide execution_id and authorization"}`)))
		return
	}

	ctx := context.Background()
	workflowExecution, err := shuffle.GetWorkflowExecution(ctx, actionResult.ExecutionId)
	if err != nil || workflowExecution.ExecutionId != actionResult.ExecutionId {
		if len(actionResult.ExecutionId) > 0 {
			log.Printf("[WARNING][%s] Failed getting execution (streamresult): %s", actionResult.ExecutionId, err)
		}

		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key or execution_id might not exist."}`)))
		return
	}

	// Authorization is done here
	if workflowExecution.Authorization != actionResult.Authorization {
		user, err := shuffle.HandleApiAuthentication(resp, request)
		if err != nil {
			log.Printf("[WARNING] Api authentication failed in exec grabbing workflow: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key or execution_id might not exist."}`)))
			return
		}

		if len(workflowExecution.ExecutionOrg) > 0 && user.ActiveOrg.Id == workflowExecution.ExecutionOrg && user.Role == "admin" {
			//log.Printf("[DEBUG] User %s is in correct org. Allowing org continuation for execution!", user.Username)
		} else {
			log.Printf("[WARNING] Bad authorization key when getting stream results %s.", actionResult.ExecutionId)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key or execution_id might not exist."}`)))
			return
		}
	}

	for _, action := range workflowExecution.Workflow.Actions {
		found := false
		for _, result := range workflowExecution.Results {
			if result.Action.ID == action.ID {
				found = true
				break
			}
		}

		if found {
			continue
		}

		//log.Printf("[DEBUG] Maybe not handled yet: %s", action.ID)
		cacheId := fmt.Sprintf("%s_%s_result", workflowExecution.ExecutionId, action.ID)
		cache, err := shuffle.GetCache(ctx, cacheId)
		if err != nil {
			//log.Printf("[WARNING] Couldn't find in fix exec %s (2): %s", cacheId, err)
			continue
		}

		actionResult := shuffle.ActionResult{}
		cacheData := []byte(cache.([]uint8))

		// Just ensuring the data is good
		err = json.Unmarshal(cacheData, &actionResult)
		if err != nil {
			continue
		} else {
			log.Printf("[DEBUG] APPENDING %s result to send to app or something\n\n\n\n", action.ID)
			workflowExecution.Results = append(workflowExecution.Results, actionResult)
		}
	}

	if workflowExecution.Workflow.Sharing == "form" {
		newWorkflow := shuffle.Workflow{
			Name:           workflowExecution.Workflow.Name,
			ID:			 	workflowExecution.Workflow.ID,
			Owner:          workflowExecution.Workflow.Owner,
			OrgId:          workflowExecution.Workflow.OrgId,

			Sharing: 		workflowExecution.Workflow.Sharing,
			Description:    workflowExecution.Workflow.Description,
			InputQuestions: workflowExecution.Workflow.InputQuestions,

			FormControl:	workflowExecution.Workflow.FormControl,
		}

		workflowExecution.Results = []shuffle.ActionResult{}
		workflowExecution.Workflow = newWorkflow
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

func handleWorkflowQueue(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	if request.Body == nil {
		resp.WriteHeader(http.StatusBadRequest)
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("[WARNING] (3) Failed reading body for workflowqueue")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	//log.Printf("Actionresult unmarshal: %s", string(body))
	//log.Printf("[DEBUG] Got workflow result from %s of length %d", request.RemoteAddr, len(body))
	ctx := context.Background()
	err = shuffle.ValidateNewWorkerExecution(ctx, body)
	if err == nil {
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "success"}`)))
		return
	} else {
		log.Printf("[DEBUG] Handling other execution variant (subflow?): %s", err)
	}

	//log.Printf("[DEBUG] Got workflow result from %s of length %d.", request.RemoteAddr, len(body))

	var actionResult shuffle.ActionResult
	err = json.Unmarshal(body, &actionResult)
	if err != nil {
		log.Printf("[WARNING] Failed ActionResult unmarshaling (queue): %s", err)
		//resp.WriteHeader(401)
		//resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		//return
	}

	//log.Printf("Received action: %#v", actionResult)

	// 1. Get the WorkflowExecution(ExecutionId) from the database
	// 2. if ActionResult.Authentication != WorkflowExecution.Authentication -> exit
	// 3. Add to and update actionResult in workflowExecution
	// 4. Push to db
	// IF FAIL: Set executionstatus: abort or cancel

	workflowExecution, err := shuffle.GetWorkflowExecution(ctx, actionResult.ExecutionId)
	if err != nil {
		log.Printf("[ERROR] Failed getting execution (workflowqueue) %s: %s", actionResult.ExecutionId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution ID %s because it doesn't exist."}`, actionResult.ExecutionId)))
		return
	}

	if workflowExecution.Authorization != actionResult.Authorization {
		log.Printf("[INFO] Bad authorization key when updating node (workflowQueue) %s. Want: %s, Have: %s", actionResult.ExecutionId, workflowExecution.Authorization, actionResult.Authorization)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad authorization key"}`)))
		return
	}

	//if workflowExecution.Status == "FINISHED" {
	//	log.Printf("[INFO] Workflowexecution is already FINISHED. No further action can be taken.")
	//	resp.WriteHeader(401)
	//	resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is already finished because of %s with status %s"}`, workflowExecution.LastNode, workflowExecution.Status)))
	//	return
	//}

	if workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {

		if workflowExecution.Workflow.Configuration.ExitOnError {
			log.Printf("Workflowexecution already has status %s. No further action can be taken", workflowExecution.Status)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflowexecution is aborted because of %s with result %s and status %s"}`, workflowExecution.LastNode, workflowExecution.Result, workflowExecution.Status)))
			return
		} else {
			log.Printf("[WARNING] Continuing workflow even though it's aborted (ExitOnError config)")
		}
	}

	runWorkflowExecutionTransaction(ctx, 0, workflowExecution.ExecutionId, actionResult, resp)
}

// Will make sure transactions are always ran for an execution. This is recursive if it fails. Allowed to fail up to 5 times
func runWorkflowExecutionTransaction(ctx context.Context, attempts int64, workflowExecutionId string, actionResult shuffle.ActionResult, resp http.ResponseWriter) {
	log.Printf("[DEBUG][%s] Running workflow execution update with result from %s (%s) of status %s", workflowExecutionId, actionResult.Action.Label, actionResult.Action.ID, actionResult.Status)

	// Should start a tx for the execution here
	workflowExecution, err := shuffle.GetWorkflowExecution(ctx, workflowExecutionId)
	if err != nil {
		log.Printf("[ERROR] Failed getting execution cache: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution"}`)))
		return
	}

	//log.Printf("BASE LENGTH: %d", len(workflowExecution.Results))
	workflowExecution, dbSave, err := shuffle.ParsedExecutionResult(ctx, *workflowExecution, actionResult, false, 0)
	if err != nil {
		b, suberr := json.Marshal(actionResult)
		if suberr != nil {
			log.Printf("[ERROR] Failed running of parsedexecution: %s", err)
		} else {
			log.Printf("[ERROR] Failed running of parsedexecution: %s. Data: %s", err, string(b))
		}

		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed updating execution"}`)))
		return
	}

	_ = dbSave
	//resultLength := len(workflowExecution.Results)
	setExecution := true
	if setExecution || workflowExecution.Status == "FINISHED" || workflowExecution.Status == "ABORTED" || workflowExecution.Status == "FAILURE" {
		err = shuffle.SetWorkflowExecution(ctx, *workflowExecution, true)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed setting workflowexecution actionresult: %s"}`, err)))
			return
		}
		//handleExecutionResult(ctx, *workflowExecution)
	} else {
		log.Printf("Skipping setexec with status %s", workflowExecution.Status)
	}

	if resp != nil {
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
	}

}

func JSONCheck(str string) bool {
	var jsonStr interface{}
	return json.Unmarshal([]byte(str), &jsonStr) == nil
}

func handleExecutionStatistics(execution shuffle.WorkflowExecution) {
	// FIXME: CLEAN UP THE JSON THAT'S SAVED.
	// https://github.com/shuffle/Shuffle/issues/172
	appResults := []shuffle.AppExecutionExample{}
	for _, result := range execution.Results {
		resultCheck := JSONCheck(result.Result)
		if !resultCheck {
			//log.Printf("Result is NOT JSON!")
			continue
		} else {
			//log.Printf("Result IS JSON!")

		}

		appFound := false
		executionIndex := 0
		for index, appExample := range appResults {
			if appExample.AppId == result.Action.ID {
				appFound = true
				executionIndex = index
				break
			}
		}

		if appFound {
			// Append to SuccessExamples or FailureExamples
			if result.Status == "ABORTED" || result.Status == "FAILURE" {
				appResults[executionIndex].FailureExamples = append(appResults[executionIndex].FailureExamples, result.Result)
			} else if result.Status == "FINISHED" || result.Status == "SUCCESS" {
				appResults[executionIndex].SuccessExamples = append(appResults[executionIndex].SuccessExamples, result.Result)
			} else {
				log.Printf("[ERROR] Can't handle status %s", result.Status)
			}

			// appResults = append(appResults, executionExample)

		} else {
			// CREATE SuccessExamples or FailureExamples
			executionExample := shuffle.AppExecutionExample{
				AppName:    result.Action.AppName,
				AppVersion: result.Action.AppVersion,
				AppAction:  result.Action.Name,
				AppId:      result.Action.AppID,
				ExampleId:  fmt.Sprintf("%s_%s", execution.ExecutionId, result.Action.AppID),
			}

			if result.Status == "ABORTED" || result.Status == "FAILURE" {
				executionExample.FailureExamples = append(executionExample.FailureExamples, result.Result)
			} else if result.Status == "FINISHED" || result.Status == "SUCCESS" {
				executionExample.SuccessExamples = append(executionExample.SuccessExamples, result.Result)
			} else {
				log.Printf("[ERROR] Can't handle status %s", result.Status)
			}

			appResults = append(appResults, executionExample)
		}
	}

	// ExampleId string `json:"example_id"`
	// func setExampleresult(ctx context.Context, result exampleResult) error {
	// log.Printf("Execution length: %d", len(appResults))
	if len(appResults) > 0 {
		ctx := context.Background()
		successful := 0
		for _, exampleresult := range appResults {
			err := setExampleresult(ctx, exampleresult)
			if err != nil {
				log.Printf("[ERROR] Failed setting examplresult %s: %s", exampleresult.ExampleId, err)
			} else {
				successful += 1
			}
		}

		log.Printf("[INFO] Added %d exampleresults to backend", successful)
	} else {
		//log.Printf("[INFO] No example results necessary to be added for execution %s", execution.ExecutionId)
	}
}

func deleteWorkflow(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[WARNING] Api authentication failed in delete workflow: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to stop schedule: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Workflow ID to delete is not valid"}`))
		return
	}

	ctx := context.Background()
	workflow, err := shuffle.GetWorkflow(ctx, fileId)
	if err != nil {
		log.Printf("[WARNING] Failed getting workflow %s locally (delete workflow): %s", fileId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if len(workflow.ParentWorkflowId) > 0 {
		resp.WriteHeader(403)
		resp.Write([]byte(`{"success": false, "reason": "Can't delete a workflow distributed from your parent org"}`))
		return
	}

	if user.Id != workflow.Owner || len(user.Id) == 0 {
		if workflow.OrgId == user.ActiveOrg.Id && user.Role == "admin" {
			log.Printf("[INFO] User %s is deleting workflow %s as admin. Owner: %s", user.Username, workflow.ID, workflow.Owner)
		} else {
			log.Printf("[WARNING] Wrong user (%s) for workflow %s (delete workflow)", user.Username, workflow.ID)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}
	}

	// Look for Child workflows and delete them
	if workflow.ParentWorkflowId == "" {
		log.Printf("[DEBUG] Looking for child workflows for workflow %s to delete. User %s (%s) in org %s (%s)", workflow.ID, user.Username, user.Id, user.ActiveOrg.Name, user.ActiveOrg.Id)

		childWorkflows, err := shuffle.ListChildWorkflows(ctx, workflow.ID)
		if err != nil {
			log.Printf("[ERROR] Failed to list child workflows: %s", err)
		} else { 
			log.Printf("\n\n[DEBUG] Found %d child workflows for workflow %s\n\n", len(childWorkflows), workflow.ID)

			// Find cookies and append them to request.Header to replicate current request as closely as possible
			for _, childWorkflow := range childWorkflows {
				if childWorkflow.ID == workflow.ID {
					continue
				}

				go shuffle.SendDeleteWorkflowRequest(childWorkflow, request)
			}
		}
	}

	// Clean up triggers and executions
	for _, item := range workflow.Triggers {
		if item.TriggerType == "SCHEDULE" && item.Status != "uninitialized" {
			err = deleteSchedule(ctx, item.ID)
			if err != nil {
				log.Printf("[DEBUG] Failed to delete schedule: %s - is it started?", err)
			}
		} else if item.TriggerType == "WEBHOOK" {
			//err = removeWebhookFunction(ctx, item.ID)
			//if err != nil {
			//	log.Printf("Failed to delete webhook: %s", err)
			//}
		} else if item.TriggerType == "EMAIL" {
			err = shuffle.HandleOutlookSubRemoval(ctx, user, workflow.ID, item.ID)
			if err != nil {
				log.Printf("[DEBUG] Failed to delete OUTLOOK email sub (checking gmail after): %s", err)
			}

			err = shuffle.HandleGmailSubRemoval(ctx, user, workflow.ID, item.ID)
			if err != nil {
				log.Printf("Failed to delete gmail email sub: %s", err)
			}
		}
	}

	log.Printf("[DEBUG] Attempting to delete the workflow %s from the database...", fileId)
	err = shuffle.DeleteKey(ctx, "workflow", fileId)
	if err != nil {
		log.Printf("[DEBUG] Failed deleting workflow key %s", fileId)
		resp.WriteHeader(400)
		resp.Write([]byte(`{"success": false, "reason": "Failed deleting key"}`))
		return
	}

	log.Printf("[INFO] Should have deleted workflow %s (%s)", workflow.Name, fileId)

	cacheKey := fmt.Sprintf("%s_workflows", user.Id)
	shuffle.DeleteCache(ctx, cacheKey)
	shuffle.DeleteCache(ctx, fmt.Sprintf("%s_workflows", user.ActiveOrg.Id))
	log.Printf("[DEBUG] Cleared workflow cache for %s (%s)", user.Username, user.Id)

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

func handleExecution(id string, workflow shuffle.Workflow, request *http.Request, orgId string) (shuffle.WorkflowExecution, string, error) {
	//go func() {
	//	log.Printf("\n\nPRE TIME: %s\n\n", time.Now().Format("2006-01-02 15:04:05"))
	//	_ = <-time.After(time.Second * 60)
	//	log.Printf("\n\nPOST TIME: %s\n\n", time.Now().Format("2006-01-02 15:04:05"))
	//}()

	ctx := context.Background()
	if workflow.ID == "" || workflow.ID != id {
		tmpworkflow, err := shuffle.GetWorkflow(ctx, id)
		if err != nil {
			//log.Printf("[WARNING] Failed getting the workflow locally (execution setup): %s", err)
			return shuffle.WorkflowExecution{}, "Failed getting workflow", err
		}

		workflow = *tmpworkflow
	}

	if len(workflow.Actions) == 0 {
		workflow.Actions = []shuffle.Action{}
	} else {
		newactions := []shuffle.Action{}
		for _, action := range workflow.Actions {
			action.LargeImage = ""
			action.SmallImage = ""
			newactions = append(newactions, action)
			//log.Printf("ACTION: %#v", action)
		}

		workflow.Actions = newactions
	}

	if len(workflow.Branches) == 0 {
		workflow.Branches = []shuffle.Branch{}
	}
	if len(workflow.Triggers) == 0 {
		workflow.Triggers = []shuffle.Trigger{}
	} else {
		newtriggers := []shuffle.Trigger{}
		for _, trigger := range workflow.Triggers {
			trigger.LargeImage = ""
			trigger.SmallImage = ""
			newtriggers = append(newtriggers, trigger)
			//log.Printf("ACTION: %#v", trigger)
		}

		workflow.Triggers = newtriggers
	}

	if len(workflow.Errors) == 0 {
		workflow.Errors = []string{}
	}

	if !workflow.IsValid {
		log.Printf("[ERROR] Stopped execution as workflow %s is not valid.", workflow.ID)
		return shuffle.WorkflowExecution{}, fmt.Sprintf(`workflow %s is invalid`, workflow.ID), errors.New("Failed getting workflow")
	}

	maxExecutionDepth := 10
	if os.Getenv("SHUFFLE_MAX_EXECUTION_DEPTH") != "" {
		maxExecutionDepthNew, err := strconv.Atoi(os.Getenv("SHUFFLE_MAX_EXECUTION_DEPTH"))
		if err == nil && maxExecutionDepthNew > 1 && maxExecutionDepthNew < 1000 {
			maxExecutionDepth = maxExecutionDepthNew
		}
	}

	workflowExecution, execInfo, _, workflowExecErr := shuffle.PrepareWorkflowExecution(ctx, workflow, request, int64(maxExecutionDepth))
	if workflowExecErr != nil {
		if len(workflowExecution.Workflow.Actions) > 0 && len(workflowExecution.Results) > 0 && len(workflowExecution.ExecutionId) > 0 { 
			err := shuffle.SetWorkflowExecution(ctx, workflowExecution, true)
			if err != nil {
				log.Printf("[ERROR] Failed setting workflow execution during init (2): %s", err)
			}
		}

		if strings.Contains(fmt.Sprintf("%s", workflowExecErr), "User Input") {
			// Special for user input callbacks
			// return workflowExecution, fmt.Sprintf("%s", err), nil
			//log.Printf("[INFO] User input callback: %s", workflowExecErr)
			return shuffle.WorkflowExecution{}, "", nil
		} else {
			log.Printf("[ERROR] Failed in prepareExecution: '%s'", workflowExecErr)
			return shuffle.WorkflowExecution{}, fmt.Sprintf("Failed running: %s", workflowExecErr), workflowExecErr 
		}
	}

	err := imageCheckBuilder(execInfo.ImageNames)
	if err != nil {
		log.Printf("[ERROR] Failed building the required images from %#v: %s", execInfo.ImageNames, err)
		return shuffle.WorkflowExecution{}, "Failed unmarshal during execution", err
	}

	/*
	makeNew := true
	start, startok := request.URL.Query()["start"]
	if request.Method == "POST" {
		body, err := ioutil.ReadAll(request.Body)
		if err != nil {
			log.Printf("[ERROR] Failed request POST read: %s", err)
			return shuffle.WorkflowExecution{}, "Failed getting body", err
		}

		// This one doesn't really matter.
		log.Printf("[INFO] Running POST execution with body of length %d for workflow %s", len(string(body)), workflowExecution.Workflow.ID)

		if len(body) >= 4 {
			if body[0] == 34 && body[len(body)-1] == 34 {
				body = body[1 : len(body)-1]
			}
			if body[0] == 34 && body[len(body)-1] == 34 {
				body = body[1 : len(body)-1]
			}
		}

		sourceAuth, sourceAuthOk := request.URL.Query()["source_auth"]
		if sourceAuthOk {
			//log.Printf("\n\n\nSETTING SOURCE WORKFLOW AUTH TO %s!!!\n\n\n", sourceAuth[0])
			workflowExecution.ExecutionSourceAuth = sourceAuth[0]
		} else {
			//log.Printf("Did NOT get source workflow")
		}

		sourceNode, sourceNodeOk := request.URL.Query()["source_node"]
		if sourceNodeOk {
			//log.Printf("\n\n\nSETTING SOURCE WORKFLOW NODE TO %s!!!\n\n\n", sourceNode[0])
			workflowExecution.ExecutionSourceNode = sourceNode[0]
		} else {
			//log.Printf("Did NOT get source workflow")
		}

		//workflowExecution.ExecutionSource = "default"
		sourceWorkflow, sourceWorkflowOk := request.URL.Query()["source_workflow"]
		if sourceWorkflowOk {
			//log.Printf("Got source workflow %s", sourceWorkflow)
			workflowExecution.ExecutionSource = sourceWorkflow[0]
		} else {
			//log.Printf("Did NOT get source workflow")
		}

		sourceExecution, sourceExecutionOk := request.URL.Query()["source_execution"]
		if sourceExecutionOk {
			//log.Printf("[INFO] Got source execution%s", sourceExecution)
			workflowExecution.ExecutionParent = sourceExecution[0]
		} else {
			//log.Printf("Did NOT get source execution")
		}

		if len(string(body)) < 50 {
			//log.Println(body)
			// String in string
			//log.Println(body)

			//if string(body)[0] == "\"" && string(body)[string(body)
			log.Printf("[DEBUG] Body: %s", string(body))
		}

		var execution shuffle.ExecutionRequest
		err = json.Unmarshal(body, &execution)
		if err != nil {
			log.Printf("[WARNING] Failed execution POST unmarshalling for execution %s - continuing anyway: %s", execution.ExecutionId, err)
			//return shuffle.WorkflowExecution{}, "", err
		}

		if execution.Start == "" && len(body) > 0 {
			execution.ExecutionArgument = string(body)
		}

		// FIXME - this should have "execution_argument" from executeWorkflow frontend
		//log.Printf("EXEC: %#v", execution)
		if len(execution.ExecutionArgument) > 0 {
			workflowExecution.ExecutionArgument = execution.ExecutionArgument
		}

		if len(execution.ExecutionSource) > 0 {
			workflowExecution.ExecutionSource = execution.ExecutionSource
		}

		//log.Printf("Execution data: %#v", execution)
		if len(execution.Start) == 36 && len(workflow.Actions) > 0 {
			log.Printf("[INFO] Should start execution on node %s", execution.Start)
			workflowExecution.Start = execution.Start

			found := false
			for _, action := range workflow.Actions {
				if action.ID == execution.Start {
					found = true
					break
				}
			}

			if !found {
				log.Printf("[ERROR] Action %s was NOT found! Exiting execution.", execution.Start)
				return shuffle.WorkflowExecution{}, fmt.Sprintf("Startnode %s was not found in actions", workflow.Start), errors.New(fmt.Sprintf("Startnode %s was not found in actions", workflow.Start))
			}
		} else if len(execution.Start) > 0 {
			//log.Printf("[INFO] !")
			//log.Printf("[ERROR] START ACTION %s IS WRONG ID LENGTH %d!", execution.Start, len(execution.Start))
			//return shuffle.WorkflowExecution{}, fmt.Sprintf("Startnode %s was not found in actions", execution.Start), errors.New(fmt.Sprintf("Startnode %s was not found in actions", execution.Start))
		}

		if len(execution.ExecutionId) == 36 {
			workflowExecution.ExecutionId = execution.ExecutionId
		} else {
			sessionToken := uuid.NewV4()
			workflowExecution.ExecutionId = sessionToken.String()
		}
	} else {
		// Check for parameters of start and ExecutionId
		// This is mostly used for user input trigger

		answer, answerok := request.URL.Query()["answer"]
		referenceId, referenceok := request.URL.Query()["reference_execution"]
		if answerok && referenceok && len(answer) > 0 && len(referenceId) > 0 {
			// If answer is false, reference execution with result
			log.Printf("[INFO] Answer is OK AND reference is OK!")
			if answer[0] == "false" {
				log.Printf("Should update reference and return, no need for further execution!")

				// Get the reference execution
				oldExecution, err := shuffle.GetWorkflowExecution(ctx, referenceId[0])
				if err != nil {
					log.Printf("Failed getting execution (execution) %s: %s", referenceId[0], err)
					return shuffle.WorkflowExecution{}, fmt.Sprintf("Failed getting execution ID %s because it doesn't exist.", referenceId[0]), err
				}

				if oldExecution.Workflow.ID != id {
					log.Println("Wrong workflowid!")
					return shuffle.WorkflowExecution{}, fmt.Sprintf("Bad ID %s", referenceId), errors.New("Bad ID")
				}

				newResults := []shuffle.ActionResult{}
				//log.Printf("%#v", oldExecution.Results)
				for _, result := range oldExecution.Results {
					log.Printf("%s - %s", result.Action.ID, start[0])
					if result.Action.ID == start[0] {
						note, noteok := request.URL.Query()["note"]
						if noteok && len(note) > 0 {
							result.Result = fmt.Sprintf("User note: %s", note[0])
						} else {
							result.Result = fmt.Sprintf("User clicked %s", answer[0])
						}

						// Stopping the whole thing
						result.CompletedAt = int64(time.Now().Unix())
						result.Status = "ABORTED"
						oldExecution.Status = result.Status
						oldExecution.Result = result.Result
						oldExecution.LastNode = result.Action.ID
					}

					newResults = append(newResults, result)
				}

				oldExecution.Results = newResults
				err = shuffle.SetWorkflowExecution(ctx, *oldExecution, true)
				if err != nil {
					log.Printf("Error saving workflow execution actionresult setting: %s", err)
					return shuffle.WorkflowExecution{}, fmt.Sprintf("Failed setting workflowexecution actionresult in execution: %s", err), err
				}

				return shuffle.WorkflowExecution{}, "", nil
			}
		}

		if referenceok {
			log.Printf("Handling an old execution continuation!")
			// Will use the old name, but still continue with NEW ID
			oldExecution, err := shuffle.GetWorkflowExecution(ctx, referenceId[0])
			if err != nil {
				log.Printf("Failed getting execution (execution) %s: %s", referenceId[0], err)
				return shuffle.WorkflowExecution{}, fmt.Sprintf("Failed getting execution ID %s because it doesn't exist.", referenceId[0]), err
			}

			workflowExecution = *oldExecution
		}

		if len(workflowExecution.ExecutionId) == 0 {
			sessionToken := uuid.NewV4()
			workflowExecution.ExecutionId = sessionToken.String()
		} else {
			log.Printf("Using the same executionId as before: %s", workflowExecution.ExecutionId)
			makeNew = false
		}

		// Don't override workflow defaults
	}

	if startok {
		//log.Printf("\n\n[INFO] Setting start to %s based on query!\n\n", start[0])
		//workflowExecution.Workflow.Start = start[0]
		workflowExecution.Start = start[0]
	}

	// FIXME - regex uuid, and check if already exists?
	if len(workflowExecution.ExecutionId) != 36 {
		log.Printf("Invalid uuid: %s", workflowExecution.ExecutionId)
		return shuffle.WorkflowExecution{}, "Invalid uuid", err
	}

	// FIXME - find owner of workflow
	// FIXME - get the actual workflow itself and build the request
	// MAYBE: Don't send the workflow within the pubsub, as this requires more data to be sent
	// Check if a worker already exists for company, else run one with:
	// locations, project IDs and subscription names

	// When app is executed:
	// Should update with status execution (somewhere), which will trigger the next node
	// IF action.type == internal, we need the internal watcher to be running and executing
	// This essentially means the WORKER has to be the responsible party for new actions in the INTERNAL landscape
	// Results are ALWAYS posted back to cloud@execution_id?
	if makeNew {
		workflowExecution.Type = "workflow"
		//workflowExecution.Stream = "tmp"
		//workflowExecution.WorkflowQueue = "tmp"
		//workflowExecution.SubscriptionNameNodestream = "testcompany-nodestream"
		//workflowExecution.Locations = []string{"europe-west2"}
		workflowExecution.ProjectId = gceProject
		workflowExecution.WorkflowId = workflow.ID
		workflowExecution.StartedAt = int64(time.Now().Unix())
		workflowExecution.CompletedAt = 0
		workflowExecution.Authorization = uuid.NewV4().String()

		// Status for the entire workflow.
		workflowExecution.Status = "EXECUTING"
	}

	if len(workflowExecution.ExecutionSource) == 0 {
		log.Printf("[INFO] No execution source (trigger) specified. Setting to default")
		workflowExecution.ExecutionSource = "default"
	} else {
		log.Printf("[INFO] Execution source is %s for execution ID %s in workflow %s", workflowExecution.ExecutionSource, workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
	}

	workflowExecution.ExecutionVariables = workflow.ExecutionVariables
	if len(workflowExecution.Start) == 0 && len(workflowExecution.Workflow.Start) > 0 {
		workflowExecution.Start = workflowExecution.Workflow.Start
	}

	startnodeFound := false
	newStartnode := ""
	for _, item := range workflowExecution.Workflow.Actions {
		if item.ID == workflowExecution.Start {
			startnodeFound = true
		}

		if item.IsStartNode {
			newStartnode = item.ID
		}
	}

	if !startnodeFound {
		log.Printf("[INFO] Couldn't find startnode %s. Remapping to %#v", workflowExecution.Start, newStartnode)

		if len(newStartnode) > 0 {
			workflowExecution.Start = newStartnode
		} else {
			return shuffle.WorkflowExecution{}, fmt.Sprintf("Startnode couldn't be found"), errors.New("Startnode isn't defined in this workflow..")
		}
	}

	childNodes := shuffle.FindChildNodes(workflowExecution.Workflow, workflowExecution.Start, []string{}, []string{})

	startFound := false
	newActions := []shuffle.Action{}
	defaultResults := []shuffle.ActionResult{}

	for _, action := range workflowExecution.Workflow.Actions {
		//action.LargeImage = ""
		if action.ID == workflowExecution.Start {
			startFound = true
		}
		//log.Println(action.Environment)

		if action.Environment == "" {
			return shuffle.WorkflowExecution{}, fmt.Sprintf("Environment is not defined for %s", action.Name), errors.New("Environment not defined!")
		}

		action.LargeImage = ""
		if len(action.Label) == 0 {
			action.Label = action.ID
		}
		//log.Printf("LABEL: %s", action.Label)
		newActions = append(newActions, action)

		// If the node is NOT found, it's supposed to be set to SKIPPED,
		// as it's not a childnode of the startnode
		// This is a configuration item for the workflow itself.
		if len(workflowExecution.Results) > 0 {
			defaultResults = []shuffle.ActionResult{}
			for _, result := range workflowExecution.Results {
				if result.Status == "WAITING" {
					result.Status = "FINISHED"
					result.Result = "Continuing"
				}

				defaultResults = append(defaultResults, result)
			}
		} else if len(workflowExecution.Results) == 0 && !workflowExecution.Workflow.Configuration.StartFromTop {
			found := false
			for _, nodeId := range childNodes {
				if nodeId == action.ID {
					//log.Printf("Found %s", action.ID)
					found = true
				}
			}

			if !found {
				if action.ID == workflowExecution.Start {
					continue
				}

				//log.Printf("[WARNING] Set %s to SKIPPED as it's NOT a childnode of the startnode.", action.ID)
				curaction := shuffle.Action{
					AppName:    action.AppName,
					AppVersion: action.AppVersion,
					Label:      action.Label,
					Name:       action.Name,
					ID:         action.ID,
				}
				//action
				//curaction.Parameters = []
				defaultResults = append(defaultResults, shuffle.ActionResult{
					Action:        curaction,
					ExecutionId:   workflowExecution.ExecutionId,
					Authorization: workflowExecution.Authorization,
					Result:        "Skipped because it's not under the startnode",
					StartedAt:     0,
					CompletedAt:   0,
					Status:        "SKIPPED",
				})
			}
		}
	}

	removeTriggers := []string{}
	for triggerIndex, trigger := range workflowExecution.Workflow.Triggers {
		//log.Printf("[INFO] ID: %s vs %s", trigger.ID, workflowExecution.Start)
		if trigger.ID == workflowExecution.Start {
			if trigger.AppName == "User Input" {
				startFound = true
				break
			}
		}

		if trigger.AppName == "User Input" || trigger.AppName == "Shuffle Workflow" {
			found := false
			for _, node := range childNodes {
				if node == trigger.ID {
					found = true
					break
				}
			}

			if !found {
				//log.Printf("SHOULD SET TRIGGER %s TO BE SKIPPED", trigger.ID)

				curaction := shuffle.Action{
					AppName:    "shuffle-subflow",
					AppVersion: trigger.AppVersion,
					Label:      trigger.Label,
					Name:       trigger.Name,
					ID:         trigger.ID,
				}

				defaultResults = append(defaultResults, shuffle.ActionResult{
					Action:        curaction,
					ExecutionId:   workflowExecution.ExecutionId,
					Authorization: workflowExecution.Authorization,
					Result:        "Skipped because it's not under the startnode",
					StartedAt:     0,
					CompletedAt:   0,
					Status:        "SKIPPED",
				})
			} else {
				// Replaces trigger with the subflow
				//if trigger.AppName == "Shuffle Workflow" {
				//	replaceActions := false
				//	workflowAction := ""
				//	for _, param := range trigger.Parameters {
				//		if param.Name == "argument" && !strings.Contains(param.Value, ".#") {
				//			replaceActions = true
				//		}

				//		if param.Name == "startnode" {
				//			workflowAction = param.Value
				//		}
				//	}

				//	if replaceActions {
				//		replacementNodes, newBranches, lastnode := shuffle.GetReplacementNodes(ctx, workflowExecution, trigger, trigger.Label)
				//		log.Printf("REPLACEMENTS: %d, %d", len(replacementNodes), len(newBranches))
				//		if len(replacementNodes) > 0 {
				//			for _, action := range replacementNodes {
				//				found := false

				//				for subActionIndex, subaction := range newActions {
				//					if subaction.ID == action.ID {
				//						found = true
				//						//newActions[subActionIndex].Name = action.Name
				//						newActions[subActionIndex].Label = action.Label
				//						break
				//					}
				//				}

				//				if !found {
				//					action.SubAction = true
				//					newActions = append(newActions, action)
				//				}

				//				// Check if it's already set to have a value
				//				for resultIndex, result := range defaultResults {
				//					if result.Action.ID == action.ID {
				//						defaultResults = append(defaultResults[:resultIndex], defaultResults[resultIndex+1:]...)
				//						break
				//					}
				//				}
				//			}

				//			for _, branch := range newBranches {
				//				workflowExecution.Workflow.Branches = append(workflowExecution.Workflow.Branches, branch)
				//			}

				//			// Append branches:
				//			// parent -> new inner node (FIRST one)
				//			for branchIndex, branch := range workflowExecution.Workflow.Branches {
				//				if branch.DestinationID == trigger.ID {
				//					log.Printf("REPLACE DESTINATION WITH %s!!", workflowAction)
				//					workflowExecution.Workflow.Branches[branchIndex].DestinationID = workflowAction
				//				}

				//				if branch.SourceID == trigger.ID {
				//					log.Printf("REPLACE SOURCE WITH LASTNODE %s!!", lastnode)
				//					workflowExecution.Workflow.Branches[branchIndex].SourceID = lastnode
				//				}
				//			}

				//			// Remove the trigger
				//			removeTriggers = append(removeTriggers, workflowExecution.Workflow.Triggers[triggerIndex].ID)
				//		}

				//		log.Printf("NEW ACTION LENGTH %d, RESULT: %d, Triggers: %d, BRANCHES: %d", len(newActions), len(defaultResults), len(workflowExecution.Workflow.Triggers), len(workflowExecution.Workflow.Branches))
				//	}
				//}
				_ = triggerIndex
			}
		}
	}

	//newTriggers := []shuffle.Trigger{}
	//for _, trigger := range workflowExecution.Workflow.Triggers {
	//	found := false
	//	for _, triggerId := range removeTriggers {
	//		if trigger.ID == triggerId {
	//			found = true
	//			break
	//		}
	//	}

	//	if found {
	//		log.Printf("[WARNING] Removed trigger %s during execution", trigger.ID)
	//		continue
	//	}

	//	newTriggers = append(newTriggers, trigger)
	//}
	//workflowExecution.Workflow.Triggers = newTriggers

	if !startFound {
		if len(workflowExecution.Start) == 0 && len(workflowExecution.Workflow.Start) > 0 {
			workflowExecution.Start = workflow.Start
		} else if len(workflowExecution.Workflow.Actions) > 0 {
			workflowExecution.Start = workflowExecution.Workflow.Actions[0].ID
		} else {
			log.Printf("[ERROR] Startnode %s doesn't exist!!", workflowExecution.Start)
			return shuffle.WorkflowExecution{}, fmt.Sprintf("Workflow action %s doesn't exist in workflow", workflowExecution.Start), errors.New(fmt.Sprintf(`Workflow start node "%s" doesn't exist. Exiting!`, workflowExecution.Start))
		}
	}

	//log.Printf("EXECUTION START: %s", workflowExecution.Start)

	// Verification for execution environments
	workflowExecution.Results = defaultResults
	workflowExecution.Workflow.Actions = newActions
	onpremExecution := true
	_ = onpremExecution
	environments := []string{}

	if len(workflowExecution.ExecutionOrg) == 0 && len(workflow.ExecutingOrg.Id) > 0 {
		workflowExecution.ExecutionOrg = workflow.ExecutingOrg.Id
	}
	*/

	//workflowExecution, execInfo, _, workflowExecErr := shuffle.PrepareWorkflowExecution(ctx, workflow, request, int64(maxExecutionDepth))
	err = shuffle.SetWorkflowExecution(ctx, workflowExecution, true)
	if err != nil {
		log.Printf("[ERROR] Failed setting workflow execution during init (2): %s", err)
	}

	onpremExecution := execInfo.OnpremExecution
	_ = onpremExecution
	environments := execInfo.Environments
	var allEnvs []shuffle.Environment
	if len(workflowExecution.ExecutionOrg) > 0 {
		//log.Printf("[INFO] Executing ORG: %s", workflowExecution.ExecutionOrg)

		allEnvironments, err := shuffle.GetEnvironments(ctx, workflowExecution.ExecutionOrg)
		if err != nil {
			log.Printf("[WARNING] Failed finding environments: %s", err)
			return shuffle.WorkflowExecution{}, fmt.Sprintf("Workflow environments not found for this org"), errors.New(fmt.Sprintf("Workflow environments not found for this org"))
		}

		for _, curenv := range allEnvironments {
			if curenv.Archived {
				continue
			}

			allEnvs = append(allEnvs, curenv)
		}
	} else {
		log.Printf("[ERROR] No org identified for execution of %s. Returning", workflowExecution.Workflow.ID)
		return shuffle.WorkflowExecution{}, "No org identified for execution", errors.New("No org identified for execution")
	}

	if len(allEnvs) == 0 {
		log.Printf("[ERROR] No active environments found for org: %s", workflowExecution.ExecutionOrg)
		return shuffle.WorkflowExecution{}, "No active environments found", errors.New(fmt.Sprintf("No active env found for org %s", workflowExecution.ExecutionOrg))
	}

	// Check if the actions are children of the startnode?
	imageNames := []string{}
	cloudExec := false
	_ = cloudExec
	for _, action := range workflowExecution.Workflow.Actions {
		// Verify if the action environment exists and append
		found := false
		for _, env := range allEnvs {
			if env.Name == action.Environment {
				found = true

				if env.Type == "cloud" {
					cloudExec = true
				} else if env.Type == "onprem" {
					onpremExecution = true
				} else {
					log.Printf("[ERROR] No handler for environment type %s", env.Type)
					return shuffle.WorkflowExecution{}, "No active environments found", errors.New(fmt.Sprintf("No handler for environment type %s", env.Type))
				}
				break
			}
		}

		if !found {
			log.Printf("[ERROR] Couldn't find environment %s. Maybe it's inactive?", action.Environment)
			return shuffle.WorkflowExecution{}, "Couldn't find the environment", errors.New(fmt.Sprintf("Couldn't find env %s in org %s", action.Environment, workflowExecution.ExecutionOrg))
		}

		found = false
		for _, env := range environments {
			if env == action.Environment {

				found = true
				break
			}
		}

		// Check if the app exists?
		newName := action.AppName
		newName = strings.ReplaceAll(newName, " ", "-")
		imageNames = append(imageNames, fmt.Sprintf("%s:%s_%s", baseDockerName, newName, action.AppVersion))

		if !found {
			environments = append(environments, action.Environment)
		}
	}

	err = imageCheckBuilder(imageNames)
	if err != nil {
		log.Printf("[ERROR] Failed building the required images from %#v: %s", imageNames, err)
		return shuffle.WorkflowExecution{}, "Failed building missing Docker images", err
	}

	err = shuffle.SetWorkflowExecution(ctx, workflowExecution, true)
	if err != nil {
		log.Printf("[WARNING] Error saving workflow execution for updates %s", err)
		return shuffle.WorkflowExecution{}, fmt.Sprintf("Failed setting workflowexecution: %s", err), err
	}

	// Adds queue for onprem execution
	// FIXME - add specifics to executionRequest, e.g. specific environment (can run multi onprem)
	if execInfo.OnpremExecution {
		// FIXME - tmp name based on future companyname-companyId
		// This leads to issues with overlaps. Should set limits and such instead
		for _, environment := range execInfo.Environments {
			log.Printf("[INFO][%s] Execution: should execute onprem with execution environment \"%s\". Workflow: %s", workflowExecution.ExecutionId, environment, workflowExecution.Workflow.ID)

			executionRequest := shuffle.ExecutionRequest{
				ExecutionId:   workflowExecution.ExecutionId,
				WorkflowId:    workflowExecution.Workflow.ID,
				Authorization: workflowExecution.Authorization,
				Environments:  execInfo.Environments,
			}

			//executionRequestWrapper, err := getWorkflowQueue(ctx, environment)
			//if err != nil {
			//	executionRequestWrapper = ExecutionRequestWrapper{
			//		Data: []ExecutionRequest{executionRequest},
			//	}
			//} else {
			//	executionRequestWrapper.Data = append(executionRequestWrapper.Data, executionRequest)
			//}

			//log.Printf("Execution request: %#v", executionRequest)
			executionRequest.Priority = workflowExecution.Priority
			err = shuffle.SetWorkflowQueue(ctx, executionRequest, environment)
			if err != nil {
				log.Printf("[ERROR] Failed adding execution to db: %s", err)
			}
		}
	}

	// Verifies and runs cloud executions
	if execInfo.CloudExec {
		featuresList, err := handleVerifyCloudsync(workflowExecution.ExecutionOrg)
		if !featuresList.Workflows.Active || err != nil {
			log.Printf("Error: %s", err)
			log.Printf("[ERROR] Cloud not implemented yet. May need to work on app checking and such")
			return shuffle.WorkflowExecution{}, "Cloud not implemented yet", errors.New("Cloud not implemented yet")
		}

		shuffle.IncrementCache(ctx, workflowExecution.OrgId, "workflow_executions_cloud")

		// What it needs to know:
		// 1. Parameters
		if len(workflowExecution.Workflow.Actions) == 1 {
			log.Printf("Should execute directly with cloud instead of worker because only one action")

			//cloudExecuteAction(workflowExecution.ExecutionId, workflowExecution.Workflow.Actions[0], workflowExecution.ExecutionOrg, workflowExecution.Workflow.ID)
			cloudExecuteAction(workflowExecution)
			return shuffle.WorkflowExecution{}, "Cloud not implemented yet (1)", errors.New("Cloud not implemented yet")
		} else {
			// If it's here, it should be controlled by Worker.
			// If worker, should this backend be a proxy? I think so.
			return shuffle.WorkflowExecution{}, "Cloud not implemented yet (2)", errors.New("Cloud not implemented yet")
		}
	} else {
		shuffle.IncrementCache(ctx, workflowExecution.OrgId, "workflow_executions_onprem")
	}

	shuffle.IncrementCache(ctx, workflowExecution.OrgId, "workflow_executions")
	return workflowExecution, "", nil
}

// This updates stuff locally from remote executions
func cloudExecuteAction(execution shuffle.WorkflowExecution) error {
	ctx := context.Background()
	org, err := shuffle.GetOrg(ctx, execution.ExecutionOrg)
	if err != nil {
		return err
	}

	type ExecutionStruct struct {
		ExecutionId       string                 `json:"execution_id" datastore:"execution_id"`
		Action            shuffle.Action         `json:"action" datastore:"action"`
		Authorization     string                 `json:"authorization" datastore:"authorization"`
		Results           []shuffle.ActionResult `json:"results" datastore:"results,noindex"`
		ExecutionArgument string                 `json:"execution_argument" datastore:"execution_argument,noindex"`
		WorkflowId        string                 `json:"workflow_id" datastore:"workflow_id"`
		ExecutionSource   string                 `json:"execution_source" datastore:"execution_source"`
	}

	data := ExecutionStruct{
		ExecutionId:   execution.ExecutionId,
		WorkflowId:    execution.Workflow.ID,
		Action:        execution.Workflow.Actions[0],
		Authorization: execution.Authorization,
	}
	log.Printf("Executing action: %#v in execution ID %s", data.Action, data.ExecutionId)

	b, err := json.Marshal(data)
	if err != nil {
		log.Printf("Failed marshaling api key data: %s", err)
		return err
	}

	syncURL := fmt.Sprintf("%s/api/v1/cloud/sync/execute_node", syncUrl)
	client := shuffle.GetExternalClient(syncURL)
	req, err := http.NewRequest(
		"POST",
		syncURL,
		bytes.NewBuffer(b),
	)

	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, org.SyncConfig.Apikey))
	newresp, err := client.Do(req)
	if err != nil {
		return err
	}

	respBody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		return err
	}

	log.Printf("Finished request. Data: %s", string(respBody))
	log.Printf("Status code: %d", newresp.StatusCode)

	responseData := retStruct{}
	err = json.Unmarshal(respBody, &responseData)
	if err != nil {
		return err
	}

	if newresp.StatusCode != 200 {
		return errors.New(fmt.Sprintf("Got status code %d when executing remotely. Expected 200. Contact support.", newresp.StatusCode))
	}

	if !responseData.Success {
		return errors.New(responseData.Reason)
	}

	return nil
}

// 1. Check CORS
// 2. Check authentication
// 3. Check authorization
// 4. Run the actual function
func executeWorkflow(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, userErr := shuffle.HandleApiAuthentication(resp, request)
	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to run workflow: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
		if strings.Contains(fileId, "?") {
			fileId = strings.Split(fileId, "?")[0]
		}
	}

	if len(fileId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Workflow ID to execute is not valid"}`))
		return
	}

	log.Printf("[INFO] Inside execute workflow for ID %s", fileId)
	ctx := context.Background()
	workflow, err := shuffle.GetWorkflow(ctx, fileId)
	if err != nil && workflow.ID == "" {
		log.Printf("[WARNING] Failed getting the workflow locally (execute workflow): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Workflow with ID %s doesn't exist."}`, fileId)))
		return
	}

	executionAuthValid := false
	newOrgId := ""
	if userErr != nil {
		// Check if the execution data has correct info in it! Happens based on subflows.
		// 1. Parent workflow contains this workflow ID in the source trigger?
		// 2. Parent workflow's owner is same org?
		// 3. Parent execution auth is correct
		log.Printf("[INFO] Inside execute workflow access validation!")

		executionAuthValid, newOrgId = shuffle.RunExecuteAccessValidation(request, workflow)
		if !executionAuthValid {
			log.Printf("[INFO] Api authorization failed in execute workflow: %s", userErr)
			resp.WriteHeader(403)
			resp.Write([]byte(`{"success": false}`))
			return
		} else {
			log.Printf("[DEBUG] Execution of %s successfully validated and started based on subflow or user input execution", workflow.ID)
			user.ActiveOrg = shuffle.OrgMini{
				Id: newOrgId,
			}
		}
	}

	if !executionAuthValid {
		if user.Id != workflow.Owner && user.Role != "scheduler" && user.Role != fmt.Sprintf("workflow_%s", fileId) {
			if workflow.OrgId == user.ActiveOrg.Id && user.Role == "admin" {
				log.Printf("[AUDIT] Letting user %s execute %s because they're admin of the same org", user.Username, workflow.ID)
			} else {
				log.Printf("[AUDIT] Wrong user (%s) for workflow %s (execute)", user.Username, workflow.ID)
				resp.WriteHeader(403)
				resp.Write([]byte(`{"success": false}`))
				return
			}
		}
	}

	log.Printf("[AUDIT] Starting execution of workflow '%s' by user '%s' (%s). If this is empty, it's most likely a subflow!", fileId, user.Username, user.Id)

	user.ActiveOrg.Users = []shuffle.UserMini{}
	workflow.ExecutingOrg = user.ActiveOrg
	workflowExecution, executionResp, err := handleExecution(fileId, *workflow, request, user.ActiveOrg.Id)
	if err == nil {
		if strings.Contains(executionResp, "User Input:") {
			resp.WriteHeader(400)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, executionResp)))
			return
		}

		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "execution_id": "%s", "authorization": "%s"}`, workflowExecution.ExecutionId, workflowExecution.Authorization)))
		return
	}

	resp.WriteHeader(500)
	resp.Write([]byte(fmt.Sprintf(`{"success": false, "execution_id": "%s", "authorization": "%s", "reason": "%s"}`, workflowExecution.ExecutionId, workflowExecution.Authorization, executionResp)))
}

func stopSchedule(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in schedule workflow: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to stop schedule: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	var scheduleId string
	if location[1] == "api" {
		if len(location) <= 6 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
		scheduleId = location[6]
	}

	if len(fileId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Workflow ID to stop schedule is not valid"}`))
		return
	}

	if len(scheduleId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Schedule ID not valid"}`))
		return
	}

	ctx := context.Background()
	workflow, err := shuffle.GetWorkflow(ctx, fileId)
	if err != nil {
		log.Printf("[WARNING] Failed getting the workflow locally (stop schedule): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Id != workflow.Owner || len(user.Id) == 0 {
		if workflow.OrgId == user.ActiveOrg.Id && user.Role == "admin" {
			log.Printf("[AUDIT] User %s is accessing workflow %s as admin (stop schedule)", user.Username, workflow.ID)
		} else {
			log.Printf("[WARNING] Wrong user (%s) for workflow %s (stop schedule)", user.Username, workflow.ID)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}
	}

	//if user.Id != workflow.Owner || len(user.Id) == 0 {
	//	if workflow.OrgId == user.ActiveOrg.Id && user.Role == "admin" {
	//		log.Printf("[INFO] User %s is accessing workflow %s as admin", user.Username, workflow.ID)
	//	} else if workflow.Public {
	//		log.Printf("[INFO] Letting user %s access workflow %s because it's public", user.Username, workflow.ID)
	//	} else {
	//		log.Printf("[WARNING] Wrong user (%s) for workflow %s (get workflow)", user.Username, workflow.ID)
	//		resp.WriteHeader(401)
	//		resp.Write([]byte(`{"success": false}`))
	//		return
	//	}
	//}

	schedule, err := shuffle.GetSchedule(ctx, scheduleId)
	if err != nil {
		log.Printf("[WARNING] Failed finding schedule %s", scheduleId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	//log.Printf("Schedule: %#v", schedule)

	if schedule.Environment == "cloud" {
		log.Printf("[INFO] Should STOP a cloud schedule for workflow %s with schedule ID %s", fileId, scheduleId)
		org, err := shuffle.GetOrg(ctx, user.ActiveOrg.Id)
		if err != nil {
			log.Printf("Failed finding org %s: %s", org.Id, err)
			return
		}

		// 1. Send request to cloud
		// 2. Remove schedule if success
		action := shuffle.CloudSyncJob{
			Type:          "schedule",
			Action:        "stop",
			OrgId:         org.Id,
			PrimaryItemId: scheduleId,
			SecondaryItem: schedule.Frequency,
			ThirdItem:     workflow.ID,
		}

		err = executeCloudAction(action, org.SyncConfig.Apikey)
		if err != nil {
			log.Printf("[WARNING] Failed cloud action STOP schedule: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		} else {
			log.Printf("[INFO] Successfully ran cloud action STOP schedule")
			err = shuffle.DeleteKey(ctx, "schedules", scheduleId)
			if err != nil {
				log.Printf("[WARNING] Failed deleting cloud schedule onprem..")
				resp.WriteHeader(401)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed deleting cloud schedule"}`)))
				return
			}

			resp.WriteHeader(200)
			resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
			return
		}
	}

	err = deleteSchedule(ctx, scheduleId)
	if err != nil {
		log.Printf("[WARNING] Failed deleting schedule: %s", err)
		if strings.Contains(err.Error(), "Job not found") {
			resp.WriteHeader(200)
			resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
		} else {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed stopping schedule"}`)))
		}
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
	return
}

func stopScheduleGCP(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in schedule workflow: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	var scheduleId string
	if location[1] == "api" {
		if len(location) <= 6 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
		scheduleId = location[6]
	}

	if len(fileId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Workflow ID to stop schedule is not valid"}`))
		return
	}

	if len(scheduleId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Schedule ID not valid"}`))
		return
	}

	ctx := context.Background()
	workflow, err := shuffle.GetWorkflow(ctx, fileId)
	if err != nil {
		log.Printf("Failed getting the workflow locally (stop schedule GCP): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - have a check for org etc too..
	// FIXME - admin check like this? idk
	if user.Id != workflow.Owner && user.Role != "scheduler" {
		log.Printf("[WARNING] Wrong user (%s) for workflow %s (stop schedule)", user.Username, workflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if len(workflow.Actions) == 0 {
		workflow.Actions = []shuffle.Action{}
	}
	if len(workflow.Branches) == 0 {
		workflow.Branches = []shuffle.Branch{}
	}
	if len(workflow.Triggers) == 0 {
		workflow.Triggers = []shuffle.Trigger{}
	}
	if len(workflow.Errors) == 0 {
		workflow.Errors = []string{}
	}

	err = deleteSchedule(ctx, scheduleId)
	if err != nil {
		if strings.Contains(err.Error(), "Job not found") {
			resp.WriteHeader(200)
			resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
		} else {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed stopping schedule"}`)))
		}
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
	return
}

func deleteSchedule(ctx context.Context, id string) error {
	log.Printf("[DEBUG] Should stop schedule %s!", id)
	err := shuffle.DeleteKey(ctx, "schedules", id)
	if err != nil {
		log.Printf("[ERROR] Failed to delete schedule: %s", err)
		return err
	} else {
		if value, exists := scheduledJobs[id]; exists {
			// Stops the schedule properly
			value.Lock()
		} else {
			// FIXME - allow it to kind of stop anyway?
			return errors.New("Can't find the schedule.")
		}
	}

	return nil
}

func scheduleWorkflow(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[WARNING] Api authentication failed in schedule workflow: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to schedule workflow: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Workflow ID to start schedule is not valid"}`))
		return
	}

	ctx := context.Background()
	workflow, err := shuffle.GetWorkflow(ctx, fileId)
	if err != nil {
		log.Printf("[WARNING] Failed getting the workflow locally (schedule workflow): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Id != workflow.Owner || len(user.Id) == 0 {
		if workflow.OrgId == user.ActiveOrg.Id && user.Role == "admin" {
			log.Printf("[INFO] User %s is deleting workflow %s as admin. Owner: %s", user.Username, workflow.ID, workflow.Owner)
		} else {
			log.Printf("[WARNING] Wrong user (%s) for workflow %s (schedule start). Owner: %s", user.Username, workflow.ID, workflow.Owner)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}
	}

	if len(workflow.Actions) == 0 {
		workflow.Actions = []shuffle.Action{}
	}
	if len(workflow.Branches) == 0 {
		workflow.Branches = []shuffle.Branch{}
	}
	if len(workflow.Triggers) == 0 {
		workflow.Triggers = []shuffle.Trigger{}
	}
	if len(workflow.Errors) == 0 {
		workflow.Errors = []string{}
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Failed hook unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	var schedule shuffle.Schedule
	err = json.Unmarshal(body, &schedule)
	if err != nil {
		log.Printf("Failed schedule POST unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Finds the startnode for the specific schedule
	startNode := ""
	if schedule.Start != "" {
		startNode = schedule.Start
	} else {

		for _, branch := range workflow.Branches {
			if branch.SourceID == schedule.Id {
				startNode = branch.DestinationID
			}
		}

		if startNode == "" {
			startNode = workflow.Start
		}
	}

	//log.Printf("Startnode: %s", startNode)

	if len(schedule.Id) != 36 {
		log.Printf("ID length is not 36 for schedule: %s", err)
		resp.WriteHeader(http.StatusInternalServerError)
		resp.Write([]byte(`{"success": false, "reason": "Invalid data"}`))
		return
	}

	if len(schedule.Name) == 0 {
		log.Printf("Empty name.")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Schedule name can't be empty"}`))
		return
	}

	if len(schedule.Frequency) == 0 {
		log.Printf("Empty frequency.")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Frequency can't be empty"}`))
		return
	}

	scheduleArg, err := json.Marshal(schedule.ExecutionArgument)
	if err != nil {
		log.Printf("Failed scheduleArg marshal: %s", err)
		resp.WriteHeader(http.StatusInternalServerError)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Clean up garbage. This might be wrong in some very specific use-cases
	parsedBody := string(scheduleArg)
	parsedBody = strings.Replace(parsedBody, "\\\"", "\"", -1)
	if len(parsedBody) > 0 {
		if string(parsedBody[0]) == `"` && string(parsedBody[len(parsedBody)-1]) == "\"" {
			parsedBody = parsedBody[1 : len(parsedBody)-1]
		}
	}

	if schedule.Environment == "cloud" {
		log.Printf("[INFO] Should START a cloud schedule for workflow %s with schedule ID %s", workflow.ID, schedule.Id)
		org, err := shuffle.GetOrg(ctx, user.ActiveOrg.Id)
		if err != nil {
			log.Printf("Failed finding org %s: %s", org.Id, err)
			return
		}

		// 1 = scheduleId
		// 2 = schedule (cron, frequency)
		// 3 = workflowId
		// 4 = execution argument
		action := shuffle.CloudSyncJob{
			Type:          "schedule",
			Action:        "start",
			OrgId:         org.Id,
			PrimaryItemId: schedule.Id,
			SecondaryItem: schedule.Frequency,
			ThirdItem:     workflow.ID,
			FourthItem:    schedule.ExecutionArgument,
			FifthItem:     startNode,
		}

		timeNow := int64(time.Now().Unix())
		newSchedule := shuffle.ScheduleOld{
			Id:                   schedule.Id,
			WorkflowId:           workflow.ID,
			StartNode:            startNode,
			Argument:             string(schedule.ExecutionArgument),
			WrappedArgument:      parsedBody,
			CreationTime:         timeNow,
			LastModificationtime: timeNow,
			LastRuntime:          timeNow,
			Org:                  org.Id,
			Frequency:            schedule.Frequency,
			Environment:          "cloud",
		}

		err = shuffle.SetSchedule(ctx, newSchedule)
		if err != nil {
			log.Printf("Failed setting cloud schedule: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		}

		//log.Printf("Starting Cloud schedule Action: %#v", action)
		err = executeCloudAction(action, org.SyncConfig.Apikey)
		if err != nil {
			log.Printf("[WARNING] Failed cloud action START schedule: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		} else {
			log.Printf("[INFO] Successfully set up cloud action schedule")
			resp.WriteHeader(200)
			resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Done"}`)))
			return
		}
	}

	//log.Printf("Schedulearg: %s", parsedBody)

	err = createSchedule(
		ctx,
		schedule.Id,
		workflow.ID,
		schedule.Name,
		startNode,
		schedule.Frequency,
		user.ActiveOrg.Id,
		[]byte(parsedBody),
	)

	// FIXME - real error message lol
	if err != nil {
		log.Printf("Failed creating schedule: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Invalid argument. Try cron */15 * * * *"}`)))
		return
	}

	//workflow.Schedules = append(workflow.Schedules, schedule)
	err = shuffle.SetWorkflow(ctx, *workflow, workflow.ID)
	if err != nil {
		log.Printf("Failed setting workflow for schedule: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
	return
}

func setExampleresult(ctx context.Context, result shuffle.AppExecutionExample) error {
	// FIXME: Reintroduce this for stats
	//key := datastore.NameKey("example_result", result.ExampleId, nil)

	//// New struct, to not add body, author etc
	//if _, err := dbclient.Put(ctx, key, &result); err != nil {
	//	log.Printf("Error adding workflow: %s", err)
	//	return err
	//}

	return nil
}

func getWorkflowApps(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	ctx := context.Background()
	user, userErr := shuffle.HandleApiAuthentication(resp, request)
	if userErr != nil {
		log.Printf("[WARNING] Api authentication failed in get all apps - this does NOT require auth in cloud.: %s", userErr)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	workflowapps, err := shuffle.GetAllWorkflowApps(ctx, 1000, 0)
	if err != nil {
		log.Printf("{WARNING] Failed getting apps (getworkflowapps): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	newapps := workflowapps

	if len(user.PrivateApps) > 0 {
		found := false
		for _, item := range user.PrivateApps {
			for _, app := range newapps {
				if item.ID == app.ID {
					found = true
					break
				}
			}

			if !found {
				newapps = append(newapps, item)
			}
		}
	}

	// Double unmarshal because of user apps
	newbody, err := json.Marshal(newapps)
	if err != nil {
		log.Printf("[ERROR] Failed unmarshalling all newapps: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking workflow apps"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newbody)
}

func handleGetfile(resp http.ResponseWriter, request *http.Request) ([]byte, error) {
	// Upload file here first
	request.ParseMultipartForm(32 << 20)
	file, _, err := request.FormFile("file")
	if err != nil {
		log.Printf("Error parsing: %s", err)
		return []byte{}, err
	}
	defer file.Close()

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		return []byte{}, err
	}

	return buf.Bytes(), nil
}

// Basically a search for apps that aren't activated yet
func getSpecificApps(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Just need to be logged in
	// FIXME - should have some permissions?
	_, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new app: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Error with body read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	type tmpStruct struct {
		Search string `json:"search"`
	}

	var tmpBody tmpStruct
	err = json.Unmarshal(body, &tmpBody)
	if err != nil {
		log.Printf("Error with unmarshal tmpBody: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - continue the search here with github repos etc.
	// Caching might be smart :D
	ctx := context.Background()
	workflowapps, err := shuffle.GetAllWorkflowApps(ctx, 1000, 0)
	if err != nil {
		log.Printf("Error: Failed getting workflowapps: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	returnValues := []shuffle.WorkflowApp{}
	search := strings.ToLower(tmpBody.Search)
	for _, app := range workflowapps {
		if !app.Activated && app.Generated {
			// This might be heavy with A LOT
			// Not too worried with todays tech tbh..
			appName := strings.ToLower(app.Name)
			appDesc := strings.ToLower(app.Description)
			if strings.Contains(appName, search) || strings.Contains(appDesc, search) {
				//log.Printf("Name: %s, Generated: %s, Activated: %s", app.Name, strconv.FormatBool(app.Generated), strconv.FormatBool(app.Activated))
				returnValues = append(returnValues, app)
			}
		}
	}

	newbody, err := json.Marshal(returnValues)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking workflow executions"}`)))
		return
	}

	returnData := fmt.Sprintf(`{"success": true, "reason": %s}`, string(newbody))
	resp.WriteHeader(200)
	resp.Write([]byte(returnData))
}

func validateAppInput(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Just need to be logged in
	// FIXME - should have some permissions?
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new app: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to delete apps: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	filebytes, err := handleGetfile(resp, request)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	kind, err := filetype.Match(filebytes)
	if err != nil {
		log.Printf("Failed parsing filetype")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	//fmt.Printf("File type: %s. MIME: %s\n", kind.Extension, kind.MIME.Value)
	if kind == filetype.Unknown {
		fmt.Println("Unknown file type")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if kind.MIME.Value != "application/zip" {
		fmt.Println("Not zip, can't unzip")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - validate folderstructure, Dockerfile, python scripts, api.yaml, requirements.txt, src/

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func loadGithubWorkflows(url, username, password, userId, branch, orgId string) error {
	fs := memfs.New()

	log.Printf("Starting load of %s with branch %s", url, branch)
	if strings.Contains(url, "github") || strings.Contains(url, "gitlab") || strings.Contains(url, "bitbucket") {
		cloneOptions := &git.CloneOptions{
			URL: url,
		}

		// FIXME: Better auth.
		if len(username) > 0 && len(password) > 0 {
			cloneOptions.Auth = &http2.BasicAuth{

				Username: username,
				Password: password,
			}
		}

		// main is the new master
		if len(branch) > 0 && branch != "main" && branch != "master" {
			cloneOptions.ReferenceName = plumbing.ReferenceName(branch)
		}

        cloneOptions = checkGitProxy(cloneOptions)

		storer := memory.NewStorage()
		r, err := git.Clone(storer, fs, cloneOptions)
		if err != nil {
			log.Printf("[INFO] Failed loading repo %s into memory (github workflows): %s", url, err)
			return err
		}

		dir, err := fs.ReadDir("/")
		if err != nil {
			log.Printf("FAiled reading folder: %s", err)
		}
		_ = r

		log.Printf("Starting workflow folder iteration")
		iterateWorkflowGithubFolders(fs, dir, "", "", userId, orgId)

	} else if strings.Contains(url, "s3") {
		//https://docs.aws.amazon.com/sdk-for-go/api/service/s3/

		//sess := session.Must(session.NewSession())
		//downloader := s3manager.NewDownloader(sess)

		//// Write the contents of S3 Object to the file
		//storer := memory.NewStorage()
		//n, err := downloader.Download(storer, &s3.GetObjectInput{
		//	Bucket: aws.String(myBucket),
		//	Key:    aws.String(myString),
		//})
		//if err != nil {
		//	return fmt.Errorf("failed to download file, %v", err)
		//}
		//fmt.Printf("file downloaded, %d bytes\n", n)
	} else {
		return errors.New(fmt.Sprintf("URL %s is unsupported when downloading workflows", url))
	}

	return nil
}

func loadSpecificWorkflows(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Just need to be logged in
	// FIXME - should have some permissions?
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in load apps: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		log.Printf("Wrong user (%s) when downloading from github", user.Username)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Downloading remotely requires admin"}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Error with body read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Field1 & 2 can be a lot of things..
	type tmpStruct struct {
		URL    string `json:"url"`
		Field1 string `json:"field_1"`
		Field2 string `json:"field_2"`
		Field3 string `json:"field_3"`
	}
	//log.Printf("Body: %s", string(body))

	var tmpBody tmpStruct
	err = json.Unmarshal(body, &tmpBody)
	if err != nil {
		log.Printf("Error with unmarshal tmpBody: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Field3 = branch
	err = loadGithubWorkflows(tmpBody.URL, tmpBody.Field1, tmpBody.Field2, user.Id, tmpBody.Field3, user.ActiveOrg.Id)
	if err != nil {
		log.Printf("Failed to update workflows: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func handleSingleAppHotloadRequest(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}
	ctx := context.Background()
	cacheKey := fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-0")
	shuffle.DeleteCache(ctx, cacheKey)
	// Just need to be logged in
	// FIXME - should have some permissions?
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in app hotload: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}
	if user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Must be admin to hotload apps"}`))
		return
	}
	location := os.Getenv("SHUFFLE_APP_HOTLOAD_FOLDER")
	if len(location) == 0 {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "SHUFFLE_APP_HOTLOAD_FOLDER not specified in .env"}`)))
		return
	}
	requestUrlFields := strings.Split(request.URL.String(), "/")
	var appName string
	if requestUrlFields[1] == "api" {
		if len(requestUrlFields) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}
		appName = requestUrlFields[4]
		if strings.Contains(appName, "?") {
			appName = strings.Split(appName, "?")[0]
		}
	}
	location = location + "/" + appName
	log.Printf("[INFO] Starting hotloading from %s", location)
	err = handleAppHotload(ctx, location, true)
	if err != nil {
		log.Printf("[WARNING] Failed app hotload: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}
	cacheKey = fmt.Sprintf("workflowapps-sorted-100")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func handleAppHotloadRequest(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	ctx := context.Background()
	cacheKey := fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-0")
	shuffle.DeleteCache(ctx, cacheKey)

	// Just need to be logged in
	// FIXME - should have some permissions?
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in app hotload: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Must be admin to hotload apps"}`))
		return
	}

	location := os.Getenv("SHUFFLE_APP_HOTLOAD_FOLDER")
	if len(location) == 0 {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "SHUFFLE_APP_HOTLOAD_FOLDER not specified in .env"}`)))
		return
	}

	log.Printf("[INFO] Starting hotloading from %s", location)
	err = handleAppHotload(ctx, location, true)
	if err != nil {
		log.Printf("[WARNING] Failed app hotload: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	cacheKey = fmt.Sprintf("workflowapps-sorted-100")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}
func iterateOpenApiGithub(fs billy.Filesystem, dir []os.FileInfo, extra string, onlyname string) error {

	ctx := context.Background()
	workflowapps, err := shuffle.GetAllWorkflowApps(ctx, 1000, 0)
	appCounter := 0
	if err != nil {
		log.Printf("[WARNING] Failed to get existing generated apps for OpenAPI verification: %s", err)
	}

	for _, file := range dir {
		if len(onlyname) > 0 && file.Name() != onlyname {
			continue
		}

		// Folder?
		switch mode := file.Mode(); {
		case mode.IsDir():
			tmpExtra := fmt.Sprintf("%s%s/", extra, file.Name())
			//log.Printf("TMPEXTRA: %s", tmpExtra)
			dir, err := fs.ReadDir(tmpExtra)
			if err != nil {
				log.Printf("Failed reading dir in openapi: %s", err)
				continue
			}

			// Go routine? Hmm, this can be super quick I guess
			err = iterateOpenApiGithub(fs, dir, tmpExtra, "")
			if err != nil {
				log.Printf("Failed recursion in openapi: %s", err)
				continue
				//break
			}
		case mode.IsRegular():
			// Check the file
			filename := file.Name()
			filteredNames := []string{"FUNDING.yml"}
			if strings.Contains(filename, "yaml") || strings.Contains(filename, "yml") {

				contOuter := false
				for _, name := range filteredNames {
					if filename == name {
						contOuter = true
						break
					}
				}

				if contOuter {
					//log.Printf("Skipping %s", filename)
					continue
				}

				//log.Printf("File: %s", filename)
				//log.Printf("Found file: %s", filename)
				//log.Printf("OpenAPI app: %s", filename)
				tmpExtra := fmt.Sprintf("%s%s/", extra, file.Name())

				fileReader, err := fs.Open(tmpExtra)
				if err != nil {
					continue
				}

				readFile, err := ioutil.ReadAll(fileReader)
				if err != nil {
					log.Printf("[WARNING] Filereader error yaml for %s: %s", filename, err)
					continue
				}

				// 1. This parses OpenAPI v2 to v3 etc, for use.
				parsedOpenApi, err := handleSwaggerValidation(readFile)
				if err != nil {
					log.Printf("[WARNING] Validation error for %s: %s", filename, err)
					continue
				}

				// 2. With parsedOpenApi.ID:
				//http://localhost:3000/apps/new?id=06b1376f77b0563a3b1747a3a1253e88

				// 3. Load this as a "standby" app
				// FIXME: This should be a function ROFL
				swagger, err := openapi3.NewSwaggerLoader().LoadSwaggerFromData([]byte(parsedOpenApi.Body))
				if err != nil {
					log.Printf("[WARNING] Swagger validation error in loop (%s): %s. Continuing.", filename, err)
					continue
				}

				if strings.Contains(swagger.Info.Title, " ") {
					strings.Replace(swagger.Info.Title, " ", "", -1)
				}

				//log.Printf("Should generate yaml")
				swagger, api, _, err := shuffle.GenerateYaml(swagger, parsedOpenApi.ID)
				if err != nil {
					log.Printf("[WARNING] Failed building and generating yaml in loop (2) (%s): %s. Continuing.", filename, err)
					continue
				}

				// FIXME: Configure user?
				api.Owner = ""
				api.ID = parsedOpenApi.ID
				api.IsValid = true
				api.Generated = true
				api.Activated = false

				found := false
				for _, app := range workflowapps {
					if app.ID == api.ID {
						found = true
						break
					} else if app.Name == api.Name && app.AppVersion == api.AppVersion {
						found = true
						break
					}
				}

				if !found {
					err = shuffle.SetWorkflowAppDatastore(ctx, api, api.ID)
					if err != nil {
						log.Printf("[WARNING] Failed setting workflowapp %s (%s) in loop: %s", api.Name, api.ID, err)
						continue
					} else {
						appCounter += 1
						log.Printf("[INFO] Added %s:%s to the database from OpenAPI repo", api.Name, api.AppVersion)

						// Set OpenAPI datastore
						err = shuffle.SetOpenApiDatastore(ctx, parsedOpenApi.ID, parsedOpenApi)
						if err != nil {
							log.Printf("Failed uploading openapi to datastore in loop: %s", err)
							continue
						}

						cacheKey := fmt.Sprintf("workflowapps-sorted-100")
						shuffle.DeleteCache(ctx, cacheKey)
						cacheKey = fmt.Sprintf("workflowapps-sorted-500")
						shuffle.DeleteCache(ctx, cacheKey)
						cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
						shuffle.DeleteCache(ctx, cacheKey)
					}
				} else {
					//log.Printf("Skipped upload of %s (%s)", api.Name, api.ID)
				}

				//return nil
			}
		}
	}

	if appCounter > 0 {
		//log.Printf("Preloaded %d OpenApi apps in folder %s!", appCounter, extra)
	}

	return nil
}

// Onlyname is used to
func iterateWorkflowGithubFolders(fs billy.Filesystem, dir []os.FileInfo, extra string, onlyname, userId, orgId string) error {
	var err error
	secondsOffset := 0

	// sort file names
	filenames := []string{}
	for _, file := range dir {
		filename := file.Name()
		filenames = append(filenames, filename)
	}
	sort.Strings(filenames)

	// iterate through sorted filenames
	for _, filename := range filenames {
		secondsOffset -= 10
		if len(onlyname) > 0 && filename != onlyname {
			continue
		}

		file, err := fs.Stat(filename)
		if err != nil {
			continue
		}

		// Folder?
		switch mode := file.Mode(); {
		case mode.IsDir():
			tmpExtra := fmt.Sprintf("%s%s/", extra, file.Name())
			dir, err := fs.ReadDir(tmpExtra)
			if err != nil {
				log.Printf("Failed to read dir: %s", err)
				continue
			}

			// Go routine? Hmm, this can be super quick I guess
			err = iterateWorkflowGithubFolders(fs, dir, tmpExtra, "", userId, orgId)
			if err != nil {
				continue
			}
		case mode.IsRegular():
			// Check the file
			if strings.HasSuffix(filename, ".json") {
				path := fmt.Sprintf("%s%s", extra, file.Name())
				fileReader, err := fs.Open(path)
				if err != nil {
					log.Printf("Error reading file: %s", err)
					continue
				}

				readFile, err := ioutil.ReadAll(fileReader)
				if err != nil {
					log.Printf("Error reading file: %s", err)
					continue
				}

				var workflow shuffle.Workflow
				err = json.Unmarshal(readFile, &workflow)
				if err != nil {
					continue
				}

				// rewrite owner to user who imports now
				if userId != "" {
					workflow.Owner = userId
				}

				workflow.ID = uuid.NewV4().String()
				workflow.OrgId = orgId
				workflow.ExecutingOrg = shuffle.OrgMini{
					Id: orgId,
				}

				workflow.Org = append(workflow.Org, shuffle.OrgMini{
					Id: orgId,
				})
				workflow.IsValid = false
				workflow.Errors = []string{"Imported, not locally saved. Save before using."}

				/*
					// Find existing similar ones
					q = datastore.NewQuery("workflow").Filter("org_id =", user.ActiveOrg.Id).Filter("name", workflow.name)
					var workflows []Workflow
					_, err = dbclient.GetAll(ctx, q, &workflows)
					if err == nil {
						log.Printf("Failed getting workflows for user %s: %s", user.Username, err)
						if len(workflows) == 0 {
							resp.WriteHeader(200)
							resp.Write([]byte("[]"))
							return
						}
					}
				*/

				log.Printf("Import workflow from file: %s", filename)
				ctx := context.Background()
				err = shuffle.SetWorkflow(ctx, workflow, workflow.ID, secondsOffset)
				if err != nil {
					log.Printf("Failed setting (download) workflow: %s", err)
					continue
				}

				log.Printf("Uploaded workflow %s for user %s and org %s!", filename, userId, orgId)
			}
		}
	}

	return err
}

func setNewWorkflowApp(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Just need to be logged in
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new app: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to set new workflowapp: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Error with body read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	var workflowapp shuffle.WorkflowApp
	err = json.Unmarshal(body, &workflowapp)
	if err != nil {
		log.Printf("Failed unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	allapps, err := shuffle.GetAllWorkflowApps(ctx, 1000, 0)
	if err != nil {
		log.Printf("Failed getting apps to verify: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	appfound := false
	for _, app := range allapps {
		if app.Name == workflowapp.Name && app.AppVersion == workflowapp.AppVersion {
			log.Printf("App upload for %s:%s already exists.", app.Name, app.AppVersion)
			appfound = true
			break
		}
	}

	if appfound {
		log.Printf("App %s:%s already exists. Bump the version.", workflowapp.Name, workflowapp.AppVersion)
		resp.WriteHeader(409)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "App %s:%s already exists."}`, workflowapp.Name, workflowapp.AppVersion)))
		return
	}

	err = shuffle.CheckWorkflowApp(workflowapp)
	if err != nil {
		log.Printf("%s for app %s:%s", err, workflowapp.Name, workflowapp.AppVersion)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s for app %s:%s"}`, err, workflowapp.Name, workflowapp.AppVersion)))
		return
	}

	//if workflowapp.Environment == "" {
	//	workflowapp.Environment = baseEnvironment
	//}

	// Fixes (appends) authentication parameters if they're required
	if workflowapp.Authentication.Required {
		//log.Printf("[INFO] Checking authentication fields and appending for %s!", workflowapp.Name)
		// FIXME:
		// Might require reflection into the python code to append the fields as well
		for index, action := range workflowapp.Actions {
			if action.AuthNotRequired {
				log.Printf("[WARNING] Skipping auth setup for: %s", action.Name)
				continue
			}

			// 1. Check if authentication params exists at all
			// 2. Check if they're present in the action
			// 3. Add them IF they DONT exist
			// 4. Fix python code with reflection (FIXME)
			appendParams := []shuffle.WorkflowAppActionParameter{}
			for _, fieldname := range workflowapp.Authentication.Parameters {
				found := false
				for index, param := range action.Parameters {
					if param.Name == fieldname.Name {
						found = true

						action.Parameters[index].Configuration = true
						//log.Printf("Set config to true for field %s!", param.Name)
						break
					}
				}

				if !found {
					appendParams = append(appendParams, shuffle.WorkflowAppActionParameter{
						Name:          fieldname.Name,
						Description:   fieldname.Description,
						Example:       fieldname.Example,
						Required:      fieldname.Required,
						Configuration: true,
						Schema:        fieldname.Schema,
					})
				}
			}

			if len(appendParams) > 0 {
				//log.Printf("[AUTH] Appending %d params to the START of %s", len(appendParams), action.Name)
				workflowapp.Actions[index].Parameters = append(appendParams, workflowapp.Actions[index].Parameters...)
			}

		}
	}

	workflowapp.ID = uuid.NewV4().String()
	workflowapp.IsValid = true
	workflowapp.Generated = false
	workflowapp.Activated = true

	if !shuffle.ArrayContains(workflowapp.Contributors, user.Id) {
		workflowapp.Contributors = append(workflowapp.Contributors, user.Id)
	}

	shuffle.SetAppRevision(ctx, workflowapp)

	err = shuffle.SetWorkflowAppDatastore(ctx, workflowapp, workflowapp.ID)
	if err != nil {
		log.Printf("[WARNING] Failed setting workflowapp: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	} else {
		log.Printf("[INFO] Added %s:%s to the database", workflowapp.Name, workflowapp.AppVersion)
	}

	cacheKey := fmt.Sprintf("workflowapps-sorted-100")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func handleUserInput(trigger shuffle.Trigger, organizationId string, workflowId string, referenceExecution string) error {
	// E.g. check email
	sms := ""
	email := ""
	subflow := ""
	triggerType := ""
	triggerInformation := ""
	for _, item := range trigger.Parameters {
		if item.Name == "alertinfo" {
			triggerInformation = item.Value
		} else if item.Name == "type" {
			triggerType = item.Value
		} else if item.Name == "email" {
			email = item.Value
		} else if item.Name == "sms" {
			sms = item.Value
		} else if item.Name == "subflow" {
			subflow = item.Value
		}
	}
	_ = subflow

	if len(triggerType) == 0 {
		log.Printf("[WARNING] No type specified for user input node")
		//return errors.New("No type specified for user input node")
	}

	// FIXME: This is not the right time to send them, BUT it's well served for testing. Save -> send email / sms
	ctx := context.Background()
	startNode := trigger.ID
	if strings.Contains(triggerType, "email") {
		action := shuffle.CloudSyncJob{
			Type:          "user_input",
			Action:        "send_email",
			OrgId:         organizationId,
			PrimaryItemId: workflowId,
			SecondaryItem: startNode,
			ThirdItem:     triggerInformation,
			FourthItem:    email,
			FifthItem:     referenceExecution,
		}

		org, err := shuffle.GetOrg(ctx, organizationId)
		if err != nil {
			log.Printf("Failed email send to cloud (1): %s", err)
			return err
		}

		err = executeCloudAction(action, org.SyncConfig.Apikey)
		if err != nil {
			log.Printf("Failed email send to cloud (2): %s", err)
			return err
		}

		log.Printf("[INFO] Should send email to %s during execution.", email)
	}

	if strings.Contains(triggerType, "sms") {
		action := shuffle.CloudSyncJob{
			Type:          "user_input",
			Action:        "send_sms",
			OrgId:         organizationId,
			PrimaryItemId: workflowId,
			SecondaryItem: startNode,
			ThirdItem:     triggerInformation,
			FourthItem:    sms,
			FifthItem:     referenceExecution,
		}

		org, err := shuffle.GetOrg(ctx, organizationId)
		if err != nil {
			log.Printf("Failed sms send to cloud (3): %s", err)
			return err
		}

		err = executeCloudAction(action, org.SyncConfig.Apikey)
		if err != nil {
			log.Printf("Failed sms send to cloud (4): %s", err)
			return err
		}

		log.Printf("[DEBUG] Should send SMS to %s during execution.", sms)
	}

	if strings.Contains(triggerType, "subflow") {
		log.Printf("[DEBUG] Should run a subflow with the result for user input.")
	}

	return nil
}

func executeSingleAction(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[WARNING] Api authentication failed in execute SINGLE workflow - CONTINUING ANYWAY: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "You need to sign up to try it out}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to execute single action: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(403)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")
	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[INFO] Failed workflowrequest POST read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()

	runValidationAction := false
	query := request.URL.Query()
	validation, ok := query["validation"]
	if ok && validation[0] == "true" {
		runValidationAction = true
	}

	workflowExecution, err := shuffle.PrepareSingleAction(ctx, user, fileId, body, runValidationAction)
	if err != nil {
		log.Printf("[INFO] Failed workflowrequest POST read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	debugUrl := fmt.Sprintf("/workflows/%s?execution_id=%s", workflowExecution.Workflow.ID, workflowExecution.ExecutionId)
	resp.Header().Add("X-Debug-Url", debugUrl)

	workflowExecution.Priority = 11
	environments, err := shuffle.GetEnvironments(ctx, user.ActiveOrg.Id)
	environment := "Shuffle"
	if len(environments) >= 1 {
		// Find default one
		environment = environments[0].Name

		for _, env := range environments {
			if env.Default {
				environment = env.Name
				break
			}
		}

	} else {
		log.Printf("[ERROR] No environments found for org %s. Exiting", user.ActiveOrg.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Enforcing same env for job + run to be default
	// FIXME: Should use environment that is in the source workflow if it exists
	for i, _ := range workflowExecution.Workflow.Actions {
		workflowExecution.Workflow.Actions[i].Environment = environment
		workflowExecution.Workflow.Actions[i].Label = "TMP"
	}
	shuffle.SetWorkflowExecution(ctx, workflowExecution, false)

	log.Printf("[INFO] Execution (single action): %s should execute onprem with execution environment \"%s\". Workflow: %s", workflowExecution.ExecutionId, environment, workflowExecution.Workflow.ID)

	executionRequest := shuffle.ExecutionRequest{
		ExecutionId:   workflowExecution.ExecutionId,
		WorkflowId:    workflowExecution.Workflow.ID,
		Authorization: workflowExecution.Authorization,
		Environments:  []string{environment},
		Priority:      11,
	}

	executionRequest.Priority = workflowExecution.Priority
	err = shuffle.SetWorkflowQueue(ctx, executionRequest, environment)
	if err != nil {
		log.Printf("[ERROR] Failed adding execution to db: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	time.Sleep(2 * time.Second)
	log.Printf("[INFO] Starting validation of execution %s", workflowExecution.ExecutionId)

	returnBody := shuffle.HandleRetValidation(ctx, workflowExecution, 1)
	returnBytes, err := json.Marshal(returnBody)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal retStruct in single execution: %s", err)
	}

	// Deleting as this is a single action and doesn't need to be stored
	shuffle.DeleteKey(ctx, "workflowexecution", executionRequest.ExecutionId)

	resp.WriteHeader(200)
	resp.Write([]byte(returnBytes))
}

// Onlyname is used to
func IterateAppGithubFolders(ctx context.Context, fs billy.Filesystem, dir []os.FileInfo, extra string, onlyname string, forceUpdate bool) ([]shuffle.BuildLaterStruct, []shuffle.BuildLaterStruct, error) {
	var err error

	allapps := []shuffle.WorkflowApp{}

	// These are slow apps to build with some funky mechanisms
	reservedNames := []string{
		"OWA",
		"NLP",
		"YARA",
		"ATTACK-PREDICTOR",
	}
	//if strings.ToUpper(workflowapp.Name) == strings.ToUpper(appname) {

	// It's here to prevent getting them in every iteration
	buildLaterFirst := []shuffle.BuildLaterStruct{}
	buildLaterList := []shuffle.BuildLaterStruct{}
	for _, file := range dir {
		if len(onlyname) > 0 && file.Name() != onlyname {
			continue
		}

		// Folder?
		switch mode := file.Mode(); {
		case mode.IsDir():
			// Specific folder for skipping
			if file.Name() == "unsupported" {
				continue
			}

			tmpExtra := fmt.Sprintf("%s%s/", extra, file.Name())
			dir, err := fs.ReadDir(tmpExtra)
			if err != nil {
				log.Printf("Failed to read dir: %s", err)
				continue
			}

			// Go routine? Hmm, this can be super quick I guess
			buildFirst, buildLast, err := IterateAppGithubFolders(ctx, fs, dir, tmpExtra, "", forceUpdate)

			for _, item := range buildFirst {
				buildLaterFirst = append(buildLaterFirst, item)
			}

			for _, item := range buildLast {
				buildLaterList = append(buildLaterList, item)
			}

			if err != nil {
				log.Printf("[WARNING] Error reading folder: %s", err)
				//buildFirst, buildLast, err := IterateAppGithubFolders(fs, dir, tmpExtra, "", forceUpdate)

				if !forceUpdate {
					continue
					//return buildLaterFirst, buildLaterList, err
				}
			}

		case mode.IsRegular():
			// Check the file
			filename := file.Name()
			if filename == "Dockerfile" {
				// Set up to make md5 and check if the app is new (api.yaml+src/app.py+Dockerfile)
				// Check if Dockerfile, app.py or api.yaml has changed. Hash?
				//log.Printf("Handle Dockerfile in location %s", extra)
				// Try api.yaml and api.yml
				fullPath := fmt.Sprintf("%s%s", extra, "api.yaml")
				fileReader, err := fs.Open(fullPath)
				if err != nil {
					fullPath = fmt.Sprintf("%s%s", extra, "api.yml")
					fileReader, err = fs.Open(fullPath)
					if err != nil {
						log.Printf("[INFO] Failed finding api.yaml/yml for file %s: %s", filename, err)
						continue
					}
				}

				//log.Printf("HANDLING DOCKER FILEREADER - SEARCH&REPLACE?")

				appfileData, err := ioutil.ReadAll(fileReader)
				if err != nil {
					log.Printf("Failed reading %s: %s", fullPath, err)
					continue
				}

				if len(appfileData) == 0 {
					log.Printf("Failed reading %s - length is 0.", fullPath)
					continue
				}

				// func md5sum(data []byte) string {
				// Make hash
				appPython := fmt.Sprintf("%s/src/app.py", extra)
				appPythonReader, err := fs.Open(appPython)
				if err != nil {
					log.Printf("Failed to read python app %s", appPython)
					continue
				}

				appPythonData, err := ioutil.ReadAll(appPythonReader)
				if err != nil {
					log.Printf("Failed reading appdata %s: %s", appPython, err)
					continue
				}

				dockerFp := fmt.Sprintf("%s/Dockerfile", extra)
				dockerfile, err := fs.Open(dockerFp)
				if err != nil {
					log.Printf("Failed to read dockerfil %s", appPython)
					continue
				}

				dockerfileData, err := ioutil.ReadAll(dockerfile)
				if err != nil {
					log.Printf("Failed to read dockerfile")
					continue
				}

				combined := []byte{}
				combined = append(combined, appfileData...)
				combined = append(combined, appPythonData...)
				combined = append(combined, dockerfileData...)
				md5 := md5sum(combined)

				var workflowapp shuffle.WorkflowApp
				err = gyaml.Unmarshal(appfileData, &workflowapp)
				if err != nil {
					log.Printf("[WARNING] Failed building workflowapp %s: %s", extra, err)
					continue
					//return buildLaterFirst, buildLaterList, errors.New(fmt.Sprintf("Failed building %s: %s", extra, err))
					//continue
				}

				newName := workflowapp.Name
				newName = strings.ReplaceAll(newName, " ", "-")

				readmeNames := []string{"README.md", "README", "readme", "readme.md", "README.MD"}
				for _, readmeName := range readmeNames {
					readmePath := fmt.Sprintf("%s%s", extra, readmeName)
					readmeInfo, err := fs.Open(readmePath)
					if err != nil {
						//log.Printf("[WARNING] Failed to read README path %s", readmePath)
						continue
					}

					fileData, err := ioutil.ReadAll(readmeInfo)
					if err != nil {
						log.Printf("[WARNING] Failed to read readme file at %s", readmePath)
						continue
					} else {
						workflowapp.Documentation = string(fileData)
						//log.Printf("[INFO] Found %s (README) file of length %d for %s:%s", readmePath, len(workflowapp.Documentation), newName, workflowapp.AppVersion)
						break
					}
				}

				if len(workflowapp.Documentation) == 0 {
					for _, readmeName := range readmeNames {
						readmePath := fmt.Sprintf("%s../%s", extra, readmeName)
						readmeInfo, err := fs.Open(readmePath)
						if err != nil {
							//log.Printf("[WARNING] Failed to read README path %s", readmePath)
							continue
						}

						fileData, err := ioutil.ReadAll(readmeInfo)
						if err != nil {
							log.Printf("[WARNING] Failed to read readme file at %s", readmePath)
							continue
						} else {
							workflowapp.Documentation = string(fileData)
							//log.Printf("[INFO] Found %s (README) file of length %d for %s:%s", readmePath, len(workflowapp.Documentation), newName, workflowapp.AppVersion)
							break
						}
					}
				}

				workflowapp.ReferenceInfo.GithubUrl = fmt.Sprintf("https://github.com/shuffle/shuffle-apps/tree/master/%s/%s", strings.ToLower(newName), workflowapp.AppVersion)

				tags := []string{
					fmt.Sprintf("%s:%s_%s", baseDockerName, strings.ToLower(newName), workflowapp.AppVersion),
				}

				if len(allapps) == 0 {
					allapps, err = shuffle.GetAllWorkflowApps(ctx, 0, 0)
					if err != nil {
						log.Printf("[WARNING] Failed getting apps to verify: %s", err)
						continue
					}
				}

				// Make an option to override existing apps?
				//Hash string `json:"hash" datastore:"hash" yaml:"hash"` // api.yaml+dockerfile+src/app.py for apps
				removeApps := []string{}
				skip := false
				for _, app := range allapps {
					if app.Name == workflowapp.Name && app.AppVersion == workflowapp.AppVersion {
						// FIXME: Check if there's a new APP_SDK as well.
						// Skip this check if app_sdk is new.
						if app.Hash == md5 && app.Hash != "" && !forceUpdate {
							skip = true
							break
						}

						//log.Printf("Overriding app %s:%s as it exists but has different hash.", app.Name, app.AppVersion)
						removeApps = append(removeApps, app.ID)
					}
				}

				if skip && !forceUpdate {
					continue
				}

				// Fixes (appends) authentication parameters if they're required
				if workflowapp.Authentication.Required {
					//log.Printf("[INFO] Checking authentication fields and appending for %s!", workflowapp.Name)
					// FIXME:
					// Might require reflection into the python code to append the fields as well
					for index, action := range workflowapp.Actions {
						if action.AuthNotRequired {
							log.Printf("Skipping auth setup: %s", action.Name)
							continue
						}

						// 1. Check if authentication params exists at all
						// 2. Check if they're present in the action
						// 3. Add them IF they DONT exist
						// 4. Fix python code with reflection (FIXME)
						appendParams := []shuffle.WorkflowAppActionParameter{}
						for _, fieldname := range workflowapp.Authentication.Parameters {
							found := false
							for index, param := range action.Parameters {
								if param.Name == fieldname.Name {
									found = true

									action.Parameters[index].Configuration = true
									//log.Printf("Set config to true for field %s!", param.Name)
									break
								}
							}

							if !found {
								appendParams = append(appendParams, shuffle.WorkflowAppActionParameter{
									Name:          fieldname.Name,
									Description:   fieldname.Description,
									Example:       fieldname.Example,
									Required:      fieldname.Required,
									Configuration: true,
									Schema:        fieldname.Schema,
								})
							}
						}

						if len(appendParams) > 0 {
							//log.Printf("[AUTH] Appending %d params to the START of %s", len(appendParams), action.Name)
							workflowapp.Actions[index].Parameters = append(appendParams, workflowapp.Actions[index].Parameters...)
						}

					}
				}

				err = checkWorkflowApp(workflowapp)
				if err != nil {
					log.Printf("[DEBUG] %s for app %s:%s", err, workflowapp.Name, workflowapp.AppVersion)
					continue
				}

				if len(removeApps) > 0 {
					for _, item := range removeApps {
						log.Printf("[WARNING] Removing duplicate app: %s", item)
						err = shuffle.DeleteKey(ctx, "workflowapp", item)
						if err != nil {
							log.Printf("[ERROR] Failed deleting duplicate %s: %s", item, err)
						}
					}
				}

				workflowapp.ID = uuid.NewV4().String()
				workflowapp.IsValid = true
				workflowapp.Verified = true
				workflowapp.Sharing = true
				workflowapp.Downloaded = true
				workflowapp.Hash = md5
				workflowapp.Public = true

				err = shuffle.SetWorkflowAppDatastore(ctx, workflowapp, workflowapp.ID)
				if err != nil {
					log.Printf("[WARNING] Failed setting workflowapp in intro: %s", err)
					continue
				}

				/*
					err = increaseStatisticsField(ctx, "total_apps_created", workflowapp.ID, 1, "")
					if err != nil {
						log.Printf("Failed to increase total apps created stats: %s", err)
					}

					err = increaseStatisticsField(ctx, "total_apps_loaded", workflowapp.ID, 1, "")
					if err != nil {
						log.Printf("Failed to increase total apps loaded stats: %s", err)
					}
				*/

				//log.Printf("Added %s:%s to the database", workflowapp.Name, workflowapp.AppVersion)

				// ID  can be used to e.g. set a build status.
				buildLater := shuffle.BuildLaterStruct{
					Tags:  tags,
					Extra: extra,
					Id:    workflowapp.ID,
				}

				reservedFound := false
				for _, appname := range reservedNames {
					if strings.ToUpper(workflowapp.Name) == strings.ToUpper(appname) {
						buildLaterList = append(buildLaterList, buildLater)

						reservedFound = true
						break
					}
				}

				/// Only upload if successful and no errors
				if !reservedFound {
					buildLaterFirst = append(buildLaterFirst, buildLater)
				} else {
					log.Printf("[WARNING] Skipping build of %s to later", workflowapp.Name)
				}
			}
		}
	}

	if len(buildLaterFirst) == 0 && len(buildLaterList) == 0 {
		return buildLaterFirst, buildLaterList, err
	}

	// This is getting silly
	cacheKey := fmt.Sprintf("workflowapps-sorted-100")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)

	newSortedList := []shuffle.BuildLaterStruct{}
	initApps := []string{
		"tools",
		"http",
		"email",
	}
	for _, buildLater := range buildLaterFirst {
		found := false
		for _, appname := range initApps {
			for _, tag := range buildLater.Tags {
				if strings.Contains(strings.ToLower(tag), appname) {
					newSortedList = append(newSortedList, buildLater)
					found = true
					break
				}
			}

			if found {
				break
			}
		}
	}

	// Prepend newSortedList to buildLaterFirst
	buildLaterFirst = append(newSortedList, buildLaterFirst...)

	if len(extra) == 0 {
		log.Printf("[INFO] Starting build of %d containers (FIRST)", len(buildLaterFirst))
		for _, item := range buildLaterFirst {
			err = buildImageMemory(fs, item.Tags, item.Extra, true)
			if err != nil {
				orgId := ""

				log.Printf("[DEBUG] Failed image build memory. Creating notification with org %#v: %s", orgId, err)

				if len(item.Tags) > 0 {
					err = shuffle.CreateOrgNotification(
						ctx,
						fmt.Sprintf("App failed to build"),
						fmt.Sprintf("The app %s with image %s failed to build. Check backend logs with docker! docker logs shuffle-backend", item.Tags[0], item.Extra),
						fmt.Sprintf("/apps"),
						orgId,
						false,
					)
				}

			} else {
				if len(item.Tags) > 0 {
					log.Printf("[INFO] Successfully built image %s", item.Tags[0])

				} else {
					log.Printf("[INFO] Successfully built Docker image")
				}
			}
		}

		if len(buildLaterList) > 0 {
			log.Printf("[INFO] Starting build of %d skipped docker images", len(buildLaterList))
			for _, item := range buildLaterList {
				err = buildImageMemory(fs, item.Tags, item.Extra, true)
				if err != nil {
					log.Printf("[INFO] Failed image build memory: %s", err)
				} else {
					if len(item.Tags) > 0 {
						log.Printf("[INFO] Successfully built image %s", item.Tags[0])
					} else {
						log.Printf("[INFO] Successfully built Docker image")
					}
				}
			}
		}
	}

	return buildLaterFirst, buildLaterList, err
}

func LoadSpecificApps(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Just need to be logged in
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[WARNING] Api authentication failed in load specific apps: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		log.Printf("[WARNING] Not admin during app loading: %s (%s).", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Not admin"}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Error with body read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Field1 & 2 can be a lot of things.
	// Field1 = Username
	// Field2 = Password
	type tmpStruct struct {
		URL         string `json:"url"`
		Branch      string `json:"branch"`
		Field1      string `json:"field_1"`
		Field2      string `json:"field_2"`
		ForceUpdate bool   `json:"force_update"`
	}
	//log.Printf("Body: %s", string(body))

	var tmpBody tmpStruct
	err = json.Unmarshal(body, &tmpBody)
	if err != nil {
		log.Printf("[WARNING] Error with unmarshal app git clone: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	fs := memfs.New()
	ctx := context.Background()
	if strings.Contains(tmpBody.URL, "github") || strings.Contains(tmpBody.URL, "gitlab") || strings.Contains(tmpBody.URL, "bitbucket") {
		cloneOptions := &git.CloneOptions{
			URL: tmpBody.URL,
		}

		if len(tmpBody.Branch) > 0 && tmpBody.Branch != "master" && tmpBody.Branch != "main" {
			cloneOptions.ReferenceName = plumbing.ReferenceName(tmpBody.Branch)
		}

		// FIXME: Better auth.
		if len(tmpBody.Field1) > 0 && len(tmpBody.Field2) > 0 {
			cloneOptions.Auth = &http2.BasicAuth{
				Username: tmpBody.Field1,
				Password: tmpBody.Field2,
			}
		}

        cloneOptions = checkGitProxy(cloneOptions)

		storer := memory.NewStorage()
		r, err := git.Clone(storer, fs, cloneOptions)
		if err != nil {
			log.Printf("[WARNING] Failed loading repo %s into memory (github apps 2): %s", tmpBody.URL, err)
			resp.WriteHeader(500)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		}

		dir, err := fs.ReadDir("/")
		if err != nil {
			log.Printf("[WARNING] FAiled reading folder: %s", err)
		}
		_ = r

		if tmpBody.ForceUpdate {
			log.Printf("[AUDIT] Running app get with force update from user %s (%s) for %s!", user.Username, user.Id, tmpBody.URL)
		} else {
			log.Printf("[AUDIT] Updating apps with updates for user %s (%s) for %s (no force)", user.Username, user.Id, tmpBody.URL)
		}

		// As it's not even Docker
		if tmpBody.ForceUpdate {
			dockercli, err := dockerclient.NewEnvClient()
			if err == nil {

				appSdk := os.Getenv("SHUFFLE_APP_SDK_VERSION")
				if len(appSdk) == 0 {
					_, err := dockercli.ImagePull(ctx, "frikky/shuffle:app_sdk", types.ImagePullOptions{})
					if err != nil {
						log.Printf("[WARNING] Failed to download new App SDK: %s", err)
					}
				} else {
					_, err := dockercli.ImagePull(ctx, fmt.Sprintf("%s/%s/shuffle-app_sdk:%s", "ghcr.io", "frikky", appSdk), types.ImagePullOptions{})
					if err != nil {
						log.Printf("[WARNING] Failed to download new App SDK %s: %s", err)
					}

				}
			} else {
				log.Printf("[WARNING] Failed to download apps with the new App SDK because of docker cli: %s", err)
			}
		}

		IterateAppGithubFolders(ctx, fs, dir, "", "", tmpBody.ForceUpdate)

	} else if strings.Contains(tmpBody.URL, "s3") {
		//https://docs.aws.amazon.com/sdk-for-go/api/service/s3/

		//sess := session.Must(session.NewSession())
		//downloader := s3manager.NewDownloader(sess)

		//// Write the contents of S3 Object to the file
		//storer := memory.NewStorage()
		//n, err := downloader.Download(storer, &s3.GetObjectInput{
		//	Bucket: aws.String(myBucket),
		//	Key:    aws.String(myString),
		//})
		//if err != nil {
		//	return fmt.Errorf("failed to download file, %v", err)
		//}
		//fmt.Printf("file downloaded, %d bytes\n", n)
	} else {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s is unsupported"}`, tmpBody.URL)))
		return
	}

	cacheKey := fmt.Sprintf("workflowapps-sorted-100")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

// Bad check for workflowapps :)
// FIXME - use tags and struct reflection
func checkWorkflowApp(workflowApp shuffle.WorkflowApp) error {
	// Validate fields
	if workflowApp.Name == "" {
		return errors.New("App field name doesn't exist")
	}

	if workflowApp.Description == "" {
		return errors.New("App field description doesn't exist")
	}

	if workflowApp.AppVersion == "" {
		return errors.New("App field app_version doesn't exist")
	}

	if workflowApp.ContactInfo.Name == "" {
		return errors.New("App field contact_info.name doesn't exist")
	}

	return nil
}

func checkUnfinishedExecution(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")
	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Workflow ID to abort is not valid"}`))
		return
	}

	executionId := location[6]
	if len(executionId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "ExecutionID not valid"}`))
		return
	}

	ctx := shuffle.GetContext(request)
	exec, err := shuffle.GetWorkflowExecution(ctx, executionId)
	if err != nil {
		log.Printf("[ERROR] Failed getting execution (rerun workflow - 1) %s: %s", executionId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting execution ID %s because it doesn't exist (abort)."}`, executionId)))
		return
	}

	apikey := request.Header.Get("Authorization")
	parsedKey := ""
	if strings.HasPrefix(apikey, "Bearer ") {
		apikeyCheck := strings.Split(apikey, " ")
		if len(apikeyCheck) == 2 {
			parsedKey = apikeyCheck[1]
		}
	}

	// ONLY allowed to run automatically with the same auth (july 2022)
	if exec.Authorization != parsedKey {
		user, err := shuffle.HandleApiAuthentication(resp, request)
		if err != nil {
			log.Printf("[ERROR][%s] Bad authorization key for execution (rerun workflow - 3): %s", executionId, err)
			resp.WriteHeader(403)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed because you're not authorized to see this workflow (3)."}`)))
			return
		}

		// Check if user is in the correct org
		if user.ActiveOrg.Id == exec.ExecutionOrg && user.Role != "org-reader" {
			log.Printf("[AUDIT][%s] User %s (%s) is force continuing execution from org access", executionId, user.Username, user.Id)
		} else if user.SupportAccess {
			log.Printf("[AUDIT][%s] User %s (%s) is force continuing execution with support access", executionId, user.Username, user.Id)
		} else {
			log.Printf("[ERROR][%s] Bad authorization key for continue execution (rerun workflow - 2): %s", executionId, err)
			resp.WriteHeader(403)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed because you're not authorized to see this workflow (2)."}`)))
			return
		}
	}

	// Meant as a function that periodically checks whether previous executions have finished or not.
	// Should probably be based on executedIds and finishedIds
	// Schedule a check in the future instead?

	// Auth vs execution check!
	extraInputs := 0
	for _, trigger := range exec.Workflow.Triggers {
		if trigger.Name == "User Input" && trigger.AppName == "User Input" {
			extraInputs += 1

			//exec.Workflow.Actions = append(exec.Workflow.Actions, shuffle.Action{
			//	ID:    trigger.ID,
			//	Label: trigger.Label,
			//	Name:  trigger.Name,
			//})
		} else if trigger.Name == "Shuffle Workflow" && trigger.AppName == "Shuffle Workflow" {
			extraInputs += 1

			//exec.Workflow.Actions = append(exec.Workflow.Actions, shuffle.Action{
			//	ID:    trigger.ID,
			//	Label: trigger.Label,
			//	Name:  trigger.Name,
			//})
		}
	}

	if exec.Status != "ABORTED" && exec.Status != "FINISHED" && exec.Status != "FAILURE" {
		log.Printf("[DEBUG][%s] Rechecking execution and its status to send to backend IF the status is EXECUTING (%s - %d/%d finished)", exec.ExecutionId, exec.Status, len(exec.Results), len(exec.Workflow.Actions)+extraInputs)
	}

	// Usually caused by issue during startup
	if exec.Status == "" {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "No status for the execution"}`)))
		return
	}

	if exec.Status != "EXECUTING" {
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Already finished"}`)))
		return
	}

	// Force it back in the queue to be executed
	if len(exec.Workflow.Actions) == 0 {
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Not a cloud env workflow. Only rerunning cloud env."}`)))
		return
	}

	log.Printf("[DEBUG][%s] Workflow: %s (%s)", exec.ExecutionId, exec.Workflow.Name, exec.Workflow.ID)
	if exec.Workflow.ID == "" || exec.Workflow.Name == "" {
		log.Printf("[ERROR][%s] No workflow ID found for execution", exec.ExecutionId)
		shuffle.DeleteKey(ctx, "workflowexecution", exec.ExecutionId)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "No workflow name / ID found. Can't run. Contact support@shuffler.io if this persists."}`)))
		return
	}

	environment := exec.Workflow.Actions[0].Environment
	log.Printf("[DEBUG][%s] Not a cloud env workflow. Re-adding job in queue for env %s.", exec.ExecutionId, environment)

	parsedEnv := fmt.Sprintf("%s_%s", strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(environment, " ", "-"), "_", "-")), exec.ExecutionOrg)
	log.Printf("[DEBUG][%s] Adding new run job to env (2): %s", exec.ExecutionId, parsedEnv)

	executionRequest := shuffle.ExecutionRequest{
		ExecutionId:   exec.ExecutionId,
		WorkflowId:    exec.Workflow.ID,
		Authorization: exec.Authorization,
		Environments:  []string{environment},
	}

	// Increase priority on reruns to catch up
	executionRequest.Priority = 11
	err = shuffle.SetWorkflowQueue(ctx, executionRequest, parsedEnv)
	if err != nil {
		log.Printf("[ERROR] Failed adding execution to db: %s", err)
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Reran workflow in %s"}`, parsedEnv)))

}
