import React, { useState, useEffect } from "react";
import { useInterval } from "react-powerhooks";
import { makeStyles, } from "@mui/styles";
// nodejs library that concatenates classes
import classNames from "classnames";
import theme from '../theme.jsx';
import { useNavigate, Link, useParams } from "react-router-dom";

// react plugin used to create charts
//import { Line, Bar } from "react-chartjs-2";
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import Draggable from "react-draggable";
import DashboardBarchart, { LoadStats } from '../components/DashboardBarchart.jsx';

import {
	Autocomplete, 
	Tooltip,
	TextField,
	IconButton,
	Button,
	Select,
	MenuItem,
	Typography,
	Grid,
	Paper,
	Chip,
	Checkbox,
} from "@mui/material";

import {
  Close as CloseIcon,
	DoneAll as DoneAllIcon,
	Description as DescriptionIcon,
	PlayArrow as PlayArrowIcon,
	Edit as EditIcon,
	CheckBox as CheckBoxIcon,
	CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
	OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";

import WorkflowPaper from "../components/WorkflowPaper.jsx"
import { removeParam } from "../views/AngularWorkflow.jsx"

// core components
//import {
//  chartExample1,
//  chartExample2,
//  chartExample3,
//  chartExample4,
//} from "../charts.js";

import { 
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
	AreaChart,
	AreaSeries,
	PointSeries,
} from 'reaviz';

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
  root: {
    "& .MuiAutocomplete-listbox": {
      border: "2px solid #f85a3e",
      color: "white",
      fontSize: 18,
      "& li:nth-child(even)": {
        backgroundColor: "#CCC",
      },
      "& li:nth-child(odd)": {
        backgroundColor: "#FFF",
      },
    },
  },
  inputRoot: {
    color: "white",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#f86a3e",
    },
  },
});

const inputdata = [
    {
        "key": "Threat Intel",
        "value": 18,
        "x": "2020-02-17T08:00:00.000Z",
        "x0": "2020-02-17T08:00:00.000Z",
        "x1": "2020-02-17T08:00:00.000Z",
        "y": 18,
        "y0": 0,
        "y1": 18
    },
    {
        "key": "Threat Intel",
        "value": 3,
        "x": "2020-02-21T08:00:00.000Z",
        "x0": "2020-02-21T08:00:00.000Z",
        "x1": "2020-02-21T08:00:00.000Z",
        "y": 3,
        "y0": 0,
        "y1": 3
    },
    {
        "key": "Threat Intel",
        "value": 14,
        "x": "2020-02-26T08:00:00.000Z",
        "x0": "2020-02-26T08:00:00.000Z",
        "x1": "2020-02-26T08:00:00.000Z",
        "y": 14,
        "y0": 0,
        "y1": 14
    },
    {
        "key": "Threat Intel",
        "value": 18,
        "x": "2020-02-29T08:00:00.000Z",
        "x0": "2020-02-29T08:00:00.000Z",
        "x1": "",
        "y": 18,
        "y0": 0,
        "y1": 18
    }
]

const LineChartWrapper = ({keys, height, width}) => {
  const [hovered, setHovered] = useState("");

	var inputdata = keys.data

	return (
		<div style={{}}>
			<Typography variant="h6" style={{marginBotton: 15}}>
				{keys.title}
			</Typography>
			<AreaChart
				style={{marginTop: 15}}
				height={height}
				width={width}
				data={inputdata}
    	  series={
					<AreaSeries 
						type="grouped"
						symbols={
							<PointSeries show={true} />
						} 
						colorScheme={(colorInput) => {
							var color = "cybertron"
							if (colorInput !== undefined && colorInput.length > 0) {
								color = colorInput[0].metadata !== undefined && colorInput[0].metadata.color !== undefined ? colorInput[0].metadata.color : color
							}

							return color
						}}
						tooltip={
							<TooltipArea
								color={"#000000"}
								style={{
									backgroundColor: "red",
								}}
								isRadial={true}
								onValueEnter={(event) => {
									if (hovered !== event.value.x) {
										//setHovered(event.value.x)
									}
								}}
								tooltip={
									<ChartTooltip
										followCursor={true}
										modifiers={{
											offset: '5px, 5px'
										}}
										content={(data, color) => {
											const name = data.metadata !== undefined && data.metadata.name !== undefined ? data.metadata.name : "No"

											return (
												<div style={{borderRadius: theme.palette?.borderRadius, backgroundColor: theme.palette.inputColor, border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: 5, cursor: "pointer",}}>
													<Typography variant="body1">
														{name}
													</Typography>
												</div>
											)
											/*
												<TooltipTemplate
													color={"#ffffff"}
													value={{
														x: data.x,
													}}
												/>
											)
											*/
										}
									}
									/>
								}
							/>
						}
					/>
				}
			/>
		</div>
	)
}

