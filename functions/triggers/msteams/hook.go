package main

// APPS:
// apps.dev.microsoft.com

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
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
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

// This should be in a token thingy, to be controlled in workflow
func sendRequest(token OauthToken, message TeamsHook) error {
	//POST https://smba.trafficmanager.net/apis/v3/conversations/12345/activities
	//Authorization: Bearer eyJhbGciOiJIUzI1Ni...
	//
	//(JSON-serialized Activity message goes here)

	tmpData := TeamsResponse{}
	tmpData.Conversation.ID = message.Conversation.ID
	tmpData.From = message.Recipient
	tmpData.Recipient = message.From
	tmpData.ReplyToId = message.ID
	tmpData.Type = "message"
	tmpData.Text = "HELO"

	data, err := json.Marshal(tmpData)
	if err != nil {
		return err
	}

	// /v3/conversations/{conversationId}/activities/{activityId}
	fullurl := fmt.Sprintf("%sv3/conversations/%s/activities", message.ServiceURL, message.Conversation.ID)
	log.Println(fullurl)
	log.Println(string(data))
	req, err := http.NewRequest(
		http.MethodPost,
		fullurl,
		bytes.NewBuffer([]byte(data)),
	)

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))
	req.Header.Add("Content-Type", "application/json")
	if err != nil {
		return err
	}

	client := http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return err
	}

	log.Printf("Status: %d", res.StatusCode)
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return err
	}

	log.Println(string(body))

	return nil
}

// If you're finding this: its from a test project :)
func get_accesstoken() (OauthToken, error) {
	client_id := "9a2a2a63-c63c-4487-baf0-4ff3f4873a7f"
	client_secret := ":3]D6oFimiXbuV20xH?Dzu@LR*6IFVbq"
	fullurl := fmt.Sprintf("https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token")
	data := fmt.Sprintf("grant_type=client_credentials&client_id=%s&client_secret=%s&scope=https://api.botframework.com/.default", client_id, client_secret)

	log.Println(data)

	req, err := http.NewRequest(
		http.MethodPost,
		fullurl,
		bytes.NewBuffer([]byte(data)),
	)

	if err != nil {
		return OauthToken{}, err
	}

	client := http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return OauthToken{}, err
	}

	log.Printf("Status: %d", res.StatusCode)
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return OauthToken{}, err
	}

	token := OauthToken{}
	err = json.Unmarshal(body, &token)
	if err != nil {
		return OauthToken{}, err
	}

	return token, nil
}

//func CheckTenantId(message TeamsHook) {
//	fullurl := fmt.Sprintf("%s/api/v1/functions/tenants/%s", baseUrl, message.Conversation.TenantID)
//	req, err := http.NewRequest(
//		http.MethodPost,
//		fullurl,
//		bytes.NewBuffer([]byte(data)),
//	)
//
//	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, baseApikey))
//	req.Header.Add("Content-Type", "application/json")
//	if err != nil {
//		return []string{}, err
//	}
//
//	client := http.Client{}
//	res, err := client.Do(req)
//	if err != nil {
//		return []string{}, err
//	}
//
//	log.Printf("Status: %d", res.StatusCode)
//	body, err := ioutil.ReadAll(res.Body)
//	if err != nil {
//		return []string{}, err
//	}
//}

func Authorization(resp http.ResponseWriter, request *http.Request) {
	// FIXME - don't have this here, but before loops etc
	// How to keep it refreshed?
	token, err := get_accesstoken()
	if err != nil {
		log.Printf("Failed: %s", err)
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		return
	}

	log.Println("Data")
	log.Println(string(body))

	hook := TeamsHook{}
	err = json.Unmarshal(body, &hook)
	if err != nil {
		resp.WriteHeader(200)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Only handle messages currently
	if hook.Type != "message" {
		resp.WriteHeader(200)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Find the ORG based on the above info. How?
	// MSTeams hook should have it attached somehow?

	log.Printf(string(body))
	//log.Printf(hook.ServiceURL)
	//log.Printf(hook.ChannelID)
	//log.Printf(hook.ID)
	//log.Printf("%#v", hook.Conversation)

	err = sendRequest(token, hook)
	if err != nil {
		log.Printf("Failed: %s", err)
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func loadConfiguration(fullUrl string, apikey string) (Hook, error) {
	client := &http.Client{}

	req, err := http.NewRequest(
		"GET",
		fullUrl,
		nil,
	)

	if err != nil {
		log.Printf("Error making http request: %s", req)
		return Hook{}, err
	}

	req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, apikey))
	req.Header.Add("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error in http request: %s", req)
		return Hook{}, err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %s", req)
		return Hook{}, err
	}

	err = json.Unmarshal(body, &hook)
	if err != nil {
		log.Printf("Failed unmarshaling hook API", req)
		return Hook{}, err
	}

	return hook, nil
}

// GetUserDetails - Get one user's details from randomuser.me API
func ForwardRequest(resp http.ResponseWriter, request *http.Request) error {
	callbackUrl := os.Getenv("CALLBACKURL")
	hookId := os.Getenv("HOOKID")
	apikey := os.Getenv("FUNCTION_APIKEY")

	hook, err := loadConfiguration(
		fmt.Sprintf("%s/api/v1/hooks/%s", callbackUrl, hookId),
		apikey,
	)

	log.Println("Done loading!")

	if err != nil {
		return err
	}

	log.Printf("%#v", hook)

	// Find all things to execute
	workflowUrls := []string{}
	for _, item := range hook.Actions {
		if item.Type == "" {
			log.Printf("CONTINUE AAS EMPTY ITEM: %#v", item)
			continue
		}

		if item.Type == "workflow" {
			workflowUrls = append(workflowUrls, item.Id)
		}
	}

	if len(workflowUrls) == 0 {
		return errors.New("No actions to do yet")
	}

	log.Printf("Should send data to the following: %s", strings.Join(workflowUrls, ", "))

	randomUserClient := http.Client{
		Timeout: time.Second * 3,
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		return err
	}

	// Prepare data
	type arg struct {
		ExecutionArgument string `json:"execution_argument"`
	}
	data := arg{
		ExecutionArgument: string(body),
	}

	newjson, err := json.Marshal(data)
	if err != nil {
		return err
	}

	// Loop all executions to run
	for _, item := range workflowUrls {
		fullUrl := fmt.Sprintf("%s/api/v1/workflows/%s/execute", callbackUrl, item)
		log.Printf("Sending data to %s", fullUrl)
		req, err := http.NewRequest(
			http.MethodPost,
			fullUrl,
			bytes.NewBuffer(newjson),
		)

		req.Header.Add("Authorization", fmt.Sprintf(`Bearer %s`, apikey))
		req.Header.Add("Content-Type", "application/json")
		if err != nil {
			return err
		}

		res, err := randomUserClient.Do(req)
		if err != nil {
			return err
		}

		log.Printf("Status: %d", res.StatusCode)
		body, err := ioutil.ReadAll(res.Body)
		if err != nil {
			return err
		}

		log.Printf(string(body))
	}

	//log.Println(string(newbody))
	return nil
}
