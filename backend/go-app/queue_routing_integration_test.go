//go:build integration

// Run this test against a disposable OpenSearch + Memcached pair:
//
//	SHUFFLE_OPENSEARCH_URL=http://localhost:9200 \
//	SHUFFLE_MEMCACHED=localhost:11211 \
//	go test -tags=integration -vet=off ./ -run TestRerunQueueEnvironmentMatchesReaders
//
// It verifies that the rerun endpoint writes to the same index that
// GetWorkflowQueue (and therefore orborus) polls, including environment names
// that contain underscores.

package main

import (
	"context"
	"os"
	"testing"

	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
	uuid "github.com/satori/go.uuid"
	"github.com/shuffle/shuffle-shared"
)

func TestRerunQueueEnvironmentMatchesReaders(t *testing.T) {
	if os.Getenv("SHUFFLE_OPENSEARCH_URL") == "" || os.Getenv("SHUFFLE_MEMCACHED") == "" {
		t.Skip("integration backends not configured")
	}

	if _, err := shuffle.RunInit(datastore.Client{}, storage.Client{}, "shuffle-integration", "onprem", true, "opensearch", false, 0); err != nil {
		t.Fatalf("RunInit: %s", err)
	}
	shuffle.InitOpensearchIndexes()

	ctx := context.Background()
	environment := "My_Env Name"
	orgId := uuid.NewV4().String()
	executionId := uuid.NewV4().String()

	queueKey := rerunQueueEnvironment(environment, orgId, false)
	executionRequest := shuffle.ExecutionRequest{
		ExecutionId:   executionId,
		WorkflowId:    uuid.NewV4().String(),
		Authorization: uuid.NewV4().String(),
		Priority:      11,
	}

	if err := shuffle.SetWorkflowQueue(ctx, executionRequest, queueKey); err != nil {
		t.Fatalf("SetWorkflowQueue: %s", err)
	}

	t.Cleanup(func() {
		shuffle.DeleteKey(context.Background(), "workflowqueue-"+queueKey, executionId)
	})

	queue, err := shuffle.GetWorkflowQueue(ctx, environment, 10)
	if err != nil {
		t.Fatalf("GetWorkflowQueue: %s", err)
	}

	for _, item := range queue.Data {
		if item.ExecutionId == executionId {
			return
		}
	}

	t.Fatalf("rerun queue key %q is not readable through GetWorkflowQueue for environment %q", queueKey, environment)
}