const RadialChart = ({keys, setSelectedCategory}) => {
  const [hovered, setHovered] = useState("");

	return (
		<div style={{cursor: "pointer",}} onClick={() => {
			console.log("Click: ", hovered)	
			if (setSelectedCategory !== undefined) {
				setSelectedCategory(hovered)
			}
		}}>
			<RadialAreaChart
				id="workflow_categories"
				height={500}
				width={500}
				data={keys}
    		axis={<RadialAxis type="category" />}
				series={
					<RadialAreaSeries 
						interpolation="smooth"
						colorScheme={(colorInput) => {
							return '#f86a3e'
						}}
						animated={false}
						id="workflow_series_id"
						style={{cursor: "pointer",}}
						line={
							<RadialLine
								color={"#000000"}
								data={(data, color) => {
									console.log("INFO: ", data, color)
									return (
										null
									)
								}}
							/>
						}
						tooltip={
							<TooltipArea
								color={"#000000"}
								style={{
									backgroundColor: "red",
								}}
								isRadial={true}
								onValueEnter={(event) => {
									if (hovered !== event.value.x) {
										setHovered(event.value.x)
									}
								}}
								tooltip={
									<ChartTooltip
										followCursor={true}
										modifiers={{
											offset: '5px, 5px'
										}}
										content={(data, color) => {
											return (
												<div style={{borderRadius: theme.palette?.borderRadius, backgroundColor: theme.palette.inputColor, border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: 5, cursor: "pointer",}}>
													<Typography variant="body1">
														{data.x}
													</Typography>
												</div>
											)
											/*
												<TooltipTemplate
													color={"#ffffff"}
													value={{
														x: data.x,
													}}
												/>
											)
											*/
										}
									}
									/>
								}
							/>
	
						}
					/>
				}
			/>
		</div>
	)
  //axis={<RadialAxis type="category" />}
}

