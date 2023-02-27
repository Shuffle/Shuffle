package main

import (
	uuid "github.com/satori/go.uuid"
	"github.com/shuffle/shuffle-shared"

	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"crypto/md5"
	"strconv"

	//"crypto/tls"
	//"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"

	//"regexp"
	"strings"
	"time"

	// Google cloud
	"cloud.google.com/go/datastore"
	"cloud.google.com/go/pubsub"
	"cloud.google.com/go/storage"
	"google.golang.org/appengine/mail"

	//"github.com/elastic/go-elasticsearch/v7"
	//"github.com/elastic/go-elasticsearch/v8/esapi"

	"github.com/frikky/kin-openapi/openapi2"
	"github.com/frikky/kin-openapi/openapi2conv"
	"github.com/frikky/kin-openapi/openapi3"

	/*
		"github.com/frikky/kin-openapi/openapi2"
		"github.com/frikky/kin-openapi/openapi2conv"
		"github.com/frikky/kin-openapi/openapi3"
	*/

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/storage/memory"

	//cv "github.com/nirasan/go-oauth-pkce-code-verifier"

	//githttp "gopkg.in/src-d/go-git.v4/plumbing/transport/http"

	// Random
	xj "github.com/basgys/goxml2json"
	newscheduler "github.com/carlescere/scheduler"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v3"

	// PROXY overrides
	//"gopkg.in/src-d/go-git.v4/plumbing/transport/client"
	// githttp "gopkg.in/src-d/go-git.v4/plumbing/transport/http"

	// Web
	"github.com/gorilla/mux"
	"google.golang.org/api/option"
	"google.golang.org/grpc"
	http2 "gopkg.in/src-d/go-git.v4/plumbing/transport/http"
)

// This is used to handle onprem vs offprem databases etc
var gceProject = "shuffle"
var bucketName = "shuffler.appspot.com"
var baseAppPath = "/home/frikky/git/shaffuru/tmp/apps"
var baseDockerName = "frikky/shuffle"
var registryName = "registry.hub.docker.com"
var runningEnvironment = "onprem"

var syncUrl = "https://shuffler.io"

// var syncUrl = "http://localhost:5002"
var syncSubUrl = "https://shuffler.io"

//var syncUrl = "http://localhost:5002"
//var syncSubUrl = "https://050196912a9d.ngrok.io"

var dbclient *datastore.Client

type Userapi struct {
	Username string `datastore:"username"`
	ApiKey   string `datastore:"apikey"`
}

type ExecutionInfo struct {
	TotalApiUsage           int64 `json:"total_api_usage" datastore:"total_api_usage"`
	TotalWorkflowExecutions int64 `json:"total_workflow_executions" datastore:"total_workflow_executions"`
	TotalAppExecutions      int64 `json:"total_app_executions" datastore:"total_app_executions"`
	TotalCloudExecutions    int64 `json:"total_cloud_executions" datastore:"total_cloud_executions"`
	TotalOnpremExecutions   int64 `json:"total_onprem_executions" datastore:"total_onprem_executions"`
	DailyApiUsage           int64 `json:"daily_api_usage" datastore:"daily_api_usage"`
	DailyWorkflowExecutions int64 `json:"daily_workflow_executions" datastore:"daily_workflow_executions"`
	DailyAppExecutions      int64 `json:"daily_app_executions" datastore:"daily_app_executions"`
	DailyCloudExecutions    int64 `json:"daily_cloud_executions" datastore:"daily_cloud_executions"`
	DailyOnpremExecutions   int64 `json:"daily_onprem_executions" datastore:"daily_onprem_executions"`
}

// "Execution by status"
// Execution history
//type GlobalStatistics struct {
//	BackendExecutions     int64            `json:"backend_executions" datastore:"backend_executions"`
//	WorkflowCount         int64            `json:"workflow_count" datastore:"workflow_count"`
//	ExecutionCount        int64            `json:"execution_count" datastore:"execution_count"`
//	ExecutionSuccessCount int64            `json:"execution_success_count" datastore:"execution_success_count"`
//	ExecutionAbortCount   int64            `json:"execution_abort_count" datastore:"execution_abort_count"`
//	ExecutionFailureCount int64            `json:"execution_failure_count" datastore:"execution_failure_count"`
//	ExecutionPendingCount int64            `json:"execution_pending_count" datastore:"execution_pending_count"`
//	AppUsageCount         int64            `json:"app_usage_count" datastore:"app_usage_count"`
//	TotalAppsCount        int64            `json:"total_apps_count" datastore:"total_apps_count"`
//	SelfMadeAppCount      int64            `json:"self_made_app_count" datastore:"self_made_app_count"`
//	WebhookUsageCount     int64            `json:"webhook_usage_count" datastore:"webhook_usage_count"`
//	Baseline              map[string]int64 `json:"baseline" datastore:"baseline"`
//}

type ParsedOpenApi struct {
	Body    string `datastore:"body,noindex" json:"body"`
	ID      string `datastore:"id" json:"id"`
	Success bool   `datastore:"success,omitempty" json:"success,omitempty"`
}

// Limits set for a user so that they can't do a shitload
type UserLimits struct {
	DailyApiUsage           int64 `json:"daily_api_usage" datastore:"daily_api_usage"`
	DailyWorkflowExecutions int64 `json:"daily_workflow_executions" datastore:"daily_workflow_executions"`
	DailyCloudExecutions    int64 `json:"daily_cloud_executions" datastore:"daily_cloud_executions"`
	DailyTriggers           int64 `json:"daily_triggers" datastore:"daily_triggers"`
	DailyMailUsage          int64 `json:"daily_mail_usage" datastore:"daily_mail_usage"`
	MaxTriggers             int64 `json:"max_triggers" datastore:"max_triggers"`
	MaxWorkflows            int64 `json:"max_workflows" datastore:"max_workflows"`
}

type retStruct struct {
	Success         bool                 `json:"success"`
	SyncFeatures    shuffle.SyncFeatures `json:"sync_features"`
	SessionKey      string               `json:"session_key"`
	IntervalSeconds int64                `json:"interval_seconds"`
	Reason          string               `json:"reason"`
}

// Saves some data, not sure what to have here lol
type UserAuth struct {
	Description string          `json:"description" datastore:"description,noindex" yaml:"description"`
	Name        string          `json:"name" datastore:"name" yaml:"name"`
	Workflows   []string        `json:"workflows" datastore:"workflows"`
	Username    string          `json:"username" datastore:"username"`
	Fields      []UserAuthField `json:"fields" datastore:"fields"`
}

type UserAuthField struct {
	Key   string `json:"key" datastore:"key"`
	Value string `json:"value" datastore:"value,noindex"`
}

// Not environment, but execution environment
//type Environment struct {
//	Name       string `datastore:"name"`
//	Type       string `datastore:"type"`
//	Registered bool   `datastore:"registered"`
//	Default    bool   `datastore:"default" json:"default"`
//	Archived   bool   `datastore:"archived" json:"archived"`
//	Id         string `datastore:"id" json:"id"`
//	OrgId      string `datastore:"org_id" json:"org_id"`
//}

// timeout maybe? idk
type session struct {
	Username string `datastore:"Username,noindex"`
	Id       string `datastore:"Id,noindex"`
	Session  string `datastore:"session,noindex"`
}

type loginStruct struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Contact struct {
	Firstname   string `json:"firstname"`
	Lastname    string `json:"lastname"`
	Title       string `json:"title"`
	Companyname string `json:"companyname"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Message     string `json:"message"`
}

type Translator struct {
	Src struct {
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value,noindex"`
		Description string `json:"description" datastore:"description,noindex"`
		Required    string `json:"required" datastore:"required"`
		Type        string `json:"type" datastore:"type"`
		Schema      struct {
			Type string `json:"type" datastore:"type"`
		} `json:"schema" datastore:"schema"`
	} `json:"src" datastore:"src"`
	Dst struct {
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value,noindex"`
		Type        string `json:"type" datastore:"type"`
		Description string `json:"description" datastore:"description,noindex"`
		Required    string `json:"required" datastore:"required"`
		Schema      struct {
			Type string `json:"type" datastore:"type"`
		} `json:"schema" datastore:"schema"`
	} `json:"dst" datastore:"dst"`
}

type Appconfig struct {
	Key   string `json:"key" datastore:"key"`
	Value string `json:"value" datastore:"value,noindex"`
}

type ScheduleApp struct {
	Foldername  string      `json:"foldername" datastore:"foldername,noindex"`
	Name        string      `json:"name" datastore:"name,noindex"`
	Id          string      `json:"id" datastore:"id,noindex"`
	Description string      `json:"description" datastore:"description,noindex"`
	Action      string      `json:"action" datastore:"action,noindex"`
	Config      []Appconfig `json:"config,omitempty" datastore:"config,noindex"`
}

type AppInfo struct {
	SourceApp      ScheduleApp `json:"sourceapp,omitempty" datastore:"sourceapp,noindex"`
	DestinationApp ScheduleApp `json:"destinationapp,omitempty" datastore:"destinationapp,noindex"`
}

// May 2020: Reused for onprem schedules - Id, Seconds, WorkflowId and argument
type ScheduleOld struct {
	Id                   string       `json:"id" datastore:"id"`
	StartNode            string       `json:"start_node" datastore:"start_node"`
	Seconds              int          `json:"seconds" datastore:"seconds"`
	WorkflowId           string       `json:"workflow_id" datastore:"workflow_id", `
	Argument             string       `json:"argument" datastore:"argument"`
	WrappedArgument      string       `json:"wrapped_argument" datastore:"wrapped_argument"`
	AppInfo              AppInfo      `json:"appinfo" datastore:"appinfo,noindex"`
	Finished             bool         `json:"finished" finished:"id"`
	BaseAppLocation      string       `json:"base_app_location" datastore:"baseapplocation,noindex"`
	Translator           []Translator `json:"translator,omitempty" datastore:"translator"`
	Org                  string       `json:"org" datastore:"org"`
	CreatedBy            string       `json:"createdby" datastore:"createdby"`
	Availability         string       `json:"availability" datastore:"availability"`
	CreationTime         int64        `json:"creationtime" datastore:"creationtime,noindex"`
	LastModificationtime int64        `json:"lastmodificationtime" datastore:"lastmodificationtime,noindex"`
	LastRuntime          int64        `json:"lastruntime" datastore:"lastruntime,noindex"`
	Frequency            string       `json:"frequency" datastore:"frequency,noindex"`
	Environment          string       `json:"environment" datastore:"environment"`
}

// Returned from /GET /schedules
type Schedules struct {
	Schedules []ScheduleOld `json:"schedules"`
	Success   bool          `json:"success"`
}

type ScheduleApps struct {
	Apps    []ApiYaml `json:"apps"`
	Success bool      `json:"success"`
}

// The yaml that is uploaded
type ApiYaml struct {
	Name        string `json:"name" yaml:"name" required:"true datastore:"name"`
	Foldername  string `json:"foldername" yaml:"foldername" required:"true datastore:"foldername"`
	Id          string `json:"id" yaml:"id",required:"true, datastore:"id"`
	Description string `json:"description" datastore:"description,noindex" yaml:"description"`
	AppVersion  string `json:"app_version" yaml:"app_version",datastore:"app_version"`
	ContactInfo struct {
		Name string `json:"name" datastore:"name" yaml:"name"`
		Url  string `json:"url" datastore:"url" yaml:"url"`
	} `json:"contact_info" datastore:"contact_info" yaml:"contact_info"`
	Types []string `json:"types" datastore:"types" yaml:"types"`
	Input []struct {
		Name            string `json:"name" datastore:"name" yaml:"name"`
		Description     string `json:"description" datastore:"description,noindex" yaml:"description"`
		InputParameters []struct {
			Name        string `json:"name" datastore:"name" yaml:"name"`
			Description string `json:"description" datastore:"description,noindex" yaml:"description"`
			Required    string `json:"required" datastore:"required" yaml:"required"`
			Schema      struct {
				Type string `json:"type" datastore:"type" yaml:"type"`
			} `json:"schema" datastore:"schema" yaml:"schema"`
		} `json:"inputparameters" datastore:"inputparameters" yaml:"inputparameters"`
		OutputParameters []struct {
			Name        string `json:"name" datastore:"name" yaml:"name"`
			Description string `json:"description" datastore:"description,noindex" yaml:"description"`
			Required    string `json:"required" datastore:"required" yaml:"required"`
			Schema      struct {
				Type string `json:"type" datastore:"type" yaml:"type"`
			} `json:"schema" datastore:"schema" yaml:"schema"`
		} `json:"outputparameters" datastore:"outputparameters" yaml:"outputparameters"`
		Config []struct {
			Name        string `json:"name" datastore:"name" yaml:"name"`
			Description string `json:"description" datastore:"description,noindex" yaml:"description"`
			Required    string `json:"required" datastore:"required" yaml:"required"`
			Schema      struct {
				Type string `json:"type" datastore:"type" yaml:"type"`
			} `json:"schema" datastore:"schema" yaml:"schema"`
		} `json:"config" datastore:"config" yaml:"config"`
	} `json:"input" datastore:"input" yaml:"input"`
	Output []struct {
		Name        string `json:"name" datastore:"name" yaml:"name"`
		Description string `json:"description" datastore:"description,noindex" yaml:"description"`
		Config      []struct {
			Name        string `json:"name" datastore:"name" yaml:"name"`
			Description string `json:"description" datastore:"description,noindex" yaml:"description"`
			Required    string `json:"required" datastore:"required" yaml:"required"`
			Schema      struct {
				Type string `json:"type" datastore:"type" yaml:"type"`
			} `json:"schema" datastore:"schema" yaml:"schema"`
		} `json:"config" datastore:"config" yaml:"config"`
		InputParameters []struct {
			Name        string `json:"name" datastore:"name" yaml:"name"`
			Description string `json:"description" datastore:"description,noindex" yaml:"description"`
			Required    string `json:"required" datastore:"required" yaml:"required"`
			Schema      struct {
				Type string `json:"type" datastore:"type" yaml:"type"`
			} `json:"schema" datastore:"schema" yaml:"schema"`
		} `json:"inputparameters" datastore:"inputparameters" yaml:"inputparameters"`
		OutputParameters []struct {
			Name        string `json:"name" datastore:"name" yaml:"name"`
			Description string `json:"description" datastore:"description,noindex" yaml:"description"`
			Required    string `json:"required" datastore:"required" yaml:"required"`
			Schema      struct {
				Type string `json:"type" datastore:"type" yaml:"type"`
			} `json:"schema" datastore:"schema" yaml:"schema"`
		} `json:"outputparameters" datastore:"outputparameters" yaml:"outputparameters"`
	} `json:"output" datastore:"output" yaml:"output"`
}

type Hooks struct {
	Hooks   []Hook `json:"hooks"`
	Success bool   `json:"-"`
}

type Info struct {
	Url         string `json:"url" datastore:"url"`
	Name        string `json:"name" datastore:"name"`
	Description string `json:"description" datastore:"description,noindex"`
}

// Actions to be done by webhooks etc
// Field is the actual field to use from json
type HookAction struct {
	Type  string `json:"type" datastore:"type"`
	Name  string `json:"name" datastore:"name"`
	Id    string `json:"id" datastore:"id"`
	Field string `json:"field" datastore:"field"`
}

type Hook struct {
	Id          string       `json:"id" datastore:"id"`
	Start       string       `json:"start" datastore:"start"`
	Info        Info         `json:"info" datastore:"info"`
	Actions     []HookAction `json:"actions" datastore:"actions,noindex"`
	Type        string       `json:"type" datastore:"type"`
	Owner       string       `json:"owner" datastore:"owner"`
	Status      string       `json:"status" datastore:"status"`
	Workflows   []string     `json:"workflows" datastore:"workflows"`
	Running     bool         `json:"running" datastore:"running"`
	OrgId       string       `json:"org_id" datastore:"org_id"`
	Environment string       `json:"environment" datastore:"environment"`
}

func createFileFromFile(ctx context.Context, bucket *storage.BucketHandle, remotePath, localPath string) error {
	// [START upload_file]
	f, err := os.Open(localPath)
	if err != nil {
		return err
	}
	defer f.Close()

	wc := bucket.Object(remotePath).NewWriter(ctx)
	if _, err = io.Copy(wc, f); err != nil {
		return err
	}
	if err := wc.Close(); err != nil {
		return err
	}
	// [END upload_file]
	return nil
}

func createFileFromBytes(ctx context.Context, bucket *storage.BucketHandle, remotePath string, data []byte) error {
	wc := bucket.Object(remotePath).NewWriter(ctx)

	byteReader := bytes.NewReader(data)
	if _, err := io.Copy(wc, byteReader); err != nil {
		return err
	}

	if err := wc.Close(); err != nil {
		return err
	}

	// [END upload_file]
	return nil
}

func readFile(ctx context.Context, bucket *storage.BucketHandle, object string) ([]byte, error) {
	// [START download_file]
	rc, err := bucket.Object(object).NewReader(ctx)
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	data, err := ioutil.ReadAll(rc)
	if err != nil {
		return nil, err
	}
	return data, nil
	// [END download_file]
}

func IndexHandler(entrypoint string) func(w http.ResponseWriter, r *http.Request) {
	fn := func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, entrypoint)
	}

	return http.HandlerFunc(fn)
}

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"id": "12345",
		"ts": time.Now().Format(time.RFC3339),
	}

	b, err := json.Marshal(data)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	w.Write(b)
}

func jsonPrettyPrint(in string) string {
	var out bytes.Buffer
	err := json.Indent(&out, []byte(in), "", "\t")
	if err != nil {
		return in
	}
	return out.String()
}

// Does User exist?
// Does User have permission to view / run this?
// Encoding: /json?
// General authentication
func authenticate(request *http.Request) bool {
	authField := "authorization"
	authenticationKey := "topkek"
	//authFound := false

	// This should work right?
	for name, headers := range request.Header {
		name = strings.ToLower(name)
		for _, h := range headers {
			if name == authField && h == authenticationKey {
				//log.Printf("%v: %v", name, h)
				return true
			}
		}
	}

	return false
}

func publishPubsub(ctx context.Context, topic string, data []byte, attributes map[string]string) error {
	client, err := pubsub.NewClient(ctx, gceProject)
	if err != nil {
		return err
	}

	t := client.Topic(topic)
	result := t.Publish(ctx, &pubsub.Message{
		Data:       data,
		Attributes: attributes,
	})
	// Block until the result is returned and a server-generated
	// ID is returned for the published message.
	id, err := result.Get(ctx)
	if err != nil {
		return err
	}

	log.Printf("Published message for topic %s; msg ID: %v\n", topic, id)

	return nil
}

func checkError(cmdName string, cmdArgs []string) error {
	cmd := exec.Command(cmdName, cmdArgs...)
	cmdReader, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error creating StdoutPipe for Cmd", err)
		return err
	}

	scanner := bufio.NewScanner(cmdReader)
	go func() {
		for scanner.Scan() {
			fmt.Printf("Out: %s\n", scanner.Text())
		}
	}()

	err = cmd.Start()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error starting Cmd", err)
		return err
	}

	err = cmd.Wait()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error waiting for Cmd", err)
		return err
	}

	return nil
}

func md5sum(data []byte) string {
	hasher := md5.New()
	hasher.Write(data)
	newmd5 := hex.EncodeToString(hasher.Sum(nil))
	return newmd5
}

func md5sumfile(filepath string) string {
	dat, err := ioutil.ReadFile(filepath)
	if err != nil {
		log.Printf("Error in dat: %s", err)
	}

	hasher := md5.New()
	hasher.Write(dat)
	newmd5 := hex.EncodeToString(hasher.Sum(nil))

	log.Printf("%s: %s", filepath, newmd5)
	return newmd5
}

func checkFileExistsLocal(basepath string, filepath string) bool {
	User := "test"
	// md5sum
	// get tmp/results/md5sum/folder/results.json
	// parse /tmp/results/md5sum/results.json
	path := fmt.Sprintf("%s/%s", basepath, md5sumfile(filepath))
	if _, err := os.Stat(path); os.IsNotExist(err) {
		//log.Printf("File error for %s: %s", filepath, err)
		return false
	}

	log.Printf("File %s exists. Getting for User %s.", filepath, User)
	return true
}

func redirect(w http.ResponseWriter, req *http.Request) {
	// remove/add not default ports from req.Host
	target := "https://" + req.Host + req.URL.Path
	if len(req.URL.RawQuery) > 0 {
		target += "?" + req.URL.RawQuery
	}
	log.Printf("redirect to: %s", target)
	http.Redirect(w, req, target,
		// see @andreiavrammsd comment: often 307 > 301
		http.StatusTemporaryRedirect)
}

// No more emails :)
func checkUsername(Username string) error {
	// Stupid first check of email loool
	//if !strings.Contains(Username, "@") || !strings.Contains(Username, ".") {
	//	return errors.New("Invalid Username")
	//}

	if len(Username) < 3 {
		return errors.New("Minimum Username length is 3")
	}

	return nil
}

