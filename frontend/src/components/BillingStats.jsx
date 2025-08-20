import React, { useState, useEffect, useContext, memo, useMemo } from 'react';

import {getTheme} from '../theme.jsx';
import classNames from "classnames";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid'
import { toast } from "react-toastify" 

import { 
	DatePicker, 
	DateTimePicker,
	LocalizationProvider,
} from '@mui/x-date-pickers'

import {
	OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

import {
	CircularProgress,
	Link,
	Tooltip,
	TextField,
	IconButton,
	Button,
	Typography,
	Grid,
	Paper,
	Chip,
	Checkbox,
	Box,
} from "@mui/material";

import { typecost, typecost_single, } from "../views/HandlePaymentNew.jsx";
import LineChartWrapper from '../components/LineChartWrapper.jsx';
import { Context } from '../context/ContextApi.jsx';


const AppStats = (defaultprops) => {
  const { 
	  globalUrl, 
	  selectedOrganization, 
	  userdata, 
	  isCloud, 
	  inputWorkflows,
	  clickedFromOrgTab,
	  syncStats,
  } = defaultprops;

  const [keys, setKeys] = useState([])
  const [searches, setSearches] = useState([]);
  const [appRuns, setAppruns] = useState(undefined);
  const [childOrgsAppRuns, setChildOrgsAppRuns] = useState(undefined);
  const [appRunCosts, setApprunCosts] = useState(undefined);
  const [workflowRuns, setWorkflowRuns] = useState(undefined);
  const [subflowRuns, setSubflowRuns] = useState(undefined);

  const [endTime, setEndTime] = useState("")
  const [startTime, setStartTime] = useState("")
  const [statistics, setStatistics] = useState(undefined);
  const [filteredStatistics, setFilteredStatistics] = useState(undefined);

  const [apprunCost, setApprunCost] = useState(0)
  const [monthToDateCost, setMonthToDateCost] = useState(0)
  const [monthTotalCost, setMonthTotalCost] = useState(0)

  const [workflows, setWorkflows] = useState(inputWorkflows === undefined ? [] : inputWorkflows)
  const [resultRows, setResultRows] = useState([])
  const [resultLoading, setResultLoading] = useState(true)
  const { themeMode, brandColor } = useContext(Context);
  const theme = getTheme(themeMode, brandColor)
  
  const includedExecutions = selectedOrganization?.sync_features?.app_executions !== undefined ? selectedOrganization?.sync_features?.app_executions?.limit : 0 

  useEffect(() => {
	  if (workflows === undefined || workflows === null || workflows.length === 0) {
		  getAvailableWorkflows()
	  }
  }, [])


  const getWorkflowStats = async (workflow, startTime, endTime) => {

	  if (workflow.id === undefined || workflow.id === null || workflow.id === "") {
		  return workflow
	  }

	  var starttime = ""
	  var endtime = ""
	  try {
		  starttime = startTime === undefined || startTime === null || startTime === "" ? "" : new Date(startTime).toISOString()
		  endtime = endTime === undefined || endTime === null || endTime == "" ? "" : new Date(endTime).toISOString()
	  } catch(err) {
		  console.log("Error converting start/end time", err)
		  toast("Bad start/endtime. Please try again")
		  return
	  }

	  var url = `${globalUrl}/api/v1/workflows/${workflow.id}/executions/count`

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

	  const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
	  }).catch((error) => {
		  console.log("Error getting workflow stats: " + error);
		  return workflow
	  })

	  if (response.status !== 200) {
		  console.log("Status not 200 for workflow stats URL: " + url);
		  return workflow
	  }

	  const data = await response.json();

	  if (data === undefined || data === null) {
		  console.log("No data for workflow stats URL: " + url);
		  return workflow
	  }

	  if (data.success === false) {
		  console.log("No success for workflow stats URL: " + url, data.reason);
		  return workflow
	  }

	  workflow.runcount = data.count
	  return workflow
  }

  const loadWorkflowStats = (foundWorkflows, startTime, endTime) => {
	  if (foundWorkflows === undefined || foundWorkflows === null || foundWorkflows.length === 0) {
		  setResultLoading(false)
		  return
	  }

	  // Only do latest 20
	  setResultLoading(true)
	  const promises = foundWorkflows.slice(0, 50).map(wf => getWorkflowStats(wf, startTime, endTime));

	  const allData = Promise.all(promises);
	  if (allData === undefined || allData === null) {
		  setResultLoading(false)
	  }

	  allData.then((data) => {
	  	var total = 0
	  	for (var i = 0; i < data.length; i++) {
	  		if (data[i].runcount !== undefined) {
	  			total += data[i].runcount
	  		} else {
	  			data[i].runcount = 0
	  		}
	  	}

	  	data[0].runcount = total
	  	// Sort data by runcount
	  	data.sort((a, b) => (a.runcount < b.runcount) ? 1 : -1)	
	  	setResultRows(data)
	    setResultLoading(false)
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

		  loadWorkflowStats(foundWorkflows)
	  }
	})
	.catch((error) => {
	  console.log("Error getting workflows: " + error);
	})
  }

  // Cost in old contracts: 0.0009 
  // Old contracts also always included 150.000 executions
  const invocationCost = includedExecutions === 150000 || includedExecutions === 250000 ? 0.0009 : typecost_single
  const defaultAmount = 10000

	useEffect(() => {
		if (statistics === undefined || statistics === null) {
			return
		}

		const statKey = syncStats === true ? "onprem_stats" : "daily_statistics"
		if (statistics[statKey] === undefined || statistics[statKey] === null) {
			setFilteredStatistics(statistics)
			return
		}

		// Calculate month to date cost
		var mtd_cost = 0
		for (let key in statistics[statKey]) {
			const item = statistics[statKey][key]
			if (item["date"] === undefined) {
				continue
			}

			const date = new Date(item["date"])
			const today = new Date()
			if (date.getMonth() === today.getMonth()) {
				mtd_cost += (item["app_executions"] * invocationCost)
			}
		}

		if (isCloud && mtd_cost !== monthToDateCost) {
			// Find how many days there have been in the current month
			const today = new Date()
			const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()
			// Find what day we are on
			const day = today.getDate()
			// Find how many days are left in the month
			const daysLeft = daysInMonth - day

			// Calculate the cost of the entire month
			var monthTotalCost = mtd_cost/day*daysInMonth 
			monthTotalCost -= defaultAmount*invocationCost
			monthTotalCost -= includedExecutions*invocationCost

			// Remove included amount
  			//const defaultAmount = 10000
			mtd_cost -= defaultAmount*invocationCost
			mtd_cost -= includedExecutions*invocationCost

			if (monthTotalCost > 0) {
				setMonthTotalCost(monthTotalCost.toFixed(2))
			}

			if (mtd_cost > 0) {
				setMonthToDateCost(mtd_cost.toFixed(2))
			}
		}

		// Make a date at the 1st of the current month
		var foundstarttime = (new Date())
		foundstarttime.setDate(1)
		if (startTime !== "" && startTime !== undefined && startTime !== null) {
			foundstarttime = startTime 
		}

		// Set to tomorrow by default
		var foundendtime = (new Date())
		foundendtime.setDate(foundendtime.getDate() + 1)

		// Check if endtime is after the daily statistics["date"] string
		if (endTime !== "" && endTime !== undefined && endTime !== null) { 
			foundendtime = endTime
		}

		// Check if start time is before the daily statistics["date"] string
		var newlist = []
		for (let key in statistics[statKey]) {
			const item = statistics[statKey][key]
			if (item["date"] === undefined) {
				continue
			}

			const date = new Date(item["date"])
			if (date >= foundstarttime) {
				if (date <= foundendtime) {
					newlist.push(item)
				}
			}
		}

		// If newlist is empty, set the timestamp to 1 year back and check if there are any statistics there
		// If foundstarttime is more than 30 days back, don't do this
		/*
		if (newlist.length === 0 && foundstarttime.getDate() > 30) {
			// Set the timestamp to be back 
			foundstarttime.setFullYear(foundstarttime.getFullYear() - 1)
			setStartTime(foundstarttime)

			console.log("IN HERE")
		}
		*/

		var tmpstats = JSON.parse(JSON.stringify(statistics))

		var workflowexecutions = 0
		var appexecutions = 0
		var estimatedcost = 0
		if (newlist.length > 0) {
			tmpstats[statKey] = newlist

			for (let key in newlist) {
				const item = newlist[key]
				if (item["workflow_executions"] === undefined) {
					continue
				}

				workflowexecutions += item["workflow_executions"]
				appexecutions += item["app_executions"]

				estimatedcost += (item["app_executions"] * invocationCost)
			}

			tmpstats["monthly_workflow_executions"] = workflowexecutions
			tmpstats["monthly_app_executions"] = appexecutions
		}

		// Make estimatedcost have max 2 decimals
		if (isCloud) {
			// Exclude includedExecutions*month
  			// const includedExecutions = 150000
			//estimatedcost -= (includedExecutions * invocationCost)

			setApprunCost(estimatedcost.toFixed(2))
		}

		setFilteredStatistics(tmpstats)
		handleDataSetting(tmpstats, "day") 


		if (workflows !== undefined && workflows !== null && workflows.length > 0) {
			var foundWorkflows = [{"id": "", "name": "All Workflows",}]
			var tmpworkflows = workflows.filter((workflow) => workflow.id !== undefined && workflow.id !== null && workflow.id !== "")
			foundWorkflows.push(...tmpworkflows)

			loadWorkflowStats(foundWorkflows, startTime, endTime)
		}

	}, [statistics, startTime, endTime])

	const handleStartTimeChange = (date) => {
		setStartTime(date)
	}
	
	const handleEndTimeChange = (date) => {
		setEndTime(date)
	}

	const handleDataSetting = (inputdata, grouping) => {
		if (inputdata === undefined || inputdata === null) {
			return 
		}

		const statKey = syncStats === true ? "onprem_stats" : "daily_statistics"
		const dailyStats = inputdata[statKey]
		if (dailyStats === undefined || dailyStats === null) {
			return
		}

		var appRuns = {
			"key": "App Runs",
			"data": []
		}

		var childorgappRuns = {
			"key": "Child Org App Runs",
			"data": []
		}

		var workflowRuns = {
			"key": "Workflow Runs (includes subflows)",
			"data": []
		}

		var subflowRuns = {
			"key": "Subflow Runs",
			"data": []
		}

		var appcostRuns = {
			"key": "Cost of App Runs",
			"data": []
		}

		for (let key in dailyStats) {
			// Always skips first one as it has accumulated data in it
			if (key === 0) {
				continue
			}

			const item = dailyStats[key]
			if (item["date"] === undefined) {
				console.log("No date: ", item)
				continue
			}

			// Check if app_executions key in item
			if (item["app_executions"] !== undefined && item["app_executions"] !== null) {
				appRuns["data"].push({
					key: new Date(item["date"]), 
					data: item["app_executions"]
				})

				// Add number 
				appcostRuns["data"].push({
					key: new Date(item["date"]),
					data: (item["app_executions"] * invocationCost).toFixed(2)
				})
			} 

			if (item["child_app_executions"] !== undefined && item["child_app_executions"] !== null) {
				childorgappRuns["data"].push({
					key: new Date(item["date"]),
					data: inputdata["child_app_executions"]
				})
			}

			// Check if workflow_executions key in item
			if (item["workflow_executions"] !== undefined && item["workflow_executions"] !== null) {
				workflowRuns["data"].push({
					key: new Date(item["date"]),
					data: item["workflow_executions"]
				})
			}

			if (item["subflow_executions"] !== undefined && item["subflow_executions"] !== null) {
				subflowRuns["data"].push({
					key: new Date(item["date"]),
					data: item["subflow_executions"]
				})
			}
		}

		// Adds data for today 
		if (inputdata["daily_app_executions"] !== undefined && inputdata["daily_app_executions"] !== null) {
			appRuns["data"].push({
				key: new Date(),
				data: inputdata["daily_app_executions"]
			})

			appcostRuns["data"].push({
				key: new Date(),
				data: (inputdata["daily_app_executions"] * invocationCost).toFixed(2)
			})
		}

		if (inputdata["daily_child_app_executions"] !== undefined && inputdata["daily_app_executions"] !== null) {
			childorgappRuns["data"].push({
				key: new Date(),
				data: inputdata["daily_child_app_executions"]
			})

			//setApprunCosts(appcostRuns)
		}

		if (inputdata["daily_workflow_executions"] !== undefined && inputdata["daily_workflow_executions"] !== null) {
			workflowRuns["data"].push({
				key: new Date(),
				data: inputdata["daily_workflow_executions"]
			})
		}

		if (inputdata["daily_subflow_executions"] !== undefined && inputdata["daily_subflow_executions"] !== null) {
			subflowRuns["data"].push({
				key: new Date(),
				data: inputdata["daily_subflow_executions"]
			})
		}

		// Only for parent orgs
		if (childorgappRuns["data"].length > 0) {
	  		setChildOrgsAppRuns(childorgappRuns)
		}

		setSubflowRuns(subflowRuns)
		setWorkflowRuns(workflowRuns)
		setAppruns(appRuns)
		setApprunCosts(appcostRuns)
	}	

	const getStats = (orgid) => {
		
		if (orgid === undefined || orgid === null) {
			return
		}

		fetch(`${globalUrl}/api/v1/orgs/${orgid}/stats`, {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!: ", response.status);
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson["success"] === false) {
				return
			}

			setStatistics(responseJson)
			handleDataSetting(responseJson, "day")
		})
		.catch((error) => {
			console.log("error: ", error)
		});
	}
	
	useEffect(() => {
		if(selectedOrganization?.id?.length > 0) {
			getStats(selectedOrganization.id)
		}
	}, [selectedOrganization])

	const paperStyle = {
		textAlign: "center", 
		padding: "40px", 
		margin: "5px", 
		backgroundColor: theme.palette.cardBackgroundColor,
		border: theme.palette.defaultBorder,
		maxWidth: "300px",
		"&:hover": {
			backgroundColor: theme.palette.cardHoverColor,
		},
	}

	const columns: GridColDef[] = [
	    {
			field: 'workflow.name',
			headerName: 'Workflow Name',
			width: 350,
			renderCell: (params) => {

				return (
					<span style={{cursor: "pointer", }} onClick={() => {
					}}>
						{params.row.name}
					</span>
				)
			}
		  },
	      {
			field: 'workflow.runcount',
			headerName: 'Workflow Runs in selected period',
			width: 250,
			renderCell: (params) => {

				return (
					<span style={{cursor: "pointer", }} onClick={() => {
					}}>
						{params.row.runcount}
					</span>
				)
			}
		  },
	      {
			field: 'triggers',
			headerName: 'Triggers',
			width: 100,
			renderCell: (params) => {
				if (params.row.id === "") {
					return null
				}

				const cnt = params.row.triggers === undefined || params.row.triggers === null ? 0 : params.row.triggers.length

				return (
					<span style={{cursor: "pointer", }} onClick={() => {
					}}>
						{cnt}
					</span>
				)
			}
		  },
	      {
			field: 'actions',
			headerName: 'Actions',
			width: 100,
			renderCell: (params) => {
				if (params.row.id === "") {
					return null
				}

				const cnt = params.row.actions === undefined || params.row.actions === null ? 0 : params.row.actions.length

				return (
					<span style={{cursor: "pointer", }} onClick={() => {
					}}>
						{cnt}
					</span>
				)
			}
		  },
	      /*{
			field: 'last editor',
			headerName: 'Last Editor',
			width: 100,
			renderCell: (params) => {
				if (params.row.id === "") {
					return null
				}

				const lastEditor = params.row.lasteditor === undefined || params.row.lasteditor === null ? "" : params.row.lasteditor

				return (
					<span style={{cursor: "pointer", }} onClick={() => {
					}}>
						{lastEditor}
					</span>
				)
			}
		  },*/
	      {
			field: 'explore',
			headerName: 'Explore',
			width: 100,
			renderCell: (params) => {
				if (params.row.id === "") {
					return null
				}

				return (
					<span style={{backgroundColor: "inherit", display: "flex", }}>
					  <Link disabled={params.row.id === ""} href={`/workflows/${params.row.id}`} target="_blank" rel="noopener noreferrer">
						<OpenInNewIcon fontSize="small" style={{marginTop: 7, }} />
					  </Link>
					</span>
			)
		}
		},
	]

  	const data = (
    <div className="content" style={{width: "100%", margin: "auto", }}>
		<Typography style={{margin: "auto", marginLeft: 10, marginBottom: 20, fontSize: 16}} color="textSecondary">
			All shown statistics are gathered from <a 
				href={`${globalUrl}/api/v1/orgs/${selectedOrganization?.id}/stats`} 
				target="_blank"
				style={{ textDecoration: "none", color: theme.palette.linkColor,}}
			>Your Organisation Statistics. </a>
			It exists to give you more insight into your workflows, and to understand your utilization of the Shuffle platform. <b>The billing tracker is in Beta, and is always calculated manually before being invoiced.</b>

			<br style={{}}/>
			{syncStats !== true ? null : 
				"PS: You are currently looking at data from your onprem synced org"}
		</Typography>

		<div style={{display: "flex", flexDirection: "column", textAlign: "center",}}>
			<div style={{flexDirection: "row", }}>
			{filteredStatistics !== undefined ?
				<div style={{flex: 1, display: "flex", textAlign: "center",}}>

					{syncStats == true ? null : 
						<Tooltip title={
							<Typography variant="body1" style={{padding: 10, }}>
								The cost of app runs in the selected period based on {filteredStatistics.monthly_app_executions} App Runs. These numbers do not exclude your included 10.000/month or {includedExecutions} App Runs per month. App Run cost: ${invocationCost}. 
							</Typography>
						}>
							<Box sx={paperStyle}>
								<Typography variant="h4">
									${selectedOrganization?.lead_info?.customer === false && selectedOrganization?.lead_info?.pov === false ?
										0 
										: 
										apprunCost
									}
								</Typography>
								
								<Typography variant="h6">
									Period Cost
								</Typography>
							</Box>
						</Tooltip>
					}

					{syncStats === true ? null :
					<Tooltip title={
						<Typography variant="body1" style={{padding: 10, }}>
							App runs in the selected period
						</Typography>
					}>
						<Box sx={paperStyle}>
							<Typography variant="h4">
								{filteredStatistics.monthly_app_executions === null || filteredStatistics.monthly_app_executions === undefined ? 0 : filteredStatistics.monthly_app_executions}
							</Typography>
							<Typography variant="h6">
								App Runs 
							</Typography>
						</Box>
					</Tooltip> 
					}

					{syncStats === true ? null :
					<Tooltip title={
						<Typography variant="body1" style={{padding: 10, }}>
							Workflow runs in the selected period 
						</Typography>
					}>
						<Box sx={paperStyle}>
							<Typography variant="h4">
								{filteredStatistics.monthly_workflow_executions === null || filteredStatistics.monthly_workflow_executions === undefined ? 0 : filteredStatistics.monthly_workflow_executions}
							</Typography>
							<Typography variant="h6">
								Workflow Runs 
							</Typography>
						</Box>
					</Tooltip>
					}

					{syncStats === true ? null :
						<Tooltip title={
							<Typography variant="body1" style={{padding: 10, }}>
								Estimated cost to be billed at the end of the current month. Subtracted contractually included app runs. Actual cost month to date: ${monthToDateCost}. App Run cost: ${invocationCost}.
							</Typography>
						}>
							<Box sx={paperStyle}>
								<Typography variant="h4">
									${monthTotalCost}
								</Typography>
								<Typography variant="h6">
									Estimated cost 
								</Typography>
							</Box>
						</Tooltip>
					}
				</div>
			: null}
			</div>
			

			{clickedFromOrgTab? (
				<LocalizationProvider dateAdapter={AdapterDayjs} style={{ flex: 1 }}>
				<div style={{ display: "flex", flexDirection: "row", width: "100%", gap: "10px", justifyContent: 'center', alignItems: 'center', paddingTop: 10 }}>
				  <div
					style={{
					  display: "flex",
					  flexDirection: "row",
					  flex: 1,
					  alignItems: "center",
					}}
				  >
					<Typography
					  style={{
						marginLeft: 10,
						marginRight: 10,
						fontSize: 16,
						whiteSpace: "nowrap",
					  }}
					  color="textSecondary"
					>
					  Search from
					</Typography>
					<DateTimePicker
					  slotProps={{
						textField: {
						  sx: {
							"& .MuiOutlinedInput-root": {
							  "& fieldset": {
								borderColor: "#494949 !important",
								borderWidth: "1px !important",
							  },
							  "&:hover fieldset": {
								borderColor: "#FFFFFF !important",
							  },
							  "&.Mui-focused fieldset": {
								borderColor: "#FFFFFF !important",
							  },
							  height: "35px",
							  fontSize: 16,
							  color: "#c8c8c8",
							},
						  },
						},
					  }}
					  sx={{
						"& .MuiInputBase-root": { 
						  height: "35px",
						  minHeight: "35px",
						},
						"& .MuiInputBase-input": {
						  height: "35px",
						  padding: "0 14px",
						  boxSizing: "border-box",
						  color: "#c8c8c8",
						  fontSize: 16,
						}
					  }}
					  ampm={false}
					  format="YYYY-MM-DD HH:mm:ss"
					  value={startTime}
					  onChange={handleStartTimeChange}
					/>
				  </div>
				  <div
					style={{
					  display: "flex",
					  flexDirection: "row",
					  flex: 1,
					  alignItems: "center",
					}}
				  >
					<Typography
					  style={{
						marginLeft: 10,
						marginRight: 10,
						fontSize: 16,
						whiteSpace: "nowrap",
					  }}
					  color="textSecondary"
					>
					  Search until
					</Typography>
					<DateTimePicker
					  slotProps={{
						textField: {
						  sx: {
							"& .MuiOutlinedInput-root": {
							  "& fieldset": {
								borderColor: "#494949 !important",
								borderWidth: "1px !important",
							  },
							  "&:hover fieldset": {
								borderColor: "#FFFFFF !important",
							  },
							  "&.Mui-focused fieldset": {
								borderColor: "#FFFFFF !important",
							  },
							  height: "35px",
							  fontSize: 16,
							  color: "#c8c8c8",
							},
						  },
						},
					  }}
					  sx={{
						marginTop: 1,
						"& .MuiInputBase-root": { 
						  height: "35px",
						  minHeight: "35px",
						},
						"& .MuiInputBase-input": {
						  height: "35px",
						  padding: "0 14px",
						  boxSizing: "border-box",
						  color: "#c8c8c8",
						  fontSize: 16,
						}
					  }}
					  ampm={false}
					  format="YYYY-MM-DD HH:mm:ss"
					  value={endTime}
					  onChange={handleEndTimeChange}
					/>
				  </div>
				</div>
			  </LocalizationProvider>
			):(
			<LocalizationProvider dateAdapter={AdapterDayjs} style={{flex: 1, }}>
				<div style={{display: "flex", flexDirection: "column", }}>
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
				</div>
			</LocalizationProvider>
			)}
		</div>

		{appRuns === undefined ? 
			null
			: 
			<LineChartWrapper keys={appRuns} height={300} width={"100%"} inputname={"App Runs - Current Org"}/>
		}

		{childOrgsAppRuns === undefined ? 
			null
			: 
			<LineChartWrapper keys={childOrgsAppRuns} height={300} width={"100%"} inputname={"Child Org App Runs"}/>
		}

		{workflowRuns === undefined ? 
			null
			: 
			<LineChartWrapper keys={workflowRuns} height={300} width={"100%"} inputname={"Daily Workflow Runs (including subflows)"}/>
		}

		{subflowRuns === undefined ? 
			null
			: 
			<LineChartWrapper keys={subflowRuns} height={300} width={"100%"} inputname={"Subflow Runs"}/>
		}

		{/*appRunCosts === undefined ? 
			null
			: 
			<LineChartWrapper keys={appRunCosts} height={300} width={"100%"} inputname={"Apprun cost - Cost per day"}/>
		*/}

		{syncStats === true ? null : 
			<div style={{height: 150+resultRows.length * 25, padding: "10px 0px 10px 0px", }}>
				{resultLoading ? 
					<div style={{margin: "auto", alignItems: "center", width: 350, height: "100%", }}>
						<Typography variant="body2" color="textSecondary" component="p" style={{textAlign: "center", marginTop: 50, marginBottom: 15, }}>
							Loading usage for selected period (may take a while) 
						
							<CircularProgress style={{marginTop: 15, }} /> 
						</Typography>
					</div>
					:
					<DataGrid
						rows={resultRows}
						columns={columns}
						pageSize={100}
						rowsPerPageOptions={[10, 20, 50, 100]}
						checkboxSelection
						disableSelectionOnClick
						onPageSizeChange={(newPageSize) => {
							//setRowsPerPage(newPageSize)
							//submitSearch(workflowId, status, startTime, endTime, rowCursor, newPageSize) 
						}}
						// event for when clicking next page
						// Hide page changer
						onPageChange={(params) => {
							console.log("page params: ", params)
						}}
						onSelectionModelChange={(newSelection) => {
							console.log("newSelection: ", newSelection)
							//console.log("newSelection: ", newSelection)
							//setSelectedWorkflowExecutionsIndexes(newSelection)
							//var found = []	
							//for (var i = 0; i < newSelection.length; i++) {
							//	// Find the workflow in the resultRows
							//	var selected = resultRows.find((workflow) => {
							//		return workflow.id === newSelection[i]
							//	})

							//	if (selected === undefined || selected === null) {
							//		continue
							//	}

							//	found.push(selected)
							//}

							//setSelectedWorkflowExecutions(found)
						}}
						// Track which items are selected
					  />
				}
			  </div>
		}
    </div>
  )

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
}

export default AppStats;
