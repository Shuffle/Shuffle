package main

/*
	Handles files within Workflows.
*/

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/datastore"
	"github.com/satori/go.uuid"
)

type File struct {
	Id           string   `json:"id" datastore:"id"`
	Type         string   `json:"type" datastore:"type"`
	CreatedAt    int64    `json:"created_at" datastore:"created_at"`
	UpdatedAt    int64    `json:"updated_at" datastore:"updated_at"`
	MetaAccessAt int64    `json:"meta_access_at" datastore:"meta_access_at"`
	DownloadAt   int64    `json:"last_downloaded" datastore:"last_downloaded"`
	Description  string   `json:"description" datastore:"description"`
	ExpiresAt    string   `json:"expires_at" datastore:"expires_at"`
	Status       string   `json:"status" datastore:"status"`
	Filename     string   `json:"filename" datastore:"filename"`
	URL          string   `json:"url" datastore:"org"`
	OrgId        string   `json:"org_id" datastore:"org_id"`
	WorkflowId   string   `json:"workflow_id" datastore:"workflow_id"`
	Workflows    []string `json:"workflows" datastore:"workflows"`
	DownloadPath string   `json:"download_path" datastore:"download_path"`
	Md5sum       string   `json:"md5_sum" datastore:"md5_sum"`
	Sha256sum    string   `json:"sha256_sum" datastore:"sha256_sum"`
}

var basepath = os.Getenv("SHUFFLE_FILE_LOCATION")

func fileAuthentication(request *http.Request) (string, error) {
	executionId, ok := request.URL.Query()["execution_id"]
	if ok && len(executionId) > 0 {
		ctx := context.Background()
		workflowExecution, err := getWorkflowExecution(ctx, executionId[0])
		if err != nil {
			log.Printf("[ERROR] Couldn't find execution ID %s", executionId[0])
			return "", err
		}

		apikey := request.Header.Get("Authorization")
		if !strings.HasPrefix(apikey, "Bearer ") {
			log.Printf("[ERROR} Apikey doesn't start with bearer (2)")
			return "", errors.New("No auth key found")
		}

		apikeyCheck := strings.Split(apikey, " ")
		if len(apikeyCheck) != 2 {
			log.Printf("[ERROR] Invalid format for apikey (2)")
			return "", errors.New("No space in authkey")
		}

		// This is annoying af and is done because of maxlength lol
		newApikey := apikeyCheck[1]
		if newApikey != workflowExecution.Authorization {
			//log.Printf("[ERROR] Bad apikey for execution %s. %s vs %s", executionId[0], apikey, workflowExecution.Authorization)
			log.Printf("[ERROR] Bad apikey for execution %s.", executionId[0])
			//%s vs %s", executionId[0], apikey, workflowExecution.Authorization)
			return "", errors.New("Bad authorization key")
		}

		log.Printf("[INFO] Authorization is correct for execution %s!", executionId[0])
		//%s vs %s. Setting Org", executionId, apikey, workflowExecution.Authorization)
		if len(workflowExecution.ExecutionOrg) > 0 {
			return workflowExecution.ExecutionOrg, nil
		} else if len(workflowExecution.Workflow.ExecutingOrg.Id) > 0 {
			return workflowExecution.ExecutionOrg, nil
		} else {
			log.Printf("[ERROR] Couldn't find org for workflow execution, but auth was correct.")
		}
	}

	return "", errors.New("No execution id specified")
}

