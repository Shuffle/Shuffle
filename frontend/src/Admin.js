import React, { useEffect} from 'react';

import {Link} from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
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

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';


const surfaceColor = "#27292D"
const inputColor = "#383B40"
const Admin = (props) => {
  const { globalUrl, } = props;
	const [firstRequest, setFirstRequest] = React.useState(true);
	const [modalUser, setModalUser] = React.useState({});
	const [modalOpen, setModalOpen] = React.useState(false);
	const [loginInfo, setLoginInfo] = React.useState("");
	const [curTab, setCurTab] = React.useState(0);
	const [users, setUsers] = React.useState([]);
	const [environments, setEnvironments] = React.useState([]);
	const [schedules, setSchedules] = React.useState([])
	const [selectedUser, setSelectedUser] = React.useState({})
	const [newPassword, setNewPassword] = React.useState("");
	const [selectedUserModalOpen, setSelectedUserModalOpen] = React.useState(false)

	const alert = useAlert()

	const deleteSchedule = (data) => {
		// FIXME - add some check here ROFL
		console.log("INPUT: ", data)

		// Just use this one?
		const url = globalUrl+'/api/v1/workflows/'+data["workflow_id"]+"/schedule/"+data.id
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

	const onPasswordChange = () => {
		const data = {"username": selectedUser.username, "newpassword": newPassword}
		const url = globalUrl+'/api/v1/users/passwordchange';
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
					alert.success("Changed password!")
				}
			}),
		)
		.catch(error => {
			alert.error("Err: "+error.toString())
		});
	}

	const deleteUser = (data) => {
		// Just use this one?
		const url = globalUrl+'/api/v1/users/'+data.id
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
		// FIXME - add some check here ROFL
		console.log("INPUT: ", data)

		// Just use this one?
		var data = {"username": data.Username, "password": data.Password}
		var baseurl = globalUrl
		const url = baseurl+'/api/v1/users/register';
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
					setLoginInfo("Error in input: "+responseJson.reason)
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

	const deleteEnvironment = (name) => {
		// FIXME - add some check here ROFL
		var newEnv = []
		for (var key in environments) {
			if (environments[key].Name == name) {
				continue
			}

			newEnv.push(environments[key])
		}

		// Just use this one?
		const url = globalUrl+'/api/v1/setenvironments';
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
				} else {
					setLoginInfo("")
					setModalOpen(false)
					getEnvironments()
				}
			}),
		)
		//.catch(error => {
		//	console.log("Error in userdata: ", error)
		//});
	}

	const submitEnvironment = (data) => {
		// FIXME - add some check here ROFL
		environments.push({"name": data.environment, "type": "onprem"})

		// Just use this one?
		var baseurl = globalUrl
		const url = baseurl+'/api/v1/setenvironments';
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
					setLoginInfo("Error in input: "+responseJson.reason)
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
		fetch(globalUrl+"/api/v1/workflows/schedules", {
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

	const getEnvironments = () => {
		fetch(globalUrl+"/api/v1/getenvironments", {
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

	const getUsers = () => {
		fetch(globalUrl+"/api/v1/getusers", {
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
			console.log(responseJson)
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
		backgroundColor: surfaceColor,
		marginBottom: 10, 
		padding: 20,
	}

	const changeModalData = (field, value) => {
		modalUser[field] = value
	}

	const setUser = (userId, field, value) => {
		const data = {"user_id": userId}
		data[field] = value
		console.log("DATA: ", data)

		fetch(globalUrl+"/api/v1/users/updateuser", {
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
				alert.error("Failed setting user: "+responseJson.reason)
			} else {
				alert.success("Set the user field "+field+" to "+value)
			}
    })
		.catch(error => {
    		console.log(error)
		});
	}



	const generateApikey = (userId) => {
		const data = {"user_id": userId}

		fetch(globalUrl+"/api/v1/generateapikey", {
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
				alert.error("Failed getting new: "+responseJson.reason)
			} else {
				alert.success("Got new API key")
			}
    })
		.catch(error => {
    		console.log(error)
		});
	}

	const editUserModal = 
		<Dialog modal 
			open={selectedUserModalOpen}
			onClose={() => {setSelectedUserModalOpen(false)}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle><span style={{color: "white"}}>Edit user</span></DialogTitle>
			<DialogContent>
				<div style={{display: "flex"}}>
					<TextField
						style={{backgroundColor: inputColor, flex: 3}}
						InputProps={{
							style:{
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
						style={{maxHeight: 50, flex: 1}}
						variant="outlined"
						color="primary"
						onClick={() => onPasswordChange()}
					>
						Submit 
					</Button>
				</div>
				<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: inputColor}}/>
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

	const modalView = 
		<Dialog modal 
			open={modalOpen}
			onClose={() => {setModalOpen(false)}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle><span style={{color: "white"}}>Add user</span></DialogTitle>
			<DialogContent>
				{curTab === 0 ? 
					<div>
						Username
						<TextField
							color="primary"
							style={{backgroundColor: inputColor}}
							autoFocus
							InputProps={{
								style:{
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
							style={{backgroundColor: inputColor}}
							InputProps={{
								style:{
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
				: curTab === 1 ?
				<div>
					Environment Name	
					<TextField
						color="primary"
						style={{backgroundColor: inputColor}}
						autoFocus
						InputProps={{
							style:{
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
				: null }
				{loginInfo}
			</DialogContent>
			<DialogActions>
				<Button style={{borderRadius: "0px"}} onClick={() => setModalOpen(false)} color="primary">
					Cancel
				</Button>
				<Button variant="contained" style={{borderRadius: "0px"}} onClick={() => {
					if (curTab === 0) {
						submitUser(modalUser)
					} else if (curTab === 1) {
						submitEnvironment(modalUser)
					}
				}} color="primary">
					Submit	
				</Button>
			</DialogActions>
		</Dialog>

	const usersView = curTab === 0 ?
		<div>
			<h2>	
				User management
			</h2>
			<Button 
				style={{}} 
				variant="contained"
				color="primary"
				onClick={() => setModalOpen(true)}
			> 
				Add user	
			</Button>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: inputColor}}/>
			<List>
				<ListItem>
					<ListItemText
						primary="Username"
						style={{minWidth: 200, maxWidth: 200}}
					/>
					<ListItemText
						primary="API key"
						style={{minWidth: 350, maxWidth: 350, overflow: "hidden"}}
					/>
					<ListItemText
						primary="Role"
						style={{minWidth: 150, maxWidth: 150}}
					/>
					<ListItemText
						primary="Active"
						style={{minWidth: 180, maxWidth: 180}}
					/>
					<ListItemText
						primary="Actions"
						style={{minWidth: 180, maxWidth: 180}}
					/>
				</ListItem>
				{users === undefined ? null : users.map(data => {
					return (
						<ListItem>
							<ListItemText
								primary={data.username}
								style={{minWidth: 200, maxWidth: 200}}
							/>
							<ListItemText
								primary={data.apikey === undefined || data.apikey.length === 0 ? "" : data.apikey}
								style={{maxWidth: 350, minWidth: 350,}}
							/>
							<ListItemText
								primary=
									<Select
										PaperProps={{
											style: {
											}
										}}
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
										style={{backgroundColor: surfaceColor, color: "white", height: "50px"}}
										>
										<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={"admin"}>
											Admin
										</MenuItem>
										<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={"user"}>
											User
										</MenuItem>
									</Select>
								style={{minWidth: 150, maxWidth: 150}}
							/>
							<ListItemText
								primary={data.active ? "True" : "False"}
								style={{minWidth: 180, maxWidth: 180}}
							/>
							<ListItemText style={{display: "flex"}}>
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

	const schedulesView = curTab === 2 ?
		<div>
			<h2>	
				Schedules	
			</h2>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: inputColor}}/>
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

	const environmentView = curTab === 1 ?
		<div>
			<h2>	
				Environments	
			</h2>
			<Button 
				style={{}} 
				variant="contained"
				color="primary"
				onClick={() => setModalOpen(true)}
			> 
				Add environment 
			</Button>
			<Divider style={{marginTop: 20, marginBottom: 20, backgroundColor: inputColor}}/>
			<List>
				{environments === undefined ? null : environments.map(environment => {
					return (
						<ListItem>
							<Button type="outlined" style={{borderRadius: "0px"}} onClick={() => deleteEnvironment(environment.Name)} color="primary">Delete</Button>
							- {environment.Name}
						</ListItem>
					)
				})}
			</List>
		</div>
		: null

	const setConfig = (event, newValue) => {
		if (newValue === 1) {
			getEnvironments()
		} else if (newValue === 2) {
			getSchedules()
		}

		setModalUser({})
		setCurTab(newValue)
	}

	const data = 
		<div style={{minWidth: 1366, margin: "auto"}}>
			<Paper style={paperStyle}>
				<Tabs
					value={curTab}
					indicatorColor="primary"
					textColor="white"
					onChange={setConfig}
					aria-label="disabled tabs example"
				>
					<Tab label="Users" />
					<Tab label="Environments"/>
					<Tab label="Schedules"/>
				</Tabs>
				<div style={{marginBottom: 10}}/>
				{usersView}	
				{environmentView}
				{schedulesView}
			</Paper>
		</div>

	return (
		<div>
			{modalView}
			{editUserModal}
			{data}
		</div>
	)
}

export default Admin 
