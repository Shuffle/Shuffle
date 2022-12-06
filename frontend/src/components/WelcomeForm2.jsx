import React, { useState, useEffect } from "react";
import ReactGA from 'react-ga';
import Button from "@material-ui/core/Button";
import Checkbox from '@mui/material/Checkbox';

import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';

import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import ExtensionIcon from '@mui/icons-material/Extension';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import theme from '../theme';
import {
  	Fade,
		IconButton,
    FormGroup,
    FormControl,
    InputLabel,
    FormLabel,
    FormControlLabel,
    Select,
    MenuItem,
    Grid,
		Paper, 
		Typography, 
		TextField,
		Zoom,
		List,
		ListItem,
		ListItemText,
		Divider,
		Tooltip,
		Chip,
} from "@material-ui/core";
import { useAlert } from "react-alert";

import { useNavigate, Link } from "react-router-dom";
import WorkflowSearch from '../components/Workflowsearch.jsx';
import AuthenticationItem from '../components/AuthenticationItem.jsx';
import WorkflowPaper from "../components/WorkflowPaper.jsx"
import UsecaseSearch from "../components/UsecaseSearch.jsx"


const responsive = {
    0: { items: 1 },
};

const WelcomeForm = (props) => {
		const { userdata, globalUrl, discoveryWrapper, setDiscoveryWrapper, appFramework, getFramework, activeStep, setActiveStep, steps, skipped, setSkipped, getApps, apps, handleSetSearch, usecaseButtons, defaultSearch, setDefaultSearch, selectionOpen, setSelectionOpen, } = props

		const usecaseItems = [
			<div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
				<UsecaseSearch
					globalUrl={globalUrl}
					defaultSearch={"Phishing"}
					appFramework={appFramework}
					apps={apps}
					getFramework={getFramework}
					userdata={userdata}
				/>
			</div>
			,
			<div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
				<UsecaseSearch
					globalUrl={globalUrl}
					defaultSearch={"Enrichment"}
					appFramework={appFramework}
					apps={apps}
					getFramework={getFramework}
					userdata={userdata}
				/>
			</div>
			,
			<div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
				<UsecaseSearch
					globalUrl={globalUrl}
					defaultSearch={"Enrichment"}
					usecaseSearch={"SIEM alert enrichment"}
					appFramework={appFramework}
					apps={apps}
					getFramework={getFramework}
					userdata={userdata}
				/>
			</div>
			,
			<div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
				<UsecaseSearch
					globalUrl={globalUrl}
					defaultSearch={"Build your own"}
					appFramework={appFramework}
					apps={apps}
					getFramework={getFramework}
					userdata={userdata}
				/>
			</div>
		]

    const [discoveryData, setDiscoveryData] = React.useState({})
    const [name, setName] = React.useState("")
    const [orgName, setOrgName] = React.useState("")
    const [role, setRole] = React.useState("")
    const [orgType, setOrgType] = React.useState("")
    const [finishedApps, setFinishedApps] = React.useState([])
  	const [authentication, setAuthentication] = React.useState([]);
		const [newSelectedApp, setNewSelectedApp] = React.useState({})
		const [thumbIndex, setThumbIndex] = useState(0);
    const [thumbAnimation, setThumbAnimation] = useState(false);
    const [clickdiff, setclickdiff] = useState(0);

		const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
  
  	const alert = useAlert();
		let navigate = useNavigate();

    const onNodeSelect = (label) => {
			if (setDiscoveryWrapper !== undefined) {
				setDiscoveryWrapper(
					{"id": label}
				)
			}

			setSelectionOpen(true)
			setDefaultSearch(label)
    }

    useEffect(() => {
			if (userdata.id === undefined) {
				return
			}

			if (userdata.name !== undefined && userdata.name !== null && userdata.name.length > 0) {
				setName(userdata.name)
			}

			if (userdata.active_org !== undefined && userdata.active_org.name !== undefined && userdata.active_org.name !== null && userdata.active_org.name.length > 0) {
				setOrgName(userdata.active_org.name)
			}
		}, [userdata])

		useEffect(() => {
			if (discoveryWrapper === undefined || discoveryWrapper.id === undefined) {
				setDefaultSearch("")
				var newfinishedApps = finishedApps
				newfinishedApps.push(defaultSearch)
				setFinishedApps(finishedApps)
			}
		}, [discoveryWrapper])

		useEffect(() => {
			if (
				window.location.search !== undefined &&
				window.location.search !== null
			) {
				const urlSearchParams = new URLSearchParams(window.location.search);
				const params = Object.fromEntries(urlSearchParams.entries());
				const foundTab = params["tab"];
				if (foundTab !== null && foundTab !== undefined && !isNaN(foundTab)) {
					if (foundTab === 3 || foundTab === "3") {
						console.log("SET SEARCH!!")
					}
				} else { 
    			//navigate(`/welcome?tab=1`)
				}
			}
		}, [])

    const isStepOptional = step => {
        return step === 1
    }

		const sendUserUpdate = (name, role, userId) => {
			const data = {
				"tutorial": "welcome",
				"firstname": name,
				"company_role": role,
				"user_id": userId,
			}

			const url = `${globalUrl}/api/v1/users/updateuser`
			fetch(url, {
				mode: "cors",
				method: "PUT",
				body: JSON.stringify(data),
				credentials: "include",
				crossDomain: true,
				withCredentials: true,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
			})
			.then((response) =>
				response.json().then((responseJson) => {
					if (responseJson["success"] === false) {
						console.log("Update user success")
						//alert.error("Failed updating org: ", responseJson.reason);
					} else {
						console.log("Update success!")
						//alert.success("Successfully edited org!");
					}
				})
			)
			.catch((error) => {
				console.log("Update err: ", error.toString())
				//alert.error("Err: " + error.toString());
			});
		}

		const sendOrgUpdate = (orgname, company_type, orgId, priority) => {
			var data = {
				org_id: orgId,
			};

			if (orgname.length > 0) {
				data.name = orgname
			}

			if (company_type.length > 0) {
				data.company_type = company_type 
			}

			if (priority.length > 0) {
				data.priority = priority
			}

			const url = globalUrl + `/api/v1/orgs/${orgId}`;
			fetch(url, {
				mode: "cors",
				method: "POST",
				body: JSON.stringify(data),
				credentials: "include",
				crossDomain: true,
				withCredentials: true,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
			})
			.then((response) =>
				response.json().then((responseJson) => {
					if (responseJson["success"] === false) {
						console.log("Update of org failed")
						//alert.error("Failed updating org: ", responseJson.reason);
					} else {
						//alert.success("Successfully edited org!");
					}
				})
			)
			.catch((error) => {
				console.log("Update err: ", error.toString())
				//alert.error("Err: " + error.toString());
			});
		}

		var workflowDelay = -50
		const NewHits = ({ hits }) => {
			const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
			var counted = 0

			const paperAppContainer = {
					display: "flex",
					flexWrap: "wrap",
					alignContent: "space-between",
					marginTop: 5,
  		}

			return (
				<Grid container spacing={4} style={paperAppContainer}>
					{hits.map((data, index) => {
						workflowDelay += 50

						if (index > 3) {
							return null
						}

						return (
							<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>
								<Grid item xs={6} style={{ padding: "12px 10px 12px 10px" }}>
									<WorkflowPaper key={index} data={data} />
								</Grid>
							</Zoom>
						)
					})}
				</Grid>
			)
		}

    const isStepSkipped = step => {
        return skipped.has(step)
    }

    const handleNext = () => {
				setDefaultSearch("")

				if (activeStep === 0) {
					console.log("Should send basic information about org (fetch)")
					setclickdiff(240)
					navigate(`/welcome?tab=2`)
											
					if (isCloud) {
						ReactGA.event({
								category: "welcome",
								action: "click_page_one_next",
								label: "",
						})
					}
		
					if (userdata.active_org !== undefined && userdata.active_org.id !== undefined && userdata.active_org.id !== null && userdata.active_org.id.length > 0) {
						sendOrgUpdate(orgName, orgType, userdata.active_org.id, "") 
					}

					if (userdata.id !== undefined && userdata.id !== null && userdata.id.length > 0) {
						sendUserUpdate(name, role, userdata.id) 
					}

				} else if (activeStep === 1) {
					console.log("Should send secondary info about apps and other things")
					setDiscoveryWrapper({})
    	
					navigate(`/welcome?tab=3`)
					//handleSetSearch("Enrichment", "2. Enrich")
					handleSetSearch(usecaseButtons[0].name, usecaseButtons[0].usecase)
					getApps()

					// Make sure it's up to date
					if (getFramework !== undefined) {
						getFramework()
					}
				} else if (activeStep === 2) {
					console.log("Should send third page with workflows activated and the like")
				}


        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped.values());
            newSkipped.delete(activeStep);
        }

        setActiveStep(prevActiveStep => prevActiveStep + 1);
        setSkipped(newSkipped);
    }

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);

				if (activeStep === 2) {
					setDiscoveryWrapper({})

					if (getFramework !== undefined) {
						getFramework()
					}
					navigate("/welcome?tab=2")
				} else if (activeStep === 1) {
					navigate("/welcome?tab=1")
				}
    };

    const handleSkip = () => {
    		setclickdiff(240)
        if (!isStepOptional(activeStep)) {
            throw new Error("You can't skip a step that isn't optional.");
        }
        setActiveStep(prevActiveStep => prevActiveStep + 1);
        setSkipped(prevSkipped => {
            const newSkipped = new Set(prevSkipped.values());
            newSkipped.add(activeStep);
            return newSkipped;
        });
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    useEffect(() => {
        console.log("Selected app changed (effect)")
    }, [newSelectedApp])

		console.log("Clickdiff: ", clickdiff)
	
		//const buttonWidth = 145 
		const buttonWidth = 450 
		const buttonMargin = 10
		const sizing = 475
		const buttonStyle = {
			flex: 1,
			width: "100%", 
			padding: 25,
			margin: buttonMargin,
			fontSize: 18,
		}

		const slideNext = () => {
			if (!thumbAnimation && thumbIndex < usecaseItems.length - 1) {
				//handleSetSearch(usecaseButtons[0].name, usecaseButtons[0].usecase)
				setThumbIndex(thumbIndex + 1);
			} else if (!thumbAnimation && thumbIndex === usecaseItems.length - 1) {
				setThumbIndex(0)
			}
    };

    const slidePrev = () => {
			if (!thumbAnimation && thumbIndex > 0) {
				setThumbIndex(thumbIndex - 1);
			} else if (!thumbAnimation && thumbIndex === 0) {
				setThumbIndex(usecaseItems.length-1)
			}
    };

		const newButtonStyle = {
			padding: 22, 
			flex: 1, 
			margin: buttonMargin,
			minWidth: buttonWidth, 
			maxWidth: buttonWidth, 
		}
		
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
									<Fade in={true}>
                    <Grid container spacing={1} style={{margin: "auto", maxWidth: 500, minWidth: 500, minHeight: sizing, maxHeight: sizing, }}>
											{/*isCloud ? null :
												<Typography variant="body1" style={{marginLeft: 8, marginTop: 10, marginRight: 30, }} color="textSecondary">
														This data will be used within the product and NOT be shared unless <a href="https://shuffler.io/docs/organizations#cloud_synchronization" target="_blank" rel="norefferer" style={{color: "#f86a3e", textDecoration: "none"}}>cloud synchronization</a> is configured.
													</Typography>
											*/}
											<Typography variant="body1" style={{marginLeft: 8, marginTop: 10, marginRight: 30, }} color="textSecondary">
												In order to understand how we best can help you find relevant Usecases, please provide the information below. This is optional, but highly encouraged.
											</Typography> 
                        <Grid item xs={11} style={{marginTop: 16, padding: 0,}}>
                          <TextField
															required
															style={{width: "100%", marginTop: 0,}}
															placeholder="Name"
															autoFocus
															label="Name"
															type="name"
															id="standard-required"
															autoComplete="name"
															margin="normal"
															variant="outlined"
															value={name}
															onChange={(e) => {
																setName(e.target.value)
															}}
													/>
												</Grid>
                        <Grid item xs={11} style={{marginTop: 10, padding: 0,}}>
                          <TextField
															required
															style={{width: "100%", marginTop: 0,}}
															placeholder="Company / Institution"
															label="Company Name"
															type="companyname"
															id="standard-required"
															autoComplete="CompanyName"
															margin="normal"
															variant="outlined"
															value={orgName}
															onChange={(e) => {
																setOrgName(e.target.value)
															}}
													/>
												</Grid>
                        <Grid item xs={11} style={{marginTop: 10}}>
                            <FormControl fullWidth={true}>
                                <InputLabel style={{marginLeft: 10, color: "#B9B9BA" }}>Your Role</InputLabel>
                                <Select
																	variant="outlined"
                                  required
																	onChange={(e) => {
																		setRole(e.target.value)
																	}}
                                >
                                    <MenuItem value={"Student"}>Student</MenuItem>
                                    <MenuItem value={"Security Analyst/Engineer"}>Security Analyst/Engineer</MenuItem>
                                    <MenuItem value={"SOC Manager"}>SOC Manager</MenuItem>
                                    <MenuItem value={"C-Level"}>C-Level</MenuItem>
                                    <MenuItem value={"Other"}>Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={11} style={{marginTop: 16}}>
                            <FormControl fullWidth={true}>
                                <InputLabel style={{ marginLeft: 10, color: "#B9B9BA" }}>Company Type</InputLabel>
                                <Select
                                    required
																		variant="outlined"
																		onChange={(e) => {
																			setOrgType(e.target.value)
																		}}
                                >
                                    <MenuItem value={"Education"}>Education</MenuItem>
                                    <MenuItem value={"MSSP"}>MSSP</MenuItem>
                                    <MenuItem value={"Security Product Company"}>Security Product Company</MenuItem>
                                    <MenuItem value={"Other"}>Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
									</Fade>
                )
            case 1:
                return (
									<Fade in={true}>
                    <div style={{minHeight: sizing, maxHeight: sizing, marginTop: 20, maxWidth: 500, }}>
												<Typography variant="body1" style={{marginLeft: 8, marginTop: 25, marginRight: 30, marginBottom: 0, }} color="textSecondary">
													Clicks the buttons below to find your apps, then we will help you find relevant workflows. Can't find your app? <span style={{color: "#f86a3e", cursor: "pointer"}} onClick={() => {
														if (window.drift !== undefined) {
															window.drift.api.startInteraction({ interactionId: 340043 })
														} else {
															console.log("Couldn't find drift in window.drift and not .drift-open-chat with querySelector: ", window.drift)
														}
													}}>Contact our App Developers!</span>
												</Typography>
												{/*The app framework helps us access and authenticate the most important APIs for you. */}

												{/*
                        <Grid item xs={10}>
                            <FormControl fullWidth={true}>
                                <InputLabel style={{ color: "#B9B9BA" }}>What is your development experience?</InputLabel>
                                <Select
                                    required
                                >
                                    <MenuItem value={10}>Beginner</MenuItem>
                                    <MenuItem value={20}>Intermediate</MenuItem>
                                    <MenuItem value={30}>Automation Ninja</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
												*/}
                        <Grid item xs={11} style={{marginTop: 25, }}>
                            {/*<FormLabel style={{ color: "#B9B9BA" }}>Find your integrations!</FormLabel>*/}
                            <div style={{display: "flex"}}>
															<Button disabled={finishedApps.includes("CASES")} variant={defaultSearch === "CASES" ? "contained" : "outlined"}  style={buttonStyle} startIcon={<LightbulbIcon />} onClick={(event) => { onNodeSelect("CASES") }} >
																	Case Management	
															</Button>
                            </div>
                            <div style={{display: "flex"}}>
															<Button disabled={finishedApps.includes("SIEM")} variant={defaultSearch === "SIEM" ? "contained" : "outlined"} style={buttonStyle} startIcon={<SearchIcon />} onClick={(event) => { onNodeSelect("SIEM") }} >
																	SIEM
															</Button>
															<Button disabled={finishedApps.includes("EDR & AV") || finishedApps.includes("ERADICATION")} variant={defaultSearch === "Eradication" ? "contained" : "outlined"}  style={buttonStyle} startIcon={<NewReleasesIcon />} onClick={(event) => { onNodeSelect("ERADICATION") }} >
																	Endpoint
															</Button>
                            </div>
                            <div style={{display: "flex"}}>
															<Button disabled={finishedApps.includes("INTEL")} variant={defaultSearch === "INTEL" ? "contained" : "outlined"}  style={buttonStyle} startIcon={<ExtensionIcon />} onClick={(event) => { onNodeSelect("INTEL") }} >
															

																	Intel
															</Button>
															<Button disabled={finishedApps.includes("COMMS") || finishedApps.includes("EMAIL")} variant={defaultSearch === "EMAIL" ? "contained" : "outlined"} style={buttonStyle} startIcon={<EmailIcon />} onClick={(event) => { onNodeSelect("EMAIL") }} >
																	Email
															</Button>
                            </div>
                            {/* <FormControl>
                                <FormLabel style={{ color: "#B9B9BA" }}>What do you want to automate first ?</FormLabel>
                                <FormGroup>
                                    <FormControlLabel
                                        value="Email"
                                        control={<Checkbox style={{ color: "#F85A3E" }} onChange={(event) => { onNodeSelect("Email") }} />}
                                        label="Email"
                                        labelPlacement="Email"
                                    />
                                    <FormControlLabel
                                        value="SIEM"
                                        control={<Checkbox style={{ color: "#F85A3E" }} onChange={(event) => { onNodeSelect("SIEM") }} />}
                                        label="SIEM"
                                        labelPlacement="SIEM"
                                    />
                                    <FormControlLabel
                                        value="EDR"
                                        control={<Checkbox style={{ color: "#F85A3E" }} onChange={(event) => { onNodeSelect("EDR") }} />}
                                        label="EDR"
                                        labelPlacement="EDR"
                                    />
                                </FormGroup>
                            </FormControl> */}
                        </Grid>
												{/*
                        <Grid item xs={10} paddingBottom="20px">
                            <FormControl fullWidth={true}>
                                <InputLabel style={{ color: "#B9B9BA" }}>What tools do you use?</InputLabel>
                                <Select
                                    required
                                >
                                    <MenuItem value={10}>Email</MenuItem>
                                    <MenuItem value={20}>SIEM</MenuItem>
                                    <MenuItem value={30}>EDR</MenuItem>
                                    <MenuItem value={30}>Chat System</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
												*/}
											</div>
									</Fade>
                )
            case 2:
                return (
									<Fade in={true}>
                    <div style={{marginTop: 0, maxWidth: 700, minWidth: 700, margin: "auto", minHeight: sizing, maxHeight: sizing, }}>
												<Typography variant="body1" style={{marginTop: 15, marginBottom: 0, maxWidth: 500, margin: "auto", marginBottom: 15, }} color="textSecondary">
													These are some of our Workflow templates, used to start new Workflows. Use the right and left buttons to find <a href="/usecases" target="_blank" rel="norefferer" style={{color: "#f86a3e", textDecoration: "none", }}>new Usecases</a>, and click the orange button to build it.
												</Typography>
												{/*<Divider />*/}
												{/*
												<div style={{width: 475, margin: "auto",}}>
													{usecaseButtons.map((usecase, index) => {

														return (
															<Chip
																key={usecase.name}
																style={{
																	backgroundColor: defaultSearch === usecase.name ? usecase.color : theme.palette.surfaceColor,
																	marginRight: 10, 
																	paddingLeft: 5,
																	paddingRight: 5,
																	height: 28,
																	cursor: "pointer",
																	border: `1px solid ${usecase.color}`,
																	color: "white",
																	borderRadius: theme.palette.borderRadius, 
																}}
																label={`${index+1}. ${usecase.name}`}
																onClick={() => {
																	console.log("Clicked: ", usecase.name)
																	if (defaultSearch === usecase.name) {
																		//setSelectedUsecaseCategory("")
																	} else {
																		handleSetSearch(usecase.name, usecase.usecase)
																	}
																	//addFilter(usecase.name.slice(3,usecase.name.length))
																}}
																variant="outlined"
																color="primary"
															/>
														)
													})}
												</div>
												*/}
												<div style={{marginTop: 0, }}>
													{/*
														<UsecaseSearch
															globalUrl={globalUrl}
															defaultSearch={defaultSearch}
															appFramework={appFramework}
															apps={apps}
														/>
													*/}

		  										<div className="thumbs" style={{display: "flex"}}>
														<Tooltip title={"Previous usecase"}>
															<IconButton
																style={{
																	backgroundColor: thumbIndex === 0 ? "inherit" : "white",
																	zIndex: 5000,
																	minHeight: 50, 
																	maxHeight: 50, 
																	color: "grey",
																	marginTop: 150,
																	borderRadius: 50,
																	border: "1px solid rgba(255,255,255,0.3)",
																}}
																onClick={() => {
																	slidePrev() 
																}}
															>
																<ArrowBackIosNewIcon />
															</IconButton>
														</Tooltip>
														<div style={{minWidth: 554, maxWidth: 554, borderRadius: theme.palette.borderRadius, padding: 25, }}>
															<AliceCarousel
																	style={{ backgroundColor: theme.palette.surfaceColor, minHeight: 750, maxHeight: 750, }}
																	items={usecaseItems}
																	activeIndex={thumbIndex}
																	infiniteLoop
																	mouseTracking
																	responsive={responsive}
																	// activeIndex={activeIndex}
																	controlsStrategy="responsive"
																	autoPlay={false}
																	infinite={true}
																	animationType="fadeout"
          												animationDuration={800}
																	disableButtonsControls
																	disableDotsControls

															/>
														</div>
														<Tooltip title={"Next usecase"}>
															<IconButton
																style={{
																	backgroundColor: thumbIndex === usecaseButtons.length-1 ? "inherit" : "white",
																	zIndex: 5000,
																	minHeight: 50, 
																	maxHeight: 50, 
																	color: "grey",
																	marginTop: 150,
																	borderRadius: 50,
																	border: "1px solid rgba(255,255,255,0.3)",
																}}
																onClick={() => {
																	slideNext() 
																}}
															>
																<ArrowForwardIosIcon />
															</IconButton>
														</Tooltip>
       										</div>
												</div>
										</div>
									</Fade>
                )
            default:
                return "unknown step"
        }
    }

    return (
        <div style={{}}>
            {/*selectionOpen ?
							<WorkflowSearch
									defaultSearch={defaultSearch}
									newSelectedApp={newSelectedApp}
									setNewSelectedApp={setNewSelectedApp}
							/>
            : null*/}
						<div>
                {activeStep === steps.length ? (
                    <div paddingTop="20px">
                        You Will be Redirected to getting Start Page Wait for 5-sec.
                        <Button onClick={handleReset}>Reset</Button>
                        <script>
                            setTimeout(function() {
                            	navigate("/workflows")
														}, 5000);
                        </script>
                        <Button>
													<Link style={{color: "#f86a3e", }} to="/workflows" className="btn btn-primary">
														Getting Started
													</Link>
												</Button>
                    </div>
                ) : (
                    <div>
                        {getStepContent(activeStep)}
												<div style={{marginBottom: 20, }}/>
													{activeStep === 2 || activeStep === 1 ? 
														<div style={{margin: "auto", minWidth: 500, maxWidth: 500, position: "relative", }}>
															<Button 
																disabled={activeStep === 0} 
																onClick={handleBack}
																variant={"outlined"}
																style={{marginLeft: 10, height: 64, width: 100, position: "absolute", top: activeStep === 1 ? -600 : -577, left: activeStep === 1 ? 105 : -145+clickdiff, }} 
															>
																	Back
															</Button>
															<Button 
																variant={"outlined"}
																color="primary" 
																onClick={handleNext} 
																style={{marginLeft: 10, height: 64, width: 100, position: "absolute", top: activeStep === 1 ? -600: -577, left: activeStep === 1 ? 748 : 510+clickdiff, }} 
																disabled={activeStep === 0 ? orgName.length === 0 || name.length === 0 : false}
															>
																	{activeStep === steps.length - 1 ? "Finish" : "Next"}
															</Button>
														</div>
														: 
														<div style={{margin: "auto", minWidth: 500, maxWidth: 500, marginLeft: activeStep === 1 ? 250 : "auto", marginTop: activeStep === 0 ? 25 : 0, }}>
															<Button disabled={activeStep === 0} onClick={handleBack}>
																	Back
															</Button>
															{/*isStepOptional(activeStep) && (
																	<Button
																			variant="contained"
																			color="primary"
																			onClick={handleSkip}
																	>
																			Skip
																	</Button>
															)*/}
															<Button 
																variant={activeStep === 1 ? finishedApps.length >= 4 ? "contained" : "outlined" : "outlined"}
																color="primary" 
																onClick={handleNext} 
																style={{marginLeft: 10, }} 
																disabled={activeStep === 0 ? orgName.length === 0 || name.length === 0 : false}
															>
																	{activeStep === steps.length - 1 ? "Finish" : "Next"}
															</Button>
															{activeStep === 0 ? 
																<Button 
																	variant={"outlined"}
																	color="secondary" 
																	onClick={() => {
																		console.log("Skip!")
    		
																		setclickdiff(240)
																		if (isCloud) {
																				ReactGA.event({
																					category: "welcome",
																					action: "click_page_one_skip",
																					label: "",
																				})
																		}

																		setActiveStep(1)
																		navigate(`/welcome?tab=2`)
																	}} 
																	style={{marginLeft: 240, }} 
																	disabled={activeStep !== 0}
																>
																	Skip
																</Button>
															: null}
                    			</div>
												}
                  </div>
              )}
            </div>
        </div>
    );
}

export default WelcomeForm 
