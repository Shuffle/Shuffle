import React, { useState, useEffect, useContext, useCallback } from 'react';

import {getTheme} from '../theme.jsx';
import classNames from "classnames";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DataGrid } from '@mui/x-data-grid'
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
	FormControlLabel,
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
import { StackedBarChart, StackedBarSeries, GridlineSeries, Gridline, ChartTooltip, TooltipArea } from 'reaviz';


export const StatsDateRangePicker = ({ startTime, endTime, onStartChange, onEndChange }) => {
  const pickerSlotProps = {
    textField: {
      sx: {
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "#494949 !important", borderWidth: "1px !important" },
          "&:hover fieldset": { borderColor: "#FFFFFF !important" },
          "&.Mui-focused fieldset": { borderColor: "#FFFFFF !important" },
          height: "35px", fontSize: 16, color: "#c8c8c8",
        },
      },
    },
  }
  const pickerSx = {
    "& .MuiInputBase-root": { height: "35px", minHeight: "35px" },
    "& .MuiInputBase-input": { height: "35px", padding: "0 14px", boxSizing: "border-box", color: "#c8c8c8", fontSize: 16 },
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} style={{ flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center", alignItems: "flex-start", paddingTop: 10 }}>
        <div style={{ display: "flex", flexDirection: "row", flex: 1, alignItems: "center" }}>
          <Typography style={{ marginLeft: 10, marginRight: 10, fontSize: 16, whiteSpace: "nowrap" }} color="textSecondary">
            Search from
          </Typography>
          <DateTimePicker slotProps={pickerSlotProps} sx={pickerSx} ampm={false} format="YYYY-MM-DD HH:mm:ss" value={startTime} onChange={onStartChange} />
        </div>
        <div style={{ display: "flex", flexDirection: "row", flex: 1, alignItems: "center" }}>
          <Typography style={{ marginLeft: 10, marginRight: 10, fontSize: 16, whiteSpace: "nowrap" }} color="textSecondary">
            Search until
          </Typography>
          <DateTimePicker slotProps={pickerSlotProps} sx={{ marginTop: 1, ...pickerSx }} ampm={false} format="YYYY-MM-DD HH:mm:ss" value={endTime} onChange={onEndChange} />
        </div>
      </div>
    </LocalizationProvider>
  )
}

// Parses a date string into a Date object.
// No val → defaults to today (start: 3 months back at 00:00, end: today at 23:59) // in New limitsBilling updates
// Invalid val → falls back to today with the same hour rules
export const parseDate = (val, isEnd) => {
  const d = (val && !isNaN(new Date(val))) ? new Date(val) : new Date()
  if (!val && !isEnd) d.setMonth(d.getMonth() - 3)
  isEnd ? d.setHours(23, 59, 59, 999) : d.setHours(0, 0, 0, 0)
  return d
}

// Formats a Date the same way as the graph axis labels, e.g. "29 Apr 2026"
export const formatRangeDate = (d) => `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`

// Merges cloud and onprem daily stats arrays into one list keyed by date.
// Cloud entries are added first. If onprem has an entry for the same date,
// numeric stat fields are summed together. Otherwise the onprem entry is added as-is.
// Result is sorted oldest → newest.
const mergeStatsByDate = (cloudList, onpremList) => {
  const mergeFields = ["app_executions", "child_app_executions", "workflow_executions", "subflow_executions", "app_executions_failed", "workflow_executions_failed", "workflow_executions_finished", "org_sync_actions"]
  const map = {}
  for (const item of cloudList) {
    map[new Date(item.date).toDateString()] = { ...item }
  }
  for (const item of onpremList) {
    const key = new Date(item.date).toDateString()
    if (map[key]) mergeFields.forEach(f => { map[key][f] = (map[key][f] || 0) + (item[f] || 0) })
    else map[key] = { ...item }
  }
  return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date))
}

