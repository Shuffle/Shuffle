//go:build integration

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
	uuid "github.com/satori/go.uuid"
	"github.com/shuffle/opensearch-go/v4/opensearchapi"
	"github.com/shuffle/shuffle-shared"
)

func requireIntegrationBackends(t *testing.T) context.Context {
	t.Helper()

	if os.Getenv("SHUFFLE_OPENSEARCH_URL") == "" || os.Getenv("SHUFFLE_MEMCACHED") == "" {
		t.Skip("integration backends not configured")
	}

	if _, err := shuffle.RunInit(datastore.Client{}, storage.Client{}, "shuffle-integration", "onprem", true, "opensearch", false, 0); err != nil {
		t.Fatalf("RunInit: %s", err)
	}
	shuffle.InitOpensearchIndexes()

	return context.Background()
}

func executionSeqNo(t *testing.T, ctx context.Context, executionId string) int64 {
	t.Helper()

	index := strings.ToLower(shuffle.GetESIndexPrefix("workflowexecution"))
	resp, err := shuffle.GetProject().Es.Document.Get(ctx, opensearchapi.DocumentGetReq{
		Index:      index,
		DocumentID: executionId,
	})
	if err != nil {
		t.Fatalf("get execution document: %s", err)
	}

	defer resp.Inspect().Response.Body.Close()
	body, err := io.ReadAll(resp.Inspect().Response.Body)
	if err != nil {
		t.Fatalf("read execution document: %s", err)
	}

	parsed := struct {
		SeqNo int64 `json:"_seq_no"`
	}{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		t.Fatalf("parse execution document: %s", err)
	}

	return parsed.SeqNo
}

