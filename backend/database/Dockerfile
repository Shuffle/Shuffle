# 2. docker run -p 8000:8000 
FROM google/cloud-sdk 

EXPOSE 8000
CMD ["gcloud", "beta", "emulators", "datastore", "start", "--project=shuffle", "--host-port", "0.0.0.0:8000", "--data-dir=/etc/shuffle"]
