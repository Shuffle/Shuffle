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
	IconButton,
	Tooltip,
} from "@mui/material";

import {
	Check as CheckIcon,
	TrendingFlat as TrendingFlatIcon,
	Close as CloseIcon,
	East as EastIcon, 
} from '@mui/icons-material';

import WorkflowTemplatePopup2 from "./WorkflowTemplatePopup.jsx";
import ConfigureWorkflow from "../components/ConfigureWorkflow.jsx";

const WorkflowTemplatePopup = (props) => {
	const { userdata, appFramework, globalUrl, img1, srcapp, img2, dstapp, title, description, visualOnly, apps, isLoggedIn, isHomePage, getAppFramework,  } = props;

	const [isActive, setIsActive] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [workflowLoading, setWorkflowLoading] = useState(false);
	const [workflow, setWorkflow] = useState({});
	const [showLoginButton, setShowLoginButton] = useState(false);
  	const [appAuthentication, setAppAuthentication] = React.useState(undefined);
  	const [missingSource, setMissingSource] = React.useState(undefined)
  	const [missingDestination, setMissingDestination] = React.useState(undefined);
  	const [configurationFinished, setConfigurationFinished] = React.useState(false)
	const [appSetupDone, setAppSetupDone] = React.useState(false)

	const [requestSent, setRequestSent] = React.useState(false)
  	
	const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
	let navigate = useNavigate();
	useEffect(() => {
		if (modalOpen !== true) {
			return
		}

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
	}, [modalOpen, missingSource, missingDestination])

	useEffect(() => {
		//console.log("IN USEEFFECT FOR CONFIG: ", configurationFinished)
		if (configurationFinished === true && workflow.id !== undefined && workflow.id !== null && workflow.id !== "") {
			toast.success("Generation Successful. Redirecting to the workflow..")
			setTimeout(() => {
				navigate("/workflows/" + workflow.id)
			}, 2000)
		}
	}, [configurationFinished, workflow])


	const imagestyleWrapper = {
        height: 40,
		width: 40,
        borderRadius: 40,
		border: isHomePage ? null : "1px solid rgba(255,255,255,0.3)",
		overflow: "hidden",
		display: "flex",
    }

	const imagestyleWrapperDefault = {
        height: 40,
		width: 40,
        borderRadius: 40,
		border: isHomePage ? null : "1px solid rgba(255,255,255,0.3)",
		overflow: "hidden",
		display: "flex",
	}

    const imagestyle = {
        height: 40,
		width: 40,
        borderRadius: 40,
		border: isHomePage ? null : "1px solid rgba(255,255,255,0.3)",
		overflow: "hidden",
    }

	const imagestyleDefault = {
		display: "block",
		marginLeft: 12,
		marginTop: 11,
		height: 35,
		width: "auto",
	}

	if (title === undefined || title === null || title === "") {
		console.log("No title for workflow template popup!");
		return null
	}

	const getWorkflow = (workflowId) => {
		fetch(`${globalUrl}/api/v1/workflows/${workflowId}`, {
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
				console.log("Error in workflow loading for ID ", workflowId)
			} else {
				setWorkflow(responseJson)
			}
		})
		.catch((error) => {
			console.log("err in framework: ", error.toString());
			setWorkflowLoading(false)
		})
	}

	const loadAppAuth = () => {	
		// Check if it exists, and has keys
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
		

		if (srcapp.includes(":default") || dstapp.includes(":default")) {
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

				const defaultMessage = "Failed to generate workflow the workflow - the Shuffle team has been notified. Contact support@shuffler.io for further assistance."
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
	
				getWorkflow(responseJson.workflow_id)
			}
		})
		.catch((error) => {
			console.log("err in framework: ", error.toString());
			setRequestSent(false)
			setWorkflowLoading(false)
		})
	}

	if (modalOpen === true && !srcapp.includes(":default") && !dstapp.includes(":default")) {
		if (appSetupDone === false && setAppSetupDone !== undefined) {
			setAppSetupDone(true)
		}

		if (workflow.id === undefined && workflowLoading === false && errorMessage === "") {
			getGeneratedWorkflow() 
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
				anchor={"left"}
        	    open={modalOpen}
        	    onClose={() => {
        	        setModalOpen(false);
        	    }}
        	    PaperProps={{
        	        style: {
						backgroundColor: "black",
        	            color: "white",
        	            minWidth: isHomePage ? null : isMobile ? 300 : 700,
        	            maxWidth: isHomePage ? null : isMobile ? 300 : 700,
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
						/>
					</div>
					{workflowLoading ? 
						<div style={{marginTop: 75, textAlign: "center", }}>
							<Typography variant="h4"> Generating the Workflow...
							</Typography> 
							<CircularProgress style={{marginLeft: 0, marginTop: 25, }}/> 
						</div>
						:
						<div>
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
							: null}
						</div>
					}

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

					<ConfigureWorkflow
					  userdata={userdata}
					  theme={theme}
					  globalUrl={globalUrl}
					  workflow={workflow}
  					  appAuthentication={appAuthentication}
					  setAppAuthentication={setAppAuthentication}
					  apps={apps}

					  setConfigurationFinished={setConfigurationFinished}
					/>

					{/*errorMessage === "" && configurationFinished === true && workflow.id !== undefined && workflowLoading === false ?
						<Tooltip title="Click to explore the workflow" placement="top">
							<span 
								style={{position: "fixed", display: "flex", right: "10%", top: "20%", border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette?.borderRadius, padding: "15px 30px 15px 30px", backgroundColor: theme.palette.platformColor, cursor: "pointer", }}
								onClick={() => {
									// Open in new tab
									window.open("/workflows/" + workflow.id, "_blank")
								}}
							>
								<Typography variant="h5" style={{ }}>
									Workflow Successfully Generated!
								</Typography>
							</span>
						</Tooltip>
					: null*/}

				</DialogContent>
        	</Drawer>
    	)
	}

	var parsedTitle = title
	const maxlength = 30
	if (title.length > maxlength) {
		parsedTitle = title.substring(0, maxlength) + "..."
	}
	
	parsedTitle = parsedTitle.replaceAll("_", " ")

	const parsedDescription = description !== undefined && description !== null ? description.replaceAll("_", " ") : ""


	return (
		<div style={{ display: "flex", maxWidth: isCloud ? isMobile ? null : 470 : isMobile? 345: 450, minWidth: isCloud ? isMobile ? null : 470 : isMobile? null: 450, height: 78, borderRadius: 8, justifyContent: isMobile ? null : "center" }}>
			<ModalView />
			<div
				// variant={isActive === 1 ? "contained" : "outlined"} 
				color="secondary"
				disabled={visualOnly === true}
				style={{
					margin: isHomePage ? isMobile ? null : 4 : 4 , 
					width: isHomePage? isMobile ? null : "100%" : "100%",
					borderRadius: 8,
					textTransform: "none",
					backgroundColor: isHomePage ? null : theme.palette.inputColor,
					border:  isHomePage ? null : isActive ? errorMessage !== "" ? "1px solid red" : `2px solid ${theme.palette.green}` : isHovered ? "1px solid #f85a3e" : "1px solid rgba(33, 33, 33, 1)",
					cursor: isActive ? errorMessage !== "" ? "not-allowed" : "pointer" : "pointer",
					padding: "10px 20px 10px 20px", 
					position: "relative",
					
				}}
				onMouseEnter={() => {
					setIsHovered(true)
				}}
				onMouseLeave={() => {
					setIsHovered(false)
				}}
				onClick={() => {
					if (visualOnly === true) {
						console.log("Not showing more than visuals.")
						return
					}

					//setIsActive(!isActive)
					if (errorMessage !== "") {
						toast("Already failed to generate a workflow for this usecase. Please try again later or contact support@shuffler.io.")

						setModalOpen(true)
					} else if (isActive) {
						toast("Workflow already generated. Please try another workflow template!")

						// FIXME: Remove these?
						loadAppAuth() 
						setModalOpen(true)
						//getGeneratedWorkflow()
					} else {
	
						loadAppAuth() 
						setModalOpen(true)
						getGeneratedWorkflow()
					}
				}}
			>
				<div style={{ display: "flex", itemAlign: "left", textAlign: "left", }}>
					<div style={{display: "flex", flex: 1, marginTop: 3, }}>
						{img1 !== undefined && img1 !== "" && srcapp !== undefined && srcapp !== "" ?
							<Tooltip title={srcapp.replaceAll(":default", "").replaceAll("_", " ").replaceAll(" API", "")} placement="top">
								<div style={srcapp !== undefined && srcapp.includes(":default") ? imagestyleWrapperDefault : imagestyleWrapper}>
									<img src={img1} style={srcapp !== undefined && srcapp.includes(":default") ? imagestyleDefault : imagestyle} />
								</div>
							</Tooltip>
						: 
							<div style={{width: 50, }} />
						}
						{img2 !== undefined && img2 !== "" && dstapp !== undefined && dstapp !== "" ?
							<Tooltip title={dstapp.replaceAll(":default", "").replaceAll("_", " ").replaceAll(" API", "")} placement="top">
								<div style={{display: "flex", }}>
									<TrendingFlatIcon style={{ marginTop: 7, }} />
									<div style={dstapp !== undefined && dstapp.includes(":default") ? imagestyleWrapperDefault : imagestyleWrapper}>
										<img src={img2} style={dstapp !== undefined && dstapp.includes(":default") ? imagestyleDefault : imagestyle} />
									</div>
								</div>
							</Tooltip>
						:
							<div style={{width: 50, }} />
						}	
					</div>
					<div style={{ flex: 3, marginLeft: 20, maxHeight: 50, overflow: "hidden", }}>
						<Typography variant="body1" style={{ marginTop: parsedDescription.length === 0 ? 10 : 0, fontSize: isMobile ? 13 : 16,fontWeight: isHomePage? 600 : null,textTransform: 'capitalize', color: isHomePage ? "var(--White-text, #F1F1F1)" :"rgba(241, 241, 241, 1)"}} >
							{parsedTitle}
						</Typography>
						<Typography variant="body2" color="textSecondary" style={{ fontSize: isMobile ? 10: 16, fontWeight: isHomePage ? 400 : null, textTransform: 'capitalize', marginTop: 0, overflow: "hidden", maxHeight: 31,}} color="rgba(158, 158, 158, 1)">
							{parsedDescription}
						</Typography>
					</div>
				</div>
				<div>
					{isActive === true && errorMessage === "" ?
						<CheckIcon color="primary" sx={{ borderRadius: 4 }} style={{ position: "absolute", color: theme.palette.green, top: 10, right: 10, }} /> 
					: ""}
				</div>

			</div>


		</div>
	)
}

export default WorkflowTemplatePopup 
