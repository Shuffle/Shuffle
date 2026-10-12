package main

import (
	"archive/tar"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/registry"
	dockerclient "github.com/docker/docker/client"
	shuffle "github.com/shuffle/shuffle-shared"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var imageManagerLock sync.Mutex
var imageManagerDocker *dockerclient.Client

const faultyAppSHA256 = "607c9de1de3172a73f8fa0deb4d349d2119a12df427d21f1852af4293dd09386"
const maxInspectedAppSize = 1024 * 1024

func imageManagerEnabled() bool {
	return isKubernetes == "true" && strings.EqualFold(os.Getenv("SHUFFLE_WORKER_IMAGE_MANAGER"), "true")
}

func privateRegistryImage(source string) (string, error) {
	localRegistry := strings.TrimSuffix(strings.TrimSpace(os.Getenv("SHUFFLE_STREAM_PRIVATE_REGISTRY")), "/")
	if localRegistry == "" {
		localRegistry = strings.TrimSuffix(strings.TrimSpace(os.Getenv("REGISTRY_URL")), "/")
	}

	localRegistry = strings.TrimPrefix(strings.TrimPrefix(localRegistry, "https://"), "http://")
	if localRegistry == "" || localRegistry == "docker.io" || localRegistry == "registry.hub.docker.com" || localRegistry == "index.docker.io" {
		return "", errors.New("Kubernetes image manager requires a private app registry")
	}

	source = strings.TrimSpace(source)
	if source == "" || len(source) > 512 || strings.Contains(source, "://") || strings.Contains(source, "..") || strings.ContainsAny(source, "\r\n") {
		return "", fmt.Errorf("invalid image reference %q", source)
	}

	source = strings.TrimPrefix(source, localRegistry+"/")
	for _, publicRegistry := range []string{"docker.io/", "registry.hub.docker.com/", "index.docker.io/"} {
		source = strings.TrimPrefix(source, publicRegistry)
	}
	if !strings.Contains(source, "/") {
		source = "frikky/shuffle:" + source
	}

	return localRegistry + "/" + source, nil
}

func registryAuth(target string) (string, error) {
	host := strings.SplitN(target, "/", 2)[0]
	return registry.EncodeAuthConfig(registry.AuthConfig{
		Username:      os.Getenv("SHUFFLE_REGISTRY_USERNAME"),
		Password:      os.Getenv("SHUFFLE_REGISTRY_PASSWORD"),
		IdentityToken: os.Getenv("SHUFFLE_REGISTRY_IDENTITY_TOKEN"),
		ServerAddress: host,
	})
}

func dockerPushError(stream io.Reader) error {
	decoder := json.NewDecoder(stream)
	for {
		var message struct {
			Error       string `json:"error"`
			ErrorDetail struct {
				Message string `json:"message"`
			} `json:"errorDetail"`
		}

		if err := decoder.Decode(&message); err != nil {
			if errors.Is(err, io.EOF) {
				return nil
			}
			return fmt.Errorf("decode Docker push response: %w", err)
		}

		if message.ErrorDetail.Message != "" {
			return errors.New(message.ErrorDetail.Message)
		}
		if message.Error != "" {
			return errors.New(message.Error)
		}
	}
}

func dockerLoadReference(stream io.Reader) (string, error) {
	decoder := json.NewDecoder(stream)
	loadedReference := ""
	for {
		var message struct {
			Stream      string `json:"stream"`
			Error       string `json:"error"`
			ErrorDetail struct {
				Message string `json:"message"`
			} `json:"errorDetail"`
		}

		if err := decoder.Decode(&message); err != nil {
			if errors.Is(err, io.EOF) {
				return loadedReference, nil
			}
			return "", fmt.Errorf("decode Docker load response: %w", err)
		}
		if message.ErrorDetail.Message != "" {
			return "", errors.New(message.ErrorDetail.Message)
		}
		if message.Error != "" {
			return "", errors.New(message.Error)
		}

		line := strings.TrimSpace(message.Stream)
		for _, prefix := range []string{"Loaded image: ", "Loaded image ID: "} {
			if strings.HasPrefix(line, prefix) {
				loadedReference = strings.TrimSpace(strings.TrimPrefix(line, prefix))
			}
		}
	}
}

func appFileSHA256(archive io.Reader) (string, error) {
	reader := tar.NewReader(archive)
	for {
		header, err := reader.Next()
		if errors.Is(err, io.EOF) {
			return "", nil
		}
		if err != nil {
			return "", err
		}
		if path.Base(header.Name) != "app.py" || (header.Typeflag != tar.TypeReg && header.Typeflag != tar.TypeRegA) {
			continue
		}
		if header.Size > maxInspectedAppSize {
			return "", nil
		}
		hash := sha256.New()
		if _, err := io.Copy(hash, reader); err != nil {
			return "", err
		}
		return hex.EncodeToString(hash.Sum(nil)), nil
	}
}

func inspectAppFileSHA256(ctx context.Context, client *dockerclient.Client, imageID string) (hash string, err error) {
	created, err := client.ContainerCreate(ctx, &container.Config{Image: imageID}, nil, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("create inspection container: %w", err)
	}
	defer func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if removeErr := client.ContainerRemove(cleanupCtx, created.ID, container.RemoveOptions{Force: true}); removeErr != nil {
			log.Printf("[ERROR] Failed removing image inspection container %s: %s", created.ID, removeErr)
			err = fmt.Errorf("remove inspection container %s: %w", created.ID, removeErr)
		}
	}()

	archive, _, err := client.CopyFromContainer(ctx, created.ID, "/app/app.py")
	if dockerclient.IsErrNotFound(err) {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("copy app.py from image %s: %w", imageID, err)
	}
	defer archive.Close()
	return appFileSHA256(archive)
}

