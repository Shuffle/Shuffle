import React, { useState } from "react";
import { useInterval } from "react-powerhooks";
// nodejs library that concatenates classes
import classNames from "classnames";
import theme from '../theme';

// react plugin used to create charts
//import { Line, Bar } from "react-chartjs-2";
import { useAlert } from "react-alert";

import {
	Typography,
} from "@material-ui/core";

// core components
import {
  chartExample1,
  chartExample2,
  chartExample3,
  chartExample4,
} from "../charts.js";

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
} from 'reaviz';

const keys = [
	{ key: '1. Collect & Distribute', data: 2 },
	{ key: '2. Enrich', data: 11 },
	{ key: '3. Detect', data: 3 },
	{ key: '4. Respond', data: 4 },
	{ key: '5. Report', data: 12 },
	{ key: '6. Validate', data: 7, color: "red",},
]

const RadialChart = () => {
  const [hovered, setHovered] = useState("");

	return (
		<div style={{cursor: "pointer",}} onClick={() => {
			console.log("Click: ", hovered)	
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
						colorScheme={'#f86a3e'}
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
									console.log("Entered: ", event.value.x)
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
												<div style={{backgroundColor: theme.palette.inputColor, border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: 5, cursor: "pointer",}}>
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

  document.title = "Shuffle - dashboard";
  var dayGraphLabels = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];
  var dayGraphData = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];

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
    start();
    runUpdate();
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
    <div className="content">
			<RadialChart />
			{/*
			<StackedBarSeries
				type="stackedDiverging"
				data={keys}
			/>
			*/}

      {newdata}
    </div>
  );

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
};

export default Dashboard;
