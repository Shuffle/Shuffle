import React, { useState, useEffect } from "react";
import theme from '../theme.jsx';
import { v4 as uuidv4 } from "uuid";
import { toast } from 'react-toastify';

import {
  Button,
	Divider,
	Select,
	MenuItem,
	TextField,
	DialogActions,
	DialogTitle,
	DialogContent,
	Typography,
} from "@mui/material";

import {
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";

const AuthenticationData = (props) => {
  const {
		globalUrl,
    saveWorkflow,
    selectedApp,
    workflow,
    selectedAction,
    authenticationType,
    getAppAuthentication,
    appAuthentication,
    setSelectedAction,
    setAuthenticationModalOpen,
		isCloud,
  } = props;

	const setNewAppAuth = (appAuthData) => {
    console.log("DAta: ", appAuthData);
    fetch(globalUrl + "/api/v1/apps/authentication", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(appAuthData),
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
          toast("Failed to set app auth: " + responseJson.reason);
        } else {
			if (getAppAuthentication !== undefined) {
          		getAppAuthentication()
			}

			if (setAuthenticationModalOpen !== undefined) {
				setAuthenticationModalOpen(false)
			}

          // Needs a refresh with the new authentication..
          //toast("Successfully saved new app auth")
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("New auth error: ", error.toString());
      });
  }

	const [authenticationOption, setAuthenticationOptions] = React.useState({
		app: JSON.parse(JSON.stringify(selectedApp)),
		fields: {},
		label: "",
		usage: [
			{
				workflow_id: workflow.id,
			},
		],
		id: uuidv4(),
		active: true,
	});

	if (
		selectedApp.authentication === undefined ||
		selectedApp.authentication.parameters === null ||
		selectedApp.authentication.parameters === undefined ||
		selectedApp.authentication.parameters.length === 0
	) {
		return (
			<DialogContent style={{ textAlign: "center", marginTop: 50 }}>
				<Typography variant="h4" id="draggable-dialog-title" style={{cursor: "move",}}>
					{selectedApp.name} does not require authentication
				</Typography>
			</DialogContent>
		);
	}

	authenticationOption.app.actions = [];

	for (var key in selectedApp.authentication.parameters) {
		if (
			authenticationOption.fields[
				selectedApp.authentication.parameters[key].name
			] === undefined
		) {
			authenticationOption.fields[
				selectedApp.authentication.parameters[key].name
			] = "";
		}
	}

	const handleSubmitCheck = () => {
		console.log("NEW AUTH: ", authenticationOption);
		if (authenticationOption.label.length === 0) {
			authenticationOption.label = `Auth for ${selectedApp.name}`;
		}

		// Automatically mapping fields that already exist (predefined).
		// Warning if fields are NOT filled
		for (var key in selectedApp.authentication.parameters) {
			if (
				authenticationOption.fields[
					selectedApp.authentication.parameters[key].name
				].length === 0
			) {
				if (
					selectedApp.authentication.parameters[key].value !== undefined &&
					selectedApp.authentication.parameters[key].value !== null &&
					selectedApp.authentication.parameters[key].value.length > 0
				) {
					authenticationOption.fields[
						selectedApp.authentication.parameters[key].name
					] = selectedApp.authentication.parameters[key].value;
				} else {
					if (
						selectedApp.authentication.parameters[key].schema.type === "bool"
					) {
						authenticationOption.fields[
							selectedApp.authentication.parameters[key].name
						] = "false";
					} else {
						toast(
							"Field " +
								selectedApp.authentication.parameters[key].name +
								" can't be empty"
						);
						return;
					}
				}
			}
		}

		console.log("Action: ", selectedAction);
		selectedAction.authentication_id = authenticationOption.id;
		selectedAction.selectedAuthentication = authenticationOption;
		if (
			selectedAction.authentication === undefined ||
			selectedAction.authentication === null
		) {
			selectedAction.authentication = [authenticationOption];
		} else {
			selectedAction.authentication.push(authenticationOption);
		}

		setSelectedAction(selectedAction);

		var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
		var newFields = [];
		for (const key in newAuthOption.fields) {
			const value = newAuthOption.fields[key];
			newFields.push({
				key: key,
				value: value,
			});
		}

		console.log("FIELDS: ", newFields);
		newAuthOption.fields = newFields;
		setNewAppAuth(newAuthOption);

		//if (configureWorkflowModalOpen) {
		//	setSelectedAction({});
		//}

		//setUpdate(authenticationOption.id);
	};

	if (
		authenticationOption.label === null ||
		authenticationOption.label === undefined
	) {
		authenticationOption.label = selectedApp.name + " authentication";
	}

	return (
		<div>
			<DialogTitle id="draggable-dialog-title" style={{cursor: "move",}}>
				<div style={{ color: "white" }}>
					Authentication for {selectedApp.name}
				</div>
			</DialogTitle>
			<DialogContent>
				<a
					target="_blank"
					rel="noopener noreferrer"
					href="https://shuffler.io/docs/apps#authentication"
					style={{ textDecoration: "none", color: "#f85a3e" }}
				>
					What is app authentication?
				</a>
				<div />
				These are required fields for authenticating with {selectedApp.name}
				<div style={{ marginTop: 15 }} />
				<b>Name - what is this used for?</b>
				<TextField
					style={{
						backgroundColor: theme.palette.inputColor,
						borderRadius: theme.palette?.borderRadius,
					}}
					InputProps={{
						style: {
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
						authenticationOption.label = event.target.value;
					}}
				/>
				<Divider
					style={{
						marginTop: 15,
						marginBottom: 15,
						backgroundColor: "rgb(91, 96, 100)",
					}}
				/>
				<div />
				{selectedApp.authentication.parameters.map((data, index) => {
					return (
						<div key={index} style={{ marginTop: 10 }}>
							<LockOpenIcon style={{ marginRight: 10 }} />
							<b>{data.name}</b>

							{data.schema !== undefined &&
							data.schema !== null &&
							data.schema.type === "bool" ? (
								<Select
									MenuProps={{
										disableScrollLock: true,
									}}
									SelectDisplayProps={{
										style: {
											marginLeft: 10,
										},
									}}
									defaultValue={"false"}
									fullWidth
									onChange={(e) => {
										console.log("Value: ", e.target.value);
										authenticationOption.fields[data.name] = e.target.value;
									}}
									style={{
										backgroundColor: theme.palette.surfaceColor,
										color: "white",
										height: 50,
									}}
								>
									<MenuItem
										key={"false"}
										style={{
											backgroundColor: theme.palette.inputColor,
											color: "white",
										}}
										value={"false"}
									>
										false
									</MenuItem>
									<MenuItem
										key={"true"}
										style={{
											backgroundColor: theme.palette.inputColor,
											color: "white",
										}}
										value={"true"}
									>
										true
									</MenuItem>
								</Select>
							) : (
								<TextField
									style={{
										backgroundColor: theme.palette.inputColor,
										borderRadius: theme.palette?.borderRadius,
									}}
									InputProps={{
										style: {
											color: "white",
											marginLeft: "5px",
											maxWidth: "95%",
											height: 50,
											fontSize: "1em",
										},
									}}
									fullWidth
									type={
										data.example !== undefined && data.example.includes("***")
											? "password"
											: "text"
									}
									color="primary"
									defaultValue={
										data.value !== undefined && data.value !== null
											? data.value
											: ""
									}
									placeholder={data.example}
									onChange={(event) => {
										authenticationOption.fields[data.name] =
											event.target.value;
									}}
								/>
							)}
						</div>
					);
				})}
			</DialogContent>
			<DialogActions>
				<Button
					style={{ borderRadius: "0px" }}
					onClick={() => {
						setAuthenticationModalOpen(false);
					}}
					color="secondary"
				>
					Cancel
				</Button>
				<Button
					style={{ borderRadius: "0px" }}
					variant="outlined"
					onClick={() => {
						setAuthenticationOptions(authenticationOption);
						handleSubmitCheck();
					}}
					color="primary"
				>
					Submit
				</Button>
			</DialogActions>
		</div>
	);
};

export default AuthenticationData 