func createNewUser(username, password, role, apikey string, org shuffle.OrgMini) error {
	// Returns false if there is an issue
	// Use this for register
	err := shuffle.CheckPasswordStrength(password)
	if err != nil {
		log.Printf("[WARNING] Bad password strength: %s", err)
		return err
	}

	err = checkUsername(username)
	if err != nil {
		log.Printf("[WARNING] Bad Username strength: %s", err)
		return err
	}

	ctx := context.Background()
	//users, err := FindUser(ctx context.Context, username string) ([]User, error) {

	users, err := shuffle.FindUser(ctx, strings.ToLower(strings.TrimSpace(username)))
	if err != nil && len(users) == 0 {
		log.Printf("[WARNING] Failed getting user %s: %s", username, err)
		return err
	}

	if len(users) > 0 {
		return errors.New(fmt.Sprintf("Username %s already exists", username))
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 8)
	if err != nil {
		log.Printf("Wrong password for %s: %s", username, err)
		return err
	}

	newUser := new(shuffle.User)
	newUser.Username = username
	newUser.Password = string(hashedPassword)
	newUser.Verified = false
	newUser.CreationTime = time.Now().Unix()
	newUser.Active = true
	newUser.Orgs = []string{org.Id}

	// FIXME - Remove this later
	if role == "admin" {
		newUser.Role = "admin"
		newUser.Roles = []string{"admin"}
	} else {
		newUser.Role = "user"
		newUser.Roles = []string{"user"}
	}

	newUser.ActiveOrg = shuffle.OrgMini{
		Id:   org.Id,
		Name: org.Name,
	}

	if len(apikey) > 0 {
		newUser.ApiKey = apikey
	}

	// set limits
	newUser.Limits.DailyApiUsage = 100
	newUser.Limits.DailyWorkflowExecutions = 1000
	newUser.Limits.DailyCloudExecutions = 100
	newUser.Limits.DailyTriggers = 20
	newUser.Limits.DailyMailUsage = 100
	newUser.Limits.MaxTriggers = 10
	newUser.Limits.MaxWorkflows = 10

	// Set base info for the user
	newUser.Executions.TotalApiUsage = 0
	newUser.Executions.TotalWorkflowExecutions = 0
	newUser.Executions.TotalAppExecutions = 0
	newUser.Executions.TotalCloudExecutions = 0
	newUser.Executions.TotalOnpremExecutions = 0
	newUser.Executions.DailyApiUsage = 0
	newUser.Executions.DailyWorkflowExecutions = 0
	newUser.Executions.DailyAppExecutions = 0
	newUser.Executions.DailyCloudExecutions = 0
	newUser.Executions.DailyOnpremExecutions = 0

	verifyToken := uuid.NewV4()
	ID := uuid.NewV4()
	newUser.Id = ID.String()
	newUser.VerificationToken = verifyToken.String()

	err = shuffle.SetUser(ctx, newUser, true)
	if err != nil {
		log.Printf("[ERROR] Problem adding User %s: %s", username, err)
		return err
	}

	neworg, err := shuffle.GetOrg(ctx, org.Id)
	if err == nil {
		//neworg.Users = append(neworg.Users, *newUser)
		for tutorialIndex, tutorial := range neworg.Tutorials {
			if tutorial.Name == "Invite teammates" {
				neworg.Tutorials[tutorialIndex].Description = fmt.Sprintf("%d users are in your org. Org name and Image change next.", len(neworg.Users))
				if len(neworg.Users) > 0 {
					neworg.Tutorials[tutorialIndex].Done = true
					neworg.Tutorials[tutorialIndex].Link = "/admin"
				}

				break
			}
		}

		err = shuffle.SetOrg(ctx, *neworg, neworg.Id)
		if err != nil {
			log.Printf("Failed updating org with user %s", newUser.Username)
		} else {
			log.Printf("[INFO] Successfully updated org with user %s!", newUser.Username)
		}
	}

	//err = increaseStatisticsField(ctx, "successful_register", username, 1, org.Id)
	//if err != nil {
	//	log.Printf("Failed to increase total apps loaded stats: %s", err)
	//}

	return nil
}

