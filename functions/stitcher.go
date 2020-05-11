package main

import (
	"archive/zip"
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
	"path/filepath"
	"strings"

	"archive/tar"
	"cloud.google.com/go/storage"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"google.golang.org/api/cloudfunctions/v1"
	"gopkg.in/yaml.v2"
)

var gceProject = "shuffler"
var bucketName = "shuffler.appspot.com"

type WorkflowAppActionParameter struct {
	Description string `json:"description" datastore:"description"`
	ID          string `json:"id" datastore:"id"`
	Name        string `json:"name" datastore:"name"`
	Example     string `json:"example" datastore:"example"`
	Value       string `json:"value" datastore:"value"`
	Multiline   bool   `json:"multiline" datastore:"multiline"`
	ActionField string `json:"action_field" datastore:"action_field"`
	Variant     string `json:"variant", datastore:"variant"`
	Required    bool   `json:"required" datastore:"required"`
	Schema      struct {
		Type string `json:"type" datastore:"type"`
	} `json:"schema"`
}

type Authentication struct {
	Required   bool                   `json:"required" datastore:"required" yaml:"required" `
	Parameters []AuthenticationParams `json:"parameters" datastore:"parameters" yaml:"parameters"`
}

type AuthenticationParams struct {
	Description string `json:"description" datastore:"description" yaml:"description"`
	ID          string `json:"id" datastore:"id" yaml:"id"`
	Name        string `json:"name" datastore:"name" yaml:"name"`
	Example     string `json:"example" datastore:"example" yaml:"example"`
	Value       string `json:"value" datastore:"value" yaml:"value"`
	Multiline   bool   `json:"multiline" datastore:"multiline" yaml:"multiline"`
	Required    bool   `json:"required" datastore:"required" yaml:"required"`
}

type WorkflowApp struct {
	Name        string `json:"name" yaml:"name" required:true datastore:"name"`
	IsValid     bool   `json:"is_valid" yaml:"is_valid" required:true datastore:"is_valid"`
	ID          string `json:"id" yaml:"id" required:false datastore:"id"`
	Link        string `json:"link" yaml:"link" required:false datastore:"link"`
	AppVersion  string `json:"app_version" yaml:"app_version" required:true datastore:"app_version"`
	Description string `json:"description" datastore:"description" required:false yaml:"description"`
	Environment string `json:"environment" datastore:"environment" required:true yaml:"environment"`
	Sharing     bool   `json:"sharing" datastore:"sharing" yaml:"sharing"`
	SmallImage  string `json:"small_image" datastore:"small_image" required:false yaml:"small_image"`
	LargeImage  string `json:"large_image" datastore:"large_image" yaml:"large_image" requred:false`
	ContactInfo struct {
		Name string `json:"name" datastore:"name" yaml:"name"`
		Url  string `json:"url" datastore:"url" yaml:"url"`
	} `json:"contact_info" datastore:"contact_info" yaml:"contact_info" required:false`
	Actions        []WorkflowAppAction `json:"actions" yaml:"actions" required:true datastore:"actions"`
	Authentication Authentication      `json:"authentication" yaml:"authentication" required:false datastore:"authentication"`
}

type AuthenticationStore struct {
	Key   string `json:"key" datastore:"key"`
	Value string `json:"value" datastore:"value"`
}

type WorkflowAppAction struct {
	Description    string                       `json:"description" datastore:"description"`
	ID             string                       `json:"id" datastore:"id"`
	Name           string                       `json:"name" datastore:"name"`
	NodeType       string                       `json:"node_type" datastore:"node_type"`
	Environment    string                       `json:"environment" datastore:"environment"`
	Parameters     []WorkflowAppActionParameter `json:"parameters" datastore: "parameters"`
	Authentication []AuthenticationStore        `json:"authentication" datastore:"authentication"`
	Returns        struct {
		Description string `json:"description" datastore:"returns"`
		ID          string `json:"id" datastore:"id"`
		Schema      struct {
			Type string `json:"type" datastore:"type"`
		} `json:"schema" datastore:"schema"`
	} `json:"returns" datastore:"returns"`
}

func getRunner(classname string) string {
	return fmt.Sprintf(`
# Run the actual thing after we've checked params
def run(request):
    action = request.get_json() 
    print(action)
    print(type(action))
    authorization_key = action.get("authorization")
    current_execution_id = action.get("execution_id")
	
    if action and "name" in action and "app_name" in action:
        asyncio.run(%s.run(action), debug=True)
        return f'Attempting to execute function {action["name"]} in app {action["app_name"]}' 
    else:
        return f'Invalid action'

	`, classname)
}

