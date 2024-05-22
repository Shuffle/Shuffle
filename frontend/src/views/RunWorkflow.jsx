/* eslint-disable react/no-multi-comp */
import React, {useState, useEffect} from 'react';
import ReactDOM from "react-dom"

import { useInterval } from "react-powerhooks";
import { makeStyles } from '@mui/material/styles';
import { useNavigate, Link, useParams } from "react-router-dom";
import {isMobile} from "react-device-detect";
import theme from '../theme.jsx';
import { validateJson, GetIconInfo } from "./Workflows.jsx";
import { green, yellow } from "./AngularWorkflow.jsx";

import {
  Tooltip,
	IconButton,
	CircularProgress, 
	TextField, 
	Button, 
	ButtonGroup, 
	Paper, 
	Typography,
	Divider,
} from '@mui/material';

import {
  Preview as PreviewIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';

const hrefStyle = {
	color: "white", 
	textDecoration: "none"
}

const bodyDivStyle = {
	margin: "auto",
	marginTop: 100,
	width: isMobile? "100%":"500px",
	position: "relative", 
}


const RunWorkflow = (defaultprops) => {
  const { globalUrl, isLoaded, isLoggedIn, setIsLoggedIn, setCookie, register, serverside } = defaultprops;

	let navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [workflow, setWorkflow] = React.useState({});
  const [executionRequest, setExecutionRequest] = React.useState({});
  const [executionArgument, setExecutionArgument] = useState("");
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionData, setExecutionData] = React.useState({});
  const [executionRunning, setExecutionRunning] = useState(false);
  const [workflowQuestion, setWorkflowQuestion] = useState("");
  const [selectedOrganization, setSelectedOrganization] = React.useState(undefined);
  const [apps, setApps] = React.useState([]);
  const [buttonClicked, setButtonClicked] = React.useState("");

	const boxStyle = {
		color: "white",
		paddingLeft: "30px",
		paddingRight: "30px",
		paddingBottom: "30px",
		paddingTop: "30px",
		backgroundColor: theme.palette.surfaceColor,
		marginBottom: 150, 
	}

    const params = useParams();
    var props = JSON.parse(JSON.stringify(defaultprops))
    props.match = {}
    props.match.params = params

	const defaultTitle = "Run Workflow"
	if (document != undefined && document.title != defaultTitle) {
		document.title = defaultTitle
	}

	const parsedsearch = serverside === true ? "" : window.location.search
	if (serverside !== true) {
		const tmpMessage = new URLSearchParams(window.location.search).get("message")
		if (tmpMessage !== undefined && tmpMessage !== null && message !== tmpMessage) {
			setMessage(tmpMessage)
		}
	}

  // Used to swap from login to register. True = login, false = register

	// Error messages etc
	const [executionInfo, setExecutionInfo] = useState("");

	const handleValidateForm = (executionArgument) => {
		return true
	}


	const getApps = () => {
    fetch(globalUrl + "/api/v1/apps", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for apps :O!");
			}

			return response.json();
		})
		.then((responseJson) => {
			setApps(responseJson)
		})
		.catch(error => {
			console.log("App error: ", error);
		})
	}

	const ShowExecutionResults = (props) => {
		const { executionData } = props;

		if (executionData === undefined || executionData === null || executionData === {}) {
			return null
		}

		const executionMargin = 20 
		const defaultReturn = null
		/*
			<div style={{marginTop: executionMargin, }}>
				<Typography variant="h6" style={{color: theme.palette.primaryColor}}>
					No results yet
				</Typography>
			</div>
		*/

		if (executionData.results === undefined || executionData.results === null)  {
			return defaultReturn
		}

		return (
			<div style={{marginTop: executionMargin, }}>
				{/*executionData !== undefined && executionData !== null && executionData !== {} && executionData.status !== undefined && (answer === undefined || answer === null) ? 
					<div style={{ marginBottom: 5, display: "flex" }}>
						<Typography variant="body1">
							<b>Status&nbsp;</b>
						</Typography>
						<Typography variant="body1" color="textSecondary" style={{ marginRight: 15, }}>
							{executionData.status}
						</Typography>
					</div>
				: null*/}

				{/*
				<Typography variant="h6" style={{color: theme.palette.primaryColor}}>
					Results: {executionData.results.length}/{executionData.workflow.actions.length}
				</Typography>
				*/}

				{executionData.result !== undefined && executionData.result !== null && executionData.result.length > 0 ?
					<Typography variant="h6">
						{executionData.result}
					</Typography> 
				: null}

				{/*executionData.results.map((data, index) => {
					if (executionData.results.length !== 1 && (data.status === "SKIPPED")) {
						return null;
					}

					// FIXME: The latter replace doens't really work if ' is used in a string
					var showResult = data.result.trim();
					const validate = validateJson(showResult);

					const curapp = apps.find((a) => a.name === data.action.app_name && a.app_version === data.action.app_version);
					const imgsize = 50;
					const statusColor = data.status === "FINISHED" || data.status === "SUCCESS" ? green : data.status === "ABORTED" || data.status === "FAILURE" ? "red" : yellow;

					var imgSrc = curapp === undefined ? "" : curapp.large_image;
					if (
						imgSrc.length === 0 &&
						workflow.actions !== undefined &&
						workflow.actions !== null
					) {
						// Look for the node in the workflow
						const action = workflow.actions.find(
							(action) => action.id === data.action.id
						);
						if (action !== undefined && action !== null) {
							imgSrc = action.large_image;
						}
					}

					var actionimg =
						curapp === null ? null : (
							<img
								alt={data.action.app_name}
								src={imgSrc}
								style={{
									marginRight: 20,
									width: imgsize,
									height: imgsize,
									border: `2px solid ${statusColor}`,
									borderRadius:
										executionData.start === data.action.id ? 25 : 5,
								}}
							/>
						);

					if (data.action.app_name === "shuffle-subflow") {
						//const parsedImage = triggers[2].large_image;
						//actionimg = (
						//	<img
						//		alt={"Shuffle Subflow"}
						//		src={parsedImage}
						//		style={{
						//			marginRight: 20,
						//			width: imgsize,
						//			height: imgsize,
						//			border: `2px solid ${statusColor}`,
						//			borderRadius:
						//				executionData.start === data.action.id ? 25 : 5,
						//		}}
						//	/>
						//);
					} else if (data.action.app_name === "User Input") {
						//actionimg = (
						//	<img
						//		alt={"Shuffle Subflow"}
						//		src={triggers[3].large_image}
						//		style={{
						//			marginRight: 20,
						//			width: imgsize,
						//			height: imgsize,
						//			border: `2px solid ${statusColor}`,
						//			borderRadius:
						//				executionData.start === data.action.id ? 25 : 5,
						//		}}
						//	/>
						//);
					}

					if (validate.valid && typeof validate.result === "string") {
						validate.result = JSON.parse(validate.result);
					}

					if (validate.valid && typeof validate.result === "object") {
						if (
							validate.result.result !== undefined &&
							validate.result.result !== null
						) {
							try {
								validate.result.result = JSON.parse(validate.result.result);
							} catch (e) {
								//console.log("ERROR PARSING: ", e)
							}
						}
					}


					var similarActionsView = null
					if (data.similar_actions !== undefined && data.similar_actions !== null) {
						var minimumMatch = 85
						var matching_executions = []
						if (data.similar_actions !== undefined && data.similar_actions !== null) {
							for (let [k,kval] in Object.entries(data.similar_actions)){
								if (data.similar_actions.hasOwnProperty(k)) {
									if (data.similar_actions[k].similarity > minimumMatch) {
										matching_executions.push(data.similar_actions[k].execution_id)
									}
								}
							}
						}

						if (matching_executions.length !== 0) {
							var parsed_url = matching_executions.join(",")

							similarActionsView =
								<Tooltip
									color="primary"
									title="See executions with similar results (not identical)"
									placement="top"
									style={{ zIndex: 50000, marginLeft: 50, }}
								>
									<IconButton
										style={{
											marginTop: "auto",
											marginBottom: "auto",
											height: 30,
											paddingLeft: 0,
											width: 30,
										}}
										onClick={() => {
											//navigate(`?execution_highlight=${parsed_url}`)
										}}
									>
										<PreviewIcon style={{ color: "rgba(255,255,255,0.5)" }} />
									</IconButton>
									</Tooltip>
							}
						}

					return (
						<div
							key={index}
							style={{
								marginBottom: 20,
								border:
									data.action.sub_action === true
										? "1px solid rgba(255,255,255,0.3)"
										: "1px solid rgba(255,255,255, 0.3)",
								borderRadius: theme.palette.borderRadius,
								backgroundColor: theme.palette.inputColor,
								padding: "15px 10px 10px 10px",
								overflow: "hidden",
							}}
							onMouseOver={() => {
							}}
							onMouseOut={() => {
							}}
						>
							<div style={{ marginBottom: 5, display: "flex" }}>
								<Typography variant="body1">
									<b>Status&nbsp;</b>
								</Typography>
								<Typography variant="body1" color="textSecondary" style={{ marginRight: 15, }}>
									{data.status}
								</Typography>
							</div>
						</div>
					)
				})*/}
			</div>
		)
	}

	const onSubmit = (event, execution_id, authorization, answer) => {
		if (event !== null) {
			event.preventDefault()
		}

		stop()
  	    setMessage("")
  	    setExecutionLoading(true)
		setExecutionData({})
		setExecutionInfo("")

		var data = {
			"execution_argument": executionArgument,
			"execution_source": "questions",
		}

		if (workflow.input_questions !== undefined && workflow.input_questions !== null && workflow.input_questions.length > 0) {
			try {
				data["execution_argument"] = JSON.stringify(executionArgument)
			} catch (e) {
				console.log("Error parsing execution argument: ", e)
			}
		}

		if (workflow.start !== undefined && workflow.start !== null && workflow.start.length > 0) {
			//data.start = workflow.start
	 	} else {
			/*
			if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
				for (let actionkey in workflow.actions) {
        			if (workflow.actions[actionkey].isStartNode) {
						data.start = workflow.actions[actionkey].id
						break
					}
				}
			}
			*/
		}

		var url = `${globalUrl}/api/v1/workflows/${props.match.params.key}/execute`
		var fetchBody = {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
			mode: 'cors',
			credentials: 'include',
			crossDomain: true,
			withCredentials: true,
		}

		if (answer !== undefined && execution_id !== undefined && authorization !== undefined) {
			url += `?reference_execution=${execution_id}&authorization=${authorization}&answer=${answer}`
			data = {}
			fetchBody.method = "GET"
		} else {
			fetchBody.method = "POST"
			fetchBody.body = JSON.stringify(data)
		}

		console.log("Pre request: ", url, fetchBody)
		fetch(url, fetchBody)
		.then((response) => {
			if (response.status !== 200 && response.status !== 201) {

				if (answer !== undefined && execution_id !== undefined && authorization !== undefined) {
					setExecutionLoading(false)
					setExecutionRunning(true);
					setExecutionRequest({
						"execution_id": execution_id,
						"authorization": authorization,
					})

					start();
					return
				}
			}

			return response.json();
		})
		.then(responseJson => {
			setExecutionLoading(false)
			if (responseJson["success"] === false) {
				console.log("Failed sending execution request")
			} else {
				console.log("Started execution")

				if (answer !== undefined && answer !== null) {
					console.log("Skipping start")
				} else {
					setExecutionRunning(true);
					setExecutionRequest(responseJson)
					start();
				}
			}
		})
		.catch(error => {
			//setExecutionInfo("Error in workflow startup: " + error)
			setExecutionLoading(false)
		})
	}

	const getWorkflow = (workflow_id) => {
		fetch(globalUrl + "/api/v1/workflows/" + workflow_id, {
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
        }

        return response.json();
      })
      .then((responseJson) => {
        // Not sure why this is necessary.
        if (responseJson.isValid === undefined) {
          responseJson.isValid = true;
        }

        if (responseJson.errors === undefined) {
          responseJson.errors = [];
        }

        if (responseJson.actions === undefined || responseJson.actions === null) {
          responseJson.actions = [];
        }

        if (responseJson.triggers === undefined || responseJson.triggers === null) {
          responseJson.triggers = [];
        }

		if (responseJson.input_questions !== undefined && responseJson.input_questions !== null && responseJson.input_questions.length > 0) {
			var newexec = {}
			for (let questionkey in responseJson.input_questions) {
				const question = responseJson.input_questions[questionkey]
				newexec[question.value] = ""
			}

			setExecutionArgument(newexec)
		}

		handleGetOrg(responseJson.org_id)
		setWorkflow(responseJson);
      })
      .catch((error) => {
        console.log("Get workflow error: ", error.toString());
      });
  };

  const { start, stop } = useInterval({
    duration: 3000,
    startImmediate: true,
    callback: () => {
      fetchUpdates(executionRequest.execution_id, executionRequest.authorization)
    },
  });

  const handleUpdateResults = (responseJson, executionRequest) => {
		if (responseJson === undefined || responseJson === null || responseJson.success === false) {
			return
		}

		//console.log("Got response: ", responseJson)

		ReactDOM.unstable_batchedUpdates(() => {
		  if (JSON.stringify(responseJson) !== JSON.stringify(executionData)) {
			// FIXME: If another is selected, don't edit..
			// Doesn't work because this is some async garbage
			if (executionData.execution_id === undefined || (responseJson.execution_id === executionData.execution_id && responseJson.results !== undefined && responseJson.results !== null)) {
			  if (executionData.status !== responseJson.status || executionData.result !== responseJson.result || (executionData.results !== undefined && responseJson.results !== null && executionData.results.length !== responseJson.results.length)) {

				if (responseJson.result !== undefined && responseJson.result !== null && responseJson.result.length > 0) {
					if (responseJson.result.startsWith("[") && responseJson.result.endsWith("]")) { 
						try {
							responseJson.result = JSON.parse(responseJson.result).length
							console.log("Set length to: ", responseJson.result)
						} catch (e) {
							console.log("Error parsing length: ", e)
						}
					}
				}

				//console.log("Updating data!")
				setExecutionData(responseJson)

				for (var key in responseJson.results) {
					if (responseJson.results[key].status === "WAITING") {
						console.log("Found: ", responseJson.results[key])
			
						const validate = validateJson(responseJson.results[key].result)
						console.log("Validate: ", validate)
						if (validate.valid && typeof validate.result === "string") {
							validate.result = JSON.parse(validate.result)
						} 

						console.log("Newresult: ", validate.result)
						if (validate.result["information"] !== undefined && validate.result["information"] !== null) {
							setWorkflowQuestion(validate.result["information"])
						}

						break
					}
				}
          } else {
            console.log("NOT updating executiondata state.");
          }
        }
      }

      if (responseJson.status === "ABORTED" || responseJson.status === "STOPPED" || responseJson.status === "FAILURE" || responseJson.status === "WAITING") {
        stop();

        if (executionRunning) {
          setExecutionRunning(false);
        }

        //getWorkflowExecution(props.match.params.key, "");
      } else if (responseJson.status === "FINISHED") {
        setExecutionRunning(false)
        stop();
        //getWorkflowExecution(props.match.params.key, "");
      }
		})
	}

	const handleGetOrg = (orgId, execution_id, authorization) => {
    if (orgId.length === 0) {
      return;
    }

    // Just use this one?
    var url = execution_id !== undefined && authorization !== undefined ?  `${globalUrl}/api/v1/orgs/${orgId}?reference_execution=${execution_id}&authorization=${authorization}` : `${globalUrl}/api/v1/orgs/${orgId}`;
    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 401) {
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson["success"] === false) {
        } else {
          if (responseJson.sync_features === undefined || responseJson.sync_features === null) {
          }

		  if (document != undefined && document.title != defaultTitle) {
		  	document.title = responseJson.name + " - " + defaultTitle
		  }
          setSelectedOrganization(responseJson)
        }
      })
      .catch((error) => {
        console.log("Error getting org: ", error);
      });
  };

	const fetchUpdates = (execution_id, authorization, getorg) => {
		if (execution_id === undefined || execution_id === null || execution_id === "") {
			stop()
			return
		}

		const innerRequest = {
			"execution_id": execution_id,
			"authorization": authorization
		}

		if (executionRequest.execution_id !== innerRequest.execution_id) {
			setExecutionRequest(innerRequest)
		}

		if (execution_id === "" || authorization === "") {
  		setExecutionLoading(false)
			setExecutionRunning(false)
			stop()
			return
		}

    fetch(globalUrl + "/api/v1/streams/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(innerRequest),
      credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!");
			}
		
			return response.json();
		})
		.then((responseJson) => {
			if (getorg === true) {
				handleGetOrg(responseJson.org_id, execution_id, authorization)
			}

			handleUpdateResults(responseJson, executionRequest);
		})
		.catch((error) => {
			console.log("Execution result Error: ", error);
		});
  };

	const answer = new URLSearchParams(window.location.search).get("answer")
	const execution_id = new URLSearchParams(window.location.search).get("reference_execution")
	const authorization = new URLSearchParams(window.location.search).get("authorization")
	useEffect(() => {
		getWorkflow(props.match.params.key) 
		if (execution_id !== undefined && execution_id !== null && authorization !== undefined && authorization !== null) {
			console.log("Get execution: ", execution_id)
			fetchUpdates(execution_id, authorization, true)
		}

		if (answer !== undefined && answer !== null) {
			console.log("Got answer: ", answer)
		}
	}, [])



	const buttonBackground = "linear-gradient(to right, #f86a3e, #f34079)"
	const buttonStyle = {borderRadius: 25, height: 50, fontSize: 18, backgroundImage: handleValidateForm(executionArgument) || executionLoading ? buttonBackground : "grey", color: "white"}
	
	//console.log("execdata: ", executionData)
	const disabledButtons = message.length > 0 || executionData.status === "FINISHED" || executionData.status === "ABORTED"

	const organization = selectedOrganization !== undefined && selectedOrganization !== null ? selectedOrganization.name : "Unknown"
	const contact = selectedOrganization !== undefined && selectedOrganization !== null && selectedOrganization.org !== undefined && selectedOrganization.org !== null? selectedOrganization.org : "support@shuffler.io"
	//const contact = selectedOrganization !== undefined && selectedOrganization !== null && selectedOrganization.contact !== undefined && selectedOrganization.contact !== null? selectedOrganization.contact : "support@shuffler.io"
	
	const image = selectedOrganization !== undefined && selectedOrganization !== null && selectedOrganization.image !== undefined && selectedOrganization.image !== null && selectedOrganization.image !== "" ? selectedOrganization.image : theme.palette.defaultImage

	//console.log("IMG: ", image, "ORG: ", selectedOrganization)

	if (!disabledButtons && answer !== undefined && answer !== null && organization !== "Unknown" && buttonClicked.length === 0) {
		console.log("Finding button!")
		// Find the button
		var buttonid = ""
		if (answer === "false") {
			buttonid = "abort_execution"
		} else if (answer === "true") {
			buttonid = "continue_execution"
		}

		if (buttonid !== "") {
			const foundButton = document.getElementById(buttonid)
			console.log("Button: ", foundButton)
			if (foundButton !== undefined && foundButton !== null) {
				foundButton.click()
			}
		}
	}

	const basedata = 
		<div style={bodyDivStyle}>
			<Paper style={boxStyle}>
      			<form onSubmit={(e) => {onSubmit(e)}} style={{margin: "15px 15px 15px 15px"}}>
		
					<img
						alt={workflow.name}
						src={image}
						style={{
							marginRight: 20,
							width: 100,
							height: 100,
							border: `2px solid ${green}`,
							borderRadius: 50,
							position: "absolute",
							top: -50,
							left: 200,
						}}
					/>

					<Typography variant="h6" style={{marginBottom: 10, marginTop: 50, textAlign: "center", }}>
						{organization}
					</Typography>
					<Typography variant="body1" color="textSecondary" style={{marginBottom: 15, marginTop: 0, textAlign: "center",}}>
						{contact}
					</Typography>
					<Divider style={{marginTop: 20, marginBottom: 20, }}/>
  				<Typography color="textSecondary">{message}</Typography>

					{answer !== undefined && answer !== null ? null :
						<Typography variant="h6" style={{marginBottom: 15, }}><b>{workflow.name}</b></Typography>
					}

					{workflowQuestion.length > 0 ?
						<Typography variant="body1"  style={{ marginBottom: 35, marginTop: 30, marginRight: 15, textAlign: "center", whiteSpace: "pre-line", }}>
							{workflowQuestion}
						</Typography>
					: null}
					
					{workflow.input_questions !== undefined && workflow.input_questions !== null && workflow.input_questions.length > 0 ?
						<div style={{marginBottom: 5, }}>
							{workflow.input_questions.map((question, index) => {

								return (
									<div style={{marginBottom: 5}}>
										{question.name}
										<TextField
											color="primary"
											style={{backgroundColor: theme.palette.inputColor, marginTop: 5, }}
											multiLine
											maxRows={2}
											InputProps={{
												style:{
													height: "50px", 
													color: "white",
													fontSize: "1em",
												},
											}}
											fullWidth={true}
											placeholder=""
											id="emailfield"
											margin="normal"
											variant="outlined"
											onChange={(e) => {
												//setExecutionArgument(e.target.value)	
												executionArgument[question.value] = e.target.value
											}}
										/>
									</div>
								)
							})}
						</div>
					: 
					answer !== undefined && answer !== null ? null :
						<span>
							Runtime Argument
							<div style={{marginBottom: 5}}>
								<TextField
									color="primary"
									style={{backgroundColor: theme.palette.inputColor, marginTop: 5, }}
									multiLine
									maxRows={2}
									InputProps={{
										style:{
											height: "50px", 
											color: "white",
											fontSize: "1em",
										},
									}}
									fullWidth={true}
									placeholder=""
									id="emailfield"
									margin="normal"
									variant="outlined"
									onChange={(e) => {
										setExecutionArgument(e.target.value)	
									}}
								/>
							</div>
						</span>
					}

					{executionRunning ?
						<span style={{width: 50, height: 50, margin: "auto", alignItems: "center", justifyContent: "center", textAlign: "center", }}>
							<CircularProgress style={{marginTop: 20, marginBottom: 20, marginLeft: 185, }}/>

							{executionData.status !== undefined && executionData.status !== null && executionData.status !== "" ?
								<Typography variant="body2" style={{margin: "auto", marginTop: 20, marginBottom: 20, textAlign: "center", alignItem: "center", }} color="textSecondary">
									Status: {executionData.status}
								</Typography>
							: null}
						</span>
						
						:
						answer !== undefined && answer !== null ? 
							<span style={{marginTop: 20, }}>
								<Typography variant="body1" style={{textAlign: "center", marginTop: 30, marginBottom: 20, }}>
									{disabledButtons ? "Already answered. Nothing to do." : ""}
								</Typography>
								{disabledButtons ? null :
									<Typography variant="body2" color="textSecondary" style={{textAlign: "center", marginTop: 10, }}>
										What do you want to do?
									</Typography>
								}
								<div fullWidth style={{width: "100%", marginTop: 10, marginBottom: 10, display: "flex", }}>
									<Button fullWidth id="continue_execution" variant="contained" disabled={disabledButtons} color="primary" style={{border: answer === "true" ? "2px solid rgba(255,255,255,0.6)" : null, flex: 1,}} onClick={() => {
										onSubmit(null, execution_id, authorization, true) 

										setButtonClicked("FINISHED")
										setExecutionData({
											status: "FINISHED",
										})
									}}>Continue</Button>
									<Typography variant="body1" style={{marginLeft: 3, marginRight: 3, marginTop: 3, }}>
										&nbsp;or&nbsp;
									</Typography>
									<Button fullWidth id="abort_execution" variant="contained" color="primary" disabled={disabledButtons} style={{border: answer !== "true" ? "2px solid rgba(255,255,255,0.6)" : null, flex: 1, }} onClick={() => {
										onSubmit(null, execution_id, authorization, false) 

										setButtonClicked("ABORTED")
										setExecutionData({
											status: "ABORTED",
										})
									}}>Stop</Button>
								</div>
							</span>
						:
						<div style={{display: "flex", marginTop: "15px"}}>
							<Button variant="contained" type="submit" color="primary" fullWidth disabled={!handleValidateForm(executionArgument) || executionLoading}>
								{executionLoading ? 
									<CircularProgress color="secondary" style={{color: "white",}} /> : "Run Workflow"}
							</Button> 				
						</div>
					}

  				{buttonClicked !== undefined && buttonClicked !== null && buttonClicked !== "finished" && buttonClicked.length > 0 ?
						<img id="finalize_gif" src="/images/finalize.gif" alt="finalize workflow animation" style={{width: 150, marginLeft: 125, borderRadius: theme.palette.borderRadius, }}
							onLoad={() => {
								console.log("Img loaded.")
								setTimeout(() => {
									console.log("Img closing.")
									setButtonClicked("finished")

								}, 1250)

							}}
						/>
					: null}

					<div style={{marginTop: "10px"}}>
						{executionInfo}
					</div>
	
					{answer !== undefined && answer !== null ? null :
						<ShowExecutionResults executionData={executionData} />
					}
				</form>
			</Paper>
		</div>

	const loadedCheck = isLoaded ? 
		<div>
      		{basedata}
		</div>
		:
		<div>
		</div>

	return (
		<div>
			{loadedCheck}
		</div>
	)
}

export default RunWorkflow;
