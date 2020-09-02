package main

import (
	"bufio"

	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"path/filepath"

	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	//"regexp"
	"strconv"
	"strings"
	"time"

	// Google cloud
	"cloud.google.com/go/datastore"
	"cloud.google.com/go/pubsub"
	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
	"google.golang.org/appengine/mail"

	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
	"github.com/getkin/kin-openapi/openapi3"

	"github.com/google/go-github/v28/github"
	"golang.org/x/oauth2"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/storage/memory"

	// Random
	xj "github.com/basgys/goxml2json"
	newscheduler "github.com/carlescere/scheduler"
	gyaml "github.com/ghodss/yaml"
	"github.com/satori/go.uuid"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v3"

	// PROXY overrides
	// "gopkg.in/src-d/go-git.v4/plumbing/transport/client"
	// githttp "gopkg.in/src-d/go-git.v4/plumbing/transport/http"

	// Web
	// "github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"google.golang.org/grpc"
	http2 "gopkg.in/src-d/go-git.v4/plumbing/transport/http"
	// Old items (cloud)
	// "google.golang.org/appengine"
	// "google.golang.org/appengine/memcache"
	// applog "google.golang.org/appengine/log"
	//cloudrun "google.golang.org/api/run/v1"
)

// This is used to handle onprem vs offprem databases etc
var gceProject = "shuffle"
var bucketName = "shuffler.appspot.com"
var baseAppPath = "/home/frikky/git/shaffuru/tmp/apps"
var baseDockerName = "frikky/shuffle"

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

type StatisticsData struct {
	Timestamp int64  `json:"timestamp" datastore:"timestamp"`
	Id        string `json:"id" datastore:"id"`
	Amount    int64  `json:"amount" datastore:"amount"`
}

type StatisticsItem struct {
	Total     int64            `json:"total" datastore:"total"`
	Fieldname string           `json:"field_name" datastore:"field_name"`
	Data      []StatisticsData `json:"data" datastore:"data"`
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
	Value string `json:"value" datastore:"value"`
}

// Not environment, but execution environment
type Environment struct {
	Name       string `datastore:"name"`
	Type       string `datastore:"type"`
	Registered bool   `datastore:"registered"`
	Default    bool   `datastore:"default" json:"default"`
	Archived   bool   `datastore:"archived" json:"archived"`
	Id         string `datastore:"id" json:"id"`
}

type User struct {
	Username          string        `datastore:"Username" json:"username"`
	Password          string        `datastore:"password,noindex" password:"password,omitempty"`
	Session           string        `datastore:"session,noindex" json:"session"`
	Verified          bool          `datastore:"verified,noindex" json:"verified"`
	PrivateApps       []WorkflowApp `datastore:"privateapps" json:"privateapps":`
	Role              string        `datastore:"role" json:"role"`
	Roles             []string      `datastore:"roles" json:"roles"`
	VerificationToken string        `datastore:"verification_token" json:"verification_token"`
	ApiKey            string        `datastore:"apikey" json:"apikey"`
	ResetReference    string        `datastore:"reset_reference" json:"reset_reference"`
	Executions        ExecutionInfo `datastore:"executions" json:"executions"`
	Limits            UserLimits    `datastore:"limits" json:"limits"`
	Authentication    []UserAuth    `datastore:"authentication,noindex" json:"authentication"`
	ResetTimeout      int64         `datastore:"reset_timeout,noindex" json:"reset_timeout"`
	Id                string        `datastore:"id" json:"id"`
	Orgs              []string      `datastore:"orgs" json:"orgs"`
	CreationTime      int64         `datastore:"creation_time" json:"creation_time"`
	Active            bool          `datastore:"active" json:"active"`
}

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
		Value       string `json:"value" datastore:"value"`
		Description string `json:"description" datastore:"description,noindex"`
		Required    string `json:"required" datastore:"required"`
		Type        string `json:"type" datastore:"type"`
		Schema      struct {
			Type string `json:"type" datastore:"type"`
		} `json:"schema" datastore:"schema"`
	} `json:"src" datastore:"src"`
	Dst struct {
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value"`
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
	Value string `json:"value" datastore:"value"`
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
	Id        string       `json:"id" datastore:"id"`
	Start     string       `json:"start" datastore:"start"`
	Info      Info         `json:"info" datastore:"info"`
	Actions   []HookAction `json:"actions" datastore:"actions,noindex"`
	Type      string       `json:"type" datastore:"type"`
	Owner     string       `json:"owner" datastore:"owner"`
	Status    string       `json:"status" datastore:"status"`
	Workflows []string     `json:"workflows" datastore:"workflows"`
	Running   bool         `json:"running" datastore:"running"`
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

func deleteFile(ctx context.Context, bucket *storage.BucketHandle, remotePath string) error {

	// [START delete_file]
	o := bucket.Object(remotePath)
	if err := o.Delete(ctx); err != nil {
		return err
	}
	// [END delete_file]
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

func handleApiAuthentication(resp http.ResponseWriter, request *http.Request) (User, error) {
	apikey := request.Header.Get("Authorization")
	if len(apikey) > 0 {
		if !strings.HasPrefix(apikey, "Bearer ") {
			log.Printf("Apikey doesn't start with bearer")
			return User{}, errors.New("No bearer token for authorization header")
		}

		apikeyCheck := strings.Split(apikey, " ")
		if len(apikeyCheck) != 2 {
			log.Printf("Invalid format for apikey.")
			return User{}, errors.New("Invalid format for apikey")
		}

		// fml
		//log.Println(apikeyCheck)

		// This is annoying af and is done because of maxlength lol
		newApikey := apikeyCheck[1]
		if len(newApikey) > 249 {
			newApikey = newApikey[0:248]
		}

		ctx := context.Background()
		//if item, err := memcache.Get(ctx, newApikey); err == memcache.ErrCacheMiss {
		//	// Not in cache
		//} else if err != nil {
		//	// Error with cache
		//	log.Printf("Error getting item: %v", err)
		//} else {
		//	var Userdata User
		//	err = json.Unmarshal(item.Value, &Userdata)

		//	if err == nil {
		//		if len(Userdata.Username) > 0 {
		//			return Userdata, nil
		//		} else {
		//			return Userdata, errors.New("User is invalid")
		//		}
		//	}
		//}

		// Make specific check for just service user?
		// Get the user based on APIkey here
		//log.Println(apikeyCheck[1])
		Userdata, err := getApikey(ctx, apikeyCheck[1])
		if err != nil {
			log.Printf("Apikey %s doesn't exist: %s", apikey, err)
			return User{}, err
		}

		// Caching both bad and good apikeys :)
		//b, err := json.Marshal(Userdata)
		//if err != nil {
		//	log.Printf("Failed marshalling: %s", err)
		//	return User{}, err
		//}

		// Add to cache if it doesn't exist
		//item := &memcache.Item{
		//	Key:        newApikey,
		//	Value:      b,
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

		if len(Userdata.Username) > 0 {
			return Userdata, nil
		} else {
			return Userdata, errors.New(fmt.Sprintf("User is invalid - no username found"))
		}
	}

	// One time API keys
	authorizationArr, ok := request.URL.Query()["authorization"]
	ctx := context.Background()
	if ok {
		authorization := ""
		if len(authorizationArr) > 0 {
			authorization = authorizationArr[0]
		}
		_ = authorization

		//if item, err := memcache.Get(ctx, authorization); err == memcache.ErrCacheMiss {
		//	// Doesn't exist :(
		//	log.Printf("Couldn't find %s in cache!", authorization)
		//	return User{}, err
		//} else if err != nil {
		//	log.Printf("Error getting item: %v", err)
		//	return User{}, err
		//} else {
		//	log.Printf("%#v", item.Value)
		//	var Userdata User

		//	log.Printf("Deleting key %s", authorization)
		//	memcache.Delete(ctx, authorization)
		//	err = json.Unmarshal(item.Value, &Userdata)
		//	if err == nil {
		//		return Userdata, nil
		//	}

		//	return User{}, err
		//}
	}

	c, err := request.Cookie("session_token")
	if err == nil {
		//if item, err := memcache.Get(ctx, c.Value); err == memcache.ErrCacheMiss {
		//	// Not in cache
		//} else if err != nil {
		//	log.Printf("Error getting item: %v", err)
		//} else {
		//	var Userdata User
		//	err = json.Unmarshal(item.Value, &Userdata)
		//	if err == nil {
		//		return Userdata, nil
		//	}
		//}

		sessionToken := c.Value
		session, err := getSession(ctx, sessionToken)
		if err != nil {
			log.Printf("Session %s doesn't exist (api auth): %s", sessionToken, err)
			return User{}, err
		}

		// Get session first
		// Should basically never happen
		Userdata, err := getUser(ctx, session.Id)
		if err != nil {
			log.Printf("Username %s doesn't exist (authcheck): %s", session.Username, err)
			return User{}, err
		}

		if Userdata.Session != sessionToken {
			return User{}, errors.New("Wrong session token")
		}

		// Means session exists, but
		return *Userdata, nil
	}

	// Key = apikey
	return User{}, errors.New("Missing authentication")
}

func handleGetallSchedules(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	var err error
	var limit = 50

	// FIXME - add org search and public / private
	key, ok := request.URL.Query()["limit"]
	if ok {
		limit, err = strconv.Atoi(key[0])
		if err != nil {
			limit = 50
		}
	}

	// Max datastore limit
	if limit > 1000 {
		limit = 1000
	}

	// Get URLs from a database index (mapped by orborus)
	ctx := context.Background()
	q := datastore.NewQuery("schedules").Limit(limit)
	var allschedules Schedules

	_, err = dbclient.GetAll(ctx, q, &allschedules.Schedules)
	if err != nil {
		log.Println(err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting schedules"}`)))
		return
	}

	newjson, err := json.Marshal(allschedules)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newjson)
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

func parseLoginParameters(resp http.ResponseWriter, request *http.Request) (loginStruct, error) {

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		return loginStruct{}, err
	}

	var t loginStruct

	err = json.Unmarshal(body, &t)
	if err != nil {
		return loginStruct{}, err
	}

	return t, nil
}

// Can check against HIBP etc?
// Removed for localhost
func checkPasswordStrength(password string) error {
	// Check password strength here
	if len(password) < 3 {
		return errors.New("Minimum password length is 3.")
	}

	//if len(password) > 128 {
	//	return errors.New("Maximum password length is 128.")
	//}

	//re := regexp.MustCompile("[0-9]+")
	//if len(re.FindAllString(password, -1)) == 0 {
	//	return errors.New("Password must contain a number")
	//}

	//re = regexp.MustCompile("[a-z]+")
	//if len(re.FindAllString(password, -1)) == 0 {
	//	return errors.New("Password must contain a lower case char")
	//}

	//re = regexp.MustCompile("[A-Z]+")
	//if len(re.FindAllString(password, -1)) == 0 {
	//	return errors.New("Password must contain an upper case char")
	//}

	return nil
}

func deleteUser(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, userErr := handleApiAuthentication(resp, request)
	if userErr != nil {
		log.Printf("Api authentication failed in edit workflow: %s", userErr)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		log.Printf("Wrong user (%s) when deleting - must be admin", user.Username)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Must be admin"}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")
	var userId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		userId = location[4]
	}

	if userId == user.Id {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Can't deactivate yourself"}`))
		return
	}

	ctx := context.Background()
	q := datastore.NewQuery("Users").Filter("id =", userId)
	var users []User
	_, err := dbclient.GetAll(ctx, q, &users)
	if err != nil {
		log.Printf("Error getting users apikey (deleteuser): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed getting users for verification"}`))
		return
	}

	if len(users) != 1 {
		log.Printf("Found too many users!")
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Backend error: too many or too few users with id %s: %d"}`, userId, len(users))))
		return
	}

	// Invert. No user deletion.
	if users[0].Active {
		users[0].Active = false
	} else {
		users[0].Active = true
	}

	err = setUser(ctx, &users[0])
	if err != nil {
		log.Printf("Failed swapping active for user %s (%s)", users[0].Username, users[0].Id)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": true"}`)))
		return
	}

	log.Printf("Successfully inverted %s", users[0].Username)

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
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

func handleRegisterVerification(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	defaultMessage := "Successfully registered"

	var reference string
	location := strings.Split(request.URL.String(), "/")
	if len(location) <= 4 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	reference = location[4]

	if len(reference) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Id when registering verification is not valid"}`))
		return
	}

	ctx := context.Background()
	// With user, do a search for workflows with user or user's org attached
	// Only giving 200 to not give any suspicion whether they're onto an actual user or not
	q := datastore.NewQuery("Users").Filter("verification_token =", reference)
	var users []User
	_, err := dbclient.GetAll(ctx, q, &users)
	if err != nil {
		log.Printf("Failed getting users for verification token: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, defaultMessage)))
		return
	}

	// FIXME - check reset_timeout
	if len(users) != 1 {
		log.Printf("Error - no user with verification id %s", reference)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
		return
	}

	Userdata := users[0]

	// FIXME: Not for cloud!
	Userdata.Verified = true
	err = setUser(ctx, &Userdata)
	if err != nil {
		log.Printf("Failed adding verification for user %s: %s", Userdata.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
	log.Printf("%s SUCCESSFULLY FINISHED REGISTRATION", Userdata.Username)
}

func handleSetEnvironments(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// FIXME: Overhaul the top part.
	// Only admin can change environments, but if there are no users, anyone can make (first)
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Can't register without being admin"}`))
		return
	}

	if user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Can't register without being admin"}`))
		return
	}

	ctx := context.Background()
	var environments []Environment
	q := datastore.NewQuery("Environments")
	_, err = dbclient.GetAll(ctx, q, &environments)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Can't get environments when setting"}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed to read data"}`)))
		return
	}

	var newEnvironments []Environment
	err = json.Unmarshal(body, &newEnvironments)
	if err != nil {
		log.Printf("Failed unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed to unmarshal data"}`)))
		return
	}

	if len(newEnvironments) < 1 {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "One environment is required"}`)))
		return
	}

	// Clear old data? Removed for archiving purpose. No straight deletion
	//for _, item := range environments {
	//	err = DeleteKey(ctx, "Environments", item.Name)
	//	if err != nil {
	//		resp.WriteHeader(401)
	//		resp.Write([]byte(`{"success": false, "reason": "Error cleaning up environment"}`))
	//		return
	//	}
	//}

	openEnvironments := 0
	for _, item := range newEnvironments {
		if !item.Archived {
			openEnvironments += 1
		}
	}

	if openEnvironments < 1 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Can't archived all environments"}`))
		return
	}

	for _, item := range newEnvironments {
		err = setEnvironment(ctx, &item)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Failed setting environment variable"}`))
			return
		}
	}

	//DeleteKey(ctx, entity string, value string) error {
	// FIXME - check which are in use
	//log.Printf("FIXME: Set new environments: %#v", newEnvironments)
	//log.Printf("DONT DELETE ONES THAT ARE IN USE")

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

