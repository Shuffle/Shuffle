//go:build e2e

package testsuite

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
	"unicode/utf8"

	uuid "github.com/satori/go.uuid"
)

const (
	defaultExecutionTimeout          = 5 * time.Minute
	shuffleToolsAppID                = "3e2bdf9d5069fe3f4746c29d68785a6a"
	defaultHealthWorkflowTemplateURL = "https://shuffler.io/api/v1/workflows/ae89a788-a26b-4866-8a0b-ce0b31d354ea"
	maxHealthWorkflowTemplateBytes   = 2 << 20
)

// These are intentionally narrow HTTP wire projections, not copies of
// shuffle-shared's domain model. Keeping this package independent avoids the
// shuffle-shared test-binary startup guard, and JSON decoding safely ignores
// response fields that are irrelevant to these assertions.
type workflowParameterWire struct {
	Name          string `json:"name"`
	Value         string `json:"value"`
	Variant       string `json:"variant,omitempty"`
	Required      bool   `json:"required,omitempty"`
	Multiline     bool   `json:"multiline,omitempty"`
	Configuration bool   `json:"configuration,omitempty"`
}

type workflowActionWire struct {
	AppName        string                  `json:"app_name"`
	AppVersion     string                  `json:"app_version"`
	AppID          string                  `json:"app_id"`
	ID             string                  `json:"id"`
	Name           string                  `json:"name"`
	Label          string                  `json:"label"`
	Environment    string                  `json:"environment"`
	IsValid        bool                    `json:"is_valid"`
	IsStartNode    bool                    `json:"isStartNode,omitempty"`
	ExecutionDelay int64                   `json:"execution_delay,omitempty"`
	Parameters     []workflowParameterWire `json:"parameters"`
}

type workflowTriggerWire struct {
	AppName        string                  `json:"app_name"`
	AppVersion     string                  `json:"app_version"`
	ID             string                  `json:"id"`
	Name           string                  `json:"name"`
	Label          string                  `json:"label"`
	TriggerType    string                  `json:"trigger_type"`
	IsValid        bool                    `json:"is_valid"`
	ExecutionDelay int64                   `json:"execution_delay,omitempty"`
	Parameters     []workflowParameterWire `json:"parameters"`
}

type workflowBranchWire struct {
	ID            string `json:"id"`
	SourceID      string `json:"source_id"`
	DestinationID string `json:"destination_id"`
}

type workflowWire struct {
	ID                   string                `json:"id"`
	Name                 string                `json:"name"`
	Description          string                `json:"description"`
	Start                string                `json:"start"`
	Owner                string                `json:"owner"`
	OrgID                string                `json:"org_id"`
	IsValid              bool                  `json:"is_valid"`
	PreviouslySaved      bool                  `json:"previously_saved"`
	ExecutionEnvironment string                `json:"execution_environment"`
	Actions              []workflowActionWire  `json:"actions"`
	Branches             []workflowBranchWire  `json:"branches"`
	Triggers             []workflowTriggerWire `json:"triggers"`
}

type executionStartResponse struct {
	Success       bool   `json:"success"`
	ExecutionID   string `json:"execution_id"`
	Authorization string `json:"authorization"`
	Reason        string `json:"reason"`
}

type synchronousExecutionResponse struct {
	Success       bool     `json:"success"`
	Result        string   `json:"result"`
	ExecutionID   string   `json:"id"`
	Authorization string   `json:"authorization"`
	Errors        []string `json:"errors"`
}

type executionResultWire struct {
	Action      workflowActionWire `json:"action"`
	ExecutionID string             `json:"execution_id"`
	Result      string             `json:"result"`
	StartedAt   int64              `json:"started_at"`
	CompletedAt int64              `json:"completed_at"`
	Status      string             `json:"status"`
}

type executionResponse struct {
	Status              string                `json:"status"`
	Start               string                `json:"start"`
	ExecutionArgument   string                `json:"execution_argument"`
	ExecutionID         string                `json:"execution_id"`
	ExecutionOrg        string                `json:"execution_org"`
	StartedAt           int64                 `json:"started_at"`
	CompletedAt         int64                 `json:"completed_at"`
	WorkflowID          string                `json:"workflow_id"`
	Authorization       string                `json:"authorization"`
	Result              string                `json:"result"`
	Workflow            workflowWire          `json:"workflow"`
	Results             []executionResultWire `json:"results"`
	ExecutionSource     string                `json:"execution_source"`
	ExecutionParent     string                `json:"execution_parent"`
	ExecutionSourceNode string                `json:"execution_source_node"`
	ExecutionSourceAuth string                `json:"execution_source_auth"`
	SubExecutionCount   int64                 `json:"sub_execution_count"`
}

type subflowResultWire struct {
	Success       bool   `json:"success"`
	ExecutionID   string `json:"execution_id"`
	Authorization string `json:"authorization"`
	Result        string `json:"result"`
	ResultSet     bool   `json:"result_set"`
}

type executionArtifact struct {
	Test              string             `json:"test"`
	Seed              int64              `json:"seed,omitempty"`
	Recipe            string             `json:"recipe,omitempty"`
	WorkflowID        string             `json:"workflow_id"`
	ExecutionID       string             `json:"execution_id,omitempty"`
	ArgumentBytes     int                `json:"argument_bytes"`
	ArgumentPreview   string             `json:"argument_preview,omitempty"`
	LastExecution     *executionResponse `json:"last_execution,omitempty"`
	RecordedAt        time.Time          `json:"recorded_at"`
	ExecutionAuthSeen bool               `json:"execution_authorization_present"`
}

func e2eBool(name string) bool {
	value, err := strconv.ParseBool(strings.TrimSpace(os.Getenv(name)))
	return err == nil && value
}

func e2eInt(name string, fallback int) int {
	value, err := strconv.Atoi(strings.TrimSpace(os.Getenv(name)))
	if err != nil {
		return fallback
	}
	return value
}

func e2eDuration(name string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func requireExecutionCredentials(t *testing.T, client *apiClient) {
	t.Helper()
	if client.apiKey == "" {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			t.Fatal("SHUFFLE_E2E_STRICT requires SHUFFLE_TEST_API_KEY")
		}
		t.Skip("set SHUFFLE_TEST_API_KEY to run execution E2E tests")
	}
	if e2eBool("SHUFFLE_E2E_STRICT") && strings.TrimSpace(os.Getenv("SHUFFLE_TEST_ORG_ID")) == "" {
		t.Fatal("SHUFFLE_E2E_STRICT requires SHUFFLE_TEST_ORG_ID")
	}
}

func (client *apiClient) jsonRequest(ctx context.Context, method, path string, payload any) (*http.Response, []byte, error) {
	var body bytes.Buffer
	if payload != nil {
		if err := json.NewEncoder(&body).Encode(payload); err != nil {
			return nil, nil, fmt.Errorf("encode %s %s payload: %w", method, path, err)
		}
	}

	request, err := client.requestContext(ctx, method, path, &body)
	if err != nil {
		return nil, nil, fmt.Errorf("create %s %s request: %w", method, path, err)
	}
	if payload != nil {
		request.Header.Set("Content-Type", "application/json")
	}

	return client.doRequest(request)
}

func (client *apiClient) createWorkflow(ctx context.Context, workflow workflowWire) (workflowWire, error) {
	response, body, err := client.jsonRequest(ctx, http.MethodPost, "/api/v1/workflows", workflow)
	if err != nil {
		return workflowWire{}, err
	}
	if err := statusError(http.MethodPost, "/api/v1/workflows", response, body, http.StatusOK); err != nil {
		return workflowWire{}, err
	}

	var created workflowWire
	if err := json.Unmarshal(body, &created); err != nil {
		return workflowWire{}, fmt.Errorf("decode created workflow: %w; body=%q", err, body)
	}
	if _, err := uuid.FromString(created.ID); err != nil {
		return workflowWire{}, fmt.Errorf("backend returned invalid workflow ID %q: %w", created.ID, err)
	}
	if created.Start == "" || len(created.Actions) == 0 {
		return workflowWire{}, fmt.Errorf("created workflow is missing its start/action: %#v", created)
	}
	stored, status, err := client.getWorkflow(ctx, created.ID)
	if err != nil {
		return workflowWire{}, fmt.Errorf("read newly created workflow: %w", err)
	}
	if status != http.StatusOK {
		return workflowWire{}, fmt.Errorf("newly created workflow returned status %d", status)
	}
	if stored.ID != created.ID || stored.Name != created.Name || stored.Start != created.Start || len(stored.Actions) != len(created.Actions) || len(stored.Triggers) != len(created.Triggers) || len(stored.Branches) != len(created.Branches) {
		return workflowWire{}, fmt.Errorf("created workflow did not round-trip: response=%s/%s/%s actions=%d triggers=%d branches=%d stored=%s/%s/%s actions=%d triggers=%d branches=%d", created.ID, created.Name, created.Start, len(created.Actions), len(created.Triggers), len(created.Branches), stored.ID, stored.Name, stored.Start, len(stored.Actions), len(stored.Triggers), len(stored.Branches))
	}
	startFound := false
	for _, action := range stored.Actions {
		if action.ID == stored.Start {
			startFound = true
			break
		}
	}
	if !startFound {
		return workflowWire{}, fmt.Errorf("created workflow start %s does not reference an action", stored.Start)
	}
	if wantOrg := strings.TrimSpace(os.Getenv("SHUFFLE_TEST_ORG_ID")); wantOrg != "" && stored.OrgID != wantOrg {
		return workflowWire{}, fmt.Errorf("created workflow belongs to org %q, want %q", stored.OrgID, wantOrg)
	}

	return created, nil
}

