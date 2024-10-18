import React from 'react';
import { Bar } from 'react-chartjs-2';
import { toast } from "react-toastify";

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

const DashboardBarchart = (props) => {
	const { timelineData, title, height, } = props;
	var inputHeight = 15 
	if (height !== undefined && height !== null) {
		inputHeight = height
	}

	const barOptions = {
		plugins: {
    		tooltip: {
      			enabled: true, // Ensure tooltips are enabled
			},
	  	},
	    tooltips: {
	      mode: 'index',
	      intersect: false,
	    },
        legend: {
            display: false
        },
        layout: {
            padding: {
                top: 0, // Adjust the top padding as needed
                bottom: -10, // Adjust the bottom padding as needed
                left: 0, // Adjust the left padding as needed
                right: 0, // Adjust the right padding as needed
            },
        },
        scales: {
			y: {
				beginAtZero: false,
			},
            yAxes: [{
                ticks: {
                    display: false 
                },
				beginAtZero: false,
            }],
            xAxes: [{
                ticks: {
                    display: false 
                },
				beginAtZero: false,
            }]
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    const label = data.labels[tooltipItem.index]
                    return label.split('\n')[0]
                },
                afterLabel: function (tooltipItem, data) {
					const amount = tooltipItem.value === undefined || tooltipItem.value === null ? 0 : tooltipItem.value
                    return `Amount: ${amount}` 
                },
                title: function () {
                    return title === undefined ? '' : title
                }
            }
        }
    }

	return (
		<Bar
	        data={timelineData}
	        options={barOptions}
			height={inputHeight}
	        getElementAtEvent={(elements) => {
	      	  if (elements && elements.length > 0) {
	      		  //toast("Click event")
	      		  console.log("Clicked: ", elements)
	      	  }
	        }}
	    />
	)
}

export default DashboardBarchart;
