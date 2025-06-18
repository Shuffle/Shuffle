import React, { useState, useEffect, useContext, memo, useCallback } from "react";
import { toast } from "react-toastify";
import { getTheme } from "../theme.jsx";
import { v4 as uuidv4, v5 as uuidv5, validate as isUUID, } from "uuid";
import {
	Paper,
	Tooltip,
	Typography,
	Divider,
	Button,
	ButtonGroup,
	Grid,
	Card,
	Switch,
	Autocomplete,
	TextField,
	MenuItem,
	IconButton,
	Dialog,
	FormControl,
	DialogContent,
	DialogActions,
	DialogTitle,
	InputLabel,
	Box,
	Select
} from "@mui/material";

import AuthenticationData from "../components/AuthenticationWindow.jsx";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";

import {
	OpenInNew as OpenInNewIcon,
	Info as InfoIcon,
} from "@mui/icons-material";

import { makeStyles } from "@mui/styles";
import { Context } from "../context/ContextApi.jsx";

import { useNavigate, Link } from "react-router-dom";
import Priority from "../components/Priority.jsx";
import { constrainMatrix } from "reaviz";
//import { useAlert 


const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important",
	},
});

const Priorities = memo((props) => {
	const { globalUrl, userdata, clickedFromOrgTab, selectedOrganization, handleEditOrg, serverside, billingInfo, stripeKey, checkLogin, setAdminTab, setCurTab, notifications, setNotifications, } = props;
	const { themeMode, brandColor } = useContext(Context);
	const theme = getTheme(themeMode, brandColor);
	const [showDismissed, setShowDismissed] = React.useState(false);
	const [showRead, setShowRead] = React.useState(false);
	const [appFramework, setAppFramework] = React.useState({});
	const [selectedWorkflow, setSelectedWorkflow] = React.useState("NO HIGHLIGHT");
	const [selectedExecutionId, setSelectedExecutionId] = React.useState("NO HIGHLIGHT");
	const [highlightKMS, setHighlightKMS] = React.useState(false)

	const [workflows, setWorkflows] = React.useState([])
	const [openNotification, setOpenNotification] = React.useState(false);
	const [workflow, setWorkflow] = React.useState({})
	const [notificationWorkflow, setNotificationWorkflow] = React.useState(
		selectedOrganization.defaults === undefined
			? ""
			: selectedOrganization.defaults.notification_workflow === undefined ||
				selectedOrganization.defaults.notification_workflow.length === 0
				? ""
				: selectedOrganization.defaults.notification_workflow
	);


	//  notification workflow
	const [notificationWorkflowModal, setNotificationWorkflowModal] = React.useState(false);
	const [selectedAppDetails, setSelectedAppDetails] = React.useState({});
	const [notificationWorkflowTestModal, setNotificationWorkflowTestModal] = React.useState(false);
	const [selectedAuth, setSelectedAuth] = React.useState('');
	const [emailData, setEmailData] = React.useState([]);
	const [notificationAppsDetails, setnotificationAppsDetails] = React.useState({});
	const [generatedWorkflow, setGeneatedWorkflow] = React.useState({});

	// for jira & email modal
	const [textFieldValue, setTextFieldValue] = React.useState("");
	const [textFieldOneValue, setTextFieldOneValue] = React.useState("");

	useEffect(() => {
		prepareNotificationAppList()

		if (notifications === undefined || notifications === null || notifications.length === 0) {
			getNotifications() 
		}
	}, []);

	let navigate = useNavigate();
	const classes = useStyles();


	// getting comms & cases app from app framework
	var notificationAppList = [];
	const mergeAuthData = (result, responseJson) => {
		// result is only getting: Jira AND discord.

		const updatedResult = result.map(item => {
			const matches = responseJson.filter(authItem => (authItem.app.name === item.name)
			);
			return {
				...item,
				authentication_data: matches.length > 0 ? matches : null
			};
		});
		return updatedResult;
	};

	const prepareNotificationAppList = () => {
		// getting App ID,Authentication fields and saved auths for each app
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
				const filteredApps = responseJson.filter(app => app.categories?.includes("Communication") || app.categories?.includes("Cases"));
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

								// why is auth_config appearing like this? 
								// this is not very clean.	
								item.auth_config = decodedString.authentication
								item.large_image = decodedString.large_image
								item.categories = decodedString.categories

								let newJSON = notificationAppList;


								// keeping state changes to a minimum
								if ((newJSON[item.name] === undefined) && (item?.authentication_data !== null)) {
									newJSON[item.name] = item;
									setnotificationAppsDetails(newJSON);
									console.log("notificationAppsDetails: ", newJSON)
								}
							}).then(() => {
								// removing this for now,
								// checkIfAlreadyGenerated(filteredApps, workflows);

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


	const executeTestWorkflow = async (workflowid) => {
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

	useEffect(() => {
		console.log("Apps: ", notificationAppsDetails);
	}, [notificationAppsDetails])

	const generateCommsNotificationWorkflow = async (app, sender, recepient) => {
		var appname = app.name
		var appImage = app.large_image

		//currently only supports  figure out a way to support more apps
		var workflowName = `[GENERATED] ${appname} notification workflow`
		var workflowDescription = "Generated by Shuffle for sending info/error notifications."
		var data = {
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
			}).then((responseJson) => {
				toast("Trying to create notification workflow..")
				if (responseJson !== undefined) {
					console.log("Notification workflow created successfully")

					var commsParameter = [
						{
							"key": "recipient",
							"value": recepient
						},
						{
							"key": "sender",
							"value": sender
						},
						{
							"key": "subject",
							"value": "$exec.title"
						},
						{
							"key": "body",
							"value": "$exec.description"
						}
					]

					if (app.name.toLowerCase() === "gmail") {
						// this is a special case and we know it
						commsParameter = `[
{
"key": "content",
"value": {% python %}
import base64

# Set your email variables
sender = "${sender}"
recipient = "${recepient}"
subject = "$exec.title"
body = "$exec.description"

raw_email = f"""FROM: {sender}\\nTO: {recipient}\\nsubject: {subject}\\n{body}"""

# Encode for Gmail API
encoded = base64.urlsafe_b64encode(raw_email.encode()).decode()

print('"' + encoded + '"')
{% endpython %}, 
},
{
"key": "userId",
"value": "me"
}]`
					}

					var workflow_id = responseJson.id;


					var commsAction = {
						"app_name": "Singul",
						"app_version": "1.0.0",
						"description": "Available actions for communication",
						"app_id": "integration",
						"errors": [],
						"is_valid": true,
						"isStartNode": true,
						"label": "Send Notification Message",
						"public": false,
						"generated": false,
						"large_image": app.large_image,
						"environment": "Cloud",
						"name": "Communication",
						"parameters": [
							{
								"description": "",
								"id": "",
								"name": "action",
								"example": "",
								"value": "send_message",
								"multiline": false,
								"multiselect": false,
								"options": [
									"list_messages",
									"get_message",
									"send_message",
									"search_messages",
									"list_attachments",
									"get_attachment",
									"create_contact",
									"get_contact"
								],
								"action_field": "",
								"variant": "",
								"required": true,
								"configuration": false,
								"tags": null,
								"schema": {
									"type": ""
								},
								"skip_multicheck": false,
								"value_replace": null,
								"unique_toggled": false,
								"error": "",
								"hidden": false
							},
							{
								"description": "",
								"id": "",
								"name": "fields",
								"example": "",
								"value": `${commsParameter}`,
								"multiline": true,
								"multiselect": false,
								"options": null,
								"action_field": "",
								"variant": "",
								"required": false,
								"configuration": false,
								"tags": null,
								"schema": {
									"type": ""
								},
								"skip_multicheck": false,
								"value_replace": null,
								"unique_toggled": false,
								"error": "",
								"hidden": false
							},
							{
								"description": "",
								"id": "",
								"name": "app_name",
								"example": "",
								"value": app.name,
								"multiline": false,
								"multiselect": false,
								"options": null,
								"action_field": "",
								"variant": "",
								"required": false,
								"configuration": false,
								"tags": null,
								"schema": {
									"type": ""
								},
								"skip_multicheck": false,
								"value_replace": null,
								"unique_toggled": false,
								"error": "",
								"hidden": false
							}
						],
						"execution_variable": {
							"description": "",
							"id": "",
							"name": "",
							"value": ""
						},
						"position": {
							"x": 67.96428571428578,
							"y": 263.14385714285714
						},
						"authentication_id": "",
						"category": "",
						"reference_url": "",
						"sub_action": false,
						"run_magic_output": false,
						"run_magic_input": false,
						"execution_delay": 0,
						"category_label": null,
						"suggestion": false,
						"parent_controlled": false,
						"source_workflow": "",
						"source_execution": ""
					}

					console.log("updating workflow for email")
					var workflowBody = {
						"name": workflowName,
						"Description": workflowDescription,
						"id": workflow_id,
						"actions": [
							commsAction,
						]
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
						}).then((responseJson) => {
							if (responseJson !== undefined) {
								toast("Saving as notification workflow now..")
								handleEditOrg(
									selectedOrganization.name,
									selectedOrganization.description,
									selectedOrganization.id,
									selectedOrganization.image,
									{
										documentation_reference: selectedOrganization?.defaults?.documentation_reference,
										workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
										workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
										workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
										workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
										newsletter: selectedOrganization?.defaults?.newsletter,
										weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
										notification_workflow: workflow_id,
									},
									{
										sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
										sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
										client_id: selectedOrganization?.sso_config?.client_id,
										client_secret: selectedOrganization?.sso_config?.client_secret,
										openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
										openid_token: selectedOrganization?.sso_config?.openid_token,
										SSORequired: selectedOrganization?.sso_config?.SSORequired,
										auto_provision: selectedOrganization?.sso_config?.auto_provision,
									}
								)

								console.log("Notification workflow updated successfully")
								toast("Notification workflow updated successfully")
							}
						})
				}
			}).catch((error) => {
				console.log("Error setting workflows: " + error);
			})
	}

	const generateCasesNotificationWorkflow = async (app, projectId) => {
		var appname = app.name
		var appImage = app.large_image

		//currently only supports  figure out a way to support more apps
		var workflowName = `[GENERATED] ${appname} notification workflow`
		var workflowDescription = "Generated by Shuffle for sending info/error notifications."
		var data = {
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
			}).then((responseJson) => {
				toast("Trying to create notification workflow..")
				if (responseJson !== undefined) {
					console.log("Notification workflow created successfully")

					var ticketParameter = [
						{
							"key": "project",
							"value": projectId,
						},
						{
							"key": "content",
							"value": "$exec.title"
						},
						{
							"key": "title",
							"value": "$exec.description"
						}
					]

					// fields = fields.concat(otherFields)

					var workflow_id = responseJson.id;

					var commsAction = {
						"app_name": "Singul",
						"app_version": "1.0.0",
						"description": "Available actions for case management",
						"app_id": "integration",
						"errors": [

						],
						"is_valid": true,
						"isStartNode": true,
						"label": "create_case_from_notification",
						"public": false,
						"generated": false,
						"large_image": app.large_image,
						"environment": "Cloud",
						"name": "Cases",
						"parameters": [
							{
								"description": "",
								"id": "",
								"name": "action",
								"example": "",
								"value": "create_ticket",
								"multiline": false,
								"multiselect": false,
								"options": [
									"list_tickets",
									"get_ticket",
									"create_ticket",
									"close_ticket",
									"add_comment",
									"update_ticket",
									"search_tickets"
								],
								"action_field": "",
								"variant": "",
								"required": true,
								"configuration": false,
								"tags": null,
								"schema": {
									"type": ""
								},
								"skip_multicheck": false,
								"value_replace": null,
								"unique_toggled": false,
								"error": "",
								"hidden": false
							},
							{
								"description": "",
								"id": "",
								"name": "fields",
								"example": "",
								"value": ticketParameter,
								"multiline": true,
								"multiselect": false,
								"options": null,
								"action_field": "",
								"variant": "",
								"required": false,
								"configuration": false,
								"tags": null,
								"schema": {
									"type": ""
								},
								"skip_multicheck": false,
								"value_replace": null,
								"unique_toggled": false,
								"error": "",
								"hidden": false
							},
							{
								"description": "",
								"id": "",
								"name": "app_name",
								"example": "",
								"value": app.name,
								"multiline": false,
								"multiselect": false,
								"options": null,
								"action_field": "",
								"variant": "",
								"required": false,
								"configuration": false,
								"tags": null,
								"schema": {
									"type": ""
								},
								"skip_multicheck": false,
								"value_replace": null,
								"unique_toggled": false,
								"error": "",
								"hidden": false
							}
						],
						"execution_variable": {
							"description": "",
							"id": "",
							"name": "",
							"value": ""
						},
						"position": {
							"x": -111.59751960534861,
							"y": 180.34429863506278
						},
						"authentication_id": "",
						"category": "",
						"reference_url": "",
						"sub_action": false,
						"run_magic_output": false,
						"run_magic_input": false,
						"execution_delay": 0,
						"category_label": null,
						"suggestion": false,
						"parent_controlled": false,
						"source_workflow": "",
						"source_execution": ""
					}

					console.log("updating workflow for email")
					var workflowBody = {
						"name": workflowName,
						"Description": workflowDescription,
						"id": workflow_id,
						"actions": [
							commsAction,
						]
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
						}).then((responseJson) => {
							if (responseJson !== undefined) {
								handleEditOrg(
									selectedOrganization.name,
									selectedOrganization.description,
									selectedOrganization.id,
									selectedOrganization.image,
									{
										documentation_reference: selectedOrganization?.defaults?.documentation_reference,
										workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
										workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
										workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
										workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
										newsletter: selectedOrganization?.defaults?.newsletter,
										weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
										notification_workflow: workflow_id,
									},
									{
										sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
										sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
										client_id: selectedOrganization?.sso_config?.client_id,
										client_secret: selectedOrganization?.sso_config?.client_secret,
										openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
										openid_token: selectedOrganization?.sso_config?.openid_token,
										SSORequired: selectedOrganization?.sso_config?.SSORequired,
										auto_provision: selectedOrganization?.sso_config?.auto_provision,
									}
								)

								console.log("Notification workflow updated successfully")
								toast("Notification workflow updated successfully")
							}
						})
				}
			}).catch((error) => {
				console.log("Error setting workflows: " + error);
			})
	}

	const testWorkflowModal = notificationWorkflowTestModal ?
		(<Dialog
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
		</Dialog>) : null

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
						{`Configure ${selectedAppDetails?.name?.replaceAll("_", " ")} workflow`}
					</div>
				</DialogTitle>
				<DialogContent style={{ color: "rgba(255,255,255,0.65)", overflowY: 'auto', maxHeight: '450px' }}>
					<Divider style={{ marginBottom: '1em', backgroundColor: 'rgba(255,255,255,0.12)' }} />
					{console.log("len Selected app details: ", selectedAppDetails)}

					{(selectedAppDetails.authentication_data || (selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false) || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false)) ?
						<>
							<Box mb={2}>
								{true || (selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false)) ? "No authentication required" :
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
												disabled={(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false))}
												onChange={(event) => {
													setSelectedAuth(event.target.value)
													console.log("event.target.value: ", event.target.value)
													console.log("Selected auth: ", selectedAuth)
												}}
												label="Available authentications"
												required={true}
											>
												{(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false)) ? "No authentication required" : selectedAppDetails.authentication_data.map((option) => (
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
									placeholder={selectedAppDetails.categories?.includes("Cases") ? "Project key" : "Sender"}
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
									placeholder={selectedAppDetails.categories?.includes("Cases") ? "Issue type" : "Recepient"}
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
								selectedApp={{ ...selectedAppDetails, authentication: selectedAppDetails.auth_config }}
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
						onClick={async () => {
							// var workflowUpdate = await setTeamsWorkflow(webhookInputValue)
							console.log("Selectedappdetails: ", selectedAppDetails)
							selectedAppDetails.categories?.includes("Cases") ? generateCasesNotificationWorkflow(selectedAppDetails, textFieldValue)
								: generateCommsNotificationWorkflow(selectedAppDetails, textFieldOneValue, textFieldValue)
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


	const checkIfAlreadyGenerated = async (appList, workflows) => { // fixxxxxxxxxxxxxxxxxxxxx	

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
					setGeneatedWorkflow({ "app_name": parts[1] })
				}
			}
		}
		else {
			return
		}
	}

	const renderChips = useCallback(() => {
		const appList = Object.values(notificationAppsDetails);

		return (
			<Stack spacing={2}>
				<Stack direction="row" spacing={1}>

					{appList.map((app) => (
						<Chip
							key={app.id}
							label={app?.name.replaceAll("_", " ")}
							variant={generatedWorkflow.app_name === app.name ? "filled" : "outlined"}
							disabled={generatedWorkflow.app_name === app.name ? true : false}
							onClick={() => {
								console.log(`Clicked ${app.name}`)
								console.log("app: ", app)
								setSelectedAppDetails(app)
								if (app.authentication_data && app.authentication_data.length > 0) { //fixxxxxxxx
									console.log("authdata: ", app.authentication_data[0])
									setSelectedAuth(app.authentication_data[app.authentication_data.length - 1].id)
								}
								setNotificationWorkflowModal(true)
								// getAppAuth(app.name)
								console.log("selectedAppDEtails", selectedAppDetails)
							}}
							avatar={<img src={app.large_image} alt={app.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />}
						/>
					))}

				</Stack>

				<Box sx={{
					mt: 2,
					p: 2,
					backgroundColor: theme.palette.textFieldStyle.backgroundColor,
					borderRadius: 1,
					border: "1px solid black",
				}}>
					<Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<InfoIcon fontSize="small" color="primary" />
						Want access to more templates?
						<Link
							to="/admin?tab=app_auth"
							style={{
								color: theme.palette.linkColor,
								textDecoration: 'none',
								fontWeight: 500,
							}}
						>
							Set up app authentication
						</Link>
						to show additional workflow options.
					</Typography>
				</Box>
			</Stack>
		);
	}, [notificationAppsDetails])

	useEffect(() => {
		getFramework()

		// Check "workflow" and "execution_id" in URL
		const urlParams = new URLSearchParams(window.location.search)
		const workflow = urlParams.get("workflow")
		const execution_id = urlParams.get("execution_id")
		const kms = urlParams.get("kms")

		if (kms !== null && kms !== undefined && kms.length > 0 && kms === "true") {
			toast.info("KMS-related notifications are highlighted.")
			setHighlightKMS(true)
		}

		if (execution_id !== null) {
			setSelectedExecutionId(execution_id)

			//toast.info("Execution-related notifications are highlighted.")
		}

		if (workflow !== null) {
			setSelectedWorkflow(workflow)

			toast.info("Workflow-related notifications are highlighted.")
		}
	}, [])

	useEffect(() => {
		if (selectedOrganization === undefined || selectedOrganization === null || selectedOrganization?.id === undefined || selectedOrganization?.id === null || selectedOrganization?.id.length === 0) {
			return
		}

		if (workflows?.length === 0) {
			getAvailableWorkflows()
		}

		if (notificationWorkflow !== selectedOrganization?.defaults?.notification_workflow) {
			setNotificationWorkflow(selectedOrganization?.defaults?.notification_workflow)
		}
	}, [selectedOrganization])

	if (userdata === undefined || userdata === null) {
		return
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
					setAppFramework({})
					if (responseJson.reason !== undefined) {
						//toast("Failed loading: " + responseJson.reason)
					} else {
						//toast("Failed to load framework for your org.")
					}
				} else {
					setAppFramework(responseJson)
				}
			})
			.catch((error) => {
				console.log("err in framework: ", error.toString());
			})
	}

	const getNotifications = () => {
		fetch(`${globalUrl}/api/v1/notifications`, {
			credentials: "include",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
		.then(function (response) {
			if (response.status !== 200) {
				console.log("Error in response");
			}

			return response.json();
		})
		.then(function (responseJson) {
			if (responseJson?.success !== false && responseJson?.notifications !== undefined && responseJson?.notifications !== null) { 
				setNotifications(responseJson.notifications || [])
			} else {
				toast("Failed loading notifications. Please try again later.");
			}
		})
		.catch((error) => {
			console.log("error in notification loading: ", error);
		});
	
	}

	const clearNotifications = () => {
		// Don't really care about the logout

		toast.info("Marking all notifications as read. This may take a while.")
		fetch(`${globalUrl}/api/v1/notifications/clear`, {
			credentials: "include",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then(function (response) {
				if (response.status !== 200) {
					console.log("Error in response");
				}

				return response.json();
			})
			.then(function (responseJson) {
				if (responseJson.success === true) {
					// Reload the UI
					const newNotifications = notifications.map((notification) => {
						notification.read = true
						return notification
					})

					setNotifications(newNotifications)
					setShowRead(true)
				} else {
					toast("Failed dismissing notifications. Please try again later.");
				}
			})
			.catch((error) => {
				console.log("error in notification dismissal: ", error);
				//removeCookie("session_token", {path: "/"})
			});
	};

	const dismissNotification = (alert_id, disabled) => {
		var notificationurl = `${globalUrl}/api/v1/notifications/${alert_id}/markasread`
		if (disabled === true) {
			notificationurl += "?disabled=true"
		} else if (disabled === false) {
			notificationurl += "?disabled=false"
		}

		fetch(notificationurl, {
			credentials: "include",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then(function (response) {
				if (response.status !== 200) {
					console.log("Error in response");
				}

				return response.json();
			})
			.then(function (responseJson) {
				if (responseJson.success === true) {
					// Mark current one as read
					var newNotifications = notifications.map((notification) => {
						if (notification.id === alert_id) {
							notification.read = true
						}

						return notification
					})


					if (disabled === true) {
						toast("Notification disabled, and will not be shown again.")

						newNotifications = newNotifications.map((notification) => {
							if (notification.id === alert_id) {
								notification.ignored = true
							}

							return notification
						})

						console.log("NEW NOTIFICATIONS: ", newNotifications);
					} else if (disabled === false) {
						toast("Notification re-enabled successfully")

						newNotifications = newNotifications.map((notification) => {
							if (notification.id === alert_id) {
								notification.ignored = false
							}

							return notification
						})

					} else {
						toast("Notification dismissed successfully")
					}

					//const newNotifications = notifications.filter(
					//	(data) => data.id !== alert_id
					//)

					//console.log("NEW NOTIFICATIONS: ", newNotifications);

					if (setNotifications !== undefined && newNotifications !== undefined) {
						setNotifications(newNotifications)
					}
				} else {
					toast("Failed dismissing notification. Please try again later.");
				}
			})
			.catch((error) => {
				console.log("error in notification dismissal: ", error);
				//removeCookie("session_token", {path: "/"})
			})
	}


	const notificationWidth = "100%"
	const imagesize = 22
	const boxColor = "#86c142"


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
					console.log("Status not 200 for workflows :O!");
					return;
				}
				return response.json();
			})
			.then((responseJson) => {
				if (responseJson !== undefined) {

					// Add parent notification workflow	if it's a child org
					// selectedOrganization,
					if (selectedOrganization.creator_org !== undefined && selectedOrganization.creator_org !== null && selectedOrganization.creator_org.length > 0) {

						// Add to start of the list
						responseJson.unshift({
							"name": "Parent-Org's Notification Workflow",
							"id": "parent",
						})
					}

					setWorkflows(responseJson)

					if (selectedOrganization.defaults !== undefined && selectedOrganization.defaults.notification_workflow !== undefined) {

						const workflow = responseJson.find((workflow) => workflow.id === selectedOrganization.defaults.notification_workflow)
						if (workflow !== undefined && workflow !== null) {
							setWorkflow(workflow)
						}
					}
				}
			})
			.catch((error) => {
				console.log("Error getting workflows: " + error);
			})
	}

	const handleWorkflowSelectionUpdate = (e, isUserinput) => {
		if (e.target.value === undefined || e.target.value === null || e.target.value.id === undefined) {
			console.log("Returning as there's no id")
			return null
		}
		setOpenNotification(false)
		setWorkflow(e.target.value)
		setNotificationWorkflow(e.target.value.id)
		handleEditOrg(
			selectedOrganization?.name,
			selectedOrganization.description,
			selectedOrganization.id,
			selectedOrganization.image,
			{
				app_download_repo: selectedOrganization?.defaults?.app_download_repo,
				app_download_branch: selectedOrganization?.defaults?.app_download_branch,
				workflow_download_repo: selectedOrganization?.defaults?.workflow_download_repo,
				workflow_download_branch: selectedOrganization?.defaults?.workflow_download_branch,
				notification_workflow: e.target.value.id,
				documentation_reference: selectedOrganization?.defaults?.documentation_reference,
				workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
				workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
				workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
				workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
				newsletter: selectedOrganization?.defaults?.newsletter,
				weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
			},
			{
				sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
				sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
				client_id: selectedOrganization?.sso_config?.client_id,
				client_secret: selectedOrganization?.sso_config?.client_secret,
				openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
				openid_token: selectedOrganization?.sso_config?.openid_token,
				SSORequired: selectedOrganization?.sso_config?.SSORequired,
				auto_provision: selectedOrganization?.sso_config?.auto_provision,
			}
		)
	}

	return (
		<div style={{ width: "100%", height: "100%", boxSizing: 'border-box', transition: 'width 0.3s ease', padding: clickedFromOrgTab ? "27px 10px 19px 27px" : null, height: clickedFromOrgTab ? "auto" : null, minHeight: 843, backgroundColor: clickedFromOrgTab ? theme.palette.platformColor : null, borderRadius: clickedFromOrgTab ? '16px' : null, }}>
			<div style={{ maxHeight: 1700, overflowY: "auto", width: '100%', scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin' }}>
				<div style={{ maxWidth: "calc(100% - 20px)" }}>
					<Typography variant="h5" style={{ fontSize: 24, fontWeight: 500, textAlign: "left" }}>
						Notification Workflow
					</Typography>
					<Typography color="textSecondary" style={{ fontSize: 16, fontWeight: 400, marginTop: 5, }}>
						The notification workflow triggers when an error occurs in one of your workflows. Each individual one will only start a workflow once every 2 minutes. <b>You can point child org notifications into the parent org notification by choosing it in the list.</b>
					</Typography>

					{modalView}
					{/*{testWorkflowModal} */}
					<div style={{ marginBottom: '10px', marginTop: 20, }}>
						{renderChips()}
					</div>

					<div style={{ display: "flex", flexDirection: "row", alignItems: "center", }}>

						{workflows !== undefined && workflows !== null && workflows.length > 0 ?
							<Autocomplete
								id="notification_workflow_search"
								autoHighlight
								open={openNotification}
								onOpen={() => {
									setOpenNotification(true);
								}}
								onClose={() => {
									setOpenNotification(false);
								}}
								freeSolo
								//autoSelect
								value={workflows?.find(w => w.id === notificationWorkflow) || null}
								classes={{ inputRoot: classes.inputRoot }}
								ListboxProps={{
									style: {
										backgroundColor: theme.palette.surfaceColor,
										color: theme.palette.text.primary,
										borderRadius: theme.palette.borderRadius,
									},
								}}
								getOptionLabel={(option) => {
									if (
										option === undefined ||
										option === null ||
										option.name === undefined ||
										option.name === null
									) {
										return "No Workflow Selected";
									}

									const newname = (
										option.name.charAt(0).toUpperCase() + option.name.substring(1)
									).replaceAll("_", " ");
									return newname;
								}}
								options={workflows}
								fullWidth
								style={{
									backgroundColor: theme.palette.textFieldStyle.backgroundColor,
									borderRadius: theme.palette.textFieldStyle.borderRadius,
									color: theme.palette.textFieldStyle.color,
									height: 35,
									marginBottom: 40,
								}}
								onChange={(event, newValue) => {
									console.log("Found value: ", newValue)

									var parsedinput = { target: { value: newValue } }

									// For variables
									if (typeof newValue === 'string' && newValue.startsWith("$")) {
										parsedinput = {
											target: {
												value: {
													"name": newValue,
													"id": newValue,
													"actions": [],
													"triggers": [],
												}
											}
										}
									}

									handleWorkflowSelectionUpdate(parsedinput)
								}}
								renderOption={(props, data, state) => {
									if (data.id === workflow.id) {
										data = workflow;
									}

									return (
										<Tooltip arrow placement="right" title={
											<span style={{}}>
												{data.image !== undefined && data.image !== null && data.image.length > 0 ?
													<img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette?.borderRadius, }} />
													: null}
												<Typography>
													Choose {data.name}
												</Typography>
											</span>
										} placement="bottom">
											<MenuItem
												{...props}
												style={{
													backgroundColor: theme.palette.surfaceColor,
													color: data.id === workflow.id ? "red" : theme.palette.text.primary,
													borderBottom: data.id === "parent" ? "2px solid rgba(255,255,255,0.5)" : null
												}}
												value={data}
												onClick={(e) => {
													props.onMouseDown?.(null);
													var parsedinput = { target: { value: data } }
													handleWorkflowSelectionUpdate(parsedinput)
												}}
											>
												{data.name}
											</MenuItem>
										</Tooltip>
									)
								}}
								renderInput={(params) => {
									return (
										<TextField
											{...params}
											style={{
												backgroundColor: theme.palette.textFieldStyle.backgroundColor,
												color: theme.palette.textFieldStyle.color,
												borderRadius: theme.palette.textFieldStyle.borderRadius,
												height: 35,
												fontSize: 16,
												marginTop: "16px"
											}}
											InputProps={{
												...params.InputProps,
												style: {
													height: 35,
													display: "flex",
													alignItems: "center",
													padding: "0px 8px",
													fontSize: 16,
													borderRadius: 4,
												},
												inputProps: {
													...params.inputProps,
													style: {
														height: "100%",
														boxSizing: "border-box",
													}

												}
											}}
											// label="Find a notification workflow"
											variant="outlined"
											placeholder="Select a notification workflow"
										/>
									);
								}}
							/>
							:
							<TextField
								required
								InputProps={{
									style: {
										height: 35,
										display: "flex",
										alignItems: "center",
										padding: "0px 8px",
										fontSize: 16,
										borderRadius: 4,
									},
									inputProps: {
										style: {
											height: "100%",
											boxSizing: "border-box",
										}

									}
								}}
								style={{
									backgroundColor: theme.palette.textFieldStyle.backgroundColor,
									color: theme.palette.textFieldStyle.color,
									borderRadius: 4,
									height: 35,
									fontSize: 16,
									marginBottom: 30
								}}
								fullWidth={true}
								type="name"
								id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder="ID of the workflow to receive notifications"
								value={notificationWorkflow}
								onChange={(e) => {
									setNotificationWorkflow(e.target.value);
								}}
							/>
						}
						{/* <div style={{ minWidth: 150, maxWidth: 150, marginTop: 5, marginLeft: 10, }}>
				{orgSaveButton}
			</div> */}
					</div>

					{notificationWorkflow === undefined || notificationWorkflow === null || notificationWorkflow.length === 0 ? null :
						<div>
							<Button disableElevation variant="outlined" color="secondary" style={{ marginTop: 5, textTransform: "none", }} onClick={() => {
								if (notificationWorkflow === "parent") {
									toast.error("Can't send test notifications to the parent org's notification workflow.")
									return
								}

								fetch(`${globalUrl}/api/v1/workflows/${notificationWorkflow}/execute`, {
									method: "POST",
									headers: {
										"Content-Type": "application/json",
										"Accept": "application/json",
									},
									credentials: "include",
									body: JSON.stringify({
										"title": "Test Notification",
										"description": "This is a test notification to check if the notification workflow is working correctly.",
										"org_id": selectedOrganization.id,
										"id": uuidv4(),
										"reference_url": "/admin?type=test&admin_tab=notifications",
										"created_at": Math.floor(new Date().getTime() / 1000),
										"updated_at": Math.floor(new Date().getTime() / 1000),
									})
								})
									.then((response) => {
										if (response.status === 200) {
											toast.success("Test notification sent successfully.")
										} else {
											toast.error("Failed to send test notification. Please contact support if this persists")
										}
									}).catch((error) => {
										toast.error("Failed to send test notification (2). Please contact support if this persists")
									})
							}}>
								Send test notification
							</Button>
							<IconButton
								style={{ marginLeft: 10, }}
								onClick={() => {
									if (notificationWorkflow === "parent") {
										toast.error("Can't open parent org's notification workflow from here.")
										return
									}

									window.open(`/workflows/${notificationWorkflow}?view=executions`, "_blank")
								}}
							>
								<OpenInNewIcon color="primary" />
							</IconButton>
						</div>
					}

					<Typography variant="h5" style={{ marginTop: 50, fontSize: 24, display: clickedFromOrgTab ? null : "inline", marginBottom: clickedFromOrgTab ? 8 : null, }}>Notifications ({
						notifications?.filter((notification) => showRead === true || notification.read === false).length
					})</Typography>

					<Typography variant="body2" color="textSecondary" style={{ fontSize: 16, marginLeft: clickedFromOrgTab ? null : 25, color: clickedFromOrgTab ? "#9E9E9E" : null, }}>
						Notifications help you find potential problems with your workflows and apps.&nbsp;
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="/docs/organizations#notifications"
							style={{ textDecoration: clickedFromOrgTab ? null : "none", color: theme.palette.linkColor }}
						>
							Learn more
						</a>
					</Typography>
					<div />
					<div style={{ display: "flex", marginTop: 10, marginBottom: 10, }}>
						<Switch
							checked={showRead}
							onChange={() => {
								setShowRead(!showRead);
							}}
						/><Typography style={{ marginTop: 5, }}>&nbsp; Show read </Typography>
						{notifications !== undefined && notifications !== null && notifications.length > 1 ? (
							<Button
								color="primary"
								variant="outlined"
								disabled={notifications.filter((data) => !data.read).length === 0}
								onClick={() => {
									clearNotifications()
								}}
								style={{ marginLeft: 50, textTransform: "none", fontSize: 16 }}
							>
								Mark all as read
							</Button>
						) : null}
					</div>

					<NotificationComponent notifications={notifications} showRead={showRead} selectedExecutionId={selectedExecutionId} selectedWorkflow={selectedWorkflow} highlightKMS={highlightKMS} userdata={userdata} imagesize={imagesize} boxColor={boxColor} clickedFromOrgTab={clickedFromOrgTab} notificationWidth={notificationWidth} dismissNotification={dismissNotification} />

					{clickedFromOrgTab ? null : <Divider style={{ marginTop: 50, marginBottom: 50, }} />}

					<Typography variant="h5" style={{ display: clickedFromOrgTab ? null : "inline", marginBottom: clickedFromOrgTab ? 8 : null, marginTop: clickedFromOrgTab ? 60 : null, }}>Suggestions</Typography>
					<Typography variant="body2" color="texSecondary" style={{ fontSize: 16, marginLeft: clickedFromOrgTab ? null : 25, }}>
						Suggestions are tasks identified by Shuffle to help you discover ways to protect your and customers' company. <br />These range from simple configurations in Shuffle to Usecases you may have missed.&nbsp;
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="/docs/organizations#priorities"
							style={{ textDecoration: clickedFromOrgTab ? null : "none", color: clickedFromOrgTab ? theme.palette.linkColor : "#f85a3e" }}
						>
							Learn more
						</a>
					</Typography>
					<div style={{ marginTop: 10, }} />
					<Switch
						checked={showDismissed}
						onChange={() => {
							setShowDismissed(!showDismissed);
						}}
					/>&nbsp; Show dismissed
					{userdata.priorities === null || userdata.priorities === undefined || userdata.priorities.length === 0 ?
						<Typography variant="h4">
							No Suggestions found
						</Typography>
						:
						userdata.priorities.map((priority, index) => {
							if (showDismissed === false && priority.active === false) {
								return null
							}

							return (
								<Priority
									key={index}
									globalUrl={globalUrl}
									priority={priority}
									checkLogin={checkLogin}
									clickedFromOrgTab={true}
									setAdminTab={setAdminTab}
									setCurTab={setCurTab}
									appFramework={appFramework}
								/>
							)
						})
					}
				</div>
			</div>
		</div>
	)
})

