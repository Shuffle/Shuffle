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
import Switch from '@material-ui/core/Switch';

import CircularProgress from '@material-ui/core/CircularProgress';
import CachedIcon from '@material-ui/icons/Cached';
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

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';

const inputColor = "#383B40"
const surfaceColor = "#27292D"

const Workflows = (props) => {
  const { globalUrl, isLoggedIn, isLoaded, } = props;
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

	const [collapseJson, setCollapseJson] = React.useState(false)
	const [field1, setField1] = React.useState("")
	const [field2, setField2] = React.useState("")
	const [downloadUrl, setDownloadUrl] = React.useState("https://github.com/frikky/shuffle-workflows")
	const [loadWorkflowsModalOpen, setLoadWorkflowsModalOpen] = React.useState(false)

	const [modalOpen, setModalOpen] = React.useState(false);
	const [newWorkflowName, setNewWorkflowName] = React.useState("");
	const [newWorkflowDescription, setNewWorkflowDescription] = React.useState("");
	const [editingWorkflow, setEditingWorkflow] = React.useState({})
	const { start, stop } = useInterval({
	  	duration: 5000,
	  	startImmediate: false,
	  	callback: () => {
				getWorkflowExecution(selectedWorkflow.id) 
	  	}
	});

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
			console.log(responseJson)
			setSelectedExecution({})
			setWorkflowExecutions([])

			if (responseJson !== undefined) {
				setWorkflows(responseJson)
					setWorkflowDone(true)
			} else {
				if (isLoggedIn) {
					alert.error("An error occurred while loading workflows")
				} else {
					window.location = "/login"
				}

				return
			}

			if (responseJson.length > 0){
				setSelectedWorkflow(responseJson[0])
				getWorkflowExecution(responseJson[0].id)
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
		maxWidth: "1768px",
		margin: "auto",
		maxHeight: "90vh",
	}

	const emptyWorkflowStyle = {
		paddingTop: "200px", 
		width: "1024px",
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
		overflowX: "auto",
		overflowY: "auto",
	}

	const paperAppStyle = {
		minHeight: "100px",
		maxHeight: "100px",
		minWidth: "100%",
		maxWidth: "100%",
		marginTop: "5px",
		color: "white",
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
	}

	const getWorkflowExecution = (id) => {
		fetch(globalUrl+"/api/v1/workflows/"+id+"/executions", {
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
				alert.error("Failed loading executions for current workflow")
			}

			return response.json()
		})
		.then((responseJson) => {
			setWorkflowExecutions(responseJson)
			if (responseJson.length > 0) {
				setSelectedExecution(responseJson[0])
			}
		})
		.catch(error => {
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
			getWorkflowExecution(workflowid) 

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

	const exportWorkflow = (data) => {
		console.log("export")
		let dataStr = JSON.stringify(data)
		let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
		let exportFileDefaultName = data.name+'.json';

		let linkElement = document.createElement('a');
		linkElement.setAttribute('href', dataUri);
		linkElement.setAttribute('download', exportFileDefaultName);
		linkElement.click();
	}

	const copyWorkflow = (data) => {
		alert.success("Copying workflow "+data.name)
		data.id = ""
		data.name = data.name+"_copy"

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

		return (
			<Paper square style={paperAppStyle} onClick={(e) => {
			}}>
				<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: boxWidth, backgroundColor: boxColor}}>
				</div>
				<Grid container style={{margin: "10px 10px 10px 10px", flex: "1"}}>
					<Grid style={{display: "flex", flexDirection: "column", width: "100%"}}>
						<Grid item style={{flex: "1", display: "flex"}}>
							<div style={{flex: "10",}} onClick={() => {
								if (selectedWorkflow.id !== data.id) {
									setSelectedWorkflow(data)
									getWorkflowExecution(data.id)
								}
							}}>
								<h3 style={{marginBottom: "0px", marginTop: "10px"}}>{data.name}</h3>
							</div>
							<div style={{flex: "1"}}>
								<IconButton
									aria-label="more"
									aria-controls="long-menu"
									aria-haspopup="true"
									style={{color: "white"}}
									onClick={menuClick}
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

								<MenuItem style={{backgroundColor: surfaceColor, color: "white"}} onClick={() => {
									setModalOpen(true)
									setEditingWorkflow(data)
									setNewWorkflowName(data.name)
									setNewWorkflowDescription(data.description)
								}} key={"change"}>{"Change name"}</MenuItem>
								<MenuItem style={{backgroundColor: surfaceColor, color: "white"}} onClick={() => {
									copyWorkflow(data)		
									setOpen(false)
								}} key={"copy"}>{"Copy"}</MenuItem>
								<MenuItem style={{backgroundColor: surfaceColor, color: "white"}} onClick={() => {
									exportWorkflow(data)		
									setOpen(false)
								}} key={"export"}>{"Export"}</MenuItem>
      							<MenuItem style={{backgroundColor: surfaceColor, color: "white"}} onClick={() => {
									deleteWorkflow(data.id)		
									setOpen(false)
								}} key={"delete"}>{"Delete"}</MenuItem>

      							</Menu>
							</div>
						</Grid>
						<div style={{display: "flex", flex: "1"}} onClick={() => {
							if (selectedWorkflow.id !== data.id) {
								setSelectedWorkflow(data)
								getWorkflowExecution(data.id)
							}
						}}>
							<Grid item style={{flex: "1", justifyContent: "center"}}>
								<Link to={"/workflows/"+data.id}>
									<Tooltip color="primary" title="Edit workflow" placement="bottom">
										<Button style={{}} color="primary" variant="text" style={{marginRight: 10}} onClick={() => {}}>
											<EditIcon style={{marginRight: 10}}/> Edit
										</Button> 				
									</Tooltip>
								</Link>
								<Tooltip color="primary" title="Execute workflow" placement="bottom">
									<Button style={{}} color="secondary" variant="text" onClick={() => executeWorkflow(data.id)}>
										<PlayArrowIcon />
									</Button> 				
								</Tooltip>
							</Grid>
						</div>
					</Grid>
				</Grid>
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

		var actions = data.workflow.actions.length 
		if (data.results !== null) {
			var results = data.results.length
		}
		return (
			<Paper square style={paperAppStyle} onClick={() => {
				setSelectedExecution(data)
			}}>
				<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: boxWidth, backgroundColor: boxColor}} />
				<Grid container style={{margin: "10px 10px 10px 10px", flex: "1"}}>
					<Grid style={{display: "flex", flexDirection: "column", width: "100%"}}>
						<Grid item style={{flex: "1", display: "flex"}}>
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
		var jsonvalid = true
		var showResult = data.result.trim()
		showResult = replaceAll(showResult, " None", " \"None\"");
		try {
			const tmp = String(JSON.parse(showResult))
			if (!tmp.includes("{") && !tmp.includes("[")) {
				jsonvalid = false
			}
		} catch (e) {
			jsonvalid = false
		}

		//console.log("VALID: ", jsonvalid)
		if (jsonvalid) {
			showResult = <ReactJson 
				src={JSON.parse(showResult)} 
				theme="solarized" 
				collapsed={collapseJson}
				displayDataTypes={false}
				name={"Results for "+data.action.label}
			/>
		} else {
			// FIXME - have everything parsed as json, either just for frontend
			// or in the backend
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
			<Paper square style={resultPaperAppStyle} onClick={() => {}}>
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
			{selectedExecution.results.sort((a, b) => a.started_at - b.started_at).map(data => {
				return (
					resultsPaper(data)
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
			var jsonvalid = true

			var showResult = selectedExecution.execution_argument.trim()
			showResult = replaceAll(showResult, " None", " \"None\"");

			try {
				const tmp = String(JSON.parse(showResult))
				if (!tmp.includes("{") && !tmp.includes("[")) {
					jsonvalid = false
				}
			} catch (e) {
				jsonvalid = false
			}

			arg = jsonvalid ? 
				<ReactJson 
					src={JSON.parse(showResult)} 
					theme="solarized" 
					collapsed={true}
					displayDataTypes={false}
					name={"Execution argument / webhook"}
				/>
			: showResult
		}

		var lastresult = null
		if (selectedExecution.result !== undefined && selectedExecution.result.length > 0) {
			var jsonvalid = true
			var showResult = selectedExecution.result.trim()
			showResult = replaceAll(showResult, " None", " \"None\"");

			try {
				const tmp = JSON.parse(showResult)
				if (!tmp.includes("{") && !tmp.includes("[")) {
					jsonvalid = false
				}
			} catch (e) {
				jsonvalid = false
			}

			lastresult = jsonvalid ? 
				<ReactJson 
					src={JSON.parse(showResult)} 
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
				<div>
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
			<h4>
				There are no executions for this workflow yet
			</h4>
		)
	}

	// Can create and set workflows
	const setNewWorkflow = (name, description, editingWorkflow, redirect) => {

		var method = "POST"
		var extraData = ""
		var workflowdata = {}

		if (editingWorkflow.id !== undefined) {
			method = "PUT"
			extraData = "/"+editingWorkflow.id
			workflowdata = editingWorkflow
		}

		workflowdata["name"] = name 
		workflowdata["description"] = description 
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
					const ret = setNewWorkflow(data.name, data.description, {}, false)
					.then((response) => {
						if (response !== undefined) {
							// SET THE FULL THING
							data.id = response.id

							// Actually create it
							const ret = setNewWorkflow(data.name, data.description, data, false)
							.then((response) => {
								if (response !== undefined) {
									alert.success("Successfully created "+data.name)
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
		<Dialog modal 
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
			<FormControl>
			<DialogTitle><div style={{color: "white"}}>{editingWorkflow.id !== undefined ? "Editing" : "New"} workflow</div></DialogTitle>
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

				</DialogContent>
				<DialogActions>
					<Button style={{}} onClick={() => setModalOpen(false)} color="primary">
						Cancel
					</Button>
					<Button style={{}} disabled={newWorkflowName.length === 0} onClick={() => {
						if (editingWorkflow.id !== undefined) {
							setNewWorkflow(newWorkflowName, newWorkflowDescription, editingWorkflow, false)
							setNewWorkflowName("")
							setNewWorkflowDescription("")
							setEditingWorkflow({})
						} else {
							setNewWorkflow(newWorkflowName, newWorkflowDescription, {}, true)
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
			workflowView: 1,
			executionsView: 1,
			executionResults: 2,
		}

		const workflowViewStyle = {
			flex: viewSize.workflowView, 
			marginLeft: "10px", 
			marginRight: "10px", 
		}

		if (viewSize.workflowView === 0) {
			workflowViewStyle.display = "none"
		}

		const workflowView = workflows.length > 0 ? 
		<div style={viewStyle}>	
			<div style={workflowViewStyle}>
				<div style={{display: "flex"}}>
					<div style={{flex: "4"}}>
						<h2>Workflows</h2> 
					</div>
					<div style={{marginTop: 20}}>
					 	<Tooltip color="primary" title={"Create new workflow"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => setModalOpen(true)}><AddIcon /></Button> 				
						</Tooltip>
						{/*
					 	<Tooltip color="primary" title={"Import workflows"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => upload.click()}>
								<PublishIcon />
							</Button> 				
						</Tooltip>
						*/}
					 	<Tooltip color="primary" title={"Download workflows"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => setLoadWorkflowsModalOpen(true)}>
								<CloudDownloadIcon />
							</Button> 				
						</Tooltip>
						<input hidden type="file" multiple="multiple" ref={(ref) => upload = ref} onChange={importFiles} />
					</div>
				</div>
				<Divider style={{marginBottom: "10px", height: "1px", width: "100%", backgroundColor: dividerColor}}/>

				<div style={scrollStyle}>
					{workflows.map(data => {
						return (
							<WorkflowPaper data={data} />
						)
					})}
				</div>
			</div>
			<div style={{flex: viewSize.executionsView, marginLeft: "10px", marginRight: "10px"}}>
				<div style={{display: "flex"}}>
					<div style={{flex: "10"}}>
						<h2>Executions: {selectedWorkflow.name}</h2> 
					</div>
					<div style={{flex: "1"}}>
						<Button color="primary" style={{marginTop: "20px"}} variant="text" onClick={() => {
								alert.info("Refreshing executions"); 
								getWorkflowExecution(selectedWorkflow.id)
							}}>
							<CachedIcon />
						</Button> 				
					</div>
				</div>
				<Divider style={{marginBottom: "10px", height: "1px", width: "100%", backgroundColor: dividerColor}}/>
				<div style={scrollStyle}>
					<ExecutionsView />
				</div>
			</div>
			<div style={{flex: viewSize.executionResults, marginLeft: "10px", marginRight: "10px", minWidth: "33%"}}>
				<div style={{display: "flex"}}>
					<div style={{flex: "3"}}>
						<h2>Execution Timeline</h2>
					</div>
					<div style={{flex: "1"}}>
				    	<FormControlLabel
							style={{color: "white", marginBottom: "0px", marginTop: "10px"}}
							label=<div style={{color: "white"}}>Collapse results</div>
							control={<Switch checked={collapseJson} onChange={() => {setCollapseJson(!collapseJson)}} />}
						/>
					</div>
				</div>
				<Divider style={{marginBottom: "10px", height: "1px", width: "100%", backgroundColor: dividerColor}}/>
				<div style={scrollStyle}>
					<ExecutionDetails />
				</div>
			</div>
		</div>
		: 
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
				<div>
					<Button color="primary" style={{marginTop: "20px",}} variant="outlined" onClick={() => setModalOpen(true)}>New workflow</Button> 				
				</div>
			</Paper>
		</div>


	const importWorkflowsFromUrl = (url) => {
		console.log("IMPORT WORKFLOWS FROM ", downloadUrl)

		const parsedData = {
			"url": url,
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
				response.text().then(function (text) {
					console.log("RETURN: ", text)
					alert.success("Loaded existing apps!")
				})
			}

			return response.json()
		})
    .then((responseJson) => {
				console.log("DATA: ", responseJson)
				if (responseJson.reason !== undefined) {
					alert.error("Failed loading: "+responseJson.reason)
				} else {
					alert.error("Failed loading")
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
		<Dialog modal 
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
					value={downloadUrl}
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
			{workflowView}
			{modalView}
			{workflowDownloadModalOpen}
		</div>
		:
		<div>
		</div>


	// Maybe use gridview or something, idk
	return (
		<div>
			{loadedCheck}
		</div>
	)
}

export default Workflows 
