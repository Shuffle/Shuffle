package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	runtimedebug "runtime/debug"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	shuffle "github.com/shuffle/shuffle-shared"
)

func TestWorkerImageDistributionUsesRunningTasks(t *testing.T) {
	previous := isKubernetes
	isKubernetes = "false"
	t.Cleanup(func() { isKubernetes = previous })
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/info") {
			io.WriteString(w, `{}`)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/tasks") {
			if !strings.Contains(r.URL.Query().Get("filters"), "desired-state") {
				t.Error("worker discovery must filter out retired tasks")
			}
			io.WriteString(w, `[{"ID":"current","Slot":1,"DesiredState":"running","Status":{"State":"running"}},{"ID":"retired","Slot":2,"DesiredState":"shutdown","Status":{"State":"shutdown"}},{"ID":"starting","Slot":3,"DesiredState":"running","Status":{"State":"starting"}}]`)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()
	t.Setenv("DOCKER_HOST", "tcp://"+server.Listener.Addr().String())
	t.Setenv("DOCKER_API_VERSION", "1.45")
	urls, err := getWorkerURLs()
	if err != nil || len(urls) != 1 || urls[0] != "http://shuffle-workers.1.current:33333" {
		t.Fatalf("image peers include a retired or unready task: urls=%v error=%v", urls, err)
	}
}

func TestConcurrentWorkerImageDistribution(t *testing.T) {
	previous, previousTransport := isKubernetes, http.DefaultTransport
	isKubernetes = "false"
	t.Cleanup(func() { isKubernetes, http.DefaultTransport = previous, previousTransport })
	var discoveries, downloads atomic.Int32
	var reject atomic.Bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/info"):
			io.WriteString(w, `{}`)
		case strings.HasSuffix(r.URL.Path, "/tasks"):
			discoveries.Add(1)
			time.Sleep(100 * time.Millisecond)
			io.WriteString(w, `[{"ID":"one","Slot":1,"DesiredState":"running","Status":{"State":"running"}},{"ID":"two","Slot":2,"DesiredState":"running","Status":{"State":"running"}}]`)
		case r.URL.Path == "/api/v1/download":
			downloads.Add(1)
			time.Sleep(50 * time.Millisecond)
			if reject.Load() {
				w.WriteHeader(http.StatusServiceUnavailable)
			}
			io.WriteString(w, `{"success":false,"reason":"image already present"}`)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()
	t.Setenv("DOCKER_HOST", "tcp://"+server.Listener.Addr().String())
	t.Setenv("DOCKER_API_VERSION", "1.45")
	t.Setenv("SHUFFLE_SWARM_CONFIG", "run")
	t.Setenv("SHUFFLE_AUTO_IMAGE_DOWNLOAD", "true")
	transport := previousTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	transport.DialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, network, server.Listener.Addr().String())
	}
	http.DefaultTransport = transport
	defer transport.CloseIdleConnections()
	image := fmt.Sprintf("distribution-fixture-%d", time.Now().UnixNano())
	var callers sync.WaitGroup
	for range 32 {
		callers.Add(1)
		go func() { defer callers.Done(); askOtherWorkersToDownloadImage(image) }()
	}
	callers.Wait()
	if discoveries.Load() != 1 || downloads.Load() != 2 {
		t.Fatalf("concurrent executions repeated peer fan-out: discoveries=%d downloads=%d", discoveries.Load(), downloads.Load())
	}
	reject.Store(true)
	failedImage := image + "-retry"
	askOtherWorkersToDownloadImage(failedImage)
	askOtherWorkersToDownloadImage(failedImage)
	reject.Store(false)
	askOtherWorkersToDownloadImage(failedImage)
	askOtherWorkersToDownloadImage(failedImage)
	if discoveries.Load() != 4 || downloads.Load() != 8 {
		t.Fatalf("failed peer requests must remain retryable: discoveries=%d downloads=%d", discoveries.Load(), downloads.Load())
	}
}