func handleRegister(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Only admin can CREATE users, but if there are no users, anyone can make (first)
	ctx := context.Background()
	users, countErr := shuffle.GetAllUsers(ctx)

	count := len(users)
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		if (countErr == nil && count > 0) || countErr != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Users already exist. Please go to /login to log into your admin user."}`))
			return
		}
	}

	apikey := ""
	if count != 0 {
		if user.Role != "admin" {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Can't register without being admin (2)"}`))
			return
		}
	} else {
		apikey = uuid.NewV4().String()
	}

	// Gets a struct of Username, password
	data, err := shuffle.ParseLoginParameters(resp, request)
	if err != nil {
		log.Printf("Invalid params: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	role := "user"
	if count == 0 {
		role = "admin"
	}

	currentOrg := user.ActiveOrg
	if user.ActiveOrg.Id == "" {
		log.Printf("[WARNING] There's no active org for the user %s. Checking if there's a single one to assing it to.", user.Username)

		orgs, err := shuffle.GetAllOrgs(ctx)
		if err == nil && len(orgs) > 0 {
			log.Printf("[WARNING] No org exists for user %s. Setting to default (first one)", user.Username)
			currentOrg = shuffle.OrgMini{
				Id:   orgs[0].Id,
				Name: orgs[0].Name,
			}
		} else {
			log.Printf("[WARNING] Couldn't find an org to attach to. Create?")

			orgSetupName := "default"
			orgId := uuid.NewV4().String()
			newOrg := shuffle.Org{
				Name:      orgSetupName,
				Id:        orgId,
				Org:       orgSetupName,
				Users:     []shuffle.User{},
				Roles:     []string{"admin", "user"},
				CloudSync: false,
			}

			err = shuffle.SetOrg(ctx, newOrg, orgId)
			if err != nil {
				log.Printf("[WARNING] Failed setting init organization: %s", err)
			} else {
				log.Printf("[DEBUG] Successfully created the default org!")

				defaultEnv := os.Getenv("ORG_ID")
				if len(defaultEnv) == 0 {
					defaultEnv = "Shuffle"
					log.Printf("[DEBUG] Setting default environment for org to %s", defaultEnv)
				}

				item := shuffle.Environment{
					Name:    defaultEnv,
					Type:    "onprem",
					OrgId:   orgId,
					Default: true,
					Id:      uuid.NewV4().String(),
				}

				err = shuffle.SetEnvironment(ctx, &item)
				if err != nil {
					log.Printf("[WARNING] Failed setting up new environment for new org: %s", err)
				}

				currentOrg = shuffle.OrgMini{
					Id:   newOrg.Id,
					Name: newOrg.Name,
				}
			}
		}
	}

	err = createNewUser(data.Username, data.Password, role, apikey, currentOrg)
	if err != nil {
		log.Printf("[WARNING] Failed registering user: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "apikey": "%s"}`, apikey)))
	log.Printf("[INFO] %s Successfully registered.", data.Username)
}

func handleCookie(request *http.Request) bool {
	c, err := request.Cookie("session_token")
	if err != nil {
		return false
	}

	if len(c.Value) == 0 {
		return false
	}

	return true
}

// Returns whether the user is logged in or not etc.
// Also has more data about the user and org
func handleInfo(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	userInfo, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[WARNING] Api authentication failed in handleInfo: %s", err)

		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()

	// This is a long check to see if an inactive admin can access the site
	parsedAdmin := "false"
	if userInfo.Role == "admin" {
		parsedAdmin = "true"
	}

	if !userInfo.Active {
		if userInfo.Role == "admin" {
			parsedAdmin = "true"

			ctx := context.Background()
			users, err := shuffle.GetAllUsers(ctx)
			if err != nil {
				resp.WriteHeader(401)
				resp.Write([]byte(`{"success": false, "reason": "Failed to get other users when verifying admin user"}`))
				return
			}

			activeFound := false
			adminFound := false
			for _, user := range users {
				if user.Id == userInfo.Id {
					continue
				}

				if user.Role != "admin" {
					continue
				}

				if user.Active {
					activeFound = true
				}

				adminFound = true
			}

			// Must ALWAYS be an active admin
			// Will return no access if another admin is active
			if !adminFound {
				log.Printf("NO OTHER ADMINS FOUND - CONTINUE!")
			} else {
				//
				if activeFound {
					log.Printf("OTHER ACTIVE ADMINS FOUND - CAN'T PASS")
					resp.WriteHeader(401)
					resp.Write([]byte(`{"success": false, "reason": "This user is locked"}`))
					return
				} else {
					log.Printf("NO OTHER ADMINS FOUND - CONTINUE!")
				}
			}
		} else {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "This user is locked"}`))
			return
		}
	}

	//log.Printf("%s  %s", session.Session, UserInfo.Session)
	//if session.Session != userInfo.Session {
	//	log.Printf("Session %s is not the same as %s for %s. %s", userInfo.Session, session.Session, userInfo.Username, err)
	//	resp.WriteHeader(401)
	//	resp.Write([]byte(`{"success": false, "reason": ""}`))
	//	return
	//}

	expiration := time.Now().Add(3600 * time.Second)
	http.SetCookie(resp, &http.Cookie{
		Name:    "session_token",
		Value:   userInfo.Session,
		Expires: expiration,
	})

	// Updating user info if there's something wrong
	if (len(userInfo.ActiveOrg.Name) == 0 || len(userInfo.ActiveOrg.Id) == 0) && len(userInfo.Orgs) > 0 {
		_, err := shuffle.GetOrg(ctx, userInfo.Orgs[0])
		if err != nil {
			orgs, err := shuffle.GetAllOrgs(ctx)
			if err == nil {
				newStringOrgs := []string{}
				newOrgs := []shuffle.Org{}
				for _, org := range orgs {
					if strings.ToLower(org.Name) == strings.ToLower(userInfo.Orgs[0]) {
						newOrgs = append(newOrgs, org)
						newStringOrgs = append(newStringOrgs, org.Id)
					}
				}

				if len(newOrgs) > 0 {
					userInfo.ActiveOrg = shuffle.OrgMini{
						Id:   newOrgs[0].Id,
						Name: newOrgs[0].Name,
					}

					userInfo.Orgs = newStringOrgs

					err = shuffle.SetUser(ctx, &userInfo, true)
					if err != nil {
						log.Printf("Error patching User for activeOrg: %s", err)
					} else {
						log.Printf("Updated the users' org")
					}
				}
			} else {
				log.Printf("Failed getting orgs for user. Major issue.: %s", err)
			}

		} else {
			// 1. Check if the org exists by ID
			// 2. if it does, overwrite user
			userInfo.ActiveOrg = shuffle.OrgMini{
				Id: userInfo.Orgs[0],
			}
			err = shuffle.SetUser(ctx, &userInfo, true)
			if err != nil {
				log.Printf("[INFO] Error patching User for activeOrg: %s", err)
			}
		}
	}

	org, err := shuffle.GetOrg(ctx, userInfo.ActiveOrg.Id)
	//if err == nil {
	if len(org.Id) > 0 {
		userInfo.ActiveOrg = shuffle.OrgMini{
			Id:         org.Id,
			Name:       org.Name,
			CreatorOrg: org.CreatorOrg,
			Role:       userInfo.ActiveOrg.Role,
			Image:      org.Image,
		}
	}
	//}

	userInfo.ActiveOrg.Users = []shuffle.UserMini{}
	userOrgs := []shuffle.OrgMini{}
	for _, item := range userInfo.Orgs {
		if item == userInfo.ActiveOrg.Id {
			userOrgs = append(userOrgs, userInfo.ActiveOrg)
			continue
		}

		org, err := shuffle.GetOrg(ctx, item)
		_ = err
		if len(org.Id) > 0 {
			userOrgs = append(userOrgs, shuffle.OrgMini{
				Id:         org.Id,
				Name:       org.Name,
				CreatorOrg: org.CreatorOrg,
				Image:      org.Image,
			})
		} else {
			log.Printf("[WARNING] Failed to get org %s for user %s", item, userInfo.Username)
		}
	}

	// FIXME: This is bad, but we've had a lot of bugs with edit users, and this is the quick fix.
	if userInfo.Role == "" && userInfo.ActiveOrg.Role == "" && parsedAdmin == "false" {
		userInfo.Role = "admin"
		userInfo.ActiveOrg.Role = "admin"
		parsedAdmin = "true"

		err = shuffle.SetUser(ctx, &userInfo, true)
		if err != nil {
			log.Printf("[WARNING] Automatically asigning user as admin to their org because they don't have a role at all failed: %s", err)
			resp.WriteHeader(500)
			resp.Write([]byte(`{"success": false}`))
			return
		} else {
			log.Printf("[DEBUG] Made user %s org-admin as they didn't have any role specified", err)

		}
	}

	chatDisabled := false
	if os.Getenv("SHUFFLE_CHAT_DISABLED") == "true" {
		chatDisabled = true
	}

	userOrgs = shuffle.SortOrgList(userOrgs)
	orgPriorities := org.Priorities
	if len(org.Priorities) < 5 {
		log.Printf("[WARNING] Should find and add priorities as length is less than 5 for org %s", userInfo.ActiveOrg.Id)
		newPriorities, err := shuffle.GetPriorities(ctx, userInfo, org)
		if err != nil {
			log.Printf("[WARNING] Failed getting new priorities for org %s: %s", org.Id, err)
			//orgPriorities = []shuffle.Priority{}
		} else {
			orgPriorities = newPriorities
		}
	}

	tutorialsFinished := []shuffle.Tutorial{}
	for _, tutorial := range userInfo.PersonalInfo.Tutorials {
		tutorialsFinished = append(tutorialsFinished, shuffle.Tutorial{
			Name: tutorial,
		})
	}

	if len(org.SecurityFramework.SIEM.Name) > 0 || len(org.SecurityFramework.Network.Name) > 0 || len(org.SecurityFramework.EDR.Name) > 0 || len(org.SecurityFramework.Cases.Name) > 0 || len(org.SecurityFramework.IAM.Name) > 0 || len(org.SecurityFramework.Assets.Name) > 0 || len(org.SecurityFramework.Intel.Name) > 0 || len(org.SecurityFramework.Communication.Name) > 0 {
		tutorialsFinished = append(tutorialsFinished, shuffle.Tutorial{
			Name: "find_integrations",
		})
	}

	for _, tutorial := range org.Tutorials {
		tutorialsFinished = append(tutorialsFinished, tutorial)
	}

	returnValue := shuffle.HandleInfo{
		Success:   true,
		Username:  userInfo.Username,
		Admin:     parsedAdmin,
		Id:        userInfo.Id,
		Orgs:      userOrgs,
		ActiveOrg: userInfo.ActiveOrg,
		Cookies: []shuffle.SessionCookie{
			shuffle.SessionCookie{
				Key:        "session_token",
				Value:      userInfo.Session,
				Expiration: expiration.Unix(),
			},
		},
		EthInfo:      userInfo.EthInfo,
		ChatDisabled: chatDisabled,
		Tutorials:    tutorialsFinished,

		Priorities: orgPriorities,
	}

	returnData, err := json.Marshal(returnValue)
	if err != nil {
		log.Printf("[WARNING] Failed marshalling info in handleinfo: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(returnData))
}

type passwordReset struct {
	Password1 string `json:"newpassword"`
	Password2 string `json:"newpassword2"`
	Reference string `json:"reference"`
}

// This might be... a bit off, but that's fine :)
// This might also be stupid, as we want timelines and such
// Anyway, these are super basic stupid stats.
func increaseStatisticsField(ctx context.Context, fieldname, id string, amount int64, orgId string) error {

	// 1. Get current stats
	// 2. Increase field(s)
	// 3. Put new stats
	statisticsId := "global_statistics"
	nameKey := fieldname
	key := datastore.NameKey(statisticsId, nameKey, nil)

	statisticsItem := shuffle.StatisticsItem{}
	newData := shuffle.StatisticsData{
		Timestamp: int64(time.Now().Unix()),
		Amount:    amount,
		Id:        id,
	}

	if err := dbclient.Get(ctx, key, &statisticsItem); err != nil {
		// Should init
		if strings.Contains(fmt.Sprintf("%s", err), "entity") {
			statisticsItem = shuffle.StatisticsItem{
				Total:     amount,
				OrgId:     orgId,
				Fieldname: fieldname,
				Data: []shuffle.StatisticsData{
					newData,
				},
			}

			if _, err := dbclient.Put(ctx, key, &statisticsItem); err != nil {
				log.Printf("Error setting base stats: %s", err)
				return err
			}

			return nil
		}
		//log.Printf("STATSERR: %s", err)

		return err
	}

	statisticsItem.Total += amount
	statisticsItem.Data = append(statisticsItem.Data, newData)

	// New struct, to not add body, author etc
	// FIXME - reintroduce
	//if _, err := dbclient.Put(ctx, key, &statisticsItem); err != nil {
	//	log.Printf("Error stats to %s: %s", fieldname, err)
	//	return err
	//}

	//log.Printf("Stats: %#v", statisticsItem)

	return nil
}

// FIXME - forward this to emails or whatever CRM system in use
func handleContact(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	var t Contact
	err = json.Unmarshal(body, &t)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	if len(t.Email) < 3 || len(t.Message) == 0 {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Please fill a valid email and message"}`)))
		return
	}

	ctx := context.Background()
	mailContent := fmt.Sprintf("Firsname: %s\nLastname: %s\nTitle: %s\nCompanyname: %s\nPhone: %s\nEmail: %s\nMessage: %s", t.Firstname, t.Lastname, t.Title, t.Companyname, t.Phone, t.Email, t.Message)
	log.Printf("Sending contact from %s", t.Email)

	msg := &mail.Message{
		Sender:  "Shuffle <frikky@shuffler.io>",
		To:      []string{"frikky@shuffler.io"},
		Subject: "Shuffler.io - New contact form",
		Body:    mailContent,
	}

	if err := mail.Send(ctx, msg); err != nil {
		log.Printf("Couldn't send email: %v", err)
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "message": "Thanks for reaching out. We will contact you soon!"}`)))
}

func verifier() (*shuffle.CodeVerifier, error) {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, 32, 32)
	for i := 0; i < 32; i++ {
		b[i] = byte(r.Intn(255))
	}
	return shuffle.CreateCodeVerifierFromBytes(b)
}

func checkAdminLogin(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	ctx := context.Background()
	users, err := shuffle.GetAllUsers(ctx)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	count := len(users)

	if count == 0 {
		log.Printf("[WARNING] No users - redirecting for management user")
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "stay"}`)))
		return
	}

	baseSSOUrl := ""
	handled := []string{}
	for _, user := range users {
		if shuffle.ArrayContains(handled, user.ActiveOrg.Id) {
			continue
		}

		handled = append(handled, user.ActiveOrg.Id)
		org, err := shuffle.GetOrg(ctx, user.ActiveOrg.Id)
		if err != nil {
			log.Printf("[WARNING] Error getting org in admin check: %s", err)
			continue
		}

		// No childorg setup, only parent org
		if len(org.ManagerOrgs) > 0 || len(org.CreatorOrg) > 0 {
			continue
		}

		// Should run calculations
		if len(org.SSOConfig.OpenIdAuthorization) > 0 {
			baseSSOUrl = org.SSOConfig.OpenIdAuthorization

			codeChallenge := uuid.NewV4().String()
			//h.Write([]byte(v.Value))
			verifier, verifiererr := verifier()
			if verifiererr == nil {
				codeChallenge = verifier.Value
			}

			//log.Printf("[DEBUG] Got challenge value %s (pre state)", codeChallenge)

			// https://192.168.55.222:3443/api/v1/login_openid
			//location := strings.Split(request.URL.String(), "/")
			//redirectUrl := url.QueryEscape("http://localhost:5001/api/v1/login_openid")
			redirectUrl := url.QueryEscape(fmt.Sprintf("http://%s/api/v1/login_openid", request.Host))
			if strings.Contains(request.Host, "shuffle-backend") && !strings.Contains(os.Getenv("BASE_URL"), "shuffle-backend") {
				redirectUrl = url.QueryEscape(fmt.Sprintf("%s/api/v1/login_openid", os.Getenv("BASE_URL")))
			}

			if len(os.Getenv("SSO_REDIRECT_URL")) > 0 {
				redirectUrl = url.QueryEscape(fmt.Sprintf("%s/api/v1/login_openid", os.Getenv("SSO_REDIRECT_URL")))
			}

			state := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("org=%s&challenge=%s&redirect=%s", org.Id, codeChallenge, redirectUrl)))

			// has to happen after initial value is stored
			if verifiererr == nil {
				codeChallenge = verifier.CodeChallengeS256()
			}

			//log.Printf("[DEBUG] Got challenge value %s (POST state)", codeChallenge)

			if len(org.SSOConfig.OpenIdClientSecret) > 0 {

				//baseSSOUrl += fmt.Sprintf("?client_id=%s&response_type=code&scope=openid&redirect_uri=%s&state=%s&client_secret=%s", org.SSOConfig.OpenIdClientId, redirectUrl, state, org.SSOConfig.OpenIdClientSecret)
				state := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("org=%s&redirect=%s&challenge=%s", org.Id, redirectUrl, org.SSOConfig.OpenIdClientSecret)))
				log.Printf("URL: %s", redirectUrl)

				baseSSOUrl += fmt.Sprintf("?client_id=%s&response_type=id_token&scope=openid&redirect_uri=%s&state=%s&response_mode=form_post&nonce=%s", org.SSOConfig.OpenIdClientId, redirectUrl, state, state)
				//baseSSOUrl += fmt.Sprintf("&client_secret=%s", org.SSOConfig.OpenIdClientSecret)
				log.Printf("[DEBUG] Found OpenID url (client secret). Extra redirect check: %s - %s", request.URL.String(), baseSSOUrl)
			} else {
				log.Printf("[DEBUG] Found OpenID url (PKCE!!). Extra redirect check: %s", request.URL.String())
				baseSSOUrl += fmt.Sprintf("?client_id=%s&response_type=code&scope=openid&redirect_uri=%s&state=%s&code_challenge_method=S256&code_challenge=%s", org.SSOConfig.OpenIdClientId, redirectUrl, state, codeChallenge)
			}

			break
		}

		if len(org.SSOConfig.SSOEntrypoint) > 0 {
			log.Printf("[DEBUG] Found SAML SSO url: %s", org.SSOConfig.SSOEntrypoint)
			baseSSOUrl = org.SSOConfig.SSOEntrypoint
			break
		}
	}

	//log.Printf("[DEBUG] OpenID URL: %s", baseSSOUrl)
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "redirect", "sso_url": "%s"}`, baseSSOUrl)))
}

func fixOrgUser(ctx context.Context, org *shuffle.Org) *shuffle.Org {
	//found := false
	//for _, id := range user.Orgs {
	//	if user.ActiveOrg.Id == id {
	//		found = true
	//		break
	//	}
	//}

	//if !found {
	//	user.Orgs = append(user.Orgs, user.ActiveOrg.Id)
	//}

	//// Might be vulnerable to timing attacks.
	//for _, orgId := range user.Orgs {
	//	if len(orgId) == 0 {
	//		continue
	//	}

	//	org, err := shuffle.GetOrg(ctx, orgId)
	//	if err != nil {
	//		log.Printf("Error getting org %s", orgId)
	//		continue
	//	}

	//	orgIndex := 0
	//	userFound := false
	//	for index, orgUser := range org.Users {
	//		if orgUser.Id == user.Id {
	//			orgIndex = index
	//			userFound = true
	//			break
	//		}
	//	}

	//	if userFound {
	//		user.PrivateApps = []WorkflowApp{}
	//		user.Executions = ExecutionInfo{}
	//		user.Limits = UserLimits{}
	//		user.Authentication = []UserAuth{}

	//		org.Users[orgIndex] = *user
	//	} else {
	//		org.Users = append(org.Users, *user)
	//	}

	//	err = shuffle.SetOrg(ctx, *org, orgId)
	//	if err != nil {
	//		log.Printf("Failed setting org %s", orgId)
	//	}
	//}

	return org
}

func fixUserOrg(ctx context.Context, user *shuffle.User) *shuffle.User {
	found := false
	for _, id := range user.Orgs {
		if user.ActiveOrg.Id == id {
			found = true
			break
		}
	}

	if !found {
		user.Orgs = append(user.Orgs, user.ActiveOrg.Id)
	}

	// Might be vulnerable to timing attacks.
	for _, orgId := range user.Orgs {
		if len(orgId) == 0 {
			continue
		}

		org, err := shuffle.GetOrg(ctx, orgId)
		if err != nil {
			log.Printf("Error getting org %s", orgId)
			continue
		}

		orgIndex := 0
		userFound := false
		for index, orgUser := range org.Users {
			if orgUser.Id == user.Id {
				orgIndex = index
				userFound = true
				break
			}
		}

		if userFound {
			user.PrivateApps = []shuffle.WorkflowApp{}
			user.Executions = shuffle.ExecutionInfo{}
			user.Limits = shuffle.UserLimits{}
			user.Authentication = []shuffle.UserAuth{}

			org.Users[orgIndex] = *user
		} else {
			org.Users = append(org.Users, *user)
		}

		err = shuffle.SetOrg(ctx, *org, orgId)
		if err != nil {
			log.Printf("Failed setting org %s", orgId)
		}
	}

	return user
}

// Used for testing only. Shouldn't impact production.
/*
func shuffle.HandleCors(resp http.ResponseWriter, request *http.Request) bool {
	// Used for Codespace dev
	allowedOrigins := "https://frikky-shuffle-5gvr4xx62w64-3000.githubpreview.dev"
	//origin := request.Header["Origin"]
	//log.Printf("Origin: %s", origin)
	//allowedOrigins := "http://localhost:3002"

	resp.Header().Set("Vary", "Origin")
	resp.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, remember-me, Authorization")
	resp.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, PATCH")
	resp.Header().Set("Access-Control-Allow-Credentials", "true")
	resp.Header().Set("Access-Control-Allow-Origin", allowedOrigins)

	if request.Method == "OPTIONS" {
		resp.WriteHeader(200)
		resp.Write([]byte("OK"))
		return true
	}

	return false
}
*/

func parseWorkflowParameters(resp http.ResponseWriter, request *http.Request) (map[string]interface{}, error) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		return nil, err
	}

	log.Printf("Parsing data: %s", string(body))
	var t map[string]interface{}
	err = json.Unmarshal(body, &t)
	if err == nil {
		log.Printf("PARSED!! :)")
		return t, nil
	}

	// Translate XML to json in case of an XML blob.
	// FIXME - use Content-Type and Accept headers

	xml := strings.NewReader(string(body))
	curjson, err := xj.Convert(xml)
	if err != nil {
		return t, err
	}

	//fmt.Println(curjson.String())
	//log.Printf("Parsing json a second time: %s", string(curjson.String()))

	err = json.Unmarshal(curjson.Bytes(), &t)
	if err != nil {
		return t, nil
	}

	envelope := t["Envelope"].(map[string]interface{})
	curbody := envelope["Body"].(map[string]interface{})

	//log.Println(curbody)

	// ALWAYS handle strings only
	// FIXME - remove this and get it from config or something
	requiredField := "symptomDescription"
	_, found := SearchNested(curbody, requiredField)

	// Maxdepth
	maxiter := 5

	// Need to look for parent of the item, as that is most likely root
	if found {
		cnt := 0
		var previousDifferentItem map[string]interface{}
		var previousItem map[string]interface{}
		_ = previousItem
		for {
			if cnt == maxiter {
				break
			}

			// Already know it exists
			key, realItem, _ := SearchNestedParent(curbody, requiredField)

			// First should ALWAYS work since we already have recursion checked
			if len(previousDifferentItem) == 0 {
				previousDifferentItem = realItem.(map[string]interface{})
			}

			switch t := realItem.(type) {
			case map[string]interface{}:
				previousItem = realItem.(map[string]interface{})
				curbody = realItem.(map[string]interface{})
			default:
				// Gets here if it's not an object
				_ = t
				//log.Printf("hi %#v", previousItem)
				return previousItem, nil
			}

			_ = key
			cnt += 1
		}
	}

	//key, realItem, found = SearchNestedParent(newbody, requiredField)

	//if !found {
	//	log.Println("NOT FOUND!")
	//}

	////log.Println(realItem[requiredField].(map[string]interface{}))
	//log.Println(realItem[requiredField])
	//log.Printf("FOUND PARENT :): %s", key)

	return t, nil
}

// SearchNested searches a nested structure consisting of map[string]interface{}
// and []interface{} looking for a map with a specific key name.
// If found SearchNested returns the value associated with that key, true
func SearchNestedParent(obj interface{}, key string) (string, interface{}, bool) {
	switch t := obj.(type) {
	case map[string]interface{}:
		if v, ok := t[key]; ok {
			return "", v, ok
		}
		for k, v := range t {
			if _, ok := SearchNested(v, key); ok {
				return k, v, ok
			}
		}
	case []interface{}:
		for _, v := range t {
			if _, ok := SearchNested(v, key); ok {
				return "", v, ok
			}
		}
	}

	return "", nil, false
}

// SearchNested searches a nested structure consisting of map[string]interface{}
// and []interface{} looking for a map with a specific key name.
// If found SearchNested returns the value associated with that key, true
// If the key is not found SearchNested returns nil, false
func SearchNested(obj interface{}, key string) (interface{}, bool) {
	switch t := obj.(type) {
	case map[string]interface{}:
		if v, ok := t[key]; ok {
			return v, ok
		}
		for _, v := range t {
			if result, ok := SearchNested(v, key); ok {
				return result, ok
			}
		}
	case []interface{}:
		for _, v := range t {
			if result, ok := SearchNested(v, key); ok {
				return result, ok
			}
		}
	}
	return nil, false
}

func handleSetHook(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[INFO] Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var workflowId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
	}

	if len(workflowId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	// FIXME - check basic authentication
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Error with body read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Println(jsonPrettyPrint(string(body)))

	var hook shuffle.Hook
	err = json.Unmarshal(body, &hook)
	if err != nil {
		log.Printf("Failed unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Id != hook.Owner && user.Role != "admin" && user.Role != "scheduler" {
		log.Printf("Wrong user (%s) for hook %s", user.Username, hook.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if hook.Id != workflowId {
		errorstring := fmt.Sprintf(`Id %s != %s`, hook.Id, workflowId)
		log.Printf("Ids not matching: %s", errorstring)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "%s"}`, errorstring)))
		return
	}

	// Verifies the hook JSON. Bad verification :^)
	finished, errorstring := verifyHook(hook)
	if !finished {
		log.Printf("Error with hook: %s", errorstring)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "%s"}`, errorstring)))
		return
	}

	// Get the ID to see whether it exists
	// FIXME - use return and set READONLY fields (don't allow change from User)
	ctx := context.Background()
	_, err = shuffle.GetHook(ctx, workflowId)
	if err != nil {
		log.Printf("[WARNING] Failed getting hook %s (set): %s", workflowId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "Invalid ID"}`))
		return
	}

	// Update the fields
	err = shuffle.SetHook(ctx, hook)
	if err != nil {
		log.Printf("Failed setting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

// FIXME - some fields (e.g. status) shouldn't be writeable.. Meh
func verifyHook(hook shuffle.Hook) (bool, string) {
	// required fields: Id, info.name, type, status, running
	if hook.Id == "" {
		return false, "Missing required field id"
	}

	if hook.Info.Name == "" {
		return false, "Missing required field info.name"
	}

	// Validate type stuff
	validTypes := []string{"webhook"}
	found := false
	for _, key := range validTypes {
		if hook.Type == key {
			found = true
			break
		}
	}

	if !found {
		return false, fmt.Sprintf("Field type is invalid. Allowed: %s", strings.Join(validTypes, ", "))
	}

	// WEbhook specific
	if hook.Type == "webhook" {
		if hook.Info.Url == "" {
			return false, "Missing required field info.url"
		}
	}

	if hook.Status == "" {
		return false, "Missing required field status"
	}

	validStatusFields := []string{"running", "stopped", "uninitialized"}
	found = false
	for _, key := range validStatusFields {
		if hook.Status == key {
			found = true
			break
		}
	}

	if !found {
		return false, fmt.Sprintf("Field status is invalid. Allowed: %s", strings.Join(validStatusFields, ", "))
	}

	// Verify actions
	if len(hook.Actions) > 0 {
		existingIds := []string{}
		for index, action := range hook.Actions {
			if action.Type == "" {
				return false, fmt.Sprintf("Missing required field actions.type at index %d", index)
			}

			if action.Name == "" {
				return false, fmt.Sprintf("Missing required field actions.name at index %d", index)
			}

			if action.Id == "" {
				return false, fmt.Sprintf("Missing required field actions.id at index %d", index)
			}

			// Check for duplicate IDs
			for _, actionId := range existingIds {
				if action.Id == actionId {
					return false, fmt.Sprintf("actions.id %s at index %d already exists", actionId, index)
				}
			}
			existingIds = append(existingIds, action.Id)
		}
	}

	return true, "All items set"
	//log.Printf("%#v", hook)

	//Id         string   `json:"id" datastore:"id"`
	//Info       Info     `json:"info" datastore:"info"`
	//Transforms struct{} `json:"transforms" datastore:"transforms"`
	//Actions    []HookAction `json:"actions" datastore:"actions"`
	//Type       string   `json:"type" datastore:"type"`
	//Status     string   `json:"status" datastore:"status"`
	//Running    bool     `json:"running" datastore:"running"`
}

func setSpecificSchedule(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var workflowId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
	}

	if len(workflowId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	// FIXME - check basic authentication
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Error with body read: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	jsonPrettyPrint(string(body))
	var schedule shuffle.ScheduleOld
	err = json.Unmarshal(body, &schedule)
	if err != nil {
		log.Printf("Failed unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - check access etc
	ctx := context.Background()
	err = shuffle.SetSchedule(ctx, schedule)
	if err != nil {
		log.Printf("Failed setting schedule: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - get some real data?
	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
	return
}

func getSpecificWebhook(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var workflowId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
	}

	if len(workflowId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	ctx := context.Background()
	// FIXME: Schedule = trigger?
	schedule, err := shuffle.GetSchedule(ctx, workflowId)
	if err != nil {
		log.Printf("Failed setting schedule: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	//log.Printf("%#v", schedule.Translator[0])

	b, err := json.Marshal(schedule)
	if err != nil {
		log.Printf("Failed marshalling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - get some real data?
	resp.WriteHeader(200)
	resp.Write([]byte(b))
	return
}

// Starts a new webhook
func handleDeleteSchedule(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[WARNING] Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME: IAM - Get workflow and check owner
	if user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Admin required"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var workflowId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
	}

	if len(workflowId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	ctx := context.Background()
	err = shuffle.DeleteKey(ctx, "schedules", workflowId)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "Can't delete"}`))
		return
	}

	// FIXME - remove schedule too

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true, "message": "Deleted webhook"}`))
}

// Starts a new webhook
func handleNewSchedule(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	randomValue := uuid.NewV4()
	h := md5.New()
	io.WriteString(h, randomValue.String())
	newId := strings.ToLower(fmt.Sprintf("%X", h.Sum(nil)))

	// FIXME - timestamp!
	// FIXME - applocation - cloud function?
	timeNow := int64(time.Now().Unix())
	schedule := shuffle.ScheduleOld{
		Id:                   newId,
		AppInfo:              shuffle.AppInfo{},
		BaseAppLocation:      "/home/frikky/git/shaffuru/tmp/apps",
		CreationTime:         timeNow,
		LastModificationtime: timeNow,
		LastRuntime:          timeNow,
	}

	ctx := context.Background()
	err := shuffle.SetSchedule(ctx, schedule)
	if err != nil {
		log.Printf("Failed setting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Println("Generating new schedule")
	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true, "message": "Created new service"}`))
}

// Does the webhook
func handleWebhookCallback(resp http.ResponseWriter, request *http.Request) {
	// 1. Get callback data
	// 2. Load the configuration
	// 3. Execute the workflow
	//cors := shuffle.HandleCors(resp, request)
	//if cors {
	//	return
	//}

	if request.Method != "POST" {
		request.Method = "POST"
	}

	if request.Body == nil {
		stringReader := strings.NewReader("")
		request.Body = ioutil.NopCloser(stringReader)
	}

	path := strings.Split(request.URL.String(), "/")
	if len(path) < 4 {
		resp.WriteHeader(403)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// 1. Get config with hookId
	//fmt.Sprintf("%s/api/v1/hooks/%s", callbackUrl, hookId)
	ctx := context.Background()
	location := strings.Split(request.URL.String(), "/")

	var hookId string
	var queries string
	if location[1] == "api" {
		if len(location) <= 4 {
			log.Printf("[INFO] Couldn't handle location. Too short in webhook: %d", len(location))
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		hookId = location[4]
	}

	if strings.Contains(hookId, "?") {
		splitter := strings.Split(hookId, "?")
		hookId = splitter[0]

		if len(splitter) > 1 {
			queries = splitter[1]
		}
	}

	// ID: webhook_<UID>
	if len(hookId) != 44 {
		log.Printf("[INFO] Couldn't handle hookId. Too short in webhook: %d", len(hookId))
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Hook ID not valid"}`))
		return
	}

	hookId = hookId[8:len(hookId)]

	//log.Printf("HookID: %s", hookId)
	hook, err := shuffle.GetHook(ctx, hookId)
	if err != nil {
		log.Printf("[WARNING] Failed getting hook %s (callback): %s", hookId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	//log.Printf("HOOK FOUND: %#v", hook)
	// Execute the workflow
	//executeWorkflow(resp, request)

	//resp.WriteHeader(200)
	//resp.Write([]byte(`{"success": true}`))
	if hook.Status == "stopped" {
		log.Printf("[WARNING] Not running %s because hook status is stopped", hook.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "The webhook isn't running. Is it running?"}`)))
		return
	}

	if len(hook.Workflows) == 0 {
		log.Printf("[DEBUG] Not running because hook isn't connected to any workflows")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "No workflows are defined"}`)))
		return
	}

	if hook.Environment == "cloud" {
		log.Printf("[DEBUG] This should trigger in the cloud. Duplicate action allowed onprem.")
	}

	// Check auth
	if len(hook.Auth) > 0 {
		err = shuffle.CheckHookAuth(request, hook.Auth)
		if err != nil {
			log.Printf("[WARNING] Failed auth for hook %s: %s", hook.Id, err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Bad authentication headers"}`))
			return
		}
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[DEBUG] Body data error: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if len(queries) > 0 && len(body) == 0 {
		body = []byte(queries)
	}

	//log.Printf("BODY: %s", parsedBody)

	// This is a specific fix for MSteams and may fix other things as well
	// Scared whether it may stop other things though, but that's a future problem
	// (famous last words)

	//log.Printf("\n\nPARSEDBODY: %s", parsedBody)
	parsedBody := shuffle.GetExecutionbody(body)
	newBody := shuffle.ExecutionStruct{
		Start:             hook.Start,
		ExecutionSource:   "webhook",
		ExecutionArgument: parsedBody,
	}

	if len(hook.Workflows) == 1 {
		workflow, err := shuffle.GetWorkflow(ctx, hook.Workflows[0])
		if err == nil {
			for _, branch := range workflow.Branches {
				if branch.SourceID == hook.Id {
					log.Printf("[DEBUG] Found ID %s for hook", hook.Id)
					if branch.DestinationID != hook.Start {
						newBody.Start = branch.DestinationID
						break
					}
				}
			}
		}
	}

	b, err := json.Marshal(newBody)
	if err != nil {
		log.Printf("[ERROR] Failed newBody marshaling for webhook: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Should wrap the response input Body as well?
	for _, item := range hook.Workflows {
		log.Printf("[INFO] Running webhook for workflow %s with startnode %s", item, hook.Start)

		// This ID is empty to force it to get the webhook within the execution
		workflow := shuffle.Workflow{
			ID: "",
		}

		if len(hook.Start) == 0 {
			log.Printf("[WARNING] No start node for hook %s - running with workflow default.", hook.Id)
			//bodyWrapper = string(parsedBody)
		}

		newRequest := &http.Request{
			URL:    &url.URL{},
			Method: "POST",
			Body:   ioutil.NopCloser(bytes.NewReader(b)),
		}

		// OrgId: activeOrgs[0].Id,
		workflowExecution, executionResp, err := handleExecution(item, workflow, newRequest, hook.OrgId)

		if err == nil {
			if hook.Version == "v2" {
				timeout := 15
				//if hook.VersionTimeout != 0 {
				//	timeout = hook.VersionTimeout
				//}

				log.Printf("[DEBUG] Waiting for Webhook response from %s for max %d seconds! Checking every 1 second. Hook ID: %s", workflowExecution.ExecutionId, timeout, hook.Id)
				// Try every second for 15 seconds
				for i := 0; i < timeout; i++ {
					time.Sleep(1 * time.Second)

					newExec, err := shuffle.GetWorkflowExecution(ctx, workflowExecution.ExecutionId)
					if err != nil {
						log.Printf("[ERROR] Failed to get workflow execution: %s", err)
						break
					}

					if newExec.Status != "EXECUTING" {
						log.Printf("[INFO] Got response from webhook v2 of length '%d' <- %s", len(newExec.Result), newExec.ExecutionId)
						resp.WriteHeader(200)
						resp.Write([]byte(newExec.Result))
						return
					}
				}
			}

			// Fallback
			resp.WriteHeader(200)
			if len(hook.CustomResponse) > 0 {
				resp.Write([]byte(hook.CustomResponse))
			} else {
				resp.Write([]byte(fmt.Sprintf(`{"success": true, "execution_id": "%s"}`, workflowExecution.ExecutionId)))
			}
			return
		}

		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, executionResp)))
	}

}

func executeCloudAction(action shuffle.CloudSyncJob, apikey string) error {
	data, err := json.Marshal(action)
	if err != nil {
		log.Printf("Failed cloud webhook action marshalling: %s", err)
		return err
	}

	//transport := http.DefaultTransport.(*http.Transport).Clone()
	//client := &http.Client{
	//	Transport: transport,
	//}
	client := &http.Client{}

	syncUrl := fmt.Sprintf("%s/api/v1/cloud/sync/handle_action", syncUrl)
	req, err := http.NewRequest(
		"POST",
		syncUrl,
		bytes.NewBuffer(data),
	)

	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, apikey))
	newresp, err := client.Do(req)
	if err != nil {
		return err
	}

	respBody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		return err
	}

	type Result struct {
		Success bool   `json:"success"`
		Reason  string `json:"reason"`
	}

	//log.Printf("Data: %s", string(respBody))
	responseData := Result{}
	err = json.Unmarshal(respBody, &responseData)
	if err != nil {
		return err
	}

	if !responseData.Success {
		return errors.New(fmt.Sprintf("Cloud error from Shuffler: %s", responseData.Reason))
	}

	log.Printf("[INFO] Cloud action executed successfully for '%s'", action.Action)

	return nil
}

func getSpecificSchedule(resp http.ResponseWriter, request *http.Request) {
	if request.Method != "GET" {
		setSpecificSchedule(resp, request)
		return
	}

	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var workflowId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
	}

	if len(workflowId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	ctx := context.Background()
	schedule, err := shuffle.GetSchedule(ctx, workflowId)
	if err != nil {
		log.Printf("Failed getting schedule: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	//log.Printf("%#v", schedule.Translator[0])

	b, err := json.Marshal(schedule)
	if err != nil {
		log.Printf("Failed marshalling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(b))
}

func loadYaml(fileLocation string) (ApiYaml, error) {
	apiYaml := ApiYaml{}

	yamlFile, err := ioutil.ReadFile(fileLocation)
	if err != nil {
		log.Printf("yamlFile.Get err: %s", err)
		return ApiYaml{}, err
	}

	err = yaml.Unmarshal([]byte(yamlFile), &apiYaml)
	if err != nil {
		return ApiYaml{}, err
	}

	return apiYaml, nil
}

// This should ALWAYS come from an OUTPUT
func executeSchedule(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")
	var workflowId string

	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
	}

	if len(workflowId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	ctx := context.Background()
	log.Printf("[INFO] EXECUTING %s!", workflowId)
	idConfig, err := shuffle.GetSchedule(ctx, workflowId)
	if err != nil {
		log.Printf("Error getting schedule: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// Basically the src app
	inputStrings := map[string]string{}
	for _, item := range idConfig.Translator {
		if item.Dst.Required == "false" {
			log.Println("Skipping not required")
			continue
		}

		if item.Src.Name == "" {
			errorMsg := fmt.Sprintf("Required field %s has no source", item.Dst.Name)
			log.Println(errorMsg)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, errorMsg)))
			return
		}

		inputStrings[item.Dst.Name] = item.Src.Name
	}

	configmap := map[string]string{}
	for _, config := range idConfig.AppInfo.SourceApp.Config {
		configmap[config.Key] = config.Value
	}

	// FIXME - this wont work for everything lmao
	functionName := strings.ToLower(idConfig.AppInfo.SourceApp.Action)
	functionName = strings.Replace(functionName, " ", "_", 10)

	cmdArgs := []string{
		fmt.Sprintf("%s/%s/app.py", baseAppPath, "thehive"),
		fmt.Sprintf("--referenceid=%s", workflowId),
		fmt.Sprintf("--function=%s", functionName),
	}

	for key, value := range configmap {
		cmdArgs = append(cmdArgs, fmt.Sprintf("--%s=%s", key, value))
	}

	// FIXME - processname
	baseProcess := "python3"
	log.Printf("Executing: %s %s", baseProcess, strings.Join(cmdArgs, " "))
	execSubprocess(baseProcess, cmdArgs)

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

func execSubprocess(cmdName string, cmdArgs []string) error {
	cmd := exec.Command(cmdName, cmdArgs...)
	cmdReader, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error creating StdoutPipe for Cmd", err)
		return err
	}

	scanner := bufio.NewScanner(cmdReader)
	go func() {
		for scanner.Scan() {
			fmt.Printf("Out: %s\n", scanner.Text())
		}
	}()

	err = cmd.Start()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error starting Cmd", err)
		return err
	}

	err = cmd.Wait()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error waiting for Cmd", err)
		return err
	}

	return nil
}

// This should ALWAYS come from an OUTPUT
func uploadWorkflowResult(resp http.ResponseWriter, request *http.Request) {
	// Post to a key with random data?
	location := strings.Split(request.URL.String(), "/")

	var workflowId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
	}

	if len(workflowId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	// FIXME - check if permission AND whether it exists

	// FIXME - validate ID as well
	ctx := context.Background()
	schedule, err := shuffle.GetSchedule(ctx, workflowId)
	if err != nil {
		log.Printf("Failed setting schedule %s: %s", workflowId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Should use generic interfaces and parse fields OR
	// build temporary struct based on api.yaml of the app
	data, err := parseWorkflowParameters(resp, request)
	if err != nil {
		log.Printf("Invalid params: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	// Get the actual fields
	foldername := schedule.AppInfo.SourceApp.Foldername
	curOutputType := schedule.AppInfo.SourceApp.Name
	curOutputAppOutput := schedule.AppInfo.SourceApp.Action
	curInputType := schedule.AppInfo.DestinationApp.Name
	translatormap := schedule.Translator

	if len(curOutputType) <= 0 {
		log.Printf("Id %s is invalid. Missing sourceapp name", workflowId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	if len(foldername) == 0 {
		foldername = strings.ToLower(curOutputType)
	}

	if len(curOutputAppOutput) <= 0 {
		log.Printf("Id %s is invalid. Missing source output ", workflowId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	if len(curInputType) <= 0 {
		log.Printf("Id %s is invalid. Missing destination name", workflowId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	// Needs to be used for parsing properly
	// Might be dumb to have the yaml as a file too
	yamlpath := fmt.Sprintf("%s/%s/api.yaml", baseAppPath, foldername)
	curyaml, err := loadYaml(yamlpath)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	//validFields := []string{}
	requiredFields := []string{}
	optionalFields := []string{}
	for _, output := range curyaml.Output {
		if output.Name != curOutputAppOutput {
			continue
		}

		for _, outputparam := range output.OutputParameters {
			if outputparam.Required == "true" {
				if outputparam.Schema.Type == "string" {
					requiredFields = append(requiredFields, outputparam.Name)
				} else {
					log.Printf("Outputparam schematype %s is not implemented.", outputparam.Schema.Type)
				}
			} else {
				optionalFields = append(optionalFields, outputparam.Name)
			}
		}

		// Wont reach here unless it's the right one
		break
	}

	// Checks whether ALL required fields are filled
	for _, fieldname := range requiredFields {
		if data[fieldname] == nil {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Field %s is required"}`, fieldname)))
			return
		} else {
			log.Printf("%s: %s", fieldname, data[fieldname])
		}
	}

	// FIXME
	// Verify whether it can be sent from the source to destination here
	// Save to DB or send it straight? Idk
	// Use e.g. google pubsub if cloud and maybe kafka locally

	// FIXME - add more types :)
	sourcedatamap := map[string]string{}
	for key, value := range data {
		switch v := value.(type) {
		case string:
			sourcedatamap[key] = value.(string)
		default:
			log.Printf("unexpected type %T", v)
		}
	}

	log.Println(data)
	log.Println(requiredFields)
	log.Println(translatormap)
	log.Println(sourcedatamap)

	outputmap := map[string]string{}
	for _, translator := range translatormap {
		if translator.Src.Type == "static" {
			log.Printf("%s = %s", translator.Dst.Name, translator.Src.Value)
			outputmap[translator.Dst.Name] = translator.Src.Value
		} else {
			log.Printf("%s = %s", translator.Dst.Name, translator.Src.Name)
			outputmap[translator.Dst.Name] = sourcedatamap[translator.Src.Name]
		}
	}

	configmap := map[string]string{}
	for _, config := range schedule.AppInfo.DestinationApp.Config {
		configmap[config.Key] = config.Value
	}

	// FIXME - add function to run
	// FIXME - add reference somehow
	// FIXME - add apikey somehow
	// Just package and run really?

	// FIXME - generate from sourceapp
	outputmap["function"] = "create_alert"
	cmdArgs := []string{
		fmt.Sprintf("%s/%s/app.py", baseAppPath, foldername),
	}

	for key, value := range outputmap {
		cmdArgs = append(cmdArgs, fmt.Sprintf("--%s=%s", key, value))
	}

	// COnfig map!
	for key, value := range configmap {
		cmdArgs = append(cmdArgs, fmt.Sprintf("--%s=%s", key, value))
	}
	outputmap["referenceid"] = workflowId

	baseProcess := "python3"
	log.Printf("Executing: %s %s", baseProcess, strings.Join(cmdArgs, " "))
	execSubprocess(baseProcess, cmdArgs)

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

//dst: {name: "title", required: "true", type: "string"}
//
//"title": "symptomDescription",
//"description": "detailedDescription",
//"type": "ticketType",
//"sourceRef": "ticketId"
//"name": "secureworks",
//"id": "e07910a06a086c83ba41827aa00b26ed",
//"description": "I AM SECUREWORKS DESC",
//"action": "Get Tickets",
//"config": {}
//"name": "thehive",
//			"id": "e07910a06a086c83ba41827aa00b26ef",
//			"description": "I AM thehive DESC",
//			"action": "Add ticket",
//			"config": [{
//				"key": "http://localhost:9000",
//				"value": "kZJmmn05j8wndOGDGvKg/D9eKub1itwO"
//			}]

func findValidScheduleAppFolders(rootAppFolder string) ([]string, error) {
	rootFiles, err := ioutil.ReadDir(rootAppFolder)
	if err != nil {
		return []string{}, err
	}

	invalidRootFiles := []string{}
	invalidRootFolders := []string{}
	invalidAppFolders := []string{}
	validAppFolders := []string{}

	// This is dumb
	allowedLanguages := []string{"py", "go"}

	for _, rootfile := range rootFiles {
		if !rootfile.IsDir() {
			invalidRootFiles = append(invalidRootFiles, rootfile.Name())
			continue
		}

		appFolderLocation := fmt.Sprintf("%s/%s", rootAppFolder, rootfile.Name())
		appFiles, err := ioutil.ReadDir(appFolderLocation)
		if err != nil {
			// Invalid app folder (deleted within a few MS lol)
			invalidRootFolders = append(invalidRootFolders, rootfile.Name())
			continue
		}

		yamlFileDone := false
		appFileExists := false
		for _, appfile := range appFiles {
			if appfile.Name() == "api.yaml" {
				err := validateAppYaml(
					fmt.Sprintf("%s/%s", appFolderLocation, appfile.Name()),
				)

				if err != nil {
					log.Printf("Error in %s: %s", fmt.Sprintf("%s/%s", rootfile.Name(), appfile.Name()), err)
					break
				}

				log.Printf("YAML FOR %s: %s IS VALID!!", rootfile.Name(), appfile.Name())
				yamlFileDone = true
			}

			for _, language := range allowedLanguages {
				if appfile.Name() == fmt.Sprintf("app.%s", language) {
					log.Printf("Appfile found for %s", rootfile.Name())
					appFileExists = true
					break
				}
			}
		}

		if !yamlFileDone || !appFileExists {
			invalidAppFolders = append(invalidAppFolders, rootfile.Name())
		} else {
			validAppFolders = append(validAppFolders, rootfile.Name())
		}
	}

	log.Printf("Invalid rootfiles: %s", strings.Join(invalidRootFiles, ", "))
	log.Printf("Invalid rootfolders: %s", strings.Join(invalidRootFolders, ", "))
	log.Printf("Invalid appfolders: %s", strings.Join(invalidAppFolders, ", "))
	log.Printf("\n=== VALID appfolders ===\n* %s", strings.Join(validAppFolders, "\n"))

	return validAppFolders, err
}

func validateInputOutputYaml(appType string, apiYaml ApiYaml) error {
	if appType == "input" {
		for index, input := range apiYaml.Input {
			if input.Name == "" {
				return errors.New(fmt.Sprintf("YAML field name doesn't exist in index %d of Input", index))
			}
			if input.Description == "" {
				return errors.New(fmt.Sprintf("YAML field description doesn't exist in index %d of Input", index))
			}

			for paramindex, param := range input.InputParameters {
				if param.Name == "" {
					return errors.New(fmt.Sprintf("YAML field name doesn't exist in Input %s with index %d", input.Name, paramindex))
				}

				if param.Description == "" {
					return errors.New(fmt.Sprintf("YAML field description doesn't exist in Input %s with index %d", input.Name, index))
				}

				if param.Schema.Type == "" {
					return errors.New(fmt.Sprintf("YAML field schema.type doesn't exist in Input %s with index %d", input.Name, index))
				}
			}
		}
	}

	return nil
}

func validateAppYaml(fileLocation string) error {
	/*
		Requires:
		name, description, app_version, contact_info (name), types
	*/

	apiYaml, err := loadYaml(fileLocation)
	if err != nil {
		return err
	}

	// Validate fields
	if apiYaml.Name == "" {
		return errors.New("YAML field name doesn't exist")
	}
	if apiYaml.Description == "" {
		return errors.New("YAML field description doesn't exist")
	}

	if apiYaml.AppVersion == "" {
		return errors.New("YAML field app_version doesn't exist")
	}

	if apiYaml.ContactInfo.Name == "" {
		return errors.New("YAML field contact_info.name doesn't exist")
	}

	if len(apiYaml.Types) == 0 {
		return errors.New("YAML field types doesn't exist")
	}

	// Validate types (input/ouput)
	validTypes := []string{"input", "output"}
	for _, appType := range apiYaml.Types {
		// Validate in here lul
		for _, validType := range validTypes {
			if appType == validType {
				err = validateInputOutputYaml(appType, apiYaml)
				if err != nil {
					return err
				}
				break
			}
		}
	}

	return nil
}

func setBadMemcache(ctx context.Context, path string) {
	// Add to cache if it doesn't exist
	//item := &memcache.Item{
	//	Key:        path,
	//	Value:      []byte(`{"success": false}`),
	//	Expiration: time.Minute * 60,
	//}

	//if err := memcache.Add(ctx, item); err == memcache.ErrNotStored {
	//	if err := memcache.Set(ctx, item); err != nil {
	//		log.Printf("Error setting item: %v", err)
	//	}
	//} else if err != nil {
	//	log.Printf("error adding item: %v", err)
	//} else {
	//	log.Printf("Set cache for %s", item.Key)
	//}
}

type Result struct {
	Success bool     `json:"success"`
	Reason  string   `json:"reason"`
	List    []string `json:"list"`
}

// r.HandleFunc("/api/v1/docs/{key}", getDocs).Methods("GET", "OPTIONS")

func getOpenapi(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Just here to verify that the user is logged in
	_, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in validate swagger: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")
	var id string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		id = location[4]
	}

	if len(id) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - FIX AUTH WITH APP
	ctx := context.Background()
	//_, err = shuffle.GetApp(ctx, id)
	//if err == nil {
	//	log.Println("You're supposed to be able to continue now.")
	//}

	parsedApi, err := shuffle.GetOpenApiDatastore(ctx, id)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("[INFO] API LENGTH GET FOR OPENAPI %s: %d, ID: %s", id, len(parsedApi.Body), id)

	parsedApi.Success = true
	data, err := json.Marshal(parsedApi)
	if err != nil {
		resp.WriteHeader(422)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed marshalling parsed swagger: %s"}`, err)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(data)
}

func handleSwaggerValidation(body []byte) (shuffle.ParsedOpenApi, error) {
	type versionCheck struct {
		Swagger        string `datastore:"swagger" json:"swagger" yaml:"swagger"`
		SwaggerVersion string `datastore:"swaggerVersion" json:"swaggerVersion" yaml:"swaggerVersion"`
		OpenAPI        string `datastore:"openapi" json:"openapi" yaml:"openapi"`
	}

	//body = []byte(`swagger: "2.0"`)
	//body = []byte(`swagger: '1.0'`)
	//newbody := string(body)
	//newbody = strings.TrimSpace(newbody)
	//body = []byte(newbody)
	//log.Println(string(body))
	//tmpbody, err := yaml.YAMLToJSON(body)
	//log.Println(err)
	//log.Println(string(tmpbody))

	// This has to be done in a weird way because Datastore doesn't
	// support map[string]interface and similar (openapi3.Swagger)
	var version versionCheck

	parsed := shuffle.ParsedOpenApi{}
	swaggerdata := []byte{}
	idstring := ""

	isJson := false
	err := json.Unmarshal(body, &version)
	if err != nil {
		//log.Printf("Json err: %s", err)
		err = yaml.Unmarshal(body, &version)
		if err != nil {
			log.Printf("[WARNING] Yaml error (1): %s", err)
		} else {
			//log.Printf("Successfully parsed YAML!")
		}
	} else {
		isJson = true
		//log.Printf("[DEBUG] Successfully parsed JSON!")
	}

	if len(version.SwaggerVersion) > 0 && len(version.Swagger) == 0 {
		version.Swagger = version.SwaggerVersion
	}

	if strings.HasPrefix(version.Swagger, "3.") || strings.HasPrefix(version.OpenAPI, "3.") {
		//log.Println("Handling v3 API")
		swaggerLoader := openapi3.NewSwaggerLoader()
		swaggerLoader.IsExternalRefsAllowed = true
		swaggerv3, err := swaggerLoader.LoadSwaggerFromData(body)
		if err != nil {
			log.Printf("Failed parsing OpenAPI: %s", err)
			return shuffle.ParsedOpenApi{}, err
		}

		swaggerdata, err = json.Marshal(swaggerv3)
		if err != nil {
			log.Printf("Failed unmarshaling v3 data: %s", err)
			return shuffle.ParsedOpenApi{}, err
		}

		hasher := md5.New()
		hasher.Write(swaggerdata)
		idstring = hex.EncodeToString(hasher.Sum(nil))

	} else { //strings.HasPrefix(version.Swagger, "2.") || strings.HasPrefix(version.OpenAPI, "2.") {
		// Convert
		//log.Println("Handling v2 API")
		var swagger openapi2.Swagger
		//log.Println(string(body))
		err = json.Unmarshal(body, &swagger)
		if err != nil {
			//log.Printf("Json error? %s", err)
			err = yaml.Unmarshal(body, &swagger)
			if err != nil {
				log.Printf("[WARNING] Yaml error (2): %s", err)
				return shuffle.ParsedOpenApi{}, err
			} else {
				//log.Printf("Valid yaml!")
			}

		}

		swaggerv3, err := openapi2conv.ToV3Swagger(&swagger)
		if err != nil {
			log.Printf("Failed converting from openapi2 to 3: %s", err)
			return shuffle.ParsedOpenApi{}, err
		}

		swaggerdata, err = json.Marshal(swaggerv3)
		if err != nil {
			log.Printf("Failed unmarshaling v3 data: %s", err)
			return shuffle.ParsedOpenApi{}, err
		}

		hasher := md5.New()
		hasher.Write(swaggerdata)
		idstring = hex.EncodeToString(hasher.Sum(nil))
	}

	if len(swaggerdata) > 0 {
		body = swaggerdata
	}

	// Overwrite with new json data
	_ = isJson
	body = swaggerdata

	// Parsing it to swagger 3
	parsed = shuffle.ParsedOpenApi{
		ID:      idstring,
		Body:    string(body),
		Success: true,
	}

	return parsed, err
}

func buildSwaggerApp(resp http.ResponseWriter, body []byte, user shuffle.User, skipEdit bool) {
	type Test struct {
		Editing bool   `json:"editing" datastore:"editing"`
		Id      string `json:"id" datastore:"id"`
		Image   string `json:"image" datastore:"image"`
		Body    string `json:"body" datastore:"body"`
	}

	var test Test
	err := json.Unmarshal(body, &test)
	if err != nil {
		log.Printf("[ERROR] Failed unmarshalling in swagger build: %s", err)
		resp.WriteHeader(400)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Get an identifier
	hasher := md5.New()
	hasher.Write(body)
	newmd5 := hex.EncodeToString(hasher.Sum(nil))

	if test.Editing && len(user.Id) > 0 && skipEdit != true {
		// Quick verification test
		ctx := context.Background()
		app, err := shuffle.GetApp(ctx, test.Id, user, false)
		if err != nil {
			log.Printf("[ERROR] Error getting app when editing: %s", app.Name)
			resp.WriteHeader(400)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		// FIXME: Check whether it's in use.
		if user.Id != app.Owner && user.Role != "admin" {
			log.Printf("[WARNING] Wrong user (%s) for app %s when verifying swagger", user.Username, app.Name)
			resp.WriteHeader(400)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		log.Printf("[INFO] %s is EDITING APP WITH ID %s and md5 %s", user.Id, app.ID, newmd5)
		newmd5 = app.ID
	}

	// Generate new app integration (bump version)
	// Test = client side with fetch?

	ctx := context.Background()
	swaggerLoader := openapi3.NewSwaggerLoader()
	swaggerLoader.IsExternalRefsAllowed = true
	swagger, err := swaggerLoader.LoadSwaggerFromData(body)
	if err != nil {
		log.Printf("[ERROR] Swagger validation error: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed verifying openapi"}`))
		return
	}

	if swagger.Info == nil {
		log.Printf("[ERORR] Info is nil in swagger?")
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Info not parsed"}`))
		return
	}

	swagger.Info.Title = shuffle.FixFunctionName(swagger.Info.Title, swagger.Info.Title, false)
	if strings.Contains(swagger.Info.Title, " ") {
		swagger.Info.Title = strings.Replace(swagger.Info.Title, " ", "_", -1)
	}

	basePath, err := shuffle.BuildStructure(swagger, newmd5)
	if err != nil {
		log.Printf("[WARNING] Failed to build base structure: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed building baseline structure"}`))
		return
	}

	//log.Printf("Should generate yaml")
	swagger, api, pythonfunctions, err := shuffle.GenerateYaml(swagger, newmd5)
	if err != nil {
		log.Printf("[WARNING] Failed building and generating yaml (buildapp): %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed building and parsing yaml"}`))
		return
	}

	// FIXME: CHECK IF SAME NAME AS NORMAL APP
	// Can't overwrite existing normal app
	workflowApps, err := shuffle.GetPrioritizedApps(ctx, user)
	if err != nil {
		log.Printf("[WARNING] Failed getting all workflow apps from database to verify: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed to verify existence"}`))
		return
	}

	// Same name only?
	lowerName := strings.ToLower(swagger.Info.Title)
	for _, app := range workflowApps {
		if app.Downloaded && !app.Generated && strings.ToLower(app.Name) == lowerName {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Normal app with name %s already exists. Delete it first."}`, swagger.Info.Title)))
			return
		}
	}

	api.Owner = user.Id

	err = shuffle.DumpApi(basePath, api)
	if err != nil {
		log.Printf("[WARNING] Failed dumping yaml: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed dumping yaml"}`))
		return
	}

	identifier := fmt.Sprintf("%s-%s", swagger.Info.Title, newmd5)
	classname := strings.Replace(identifier, " ", "", -1)
	classname = strings.Replace(classname, "-", "", -1)
	parsedCode, err := shuffle.DumpPython(basePath, classname, swagger.Info.Version, pythonfunctions)
	if err != nil {
		log.Printf("Failed dumping python: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed dumping appcode"}`))
		return
	}

	identifier = strings.Replace(identifier, " ", "-", -1)
	identifier = strings.Replace(identifier, "_", "-", -1)
	log.Printf("[INFO] Successfully parsed %s. Proceeding to docker container", identifier)

	// Now that the baseline is setup, we need to make it into a cloud function
	// 1. Upload the API to datastore for use
	// 2. Get code from baseline/app_base.py & baseline/static_baseline.py
	// 3. Stitch code together from these two + our new app
	// 4. Zip the folder to cloud storage
	// 5. Upload as cloud function

	// 1. Upload the API to datastore
	err = shuffle.DeployAppToDatastore(ctx, api)
	//func DeployAppToDatastore(ctx context.Context, workflowapp WorkflowApp, bucketName string) error {
	if err != nil {
		log.Printf("Failed adding app to db: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed adding app to db: %s"}`, err)))
		return
	}

	// 2. Get all the required code
	appbase, staticBaseline, err := shuffle.GetAppbase()
	if err != nil {
		log.Printf("Failed getting appbase: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed getting appbase code"}`))
		return
	}

	// Have to do some quick checks of the python code (:
	_, parsedCode = shuffle.FormatAppfile(parsedCode)

	fixedAppbase := shuffle.FixAppbase(appbase)
	runner := shuffle.GetRunnerOnprem(classname)

	// 2. Put it together
	stitched := string(staticBaseline) + strings.Join(fixedAppbase, "\n") + parsedCode + string(runner)
	//log.Println(stitched)

	// 3. Zip and stream it directly in the directory
	_, err = shuffle.StreamZipdata(ctx, identifier, stitched, shuffle.GetAppRequirements(), "")
	if err != nil {
		log.Printf("[ERROR] Zipfile error: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed to build zipfile"}`))
		return
	}

	log.Printf("[INFO] Successfully stitched ZIPFILE for %s", identifier)

	// 4. Build the image locally.
	// FIXME: Should be moved to a local docker registry
	dockerLocation := fmt.Sprintf("%s/Dockerfile", basePath)
	log.Printf("[INFO] Dockerfile: %s", dockerLocation)

	versionName := fmt.Sprintf("%s_%s", strings.ToLower(strings.ReplaceAll(api.Name, " ", "-")), api.AppVersion)
	dockerTags := []string{
		fmt.Sprintf("%s:%s", baseDockerName, identifier),
		fmt.Sprintf("%s:%s", baseDockerName, versionName),
	}

	found := false
	foundNumber := 0
	log.Printf("[INFO] Checking for api with ID %s", newmd5)
	for appCounter, app := range user.PrivateApps {
		if app.ID == api.ID {
			found = true
			foundNumber = appCounter
			break
		} else if app.Name == api.Name && app.AppVersion == api.AppVersion {
			found = true
			foundNumber = appCounter
			break
		} else if app.PrivateID == test.Id && test.Editing {
			found = true
			foundNumber = appCounter
			break
		}
	}

	// Updating the user with the new app so that it can easily be retrieved
	if !found {
		user.PrivateApps = append(user.PrivateApps, api)
	} else {
		user.PrivateApps[foundNumber] = api
	}

	if len(user.Id) > 0 {
		err = shuffle.SetUser(ctx, &user, true)
		if err != nil {
			log.Printf("[ERROR] Failed adding verification for user %s: %s", user.Username, err)
			resp.WriteHeader(500)
			resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Failed updating user"}`)))
			return
		}
	}

	//log.Printf("DO I REACH HERE WHEN SAVING?")
	parsed := shuffle.ParsedOpenApi{
		ID:   newmd5,
		Body: string(body),
	}

	log.Printf("[INFO] API LENGTH FOR %s: %d, ID: %s", api.Name, len(parsed.Body), newmd5)
	// FIXME: Might cause versioning issues if we re-use the same!!
	// FIXME: Need a way to track different versions of the same app properly.
	// Hint: Save API.id somewhere, and use newmd5 to save latest version

	if len(user.Id) > 0 {
		err = shuffle.SetOpenApiDatastore(ctx, newmd5, parsed)
		if err != nil {
			log.Printf("[ERROR] Failed saving app %s to database: %s", newmd5, err)
			resp.WriteHeader(500)
			resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%"}`, err)))
			return
		}

		shuffle.SetOpenApiDatastore(ctx, api.ID, parsed)
	} else {
		//log.Printf("
	}

	// Backup every single one

	/*
		err = increaseStatisticsField(ctx, "total_apps_created", newmd5, 1, user.ActiveOrg.Id)
		if err != nil {
			log.Printf("Failed to increase success execution stats: %s", err)
		}

		err = increaseStatisticsField(ctx, "openapi_apps_created", newmd5, 1, user.ActiveOrg.Id)
		if err != nil {
			log.Printf("Failed to increase success execution stats: %s", err)
		}
	*/

	cacheKey := fmt.Sprintf("workflowapps-sorted-100")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)
	shuffle.DeleteCache(ctx, fmt.Sprintf("apps_%s", user.Id))

	// Doing this last to ensure we can copy the docker image over
	// even though builds fail
	err = buildImage(dockerTags, dockerLocation)
	if err != nil {
		log.Printf("[ERROR] Docker build error: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Error in Docker build: %s"}`, err)))
		return
	}

	log.Printf("[DEBUG] Successfully built app %s (%s)", api.Name, api.ID)
	if len(user.Id) > 0 {
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "id": "%s"}`, api.ID)))
	}
}

