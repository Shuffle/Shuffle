package main

// This entire script should be part of the API backend

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"golang.org/x/oauth2"
)

type Subscription struct {
	ChangeType         string `json:"changeType"`
	NotificationURL    string `json:"notificationUrl"`
	Resource           string `json:"resource"`
	ExpirationDateTime string `json:"expirationDateTime"`
	ClientState        string `json:"clientState"`
}

// ClientState        string `json:"ClientState,omitempty"`
// OdataType          string `json:"@odata.type"`

//odata.type - Include "@odata.type":"#Microsoft.OutlookServices.PushSubscription". The PushSubscription entity defines NotificationURL.
//ChangeType - Specifies the types of events to monitor for that resource. See ChangeType for the supported types.
//ClientState - Optional property that indicates that each notification should be sent with a header by the same ClientState value. This lets the listener check the legitimacy of each notification.
//NotificationURL - Specifies where notifications should be sent to. This URL represents a web service typically implemented by the client.
//Resource - Specifies the resource to monitor and receive notifications on. You can use the optional query parameter $filter to refine the conditions for a notification, or use $select to include specific properties in a rich notification.

//https://outlook.office.com/mail.read

type Config struct {
	ClientID     string
	ClientSecret string
	RedirectUrl  string
	AuthUrl      string
	TokenUrl     string
}

func getOfficeAppInfo() (Config, error) {
	configpath := "integrations/config.json"

	data, err := ioutil.ReadFile(configpath)
	if err != nil {
		//log.Fatal(err)
		log.Printf("Error getting hive: %s\n", err)
	}

	config := Config{}
	err = json.Unmarshal(data, &config)
	if err != nil {
		return Config{}, err
	}

	return config, nil
}

// This should be a popup for the user
func get_accesstoken() (*http.Client, OauthToken, error) {
	ctx := context.Background()
	config, err := getOfficeAppInfo()
	if err != nil {
		return nil, OauthToken{}, err
	}

	conf := &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		Scopes: []string{
			"Mail.Read",
			"User.Read",
			"https://outlook.office.com/mail.read",
		},
		RedirectURL: "https://localhost:8000",
		Endpoint: oauth2.Endpoint{
			AuthURL:  config.AuthUrl,
			TokenURL: config.TokenUrl,
		},
	}
	//"Mail.Read.Shared",

	//url := conf.AuthCodeURL("state", oauth2.SetAuthURLParam("resource", "https://outlook.office.com"))
	// ADD DATA TO STATE HERE :O
	url := conf.AuthCodeURL("workflow_id%3Dc2e0b50a-2957-427e-a97b-b989dc5a5408%26trigger_id%3D9e845679-5843-4959-a76c-a6d664e9df35%26username%3Drheyix.yt@gmail.com", oauth2.SetAuthURLParam("resource", "https://graph.microsoft.com"))

	fmt.Printf("Visit the URL for the auth dialog: \n%v\n\n", url)
	codechannel := make(chan string)

	// Handles the server callback, listening on port 8000
	go func() {
		port := ":8000"

		http.HandleFunc("/", func(response http.ResponseWriter, request *http.Request) {
			tmpcode := request.URL.Query().Get("code")
			if len(tmpcode) < 100 {
				return
			} else {
				codechannel <- tmpcode
			}
		})

		// FIX - might cause errors not being printed
		err := http.ListenAndServeTLS(port, "integrations/server.crt", "integrations/server.key", nil)
		if err != nil {
			log.Printf("%s\n", err)
		}
	}()

	code := <-codechannel
	close(codechannel)

	// https://stackoverflow.com/questions/52787420/multiple-resources-in-a-single-authorization-request
	// Multi resource ^
	access_token, err := conf.Exchange(ctx, code)
	//log.Printf("%#v", access_token)
	if err != nil {
		return nil, OauthToken{}, err
	}

	//log.Printf("%#v", access_token)
	outlookClient := conf.Client(ctx, access_token)

	oauthToken := OauthToken{
		AccessToken:  access_token.AccessToken,
		TokenType:    access_token.TokenType,
		RefreshToken: access_token.RefreshToken,
		Expiry:       access_token.Expiry,
	}

	return outlookClient, oauthToken, nil
}

