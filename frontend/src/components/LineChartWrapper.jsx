import React, { useState, useEffect, useContext, memo, useMemo } from 'react'
import {getTheme} from '../theme.jsx';
import { Context } from '../context/ContextApi.jsx';

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
	TooltipArea,
	ChartTooltip,
	TooltipTemplate,
} from 'reaviz';

const LineChartWrapper = (props) => {
	const {keys, inputname, height, width, border} = props

  	const [hovered, setHovered] = useState("");
	const {themeMode} = useContext(Context)
	const theme = getTheme(themeMode)

	var inputdata = keys.data === undefined ? keys : keys.data

	var newname = inputname === undefined || inputname === null ? "" : inputname.trim().replaceAll("_", " ")
	newname = newname.charAt(0).toUpperCase() + newname.slice(1)

	if (inputdata?.key !== undefined && inputdata?.key !== null && inputdata?.key !== "" && inputdata?.datasets !== undefined && inputdata?.datasets !== null && inputdata?.datasets.length > 0 && inputdata?.labels !== undefined && inputdata?.labels !== null && inputdata?.labels.length > 0) {

		var tmpdata = inputdata?.datasets[0]
		if (tmpdata?.data !== undefined && tmpdata?.data !== null && tmpdata?.data.length > 0 && inputdata?.labels?.length === tmpdata?.data?.length) {
			console.log("Fix it!")
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
		return (
			<Typography> 
				Invalid linegraph data format
			</Typography> 
		)
	}

	var defaultStyle = {
		color: "white", 
		padding: 30, 
		marginTop: 15, 
		overflow: "hidden", 

		border: "1px solid rgba(255,255,255,0.3)", 
		borderRadius: theme.palette?.borderRadius, 
		backgroundColor: theme.palette.platformColor, 
	}

	if (border === false) {
		defaultStyle.border = "none"
		defaultStyle.borderRadius = 0
		defaultStyle.backgroundColor = "transparent"
	}

	return (
		<div style={defaultStyle}>
			<Typography variant="h6" style={{marginBotton: 30, }}>
				{newname}
			</Typography>

			<BarChart
				style={{marginTop: 100, }}
				width={"100%"}
				height={height}
				data={inputdata}

		      	series={
					<BarSeries
					  bar={
						<Bar />
					  } 
					/>
				}
				gridlines={
					<GridlineSeries line={<Gridline direction="all" />} />
				}
			/>

		</div>
	)
}

export default LineChartWrapper;