// Creates an app from the app builder
func verifySwagger(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	//log.Printf("[INFO] TRY TO SET APP TO LIVE!!!")
	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in verify swagger: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to check swagger doc: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed reading body"}`))
		return
	}

	buildSwaggerApp(resp, body, user, false)
}

// Creates osfs from folderpath with a basepath as directory base
func createFs(basepath, pathname string) (billy.Filesystem, error) {
	log.Printf("[INFO] MemFS base: %s, pathname: %s", basepath, pathname)

	fs := memfs.New()
	err := filepath.Walk(pathname,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if strings.Contains(path, ".git") {
				return nil
			}

			// Fix the inner path here
			newpath := strings.ReplaceAll(path, pathname, "")
			fullpath := fmt.Sprintf("%s%s", basepath, newpath)
			switch mode := info.Mode(); {
			case mode.IsDir():
				err = fs.MkdirAll(fullpath, 0644)
				if err != nil {
					log.Printf("Failed making folder: %s", err)
				}
			case mode.IsRegular():
				srcData, err := ioutil.ReadFile(path)
				if err != nil {
					log.Printf("Src error: %s", err)
					return err
				}

				dst, err := fs.Create(fullpath)
				if err != nil {
					log.Printf("Dst error: %s", err)
					return err
				}

				_, err = dst.Write(srcData)
				if err != nil {
					log.Printf("Dst write error: %s", err)
					return err
				}
			}

			return nil
		})

	return fs, err
}

