package main

import (
	"testing"

	"github.com/shuffle/shuffle-shared"
)

func TestCachedExecutionChanged(t *testing.T) {
	current := shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}},
			{Action: shuffle.Action{ID: "two"}},
		},
	}

	if !cachedExecutionChanged(nil, current) {
		t.Fatal("a nil cached execution must count as a change")
	}

	empty := &shuffle.WorkflowExecution{}
	if !cachedExecutionChanged(empty, current) {
		t.Fatal("an empty cached execution must count as a change")
	}

	same := &shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}},
			{Action: shuffle.Action{ID: "two"}},
		},
	}
	if cachedExecutionChanged(same, current) {
		t.Fatal("equal result counts must not count as a change")
	}

	changed := &shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Status:      "EXECUTING",
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}},
			{Action: shuffle.Action{ID: "two"}},
			{Action: shuffle.Action{ID: "three"}},
		},
	}
	if !cachedExecutionChanged(changed, current) {
		t.Fatal("a different result count must be reported as a change")
	}

	statusOnly := &shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Status:      "FINISHED",
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}},
			{Action: shuffle.Action{ID: "two"}},
		},
	}
	if !cachedExecutionChanged(statusOnly, current) {
		t.Fatal("a status-only change must be reported as a change")
	}

	reversed := &shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "two"}},
			{Action: shuffle.Action{ID: "one"}},
		},
	}
	if cachedExecutionChanged(reversed, current) {
		t.Fatal("result ordering must not count as a change")
	}

	resultStatusChanged := &shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}, Status: "SUCCESS"},
			{Action: shuffle.Action{ID: "two"}},
		},
	}
	if !cachedExecutionChanged(resultStatusChanged, current) {
		t.Fatal("a per-result status change must be reported as a change")
	}

	contentChanged := &shuffle.WorkflowExecution{
		ExecutionId: "execution-id",
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}, Result: `{"updated":true}`},
			{Action: shuffle.Action{ID: "two"}},
		},
	}
	if !cachedExecutionChanged(contentChanged, current) {
		t.Fatal("a result content change must be reported as a change")
	}
}
