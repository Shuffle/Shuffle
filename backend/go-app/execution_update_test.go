package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	shuffle "github.com/shuffle/shuffle-shared"
)

func TestFullExecutionUpdateRejection(t *testing.T) {
	t.Setenv("SHUFFLE_MEMCACHED", "")
	previous := shuffle.GetProject()
	if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "worker", true, "", false, 0); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
		if err != nil {
			t.Error(err)
		}
	})
	for _, tc := range []struct {
		name, status, auth string
		extraAction        bool
		want               int
	}{
		{"rejected snapshot", "EXECUTING", "fixture-auth", true, 503},
		{"already finished", "FINISHED", "fixture-auth", false, 200},
		{"wrong authorization", "FINISHED", "wrong-auth", false, 401},
	} {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			stored := shuffle.WorkflowExecution{ExecutionId: "snapshot-fixture", Authorization: "fixture-auth", Status: tc.status,
				Workflow: shuffle.Workflow{Actions: []shuffle.Action{{ID: "original"}}}}
			key := "workflowexecution_" + stored.ExecutionId
			data, err := json.Marshal(stored)
			if err != nil {
				t.Fatal(err)
			}
			if err := shuffle.SetCache(ctx, key, data, 1); err != nil {
				t.Fatal(err)
			}
			defer shuffle.DeleteCache(ctx, key)
			incoming := stored
			incoming.Authorization = tc.auth
			if tc.extraAction {
				incoming.Workflow.Actions = append(incoming.Workflow.Actions, shuffle.Action{ID: "unexpected"})
			}
			body, err := json.Marshal(incoming)
			if err != nil {
				t.Fatal(err)
			}
			request := httptest.NewRequest(http.MethodPost, "/api/v1/streams", bytes.NewReader(body))
			response := httptest.NewRecorder()
			handleSetWorkflowExecution(response, request)
			if response.Code != tc.want {
				t.Fatalf("HTTP %d, want %d: %s", response.Code, tc.want, response.Body.String())
			}
			after, err := shuffle.GetWorkflowExecution(ctx, stored.ExecutionId)
			if err != nil {
				t.Fatal(err)
			}
			if after.Status != stored.Status || len(after.Results) != 0 || len(after.Workflow.Actions) != 1 {
				t.Fatal("rejected snapshot changed execution state")
			}
		})
	}
}

func TestQueueFailoverRejectionStopsResponse(t *testing.T) {
	t.Setenv("SHUFFLE_MEMCACHED", "")
	previous := shuffle.GetProject()
	if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "worker", true, "", false, 0); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
	})
	ctx := context.Background()
	environments := []shuffle.Environment{{Id: "fixture-environment", Name: "Shuffle", OrgId: "fixture-org", Checkin: time.Now().Unix(), OrborusUuid: "leader"}}
	data, _ := json.Marshal(environments)
	if err := shuffle.SetCache(ctx, "Environments_fixture-org", data, 1); err != nil {
		t.Fatal(err)
	}
	defer shuffle.DeleteCache(ctx, "Environments_fixture-org")
	request := httptest.NewRequest(http.MethodPost, "/api/v1/workflows/queue", strings.NewReader(`{"uuid":"standby"}`))
	request.Header.Set("Org-Id", "Shuffle")
	request.Header.Set("Org", "fixture-org")
	response := httptest.NewRecorder()
	defer func() {
		if err := recover(); err != nil {
			t.Fatalf("rejected standby continued into queue handling: %v", err)
		}
	}()
	handleGetWorkflowqueue(response, request)
	var acknowledgement struct {
		Success bool `json:"success"`
	}
	if response.Code != http.StatusConflict || json.Unmarshal(response.Body.Bytes(), &acknowledgement) != nil || acknowledgement.Success {
		t.Fatalf("failover rejection was combined with a queue response: HTTP=%d body=%s", response.Code, response.Body.String())
	}
}

