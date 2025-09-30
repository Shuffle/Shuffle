## How to deploy Shuffle on Kubernetes?

1. Make sure you have a Kubernetes cluster available. MiniKube works for testing.
2. Install `helm install shuffle oci://ghcr.io/shuffle/charts/shuffle --namespace shuffle --create-namespace`
3. Tweak the configuration files if needed! This is not meant to be a one-size-fits-all

More details in the [kubernetes/Charts/Shuffle folder.](https://github.com/Shuffle/Shuffle/tree/main/functions/kubernetes/charts/shuffle#usage)
