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
import { 
	DatePicker, 
	DateTimePicker,
	LocalizationProvider,
} from '@mui/x-date-pickers'

import {
	OpenInNew as OpenInNewIcon,
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

	//const [workflowId, setWorkflowId] = useState("");
	//const [status, setStatus] = useState("FINISHED");
	//const [endTime, setEndTime] = useState(dayjs().subtract(0, 'day'))
	//const [startTime, setStartTime] = useState(dayjs().subtract(30, 'day'))

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

		setResultRows([])
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
					}


					// Add 20 empty rows to the end of the resultRows array
					// This is to make sure that the scrollbar is always visible
					setResultRows(data.runs)
				}
			} else {
				console.error("Search error: ", data.reason)
			}
		})
		.catch((error) => {
			setSearchLoading(false)
			console.error("Error:", error);
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

	const columns: GridColDef[] = [
		{
			field: 'status',
			headerName: 'Status',
			width: 150,
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
		{ field: 'startTimestamp', headerName: 'Start time', width: 160, },
		{ field: 'endTimestamp', headerName: 'End time', width: 160, },
	    {
			field: 'id',
			headerName: 'Explore',
			width: 65,
			renderCell: (params) => (
			  <Link href={`/workflows/${params.row.workflow.id}?execution_id=${params.row.id}`} target="_blank" rel="noopener noreferrer">
				<OpenInNewIcon fontSize="small" />
			  </Link>
			),
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
		<div style={{minWidth: 1000, maxWidth: 1000, margin: "auto", }}>
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
