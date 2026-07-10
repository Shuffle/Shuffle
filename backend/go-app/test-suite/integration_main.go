//go:build integration

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	//"log"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
	gomemcache "github.com/bradfitz/gomemcache/memcache"
	uuid "github.com/satori/go.uuid"
	shuffle "github.com/shuffle/shuffle-shared"
)

// This suite is a focused integration check for Shuffle's OpenSearch and
// Memcached storage behavior. It is not intended to cover the entire backend.

const defaultTestIndexPrefix = ""

func main() {
	testing.Main(regexp.MatchString, []testing.InternalTest{
//		{Name: "TestMemcacheCounterUpdate", F: TestMemcacheCounterUpdate},
		{Name: "TestWorkflowStorageRoundTrip", F: TestWorkflowStorageRoundTrip},
		{Name: "TestWorkflowExecutionPreparation", F: TestWorkflowExecutionPreparation},
	}, nil, nil)
}

var (
	initializeOnce sync.Once
	initializeErr  error
)

func initializeIntegrationBackends(t *testing.T) {
	t.Helper()

	if strings.TrimSpace(os.Getenv("SHUFFLE_OPENSEARCH_URL")) == "" {
		t.Fatal("SHUFFLE_OPENSEARCH_URL must point to the OpenSearch instance used for integration tests")
	}
	memcacheAddress := strings.TrimSpace(os.Getenv("SHUFFLE_MEMCACHED"))
	if memcacheAddress == "" {
		t.Fatal("SHUFFLE_MEMCACHED must be set before go test starts so shuffle-shared uses the test Memcached instance")
	}

	prefix := strings.TrimSpace(os.Getenv("SHUFFLE_TEST_OPENSEARCH_INDEX_PREFIX"))
	if prefix == "" {
		prefix = defaultTestIndexPrefix
	}
	if err := os.Setenv("SHUFFLE_OPENSEARCH_INDEX_PREFIX", prefix); err != nil {
		t.Fatalf("set integration-test OpenSearch index prefix: %v", err)
	}

	initializeOnce.Do(func() {
		mc := gomemcache.New(memcacheAddress)
		mc.Timeout = 10 * time.Second
		if err := mc.Ping(); err != nil {
			initializeErr = fmt.Errorf("ping Memcached at %s: %w", memcacheAddress, err)
			return
		}

		_, initializeErr = shuffle.RunInit(
			datastore.Client{},
			storage.Client{},
			"shuffle-integration",
			"onprem",
			true,
			"opensearch",
			false,
			0,
		)

		shuffle.InitOpensearchIndexes()
	})
	if initializeErr != nil {
		t.Fatalf("initialize Shuffle integration backends: %v", initializeErr)
	}
}

func TestMemcacheCounterUpdate(t *testing.T) {
	initializeIntegrationBackends(t)

	ctx := context.Background()
	organizationID := uuid.NewV4().String()
	dataType := "api_usage"
	key := fmt.Sprintf("cache_%s_%s", organizationID, dataType)
	registerCacheCleanup(t, key)

	shuffle.IncrementCache(ctx, organizationID, dataType, 2)
	requireCacheCounter(t, ctx, key, 2)

	shuffle.IncrementCache(ctx, organizationID, dataType, 3)
	requireCacheCounter(t, ctx, key, 5)
}

