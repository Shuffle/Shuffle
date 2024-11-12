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
  const { globalUrl, userdata,clickedFromOrgTab, serverside, billingInfo, stripeKey, checkLogin, setAdminTab, setCurTab, notifications, setNotifications, } = props;
  const [showDismissed, setShowDismissed] = React.useState(false);
  const [showRead, setShowRead] = React.useState(false);
  const [appFramework, setAppFramework] = React.useState({});

  const [selectedWorkflow, setSelectedWorkflow] = React.useState("NO HIGHLIGHT");
  const [selectedExecutionId, setSelectedExecutionId] = React.useState("NO HIGHLIGHT");
  const [highlightKMS, setHighlightKMS] = React.useState(false)

  let navigate = useNavigate();
	useEffect(() => {
		getFramework()

		// Check "workflow" and "execution_id" in URL
		const urlParams = new URLSearchParams(window.location.search)
		const workflow = urlParams.get("workflow")
		const execution_id = urlParams.get("execution_id")
		const kms = urlParams.get("kms")

		if (kms !== null && kms !== undefined && kms.length > 0 && kms === "true") {
			toast.info("KMS-related notifications are highlighted.")
			setHighlightKMS(true)
		}

		if (execution_id !== null) {
			setSelectedExecutionId(execution_id)

			//toast.info("Execution-related notifications are highlighted.")
		} 

		if (workflow !== null) {
			setSelectedWorkflow(workflow)

			toast.info("Workflow-related notifications are highlighted.")
		}
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

    const clearNotifications = () => {
      // Don't really care about the logout

      toast("Clearing notifications")
      fetch(`${globalUrl}/api/v1/notifications/clear`, {
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
			  // Reload the UI
			  const newNotifications = notifications.map((notification) => {
				  notification.read = true
				  return notification
			  })

			  setNotifications(newNotifications)
			  setShowRead(true)
          } else {
            toast("Failed dismissing notifications. Please try again later.");
          }
        })
        .catch((error) => {
          console.log("error in notification dismissal: ", error);
          //removeCookie("session_token", {path: "/"})
        });
    };

	const dismissNotification = (alert_id, disabled) => {
		var notificationurl = `${globalUrl}/api/v1/notifications/${alert_id}/markasread`
		if (disabled === true) {
			notificationurl += "?disabled=true"
		} else if (disabled === false) {
			notificationurl += "?disabled=false"
		}

    	fetch(notificationurl , {
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
			// Mark current one as read
			var newNotifications = notifications.map((notification) => {
				if (notification.id === alert_id) {
					notification.read = true
				}

				return notification
			})


			if (disabled === true) {
				toast("Notification disabled, and will not be shown again.")

				newNotifications = newNotifications.map((notification) => {
					if (notification.id === alert_id) {
						notification.ignored = true
					}

					return notification
				})

				console.log("NEW NOTIFICATIONS: ", newNotifications);
			} else if (disabled === false) {
				toast("Notification re-enabled successfully")

				newNotifications = newNotifications.map((notification) => {
					if (notification.id === alert_id) {
						notification.ignored = false
					}

					return notification
				})

			} else {
				toast("Notification dismissed successfully")
			}

	        //const newNotifications = notifications.filter(
	      	//	(data) => data.id !== alert_id
	        //)

	        //console.log("NEW NOTIFICATIONS: ", newNotifications);

			if (setNotifications !== undefined && newNotifications !== undefined) {
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


		var highlighted = selectedExecutionId === "" && selectedWorkflow === "" ? false : data.reference_url === undefined || data.reference_url === null || data.reference_url.length === 0 ? false : data.reference_url.includes(selectedExecutionId) || data.reference_url.includes(selectedWorkflow) 

		if (!highlighted && highlightKMS) {
			if (data.title !== undefined && data.title !== null && data.title.toLowerCase().includes("kms")) {
				highlighted = true
			} else if (data.description !== undefined && data.description !== null && data.description.toLowerCase().includes("kms")) {
				highlighted = true
			}

		}

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
    	      width: clickedFromOrgTab ? null :notificationWidth,
    	      padding: 30,
    	      borderBottom: "1px solid rgba(255,255,255,0.4)",
			  marginBottom: 20, 
			  border: highlighted ? "2px solid #f85a3e" : null,
			  borderRadius: theme.palette?.borderRadius,
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
				{data.ignored === true ? 
					<Chip
						label={"Disabled"}
						variant="outlined"
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
				<Tooltip title="Disabling a notification makes it so similar notifications to this one will NOT be re-opened. It will NOT forward notifications to your notification workflow, but WILL still keep counting." placement="top">
					<Button
					  color="secondary"
					  variant={data.ignored === true ? "contained" : "outlined"}
					  style={{ marginTop: 15, }}
					  onClick={() => {
						if (data.ignored === true) {
							dismissNotification(data.id, false)
						} else {
							dismissNotification(data.id, true)
						}
					  }}
					>
						{data.ignored === true ? "Re-enable" : "Disable"}
					</Button>
				</Tooltip>
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
		<div style={{width: clickedFromOrgTab ? 1030:1000, padding: clickedFromOrgTab ? 27:null, height: clickedFromOrgTab ? "auto":null, backgroundColor: clickedFromOrgTab ? '#212121':null, borderRadius: clickedFromOrgTab ? '16px':null,  }}>
			<h2 style={{ display: clickedFromOrgTab?null:"inline", marginBottom: clickedFromOrgTab? 8:null, marginTop: clickedFromOrgTab?40:null, color: clickedFromOrgTab?"#ffffff":null }}>Notifications ({
				notifications?.filter((notification) => showRead === true || notification.read === false).length
				})</h2>

			<span style={{ marginLeft: clickedFromOrgTab?null:25, color: clickedFromOrgTab?"#9E9E9E":null, }}>
				Notifications help you find potential problems with your workflows and apps.&nbsp;
				<a
					target="_blank"
					rel="noopener noreferrer"
					href="/docs/organizations#notifications"
					style={{ textDecoration: clickedFromOrgTab?null:"none", color: clickedFromOrgTab?"#FF8444":"#f85a3e" }}
				>
					Learn more
				</a>
			</span>
			<div/>
			<div style={{display: "flex", marginTop: 10, marginBottom: 10, }}>
				<Switch
					checked={showRead}
					onChange={() => {
						setShowRead(!showRead);
					}}
				/><span style={{marginTop: 5, }}>&nbsp; Show read </span>
				  {notifications !== undefined && notifications !== null && notifications.length > 1 ? (
					<Button
					  color="primary"
					  variant="outlined"
					  disabled={notifications.filter((data) => !data.read).length === 0}
					  onClick={() => {
						clearNotifications()
					  }}
					  style={{marginLeft: 50, }}
					>
					  Mark all as read 
					</Button>
				  ) : null}
			</div>
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

			{clickedFromOrgTab? null : <Divider style={{marginTop: 50, marginBottom: 50, }} />}

			<h2 style={{ display: clickedFromOrgTab ? null:"inline", marginBottom: clickedFromOrgTab ? 8:null, marginTop: clickedFromOrgTab ?0:null, color: clickedFromOrgTab ? "#ffffff" : null }}>Suggestions</h2>
			<span style={{ color: clickedFromOrgTab ?"#9E9E9E":null,marginLeft: clickedFromOrgTab ?null:25 }}>
				Suggestions are tasks identified by Shuffle to help you discover ways to protect your and customers' company. <br/>These range from simple configurations in Shuffle to Usecases you may have missed.&nbsp;
				<a
					target="_blank"
					rel="noopener noreferrer"
					href="/docs/organizations#priorities"
					style={{ textDecoration: clickedFromOrgTab ?null:"none", color: clickedFromOrgTab ?"#FF8444":"#f85a3e" }}
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
							clickedFromOrgTab={true}
							setAdminTab={setAdminTab}
							setCurTab={setCurTab}
  							appFramework={appFramework}
						/>
					)
				})
			}

		</div>
	)
}

export default Priorities;