func fetchHealthWorkflowTemplate(ctx context.Context) (map[string]any, error) {
	templateURL := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_HEALTH_WORKFLOW_TEMPLATE_URL"))
	if templateURL == "" {
		templateURL = defaultHealthWorkflowTemplateURL
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, templateURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create health workflow template request: %w", err)
	}
	response, err := (&http.Client{Timeout: 30 * time.Second}).Do(request)
	if err != nil {
		return nil, fmt.Errorf("fetch health workflow template: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetch health workflow template returned HTTP %d", response.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(response.Body, maxHealthWorkflowTemplateBytes+1))
	if err != nil {
		return nil, fmt.Errorf("read health workflow template: %w", err)
	}
	if len(body) > maxHealthWorkflowTemplateBytes {
		return nil, fmt.Errorf("health workflow template exceeded %d bytes", maxHealthWorkflowTemplateBytes)
	}

	var workflow map[string]any
	if err := json.Unmarshal(body, &workflow); err != nil {
		return nil, fmt.Errorf("decode health workflow template: %w", err)
	}
	return workflow, nil
}

func prepareHealthWorkflowTemplate(template map[string]any, created workflowWire, client *apiClient) error {
	environment := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_ENVIRONMENT"))
	if environment == "" {
		environment = "Shuffle"
	}
	executionEnvironment := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_EXECUTION_ENVIRONMENT"))
	if executionEnvironment == "" {
		executionEnvironment = "onprem"
	}

	template["id"] = created.ID
	template["name"] = "E2E health workflow " + uuid.NewV4().String()
	template["owner"] = created.Owner
	template["org_id"] = created.OrgID
	template["public"] = false
	template["hidden"] = true
	template["status"] = ""
	template["is_valid"] = true
	template["previously_saved"] = true
	template["execution_environment"] = executionEnvironment
	template["executing_org"] = map[string]any{"id": created.OrgID}

	actions, ok := template["actions"].([]any)
	if !ok || len(actions) == 0 {
		return errors.New("health workflow template has no actions")
	}
	for _, value := range actions {
		action, ok := value.(map[string]any)
		if !ok {
			return errors.New("health workflow template contains an invalid action")
		}
		action["environment"] = environment
		if source, _ := action["source_workflow"].(string); source != "" {
			action["source_workflow"] = created.ID
		}
	}

	variables, _ := template["workflow_variables"].([]any)
	cacheKey := "e2e-health-" + uuid.NewV4().String()
	for _, value := range variables {
		variable, ok := value.(map[string]any)
		if !ok {
			continue
		}
		switch strings.ToLower(strings.TrimSpace(fmt.Sprint(variable["name"]))) {
		case "apikey", "shuffle_apikey":
			variable["value"] = client.apiKey
		case "cachekey":
			variable["value"] = cacheKey
		}
	}

	triggers, ok := template["triggers"].([]any)
	if !ok || len(triggers) == 0 {
		return errors.New("health workflow template has no subflow trigger")
	}
	for _, value := range triggers {
		trigger, ok := value.(map[string]any)
		if !ok {
			continue
		}
		parameters, _ := trigger["parameters"].([]any)
		for _, parameterValue := range parameters {
			parameter, ok := parameterValue.(map[string]any)
			if !ok {
				continue
			}
			switch strings.ToLower(strings.TrimSpace(fmt.Sprint(parameter["name"]))) {
			case "workflow":
				parameter["value"] = created.ID
			case "user_apikey":
				parameter["value"] = client.apiKey
			}
		}
	}

	return nil
}

func (client *apiClient) replaceWorkflow(ctx context.Context, workflowID string, workflow map[string]any) (workflowWire, error) {
	path := "/api/v1/workflows/" + workflowID + "?skip_save=true"
	response, body, err := client.jsonRequest(ctx, http.MethodPut, path, workflow)
	if err != nil {
		return workflowWire{}, err
	}
	if err := statusError(http.MethodPut, path, response, body, http.StatusOK); err != nil {
		return workflowWire{}, err
	}

	stored, status, err := client.getWorkflow(ctx, workflowID)
	if err != nil {
		return workflowWire{}, fmt.Errorf("read saved health workflow: %w", err)
	}
	if status != http.StatusOK {
		return workflowWire{}, fmt.Errorf("saved health workflow returned HTTP %d", status)
	}
	if stored.ID != workflowID || stored.Start == "" || len(stored.Actions) < 10 || len(stored.Triggers) == 0 {
		return workflowWire{}, fmt.Errorf("saved health workflow is incomplete: id=%q start=%q actions=%d triggers=%d", stored.ID, stored.Start, len(stored.Actions), len(stored.Triggers))
	}
	return stored, nil
}

func (client *apiClient) getWorkflow(ctx context.Context, workflowID string) (workflowWire, int, error) {
	path := "/api/v1/workflows/" + workflowID
	response, body, err := client.jsonRequest(ctx, http.MethodGet, path, nil)
	if err != nil {
		return workflowWire{}, 0, err
	}
	if response.StatusCode != http.StatusOK {
		return workflowWire{}, response.StatusCode, fmt.Errorf("GET %s returned %d: %q", path, response.StatusCode, body)
	}
	var workflow workflowWire
	if err := json.Unmarshal(body, &workflow); err != nil {
		return workflowWire{}, response.StatusCode, fmt.Errorf("decode workflow %s: %w", workflowID, err)
	}
	return workflow, response.StatusCode, nil
}

func (client *apiClient) deleteWorkflow(ctx context.Context, workflowID string) error {
	path := "/api/v1/workflows/" + workflowID
	response, body, err := client.jsonRequest(ctx, http.MethodDelete, path, nil)
	if err != nil {
		return err
	}
	if err := statusError(http.MethodDelete, path, response, body, http.StatusOK); err != nil {
		return err
	}
	_, status, getErr := client.getWorkflow(ctx, workflowID)
	if getErr == nil || status == http.StatusOK {
		return fmt.Errorf("workflow %s still exists after successful DELETE", workflowID)
	}
	if status != http.StatusBadRequest {
		return fmt.Errorf("deleted workflow %s returned status %d, want %d: %v", workflowID, status, http.StatusBadRequest, getErr)
	}
	return nil
}

func (client *apiClient) startExecution(ctx context.Context, workflowID, argument string) (executionStartResponse, error) {
	if err := validateExecutionArgument(argument); err != nil {
		return executionStartResponse{}, err
	}
	path := "/api/v1/workflows/" + workflowID + "/execute"
	payload := map[string]any{
		"execution_argument": argument,
		"execution_source":   "e2e_test",
	}
	response, body, err := client.jsonRequest(ctx, http.MethodPost, path, payload)
	if err != nil {
		return executionStartResponse{}, err
	}
	if err := statusError(http.MethodPost, path, response, body, http.StatusOK); err != nil {
		return executionStartResponse{}, err
	}

	var started executionStartResponse
	if err := json.Unmarshal(body, &started); err != nil {
		return executionStartResponse{}, fmt.Errorf("decode execution start: %w; body=%q", err, body)
	}
	if !started.Success {
		return executionStartResponse{}, fmt.Errorf("execution start reported failure: %s", started.Reason)
	}
	if _, err := uuid.FromString(started.ExecutionID); err != nil {
		return executionStartResponse{}, fmt.Errorf("backend returned invalid execution ID %q: %w", started.ExecutionID, err)
	}
	if started.Authorization == "" {
		return executionStartResponse{}, errors.New("backend returned empty execution authorization")
	}

	return started, nil
}

func validateExecutionArgument(argument string) error {
	if !utf8.ValidString(argument) {
		return errors.New("execution argument is not valid UTF-8")
	}
	return nil
}

func (client *apiClient) getExecution(ctx context.Context, executionID, authorization string) (executionResponse, int, error) {
	payload := map[string]string{
		"execution_id":  executionID,
		"authorization": authorization,
	}
	response, body, err := client.jsonRequest(ctx, http.MethodPost, "/api/v1/streams/results", payload)
	if err != nil {
		return executionResponse{}, 0, err
	}
	if response.StatusCode != http.StatusOK {
		return executionResponse{}, response.StatusCode, fmt.Errorf("read execution returned %d: %q", response.StatusCode, body)
	}

	var execution executionResponse
	if err := json.Unmarshal(body, &execution); err != nil {
		return executionResponse{}, response.StatusCode, fmt.Errorf("decode execution: %w; body=%q", err, body)
	}
	return execution, response.StatusCode, nil
}

func (client *apiClient) getWorkflowExecutions(ctx context.Context, workflowID string) ([]executionResponse, error) {
	path := "/api/v1/workflows/" + workflowID + "/executions?top=100"
	response, body, err := client.jsonRequest(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}
	if err := statusError(http.MethodGet, path, response, body, http.StatusOK); err != nil {
		return nil, err
	}
	var executions []executionResponse
	if err := json.Unmarshal(body, &executions); err != nil {
		return nil, fmt.Errorf("decode execution history: %w; body=%q", err, body)
	}
	return executions, nil
}

func waitForExecutionHistory(ctx context.Context, client *apiClient, workflowID, executionID string) (executionResponse, error) {
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	var lastErr error
	for {
		executions, err := client.getWorkflowExecutions(ctx, workflowID)
		if err == nil {
			for _, execution := range executions {
				if execution.ExecutionID == executionID {
					return execution, nil
				}
			}
		} else {
			lastErr = err
		}
		select {
		case <-ctx.Done():
			return executionResponse{}, fmt.Errorf("execution %s did not appear in workflow history: %w (last error: %v)", executionID, ctx.Err(), lastErr)
		case <-ticker.C:
		}
	}
}

func pollExecution(ctx context.Context, client *apiClient, started executionStartResponse) (executionResponse, error) {
	delay := 100 * time.Millisecond
	var last executionResponse
	var lastErr error

	for {
		execution, status, err := client.getExecution(ctx, started.ExecutionID, started.Authorization)
		if err == nil {
			lastErr = nil
			last = execution
			if isTerminalExecutionStatus(execution.Status) {
				return execution, nil
			}
		} else if status != http.StatusBadRequest {
			lastErr = err
		}

		select {
		case <-ctx.Done():
			if lastErr != nil {
				return last, fmt.Errorf("poll execution %s: %w (last request error: %v)", started.ExecutionID, ctx.Err(), lastErr)
			}
			return last, fmt.Errorf("poll execution %s: %w (last status %q, %d results)", started.ExecutionID, ctx.Err(), last.Status, len(last.Results))
		case <-time.After(delay):
		}

		if delay < 2*time.Second {
			delay *= 2
			if delay > 2*time.Second {
				delay = 2 * time.Second
			}
		}
	}
}

// executionTokenClient deliberately removes the API key. Reads made with this
// client prove that the execution-scoped authorization returned by /execute is
// valid instead of silently succeeding through organization authentication.
func executionTokenClient(client *apiClient) *apiClient {
	copy := *client
	copy.apiKey = ""
	return &copy
}

func isTerminalExecutionStatus(status string) bool {
	switch strings.ToUpper(status) {
	case "FINISHED", "SUCCESS", "FAILURE", "ABORTED":
		return true
	default:
		return false
	}
}

func expectedStatuses(value string) map[string]bool {
	if strings.TrimSpace(value) == "" {
		value = "FINISHED,SUCCESS"
	}
	statuses := map[string]bool{}
	for _, status := range strings.Split(value, ",") {
		status = strings.ToUpper(strings.TrimSpace(status))
		if status != "" {
			statuses[status] = true
		}
	}
	return statuses
}

func assertExecutionInvariants(t *testing.T, execution executionResponse, started executionStartResponse, workflowID string) {
	t.Helper()
	if execution.ExecutionID != started.ExecutionID {
		t.Errorf("execution ID changed: got %q, want %q", execution.ExecutionID, started.ExecutionID)
	}
	if execution.WorkflowID != workflowID {
		t.Errorf("execution workflow changed: got %q, want %q", execution.WorkflowID, workflowID)
	}
	if execution.Workflow.ID != workflowID {
		t.Errorf("embedded workflow ID changed: got %q, want %q", execution.Workflow.ID, workflowID)
	}
	if execution.Start == "" {
		t.Error("execution has no start node")
	} else if execution.ExecutionParent == "" && execution.Start != execution.Workflow.Start {
		t.Errorf("execution start %q does not match embedded workflow start %q", execution.Start, execution.Workflow.Start)
	}
	if execution.ExecutionParent == "" && execution.ExecutionSource != "e2e_test" {
		t.Errorf("execution source changed: got %q, want e2e_test", execution.ExecutionSource)
	}
	if wantOrg := strings.TrimSpace(os.Getenv("SHUFFLE_TEST_ORG_ID")); wantOrg != "" && execution.ExecutionOrg != wantOrg {
		t.Errorf("execution belongs to org %q, want %q", execution.ExecutionOrg, wantOrg)
	}
	if execution.Authorization != started.Authorization {
		t.Error("stored execution authorization does not match the start response")
	}
	if !isTerminalExecutionStatus(execution.Status) {
		t.Errorf("execution is not terminal: %q", execution.Status)
	}
	if execution.StartedAt <= 0 {
		t.Errorf("execution has invalid started_at: %d", execution.StartedAt)
	}
	if execution.CompletedAt <= 0 {
		t.Errorf("terminal execution has invalid completed_at: %d", execution.CompletedAt)
	} else if execution.CompletedAt < execution.StartedAt {
		t.Errorf("execution completed before it started: started=%d completed=%d", execution.StartedAt, execution.CompletedAt)
	}
	if execution.StartedAt > time.Now().Unix()+30 || execution.CompletedAt > time.Now().Unix()+30 {
		t.Errorf("execution timestamps are in the future: started=%d completed=%d", execution.StartedAt, execution.CompletedAt)
	}

	seen := map[string]bool{}
	for index, result := range execution.Results {
		if result.Action.ID == "" {
			t.Errorf("result %d has no action ID", index)
			continue
		}
		if seen[result.Action.ID] {
			t.Errorf("action %s has duplicate results", result.Action.ID)
		}
		seen[result.Action.ID] = true
		if result.ExecutionID != "" && result.ExecutionID != execution.ExecutionID {
			t.Errorf("result for action %s belongs to execution %s", result.Action.ID, result.ExecutionID)
		}
		status := strings.ToUpper(result.Status)
		switch status {
		case "SUCCESS", "FAILURE", "ABORTED", "SKIPPED", "FINISHED":
		default:
			t.Errorf("terminal execution contains non-terminal action %s status %q", result.Action.ID, result.Status)
		}
		if (result.StartedAt <= 0 || result.CompletedAt <= 0) && status != "SKIPPED" {
			t.Errorf("action %s has invalid timestamps: started=%d completed=%d", result.Action.ID, result.StartedAt, result.CompletedAt)
		} else if result.CompletedAt < result.StartedAt {
			t.Errorf("action %s completed before it started", result.Action.ID)
		}
	}

	if strings.EqualFold(execution.Status, "FINISHED") || strings.EqualFold(execution.Status, "SUCCESS") {
		for _, action := range execution.Workflow.Actions {
			if !seen[action.ID] {
				t.Errorf("successful execution has no result for workflow action %s (%s)", action.ID, action.Label)
			}
		}
	}
}

func assertManagedExecution(t *testing.T, execution executionResponse, argument string) {
	t.Helper()
	if len(execution.Workflow.Actions) != 1 {
		t.Fatalf("managed workflow changed action count: got %d, want 1", len(execution.Workflow.Actions))
	}
	if len(execution.Results) != 1 {
		t.Fatalf("managed workflow returned %d results, want 1", len(execution.Results))
	}
	result := execution.Results[0]
	if strings.ToUpper(result.Status) != "SUCCESS" {
		t.Errorf("managed action status: got %q, want SUCCESS; result=%q", result.Status, result.Result)
	}
	if !resultContainsArgument(result.Result, argument) {
		t.Errorf("managed action result did not round-trip the complete %d-byte argument; result=%q", len(argument), truncate(result.Result, 512))
	}
}

func resultContainsArgument(result, argument string) bool {
	if result == argument || strings.Contains(result, argument) {
		return true
	}
	var argumentJSON any
	var resultJSON any
	if json.Unmarshal([]byte(argument), &argumentJSON) == nil && json.Unmarshal([]byte(result), &resultJSON) == nil && reflect.DeepEqual(argumentJSON, resultJSON) {
		return true
	}
	var decoded any
	if json.Unmarshal([]byte(result), &decoded) != nil {
		return false
	}
	var find func(any) bool
	find = func(value any) bool {
		switch typed := value.(type) {
		case string:
			return typed == argument || strings.Contains(typed, argument)
		case []any:
			for _, item := range typed {
				if find(item) {
					return true
				}
			}
		case map[string]any:
			for _, item := range typed {
				if find(item) {
					return true
				}
			}
		}
		return false
	}
	return find(decoded)
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	return value[:limit] + "...[truncated]"
}

func managedExecutionWorkflow() workflowWire {
	actionID := uuid.NewV4().String()
	environment := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_ENVIRONMENT"))
	if environment == "" {
		environment = "Shuffle"
	}
	executionEnvironment := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_EXECUTION_ENVIRONMENT"))
	if executionEnvironment == "" {
		executionEnvironment = "onprem"
	}
	return workflowWire{
		Name:                 "E2E execution " + uuid.NewV4().String(),
		Description:          "Ephemeral workflow created by the execution E2E suite",
		Start:                actionID,
		IsValid:              true,
		ExecutionEnvironment: executionEnvironment,
		Actions: []workflowActionWire{{
			AppName:     "Shuffle Tools",
			AppVersion:  "1.2.0",
			AppID:       shuffleToolsAppID,
			ID:          actionID,
			Name:        "repeat_back_to_me",
			Label:       "E2E_repeat_back_to_me",
			Environment: environment,
			IsValid:     true,
			IsStartNode: true,
			Parameters: []workflowParameterWire{{
				Name:      "call",
				Value:     "$exec",
				Variant:   "STATIC_VALUE",
				Required:  true,
				Multiline: true,
			}},
		}},
		Branches: []workflowBranchWire{},
		Triggers: []workflowTriggerWire{},
	}
}

func managedAbortWorkflow() workflowWire {
	workflow := managedExecutionWorkflow()
	workflow.Name = "E2E abort " + uuid.NewV4().String()
	workflow.Description = "Ephemeral delayed workflow created by the strict abort E2E test"
	workflow.Actions[0].ExecutionDelay = 30
	return workflow
}

func managedSubflowParent(child workflowWire) workflowWire {
	workflow := managedExecutionWorkflow()
	workflow.Name = "E2E subflow parent " + uuid.NewV4().String()
	workflow.Description = "Ephemeral parent created by the strict subflow E2E test"
	triggerID := uuid.NewV4().String()
	workflow.Triggers = []workflowTriggerWire{{
		AppName:     "Shuffle Workflow",
		AppVersion:  "1.0.0",
		ID:          triggerID,
		Name:        "Shuffle Workflow",
		Label:       "E2E_child_workflow",
		TriggerType: "SUBFLOW",
		IsValid:     true,
		Parameters: []workflowParameterWire{
			{Name: "workflow", Value: child.ID, Variant: "STATIC_VALUE", Required: true},
			{Name: "argument", Value: "$exec", Variant: "STATIC_VALUE"},
			{Name: "startnode", Value: child.Start, Variant: "STATIC_VALUE"},
			{Name: "check_result", Value: "true", Variant: "STATIC_VALUE"},
		},
	}}
	workflow.Branches = []workflowBranchWire{{
		ID:            uuid.NewV4().String(),
		SourceID:      workflow.Start,
		DestinationID: triggerID,
	}}
	return workflow
}

func executionWorkflow(t *testing.T, client *apiClient) (workflowWire, bool) {
	t.Helper()
	if workflowID := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_WORKFLOW_ID")); workflowID != "" {
		if _, err := uuid.FromString(workflowID); err != nil {
			t.Fatalf("SHUFFLE_E2E_WORKFLOW_ID is not a UUID: %v", err)
		}
		return workflowWire{ID: workflowID}, false
	}
	if !e2eBool("SHUFFLE_E2E_MANAGED_WORKFLOW") {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			t.Fatal("SHUFFLE_E2E_STRICT requires SHUFFLE_E2E_WORKFLOW_ID or SHUFFLE_E2E_MANAGED_WORKFLOW=true")
		}
		t.Skip("set SHUFFLE_E2E_WORKFLOW_ID, or SHUFFLE_E2E_MANAGED_WORKFLOW=true to create an ephemeral Shuffle Tools workflow")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	workflow, err := client.createWorkflow(ctx, managedExecutionWorkflow())
	if err != nil {
		t.Fatalf("create managed execution workflow: %v", err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()
		if err := client.deleteWorkflow(cleanupCtx, workflow.ID); err != nil {
			t.Errorf("delete managed workflow %s: %v", workflow.ID, err)
		}
	})
	return workflow, true
}

