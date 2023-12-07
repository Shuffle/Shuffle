import React, { useState, useEffect } from "react";

import { toast } from "react-toastify";
import theme from "../theme.jsx";
import {
	Paper,
	Tooltip,
  	Typography,
	Divider,
	Button,
	ButtonGroup,
	Grid,
	Card,
	Chip,
  	Switch,
} from "@mui/material";

import { useNavigate, Link } from "react-router-dom";
import Priority from "../components/Priority.jsx";
//import { useAlert 

const Priorities = (props) => {
  const { globalUrl, userdata, serverside, billingInfo, stripeKey, checkLogin, setAdminTab, setCurTab, notifications, setNotifications, } = props;
  const [showDismissed, setShowDismissed] = React.useState(false);
  const [showRead, setShowRead] = React.useState(false);
  const [appFramework, setAppFramework] = React.useState({});
  let navigate = useNavigate();

	useEffect(() => {
		getFramework()
	}, [])

	if (userdata === undefined || userdata === null) {
		return 
	}

	const getFramework = () => {
		fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for framework!");
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.success === false) {
				setAppFramework({})
				if (responseJson.reason !== undefined) {
					//toast("Failed loading: " + responseJson.reason)
				} else {
					//toast("Failed to load framework for your org.")
				}
			} else {
				setAppFramework(responseJson)
			}
		})
		.catch((error) => {
			console.log("err in framework: ", error.toString());
		})
	}

	const dismissNotification = (alert_id) => {
    	// Don't really care about the logout
    	fetch(`${globalUrl}/api/v1/notifications/${alert_id}/markasread`, {
    	  credentials: "include",
    	  method: "GET",
    	  headers: {
    	    "Content-Type": "application/json",
    	  },
    	})
	    .then(function (response) {
	      if (response.status !== 200) {
	        console.log("Error in response");
	      }

	      return response.json();
	    })
	    .then(function (responseJson) {
	      if (responseJson.success === true) {
	        const newNotifications = notifications.filter(
	      		(data) => data.id !== alert_id
	        );
	        console.log("NEW NOTIFICATIONS: ", newNotifications);

			if (setNotifications !== undefined) {
	        	setNotifications(newNotifications)
			}
	      } else {
	        toast("Failed dismissing notification. Please try again later.");
	      }
		})
	    .catch((error) => {
	      console.log("error in notification dismissal: ", error);
	      //removeCookie("session_token", {path: "/"})
	    })
	}
  	

	const notificationWidth = "100%" 
	const imagesize = 22
  	const boxColor = "#86c142"
	const NotificationItem = (props) => {
		const {data} = props

    	var image = "";
    	var orgName = "";
    	var orgId = "";
    	if (userdata.orgs !== undefined) {
    	  const foundOrg = userdata.orgs.find((org) => org.id === data["org_id"]);
    	  if (foundOrg !== undefined && foundOrg !== null) {
    	    //position: "absolute", bottom: 5, right: -5,
    	    const imageStyle = {
    	      width: imagesize,
    	      height: imagesize,
    	      pointerEvents: "none",
    	      marginLeft:
    	        data.creator_org !== undefined && data.creator_org.length > 0
    	          ? 20
    	          : 0,
    	      borderRadius: 10,
    	      border:
    	        foundOrg.id === userdata.active_org.id
    	          ? `3px solid ${boxColor}`
    	          : null,
    	      cursor: "pointer",
    	      marginRight: 10,
    	    };

    	    image =
    	      foundOrg.image === "" ? (
    	        <img
    	          alt={foundOrg.name}
    	          src={theme.palette.defaultImage}
    	          style={imageStyle}
    	        />
    	      ) : (
    	        <img
    	          alt={foundOrg.name}
    	          src={foundOrg.image}
    	          style={imageStyle}
    	          onClick={() => {}}
    	        />
    	      );

    	    orgName = foundOrg.name;
    	    orgId = foundOrg.id;
    	  }
		}

		return (
    	  <Paper
    	    style={{
    	      backgroundColor: theme.palette.platformColor,
    	      width: notificationWidth,
    	      padding: 30,
    	      borderBottom: "1px solid rgba(255,255,255,0.4)",
			  marginBottom: 20, 
    	    }}
    	  >
			<div style={{display: "flex", }}>
				{data.amount === 1 && data.read === false ? 
					<Chip
						label={"First seen"}
						variant="contained"
						color="primary"
						style={{marginRight: 15, height: 25, }}
					  />
				: null}
				{data.read === false ?
					<Chip
						label={"Unread"}
						variant="outlined"
						color="primary"
						style={{marginRight: 15, height: 25, }}
					  />
				: 
					<Chip
						label={"Read"}
						variant="outlined"
						color="secondary"
						style={{marginRight: 15, height: 25, }}
					  />
				}
				<Typography variant="body1" color="textPrimary">
					{data.title}
				</Typography >
			</div>

			{data.image !== undefined && data.image !== null && data.image.length > 0 ? 
				<img alt={data.title} src={data.image} style={{height: 100, width: 100, }} />
				: 
				null
			}
			<Typography variant="body2" color="textSecondary" style={{marginTop: 10, maxHeight: 200, overflowX: "hidden", overflowY: "auto", }}>
				{data.description}
			</Typography >
    	    <div style={{ display: "flex" }}>
			  <ButtonGroup>
			  	<Button
			  	  color="secondary"
			  	  variant="outlined"
			  	  style={{ marginTop: 15 }}
			  	  disabled={data.reference_url === undefined || data.reference_url === null || data.reference_url.length === 0}
			  	  onClick={() => {
					window.open(data.reference_url, "_blank")
			  	  }}
			  	>
			  	 	Explore 
			  	</Button>
    	      	{data.read === false ? (
    	      	  <Button
    	      	    color="secondary"
    	      	    variant="outlined"
    	      	    style={{ marginTop: 15 }}
    	      	    onClick={() => {
    	      	      dismissNotification(data.id);
    	      	    }}
    	      	  >
    	      	    Dismiss
    	      	  </Button>
    	      	) : null}
			  </ButtonGroup>

		      <Typography variant="body2" color="textSecondary" style={{marginLeft: 20, marginTop: 20, }}>
				<b>First seen</b>: {new Date(data.created_at * 1000).toISOString().slice(0, 19)}
			  </Typography >
			  <Typography variant="body2" color="textSecondary" style={{marginLeft: 20, marginTop: 20, }}>
				<b>Last seen</b>: {new Date(data.updated_at * 1000).toISOString().slice(0, 19)}
			  </Typography >
			  <Typography variant="body2" color="textSecondary" style={{marginLeft: 20, marginTop: 20, }}>
				<b>Times seen</b>: {data.amount}
			  </Typography >
    	    </div>
    	  </Paper>
    	);
    }

	return (
		<div style={{maxWidth: 1000, }}>
			<h2 style={{ display: "inline" }}>Suggestions</h2>
			<span style={{ marginLeft: 25 }}>
				Suggestions are tasks identified by Shuffle to help you discover ways to protect your and customers' company. These range from simple configurations in Shuffle to Usecases you may have missed.&nbsp;
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
					No Suggestions found
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
							setAdminTab={setAdminTab}
							setCurTab={setCurTab}
  							appFramework={appFramework}
						/>
					)
				})
			}
			<Divider style={{marginTop: 50, marginBottom: 50, }} />
			<h2 style={{ display: "inline" }}>Notifications</h2>
			<span style={{ marginLeft: 25 }}>
				Notifications help you find potential problems with your workflows and apps.&nbsp;
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
			{notifications === null || notifications === undefined || notifications.length === 0 ? null : 
				<div>
					{notifications.map((notification, index) => {
						if (showRead === false && notification.read === true) {
							return null
						}

						return (
							<NotificationItem data={notification} key={index} />
						)
					})}
				</div>
			}

		</div>
	)
}

export default Priorities;
