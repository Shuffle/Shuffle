import React, { useState, useEffect } from "react";

import { toast } from "react-toastify" 
import theme from '../theme.jsx';
import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import { validateJson, GetIconInfo } from "../views/Workflows.jsx";

import { 
	Tooltip,
	Typography,
	Button,
	Divider,

	MenuItem,
	Select,
	Chip,
	TextField,
	CircularProgress,
} from "@mui/material"

import {
	CheckCircleOutline as CheckCircleOutlineIcon,
	ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material"

import {
	green,
	red,
} from "../views/AngularWorkflow.jsx"

const FixWorkflowValidationErrors = (props) => {
	const { globalUrl, workflow, setWorkflow, setUpdateParent, } = props;

	const [appsLoading, setAppsLoading] = useState(false)
	const [apps, setApps] = useState([])
	const [appAuth, setAppAuth] = useState([])
	const [_, setUpdate] = useState(0)

  	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "migration.shuffler.io";

	if (workflow === undefined || workflow === null) {
		console.error("Workflow is undefined")
		return null
	}

	if (workflow.validation === undefined || workflow.validation === null) {
		console.error("Workflow validation is undefined")
		return null
	}

	if (workflow.validation.valid === true) {
		console.error("Workflow is valid - nothing to do for errors")
		return null
	}

	if (setWorkflow === undefined || setWorkflow === null) {
		console.error("No setWorkflow")
		return null
	}

	const fetchApps = () => {
		if (appsLoading === true) {
			return
		}

		setAppsLoading(true)

		const url = `${globalUrl}/api/v1/apps`
		fetch(url,{
			method: "GET",
			credentials: "include"
		})
		.then(response => response.json())
		.then(data => {
			setAppsLoading(false)
			if (data.success === false) {
				return
			}

			setApps(data)
		})
		.catch(error => {
			setAppsLoading(false)
			console.error("Error: ", error)
		})
	}

	// Save the workflow as well
	const saveWorkflow = (workflow) => {
		if (workflow.id === undefined || workflow.id === null) {
			toast("Workflow ID is missing during save. Please try again")
			return
		}

		const url = `${globalUrl}/api/v1/workflows/${workflow.id}`
		fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify(workflow),
		})
		.then(response => response.json())
		.then(data => {
			if (data.success === false) {
				toast("Failed to save workflow")
				return
			}
		})
		.catch(error => {
			toast("Failed to save workflow: " + error.toString())
		})
	}

    const fetchAuthentication = (reset, updateAction, closeMenu, action_id) => {
		if (appsLoading === true) {
			return
		}

		const url = `${globalUrl}/api/v1/apps/authentication`
		fetch(url,{
			method: "GET",
			credentials: "include"
		})
		.then(response => response.json())
		.then(data => {
			if (data.success === false) {
				return
			}

			const authlist = data.data
			setAppAuth(authlist)
	  		if (updateAction === true) {
				console.log("Updating action: ", action_id)

				// Find the action in the workflow and set auth for it
				var foundActionIndex = -1
				for (var i = 0; i < workflow.actions.length; i++) {
					if (workflow.actions[i].id === action_id) {
						foundActionIndex = i
						break
					}
				}

				if (foundActionIndex === -1) { 
					console.error("Failed to find action in workflow")
					return
				}

				const appId = workflow.actions[foundActionIndex].app_id
				var lastauth = -1
				for (var authKey in authlist) {
					if (authlist[authKey].app_id !== appId) {
						continue
					}

					if (authlist[authKey].created > lastauth) {
						lastauth = authlist[authKey].created
					} else {
						continue
					}

					console.log("FOUND AUTH: ", authlist[authKey])
					workflow.actions[foundActionIndex].authentication_id = authlist[authKey].id
				}


				if (setWorkflow !== undefined) {
					setWorkflow(workflow)
				}
			}
		})
		.catch(error => {
			console.error("Auth loading error: ", error)
		})
	}

	if (apps !== undefined && apps !== null && apps.length === 0 && appsLoading === false) {
		fetchApps()
		fetchAuthentication() 
	}

	const setSelectedAction = (action) => {
		if (workflow === undefined || workflow === null) {
			return null
		}

		if (workflow.actions === undefined || workflow.actions === null || workflow.actions.length === 0) {
			return null
		}

		if (setWorkflow === undefined || setWorkflow === null) {
			return null
		}

		for (var i = 0; i < workflow.actions.length; i++) {
			if (workflow.actions[i].id === action.id) {
				workflow.actions[i] = action

				// Update any action with the same app_id to have same auth
				for (var j = 0; j < workflow.actions.length; j++) {
					if (workflow.actions[j].app_id === action.app_id) {
						workflow.actions[j].authentication_id = action.authentication_id
						workflow.actions[j].selectedAuthentication = action.selectedAuthentication
					}
				}

				break
			}
		}

		setWorkflow(workflow)
	}

	const ErrorItem = (props) => {
		const { apps, error, index } = props

		const [validating, setValidating] = useState(false)
		const [actionRunInfo, setActionRunInfo] = useState({})
		if (error === undefined || error === null) {
			return null
		}

		if (apps === undefined || apps === null || apps.length === 0) {
			return null
		}

		const validateApp = (app, action) => {
			if (validating) {
				return
			}

			setValidating(true)

			// FIXME: Run execution:
			// 1. Should set app authentication validation
			if (isCloud) {
				action.environment = "Cloud"
			} else {
				action.environment = "Shuffle"
			}

			/*
			setExecutionResult({
			  valid: false,
			  result: baseResult,
			})
			setExecuting(true);
			*/

			setActionRunInfo({})
			const url = `${globalUrl}/api/v1/apps/${app.id}/run?validation=true`
			fetch(url, {
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			  },
			  body: JSON.stringify(action),
			  credentials: "include",
			})
			  .then((response) => {
				if (response.status !== 200) {
				  console.log("Status not 200 for stream results :O!");
				}

				return response.json();
			  })
			  .then((responseJson) => {
				setValidating(false)
	
				setActionRunInfo(responseJson)

				//console.log("RESPONSE: ", responseJson)
				if (
				  responseJson.success === true &&
				  responseJson.result !== null &&
				  responseJson.result !== undefined &&
				  responseJson.result.length > 0
				) {
					//toast("
				}
			  })
			  .catch((error) => {
				toast("Execution error: " + error.toString());
				setValidating(false)
			  })
		}

		var authReturn = null
		var validationReturn = null
		var foundApp = {
			"name": "",
			"id": "",
		}
		var foundAction = {
			"name": "",
			"label": "",
			"id": "",
			"app_id": "",
			"app_name": "",
		}

		var selectedImage = null 
		var resolveButton = null
		if (error.app_id !== undefined && error.app_id !== null) {
			for (var i = 0; i < apps.length; i++) {
				if (apps[i].id === error.app_id) {
					foundApp = apps[i]
					break
				}
			}

			if (!foundApp) {
				toast("Couldn't find relevant app. Is it activated?")
				return "Failed to find app"
			}

			selectedImage = 
				<img 
					src={foundApp.large_image} 
					style={{
						width: 25, 
						height: 25, 
						marginRight: 10, 
						borderRadius: theme.palette?.borderRadius, 
						border: `1px solid ${theme.palette.borderColor}`,
					}} 
				/>
		}

		if (error.action_id !== undefined && error.action_id !== null && workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
			for (var i = 0; i < workflow.actions.length; i++) {
				if (workflow.actions[i].id === error.action_id) {
					foundAction = workflow.actions[i]
					break
				}
			}
		}

		const validationIcon = Object.getOwnPropertyNames(actionRunInfo).length === 0 ? null :
			<Tooltip 
				title={
					<Typography variant="body1">
						{actionRunInfo.result} 
					</Typography>
				} 
				placement="bottom"
			>
				{actionRunInfo.validation.valid === true ? 
						<CheckCircleOutlineIcon style={{color: green, marginRight: 10, }} />
						:
						<ErrorOutlineIcon style={{color: red, marginRight: 10, }} />
				}
			</Tooltip>

		const authenticationType = foundApp.authentication
		if (error.type === "configuration" || error.type === "authentication") {
			// FIXME: Check the error
			if (appAuth === undefined || appAuth === null) {
				return "Loading auth"
			}

			var relevantAuthentication = [] 
			var foundAuth = {}
			for (var key in appAuth) {
				if (appAuth[key].app.id !== error.app_id) {
					continue
				}

				foundAuth = appAuth[key]
				relevantAuthentication.push(appAuth[key])
			}

			if (foundAction.selectedAuthentication === undefined || foundAction.selectedAuthentication === null) {
				foundAction.selectedAuthentication = {}
			}

			console.log("FOUNDACTION: ", foundAction, foundAuth)

			var authFound = false
			if (foundAuth.id !== undefined && foundAuth.id !== null && foundAuth.id.length > 0) {
				var authGroups = []
				// Choose from a dropdown
				authReturn = <Select
				  MenuProps={{
					disableScrollLock: true,
				  }}
				  labelId="select-app-auth"
				  value={
					  foundAction.authentication_id === "authgroups" ? "authgroups" :
						Object.getOwnPropertyNames(foundAction.selectedAuthentication).length === 0
						? "No selection"
						: foundAction.selectedAuthentication
				  }
				  SelectDisplayProps={{
					style: {
					},
				  }}
				  fullWidth
				  onChange={(e) => {
					if (e.target.value === "No selection") {
					  foundAction.selectedAuthentication = {};
					  foundAction.authentication_id = "";

					  for (let [key,keyval] in Object.entries(foundAction.parameters)) {
						if (foundAction.parameters[key].configuration === false) {
							//console.log("FIELDSKIP: ", foundAction.parameters[key].name)
							continue
						} 

						if (foundAction.parameters[key].name === "url" && authenticationType?.type === "oauth2-app" && foundAction.parameters[key].value.includes("http")) { 
							continue
						}

						if (foundAction.parameters[key].example !== undefined && foundAction.parameters[key].example !== null && foundAction.parameters[key].example !== "") {
						  if (foundAction.parameters[key].example.toLowerCase().includes("apik") || foundAction.parameters[key].example.toLowerCase().includes("key") || foundAction.parameters[key].example.toLowerCase().includes("pass") || foundAction.parameters[key].example.toLowerCase().includes("****")) {
							foundAction.parameters[key].value = ""
						  } else {
							foundAction.parameters[key].value = foundAction.parameters[key].example
						  }

						} else {
						  foundAction.parameters[key].value = ""
						}
					  }

					  setSelectedAction(foundAction)
					  setUpdate(Math.random());
					
					} else if (e.target.value === "authgroups") {
						if (authGroups !== undefined && authGroups !== null && authGroups.length === 0) {
							toast("No auth groups created. Opening window to create one")

							setTimeout(() => {
								window.open("/admin?tab=app_auth", "_blank")
							}, 2500)
						} else {
							foundAction.selectedAuthentication = {};
							foundAction.authentication_id = "authgroups"

							for (let [key,keyval] in Object.entries(foundAction.parameters)) {
							  //console.log(foundAction.parameters[key])
							  if (foundAction.parameters[key].configuration) {

								if (foundAction.parameters[key].name === "url" && authenticationType?.type === "oauth2-app") {
								} else {
									foundAction.parameters[key].value = "authgroup controlled"
								}
							  }
							}

							setSelectedAction(foundAction)
							setUpdate(Math.random())
						}
					} else {
					  foundAction.selectedAuthentication = e.target.value
					  foundAction.authentication_id = e.target.value.id

					  setSelectedAction(foundAction)
					  setUpdate(Math.random())
					}
				  }}
				  style={{
					backgroundColor: theme.palette.inputColor,
					color: "white",
					height: 40,
					borderRadius: theme.palette?.borderRadius,
				  }}
				>
				  <MenuItem
					style={{
					  backgroundColor: theme.palette.inputColor,
					  color: "white",
					}}
					value="No selection"
				  >
					{selectedImage}
					<em>No selection</em>
				  </MenuItem>

				  {relevantAuthentication.map((data) => {
					if (data.last_modified === true) {
						//console.log("LAST MODIFIED: ", data.label)
					}

					if (foundAction.authentication_id === data.id) {
						authFound = true
					}

					return (
					  <MenuItem
						key={data.id}
						disabled={data.id === foundAction.authentication_id}
						style={{
						  backgroundColor: theme.palette.inputColor,
						  color: "white",
						  overflowX: "auto",
						}}
						value={data}
					  >
						{selectedImage}

						{data.label} 
					  </MenuItem>
					)
				  })}

				  {/*
				  <Divider style={{marginTop: 10, marginBottom: 10, }}/>

					  <MenuItem
						disabled
						style={{
						  backgroundColor: theme.palette.inputColor,
						  color: "white",
						}}
						value="authgroups"
					  >
						<em>Auth Groups</em>
					  </MenuItem>
				  */}

				</Select>
			}

			// FIXME: Validate the CURRENT authentication that has been chosen?
			if (foundApp.authentication === undefined || foundApp.authentication === null) {
				toast("Authentication error: No authentication found")
				authReturn = "Failed to find auth"
			}

			if (authReturn === null && foundApp.authentication.type === "oauth2" || foundApp.authentication.type === "oauth2-app") {
				authReturn = 
					<AuthenticationOauth2
						globalUrl={globalUrl}
						authenticationType={foundApp.authentication}
						selectedAction={foundAction}

              			selectedApp={foundApp}
						getAppAuthentication={fetchAuthentication}
						isCloud={true}
						authButtonOnly={true}
					/>
			} else if (authReturn === null) {
				authReturn = "Other auth - Not implemented"
				
			}

			validationReturn = authReturn === null || foundAuth.id === undefined || foundAuth.id === null || foundAuth.id.length === 0 || !authFound ? null : 
				<Button
					fullWidth
					variant="outlined"
					color="secondary"
					style={{
						height: 35, 
						justifyContent: !validating ? "flex-start" : "center",
						textTransform: "none",
						fontSize: 18,
						borderRadius: theme.palette?.borderRadius,
					}}
					onClick={() => {
						toast("Validating app")
						validateApp(foundApp, foundAction)
					}}
				>
					{validationIcon} 
					{validating ? 
						<CircularProgress 
							color="secondary"
							style={{width: 30, height: 30, }} 
						/>
						:
						<span>
							{selectedImage}
							Validate {foundApp.name.replace("_", " ", -1)} 
						</span>
					}
				</Button>

			//resolveButton = !(Object.getOwnPropertyNames(actionRunInfo).length === 0 || actionRunInfo.validation.valid === true) ? null : 
			resolveButton = 
				<Button
					fullWidth
					variant="outlined"
					color="primary"
					style={{
						height: 35, 
						textTransform: "none",
						backgroundColor: green, 
						color: "black",
						borderRadius: 50, 
						width: 200,
						margin: "auto",
						marginTop: 35,
					}}
					onClick={() => {
						toast("Resolving error")
						console.log("Error: ", error)
						console.log("Errors: ", workflow.validation)

						// Remove the error from the validation list
						var newErrors = []
						for (var workflowErrorKey in workflow.validation.errors) {
							if (workflow.validation.errors[workflowErrorKey].error !== error.error) {
								newErrors.push(workflow.validation.errors[workflowErrorKey])
								continue
							}
						}

						workflow.validation.errors = newErrors
						if (workflow.validation.errors.length === 0) {
							workflow.validation.valid = true
						}

						// Sets it in the parent
						setWorkflow(workflow)
						if (setUpdateParent !== undefined) {
							setUpdateParent(Math.random())
						}

						// Saves the actual workflow with the update(s)
						saveWorkflow(workflow)
					}}
				>
					Resolve 
				</Button>
		}


		return (
			<div>
				{authReturn} 
				<div style={{marginTop: 5, }} />
				{validationReturn}

				{resolveButton}
			</div>
		)
	}

	console.log("Workflow validation: ", workflow.validation)
	return (
		<div>
			{workflow.errors !== undefined && workflow.errors !== null ?
				<div>
					General errors: {workflow.errors.length}
					{workflow.errors.map((error, index) => {
						return (
							<div>
								- {error}
							</div>
						)
					})}
				</div>
			: null}

			<Divider style={{marginTop: 15, marginBottom: 15, }}/>


			{workflow.validation.errors !== undefined && workflow.validation.errors !== null ?
				<div>
					Validation errors: {workflow.validation.errors.length}
					{workflow.validation.errors.map((error, index) => {
						return (
							<div>
								<ErrorItem
									apps={apps}
									error={error}
									index={index}
								/>
							</div>
						)
					})}
				</div>
			: null}

			<Divider style={{marginTop: 15, marginBottom: 15, }} />
			Apps loaded: {apps.length}

		</div>
	)
}

export default FixWorkflowValidationErrors