func createNewUser(username, password, role, apikey string) error {
	// Returns false if there is an issue
	// Use this for register
	err := checkPasswordStrength(password)
	if err != nil {
		log.Printf("Bad password strength: %s", err)
		return err
	}

	err = checkUsername(username)
	if err != nil {
		log.Printf("Bad Username strength: %s", err)
		return err
	}

	ctx := context.Background()
	q := datastore.NewQuery("Users").Filter("Username =", username)
	var users []User
	_, err = dbclient.GetAll(ctx, q, &users)
	if err != nil {
		log.Printf("Failed getting user for registration: %s", err)
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

	newUser := new(User)
	newUser.Username = username
	newUser.Password = string(hashedPassword)
	newUser.Verified = false
	newUser.CreationTime = time.Now().Unix()
	newUser.Active = true
	newUser.Orgs = []string{"default"}

	// FIXME - Remove this later
	if role == "admin" {
		newUser.Role = "admin"
		newUser.Roles = []string{"admin"}
	} else {
		newUser.Role = "user"
		newUser.Roles = []string{"user"}
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
	err = setUser(ctx, newUser)
	if err != nil {
		log.Printf("Error adding User %s: %s", username, err)
		return err
	}
	url := fmt.Sprintf("https://shuffler.io/register/%s", verifyToken.String())
	const verifyMessage = `
Registration URL :)

%s
	`
	addr := newUser.Username

	msg := &mail.Message{
		Sender:  "Shuffle <frikky@shuffler.io>",
		To:      []string{addr},
		Subject: "Verify your username - Shuffle",
		Body:    fmt.Sprintf(verifyMessage, url),
	}

	log.Println(msg.Body)
	if err := mail.Send(ctx, msg); err != nil {
		log.Printf("Couldn't send email: %v", err)
	}

	err = increaseStatisticsField(ctx, "successful_register", username, 1)
	if err != nil {
		log.Printf("Failed to increase total apps loaded stats: %s", err)
	}

	return nil
}

func handleRegister(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// FIXME: Overhaul the top part.
	// Only admin can CREATE users, but if there are no users, anyone can make (first)
	count, countErr := getUserCount()
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		if (countErr == nil && count > 0) || countErr != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Can't register without being admin"}`))
			return
		}
	}

	if count != 0 {
		if user.Role != "admin" {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Can't register without being admin (2)"}`))
			return
		}
	}

	// Gets a struct of Username, password
	data, err := parseLoginParameters(resp, request)
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
	err = createNewUser(data.Username, data.Password, role, "")
	if err != nil {
		log.Printf("Failed registering user: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
	log.Printf("%s Successfully registered.", data.Username)
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

func handleLogout(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// Check cookie
	c, err := request.Cookie("session_token")
	if err != nil {
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	} else {
		log.Printf("Session cookie is set!")
	}

	var Userdata User
	ctx := context.Background()
	//item, err := memcache.Get(ctx, c.Value)
	sessionToken := ""
	//// Memcache handling for logout
	//if err == nil {
	//	err = json.Unmarshal(item.Value, &Userdata)
	//	if err != nil {
	//		log.Printf("Failed unmarshaling: %s", err)
	//		resp.WriteHeader(401)
	//		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
	//		return
	//	}

	//	sessionToken = Userdata.Session
	//} else {
	//	// Validate with User
	sessionToken = c.Value
	session, err := getSession(ctx, sessionToken)
	if err != nil {
		log.Printf("Session %s doesn't exist (logout): %s", session.Session, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": ""}`))
		return
	}

	// Get session first
	// Should basically never happen
	_, err = getUser(ctx, session.Id)
	if err != nil {
		log.Printf("Username %s doesn't exist (logout): %s", session.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
		return
	}

	//	Userdata = *tmpdata
	//}

	// FIXME
	// Session might delete someone elses here?
	// No need to think about before possible scale..?
	err = SetSession(ctx, Userdata, "")
	if err != nil {
		log.Printf("Error removing session for: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
		return
	}

	err = DeleteKey(ctx, "sessions", sessionToken)
	if err != nil {
		log.Printf("Error deleting key %s for %s: %s", c.Value, Userdata.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
		return
	}

	Userdata.Session = ""
	err = setUser(ctx, &Userdata)
	if err != nil {
		log.Printf("Failed updating user: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed updating apikey"}`))
		return
	}

	//memcache.Delete(request.Context(), sessionToken)

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": false, "reason": "Successfully logged out"}`))
	http.SetCookie(resp, c)
}

func generateApikey(ctx context.Context, userInfo User) (User, error) {
	// Generate UUID
	// Set uuid to apikey in backend (update)
	apikey := uuid.NewV4()
	userInfo.ApiKey = apikey.String()

	err := SetApikey(ctx, userInfo)
	if err != nil {
		log.Printf("Failed updating apikey: %s", err)
		return userInfo, err
	}

	// Updating user
	err = setUser(ctx, &userInfo)
	if err != nil {
		log.Printf("Failed updating user: %s", err)
		return userInfo, err
	}

	return userInfo, nil
}

func handleUpdateUser(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	userInfo, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in apigen: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Missing field: user_id"}`)))
		return
	}

	type newUserStruct struct {
		Role     string `json:"role"`
		Username string `json:"username"`
		UserId   string `json:"user_id"`
	}

	ctx := context.Background()
	var t newUserStruct
	err = json.Unmarshal(body, &t)
	if err != nil {
		log.Printf("Failed unmarshaling userId: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unmarshaling. Missing field: user_id"}`)))
		return
	}

	if userInfo.Role != "admin" {
		log.Printf("%s tried to update user %s", userInfo.Username, t.UserId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "You need to be admin to change other users"}`)))
		return
	}

	foundUser, err := getUser(ctx, t.UserId)
	if err != nil {
		log.Printf("Can't find user %s (update user): %s", t.UserId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	if t.Role != "admin" && t.Role != "user" {
		log.Printf("%s tried and failed to update user %s", userInfo.Username, t.UserId)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Can only change to role user and admin"}`)))
		return
	} else {
		// Same user - can't edit yourself
		if userInfo.Id == t.UserId {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Can't update the role of your own user"}`)))
			return
		}

		log.Printf("Updated user %s from %s to %s", foundUser.Username, foundUser.Role, t.Role)
		foundUser.Role = t.Role
		foundUser.Roles = []string{t.Role}
	}

	if len(t.Username) > 0 {
		q := datastore.NewQuery("Users").Filter("username =", t.Username)
		var users []User
		_, err = dbclient.GetAll(ctx, q, &users)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Failed getting users when updating user"}`))
			return
		}

		found := false
		for _, item := range users {
			if item.Username == t.Username {
				found = true
				break
			}
		}

		if found {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "User with username %s already exists"}`, t.Username)))
			return
		}

		foundUser.Username = t.Username
	}

	err = setUser(ctx, foundUser)
	if err != nil {
		log.Printf("Error patching user %s: %s", foundUser.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func handleApiGeneration(resp http.ResponseWriter, request *http.Request) {
	log.Printf("APIGEN!")
	cors := handleCors(resp, request)
	if cors {
		return
	}

	userInfo, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in apigen: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}
	log.Printf("APIKEY")

	ctx := context.Background()
	if request.Method == "GET" {
		newUserInfo, err := generateApikey(ctx, userInfo)
		if err != nil {
			log.Printf("Failed to generate apikey for user %s: %s", userInfo.Username, err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": ""}`))
			return
		}
		userInfo = newUserInfo
		log.Printf("Updated apikey for user %s", userInfo.Username)
	} else if request.Method == "POST" {
		log.Printf("Handling post!")
		body, err := ioutil.ReadAll(request.Body)
		if err != nil {
			log.Println("Failed reading body")
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Missing field: user_id"}`)))
			return
		}

		type userId struct {
			UserId string `json:"user_id"`
		}

		var t userId
		err = json.Unmarshal(body, &t)
		if err != nil {
			log.Printf("Failed unmarshaling userId: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unmarshaling. Missing field: user_id"}`)))
			return
		}

		if userInfo.Role != "admin" {
			log.Printf("%s tried and failed to change apikey for %s", userInfo.Username, t.UserId)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "You need to be admin to change others' apikey"}`)))
			return
		}

		foundUser, err := getUser(ctx, t.UserId)
		if err != nil {
			log.Printf("Can't find user %s (apikey gen): %s", t.UserId, err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
			return
		}

		newUserInfo, err := generateApikey(ctx, *foundUser)
		if err != nil {
			log.Printf("Failed to generate apikey for user %s: %s", foundUser.Username, err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		}
		foundUser = &newUserInfo

		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "username": "%s", "verified": %t, "apikey": "%s"}`, foundUser.Username, foundUser.Verified, foundUser.ApiKey)))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "username": "%s", "verified": %t, "apikey": "%s"}`, userInfo.Username, userInfo.Verified, userInfo.ApiKey)))
}

func handleSettings(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	userInfo, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in apigen: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "username": "%s", "verified": %t, "apikey": "%s"}`, userInfo.Username, userInfo.Verified, userInfo.ApiKey)))
}

func handleInfo(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	userInfo, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in handleInfo: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	session, err := getSession(ctx, userInfo.Session)
	if err != nil {
		log.Printf("Session %#v doesn't exist: %s", session, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "No session"}`))
		return
	}

	// This is a long check to see if an inactive admin can access the site
	parsedAdmin := "false"
	if !userInfo.Active {
		if userInfo.Role == "admin" {
			parsedAdmin = "true"

			ctx := context.Background()
			q := datastore.NewQuery("Users")
			var users []User
			_, err = dbclient.GetAll(ctx, q, &users)
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
	if session.Session != userInfo.Session {
		log.Printf("Session %s is not the same as %s for %s. %s", userInfo.Session, session.Session, userInfo.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": ""}`))
		return
	}

	expiration := time.Now().Add(3600 * time.Second)
	http.SetCookie(resp, &http.Cookie{
		Name:    "session_token",
		Value:   userInfo.Session,
		Expires: expiration,
	})

	returnData := fmt.Sprintf(`
	{
		"success": true, 
		"admin": %s, 
		"tutorials": [],
		"id": "%s",
		"orgs": [{"name": "Shuffle", "id": "123", "role": "admin"}], 
		"selected_org": {"name": "Shuffle", "id": "123", "role": "admin"}, 
		"cookies": [{"key": "session_token", "value": "%s", "expiration": %d}]
	}`, parsedAdmin, userInfo.Id, userInfo.Session, expiration.Unix())

	resp.WriteHeader(200)
	resp.Write([]byte(returnData))
}

type passwordReset struct {
	Password1 string `json:"newpassword"`
	Password2 string `json:"newpassword2"`
	Reference string `json:"reference"`
}

type passwordChange struct {
	Username        string `json:"username"`
	Newpassword     string `json:"newpassword"`
	Newpassword2    string `json:"newpassword2"`
	Currentpassword string `json:"currentpassword"`
}

func handlePasswordResetMail(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	log.Println("Handling password reset mail")
	defaultMessage := "We have sent you an email :)"

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, defaultMessage)))
		return
	}

	type passwordReset struct {
		Username string `json:"username"`
	}

	var t passwordReset
	err = json.Unmarshal(body, &t)
	if err != nil {
		log.Printf("Failed unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, defaultMessage)))
		return
	}

	ctx := context.Background()
	Userdata, err := getUser(ctx, t.Username)
	if err != nil {
		log.Printf("Username %s doesn't exist (pw reset mail): %s", t.Username, err)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
		return
	}

	resetToken := uuid.NewV4()
	// FIXME:
	// Weakness with this system is that you can spam someone with password resets,
	// and they would never be able to reset, as a new token is always generated
	url := fmt.Sprintf("https://shuffler.io/passwordreset/%s", resetToken.String())

	Userdata.ResetReference = resetToken.String()
	Userdata.ResetTimeout = 0
	err = setUser(ctx, Userdata)
	if err != nil {
		log.Printf("Error patching User for mail %s: %s", Userdata.Username, err)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
		return
	}

	log.Printf("%#v", Userdata)
	addr := t.Username
	const confirmMessage = `
Reset URL :)

%s
	`

	msg := &mail.Message{
		Sender:  "Shuffle <frikky@shuffler.io>",
		To:      []string{addr},
		Subject: "Reset your password - Shuffle",
		Body:    fmt.Sprintf(confirmMessage, url),
	}

	log.Println(msg.Body)
	if err := mail.Send(ctx, msg); err != nil {
		log.Printf("Couldn't send email: %v", err)
	}

	// FIXME
	// Generate an email to send
	// Generate a reset code with a reset link
	// Build frontend to handle reset link with "new password" etc.

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
}

