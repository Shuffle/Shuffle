# Get all workflows
curl localhost:5001/api/v1/workflows

# Get A workflow
#curl localhost:5001/api/v1/workflows/a5f82cfd-0f38-3474-20e2-f757f3718707

# NEW workflow
# curl -XPOST localhost:5001/api/v1/workflows -d '{"tags":[],"actions":[],"branches":[],"conditions":[{"label":"Condition","app_name":"Builtin","name":"Condition","conditional":"","id_":"18165f42-aab9-6c9a-0ef4-4e5a37a3b2ad","app_version":"1.0.0","position":{"x":224,"y":168}}],"workflow_variables":[],"name":"asd","start":"18165f42-aab9-6c9a-0ef4-4e5a37a3b2ad","id_":"3d14ca4a-67bd-8dfb-2673-2864f1ccf59c"}'

# Add a workflow
#curl localhost:5001/api/v1/workflows/a5f82cfd-0f38-3474-20e2-f757f3718707 -d '{"actions":[{"app_name":"hello_world","app_version":"1.0.0","errors":[],"id_":"2686a5d4-531d-158f-6b1a-0c1d23481304","is_valid":true,"label":"check_bool","name":"check_bool","parameters":[],"position":{"x":329.98133726556375,"y":160.01013778166904},"priority":3}],"branches":[{"destination_id":"6478ecae-b10e-88e9-e34d-9bbe6aff393d","id_":"5fd6a357-ae33-b1af-5dc2-0306efa28887","source_id":"2686a5d4-531d-158f-6b1a-0c1d23481304"},{"destination_id":"2686a5d4-531d-158f-6b1a-0c1d23481304","id_":"d46d0b05-5757-5084-c339-70ac63985781","source_id":"6478ecae-b10e-88e9-e34d-9bbe6aff393d"}],"conditions":[{"app_name":"Builtin","app_version":"1.0.0","conditional":"","errors":[],"id_":"6478ecae-b10e-88e9-e34d-9bbe6aff393d","is_valid":true,"label":"Condition","name":"Condition","position":{"x":320.97142988802364,"y":394.9753467582139}}],"description":"","errors":[],"id_":"a5f82cfd-0f38-3474-20e2-f757f3718707","is_valid":true,"name":"asd2","start":"2686a5d4-531d-158f-6b1a-0c1d23481304","tags":[],"transforms":[],"triggers":[],"workflow_variables":[]}'

# Execute a workflow
# curl -H "Content-Type: application/json" localhost:5001/api/v1/workflows/3d14ca4a-67bd-8dfb-2673-2864f1ccf59c/execute
#curl -X POST -H "Content-Type: application/json" localhost:5001/api/v1/workflows/3d14ca4a-67bd-8dfb-2673-2864f1ccf59c/execute -d '{"workflow_id": "3d14ca4a-67bd-8dfb-2673-2864f1ccf59c", "execution_id": "eaaa8d19-a761-12b8-cac2-f34eb50c3711"}'
