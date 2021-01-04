package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	dockerclient "github.com/docker/docker/client"
)

var environment = os.Getenv("ENVIRONMENT_NAME")
var baseUrl = os.Getenv("BASE_URL")
var baseimagename = "frikky/shuffle"
var registryName = "registry.hub.docker.com"
var fallbackName = "shuffle-orborus"
var sleepTime = 2

var containerId string

// form container id of current running container
func getThisContainerId() string {
	id := ""
	cmd := fmt.Sprintf("cat /proc/self/cgroup | grep memory | tail -1 | cut -d/ -f3")
	out, err := exec.Command("bash", "-c", cmd).Output()
	if err == nil {
		id = strings.TrimSpace(string(out))

		//log.Printf("Checking if %s is in %s", ".scope", string(out))
		if strings.Contains(string(out), ".scope") {
			id = fallbackName
		}
	}

	return id
}

func init() {
	containerId = getThisContainerId()
	if len(containerId) == 0 {
		log.Printf("[ERROR] No container ID found. Not running containerized?")
	} else {
		log.Printf("[INFO] Found container ID: %s", containerId)
	}
}

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

type retStruct struct {
	Success         bool         `json:"success"`
	SyncFeatures    SyncFeatures `json:"sync_features"`
	SessionKey      string       `json:"session_key"`
	IntervalSeconds int64        `json:"interval_seconds"`
	Reason          string       `json:"reason"`
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
type Environment struct {
	Name       string `datastore:"name"`
	Type       string `datastore:"type"`
	Registered bool   `datastore:"registered"`
	Default    bool   `datastore:"default" json:"default"`
	Archived   bool   `datastore:"archived" json:"archived"`
	Id         string `datastore:"id" json:"id"`
	OrgId      string `datastore:"org_id" json:"org_id"`
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
	ActiveOrg         Org           `json:"active_org" datastore:"active_org"`
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

type ExecutionRequest struct {
	ExecutionId       string   `json:"execution_id,omitempty"`
	ExecutionArgument string   `json:"execution_argument,omitempty"`
	ExecutionSource   string   `json:"execution_source,omitempty"`
	WorkflowId        string   `json:"workflow_id,omitempty"`
	Environments      []string `json:"environments,omitempty"`
	Authorization     string   `json:"authorization,omitempty"`
	Status            string   `json:"status,omitempty"`
	Start             string   `json:"start,omitempty"`
	Type              string   `json:"type,omitempty"`
}

type SyncFeatures struct {
	Webhook            SyncData `json:"webhook" datastore:"webhook"`
	Schedules          SyncData `json:"schedules" datastore:"schedules"`
	UserInput          SyncData `json:"user_input" datastore:"user_input"`
	SendMail           SyncData `json:"send_mail" datastore:"send_mail"`
	SendSms            SyncData `json:"send_sms" datastore:"send_sms"`
	Updates            SyncData `json:"updates" datastore:"updates"`
	Notifications      SyncData `json:"notifications" datastore:"notifications"`
	EmailTrigger       SyncData `json:"email_trigger" datastore:"email_trigger"`
	AppExecutions      SyncData `json:"app_executions" datastore:"app_executions"`
	WorkflowExecutions SyncData `json:"workflow_executions" datastore:"workflow_executions"`
	Apps               SyncData `json:"apps" datastore:"apps"`
	Workflows          SyncData `json:"workflows" datastore:"workflows"`
	Autocomplete       SyncData `json:"autocomplete" datastore:"autocomplete"`
	Authentication     SyncData `json:"authentication" datastore:"authentication"`
	Schedule           SyncData `json:"schedule" datastore:"schedule"`
}

type SyncData struct {
	Active         bool   `json:"active" datastore:"active"`
	Type           string `json:"type" datastore:"type"`
	Name           string `json:"name" datastore:"name"`
	Description    string `json:"description" datastore:"description"`
	Limit          int64  `json:"limit" datastore:"limit"`
	StartDate      int64  `json:"start_date" datastore:"start_date"`
	EndDate        int64  `json:"end_date" datastore:"end_date"`
	DataCollection int64  `json:"data_collection" datastore:"data_collection"`
}

type SyncConfig struct {
	Interval int64  `json:"interval" datastore:"interval"`
	Apikey   string `json:"api_key" datastore:"api_key"`
}

// Role is just used for feedback for a user
type Org struct {
	Name         string       `json:"name" datastore:"name"`
	Description  string       `json:"description" datastore:"description"`
	Image        string       `json:"image" datastore:"image,noindex"`
	Id           string       `json:"id" datastore:"id"`
	Org          string       `json:"org" datastore:"org"`
	Users        []User       `json:"users" datastore:"users"`
	Role         string       `json:"role" datastore:"role"`
	Roles        []string     `json:"roles" datastore:"roles"`
	CloudSync    bool         `json:"cloud_sync" datastore:"CloudSync"`
	SyncConfig   SyncConfig   `json:"sync_config" datastore:"sync_config"`
	SyncFeatures SyncFeatures `json:"sync_features" datastore:"sync_features"`
	Created      int64        `json:"created" datastore:"created"`
	Edited       int64        `json:"edited" datastore:"edited"`
}

type AppAuthenticationStorage struct {
	Active        bool                  `json:"active" datastore:"active"`
	Label         string                `json:"label" datastore:"label"`
	Id            string                `json:"id" datastore:"id"`
	App           WorkflowApp           `json:"app" datastore:"app,noindex"`
	Fields        []AuthenticationStore `json:"fields" datastore:"fields"`
	Usage         []AuthenticationUsage `json:"usage" datastore:"usage"`
	WorkflowCount int64                 `json:"workflow_count" datastore:"workflow_count"`
	NodeCount     int64                 `json:"node_count" datastore:"node_count"`
	OrgId         string                `json:"org_id" datastore:"org_id"`
	Created       int64                 `json:"created" datastore:"created"`
	Edited        int64                 `json:"edited" datastore:"edited"`
}

type AuthenticationUsage struct {
	WorkflowId string   `json:"workflow_id" datastore:"workflow_id"`
	Nodes      []string `json:"nodes" datastore:"nodes"`
}

// An app inside Shuffle
// Source      string `json:"source" datastore:"soure" yaml:"source"` - downloadlocation
type WorkflowApp struct {
	Name          string `json:"name" yaml:"name" required:true datastore:"name"`
	IsValid       bool   `json:"is_valid" yaml:"is_valid" required:true datastore:"is_valid"`
	ID            string `json:"id" yaml:"id,omitempty" required:false datastore:"id"`
	Link          string `json:"link" yaml:"link" required:false datastore:"link,noindex"`
	AppVersion    string `json:"app_version" yaml:"app_version" required:true datastore:"app_version"`
	SharingConfig string `json:"sharing_config" yaml:"sharing_config" datastore:"sharing_config"`
	Generated     bool   `json:"generated" yaml:"generated" required:false datastore:"generated"`
	Downloaded    bool   `json:"downloaded" yaml:"downloaded" required:false datastore:"downloaded"`
	Sharing       bool   `json:"sharing" yaml:"sharing" required:false datastore:"sharing"`
	Verified      bool   `json:"verified" yaml:"verified" required:false datastore:"verified"`
	Activated     bool   `json:"activated" yaml:"activated" required:false datastore:"activated"`
	Tested        bool   `json:"tested" yaml:"tested" required:false datastore:"tested"`
	Owner         string `json:"owner" datastore:"owner" yaml:"owner"`
	Hash          string `json:"hash" datastore:"hash" yaml:"hash"` // api.yaml+dockerfile+src/app.py for apps
	PrivateID     string `json:"private_id" yaml:"private_id" required:false datastore:"private_id"`
	Description   string `json:"description" datastore:"description,noindex" required:false yaml:"description"`
	Environment   string `json:"environment" datastore:"environment" required:true yaml:"environment"`
	SmallImage    string `json:"small_image" datastore:"small_image,noindex" required:false yaml:"small_image"`
	LargeImage    string `json:"large_image" datastore:"large_image,noindex" yaml:"large_image" required:false`
	ContactInfo   struct {
		Name string `json:"name" datastore:"name" yaml:"name"`
		Url  string `json:"url" datastore:"url" yaml:"url"`
	} `json:"contact_info" datastore:"contact_info" yaml:"contact_info" required:false`
	Actions        []WorkflowAppAction `json:"actions" yaml:"actions" required:true datastore:"actions,noindex"`
	Authentication Authentication      `json:"authentication" yaml:"authentication" required:false datastore:"authentication"`
	Tags           []string            `json:"tags" yaml:"tags" required:false datastore:"activated"`
	Categories     []string            `json:"categories" yaml:"categories" required:false datastore:"categories"`
	Created        int64               `json:"created" datastore:"created"`
	Edited         int64               `json:"edited" datastore:"edited"`
	LastRuntime    int64               `json:"last_runtime" datastore:"last_runtime"`
}

type WorkflowAppActionParameter struct {
	Description    string           `json:"description" datastore:"description,noindex" yaml:"description"`
	ID             string           `json:"id" datastore:"id" yaml:"id,omitempty"`
	Name           string           `json:"name" datastore:"name" yaml:"name"`
	Example        string           `json:"example" datastore:"example" yaml:"example"`
	Value          string           `json:"value" datastore:"value,noindex" yaml:"value,omitempty"`
	Multiline      bool             `json:"multiline" datastore:"multiline" yaml:"multiline"`
	Options        []string         `json:"options" datastore:"options" yaml:"options"`
	ActionField    string           `json:"action_field" datastore:"action_field" yaml:"actionfield,omitempty"`
	Variant        string           `json:"variant" datastore:"variant" yaml:"variant,omitempty"`
	Required       bool             `json:"required" datastore:"required" yaml:"required"`
	Configuration  bool             `json:"configuration" datastore:"configuration" yaml:"configuration"`
	Tags           []string         `json:"tags" datastore:"tags" yaml:"tags"`
	Schema         SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
	SkipMulticheck bool             `json:"skip_multicheck" datastore:"skip_multicheck" yaml:"skip_multicheck"`
	ValueReplace   []Valuereplace   `json:"value_replace" datastore:"value_replace,noindex" yaml:"value_replace,omitempty"`
}

type Valuereplace struct {
	Key   string `json:"key" datastore:"key" yaml:"key"`
	Value string `json:"value" datastore:"value" yaml:"value"`
}

type SchemaDefinition struct {
	Type string `json:"type" datastore:"type"`
}

type WorkflowAppAction struct {
	Description       string                       `json:"description" datastore:"description,noindex"`
	ID                string                       `json:"id" datastore:"id" yaml:"id,omitempty"`
	Name              string                       `json:"name" datastore:"name"`
	Label             string                       `json:"label" datastore:"label"`
	NodeType          string                       `json:"node_type" datastore:"node_type"`
	Environment       string                       `json:"environment" datastore:"environment"`
	Sharing           bool                         `json:"sharing" datastore:"sharing"`
	PrivateID         string                       `json:"private_id" datastore:"private_id"`
	AppID             string                       `json:"app_id" datastore:"app_id"`
	Tags              []string                     `json:"tags" datastore:"tags" yaml:"tags"`
	Authentication    []AuthenticationStore        `json:"authentication" datastore:"authentication,noindex" yaml:"authentication,omitempty"`
	Tested            bool                         `json:"tested" datastore:"tested" yaml:"tested"`
	Parameters        []WorkflowAppActionParameter `json:"parameters" datastore: "parameters"`
	ExecutionVariable struct {
		Description string `json:"description" datastore:"description,noindex"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value,noindex"`
	} `json:"execution_variable" datastore:"execution_variables"`
	Returns struct {
		Description string           `json:"description" datastore:"returns" yaml:"description,omitempty"`
		Example     string           `json:"example" datastore:"example" yaml:"example"`
		ID          string           `json:"id" datastore:"id" yaml:"id,omitempty"`
		Schema      SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
	} `json:"returns" datastore:"returns"`
	AuthenticationId string `json:"authentication_id" datastore:"authentication_id"`
	Example          string `json:"example" datastore:"example" yaml:"example"`
	AuthNotRequired  bool   `json:"auth_not_required" datastore:"auth_not_required" yaml:"auth_not_required"`
}

// FIXME: Generate a callback authentication ID?
// FIXME: Add org check ..
type WorkflowExecution struct {
	Type               string         `json:"type" datastore:"type"`
	Status             string         `json:"status" datastore:"status"`
	Start              string         `json:"start" datastore:"start"`
	ExecutionArgument  string         `json:"execution_argument" datastore:"execution_argument,noindex"`
	ExecutionId        string         `json:"execution_id" datastore:"execution_id"`
	ExecutionSource    string         `json:"execution_source" datastore:"execution_source"`
	ExecutionOrg       string         `json:"execution_org" datastore:"execution_org"`
	WorkflowId         string         `json:"workflow_id" datastore:"workflow_id"`
	LastNode           string         `json:"last_node" datastore:"last_node"`
	Authorization      string         `json:"authorization" datastore:"authorization"`
	Result             string         `json:"result" datastore:"result,noindex"`
	StartedAt          int64          `json:"started_at" datastore:"started_at"`
	CompletedAt        int64          `json:"completed_at" datastore:"completed_at"`
	ProjectId          string         `json:"project_id" datastore:"project_id"`
	Locations          []string       `json:"locations" datastore:"locations"`
	Workflow           Workflow       `json:"workflow" datastore:"workflow,noindex"`
	Results            []ActionResult `json:"results" datastore:"results,noindex"`
	ExecutionVariables []struct {
		Description string `json:"description" datastore:"description,noindex"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value,noindex"`
	} `json:"execution_variables,omitempty" datastore:"execution_variables,omitempty"`
	OrgId string `json:"org_id" datastore:"org_id"`
}

// This is for the nodes in a workflow, NOT the app action itself.
type Action struct {
	AppName           string                       `json:"app_name" datastore:"app_name"`
	AppVersion        string                       `json:"app_version" datastore:"app_version"`
	AppID             string                       `json:"app_id" datastore:"app_id"`
	Errors            []string                     `json:"errors" datastore:"errors"`
	ID                string                       `json:"id" datastore:"id"`
	IsValid           bool                         `json:"is_valid" datastore:"is_valid"`
	IsStartNode       bool                         `json:"isStartNode" datastore:"isStartNode"`
	Sharing           bool                         `json:"sharing" datastore:"sharing"`
	PrivateID         string                       `json:"private_id" datastore:"private_id"`
	Label             string                       `json:"label" datastore:"label"`
	SmallImage        string                       `json:"small_image" datastore:"small_image,noindex" required:false yaml:"small_image"`
	LargeImage        string                       `json:"large_image" datastore:"large_image,noindex" yaml:"large_image" required:false`
	Environment       string                       `json:"environment" datastore:"environment"`
	Name              string                       `json:"name" datastore:"name"`
	Parameters        []WorkflowAppActionParameter `json:"parameters" datastore: "parameters,noindex"`
	ExecutionVariable struct {
		Description string `json:"description" datastore:"description,noindex"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value,noindex"`
	} `json:"execution_variable,omitempty" datastore:"execution_variable,omitempty"`
	Position struct {
		X float64 `json:"x" datastore:"x"`
		Y float64 `json:"y" datastore:"y"`
	} `json:"position"`
	Priority         int    `json:"priority" datastore:"priority"`
	AuthenticationId string `json:"authentication_id" datastore:"authentication_id"`
	Example          string `json:"example" datastore:"example"`
	AuthNotRequired  bool   `json:"auth_not_required" datastore:"auth_not_required" yaml:"auth_not_required"`
}

// Added environment for location to execute
type Trigger struct {
	AppName         string                       `json:"app_name" datastore:"app_name"`
	Description     string                       `json:"description" datastore:"description,noindex"`
	LongDescription string                       `json:"long_description" datastore:"long_description"`
	Status          string                       `json:"status" datastore:"status"`
	AppVersion      string                       `json:"app_version" datastore:"app_version"`
	Errors          []string                     `json:"errors" datastore:"errors"`
	ID              string                       `json:"id" datastore:"id"`
	IsValid         bool                         `json:"is_valid" datastore:"is_valid"`
	IsStartNode     bool                         `json:"isStartNode" datastore:"isStartNode"`
	Label           string                       `json:"label" datastore:"label"`
	SmallImage      string                       `json:"small_image" datastore:"small_image,noindex" required:false yaml:"small_image"`
	LargeImage      string                       `json:"large_image" datastore:"large_image,noindex" yaml:"large_image" required:false`
	Environment     string                       `json:"environment" datastore:"environment"`
	TriggerType     string                       `json:"trigger_type" datastore:"trigger_type"`
	Name            string                       `json:"name" datastore:"name"`
	Tags            []string                     `json:"tags" datastore:"tags" yaml:"tags"`
	Parameters      []WorkflowAppActionParameter `json:"parameters" datastore: "parameters,noindex"`
	Position        struct {
		X float64 `json:"x" datastore:"x"`
		Y float64 `json:"y" datastore:"y"`
	} `json:"position"`
	Priority int `json:"priority" datastore:"priority"`
}

type Branch struct {
	DestinationID string      `json:"destination_id" datastore:"destination_id"`
	ID            string      `json:"id" datastore:"id"`
	SourceID      string      `json:"source_id" datastore:"source_id"`
	Label         string      `json:"label" datastore:"label"`
	HasError      bool        `json:"has_errors" datastore: "has_errors"`
	Conditions    []Condition `json:"conditions" datastore: "conditions,noindex"`
}

// Same format for a lot of stuff
type Condition struct {
	Condition   WorkflowAppActionParameter `json:"condition" datastore:"condition"`
	Source      WorkflowAppActionParameter `json:"source" datastore:"source"`
	Destination WorkflowAppActionParameter `json:"destination" datastore:"destination"`
}

type Schedule struct {
	Name              string `json:"name" datastore:"name"`
	Frequency         string `json:"frequency" datastore:"frequency"`
	ExecutionArgument string `json:"execution_argument" datastore:"execution_argument,noindex"`
	Id                string `json:"id" datastore:"id"`
	OrgId             string `json:"org_id" datastore:"org_id"`
	Environment       string `json:"environment" datastore:"environment"`
}

type Workflow struct {
	Actions       []Action   `json:"actions" datastore:"actions,noindex"`
	Branches      []Branch   `json:"branches" datastore:"branches,noindex"`
	Triggers      []Trigger  `json:"triggers" datastore:"triggers,noindex"`
	Schedules     []Schedule `json:"schedules" datastore:"schedules,noindex"`
	Configuration struct {
		ExitOnError  bool `json:"exit_on_error" datastore:"exit_on_error"`
		StartFromTop bool `json:"start_from_top" datastore:"start_from_top"`
	} `json:"configuration,omitempty" datastore:"configuration"`
	Created           int64    `json:"created" datastore:"created"`
	Edited            int64    `json:"edited" datastore:"edited"`
	LastRuntime       int64    `json:"last_runtime" datastore:"last_runtime"`
	Errors            []string `json:"errors,omitempty" datastore:"errors"`
	Tags              []string `json:"tags,omitempty" datastore:"tags"`
	ID                string   `json:"id" datastore:"id"`
	IsValid           bool     `json:"is_valid" datastore:"is_valid"`
	Name              string   `json:"name" datastore:"name"`
	Description       string   `json:"description" datastore:"description,noindex"`
	Start             string   `json:"start" datastore:"start"`
	Owner             string   `json:"owner" datastore:"owner"`
	Sharing           string   `json:"sharing" datastore:"sharing"`
	Org               []Org    `json:"org,omitempty" datastore:"org"`
	ExecutingOrg      Org      `json:"execution_org,omitempty" datastore:"execution_org"`
	OrgId             string   `json:"org_id,omitempty" datastore:"org_id"`
	WorkflowVariables []struct {
		Description string `json:"description" datastore:"description,noindex"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value,noindex"`
	} `json:"workflow_variables" datastore:"workflow_variables"`
	ExecutionVariables []struct {
		Description string `json:"description" datastore:"description,noindex"`
		ID          string `json:"id" datastore:"id"`
		Name        string `json:"name" datastore:"name"`
		Value       string `json:"value" datastore:"value,noindex"`
	} `json:"execution_variables,omitempty" datastore:"execution_variables"`
	ExecutionEnvironment string `json:"execution_environment" datastore:"execution_environment"`
}

type ActionResult struct {
	Action        Action `json:"action" datastore:"action,noindex"`
	ExecutionId   string `json:"execution_id" datastore:"execution_id"`
	Authorization string `json:"authorization" datastore:"authorization"`
	Result        string `json:"result" datastore:"result,noindex"`
	StartedAt     int64  `json:"started_at" datastore:"started_at"`
	CompletedAt   int64  `json:"completed_at" datastore:"completed_at"`
	Status        string `json:"status" datastore:"status"`
}

type Authentication struct {
	Required   bool                   `json:"required" datastore:"required" yaml:"required" `
	Parameters []AuthenticationParams `json:"parameters" datastore:"parameters" yaml:"parameters"`
}

type AuthenticationParams struct {
	Description string           `json:"description" datastore:"description,noindex" yaml:"description"`
	ID          string           `json:"id" datastore:"id" yaml:"id"`
	Name        string           `json:"name" datastore:"name" yaml:"name"`
	Example     string           `json:"example" datastore:"example" yaml:"example"`
	Value       string           `json:"value,omitempty" datastore:"value,noindex" yaml:"value"`
	Multiline   bool             `json:"multiline" datastore:"multiline" yaml:"multiline"`
	Required    bool             `json:"required" datastore:"required" yaml:"required"`
	In          string           `json:"in" datastore:"in" yaml:"in"`
	Schema      SchemaDefinition `json:"schema" datastore:"schema" yaml:"schema"`
	Scheme      string           `json:"scheme" datastore:"scheme" yaml:"scheme"` // Deprecated
}

type AuthenticationStore struct {
	Key   string `json:"key" datastore:"key"`
	Value string `json:"value" datastore:"value,noindex"`
}

type ExecutionRequestWrapper struct {
	Data []ExecutionRequest `json:"data"`
}

type AppExecutionExample struct {
	AppName         string   `json:"app_name" datastore:"app_name"`
	AppVersion      string   `json:"app_version" datastore:"app_version"`
	AppAction       string   `json:"app_action" datastore:"app_action"`
	AppId           string   `json:"app_id" datastore:"app_id"`
	ExampleId       string   `json:"example_id" datastore:"example_id"`
	SuccessExamples []string `json:"success_examples" datastore:"success_examples,noindex"`
	FailureExamples []string `json:"failure_examples" datastore:"failure_examples,noindex"`
}

// removes every container except itself (worker)
func shutdown(executionId, workflowId string) {
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[ERROR] Unable to create docker client: %s", err)
		os.Exit(3)
	}

	containerOptions := types.ContainerListOptions{
		All: true,
	}

	containers, err := dockercli.ContainerList(context.Background(), containerOptions)
	if err != nil {
		panic(err)
	}
	_ = containers

	for _, container := range containers {
		for _, name := range container.Names {
			if strings.Contains(name, executionId) {
				// FIXME - reinstate - not here for debugging
				//err = removeContainer(container.ID)
				//if err != nil {
				//	log.Printf("Failed removing %s before shutdown.", name)
				//}

				break
			}
		}

	}

	fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/executions/%s/abort", baseUrl, workflowId, executionId)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Println("[INFO] Failed building request: %s", err)
	}

	// FIXME: Add an API call to the backend
	authorization := os.Getenv("AUTHORIZATION")
	if len(authorization) > 0 {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authorization))
	} else {
		log.Printf("[ERROR] No authorization specified for abort")
	}

	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{
		Transport: &http.Transport{
			Proxy: nil,
		},
	}

	httpProxy := os.Getenv("HTTP_PROXY")
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if (len(httpProxy) > 0 || len(httpsProxy) > 0) && baseUrl != "http://shuffle-backend:5001" {
		client = &http.Client{}
	} else {
		if len(httpProxy) > 0 {
			log.Printf("[INFO] Running with HTTP proxy %s (env: HTTP_PROXY)", httpProxy)
		}
		if len(httpsProxy) > 0 {
			log.Printf("[INFO] Running with HTTPS proxy %s (env: HTTPS_PROXY)", httpsProxy)
		}
	}
	_, err = client.Do(req)
	if err != nil {
		log.Printf("[INFO] Failed abort request: %s", err)
	}

	log.Printf("[INFO] Finished shutdown.")
	os.Exit(3)
}

