package function

// Shuffle:
// https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Authentication/appId/e080cbf4-5dba-44b4-8643-a7c982189c16/isMSAApp//defaultBlade/Overview/servicePrincipalCreated/true

// Oauth playground:
// https://oauthplay.azurewebsites.net/

// APPS:
// https://apps.dev.microsoft.com

// REMOVE ACCESS:
// https://portal.office.com/account/#

// Developer:
// https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference

// Bots:
// https://dev.botframework.com/bots

// Connectors
// https://outlook.office.com/connectors/home/login/#/new
// https://go.microsoft.com/fwlink/?linkid=857599

import (
	//"encoding/json"
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"
)

type Info struct {
	Url         string `json:"url" datastore:"url"`
	Name        string `json:"name" datastore:"name"`
	Description string `json:"description" datastore:"description"`
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
	Id      string       `json:"id" datastore:"id"`
	Info    Info         `json:"info" datastore:"info"`
	Actions []HookAction `json:"actions" datastore:"actions"`
	Type    string       `json:"type" datastore:"type"`
	Status  string       `json:"status" datastore:"status"`
	Running bool         `json:"running" datastore:"running"`
}

type TeamsHook struct {
	MembersAdded []struct {
		ID string `json:"id"`
	} `json:"membersAdded"`
	Type           string    `json:"type"`
	Timestamp      time.Time `json:"timestamp"`
	LocalTimestamp string    `json:"localTimestamp"`
	ID             string    `json:"id"`
	ChannelID      string    `json:"channelId"`
	ServiceURL     string    `json:"serviceUrl"`
	From           struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"from"`
	Conversation struct {
		IsGroup          bool   `json:"isGroup"`
		ConversationType string `json:"conversationType"`
		ID               string `json:"id"`
		TenantID         string `json:"tenantId"`
	} `json:"conversation"`
	Recipient struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"recipient"`
	ChannelData struct {
		Team struct {
			ID string `json:"id"`
		} `json:"team"`
		EventType string `json:"eventType"`
		Tenant    struct {
			ID string `json:"id"`
		} `json:"tenant"`
	} `json:"channelData"`
}

var hook Hook
var baseUrl = "https://shuffler.io"

type OauthToken struct {
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	ExtExpiresIn int    `json:"ext_expires_in"`
	AccessToken  string `json:"access_token"`
}

type TeamsResponse struct {
	Conversation struct {
		ID string `json:"id"`
	} `json:"conversation"`
	From struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"from"`
	Recipient struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"recipient"`
	ReplyToId string `json:"replyToId"`
	Type      string `json:"type"`
	Text      string `json:"text"`
}

type O365hook struct {
	OdataContext string `json:"@odata.context"`
	Value        []struct {
		OdataType                      string      `json:"@odata.type"`
		ID                             interface{} `json:"Id"`
		SubscriptionID                 string      `json:"SubscriptionId"`
		SubscriptionExpirationDateTime time.Time   `json:"SubscriptionExpirationDateTime"`
		SequenceNumber                 int         `json:"SequenceNumber"`
		ChangeType                     string      `json:"ChangeType"`
		Resource                       string      `json:"Resource"`
		ResourceData                   struct {
			OdataType string `json:"@odata.type"`
			OdataID   string `json:"@odata.id"`
			OdataEtag string `json:"@odata.etag"`
			ID        string `json:"Id"`
		} `json:"ResourceData"`
	} `json:"value"`
}

func Authorization(resp http.ResponseWriter, request *http.Request) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Body: %s", err)
		resp.WriteHeader(403)
		return
	}

	if len(body) > 0 {
		// In here - get the email data
		// Check who it belongs to and run those workflows
		// This should be set from run.go with the callback
		// userId: {subscriptionID: {workflowID}}
		// E.g. workflow: {auth: {userId
		// workflow: {trigger: {

		err = forwardRequest(body)
		if err != nil {
			log.Printf("Failed unmarshal: %s", err)
			resp.WriteHeader(403)
			return
		}

		resp.WriteHeader(200)
		resp.Write([]byte("OK"))
		return
	}

	token := request.URL.Query().Get("validationToken")
	if len(token) == 0 {
		log.Println("Validation token is missing")
		resp.WriteHeader(403)
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(string(token)))
}

// GetUserDetails - Get one user's details from randomuser.me API
func forwardRequest(body []byte) error {
	callbackUrl := os.Getenv("CALLBACKURL")
	workflowId := os.Getenv("WORKFLOW_ID")
	apikey := os.Getenv("FUNCTION_APIKEY")

	fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute", callbackUrl, workflowId)
	//log.Printf("Sending data to %s", fullUrl)

	data := fmt.Sprintf(`{"execution_argument": "%s"}`, string(body))

	req, err := http.NewRequest(
		http.MethodPost,
		fullUrl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		return err
	}

	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, apikey))
	req.Header.Add("Content-Type", "application/json")
	randomUserClient := http.Client{
		Timeout: time.Second * 5,
	}

	res, err := randomUserClient.Do(req)
	if err != nil {
		return err
	}

	log.Printf("Status: %d", res.StatusCode)
	returnbody, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return err
	}

	log.Printf("New body: %s", string(returnbody))

	//log.Println(string(newbody))
	return nil
}