func createManagedFixture(t *testing.T, client *apiClient, document workflowWire) workflowWire {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	workflow, err := client.createWorkflow(ctx, document)
	if err != nil {
		t.Fatalf("create managed fixture %q: %v", document.Name, err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()
		if err := client.deleteWorkflow(cleanupCtx, workflow.ID); err != nil {
			t.Errorf("delete managed fixture %s: %v", workflow.ID, err)
		}
	})
	return workflow
}

func recordFailureArtifact(t *testing.T, artifact executionArtifact) {
	t.Helper()
	if !t.Failed() {
		return
	}
	artifact.RecordedAt = time.Now().UTC()
	if artifact.LastExecution != nil {
		artifact.ExecutionAuthSeen = artifact.LastExecution.Authorization != ""
		artifact.LastExecution.Authorization = "[redacted]"
		artifact.LastExecution.ExecutionSourceAuth = "[redacted]"
		artifact.LastExecution.ExecutionArgument = truncate(artifact.LastExecution.ExecutionArgument, 2048)
		for actionIndex := range artifact.LastExecution.Workflow.Actions {
			redactParameters(artifact.LastExecution.Workflow.Actions[actionIndex].Parameters)
		}
		for index := range artifact.LastExecution.Results {
			artifact.LastExecution.Results[index].Result = truncate(artifact.LastExecution.Results[index].Result, 2048)
			redactParameters(artifact.LastExecution.Results[index].Action.Parameters)
		}
	}

	directory := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_ARTIFACT_DIR"))
	if directory == "" {
		var err error
		directory, err = os.MkdirTemp("", "shuffle-e2e-failure-")
		if err != nil {
			t.Logf("create temporary E2E artifact directory: %v", err)
			return
		}
	}
	if err := os.MkdirAll(directory, 0o750); err != nil {
		t.Logf("create E2E artifact directory: %v", err)
		return
	}
	data, err := json.MarshalIndent(artifact, "", "  ")
	if err != nil {
		t.Logf("marshal E2E failure artifact: %v", err)
		return
	}
	name := strings.NewReplacer("/", "_", " ", "_").Replace(t.Name()) + "-" + strconv.FormatInt(time.Now().UnixNano(), 10) + ".json"
	path := filepath.Join(directory, name)
	if err := os.WriteFile(path, data, 0o600); err != nil {
		t.Logf("write E2E failure artifact: %v", err)
		return
	}
	t.Logf("E2E failure artifact: %s", path)
}

