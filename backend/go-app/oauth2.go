package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/datastore"
	"golang.org/x/oauth2"
)

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
	requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/ec03b4f2-fccf-4c35-b0eb-be85a0f5dd43/mailFolders")

	ret, err := client.Get(requestUrl)
	if err != nil {
		log.Printf("[INFO] FolderErr: %s", err)
		return OutlookFolders{}, err
	}

	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		log.Printf("[WARNING] Failed body decoding from mailfolders")
		return OutlookFolders{}, err
	}

	log.Printf("[INFO] Folder Body: %s", string(body))
	log.Printf("[INFO] Status folders: %d", ret.StatusCode)
	if ret.StatusCode != 200 {
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
		log.Printf("[INFO] Folder error: %s", err)
		return OutlookProfile{}, err
	}

	log.Printf("[INFO] Status profile: %d", ret.StatusCode)
	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		log.Printf("[INFO] Body: %s", err)
		return OutlookProfile{}, err
	}

	log.Printf("[INFO] BODY: %s", string(body))

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
	log.Println(trigger.WorkflowId)
	log.Println(trigger.Id)
	log.Println(trigger.Username)
	log.Println(trigger.Type)
	if trigger.WorkflowId == "" || trigger.Id == "" || trigger.Username == "" || trigger.Type == "" {
		log.Printf("[INFO] All oauth items need to contain data to register a new state")
		resp.WriteHeader(401)
		return
	}

	// Should also update the user
	log.Printf("[INFO] Attempting to set up outlook trigger for %s", senderUser)
	Userdata, err := getUser(ctx, senderUser)
	if err != nil {
		log.Printf("[INFO] Username %s doesn't exist (oauth2): %s", trigger.Username, err)
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
	err = setUser(ctx, Userdata)
	if err != nil {
		log.Printf("Failed setting user data for %s: %s", Userdata.Username, err)
		resp.WriteHeader(401)
		return
	}

	err = setTriggerAuth(ctx, trigger)
	if err != nil {
		log.Printf("Failed to set trigger auth for %s - %s", trigger.Username, err)
		resp.WriteHeader(401)
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
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
		log.Printf("[INFO] Trigger %s doesn't exist - outlook folders.", triggerId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Trigger doesn't exist."}`))
		return
	}

	//client, accessToken, err := getOutlookClient(ctx, code, OauthToken{}, url)
	//if err != nil {
	//	log.Printf("Oauth client failure - outlook register: %s", err)
	//	resp.WriteHeader(401)
	//	return
	//}

	// FIXME - should be shuffler in literally every case except testing lol
	//log.Printf("TRIGGER: %#v", trigger)
	redirectDomain := "localhost:5001"
	url := fmt.Sprintf("http://%s/api/v1/triggers/outlook/register", redirectDomain)
	outlookClient, _, err := getOutlookClient(ctx, "", trigger.OauthToken, url)
	if err != nil {
		log.Printf("[WARNING] Oauth client failure - outlook folders: %s", err)
		resp.Write([]byte(`{"success": false, "reason": "Failed creating outlook client"}`))
		resp.WriteHeader(401)
		return
	}

	// This should be possible, and will also give the actual username
	/*
		profile, err := getOutlookProfile(outlookClient)
		if err != nil {
			log.Printf("Outlook profile failure: %s", err)
			resp.WriteHeader(401)
			return
		}
		log.Printf("PROFILE: %#v", profile)
	*/

	folders, err := getOutlookFolders(outlookClient)
	if err != nil {
		log.Printf("[WARNING] Failed setting outlook folders: %s", err)
		resp.Write([]byte(`{"success": false, "reason": "Failed getting outlook folders"}`))
		resp.WriteHeader(401)
		return
	}

	b, err := json.Marshal(folders.Value)
	if err != nil {
		log.Println("[INFO] Failed to marshal folderdata")
		resp.Write([]byte(`{"success": false, "reason": "Failed decoding JSON"}`))
		resp.WriteHeader(401)
		return
	}

	resp.WriteHeader(200)
	resp.Write(b)
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

		workflowId = location[5]
	}

	if strings.Contains(workflowId, "?") {
		workflowId = strings.Split(workflowId, "?")[0]
	}

	ctx := context.Background()
	trigger, err := getTriggerAuth(ctx, workflowId)
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
