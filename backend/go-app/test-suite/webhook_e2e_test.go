//go:build e2e

package testsuite

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	uuid "github.com/satori/go.uuid"
)

func managedWebhookWorkflow(webhookID string) workflowWire {
	workflow := managedExecutionWorkflow()
	workflow.Name = "Webhook integration " + uuid.NewV4().String()
	workflow.Description = "Ephemeral workflow created by the webhook integration test"
	workflow.Triggers = []workflowTriggerWire{{
		AppName:     "Webhook",
		AppVersion:  "1.0.0",
		ID:          webhookID,
		Name:        "Webhook",
		Label:       "Webhook integration trigger",
		Environment: "onprem",
		TriggerType: "WEBHOOK",
		IsValid:     true,
	}}
	workflow.Branches = []workflowBranchWire{{
		ID:            uuid.NewV4().String(),
		SourceID:      webhookID,
		DestinationID: workflow.Start,
	}}
	return workflow
}

func TestWebhookExecutionLifecycle(t *testing.T) {
	client := newAPIClient()
	requireExecutionCredentials(t, client)

	webhookID := uuid.NewV4().String()
	workflow := createManagedFixture(t, client, managedWebhookWorkflow(webhookID))
	if len(workflow.Triggers) != 1 {
		t.Fatalf("persisted workflow has %d webhook triggers, want 1", len(workflow.Triggers))
	}
	webhookID = workflow.Triggers[0].ID
	authValue := "tokenvalue1"
	hookPayload := map[string]interface{}{
		"name":            "Webhook integration trigger",
		"type":            "webhook",
		"id":              webhookID,
		"workflow":        workflow.ID,
		"start":           workflow.Start,
		"environment":     "onprem",
		"auth":            "X-Webhook-Key=" + authValue,
		"version_timeout": 15,
	}

	ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_TIMEOUT", defaultExecutionTimeout))
	defer cancel()
	response, body, err := client.jsonRequest(ctx, http.MethodPost, "/api/v1/hooks/new", hookPayload)
	if err != nil {
		t.Fatalf("start webhook: %v", err)
	}
	if err := statusError(http.MethodPost, "/api/v1/hooks/new", response, body, http.StatusOK); err != nil {
		t.Fatal(err)
	}
	var hookResult scheduleResponseWire
	if err := json.Unmarshal(body, &hookResult); err != nil || !hookResult.Success {
		t.Fatalf("start webhook response = %q, err=%v", body, err)
	}

	deletePath := "/api/v1/hooks/" + webhookID + "/delete"
	hookDeleted := false
	t.Cleanup(func() {
		if hookDeleted {
			return
		}
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()
		response, body, err := client.jsonRequest(cleanupCtx, http.MethodDelete, deletePath, nil)
		if err != nil {
			t.Errorf("delete webhook %s: %v", webhookID, err)
			return
		}
		if err := statusError(http.MethodDelete, deletePath, response, body, http.StatusOK); err != nil {
			t.Error(err)
		}
	})

	callbackPath := "/api/v1/hooks/webhook_" + webhookID
	argument := fmt.Sprintf(`{"marker":%q,"kind":"webhook-e2e","equals":"a=b:c"}`, uuid.NewV4().String())
	callWebhook := func(auth, userAgent string) (*http.Response, []byte, error) {
		request, err := client.publicRequestContext(ctx, http.MethodPost, callbackPath, bytes.NewBufferString(argument))
		if err != nil {
			return nil, nil, err
		}
		request.Header.Set("Content-Type", "application/json")
		if auth != "" {
			request.Header.Set("X-Webhook-Key", auth)
		}
		if userAgent != "" {
			request.Header.Set("User-Agent", userAgent)
		}
		return client.doRequest(request)
	}

	response, body, err = callWebhook("", "")
	if err != nil {
		t.Fatalf("call webhook without auth: %v", err)
	}
	if err := statusError(http.MethodPost, callbackPath, response, body, http.StatusUnauthorized); err != nil {
		t.Fatal(err)
	}
	response, body, err = callWebhook(authValue, "GoogleBot integration check")
	if err != nil {
		t.Fatalf("call webhook as blocked bot: %v", err)
	}
	if err := statusError(http.MethodPost, callbackPath, response, body, http.StatusBadRequest); err != nil {
		t.Fatal(err)
	}

	response, body, err = callWebhook(authValue, "Shuffle-E2E")
	if err != nil {
		t.Fatalf("execute webhook: %v", err)
	}
	if err := statusError(http.MethodPost, callbackPath, response, body, http.StatusOK); err != nil {
		t.Fatal(err)
	}
	var started executionStartResponse
	if err := json.Unmarshal(body, &started); err != nil || !started.Success || started.ExecutionID == "" {
		t.Fatalf("webhook execution response = %q, err=%v", body, err)
	}

	execution, err := pollWorkflowHistoryExecution(ctx, client, workflow.ID, started.ExecutionID)
	if err != nil {
		t.Fatal(err)
	}
	if execution.ExecutionSource != "webhook" {
		t.Errorf("execution source = %q, want webhook", execution.ExecutionSource)
	}
	if !expectedStatuses("")[strings.ToUpper(execution.Status)] {
		t.Errorf("webhook execution ended in unexpected status %q", execution.Status)
	}
	assertManagedExecution(t, execution, argument)

	response, body, err = client.jsonRequest(ctx, http.MethodDelete, deletePath, nil)
	if err != nil {
		t.Fatalf("delete webhook: %v", err)
	}
	if err := statusError(http.MethodDelete, deletePath, response, body, http.StatusOK); err != nil {
		t.Fatal(err)
	}
	hookDeleted = true

	response, body, err = callWebhook(authValue, "Shuffle-E2E")
	if err != nil {
		t.Fatalf("call deleted webhook: %v", err)
	}
	if response.StatusCode == http.StatusOK {
		t.Fatalf("deleted webhook still executed: %q", body)
	}
}

func pollWorkflowHistoryExecution(ctx context.Context, client *apiClient, workflowID, executionID string) (executionResponse, error) {
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	var lastStatus string
	var lastErr error
	for {
		executions, err := client.getWorkflowExecutions(ctx, workflowID)
		if err == nil {
			for _, execution := range executions {
				if execution.ExecutionID != executionID {
					continue
				}
				lastStatus = execution.Status
				if isTerminalExecutionStatus(execution.Status) {
					return execution, nil
				}
			}
		} else {
			lastErr = err
		}
		select {
		case <-ctx.Done():
			return executionResponse{}, fmt.Errorf("execution %s did not finish: %w (last status=%q, last error=%v)", executionID, ctx.Err(), lastStatus, lastErr)
		case <-ticker.C:
		}
	}
}
