import React, { useState, useEffect } from 'react';

import theme from '../theme.jsx';
import classNames from "classnames";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import { 
	DatePicker, 
	DateTimePicker,
	LocalizationProvider,
} from '@mui/x-date-pickers'

import {
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
	RadialBarChart, 
	RadialAreaChart, 
	RadialAxis,
	StackedBarSeries,
	TooltipArea,
	ChartTooltip,
	TooltipTemplate,
	RadialAreaSeries,
	RadialPointSeries,
	RadialArea,
	RadialLine,
	TreeMap,
	TreeMapSeries,
	TreeMapLabel,
	TreeMapRect,
	Line,
	LineChart,
	LineSeries,
	LinearYAxis,
	LinearXAxis,
	LinearYAxisTickSeries,
	LinearXAxisTickSeries,
	Area,
	AreaChart,
	AreaSeries,
	AreaSparklineChart,
	PointSeries,
	GridlineSeries,
	Gridline,
	Stripes,
	Gradient,
	GradientStop,
	LinearXAxisTickLabel,
} from 'reaviz';

import { typecost, typecost_single, } from "../views/HandlePaymentNew.jsx";

const LineChartWrapper = ({keys, inputname, height, width}) => {
  const [hovered, setHovered] = useState("");
	const inputdata = keys.data === undefined ? keys : keys.data
	
	return (
		<div style={{color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette.borderRadius, padding: 30, marginTop: 15, backgroundColor: theme.palette.platformColor, overflow: "hidden", }}>
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
  const { globalUrl, selectedOrganization, userdata, isCloud, } = defaultprops;

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

  const includedExecutions = selectedOrganization.sync_features.app_executions !== undefined ? selectedOrganization.sync_features.app_executions.limit : 0 

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

  	const data = (
    <div className="content" style={{width: "100%", margin: "auto", }}>
		<Typography variant="body1" style={{margin: "auto", marginLeft: 10, marginBottom: 20, }}>
			All shown statistics are gathered from <a 
				href={`${globalUrl}/api/v1/orgs/${selectedOrganization.id}/stats`} 
				target="_blank"
				style={{ textDecoration: "none", color: "#f85a3e",}}
			>Your Organization Statistics </a>
			This is a feature to help give you more insight into Shuffle, and to understand your utilization of the Shuffle platform. <b>The billing tracker is in Beta, and is always calculated manually before being invoiced.</b>
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
								${apprunCost}
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
							marginLeft: 90, 
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
    </div>
  )

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
}

export default AppStats;