func TestConcurrentAppPortDiscovery(t *testing.T) {
	previous := portMappings
	portMappings = make(map[string]int)
	t.Cleanup(func() { portMappings = previous })
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/info") {
			io.WriteString(w, `{}`)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/services") {
			time.Sleep(250 * time.Millisecond)
			io.WriteString(w, `[{"Spec":{"Name":"burst-app","EndpointSpec":{"Ports":[{"Name":"app-port","Protocol":"tcp","TargetPort":33338,"PublishedPort":33338}]}}}]`)
			return
		}
		t.Errorf("unexpected Docker request: %s", r.URL.Path)
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()
	t.Setenv("DOCKER_HOST", "tcp://"+server.Listener.Addr().String())
	t.Setenv("DOCKER_API_VERSION", "1.45")
	var callers sync.WaitGroup
	for range 32 {
		callers.Add(1)
		go func() {
			defer callers.Done()
			port, err := findAppInfo("fixture", "burst-app", false)
			if err != nil || port != 33338 {
				t.Errorf("concurrent port discovery: port=%d error=%v", port, err)
			}
		}()
	}
	callers.Wait()
}

func TestAppDispatchRetriesBeforeConnection(t *testing.T) {
	t.Setenv("SHUFFLE_MEMCACHED", "")
	t.Setenv("SHUFFLE_SWARM_CONFIG", "")
	t.Setenv("DOCKER_HOST", "unix:///tmp/shuffle-test-missing-docker.sock")
	for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "SHUFFLE_INTERNAL_HTTP_PROXY", "SHUFFLE_INTERNAL_HTTPS_PROXY"} {
		t.Setenv(key, "")
	}
	previous := shuffle.GetProject()
	previousTransport, previousURL := http.DefaultTransport, baseUrl
	t.Cleanup(func() {
		http.DefaultTransport, baseUrl = previousTransport, previousURL
		_, _ = shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
	})
	if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "worker", true, "", false, 0); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name string
		err  error
	}{
		{"dns", &net.DNSError{Err: "no such host", Name: "app", IsNotFound: true}},
		{"refused", fmt.Errorf("connect: connection refused")},
		{"accepted without response", nil},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var requests, dials atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				requests.Add(1)
				if tc.err == nil {
					connection, _, err := w.(http.Hijacker).Hijack()
					if err != nil {
						t.Error(err)
						return
					}
					connection.Close()
					return
				}
				io.WriteString(w, `{"success":true}`)
			}))
			defer server.Close()
			baseUrl = server.URL
			t.Setenv("BASE_URL", server.URL)
			transport := previousTransport.(*http.Transport).Clone()
			transport.DialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
				if dials.Add(1) <= 3 && tc.err != nil {
					return nil, &net.OpError{Op: "dial", Net: network, Err: tc.err}
				}
				return (&net.Dialer{}).DialContext(ctx, network, server.Listener.Addr().String())
			}
			http.DefaultTransport = transport
			defer transport.CloseIdleConnections()
			action := shuffle.Action{ID: "node", AppName: "app", Name: "GET"}
			execution := shuffle.WorkflowExecution{ExecutionId: "dispatch-" + tc.name, Authorization: "fixture-auth", Status: "EXECUTING", Workflow: shuffle.Workflow{Actions: []shuffle.Action{action}}}
			data, _ := json.Marshal(execution)
			ctx := context.Background()
			if err := shuffle.SetCache(ctx, "workflowexecution_"+execution.ExecutionId, data, 1); err != nil {
				t.Fatal(err)
			}
			defer shuffle.DeleteCache(ctx, "workflowexecution_"+execution.ExecutionId)
			defer shuffle.DeleteCache(ctx, execution.ExecutionId+"_"+action.ID)
			if err := sendAppRequest(ctx, server.URL, "app", 33338, &action, &execution, "fixture", 0); err != nil {
				t.Fatal(err)
			}
			if requests.Load() != 1 {
				t.Fatalf("app never received the retry after a failed connection: requests=%d dials=%d", requests.Load(), dials.Load())
			}
			if err := sendAppRequest(ctx, server.URL, "app", 33338, &action, &execution, "fixture", 0); err != nil {
				t.Fatal(err)
			}
			if requests.Load() != 1 {
				t.Fatal("accepted app action was dispatched twice")
			}
		})
	}
}

