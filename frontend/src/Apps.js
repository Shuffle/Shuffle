import React, { useEffect} from 'react';

import { useInterval } from 'react-powerhooks';

import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import ButtonBase from '@material-ui/core/ButtonBase';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Tooltip from '@material-ui/core/Tooltip';
import YAML from 'yaml'
import {Link} from 'react-router-dom';

import CloudDownload from '@material-ui/icons/CloudDownload';
import { useAlert } from "react-alert";

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';


const surfaceColor = "#27292D"
const inputColor = "#383B40"

const Apps = (props) => {
  const { globalUrl, isLoggedIn, isLoaded } = props;

	//const [workflows, setWorkflows] = React.useState([]);
	const alert = useAlert()
	const [selectedApp, setSelectedApp] = React.useState({});
	const [firstrequest, setFirstrequest] = React.useState(true)
	const [apps, setApps] = React.useState([])
	const [filteredApps, setFilteredApps] = React.useState([])
	const [validation, setValidation] = React.useState(false)
	const [isLoading, setIsLoading] = React.useState(false)

	const [openApi, setOpenApi] = React.useState("")
	const [openApiData, setOpenApiData] = React.useState("")
	const [appValidation, setAppValidation] = React.useState("")
	const [openApiModal, setOpenApiModal] = React.useState(false);
	const [openApiModalType, setOpenApiModalType] = React.useState("");
	const [openApiError, setOpenApiError] = React.useState("")
	const { start, stop } = useInterval({
	  	duration: 5000,
	  	startImmediate: false,
	  	callback: () => {
				getApps()
	  	}
	});

	useEffect(() => {
		if (apps.length <= 0 && firstrequest) {
			document.title = "Shuffle - Apps"

			if (!isLoggedIn && isLoaded) {
				window.location = "/login"
			}

			setFirstrequest(false)
			getApps()
		}
	})

	const appViewStyle = {
		color: "#ffffff",
		width: "100%",
		display: "flex",
	}

	const paperAppStyle = {
		minHeight: 130,
		maxHeight: 130,
		minWidth: "100%",
		maxWidth: "100%",
		color: "white",
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
	}

	const getApps = () => {
		fetch(globalUrl+"/api/v1/workflows/apps", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for apps :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			setApps(responseJson)
			setFilteredApps(responseJson)
			if (responseJson.length > 0) {
				setSelectedApp(responseJson[0])
			}
    	})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const downloadApp = (inputdata) => {
		const id = inputdata.id

		alert.info("Preparing download.")	
		fetch(globalUrl+"/api/v1/apps/"+id+"/config", {
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
			if (!responseJson.success) {
				alert.error("Failed to download file")
			} else {
				const data = YAML.stringify(YAML.parse(responseJson.body))

				var name = inputdata.name
				name = name.replace(/ /g, "_", -1)
				name = name.toLowerCase()

				var blob = new Blob( [ data ], {
					type: 'application/octet-stream'
				})

				var url = URL.createObjectURL( blob )
				var link = document.createElement( 'a' )
				link.setAttribute( 'href', url )
				link.setAttribute( 'download', `${name}.yaml` )
				var event = document.createEvent( 'MouseEvents' )
				event.initMouseEvent( 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
				link.dispatchEvent( event )
				//link.parentNode.removeChild(link)
			}
		})
		.catch(error => {
			console.log(error)
			alert.error(error.toString())
		});
	}

	// dropdown with copy etc I guess
	const appPaper = (data) => {
		var boxWidth = "2px"
		if (selectedApp.id === data.id) {
			boxWidth = "4px"
		}

		var boxColor = "orange"
		if (data.is_valid) {
			boxColor = "green"
		}

		var imageline = data.large_image.length === 0 ?
			<img alt="Image missing" style={{width: 100, height: 100}} />
			: 
			<img alt={data.title} src={data.large_image} style={{width: 100, height: 100, maxWidth: "100%"}} />

		// FIXME - add label to apps, as this might be slow with A LOT of apps
		var newAppname = data.name
		newAppname = newAppname.replace("_", " ")
		newAppname = newAppname.charAt(0).toUpperCase()+newAppname.substring(1)

		var sharing = "public"
		if (!data.sharing) {
			sharing = "private"
		}

		var valid = "true"
		if (!data.valid) {
			valid = "false"
		}

		if (data.actions === null || data.actions.length === 0) {
			valid = "false"
		}

		var description = data.description
		const maxDescLen = 60
		if (description.length > maxDescLen) {
			description = data.description.slice(0, maxDescLen)+"..."
		}

		return (
			<Paper square style={paperAppStyle} onClick={() => {
				if (selectedApp.id !== data.id) {
					setSelectedApp(data)
				}
			}}>
				<Grid container style={{margin: 10, flex: "10"}}>
					<ButtonBase>
						{imageline}
					</ButtonBase>
					<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: boxWidth, backgroundColor: boxColor}}>
					</div>
					<Grid container style={{margin: "0px 10px 10px 10px", flex: "1"}}>
						<Grid style={{display: "flex", flexDirection: "column", width: "100%"}}>
							<Grid item style={{flex: "1"}}>
								<h3 style={{marginBottom: "0px"}}>{newAppname}</h3>
							</Grid>
							<div style={{display: "flex", flex: "1"}}>
								<Grid item style={{flex: "1", justifyContent: "center", overflow: "hidden"}}>
									{description}	
								</Grid>
							</div>
							<Grid item style={{flex: "1", justifyContent: "center"}}>
								Sharing: {sharing}	
								,&nbsp;Valid: {valid}	
							</Grid>
						</Grid>
					</Grid>
				</Grid>
				<Grid container style={{margin: "10px 10px 10px 10px", flex: "1"}} onClick={() => {downloadApp(data)}}>
					<Tooltip title={"Download"} style={{marginTop: "28px", width: "100%"}} aria-label={data.name}>
						<CloudDownload /> 
					</Tooltip>
				</Grid>
			</Paper>
		)
	}

	const dividerColor = "rgb(225, 228, 232)"
	const uploadViewPaperStyle = {
		minWidth: "100%",
		maxWidth: "100%",
		color: "white",
		backgroundColor: surfaceColor,
		display: "flex",
		marginBottom: 10, 
	}

	//const handleFile = (event) =>{
	//	const formData = new FormData();
	//	formData.append('file', event.target.files[0]);

	//	fetch(globalUrl+"/api/v1/workflows/apps/validate", {
    //	  	method: 'POST',
	//			headers: {
	//				'Accept': 'application/json',
	//			},
	//			body: formData,
	//  			credentials: "include",
    //		})
	//	.then((response) => {
	//		if (response.status !== 200) {
	//			console.log("Status not 200 for apps :O!")
	//			return 
	//		}
	//		return response.json()
	//	})
    //	.then((responseJson) => {
	//		console.log(responseJson)
    //	})
	//	.catch(error => {
	//		alert.error(error.toString())
	//	});
	//}

	const UploadView = () => {
		//var imageline = selectedApp.large_image === undefined || selectedApp.large_image.length === 0 ?
		//	<img alt="" style={{width: "80px"}} />
		//	: 
		//	<img alt="PICTURE" src={selectedApp.large_image} style={{width: "80px", height: "80px"}} />
		// FIXME - add label to apps, as this might be slow with A LOT of apps
		var newAppname = selectedApp.name
		if (newAppname !== undefined && newAppname.length > 0) {
			newAppname = newAppname.replace("_", " ")
			newAppname = newAppname.charAt(0).toUpperCase()+newAppname.substring(1)
		} else {
			newAppname = ""
		}

		var description = selectedApp.description

		const url = "/apps/edit/"+selectedApp.id
		var editButton = selectedApp.private_id !== undefined && selectedApp.private_id.length > 0 && selectedApp.generated ?
			<Link to={url} style={{textDecoration: "none"}}>
				<Button
					variant="outlined"
					component="label"
					color="primary"
					style={{marginTop: "10px"}}
				>
					Edit app	
				</Button></Link> : null


		var deleteButton = (selectedApp.private_id !== undefined && selectedApp.private_id.length > 0 && selectedApp.generated) || (selectedApp.downloaded != undefined && selectedApp.downloaded == true) ?
				<Button
					variant="outlined"
					component="label"
					color="primary"
					style={{marginLeft: 5, marginTop: 10}}
					onClick={() => {
						deleteApp(selectedApp.id)
					}}
				>
					Delete app	
				</Button> : null


		//fetch(globalUrl+"/api/v1/get_openapi/"+urlParams.get("id"), {
		var baseInfo = newAppname.length > 0 ?
			<div>
				<h2>{newAppname}</h2>
				<p>{description}</p>
				<Divider style={{marginBottom: "10px", marginTop: "10px", backgroundColor: dividerColor}}/>
				<p>URL: {selectedApp.link}</p>
				<p>ID: {selectedApp.id}</p>
				<p>PrivateID: {selectedApp.privateId}</p>
				{editButton}
				{deleteButton}
			</div>
			: 
			null

		return(
			<div>
				<Paper square style={uploadViewPaperStyle}>
					<div style={{width: "100%", margin: 25}}>
						<h2>App creation</h2>
						<Link to="/docs/apps" style={{textDecoration: "none", color: "#f85a3e"}}>What are apps?</Link>
						&nbsp;- <a href="https://swagger.io/specification/" style={{textDecoration: "none", color: "#f85a3e"}}>OpenAPI specification</a>
						<div/>
						Apps are how you interact with workflows, and are used to execute workflows. They are created with the app creator, using OpenAPI specification or manually in python.
						<div/>
						<div style={{marginTop: 20}}>
							<Button
								variant="outlined"
								component="label"
								color="primary"
								style={{marginRight: 10, }}
								onClick={() => {
									setOpenApiModal(true)
								}}
							>
								Create from OpenAPI 	
							</Button>
							<Link to="/apps/new" style={{textDecoration: "none", color: "#f85a3e"}}>
								<Button
									variant="outlined"
									component="label"
									color="primary"
									style={{}}
								>
									Create from scratch
								</Button>
							</Link>
						</div>
					</div>
				</Paper>
				<Paper square style={uploadViewPaperStyle}>
					<div style={{width: "100%", margin: 25}}>
						{baseInfo}
					</div>
				</Paper>
			</div>
		)
	}

	const handleSearchChange = (event) => {
		const searchfield = event.target.value.toLowerCase()
		const newapps = apps.filter(data => data.name.toLowerCase().includes(searchfield) || data.description.toLowerCase().includes(searchfield))
		setFilteredApps(newapps)
	}

	const appView = isLoggedIn ? 
		<div style={{width: 1366, margin: "auto"}}>
			<div style={appViewStyle}>	
				<div style={{flex: "1", marginLeft: "10px", marginRight: "10px"}}>
					<h2>Upload</h2>
					<div style={{marginTop: 20}}/>
					<UploadView />
				</div>
				<Divider style={{marginBottom: "10px", marginTop: "10px", height: "100%", width: "1px", backgroundColor: dividerColor}}/>
				<div style={{flex: 1, marginLeft: "10px", marginRight: "10px"}}>
					<div style={{display: "flex"}}>
						<div style={{flex: 10}}>
							<h2>Available integrations</h2> 
						</div>
						{isLoading ? <CircularProgress style={{marginTop: 13, marginRight: 15}} /> : null}
						<Button
							variant="contained"
							component="label"
							color="primary"
							style={{maxHeight: 50, marginTop: 10}}
							onClick={() => {
								getExistingApps()
							}}
						>
							Load existing apps
						</Button>
					</div>
					<TextField
						style={{backgroundColor: inputColor}} 
						InputProps={{
							style:{
								color: "white",
								minHeight: "50px", 
								marginLeft: "5px",
								maxWidth: "95%",
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={"Search apps"}
						onChange={(event) => {
							handleSearchChange(event)
						}}
					/>
					<div style={{marginTop: 15}}>
						{apps.length > 0 ? 
							filteredApps.length > 0 ? 
								<div style={{maxHeight: "80vh", overflowY: "scroll"}}>
									{filteredApps.map(app => {
										return (
											appPaper(app)
										)
									})}
								</div>
							: 
							<Paper square style={uploadViewPaperStyle}>
								<h4>
									Try a broader search term. E.g. "http" or "TheHive"	
								</h4>
							</Paper>
						: 
						<Paper square style={uploadViewPaperStyle}>
							<h4>
								No apps have been created, uploaded or downloaded yet. Click "Load existing apps" above to get the baseline. This may take a while as its building docker images.
							</h4>
						</Paper>
						}
					</div>
				</div>
			</div>
		</div>
		: 
		null

	// Gets the URL itself (hopefully this works in most cases?
	// Will then forward the data to an internal endpoint to validate the api
	const getExistingApps = () => {
		setValidation(true)

		setIsLoading(true)
		start()

		alert.success("Downloading and building apps. Feel free to move around meanwhile.")
		var cors = "cors"
		fetch(globalUrl+"/api/v1/apps/get_existing", {
    	method: "GET",
			mode: "cors",
			headers: {
				'Accept': 'application/json',
			},
	  	credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				alert.success("Failed loading.")
			} else {
				response.text().then(function (text) {
					console.log("RETURN: ", text)
					alert.success("Loaded existing apps!")
				})
			}
			setIsLoading(false)
			stop()
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	// Gets the URL itself (hopefully this works in most cases?
	// Will then forward the data to an internal endpoint to validate the api
	const validateUrl = () => {
		setValidation(true)

		var cors = "cors"
		if (openApi.includes("localhost")) {
			cors = "no-cors"
		}

		fetch(openApi, {
    	method: "GET",
			mode: "cors",
		})
		.then((response) => {
			response.text().then(function (text) {
				validateOpenApi(text)
			})
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const deleteApp = (appId) => {
		alert.info("Attempting to delete app")		
		fetch(globalUrl+"/api/v1/apps/"+appId, {
    	method: 'DELETE',
			headers: {
				'Accept': 'application/json',
			},
	  		credentials: "include",
		})
		.then((response) => {
			if (response.status === 200) {
				alert.success("Successfully deleted app")		
				getApps()
			} else {
				alert.error("Failed deleting app")		
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const validateRemote = () => {
		setValidation(true)

		fetch(globalUrl+"/api/v1/get_openapi_uri", {
    	  	method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: JSON.stringify(openApi),
	  		credentials: "include",
		})
		.then((response) => {
			return response.text()
		})
    	.then((responseText) => {
			validateOpenApi(responseText)
			setValidation(false)
    	})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const escapeApiData = (apidata) => {
		console.log(apidata)
		try {
			return JSON.stringify(JSON.parse(apidata))
		} catch(error) {
			console.log("JSON DECODE ERROR - TRY YAML")
		}


		try {
			return JSON.stringify(YAML.parse(apidata))
		} catch(error) {
			console.log("YAML DECODE ERROR - TRY SOMETHING ELSE?: "+error)
			setOpenApiError(error)
		}

		return ""
	}

	// Sends the data to backend, which should return a version 3 of the same API
	// If 200 - continue, otherwise, there's some issue somewhere
	const validateOpenApi = (openApidata) => {
		const newApidata = escapeApiData(openApidata)
		if (newApidata === "") {
			return
		}

		fetch(globalUrl+"/api/v1/validate_openapi", {
    	  	method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: newApidata,
	  		credentials: "include",
		})
		.then((response) => {
			return response.json()
		})
    	.then((responseJson) => {
			setValidation(false)
			if (responseJson.success) {
				setAppValidation(responseJson.id)
			} else {
				if (responseJson.reason !== undefined) {
					setOpenApiError(responseJson.reason)
				}
				alert.error("An error occurred in the response")
			}
    	})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const redirectOpenApi = () => {
		window.location.href = "/apps/new?id="+appValidation
	}

	const errorText = openApiError.length > 0 ? <div>Error: {openApiError}</div> : null
	const circularLoader = validation ? <CircularProgress color="primary" /> : null
	const modalView = openApiModal ? 
		<Dialog modal 
			open={openApiModal}
			onClose={() => {setOpenApiModal(false)}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<FormControl>
			<DialogTitle><div style={{color: "rgba(255,255,255,0.9)"}}>Create a new integration</div></DialogTitle>
				<DialogContent style={{color: "rgba(255,255,255,0.65)"}}>
					Paste in the URI for the OpenAPI
					<TextField
						style={{backgroundColor: inputColor}}
						variant="outlined"
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								height: "50px",
								fontSize: "1em",
							},
							endAdornment: <Button style={{borderRadius: "0px", marginTop: "0px", height: "50px"}} variant="contained" disabled={openApi.length === 0} color="primary" onClick={() => {
								setOpenApiError("")
								validateRemote()
							}}>Validate</Button>
						}}
						onChange={e => setOpenApi(e.target.value)}
						helperText={<div style={{color:"white", marginBottom: "2px",}}>Must point to a version 2 or 3 specification.</div>}
						placeholder="OpenAPI URI"
						fullWidth
					  />
					  <div style={{marginTop: "15px"}}/>
					  Example: 
					  <div />
					  https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/json/uber.json
					  <h4>or paste the yaml/JSON directly below</h4>
					<TextField
						style={{backgroundColor: inputColor}}
						variant="outlined"
						multiline
						rows={6}
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								fontSize: "1em",
							},
							endAdornment: <Button style={{marginLeft: 10, borderRadius: "0px", marginTop: "0px"}} variant="contained" disabled={openApiData.length === 0} color="primary" onClick={() => {
								setOpenApiError("")
								validateOpenApi(openApiData)
							}}>Validate data</Button>
						}}
						onChange={e => setOpenApiData(e.target.value)}
						helperText={<div style={{color:"white", marginBottom: "2px",}}>Must point to a version 2 or 3 specification.</div>}
						placeholder="OpenAPI text"
						fullWidth
					  />
					  {errorText}
				</DialogContent>
				<DialogActions>
					{circularLoader}
	        	  	<Button style={{borderRadius: "0px"}} onClick={() => setOpenApiModal(false)} color="primary">
	        	    	Cancel
	        	  	</Button>
	        	  	<Button style={{borderRadius: "0px"}} disabled={appValidation.length === 0} onClick={() => {
						redirectOpenApi()
					}} color="primary">
	        	    	Submit	
	        	  	</Button>
				</DialogActions>
			</FormControl>
		</Dialog>
		: null


	const loadedCheck = isLoaded && !firstrequest ?  
		<div>
			{appView}
			{modalView}
		</div>
		:
		<div>
		</div>

	// Maybe use gridview or something, idk
	return (
		<div>
			{loadedCheck}
		</div>
	)
}

export default Apps 
