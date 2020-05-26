import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {BrowserView, MobileView} from "react-device-detect";

import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

import ErrorOutline from '@material-ui/icons/ErrorOutline';
import { useAlert } from "react-alert";

const surfaceColor = "#27292D"
const inputColor = "#383B40"

const bodyDivStyle = {
	margin: "auto",
	width: "900px",
}

const actionListStyle = {
	paddingLeft: "10px",
	paddingRight: "10px",
	paddingBottom: "10px",
	paddingTop: "10px",
	marginTop: "5px",
	backgroundColor: inputColor,
	display: "flex", 
	color: "white",
}

const boxStyle = {
	flex: "1",
	marginLeft: "10px",
	marginRight: "10px",
	paddingLeft: "30px",
	paddingRight: "30px",
	paddingBottom: "30px",
	paddingTop: "30px",
	display: "flex", 
	flexDirection: "column",
	backgroundColor: surfaceColor,
}

const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important"
	},
});

// Should be different if logged in :|
const AppCreator = (props) => {
  const { globalUrl, isLoaded } = props;
	const classes = useStyles();
	const alert = useAlert()

	var upload = ""
	const actionNonBodyRequest = ["GET", "HEAD", "DELETE", "CONNECT"]
	const actionBodyRequest = ["POST", "PUT", "PATCH",]
	const authenticationOptions = ["No authentication", "API key", "Bearer auth", "Basic auth", ]
	const apikeySelection = ["Header", "Query",]

	const [name, setName] = useState("");
	const [contact, setContact] = useState("");
	const [file, setFile] = useState("");
	const [fileBase64, setFileBase64] = useState("");
	const [isAppLoaded, setIsAppLoaded] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [description, setDescription] = useState("");
	const [updater, setUpdater] = useState("tmp")
	const [baseUrl, setBaseUrl] = useState("");
	const [actionsModalOpen, setActionsModalOpen] = useState(false);
	const [authenticationOption, setAuthenticationOption] = useState(authenticationOptions[0]);
	const [parameterName, setParameterName] = useState("");
	const [parameterLocation, setParameterLocation] = useState(apikeySelection.length > 0 ? apikeySelection[0] : "");
	const [urlPath, setUrlPath] = useState("");
	//const [urlPathQueries, setUrlPathQueries] = useState([{"name": "test", "required": false}]);
	const [urlPathQueries, setUrlPathQueries] = useState([]);
	const [urlPathParameters, ] = useState([]);
	const [firstrequest, setFirstrequest] = React.useState(true)
	const [, setBasedata] = React.useState({})
	const [actions, setActions] = useState([])
	const [errorCode, setErrorCode] = useState("")

	//const [actions, setActions] = useState([{
	//	"name": "Get workflows",
	//	"description": "Get workflows",
	//	"url": "/workflows",
	//	"headers": "",
	//	"queries": [],
	//	"paths": [],
	//	"body": "",
	//	"errors": ["wutface", "WOAH"],
	//	"method": actionNonBodyRequest[0],
	//}, {
	//	"name": "Get workflow",
	//	"description": "Get workflow",
	//	"url": "/workflows/{id}",
	//	"headers": "",
	//	"queries": [],
	//	"paths": ["id"],
	//	"body": "",
	//	"errors": ["wutface", "WOAH"],
	//	"method": actionNonBodyRequest[0],
	//}, 
	//
	//])

  	const [currentActionMethod, setCurrentActionMethod] = useState(actionNonBodyRequest[0])
  	const [currentAction, setCurrentAction] = useState({
		"name": "",
		"description": "",
		"url": "",
		"headers": "",
		"paths": [],
		"queries": [],
		"body": "",
		"errors": [],
		"method": actionNonBodyRequest[0],
	});



	useEffect(() => {
		if (firstrequest) {
			setFirstrequest(false)
			if (window.location.pathname.includes("apps/edit")) {
  				setIsEditing(true)
				handleEditApp()
			} else {
				checkQuery()
			}
		}
	})

	const handleEditApp = () => {
		fetch(globalUrl+"/api/v1/apps/"+props.match.params.appid+"/config", {
    	  	method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				window.location.pathname = "/apps"
			}

			return response.json()
		})
		.then((responseJson) => {
  			setIsAppLoaded(true)
			if (!responseJson.success) {
				alert.error("Failed to get the app")
			} else {
				const data = JSON.parse(responseJson.body)
				console.log("LOADED IMAGE: ", data.image)
				setFileBase64(data.image)
				parseOpenapiData(data)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}


	// Checks if there is an ID in the query, and gets it if it doesn't exist. 
	const checkQuery = () => {
		var urlParams = new URLSearchParams(window.location.search)
		if (!urlParams.has("id")) {
  			setIsAppLoaded(true)
			return	
		}

		fetch(globalUrl+"/api/v1/get_openapi/"+urlParams.get("id"), {
    	  	method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				throw new Error("NOT 200 :O")
			}

			return response.json()
		})
		.then((responseJson) => {
  			setIsAppLoaded(true)
			if (!responseJson.success) {
				alert.error("Failed to verify")
			} else {
				const data = JSON.parse(responseJson.body)
				parseOpenapiData(data)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const setFileFromb64 = () => {
		//const img = document.getElementById('logo')
		//var canvas = document.createElement('canvas')
		//var ctx = canvas.getContext('2d')

		//img.onload = function() {
		//	console.log("LOADED?")
		//	ctx.drawImage(img, 0, 0)
		//	const canvasUrl = canvas.toDataURL()
		//	console.log(canvasUrl)
		//	setFileBase64(canvasUrl)
		//}
	}

	// Sets the data up as it should be at later points
	const parseOpenapiData = (data) => {
		setBasedata(data)


		setName(data.info.title)
		setDescription(data.info.description)
		document.title = "Apps - "+data.info.title

		if (data.info.contact != undefined) {
			setContact(data.info.contact)
		}

		if (data.servers !== undefined && data.servers.length > 0) {
			setBaseUrl(data.servers[0].url)
		} 

		console.log(data)

		// This is annoying (:
		var securitySchemes = data.components.securityDefinitions
		if (securitySchemes === undefined) {
			securitySchemes = data.securitySchemes
		} 

		if (securitySchemes === undefined) {
			securitySchemes = data.components.securitySchemes
		} 

		if (securitySchemes !== undefined) {
			console.log("Am I in here?")
			for (const [key, value] of Object.entries(securitySchemes)) {
				if (value.scheme === "bearer") {
					setAuthenticationOption("Bearer auth")
					break
				} else if (value.type === "apiKey") {
					setAuthenticationOption("API key")
  				setParameterName(value.name)

					value.in = value.in.charAt(0).toUpperCase() + value.in.slice(1);
					setParameterLocation(value.in)
					if (!apikeySelection.includes(value.in)) {
						console.log("APIKEY SELECT: ", apikeySelection)
						alert.error("Might be error in setting up API key authentication")
					}
					break
				} else if (value.scheme === "basic") {
					setAuthenticationOption("Basic auth")
					break
				}
			}
		}

		// FIXME - headers?
		var newActions = []
		for (let [path, pathvalue] of Object.entries(data.paths)) {
			for (let [method, methodvalue] of Object.entries(pathvalue)) {
				var newaction = {
					"name": methodvalue.summary,
					"description": methodvalue.description,
					"url": path,
					"method": method.toUpperCase(),
					"headers": "",
					"queries": [],
					"paths": [],
					"body": "",
					"errors": [],
				}

				//console.log(`${path}: ${method}`);
				//console.log(methodvalue)

				for (var key in methodvalue.parameters) {
					const parameter = methodvalue.parameters[key]
					if (parameter.in === "query") {
						var tmpaction = {
							"description": parameter.description,
							"name": parameter.name,
							"required": parameter.required,
							"in": "query",
						}

						if (parameter.required === undefined) {
							tmpaction.required = false	
						}

						newaction.queries.push(tmpaction)
					} else if (parameter.in === "path") {
						// FIXME - parse this to the URL too
						newaction.paths.push(parameter.name)
					}
				}

				newActions.push(newaction)
			}
		}

		console.log(newActions)
		setActions(newActions)
	}
				
	const submitApp = () => {
		alert.info("Uploading private app " + name)
		setErrorCode("")

		// Format the information 	
		const splitBase = baseUrl.split("/")	
		const host = splitBase[2]
		const schemes = [splitBase[0]]
		const basePath = "/"+(splitBase.slice(3, )).join("/")
		
		const data = {
  			"swagger": "3.0",
  			"info": {
  			  "title": name,
  			  "description": description,
  			  "version": "1.0",
  			},
				"servers": [{"url": baseUrl}],
  			"host": host,
  			"basePath": basePath,
  			"schemes": schemes,
  			"paths": {},
				"editing": isEditing,
				"components": {
					"securitySchemes": {},
				},
				"image": fileBase64,
				"id": props.match.params.appid,
  			"securityDefinitions": {},
		}

		if (contact === "") {
			  data.info["contact"] =  {
				"name": "@frikkylikeme",
				"url": "https://twitter.com/frikkylikeme",  
				"email": "frikky@shuffler.io",
			  }
		} else {
			data.info["contact"] = contact
		}

		console.log("LOADED IMAGE: ", data.image)

		for (var key in actions) {
			const item = actions[key]
			if (item.errors.length > 0) {
				alert.error("Saving with error in action "+item.name)
			}

			if (item.name === undefined && item.description !== undefined) {
				item.name = item.description
			}

			if (data.paths[item.url] === null || data.paths[item.url] === undefined) {
				data.paths[item.url] = {}
			}

			data.paths[item.url][item.method.toLowerCase()] = {
				"responses": {
					"default": {
					  "description": "default",
					  "schema": {}
					}
				},
				"summary": item.name,
				"description": item.description,
				"parameters": []
			}

			if (item.queries.length > 0) {
				for (var querykey in item.queries) {
					const queryitem = item.queries[querykey]

					var newitem = {
						"in": "query",
						"name": queryitem.name,
						"description": "Generated by shuffler.io OpenAPI",
						"required": queryitem.required,
						"schema": {
							"type": "string",
						},
					}

					if (queryitem.description !== undefined) {
						newitem.description = queryitem.description
					}

					data.paths[item.url][item.method.toLowerCase()].parameters.push(newitem)
					//console.log(queryitem)
				}
			}

			if (item.paths.length > 0) {
				for (querykey in item.paths) {
					const queryitem = item.paths[querykey]
					newitem = {
						"in": "path",
						"name": queryitem,
						"description": "Generated by shuffler.io OpenAPI",
						"required": true,
						"schema": {
							"type": "string",
						},
					}					
					
					if (queryitem.description !== undefined) {
						newitem.description = queryitem.description
					}

					data.paths[item.url][item.method.toLowerCase()].parameters.push(newitem)
					//console.log(queryitem)
				}
			}
		}

		if (authenticationOption === "API key") {
			data.components.securitySchemes["ApiKeyAuth"] = {
				"type": "apiKey",
				"in": parameterLocation.toLowerCase(),
				"name": parameterName,
			}
		} else if (authenticationOption === "Bearer auth") {
			data.components.securitySchemes["BearerAuth"] = {
				"type": "http",
				"scheme": "bearer",
				"bearerFormat": "UUID",
			}
		} else if (authenticationOption === "Basic auth") {
			data.components.securitySchemes["BasicAuth"] = {
				"type": "http",
				"scheme": "basic",
			}
		}

		fetch(globalUrl+"/api/v1/verify_openapi", {
    	  	method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(data),
	  			credentials: "include",
    		})
		.then((response) => {
			//if (response.status !== 200) {
			//	setErrorCode("An error occurred during validation")
			//	throw new Error("NOT 200 :O")
			//}

			return response.json()
		})
		.then((responseJson) => {
			if (!responseJson.success) {
				setErrorCode(responseJson.reason)
				alert.error("Failed to verify: ")
			} else {
				// Return?
				alert.success("Successfully uploaded openapi")
				//window.location = "/apps"
			}
		})
		.catch(error => {
			setErrorCode(error.toString())
			alert.error(error.toString())
		});
	}

	const bearerAuth = authenticationOption === "Bearer auth" ? 
		<div>
			<h4>
				<a href="https://swagger.io/docs/specification/authentication/bearer-authentication/" style={{textDecoriation: "none", color: "#f85a3e"}}>
					Bearer auth
				</a>
			</h4>
			Users will be required to submit their API as the header "Authorization: Bearer APIKEY"
			<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
		</div>
		: null

	// Basicauth
	const basicAuth = authenticationOption === "Basic auth" ? 
		<div>
			<h4>
				<a href="https://swagger.io/docs/specification/authentication/basic-authentication/" style={{textDecoriation: "none", color: "#f85a3e"}}>
					Basic authentication
				</a>
			</h4>
			Users will be required to submit a valid username and password before using the API
			<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
		</div>
		: null

	// API key
	//const verifyBaseUrl = () => {
	//	if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
	//		return true
	//	}

	//	if (baseUrl.endsWith("/")) {
	//		return true
	//	}
	//		
	//	return false 
	//}

	//const verifyApiParameter = () => {
	//	const notAllowed = ["!","#","$","%","&","'","^","+","-",".","_","~","|","]","+","$",]
	//	for (var key in notAllowed) {
	//		if (parameterName.includes(notAllowed[key])) {
	//			return false
	//		}
	//	}

	//	return true
	//}

	const testAction = (index) => {
		console.log("Should test action at index "+index)
		console.log(actions[index])
	}

	const addPathQuery = () => {
		urlPathQueries.push({"name": "", "required": true})
		if (updater === "addupdater") {
			setUpdater("updater")
		} else {
			setUpdater("addupdater")
		}
		setUrlPathQueries(urlPathQueries)
	}

	const flipRequired = (index) => {
		urlPathQueries[index].required = !urlPathQueries[index].required
		if (updater === "flipupdater") {
			setUpdater("updater")
		} else {
			setUpdater("flipupdater")
		}
		setUrlPathQueries(urlPathQueries)

	}

	const deletePathQuery = (index) => {
		urlPathQueries.splice(index, 1)
		if (updater === "deleteupdater") {
			setUpdater("updater")
		} else {
			setUpdater("deleteupdater")
		}
		setUrlPathQueries(urlPathQueries)
	}

	const deleteAction = (index) => {
		actions.splice(index, 1)
		setCurrentAction({
			"name": "",
			"description": "",
			"url": "",
			"headers": "",
			"paths": [],
			"queries": [],
			"body": "",
			"errors": [],
			"method": actionNonBodyRequest[0],
		})

		setActions(actions)
	}

	console.log("Option: ", authenticationOption)
	console.log("Location: ", parameterLocation)
  console.log("Name: ", parameterName)
	const apiKey = authenticationOption === "API key" ? 
		<div>
			<h4>API key</h4>
			<TextField
				required
				style={{flex: "1", marginRight: "15px", backgroundColor: inputColor}}
				fullWidth={true}
				placeholder="Field Name (not token)"
				type="name"
				id="standard-required"
				margin="normal"
				variant="outlined"
				defaultValue={parameterName}
				helperText={<div style={{color:"white", marginBottom: "2px",}}>Can't be empty. Can't contain any of the following characters: !#$%&'^+-._~|]+$</div>}
				onChange={e => setParameterName(e.target.value)}	
				InputProps={{
					classes: {
						notchedOutline: classes.notchedOutline,
					},
					style:{
						color: "white",
					},
				}}
			/>
			Field type
			<Select
				fullWidth
				onChange={(e) => {
					setParameterLocation(e.target.value) 
				}}
				value={parameterLocation}
				style={{backgroundColor: inputColor, paddingLeft: "10px", color: "white", height: "50px"}}
				inputProps={{
					name: 'age',
					id: 'outlined-age-simple',
				}}
			>
				{apikeySelection.map(data => {
					if (data === undefined) {
						return null
					}

					return (
						<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={data}>
							{data}
						</MenuItem>
					)}
				)}
			</Select>
			<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
		</div>
		: null

	const loopQueries = urlPathQueries.length === 0 ? 
		null :
		<div>
			<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
			Queries
			{urlPathQueries.map((data, index) => {
				const requiredColor = data.required === true ? "green" : "red"
				//const required = data.required === true ? <div style={{color: "green", cursor: "pointer"}}>{data.required.toString()}</div> : <div onClick={() => {flipRequired(index)}} style={{display: "inline", color: "red", cursor: "pointer"}}>{data.required.toString()}</div>
				return (
					<Paper style={actionListStyle}>
						<div style={{marginLeft: "5px", width: "100%"}}>
							<div style={{cursor: "pointer"}} onClick={() => {flipRequired(index)}}>
								Required: <div style={{display: "inline", color: requiredColor}}>{data.required.toString()}</div>
							</div>
							<TextField
								required
								fullWidth={true}
								defaultValue={data.name}
								placeholder={'Query name'}
								helperText={<div style={{color:"white", marginBottom: "2px",}}>Click required switch</div>}
								onBlur={(e) => {
									urlPathQueries[index].name = e.target.value
									setUrlPathQueries(urlPathQueries)
								}}
								InputProps={{
									style:{
										color: "white",
									},
								}}
							/>

						</div>
						<div style={{color: "#f85a3e", cursor: "pointer"}} onClick={() => {deletePathQuery(index)}}>
							Delete
						</div>

					</Paper>
				)
			})}
			<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
		</div>

	const loopActions = actions.length === 0 ? 
		null
		:
		<div>
			{actions.map((data, index) => {
				var error = <Tooltip color="secondary" title={data.errors.join("\n")} placement="bottom">
						<CheckCircleIcon />
					</Tooltip>

				// "ERROR: "+data.errors.join("\n")
				if (data.errors.length > 0) {
					error = 
					 	<Tooltip color="primary" title={data.errors.join("\n")} placement="bottom">
							<ErrorOutline />
						</Tooltip>
				}


				const url = baseUrl+data.url
				return (
					<Paper style={actionListStyle}>
						{error} 
					 	<Tooltip title="Edit action" placement="bottom">
							<div style={{marginLeft: "5px", width: "100%", cursor: "pointer", maxWidth: 675}} onClick={() => {
								setCurrentAction(data)
								setCurrentActionMethod(data.method)
								setUrlPathQueries(data.queries)
								setUrlPath(data.url)
								setActionsModalOpen(true)
							}}>
							{data.method} - {url} - {data.name}
							</div>
						</Tooltip>
					 	<Tooltip title="Test action" placement="bottom">
							<div style={{color: "#f85a3e", cursor: "pointer", marginRight: "10px", }} onClick={() => {testAction(index)}}>
								Test
							</div>
						</Tooltip>
					 	<Tooltip title="Delete action" placement="bottom">
							<div style={{color: "#f85a3e", cursor: "pointer"}} onClick={() => {deleteAction(index)}}>
								Delete
							</div>
						</Tooltip>
					</Paper>
				)
			})}
		</div>

	const setActionField = (field, value) => {
		currentAction[field] = value
		setCurrentAction(currentAction)	
	}

	const bodyInfo = actionBodyRequest.includes(currentActionMethod) ?
		<div>
			Body
			<TextField
				required
				style={{flex: "1", marginRight: "15px", backgroundColor: inputColor}}
				fullWidth={true}
				placeholder={'{\n\t"username": "testing@test.com"\n\t"name": "test testington"\n}'}
				margin="normal"
				variant="outlined"
				multiline
				rows="5"
				defaultValue={currentAction["body"]}
				onChange={e => setActionField("body", e.target.value)}
				key={currentAction}
				InputProps={{
					classes: {
						notchedOutline: classes.notchedOutline,
					},
					style:{
						color: "white",
					},
				}}
			/>

		</div>
		: null

	const addActionToView = (errors) => {
		currentAction.errors = errors
		currentAction.queries = urlPathQueries
		setUrlPathQueries([])

		console.log(actions)
		console.log(currentAction.name)
		const actionIndex = actions.findIndex(data => data.name === currentAction.name)
		console.log(actionIndex)
		if (actionIndex < 0) {
			actions.push(currentAction)
		} else {
			actions[actionIndex] = currentAction
		}

		setActions(actions)
	}

	const getActionErrors = () => {
		var errormessage = []
		if (currentAction.name.length === 0) {
			errormessage.push("Name can't be empty")
		}

		// Url verification
		if (currentAction.url.length === 0) {
			errormessage.push("URL path can't be empty.")
		} else if (!currentAction.url.startsWith("/")) {
			errormessage.push("URL must start with /")
		}

		const check = urlPathQueries.findIndex(data => data.name.length === 0)
		if (check >= 0) {
			errormessage.push("All queries must have a value")	
		}

		console.log(urlPathParameters)
  		// const [urlPathParameters, setUrlPathParameters] = useState([]);

		return errormessage
	}

	const UrlPathParameters = () => {
		if (urlPath.includes("{") && urlPath.includes("}")) {
			var values = []
			var tmpWord = ""
			var record = false
			for (var key in urlPath) {
				if (urlPath[key] === "}") {
					values.push(tmpWord)
					tmpWord = ""
					record = false
				}

				if (record) {
					tmpWord += urlPath[key]
				}

				if (urlPath[key] === "{" && urlPath[key-1] === "/") {
					record = true
				}
			}

			if (!currentAction.paths === values) {
				currentAction.paths = values
				setCurrentAction(currentAction)
			}

			return (
				<div>
					Required parameters: {values.join(", ")}
				</div>
			)
		}

		return null
	}

	const newActionModal = 
		<Dialog 
			open={actionsModalOpen} 
			fullWidth
			onClose={() => {
				setUrlPath("")
				setCurrentAction({
					"name": "",
					"description": "",
					"url": "",
					"headers": "",
					"paths": [],
					"queries": [],
					"body": "",
					"errors": [],
					"method": actionNonBodyRequest[0],
				})
				setCurrentActionMethod(apikeySelection[0])
				setUrlPathQueries([])
				setActionsModalOpen(false)
			}}
		>
			<FormControl style={{backgroundColor: surfaceColor, color: "white",}}>
				<DialogTitle><div style={{color: "white"}}>New action</div></DialogTitle>
				<DialogContent>
					<a href="/docs/apps#actions" style={{textDecoration: "none", color: "#f85a3e"}}>Learn more about app creation</a>
					<div style={{marginTop: "15px"}}/>
					Name
					<TextField
						required
						style={{flex: "1", marginTop: "5px", marginRight: "15px", backgroundColor: inputColor}}
						fullWidth={true}
						placeholder="Name"
						type="name"
						id="standard-required"
						margin="normal"
						variant="outlined"
						defaultValue={currentAction["name"]}
						onChange={e => setActionField("name", e.target.value)}
						key={currentAction}
						InputProps={{
							classes: {
								notchedOutline: classes.notchedOutline,
							},
							style:{
								color: "white",
							},
						}}
					/>
					<div style={{marginTop: "10px"}}/>
					Description
					<TextField
						required
						style={{flex: "1", marginTop: "5px", marginRight: "15px", backgroundColor: inputColor}}
						fullWidth={true}
						placeholder="Description"
						type="description"
						id="standard-required"
						margin="normal"
						variant="outlined"
						defaultValue={currentAction["description"]}
						onChange={e => setActionField("description", e.target.value)}
						InputProps={{
							classes: {
								notchedOutline: classes.notchedOutline,
							},
							style:{
								color: "white",
							},
						}}
					/>
					<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
					<h2>Request</h2>
					<Select
						fullWidth
						onChange={(e) => {
							setActionField("method", e.target.value)
							setCurrentActionMethod(e.target.value)
						}}
						value={currentActionMethod}
						style={{backgroundColor: inputColor, paddingLeft: "10px", color: "white", height: "50px"}}
						inputProps={{
							name: 'Method',
							id: 'method-option',
						}}
						>
						{actionNonBodyRequest.map(data => (
							<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={data}>
								{data}
							</MenuItem>
						))}
						{actionBodyRequest.map(data => (
							<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={data}>
								{data}
							</MenuItem>
						))}
					</Select>
					<div style={{marginTop: "15px"}} />
					URL path
					<TextField
						required
						style={{flex: "1", marginRight: "15px", marginTop: "5px", backgroundColor: inputColor}}
						fullWidth={true}
						placeholder="URL path"
						id="standard-required"
						margin="normal"
						variant="outlined"
						value={urlPath}
						onChange={e => {
							setActionField("url", e.target.value)
							setUrlPath(e.target.value)
							console.log(e.target.value)
						}}
						helperText={<div style={{color:"white", marginBottom: "2px",}}>The path to use. Must start with /. Add {"{variable}"} to have path variables</div>}
						InputProps={{
							classes: {
								notchedOutline: classes.notchedOutline,
								input: classes.input,
							},
							style:{
								color: "white",
							},
						}}
					/>
					<UrlPathParameters />
					{loopQueries}
					<Button color="primary" style={{marginTop: "5px", marginBottom: "10px", borderRadius: "0px"}} variant="outlined" onClick={() => {
						addPathQuery()
					}}>New query</Button> 				
					<div/>
					Headers
					<TextField
						required
						style={{flex: "1", marginRight: "15px", marginTop: "5px", backgroundColor: inputColor}}
						fullWidth={true}
						placeholder={"Accept application/json\r\nContent-Type application/json"}
						margin="normal"
						variant="outlined"
						id="standard-required"
						defaultValue={currentAction["headers"]}
						multiline
						rows="5"
						onChange={e => setActionField("headers", e.target.value)}
						helperText={<div style={{color:"white", marginBottom: "2px",}}>Headers that are part of the request</div>}
						InputProps={{
							classes: {
								notchedOutline: classes.notchedOutline,
							},
							style:{
								color: "white",
							},
						}}
					/>
					{bodyInfo}
				</DialogContent>
				<DialogActions>
	        	  	<Button style={{borderRadius: "0px"}} onClick={() => {
						setActionsModalOpen(false)}}>
						Cancel	
					</Button>
	        	  	<Button color="primary" variant="outlined" style={{borderRadius: "0px"}} onClick={() => {
						const errors = getActionErrors()		
						addActionToView(errors)
						setActionsModalOpen(false)
						setUrlPathQueries([]) 
					}}>
						Submit	
					</Button>
				</DialogActions>
			</FormControl>
		</Dialog>

	const actionView = 
		<div style={{color: "white"}}>
			<h2>Actions</h2>
			Actions are the tasks performed by an app. Read more about actions and apps
			<a href="/docs/apps#actions" style={{textDecoration: "none", color: "#f85a3e"}}> here</a>.
			<div>
				{loopActions}
				<Button color="primary" style={{marginTop: "20px", borderRadius: "0px"}} variant="outlined" onClick={() => {
					setCurrentAction({
						"name": "",
						"description": "",
						"url": "",
						"headers": "",
						"queries": [],
						"paths": [],
						"body": "",
						"errors": [],
						"method": actionNonBodyRequest[0],
					})
  					setCurrentActionMethod(actionNonBodyRequest[0])
					setActionsModalOpen(true)
				}}>New action</Button> 				
			</div>
		</div>

	const testView = 
		<div style={{color: "white"}}>
			<h2>Test</h2>
			Test an action to see whether it performs in an expected way. 
			<a href="/docs/apps#testing" style={{textDecoration: "none", color: "#f85a3e"}}>&nbsp;Click here to learn more about testing</a>.
			<div>
				Test :)
			</div>
		</div>

	var image = ""
	const editHeaderImage = (event) => {
		const file = event.target.value
		const actualFile = event.target.files[0]
		const fileObject = URL.createObjectURL(actualFile)
		setFile(fileObject)
	}

	if (file !== "") {
		const img = document.getElementById('logo')
		var canvas = document.createElement('canvas')
		var ctx = canvas.getContext('2d')

		img.onload = function() {
			// img, x, y, width, height
			ctx.drawImage(img, 0, 0)
			const canvasUrl = canvas.toDataURL()
			console.log(canvasUrl)
			if (canvasUrl !== fileBase64) {
				setFileBase64(canvasUrl)
			}
		}

		//console.log(img.width)
		//console.log(img.width)
		//canvas.width = img.width
		//canvas.height = img.height
	}

	//const imageInfo = file.length === 0 ? 
	//	<div style={{textAlign: "center", marginTop: 20}}>
	//		Upload logo
	//	</div> :
	//	<img src={file} id="logo" style={{width: "100%", height: "100%"}} />

	const imageData = file.length > 0 ? file : fileBase64 
	const imageInfo = <img src={imageData} alt="Click to upload an image" id="logo" style={{width: 174, height: 174}} />

	// Random names for type & autoComplete. Didn't research :^)
	const landingpageDataBrowser = 
		<div style={{paddingBottom: 100, color: "white",}}>
				<Paper style={boxStyle}>
					<h2 style={{marginBottom: "10px", color: "white"}}>General information</h2>
					<a href="/docs/apps#create" style={{textDecoration: "none", color: "#f85a3e"}}>Click here to learn more about app creation</a>
					<div style={{color: "white", flex: "1", display: "flex", flexDirection: "row"}}>
					 	<Tooltip title="Click to edit the app's image" placement="bottom">
							<div style={{flex: "1", margin: 10, border: "1px solid #f85a3e", cursor: "pointer", backgroundColor: inputColor, maxWidth: 174, maxHeight: 174}} onClick={() => {upload.click()}}>
								<input hidden type="file" ref={(ref) => upload = ref} onChange={editHeaderImage} />
								{imageInfo}
							</div>
						</Tooltip>
						<div style={{flex: "3", color: "white",}}>
							<div style={{marginTop: "10px"}}/>
							Name	
							<TextField
								required
								style={{flex: "1", marginTop: "5px", marginRight: "15px", backgroundColor: inputColor}}
								fullWidth={true}
								placeholder="Name"
								type="name"
							  	id="standard-required"
								margin="normal"
								variant="outlined"
								value={name}
      	 						onChange={e => setName(e.target.value)}
								color="primary"
								InputProps={{
									style:{
										color: "white",
										height: "50px", 
										fontSize: "1em",
									},
									classes: {
										notchedOutline: classes.notchedOutline,
									},
								}}
							/>
							<div style={{marginTop: "10px"}}/>
							Description
							<TextField
								required
								style={{flex: "1", marginTop: "5px", marginRight: "15px", backgroundColor: inputColor}}
								fullWidth={true}
								type="name"
							  	id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder="A description for the service"
								value={description}
      	 						onChange={e => setDescription(e.target.value)}
								InputProps={{
									classes: {
										notchedOutline: classes.notchedOutline,
									},
									style:{
										color: "white",
									},
								}}
							/>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
					<h3 style={{marginBottom: "10px", color: "white",}}>API information</h3>
					<span style={{color: "white"}}>Base URL - leave empty if user changeable</span>
					<TextField
						color="primary"
						style={{backgroundColor: inputColor, marginTop: "5px"}}
						InputProps={{
							classes: {
								notchedOutline: classes.notchedOutline,
							},
							style:{
								height: "50px", 
								color: "white",
								fontSize: "1em",
							},
						}}
						required
						fullWidth={true}
						type="name"
						id="standard-required"
						margin="normal"
						variant="outlined"
						value={baseUrl}
						helperText={<div style={{color:"white", marginBottom: "2px",}}>Must start with http(s):// and CANT end with /. </div>}
						placeholder="https://api.example.com"
						onChange={e => setBaseUrl(e.target.value)}
					/>
					<FormControl style={{marginTop: "15px",}} variant="outlined">
						<h5 style={{marginBottom: "10px", color: "white",}}>Authentication</h5>
						<Select
							fullWidth
							onChange={(e) => {
								setAuthenticationOption(e.target.value) 
							}}
							value={authenticationOption}
							style={{backgroundColor: inputColor, paddingLeft: "10px", color: "white", height: "50px"}}
							>
							{authenticationOptions.map(data => (
								<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={data}>
									{data}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					{basicAuth}
					{bearerAuth}
					{apiKey}
					<div style={{marginTop: "25px"}}>
						{actionView}
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
						{testView}

	        <Button color="primary" variant="contained" style={{borderRadius: "0px", marginTop: "30px", height: "50px",}} onClick={() => {
						submitApp()
					}}>
						Save	
					</Button>
					{errorCode}
				</Paper>
		</div>


	const loadedCheck = isLoaded && isAppLoaded && !firstrequest ? 
		<div>
			<div style={bodyDivStyle}>{landingpageDataBrowser}</div>
			{newActionModal} 
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
export default AppCreator;