func handlePasswordReset(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	log.Println("Handling password reset")
	defaultMessage := "Successfully handled password reset"

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	var t passwordReset
	err = json.Unmarshal(body, &t)
	if err != nil {
		log.Println("Failed unmarshaling")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	if t.Password1 != t.Password2 {
		resp.WriteHeader(401)
		err := "Passwords don't match"
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	if len(t.Password1) < 10 || len(t.Password2) < 10 {
		resp.WriteHeader(401)
		err := "Passwords don't match - 2"
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	ctx := context.Background()

	// With user, do a search for workflows with user or user's org attached
	// Only giving 200 to not give any suspicion whether they're onto an actual user or not
	q := datastore.NewQuery("Users").Filter("reset_reference =", t.Reference)
	var users []User
	_, err = dbclient.GetAll(ctx, q, &users)
	if err != nil {
		log.Printf("Failed getting users: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, defaultMessage)))
		return
	}

	// FIXME - check reset_timeout
	if len(users) != 1 {
		log.Printf("Error - no user with id %s", t.Reference)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
		return
	}

	Userdata := users[0]
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(t.Password1), 8)
	if err != nil {
		log.Printf("Wrong password for %s: %s", Userdata.Username, err)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
		return
	}

	Userdata.Password = string(hashedPassword)
	Userdata.ResetTimeout = 0
	Userdata.ResetReference = ""
	err = setUser(ctx, &Userdata)
	if err != nil {
		log.Printf("Error adding User %s: %s", Userdata.Username, err)
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
		return
	}

	// FIXME - maybe send a mail here to say that the password was changed

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%s"}`, defaultMessage)))
}

func handlePasswordChange(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	log.Println("Handling password change")
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	// Get the current user - check if they're admin or the "username" user.
	var t passwordChange
	err = json.Unmarshal(body, &t)
	if err != nil {
		log.Println("Failed unmarshaling")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false}`)))
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	curUserFound := false
	if t.Username != user.Username && user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Admin required to change others' passwords"}`))
		return
	} else if t.Username == user.Username {
		curUserFound = true
	}

	if user.Role != "admin" {
		if t.Newpassword != t.Newpassword2 {
			err := "Passwords don't match"
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		}

		if len(t.Newpassword) < 10 || len(t.Newpassword2) < 10 {
			err := "Passwords too short - 2"
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		}
	}

	// Current password
	err = checkPasswordStrength(t.Newpassword)
	if err != nil {
		log.Printf("Bad password strength: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	ctx := context.Background()
	if !curUserFound {
		log.Printf("Have to find a different user")
		q := datastore.NewQuery("Users").Filter("Username =", strings.ToLower(t.Username))
		var users []User
		_, err = dbclient.GetAll(ctx, q, &users)
		if err != nil {
			log.Printf("Failed getting user %s", t.Username)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
			return
		}

		if len(users) != 1 {
			log.Printf(`Found multiple users with the same username: %s: %d`, t.Username, len(users))
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Found %d users with the same username: %s (%d)"}`, len(users), t.Username)))
			return
		}

		user = users[0]
	} else {
		// Admins can re-generate others' passwords as well.
		if user.Role != "admin" {
			err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(t.Newpassword))
			if err != nil {
				log.Printf("Bad password for %s: %s", user.Username, err)
				resp.WriteHeader(401)
				resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
				return
			}
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(t.Newpassword), 8)
	if err != nil {
		log.Printf("New password failure for %s: %s", user.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
		return
	}

	user.Password = string(hashedPassword)
	err = setUser(ctx, &user)
	if err != nil {
		log.Printf("Error fixing password for user %s: %s", user.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
		return
	}

	//memcache.Delete(ctx, sessionToken)

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

// FIXME - forward this to emails or whatever CRM system in use
func handleContact(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
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

func getEnvironmentCount() (int, error) {
	ctx := context.Background()
	q := datastore.NewQuery("Environments").Limit(1)
	count, err := dbclient.Count(ctx, q)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func getUserCount() (int, error) {
	ctx := context.Background()
	q := datastore.NewQuery("Users").Limit(1)
	count, err := dbclient.Count(ctx, q)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func handleGetSchedules(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Admin required"}`))
		return
	}

	ctx := context.Background()
	schedules, err := getAllSchedules(ctx)
	if err != nil {
		log.Printf("Failed getting schedules: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Couldn't get schedules"}`))
		return
	}

	newjson, err := json.Marshal(schedules)
	if err != nil {
		log.Printf("Failed unmarshal: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking environments"}`)))
		return
	}

	//log.Printf("Existing environments: %s", string(newjson))

	resp.WriteHeader(200)
	resp.Write(newjson)
}

func handleGetEnvironments(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	_, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	var environments []Environment
	q := datastore.NewQuery("Environments")
	_, err = dbclient.GetAll(ctx, q, &environments)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Can't get environments"}`))
		return
	}

	newjson, err := json.Marshal(environments)
	if err != nil {
		log.Printf("Failed unmarshal: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking environments"}`)))
		return
	}

	//log.Printf("Existing environments: %s", string(newjson))

	resp.WriteHeader(200)
	resp.Write(newjson)
}

func handleGetUsers(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Not admin"}`))
		return
	}

	ctx := context.Background()
	var users []User
	q := datastore.NewQuery("Users")
	_, err = dbclient.GetAll(ctx, q, &users)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Can't get users"}`))
		return
	}

	newUsers := []User{}
	for _, item := range users {
		if len(item.Username) == 0 {
			continue
		}

		item.Password = ""
		item.Session = ""
		item.VerificationToken = ""

		newUsers = append(newUsers, item)
	}

	newjson, err := json.Marshal(newUsers)
	if err != nil {
		log.Printf("Failed unmarshal: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newjson)
}

func checkAdminLogin(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	count, err := getUserCount()
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	if count == 0 {
		log.Printf("No users - redirecting for management user")
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "stay"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "redirect"}`)))
}

func handleLogin(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// Gets a struct of Username, password
	data, err := parseLoginParameters(resp, request)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	log.Printf("Handling login of %s", data.Username)

	err = checkUsername(data.Username)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	ctx := context.Background()
	log.Printf("Username: %s", data.Username)
	q := datastore.NewQuery("Users").Filter("Username =", data.Username)
	var users []User
	_, err = dbclient.GetAll(ctx, q, &users)
	if err != nil {
		log.Printf("Failed getting user %s", data.Username)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
		return
	}

	if len(users) != 1 {
		log.Printf(`Found multiple users with the same username: %s: %d`, data.Username, len(users))
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Found %d users with the same username: %s"}`, len(users), data.Username)))
		return
	}

	Userdata := users[0]

	err = bcrypt.CompareHashAndPassword([]byte(Userdata.Password), []byte(data.Password))
	if err != nil {
		log.Printf("Password for %s is incorrect: %s", data.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Username and/or password is incorrect"}`))
		return
	}

	if !Userdata.Active {
		log.Printf("%s is not active, but tried to login", data.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "This user is deactivated"}`))
		return
	}

	log.Printf("%s SUCCESSFULLY LOGGED IN with session %s", data.Username, Userdata.Session)
	//if !Userdata.Verified {
	//	log.Printf("User %s is not verified", data.Username)
	//	resp.WriteHeader(403)
	//	resp.Write([]byte(`{"success": false, "reason": "Successful login, but your email address isn't verified. Check your mailbox."}`))
	//	return
	//}

	loginData := `{"success": true}`

	// FIXME - have timeout here
	if len(Userdata.Session) != 0 {
		//log.Println("Nonexisting session")
		expiration := time.Now().Add(3600 * time.Second)

		http.SetCookie(resp, &http.Cookie{
			Name:    "session_token",
			Value:   Userdata.Session,
			Expires: expiration,
		})

		loginData = fmt.Sprintf(`{"success": true, "cookies": [{"key": "session_token", "value": "%s", "expiration": %d}]}`, Userdata.Session, expiration.Unix())
		//log.Printf("SESSION LENGTH MORE THAN 0 IN LOGIN: %s", Userdata.Session)

		err = SetSession(ctx, Userdata, Userdata.Session)
		if err != nil {
			log.Printf("Error adding session to database: %s", err)
		}

		resp.WriteHeader(200)
		resp.Write([]byte(loginData))
		return
	}

	sessionToken := uuid.NewV4()
	http.SetCookie(resp, &http.Cookie{
		Name:    "session_token",
		Value:   sessionToken.String(),
		Expires: time.Now().Add(3600 * time.Second),
	})

	// ADD TO DATABASE
	err = SetSession(ctx, Userdata, sessionToken.String())
	if err != nil {
		log.Printf("Error adding session to database: %s", err)
	}

	resp.WriteHeader(200)
	resp.Write([]byte(loginData))
}

func getApikey(ctx context.Context, apikey string) (User, error) {
	// Query for the specifci workflowId
	q := datastore.NewQuery("Users").Filter("apikey =", apikey)
	var users []User
	_, err := dbclient.GetAll(ctx, q, &users)
	if err != nil {
		log.Printf("Error getting users apikey (getapikey): %s", err)
		return User{}, err
	}

	if len(users) == 0 {
		log.Printf("No users found for apikey %s", apikey)
		return User{}, err
	}

	return users[0], nil
}

func getSession(ctx context.Context, thissession string) (*session, error) {
	key := datastore.NameKey("sessions", thissession, nil)
	curUser := &session{}
	if err := dbclient.Get(ctx, key, curUser); err != nil {
		return &session{}, err
	}

	return curUser, nil
}

// ListBooks returns a list of books, ordered by title.
func getUser(ctx context.Context, id string) (*User, error) {
	key := datastore.NameKey("Users", id, nil)
	curUser := &User{}
	if err := dbclient.Get(ctx, key, curUser); err != nil {
		return &User{}, err
	}

	return curUser, nil
}

// Index = Username
func DeleteKey(ctx context.Context, entity string, value string) error {
	// Non indexed User data
	key1 := datastore.NameKey(entity, value, nil)

	err := dbclient.Delete(ctx, key1)
	if err != nil {
		log.Printf("Error deleting %s from %s: %s", value, entity, err)
		return err
	}

	return nil
}

// Index = Username
func SetApikey(ctx context.Context, Userdata User) error {
	// Non indexed User data
	newapiUser := new(Userapi)
	newapiUser.ApiKey = Userdata.ApiKey
	newapiUser.Username = Userdata.Username
	key1 := datastore.NameKey("apikey", newapiUser.ApiKey, nil)

	// New struct, to not add body, author etc
	if _, err := dbclient.Put(ctx, key1, newapiUser); err != nil {
		log.Printf("Error adding apikey: %s", err)
		return err
	}

	return nil
}

// Index = Username
func SetSession(ctx context.Context, Userdata User, value string) error {
	// Non indexed User data
	Userdata.Session = value
	key1 := datastore.NameKey("Users", Userdata.Id, nil)

	// New struct, to not add body, author etc
	if _, err := dbclient.Put(ctx, key1, &Userdata); err != nil {
		log.Printf("rror adding Usersession: %s", err)
		return err
	}

	if len(Userdata.Session) > 0 {
		// Indexed session data
		sessiondata := new(session)
		sessiondata.Username = Userdata.Username
		sessiondata.Session = Userdata.Session
		sessiondata.Id = Userdata.Id
		key2 := datastore.NameKey("sessions", sessiondata.Session, nil)

		if _, err := dbclient.Put(ctx, key2, sessiondata); err != nil {
			log.Printf("Error adding session: %s", err)
			return err
		}
	}

	return nil
}

func setOpenApiDatastore(ctx context.Context, id string, data ParsedOpenApi) error {
	k := datastore.NameKey("openapi3", id, nil)
	if _, err := dbclient.Put(ctx, k, &data); err != nil {
		return err
	}

	return nil
}

func getOpenApiDatastore(ctx context.Context, id string) (ParsedOpenApi, error) {
	key := datastore.NameKey("openapi3", id, nil)
	api := &ParsedOpenApi{}
	if err := dbclient.Get(ctx, key, api); err != nil {
		return ParsedOpenApi{}, err
	}

	return *api, nil
}

func setEnvironment(ctx context.Context, data *Environment) error {
	// clear session_token and API_token for user
	k := datastore.NameKey("Environments", strings.ToLower(data.Name), nil)

	// New struct, to not add body, author etc

	if _, err := dbclient.Put(ctx, k, data); err != nil {
		log.Println(err)
		return err
	}

	return nil
}

// ListBooks returns a list of books, ordered by title.
func setUser(ctx context.Context, data *User) error {
	// clear session_token and API_token for user
	k := datastore.NameKey("Users", data.Id, nil)
	if _, err := dbclient.Put(ctx, k, data); err != nil {
		log.Println(err)
		return err
	}

	return nil
}

// Used for testing only. Shouldn't impact production.
func handleCors(resp http.ResponseWriter, request *http.Request) bool {
	//allowedOrigins := "*"
	allowedOrigins := "http://localhost:3000"

	resp.Header().Set("Vary", "Origin")
	resp.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, remember-me")
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
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
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

	var hook Hook
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
	_, err = getHook(ctx, workflowId)
	if err != nil {
		log.Printf("Failed getting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "Invalid ID"}`))
		return
	}

	// Update the fields
	err = setHook(ctx, hook)
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
func verifyHook(hook Hook) (bool, string) {
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
	cors := handleCors(resp, request)
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
	var schedule ScheduleOld
	err = json.Unmarshal(body, &schedule)
	if err != nil {
		log.Printf("Failed unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - check access etc
	ctx := context.Background()
	err = setSchedule(ctx, schedule)
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

func getSchedule(ctx context.Context, schedulename string) (*ScheduleOld, error) {
	key := datastore.NameKey("schedules", strings.ToLower(schedulename), nil)
	curUser := &ScheduleOld{}
	if err := dbclient.Get(ctx, key, curUser); err != nil {
		return &ScheduleOld{}, err
	}

	return curUser, nil
}

func getSpecificWebhook(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
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
	schedule, err := getSchedule(ctx, workflowId)
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
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
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
	err = DeleteKey(ctx, "schedules", workflowId)
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
	cors := handleCors(resp, request)
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
	schedule := ScheduleOld{
		Id:                   newId,
		AppInfo:              AppInfo{},
		BaseAppLocation:      "/home/frikky/git/shaffuru/tmp/apps",
		CreationTime:         timeNow,
		LastModificationtime: timeNow,
		LastRuntime:          timeNow,
	}

	ctx := context.Background()
	err := setSchedule(ctx, schedule)
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
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		hookId = location[4]
	}

	// ID: webhook_<UID>
	if len(hookId) != 44 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	hookId = hookId[8:len(hookId)]

	//log.Printf("HookID: %s", hookId)
	hook, err := getHook(ctx, hookId)
	if err != nil {
		log.Printf("Failed getting hook: %s", err)
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
		log.Printf("Not running because hook status is stopped")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "The webhook isn't running. Click start to start it"}`)))
		return
	}

	if len(hook.Workflows) == 0 {
		log.Printf("Not running because hook isn't connected to any workflows")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "No workflows are defined"}`)))
		return
	}

	for _, item := range hook.Workflows {
		log.Printf("Running webhook for workflow %s with startnode %s", item, hook.Start)
		workflow := Workflow{
			ID: "",
		}

		body, err := ioutil.ReadAll(request.Body)
		if err != nil {
			log.Printf("Body data error: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		parsedBody := string(body)
		parsedBody = strings.Replace(parsedBody, "\"", "\\\"", -1)
		if len(parsedBody) > 0 {
			if string(parsedBody[0]) == `"` && string(parsedBody[len(parsedBody)-1]) == "\"" {
				parsedBody = parsedBody[1 : len(parsedBody)-1]
			}
		}

		bodyWrapper := fmt.Sprintf(`{"start": "%s", "execution_source": "webhook", "execution_argument": "%s"}`, hook.Start, string(parsedBody))
		if len(hook.Start) == 0 {
			log.Printf("No start node for hook %s - running with workflow default.", hook.Id)
			bodyWrapper = string(parsedBody)
		}

		newRequest := &http.Request{
			Method: "POST",
			Body:   ioutil.NopCloser(strings.NewReader(bodyWrapper)),
		}

		workflowExecution, executionResp, err := handleExecution(item, workflow, newRequest)

		if err == nil {
			err = increaseStatisticsField(ctx, "total_webhooks_ran", workflowExecution.Workflow.ID, 1)
			if err != nil {
				log.Printf("Failed to increase total apps loaded stats: %s", err)
			}

			resp.WriteHeader(200)
			resp.Write([]byte(fmt.Sprintf(`{"success": true, "execution_id": "%s", "authorization": "%s"}`, workflowExecution.ExecutionId, workflowExecution.Authorization)))
			return
		}

		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, executionResp)))
	}
}

