import React from 'react';
import { toast } from "react-toastify";

import LineChartWrapper from '../components/LineChartWrapper.jsx';

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

// This wrapper is a waste lol
const DashboardBarchart = (props) => {
	const { timelineData, title, height, } = props;

	return (
		<LineChartWrapper keys={timelineData} height={150} width={"100%"} border={false} />
	)
}

export default DashboardBarchart;
