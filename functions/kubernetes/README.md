# Shuffle in Kubernetes

1. Make sure you have a Kubernetes cluster available. MiniKube works for testing.
2. Install `helm install shuffle oci://ghcr.io/shuffle/charts/shuffle --namespace shuffle --create-namespace`
3. Tweak the configuration files if needed! This is not meant to be a one-size-fits-all

More details in the [kubernetes/Charts/Shuffle folder.](https://github.com/Shuffle/Shuffle/tree/main/functions/kubernetes/charts/shuffle#usage)

## Architecture
Here is the default architecture it follows, with the "Frontend" being the exposed container you interact with.

<img width="1006" height="1069" alt="image" src="https://github.com/user-attachments/assets/263369a1-6944-4ef5-8f19-14bc234130d8" />

## MiniKube
We don't support minikube yet. Please use GKE or another cloud based k8s engine to test out Shuffle.

## GKE testing
For testing on GKE, you can use the following command:

```bash
PROJECT_NAME="project"
CLUSTER_NAME="cluster"

# feel free to change the region and machine type
gcloud container clusters create "$CLUSTER_NAME" \
  --project "$PROJECT_NAME" \
  --region "asia-south2" \
  --release-channel "regular" \
  --machine-type "e2-standard-2" \
  --num-nodes "1" \
  --node-locations "asia-south2-b,asia-south2-a,asia-south2-c"

kubectl config set-context $CLUSTER_NAME

# apply shuffle k8s helm chart
helm install shuffle oci://ghcr.io/shuffle/charts/shuffle \
  --version 2.1.1 \
  --namespace shuffle \
  --create-namespace

# verify
kubectl get pods -n shuffle
```