func TestRecoveryDeliversCompletedChild(t *testing.T) {
	for _, tc := range []struct{ missingReference, failedStart bool }{{false, false}, {true, false}, {true, true}} {
		t.Run(fmt.Sprintf("legacy cache reference=%v startup failure=%v", tc.missingReference, tc.failedStart), func(t *testing.T) {
			ctx := context.Background()
			const parentID = "00000000-0000-4000-8000-000000000911"
			const workflowID = "00000000-0000-4000-8000-000000000912"
			const childID = "00000000-0000-4000-8000-000000000913"
			subflow := shuffle.Action{ID: "subflow-node", AppName: "shuffle-subflow", Environment: "Shuffle",
				Parameters: []shuffle.WorkflowAppActionParameter{{Name: "check_result", Value: "true"}}}
			next := shuffle.Action{ID: "next-node", AppName: "fixture", Environment: "Shuffle"}
			parent := shuffle.WorkflowExecution{ExecutionId: parentID, WorkflowId: workflowID, Authorization: "parent-auth", ExecutionOrg: "fixture-org", Status: "EXECUTING", StartedAt: time.Now().Add(-10 * time.Minute).Unix(),
				Workflow: shuffle.Workflow{ID: workflowID, Name: "callback recovery", Actions: []shuffle.Action{subflow, next}},
				Results: []shuffle.ActionResult{{Action: subflow, ExecutionId: parentID, Authorization: "parent-auth", Status: "WAITING",
					Result: `{"success":true,"execution_id":"` + childID + `","authorization":"child-auth"}`}}}
			child := shuffle.WorkflowExecution{ExecutionId: childID, Authorization: "child-auth", Status: "FINISHED", Result: "completed child value",
				ExecutionParent: parentID, ExecutionSourceNode: subflow.ID, ExecutionSourceAuth: parent.Authorization}
			parent.Workflow.Configuration.SkipNotifications = true
			parent.Workflow.Configuration.ExitOnError = tc.failedStart
			reference := parent.Results[0].Result
			if tc.failedStart {
				reference = `{"success":false,"reason":"child workflow does not exist"}`
			}
			if tc.missingReference {
				parent.Results = nil
			}
			queued, callbacks, terminalWrites := 0, 0, 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				switch {
				case r.URL.Path == "/":
					io.WriteString(w, `{"version":{"number":"3.2.0","distribution":"opensearch"}}`)
				case r.URL.Path == "/workflowexecution/_search":
					data, _ := json.Marshal(parent)
					fmt.Fprintf(w, `{"hits":{"hits":[{"_source":%s}]}}`, data)
				case r.URL.Path == "/org_cache/_search":
					io.WriteString(w, `{"hits":{"hits":[]}}`)
				case r.URL.Path == "/api/v1/streams/results":
					current, err := shuffle.GetWorkflowExecution(ctx, parentID)
					if err != nil {
						t.Error(err)
					}
					json.NewEncoder(w).Encode(current)
				case r.URL.Path == "/api/v1/streams":
					callbacks++
					handleSetWorkflowExecution(w, r)
				case strings.HasSuffix(r.URL.Path, "/rerun"):
					checkUnfinishedExecution(w, r)
				case r.Method == http.MethodPut && r.URL.Path == "/workflowqueue-shuffle/_doc/"+parentID:
					queued++
					io.WriteString(w, `{"result":"created"}`)
				case r.Method == http.MethodPut && r.URL.Path == "/workflowexecution/_doc/"+parentID:
					var execution shuffle.WorkflowExecution
					if err := json.NewDecoder(r.Body).Decode(&execution); err != nil {
						t.Error(err)
					}
					if execution.Status == "FINISHED" {
						terminalWrites++
					}
					io.WriteString(w, `{"result":"updated"}`)
				default:
					t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
					w.WriteHeader(404)
				}
			}))
			defer server.Close()
			for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "SHUFFLE_INTERNAL_HTTP_PROXY", "SHUFFLE_INTERNAL_HTTPS_PROXY", "SHUFFLE_MEMCACHED", "SHUFFLE_OPENSEARCH_INDEX_PREFIX"} {
				t.Setenv(key, "")
			}
			t.Setenv("SHUFFLE_PROTECTED_CLEANUP_DISABLED", "true")
			t.Setenv("SHUFFLE_DISABLE_RERUN_AND_ABORT", "false")
			t.Setenv("SHUFFLE_SWARM_CONFIG", "run")
			t.Setenv("BASE_URL", server.URL)
			t.Setenv("SHUFFLE_OPENSEARCH_URL", server.URL)
			previous := shuffle.GetProject()
			defer func() {
				_, _ = shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
			}()
			if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "onprem", true, "opensearch", false, 0); err != nil {
				t.Fatal(err)
			}
			if tc.missingReference {
				key := parentID + "_" + subflow.ID + "_sinkholed_result"
				if err := shuffle.SetCache(ctx, key, []byte(reference), 1); err != nil {
					t.Fatal(err)
				}
				defer shuffle.DeleteCache(ctx, key)
			}
			for key, value := range map[string]interface{}{
				"workflowexecution_" + parentID: parent, "workflowexecution_" + childID: child,
				parentID + "_cacheset": true, "validation_" + parentID: map[string]interface{}{},
			} {
				data, err := json.Marshal(value)
				if err != nil {
					t.Fatal(err)
				}
				if err := shuffle.SetCache(ctx, key, data, 1); err != nil {
					t.Fatal(err)
				}
				defer shuffle.DeleteCache(ctx, key)
			}
			if err := recoverOnpremExecutions(ctx, server.URL); err != nil {
				t.Fatal(err)
			}
			current, err := shuffle.GetWorkflowExecution(ctx, parentID)
			if err != nil {
				t.Fatal(err)
			}
			if tc.failedStart {
				if callbacks != 1 || queued != 0 || (current.Status != "ABORTED" && current.Status != "FAILURE") || len(current.Results) != 1 || current.Results[0].Status != "FAILURE" {
					t.Fatalf("legacy startup failure remained active: callbacks=%d queued=%d status=%s", callbacks, queued, current.Status)
				}
				return
			}
			if callbacks != 1 || queued != 1 || len(current.Results) != 1 || current.Results[0].Status != "SUCCESS" {
				t.Fatalf("completed child was not delivered before resuming the parent: callbacks=%d queued=%d results=%+v", callbacks, queued, current.Results)
			}
			// Finish the remaining parent action through the real result handler.
			result := shuffle.ActionResult{Action: next, ExecutionId: parentID, Authorization: parent.Authorization, Status: "SUCCESS", Result: "parent finished"}
			body, _ := json.Marshal(result)
			response := httptest.NewRecorder()
			handleSetWorkflowExecution(response, httptest.NewRequest(http.MethodPost, "/api/v1/streams", bytes.NewReader(body)))
			current, err = shuffle.GetWorkflowExecution(ctx, parentID)
			if err != nil {
				t.Fatal(err)
			}
			if response.Code != 200 || current.Status != "FINISHED" || terminalWrites == 0 {
				t.Fatalf("parent did not finish durably: HTTP=%d status=%s terminal writes=%d", response.Code, current.Status, terminalWrites)
			}
		})
	}
}

