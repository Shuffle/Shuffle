import React, { useEffect} from 'react';

import {Link} from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';

import { useAlert } from "react-alert";

import { Dialog, DialogTitle, DialogActions, DialogContent } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

import CachedIcon from '@material-ui/icons/Cached';
import AccessibilityNewIcon from '@material-ui/icons/AccessibilityNew';
import LockIcon from '@material-ui/icons/Lock';
import EcoIcon from '@material-ui/icons/Eco';
import ScheduleIcon from '@material-ui/icons/Schedule';
import CloudIcon from '@material-ui/icons/Cloud';
import BusinessIcon from '@material-ui/icons/Business';

const Admin = (props) => {
	const { globalUrl } = props;

	const theme = useTheme();
	const [firstRequest, setFirstRequest] = React.useState(true);
	const [modalUser, setModalUser] = React.useState({});
	const [modalOpen, setModalOpen] = React.useState(false);

	const [cloudSyncModalOpen, setCloudSyncModalOpen] = React.useState(false);
	const [cloudSyncApikey, setCloudSyncApikey] = React.useState("");
	const [loading, setLoading] = React.useState(false);

	const [selectedOrganization, setSelectedOrganization] = React.useState({});
	const [loginInfo, setLoginInfo] = React.useState("");
	const [curTab, setCurTab] = React.useState(0);
	const [users, setUsers] = React.useState([]);
	const [organizations, setOrganizations] = React.useState([]);
	const [environments, setEnvironments] = React.useState([]);
	const [authentication, setAuthentication] = React.useState([]);
	const [schedules, setSchedules] = React.useState([])
	const [selectedUser, setSelectedUser] = React.useState({})
	const [newPassword, setNewPassword] = React.useState("");
	const [selectedUserModalOpen, setSelectedUserModalOpen] = React.useState(false)
	const [selectedAuthentication, setSelectedAuthentication] = React.useState({})
	const [selectedAuthenticationModalOpen, setSelectedAuthenticationModalOpen] = React.useState(false)
	const [showArchived, setShowArchived] = React.useState(false)

	const getApps = () => {
		fetch(globalUrl+"/api/v1/workflows/apps", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for apps :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			console.log("apps: ", responseJson)
			//setApps(responseJson)
			//setFilteredApps(responseJson)
			//if (responseJson.length > 0) {
			//	setSelectedApp(responseJson[0])
			//	if (responseJson[0].actions !== null && responseJson[0].actions.length > 0) {
			//		setSelectedAction(responseJson[0].actions[0])
			//	} else {
			//		setSelectedAction({})
			//	}
			//} 
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const categories = [
		{
			"name": "Ticketing", 
			"apps": [
				"TheHive",
				"Service-Now",
				"SecureWorks",
			],
			"categories": ["tickets", "ticket", "ticketing"]
		},
	]
	/*
		"SIEM",
		"Active Directory",
		"Firewalls", 
		"Proxies web",
		"SIEM", 
		"SOAR",
		"Mail",
		"EDR",
		"AV", 
		"MDM/MAM",
		"DNS",
		"Ticketing platform",
		"TIP",
		"Communication", 
		"DDOS protection",
		"VMS",
	]
	*/

	const alert = useAlert()

	const deleteAuthentication = (data) => {
		alert.info("Deleting auth " + data.label)

		// Just use this one?
		const url = globalUrl + '/api/v1/apps/authentication/' + data.id
		console.log("URL: ", url)
		fetch(url, {
			method: 'DELETE',
			credentials: "include",
			headers: {
				'Content-Type': 'application/json',
			},
		})
		.then(response =>
			response.json().then(responseJson => {
				console.log("RESP: ", responseJson)
				if (responseJson["success"] === false) {
					alert.error("Failed stopping schedule")
				} else {
					getAppAuthentication() 
					alert.success("Successfully stopped schedule!")
				}
			}),
		)
		.catch(error => {
			console.log("Error in userdata: ", error)
		});
	}

	const deleteSchedule = (data) => {
		// FIXME - add some check here ROFL
		console.log("INPUT: ", data)

		// Just use this one?
		const url = globalUrl + '/api/v1/workflows/' + data["workflow_id"] + "/schedule/" + data.id
		console.log("URL: ", url)
		fetch(url, {
			method: 'DELETE',
			credentials: "include",
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(response =>
				response.json().then(responseJson => {
					console.log("RESP: ", responseJson)
					if (responseJson["success"] === false) {
						alert.error("Failed stopping schedule")
					} else {
						getSchedules()
						alert.success("Successfully stopped schedule!")
					}
				}),
			)
			.catch(error => {
				console.log("Error in userdata: ", error)
			});
	}

	const enableCloudSync = (apikey, organization) => {
		const data = { 
			apikey: apikey,
			organization: organization,
		}

		const url = globalUrl + '/api/v1/cloud/setup';
		fetch(url, {
			mode: 'cors',
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			crossDomain: true,
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
		})
			.then(response =>
				response.json().then(responseJson => {
					setLoading(false)
					console.log(responseJson)
					if (responseJson["success"] === false) {
						alert.error("Failed setting up cloud sync")
					} else {
						alert.success("Set up cloud sync!")
					}
				}),
			)
			.catch(error => {
				setLoading(false)
				alert.error("Err: " + error.toString())
			});
	}

	const onPasswordChange = () => {
		const data = { "username": selectedUser.username, "newpassword": newPassword }
		const url = globalUrl + '/api/v1/users/passwordchange';

		fetch(url, {
			mode: 'cors',
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			crossDomain: true,
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
		})
			.then(response =>
				response.json().then(responseJson => {
					if (responseJson["success"] === false) {
						alert.error("Failed setting new password")
					} else {
						alert.success("Successfully password!")
						setSelectedUserModalOpen(false)
					}
				}),
			)
			.catch(error => {
				alert.error("Err: " + error.toString())
			});
	}

	const deleteUser = (data) => {
		// Just use this one?
		const url = globalUrl + '/api/v1/users/' + data.id
		fetch(url, {
			method: 'DELETE',
			credentials: "include",
			headers: {
				'Content-Type': 'application/json',
			},
		})
		.then(response => {
			if (response.status === 200) {
				getUsers()
			}

			return response.json()
		})
    .then((responseJson) => {
			if (!responseJson.success && responseJson.reason !== undefined) {
				alert.error("Failed to deactivate user: "+responseJson.reason)
			} else {
				alert.success("Deactivated user "+data.id)
			}
		})

		.catch(error => {
			console.log("Error in userdata: ", error)
		});
	}

	const submitUser = (data) => {
		console.log("INPUT: ", data)

		// Just use this one?
		var data = { "username": data.Username, "password": data.Password }
		var baseurl = globalUrl
		const url = baseurl + '/api/v1/users/register';
		fetch(url, {
			method: 'POST',
			credentials: "include",
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(response =>
				response.json().then(responseJson => {
					if (responseJson["success"] === false) {
						setLoginInfo("Error in input: " + responseJson.reason)
					} else {
						setLoginInfo("")
						setModalOpen(false)
						getUsers()
					}
				}),
			)
			.catch(error => {
				console.log("Error in userdata: ", error)
			});
	}

	// Horrible frontend fix for environments
	const setDefaultEnvironment = (name) => {
		// FIXME - add some check here ROFL
		alert.info("Setting default env to " + name)
		var newEnv = []
		for (var key in environments) {
			if (environments[key].Name == name) {
				if (environments[key].archived) {
					alert.error("Can't set archived to default")
					return
				}

				environments[key].default = true
			} else if (environments[key].default == true && environments[key].name !== name) {
				environments[key].default = false 
			}

			newEnv.push(environments[key])
		}

		// Just use this one?
		const url = globalUrl + '/api/v1/setenvironments';
		fetch(url, {
			method: 'PUT',
			credentials: "include",
			body: JSON.stringify(newEnv),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(response =>
				response.json().then(responseJson => {
					if (responseJson["success"] === false) {
						alert.error(responseJson.reason)
						getEnvironments()
					} else {
						setLoginInfo("")
						setModalOpen(false)
						getEnvironments()
					}
				}),
			)
		.catch(error => {
			console.log("Error in backend data: ", error)
		})
	}

	const deleteEnvironment = (name) => {
		// FIXME - add some check here ROFL
		alert.info("Deleting environment " + name)
		var newEnv = []
		for (var key in environments) {
			if (environments[key].Name == name) {
				if (environments[key].default) {
					alert.info("Can't delete the default environment")
					return
				}
				environments[key].archived = true
			}

			newEnv.push(environments[key])
		}

		// Just use this one?
		const url = globalUrl + '/api/v1/setenvironments';
		fetch(url, {
			method: 'PUT',
			credentials: "include",
			body: JSON.stringify(newEnv),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(response =>
				response.json().then(responseJson => {
					if (responseJson["success"] === false) {
						alert.error(responseJson.reason)
						getEnvironments()
					} else {
						setLoginInfo("")
						setModalOpen(false)
						getEnvironments()
					}
				}),
			)
		.catch(error => {
			console.log("Error when deleting: ", error)
		})
	}

	const submitEnvironment = (data) => {
		// FIXME - add some check here ROFL
		environments.push({
			"name": data.environment, 
			"type": "onprem",
		})

		// Just use this one?
		var baseurl = globalUrl
		const url = baseurl + '/api/v1/setenvironments';
		fetch(url, {
			method: 'PUT',
			credentials: "include",
			body: JSON.stringify(environments),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(response =>
				response.json().then(responseJson => {
					if (responseJson["success"] === false) {
						setLoginInfo("Error in input: " + responseJson.reason)
						getEnvironments()
					} else {
						setLoginInfo("")
						setModalOpen(false)
						getEnvironments()
					}
				}),
			)
			.catch(error => {
				console.log("Error in userdata: ", error)
			});
	}

	const getSchedules = () => {
		fetch(globalUrl + "/api/v1/workflows/schedules", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for apps :O!")
					return
				}

				return response.json()
			})
			.then((responseJson) => {
				setSchedules(responseJson)
			})
			.catch(error => {
				alert.error(error.toString())
			});
	}

	const getAppAuthentication = () => {
		fetch(globalUrl + "/api/v1/apps/authentication", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for apps :O!")
					return
				}

				return response.json()
			})
			.then((responseJson) => {
				if (responseJson.success) {
					console.log(responseJson.data)
					setAuthentication(responseJson.data)
				} else {
					alert.error("Failed getting authentications")
				}
			})
			.catch(error => {
				alert.error(error.toString())
			});
	}

	const getEnvironments = () => {
		fetch(globalUrl + "/api/v1/getenvironments", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for apps :O!")
					return
				}

				return response.json()
			})
			.then((responseJson) => {
				setEnvironments(responseJson)
			})
			.catch(error => {
				alert.error(error.toString())
			});
	}

	const getOrgs = () => {
		fetch(globalUrl + "/api/v1/getorgs", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for apps :O!")
					return
				}

				return response.json()
			})
			.then((responseJson) => {
				setOrganizations(responseJson)
			})
			.catch(error => {
				alert.error(error.toString())
			});
	}

	const getUsers = () => {
		fetch(globalUrl + "/api/v1/getusers", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					window.location.pathname = "/workflows"
					return
				}

				return response.json()
			})
			.then((responseJson) => {
				setUsers(responseJson)
			})
			.catch(error => {
				alert.error(error.toString())
			});
	}

	if (firstRequest) {
		setFirstRequest(false)
		getUsers()
	}

	const paperStyle = {
		maxWidth: 1250,
		margin: "auto",
		color: "white",
		backgroundColor: theme.palette.surfaceColor,
		marginBottom: 10,
		padding: 20,
	}

	const changeModalData = (field, value) => {
		modalUser[field] = value
	}

	const setUser = (userId, field, value) => {
		const data = { "user_id": userId }
		data[field] = value
		console.log("DATA: ", data)

		fetch(globalUrl + "/api/v1/users/updateuser", {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify(data),
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for WORKFLOW EXECUTION :O!")
				} else {
					getUsers()
				}

				return response.json()
			})
			.then((responseJson) => {
				if (!responseJson.success && responseJson.reason !== undefined) {
					alert.error("Failed setting user: " + responseJson.reason)
				} else {
					alert.success("Set the user field " + field + " to " + value)
				}
			})
			.catch(error => {
				console.log(error)
			});
	}



	const generateApikey = (userId) => {
		const data = { "user_id": userId }

		fetch(globalUrl + "/api/v1/generateapikey", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify(data),
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for WORKFLOW EXECUTION :O!")
				} else {
					getUsers()
				}

				return response.json()
			})
			.then((responseJson) => {
				console.log("RESP: ", responseJson)
				if (!responseJson.success && responseJson.reason !== undefined) {
					alert.error("Failed getting new: " + responseJson.reason)
				} else {
					alert.success("Got new API key")
				}
			})
			.catch(error => {
				console.log(error)
			});
	}

	const editAuthenticationModal =
		<Dialog modal
			open={selectedAuthenticationModalOpen}
			onClose={() => { setSelectedAuthenticationModalOpen(false) }}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle><span style={{ color: "white" }}>Edit authentication</span></DialogTitle>
			<DialogContent>
				<div style={{ display: "flex" }}>
					<TextField
						style={{ backgroundColor: theme.palette.inputColor, flex: 3 }}
						InputProps={{
							style: {
								height: 50,
								color: "white",
							},
						}}
						color="primary"
						required
						fullWidth={true}
						placeholder="New password"
						type="password"
						id="standard-required"
						autoComplete="password"
						margin="normal"
						variant="outlined"
						onChange={e => setNewPassword(e.target.value)}
					/>
					<Button
						style={{ maxHeight: 50, flex: 1 }}
						variant="outlined"
						color="primary"
						onClick={() => onPasswordChange()}
					>
						Submit
					</Button>
				</div>
				<Divider style={{ marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor }} />
				<Button
					style={{}}
					variant="outlined"
					color="primary"
					onClick={() => deleteUser(selectedUser)}
				>
					{selectedUser.active ? "Deactivate" : "Activate"}
				</Button>
				<Button
					style={{}}
					variant="outlined"
					color="primary"
					onClick={() => generateApikey(selectedUser.id)}
				>
					Get new API key
				</Button>
			</DialogContent>
		</Dialog>

	const editUserModal =
		<Dialog modal
			open={selectedUserModalOpen}
			onClose={() => { setSelectedUserModalOpen(false) }}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle><span style={{ color: "white" }}>Edit user</span></DialogTitle>
			<DialogContent>
				<div style={{ display: "flex" }}>
					<TextField
						style={{ marginTop: 0, backgroundColor: theme.palette.inputColor, flex: 3 }}
						InputProps={{
							style: {
								height: 50,
								color: "white",
							},
						}}
						color="primary"
						required
						fullWidth={true}
						placeholder="New password"
						type="password"
						id="standard-required"
						autoComplete="password"
						margin="normal"
						variant="outlined"
						onChange={e => setNewPassword(e.target.value)}
					/>
					<Button
						style={{ maxHeight: 50, flex: 1 }}
						variant="outlined"
						color="primary"
						onClick={() => onPasswordChange()}
					>
						Submit
					</Button>
				</div>
				<Divider style={{ marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor }} />
				<Button
					style={{}}
					variant="outlined"
					color="primary"
					onClick={() => deleteUser(selectedUser)}
				>
					{selectedUser.active ? "Deactivate" : "Activate"}
				</Button>
				<Button
					style={{}}
					variant="outlined"
					color="primary"
					onClick={() => generateApikey(selectedUser.id)}
				>
					Get new API key
				</Button>
			</DialogContent>
		</Dialog>

	const cloudSyncModal =
		<Dialog 
			open={cloudSyncModalOpen}
			onClose={() => { setCloudSyncModalOpen(false) }}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle><span style={{ color: "white" }}>
				Enable cloud features
			</span></DialogTitle>
			<DialogContent>
				What does <a href="https://shuffler.io/docs/hybrid#cloud_sync" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>cloud sync</a> do?
				<div style={{marginTop: 5}}/>
				Cloud Apikey
				<div style={{display: "flex", marginBottom: 20, }}>
					<TextField
						color="primary"
						style={{backgroundColor: theme.palette.inputColor, marginRight: 10, }}
						InputProps={{
							style: {
								height: "50px",
								color: "white",
								fontSize: "1em",
							},
						}}
						required
						fullWidth={true}
						autoComplete="cloud apikey"
						id="apikey_field"
						margin="normal"
						placeholder="Cloud Apikey"
						variant="outlined"
						onChange={(event) => {
							setCloudSyncApikey(event.target.value)
						}}
					/>
					<Button disabled={cloudSyncApikey.length === 0 || loading} variant="contained" style={{ marginLeft: 15, height: 60, margin: "auto", borderRadius: "0px" }} onClick={() => {
						setLoading(true)
						enableCloudSync(
							cloudSyncApikey,
							selectedOrganization,
						)
					}} color="primary">
						Test sync	
					</Button>
				</div>

				* New triggers (userinput, hotmail realtime)<div/>
				* Execute in the cloud rather than onprem<div/>
				* Apps can be built in the cloud<div/>
				*	Easily share apps and workflows<div/>
				*	Access to powerful cloud search
			</DialogContent>
		</Dialog>

	const modalView =
		<Dialog 
			open={modalOpen}
			onClose={() => { setModalOpen(false) }}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle><span style={{ color: "white" }}>
				{curTab === 0 ? "Add user" : "Add environment"}
			</span></DialogTitle>
			<DialogContent>
				{curTab === 0 ?
					<div>
						Username
						<TextField
							color="primary"
							style={{ backgroundColor: theme.palette.inputColor }}
							autoFocus
							InputProps={{
								style: {
									height: "50px",
									color: "white",
									fontSize: "1em",
								},
							}}
							required
							fullWidth={true}
							autoComplete="username"
							placeholder="username@example.com"
							id="emailfield"
							margin="normal"
							variant="outlined"
							onChange={(event) => changeModalData("Username", event.target.value)}
						/>
						Password
						<TextField
							color="primary"
							style={{ backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									height: "50px",
									color: "white",
									fontSize: "1em",
								},
							}}
							required
							fullWidth={true}
							autoComplete="password"
							type="password"
							placeholder="********"
							id="pwfield"
							margin="normal"
							variant="outlined"
							onChange={(event) => changeModalData("Password", event.target.value)}
						/>
					</div>
					: curTab === 2 ?
						<div>
							Environment Name
					<TextField
								color="primary"
								style={{ backgroundColor: theme.palette.inputColor }}
								autoFocus
								InputProps={{
									style: {
										height: "50px",
										color: "white",
										fontSize: "1em",
									},
								}}
								required
								fullWidth={true}
								placeholder="datacenter froglantern"
								id="environment_name"
								margin="normal"
								variant="outlined"
								onChange={(event) => changeModalData("environment", event.target.value)}
							/>
						</div>
						: null}
				{loginInfo}
			</DialogContent>
			<DialogActions>
				<Button style={{ borderRadius: "0px" }} onClick={() => setModalOpen(false)} color="primary">
					Cancel
				</Button>
				<Button variant="contained" style={{ borderRadius: "0px" }} onClick={() => {
					if (curTab === 0) {
						submitUser(modalUser)
					} else if (curTab === 2) {
						submitEnvironment(modalUser)
					}
				}} color="primary">
					Submit
				</Button>
			</DialogActions>
		</Dialog>

	const usersView = curTab === 0 ?
		<div>
			<div style={{ marginTop: 20, marginBottom: 20, }}>
				<h2 style={{ display: "inline", }}>User management</h2>
				<span style={{ marginLeft: 25 }}>Add, edit, block or change passwords</span>
			</div>
			<div />
			<Button
				style={{}}
				variant="contained"
				color="primary"
				onClick={() => setModalOpen(true)}
			>
				Add user
			</Button>
			<Divider style={{ marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor }} />
			<List>
				<ListItem>
					<ListItemText
						primary="Username"
						style={{ minWidth: 200, maxWidth: 200 }}
					/>
					<ListItemText
						primary="API key"
						style={{ minWidth: 350, maxWidth: 350, overflow: "hidden" }}
					/>
					<ListItemText
						primary="Role"
						style={{ minWidth: 150, maxWidth: 150 }}
					/>
					<ListItemText
						primary="Active"
						style={{ minWidth: 180, maxWidth: 180 }}
					/>
					<ListItemText
						primary="Actions"
						style={{ minWidth: 180, maxWidth: 180 }}
					/>
				</ListItem>
				{users === undefined ? null : users.map((data, index) => {
					return (
						<ListItem key={index}>
							<ListItemText
								primary={data.username}
								style={{ minWidth: 200, maxWidth: 200 }}
							/>
							<ListItemText
								primary={data.apikey === undefined || data.apikey.length === 0 ? "" : data.apikey}
								style={{ maxWidth: 350, minWidth: 350, }}
							/>
							<ListItemText
								primary=
								{<Select
									SelectDisplayProps={{
									style: {
										marginLeft: 10,
									}
								}}
								value={data.role}
								fullWidth
								onChange={(e) => {
								console.log("VALUE: ", e.target.value)
								setUser(data.id, "role", e.target.value)
							}}
										style={{ backgroundColor: theme.palette.surfaceColor, color: "white", height: "50px" }}
										>
							<MenuItem style={{ backgroundColor: theme.palette.inputColor, color: "white" }} value={"admin"}>
								Admin
										</MenuItem>
							<MenuItem style={{ backgroundColor: theme.palette.inputColor, color: "white" }} value={"user"}>
								User
										</MenuItem>
									</Select>}
								style = {{ minWidth: 150, maxWidth: 150}}
							/>
							<ListItemText
					primary={data.active ? "True" : "False"}
					style={{ minWidth: 180, maxWidth: 180 }}
				/>
				<ListItemText style={{ display: "flex" }}>
					<Button
						style={{}}
						variant="outlined"
						color="primary"
						onClick={() => {
							setSelectedUserModalOpen(true)
							setSelectedUser(data)
						}}
					>
						Edit user
								</Button>
				</ListItemText>
						</ListItem>
					)
				})}
			</List>
		</div>
		: null

	const schedulesView = curTab === 3 ?
		<div>
			<div style={{marginTop: 20, marginBottom: 20,}}>
				<h2 style={{display: "inline",}}>Schedules</h2>
				<span style={{marginLeft: 25}}>Schedules used in Workflows. Makes locating and control easier.</span>
			</div>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor}}/>
			<List>
				<ListItem>
					<ListItemText
						primary="Interval (seconds)"
						style={{maxWidth: 200}}
					/>
					<ListItemText
						primary="Argument"
						style={{maxWidth: 400, overflow: "hidden"}}
					/>
					<ListItemText
						primary="Actions"
					/>
				</ListItem>
				{schedules === undefined || schedules === null ? null : schedules.map(schedule => {
					return (
						<ListItem>
							<ListItemText
								style={{maxWidth: 200}}
								primary={schedule.seconds}
							/>
							<ListItemText
								primary={schedule.argument}
								style={{maxWidth: 400, overflow: "hidden"}}
							/>
							<ListItemText>
								<Button 
									style={{}} 
									variant="contained"
									color="primary"
									onClick={() => deleteSchedule(schedule)}
								>
									Delete	
								</Button>
							</ListItemText>
						</ListItem>
					)
				})}
			</List>
		</div>
		: null

	const appCategoryView = curTab === 6 ?
		<div>
			<div style={{marginTop: 20, marginBottom: 20,}}>
				<h2 style={{display: "inline",}}>Categories</h2>
				<span style={{marginLeft: 25}}>
					Categories are the categories supported by Shuffle, which are mapped to apps and workflows	
				</span>
			</div>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor}}/>
			<List>
				<ListItem>
					<ListItemText
						primary="Category"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Apps"
						style={{minWidth: 250, maxWidth: 250}}
					/>
					<ListItemText
						primary="Workflows"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Authentication"
						style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
					/>
					<ListItemText
						primary="Actions"
						style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
					/>
				</ListItem>
				{categories.map(data => {
					if (data.apps.length === 0) {
						return null
					}

					return (
						<ListItem>
							<ListItemText
								primary={data.name}
								style={{minWidth: 150, maxWidth: 150}}
							/>
							<ListItemText
								primary={""}
								style={{minWidth: 250, maxWidth: 250}}
							/>
							<ListItemText
								primary={""}
								style={{minWidth: 150, maxWidth: 150}}
							/>
							<ListItemText
								primary={""}
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
							/>
							<ListItemText
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
							>
								<Button 
									style={{}} 
									variant="outlined"
									color="primary"
									onClick={() => {
										console.log("Show apps with this category")
									}}
								>
									Find app ({data.apps.length})
								</Button>
							</ListItemText>
						</ListItem>
					)
				})}
			</List>
		</div>
		: null

	const authenticationView = curTab === 1 ?
		<div>
			<div style={{marginTop: 20, marginBottom: 20,}}>
				<h2 style={{display: "inline",}}>App Authentication</h2>
				<span style={{marginLeft: 25}}>Control the authentication options for individual apps. <b>Actions can be destructive!</b></span>
			</div>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor}}/>
			<List>
				<ListItem>
					<ListItemText
						primary="Icon"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Label"
						style={{minWidth: 250, maxWidth: 250}}
					/>
					<ListItemText
						primary="App Name"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Workflows"
						style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
					/>
					<ListItemText
						primary="Action amount"
						style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
					/>
					<ListItemText
						primary="Fields"
						style={{minWidth: 200, maxWidth: 200, overflow: "hidden"}}
					/>
					<ListItemText
						primary="Actions"
					/>
				</ListItem>
				{authentication === undefined ? null : authentication.map(data => {
					return (
						<ListItem>
							<ListItemText
								primary=<img alt="" src={data.app.large_image} style={{maxWidth: 50,}} />
								style={{minWidth: 150, maxWidth: 150}}
							/>
							<ListItemText
								primary={data.label}
								style={{minWidth: 250, maxWidth: 250}}
							/>
							<ListItemText
								primary={data.app.name}
								style={{minWidth: 150, maxWidth: 150}}
							/>
							<ListItemText
								primary={data.usage.length}
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
							/>
							<ListItemText
								primary={data.node_count}
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
							/>
							<ListItemText
								primary={data.fields.map(data => {
									return data.key
								}).join(", ")}
								style={{minWidth: 200, maxWidth: 200, overflow: "hidden"}}
							/>
							<ListItemText>
								<Button 
									style={{}} 
									variant="outlined"
									color="primary"
									onClick={() => {
										deleteAuthentication(data)
									}}
								>
									Delete	
								</Button>
							</ListItemText>
						</ListItem>
					)
				})}
			</List>
		</div>
		: null

	const environmentView = curTab === 2 ?
		<div>
			<div style={{marginTop: 20, marginBottom: 20,}}>
				<h2 style={{display: "inline",}}>Environments</h2>
				<span style={{marginLeft: 25}}>Decides what Orborus environment to execute an action in a workflow in.</span>
			</div>
			<Button 
				style={{}} 
				variant="contained"
				color="primary"
				onClick={() => setModalOpen(true)}
			> 
				Add environment 
			</Button>
			<Button 
				style={{marginLeft: 5, marginRight: 15, }} 
				variant="contained"
				color="primary"
				onClick={() => getEnvironments()}
			> 
				<CachedIcon />
			</Button>
			<Switch checked={showArchived} onChange={() => {setShowArchived(!showArchived)}} />	Show archived
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor}}/>
			<List>
				<ListItem>
					<ListItemText
						primary="Name"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Orborus running (TBD)"
						style={{minWidth: 200, maxWidth: 200}}
					/>
					<ListItemText
						primary="Default"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Actions"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Archived"
						style={{minWidth: 150, maxWidth: 150}}
					/>
				</ListItem>
				{environments === undefined ? null : environments.map((environment, index)=> {
					if (!showArchived && environment.archived) {
						return null	
					}

					if (environment.archived === undefined) {
						getEnvironments()
						return null
					}

					return (
						<ListItem key={index}>
							<ListItemText
								primary={environment.Name}
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
							/>
							<ListItemText
								primary={"TBD"}
								style={{minWidth: 200, maxWidth: 200, overflow: "hidden"}}
							/>
							<ListItemText
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
								primary={environment.default ? "true" : null}
							>
								{environment.default ? 
									null
									: 
									<Button variant="outlined" style={{borderRadius: "0px"}} onClick={() => setDefaultEnvironment(environment.Name)} color="primary">Set default</Button>
								}
							</ListItemText>
							<ListItemText
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
							>
								<Button variant="outlined" style={{borderRadius: "0px"}} onClick={() => deleteEnvironment(environment.Name)} color="primary">Delete</Button>
							</ListItemText>
							<ListItemText
								style={{minWidth: 150, maxWidth: 150, overflow: "hidden"}}
								primary={environment.archived.toString()}
							/>
						</ListItem>
					)
				})}
			</List>
		</div>
		: null

	console.log("Userdata: ", props.userdata)
	const organizationsTab = curTab === 5 ?
		<div>
			<div style={{marginTop: 20, marginBottom: 20,}}>
				<h2 style={{display: "inline",}}>Organizations</h2>
				<span style={{marginLeft: 25}}>Global admin: control organizations</span>
			</div>
			<Button 
				style={{}} 
				variant="contained"
				color="primary"
				disabled
				onClick={() => {
					setModalOpen(true)
				}}
			> 
				Add organization 
			</Button>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor}}/>
			<List>
				<ListItem>
					<ListItemText
						primary="Name"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="id"
						style={{minWidth: 200, maxWidth: 200}}
					/>
					<ListItemText
						primary="Your role"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Selected"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Cloud Sync"
						style={{minWidth: 150, maxWidth: 150}}
					/>
				</ListItem>
				{props.userdata !== undefined && props.userdata.orgs !== null && props.userdata.orgs !== undefined && props.userdata.orgs.length > 0 ? 
					<span>
						{props.userdata.orgs.map((data, index) => {
							const isSelected = props.userdata.selected_org === undefined ? "False" : props.userdata.selected_org.id === data.id ? "True" : "False"

							return (
								<ListItem key={index}>
									<ListItemText
										primary={data.name}
										style={{minWidth: 150, maxWidth: 150}}
									/>
									<ListItemText
										primary={data.id}
										style={{minWidth: 200, maxWidth: 200}}
									/>
									<ListItemText
										primary={data.role}
										style={{minWidth: 150, maxWidth: 150}}
									/>
									<ListItemText
										primary={isSelected}
										style={{minWidth: 150, maxWidth: 150}}
									/>
									<ListItemText
										primary=<Switch checked={data.cloud_sync} onChange={() => {
											setCloudSyncModalOpen(true)
											setSelectedOrganization(data)
											console.log("INVERT CLOUD SYNC")
										}} />
										style={{minWidth: 150, maxWidth: 150}}
									/>
								</ListItem>
							)
						
					})}
				</span>
				: 
				null
				}
				{organizations !== undefined && organizations !== null && organizations.length > 0 ? 
					<span>
						{organizations.map((data, index) => {
							const isSelected = props.userdata.selected_org === undefined ? "False" : props.userdata.selected_org.id === data.id ? "True" : "False"

							return (
								<ListItem key={index}>
									<ListItemText
										primary={data.name}
										style={{minWidth: 150, maxWidth: 150}}
									/>
									<ListItemText
										primary={data.id}
										style={{minWidth: 200, maxWidth: 200}}
									/>
									<ListItemText
										primary={data.role}
										style={{minWidth: 150, maxWidth: 150}}
									/>
									<ListItemText
										primary={isSelected}
										style={{minWidth: 150, maxWidth: 150}}
									/>
									<ListItemText
										primary=<Switch checked={data.cloud_sync} onChange={() => {
											setCloudSyncModalOpen(true)
											setSelectedOrganization(data)
											console.log("INVERT CLOUD SYNC")
										}} />
										style={{minWidth: 150, maxWidth: 150}}
									/>
								</ListItem>
							)
						})}
					</span>
				: null}
			</List>
		</div>
		: null

	const hybridTab = curTab === 4 ?
		<div>
			<div style={{marginTop: 20, marginBottom: 20,}}>
				<h2 style={{display: "inline",}}>Hybrid</h2>
				<span style={{marginLeft: 25}}></span>
			</div>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor}}/>
			<List>
				<ListItem>
					<ListItemText
						primary="Name"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Orborus running (TBD)"
						style={{minWidth: 200, maxWidth: 200}}
					/>
					<ListItemText
						primary="Actions"
						style={{minWidth: 150, maxWidth: 150}}
					/>
				</ListItem>
				<ListItem>
					<ListItemText
						primary="Enabled"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="false"
						style={{minWidth: 200, maxWidth: 200}}
					/>
					<ListItemText
						primary=<Switch checked={false} onChange={() => {console.log("INVERT")}} />
						style={{minWidth: 150, maxWidth: 150}}
					/>
				</ListItem>
			</List>
		</div>
		: null

		// primary={environment.Registered ? "true" : "false"}

	const setConfig = (event, newValue) => {
		if (newValue === 1) {
			getAppAuthentication()
		} else if (newValue === 2) {
			getEnvironments()
		} else if (newValue === 3) {
			getSchedules()
		} else if (newValue === 5) {
			getOrgs() 
		}

		if (newValue === 6) {
			console.log("Should get apps for categories.")
		}

		setModalUser({})
		setCurTab(newValue)
	}

	const iconStyle = {marginRight: 10}
	const data = 
		<div style={{minWidth: 1366, margin: "auto"}}>
			<Paper style={paperStyle}>
				<Tabs
					value={curTab}
					indicatorColor="primary"
					onChange={setConfig}
					aria-label="disabled tabs example"
				>
					<Tab label=<span><AccessibilityNewIcon style={iconStyle} />Users</span> />
					<Tab label=<span><LockIcon style={iconStyle} />App Authentication</span>/>
					<Tab label=<span><EcoIcon style={iconStyle} />Environments</span>/>
					<Tab label=<span><ScheduleIcon style={iconStyle} />Schedules</span> />
					{window.location.protocol == "http:" && window.location.port === "3000" ? <Tab label=<span><CloudIcon style={iconStyle} /> Hybrid</span>/> : null}
					{window.location.protocol == "http:" && window.location.port === "3000" ? <Tab label=<span><BusinessIcon style={iconStyle} /> Organizations</span>/> : null}
					{window.location.protocol === "http:" && window.location.port === "3000" ? <Tab label=<span><LockIcon style={iconStyle} />Categories</span>/> : null}
				</Tabs>
				<Divider style={{marginTop: 0, marginBottom: 10, backgroundColor: "rgb(91, 96, 100)"}} />
				<div style={{padding: 15}}>
					{authenticationView}
					{appCategoryView}
					{usersView}	
					{environmentView}
					{schedulesView}
					{hybridTab}
					{organizationsTab}
				</div>
			</Paper>
		</div>

	return (
		<div>
			{modalView}
			{cloudSyncModal}
			{editUserModal}
			{editAuthenticationModal}
			{data}
		</div>
	)
}

export default Admin 
