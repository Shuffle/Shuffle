//go:build e2e

package testsuite

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	uuid "github.com/satori/go.uuid"
)

const defaultBaseURL = "http://localhost:5001"
const maxE2EResponseBytes = 8 << 20

type apiClient struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

type healthErrorWire struct {
	Create             string `json:"create"`
	Run                string `json:"run"`
	Delete             string `json:"delete"`
	Read               string `json:"read"`
	Validate           string `json:"validate"`
	Upload             string `json:"upload"`
	RunFinished        string `json:"run_finished"`
	WorkflowValidation string `json:"workflow_validation"`
}

type healthResponseWire struct {
	Success bool  `json:"success"`
	Updated int64 `json:"updated"`
	Apps    struct {
		Create      bool            `json:"create"`
		Run         bool            `json:"run"`
		Delete      bool            `json:"delete"`
		Validate    bool            `json:"validate"`
		Read        bool            `json:"read"`
		AppID       string          `json:"app_id"`
		ExecutionID string          `json:"execution_id"`
		Error       healthErrorWire `json:"error"`
	} `json:"apps"`
	Workflows struct {
		Create             bool            `json:"create"`
		Run                bool            `json:"run"`
		RunFinished        bool            `json:"run_finished"`
		Delete             bool            `json:"delete"`
		WorkflowValidation bool            `json:"workflow_validation"`
		RunStatus          string          `json:"run_status"`
		ExecutionTook      float64         `json:"execution_took"`
		ExecutionID        string          `json:"execution_id"`
		WorkflowID         string          `json:"workflow_id"`
		BackendVersion     string          `json:"backend_version"`
		Error              healthErrorWire `json:"error"`
	} `json:"workflows"`
	Datastore struct {
		Create bool            `json:"create"`
		Read   bool            `json:"read"`
		Delete bool            `json:"delete"`
		Error  healthErrorWire `json:"error"`
	} `json:"datastore"`
	FileOps struct {
		Create bool            `json:"create"`
		Upload bool            `json:"get_file"`
		Delete bool            `json:"delete"`
		FileID string          `json:"fileId"`
		Error  healthErrorWire `json:"error"`
	} `json:"fileops"`
	OpenSearch struct {
		Status              string  `json:"status"`
		TimedOut            bool    `json:"timed_out"`
		Nodes               int     `json:"number_of_nodes"`
		DataNodes           int     `json:"number_of_data_nodes"`
		ActivePrimaryShards int     `json:"active_primary_shards"`
		UnassignedShards    int     `json:"unassigned_shards"`
		PendingTasks        int     `json:"number_of_pending_tasks"`
		ActiveShardsPercent float64 `json:"active_shards_percent_as_number"`
	} `json:"opensearch"`
}

