import React, {useRef, useState, useEffect, useLayoutEffect} from 'react';
import { useTheme } from '@material-ui/core/styles';

import { v4 as uuidv4 } from 'uuid';
import { TextField, Drawer, Button, Paper, Grid, Tabs, InputAdornment, Tab, ButtonBase, Tooltip, Select, MenuItem, Divider, Dialog, Modal, DialogActions, DialogTitle, InputLabel, DialogContent, FormControl, IconButton, Menu, Input, FormGroup, FormControlLabel, Typography, Checkbox, Breadcrumbs, CircularProgress, Switch, Fade } from '@material-ui/core';
import { LockOpen as LockOpenIcon } from '@material-ui/icons';

const AuthenticationOauth2 = (props) => {
  const { saveWorkflow, selectedApp, workflow, selectedAction, authenticationType, getAppAuthentication, appAuthentication, setSelectedAction, setNewAppAuth, setAuthenticationModalOpen} = props;
	const theme = useTheme();

	//const [update, setUpdate] = React.useState("|")
	const [clientId, setClientId] = React.useState("")
	const [clientSecret, setClientSecret] = React.useState("")
	const [buttonClicked, setButtonClicked] = React.useState(false)
	const [authenticationOption, setAuthenticationOptions] = React.useState({
		app: JSON.parse(JSON.stringify(selectedApp)),
		fields: {},
		label: "",
		usage: [{
			workflow_id: workflow.id,
		}],
		id: uuidv4(),
		active: true,
	})

	const handleOauth2Request = (client_id, client_secret) => {
		setButtonClicked(true)
		//if (authenticationType.type === "oauth2" && authenticationType.redirect_uri !== undefined && authenticationType.redirect_uri !== null) {
		// These are test credentials
		//const client_id = "dae24316-4bec-4832-b660-4cba6dc2477b"
		//const client_secret = "._Qu3EvYY-OW_D57uy79qwEo.32qD6.l0z"

		const authentication_url = authenticationType.token_uri

		const resources = "UserAuthenticationMethod.ReadWrite.All"
		if (authenticationType.scope !== undefined && authenticationType.scope !== null) {
			console.log("EDIT SCOPE!")
		}

		const redirectUri = `http://${window.location.host}/set_authentication`
		const state = `workflow_id%3D${workflow.id}%26reference_action_id%3d${selectedAction.app_id}%26app_name%3d${selectedAction.app_name}%26app_id%3d${selectedAction.app_id}%26app_version%3d${selectedAction.app_version}%26authentication_url%3d${authentication_url}%26scope%3d${resources}%26client_id%3d${client_id}%26client_secret%3d${client_secret}`

		const url = `${authenticationType.redirect_uri}?client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${resources}&state=${state}`
		// &resource=https%3A%2F%2Fgraph.microsoft.com&
		
		// FIXME: Awful, but works for prototyping
		// How can we get a callback properly realtime? 
		// How can we properly try-catch without breaks on error?
		try {

			var newwin = window.open(url, "", "width=400,height=200")
			console.log(newwin)
			setTimeout(() => {
				console.log(newwin)
				console.log("CLOSED", newwin.closed)
			}, 1000)

			setTimeout(() => {
				console.log(newwin)
				console.log("CLOSED", newwin.closed)
				if (newwin.closed) {
					getAppAuthentication(true, true)
					setTimeout(() => {
						console.log("APPAUTH: ", appAuthentication)
								
						//{selectedAction.authentication.map(data => {
						
						setAuthenticationModalOpen(false)
						saveWorkflow(workflow)
					}, 1500)
				}
			}, 10000)
		} catch (e) {
			alert.error("Failed authentication - probably bad credentials. Try again")
			setButtonClicked(false)
		}

		return
		//do {
		//} while (
	}

	if (selectedApp.authentication === undefined) {
		return null
	}

	if (selectedApp.authentication.parameters === null || selectedApp.authentication.parameters === undefined || selectedApp.authentication.parameters.length === 0) {
		return null
	}

	authenticationOption.app.actions = []

	for (var key in selectedApp.authentication.parameters) {
		if (authenticationOption.fields[selectedApp.authentication.parameters[key].name] === undefined) {
			authenticationOption.fields[selectedApp.authentication.parameters[key].name] = ""
		}
	}

	const handleSubmitCheck = () => {
		console.log("NEW AUTH: ", authenticationOption)
		if (authenticationOption.label.length === 0) {
			authenticationOption.label = `Auth for ${selectedApp.name}`
			//alert.info("Label can't be empty")
			//return
		}

		// Automatically mapping fields that already exist (predefined). 
		// Warning if fields are NOT filled
		for (var key in selectedApp.authentication.parameters) {
			if (authenticationOption.fields[selectedApp.authentication.parameters[key].name].length === 0) {
				if (selectedApp.authentication.parameters[key].value !== undefined && selectedApp.authentication.parameters[key].value !== null && selectedApp.authentication.parameters[key].value.length > 0) {
					authenticationOption.fields[selectedApp.authentication.parameters[key].name] = selectedApp.authentication.parameters[key].value
				} else {
					if (selectedApp.authentication.parameters[key].schema.type === "bool") {
						authenticationOption.fields[selectedApp.authentication.parameters[key].name] = "false"
					} else {
						alert.info("Field "+selectedApp.authentication.parameters[key].name+" can't be empty")
						return
					}
				}
			} 
		}

		console.log("Action: ", selectedAction)
		selectedAction.authentication_id = authenticationOption.id
		selectedAction.selectedAuthentication = authenticationOption
		if (selectedAction.authentication === undefined || selectedAction.authentication === null) {
			selectedAction.authentication = [authenticationOption]
		} else {
			selectedAction.authentication.push(authenticationOption)
		}

		setSelectedAction(selectedAction)

		var newAuthOption = JSON.parse(JSON.stringify(authenticationOption))
		var newFields = []
		for (const key in newAuthOption.fields) {
			const value = newAuthOption.fields[key]
			newFields.push({
				key: key,
				value: value,
			})
		}

		console.log("FIELDS: ", newFields)
		newAuthOption.fields = newFields
		setNewAppAuth(newAuthOption)
		//appAuthentication.push(newAuthOption)
		//setAppAuthentication(appAuthentication)
		//
		
		//if (configureWorkflowModalOpen) {
		//	setSelectedAction({})
		//}
		//setUpdate(authenticationOption.id)

		/*
			{selectedAction.authentication.map(data => (
			<MenuItem key={data.id} style={{backgroundColor: inputColor, color: "white"}} value={data}>
		*/

	}

	if (authenticationOption.label === null || authenticationOption.label === undefined) {
		authenticationOption.label = selectedApp.name+" authentication"
	}

	//console.log(
	return (
		<div>
			<DialogContent>
				<span style={{}}>
					<b>Oauth2 requires a client ID and secret to authenticate. This is usually made in the remote system.</b>
					<a target="_blank" rel="norefferer" href="https://shuffler.io/docs/apps#authentication" style={{textDecoration: "none", color: "#f85a3e"}}>Learn more about Oauth2</a><div/>
				</span>
				{/*<TextField
						style={{backgroundColor: theme.palette.inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={"Auth july 2020"}
						defaultValue={`Auth for ${selectedApp.name}`}
						onChange={(event) => {
							authenticationOption.label = event.target.value
						}}
					/>
				<Divider style={{marginTop: 15, marginBottom: 15, backgroundColor: "rgb(91, 96, 100)"}}/>
				*/}
				<TextField
						style={{marginTop: 20, backgroundColor: theme.palette.inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={"Client ID"}
						onChange={(event) => {
							setClientId(event.target.value)
							//authenticationOption.label = event.target.value
						}}
					/>
				<TextField
						style={{backgroundColor: theme.palette.inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={"Client Secret"}
						onChange={(event) => {
							setClientSecret(event.target.value)
							//authenticationOption.label = event.target.value
						}}
					/>
				<Button 
					style={{marginTop: 20, borderRadius: theme.palette.borderRadius}}
					disabled={clientSecret.length === 0 || clientId.length === 0}
					variant="outlined"
					fullWidth
					onClick={() => {
						//setAuthenticationModalOpen(false)
						handleOauth2Request(clientId, clientSecret) 
					}} 
					color="primary"
				>
					{buttonClicked ? 
						<CircularProgress style={{}} /> 
						:
						"Oauth2 request"
					}
				</Button>
			</DialogContent>
		</div>
	)
}

export default AuthenticationOauth2 