const AppStats = (defaultprops) => {
  const { 
	  globalUrl, 
	  selectedOrganization, 
	  userdata, 
	  isCloud, 
	  inputWorkflows,
	  clickedFromOrgTab,
	  syncStats,
	  statistics,
	  currentTab
  } = defaultprops;

  const [periodParentAppRuns, setPeriodParentAppRuns] = useState(0)
  const [periodChildAppRuns, setPeriodChildAppRuns] = useState(0)
  const [keys, setKeys] = useState([])
  const [searches, setSearches] = useState([]);
  const [appRuns, setAppruns] = useState(undefined);
  const [childOrgsAppRuns, setChildOrgsAppRuns] = useState(undefined);
  const [appRunCosts, setApprunCosts] = useState(undefined);
  const [workflowRuns, setWorkflowRuns] = useState(undefined);
  const [subflowRuns, setSubflowRuns] = useState(undefined);

  const [endTime, setEndTime] = useState("")
  const [startTime, setStartTime] = useState("")
  const [filteredStatistics, setFilteredStatistics] = useState(undefined);
  const [otherStatsStart, setOtherStatsStart] = useState(null)
  const [otherStatsEnd, setOtherStatsEnd] = useState(null)

  const [apprunCost, setApprunCost] = useState(0)
  const [monthToDateCost, setMonthToDateCost] = useState(0)
  const [monthTotalCost, setMonthTotalCost] = useState(0)

  const [workflows, setWorkflows] = useState(inputWorkflows === undefined ? [] : inputWorkflows)
  const [resultRows, setResultRows] = useState([])
  const [resultLoading, setResultLoading] = useState(true)
  const { themeMode, brandColor } = useContext(Context);
  const [onpremAppRuns, setOnpremAppRuns] = useState(0)
  const [cloudChecked, setCloudChecked] = useState(isCloud)
  const [onpremChecked, setOnpremChecked] = useState(!isCloud)
  const theme = getTheme(themeMode, brandColor)
  
  const includedExecutions = selectedOrganization?.sync_features?.app_executions !== undefined ? selectedOrganization?.sync_features?.app_executions?.limit : 0 

  useEffect(() => {
	  if (workflows === undefined || workflows === null || workflows.length === 0) {
		  getAvailableWorkflows()
	  }
  }, [])

  const handleDataSetting = useCallback((inputdata, grouping) => {
		if (inputdata === undefined || inputdata === null) {
			return 
		}

		const statKey = syncStats === true ? "onprem_stats" : "daily_statistics"
		const dailyStats = inputdata[statKey]
		if (dailyStats === undefined || dailyStats === null) {
			setAppruns(undefined)
			setWorkflowRuns(undefined)
			setSubflowRuns(undefined)
			setChildOrgsAppRuns(undefined)
			setApprunCosts(undefined)
			return
		}

		var appRuns = {
			"key": "App Runs",
			"data": []
		}

		var childorgappRuns = {
			"key": "Child Tenant App Runs",
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
					key: new Date(item["date"]).toISOString(), 
					data: item["app_executions"]
				})

				// Add number 
				appcostRuns["data"].push({
					key: new Date(item["date"]).toISOString(),
					data: (item["app_executions"] * invocationCost).toFixed(2)
				})
			} 

			if (item["child_app_executions"] !== undefined && item["child_app_executions"] !== null) {
				childorgappRuns["data"].push({
					key: new Date(item["date"]).toISOString(),
					data: item["child_app_executions"]
				})
			}

			// Check if workflow_executions key in item
			if (item["workflow_executions"] !== undefined && item["workflow_executions"] !== null) {
				workflowRuns["data"].push({
					key: new Date(item["date"]).toISOString(),
					data: item["workflow_executions"]
				})
			}

			if (item["subflow_executions"] !== undefined && item["subflow_executions"] !== null) {
				subflowRuns["data"].push({
					key: new Date(item["date"]).toISOString(),
					data: item["subflow_executions"]
				})
			}
		}



		// Only for parent orgs
		if (childorgappRuns["data"].length > 0) {
	  		setChildOrgsAppRuns(childorgappRuns)
		}

		setSubflowRuns(subflowRuns)
		setWorkflowRuns(workflowRuns)
		setAppruns(appRuns)
		setApprunCosts(appcostRuns)
	}, [syncStats, endTime, startTime])

  useEffect(() => {
	if (statistics && statistics?.org_id?.length > 0) {
		handleDataSetting(statistics, "day")
	}
}, [statistics])

  useEffect(() => {
	setStartTime("")
	setEndTime("")
  }, [currentTab])

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
		if (!syncStats && (statistics[statKey] === undefined || statistics[statKey] === null)) {
			setFilteredStatistics(statistics)
			setPeriodParentAppRuns(statistics["monthly_app_executions"] ?? 0)
			setPeriodChildAppRuns(statistics["monthly_child_app_executions"] ?? 0)
			return
		}

		if (syncStats && (statistics[statKey] === undefined || statistics[statKey] === null)) {
			setOnpremAppRuns(0)
			setFilteredStatistics(statistics)
			setAppruns(undefined)
			setWorkflowRuns(undefined)
			setSubflowRuns(undefined)
			setChildOrgsAppRuns(undefined)
			setApprunCosts(undefined)
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

		const foundstarttime = parseDate(startTime || null, false)
		const foundendtime = parseDate(endTime || null, true)

		const filterByRange = (arr) => (arr || []).filter(item => {
			if (!item.date) return false
			const d = new Date(item.date); d.setHours(0, 0, 0, 0)
			return d >= foundstarttime && d <= foundendtime
		})

		var newlist = []
		if (currentTab === 0 && !syncStats) {
			const cloudList = cloudChecked ? filterByRange(statistics[isCloud ? "daily_statistics" : "onprem_stats"]) : []
			const onpremList = onpremChecked ? filterByRange(statistics[isCloud ? "onprem_stats" : "daily_statistics"]) : []
			newlist = (cloudChecked && onpremChecked) ? mergeStatsByDate(cloudList, onpremList) : [...cloudList, ...onpremList]
		} else {
			newlist = filterByRange(statistics[statKey])
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
		var parentAppRuns = 0
		var childAppRuns = 0
		var estimatedcost = 0
		if (newlist.length > 0) {
			tmpstats[statKey] = newlist

			for (let key in newlist) {
				const item = newlist[key]
				if (item["workflow_executions"] === undefined) {
					continue
				}

				workflowexecutions += item["workflow_executions"]
				parentAppRuns += (item["app_executions"] ?? 0)
				childAppRuns += (item["child_app_executions"] ?? 0)
				appexecutions += item["app_executions"]

				if (currentTab === 0 || currentTab === 3) {
					appexecutions += (item["child_app_executions"] ?? 0)
				}

				estimatedcost += (item["app_executions"] * invocationCost)
			}



			tmpstats["monthly_workflow_executions"] = workflowexecutions
			tmpstats["monthly_app_executions"] = appexecutions
			if (syncStats) {
				setOnpremAppRuns(appexecutions)
			}
		} else {

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

		if (!syncStats) {
			setPeriodParentAppRuns(parentAppRuns)
			setPeriodChildAppRuns(childAppRuns)
		}


		if (workflows !== undefined && workflows !== null && workflows.length > 0) {
			var foundWorkflows = [{"id": "", "name": "All Workflows",}]
			var tmpworkflows = workflows.filter((workflow) => workflow.id !== undefined && workflow.id !== null && workflow.id !== "")
			foundWorkflows.push(...tmpworkflows)

			loadWorkflowStats(foundWorkflows, startTime, endTime)
		}

	}, [statistics, startTime, endTime, syncStats, currentTab, handleDataSetting, cloudChecked, onpremChecked])

	const handleStartTimeChange = (date) => {
		setStartTime(date)
	}
	
	const handleEndTimeChange = (date) => {
		setEndTime(date)
	}
	
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

	const columns = [
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

	const checkBoxes = [
    { label: "Cloud", checked: cloudChecked, setChecked: setCloudChecked },
    { label: "On-Prem", checked: onpremChecked, setChecked: setOnpremChecked },
  ];
	const formatCustomDate = (dateString) => {
		if (!dateString || dateString === "0001-01-01T00:00:00Z") return '';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return '';
		const day = date.getDate();
		const month = date.toLocaleString('default', { month: 'long' });
		const year = date.getFullYear();
		return `${day} ${month} ${year}, ${date.toLocaleTimeString('en-US')}`;
	};

  	const data = (
    <div className="content" style={{width: "100%", margin: "auto", marginTop: 20, boxSizing: 'border-box'}}>
		{currentTab === 5 ?
			<div style={{width: "100%", paddingBottom: 50}}>
				{(() => {
					const tenants = statistics?.tenants || [];
					const locations = statistics?.locations || [];

					const inRange = (dateStr) => {
						if (!dateStr || dateStr === "0001-01-01T00:00:00Z") return false;
						const d = new Date(dateStr);
						if (isNaN(d.getTime())) return false;
						const start = otherStatsStart ? new Date(otherStatsStart) : null;
						const end = otherStatsEnd ? new Date(otherStatsEnd) : null;
						if (start && d < start) return false;
						if (end && d > end) return false;
						return true;
					};
					const hasFilter = !!otherStatsStart || !!otherStatsEnd;

					let activeTenants = 0;
					let deletedTenants = 0;
					let totalTenants = 0;

					if (hasFilter) {
						const createdInRange = tenants.filter(t => inRange(t.created_at));
						const deletedInRange = tenants.filter(t => inRange(t.deleted_at));
						activeTenants = createdInRange.length;
						deletedTenants = deletedInRange.length;
						totalTenants = new Set([...createdInRange, ...deletedInRange]).size;
					} else {
						totalTenants = tenants.length;
						activeTenants = tenants.filter(t => t.status === 'active').length;
						deletedTenants = tenants.filter(t => t.status !== 'active').length;
					}
					const filteredLocations = hasFilter ? locations.filter(l => inRange(l.created_at)) : locations;
					const totalLocations = filteredLocations.length;
					const activeLocations = filteredLocations.filter(l => l.status === 'active').length;
					const disabledLocations = filteredLocations.filter(l => l.status !== 'active').length;

					const tenantDayMap = {};
					tenants.forEach(t => {
						const useCreated = hasFilter ? (inRange(t.created_at) ? t.created_at : null) : (t.created_at && t.created_at !== "0001-01-01T00:00:00Z" ? t.created_at : null);
						if (useCreated) {
							const dk = new Date(useCreated).toDateString();
							if (!tenantDayMap[dk]) tenantDayMap[dk] = { active: 0, deleted: 0, isoKey: useCreated };
							tenantDayMap[dk].active += 1;
						}
						const useDeleted = hasFilter ? (inRange(t.deleted_at) ? t.deleted_at : null) : (t.deleted_at && t.deleted_at !== "0001-01-01T00:00:00Z" ? t.deleted_at : null);
						if (useDeleted) {
							const dk = new Date(useDeleted).toDateString();
							if (!tenantDayMap[dk]) tenantDayMap[dk] = { active: 0, deleted: 0, isoKey: useDeleted };
							tenantDayMap[dk].deleted += 1;
						}
					});
					const tenantChartData = Object.entries(tenantDayMap)
						.sort(([, a], [, b]) => new Date(a.isoKey) - new Date(b.isoKey))
						.map(([, { active, deleted, isoKey }]) => ({ key: new Date(isoKey), data: [{ key: 'Active', data: active }, { key: 'Deleted', data: deleted }] }));

					const locationDayMap = {};
					locations.forEach(loc => {
						const useDate = hasFilter ? (inRange(loc.created_at) ? loc.created_at : null) : (loc.created_at && loc.created_at !== "0001-01-01T00:00:00Z" ? loc.created_at : null);
						if (useDate) {
							const dk = new Date(useDate).toDateString();
							if (!locationDayMap[dk]) locationDayMap[dk] = { active: 0, disabled: 0, isoKey: useDate };
							if (loc.status === 'active') locationDayMap[dk].active += 1;
							else locationDayMap[dk].disabled += 1;
						}
					});
					const locationChartData = Object.entries(locationDayMap)
						.sort(([, a], [, b]) => new Date(a.isoKey) - new Date(b.isoKey))
						.map(([, { active, disabled, isoKey }]) => ({ key: new Date(isoKey), data: [{ key: 'Active', data: active }, { key: 'Disabled', data: disabled }] }));
					
				const tenantTooltip = (
					<TooltipArea tooltip={<ChartTooltip placement="top" followCursor={true} content={(data) => {
						const d = data?.x instanceof Date ? data.x : new Date(data?.x ?? 0);
						const entry = tenantDayMap[d.toDateString()] || { active: 0, deleted: 0 };
						return <div style={{ borderRadius: 4, backgroundColor: theme.palette.inputColor, border: theme.palette.defaultBorder, color: theme.palette.text.primary, padding: '8px 12px', minWidth: 170 }}>
							<Typography variant="body2" style={{ fontWeight: 600, marginBottom: 4 }}>{!isNaN(d.getTime()) ? `${d.getDate()} ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}` : ''}</Typography>
							<Typography variant="body2" style={{ color: theme.palette.green }}>Active: {entry.active}</Typography>
							<Typography variant="body2" style={{ color: theme.palette.deleteColor }}>Deleted: {entry.deleted}</Typography>
						</div>;
					}} />} />
				);

				const locationTooltip = (
					<TooltipArea tooltip={<ChartTooltip placement="top" followCursor={true} content={(data) => {
						const d = data?.x instanceof Date ? data.x : new Date(data?.x ?? 0);
						const entry = locationDayMap[d.toDateString()] || { active: 0, disabled: 0 };
						return <div style={{ borderRadius: 4, backgroundColor: theme.palette.inputColor, border: theme.palette.defaultBorder, color: theme.palette.text.primary, padding: '8px 12px', minWidth: 170 }}>
							<Typography variant="body2" style={{ fontWeight: 600, marginBottom: 4 }}>{!isNaN(d.getTime()) ? `${d.getDate()} ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}` : ''}</Typography>
							<Typography variant="body2" style={{ color: theme.palette.green }}>Active: {entry.active}</Typography>
							<Typography variant="body2" style={{ color: theme.palette.deleteColor }}>Disabled: {entry.disabled}</Typography>
						</div>;
					}} />} />
				);

				const statBoxStyle = {
					display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
					margin: '5px',
					backgroundColor: theme.palette.cardBackgroundColor,
					border: theme.palette.defaultBorder,
					borderRadius: 0,
					width: 180, height: 180, flexShrink: 0,
				};

				return (<>
						<Typography variant="h4" style={{ marginTop: 20, marginBottom: 16, fontWeight: 'bold' }}>Tenants</Typography>
						<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 24, gap: 16 }}>
							<div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
								<Box sx={statBoxStyle}><Typography variant="h4" style={{ fontWeight: 'bold' }}>{totalTenants}</Typography><Typography variant="body1" color="textSecondary" style={{ marginTop: 6 }}>All Tenants</Typography></Box>
								<Box sx={statBoxStyle}><Typography variant="h4" style={{ fontWeight: 'bold', color: theme.palette.green }}>{activeTenants}</Typography><Typography variant="body1" color="textSecondary" style={{ marginTop: 6 }}>Active Tenants</Typography></Box>
								<Box sx={statBoxStyle}><Typography variant="h4" style={{ fontWeight: 'bold', color: theme.palette.deleteColor }}>{deletedTenants}</Typography><Typography variant="body1" color="textSecondary" style={{ marginTop: 6 }}>Deleted Tenants</Typography></Box>
							</div>

							{/* Date Filter placed next to the boxes */}
							<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: 16 }}>
								<StatsDateRangePicker
									startTime={otherStatsStart}
									endTime={otherStatsEnd}
									onStartChange={(val) => setOtherStatsStart(val)}
									onEndChange={(val) => setOtherStatsEnd(val)}
								/>
								{hasFilter && (
									<Button size="small" variant="outlined" onClick={() => { setOtherStatsStart(null); setOtherStatsEnd(null); }}
										style={{ textTransform: 'none', alignSelf: 'flex-start', marginLeft: 10, marginTop: 10, }}>
										Clear Filter
									</Button>
								)}
							</div>
						</div>

						{/* Tenants Chart */}
						<div style={{ marginBottom: 40, overflow: 'hidden', minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: theme.palette.defaultBorder, borderRadius: 4, backgroundColor: theme.palette.cardBackgroundColor }}>
							{tenantChartData.length > 0 ? (
								<StackedBarChart width="100%" height={250} data={tenantChartData}
									series={<StackedBarSeries colorScheme={[theme.palette.green, theme.palette.deleteColor]} tooltip={tenantTooltip} />}
									gridlines={<GridlineSeries line={<Gridline direction="all" />} />}
								/>
							) : (
								<Typography variant="body1" color="textSecondary">No data available</Typography>
							)}
						</div>

						{/* Locations Summary Boxes */}
						<Typography variant="h4" style={{ marginTop: 20, marginBottom: 16, fontWeight: 'bold' }}>Locations</Typography>
						<div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24, gap: 8 }}>
							<Box sx={statBoxStyle}><Typography variant="h4" style={{ fontWeight: 'bold' }}>{totalLocations}</Typography><Typography variant="body1" color="textSecondary" style={{ marginTop: 6 }}>Total Locations</Typography></Box>
							<Box sx={statBoxStyle}><Typography variant="h4" style={{ fontWeight: 'bold', color: theme.palette.green }}>{activeLocations}</Typography><Typography variant="body1" color="textSecondary" style={{ marginTop: 6 }}>Active Locations</Typography></Box>
							<Box sx={statBoxStyle}><Typography variant="h4" style={{ fontWeight: 'bold', color: theme.palette.deleteColor }}>{disabledLocations}</Typography><Typography variant="body1" color="textSecondary" style={{ marginTop: 6 }}>Disabled Locations</Typography></Box>
						</div>

						{/* Locations Chart */}
						<div style={{ marginBottom: 40, overflow: 'hidden', minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: theme.palette.defaultBorder, borderRadius: 4, backgroundColor: theme.palette.cardBackgroundColor }}>
							{locationChartData.length > 0 ? (
								<StackedBarChart width="100%" height={250} data={locationChartData}
									series={<StackedBarSeries colorScheme={[theme.palette.green, theme.palette.deleteColor]} tooltip={locationTooltip} />}
									gridlines={<GridlineSeries line={<Gridline direction="all" />} />}
								/>
							) : (
								<Typography variant="body1" color="textSecondary">No data available</Typography>
							)}
						</div>

						{/* Tenants Table */}
						<Typography variant="h4" style={{ marginTop: 30, marginBottom: 20, fontWeight: 'bold' }}>Tenants</Typography>
						<div style={{ width: '100%', minHeight: 400, overflowX: 'auto' }}>
							<DataGrid autoHeight rows={tenants}
								columns={[
									{ field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
									{ field: 'created_at', headerName: 'Created At', flex: 1, minWidth: 200, renderCell: (params) => formatCustomDate(params.row.created_at) },
									{ field: 'deleted_at', headerName: 'Deleted At', flex: 1, minWidth: 200, renderCell: (params) => formatCustomDate(params.row.deleted_at) },
									{ field: 'status', headerName: 'Status', flex: 1, minWidth: 150, renderCell: (params) => <Typography style={{ color: params.row.status === 'active' ? theme.palette.green : theme.palette.deleteColor, fontSize: 14, marginTop: 15 }}>{params.row.status}</Typography> },
								]}
								initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
								pageSizeOptions={[10, 25, 50, 100]} disableSelectionOnClick hideFooterSelectedRowCount
							/>
						</div>

						{/* Locations Table */}
						<Typography variant="h4" style={{ marginTop: 50, marginBottom: 20, fontWeight: 'bold' }}>Locations</Typography>
						<div style={{ width: '100%', minHeight: 400, overflowX: 'auto' }}>
							<DataGrid autoHeight rows={locations}
								columns={[
									{ field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
									{ field: 'org_name', headerName: 'Org Name', flex: 1, minWidth: 150 },
									{ field: 'created_at', headerName: 'Created At', flex: 1, minWidth: 220, renderCell: (params) => formatCustomDate(params.row.created_at) },
									{ field: 'status', headerName: 'Status', flex: 1, minWidth: 120, renderCell: (params) => <Typography style={{ color: params.row.status === 'active' ? theme.palette.green : theme.palette.deleteColor, fontSize: 14, marginTop: 15 }}>{params.row.status}</Typography> },
								]}
								initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
								pageSizeOptions={[10, 25, 50, 100]} disableSelectionOnClick hideFooterSelectedRowCount
							/>
						</div>
					</>);
				})()}
			</div>
		:
		<React.Fragment>
		<Typography style={{margin: "auto", marginLeft: 10, marginBottom: 20, fontSize: 16}} color="textSecondary">
		All shown statistics are based on your<a 
				href={`${globalUrl}/api/v1/orgs/${selectedOrganization?.id}/stats`} 
				target="_blank"
				style={{ textDecoration: "none", color: theme.palette.linkColor,}}
			> tenant's stats API.</a> The metric accuracy may be delayed by 24 hours.
		</Typography>

			{currentTab === 0 ? 
		<Typography style={{margin: "auto", marginLeft: 10, marginBottom: 20, fontSize: 16}} color="textSecondary">
			{isCloud ? "Cloud" : "OnPrem"} App Runs = Parent Tenant App runs + All Child Tenant App Runs + AI Tokens (converted) to App Runs <br /> <br />
			App Runs Mapping for external services: <br />
			<ul>
				<li>1 SMS = 3 appruns</li>
				<li>1 Email = 2 appruns</li>
				<li>1 Million AI Input Tokens = 250 app runs</li>
				<li>1 Million AI Output Tokens = 1500 app runs</li>
			</ul>
		</Typography>
		: null}

		{currentTab === 0 ?
		<Typography style={{margin: "auto", marginLeft: 10, marginBottom: 20, fontSize: 16}} color="textSecondary">
			Parent Tenant App Runs: {periodParentAppRuns ?? 0} <br />
            Child Tenant App Runs: {periodChildAppRuns ?? 0}
		</Typography>
		: null}

		{syncStats === true ?
		<Typography style={{margin: "auto", marginLeft: 10, marginBottom: 20, fontSize: 16}} color="textSecondary">
			{isCloud ? "On-Prem" : "Cloud"} App Runs = Parent Tenant App Runs + All Child Tenant App Runs + AI Tokens (converted) to App Runs
		</Typography>
		: null}

		{currentTab === 0 && !syncStats ? (
			<div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 10, marginBottom: 16 }}>
				{checkBoxes
				.sort((a, b) => (a.label === (isCloud ? "Cloud" : "On-Prem") ? -1 : 1))
				.map((item, index) => (
					<FormControlLabel
						key={item.label}
						style={{ opacity: index === 0 ? 1 : 0.8 }}
						control={<Checkbox checked={item.checked} onChange={e => item.setChecked(e.target.checked)} size="small" />}
						label={<Typography variant="body2" color="textPrimary">{item.label}</Typography>}
					/>
				))}
			</div>
		) : null}

		<div style={{display: "flex", flexDirection: "column", textAlign: "center",}}>
			<div style={{flexDirection: "row", }}>
			{filteredStatistics !== undefined ?
				<div style={{flex: 1, display: "flex", textAlign: "center",}}>

					{/* {syncStats == true ? null : 
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
					} */}

					{/* {syncStats === true ? null : */}
					<Tooltip title={
						<Typography variant="body1" style={{padding: 10, }}>
							App runs in the selected period
						</Typography>
					}>
						<Box sx={paperStyle}>
							{syncStats === true ? 
							<Typography variant="h4">
								{onpremAppRuns}
							</Typography>: 
							<Typography variant="h4">
								{filteredStatistics.monthly_app_executions === null || filteredStatistics.monthly_app_executions === undefined ? 0 : filteredStatistics.monthly_app_executions}
							</Typography>}
							<Typography variant="h6">
								App Runs 
							</Typography>
							<Typography variant="body2" color="textSecondary" style={{marginTop: 8, whiteSpace: "nowrap", }}>
								{formatRangeDate(parseDate(startTime || null, false))} - {formatRangeDate(parseDate(endTime || null, true))}
							</Typography>
						</Box>
					</Tooltip> 
					{/* } */}

					{syncStats === true || currentTab === 0 ? null :
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

					{/* {syncStats === true ? null :
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
					} */}
				<StatsDateRangePicker
				  startTime={startTime}
				  endTime={endTime}
				  onStartChange={handleStartTimeChange}
				  onEndChange={handleEndTimeChange}
					/>
				</div>
			: null}
			</div>
		</div>

		{appRuns === undefined ? 
			null
			: 
			<LineChartWrapper keys={appRuns} height={300} width={"100%"} inputname={"App Runs - Current Org"} border={false}/>
		}

		{childOrgsAppRuns === undefined || currentTab === 1 ? 
			null
			: 
			<LineChartWrapper keys={childOrgsAppRuns} height={300} width={"100%"} inputname={"Child Tenant App Runs"} border={false} />
		}

		{workflowRuns === undefined || currentTab === 0? 
			null
			: 
			<LineChartWrapper keys={workflowRuns} height={300} width={"100%"} inputname={"Daily Workflow Runs (including subflows)"} border={false} />
		}

		{subflowRuns === undefined || currentTab === 0 ? 
			null
			: 
			<LineChartWrapper keys={subflowRuns} height={300} width={"100%"} inputname={"Subflow Runs"} border={false} />
		}

		{/*appRunCosts === undefined ? 
			null
			: 
			<LineChartWrapper keys={appRunCosts} height={300} width={"100%"} inputname={"Apprun cost - Cost per day"}/>
		*/}

		{syncStats === true || currentTab === 0 ? null : 
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
		</React.Fragment>
		}
    </div>
  )

  const dataWrapper = (
    <div style={{ width: "100%", maxWidth: 1366, margin: "auto", boxSizing: 'border-box', overflow: 'hidden' }}>{data}</div>
  );

  return dataWrapper;
}

export default AppStats;