func redactParameters(parameters []workflowParameterWire) {
	for index := range parameters {
		name := strings.ToLower(parameters[index].Name)
		if parameters[index].Configuration || strings.Contains(name, "key") || strings.Contains(name, "pass") || strings.Contains(name, "secret") || strings.Contains(name, "token") || strings.Contains(name, "auth") {
			parameters[index].Value = "[redacted]"
		}
	}
}

func TestExecutionLifecycle(t *testing.T) {
	client := newAPIClient()
	requireExecutionCredentials(t, client)
	workflow, managed := executionWorkflow(t, client)

	marker := "shuffle-e2e-" + uuid.NewV4().String()
	argument := fmt.Sprintf(`{"marker":%q,"kind":"execution-lifecycle"}`, marker)
	var last *executionResponse
	var started executionStartResponse
	t.Cleanup(func() {
		recordFailureArtifact(t, executionArtifact{
			Test:            t.Name(),
			WorkflowID:      workflow.ID,
			ExecutionID:     started.ExecutionID,
			ArgumentBytes:   len(argument),
			ArgumentPreview: truncate(argument, 512),
			LastExecution:   last,
		})
	})

	ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_TIMEOUT", defaultExecutionTimeout))
	defer cancel()
	anonymous := *client
	anonymous.apiKey = ""
	path := "/api/v1/workflows/" + workflow.ID + "/execute"
	response, body, err := anonymous.jsonRequest(ctx, http.MethodPost, path, map[string]string{"execution_argument": `{"unauthorized":true}`})
	if err != nil {
		t.Fatalf("attempt anonymous execution: %v", err)
	}
	if err := statusError(http.MethodPost, path, response, body, http.StatusForbidden); err != nil {
		t.Fatalf("anonymous execution was not rejected correctly: %v", err)
	}
	invalidKey := anonymous
	invalidKey.apiKey = uuid.NewV4().String()
	response, body, err = invalidKey.jsonRequest(ctx, http.MethodPost, path, map[string]string{"execution_argument": `{"invalid_key":true}`})
	if err != nil {
		t.Fatalf("attempt invalid-key execution: %v", err)
	}
	if err := statusError(http.MethodPost, path, response, body, http.StatusForbidden); err != nil {
		t.Fatalf("invalid-key execution was not rejected correctly: %v", err)
	}

	started, err = client.startExecution(ctx, workflow.ID, argument)
	if err != nil {
		t.Fatalf("start execution: %v", err)
	}
	reader := executionTokenClient(client)
	_, status, missingAuthErr := reader.getExecution(ctx, started.ExecutionID, "")
	if missingAuthErr == nil || status != http.StatusUnauthorized {
		t.Errorf("missing execution authorization was not rejected: status=%d err=%v", status, missingAuthErr)
	}
	execution, err := pollExecution(ctx, reader, started)
	last = &execution
	if err != nil {
		t.Fatalf("wait for execution: %v", err)
	}

	assertExecutionInvariants(t, execution, started, workflow.ID)
	if !expectedStatuses(os.Getenv("SHUFFLE_E2E_EXPECT_STATUS"))[strings.ToUpper(execution.Status)] {
		t.Errorf("unexpected terminal status %q; configure SHUFFLE_E2E_EXPECT_STATUS for intentional failure workflows", execution.Status)
	}
	if execution.ExecutionArgument != argument {
		t.Errorf("execution argument did not round-trip: got %d bytes, want %d", len(execution.ExecutionArgument), len(argument))
	}
	if managed {
		assertManagedExecution(t, execution, argument)
	}

	secondRead, _, err := reader.getExecution(ctx, started.ExecutionID, started.Authorization)
	if err != nil {
		t.Fatalf("read completed execution again: %v", err)
	}
	if secondRead.Status != execution.Status || len(secondRead.Results) != len(execution.Results) || secondRead.Result != execution.Result {
		t.Errorf("completed execution changed across reads: first status/results=%s/%d, second=%s/%d", execution.Status, len(execution.Results), secondRead.Status, len(secondRead.Results))
	}
	historyCtx, historyCancel := context.WithTimeout(ctx, 30*time.Second)
	defer historyCancel()
	historyExecution, err := waitForExecutionHistory(historyCtx, client, workflow.ID, started.ExecutionID)
	if err != nil {
		t.Fatalf("verify persisted execution history: %v", err)
	}
	if historyExecution.Status != execution.Status || historyExecution.ExecutionArgument != argument || len(historyExecution.Results) != len(execution.Results) {
		t.Errorf("execution history disagrees with stream result: stream=%s/%d/%d history=%s/%d/%d", execution.Status, len(execution.Results), len(execution.ExecutionArgument), historyExecution.Status, len(historyExecution.Results), len(historyExecution.ExecutionArgument))
	}

	_, status, err = reader.getExecution(ctx, started.ExecutionID, uuid.NewV4().String())
	if err == nil || status != http.StatusUnauthorized {
		t.Errorf("wrong execution authorization was not rejected: status=%d err=%v", status, err)
	}
}