func TestAppDispatchAcknowledgement(t *testing.T) {
	t.Setenv("SHUFFLE_MEMCACHED", "")
	t.Setenv("SHUFFLE_SWARM_CONFIG", "run")
	t.Setenv("WORKER_HOSTNAME", "127.0.0.1")
	for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "SHUFFLE_INTERNAL_HTTP_PROXY", "SHUFFLE_INTERNAL_HTTPS_PROXY"} {
		t.Setenv(key, "")
	}
	previous := shuffle.GetProject()
	previousTransport, previousURL := http.DefaultTransport, baseUrl
	t.Cleanup(func() {
		http.DefaultTransport, baseUrl = previousTransport, previousURL
		_, _ = shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
	})
	if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "worker", true, "", false, 0); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name, body string
		status     int
		wantErr    bool
	}{
		{"accepted", `{"success":true}`, 200, false},
		{"legacy", "Attempting to execute", 200, false},
		{"negative", `{"success":false}`, 200, true},
		{"overloaded", `{"success":false}`, 503, true},
		{"error", "fixture failure", 500, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var requests, failureCallbacks atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/api/v1/streams" {
					var result shuffle.ActionResult
					if err := json.NewDecoder(r.Body).Decode(&result); err != nil {
						t.Error(err)
					}
					if result.ExecutionId != "dispatch-ack-"+tc.name || result.Action.ID != "node" || result.Status != "FAILURE" {
						t.Error("rejected dispatch did not identify the failed execution/node")
					}
					failureCallbacks.Add(1)
					io.WriteString(w, `{"success":true}`)
					return
				}
				requests.Add(1)
				w.WriteHeader(tc.status)
				io.WriteString(w, tc.body)
			}))
			defer server.Close()
			baseUrl = server.URL
			t.Setenv("BASE_URL", server.URL)
			transport := previousTransport.(*http.Transport).Clone()
			transport.DialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
				return (&net.Dialer{}).DialContext(ctx, network, server.Listener.Addr().String())
			}
			http.DefaultTransport = transport
			defer transport.CloseIdleConnections()
			action := shuffle.Action{ID: "node", AppName: "http", Name: "GET"}
			execution := shuffle.WorkflowExecution{ExecutionId: "dispatch-ack-" + tc.name, Authorization: "fixture-auth", Status: "EXECUTING", Workflow: shuffle.Workflow{Actions: []shuffle.Action{action}}}
			data, _ := json.Marshal(execution)
			ctx := context.Background()
			if err := shuffle.SetCache(ctx, "workflowexecution_"+execution.ExecutionId, data, 1); err != nil {
				t.Fatal(err)
			}
			defer shuffle.DeleteCache(ctx, "workflowexecution_"+execution.ExecutionId)
			defer shuffle.DeleteCache(ctx, execution.ExecutionId+"_"+action.ID)
			err := sendAppRequest(ctx, server.URL, "app", 33338, &action, &execution, "fixture", 0)
			if (err != nil) != tc.wantErr || requests.Load() != 1 || (failureCallbacks.Load() == 1) != tc.wantErr {
				t.Fatalf("dispatch acknowledgement: error=%v requests=%d failure_callbacks=%d want_error=%v", err, requests.Load(), failureCallbacks.Load(), tc.wantErr)
			}
		})
	}
}