// Could use some kind of linting system too for this, but meh
func formatAppfile(filedata []byte) (string, []byte) {
	lines := strings.Split(string(filedata), "\n")

	newfile := []string{}
	classname := ""
	for _, line := range lines {
		if strings.Contains(line, "walkoff_app_sdk") {
			continue
		}

		// Remap logging. CBA this right now
		// This issue also persists in onprem apps because of await thingies.. :(
		// FIXME
		if strings.Contains(line, "console_logger") && strings.Contains(line, "await") {
			continue
			//line = strings.Replace(line, "console_logger", "logger", -1)
			//log.Println(line)
		}

		// Might not work with different import names
		// Could be fucked up with spaces everywhere? Idk
		if strings.Contains(line, "class") && strings.Contains(line, "(AppBase)") {
			items := strings.Split(line, " ")
			if len(items) > 0 && strings.Contains(items[1], "(AppBase)") {
				classname = strings.Split(items[1], "(")[0]
			} else {
				log.Println("Something wrong :( (horrible programming right here)")
				os.Exit(3)
			}
		}

		if strings.Contains(line, "if __name__ ==") {
			break
		}

		// asyncio.run(HelloWorld.run(), debug=True)

		newfile = append(newfile, line)
	}

	filedata = []byte(strings.Join(newfile, "\n"))
	return classname, filedata
}

// https://stackoverflow.com/questions/21060945/simple-way-to-copy-a-file-in-golang
func Copy(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	if err != nil {
		return err
	}
	return out.Close()
}
func ZipFiles(filename string, files []string) error {
	newZipFile, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer newZipFile.Close()

	zipWriter := zip.NewWriter(newZipFile)
	defer zipWriter.Close()

	// Add files to zip
	for _, file := range files {
		zipfile, err := os.Open(file)
		if err != nil {
			return err
		}
		defer zipfile.Close()

		// Get the file information
		info, err := zipfile.Stat()
		if err != nil {
			return err
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		// Using FileInfoHeader() above only uses the basename of the file. If we want
		// to preserve the folder structure we can overwrite this with the full path.
		filesplit := strings.Split(file, "/")
		if len(filesplit) > 1 {
			header.Name = filesplit[len(filesplit)-1]
		} else {
			header.Name = file
		}

		// Change to deflate to gain better compression
		// see http://golang.org/pkg/archive/zip/#pkg-constants
		header.Method = zip.Deflate

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			return err
		}
		if _, err = io.Copy(writer, zipfile); err != nil {
			return err
		}
	}

	return nil
}

func getAppbase(filepath string) []string {
	appBase, err := ioutil.ReadFile(filepath)
	if err != nil {
		log.Printf("Readerror: %s", err)
		os.Exit(1)
	}

	record := false
	validLines := []string{}
	for _, line := range strings.Split(string(appBase), "\n") {
		if strings.Contains(line, "#STOPCOPY") {
			log.Println("Stopping copy")
			break
		}

		if record {
			validLines = append(validLines, line)
		}

		if strings.Contains(line, "#STARTCOPY") {
			log.Println("Starting copy")
			record = true
		}
	}

	return validLines
}

