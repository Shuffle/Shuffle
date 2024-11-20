import React, {useState} from 'react';
import {isMobile} from "react-device-detect";
import ReactGA from 'react-ga4';
import theme from '../theme.jsx';

import {
	TextField, 
	Typography, 
	Button
} from '@mui/material';

const Newsletter = (props) => {
  const { globalUrl, } = props;

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [buttonActive, setButtonActive] = useState(true);
	const buttonStyle = {width: 176, marginTop:16, height: 45, paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, background: 'linear-gradient(90deg, #FF8444 0%, #FB47A0 100%)', borderRadius: 200, justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex', fontSize: 16, fontStyle: "normal", fontWeight: 600}

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
		<div style={{margin: "auto", height:isMobile? 375 :286, color: "white", textAlign: isMobile? "cenetr":"Left", marginTop:24, marginLeft: 24, marginRight: 24}}>
			<Typography variant="h4" style={{ fontWeight:700, textTransform: 'capitalize', fontSize:32 }}>
				Security authentication<br/> newsletter
			</Typography>
			<Typography variant="h6" style={{color: "#7d7f82", marginTop: 8, fontSize: 16,}}>
			Defensive security is 99% noise, join us to sift through it!<br/> Enter your email below:
			</Typography>
			<div style={{ justifyContent:"center",}}>
				<TextField
					style={{minWidth: isMobile ? "90%" : 450, height: 45, backgroundColor: theme.palette.inputColor, marginTop: 8,  borderRadius: 10, }}
					InputProps={{
						style:{
							borderRadius: 10,
							height: 45, 
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

			</div>
			<div/>
			{msg}
		</div>
	)
}


export default Newsletter;
