import React, { useState, useEffect } from "react";
import { useInterval } from "react-powerhooks";
// nodejs library that concatenates classes
import classNames from "classnames";
import theme from '../theme';

// react plugin used to create charts
//import { Line, Bar } from "react-chartjs-2";
import { useAlert } from "react-alert";

import {
	Typography,
	Grid,
	Paper,
	Chip,
} from "@material-ui/core";

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
} from 'reaviz';

const categorydata = [
    {
        "name": "1. Collect & Distribute",
        "list": [
            {
                "name": "2-way Ticket synchronization",
                "items": {}
            },
            {
                "name": "Email management",
                "items": {
                    "name": "Release a quarantined message",
                    "items": {}
                }
            },
            {
                "name": "EDR to ticket",
                "items": {
                    "name": "Get host information",
                    "items": {}
                }
            },
            {
                "name": "SIEM to ticket",
                "items": {}
            },
            {
                "name": "ChatOps",
                "items": {}
            },
            {
                "name": "Threat Intel received",
                "items": {}
            },
            {
                "name": "Domain investigation with LetsEncrypt",
                "items": {}
            },
            {
                "name": "Botnet tracker",
                "items": {}
            },
            {
                "name": "Get running containers",
                "items": {}
            },
            {
                "name": "Assign tickets",
                "items": {}
            },
            {
                "name": "Firewall alerts",
                "items": {
                    "name": "URL filtering",
                    "items": {}
                }
            },
            {
                "name": "IDS/IPS alerts",
                "items": {
                    "name": "Manage policies",
                    "items": {}
                }
            },
            {
                "name": "Deduplicate information",
                "items": {}
            },
            {
                "name": "Correlate information",
                "items": {}
            }
        ]
    },
    {
        "name": "3. Detect",
        "list": [
            {
                "name": "Search SIEM (Sigma)",
                "items": {
                    "name": "Endpoint",
                    "items": {}
                }
            },
            {
                "name": "Search EDR (OSQuery)",
                "items": {}
            },
            {
                "name": "Search emails (Phish)",
                "items": {
                    "name": "Check headers and IOCs",
                    "items": {}
                }
            },
            {
                "name": "Search IOCs (ioc-finder)",
                "items": {}
            },
            {
                "name": "Search files (Yara)",
                "items": {}
            },
            {
                "name": "Correlate tickets",
                "items": {}
            },
            {
                "name": "Honeypot access",
                "items": {
                    "name": "...",
                    "items": {}
                }
            }
        ]
    },
    {
        "name": "Verify",
        "list": [
            {
                "name": "Discover vulnerabilities",
                "items": {}
            },
            {
                "name": "Discover assets",
                "items": {}
            },
            {
                "name": "Ensure policies are followed",
                "items": {}
            },
            {
                "name": "Find Inactive users",
                "items": {}
            },
            {
                "name": "Ensure access rights match HR systems",
                "items": {}
            },
            {
                "name": "Ensure onboarding is followed",
                "items": {}
            },
            {
                "name": "Third party apps in SaaS",
                "items": {}
            },
            {
                "name": "Devices used for your cloud account",
                "items": {}
            },
            {
                "name": "Too much access in GCP/Azure/AWS/ other clouds",
                "items": {}
            },
            {
                "name": "Certificate validation",
                "items": {}
            },
            {
                "name": "Monitor new DNS entries for domain with passive DNS",
                "items": {}
            },
            {
                "name": "Monitor and track password dumps",
                "items": {}
            },
            {
                "name": "Monitor for mentions of domain on darknet sites",
                "items": {}
            },
            {
                "name": "Reporting",
                "items": {
                    "name": "Monthly reports",
                    "items": {
                        "name": "...",
                        "items": {}
                    }
                }
            }
        ]
    },
    {
        "name": "4. Respond",
        "list": [
            {
                "name": "Eradicate malware",
                "items": {}
            },
            {
                "name": "Quarantine host(s)",
                "items": {}
            },
            {
                "name": "Trigger scans",
                "items": {}
            },
            {
                "name": "Update indicators (FW, EDR, SIEM...)",
                "items": {}
            },
            {
                "name": "Autoblock activity when threat intel is received",
                "items": {}
            },
            {
                "name": "Lock/Delete/Reset account",
                "items": {}
            },
            {
                "name": "Lock vault",
                "items": {}
            },
            {
                "name": "Increase authentication",
                "items": {}
            },
            {
                "name": "Trigger scans",
                "items": {}
            },
            {
                "name": "Get policies from assets",
                "items": {}
            }
        ]
    },
    {
        "name": "2. Enrich",
        "list": [
            {
                "name": "Internal Enrichment",
                "items": {
                    "name": "...",
                    "items": {}
                }
            },
            {
                "name": "External historical Enrichment",
                "items": {
                    "name": "...",
                    "items": {}
                }
            },
            {
                "name": "Realtime",
                "items": {
                    "name": "Analyze screenshots",
                    "items": {}
                }
            },
            {
                "name": "Ticketing webhook verification",
                "items": {}
            }
        ]
    }
]

