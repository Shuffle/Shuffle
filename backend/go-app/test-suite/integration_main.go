//go:build integration

package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	//"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"reflect"
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
	"github.com/shuffle/opensearch-go/v4/opensearchapi"
	shuffle "github.com/shuffle/shuffle-shared"
)

// This suite is a focused integration check for Shuffle's OpenSearch and
// Memcached storage behavior. It is not intended to cover the entire backend.

const (
	defaultIntegrationOrganizationID = "d080eb37-2f1e-4ed5-af12-f526c48372ec"
)

func main() {
	testing.Main(regexp.MatchString, []testing.InternalTest{
		{Name: "TestOpensearchInit", F: TestOpensearchInit},
		{Name: "TestMemcacheCounterUpdate", F: TestMemcacheCounterUpdate},
		{Name: "TestWorkflowStorageRoundTrip", F: TestWorkflowStorageRoundTrip},
		{Name: "TestWorkflowExecutionPreparation", F: TestWorkflowExecutionPreparation},
		{Name: "TestDatastoreIntegration", F: TestDatastoreIntegration},
		{Name: "TestNotificationIntegration", F: TestNotificationIntegration},
		{Name: "TestUserManagement", F: TestUserManagement},
	}, nil, nil)
}

var (
	integrationOrganizationID = defaultIntegrationOrganizationID
	initializeOnce            sync.Once
	initializeErr             error
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
	if configuredOrgID := strings.TrimSpace(os.Getenv("SHUFFLE_TEST_ORG_ID")); configuredOrgID != "" {
		if _, err := uuid.FromString(configuredOrgID); err != nil {
			t.Fatalf("SHUFFLE_TEST_ORG_ID must be a UUID: %v", err)
		}
		integrationOrganizationID = configuredOrgID
	}

	if err := os.Unsetenv("SHUFFLE_OPENSEARCH_INDEX_PREFIX"); err != nil {
		t.Fatalf("clear OpenSearch index prefix: %v", err)
	}
	if err := os.Unsetenv("SHUFFLE_TEST_OPENSEARCH_INDEX_PREFIX"); err != nil {
		t.Fatalf("clear integration-test OpenSearch index prefix: %v", err)
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

func TestOpensearchInit(t *testing.T) {
	initializeIntegrationBackends(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	projectdb := shuffle.GetProject()
	if projectdb.DbType != "opensearch" {
		t.Fatalf("Shuffle database type is %q, want opensearch", projectdb.DbType)
	}
	if projectdb.Es.Client == nil {
		t.Fatal("OpenSearch client was not initialized")
	}

	baseIndexes := shuffle.GetOpensearchBaseIndexes()
	if len(baseIndexes) == 0 {
		t.Fatal("Shuffle returned no base OpenSearch indexes")
	}
	expectedAliases := make([]string, 0, len(baseIndexes))
	for _, baseIndex := range baseIndexes {
		expectedAliases = append(expectedAliases, shuffle.GetESIndexPrefix(baseIndex))
	}

	// Get Alias -> Base Alias match or not
	// Index Association -> Base Alias has index or not and one write

	aliasResponse, err := projectdb.Es.Cat.Aliases(ctx, &opensearchapi.CatAliasesReq{Aliases: expectedAliases})
	if err != nil {
		t.Fatalf("get OpenSearch aliases: %v", err)
	}

	if len(expectedAliases) > len(aliasResponse.Aliases) {
		t.Fatalf("OpenSearch returned %d aliases, want %d", len(aliasResponse.Aliases), len(expectedAliases))
	}

	for _, alias := range aliasResponse.Aliases {
		if !slices.Contains(expectedAliases, alias.Alias) {
			t.Fatalf("OpenSearch alias %q is not in the expected alias list %v", alias.Alias, expectedAliases)
		}

		if len(alias.Index) == 0 {
			t.Fatalf("OpenSearch alias %q has no associated index", alias.Alias)
		}

		if alias.IsWriteIndex != "true" {
			t.Fatalf("OpenSearch alias %q has no write index associated", alias.Alias)
		}
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
	organizationID := integrationOrganizationID
	actionID := uuid.NewV4().String()
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
	organizationID := integrationOrganizationID
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

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	orgID := integrationOrganizationID
	testRunID := uuid.NewV4().String()
	category := "integration_large_" + strings.ReplaceAll(testRunID, "-", "")
	keyPrefix := "integration-bulk-" + testRunID
	// The current OpenSearch mapping indexes Value as one term, whose hard limit
	// is 32,766 bytes. Exercise close to that boundary without exceeding it.
	// FIX IT PLEASE
	largeEntries := make([]string, 1500)
	for index := range largeEntries {
		largeEntries[index] = fmt.Sprintf("created-%05d", index)
	}
	largeJSON, err := json.Marshal(largeEntries)
	if err != nil {
		t.Fatalf("build large datastore value: %v", err)
	}

	largeValue := string(largeJSON)

	fixtures := []shuffle.CacheKeyData{
		{
			OrgId:    orgID,
			Key:      keyPrefix + "-large",
			Value:    largeValue,
			Category: category,
			Tags:     []string{"integration", "large", "created"},
		},
	}

	for index := 0; index < 5; index++ {
		fixtures = append(fixtures, shuffle.CacheKeyData{
			OrgId:    orgID,
			Key:      fmt.Sprintf("%s-item-%02d", keyPrefix, index),
			Value:    fmt.Sprintf("item-%02d|%s|end", index, strings.Repeat(string(rune('a'+index)), 8*1024)),
			Category: category,
			Tags:     []string{"integration", "bulk", fmt.Sprintf("item-%02d", index)},
		})
	}

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()

		for _, fixture := range fixtures {
			documentID := datastoreDocumentID(orgID, fixture.Key, category)
			if err := shuffle.DeleteKey(cleanupCtx, "org_cache", documentID, orgID); err != nil {
				t.Errorf("clean up datastore key %s: %v", fixture.Key, err)
			}
		}

		categoryConfig, err := shuffle.GetDatastoreCategoryConfig(cleanupCtx, orgID, category)
		if err == nil && categoryConfig.Id != "" {
			if err := shuffle.DeleteKey(cleanupCtx, "datastore_category", categoryConfig.Id); err != nil {
				t.Errorf("clean up datastore category %s: %v", category, err)
			}
		}
		_ = shuffle.DeleteCache(cleanupCtx, datastoreCategoryCacheKey(orgID, category))
		_ = shuffle.DeleteCache(cleanupCtx, "datastore_category_"+orgID)
		_ = shuffle.DeleteCache(cleanupCtx, datastoreQueryCacheKey(orgID, category, 50))
	})

	createdInfo, err := shuffle.SetDatastoreKeyBulk(ctx, fixtures)
	if err != nil {
		t.Fatalf("bulk-create datastore category: %v", err)
	}

	assertBulkResult(t, createdInfo, fixtures, false)
	for _, fixture := range fixtures {
		requireCachedDatastoreKey(t, ctx, "org_cache_"+datastoreDocumentID(orgID, fixture.Key, category), fixture)
	}

	categoryConfig, err := shuffle.GetDatastoreCategoryConfig(ctx, orgID, category)
	if err != nil {
		t.Fatalf("get automatically-created datastore category: %v", err)
	}

	if categoryConfig.Id == "" || categoryConfig.OrgId != orgID || categoryConfig.Category != category {
		t.Fatalf("unexpected category config: %#v", categoryConfig)
	}

	requireCachedDatastoreCategory(t, ctx, datastoreCategoryCacheKey(orgID, category), orgID, category)

	queryCacheKey := datastoreQueryCacheKey(orgID, category, 50)
	listed, _, err := shuffle.GetAllCacheKeys(ctx, orgID, category, 50, "")
	if err != nil {
		t.Fatalf("query bulk-created datastore category: %v", err)
	}

	assertDatastoreCollection(t, listed, fixtures)
	requireCachedDatastoreQuery(t, ctx, queryCacheKey, fixtures)

	prefixMatches, _, err := shuffle.GetCacheKeysByPrefix(ctx, orgID, category, fixtures[0].Key, 10, "")
	if err != nil {
		t.Fatalf("query datastore category by prefix: %v", err)
	}
	if len(prefixMatches) != 1 {
		t.Fatalf("prefix query returned %d keys, want 1", len(prefixMatches))
	}

	assertDatastoreKey(t, &prefixMatches[0], fixtures[0])

	primaryLookupID := fmt.Sprintf("%s_%s", orgID, fixtures[0].Key)
	primaryCacheKey := "org_cache_" + datastoreDocumentID(orgID, fixtures[0].Key, category)
	if err := shuffle.DeleteCache(ctx, primaryCacheKey); err != nil {
		t.Fatalf("evict large datastore cache key %s: %v", primaryCacheKey, err)
	}

	if _, err := shuffle.GetCache(ctx, primaryCacheKey); err == nil {
		t.Fatalf("expected datastore cache key %s to be absent after eviction", primaryCacheKey)
	}

	fromOpenSearch, err := shuffle.GetDatastoreKey(ctx, primaryLookupID, category)
	if err != nil {
		t.Fatalf("get large datastore value from OpenSearch after cache eviction: %v", err)
	}

	assertDatastoreKey(t, fromOpenSearch, fixtures[0])
	if fromOpenSearch.Created == 0 || fromOpenSearch.Edited == 0 || fromOpenSearch.PublicAuthorization == "" {
		t.Fatalf("OpenSearch document is missing generated metadata: %#v", fromOpenSearch)
	}

	requireCachedDatastoreKey(t, ctx, primaryCacheKey, fixtures[0])

	updated := *fromOpenSearch
	updatedEntries := append([]string(nil), largeEntries...)
	for index := 0; index < 450; index++ {
		updatedEntries = append(updatedEntries, fmt.Sprintf("updated-%05d", index))
	}

	updatedJSON, err := json.Marshal(updatedEntries)
	if err != nil {
		t.Fatalf("grow large datastore value: %v", err)
	}

	updated.Value = string(updatedJSON)
	updated.Tags = []string{"integration", "large", "updated"}
	added := []shuffle.CacheKeyData{
		{
			OrgId:    orgID,
			Key:      keyPrefix + "-added-01",
			Value:    "added-01|" + strings.Repeat("X", 8*1024),
			Category: category,
			Tags:     []string{"integration", "added"},
		},
		{
			OrgId:    orgID,
			Key:      keyPrefix + "-added-02",
			Value:    "added-02|" + strings.Repeat("Y", 8*1024),
			Category: category,
			Tags:     []string{"integration", "added"},
		},
	}
	fixtures[0] = updated
	fixtures = append(fixtures, added...)
	updateBatch := append([]shuffle.CacheKeyData{updated}, added...)

	updatedInfo, err := shuffle.SetDatastoreKeyBulk(ctx, updateBatch)
	if err != nil {
		t.Fatalf("bulk-update large value and add category entries: %v", err)
	}

	assertMixedBulkResult(t, updatedInfo, updated.Key, added)
	if _, err := shuffle.GetCache(ctx, queryCacheKey); err == nil {
		t.Fatalf("bulk update did not invalidate category query cache %s", queryCacheKey)
	}

	for _, fixture := range updateBatch {
		requireCachedDatastoreKey(t, ctx, "org_cache_"+datastoreDocumentID(orgID, fixture.Key, category), fixture)
	}

	if err := shuffle.DeleteCache(ctx, primaryCacheKey); err != nil {
		t.Fatalf("evict updated large datastore cache key: %v", err)
	}

	storedUpdate, err := shuffle.GetDatastoreKey(ctx, primaryLookupID, category)
	if err != nil {
		t.Fatalf("get updated large datastore key from OpenSearch: %v", err)
	}

	assertDatastoreKey(t, storedUpdate, updated)
	if len(storedUpdate.Value) <= len(largeValue) {
		t.Fatalf("large value did not grow: got %d bytes, original %d", len(storedUpdate.Value), len(largeValue))
	}

	if storedUpdate.Created != fromOpenSearch.Created {
		t.Fatalf("bulk update changed created timestamp: got %d, want %d", storedUpdate.Created, fromOpenSearch.Created)
	}

	requireCachedDatastoreKey(t, ctx, primaryCacheKey, updated)

	listed, _, err = shuffle.GetAllCacheKeys(ctx, orgID, category, 50, "")
	if err != nil {
		t.Fatalf("query datastore category after bulk update: %v", err)
	}

	assertDatastoreCollection(t, listed, fixtures)
	requireCachedDatastoreQuery(t, ctx, queryCacheKey, fixtures)

	categories, err := shuffle.GetDatastoreCategories(ctx, orgID)
	if err != nil {
		t.Fatalf("list datastore categories: %v", err)
	}

	categoryFound := false
	for _, candidate := range categories {
		if candidate.Category == category && candidate.OrgId == orgID {
			categoryFound = true
			break
		}
	}

	if !categoryFound {
		t.Fatalf("category %s was not returned by category listing", category)
	}

	if _, err := shuffle.GetCache(ctx, "datastore_category_"+orgID); err != nil {
		t.Fatalf("category list was not cached: %v", err)
	}

	for _, fixture := range fixtures {
		documentID := datastoreDocumentID(orgID, fixture.Key, category)
		if err := shuffle.DeleteKey(ctx, "org_cache", documentID, orgID); err != nil {
			t.Fatalf("delete datastore key %s: %v", fixture.Key, err)
		}
	}

	if cached, err := shuffle.GetCache(ctx, queryCacheKey); err == nil {
		t.Errorf("datastore deletion left stale category query cache %s: %#v", queryCacheKey, cached)
	}
	listed, _, err = shuffle.GetAllCacheKeys(ctx, orgID, category, 50, "")
	if err != nil {
		t.Fatalf("query datastore category after deletion: %v", err)
	}

	if len(listed) != 0 {
		t.Fatalf("category still contains %d keys after deletion", len(listed))
	}

	for _, fixture := range fixtures {
		lookupID := fmt.Sprintf("%s_%s", orgID, fixture.Key)
		if _, err := shuffle.GetDatastoreKey(ctx, lookupID, category); err == nil {
			t.Errorf("deleted datastore key %s is still readable", fixture.Key)
		}

		cacheKey := "org_cache_" + datastoreDocumentID(orgID, fixture.Key, category)
		if _, err := shuffle.GetCache(ctx, cacheKey); err == nil {
			t.Errorf("deleted datastore key %s is still cached", fixture.Key)
		}
	}
}

func TestNotificationIntegration(t *testing.T) {
	initializeIntegrationBackends(t)

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	orgID := uuid.NewV4().String()
	userID := uuid.NewV4().String()
	orgCacheKey := "notifications_" + orgID
	userCacheKey := "notifications_" + userID
	startedAt := time.Now().Unix()
	organizationNotification := shuffle.Notification{
		Image:             "https://example.com/integration-notification.png",
		CreatedAt:         startedAt - 3600,
		Title:             "Integration notification " + uuid.NewV4().String(),
		Description:       "Organization notification created by the integration suite",
		OrgId:             orgID,
		OrgName:           "Integration Test Organization",
		UserId:            userID,
		Tags:              []string{"integration", "notification", "organization"},
		Amount:            2,
		BucketDescription: "Two matching failures",
		Id:                uuid.NewV4().String(),
		ReferenceUrl:      "/workflows/" + uuid.NewV4().String() + "/executions/" + uuid.NewV4().String(),
		OrgNotificationId: uuid.NewV4().String(),
		Dismissable:       true,
		Personal:          false,
		Read:              false,
		ModifiedBy:        "integration-suite",
		Ignored:           false,
		ExecutionId:       uuid.NewV4().String(),
		WorkflowId:        uuid.NewV4().String(),
		NodeId:            uuid.NewV4().String(),
		NodeLabel:         "Integration notification node",
		ActionName:        "integration_notification_action",
		AppName:           "integration-notification-app",
		NodeStatus:        "FAILURE",
		FailureReason:     "Expected integration-test failure",
		Severity:          "high",
		Origin:            "integration_test",
	}
	personalNotification := shuffle.Notification{
		Image:             "https://example.com/personal-notification.png",
		Title:             "Personal integration notification " + uuid.NewV4().String(),
		Description:       "Personal notification created by the integration suite",
		OrgId:             orgID,
		OrgName:           "Integration Test Organization",
		UserId:            userID,
		Tags:              []string{"integration", "notification", "personal"},
		Amount:            1,
		BucketDescription: "One personal failure",
		Id:                uuid.NewV4().String(),
		ReferenceUrl:      "/notifications/" + uuid.NewV4().String(),
		OrgNotificationId: organizationNotification.Id,
		Dismissable:       false,
		Personal:          true,
		Read:              false,
		ModifiedBy:        "integration-user",
		Ignored:           false,
		ExecutionId:       uuid.NewV4().String(),
		WorkflowId:        uuid.NewV4().String(),
		NodeId:            uuid.NewV4().String(),
		NodeLabel:         "Personal notification node",
		ActionName:        "personal_notification_action",
		AppName:           "integration-notification-app",
		NodeStatus:        "ABORTED",
		FailureReason:     "Expected personal integration-test failure",
		Severity:          "warning",
		Origin:            "integration_test_personal",
	}
	notifications := []*shuffle.Notification{&organizationNotification, &personalNotification}
	deletedNotifications := make(map[string]bool, len(notifications))

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cleanupCancel()

		for _, notification := range notifications {
			if deletedNotifications[notification.Id] {
				continue
			}
			if err := shuffle.DeleteKey(cleanupCtx, "notifications", notification.Id, orgID); err != nil {
				t.Errorf("clean up notification %s: %v", notification.Id, err)
			}
		}
		for _, cacheKey := range []string{orgCacheKey, userCacheKey} {
			err := shuffle.DeleteCache(cleanupCtx, cacheKey)
			if err != nil && err != gomemcache.ErrCacheMiss {
				t.Errorf("clean up notification cache %s: %v", cacheKey, err)
			}
		}
	})

	staleNotifications, err := json.Marshal([]shuffle.Notification{})
	if err != nil {
		t.Fatalf("marshal stale notification cache: %v", err)
	}
	for _, cacheKey := range []string{orgCacheKey, userCacheKey} {
		if err := shuffle.SetCache(ctx, cacheKey, staleNotifications, 5); err != nil {
			t.Fatalf("seed stale notification cache %s: %v", cacheKey, err)
		}
		if _, err := shuffle.GetCache(ctx, cacheKey); err != nil {
			t.Fatalf("verify stale notification cache fixture %s: %v", cacheKey, err)
		}
	}

	if err := shuffle.SetNotification(ctx, organizationNotification); err != nil {
		t.Fatalf("store organization notification: %v", err)
	}
	assertNotificationCachesInvalidated(t, ctx, "write", orgCacheKey, userCacheKey)
	if err := shuffle.SetNotification(ctx, personalNotification); err != nil {
		t.Fatalf("store personal notification: %v", err)
	}

	for _, expected := range notifications {
		stored, err := shuffle.GetNotification(ctx, expected.Id)
		if err != nil {
			t.Fatalf("get notification %s: %v", expected.Id, err)
		}
		if stored.CreatedAt == 0 || stored.UpdatedAt < startedAt || stored.UpdatedAt > time.Now().Unix() {
			t.Fatalf("notification %s has invalid timestamps: created=%d updated=%d", stored.Id, stored.CreatedAt, stored.UpdatedAt)
		}
		if expected.CreatedAt != 0 && stored.CreatedAt != expected.CreatedAt {
			t.Errorf("notification %s creation timestamp changed: got %d, want %d", stored.Id, stored.CreatedAt, expected.CreatedAt)
		}
		expected.CreatedAt = stored.CreatedAt
		expected.UpdatedAt = stored.UpdatedAt
		assertNotification(t, stored, *expected)
		requireIndexedNotification(t, ctx, *expected)
	}

	orgNotifications, err := shuffle.GetOrgNotifications(ctx, orgID)
	if err != nil {
		t.Fatalf("get organization notifications: %v", err)
	}
	assertNotificationPresent(t, orgNotifications, organizationNotification)
	assertNotificationAbsent(t, orgNotifications, personalNotification.Id)
	requireCachedNotificationList(t, ctx, orgCacheKey, []shuffle.Notification{organizationNotification}, []string{personalNotification.Id})

	userNotifications, err := shuffle.GetUserNotifications(ctx, userID)
	if err != nil {
		t.Fatalf("get unread user notifications: %v", err)
	}
	if len(userNotifications) != 2 {
		t.Fatalf("unread user notification count: got %d, want 2", len(userNotifications))
	}
	assertNotificationPresent(t, userNotifications, organizationNotification)
	assertNotificationPresent(t, userNotifications, personalNotification)
	userSnapshot, err := json.Marshal(userNotifications)
	if err != nil {
		t.Fatalf("marshal user notification cache fixture: %v", err)
	}
	if err := shuffle.SetCache(ctx, userCacheKey, userSnapshot, 5); err != nil {
		t.Fatalf("seed user notification cache before update: %v", err)
	}

	previousUpdatedAt := organizationNotification.UpdatedAt
	if wait := time.Until(time.Unix(previousUpdatedAt+1, 0)); wait > 0 {
		time.Sleep(wait)
	}
	organizationNotification.Description = "Updated organization notification description"
	organizationNotification.Tags = []string{"integration", "notification", "updated"}
	organizationNotification.Amount = 7
	organizationNotification.BucketDescription = "Seven matching failures"
	organizationNotification.ReferenceUrl = "/notifications/updated/" + uuid.NewV4().String()
	organizationNotification.Read = true
	organizationNotification.Ignored = true
	organizationNotification.ModifiedBy = "integration-updater"
	organizationNotification.FailureReason = "Updated integration-test failure"
	organizationNotification.Severity = "critical"
	if err := shuffle.SetNotification(ctx, organizationNotification); err != nil {
		t.Fatalf("update notification %s: %v", organizationNotification.Id, err)
	}
	assertNotificationCachesInvalidated(t, ctx, "update", orgCacheKey, userCacheKey)

	updated, err := shuffle.GetNotification(ctx, organizationNotification.Id)
	if err != nil {
		t.Fatalf("get updated notification %s: %v", organizationNotification.Id, err)
	}
	if updated.UpdatedAt <= previousUpdatedAt {
		t.Errorf("notification update timestamp did not advance: got %d, previous %d", updated.UpdatedAt, previousUpdatedAt)
	}
	organizationNotification.UpdatedAt = updated.UpdatedAt
	assertNotification(t, updated, organizationNotification)
	requireIndexedNotification(t, ctx, organizationNotification)

	orgNotifications, err = shuffle.GetOrgNotifications(ctx, orgID)
	if err != nil {
		t.Fatalf("get organization notifications after update: %v", err)
	}
	assertNotificationPresent(t, orgNotifications, organizationNotification)
	requireCachedNotificationList(t, ctx, orgCacheKey, []shuffle.Notification{organizationNotification}, []string{personalNotification.Id})

	userNotifications, err = shuffle.GetUserNotifications(ctx, userID)
	if err != nil {
		t.Fatalf("get user notifications after read update: %v", err)
	}
	if len(userNotifications) != 1 {
		t.Fatalf("unread user notification count after update: got %d, want 1", len(userNotifications))
	}
	assertNotificationPresent(t, userNotifications, personalNotification)
	assertNotificationAbsent(t, userNotifications, organizationNotification.Id)

	if err := shuffle.SetCache(ctx, orgCacheKey, []byte("{invalid-notification-cache"), 1); err != nil {
		t.Fatalf("seed malformed notification cache: %v", err)
	}
	orgNotifications, err = shuffle.GetOrgNotifications(ctx, orgID)
	if err != nil {
		t.Fatalf("recover organization notifications from malformed cache: %v", err)
	}
	assertNotificationPresent(t, orgNotifications, organizationNotification)
	requireCachedNotificationList(t, ctx, orgCacheKey, []shuffle.Notification{organizationNotification}, []string{personalNotification.Id})
	if err := shuffle.SetCache(ctx, userCacheKey, userSnapshot, 5); err != nil {
		t.Fatalf("seed user notification cache before deletion: %v", err)
	}

	for _, expected := range notifications {
		if err := shuffle.DeleteKey(ctx, "notifications", expected.Id, orgID); err != nil {
			t.Fatalf("delete notification %s: %v", expected.Id, err)
		}
		deletedNotifications[expected.Id] = true
		requireNotificationDeleted(t, ctx, expected.Id)
	}
	assertNotificationCachesInvalidated(t, ctx, "deletion", orgCacheKey, userCacheKey)

	orgNotifications, err = shuffle.GetOrgNotifications(ctx, orgID)
	if err != nil {
		t.Fatalf("get organization notifications after deletion: %v", err)
	}
	for _, expected := range notifications {
		assertNotificationAbsent(t, orgNotifications, expected.Id)
	}
	requireCachedNotificationList(t, ctx, orgCacheKey, nil, []string{organizationNotification.Id, personalNotification.Id})

	userNotifications, err = shuffle.GetUserNotifications(ctx, userID)
	if err != nil {
		t.Fatalf("get user notifications after deletion: %v", err)
	}
	if len(userNotifications) != 0 {
		t.Fatalf("deleted user notifications are still queryable: %#v", userNotifications)
	}
}

