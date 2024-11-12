import React, { useState, useEffect } from 'react';

import { 
	TextField,
	Link,
	Button,
	ButtonGroup,
	CircularProgress,
	Select,
	MenuList,
	MenuItem,
	FormControl,
	InputLabel,
	Autocomplete,
	Tooltip,
	Typography,
	IconButton,
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
	Insights as InsightsIcon, 
	Replay as ReplayIcon, 
	EditNote as EditNoteIcon,
} from '@mui/icons-material';

import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid'
import {
	Search as SearchIcon,
  } from "@mui/icons-material";

  import {
	InputAdornment,
  } from "@mui/material"

import ClearIcon from '@mui/icons-material/Clear';

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
	const [totalCount, setTotalCount] = useState(0)

	const [workflow, setWorkflow] = useState({})
	const [ignoreOrg, setIgnoreOrg] = useState(false)
	const [searchLoading, setSearchLoading] = useState(false)
	const [rowCursor, setCursor] = useState("")
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const [resultRows, setResultRows] = useState([])
	const [selectedWorkflowExecutions, setSelectedWorkflowExecutions] = useState([])
	const [workflows, setWorkflows] = useState([
		{"id": "", "name": "All Workflows",}
	])

	if (document != undefined) { 
		document.title = "Workflow Run Debugger"
	}

	// Shitty workflow search on purpose :)
	const handleWorkflowUsageCount = (workflows) => {
		if (workflows === undefined || workflows === null || workflows.length === 0) {
			return
		}

		setTotalCount(0)

		var starttime = ""
		var endtime = ""
		var count = 0
		try {
			starttime = startTime === undefined || startTime === null || startTime === "" ? "" : new Date(startTime).toISOString()
			endtime = endTime === undefined || endTime === null || endTime == "" ? "" : new Date(endTime).toISOString()
		} catch (e) {
			toast("Invalid date format", { type: "error" })
		}

		var maxworkflows = 5

		console.log("Looking for MAX this amount of workflows: ", maxworkflows)
		for (let key in workflows) {
			if (key > maxworkflows) {
				break
			}

			const workflowId = workflows[key].id

			if (workflowId === undefined || workflowId === null || workflowId === "") {
				continue
			}

			// Fetch the data for the workflow
			var url = `${globalUrl}/api/v1/workflows/${workflowId}/executions/count`
			if (starttime !== "") {
				url += `?start_time=${starttime}`
			}

			if (endtime !== "") {
				if (starttime !== "") {
					url += `&end_time=${endtime}`
				} else {
					url += `?end_time=${endtime}`
				}
			}

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

				return response.json()
			})
			.then((data) => {
				if (data.success) {
					if (data.count !== undefined && data.count !== null) {
						count += data.count
					}
				} else {
					console.log("Failed to get workflow usage count: ", data)
				}
			})
			.catch((error) => {
				console.error("Error:", error);
			})
		}

		setTimeout(() => {
			setTotalCount(count)
		}, maxworkflows*300)
	}

	const submitSearch = (workflowId, status, startTime, endTime, cursor, limit) => {
		handleWorkflowUsageCount(workflows)
		//setResultRows([])
		setSearchLoading(true)
		const fetchData = {
			workflow_id: workflowId,
			cursor: cursor,
			limit: limit,

			status: status.toUpperCase(),
			start_time: startTime,
			end_time: endTime,
			ignore_org: ignoreOrg,
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


	  const getAvailableWorkflows = (workflowId) => {
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

			  if (workflowId !== undefined && workflowId !== null && workflowId !== "" && workflowId.length === 36) {
				  for (var key in responseJson) {
					  if (responseJson[key].id === workflowId) {
						  setWorkflow(responseJson[key])
						  break
					  }
				  }
			  }
		  }
		})
		.catch((error) => {
		  console.log("Error getting workflows: " + error);
		})
	  }

	useEffect(() => {

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

	  	getAvailableWorkflows(workflowId)

		const foundStatus = urlParams.get('status');
		if (foundStatus !== undefined && foundStatus !== null && foundStatus !== "") {
			setStatus(foundStatus)
		}
	}, [])

	const forceContinue = (execution) => {
		console.log(`FORCE CONTINUE execution ${execution.execution_id} for workflow ${execution.workflow.id}`)

		fetch(`${globalUrl}/api/v1/workflows/${execution.workflow.id}/executions/${execution.execution_id}/rerun`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		})
		.then((response) => response.json())
		.then((data) => {
			if (data.success) {
				if (data.reason !== undefined && data.reason !== null && data.reason !== "") {
					toast("Successful response: " + data.reason)
				} else {
					toast("Successfully forced continue")
				}
			} else {
				if (data.reason !== undefined && data.reason !== null && data.reason !== "") {
					toast(`Failed to force continue: ${data.reason}`)
				} else {
					toast("Failed to force continue")
				}
			}
		}) 
		.catch((error) => {
			console.error("Error:", error);
			toast(`Failed to force continue: ${error}`)
		})
	}
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
					foundSource = <img src={alltriggers[1].large_image} alt="schedule" style={{borderRadius: theme.palette?.borderRadius, height: imageSize, width: imageSize, }} />
				} else if (source === "webhook") {
					foundSource = <img src={alltriggers[0].large_image} alt="webhook" style={{borderRadius: theme.palette?.borderRadius, height: imageSize, width: imageSize, }} />
				} else if (source === "subflow" || source.length === 36) {
					foundSource = <img src={alltriggers[3].large_image} alt="subflow" style={{borderRadius: theme.palette?.borderRadius, height: imageSize, width: imageSize, }} />
					source = "subflow"
				} else if (source === "rerun" || source.length === 36) {
					foundSource = <ReplayIcon style={{color: theme.palette.primary.secondary, height: imageSize, width: imageSize, }} />
					source = "rerun of a previous run"
				} else if (source === "form") { 
					foundSource = <EditNoteIcon style={{color: theme.palette.primary.secondary, height: imageSize, width: imageSize, }} />
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
				var foundSkipped = 0
				if (params.row.results !== null && params.row.results !== undefined) {
					for (let key in params.row.results) {
						if (params.row.results[key].status === "SUCCESS") {
							foundItems += 1
						}

						if (params.row.results[key].status === "SKIPPED") {
							foundSkipped += 1
						}
					}
				}

				var foundError = ""
				if (foundItems + foundSkipped < params.row.workflow.actions.length && params.row.status === "FINISHED") {
					foundError = "Workflow is done, but all nodes are not finished. This most likely indicates a problem with the workflow"
				}

				return (
					<Tooltip title={foundError} placement="top">
						<span style={{backgroundColor: foundError.length > 0 ? "rgba(244,0,0,0.6)" : "inherit"}} onClick={() => {
						}}>
							{foundItems} 
						</span>
					</Tooltip>
				)
			},
		  },
	      {
			field: 'skipped',
			headerName: 'Skipped',
			width: 75,
			renderCell: (params) => {
				var foundItems = 0
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
			width: 120,
			renderCell: (params) => {
				const parsedResult = params.row.result === null || params.row.result === undefined || params.row.result === "" ? "" : params.row.result

				var errorReason = ""
				var hasError = parsedResult !== null && parsedResult !== undefined && parsedResult !== "" ? parsedResult.includes("{%") && parsedResult.includes("%}") : false

				if (hasError) {
					errorReason = "Liquid parsing error" 
				}

				// if success: false
				// if node == FAILURE or ABORTED
				if (parsedResult.includes(`\"success\": false`)) {
					errorReason = "success: false in last result"
					hasError = true
				}

				if (!hasError && parsedResult.includes(`\"status\":`)) {
					// Look for any status that is 300 or higher
					const statusSplit = parsedResult.split(`\"status\":`)
					if (statusSplit.length > 1) {
						var foundStatus = statusSplit[1].trim()
						// Check if pattern is \d, 
						if (foundStatus.includes(",")) {
							const foundStatusSplit = foundStatus.split(",")

							if (foundStatusSplit.length > 1) {
								foundStatus = foundStatusSplit[0].trim()
								// Check if it's a number
							}
						} else {
							foundStatus = ""
						}

						if (!isNaN(foundStatus) && foundStatus  >= 300) {
							errorReason = "Status code: "+foundStatus
							hasError = true
						}
					}
				}

				if (!hasError) {
					// Find last node that isn't skipped and check status
					var lastresult = {}
					for (var key in params.row.results)	{
						const result = params.row.results[key]
						if (result.status === "SKIPPED") {
							continue
						}

						if (result.completed_at === undefined || result.completed_at === null) {
							continue
						}

						if (result.completed_at >= lastresult.completed_at) {
							lastresult = result
						}
					}

					if (lastresult.id !== undefined && lastresult.status !== "SUCCESS" && lastresult.status !== "SKIPPED") {
						errorReason = "Bad status for last node: "+lastresult.status
						hasError = true
					}
				}

				if (!hasError && params.row.notifications_created !== null && params.row.notifications_created !== undefined && params.row.notifications_created !== 0) {
					hasError = true
					errorReason = "Generated notifications: "+params.row.notifications_created
				}

				return (
					<div style={{display: "flex", }}>
					  <Tooltip arrow placement="left" title={
						  <Typography variant="body2" style={{whiteSpace: "pre-line", padding: 10, }}>
							Workflow result: {errorReason}<br/><br/>
							{params.row.result !== null && params.row.result !== undefined && params.row.result !== "" ?
							  params.row.result
							  : 
							  null
							}
						  </Typography>
					  }>
						<span style={{backgroundColor: !hasError ? "inherit" : "rgba(244,0,0,0.45)", display: "flex", }}>
						  <Link href={`/workflows/${params.row.workflow.id}?execution_id=${params.row.id}`} target="_blank" rel="noopener noreferrer">
							<OpenInNewIcon fontSize="small" style={{marginTop: 7, }} />
						  </Link>
						</span>
						</Tooltip>
						<Tooltip arrow title="Force continue workflow. Only workflows for workflows in EXECUTING state. This is NOT a rerun, but way for Shuffle to figure out the next steps automatically. If the execution doesn't finish even after trying this, please contact support@shuffler.io"> 
						  <IconButton
							style={{marginLeft: 5, }}
							disabled={params.row.status !== "EXECUTING"}
							onClick={() => {
								forceContinue(params.row)

							}}
						  >
							<PlayArrowIcon fontSize="small" />
						  </IconButton>
						</Tooltip>
						<Tooltip arrow title="Explore workflow run logs"> 
						  <IconButton
							style={{marginLeft: 5, }}
							onClick={() => {
								window.open(`${globalUrl}/api/v1/workflows/search/${params.row.id}`, "_blank")
							}}
							disabled={userdata.region_url !== "https://shuffler.io"}
						  >
							<InsightsIcon fontSize="small" />
						  </IconButton>
						</Tooltip>
					</div>
				)
			}
		  },
	]

	useEffect(() => {
		// Check if the user is currently focusing a texxtfield or not
		// If they are, don't submit the search
		if (document.activeElement.tagName === "INPUT") {
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

    const abortExecution = (workflowId, executionId) => {
      fetch(`${globalUrl}/api/v1/workflows/${workflowId}/executions/${executionId}/abort`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        }
      )
        .then((response) => {
          if (response.status !== 200) {
            console.log("Status not 200 for ABORT EXECUTION :O!");
          }

          return response.json();
        })
        .catch((error) => {
			toast.error("Error aborting execution: "+error.toString())
        });
    };

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

	const executeWorkflow = (execution) => {
    	  const data = { 
			  execution_argument: execution.execution_argument, 
			  start: execution.start,
			  execution_source: "rerun",
		  };

    	  fetch(`${globalUrl}/api/v1/workflows/${execution.workflow.id}/execute?start=${execution.start}`,
    	    {
    	      method: "POST",
    	      headers: {
    	        "Content-Type": "application/json",
    	        Accept: "application/json",
    	      },
    	      credentials: "include",
    	      body: JSON.stringify(data),
    	    }
    	  )
    	    .then((response) => {
    	      if (response.status !== 200) {
    	        console.log("Status not 200 for WORKFLOW EXECUTION :O!");
    	      }

    	      return response.json();
    	    })
    	    .then((responseJson) => {
    	      if (!responseJson.success) {
				  toast("Error executing workflow: "+responseJson.error)
			  } else {
				  console.log("Executed workflow: ", responseJson)
			  }
    	    })
    	    .catch((error) => {
				toast("Failed to execute workflow: "+error.toString())
    	    });
  	}

	const [searchQuery, setSearchQuery] = useState("");
	const [filteredRows, setFilteredRows] = useState([]);
	const [defaultRows, setDefaultRows] = useState([]);

		const handleQueryChange = (e) => {
			const query = e.target.value.toLowerCase();
			setSearchQuery(query);
		}

		useEffect(() => {
			setDefaultRows(resultRows);
		}, [resultRows]);

		useEffect(() => {
			if (searchQuery.trim() === "") {
				setFilteredRows(defaultRows);
			} else {
				const filterRow = defaultRows.filter((data) => {

					//Filter workflow base on the workflow status
					if (data.status.toLowerCase().includes(searchQuery)) {
						return true;
					}

					//Filter workflow base on workflow name
					if (data.workflow.name.toLowerCase().includes(searchQuery)) {
						return true;
					}

					//Filter the workflow base on execution argument
					if (data.execution_argument && data.execution_argument.length > 0) {
							if (data.execution_argument.toLowerCase().includes(searchQuery)) {
								return true;
							}
					}

					//Filter the workflow base on the result
					if (data.results && data.results.length > 0) {
						for (let result of data.results) {
							if (result && result.result && result.result.toLowerCase().includes(searchQuery)) {
								return true;
							}
						}
					}

					return false;
				});
				setFilteredRows(filterRow);
			}
		}, [searchQuery, defaultRows]);

	return (
		<div style={{minWidth: 1150, maxWidth: 1150, margin: "auto", }}>
			<div style={{display: "flex", }}>
				<div style={{display: 'flex', flexDirection: 'column'}}>
				<h1 style={{flex: 3, }}>Workflow Run Debugger {totalCount !== 0 ? ` (~${totalCount})` : ""}</h1>
					<div style={{position: 'relative', right: 10, marginBottom: 10}}>
						<TextField
						fullWidth
						value={searchQuery}
						style={{
							backgroundColor: theme.palette.inputColor,
							marginTop: 20,
							marginLeft: 10,
							marginRight: 12,
							width: 693,
							height: 55,
							borderRadius: 8,
							fontSize: 16,
							marginBottom: 15,
						}}
						InputProps={{
							style: {
							color: "white",
							fontSize: "1em",
							height: 55,
							width: 693,
							borderRadius: 8,
							},
							startAdornment: (
							<InputAdornment position="start">
								<SearchIcon style={{ marginLeft: 5}} />
							</InputAdornment>
							),
							endAdornment: (
							<InputAdornment position="end">
								{searchQuery.length > 0 && (
								<ClearIcon
									style={{
									color: "white",
									cursor: "pointer",
									marginRight: 10
									}}
									onClick={() => setSearchQuery('')} 
								/>
								 )} 
								<button
								type="button"
								style={{
									backgroundImage:
									"linear-gradient(to right, rgb(248, 106, 62), rgb(243, 64, 121))",
									color: "white",
									border: "none",
									padding: "10px 20px",
									width: 100,
									height: 35,
									borderRadius: 17.5,
									cursor: "pointer",
								}}
								>
								Search
								</button>
							</InputAdornment>
							),
							
						}}
						onChange={(e)=>{handleQueryChange(e)}}
						color="primary"
						placeholder="Filter by Workflow Name, Status, Execution Argument, Results.."
						id="shuffle_search_field"
        				/>
					</div>

				</div>
				{selectedWorkflowExecutions.length > 0 ?
					<ButtonGroup>
						<Tooltip title="Reruns ALL selected workflows. This will make a new execution for them, and not continue the existing.">
							<Button
								variant="outlined"
								color="secondary"
								style={{maxHeight: 40, marginTop: 25, }}
								onClick={() => {

									for (var i = 0; i < selectedWorkflowExecutions.length; i++) {
										const selected = selectedWorkflowExecutions[i]
										executeWorkflow(selected)
									}

									toast("Reran "+selectedWorkflowExecutions.length+" workflow run!")
									setSelectedWorkflowExecutions([])

								}}
							>
								Rerun Selected ({selectedWorkflowExecutions.length})
							</Button>
						</Tooltip>
						<Tooltip title="Aborts ALL selected workflows in EXECUTING state">
							<Button
								variant="contained"
								color="primary"
								style={{maxHeight: 40, marginTop: 25, }}
								onClick={() => {
									toast("Attempting to abort "+selectedWorkflowExecutions.length+" workflow runs...")

									var aborted = 0
									for (var i = 0; i < selectedWorkflowExecutions.length; i++) {
										const selected = selectedWorkflowExecutions[i]
										if (selected.status === "EXECUTING") { 
											abortExecution(selected.workflow.id, selected.execution_id) 
											aborted += 1
										}
									}

									if (aborted === 0) {
										toast("No workflows were aborted as they are not executing.")
									} else {
										toast("Aborted "+aborted+" workflows.")
										// Research
										submitSearch(workflowId, status, startTime, endTime, rowCursor, rowsPerPage)

										setSelectedWorkflowExecutions([])
									}
		
								}}
							>
								Abort Selected ({selectedWorkflowExecutions.length})
							</Button>
						</Tooltip> 
					</ButtonGroup>

				: null}

				{userdata.support === true ? 
					<Button
						variant={ignoreOrg ? "contained" : "outlined"}
						color="secondary"
						style={{marginLeft: 100, maxHeight: 40, marginTop: 25, }}
						onClick={() => {
							setIgnoreOrg(!ignoreOrg)
						}}
					>
						{ignoreOrg ? "Ignoring Org" : "Ignore Org (Support Only)"}
					</Button>
				: null}
			</div>
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
					if (option === undefined || option === null ||
					  option.name === undefined || option.name === null
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
					borderRadius: theme.palette?.borderRadius,
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
							<img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette?.borderRadius, }} />
							: null}
						  <Typography>
							Choose {data.name}
						  </Typography>
						</span>
					  }>
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
						  borderRadius: theme.palette?.borderRadius,
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
					variant="outlined"
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
					rows={filteredRows}
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
		  			onSelectionModelChange={(newSelection) => {
						//console.log("newSelection: ", newSelection)
		  			    //setSelectedWorkflowExecutionsIndexes(newSelection)
						var found = []	
						for (var i = 0; i < newSelection.length; i++) {
							// Find the workflow in the resultRows
							var selected = resultRows.find((workflow) => {
								return workflow.id === newSelection[i]
							})

							if (selected === undefined || selected === null) {
								continue
							}

							found.push(selected)
						}

						setSelectedWorkflowExecutions(found)
		  			}}
					// Track which items are selected
				  />
			</div> 
		</div>
	)
}

export default RuntimeDebugger;
