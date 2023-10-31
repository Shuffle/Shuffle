import React, { useState, useEffect } from "react";

import { toast } from "react-toastify" 
import theme from '../theme.jsx';
import { useNavigate, Link, useParams } from "react-router-dom";
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
} from '@mui/icons-material';

import WorkflowTemplatePopup2 from "./WorkflowTemplatePopup.jsx";
import ConfigureWorkflow from "../components/ConfigureWorkflow.jsx";

const WorkflowTemplatePopup = (props) => {
	const { userdata, globalUrl, img1, srcapp, img2, dstapp, title, description, visualOnly, apps } = props;

	const [isActive, setIsActive] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [workflowLoading, setWorkflowLoading] = useState(false);
	const [workflow, setWorkflow] = useState({});
  	const [appAuthentication, setAppAuthentication] = React.useState(undefined);

  	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
	let navigate = useNavigate();

    const imagestyleWrapper = {
        height: 40,
		width: 40,
        borderRadius: 40,
		border: "1px solid rgba(255,255,255,0.3)",
		overflow: "hidden",
		display: "flex",
    }

	const imagestyleWrapperDefault = {
        height: 40,
		width: 40,
        borderRadius: 40,
		border: "1px solid rgba(255,255,255,0.3)",
		overflow: "hidden",
		display: "flex",
	}

    const imagestyle = {
        height: 40,
		width: 40,
        borderRadius: 40,
		border: "1px solid rgba(255,255,255,0.3)",
		overflow: "hidden",
    }

	const imagestyleDefault = {
		display: "block",
		marginLeft: 11,
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
		if (userdata === undefined || userdata === null) { 
			setErrorMessage("You need to be logged in to try usecases. Redirecting in 5 seconds...")
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

	const getGeneratedWorkflow = () => {
		// POST
		// https://shuffler.io/api/v1/workflows/merge
		// destination: {app_id: "b9c2feaf99b6309dabaeaa8518c61d3d", app_name: "Servicenow_API", app_version: "",…}
		// id: ""
		// middle:[]
		// name: "Email analysis"
		// source:{app_id: "accdaaf2eeba6a6ed43b2efc0112032d", app_name
		

		if (srcapp.includes(":default") || dstapp.includes(":default")) {
			toast("You need to select both a source and destination app before generating this workflow.")
			return
		}
		
		setWorkflowLoading(true)

		// FIXME: Remove hardcoding here after testing, and user srcapp/dstapp
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

		//fetch(globalUrl + "/api/v1/workflows/merge", {
		fetch("https://shuffler.io/api/v1/workflows/merge", {
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
				console.log("Status not 200 for framework!");
			}

			setWorkflowLoading(false)
			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.success === false) {
				console.log("Error in workflow template: ", responseJson.error);

				setErrorMessage("Failed to generate workflow for these tools - the Shuffle team has been notified. Click out of this window to continue. Contact support@shuffler.io for further assistance.")

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
			setWorkflowLoading(false)
		})
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
        	            minWidth: 700,
        	            maxWidth: 700,
						paddingTop: 75, 
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
				<DialogContent style={{marginTop: 0, marginLeft: 75, maxWidth: 470, }}>
					<Typography variant="h4">
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
							<CircularProgress style={{marginLeft: 125, marginTop: 10, }}/> 
						</div>
						:
						<div>
							<Typography variant="h6" style={{marginTop: 75, }}>
								{errorMessage !== "" ? errorMessage : ""}
							</Typography> 
						</div>
					}
					<ConfigureWorkflow
					  userdata={userdata}
					  theme={theme}
					  globalUrl={globalUrl}
					  workflow={workflow}
  					  appAuthentication={appAuthentication}
					  setAppAuthentication={setAppAuthentication}
					  apps={apps}
					/>
					{errorMessage === "" ?
						<Button
							style={{marginTop: 50, }}
							variant={isFinished() ? "contained" : "outlined"}
							onClick={() => {
								setModalOpen(false);
							}}
						>
							Done
						</Button>
					: null}
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
		<div style={{ display: "flex", maxWidth: isCloud ? 470 : 450, minWidth: isCloud ? 470 : 450, height: 78, borderRadius: 8 }}>
			<ModalView />
			<div
				// variant={isActive === 1 ? "contained" : "outlined"} 
				color="secondary"
				disabled={visualOnly === true}
				style={{
					margin: 4, 
					width: "100%",
					borderRadius: 8,
					textTransform: "none",
					backgroundColor: theme.palette.inputColor,
					border:  isActive ? errorMessage !== "" ? "1px solid red" : `2px solid ${theme.palette.green}` : isHovered ? "1px solid #f85a3e" : "1px solid rgba(33, 33, 33, 1)",
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
								<span style={srcapp !== undefined && srcapp.includes(":default") ? imagestyleWrapperDefault : imagestyleWrapper}>
									<img src={img1} style={srcapp !== undefined && srcapp.includes(":default") ? imagestyleDefault : imagestyle} />
								</span>
							</Tooltip>
						: 
							<span style={{width: 50, }} />
						}
						{img2 !== undefined && img2 !== "" && dstapp !== undefined && dstapp !== "" ?
							<Tooltip title={dstapp.replaceAll(":default", "").replaceAll("_", " ").replaceAll(" API", "")} placement="top">
								<span style={{display: "flex", }}>
									<TrendingFlatIcon style={{ marginTop: 7, }} />
									<span style={dstapp !== undefined && dstapp.includes(":default") ? imagestyleWrapperDefault : imagestyleWrapper}>
										<img src={img2} style={dstapp !== undefined && dstapp.includes(":default") ? imagestyleDefault : imagestyle} />
									</span>
								</span>
							</Tooltip>
						:
							<span style={{width: 50, }} />
						}	
					</div>
					<div style={{ flex: 3, marginLeft: 20, }}>
						<Typography variant="body1" style={{ marginTop: parsedDescription.length === 0 ? 10 : 0, }} color="rgba(241, 241, 241, 1)">
							{parsedTitle}
						</Typography>
						<Typography variant="body2" color="textSecondary" style={{ marginTop: 0, marginRight: 0, maxHeight: 16, overflow: "hidden",}} color="rgba(158, 158, 158, 1)">
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
