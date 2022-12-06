package main

// Docker
import (
	"archive/tar"

	"github.com/shuffle/shuffle-shared"

	//"bufio"
	"path/filepath"
	//"strconv"

	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"

	//"github.com/docker/docker"
	"github.com/docker/docker/api/types"
	//"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	newdockerclient "github.com/fsouza/go-dockerclient"
	"github.com/go-git/go-billy/v5"

	//network "github.com/docker/docker/api/types/network"
	//natting "github.com/docker/go-connections/nat"

	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
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

			//log.Printf("FILENAME: %s", filename)
			readFile, err := ioutil.ReadAll(fileReader)
			if err != nil {
				log.Printf("Not file: %s", err)
				return err
			}

			// Fixes issues with older versions of Docker and reference formats
			// Specific to Shuffle rn. Could expand.
			// FIXME: Seems like the issue was with multi-stage builds
			/*
				if filename == "Dockerfile" {
					log.Printf("Should search and replace in readfile.")

					referenceCheck := "FROM frikky/shuffle:"
					if strings.Contains(string(readFile), referenceCheck) {
						log.Printf("SHOULD SEARCH & REPLACE!")
						newReference := fmt.Sprintf("FROM registry.hub.docker.com/frikky/shuffle:")
						readFile = []byte(strings.Replace(string(readFile), referenceCheck, newReference, -1))
					}
				}
			*/

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

/*
// Fixes App SDK issues.. meh
func fixTags(tags []string) []string {
	checkTag := "frikky/shuffle"
	newTags := []string{}
	for _, tag := range tags {
		if strings.HasPrefix(tag, checkTags) {
			newTags.append(newTags, fmt.Sprintf("registry.hub.docker.com/%s", tag))
		}

		newTags.append(tag)
	}
}
*/

// Custom Docker image builder wrapper in memory
func buildImageMemory(fs billy.Filesystem, tags []string, dockerfileFolder string, downloadIfFail bool) error {
	ctx := context.Background()
	client, err := client.NewEnvClient()
	if err != nil {
		log.Printf("Unable to create docker client: %s", err)
		return err
	}

	buf := new(bytes.Buffer)
	tw := tar.NewWriter(buf)
	defer tw.Close()

	log.Printf("[INFO] Setting up memory build structure for folder: %s", dockerfileFolder)
	err = getParsedTarMemory(fs, tw, dockerfileFolder, "")
	if err != nil {
		log.Printf("Tar issue: %s", err)
		return err
	}

	dockerFileTarReader := bytes.NewReader(buf.Bytes())

	// Dockerfile is inside the TAR itself. Not local context
	// docker build --build-arg http_proxy=http://my.proxy.url
	// Attempt at setting name according to #359: https://github.com/frikky/Shuffle/issues/359
	labels := map[string]string{}
	//target := ""
	//if len(tags) > 0 {
	//	if strings.Contains(tags[0], ":") {
	//		version := strings.Split(tags[0], ":")
	//		if len(version) == 2 {
	//			target = fmt.Sprintf("shuffle-build-%s", version[1])
	//			tags = append(tags, target)
	//			labels["name"] = target
	//		}
	//	}
	//}

	buildOptions := types.ImageBuildOptions{
		Remove:    true,
		Tags:      tags,
		BuildArgs: map[string]*string{},
		Labels:    labels,
	}

	// NetworkMode: "host",

	httpProxy := os.Getenv("HTTP_PROXY")
	if len(httpProxy) > 0 {
		buildOptions.BuildArgs["http_proxy"] = &httpProxy
	}
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if len(httpProxy) > 0 {
		buildOptions.BuildArgs["https_proxy"] = &httpsProxy
	}

	// Build the actual image
	log.Printf(`[INFO] Building %s with proxy "%s". Tags: "%s". This may take up to a few minutes.`, dockerfileFolder, httpsProxy, strings.Join(tags, ","))
	imageBuildResponse, err := client.ImageBuild(
		ctx,
		dockerFileTarReader,
		buildOptions,
	)

	//log.Printf("RESPONSE: %#v", imageBuildResponse)
	//log.Printf("Response: %#v", imageBuildResponse.Body)
	//log.Printf("[DEBUG] IMAGERESPONSE: %#v", imageBuildResponse.Body)

	if imageBuildResponse.Body != nil {
		defer imageBuildResponse.Body.Close()
		buildBuf := new(strings.Builder)
		_, newerr := io.Copy(buildBuf, imageBuildResponse.Body)
		if newerr != nil {
			log.Printf("[WARNING] Failed reading Docker build STDOUT: %s", newerr)
		} else {
			log.Printf("[INFO] STRING: %s", buildBuf.String())
			if strings.Contains(buildBuf.String(), "errorDetail") {
				log.Printf("[ERROR] Docker build:\n%s\nERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), strings.Join(tags, "\n"))

				// Handles pulling of the same image if applicable
				// This fixes some issues with older versions of Docker which can't build
				// on their own ( <17.05 )
				pullOptions := types.ImagePullOptions{}
				downloaded := false
				for _, image := range tags {
					// Is this ok? Not sure. Tags shouldn't be controlled here prolly.
					image = strings.ToLower(image)

					newImage := fmt.Sprintf("%s/%s", registryName, image)
					log.Printf("[INFO] Pulling image %s", newImage)
					reader, err := client.ImagePull(ctx, newImage, pullOptions)
					if err != nil {
						log.Printf("[ERROR] Failed getting image %s: %s", newImage, err)
						continue
					}

					// Attempt to retag the image to not contain registry...

					//newBuf := buildBuf
					downloaded = true
					io.Copy(os.Stdout, reader)
					log.Printf("[INFO] Successfully downloaded and built %s", newImage)
				}

				if !downloaded {

					return errors.New(fmt.Sprintf("Failed to build / download images %s", strings.Join(tags, ",")))
				}
				//baseDockerName
			}
		}
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

	log.Printf("[INFO] Docker Tags: %s", tags)
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
		Remove:    true,
		Tags:      tags,
		BuildArgs: map[string]*string{},
	}
	//NetworkMode: "host",

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
	buildBuf := new(strings.Builder)
	_, err = io.Copy(buildBuf, imageBuildResponse.Body)
	if err != nil {
		return err
	} else {
		if strings.Contains(buildBuf.String(), "errorDetail") {
			log.Printf("[ERROR] Docker build:\n%s\nERROR ABOVE: Trying to pull tags from: %s", buildBuf.String(), strings.Join(tags, "\n"))
			return errors.New(fmt.Sprintf("Failed building %s. Check backend logs for details. Most likely means you have an old version of Docker.", strings.Join(tags, ",")))
		}
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

// Starts a new webhook
func handleStopHookDocker(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
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
	hook, err := shuffle.GetHook(ctx, fileId)
	if err != nil {
		log.Printf("Failed getting hook %s (stop docker): %s", fileId, err)
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
	hook.Actions = []shuffle.HookAction{}
	err = shuffle.SetHook(ctx, *hook)
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
	cors := shuffle.HandleCors(resp, request)
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

	err := shuffle.DeleteKey(ctx, "hooks", fileId)
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

// Checks if an image exists
func imageCheckBuilder(images []string) error {
	//log.Printf("[FIXME] ImageNames to check: %#v", images)
	return nil

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
	var hook shuffle.Hook
	err := json.Unmarshal([]byte(webhook), &hook)
	log.Println(webhook)
	if err != nil {
		log.Printf("Failed hook unmarshaling: %s", err)
		return
	}

	ctx := context.Background()
	err = shuffle.SetHook(ctx, hook)
	if err != nil {
		log.Printf("Failed setting hook: %s", err)
	}

	returnHook, err := shuffle.GetHook(ctx, hook.Id)
	if err != nil {
		log.Printf("Failed getting hook %s (test): %s", hook.Id, err)
	}

	if len(returnHook.Id) > 0 {
		log.Printf("Success! - %s", returnHook.Id)
	}
}

//https://stackoverflow.com/questions/23935141/how-to-copy-docker-images-from-one-host-to-another-without-using-a-repository
func getDockerImage(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	// Just here to verify that the user is logged in
	//_, err := shuffle.HandleApiAuthentication(resp, request)
	//if err != nil {
	//	log.Printf("[WARNING] Api authentication failed in DOWNLOAD IMAGE: %s", err)
	//	resp.WriteHeader(401)
	//	resp.Write([]byte(`{"success": false}`))
	//	return
	//}

	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Failed reading body"}`))
		return
	}

	type requestCheck struct {
		Name string `datastore:"name" json:"name" yaml:"name"`
	}

	// This has to be done in a weird way because Datastore doesn't
	// support map[string]interface and similar (openapi3.Swagger)
	var version requestCheck

	err = json.Unmarshal(body, &version)
	if err != nil {
		resp.WriteHeader(422)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed JSON marshalling: %s"}`, err)))
		return
	}

	//log.Printf("[DEBUG] Image to load: %s", version.Name)
	dockercli, err := client.NewEnvClient()
	if err != nil {
		log.Printf("[WARNING] Unable to create docker client: %s", err)
		resp.WriteHeader(422)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Failed JSON marshalling: %s"}`, err)))
		return
	}

	ctx := context.Background()
	images, err := dockercli.ImageList(ctx, types.ImageListOptions{
		All: true,
	})

	img := types.ImageSummary{}
	tagFound := ""

	img2 := types.ImageSummary{}
	tagFound2 := ""

	alternativeNameSplit := strings.Split(version.Name, "/")
	alternativeName := version.Name
	if len(alternativeNameSplit) == 3 {
		alternativeName = strings.Join(alternativeNameSplit[1:3], "/")
	}

	for _, image := range images {
		for _, tag := range image.RepoTags {
			if strings.ToLower(tag) == strings.ToLower(version.Name) {
				img = image
				tagFound = tag
				break
			}

			if strings.ToLower(tag) == strings.ToLower(alternativeName) {
				img2 = image
				tagFound2 = tag
			}
		}
	}

	// REBUILDS THE APP
	if len(img.ID) == 0 {
		if len(img2.ID) == 0 {
			workflowapps, err := shuffle.GetAllWorkflowApps(ctx, 0, 0)
			//log.Printf("[INFO] Getting workflowapps for a rebuild. Got %d with err %#v", len(workflowapps), err)
			if err == nil {
				imageName := ""
				imageVersion := ""
				newNameSplit := strings.Split(version.Name, ":")
				if len(newNameSplit) == 2 {
					//log.Printf("[DEBUG] Found name %#v", newNameSplit)

					findVersionSplit := strings.Split(newNameSplit[1], "_")
					//log.Printf("[DEBUG] Found another split %#v", findVersionSplit)
					if len(findVersionSplit) == 2 {
						imageVersion = findVersionSplit[len(findVersionSplit)-1]
						imageName = findVersionSplit[0]
					} else if len(findVersionSplit) >= 2 {
						imageVersion = findVersionSplit[len(findVersionSplit)-1]
						imageName = strings.Join(findVersionSplit[0:len(findVersionSplit)-1], "_")
					} else {
						log.Printf("[DEBUG] Couldn't parse appname & version for %#v", findVersionSplit)
					}
				}

				if len(imageName) > 0 && len(imageVersion) > 0 {
					foundApp := shuffle.WorkflowApp{}
					imageName = strings.ToLower(imageName)
					imageVersion = strings.ToLower(imageVersion)
					log.Printf("[DEBUG] Looking for appname %s with version %s", imageName, imageVersion)

					for _, app := range workflowapps {
						if strings.ToLower(strings.Replace(app.Name, " ", "_", -1)) == imageName && app.AppVersion == imageVersion {
							if app.Generated {
								log.Printf("[DEBUG] Found matching app %s:%s - %s", imageName, imageVersion, app.ID)
								foundApp = app
								break
							} else {
								log.Printf("[WARNING] Trying to rebuild app that isn't generated - not allowed. Looking further.")
							}

							//break
						}
					}

					if len(foundApp.ID) > 0 {
						openApiApp, err := shuffle.GetOpenApiDatastore(ctx, foundApp.ID)
						if err != nil {
							log.Printf("[ERROR] Failed getting OpenAPI app %s to database: %s", foundApp.ID, err)
						} else {
							log.Printf("[DEBUG] Found OpenAPI app for %s as generated - now building!", version.Name)
							user := shuffle.User{}

							//img = version.Name
							if len(alternativeName) > 0 {
								tagFound = alternativeName
							} else {
								tagFound = version.Name
							}

							buildSwaggerApp(resp, []byte(openApiApp.Body), user, false)
						}
					}
				}
			} else {
				log.Printf("[WARNING] Couldn't find an image with registry name %s and %s", version.Name, alternativeName)
				resp.WriteHeader(401)
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "Couldn't find image %s"}`, version.Name)))
				return
			}
		}

		if len(tagFound) == 0 && len(tagFound2) > 0 {
			img = img2
			tagFound = tagFound2
		}
	}

	//log.Printf("[INFO] Img found (%s): %#v", tagFound, img)
	//log.Printf("[INFO] Img found to be downloaded by client: %s", tagFound)

	newClient, err := newdockerclient.NewClientFromEnv()
	if err != nil {
		log.Printf("[ERROR] Failed setting up docker env: %#v", newClient)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "Couldn't make docker client"}`)))
		return
	}

	////https://github.com/fsouza/go-dockerclient/issues/600
	//defer fileReader.Close()
	opts := newdockerclient.ExportImageOptions{
		Name:         tagFound,
		OutputStream: resp,
	}

	if err := newClient.ExportImage(opts); err != nil {
		log.Printf("[ERROR] FAILED to save image to file: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(fmt.Sprintf(`{"success": false, "message": "Couldn't export image"}`)))
		return
	}

	//resp.WriteHeader(200)
}

// Downloads and activates an app from shuffler.io if possible
func handleRemoteDownloadApp(resp http.ResponseWriter, ctx context.Context, user shuffle.User, appId string) {
	url := fmt.Sprintf("https://shuffler.io/api/v1/apps/%s/config", appId)
	log.Printf("Downloading API from %s", url)
	req, err := http.NewRequest(
		"GET",
		url,
		nil,
	)

	if err != nil {
		log.Printf("[ERROR] Failed auto-downloading app %s: %s", appId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
		return
	}

	httpClient := &http.Client{}
	newresp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed running auto-download request for %s: %s", appId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
		return
	}

	respBody, err := ioutil.ReadAll(newresp.Body)
	if err != nil {
		log.Printf("[ERROR] Failed setting respbody for workflow download: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
		return
	}

	if len(respBody) > 0 {
		type tmpapp struct {
			Success bool   `json:"success"`
			OpenAPI string `json:"openapi"`
		}

		app := tmpapp{}
		err := json.Unmarshal(respBody, &app)
		if err != nil || app.Success == false || len(app.OpenAPI) == 0 {
			log.Printf("[ERROR] Failed app unmarshal during auto-download. Success%#v. Applength: %d: %s", app.Success, len(app.OpenAPI), err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
			return
		}

		key, err := base64.StdEncoding.DecodeString(app.OpenAPI)
		if err != nil {
			log.Printf("[ERROR] Failed auto-setting OpenAPI app: %s", err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
			return
		}

		cacheKey := fmt.Sprintf("workflowapps-sorted-100")
		shuffle.DeleteCache(ctx, cacheKey)
		cacheKey = fmt.Sprintf("workflowapps-sorted-500")
		shuffle.DeleteCache(ctx, cacheKey)
		cacheKey = fmt.Sprintf("workflowapps-sorted-1000")
		shuffle.DeleteCache(ctx, cacheKey)

		newapp := shuffle.ParsedOpenApi{}
		err = json.Unmarshal(key, &newapp)
		if err != nil {
			log.Printf("[ERROR] Failed openapi unmarshal during auto-download: %s", app.Success, len(app.OpenAPI), err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
			return
		}

		err = json.Unmarshal(key, &newapp)
		if err != nil {
			log.Printf("[ERROR] Failed openapi unmarshal during auto-download: %s", app.Success, len(app.OpenAPI), err)
			resp.WriteHeader(401)
			resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
			return
		}

		buildSwaggerApp(resp, []byte(newapp.Body), user, true)
		return
	}
}

func activateWorkflowAppDocker(resp http.ResponseWriter, request *http.Request) {
	cors := shuffle.HandleCors(resp, request)
	if cors {
		return
	}

	user, err := shuffle.HandleApiAuthentication(resp, request)
	if err != nil {
		log.Printf("[WARNING] Api authentication failed in get active apps: %s", err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	if user.Role == "org-reader" {
		log.Printf("[WARNING] Org-reader doesn't have access to activate workflow app (shared): %s (%s)", user.Username, user.Id)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Read only user"}`))
		return
	}

	ctx := context.Background()
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

	app, err := shuffle.GetApp(ctx, fileId, user, false)
	if err != nil {
		appName := request.URL.Query().Get("app_name")
		appVersion := request.URL.Query().Get("app_version")

		if len(appName) > 0 && len(appVersion) > 0 {
			apps, err := shuffle.FindWorkflowAppByName(ctx, appName)
			//log.Printf("[INFO] Found %d apps for %s", len(apps), appName)
			if err != nil || len(apps) == 0 {
				log.Printf("[WARNING] Error getting app %s (app config). Starting remote download.: %s", appName, err)

				handleRemoteDownloadApp(resp, ctx, user, fileId)
				return
			}

			selectedApp := shuffle.WorkflowApp{}
			for _, app := range apps {
				if !app.Sharing && !app.Public {
					continue
				}

				if app.Name == appName {
					selectedApp = app
				}

				if app.Name == appName && app.AppVersion == appVersion {
					selectedApp = app
				}
			}

			app = &selectedApp
		} else {
			log.Printf("[WARNING] Error getting app with ID %s (app config): %s. Starting remote download(2)", fileId, err)
			handleRemoteDownloadApp(resp, ctx, user, fileId)
			return
			//resp.WriteHeader(401)
			//resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
			//return
		}
	}

	if app.Sharing || app.Public {
		org, err := shuffle.GetOrg(ctx, user.ActiveOrg.Id)
		if err == nil {
			added := false
			if !shuffle.ArrayContains(org.ActiveApps, app.ID) {
				org.ActiveApps = append(org.ActiveApps, app.ID)
				added = true
			}

			if added {
				err = shuffle.SetOrg(ctx, *org, org.Id)
				if err != nil {
					log.Printf("[WARNING] Failed setting org when autoadding apps on save: %s", err)
				} else {
					log.Printf("[INFO] Added public app %s (%s) to org %s (%s)", app.Name, app.ID, user.ActiveOrg.Name, user.ActiveOrg.Id)
					cacheKey := fmt.Sprintf("apps_%s", user.Id)
					shuffle.DeleteCache(ctx, cacheKey)
				}
			}
		}
	} else {
		log.Printf("[WARNING] User is trying to activate %s which is NOT public", app.Name)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false}`))
		return
	}

	log.Printf("[DEBUG] App %s (%s) activated for org %s by user %s", app.Name, app.ID, user.ActiveOrg.Id, user.Username)

	// If onprem, it should autobuild the container(s) from here

	resp.WriteHeader(200)
	resp.Write([]byte(`{"success": true}`))
}
