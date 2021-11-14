import React, {useState} from 'react';
import { useInterval } from 'react-powerhooks';
// nodejs library that concatenates classes
import classNames from "classnames";
// react plugin used to create charts
import { Line, Bar } from "react-chartjs-2";
import { useAlert } from "react-alert";

// https://demos.creative-tim.com/black-dashboard-react/?ref=appseed#/admin/dashboard

// reactstrap components
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  Label,
  FormGroup,
  Input,
  Table,
  Row,
  Col,
  UncontrolledTooltip
} from "reactstrap";

// core components
import {
  chartExample1,
  chartExample2,
  chartExample3,
  chartExample4
} from "../charts.js";

// This is the start of a dashboard that can be used. 
// What data do we fill in here? Idk
const Dashboard = (props) => {
  const { globalUrl } = props;
	const alert = useAlert()
	const [bigChartData, setBgChartData] = useState("data1");
	const [dayAmount, setDayAmount] = useState(7);
	const [firstRequest, setFirstRequest] = useState(true);
	const [stats, setStats] = useState({})
	const [changeme, setChangeme] = useState("")
	const [statsRan, setStatsRan] = useState(false)
	
	document.title = "Shuffle - dashboard"
	var dayGraphLabels = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130]
	var dayGraphData = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130]

	const fetchdata = (stats_id) => {
		fetch(globalUrl+"/api/v1/stats/"+stats_id, {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  		credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for "+stats_id)
			}

			return response.json()
		})
		.then((responseJson) => {
			stats[stats_id] = responseJson
			setStats(stats)
			// Used to force updates
			setChangeme(stats_id)
		})
		.catch(error => {
			alert.error("ERROR: "+error.toString())
		});
	}

	let chart1_2_options = {
		maintainAspectRatio: false,
		legend: {
			display: false
		},
		tooltips: {
			backgroundColor: "#f5f5f5",
			titleFontColor: "#333",
			bodyFontColor: "#666",
			bodySpacing: 4,
			xPadding: 12,
			mode: "nearest",
			intersect: 0,
			position: "nearest"
		},
		responsive: true,
		scales: {
			yAxes: [
				{
					barPercentage: 1.6,
					gridLines: {
						drawBorder: false,
						color: "rgba(29,140,248,0.0)",
						zeroLineColor: "transparent"
					},
					ticks: {
						suggestedMin: 60,
						suggestedMax: 125,
						padding: 20,
						fontColor: "#9a9a9a"
					}
				}
			],
			xAxes: [
				{
					barPercentage: 1.6,
					gridLines: {
						drawBorder: false,
						color: "rgba(29,140,248,0.1)",
						zeroLineColor: "transparent"
					},
					ticks: {
						padding: 20,
						fontColor: "#9a9a9a"
					}
				}
			]
		}
	}

	const dayGraph = {
		data: canvas => {
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
					}
				]
			}
  	},
  	options: chart1_2_options,
	}

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
	]

	const runUpdate = () => {
		for (var key in variables) {
			fetchdata(variables[key])
		}
	}

	// Refresh every 60 seconds
	const autoUpdate = 60000
	const { start, stop } = useInterval({
		duration: autoUpdate,
		startImmediate: false,
		callback: () => {
			runUpdate()
		}
	})

	if (firstRequest) {
		console.log("HELO")
		setFirstRequest(false)	
		start()
		runUpdate()
	} else if (!statsRan) {
		// FIXME: Run this under runUpdate schedule?
		// 1. Fix labels in dayGraphy.data
		// 2. Add data to the daygraph
		
		// Every time there's an update :)

		// This should probably be done in the backend.. bleh
		if (stats["workflow_executions"] !== undefined && stats["workflow_executions"] !== null && stats["workflow_executions"].data !== undefined) {
			setStatsRan(true)
			//console.log("NEW DATA?: ", stats)
			console.log('SET WORKFLOW: ', stats["workflow_executions"])
			//var curday = startDate.getDate()

			// Index = what day are we on

			// 0 = today
			var newDayGraphLabels = []
			var newDayGraphData = []
			for (var i = dayAmount; i > 0; i--) {
				var enddate = new Date()
				enddate.setDate(-i)
				enddate.setHours(23,59,59,999)

				var startdate = new Date()
				startdate.setDate(-i)
				startdate.setHours(0,0,0,0)

				var endtime = enddate.getTime()/1000
				var starttime = startdate.getTime()/1000

				console.log("START: ", starttime, "END: ", endtime, "Data: ", stats["workflow_executions"])
				for (var key in stats["workflow_executions"].data) {
					const item = stats["workflow_executions"]["data"][key]
					console.log("ITEM: ", item.timestamp, endtime)
					console.log(endtime-starttime)
					if (endtime-starttime > endtime-item.timestamp && endtime.timestamp >= 0) {
						console.log("HIT? ")
					}
					console.log(item.timestamp-endtime)
					//console.log(item.timestamp-endtime)
					break
					if (item.timestamp > endtime && item.timestamp < starttime) {
						if (newDayGraphData[i-1] === undefined) {
							newDayGraphData[i-1] = 1
						} else {
							newDayGraphData[i-1] += 1
						}

						//break
					}
				}
				
				newDayGraphLabels.push(i)
			}

			console.log(newDayGraphLabels)
			console.log(newDayGraphData)
		}
	}

	const newdata = Object.getOwnPropertyNames(stats).length > 0 ?
		<div>
			Autoupdate every {autoUpdate/1000} seconds
			{variables.map(data => {
				if (stats[data] === undefined || stats[data] === null) {
					return null
				}

				if (stats[data].total === undefined) {
					return null
				}

				return (
					<div>
						{data}: {stats[data].total}
					</div>
				)
			})}
		</div>
		: null

	const data = 
		<div className="content">
			{newdata}
			<Row>
				<Col xs="12">
					<div className="chart-area">
						<Line
							data={dayGraph.data}
							options={dayGraph.options}
						/>
					</div>
				</Col>
				<Col xs="12">
					<Card className="card-chart">
						<CardHeader>
							<Row>
								<Col className="text-left" sm="6">
									<h5 className="card-category">Total Shipments</h5>
									<CardTitle tag="h2">Workflows</CardTitle>
								</Col>
								<Col sm="6">
									<ButtonGroup
										className="btn-group-toggle float-right"
										data-toggle="buttons"
									>
										<Button
											tag="label"
											className={classNames("btn-simple", {
												active: bigChartData === "data1"
											})}
											color="info"
											id="0"
											size="sm"
											onClick={() => setBgChartData("data1")}
										>
											<input
												defaultChecked
												className="d-none"
												name="options"
												type="radio"
											/>
											<span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
												Accounts
											</span>
											<span className="d-block d-sm-none">
												<i className="tim-icons icon-single-02" />
											</span>
										</Button>
										<Button
											color="info"
											id="1"
											size="sm"
											tag="label"
											className={classNames("btn-simple", {
												active: bigChartData === "data2"
											})}
											onClick={() => setBgChartData("data2")}
										>
											<input
												className="d-none"
												name="options"
												type="radio"
											/>
											<span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
												Purchases
											</span>
											<span className="d-block d-sm-none">
												<i className="tim-icons icon-gift-2" />
											</span>
										</Button>
										<Button
											color="info"
											id="2"
											size="sm"
											tag="label"
											className={classNames("btn-simple", {
												active: bigChartData === "data3"
											})}
											onClick={() => setBgChartData("data3")}
										>
											<input
												className="d-none"
												name="options"
												type="radio"
											/>
											<span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
												Sessions
											</span>
											<span className="d-block d-sm-none">
												<i className="tim-icons icon-tap-02" />
											</span>
										</Button>
									</ButtonGroup>
								</Col>
							</Row>
						</CardHeader>
						<CardBody>
							<div className="chart-area">
								<Line
									data={chartExample1[bigChartData]}
									options={chartExample1.options}
								/>
							</div>
						</CardBody>
					</Card>
				</Col>
			</Row>
			<Row>
				<Col lg="4">
					<Card className="card-chart">
						<CardHeader>
							<h5 className="card-category">Total Shipments</h5>
							<CardTitle tag="h3">
								<i className="tim-icons icon-bell-55 text-info" />{" "}
								763,215
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className="chart-area">
								<Line
									data={chartExample2.data}
									options={chartExample2.options}
								/>
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col lg="4">
					<Card className="card-chart">
						<CardHeader>
							<h5 className="card-category">Daily Sales</h5>
							<CardTitle tag="h3">
								<i className="tim-icons icon-delivery-fast text-primary" />{" "}
								3,500€
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className="chart-area">
								<Bar
									data={chartExample3.data}
									options={chartExample3.options}
								/>
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col lg="4">
					<Card className="card-chart">
						<CardHeader>
							<h5 className="card-category">Completed Tasks</h5>
							<CardTitle tag="h3">
								<i className="tim-icons icon-send text-success" /> 12,100K
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className="chart-area">
								<Line
									data={chartExample4.data}
									options={chartExample4.options}
								/>
							</div>
						</CardBody>
					</Card>
				</Col>
			</Row>
	</div>

	const dataWrapper = 
		<div style={{maxWidth: 1366, margin: "auto"}}>
			{data}
		</div>

	return dataWrapper 
}

export default Dashboard
