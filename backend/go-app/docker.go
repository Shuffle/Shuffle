package main

// Docker
import (
	"archive/tar"
	"path/filepath"

	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/go-git/go-billy/v5"

	network "github.com/docker/docker/api/types/network"
	natting "github.com/docker/go-connections/nat"

	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	//"google.golang.org/appengine"
)

// Parses a directory with a Dockerfile into a tar for Docker images..
func getParsedTar(tw *tar.Writer, baseDir, extra string) error {
	return filepath.Walk(baseDir, func(file string, fi os.FileInfo, err error) error {
		if file == baseDir {
			return nil
		}

		//log.Printf("File: %s", file)
		//log.Printf("Fileinfo: %#v", fi)
		switch mode := fi.Mode(); {
		case mode.IsDir():
			// do directory recursion
			//log.Printf("DIR: %s", file)

			// Append "src" as extra here
			filenamesplit := strings.Split(file, "/")
			filename := fmt.Sprintf("%s%s/", extra, filenamesplit[len(filenamesplit)-1])

			tmpExtra := fmt.Sprintf(filename)
			//log.Printf("TmpExtra: %s", tmpExtra)
			err = getParsedTar(tw, file, tmpExtra)
			if err != nil {
				log.Printf("Directory parse issue: %s", err)
				return err
			}
		case mode.IsRegular():
			// do file stuff
			//log.Printf("FILE: %s", file)

			fileReader, err := os.Open(file)
			if err != nil {
				return err
			}

			// Read the actual Dockerfile
			readFile, err := ioutil.ReadAll(fileReader)
			if err != nil {
				log.Printf("Not file: %s", err)
				return err
			}

			filenamesplit := strings.Split(file, "/")
			filename := fmt.Sprintf("%s%s", extra, filenamesplit[len(filenamesplit)-1])
			//log.Printf("Filename: %s", filename)
			tarHeader := &tar.Header{
				Name: filename,
				Size: int64(len(readFile)),
			}

			//Writes the header described for the TAR file
			err = tw.WriteHeader(tarHeader)
			if err != nil {
				return err
			}

			// Writes the dockerfile data to the TAR file
			_, err = tw.Write(readFile)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

// Custom TAR builder in memory for Docker images
func getParsedTarMemory(fs billy.Filesystem, tw *tar.Writer, baseDir, extra string) error {
	// This one has to use baseDir + Extra
	newBase := fmt.Sprintf("%s%s", baseDir, extra)
	dir, err := fs.ReadDir(newBase)
	if err != nil {
		return err
	}

	for _, file := range dir {
		// Folder?
		switch mode := file.Mode(); {
		case mode.IsDir():
			filename := file.Name()
			filenamesplit := strings.Split(filename, "/")

			tmpExtra := fmt.Sprintf("%s%s/", extra, filenamesplit[len(filenamesplit)-1])
			//log.Printf("EXTRA: %s", tmpExtra)
			err = getParsedTarMemory(fs, tw, baseDir, tmpExtra)
			if err != nil {
				log.Printf("Directory parse issue: %s", err)
				return err
			}
		case mode.IsRegular():
			filenamesplit := strings.Split(file.Name(), "/")
			filename := fmt.Sprintf("%s%s", extra, filenamesplit[len(filenamesplit)-1])
			// Newbase
			path := fmt.Sprintf("%s%s", newBase, file.Name())

			fileReader, err := fs.Open(path)
			if err != nil {
				return err
			}

			readFile, err := ioutil.ReadAll(fileReader)
			if err != nil {
				log.Printf("Not file: %s", err)
				return err
			}

			//log.Printf("Filename: %s", filename)
			// FIXME - might need the folder from EXTRA here
			// Name has to be e.g. just "requirements.txt"
			tarHeader := &tar.Header{
				Name: filename,
				Size: int64(len(readFile)),
			}

			//Writes the header described for the TAR file
			err = tw.WriteHeader(tarHeader)
			if err != nil {
				return err
			}

			// Writes the dockerfile data to the TAR file
			_, err = tw.Write(readFile)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// Custom Docker image builder wrapper in memory
func buildImageMemory(fs billy.Filesystem, tags []string, dockerfileFolder string) error {
	ctx := context.Background()
	client, err := client.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		return err
	}

	buf := new(bytes.Buffer)
	tw := tar.NewWriter(buf)
	defer tw.Close()

	log.Printf("Setting up memory build structure for folder: %s", dockerfileFolder)
	err = getParsedTarMemory(fs, tw, dockerfileFolder, "")
	if err != nil {
		log.Printf("Tar issue: %s", err)
		return err
	}

	dockerFileTarReader := bytes.NewReader(buf.Bytes())

	// Dockerfile is inside the TAR itself. Not local context
	// docker build --build-arg http_proxy=http://my.proxy.url
	buildOptions := types.ImageBuildOptions{
		Remove:      true,
		Tags:        tags,
		BuildArgs:   map[string]*string{},
		NetworkMode: "host",
	}

	httpProxy := os.Getenv("HTTP_PROXY")
	if len(httpProxy) > 0 {
		buildOptions.BuildArgs["http_proxy"] = &httpProxy
	}
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if len(httpProxy) > 0 {
		buildOptions.BuildArgs["https_proxy"] = &httpsProxy
	}

	// Build the actual image
	imageBuildResponse, err := client.ImageBuild(
		ctx,
		dockerFileTarReader,
		buildOptions,
	)
	//log.Printf("IMAGERESPONSE: %#v", imageBuildResponse.Body)

	defer imageBuildResponse.Body.Close()
	_, newerr := io.Copy(os.Stdout, imageBuildResponse.Body)
	if newerr != nil {
		log.Printf("Failed reading Docker build STDOUT: %s", newerr)
	}

	if err != nil {
		// Read the STDOUT from the build process

		return err
	}

	return nil
}

func buildImage(tags []string, dockerfileFolder string) error {
	ctx := context.Background()
	client, err := client.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		return err
	}

	log.Printf("Tags: %s", tags)
	dockerfileSplit := strings.Split(dockerfileFolder, "/")

	// Create a buffer
	buf := new(bytes.Buffer)
	tw := tar.NewWriter(buf)
	defer tw.Close()
	baseDir := strings.Join(dockerfileSplit[0:len(dockerfileSplit)-1], "/")

	// Builds the entire folder into buf
	err = getParsedTar(tw, baseDir, "")
	if err != nil {
		log.Printf("Tar issue: %s", err)
	}

	dockerFileTarReader := bytes.NewReader(buf.Bytes())
	buildOptions := types.ImageBuildOptions{
		Remove:      true,
		Tags:        tags,
		BuildArgs:   map[string]*string{},
		NetworkMode: "host",
	}

	httpProxy := os.Getenv("HTTP_PROXY")
	if len(httpProxy) > 0 {
		buildOptions.BuildArgs["http_proxy"] = &httpProxy
	}
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if len(httpProxy) > 0 {
		buildOptions.BuildArgs["https_proxy"] = &httpsProxy
	}

	// Build the actual image
	imageBuildResponse, err := client.ImageBuild(
		ctx,
		dockerFileTarReader,
		buildOptions,
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

// FIXME - very specific for webhooks. Make it easier?
func stopWebhook(image string, identifier string) error {
	ctx := context.Background()

	containername := fmt.Sprintf("%s-%s", image, identifier)

	cli, err := client.NewEnvClient()
	if err != nil {
		log.Println("Unable to create docker client")
		return err
	}

	//	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
	//		All: true,
	//	})

	if err := cli.ContainerStop(ctx, containername, nil); err != nil {
		log.Printf("Unable to stop container %s - running removal anyway, just in case: %s", containername, err)
	}

	removeOptions := types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	}

	if err := cli.ContainerRemove(ctx, containername, removeOptions); err != nil {
		log.Printf("Unable to remove container: %s", err)
	}

	return nil
}

// FIXME - remember to set DOCKER_API_VERSION
// FIXME - remove github.com/docker/docker/vendor
// FIXME - Library dependencies for NAT is fucked..
// https://docs.docker.com/develop/sdk/examples/
func deployWebhook(image string, identifier string, path string, port string, callbackurl string, apikey string) error {
	cli, err := client.NewEnvClient()
	if err != nil {
		fmt.Println("Unable to create docker client")
		return err
	}

	newport, err := natting.NewPort("tcp", port)
	if err != nil {
		fmt.Println("Unable to create docker port")
		return err
	}

	// FIXME - logging?

	hostConfig := &container.HostConfig{
		PortBindings: natting.PortMap{
			newport: []natting.PortBinding{
				{
					HostIP:   "0.0.0.0",
					HostPort: port,
				},
			},
		},
		RestartPolicy: container.RestartPolicy{
			Name: "always",
		},
		LogConfig: container.LogConfig{
			Type:   "json-file",
			Config: map[string]string{},
		},
	}

	//networkConfig := &network.NetworkSettings{}
	networkConfig := &network.NetworkingConfig{
		EndpointsConfig: map[string]*network.EndpointSettings{},
	}

	test := &network.EndpointSettings{
		Gateway: "helo",
	}

	networkConfig.EndpointsConfig["bridge"] = test

	exposedPorts := map[natting.Port]struct{}{
		newport: struct{}{},
	}

	config := &container.Config{
		Image: image,
		Env: []string{
			fmt.Sprintf("URIPATH=%s", path),
			fmt.Sprintf("HOOKPORT=%s", port),
			fmt.Sprintf("CALLBACKURL=%s", callbackurl),
			fmt.Sprintf("APIKEY=%s", apikey),
			fmt.Sprintf("HOOKID=%s", identifier),
		},
		ExposedPorts: exposedPorts,
		Hostname:     fmt.Sprintf("%s-%s", image, identifier),
	}

	cont, err := cli.ContainerCreate(
		context.Background(),
		config,
		hostConfig,
		networkConfig,
		fmt.Sprintf("%s-%s", image, identifier),
	)

	if err != nil {
		log.Println(err)
		return err
	}

	cli.ContainerStart(context.Background(), cont.ID, types.ContainerStartOptions{})
	log.Printf("Container %s is created", cont.ID)
	return nil
}

// Starts a new webhook
func handleStopHookDocker(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	ctx := context.Background()
	hook, err := getHook(ctx, fileId)
	if err != nil {
		log.Printf("Failed getting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("Status: %s", hook.Status)
	log.Printf("Running: %t", hook.Running)
	if !hook.Running {
		message := fmt.Sprintf("Error: %s isn't running", hook.Id)
		log.Println(message)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "%s"}`, message)))
		return
	}

	hook.Status = "stopped"
	hook.Running = false
	hook.Actions = []HookAction{}
	err = setHook(ctx, *hook)
	if err != nil {
		log.Printf("Failed setting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	image := "webhook"

	// This is here to force stop and remove the old webhook
	err = stopWebhook(image, fileId)
	if err != nil {
		log.Printf("Container stop issue for %s-%s: %s", image, fileId, err)
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true, "message": "Stopped webhook"}`))
}

// THis is an example
// Can also be used as base data?
var webhook = `{
	"id": "d6ef8912e8bd37776e654cbc14c2629c",
	"info": {
		"url": "http://localhost:5001",
		"name": "TheHive",
		"description": "Webhook for TheHive"
	},
	"transforms": {},
	"actions": {},
	"type": "webhook",
	"running": false,
	"status": "stopped"
}`

// Starts a new webhook
func handleDeleteHookDocker(resp http.ResponseWriter, request *http.Request) {
	ctx := context.Background()
	cors := handleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	err := DeleteKey(ctx, "hooks", fileId)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "Can't delete"}`))
		return
	}

	image := "webhook"

	// This is here to force stop and remove the old webhook
	err = stopWebhook(image, fileId)
	if err != nil {
		log.Printf("Container stop issue for %s-%s: %s", image, fileId, err)
		resp.Write([]byte(`{"success": false, "message": "Couldn't stop webhook"}`))
		return
	}

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true, "message": "Deleted webhook"}`))
}

// Starts a new webhook
func handleStartHookDocker(resp http.ResponseWriter, request *http.Request) {
	cors := handleCors(resp, request)
	if cors {
		return
	}

	location := strings.Split(request.URL.String(), "/")

	var fileId string
	if location[1] == "api" {
		if len(location) <= 4 {
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false}`))
			return
		}

		fileId = location[4]
	}

	if len(fileId) != 32 {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "message": "ID not valid"}`))
		return
	}

	ctx := context.Background()
	hook, err := getHook(ctx, fileId)
	if err != nil {
		log.Printf("Failed getting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if len(hook.Info.Url) == 0 {
		log.Printf("Hook url can't be empty.")
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("Status: %s", hook.Status)
	log.Printf("Running: %t", hook.Running)
	if hook.Running || hook.Status == "Running" {
		message := fmt.Sprintf("Error: %s is already running", hook.Id)
		log.Println(message)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "%s"}`, message)))
		return
	}

	// FIXME - verify?
	// FIXME - static port? Generate from available range.
	image := "webhook"
	filepath := "/webhook"
	baseUrl := "http://localhost"
	callbackUrl := "http://localhost:8001"

	// This is here to force stop and remove the old webhook
	err = stopWebhook(image, fileId)
	if err != nil {
		log.Printf("Container stop issue for %s-%s: %s", image, fileId, err)
	}

	// Dynamic ish ports
	var startPort int64 = 5001
	var endPort int64 = 5010
	port := findAvailablePorts(startPort, endPort)
	if len(port) == 0 {
		message := fmt.Sprintf("Not ports available in the range %d-%d", startPort, endPort)
		log.Println(message)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "%s"}`, message)))
		return

	}

	hook.Status = "running"
	hook.Running = true

	// Set this for more than just hooks?
	if hook.Type == "webhook" {
		hook.Info.Url = fmt.Sprintf("%s:%s%s", baseUrl, port, filepath)
	}
	err = setHook(ctx, *hook)
	if err != nil {
		log.Printf("Failed setting hook: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// Cloud run? Let's make a generic webhook that can be deployed easily
	log.Printf("Should run a webhook with the following: \nUrl: %s\nId: %s\n", hook.Info.Url, hook.Id)

	// FIXME - set port based on what the user specified / what was generated
	// FIXME - add nonstatic APIKEY
	apiKey := "ASD"

	err = deployWebhook(image, fileId, filepath, port, callbackUrl, apiKey)
	if err != nil {
		log.Printf("Failed starting container %s-%s: %s", image, fileId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	// FIXME - get some real data?
	log.Printf("Successfully started %s-%s on port %s with filepath %s", image, fileId, port, filepath)
	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true, "message": "Started webhook"}`))
	return
}

// Checks if an image exists
func imageCheckBuilder(images []string) error {
	log.Printf("ImageNames: %#v", images)
	ctx := context.Background()
	client, err := client.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		return err
	}

	allImages, err := client.ImageList(ctx, types.ImageListOptions{
		All: true,
	})

	if err != nil {
		log.Printf("[ERROR] Failed creating imagelist: %s", err)
		return err
	}

	filteredImages := []types.ImageSummary{}
	for _, image := range allImages {
		found := false
		for _, repoTag := range image.RepoTags {
			if strings.Contains(repoTag, baseDockerName) {
				found = true
				break
			}
		}

		if found {
			filteredImages = append(filteredImages, image)
		}
	}

	// FIXME: Continue fixing apps here
	// https://github.com/frikky/Shuffle/issues/135
	// 1. Find if app exists
	// 2. Create app if it doesn't
	//log.Printf("Apps: %#v", filteredImages)

	return nil
}

func hookTest() {
	var hook Hook
	err := json.Unmarshal([]byte(webhook), &hook)
	log.Println(webhook)
	if err != nil {
		log.Printf("Failed hook unmarshaling: %s", err)
		return
	}

	ctx := context.Background()
	err = setHook(ctx, hook)
	if err != nil {
		log.Printf("Failed setting hook: %s", err)
	}

	returnHook, err := getHook(ctx, hook.Id)
	if err != nil {
		log.Printf("Failed getting hook: %s", err)
	}

	if len(returnHook.Id) > 0 {
		log.Printf("Success! - %s", returnHook.Id)
	}
}