func TestExecutionWaitAndFinishedRerunLifecycle(t *testing.T) {
	client := newAPIClient()
	requireExecutionCredentials(t, client)
	workflow, managed := executionWorkflow(t, client)
	argument := fmt.Sprintf(`{"marker":%q,"kind":"execution-wait-rerun"}`, uuid.NewV4().String())
	ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_TIMEOUT", defaultExecutionTimeout))
	defer cancel()

	path := "/api/v1/workflows/" + workflow.ID + "/execute?wait=true"
	response, body, err := client.jsonRequest(ctx, http.MethodPost, path, map[string]string{
		"execution_argument": argument,
		"execution_source":   "e2e_test",
	})
	if err != nil {
		t.Fatalf("start synchronous execution: %v", err)
	}
	if err := statusError(http.MethodPost, path, response, body, http.StatusOK); err != nil {
		t.Fatal(err)
	}

	var waited synchronousExecutionResponse
	if err := json.Unmarshal(body, &waited); err != nil {
		t.Fatalf("decode synchronous execution response: %v; body=%q", err, body)
	}
	if !waited.Success {
		t.Fatalf("synchronous execution reported failure: errors=%v result=%q", waited.Errors, truncate(waited.Result, 512))
	}
	if len(waited.Errors) != 0 {
		t.Errorf("synchronous execution returned errors: %v", waited.Errors)
	}
	if _, err := uuid.FromString(waited.ExecutionID); err != nil {
		t.Fatalf("synchronous execution returned invalid ID %q: %v", waited.ExecutionID, err)
	}
	if waited.Authorization == "" {
		t.Fatal("synchronous execution returned empty authorization")
	}
	if managed && !resultContainsArgument(waited.Result, argument) {
		t.Errorf("synchronous result did not contain the complete %d-byte argument: %q", len(argument), truncate(waited.Result, 512))
	}

	started := executionStartResponse{
		Success:       true,
		ExecutionID:   waited.ExecutionID,
		Authorization: waited.Authorization,
	}
	reader := executionTokenClient(client)
	execution, err := pollExecution(ctx, reader, started)
	if err != nil {
		t.Fatalf("read synchronous execution after wait response: %v", err)
	}
	assertExecutionInvariants(t, execution, started, workflow.ID)
	if execution.ExecutionArgument != argument {
		t.Errorf("synchronous execution argument changed: got %d bytes, want %d", len(execution.ExecutionArgument), len(argument))
	}
	if managed {
		assertManagedExecution(t, execution, argument)
	}

	rerunPath := fmt.Sprintf("/api/v1/workflows/%s/executions/%s/rerun", workflow.ID, execution.ExecutionID)
	executionToken := executionTokenClient(client)
	executionToken.apiKey = execution.Authorization
	response, body, err = executionToken.jsonRequest(ctx, http.MethodGet, rerunPath, nil)
	if err != nil {
		t.Fatalf("check finished execution rerun: %v", err)
	}
	if err := statusError(http.MethodGet, rerunPath, response, body, http.StatusOK); err != nil {
		t.Fatal(err)
	}
	var rerun struct {
		Success bool   `json:"success"`
		Reason  string `json:"reason"`
	}
	if err := json.Unmarshal(body, &rerun); err != nil {
		t.Fatalf("decode finished rerun response: %v; body=%q", err, body)
	}
	if !rerun.Success || !strings.Contains(strings.ToLower(rerun.Reason), "already finished") {
		t.Errorf("finished rerun response does not describe idempotent completion: %+v", rerun)
	}

	unchanged, _, err := reader.getExecution(ctx, execution.ExecutionID, execution.Authorization)
	if err != nil {
		t.Fatalf("read execution after finished rerun: %v", err)
	}
	if unchanged.Status != execution.Status ||
		unchanged.Authorization != execution.Authorization ||
		unchanged.ExecutionArgument != execution.ExecutionArgument ||
		len(unchanged.Results) != len(execution.Results) ||
		unchanged.Result != execution.Result {
		t.Error("finished rerun request mutated the completed execution")
	}
	history, err := waitForExecutionHistory(ctx, client, workflow.ID, execution.ExecutionID)
	if err != nil {
		t.Fatalf("verify synchronous execution history: %v", err)
	}
	if history.Status != execution.Status || history.ExecutionArgument != argument || len(history.Results) != len(execution.Results) {
		t.Error("synchronous execution history disagrees with the execution-token result")
	}
}

