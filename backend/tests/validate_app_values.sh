# ExecutionOrg MUST be executing.
curl -XPOST http://localhost:5001/api/v1/orgs/b199646b-16d2-456d-9fd6-b9972e929466/validate_app_values -d '{
	"append": true,
	"workflow_check": true,
	"authorization": "1aae630c-ccaf-4cb5-87f9-8a9e0a9afd11",
	"execution_ref": "c59ff288-4f02-4d02-b839-133d55c7fdf0",
	"org_id": "b199646b-16d2-456d-9fd6-b9972e929466",
	"values": [{
		"app": "testing",
		"action": "repeat_back_to_me",
		"parameternames": ["call"],
		"parametervalues": ["hey", "ho", "lets", "go"]
	}]
}'
