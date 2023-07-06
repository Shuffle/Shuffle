#curl -X POST -H "Content-Type: application/json" localhost:5001/api/v1/workflows/3d14ca4a-67bd-8dfb-2673-2864f1ccf59c/execute -d '{"workflow_id": "3d14ca4a-67bd-8dfb-2673-2864f1ccf59c", "execution_id": "eaaa8d19-a761-12b8-cac2-f34eb50c3711"}'

curl -X POST -H "Content-Type: application/json" https://shuffle-241517.appspot.com/api/v1/workflows/3d14ca4a-67bd-8dfb-2673-2864f1ccf59c/execute -d '{"workflow_id": "3d14ca4a-67bd-8dfb-2673-2864f1ccf59c", "execution_id": "eaaa8d19-a761-12b8-cac2-f34eb50c3711"}'

#curl -X POST http://localhost:5001/api/v1/workflows/streams -H "Content-Type: application/json" \
#	-d '{"execution_id": "eaaa8d19-a761-12b8-cac2-f34eb50c3711",
#        "result": "hello_result",
#        "started_at": 1562309342,
#		"authorization": "afcc298d-c6c2-4b0d-8221-1603b44d072d",
#        "status": "ABORTED",
#		"action": {
#			"app_name": "hi",
#			"app_version": "ho",
#			"id_": "this_is_an_id",
#			"label": "wut",
#			"name": "stream_testing",
#			"parameters": [],
#			"position": {
#				"x": 100,
#				"y": 100
#			},
#			"priority": 1
#		}}'