func TestWorkflowStorageRoundTrip(t *testing.T) {
	initializeIntegrationBackends(t)

	workflowID := uuid.NewV4().String()
	organizationID := "d080eb37-2f1e-4ed5-af12-f526c48372ec"
	actionID :=  uuid.NewV4().String()
	workflowCacheKey := "workflow_" + workflowID

	cleanupWorkflow := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := shuffle.DeleteKey(ctx, "workflow", workflowID, organizationID); err != nil {
			t.Errorf("clean up workflow %s: %v", workflowID, err)
		}
	}
	t.Cleanup(cleanupWorkflow)

	workflow := shuffle.Workflow{
		ID:                   workflowID,
		Name:                 "OpenSearch integration test workflow",
		Description:          "Created by the direct OpenSearch integration suite",
		OrgId:                organizationID,
		ExecutionEnvironment: "onprem",
		IsValid:              true,
		Start:                actionID,
		Actions: []shuffle.Action{
			{
				ID:          actionID,
				Name:        "integration_test_action",
				Label:       "Integration test action",
				AppName:     "integration-test",
				AppVersion:  "1.0.0",
				Environment: "Shuffle",
				IsStartNode: true,
				IsValid:     true,
			},
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()


	if err := shuffle.SetWorkflow(ctx, workflow, workflowID); err != nil {
		t.Fatalf("save workflow: %v", err)
	}
	_ = workflowCacheKey
	requireCachedWorkflow(t, ctx, workflowCacheKey, workflowID, workflow.Name)

	stored, err := shuffle.GetWorkflow(ctx, workflowID, true)
	if err != nil {
		t.Fatalf("read saved workflow: %v", err)
	}
	assertWorkflow(t, stored, workflowID, organizationID, actionID, workflow.Name)
	requireCachedWorkflow(t, ctx, workflowCacheKey, workflowID, workflow.Name)

	updatedName := "Updated OpenSearch integration test workflow"
	stored.Name = updatedName
	if err := shuffle.SetWorkflow(ctx, *stored, workflowID); err != nil {
		t.Fatalf("update workflow: %v", err)
	}
	requireCachedWorkflow(t, ctx, workflowCacheKey, workflowID, updatedName)

	updated, err := shuffle.GetWorkflow(ctx, workflowID, true)
	if err != nil {
		t.Fatalf("read updated workflow: %v", err)
	}
	assertWorkflow(t, updated, workflowID, organizationID, actionID, updatedName)

	if err := shuffle.DeleteKey(ctx, "workflow", workflowID, organizationID); err != nil {
		t.Fatalf("delete workflow: %v", err)
	}
	if deleted, err := shuffle.GetWorkflow(ctx, workflowID, true); err == nil {
		t.Fatalf("deleted workflow is still readable: %#v", deleted)
	}
	if cached, err := shuffle.GetCache(ctx, workflowCacheKey); err == nil {
		t.Fatalf("deleted workflow is still cached: %#v", cached)
	}
}

func TestWorkflowExecutionPreparation(t *testing.T) {
	initializeIntegrationBackends(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	workflowID := uuid.NewV4().String()
	organizationID := "d080eb37-2f1e-4ed5-af12-f526c48372ec"
	actionID := uuid.NewV4().String()
	environmentID := uuid.NewV4().String()
	executionID := uuid.NewV4().String()

	environment := shuffle.Environment{
		Id:         environmentID,
		Name:       "Shuffle",
		Type:       "onprem",
		OrgId:      organizationID,
		Registered: true,
		Default:    true,
	}
	if err := shuffle.SetEnvironment(ctx, &environment); err != nil {
		t.Fatalf("save execution environment: %v", err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()

		if err := shuffle.DeleteKey(cleanupCtx, "Environments", environmentID); err != nil {
			t.Errorf("clean up execution environment %s: %v", environmentID, err)
		}
	})

	workflow := shuffle.Workflow{
		ID:                   workflowID,
		Name:                 "OpenSearch integration test workflow",
		Description:          "Created by the direct OpenSearch integration suite",
		OrgId:                organizationID,
		ExecutingOrg:         shuffle.OrgMini{Id: organizationID},
		ExecutionEnvironment: "onprem",
		Start:                actionID,
		IsValid:              true,
		Actions: []shuffle.Action{
			{
				ID:          actionID,
				Name:        "integration_test_action",
				Label:       "Integration test action",
				AppName:     "integration-test",
				AppVersion:  "1.0.0",
				Environment: "Shuffle",
				IsStartNode: true,
				IsValid:     true,
			},
		},
	}
	if err := shuffle.SetWorkflow(ctx, workflow, workflowID); err != nil {
		t.Fatalf("save workflow for execution: %v", err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()

		if err := shuffle.DeleteKey(cleanupCtx, "workflow", workflowID, organizationID); err != nil {
			t.Errorf("clean up execution workflow %s: %v", workflowID, err)
		}
	})

	payload := shuffle.ExecutionRequest{
		ExecutionId:       executionID,
		ExecutionSource:   "integration_test",
		ExecutionArgument: `{"message":"hello from integration test"}`,
		Start:             actionID,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal execution payload: %v", err)
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/workflows/"+workflowID+"/execute",
		bytes.NewReader(jsonPayload),
	)
	request.Header.Set("Content-Type", "application/json")

	execution, executionInfo, reason, err := shuffle.PrepareWorkflowExecution(ctx, workflow, request, 10)
	if err != nil {
		t.Fatalf("prepare workflow execution: %s: %v", reason, err)
	}

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()

		if err := shuffle.DeleteKey(cleanupCtx, "workflowexecution", executionID, organizationID); err != nil {
			t.Errorf("clean up workflow execution %s: %v", executionID, err)
		}
	})
	if err := shuffle.SetWorkflowExecution(ctx, execution, true); err != nil {
		t.Fatalf("save workflow execution: %v", err)
	}

	storedExecution, err := shuffle.GetWorkflowExecution(ctx, executionID)
	if err != nil {
		t.Fatalf("read saved workflow execution: %v", err)
	}

	if storedExecution.ExecutionId != executionID {
		t.Errorf("unexpected execution ID: got %q, want %q", storedExecution.ExecutionId, executionID)
	}
	if storedExecution.WorkflowId != workflowID {
		t.Errorf("unexpected execution workflow ID: got %q, want %q", storedExecution.WorkflowId, workflowID)
	}
	if storedExecution.ExecutionOrg != organizationID {
		t.Errorf("unexpected execution organization: got %q, want %q", storedExecution.ExecutionOrg, organizationID)
	}
	if storedExecution.Start != actionID {
		t.Errorf("unexpected execution start node: got %q, want %q", storedExecution.Start, actionID)
	}
	if storedExecution.ExecutionSource != payload.ExecutionSource {
		t.Errorf("unexpected execution source: got %q, want %q", storedExecution.ExecutionSource, payload.ExecutionSource)
	}
	if storedExecution.ExecutionArgument != payload.ExecutionArgument {
		t.Errorf("unexpected execution argument: got %q, want %q", storedExecution.ExecutionArgument, payload.ExecutionArgument)
	}
	if storedExecution.Status != "EXECUTING" {
		t.Errorf("unexpected execution status: got %q, want %q", storedExecution.Status, "EXECUTING")
	}
	if storedExecution.Authorization == "" {
		t.Error("execution authorization was not generated")
	}
	if !executionInfo.OnpremExecution {
		t.Error("execution was not classified as on-prem")
	}
	if executionInfo.CloudExec {
		t.Error("on-prem execution was unexpectedly classified as cloud")
	}
	if !containsString(executionInfo.Environments, environment.Name) {
		t.Errorf("execution environments %q do not contain %q", executionInfo.Environments, environment.Name)
	}

}

