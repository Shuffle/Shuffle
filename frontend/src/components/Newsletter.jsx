import React, {useState} from 'react';
import { useTheme } from '@material-ui/core/styles';
import {isMobile} from "react-device-detect";
import ReactGA from 'react-ga4';

import {TextField, Typography, Button} from '@material-ui/core';

const Newsletter = (props) => {
  const { globalUrl, } = props;

	const theme = useTheme();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [buttonActive, setButtonActive] = useState(true);
	const buttonStyle = {minWidth: 300, borderRadius: 30, height: 60, width: 140, margin: isMobile ? "15px auto 15px auto" : "20px 20px 20px 10px", fontSize: 18,}

	const newsletterSignup = (inemail) => {
		if (inemail.length < 4) {
			setMsg("Invalid email")
  		setButtonActive(true)
			return
		}

  	setButtonActive(false)
		const data = {"email": inemail}
		const url = globalUrl+'/api/v1/functions/newsletter_signup'
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
		})
		.then(response =>
			response.json().then(responseJson => {
  			setButtonActive(true)
				setMsg(responseJson["reason"])
				if (responseJson["success"] === false) {
				} else {
					setEmail("")
				}
			}),
		)
		.catch(error => {
			setMsg("Something went wrong: ", error.toString())
  		setButtonActive(true)
		});
	}

	return (
		<div style={{margin: "auto", color: "white", textAlign: "center",}}>
			<Typography variant="h4" style={{marginTop: 35,}}>
				Security Automation	Newsletter
			</Typography>
			<Typography variant="h6" style={{color: "#7d7f82", marginTop: 20, }}>
				Defensive security is 99% noise. Join us to sift through it.
			</Typography>
			<div style={{}}>
				<TextField
					style={{minWidth: isMobile ? "90%" : 450, backgroundColor: theme.palette.inputColor, marginTop: 20, borderRadius: 10, }}
					InputProps={{
						style:{
							borderRadius: 10,
							height: 60, 
							color: "white",
						},
					}}
					color="primary"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value)
					}}
					placeholder="Your email"
					id="standard-required"
					margin="normal"
					variant="outlined"
				/>
			</div>
			<Button
				variant="contained"
				color="primary"
				style={buttonStyle}
				disabled={!buttonActive}
				onClick={() => {
					newsletterSignup(email)
					ReactGA.event({
						category: "newsletter",
						action: `signup_click`,
						label: "",
					})
				}}
			>
				Sign up	
			</Button>
			<div/>
			{msg}
		</div>
	)
}


export default Newsletter;
