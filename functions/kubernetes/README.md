## How to deploy Shuffle on Kubernetes?

### Prerequisites:
-	Clone the https://github.com/shuffle/shuffle repository using Git then, navigate to the functions/kubernetes directory, which contains all the necessary Kubernetes configuration files for deployment.
-	[Running a Kubernetes cluster](https://kubernetes.io/docs/setup/). You can do that with either minikube or run the cluster locally.
- Ensure you have a local Docker registry set up to store and manage Docker images for applications built with Shuffle. While the registry is crucial for handling custom-built apps, you’ll still be able to run workflows without it. To setup a docker registry, if you have docker installed on one of your node run following commands.


  ```
  chmod +x generate_certs.sh
  ./setup_registry.sh
  ```

  > This will give you a NODE_IP which is you're local IP if you're not sure about what to use.
  
  > **Make sure that port 5000 is not exposed to the internet!**

- 8 GB RAM and 4 CPUs are recommended as **minimum configs** for running Shuffle on Kubernetes. K8s is a resource-intensive application, and you may experience performance issues if you run it on a machine with fewer resources.

- If you've used the above commands to set up a registry, you'll need to skip an SSL verification for your registry. If you're using Containerd as a runtime
    add the following lines in /etc/containerd/config.toml
    ```
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."<REGISTRY_NODE_IP:PORT>"]
      endpoint = ["https://<REGISTRY_NODE_IP:PORT>"]

    [plugins."io.containerd.grpc.v1.cri".registry.configs."<REGISTRY_NODE_IP:PORT>".tls]
      insecure_skip_verify = true
    ```

### Instructions
Step 1: Create a namespace called shuffle in a cluster by running ```kubectl create ns shuffle```.

Step 2: Open the ```all-in-one.yaml``` file and review the configuration values. Change the value of REGISTRY_URL with '<NODE_IP>:5000' where the registry is at. Adjust other variables as per your deployment requirements; otherwise, the application will deploy using the default settings provided within the file. Then apply the configmap and deploy with ```kubectl apply -f all-in-one.yaml -n shuffle```

Step 3: Now, open ```https://<YOUR_NODE_IP>:30008``` or ```http://<YOUR_NODE_IP>:30007```. You should be seeing a signup page. NODE_IP should be where the frontend is deployed.

### Dev Mode

1. Run backend and orborus with the environment variable `IS_KUBERNETES=true`:

```bash
export IS_KUBERNETES=true
```

2. Turn on the k8s engine with minikube:
  
```bash
minikube start
```

3. To use the worker scale feature, build the image with the following command:

```bash
$NAME=shuffle-worker-scale
$VERSION=1.2.0

minikube build . -t shuffle/shuffle:$NAME -t shuffle/shuffle:$NAME_$VERSION -t docker.pkg.github.com/shuffle/shuffle/$NAME:$VERSION -t ghcr.io/shuffle/$NAME:$VERSION -t ghcr.io/shuffle/$NAME:nightly -t ghcr.io/shuffle/$NAME:$VERSION -t ghcr.io/shuffle/$NAME:nightly -t ghcr.io/shuffle/$NAME:latest
```

4. To run executions, Make sure to do the following:

```bash
kubectl create role pod-creator --namespace=default --verb=create --resource=pods
kubectl create rolebinding pod-creator-binding --namespace=default --role=pod-creator --serviceaccount=default:default
```



