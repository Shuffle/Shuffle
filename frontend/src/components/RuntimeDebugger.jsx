import React, { useState, useEffect } from 'react';

import { 
	TextField,
	Link,
	Button,
	CircularProgress,
	Select,
	MenuList,
	MenuItem,
	FormControl,
	InputLabel,
	Autocomplete,
	Tooltip,
	Typography,
} from '@mui/material';

import { toast } from "react-toastify" 
import { makeStyles } from "@mui/styles";
import theme from '../theme.jsx';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import Pagination from '@mui/material/Pagination';
import { triggers as alltriggers } from "../views/AngularWorkflow.jsx"
import { 
	DatePicker, 
	DateTimePicker,
	LocalizationProvider,
} from '@mui/x-date-pickers'

import {
	OpenInNew as OpenInNewIcon,
    PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';

import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid'

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
});

const RuntimeDebugger = (props) => {
	const { userdata, globalUrl, } = props

  	const classes = useStyles();

	const [workflowId, setWorkflowId] = useState("")
	const [status, setStatus] = useState("")
	const [endTime, setEndTime] = useState("")
	const [startTime, setStartTime] = useState("")

	const [workflow, setWorkflow] = useState({})
	const [searchLoading, setSearchLoading] = useState(false)
	const [rowCursor, setCursor] = useState("")
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const [resultRows, setResultRows] = useState([])
	const [workflows, setWorkflows] = useState([
		{"id": "", "name": "All Workflows",}
	])
	/*
	[
		{id: "1", execution_id: "1", status: "FINISHED", startTimestamp: "2021-10-01 12:00:00", endTimestamp: "2021-10-01 12:00:00", workflow: {"id": "1234", "name": "what",}},
		{id: "2", execution_id: "2", status: "WAITING", startTimestamp: "2021-10-01 12:00:00", endTimestamp: "2021-10-01 12:00:00", workflow: {"id": "1234", "name": "what",}},
		{id: "3", execution_id: "3", status: "EXECUTING",startTimestamp: "2021-10-01 12:00:00", endTimestamp: "2021-10-01 12:00:00", workflow: {"id": "1234", "name": "what",}},
		{id: "4", execution_id: "4", status: "ABORTED", startTimestamp: "2021-10-01 12:00:00", endTimestamp: "2021-10-01 12:00:00", workflow: {"id": "1234", "name": "what",}},
	]);
	*/

	const submitSearch = (workflowId, status, startTime, endTime, cursor, limit) => {

		//setResultRows([])
		setSearchLoading(true)
		const fetchData = {
			workflow_id: workflowId,
			cursor: cursor,
			limit: limit,

			status: status.toUpperCase(),
			start_time: startTime,
			end_time: endTime,
		}

		fetch(`${globalUrl}/api/v1/workflows/search`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(fetchData),
		})
		.then((response) => response.json())
		.then((data) => {
			setSearchLoading(false)
			if (data.success) {
				if (data.runs !== undefined && data.runs !== null && data.runs.length > 0) {
					for (let key in data.runs) {
						data.runs[key].id = data.runs[key].execution_id

						// make started_at field into ISO string
						//data.runs[key].endTimestamp = data.runs[key].ended_at.toISOString().slice(0, 19).replace('T', ' ')
						const startTimestamp = new Date(data.runs[key].started_at*1000)
						data.runs[key].startTimestamp = startTimestamp.toISOString().slice(0, 19).replace('T', ' ')

						const endTimestamp = new Date(data.runs[key].completed_at*1000)
						data.runs[key].endTimestamp = endTimestamp.toISOString().slice(0, 19).replace('T', ' ')
						if (data.runs[key].completed_at === 0 || data.runs[key].completed_at === null) {
							data.runs[key].endTimestamp = ""
						}
					}


					// Add 20 empty rows to the end of the resultRows array
					// This is to make sure that the scrollbar is always visible
					setResultRows(data.runs)
				} else {
					toast("No results found. Keeping old runs")
				}
			} else {
				toast("Failed to search for runs. Please try again.")
			}
		})
		.catch((error) => {
			setSearchLoading(false)
			console.error("Error:", error);
			toast("Failed to search for runs. Please try again (2)")
		})
	}

	  const getAvailableWorkflows = () => {
		fetch(globalUrl + "/api/v1/workflows", {
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
		  if (responseJson !== undefined) {
			  var foundWorkflows = [{"id": "", "name": "All Workflows",}]
			  foundWorkflows.push(...responseJson)
			  setWorkflows(foundWorkflows)
		  }
		})
		.catch((error) => {
		  console.log("Error getting workflows: " + error);
		})
	  }

	useEffect(() => {
	  	getAvailableWorkflows()

		// Find workflow_id in url query
		const urlParams = new URLSearchParams(window.location.search);
		const workflowId = urlParams.get('workflow_id');
		if (workflowId !== undefined && workflowId !== null && workflowId !== "" && workflowId.length === 36) {
			setWorkflowId(workflowId)

			// find the workflow in workflows and select it
			for (let key in workflows) {
				if (workflows[key].id === workflowId) {
					setWorkflow(workflows[key])
					break
				}
			}
		}

		const foundStatus = urlParams.get('status');
		if (foundStatus !== undefined && foundStatus !== null && foundStatus !== "") {
			setStatus(foundStatus)
		}
	}, [])

	const imageSize = 30
	const timenowUnix = Math.floor(Date.now() / 1000)
	const columns: GridColDef[] = [
		{
			field: 'execution_source',
			headerName: 'Source',
			width: 75,
			renderCell: (params) => {
				var foundSource = <PlayArrowIcon style={{color: theme.palette.primary.main, height: imageSize, width: imageSize, }} />

				var source = params.row.execution_source
				if (source === "schedule") {
					foundSource = <img src={alltriggers[1].large_image} alt="schedule" style={{borderRadius: theme.palette.borderRadius, height: imageSize, width: imageSize, }} />
				} else if (source === "webhook") {
					foundSource = <img src={alltriggers[0].large_image} alt="webhook" style={{borderRadius: theme.palette.borderRadius, height: imageSize, width: imageSize, }} />
				} else if (source === "subflow" || source.length === 36) {
					foundSource = <img src={alltriggers[4].large_image} alt="subflow" style={{borderRadius: theme.palette.borderRadius, height: imageSize, width: imageSize, }} />
					source = "subflow"
				} else {
					source = "manual"
				}

				return (
					<span style={{}} onClick={() => {
						//setStatus(params.row.status)
					}}>
						<Tooltip title={source} placement="top">
							{foundSource}
						</Tooltip>
					</span>
				)
			},
	    },
		{
			field: 'status',
			headerName: 'Status',
			width: 100,
			renderCell: (params) => (
				<span style={{cursor: "pointer", }} onClick={() => {
					setStatus(params.row.status)
				}}>
					{params.row.status}
				</span>
			),
	    },
	    {
			field: 'workflow.name',
			headerName: 'Workflow Name',
			width: 250,
			renderCell: (params) => (
				<span style={{cursor: "pointer", }} onClick={() => {
					setWorkflowId(params.row.workflow.id)

					for (let key in workflows) {
						if (workflows[key].id === params.row.workflow.id) {
							setWorkflow(workflows[key])
							break
						}
					}
				}}>
					{params.row.workflow.name}
				</span>
			),
		  },

	      {
			field: 'workflow results',
			headerName: 'Results',
			width: 75,
			renderCell: (params) => {
				//console.log("PARAMS: ", params)
				var extraItems = 0
				if (params.row.workflow.triggers !== null) {
					for (let key in params.row.workflow.triggers) {
						if (params.row.workflow.triggers[key].app_name === "User Input" || params.row.workflow.triggers[key].app_name === "Shuffle Workflow") { 
							extraItems += 1
						}
					}
				}
				
				const actionLength = params.row.workflow.actions === null ? 0 : params.row.workflow.actions.length+extraItems
				const resultLength = params.row.results === null ? 0 : params.row.results.length

				//console.log("actionLength: ", actionLength, " resultLength: ", resultLength)
				return (
					<span style={{}} onClick={() => {
					}}>
						{resultLength} / {actionLength} 
					</span>
				)
			},
		  },
	      {
			field: 'finished',
			headerName: 'Finished',
			width: 75,
			renderCell: (params) => {
				var foundItems = 0
				var extraItems = 0
				if (params.row.results !== null && params.row.results !== undefined) {
					for (let key in params.row.results) {
						if (params.row.results[key].status === "SUCCESS") {
							foundItems += 1
						}
					}
				}

				return (
					<span style={{}} onClick={() => {
					}}>
						{foundItems} 
					</span>
				)
			},
		  },
	      {
			field: 'skipped',
			headerName: 'Skipped',
			width: 75,
			renderCell: (params) => {
				var foundItems = 0
				var extraItems = 0
				if (params.row.results !== null && params.row.results !== undefined) {
					for (let key in params.row.results) {
						if (params.row.results[key].status === "SKIPPED") {
							foundItems += 1
						}
					}
				}

				return (
					<span style={{}} onClick={() => {
					}}>
						{foundItems} 
					</span>
				)
			},
		  },
		{ field: 'startTimestamp', headerName: 'Start time (UTC)', width: 160, 
			renderCell: (params) => {
				const comparisonTimestamp = params.row.completed_at === 0 ? timenowUnix : params.row.completed_at
				const hasError = comparisonTimestamp-params.row.started_at > 300 

				return (
					<Tooltip title={hasError ? "More than 5 minutes from start to finish" : ""} placement="top">
						<span style={{cursor: "pointer", backgroundColor: !hasError ? "inherit" : "rgba(244,0,0,0.4)",}} onClick={() => {
							console.log("Zoom in on end timestamp is this one: ", params.row.endTimestamp)
							//setEndTimestamp(params.row.endTimestamp)

							// Make a new Date() from params.row.startTimestamp and set it in the endTime
							const newEndTime = new Date(params.row.startTimestamp)
							if (newEndTime !== null && newEndTime !== undefined && newEndTime !== "" && newEndTime !== "Invalid Date") {
								// Translate newEndTime to UTC no matter what timezone we are in. Based it on local()
								// Plus 1 minute to make sure it comes in
								setEndTime(dayjs(newEndTime.setMinutes(newEndTime.getMinutes()+1)))

								// Use dayjs to translate it into something useful

								// Remove 5 minutes from it and set startTime
								//newEndTime.setMinutes(newEndTime.getMinutes()-5)
								//setStartTime(dayjs(newEndTime))
							}
						}}>
							{params.row.startTimestamp}
						</span>
					</Tooltip>
				)
			}
		},
		{ field: 'endTimestamp', headerName: 'End time (UTC)', width: 160, },
	    {
			field: 'id',
			headerName: 'Explore',
			width: 65,
			renderCell: (params) => {
				const parsedResult = params.row.result === null || params.row.result === undefined || params.row.result === "" ? null : params.row.result
				const hasError = parsedResult !== null && parsedResult !== undefined && parsedResult !== "" ? parsedResult.includes("{%") && parsedResult.includes("%}") : false

				return (
				  <Tooltip arrow placement="right" title={
					  <Typography variant="body2" style={{whiteSpace: "pre-line", }}>
						{params.row.result !== null && params.row.result !== undefined && params.row.result !== "" ?
						  params.row.result
						  : 
						  null
						}
					  </Typography>
				  }>
					<span style={{backgroundColor: !hasError ? "inherit" : "rgba(244,0,0,0.6)", }}>
					  <Link href={`/workflows/${params.row.workflow.id}?execution_id=${params.row.id}`} target="_blank" rel="noopener noreferrer">
						<OpenInNewIcon fontSize="small" />
					  </Link>
					</span>
				</Tooltip>
				)
			}
		  },
	]

	useEffect(() => {
		// Check if the user is currently focusing a texxtfield or not
		// If they are, don't submit the search
		if (document.activeElement.tagName === "INPUT") {
			console.log("User is focusing a textfield, not submitting search")
			return
		}

		submitSearch(workflowId, status, startTime, endTime, rowCursor, rowsPerPage)
	}, [workflowId, status, startTime, endTime])

	const textfieldStyle = {
		marginTop: 7,
		marginLeft: 5, 
	}

	const handleStartTimeChange = (date) => {
		setStartTime(date)
	}
	
	const handleEndTimeChange = (date) => {
		setEndTime(date)
	}

	const handleWorkflowSelectionUpdate = (e, isUserinput) => {
		if (e.target.value === undefined || e.target.value === null || e.target.value.id === undefined) {
			console.log("Returning as there's no id")
			return null
		}

		console.log("DATA: ", e.target.value)

		setWorkflow(e.target.value)
		setWorkflowId(e.target.value.id)

		submitSearch(e.target.value.id, status, startTime, endTime, rowCursor, rowsPerPage)
	}

	return (
		<div style={{minWidth: 1150, maxWidth: 1150, margin: "auto", }}>
			<h1>Workflow Run Debugger</h1>
			<form onSubmit={(e) => {
				submitSearch(workflowId, status, startTime, endTime, rowCursor, rowsPerPage)
			}} style={{display: "flex", }}>
				<FormControl fullWidth style={{marginTop: 5, }}>
				  <InputLabel id="status-label">Status</InputLabel>
				  <Select
					labelId="status-label"
					id="status-label-select"
					value={status}
					label="Status"
					onChange={(event) => {
						console.log("Changed: ", event.target)
						setStatus(event.target.value)
					}}
				  >
					<MenuItem value="">No selection</MenuItem>
					<MenuItem value="FINISHED">FINISHED</MenuItem>
					<MenuItem value="EXECUTING">EXECUTING</MenuItem>
					<MenuItem value="WAITING">WAITING</MenuItem>
					<MenuItem value="ABORTED">ABORTED</MenuItem>
				  </Select>
				</FormControl>
				{/*
				<TextField
					label="Workflow ID"
					fullWidth
					value={workflowId}
					onChange={(e) => {
						setWorkflowId(e.target.value)
					}}
					style={textfieldStyle}
				/>
				*/}
				<Autocomplete
				  id="workflow_search"
				  value={workflow}
				  classes={{ inputRoot: classes.inputRoot }}
				  ListboxProps={{
					style: {
					  backgroundColor: theme.palette.inputColor,
					  color: "white",
					},
				  }}
				  getOptionLabel={(option) => {
					if (
					  option === undefined ||
					  option === null ||
					  option.name === undefined ||
					  option.name === null
					) {
					  return "No Workflow Selected";
					}

					const newname = (
					  option.name.charAt(0).toUpperCase() + option.name.substring(1)
					).replaceAll("_", " ");
					return newname;
				  }}
				  options={workflows}
				  fullWidth
				  style={{
					backgroundColor: theme.palette.inputColor,
					height: 50,
					borderRadius: theme.palette.borderRadius,
					marginTop: 5, 
					marginLeft: 5,
				  }}
				  onChange={(event, newValue) => {
					console.log("Found value: ", newValue)

					var parsedinput = { target: { value: newValue } }

					// For variables
					if (typeof newValue === 'string' && newValue.startsWith("$")) {
						parsedinput = { 
							target: { 
								value: {
									"name": newValue, 
									"id": newValue,
									"actions": [],
									"triggers": [],
								} 
							} 
						}
					}

					handleWorkflowSelectionUpdate(parsedinput)
				  }}
				  renderOption={(props, data, state) => {
					if (data.id === workflow.id) {
					  data = workflow;
					}

					return (
					  <Tooltip arrow placement="left" title={
						<span style={{}}>
						  {data.image !== undefined && data.image !== null && data.image.length > 0 ?
							<img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette.borderRadius, }} />
							: null}
						  <Typography>
							Choose {data.name}
						  </Typography>
						</span>
					  } placement="bottom">
						<MenuItem
						  style={{
							backgroundColor: theme.palette.inputColor,
							color: data.id === workflow.id ? "red" : "white",
						  }}
						  value={data}
						  onClick={(e) => {
							var parsedinput = { target: { value: data } }
							handleWorkflowSelectionUpdate(parsedinput)
						  }}
						>
						  {data.name}
						</MenuItem>
					  </Tooltip>
					)
				  }}
				  renderInput={(params) => {
					return (
					  <TextField
						style={{
						  backgroundColor: theme.palette.inputColor,
						  borderRadius: theme.palette.borderRadius,
						}}
						{...params}
						label="Workflow"
						variant="outlined"
					  />
					);
				  }}
				/>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
		        	<DateTimePicker
					  sx={{
						marginTop: 1, 
						marginLeft: 1,
						minWidth: 240,
					    maxWidth: 240,
					  }}
					  ampm={false}
					  label="Search from"
					  format="YYYY-MM-DD HH:mm:ss"
					  value={startTime}
					  onChange={handleStartTimeChange}
					  renderInput={(params) => <TextField {...params} />}
					/>
					<DateTimePicker
					  sx={{
						marginTop: 1, 
						marginLeft: 1,
						minWidth: 240,
					    maxWidth: 240,
					  }}
					  ampm={false}
					  label="Search until"
					  format="YYYY-MM-DD HH:mm:ss"
					  value={endTime}
					  onChange={handleEndTimeChange}
					  renderInput={(params) => <TextField {...params} />}
					/>

				</LocalizationProvider>
				<Button
					variant="contained"
					color="primary"
					onClick={() => {
						submitSearch(workflowId, status, startTime, endTime, rowCursor, rowsPerPage) 
					}}
					disabled={searchLoading}
					style={{height: 50, minWidth: 100, marginTop: 15, marginLeft: 10, }}
				>
					{searchLoading ? <CircularProgress size={30} /> : "Search"}
				</Button>
			</form>
			<div style={{height: 700, padding: "10px 0px 10px 0px", }}>
				<DataGrid
					rows={resultRows}
					columns={columns}
					pageSize={rowsPerPage}
					rowsPerPageOptions={[10, 20, 50, 100]}
					checkboxSelection
					disableSelectionOnClick
					onPageSizeChange={(newPageSize) => {
						setRowsPerPage(newPageSize)
						submitSearch(workflowId, status, startTime, endTime, rowCursor, newPageSize) 
					}}
					// event for when clicking next page
					// Hide page changer
					onPageChange={(params) => {
						console.log("params: ", params)
					}}
				  />
			</div> 
		</div>
	)
}

export default RuntimeDebugger;