func requireIndexedNotification(t *testing.T, ctx context.Context, expected shuffle.Notification) {
	t.Helper()

	project := shuffle.GetProject()
	response, err := project.Es.Document.Get(ctx, opensearchapi.DocumentGetReq{
		Index:      strings.ToLower(shuffle.GetESIndexPrefix("notifications")),
		DocumentID: expected.Id,
	})
	if err != nil {
		t.Fatalf("get indexed notification %s: %v", expected.Id, err)
	}
	if rawResponse := response.Inspect().Response; rawResponse != nil {
		defer rawResponse.Body.Close()
	}
	if !response.Found {
		t.Fatalf("indexed notification %s was not found", expected.Id)
	}

	var notification shuffle.Notification
	if err := json.Unmarshal(response.Source, &notification); err != nil {
		t.Fatalf("decode indexed notification %s: %v", expected.Id, err)
	}
	assertNotification(t, &notification, expected)
}

func assertNotificationCachesInvalidated(t *testing.T, ctx context.Context, operation string, cacheKeys ...string) {
	t.Helper()

	for _, cacheKey := range cacheKeys {
		if cached, err := shuffle.GetCache(ctx, cacheKey); err == nil {
			cachedBytes, _ := cached.([]byte)
			t.Errorf("notification %s left stale cache %s (type=%T bytes=%d)", operation, cacheKey, cached, len(cachedBytes))
			if err := shuffle.DeleteCache(ctx, cacheKey); err != nil {
				t.Fatalf("clear recorded stale notification cache %s: %v", cacheKey, err)
			}
		}
	}
}