func reportFaultyImage(ctx context.Context, source, authorization, executionID string) error {
	if authorization == "" {
		return errors.New("report authorization is missing")
	}
	body, err := json.Marshal(struct {
		Image       string `json:"image"`
		SHA256      string `json:"sha256"`
		ExecutionID string `json:"execution_id"`
	}{source, faultyAppSHA256, executionID})
	if err != nil {
		return err
	}
	endpoint := strings.TrimSuffix(baseUrl, "/") + "/api/v1/report_faulty_app_image"
	client := &http.Client{Timeout: 10 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error {
		return http.ErrUseLastResponse
	}}
	for attempt := 0; attempt < 2; attempt++ {
		request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
		if err != nil {
			return err
		}
		request.Header.Set("Authorization", "Bearer "+authorization)
		request.Header.Set("Content-Type", "application/json")
		response, err := client.Do(request)
		if err == nil {
			responseBody, readErr := io.ReadAll(io.LimitReader(response.Body, 1024))
			response.Body.Close()
			if readErr != nil {
				return readErr
			}
			if response.StatusCode == http.StatusOK {
				return nil
			}
			err = fmt.Errorf("cloud report returned %s: %s", response.Status, strings.TrimSpace(string(responseBody)))
			if response.StatusCode < 500 {
				return err
			}
		}
		if attempt == 1 {
			return err
		}
	}
	return errors.New("cloud report failed")
}

func imageManagerDockerClient(ctx context.Context) (*dockerclient.Client, error) {
	if imageManagerDocker != nil {
		if _, err := imageManagerDocker.Info(ctx); err == nil {
			return imageManagerDocker, nil
		}
	}

	deadline := time.Now().Add(60 * time.Second)
	var lastErr error
	for {
		client, apiVersion, err := shuffle.GetDockerClient()
		if err == nil {
			imageManagerDocker = client
			dockerApiVersion = apiVersion
			return client, nil
		}

		lastErr = err
		if time.Now().After(deadline) {
			return nil, fmt.Errorf("Docker image manager did not become ready: %w", lastErr)
		}

		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(time.Second):
		}
	}
}