func newAPIClient() *apiClient {
	baseURL := strings.TrimRight(os.Getenv("SHUFFLE_TEST_BASE_URL"), "/")
	if baseURL == "" {
		baseURL = defaultBaseURL
	}

	return &apiClient{
		baseURL: baseURL,
		apiKey:  os.Getenv("SHUFFLE_TEST_API_KEY"),
		http: &http.Client{
			Timeout: 10 * time.Second,
			CheckRedirect: func(request *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}
}

func (client *apiClient) request(t *testing.T, method, path string, body io.Reader) *http.Request {
	t.Helper()

	request, err := http.NewRequest(method, client.baseURL+path, body)
	if err != nil {
		t.Fatalf("create %s %s request: %v", method, path, err)
	}

	if client.apiKey != "" {
		request.Header.Set("Authorization", "Bearer "+client.apiKey)
	}
	if orgID := strings.TrimSpace(os.Getenv("SHUFFLE_TEST_ORG_ID")); orgID != "" {
		request.Header.Set("Org-Id", orgID)
	}

	return request
}

func (client *apiClient) requestContext(ctx context.Context, method, path string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, client.baseURL+path, body)
	if err != nil {
		return nil, err
	}

	if client.apiKey != "" {
		request.Header.Set("Authorization", "Bearer "+client.apiKey)
	}
	if orgID := strings.TrimSpace(os.Getenv("SHUFFLE_TEST_ORG_ID")); orgID != "" {
		request.Header.Set("Org-Id", orgID)
	}

	return request, nil
}

func (client *apiClient) doRequest(request *http.Request) (*http.Response, []byte, error) {
	response, err := client.http.Do(request)
	if err != nil {
		return nil, nil, err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(io.LimitReader(response.Body, maxE2EResponseBytes+1))
	if err != nil {
		return response, nil, err
	}
	if len(body) > maxE2EResponseBytes {
		return response, nil, fmt.Errorf("response exceeded the %d-byte E2E safety limit", maxE2EResponseBytes)
	}

	return response, body, nil
}

func (client *apiClient) do(t *testing.T, request *http.Request) (*http.Response, []byte) {
	t.Helper()

	response, body, err := client.doRequest(request)
	if err != nil {
		t.Fatalf(
			"call %s %s: %v\nIs the backend running and is SHUFFLE_TEST_BASE_URL correct?",
			request.Method,
			request.URL,
			err,
		)
	}
	return response, body
}

func statusError(method, path string, response *http.Response, body []byte, want ...int) error {
	for _, status := range want {
		if response.StatusCode == status {
			return nil
		}
	}

	return fmt.Errorf("%s %s returned %d, expected %v; body=%q", method, path, response.StatusCode, want, body)
}

func requireStatus(t *testing.T, response *http.Response, body []byte, want int) {
	t.Helper()

	if response.StatusCode != want {
		t.Fatalf("unexpected status: got %d, want %d; body=%q", response.StatusCode, want, body)
	}
}

func requireJSONResponse(t *testing.T, response *http.Response, body []byte) {
	t.Helper()
	contentType := strings.ToLower(response.Header.Get("Content-Type"))
	if !strings.Contains(contentType, "application/json") {
		t.Errorf("response Content-Type is %q, want application/json; body=%q", contentType, truncate(string(body), 512))
	}
	if !json.Valid(body) {
		t.Fatalf("response body is not valid JSON: %q", truncate(string(body), 512))
	}
}

func TestBackendHealth(t *testing.T) {
	client := newAPIClient()
	request := client.request(t, http.MethodGet, "/api/v1/health", nil)
	response, body := client.do(t, request)

	requireStatus(t, response, body, http.StatusOK)
	requireJSONResponse(t, response, body)

	var health healthResponseWire
	if err := json.Unmarshal(body, &health); err != nil {
		t.Fatalf("health response was not JSON: %v; body=%q", err, body)
	}
	assertHealthResponse(t, health)
}

func assertHealthResponse(t *testing.T, health healthResponseWire) {
	t.Helper()
	if !health.Success {
		t.Error("health response success=false")
	}
	now := time.Now().Unix()
	if health.Updated <= 0 || health.Updated > now+30 {
		t.Errorf("health response has invalid updated timestamp %d", health.Updated)
	}
	if health.Updated > 0 && now-health.Updated > int64(e2eDuration("SHUFFLE_E2E_MAX_HEALTH_AGE", 20*time.Minute).Seconds()) {
		t.Errorf("health response is stale: updated %s", time.Unix(health.Updated, 0))
	}

	if !health.Workflows.Create || !health.Workflows.Run || !health.Workflows.RunFinished || !health.Workflows.Delete || !health.Workflows.WorkflowValidation {
		t.Errorf("workflow health incomplete: create=%t run=%t finished=%t delete=%t validation=%t errors=%+v", health.Workflows.Create, health.Workflows.Run, health.Workflows.RunFinished, health.Workflows.Delete, health.Workflows.WorkflowValidation, health.Workflows.Error)
	}
	if strings.ToUpper(health.Workflows.RunStatus) != "FINISHED" {
		t.Errorf("workflow health run status=%q, want FINISHED", health.Workflows.RunStatus)
	}
	if health.Workflows.ExecutionTook <= 0 {
		t.Errorf("workflow health execution_took=%v, want > 0", health.Workflows.ExecutionTook)
	}
	for label, id := range map[string]string{"health workflow": health.Workflows.WorkflowID, "health execution": health.Workflows.ExecutionID} {
		if _, err := uuid.FromString(id); err != nil {
			t.Errorf("%s has invalid UUID %q: %v", label, id, err)
		}
	}

	if !health.Datastore.Create || !health.Datastore.Read || !health.Datastore.Delete {
		t.Errorf("datastore health incomplete: create=%t read=%t delete=%t errors=%+v", health.Datastore.Create, health.Datastore.Read, health.Datastore.Delete, health.Datastore.Error)
	}
	if !health.FileOps.Create || !health.FileOps.Upload || !health.FileOps.Delete || health.FileOps.FileID == "" {
		t.Errorf("file health incomplete: create=%t upload=%t delete=%t file_id=%q errors=%+v", health.FileOps.Create, health.FileOps.Upload, health.FileOps.Delete, health.FileOps.FileID, health.FileOps.Error)
	}
	if !health.Apps.Create || !health.Apps.Run || !health.Apps.Delete || !health.Apps.Validate || !health.Apps.Read {
		t.Errorf("app health incomplete: create=%t run=%t delete=%t validate=%t read=%t errors=%+v", health.Apps.Create, health.Apps.Run, health.Apps.Delete, health.Apps.Validate, health.Apps.Read, health.Apps.Error)
	}

	wantOpenSearch := strings.ToLower(strings.TrimSpace(os.Getenv("SHUFFLE_E2E_OPENSEARCH_HEALTH")))
	if wantOpenSearch == "" {
		wantOpenSearch = "green"
	}
	if strings.ToLower(health.OpenSearch.Status) != wantOpenSearch {
		t.Errorf("OpenSearch status=%q, want %q", health.OpenSearch.Status, wantOpenSearch)
	}
	if health.OpenSearch.TimedOut || health.OpenSearch.Nodes <= 0 || health.OpenSearch.DataNodes <= 0 || health.OpenSearch.ActivePrimaryShards <= 0 {
		t.Errorf("OpenSearch health invalid: %+v", health.OpenSearch)
	}
	if health.OpenSearch.UnassignedShards != 0 {
		t.Errorf("OpenSearch has %d unassigned shards", health.OpenSearch.UnassignedShards)
	}
	if health.OpenSearch.PendingTasks != 0 {
		t.Errorf("OpenSearch has %d pending tasks", health.OpenSearch.PendingTasks)
	}
}

func TestWorkflowsRejectAnonymousRequests(t *testing.T) {
	client := newAPIClient()
	client.apiKey = ""

	request := client.request(t, http.MethodGet, "/api/v1/workflows", nil)
	response, body := client.do(t, request)

	requireStatus(t, response, body, http.StatusUnauthorized)
	requireJSONResponse(t, response, body)

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("authentication failure was not JSON: %v; body=%q", err, body)
	}
	if result.Success {
		t.Fatal("anonymous workflow request unexpectedly reported success")
	}
}

func TestWorkflowsRejectInvalidAPIKey(t *testing.T) {
	client := newAPIClient()
	client.apiKey = uuid.NewV4().String()

	request := client.request(t, http.MethodGet, "/api/v1/workflows", nil)
	response, body := client.do(t, request)
	requireStatus(t, response, body, http.StatusUnauthorized)
	requireJSONResponse(t, response, body)

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("invalid-key failure was not JSON: %v; body=%q", err, body)
	}
	if result.Success {
		t.Fatal("invalid API key unexpectedly reported success")
	}
}

