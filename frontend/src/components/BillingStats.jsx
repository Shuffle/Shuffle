import React, { useState, useEffect } from 'react';

import classNames from "classnames";
import theme from '../theme.jsx';

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

const LineChartWrapper = ({keys, inputname, height, width}) => {
  const [hovered, setHovered] = useState("");
	const inputdata = keys.data === undefined ? keys : keys.data
	
	return (
		<div style={{color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette.borderRadius, padding: 30, marginTop: 15, }}>
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
  const { globalUrl, selectedOrganization, userdata, } = defaultprops;
  const [keys, setKeys] = useState([])
  const [searches, setSearches] = useState([]);
  const [clickData, setClickData] = useState(undefined);
  const [conversionData, setConversionData] = useState(undefined);
  const [statistics, setStatistics] = useState(undefined);
  const [appRuns, setAppruns] = useState(undefined);
  const [workflowRuns, setWorkflowRuns] = useState(undefined);
  const [subflowRuns, setSubflowRuns] = useState(undefined);

	const handleDataSetting = (inputdata, grouping) => {
		if (inputdata === undefined || inputdata === null) {
			return 
		}

		const dailyStats = inputdata.daily_statistics
		if (dailyStats === undefined || dailyStats === null) {
			return
		}

		console.log("Looking at daily data: ", inputdata)

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
		console.log("Inputdata: ", inputdata)
		if (inputdata["daily_app_executions"] !== undefined && inputdata["daily_app_executions"] !== null) {
			appRuns["data"].push({
				key: new Date(),
				data: inputdata["daily_app_executions"]
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
		backgroundColor: theme.palette.surfaceColor,
		maxWidth: 300,
	}

  	const data = (
    <div className="content" style={{width: "100%", margin: "auto", }}>
		<Typography variant="body1" style={{margin: "auto", marginLeft: 10, marginBottom: 20, }}>
			All Stat widgets are monthly and gathered from <a 
				href={`${globalUrl}/api/v1/orgs/${selectedOrganization.id}/stats`} 
				target="_blank"
				style={{ textDecoration: "none", color: "#f85a3e",}}
			>Your Organization Statistics. </a>
			This is a feature to help give you more insight into Shuffle, and will be populating over time.
		</Typography>
		{statistics !== undefined ?
			<div style={{display: "flex", textAlign: "center",}}>
				<Paper style={paperStyle}>
					<Typography variant="h4">
						{statistics.monthly_workflow_executions}
					</Typography>
					<Typography variant="h6">
						Workflow Runs 
					</Typography>
				</Paper>
				<Paper style={paperStyle}>
					<Typography variant="h4">
						{statistics.monthly_app_executions}
					</Typography>
					<Typography variant="h6">
						App Runs 
					</Typography>
				</Paper>
			</div>
		: null}

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
    </div>
  )

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
}

export default AppStats;
