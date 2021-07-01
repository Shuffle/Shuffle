curl -XPOST http://192.168.3.8:5001/api/v1/orgs/6a6a99f5-6630-4f91-88ff-571c9f030ea0/set_cache -H "Authorization: Bearer e663cf93-7f10-4560-bef0-303f14aad982" -d '{
	"workflow_id": "61825389-a125-43a5-9119-97c401e9934b",
	"execution_id": "2c8ca1b7-6658-4742-86a1-105c9467702d",
	"org_id": "6a6a99f5-6630-4f91-88ff-571c9f030ea0",
	"key": "test",
	"value": "THIS IS SOME DATA HELLO"
}'

curl -XPOST http://192.168.3.8:5001/api/v1/orgs/6a6a99f5-6630-4f91-88ff-571c9f030ea0/get_cache -H "Authorization: Bearer e663cf93-7f10-4560-bef0-303f14aad982" -d '{
	"workflow_id": "61825389-a125-43a5-9119-97c401e9934b",
	"execution_id": "2c8ca1b7-6658-4742-86a1-105c9467702d",
	"org_id": "6a6a99f5-6630-4f91-88ff-571c9f030ea0",
	"key": "test"
}'