func TestExecutionCallbackAndDispatchCoordination(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	var mutex sync.Mutex
	values := map[string][]byte{}
	connections := []net.Conn{}
	var allowClaim atomic.Bool
	var dispatchReads atomic.Int32
	dispatchReadGate := make(chan struct{})
	go func() {
		for {
			connection, err := listener.Accept()
			if err != nil {
				return
			}
			mutex.Lock()
			connections = append(connections, connection)
			mutex.Unlock()
			go func() {
				defer connection.Close()
				reader := bufio.NewReader(connection)
				for {
					line, err := reader.ReadString('\n')
					if err != nil {
						return
					}
					fields := strings.Fields(line)
					if len(fields) < 2 {
						return
					}
					command, key := fields[0], fields[1]
					switch command {
					case "get", "gets":
						mutex.Lock()
						value, found := values[key]
						mutex.Unlock()
						if key == "dispatch-concurrent_node" && !found {
							if dispatchReads.Add(1) == 2 {
								close(dispatchReadGate)
							}
							select {
							case <-dispatchReadGate:
							case <-time.After(time.Second):
								t.Error("concurrent dispatch did not reach both cache reads")
								return
							}
						}
						if found {
							fmt.Fprintf(connection, "VALUE %s 0 %d\r\n%s\r\n", key, len(value), value)
						}
						io.WriteString(connection, "END\r\n")
					case "set", "add":
						var size int
						if len(fields) != 5 {
							return
						}
						if _, err := fmt.Sscan(fields[4], &size); err != nil {
							return
						}
						value := make([]byte, size+2)
						if _, err := io.ReadFull(reader, value); err != nil {
							return
						}
						if command == "add" && key == "dispatch-no-quorum_node" {
							io.WriteString(connection, "SERVER_ERROR fixture unavailable\r\n")
							continue
						}
						if command == "add" && !allowClaim.Load() {
							io.WriteString(connection, "NOT_STORED\r\n")
							continue
						}
						mutex.Lock()
						if _, exists := values[key]; command == "add" && exists {
							mutex.Unlock()
							io.WriteString(connection, "NOT_STORED\r\n")
							continue
						}
						values[key] = value[:size]
						mutex.Unlock()
						io.WriteString(connection, "STORED\r\n")
					case "delete":
						mutex.Lock()
						delete(values, key)
						mutex.Unlock()
						io.WriteString(connection, "DELETED\r\n")
					default:
						return
					}
				}
			}()
		}
	}()
	defer func() {
		listener.Close()
		mutex.Lock()
		defer mutex.Unlock()
		for _, connection := range connections {
			connection.Close()
		}
	}()
	previous, previousURL := shuffle.GetProject(), baseUrl
	previousMemcached := os.Getenv("SHUFFLE_MEMCACHED")
	defer func() {
		os.Setenv("SHUFFLE_MEMCACHED", previousMemcached)
		_, _ = shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
		baseUrl = previousURL
	}()
	t.Setenv("SHUFFLE_MEMCACHED", listener.Addr().String())
	t.Setenv("SHUFFLE_SWARM_CONFIG", "run")
	t.Setenv("SHUFFLE_PROTECTED_CLEANUP_DISABLED", "true")
	for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "SHUFFLE_INTERNAL_HTTP_PROXY", "SHUFFLE_INTERNAL_HTTPS_PROXY"} {
		t.Setenv(key, "")
	}
	var dispatches atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/run" {
			dispatches.Add(1)
		}
		io.WriteString(w, `{"success":true}`)
	}))
	defer server.Close()
	baseUrl = server.URL
	t.Setenv("BASE_URL", server.URL)
	if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "worker", true, "", false, 0); err != nil {
		t.Fatal(err)
	}
	for _, status := range []string{"SUCCESS", "FINISHED", "FAILURE", "ABORTED"} {
		t.Run(status, func(t *testing.T) {
			allowClaim.Store(false)
			action := shuffle.Action{ID: "terminal-node", AppName: "http", Name: "GET"}
			execution := shuffle.WorkflowExecution{ExecutionId: "receipt-" + status, WorkflowId: "receipt-workflow", Authorization: "fixture-auth", Status: "EXECUTING", Workflow: shuffle.Workflow{ID: "receipt-workflow", Actions: []shuffle.Action{action}}}
			execution.Workflow.Configuration.SkipNotifications = true
			execution.Workflow.Configuration.ExitOnError = true
			data, _ := json.Marshal(execution)
			if err := shuffle.SetCache(context.Background(), "workflowexecution_"+execution.ExecutionId, data, 1); err != nil {
				t.Fatal(err)
			}
			result := shuffle.ActionResult{Action: action, ExecutionId: execution.ExecutionId, Authorization: execution.Authorization, Status: status, Result: "retained result"}
			body, _ := json.Marshal(result)
			done := make(chan struct{})
			go func() {
				defer close(done)
				handleWorkflowQueue(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/v1/streams", strings.NewReader(string(body))))
			}()
			key := execution.ExecutionId + "_" + action.ID + "_result"
			deadline := time.Now().Add(250 * time.Millisecond)
			var receipt shuffle.ActionResult
			for time.Now().Before(deadline) {
				if cached, err := shuffle.GetCache(context.Background(), key); err == nil && json.Unmarshal(cached.([]byte), &receipt) == nil {
					break
				}
				time.Sleep(5 * time.Millisecond)
			}
			allowClaim.Store(true)
			select {
			case <-done:
			case <-time.After(5 * time.Second):
				t.Fatal("callback did not complete after the claim was released")
			}
			if receipt.Status != status || receipt.Result != result.Result || receipt.ExecutionId != result.ExecutionId {
				t.Fatalf("terminal result was lost while the update lock was held: got status=%q want=%q", receipt.Status, status)
			}
		})
	}
	t.Run("overlapping recovery dispatches once", func(t *testing.T) {
		allowClaim.Store(true)
		action := shuffle.Action{ID: "node", AppName: "http", Name: "GET"}
		execution := shuffle.WorkflowExecution{ExecutionId: "dispatch-concurrent", Authorization: "fixture-auth", Status: "EXECUTING", Workflow: shuffle.Workflow{Actions: []shuffle.Action{action}}}
		data, _ := json.Marshal(execution)
		if err := shuffle.SetCache(context.Background(), "workflowexecution_"+execution.ExecutionId, data, 1); err != nil {
			t.Fatal(err)
		}
		_, portText, err := net.SplitHostPort(server.Listener.Addr().String())
		if err != nil {
			t.Fatal(err)
		}
		var port int
		if _, err := fmt.Sscan(portText, &port); err != nil {
			t.Fatal(err)
		}
		var callers sync.WaitGroup
		for range 2 {
			callers.Add(1)
			go func() {
				defer callers.Done()
				actionCopy, executionCopy := action, execution
				if err := sendAppRequest(context.Background(), server.URL, "127.0.0.1", port, &actionCopy, &executionCopy, "fixture", 0); err != nil {
					t.Error(err)
				}
			}()
		}
		callers.Wait()
		if dispatches.Load() != 1 {
			t.Fatalf("same node was sent to the app %d times", dispatches.Load())
		}
	})
	t.Run("unavailable claim cannot dispatch", func(t *testing.T) {
		action := shuffle.Action{ID: "node", AppName: "http", Name: "GET"}
		execution := shuffle.WorkflowExecution{ExecutionId: "dispatch-no-quorum", Authorization: "fixture-auth", Status: "EXECUTING", Workflow: shuffle.Workflow{Actions: []shuffle.Action{action}}}
		data, _ := json.Marshal(execution)
		if err := shuffle.SetCache(context.Background(), "workflowexecution_"+execution.ExecutionId, data, 1); err != nil {
			t.Fatal(err)
		}
		before := dispatches.Load()
		_, portText, err := net.SplitHostPort(server.Listener.Addr().String())
		if err != nil {
			t.Fatal(err)
		}
		var port int
		if _, err := fmt.Sscan(portText, &port); err != nil {
			t.Fatal(err)
		}
		if err := sendAppRequest(context.Background(), server.URL, "127.0.0.1", port, &action, &execution, "fixture", 0); err == nil {
			t.Fatal("failed cache claim was accepted")
		}
		if dispatches.Load() != before {
			t.Fatal("app ran without a confirmed dispatch claim")
		}
	})
}

