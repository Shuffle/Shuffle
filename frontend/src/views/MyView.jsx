import React, { useEffect} from 'react';
import { useInterval } from 'react-powerhooks';

import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Chip from '@material-ui/core/Chip';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';

import CircularProgress from '@material-ui/core/CircularProgress';
import CachedIcon from '@material-ui/icons/Cached';
import GetAppIcon from '@material-ui/icons/GetApp';
import AppsIcon from '@material-ui/icons/Apps';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import AddIcon from '@material-ui/icons/Add';
import PublishIcon from '@material-ui/icons/Publish';
//import JSONPretty from 'react-json-pretty';
//import JSONPrettyMon from 'react-json-pretty/dist/monikai'
import ReactJson from 'react-json-view'

import {Link} from 'react-router-dom';
import { useAlert } from "react-alert";
import ChipInput from 'material-ui-chip-input'

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import BubbleChartIcon from '@material-ui/icons/BubbleChart';
import RestoreIcon from '@material-ui/icons/Restore';

import mobileImage from '../assets/img/mobile.svg';
import bagImage from '../assets/img/bag.svg';
import bookImage from '../assets/img/book.svg';


const inputColor = "#383B40"
const surfaceColor = "#27292D"

const flexContainerStyle = {
	display: "flex",
	flexDirection: "row",
	justifyContent: "left",
	alignContent: "space-between",
}

const flexBoxStyle = {
	width: "333px",
	height: "125px",
	margin: "10px",
	borderRadius: "4px",
	boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.16), 0px 2px 4px rgba(0, 0, 0, 0.12), 0px 1px 8px rgba(0, 0, 0, 0.1)",
	boxSizing: "border-box",
	letterSpacing: "0.4px",
	color: "#D6791E",
}

const activeWorkflowStyle = {backgroundColor: "#FFF5EE"}
const availableWorkflowStyle = {backgroundColor: "#F0F3FF"}
const notificationStyle = {backgroundColor: "#E5F9FF"}

const flexContentStyle = {
	display: "flex", 
	flexDirection: "row"
}

const iconStyle = {
	width: "75px",
	height: "75px",
	padding: "20px"
}

const fontSize_16 = {fontSize: "16px",}
const counterStyle = {fontSize: "36px",fontWeight:"bold"}
const blockRightStyle = {textAlign: "right",padding: "20px 20px 0px 0px",width:"100%"}

export const validateJson = (showResult) => {
	//showResult = showResult.split(" None").join(" \"None\"")
	showResult = showResult.split(" False").join(" false")
	showResult = showResult.split(" True").join(" true")

	var jsonvalid = true
	try {
		const tmp = String(JSON.parse(showResult))
		if (!showResult.includes("{") && !showResult.includes("[")) {
			jsonvalid = false
		}
	} catch (e) {
		showResult = showResult.split("\'").join("\"")

		try {
			const tmp = String(JSON.parse(showResult))
			if (!showResult.includes("{") && !showResult.includes("[")) {
				jsonvalid = false
			}
		} catch (e) {
			jsonvalid = false
		}
	}

	const result = jsonvalid ? JSON.parse(showResult) : showResult
	//console.log("VALID: ", jsonvalid, result)
	return {
		"valid": jsonvalid, 
		"result": result,
	}
}

