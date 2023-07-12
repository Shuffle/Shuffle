curl http://localhost:5001/api/v1/users/register -H "Authorization: Bearer 36a3eb38-0070-41c6-b20a-2a3e0941d10e" -d '{"username": "username1", "password": ""}'

echo
curl http://localhost:5001/api/v1/users -H "Authorization: Bearer 36a3eb38-0070-41c6-b20a-2a3e0941d10e" 

echo UPDATE
curl -XPUT http://localhost:5001/api/v1/users/updateuser -H "Authorization: Bearer 36a3eb38-0070-41c6-b20a-2a3e0941d10e" -d '{"user_id": "id", "role": "admin"}'

echo 
curl -XDELETE http://localhost:5001/api/v1/users/userid -H "Authorization: Bearer 36a3eb38-0070-41c6-b20a-2a3e0941d10e" 

echo
curl -XPOST http://localhost:5001/api/v1/users/generateapikey -H "Authorization: Bearer 36a3eb38-0070-41c6-b20a-2a3e0941d10e" -d '{"user_id": "390efa79-73a3-454b-8b1d-38f56eec14ad"}'