func requireNotificationDeleted(t *testing.T, ctx context.Context, notificationID string) {
	t.Helper()

	project := shuffle.GetProject()
	response, err := project.Es.Document.Get(ctx, opensearchapi.DocumentGetReq{
		Index:      strings.ToLower(shuffle.GetESIndexPrefix("notifications")),
		DocumentID: notificationID,
	})
	if err != nil {
		if strings.Contains(err.Error(), "404") || strings.Contains(err.Error(), "not_found") {
			return
		}
		t.Fatalf("verify deleted notification %s: %v", notificationID, err)
	}
	if rawResponse := response.Inspect().Response; rawResponse != nil {
		defer rawResponse.Body.Close()
	}
	if response.Found {
		t.Errorf("deleted notification %s is still present in OpenSearch", notificationID)
	}
}

func requireCachedNotificationList(t *testing.T, ctx context.Context, cacheKey string, expected []shuffle.Notification, absentIDs []string) {
	t.Helper()

	cached, err := shuffle.GetCache(ctx, cacheKey)
	if err != nil {
		t.Fatalf("get notification cache key %s: %v", cacheKey, err)
	}
	cachedBytes, ok := cached.([]byte)
	if !ok {
		t.Fatalf("notification cache key %s has type %T, want []byte", cacheKey, cached)
	}

	var notifications []shuffle.Notification
	if err := json.Unmarshal(cachedBytes, &notifications); err != nil {
		t.Fatalf("decode notification cache key %s: %v", cacheKey, err)
	}
	for _, notification := range expected {
		assertNotificationPresent(t, notifications, notification)
	}
	for _, notificationID := range absentIDs {
		assertNotificationAbsent(t, notifications, notificationID)
	}
}

