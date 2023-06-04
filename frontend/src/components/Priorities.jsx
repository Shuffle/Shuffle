import React, { useState, useEffect } from "react";

import theme from "../theme.jsx";
import {
	Paper,
  Typography,
	Divider,
	Button,
	Grid,
	Card,
  Switch,
} from "@material-ui/core";

import Priority from "../components/Priority.jsx";
import { useAlert } from "react-alert";

const Priorities = (props) => {
  const { globalUrl, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, checkLogin, } = props;
  const [showDismissed, setShowDismissed] = React.useState(false);
  const [showRead, setShowRead] = React.useState(false);

	if (userdata === undefined || userdata === null) {
		return 
	}

	return (
		<div style={{maxWidth: 1000, }}>
			<h2 style={{ display: "inline" }}>Priorities</h2>
			<span style={{ marginLeft: 25 }}>
				Priorities identified by Shuffle to help you discover ways to protect yourself.&nbsp;
				<a
					target="_blank"
					rel="noopener noreferrer"
					href="/docs/organizations#priorities"
					style={{ textDecoration: "none", color: "#f85a3e" }}
				>
					Learn more
				</a>
			</span>
			<div style={{marginTop: 10, }}/>
			<Switch
				checked={showDismissed}
				onChange={() => {
					setShowDismissed(!showDismissed);
				}}
			/>&nbsp; Show dismissed
			{userdata.priorities === null || userdata.priorities === undefined || userdata.priorities.length === 0 ? 
				<Typography variant="h4">
					No Priorities found
				</Typography>
				: 
				userdata.priorities.map((priority, index) => {
					if (showDismissed === false && priority.active === false) {
						return null
					}

					return (
						<Priority
							key={index}
							globalUrl={globalUrl}
							priority={priority}
							checkLogin={checkLogin}
						/>
					)
				})
			}
			<Divider style={{marginTop: 50, marginBottom: 50, }} />
			<h2 style={{ display: "inline" }}>Notifications</h2>
			<span style={{ marginLeft: 25 }}>
				Notifications help you find potential problems with your workflows and apps
				<a
					target="_blank"
					rel="noopener noreferrer"
					href="/docs/organizations#notifications"
					style={{ textDecoration: "none", color: "#f85a3e" }}
				>
					Learn more
				</a>
			</span>
			<div/>
			<Switch
				checked={showRead}
				onChange={() => {
					setShowRead(!showRead);
				}}
			/>&nbsp; Show read 
		</div>
	)
}

export default Priorities;
