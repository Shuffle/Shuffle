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
	Check as CheckIcon,
} from "@mui/icons-material"

import { toast } from "react-toastify";
import RunDetectionTest from '../components/RunDetectionTest.jsx';
import theme from '../theme.jsx';
import DetectionRuleCard from "../components/DetectionRuleCard.jsx";
import CollectIngestModal from "../components/CollectIngestModal.jsx";
import {
	green, 
	red, 
	grey,
} from "../views/AngularWorkflow.jsx"

import WorkflowValidationTimeline from "../components/WorkflowValidationTimeline.jsx"

const handleDirectoryChange = (folderDisabled, setFolderDisabled, globalUrl, isDetectionActive) => {
  //if (!isDetectionActive) {
  //  toast.warn("Connect first for global enable/disable to work");
  //  return;
  //}

  const action = folderDisabled ? "enable_folder" : "disable_folder";
  const url = `${globalUrl}/api/v1/detections/sigma/selected_rules/${action}`;

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
  const [availableDetection, setAvailableDetection] = React.useState([]);
  const [environmentList, setEnvironmentList] = React.useState([])
  const [showCollectIngestMenu, setShowCollectIngestMenu] = useState(false);
  const [workflows, setWorkflows] = React.useState([])
  const [apps, setApps] = React.useState([])
  const [pipelines, setPipelines] = React.useState([])

  const [ticketWebhook, setTicketWebhook] = React.useState("");
  const [detectionWorkflowId, setDetectionWorkflowId] = React.useState("");

  const handleGetAllTriggers = () => {
    fetch(globalUrl + "/api/v1/triggers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for getting all triggers");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        //setWebHooks(responseJson.webhooks || []);
        //setAllSchedules(responseJson.schedules || []);
        setPipelines(responseJson.pipelines || []);
        //setShowLoader(false);
      })
      .catch((error) => {
        // toast(error.toString());
      });
  };

  const getWorkflows = () => {
		const url = `${globalUrl}/api/v1/workflows`
		fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!");
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson?.success !== false) {
				setWorkflows(responseJson || []);

				for (var i = 0; i < responseJson?.length; i++) {
					if (responseJson[i].background_processing === true && responseJson[i].name.toLowerCase().includes("ingest tickets") && responseJson[i].triggers !== undefined) {

						for (var triggerkey in responseJson[i].triggers) {
							if (responseJson[i].triggers[triggerkey].trigger_type === "WEBHOOK") { 
								setDetectionWorkflowId(responseJson[i].id)
								setTicketWebhook(`${globalUrl}/api/v1/hooks/webhook_${responseJson[i].triggers[triggerkey].id}`)
								//setNewPipelineValue(`export | sigma /tmp/sigma_rules | to ${globalUrl}/api/v1/hooks/webhook_${responseJson[i].triggers[triggerkey].id}`)
								break;
							}
						}
					}
				}

			} else {
				toast.warn("Failed to load workflows. Please try again or contact support@shuffler if this persists.")
			}
		})
		.catch((error) => {
			toast(error.toString());
		});
	}

	const getApps = () => {
		const url = `${globalUrl}/api/v1/apps`
		fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!");
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson?.success === false) {
				toast.warn("Failed to load apps. Please try again or contact support@shuffler if this persists.")
			} else {
				setApps(responseJson)
			}
		})
		.catch((error) => {
			toast(error.toString());
		});
	}

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

	// NEW way to handle it
	setShowCollectIngestMenu(true)
	return

	if (detectionWorkflowId !== "") { 
		console.log("Already have a workflow ID for this detection")
		//toast.info(`Already have a detection workflow for ${detectionInfo?.category}`)
		// FIXME: Show the Usecase UI for how to fix the workflow(s)
		// Instead loading full workflow and showing it directly? Hmm
		//toast.warn("Please reload the UI to load the detection status")
		//return
	}

    if (isDetectionActive) {
		console.log("Already connected")
		//toast.info(`Connected to ${detectionInfo?.category}`)
		//return
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
		  	//setIsDetectionValid(responseJson.workflow_valid)
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
	getApps()
	getWorkflows()
  	loadUsecases() 
	loadEnvironments()
  
	handleGetAllTriggers() 
  }, [])

  useEffect(() => {
	  if (detectionInfo === undefined || detectionInfo === null) {
		  return
	  }

	  if (detectionInfo.category === undefined || detectionInfo.category === null || detectionInfo.category === "") {
		  return
	  }

	  console.log("Detection info: ", detectionInfo)
	  //handleConnectClick()
  }, [detectionInfo])

  const filteredRules = ruleInfo === "default" ? [] : ruleInfo?.filter((rule) =>
    rule?.file_name?.replaceAll(" ", "_")?.toLowerCase().includes(searchQuery) ||
    rule?.title?.replaceAll(" ", "_")?.toLowerCase().includes(searchQuery) ||
    rule?.description?.replaceAll(" ", "_")?.toLowerCase().includes(searchQuery)
  )

  const lakeNodes = environmentList !== undefined && environmentList !== null ? environmentList.filter((env) => env?.archived === false && env?.data_lake?.enabled === true).length : 0

  const submitPipeline = (pipeline, environment) => {
	var pipelineConfig = {
	  command: pipeline,
	  name: pipeline,
	  type: "create",
	  environment: "",

	  workflow_id: "",
	  trigger_id: "",
	  start_node: "",
	}

	if (environment !== undefined && environment !== "") {
		pipelineConfig.environment = environment
	}

    const url = `${globalUrl}/api/v1/triggers/pipeline`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(pipelineConfig),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success && pipelineConfig.type !== "delete") {
          toast.error("Failed to set pipeline: " + responseJson.reason);
        } else {
          if (pipelineConfig.type === "create") {
            toast.success("Pipeline will be created: " + responseJson.reason)
            //setPipelineModalOpen(false)

          } else if (pipelineConfig.type === "stop") {
             toast.success("Pipeline will be stopped: " + responseJson.reason)
             //setPipelineModalOpen(false)

          } else {
			  toast.info("Unknown pipeline type: " + pipelineConfig.type)
          }
		}
      })
      .catch((error) => {
        console.log("Get pipeline error: ", error.toString());
      });
  }

  return (
    <Container>

	  <CollectIngestModal 
	  	globalUrl={globalUrl}
	  	open={showCollectIngestMenu}
	  	setOpen={setShowCollectIngestMenu}

	  	workflows={workflows}
	  	getWorkflows={getWorkflows}

	  	apps={apps}
	  />

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
	  		{detectionInfo?.title} {filteredRules === undefined || filteredRules === null ? null : `(${filteredRules?.length} rule${filteredRules?.length > 1 ? "s" : ""})`}
          </Typography>

	  	  <div style={{display: "flex", }}>

		  {/*workflow !== undefined && workflow !== null && workflow.id !== undefined && workflow.id !== null && workflow.id.length > 0 ?
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

		  : */} 
	  		  <div style={{marginRight: 20, }}>
				  <RunDetectionTest 
					globalUrl={globalUrl}
					pipelines={pipelines}
					workflows={workflows}
					ticketWebhook={ticketWebhook}
					detectionWorkflowId={detectionWorkflowId}

					changePipelineState={undefined}
					submitPipelineWrapper={submitPipeline}
			  	/> 
	  		  </div>

			  <Button
				  variant={detectionWorkflowId === "" ? "contained" : "outlined"}
				  onClick={() => {
					  handleConnectClick()
				  }}
				  disabled={loading} // Disable the button while loading
				  style={{ 
					  // Red = workflow exists, validation is false
					  // Green = workflow exists, validation is true
					  // Grey = workflow does not exist
				  }}
			  >
				{loading ? 
					<CircularProgress size={24} /> 
					: 
					detectionWorkflowId !== "" ? 
						<span>
							<CheckIcon style={{color: green, marginRight: 10, top: 5, }} />
							Connected
						</span>
					:
					`Connect to ${detectionInfo?.category}` 
				}
			  </Button>

	  	  {/**/}

	      {detectionInfo?.category === "SIGMA" || detectionInfo?.category === "SIEM" ?
			  <Tooltip title={`You have ${lakeNodes} available Data Lake node(s)`}>
				<a href="/admin?tab=locations" style={{textDecoration: "none", color: "inherit", }} target="_blank" rel="noreferrer">
                	<FmdGoodIcon style={{marginLeft: 15, marginTop: 5, color: lakeNodes > 0 ? green : red}} />
				</a>
			  </Tooltip>
		  : null}
	  	  </div>
	  	
        </Box>
        {ruleInfo?.length > 0 ?
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
			  onChange={(e) => {
				  setSearchQuery(e?.target?.value?.replaceAll(" ", "_")?.toLowerCase())
			  }}
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
            minHeight: 500,
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

							ruleDetails={rule}
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
