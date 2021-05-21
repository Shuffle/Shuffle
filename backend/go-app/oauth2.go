package main

import (
	"github.com/frikky/shuffle-shared"

	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/oauth2"
)

func getOutlookAttachment(client *http.Client, emailId, attachmentId string) ([]shuffle.FullEmail, error) {
	//requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/ec03b4f2-fccf-4c35-b0eb-be85a0f5dd43/mailFolders")

	requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/%s/attachments/%s", emailId, attachmentId)
	//log.Printf("Outlook email URL: %#v", requestUrl)

	ret, err := client.Get(requestUrl)
	if err != nil {
		log.Printf("[INFO] OutlookErr: %s", err)
		return []shuffle.FullEmail{}, err
	}

	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		log.Printf("[WARNING] Failed body decoding from outlook email")
		return []shuffle.FullEmail{}, err
	}

	//type FullEmail struct {
	log.Printf("[INFO] Attachment Body: %s", string(body))
	log.Printf("[INFO] Status email: %d", ret.StatusCode)
	if ret.StatusCode != 200 {
		return []shuffle.FullEmail{}, err
	}

	//log.Printf("Body: %s", string(body))

	/*
		parsedmail := FullEmail{}
		err = json.Unmarshal(body, &parsedmail)
		if err != nil {
			log.Printf("[INFO] Email unmarshal error: %s", err)
			return []FullEmail{}, err
		}

		emails = append(emails, parsedmail)
	*/

	return []shuffle.FullEmail{}, nil
}

func getOutlookEmail(client *http.Client, maildata shuffle.MailData) ([]shuffle.FullEmail, error) {
	//requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/ec03b4f2-fccf-4c35-b0eb-be85a0f5dd43/mailFolders")

	emails := []shuffle.FullEmail{}
	for _, email := range maildata.Value {
		//messageId := email.Resourcedata.ID
		//requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/me/%s", messageId)
		requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/%s", email.Resource)
		//log.Printf("Outlook email URL: %#v", requestUrl)

		ret, err := client.Get(requestUrl)
		if err != nil {
			log.Printf("[INFO] OutlookErr: %s", err)
			return []shuffle.FullEmail{}, err
		}

		body, err := ioutil.ReadAll(ret.Body)
		if err != nil {
			log.Printf("[WARNING] Failed body decoding from outlook email")
			return []shuffle.FullEmail{}, err
		}

		//type shuffle.FullEmail struct {
		//log.Printf("[INFO] EMAIL Body: %s", string(body))
		//log.Printf("[INFO] Status email: %d", ret.StatusCode)
		if ret.StatusCode != 200 {
			return []shuffle.FullEmail{}, err
		}

		//log.Printf("Body: %s", string(body))

		parsedmail := shuffle.FullEmail{}
		err = json.Unmarshal(body, &parsedmail)
		if err != nil {
			log.Printf("[INFO] Email unmarshal error: %s", err)
			return []shuffle.FullEmail{}, err
		}

		emails = append(emails, parsedmail)
	}

	return emails, nil
}

func getOutlookProfile(client *http.Client) (shuffle.OutlookProfile, error) {
	requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/me?$select=mail")

	ret, err := client.Get(requestUrl)
	if err != nil {
		log.Printf("[INFO] Folder error: %s", err)
		return shuffle.OutlookProfile{}, err
	}

	log.Printf("[INFO] Status profile: %d", ret.StatusCode)
	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		log.Printf("[INFO] Body: %s", err)
		return shuffle.OutlookProfile{}, err
	}

	log.Printf("[INFO] BODY: %s", string(body))

	profile := shuffle.OutlookProfile{}
	err = json.Unmarshal(body, &profile)
	if err != nil {
		log.Printf("Unmarshal: %s", err)
		return shuffle.OutlookProfile{}, err
	}

	return profile, nil
}