// Hotloads new apps from a folder
func handleAppHotload(ctx context.Context, location string, forceUpdate bool) error {

	basepath := "base"
	fs, err := createFs(basepath, location)
	if err != nil {
		log.Printf("Failed memfs creation - probably bad path: %s", err)
		return errors.New(fmt.Sprintf("Failed to find directory %s", location))
	} else {
		log.Printf("[INFO] Memfs creation from %s done", location)
	}

	dir, err := fs.ReadDir("")
	if err != nil {
		log.Printf("[WARNING] Failed reading folder: %s", err)
		return err
	}

	_, _, err = IterateAppGithubFolders(ctx, fs, dir, "", "", forceUpdate)
	if err != nil {
		log.Printf("[WARNING] Githubfolders error: %s", err)
		return err
	}

	cacheKey := fmt.Sprintf("workflowapps-sorted")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-100")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-500")
	shuffle.DeleteCache(ctx, cacheKey)
	cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
	shuffle.DeleteCache(ctx, cacheKey)
	//shuffle.DeleteCache(ctx, fmt.Sprintf("apps_%s", user.Id))

	return nil
}

func handleCloudExecutionOnprem(workflowId, startNode, executionSource, executionArgument string) error {
	ctx := context.Background()
	// 1. Get the workflow
	// 2. Execute it with the data
	workflow, err := shuffle.GetWorkflow(ctx, workflowId)
	if err != nil {
		return err
	}

	// FIXME: Handle auth
	_ = workflow

	parsedArgument := executionArgument
	newExec := shuffle.ExecutionRequest{
		ExecutionSource:   executionSource,
		ExecutionArgument: parsedArgument,
	}

	var execution shuffle.ExecutionRequest
	err = json.Unmarshal([]byte(parsedArgument), &execution)
	if err == nil {
		//log.Printf("[INFO] FOUND EXEC %#v", execution)
		if len(execution.ExecutionArgument) > 0 {
			parsedArgument := strings.Replace(string(execution.ExecutionArgument), "\\\"", "\"", -1)
			log.Printf("New exec argument: %s", execution.ExecutionArgument)

			if strings.HasPrefix(parsedArgument, "{") && strings.HasSuffix(parsedArgument, "}") {
				log.Printf("\nData is most likely JSON from %s\n", newExec.ExecutionSource)
			}

			newExec.ExecutionArgument = parsedArgument
		}
	} else {
		log.Printf("Unmarshal issue: %s", err)
	}

	if len(startNode) > 0 {
		newExec.Start = startNode
	}

	b, err := json.Marshal(newExec)
	if err != nil {
		log.Printf("Failed marshal")
		return err
	}

	//log.Println(string(b))
	newRequest := &http.Request{
		URL:    &url.URL{},
		Method: "POST",
		Body:   ioutil.NopCloser(bytes.NewReader(b)),
	}

	_, _, err = handleExecution(workflowId, shuffle.Workflow{}, newRequest, workflow.OrgId)
	return err
}

func handleCloudJob(job shuffle.CloudSyncJob) error {
	// May need authentication in all of these..?

	log.Printf("[INFO] Handle job with type %s and action %s", job.Type, job.Action)
	if job.Type == "outlook" {
		if job.Action == "execute" {
			// FIXME: Get the email
			ctx := context.Background()
			maildata := shuffle.MailDataOutlook{}
			err := json.Unmarshal([]byte(job.ThirdItem), &maildata)
			if err != nil {
				log.Printf("Maildata unmarshal error: %s", err)
				return err
			}

			hookId := job.Id
			hook, err := shuffle.GetTriggerAuth(ctx, hookId)
			if err != nil {
				log.Printf("[INFO] Failed getting trigger %s (callback cloud): %s", hookId, err)
				return err
			}

			redirectDomain := "localhost:5001"
			redirectUrl := fmt.Sprintf("http://%s/api/v1/triggers/outlook/register", redirectDomain)
			outlookClient, _, err := shuffle.GetOutlookClient(ctx, "", hook.OauthToken, redirectUrl)
			if err != nil {
				log.Printf("Oauth client failure - triggerauth: %s", err)
				return err
			}

			emails, err := shuffle.GetOutlookEmail(outlookClient, maildata)
			//log.Printf("EMAILS: %d", len(emails))
			//log.Printf("INSIDE GET OUTLOOK EMAIL!: %#v, %s", emails, err)

			//type FullEmail struct {
			email := shuffle.FullEmail{}
			if len(emails) == 1 {
				email = emails[0]
			}

			emailBytes, err := json.Marshal(email)
			if err != nil {
				log.Printf("[INFO] Failed email marshaling: %s", err)
				return err
			}

			log.Printf("[INFO] Should handle outlook webhook for workflow %s with start node %s and data of length %d", job.PrimaryItemId, job.SecondaryItem, len(job.ThirdItem))
			err = handleCloudExecutionOnprem(job.PrimaryItemId, job.SecondaryItem, "outlook", string(emailBytes))
			if err != nil {
				log.Printf("[WARNING] Failed executing workflow from cloud outlook hook: %s", err)
			} else {
				log.Printf("[INFO] Successfully executed workflow from cloud outlook hook!")
			}
		}
	} else if job.Type == "webhook" {
		if job.Action == "execute" {
			log.Printf("[INFO] Should handle normal webhook for workflow %s with start node %s and data %s", job.PrimaryItemId, job.SecondaryItem, job.ThirdItem)
			err := handleCloudExecutionOnprem(job.PrimaryItemId, job.SecondaryItem, "webhook", job.ThirdItem)
			if err != nil {
				log.Printf("[INFO] Failed executing workflow from cloud hook: %s", err)
			} else {
				log.Printf("[INFO] Successfully executed workflow from cloud hook!")
			}
		}

	} else if job.Type == "schedule" {
		if job.Action == "execute" {
			log.Printf("Should handle schedule for workflow %s with start node %s and data %s", job.PrimaryItemId, job.SecondaryItem, job.ThirdItem)
			err := handleCloudExecutionOnprem(job.PrimaryItemId, job.SecondaryItem, "schedule", job.ThirdItem)
			if err != nil {
				log.Printf("[INFO] Failed executing workflow from cloud schedule: %s", err)
			} else {
				log.Printf("[INFO] Successfully executed workflow from cloud schedule")
			}
		}
	} else if job.Type == "email_trigger" {
		if job.Action == "execute" {
			log.Printf("Should handle email for workflow %s with start node %s and data %s", job.PrimaryItemId, job.SecondaryItem, job.ThirdItem)
			err := handleCloudExecutionOnprem(job.PrimaryItemId, job.SecondaryItem, "email_trigger", job.ThirdItem)
			if err != nil {
				log.Printf("Failed executing workflow from email trigger: %s", err)
			} else {
				log.Printf("Successfully executed workflow from cloud email trigger")
			}
		}

	} else if job.Type == "user_input" {
		if job.Action == "continue" {
			log.Printf("Should handle user_input CONTINUE for workflow %s with start node %s and execution ID %s", job.PrimaryItemId, job.SecondaryItem, job.ThirdItem)
			// FIXME: Handle authorization
			ctx := context.Background()
			workflowExecution, err := shuffle.GetWorkflowExecution(ctx, job.ThirdItem)
			if err != nil {
				return err
			}

			if job.PrimaryItemId != workflowExecution.Workflow.ID {
				return errors.New("Bad workflow ID when stopping execution.")
			}

			workflowExecution.Status = "EXECUTING"
			err = shuffle.SetWorkflowExecution(ctx, *workflowExecution, true)
			if err != nil {
				return err
			}

			fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute?authorization=%s&start=%s&reference_execution=%s&answer=true", syncUrl, job.PrimaryItemId, job.FourthItem, job.SecondaryItem, job.ThirdItem)
			newRequest, err := http.NewRequest(
				"GET",
				fullUrl,
				nil,
			)
			if err != nil {
				log.Printf("Failed continuing workflow in request builder: %s", err)
				return err
			}

			_, _, err = handleExecution(job.PrimaryItemId, shuffle.Workflow{}, newRequest, job.OrgId)
			if err != nil {
				log.Printf("Failed continuing workflow from cloud user_input: %s", err)
				return err
			} else {
				log.Printf("Successfully executed workflow from cloud user_input")
			}
		} else if job.Action == "stop" {
			log.Printf("Should handle user_input STOP for workflow %s with start node %s and execution ID %s", job.PrimaryItemId, job.SecondaryItem, job.ThirdItem)
			ctx := context.Background()
			workflowExecution, err := shuffle.GetWorkflowExecution(ctx, job.ThirdItem)
			if err != nil {
				return err
			}

			if job.PrimaryItemId != workflowExecution.Workflow.ID {
				return errors.New("Bad workflow ID when stopping execution.")
			}

			/*
				if job.FourthItem != workflowExecution.Authorization {
					return errors.New("Bad authorization when stopping execution.")
				}
			*/

			newResults := []shuffle.ActionResult{}
			for _, result := range workflowExecution.Results {
				if result.Action.AppName == "User Input" && result.Result == "Waiting for user feedback based on configuration" {
					result.Status = "ABORTED"
					result.Result = "Aborted manually by user."
				}

				newResults = append(newResults, result)
			}

			workflowExecution.Results = newResults
			workflowExecution.Status = "ABORTED"
			err = shuffle.SetWorkflowExecution(ctx, *workflowExecution, true)
			if err != nil {
				return err
			}

			log.Printf("Successfully updated user input to aborted.")
		}
	} else {
		log.Printf("No handler for type %s and action %s", job.Type, job.Action)
	}

	return nil
}

// Handles jobs from remote (cloud)
func remoteOrgJobController(org shuffle.Org, body []byte) error {
	type retStruct struct {
		Success bool                   `json:"success"`
		Reason  string                 `json:"reason"`
		Jobs    []shuffle.CloudSyncJob `json:"jobs"`
	}

	responseData := retStruct{}
	err := json.Unmarshal(body, &responseData)
	if err != nil {
		return err
	}

	ctx := context.Background()
	if !responseData.Success {
		log.Printf("[WARNING] Should stop org job controller because no success?")

		if strings.Contains(strings.ToLower(responseData.Reason), "bad apikey") || strings.Contains(responseData.Reason, "Error getting the organization") || strings.Contains(responseData.Reason, "Organization isn't syncing") {
			log.Printf("[WARNING] Remote error; Bad apikey or org error. Stopping sync for org: %s", responseData.Reason)

			if value, exists := scheduledOrgs[org.Id]; exists {
				// Looks like this does the trick? Hurr
				log.Printf("[INFO] STOPPING ORG SCHEDULE for: %s", org.Id)
				value.Lock()
			} else {
				log.Printf("[INFO] Failed finding the schedule for org %s (%s)", org.Name, org.Id)
			}

			org, err := shuffle.GetOrg(ctx, org.Id)
			if err != nil {
				log.Printf("[WARNING] Failed finding org %s: %s", org.Id, err)
				return err
			}

			// Just in case
			org, err = handleStopCloudSync(syncUrl, *org)
			if err != nil {
				log.Printf("[ERROR] Failed stopping cloud sync remotely: %s", err)
			}

			org.SyncConfig.Interval = 0
			org.CloudSync = false
			org.SyncConfig.Apikey = ""

			startDate := time.Now().Unix()
			org.SyncFeatures.Webhook = shuffle.SyncData{Active: false, Type: "trigger", Name: "Webhook", StartDate: startDate}
			org.SyncFeatures.UserInput = shuffle.SyncData{Active: false, Type: "trigger", Name: "User Input", StartDate: startDate}
			org.SyncFeatures.EmailTrigger = shuffle.SyncData{Active: false, Type: "action", Name: "Email Trigger", StartDate: startDate}
			org.SyncFeatures.Schedules = shuffle.SyncData{Active: false, Type: "trigger", Name: "Schedule", StartDate: startDate, Limit: 0}
			org.SyncFeatures.SendMail = shuffle.SyncData{Active: false, Type: "action", Name: "Send Email", StartDate: startDate, Limit: 0}
			org.SyncFeatures.SendSms = shuffle.SyncData{Active: false, Type: "action", Name: "Send SMS", StartDate: startDate, Limit: 0}
			org.CloudSyncActive = false

			err = shuffle.SetOrg(ctx, *org, org.Id)
			if err != nil {
				log.Printf("[WARNING] Failed setting organization when stopping sync: %s", err)
			} else {
				log.Printf("[INFO] Successfully STOPPED org cloud sync for %s (%s)", org.Name, org.Id)
			}

			return nil
		}

		return errors.New("[ERROR] Remote job handler issues.")
	}

	if len(responseData.Jobs) > 0 {
		//log.Printf("[INFO] Remote JOB ret: %s", string(body))
		log.Printf("Got job with reason %s and %d job(s)", responseData.Reason, len(responseData.Jobs))
	}

	for _, job := range responseData.Jobs {
		err = handleCloudJob(job)
		if err != nil {
			log.Printf("[ERROR] Failed job from cloud: %s", err)
		}
	}

	return nil
}

func remoteOrgJobHandler(org shuffle.Org, interval int) error {
	client := &http.Client{}
	syncUrl := fmt.Sprintf("%s/api/v1/cloud/sync", syncUrl)
	req, err := http.NewRequest(
		"GET",
		syncUrl,
		nil,
	)

	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, org.SyncConfig.Apikey))
	newresp, err := client.Do(req)
	if err != nil {
		//log.Printf("Failed request in org sync: %s", err)
		return err
	}

	respBody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed body read in job sync: %s", err)
		return err
	}

	//log.Printf("Remote Data: %s", respBody)
	err = remoteOrgJobController(org, respBody)
	if err != nil {
		log.Printf("[ERROR] Failed job controller run for %s: %s", respBody, err)
		return err
	}
	return nil
}

func runInitCloudSetup() {
	action := shuffle.CloudSyncJob{
		Type:          "setup",
		Action:        "init",
		OrgId:         "",
		PrimaryItemId: "",
	}

	err := executeCloudAction(action, "")
	if err != nil {
		log.Printf("[INFO] Failed initial setup: %s", err)
	} else {
		log.Printf("[INFO] Ran initial setup!")
	}
}