func TestExecutionCacheWriteBeforeUnlock(t *testing.T) {
	// Workers skip backend-only protected-datastore cleanup.
	t.Setenv("SHUFFLE_PROTECTED_CLEANUP_DISABLED", "true")
	ctx := context.Background()
	execution := shuffle.WorkflowExecution{
		ExecutionId: "lock-boundary-fixture", Status: "EXECUTING",
		Workflow: shuffle.Workflow{Actions: []shuffle.Action{{ID: "pending-action"}}},
	}
	key := "workflowexecution_" + execution.ExecutionId
	defer shuffle.DeleteCache(ctx, key)
	stopBeforeDispatch := new(int)
	defer func() {
		if got := recover(); got != stopBeforeDispatch {
			t.Fatalf("release callback was not reached: %v\n%s", got, runtimedebug.Stack())
		}
	}()
	_ = setWorkflowExecution(ctx, execution, false, func() {
		cached, err := shuffle.GetCache(ctx, key)
		if err != nil {
			t.Fatal(err)
		}
		var saved shuffle.WorkflowExecution
		if err := json.Unmarshal(cached.([]byte), &saved); err != nil {
			t.Fatal(err)
		}
		if saved.ExecutionId != execution.ExecutionId || saved.Status != "EXECUTING" {
			t.Fatal("released before the execution was saved")
		}
		// Stop at the real release boundary; no Docker app is needed for this check.
		panic(stopBeforeDispatch)
	})
}

