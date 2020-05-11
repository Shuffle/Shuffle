package function

// BOTS
// https://dev.botframework.com/bots/channels?id=Shuffle

// APPS:
// apps.dev.microsoft.com

// REMOVE ACCESS:
// https://portal.office.com/account/#

// Developer:
// https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference

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

var hook Hook

func Authorization(resp http.ResponseWriter, request *http.Request) {
	apikey := os.Getenv("FUNCTION_APIKEY")
	callbackUrl := os.Getenv("CALLBACKURL")
	hookId := os.Getenv("HOOKID")
	if len(apikey) == 0 {
		log.Println("Env FUNCTION_APIKEY not set")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Internal error"}`)))
		return
	}

	if len(callbackUrl) == 0 {
		log.Println("Env CALLBACKURL not set")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Internal error"}`)))
		return
	}

	if len(hookId) == 0 {
		log.Println("Env HOOKID not set")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Internal error"}`)))
		return
	}

	authorization := request.Header.Get("Authorization")
	if len(authorization) == 0 {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Authorization header required"}`)))
		return
	}

	if !strings.HasPrefix(authorization, "Bearer") {
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Authorization header must start with Bearer"}`)))
		return
	}

	apikeyCheck := strings.Split(authorization, " ")
	if len(apikeyCheck) != 2 {
		log.Println("Length is not 2 for apikey: %s vs %s", apikeyCheck[1], apikey)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Invalid Apikey"}`)))
		return
	}

	if apikeyCheck[1] != apikey {
		log.Printf("Apikeys are not equal. Failed authentication.")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Invalid Apikey"}`)))
		return
	}

	err := ForwardRequest(resp, request)
	if err != nil {
		log.Printf("Error: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
		return
	}

	log.Println("Success?")
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
