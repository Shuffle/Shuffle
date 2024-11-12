import React, { useState, useEffect } from 'react';

import theme from '../theme.jsx';
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
} from "@mui/material";

import { 
	BarChart,
	GridlineSeries,
	Gridline,
} from 'reaviz';

import { typecost, typecost_single, } from "../views/HandlePaymentNew.jsx";

const LineChartWrapper = ({keys, inputname, height, width}) => {
  const [hovered, setHovered] = useState("");
	const inputdata = keys.data === undefined ? keys : keys.data
	
	return (
		<div style={{color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette?.borderRadius, padding: 30, marginTop: 15, backgroundColor: theme.palette.platformColor, overflow: "hidden", }}>
			<Typography variant="h6" style={{marginBotton: 15, }}>
				{inputname}
			</Typography>
			<BarChart
				width={"100%"}
				height={height}
				data={inputdata}
				gridlines={
					<GridlineSeries line={<Gridline direction="all" />} />
				}
			/>
		</div>
	)
}


const AppStats = (defaultprops) => {
  const { globalUrl, selectedOrganization, userdata, isCloud, inputWorkflows,clickedFromOrgTab } = defaultprops;

  const [keys, setKeys] = useState([])
  const [searches, setSearches] = useState([]);
  const [appRuns, setAppruns] = useState(undefined);
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

  const includedExecutions = selectedOrganization.sync_features.app_executions !== undefined ? selectedOrganization.sync_features.app_executions.limit : 0 

  useEffect(() => {
	  if (workflows === undefined || workflows === null || workflows.length === 0) {
		  getAvailableWorkflows()
	  }
  }, [])



  const getWorkflowStats = async (workflow, startTime, endTime) => {
	  if (!userdata.support) {
		  return workflow
	  }

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
	  if (!userdata.support) {
		  console.log("Not support")

		  return
	  }

	  if (foundWorkflows === undefined || foundWorkflows === null || foundWorkflows.length === 0) {
		  console.log("Not workflows")
		  return
	  }

	  // Only do latest 20
	  setResultLoading(true)
	  const promises = foundWorkflows.slice(0, 50).map(wf => getWorkflowStats(wf, startTime, endTime));

	  const allData = Promise.all(promises);

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

		if (statistics["daily_statistics"] === undefined || statistics["daily_statistics"] === null) {
			setFilteredStatistics(statistics)
			return
		}

		// Calculate month to date cost
		var mtd_cost = 0
		for (let key in statistics["daily_statistics"]) {
			const item = statistics["daily_statistics"][key]
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
		for (let key in statistics["daily_statistics"]) {
			const item = statistics["daily_statistics"][key]
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
			tmpstats["daily_statistics"] = newlist

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

		const dailyStats = inputdata.daily_statistics
		if (dailyStats === undefined || dailyStats === null) {
			return
		}

		var appRuns = {
			"key": "App Runs",
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

		setSubflowRuns(subflowRuns)
		setWorkflowRuns(workflowRuns)
		setAppruns(appRuns)
		setApprunCosts(appcostRuns)
	}	

	const getStats = () => {
		fetch(`${globalUrl}/api/v1/orgs/${selectedOrganization.id}/stats`, {
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
		getStats()
	}, [])

	const paperStyle = {
		textAlign: "center", 
		padding: 40, 
		margin: 5, 
		backgroundColor: theme.palette.platformColor,
		border: "1px solid rgba(255,255,255,0.3)",
		maxWidth: 300,
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
		<Typography variant="body1" style={{margin: "auto", marginLeft: 10, marginBottom: 20, }} color="textSecondary">
			All shown statistics are gathered from <a 
				href={`${globalUrl}/api/v1/orgs/${selectedOrganization.id}/stats`} 
				target="_blank"
				style={{ textDecoration: "none", color: "#f85a3e",}}
			>Your Organisation Statistics. </a>
			It exists to give you more insight into your workflows, and to understand your utilization of the Shuffle platform. <b>The billing tracker is in Beta, and is always calculated manually before being invoiced.</b>
		</Typography>

		<div style={{display: "flex", textAlign: "center",}}>
			{filteredStatistics !== undefined ?
				<div style={{flex: 1, display: "flex", textAlign: "center",}}>
					<Tooltip title={
						<Typography variant="body1" style={{padding: 10, }}>
							The cost of app runs in the selected period based on {filteredStatistics.monthly_app_executions} App Runs. These numbers do not exclude your included 10.000/month or {includedExecutions} App Runs per month. App Run cost: ${invocationCost}. 
						</Typography>
					}>
						<Paper style={paperStyle}>
							<Typography variant="h4">
								${selectedOrganization.lead_info.customer === false && selectedOrganization.lead_info.pov === false ?
									0 
									: 
									apprunCost
								}
							</Typography>
							<Typography variant="h6">
								Period Cost
							</Typography>
						</Paper>
					</Tooltip>
					<Tooltip title={
						<Typography variant="body1" style={{padding: 10, }}>
							App runs in the selected period
						</Typography>
					}>
					<Paper style={paperStyle}>
						<Typography variant="h4">
							{filteredStatistics.monthly_app_executions === null || filteredStatistics.monthly_app_executions === undefined ? 0 : filteredStatistics.monthly_app_executions}
						</Typography>
						<Typography variant="h6">
							App Runs 
						</Typography>
					</Paper>
					</Tooltip> 
					<Tooltip title={
						<Typography variant="body1" style={{padding: 10, }}>
							Workflow runs in the selected period 
						</Typography>
					}>
						<Paper style={paperStyle}>
							<Typography variant="h4">
								{filteredStatistics.monthly_workflow_executions === null || filteredStatistics.monthly_workflow_executions === undefined ? 0 : filteredStatistics.monthly_workflow_executions}
							</Typography>
							<Typography variant="h6">
								Workflow Runs 
							</Typography>
						</Paper>
					</Tooltip>
					<Tooltip title={
						<Typography variant="body1" style={{padding: 10, }}>
							Estimated cost to be billed at the end of the current month. Subtracted contractually included app runs. Actual cost month to date: ${monthToDateCost}. App Run cost: ${invocationCost}.
						</Typography>
					}>
						<Paper style={{
							textAlign: "center", 
							padding: 40, 
							margin: 5, 
							marginLeft: clickedFromOrgTab? null:90, 
							backgroundColor: theme.palette.platformColor,
							border: "1px solid rgba(255,255,255,0.3)",
							maxWidth: 300,
						}}>
							<Typography variant="h4">
								${monthTotalCost}
							</Typography>
							<Typography variant="h6">
								Estimated cost 
							</Typography>
						</Paper>
					</Tooltip>
				</div>
			: null}

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

		</div>

		{appRuns === undefined ? 
			null
			: 
			<LineChartWrapper keys={appRuns} height={300} width={"100%"} inputname={"Daily App Runs"}/>
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


		<div style={{height: 150+resultRows.length * 25, padding: "10px 0px 10px 0px", }}>
			{resultLoading ? 
				<div style={{margin: "auto", alignItems: "center", width: 350, height: "100%", }}>
					<Typography variant="body2" color="textSecondary" component="p" style={{textAlign: "center", marginTop: 50, marginBottom: 15, }}>
						Loading usage for selected period (may take a while) 
					</Typography>
					<CircularProgress style={{}} /> 
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
    </div>
  )

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
}

export default AppStats;