func TestSendResultAcknowledgement(t *testing.T) {
	for _, tc := range []struct {
		name      string
		statuses  []int
		body      string
		wantCalls int
		wantErr   bool
	}{
		{"accepted", []int{200}, `{"success":true}`, 1, false},
		{"busy then accepted", []int{503, 503, 200}, `{"success":true}`, 3, false},
		{"rate limited then accepted", []int{429, 200}, `{"success":true}`, 2, false},
		{"unavailable", []int{503}, `{"success":false}`, 5, true},
		{"unauthorized", []int{401}, `{"success":false}`, 1, true},
		{"negative acknowledgement", []int{200}, `{"success":false}`, 5, true},
		{"invalid acknowledgement", []int{200}, `<html>gateway page</html>`, 5, true},
		{"missing acknowledgement", []int{200}, `{}`, 5, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			calls := 0
			payload := `{"execution_id":"fixture","authorization":"fixture-token","status":"EXECUTING"}`
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != "/api/v1/streams" || r.Header.Get("Content-Type") != "application/json" {
					t.Error("incorrect execution update request")
				}
				body, _ := io.ReadAll(r.Body)
				if string(body) != payload {
					t.Error("retry changed or lost the execution payload")
				}
				i := calls
				calls++
				if i >= len(tc.statuses) {
					i = len(tc.statuses) - 1
				}
				w.WriteHeader(tc.statuses[i])
				io.WriteString(w, tc.body)
			}))
			defer server.Close()
			previous := baseUrl
			baseUrl = server.URL
			defer func() { baseUrl = previous }()
			t.Setenv("BASE_URL", server.URL)
			for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "SHUFFLE_INTERNAL_HTTP_PROXY", "SHUFFLE_INTERNAL_HTTPS_PROXY"} {
				t.Setenv(key, "")
			}
			err := sendResult(shuffle.WorkflowExecution{ExecutionId: "fixture"}, []byte(payload))
			if (err != nil) != tc.wantErr {
				t.Fatalf("error=%v, wantErr=%v", err, tc.wantErr)
			}
			if calls != tc.wantCalls {
				t.Fatalf("calls=%d, want %d", calls, tc.wantCalls)
			}
		})
	}
}

func TestCheckUnfinishedSendsTerminalResult(t *testing.T) {
	t.Setenv("SHUFFLE_MEMCACHED", "")
	previous := shuffle.GetProject()
	if _, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, "fixture", "worker", true, "", false, 0); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, err := shuffle.RunInit(previous.Dbclient, previous.StorageClient, previous.GceProject, previous.Environment, previous.CacheDb, previous.DbType, false, 0)
		if err != nil {
			t.Error(err)
		}
	})
	for _, status := range []string{"EXECUTING", "WAITING", "FINISHED", "FAILURE", "ABORTED"} {
		t.Run(status, func(t *testing.T) {
			var received atomic.Bool
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				var actual shuffle.WorkflowExecution
				if err := json.NewDecoder(r.Body).Decode(&actual); err != nil {
					t.Error(err)
				}
				if actual.Status != status || actual.ExecutionId != "sync-fixture" {
					t.Error("execution state changed during synchronization")
				}
				received.Store(true)
				io.WriteString(w, `{"success":true}`)
			}))
			defer server.Close()
			oldURL := baseUrl
			baseUrl = server.URL
			defer func() { baseUrl = oldURL }()
			t.Setenv("BASE_URL", server.URL)
			for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "SHUFFLE_INTERNAL_HTTP_PROXY", "SHUFFLE_INTERNAL_HTTPS_PROXY"} {
				t.Setenv(key, "")
			}
			execution := shuffle.WorkflowExecution{ExecutionId: "sync-fixture", Authorization: "fixture-auth", Status: status,
				Workflow: shuffle.Workflow{Actions: []shuffle.Action{{ID: "pending-action"}}}}
			data, err := json.Marshal(execution)
			if err != nil {
				t.Fatal(err)
			}
			if err := shuffle.SetCache(context.Background(), "workflowexecution_sync-fixture", data, 1); err != nil {
				t.Fatal(err)
			}
			defer shuffle.DeleteCache(context.Background(), "workflowexecution_sync-fixture")
			finished := checkUnfinished(shuffle.OrborusExecutionRequest{ExecutionId: execution.ExecutionId})
			if finished != (status != "EXECUTING") {
				t.Errorf("worker watchdog stop=%v for execution status %s", finished, status)
			}
			if !received.Load() {
				t.Fatal("worker did not synchronize its execution state")
			}
		})
	}
}