func assertNotificationPresent(t *testing.T, notifications []shuffle.Notification, expected shuffle.Notification) {
	t.Helper()

	for index := range notifications {
		if notifications[index].Id == expected.Id {
			assertNotification(t, &notifications[index], expected)
			return
		}
	}
	t.Errorf("notification list does not contain %s", expected.Id)
}

func assertNotificationAbsent(t *testing.T, notifications []shuffle.Notification, notificationID string) {
	t.Helper()

	for _, notification := range notifications {
		if notification.Id == notificationID {
			t.Errorf("notification list unexpectedly contains %s: %#v", notificationID, notification)
			return
		}
	}
}

func assertNotification(t *testing.T, actual *shuffle.Notification, expected shuffle.Notification) {
	t.Helper()

	if actual == nil {
		t.Fatal("expected notification, got nil")
	}
	if !reflect.DeepEqual(*actual, expected) {
		actualJSON, _ := json.Marshal(actual)
		expectedJSON, _ := json.Marshal(expected)
		t.Errorf("notification mismatch:\n got: %s\nwant: %s", actualJSON, expectedJSON)
	}
}

func TestUserManagement(t *testing.T) {
	initializeIntegrationBackends(t)

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	testRunID := uuid.NewV4().String()
	userID := uuid.NewV4().String()
	username := fmt.Sprintf("integration-user-%s@example.com", testRunID)
	idCacheKey := "user_" + strings.ToLower(userID)
	usernameCacheKey := "user_" + strings.ToLower(username)

	user := shuffle.User{
		Id:                userID,
		Username:          username,
		GeneratedUsername: username,
		Password:          "integration-test-password-hash-" + testRunID,
		Session:           uuid.NewV4().String(),
		ApiKey:            uuid.NewV4().String(),
		Verified:          true,
		Role:              "user",
		Roles:             []string{"user"},
		Orgs:              []string{integrationOrganizationID},
		ActiveOrg: shuffle.OrgMini{
			Id:   integrationOrganizationID,
			Name: "Integration Test Organization",
			Role: "user",
		},
		Active:       true,
		CreationTime: time.Now().Unix(),
		LoginType:    "integration_test",
		Theme:        "light",
		Regions:      []string{"integration-test"},
	}
	apiKeys := []string{user.ApiKey}
	sessions := []string{user.Session}

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cleanupCancel()

		if err := shuffle.DeleteKey(cleanupCtx, "Users", userID); err != nil {
			t.Errorf("clean up integration user %s: %v", userID, err)
		}
		for _, apiKey := range apiKeys {
			_ = shuffle.DeleteKey(cleanupCtx, "apikey", apiKey)
			_ = shuffle.DeleteCache(cleanupCtx, apiKey)
			_ = shuffle.DeleteCache(cleanupCtx, "Users_"+apiKey)
		}
		for _, session := range sessions {
			_ = shuffle.DeleteKey(cleanupCtx, "sessions", session)
			_ = shuffle.DeleteCache(cleanupCtx, session)
			_ = shuffle.DeleteCache(cleanupCtx, "session_"+session)
		}
		for _, cacheKey := range []string{idCacheKey, usernameCacheKey} {
			_ = shuffle.DeleteCache(cleanupCtx, cacheKey)
		}
	})

	if err := shuffle.SetUser(ctx, &user, false); err != nil {
		t.Fatalf("create integration user: %v", err)
	}
	requireCachedUser(t, ctx, idCacheKey, user)
	requireCachedUser(t, ctx, usernameCacheKey, user)
	if err := shuffle.SetApikey(ctx, user); err != nil {
		t.Fatalf("create API-key lookup document: %v", err)
	}
	if err := shuffle.SetSession(ctx, user, user.Session); err != nil {
		t.Fatalf("create session lookup document: %v", err)
	}
	requireIndexedUser(t, ctx, "apikey", user.ApiKey, user)
	requireIndexedSession(t, ctx, user.Session, user)

	apiKeyUser, err := shuffle.GetApikey(ctx, user.ApiKey)
	if err != nil {
		t.Fatalf("authenticate newly-created API key: %v", err)
	}
	assertUser(t, &apiKeyUser, user)
	requireCachedAPIKeyLookup(t, ctx, user.ApiKey, user)

	sessionUser, err := shuffle.GetSessionNew(ctx, user.Session)
	if err != nil {
		t.Fatalf("authenticate newly-created session: %v", err)
	}
	assertUser(t, &sessionUser, user)
	initialSessionCacheKey := "session_" + user.Session
	requireCachedUser(t, ctx, initialSessionCacheKey, user)
	if err := shuffle.DeleteCache(ctx, initialSessionCacheKey); err != nil {
		t.Fatalf("evict initial session cache: %v", err)
	}
	sessionUser, err = shuffle.GetSessionNew(ctx, user.Session)
	if err != nil {
		t.Fatalf("authenticate session through OpenSearch after cache eviction: %v", err)
	}
	assertUser(t, &sessionUser, user)
	requireCachedUser(t, ctx, initialSessionCacheKey, user)

	stored, err := shuffle.GetUser(ctx, userID)
	if err != nil {
		t.Fatalf("get newly-created user by ID: %v", err)
	}
	assertUser(t, stored, user)

	if err := shuffle.DeleteCache(ctx, idCacheKey); err != nil {
		t.Fatalf("evict user ID cache: %v", err)
	}
	if _, err := shuffle.GetCache(ctx, idCacheKey); err == nil {
		t.Fatalf("expected user ID cache %s to be absent after eviction", idCacheKey)
	}

	fromOpenSearch, err := shuffle.GetUser(ctx, userID)
	if err != nil {
		t.Fatalf("get user from OpenSearch after cache eviction: %v", err)
	}
	assertUser(t, fromOpenSearch, user)
	requireCachedUser(t, ctx, idCacheKey, user)

	foundUsers, err := shuffle.FindUser(ctx, username)
	if err != nil {
		t.Fatalf("find integration user by username: %v", err)
	}
	if len(foundUsers) != 1 {
		t.Fatalf("find user returned %d users, want 1", len(foundUsers))
	}
	assertUser(t, &foundUsers[0], user)

	updated := *fromOpenSearch
	updated.Role = "admin"
	updated.Roles = []string{"user", "admin"}
	updated.SupportAccess = true
	updated.Active = false
	updated.Theme = "dark"
	updated.Session = uuid.NewV4().String()
	updated.ApiKey = uuid.NewV4().String()
	oldSession := user.Session
	oldAPIKey := user.ApiKey
	user = updated
	apiKeys = append(apiKeys, updated.ApiKey)
	sessions = append(sessions, updated.Session)

	if err := shuffle.SetUser(ctx, &updated, false); err != nil {
		t.Fatalf("update integration user: %v", err)
	}
	if err := shuffle.SetApikey(ctx, updated); err != nil {
		t.Fatalf("create rotated API-key lookup document: %v", err)
	}
	sessionUser = updated
	sessionUser.Session = oldSession
	if err := shuffle.SetSession(ctx, sessionUser, updated.Session); err != nil {
		t.Fatalf("create rotated session lookup document: %v", err)
	}
	requireCachedUser(t, ctx, idCacheKey, updated)
	requireCachedUser(t, ctx, usernameCacheKey, updated)
	requireIndexedUser(t, ctx, "apikey", updated.ApiKey, updated)
	requireIndexedSession(t, ctx, updated.Session, updated)

	rotatedAPIKeyUser, err := shuffle.GetApikey(ctx, updated.ApiKey)
	if err != nil {
		t.Fatalf("authenticate rotated API key: %v", err)
	}
	assertUser(t, &rotatedAPIKeyUser, updated)
	requireCachedAPIKeyLookup(t, ctx, updated.ApiKey, updated)
	if staleUser, err := shuffle.GetApikey(ctx, oldAPIKey); err == nil {
		t.Fatalf("old API key still authenticates after rotation: %#v", staleUser)
	}

	rotatedSessionUser, err := shuffle.GetSessionNew(ctx, updated.Session)
	if err != nil {
		t.Fatalf("authenticate rotated session: %v", err)
	}
	assertUser(t, &rotatedSessionUser, updated)
	rotatedSessionCacheKey := "session_" + updated.Session
	requireCachedUser(t, ctx, rotatedSessionCacheKey, updated)
	if err := shuffle.DeleteCache(ctx, rotatedSessionCacheKey); err != nil {
		t.Fatalf("evict rotated session cache: %v", err)
	}
	rotatedSessionUser, err = shuffle.GetSessionNew(ctx, updated.Session)
	if err != nil {
		t.Fatalf("authenticate rotated session through OpenSearch: %v", err)
	}
	assertUser(t, &rotatedSessionUser, updated)
	requireCachedUser(t, ctx, rotatedSessionCacheKey, updated)

	if staleUser, err := shuffle.GetSessionNew(ctx, oldSession); err == nil {
		t.Fatalf("old session still authenticates after rotation: %#v", staleUser)
	}

	if err := shuffle.DeleteCache(ctx, idCacheKey); err != nil {
		t.Fatalf("evict updated user ID cache: %v", err)
	}
	storedUpdate, err := shuffle.GetUser(ctx, userID)
	if err != nil {
		t.Fatalf("get updated user from OpenSearch: %v", err)
	}
	assertUser(t, storedUpdate, updated)
	requireCachedUser(t, ctx, idCacheKey, updated)

	foundUsers, err = shuffle.FindUser(ctx, username)
	if err != nil {
		t.Fatalf("find updated integration user: %v", err)
	}
	if len(foundUsers) != 1 {
		t.Fatalf("find updated user returned %d users, want 1", len(foundUsers))
	}
	assertUser(t, &foundUsers[0], updated)
	requireCachedUser(t, ctx, idCacheKey, updated)
	requireCachedUser(t, ctx, usernameCacheKey, updated)

	deleteUser := updated
	deleteUser.Orgs = nil // Avoid modifying the real integration organization.
	if err := shuffle.DeleteUsersAccount(ctx, &deleteUser); err != nil {
		t.Fatalf("delete integration user: %v", err)
	}
	for _, cacheKey := range []string{
		idCacheKey,
		usernameCacheKey,
		updated.ApiKey,
		"Users_" + updated.ApiKey,
		updated.Session,
		"session_" + updated.Session,
	} {
		if cached, err := shuffle.GetCache(ctx, cacheKey); err == nil {
			t.Errorf("account deletion left cache %s: %#v", cacheKey, cached)
		}
	}

	project := shuffle.GetProject()
	refreshResponse, err := project.Es.Indices.Refresh(ctx, &opensearchapi.IndicesRefreshReq{
		Indices: []string{strings.ToLower(shuffle.GetESIndexPrefix("Users"))},
	})
	if err != nil {
		t.Fatalf("refresh Users index after account deletion: %v", err)
	}
	if rawResponse := refreshResponse.Inspect().Response; rawResponse != nil {
		rawResponse.Body.Close()
	}

	if deleted, err := shuffle.GetUser(ctx, userID); err == nil {
		t.Fatalf("deleted user is still readable: %#v", deleted)
	}
	if users, err := shuffle.FindUser(ctx, username); err != nil {
		t.Fatalf("find deleted integration user: %v", err)
	} else if len(users) != 0 {
		t.Fatalf("deleted user is still returned by username query: %#v", users)
	}
	if authenticated, err := shuffle.GetApikey(ctx, updated.ApiKey); err == nil {
		t.Fatalf("deleted user's API key still authenticates: %#v", authenticated)
	}
	if authenticated, err := shuffle.GetSessionNew(ctx, updated.Session); err == nil {
		t.Fatalf("deleted user's session still authenticates: %#v", authenticated)
	}
}

