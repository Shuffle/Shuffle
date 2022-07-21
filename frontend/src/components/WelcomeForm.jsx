import React, { useState, useEffect } from "react";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Button from "@material-ui/core/Button";
import Checkbox from '@mui/material/Checkbox';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import theme from '../theme';
import {
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
} from "@material-ui/core";
import { useNavigate, Link } from "react-router-dom";
import WorkflowSearch from '../components/Workflowsearch.jsx';
import WorkflowPaper from "../components/WorkflowPaper.jsx"

const WelcomeForm = (props) => {
		const { userdata, globalUrl, discoveryWrapper, setDiscoveryWrapper } = props

    const [activeStep, setActiveStep] = React.useState(0);
    const [skipped, setSkipped] = React.useState(new Set());
    const [discoveryData, setDiscoveryData] = React.useState({})
    const [name, setName] = React.useState("")
    const [orgName, setOrgName] = React.useState("")
    const [role, setRole] = React.useState("")
    const [orgType, setOrgType] = React.useState("")
    const [finishedApps, setFinishedApps] = React.useState([])
  
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
					setActiveStep(foundTab-1)
				} else { 
    			navigate(`/welcome?tab=1`)
				}
			}

		}, [])

    const steps = getSteps();

    const isStepOptional = step => {
        return step === 1
    }

    const isStepSkipped = step => {
        return skipped.has(step)
    }

		const sendUserUpdate = (name, role, userId) => {
			const data = {
				"tutorial": "welcome",
				"firstname": name,
				"role": role,
				"user_id": userId,
			}

			const url = `${globalUrl}/api/v1/updateuser`
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

		const sendOrgUpdate = (orgname, company_type, orgId) => {
			var data = {
				org_id: orgId,
			};

			if (orgname.length > 0) {
				data.name = orgname
			}

			if (company_type.length > 0) {
				data.company_type = company_type 
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

    const handleNext = () => {
				setDefaultSearch("")

				if (activeStep === 0) {
					console.log("Should send basic information about org (fetch)")
					navigate(`/welcome?tab=2`)
		
					if (userdata.active_org !== undefined && userdata.active_org.id !== undefined && userdata.active_org.id !== null && userdata.active_org.id.length > 0) {
						sendOrgUpdate(orgName, orgType, userdata.active_org.id) 
					}

					if (userdata.id !== undefined && userdata.id !== null && userdata.id.length > 0) {
						sendUserUpdate(name, role, userdata.id) 
					}

				} else if (activeStep === 1) {
					console.log("Should send secondary info about apps and other things")
					setDiscoveryWrapper({})
    	
					navigate(`/welcome?tab=3`)
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
    };
    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };
    const handleSkip = () => {
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
    const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
    const [selectionOpen, setSelectionOpen] = React.useState(false)
    const [newSelectedApp, setNewSelectedApp] = React.useState({})
    const [defaultSearch, setDefaultSearch] = React.useState("")

    useEffect(() => {
        console.log("Selected app changed (effect)")
    }, [newSelectedApp])

    function getSteps() {
        return [
					"Help us get to know you", 
					"Discover integrations", 
					"Personalize Usecases",
				]
    }
		
		//const buttonWidth = 145 
		const buttonWidth = 450 
		const buttonMargin = 10
		const sizing = 435
		const buttonStyle = {
			flex: 1,
			width: "100%", 
			padding: 25,
			margin: buttonMargin,
			fontSize: 18,
		}

		const newButtonStyle = {
			padding: 25, 
			flex: 1, 
			margin: buttonMargin,
			minWidth: buttonWidth, 
			maxWidth: buttonWidth, 
		}

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={1} style={{width: "100%", marginTop: 20, minHeight: sizing, maxHeight: sizing, }}>
											<Typography variant="body1" style={{marginLeft: 8, marginTop: 10, marginRight: 30, }} color="textSecondary">
												We need some more information in order to understand how we best can help you find relevant Usecases in Shuffle. Giving us this info is optional, but encouraged.
											</Typography> 
                        <Grid item xs={11} style={{marginTop: 16, padding: 0,}}>
                          <TextField
															required
															style={{width: "100%", marginTop: 0,}}
															placeholder="Name"
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
                )
            case 1:
                return (
                    <div style={{minHeight: sizing, maxHeight: sizing, marginTop: 20,}}>
												<Typography variant="body1" style={{marginLeft: 8, marginTop: 25, marginRight: 30, marginBottom: 0, }} color="textSecondary">
													Find the most relevant apps, then we'll help you find the most relevant workflows
												</Typography>
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
															<Button disabled={finishedApps.includes("SIEM")} variant={defaultSearch === "SIEM" ? "contained" : "outlined"} style={buttonStyle} startIcon={<SearchIcon />} onClick={(event) => { onNodeSelect("SIEM") }} >
																	SIEM
															</Button>
															<Button disabled={finishedApps.includes("EDR & AV")} variant={defaultSearch === "EDR & AV" ? "contained" : "outlined"}  style={buttonStyle} startIcon={<NewReleasesIcon />} onClick={(event) => { onNodeSelect("EDR & AV") }} >
																	Endpoint
															</Button>
                            </div>
                            <div style={{display: "flex"}}>
															<Button disabled={finishedApps.includes("INTEL")} variant={defaultSearch === "INTEL" ? "contained" : "outlined"}  style={buttonStyle} startIcon={<NewReleasesIcon />} onClick={(event) => { onNodeSelect("INTEL") }} >
																	Intel
															</Button>
															<Button disabled={finishedApps.includes("COMMS")} variant={defaultSearch === "COMMS" ? "contained" : "outlined"} style={buttonStyle} startIcon={<EmailIcon />} onClick={(event) => { onNodeSelect("COMMS") }} >
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
                )
            case 2:
                return (
                    <div style={{display: "flex", marginTop: 25, width: 1366, minHeight: sizing, maxHeight: sizing, }}>
                        <Grid item xs={10} style={{width: "100%", flex: 6, }}>
                            <Typography variant="body1" style={{}} color="textSecondary">
															What processes are you interested in? This will help us suggest relevant Workflows.
														</Typography>

                            <Grid item xs={5} style={{marginTop: 15, display: "flex", flexDirection: "column", width: "100%",}}>
															<Button variant={defaultSearch === "Phishing" ? "contained" : "outlined"} startIcon={<EmailIcon />} style={newButtonStyle} onClick={() => {
																console.log("Plus the email comms tool")
																setDefaultSearch("Phishing")
																setSelectionOpen(false)

																setTimeout(function(){
																	setSelectionOpen(true)
																}, 150)
															}}>
																	Phishing
															</Button>
															<Button variant={defaultSearch === "Enrichment" ? "contained" : "outlined"} startIcon={<SearchIcon />} style={newButtonStyle}  onClick={() => {
																	console.log("Plus the Intel tool")

																	setDefaultSearch("Enrichment")

																	setSelectionOpen(false)

																	setTimeout(function(){
																		setSelectionOpen(true)
																	}, 150)
																}}>
																	Enrichment
															</Button>
															<Button variant={defaultSearch === "Detection" ? "contained" : "outlined"} startIcon={<NewReleasesIcon />} style={newButtonStyle}  onClick={() => {
																console.log("Plus the siem tool")

																setDefaultSearch("Detection")
																setSelectionOpen(false)

																setTimeout(function(){
																	setSelectionOpen(true)
																}, 150);
															}}>
																	Detection
															</Button>
															{/*
															<Button variant="outlined" startIcon={<NewReleasesIcon />} style={{padding: 10, flex: 1, minWidth: buttonWidth, maxWidth: buttonWidth,  }} onClick={() => {
																console.log("Plus the edr tool")

																setDefaultSearch("Response")
																setSelectionOpen(true)
															}}>
																	Response
															</Button>
															*/}
                            </Grid>
                        </Grid>
												{/*
                        <Grid item xs={10} paddingBottom="20px">
                            <TextField
                              required
															fullWidth={true}
															placeholder="Workflows as suggested from tools"
															label="Workflows as suggested from tools"
															type="astoolsworkflow"
															id="standard-required"
															autoComplete="astoolsworkflow"
															margin="normal"
															variant="outlined" 
														/>
                        </Grid>
												*/}
												<div style={{marginTop: 15, flex: 5, }}>
													{selectionOpen === true ?
														<WorkflowSearch
															ConfiguredHits={NewHits}
															showSearch={false}
															defaultSearch={defaultSearch}
															newSelectedApp={newSelectedApp}
															setNewSelectedApp={setNewSelectedApp}
														/>
													: null}
												</div>
										</div>
                )
            default:
                return "unknown step"
        }
    }

    return (
        <div style={{paddingTop: 20}}>
            <Stepper activeStep={activeStep} style={{backgroundColor: theme.palette.platformColor, borderRadius: theme.palette.borderRadius, padding: 12, border: "1px solid rgba(255,255,255,0.3)",}}>
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
                        <Step key={label} {...stepProps}>
                          <StepLabel {...labelProps} style={{marginLeft: 10}}>{label}</StepLabel>
                        </Step>
                    )
                })}
            </Stepper>
            {/*selectionOpen ?
							<WorkflowSearch
									defaultSearch={defaultSearch}
									newSelectedApp={newSelectedApp}
									setNewSelectedApp={setNewSelectedApp}
							/>
            : null*/}
						<div>
						{isCloud ? null :
							<Typography>
								This data will be used within the product and NOT be shared unless <a href="" target="_blank" rel="norefferer">cloud synchronization</a> is configured.
							</Typography>
						}
                {activeStep === steps.length ? (
                    <div paddingTop="20px">
                        You Will be Redirected to getting Start Page Wait for 5-sec.
                        <Button onClick={handleReset}>Reset</Button>
                        <script>
                            setTimeout(function() {
                            	navigate("/getting-started")
														}, 5000);
                        </script>
                        <Button>
													<Link style={{color: "#f86a3e", }} to="/getting-started" className="btn btn-primary">
														Getting Started
													</Link>
												</Button>
                    </div>
                ) : (
                    <div>
                        {getStepContent(activeStep)}
                        <div style={{paddingTop: 20}}>
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
															variant={activeStep === 1 ? finishedApps.length === 4 ? "contained" : "outlined" : "contained"}
															color="primary" 
															onClick={handleNext} 
															style={{marginLeft: 10, }} 
															disabled={activeStep === 0 ? orgName.length === 0 || name.length === 0 : false}
														>
                                {activeStep === steps.length - 1 ? "Finish" : "Next"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WelcomeForm 