// Deploys the internal worker whenever something happens
func deployApp(cli *dockerclient.Client, image string, identifier string, env []string) error {
	// form basic hostConfig
	hostConfig := &container.HostConfig{
		LogConfig: container.LogConfig{
			Type:   "json-file",
			Config: map[string]string{},
		},
	}

	// form container id and use it as network source if it's not empty
	if containerId != "" {
		hostConfig.NetworkMode = container.NetworkMode(fmt.Sprintf("container:%s", containerId))
	} else {
		log.Printf("[WARNING] Empty self container id, continue without NetworkMode")
	}

	config := &container.Config{
		Image: image,
		Env:   env,
	}

	cont, err := cli.ContainerCreate(
		context.Background(),
		config,
		hostConfig,
		nil,
		nil,
		identifier,
	)

	if err != nil {
		log.Printf("Container CREATE error: %s", err)
		return err
	}

	err = cli.ContainerStart(context.Background(), cont.ID, types.ContainerStartOptions{})
	if err != nil {
		log.Printf("[ERROR] Failed to start container in environment %s: %s", environment, err)
		//shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
		return err
	}

	log.Printf("[INFO] Container %s is created", cont.ID)
	return nil
}

func removeContainer(containername string) error {
	ctx := context.Background()

	cli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("[INFO] Unable to create docker client: %s", err)
		return err
	}

	// FIXME - ucnomment
	//	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
	//		All: true,
	//	})

	_ = ctx
	_ = cli
	//if err := cli.ContainerStop(ctx, containername, nil); err != nil {
	//	log.Printf("Unable to stop container %s - running removal anyway, just in case: %s", containername, err)
	//}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	// FIXME - remove comments etc
	_ = removeOptions
	//if err := cli.ContainerRemove(ctx, containername, removeOptions); err != nil {
	//	log.Printf("Unable to remove container: %s", err)
	//}

	return nil
}

