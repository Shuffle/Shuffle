# Fails cus of unmarshal
curl -XPOST http://localhost:5001/api/v1/workflows/1d9d8ce2-566e-4c3f-8a37-5d6c7d2000b5/schedule -d '{"name": "hey", "frequency": "*/1 * * * *", "execution_argument": "{\"test\": \"hey\"}"}' -H "Authorization: Bearer WUT"
