package main

import (
	"testing"

	"github.com/shuffle/shuffle-shared"
)

func TestCachedResultsChanged(t *testing.T) {
	current := shuffle.WorkflowExecution{
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}},
			{Action: shuffle.Action{ID: "two"}},
		},
	}

	if cachedResultsChanged(nil, current) {
		t.Fatal("a nil cached execution must not count as a change")
	}

	empty := &shuffle.WorkflowExecution{}
	if cachedResultsChanged(empty, current) {
		t.Fatal("an empty cached execution must not count as a change")
	}

	same := &shuffle.WorkflowExecution{
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}},
			{Action: shuffle.Action{ID: "two"}},
		},
	}
	if cachedResultsChanged(same, current) {
		t.Fatal("equal result counts must not count as a change")
	}

	changed := &shuffle.WorkflowExecution{
		Results: []shuffle.ActionResult{
			{Action: shuffle.Action{ID: "one"}},
			{Action: shuffle.Action{ID: "two"}},
			{Action: shuffle.Action{ID: "three"}},
		},
	}
	if !cachedResultsChanged(changed, current) {
		t.Fatal("a different result count must be reported as a change")
	}
}
