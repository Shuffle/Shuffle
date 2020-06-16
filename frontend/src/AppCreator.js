import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/styles';
import {BrowserView, MobileView} from "react-device-detect";

import {Link} from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Switch from '@material-ui/core/Switch';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import AppsIcon from '@material-ui/icons/Apps';

import ErrorOutline from '@material-ui/icons/ErrorOutline';
import { useAlert } from "react-alert";
import words from "shellwords"

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
	color: "white",
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
})


const rewrite = (args) => {
  return args.reduce(function(args, a){
    if (0 === a.indexOf('-X')) {
      args.push('-X')
      args.push(a.slice(2))
    } else {
      args.push(a)
    }

    return args
  }, [])
}

const parseField = (s) => {
  return s.split(/: (.+)/)
}

const isURL = (s) => {
  return /^https?:\/\//.test(s)
}

// Parses CURL to a real request
const parseCurl = (s) => {
	//console.log("CURL: ", s)

  if (0 != s.indexOf('curl ')) {
		console.log("Not curl start")
		return ""
	}

  var args = rewrite(words.split(s))
  var out = { method: 'GET', header: {} }
  var state = ''

  args.forEach(function(arg){
    switch (true) {
      case isURL(arg):
        out.url = arg
        break;

      case arg === '-A' || arg === '--user-agent':
        state = 'user-agent'
        break;

      case arg === '-H' || arg === '--header':
        state = 'header'
        break;

      case arg === '-d' || arg === '--data' || arg === '--data-ascii':
        state = 'data'
        break;

      case arg === '-u' || arg === '--user':
        state = 'user'
        break;

      case arg === '-I' || arg === '--head':
        out.method = 'HEAD'
        break;

      case arg === '-X' || arg === '--request':
        state = 'method'
        break;

      case arg === '-b' || arg === '--cookie':
        state = 'cookie'
        break;

      case arg === '--compressed':
        out.header['Accept-Encoding'] = out.header['Accept-Encoding'] || 'deflate, gzip'
        break;

      case !!arg:
        switch (state) {
          case 'header':
            var field = parseField(arg)
            out.header[field[0]] = field[1]
            state = ''
            break;
          case 'user-agent':
            out.header['User-Agent'] = arg
            state = ''
            break;
          case 'data':
            if (out.method === 'GET' || out.method === 'HEAD') out.method = 'POST'
            out.header['Content-Type'] = out.header['Content-Type'] || 'application/x-www-form-urlencoded'
            out.body = out.body
              ? out.body + '&' + arg
              : arg
            state = ''
            break;
          case 'user':
            out.header['Authorization'] = 'Basic ' + btoa(arg)
            state = ''
            break;
          case 'method':
            out.method = arg
            state = ''
            break;
          case 'cookie':
            out.header['Set-Cookie'] = arg
            state = ''
            break;
        }
        break;
    }
  })

	return out
}

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
	const [authenticationRequired, setAuthenticationRequired] = useState(false);
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
				parseIncomingOpenapiData(data)
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
				parseIncomingOpenapiData(data)
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
	// This is the data FROM the database, not what's being saved
	const parseIncomingOpenapiData = (data) => {
		setBasedata(data)

		setName(data.info.title)
		setDescription(data.info.description)
		document.title = "Apps - "+data.info.title

		if (data.info !== null && data.info !== undefined && data.info["x-logo"] !== undefined) {
			setFileBase64(data.info["x-logo"])
		}

		if (data.info.contact != undefined) {
			setContact(data.info.contact)
		}

		if (data.servers !== undefined && data.servers.length > 0) {
			var firstUrl = data.servers[0].url
			if (firstUrl.endsWith("/")) {
				setBaseUrl(firstUrl.slice(0, firstUrl.length-1))
			}
		} 

		// This is annoying (:
		var securitySchemes = data.components.securityDefinitions
		if (securitySchemes === undefined) {
			securitySchemes = data.securitySchemes
		} 

		if (securitySchemes === undefined) {
			securitySchemes = data.components.securitySchemes
		} 


		console.log(data)

		// FIXME - headers?
		var newActions = []
		var wordlist = {}
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

					// FIXME: This doesn't follow OpenAPI3 exactly. 
					// https://swagger.io/docs/specification/describing-request-body/
					// https://swagger.io/docs/specification/describing-parameters/
					// Need to split the data.
					} else if (parameter.in === "body") {
						console.log("BODY: ", parameter)
						newaction.body = parameter.example
					} else if (parameter.in === "header") {
						newaction.headers += `${parameter.name}=${parameter.example}\n`	
					}
				}

				if (newaction.name === "" || newaction.name === undefined) {
					// Find a unique part of the string
					// FIXME: Looks for length between /, find the one where they differ
					// Should find others with the same START to their path 
					// Make a list of reserved names? Aka things that show up only once
					if (Object.getOwnPropertyNames(wordlist).length === 0) {
						for (let [newpath, pathvalue] of Object.entries(data.paths)) {
							const newpathsplit = newpath.split("/")
							for(var key in newpathsplit) {
								const pathitem = newpathsplit[key].toLowerCase()
								if (wordlist[pathitem] === undefined) {
									wordlist[pathitem] = 1
								} else {
									wordlist[pathitem] += 1
								}
							}
						}
					} 

					//console.log("WORDLIST: ", wordlist)

					// Remove underscores and make it normal with upper case etc
					const urlsplit = path.split("/")
					if (urlsplit.length > 0) {
						var curname = ""
						for(var key in urlsplit) {
							var subpath = urlsplit[key]	
							if (wordlist[subpath] > 2 || subpath.length < 1) {
								continue
							}
						
							curname = subpath
							break
						}

						// FIXME: If name exists, 
						// FIXME: Check if first part of parsedname is verb, otherwise use method
						const parsedname = curname.split("_").join(" ").split("-").join(" ").split("{").join(" ").split("}").join(" ").trim()
						if (parsedname.length === 0) {
							newaction.errors.push("Missing name")
						} else {
							const newname = method.charAt(0).toUpperCase() + method.slice(1) + " " + parsedname
							const searchactions = newActions.find(data => data.name === newname) 
							console.log("SEARCH: ", searchactions)
							if (searchactions !== undefined) {
								newaction.errors.push("Missing name")
							} else {
								newaction.name = newname
							}
						}

					} else {
						newaction.errors.push("Missing name")
					}
				}
				newActions.push(newaction)
			}
		}


		// FIXME: Have multiple authentication options?
		if (securitySchemes !== undefined) {
			for (const [key, value] of Object.entries(securitySchemes)) {
				if (value.scheme === "bearer") {
					setAuthenticationOption("Bearer auth")
					setAuthenticationRequired(true)
					break
				} else if (value.type === "apiKey") {
					setAuthenticationOption("API key")

					value.in = value.in.charAt(0).toUpperCase() + value.in.slice(1);
					setParameterLocation(value.in)
					if (!apikeySelection.includes(value.in)) {
						console.log("APIKEY SELECT: ", apikeySelection)
						alert.error("Might be error in setting up API key authentication")
					}

					console.log("PARAM NAME: ", value.name)
  				setParameterName(value.name)
					setAuthenticationRequired(true)
					break
				} else if (value.scheme === "basic") {
					setAuthenticationOption("Basic auth")
					setAuthenticationRequired(true)
					break
				}
			}
		}

		setActions(newActions)
	}

	// Saving the app that's been configured.
	const submitApp = () => {
		alert.info("Uploading and building app " + name)
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
					"x-logo": fileBase64,
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

		//console.log("LOADED IMAGE: ", data.image)

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

			console.log("ACTION: ", item)

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

			if (item.body.length > 0) {
				const required = false
				newitem = {
					"in": "body",
					"name": "body",
					"multiline": true,
					"description": "Generated by shuffler.io OpenAPI",
					"required": required,
					"example": item.body,
					"schema": {
						"type": "string",
					},
				}

				// FIXME - add application/json if JSON example?
				data.paths[item.url][item.method.toLowerCase()]["requestBody"] = {
					"description": "Generated by Shuffler.io",
					"required": required,
					"content": {
						"example": {
							"example": item.body,
						},
					},
				}

				data.paths[item.url][item.method.toLowerCase()].parameters.push(newitem)
			}

			if (item.headers.length > 0) {
				const required = false

				const headersSplit = item.headers.split("\n")
				for (var key in headersSplit) {
					const header = headersSplit[key]
					console.log("HEADER: ", header)
					var key = ""
					var value = ""
					if (header.length > 0 && header.includes("= ")) {
						const headersplit = header.split("= ")
						key = headersplit[0]	
						value = headersplit[1]	
					} else if (header.length > 0 && header.includes("=")) {
						const headersplit = header.split("=")
						key = headersplit[0]	
						value = headersplit[1]	
					} else if (header.length > 0 && header.includes(": ")) {
						const headersplit = header.split(": ")
						key = headersplit[0]	
						value = headersplit[1]	
					} else if (header.length > 0 && header.includes(":")) {
						const headersplit = header.split(":")
						key = headersplit[0]	
						value = headersplit[1]	
					} else {
						continue
					}

					if (key.length > 0 && value.length > 0) {
						newitem = {
							"in": "header",
							"name": key,
							"multiline": false,
							"description": "Header generated by shuffler.io OpenAPI",
							"required": false,
							"example": value,
							"schema": {
								"type": "string",
							},
						}

						data.paths[item.url][item.method.toLowerCase()].parameters.push(newitem)
					}
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

		console.log("ACTIONS: ", data.paths)

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
				if (responseJson.reason !== undefined) {
					setErrorCode(responseJson.reason)
					alert.error("Failed to verify: "+responseJson.reason)
				}
			} else {
				alert.success("Successfully uploaded openapi")
				if (window.location.pathname.includes("/new")) {
					if (responseJson.id !== undefined && responseJson.id !== null) {
						window.location = `/apps/edit/${responseJson.id}`
					}
				}
			}
		})
		.catch(error => {
			setErrorCode(error.toString())
			alert.error(error.toString())
		});
	}

	const bearerAuth = authenticationOption === "Bearer auth" ? 
		<div style={{color: "white"}}>
			<h4>
				<a target="_blank" href="https://swagger.io/docs/specification/authentication/bearer-authentication/" style={{textDecoriation: "none", color: "#f85a3e"}}>
					Bearer auth
				</a>
			</h4>
			Users will be required to submit their API as the header "Authorization: Bearer APIKEY"
		</div>
		: null

	// Basicauth
	const basicAuth = authenticationOption === "Basic auth" ? 
		<div style={{color: "white"}}>
			<h4>
				<a target="_blank" href="https://swagger.io/docs/specification/authentication/basic-authentication/" style={{textDecoriation: "none", color: "#f85a3e"}}>
					Basic authentication
				</a>
			</h4>
			Users will be required to submit a valid username and password before using the API
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

	//console.log("Option: ", authenticationOption)
	//console.log("Location: ", parameterLocation)
  //console.log("Name: ", parameterName)
	const apiKey = authenticationOption === "API key" ? 
		<div style={{color: "white"}}>
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
				value={parameterName}
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
						{/*
					 	<Tooltip title="Test action" placement="bottom">
							<div style={{color: "#f85a3e", cursor: "pointer", marginRight: "10px", }} onClick={() => {testAction(index)}}>
								Test
							</div>
						</Tooltip>
						*/}
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
		console.log("ACTION: ", currentAction)
	}

	const bodyInfo = actionBodyRequest.includes(currentActionMethod) ?
		<div>
			Body - used as example in action argument
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

		const actionIndex = actions.findIndex(data => data.name === currentAction.name)
		if (actionIndex < 0) {
			actions.push(currentAction)
		} else {
			actions[actionIndex] = currentAction
		}

		setActions(actions)
	}

	const getActionErrors = () => {
		var errormessage = []
		if (currentAction.name === undefined || currentAction.name.length === 0) {
			errormessage.push("Name can't be empty")
		}

		// Url verification
		if (currentAction.url.length === 0) {
			errormessage.push("URL path can't be empty.")
		} else if (!currentAction.url.startsWith("/") && baseUrl.length > 0) {
			errormessage.push("URL must start with /")
		}

		const check = urlPathQueries.findIndex(data => data.name.length === 0)
		if (check >= 0) {
			errormessage.push("All queries must have a value")	
		}

		return errormessage
	}

	const UrlPathParameters = () => {
		var paths = []
		var queries = []

		if (urlPath.includes("{") && urlPath.includes("}")) {
			var tmpWord = ""
			var record = false

			var query = false
			for (var key in urlPath) {
				if (urlPath[key] === "?") {
					query = true
				}

				if (urlPath[key] === "}") {
					if (tmpWord === parameterName) {
						tmpWord = ""
						record = false
						continue
					} else if (query) {
						queries.push(tmpWord)
					} else {
						paths.push(tmpWord)
					}

					tmpWord = ""
					record = false
				}

				if (record) {
					tmpWord += urlPath[key]
				}

				//if (urlPath[key] === "{" && urlPath[key-1] === "/") {
				if (urlPath[key] === "{") {
					record = true
				}
			}
		}

		if (urlPath.includes("<") && urlPath.includes(">")) {
			var tmpWord = ""
			var record = false

			var query = false
			for (var key in urlPath) {
				if (urlPath[key] === "?") {
					query = true
				}

				if (urlPath[key] === ">") {
					if (tmpWord === parameterName) {
						tmpWord = ""
						record = false
						continue
					} else if (query) {
						queries.push(tmpWord)
					} else {
						paths.push(tmpWord)
					}

					tmpWord = ""
					record = false
				}

				if (record) {
					tmpWord += urlPath[key]
				}

				//if (urlPath[key] === "{" && urlPath[key-1] === "/") {
				if (urlPath[key] === "<") {
					record = true
				}
			}
		}

		if (currentAction.paths !== paths && urlPath.length > 0) {
			setActionField("paths", paths)
		} 

		var tmpQueries = [] 

		// No overlapping of names
		for (var key in queries) {
			const tmpquery = queries[key]
			const found = tmpQueries.find(query => query.name === tmpquery)
			if (found === undefined) {
				tmpQueries.push({"name": queries[key], required: true})
			}
		}

		// FIXME: Frontend isn't updating..
		if (JSON.stringify(tmpQueries) !== JSON.stringify(urlPathQueries)) {
			setUrlPathQueries(tmpQueries)
		}

		return paths.length > 0 ? 
			<div>
				Required parameters: {paths.join(", ")}
			</div>
		: null
	}

	const newActionModal = 
		<Dialog 
			open={actionsModalOpen} 
			fullWidth
			onClose={() => {
				console.log("CLOSED?")
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
					<Link target="_blank" to="/docs/apps#actions" style={{textDecoration: "none", color: "#f85a3e"}}>Learn more about actions</Link>
					<div style={{marginTop: "15px"}}/>
					Name
					<TextField
						required
						style={{flex: "1", marginTop: 5, marginRight: 15, backgroundColor: inputColor}}
						fullWidth={true}
						placeholder="Name"
						type="name"
						id="standard-required"
						margin="normal"
						variant="outlined"
						defaultValue={currentAction["name"]}
						onChange={e => {
							setActionField("name", e.target.value)
						}}
						onBlur={e => {
							// Fix basic issues in frontend. Python functions run a-zA-Z0-9_
							const regex = /[A-Za-z0-9 _]/g;
							const found = e.target.value.match(regex);
							if (found !== null) {
								setActionField("name", found.join(""))
							}
						}}
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
					<div style={{marginTop: 10}}/>
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
					URL path / Curl statement
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
						helperText={<div style={{color:"white", marginBottom: "2px",}}>The path to use. Must start with /. Use {"{variablename}"} to have path variables</div>}
						InputProps={{
							classes: {
								notchedOutline: classes.notchedOutline,
								input: classes.input,
							},
							style:{
								color: "white",
							},
						}}
						onBlur={event => {
							var parsedurl = event.target.value
							if (parsedurl.startsWith("curl")) {
								const request = parseCurl(event.target.value)
								console.log(request)
								if (request.method.toUpperCase() !== currentAction.Method) {
									setCurrentActionMethod(request.method.toUpperCase())
									setActionField("method", request.method.toUpperCase())
								}

								if (request.header !== undefined && request.header !== null) {
									var headers = []
									for (let [key, value] of Object.entries(request.header)) {
										if (parameterName !== undefined && key.toLowerCase() === parameterName.toLowerCase()) {
											continue
										}

										if (key === "Authorization" && authenticationOption === "Bearer auth") {
											continue
										} 

										headers += key+"="+value+"\n"
									}

									setActionField("headers", headers)
								}

								if (request.body !== undefined && request.body !== null) {
									setActionField("body", request.body)
								}

								// Parse URL
								if (request.url !== undefined) {
									parsedurl = request.url
								}
							}

							if (parsedurl !== undefined) {
								if (parsedurl.includes("<") && parsedurl.includes(">")) {
									parsedurl = parsedurl.split("<").join("{")
									parsedurl = parsedurl.split(">").join("}")
								}

								if (parsedurl.startsWith("http") || parsedurl.startsWith("ftp")) {
									if (parsedurl !== undefined && parsedurl.includes(parameterName)) {
										// Remove <> etc.
										// 
										
										console.log("IT HAS THE PARAM NAME!")
										const newurl = new URL(encodeURI(parsedurl))
										newurl.searchParams.delete(parameterName)
										parsedurl = decodeURI(newurl.href)
									}

									// Remove the base URL itself
									if (parsedurl !== undefined && baseUrl !== undefined && baseUrl.length > 0 && parsedurl.includes(baseUrl)) {
										parsedurl = parsedurl.replace(baseUrl, "")
									}

									// Check URL query && headers 
									setActionField("url", parsedurl)
									setUrlPath(parsedurl)
								}
							}

							//console.log("URL: ", request.url)
						}}
					/>
					<UrlPathParameters />
					{loopQueries}
					<Button color="primary" style={{marginTop: "5px", marginBottom: "10px", borderRadius: "0px"}} variant="outlined" onClick={() => {
						addPathQuery()
					}}>New query</Button> 				
					<div/>
					Headers - static for the action
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
						setUrlPath("")
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
			<Link target="_blank" to="/docs/apps#actions" style={{textDecoration: "none", color: "#f85a3e"}}> here</Link>.
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
			<Link target="_blank" to="/docs/apps#testing" style={{textDecoration: "none", color: "#f85a3e"}}>&nbsp;TBD: Click here to learn more about testing</Link>.
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
		canvas.width = 174
		canvas.height = 174
		var ctx = canvas.getContext('2d')

		img.onload = function() {
			// img, x, y, width, height
			//ctx.drawImage(img, 174, 174)
			console.log("IMG natural: ", img.naturalWidth, img.naturalHeight)
			//ctx.drawImage(img, 0, 0, 174, 174)
			ctx.drawImage(img, 
				0, 0, img.width, img.height, 
				0, 0, canvas.width, canvas.height
			)

			const canvasUrl = canvas.toDataURL()
			if (canvasUrl !== fileBase64) {
				console.log("SET URL TO: ", canvasUrl)
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
	const imageInfo = <img src={imageData} alt="Click to upload an image" id="logo" style={{maxWidth: 174, maxHeight: 174,}} />

	// Random names for type & autoComplete. Didn't research :^)
	const landingpageDataBrowser = 
		<div style={{paddingBottom: 100, color: "white",}}>
				<Breadcrumbs aria-label="breadcrumb" separator="›" style={{color: "white",}}>
					<Link to="/apps" style={{textDecoration: "none", color: "inherit",}}>
						<h2 style={{color: "rgba(255,255,255,0.5)"}}>
							<AppsIcon style={{marginRight: 10}} />
							Apps	
						</h2>
					</Link>
					<h2>
						{name}
					</h2>
				</Breadcrumbs>
				<Paper style={boxStyle}>
					<h2 style={{marginBottom: "10px", color: "white"}}>General information</h2>
					<Link target="_blank" to="/docs/apps#create_openapi_app" style={{textDecoration: "none", color: "#f85a3e"}}>Click here to learn more about app creation</Link>
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
						onBlur={(event) => {
							var tmpstring = event.target.value.trim()
							if (tmpstring.endsWith("/")) {
									tmpstring = tmpstring.slice(0, -1)
							}
							if (tmpstring.length > 4 && !tmpstring.startsWith("http") && !tmpstring.startsWith("ftp")) {
								alert.error("URL must start with http(s)://")
							}

							//if (authenticationOption === "No authentication" && 

							setBaseUrl(tmpstring)
						}}
					/>
					<FormControl style={{marginTop: "15px",}} variant="outlined">
						<h5 style={{marginBottom: "10px", color: "white",}}>Authentication
						</h5>
						<Select
							fullWidth
							onChange={(e) => {
								setAuthenticationOption(e.target.value) 
								if (e.target.value === "No authentication") {
									setAuthenticationRequired(false)
								} else {
									setAuthenticationRequired(true)
								}
							}}
							value={authenticationOption}
							style={{backgroundColor: inputColor, color: "white", height: "50px"}}
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

					{/*authenticationOption === "No authentication" ? null :
						<FormControlLabel
							style={{color: "white", marginBottom: 0, marginTop: 20}}
							label=<div style={{color: "white"}}>Authentication required (default true)</div>
							control={<Switch checked={authenticationRequired} onChange={() => {
								setAuthenticationRequired(!authenticationRequired)
							}} />}
					/>*/}
					<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
					<div style={{marginTop: "25px"}}>
						{actionView}
					</div>
					{/*
					<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
						{testView}
					*/}

	        <Button color="primary" variant="contained" style={{borderRadius: "0px", marginTop: "30px", height: "50px",}} onClick={() => {
						submitApp()
					}}>
						Save
					</Button>
					{errorCode.length > 0 ? `Error: ${errorCode}` : null}
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