func TestLateExecutionUpdatesAreRejectedAfterFinished(t *testing.T) {
	ctx := requireIntegrationBackends(t)

	action := shuffle.Action{ID: "action-" + uuid.NewV4().String(), Name: "action", AppName: "execute_python", Label: "Action"}
	workflow := shuffle.Workflow{
		ID:      uuid.NewV4().String(),
		Name:    "terminal-state-test",
		Actions: []shuffle.Action{action},
	}
	execution := shuffle.WorkflowExecution{
		ExecutionId:   uuid.NewV4().String(),
		ExecutionOrg:  uuid.NewV4().String(),
		WorkflowId:    workflow.ID,
		Authorization: uuid.NewV4().String(),
		Status:        "FINISHED",
		Workflow:      workflow,
		Results: []shuffle.ActionResult{
			{
				Action:      action,
				Status:      "SUCCESS",
				Result:      `{"success":true}`,
				CompletedAt: 1,
			},
		},
	}

	if err := shuffle.SetWorkflowExecution(ctx, execution, true); err != nil {
		t.Fatalf("SetWorkflowExecution: %s", err)
	}

	t.Cleanup(func() {
		shuffle.DeleteKey(context.Background(), "workflowexecution", execution.ExecutionId)
	})

	seqBefore := executionSeqNo(t, ctx, execution.ExecutionId)

	// A late worker snapshot must not be re-saved after FINISHED.
	lateSnapshot := execution
	lateSnapshot.Status = "EXECUTING"
	lateSnapshot.CompletedAt = 0
	snapshotBody, err := json.Marshal(lateSnapshot)
	if err != nil {
		t.Fatalf("marshal snapshot: %s", err)
	}

	snapshotRequest := httptest.NewRequest(http.MethodPost, "/api/v1/streams", bytes.NewReader(snapshotBody))
	snapshotRecorder := httptest.NewRecorder()
	handleSetWorkflowExecution(snapshotRecorder, snapshotRequest)

	if snapshotRecorder.Code != http.StatusConflict {
		t.Fatalf("expected 409 for a late snapshot, got %d: %s", snapshotRecorder.Code, snapshotRecorder.Body.String())
	}

	if seqAfter := executionSeqNo(t, ctx, execution.ExecutionId); seqAfter != seqBefore {
		t.Fatalf("late snapshot changed the execution document: seq %d -> %d", seqBefore, seqAfter)
	}

	// A late ActionResult must be rejected as well.
	lateResult := shuffle.ActionResult{
		ExecutionId:   execution.ExecutionId,
		Authorization: execution.Authorization,
		Action:        action,
		Status:        "SUCCESS",
		Result:        `{"success":true}`,
	}
	resultBody, err := json.Marshal(lateResult)
	if err != nil {
		t.Fatalf("marshal action result: %s", err)
	}

	resultRequest := httptest.NewRequest(http.MethodPost, "/api/v1/streams", bytes.NewReader(resultBody))
	resultRecorder := httptest.NewRecorder()
	handleSetWorkflowExecution(resultRecorder, resultRequest)

	if resultRecorder.Code != http.StatusConflict {
		t.Fatalf("expected 409 for a late ActionResult, got %d: %s", resultRecorder.Code, resultRecorder.Body.String())
	}

	if seqAfter := executionSeqNo(t, ctx, execution.ExecutionId); seqAfter != seqBefore {
		t.Fatalf("late ActionResult changed the execution document: seq %d -> %d", seqBefore, seqAfter)
	}

	// reset=true must not bypass the FINISHED barrier for an ActionResult.
	resetResultRequest := httptest.NewRequest(http.MethodPost, "/api/v1/streams?reset=true", bytes.NewReader(resultBody))
	resetResultRecorder := httptest.NewRecorder()
	handleSetWorkflowExecution(resetResultRecorder, resetResultRequest)

	if resetResultRecorder.Code != http.StatusConflict {
		t.Fatalf("expected reset=true ActionResult to be rejected with 409, got %d: %s", resetResultRecorder.Code, resetResultRecorder.Body.String())
	}

	if seqAfter := executionSeqNo(t, ctx, execution.ExecutionId); seqAfter != seqBefore {
		t.Fatalf("reset=true ActionResult changed the execution document: seq %d -> %d", seqBefore, seqAfter)
	}

	// Seed per-action caches; an explicit reset must clear them so the next run
	// cannot resurrect stale results or sent-markers.
	resultCacheKey := fmt.Sprintf("%s_%s_result", execution.ExecutionId, action.ID)
	sentCacheKey := fmt.Sprintf("%s_%s_sent", execution.ExecutionId, action.ID)
	if err := shuffle.SetCache(ctx, resultCacheKey, []byte("stale-result"), 60); err != nil {
		t.Fatalf("seed result cache: %s", err)
	}
	if err := shuffle.SetCache(ctx, sentCacheKey, []byte("stale-sent"), 60); err != nil {
		t.Fatalf("seed sent cache: %s", err)
	}

	// An explicit reset snapshot is a deliberate override used by the standalone
	// worker. It must actually apply the reset, not return a no-op 200.
	resetSnapshot := lateSnapshot
	resetSnapshot.Results = nil
	resetSnapshot.Status = "EXECUTING"
	resetSnapshot.CompletedAt = 0
	resetBody, err := json.Marshal(resetSnapshot)
	if err != nil {
		t.Fatalf("marshal reset snapshot: %s", err)
	}

	resetRequest := httptest.NewRequest(http.MethodPost, "/api/v1/streams?reset=true", bytes.NewReader(resetBody))
	resetRecorder := httptest.NewRecorder()
	handleSetWorkflowExecution(resetRecorder, resetRequest)

	if resetRecorder.Code != http.StatusOK {
		t.Fatalf("expected a reset snapshot to return 200, got %d: %s", resetRecorder.Code, resetRecorder.Body.String())
	}

	resetExecution, err := shuffle.GetWorkflowExecution(ctx, execution.ExecutionId, true)
	if err != nil {
		t.Fatalf("get reset execution: %s", err)
	}

	if resetExecution.Status != "EXECUTING" {
		t.Fatalf("expected reset execution status EXECUTING, got %q", resetExecution.Status)
	}

	if len(resetExecution.Results) != 0 {
		t.Fatalf("expected reset execution to have no results, got %d", len(resetExecution.Results))
	}

	if seqAfter := executionSeqNo(t, ctx, execution.ExecutionId); seqAfter <= seqBefore {
		t.Fatalf("reset snapshot did not persist: seq %d -> %d", seqBefore, seqAfter)
	}

	if _, err := shuffle.GetCache(ctx, resultCacheKey); err == nil {
		t.Fatal("reset left the stale per-action result cache in place")
	}

	if _, err := shuffle.GetCache(ctx, sentCacheKey); err == nil {
		t.Fatal("reset left the stale per-action sent cache in place")
	}
}