func requireIndexedUser(t *testing.T, ctx context.Context, index, documentID string, expected shuffle.User) {
	t.Helper()

	project := shuffle.GetProject()
	response, err := project.Es.Document.Get(ctx, opensearchapi.DocumentGetReq{
		Index:      strings.ToLower(shuffle.GetESIndexPrefix(index)),
		DocumentID: documentID,
	})
	if err != nil {
		t.Fatalf("get indexed user document %s/%s: %v", index, documentID, err)
	}
	if rawResponse := response.Inspect().Response; rawResponse != nil {
		defer rawResponse.Body.Close()
	}
	if !response.Found {
		t.Fatalf("indexed user document %s/%s was not found", index, documentID)
	}

	var user shuffle.User
	if err := json.Unmarshal(response.Source, &user); err != nil {
		t.Fatalf("decode indexed user document %s/%s: %v", index, documentID, err)
	}
	assertUser(t, &user, expected)
}

func requireIndexedSession(t *testing.T, ctx context.Context, sessionID string, expected shuffle.User) {
	t.Helper()

	project := shuffle.GetProject()
	response, err := project.Es.Document.Get(ctx, opensearchapi.DocumentGetReq{
		Index:      strings.ToLower(shuffle.GetESIndexPrefix("sessions")),
		DocumentID: sessionID,
	})
	if err != nil {
		t.Fatalf("get indexed session %s: %v", sessionID, err)
	}
	if rawResponse := response.Inspect().Response; rawResponse != nil {
		defer rawResponse.Body.Close()
	}
	if !response.Found {
		t.Fatalf("indexed session %s was not found", sessionID)
	}

	var session shuffle.Session
	if err := json.Unmarshal(response.Source, &session); err != nil {
		t.Fatalf("decode indexed session %s: %v", sessionID, err)
	}
	if session.Session != sessionID {
		t.Errorf("indexed session token: got %q, want %q", session.Session, sessionID)
	}
	if session.UserId != strings.ToLower(expected.Id) {
		t.Errorf("indexed session user ID: got %q, want %q", session.UserId, strings.ToLower(expected.Id))
	}
	if session.Username != strings.ToLower(expected.Username) {
		t.Errorf("indexed session username: got %q, want %q", session.Username, strings.ToLower(expected.Username))
	}
}