func TestOnpremRerunUsesPolledQueue(t *testing.T) {
	t.Setenv("SHUFFLE_PROTECTED_CLEANUP_DISABLED", "true")
	const executionID = "00000000-0000-4000-8000-000000000901"
	const workflowID = "00000000-0000-4000-8000-000000000902"
	for _, rejectQueue := range []bool{false, true} {
		t.Run(fmt.Sprintf("queue failure=%v", rejectQueue), func(t *testing.T) {
			queued := ""
			execution := shuffle.WorkflowExecution{ExecutionId: executionID, Authorization: "fixture-auth", Status: "EXECUTING", ExecutionOrg: "fixture-org",
				Workflow: shuffle.Workflow{ID: workflowID, Name: "recovery fixture", Actions: []shuffle.Action{{ID: "pending-action", Environment: "Shuffle"}}}}
			data, err := json.Marshal(execution)
			if err != nil {
				t.Fatal(err)
			}
			scrollRead, scrollDeleted := false, false
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				if r.URL.Path == "/" {
					io.WriteString(w, `{"version":{"number":"3.2.0","distribution":"opensearch"}}`)
					return
				}
				if r.Method == http.MethodPost && r.URL.Path == "/org_cache/_search" {
					io.WriteString(w, `{"hits":{"hits":[]}}`)
					return
				}
				if r.Method == http.MethodPost && r.URL.Path == "/workflowexecution/_search" {
					fmt.Fprintf(w, `{"_scroll_id":"fixture-scroll","hits":{"hits":[{"_source":%s}]}}`, data)
					return
				}
				if r.Method == http.MethodPost && r.URL.Path == "/_search/scroll" {
					scrollRead = true
					io.WriteString(w, `{"_scroll_id":"fixture-scroll","hits":{"hits":[]}}`)
					return
				}
				if r.Method == http.MethodDelete && strings.HasPrefix(r.URL.Path, "/_search/scroll") {
					scrollDeleted = true
					io.WriteString(w, `{"succeeded":true}`)
					return
				}
				if strings.HasSuffix(r.URL.Path, "/rerun") {
					checkUnfinishedExecution(w, r)
					return
				}
				if r.Method == http.MethodPut && strings.Contains(r.URL.Path, "/_doc/") {
					queued = r.URL.Path
					var job shuffle.ExecutionRequest
					if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
						t.Error(err)
					}
					if job.ExecutionId != executionID || job.Authorization != "fixture-auth" {
						t.Error("recovery changed execution identity")
					}
					if rejectQueue {
						w.WriteHeader(http.StatusServiceUnavailable)
						io.WriteString(w, `{"error":{"type":"unavailable","reason":"fixture"},"status":503}`)
						return
					}
					io.WriteString(w, `{"result":"created"}`)
					return
				}
				t.Errorf("unexpected storage request: %s %s", r.Method, r.URL.Path)
				w.WriteHeader(http.StatusNotFound)
			}))
			defer server.Close()
			t.Setenv("SHUFFLE_MEMCACHED", "")
			t.Setenv("SHUFFLE_DISABLE_RERUN_AND_ABORT", "false")
			t.Setenv("SHUFFLE_OPENSEARCH_URL", server.URL)
			t.Setenv("SHUFFLE_OPENSEARCH_INDEX_PREFIX", "")
			t.Setenv("SHUFFLE_OPENSEARCH_USERNAME", "fixture")
			t.Setenv("SHUFFLE_OPENSEARCH_PASSWORD", "fixture")
			previous := shuffle.GetProject()
			defer func() {
				_, _ = shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
			}()
			if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "onprem", true, "opensearch", false, 0); err != nil {
				t.Fatal(err)
			}
			key := "workflowexecution_" + executionID
			if err := shuffle.SetCache(context.Background(), key, data, 1); err != nil {
				t.Fatal(err)
			}
			defer shuffle.DeleteCache(context.Background(), key)
			request := httptest.NewRequest(http.MethodPost, "/api/v1/workflows/"+workflowID+"/executions/"+executionID+"/rerun", nil)
			request.Header.Set("Authorization", "Bearer fixture-auth")
			response := httptest.NewRecorder()
			checkUnfinishedExecution(response, request)
			if queued != "/workflowqueue-shuffle/_doc/"+executionID {
				t.Fatalf("recovery wrote to unpolled queue %q", queued)
			}
			want := http.StatusOK
			if rejectQueue {
				want = http.StatusServiceUnavailable
			}
			if response.Code != want {
				t.Fatalf("HTTP %d, want %d: %s", response.Code, want, response.Body.String())
			}
			queued = ""
			err = recoverOnpremExecutions(context.Background(), server.URL)
			if (err != nil) != rejectQueue {
				t.Fatalf("persisted recovery error=%v, queue failure=%v", err, rejectQueue)
			}
			if queued != "/workflowqueue-shuffle/_doc/"+executionID {
				t.Fatalf("persisted recovery missed polled queue: %q", queued)
			}
			if !scrollRead || !scrollDeleted {
				t.Fatal("persisted recovery did not finish and close its paginated scan")
			}
			// A persisted EXECUTING hit must not override a current intentional wait.
			execution.Status = "WAITING"
			waiting, err := json.Marshal(execution)
			if err != nil {
				t.Fatal(err)
			}
			if err := shuffle.SetCache(context.Background(), key, waiting, 1); err != nil {
				t.Fatal(err)
			}
			queued = ""
			if err := recoverOnpremExecutions(context.Background(), server.URL); err != nil {
				t.Fatal(err)
			}
			if queued != "" {
				t.Fatal("recovery restarted an intentionally waiting execution")
			}
			// The direct recovery endpoint must also leave completed runs alone.
			execution.Status = "FINISHED"
			finished, err := json.Marshal(execution)
			if err != nil {
				t.Fatal(err)
			}
			if err := shuffle.SetCache(context.Background(), key, finished, 1); err != nil {
				t.Fatal(err)
			}
			response = httptest.NewRecorder()
			request = httptest.NewRequest(http.MethodPost, "/api/v1/workflows/"+workflowID+"/executions/"+executionID+"/rerun", nil)
			request.Header.Set("Authorization", "Bearer fixture-auth")
			checkUnfinishedExecution(response, request)
			if response.Code != http.StatusOK || queued != "" {
				t.Fatal("recovery requeued completed work")
			}
		})
	}
}
