import React, {useRef, useState, useEffect, useLayoutEffect} from 'react';
import { useTheme } from '@material-ui/core/styles';

import { v4 as uuidv4 } from 'uuid';
import { TextField, Drawer, Button, Paper, Grid, Tabs, InputAdornment, Tab, ButtonBase, Tooltip, Select, MenuItem, Divider, Dialog, Modal, DialogActions, DialogTitle, InputLabel, DialogContent, FormControl, IconButton, Menu, Input, FormGroup, FormControlLabel, Typography, Checkbox, Breadcrumbs, CircularProgress, Switch, Fade } from '@material-ui/core';
import { LockOpen as LockOpenIcon } from '@material-ui/icons';

const AuthenticationOauth2 = (props) => {
  const { saveWorkflow, selectedApp, workflow, selectedAction, authenticationType, getAppAuthentication, appAuthentication, setSelectedAction, setNewAppAuth, setAuthenticationModalOpen} = props;
	const theme = useTheme();

	//const [update, setUpdate] = React.useState("|")
	const [defaultConfigSet, setDefaultConfigSet] = React.useState(authenticationType.client_id !== undefined && authenticationType.client_id !== null && authenticationType.client_id.length > 0 && authenticationType.client_secret !== undefined && authenticationType.client_secret !== null && authenticationType.client_secret.length > 0)
	const [clientId, setClientId] = React.useState(defaultConfigSet ? authenticationType.client_id : "")
	const [clientSecret, setClientSecret] = React.useState(defaultConfigSet ? authenticationType.client_secret : "")
	const [buttonClicked, setButtonClicked] = React.useState(false)

	const [manuallyConfigure, setManuallyConfigure] = React.useState(false)
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

	if (selectedApp.authentication === undefined) {
		return null
	}

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

		console.log(window.location)
		//const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" 
		const redirectUri = `${window.location.protocol}//${window.location.host}/set_authentication`
		const state = `workflow_id%3D${workflow.id}%26reference_action_id%3d${selectedAction.app_id}%26app_name%3d${selectedAction.app_name}%26app_id%3d${selectedAction.app_id}%26app_version%3d${selectedAction.app_version}%26authentication_url%3d${authentication_url}%26scope%3d${resources}%26client_id%3d${client_id}%26client_secret%3d${client_secret}`

		const url = `${authenticationType.redirect_uri}?client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${resources}&state=${state}`
		// &resource=https%3A%2F%2Fgraph.microsoft.com&
		
		// FIXME: Awful, but works for prototyping
		// How can we get a callback properly realtime? 
		// How can we properly try-catch without breaks on error?
		try {

			var newwin = window.open(url, "", "width=400,height=200")
			//console.log(newwin)
		
			var open = true
  		const timer = setInterval(() => {
  		  if (newwin.closed) {
  		    clearInterval(timer);
  		    //alert('"Secure Payment" window closed!');

					getAppAuthentication(true, true)
					setTimeout(() => {
						console.log("APPAUTH: ", appAuthentication)
						setAuthenticationModalOpen(false)
					}, 1500)
  		  }
  		}, 1000);
			//do {
			//	setTimeout(() => {
			//		console.log(newwin)
			//		console.log("CLOSED", newwin.closed)
			//		if (newwin.closed) {

			//			open = false
			//		}
			//	}, 1000)
			//}
			//while(open === true)
		} catch (e) {
			alert.error("Failed authentication - probably bad credentials. Try again")
			setButtonClicked(false)
		}

		return
		//do {
		//} while (
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
			<DialogTitle><div style={{color: "white"}}>Authentication for {selectedApp.name}</div></DialogTitle>
			<DialogContent>
				<span style={{}}>
					<b>Oauth2 requires a client ID and secret to authenticate. This is usually made in the remote system.</b>
					<a target="_blank" rel="norefferer" href="https://shuffler.io/docs/apps#authentication" style={{textDecoration: "none", color: "#f85a3e"}}> Learn more about Oauth2 with Shuffle</a><div/>
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

				{!manuallyConfigure ? null :
					<span>
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
						</span>
					}
				<Button 
					style={{marginBottom: 40, marginTop: 20, borderRadius: theme.palette.borderRadius}}
					disabled={clientSecret.length === 0 || clientId.length === 0}
					variant="contained"
					fullWidth
					onClick={() => {
						//setAuthenticationModalOpen(false)
						handleOauth2Request(clientId, clientSecret) 
					}} 
					color="primary"
				>
					{buttonClicked ? 
						<CircularProgress style={{color: "white", }} /> 
						:
						"Oauth2 request"
					}
				</Button>

				{defaultConfigSet ? 
					<span style={{}}>
						... or 
						<Button 
							style={{marginLeft: 10, borderRadius: theme.palette.borderRadius}}
							disabled={clientSecret.length === 0 || clientId.length === 0}
							variant="text"
							onClick={() => {
								setManuallyConfigure(!manuallyConfigure) 

								if (manuallyConfigure) {
									setClientId(authenticationType.client_id)
									setClientSecret(authenticationType.client_secret)
								} else {
									setClientId("")
									setClientSecret("")
								}
							}} 
							color="primary"
						>
							{manuallyConfigure ? "Use auto-config" : "Manually configure Oauth2"}
						</Button>
					</span>
				: null}
			</DialogContent>
		</div>
	)
}

export default AuthenticationOauth2 
