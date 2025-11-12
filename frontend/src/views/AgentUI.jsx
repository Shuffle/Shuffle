import React, { useState, useEffect, useContext, memo } from "react";
import { Context } from "../context/ContextApi.jsx";
import AuthenticationModal from "../components/AuthenticationModal.jsx";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getTheme } from "../theme.jsx";
import { toast } from "react-toastify"
import ReactJson from "react-json-view-ssr";
import { v4 as uuidv4} from "uuid";
import { validateJson, collapseField, handleReactJsonClipboard, HandleJsonCopy } from "../views/Workflows2.jsx";
import AppSearch from "../components/Appsearch.jsx";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Paragraph, Blockquote, CodeHandler, Img, OuterLink, } from "../views/Docs.jsx";

import {
	Box,
	Button,
	ButtonGroup,
	Typography,
	Chip,
	CircularProgress,
	Tooltip,
	IconButton,
	TextField,
	Popover,
	Divider,
} from '@mui/material'

import {
	CheckCircle as CheckCircleIcon,
	Check as CheckIcon,
	HourglassDisabled as HourglassDisabledIcon,
	RestartAlt as RestartAltIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Send as SendIcon,
	Error as ErrorIcon,
	Close as CloseIcon,
	OpenInNew as OpenInNewIcon,
	Refresh as RefreshIcon,
	Add as AddIcon,
	Warning as WarningIcon,
} from '@mui/icons-material'

import { 
	green,
	yellow,
	red,
} from '../views/AngularWorkflow.jsx'

