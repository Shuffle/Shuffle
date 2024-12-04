import React, { useState, useEffect, } from "react";
import {
  Container,
  Box,
  TextField,
  Switch,
  Typography,
  Button,
  CircularProgress, 
  Paper, 
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
	OpenInNew as OpenInNewIcon,
  	FmdGood as FmdGoodIcon,
} from "@mui/icons-material"

import { toast } from "react-toastify";
import theme from '../theme.jsx';
import DetectionRuleCard from "../components/DetectionRuleCard.jsx";
import {
	green, 
	red, 
	grey,
} from "../views/AngularWorkflow.jsx"

import WorkflowValidationTimeline from "../components/WorkflowValidationTimeline.jsx"

const handleDirectoryChange = (folderDisabled, setFolderDisabled, globalUrl, isDetectionActive) => {
  if (!isDetectionActive) {
    toast.warn("Connect to siem first for global enable/disable to work");
    return;
  }

  const action = folderDisabled ? "enable_folder" : "disable_folder";
  const url = `${globalUrl}/api/v1/detections/${action}`;

  fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) =>
      response.json().then((responseJson) => {
        if (responseJson["success"] === true) {
          if (action === "enable_folder") setFolderDisabled(false);
          else setFolderDisabled(true);
        } else {
          //toast(`failed to disable rule`);
        }
      })
    )
    .catch((error) => {
      console.log(`Error in ${action} the rule: `, error);
      toast(`An error occurred while ${action} the rule`);
    });
};

