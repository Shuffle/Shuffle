#curl http://192.168.3.6:5001/api/v1/files/create -H "Authorization: Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4" -d '{"filename": "file.txt", "org_id": "b199646b-16d2-456d-9fd6-b9972e929466", "workflow_id": "global"}'
#
#curl http://localhost:5001/api/v1/files/create -H "Authorization: Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4" -d '{"filename": "file.txt", "org_id": "b199646b-16d2-456d-9fd6-b9972e929466", "workflow_id": "global"}'
#
#echo
#curl http://localhost:5001/api/v1/apps/upload -H "Authorization: Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4" -F 'shuffle_file=@files.sh'
#
#curl http://localhost:5001/api/v1/files/1915981b-b897-4db1-8a2e-44bc34cead3b/content -H "Authorization: Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4" 
#curl http://localhost:5001/api/v1/files/e19cffe4-e2da-47e9-809e-904f5cb03687 -H "Authorization: Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4" 
#curl -XDELETE http://localhost:5001/api/v1/files/e19cffe4-e2da-47e9-809e-904f5cb03687 -H "Authorization: Bearer db0373c6-1083-4dec-a05d-3ba73f02ccd4" 

	#r.HandleFunc("/api/v1/files/{fileId}/content", handleGetFileContent).Methods("GET", "OPTIONS")
	#r.HandleFunc("/api/v1/files/create", handleCreateFile).Methods("POST", "OPTIONS")
	#r.HandleFunc("/api/v1/files/{fileId}/upload", handleUploadFile).Methods("POST", "OPTIONS")
	#r.HandleFunc("/api/v1/files/{fileId}", handleGetFileMeta).Methods("GET", "OPTIONS")
	#r.HandleFunc("/api/v1/files/{fileId}", handleDeleteFile).Methods("DELETE", "OPTIONS")


curl http://localhost:5001/api/v1/files/create -H "Authorization: Bearer 317f5066-395c-414d-aa3d-479cf27f47dd" -d '{"filename": "rule2.yar", "org_id": "292c7e25-40ad-4f05-904f-77d3c7b735e6", "workflow_id": "global", "namespace": "yara"}'
curl http://localhost:5001/api/v1/files/file_eb89e315-eb66-4d76-9df7-530fb003fc84/upload -H "Authorization: Bearer 317f5066-395c-414d-aa3d-479cf27f47dd" -F 'shuffle_file=@upload.sh'

#curl http://localhost:5001/api/v1/files/namespaces/yara -H "Authorization: Bearer c5b4c827-65ec-47f4-9e8a-234cdba38959" --output rules.zip