// Puts together ./static_baseline.py, onprem/app_sdk_app_base.py and the
// appcode in a generated_app folder based on appname+version
func stitcher(appname string, appversion string) string {
	baselinefile := "static_baseline.py"
	appfolder := "apps"
	appbasefile := "onprem/app_sdk/app_base.py"

	baseline, err := ioutil.ReadFile(baselinefile)
	if err != nil {
		log.Printf("Readerror: %s", err)
		os.Exit(1)
	}

	sourceappfile := fmt.Sprintf("%s/%s/%s/src/app.py", appfolder, appname, appversion)
	appfile, err := ioutil.ReadFile(sourceappfile)
	if err != nil {
		log.Printf("App readerror: %s", err)
		os.Exit(1)
	}

	classname, appfile := formatAppfile(appfile)
	if len(classname) == 0 {
		log.Println("Failed finding classname in file.")
		os.Exit(3)
	}

	runner := getRunner(classname)
	appBase := getAppbase(appbasefile)

	foldername := fmt.Sprintf("generated_apps/%s_%s", appname, appversion)
	err = os.Mkdir(foldername, os.ModePerm)
	if err != nil {
		log.Println("Failed making temporary app folder. Probably already exists. Remaking")
		os.RemoveAll(foldername)
		os.MkdirAll(foldername, os.ModePerm)
	}

	stitched := []byte(string(baseline) + strings.Join(appBase, "\n") + string(appfile) + string(runner))
	err = ioutil.WriteFile(fmt.Sprintf("%s/main.py", foldername), stitched, os.ModePerm)
	if err != nil {
		log.Println("Failed writing to stitched: %s", err)
		os.Exit(3)
	}

	err = Copy(fmt.Sprintf("%s/%s/%s/requirements.txt", appfolder, appname, appversion), fmt.Sprintf("%s/requirements.txt", foldername))
	if err != nil {
		log.Println("Failed writing to requirement: %s", err)
		os.Exit(3)
	}

	log.Printf("Successfully stitched files in %s/main.py", foldername)
	// Zip the folder
	files := []string{
		fmt.Sprintf("%s/main.py", foldername),
		fmt.Sprintf("%s/requirements.txt", foldername),
	}
	outputfile := fmt.Sprintf("%s.zip", foldername)

	err = ZipFiles(outputfile, files)
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()

	// Creates a client.
	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Printf("Failed to create client: %v", err)
		os.Exit(3)
	}

	// Create bucket handle
	bucket := client.Bucket(bucketName)

	remotePath := fmt.Sprintf("apps/%s_%s.zip", appname, appversion)
	err = createFileFromFile(bucket, remotePath, outputfile)
	if err != nil {
		log.Printf("Failed to upload to bucket: %v", err)
		os.Exit(3)
	}

	os.Remove(outputfile)
	return fmt.Sprintf("gs://%s/apps/%s_%s.zip", bucketName, appname, appversion)
}