const AgentUI = (props) => {
  	const { globalUrl, isLoggedIn, isLoaded, userdata, } = props
	const [buttonState, setButtonState] = useState("timeline")
	const [execution, setExecution] = useState(null)
	const [agentActionResult, setAgentActionResult] = useState(null)
	const [agentRequestLoading, setAgentRequestLoading] = useState(false)
	const [data, setData] = useState({})
	const [openIndexes, setOpenIndexes] = useState([])
	const [disableButtons, setDisableButtons] = useState(false)
	const [apps, setApps] = useState([])
	const [appAuth, setAppAuth] = useState([])

	const [showAgentStarter, setShowAgentStarter] = useState(false)
	const [actionInput, setActionInput] = useState("")
	const [questionAnswers, setQuestionAnswers] = useState({})

    const [newSelectedApp, setNewSelectedApp] = React.useState({})
	const [appPickerAnchor, setAppPickerAnchor] = React.useState(null)
	const [chosenApps, setChosenApps] = useState([])


	useEffect(() => {
		if (newSelectedApp.objectID === undefined || newSelectedApp.objectID === null || newSelectedApp.objectID === "") {
			return
		}

		setNewSelectedApp({})
		setAppPickerAnchor(null)
		if (chosenApps.findIndex((app) => app.id === newSelectedApp.objectID) !== -1) {
		} else {
			setChosenApps(chosenApps.concat([{
				name: newSelectedApp.name,
				id: newSelectedApp.objectID,
				image: newSelectedApp.image_url,
			}]))
		}
	}, [newSelectedApp])

    const {themeMode} = useContext(Context)
  	const theme = getTheme(themeMode)
    const navigate = useNavigate();

	if (document !== undefined && document !== null && !document?.title?.includes("Agent")) {
    	document.title = "Shuffle AI Agents"
	}

	const agentWrapperStyle = {
		width: 1000,
		height: 1000, 
		margin: "auto",
		paddingTop: 100, 
		paddingBottom: 1000, 
		backgroundColor: theme.palette.backgroundColor,
	}

	if (data.input === undefined || data.input === null) {
		data.input = ""
	} else {
		const verifiedInput = validateJson(data.input)
		if (verifiedInput.valid === true) {
			data.input = JSON.stringify(verifiedInput.result, null, 2)
		}
	}


  const Heading = (props) => {
    const element = React.createElement(
      `h${props.level}`,
      { style: { marginTop: 40 } },
      props.children
    );

    return (
      <Typography>
        {props.level !== 1 ? (
          <Divider
            style={{
              width: "90%",
              marginTop: 40,
              backgroundColor: theme.palette.inputColor,
            }}
          />
        ) : null}
        {element}
      </Typography>
    );
  }

    const markdownComponents = {
        img: Img,
        code: CodeHandler,
        h1: Heading,
        h2: Heading,
        h3: Heading,
        h4: Heading,
        h5: Heading,
        h6: Heading,
        a:  OuterLink,
        p:  Paragraph,
        blockquote: Blockquote,
    }

	const findNodeData = (execution_data, node_id) => {
		if (execution_data === undefined || execution_data === null) {
			return
		}

		if (node_id === undefined || node_id === null || node_id === "") {
			// Look for AI agent
			/*
			for (var key in execution_data.results) {
				const item = execution_data.results[key]
				if (item?.action?.app_name !== "AI Agent") {
					continue
				}

				node_id = item?.action?.id
				break
			}
			*/

			if (node_id === undefined || node_id === null || node_id === "") {
				return
			}
		}

		var found = false
		for (var key in execution_data.results) {
			const item = execution_data.results[key]
			if (item?.action?.id !== node_id) {
				continue
			}

			setAgentActionResult(item)

			found = true
			const validate = validateJson(item.result)
			if (validate.valid) {
				setData(validate.result)
			} else {
				toast.warn("Action output result is not valid JSON!")
			}

			break
		}

		if (found === false) {
			toast.warn("Failed to find the relevant AI Agent result")

			if (execution_data?.results?.length === 1) {
				setAgentActionResult(execution_data.results[0])
				const validatedData = validateJson(execution_data.results[0].result)
				if (validatedData.valid) {
					setData(validatedData.result)
				} else {
					toast.warn("Action output result is not valid JSON!")
				}
			}
		}
	}

	const GetExecution = (execution_id, node_id, authorization) => {
		if (execution_id === undefined || execution_id === null) {
			toast.error("No execution ID provided. Please provide execution_id in the URL.")
			return 
		}

		//if (node_id === undefined || node_id === null || node_id === "") {
		//	toast.error("No node ID provided. Please provide node_id in the URL.")
		//	return
		//}

		if (authorization === undefined || authorization === null) {
			toast.error("No authorization provided. Please provide authorization in the URL.")
			return
		}

		const headers = {}
		const executionRequest = {
			"execution_id": execution_id,
			"authorization": authorization,
		}

		const url = `${globalUrl}/api/v1/streams/results`
		fetch(url, {
		  method: "POST",
		  headers: headers,
		  body: JSON.stringify(executionRequest),
		  credentials: "include",
		  cors: "no-cors",
		})
		.then((response) => {
			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.success !== false) {
				if (responseJson.status === "EXECUTING") {
					// Recursively looking for updates until it's not executing anymore
            		//setTimeout(() => {
					//	GetExecution(execution_id, node_id, authorization)
					//}, 3000)
				} else {
					setDisableButtons(false)
				}

				try {
					if (JSON.stringify(responseJson) !== JSON.stringify(execution)) {
						setExecution(responseJson)
					}
				} catch(e) {
					console.log("Error comparing executions: ", e)
					setExecution(responseJson)
				}

				findNodeData(responseJson, node_id)
			} else {
				setDisableButtons(false)
				if (responseJson.reason === undefined || responseJson.reason === null) {
					toast.error("Failed to load the agent data. Please try again and contact support@shuffler.io if this persists")
				} else {
					toast.error("Error: " + responseJson.reason)
				}
			}
		})
		.catch((error) => {
			setDisableButtons(false)
			toast.error("Error: " + error)
		})
	}

	const RerunDecision = (decision) => {
		if (execution.execution_id === undefined || execution.execution_id === null) {
			toast.error("No workflow run loaded. Please try again and contact support@shuffler.io if this persists.")
			return
		}

		if (agentActionResult === undefined || agentActionResult === null) {
			toast.error("Failed to find the relevant agent action. Please try again, and contact support@shuffler.io if it persists.")
			return
		}

		console.log("DECISION: ", decision)

		const url = `${globalUrl}/api/v1/apps/agent/run?rerun=true&decision_id=${decision?.run_details?.id}`
		var body = agentActionResult.action
		console.log("BODY: ", body)
		body.source_execution = execution.execution_id
		body.source_workflow = execution.workflow.id

		fetch(url, {
		  method: "POST",
		  body: JSON.stringify(body),
		  credentials: "include",
		  cors: "no-cors",
		})
		.then((response) => {
			return response.json()
		})
		.then((responseJson) => {
			console.log("RESP: ", responseJson)
			if (responseJson.success !== false) {
			} else {
				if (responseJson.reason === undefined || responseJson.reason === null) {
					toast.warn("Failed to restart the agent decision. Please try again and contact support@shuffler.io if this persists")
				} else {
					toast.warn(responseJson.reason)

				}
			}

			GetExecution(execution.execution_id, agentActionResult.action.id, execution.authorization) 
			setTimeout(() => {
				GetExecution(execution.execution_id, agentActionResult.action.id, execution.authorization) 
			}, 10000)
		})
		.catch((error) => {
			toast.error("Error: " + error)
		})
	}

	const getAppAuth = () => {
		const url = `${globalUrl}/api/v1/apps/authentication`
		fetch(url, {
			method: "GET",
			credentials: "include",
		})
		.then((response) => {
			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.success !== false) {
				setAppAuth(responseJson)
			}
		})
		.catch((error) => {
			toast.error("Error in auth load: " + error)
		})
	}

	const getApps = () => {
		const url = `${globalUrl}/api/v1/apps`
		fetch(url, {
			method: "GET",
			credentials: "include",
		})
		.then((response) => {
			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.success !== false) {
				setApps(responseJson)
			}
		})
		.catch((error) => {
			toast.error("Error in app load: " + error)
		})
	}

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const executionId = params.get("execution_id")
		const nodeId = params.get("node_id")
		const authorization = params.get("authorization")
		if (executionId !== undefined && executionId !== null && authorization !== undefined && authorization !== null) {
			GetExecution(executionId, nodeId, authorization)
		} else {
			setShowAgentStarter(true)
			//toast.warn("No execution ID or node ID provided. Please provide execution_id and node_id in the URL.")
		}

		getApps()
		getAppAuth() 
	}, [])

	const maxTimelineWidth = 380 

	const submitQuestions = (decisionId, questionAnswers, isContinuation) => {
		console.log("Submitting questions: ", decisionId, questionAnswers)
		if (decisionId === undefined || decisionId === null || decisionId === "") {
			toast.error("No decision ID provided. Cannot submit answers.")
			return
		}

		if (Object.keys(questionAnswers).length === 0) {
			toast.error("No answers provided. Cannot submit empty answers.")
			return
		}

		var newArgument = {}
		if (isContinuation === true) {
			// Just a single answer
			for (var key in questionAnswers) {
				const answer = questionAnswers[key]
				newArgument[key] = answer
			}

			if (Object.keys(newArgument).length === 0) {
				toast.error("No answers details. Cannot submit the answer.")
				return
			}

		} else {
			for (var key in questionAnswers) {
				const answer = questionAnswers[key]
				if (isContinuation === true) {
					newArgument["question_"+(answer.index)] = answer.value
				}
			}
		}

		setAgentRequestLoading(true) 
		const params = new URLSearchParams(window.location.search)
		const executionId = params.get("execution_id")
		const nodeId = params.get("node_id")
		const authorization = params.get("authorization")

		const url = `${globalUrl}/api/v1/workflows/${executionId}/run?reference_execution=${executionId}&authorization=${authorization}&answer=true&note=${encodeURIComponent(JSON.stringify(newArgument))}&agentic=true&decision_id=${decisionId}`
		fetch(url, {
			method: "GET",
			credentials: "include",
		})
		.then((response) => {
			setAgentRequestLoading(false) 
			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.success !== false) {
				setTimeout(() => {
					GetExecution(execution.execution_id, agentActionResult.action.id, execution.authorization) 
				}, 500)

				toast.success("Successfully submitted answers! The agent should continue shortly.")
			} else {
				toast.warn("Failed to submit answers. Please try again or contact support@shuffler.io if this persists..")
			}
		})
		.catch((error) => {
			setAgentRequestLoading(false) 
			toast.error("Problem with submitting: " + error)
		})
	}

	var latestEndTime = 0
	var originalStartTime = 0
	const TimelineItem = (props) => {
		const { item, index } = props;
		const [hovered, setHovered] = useState(false);

		const parsedStatus = item.status === "RUNNING" || item.status === "WAITING" ? 
			<CircularProgress size={20} style={{marginRight: 10, }} />
			:
			item.status === "FINISHED" ?
			<Tooltip title="Finished" placement="top">
				<CheckCircleIcon style={{color: green, marginRight: 10, }} />
			</Tooltip>
			:
			item.status === "ABORTED" || item.status === "FAILURE" ?
				<Tooltip title={`${item.status}: Check the raw data`} placement="top">
					<ErrorIcon style={{color: red, marginRight: 10, }} />
				</Tooltip>
			: 
			item.status === "IGNORED" || item.status === "IGNORE" ?
				<Tooltip title={`${item.status}: Previous FAILURE before the agent was reran.`} placement="top">
					<WarningIcon style={{color: yellow, marginRight: 10, }} />
				</Tooltip>
			: 
			<Tooltip title={`Not started yet: ${item.status}`} placement="top">
				<HourglassDisabledIcon style={{marginRight: 10, }} />
			</Tooltip>

		const categoryStyle = {
			width: 25, 
			height: 25, 
			marginRight: 10, 
			borderRadius: 5, 
		}

			
		const validate = validateJson(item.details)
		const itemStartTime = item.start_time
		var itemEndTime = item.end_time
		if (item.category === "agent" && itemStartTime !== undefined && itemStartTime !== originalStartTime && (itemStartTime < originalStartTime || originalStartTime === 0)) {
			console.log("Rerender 1: ", itemStartTime, originalStartTime)
			originalStartTime = itemStartTime
		}

		if (itemEndTime !== undefined && itemEndTime > latestEndTime) {
			console.log("Rerender 2")
			latestEndTime = itemEndTime
		}

		if (itemEndTime === undefined || itemEndTime === null) {
			// Set it to now
			itemEndTime = latestEndTime
		}

		if (item.category == "agent" && itemEndTime === 0) {
			// Right now -> .toLocaleString() support
			itemEndTime = Date.now() / 1000

			//<Tooltip title={`Time taken: ${currentDuration} seconds. Started: ${new Date(item.start_time * 1000).toLocaleString()}\nFinished: ${new Date(item.end_time * 1000).toLocaleString()}`} placement="right">

			if (itemEndTime > latestEndTime) {
				latestEndTime = itemEndTime
			}
		}

		const totalDuration = latestEndTime - originalStartTime
		var currentDuration = itemStartTime - itemEndTime
		var timelineMarginLeft = ((itemStartTime - originalStartTime) / totalDuration) * maxTimelineWidth
		//var timelineMarginLeft = 0

		// Calculate how long the div should be 
		var timelineWidth = ((itemEndTime - itemStartTime) / totalDuration) * maxTimelineWidth 

		//console.log("CURRENT DURATION (1): ", currentDuration, itemStartTime, itemEndTime, originalStartTime, latestEndTime, totalDuration, timelineMarginLeft, timelineWidth)
		if (totalDuration === currentDuration) {
			timelineMarginLeft = 0
			timelineWidth = maxTimelineWidth
		}

		// Just for simplicity's sake
		if (currentDuration < -1000000 || currentDuration > 1000000) {
			currentDuration = 0 
		}

		if (currentDuration < 0) {
			currentDuration = currentDuration * -1
		}

		const defaultTopPadding = 10
		const open = openIndexes.includes(index)

		if (item?.type === "agent" && item?.details?.original_input !== undefined) {
			document.title = "Agent: " + item?.details?.original_input?.substring(0, 50)
		}

		var questions = []
		if (item?.details?.action === "finish" || item.category == "finish" || item?.details?.action == "finalise") {
			item.type = "finalise"
			item.category = "finalise"
			item.label = item?.details?.reason || item.label

		} else if (item?.category === "ask" || item?.details?.action === "ask") { 

			item.type = "question"
			item.category = "ask"
			item.label = item?.details?.reason || item.label

			for (var fieldKey in item?.details?.fields) {
				const field = item?.details?.fields[fieldKey]
				if (field?.key !== "question") {
					continue
				}

				questions.push({
					"question": field?.value,
					"index": questions.length + 1,
				})
			}
		} else if (item?.details?.action === "api" && item?.details?.tool?.length > 0) {
			item.label = item?.details?.reason || item.label
		}

		var parsedCategory = item.category === "singul" ?
			<Tooltip title="Singul" placement="top">
				<img src="/images/logos/singul.svg" style={categoryStyle} />
			</Tooltip>
			: item.category === "ask" ? 
			<Tooltip title="Ask" placement="top">
				<img src="/images/workflows/UserInput2.svg" style={categoryStyle} />
			</Tooltip>
			: item.category === "finalise" || item.category === "finish" || item.action === "finish" ?
			<Tooltip title="The action finished successfully" placement="top">
				<CheckIcon style={{color: green, marginRight: 10, }} />
			</Tooltip>
			:
			<div style={categoryStyle} />

		var showAuthentication = false 
		var selectedApp = {}
		if (item?.details?.tool !== undefined && item?.details?.tool !== null && item?.details?.tool?.length > 0 && item?.details?.tool !== "singul" && item?.details?.tool !== item?.details?.action) {

			// Find the app and inject the image
			const toolName = item.details.tool.toLowerCase().replaceAll(" ", "_").replaceAll("-", "_")
			for (var appKey in apps) {
				const app = apps[appKey]

				const appname = app.name.toLowerCase().replaceAll(" ", "_").replaceAll("-", "_")
				if (appname !== toolName) {
					continue
				}

				if (app.large_image === undefined || app.large_image === null || app.large_image.length === 0) {
					break
				}

				selectedApp = app

				// Override the category
				//item.category = app.name
				//item.label = item?.details?.reason || item.label
				parsedCategory =
					<Tooltip title={app.name} placement="top">
						<img src={app.large_image} style={categoryStyle} />
					</Tooltip>

				break
			}
		}

		if (!showAuthentication) {
			if (item?.details?.run_details?.raw_response !== undefined && item?.details?.run_details?.raw_response !== null && item?.details?.run_details?.raw_response?.includes("app_authentication")) {
				showAuthentication = true
			}
		}

		var questionSubmitDisabled = questions.length === 0 ? true : false
		for (var qKey in questions) {
			const q = questions[qKey]
			if (questionAnswers[q.question] === undefined || questionAnswers[q.question] === null || questionAnswers[q.question] === "") {
				//console.log("EMPTY QUESTION: ", q)
				questionSubmitDisabled = true
				break
			} else {
				questionSubmitDisabled = false
			}
		}

		const barColor = item.status === "IGNORED" ? yellow : item.status === "FINISHED" ? green : 
			item.status === "FAILURE" || item.status == "ABORTED" ? red : 
			item.status === "RUNNING" || item.status === "" ? theme.palette.main :
			red	

		const rerunAgentButton = 
			<Tooltip title="Rerun from the start with the same input" placement="right">
				<span>
					<IconButton
						style={{marginLeft: 20, }}
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()

							toast.info("Rerunning agent with the same input.")
							setDisableButtons(true)

							if (item?.details === undefined || item?.details === null || item?.details?.input === undefined || item?.details?.input === null) {
								toast.error("No decision details found to rerun. Cannot proceed. Please go back to your workflow or /agents to start over.")
							} else {
								//console.log("DETAILS: ", item?.details)
								for (var messagekey in item?.details?.input?.messages) {
									const message = item?.details?.input?.messages[messagekey]
									if (message.role === "user") {
										setActionInput(message.content)
										setDisableButtons(true)

										submitInput(message.content)
										//toast.info("Rerun started. Please wait a few seconds and this page should refresh automatically.")
										break
									}
								}
							}
						}}
					>
						<RestartAltIcon /> 
					</IconButton>
				</span>
			</Tooltip>

								
		const rerunButton = 
			<Tooltip title="Rerun FROM this decision. This can be used if an agent decision action somehow stopped and didn't get a result. Clears out all decisions AFTER this one." placement="right">
				<span>
					<IconButton
						disabled={item.type !== "decision" || disableButtons}
						style={{marginLeft: 20, }}
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()

							//toast.info("Attempting to rerun this decision by itself.")
							setDisableButtons(true)
							RerunDecision(item.details)
						}}
					>
						<RestartAltIcon /> 
					</IconButton>
				</span>
			</Tooltip>	

		return (
			<div 
				style={{
					minHeight: 45, 
					cursor: hovered ? "pointer" : "default",
					borderTop: "1px solid " + theme.palette.surfaceColor,
					borderRadius: theme.palette.borderRadius,
				}}
					onMouseEnter={() => {
						if (!hovered) { 
							//console.log("HOVER")
							setHovered(true)
						}
					}}
					onMouseLeave={() => {
						if (hovered) { 
							setHovered(false)
						}
					}}
			>
				<div 
					style={{
						display: "flex", 
						backgroundColor: hovered ? theme.palette.surfaceColor : "inherit",
					}}
					onClick={(e) => {
						if (item.details === undefined || item.details === null || item.details === "") {

							if (item?.category === "agent" && item?.type === "agent") {
								// Show all the data
								if (openIndexes.includes(index)) {
									console.log("Rerender 3")
									setOpenIndexes(openIndexes.filter((i) => i !== index))
								} else {
									console.log("Rerender 4")
									setOpenIndexes([...openIndexes, index])
								}
							} else {
								toast.warn("No details to open")
							}

							return
						}

						if (openIndexes.includes(index)) {
							console.log("Rerender 5")
							setOpenIndexes(openIndexes.filter((i) => i !== index))
						} else {
							console.log("Rerender 6")
							setOpenIndexes([...openIndexes, index])
						}
					}}
				>
					<div style={{minWidth: 50, maxWidth: 50, paddingTop: defaultTopPadding, }}>
						{parsedStatus}
					</div>
					<div style={{minWidth: 50, maxWidth: 50, paddingTop: defaultTopPadding, }}>
						{parsedCategory}
					</div>
					{/*
					<div style={{minWidth: 200, maxWidth: 200, paddingTop: defaultTopPadding, }}>
						{item?.start_time !== undefined && item?.start_time !== null && item?.start_time !== 0 ?
							new Date(item.start_time * 1000).toLocaleString()
							: 
							null
						}
					
					</div>
					*/}
					<div style={{minWidth: 100, maxWidth: 100, paddingTop: defaultTopPadding-5,  }}>
						<Chip
							label={item.type}
						/>
					</div>
					<div style={{
						minWidth: 300, 
						maxWidth: 300, 
						paddingTop: defaultTopPadding, 
						paddingBottom: defaultTopPadding,
					}}>
						{item.label}
					</div>

					<Tooltip title={`Time taken: ${currentDuration} seconds. Started: ${new Date(itemStartTime * 1000).toLocaleString()}\nFinished: ${new Date(itemEndTime * 1000).toLocaleString()}`} placement="right">
						<div style={{
							minWidth: maxTimelineWidth, 
							maxWidth: maxTimelineWidth, 
							paddingTop: defaultTopPadding*1.5, 
						}}>
							{currentDuration != 0 && !isNaN(timelineMarginLeft) && !isNaN(timelineWidth) && timelineWidth > 0 ?
								<div style={{
									backgroundColor: barColor,
									marginLeft: timelineMarginLeft, 
									minWidth: timelineWidth, 
									maxWidth: timelineWidth,
									minHeight: 10,
									maxHeight: 10, 
									borderRadius: theme.palette.borderRadius,
								}}>
								</div>
							: 
								<Typography variant="body2" color="textSecondary">
								</Typography>
							}
						</div>
					</Tooltip>

					<div style={{
						minWidth: 100, 
						maxWidth: 100, 
						display: "flex", 
					}}>
						{item.category === "ask" ? 
							<span style={{display: "flex", }}>
								{rerunButton} 
								{/*
								<Tooltip title="Approve" placement="left">
									<span>
										<IconButton
											disabled={disableButtons}
											style={{marginLeft: 20, }}
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()

												toast.info("Approving this step.")
											}}
										>
											<CheckIcon style={{color: green, }} />
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title="Deny" placement="left">
									<span>
										<IconButton
											disabled={item.type !== "decision" || disableButtons}
											style={{marginLeft: 0, }}
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()

												toast.info("Stopping on this step.")
											}}
										>
											<CloseIcon style={{color: red, }} />
										</IconButton>
									</span>
								</Tooltip>
								*/}

								<Tooltip title="Answer in the Form UI" placement="left">
									<span>
										<IconButton
											style={{marginLeft: 0, }}
											disabled={item?.details?.run_details?.status === "FINISHED"}
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()

												//http://localhost:3002/forms/aadfe022-fe93-431c-8634-de42dd7440ac?authorization=9357f6a6-7d59-44be-ad66-be27657369ac&reference_execution=0726378d-b501-470f-b850-f7fb48cd8ca4&source_node=de446bcf-ad37-4337-9f72-e069c7425fac&backend_url=https://ec4245cd2941.ngrok-free.app
												const newurl = `/forms/${execution?.workflow?.id}?authorization=${execution.authorization}&reference_execution=${execution.execution_id}&source_node=${agentActionResult?.action?.id}&decision_id=${item.details.run_details.id}&backend_url=${globalUrl}`
												window.open(newurl, '_blank', 'noopener,noreferrer');
											}}
										>
											<OpenInNewIcon />
										</IconButton>
									</span>
								</Tooltip>
							</span>
							:
							item.category === "agent" ? 
								rerunAgentButton
							:
							item?.type === "decision" ?
								<div style={{display: "flex", }}>
									{rerunButton}
									<Tooltip title="Explore/debug execution" placement="left">
										<span>
											<IconButton
												disabled={item?.details?.run_details?.debug_url === undefined || item?.details?.run_details?.debug_url === null || item?.details?.run_details?.debug_url === ""}
												style={{marginLeft: 0, }}
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()

													//http://localhost:3002/forms/aadfe022-fe93-431c-8634-de42dd7440ac?authorization=9357f6a6-7d59-44be-ad66-be27657369ac&reference_execution=0726378d-b501-470f-b850-f7fb48cd8ca4&source_node=de446bcf-ad37-4337-9f72-e069c7425fac&backend_url=https://ec4245cd2941.ngrok-free.app
													window.open(item?.details?.run_details?.debug_url, '_blank', 'noopener,noreferrer');
												}}
											>
												<OpenInNewIcon color={barColor === red ? "primary" : "secondary"} />
											</IconButton>
										</span>
									</Tooltip>
								</div>
							:
								rerunButton
						}
						<Tooltip title="Explore results" placement="right">
							<span>
								<IconButton
									disabled={item.details === undefined || item.details === null || item.details === ""}
									style={{marginLeft: 10, }}
								>
									{open ? 
										<ExpandLessIcon />
										: 
										<ExpandMoreIcon />
									}

								</IconButton>
							</span>
						</Tooltip>
					</div>
				</div>
					
				{showAuthentication && selectedApp.id !== undefined ?
					<div style={{minWidth: 300, maxWidth: 300, margin: "auto", marginTop: 25, }}>
						<AuthenticationModal 
							globalUrl={globalUrl}
							userdata={userdata}

							setAppAuthentication={setAppAuth}
							selectedAppData={selectedApp}
						/>
					</div>
				: null}

				{questions?.length > 0 && item?.status === "RUNNING" ? 
					<div>
						{questions.map((q, questionIndex) => {
							return (
								<div style={{marginTop: 25, }}>
									<div id="markdown_wrapper_outer" style={{cursor: "default", }}>
										<Markdown
											components={markdownComponents}
											id="markdown_wrapper"
											className={"style.reactMarkdown"}
											escapeHtml={false}
											skipHtml={false}
											remarkPlugins={[remarkGfm]}
											style={{
												maxWidth: "100%", minWidth: "100%",
											}}
										>
											{q.question}
										</Markdown>
									</div>
									
									<TextField
										label={`Question ${q.index}`}
										placeholder="Your answer here"
										variant="outlined"
										style={{width: 800, marginTop: 20, }}
										multiline
										minRows={2}
										defaultValue={questionAnswers[q.question]?.value || ""}
										onBlur={(e) => {
											console.log("Change: ", e.target.value)
											try { 
												questionAnswers[q.question] = {
													"index": questionIndex,
													"value": e.target.value,
												}

												setQuestionAnswers({...questionAnswers, })
											} catch (e) {
												toast.warn("Something went wrong. Please contact support@shuffler.io. Details: " + e)
											}
										}}

									/>
								</div>
							)
						})}

						<Button
							variant="contained"
							style={{marginTop: 16, }}
							disabled={questionSubmitDisabled}
							onClick={() => {
								submitQuestions(item?.details?.run_details?.id, questionAnswers)

							}}
						>
							Submit 
						</Button>
					</div>
				: null}


				{open ?
					<div style={{marginTop: 10, marginBottom: 10, }}>
						{validate.valid === true ? 
						  <ReactJson
							src={validate.result}
							theme={theme.palette.jsonTheme}
							style={theme.palette.reactJsonStyle}
							shouldCollapse={(jsonField) => {
							  return collapseField(jsonField)
							}}
							iconStyle={theme.palette.jsonIconStyle}
							collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
							displayArrayKey={false}
							enableClipboard={(copy) => {
							  handleReactJsonClipboard(copy);
							}}
							displayDataTypes={false}
							onSelect={(select) => {
							  HandleJsonCopy(validate.result, select, "exec")
							}}
							name={false}
						  />
						:
						<code>
							{item.details}
						</code>
					}
				  </div>
				: null }
			</div> 
		)
	}

	const TimelineRender = (props) => {
		const { agent_data } = props;

		const [continuationText, setContinuationText] = useState("")

		var actionResult = execution?.results?.length > 0 ? execution.results[0] : execution 
		const validate = validateJson(actionResult?.result)
		if (validate.valid === true) {
			actionResult.result = validate.result
		}

		var timelineItems = [
			{
				"label": "AI Agent 2",
				"type": "agent",
				"category": "agent",
				"details": actionResult?.result,

				"status": agent_data?.status,
				"start_time": agent_data?.started_at,
				"end_time": agent_data?.completed_at,
			},
		]

		// Setting up the initial item
		if (agent_data?.started_at === undefined && execution?.started_at !== undefined) {
			timelineItems[0].start_time = execution?.started_at
		}

		if (agent_data?.completed_at === undefined && execution?.completed_at !== undefined) {
			timelineItems[0].end_time = execution?.completed_at
		}

		// Always prioritise the execution status first
		// agent (RUNNING) = workflow (EXECUTING)
		if (execution?.status !== undefined) {
			timelineItems[0].status = execution?.status
		}

		if (actionResult?.result?.status !== undefined && actionResult?.result?.status !== null && actionResult?.result?.status?.length > 0) {
			if (timelineItems[0].status !== "FINISHED" && timelineItems[0].status !== "ABORTED" && timelineItems[0].status !== "FAILURE") {
				timelineItems[0].status = actionResult?.result?.status
			}
		}

		// Autofixer for result lol
		if ((agent_data?.decisions === undefined || agent_data?.decisions === null)) {
			const verifiedInput = validateJson(actionResult?.result)
			if (verifiedInput.valid === true && verifiedInput.result?.decisions !== undefined && verifiedInput.result?.decisions !== null) { 
				agent_data.decisions = verifiedInput.result?.decisions 

				setAgentActionResult(actionResult)

			}
		}

		var finishDecisionId = ""
		var sortedTimelineItems = []
		for (var key in agent_data?.decisions) {
			const item = agent_data.decisions[key]

			if (item.run_details.started_at === undefined || item.run_details.started_at === null) {
				item.run_details.started_at = originalStartTime
			}

			if (item.run_details.completed_at === undefined || item.run_details.completed_at === null) {
				item.run_details.completed_at = Math.floor(Date.now() / 1000)
			}

			var newTimelineItem = {
				"label": item?.action,
				"type": "decision",
				"category": item?.category,

				"status": item?.run_details?.status,
				"start_time": item?.run_details?.started_at,
				"end_time": item?.run_details?.completed_at,
			}

			newTimelineItem.details = item
			timelineItems.push(newTimelineItem)

			if (item?.details?.action === "finish" || item.action === "finish" || item.category == "finish" || item?.details?.action == "finalise") {
				finishDecisionId = item?.run_details?.id
			}

		}

		timelineItems.sort((a, b) => {
			if (a.start_time < b.start_time) {
				return 1;
			}

			return 0;
		})

		return (
			<div style={{marginTop: 20, }}>
				{/*
				<div style={{display: "flex", }}>
					{agent_data?.status === "RUNNING" || agent_data?.status === "WAITING" ?
						<CircularProgress size={20} style={{marginRight: 10, }} />
						:
						agent_data?.status === "FINISHED" ?
							<CheckCircleIcon style={{color: green, marginRight: 10, }} />
						:
						<HourglassDisabledIcon style={{marginRight: 10, }} />
					}
						
					<Typography variant="h6" style={{marginLeft: 20, }}>
						{agent_data?.status}
					</Typography>
				</div>
				*/}

				<div style={{marginTop: 10, }} />
				{timelineItems?.map((item, index) => {
					return (
						<TimelineItem 
							item={item} 
							index={index}
							key={index} 
						/>
					)
				})}

				{finishDecisionId !== "" ?
					<Box 
						component="form" 
						style={{width: "100%", textAlign: "center",}}
						onSubmit={(e) => {
							e.preventDefault();

							// Uses the submitQuestion and adds more details to 
							//setAgentRequestLoading ?
							submitQuestions(finishDecisionId, {
								"continue": continuationText,
							}, true)
						}}
					>
						<div style={{display: "flex", maxWidth: 550, minWidth: 550, margin: "auto", marginTop: 50, }}>
							<div>
								<TextField
									label="Add more details to the current task"
									variant="outlined"
									disabled={agentRequestLoading}
									style={{width: 400, margin: "auto", }}
									multiline
									minRows={1}
									onChange={(e) => {
										console.log("Value: ", e.target.value)
										//setActionInput(e.target.value)
										//
										setContinuationText(e.target.value)
									}}
									InputProps={{
										endAdornment: (
											agentRequestLoading ?
												<CircularProgress size={24} style={{marginRight: 10, }} />
											: 
											<Tooltip title="This is the input for the AI Agent. It can be any valid JSON.">
												<IconButton 
													type="submit"
													disabled={continuationText === ""}
												> 
													<SendIcon 
														color={continuationText === "" ? "disabled" : "primary"}
													/>
												</IconButton>
											</Tooltip>
										),
									}}
								/>
								<Typography variant="body2" color="textSecondary" style={{marginTop: 10, }}>
									Any failed tasks will be set to ignored (TBD). <a href="/docs/AI#agent-continuations" target="_blank" rel="noreferrer" style={{color: theme.palette.main, textDecoration: "none", }}>Learn more</a>
								</Typography>
							</div>
							<Typography color="textSecondary" variant="body1" style={{marginTop: 25, marginLeft: 20, }}>
								OR 
							</Typography>
							<Button
								variant={"contained"}
								color="primary"
								disabled={true}
								style={{marginTop: 10, marginLeft: 20, minWidth: 150, maxWidth: 150, height: 56, }}
							>
								Create as Workflow
							</Button>
						</div>
					</Box>
				: null}

			</div>
		)
	}

	const submitInput = (inputText) => {
		//toast.info("Submitting AI Agent input: " + inputText);

		setAgentRequestLoading(true)
		//setShowAgentStarter(false);
		//GetExecution(execution?.execution_id, execution?.node_id, execution?.authorization);
		//
		setData({})
		setExecution(null)
		setAgentRequestLoading(true)
		setShowAgentStarter(true)
		setActionInput(inputText)

		setAgentActionResult(null)

    	document.title = `Agent: ${inputText.substring(0, 30)}...`
		if (inputText === undefined || inputText === null || inputText === "") {
			toast.error("Please provide a valid input for the AI Agent.")
			setAgentRequestLoading(false)
			return
		}

		// 1. Run the execution. Can this be a single-action run?
		// 2. Get the execution ID and node ID from the response.
		const uuid = uuidv4()
		var parsedAction = "list_tickets,API" // Default action for now
		if (chosenApps.length > 0) {
			parsedAction = "" 
			for (var appKey in chosenApps) {
				const app = chosenApps[appKey]
				const appname = app.name.toLowerCase().replaceAll(" ", "_").replaceAll("-", "_")
				parsedAction += `app:${app.id}:${appname.replaceAll(",", "").replaceAll(":", "")},`
			}

			parsedAction = parsedAction.slice(0, -1) // Remove last comma
		}

		const data = {
			"id": uuid,
			"name":"agent",
			//"app_name":"Shuffle AI",
			"app_name":"AI Agent", // Failover for rerun
			"app_id":"shuffle_agent",
			"app_version":"1.0.0",

			"environment":"cloud",
			"parameters":[
				{
					"name":"app_name",
					"value":"openai"
				},
				{
					"name":"input",
					"value": inputText
				},
				{
					"name":"action",
					"value": parsedAction,
				}
		]}

		const url = `${globalUrl}/api/v1/apps/agent_starter/run`
		fetch(url, {
			method: "POST",
			body: JSON.stringify(data),
			credentials: "include",
		})
		.then((response) => {
			setAgentRequestLoading(false)
			return response.json()
		})
		.then((responseJson) => {
			//toast.success("Got response!")
			console.log("Agent run response: ", responseJson)

			if (responseJson.success === true && responseJson.authorization !== undefined && responseJson.execution_id !== undefined) { 
				navigate("?execution_id=" + responseJson.execution_id + "&authorization=" + responseJson.authorization)
				setShowAgentStarter(false)
				GetExecution(responseJson.execution_id, "", responseJson.authorization)
			}
		})
		.catch((error) => {
			setAgentRequestLoading(false)
			toast.error("Error: " + error)
		})

	}

	const handleKeyDownRoot = (e) => {
    	const isCmdEnter = e.metaKey && e.key === "Enter"; // macOS
    	const isCtrlEnter = e.ctrlKey && e.key === "Enter"; // Windows/Linux
		if (isCmdEnter || isCtrlEnter) {
		  	e.preventDefault()
			submitInput(actionInput)
		}
	}

	const chipStyle = {
		margin: 4, 
		cursor: "pointer",
	}

	return (
		<div style={agentWrapperStyle}>
			<TextField
			  id="copy_element_shuffle"
			  style={{ display: "none" }}
			/>

			{showAgentStarter ? 
				<Box 
					component="form" 
					style={{textAlign: "center", }} 
					onKeyDown={handleKeyDownRoot}
					onSubmit={(e) => {
						e.preventDefault();
						submitInput(actionInput);
					}}
				>
					<img src="/images/logos/agent.svg" style={{
						width: 200, 
						height: 200, 
						borderRadius: theme.palette.borderRadius,
					}} />

					<div />

					<Typography variant="h5" style={{marginTop: 30, }}>
						Shuffle AI Agents 
					</Typography>
					<TextField
						label="What do you want to do?"
						variant="outlined"
						disabled={agentRequestLoading}
						style={{width: 450, marginRight: 20, marginTop: 30, }}
						multiline
						minRows={1}
						defaultValue={actionInput || ""}
						onChange={(e) => {
							setActionInput(e.target.value)
						}}
						InputProps={{
							endAdornment: (
								agentRequestLoading ?
									<CircularProgress size={24} style={{marginRight: 10, }} />
								: 
								<Tooltip title="This is the input for the AI Agent. It can be any valid JSON.">
									<IconButton type="submit"> 
										<SendIcon 
											color="primary"
										/>
									</IconButton>
								</Tooltip>
							),
						}}
					/>

					<div style={{display: "flex", margin: "auto", paddingTop: 10, minWidth: 300, maxWidth: 300, justifyContent: "center", overflowWrap: "wrap", }}>
						<div>
							<Chip 
								id="add_app_chip"
								icon={<AddIcon />} label="Select Apps"  
								style={chipStyle}
								onClick={() => {
									setAppPickerAnchor(document.getElementById("add_app_chip"))
								}}
							/>
							<Popover
								open={appPickerAnchor !== null}
								anchorEl={appPickerAnchor}
								onClose={() => {
									setAppPickerAnchor(null)
								}}
								anchorOrigin={{
									vertical: 'bottom',
									horizontal: 'left',
								}}
							>
									<AppSearch
										userdata={userdata}
										defaultSearch={""}
										newSelectedApp={newSelectedApp}
										setNewSelectedApp={setNewSelectedApp}
										inputHeight={200}
									/>
							</Popover>
						</div>
						
						{chosenApps.map((app, index) => {
							const chosenName = (app?.name?.charAt(0).toUpperCase() + app?.name?.slice(1))?.replaceAll("_", " ").replaceAll("-", " ")
							const chosenImagePath = app?.image
							const chosenImage = <img src={chosenImagePath} style={{width: 24, height: 24, borderRadius: 20, marginRight: 1, }} />

							return ( 
								<Chip icon={chosenImage} label={chosenName} variant="outlined" 
									style={chipStyle}
									onDelete={() => {
										const newChosenApps = chosenApps.filter((a, i) => i !== index)
										setChosenApps(newChosenApps)
									}}
								/>
							)
						})}
					</div>
				</Box>
				: 
				<div>
					<ButtonGroup style={{marginTop: 50, }}>
						<Button 
							variant={buttonState === "default" ? "contained" : "outlined"}
							color="secondary" 
							onClick={() => {
								setButtonState("default");
							}}
						>
							Default
						</Button>
						<Button 
							variant={buttonState === "timeline" ? "contained" : "outlined"}
							color="secondary" 
							onClick={() => {
								setButtonState("timeline");
							}}
						>
							Timeline	
						</Button>
					</ButtonGroup>

					<Tooltip title="Reload the agent data" placement="top">
						<span>
							<Button 
								disabled={execution === null || Object.keys(execution).length === 0} 
								style={{marginLeft: 25, }}
								variant={"outlined"}
								color="secondary"
								onClick={() => {
									GetExecution(execution.execution_id, agentActionResult.action.id, execution.authorization) 
								}}
							>
								<RefreshIcon />
							</Button>
						</span>
					</Tooltip>

					{buttonState === "timeline" ?
						<TimelineRender agent_data={data} />
					: 
						null
					}
				</div>
			}
		</div>
	)
}

export default AgentUI
