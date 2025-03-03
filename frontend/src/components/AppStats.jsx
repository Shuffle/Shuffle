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

const inputdata = {
	"data": [{
		"key": "Intel",
		"data": [
				{ key: new Date('11/22/2019'), data: 3, metadata: {color: "green", "name": "Intel"}},
				{ key: new Date('11/24/2019'), data: 8, metadata: {color: "green", "name": "Intel"}},
				{ key: new Date('11/29/2019'), data: 2, metadata: {color: "green", "name": "Intel"}},
		]
	},
	{
		"key": "Popper",
		"data": [
			{ key: new Date('11/24/2019'), data: 9, metadata: {color: "red", "name": "Popper"}},
			{ key: new Date('11/29/2019'), data: 3, metadata: {color: "red", "name": "Popper"}},
		]
	}]
}


const LineChartWrapper = ({keys, inputname, height, width}) => {
  const [hovered, setHovered] = useState("");

	//console.log("Date: ", new Date("2019-11-14T08:00:00.000Z"))
	//var inputdata = keys.data
	//const inputdata = keys.data === undefined ? [{"key": inputname, "data": keys}] : keys.data
	const inputdata = keys.data === undefined ? keys : keys.data

	/*
    	  series={
					<AreaSeries 
						symbols={
							<PointSeries show={false} />
						} 
						area={
							<Area
							 mask={<Stripes />}
							 gradient={
									 <Gradient
										 stops={[
											 <GradientStop offset="10%" stopOpacity={0} />,
											 <GradientStop offset="80%" stopOpacity={1} />
										 ]}
									 />
								 }
							 />
						}
						gridlines={<GridlineSeries line={<Gridline direction="x" />} />}
						colorScheme={(colorInput) => {
							var color = "#f86a3e"
							//if (colorInput !== undefined && colorInput.length > 0) {
							//	color = colorInput[0].metadata !== undefined && colorInput[0].metadata.color !== undefined ? colorInput[0].metadata.color : color
							//}

							return color
						}}
					/>
				}
		*/

	return (
		<div style={{color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette?.borderRadius, padding: 30, marginTop: 15, }}>
			<Typography variant="h4" style={{marginBotton: 15, }}>
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
			{/*
			<AreaSparklineChart
				style={{marginTop: 15, color: "white",}}
				height={height}
				width={width}
				data={inputdata}
				tooltip={
					<Tooltip
						tooltip={
							<ChartTooltip
								color={"#ffffff"}
								followCursor={true}
								modifiers={{
									offset: '5px, 5px'
								}}
								content={(data, color) => (
									<TooltipTemplate
										color={"#ffffff"}
										value={{
											x: data.x,
											y: data.y,
										}}
									/>
								)}
							/>
						}
					/>
				}
			/>
			*/}
		</div>
	)
}


const AppStats = (defaultprops) => {
  const { globalUrl, appId , workflowId} = defaultprops;
  const [keys, setKeys] = useState([])
  const [widgetData, setWidgetData] = useState({});
  const [searches, setSearches] = useState([]);
  const [clickData, setClickData] = useState(undefined);
  const [conversionData, setConversionData] = useState(undefined);

	const handleDataSetting = (inputdata, grouping) => {
		var newlist = [] 

		for (var key in inputdata.events) {
			var newlist = []

			for (var subkey in inputdata.events[key].data) {
				const subdata = inputdata.events[key].data[subkey]
				//console.log("Timestamp: ", subdata.key)

				if (grouping === "day") {
					const daysplit = subdata.key.split("T")[0]
					//console.log("Grouping by day: ", daysplit)

					const foundIndex = newlist.findIndex(data => data.key === daysplit)
					if (foundIndex !== undefined && foundIndex !== null && foundIndex >= 0) {
						newlist[foundIndex].data += 1
						newlist[foundIndex].y += 1
					} else {
						newlist.push({
							"key": daysplit,
							"x": daysplit,
							"data": 1,
							"y": 1,
						})
					}
				} else { 
					console.log("No grouping set?")
					try {
						inputdata.events[key].data[subkey].key = new Date(subdata.key)
					} catch (e) {
						console.log("Failed timestamp: ", e)
					}
				}
			}

			// Fixing timestamps after sorting based on day
			for (var subkey in newlist) {
				const subdata = newlist[subkey]
				newlist[subkey].key = new Date(subdata.key)
			}

			console.log("Inputdata: ", inputdata.events[key])
			if (inputdata.events[key].key === "click") {
  			setClickData(newlist)
			} else if (inputdata.events[key].key === "conversion") {
  			setConversionData(newlist)
			} else {
				console.log("No handler for ", inputdata.events[key].key)
			}
		}

		//new Date('11/22/2019')
		setWidgetData(inputdata)
	}	

	const getAppStats = (appId) => {
    fetch(`${globalUrl}/api/v1/apps/${appId}/stats`, {
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

			handleDataSetting(responseJson, "day")
		})
		.catch((error) => {
			console.log("error: ", error)
		});
	}
	
	const getWorkflowStats = (workflowId) => {
		fetch(`${globalUrl}/api/v1/workflow/${workflowId}/stats`, {
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
	
				handleDataSetting(responseJson, "day")
			})
			.catch((error) => {
				console.log("error: ", error)
			});
		}


	useEffect(() => {
		//setWidgetData(inputdata)
		getAppStats(appId)
		getWorkflowStats(workflowId)
	}, [])

	const paperStyle = {
		textAlign: "center", 
		padding: 40, 
		margin: 5, 
		backgroundColor: theme.palette.inputColor,
	}

	console.log("Widget: ", widgetData)
  const data = (
    <div className="content" style={{width: "100%", margin: "auto", paddingBottom: 200, textAlign: "center",}}>
			<div style={{display: "flex", margin: "auto", }}>
				<Paper style={paperStyle}>
					<Typography variant="h4">
						{widgetData.orgs}
					</Typography>
					<Typography variant="h6">
						Orgs	
					</Typography>
				</Paper>
				<Paper style={paperStyle}>
					<Typography variant="h4">
						{widgetData.searches}
					</Typography>
					<Typography variant="h6">
						Searches
					</Typography>
				</Paper>
	  			{/*
				<Paper style={paperStyle}>
					<Typography variant="h4">
						{widgetData.clicks}
					</Typography>
					<Typography variant="h6">
						Clicks	
					</Typography>
				</Paper>
				<Paper style={paperStyle}>
					<Typography variant="h4">
						{widgetData.conversions}
					</Typography>
					<Typography variant="h6">
						Conversions	
					</Typography>
				</Paper>
				<Paper style={paperStyle}>
					<Typography variant="h4">
						{widgetData.forks}
					</Typography>
					<Typography variant="h6">
						Forks	
					</Typography>
				</Paper>
				*/}
			</div>

			{clickData === undefined  || clickData === null || clickData?.length === 0 ?
				null
				: 
				<LineChartWrapper keys={clickData} height={300} width={"100%"} inputname={"Clicks"}/>
			}

			<div style={{marginTop: 25, }} />
			{conversionData === undefined  || conversionData === null || conversionData?.length === 0 ?
				null
				: 
				<LineChartWrapper keys={conversionData} height={300} width={"100%"} inputname={"Conversions"}/>
			}
    </div>
  )

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
}

export default AppStats;
