import React, { useState } from 'react';
import { BrowserView, MobileView } from "react-device-detect";

import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';

import TextField from '@material-ui/core/TextField';

import { useTheme } from '@material-ui/core/styles';

const bodyDivStyle = {
	margin: "auto",
	textAlign: "center",
	width: "900px",
}


// Should be different if logged in :|
const Contact = (props) => {
	const { globalUrl, isLoaded } = props;
	
	const theme = useTheme();

	const boxStyle = {
		flex: "1",
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

	const bodyTextStyle = {
		color: "#ffffff",
	}

	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [title, setTitle] = useState("");
	const [companyname, setCompanyname] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [message, setMessage] = useState("");

	const [formMessage, setFormMessage] = useState("");

	const submitContact = () => {
		const data = {
			"firstname": firstname,
			"lastname": lastname,
			"title": title,
			"companyname": companyname,
			"email": email,
			"phone": phone,
			"message": message,
		}
		console.log(data)

		fetch(globalUrl + "/api/v1/contact", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(response => response.json())
			.then(response => {
				if (response.success === true) {
					setFormMessage(response.message)
				} else {
					setFormMessage("Something went wrong. Please contact frikky@shuffler.io.")
				}
				console.log(response)
			})
			.catch(error => {
				console.log(error)
			});
	}

	// Random names for type & autoComplete. Didn't research :^)
	const landingpageDataBrowser =
		<div>
			<div style={bodyTextStyle}>
				<h3 style={{ color: "#f85a3e" }}>Contact us</h3>
				<h2>Lets talk!</h2>
			</div>
			<div style={{ display: "flex" }}>
				<Paper style={boxStyle}>
					<h2>Contact Details</h2>
					<div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
						<TextField
							required
							style={{ flex: "1", marginRight: "15px", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="First Name"
							type="firstname"
							id="standard-required"
							autoComplete="firstname"
							margin="normal"
							variant="outlined"
							onChange={e => setFirstname(e.target.value)}
						/>
						<TextField
							style={{ flex: "1", marginLeft: "15px", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Last Name"
							type="lastname"
							id="standard"
							autoComplete="lastname"
							margin="normal"
							variant="outlined"
							onChange={e => setLastname(e.target.value)}
						/>
					</div>
					<div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
						<TextField
							style={{ flex: "1", marginRight: "15px", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Job Title"
							type="jobtitle"
							id="standard-required"
							autoComplete="jobtitle"
							margin="normal"
							variant="outlined"
							onChange={e => setTitle(e.target.value)}
						/>
						<TextField
							style={{ flex: "1", marginLeft: "15px", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							type="companyname"
							placeholder="Company Name"
							id="standard-required"
							autoComplete="companyname"
							margin="normal"
							variant="outlined"
							onChange={e => setCompanyname(e.target.value)}
						/>
					</div>
					<div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
						<TextField
							required
							style={{ flex: "1", marginRight: "15px", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Email"
							type="email"
							id="standard-required"
							autoComplete="email"
							margin="normal"
							variant="outlined"
							onChange={e => setEmail(e.target.value)}
						/>
						<TextField
							style={{ flex: "1", marginLeft: "15px", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							type="phone"
							placeholder="Phone number"
							id="standard-required"
							autoComplete="phone"
							margin="normal"
							variant="outlined"
							onChange={e => setPhone(e.target.value)}
						/>
					</div>
					<div style={{ flex: 1 }}>
						<h2>Message</h2>
					</div>
					<div style={{ flex: 4 }}>
						<TextField
							multiline
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							style={{ flex: "1", backgroundColor: theme.palette.inputColor }}
							rows="6"
							fullWidth={true}
							placeholder="What can we help you with?"
							id="filled-multiline-static"
							margin="normal"
							variant="outlined"
							onChange={e => setMessage(e.target.value)}
						/>
					</div>
					<Button
						disabled={email.length <= 0 || message.length <= 0}
						style={{ width: "100%", height: "60px", marginTop: "10px" }}
						variant="contained"
						color="primary"
						onClick={submitContact}
					>
						Submit
					</Button>
					<h3>{formMessage}</h3>
				</Paper>
			</div>
		</div>

	const landingpageDataMobile =
		<div style={{ paddingBottom: "50px" }}>
			<div style={{ color: "white", textAlign: "center" }}>
				<h3 style={{ color: "#f85a3e" }}>Contact us</h3>
				<h2>Lets talk!</h2>
			</div>
			<div style={{ display: "flex" }}>
				<Paper style={boxStyle}>
					<h2>Contact Details</h2>
					<div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
						<TextField
							required
							style={{ flex: "1", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Name"
							type="firstname"
							id="standard-required"
							autoComplete="firstname"
							margin="normal"
							variant="outlined"
							onChange={e => setFirstname(e.target.value)}
						/>
					</div>
					<div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
						<TextField
							required
							style={{ flex: "1", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Email"
							type="email"
							id="standard-required"
							autoComplete="email"
							margin="normal"
							variant="outlined"
							onChange={e => setEmail(e.target.value)}
						/>
					</div>
					<div style={{ flex: 1 }}>
						<h2>Message</h2>
					</div>
					<div style={{ flex: 4 }}>
						<TextField
							multiline
							style={{ flex: "1", backgroundColor: theme.palette.inputColor }}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							color="primary"
							rows="6"
							fullWidth={true}
							placeholder="What can we help you with?"
							id="filled-multiline-static"
							margin="normal"
							variant="outlined"
							onChange={e => setMessage(e.target.value)}
						/>
					</div>
					<Button
						disabled={email.length <= 0 || message.length <= 0}
						style={{ width: "100%", height: "60px", marginTop: "10px" }}
						variant="contained"
						color="primary"
						onClick={submitContact}
					>
						Submit
					</Button>
					<h3>{formMessage}</h3>
				</Paper>
			</div>
		</div>


	const loadedCheck = isLoaded ?
		<div>
			<BrowserView>
				<div style={bodyDivStyle}>{landingpageDataBrowser}</div>
			</BrowserView>
			<MobileView>
				{landingpageDataMobile}
			</MobileView>
		</div>
		:
		<div>
		</div>

	return (
		<div>
			{loadedCheck}
		</div>
	)
}
export default Contact;