func downloadAndLoadCloudImage(ctx context.Context, client *dockerclient.Client, source, authorization, orgID, executionID string) error {
	endpoint, err := url.Parse(strings.TrimSuffix(baseUrl, "/") + "/api/v1/get_docker_image")
	if err != nil {
		return fmt.Errorf("build cloud image URL: %w", err)
	}
	query := endpoint.Query()
	query.Set("image", strings.ReplaceAll(source, " ", "-"))
	query.Set("arch", runtime.GOARCH)
	endpoint.RawQuery = query.Encode()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return fmt.Errorf("build cloud image request: %w", err)
	}
	if authorization != "" {
		request.Header.Set("Authorization", "Bearer "+authorization)
	}
	if orgID != "" {
		request.Header.Set("Org-Id", orgID)
	}

	cloudClient := &http.Client{
		Timeout: imagedownloadTimeout,
		CheckRedirect: func(next *http.Request, previous []*http.Request) error {
			if len(previous) >= 10 {
				return errors.New("too many image download redirects")
			}
			if len(previous) > 0 && !strings.EqualFold(next.URL.Host, previous[0].URL.Host) {
				next.Header.Del("Authorization")
				next.Header.Del("Org-Id")
			}
			return nil
		},
	}
	response, err := cloudClient.Do(request)
	if err != nil {
		return fmt.Errorf("download %s: %w", source, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 1024*1024))
		return fmt.Errorf("download %s returned %s: %s", source, response.Status, strings.TrimSpace(string(body)))
	}

	existingImages := map[string]bool{}
	if images, listErr := client.ImageList(ctx, image.ListOptions{All: true}); listErr == nil {
		for _, current := range images {
			existingImages[current.ID] = true
		}
	} else {
		log.Printf("[WARNING] Failed listing Docker images before loading %s: %s", source, listErr)
	}

	loadResponse, err := client.ImageLoad(ctx, response.Body)
	if err != nil {
		return fmt.Errorf("load %s: %w", source, err)
	}
	defer loadResponse.Body.Close()
	loadedReference, err := dockerLoadReference(loadResponse.Body)
	if err != nil {
		return fmt.Errorf("load %s: %w", source, err)
	}

	loadedID := ""
	if loadedReference != "" {
		loaded, _, inspectErr := client.ImageInspectWithRaw(ctx, loadedReference)
		if inspectErr != nil {
			return fmt.Errorf("inspect loaded image %s: %w", loadedReference, inspectErr)
		}
		loadedID = loaded.ID
	} else {
		images, listErr := client.ImageList(ctx, image.ListOptions{All: true})
		if listErr != nil {
			return fmt.Errorf("find loaded image for %s: %w", source, listErr)
		}
		for _, current := range images {
			if !existingImages[current.ID] {
				if loadedID != "" {
					return fmt.Errorf("Docker loaded multiple images without identifying %s", source)
				}
				loadedID = current.ID
			}
		}
	}
	if loadedID == "" {
		return fmt.Errorf("Docker loaded the archive but did not identify image %s", source)
	}

	hash, err := inspectAppFileSHA256(ctx, client, loadedID)
	if hash == faultyAppSHA256 {
		reportErr := reportFaultyImage(ctx, source, authorization, executionID)
		if reportErr != nil {
			return fmt.Errorf("refusing known faulty image %s (support report failed: %w)", source, reportErr)
		}
		return fmt.Errorf("refusing known faulty image %s; support was notified", source)
	}
	if err != nil {
		return fmt.Errorf("inspect loaded image %s: %w", source, err)
	}
	if hash == "" {
		log.Printf("[WARNING] Image %s has no inspectable /app/app.py (missing or over 1 MiB); known faulty app fingerprint was not checked", source)
	}
	if err := client.ImageTag(ctx, loadedID, source); err != nil {
		return fmt.Errorf("tag loaded image %s as %s: %w", loadedID, source, err)
	}
	return nil
}

