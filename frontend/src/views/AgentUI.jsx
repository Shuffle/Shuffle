import React, { useState, useEffect, useContext, memo } from "react";
import { Context } from "../context/ContextApi.jsx";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getTheme } from "../theme.jsx";
import { toast } from "react-toastify"
import ReactJson from "react-json-view-ssr";
import { v4 as uuidv4} from "uuid";
import { validateJson, collapseField, handleReactJsonClipboard, HandleJsonCopy } from "../views/Workflows.jsx";

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
} from '@mui/material'

import {
	CheckCircle as CheckCircleIcon,
	HourglassDisabled as HourglassDisabledIcon,
	RestartAlt as RestartAltIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Send as SendIcon,
	Error as ErrorIcon,
} from '@mui/icons-material'

import { 
	green,
	red,
} from '../views/AngularWorkflow.jsx'

const AgentUI = (props) => {
  	const { globalUrl, isLoggedIn, isLoaded, userdata, } = props
	const [buttonState, setButtonState] = useState("timeline")
	const [execution, setExecution] = useState(null)
	const [agentActionResult, setAgentActionResult] = useState(null)
	const [data, setData] = useState({})
	const [openIndexes, setOpenIndexes] = useState([])
	const [disableButtons, setDisableButtons] = useState(false)

	const [originalStartTime, setOriginalStartTime] = useState(0)
	const [latestEndTime, setLatestEndTime] = useState(0)
	const [showAgentStarter, setShowAgentStarter] = useState(false)
	const [actionInput, setActionInput] = useState("")

    const {themeMode} = useContext(Context)
  	const theme = getTheme(themeMode)
    const navigate = useNavigate();

	const agentWrapperStyle = {
		width: 1000,
		height: 1000, 
		margin: "auto",
		paddingTop: 100, 
	}

	if (data.input === undefined || data.input === null) {
		data.input = ""
	} else {
		const verifiedInput = validateJson(data.input)
		if (verifiedInput.valid === true) {
			data.input = JSON.stringify(verifiedInput.result, null, 2)
		}
	}

	const findNodeData = (execution_data, node_id) => {
		if (execution_data === undefined || execution_data === null) {
			return
		}

		if (node_id === undefined || node_id === null || node_id === "") {
			return
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
            		setTimeout(() => {
						GetExecution(execution_id, node_id, authorization)
					}, 3000)
				} else {
					setDisableButtons(false)
					setDisableButtons(false)
				}

				setExecution(responseJson)
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
		})
		.catch((error) => {
			toast.error("Error: " + error)
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
	}, [])

	const maxTimelineWidth = 150 
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
			<Tooltip title={`Not started yet: ${item.status}`} placement="top">
				<HourglassDisabledIcon style={{marginRight: 10, }} />
			</Tooltip>

		const categoryStyle = {
			width: 20, 
			height: 20, 
			marginRight: 10, 
		}

		const parsedCategory = item.category === "singul" ?
			<Tooltip title="Singul" placement="top">
				<img src="/images/logos/singul.svg" style={categoryStyle} />
			</Tooltip>
			: item.category === "ask" ? 
			<Tooltip title="Ask" placement="top">
				<img src="/images/workflows/UserInput2.svg" style={categoryStyle} />
			</Tooltip>
			:
			<div style={categoryStyle} />
				
		const validate = validateJson(item.details)
		const itemStartTime = item.start_time
		var itemEndTime = item.end_time
		if (itemStartTime !== undefined && itemStartTime !== originalStartTime && (itemStartTime < originalStartTime || originalStartTime === 0)) {
			console.log("Rerender 1")
			//setOriginalStartTime(itemStartTime)
		}

		if (itemEndTime !== undefined && itemEndTime > latestEndTime) {
			console.log("Rerender 2")
			setLatestEndTime(itemEndTime)
		}

		if (itemEndTime === undefined || itemEndTime === null) {
			// Set it to now
			itemEndTime = latestEndTime
		}

		const totalDuration = latestEndTime - originalStartTime
		const currentDuration = itemStartTime - itemEndTime
		var timelineMarginLeft = ((itemStartTime - originalStartTime) / totalDuration) * maxTimelineWidth
		var timelineWidth = ((itemEndTime - itemStartTime) / totalDuration) * maxTimelineWidth 

		if (totalDuration === currentDuration) {
			timelineMarginLeft = 0
			timelineWidth = maxTimelineWidth
		}

		const defaultTopPadding = 10
		const open = openIndexes.includes(index)

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
							console.log("HOVER")
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
					<div style={{minWidth: 200, maxWidth: 200, paddingTop: defaultTopPadding, }}>
						{/* To ISO string from unix time */}
						{new Date(item.start_time * 1000).toLocaleString()}
					</div>
					<div style={{minWidth: 100, maxWidth: 100, paddingTop: defaultTopPadding-5,  }}>
						<Chip
							label={item.type}
						/>
					</div>
					<div style={{
						minWidth: 200, 
						maxWidth: 200, 
						paddingTop: defaultTopPadding, 
					}}>
						{item.label}
					</div>

					<Tooltip title={`Time taken: ${currentDuration*-1} seconds. Started: ${new Date(item.start_time * 1000).toLocaleString()}\nFinished: ${new Date(item.end_time * 1000).toLocaleString()}`} placement="right">
						<div style={{
							minWidth: maxTimelineWidth, 
							maxWidth: maxTimelineWidth, 
							paddingTop: defaultTopPadding*1.3, 
						}}>
							{currentDuration !== 0 && !isNaN(timelineMarginLeft) && !isNaN(timelineWidth) && timelineWidth > 0 ?
								<div style={{
									backgroundColor: item.status === "FINISHED" ? 
										green : 	 item.status === "RUNNING" || item.status === "" ? 
										theme.palette.main : theme.palette.surfaceColor,

									marginLeft: timelineMarginLeft, 
									minWidth: timelineWidth, 
									maxWidth: timelineWidth,
									height: 10, 
									}} />
							: null}
						</div>
					</Tooltip>

					<div style={{
						minWidth: 100, 
						maxWidth: 100, 
						display: "flex", 
					}}>
						<Tooltip title="Rerun JUST this decision. This can be used if an agent decision action somehow stopped and didn't get a result." placement="left">
							<span>
								<IconButton
									disabled={item.type !== "decision" || disableButtons}
									style={{marginLeft: 20, }}
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()

										toast.info("Attempting to rerun this decision by itself.")
										setDisableButtons(true)
										RerunDecision(item.details)
									}}
								>
									<RestartAltIcon /> 
								</IconButton>
							</span>
						</Tooltip>
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

		const actionResult = execution?.results?.length > 0 ? execution.results[0] : execution 
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

		// Autofixer for result lol
		if ((agent_data?.decisions === undefined || agent_data?.decisions === null)) {
			const verifiedInput = validateJson(actionResult?.result)
			if (verifiedInput.valid === true && verifiedInput.result?.decisions !== undefined && verifiedInput.result?.decisions !== null) { 
				agent_data.decisions = verifiedInput.result?.decisions 

				setAgentActionResult(actionResult)
			}
		}

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
				"label": item.action,
				"type": "decision",
				"category": item.category,

				"status": item.run_details.status,
				"start_time": item.run_details.started_at,
				"end_time": item.run_details.completed_at,
			}

			newTimelineItem.details = item
			timelineItems.push(newTimelineItem)
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

			</div>
		)
	}

	const submitInput = (inputText) => {
		toast.info("Submitting AI Agent input: " + inputText);

		//setShowAgentStarter(false);
		//GetExecution(execution?.execution_id, execution?.node_id, execution?.authorization);

		if (inputText === undefined || inputText === null || inputText === "") {
			toast.error("Please provide a valid input for the AI Agent.")
			return
		}

		// 1. Run the execution. Can this be a single-action run?
		// 2. Get the execution ID and node ID from the response.
		const uuid = uuidv4()
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
					"value":"list_tickets"
				}
		]}

		const url = `${globalUrl}/api/v1/apps/agent_starter/run`
		fetch(url, {
			method: "POST",
			body: JSON.stringify(data),
			credentials: "include",
		})
		.then((response) => {
			return response.json()
		})
		.then((responseJson) => {
			toast.success("Got response!")
			console.log("Agent run response: ", responseJson)

			if (responseJson.success === true && responseJson.authorization !== undefined && responseJson.execution_id !== undefined) { 
				navigate("?execution_id=" + responseJson.execution_id + "&authorization=" + responseJson.authorization)
				setShowAgentStarter(false)
				GetExecution(responseJson.execution_id, "", responseJson.authorization)
			}
		})
		.catch((error) => {
			toast.error("Error: " + error)
		})

	}

	return (
		<div style={agentWrapperStyle}>

			{showAgentStarter ? 
				<Box component="form" style={{textAlign: "center", }} onSubmit={(e) => {
					e.preventDefault();
					submitInput(actionInput);
				}}>
					<img src="/images/logos/agent.svg" style={{
						width: 200, 
						height: 200, 
					}} />
					<div />

					<Typography variant="h5" style={{marginTop: 30, }}>
						Shuffle AI Agents 
					</Typography>
					<TextField
						label="Agent Input"
						variant="outlined"
						style={{width: 300, marginRight: 20, marginTop: 30, }}
						defaultValue={execution?.execution_id || ""}
						onChange={(e) => {
							setActionInput(e.target.value)
						}}
						InputProps={{
							endAdornment: (
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