func runInitEs(ctx context.Context) {
	log.Printf("[DEBUG] Starting INIT setup for Elasticsearch/Opensearch")

	httpProxy := os.Getenv("HTTP_PROXY")
	if len(httpProxy) > 0 {
		log.Printf("[INFO] Running with HTTP proxy %s (env: HTTP_PROXY)", httpProxy)
	}
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if len(httpsProxy) > 0 {
		log.Printf("[INFO] Running with HTTPS proxy %s (env: HTTPS_PROXY)", httpsProxy)
	}

	defaultEnv := os.Getenv("ORG_ID")
	if len(defaultEnv) == 0 {
		defaultEnv = "Shuffle"
		log.Printf("[DEBUG] Setting default environment for org to %s", defaultEnv)
	}

	log.Printf("[DEBUG] Getting organizations for Elasticsearch/Opensearch")
	activeOrgs, err := shuffle.GetAllOrgs(ctx)

	setUsers := false
	//log.Printf("ORGS: %d", len(activeOrgs))
	if err != nil {
		if fmt.Sprintf("%s", err) == "EOF" {
			time.Sleep(7 * time.Second)
			runInitEs(ctx)
			return
		}

		log.Printf("[DEBUG] Error getting organizations: %s", err)
		runInitCloudSetup()
	} else {
		// Add all users to it
		if len(activeOrgs) == 1 {
			setUsers = true
		} else if len(activeOrgs) == 0 {
			log.Printf(`[DEBUG] No orgs. Setting NEW org "default"`)
			runInitCloudSetup()

			//orgSetupName := "default"
			//orgId := uuid.NewV4().String()
			//newOrg := shuffle.Org{
			//	Name:      orgSetupName,
			//	Id:        orgId,
			//	Org:       orgSetupName,
			//	Users:     []shuffle.User{},
			//	Roles:     []string{"admin", "user"},
			//	CloudSync: false,
			//}

			//err = shuffle.SetOrg(ctx, newOrg, orgId)
			//if err != nil {
			//	log.Printf("Failed setting organization: %s", err)
			//} else {
			//	log.Printf("Successfully created the default org!")
			//	setUsers = true

			//	item := shuffle.Environment{
			//		Name:    defaultEnv,
			//		Type:    "onprem",
			//		OrgId:   orgId,
			//		Default: true,
			//		Id:      uuid.NewV4().String(),
			//	}

			//	err = shuffle.SetEnvironment(ctx, &item)
			//	if err != nil {
			//		log.Printf("[WARNING] Failed setting up new environment for new org")
			//	}
			//}

		} else {
			log.Printf("[DEBUG] Found %d org(s) in total.", len(activeOrgs))

			if len(activeOrgs) == 1 {
				if len(activeOrgs[0].Users) == 0 {
					log.Printf("ORG doesn't have any users??")

					users, err := shuffle.GetAllUsers(ctx)
					if err != nil && len(users) == 0 {
						log.Printf("Failed getting users in org fix")
					} else {
						// Remapping everyone to admin. This should never happen.

						for _, user := range users {
							user.ActiveOrg = shuffle.OrgMini{
								Id:   activeOrgs[0].Id,
								Name: activeOrgs[0].Name,
								Role: "admin",
							}

							activeOrgs[0].Users = append(activeOrgs[0].Users, user)
						}

						err = shuffle.SetOrg(ctx, activeOrgs[0], activeOrgs[0].Id)
						if err != nil {
							log.Printf("Failed setting org: %s", err)
						} else {
							log.Printf("Successfully updated org to have users!")
						}
					}

				}
			}
		}
	}

	_ = setUsers
	schedules, err := shuffle.GetAllSchedules(ctx, "ALL")
	if err != nil {
		log.Printf("[WARNING] Failed getting schedules during service init: %s", err)
	} else {
		log.Printf("[INFO] Setting up %d schedule(s)", len(schedules))

		url := &url.URL{}
		job := func(schedule shuffle.ScheduleOld) func() {
			return func() {
				log.Printf("[INFO] Running schedule %s with interval %d.", schedule.Id, schedule.Seconds)

				request := &http.Request{
					URL:    url,
					Method: "POST",
					Body:   ioutil.NopCloser(strings.NewReader(schedule.WrappedArgument)),
				}

				orgId := ""
				if len(activeOrgs) > 0 {
					orgId = activeOrgs[0].Id
				}

				_, _, err := handleExecution(schedule.WorkflowId, shuffle.Workflow{}, request, orgId)
				if err != nil {
					log.Printf("[WARNING] Failed to execute %s: %s", schedule.WorkflowId, err)
				}
			}
		}

		for _, schedule := range schedules {
			if strings.ToLower(schedule.Environment) == "cloud" {
				log.Printf("Skipping cloud schedule")
				continue
			}

			//log.Printf("Schedule: %#v", schedule)
			//log.Printf("Schedule time: every %d seconds", schedule.Seconds)
			jobret, err := newscheduler.Every(schedule.Seconds).Seconds().NotImmediately().Run(job(schedule))
			if err != nil {
				log.Printf("Failed to schedule workflow: %s", err)
			}

			scheduledJobs[schedule.Id] = jobret
		}
	}

	parsedApikey := ""
	users, err := shuffle.GetAllUsers(ctx)
	if len(users) == 0 {
		log.Printf("[INFO] Trying to set up user based on environments SHUFFLE_DEFAULT_USERNAME & SHUFFLE_DEFAULT_PASSWORD")
		username := os.Getenv("SHUFFLE_DEFAULT_USERNAME")
		password := os.Getenv("SHUFFLE_DEFAULT_PASSWORD")

		if len(username) == 0 || len(password) == 0 || len(activeOrgs) > 0 {
			log.Printf("[DEBUG] SHUFFLE_DEFAULT_USERNAME and SHUFFLE_DEFAULT_PASSWORD not defined as environments. Running without default user.")
		} else {
			apikey := os.Getenv("SHUFFLE_DEFAULT_APIKEY")

			if len(parsedApikey) == 0 {
				parsedApikey = apikey
			}

			log.Printf("[DEBUG] Creating org for default user %s", username)
			orgId := uuid.NewV4().String()
			orgSetupName := "default"
			newOrg := shuffle.Org{
				Name:      orgSetupName,
				Id:        orgId,
				Org:       orgSetupName,
				Users:     []shuffle.User{},
				Roles:     []string{"admin", "user"},
				CloudSync: false,
			}

			err = shuffle.SetOrg(ctx, newOrg, orgId)
			setUsers := false
			if err != nil {
				log.Printf("[WARNING] Failed setting organization when creating original user: %s", err)
			} else {
				log.Printf("[DEBUG] Successfully created the default org with id %s!", orgId)
				setUsers = true

				item := shuffle.Environment{
					Name:    defaultEnv,
					Type:    "onprem",
					OrgId:   orgId,
					Default: true,
					Id:      uuid.NewV4().String(),
				}

				err = shuffle.SetEnvironment(ctx, &item)
				if err != nil {
					log.Printf("[WARNING] Failed setting up new environment")
				}
			}

			if setUsers {
				tmpOrg := shuffle.OrgMini{
					Name: orgSetupName,
					Id:   orgId,
				}

				err = createNewUser(username, password, "admin", apikey, tmpOrg)
				if err != nil {
					log.Printf("[INFO] Failed to create default user %s: %s", username, err)
				} else {
					log.Printf("[INFO] Successfully created user %s", username)
				}
			}
		}
	} else {
		for _, user := range users {
			if user.Role == "admin" && len(user.ApiKey) > 0 {
				parsedApikey = user.ApiKey
				log.Printf("[DEBUG] Using apikey of %s (%s) for cleanup", user.Username, user.Id)
				break
			}
		}
	}

	log.Printf("[INFO] Starting cloud schedules for orgs if enabled!")
	type requestStruct struct {
		ApiKey string `json:"api_key"`
	}

	for _, org := range activeOrgs {
		if !org.CloudSync {
			log.Printf("[INFO] Skipping org syncCheck for %s because sync isn't set (1).", org.Id)
			continue
		}

		//interval := int(org.SyncConfig.Interval)
		interval := 15
		if interval == 0 {
			log.Printf("[WARNING] Skipping org %s because sync isn't set (0).", org.Id)
			continue
		}

		log.Printf("[DEBUG] Should start schedule for org %s (%s)", org.Name, org.Id)
		job := func() {
			err := remoteOrgJobHandler(org, interval)
			if err != nil {
				log.Printf("[ERROR] Failed request with remote org setup (2): %s", err)
			}
		}

		jobret, err := newscheduler.Every(int(interval)).Seconds().NotImmediately().Run(job)
		if err != nil {
			log.Printf("[CRITICAL] Failed to schedule org: %s", err)
		} else {
			log.Printf("[INFO] Started sync on interval %d for org %s (%s)", interval, org.Name, org.Id)
			scheduledOrgs[org.Id] = jobret
		}
	}

	forceUpdateEnv := os.Getenv("SHUFFLE_APP_FORCE_UPDATE")
	forceUpdate := false
	if len(forceUpdateEnv) > 0 && forceUpdateEnv == "true" {
		log.Printf("Forcing to rebuild apps")
		forceUpdate = true
	}

	// FIXME: Have this for all envs in all orgs (loop and find).
	if len(parsedApikey) > 0 {
		cleanupSchedule := 300

		if len(os.Getenv("SHUFFLE_RERUN_SCHEDULE")) > 0 {
			newfrequency, err := strconv.Atoi(os.Getenv("SHUFFLE_RERUN_SCHEDULE"))
			if err == nil {
				cleanupSchedule = newfrequency

				if cleanupSchedule < 300 {
					log.Printf("[WARNING] A Cleanupschedule of less than 300 seconds won't help.")
					cleanupSchedule = 300
				}
			}
		}

		environments := []string{"Shuffle"}
		log.Printf("[DEBUG] Starting schedule setup for execution cleanup every %d seconds. Running first immediately.", cleanupSchedule)
		cleanupJob := func() func() {
			return func() {
				log.Printf("[INFO] Running schedule for cleaning up or re-running unfinished workflows in %d environments.", len(environments))

				for _, environment := range environments {
					httpClient := &http.Client{}
					url := fmt.Sprintf("http://localhost:5001/api/v1/environments/%s/stop", environment)
					req, err := http.NewRequest(
						"GET",
						url,
						nil,
					)

					req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, parsedApikey))
					if err != nil {
						log.Printf("[ERROR] Failed CREATING environment request for %s: %s", environment, err)
						continue

					}

					newresp, err := httpClient.Do(req)
					if err != nil {
						log.Printf("[ERROR] Failed running environment request %s: %s", environment, err)
						continue
					}

					respBody, err := ioutil.ReadAll(newresp.Body)
					if err != nil {
						log.Printf("[ERROR] Failed setting respbody %s", err)
						continue
					}
					log.Printf("[DEBUG] Successfully ran workflow cleanup request for %s. Body: %s", environment, string(respBody))

					url = fmt.Sprintf("http://localhost:5001/api/v1/environments/%s/rerun", environment)
					req, err = http.NewRequest(
						"GET",
						url,
						nil,
					)

					req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, parsedApikey))
					if err != nil {
						log.Printf("[ERROR] Failed CREATING environment request to rerun for %s: %s", environment, err)
						continue

					}

					newresp, err = httpClient.Do(req)
					if err != nil {
						log.Printf("[ERROR] Failed running environment request to rerun for %s: %s", environment, err)
						continue
					}

					respBody, err = ioutil.ReadAll(newresp.Body)
					if err != nil {
						log.Printf("[ERROR] Failed setting respbody %s", err)
						continue
					}
					log.Printf("[DEBUG] Successfully ran workflow RERUN request for %s. Body: %s", environment, string(respBody))
				}
			}
		}

		jobret, err := newscheduler.Every(cleanupSchedule).Seconds().Run(cleanupJob())
		if err != nil {
			log.Printf("[ERROR] Failed to schedule Cleanup: %s", err)
		} else {
			_ = jobret
		}
	} else {
		log.Printf("[DEBUG] Couldn't find a valid API-key, hence couldn't run cleanup")
	}

	// Getting apps to see if we should initialize a test
	// FIXME: Isn't this a little backwards?
	workflowapps, err := shuffle.GetAllWorkflowApps(ctx, 1000, 0)
	log.Printf("[INFO] Getting and validating workflowapps. Got %d with err %#v", len(workflowapps), err)

	// accept any certificate (might be useful for testing)
	//customGitClient := &http.Client{
	//	Transport: &http.Transport{
	//		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	//	},
	//	Timeout: 15 * time.Second,
	//}
	//client.InstallProtocol("http", githttp.NewClient(customGitClient))
	//client.InstallProtocol("https", githttp.NewClient(customGitClient))

	if err != nil && len(workflowapps) == 0 {
		log.Printf("[WARNING] Failed getting apps (runInit): %s", err)
	} else if err == nil {
		log.Printf("[DEBUG] Downloading default apps")
		fs := memfs.New()
		storer := memory.NewStorage()

		url := os.Getenv("SHUFFLE_APP_DOWNLOAD_LOCATION")
		if len(url) == 0 {
			log.Printf("[INFO] Skipping download of apps since no URL is set. Default would be https://github.com/frikky/shuffle-apps")
			//url = ""
			//return
		}

		username := os.Getenv("SHUFFLE_DOWNLOAD_AUTH_USERNAME")
		password := os.Getenv("SHUFFLE_DOWNLOAD_AUTH_PASSWORD")

		cloneOptions := &git.CloneOptions{
			URL: url,
		}

		if len(username) > 0 && len(password) > 0 {
			cloneOptions.Auth = &http2.BasicAuth{
				Username: username,
				Password: password,
			}
		}

		branch := os.Getenv("SHUFFLE_DOWNLOAD_AUTH_BRANCH")
		if len(branch) > 0 && branch != "master" && branch != "main" {
			cloneOptions.ReferenceName = plumbing.ReferenceName(branch)
		}

		log.Printf("[DEBUG] Getting apps from %s", url)

		r, err := git.Clone(storer, fs, cloneOptions)

		if err != nil {
			log.Printf("[WARNING] Failed loading repo into memory (init): %s", err)
		}

		dir, err := fs.ReadDir("")
		if err != nil {
			log.Printf("[WARNING] Failed reading folder (init): %s", err)
		}
		_ = r
		//iterateAppGithubFolders(fs, dir, "", "testing")

		// FIXME: Get all the apps?
		_, _, err = IterateAppGithubFolders(ctx, fs, dir, "", "", forceUpdate)
		if err != nil {
			log.Printf("[WARNING] Error from app load in init: %s", err)
		}
		//_, _, err = iterateAppGithubFolders(fs, dir, "", "", forceUpdate)

		// Hotloads locally
		location := os.Getenv("SHUFFLE_APP_HOTLOAD_FOLDER")
		if len(location) != 0 {
			handleAppHotload(ctx, location, false)
		}
	}

	log.Printf("[INFO] Downloading OpenAPI data for search - EXTRA APPS")
	apis := "https://github.com/frikky/security-openapis"

	// THis gets memory problems hahah
	//apis := "https://github.com/APIs-guru/openapi-directory"
	fs := memfs.New()
	storer := memory.NewStorage()
	cloneOptions := &git.CloneOptions{
		URL: apis,
	}
	_, err = git.Clone(storer, fs, cloneOptions)
	if err != nil {
		log.Printf("[WARNING] Failed loading repo %s into memory: %s", apis, err)
	} else {
		log.Printf("[INFO] Finished git clone. Looking for updates to the repo.")
		dir, err := fs.ReadDir("")
		if err != nil {
			log.Printf("Failed reading folder: %s", err)
		}

		iterateOpenApiGithub(fs, dir, "", "")
		log.Printf("[INFO] Finished downloading extra API samples")
	}

	log.Printf("[INFO] Finished INIT (ES)")
}

// Handles configuration items during Shuffle startup
func runInit(ctx context.Context) {
	// Setting stats for backend starts (failure count as well)
	//err := increaseStatisticsField(ctx, "backend_executions", "", 1, "")
	//if err != nil {
	//	log.Printf("Failed increasing local stats: %s", err)
	//}
	//log.Printf("[DEBUG] Finalized init statistics update")

	log.Printf("[DEBUG] Starting INIT setup (NOT Opensearch/Elasticsearch!)")
	httpProxy := os.Getenv("HTTP_PROXY")
	if len(httpProxy) > 0 {
		log.Printf("Running with HTTP proxy %s (env: HTTP_PROXY)", httpProxy)
	}
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if len(httpsProxy) > 0 {
		log.Printf("Running with HTTPS proxy %s (env: HTTPS_PROXY)", httpsProxy)
	}

	//requestCache = cache.New(5*time.Minute, 10*time.Minute)

	/*
			proxyUrl, err := url.Parse(httpProxy)
			if err != nil {
				log.Printf("Failed setting up proxy: %s", err)
			} else {
				// accept any certificate (might be useful for testing)
				customClient := &http.Client{
					Transport: &http.Transport{
						TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
						Proxy:           http.ProxyURL(proxyUrl),
					},

					// 15 second timeout
					Timeout: 15 * 15time.Second,

					// don't follow redirect
					CheckRedirect: func(req *http.Request, via []*http.Request) error {
						return http.ErrUseLastResponse
					},
				}

				// Override http(s) default protocol to use our custom client
				client.InstallProtocol("http", githttp.NewClient(customClient))
				client.InstallProtocol("https", githttp.NewClient(customClient))
			}
		}

		httpsProxy := os.Getenv("SHUFFLE_HTTPS_PROXY")
		if len(httpsProxy) > 0 {
			log.Printf("Running with HTTPS proxy %s", httpsProxy)
		}
	*/

	setUsers := false
	log.Printf("[DEBUG] Getting organizations")
	orgQuery := datastore.NewQuery("Organizations")
	var activeOrgs []shuffle.Org
	_, err := dbclient.GetAll(ctx, orgQuery, &activeOrgs)
	if err != nil {
		log.Printf("Error getting organizations!")
	} else {
		// Add all users to it
		if len(activeOrgs) == 1 {
			setUsers = true
		}

		log.Printf("Organizations exist!")
		if len(activeOrgs) == 0 {
			log.Printf(`[DEBUG] No orgs. Setting org "default"`)
			orgSetupName := "default"
			orgId := uuid.NewV4().String()
			newOrg := shuffle.Org{
				Name:      orgSetupName,
				Id:        orgId,
				Org:       orgSetupName,
				Users:     []shuffle.User{},
				Roles:     []string{"admin", "user"},
				CloudSync: false,
			}

			err = shuffle.SetOrg(ctx, newOrg, orgId)
			if err != nil {
				log.Printf("Failed setting organization: %s", err)
			} else {
				log.Printf("Successfully created the default org!")
				setUsers = true
			}
		} else {
			log.Printf("[DEBUG] There are %d org(s).", len(activeOrgs))

			if len(activeOrgs) == 1 {
				if len(activeOrgs[0].Users) == 0 {
					log.Printf("[WARNING] ORG doesn't have any users??")

					q := datastore.NewQuery("Users")
					var users []shuffle.User
					_, err = dbclient.GetAll(ctx, q, &users)
					if err != nil && len(users) == 0 {
						log.Printf("Failed getting users in org fix")
					} else {
						// Remapping everyone to admin. This should never happen.

						for _, user := range users {
							user.ActiveOrg = shuffle.OrgMini{
								Id:   activeOrgs[0].Id,
								Name: activeOrgs[0].Name,
								Role: "admin",
							}

							activeOrgs[0].Users = append(activeOrgs[0].Users, user)
						}

						err = shuffle.SetOrg(ctx, activeOrgs[0], activeOrgs[0].Id)
						if err != nil {
							log.Printf("Failed setting org: %s", err)
						} else {
							log.Printf("Successfully updated org to have users!")
						}
					}

				}
			}
		}
	}

	// Adding the users to the base organization since only one exists (default)
	if setUsers && len(activeOrgs) > 0 {
		activeOrg := activeOrgs[0]

		q := datastore.NewQuery("Users")
		var users []shuffle.User
		_, err = dbclient.GetAll(ctx, q, &users)
		if err == nil {
			setOrgBool := false
			usernames := []string{}
			for _, user := range users {
				usernames = append(usernames, user.Username)
				newUser := shuffle.User{
					Username: user.Username,
					Id:       user.Id,
					ActiveOrg: shuffle.OrgMini{
						Id: activeOrg.Id,
					},
					Orgs: []string{activeOrg.Id},
					Role: user.Role,
				}

				found := false
				for _, orgUser := range activeOrg.Users {
					if user.Id == orgUser.Id {
						found = true
					}
				}

				if !found && len(user.Username) > 0 {
					log.Printf("Adding user %s to org %s", user.Username, activeOrg.Name)
					activeOrg.Users = append(activeOrg.Users, newUser)
					setOrgBool = true
				}
			}

			log.Printf("Users found: %s", strings.Join(usernames, ", "))

			if setOrgBool {
				err = shuffle.SetOrg(ctx, activeOrg, activeOrg.Id)
				if err != nil {
					log.Printf("Failed setting org %s: %s!", activeOrg.Name, err)
				} else {
					log.Printf("UPDATED org %s!", activeOrg.Name)
				}
			}
		}

		log.Printf("Should add %d users to organization default", len(users))
	}

	if len(activeOrgs) == 0 {
		orgQuery := datastore.NewQuery("Organizations")
		_, err = dbclient.GetAll(ctx, orgQuery, &activeOrgs)
		if err != nil {
			log.Printf("Failed getting orgs the second time around")
		}
	}

	// Fix active users etc
	q := datastore.NewQuery("Users").Filter("active =", true)
	var activeusers []shuffle.User
	_, err = dbclient.GetAll(ctx, q, &activeusers)
	if err != nil && len(activeusers) == 0 {
		log.Printf("Error getting users during init: %s", err)
	} else {
		log.Printf("Parsing all users and setting them to active.")
		q := datastore.NewQuery("Users")
		var users []shuffle.User
		_, err := dbclient.GetAll(ctx, q, &users)
		//log.Printf("User ret: %s", err)

		if len(activeusers) == 0 && len(users) > 0 {
			log.Printf("No active users found - setting ALL to active")
			if err == nil {
				for _, user := range users {
					user.Active = true
					if len(user.Username) == 0 {
						shuffle.DeleteKey(ctx, "Users", strings.ToLower(user.Username))
						continue
					}

					if len(user.Role) > 0 {
						user.Roles = append(user.Roles, user.Role)
					}

					if len(user.Orgs) == 0 {
						defaultName := "default"
						user.Orgs = []string{defaultName}
						user.ActiveOrg = shuffle.OrgMini{
							Name: defaultName,
							Role: "admin",
						}
					}

					err = shuffle.SetUser(ctx, &user, true)
					if err != nil {
						log.Printf("Failed to reset user")
					} else {
						log.Printf("Remade user %s with ID", user.Id)
						err = shuffle.DeleteKey(ctx, "Users", strings.ToLower(user.Username))
						if err != nil {
							log.Printf("Failed to delete old user by username")
						}
					}
				}
			}
		} else if len(users) == 0 {
			log.Printf("Trying to set up user based on environments SHUFFLE_DEFAULT_USERNAME & SHUFFLE_DEFAULT_PASSWORD")
			username := os.Getenv("SHUFFLE_DEFAULT_USERNAME")
			password := os.Getenv("SHUFFLE_DEFAULT_PASSWORD")
			if len(username) == 0 || len(password) == 0 {
				log.Printf("SHUFFLE_DEFAULT_USERNAME and SHUFFLE_DEFAULT_PASSWORD not defined as environments. Running without default user.")
			} else {
				apikey := os.Getenv("SHUFFLE_DEFAULT_APIKEY")

				tmpOrg := shuffle.OrgMini{
					Name: "default",
				}

				err = createNewUser(username, password, "admin", apikey, tmpOrg)
				if err != nil {
					log.Printf("Failed to create default user %s: %s", username, err)
				} else {
					log.Printf("Successfully created user %s", username)
				}
			}
		} else {
			if len(users) < 10 && len(users) > 0 {
				for _, user := range users {
					log.Printf("[INFO] Username: %s, role: %s", user.Username, user.Role)
				}
			} else {
				log.Printf("[INIT] Found %d users.", len(users))
			}

			if len(activeOrgs) == 1 && len(users) > 0 {
				for _, user := range users {
					if user.ActiveOrg.Id == "" && len(user.Username) > 0 {
						user.ActiveOrg = shuffle.OrgMini{
							Id:   activeOrgs[0].Id,
							Name: activeOrgs[0].Name,
						}

						err = shuffle.SetUser(ctx, &user, true)
						if err != nil {
							log.Printf("Failed updating user %s with org", user.Username)
						} else {
							log.Printf("Updated user %s to have org", user.Username)
						}
					}
				}
			}
			//log.Printf(users[0].Username)
		}
	}

	// Gets environments and inits if it doesn't exist
	count, err := shuffle.GetEnvironmentCount()
	if count == 0 && err == nil && len(activeOrgs) == 1 {
		log.Printf("[INFO] Setting up environment with org %s", activeOrgs[0].Id)

		defaultEnv := os.Getenv("ORG_ID")
		if len(defaultEnv) == 0 {
			defaultEnv = "Shuffle"
			log.Printf("[DEBUG] Setting default environment for org to %s", defaultEnv)
		}

		item := shuffle.Environment{
			Name:    defaultEnv,
			Type:    "onprem",
			OrgId:   activeOrgs[0].Id,
			Default: true,
			Id:      uuid.NewV4().String(),
		}

		err = shuffle.SetEnvironment(ctx, &item)
		if err != nil {
			log.Printf("[WARNING] Failed setting up new environment")
		}
	} else if len(activeOrgs) == 1 {
		log.Printf("[INFO] Setting up all environments with org %s", activeOrgs[0].Id)
		var environments []shuffle.Environment
		q := datastore.NewQuery("Environments")
		_, err = dbclient.GetAll(ctx, q, &environments)
		if err == nil {
			existingEnv := []string{}
			_ = existingEnv
			for _, item := range environments {
				//if shuffle.ArrayContains(existingEnv, item.Name) {
				//	log.Printf("[WARNING] Env %s already exists - deleting it. %#v", item.Name, item)
				//	err = DeleteKey(ctx, "Environments", item.Name)
				//	if err != nil {
				//		log.Printf("[WARNING] Env deletion error: %s", err)
				//	}

				//	continue
				//}

				//existingEnv = append(existingEnv, item.Name)

				if item.OrgId == activeOrgs[0].Id && len(item.Id) > 0 {
					continue
				}

				if len(item.Id) == 0 {
					item.Id = uuid.NewV4().String()
				}

				item.OrgId = activeOrgs[0].Id
				err = shuffle.SetEnvironment(ctx, &item)
				if err != nil {
					log.Printf("[WARNING] Failed adding environment to org %s", activeOrgs[0].Id)
				}
			}
		}
	}

	// Fixing workflows to have real activeorg IDs
	//workflowQ := datastore.NewQuery("workflow")
	//ret, err := dbclient.GetAll(ctx, workflowQ, &workflows)
	//log.Printf("[INFO] Found %d workflows during startup", workflowCount)
	//log.Printf("%#v, %s", ret, err)

	var workflows []shuffle.Workflow
	if len(activeOrgs) == 1 {
		q := datastore.NewQuery("workflow").Limit(35)
		_, err = dbclient.GetAll(ctx, q, &workflows)
		if err != nil && len(workflows) == 0 {
			log.Printf("Error getting workflows in runinit: %s", err)
		} else {
			updated := 0
			timeNow := time.Now().Unix()
			for _, workflow := range workflows {
				setLocal := false
				if workflow.ExecutingOrg.Id == "" || len(workflow.OrgId) == 0 {
					workflow.OrgId = activeOrgs[0].Id
					workflow.ExecutingOrg = shuffle.OrgMini{
						Id:   activeOrgs[0].Id,
						Name: activeOrgs[0].Name,
					}

					setLocal = true
				} else if workflow.Edited == 0 {
					workflow.Edited = timeNow
					setLocal = true
				}

				if setLocal {
					err = shuffle.SetWorkflow(ctx, workflow, workflow.ID)
					if err != nil {
						log.Printf("Failed setting workflow in init: %s", err)
					} else {
						log.Printf("Fixed workflow %s to have the right info.", workflow.ID)
						updated += 1
					}
				}
			}

			if updated > 0 {
				log.Printf("Set workflow orgs for %d workflows", updated)
			}
		}

		/*
			fileq := datastore.NewQuery("Files").Limit(1)
			count, err := dbclient.Count(ctx, fileq)
			log.Printf("FILECOUNT: %d", count)
			if err == nil && count < 10 {
				basepath := "."
				filename := "testfile.txt"
				fileId := uuid.NewV4().String()
				log.Printf("Creating new file reference %s because none exist!", fileId)
				workflowId := "2cf1169d-b460-41de-8c36-28b2092866f8"
				downloadPath := fmt.Sprintf("%s/%s/%s/%s", basepath, activeOrgs[0].Id, workflowId, fileId)

				timeNow := time.Now().Unix()
				newFile := File{
					Id:           fileId,
					CreatedAt:    timeNow,
					UpdatedAt:    timeNow,
					Description:  "Created by system for testing",
					Status:       "active",
					Filename:     filename,
					OrgId:        activeOrgs[0].Id,
					WorkflowId:   workflowId,
					DownloadPath: downloadPath,
				}

				err = setFile(ctx, newFile)
				if err != nil {
					log.Printf("Failed setting file: %s", err)
				} else {
					log.Printf("Created file %s in init", newFile.DownloadPath)
				}
			}
		*/

		var allworkflowapps []shuffle.AppAuthenticationStorage
		q = datastore.NewQuery("workflowappauth")
		_, err = dbclient.GetAll(ctx, q, &allworkflowapps)
		if err == nil {
			log.Printf("Setting up all app auths with org %s", activeOrgs[0].Id)
			for _, item := range allworkflowapps {
				if item.OrgId != "" {
					continue
				}

				//log.Printf("Should update auth for %#v!", item)
				item.OrgId = activeOrgs[0].Id
				err = shuffle.SetWorkflowAppAuthDatastore(ctx, item, item.Id)
				if err != nil {
					log.Printf("Failed adding AUTH to org %s", activeOrgs[0].Id)
				}
			}
		}

		var schedules []shuffle.ScheduleOld
		q = datastore.NewQuery("schedules")
		_, err = dbclient.GetAll(ctx, q, &schedules)
		if err == nil {
			log.Printf("Setting up all schedules with org %s", activeOrgs[0].Id)
			for _, item := range schedules {
				if item.Org != "" {
					continue
				}

				if item.Environment == "cloud" {
					log.Printf("Skipping cloud schedule")
					continue
				}

				item.Org = activeOrgs[0].Id
				err = shuffle.SetSchedule(ctx, item)
				if err != nil {
					log.Printf("Failed adding schedule to org %s", activeOrgs[0].Id)
				}
			}
		}
	}

	log.Printf("Starting cloud schedules for orgs!")
	type requestStruct struct {
		ApiKey string `json:"api_key"`
	}
	for _, org := range activeOrgs {
		if !org.CloudSync {
			log.Printf("Skipping org %s because sync isn't set (1).", org.Id)
			continue
		}

		//interval := int(org.SyncConfig.Interval)
		interval := 15
		if interval == 0 {
			log.Printf("Skipping org %s because sync isn't set (0).", org.Id)
			continue
		}

		log.Printf("[DEBUG] Should start schedule for org %s (%s)", org.Name, org.Id)
		job := func() {
			err := remoteOrgJobHandler(org, interval)
			if err != nil {
				log.Printf("[ERROR] Failed request with remote org setup (2): %s", err)
			}
		}

		jobret, err := newscheduler.Every(int(interval)).Seconds().NotImmediately().Run(job)
		if err != nil {
			log.Printf("[CRITICAL] Failed to schedule org: %s", err)
		} else {
			log.Printf("Started sync on interval %d for org %s", interval, org.Name)
			scheduledOrgs[org.Id] = jobret
		}
	}

	// Gets schedules and starts them
	log.Printf("Relaunching schedules")
	schedules, err := shuffle.GetAllSchedules(ctx, "ALL")
	if err != nil {
		log.Printf("Failed getting schedules during service init: %s", err)
	} else {
		log.Printf("Setting up %d schedule(s)", len(schedules))
		url := &url.URL{}
		for _, schedule := range schedules {
			if schedule.Environment == "cloud" {
				log.Printf("Skipping cloud schedule")
				continue
			}

			//log.Printf("Schedule: %#v", schedule)
			job := func() {
				//log.Printf("[INFO] Running schedule %s with interval %d.", schedule.Id, schedule.Seconds)
				//log.Printf("ARG: %s", schedule.WrappedArgument)

				request := &http.Request{
					URL:    url,
					Method: "POST",
					Body:   ioutil.NopCloser(strings.NewReader(schedule.WrappedArgument)),
				}

				orgId := ""
				if len(activeOrgs) > 0 {
					orgId = activeOrgs[0].Id
				}

				_, _, err := handleExecution(schedule.WorkflowId, shuffle.Workflow{}, request, orgId)
				if err != nil {
					log.Printf("[WARNING] Failed to execute %s: %s", schedule.WorkflowId, err)
				}
			}

			//log.Printf("Schedule time: every %d seconds", schedule.Seconds)
			jobret, err := newscheduler.Every(schedule.Seconds).Seconds().NotImmediately().Run(job)
			if err != nil {
				log.Printf("Failed to schedule workflow: %s", err)
			}

			scheduledJobs[schedule.Id] = jobret
		}
	}

	// form force-flag to download workflow apps
	forceUpdateEnv := os.Getenv("SHUFFLE_APP_FORCE_UPDATE")
	forceUpdate := false
	if len(forceUpdateEnv) > 0 && forceUpdateEnv == "true" {
		log.Printf("Forcing to rebuild apps")
		forceUpdate = true
	}

	// Getting apps to see if we should initialize a test
	workflowapps, err := shuffle.GetAllWorkflowApps(ctx, 1000, 0)
	log.Printf("[INFO] Getting and validating workflowapps. Got %d with err %s", len(workflowapps), err)
	if err != nil && len(workflowapps) == 0 {
		log.Printf("[WARNING] Failed getting apps (runInit): %s", err)
	} else if err == nil && len(workflowapps) > 0 {
		var allworkflowapps []shuffle.WorkflowApp
		q := datastore.NewQuery("workflowapp")
		_, err := dbclient.GetAll(ctx, q, &allworkflowapps)
		if err == nil {
			for _, workflowapp := range allworkflowapps {
				if workflowapp.Edited == 0 {
					err = shuffle.SetWorkflowAppDatastore(ctx, workflowapp, workflowapp.ID)
					if err == nil {
						log.Printf("[INFO] Updating time for workflowapp %s:%s", workflowapp.Name, workflowapp.AppVersion)
					}
				}
			}
		}

	} else if err == nil && len(workflowapps) == 0 {
		log.Printf("Downloading default workflow apps")
		fs := memfs.New()
		storer := memory.NewStorage()

		url := os.Getenv("SHUFFLE_APP_DOWNLOAD_LOCATION")
		if len(url) == 0 {
			url = "https://github.com/frikky/shuffle-apps"
		}

		username := os.Getenv("SHUFFLE_DOWNLOAD_AUTH_USERNAME")
		password := os.Getenv("SHUFFLE_DOWNLOAD_AUTH_PASSWORD")

		cloneOptions := &git.CloneOptions{
			URL: url,
		}

		if len(username) > 0 && len(password) > 0 {
			cloneOptions.Auth = &http2.BasicAuth{
				Username: username,
				Password: password,
			}
		}
		branch := os.Getenv("SHUFFLE_DOWNLOAD_AUTH_BRANCH")
		if len(branch) > 0 && branch != "master" && branch != "main" {
			cloneOptions.ReferenceName = plumbing.ReferenceName(branch)
		}

		log.Printf("[DEBUG] Getting apps from %s", url)

		r, err := git.Clone(storer, fs, cloneOptions)

		if err != nil {
			log.Printf("Failed loading repo into memory (init): %s", err)
		}

		dir, err := fs.ReadDir("")
		if err != nil {
			log.Printf("Failed reading folder: %s", err)
		}
		_ = r
		//iterateAppGithubFolders(fs, dir, "", "testing")

		// FIXME: Get all the apps?
		_, _, err = IterateAppGithubFolders(ctx, fs, dir, "", "", forceUpdate)
		if err != nil {
			log.Printf("[WARNING] Error from app load in init: %s", err)
		}
		//_, _, err = iterateAppGithubFolders(fs, dir, "", "", forceUpdate)

		// Hotloads locally
		location := os.Getenv("SHUFFLE_APP_HOTLOAD_FOLDER")
		if len(location) != 0 {
			handleAppHotload(ctx, location, false)
		}
	}

	log.Printf("[INFO] Downloading OpenAPI data for search - EXTRA APPS")
	apis := "https://github.com/frikky/security-openapis"

	// FIXME: This part gets memory problems. Fix in the future to load these apps too.
	//apis := "https://github.com/APIs-guru/openapi-directory"
	fs := memfs.New()
	storer := memory.NewStorage()
	cloneOptions := &git.CloneOptions{
		URL: apis,
	}
	_, err = git.Clone(storer, fs, cloneOptions)
	if err != nil {
		log.Printf("Failed loading repo %s into memory: %s", apis, err)
	} else {
		log.Printf("[INFO] Finished git clone. Looking for updates to the repo.")
		dir, err := fs.ReadDir("")
		if err != nil {
			log.Printf("Failed reading folder: %s", err)
		}

		iterateOpenApiGithub(fs, dir, "", "")
		log.Printf("[INFO] Finished downloading extra API samples")
	}

	workflowLocation := os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_LOCATION")
	if len(workflowLocation) > 0 {
		log.Printf("[INFO] Downloading WORKFLOWS from %s if no workflows - EXTRA workflows", workflowLocation)
		q := datastore.NewQuery("workflow").Limit(35)
		var workflows []shuffle.Workflow
		_, err = dbclient.GetAll(ctx, q, &workflows)
		if err != nil && len(workflows) == 0 {
			log.Printf("Error getting workflows: %s", err)
		} else {
			if len(workflows) == 0 {
				username := os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_USERNAME")
				password := os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_PASSWORD")
				orgId := ""
				if len(activeOrgs) > 0 {
					orgId = activeOrgs[0].Id
				}

				err = loadGithubWorkflows(workflowLocation, username, password, "", os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_BRANCH"), orgId)
				if err != nil {
					log.Printf("Failed to upload workflows from github: %s", err)
				} else {
					log.Printf("[INFO] Finished downloading workflows from github!")
				}
			} else {
				log.Printf("[INFO] Skipping because there are %d workflows already", len(workflows))
			}

		}
	}

	log.Printf("[INFO] Finished INIT")
}

func handleVerifyCloudsync(orgId string) (shuffle.SyncFeatures, error) {
	ctx := context.Background()
	org, err := shuffle.GetOrg(ctx, orgId)
	if err != nil {
		return shuffle.SyncFeatures{}, err
	}

	//r.HandleFunc("/api/v1/getorgs", handleGetOrgs).Methods("GET", "OPTIONS")

	syncURL := fmt.Sprintf("%s/api/v1/cloud/sync/get_access", syncUrl)
	client := &http.Client{}
	req, err := http.NewRequest(
		"GET",
		syncURL,
		nil,
	)

	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, org.SyncConfig.Apikey))
	newresp, err := client.Do(req)
	if err != nil {
		return shuffle.SyncFeatures{}, err
	}

	respBody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		return shuffle.SyncFeatures{}, err
	}

	responseData := retStruct{}
	err = json.Unmarshal(respBody, &responseData)
	if err != nil {
		return shuffle.SyncFeatures{}, err
	}

	if newresp.StatusCode != 200 {
		return shuffle.SyncFeatures{}, errors.New(fmt.Sprintf("Got status code %d when getting org remotely. Expected 200. Contact support.", newresp.StatusCode))
	}

	if !responseData.Success {
		return shuffle.SyncFeatures{}, errors.New(responseData.Reason)
	}

	return responseData.SyncFeatures, nil
}