func TestRejectedExecutionDoesNotStartWatchdog(t *testing.T) {
	for _, tc := range []struct {
		name, body string
		status     int
	}{
		{"unauthorized", `{"success":false}`, 401},
		{"missing identity", `{}`, 200},
		{"wrong execution", `{"execution_id":"foreign","authorization":"fixture-auth","status":"EXECUTING"}`, 200},
		{"wrong authorization", `{"execution_id":"rejected-sync-fixture","authorization":"wrong-auth","status":"EXECUTING"}`, 200},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
				io.WriteString(w, tc.body)
			}))
			defer server.Close()
			previous := baseUrl
			baseUrl = server.URL
			defer func() { baseUrl = previous }()
			t.Setenv("BASE_URL", server.URL)
			t.Setenv("AUTHORIZATION", "")
			request := shuffle.OrborusExecutionRequest{ExecutionId: "rejected-sync-fixture", Authorization: "fixture-auth"}
			defer executionSyncs.Delete(request.ExecutionId)
			processRunExecution(request)
			if _, started := executionSyncs.Load(request.ExecutionId); started {
				t.Fatal("a rejected execution left a permanent watchdog running")
			}
		})
	}
}

// Guard the lock boundary as well as testing actual HTTP retries above. A full
// worker/subflow run additionally needs the shared cache and a running backend.
func TestExecutionUpdateLockBoundary(t *testing.T) {
	data, err := os.ReadFile("worker.go")
	if err != nil {
		t.Fatal(err)
	}
	source := string(data)
	start := strings.Index(source, "func setWorkflowExecution(")
	end := strings.Index(source[start:], "\nfunc ")
	save := source[start : start+end]
	write := strings.Index(save, "err = shuffle.SetCache(ctx, cacheKey, execData, 30)")
	release := strings.Index(save, "releaseUpdateLock[0]()")
	dispatch := strings.Index(save, "handleExecutionResult(workflowExecution)")
	if write < 0 || release <= write || dispatch <= release {
		t.Fatal("update lock must cover persistence, but not dispatch or callbacks")
	}
	if !strings.Contains(source, "setWorkflowExecution(ctx, *workflowExecution, dbSave, releaseClaim)") {
		t.Fatal("transaction does not pass its lock release to the cache writer")
	}
}

func TestConcurrentSubflowPollIsolation(t *testing.T) {
	previousData := data
	data = `{"execution_id":"foreign-execution","authorization":"foreign-auth"}`
	defer func() { data = previousData }()
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var poll shuffle.ActionResult
		if err := json.NewDecoder(r.Body).Decode(&poll); err != nil {
			t.Error(err)
		}
		if (poll.ExecutionId != "poll-a" && poll.ExecutionId != "poll-b") || poll.Authorization != poll.ExecutionId+"-auth" {
			t.Error("poll used another execution's credentials")
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		requests.Add(1)
		json.NewEncoder(w).Encode(shuffle.WorkflowExecution{ExecutionId: poll.ExecutionId, Authorization: poll.Authorization, Status: "EXECUTING"})
	}))
	defer server.Close()
	t.Setenv("BASE_URL", server.URL)
	for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "SHUFFLE_INTERNAL_HTTP_PROXY", "SHUFFLE_INTERNAL_HTTPS_PROXY"} {
		t.Setenv(key, "")
	}
	var group sync.WaitGroup
	for _, id := range []string{"poll-a", "poll-b"} {
		group.Add(1)
		go func(id string) {
			defer group.Done()
			defer resetSubflowPollDelay(id + ":child")
			err := handleSubflowPoller(context.Background(), shuffle.WorkflowExecution{ExecutionId: id, Authorization: id + "-auth", Status: "EXECUTING"}, server.URL, "child")
			if err == nil || err.Error() != "Subflow status not found yet" {
				t.Errorf("unexpected poll result for %s: %v", id, err)
			}
		}(id)
	}
	group.Wait()
	if requests.Load() != 2 {
		t.Fatalf("received %d correctly scoped requests, want 2", requests.Load())
	}
}