type OauthToken struct {
	AccessToken  string    `json:"AccessToken" datastore:"AccessToken,noindex"`
	TokenType    string    `json:"TokenType" datastore:"TokenType,noindex"`
	RefreshToken string    `json:"RefreshToken" datastore:"RefreshToken,noindex"`
	Expiry       time.Time `json:"Expiry" datastore:"Expiry,noindex"`
}

type Mailfolders struct {
	OdataContext  string `json:"@odata.context"`
	OdataNextLink string `json:"@odata.nextLink"`
	Value         []struct {
		ID               string `json:"id"`
		DisplayName      string `json:"displayName"`
		ParentFolderID   string `json:"parentFolderId"`
		ChildFolderCount int    `json:"childFolderCount"`
		UnreadItemCount  int    `json:"unreadItemCount"`
		TotalItemCount   int    `json:"totalItemCount"`
	} `json:"value"`
}

func getFolders(client *http.Client) (Mailfolders, error) {
	requestUrl := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/frikky@shuffletest.onmicrosoft.com/mailfolders")

	ret, err := client.Get(requestUrl)
	if err != nil {
		log.Printf("FolderErr: %s", err)
		return Mailfolders{}, err
	}

	log.Printf("Status folders: %d", ret.StatusCode)
	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		log.Printf("Body: %s", err)
		return Mailfolders{}, err
	}

	//log.Printf("Body: %s", string(body))

	mailfolders := Mailfolders{}
	err = json.Unmarshal(body, &mailfolders)
	if err != nil {
		log.Printf("Unmarshal: %s", err)
		return Mailfolders{}, err
	}

	//fmt.Printf("%#v", mailfolders)
	// FIXME - recursion for subfolders
	// Recursive struct
	// folderEndpoint := fmt.Sprintf("%s/%s/childfolders?$top=40", requestUrl, parentId)
	for _, folder := range mailfolders.Value {
		log.Println(folder.DisplayName)
	}

	return mailfolders, nil
}

// Subscribes to a mailbox based on some thingies
func makeSubscription(client *http.Client, folderIds []string) {
	// FIXME - show the users folders from oauth and let them choose

	fullUrl := "https://graph.microsoft.com/v1.0/subscriptions"
	//resource := fmt.Sprintf("https://outlook.office.com/api/v2.0/me/mailfolders('inbox')/messages")
	resource := fmt.Sprintf("me/mailfolders('inbox')/messages")
	sub := Subscription{
		ChangeType:         "created",
		NotificationURL:    "https://de4fc12b.ngrok.io",
		ExpirationDateTime: "2019-09-22T18:23:45.9356913Z",
		ClientState:        "This is a test",
		Resource:           resource,
	}

	data, err := json.Marshal(sub)
	if err != nil {
		log.Printf("Marshal: %s", err)
		return
	}

	log.Printf(string(data))

	req, err := http.NewRequest(
		"POST",
		fullUrl,
		bytes.NewBuffer(data),
	)
	req.Header.Add("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		log.Printf("Client: %s", err)
		return
	}

	log.Printf("Status: %d", res.StatusCode)
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("Body: %s", err)
		return
	}

	fmt.Println(string(body))
	log.Println("Shoooould be set up :)")

}

func getOutlookClient(code string, accessToken OauthToken, redirectUri string) (*http.Client, *oauth2.Token, error) {
	ctx := context.Background()

	conf := &oauth2.Config{
		ClientID:     "70e37005-c954-4290-b573-d4b94e484336",
		ClientSecret: ".eNw/A[kQFB5zL.agvRputdEJENeJ392",
		Scopes: []string{
			"Mail.Read",
			"User.Read",
			"https://outlook.office.com/mail.read",
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

func main() {
	graphclient, oauthToken, err := get_accesstoken()
	if err != nil {
		log.Printf("Oauth setup: %s", err)
		return
	}

	// FIXME - make this possible for alternative users (shared)
	folders, err := getFolders(graphclient)
	if err != nil {
		log.Printf("Folder get error: %s", err)
		return
	}
	_ = folders

	folderIds := []string{"inbox"}
	//log.Println(folders)
	//log.Printf("%#v", oauthToken)
	// Use oauthToken to generate data for outlook
	outlookclient, _, err := getOutlookClient("", oauthToken, "https://localhost:8000")
	makeSubscription(outlookclient, folderIds)
}