func TestDatastoreIntegration(t *testing.T) {
	initializeIntegrationBackends(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_ = ctx
}

func registerCacheCleanup(t *testing.T, key string) {
	t.Helper()

	t.Cleanup(func() {
		err := shuffle.DeleteCache(context.Background(), key)
		if err != nil && err != gomemcache.ErrCacheMiss {
			t.Errorf("clean up cache key %s: %v", key, err)
		}
	})
}

func requireCacheValue(t *testing.T, ctx context.Context, key string, expected []byte) {
	t.Helper()

	value, err := shuffle.GetCache(ctx, key)
	if err != nil {
		t.Fatalf("get cache key %s: %v", key, err)
	}
	actual, ok := value.([]byte)
	if !ok {
		t.Fatalf("cache key %s returned %T, want []byte", key, value)
	}
	if !bytes.Equal(actual, expected) {
		t.Errorf("unexpected cache value for %s: got %q, want %q", key, actual, expected)
	}
}

func requireCacheCounter(t *testing.T, ctx context.Context, key string, expected uint64) {
	t.Helper()

	value, err := shuffle.GetCache(ctx, key)
	if err != nil {
		t.Fatalf("get counter cache key %s: %v", key, err)
	}
	data, ok := value.([]byte)
	if !ok {
		t.Fatalf("counter cache key %s returned %T, want []byte", key, value)
	}

	var counter shuffle.IncrementInCache
	if err := json.Unmarshal(data, &counter); err != nil {
		t.Fatalf("decode counter cache key %s: %v; value=%q", key, err, data)
	}
	if counter.Amount != expected {
		t.Errorf("unexpected counter value for %s: got %d, want %d", key, counter.Amount, expected)
	}
	if counter.CreatedAt == 0 {
		t.Errorf("counter cache key %s has no creation timestamp", key)
	}
}

func requireCachedWorkflow(t *testing.T, ctx context.Context, key, workflowID, expectedName string) {
	t.Helper()

	value, err := shuffle.GetCache(ctx, key)
	if err != nil {
		t.Fatalf("get workflow cache key %s: %v", key, err)
	}
	data, ok := value.([]byte)
	if !ok {
		t.Fatalf("workflow cache key %s returned %T, want []byte", key, value)
	}

	var workflow shuffle.Workflow
	if err := json.Unmarshal(data, &workflow); err != nil {
		t.Fatalf("decode workflow cache key %s: %v; value=%q", key, err, data)
	}
	if workflow.ID != workflowID {
		t.Errorf("unexpected cached workflow ID: got %q, want %q", workflow.ID, workflowID)
	}
	if workflow.Name != expectedName {
		t.Errorf("unexpected cached workflow name: got %q, want %q", workflow.Name, expectedName)
	}
}

func containsString(values []string, wanted string) bool {
	return slices.Contains(values, wanted)
}

func assertWorkflow(t *testing.T, workflow *shuffle.Workflow, workflowID, organizationID, actionID, name string) {
	t.Helper()

	if workflow.ID != workflowID {
		t.Errorf("unexpected workflow ID: got %q, want %q", workflow.ID, workflowID)
	}
	if workflow.OrgId != organizationID {
		t.Errorf("unexpected organization ID: got %q, want %q", workflow.OrgId, organizationID)
	}
	if workflow.Name != name {
		t.Errorf("unexpected workflow name: got %q, want %q", workflow.Name, name)
	}
	if len(workflow.Actions) != 1 {
		t.Fatalf("unexpected action count: got %d, want 1", len(workflow.Actions))
	}
	if workflow.Actions[0].ID != actionID {
		t.Errorf("unexpected action ID: got %q, want %q", workflow.Actions[0].ID, actionID)
	}
	if workflow.Actions[0].AppName != "integration-test" {
		t.Errorf("unexpected action app: got %q, want %q", workflow.Actions[0].AppName, "integration-test")
	}
}