// Actually stops syncing with cloud for an org.
// Disables potential schedules, removes environments, breaks workflows etc.
func handleStopCloudSync(syncUrl string, org shuffle.Org) (*shuffle.Org, error) {
	if len(org.SyncConfig.Apikey) == 0 {
		return &org, errors.New(fmt.Sprintf("Couldn't find any sync key to disable org %s", org.Id))
	}

	log.Printf("[INFO] Should run cloud sync disable for org %s with URL %s and sync key %s", org.Id, syncUrl, org.SyncConfig.Apikey)

	client := &http.Client{}
	req, err := http.NewRequest(
		"DELETE",
		syncUrl,
		nil,
	)

	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, org.SyncConfig.Apikey))
	newresp, err := client.Do(req)
	if err != nil {
		return &org, err
	}

	respBody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		return &org, err
	}
	log.Printf("Remote disable ret: %s", string(respBody))

	responseData := retStruct{}
	err = json.Unmarshal(respBody, &responseData)
	if err != nil {
		return &org, err
	}

	// FIXME: If it says bad API-key, stop cloud sync for the Org
	if newresp.StatusCode != 200 {
		return &org, errors.New(fmt.Sprintf("Got status code %d when disabling org remotely. Expected 200. Contact support.", newresp.StatusCode))
	}

	if !responseData.Success {
		//log.Printf("Success reason: %s", responseData.Reason)
		return &org, errors.New(responseData.Reason)
	}

	log.Printf("[INFO] Everything is success. Should disable org sync for %s", org.Id)

	ctx := context.Background()
	org.CloudSync = false
	org.SyncFeatures = shuffle.SyncFeatures{}
	org.SyncConfig = shuffle.SyncConfig{}

	err = shuffle.SetOrg(ctx, org, org.Id)
	if err != nil {
		newerror := fmt.Sprintf("[WARNING] ERROR: Failed updating even though there was success: %s", err)
		log.Printf(newerror)
		return &org, errors.New(newerror)
	}

	environments, err := shuffle.GetEnvironments(ctx, org.Id)
	if err != nil {
		log.Printf("[WARNING] Failed getting envs in stop sync: %s", err)
		return &org, err
	}

	// Don't disable, this will be deleted entirely
	for _, environment := range environments {
		if environment.Type == "cloud" {
			environment.Name = "Cloud"
			environment.Archived = true
			err = shuffle.SetEnvironment(ctx, &environment)
			if err == nil {
				log.Printf("[INFO] Updated cloud environment %s", environment.Name)
			} else {
				log.Printf("[INFO] Failed to update cloud environment %s", environment.Name)
			}
		}
	}

	// FIXME: This doesn't work?
	if value, exists := scheduledOrgs[org.Id]; exists {
		// Looks like this does the trick? Hurr
		log.Printf("[WARNING] STOPPING ORG SCHEDULE for: %s", org.Id)

		value.Lock()
	}

	return &org, nil
}

// INFO: https://docs.google.com/drawings/d/1JJebpPeEVEbmH_qsAC6zf9Noygp7PytvesrkhE19QrY/edit
/*
	This is here to both enable and disable cloud sync features for an organization
*/
func handleCloudSetup(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in cloud setup: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		log.Printf("Not admin.")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Not admin"}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed reading body"}`))
		return
	}

	type ReturnData struct {
		Apikey       string      `datastore:"apikey"`
		Organization shuffle.Org `datastore:"organization"`
		Disable      bool        `datastore:"disable"`
	}

	var tmpData ReturnData
	err = json.Unmarshal(body, &tmpData)
	if err != nil {
		log.Printf("Failed unmarshalling test: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	org, err := shuffle.GetOrg(ctx, tmpData.Organization.Id)
	if err != nil {
		log.Printf("Organization doesn't exist: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME: Check if user is admin of this org
	//log.Printf("Checking org %s", org.Name)
	userFound := false
	admin := false
	for _, inneruser := range org.Users {
		if inneruser.Id == user.Id {
			userFound = true
			//log.Printf("[INFO] Role: %s", inneruser.Role)
			if inneruser.Role == "admin" {
				admin = true
			}

			break
		}
	}

	if !userFound {
		log.Printf("User %s doesn't exist in organization %s", user.Id, org.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME: Enable admin check in org for sync setup and conf.
	_ = admin
	//if !admin {
	//	log.Printf("User %s isn't admin hence can't set up sync for org %s", user.Id, org.Id)
	//	resp.WriteHeader(401)
	//	resp.Write([]byte(`{"success": false}`))
	//	return
	//}

	//log.Printf("Apidata: %s", tmpData.Apikey)

	// FIXME: Path
	client := &http.Client{}
	apiPath := "/api/v1/cloud/sync/setup"
	if tmpData.Disable {
		if !org.CloudSync {
			log.Printf("[WARNING] Org %s isn't syncing. Can't stop.", org.Id)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Skipped cloud sync setup. Already syncing."}`)))
			return
		}

		log.Printf("[INFO] Should disable sync for org %s", org.Id)
		apiPath := "/api/v1/cloud/sync/stop"
		syncPath := fmt.Sprintf("%s%s", syncUrl, apiPath)

		_, err = handleStopCloudSync(syncPath, *org)
		if err != nil {
			ret := shuffle.ResultChecker{
				Success: false,
				Reason:  fmt.Sprintf("%s", err),
			}

			resp.WriteHeader(401)
			b, err := json.Marshal(ret)
			if err != nil {
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
				return
			}

			resp.Write(b)
		} else {
			resp.WriteHeader(200)
			resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Successfully disabled cloud sync for org."}`)))
		}

		return
	}

	// Everything below here is to SET UP CLOUD SYNC.
	// If you want to disable cloud sync, see previous section.
	if org.CloudSync {
		log.Printf("[WARNING] Org %s is already syncing. Skip", org.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Your org is already syncing. Nothing to set up."}`)))
		return
	}

	syncPath := fmt.Sprintf("%s%s", syncUrl, apiPath)

	type requestStruct struct {
		ApiKey string `json:"api_key"`
	}

	requestData := requestStruct{
		ApiKey: tmpData.Apikey,
	}

	b, err := json.Marshal(requestData)
	if err != nil {
		log.Printf("Failed marshaling api key data: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed cloud sync: %s"}`, err)))
		return
	}

	req, err := http.NewRequest(
		"POST",
		syncPath,
		bytes.NewBuffer(b),
	)

	newresp, err := client.Do(req)
	if err != nil {
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed cloud sync: %s. Contact support."}`, err)))
		//setBadMemcache(ctx, docPath)
		return
	}

	respBody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Can't parse sync data. Contact support."}`)))
		return
	}

	//log.Printf("Respbody: %s", string(respBody))
	responseData := retStruct{}
	err = json.Unmarshal(respBody, &responseData)
	if err != nil {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed handling cloud data"}`)))
		return
	}

	if newresp.StatusCode != 200 {
		resp.WriteHeader(401)
		resp.Write(respBody)
		return
	}

	if !responseData.Success {
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, responseData.Reason)))
		return
	}

	// FIXME:
	// 1. Set cloudsync for org to be active
	// 2. Add iterative sync schedule for interval seconds
	// 3. Add another environment for the org's users
	org.CloudSync = true
	org.SyncFeatures = responseData.SyncFeatures

	org.SyncConfig = shuffle.SyncConfig{
		Apikey:   responseData.SessionKey,
		Interval: responseData.IntervalSeconds,
	}

	interval := int(responseData.IntervalSeconds)
	log.Printf("[INFO] Starting cloud sync on interval %d", interval)
	job := func() {
		err := remoteOrgJobHandler(*org, interval)
		if err != nil {
			log.Printf("[ERROR] Failed request with remote org setup (1): %s", err)
		}
	}

	jobret, err := newscheduler.Every(int(interval)).Seconds().NotImmediately().Run(job)
	if err != nil {
		log.Printf("[CRITICAL] Failed to schedule org: %s", err)
	} else {
		log.Printf("[INFO] Started sync on interval %d for org %s", interval, org.Name)
		scheduledOrgs[org.Id] = jobret
	}

	// ONLY checked added if workflows are allow huh
	if org.SyncFeatures.Workflows.Active {
		log.Printf("[INFO] Should activate cloud workflows for org %s!", org.Id)

		// 1. Find environment
		// 2. If cloud env found, enable it (un-archive)
		// 3. If it doesn't create it
		environments, err := shuffle.GetEnvironments(ctx, org.Id)
		log.Printf("GETTING ENVS: %#v", environments)
		if err == nil {

			// Don't disable, this will be deleted entirely
			found := false
			for _, environment := range environments {
				if environment.Type == "cloud" {
					environment.Name = "Cloud"
					environment.Archived = false
					err = shuffle.SetEnvironment(ctx, &environment)
					if err == nil {
						log.Printf("[INFO] Re-added cloud environment %s", environment.Name)
					} else {
						log.Printf("[INFO] Failed to re-enable cloud environment %s", environment.Name)
					}

					found = true
					break
				}
			}

			if !found {
				log.Printf("[INFO] Env for cloud not found. Should add it!")
				newEnv := shuffle.Environment{
					Name:       "Cloud",
					Type:       "cloud",
					Archived:   false,
					Registered: true,
					Default:    false,
					OrgId:      org.Id,
					Id:         uuid.NewV4().String(),
				}

				err = shuffle.SetEnvironment(ctx, &newEnv)
				if err != nil {
					log.Printf("Failed setting up NEW org environment for org %s: %s", org.Id, err)
				} else {
					log.Printf("Successfully added new environment for org %s", org.Id)
				}
			}
		} else {
			log.Printf("Failed setting org environment, because none were found: %s", err)
		}
	}

	err = shuffle.SetOrg(ctx, *org, org.Id)
	if err != nil {
		log.Printf("ERROR: Failed updating org even though there was success: %s", err)
		resp.WriteHeader(400)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed setting up org after sync success. Contact support."}`)))
		return
	}

	if responseData.IntervalSeconds > 0 {
		// FIXME:
		log.Printf("[INFO] Should set up interval for %d with session key %s for org %s", responseData.IntervalSeconds, responseData.SessionKey, org.Name)
	}

	resp.WriteHeader(200)
	resp.Write(respBody)
}