func TestExecutionAbortLifecycle(t *testing.T) {
	client := newAPIClient()
	requireExecutionCredentials(t, client)
	workflowID := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_ABORT_WORKFLOW_ID"))
	if workflowID == "" {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			workflowID = createManagedFixture(t, client, managedAbortWorkflow()).ID
		} else {
			t.Skip("set SHUFFLE_E2E_ABORT_WORKFLOW_ID to a deterministic slow workflow")
		}
	}
	if _, err := uuid.FromString(workflowID); err != nil {
		t.Fatalf("SHUFFLE_E2E_ABORT_WORKFLOW_ID is not a UUID: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_TIMEOUT", defaultExecutionTimeout))
	defer cancel()
	started, err := client.startExecution(ctx, workflowID, `{"kind":"abort-e2e"}`)
	if err != nil {
		t.Fatalf("start abort execution: %v", err)
	}
	path := fmt.Sprintf("/api/v1/workflows/%s/executions/%s/abort", workflowID, started.ExecutionID)
	wrongToken := executionTokenClient(client)
	wrongToken.apiKey = uuid.NewV4().String()
	response, body, err := wrongToken.jsonRequest(ctx, http.MethodGet, path, nil)
	if err != nil {
		t.Fatalf("attempt abort with wrong execution token: %v", err)
	}
	if err := statusError(http.MethodGet, path, response, body, http.StatusUnauthorized); err != nil {
		t.Fatalf("wrong execution token was not rejected: %v", err)
	}

	executionToken := executionTokenClient(client)
	executionToken.apiKey = started.Authorization
	response, body, err = executionToken.jsonRequest(ctx, http.MethodGet, path, nil)
	if err != nil {
		t.Fatalf("abort execution: %v", err)
	}
	if err := statusError(http.MethodGet, path, response, body, http.StatusOK); err != nil {
		t.Fatal(err)
	}

	execution, err := pollExecution(ctx, executionTokenClient(client), started)
	if err != nil {
		t.Fatalf("wait for aborted execution: %v", err)
	}
	assertExecutionInvariants(t, execution, started, workflowID)
	if strings.ToUpper(execution.Status) != "ABORTED" {
		t.Fatalf("abort raced or failed: got terminal status %q, want ABORTED", execution.Status)
	}
	response, body, err = executionToken.jsonRequest(ctx, http.MethodGet, path, nil)
	if err != nil {
		t.Fatalf("repeat abort request: %v", err)
	}
	if err := statusError(http.MethodGet, path, response, body, http.StatusUnauthorized); err != nil {
		t.Fatalf("second abort of terminal execution was not rejected: %v", err)
	}
}

func TestExecutionResultEndpointRejectsMalformedRequests(t *testing.T) {
	client := newAPIClient()
	client.apiKey = ""
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cases := []struct {
		name    string
		payload any
	}{
		{name: "missing execution and authorization", payload: map[string]string{}},
		{name: "unknown execution", payload: map[string]string{"execution_id": uuid.NewV4().String(), "authorization": uuid.NewV4().String()}},
	}
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			response, body, err := client.jsonRequest(ctx, http.MethodPost, "/api/v1/streams/results", testCase.payload)
			if err != nil {
				t.Fatalf("send malformed result request: %v", err)
			}
			if err := statusError(http.MethodPost, "/api/v1/streams/results", response, body, http.StatusBadRequest); err != nil {
				t.Fatal(err)
			}
			if !json.Valid(body) {
				t.Errorf("malformed-request response is not JSON: %q", body)
			}
		})
	}
}

func decodeSubflowResults(result string) []subflowResultWire {
	value := strings.TrimSpace(result)
	for depth := 0; depth < 2; depth++ {
		var quoted string
		if err := json.Unmarshal([]byte(value), &quoted); err != nil {
			break
		}
		value = strings.TrimSpace(quoted)
	}
	var list []subflowResultWire
	if json.Unmarshal([]byte(value), &list) == nil && len(list) > 0 {
		for _, item := range list {
			if strings.TrimSpace(item.ExecutionID) == "" {
				return nil
			}
		}
		return list
	}
	var single subflowResultWire
	if json.Unmarshal([]byte(value), &single) == nil && single.ExecutionID != "" {
		return []subflowResultWire{single}
	}
	return nil
}

func findSubflowChildren(execution executionResponse) []struct {
	Source workflowActionWire
	Data   subflowResultWire
} {
	children := []struct {
		Source workflowActionWire
		Data   subflowResultWire
	}{}
	for _, result := range execution.Results {
		isSubflow := strings.Contains(strings.ToLower(result.Action.AppName), "subflow") || strings.EqualFold(result.Action.AppName, "Shuffle Workflow")
		data := decodeSubflowResults(result.Result)
		if !isSubflow && len(data) == 0 {
			continue
		}
		for _, child := range data {
			if child.ExecutionID != "" {
				children = append(children, struct {
					Source workflowActionWire
					Data   subflowResultWire
				}{Source: result.Action, Data: child})
			}
		}
	}
	return children
}

func TestSubflowExecutionLifecycle(t *testing.T) {
	client := newAPIClient()
	requireExecutionCredentials(t, client)
	workflowID := strings.TrimSpace(os.Getenv("SHUFFLE_E2E_SUBFLOW_WORKFLOW_ID"))
	if workflowID == "" {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			child := createManagedFixture(t, client, managedExecutionWorkflow())
			workflowID = createManagedFixture(t, client, managedSubflowParent(child)).ID
		} else {
			t.Skip("set SHUFFLE_E2E_SUBFLOW_WORKFLOW_ID to a parent workflow containing real subflow nodes")
		}
	}
	if _, err := uuid.FromString(workflowID); err != nil {
		t.Fatalf("SHUFFLE_E2E_SUBFLOW_WORKFLOW_ID is not a UUID: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_SUBFLOW_TIMEOUT", 3*time.Minute))
	defer cancel()
	started, err := client.startExecution(ctx, workflowID, fmt.Sprintf(`{"marker":%q,"kind":"subflow-e2e"}`, uuid.NewV4().String()))
	if err != nil {
		t.Fatalf("start parent execution: %v", err)
	}
	reader := executionTokenClient(client)
	parent, err := pollExecution(ctx, reader, started)
	t.Cleanup(func() {
		recordFailureArtifact(t, executionArtifact{
			Test:          t.Name(),
			Recipe:        "managed-parent-child-subflow",
			WorkflowID:    workflowID,
			ExecutionID:   started.ExecutionID,
			LastExecution: &parent,
		})
	})
	if err != nil {
		t.Fatalf("wait for parent execution: %v", err)
	}
	assertExecutionInvariants(t, parent, started, workflowID)
	if !expectedStatuses(os.Getenv("SHUFFLE_E2E_EXPECT_STATUS"))[strings.ToUpper(parent.Status)] {
		t.Errorf("parent subflow execution ended in unexpected status %q", parent.Status)
	}

	children := findSubflowChildren(parent)
	if len(children) == 0 {
		t.Fatalf("parent execution finished without a decodable subflow result; results=%d", len(parent.Results))
	}
	for _, childRef := range children {
		childStarted := executionStartResponse{Success: true, ExecutionID: childRef.Data.ExecutionID, Authorization: childRef.Data.Authorization}
		if childStarted.Authorization == "" {
			t.Errorf("subflow %s did not return execution authorization", childStarted.ExecutionID)
			continue
		}
		child, err := pollExecution(ctx, reader, childStarted)
		if err != nil {
			t.Errorf("wait for child execution %s: %v", childStarted.ExecutionID, err)
			continue
		}
		assertExecutionInvariants(t, child, childStarted, child.WorkflowID)
		if !expectedStatuses(os.Getenv("SHUFFLE_E2E_EXPECT_STATUS"))[strings.ToUpper(child.Status)] {
			t.Errorf("child subflow execution %s ended in unexpected status %q", child.ExecutionID, child.Status)
		}
		if child.ExecutionParent != parent.ExecutionID {
			t.Errorf("child %s parent: got %q, want %q", child.ExecutionID, child.ExecutionParent, parent.ExecutionID)
		}
		if child.ExecutionSource != parent.WorkflowID {
			t.Errorf("child %s source workflow: got %q, want %q", child.ExecutionID, child.ExecutionSource, parent.WorkflowID)
		}
		if child.ExecutionSourceNode != childRef.Source.ID {
			t.Errorf("child %s source node: got %q, want %q", child.ExecutionID, child.ExecutionSourceNode, childRef.Source.ID)
		}
		if child.ExecutionSourceAuth != parent.Authorization {
			t.Errorf("child %s source authorization does not match its parent", child.ExecutionID)
		}
		if child.SubExecutionCount != parent.SubExecutionCount+1 {
			t.Errorf("child %s depth: got %d, want %d", child.ExecutionID, child.SubExecutionCount, parent.SubExecutionCount+1)
		}
		if !childRef.Data.Success {
			t.Errorf("parent subflow result for child %s reports success=false: %q", child.ExecutionID, childRef.Data.Result)
		}
		if !childRef.Data.ResultSet && strings.TrimSpace(childRef.Data.Result) == "" {
			t.Errorf("parent subflow result for child %s has neither result_set nor a result", child.ExecutionID)
		}
	}
}