// This is the start of a dashboard that can be used.
// What data do we fill in here? Idk
const Dashboard = (props) => {
  const { globalUrl, isLoggedIn } = props;
  //const alert = useAlert();
  const [bigChartData, setBgChartData] = useState("data1");
  const [dayAmount, setDayAmount] = useState(7);
  const [firstRequest, setFirstRequest] = useState(true);
  const [stats, setStats] = useState({});
  const [changeme, setChangeme] = useState("");
  const [statsRan, setStatsRan] = useState(false);
	const [keys, setKeys] = useState([])
	const [treeKeys, setTreeKeys] = useState([])

  const [selectedUsecaseCategory, setSelectedUsecaseCategory] = useState("");
  const [selectedUsecases, setSelectedUsecases] = useState([]);
  const [usecases, setUsecases] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [frameworkData, setFrameworkData] = useState(undefined);

  const [widgetData, setWidgetData] = useState([]);
  const [newWidgetData, setNewWidgetData] = useState([]);

  const [, setUpdate] = useState(0);

	let navigate = useNavigate();
  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

	useEffect(() => {
		const widgetnames = ["app_executions_cloud"]
		for (let widgetkey in widgetnames) {
			const widgetName = widgetnames[widgetkey]

			console.log("NAME: ", widgetName)

			const resp = LoadStats(globalUrl, widgetName)
			if (resp !== undefined) { 
				resp.then((data) => {
					console.log("Got data in parent: ", data)
					if (data === undefined) {
					} else {
						newWidgetData.push(data)
						setNewWidgetData(newWidgetData)
					}
				})
			}
		}
	  }, [])

	useEffect(() => {
		if (selectedUsecaseCategory.length === 0) {
			setSelectedUsecases(usecases)
		} else {
			const foundUsecase = usecases.find(data => data.name === selectedUsecaseCategory)
			if (foundUsecase !== undefined && foundUsecase !== null) {
				setSelectedUsecases([foundUsecase])
			}
		}
	}, [selectedUsecaseCategory])


	const checkSelectedParams = () => {
		const urlSearchParams = new URLSearchParams(window.location.search)
		const params = Object.fromEntries(urlSearchParams.entries())

		const curpath = typeof window === "undefined" || window.location === undefined ? "" : window.location.pathname;
		const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;

		const foundQuery = params["selected"]
		if (foundQuery !== null && foundQuery !== undefined) {
			setSelectedUsecaseCategory(foundQuery)

      const newitem = removeParam("selected", cursearch);
			navigate(curpath + newitem)
		}

		const foundQuery2 = params["selected_object"]
		if (foundQuery2 !== null && foundQuery2 !== undefined) {
			console.log("Got selected_object: ", foundQuery2)

			const queryName = foundQuery2.toLowerCase().replaceAll("_", " ")
			// Waiting a bit for it to render
			setTimeout(() => {
				const foundItem = document.getElementById(queryName)
				if (foundItem !== undefined && foundItem !== null) { 
					foundItem.click()
				} else { 
					//console.log("Couldn't find item with name ", queryName)
				}
			}, 100);
		}

	}

	useEffect(() => {
		if (usecases.length > 0) {
			console.log(usecases)
			checkSelectedParams()
		}
	}, [usecases])

	const getWidget = (dashboard, widget) => {
		fetch(`${globalUrl}/api/v1/dashboards/${dashboard}/widgets/${widget}`, {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  credentials: "include",
		})
		  .then((response) => {
			if (response.status !== 200) {
			  console.log("Status not 200 for framework!");
			}

			return response.json();
		  })
		  .then((responseJson) => {
				if (responseJson.success === false) {
					if (responseJson.reason !== undefined) {
						//toast("Failed loading: " + responseJson.reason)
					} else {
						//toast("Failed to load framework for your org.")
					}
				} else {
					var tmpdata = responseJson
					for (var key in tmpdata.data) {
						for (var subkey in tmpdata.data[key].data) {
							tmpdata.data[key].data[subkey].key = new Date(tmpdata.data[key].data[subkey].key)
						}
					}

					const foundWidget = widgetData.findIndex(data => data.title === widget)
					if (foundWidget !== undefined && foundWidget !== null && foundWidget >= 0) {
						widgetData[foundWidget] = tmpdata
					} else { 
						widgetData.push(tmpdata)
					}

					setWidgetData(widgetData)
				}
			})
      .catch((error) => {
        //toast(error.toString());
      })
		}

  document.title = "Shuffle - Dashboard";
  var dayGraphLabels = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];
  var dayGraphData = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];

	const handleKeysetting = (categorydata) => {
		var allCategories = []
		var treeCategories = []
		for (key in categorydata) {
			const category = categorydata[key]
			allCategories.push({"key": category.name, "data": category.list.length, "color": category.color})
			treeCategories.push({"key": category.name, "data": 100, "color": category.color,})
			for (var subkey in category.list) {
				treeCategories.push({"key": category.list[subkey].name, "data": 20, "color": category.color})
			}
		} 

		setKeys(allCategories)
		setTreeKeys(treeCategories)
	}

  useEffect(() => {
		getWidget("main", "Overall") 
		getWidget("main", "Overall2") 
  }, [])

  const fetchdata = (stats_id) => {
    fetch(globalUrl + "/api/v1/stats/" + stats_id, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for " + stats_id);
        }

        return response.json();
      })
      .then((responseJson) => {
        stats[stats_id] = responseJson;
        setStats(stats);
        // Used to force updates
        setChangeme(stats_id);
      })
      .catch((error) => {
        //toast("ERROR: " + error.toString());
        console.log("ERROR: " + error.toString());
      });
  };

  let chart1_2_options = {
    maintainAspectRatio: false,
    legend: {
      display: false,
    },
    tooltips: {
      backgroundColor: "#f5f5f5",
      titleFontColor: "#333",
      bodyFontColor: "#666",
      bodySpacing: 4,
      xPadding: 12,
      mode: "nearest",
      intersect: 0,
      position: "nearest",
    },
    responsive: true,
    scales: {
      yAxes: [
        {
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: "rgba(29,140,248,0.0)",
            zeroLineColor: "transparent",
          },
          ticks: {
            suggestedMin: 60,
            suggestedMax: 125,
            padding: 20,
            fontColor: "#9a9a9a",
          },
        },
      ],
      xAxes: [
        {
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: "rgba(29,140,248,0.1)",
            zeroLineColor: "transparent",
          },
          ticks: {
            padding: 20,
            fontColor: "#9a9a9a",
          },
        },
      ],
    },
  };

  const dayGraph = {
    data: (canvas) => {
      let ctx = canvas.getContext("2d");

      let gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

      gradientStroke.addColorStop(1, "rgba(29,140,248,0.2)");
      gradientStroke.addColorStop(0.4, "rgba(29,140,248,0.0)");
      gradientStroke.addColorStop(0, "rgba(29,140,248,0)"); //blue colors

      return {
        labels: dayGraphLabels,
        datasets: [
          {
            label: "My First dataset",
            fill: true,
            backgroundColor: gradientStroke,
            borderColor: "#1f8ef1",
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: "#1f8ef1",
            pointBorderColor: "rgba(255,255,255,0)",
            pointHoverBackgroundColor: "#1f8ef1",
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: dayGraphData,
          },
        ],
      };
    },
    options: chart1_2_options,
  };

  // All these are currently tracked.
  const variables = [
    "backend_executions",
    "workflow_executions",
    "workflow_executions_aborted",
    "workflow_executions_success",
    "total_apps_created",
    "total_apps_loaded",
    "openapi_apps_created",
    "total_apps_deleted",
    "total_webhooks_ran",
    "total_workflows",
    "total_workflow_actions",
    "total_workflow_triggers",
  ];

  const runUpdate = () => {
    for (var key in variables) {
      fetchdata(variables[key]);
    }
  };

  // Refresh every 60 seconds
  const autoUpdate = 60000;
  const { start, stop } = useInterval({
    duration: autoUpdate,
    startImmediate: false,
    callback: () => {
      runUpdate();
    },
  });

  if (firstRequest) {
    setFirstRequest(false);
    //start();
    //runUpdate();
  } else if (!statsRan) {
    // FIXME: Run this under runUpdate schedule?
    // 1. Fix labels in dayGraphy.data
    // 2. Add data to the daygraph

    // Every time there's an update :)

    // This should probably be done in the backend.. bleh
    if (
      stats["workflow_executions"] !== undefined &&
      stats["workflow_executions"] !== null &&
      stats["workflow_executions"].data !== undefined
    ) {
      setStatsRan(true);
      console.log("SET WORKFLOW: ", stats["workflow_executions"]);
      //var curday = startDate.getDate()

      // Index = what day are we on

      // 0 = today
      var newDayGraphLabels = [];
      var newDayGraphData = [];
      for (var i = dayAmount; i > 0; i--) {
        var enddate = new Date();
        enddate.setDate(-i);
        enddate.setHours(23, 59, 59, 999);

        var startdate = new Date();
        startdate.setDate(-i);
        startdate.setHours(0, 0, 0, 0);

        var endtime = enddate.getTime() / 1000;
        var starttime = startdate.getTime() / 1000;

        console.log(
          "START: ",
          starttime,
          "END: ",
          endtime,
          "Data: ",
          stats["workflow_executions"]
        );
        for (var key in stats["workflow_executions"].data) {
          const item = stats["workflow_executions"]["data"][key];
          console.log("ITEM: ", item.timestamp, endtime);
          console.log(endtime - starttime);
          if (
            endtime - starttime > endtime - item.timestamp &&
            endtime.timestamp >= 0
          ) {
            console.log("HIT? ");
          }
          console.log(item.timestamp - endtime);
          //console.log(item.timestamp-endtime)
          break;
          if (item.timestamp > endtime && item.timestamp < starttime) {
            if (newDayGraphData[i - 1] === undefined) {
              newDayGraphData[i - 1] = 1;
            } else {
              newDayGraphData[i - 1] += 1;
            }

            //break
          }
        }

        newDayGraphLabels.push(i);
      }

      console.log(newDayGraphLabels);
      console.log(newDayGraphData);
    }
  }

  const newdata =
    Object.getOwnPropertyNames(stats).length > 0 ? (
      <div>
        Autoupdate every {autoUpdate / 1000} seconds
        {variables.map((data) => {
          if (stats[data] === undefined || stats[data] === null) {
            return null;
          }

          if (stats[data].total === undefined) {
            return null;
          }

          return (
            <div>
              {data}: {stats[data].total}
            </div>
          );
        })}
      </div>
    ) : null;

	const WidgetController = (props) => {
		const { data, index, availableStats, } = props
		const [hovering, setHovering] = useState(false)

		const newname = data.key !== undefined ? data.key.replaceAll("_", " ") : ""

		console.log("KEYDATA: ", data)

		const loadNewStats = (newkey) => {
			const resp = LoadStats(globalUrl, newkey)
			if (resp !== undefined) { 
				resp.then((respdata) => {
					if (respdata === undefined || respdata === null) {
						toast("Failed to laod data. Please try again, or contact support@shuffler.io if this persists.")
					} else {
						newWidgetData[index] = respdata
						setNewWidgetData(newWidgetData)

						setUpdate(Math.random())
					}
				})
			}
		}

		return (
			<Draggable>
				<Paper 
					style={{
						height: "100%", width: "100%", maxWidth: 500, margin: 15, padding: "15px 15px 15px 15px", textAlign: "left", 
						backgroundColor: hovering ? theme.palette.inputColor : theme.palette.backgroundColor,
						cursor: hovering ? "pointer" : "default",
					}}
					onMouseEnter={() => {
						setHovering(true)
					}}
					onMouseLeave={() => {
						setHovering(false)
					}}
				>
					<div style={{display: "flex", justifyContent: "space-between", alignItems: "center",}}>
						<Typography variant="h6">
							{newname}
						</Typography>

						{data.available_keys === undefined || data.available_keys === null || data.available_keys.length === 0 ? null :
							<Select
								  MenuProps={{
									disableScrollLock: true,
								  }}
								  labelId="Response Action"
								  value={data.key}
								  SelectDisplayProps={{
									style: {
									},
								  }}
								  fullWidth
								  onChange={(e) => {
									  loadNewStats(e.target.value)
								  }}
								  style={{
									backgroundColor: theme.palette.inputColor,
									color: "white",
									height: 40,
									maxWidth: 150, 
									borderRadius: theme.palette?.borderRadius,
								  }}
								>
									{data.available_keys.map((foundKey, index) => {
										const parsedKeyName = foundKey.replaceAll("_", " ")

										return (
										  <MenuItem
											style={{
											  backgroundColor: theme.palette.inputColor,
											  color: "white",
											}}
											value={foundKey}
										  >
											<em>{parsedKeyName}</em>
										  </MenuItem>
										)
									})}
							</Select>
						}
					</div>
					<DashboardBarchart 
						timelineData={data}
						height={50}
					/>
				</Paper>
			</Draggable>
		)
	}

  const data = (
    <div className="content" style={{width: 1000, margin: "auto", paddingBottom: 200, textAlign: "center",}}>
			<div style={{width: 500, margin: "auto"}}>
				{keys.length > 0 ?
					<span>
						<RadialChart keys={keys} setSelectedCategory={setSelectedUsecaseCategory} />
					</span>
				: null}
			</div>

			{/*widgetData === undefined || widgetData === null || widgetData === [] || widgetData.length === 0 ? null : 
				<Draggable>
					<Paper style={{height: 350, width: 500, padding: "15px 15px 15px 15px", }}>
						<LineChartWrapper keys={widgetData[0]} height={280} width={470}  />
					</Paper>
				</Draggable>
			*/}

	  		{newWidgetData === undefined || newWidgetData === null || newWidgetData === [] ? null :
				newWidgetData.map((data, index) => {

					return (
						<WidgetController
							key={index}
							index={index}
							data={data}
						/>
					)
				})
			}
    </div>
  );

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
};

export default Dashboard;
