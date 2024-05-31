package main

import (
	"github.com/shuffle/shuffle-shared"

	"bytes"
	"context"
	"log"
	"net/http"
	"net/http/httptest"
	"reflect"
	"runtime"
	"testing"
	"time"

	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
	"google.golang.org/api/option"

	"google.golang.org/grpc"
)

type endpoint struct {
	handler http.HandlerFunc
	path    string
	method  string
	body    []byte
}

func init() {
	ctx := context.Background()
	dbclient, err := datastore.NewClient(ctx, gceProject, option.WithGRPCDialOption(grpc.WithNoProxy()))
	if err != nil {
		log.Fatalf("[DEBUG] Database client error during init: %s", err)
	}

	_, err = shuffle.RunInit(*dbclient, storage.Client{}, gceProject, "onprem", true, "elasticsearch", false, 0)
	log.Printf("INIT")
}

// TestTestAuthenticationRequired tests that the handlers in the `handlers`
// variable returns 401 Unauthorized when called without credentials.
func TestAuthenticationRequired(t *testing.T) {
	handlers := []endpoint{
		{handler: shuffle.HandleNewOutlookRegister, path: "/functions/outlook/register", method: "GET"},
		{handler: shuffle.HandleGetOutlookFolders, path: "/functions/outlook/getFolders", method: "GET"},
		{handler: shuffle.HandleApiGeneration, path: "/api/v1/users/generateapikey", method: "GET"},
		{handler: shuffle.HandleLogin, path: "/api/v1/users/login", method: "POST"}, // prob not this one
		// handleRegister generates nil pointer exception. Not necessary for this anyway.
		//{handler: handleRegister, path: "/api/v1/users/register", method: "POST"},
		{handler: shuffle.HandleGetUsers, path: "/api/v1/users/getusers", method: "GET"},
		{handler: handleInfo, path: "/api/v1/users/getinfo", method: "GET"},
		{handler: shuffle.HandleSettings, path: "/api/v1/users/getsettings", method: "GET"},
		{handler: shuffle.HandleUpdateUser, path: "/api/v1/users/updateuser", method: "PUT"},
		{handler: shuffle.DeleteUser, path: "/api/v1/users/123", method: "DELETE"},
		{handler: shuffle.HandlePasswordChange, path: "/api/v1/users/passwordchange", method: "POST"},
		{handler: shuffle.HandleGetUsers, path: "/api/v1/users", method: "GET"},
		{handler: shuffle.HandleGetEnvironments, path: "/api/v1/getenvironments", method: "GET"},
		{handler: shuffle.HandleSetEnvironments, path: "/api/v1/setenvironments", method: "PUT"},

		// handleWorkflowQueue generates nil pointer exception
		//{handler: handleWorkflowQueue, path: "/api/v1/streams", method: "POST"},
		// handleGetStreamResults generates nil pointer exception
		//{handler: handleGetStreamResults, path: "/api/v1/streams/results", method: "POST"},

		{handler: handleAppHotloadRequest, path: "/api/v1/apps/run_hotload", method: "GET"},
		{handler: LoadSpecificApps, path: "/api/v1/apps/get_existing", method: "POST"},
		{handler: shuffle.UpdateWorkflowAppConfig, path: "/api/v1/apps/123", method: "PATCH"},
		{handler: validateAppInput, path: "/api/v1/apps/validate", method: "POST"},
		{handler: shuffle.DeleteWorkflowApp, path: "/api/v1/apps/123", method: "DELETE"},
		{handler: shuffle.GetWorkflowAppConfig, path: "/api/v1/apps/123/config", method: "GET"},
		{handler: getWorkflowApps, path: "/api/v1/apps", method: "GET"},
		{handler: setNewWorkflowApp, path: "/api/v1/apps", method: "PUT"},
		//{handler: shuffle.GetSpecificApps, path: "/api/v1/apps/search", method: "POST"},

		{handler: shuffle.GetAppAuthentication, path: "/api/v1/apps/authentication", method: "GET"},
		{handler: shuffle.AddAppAuthentication, path: "/api/v1/apps/authentication", method: "PUT"},
		{handler: shuffle.DeleteAppAuthentication, path: "/api/v1/apps/authentication/123", method: "DELETE"},

		{handler: validateAppInput, path: "/api/v1/workflows/apps/validate", method: "POST"},
		{handler: getWorkflowApps, path: "/api/v1/workflows/apps", method: "GET"},
		{handler: setNewWorkflowApp, path: "/api/v1/workflows/apps", method: "PUT"},

		{handler: shuffle.GetWorkflows, path: "/api/v1/workflows", method: "GET"},
		{handler: shuffle.SetNewWorkflow, path: "/api/v1/workflows", method: "POST"},
		{handler: handleGetWorkflowqueue, path: "/api/v1/workflows/queue", method: "GET"},
		{handler: handleGetWorkflowqueueConfirm, path: "/api/v1/workflows/queue/confirm", method: "POST"},
		{handler: shuffle.HandleGetSchedules, path: "/api/v1/workflows/schedules", method: "GET"},
		{handler: loadSpecificWorkflows, path: "/api/v1/workflows/download_remote", method: "POST"},
		{handler: executeWorkflow, path: "/api/v1/workflows/123/execute", method: "GET"},
		{handler: scheduleWorkflow, path: "/api/v1/workflows/123/schedule", method: "POST"},
		{handler: stopSchedule, path: "/api/v1/workflows/123/schedule/abc", method: "DELETE"},
		// createOutlookSub generates nil pointer exception
		{handler: shuffle.HandleCreateOutlookSub, path: "/api/v1/workflows/123/outlook", method: "POST"},
		// handleDeleteOutlookSub generates nil pointer exception
		{handler: shuffle.HandleDeleteOutlookSub, path: "/api/v1/workflows/123/outlook/abc", method: "DELETE"},
		{handler: shuffle.GetWorkflowExecutions, path: "/api/v1/workflows/123/executions", method: "GET"},
		{handler: shuffle.AbortExecution, path: "/api/v1/workflows/123/executions/abc/abort", method: "GET"},
		{handler: shuffle.GetSpecificWorkflow, path: "/api/v1/workflows/123", method: "GET"},
		{handler: shuffle.SaveWorkflow, path: "/api/v1/workflows/123", method: "PUT"},
		{handler: deleteWorkflow, path: "/api/v1/workflows/123", method: "DELETE"},

		{handler: shuffle.HandleNewHook, path: "/api/v1/hooks/new", method: "POST"},
		{handler: handleWebhookCallback, path: "/api/v1/hooks/123", method: "POST"},
		{handler: shuffle.HandleDeleteHook, path: "/api/v1/hooks/123/delete", method: "DELETE"},

		{handler: shuffle.HandleGetSpecificTrigger, path: "/api/v1/triggers/123", method: "GET"},
		//{handler: shuffle.HandleGetSpecificStats, path: "/api/v1/stats/123", method: "GET"},

		{handler: verifySwagger, path: "/api/v1/verify_swagger", method: "POST"},
		{handler: verifySwagger, path: "/api/v1/verify_openapi", method: "POST"},
		{handler: shuffle.EchoOpenapiData, path: "/api/v1/get_openapi_uri", method: "POST"},
		{handler: shuffle.EchoOpenapiData, path: "/api/v1/validate_openapi", method: "POST"},
		{handler: shuffle.ValidateSwagger, path: "/api/v1/validate_openapi", method: "POST"},
		{handler: getOpenapi, path: "/api/v1/get_openapi", method: "GET"},

		//{handler: shuffle.CleanupExecutions, path: "/api/v1/execution_cleanup", method: "GET"},

		{handler: handleCloudSetup, path: "/api/v1/cloud/setup", method: "POST"},
		{handler: shuffle.HandleGetOrgs, path: "/api/v1/orgs", method: "POST"},
		{handler: shuffle.HandleGetFileContent, path: "/api/v1/files/{fileId}/content", method: "POST", body: []byte("hi")},
	}

	var err error
	ctx := context.Background()

	// Most handlers requires database access in order to not crash or cause
	// nil pointer issues.
	// To start a local database instance, run:
	//   docker-compose up database
	// To let the tests know about the database, run:
	//   DATASTORE_EMULATOR_HOST=0.0.0.0:8000 go test
	dbclient, err = datastore.NewClient(ctx, gceProject, option.WithGRPCDialOption(grpc.WithNoProxy()))
	if err != nil {
		t.Fatal(err)
	}

	dummyBody := bytes.NewBufferString("dummy")

	for _, e := range handlers {
		log.Printf("Endpoint: %#v", e.path)
		req, err := http.NewRequest(e.method, e.path, dummyBody)
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(e.handler)

		timeoutHandler := http.TimeoutHandler(handler, 2*time.Second, `Request Timeout.`)
		timeoutHandler.ServeHTTP(rr, req)

		funcName := getFunctionNameFromFunction(e.handler)
		if status := rr.Code; status != http.StatusUnauthorized {
			t.Errorf("%s handler returned wrong status code: got %v want %v",
				funcName, status, http.StatusUnauthorized)
		}
	}
}