func requireCachedAPIKeyLookup(t *testing.T, ctx context.Context, apiKey string, expected shuffle.User) {
	t.Helper()

	cacheKey := "Users_" + apiKey
	cached, err := shuffle.GetCache(ctx, cacheKey)
	if err != nil {
		t.Fatalf("API-key lookup did not populate cache %s: %v", cacheKey, err)
	}

	cacheData, ok := cached.([]byte)
	if !ok {
		t.Fatalf("API-key cache %s has type %T, want []byte", cacheKey, cached)
	}

	var users []shuffle.User
	if err := json.Unmarshal(cacheData, &users); err != nil {
		t.Fatalf("decode API-key cache %s: %v", cacheKey, err)
	}
	if len(users) == 0 {
		t.Fatalf("API-key cache %s contains no users", cacheKey)
	}

	assertUser(t, &users[0], expected)
}

func assertUser(t *testing.T, actual *shuffle.User, expected shuffle.User) {
	t.Helper()

	if actual == nil {
		t.Fatal("expected user, got nil")
	}
	if actual.Id != expected.Id {
		t.Errorf("user ID: got %q, want %q", actual.Id, expected.Id)
	}
	if actual.Username != expected.Username {
		t.Errorf("username: got %q, want %q", actual.Username, expected.Username)
	}
	if actual.GeneratedUsername != expected.GeneratedUsername {
		t.Errorf("generated username: got %q, want %q", actual.GeneratedUsername, expected.GeneratedUsername)
	}
	if actual.Role != expected.Role {
		t.Errorf("user role: got %q, want %q", actual.Role, expected.Role)
	}
	if !slices.Equal(actual.Roles, expected.Roles) {
		t.Errorf("user roles: got %v, want %v", actual.Roles, expected.Roles)
	}
	if actual.ActiveOrg.Id != expected.ActiveOrg.Id {
		t.Errorf("active organization: got %q, want %q", actual.ActiveOrg.Id, expected.ActiveOrg.Id)
	}
	if actual.Active != expected.Active {
		t.Errorf("user active state: got %t, want %t", actual.Active, expected.Active)
	}
	if actual.Verified != expected.Verified {
		t.Errorf("user verified state: got %t, want %t", actual.Verified, expected.Verified)
	}
	if actual.SupportAccess != expected.SupportAccess {
		t.Errorf("support access: got %t, want %t", actual.SupportAccess, expected.SupportAccess)
	}
	if actual.Theme != expected.Theme {
		t.Errorf("user theme: got %q, want %q", actual.Theme, expected.Theme)
	}
	if actual.Session != expected.Session {
		t.Errorf("user session: got %q, want %q", actual.Session, expected.Session)
	}
	if actual.ApiKey != expected.ApiKey {
		t.Errorf("user API key: got %q, want %q", actual.ApiKey, expected.ApiKey)
	}
	if actual.Password != expected.Password {
		t.Error("user password hash did not round-trip")
	}
}