const UsecaseListComponent = ({keys}) => {
	if (keys === undefined || keys === null || keys.length === 0) {
		return null
	}

	return (
		<div style={{marginTop: 25, minHeight: 1000,}}>
			<Typography variant="h1">
				Shuffle usecases
			</Typography>
			<Typography variant="body1">
				Usecases in Shuffle are divided into {keys.length} type{keys.length === 1 ? "" : "s"}. 
			</Typography>
			{keys.map((usecase, index) => {
				return (
					<div key={index} style={{marginTop: index === 0 ? 50 : 100}}>
						<Typography variant="h6">
							{usecase.name}
						</Typography>
      			<Grid container spacing={3} style={{marginTop: 25}}>
							{usecase.list.map((subcase, subindex) => {
								return (
      						<Grid item xs={4} key={subindex} style={{minHeight: 110,}}>
										<Paper style={{padding: "30px 30px 20px 30px", minHeight: 110, cursor: "pointer", border: `1px solid ${usecase.color}`}} onClick={() => {
											console.log("Clicked: ", subcase.name)
										}}>
											<Typography variant="body1">
												<b>{subcase.name}</b>
											</Typography>
										</Paper>
      						</Grid>
								)
							})}
      			</Grid>
					</div>
				)
			})}
		</div>
	)
}

const TreeChart = ({keys}) => {
  const [hovered, setHovered] = useState("");

	return (
		<div style={{cursor: "pointer",}} onClick={() => {
			console.log("Click: ", hovered)	
		}}>
			<TreeMap
				id="all_categories"
				data={keys}
				margins={10}
				series={
					<TreeMapSeries
						colorScheme={(info) => {
							return info.color
						}}
						label={
							<TreeMapLabel 
								fontSize="15px"
								fill="#ffffff"
								wrap={false}
							/>
						}
						rect={
							<TreeMapRect 
								cursor="pointer"
								animated={true}
								onClick={(event) => {
									console.log("Click: ", event)
								}}
							/>
						}
					/>
				}
			/>
		</div>
	)
  //axis={<RadialAxis type="category" />}
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
							console.log("Color: ", colorInput)
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
												<div style={{borderRadius: theme.palette.borderRadius, backgroundColor: theme.palette.inputColor, border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: 5, cursor: "pointer",}}>
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
  const { globalUrl } = props;
  const alert = useAlert();
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

	useEffect(() => {
		console.log("Changed: ", selectedUsecaseCategory)
		if (selectedUsecaseCategory.length === 0) {
			setSelectedUsecases(usecases)
		} else {
			const foundUsecase = usecases.find(data => data.name === selectedUsecaseCategory)
			if (foundUsecase !== undefined && foundUsecase !== null) {
				console.log("FOUND: ", foundUsecase)
				setSelectedUsecases([foundUsecase])
			}
		}
	}, [selectedUsecaseCategory])

  document.title = "Shuffle - usecases";
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

  const fetchUsecases = () => {
    fetch(globalUrl + "/api/v1/workflows/usecases", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for usecases");
        }

        return response.json();
      })
      .then((responseJson) => {
				if (responseJson.success !== false) {
					console.log("Usecases: ", responseJson)
					handleKeysetting(responseJson)
					setUsecases(responseJson)
  				setSelectedUsecases(responseJson)
				}
      })
      .catch((error) => {
        //alert.error("ERROR: " + error.toString());
        console.log("ERROR: " + error.toString());
      });
  };

  useEffect(() => {
		fetchUsecases()
  }, []);

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
        //alert.error("ERROR: " + error.toString());
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
    console.log("HELO");
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
      //console.log("NEW DATA?: ", stats)
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

  const data = (
    <div className="content" style={{width: 1000, margin: "auto", paddingBottom: 200, textAlign: "center",}}>
			<div style={{width: 500, margin: "auto"}}>
				{keys.length > 0 ?
					<RadialChart keys={keys} setSelectedCategory={setSelectedUsecaseCategory} />
				: null}
			</div>

			{usecases !== null && usecases !== undefined && usecases.length > 0 ? 
				<div style={{ display: "flex", marginLeft: 100,}}>
					{usecases.map((usecase, index) => {
						return (
							<Chip
								key={usecase.name}
								style={{
									backgroundColor: selectedUsecaseCategory === usecase.name ? usecase.color : theme.palette.surfaceColor,
									marginRight: 10, 
									paddingLeft: 5,
									paddingRight: 5,
									height: 28,
									cursor: "pointer",
									border: `1px solid ${usecase.color}`,
									color: "white",
								}}
								label={`${usecase.name} (${usecase.list.length})`}
								onClick={() => {
									console.log("Clicked: ", usecase.name)
									if (selectedUsecaseCategory === usecase.name) {
										setSelectedUsecaseCategory("")
									} else {
										setSelectedUsecaseCategory(usecase.name)
									}
									//addFilter(usecase.name.slice(3,usecase.name.length))
								}}
								variant="outlined"
								color="primary"
							/>
						)
					})}
				</div>
			: null}

			<UsecaseListComponent keys={selectedUsecases} />

			{treeKeys.length > 0 ? 
				<TreeChart keys={treeKeys} />
			: null}

      {newdata}
    </div>
  );

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
};

export default Dashboard;
