import React, { useState, useEffect, useContext } from "react";

import { useParams, useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import theme from '../theme.jsx';
import Markdown from 'react-markdown'
import { isMobile } from "react-device-detect";
import { Context } from '../context/ContextApi.jsx';
import { toast } from 'react-toastify';

import AppSearch from "../components/AppSearch1.jsx";

import {
	Divider,
	ButtonGroup,
  	TextField,
	Button,
	IconButton,
	Typography,
	CircularProgress,
	Card, 
	CardContent,
} from "@mui/material";

import {
	Send as SendIcon,
} from "@mui/icons-material";

import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import AuthenticationWindow from "../components/AuthenticationWindow.jsx";

const ChatBot = (props) => {
	const { globalUrl } =  props 
	const { supportEmail } = useContext(Context)
	const [messages, setMessages] = useState([])
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
    const [appAuthentication, setAppAuthentication] = React.useState([]);
	const [inputAuth, setInputAuth] = useState([])
	const [forceReauthentication, setForceReauthentication] = useState(false);
	const [selectedType, setSelectedType] = useState("support");

	const [appname, setAppname] = useState("");
	const [threadId, setThreadId] = useState("");
	const [runId, setRunId] = useState("");
	
	// New state for thread management
	const [isLoadingThread, setIsLoadingThread] = useState(false);
	const [threadError, setThreadError] = useState("");
	const [isActiveOrg, setIsActiveOrg] = useState(true);
	const [threadOrgId, setThreadOrgId] = useState("");
	const [chatDisabled, setChatDisabled] = useState(false);

	const [showAppSearch, setShowAppSearch] = useState(false);

	// Get thread ID from URL params
	const { threadId: urlThreadId } = useParams();
	let navigate = useNavigate();

	const waitingMsg = "Processing..."
	const viewWidth = isMobile ? "92%" : 800 

	useEffect(() => {
		// Check if loading and remove Waiting... from messages
		const newmessages = messages 
		const foundmessages = messages.filter((msg) => msg.message !== waitingMsg)
		if (foundmessages.length < newmessages.length) {
			setMessages(foundmessages);
		}

		// Wait 0.5 second 
		const objDiv = document.getElementById("messages-window");
		if (objDiv !== undefined && objDiv !== null) {
			setTimeout(() => {
				objDiv.scrollTop = objDiv.scrollHeight;
			}, 250);
		}
	}, [messages]);

	useEffect(() => {
		if (appname === undefined || appname === null || appname === "") {
			return
		}

		// Find the last message that was sent by us and reuse the same message content
		// with added app stuff only
		for (var i = messages.length-1; i >= 0; i--) {
			const msg = messages[i]
			if (msg.status === "sent") {
				handleSubmit(undefined, msg.message)
				break
			}
		}
	}, [appname])

	// Load existing thread if threadId is in URL
	useEffect(() => {
		if (urlThreadId && urlThreadId !== threadId) {
			loadExistingThread(urlThreadId);
		}
	}, [urlThreadId]);

	const loadExistingThread = (threadIdToLoad) => {
		setIsLoadingThread(true);
		setThreadError("");
		
		fetch(`${globalUrl}/api/v1/conversation/thread`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ thread_id: threadIdToLoad }),
		})
		.then((response) => {
			if (response.status === 403) {
				setThreadError("You are not authorized to view this conversation.");
				setIsLoadingThread(false);
				return null;
			}

			if (response.status === 404) {
				setThreadError("Conversation not found.");
				setIsLoadingThread(false);
				return null;
			}

			return response.json();
		})
		.then((data) => {
			if (!data) {
				return;
			}

			if (!data.success) {
				setThreadError(data.message || "Failed to load conversation.");
				setIsLoadingThread(false);
				return;
			}

			// Set thread data - this is crucial for continuing the conversation
			setThreadId(data.thread_id);
			console.log("Loaded existing thread:", data.thread_id);
			
			// Transform API message format to UI format
			const transformedMessages = (data.messages || []).map((msg, index) => ({
				id: `${data.thread_id}_${index}`,
				status: msg.role === "user" ? "sent" : "received",
				message: msg.content,
				timestamp: msg.timestamp
			}));
			
			setMessages(transformedMessages);
			setThreadOrgId(data.thread_org_id);
			setIsActiveOrg(data.is_active_org);

			if (!data.is_active_org) {
				setChatDisabled(true);
			} else {
				setChatDisabled(false);
			}

			setIsLoadingThread(false);
		})
		.catch((error) => {
			console.error("Error loading thread:", error);
			setThreadError("Failed to load conversation. Please try again.");
			setIsLoadingThread(false);
		});
	};

	const handleClickChangeOrg = (orgId) => {
		toast.info("Changing active organization - please wait!");

		const data = {
			org_id: orgId,
		};

		// Clear org-specific cached data
		localStorage.setItem("globalUrl", "");
		localStorage.setItem("getting_started_sidebar", "open");
		localStorage.removeItem("workflows");
		localStorage.removeItem("apps");
		localStorage.removeItem("dashboard_onboarding_complete");
		localStorage.removeItem("dashboard_onboarding_completed");

		fetch(`${globalUrl}/api/v1/orgs/${orgId}/change`, {
			mode: "cors",
			credentials: "include",
			crossDomain: true,
			method: "POST",
			body: JSON.stringify(data),
			withCredentials: true,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		})
		.then(function (response) {
			if (response.status !== 200) {
				console.log("Error in response");
			} else {
				// Clear additional cached data
				localStorage.removeItem("apps");
				localStorage.removeItem("workflows");
				localStorage.removeItem("userinfo");
				localStorage.removeItem("lastTabOpenByUser");
			}

			return response.json();
		})
		.then(function (responseJson) {
			if (responseJson.success === true) {
				if (
					responseJson?.region_url !== undefined &&
					responseJson?.region_url !== null &&
					responseJson?.region_url.length > 0
				) {
					localStorage.setItem("globalUrl", responseJson.region_url);
				}

				if (responseJson["reason"] === "SSO_REDIRECT") {
					setTimeout(() => {
						toast.info("Redirecting to SSO login page as SSO is required for this organization.");
						window.location.href = responseJson["url"];
						return;
					}, 2000);
				} else {
					setTimeout(() => {
						window.location.reload();
					}, 2000);
				}

				toast.success("Successfully changed active organization - refreshing!");
			} else {
				if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason.length > 0) {
					toast(responseJson.reason);
				} else {
					toast(`Failed changing org. Try again or contact ${supportEmail} if this persists.`);
				}
			}
		})
		.catch((error) => {
			console.log("error changing: ", error);
			toast(`Failed changing org. Try again or contact ${supportEmail} if this persists.`);
		});
	};

	window.title = "Shuffle - New Chat"

	// Automatic submit handler based on a lot of stuff :)
	const handleSubmit = (e, inputmsg) => {
		if (e !== undefined) {
			e.preventDefault();
			e.stopPropagation();
		}

		setLoading(true)
		setMessage("");

		const sentId = uuidv4();
		var parsedData = {
			"query": inputmsg,
			"thread_id": threadId,
			"run_id": runId,
		}

		console.log("Sending message with thread_id:", threadId);

		if (appname !== undefined && appname !== null && appname !== "") {
			parsedData["app_name"] = appname
		}

		if (inputAuth !== undefined && inputAuth.length > 0) {
			// Forcing first auth app to be used in request
			try {
				parsedData["app_name"] = inputAuth[0].name
				parsedData["app_id"] = inputAuth[0].id
				parsedData["category"] = inputAuth[0].category
				parsedData["action_name"] = inputAuth[0].action_name
			} catch (e) {
			}

			try {
				parsedData["app_name"] = inputAuth.apps[0].name
				parsedData["app_id"] = inputAuth.apps[0].id
				parsedData["category"] = inputAuth.apps[0].category
				parsedData["action_name"] = inputAuth.apps[0].action_name
			} catch (e) {
			}
		}

		if (selectedType !== "default") {
			if (selectedType == "workflow") {
				parsedData["output_format"] = "workflow_suggestion" 
			} else {
				parsedData["output_format"] = selectedType
			}
		}

		console.log("INPUT: ", parsedData)

		setInputAuth([])

		var newmessages = messages;
		newmessages.push({
			"id": sentId,
			"status": "sent",
			"message": inputmsg,
		})
		newmessages.push({
			"id": sentId,
			"status": "received",
			"message": waitingMsg,
		})

		setMessages(newmessages);

		//fetch(`http://localhost:8080/api/v1/conversation`, {
		fetch(`${globalUrl}/api/v1/conversation`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(parsedData),
		})
		.then((res) => res.text())
		.then((resText) => {
			setLoading(false)
			var data = {}

			// JSON parse
			try {	
				data = JSON.parse(resText);
			} catch (e) {
				console.log("Error parsing response as JSON: ", e);

				newmessages = newmessages.filter((msg) => msg.message !== waitingMsg);
				newmessages.push({
					"status": "received",
					"message": resText,
					"id": uuidv4(),
				});

				setMessages(newmessages);

				return;
			}


			if (data.run_id !== undefined && data.run_id !== null && data.run_id !== "") {
				setRunId(data.run_id)
			}

			if (data.thread_id !== undefined && data.thread_id !== null && data.thread_id !== "") {
				setThreadId(data.thread_id)
				
				// Update URL if this is a new thread (not already in URL)
				if (!urlThreadId && data.thread_id !== threadId) {
					console.log("Navigating to new thread URL:", data.thread_id);
					navigate(`/chat/${data.thread_id}`, { replace: true });
				}
			}

			if (data.success === undefined) {
				newmessages = newmessages.filter((msg) => msg.message !== waitingMsg);
				newmessages.push({
					"status": "received",
					"message": resText,	
					"id": uuidv4(),
				});

				setMessages(newmessages);

				return;
			}

			// authentication for app
			// app validation (choose one)
			const defaultMessage = `Default output. The feature you're interacting with may not have been implemented yet. Contact ${supportEmail} with a screenshot of this and your input please.`
				
			var outputmessage = defaultMessage;
			var status = "received";
			var action = ""
			if (data.success === false) {
				if (data.reason !== undefined) {
					outputmessage = data.reason
				} 

				status = "error"
			} else {
				if (data.reason !== undefined) {
					outputmessage = data.reason
				}
			}

			if (data.action !== undefined) {
				//console.log("Action is defined: ", data.action);
				action = data.action

				if (data.action === "app_authentication") {
					// If success & app auth -> say auth success and show available labels
					// If !success & app auth -> do authentication
					if (data.success === true) {
						newmessages = newmessages.filter((msg) => msg.message !== waitingMsg);
						// No action for this.
						// "action": action,
						var appname = ""
						if (data.apps !== undefined && data.apps !== null && data.apps.length > 0) {
							appname = data.apps[0].name.replaceAll("_", " ")
						}

						var outputmessage = `**Please specify which ${appname} action you want to use**: \n`
						if (data.available_labels !== undefined && data.available_labels !== null && data.available_labels.length > 0) {
							for (var i = 0; i < data.available_labels.length; i++) {
								outputmessage += "* " + data.available_labels[i] + "\n"
							}
							outputmessage += "* Reauthenticate ([see auth](/admin?tab=app_auth))"
						}
						//Some opavailable actions: " + data.apps.map((app) => app.name).join(", ")
						const parsedmessage = {
							"status": status,
							"message": outputmessage,
							"id": uuidv4(),
							"category": data.category,

							"thread_id": data.thread_id,
							"run_id": data.run_id,
						}
						newmessages.push(parsedmessage);
						setMessages(newmessages);

						return

					} else {
						if (data.apps !== undefined) {
							setInputAuth(data.apps)

							setMessage(inputmsg);

							setForceReauthentication(true)
						}
					}
				} else if (data.action === "select_category" || data.action === "select_app") {
					console.log("[DEBUG] APP SELECTION! Should help them choose an app to use")
					// Show a search field
					setShowAppSearch(true)
				}
			}

			newmessages = newmessages.filter((msg) => msg.message !== waitingMsg);
			const parsedmessage = {
				"status": status,
				"message": outputmessage,
				"id": uuidv4(),
				"action": action,
				"category": data.category,

				"thread_id": data.thread_id,
				"run_id": data.run_id,
			}
			newmessages.push(parsedmessage);
			setMessages(newmessages);
			console.log("New message: ", parsedmessage)
		})
		.catch((err) => {
			setLoading(false)
			console.log("Problem: ", err);

			setMessage(message);
			newmessages = newmessages.filter((msg) => msg.message !== waitingMsg);

			// Find the message with the sentId and change the status to error
			newmessages.push({
				"status": "error",
				"message": message,
				"error_message": "Failed to send: "+err,
				"id": sentId,
			});
			setMessages(newmessages);
		});
	};

	// Used to verify if the user is logged in after auth is done
	const getAppAuthentication = () => {
		console.log("Continue chat from the previous stage!");

		fetch(globalUrl + "/api/v1/apps/authentication", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for app auth :O!");
			}

			return response.json();
		})
		.then((responseJson) => {
			if (!responseJson.success) {
				console.log("Failed to get app auth!");
				return;
			}

			var newauth = [];
			for (let authkey in responseJson.data) {
				if (responseJson.data[authkey].defined === false) {
					continue;
				}

				newauth.push(responseJson.data[authkey]);
			}

			if (newauth.length > appAuthentication.length) {
				console.log("New auth is longer than old auth. Set new auth!");

				setForceReauthentication(false)

				// Check if last message contains "reauth"
				if (messages.length > 0) {
					const lastmessage = messages[messages.length-1];
					if (lastmessage.message.toLowerCase().includes("re-auth")) {
						console.log("Skipping resend due to reauth") 

						var newmessages = messages 
						newmessages.push({
							"status": "received",
							"message": "Authentication done. What do you want to do?",
							"id": uuidv4(),
						});
						setMessages(newmessages);

					} else {
						handleSubmit(undefined, message)
					}
				} else {
					handleSubmit(undefined, message)
				}
			}

			setAppAuthentication(newauth)

		})
		.catch((err) => {
			console.log("Error in getAppAuthentication: ", err);
		})
	}

	const AuthWrapper = (props) => {
		const { app } = props;
  		const [authenticationModalOpen, setAuthenticationModalOpen] = React.useState(false);

		console.log("AUTH: ", app)

		return (
			<div style={{position: "absolute", right: 250, bottom: 150, }}>
				{app.authentication.type === "oauth2" || app.authentication.type === "oauth2-app" ?
					<AuthenticationOauth2
						selectedApp={app}
						selectedAction={{
							"app_name": app.name,
							"app_id": app.id,
							"app_version": app.version,
							"large_image": app.large_image,
						}}
						authenticationType={app.authentication}
						isCloud={true}
						authButtonOnly={true}
						getAppAuthentication={getAppAuthentication}
					/>
				: 
					<Button
						fullWidth
						variant="contained"
						style={{
							marginBottom: 20, 
							marginTop: 20, 
							flex: 1,
							textTransform: "none",
							textAlign: "left",
							justifyContent: "flex-start",
							backgroundColor: "#ffffff",
							color: "#2f2f2f",
							borderRadius: theme.palette?.borderRadius,
							minWidth:  300, 
							maxWidth: 300,
							maxHeight: 50,
							overflow: "hidden",
							border: `1px solid ${theme.palette.inputColor}`,
						}}
						color="primary"
						onClick={(e) => {
							console.log("Click? ")
							e.preventDefault();
							setAuthenticationModalOpen(true);
						}}
					>
						<span style={{display: "flex"}}>
							<img
								alt={app.name}
								style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette?.borderRadius, }}
								src={app.large_image}
							/>
							<Typography style={{ margin: 0, marginLeft: 10, marginTop: 5,}} variant="body1">
								Authenticate
							</Typography>

						</span>
					</Button>
				}

				{app.authentication.type !== "oauth2" && authenticationModalOpen ?
					<AuthenticationWindow
						selectedApp={app}
						globalUrl={globalUrl}
						getAppAuthentication={getAppAuthentication}
						appAuthentication={appAuthentication}
						authenticationModalOpen={authenticationModalOpen}
						setAuthenticationModalOpen={setAuthenticationModalOpen}
					/>
				: null}
			</div>
			)
	}

	var amountfinished = 0;
	const showAuthentication = inputAuth.map((app, index) => {
		const authexists = appAuthentication.find((auth) => auth.app.id === app.id);
		if (authexists !== undefined && forceReauthentication === false) {
			console.log("Auth exists: ", authexists);
			amountfinished += 1 
			return null
		}

		return (
			<div key={index}>
				<AuthWrapper app={app} />
			</div>
		)
	})

	if (amountfinished === inputAuth.length && amountfinished > 0) {

		setInputAuth([])
		setAppAuthentication([])
	}

	const showSamples = 
		<div style={{marginLeft: 10, marginRight: 10, }}>
			<Card style={{backgroundColor: theme.palette.surfaceColor, borderRadius: theme.palette?.borderRadius,}}>
				<CardContent>
					<Typography variant="h6">
						How many incidents did we get last week?
					</Typography>
				</CardContent>
			</Card>
			<Card style={{backgroundColor: theme.palette.surfaceColor, borderRadius: theme.palette?.borderRadius, marginTop: 10, }}>
				<CardContent>
					<Typography variant="h6">
						Answer the last email from Jim about the new project, and say we're on it
					</Typography>
				</CardContent>
			</Card>
			<Card style={{backgroundColor: theme.palette.surfaceColor, borderRadius: theme.palette?.borderRadius, marginTop: 10, }}>
				<CardContent>
					<Typography variant="h6">
						Is the IP 1.2.3.4 blocked? If not, block it.
					</Typography>
				</CardContent>
			</Card>
		</div>

  function OuterLink(props) {
      return (
        <a
		  target="_blank"
		  rel="noopener noreferrer"
          href={props.href}
          style={{ color: "#f85a3e", textDecoration: "none" }}
        >
          {props.children}
        </a>
      );
  }

  function Img(props) {
    return <img style={{ 
      borderRadius: 12, 
      maxWidth: "100%", 
      height: "auto",
      marginTop: 12, 
      marginBottom: 12,
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
    }} alt={props.alt} src={props.src} />;
  }

  function CodeHandler(props) {
    const propvalue = props.value !== undefined && props.value !== null ? props.value : props.children !== undefined && props.children !== null && props.children.length > 0 ? props.children[0] : ""

    return (
      <div
        style={{
          backgroundColor: props.inline ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.3)",
          borderRadius: props.inline ? "4px" : "8px",
          padding: props.inline ? "2px 6px" : "12px 16px",
          display: props.inline ? "inline" : "block",
          margin: props.inline ? "0 2px" : "8px 0",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflowX: "auto"
        }}
      >
        <code
          style={{
            whiteSpace: props.inline ? "nowrap" : "pre-wrap",
            fontSize: props.inline ? "0.9em" : "0.85em",
            fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            color: "rgba(255, 255, 255, 0.9)"
          }}
        >{propvalue}</code>
      </div>
    );
  }


  const markdownStyle = {
    color: "rgba(255, 255, 255, 0.65)",
    overflow: "hidden",
    paddingBottom: 100,
    margin: "auto",
    maxWidth: "100%",
    minWidth: "100%",
    overflow: "hidden",
    fontSize: isMobile ? "1.3rem" : "1.0rem",
  }

  const Heading = (props) => {
    const element = React.createElement(
      `h${props.level}`,
      { style: { marginTop: props.level === 1 ? 20 : 50 } },
      props.children
    );
    const [hover, setHover] = useState(false);

    var extraInfo = "";
    return (
      <Typography
        onMouseOver={() => {
          setHover(true);
        }}
      >
        {props.level !== 1 ? (
          <Divider
            style={{
              width: "90%",
              marginTop: 40,
              backgroundColor: theme.palette.inputColor,
            }}
          />
        ) : null}
        {element}
        {/*hover ? <LinkIcon onMouseOver={() => {setHover(true)}} style={{cursor: "pointer", display: "inline", }} onClick={() => {
					window.location.href += "#hello"
					console.log(window.location)
					//window.history.pushState('page2', 'Title', '/page2.php');
					//window.history.replaceState('page2', 'Title', '/page2.php');
				}} /> 
				: ""
				*/}
        {extraInfo}
      </Typography>
    );
  }

	const OrderedList = (props) => {
		var parsedchildren = []
		for (var i = 0; i < props.children.length; i++) {
			const child = props.children[i]
			if (child === "\n") {
				continue
			}

			if (child.props !== undefined && child.props.children !== undefined) {
				// Remove <p> from the child wrapper
				var parsedchild = []
				for (var j = 0; j < child.props.children.length; j++) {
					const childchild = child.props.children[j]
					// print the raw childchild bytes, not string
					if (childchild === "\n") {
						continue
					}

					// If the childchild has <p> around it, remove it
					parsedchild.push(childchild) 

					/*
					// Not doing this as it breaks links
					if (childchild.props !== undefined && childchild.props.children !== undefined) {
						parsedchild.push(childchild.props.children)
					} else {
						parsedchild.push(childchild) 
					}
					*/
				}

				parsedchildren.push(parsedchild)
			}
		}

		return (
			<ol style={{marginTop: 0, }}>
				{parsedchildren.map((child, index) => {
					return (
						<li key={index} style={{minHeight: 0, display: "block", }}>
							<p style={{marginTop: 0, marginBottom: 10, }}>
								{index+1}. {child}
							</p>
						</li>
					)
				})}
			</ol>
		)
	}

	const Paragraph = (props) => {
		return (
			<p style={{
				marginTop: 8, 
				marginBottom: 8, 
				lineHeight: 1.6,
				color: "inherit"
			}}>
				{props.children}
			</p>
		)
	}

    const markdownComponents = {
		ol: OrderedList,
		ul: OrderedList,
    	img: Img,
    	code: CodeHandler,
    	h1: Heading,
    	h2: Heading,
    	h3: Heading,
    	h4: Heading,
    	h5: Heading,
    	h6: Heading,
    	a: OuterLink,
		p: Paragraph,
    }

	const chatWindow = 
		<div style={{minWidth: viewWidth, maxWidth: viewWidth, margin: "auto", textAlign: "left", minHeight: 1500, }}>
			{/* Loading state for thread */}
			{isLoadingThread ? (
				<div style={{
					textAlign: "center", 
					marginTop: "30vh",
					display: "flex",
					flexDirection: "column",
					alignItems: "center"
				}}>
					<CircularProgress 
						size={48} 
						style={{
							marginBottom: 24,
							color: "#ff8544"
						}} 
					/>
					<Typography variant="h6" style={{
						color: "rgba(255, 255, 255, 0.8)",
						fontWeight: 500
					}}>
						Loading conversation...
					</Typography>
					<Typography variant="body2" style={{
						color: "rgba(255, 255, 255, 0.5)",
						marginTop: 8
					}}>
						Please wait while we fetch your chat history
					</Typography>
				</div>
			) : null}

			{/* Error state */}
			{threadError ? (
				<div style={{
					textAlign: "center", 
					marginTop: "30vh",
					padding: "0 20px"
				}}>
					<div style={{
						backgroundColor: theme.palette.surfaceColor,
						borderRadius: 16,
						padding: 32,
						border: "1px solid #ff4444",
						maxWidth: 500,
						margin: "0 auto",
						boxShadow: "0 4px 20px rgba(255, 68, 68, 0.1)"
					}}>
						<Typography variant="h6" style={{
							color: "#ff4444", 
							marginBottom: 16,
							fontWeight: 600,
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						}}>
							<span style={{marginRight: 8, fontSize: "1.5em"}}>⚠️</span>
							Unable to Load Conversation
						</Typography>
						<Typography variant="body1" style={{
							color: "rgba(255, 255, 255, 0.8)",
							lineHeight: 1.6
						}}>
							{threadError}
						</Typography>
					</div>
				</div>
			) : null}

			{!isActiveOrg && !threadError ? (
				<div style={{
					backgroundColor: "rgba(255, 133, 68, 0.1)", 
					padding: "12px 16px", 
					margin: "16px 0", 
					borderRadius: 8, 
					border: "1px solid rgba(255, 133, 68, 0.3)",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: isMobile ? "wrap" : "nowrap",
					gap: 12
				}}>
					<div style={{display: "flex", alignItems: "center", gap: 10, flex: 1}}>
						<span style={{fontSize: "1.1em"}}>⚠️</span>
						<div>
							<Typography variant="body2" style={{color: "#ff8544", fontWeight: 600, marginBottom: 2}}>
								Different Organization
							</Typography>
							<Typography variant="caption" style={{color: "rgba(255, 255, 255, 0.7)", fontSize: "0.8rem"}}>
								View only - switch to participate
							</Typography>
						</div>
					</div>
					<Button 
						size="small"
						variant="contained" 
						style={{
							backgroundColor: "#ff8544",
							color: "white",
							borderRadius: 6,
							textTransform: "none",
							fontWeight: 600,
							padding: "6px 16px",
							fontSize: "0.85rem",
							whiteSpace: "nowrap",
							boxShadow: "none"
						}}
						onClick={() => {
							handleClickChangeOrg(threadOrgId);
						}}
					>
						Switch Org
					</Button>
				</div>
			) : null}

			{!isLoadingThread && !threadError && messages.length === 0 ? 
				<div style={{textAlign: "center", marginTop: "25vh"}}>
					<div style={{
						background: `linear-gradient(135deg, #ff8544 0%, #ff6b35 100%)`,
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
						marginBottom: 16
					}}>
						<Typography variant="h2" style={{
							fontWeight: 700,
							fontSize: isMobile ? "2rem" : "2.5rem",
							letterSpacing: "-0.02em"
						}}>
							Shuffle Support (beta)
						</Typography>
					</div>
					<Typography variant="h6" style={{
						color: "rgba(255, 255, 255, 0.6)",
						fontWeight: 400,
						marginBottom: 32
					}}>
						How can we help you today?
					</Typography>
					
					{/* Sample prompts */}
					<div style={{
						display: "flex", 
						flexDirection: isMobile ? "column" : "row", 
						gap: 16, 
						justifyContent: "center",
						maxWidth: 800,
						margin: "0 auto",
						padding: "0 20px"
					}}>
						{[
							"How many incidents did we get last week?",
							"Answer the last email from Jim about the new project",
							"Is the IP 1.2.3.4 blocked? If not, block it."
						].map((sample, index) => (
							<Card key={index} style={{
								backgroundColor: theme.palette.surfaceColor,
								borderRadius: 12,
								border: "1px solid rgba(255, 255, 255, 0.1)",
								cursor: "pointer",
								transition: "all 0.2s ease",
								flex: 1,
								minWidth: isMobile ? "100%" : "200px"
							}} onClick={() => setMessage(sample)}>
								<CardContent style={{padding: 20}}>
									<Typography variant="body2" style={{
										color: "rgba(255, 255, 255, 0.8)",
										lineHeight: 1.5,
										fontSize: "0.9rem"
									}}>
										{sample}
									</Typography>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			: null}
			<div 
				id="messages-window"
				style={{
					marginTop: 50, 
					display: "flex", 
					flexDirection: "column", 
					minHeight: 1500,
					maxHeight: isMobile ? "85%" : "85%", 
					overflow: "auto", paddingBottom: 200, 
				}}
			>
				{messages.map((message, index) => {
					const isUser = message.status === "sent";
					const isError = message.status === "error";
					const hasAction = message.action !== undefined && message.action !== null && message.action !== "";

					return (
						<div key={index} style={{
							position: "relative", 
							width: "100%", 
							marginBottom: 20, 
							display: "flex",
							justifyContent: isUser ? "flex-end" : "flex-start",
							marginLeft: isMobile ? 10 : 0,
						}}>
							<div style={{
								maxWidth: "75%",
								minWidth: "200px",
								backgroundColor: isUser ? "#ff8544" : theme.palette.surfaceColor,
								color: isUser ? "#000000" : "rgba(255, 255, 255, 0.9)",
								padding: "16px 20px",
								borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
								border: isError ? "1px solid #ff4444" : "1px solid rgba(255,255,255,0.1)",
								cursor: hasAction ? "pointer" : "default",
								overflowWrap: "break-word",
								boxShadow: isUser 
									? "0 2px 12px rgba(255, 133, 68, 0.3)" 
									: "0 2px 12px rgba(0, 0, 0, 0.2)",
								transition: "all 0.2s ease",
								"&:hover": hasAction ? {
									transform: "translateY(-1px)",
									boxShadow: "0 4px 16px rgba(255, 133, 68, 0.4)"
								} : {}
							}} onClick={() => {
								if (!hasAction) {
									return;
								}

								if (message.action === "login") {
									navigate("/login?view=/conversation&message=You must log in to use ShuffleGPT");
								} else if (message.action === "app_authentication") {
									console.log("App auth action!");
								} else {
									console.log("\n\nUnknown click action: ", message.action);
								}
							}}>
								{message.message === waitingMsg ? (
									<div style={{display: "flex", alignItems: "center"}}>
										<CircularProgress size={20} style={{marginRight: 12, color: "rgba(255, 255, 255, 0.7)"}} />
										<span style={{color: "rgba(255, 255, 255, 0.7)"}}>Processing...</span>
									</div>
								) : (
									<div>
										<Markdown
											components={markdownComponents}
											style={{
												color: "inherit",
												lineHeight: 1.6,
											}}
										>
											{message.message}
										</Markdown>

										{message.thread_id !== undefined && message.thread_id !== null && message.thread_id !== "" && !isUser ? (
											<Typography variant="caption" style={{
												color: "rgba(255,255,255,0.4)", 
												marginTop: 8, 
												display: "block",
												fontSize: "0.75rem"
											}}>
												Thread: {message.thread_id}
											</Typography>
										) : null}
									</div>
								)}
							</div>

							{message.status === "error" && message.error_message ? (
								<Typography variant="body2" style={{
									color: "#ff4444", 
									marginTop: 8,
									fontSize: "0.85rem",
									fontStyle: "italic"
								}}>
									{message.error_message}
								</Typography>
							) : null}

							{(message.action === "select_category" || message.action === "select_app") && showAppSearch && index === messages.length-1 ? (
								<div style={{position: "absolute", right: 0, bottom: -100}}>
									<AppSearch 
										placeholder={"Find your "+message.category+" app"}
										setNewSelectedApp={setAppname}
									/>
								</div>
							) : null}
						</div>
					);
				})}
			</div>
			{showAuthentication} 	

		<div style={{
			position: "fixed", 
			bottom: 0, 
			left: 0, 
			width: "100%", 
			zIndex: 100, 
			background: `linear-gradient(180deg, transparent 0%, ${theme.palette.platformColor} 20%)`,
			backdropFilter: "blur(10px)",
			borderTop: "1px solid rgba(255, 255, 255, 0.1)"
		}}>
			<div style={{width: viewWidth, margin: "auto", padding: "20px 0"}}>
				{/* Commented out Query Type section for now
				{messages.length === 0 ? 
					<div style={{marginBottom: 20}}>
						<Typography variant="body2" style={{
							color: "rgba(255, 255, 255, 0.7)",
							marginBottom: 12,
							fontWeight: 500
						}}>
							Query Type
						</Typography>
						<ButtonGroup 
							fullWidth
							style={{display: "flex", marginTop: 10}}
						>
							<Button
								fullWidth
								variant={selectedType === "support" ? "contained" : "outlined"}
								onClick={() => setSelectedType("support")}
								style={{
									backgroundColor: selectedType === "support" ? "#ff8544" : "transparent",
									borderColor: "#ff8544",
									color: selectedType === "support" ? "white" : "#ff8544",
									textTransform: "none",
									fontWeight: 600,
									borderRadius: "8px",
									padding: "12px 24px"
								}}
							>
								Support		
							</Button>
						</ButtonGroup>
					</div>
				: null}
				*/}

				<form onSubmit={(e) => handleSubmit(e, message)} style={{
					marginBottom: isMobile ? 10 : 20, 
					maxWidth: viewWidth, 
					minWidth: viewWidth
				}}>
					<TextField
						id="message"
						fullWidth
						disabled={loading || chatDisabled}
						placeholder={chatDisabled ? "Chat disabled - switch organization to participate" : "Type your message..."}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleSubmit(e, message);
							}
						}}
						variant="outlined"
						autoFocus={!chatDisabled}
						multiline
						maxRows={4}
						sx={{
							'& .MuiOutlinedInput-root': {
								backgroundColor: theme.palette.surfaceColor,
								borderRadius: '12px',
								border: '1px solid rgba(255, 255, 255, 0.15)',
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
								'&:hover': {
									border: '1px solid rgba(255, 133, 68, 0.4)',
								},
								'&.Mui-focused': {
									border: '1px solid #ff8544',
									boxShadow: '0 0 0 2px rgba(255, 133, 68, 0.1)'
								}
							},
							'& .MuiOutlinedInput-input': {
								color: 'rgba(255, 255, 255, 0.9)',
								padding: '12px 16px',
								fontSize: '0.95rem'
							},
							'& .MuiInputLabel-root': {
								color: 'rgba(255, 255, 255, 0.6)',
							}
						}}
						InputProps={{
							endAdornment: (
								<IconButton
									aria-label="send message"
									disabled={chatDisabled || loading || !message.trim()}
									onClick={(e) => handleSubmit(e, message)}
									style={{
										backgroundColor: (!chatDisabled && !loading && message.trim()) ? "#ff8544" : "rgba(255, 255, 255, 0.1)",
										color: "white",
										margin: "2px",
										padding: "8px",
										borderRadius: "8px",
										transition: "all 0.2s ease"
									}}
								>
									<SendIcon />
								</IconButton>
							)
						}}
					/>
				</form>
				
				{!isMobile ? (
					<Typography variant="caption" style={{
						color: "rgba(255, 255, 255, 0.5)",
						textAlign: "center",
						display: "block",
						fontSize: "0.75rem",
						lineHeight: 1.4,
						maxWidth: "80%",
						margin: "0 auto"
					}}>
						{messages.length === 0 
							? `The Shuffle AI is a test system for automatic workflow generation and atomic functions for the future of Shuffle. Shuffle AI may use your organization info in the query, and attempts to auto-correct any failed behavior. If you have any questions, please contact us at ${supportEmail}`
							: "Shuffle AI can make mistakes. Always double-check important information."
						}
					</Typography>
				) : null}
			</div>
		</div>
	</div>

return (
	<div style={{width: isMobile ? "100%" : 1000, margin: "auto", paddingTop: 50, }}>
		{chatWindow}
	</div>
)
}

export default ChatBot;