func createFileFromFile(bucket *storage.BucketHandle, remotePath, localPath string) error {
	ctx := context.Background()
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

// Deploy to google cloud function :)
func deployFunction(appname, localization, applocation string, environmentVariables map[string]string) error {
	ctx := context.Background()
	service, err := cloudfunctions.NewService(ctx)
	if err != nil {
		return err
	}

	// ProjectsLocationsListCall
	projectsLocationsFunctionsService := cloudfunctions.NewProjectsLocationsFunctionsService(service)
	location := fmt.Sprintf("projects/%s/locations/%s", gceProject, localization)
	functionName := fmt.Sprintf("%s/functions/%s", location, appname)

	cloudFunction := &cloudfunctions.CloudFunction{
		AvailableMemoryMb:    128,
		EntryPoint:           "authorization",
		EnvironmentVariables: environmentVariables,
		HttpsTrigger:         &cloudfunctions.HttpsTrigger{},
		MaxInstances:         0,
		Name:                 functionName,
		Runtime:              "python37",
		SourceArchiveUrl:     applocation,
	}

	//getCall := projectsLocationsFunctionsService.Get(fmt.Sprintf("%s/functions/function-5", location))
	//resp, err := getCall.Do()

	createCall := projectsLocationsFunctionsService.Create(location, cloudFunction)
	_, err = createCall.Do()
	if err != nil {
		log.Println("Failed creating new function. Attempting patch, as it might exist already")

		createCall := projectsLocationsFunctionsService.Patch(fmt.Sprintf("%s/functions/%s", location, appname), cloudFunction)
		_, err = createCall.Do()
		if err != nil {
			log.Println("Failed patching function")
			return err
		}

		log.Printf("Successfully patched %s to %s", appname, localization)
	} else {
		log.Printf("Successfully deployed %s to %s", appname, localization)
	}

	// FIXME - use response to define the HTTPS entrypoint. It's default to an easy one tho

	return nil
}

func deployAppCloudFunc(appname string, appversion string) {
	_ = os.Mkdir("generated_apps", os.ModePerm)

	apikey := "eyJhbGciOiJSUzI1NiIsImtpZCI6IjYwZjQwNjBlNThkNzVmZDNmNzBiZWZmODhjNzk0YTc3NTMyN2FhMzEiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJodHRwczovL3NodWZmbGVyLmlvL2FwaS92MS93b3JrZmxvd3MvMWQ5ZDhjZTItNTY2ZS00YzNmLThhMzctNWQ2YzdkMjAwMGI1L2V4ZWN1dGUiLCJhenAiOiIxMDMwNzY3ODIwNjE0MjQ2MTg0MjIiLCJlbWFpbCI6InNjaGVkdWxlckBzaHVmZmxlLTI0MTUxNy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1NjU1Mjc1NTEsImlhdCI6MTU2NTUyMzk1MSwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwic3ViIjoiMTAzMDc2NzgyMDYxNDI0NjE4NDIyIn0.r0EDq9fjhf_5CPTiltyfk_L3uYJp577Uy0yYPcCAl2nv50_z_oUtbWGBpQLL8gcj-NGd3g4E52Qur8k6hCMIQweLS6WAb1279vGffEoCNDfkWb3Oy-yJGP1kzwLvqFJqnHLkSWYXNWvSyWnEimW8Rryx_m1BXS5wcA8l4NIr83kS7fPZrTwjnwFSeGSThwk91DVARzapQb8r0GEgOUyHZ1aBXnV98mikzSUt-5xFKe9eMdD22YJAj0Ru-DxAxs5nOqghX4PMRysWjshjOMrlR1piPWxqAmewp8YKZDCQ5gXskpeAFBDoULT971Wsx_NCohnJsFqx1JfPS9ZYMTW2oQ"
	fullAppname := fmt.Sprintf("%s-%s", strings.Replace(appname, "_", "-", -1), strings.Replace(appversion, ".", "-", -1))
	locations := []string{"europe-west2"}

	// Deploys the app to all locations
	bucketname := stitcher(appname, appversion)
	environmentVariables := map[string]string{
		"FUNCTION_APIKEY": apikey,
	}

	for _, location := range locations {
		err := deployFunction(fullAppname, location, bucketname, environmentVariables)
		if err != nil {
			log.Printf("Failed to deploy: %s", err)
			os.Exit(3)
		}
	}
}

func loadYaml(fileLocation string) (WorkflowApp, error) {
	action := WorkflowApp{}

	yamlFile, err := ioutil.ReadFile(fileLocation)
	if err != nil {
		log.Printf("yamlFile.Get err: %s", err)
		return WorkflowApp{}, err
	}

	//log.Printf(string(yamlFile))
	err = yaml.Unmarshal([]byte(yamlFile), &action)
	if err != nil {
		return WorkflowApp{}, err
	}

	return action, nil
}

// FIXME - deploy to backend (YAML config)
func deployConfigToBackend(appname string, appversion string) error {
	// FIXME - no static path pls
	action, err := loadYaml(fmt.Sprintf("apps/%s/%s/api.yaml", appname, appversion))
	if err != nil {
		log.Println(err)
		return err
	}

	action.Sharing = true

	data, err := json.Marshal(action)
	if err != nil {
		return err
	}

	url := "http://localhost:5001/api/v1/workflows/apps"
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(data))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjYwZjQwNjBlNThkNzVmZDNmNzBiZWZmODhjNzk0YTc3NTMyN2FhMzEiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJodHRwczovL3NodWZmbGVyLmlvL2FwaS92MS93b3JrZmxvd3MvMWQ5ZDhjZTItNTY2ZS00YzNmLThhMzctNWQ2YzdkMjAwMGI1L2V4ZWN1dGUiLCJhenAiOiIxMDMwNzY3ODIwNjE0MjQ2MTg0MjIiLCJlbWFpbCI6InNjaGVkdWxlckBzaHVmZmxlLTI0MTUxNy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1NjU1Mjc1NTEsImlhdCI6MTU2NTUyMzk1MSwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwic3ViIjoiMTAzMDc2NzgyMDYxNDI0NjE4NDIyIn0.r0EDq9fjhf_5CPTiltyfk_L3uYJp577Uy0yYPcCAl2nv50_z_oUtbWGBpQLL8gcj-NGd3g4E52Qur8k6hCMIQweLS6WAb1279vGffEoCNDfkWb3Oy-yJGP1kzwLvqFJqnHLkSWYXNWvSyWnEimW8Rryx_m1BXS5wcA8l4NIr83kS7fPZrTwjnwFSeGSThwk91DVARzapQb8r0GEgOUyHZ1aBXnV98mikzSUt-5xFKe9eMdD22YJAj0Ru-DxAxs5nOqghX4PMRysWjshjOMrlR1piPWxqAmewp8YKZDCQ5gXskpeAFBDoULT971Wsx_NCohnJsFqx1JfPS9ZYMTW2oQ")

	ret, err := client.Do(req)
	if err != nil {
		return err
	}

	log.Printf("Status: %s", ret.Status)
	body, err := ioutil.ReadAll(ret.Body)
	if err != nil {
		return err
	}

	if ret.StatusCode != 200 {
		return errors.New(fmt.Sprintf("Status %s. App probably already exists. Raw:\n%s", ret.Status, string(body)))
	}

	log.Println(string(body))
	return nil
}