func runFilter(workflowExecution WorkflowExecution, action Action) {
	// 1. Get the parameter $.#.id
	if action.Label == "filter_cases" && len(action.Parameters) > 0 {
		if action.Parameters[0].Variant == "ACTION_RESULT" {
			param := action.Parameters[0]
			value := param.Value
			_ = value

			// Loop cases.. Hmm, that's tricky
		}
	} else {
		log.Printf("No handler for filter %s with %d params", action.Label, len(action.Parameters))
	}

}

func handleSubworkflowExecution(client *http.Client, workflowExecution WorkflowExecution, action Trigger, baseAction Action) error {
	apikey := ""
	workflowId := ""
	executionArgument := ""
	for _, parameter := range action.Parameters {
		log.Printf("Parameter name: %s", parameter.Name)
		if parameter.Name == "user_apikey" {
			apikey = parameter.Value
		} else if parameter.Name == "workflow" {
			workflowId = parameter.Value
		} else if parameter.Name == "data" {
			executionArgument = parameter.Value
		}
	}

	//handleSubworkflowExecution(workflowExecution, action)
	status := "SUCCESS"
	baseResult := `{"success": true}`
	if len(apikey) == 0 || len(workflowId) == 0 {
		status = "FAILURE"
		baseResult = `{"success": false}`
	} else {
		log.Printf("Should execute workflow %s with APIKEY %s and data %s", workflowId, apikey, executionArgument)
		fullUrl := fmt.Sprintf("%s/api/workflows/%s/execute", baseUrl, workflowId)
		req, err := http.NewRequest(
			"POST",
			fullUrl,
			bytes.NewBuffer([]byte(executionArgument)),
		)

		if err != nil {
			log.Printf("Error building test request: %s", err)
			return err
		}

		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apikey))
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("Error running test request: %s", err)
			return err
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("Failed reading body when waiting: %s", err)
			return err
		}

		log.Printf("Execution Result: %s", body)
	}

	timeNow := time.Now().Unix()
	result := ActionResult{
		Action:        baseAction,
		ExecutionId:   workflowExecution.ExecutionId,
		Authorization: workflowExecution.Authorization,
		Result:        baseResult,
		StartedAt:     timeNow,
		CompletedAt:   0,
		Status:        status,
	}

	resultData, err := json.Marshal(result)
	if err != nil {
		return err
	}

	fullUrl := fmt.Sprintf("%s/api/v1/streams", baseUrl)
	req, err := http.NewRequest(
		"POST",
		fullUrl,
		bytes.NewBuffer([]byte(resultData)),
	)

	if err != nil {
		log.Printf("Error building test request: %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("Error running test request: %s", err)
		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body when waiting: %s", err)
		return err
	}

	log.Printf("[INFO] Subworkflow Body: %s", string(body))

	if status == "FAILURE" {
		return errors.New("[ERROR] Failed to execute subworkflow")
	} else {
		return nil
	}
}

