## How to deploy Shuffle on Kubernetes?

### Prerequisites:
-	Clone the https://github.com/dhaval055/shuffle repository using Git and change the branch to shuffle-k8s then navigate to the functions/kubernetes directory, which contains all the necessary Kubernetes configuration files for deployment.
-	Running Kubernetes cluster.
- Run the following command for setting up Opensearch and Backend volumes.
- Ensure you have a local Docker registry set up to store and manage Docker images for applications built with Shuffle. While the registry is crucial for handling custom-built apps, you’ll still be able to run workflows without it. If you're using Minikube for testing, run commands in box below after running ```minikube ssh```.

```
cd /mnt
mkdir shuffle-data
cd shuffle-data
mkdir open-search
mkdir backend
sudo chown –R 1000:1000 open-search
```

Step 1: Create a namespace called shuffle in a cluster by running ```kubectl create ns shuffle```.  

Step 2: Open the shuffle-cm.yaml file and review the configuration values. Change the value of REGISTRY_URL with your registry URL. Adjust other variables as per your deployment requirements; otherwise, the application will deploy using the default settings provided within the file. Then apply the configmap with ‘kubectl apply –f shuffle-cm.yaml –n shuffle’.  

Step 3: Apply shuffle-role.yaml by using ```kubectl apply –f shuffle-role.yaml –n shuffle```.  

Step 4: Subsequently, establish the role bindings to associate the roles with the appropriate service accounts by applying the shuffle-rolebinding.yaml configuration using ```kubectl apply –f shuffle-rolebinding.yaml –n shuffle```.  

Step 5: Create storage-class for shuffle by running ```kubectl apply –f shuffle-sc.yaml –n shuffle```.  

Step 6: Apply the shuffle-opensearch.yaml configuration to create a Persistent Volume Claim (PVC) for storage, a Deployment to manage the OpenSearch pod, and a Service to expose OpenSearch within the cluster by using  ```kubectl apply –f shuffle-opensearch.yaml  –n shuffle```.

Step 7: Now deploy the backend using ```kubectl apply –f shuffle-backend.yaml  –n shuffle```.

Step 8: Ensure that the Shuffle Backend is successfully deployed and running before proceeding with the frontend deployment, as the frontend may depend on services provided by the backend. ```kubectl apply –f shuffle-frontend.yaml –n shuffle```.

Step 9: Run ```kubectl apply -f shuffle-orborus.yaml```. This final step ensures that Shuffle Orborus is deployed, enabling the workflow executions in your Kubernetes-based Shuffle setup.

Now, open ```https://<YOUR_NODE_IP>:30008``` or ```http://<YOUR_NODE_IP>:30007```. You should be seeing a signup page. NODE_IP should be where the frontend is deployed.


