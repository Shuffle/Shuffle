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
	"github.com/docker/docker/api/types/image"
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

	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"time"
	// "k8s.io/client-go/tools/clientcmd"
	// "k8s.io/client-go/util/homedir"
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
        defer client.Close()
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
		buildOptions.BuildArgs["HTTP_PROXY"] = &httpProxy
	}
	httpsProxy := os.Getenv("HTTPS_PROXY")
	if len(httpProxy) > 0 {
		buildOptions.BuildArgs["HTTPS_PROXY"] = &httpsProxy
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

func getK8sClient() (*kubernetes.Clientset, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("[ERROR] failed to get in-cluster config: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("[ERROR] failed to create Kubernetes client: %v", err)
	}

	return clientset, nil
}

func deleteJob(client *kubernetes.Clientset, jobName, namespace string) error {
	deletePolicy := metav1.DeletePropagationForeground
	return client.BatchV1().Jobs(namespace).Delete(context.TODO(), jobName, metav1.DeleteOptions{
		PropagationPolicy: &deletePolicy,
	})
}

func buildImage(tags []string, dockerfileLocation string) error {

	isKubernetes := false
	if os.Getenv("IS_KUBERNETES") == "true" {
		isKubernetes = true
	}

	if isKubernetes {
		// log.Printf("K8S ###################")
		// log.Print("dockerfileFolder: ", dockerfileFolder)
		// log.Print("tags: ", tags)
		// log.Print("only tag: ", tags[1])

		registryName := ""
		if len(os.Getenv("REGISTRY_URL")) > 0 {
			registryName = os.Getenv("REGISTRY_URL")
		}

		log.Printf("[INFO] registry name: %s", registryName)

		contextDir := filepath.Join("/app/", filepath.Dir(dockerfileLocation))
		log.Print("contextDir: ", contextDir)

		client, err := getK8sClient()
		if err != nil {
			fmt.Printf("Unable to authencticate : %v\n", err)
			return err
		}

		BackendPodLabel := "io.kompose.service=backend"

		backendPodList, podListErr := client.CoreV1().Pods("shuffle").List(context.TODO(), metav1.ListOptions{
			LabelSelector: BackendPodLabel,
		})

		if podListErr != nil || len(backendPodList.Items) == 0 {
			fmt.Println("Error getting backend pod or no pod found:", podListErr)
			return podListErr
		}

		backendNodeName := backendPodList.Items[0].Spec.NodeName
		log.Printf("[INFO] Backend running on: %s", backendNodeName)

		job := &batchv1.Job{
			ObjectMeta: metav1.ObjectMeta{
				Name: "shuffle-app-builder",
			},
			Spec: batchv1.JobSpec{
				Template: corev1.PodTemplateSpec{
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{
							{
								Name:  "kaniko",
								Image: "gcr.io/kaniko-project/executor:latest",
								Args: []string{
									"--verbosity=debug",
									"--dockerfile=Dockerfile",
									"--context=dir://" + contextDir,
									"--skip-tls-verify",
									"--destination=" + registryName + "/" + tags[1],
								},
								VolumeMounts: []corev1.VolumeMount{
									{
										Name:      "kaniko-workspace",
										MountPath: "/app/generated",
									},
								},
							},
						},
						NodeName:      backendNodeName,
						RestartPolicy: corev1.RestartPolicyNever,
						Volumes: []corev1.Volume{
							{
								Name: "kaniko-workspace",
								VolumeSource: corev1.VolumeSource{
									PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
										ClaimName: "backend-apps-claim",
									},
								},
							},
						},
					},
				},
			},
		}

		createdJob, err := client.BatchV1().Jobs("shuffle").Create(context.TODO(), job, metav1.CreateOptions{})
		if err != nil {
			log.Printf("Failed to start image builder job: %s", err)
			return err
		}

		timeout := time.After(5 * time.Minute)
		tick := time.Tick(5 * time.Second)

		for {
			select {
			case <-timeout:
				return fmt.Errorf("job didn't complete within the expected time")
			case <-tick:
				currentJob, err := client.BatchV1().Jobs("shuffle").Get(context.TODO(), createdJob.Name, metav1.GetOptions{})
				if err != nil {
					return fmt.Errorf("[ERROR] failed to fetch %s status: %v", createdJob.Name, err)
				}

				if currentJob.Status.Succeeded > 0 {
					log.Printf("[INFO] Job %s completed successfully!", createdJob.Name)
					log.Printf("[INFO] Cleaning up the job %s", createdJob.Name)
					err := deleteJob(client, createdJob.Name, "shuffle")
					if err != nil {
						return fmt.Errorf("[ERROR] failed deleting job %s with error: %s", createdJob.Name, err)
					}
					log.Println("Job deleted successfully!")
					return nil
				} else if currentJob.Status.Failed > 0 {
					log.Printf("[ERROR] %s job failed with error: %s", createdJob.Name, err)
					err := deleteJob(client, createdJob.Name, "shuffle")
					if err != nil {
						return fmt.Errorf("[ERROR] failed deleting job %s with error: %s", createdJob.Name, err)
					}
				}
			}
		}
	} else {

		ctx := context.Background()
		client, err := client.NewEnvClient()
                defer client.Close()
		if err != nil {
			log.Printf("Unable to create docker client: %s", err)
			return err
		}

		log.Printf("[INFO] Docker Tags: %s", tags)
		dockerfileSplit := strings.Split(dockerfileLocation, "/")

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
			buildOptions.BuildArgs["HTTP_PROXY"] = &httpProxy
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

	}
	return nil
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

	filteredImages := []image.Summary{}
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

