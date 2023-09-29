
docker build . -t shuffle-backend:v1

# Check if backend.tar exists and delete it if it does
if [ -f "/root/shuffle-k8s/image-temp/backend.tar" ]; then
    echo "backend.tar exists. Deleting..."
    rm -rf /root/shuffle-k8s/image-temp/backend.tar
fi

# Save the Docker image to a tar file
docker save shuffle-backend:v1 -o /root/shuffle-k8s/image-temp/backend.tar

ctr -n=k8s.io image import /root/shuffle-k8s/image-temp/backend.tar

#SSHPASS='redhat'
#sshpass -p $SSHPASS scp /root/shuffle-k8s/image-temp/backend.tar root@172.17.14.92:/root/temp-images
#
## Import the image using ctr
#sshpass -p $SSHPASS ssh root@172.17.14.92 "ctr -n=k8s.io image import /root/temp-images/backend.tar"
#
echo "Done!"