// Runs DB migration from Datastore to Opensearch
// If the function has "ALL" in it, that means it's intended to be used for Orgs
// but that we've added a function to grab everything
func migrateDatabase(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, userErr := shuffle.HandleApiAuthentication(resp, request)
	if userErr != nil {
		log.Printf("[WARNING] Api authentication failed in make workflow public: %s", userErr)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		log.Printf("[WARNING] Failed to migrate because you're not admin")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if strings.ToLower(os.Getenv("SHUFFLE_ELASTIC")) != "false" {
		log.Printf("[WARNING] Failed to migrate because main DB is Elastic. Set SHUFFLE_ELASTIC=false in .env")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	//es := shuffle.GetEsConfig()
	_, err := shuffle.RunInit(*dbclient, storage.Client{}, gceProject, "onprem", false, "")
	if err != nil {
		log.Printf("[WARNING] Failed to start migration because of init issues: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("\n\n------- STARTING MIGRATION TO OPENSEARCH --------")
	users, err := shuffle.GetAllUsers(ctx)
	if err != nil {
		log.Printf("[ERROR] Failed getting users: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d user(s) to be migrated", len(users))
	}

	orgs, err := shuffle.GetAllOrgs(ctx)
	if err != nil {
		log.Printf("[ERROR] Failed getting orgs: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d org(s) to be migrated", len(orgs))
	}

	workflows, err := shuffle.GetAllWorkflows(ctx, "ALL")
	if err != nil {
		log.Printf("[ERROR] Failed getting workflows: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d workflows(s) to be migrated", len(workflows))
	}

	apps, err := shuffle.GetAllWorkflowApps(ctx, 0, 0)
	if err != nil {
		log.Printf("[ERROR] Failed getting apps: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d app(s) to be migrated", len(apps))
	}

	openapiApps, err := shuffle.GetAllOpenApi(ctx)
	if err != nil {
		log.Printf("[ERROR] Failed getting openapi apps: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d openapi(s) to be migrated", len(openapiApps))
	}

	workflowappauth, err := shuffle.GetAllWorkflowAppAuth(ctx, "ALL")
	if err != nil {
		log.Printf("[ERROR] Failed getting app auth: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d appauth(s) to be migrated", len(workflowappauth))
	}

	environments, err := shuffle.GetEnvironments(ctx, "ALL")
	if err != nil {
		log.Printf("[ERROR] Failed getting environments: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d environment(s) to be migrated", len(environments))
	}

	hooks, err := shuffle.GetAllHooks(ctx)
	if err != nil {
		log.Printf("[ERROR] Failed getting hooks: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d hook(s) to be migrated", len(hooks))
	}

	schedules, err := shuffle.GetAllSchedules(ctx, "ALL")
	if err != nil {
		log.Printf("[ERROR] Failed getting schedules: %#v", err)
	} else {
		log.Printf("[DEBUG] Found %d schedule(s) to be migrated", len(schedules))
	}

	log.Printf("\n\n------- SWAPPING TO OPENSEARCH DB WITH ACQUIRED INFO ---------")
	userSuccess := 0
	orgSuccess := 0
	workflowSuccess := 0
	appSuccess := 0
	openapiSuccess := 0
	authSuccess := 0
	envSuccess := 0
	hookSuccess := 0
	scheduleSuccess := 0
	_, err = shuffle.RunInit(*dbclient, storage.Client{}, gceProject, "onprem", false, "elasticsearch")

	for _, item := range orgs {
		err = shuffle.SetOrg(ctx, item, item.Id)
		if err != nil {
			//log.Printf("[WARNING] Failed to update org in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set org %s (%s) in opensearch", item.Name, item.Id)
			orgSuccess += 1
		}
	}

	log.Printf("----- ORGS FOUND: %d - success: %d - failed: %d", len(orgs), orgSuccess, len(orgs)-orgSuccess)

	for _, item := range workflowappauth {
		err = shuffle.SetWorkflowAppAuthDatastore(ctx, item, item.Id)
		if err != nil {
			//log.Printf("[WARNING] Failed to update app auth in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set app auth %s in opensearch", item.Id)
			authSuccess += 1
		}
	}

	log.Printf("----- AUTH FOUND: %d - success: %d - failed: %d", len(workflowappauth), authSuccess, len(workflowappauth)-authSuccess)

	for _, item := range environments {
		err = shuffle.SetEnvironment(ctx, &item)
		if err != nil {
			//log.Printf("[WARNING] Failed to update env in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set env %s in opensearch", item.Id)
			envSuccess += 1
		}
	}

	log.Printf("----- ENVS FOUND: %d - success: %d - failed: %d", len(environments), envSuccess, len(environments)-envSuccess)

	for _, item := range hooks {
		err = shuffle.SetHook(ctx, item)
		if err != nil {
			//log.Printf("[WARNING] Failed to update hooks in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set hook %s in opensearch", item.Id)
			hookSuccess += 1
		}
	}

	log.Printf("---- HOOKS FOUND: %d - success: %d - failed: %d", len(hooks), hookSuccess, len(hooks)-hookSuccess)

	for _, item := range schedules {
		err = shuffle.SetSchedule(ctx, item)
		if err != nil {
			//log.Printf("[WARNING] Failed to update schedule in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set schedule %s in opensearch", item.Id)
			scheduleSuccess += 1
		}
	}

	log.Printf(" SCHEDULES FOUND: %d - success: %d - failed: %d", len(schedules), scheduleSuccess, len(schedules)-scheduleSuccess)

	for _, item := range users {
		err = shuffle.SetUser(ctx, &item, false)
		if err != nil {
			//log.Printf("[WARNING] Failed to update user in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set user %s (%s) in opensearch", item.Username, item.Id)
			userSuccess += 1
		}
	}

	log.Printf("---- USERS FOUND: %d - success: %d - failed: %d", len(users), userSuccess, len(users)-userSuccess)

	for _, item := range workflows {
		err = shuffle.SetWorkflow(ctx, item, item.ID)
		if err != nil {
			//log.Printf("[WARNING] Failed to update workflow in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set workflow %s (%s) in opensearch", item.Name, item.ID)
			workflowSuccess += 1
		}
	}

	log.Printf(" WORKFLOWS FOUND: %d - success: %d - failed: %d", len(workflows), workflowSuccess, len(workflows)-workflowSuccess)

	for _, item := range openapiApps {
		err = shuffle.SetOpenApiDatastore(ctx, item.ID, item)
		if err != nil {
			//log.Printf("[WARNING] Failed to update openapi app in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set openapi %s in opensearch", item.ID)
			openapiSuccess += 1
		}
	}

	log.Printf("-- OpenAPI FOUND: %d - success: %d - failed: %d", len(openapiApps), openapiSuccess, len(openapiApps)-openapiSuccess)

	for _, item := range apps {
		err = shuffle.SetWorkflowAppDatastore(ctx, item, item.ID)
		if err != nil {
			//log.Printf("[WARNING] Failed to update app in opensearch: %s", err)
		} else {
			//log.Printf("[DEBUG] Set app %s (%s) in opensearch", item.Name, item.ID)
			appSuccess += 1
		}
	}

	log.Printf("----- APPS FOUND: %d - success: %d - failed: %d", len(apps), appSuccess, len(apps)-appSuccess)

	// Handle users
	// 1. Get users
	// 2. Get organizations
	// 4. Get workflows
	// 5. Get apps
	// 6. Get workflowappauth
	// 7. Get workflowexecution
	// 9. Get Environments
	// 10. Get hooks
	// 11. Get openapi3
	// 12. Get schedules

	//log.Printf("[INFO] Successfully published workflow %s (%s) TO CLOUD", workflow.Name, workflow.ID)
	log.Printf("\n\n[DEBUG] Successfully updated ran migration from Datastore to Opensearch!")
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
	log.Printf("[DEBUG] Panicing to force-restart Shuffle post-migration. Stop Shuffle and change database. Docs: https://shuffler.io/docs/configuration#database_migration")
	os.Exit(0)
}

func makeWorkflowPublic(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, userErr := shuffle.HandleApiAuthentication(resp, request)
	if userErr != nil {
		log.Printf("[WARNING] Api authentication failed in make workflow public: %s", userErr)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access publish workflow: %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")
	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	ctx := context.Background()
	if strings.Contains(fileId, "?") {
		fileId = strings.Split(fileId, "?")[0]
	}

	if len(fileId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Workflow ID when getting workflow is not valid"}`))
		return
	}

	workflow, err := shuffle.GetWorkflow(ctx, fileId)
	if err != nil {
		log.Printf("[WARNING] Workflow %s doesn't exist in app publish. User: %s", fileId, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// CHECK orgs of user, or if user is owner
	// FIXME - add org check too, and not just owner
	// Check workflow.Sharing == private / public / org  too
	if user.Id != workflow.Owner || len(user.Id) == 0 {
		if workflow.OrgId == user.ActiveOrg.Id && user.Role == "admin" {
			log.Printf("[AUDIT] User %s is accessing workflow %s as admin (public)", user.Username, workflow.ID)
		} else {
			log.Printf("[AUDIT] Wrong user (%s) for workflow %s (public)", user.Username, workflow.ID)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}
	}

	if !workflow.IsValid || !workflow.PreviouslySaved {
		log.Printf("[INFO] Failed uploading workflow because it's invalid or not saved")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Invalid workflows are not sharable"}`))
		return
	}

	// Starting validation of the POST workflow
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[WARNING] Body data error on mail: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	parsedWorkflow := shuffle.Workflow{}
	err = json.Unmarshal(body, &parsedWorkflow)
	if err != nil {
		log.Printf("[WARNING] Unmarshal error on mail: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Super basic validation. Doesn't really matter.
	if parsedWorkflow.ID != workflow.ID || len(parsedWorkflow.Actions) != len(workflow.Actions) {
		log.Printf("[WARNING] Bad ID during publish: %s vs %s", workflow.ID, parsedWorkflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if !workflow.IsValid || !workflow.PreviouslySaved {
		log.Printf("[INFO] Failed uploading new workflow because it's invalid or not saved")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Invalid workflows are not sharable"}`))
		return
	}

	workflowData, err := json.Marshal(parsedWorkflow)
	if err != nil {
		log.Printf("[WARNING] Failed marshalling workflow: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Sanitization is done in the frontend as well
	parsedWorkflow = shuffle.SanitizeWorkflow(parsedWorkflow)
	parsedWorkflow.ID = uuid.NewV4().String()
	action := shuffle.CloudSyncJob{
		Type:          "workflow",
		Action:        "publish",
		OrgId:         user.ActiveOrg.Id,
		PrimaryItemId: workflow.ID,
		SecondaryItem: string(workflowData),
		FifthItem:     user.Id,
	}

	org, err := shuffle.GetOrg(ctx, user.ActiveOrg.Id)
	if err != nil {
		log.Printf("[WARNING] Failed setting getting org during cloud job setting: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	err = executeCloudAction(action, org.SyncConfig.Apikey)
	if err != nil {
		log.Printf("[WARNING] Failed cloud PUBLISH: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	log.Printf("[INFO] Successfully published workflow %s (%s) TO CLOUD", workflow.Name, workflow.ID)
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func handleAppZipUpload(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	//https://stackoverflow.com/questions/22964950/http-request-formfile-handle-zip-files
	request.ParseMultipartForm(32 << 20)
	f, _, err := request.FormFile("shuffle_file")
	if err != nil {
		log.Printf("[ERROR] Couldn't upload file: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed uploading file. Correct usage is: shuffle_file=@filepath"}`))
		return
	}

	fileSize, err := f.Seek(0, 2) //2 = from end
	if err != nil {
		panic(err)
	}
	_, err = f.Seek(0, 0)
	if err != nil {
		panic(err)
	}

	buf := new(bytes.Buffer)
	fileSize, err = io.Copy(buf, f)
	if err != nil {
		panic(err)
	}

	zipdata, err := zip.NewReader(bytes.NewReader(buf.Bytes()), fileSize)
	if err != nil {
		panic(err)
	}

	// https://github.com/alexmullins/zip/blob/master/example_test.go
	for _, item := range zipdata.File {
		log.Printf("\n\nName: %s\n\n", item.FileHeader.Name)
		log.Printf("item: %#v", item)

		rr, err := item.Open()
		if err != nil {
			log.Fatal(err)
		}

		_, err = io.Copy(os.Stdout, rr)
		if err != nil {
			log.Fatal(err)
		}
		rr.Close()

	}

	resp.WriteHeader(200)
	resp.Write([]byte("OK"))
}

func initHandlers() {
	var err error
	ctx := context.Background()

	log.Printf("[DEBUG] Starting Shuffle backend - initializing database connection")
	//requestCache = cache.New(5*time.Minute, 10*time.Minute)

	//es := shuffle.GetEsConfig()
	elasticConfig := "elasticsearch"
	if strings.ToLower(os.Getenv("SHUFFLE_ELASTIC")) == "false" {
		elasticConfig = ""
	}

	dbclient, err = datastore.NewClient(ctx, gceProject, option.WithGRPCDialOption(grpc.WithNoProxy()))
	if err != nil {
		if elasticConfig == "" {
			log.Printf("[ERROR] Database client error during init: %s. Env: SHUFFLE_ELASTIC=false", err)
		} else {
			if !strings.Contains(fmt.Sprintf("%s", err), "find default credentials") {
				log.Printf("[DEBUG] Database client error info during init: %s. Here for backwards compatibility: not critical.", err)
			}
			dbclient = &datastore.Client{}
		}
	} else {
		//log.Printf("Database client initiated: %s", dbclient)
	}

	for {
		_, err = shuffle.RunInit(*dbclient, storage.Client{}, gceProject, "onprem", true, elasticConfig)
		if err != nil {
			log.Printf("[ERROR] Error in initial database connection. Retrying in 5 seconds. %s", err)
			time.Sleep(5 * time.Second)
			continue
		}

		break
	}

	log.Printf("[DEBUG] Initialized Shuffle database connection. Setting up environment.")

	if elasticConfig == "elasticsearch" {
		time.Sleep(5 * time.Second)
		go runInitEs(ctx)
	} else {
		go runInit(ctx)
	}

	r := mux.NewRouter()
	r.HandleFunc("/api/v1/_ah/health", shuffle.HealthCheckHandler)

	// Make user related locations
	// Fix user changes with org
	r.HandleFunc("/api/v1/users/login", shuffle.HandleLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/register", handleRegister).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/checkusers", checkAdminLogin).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/getinfo", handleInfo).Methods("GET", "OPTIONS")

	r.HandleFunc("/api/v1/users/generateapikey", shuffle.HandleApiGeneration).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/logout", shuffle.HandleLogout).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/getsettings", shuffle.HandleSettings).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/getusers", shuffle.HandleGetUsers).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/updateuser", shuffle.HandleUpdateUser).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/users/{user}", shuffle.DeleteUser).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/users/passwordchange", shuffle.HandlePasswordChange).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/{key}/get2fa", shuffle.HandleGet2fa).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/{key}/set2fa", shuffle.HandleSet2fa).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users", shuffle.HandleGetUsers).Methods("GET", "OPTIONS")

	// General - duplicates and old.
	r.HandleFunc("/api/v1/getusers", shuffle.HandleGetUsers).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/login", shuffle.HandleLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/logout", shuffle.HandleLogout).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/register", handleRegister).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/checkusers", checkAdminLogin).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/getinfo", handleInfo).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/getsettings", shuffle.HandleSettings).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/generateapikey", shuffle.HandleApiGeneration).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/v1/passwordchange", shuffle.HandlePasswordChange).Methods("POST", "OPTIONS")

	r.HandleFunc("/api/v1/getenvironments", shuffle.HandleGetEnvironments).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/setenvironments", shuffle.HandleSetEnvironments).Methods("PUT", "OPTIONS")

	r.HandleFunc("/api/v1/docs", shuffle.GetDocList).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/docs/{key}", shuffle.GetDocs).Methods("GET", "OPTIONS")

	// Queuebuilder and Workflow streams. First is to update a stream, second to get a stream
	// Changed from workflows/streams to streams, as appengine was messing up
	// This does not increase the API counter
	// Used by frontend
	r.HandleFunc("/api/v1/streams", handleWorkflowQueue).Methods("POST")
	r.HandleFunc("/api/v1/streams/results", handleGetStreamResults).Methods("POST", "OPTIONS")

	// Used by orborus
	r.HandleFunc("/api/v1/workflows/queue", handleGetWorkflowqueue).Methods("GET")
	r.HandleFunc("/api/v1/workflows/queue/confirm", handleGetWorkflowqueueConfirm).Methods("POST")

	// App specific
	// From here down isnt checked for org specific
	r.HandleFunc("/api/v1/apps/upload", handleAppZipUpload).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{appId}/activate", activateWorkflowAppDocker).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/frameworkConfiguration", shuffle.GetFrameworkConfiguration).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/frameworkConfiguration", shuffle.SetFrameworkConfiguration).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{appId}", shuffle.UpdateWorkflowAppConfig).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{appId}", shuffle.DeleteWorkflowApp).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{appId}/config", shuffle.GetWorkflowAppConfig).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/run_hotload", handleAppHotloadRequest).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/get_existing", LoadSpecificApps).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/download_remote", LoadSpecificApps).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/validate", validateAppInput).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps", getWorkflowApps).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps", setNewWorkflowApp).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/apps/search", getSpecificApps).Methods("POST", "OPTIONS")

	r.HandleFunc("/api/v1/apps/authentication", shuffle.GetAppAuthentication).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/authentication", shuffle.AddAppAuthentication).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/apps/authentication/{appauthId}/config", shuffle.SetAuthenticationConfig).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/authentication/{appauthId}", shuffle.DeleteAppAuthentication).Methods("DELETE", "OPTIONS")

	// Related to NFT things
	r.HandleFunc("/api/v1/workflows/collections/load", shuffle.LoadCollections).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/collections/{key}", shuffle.HandleGetCollection).Methods("GET", "OPTIONS")

	// Related to use-cases that are not directly workflows.
	r.HandleFunc("/api/v1/workflows/usecases/{key}", shuffle.HandleGetUsecase).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/usecases", shuffle.LoadUsecases).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/usecases", shuffle.UpdateUsecases).Methods("POST", "OPTIONS")

	// Legacy app things
	r.HandleFunc("/api/v1/workflows/apps/validate", validateAppInput).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/apps", getWorkflowApps).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/apps", setNewWorkflowApp).Methods("PUT", "OPTIONS")

	// Workflows
	// FIXME - implement the queue counter lol
	/* Everything below here increases the counters*/
	r.HandleFunc("/api/v1/workflows", shuffle.GetWorkflows).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows", shuffle.SetNewWorkflow).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/schedules", shuffle.HandleGetSchedules).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/executions", shuffle.GetWorkflowExecutions).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/executions/{key}/abort", shuffle.AbortExecution).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/schedule", scheduleWorkflow).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/download_remote", loadSpecificWorkflows).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/execute", executeWorkflow).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/schedule/{schedule}", stopSchedule).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/stream", shuffle.HandleStreamWorkflow).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/stream", shuffle.HandleStreamWorkflowUpdate).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}", deleteWorkflow).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}", shuffle.SaveWorkflow).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}", shuffle.GetSpecificWorkflow).Methods("GET", "OPTIONS")

	// Triggers
	r.HandleFunc("/api/v1/hooks/new", shuffle.HandleNewHook).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/hooks", shuffle.HandleNewHook).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/hooks/{key}", handleWebhookCallback).Methods("POST", "GET", "PATCH", "PUT", "DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/hooks/{key}/delete", shuffle.HandleDeleteHook).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/hooks/{key}", shuffle.HandleDeleteHook).Methods("DELETE", "OPTIONS")

	// OpenAPI configuration
	r.HandleFunc("/api/v1/verify_swagger", verifySwagger).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/verify_openapi", verifySwagger).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/get_openapi_uri", shuffle.EchoOpenapiData).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/validate_openapi", shuffle.ValidateSwagger).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/get_openapi/{key}", getOpenapi).Methods("GET", "OPTIONS")

	// Specific triggers
	r.HandleFunc("/api/v1/workflows/{key}/outlook", shuffle.HandleCreateOutlookSub).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/outlook/{triggerId}", shuffle.HandleDeleteOutlookSub).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/triggers/outlook/register", shuffle.HandleNewOutlookRegister).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/triggers/outlook/getFolders", shuffle.HandleGetOutlookFolders).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/triggers/outlook/{key}", shuffle.HandleGetSpecificTrigger).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/triggers/gmail/register", shuffle.HandleNewGmailRegister).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/triggers/gmail/getFolders", shuffle.HandleGetGmailFolders).Methods("GET", "OPTIONS")

	//r.HandleFunc("/api/v1/triggers/gmail/routing", handleGmailRouting).Methods("POST", "OPTIONS")

	r.HandleFunc("/api/v1/triggers/gmail/{key}", shuffle.HandleGetSpecificTrigger).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/gmail", shuffle.HandleCreateGmailSub).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/gmail/{triggerId}", shuffle.HandleDeleteGmailSub).Methods("DELETE", "OPTIONS")

	//r.HandleFunc("/api/v1/triggers/gmail/{key}", handleGetSpecificGmailTrigger).Methods("GET", "OPTIONS")
	//r.HandleFunc("/api/v1/triggers/outlook/getFolders", shuffle.HandleGetOutlookFolders).Methods("GET", "OPTIONS")
	//r.HandleFunc("/api/v1/triggers/outlook/{key}", handleGetSpecificTrigger).Methods("GET", "OPTIONS")
	//r.HandleFunc("/api/v1/triggers/outlook/{key}/callback", handleOutlookCallback).Methods("POST", "OPTIONS")
	//r.HandleFunc("/api/v1/stats/{key}", handleGetSpecificStats).Methods("GET", "OPTIONS")

	// EVERYTHING below here is NEW for 0.8.0 (written 25.05.2021)
	r.HandleFunc("/api/v1/workflows/{key}/publish", makeWorkflowPublic).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/cloud/setup", handleCloudSetup).Methods("POST", "OPTIONS")
	//r.HandleFunc("/api/v1/orgs", shuffle.HandleGetOrgs).Methods("GET", "OPTIONS")
	//r.HandleFunc("/api/v1/orgs/", shuffle.HandleGetOrgs).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/orgs/{orgId}", shuffle.HandleGetOrg).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/orgs/{orgId}", shuffle.HandleEditOrg).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/orgs/{orgId}/create_sub_org", shuffle.HandleCreateSubOrg).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/orgs/{orgId}/change", shuffle.HandleChangeUserOrg).Methods("POST", "OPTIONS") // Swaps to the org

	// This is a new API that validates if a key has been seen before.
	// Not sure what the best course of action is for it.
	r.HandleFunc("/api/v1/environments/{key}/stop", shuffle.HandleStopExecutions).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/v1/environments/{key}/rerun", shuffle.HandleRerunExecutions).Methods("GET", "POST", "OPTIONS")

	r.HandleFunc("/api/v1/orgs/{orgId}/validate_app_values", shuffle.HandleKeyValueCheck).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/orgs/{orgId}/get_cache", shuffle.HandleGetCacheKey).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/orgs/{orgId}/set_cache", shuffle.HandleSetCacheKey).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/orgs/{orgId}/stats", shuffle.HandleGetStatistics).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{key}/execute", executeSingleAction).Methods("POST", "OPTIONS")

	// Docker orborus specific - downloads an image
	r.HandleFunc("/api/v1/get_docker_image", getDockerImage).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/migrate_database", migrateDatabase).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/login_sso", shuffle.HandleSSO).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/v1/login_openid", shuffle.HandleOpenId).Methods("GET", "POST", "OPTIONS")

	// Important for email, IDS etc. Create this by:
	// PS: For cloud, this has to use cloud storage.
	// https://developer.box.com/reference/get-files-id-content/
	// 1. Creating the "get file" option. Make it possible to run this in the frontend.
	r.HandleFunc("/api/v1/files/namespaces/{namespace}", shuffle.HandleGetFileNamespace).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/files/{fileId}/content", shuffle.HandleGetFileContent).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/files/create", shuffle.HandleCreateFile).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/files/{fileId}/upload", shuffle.HandleUploadFile).Methods("POST", "OPTIONS", "PATCH")
	r.HandleFunc("/api/v1/files/{fileId}/edit", shuffle.HandleEditFile).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/files/{fileId}", shuffle.HandleGetFileMeta).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/files/{fileId}", shuffle.HandleDeleteFile).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/files", shuffle.HandleGetFiles).Methods("GET", "OPTIONS")

	// Introduced in 0.9.21 to handle notifications for e.g. failed Workflow
	r.HandleFunc("/api/v1/notifications", shuffle.HandleGetNotifications).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/notifications/clear", shuffle.HandleClearNotifications).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/notifications/{notificationId}/markasread", shuffle.HandleMarkAsRead).Methods("GET", "OPTIONS")
	//r.HandleFunc("/api/v1/notifications/{notificationId}/markasread", shuffle.HandleMarkAsRead).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/notifications", shuffle.HandleGetNotifications).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/notifications/clear", shuffle.HandleClearNotifications).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/notifications/{notificationId}/markasread", shuffle.HandleMarkAsRead).Methods("GET", "OPTIONS")

	//r.HandleFunc("/api/v1/users/notifications/{notificationId}/markasread", shuffle.HandleMarkAsRead).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/dashboards/{key}/widgets", shuffle.HandleNewWidget).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/dashboards/{key}/widgets/{widget_id}", shuffle.HandleGetWidget).Methods("GET", "OPTIONS")

	http.Handle("/", r)
}

// Had to move away from mux, which means Method is fucked up right now.
func main() {
	initHandlers()
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "MISSING"
	}

	innerPort := os.Getenv("BACKEND_PORT")
	if innerPort == "" {
		log.Printf("[DEBUG] Running on %s:5001", hostname)
		log.Fatal(http.ListenAndServe(":5001", nil))
	} else {
		log.Printf("[DEBUG] Running on %s:%s", hostname, innerPort)
		log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", innerPort), nil))
	}
}