func tarDirectory(filecontext string) (io.Reader, error) {

	// Create a filereader
	//dockerFileReader, err := os.Open(dockerfile)
	//if err != nil {
	//	return err
	//}

	//// Read the actual Dockerfile
	//readDockerFile, err := ioutil.ReadAll(dockerFileReader)
	//if err != nil {
	//	return err
	//}

	// Make a TAR header for the file
	tarHeader := &tar.Header{
		Name:     filecontext,
		Typeflag: tar.TypeDir,
	}

	// Writes the header described for the TAR file
	buf := new(bytes.Buffer)
	tw := tar.NewWriter(buf)
	defer tw.Close()
	err := tw.WriteHeader(tarHeader)
	if err != nil {
		return nil, err
	}

	dockerFileTarReader := bytes.NewReader(buf.Bytes())
	return dockerFileTarReader, nil
}

func tarDir(source string, target string) (*bytes.Reader, error) {
	filename := filepath.Base(source)
	target = filepath.Join(target, fmt.Sprintf("%s.tar", filename))
	tarfile, err := os.Create(target)
	if err != nil {
		return nil, err
	}

	defer tarfile.Close()

	buf := new(bytes.Buffer)
	_ = buf
	tarball := tar.NewWriter(tarfile)
	defer tarball.Close()

	info, err := os.Stat(source)
	if err != nil {
		return nil, err
	}

	var baseDir string
	if info.IsDir() {
		baseDir = filepath.Base(source)
	}

	_ = filepath.Walk(source,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			header, err := tar.FileInfoHeader(info, info.Name())
			if err != nil {
				return err
			}

			if baseDir != "" {
				header.Name = filepath.Join(baseDir, strings.TrimPrefix(path, source))
			}

			if err := tarball.WriteHeader(header); err != nil {
				return err
			}

			if info.IsDir() {
				return nil
			}

			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()
			_, err = io.Copy(tarball, file)
			return nil
		})

	dockerFileTarReader := bytes.NewReader(buf.Bytes())
	return dockerFileTarReader, nil
}

func buildImage(client *client.Client, tags []string, dockerBuildCtxDir string) error {
	dockerBuildContext, err := tarDir(dockerBuildCtxDir, ".")
	if err != nil {
		log.Printf("Error in taring the docker root folder - %s", err.Error())
		return err
	}

	imageBuildResponse, err := client.ImageBuild(
		context.Background(),
		dockerBuildContext,
		types.ImageBuildOptions{
			Dockerfile: "Dockerfile",
			PullParent: true,
			Remove:     true,
			Tags:       tags,
		},
	)

	if err != nil {
		return err
	}

	// Read the STDOUT from the build process
	defer imageBuildResponse.Body.Close()
	_, err = io.Copy(os.Stdout, imageBuildResponse.Body)
	if err != nil {
		return err
	}

	return nil
}

// FIXME - deploy to dockerhub
func deployWorker(appname, appversion string) error {
	// Get dockerfile from ./apps/appname/appversion/Dockerfile
	client, err := client.NewEnvClient()
	if err != nil {
		return err
	}

	tags := []string{fmt.Sprintf("%s-%s", appname, appversion)}
	err = buildImage(client, tags, fmt.Sprintf("./apps/%s/%s", appname, appversion))
	if err != nil {
		log.Printf("Build error: %s", err)
		return err
	}

	return nil
}

// Deploys all cloud functions. Onprem thooo :(
func deployAll() {
	allapps := []string{
		"hoxhunt",
		"secureworks",
		"servicenow",
		"lastline",
		"netcraft",
		"misp",
		"email",
		"testing",
		"http",
		"recordedfuture",
		"passivetotal",
		"carbon_black",
		"thehive",
		"cortex",
		"splunk",
	}

	for _, appname := range allapps {
		appversion := "1.0.0"

		err := deployConfigToBackend(appname, appversion)
		if err != nil {
			log.Printf("Failed uploading config: %s", err)
			continue
		}

		deployAppCloudFunc(appname, appversion)
	}
}

func main() {
	deployAll()
	return

	appname := "testing"
	appversion := "1.0.0"

	err := deployConfigToBackend(appname, appversion)
	if err != nil {
		log.Printf("Failed uploading config: %s", err)
		os.Exit(1)
	}

	deployAppCloudFunc(appname, appversion)

	// FIXME - build and deploy to dockerhub as well :)
	// Not able to work in remote directory propely... Even tried making an actual tar and checking it rofl
	//err := deployWorker(appname, appversion)
	//if err != nil {
	//	log.Printf("Failed to deploy docker worker: %s", err)
	//}
}
