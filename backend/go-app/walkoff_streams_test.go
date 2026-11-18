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

	if !isWorkflowExecutionSnapshot([]byte(`{"execution_id": "execution-id", "results": []}`)) {
		t.Fatal("expected a body with a results array and no action to be detected as a snapshot")
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
			expected:    "my_env-name",
		},
		{
			name:        "cloud keeps the org suffix",
			environment: "Shuffle",
			orgId:       "org-id",
			isCloud:     true,
			expected:    "shuffle_org-id",
		},
		{
			name:        "cloud normalizes underscores in the environment name",
			environment: "My_Env",
			orgId:       "org-id",
			isCloud:     true,
			expected:    "my-env_org-id",
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

func TestIsAgentDecisionCallback(t *testing.T) {
	agentAction := shuffle.Action{ID: "agent-action", AppName: "AI Agent", Name: "agent"}

	if !isAgentDecisionCallback(shuffle.ActionResult{Action: agentAction, Status: "agent_decision-id"}) {
		t.Fatal("expected an AI Agent decision callback to be recognized")
	}

	if !isAgentDecisionCallback(shuffle.ActionResult{Action: shuffle.Action{ID: "agent-action", AppName: "shuffle-ai", Name: "run_agent"}, Status: "agent_decision-id"}) {
		t.Fatal("expected a shuffle-ai decision callback to be recognized")
	}

	if isAgentDecisionCallback(shuffle.ActionResult{Action: shuffle.Action{ID: "action", AppName: "execute_python"}, Status: "agent_decision-id"}) {
		t.Fatal("expected a regular action to not be treated as an agent decision callback")
	}

	if isAgentDecisionCallback(shuffle.ActionResult{Action: agentAction, Status: "SUCCESS"}) {
		t.Fatal("expected a non-agent status to not be treated as an agent decision callback")
	}
}

func TestAgentCallbackHasInFlightDecision(t *testing.T) {
	agentAction := shuffle.Action{ID: "agent-action", AppName: "AI Agent", Name: "agent"}

	runningExecution := &shuffle.WorkflowExecution{
		Results: []shuffle.ActionResult{
			{
				Action: agentAction,
				Result: `{"status":"RUNNING","decisions":[{"i":1,"run_details":{"id":"d1","status":"RUNNING"}}]}`,
			},
		},
	}

	if !agentCallbackHasInFlightDecision(runningExecution, shuffle.ActionResult{Action: agentAction, Status: "agent_d1"}) {
		t.Fatal("expected a running decision to allow the continuation callback")
	}

	finishedExecution := &shuffle.WorkflowExecution{
		Results: []shuffle.ActionResult{
			{
				Action: agentAction,
				Result: `{"status":"FINISHED","decisions":[{"i":1,"run_details":{"id":"d1","status":"FINISHED"}}]}`,
			},
		},
	}

	if agentCallbackHasInFlightDecision(finishedExecution, shuffle.ActionResult{Action: agentAction, Status: "agent_d1"}) {
		t.Fatal("expected a finished decision to not allow the continuation callback")
	}

	if agentCallbackHasInFlightDecision(runningExecution, shuffle.ActionResult{Action: agentAction, Status: "agent_missing"}) {
		t.Fatal("expected a missing decision to not allow the continuation callback")
	}

	placeholderExecution := &shuffle.WorkflowExecution{
		Results: []shuffle.ActionResult{
			{
				Action: agentAction,
				Result: `{"reason":"Result too large to handle (https://github.com/frikky/shuffle/issues/171)."}`,
			},
		},
	}

	if !agentCallbackHasInFlightDecision(placeholderExecution, shuffle.ActionResult{Action: agentAction, Status: "agent_d1"}) {
		t.Fatal("expected an offloaded result to allow rehydration by the callback path")
	}

	if agentCallbackHasInFlightDecision(nil, shuffle.ActionResult{Action: agentAction, Status: "agent_d1"}) {
		t.Fatal("expected a nil execution to not allow the continuation callback")
	}
}