// https://golangcode.com/check-if-a-file-exists/
func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func handleGetFileMeta(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	var fileId string
	location := strings.Split(request.URL.String(), "/")
	if location[1] == "api" {
		if len(location) <= 4 {
			log.Printf("[INFO] Path too short: %d", len(location))
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if strings.Contains(fileId, "?") {
		fileId = strings.Split(fileId, "?")[0]
	}

	if len(fileId) != 36 {
		log.Printf("Bad format for fileId %s", fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Badly formatted fileId"}`))
		return
	}

	log.Printf("\n\n[INFO] User is trying to GET File Meta for %s\n\n", fileId)

	// 1. Check user directly
	// 2. Check workflow execution authorization
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[INFO] INITIAL Api authentication failed in file deletion: %s", err)

		orgId, err := fileAuthentication(request)
		if err != nil {
			log.Printf("[ERROR] Bad file authentication in get: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		user.ActiveOrg.Id = orgId
		user.Username = "Execution File API"
	}

	// 1. Verify if the user has access to the file: org_id and workflow
	log.Printf("[INFO] Should GET FILE META for %s if user has access", fileId)
	ctx := context.Background()
	file, err := getFile(ctx, fileId)
	if err != nil {
		log.Printf("[INFO] File %s not found: %s", fileId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	found := false
	if file.OrgId == user.ActiveOrg.Id {
		found = true
	} else {
		for _, item := range user.Orgs {
			if item == file.OrgId {
				found = true
				break
			}
		}
	}

	if !found {
		log.Printf("[INFO] User %s doesn't have access to %s", user.Username, fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	newBody, err := json.Marshal(file)
	if err != nil {
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed to marshal filedata"}`))
		return
	}

	log.Printf("[INFO] Successfully got file meta for %s", fileId)
	resp.WriteHeader(200)
	resp.Write([]byte(newBody))
}

func handleDeleteFile(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	var fileId string
	location := strings.Split(request.URL.String(), "/")
	if location[1] == "api" {
		if len(location) <= 4 {
			log.Printf("[INFO] Path too short: %d", len(location))
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if strings.Contains(fileId, "?") {
		fileId = strings.Split(fileId, "?")[0]
	}

	if len(fileId) != 36 {
		log.Printf("Bad format for fileId %s", fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Badly formatted fileId"}`))
		return
	}

	log.Printf("\n\n[INFO] User is trying to delete file %s\n\n", fileId)

	// 1. Check user directly
	// 2. Check workflow execution authorization
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[INFO] INITIAL Api authentication failed in file deletion: %s", err)

		orgId, err := fileAuthentication(request)
		if err != nil {
			log.Printf("[ERROR] Bad file authentication in get: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		user.ActiveOrg.Id = orgId
		user.Username = "Execution File API"
	}

	// 1. Verify if the user has access to the file: org_id and workflow
	log.Printf("[INFO] Should DELETE file %s if user has access", fileId)
	ctx := context.Background()
	file, err := getFile(ctx, fileId)
	if err != nil {
		log.Printf("[INFO] File %s not found: %s", fileId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	found := false
	if file.OrgId == user.ActiveOrg.Id {
		found = true
	} else {
		for _, item := range user.Orgs {
			if item == file.OrgId {
				found = true
				break
			}
		}
	}

	if !found {
		log.Printf("[INFO] User %s doesn't have access to %s", user.Username, fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if file.Status == "deleted" {
		log.Printf("[INFO] File with ID %s is already deleted.", fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if fileExists(file.DownloadPath) {
		err = os.Remove(file.DownloadPath)
		if err != nil {
			log.Printf("[ERROR] Failed deleting file locally: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed deleting filein path %s"}`, file.DownloadPath)))
			return
		}

		log.Printf("[INFO] Deleted file %s locally. Next is database.", file.DownloadPath)
	} else {
		log.Printf("[ERROR] File doesn't exist. Can't delete. Should maybe delete file anyway?")
		resp.WriteHeader(200)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "File in location %s doesn't exist"}`, file.DownloadPath)))
		return
	}

	file.Status = "deleted"
	err = setFile(ctx, *file)
	if err != nil {
		log.Printf("[ERROR] Failed setting file to deleted")
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed setting file to deleted"}`))
		return
	}

	/*
		//Actually delete it?
		err = DeleteKey(ctx, "files", fileId)
		if err != nil {
			log.Printf("Failed deleting file with ID %s: %s", fileId, err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}
	*/

	log.Printf("[INFO] Successfully deleted file %s", fileId)
	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}

func handleGetFileContent(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	var fileId string
	location := strings.Split(request.URL.String(), "/")
	if location[1] == "api" {
		if len(location) <= 4 {
			log.Printf("Path too short: %d", len(location))
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 36 {
		log.Printf("Bad format for fileId %s", fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Badly formatted fileId"}`))
		return
	}

	log.Printf("\n\nUser is trying to download file %s\n\n", fileId)

	// 1. Check user directly
	// 2. Check workflow execution authorization
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("INITIAL Api authentication failed in file download: %s", err)

		orgId, err := fileAuthentication(request)
		if err != nil {
			log.Printf("Bad file authentication in get: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		user.ActiveOrg.Id = orgId
		user.Username = "Execution File API"
		/*
			} else {
				resp.WriteHeader(401)
				resp.Write([]byte(`{"success": false}`))
				return
			}
		*/
	}

	// 1. Verify if the user has access to the file: org_id and workflow
	log.Printf("[INFO] Should get file %s", fileId)
	ctx := context.Background()
	file, err := getFile(ctx, fileId)
	if err != nil {
		log.Printf("[ERROR] File %s not found: %s", fileId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	found := false
	if file.OrgId == user.ActiveOrg.Id {
		found = true
	} else {
		for _, item := range user.Orgs {
			if item == file.OrgId {
				found = true
				break
			}
		}
	}

	if !found {
		log.Printf("User %s doesn't have access to %s", user.Username, fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if file.Status != "active" {
		log.Printf("[ERROR] File status isn't active, but %s. Can't continue.", file.Status)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "The file isn't ready to be downloaded yet. Status required: active"}`))
		return
	}

	// Fixme: More auth: org and workflow!
	downloadPath := file.DownloadPath
	log.Printf("[INFO] Downloadpath: %s", downloadPath)
	Openfile, err := os.Open(downloadPath)
	defer Openfile.Close() //Close after function return
	if err != nil {
		//File not found, send 404
		http.Error(resp, "File not found.", 404)
		return
	}

	//File is found, create and send the correct headers
	//Get the Content-Type of the file
	//Create a buffer to store the header of the file in
	FileHeader := make([]byte, 512)
	//Copy the headers into the FileHeader buffer
	Openfile.Read(FileHeader)
	//Get content type of file
	FileContentType := http.DetectContentType(FileHeader)

	//Get the file size
	FileStat, _ := Openfile.Stat()                     //Get info from file
	FileSize := strconv.FormatInt(FileStat.Size(), 10) //Get file size as a string

	//Send the headers
	resp.Header().Set("Content-Disposition", "attachment; filename="+fileId)
	resp.Header().Set("Content-Type", FileContentType)
	resp.Header().Set("Content-Length", FileSize)

	//Send the file
	//We read 512 bytes from the file already, so we reset the offset back to 0
	Openfile.Seek(0, 0)
	io.Copy(resp, Openfile) //'Copy' the file to the client
	return

	//log.Printf("Should download file %s", downloadPath)
}
func handleUploadFile(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	var fileId string
	location := strings.Split(request.URL.String(), "/")
	if location[1] == "api" {
		if len(location) <= 4 {
			log.Printf("Path too short: %d", len(location))
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 36 {
		log.Printf("Bad format for fileId %s", fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Badly formatted fileId"}`))
		return
	}

	// 1. Check user directly
	// 2. Check workflow execution authorization
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("INITIAL Api authentication failed in file upload: %s", err)

		orgId, err := fileAuthentication(request)
		if err != nil {
			log.Printf("Bad file authentication in create file: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		user.ActiveOrg.Id = orgId
		user.Username = "Execution File API"
	}

	log.Printf("[INFO] Should UPLOAD file %s if user has access", fileId)
	ctx := context.Background()
	file, err := getFile(ctx, fileId)
	if err != nil {
		log.Printf("File %s not found: %s", fileId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	found := false
	if file.OrgId == user.ActiveOrg.Id {
		found = true
	} else {
		for _, item := range user.Orgs {
			if item == file.OrgId {
				found = true
				break
			}
		}
	}

	if !found {
		log.Printf("User %s doesn't have access to %s", user.Username, fileId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("[INFO] STATUS: %s", file.Status)
	if file.Status != "created" {
		log.Printf("File status isn't created. Can't upload.")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "This file already has data."}`))
		return
	}

	request.ParseMultipartForm(32 << 20)
	parsedFile, _, err := request.FormFile("shuffle_file")
	if err != nil {
		log.Printf("[ERROR] Couldn't upload file: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed uploading file"}`))
		return
	}
	defer parsedFile.Close()

	file.Status = "uploading"
	err = setFile(ctx, *file)
	if err != nil {
		log.Printf("Failed setting file to uploading")
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed setting file to uploading"}`))
		return
	}

	// Can be used for validation files for change
	var buf bytes.Buffer
	io.Copy(&buf, parsedFile)
	contents := buf.Bytes()
	md5 := md5sum(contents)
	buf.Reset()

	sha256Sum := sha256.Sum256(contents)
	//parsedFile.Reset()

	f, err := os.OpenFile(file.DownloadPath, os.O_WRONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		// Rolling back file
		file.Status = "created"
		setFile(ctx, *file)

		log.Printf("[ERROR] Failed uploading and creating file: %s", err)
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	defer f.Close()
	parsedFile.Seek(0, io.SeekStart)
	io.Copy(f, parsedFile)

	// FIXME: Set this one to 200 anyway? Can't download file then tho..
	file.Status = "active"
	file.Md5sum = md5
	file.Sha256sum = fmt.Sprintf("%x", sha256Sum)
	log.Printf("[INFO] MD5 for file %s (%s) is %s and SHA256 is %s", file.Filename, file.Id, file.Md5sum, file.Sha256sum)

	err = setFile(ctx, *file)
	if err != nil {
		log.Printf("[ERROR] Failed setting file back to active")
		resp.WriteHeader(500)
		resp.Write([]byte(`{"success": false, "reason": "Failed setting file to active"}`))
		return
	}

	log.Printf("[INFO] Successfully uploaded file ID %s", file.Id)
	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true}`)))
}

func handleCreateFile(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	// 1. Check user directly
	// 2. Check workflow execution authorization
	user, err := handleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[INFO] INITIAL Api authentication failed in file creation: %s", err)

		orgId, err := fileAuthentication(request)
		if err != nil {
			log.Printf("[ERROR] Bad file authentication in create file: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		user.ActiveOrg.Id = orgId
		user.Username = "Execution File API"
	}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		log.Println("Failed reading body")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed to read data"}`)))
		return
	}

	type FileStructure struct {
		Filename   string `json:"filename"`
		OrgId      string `json:"org_id"`
		WorkflowId string `json:"workflow_id"`
	}

	var curfile FileStructure
	err = json.Unmarshal(body, &curfile)
	if err != nil {
		log.Printf("[ERROR] Failed unmarshaling: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed to unmarshal data"}`)))
		return
	}

	// Loads of validation below
	if len(curfile.Filename) == 0 || len(curfile.OrgId) == 0 || len(curfile.WorkflowId) == 0 {
		log.Printf("[ERROR] Missing field during upload.")
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Missing field. Required: filename, org_id, workflow_id"}`)))
		return
	}

	ctx := context.Background()
	if user.ActiveOrg.Id != curfile.OrgId {
		log.Printf("[ERROR] User can't access org %s", curfile.OrgId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Error with organization"}`))
		return
	}

	// Try to get the org and workflow in case they don't exist
	workflow, err := getWorkflow(ctx, curfile.WorkflowId)
	if err != nil {
		log.Printf("[ERROR] Workflow %s doesn't exist.", curfile.WorkflowId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Error with workflow id or org id"}`))
		return
	}

	_, err = getOrg(ctx, curfile.OrgId)
	if err != nil {
		log.Printf("[ERROR] Org %s doesn't exist.", curfile.OrgId)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Error with workflow id or org id"}`))
		return
	}

	if workflow.ExecutingOrg.Id != curfile.OrgId {
		found := false
		for _, curorg := range workflow.Org {
			if curorg.Id == curfile.OrgId {
				found = true
				break
			}
		}

		if !found {
			log.Printf("[ERROR] Org %s doesn't have access to %s.", curfile.OrgId, curfile.WorkflowId)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "Error with workflow id or org id"}`))
			return
		}
	}

	if strings.Contains(curfile.Filename, "/") || strings.Contains(curfile.Filename, `"`) || strings.Contains(curfile.Filename, "..") || strings.Contains(curfile.Filename, "~") {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Invalid characters in filename"}`))
		return
	}

	// 1. Create the file object.
	if len(basepath) == 0 {
		basepath = "shuffle-files"
	}
	folderPath := fmt.Sprintf("%s/%s/%s", basepath, curfile.OrgId, curfile.WorkflowId)

	// Try to make the full file location
	err = os.MkdirAll(folderPath, os.ModePerm)
	if err != nil {
		log.Printf("[ERROR] Writing issue for file location creation: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed creating upload location"}`))
		return
	}

	filename := curfile.Filename
	fileId := uuid.NewV4().String()
	downloadPath := fmt.Sprintf("%s/%s", folderPath, fileId)

	timeNow := time.Now().Unix()
	newFile := File{
		Id:           fileId,
		CreatedAt:    timeNow,
		UpdatedAt:    timeNow,
		Description:  "",
		Status:       "created",
		Filename:     filename,
		OrgId:        curfile.OrgId,
		WorkflowId:   curfile.WorkflowId,
		DownloadPath: downloadPath,
	}

	err = setFile(ctx, newFile)
	if err != nil {
		log.Printf("[ERROR] Failed setting file: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed setting file reference"}`))
		return
	} else {
		log.Printf("[INFO] Created file %s", newFile.DownloadPath)
	}

	resp.WriteHeader(200)
	resp.Write([]byte(fmt.Sprintf(`{"success": true, "id": "%s"}`, fileId)))
}

func getFile(ctx context.Context, id string) (*File, error) {
	key := datastore.NameKey("Files", id, nil)
	curFile := &File{}
	if err := dbclient.Get(ctx, key, curFile); err != nil {
		return &File{}, err
	}

	return curFile, nil
}

func setFile(ctx context.Context, file File) error {
	// clear session_token and API_token for user
	k := datastore.NameKey("Files", file.Id, nil)
	if _, err := dbclient.Put(ctx, k, &file); err != nil {
		log.Println(err)
		return err
	}

	return nil
}
