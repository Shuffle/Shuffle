import React, { useState, useEffect, useContext } from "react";

import { useParams, useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import theme from '../theme.jsx';
import Markdown from 'react-markdown'
import { isMobile } from "react-device-detect";
import { Context } from '../context/ContextApi.jsx';

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
	const [selectedType, setSelectedType] = useState("atomic");

	const [appname, setAppname] = useState("");
	const [threadId, setThreadId] = useState("");
	const [runId, setRunId] = useState("");

	const [showAppSearch, setShowAppSearch] = useState(false);


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

	window.title = "Shuffle - New Chat"
	let navigate = useNavigate();

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
						fullWidth
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
    return <img style={{ borderRadius: theme.palette?.borderRadius, width: 750, maxWidth: "100%", marginTop: 15, marginBottom: 15, }} alt={props.alt} src={props.src} />;
  }

  function CodeHandler(props) {
    //console.log("Codehandler PROPS: ", props)

    const propvalue = props.value !== undefined && props.value !== null ? props.value : props.children !== undefined && props.children !== null && props.children.length > 0 ? props.children[0] : ""

    return (
      <div
        style={{
          minWidth: "50%",
          maxWidth: "100%",
          backgroundColor: theme.palette.inputColor,
          overflowY: "auto",

		  // Check if props.inline === true, then do it inline
		  padding: props.inline ? 0 : 15,
		  display: props.inline ? "inline" : "block",
        }}
      >
        <code
          style={{
            // Wrap if larger than X
            whiteSpace: "pre-wrap",
            overflow: "auto",
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
			<p style={{marginTop: 15, marginBottom: 15, }}>
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
			{messages.length === 0 ? 
				<span>
					<h1>Shuffle AI</h1>



					{showSamples}
				</span>
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
					const float = message.status === "sent" ? "left" : "right";
					const border = message.status === "error" ? "red" : "rgba(255,255,255,0.3)" 

					const hasAction = message.action !== undefined && message.action !== null && message.action !== "" 

					return (
					// Make a chat bubble component
						<div key={index} style={{position: "relative", width: "100%", marginTop: 15, marginLeft: isMobile ? 10 : 0, }}>
							<Typography variant="body1" style={{display: "flex", backgroundColor: theme.palette.surfaceColor, color: "white", padding: "0px 10px 0px 10px", borderRadius: theme.palette?.borderRadius, float: float, border: `1px solid ${border}`, "cursor": hasAction ? "pointer" : "default", maxWidth: viewWidth-30, overflowWrap: "break-word", whiteSpace: "pre-line" }} onClick={() => {
									if (!hasAction) {
										return
									}

									if (message.action === "login") {
										navigate("/login?view=/conversation&message=You must log in to use ShuffleGPT")
									} else if (message.action === "app_authentication") {
										console.log("App auth action!")
										//setAuthenticationModalOpen(true)
									} else {
										console.log("\n\nUnknown click action: ", message.action)
									}
							}}>
								{message.message === waitingMsg ? <CircularProgress style={{height: 20, width: 20, marginTop: 20, marginRight: 10,  }} /> : null} 
								  <span>
									  <Markdown
										components={markdownComponents}
										id="markdown_wrapper"
										style={{
											minHeight: 20, 
											marginTop: 0, 
											display: "flex",
											flexDirection: "row",
										}}
									  >
										{message.message}
									  </Markdown>

									{message.thread_id !== undefined && message.thread_id !== null && message.thread_id !== "" ?
										<Typography variant="body2" style={{color: "rgba(255,255,255,0.5)", marginTop: 5, }}>
											Thread: {message.thread_id}
										</Typography>
										: null
									}
								  </span>
							</Typography>

							{message.status === "error" && message.error_message ?
								<Typography variant="body2" style={{color: "red", }}>
									{message.error_message}
								</Typography>
							: null}

							{(message.action === "select_category" || message.action === "select_app") && showAppSearch && index === messages.length-1 ?
								<div style={{position: "absolute", right: 0, bottom: -100, }}>
									<AppSearch 
										placeholder={"Find your "+message.category+" app"}
										setNewSelectedApp={setAppname}
									/>
								</div>
							: null}
						</div>
						)
				})}
			</div>
			{showAuthentication} 	

		<div style={{position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 100, backgroundColor: theme.palette.platformColor, }}>
			<div style={{width: viewWidth, margin: "auto", }}>
				{messages.length === 0 ? 
					<span>
						<Typography variant="body2" color="textSecondary">
							Query Type
						</Typography>
						<ButtonGroup 
							fullWidth
							color="secondary"
							style={{display: "flex", marginTop: 10, }}
						>
							{/*
							<Button
								fullWidth
								disabled
								variant={selectedType === "default" ? "contained" : "outlined"}
								onClick={() => setSelectedType("default")}
							>
								Auto	
							</Button>
							*/}
							<Button
								fullWidth
								variant={selectedType === "atomic" ? "contained" : "outlined"}
								onClick={() => setSelectedType("atomic")}
							>
								Auto-run action 
							</Button>
							<Button
								fullWidth
								variant={selectedType === "support" ? "contained" : "outlined"}
								onClick={() => setSelectedType("support")}
							>
								Support		
							</Button>
						</ButtonGroup>
					</span>
				: null}

				<form onSubmit={(e) => handleSubmit(e, message)} style={{bottom: 20, marginTop: 10, marginBottom: isMobile ? 0 : 10, maxWidth: viewWidth, minWidth: viewWidth, }}>
					<TextField
						id="message"
						fullWidth
						disabled={loading}
						label="Send a message"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						variant="outlined"
						autoFocus
						InputProps={{
							endAdornment: (
								<IconButton
									aria-label="send message"
									onClick={(e) => handleSubmit(e, message)}
								>
									<SendIcon color="primary" />
								</IconButton>
							)
						}}
					/>
					
				</form>
				{isMobile ? null : 
					<Typography variant="body2" color="textSecondary" align="center" style={{marginTop: 0,}} >
						{`The Shuffle AI is a test system for automatic workflow generation and atomic functions for the future of Shuffle. Shuffle AI may use your organization info in the query, and attempts to auto-correct any failed behavior. If you have any questions, please contact us at ${supportEmail}`}
					</Typography>
				}
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
