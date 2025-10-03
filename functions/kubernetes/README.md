# Shuffle in Kubernetes

1. Make sure you have a Kubernetes cluster available. MiniKube works for testing.
2. Install `helm install shuffle oci://ghcr.io/shuffle/charts/shuffle --namespace shuffle --create-namespace`
3. Tweak the configuration files if needed! This is not meant to be a one-size-fits-all

More details in the [kubernetes/Charts/Shuffle folder.](https://github.com/Shuffle/Shuffle/tree/main/functions/kubernetes/charts/shuffle#usage)

## Architecture
Here is the default architecture it follows, with the "Frontend" being the exposed container you interact with.

<img width="1006" height="1069" alt="image" src="https://github.com/user-attachments/assets/263369a1-6944-4ef5-8f19-14bc234130d8" />
