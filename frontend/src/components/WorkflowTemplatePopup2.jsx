import React, { useState, useEffect } from "react";

import { toast } from "react-toastify" 
import theme from '../theme.jsx';
import { useNavigate, Link, useParams } from "react-router-dom";
import AppSearchButtons from "../components/AppSearchButtons.jsx";
import { isMobile } from "react-device-detect";
import RenderCytoscape from "../components/RenderCytoscape.jsx";
import {
	Button,
	Typography,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Drawer,
	CircularProgress,
	Fade,
	IconButton,
	Tooltip,
} from "@mui/material";

import {
	Check as CheckIcon,
	TrendingFlat as TrendingFlatIcon,
	Close as CloseIcon,
	East as EastIcon, 
	Interests as InterestsIcon,
} from '@mui/icons-material';

import {
	green,
	yellow,
	red,
	grey,
} from "../views/AngularWorkflow.jsx"

import WorkflowTemplatePopup2 from "./WorkflowTemplatePopup.jsx";
import ConfigureWorkflow from "../components/ConfigureWorkflow.jsx";
import WorkflowValidationTimeline from "../components/WorkflowValidationTimeline.jsx";
import FixWorkflowValidationErrors from "../components/FixWorkflowValidationErrors.jsx";

const WorkflowTemplatePopup = (props) => {
	const { 
		userdata, appFramework, globalUrl, img1, srcapp, img2, dstapp, title, description, visualOnly, apps, isLoggedIn, isHomePage, getAppFramework, showTryit, shownColor, workflowBuilt, usecaseDetails, 

		isModalOpenDefault,
		setIsClicked,
		inputWorkflowId,
	} = props;

	const [isActive, setIsActive] = useState(workflowBuilt === true);
	const [isHovered, setIsHovered] = useState(false);
	const [modalOpen, setModalOpen] = useState(isModalOpenDefault === true ? true : false)
	const [errorMessage, setErrorMessage] = useState("");
	const [workflowLoading, setWorkflowLoading] = useState(false)
	const [showLoginButton, setShowLoginButton] = useState(false);
  	const [appAuthentication, setAppAuthentication] = React.useState(undefined);
  	const [missingSource, setMissingSource] = React.useState(undefined)
  	const [missingDestination, setMissingDestination] = React.useState(undefined);
  	const [configurationFinished, setConfigurationFinished] = React.useState(false)
	const [appSetupDone, setAppSetupDone] = React.useState(false)

	const [requestSent, setRequestSent] = React.useState(false)
	const [showTryitOut, setShowTryitout] = React.useState(showTryit === true ? true : false)

	const [loadingWorkflow, setLoadingWorkflow] = React.useState(false)
	const [workflow, setWorkflow] = useState({});
	const [_, setUpdate] = useState(0)

	const fetchWorkflow = (id) => {
		if (id === undefined || id === null || id === "") {
			return
		}

		if (loadingWorkflow === true) {
			return
		}

		setLoadingWorkflow(true)
		const url = `${globalUrl}/api/v1/workflows/${id}`
		fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
		.then((response) => {
			setLoadingWorkflow(false)
			if (response.status !== 200) {
				console.log("Status not 200 for framework!");
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.success === false) {
				console.log("Error in workflow loading for ID ", id)
			} else {
				setWorkflow(responseJson)
			}
		})
		.catch((error) => {
			console.log("err in framework: ", error.toString());
			setLoadingWorkflow(false)
		})


	}

	if (inputWorkflowId !== undefined && inputWorkflowId !== null && inputWorkflowId !== "" && workflow.id !== inputWorkflowId) {
		fetchWorkflow(inputWorkflowId)
	}

	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
	let navigate = useNavigate();
	useEffect(() => {
		if (modalOpen !== true) {
			if (workflowLoading === true) {
				setWorkflowLoading(false)
			}

			//console.log("Modal is not open, so we are not doing anything.")
			return
		}

		if (workflowLoading !== true) {
			//console.log("Workflow loading is false, so we can try to get the workflow.")
			return
		}

		console.log("DEBUG: Skipped direct generation without Try it for now.")

		/*
		if (!srcapp.includes(":default") && !dstapp.includes(":default")) {
			if (appSetupDone === false && setAppSetupDone !== undefined) {
				setAppSetupDone(true)
			}

			getGeneratedWorkflow() 
		}

		if (missingSource !== undefined && missingDestination !== undefined) {
			if (appSetupDone === false && setAppSetupDone !== undefined) {
				setAppSetupDone(true)
			}
		}

		if (getAppFramework !== undefined) {
			setTimeout(() => {
				getAppFramework()
			}, 500)
		}
		*/
	}, [modalOpen, missingSource, missingDestination])

	useEffect(() => {
		//console.log("IN USEEFFECT FOR CONFIG: ", configurationFinished)
		if (configurationFinished === true && workflow.id !== undefined && workflow.id !== null && workflow.id !== "") {
			//toast.success("Generation Successful")

			/*
			setTimeout(() => {
				navigate("/workflows/" + workflow.id)
			}, 2000)
			*/
		}
	}, [configurationFinished, workflow])

	const imageSize = 32
	const defaultBorder = "1px solid rgba(255,255,255,0.6)"
	const imagestyleWrapper = {
        height: imageSize,
		width: imageSize,
        borderRadius: imageSize,
		border: isHomePage ? null : defaultBorder,
		overflow: "hidden",
		display: "flex",

		backgroundColor: theme.palette.inputColor,
    }

	const imagestyleWrapperDefault = {
        height: imageSize,
		width: imageSize,
        borderRadius: imageSize,
		border: isHomePage ? null : defaultBorder,
		overflow: "hidden",
		display: "flex",

		backgroundColor: theme.palette.inputColor,
	}

    const imagestyle = {
        height: imageSize,
		width: imageSize,
        borderRadius: imageSize,
		//border: isHomePage ? null : defaultBorder,
		overflow: "hidden",

		backgroundColor: theme.palette.inputColor,
    }

	const imagestyleDefault = {
		display: "block",
		marginLeft: 9,
		marginTop: 9,
		height: imageSize,
		width: "auto",

		backgroundColor: theme.palette.inputColor,
	}

	if (modalOpen === false && (title === undefined || title === null || title === "")) {
		if (setIsClicked !== undefined) {
			setIsClicked(false)
		}

		console.log("No title for workflow template popup!");
		return null
	}


	const loadAppAuth = () => {	
		// Check if it exists, and has keys
		//
		if (userdata === undefined || userdata === null || Object.keys(userdata).length === 0) {
			setErrorMessage("You need to be logged in to try the pre-built Workflow Templates.")
			setShowLoginButton(true)

			// Send the user to the login screen after 3 seconds
			setTimeout(() => {	
				// Make it cancel if the state modalOpen changes
				if (modalOpen === false) {
					return
				}
				
				navigate("/login?view=" + window.location.pathname + window.location.search)
			}, 4500)

			return
		}


		fetch(`${globalUrl}/api/v1/apps/authentication`, {
    	  method: "GET",
    	  headers: {
    	    "Content-Type": "application/json",
    	    Accept: "application/json",
    	  },
    	  credentials: "include",
    	})
    	  .then((response) => {
    	    if (response.status !== 200) {
    	      console.log("Status not 200 for setting app auth :O!");
    	    }

    	    return response.json();
    	  })
    	  .then((responseJson) => {
    	    if (!responseJson.success) {
    	      	toast("Failed to get app auth: " + responseJson.reason);
				return
    	    }

			  var newauth = [];
			  for (let authkey in responseJson.data) {
				if (responseJson.data[authkey].defined === false) {
				  continue;
				}

				newauth.push(responseJson.data[authkey]);
			  }

			  setAppAuthentication(newauth);
		  })
		  .catch((error) => {
			//toast(error.toString());
			console.log("New auth error: ", error.toString());
		  });
	}

  	// Can create and set workflows
  	const reloadWorkflow = (workflow_id) => {

  	  const new_url = `${globalUrl}/api/v1/workflows/${workflow_id}`
  	  return fetch(new_url, {
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
  	      //setSubmitLoading(false);

  	      return response.json();
  	    })
  	    .then((responseJson) => {
		  if (responseJson.success === false) {
		  	if (responseJson.reason !== undefined) {
		  		toast("Error setting workflow: ", responseJson.reason)
		  	} else {
		  		toast("Error setting workflow.")
		  	}

		  	return
		  } else if (responseJson.id !== undefined && responseJson.id !== null && responseJson.id !== "") {
			  setWorkflow(responseJson)
		  }

  	      return responseJson;
  	    })
  	    .catch((error) => {
  	      toast("Failed reloading configured workflow: ", error.toString());
  	    });
  	};

  	// Can create and set workflows
  	const saveWorkflow = (workflowdata) => {

  	  const new_url = `${globalUrl}/api/v1/workflows?set_auth=true`
  	  return fetch(new_url, {
  	    method: "POST",
  	    headers: {
  	      "Content-Type": "application/json",
  	      Accept: "application/json",
  	    },
  	    body: JSON.stringify(workflowdata),
  	    credentials: "include",
  	  })
  	    .then((response) => {
  	      if (response.status !== 200) {
  	        console.log("Status not 200 for workflows :O!");
  	        return;
  	      }
  	      //setSubmitLoading(false);

  	      return response.json();
  	    })
  	    .then((responseJson) => {
		  if (responseJson.success === false) {
		  	if (responseJson.reason !== undefined) {
		  		toast("Error setting workflow: ", responseJson.reason)
		  	} else {
		  		toast("Error setting workflow.")
		  	}

		  	return
		  }

		  // In case it got a new id, this is to make sure it loads with the correct config
		  if (responseJson.id !== undefined && responseJson.id !== null && responseJson.id !== "") {
			  reloadWorkflow(responseJson.id)
		  }

  	      return responseJson;
  	    })
  	    .catch((error) => {
  	      toast("Failed generating workflow: ", error.toString());
  	    });
  	};


	const getGeneratedWorkflow = () => {
		// POST
		// https://shuffler.io/api/v1/workflows/merge
		// destination: {app_id: "b9c2feaf99b6309dabaeaa8518c61d3d", app_name: "Servicenow_API", app_version: "",…}
		// id: ""
		// middle:[]
		// name: "Email analysis"
		// source:{app_id: "accdaaf2eeba6a6ed43b2efc0112032d", app_name
		if (requestSent === true) {
			return
		}

		console.log("SRCAPP: ", srcapp, "DSTAPP: ", dstapp)
		if (srcapp === undefined || srcapp === null) {
			srcapp = ""
		}

		if ((srcapp !== undefined && srcapp !== null && srcapp.includes(":default")) || (dstapp !== undefined && dstapp !== null && dstapp.includes(":default"))) {
			toast("You need to select both a source and destination app before generating this workflow.")

			if (srcapp !== undefined && srcapp !== null && srcapp.includes(":default")) {
				setMissingSource({
					"type": srcapp.split(":")[0],
				})
			}

			if (dstapp !== undefined && dstapp !== null && dstapp.includes(":default")) {
				setMissingDestination({
					"type": dstapp.split(":")[0],
				})
			}

			return
		}
		
		setWorkflowLoading(true)

		const newsrcapp = srcapp
		const newdstapp = dstapp

		const mergedata = {
			name: title,
			id: "",
			source: {
				app_name: newsrcapp,
			},
			middle: [],
			destination: {
				app_name: newdstapp,
			},
		}

		setRequestSent(true)
		const url = isCloud ? `${globalUrl}/api/v1/workflows/merge` : `https://shuffler.io/api/v1/workflows/merge`
		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify(mergedata),
		})
		.then((response) => {
			if (response.status !== 200) {
				//console.log("Status not 200 for framework!");
				setRequestSent(false)
			}

			setWorkflowLoading(false)
			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.id !== undefined && responseJson.id !== null && responseJson.id !== "" && responseJson.name !== undefined && responseJson.name !== null && responseJson.name !== "") {
				console.log("Success in workflow template (prebuilt): ", responseJson);
				setWorkflow(responseJson)

				// Sets it in the database properly
  				saveWorkflow(responseJson) 
				return
			}

			if (responseJson.success === false) {
				//console.log("Error in workflow template: ", responseJson.error);
				setRequestSent(false)

				const defaultMessage = "Error: Failed to generate workflow the workflow - the Shuffle team has been notified. Contact support@shuffler.io if you want manual help building this usecase until the AI system is handled."
				if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason !== "") {
					setErrorMessage(defaultMessage + "\n\n" + responseJson.reason)
				} else {
					setErrorMessage(defaultMessage)
				}

				setIsActive(true)
				//setTimeout(() => {
				//	setModalOpen(false)
				//}, 5000)
			} else {
				console.log("Success in workflow template: ", responseJson);
				setIsActive(true)
				if (responseJson.workflow_id === "") {
					console.log("Failed to build workflow for these tools. Closing in 3 seconds.")
					return
				}
	
				fetchWorkflow(responseJson.workflow_id)
			}
		})
		.catch((error) => {
			console.log("err in framework: ", error.toString());
			setRequestSent(false)
			setWorkflowLoading(false)
		})
	}

	if (modalOpen === true && !srcapp?.includes(":default") && !dstapp?.includes(":default")) {
		if (appSetupDone === false && setAppSetupDone !== undefined) {
			setAppSetupDone(true)
		}

		// No autoruns anymore without clicking "Try it"
		if (workflow.id === undefined && workflowLoading === false && errorMessage === "") {
			//getGeneratedWorkflow() 
		}
	}

	const isFinished = () => {
		// Look for configuration fields being done in the current modal
		// 1. Start by finding the modal
		const template = document.getElementById("workflow-template")
		if (template === null || template == undefined) {
			return true
		}

		// Find item in template with id app-config
		const appconfig = template.getElementsByClassName("app-config")
		if (appconfig === null || appconfig == undefined) {
			return true
		}

		return false
	}
	
	const ModalView = () => {
		if (modalOpen === false) {
			return null
		}

		const divHeight = 500 
		const divWidth = 500 

		return (
        	<Drawer
				anchor={"right"}
        	    open={modalOpen}
        	    onClose={() => {
        	        setModalOpen(false);

					if (setIsClicked !== undefined) {
						setIsClicked(false)
					}
        	    }}
        	    PaperProps={{
        	        style: {
						backgroundColor: "black",
        	            color: "white",
        	            minWidth: isHomePage ? null : isMobile ? 300 : 850,
        	            maxWidth: isHomePage ? null : isMobile ? 300 : 850,
						paddingTop: isMobile ? null : 75, 
						itemAlign: "center",
        	        },
        	    }}
        	>
				<IconButton
				  style={{
					zIndex: 5000,
					position: "absolute",
					top: 14,
					right: 14,
					color: "white",
				  }}
				  onClick={() => {
					setModalOpen(false);
				  }}
				>
				  <CloseIcon />
				</IconButton>
				<DialogContent style={{marginTop: 0, marginLeft: isHomePage ? null : isMobile ? null :  75, maxWidth: 470, }}>
					<Typography variant="h4" style={{ fontSize: isMobile ? 20 : null}}>
						<b>Configure Workflow</b>
					</Typography> 

					{title === undefined || title === null || title === "" ? null : 
						<span>
							<Typography variant="body2" color="textSecondary" style={{marginTop: 25, }}>
								Selected Workflow:
							</Typography> 
							<div style={{marginBottom: 0, }} id="workflow-template">
								<WorkflowTemplatePopup2 
									globalUrl={globalUrl}
									img1={img1}
									srcapp={srcapp}
									img2={img2}
									dstapp={dstapp}
									title={title}
									description={description}
									visualOnly={true} 

									workflowBuilt={workflowBuilt}
									shownColor={shownColor}
								/>

							</div>
						</span>
					}

					<div style={{marginTop: 15, }}>
						{/* Fix the timeline when errors are fixed.. how? */}
						<WorkflowValidationTimeline
							workflow={workflow}
						/>

						<FixWorkflowValidationErrors
							globalUrl={globalUrl}
							workflow={workflow}
							setWorkflow={setWorkflow}

							setUpdateParent={setUpdate}
						/>
					</div>

					{workflowLoading === true ? 
						<div style={{marginTop: 75, textAlign: "center", }}>
							<Typography variant="h4"> Generating the Workflow...
							</Typography> 
							<CircularProgress style={{marginLeft: 0, marginTop: 25, }}/> 
						</div>
						:
						<div>
							{usecaseDetails === undefined ? null :
								<Typography variant="h6" style={{marginTop: 75, }}>
									{usecaseDetails?.description}
								</Typography> 
							}
							<Typography variant="h6" style={{marginTop: 75, }}>
								{errorMessage !== "" ? errorMessage : ""}
							</Typography> 
							{showLoginButton ?
          						<Link to="/register?message=Please login to create workflows&view=usecases"
          						  style={{
          						    textDecoration: 'none',
									marginBottom: 50, 
          						  }}
          						>
									<Typography
									  style={{
										display: "flex",
										fontSize: 18,
										color: "rgba(255, 132, 68, 1)",
										marginTop: 32,
										fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
										fontWeight: 550,
									  }}
									>
									  Sign up
									  <EastIcon style={{ marginTop: 3, marginLeft: 7 }} />
									</Typography>
								</Link>
							: 
								!showTryitOut && !isActive ?
									<Button
										variant="outlined"
										style={{
											textTransform: "none",
										}}
										onClick={() => {
											//setWorkflowLoading(true)
											getGeneratedWorkflow()
											loadAppAuth() 
										}}
									>
										Try this usecase <TrendingFlatIcon style={{ }} />
									</Button>
								: null}
						</div>
					}

					{!isLoggedIn ? null : 
						<div>
							{(appSetupDone === false && missingSource !== undefined || missingDestination !== undefined) ? 
								<Typography variant="body1" style={{marginTop: 75, marginBottom: 10, }}>
									{"Find relevant Apps for this Usecase"}
								</Typography>
							: null}

							{(missingSource !== undefined) ? 
								<div style={{}}>
									<AppSearchButtons
										globalUrl={globalUrl}
										appFramework={appFramework}

										appType={missingSource.type}
										AppImage={missingSource.image}

										setMissing={setMissingSource}

										getAppFramework={getAppFramework}
									/>
								</div>
							: null}

							{(missingDestination !== undefined) ? 
								<div style={{}}>
									<AppSearchButtons
										globalUrl={globalUrl}
										appFramework={appFramework}

										appType={missingDestination.type}
										AppImage={missingDestination.image}

										setMissing={setMissingDestination}

										getAppFramework={getAppFramework}
									/>
								</div>
							: null}
						</div>
					}

					<ConfigureWorkflow
					  userdata={userdata}
					  theme={theme}
					  globalUrl={globalUrl}
  					  appAuthentication={appAuthentication}
					  setAppAuthentication={setAppAuthentication}

					  workflow={workflow}
					  apps={apps}

					  setConfigurationFinished={setConfigurationFinished}
					/>

				</DialogContent>
        	</Drawer>
    	)
	}

	if (isModalOpenDefault === true) {
		return <ModalView />
	}

	var parsedTitle = title !== undefined && title !== null ? title : ""
	const maxlength = 50 
	if (title !== undefined && title !== null && title.length > maxlength) {
		parsedTitle = title.substring(0, maxlength) + "..."
	}
	
	parsedTitle = parsedTitle.replaceAll("_", " ")

	const parsedDescription = description !== undefined && description !== null ? description.replaceAll("_", " ") : ""

	const boxHeight = 104
	const highlightColor = shownColor !== undefined && shownColor !== null && shownColor !== "" ? shownColor : "#f85a3e"

	var hasInterest = false
	if (userdata.interests !== undefined && userdata.interests !== null && userdata.interests.length > 0) {
		const comparisonTitle = title === undefined || title === null ? "" : title.trim().toLowerCase().replaceAll(" ", "_")
		for (var interestkey in userdata.interests) {
			if (userdata.interests[interestkey].name === undefined || userdata.interests[interestkey].name === null || userdata.interests[interestkey].name === "") {
				continue
			}

			if (modalOpen) { 
				console.log("COMPARE: ", userdata.interests[interestkey].name.trim().toLowerCase().replaceAll(" ", "_"), comparisonTitle)
			}

			if (userdata.interests[interestkey].name.trim().toLowerCase().replaceAll(" ", "_") === comparisonTitle) {
				if (modalOpen) { 
					console.log("FOUND: ", comparisonTitle)
				}

				hasInterest = true
				break
			}
		}
	}

	const borderStyle = isHomePage ? null : isHovered && isActive ? errorMessage !== "" ? "1px solid red" : `2px solid ${theme.palette.green}` : isHovered ? `1px solid ${highlightColor}` : "1px solid rgba(33, 33, 33, 1)"

	return (
		<div style={{ display: "flex", height: boxHeight, borderRadius: theme.palette?.borderRadius, justifyContent: isMobile ? null : "center" }}
		>
			<ModalView />

			<div
				// variant={isActive === 1 ? "contained" : "outlined"} 
				color="secondary"
				disabled={visualOnly === true}
				style={{
					width: isHomePage? isMobile ? null : "100%" : "99%",
					borderRadius: 8,
					textTransform: "none",
					backgroundColor: isHomePage ? null : theme.palette.inputColor,
					border: borderStyle,
					cursor: isActive ? errorMessage !== "" ? "not-allowed" : "pointer" : "pointer",
					position: "relative",
					
				}}
				onMouseEnter={() => {
					setIsHovered(true)

					setShowTryitout(true)
				}}
				onMouseLeave={() => {
					setIsHovered(false)

					if (showTryit !== true) {
						setShowTryitout(false)
					}
				}}
				onClick={() => {
					if (visualOnly === true) {
						console.log("Not showing more than visuals.")
						return
					}

					if (!isLoggedIn) {
						loadAppAuth()
						setModalOpen(true)
					} else if (isLoggedIn && errorMessage !== "") {
						toast.error("Already failed to generate a workflow for this usecase. Please try again later or contact support@shuffler.io.")

						setModalOpen(true)
					} else if (isActive) {
						// toast.success("Workflow already generated. Please try another workflow template!")

						// FIXME: Remove these?
						loadAppAuth() 
						setModalOpen(true)
						//getGeneratedWorkflow()
					} else {
						setModalOpen(true)
						//setWorkflowLoading(false)
					}
				}}
			>

				<div style={{display: "flex", }}>
					{shownColor !== undefined && shownColor !== null && shownColor !== "" ? 
						<div style={{position: "absolute", left: 0, height: boxHeight-2, width: 4, backgroundColor: shownColor, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, }} />
					: null}

					<div style={{ display: "flex", itemAlign: "left", textAlign: "left", }}>
						<div style={{display: "flex", flex: 1, marginLeft: 25, marginTop: showTryitOut && !isActive ? 14 : 30, }}>
							<div style={{zIndex: 51}}>
								{img1 !== undefined && img1 !== "" && srcapp !== undefined && srcapp !== "" ?
									<Tooltip title={srcapp.replaceAll(":default", "").replaceAll("_", " ").replaceAll(" API", "")} placement="top">
										<div style={srcapp !== undefined && srcapp.includes(":default") ? imagestyleWrapperDefault : imagestyleWrapper}>
											<img src={img1} style={srcapp !== undefined && srcapp.includes(":default") ? imagestyleDefault : imagestyle} />
										</div>
									</Tooltip>
								: 
									<div style={{width: 50, }} />
								}
							</div>


							{img2 !== undefined && img2 !== "" && dstapp !== undefined && dstapp !== "" ?
								<Tooltip title={dstapp.replaceAll(":default", "").replaceAll("_", " ").replaceAll(" API", "")} placement="top">
									<div style={{display: "flex", position: "relative", left: -10, }}>
										<div style={dstapp !== undefined && dstapp.includes(":default") ? imagestyleWrapperDefault : imagestyleWrapper}>
											<img src={img2} style={dstapp !== undefined && dstapp.includes(":default") ? imagestyleDefault : imagestyle} />
										</div>
									</div>
								</Tooltip>
							:
								<div style={{width: 0, }} />
							}	

						</div>
						<div style={{ marginLeft: 20, overflow: "hidden", maxHeight: 30, marginTop: showTryitOut && !isActive ? 8 : 23, }}>
							<Typography variant="body1" style={{ marginTop: parsedDescription.length === 0 ? 10 : 0, fontSize: isMobile ? 13 : 16, fontWeight: isHomePage ? 600 : null, textTransform: 'capitalize', color: isHomePage ? "var(--White-text, #F1F1F1)" : "rgba(241, 241, 241, 1)"}} >
								<b>{parsedTitle}</b>
							</Typography>
						</div>
					</div>
				</div>

				<div>
					{isActive === true && errorMessage === "" ?
						<Tooltip title="You already have workflows that are based on this usecase" placement="top">
							<CheckIcon color="primary" sx={{ borderRadius: 4 }} style={{ position: "absolute", color: theme.palette.green, top: 10, right: 10, }} /> 
						</Tooltip>
					: ""}

					{!isActive && hasInterest === true ?
						<Tooltip title="Your team has shown interest in this usecase previously." placement="top">
							<InterestsIcon color="primary" sx={{ borderRadius: 4 }} style={{ position: "absolute", color: "rgba(254, 204, 0, 0.5)", top: 10, right: 10, }} />
						</Tooltip>
					 : null}
				</div>


				{showTryitOut && !isActive ? 
					<Fade in={showTryitOut} timeout={300}>
						<Button
							variant="text"
							style={{
								textTransform: "none",
								marginTop: 8, 
								marginLeft: 15, 
							}}
							onClick={() => {
								//setWorkflowLoading(true)
								getGeneratedWorkflow()
								loadAppAuth() 
							}}
						>
							Try it out <TrendingFlatIcon style={{ }} />
						</Button>
					</Fade>
				: null}
			</div>


		</div>
	)
}

export default WorkflowTemplatePopup 
