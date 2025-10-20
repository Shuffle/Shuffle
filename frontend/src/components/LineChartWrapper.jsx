import React, { useState, useEffect, useContext, memo, useMemo } from 'react'
import {getTheme} from '../theme.jsx';
import { Context } from '../context/ContextApi.jsx';
import { toast } from "react-toastify";

import {
	Typography,
} from '@mui/material';

import { 
	BarChart,
	BarSeries,
	Bar,
	BarLabel,

	GridlineSeries,
	Gridline,
	ChartTooltip,
	TooltipTemplate,
	TooltipArea,
} from 'reaviz';

export const LoadStats = (globalUrl, cachekey) => {
	if (globalUrl === undefined) {
		console.log("Error: Global URL is undefined")
		return
	}

	if (cachekey === undefined) {
		console.log("Error: Cachekey is undefined")
		return
	}

	var basedata = {
		"key": cachekey,
		"total": 0,
		"available_keys": [],
		"labels": [],
		"datasets": [
			{
				"label": "",
				"data": [],
				"backgroundColor": [],
				"barThickness": 15, 
			}
		]
	}

	//const url = `${globalUrl}/api/v1/stats/app_executions_test2`
	//cachekey = cachekey.replace(" ", "_", -1)
	const url = `${globalUrl}/api/v1/stats/${cachekey}`
	return fetch(url, {
		method: "GET",
		credentials: "include",
	})
	.then((resp) => {
		return resp.json()
	}).then((respJson) => {
		const selectedIndex = 0

		//console.log("Stats response: ", respJson)

		if (respJson.success === true) {
			for (let entryKey in respJson.entries) {
				const entry = respJson.entries[entryKey]
				basedata.labels.push(entry.date)

				basedata.datasets[0].data.push(entry.value)
				basedata.datasets[0].backgroundColor.push(entry.value > 0 ? "rgba(255,255,255,0.4)" : "red")
			}

			basedata.available_keys = respJson.available_keys
			basedata.total = respJson.total

			return basedata 
		} else {
			console.log("Failed to get stats")
			return basedata
		}
	})
	.catch((err) => {
		toast("Failed to get stats")
		return basedata
	})
}

const LineChartWrapper = (props) => {
	const {keys, inputname, height, width, border, color} = props

  	const [hovered, setHovered] = useState("");
	const {themeMode} = useContext(Context)
	const theme = getTheme(themeMode)

	// Correct format:
	/* keys={[
	  {
		key: "2025-07-23T00:00:09.409718Z",
		data: 24,
	  },
	  {
		key: "2025-07-24T00:00:09.409718Z",
		data: 50,
	  },
	  {
		key: "2025-07-25T00:00:09.409718Z",
		data: 75,
	  },
	  {
		key: "2025-07-26T00:00:09.409718Z",
		data: 42,
	  },
	]}
	*/

	var inputdata = keys?.data === undefined ? keys : keys.data

	var newname = inputname === undefined || inputname === null ? "" : inputname.trim().replaceAll("_", " ")
	newname = newname.charAt(0).toUpperCase() + newname.slice(1)

	if (inputdata?.key !== undefined && inputdata?.key !== null && inputdata?.key !== "" && inputdata?.datasets !== undefined && inputdata?.datasets !== null && inputdata?.datasets.length > 0 && inputdata?.labels !== undefined && inputdata?.labels !== null && inputdata?.labels.length > 0) {

		var tmpdata = inputdata?.datasets[0]
		if (tmpdata?.data !== undefined && tmpdata?.data !== null && tmpdata?.data.length > 0 && inputdata?.labels?.length === tmpdata?.data?.length) {
			var newarray = []
			for (var key in tmpdata.data) {
				var entry = {
					"key": inputdata.labels[key] !== undefined ? inputdata.labels[key] : key,
					"data": tmpdata.data[key],
				}

				newarray.push(entry)
			}

			inputdata = newarray
		}
	}

	if (inputdata === undefined || inputdata === null) {
		return null /*(
			<Typography> 
				Invalid linegraph data format
			</Typography> 
		)*/
	}

	var defaultStyle = {
		color: "white", 
		padding: "5px 5px 10px 5px", 
		marginTop: 15, 
		overflow: "hidden", 

		border: "1px solid rgba(255,255,255,0.3)", 
		borderRadius: theme.palette?.borderRadius, 
		//backgroundColor: theme.palette.platformColor, 
	}

	if (border === false) {
		defaultStyle.border = "none"
		defaultStyle.borderRadius = 0
		defaultStyle.backgroundColor = "transparent"
	}

	// Check if it's a list or not 
	if (!Array.isArray(inputdata) || inputdata.length === 0 || (inputdata.length > 0 && (inputdata[0].key === undefined && inputdata[0].data === undefined))) {
		console.log("Invalid graph data format: ", inputdata)
		console.log("Expected format: [{key: 'label1', data: 10}, {key: 'label2', data: 20}]")
		//inputdata = inputdata?.datasets[0]?.data
		return null
	}

	//console.log("FORMAT: ", inputdata)

	const tooltip = <TooltipArea
					tooltip={
					<ChartTooltip
						placement={"top"}
						followCursor={true}
						content={(data) => (
						<div style={{
							borderRadius: 4,
							backgroundColor: theme.palette.inputColor,
							border: theme.palette.defaultBorder,
							color: theme.palette.text.primary,
							padding: 6,
							maxWidth: 240,
						}}>
							<Typography variant="body2" style={{fontWeight: 600}}>{data?.x ?? ''}</Typography>
							<Typography variant="body2">{data?.y ?? ''}</Typography>
						</div>
						)}
					/>
					}
				/>;
	
	const selectedColor = color === undefined || color === null || color === "" ? "" : color
	const barseries = color === undefined || color === null || color === "" ?
		<BarSeries
		  bar={
			<Bar 
			/>
		  } 
		  tooltip={tooltip}
		/>
		:
		<BarSeries
		  colorScheme={[selectedColor]}
		  bar={
			<Bar 
			/>
		  } 
		  tooltip={tooltip}
		/>

	return (
		<div style={defaultStyle}>
			{newname !== "" &&
				<Typography variant="h6" style={{paddingBottom: 25, }}>
					{newname}
				</Typography>
			}

			<BarChart
				style={{marginTop: 100, }}
				width={"100%"}
				height={height}
				data={inputdata}

		      	series={
					barseries
					
				}
				gridlines={
					<GridlineSeries line={<Gridline direction="all" />} />
				}
			/>

		</div>
	)
}

export default LineChartWrapper;