func pushImageToPrivateRegistry(ctx context.Context, source string) (string, error) {
	client, err := imageManagerDockerClient(ctx)
	if err != nil {
		return "", err
	}

	target, err := privateRegistryImage(source)
	if err != nil {
		return "", err
	}

	if _, _, err := client.ImageInspectWithRaw(ctx, source); err != nil {
		return "", fmt.Errorf("inspect downloaded image %s: %w", source, err)
	}
	if err := client.ImageTag(ctx, source, target); err != nil {
		return "", fmt.Errorf("tag %s as %s: %w", source, target, err)
	}

	auth, err := registryAuth(target)
	if err != nil {
		return "", fmt.Errorf("encode registry authentication: %w", err)
	}

	stream, err := client.ImagePush(ctx, target, image.PushOptions{RegistryAuth: auth})
	if err != nil {
		return "", fmt.Errorf("push %s: %w", target, err)
	}
	defer stream.Close()
	if err := dockerPushError(stream); err != nil {
		return "", fmt.Errorf("push %s: %w", target, err)
	}

	distribution, err := client.DistributionInspect(ctx, target, auth)
	if err != nil {
		return "", fmt.Errorf("verify pushed image %s: %w", target, err)
	}
	log.Printf("[INFO] Verified hybrid image %s with digest %s", target, distribution.Descriptor.Digest)

	return target, nil
}

func registryImageExists(ctx context.Context, source string) (bool, error) {
	client, err := imageManagerDockerClient(ctx)
	if err != nil {
		return false, err
	}
	target, err := privateRegistryImage(source)
	if err != nil {
		return false, err
	}
	auth, err := registryAuth(target)
	if err != nil {
		return false, err
	}
	_, err = client.DistributionInspect(ctx, target, auth)
	if err != nil {
		if dockerclient.IsErrNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func ensureImage(ctx context.Context, source, authorization, orgID, executionID string, force bool) error {
	imageManagerLock.Lock()
	defer imageManagerLock.Unlock()

	if !imageManagerEnabled() {
		return errors.New("Kubernetes worker image manager is not enabled")
	}
	if _, err := privateRegistryImage(source); err != nil {
		return err
	}

	if !force {
		exists, err := registryImageExists(ctx, source)
		if err == nil && exists {
			log.Printf("[DEBUG] Hybrid image %s already exists in the private registry", source)
			target, _ := privateRegistryImage(source)
			if err := restartKubernetesAppsUsingImage(ctx, target); err != nil {
				return fmt.Errorf("restart apps using %s: %w", target, err)
			}
			return nil
		}
		if err != nil {
			log.Printf("[WARNING] Failed checking private registry for %s; refreshing it: %s", source, err)
		}
	}

	client, err := imageManagerDockerClient(ctx)
	if err != nil {
		return err
	}
	if err := downloadAndLoadCloudImage(ctx, client, source, authorization, orgID, executionID); err != nil {
		return fmt.Errorf("download and load %s: %w", source, err)
	}

	target, err := pushImageToPrivateRegistry(ctx, source)
	if err != nil {
		return err
	}

	if err := restartKubernetesAppsUsingImage(ctx, target); err != nil {
		return fmt.Errorf("image %s was pushed but app deployments were not restarted: %w", target, err)
	}
	return nil
}

func restartKubernetesAppsUsingImage(ctx context.Context, target string) error {
	clientset, _, err := shuffle.GetKubernetesClient()
	if err != nil {
		return err
	}

	deployments, err := clientset.AppsV1().Deployments(kubernetesNamespace).List(ctx, metav1.ListOptions{
		LabelSelector: "app.kubernetes.io/name=shuffle-app",
	})
	if err != nil {
		return err
	}

	for _, deployment := range deployments.Items {
		matched := false
		for index := range deployment.Spec.Template.Spec.Containers {
			container := &deployment.Spec.Template.Spec.Containers[index]
			if container.Image == target {
				container.ImagePullPolicy = "Always"
				matched = true
			}
		}
		if !matched {
			continue
		}

		if deployment.Spec.Template.Annotations == nil {
			deployment.Spec.Template.Annotations = map[string]string{}
		}
		deployment.Spec.Template.Annotations["shuffle.sh/image-refreshed-at"] = time.Now().UTC().Format(time.RFC3339Nano)
		if _, err := clientset.AppsV1().Deployments(kubernetesNamespace).Update(ctx, &deployment, metav1.UpdateOptions{}); err != nil {
			return fmt.Errorf("restart deployment %s: %w", deployment.Name, err)
		}
	}
	return nil
}