func requireCachedUser(t *testing.T, ctx context.Context, cacheKey string, expected shuffle.User) {
	t.Helper()

	cached, err := shuffle.GetCache(ctx, cacheKey)
	if err != nil {
		t.Fatalf("get user cache key %s: %v", cacheKey, err)
	}
	cachedBytes, ok := cached.([]byte)
	if !ok {
		t.Fatalf("user cache key %s has type %T, want []byte", cacheKey, cached)
	}

	var user shuffle.User
	if err := json.Unmarshal(cachedBytes, &user); err != nil {
		t.Fatalf("decode user cache key %s: %v", cacheKey, err)
	}
	assertUser(t, &user, expected)
}

func datastoreDocumentID(orgID, key, category string) string {
	documentID := fmt.Sprintf("%s_%s", orgID, key)
	if category != "" && category != "default" {
		documentID += "_" + strings.ReplaceAll(strings.ToLower(category), " ", "_")
	}
	documentID = url.QueryEscape(documentID)
	if len(documentID) > 127 {
		documentID = documentID[:127]
	}
	return documentID
}

func datastoreQueryCacheKey(orgID, category string, max int) string {
	return fmt.Sprintf("org_cache__%s_%s_%d", orgID, category, max)
}

func datastoreCategoryCacheKey(orgID, category string) string {
	return fmt.Sprintf("datastore_category_%s_%s", orgID, category)
}