const DetectionExplorer = (props)  => {
  const { globalUrl, userdata, ruleInfo, folderDisabled, setFolderDisabled, detectionInfo, importDetectionFromUrl, rulesLoading, isDetectionActive, setIsDetectionActive, ruleMapping, setRuleMapping, } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [workflow, setWorkflow] = useState({})
  const [detectionWorkflowId, setDetectionWorkflowId] = useState("")
  const [isDetectionValid, setIsDetectionValid] = useState(false)
  const [availableDetection, setAvailableDetection] = React.useState([]);
  const [environmentList, setEnvironmentList] = React.useState([])

  const loadUsecases = () => {
	  const url = `${globalUrl}/api/v1/workflows/usecases`
	  fetch(url, {
		method: "GET",
		credentials: "include",
		headers: {
		  "Content-Type": "application/json",
		},
	  })
	  .then((response) =>
		response.json().then((responseJson) => {
		  if (responseJson.success === false) {
			  return
		  }

		  if (responseJson.length == 0) {
			  return
		  }

		  for (var usecaseCategory in responseJson) {
			  const category = responseJson[usecaseCategory]
			  if (!category.name.toLowerCase().includes("respond") && !category.name.toLowerCase().includes("response")) {
				  continue
			  }

		  	  setAvailableDetection(category.list)
			  break
		  }
		})
	  )
	  .catch((error) => {
		console.log(`Error in loading usecases: `, error);
		//toast(`An error occurred while loading usecases`);
	  })
  }

  const loadWorkflow = (workflowId) => {
	  const url = `${globalUrl}/api/v1/workflows/${workflowId}`
	  fetch(url, {
		method: "GET",
		credentials: "include",
		headers: {
		  "Content-Type": "application/json",
		},
	  })
	  .then((response) =>
		response.json().then((responseJson) => {
		  if (responseJson.id === workflowId) {
			setWorkflow(responseJson)
		  } else {
			toast(`Failed to load workflow ${workflowId}`);
		  }
	   }))
	   .catch((error) => {
		 console.log(`Error in loading workflow ${workflowId}: `, error);
		 toast(`An error occurred while loading workflow ${workflowId}`);
	   })
  }

  const handleConnectClick = () => {
	if (detectionWorkflowId !== "") { 
		// FIXME: Show the Usecase UI for how to fix the workflow(s)
		// Instead loading full workflow and showing it directly? Hmm
		//toast.warn("Please reload the UI to load the detection status")
		return
	}

    if (isDetectionActive) {
		return
	}

	if (detectionInfo.category === undefined || detectionInfo.category === null) {
		toast.warn("Detection category not found. Please try again or contact support@shuffler.io if you think this is a bug.")
		return
	}

    setLoading(true);
    const url = `${globalUrl}/api/v1/detections/${detectionInfo?.category}/connect`

    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
	.then((response) =>
	  response.json().then((responseJson) => {
		if (responseJson["success"] === true) {
		  setLoading(false)

	      if (setIsDetectionActive !== undefined) {
		  	setIsDetectionActive(true)
		  }

		  if (responseJson.workflow_id !== undefined && responseJson.workflow_id !== null) {
		  	setDetectionWorkflowId(responseJson.workflow_id)

			loadWorkflow(responseJson.workflow_id)
		  }

		  if (responseJson.workflow_valid !== undefined && responseJson.workflow_valid !== null) {
		  	setIsDetectionValid(responseJson.workflow_valid)
		  }
		} else {
		  if (responseJson.reason !== undefined && responseJson.reason !== null) {
			  toast(responseJson.reason)
		  } else {
			  if (responseJson.workflow_id === "" && responseJson.workflow_valid === false) {
		  	  	toast.info(`Sent job to generate a Detection Workflow and enable ${detectionInfo?.category}. Please wait a minute and reload this UI.`);
			  } else {
		  	  	toast.error(`Failed to connect to ${detectionInfo?.category}`);
			  }
		  }

		  if (responseJson.action !== undefined && responseJson.actio !== null && responseJson.action.length > 0) {
			  //if (responseJson.action === "environment_create") {
			  //	navigate("/admin?tab=environments")
			  //}
		  }

		  setLoading(false);
		}
	  })
	)
	.catch((error) => {
	  setLoading(false);
	  console.log(`Error in connecting to ${detectionInfo?.category}: `, error);
	  toast.error(`An error occurred while connecting to ${detectionInfo?.category}`);
	});
  }

  const loadEnvironments = () => {
	  const url = `${globalUrl}/api/v1/getenvironments`
	  fetch(url, {
		method: "GET",
		credentials: "include",
		headers: {
		  "Content-Type": "application/json",
		},
	  })
	  .then((response) => {
		  return response.json()
	  })
	  .then((responseJson) => {
		  if (responseJson.success === false) {
			  return
		  }

		  if (responseJson.length == 0) {
			  return
		  }

		  setEnvironmentList(responseJson)
	  })
	  .catch((error) => {
		console.log(`Error in loading environments: `, error);
	  })
  }

  useEffect(() => {
  	loadUsecases() 
	loadEnvironments()
  }, [])

  useEffect(() => {
	  if (detectionInfo === undefined || detectionInfo === null) {
		  return
	  }

	  if (detectionInfo.category === undefined || detectionInfo.category === null || detectionInfo.category === "") {
		  return
	  }

	  handleConnectClick()
  }, [detectionInfo])

  const filteredRules = ruleInfo === "default" ? [] : ruleInfo?.filter((rule) =>
    rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lakeNodes = environmentList !== undefined && environmentList !== null ? environmentList.filter((env) => env?.data_lake?.enabled === true).length : 0

  return (
    <Container>
      <Paper
	    style={{
		  marginTop: 50, 
	  	  width: "100%", 
		  padding: 50, 
	  	  backgroundColor: theme.palette.backgroundColor,
		  borderRadius: theme.palette?.borderRadius,
	    }}
	  >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
	  		{detectionInfo?.title} {filteredRules === undefined || filteredRules === null ? null : `(${filteredRules?.length} rules)`}
          </Typography>

	  	  <div style={{display: "flex", }}>
		  {workflow !== undefined && workflow !== null && workflow.id !== undefined && workflow.id !== null && workflow.id.length > 0 ?
			  <div style={{display: "flex", }}>
			  	  <div style={{minWidth: 400, maxWidth: 400, }}>
					  <WorkflowValidationTimeline 
						originalWorkflow={workflow}

						apps={[]}
						getParents={undefined}
						execution={undefined}

						workflow={workflow}

			  			showHoverColor={true}
			  			globalUrl={globalUrl}
			  			userdata={userdata}
					  />
			      </div>

			  	  <IconButton
			  		variant="contained"
			  		color="secondary"
			  		onClick={() => {
						window.open(`/workflows/${workflow.id}`, "_blank")
					}}
			  	  >
			  		<OpenInNewIcon />
			  	  </IconButton>
			  </div>

		  : 
			  <Button
				  variant="contained"
				  onClick={() => {
					  handleConnectClick()
				  }}
				  disabled={loading} // Disable the button while loading
				  style={{ 
					  // Red = workflow exists, validation is false
					  // Green = workflow exists, validation is true
					  // Grey = workflow does not exist
					  backgroundColor: detectionWorkflowId === "" ? grey : isDetectionValid ? green : red,
				  }}
			  >
				{loading ? <CircularProgress size={24} /> : 
					detectionWorkflowId === "" ? `Connect to ${detectionInfo?.category}` :
					isDetectionValid ? `Connected to ${detectionInfo?.category}` : `Fix ${detectionInfo?.category} connection`}
			  </Button>
		  }

	      {detectionInfo?.category === "SIGMA" || detectionInfo?.category === "SIEM" ?
			  <Tooltip title={`You have ${lakeNodes} available Data Lake node(s)`}>
				<a href="/admin?tab=environments" style={{textDecoration: "none", color: "inherit", }} target="_blank" rel="noreferrer">
                	<FmdGoodIcon style={{marginLeft: 15, marginTop: 5, color: lakeNodes > 0 ? green : red}} />
				</a>
			  </Tooltip>
		  : null}
	  	  </div>
	  	
        </Box>
        {filteredRules?.length > 0 ?
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
			  minHeight: 50, 
			  maxHeight: 50, 
            }}
          >
			<TextField
			  label="Search rules"
			  variant="outlined"
			  size="small"
			  sx={{ mr: 2 }}
			  value={searchQuery}
			  onChange={(e) => setSearchQuery(e.target.value)}
			/>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Global disable/enable
            </Typography>
            <Switch
              checked={!folderDisabled}
              onChange={() =>
                handleDirectoryChange(folderDisabled, setFolderDisabled, globalUrl, isDetectionActive)
              }
            />
          </Box>
        </Box>
		: null}
	  	<Divider />
        <Box
          sx={{
            height: "500px",
            width: "100%",
            overflowY: "auto",
            p: 1,
          }}
        >

          {filteredRules?.length > 0 ?

	  		  ruleMapping !== undefined && ruleMapping !== null && ruleMapping.value !== undefined && ruleMapping.value !== null ? 
				  filteredRules.map((rule, index) => {
					return (
					  <div style={{marginTop: 5, }}>
						  <DetectionRuleCard
							globalUrl={globalUrl}
							key={index}
							ruleName={rule.file_name}
							description={rule.description}

							file_id={rule.file_id}
							globalUrl={globalUrl}
							folderDisabled={folderDisabled}
							isDetectionActive={isDetectionActive}

							ruleMapping={ruleMapping}
							setRuleMapping={setRuleMapping}

							availableDetection={availableDetection}
							{...rule}
						  />
						</div>
					)
				  }) 
	  			: null 
			: 
			  <div style={{textAlign: "center", }}>
	  			  {rulesLoading === true ? 
					  <Container style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 25, }}>
						<div>
						  <CircularProgress />
						  <Typography variant="h6" style={{ marginTop: 20 }}>Downloading rules, please wait...</Typography>
						</div>
					  </Container>
					: 
					<div>
						<Typography variant="h6" color="textSecondary" style={{marginTop: 50, }}>
						  No rules loaded yet
						</Typography> 
						<Button
							style={{marginTop: 20, }}
							variant="contained"
							color="primary"
							onClick={() => {
								if (importDetectionFromUrl !== undefined) {
									importDetectionFromUrl(true, detectionInfo.download_repo)
								} else {
									toast("Import function not found. Please contact support@shuffler.io")
								}
							}}
						>
							Load Default Rules
						</Button>
					</div>
				  }
			  </div>
		  } 
        </Box>
      </Paper>
    </Container>
  );
};

export default DetectionExplorer;
