## How to deploy Shuffle on Kubernetes?

### Prerequisites:
-	Clone the https://github.com/dhaval055/shuffle repository using Git and change the branch to shuffle-k8s then navigate to the functions/kubernetes directory, which contains all the necessary Kubernetes configuration files for deployment.
-	Running Kubernetes cluster.
- Ensure you have a local Docker registry set up to store and manage Docker images for applications built with Shuffle. While the registry is crucial for handling custom-built apps, you’ll still be able to run workflows without it. To setup a docker registry, if you have docker installed on one of your node run following commands.
  ```
  openssl req -newkey rsa:4096 -nodes -sha256 -keyout certs/reg.key -x509 -days 365 -out certs/reg.crt -subj "/CN=<YOUR_NODE_LOCAL_IP>"
  docker run -d -p 5000:5000 --restart=always --name shuffle-local-registry \
  -v $(pwd)/certs:/certs \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/reg.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/reg.key \
  registry:2
  ```
  - If you've used the above commands to set up a registry, you'll need to skip an SSL verification for your registry. If you're using Containerd as a runtime
    add the following lines in /etc/containerd/config.toml
    ```
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."<REGISTRY_NODE_IP:PORT>"]
      endpoint = ["https://<REGISTRY_NODE_IP:PORT>"]

    [plugins."io.containerd.grpc.v1.cri".registry.configs."<REGISTRY_NODE_IP:PORT>".tls]
      insecure_skip_verify = true

    ```
Step 1: Create a namespace called shuffle in a cluster by running ```kubectl create ns shuffle```.  

Step 2: Open the shuffle-cm.yaml file and review the configuration values. Change the value of REGISTRY_URL with '<NODE_IP>:5000' where the registry is at. Adjust other variables as per your deployment requirements; otherwise, the application will deploy using the default settings provided within the file. Then apply the configmap with ‘kubectl apply -f shuffle-cm.yaml -n shuffle’.  

Step 3: Apply shuffle-role.yaml by using ```kubectl apply -f shuffle-role.yaml -n shuffle```.  

Step 4: Subsequently, establish the role bindings to associate the roles with the appropriate service accounts by applying the shuffle-rolebinding.yaml configuration using ```kubectl apply -f shuffle-rolebinding.yaml -n shuffle```.  

Step 5: Create storage-class for shuffle by running ```kubectl apply -f shuffle-sc.yaml -n shuffle```.  

Step 6: Apply the shuffle-opensearch.yaml configuration to create a Persistent Volume Claim (PVC) for storage, a Deployment to manage the OpenSearch pod, and a Service to expose OpenSearch within the cluster by using  ```kubectl apply -f shuffle-opensearch.yaml  -n shuffle```.

Step 7: Now deploy the backend using ```kubectl apply -f shuffle-backend.yaml -n shuffle```.

Step 8: Ensure that the Shuffle Backend is successfully deployed and running before proceeding with the frontend deployment, as the frontend may depend on services provided by the backend. ```kubectl apply -f shuffle-frontend.yaml -n shuffle```.

Step 9: Run ```kubectl apply -f shuffle-orborus.yaml -n shuffle```. This final step ensures that Shuffle Orborus is deployed, enabling the workflow executions in your Kubernetes-based Shuffle setup.

Now, open ```https://<YOUR_NODE_IP>:30008``` or ```http://<YOUR_NODE_IP>:30007```. You should be seeing a signup page. NODE_IP should be where the frontend is deployed.