func assertDatastoreKey(t *testing.T, actual *shuffle.CacheKeyData, expected shuffle.CacheKeyData) {
	t.Helper()

	if actual == nil {
		t.Fatal("expected datastore key, got nil")
	}
	if actual.OrgId != expected.OrgId {
		t.Errorf("datastore org ID: got %q, want %q", actual.OrgId, expected.OrgId)
	}
	if actual.Key != expected.Key {
		t.Errorf("datastore key: got %q, want %q", actual.Key, expected.Key)
	}
	if actual.Value != expected.Value {
		actualHash := sha256.Sum256([]byte(actual.Value))
		expectedHash := sha256.Sum256([]byte(expected.Value))
		t.Errorf(
			"datastore value mismatch: got length=%d sha256=%x, want length=%d sha256=%x",
			len(actual.Value), actualHash, len(expected.Value), expectedHash,
		)
	}
	if actual.Category != expected.Category {
		t.Errorf("datastore category: got %q, want %q", actual.Category, expected.Category)
	}
	if len(actual.Tags) != len(expected.Tags) {
		t.Errorf("datastore tag count: got %d (%v), want %d (%v)", len(actual.Tags), actual.Tags, len(expected.Tags), expected.Tags)
	}
	for _, tag := range expected.Tags {
		if !slices.Contains(actual.Tags, tag) {
			t.Errorf("datastore tags %v do not contain %q", actual.Tags, tag)
		}
	}
}

// Bit hacky
func assertDatastoreCollection(t *testing.T, actual, expected []shuffle.CacheKeyData) {
	t.Helper()

	if len(actual) != len(expected) {
		t.Fatalf("datastore collection size: got %d, want %d", len(actual), len(expected))
	}
	actualByKey := make(map[string]shuffle.CacheKeyData, len(actual))
	for _, item := range actual {
		if _, duplicate := actualByKey[item.Key]; duplicate {
			t.Errorf("datastore collection contains duplicate key %q", item.Key)
		}
		actualByKey[item.Key] = item
	}
	for _, wanted := range expected {
		item, found := actualByKey[wanted.Key]
		if !found {
			t.Errorf("datastore collection is missing key %q", wanted.Key)
			continue
		}
		assertDatastoreKey(t, &item, wanted)
	}
}

func assertBulkResult(t *testing.T, result []shuffle.DatastoreKeyMini, expected []shuffle.CacheKeyData, existed bool) {
	t.Helper()

	if len(result) != len(expected) {
		t.Fatalf("bulk result size: got %d, want %d", len(result), len(expected))
	}
	resultByKey := make(map[string]shuffle.DatastoreKeyMini, len(result))
	for _, item := range result {
		resultByKey[item.Key] = item
	}
	for _, wanted := range expected {
		item, found := resultByKey[wanted.Key]
		if !found {
			t.Errorf("bulk result is missing key %q", wanted.Key)
			continue
		}
		if item.Existed != existed {
			t.Errorf("bulk result existed flag for %q: got %t, want %t", wanted.Key, item.Existed, existed)
		}
	}
}

func assertMixedBulkResult(t *testing.T, result []shuffle.DatastoreKeyMini, updatedKey string, added []shuffle.CacheKeyData) {
	t.Helper()

	if len(result) != 1+len(added) {
		t.Fatalf("mixed bulk result size: got %d, want %d", len(result), 1+len(added))
	}
	expected := map[string]bool{updatedKey: true}
	for _, item := range added {
		expected[item.Key] = false
	}
	for _, item := range result {
		wantExisted, found := expected[item.Key]
		if !found {
			t.Errorf("mixed bulk result contains unexpected key %q", item.Key)
			continue
		}
		if item.Existed != wantExisted {
			t.Errorf("mixed bulk existed flag for %q: got %t, want %t", item.Key, item.Existed, wantExisted)
		}
		delete(expected, item.Key)
	}
	for missing := range expected {
		t.Errorf("mixed bulk result is missing key %q", missing)
	}
}

func requireCachedDatastoreKey(t *testing.T, ctx context.Context, cacheKey string, expected shuffle.CacheKeyData) {
	t.Helper()

	cached, err := shuffle.GetCache(ctx, cacheKey)
	if err != nil {
		t.Fatalf("get datastore cache key %s: %v", cacheKey, err)
	}
	cachedBytes, ok := cached.([]byte)
	if !ok {
		t.Fatalf("datastore cache key %s has type %T, want []byte", cacheKey, cached)
	}

	var datastoreKey shuffle.CacheKeyData
	if err := json.Unmarshal(cachedBytes, &datastoreKey); err != nil {
		t.Fatalf("decode datastore cache key %s: %v", cacheKey, err)
	}
	assertDatastoreKey(t, &datastoreKey, expected)
}

func requireCachedDatastoreQuery(t *testing.T, ctx context.Context, cacheKey string, expected []shuffle.CacheKeyData) {
	t.Helper()

	cached, err := shuffle.GetCache(ctx, cacheKey)
	if err != nil {
		t.Fatalf("get datastore query cache key %s: %v", cacheKey, err)
	}
	cachedBytes, ok := cached.([]byte)
	if !ok {
		t.Fatalf("datastore query cache key %s has type %T, want []byte", cacheKey, cached)
	}

	var result shuffle.CacheReturn
	if err := json.Unmarshal(cachedBytes, &result); err != nil {
		t.Fatalf("decode datastore query cache key %s: %v", cacheKey, err)
	}
	assertDatastoreCollection(t, result.Keys, expected)
}

func requireCachedDatastoreCategory(t *testing.T, ctx context.Context, cacheKey, orgID, category string) {
	t.Helper()

	cached, err := shuffle.GetCache(ctx, cacheKey)
	if err != nil {
		t.Fatalf("get datastore category cache key %s: %v", cacheKey, err)
	}
	cachedBytes, ok := cached.([]byte)
	if !ok {
		t.Fatalf("datastore category cache key %s has type %T, want []byte", cacheKey, cached)
	}

	var config shuffle.DatastoreCategoryUpdate
	if err := json.Unmarshal(cachedBytes, &config); err != nil {
		t.Fatalf("decode datastore category cache key %s: %v", cacheKey, err)
	}
	if config.Id == "" || config.OrgId != orgID || config.Category != category {
		t.Fatalf("unexpected cached datastore category: %#v", config)
	}
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