const MyView = (props) => {
  const { globalUrl, isLoggedIn, isLoaded, userdata} = props;
	document.title = "Shuffle - Workflows"

	const alert = useAlert()

	var upload = ""
	const [file, setFile] = React.useState("");

	const [workflows, setWorkflows] = React.useState([]);
	const [selectedWorkflow, setSelectedWorkflow] = React.useState({});
	const [selectedExecution, setSelectedExecution] = React.useState({});
	const [workflowExecutions, setWorkflowExecutions] = React.useState([]);
	const [firstrequest, setFirstrequest] = React.useState(true)
	const [workflowDone, setWorkflowDone] = React.useState(false)
	const [, setTrackingId] = React.useState("")
	const [selectedWorkflowId, setSelectedWorkflowId] = React.useState("")

	const [collapseJson, setCollapseJson] = React.useState(false)
	const [field1, setField1] = React.useState("")
	const [field2, setField2] = React.useState("")
	const [downloadUrl, setDownloadUrl] = React.useState("https://github.com/frikky/shuffle-workflows")
	const [downloadBranch, setDownloadBranch] = React.useState("master")
	const [loadWorkflowsModalOpen, setLoadWorkflowsModalOpen] = React.useState(false)

	const [modalOpen, setModalOpen] = React.useState(false);
	const [newWorkflowName, setNewWorkflowName] = React.useState("");
	const [newWorkflowDescription, setNewWorkflowDescription] = React.useState("");
	const [newWorkflowTags, setNewWorkflowTags] = React.useState([]);
	const [update, setUpdate] = React.useState("test");
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [editingWorkflow, setEditingWorkflow] = React.useState({})
	const [executionLoading, setExecutionLoading] = React.useState(false)
	const { start, stop } = useInterval({
	  	duration: 5000,
	  	startImmediate: false,
	  	callback: () => {
				//getWorkflowExecution(selectedWorkflow.id) 
	  	}
	})

	// DEBUG HERE 
	const handleClickLogout = () => {}

	const deleteModal = deleteModalOpen ? 
		<Dialog
			open={deleteModalOpen}
			onClose={() => {
				setDeleteModalOpen(false)
				setSelectedWorkflowId("")
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 500,
				},
			}}
		>
			<DialogTitle>
				<div style={{textAlign: "center", color: "rgba(255,255,255,0.9)"}}>
					Are you sure? <div/>Other workflows relying on this one may stop working
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)", textAlign: "center"}}>
				<Button style={{}} onClick={() => {
					console.log("Editing: ", editingWorkflow)
					if (selectedWorkflowId) {
						deleteWorkflow(selectedWorkflowId)		
						getAvailableWorkflows() 
					}
					setDeleteModalOpen(false)
				}} color="primary">
					Yes
				</Button>
				<Button variant="outlined" style={{}} onClick={() => {setDeleteModalOpen(false)}} color="primary">
					No
				</Button>
			</DialogContent>
			
		</Dialog>
	: null

	const getAvailableWorkflows = () => {
		fetch(globalUrl+"/api/v1/workflows", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  		credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!")
				return 
			}
			return response.json()
		})
    	.then((responseJson) => {
			setSelectedExecution({})
			setWorkflowExecutions([])

			if (responseJson !== undefined) {
				setWorkflows(responseJson)
					setWorkflowDone(true)
			} else {
				if (isLoggedIn) {
					alert.error("An error occurred while loading workflows")
				} else {
					handleClickLogout() 
				}

				return
			}

			if (responseJson.length > 0){
				setSelectedWorkflow(responseJson[0])
				//getWorkflowExecution(responseJson[0].id)
			}
    	})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	useEffect(() => {
		if (workflows.length <= 0 && firstrequest) {
			setFirstrequest(false)
			getAvailableWorkflows()
		}
	})

	const viewStyle = {
		color: "#ffffff",
		width: "100%",
		display: "flex",
		minWidth: 1024,
		maxWidth: 1024,
		margin: "auto",
		/*maxHeight: "90vh",*/
	}

	const emptyWorkflowStyle = {
		paddingTop: "200px", 
		width: 1024,
		margin: "auto",
	}

	const boxStyle = {
		padding: "20px 20px 20px 20px",
		width: "100%",
		height: "250px",
		color: "white",
		backgroundColor: surfaceColor,
		display: "flex", 
		flexDirection: "column",
	}


	const scrollStyle = {
		marginTop: "10px",
		overflow: "scroll",
		height: "90%",
		overflowX: "hidden",
		overflowY: "auto",
	}

	const paperAppContainer = {
		cursor: "pointer",
		display: "flex",
		flexWrap: 'wrap',
		alignContent: "space-between",
	}

	const paperAppStyle = {
		minHeight: "148px",
		width: "333px",
		margin: "10px",
		color: "white",
		backgroundColor: surfaceColor,
		borderRadius: 5, 
		padding: "10px",
		cursor: "pointer",
		display: "flex",
		boxSizing: "border-box",
	}

	const getWorkflowExecution = (id) => {
		setExecutionLoading(true)
		fetch(globalUrl+"/api/v1/workflows/"+id+"/executions", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			setExecutionLoading(false)
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.success === false) {
				alert.error("Failed getting executions")
			} else {
				if (responseJson.length > 0) {
					setSelectedExecution(responseJson[0])
					setWorkflowExecutions(responseJson)
				} else {
					//alert.info("Couldn't find executions for the workflow")
					setSelectedExecution({})
					setWorkflowExecutions([])
				}
			}
		})
		.catch(error => {
			setExecutionLoading(false)
			alert.error(error.toString())
		});
	}

	const abortExecution = (workflowid, executionid) => {
		alert.success("Aborting execution")
		fetch(globalUrl+"/api/v1/workflows/"+workflowid+"/executions/"+executionid+"/abort", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			}
			//getWorkflowExecution(workflowid) 

			return response.json()
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const executeWorkflow = (id) => {
		alert.show("Executing workflow "+id)
		setTrackingId(id)
		fetch(globalUrl+"/api/v1/workflows/"+id+"/execute", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			} 

			return response.json()
		})
    	.then((responseJson) => {
			if (!responseJson.success) {
				alert.error(responseJson.reason)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});

		if (id === selectedWorkflow.id) {
			sleep(2000).then(() => {
				stop()
				start()
			})
		}
	}

	function sleep (time) {
		return new Promise((resolve) => setTimeout(resolve, time));
	}

	const exportAllWorkflows = () => {
		for (var key in workflows) {
			exportWorkflow(workflows[key])
		}
	}

	const exportWorkflow = (data) => {
		console.log("export")
		let dataStr = JSON.stringify(data)

		let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
		let exportFileDefaultName = data.name+'.json';

		data["owner"] = ""
		for (var key in data.triggers) {
			const trigger = data.triggers[key]
			if (trigger.app_name === "Shuffle Workflow") {
				if (trigger.parameters.length > 2) {
					trigger.parameters[2].value = ""
				}
			} 
			
			if (trigger.status == "running") {
				trigger.status = "stopped"
			}
		}

		for (var key in data.actions) {
			data.actions[key].authentication_id = ""
		}

		//return

		data["org"] = []
		data["org_id"] = ""
		data.execution_org = {"id": ""}
		console.log(data)

		let linkElement = document.createElement('a');
		linkElement.setAttribute('href', dataUri);
		linkElement.setAttribute('download', exportFileDefaultName);
		linkElement.click();
	}

	const copyWorkflow = (data) => {
		data = JSON.parse(JSON.stringify(data))
		alert.success("Copying workflow "+data.name)
		console.log("data: ", data)
		data.id = ""
		data.name = data.name+"_copy"
		//return

		fetch(globalUrl+"/api/v1/workflows", {
    	  method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(data),
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!")
				return 
			}
			return response.json()
		})
    .then((responseJson) => {
			getAvailableWorkflows()
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const deleteWorkflow = (id) => {
		alert.success("Deleted workflow "+id)
		fetch(globalUrl+"/api/v1/workflows/"+id, {
    	  method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for setting workflows :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			getAvailableWorkflows()
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	// dropdown with copy etc I guess
	const WorkflowPaper = (props) => {
  	const { data } = props;
		const [open, setOpen] = React.useState(false);
		const [anchorEl, setAnchorEl] = React.useState(null);

		var boxWidth = "2px"
		if (selectedWorkflow.id === data.id) {
			boxWidth = "4px"
		}

		var boxColor = "orange"
		if (data.is_valid) {
			boxColor = "green"
		}

		const menuClick = (event) => {
			setOpen(!open)
			setAnchorEl(event.currentTarget);
		}

		const actions = data.actions !== null ? data.actions.length : 0
		var schedules = 0
		var webhooks = 0
		var webhookImg = ""
		var scheduleImg = "" 
		if (data.triggers !== undefined && data.triggers !== null && data.triggers.length > 0) {
			for (var key in data.triggers) {
				if (data.triggers[key].app_name === "Webhook") {
					webhooks += 1
					webhookImg = data.triggers[key].large_image
				} else if (data.triggers[key].app_name === "Schedule") {
					schedules += 1
					scheduleImg = data.triggers[key].large_image
				}
			}
		}

		const imgSize = 25
		return (
			<Paper square style={paperAppStyle}  onClick={(e) => {
			}}>	
				<div style={{width: boxWidth, backgroundColor: boxColor,}} onClick={() => {
							if (selectedWorkflow.id !== data.id) {
								setSelectedWorkflow(data)
								//getWorkflowExecution(data.id)
							}
						}}/>
				<Grid container style={{margin: "0px 10px 0px 10px", flex: 1}}>
					<Grid item style={{display: "flex", flexDirection: "column", width: "100%"}}>
						<Grid item style={{flex: 1, display: "flex"}}>
							<div onClick={() => {
								if (selectedWorkflow.id !== data.id) {
									setSelectedWorkflow(data)
									//getWorkflowExecution(data.id)
								}
							}}>
								<Typography variant="h6">
									{data.name}
								</Typography>
							</div>
						</Grid>
						<Grid item style={{flex: "1", display: "flex", width: "150px", justifyContent: "space-between", overflow: "hidden",}}>
							<Tooltip color="primary" title="Edit workflow" placement="bottom">
								<BubbleChartIcon/>
							</Tooltip>
							<Tooltip color="primary" title="Execute workflow" placement="bottom">
								<PlayArrowIcon color="secondary" disabled={!data.is_valid} onClick={() => executeWorkflow(data.id)} />
							</Tooltip>
							<Tooltip color="primary" title={`Actions: ${data.actions.length}`} placement="bottom">
								<AppsIcon />
							</Tooltip>
							{webhooks > 0 ? 
								<Tooltip color="primary" title={`Webhooks: ${webhooks}`} placement="bottom">
										<RestoreIcon />
								</Tooltip>
							: null}
							{schedules > 0 ? 
								<Tooltip color="primary" title={`Schedules: ${schedules}`} placement="bottom">
										<RestoreIcon />
								</Tooltip>
							: null}
						</Grid>
						<Grid item style={{flex: "1", justifyContent: "left", overflow: "hidden"}}>
							{data.tags !== undefined ?
								data.tags.map((tag, index) => {
									if (index >= 3) {
										return null
									}

									return (
										<Chip
											key={index}
											style={{height: 30, marginRight: 5, marginTop: 2, cursor: "pointer",}}
											label={tag}
											variant="outlined"
											color="primary"
										/>
									)
								})
							: null}
						</Grid>
					</Grid>
				</Grid>
				{data.actions !== undefined && data.actions !== null ? 
					<Grid item style={{display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
						<Grid>
								<IconButton
									aria-label="more"
									aria-controls="long-menu"
									aria-haspopup="true"
									style={{color: "white"}}
									onClick={menuClick}
									style={{padding:"0px",color:"white"}}
								  >
									<MoreVertIcon />
								</IconButton>
	  						<Menu
									id="long-menu"
									anchorEl={anchorEl}
									keepMounted
									open={open}
									onClose={() => {
										setOpen(false)
										setAnchorEl(null)
									}}
      					>
								<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
									setModalOpen(true)
									setEditingWorkflow(data)
									setNewWorkflowName(data.name)
									setNewWorkflowDescription(data.description)
									if (data.tags !== undefined && data.tags !== null) {
										setNewWorkflowTags(JSON.parse(JSON.stringify(data.tags)))
									}
								}} key={"change"}>{"Change details"}</MenuItem>
								<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
									copyWorkflow(data)		
									setOpen(false)
								}} key={"copy"}>{"Copy"}</MenuItem>
								<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
									exportWorkflow(data)		
									setOpen(false)
								}} key={"export"}>{"Export"}</MenuItem>
      					<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
									setDeleteModalOpen(true)
									setSelectedWorkflowId(data.id)
									setOpen(false)
								}} key={"delete"}>{"Delete"}</MenuItem>

      							</Menu>
							</Grid>
							<Grid>
								<Link to={"/workflows/"+data.id}>
									<Tooltip title="Edit workflow" placement="bottom">
											<EditIcon style={{background: "#F85A3E",
boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.16), 0px 2px 4px rgba(0, 0, 0, 0.12), 0px 1px 8px rgba(0, 0, 0, 0.1)",
borderRadius: "4px", color: "black", height: "30px", "width": "30px", fontSize: "small"}} />
									</Tooltip>
								</Link>	
							</Grid>
					</Grid>
				: null}
		</Paper>
		)
	}

	const executionPaper = (data) => {
		var boxWidth = "2px"
		if (selectedExecution.execution_id === data.execution_id) {
			boxWidth = "4px"
		} 

		var boxColor = "orange"
		if (data.status === "ABORTED" || data.status === "UNFINISHED" || data.status === "FAILURE"){
			boxColor = "red"	
		} else if (data.status === "FINISHED") {
			boxColor = "green"
		}

		var t = new Date(data.started_at*1000)
		if (data.workflow.actions === null || data.workflow.actions === undefined ) {
			return null
		}

		if (data.workflow.actions === null || data.workflow.actions === undefined) {
			return null
		}

		var actions = data.workflow.actions.length 
		if (data.results !== null) {
			var results = data.results.length
		}

		return (
			<Paper key={data.execution_id} square style={paperAppStyle} onClick={() => {
				setSelectedExecution(data)
			}}>
				<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: boxWidth, backgroundColor: boxColor}} />
				<Grid container style={{margin: "10px 10px 10px 10px", flex: 1}}>
					<Grid style={{display: "flex", flexDirection: "column", width: "100%"}}>
						<Grid item style={{flex: 1, display: "flex"}}>
							<div style={{flex: "5"}}>
								<h3 style={{marginBottom: "0px", marginTop: "10px"}}><b>Status</b>: {data.status}</h3>
								Actions: {results}/{actions}
							</div>
							<div style={{flex: "1", marginTop: "10px"}}>
								<Button style={{}} color="primary" disabled={data.status === "FAILURE" || data.status === "ABORTED" || data.status === "FINISHED"} variant="outlined" onClick={() => abortExecution(data.workflow_id, data.execution_id)}>Abort</Button> 				
							</div>
						</Grid>
						<div style={{display: "flex", flex: "1"}}>
							<Grid item style={{flex: "10", justifyContent: "center"}}>
								Started: {t.toISOString()}
							</Grid>
						</div>
					</Grid>
				</Grid>
			</Paper>
		)
	}

	const dividerColor = "rgb(225, 228, 232)"

	const resultPaperAppStyle = {
		minHeight: "100px",
		minWidth: "100%",
		overflow: "hidden",
		maxWidth: "100%",
		marginTop: "5px",
		color: "white",
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
	}

	function replaceAll(string, search, replace) {
		return string.split(search).join(replace);
	}

	const resultsPaper = (data) => {
		var boxWidth = "2px"
		var boxColor = "orange"
		if (data.status === "ABORTED" || data.status === "UNFINISHED" || data.status === "FAILURE"){
			boxColor = "red"	
		} else if (data.status === "FINISHED" || data.status === "SUCCESS") {
			boxColor = "green"
		} else if (data.status === "SKIPPED" || data.status === "EXECUTING") {
			boxColor = "yellow"
		} else {
			boxColor = "green"
		}

		var t = new Date(data.started_at*1000)
		var showResult = data.result.trim()
		const validate = validateJson(showResult)

		if (validate.valid) {
			showResult = <ReactJson 
				src={validate.result} 
				theme="solarized" 
				collapsed={collapseJson}
				displayDataTypes={false}
				name={"Results for "+data.action.label}
			/>
		} else {
			// FIXME - have everything parsed as json, either just for frontend
			// or in the backend?
			/*	
			const newdata = {"result": data.result}
			showResult = <ReactJson 
				src={JSON.parse(newdata)} 
				theme="solarized" 
				collapsed={collapseJson}
				displayDataTypes={false}
				name={"Results for "+data.action.name}
			/>
			*/
		}

		return (
			<Paper key={data.execution_id} square style={resultPaperAppStyle} onClick={() => {}}>
				<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", marginRight: "5px", width: boxWidth, backgroundColor: boxColor}}>
				</div>
				<Grid container style={{margin: "10px 10px 10px 10px", flex: "1"}}>
					<Grid style={{display: "flex", flexDirection: "column", width: "100%"}}>
						<Grid item style={{flex: "1"}}>
							<h4 style={{marginBottom: "0px", marginTop: "10px"}}><b>Name</b>: {data.action.label}</h4>
						</Grid>
						<Grid item style={{flex: "1", justifyContent: "center"}}>
							App: {data.action.app_name}, Version: {data.action.app_version}
						</Grid>
						<Grid item style={{flex: "1", justifyContent: "center"}}>
							Action: {data.action.name}, Environment: {data.action.environment}, Status: {data.status}
						</Grid>
						<div style={{display: "flex", flex: "1"}}>
							<Grid item style={{flex: "10", justifyContent: "center"}}>
								Started: {t.toISOString()}
							</Grid>
						</div>
						<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: dividerColor}}/>
						<div style={{display: "flex", flex: "1"}}>
							<Grid item style={{flex: "10", justifyContent: "center"}}>
								{showResult}
							</Grid>
						</div>
					</Grid>
				</Grid>
			</Paper>
		)
	}

	const resultsHandler = Object.getOwnPropertyNames(selectedExecution).length > 0 && selectedExecution.results !== null ? 
		<div>
			{selectedExecution.results.sort((a, b) => a.started_at - b.started_at).map((data, index) => {
				return (
					<div key={index}>
						{resultsPaper(data)}
					</div>
				)
			})}
		</div>
		:
		<div>
			No results yet 
		</div>

	const resultsLength = Object.getOwnPropertyNames(selectedExecution).length > 0 && selectedExecution.results !== null ? selectedExecution.results.length : 0 	

	const ExecutionDetails = () => {
		var starttime = new Date(selectedExecution.started_at*1000)
		var endtime = new Date(selectedExecution.started_at*1000)

		var parsedArgument = selectedExecution.execution_argument
		if (selectedExecution.execution_argument !== undefined && selectedExecution.execution_argument.length > 0) {
			parsedArgument = replaceAll(parsedArgument, " None", " \"None\"");
		}	

		var arg = null
		if (selectedExecution.execution_argument !== undefined && selectedExecution.execution_argument.length > 0) {
			var showResult = selectedExecution.execution_argument.trim()
			const validate = validateJson(showResult)

			arg = validate.valid ? 
				<ReactJson 
					src={validate.result} 
					theme="solarized" 
					collapsed={true}
					displayDataTypes={false}
					name={"Execution argument / webhook"}
				/>
			: showResult
		}

		var lastresult = null
		if (selectedExecution.result !== undefined && selectedExecution.result.length > 0) {
			var showResult = selectedExecution.result.trim()
			const validate = validateJson(showResult)
			lastresult = validate.valid ? 
				<ReactJson 
					src={validate.result} 
					theme="solarized" 
					collapsed={true}
					displayDataTypes={false}
					name={"Last result from execution"}
				/>
			: showResult
		}

		/*
		<div>
			ID: {selectedExecution.execution_id}
		</div>
		<div>
			<b>Last node:</b> {selectedExecution.workflow.actions.find(data => data.id === selectedExecution.last_node).actions[0].label}
		</div>
		*/
		if (Object.getOwnPropertyNames(selectedExecution).length > 0 && selectedExecution.workflow.actions !== null) {
			return (
				<div style={{overflowX: "hidden"}}>
					<div>
						<b>Status:</b> {selectedExecution.status}
					</div>
					<div>
						<b>Started:</b> {starttime.toISOString()}
					</div>
					<div>
						<b>Finished:</b> {endtime.toISOString()}
					</div>
					{/*
					<div>
						<b>Last Result:</b> {lastresult}
					</div>
					*/}
					<div style={{marginTop: 10}}>
						{arg}
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: dividerColor}}/>
					{resultsHandler}
				</div> 
			)
		}

		return (
			executionLoading ?
				<div style={{marginTop: 25, textAlign: "center"}}>
					<CircularProgress />
				</div>
				: 
				<h4>
					There are no executiondetails yet. Click "execute" to run your first one.
				</h4>
			
		)
	}

	const ExecutionsView = () => {
		if (workflowExecutions.length > 0) {
			const sortedWorkflows = workflowExecutions.sort((a, b) => a.started_at - b.started_at).reverse()

			return (
				<div>
				{sortedWorkflows.map(data => {
					return (
						executionPaper(data)
					)
				})}
				</div> 
			)
		} 
		return (
			executionLoading ?
				<div style={{marginTop: 25, textAlign: "center"}}>
					<CircularProgress />
				</div>
				:
				<h4>
					Executions have been moved to the Workflow itself. <div/><Link to={`/workflows/${selectedWorkflow.id}?view=executions`} style={{textDecoration: "none", color: "#f85a3e"}}>Click here to see them</Link>
				</h4>
		)
	}

	// Can create and set workflows
	const setNewWorkflow = (name, description, tags, editingWorkflow, redirect) => {

		var method = "POST"
		var extraData = ""
		var workflowdata = {}

		if (editingWorkflow.id !== undefined) {
			console.log("Building original workflow")
			method = "PUT"
			extraData = "/"+editingWorkflow.id
			workflowdata = editingWorkflow

			console.log("REMOVING OWNER")
			workflowdata["owner"] = ""	
			// FIXME: Loop triggers and turn them off?
		}

		workflowdata["name"] = name 
		workflowdata["description"] = description 
		if (tags !== undefined) {
			workflowdata["tags"] = tags 
		}
		//console.log(workflowdata)
		//return

		return fetch(globalUrl+"/api/v1/workflows"+extraData, {
    	  method: method,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(workflowdata),
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!")
				return 
			}
			return response.json()
		})
    .then((responseJson) => {
			if (method === "POST" && redirect) {
				window.location.pathname = "/workflows/"+responseJson["id"] 
			} else if (!redirect) {
				// Update :)		
				getAvailableWorkflows()
			} else { 
				alert.info("Successfully changed basic info for workflow")
			}

			return responseJson
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}


	const importFiles = (event) => {
		console.log("Importing!")
		const file = event.target.value
		if (event.target.files.length > 0) {
			for (var key in event.target.files) {
				const file = event.target.files[key]
				if (file.type !== "application/json") {
					if (file.type !== undefined) {
						alert.error("File has to contain valid json")
					}

					continue
				}

  			const reader = new FileReader()
				// Waits for the read
	  		reader.addEventListener('load', (event) => {
					var data = reader.result
					try {
						data = JSON.parse(reader.result)
					} catch (e) {
						alert.error("Invalid JSON: "+e)
						return
					}

					// Initialize the workflow itself
					const ret = setNewWorkflow(data.name, data.description, data.tags, {}, false)
					.then((response) => {
						if (response !== undefined) {
							// SET THE FULL THING
							data.id = response.id

							// Actually create it
							const ret = setNewWorkflow(data.name, data.description, data.tags, data, false)
							.then((response) => {
								if (response !== undefined) {
									alert.success("Successfully imported "+data.name)
								}
							})
						}
					})
					.catch(error => {
						alert.error("Import error: "+error.toString())
					});
				})

				// Actually reads
		  	reader.readAsText(file)
			}
		}

		setLoadWorkflowsModalOpen(false)
	}

	const modalView = modalOpen ? 
		<Dialog 
			open={modalOpen} 
			onClose={() => {setModalOpen(false)}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
				},
			}}
		>
			<DialogTitle>
				<div style={{color: "rgba(255,255,255,0.9)"}}>
					{editingWorkflow.id !== undefined ? "Editing" : "New"} workflow
					<div style={{float: "right"}}>
						<Tooltip color="primary" title={"Import manually"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => upload.click()}>
								<PublishIcon />
							</Button> 				
						</Tooltip>
					</div>
				</div>
			</DialogTitle>
			<FormControl>
				<DialogContent>
					<TextField
						onBlur={(event) => setNewWorkflowName(event.target.value)}
						InputProps={{
							style:{
								color: "white",
							},
						}}
						color="primary"
						placeholder="Name"
						margin="dense"
						defaultValue={newWorkflowName}
						fullWidth
					  />
					<TextField
						onBlur={(event) => setNewWorkflowDescription(event.target.value)}
						InputProps={{
							style:{
								color: "white",
							},
						}}
						color="primary"
						defaultValue={newWorkflowDescription}
						placeholder="Description"
						margin="dense"
						fullWidth
					  />
					<ChipInput
						style={{marginTop: 10}}
						InputProps={{
							style:{
								color: "white",
							},
						}}
						placeholder="Tags"
						color="primary"
						fullWidth
						value={newWorkflowTags}
						onAdd={(chip) => {
							newWorkflowTags.push(chip)
							setNewWorkflowTags(newWorkflowTags)
						}}
						onDelete={(chip, index) => {
							newWorkflowTags.splice(index, 1)
							setNewWorkflowTags(newWorkflowTags)
							setUpdate("delete "+chip)
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button style={{}} onClick={() => {
						setNewWorkflowName("")
						setNewWorkflowDescription("")
						setEditingWorkflow({})
						setNewWorkflowTags([])
						setModalOpen(false)
					}} color="primary">
						Cancel
					</Button>
					<Button style={{}} disabled={newWorkflowName.length === 0} onClick={() => {
						console.log("Tags: ", newWorkflowTags)
						if (editingWorkflow.id !== undefined) {
							setNewWorkflow(newWorkflowName, newWorkflowDescription, newWorkflowTags, editingWorkflow, false)
							setNewWorkflowName("")
							setNewWorkflowDescription("")
							setEditingWorkflow({})
							setNewWorkflowTags([])
						} else {
							setNewWorkflow(newWorkflowName, newWorkflowDescription, newWorkflowTags, {}, true)
						}

						setModalOpen(false)
					}} color="primary">
	        	Submit	
	        </Button>
				</DialogActions>
			</FormControl>
		</Dialog>
		: null

		
		const viewSize = {
			workflowView: 4,
			executionsView: 3,
			executionResults: 4,
		}

		const workflowViewStyle = {
			flex: viewSize.workflowView, 
			marginLeft: "10px", 
			marginRight: "10px", 
		}

		if (viewSize.workflowView === 0) {
			workflowViewStyle.display = "none"
		}

		const workflowButtons = 
			<span>
				{workflows.length > 0 ?
					<Tooltip color="primary" title={"Create new workflow"} placement="top">
						<Button color="primary" style={{}} variant="text" onClick={() => setModalOpen(true)}><AddIcon /></Button> 				
					</Tooltip>
				: null}
				<Tooltip color="primary" title={"Import workflows"} placement="top">
					<Button color="primary" style={{}} variant="text" onClick={() => upload.click()}>
						<PublishIcon />
					</Button> 				
				</Tooltip>
				<input hidden type="file" multiple="multiple" ref={(ref) => upload = ref} onChange={importFiles} />
				{workflows.length > 0 ? 
					<Tooltip color="primary" title={`Download ALL workflows (${workflows.length})`} placement="top">
						<Button color="primary" style={{}} variant="text" onClick={() => {
							exportAllWorkflows()
						}}>
							<GetAppIcon />
						</Button> 				
					</Tooltip>
				: null}
				<Tooltip color="primary" title={"Download workflows"} placement="top">
					<Button color="primary" style={{}} variant="text" onClick={() => setLoadWorkflowsModalOpen(true)}>
						<CloudDownloadIcon />
					</Button> 				
				</Tooltip>
			</span>

		const WorkflowView = () => {
			if (workflows.length === 0) {
				return (
					<div style={emptyWorkflowStyle}>	
						<Paper style={boxStyle}>
							<div>
								<h2>Welcome to Shuffle</h2>
							</div>
							<div>
								<p>
									<b>Shuffle</b> is a flexible, easy to use, automation platform allowing users to integrate their services and devices freely. It's made to significantly reduce the amount of manual labor, and is focused on security applications. <a href="/docs/about" style={{textDecoration: "none", color: "#f85a3e"}}>Click here to learn more.</a>
								</p>
							</div>
							<div>
								If you want to jump straight into it, click here to create your first workflow: 
							</div>
							<div style={{display: "flex"}}>
								<Button color="primary" style={{marginTop: "20px",}} variant="outlined" onClick={() => setModalOpen(true)}>New workflow</Button> 				
								<span style={{paddingTop: 20, display: "flex",}}>
									<Typography style={{marginTop: 5, marginLeft: 30, marginRight: 15}}>
										..OR
									</Typography>
									{workflowButtons}
								</span>
							</div>
						</Paper>
					</div>
				)
			}

		return (
			<div style={viewStyle}>	
				<div style={workflowViewStyle}>
					<div style={{display: "flex"}}>
						<div style={{flex: "1"}}>
							<h2>Workflows</h2>
							<p>THIS IS SOME WORKFLOW INFORMATION WHY ISN’T IT GROWING THE CORRECT WAY.</p> 
						</div>
						<div style={{marginTop: 20}}>
							{workflowButtons}
						</div>
					</div>

					<div style={flexContainerStyle}>
						<div style={{...flexBoxStyle, ...activeWorkflowStyle}}>
							<div style={flexContentStyle}>
								<div ><img src={mobileImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>ACTIVE WORKFLOWS</div>
								</div>
							</div>
						</div>
						<div style={{...flexBoxStyle, ...availableWorkflowStyle}}>
							<div style={flexContentStyle}>
								<div><img src={bookImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>AVAILABE WORKFLOWS</div>
								</div>
							</div>
						</div>
						<div style={{...flexBoxStyle, ...notificationStyle}}>
							<div style={flexContentStyle}>
								<div><img src={bagImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>NOTIFICATIONS</div>
								</div>
							</div>
						</div>
					</div>

					<div style={paperAppContainer}>
						{workflows.map((data, index) => {
							return (
								<WorkflowPaper key={index} data={data} />
							)
						})}
					</div>
				</div>
			</div>
		)
	}

	const importWorkflowsFromUrl = (url) => {
		console.log("IMPORT WORKFLOWS FROM ", downloadUrl)

		const parsedData = {
			"url": url,
			"field_3": downloadBranch || 'master'
		}

		if (field1.length > 0) {
			parsedData["field_1"] = field1
		}

		if (field2.length > 0) {
			parsedData["field_2"] = field2
		}

		alert.success("Getting specific workflows from your URL.")
		var cors = "cors"
		fetch(globalUrl+"/api/v1/workflows/download_remote", {
    	method: "POST",
			mode: "cors",
			headers: {
				'Accept': 'application/json',
			},
			body: JSON.stringify(parsedData),
	  	credentials: "include",
		})
		.then((response) => {
			if (response.status === 200) {
				alert.success("Successfully loaded workflows from "+downloadUrl)
				getAvailableWorkflows()
			}

			return response.json()
		})
    .then((responseJson) => {
				console.log("DATA: ", responseJson)
				if (!responseJson.success) {
					if (responseJson.reason !== undefined) {
						alert.error("Failed loading: "+responseJson.reason)
					} else {
						alert.error("Failed loading")
					}
				}
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const handleGithubValidation = () => {
		importWorkflowsFromUrl(downloadUrl)
		setLoadWorkflowsModalOpen(false)
	}

	const workflowDownloadModalOpen = loadWorkflowsModalOpen ? 
		<Dialog 
			open={loadWorkflowsModalOpen}
			onClose={() => {
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle>
				<div style={{color: "rgba(255,255,255,0.9)"}}>
					Load workflows from github repo
					<div style={{float: "right"}}>
						<Tooltip color="primary" title={"Import manually"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => upload.click()}>
								<PublishIcon />
							</Button> 				
						</Tooltip>
					</div>
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)"}}>
				Repository (supported: github, gitlab, bitbucket)
				<TextField
					style={{backgroundColor: inputColor}}
					variant="outlined"
					margin="normal"
					defaultValue={userdata.active_org.defaults.workflow_download_repo !== undefined && userdata.active_org.defaults.workflow_download_repo.length > 0 ? userdata.active_org.defaults.workflow_download_repo : downloadUrl}
					InputProps={{
						style:{
							color: "white",
							height: "50px",
							fontSize: "1em",
						},
					}}
					onChange={e => setDownloadUrl(e.target.value)}
					placeholder="https://github.com/frikky/shuffle-apps"
					fullWidth
					/>

					<span style={{marginTop: 10}}>Branch (default value is "master"):</span>
					<div style={{display: "flex"}}>
						<TextField
							style={{backgroundColor: inputColor}}
							variant="outlined"
							margin="normal"
							defaultValue={userdata.active_org.defaults.workflow_download_branch !== undefined && userdata.active_org.defaults.workflow_download_branch.length > 0 ? userdata.active_org.defaults.workflow_download_branch : downloadBranch}
							InputProps={{
								style:{
									color: "white",
									height: "50px",
									fontSize: "1em",
								},
							}}
							onChange={e => setDownloadBranch(e.target.value)}
							placeholder="master"
							fullWidth
							/>
					</div>

				<span style={{marginTop: 10}}>Authentication (optional - private repos etc):</span>
				<div style={{display: "flex"}}>
					<TextField
						style={{flex: 1, backgroundColor: inputColor}}
						variant="outlined"
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								height: "50px",
								fontSize: "1em",
							},
						}}
						onChange={e => setField1(e.target.value)}
						type="username"
						placeholder="Username / APIkey (optional)"
						fullWidth
						/>
					<TextField
						style={{flex: 1, backgroundColor: inputColor}}
						variant="outlined"
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								height: "50px",
								fontSize: "1em",
							},
						}}
						onChange={e => setField2(e.target.value)}
						type="password"
						placeholder="Password (optional)"
						fullWidth
						/>
				</div>
			</DialogContent>
			<DialogActions>
				<Button style={{borderRadius: "0px"}} onClick={() => setLoadWorkflowsModalOpen(false)} color="primary">
					Cancel
				</Button>
	      <Button style={{borderRadius: "0px"}} disabled={downloadUrl.length === 0 || !downloadUrl.includes("http")} onClick={() => {
					handleGithubValidation() 
				}} color="primary">
	        Submit	
	      </Button>
			</DialogActions>
		</Dialog>
		: null

	const loadedCheck = isLoaded && isLoggedIn && workflowDone ? 
		<div>
			<WorkflowView />
			{modalView}
			{deleteModal}
			{workflowDownloadModalOpen}
		</div>
		:
		<div style={{paddingTop: 250, width: 250, margin: "auto", textAlign: "center"}}>
			<CircularProgress />
			<Typography>
				Loading Workflows
			</Typography>
		</div>


	// Maybe use gridview or something, idk
	return (
		<div>
			{loadedCheck}
		</div>
	)
}

export default MyView 
