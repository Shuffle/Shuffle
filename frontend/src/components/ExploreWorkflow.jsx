import React, { useState, useEffect } from "react";
import ReactGA from 'react-ga4';

import 'react-alice-carousel/lib/alice-carousel.css';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import theme from '../theme.jsx';
import {isMobile} from "react-device-detect";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckBoxSharpIcon from '@mui/icons-material/CheckBoxSharp';
import { findSpecificApp } from "../components/AppFramework.jsx"
import {
	Checkbox,
    Button,
    Collapse,
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
    ButtonGroup,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
} from "@mui/material";

import { useNavigate, Link } from "react-router-dom";
import WorkflowTemplatePopup from "../components/WorkflowTemplatePopup.jsx";

const ExploreWorkflow = (props) => {
    const { userdata, globalUrl, appFramework, isLoggedIn, } = props
	const [activeUsecases, setActiveUsecases] = useState(0);
    const [modalOpen, setModalOpen] = React.useState(false);
	const [suggestedUsecases, setSuggestedUsecases] = useState([])
	const [usecasesSet, setUsecasesSet] = useState(false)
	const [apps, setApps] = useState([])
    const sizing = 475

	let navigate = useNavigate();

    const imagestyle = {
        height: 40,
        borderRadius: 40,
        //border: "2px solid rgba(255,255,255,0.3)",
    }

	const loadApps = () => {
		fetch(`${globalUrl}/api/v1/apps`, {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  credentials: "include",
		})
      	.then((response) => {
        	return response.json();
      	})
      	.then((responseJson) => {
			if (responseJson === null) {
			  console.log("null-response from server")
			  const pretend_apps = [{
				"name": "TBD",
				"app_name": "TBD",
				"app_version": "TBD",
				"description": "TBD",
				"version": "TBD",
				"large_image": "",
			  }]
				
			  setApps(pretend_apps)
			  return
			}

			if (responseJson.success === false) {
				console.log("error loading apps: ", responseJson)
			  	return
			}
        
			setApps(responseJson);
		})
		.catch((error) => {
        	console.log("App loading error: " + error.toString());
		})
	}

	// Find priorities in userdata.priorities and check if the item.type === "usecase"
	// If so, set the item.isActive to true
	if (usecasesSet === false && userdata.priorities !== undefined && userdata.priorities !== null && userdata.priorities.length > 0 && suggestedUsecases.length === 0) {

		var tmpUsecases = []
		for (let i = 0; i < userdata.priorities.length; i++) {
			if (userdata.priorities[i].type !== "usecase" || userdata.priorities[i].active === false) {
				continue
			}

			const descsplit = userdata.priorities[i].description.split("&")
			if (descsplit.length === 5) {
				console.log("descsplit: ", descsplit)
				if (descsplit[1] === "") {
					const item = findSpecificApp(appFramework, descsplit[0])
					console.log("item: ", item)
					if (item !== null) {
						descsplit[1] = item.large_image
					}
				}

				if (descsplit[3] === "") {
					const item = findSpecificApp(appFramework, descsplit[2])
					console.log("item: ", item)
					if (item !== null) {
						descsplit[3] = item.large_image
					}
				}

				console.log("descsplit: ", descsplit)
				userdata.priorities[i].description = descsplit.join("&")
			}

			tmpUsecases.push(userdata.priorities[i])
		}

		console.log("USECASES: ", tmpUsecases)
		if (tmpUsecases.length === 0) {
			console.log("Add some random ones, as everything is done")

			const comms = findSpecificApp(appFramework, "communication") 
			const cases = findSpecificApp(appFramework, "cases") 
			const edr = findSpecificApp(appFramework, "edr") 
			const siem = findSpecificApp(appFramework, "siem") 

			tmpUsecases = [{
				"name": "Suggested Usecase: Email management",
				"description": comms.name+"&"+comms.large_image+"&"+cases.name+"&"+cases.large_image,
				"type": "usecase",
				"url": "/usecases?selected_object=Email management",
				"severity": 0,
				"active": false,
			},{
				"name": "Suggested Usecase: EDR to ticket",
				"description": edr.name+"&"+edr.large_image+"&"+cases.name+"&"+cases.large_image,
				"type": "usecase",
				"url": "/usecases?selected_object=EDR to ticket",
				"severity": 0,
				"active": false,
			},{
				"name": "Suggested Usecase: SIEM to ticket",
				"description": siem.name+"&"+siem.large_image+"&"+cases.name+"&"+cases.large_image,
				"type": "usecase",
				"url": "/usecases?selected_object=SIEM to ticket",
				"severity": 0,
				"active": false,
			}
			]
		}

		setSuggestedUsecases(tmpUsecases)
		setUsecasesSet(true)
		loadApps() 
	}

    const modalView = (
        // console.log("key:", dataValue.key),
        //console.log("value:",dataValue.value),
        <Dialog
            open={modalOpen}
            onClose={() => {
                setModalOpen(false);
            }}
            PaperProps={{
                style: {
                    backgroundColor: theme.palette.surfaceColor,
                    color: "white",
                    minWidth: "800px",
                    minHeight: "320px",
                },
            }}
        >
            <DialogTitle style={{}}>
                <div style={{ color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckBoxSharpIcon sx={{ borderRadius: 4, color: "rgba(255, 132, 68, 1)" }} style={{ width: 24 }} />
                    <span style={{ marginLeft: 8, color: "rgba(255, 132, 68, 1)", fontSize: 16, width: 60 }}>Sign Up</span>
                    <div style={{ borderTop: "1px solid rgba(255, 132, 68, 1)", width: 85, marginLeft: 8, marginRight: 8 }} />
                    <CheckBoxSharpIcon sx={{ borderRadius: 4, color: "rgba(255, 132, 68, 1)" }} style={{ width: 24 }} />
                    <span style={{ marginLeft: 8, color: "rgba(255, 132, 68, 1)", fontSize: 16, width: 60 }}>Setup</span>
                    <div style={{ borderTop: "1px solid rgba(255, 132, 68, 1)", width: 85, marginRight: 8 }} />
                    <CheckBoxSharpIcon sx={{ borderRadius: 4, color: "rgba(255, 132, 68, 1)" }} style={{ width: 24 }} />
                    <span style={{ marginLeft: 8, color: "rgba(255, 132, 68, 1)", fontSize: 16, width: 60 }}>Explore</span>
                </div>
            </DialogTitle>
            <Typography style={{ fontSize: 16, width: 252, marginLeft: 167 }}>
                Here’s a recommended workflow:
            </Typography>
            {/* <div style={{ marginTop: 0, maxWidth: 700, minWidth: 700, margin: "auto", minHeight: sizing, maxHeight: sizing, }}>
                <div style={{ marginTop: 0, }}>
                    <div className="thumbs" style={{ display: "flex" }}>
                        <Tooltip title={"Previous usecase"}>
                            <IconButton
                                style={{
                                    // backgroundColor: thumbIndex === 0 ? "inherit" : "white",
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
                        <div style={{ minWidth: 554, maxWidth: 554, borderRadius: theme.palette?.borderRadius, }}>
                            <AliceCarousel
                                style={{ backgroundColor: theme.palette.surfaceColor, minHeight: 750, maxHeight: 750, }}
                                items={formattedCarousel}
                                activeIndex={thumbIndex}
                                infiniteLoop
                                mouseTracking={false}
                                responsive={responsive}
                                // activeIndex={activeIndex}
                                controlsStrategy="responsive"
                                autoPlay={false}
                                infinite={true}
                                animationType="fadeout"
                                animationDuration={800}
                                disableButtonsControls

                            />
                        </div>
                        <Tooltip title={"Next usecase"}>
                            <IconButton
                                style={{
                                    backgroundColor: thumbIndex === usecaseButtons.length - 1 ? "inherit" : "white",
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
            </div> */}
            <DialogActions style={{ paddingLeft: "30px", paddingRight: '30px' }}>
                <Button
                    style={{ borderRadius: "0px" }}
                    onClick={() => setModalOpen(false)}
                    color="primary"
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "0px" }}
                    onClick={() => {
                        console.log("hello")
                    }}
                    color="primary"
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );


    return (
        <div style={{ marginTop: 0, margin: "auto", minHeight: sizing, maxHeight: sizing, }}>
            <Tooltip
                title="Back"
                placement="top"
                style={{ zIndex: 10011 }}
            >
                <IconButton
                    style={{
                        marginRight: isMobile ? 230 : null
                    }}
                    onClick={() => {
                        navigate('/welcome?tab=2');
                        window.location.reload();
                    }}
                >
                    <ArrowBackIcon style={{ width: 20 }} />
                    <Typography style={{fontSize : 16, marginLeft : 2}}>Back</Typography>
                </IconButton>
            </Tooltip>
            {modalView}
            <Typography variant="h4" style={{ marginLeft: 8, marginTop: isMobile ? null : 40, marginRight: 30, marginBottom: 0, }} color="rgba(241, 241, 241, 1)">
                Start using workflows
            </Typography>
            <Typography variant="body2" style={{ marginLeft: isMobile ? null : 8, marginTop: isMobile ? 5 : 10, marginRight: isMobile ? null : 100, marginBottom: isMobile ? 20 : 40, }} color="rgba(158, 158, 158, 1)">
                Based on what you selected workflows, here are our recommendations! You will see more of these later.
            </Typography>

            <div style={{ marginTop: 0, }}>
                <div className="thumbs" style={{ display: "flex" }}>
                    <div style={{ minWidth: isMobile ? 300 : 554, maxWidth: isMobile ? 300 : 554, borderRadius: theme.palette?.borderRadius, }}>
                        <Grid item xs={11} style={{}}>
							{suggestedUsecases.length === 0 && usecasesSet ? 
								<Typography variant="h6" style={{ marginTop: 30, marginBottom: 50, }} color="rgba(158, 158, 158, 1)">
									All Workflows are already added for your current apps! 
								</Typography>
							:
							suggestedUsecases.map((priority, index) => {
								
								const srcapp = priority.description.split("&")[0]
								var image1 = priority.description.split("&")[1]
								var image2 = ""
								var dstapp = ""
								if (priority.description.split("&").length > 3) {
									dstapp = priority.description.split("&")[2]
									image2 = priority.description.split("&")[3]
								}

								const name = priority.name.replace("Suggested Usecase: ", "")

								var description = ""
								if (priority.description.split("&").length > 4) {
									description = priority.description[4]
								}

								// FIXME: Should have a proper description 
								description = ""

								return (
									<WorkflowTemplatePopup
										isLoggedIn={isLoggedIn}
										userdata={userdata}
										appFramework={appFramework}

										globalUrl={globalUrl}
										img1={image1}
										srcapp={srcapp}
										img2={image2}
										dstapp={dstapp}
										title={name}
										description={description}

										apps={apps}
									/>
								)
							})}
                        </Grid>
                        <div>
							<div style={{ marginTop: 32 }}>
								<Typography variant="body2" style={{ fontSize: 16, marginTop: 24 }} color="rgba(158, 158, 158, 1)">
									<Button variant="contained" type="submit"
										fullWidth style={{
											borderRadius: 200,
											height: 51,
											width: isMobile? null : 464,
											fontSize: 16,
											padding: "16px 24px",
											margin: "auto",
											itemAlign: "center",
											background: activeUsecases === 0 ? "rgba(47, 47, 47, 1)" : "linear-gradient(90deg, #F86744 0%, #F34475 100%)",
											color: activeUsecases === 0? "rgba(158, 158, 158, 1)" : "rgba(241, 241, 241, 1)",
											border: activeUsecases === 0 ? "1px solid rgba(158, 158, 158, 1)" : "none",
										}}
										onClick={() => {
											navigate("/workflows?message="+activeUsecases+" workflows added")
										}}>
										Continue to workflows	
									</Button>
								</Typography>
							</div>
                            <Typography variant="body2" style={{ fontSize: 16, marginTop: 24 }} color="rgba(158, 158, 158, 1)">
                                <Link style={{ color: "#f86a3e", marginLeft: isMobile ? null : 145 }} to="/usecases" className="btn btn-primary">
									Explore usecases 
                                </Link>
                            </Typography>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ExploreWorkflow
