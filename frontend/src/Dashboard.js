import React, {useState} from 'react';
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
} from "./charts.js";

// This is the start of a dashboard that can be used. 
// What data do we fill in here? Idk
const Dashboard = (props) => {
  const { globalUrl } = props;
	const alert = useAlert()
	const [bigChartData, setBgChartData] = useState("data1");
	const [firstRequest, setFirstRequest] = useState(true);
	const [stats, setStats] = useState({})
	const [changeme, setChangeme] = useState("")
	
	document.title = "Shuffle - dashboard"

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
				console.log("Status not 200 for stream results :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			console.log("DATA: ", responseJson)
			stats[stats_id] = responseJson
			setStats(stats)
			// Used to force updates
			setChangeme(stats_id)
		})
		.catch(error => {
			alert.error("ERROR: "+error.toString())
		});
	}

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
	]

	if (firstRequest) {
		setFirstRequest(false)	

		for (var key in variables) {
			fetchdata(variables[key])
		}
	}


	const newdata = Object.getOwnPropertyNames(stats).length > 0 ?
		<div>
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
					<Card className="card-chart">
						<CardHeader>
							<Row>
								<Col className="text-left" sm="6">
									<h5 className="card-category">Total Shipments</h5>
									<CardTitle tag="h2">Performance</CardTitle>
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

export default Dashboard;
