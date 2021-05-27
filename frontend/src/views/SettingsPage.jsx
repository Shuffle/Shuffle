import React, {useState, useEffect} from 'react';

import {Paper, Button, Divider, TextField} from '@material-ui/core';
import {Link} from 'react-router-dom';
import { useAlert } from "react-alert";
import { useTheme } from '@material-ui/core/styles';

const Settings = (props) => {
  const { globalUrl, isLoaded, userdata, } = props;
	const theme = useTheme();
	const alert = useAlert()

	const [username, setUsername] = useState("");
	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [title, setTitle] = useState("");
	const [companyname, setCompanyname] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newPassword2, setNewPassword2] = useState("");

	// Used for error messages etc
	const [formMessage, ] = useState("");
	const [passwordFormMessage, setPasswordFormMessage] = useState("");

	const [firstrequest, setFirstRequest] = useState(true)

	const [userInfo, ] = useState(userdata)
	const [userSettings, setUserSettings] = useState({})
	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" 

	const bodyDivStyle = {
		margin: "auto",
		textAlign: "center",
		width: "1100px",
	}
	
	const boxStyle = {
		flex: "1",
		color: "white",
		marginLeft: "10px",
		marginRight: "10px",
		paddingLeft: "30px",
		paddingRight: "30px",
		paddingBottom: "30px",
		paddingTop: "30px",
		backgroundColor: theme.palette.surfaceColor,
		display: "flex", 
		flexDirection: "column"
	}
	
	const onPasswordChange = () => {
		const data = {"username": userSettings.username, "currentpassword": currentPassword, "newpassword": newPassword, "newpassword2": newPassword2}
		const url = globalUrl+'/api/v1/passwordchange';
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
					setPasswordFormMessage(responseJson["reason"])
				} else {
					alert.success("Changed password!")
					setPasswordFormMessage("")
				}
			}),
		)
		.catch(error => {
			setPasswordFormMessage("Something went wrong.")
		});
	}

	const generateApikey = () => {
		fetch(globalUrl+"/api/v1/generateapikey", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			setUserSettings(responseJson)
    	})
		.catch(error => {
    		console.log(error)
		});
	}

	const getSettings = () => {
		fetch(globalUrl+"/api/v1/getsettings", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
				credentials: "include",
			})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			setUserSettings(responseJson)
    	})
		.catch(error => {
    		console.log(error)
		});
	}

	// Gotta be a better way of doing this rofl
	const setFields = () => {
		if (userInfo.username !== undefined) {
			if (userInfo.username.length > 0) {
				setUsername(userInfo.username)
			}
			//if (userInfo.firstname.length > 0) {
			//	setFirstname(userInfo.firstname)
			//}
			//if (userInfo.lastname.length > 0) {
			//	setLastname(userInfo.lastname)
			//}
			//if (userInfo.title.length > 0) {
			//	setTitle(userInfo.title)
			//}
			//if (userInfo.companyname.length > 0) {
			//	setCompanyname(userInfo.companyname)
			//}
			//if (userInfo.phone.length > 0) {
			//	setPhone(userInfo.phone)
			//}
			//if (userInfo.email.length > 0) {
			//	setEmail(userInfo.email)
			//}
		}
	}

	// This should "always" have data
	useEffect(() => {
		if (firstrequest) {
			setFirstRequest(false)
			getSettings()
		}

		if (Object.getOwnPropertyNames(userInfo).length > 0 && (username === "" && email === "")) { 
			setFields()
		} 
	})

	// Random names for type & autoComplete. Didn't research :^)
	const landingpageData = 
			<div style={{display: "flex", marginTop: "80px"}}>
				<Paper style={boxStyle}>
					<h2>APIKEY</h2>
					<a target="_blank" href="/docs/API#authentication" style={{textDecoration: "none", color: "#f85a3e"}}>What is the API key used for?</a>
					<TextField
						style={{backgroundColor: theme.palette.inputColor, flex: "1"}}
						InputProps={{
							style:{
								height: "50px", 
								color: "white",
							},
						}}
						color="primary"
						value={userSettings.apikey}
						required
						disabled
						fullWidth={true}
						placeholder="APIKEY"
						id="standard-required"
						margin="normal"
						variant="outlined"
					/>
					<Button
						style={{width: "100%", height: "40px", marginTop: "10px"}}
						variant="contained"
						color="primary"
						onClick={() => generateApikey()}
					>Re-Generate APIKEY</Button>
					<Divider style={{marginTop: "40px"}}/>
					{/*
					<h2>Settings</h2>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1"}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							value={username}
							placeholder="Username"
							type="username"
						  	id="standard-required"
							autoComplete="username"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setUsername(e.target.value)}
						/>
					</div>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginRight: "15px"}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							value={firstname}
							placeholder="First Name"
							type="firstname"
						  	id="standard-required"
							autoComplete="firstname"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setFirstname(e.target.value)}
						/>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginLeft: "15px"}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							value={lastname}
							fullWidth={true}
							placeholder="Last Name"
							type="lastname"
						  	id="standard-required"
							autoComplete="lastname"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setLastname(e.target.value)}
						/>
					</div>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginRight: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							placeholder="Job Title"
							value={title}
							type="jobtitle"
						  	id="standard-required"
							autoComplete="jobtitle"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setTitle(e.target.value)}
						/>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginLeft: "15px"}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							type="companyname"
							value={companyname}
							placeholder="Company Name"
						  	id="standard-required"
							autoComplete="companyname"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setCompanyname(e.target.value)}
						/>
					</div>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginRight: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							placeholder="Email"
							type="email"
							value={email}
						  	id="standard-required"
							autoComplete="email"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setEmail(e.target.value)}
						/>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginLeft: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							type="phone"
							value={phone}
							placeholder="Phone number"
						  	id="standard-required"
							autoComplete="phone"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setPhone(e.target.value)}
						/>
					</div>
					<Button
						disabled={firstname.length <= 0 || lastname.length <= 0 || title.length <= 0 || companyname.length <= 0 || email.length <= 0 || phone.length <= 0}
						style={{width: "100%", height: "40px", marginTop: "10px"}}
						variant="contained"
						color="primary"
						onClick={() => console.log("SUBMIT NORMAL INFO!!")}
					>
					Submit	
					</Button>
					<h3>{formMessage}</h3>
					<Divider />
					*/}
					<h2>Password</h2>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1"}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							placeholder="Current Password"
							type="password"
						  	id="standard-required"
							autoComplete="password"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setCurrentPassword(e.target.value)}
						/>
					</div>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginRight: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
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
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginLeft: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							type="password"
							placeholder="Repeat new password"
						  	id="standard-required"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setNewPassword2(e.target.value)}
						/>
					</div>
					<Button
						disabled={(isCloud && (newPassword.length < 10 || newPassword2.length < 10 || currentPassword.length < 10)) || newPassword !== newPassword2 || newPassword.length === 0}
						style={{width: "100%", height: "60px", marginTop: "10px"}}
						variant="contained"
						color="primary"
						onClick={() => onPasswordChange()}
					>
					Submit password change
					</Button>
					<h3>{passwordFormMessage}</h3>
				</Paper>
			</div>

	const loadedCheck = isLoaded && !firstrequest ?  
		<div style={bodyDivStyle}>
			{landingpageData}
		</div>
		:
		<div>
		</div>

	return(
		<div>
			{loadedCheck}
		</div>
	)
}
export default Settings;