func handleExecution(client *http.Client, req *http.Request, workflowExecution WorkflowExecution) error {
	// if no onprem runs (shouldn't happen, but extra check), exit
	// if there are some, load the images ASAP for the app
	dockercli, err := dockerclient.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
	}

	onpremApps := []string{}
	startAction := workflowExecution.Start
	if len(startAction) == 0 {
		log.Printf("Didn't find execution start action. Setting it to workflow start action.")
		startAction = workflowExecution.Workflow.Start
	}

	log.Printf("Startaction: %s", startAction)
	toExecuteOnprem := []string{}
	parents := map[string][]string{}
	children := map[string][]string{}

	// source = parent node, dest = child node
	// parent can have more children, child can have more parents
	extra := 0
	triggersHandled := []string{}
	for _, branch := range workflowExecution.Workflow.Branches {
		// Check what the parent is first. If it's trigger - skip
		sourceFound := false
		destinationFound := false
		for _, action := range workflowExecution.Workflow.Actions {
			if action.ID == branch.SourceID {
				sourceFound = true
			}

			if action.ID == branch.DestinationID {
				destinationFound = true
			}
		}

		for _, trigger := range workflowExecution.Workflow.Triggers {
			log.Printf("Appname trigger (0): %s", trigger.AppName)
			if trigger.AppName == "User Input" || trigger.AppName == "Shuffle Workflow" {
				log.Printf("%s is a special trigger. Checking where.", trigger.AppName)

				found := false
				for _, check := range triggersHandled {
					if check == trigger.ID {
						found = true
						break
					}
				}

				if !found {
					extra += 1
				} else {
					triggersHandled = append(triggersHandled, trigger.ID)
				}

				if trigger.ID == branch.SourceID {
					log.Printf("Trigger %s is the source!", trigger.AppName)
					sourceFound = true
				} else if trigger.ID == branch.DestinationID {
					log.Printf("Trigger %s is the destination!", trigger.AppName)
					destinationFound = true
				}
			}
		}

		if sourceFound {
			parents[branch.DestinationID] = append(parents[branch.DestinationID], branch.SourceID)
		} else {
			log.Printf("ID %s was not found in actions! Skipping parent. (TRIGGER?)", branch.SourceID)
		}

		if destinationFound {
			children[branch.SourceID] = append(children[branch.SourceID], branch.DestinationID)
		} else {
			log.Printf("ID %s was not found in actions! Skipping child. (TRIGGER?)", branch.SourceID)
		}
	}

	log.Printf("Actions: %d + Special Triggers: %d", len(workflowExecution.Workflow.Actions), extra)
	for _, action := range workflowExecution.Workflow.Actions {
		if action.Environment != environment {
			continue
		}

		toExecuteOnprem = append(toExecuteOnprem, action.ID)
		actionName := fmt.Sprintf("%s:%s_%s", baseimagename, action.AppName, action.AppVersion)
		found := false
		for _, app := range onpremApps {
			if actionName == app {
				found = true
			}
		}

		if !found {
			onpremApps = append(onpremApps, actionName)
		}
	}

	if len(onpremApps) == 0 {
		return errors.New(fmt.Sprintf("No apps to handle onprem (%s)", environment))
	}

	pullOptions := types.ImagePullOptions{}
	_ = pullOptions
	for _, image := range onpremApps {
		log.Printf("Image: %s", image)
		// Kind of gambling that the image exists.
		if strings.Contains(image, " ") {
			image = strings.ReplaceAll(image, " ", "-")
		}

		// FIXME: Reimplement for speed later
		// Skip to make it faster
		//reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
		//if err != nil {
		//	log.Printf("Failed getting %s. The app is missing or some other issue", image)
		//	shutdown(workflowExecution.ExecutionId)
		//}

		////io.Copy(os.Stdout, reader)
		//_ = reader
		//log.Printf("Successfully downloaded and built %s", image)
	}

	// Process the parents etc. How?
	visited := []string{}
	executed := []string{}
	nextActions := []string{startAction}
	firstIteration := true
	for {
		queueNodes := []string{}

		if len(workflowExecution.Results) == 0 {
			nextActions = []string{startAction}
		} else if firstIteration {
			firstIteration = false
		} else {
			// This is to re-check the nodes that exist and whether they should continue
			appendActions := []string{}
			for _, item := range workflowExecution.Results {

				// FIXME: Check whether the item should be visited or not
				// Do the same check as in walkoff.go - are the parents done?
				// If skipped and both parents are skipped: keep as skipped, otherwise queue
				if item.Status == "SKIPPED" {
					isSkipped := true

					for _, branch := range workflowExecution.Workflow.Branches {
						// 1. Finds branches where the destination is our node
						// 2. Finds results of those branches, and sees the status
						// 3. If the status isn't skipped or failure, then it will still run this node
						if branch.DestinationID == item.Action.ID {
							for _, subresult := range workflowExecution.Results {
								if subresult.Action.ID == branch.SourceID {
									if subresult.Status != "SKIPPED" && subresult.Status != "FAILURE" {
										log.Printf("\n\n\nSUBRESULT PARENT STATUS: %s\n\n\n", subresult.Status)
										isSkipped = false

										break
									}
								}
							}
						}
					}

					if isSkipped {
						//log.Printf("Skipping %s as all parents are done", item.Action.Label)
						if !arrayContains(visited, item.Action.ID) {
							log.Printf("Adding visited (1): %s", item.Action.Label)
							visited = append(visited, item.Action.ID)
						}
					} else {
						log.Printf("Continuing %s as all parents are NOT done", item.Action.Label)
						appendActions = append(appendActions, item.Action.ID)
					}
				} else {
					if item.Status == "FINISHED" {
						log.Printf("Adding visited (2): %s", item.Action.Label)
						visited = append(visited, item.Action.ID)
					}
				}

				nextActions = children[item.Action.ID]
				if len(appendActions) > 0 {
					log.Printf("APPENDED NODES: %#v", appendActions)
					nextActions = append(nextActions, appendActions...)
				}
			}
		}

		// This is a backup in case something goes wrong in this complex hellhole.
		// Max default execution time is 5 minutes for now anyway, which should take
		// care if it gets stuck in a loop.
		// FIXME: Force killing a worker should result in a notification somewhere
		if len(nextActions) == 0 {
			log.Printf("No next action. Finished? Result vs Actions: %d - %d", len(workflowExecution.Results), len(workflowExecution.Workflow.Actions))
			exit := true
			for _, item := range workflowExecution.Results {
				if item.Status == "EXECUTING" {
					exit = false
					break
				}
			}

			if exit && len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions) {
				log.Printf("Shutting down.")
				shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
			}

			// Look for the NEXT missing action
			notFound := []string{}
			for _, action := range workflowExecution.Workflow.Actions {
				found := false
				for _, result := range workflowExecution.Results {
					if action.ID == result.Action.ID {
						found = true
						break
					}
				}

				if !found {
					notFound = append(notFound, action.ID)
				}
			}

			//log.Printf("SOMETHING IS MISSING!: %#v", notFound)
			for _, item := range notFound {
				if arrayContains(executed, item) {
					log.Printf("%s has already executed but no result!", item)
					continue
				}

				// Visited means it's been touched in any way.
				outerIndex := -1
				for index, visit := range visited {
					if visit == item {
						outerIndex = index
						break
					}
				}

				if outerIndex >= 0 {
					log.Printf("Removing index %s from visited")
					visited = append(visited[:outerIndex], visited[outerIndex+1:]...)
				}

				fixed := 0
				for _, parent := range parents[item] {
					parentResult := getResult(workflowExecution, parent)
					if parentResult.Status == "FINISHED" || parentResult.Status == "SUCCESS" || parentResult.Status == "SKIPPED" || parentResult.Status == "FAILURE" {
						fixed += 1
					}
				}

				if fixed == len(parents[item]) {
					nextActions = append(nextActions, item)
				}

				// If it's not executed and not in nextActions
				// FIXME: Check if the item's parents are finished. If they're not, skip.
			}
		}

		for _, node := range nextActions {
			nodeChildren := children[node]
			for _, child := range nodeChildren {
				if !arrayContains(queueNodes, child) {
					queueNodes = append(queueNodes, child)
				}
			}
		}
		//log.Printf("NEXT: %s", nextActions)
		//log.Printf("queueNodes: %s", queueNodes)

		// IF NOT VISITED && IN toExecuteOnPrem
		// SKIP if it's not onprem
		for _, nextAction := range nextActions {
			action := getAction(workflowExecution, nextAction, environment)
			// check visited and onprem
			if arrayContains(visited, nextAction) {
				log.Printf("ALREADY VISITIED (%s): %s", action.Label, nextAction)
				continue
			}

			if action.AppName == "Shuffle Workflow" {
				log.Printf("SHUFFLE WORKFLOW: %#v", action)
				action.Environment = environment
				action.AppName = "shuffle-subflow"
				action.Name = "run_subflow"
				action.AppVersion = "1.0.0"

				//appname := action.AppName
				//appversion := action.AppVersion
				//appname = strings.Replace(appname, ".", "-", -1)
				//appversion = strings.Replace(appversion, ".", "-", -1)
				//	shuffle-subflow_1.0.0

				//visited = append(visited, action.ID)
				//executed = append(executed, action.ID)

				trigger := Trigger{}
				for _, innertrigger := range workflowExecution.Workflow.Triggers {
					if innertrigger.ID == action.ID {
						trigger = innertrigger
						break
					}
				}

				action.Parameters = []WorkflowAppActionParameter{}
				for _, parameter := range trigger.Parameters {
					parameter.Variant = "STATIC_VALUE"
					action.Parameters = append(action.Parameters, parameter)
				}

				//trigger.LargeImage = ""
				//err = handleSubworkflowExecution(client, workflowExecution, trigger, action)
				//if err != nil {
				//	log.Printf("[ERROR] Failed to execute subworkflow: %s", err)
				//} else {
				//	log.Printf("[INFO] Executed subworkflow!")
				//}
				//continue
			} else if action.AppName == "User Input" {
				log.Printf("USER INPUT!")

				if action.ID == workflowExecution.Start {
					log.Printf("Skipping because it's the startnode")
					visited = append(visited, action.ID)
					executed = append(executed, action.ID)
					continue
				} else {
					log.Printf("Should stop after this iteration because it's user-input based. %#v", action)
					trigger := Trigger{}
					for _, innertrigger := range workflowExecution.Workflow.Triggers {
						if innertrigger.ID == action.ID {
							trigger = innertrigger
							break
						}
					}

					trigger.LargeImage = ""
					triggerData, err := json.Marshal(trigger)
					if err != nil {
						log.Printf("Failed unmarshalling action: %s", err)
						triggerData = []byte("Failed unmarshalling. Cancel execution!")
					}

					err = runUserInput(client, action, workflowExecution.Workflow.ID, workflowExecution.ExecutionId, workflowExecution.Authorization, string(triggerData))
					if err != nil {
						log.Printf("Failed launching backend magic: %s", err)
						os.Exit(3)
					} else {
						log.Printf("Launched user input node succesfully!")
						os.Exit(3)
					}

					break
				}
			}

			// Not really sure how this edgecase happens.

			// FIXME
			// Execute, as we don't really care if env is not set? IDK
			if action.Environment != environment { //&& action.Environment != "" {
				log.Printf("Bad environment for node: %s. Want %s", action.Environment, environment)
				continue
			}

			// check whether the parent is finished executing
			//log.Printf("%s has %d parents", nextAction, len(parents[nextAction]))

			continueOuter := true
			if action.IsStartNode {
				continueOuter = false
			} else if len(parents[nextAction]) > 0 {
				// FIXME - wait for parents to finishe executing
				fixed := 0
				for _, parent := range parents[nextAction] {
					parentResult := getResult(workflowExecution, parent)
					if parentResult.Status == "FINISHED" || parentResult.Status == "SUCCESS" || parentResult.Status == "SKIPPED" || parentResult.Status == "FAILURE" {
						fixed += 1
					}
				}

				if fixed == len(parents[nextAction]) {
					continueOuter = false
				}
			} else {
				continueOuter = false
			}

			if continueOuter {
				log.Printf("Parents of %s aren't finished: %s", nextAction, strings.Join(parents[nextAction], ", "))
				//for _, tmpaction := range parents[nextAction] {
				//	action := getAction(workflowExecution, tmpaction)
				//	_ = action
				//	//log.Printf("Parent: %s", action.Label)
				//}
				// Find the result of the nodes?
				continue
			}

			// get action status
			actionResult := getResult(workflowExecution, nextAction)
			if actionResult.Action.ID == action.ID {
				log.Printf("%s already has status %s.", action.ID, actionResult.Status)
				continue
			} else {
				log.Printf("%s:%s has no status result yet. Should execute.", action.Name, action.ID)
			}

			appname := action.AppName
			appversion := action.AppVersion
			appname = strings.Replace(appname, ".", "-", -1)
			appversion = strings.Replace(appversion, ".", "-", -1)

			image := fmt.Sprintf("%s:%s_%s", baseimagename, action.AppName, action.AppVersion)
			if strings.Contains(image, " ") {
				image = strings.ReplaceAll(image, " ", "-")
			}

			identifier := fmt.Sprintf("%s_%s_%s_%s", appname, appversion, action.ID, workflowExecution.ExecutionId)
			if strings.Contains(identifier, " ") {
				identifier = strings.ReplaceAll(identifier, " ", "-")
			}

			// FIXME - check whether it's running locally yet too
			stats, err := dockercli.ContainerInspect(context.Background(), identifier)
			if err != nil || stats.ContainerJSONBase.State.Status != "running" {
				// REMOVE
				if err == nil {
					log.Printf("Status: %s, should kill: %s", stats.ContainerJSONBase.State.Status, identifier)
					err = removeContainer(identifier)
					if err != nil {
						log.Printf("Error killing container: %s", err)
					}
				} else {
					//log.Printf("WHAT TO DO HERE?: %s", err)
				}
			} else if stats.ContainerJSONBase.State.Status == "running" {
				continue
			}

			if len(action.Parameters) == 0 {
				action.Parameters = []WorkflowAppActionParameter{}
			}

			if len(action.Errors) == 0 {
				action.Errors = []string{}
			}

			// marshal action and put it in there rofl
			log.Printf("Time to execute %s (%s) with app %s:%s, function %s, env %s with %d parameters.", action.ID, action.Label, action.AppName, action.AppVersion, action.Name, action.Environment, len(action.Parameters))

			actionData, err := json.Marshal(action)
			if err != nil {
				log.Printf("Failed unmarshalling action: %s", err)
				continue
			}

			if action.AppID == "0ca8887e-b4af-4e3e-887c-87e9d3bc3d3e" {
				log.Printf("\nShould run filter: %#v\n\n", action)
				runFilter(workflowExecution, action)
				continue
			}

			executionData, err := json.Marshal(workflowExecution)
			if err != nil {
				log.Printf("Failed marshalling executiondata: %s", err)
				executionData = []byte("")
			}

			// Sending full execution so that it won't have to load in every app
			// This might be an issue if they can read environments, but that's alright
			// if everything is generated during execution
			env := []string{
				fmt.Sprintf("ACTION=%s", string(actionData)),
				fmt.Sprintf("EXECUTIONID=%s", workflowExecution.ExecutionId),
				fmt.Sprintf("AUTHORIZATION=%s", workflowExecution.Authorization),
				fmt.Sprintf("CALLBACK_URL=%s", baseUrl),
			}

			// Fixes issue:
			// standard_init_linux.go:185: exec user process caused "argument list too long"
			// https://devblogs.microsoft.com/oldnewthing/20100203-00/?p=15083
			maxSize := 32700 - len(string(actionData)) - 2000
			if len(executionData) < maxSize {
				log.Printf("ADDING FULL_EXECUTION because size is smaller than %d", maxSize)
				env = append(env, fmt.Sprintf("FULL_EXECUTION=%s", string(executionData)))
			} else {
				log.Printf("Skipping FULL_EXECUTION because size is larger than %d", maxSize)
			}

			// Uses a few ways of getting / checking if an app is available
			// 1. Try original
			// 2. Go to lowercase
			// 3. Add remote repo location
			// 4. Actually download last repo

			err = deployApp(dockercli, image, identifier, env)
			if err != nil {
				// Trying to replace with lowercase to deploy again. This seems to work with Dockerhub well.
				// FIXME: Should try to remotely download directly if this persists.
				image = fmt.Sprintf("%s:%s_%s", baseimagename, strings.ToLower(action.AppName), action.AppVersion)
				if strings.Contains(image, " ") {
					image = strings.ReplaceAll(image, " ", "-")
				}

				err = deployApp(dockercli, image, identifier, env)
				if err != nil {
					image = fmt.Sprintf("%s/%s:%s_%s", registryName, baseimagename, strings.ToLower(action.AppName), action.AppVersion)
					if strings.Contains(image, " ") {
						image = strings.ReplaceAll(image, " ", "-")
					}

					err = deployApp(dockercli, image, identifier, env)
					if err != nil {
						log.Printf("[WARNING] Failed deploying image THRICE. Attempting to download the latter as last resort.")
						reader, err := dockercli.ImagePull(context.Background(), image, pullOptions)
						if err != nil {
							log.Printf("[ERROR] Failed getting %s. The couldn't be find locally, AND is missing.", image)
							shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
						}

						buildBuf := new(strings.Builder)
						_, err = io.Copy(buildBuf, reader)
						if err != nil {
							log.Printf("[ERROR] Error in IO copy: %s", err)
							shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
						} else {
							if strings.Contains(buildBuf.String(), "errorDetail") {
								log.Printf("[ERROR] Docker build:\n%s\nERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), image)
								shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
							}

							log.Printf("[INFO] Successfully downloaded %s", image)
						}

						err = deployApp(dockercli, image, identifier, env)
						if err != nil {

							log.Printf("[ERROR] Failed deploying image for the FOURTH time. Aborting if the image doesn't exist")
							if strings.Contains(err.Error(), "No such image") {
								//log.Printf("[WARNING] Failed deploying %s from image %s: %s", identifier, image, err)
								log.Printf("[ERROR] Image doesn't exist. Shutting down")
								shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
							}
						}
					}
				}
			}

			log.Printf("Adding visited (3): %s", action.Label)

			visited = append(visited, action.ID)
			executed = append(executed, action.ID)

			// If children of action.ID are NOT in executed:
			// Remove them from visited.
			//log.Printf("EXECUTED: %#v", executed)
		}

		//log.Println(nextAction)
		//log.Println(startAction, children[startAction])

		// FIXME - new request here
		// FIXME - clean up stopped (remove) containers with this execution id
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("[ERROR] Failed making request: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("[ERROR] Failed reading body: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if newresp.StatusCode != 200 {
			log.Printf("[ERROR] Bad statuscode: %s\nStatusCode: %d", string(body), newresp.StatusCode)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		err = json.Unmarshal(body, &workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("[INFO] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
		}

		log.Printf("[INFO] Status: %s, Results: %d, actions: %d", workflowExecution.Status, len(workflowExecution.Results), len(workflowExecution.Workflow.Actions)+extra)
		if workflowExecution.Status != "EXECUTING" {
			log.Printf("[WARNING] Exiting as worker execution has status %s!", workflowExecution.Status)
			shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
		}

		if len(workflowExecution.Results) == len(workflowExecution.Workflow.Actions)+extra {
			shutdownCheck := true
			ctx := context.Background()
			for _, result := range workflowExecution.Results {
				if result.Status == "EXECUTING" {
					// Cleaning up executing stuff
					shutdownCheck = false
					// Check status

					containers, err := dockercli.ContainerList(ctx, types.ContainerListOptions{
						All: true,
					})
					if err != nil {
						log.Printf("Failed listing containers: %s", err)
						continue
					}

					stopContainers := []string{}
					removeContainers := []string{}
					for _, container := range containers {
						for _, name := range container.Names {
							if !strings.Contains(name, result.Action.ID) {
								continue
							}

							if container.State != "running" {
								removeContainers = append(removeContainers, container.ID)
								stopContainers = append(stopContainers, container.ID)
							}
						}
					}

					// FIXME - add killing of apps with same execution ID too
					// FIXME - stahp
					//for _, containername := range stopContainers {
					//	if err := dockercli.ContainerStop(ctx, containername, nil); err != nil {
					//		log.Printf("Unable to stop container: %s", err)
					//	} else {
					//		log.Printf("Stopped container %s", containername)
					//	}
					//}

					removeOptions := types.ContainerRemoveOptions{
						RemoveVolumes: true,
						Force:         true,
					}

					_ = removeOptions

					// FIXME - this
					//for _, containername := range removeContainers {
					//	if err := dockercli.ContainerRemove(ctx, containername, removeOptions); err != nil {
					//		log.Printf("Unable to remove container: %s", err)
					//	} else {
					//		log.Printf("Removed container %s", containername)
					//	}
					//}

					//  FIXME - send POST request to kill the container
					log.Printf("Should remove (POST request) stopped containers")
					//ret = requests.post("%s%s" % (self.url, stream_path), headers=headers, json=action_result)
				}
			}

			if shutdownCheck {
				log.Println("BREAKING BECAUSE RESULTS IS SAME LENGTH AS ACTIONS. SHOULD CHECK ALL RESULTS FOR WHETHER THEY'RE DONE")
				shutdown(workflowExecution.ExecutionId, workflowExecution.Workflow.ID)
			}
		}
		time.Sleep(time.Duration(sleepTime) * time.Second)
	}

	return nil
}

func arrayContains(visited []string, id string) bool {
	found := false
	for _, item := range visited {
		if item == id {
			found = true
		}
	}

	return found
}

func getResult(workflowExecution WorkflowExecution, id string) ActionResult {
	for _, actionResult := range workflowExecution.Results {
		if actionResult.Action.ID == id {
			return actionResult
		}
	}

	return ActionResult{}
}

func getAction(workflowExecution WorkflowExecution, id, environment string) Action {
	for _, action := range workflowExecution.Workflow.Actions {
		if action.ID == id {
			return action
		}
	}

	for _, trigger := range workflowExecution.Workflow.Triggers {
		if trigger.ID == id {
			return Action{
				ID:          trigger.ID,
				AppName:     trigger.AppName,
				Name:        trigger.AppName,
				Environment: environment,
				Label:       trigger.Label,
			}
			log.Printf("FOUND TRIGGER: %#v!", trigger)
		}
	}

	return Action{}
}

func runUserInput(client *http.Client, action Action, workflowId, workflowExecutionId, authorization string, configuration string) error {
	timeNow := time.Now().Unix()
	result := ActionResult{
		Action:        action,
		ExecutionId:   workflowExecutionId,
		Authorization: authorization,
		Result:        configuration,
		StartedAt:     timeNow,
		CompletedAt:   0,
		Status:        "WAITING",
	}

	resultData, err := json.Marshal(result)
	if err != nil {
		return err
	}

	fullUrl := fmt.Sprintf("%s/api/v1/streams", baseUrl)
	req, err := http.NewRequest(
		"POST",
		fullUrl,
		bytes.NewBuffer([]byte(resultData)),
	)

	if err != nil {
		log.Printf("Error building test request: %s", err)
		return err
	}

	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("Error running test request: %s", err)
		return err
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body when waiting: %s", err)
		return err
	}

	log.Printf("[INFO] User Input Body: %s", string(body))
	return nil
}

func runTestExecution(client *http.Client, workflowId, apikey string) (string, string) {
	fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute", baseUrl, workflowId)
	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Printf("Error building test request: %s", err)
		return "", ""
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apikey))
	newresp, err := client.Do(req)
	if err != nil {
		log.Printf("Error running test request: %s", err)
		return "", ""
	}

	body, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("Failed reading body: %s", err)
		return "", ""
	}

	log.Printf("[INFO] Test Body: %s", string(body))
	var workflowExecution WorkflowExecution
	err = json.Unmarshal(body, &workflowExecution)
	if err != nil {
		log.Printf("Failed workflowExecution unmarshal: %s", err)
		return "", ""
	}

	return workflowExecution.Authorization, workflowExecution.ExecutionId
}

