import React, { useState, useEffect } from "react";

import theme from '../theme.jsx';
import { v4 as uuidv4 } from "uuid";
import { toast } from 'react-toastify';

import { 
	Divider,
	MenuItem,
	Button,
	Dialog,
	DialogTitle,
	DialogActions,
	DialogContent,
	Textfield,
  TextField,
	Typography,
	Select,
	IconButton,
} from "@mui/material";

import {
  LockOpen as LockOpenIcon,
	Close as CloseIcon,
} from "@mui/icons-material";

import PaperComponent from "../components/PaperComponent.jsx"
import { useParams, useNavigate, Link } from "react-router-dom";

const AuthenticationData = (props) => {
	const { 
		globalUrl,
		selectedApp, 
		getAppAuthentication,
		authenticationModalOpen,
		setAuthenticationModalOpen,

		configureWorkflowModalOpen, 
		workflow,
		setUpdate,
		selectedAction,
		setSelectedAction,
		isLoggedIn,
		authFieldsOnly, 
	} = props

  //const alert = useAlert()
  let navigate = useNavigate();
	const [submitSuccessful, setSubmitSuccessful] = useState(false)
	const [authenticationOption, setAuthenticationOptions] = React.useState({
		app: JSON.parse(JSON.stringify(selectedApp)),
		fields: {},
		label: "",
		usage: [
			{
				workflow_id: workflow === undefined ? "" : workflow.id,
			},
		],
		id: uuidv4(),
		active: true,
	});

	useEffect(() => {
		if (isLoggedIn === false && authFieldsOnly !== true) {
			navigate(`/login?view=${window.location.pathname}&message=Log in to authenticate this app`)
		}
	}, [])

  const setNewAppAuth = (appAuthData) => {
		var headers = {
			"Content-Type": "application/json",
			"Accept": "application/json",
		}

		// Find org_id and authorization from queries and add to headers
		if (window.location.search !== "") {
			const params = new URLSearchParams(window.location.search)
			const org_id = params.get("org_id")
			const authorization = params.get("authorization")
			if (org_id !== null && authorization !== null) {
				headers["Org-Id"] = org_id
				headers["Authorization"] = "Bearer " + authorization
			}
		}

    fetch(globalUrl + "/api/v1/apps/authentication", {
      method: "PUT",
      headers: headers,
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
          if (responseJson.reason === undefined) {
          	toast("Failed to set app auth. Are you logged in?")
					} else { 
          	toast("Failed to set app auth: " + responseJson.reason);
					}
        } else {
			setSubmitSuccessful(true)
			if (getAppAuthentication !== undefined) {

				if (workflow !== undefined && workflow !== null && workflow.org_id !== undefined && workflow.org_id !== null && workflow.org_id.length > 0) {
          			getAppAuthentication(true, false, undefined, workflow.org_id)
				} else {
          			getAppAuthentication(true, false)
				}
			}

			if (setAuthenticationModalOpen !== undefined) {
				setAuthenticationModalOpen(false)
			}
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("New auth error: ", error.toString());
      });
  };

	if (selectedApp.authentication === undefined || selectedApp.authentication.parameters === null ||
		selectedApp.authentication.parameters === undefined || selectedApp.authentication.parameters.length === 0) {
	
		return (
			<DialogContent style={{ textAlign: "center", marginTop: 50 }}>
				<Typography variant="h4" id="draggable-dialog-title" style={{ cursor: "move", }}>
					{selectedApp.name} does not require authentication
				</Typography>
			</DialogContent>
		);
	}

	authenticationOption.app.actions = [];

	for (let paramkey in selectedApp.authentication.parameters) {
		if (
			authenticationOption.fields[
			selectedApp.authentication.parameters[paramkey].name
			] === undefined
		) {
			authenticationOption.fields[
				selectedApp.authentication.parameters[paramkey].name
			] = "";
		}
	}

	const handleSubmitCheck = () => {
		if (authenticationOption.label.length === 0) {
			authenticationOption.label = `Auth for ${selectedApp.name}`;
		}

		// Automatically mapping fields that already exist (predefined).
		// Warning if fields are NOT filled
		for (let paramkey in selectedApp.authentication.parameters) {
			if (
				authenticationOption.fields[
					selectedApp.authentication.parameters[paramkey].name
				].length === 0
			) {
				if (
					selectedApp.authentication.parameters[paramkey].value !== undefined &&
					selectedApp.authentication.parameters[paramkey].value !== null &&
					selectedApp.authentication.parameters[paramkey].value.length > 0
				) {
					authenticationOption.fields[
						selectedApp.authentication.parameters[paramkey].name
					] = selectedApp.authentication.parameters[paramkey].value;
				} else {
					if (
						selectedApp.authentication.parameters[paramkey].schema.type === "bool"
					) {
						authenticationOption.fields[
							selectedApp.authentication.parameters[paramkey].name
						] = "false";
					} else {
						toast(
							"Field " +
							selectedApp.authentication.parameters[paramkey].name +
							" can't be empty"
						);
						return;
					}
				}
			}
		}

		console.log("Action: ", selectedAction);

		if (selectedAction !== undefined) {
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
		}

		var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
		var newFields = [];
		console.log("Fields: ", newAuthOption.fields)
		for (let authkey in newAuthOption.fields) {
			const value = newAuthOption.fields[authkey];
			newFields.push({
				"key": authkey,
				"value": value,
			});
		}

		newAuthOption.fields = newFields;
		setNewAppAuth(newAuthOption);

		if (configureWorkflowModalOpen === true) {
			setSelectedAction({});
		}

		if (setUpdate !== undefined) {
			setUpdate(authenticationOption.id);
		}
	};

	if (authenticationOption.label === null || authenticationOption.label === undefined) {
		authenticationOption.label = selectedApp.name + " authentication";
	}

	const authenticationParameters = selectedApp.authentication.parameters.map((data, index) => {
		return (
			<div key={index} style={{ marginTop: 10 }}>
				<div style={{display: "flex"}}>
					<LockOpenIcon style={{ marginRight: 10, }} />
					<Typography variant="body1" style={{}}>
						{data.name.replace("_basic", "", -1).replace("_", " ", -1)}
					</Typography>
				</div>

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
								fontSize: "1em",
							},
							disableUnderline: true,
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
	})

	const authenticationButtons = <span>
		<Button
			style={{ borderRadius: theme.palette?.borderRadius, marginTop: authFieldsOnly ? 20 : 0 }}
			onClick={() => {
				setAuthenticationOptions(authenticationOption);
				handleSubmitCheck();
			}}
			variant={"contained"}
			disabled={submitSuccessful}
			color="primary"
		>
			Submit
		</Button>
		{authFieldsOnly === true ? null :
			<Button
				style={{ borderRadius: 0 }}
				onClick={() => {
					setAuthenticationModalOpen(false);
				}}
				color="primary"
			>
				Cancel
			</Button>
		}
	</span>

	// Check if only the auth items should show
	if (authFieldsOnly === true) {
		return (
			<div>
				{submitSuccessful === true ? 
					<Typography variant="h6" style={{ marginTop: 10 }}>
						App succesfully configured! You may close this window.
					</Typography>
					: 
					<span>
						{authenticationParameters}
						{authenticationButtons}
					</span>
				}
			</div>
		)
	}

	return (
    <Dialog
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      hideBackdrop={true}
      disableEnforceFocus={true}
      disableBackdropClick={true}
      style={{ pointerEvents: "none" }}
      open={authenticationModalOpen}
      onClose={() => {
        //if (configureWorkflowModalOpen) {
        //  setSelectedAction({});
        //}
				setAuthenticationModalOpen(false);
      }}
      PaperProps={{
        style: {
          pointerEvents: "auto",
          color: "white",
          minWidth: 600,
          minHeight: 600,
          maxHeight: 600,
          padding: 15,
          overflow: "hidden",
          zIndex: 10012,
          border: theme.palette.defaultBorder,
        },
      }}
    >
      <IconButton
        style={{
          zIndex: 5000,
          position: "absolute",
          top: 14,
          right: 18,
          color: "grey",
        }}
        onClick={() => {
          setAuthenticationModalOpen(false);
          if (configureWorkflowModalOpen === true) {
            setSelectedAction({});
          }
        }}
      >
        <CloseIcon />
      </IconButton>
			<DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
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
				{authenticationParameters}

			</DialogContent>
			<DialogActions>
				{authenticationButtons}
			</DialogActions>
		</Dialog>
	);
};

export default AuthenticationData;
