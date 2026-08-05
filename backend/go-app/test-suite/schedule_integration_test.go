//go:build e2e

package testsuite

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"testing"
	"time"

	uuid "github.com/satori/go.uuid"
)

type scheduleResponseWire struct {
	Success bool   `json:"success"`
	Reason  string `json:"reason"`
}

type schedulesResponseWire struct {
	Schedules []struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	} `json:"schedules"`
}

func managedScheduleWorkflow(scheduleID, frequency, argument string) workflowWire {
	workflow := managedExecutionWorkflow()
	workflow.Name = "Schedule integration " + uuid.NewV4().String()
	workflow.Description = "Ephemeral workflow created by the schedule integration test"
	workflow.Triggers = []workflowTriggerWire{{
		AppName:     "Schedule",
		AppVersion:  "1.0.0",
		ID:          scheduleID,
		Name:        "Schedule",
		Label:       "Schedule integration trigger",
		Environment: "onprem",
		TriggerType: "SCHEDULE",
		IsValid:     true,
		Parameters: []workflowParameterWire{
			{Name: "cron", Value: frequency, Variant: "STATIC_VALUE", Required: true},
			{Name: "execution_argument", Value: argument, Variant: "STATIC_VALUE"},
		},
	}}
	workflow.Branches = []workflowBranchWire{{
		ID:            uuid.NewV4().String(),
		SourceID:      scheduleID,
		DestinationID: workflow.Start,
	}}
	return workflow
}

func scheduleExecutions(ctx context.Context, client *apiClient, workflowID, argument string) ([]executionResponse, error) {
	executions, err := client.getWorkflowExecutions(ctx, workflowID)
	if err != nil {
		return nil, err
	}

	matches := make([]executionResponse, 0)
	for _, execution := range executions {
		if execution.ExecutionSource == "schedule" && execution.ExecutionArgument == argument {
			matches = append(matches, execution)
		}
	}
	return matches, nil
}

func TestScheduleConcurrentStartAndStopIntegration(t *testing.T) {
	client := newAPIClient()
	requireExecutionCredentials(t, client)

	const frequency = "5"
	scheduleID := uuid.NewV4().String()
	argument := fmt.Sprintf(`{"schedule_test":%q}`, uuid.NewV4().String())
	workflow := createManagedFixture(t, client, managedScheduleWorkflow(scheduleID, frequency, argument))
	schedulePath := "/api/v1/workflows/" + workflow.ID + "/schedule"
	stopPath := schedulePath + "/" + scheduleID
	payload := map[string]string{
		"name":               "Schedule integration trigger",
		"frequency":          frequency,
		"execution_argument": argument,
		"environment":        "onprem",
		"id":                 scheduleID,
		"start":              workflow.Start,
	}

	t.Cleanup(func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		_, _, _ = client.jsonRequest(cleanupCtx, http.MethodDelete, stopPath, nil)
	})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	const starts = 16
	errs := make(chan error, starts)
	start := make(chan struct{})
	var waitGroup sync.WaitGroup
	for range starts {
		waitGroup.Add(1)
		go func() {
			defer waitGroup.Done()
			<-start

			response, body, err := client.jsonRequest(ctx, http.MethodPost, schedulePath, payload)
			if err != nil {
				errs <- err
				return
			}
			if err := statusError(http.MethodPost, schedulePath, response, body, http.StatusOK); err != nil {
				errs <- err
				return
			}

			var result scheduleResponseWire
			if err := json.Unmarshal(body, &result); err != nil {
				errs <- fmt.Errorf("decode schedule start response: %w", err)
				return
			}
			if !result.Success {
				errs <- fmt.Errorf("schedule start failed: %s", result.Reason)
			}
		}()
	}
	close(start)
	waitGroup.Wait()
	close(errs)
	for err := range errs {
		if err != nil {
			t.Fatal(err)
		}
	}

	response, body, err := client.jsonRequest(ctx, http.MethodGet, "/api/v1/triggers", nil)
	if err != nil {
		t.Fatalf("get schedules: %v", err)
	}
	if err := statusError(http.MethodGet, "/api/v1/triggers", response, body, http.StatusOK); err != nil {
		t.Fatal(err)
	}
	var triggers schedulesResponseWire
	if err := json.Unmarshal(body, &triggers); err != nil {
		t.Fatalf("decode schedules: %v", err)
	}
	matchingSchedules := 0
	for _, schedule := range triggers.Schedules {
		if schedule.ID == scheduleID {
			matchingSchedules++
			if schedule.Status != "running" {
				t.Errorf("schedule status=%q, want running", schedule.Status)
			}
		}
	}
	if matchingSchedules != 1 {
		t.Fatalf("admin trigger response contains %d copies of schedule %s, want 1", matchingSchedules, scheduleID)
	}

	var executions []executionResponse
	for {
		executions, err = scheduleExecutions(ctx, client, workflow.ID, argument)
		if err == nil && len(executions) > 0 {
			break
		}
		select {
		case <-ctx.Done():
			t.Fatalf("wait for scheduled execution: %v (last error: %v)", ctx.Err(), err)
		case <-time.After(100 * time.Millisecond):
		}
	}
	if len(executions) != 1 {
		t.Fatalf("concurrent starts created %d scheduled executions, want 1", len(executions))
	}

	for stopAttempt := 0; stopAttempt < 2; stopAttempt++ {
		response, body, err = client.jsonRequest(ctx, http.MethodDelete, stopPath, nil)
		if err != nil {
			t.Fatalf("stop schedule attempt %d: %v", stopAttempt+1, err)
		}
		if err := statusError(http.MethodDelete, stopPath, response, body, http.StatusOK); err != nil {
			t.Fatal(err)
		}
		var result scheduleResponseWire
		if err := json.Unmarshal(body, &result); err != nil {
			t.Fatalf("decode schedule stop response: %v", err)
		}
		if !result.Success {
			t.Fatalf("schedule stop attempt %d failed: %s", stopAttempt+1, result.Reason)
		}
	}

	time.Sleep(6 * time.Second)
	executions, err = scheduleExecutions(ctx, client, workflow.ID, argument)
	if err != nil {
		t.Fatalf("get executions after stop: %v", err)
	}
	if len(executions) != 1 {
		t.Fatalf("schedule continued after stop: got %d executions, want 1", len(executions))
	}
}
