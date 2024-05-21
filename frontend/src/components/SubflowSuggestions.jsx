import React, { useEffect } from "react";

import { makeStyles } from "@mui/styles";
import theme from '../theme.jsx';
import { toast } from "react-toastify"

import AuthenticationData  from "../components/AuthenticationWindow.jsx"

import { 
	Chip, 
	Modal, 
	Button,
	Typography,
	FormControl,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Select,
	MenuItem,
	Box,
	Divider,
	InputLabel,
	Stack,
} from '@mui/material';

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
})

const SubflowSuggestions = (props) => {
	const {
		type,
		globalUrl,
		workflows,
		notificationWorkflow,
		selectedOrganization,
	} = props

    const classes = useStyles();

	const [notificationWorkflowModal, setNotificationWorkflowModal] = React.useState(false);
	const [selectedAppDetails, setSelectedAppDetails] = React.useState({});
	const [notificationWorkflowTestModal, setNotificationWorkflowTestModal] = React.useState(false);
	const [selectedAuth, setSelectedAuth] = React.useState('');
	const [emailData,setEmailData] = React.useState([]);
	const [notificationAppDetails, setNotificationAppDetails] = React.useState([]);
	const [generatedWorkflow, setGeneatedWorkflow] = React.useState({});
	const [textFieldValue, setTextFieldValue] = React.useState("");
	const [textFieldOneValue, setTextFieldOneValue] = React.useState("");

    // getting comms & cases app from app framework
	var notificationAppList = [];
	if (selectedOrganization.security_framework.cases && selectedOrganization.security_framework.cases.name.length > 0) {
		notificationAppList = notificationAppList.concat(selectedOrganization.security_framework.cases);
	}
	if (selectedOrganization.security_framework.communication && selectedOrganization.security_framework.communication.name.length > 0) {
		notificationAppList = notificationAppList.concat(selectedOrganization.security_framework.communication);
	}

	useEffect(() => {
		let nameList = notificationAppList.length > 0? notificationAppList.map(item => item.name): ["email"];
		prepareNotificationAppList(nameList)
	  }, [notificationAppList,workflows]);

	const executeTestWorkflow = (workflowid) => {
		const data = { "execution_argument": '{"title":"THIS IS TEST ALERT","description":"TEST ALERT FROM SHUFFLE","reference_url": "shuffler.io"}' }

		fetch(globalUrl + `/api/v1/workflows/${workflowid}/execute`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(data),
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				toast("Failed setting notification workflow: ", response.reason);
				console.log("Status not 200 for workflows :O!");
				return;
			}
			toast("Notification workflow ran successfully");
			return response.json();
		}).catch((error) => {
			console.log("Error getting workflows: " + error);
		})
	}


	const testWorkflowModal = notificationWorkflowTestModal ?
	<Dialog
		open={notificationWorkflowTestModal}
		PaperProps={{
			style: {
				backgroundColor: theme.palette.surfaceColor,
				color: "white",
				minWidth: 500,
			},
		}}
		onClose={() => {
			setNotificationWorkflowTestModal(false);
		}}
	>
		<FormControl>
			{/* <DialogTitle>
		  <div style={{ color: "rgba(255,255,255,0.9)" }}>
			Notification workflow
		  </div>
		</DialogTitle> */}
			<DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
				We have updated the Notification workflow. Do you want to test it?
			</DialogContent>
			<DialogActions>
				<Button
					style={{ borderRadius: "0px" }}
					onClick={() => {
						setNotificationWorkflowTestModal(false);
					}}
					color="primary"
				>
					No
				</Button>
				<Button
					variant="contained"
					style={{ borderRadius: "0px" }}
					onClick={() => {
						executeTestWorkflow(selectedOrganization.defaults.notification_workflow);
						setNotificationWorkflowTestModal(false);
					}}
					color="primary"
				>
					Yes
				</Button>
			</DialogActions>
		</FormControl>
	</Dialog> : null

	// fixxxxxxxxxxxxxxxxxxxx	
	const checkIfAlreadyGenerated = (appList, workflows) => { 

		var workflowName = workflows.find(workflow => workflow.id === notificationWorkflow)
		if (workflowName) {
			workflowName = workflowName.name
		}
		else {
			console.log("no workflow set")
			return
		}
		if (workflowName) {
			const parts = workflowName.split(' ');
			console.log("parts", parts)
			if (parts[0].toString() === "[GENERATED]" && parts.length > 1) {
				console.log("parts1", parts[1])
				if ((appList.includes(parts[1]))) {
					console.log("workflow already generated")
					setGeneatedWorkflow({"app_name": parts[1]})
				}
			}
		}
		else {
			return
		}
	}

	const mergeAuthData = (result, responseJson) => {
		const updatedResult = result.map(item => {
		  const matches = responseJson.filter(authItem => authItem.app.name === item.name);
		  return {
			...item,
			authentication_data: matches.length > 0 ? matches : null
		  }
		})

		return updatedResult
	  }

	const prepareNotificationAppList = (appList) => {
		var result = []
			fetch(globalUrl + "/api/v1/apps", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				credentials: "include",
			}).then((response) => {
				if (response.status !== 200) {
					toast("Failed getting app ids: ", response.reason);
					console.log("Status not 200 for app ids :O!");
					return;
				}
				return response.json();
			}).then((responseJson) => {
				if (responseJson !== undefined) {
					const filteredApps = responseJson.filter(app => appList.includes(app.name));
					const emailData = responseJson.filter(app => app.name === "email")
					setEmailData(emailData)
					const appDetails = filteredApps.map(app => ({ name: app.name, id: app.id })); //mapped apps with IDs as sometime Ids were not correct in security framework
					// console.log("appDetails: ", appDetails)
					// result = appDetails

					fetch(globalUrl + "/api/v1/apps/authentication", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						credentials: "include",
					})
						.then((response) => {
							if (response.status !== 200) {
								toast(`Failed getting auth for : `, response.reason);
								console.log("Status not 200 for app auth :O!");
								return;
							}
							return response.json();
						}).then((responseJson) => {
							if (!responseJson.success) {
								console.log("Could not get app auth")
								return;
							}
							// console.log("responseJson of auth: ", responseJson.data)
							result = mergeAuthData(appDetails, responseJson.data)
							// console.log("merged auth data: ", result)
							// console.log("result", result)
							result.map(item => {
								fetch(globalUrl + `/api/v1/apps/${item.id}/config`, {
									method: "GET",
									headers: {
										"Content-Type": "application/json",
										Accept: "application/json",
									},
									credentials: "include",
								}).then((response) => {
									if (response.status !== 200) {
										toast(`Failed getting config for ${item.id}: `, response.reason);
										console.log("Status not 200 for app config :O!");
										return;
									}
									return response.json();
								}).then((responseJson) => {
									if (!responseJson.success) {
										console.log("Could not get app config")
										return;
									}
									var decodedString = JSON.parse(atob(responseJson.app));
									// console.log("dcodedString: ",decodedString)
									item.auth_config = decodedString.authentication
									item.large_image = decodedString.large_image
									setNotificationAppDetails(result)
									console.log("notificationAppDetails: ", notificationAppDetails)
								}).then(()=>{
									checkIfAlreadyGenerated(appList,workflows);
									
								}).catch((error) => {
									console.log("Error getting app config: " + error);
									toast("Error getting app config: " + error);
								})
							})
						})
				}
			}).catch((error) => {
				console.log("Error getting app ids: " + error);
			})		
	}

	const renderChips = (apps) => {
		return (
			<Stack direction="row" spacing={1}>
				{apps.map((app) => (
					<Chip
						key={app.id}
						label={app.name}
						variant={generatedWorkflow.app_name === app.name? "filled":"outlined"}
						disabled={generatedWorkflow.app_name === app.name ? true:false}
						onClick={() => {
							console.log(`Clicked ${app.name}`)
							console.log("app: ",app)
							setSelectedAppDetails(app)
							if (app.authentication_data && app.authentication_data.length > 0){ //fixxxxxxxx
								console.log("authdata: ",app.authentication_data[0])
								setSelectedAuth(app.authentication_data[app.authentication_data.length-1].id)
							}
							setNotificationWorkflowModal(true)
							// getAppAuth(app.name)
							console.log("selectedAppDEtails",selectedAppDetails)
						}}
						avatar={<img src={app.large_image} alt={app.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />}

					/>
				))}
			</Stack>
		)
	}

	const generateEmailNotificationWorkflow = async (appname,appImage,shuffleAPIKey,recepients) => {
	//currently only supports  figure out a way to support more apps
		const workflowName = `[GENERATED] ${appname} notification workflow`
		const workflowDescription = "Generated by Shuffle for sending info/error notifications."
		const data = {
			"name": workflowName,
			"description": workflowDescription,
		}

		fetch(globalUrl + "/api/v1/workflows", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(data),
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				toast("Failed setting notification workflow: ", response.reason);
				console.log("Status not 200 for workflows :O!");
				return;
			}
			return response.json();
		}).then((responseJson)=>{
			if (responseJson !== undefined) {
				console.log("Notification workflow created successfully")
				var workflow_id = responseJson.id
				if (appname.toLowerCase() === "email"){
					console.log("updating workflow for email")
					var workflowBody = {
						"name": workflowName,
						"Description": workflowDescription,
						"id": workflow_id,
						"actions": [
							{
								"app_name": "email",
								"name": "send_email_shuffle",
								"large_image":appImage,
								"isStartNode": true,
								"label": "send_email_shuffle",
								"app_version": "1.3.0",
								"parameters": [
									{
										"name": "apikey",
										"value": shuffleAPIKey
									},
									{
										"name": "recipients",
										"value": recepients
									},
									{
										"name": "subject",
										"value": "$exec.title"
									},
									{
										"name":"body",
										"value":"$exec.description"
									}
								]
							}
						]
					}
				} 
				fetch(globalUrl + `/api/v1/workflows/${workflow_id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(workflowBody),
					credentials: "include",
				})
					.then((response) => {
						if (response.status !== 200) {
							toast("Failed setting notification workflow: ", response.reason);
							console.log("Status not 200 for workflows :O!");
							return;
						}
						return response.json();
					}).then((responseJson)=>{
						if (responseJson !== undefined) {
							if (type === "notification") {
								console.log("FIXME: Notification workflow updated successfully")
								toast("FIXME: Notification workflow updated successfully")
							} 
						}
					})
			}
		}).catch((error) => {
			console.log("Error setting workflows: " + error);
		})
}


	



	const modalView = notificationWorkflowModal ? (
	<Dialog
		open={notificationWorkflowModal}
		PaperProps={{
			style: {
				backgroundColor: theme.palette.grey,
				minWidth: 500,
			},
		}}
		onClose={() => {
			setNotificationWorkflowModal(false);
		}}
	>
		<FormControl>
			<DialogTitle>
				<div style={{ color: "rgba(255,255,255,0.9)" }}>
					{`Configure ${selectedAppDetails.name} workflow`}
				</div>
			</DialogTitle>
			<DialogContent style={{ color: "rgba(255,255,255,0.65)", overflowY: 'auto', maxHeight: '450px' }}>
				<Divider style={{ marginBottom: '1em', backgroundColor: 'rgba(255,255,255,0.12)' }} />
				{console.log("len Selected app details: ", selectedAppDetails)}
				{(selectedAppDetails.authentication_data || (selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false) || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false)) ?
					<>
						<Box mb={2}>
							{(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false)) ? "No authentication required":
							<>
							<Typography variant="body1" style={{ marginBottom: '0.5rem' }}>
								Pick an authentication method from the list
							</Typography>
							<FormControl fullWidth style={{ marginBottom: 10 }}>
								<InputLabel id="demo-simple-select-label">Available authentications</InputLabel>
								<Select
									labelId="demo-simple-select-label"
									id="demo-simple-select"
									value={selectedAuth}
									disabled = {(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false))} 
									onChange={(event) => {setSelectedAuth(event.target.value)
										console.log("event.target.value: ",event.target.value)
										console.log("Selected auth: ", selectedAuth)
									}}
									label="Available authentications"
									required={true}
								>
									{(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false))  ?  "No authentication required" : selectedAppDetails.authentication_data.map((option) => (
										<MenuItem key={option.id} value={option.id}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
												<Chip label={option.app.app_version} variant="outlined" />
												{option.label}
											</div>
										</MenuItem>))}
								</Select>
							</FormControl></>}
						</Box>
						<Box mt={2}>
							<Typography variant="body1">
								Provide additional required details:
							</Typography>
							<TextField
								required
								style={{
									flex: "1",
									marginTop: "5px",
									marginRight: "15px",
									backgroundColor: theme.palette.inputColor,
								}}
								fullWidth={true}
								type="name"
								id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder={ selectedAppDetails.name.toLowerCase() === "jira" ? "Project key" : "Shuffle API key"}
								// value={webhookInputValue}
								onChange={(e) => {
									setTextFieldOneValue(e.target.value)
								}}
								InputProps={{
									classes: {
										notchedOutline: classes.notchedOutline,
									},
									style: {
										color: "white",
									},
								}} />
							<TextField
								required
								style={{
									flex: "1",
									marginTop: "5px",
									marginRight: "15px",
									backgroundColor: theme.palette.inputColor,
								}}
								fullWidth={true}
								type="name"
								id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder={selectedAppDetails.name.toLowerCase() === "jira" ? "Issue type" : "Recepients (comma separated)"}
								// value={webhookInputValue}
								onChange={(e) => {
									setTextFieldValue(e.target.value)
								}}
								InputProps={{
									classes: {
										notchedOutline: classes.notchedOutline,
									},
									style: {
										color: "white",
									},
								}} />			
						</Box>
					</> : 
					<>
					<AuthenticationData
						app={selectedAppDetails}
						// globalUrl={globalUrl}
						authenticationModalOpen={(selectedAppDetails.authentication_data && selectedAppDetails.authentication_data.length > 0) ? false : true}
						// // setAuthenticationModalOpen={false}
						selectedApp={{...selectedAppDetails,authentication: selectedAppDetails.auth_config}}
						// getAppAuthentication={selectedAppDetails.name}
					/>
					</>
				}
			</DialogContent>
			<DialogActions>
				<Button
					style={{ borderRadius: "0px" }}
					onClick={() => {
						setNotificationWorkflowModal(false);
					}}
					color="primary"
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					style={{ borderRadius: "0px" }}
					// disabled={(authOptions.length > 0 ? false : true) || !notificationWorkflowModalValid}
					onClick={() => {
						console.log("Selectedappdetails: ", selectedAppDetails)
						selectedAppDetails.name == "email" ? generateEmailNotificationWorkflow(selectedAppDetails.name, selectedAppDetails.large_image,textFieldOneValue, textFieldValue) :
						//generateNotificationWorkflow(selectedAppDetails.name, selectedAppDetails.large_image,selectedAuth, textFieldOneValue, textFieldValue)
						setNotificationWorkflowModal(false);
					}}
					color="primary"
				>
					Submit
				</Button>
			</DialogActions>
		</FormControl>
	</Dialog >
) : null

	return (
		<div>
			{modalView}

			{/*{testWorkflowModal} */}
			<div style={{ marginBottom: 10 }}>
				{renderChips(notificationAppDetails.length > 0 ? notificationAppDetails : emailData)}
			</div>
		</div>
	)
}

export default SubflowSuggestions;