// Initial loop etc
func main() {
	log.Printf("[INFO] Setting up worker environment")
	sleepTime := 5

	client := &http.Client{
		Transport: &http.Transport{
			Proxy: nil,
		},
	}

	httpProxy := os.Getenv("HTTP_PROXY")
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if (len(httpProxy) > 0 || len(httpsProxy) > 0) && baseUrl != "http://shuffle-backend:5001" {
		client = &http.Client{}
	} else {
		if len(httpProxy) > 0 {
			log.Printf("Running with HTTP proxy %s (env: HTTP_PROXY)", httpProxy)
		}
		if len(httpsProxy) > 0 {
			log.Printf("Running with HTTPS proxy %s (env: HTTPS_PROXY)", httpsProxy)
		}
	}

	// WORKER_TESTING_WORKFLOW should be a workflow ID
	authorization := ""
	executionId := ""
	testing := os.Getenv("WORKER_TESTING_WORKFLOW")
	shuffle_apikey := os.Getenv("WORKER_TESTING_APIKEY")
	if len(testing) > 0 && len(shuffle_apikey) > 0 {
		// Execute a workflow and use that info
		log.Printf("[WARNING] Running test environment for worker by executing workflow %s", testing)
		authorization, executionId = runTestExecution(client, testing, shuffle_apikey)

		//os.Exit(3)
	} else {
		authorization = os.Getenv("AUTHORIZATION")
		executionId = os.Getenv("EXECUTIONID")
		log.Printf("Running normal execution with auth %s and ID %s", authorization, executionId)
	}

	if len(authorization) == 0 {
		log.Println("[INFO] No AUTHORIZATION key set in env")
		shutdown(executionId, "")
	}

	if len(executionId) == 0 {
		log.Println("[INFO] No EXECUTIONID key set in env")
		shutdown(executionId, "")
	}

	data := fmt.Sprintf(`{"execution_id": "%s", "authorization": "%s"}`, executionId, authorization)
	fullUrl := fmt.Sprintf("%s/api/v1/streams/results", baseUrl)
	req, err := http.NewRequest(
		"POST",
		fullUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		log.Println("[ERROR] Failed making request builder for backend")
		shutdown(executionId, "")
	}

	for {
		// Because of this, it always has updated data.
		// Removed request requirement from app_sdk
		newresp, err := client.Do(req)
		if err != nil {
			log.Printf("[ERROR] Failed request: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		body, err := ioutil.ReadAll(newresp.Body)
		if err != nil {
			log.Printf("[ERROR] Failed reading body: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if newresp.StatusCode != 200 {
			log.Printf("[ERROR] %s\nStatusCode: %d", string(body), newresp.StatusCode)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		var workflowExecution WorkflowExecution
		err = json.Unmarshal(body, &workflowExecution)
		if err != nil {
			log.Printf("[ERROR] Failed workflowExecution unmarshal: %s", err)
			time.Sleep(time.Duration(sleepTime) * time.Second)
			continue
		}

		if workflowExecution.Status == "FINISHED" || workflowExecution.Status == "SUCCESS" {
			log.Printf("[INFO] Workflow %s is finished. Exiting worker.", workflowExecution.ExecutionId)
			shutdown(executionId, workflowExecution.Workflow.ID)
		}

		if workflowExecution.Status == "EXECUTING" || workflowExecution.Status == "RUNNING" {
			//log.Printf("Status: %s", workflowExecution.Status)
			err = handleExecution(client, req, workflowExecution)
			if err != nil {
				log.Printf("[INFO] Workflow %s is finished: %s", workflowExecution.ExecutionId, err)
				shutdown(executionId, workflowExecution.Workflow.ID)
			}
		} else {
			log.Printf("[INFO] Workflow %s has status %s. Exiting worker.", workflowExecution.ExecutionId, workflowExecution.Status)
			shutdown(executionId, workflowExecution.Workflow.ID)
		}

		time.Sleep(time.Duration(sleepTime) * time.Second)
	}
}