func TestWorkflowCORSPreflight(t *testing.T) {
	client := newAPIClient()
	request := client.request(t, http.MethodOptions, "/api/v1/workflows", nil)
	request.Header.Set("Origin", "http://localhost:3000")
	request.Header.Set("Access-Control-Request-Method", http.MethodGet)

	response, body := client.do(t, request)
	requireStatus(t, response, body, http.StatusOK)

	if got := response.Header.Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Errorf("unexpected Access-Control-Allow-Origin: got %q", got)
	}
	if got := response.Header.Get("Access-Control-Allow-Methods"); !headerTokenContains(got, http.MethodGet) {
		t.Errorf("Access-Control-Allow-Methods does not include GET: %q", got)
	}
}

func headerTokenContains(value, want string) bool {
	for _, token := range strings.Split(value, ",") {
		if strings.EqualFold(strings.TrimSpace(token), want) {
			return true
		}
	}
	return false
}

func TestAuthenticatedWorkflowList(t *testing.T) {
	client := newAPIClient()
	if client.apiKey == "" {
		if e2eBool("SHUFFLE_E2E_STRICT") {
			t.Fatal("SHUFFLE_E2E_STRICT requires SHUFFLE_TEST_API_KEY")
		}
		t.Skip("set SHUFFLE_TEST_API_KEY to run authenticated integration tests")
	}

	request := client.request(t, http.MethodGet, "/api/v1/workflows?top=2", nil)
	response, body := client.do(t, request)
	requireStatus(t, response, body, http.StatusOK)
	requireJSONResponse(t, response, body)

	var workflows []json.RawMessage
	if err := json.Unmarshal(body, &workflows); err != nil {
		t.Fatalf("workflow list was not a JSON array: %v; body=%q", err, body)
	}

	for index, workflow := range workflows {
		if !json.Valid(workflow) {
			t.Errorf("workflow %d is invalid JSON: %q", index, workflow)
		}
		var projected struct {
			ID    string `json:"id"`
			OrgID string `json:"org_id"`
			Name  string `json:"name"`
		}
		if err := json.Unmarshal(workflow, &projected); err != nil {
			t.Errorf("decode workflow %d: %v", index, err)
			continue
		}
		if _, err := uuid.FromString(projected.ID); err != nil {
			t.Errorf("workflow %d has invalid ID %q: %v", index, projected.ID, err)
		}
		if projected.Name == "" {
			t.Errorf("workflow %d has an empty name", index)
		}
		if wantOrg := strings.TrimSpace(os.Getenv("SHUFFLE_TEST_ORG_ID")); wantOrg != "" && projected.OrgID != wantOrg {
			t.Errorf("workflow %d belongs to org %q, want %q", index, projected.OrgID, wantOrg)
		}
	}
}
