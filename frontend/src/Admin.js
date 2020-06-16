import React, { useEffect} from 'react';

import Paper from '@material-ui/core/Paper';
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

	const alert = useAlert()

	const deleteSchedule = (data) => {
		// FIXME - add some check here ROFL
		console.log("INPUT: ", data)

		// Just use this one?
		const url = globalUrl+'/api/v1/workflows/'+data["workflow_id datastore:"]+"/schedule/"+data.id
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
				alert.success("Deleted user "+data.id)
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
		const url = baseurl+'/api/v1/register';
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
						primary="Password"
						style={{minWidth: 180, maxWidth: 180}}
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
					console.log("USER: ", data)
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
								primary="**************"
								style={{minWidth: 180, maxWidth: 180}}
							/>
							<ListItemText
								primary={data.role}
								style={{minWidth: 150, maxWidth: 150}}
							/>
							<ListItemText
								primary={data.active ? "True" : "False"}
								style={{minWidth: 180, maxWidth: 180}}
								onClick={() => console.log("Should set user to active")}
							/>
							<ListItemText>
								<Button 
									style={{}} 
									variant="contained"
									color="primary"
									onClick={() => deleteUser(data)}
								>
									{data.active ? "Deactivate" : "Activate"}	
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
			{data}
		</div>
	)
}

export default Admin 