type mutationCase struct {
	Recipe   string
	Argument string
}

func buildMutationArgument(marker string, testCase mutationCase) string {
	if !strings.HasPrefix(testCase.Recipe, "large-") {
		return marker + testCase.Argument
	}
	target, err := strconv.Atoi(strings.TrimPrefix(testCase.Recipe, "large-"))
	if err != nil || target <= 0 {
		return marker + testCase.Argument
	}
	if len(marker)*2 >= target {
		return (marker + marker)[:target]
	}
	filler := "x"
	if len(testCase.Argument) > 0 {
		filler = testCase.Argument[:1]
	}
	return marker + strings.Repeat(filler, target-len(marker)*2) + marker
}

func mutationCases(seed int64, amount int) []mutationCase {
	fixed := []mutationCase{
		{Recipe: "empty-object", Argument: `{}`},
		{Recipe: "unicode-and-control", Argument: `{"text":"こんにちは 🌍","escaped":"line1\\nline2\\t\\u0000"}`},
		{Recipe: "nested", Argument: `{"a":[{"b":[1,true,null,{"c":"value"}]}]}`},
		{Recipe: "large-32499", Argument: strings.Repeat("a", 32499)},
		{Recipe: "large-32500", Argument: strings.Repeat("b", 32500)},
		{Recipe: "large-32501", Argument: strings.Repeat("c", 32501)},
		{Recipe: "large-1048575", Argument: strings.Repeat("d", 1048575)},
		{Recipe: "large-1048576", Argument: strings.Repeat("e", 1048576)},
		{Recipe: "large-1048577", Argument: strings.Repeat("f", 1048577)},
	}
	if amount <= len(fixed) {
		return fixed[:amount]
	}

	cases := append([]mutationCase{}, fixed...)
	random := rand.New(rand.NewSource(seed))
	for len(cases) < amount {
		length := 1 + random.Intn(8192)
		alphabet := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ /\\\"{}[]:,.🌍")
		value := make([]rune, length)
		for index := range value {
			value[index] = alphabet[random.Intn(len(alphabet))]
		}
		cases = append(cases, mutationCase{
			Recipe:   fmt.Sprintf("seed-%d-random-runes-%d", seed, length),
			Argument: string(value),
		})
	}
	return cases
}

func TestExecutionMutationCampaign(t *testing.T) {
	amount := e2eInt("SHUFFLE_E2E_MUTATION_CASES", 0)
	if amount <= 0 {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			t.Fatal("SHUFFLE_E2E_STRICT requires SHUFFLE_E2E_MUTATION_CASES>=9")
		}
		t.Skip("set SHUFFLE_E2E_MUTATION_CASES to run the bounded execution mutation campaign")
	}
	if e2eBool("SHUFFLE_E2E_STRICT") && amount < 9 {
		t.Fatalf("SHUFFLE_E2E_STRICT requires at least 9 mutation cases, got %d", amount)
	}
	if amount > 100 {
		t.Fatalf("SHUFFLE_E2E_MUTATION_CASES=%d exceeds the safety limit of 100", amount)
	}
	seed := int64(e2eInt("SHUFFLE_E2E_MUTATION_SEED", 1337))
	client := newAPIClient()
	requireExecutionCredentials(t, client)
	workflow, managed := executionWorkflow(t, client)

	for index, testCase := range mutationCases(seed, amount) {
		testCase := testCase
		t.Run(fmt.Sprintf("%03d_%s", index, testCase.Recipe), func(t *testing.T) {
			marker := fmt.Sprintf("shuffle-e2e-seed-%d-case-%d-", seed, index)
			argument := buildMutationArgument(marker, testCase)
			var started executionStartResponse
			var last *executionResponse
			t.Cleanup(func() {
				recordFailureArtifact(t, executionArtifact{
					Test:            t.Name(),
					Seed:            seed,
					Recipe:          testCase.Recipe,
					WorkflowID:      workflow.ID,
					ExecutionID:     started.ExecutionID,
					ArgumentBytes:   len(argument),
					ArgumentPreview: truncate(argument, 512),
					LastExecution:   last,
				})
			})

			ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_TIMEOUT", defaultExecutionTimeout))
			defer cancel()
			var err error
			started, err = client.startExecution(ctx, workflow.ID, argument)
			if err != nil {
				t.Fatalf("start mutation execution: %v", err)
			}
			execution, err := pollExecution(ctx, executionTokenClient(client), started)
			last = &execution
			if err != nil {
				t.Fatalf("wait for mutation execution: %v", err)
			}
			assertExecutionInvariants(t, execution, started, workflow.ID)
			if !expectedStatuses(os.Getenv("SHUFFLE_E2E_EXPECT_STATUS"))[strings.ToUpper(execution.Status)] {
				t.Errorf("mutation ended in unexpected status %q", execution.Status)
			}
			if execution.ExecutionArgument != argument {
				t.Errorf("mutation argument changed: got %d bytes, want %d", len(execution.ExecutionArgument), len(argument))
			}
			if managed {
				assertManagedExecution(t, execution, argument)
			}
		})
	}
}

func TestConcurrentExecutionIsolation(t *testing.T) {
	amount := e2eInt("SHUFFLE_E2E_CONCURRENCY", 0)
	if amount <= 0 {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			t.Fatal("SHUFFLE_E2E_STRICT requires SHUFFLE_E2E_CONCURRENCY>=2")
		}
		t.Skip("set SHUFFLE_E2E_CONCURRENCY to run concurrent execution isolation")
	}
	if amount < 2 || amount > 32 {
		t.Fatalf("SHUFFLE_E2E_CONCURRENCY must be between 2 and 32, got %d", amount)
	}

	client := newAPIClient()
	requireExecutionCredentials(t, client)
	workflow, managed := executionWorkflow(t, client)
	ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_TIMEOUT", defaultExecutionTimeout))
	defer cancel()

	type concurrentOutcome struct {
		argument  string
		started   executionStartResponse
		execution executionResponse
		err       error
	}
	outcomes := make([]concurrentOutcome, amount)
	var wait sync.WaitGroup
	for index := range outcomes {
		index := index
		outcomes[index].argument = fmt.Sprintf(`{"case":%d,"marker":%q}`, index, "concurrent-"+uuid.NewV4().String())
		wait.Add(1)
		go func() {
			defer wait.Done()
			outcomes[index].started, outcomes[index].err = client.startExecution(ctx, workflow.ID, outcomes[index].argument)
		}()
	}
	wait.Wait()
	for index := range outcomes {
		if outcomes[index].err != nil {
			t.Fatalf("start concurrent execution %d: %v", index, outcomes[index].err)
		}
	}

	reader := executionTokenClient(client)
	for index := range outcomes {
		index := index
		wait.Add(1)
		go func() {
			defer wait.Done()
			outcomes[index].execution, outcomes[index].err = pollExecution(ctx, reader, outcomes[index].started)
		}()
	}
	wait.Wait()

	ids := map[string]bool{}
	authorizations := map[string]bool{}
	for index, outcome := range outcomes {
		if outcome.err != nil {
			t.Errorf("poll concurrent execution %d: %v", index, outcome.err)
			continue
		}
		if ids[outcome.started.ExecutionID] {
			t.Errorf("duplicate concurrent execution ID %s", outcome.started.ExecutionID)
		}
		ids[outcome.started.ExecutionID] = true
		if authorizations[outcome.started.Authorization] {
			t.Errorf("duplicate concurrent execution authorization for %s", outcome.started.ExecutionID)
		}
		authorizations[outcome.started.Authorization] = true
		assertExecutionInvariants(t, outcome.execution, outcome.started, workflow.ID)
		if outcome.execution.ExecutionArgument != outcome.argument {
			t.Errorf("concurrent execution %d received another payload", index)
		}
		if !expectedStatuses(os.Getenv("SHUFFLE_E2E_EXPECT_STATUS"))[strings.ToUpper(outcome.execution.Status)] {
			t.Errorf("concurrent execution %d ended in status %q", index, outcome.execution.Status)
		}
		if managed {
			assertManagedExecution(t, outcome.execution, outcome.argument)
		}
	}
	if t.Failed() {
		return
	}

	for index := range outcomes {
		next := (index + 1) % len(outcomes)
		_, status, err := reader.getExecution(ctx, outcomes[index].started.ExecutionID, outcomes[next].started.Authorization)
		if err == nil || status != http.StatusUnauthorized {
			t.Errorf("execution %d accepted execution %d's authorization: status=%d err=%v", index, next, status, err)
		}
	}

	historyCtx, historyCancel := context.WithTimeout(ctx, 30*time.Second)
	defer historyCancel()
	for index := range outcomes {
		history, err := waitForExecutionHistory(historyCtx, client, workflow.ID, outcomes[index].started.ExecutionID)
		if err != nil {
			t.Errorf("concurrent execution %d missing from history: %v", index, err)
			continue
		}
		if history.ExecutionArgument != outcomes[index].argument || history.Status != outcomes[index].execution.Status {
			t.Errorf("concurrent execution %d history was contaminated", index)
		}
	}
}