func TestAuthenticationNotRequired(t *testing.T) {
	// All of these return 200 OK when user not logged in
	handlers := []endpoint{
		{handler: checkAdminLogin, path: "/api/v1/users/checkusers", method: "GET"},
		{handler: shuffle.HandleLogout, path: "/api/v1/users/logout", method: "POST"},
		{handler: shuffle.GetDocList, path: "/api/v1/docs", method: "GET"},
		{handler: shuffle.GetDocs, path: "/api/v1/docs/123", method: "GET"},
		{handler: healthCheckHandler, path: "/api/v1/_ah/health"},
	}

	for _, e := range handlers {
		log.Printf("Endpoint: %#v", e.path)
		req, err := http.NewRequest(e.method, e.path, nil)
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(e.handler)

		timeoutHandler := http.TimeoutHandler(handler, 2*time.Second, `Request Timeout.`)
		timeoutHandler.ServeHTTP(rr, req)

		funcName := getFunctionNameFromFunction(e.handler)
		if status := rr.Code; status != http.StatusOK {
			t.Errorf("%s handler returned wrong status code: got %v want %v",
				funcName, status, http.StatusOK)
		}
	}
}

// TestCors tests that all endpoints returns the same CORS headers when hit
// with an OPTIONS type request.
// It feels very fragile to test headers like this, especially for the
// "Access-Control-Allow-Origin", but this test should be helpful while
// refactoring the CORS logic into a middleware, and that's the reason this
// test exists right now. It might change after the refactor because our
// requirements might change after the refactor.
func TestCors(t *testing.T) {
	handlers := []endpoint{
		{handler: handleLogin, path: "/api/v1/users/login", method: "POST"}, // prob not this one

		{handler: shuffle.HandleNewOutlookRegister, path: "/functions/outlook/register", method: "GET"},
		{handler: shuffle.HandleGetOutlookFolders, path: "/functions/outlook/getFolders", method: "GET"},
		{handler: shuffle.HandleApiGeneration, path: "/api/v1/users/generateapikey", method: "GET"},
		// handleRegister generates nil pointer exception
		{handler: handleRegister, path: "/api/v1/users/register", method: "POST"},
		{handler: shuffle.HandleGetUsers, path: "/api/v1/users/getusers", method: "GET"},
		{handler: handleInfo, path: "/api/v1/users/getinfo", method: "GET"},
		{handler: shuffle.HandleSettings, path: "/api/v1/users/getsettings", method: "GET"},
		{handler: shuffle.HandleUpdateUser, path: "/api/v1/users/updateuser", method: "PUT"},
		{handler: shuffle.DeleteUser, path: "/api/v1/users/123", method: "DELETE"},
		// handlePasswordChange generates nil pointer exception
		{handler: shuffle.HandlePasswordChange, path: "/api/v1/users/passwordchange", method: "POST"},
		{handler: shuffle.HandleGetUsers, path: "/api/v1/users", method: "GET"},
		{handler: shuffle.HandleGetEnvironments, path: "/api/v1/getenvironments", method: "GET"},
		{handler: shuffle.HandleSetEnvironments, path: "/api/v1/setenvironments", method: "PUT"},

		// handleWorkflowQueue generates nil pointer exception
		{handler: handleWorkflowQueue, path: "/api/v1/streams", method: "POST"},
		// handleGetStreamResults generates nil pointer exception
		{handler: handleGetStreamResults, path: "/api/v1/streams/results", method: "POST"},

		{handler: handleAppHotloadRequest, path: "/api/v1/apps/run_hotload", method: "GET"},
		{handler: LoadSpecificApps, path: "/api/v1/apps/get_existing", method: "POST"},
		{handler: shuffle.UpdateWorkflowAppConfig, path: "/api/v1/apps/123", method: "PATCH"},
		{handler: validateAppInput, path: "/api/v1/apps/validate", method: "POST"},
		{handler: shuffle.DeleteWorkflowApp, path: "/api/v1/apps/123", method: "DELETE"},
		{handler: shuffle.GetWorkflowAppConfig, path: "/api/v1/apps/123/config", method: "GET"},
		{handler: getWorkflowApps, path: "/api/v1/apps", method: "GET"},
		{handler: setNewWorkflowApp, path: "/api/v1/apps", method: "PUT"},
		//{handler: shuffle.GetSpecificApps, path: "/api/v1/apps/search", method: "POST"},

		{handler: shuffle.GetAppAuthentication, path: "/api/v1/apps/authentication", method: "GET"},
		{handler: shuffle.AddAppAuthentication, path: "/api/v1/apps/authentication", method: "PUT"},
		{handler: shuffle.DeleteAppAuthentication, path: "/api/v1/apps/authentication/123", method: "DELETE"},

		{handler: validateAppInput, path: "/api/v1/workflows/apps/validate", method: "POST"},
		{handler: getWorkflowApps, path: "/api/v1/workflows/apps", method: "GET"},
		{handler: setNewWorkflowApp, path: "/api/v1/workflows/apps", method: "PUT"},

		{handler: shuffle.GetWorkflows, path: "/api/v1/workflows", method: "GET"},
		{handler: shuffle.SetNewWorkflow, path: "/api/v1/workflows", method: "POST"},
		{handler: handleGetWorkflowqueue, path: "/api/v1/workflows/queue", method: "GET"},
		{handler: handleGetWorkflowqueueConfirm, path: "/api/v1/workflows/queue/confirm", method: "POST"},
		{handler: shuffle.HandleGetSchedules, path: "/api/v1/workflows/schedules", method: "GET"},
		{handler: loadSpecificWorkflows, path: "/api/v1/workflows/download_remote", method: "POST"},
		{handler: executeWorkflow, path: "/api/v1/workflows/123/execute", method: "GET"},
		{handler: scheduleWorkflow, path: "/api/v1/workflows/123/schedule", method: "POST"},
		{handler: stopSchedule, path: "/api/v1/workflows/123/schedule/abc", method: "DELETE"},
		// createOutlookSub generates nil pointer exception
		{handler: shuffle.HandleCreateOutlookSub, path: "/api/v1/workflows/123/outlook", method: "POST"},
		// handleDeleteOutlookSub generates nil pointer exception
		{handler: shuffle.HandleDeleteOutlookSub, path: "/api/v1/workflows/123/outlook/abc", method: "DELETE"},
		{handler: shuffle.GetWorkflowExecutions, path: "/api/v1/workflows/123/executions", method: "GET"},
		{handler: shuffle.AbortExecution, path: "/api/v1/workflows/123/executions/abc/abort", method: "GET"},
		{handler: shuffle.GetSpecificWorkflow, path: "/api/v1/workflows/123", method: "GET"},
		{handler: shuffle.SaveWorkflow, path: "/api/v1/workflows/123", method: "PUT"},
		{handler: deleteWorkflow, path: "/api/v1/workflows/123", method: "DELETE"},

		{handler: shuffle.HandleNewHook, path: "/api/v1/hooks/new", method: "POST"},
		{handler: handleWebhookCallback, path: "/api/v1/hooks/123", method: "POST"},
		{handler: shuffle.HandleDeleteHook, path: "/api/v1/hooks/123/delete", method: "DELETE"},

		{handler: shuffle.HandleGetSpecificTrigger, path: "/api/v1/triggers/123", method: "GET"},
		//{handler: shuffle.HandleGetSpecificStats, path: "/api/v1/stats/123", method: "GET"},

		{handler: verifySwagger, path: "/api/v1/verify_swagger", method: "POST"},
		{handler: verifySwagger, path: "/api/v1/verify_openapi", method: "POST"},
		{handler: echoOpenapiData, path: "/api/v1/get_openapi_uri", method: "POST"},
		{handler: echoOpenapiData, path: "/api/v1/validate_openapi", method: "POST"},
		{handler: shuffle.ValidateSwagger, path: "/api/v1/validate_openapi", method: "POST"},
		{handler: getOpenapi, path: "/api/v1/get_openapi", method: "GET"},

		//{handler: shuffle.CleanupExecutions, path: "/api/v1/execution_cleanup", method: "GET"},

		{handler: handleCloudSetup, path: "/api/v1/cloud/setup", method: "POST"},
		{handler: shuffle.HandleGetOrgs, path: "/api/v1/orgs", method: "POST"},
		{handler: shuffle.HandleGetFileContent, path: "/api/v1/files/{fileId}/content", method: "POST"},
	}

	//r := initHandlers(context.TODO())
	initHandlers()

outerLoop:
	for _, e := range handlers {
		log.Printf("Endpoint: %#v", e.path)
		req, err := http.NewRequest("OPTIONS", e.path, nil)
		req.Header.Add("Origin", "http://localhost:3000")
		req.Header.Add("Access-Control-Request-Method", "POST")
		req.Header.Add("Access-Control-Request-Headers", "Content-Type, Accept, X-Requested-With, remember-me")

		// OPTIONS /resource/foo
		// Access-Control-Request-Method: DELETE
		// Access-Control-Request-Headers: origin, x-requested-with
		// Origin: https://foo.bar.org

		if err != nil {
			t.Errorf("Failure in OPTIONS setup: %s", err)
			continue
		}

		rr := httptest.NewRecorder()

		//timeoutHandler := http.TimeoutHandler(r, 2*time.Second, `Request Timeout`)
		//timeoutHandler.ServeHTTP(rr, req)

		funcName := getFunctionNameFromFunction(e.handler)
		if status := rr.Code; status != http.StatusOK {
			t.Errorf("%s handler returned wrong status code: got %v want %v",
				funcName, status, http.StatusOK)
			continue
		}

		want := map[string]string{
			"Vary":                             "Origin",
			"Access-Control-Allow-Headers":     "Content-Type, Accept, X-Requested-With, Remember-Me",
			"Access-Control-Allow-Methods":     "POST",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Origin":      "http://localhost:3000",
		}

		// Remember to use canonical header name if accessing the headers array
		// directly:
		//   v := r.Header[textproto.CanonicalMIMEHeaderKey("foo")]
		// When using Header().Get(h), h will automatically be converted to canonical format.

		for key, value := range want {
			got := rr.Header().Get(key)
			if got != value {
				t.Errorf("%s handler returned wrong value for '%s' header: got '%v' want '%v'",
					funcName, key, got, value)
				continue outerLoop
			}
		}

	}
}

func getFunctionNameFromFunction(f interface{}) string {
	return runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name()
}
