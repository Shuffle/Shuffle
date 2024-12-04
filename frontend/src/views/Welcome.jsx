import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';
import WelcomeForm2 from "../components/WelcomeForm2.jsx";
import AppFramework from "../components/AppFramework.jsx";
import {isMobile} from "react-device-detect";
import {
	ArrorForwardIos as ArrowForwardIosIcon,
} from '@mui/icons-material';

import { 
	Grid, 
	Container,
  Fade,
	Typography, 
	Paper,
	Button,
	Card,
	CardContent,
	CardActionArea,
	Stepper,
	Step,
	StepLabel,
} from '@mui/material';
import theme from '../theme.jsx';
import { useNavigate, Link } from "react-router-dom";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Drift from "react-driftjs";

const Welcome = (props) => {
    const { globalUrl, surfaceColor, newColor, mini, inputColor, userdata, isLoggedIn, isLoaded, serverside, checkLogin } = props;
    const [skipped, setSkipped] = React.useState(new Set());
    const [inputUsecase, setInputUsecase] = useState({});
  	const [frameworkData, setFrameworkData] = useState(undefined);
  	const [discoveryWrapper, setDiscoveryWrapper] = useState(undefined);
    const [activeStep, setActiveStep] = React.useState(0);
  	const [apps, setApps] = React.useState([]);
	const [defaultSearch, setDefaultSearch] = React.useState("")
	const [selectionOpen, setSelectionOpen] = React.useState(false)
	const [showWelcome, setShowWelcome] = React.useState(false)
  	const [usecases, setUsecases] = React.useState([]);
  	const [workflows, setWorkflows] = React.useState([]);

	let navigate = useNavigate();
	useEffect(() => {
		if (checkLogin !== undefined) {
			checkLogin()
		}
	}, [activeStep])

  	const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
		const [steps, setSteps] = useState([
			"Help us get to know you", 
			"Find your Apps", 
			"Discover Usecases",
		])


		const handleKeysetting = (categorydata, workflows) => {
			//workflows[0].category = ["detect"]
			//workflows[0].usecase_ids = ["Correlate tickets"]

			if (workflows !== undefined && workflows !== null) {
				var newcategories = []
				for (var key in categorydata) {
					var category = categorydata[key]
					category.matches = []

					for (var subcategorykey in category.list) {
						var subcategory = category.list[subcategorykey]
						subcategory.matches = []

						for (var workflowkey in workflows) {
							const workflow = workflows[workflowkey]

							if (workflow.usecase_ids !== undefined && workflow.usecase_ids !== null) {
								for (var usecasekey in workflow.usecase_ids) {

									if (workflow.usecase_ids[usecasekey].toLowerCase() === subcategory.name.toLowerCase()) {
										//console.log("Got match: ", workflow.usecase_ids[usecasekey])

										category.matches.push({
											"workflow": workflow.id,
											"category": subcategory.name,
										})
										subcategory.matches.push(workflow.id)
										break
									}
								}
							}

							if (subcategory.matches.length > 0) {
								break
							}
						}
					}

					newcategories.push(category)
				} 

				setUsecases(newcategories)
			} else {
				setUsecases(categorydata)
			}

			setWorkflows(workflows)
		}
  
		const fetchUsecases = (workflows) => {
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

				return response.json()
			})
			.then((responseJson) => {
				if (responseJson.success !== false) {
					handleKeysetting(responseJson, workflows)
				} else {
					//setWorkflows(workflows);
					//setWorkflowDone(true);
				}
			})
			.catch((error) => {
				console.log("Usecase error: " + error.toString())
			});
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
					console.log("Status not 200 for workflows :O!: ", response.status);
				}

				return response.json();
			})
			.then((responseJson) => {
				if (responseJson !== undefined) {
					var newarray = []
					for (var key in responseJson) {
						const wf = responseJson[key]
						if (wf.public === true) {
							continue
						}

						newarray.push(wf)
					}

					// Workflows are set in here
					fetchUsecases(newarray)
				}
			})
			.catch((error) => {
				console.log("err in get workflows: ", error.toString());
			})
		}

		const getFramework = () => {
			fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
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
					setFrameworkData({})

					if (responseJson.reason !== undefined) {
						//toast("Failed loading: " + responseJson.reason)
					} else {
						//toast("Failed to load framework for your org.")
					}
				} else {
					setFrameworkData(responseJson)
				}
			})
			.catch((error) => {
				console.log("err in framework: ", error.toString());
			})
		}

		const getApps = () => {
			fetch(globalUrl + "/api/v1/apps", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				credentials: "include",
			})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for apps :O!");
				}

				return response.json();
			})
			.then((responseJson) => {
				setApps(responseJson);
			})
			.catch((error) => {
				console.log("App loading error: "+error.toString());
			});
		}

		const usecaseButtons = [{
			"name": "Phishing",
			"usecase": "Email management",
			"color": "#C51152",
		}, {
			"name": "Enrichment", 
			"usecase": "2. Enrich",
			"color": "#F4C20D",
		}, {
			"name": "Detection",
			"usecase": "3. Detect",
			"color": "#3CBA54",
		}, {
			"name": "Response",
			"usecase": "4. Respond",
			"color": "#4885ED",
		}]

		const handleSetSearch = (input, orgupdate) => {
			if (input !== defaultSearch) {
				setDefaultSearch(input)
				setSelectionOpen(false)
				setTimeout(function(){
					setSelectionOpen(true)
				}, 150);

				//if (userdata !== undefined && userdata.active_org !== undefined && userdata.active_org.id !== undefined) {
				//	sendOrgUpdate("", "", userdata.active_org.id, orgupdate) 
				//}
			} else {
				setDefaultSearch("")
				setSelectionOpen(false)
			}
		}

		useEffect(() => {
			getFramework() 
			getApps()
			getAvailableWorkflows() 

			if (window.location.search !== undefined && window.location.search !== null) {
				const urlSearchParams = new URLSearchParams(window.location.search);
				const params = Object.fromEntries(urlSearchParams.entries());
				const foundTab = params["tab"];

				// Make foundtab into a number
				console.log("foundTab: ", foundTab, activeStep+1)
				if (foundTab !== null && foundTab !== undefined && !isNaN(foundTab) && foundTab >= 1 && foundTab <= 3) {
					console.log("SETTING TAB TO: ", foundTab)

					setShowWelcome(true)
					if (foundTab === 3 || foundTab === "3") {
						handleSetSearch(usecaseButtons[0].name, usecaseButtons[0].usecase)
					}

					setActiveStep(foundTab-1)

					//setRenderDone(

				}
			}
		}, [])

    const isStepSkipped = step => {
        return skipped.has(step)
    }

		const paperObject = {
			flex: 1, 
			padding: 0, 
			textAlign: "center",
			maxWidth: isMobile ? null : 275,
			minWidth: isMobile ? null : 275, 
			backgroundColor: theme.palette.surfaceColor,
			color: "white",
			borderRadius: theme.palette?.borderRadius,
		}

		const actionObject = {
			padding: "25px", 
			maxHeight: 280,
			minHeight: 280,
			borderRadius: theme.palette?.borderRadius,
		}

		const imageStyle = {
			width: 70, 
			// height: 150, 
			// margin: "auto", 
			// marginTop: 10, 
			marginBottom: 18,
			// borderRadius: 75, 
			objectFit: "scale-down",
		}
		const buttonStyle = { 
			borderRadius: 200, 
			height: 51, 
			width: isMobile ? 300 : 464, 
			fontSize: 16, 
			// background: "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)", 
			background: "linear-gradient(90deg, #F86744 0%, #F34475 100%)",
			padding: "16px 24px", 
			top: 105, 
			margin: "auto",
			itemAlign: "center",
			marginLeft: isMobile? null : "65px",
		}

		const defaultImage = "/images/experienced.png"
		const experienced_image = userdata !== undefined && userdata !== null && userdata.active_org !== undefined && userdata.active_org.image !== undefined && userdata.active_org.image !== null && userdata.active_org.image !== "" ? userdata.active_org.image : defaultImage
    return (
				<div style={{ margin: "auto", paddingBottom: 150, minHeight: 1500, paddingTop: 50, }}>
					{/*
					<div style={{position: "fixed", bottom: 110, right: 110, display: "flex", }}>
						<img src="/images/Arrow.png" style={{width: 250, height: "100%",}} />
					</div>
					*/}
					{showWelcome === true ? 
						<div>
							{/* <div style={{minWidth: 500, maxWidth: 500, margin: "auto", marginTop: isCloud ? "auto" : 20, }}>
								<Stepper 
									activeStep={activeStep} 
									color="primary"
									style={{
										backgroundColor: theme.palette.platformColor, 
										borderRadius: theme.palette?.borderRadius, 
										padding: 12, 
										border: "1px solid rgba(255,255,255,0.3)", 
										maxWidth: 500, 
										color: "white",
									}}
								>
										{steps.map((label, index) => {
												const stepProps = {}
												const labelProps = {}
												//if (isStepOptional(index)) {
												//    labelProps.optional = "optional"
												//}

												if (isStepSkipped(index)) {
														stepProps.completed = false;
												}

												return (
														<Step key={label} {...stepProps} style={{maxWidth: 160, color: "white", }}>
															<StepLabel {...labelProps} style={{marginLeft: 10, color: "white",}}>
																{label}
															</StepLabel>
														</Step>
												)
										})}
								</Stepper>
							</div> */}
        			<Grid container spacing={1} style={{ padding: isMobile ? 10 : 0, maxWidth: isMobile ? null : 500, minWidth: isMobile ? null : 500, marginRight : "auto" , marginLeft: "auto" }}>
          		  <Grid item xs={window.location.href.includes("tab=2") ? 6 : 12}>
									<div>
											{/*
											<WelcomeForm 
												userdata={userdata}
												globalUrl={globalUrl}
												discoveryWrapper={discoveryWrapper}
												setDiscoveryWrapper={setDiscoveryWrapper}
											/>
											*/}
											<WelcomeForm2
												isLoggedIn={isLoggedIn}
												checkLogin={checkLogin}
												userdata={userdata}
												globalUrl={globalUrl}
												discoveryWrapper={discoveryWrapper}
												setDiscoveryWrapper={setDiscoveryWrapper}
												appFramework={frameworkData}
												setAppFramework={setFrameworkData}
												getFramework={getFramework}
												steps={steps}
												skipped={skipped}
												setSkipped={setSkipped}
												activeStep={activeStep}
												setActiveStep={setActiveStep}
												getApps={getApps}
												apps={apps}
												handleSetSearch={handleSetSearch}
												usecaseButtons={usecaseButtons}
												defaultSearch={defaultSearch}
												setDefaultSearch={setDefaultSearch}
												selectionOpen={selectionOpen}
												setSelectionOpen={setSelectionOpen}
											/>
									</div>
          		  </Grid>
							</Grid>
						</div>
						: 
						<Fade in={true}>
							<div style={{maxWidth: isMobile ? null : 590, margin: "auto", marginTop: 50,textAlign : isMobile ? "center" : null }}>
								<Typography variant="h4" style={{color: "#F1F1F1", marginTop: 50, fontSize: 32}}>
									Help us get to know you
								</Typography>
								<Typography variant="body1" style={{color: "#9E9E9E", marginTop: 12 ,marginBottom: 50, fontSize: 16}}>
								Let us help you create a smoother journey.
								</Typography>
								{/* <Typography variant="body1" style={{color: "#9E9E9E", marginTop: 12 ,marginBottom: 50, fontSize: 16}}>
									We will use this information to personalize your automation
								</Typography> */}
								<div style={{display: isMobile ? null : "flex", marginTop: 70, width: isMobile ? 280 : 700, margin: "auto",}}>
									<div style={{border: "2px solid #806BFF", borderRadius: theme.palette?.borderRadius, }}>
										<Card style={paperObject} onClick={() => {
											if (isCloud) {
													ReactGA.event({
														category: "welcome",
														action: "click_welcome_continue",
														label: "",
													})
											} else {
												//setActiveStep(1)
											}

											navigate("/welcome?tab=2")
											setShowWelcome(true)
										}}>
											<CardActionArea style={actionObject}>
												<img src="/images/welcome-to-shuffle.png" style={imageStyle} />
												<Typography variant="h4" style={{color: "#F1F1F1"}}> 
													New to Shuffle 
												</Typography>
												<Typography variant="body1" style={{marginTop: 10, color: "rgba(255,255,255,0.8)"}}>
													Let us guide you for an easier experience
												</Typography>
											</CardActionArea>
										</Card>
									</div>
									<div style={{marginLeft: 25, marginRight: 25, 
			marginTop: isMobile ? 30 : null, }}>
										{/* <Typography style={{marginTop: 200, }}>
											OR
										</Typography> */}
									</div>
									<Card disabled style={paperObject} onClick={() => {
										if (isCloud) {
												ReactGA.event({
													category: "welcome",
													action: "click_getting_started",
													label: "",
												})
										}

										navigate("/workflows?message=Skipped intro")
									}}>
										<CardActionArea style={actionObject}>
											<img src={experienced_image} style={{padding: experienced_image === defaultImage ? 2 : 10, objectFit: "scale-down", minHeight: experienced_image === defaultImage ? 40 : 70, maxHeight: experienced_image === defaultImage ? 40 : 70, bordeRadius: theme.palette?.borderRadius*2, marginBottom: experienced_image === defaultImage ? 24 : 2 }} />
											<Typography variant="h4" style={{color: "#F1F1F1"}}> 
												Experienced 
											</Typography>										
											<Typography variant="body1" style={{marginTop: 10, color: "rgba(255,255,255,0.8)"}}>
												Head to Shuffle right away
											</Typography>
										</CardActionArea>
									</Card>
								</div>

								
								<div style={{ flexDirection: "row", textAlign: isMobile ? "center" : null, margin: isMobile ? "auto" : null }}>
									<Button variant="contained" type="submit" fullWidth style={buttonStyle} onClick={() => {
										navigate(`/welcome?tab=2`)
										setActiveStep(1)
										setShowWelcome(true)
										ReactGA.event({
											category: "welcome",
											action: "click_welcome_continue",
											label: "",
										})
									}}>
										Continue
									</Button>
								</div>
							</div>
						</Fade>
					}
			</div>
   ) 
}

export default Welcome; 
