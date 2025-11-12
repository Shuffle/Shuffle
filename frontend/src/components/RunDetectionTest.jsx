import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import {
	Button,
	ButtonGroup,
	CircularProgress,
	Tooltip,
} from "@mui/material";

import {
	Check as CheckIcon,
	OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { green, yellow, red } from '../views/AngularWorkflow.jsx'

const RunDetectionTest = (props) => {
	const { 
		globalUrl, 
		pipelines, 
		workflows, 
		ticketWebhook, 
		detectionWorkflowId, 

		changePipelineState,
        submitPipelineWrapper,
	} = props

    const [executions, setExecutions] = React.useState([]);
    const [detectionTestRunning, setDetectionTestRunning] = React.useState(false);
    const [detectionTestExecutionId, setDetectionTestExecutionId] = React.useState("");

	useEffect(() => {
		if (detectionWorkflowId !== "") {
  			handleLoadExecutions(detectionWorkflowId)
		}
	}, [detectionWorkflowId])

	if (workflows === undefined || workflows === null || workflows.length === 0) {
		return null
	}

	const handleLoadExecutions = (workflowId, detectionTestRunning) => {
	  const url = `${globalUrl}/api/v2/workflows/${workflowId}/executions`

	  fetch(url, {
		method: "GET",
		headers: {
		  "Content-Type": "application/json",
		  Accept: "application/json",
		},
		  credentials: "include",
	  }).then((response) => {
		if (response.status !== 200) {
		  console.log("Status not 200 for getting all executions");
		}

		return response.json();
	  })
	  .then((responseJson) => {
		if (responseJson.success !== false && responseJson?.executions?.length > 0) {
			if (detectionTestRunning === true) {
				console.log("Checking executions in workflow: ", workflowId, responseJson.executions)
				for (var executionKey in responseJson.executions) {
					const curExec = responseJson.executions[executionKey]

					if (curExec.execution_id === detectionTestExecutionId) {
						continue
					}

					// started_at = unix timestamp
					// check within the last 60 seconds 
					const datecomparison = (Date.now() / 1000) - 60 
					if (curExec.started_at >= datecomparison) { 
						if (curExec?.execution_argument?.includes("rule") && curExec?.execution_argument?.includes("Test Notepad Event")) {
  	  						setDetectionTestRunning(false)
  							setDetectionTestExecutionId(curExec.execution_id)
						}

						break;
					}
				}
			} else {
				setExecutions(responseJson.executions || [])
			}
		}
	  })
	  .catch((error) => {
		  toast(error.toString());
	  })
  }

	const runDetectionTest = () => {
  	  setDetectionTestRunning(true)
	  if (ticketWebhook === "") {
    	  setDetectionTestRunning(false)
		  toast.error("No ticketing webhook found. Please enable the ticketing workflow first.")
		  return
	  }

	  if (detectionWorkflowId === "") {
    	  setDetectionTestRunning(false)
		  toast.error("No ticketing workflow found. Please enable the ticketing workflow first.")
		  return
	  }

	  if (haveDetectionPipelines().length === 0) {
    	  setDetectionTestRunning(false)
		  toast.error("No detection pipelines found. Please deploy the Syslog (TCP) & Sigma pipelines first.")
		  return 
	  }

	  // 1. Run a new pipeline which exits. 
	  const detectionTest = `from {message: "<165>1 2025-10-06T12:34:56.789Z myhost.example.com myapp 1234 ID47 [huh eventSource=\\\"App\\\" EventID=\\\"4688\\\" NewProcessName=\\\"notepad.exe\\\" Context=\\\"Testing\\\"] This is a test log message"} | this = message.parse_syslog() | import`

	  for (var pipelineKey in pipelines) {
		  const curPipeline = pipelines[pipelineKey]
		  if (curPipeline.definition === detectionTest && changePipelineState !== undefined) {
              changePipelineState(curPipeline, "stop");
		  }
	  }

	  // 1. Submit it to run
	  // 2. Check executions if they happened recently~
	  if (submitPipelineWrapper !== undefined) {

		//`Run a detection test with Sigma rules on your Tenzir Orborus instance. Requires: TCPC Syslog- & Sigma pipeline\n\nEnvironments: ${haveDetectionPipelines().join(", ")}`
		const validEnv = haveDetectionPipelines()
		for (var envKey in validEnv) {
			const envName = validEnv[envKey]
      		submitPipelineWrapper(detectionTest, envName)
		}

		//if (validEnv.length > 0) {
			//toast.success(`Submitted detection test pipeline to environment(s): ${validEnv.join(", ")}`)
		//}
	  }

	  for (var i = 0; i < 10; i++) {
		  setTimeout(() => {
  	  		handleLoadExecutions(detectionWorkflowId, true) 
		  }, i * 5000)
	  }

	  setTimeout(() => {
  	  	setDetectionTestRunning(false)
	  }, 60000)
  }

    const haveDetectionPipelines = () => {
		if (pipelines === undefined) {
			toast.warn("No pipelines found. Please create the Syslog (TCP) & Sigma pipelines first.")
			return []
		}

        var foundCorrect = []
        for (var pipelineKey in pipelines) {
      	  const curPipeline = pipelines[pipelineKey]
      	  //if (curPipeline?.definition?.includes("load_tcp") && curPipeline?.definition?.includes("import")) {
      	  //    foundCorrect += 1
      	  //}

      	  if (curPipeline?.definition?.includes("sigma") && curPipeline?.definition?.includes("export")) {
			  foundCorrect.push(curPipeline.environment)
      	  }
        }

        return foundCorrect
    }

	return ( 
		<div style={{display: "flex", }}>
			<ButtonGroup style={{minWidth: 150, maxWidth: 225,}}>
				  <Tooltip title={
					  `Run a detection test with Sigma rules on your Tenzir Orborus instance. Requires: TCPC Syslog- & Sigma pipeline\n\nEnvironments: ${haveDetectionPipelines().join(", ")}`
				  } style={{}} aria-label={"Run detection test"}>
	  				  <div>
						  <Button
							style={{minWidth: 150, maxWidth: 150,  minHeight: 40, maxHeight: 40, }}
							variant="outlined"
							color="secondary"
							disabled={haveDetectionPipelines().length === 0 || ticketWebhook === "" || detectionWorkflowId === "" || detectionTestRunning}
							onClick={() => {
								//setPipelineModalOpen(true)
								runDetectionTest()
							}}
						  >
							{
								detectionTestRunning === true ? <CircularProgress size={20} style={{marginRight: 10, }} /> : "Run Detection Test" 
							}
						  </Button>
	  				  </div>
				  </Tooltip>

				  {detectionTestRunning === false && detectionTestExecutionId !== "" && detectionTestExecutionId !== undefined ? 
					  <Tooltip title={`Go to detection test: ${detectionTestExecutionId}`} style={{}} aria-label={"Go to logs"}>
					  	<a href={`/workflows/${detectionWorkflowId}?execution_id=${detectionTestExecutionId}`} target="_blank" rel="noopener noreferrer">
						  <Button
							color="secondary"
							style={{
								minWidth: 75, maxWidth: 75,  
								minHeight: 40, maxHeight: 40, 
							}}
						  >
							<CheckIcon style={{color: green}}/> 
						  </Button>
						</a>
					  </Tooltip>
				  : null}
	  		  </ButtonGroup>

			  {window?.location?.href?.includes("/detections/") === true ? null :
				  <Tooltip title={"Open Detection Tab"} style={{}} aria-label={""}>
					<a href={`/detections/sigma`} target="_blank" rel="noopener noreferrer">
						<OpenInNewIcon 
							color="secondary"
							style={{
								marginLeft: 20, 
								top: 8, 
								position: 'relative',
							}} 
						/>
					</a>
				  </Tooltip>
			  }
	  		</div>
		)
}

export default RunDetectionTest