func TestBackendGeneratedExecutionIDIsolation(t *testing.T) {
	client := newAPIClient()
	requireExecutionCredentials(t, client)
	workflow, managed := executionWorkflow(t, client)
	ctx, cancel := context.WithTimeout(context.Background(), e2eDuration("SHUFFLE_E2E_TIMEOUT", defaultExecutionTimeout))
	defer cancel()
	reader := executionTokenClient(client)

	firstArgument := fmt.Sprintf(`{"attempt":1,"marker":%q}`, "generated-first-"+uuid.NewV4().String())
	first, err := client.startExecution(ctx, workflow.ID, firstArgument)
	if err != nil {
		t.Fatalf("start first backend-ID execution: %v", err)
	}
	firstExecution, err := pollExecution(ctx, reader, first)
	if err != nil {
		t.Fatalf("wait for first backend-ID execution: %v", err)
	}
	assertExecutionInvariants(t, firstExecution, first, workflow.ID)
	if firstExecution.ExecutionArgument != firstArgument {
		t.Fatal("first backend-ID execution received the wrong argument")
	}
	if managed {
		assertManagedExecution(t, firstExecution, firstArgument)
	}

	secondArgument := fmt.Sprintf(`{"attempt":2,"marker":%q}`, "generated-second-"+uuid.NewV4().String())
	second, err := client.startExecution(ctx, workflow.ID, secondArgument)
	if err != nil {
		t.Fatalf("start second backend-ID execution: %v", err)
	}
	if second.ExecutionID == first.ExecutionID {
		t.Fatalf("backend reused execution ID %s for two normal execution requests", first.ExecutionID)
	}
	if second.Authorization == first.Authorization {
		t.Fatalf("backend reused authorization for executions %s and %s", first.ExecutionID, second.ExecutionID)
	}

	secondExecution, err := pollExecution(ctx, reader, second)
	if err != nil {
		t.Fatalf("wait for second backend-ID execution: %v", err)
	}
	assertExecutionInvariants(t, secondExecution, second, workflow.ID)
	if secondExecution.ExecutionArgument != secondArgument {
		t.Fatal("second backend-ID execution received the wrong argument")
	}
	if managed {
		assertManagedExecution(t, secondExecution, secondArgument)
	}
	unchanged, _, err := reader.getExecution(ctx, first.ExecutionID, first.Authorization)
	if err != nil || unchanged.ExecutionArgument != firstArgument || unchanged.Authorization != first.Authorization {
		t.Fatalf("second execution altered the first execution: err=%v", err)
	}
	if _, status, err := reader.getExecution(ctx, first.ExecutionID, second.Authorization); err == nil || status != http.StatusUnauthorized {
		t.Errorf("second execution authorization accessed first execution: status=%d err=%v", status, err)
	}
	if _, status, err := reader.getExecution(ctx, second.ExecutionID, first.Authorization); err == nil || status != http.StatusUnauthorized {
		t.Errorf("first execution authorization accessed second execution: status=%d err=%v", status, err)
	}
}

func TestHealthWorkflowExecution(t *testing.T) {
	if !e2eBool("SHUFFLE_E2E_HEALTH_WORKFLOW") {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			t.Fatal("SHUFFLE_E2E_STRICT requires SHUFFLE_E2E_HEALTH_WORKFLOW=true")
		}
		t.Skip("set SHUFFLE_E2E_HEALTH_WORKFLOW=true to run Shuffle's health workflow")
	}
	client := newAPIClient()
	requireExecutionCredentials(t, client)

	fixtureCtx, fixtureCancel := context.WithTimeout(context.Background(), 90*time.Second)
	template, err := fetchHealthWorkflowTemplate(fixtureCtx)
	if err != nil {
		fixtureCancel()
		t.Fatalf("load health workflow template: %v", err)
	}
	seed := managedExecutionWorkflow()
	seed.Name = "E2E health workflow seed " + uuid.NewV4().String()
	created, err := client.createWorkflow(fixtureCtx, seed)
	if err != nil {
		fixtureCancel()
		t.Fatalf("create health workflow fixture: %v", err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cleanupCancel()
		if err := client.deleteWorkflow(cleanupCtx, created.ID); err != nil {
			t.Errorf("delete health workflow %s: %v", created.ID, err)
		}
	})
	if err := prepareHealthWorkflowTemplate(template, created, client); err != nil {
		fixtureCancel()
		t.Fatalf("prepare health workflow template: %v", err)
	}
	workflow, err := client.replaceWorkflow(fixtureCtx, created.ID, template)
	fixtureCancel()
	if err != nil {
		t.Fatalf("save health workflow fixture: %v", err)
	}

	healthTimeout := e2eDuration("SHUFFLE_E2E_HEALTH_TIMEOUT", 12*time.Minute)
	ctx, cancel := context.WithTimeout(context.Background(), healthTimeout)
	defer cancel()
	argument := fmt.Sprintf(`{"kind":"health-workflow-e2e","marker":%q}`, uuid.NewV4().String())
	started, err := client.startExecution(ctx, workflow.ID, argument)
	if err != nil {
		t.Fatalf("start health workflow: %v", err)
	}
	reader := executionTokenClient(client)
	execution, err := pollExecution(ctx, reader, started)
	if err != nil {
		t.Fatalf("wait for health workflow: %v", err)
	}
	assertExecutionInvariants(t, execution, started, workflow.ID)
	if !expectedStatuses(os.Getenv("SHUFFLE_E2E_EXPECT_STATUS"))[strings.ToUpper(execution.Status)] {
		t.Errorf("health workflow ended in unexpected status %q", execution.Status)
	}
	if len(execution.Results) < 5 {
		t.Errorf("health workflow returned only %d action results for %d actions", len(execution.Results), len(workflow.Actions))
	}

	children := findSubflowChildren(execution)
	if len(children) == 0 {
		t.Error("health workflow did not create its expected subflow execution")
		return
	}
	childStarted := executionStartResponse{
		Success:       true,
		ExecutionID:   children[0].Data.ExecutionID,
		Authorization: children[0].Data.Authorization,
	}
	child, err := pollExecution(ctx, reader, childStarted)
	if err != nil {
		t.Fatalf("wait for health workflow subflow %s: %v", childStarted.ExecutionID, err)
	}
	assertExecutionInvariants(t, child, childStarted, workflow.ID)
	if child.ExecutionParent != execution.ExecutionID {
		t.Errorf("health subflow parent: got %q, want %q", child.ExecutionParent, execution.ExecutionID)
	}
	if !expectedStatuses(os.Getenv("SHUFFLE_E2E_EXPECT_STATUS"))[strings.ToUpper(child.Status)] {
		t.Errorf("health workflow subflow ended in unexpected status %q", child.Status)
	}
}
