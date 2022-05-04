import React, {useState} from 'react';
import { useAlert } from "react-alert";
import {BrowserView, MobileView} from "react-device-detect";
import {Paper, Button, Typography, TextField} from '@material-ui/core';

const bodyDivStyle = {
	margin: "auto",
	textAlign: "center",
	width: "900px",
}

// Should be different if logged in :|
const Contact = (props) => {
  const { globalUrl, surfaceColor, newColor, mini, textColor, inputColor} = props;
	const alert = useAlert()
	
	const minimize = mini !== undefined && mini
	const textcolor = textColor !== undefined ? textColor : "#ffffff"
	const inputcolor = newColor !== undefined ? newColor : inputColor

	const boxStyle = {
		flex: "1",
		marginLeft: "10px",
		marginRight: "10px",
		paddingLeft: "30px",
		paddingRight: "30px",
		paddingBottom: "30px",
		paddingTop: "30px",
		backgroundColor: surfaceColor,
		display: "flex", 
		flexDirection: "column"
	}
	
	const bodyTextStyle = {
		color: "#ffffff",	
	}

	const [firstname, setFirstname] = useState("");
	const [lastname, ] = useState("");
	const [title, ] = useState("");
	const [companyname, ] = useState("");
	const [email, setEmail] = useState("");
	const [phone, ] = useState("");
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

		fetch(globalUrl+"/api/v1/contact", {
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
				alert.info("Thanks for submitting!")
				setMessage("")
				//setEmail("")
				//setName("")
			} else {
				const msg = "Something went wrong. Please contact frikky@shuffler.io directly."
				if (response.reason !== undefined && response.reason !== null) {
					setFormMessage(response.reason)
				} else {
					setFormMessage(msg)
					alert.error(msg)
				}
			}
    })
		.catch(error => {
    		console.log(error)
		});
	}

	// Random names for type & autoComplete. Didn't research :^)
	const landingpageDataBrowser = 
		<div>
			<div style={{paddingTop: 100}}/>
			<div style={bodyTextStyle}>
				<Typography variant="body1" style={{color: "#f85a3e"}}>Contact us</Typography>
				<Typography variant="h6" >Lets talk!</Typography>
			</div>
			<div style={{display: "flex", marginTop: 15,}}>
				<Paper elevation={mini === true ? 0 : 0} style={boxStyle}>
					<Typography variant="h6" style={{color: "white", marginTop: 10, marginBottom: 10,}}>Contact Details</Typography>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							required
							style={{flex: "1", marginRight: "15px", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Name"
							type="firstname"
						  id={minimize ? "contact_name_mini" : "contact_name"}
							autoComplete="firstname"
							margin="normal"
							variant="outlined"
      	 			onChange={e => setFirstname(e.target.value)}
						/>
						<TextField
							required
							style={{flex: "1", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Email"
							type="email"
						  id={minimize ? "email_field_contact_mini" : "email_field_contact"}
							autoComplete="email"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setEmail(e.target.value)}
						/>
					</div>
					{/*
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							required
							style={{flex: "1", marginRight: "15px", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
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
							style={{flex: "1", marginLeft: "15px", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
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
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{flex: "1", marginRight: "15px", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
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
							style={{flex: "1", marginLeft: "15px", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
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
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							required
							style={{flex: "1", marginRight: "15px", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
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
							style={{flex: "1", marginLeft: "15px", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
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
					*/}
					<div style={{flex: 1}}>
						<Typography variant="h6" style={{color: "white", marginTop: 10, marginBottom: 10,}}>Message</Typography>
					</div>
					<div style={{flex: 4}}>
						<TextField
							multiline
							InputProps={{
								style:{
									color: textcolor,
								},
							}}
							color="primary"
							style={{flex: "1", backgroundColor: inputcolor}} 
							rows="6"
							fullWidth={true}
							placeholder="What can we help you with?"
							type="message"
							id="filled-multiline-static"
							margin="normal"
							variant="outlined"
      	 			onChange={e => setMessage(e.target.value)}
						/>
					</div>
					<Button
						disabled={email.length <= 0 || message.length <= 0}
						style={{width: "100%", height: "60px", marginTop: "10px"}}
						variant="contained"
						color="primary"
						onClick={submitContact}
					>
					Submit	
					</Button>
					<Typography variant="body1" style={{color: "white", marginTop: 10,}}>
						{formMessage}
					</Typography>
				</Paper>
			</div>
		</div>
	
	const landingpageDataMobile = 
		<div style={{paddingBottom: "50px"}}>
			{minimize ?  
			<div style={{color: textcolor, textAlign: "center"}}>
				<Typography variant="h4" style={{marginTop: 15, }}>Contact us</Typography>
			</div> 
			:
			<div style={{color: textcolor, textAlign: "center"}}>
				<h3 style={{}}>Contact us</h3>
				<h2>What can we do for you?</h2>
			</div> }
			<div style={{display: "flex", marginTop: 10,}}>
				<Paper elevation={mini === true ? 0 : 0} style={boxStyle}>
					<Typography variant="h6" style={{color: textcolor}}>Contact Details</Typography>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							required
							style={{flex: "1", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Name"
							type="firstname"
						  id="firstname"
							autoComplete="firstname"
							margin="normal"
							variant="outlined"
      	 			onChange={e => setFirstname(e.target.value)}
						/>
					</div>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							required
							style={{flex: "1", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
								},
							}}
							color="primary"
							fullWidth={true}
							placeholder="Email"
							type="email"
						  id="email-field-contact"
							autoComplete="email"
							margin="normal"
							variant="outlined"
      	 			onChange={e => setEmail(e.target.value)}
						/>
					</div>
					<div style={{flex: 1, marginTop: 20,}}>
						<Typography variant="h6" style={{color: textcolor}}>Message</Typography>
					</div>
					<div style={{flex: 4}}>
						<TextField
							multiline
							style={{flex: "1", backgroundColor: inputcolor}}
							InputProps={{
								style:{
									color: textcolor,
								},
							}}
							color="primary"
							rows="6"
							fullWidth={true}
							placeholder="What can we help you with?"
							id="filled-multiline-static"
							type="message"
							margin="normal"
							variant="outlined"
      	 			onChange={e => setMessage(e.target.value)}
						/>
					</div>
					<Button
						disabled={email.length <= 0 || message.length <= 0}
						style={{width: "100%", height: "60px", marginTop: "10px"}}
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


	const loadedCheck = 
		<div>
			{minimize ? 
				landingpageDataMobile
				:	
				<div style={{paddingBottom: 250}}>
					<BrowserView>
						<div style={bodyDivStyle}>{landingpageDataBrowser}</div>
					</BrowserView>
					<MobileView>
						{landingpageDataMobile}
					</MobileView>
				</div>
			}
		</div>

	return(
		<div>
			{loadedCheck}
		</div>
	)
}
export default Contact;