func handleNewOutlookRegister(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[INFO] Api authentication failed in getting specific trigger: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	code := request.URL.Query().Get("code")
	if len(code) == 0 {
		log.Println("No code")
		resp.WriteHeader(401)
		return
	}

	url := fmt.Sprintf("http://%s%s", request.Host, request.URL.EscapedPath())
	log.Println(url)
	ctx := context.Background()
	_, accessToken, err := getOutlookClient(ctx, code, shuffle.OauthToken{}, url)
	if err != nil {
		log.Printf("Oauth client failure - outlook register: %s", err)
		resp.WriteHeader(401)
		return
	}

	// This should be possible, and will also give the actual username

	/*
		profile, err := getOutlookProfile(client)
		if err != nil {
			log.Printf("Outlook profile failure: %s", err)
			resp.WriteHeader(401)
			return
		}
	*/

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
	trigger := shuffle.TriggerAuth{}
	for _, item := range stateitems {
		itemsplit := strings.Split(item, "%3D")
		if len(itemsplit) == 1 {
			itemsplit = strings.Split(item, "=")
		}

		if len(itemsplit) != 2 {
			continue
		}

		//log.Printf("ITEM: %#v", itemsplit)

		// Do something here
		if itemsplit[0] == "workflow_id" {
			trigger.WorkflowId = itemsplit[1]
		} else if itemsplit[0] == "trigger_id" {
			trigger.Id = itemsplit[1]
		} else if itemsplit[0] == "type" {
			trigger.Type = itemsplit[1]
		} else if itemsplit[0] == "start" {
			trigger.Start = itemsplit[1]
		} else if itemsplit[0] == "username" {
			trigger.Username = itemsplit[1]
			trigger.Owner = itemsplit[1]
			senderUser = itemsplit[1]
		}
	}

	// THis is an override based on the user in oauth return
	/*
		if len(profile.Mail) > 0 {
			trigger.Username = profile.Mail
		}
	*/

	trigger.Code = code
	trigger.OauthToken = shuffle.OauthToken{
		AccessToken:  accessToken.AccessToken,
		TokenType:    accessToken.TokenType,
		RefreshToken: accessToken.RefreshToken,
		Expiry:       accessToken.Expiry,
	}

	//log.Printf("%#v", trigger)
	log.Println(trigger.WorkflowId)
	log.Println(trigger.Id)
	log.Println(senderUser)
	log.Println(trigger.Type)
	log.Printf("STARTNODE: %s", trigger.Start)
	log.Printf("[INFO] Attempting to set up outlook trigger for %s", senderUser)
	if trigger.WorkflowId == "" || trigger.Id == "" || senderUser == "" || trigger.Type == "" {
		log.Printf("[INFO] All oauth items need to contain data to register a new state")
		resp.WriteHeader(401)
		return
	}

	// Should also update the user
	Userdata, err := shuffle.GetUser(ctx, user.Id)
	if err != nil {
		log.Printf("[INFO] Username %s doesn't exist (oauth2): %s", trigger.Username, err)
		resp.WriteHeader(401)
		return
	}

	Userdata.Authentication = append(Userdata.Authentication, shuffle.UserAuth{
		Name:        "Outlook",
		Description: "oauth2",
		Workflows:   []string{trigger.WorkflowId},
		Username:    trigger.Username,
		Fields: []shuffle.UserAuthField{
			shuffle.UserAuthField{
				Key:   "trigger_id",
				Value: trigger.Id,
			},
			shuffle.UserAuthField{
				Key:   "username",
				Value: trigger.Username,
			},
			shuffle.UserAuthField{
				Key:   "code",
				Value: code,
			},
			shuffle.UserAuthField{
				Key:   "type",
				Value: trigger.Type,
			},
		},
	})

	// Set apikey for the user if they don't have one
	err = shuffle.SetUser(ctx, Userdata, true)
	if err != nil {
		log.Printf("Failed setting user data for %s: %s", Userdata.Username, err)
		resp.WriteHeader(401)
		return
	}

	err = shuffle.SetTriggerAuth(ctx, trigger)
	if err != nil {
		log.Printf("Failed to set trigger auth for %s - %s", trigger.Username, err)
		resp.WriteHeader(401)
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

// THis all of a sudden became really horrible.. fml
func getOutlookClient(ctx context.Context, code string, accessToken shuffle.OauthToken, redirectUri string) (*http.Client, *oauth2.Token, error) {

	conf := &oauth2.Config{
		ClientID:     "fd55c175-aa30-4fa6-b303-09a29fb3f750",
		ClientSecret: "14OBKgUpov.D7fe0~hp0z-cIQdP~SlYm.8",
		Scopes: []string{
			"Mail.Read",
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
	}

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

func handleGetSpecificTrigger(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
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

		workflowId = location[5]
	}

	if strings.Contains(workflowId, "?") {
		workflowId = strings.Split(workflowId, "?")[0]
	}

	ctx := context.Background()
	trigger, err := shuffle.GetTriggerAuth(ctx, workflowId)
	if err != nil {
		log.Printf("[INFO] Trigger %s doesn't exist - specific trigger.", workflowId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": ""}`))
		return
	}

	if user.Username != trigger.Owner && user.Role != "admin" {
		log.Printf("Wrong user (%s) for trigger %s", user.Username, trigger.Id)
		resp.WriteHeader(401)
		return
	}

	trigger.OauthToken = shuffle.OauthToken{}
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
	t := time.Now().Local().Add(time.Minute * time.Duration(4200))
	timeFormat := fmt.Sprintf("%d-%02d-%02dT%02d:%02d:%02d.0000000Z", t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second())

	resource := fmt.Sprintf("me/mailfolders('%s')/messages", strings.Join(folderIds, "','"))
	log.Printf("[INFO] Subscription resource to get(s): %s", resource)
	sub := Subscription{
		ChangeType:         "created",
		ClientState:        "Shuffle subscription",
		NotificationURL:    notificationURL,
		ExpirationDateTime: timeFormat,
		Resource:           resource,
	}
	//ClientState:        "This is a test",

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

	log.Printf("[INFO] Subscription Status: %d", res.StatusCode)
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

// Basically the same as a webhook
func handleOutlookCallback(resp http.ResponseWriter, request *http.Request) {
	path := strings.Split(request.URL.String(), "/")
	if len(path) < 4 {
		log.Printf("[INFO] Bad outlook callback URL: %s", path)
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

		hookId = location[5]
	}

	// ID: webhook_<UID>
	if len(hookId) != 36 {
		log.Printf("[WARNING] Bad hook ID: %s (%d)", hookId, len(hookId))
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	//func getTriggerAuth(ctx context.Context, id string) (*TriggerAuth, error) {
	hook, err := shuffle.GetTriggerAuth(ctx, hookId)
	if err != nil {
		log.Printf("[INFO] Failed getting trigger %s (callback): %s", hookId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("[INFO] Body data error: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	//log.Printf("[INFO] BODY: %s. Len: %d", string(body), len(body))
	//key, ok := request.URL.Query()["validationToken"]
	//if ok {
	//}
	token := request.URL.Query().Get("validationToken")
	if len(body) == 0 && len(token) > 0 {
		log.Printf("[INFO] Should handle trigger token %s", token)
		resp.WriteHeader(200)
		resp.Write([]byte(string(token)))
		return
	}

	// 1. Take the body and parse data -> Get the email itself

	maildata := shuffle.MailData{}
	err = json.Unmarshal(body, &maildata)
	if err != nil {
		log.Printf("Maildata unmarshal error: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	redirectDomain := "localhost:5001"
	redirectUrl := fmt.Sprintf("http://%s/api/v1/triggers/outlook/register", redirectDomain)
	outlookClient, _, err := getOutlookClient(ctx, "", hook.OauthToken, redirectUrl)
	if err != nil {
		log.Printf("Oauth client failure - triggerauth: %s", err)
		resp.WriteHeader(401)
		return
	}

	emails, err := getOutlookEmail(outlookClient, maildata)
	log.Printf("[INFO] EMAILS: %d. If this is more than 1, please contact frikky@shuffler.io", len(emails))
	//log.Printf("INSIDE GET OUTLOOK EMAIL!: %#v, %s", emails, err)

	//type shuffle.FullEmail struct {
	email := shuffle.FullEmail{}
	if len(emails) == 1 {
		email = emails[0]
	}

	// Parse indicators (domains, emails, ips, domains etc)!
	newEmail := shuffle.ParsedShuffleMail{}
	newEmail.Body.ContentType = email.Body.Contenttype
	newEmail.Body.Content = email.Body.Content
	newEmail.Body.RawBody = email.Body.Content

	newEmail.Header.Subject = email.Subject
	newEmail.Header.From = email.From.Emailaddress.Address
	for _, to := range email.Torecipients {
		newEmail.Header.To = append(newEmail.Header.To, to.Emailaddress.Address)
	}
	newEmail.Header.Date = email.Receiveddatetime.String()

	newEmail.MessageID = email.ID

	if email.Hasattachments {
		log.Printf("SHOULD HANDLE ATTACHMENTS FOR EMAIL!")

		for _, attachment := range email.Attachments {
			parsedAttachment, err := getOutlookAttachment(outlookClient, email.ID, attachment.ID)
			if err != nil {
				log.Printf("Failed attachment %s: %s", attachment.ID, err)
				continue
			}

			log.Printf("ATTACHMENT: %#v", parsedAttachment)
		}
		//log.Printf("%#v", attachments)
		//log.Printf("%s", err)
		//GET /users/{id | userPrincipalName}/events/{id}/attachments/{id}
	}

	emailBytes, err := json.Marshal(email)
	if err != nil {
		log.Printf("[INFO] Failed email marshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	type ExecutionStruct struct {
		Start             string `json:"start"`
		ExecutionSource   string `json:"execution_source"`
		ExecutionArgument string `json:"execution_argument"`
	}

	newBody := ExecutionStruct{
		Start:             hook.Start,
		ExecutionSource:   "outlook",
		ExecutionArgument: string(emailBytes),
	}

	b, err := json.Marshal(newBody)
	if err != nil {
		log.Printf("[INFO] Failed newBody marshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	baseUrl := &url.URL{}
	newRequest := &http.Request{
		URL:    baseUrl,
		Method: "POST",
		Body:   ioutil.NopCloser(bytes.NewReader(b)),
	}

	workflow := shuffle.Workflow{
		ID: "",
	}

	// OrgId: activeOrgs[0].Id,
	workflowExecution, executionResp, err := handleExecution(hook.WorkflowId, workflow, newRequest)
	if err == nil {
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": true, "execution_id": "%s", "authorization": "%s"}`, workflowExecution.ExecutionId, workflowExecution.Authorization)))
		return
	}

	resp.WriteHeader(500)
	resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, executionResp)))
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
func handleOutlookSubRemoval(ctx context.Context, user shuffle.User, workflowId, triggerId string) error {
	// 1. Get the auth for trigger
	// 2. Stop the subscription
	// 3. Remove the function
	// 4. Remove the database entry for auth
	trigger, err := shuffle.GetTriggerAuth(ctx, triggerId)
	if err != nil {
		log.Printf("Trigger auth %s doesn't exist - outlook sub removal.", triggerId)
		return err
	}

	if runningEnvironment != "cloud" {
		log.Printf("[INFO] SHOULD STOP OUTLOOK SUB ONPREM SYNC WITH CLOUD for workflow ID %s", workflowId)
		org, err := shuffle.GetOrg(ctx, user.ActiveOrg.Id)
		if err != nil {
			log.Printf("[INFO] Failed finding org %s during outlook removal: %s", org.Id, err)
			return err
		}

		log.Printf("[INFO] Stopping cloud configuration for trigger %s in org %s for workflow %s", trigger.Id, org.Id, trigger.WorkflowId)
		action := shuffle.CloudSyncJob{
			Type:          "outlook",
			Action:        "stop",
			OrgId:         org.Id,
			PrimaryItemId: trigger.Id,
			SecondaryItem: trigger.Start,
			ThirdItem:     trigger.WorkflowId,
		}

		err = executeCloudAction(action, org.SyncConfig.Apikey)
		if err != nil {
			log.Printf("[INFO] Failed cloud action STOP outlook execution: %s", err)
			return err
		} else {
			log.Printf("[INFO] Successfully set STOPPED outlook execution trigger")
		}
	} else {
		log.Printf("SHOULD STOP OUTLOOK SUB IN CLOUD")
	}

	// Actually delete the thing
	redirectDomain := "localhost:5001"
	url := fmt.Sprintf("http://%s/api/v1/triggers/outlook/register", redirectDomain)
	outlookClient, _, err := getOutlookClient(ctx, "", trigger.OauthToken, url)
	if err != nil {
		log.Printf("[WARNING] Oauth client failure - outlook folders: %s", err)
		return err
	}
	notificationURL := fmt.Sprintf("%s/api/v1/hooks/webhook_%s", syncSubUrl, trigger.Id)
	curSubscriptions, err := getOutlookSubscriptions(outlookClient)
	if err == nil {
		for _, sub := range curSubscriptions.Value {
			if sub.NotificationURL == notificationURL {
				log.Printf("[INFO] Removing subscription %s from o365 for workflow %s", sub.Id, workflowId)
				removeOutlookSubscription(outlookClient, sub.Id)
			}
		}
	} else {
		log.Printf("Failed to get subscriptions - need to overwrite")
	}

	return nil
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
	workflow, err := shuffle.GetWorkflow(ctx, workflowId)
	if err != nil {
		log.Printf("[WARNING] Failed getting the workflow locally (delete outlook): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
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
	err = handleOutlookSubRemoval(ctx, user, workflowId, triggerId)
	if err != nil {
		log.Printf("Failed sub removal: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
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
	workflow, err := shuffle.GetWorkflow(ctx, workflowId)
	if err != nil {
		log.Printf("[WARNING] Failed getting the workflow locally (outlook sub): %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
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

	log.Println("[INFO] Handle outlook subscription for trigger")

	// Should already be authorized at this point, as the workflow is shared
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Printf("Failed body read for workflow %s", workflow.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Based on the input data from frontend
	type CurTrigger struct {
		Name    string   `json:"name"`
		Folders []string `json:"folders"`
		ID      string   `json:"id"`
	}

	//log.Println(string(body))
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
	trigger, err := shuffle.GetTriggerAuth(ctx, curTrigger.ID)
	if err != nil {
		log.Printf("[INFO] Trigger %s doesn't exist - outlook sub.", curTrigger.ID)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": ""}`))
		return
	}

	// url doesn't really matter here
	//url := fmt.Sprintf("https://shuffler.io")
	redirectDomain := "localhost:5001"
	url := fmt.Sprintf("http://%s/api/v1/triggers/outlook/register", redirectDomain)
	outlookClient, _, err := getOutlookClient(ctx, "", trigger.OauthToken, url)
	if err != nil {
		log.Printf("Oauth client failure - triggerauth: %s", err)
		resp.Write([]byte(`{"success": false, "reason": ""}`))
		resp.WriteHeader(401)
		return
	}

	// Location +

	// This is here simply to let the function start
	// Usually takes 10 attempts minimum :O
	// 10 * 5 = 50 seconds. That's waaay too much :(

	if runningEnvironment != "cloud" {
		org, err := shuffle.GetOrg(ctx, user.ActiveOrg.Id)
		if err != nil {
			log.Printf("Failed finding org %s: %s", org.Id, err)
			return
		}
		log.Printf("[INFO] Starting cloud configuration TO START trigger %s in org %s for workflow %s", trigger.Id, org.Id, trigger.WorkflowId)

		action := shuffle.CloudSyncJob{
			Type:          "outlook",
			Action:        "start",
			OrgId:         org.Id,
			PrimaryItemId: trigger.Id,
			SecondaryItem: trigger.Start,
			ThirdItem:     workflowId,
		}

		err = executeCloudAction(action, org.SyncConfig.Apikey)
		if err != nil {
			log.Printf("[INFO] Failed cloud action START outlook execution: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "%s"}`, err)))
			return
		} else {
			log.Printf("[INFO] Successfully set up cloud action trigger")
		}
	} else {
		log.Printf("Should configure a running environment for CLOUD")
	}

	notificationURL := fmt.Sprintf("%s/api/v1/hooks/webhook_%s", syncSubUrl, trigger.Id)
	curSubscriptions, err := getOutlookSubscriptions(outlookClient)
	if err == nil {
		for _, sub := range curSubscriptions.Value {
			if sub.NotificationURL == notificationURL {
				log.Printf("[INFO] Removing existing subscription %s", sub.Id)
				removeOutlookSubscription(outlookClient, sub.Id)
			}
		}
	} else {
		log.Printf("[INFO] Failed to get subscriptions - need to overwrite")
	}

	maxFails := 5
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
		err = shuffle.SetTriggerAuth(ctx, *trigger)
		if err != nil {
			log.Printf("Failed setting triggerauth: %s", err)
		}

		break
	}

	log.Printf("[INFO] Successfully handled outlook subscription for trigger %s in workflow %s", curTrigger.ID, workflow.ID)

	//log.Printf("%#v", user)
	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}
