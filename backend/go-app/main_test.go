package main

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"reflect"
	"runtime"
	"testing"
	"time"

	"cloud.google.com/go/datastore"
	"google.golang.org/api/option"

	"google.golang.org/grpc"
)

type endpoint struct {
	handler http.HandlerFunc
	path    string
	method  string
}

// TestTestAuthenticationRequired tests that the handlers in the `handlers`
// variable returns 401 Unauthorized when called without credentials.
func TestAuthenticationRequired(t *testing.T) {
	handlers := []endpoint{
		{handler: handleSendalert, path: "/functions/sendmail", method: "POST"},
		{handler: handleNewOutlookRegister, path: "/functions/outlook/register", method: "GET"},
		{handler: handleGetOutlookFolders, path: "/functions/outlook/getFolders", method: "GET"},
		{handler: handleApiGeneration, path: "/api/v1/users/generateapikey", method: "GET"},
		{handler: handleLogin, path: "/api/v1/users/login", method: "POST"}, // prob not this one
		// handleRegister generates nil pointer exception
		{handler: handleRegister, path: "/api/v1/users/register", method: "POST"},
		{handler: handleGetUsers, path: "/api/v1/users/getusers", method: "GET"},
		{handler: handleInfo, path: "/api/v1/users/getinfo", method: "GET"},
		{handler: handleSettings, path: "/api/v1/users/getsettings", method: "GET"},
		{handler: handleUpdateUser, path: "/api/v1/users/updateuser", method: "PUT"},
		{handler: deleteUser, path: "/api/v1/users/123", method: "DELETE"},
		// handlePasswordChange generates nil pointer exception
		{handler: handlePasswordChange, path: "/api/v1/users/passwordchange", method: "POST"},
		{handler: handleGetUsers, path: "/api/v1/users", method: "GET"},
		{handler: handleGetEnvironments, path: "/api/v1/getenvironments", method: "GET"},
		{handler: handleSetEnvironments, path: "/api/v1/setenvironments", method: "PUT"},

		// handleWorkflowQueue generates nil pointer exception
		{handler: handleWorkflowQueue, path: "/api/v1/streams", method: "POST"},
		// handleGetStreamResults generates nil pointer exception
		{handler: handleGetStreamResults, path: "/api/v1/streams/results", method: "POST"},

		{handler: handleAppHotloadRequest, path: "/api/v1/apps/run_hotload", method: "GET"},
		{handler: loadSpecificApps, path: "/api/v1/apps/get_existing", method: "POST"},
		{handler: updateWorkflowAppConfig, path: "/api/v1/apps/123", method: "PATCH"},
		{handler: validateAppInput, path: "/api/v1/apps/validate", method: "POST"},
		{handler: deleteWorkflowApp, path: "/api/v1/apps/123", method: "DELETE"},
		{handler: getWorkflowAppConfig, path: "/api/v1/apps/123/config", method: "GET"},
		{handler: getWorkflowApps, path: "/api/v1/apps", method: "GET"},
		{handler: setNewWorkflowApp, path: "/api/v1/apps", method: "PUT"},
		{handler: getSpecificApps, path: "/api/v1/apps/search", method: "POST"},

		{handler: getAppAuthentication, path: "/api/v1/apps/authentication", method: "GET"},
		{handler: addAppAuthentication, path: "/api/v1/apps/authentication", method: "PUT"},
		{handler: deleteAppAuthentication, path: "/api/v1/apps/authentication/123", method: "DELETE"},

		{handler: validateAppInput, path: "/api/v1/workflows/apps/validate", method: "POST"},
		{handler: getWorkflowApps, path: "/api/v1/workflows/apps", method: "GET"},
		{handler: setNewWorkflowApp, path: "/api/v1/workflows/apps", method: "PUT"},

		{handler: getWorkflows, path: "/api/v1/workflows", method: "GET"},
		{handler: setNewWorkflow, path: "/api/v1/workflows", method: "POST"},
		{handler: handleGetWorkflowqueue, path: "/api/v1/workflows/queue", method: "GET"},
		{handler: handleGetWorkflowqueueConfirm, path: "/api/v1/workflows/queue/confirm", method: "POST"},
		{handler: handleGetSchedules, path: "/api/v1/workflows/schedules", method: "GET"},
		{handler: loadSpecificWorkflows, path: "/api/v1/workflows/download_remote", method: "POST"},
		{handler: executeWorkflow, path: "/api/v1/workflows/123/execute", method: "GET"},
		{handler: scheduleWorkflow, path: "/api/v1/workflows/123/schedule", method: "POST"},
		{handler: stopSchedule, path: "/api/v1/workflows/123/schedule/abc", method: "DELETE"},
		// createOutlookSub generates nil pointer exception
		{handler: createOutlookSub, path: "/api/v1/workflows/123/outlook", method: "POST"},
		// handleDeleteOutlookSub generates nil pointer exception
		{handler: handleDeleteOutlookSub, path: "/api/v1/workflows/123/outlook/abc", method: "DELETE"},
		{handler: getWorkflowExecutions, path: "/api/v1/workflows/123/executions", method: "GET"},
		{handler: abortExecution, path: "/api/v1/workflows/123/executions/abc/abort", method: "GET"},
		{handler: getSpecificWorkflow, path: "/api/v1/workflows/123", method: "GET"},
		{handler: saveWorkflow, path: "/api/v1/workflows/123", method: "PUT"},
		{handler: deleteWorkflow, path: "/api/v1/workflows/123", method: "DELETE"},

		{handler: handleNewHook, path: "/api/v1/hooks/new", method: "POST"},
		{handler: handleWebhookCallback, path: "/api/v1/hooks/123", method: "POST"},
		{handler: handleDeleteHook, path: "/api/v1/hooks/123/delete", method: "DELETE"},

		{handler: handleGetSpecificTrigger, path: "/api/v1/triggers/123", method: "GET"},
		{handler: handleGetSpecificStats, path: "/api/v1/stats/123", method: "GET"},

		{handler: verifySwagger, path: "/api/v1/verify_swagger", method: "POST"},
		{handler: verifySwagger, path: "/api/v1/verify_openapi", method: "POST"},
		{handler: echoOpenapiData, path: "/api/v1/get_openapi_uri", method: "POST"},
		{handler: echoOpenapiData, path: "/api/v1/validate_openapi", method: "POST"},
		{handler: validateSwagger, path: "/api/v1/validate_openapi", method: "POST"},
		{handler: getOpenapi, path: "/api/v1/get_openapi", method: "GET"},

		{handler: cleanupExecutions, path: "/api/v1/execution_cleanup", method: "GET"},

		{handler: handleCloudSetup, path: "/api/v1/cloud/setup", method: "POST"},
		{handler: handleGetOrgs, path: "/api/v1/orgs", method: "POST"},
		{handler: handleGetFileContent, path: "/api/v1/files/{fileId}/content", method: "POST"},
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
		{handler: handleLogout, path: "/api/v1/users/logout", method: "POST"},
		{handler: getDocList, path: "/api/v1/docs", method: "GET"},
		{handler: getDocs, path: "/api/v1/docs/123", method: "GET"},
		{handler: healthCheckHandler, path: "/api/v1/_ah/health"},
	}

	for _, e := range handlers {
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
		{handler: handleSendalert, path: "/functions/sendmail"},
		{handler: getDocList, path: "/api/v1/docs"},
		{handler: getDocs, path: "/api/v1/docs/123"},
		{handler: handleNewOutlookRegister, path: "/functions/outlook/register"},
		{handler: handleGetOutlookFolders, path: "/functions/outlook/getFolders"},
		{handler: handleApiGeneration, path: "/api/v1/users/generateapikey"},
		// handleLogin generates nil pointer exception
		// {handler: handleLogin, path: "/api/v1/users/login"}, // prob not this one
		{handler: handleLogout, path: "/api/v1/users/logout"},
		// handleRegister generates nil pointer exception
		// {handler: handleRegister, path: "/api/v1/users/register"},
		// checkAdminLogin generates nil pointer exception
		// {handler: checkAdminLogin, path: "/api/v1/users/checkusers"},
		{handler: handleGetUsers, path: "/api/v1/users/getusers"},
		{handler: handleInfo, path: "/api/v1/users/getinfo"},
		{handler: handleSettings, path: "/api/v1/users/getsettings"},
		{handler: handleUpdateUser, path: "/api/v1/users/updateuser"},
		{handler: deleteUser, path: "/api/v1/users/123"},
		// handlePasswordChange generates nil pointer exception
		// {handler: handlePasswordChange, path: "/api/v1/users/passwordchange"},
		{handler: handleGetUsers, path: "/api/v1/users"},
		{handler: handleGetEnvironments, path: "/api/v1/getenvironments"},
		{handler: handleSetEnvironments, path: "/api/v1/setenvironments"},

		// handleWorkflowQueue generates nil pointer exception
		// {handler: handleWorkflowQueue, path: "/api/v1/streams"},
		// handleGetStreamResults generates nil pointer exception
		// {handler: handleGetStreamResults, path: "/api/v1/streams/results"},

		{handler: handleAppHotloadRequest, path: "/api/v1/apps/run_hotload"},
		{handler: loadSpecificApps, path: "/api/v1/apps/get_existing"},
		{handler: updateWorkflowAppConfig, path: "/api/v1/apps/123"},
		{handler: validateAppInput, path: "/api/v1/apps/validate"},
		{handler: deleteWorkflowApp, path: "/api/v1/apps/123"},
		{handler: getWorkflowAppConfig, path: "/api/v1/apps/123/config"},
		{handler: getWorkflowApps, path: "/api/v1/apps"},
		{handler: setNewWorkflowApp, path: "/api/v1/apps"},
		{handler: getSpecificApps, path: "/api/v1/apps/search"},

		{handler: getAppAuthentication, path: "/api/v1/apps/authentication"},
		{handler: addAppAuthentication, path: "/api/v1/apps/authentication"},
		{handler: deleteAppAuthentication, path: "/api/v1/apps/authentication/123"},

		{handler: validateAppInput, path: "/api/v1/workflows/apps/validate"},
		{handler: getWorkflowApps, path: "/api/v1/workflows/apps"},
		{handler: setNewWorkflowApp, path: "/api/v1/workflows/apps"},

		{handler: getWorkflows, path: "/api/v1/workflows"},
		{handler: setNewWorkflow, path: "/api/v1/workflows"},
		{handler: handleGetWorkflowqueue, path: "/api/v1/workflows/queue"},
		{handler: handleGetWorkflowqueueConfirm, path: "/api/v1/workflows/queue/confirm"},
		{handler: handleGetSchedules, path: "/api/v1/workflows/schedules"},
		{handler: loadSpecificWorkflows, path: "/api/v1/workflows/download_remote"},
		{handler: executeWorkflow, path: "/api/v1/workflows/123/execute"},
		{handler: scheduleWorkflow, path: "/api/v1/workflows/123/schedule"},
		{handler: stopSchedule, path: "/api/v1/workflows/123/schedule/abc"},
		// createOutlookSub generates nil pointer exception
		// {handler: createOutlookSub, path: "/api/v1/workflows/123/outlook"},
		// handleDeleteOutlookSub generates nil pointer exception
		// {handler: handleDeleteOutlookSub, path: "/api/v1/workflows/123/outlook/abc"},
		{handler: getWorkflowExecutions, path: "/api/v1/workflows/123/executions"},
		{handler: abortExecution, path: "/api/v1/workflows/123/executions/abc/abort"},
		{handler: getSpecificWorkflow, path: "/api/v1/workflows/123"},
		{handler: saveWorkflow, path: "/api/v1/workflows/123"},
		{handler: deleteWorkflow, path: "/api/v1/workflows/123"},

		{handler: handleNewHook, path: "/api/v1/hooks/new"},
		{handler: handleWebhookCallback, path: "/api/v1/hooks/123"},
		{handler: handleDeleteHook, path: "/api/v1/hooks/123/delete"},

		{handler: handleGetSpecificTrigger, path: "/api/v1/triggers/123"},
		{handler: handleGetSpecificStats, path: "/api/v1/stats/123"},

		{handler: verifySwagger, path: "/api/v1/verify_swagger"},
		{handler: verifySwagger, path: "/api/v1/verify_openapi"},
		{handler: echoOpenapiData, path: "/api/v1/get_openapi_uri"},
		{handler: echoOpenapiData, path: "/api/v1/validate_openapi"},
		{handler: validateSwagger, path: "/api/v1/validate_openapi"},
		{handler: getOpenapi, path: "/api/v1/get_openapi"},

		{handler: cleanupExecutions, path: "/api/v1/execution_cleanup"},
	}

	r := initHandlers(context.TODO())

outerLoop:
	for _, e := range handlers {
		req, err := http.NewRequest("OPTIONS", e.path, nil)
		req.Header.Add("Origin", "http://localhost:3000")
		req.Header.Add("Access-Control-Request-Method", "POST")
		req.Header.Add("Access-Control-Request-Headers", "Content-Type, Accept, X-Requested-With, remember-me")

		// OPTIONS /resource/foo
		// Access-Control-Request-Method: DELETE
		// Access-Control-Request-Headers: origin, x-requested-with
		// Origin: https://foo.bar.org

		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()

		timeoutHandler := http.TimeoutHandler(r, 2*time.Second, `Request Timeout`)
		timeoutHandler.ServeHTTP(rr, req)

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
