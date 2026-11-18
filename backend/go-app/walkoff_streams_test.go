package main

import (
	"encoding/json"
	"testing"

	"github.com/shuffle/shuffle-shared"
)

func TestIsWorkflowExecutionSnapshot(t *testing.T) {
	snapshot, err := json.Marshal(shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Workflow: shuffle.Workflow{
			ID:      "workflow-id",
			Actions: []shuffle.Action{{ID: "action-id"}},
		},
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "action-id"}, Status: "SUCCESS"},
		},
	})
	if err != nil {
		t.Fatalf("failed marshalling snapshot: %s", err)
	}

	if !isWorkflowExecutionSnapshot(snapshot) {
		t.Fatal("expected a full WorkflowExecution body to be detected as a snapshot")
	}

	actionResult, err := json.Marshal(shuffle.ActionResult{
		ExecutionId: "execution-id",
		Action:      shuffle.Action{ID: "action-id"},
		Status:      "SUCCESS",
	})
	if err != nil {
		t.Fatalf("failed marshalling action result: %s", err)
	}

	if isWorkflowExecutionSnapshot(actionResult) {
		t.Fatal("expected an ActionResult body NOT to be detected as a snapshot")
	}

	if isWorkflowExecutionSnapshot([]byte(`{"workflow": {}, "action": {}}`)) {
		t.Fatal("expected a body with both workflow and action fields NOT to be detected as a snapshot")
	}

	if isWorkflowExecutionSnapshot([]byte(`{"execution_id": "execution-id"`)) {
		t.Fatal("expected malformed JSON NOT to be detected as a snapshot")
	}
}

func TestRerunQueueEnvironment(t *testing.T) {
	tests := []struct {
		name        string
		environment string
		orgId       string
		isCloud     bool
		expected    string
	}{
		{
			name:        "on-prem uses the environment name",
			environment: "Shuffle",
			orgId:       "org-id",
			isCloud:     false,
			expected:    "shuffle",
		},
		{
			name:        "on-prem normalizes spaces and underscores",
			environment: "My_Env Name",
			orgId:       "org-id",
			isCloud:     false,
			expected:    "my-env-name",
		},
		{
			name:        "cloud keeps the org suffix",
			environment: "Shuffle",
			orgId:       "org-id",
			isCloud:     true,
			expected:    "shuffle_org-id",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if actual := rerunQueueEnvironment(test.environment, test.orgId, test.isCloud); actual != test.expected {
				t.Fatalf("expected %q, got %q", test.expected, actual)
			}
		})
	}
}