// https://stackoverflow.com/questions/23935141/how-to-copy-docker-images-from-one-host-to-another-without-using-a-repository
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

	// This has to be done in a weird way because Datastore doesn't
	// support map[string]interface and similar (openapi3.Swagger)
	var version shuffle.DockerRequestCheck
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

	img := image.Summary{}
	tagFound := ""

	img2 := image.Summary{}
	tagFound2 := ""

	alternativeNameSplit := strings.Split(version.Name, "/")
	alternativeName := version.Name
	if len(alternativeNameSplit) == 3 {
		alternativeName = strings.Join(alternativeNameSplit[1:3], "/")
	}

	log.Printf("[INFO] Trying to download image: %s. Alt: %s", version.Name, alternativeName)

	for _, image := range images {
		for _, tag := range image.RepoTags {
			//log.Printf("[DEBUG] Tag: %s", tag)
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

	pullOptions := types.ImagePullOptions{}
	if len(img.ID) == 0 {
		_, err := dockercli.ImagePull(context.Background(), version.Name, pullOptions)
		if err == nil {
			tagFound = version.Name
			img.ID = version.Name
			img2.ID = version.Name

			dockercli.ImageTag(ctx, version.Name, alternativeName)
		}
	}

	if len(img2.ID) == 0 {
		_, err := dockercli.ImagePull(context.Background(), alternativeName, pullOptions)
		if err == nil {
			tagFound = alternativeName
			img.ID = alternativeName
			img2.ID = alternativeName

			dockercli.ImageTag(ctx, alternativeName, version.Name)
		}
	}

	// REBUILDS THE APP
	if len(img.ID) == 0 {
		if len(img2.ID) == 0 {
			workflowapps, err := shuffle.GetAllWorkflowApps(ctx, 0, 0)
			log.Printf("[INFO] Getting workflowapps for a rebuild. Got %d with err %#v", len(workflowapps), err)
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
					log.Printf("[DEBUG] Docker Looking for appname %s with version %s", imageName, imageVersion)

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
	log.Printf("[DEBUG] Downloading API from URL %s", url)
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

	httpClient := shuffle.GetExternalClient(url)
	newresp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("[ERROR] Failed running auto-download request for %s: %s", appId, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
		return
	}

	defer newresp.Body.Close()

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
			App 	string `json:"app"`
		}

		app := tmpapp{}
		err := json.Unmarshal(respBody, &app)
		if err != nil || app.Success == false || len(app.OpenAPI) == 0 {
			log.Printf("[ERROR] Failed app unmarshal during auto-download. Success: %#v. Applength: %d: %s", app.Success, len(app.OpenAPI), err)

			resp.WriteHeader(401)
			if len(app.App) > 0 {
				resp.Write([]byte(fmt.Sprintf(`{"success": false, "reason": "Not an OpenAPI app, but a Python app. Please download the app using the Remote Download system: https://shuffler.io/docs/apps#importing-remote-apps"}`)))
			} else {
				resp.Write([]byte(`{"success": false, "reason": "App doesn't exist"}`))
			}

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

	// Just making sure it's being built properly
	if app == nil {
		log.Printf("[WARNING] App is nil. This shouldn't happen. Starting remote download(3)")
		handleRemoteDownloadApp(resp, ctx, user, fileId)
		return
	}

	// Check the app.. hmm
	openApiApp, err := shuffle.GetOpenApiDatastore(ctx, app.ID)
	if err != nil {
		log.Printf("[WARNING] Error getting app %s (openapi config): %s", app.ID, err)
		resp.WriteHeader(401)
		resp.Write([]byte(`{"success": false, "reason": "Couldn't find app OpenAPI"}`))
		return
	}

	log.Printf("[INFO] User %s (%s) is activating %s. Public: %t, Shared: %t", user.Username, user.Id, app.Name, app.Public, app.Sharing)
	buildSwaggerApp(resp, []byte(openApiApp.Body), user, true)

	//app.Active = true
	//app.Generated = true
	//app, err := shuffle.SetApp(ctx, app)

	//resp.WriteHeader(200)
	//resp.Write([]byte(`{"success": true}`))
}