export default Priorities;


const NotificationItem = memo((props) => {
	const { data, selectedExecutionId, selectedWorkflow, highlightKMS, userdata, imagesize, boxColor, clickedFromOrgTab, notificationWidth, dismissNotification } = props

	var image = "";
	var orgName = "";
	var orgId = "";
	const { themeMode, brandColor } = useContext(Context);
	const theme = getTheme(themeMode, brandColor);

	var highlighted = selectedExecutionId === "" && selectedWorkflow === "" ? false : data.reference_url === undefined || data.reference_url === null || data.reference_url.length === 0 ? false : data.reference_url.includes(selectedExecutionId) || data.reference_url.includes(selectedWorkflow)

	if (!highlighted && highlightKMS) {
		if (data.title !== undefined && data.title !== null && data.title.toLowerCase().includes("kms")) {
			highlighted = true
		} else if (data.description !== undefined && data.description !== null && data.description.toLowerCase().includes("kms")) {
			highlighted = true
		}

	}

	if (userdata.orgs !== undefined) {
		const foundOrg = userdata.orgs.find((org) => org.id === data["org_id"]);
		if (foundOrg !== undefined && foundOrg !== null) {
			//position: "absolute", bottom: 5, right: -5,
			const imageStyle = {
				width: imagesize,
				height: imagesize,
				pointerEvents: "none",
				marginLeft:
					data.creator_org !== undefined && data.creator_org.length > 0
						? 20
						: 0,
				borderRadius: 10,
				border:
					foundOrg.id === userdata.active_org.id
						? `3px solid ${boxColor}`
						: null,
				cursor: "pointer",
				marginRight: 10,
			};

			image =
				foundOrg.image === "" ? (
					<img
						alt={foundOrg.name}
						src={theme.palette.defaultImage}
						style={imageStyle}
					/>
				) : (
					<img
						alt={foundOrg.name}
						src={foundOrg.image}
						style={imageStyle}
						onClick={() => { }}
					/>
				);

			orgName = foundOrg.name;
			orgId = foundOrg.id;
		}
	}

	return (
		<Box
			style={{
				backgroundColor: theme.palette.cardBackgroundColor,
				width: clickedFromOrgTab ? null : notificationWidth,
				padding: 30,
				borderBottom: theme.palette.defaultBorder,
				marginBottom: 20,
				border: highlighted ? "2px solid #f85a3e" : null,
				borderRadius: theme.palette?.borderRadius,
			}}
			sx={{
				"&:hover": {
					backgroundColor: theme.palette.cardHoverColor,
				},
			}}
		>
			<div style={{ display: "flex", }}>
				{data.amount === 1 && data.read === false ?
					<Chip
						label={"First seen"}
						variant="contained"
						color="primary"
						style={{ marginRight: 15, height: 25, }}
					/>
					: null}
				{data.ignored === true ?
					<Chip
						label={"Disabled"}
						variant="outlined"
						color="primary"
						style={{ marginRight: 15, height: 25, }}
					/>
					: null}
				{data.read === false ?
					<Chip
						label={"Unread"}
						style={{ marginRight: 15, height: 25, }}
					/>
					:
					<Chip
						label={"Read"}
						variant="outlined"
						color="secondary"
						style={{ marginRight: 15, height: 25, }}
					/>
				}
				<Typography variant="body1" color="textPrimary" style={{ wordWrap: "break-word", overflow: "hidden", textOverflow: "ellipsis" }}>
					{data.title}
				</Typography >
			</div>

			{data.image !== undefined && data.image !== null && data.image.length > 0 ?
				<img alt={data.title} src={data.image} style={{ height: 100, width: 100, }} />
				:
				null
			}
			<Typography variant="body2" color="textSecondary" style={{ marginTop: 10, maxHeight: 200, overflowX: "hidden", overflowY: "auto", wordWrap: "break-word", fontSize: 16 }}>
				{data.description}
			</Typography >
			<div style={{ display: "flex" }}>
				<ButtonGroup style={{ marginTop: 15, minHeight: 50, maxHeight: 50, }}>
					<Button
						variant="outlined"
						color="primary"
						style={{
							textTransform: "none",
							opacity: data.reference_url ? 1 : 0.5,
							cursor: data.reference_url ? "pointer" : "not-allowed",
						}}
						disabled={
							!data.reference_url || data.reference_url.length === 0
						}
						onClick={() => {
							window.open(data.reference_url, "_blank");
						}}
					>
						Explore
					</Button>

					{data.read === false ? (
						<Button
							variant="outlined"
							color="secondary"
							style={{
								height: 50,
								textTransform: "none",
							}}
							onClick={() => {
								dismissNotification(data.id);
							}}
						>
							Mark as Read
						</Button>
					) : null}

					<Tooltip
						title="Disabling a notification makes it so similar notifications to this one will NOT be re-opened. It will NOT forward notifications to your notification workflow, but WILL still keep counting."
						placement="top"
					>
						<Button
							variant="outlined"
							color="secondary"
							style={{
								textTransform: "none",
								opacity: data.ignored || data.dismissable ? 1 : 0.5,
								cursor: data.dismissable ? "pointer" : "not-allowed",
							}}
							disabled={!data.dismissable}
							onClick={() => {
								if (data.ignored) {
									dismissNotification(data.id, false);
								} else {
									dismissNotification(data.id, true);
								}
							}}
						>
							{data.ignored ? "Re-enable" : "Disable"}
						</Button>
					</Tooltip>
				</ButtonGroup>

				<Typography
					variant="body2"
					color="textSecondary"
					style={{
						marginLeft: 20,
						marginTop: 20,
						wordWrap: "break-word",
						overflow: "hidden",
						textOverflow: "ellipsis",
						fontSize: 16,

					}}
				>
					<b>First seen</b>:{" "}
					{new Date(data.created_at * 1000).toISOString().slice(0, 19)}
				</Typography>

				<Typography
					variant="body2"
					color="textSecondary"
					style={{
						marginLeft: 20,
						marginTop: 20,
						wordWrap: "break-word",
						overflow: "hidden",
						textOverflow: "ellipsis",
						fontSize: 16,
					}}
				>
					<b>Last seen</b>:{" "}
					{new Date(data.updated_at * 1000).toISOString().slice(0, 19)}
				</Typography>

				<Typography
					variant="body2"
					color="textSecondary"
					style={{
						marginLeft: 20,
						marginTop: 20,
						wordWrap: "break-word",
						overflow: "hidden",
						textOverflow: "ellipsis",
						fontSize: 16,
					}}
				>
					<b>Times seen</b>: {data.amount}
				</Typography>
			</div>

		</Box>
	);
})