// Starts a new webhook
func handleNewHook(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	type requestData struct {
		Type        string `json:"type"`
		Description string `json:"description"`
		Id          string `json:"id"`
		Name        string `json:"name"`
		Workflow    string `json:"workflow"`
		Start       string `json:"start"`
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Body data error: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("Data: %s", string(body))

	ctx := context.Background()
	var requestdata requestData
	err = yaml.Unmarshal([]byte(body), &requestdata)
	if err != nil {
		log.Printf("Failed unmarshaling inputdata: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}
	log.Printf("%#v", requestdata)

	// CBA making a real thing. Already had some code lol
	newId := requestdata.Id
	if len(newId) != 36 {
		log.Printf("Bad ID")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Invalid ID"}`))
		return
	}

	if requestdata.Id == "" || requestdata.Name == "" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Requires fields id and name can't be empty"}`))
		return

	}

	validTypes := []string{
		"webhook",
	}

	isTypeValid := false
	for _, thistype := range validTypes {
		if requestdata.Type == thistype {
			isTypeValid = true
			break
		}
	}

	if !(isTypeValid) {
		log.Printf("Type %s is not valid. Try any of these: %s", requestdata.Type, strings.Join(validTypes, ", "))
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	hook := Hook{
		Id:        newId,
		Start:     requestdata.Start,
		Workflows: []string{requestdata.Workflow},
		Info: Info{
			Name:        requestdata.Name,
			Description: requestdata.Description,
			Url:         fmt.Sprintf("https://shuffler.io/functions/webhooks/webhook_%s", newId),
		},
		Type:   "webhook",
		Owner:  user.Username,
		Status: "uninitialized",
		Actions: []HookAction{
			HookAction{
				Type:  "workflow",
				Name:  requestdata.Name,
				Id:    requestdata.Workflow,
				Field: "",
			},
		},
		Running: false,
	}

	hook.Status = "running"
	hook.Running = true
	err = setHook(ctx, hook)
	if err != nil {
		log.Printf("Failed setting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	err = increaseStatisticsField(ctx, "total_workflow_triggers", requestdata.Workflow, 1)
	if err != nil {
		log.Printf("Failed to increase total workflows: %s", err)
	}

	log.Println("Set up a new hook")
	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

func sendHookResult(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}
	_ = user

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
	hook, err := getHook(ctx, workflowId)
	if err != nil {
		log.Printf("Failed getting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Body data error: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("SET the hook results for %s to %s", workflowId, body)
	// FIXME - set the hook result in the DB somehow as interface{}
	// FIXME - should the hook do the transform? Hmm

	b, err := json.Marshal(hook)
	if err != nil {
		log.Printf("Failed marshalling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(b))
	return
}

func handleGetHook(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
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

	if len(workflowId) != 36 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	ctx := context.Background()
	hook, err := getHook(ctx, workflowId)
	if err != nil {
		log.Printf("Failed getting hook: %s", err)
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

	b, err := json.Marshal(hook)
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

func getSpecificSchedule(resp http.ResponseWriter, request *http.Request) {
	if request.Method != "GET" {
		setSpecificSchedule(resp, request)
		return
	}

	cors := handleCors(resp, request)
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
	schedule, err := getSchedule(ctx, workflowId)
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
	cors := handleCors(resp, request)
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
	log.Printf("EXECUTING %s!", workflowId)
	idConfig, err := getSchedule(ctx, workflowId)
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
	schedule, err := getSchedule(ctx, workflowId)
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

// Index = Username
func setSchedule(ctx context.Context, schedule ScheduleOld) error {
	key1 := datastore.NameKey("schedules", strings.ToLower(schedule.Id), nil)

	// New struct, to not add body, author etc
	if _, err := dbclient.Put(ctx, key1, &schedule); err != nil {
		log.Printf("Error adding schedule: %s", err)
		return err
	}

	return nil
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

func getAllScheduleApps(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	var err error
	var limit = 50

	// FIXME - add org search and public / private
	key, ok := request.URL.Query()["limit"]
	if ok {
		limit, err = strconv.Atoi(key[0])
		if err != nil {
			limit = 50
		}
	}

	// Max datastore limit
	if limit > 1000 {
		limit = 1000
	}

	// Get URLs from a database index (mapped by orborus)
	ctx := context.Background()
	q := datastore.NewQuery("appschedules").Limit(limit)
	var allappschedules ScheduleApps

	ret, err := dbclient.GetAll(ctx, q, &allappschedules.Apps)
	_ = ret
	if err != nil {
		log.Printf("Failed getting all apps: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed getting apps"}`)))
		return
	}

	newjson, err := json.Marshal(allappschedules)
	if err != nil {
		log.Printf("Failed unmarshal: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newjson)
}

func setScheduleApp(ctx context.Context, app ApiYaml, id string) error {
	// id = md5(appname:appversion)
	key1 := datastore.NameKey("appschedules", id, nil)

	// New struct, to not add body, author etc
	if _, err := dbclient.Put(ctx, key1, &app); err != nil {
		log.Printf("Error adding schedule app: %s", err)
		return err
	}

	return nil
}

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
			log.Printf("%s", err)
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

func getHook(ctx context.Context, hookId string) (*Hook, error) {
	key := datastore.NameKey("hooks", strings.ToLower(hookId), nil)
	hook := &Hook{}
	if err := dbclient.Get(ctx, key, hook); err != nil {
		return &Hook{}, err
	}

	return hook, nil
}

func setHook(ctx context.Context, hook Hook) error {
	key1 := datastore.NameKey("hooks", strings.ToLower(hook.Id), nil)

	// New struct, to not add body, author etc
	if _, err := dbclient.Put(ctx, key1, &hook); err != nil {
		log.Printf("Error adding hook: %s", err)
		return err
	}

	return nil
}

func handleGetallHooks(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in set new workflowhandler: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	// With user, do a search for workflows with user or user's org attached
	q := datastore.NewQuery("hooks").Filter("owner =", user.Username)
	var allhooks []Hook
	_, err = dbclient.GetAll(ctx, q, &allhooks)
	if err != nil {
		log.Printf("Failed getting workflows for user %s: %s", user.Username, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if len(allhooks) == 0 {
		resp.WriteHeader(200)
		resp.Write([]byte("[]"))
		return
	}

	newjson, err := json.Marshal(allhooks)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed unpacking"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(newjson)
}

//func deployWebhookCloudrun(ctx context.Context) {
//	service, err := cloudrun.NewService(ctx)
//	_ = err
//
//	projectsLocationsService := cloudrun.NewProjectsLocationsService(service)
//	log.Printf("%#v", projectsLocationsService)
//	projectsLocationsGetCall := projectsLocationsService.Get("webhook")
//	log.Printf("%#v", projectsLocationsGetCall)
//
//	location, err := projectsLocationsGetCall.Do()
//	log.Printf("%#v, err: %s", location, err)
//
//	//func NewProjectsLocationsService(s *Service) *ProjectsLocationsService {
//	//func (r *ProjectsLocationsService) Get(name string) *ProjectsLocationsGetCall {
//	//func (c *ProjectsLocationsGetCall) Do(opts ...googleapi.CallOption) (*Location, error) {
//}

// Finds available ports
func findAvailablePorts(startRange int64, endRange int64) string {
	for i := startRange; i < endRange; i++ {
		s := strconv.FormatInt(i, 10)
		l, err := net.Listen("tcp", ":"+s)

		if err == nil {
			l.Close()
			return s
		}
	}

	return ""
}

func handleSendalert(resp http.ResponseWriter, request *http.Request) {
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in getworkflows: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role != "mail" && user.Role != "admin" {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "You don't have access to send mail"}`))
		return
	}

	// ReferenceExecution and below are for execution continuations when user inputs arrive
	type mailcheck struct {
		Targets            []string `json:"targets"`
		Body               string   `json:"body"`
		Subject            string   `json:"subject"`
		Type               string   `json:"type"`
		SenderCompany      string   `json:"sender_company"`
		ReferenceExecution string   `json:"reference_execution"`
		WorkflowId         string   `json:"workflow_id"`
		ExecutionType      string   `json:"execution_type"`
		Start              string   `json:"start"`
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Body data error on mail: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	var mailbody mailcheck
	err = json.Unmarshal(body, &mailbody)
	if err != nil {
		log.Printf("Unmarshal error on mail: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	confirmMessage := `
You have a new alert from shuffler.io!

%s

Please contact us at shuffler.io or frikky@shuffler.io if there is an issue with this message.`

	parsedBody := fmt.Sprintf(confirmMessage, mailbody.Body)

	// FIXME - Make a continuation email here - might need more info from worker
	// making the request, e.g. what the next start-node is and execution_id for
	// how to make the links
	if mailbody.Type == "User input" {
		authkey := uuid.NewV4().String()

		log.Printf("Should handle differentiator for user input in email!")
		log.Printf("%#v", mailbody)

		url := "https://shuffler.io"
		//url := "http://localhost:5001"
		continueUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute?authorization=%s&start=%s&reference_execution=%s&answer=true", url, mailbody.WorkflowId, authkey, mailbody.Start, mailbody.ReferenceExecution)
		stopUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute?authorization=%s&start=%s&reference_execution=%s&answer=false", url, mailbody.WorkflowId, authkey, mailbody.Start, mailbody.ReferenceExecution)

		//item := &memcache.Item{
		//	Key:        authkey,
		//	Value:      []byte(fmt.Sprintf(`{"role": "workflow_%s"}`, mailbody.WorkflowId)),
		//	Expiration: time.Minute * 1200,
		//}

		//if err := memcache.Add(ctx, item); err == memcache.ErrNotStored {
		//	if err := memcache.Set(ctx, item); err != nil {
		//		log.Printf("Error setting new user item: %v", err)
		//	}
		//} else if err != nil {
		//	log.Printf("error adding item: %v", err)
		//} else {
		//	log.Printf("Set cache for %s", item.Key)
		//}

		parsedBody = fmt.Sprintf(`
Action required!
			
%s

If this is TRUE click this: %s

IF THIS IS FALSE, click this: %s

Please contact us at shuffler.io or frikky@shuffler.io if there is an issue with this message.
`, mailbody.Body, continueUrl, stopUrl)

	}

	msg := &mail.Message{
		Sender:  "Shuffle <frikky@shuffler.io>",
		To:      mailbody.Targets,
		Subject: fmt.Sprintf("Shuffle - %s - %s", mailbody.Type, mailbody.Subject),
		Body:    parsedBody,
	}

	log.Println(msg.Body)
	if err := mail.Send(ctx, msg); err != nil {
		log.Printf("Couldn't send email: %v", err)
	}

	resp.WriteHeader(200)
	resp.Write([]byte("OK"))
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

var docs_list = Result{List: []string{}}

func getDocList(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	ctx := context.Background()
	//if item, err := memcache.Get(ctx, "docs_list"); err == memcache.ErrCacheMiss {
	//	// Not in cache
	//} else if err != nil {
	//	// Error with cache
	//	log.Printf("Error getting item: %v", err)
	//} else {
	//	resp.WriteHeader(200)
	//	resp.Write([]byte(item.Value))
	//	return
	//}

	if len(docs_list.List) > 0 {
		b, err := json.Marshal(docs_list)
		if err != nil {
			log.Printf("Failed marshaling result: %s", err)
			//http.Error(resp, err.Error(), 500)
		} else {
			resp.WriteHeader(200)
			resp.Write(b)
			return
		}
	}

	client := github.NewClient(nil)
	_, item1, _, err := client.Repositories.GetContents(ctx, "frikky", "shuffle-docs", "docs", nil)
	if err != nil {
		log.Printf("Github error: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Error listing directory: %s"`, err)))
		return
	}

	if len(item1) == 0 {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "No docs available."`)))
		return
	}

	names := []string{}
	for _, item := range item1 {
		if !strings.HasSuffix(*item.Name, "md") {
			continue
		}

		names = append(names, (*item.Name)[0:len(*item.Name)-3])
	}

	log.Println(names)

	var result Result
	result.Success = true
	result.Reason = "Success"
	result.List = names
	docs_list = result

	b, err := json.Marshal(result)
	if err != nil {
		http.Error(resp, err.Error(), 500)
		return
	}

	//item := &memcache.Item{
	//	Key:        "docs_list",
	//	Value:      b,
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

	resp.WriteHeader(200)
	resp.Write(b)
}

// r.HandleFunc("/api/v1/docs/{key}", getDocs).Methods("GET", "OPTIONS")
var alldocs = map[string][]byte{}

func getDocs(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")
	if len(location) != 5 {
		resp.WriteHeader(404)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad path. Use e.g. /api/v1/docs/workflows.md"`)))
		return
	}

	//ctx := context.Background()
	docPath := fmt.Sprintf("https://raw.githubusercontent.com/shaffuru/shuffle-docs/master/docs/%s.md", location[4])
	//location[4]
	//var, ok := alldocs["asd"]
	key, ok := alldocs[fmt.Sprintf("%s", location[4])]
	// Custom cache for github issues lol
	if ok {
		resp.WriteHeader(200)
		resp.Write(key)
		return
	}

	client := &http.Client{}
	req, err := http.NewRequest(
		"GET",
		docPath,
		nil,
	)

	if err != nil {
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad path. Use e.g. /api/v1/docs/workflows.md"`)))
		resp.WriteHeader(404)
		//setBadMemcache(ctx, docPath)
		return
	}

	newresp, err := client.Do(req)
	if err != nil {
		resp.WriteHeader(404)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Bad path. Use e.g. /api/v1/docs/workflows.md"`)))
		//setBadMemcache(ctx, docPath)
		return
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Can't parse data"`)))
		//setBadMemcache(ctx, docPath)
		return
	}

	type Result struct {
		Success bool   `json:"success"`
		Reason  string `json:"reason"`
	}

	var result Result
	result.Success = true

	//applog.Infof(ctx, string(body))
	//applog.Infof(ctx, "Url: %s", docPath)
	//applog.Infof(ctx, "Status: %d", newresp.StatusCode)
	//applog.Infof(ctx, "GOT BODY OF LENGTH %d", len(string(body)))

	result.Reason = string(body)
	b, err := json.Marshal(result)
	if err != nil {
		http.Error(resp, err.Error(), 500)
		//setBadMemcache(ctx, docPath)
		return
	}

	alldocs[location[4]] = b

	// Add to cache if it doesn't exist
	//item := &memcache.Item{
	//	Key:        docPath,
	//	Value:      b,
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

	resp.WriteHeader(200)
	resp.Write(b)
}

type OutlookProfile struct {
	OdataContext      string      `json:"@odata.context"`
	BusinessPhones    []string    `json:"businessPhones"`
	DisplayName       string      `json:"displayName"`
	GivenName         string      `json:"givenName"`
	JobTitle          interface{} `json:"jobTitle"`
	Mail              string      `json:"mail"`
	MobilePhone       interface{} `json:"mobilePhone"`
	OfficeLocation    interface{} `json:"officeLocation"`
	PreferredLanguage interface{} `json:"preferredLanguage"`
	Surname           string      `json:"surname"`
	UserPrincipalName string      `json:"userPrincipalName"`
	ID                string      `json:"id"`
}

type OutlookFolder struct {
	ID               string `json:"id"`
	DisplayName      string `json:"displayName"`
	ParentFolderID   string `json:"parentFolderId"`
	ChildFolderCount int    `json:"childFolderCount"`
	UnreadItemCount  int    `json:"unreadItemCount"`
	TotalItemCount   int    `json:"totalItemCount"`
}

type OutlookFolders struct {
	OdataContext  string          `json:"@odata.context"`
	OdataNextLink string          `json:"@odata.nextLink"`
	Value         []OutlookFolder `json:"value"`
}

func getOutlookFolders(client *http.Client) (OutlookFolders, error) {
	requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/frikky@shuffletest.onmicrosoft.com/mailfolders")

	ret, err := client.Get(requestUrl)
	if err != nil {
		log.Printf("FolderErr: %s", err)
		return OutlookFolders{}, err
	}

	if ret.StatusCode != 200 {
		log.Printf("Status folders: %d", ret.StatusCode)
		return OutlookFolders{}, err
	}

	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		log.Printf("Body: %s", err)
		return OutlookFolders{}, err
	}

	//log.Printf("Body: %s", string(body))

	mailfolders := OutlookFolders{}
	err = json.Unmarshal(body, &mailfolders)
	if err != nil {
		log.Printf("Unmarshal: %s", err)
		return OutlookFolders{}, err
	}

	//fmt.Printf("%#v", mailfolders)
	// FIXME - recursion for subfolders
	// Recursive struct
	// folderEndpoint := fmt.Sprintf("%s/%s/childfolders?$top=40", requestUrl, parentId)
	//for _, folder := range mailfolders.Value {
	//	log.Println(folder.DisplayName)
	//}

	return mailfolders, nil
}

func getOutlookProfile(client *http.Client) (OutlookProfile, error) {
	requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/me?$select=mail")

	ret, err := client.Get(requestUrl)
	if err != nil {
		log.Printf("FolderErr: %s", err)
		return OutlookProfile{}, err
	}

	log.Printf("Status folders: %d", ret.StatusCode)
	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		log.Printf("Body: %s", err)
		return OutlookProfile{}, err
	}

	profile := OutlookProfile{}
	err = json.Unmarshal(body, &profile)
	if err != nil {
		log.Printf("Unmarshal: %s", err)
		return OutlookProfile{}, err
	}

	return profile, nil
}

func handleNewOutlookRegister(resp http.ResponseWriter, request *http.Request) {
	code := request.URL.Query().Get("code")
	if len(code) == 0 {
		log.Println("No code")
		resp.WriteHeader(401)
		return
	}

	url := fmt.Sprintf("http://%s%s", request.Host, request.URL.EscapedPath())
	log.Println(url)
	ctx := context.Background()
	client, accessToken, err := getOutlookClient(ctx, code, OauthToken{}, url)
	if err != nil {
		log.Printf("Oauth client failure - outlook register: %s", err)
		resp.WriteHeader(401)
		return
	}
	// This should be possible, and will also give the actual username
	profile, err := getOutlookProfile(client)
	if err != nil {
		log.Printf("Outlook profile failure: %s", err)
		resp.WriteHeader(401)
		return
	}

	// This is a state workaround, which should really be for CSRF checks lol
	state := request.URL.Query().Get("state")
	if len(state) == 0 {
		log.Println("No state")
		resp.WriteHeader(401)
		return
	}

	stateitems := strings.Split(state, "%26")
	if len(stateitems) == 1 {
		stateitems = strings.Split(state, "&")
	}

	// FIXME - trigger auth
	senderUser := ""
	trigger := TriggerAuth{}
	for _, item := range stateitems {
		itemsplit := strings.Split(item, "%3D")
		if len(itemsplit) == 1 {
			itemsplit = strings.Split(item, "=")
		}

		if len(itemsplit) != 2 {
			continue
		}

		// Do something here
		if itemsplit[0] == "workflow_id" {
			trigger.WorkflowId = itemsplit[1]
		} else if itemsplit[0] == "trigger_id" {
			trigger.Id = itemsplit[1]
		} else if itemsplit[0] == "type" {
			trigger.Type = itemsplit[1]
		} else if itemsplit[0] == "username" {
			trigger.Username = itemsplit[1]
			trigger.Owner = itemsplit[1]
			senderUser = itemsplit[1]
		}
	}

	// THis is an override based on the user in oauth return
	trigger.Username = profile.Mail
	trigger.Code = code
	trigger.OauthToken = OauthToken{
		AccessToken:  accessToken.AccessToken,
		TokenType:    accessToken.TokenType,
		RefreshToken: accessToken.RefreshToken,
		Expiry:       accessToken.Expiry,
	}

	//log.Printf("%#v", trigger)
	if trigger.WorkflowId == "" || trigger.Id == "" || trigger.Username == "" || trigger.Type == "" {
		log.Printf("All oauth items need to contain data to register a new state")
		resp.WriteHeader(401)
		return
	}

	// Should also update the user
	Userdata, err := getUser(ctx, senderUser)
	if err != nil {
		log.Printf("Username %s doesn't exist (oauth2): %s", trigger.Username, err)
		resp.WriteHeader(401)
		return
	}

	Userdata.Authentication = append(Userdata.Authentication, UserAuth{
		Name:        "Outlook",
		Description: "oauth2",
		Workflows:   []string{trigger.WorkflowId},
		Username:    trigger.Username,
		Fields: []UserAuthField{
			UserAuthField{
				Key:   "trigger_id",
				Value: trigger.Id,
			},
			UserAuthField{
				Key:   "username",
				Value: trigger.Username,
			},
			UserAuthField{
				Key:   "code",
				Value: code,
			},
			UserAuthField{
				Key:   "type",
				Value: trigger.Type,
			},
		},
	})

	// Set apikey for the user if they don't have one
	if len(Userdata.ApiKey) == 0 {
		newUser, err := generateApikey(ctx, *Userdata)
		Userdata = &newUser
		if err != nil {
			log.Printf("Failed to generate apikey for user %s when creating outlook sub: %s", Userdata.Username, err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": ""}`))
			return
		}
	}

	//err = setUser(Userdata)
	//if err != nil {
	//	log.Printf("Failed setting user data for %s: %s", Userdata.Username, err)
	//	resp.WriteHeader(401)
	//	return
	//}

	err = setTriggerAuth(ctx, trigger)
	if err != nil {
		log.Printf("Failed to set trigger auth for %s - %s", trigger.Username, err)
		resp.WriteHeader(401)
		return
	}

	// FIXME - not sure if these are good at all :)
	environmentVariables := map[string]string{
		"FUNCTION_APIKEY": Userdata.ApiKey,
		"CALLBACKURL":     "https://shuffler.io",
		"WORKFLOW_ID":     trigger.WorkflowId,
		"TRIGGER_ID":      trigger.Id,
	}

	applocation := fmt.Sprintf("gs://%s/triggers/outlooktrigger.zip", bucketName)
	hookname := fmt.Sprintf("outlooktrigger_%s", trigger.Id)

	err = deployCloudFunctionGo(ctx, hookname, defaultLocation, applocation, environmentVariables)
	if err != nil {
		log.Printf("Error deploying hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Issue with starting hook. Please wait a second and try again"}`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte("OK"))
}

type OauthToken struct {
	AccessToken  string    `json:"AccessToken" datastore:"AccessToken,noindex"`
	TokenType    string    `json:"TokenType" datastore:"TokenType,noindex"`
	RefreshToken string    `json:"RefreshToken" datastore:"RefreshToken,noindex"`
	Expiry       time.Time `json:"Expiry" datastore:"Expiry,noindex"`
}
type TriggerAuth struct {
	Id             string `json:"id" datastore:"id"`
	SubscriptionId string `json:"subscriptionId" datastore:"subscriptionId"`

	Username   string     `json:"username" datastore:"username,noindex"`
	WorkflowId string     `json:"workflow_id" datastore:"workflow_id,noindex"`
	Owner      string     `json:"owner" datastore:"owner"`
	Type       string     `json:"type" datastore:"type"`
	Code       string     `json:"code,omitempty" datastore:"code,noindex"`
	OauthToken OauthToken `json:"oauth_token,omitempty" datastore:"oauth_token"`
}

func getTriggerAuth(ctx context.Context, id string) (*TriggerAuth, error) {
	key := datastore.NameKey("trigger_auth", strings.ToLower(id), nil)
	triggerauth := &TriggerAuth{}
	if err := dbclient.Get(ctx, key, triggerauth); err != nil {
		return &TriggerAuth{}, err
	}

	return triggerauth, nil
}

func setTriggerAuth(ctx context.Context, trigger TriggerAuth) error {
	key1 := datastore.NameKey("trigger_auth", strings.ToLower(trigger.Id), nil)

	// New struct, to not add body, author etc
	if _, err := dbclient.Put(ctx, key1, &trigger); err != nil {
		log.Printf("Error adding trigger auth: %s", err)
		return err
	}

	return nil
}

// THis all of a sudden became really horrible.. fml
func getOutlookClient(ctx context.Context, code string, accessToken OauthToken, redirectUri string) (*http.Client, *oauth2.Token, error) {

	conf := &oauth2.Config{
		ClientID:     "70e37005-c954-4290-b573-d4b94e484336",
		ClientSecret: ".eNw/A[kQFB5zL.agvRputdEJENeJ392",
		Scopes: []string{
			"Mail.Read",
			"User.Read",
		},
		RedirectURL: redirectUri,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://login.microsoftonline.com/common/oauth2/authorize",
			TokenURL: "https://login.microsoftonline.com/common/oauth2/token",
		},
	}

	if len(code) > 0 {
		access_token, err := conf.Exchange(ctx, code)
		if err != nil {
			log.Printf("Access_token issue: %s", err)
			return &http.Client{}, access_token, err
		}

		client := conf.Client(ctx, access_token)
		return client, access_token, nil
	} else {
		// Manually recreate the oauthtoken
		access_token := &oauth2.Token{
			AccessToken:  accessToken.AccessToken,
			TokenType:    accessToken.TokenType,
			RefreshToken: accessToken.RefreshToken,
			Expiry:       accessToken.Expiry,
		}

		client := conf.Client(ctx, access_token)
		return client, access_token, nil
	}
}

func handleGetOutlookFolders(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// Exchange every time hmm
	// FIXME
	// Should really just get the code from the trigger that's being used OR the user
	triggerId := request.URL.Query().Get("trigger_id")
	if len(triggerId) == 0 {
		log.Println("No trigger_id supplied")
		resp.WriteHeader(401)
		return
	}

	ctx := context.Background()
	trigger, err := getTriggerAuth(ctx, triggerId)
	if err != nil {
		log.Printf("Trigger %s doesn't exist - outlook folders.", triggerId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Trigger doesn't exist."}`))
		return
	}

	// FIXME - should be shuffler in literally every case except testing lol
	redirectDomain := "shuffler.io"
	url := fmt.Sprintf("https://%s/functions/outlook/register", redirectDomain)
	outlookClient, _, err := getOutlookClient(ctx, "", trigger.OauthToken, url)
	if err != nil {
		log.Printf("Oauth client failure - outlook folders: %s", err)
		resp.WriteHeader(401)
		return
	}

	folders, err := getOutlookFolders(outlookClient)
	if err != nil {
		resp.WriteHeader(401)
		return
	}

	b, err := json.Marshal(folders.Value)
	if err != nil {
		log.Println("Failed to marshal folderdata")
		resp.WriteHeader(401)
		return
	}

	resp.WriteHeader(200)
	resp.Write(b)
}

func handleGetSpecificStats(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	_, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in getting specific workflow: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var statsId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		statsId = location[4]
	}

	ctx := context.Background()
	statisticsId := "global_statistics"
	nameKey := statsId
	key := datastore.NameKey(statisticsId, nameKey, nil)
	statisticsItem := StatisticsItem{}
	if err := dbclient.Get(ctx, key, &statisticsItem); err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	b, err := json.Marshal(statisticsItem)
	if err != nil {
		log.Println("Failed to marshal data: %s", err)
		resp.WriteHeader(401)
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(b))
}

func handleGetSpecificTrigger(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in getting specific workflow: %s", err)
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

	if strings.Contains(workflowId, "?") {
		workflowId = strings.Split(workflowId, "?")[0]
	}

	ctx := context.Background()
	trigger, err := getTriggerAuth(ctx, workflowId)
	if err != nil {
		log.Printf("Trigger %s doesn't exist - specific trigger.", workflowId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": ""}`))
		return
	}

	if user.Username != trigger.Owner && user.Role != "admin" {
		log.Printf("Wrong user (%s) for trigger %s", user.Username, trigger.Id)
		resp.WriteHeader(401)
		return
	}

	trigger.OauthToken = OauthToken{}
	trigger.Code = ""

	b, err := json.Marshal(trigger)
	if err != nil {
		log.Println("Failed to marshal data")
		resp.WriteHeader(401)
		return
	}

	resp.WriteHeader(200)
	resp.Write(b)
}

func handleDeleteOutlookSub(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var workflowId string
	var triggerId string
	if location[1] == "api" {
		if len(location) <= 6 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		workflowId = location[4]
		triggerId = location[6]
	}

	if len(workflowId) == 0 || len(triggerId) == 0 {
		log.Printf("Ids can't be zero when deleting %s", workflowId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	ctx := context.Background()
	workflow, err := getWorkflow(ctx, workflowId)
	if err != nil {
		log.Printf("Failed getting the workflow locally (delete outlook): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in outlook deploy: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - have a check for org etc too..
	if user.Id != workflow.Owner && user.Role != "admin" {
		log.Printf("Wrong user (%s) for workflow %s when deploying outlook", user.Username, workflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Check what kind of sub it is
	err = handleOutlookSubRemoval(ctx, workflowId, triggerId)
	if err != nil {
		log.Printf("Failed sub removal: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

func removeOutlookSubscription(outlookClient *http.Client, subscriptionId string) error {
	// DELETE https://graph.microsoft.com/v1.0/subscriptions/{id}
	fullUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/subscriptions/%s", subscriptionId)
	req, err := http.NewRequest(
		"DELETE",
		fullUrl,
		nil,
	)
	req.Header.Add("Content-Type", "application/json")
	res, err := outlookClient.Do(req)
	if err != nil {
		log.Printf("Client: %s", err)
		return err
	}

	if res.StatusCode != 200 && res.StatusCode != 201 && res.StatusCode != 204 {
		return errors.New(fmt.Sprintf("Bad status code when deleting subscription: %d", res.StatusCode))
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("Body: %s", err)
		return err
	}

	_ = body

	return nil
}

// Remove AUTH
// Remove function
// Remove subscription
func handleOutlookSubRemoval(ctx context.Context, workflowId, triggerId string) error {
	// 1. Get the auth for trigger
	// 2. Stop the subscription
	// 3. Remove the function
	// 4. Remove the database entry for auth
	trigger, err := getTriggerAuth(ctx, triggerId)
	if err != nil {
		log.Printf("Trigger auth %s doesn't exist - outlook sub removal.", triggerId)
		return err
	}

	url := fmt.Sprintf("https://shuffler.io")
	outlookClient, _, err := getOutlookClient(ctx, "", trigger.OauthToken, url)
	if err != nil {
		log.Printf("Oauth client failure - triggerauth sub removal: %s", err)
		return err
	}

	notificationURL := fmt.Sprintf("https://%s-%s.cloudfunctions.net/outlooktrigger_%s", defaultLocation, gceProject, trigger.Id)
	curSubscriptions, err := getOutlookSubscriptions(outlookClient)
	if err == nil {
		for _, sub := range curSubscriptions.Value {
			if sub.NotificationURL == notificationURL {
				log.Printf("Removing existing subscription %s", sub.Id)
				removeOutlookSubscription(outlookClient, sub.Id)
			}
		}
	} else {
		log.Printf("Failed to get subscriptions - need to overwrite")
	}

	// FIXME - not removing the function, as the trigger still exists
	//err = removeOutlookTriggerFunction(triggerId)
	//if err != nil {
	//	return err
	//}

	return nil
}

// This sets up the sub with outlook itself
// Parses data from the workflow to see whether access is right to subscribe it
// Creates the cloud function for outlook return
// Wait for it to be available, then schedule a workflow to it
func createOutlookSub(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
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

	ctx := context.Background()
	workflow, err := getWorkflow(ctx, workflowId)
	if err != nil {
		log.Printf("Failed getting the workflow locally (outlook sub): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in outlook deploy: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - have a check for org etc too..
	if user.Id != workflow.Owner && user.Role != "admin" {
		log.Printf("Wrong user (%s) for workflow %s when deploying outlook", user.Username, workflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Println("Handle outlook subscription for trigger")

	// Should already be authorized at this point, as the workflow is shared
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Failed body read for workflow %s", workflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Println(string(body))

	// Based on the input data from frontend
	type CurTrigger struct {
		Name    string   `json:"name"`
		Folders []string `json:"folders"`
		ID      string   `json:"id"`
	}

	var curTrigger CurTrigger
	err = json.Unmarshal(body, &curTrigger)
	if err != nil {
		log.Printf("Failed body read unmarshal for trigger %s", workflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if len(curTrigger.Folders) == 0 {
		log.Printf("Error for %s. Choosing folders is required, currently 0", workflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Now that it's deployed - wait a few seconds before generating:
	// 1. Oauth2 token thingies for outlook.office.com
	// 2. Set the url to have the right mailboxes (probably ID?) ("https://outlook.office.com/api/v2.0/me/mailfolders('inbox')/messages")
	// 3. Set the callback URL to be the new trigger
	// 4. Run subscription test
	// 5. Set the subscriptionId to the trigger object

	// First - lets regenerate an oauth token for outlook.office.com from the original items
	trigger, err := getTriggerAuth(ctx, curTrigger.ID)
	if err != nil {
		log.Printf("Trigger %s doesn't exist - outlook sub.", curTrigger.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": ""}`))
		return
	}

	// url doesn't really matter here
	url := fmt.Sprintf("https://shuffler.io")
	outlookClient, _, err := getOutlookClient(ctx, "", trigger.OauthToken, url)
	if err != nil {
		log.Printf("Oauth client failure - triggerauth: %s", err)
		resp.WriteHeader(401)
		return
	}

	// Location +
	notificationURL := fmt.Sprintf("https://%s-%s.cloudfunctions.net/outlooktrigger_%s", defaultLocation, gceProject, curTrigger.ID)
	log.Println(notificationURL)

	// This is here simply to let the function start
	// Usually takes 10 attempts minimum :O
	// 10 * 5 = 50 seconds. That's waaay too much :(
	//notificationURL = "https://europe-west1-shuffler.cloudfunctions.net/outlooktrigger_e2ce43b0-997e-4980-9617-6eadbc68cf88"
	//notificationURL = "https://de4fc12b.ngrok.io"

	curSubscriptions, err := getOutlookSubscriptions(outlookClient)
	if err == nil {
		for _, sub := range curSubscriptions.Value {
			if sub.NotificationURL == notificationURL {
				log.Printf("Removing existing subscription %s", sub.Id)
				removeOutlookSubscription(outlookClient, sub.Id)
			}
		}
	} else {
		log.Printf("Failed to get subscriptions - need to overwrite")
	}

	maxFails := 15
	failCnt := 0
	log.Println(curTrigger.Folders)
	for {
		subId, err := makeOutlookSubscription(outlookClient, curTrigger.Folders, notificationURL)
		if err != nil {
			failCnt += 1
			log.Printf("Failed making oauth subscription, retrying in 5 seconds: %s", err)
			time.Sleep(5 * time.Second)
			if failCnt == maxFails {
				log.Printf("Failed to set up subscription %d times.", maxFails)
				resp.WriteHeader(401)
				return
			}

			continue
		}

		// Set the ID somewhere here
		trigger.SubscriptionId = subId
		err = setTriggerAuth(ctx, *trigger)
		if err != nil {
			log.Printf("Failed setting triggerauth: %s", err)
		}

		break
	}

	log.Printf("Successfully handled outlook subscription for trigger %s in workflow %s", curTrigger.ID, workflow.ID)

	//log.Printf("%#v", user)
	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

// Lists the users current subscriptions
func getOutlookSubscriptions(outlookClient *http.Client) (SubscriptionsWrapper, error) {
	fullUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/subscriptions")
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)
	req.Header.Add("Content-Type", "application/json")
	res, err := outlookClient.Do(req)
	if err != nil {
		log.Printf("suberror Client: %s", err)
		return SubscriptionsWrapper{}, err
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("Suberror Body: %s", err)
		return SubscriptionsWrapper{}, err
	}

	newSubs := SubscriptionsWrapper{}
	err = json.Unmarshal(body, &newSubs)
	if err != nil {
		return SubscriptionsWrapper{}, err
	}

	return newSubs, nil
}

type SubscriptionsWrapper struct {
	OdataContext string         `json:"@odata.context"`
	Value        []Subscription `json:"value"`
}

type Subscription struct {
	ChangeType         string `json:"changeType"`
	NotificationURL    string `json:"notificationUrl"`
	Resource           string `json:"resource"`
	ExpirationDateTime string `json:"expirationDateTime"`
	ClientState        string `json:"clientState"`
	Id                 string `json:"id"`
}

func makeOutlookSubscription(client *http.Client, folderIds []string, notificationURL string) (string, error) {
	fullUrl := "https://graph.microsoft.com/v1.0/subscriptions"

	// FIXME - this expires rofl
	t := time.Now().Local().Add(time.Minute * time.Duration(4300))
	timeFormat := fmt.Sprintf("%d-%02d-%02dT%02d:%02d:%02d.0000000Z", t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second())
	log.Println(timeFormat)

	resource := fmt.Sprintf("me/mailfolders('%s')/messages", strings.Join(folderIds, "','"))
	log.Println(resource)
	sub := Subscription{
		ChangeType:         "created",
		NotificationURL:    notificationURL,
		ExpirationDateTime: timeFormat,
		ClientState:        "This is a test",
		Resource:           resource,
	}

	data, err := json.Marshal(sub)
	if err != nil {
		log.Printf("Marshal: %s", err)
		return "", err
	}

	req, err := http.NewRequest(
		"POST",
		fullUrl,
		bytes.NewBuffer(data),
	)
	req.Header.Add("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		log.Printf("Client: %s", err)
		return "", err
	}

	log.Printf("Status: %d", res.StatusCode)
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("Body: %s", err)
		return "", err
	}

	if res.StatusCode != 200 && res.StatusCode != 201 {
		return "", errors.New(fmt.Sprintf("Subscription failed: %s", string(body)))
	}

	// Use data from body here to create thingy
	newSub := Subscription{}
	err = json.Unmarshal(body, &newSub)
	if err != nil {
		return "", err
	}

	return newSub.Id, nil
}

func getOpenapi(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// Just here to verify that the user is logged in
	_, err := handleApiAuthentication(resp, request)
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
	//_, err = getApp(ctx, id)
	//if err == nil {
	//	log.Println("You're supposed to be able to continue now.")
	//}

	parsedApi, err := getOpenApiDatastore(ctx, id)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("API LENGTH GET: %d, ID: %s", len(parsedApi.Body), id)

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

func echoOpenapiData(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// Just here to verify that the user is logged in
	_, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in validate swagger: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Bodyreader err: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed reading body"}`))
		return
	}

	newbody := string(body)
	newbody = strings.TrimSpace(newbody)
	if strings.HasPrefix(newbody, "\"") {
		newbody = newbody[1:len(newbody)]
	}

	if strings.HasSuffix(newbody, "\"") {
		newbody = newbody[0 : len(newbody)-1]
	}

	req, err := http.NewRequest("GET", newbody, nil)
	if err != nil {
		log.Printf("Requestbuilder err: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed building request"}`))
		return
	}

	httpClient := &http.Client{}
	newresp, err := httpClient.Do(req)
	if err != nil {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed making request for data"`)))
		return
	}
	defer newresp.Body.Close()

	urlbody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Can't get data from selected uri"`)))
		return
	}

	resp.WriteHeader(200)
	resp.Write(urlbody)
}

func handleSwaggerValidation(body []byte) (ParsedOpenApi, error) {
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

	parsed := ParsedOpenApi{}
	swaggerdata := []byte{}
	idstring := ""

	isJson := false
	err := json.Unmarshal(body, &version)
	if err != nil {
		//log.Printf("Json err: %s", err)
		err = yaml.Unmarshal(body, &version)
		if err != nil {
			log.Printf("Yaml error: %s", err)
		} else {
			//log.Printf("Successfully parsed YAML!")
		}
	} else {
		isJson = true
		log.Printf("Successfully parsed JSON!")
	}

	if len(version.SwaggerVersion) > 0 && len(version.Swagger) == 0 {
		version.Swagger = version.SwaggerVersion
	}

	if strings.HasPrefix(version.Swagger, "3.") || strings.HasPrefix(version.OpenAPI, "3.") {
		//log.Println("Handling v3 API")
		swaggerv3, err := openapi3.NewSwaggerLoader().LoadSwaggerFromData(body)
		if err != nil {
			return ParsedOpenApi{}, err
		}

		swaggerdata, err = json.Marshal(swaggerv3)
		if err != nil {
			log.Printf("Failed unmarshaling v3 data: %s", err)
			return ParsedOpenApi{}, err
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
			err = gyaml.Unmarshal(body, &swagger)
			if err != nil {
				log.Printf("Yaml error: %s", err)
				return ParsedOpenApi{}, err
			} else {
				//log.Printf("Valid yaml!")
			}

		}

		swaggerv3, err := openapi2conv.ToV3Swagger(&swagger)
		if err != nil {
			log.Printf("Failed converting from openapi2 to 3: %s", err)
			return ParsedOpenApi{}, err
		}

		swaggerdata, err = json.Marshal(swaggerv3)
		if err != nil {
			log.Printf("Failed unmarshaling v3 data: %s", err)
			return ParsedOpenApi{}, err
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
	parsed = ParsedOpenApi{
		ID:      idstring,
		Body:    string(body),
		Success: true,
	}

	return parsed, err
}

// FIXME: Migrate this to use handleSwaggerValidation()
func validateSwagger(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// Just here to verify that the user is logged in
	_, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in validate swagger: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed reading body"}`))
		return
	}

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

	isJson := false
	err = json.Unmarshal(body, &version)
	if err != nil {
		log.Printf("Json err: %s", err)
		err = yaml.Unmarshal(body, &version)
		if err != nil {
			log.Printf("Yaml error: %s", err)
			//resp.WriteHeader(422)
			//resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed reading openapi to json and yaml: %s"}`, err)))
			//return
		} else {
			log.Printf("Successfully parsed YAML!")
		}
	} else {
		isJson = true
		log.Printf("Successfully parsed JSON!")
	}

	if len(version.SwaggerVersion) > 0 && len(version.Swagger) == 0 {
		version.Swagger = version.SwaggerVersion
	}

	if strings.HasPrefix(version.Swagger, "3.") || strings.HasPrefix(version.OpenAPI, "3.") {
		log.Println("Handling v3 API")
		swagger, err := openapi3.NewSwaggerLoader().LoadSwaggerFromData(body)
		if err != nil {
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		}

		hasher := md5.New()
		hasher.Write(body)
		idstring := hex.EncodeToString(hasher.Sum(nil))

		log.Printf("Swagger v3 validation success with ID %s!", idstring)
		log.Printf("Paths: %d", len(swagger.Paths))

		if !isJson {
			log.Printf("FIXME: NEED TO TRANSFORM FROM YAML TO JSON for %s", idstring)
		}

		parsed := ParsedOpenApi{
			ID:   idstring,
			Body: string(body),
		}

		ctx := context.Background()
		err = setOpenApiDatastore(ctx, idstring, parsed)
		if err != nil {
			log.Printf("Failed uploading openapi to datastore: %s", err)
			resp.WriteHeader(422)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed reading openapi2: %s"}`, err)))
			return
		}
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "id": "%s"}`, idstring)))
		return
	} else { //strings.HasPrefix(version.Swagger, "2.") || strings.HasPrefix(version.OpenAPI, "2.") {
		// Convert
		log.Println("Handling v2 API")
		var swagger openapi2.Swagger
		//log.Println(string(body))
		err = json.Unmarshal(body, &swagger)
		if err != nil {
			log.Printf("Json error? %s", err)
			err = gyaml.Unmarshal(body, &swagger)
			if err != nil {
				log.Printf("Yaml error: %s", err)
			}

			resp.WriteHeader(422)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed reading openapi2: %s"}`, err)))
			return
		}

		swaggerv3, err := openapi2conv.ToV3Swagger(&swagger)
		if err != nil {
			log.Printf("Failed converting from openapi2 to 3: %s", err)
			resp.WriteHeader(422)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed converting from openapi2 to openapi3: %s"}`, err)))
			return
		}

		swaggerdata, err := json.Marshal(swaggerv3)
		if err != nil {
			log.Printf("Failed unmarshaling v3 data: %s", err)
			resp.WriteHeader(422)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed marshalling swaggerv3 data: %s"}`, err)))
			return
		}

		hasher := md5.New()
		hasher.Write(swaggerdata)
		idstring := hex.EncodeToString(hasher.Sum(nil))
		if !isJson {
			log.Printf("FIXME: NEED TO TRANSFORM FROM YAML TO JSON for %s?", idstring)
		}
		log.Printf("Swagger v2 -> v3 validation success with ID %s!", idstring)

		parsed := ParsedOpenApi{
			ID:   idstring,
			Body: string(swaggerdata),
		}

		ctx := context.Background()
		err = setOpenApiDatastore(ctx, idstring, parsed)
		if err != nil {
			log.Printf("Failed uploading openapi2 to datastore: %s", err)
			resp.WriteHeader(422)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed reading openapi2: %s"}`, err)))
			return
		}

		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "id": "%s"}`, idstring)))
		return
	}
	/*
		else {
			log.Printf("Swagger / OpenAPI version %s is not supported or there is an error.", version.Swagger)
			resp.WriteHeader(422)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Swagger version %s is not currently supported"}`, version.Swagger)))
			return
		}
	*/

	// save the openapi ID
	resp.WriteHeader(422)
	resp.Write([]byte(`{"success": false}`))
}

// Creates an app from the app builder
func verifySwagger(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("Api authentication failed in verify swagger: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed reading body"}`))
		return
	}

	type Test struct {
		Editing bool   `datastore:"editing"`
		Id      string `datastore:"id"`
		Image   string `datastore:"image"`
	}

	var test Test
	err = json.Unmarshal(body, &test)
	if err != nil {
		log.Printf("Failed unmarshalling test: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Get an identifier
	hasher := md5.New()
	hasher.Write(body)
	newmd5 := hex.EncodeToString(hasher.Sum(nil))
	if test.Editing {
		// Quick verification test
		ctx := context.Background()
		app, err := getApp(ctx, test.Id)
		if err != nil {
			log.Printf("Error getting app when editing: %s", app.Name)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		// FIXME: Check whether it's in use.
		if user.Id != app.Owner && user.Role != "admin" {
			log.Printf("Wrong user (%s) for app %s when verifying swagger", user.Username, app.Name)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		log.Printf("EDITING APP WITH ID %s", app.ID)
		newmd5 = app.ID
	}

	// Generate new app integration (bump version)
	// Test = client side with fetch?

	ctx := context.Background()

	swagger, err := openapi3.NewSwaggerLoader().LoadSwaggerFromData(body)
	if err != nil {
		log.Printf("Swagger validation error: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed verifying openapi"}`))
		return
	}

	if strings.Contains(swagger.Info.Title, " ") {
		strings.Replace(swagger.Info.Title, " ", "", -1)
	}

	basePath, err := buildStructure(swagger, newmd5)
	if err != nil {
		log.Printf("Failed to build base structure: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed building baseline structure"}`))
		return
	}

	//log.Printf("Should generate yaml")
	swagger, api, pythonfunctions, err := generateYaml(swagger, newmd5)
	if err != nil {
		log.Printf("Failed building and generating yaml: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed building and parsing yaml"}`))
		return
	}

	// FIXME: CHECK IF SAME NAME AS NORMAL APP
	// Can't overwrite existing normal app
	workflowApps, err := getAllWorkflowApps(ctx)
	if err != nil {
		log.Printf("Failed getting all workflow apps from database to verify: %s", err)
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

	err = dumpApi(basePath, api)
	if err != nil {
		log.Printf("Failed dumping yaml: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed dumping yaml"}`))
		return
	}

	identifier := fmt.Sprintf("%s-%s", swagger.Info.Title, newmd5)
	classname := strings.Replace(identifier, " ", "", -1)
	classname = strings.Replace(classname, "-", "", -1)
	parsedCode, err := dumpPython(basePath, classname, swagger.Info.Version, pythonfunctions)
	if err != nil {
		log.Printf("Failed dumping python: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed dumping appcode"}`))
		return
	}

	identifier = strings.Replace(identifier, " ", "-", -1)
	identifier = strings.Replace(identifier, "_", "-", -1)
	log.Printf("Successfully parsed %s. Proceeding to docker container", identifier)

	// Now that the baseline is setup, we need to make it into a cloud function
	// 1. Upload the API to datastore for use
	// 2. Get code from baseline/app_base.py & baseline/static_baseline.py
	// 3. Stitch code together from these two + our new app
	// 4. Zip the folder to cloud storage
	// 5. Upload as cloud function

	// 1. Upload the API to datastore
	err = deployAppToDatastore(ctx, api)
	if err != nil {
		log.Printf("Failed adding app to db: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed adding app to db"}`))
		return
	}

	// 2. Get all the required code
	appbase, staticBaseline, err := getAppbase()
	if err != nil {
		log.Printf("Failed getting appbase: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed getting appbase code"}`))
		return
	}

	// Have to do some quick checks of the python code (:
	_, parsedCode = formatAppfile(parsedCode)

	fixedAppbase := fixAppbase(appbase)
	runner := getRunner(classname)

	// 2. Put it together
	stitched := string(staticBaseline) + strings.Join(fixedAppbase, "\n") + parsedCode + string(runner)
	//log.Println(stitched)

	// 3. Zip and stream it directly in the directory
	_, err = streamZipdata(ctx, identifier, stitched, "requests\nurllib3")
	if err != nil {
		log.Printf("Zipfile error: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed to build zipfile"}`))
		return
	}

	log.Printf("Successfully stitched ZIPFILE for %s", identifier)

	// 4. Upload as cloud function - this apikey is specifically for cloud functions rofl
	//environmentVariables := map[string]string{
	//	"FUNCTION_APIKEY": apikey,
	//}

	//fullLocation := fmt.Sprintf("gs://%s/%s", bucketName, applocation)
	//err = deployCloudFunctionPython(ctx, identifier, defaultLocation, fullLocation, environmentVariables)
	//if err != nil {
	//	log.Printf("Error uploading cloud function: %s", err)
	//	resp.WriteHeader(500)
	//	resp.Write([]byte(`{"success": false, "reason": "Failed to upload function"}`))
	//	return
	//}

	// 4. Build the image locally.
	// FIXME: Should be moved to a local docker registry
	dockerLocation := fmt.Sprintf("%s/Dockerfile", basePath)
	log.Printf("Dockerfile: %s", dockerLocation)

	versionName := fmt.Sprintf("%s_%s", strings.ReplaceAll(api.Name, " ", "-"), api.AppVersion)
	dockerTags := []string{
		fmt.Sprintf("%s:%s", baseDockerName, identifier),
		fmt.Sprintf("%s:%s", baseDockerName, versionName),
	}

	err = buildImage(dockerTags, dockerLocation)
	if err != nil {
		log.Printf("Docker build error: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Error in Docker build"}`)))
		return
	}

	found := false
	foundNumber := 0
	log.Printf("Checking for api with ID %s", newmd5)
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

	err = setUser(ctx, &user)
	if err != nil {
		log.Printf("Failed adding verification for user %s: %s", user.Username, err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "Failed updating user"}`)))
		return
	}

	log.Printf("DO I REACH HERE WHEN SAVING?")
	parsed := ParsedOpenApi{
		ID:   newmd5,
		Body: string(body),
	}

	log.Printf("API LENGTH: %d, ID: %s", len(parsed.Body), newmd5)
	// FIXME: Might cause versioning issues if we re-use the same!!
	// FIXME: Need a way to track different versions of the same app properly.
	// Hint: Save API.id somewhere, and use newmd5 to save latest version
	err = setOpenApiDatastore(ctx, newmd5, parsed)
	if err != nil {
		log.Printf("Failed saving to datastore: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "reason": "%"}`, err)))
	}

	// Backup every single one
	setOpenApiDatastore(ctx, api.ID, parsed)

	err = increaseStatisticsField(ctx, "total_apps_created", newmd5, 1)
	if err != nil {
		log.Printf("Failed to increase success execution stats: %s", err)
	}

	err = increaseStatisticsField(ctx, "openapi_apps_created", newmd5, 1)
	if err != nil {
		log.Printf("Failed to increase success execution stats: %s", err)
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "id": "%s"}`, api.ID)))
}

func healthCheckHandler(resp http.ResponseWriter, request *http.Request) {
	fmt.Fprint(resp, "OK")
}

// Creates osfs from folderpath with a basepath as directory base
func createFs(basepath, pathname string) (billy.Filesystem, error) {
	log.Printf("base: %s, pathname: %s", basepath, pathname)

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

				//if strings.Contains(path, "yaml") {
				//	log.Printf("PATH: %s -> %s", path, fullpath)
				//	//log.Printf("DATA: %s", string(srcData))
				//}

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
func handleAppHotload(location string) error {
	basepath := "base"
	fs, err := createFs(basepath, location)
	if err != nil {
		log.Printf("Failed memfs creation - probably bad path: %s", err)
		return errors.New(fmt.Sprintf("Failed to find directory %s", location))
	} else {
		log.Printf("Memfs creation from %s done", location)
	}

	dir, err := fs.ReadDir("")
	if err != nil {
		log.Printf("Failed reading folder: %s", err)
		return err
	}

	//log.Printf("Reading app folder: %#v", dir)
	err = iterateAppGithubFolders(fs, dir, "", "", false)
	if err != nil {
		log.Printf("Err: %s", err)
		return err
	}

	return nil
}

// Handles configuration items during Shuffle startup
func runInit(ctx context.Context) {
	// Setting stats for backend starts (failure count as well)
	log.Printf("Starting INIT setup")
	err := increaseStatisticsField(ctx, "backend_executions", "", 1)
	if err != nil {
		log.Printf("Failed increasing local stats: %s", err)
	}
	log.Printf("Finalized init statistics update")

	httpProxy := os.Getenv("HTTP_PROXY")
	if len(httpProxy) > 0 {
		log.Printf("Running with HTTP proxy %s (env: HTTP_PROXY)", httpProxy)
	}
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if len(httpsProxy) > 0 {
		log.Printf("Running with HTTPS proxy %s (env: HTTPS_PROXY)", httpsProxy)
	}

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
					Timeout: 15 * time.Second,

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

	// Fix active users etc
	q := datastore.NewQuery("Users").Filter("active =", true)
	var activeusers []User
	_, err = dbclient.GetAll(ctx, q, &activeusers)
	if err != nil {
		log.Printf("Error getting users during init: %s", err)
	} else {
		q := datastore.NewQuery("Users")
		var users []User
		_, err := dbclient.GetAll(ctx, q, &users)
		if len(activeusers) == 0 && len(users) > 0 {
			log.Printf("No active users found - setting ALL to active")
			if err == nil {
				for _, user := range users {
					user.Active = true
					if len(user.Username) == 0 {
						DeleteKey(ctx, "Users", strings.ToLower(user.Username))
						continue
					}

					if len(user.Role) > 0 {
						user.Roles = append(user.Roles, user.Role)
					}

					if len(user.Orgs) == 0 {
						user.Orgs = []string{"default"}
					}

					err = setUser(ctx, &user)
					if err != nil {
						log.Printf("Failed to reset user")
					} else {
						log.Printf("Remade user %s with ID", user.Id)
						err = DeleteKey(ctx, "Users", strings.ToLower(user.Username))
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
				err = createNewUser(username, password, "admin", apikey)
				if err != nil {
					log.Printf("Failed to create default user %s: %s", username, err)
				} else {
					log.Printf("Successfully created user %s", username)
				}
			}
		} else {
			//log.Printf("Found %d users.", len(users))
			//log.Printf(users[0].Username)
		}
	}

	// Gets environments and inits if it doesn't exist
	log.Printf("Setting up environments")
	count, err := getEnvironmentCount()
	if count == 0 && err == nil {
		item := Environment{
			Name: "Shuffle",
			Type: "onprem",
		}

		err = setEnvironment(ctx, &item)
		if err != nil {
			log.Printf("Failed setting up new environment")
		}
	}

	// Gets schedules and starts them
	log.Printf("Relaunching schedules")
	schedules, err := getAllSchedules(ctx)
	if err != nil {
		log.Printf("Failed getting schedules during service init: %s", err)
	} else {
		log.Printf("Setting up %d schedule(s)", len(schedules))
		for _, schedule := range schedules {
			//log.Printf("Schedule: %#v", schedule)
			job := func() {
				request := &http.Request{
					Method: "POST",
					Body:   ioutil.NopCloser(strings.NewReader(schedule.WrappedArgument)),
				}

				_, _, err := handleExecution(schedule.WorkflowId, Workflow{}, request)
				if err != nil {
					log.Printf("Failed to execute %s: %s", schedule.WorkflowId, err)
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

	// Getting apps to see if we should initialize a test
	log.Printf("Getting remote workflow apps")
	workflowapps, err := getAllWorkflowApps(ctx)
	if err != nil {
		log.Printf("Failed getting apps: %s", err)
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
		if len(branch) > 0 {
			cloneOptions.ReferenceName = plumbing.ReferenceName(branch)
		}

		log.Printf("Getting apps from %s", url)

		r, err := git.Clone(storer, fs, cloneOptions)

		if err != nil {
			log.Printf("Failed loading repo into memory: %s", err)
		}

		dir, err := fs.ReadDir("")
		if err != nil {
			log.Printf("Failed reading folder: %s", err)
		}
		_ = r
		//iterateAppGithubFolders(fs, dir, "", "testing")

		// FIXME: Get all the apps?
		iterateAppGithubFolders(fs, dir, "", "", false)

		// Hotloads locally
		location := os.Getenv("SHUFFLE_APP_HOTLOAD_FOLDER")
		if len(location) != 0 {
			handleAppHotload(location)
		}
	}

	log.Printf("Downloading OpenAPI data for search - EXTRA APPS")
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
		log.Printf("Failed loading repo %s into memory: %s", apis, err)
	} else {
		log.Printf("Finished git clone. Looking for updates to the repo.")
		dir, err := fs.ReadDir("")
		if err != nil {
			log.Printf("Failed reading folder: %s", err)
		}

		iterateOpenApiGithub(fs, dir, "", "")
		log.Printf("Finished downloading extra API samples")
	}

	workflowLocation := os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_LOCATION")
	if len(workflowLocation) > 0 {
		log.Printf("Downloading WORKFLOWS from %s if no workflows - EXTRA workflows", workflowLocation)
		q := datastore.NewQuery("workflow")
		var workflows []Workflow
		_, err = dbclient.GetAll(ctx, q, &workflows)
		if err != nil {
			log.Printf("Error getting workflows: %s", err)
		} else {
			if len(workflows) == 0 {
				username := os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_USERNAME")
				password := os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_PASSWORD")
				err = loadGithubWorkflows(workflowLocation, username, password, "", os.Getenv("SHUFFLE_DOWNLOAD_WORKFLOW_BRANCH"))
				if err != nil {
					log.Printf("Failed to upload workflows from github: %s", err)
				} else {
					log.Printf("Finished downloading workflows from github!")
				}
			} else {
				log.Printf("Skipping because there are %d workflows already", len(workflows))
			}

		}
	}
	log.Printf("Finished INIT")
}

func init() {
	var err error
	ctx := context.Background()

	log.Printf("Starting Shuffle backend - initializing database connection")
	// option.WithoutAuthentication

	dbclient, err = datastore.NewClient(ctx, gceProject, option.WithGRPCDialOption(grpc.WithNoProxy()))
	if err != nil {
		panic(fmt.Sprintf("DBclient error during init: %s", err))
	}
	log.Printf("Finished Shuffle database init")

	go runInit(ctx)

	r := mux.NewRouter()
	r.HandleFunc("/api/v1/_ah/health", healthCheckHandler)

	// Sends an email if the right things are specified
	r.HandleFunc("/functions/sendmail", handleSendalert).Methods("POST", "OPTIONS")
	r.HandleFunc("/functions/outlook/register", handleNewOutlookRegister).Methods("GET", "OPTIONS")
	r.HandleFunc("/functions/outlook/getFolders", handleGetOutlookFolders).Methods("GET", "OPTIONS")

	// Make user related locations
	r.HandleFunc("/api/v1/users/generateapikey", handleApiGeneration).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/login", handleLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/logout", handleLogout).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/register", handleRegister).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users/checkusers", checkAdminLogin).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/getusers", handleGetUsers).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/getinfo", handleInfo).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/getsettings", handleSettings).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/users/updateuser", handleUpdateUser).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/users/{user}", deleteUser).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/users/passwordchange", handlePasswordChange).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/users", handleGetUsers).Methods("GET", "OPTIONS")

	// General - duplicates and old.
	r.HandleFunc("/api/v1/login", handleLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/logout", handleLogout).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/register", handleRegister).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/checkusers", checkAdminLogin).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/getusers", handleGetUsers).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/getinfo", handleInfo).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/getsettings", handleSettings).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/generateapikey", handleApiGeneration).Methods("GET", "POST", "OPTIONS")

	r.HandleFunc("/api/v1/getenvironments", handleGetEnvironments).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/setenvironments", handleSetEnvironments).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/passwordchange", handlePasswordChange).Methods("POST", "OPTIONS")

	r.HandleFunc("/api/v1/docs", getDocList).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/docs/{key}", getDocs).Methods("GET", "OPTIONS")

	// Queuebuilder and Workflow streams. First is to update a stream, second to get a stream
	// Changed from workflows/streams to streams, as appengine was messing up
	// This does not increase the API counter
	r.HandleFunc("/api/v1/streams", handleWorkflowQueue).Methods("POST")
	r.HandleFunc("/api/v1/streams/results", handleGetStreamResults).Methods("POST", "OPTIONS")

	// App specific
	r.HandleFunc("/api/v1/apps/run_hotload", handleAppHotloadRequest).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/get_existing", loadSpecificApps).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/download_remote", loadSpecificApps).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{appId}", updateWorkflowAppConfig).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/v1/apps/validate", validateAppInput).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{appId}", deleteWorkflowApp).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/apps/{appId}/config", getWorkflowAppConfig).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps", getWorkflowApps).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps", setNewWorkflowApp).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/apps/search", getSpecificApps).Methods("POST", "OPTIONS")

	r.HandleFunc("/api/v1/apps/authentication", getAppAuthentication).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/apps/authentication", addAppAuthentication).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/apps/authentication/{appauthId}", deleteAppAuthentication).Methods("DELETE", "OPTIONS")

	// Legacy app things
	r.HandleFunc("/api/v1/workflows/apps/validate", validateAppInput).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/apps", getWorkflowApps).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/apps", setNewWorkflowApp).Methods("PUT", "OPTIONS")

	// Workflows
	// FIXME - implement the queue counter lol
	/* Everything below here increases the counters*/
	r.HandleFunc("/api/v1/workflows", getWorkflows).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows", setNewWorkflow).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/queue", handleGetWorkflowqueue).Methods("GET")
	r.HandleFunc("/api/v1/workflows/queue/confirm", handleGetWorkflowqueueConfirm).Methods("POST")
	r.HandleFunc("/api/v1/workflows/schedules", handleGetSchedules).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/download_remote", loadSpecificWorkflows).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/execute", executeWorkflow).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/schedule", scheduleWorkflow).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/schedule/{schedule}", stopSchedule).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/outlook", createOutlookSub).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/outlook/{triggerId}", handleDeleteOutlookSub).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/executions", getWorkflowExecutions).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}/executions/{key}/abort", abortExecution).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}", getSpecificWorkflow).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}", saveWorkflow).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/v1/workflows/{key}", deleteWorkflow).Methods("DELETE", "OPTIONS")

	// Triggers
	// Webhook redirect to the correct cloud function
	r.HandleFunc("/api/v1/hooks/new", handleNewHook).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/hooks/{key}", handleWebhookCallback).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/hooks/{key}/delete", handleDeleteHook).Methods("DELETE", "OPTIONS")

	// Trigger hmm
	r.HandleFunc("/api/v1/triggers/{key}", handleGetSpecificTrigger).Methods("GET", "OPTIONS")

	r.HandleFunc("/api/v1/stats/{key}", handleGetSpecificStats).Methods("GET", "OPTIONS")

	// OpenAPI configuration
	r.HandleFunc("/api/v1/verify_swagger", verifySwagger).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/verify_openapi", verifySwagger).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/get_openapi_uri", echoOpenapiData).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/validate_openapi", validateSwagger).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/get_openapi/{key}", getOpenapi).Methods("GET", "OPTIONS")

	r.HandleFunc("/api/v1/execution_cleanup", cleanupExecutions).Methods("GET", "OPTIONS")

	http.Handle("/", r)
}

// Had to move away from mux, which means Method is fucked up right now.
func main() {
	//init()
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "MISSING"
	}

	innerPort := os.Getenv("BACKEND_PORT")
	if innerPort == "" {
		log.Printf("Running on %s:5001", hostname)
		log.Fatal(http.ListenAndServe(":5001", nil))
	} else {
		log.Printf("Running on %s:%s", hostname, innerPort)
		log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", innerPort), nil))
	}
}
