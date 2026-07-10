//go:build e2e

package testsuite

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

const defaultBaseURL = "http://localhost:5001"

type apiClient struct {
	baseURL string
	apiKey  string
	http    *http.Client
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

	return request
}

func (client *apiClient) do(t *testing.T, request *http.Request) (*http.Response, []byte) {
	t.Helper()

	response, err := client.http.Do(request)
	if err != nil {
		t.Fatalf(
			"call %s %s: %v\nIs the backend running and is SHUFFLE_TEST_BASE_URL correct?",
			request.Method,
			request.URL,
			err,
		)
	}
	t.Cleanup(func() { response.Body.Close() })

	body, err := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if err != nil {
		t.Fatalf("read %s %s response: %v", request.Method, request.URL, err)
	}

	return response, body
}

func requireStatus(t *testing.T, response *http.Response, body []byte, want int) {
	t.Helper()

	if response.StatusCode != want {
		t.Fatalf("unexpected status: got %d, want %d; body=%q", response.StatusCode, want, body)
	}
}

func TestBackendHealth(t *testing.T) {
	client := newAPIClient()
	request := client.request(t, http.MethodGet, "/api/v1/_ah/health", nil)
	response, body := client.do(t, request)

	requireStatus(t, response, body, http.StatusOK)
}

func TestWorkflowsRejectAnonymousRequests(t *testing.T) {
	client := newAPIClient()
	client.apiKey = ""

	request := client.request(t, http.MethodGet, "/api/v1/workflows", nil)
	response, body := client.do(t, request)

	requireStatus(t, response, body, http.StatusUnauthorized)

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
	if got := response.Header.Get("Access-Control-Allow-Methods"); !strings.Contains(got, http.MethodGet) {
		t.Errorf("Access-Control-Allow-Methods does not include GET: %q", got)
	}
}

func TestAuthenticatedWorkflowList(t *testing.T) {
	client := newAPIClient()
	if client.apiKey == "" {
		t.Skip("set SHUFFLE_TEST_API_KEY to run authenticated integration tests")
	}

	request := client.request(t, http.MethodGet, "/api/v1/workflows?top=2", nil)
	response, body := client.do(t, request)
	requireStatus(t, response, body, http.StatusOK)

	var workflows []json.RawMessage
	if err := json.Unmarshal(body, &workflows); err != nil {
		t.Fatalf("workflow list was not a JSON array: %v; body=%q", err, body)
	}

	for index, workflow := range workflows {
		if !json.Valid(workflow) {
			t.Errorf("workflow %d is invalid JSON: %q", index, workflow)
		}
	}
}
