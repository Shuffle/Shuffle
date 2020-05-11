package function

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

// GetUserDetails - Get one user's details from randomuser.me API
func GetUserDetails(w http.ResponseWriter, r *http.Request) {
	randomUserClient := http.Client{
		Timeout: time.Second * 3,
	}

	req, err := http.NewRequest(http.MethodGet, "https://randomuser.me/api/", nil)
	if err != nil {
		log.Fatal(err)
		return
	}

	res, err2 := randomUserClient.Do(req)
	if err2 != nil {
		log.Fatal(err2)
		return
	}

	body, err3 := ioutil.ReadAll(res.Body)
	if err3 != nil {
		log.Fatal(err3)
	}

	var o map[string]interface{}
	json.Unmarshal([]byte(body), &o)

	results := o["results"].([]interface{})
	result := results[0].(map[string]interface{})

	result["generator"] = "google-cloud-function"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