const NotificationComponent = memo(({ notifications, showRead, selectedExecutionId, selectedWorkflow, highlightKMS, userdata, imagesize, boxColor, clickedFromOrgTab, notificationWidth, dismissNotification }) => {

	return (
		<div>
			{notifications === null || notifications === undefined || notifications?.length === 0 ? (
				null
			) :
				<div>
					{notifications?.map((notification, index) => {
						if (showRead === false && notification.read === true) {
							return null
						}

						return (
							<NotificationItem data={notification} key={index} selectedExecutionId={selectedExecutionId} selectedWorkflow={selectedWorkflow} highlightKMS={highlightKMS} userdata={userdata} imagesize={imagesize} boxColor={boxColor} clickedFromOrgTab={clickedFromOrgTab} notificationWidth={notificationWidth} dismissNotification={dismissNotification} />
						)
					})}
				</div>
			}
		</div>
	)
})

// const PaddingWrapper = memo(({children, clickedFromOrgTab}) => {

// 	const { leftSideBarOpenByClick } = useContext(Context)

// 	return(
// 		<div style={{width: leftSideBarOpenByClick ? 950 : 1030,transition: 'width 0.3s ease', padding: clickedFromOrgTab ? "27px 10px 19px 27px":null, height: clickedFromOrgTab ? "auto":null, minHeight: 843, backgroundColor: clickedFromOrgTab ? '#212121':null, borderRadius: clickedFromOrgTab ? '16px':null,  }}>
// 			{children}
// 		</div>
// 	)
// })

// const Wrapper = memo(({children, clickedFromOrgTab}) => {

// 	return(
// 		<PaddingWrapper clickedFromOrgTab={clickedFromOrgTab}>
// 			{children}
// 		</PaddingWrapper>
// 	)
// })
