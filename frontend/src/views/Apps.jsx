import React, { useEffect } from 'react';

import { useInterval } from 'react-powerhooks';

import AppsIcon from '@material-ui/icons/Apps';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import ButtonBase from '@material-ui/core/ButtonBase';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Input from '@material-ui/core/Input';
import YAML from 'yaml'
import {Link} from 'react-router-dom';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import ReactJson from 'react-json-view'
import Chip from '@material-ui/core/Chip';

import CachedIcon from '@material-ui/icons/Cached';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import PublishIcon from '@material-ui/icons/Publish';
import CloudDownload from '@material-ui/icons/CloudDownload';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

import { useAlert } from "react-alert";

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';

import Dropzone from '../components/Dropzone';

const surfaceColor = "#27292D"
const inputColor = "#383B40"

// Parses JSON data into keys that can be used everywhere :)
export const GetParsedPaths = (inputdata, basekey) => {
	const splitkey = " > "
	var parsedValues = []
	if (typeof(inputdata) !== "object") {
		return parsedValues
	}

	for (const [key, value] of Object.entries(inputdata)) {
		// Check if loop or JSON
		const extra = basekey.length > 0 ? splitkey : ""
		const basekeyname = `${basekey.slice(1, basekey.length).split(".").join(splitkey)}${extra}${key}`

		// Handle direct loop!
		if (!isNaN(key) && basekey === "") {
			console.log("Handling direct loop.")
			parsedValues.push({"type": "object", "name": "Node", "autocomplete": `${basekey}`})
			parsedValues.push({"type": "list", "name": `${splitkey}list`, "autocomplete": `${basekey}.#`})
			const returnValues = GetParsedPaths(value, `${basekey}.#`)
			for (var subkey in returnValues) {
				parsedValues.push(returnValues[subkey])
			}

			return parsedValues
		}

		//console.log("KEY: ", key, "VALUE: ", value, "BASEKEY: ", basekeyname)
		if (typeof(value) === 'object') {
			if (Array.isArray(value)) {
				// Check if each item is object
				parsedValues.push({"type": "object", "name": basekeyname, "autocomplete": `${basekey}.${key}`})
				parsedValues.push({"type": "list", "name": `${basekeyname}${splitkey}list`, "autocomplete": `${basekey}.${key}.#`})

				// Only check the first. This would be probably be dumb otherwise.
				for (var subkey in value) {
					if (typeof(value) === 'object') {
						const returnValues = GetParsedPaths(value[subkey], `${basekey}.${key}.#`)
						for (var subkey in returnValues) {
							parsedValues.push(returnValues[subkey])
						}
					} 

					// Don't need else as # (all items) is already defined before the loop 

					break
				}
				//console.log(key+" is array")
			} else {
				parsedValues.push({"type": "object", "name": basekeyname, "autocomplete": `${basekey}.${key}`})
				const returnValues = GetParsedPaths(value, `${basekey}.${key}`)
				for (var subkey in returnValues) {
					parsedValues.push(returnValues[subkey])
				}
			}
		} else {
			parsedValues.push({"type": "value", "name": basekeyname, "autocomplete": `${basekey}.${key}`, "value": value,})
		}
	}

	return parsedValues
}


const Apps = (props) => {
  const { globalUrl, isLoggedIn, isLoaded } = props;

	//const [workflows, setWorkflows] = React.useState([]);
	const baseRepository = "https://github.com/frikky/shuffle-apps"
	const alert = useAlert()
	const [selectedApp, setSelectedApp] = React.useState({});
	const [firstrequest, setFirstrequest] = React.useState(true)
	const [apps, setApps] = React.useState([])
	const [filteredApps, setFilteredApps] = React.useState([])
	const [validation, setValidation] = React.useState(false)
	const [isLoading, setIsLoading] = React.useState(true)
	const [appSearchLoading, setAppSearchLoading] = React.useState(false)
	const [selectedAction, setSelectedAction] = React.useState({})
	const [searchBackend, setSearchBackend] = React.useState(false)
	const [searchableApps, setSearchableApps] = React.useState([])

	const [openApi, setOpenApi] = React.useState("")
	const [openApiData, setOpenApiData] = React.useState("")
	const [appValidation, setAppValidation] = React.useState("")
	const [loadAppsModalOpen, setLoadAppsModalOpen] = React.useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [openApiModal, setOpenApiModal] = React.useState(false);
	const [openApiModalType, setOpenApiModalType] = React.useState("");
	const [openApiError, setOpenApiError] = React.useState("")
	const [field1, setField1] = React.useState("")
	const [field2, setField2] = React.useState("")
	const [cursearch, setCursearch] = React.useState("")
	const [sharingConfiguration, setSharingConfiguration] = React.useState("you")

	const [isDropzone, setIsDropzone] = React.useState(false);
	const upload = React.useRef(null);
	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" ? true : false

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

	function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];

        if (typeof x == "string")
        {
            x = (""+x).toLowerCase(); 
        }
        if (typeof y == "string")
        {
            y = (""+y).toLowerCase();
        }

        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
	}

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
		marginBottom: 5, 
		borderRadius: 5, 
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
			setIsLoading(false)
			if (response.status !== 200) {
				console.log("Status not 200 for apps :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			responseJson = sortByKey(responseJson, "large_image")

			setApps(responseJson)
			setFilteredApps(responseJson)
			if (responseJson.length > 0) {
				setSelectedApp(responseJson[0])
				if (responseJson[0].actions !== null && responseJson[0].actions.length > 0) {
					setSelectedAction(responseJson[0].actions[0])
				} else {
					setSelectedAction({})
				}
			} 
			
			runAppSearch("")
    })
		.catch(error => {
			alert.error(error.toString())
			setIsLoading(false)
		});
	}

	const downloadApp = (inputdata) => {
		const id = inputdata.id

		alert.info("Downloading..")	
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
				const inputdata = YAML.parse(responseJson.body)
				const newpaths = {}
				Object.keys(inputdata["paths"]).forEach(function(key) {
					newpaths[key.split("?")[0]] = inputdata.paths[key]
				})

				inputdata.paths = newpaths
				console.log("INPUT: ", inputdata)
				var name = inputdata.info.title
				name = name.replace(/ /g, "_", -1)
				name = name.toLowerCase()

				delete inputdata.id
				delete inputdata.editing

				const data = YAML.stringify(inputdata)
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

		if (!data.activated && data.generated) {
			boxColor = "orange"
		}

		var imageline = data.large_image.length === 0 ?
			<img alt={data.title} style={{width: 100, height: 100}} />
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

		const version = data.app_version
		return (
			<Paper square key={data.id} style={paperAppStyle} onClick={() => {
				if (selectedApp.id !== data.id) {
					setSelectedApp(data)

					console.log(data)
					if (data.actions !== undefined && data.actions !== null && data.actions.length > 0) {
						setSelectedAction(data.actions[0])
					} else {
						setSelectedAction({})
					}

					if (data.sharing) {
						setSharingConfiguration("everyone")
					} 
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
							<Grid item style={{flex: "1", justifyContent: "center", marginTop: 5}}>
								{data.tags === null || data.tags === undefined ? null : data.tags.map((tag, index) => {
									if (index >= 3) {
										return null
									}

									return (
										<Chip
											key={index}
											style={{height: 25, marginRight: 5, cursor: "pointer",}}
											label={tag}
											variant="outlined"
											color="primary"
										/>
									)
								})}
							</Grid>
						</Grid>
					</Grid>
				</Grid>	

				{data.activated && data.private_id !== undefined && data.private_id.length > 0 && data.generated ?
				<Grid container style={{margin: "10px 10px 10px 10px", flex: "1"}} onClick={() => {downloadApp(data)}}>
					<Tooltip title={"Download OpenAPI"} style={{marginTop: "28px", width: "100%"}} aria-label={data.name}>
						<CloudDownload /> 
					</Tooltip>
				</Grid>
				: null}
			</Paper>
		)
	}

	const dividerColor = "rgb(225, 228, 232)"
	const uploadViewPaperStyle = {
		minWidth: 662.5,
		maxWidth: 662.5,
		color: "white",
		borderRadius: 5, 
		backgroundColor: surfaceColor,
		display: "flex",
		marginBottom: 10, 
	}

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

		const editUrl = "/apps/edit/"+selectedApp.id
		const activateUrl = "/apps/new?id="+selectedApp.id

		var downloadButton = selectedApp.activated && selectedApp.private_id !== undefined && selectedApp.private_id.length > 0 && selectedApp.generated ?
			<Tooltip title={"Download OpenAPI"}>
				<Button
					onClick={() => {downloadApp(selectedApp)}}
					variant="outlined"
					component="label"
					color="primary"
					style={{marginTop: 10, marginRight: 8}}
				>
					<CloudDownload /> 
				</Button>
			</Tooltip>
			: null

		var editButton = selectedApp.activated && selectedApp.private_id !== undefined && selectedApp.private_id.length > 0 && selectedApp.generated ?
			<Link to={editUrl} style={{textDecoration: "none"}}>
				<Tooltip title={"Edit OpenAPI app"}>
					<Button
						variant="outlined"
						component="label"
						color="primary"
						style={{marginTop: 10, marginRight: 10,}}
					>
						<EditIcon />
					</Button>
				</Tooltip>
				</Link> : null

		const activateButton = selectedApp.generated && !selectedApp.activated ?
			<div>
				<Link to={activateUrl} style={{textDecoration: "none"}}>
					<Button
						variant="contained"
						component="label"
						color="primary"
						style={{marginTop: 10}}
					>
						Activate App	
					</Button>
				</Link> 
				<Tooltip title={"Delete app"}>
					<Button
						variant="outlined"
						component="label"
						color="primary"
						style={{marginLeft: 5, marginTop: 10}}
						onClick={() => {
							setDeleteModalOpen(true)
						}}
					>
						<DeleteIcon />
					</Button> 
				</Tooltip>
			</div>
			: null

		const deleteButton = (
				(selectedApp.private_id !== undefined && selectedApp.private_id.length > 0 && selectedApp.generated)
				|| (selectedApp.downloaded !== undefined && selectedApp.downloaded == true) 
				|| (!selectedApp.generated)
			) 
			&& activateButton === null ?
			<Tooltip title={"Delete app"}>
				<Button
					variant="outlined"
					component="label"
					color="primary"
					style={{marginLeft: 5, marginTop: 10}}
					onClick={() => {
						setDeleteModalOpen(true)
					}}
				>
					<DeleteIcon />
				</Button> 
			</Tooltip>
			: null

		var imageline = selectedApp.large_image === undefined || selectedApp.large_image.length === 0 ?
			<img alt={selectedApp.title} style={{width: 100, height: 100}} />
			: 
			<img alt={selectedApp.title} src={selectedApp.large_image} style={{width: 100, height: 100, maxWidth: "100%"}} />

		const GetAppExample = () => {
			if (selectedAction.returns === undefined) {
				return null
			}

			var showResult = selectedAction.returns.example
			if (showResult === undefined || showResult === null || showResult.length === 0) {
				return null
			}

			var jsonvalid = true
			try {
				const tmp = String(JSON.parse(showResult))
				if (!tmp.includes("{") && !tmp.includes("[")) {
					jsonvalid = false
				}
			} catch (e) {
				jsonvalid = false
			}


			// FIXME: In here -> parse the values into a list or something
			if (jsonvalid) {
				const paths = GetParsedPaths(JSON.parse(showResult), "")
				console.log("PATHS: ", paths)

				return (
					<div>
						{paths.map((data, index) => {
							const circleSize = 10
							return (
								<MenuItem key={index} style={{backgroundColor: inputColor, color: "white"}} value={data} onClick={() => console.log(data.autocomplete)}>
									{data.name}
								</MenuItem>
							)
						})}
						{/*
						<ReactJson 
							src={JSON.parse(showResult)} 
							theme="solarized" 
							collapsed={false}
							displayDataTypes={true}
							name={"Example return value"}
						/>
						*/}
					</div>
				)
			} 

			return (
				<div style={{marginTop: 10}}>
					<b>Example return</b><div/>
					{selectedAction.returns.example}
				</div>
			)
		}

		const userRoles = [
			"you",
			"everyone",
		]

		//fetch(globalUrl+"/api/v1/get_openapi/"+urlParams.get("id"), 
		var baseInfo = newAppname.length > 0 ?
			<div>
				<div style={{display: "flex"}}>
					<div style={{marginRight: 15, marginTop: 10}}>
						{imageline}
					</div>
					<div style={{maxWidth: "75%", overflow: "hidden"}}>
						<h2 style={{marginTop: 20, marginBottom: 0, }}>{newAppname}</h2>
						<p style={{marginTop: 5, marginBottom: 0,}}>Version {selectedApp.app_version}</p>	
						<p style={{marginTop: 5, marginBottom: 0}}>{description}</p>	
					</div>
				</div>
				{activateButton}
				{(props.userdata !== undefined && (props.userdata.role === "admin" || props.userdata.id === selectedApp.owner) || !selectedApp.generated) ? 
					<div>
						{downloadButton}
						{editButton}
						{deleteButton}
					</div>
				: null}
				{selectedApp.tags !== undefined && selectedApp.tags !== null ?
					<div style={{display: "inline-block", marginLeft: 15, float: "right",}}>
						{selectedApp.tags.map((tag, index) => {
							if (index >= 3) {
								return null
							}

							return (
								<Chip
									key={index}
									style={{height: 25, marginRight: 5, marginTop: 7, cursor: "pointer",}}
									variant="outlined"
									label={tag}
									color="primary"
								/>
							)
						})}
					</div>
				: null}
				{props.userdata !== undefined && props.userdata.id === selectedApp.owner ? 
					<div style={{marginTop: 15}}>
						{/*<p><b>ID:</b> {selectedApp.id}</p>*/}
						<b style={{marginRight: 15}}>Sharing:</b> 
						<Select
							value={sharingConfiguration}
							onChange={(event) => {
								setSharingConfiguration(event.target.value)
								alert.info("Changed sharing to "+event.target.value)

								updateAppField(selectedApp.id, "sharing", !selectedApp.sharing)
								//setSelectedAction(event.target.value)
							}}
							style={{width: 150, backgroundColor: inputColor, color: "white", height: 35, marginleft: 10,}}
							SelectDisplayProps={{
								style: {
									marginLeft: 10,
								}
							}}
						>
							{userRoles.map(data => {
								return (
										<MenuItem key={data} style={{backgroundColor: inputColor, color: "white"}} value={data}>
											{data}

										</MenuItem>
									)
							})}
						</Select>
					</div>
				: null}
				{/*<p><b>Owner:</b> {selectedApp.owner}</p>*/}
				{selectedApp.privateId !== undefined && selectedApp.privateId.length > 0 ? <p><b>PrivateID:</b> {selectedApp.privateId}</p> : null}
				<Divider style={{marginBottom: 10, marginTop: 10, backgroundColor: dividerColor}}/>
				<div style={{padding: 20}}>
					{selectedApp.link.length > 0 ? <p><b>URL:</b> {selectedApp.link}</p> : null}
					<div style={{marginTop: 15, marginBottom: 15}}>
						<b>Actions</b>
						{selectedApp.actions !== null && selectedApp.actions.length > 0 ?
							<Select
								fullWidth
								value={selectedAction}
								onChange={(event) => {
									setSelectedAction(event.target.value)
								}}
								style={{backgroundColor: inputColor, color: "white", height: "50px"}}
								SelectDisplayProps={{
									style: {
										marginLeft: 10,
									}
								}}
							>
								{selectedApp.actions.map(data => {
										var newActionname = data.label !== undefined && data.label.length > 0 ? data.label : data.name

										// ROFL FIXME - loop
										newActionname = newActionname.replace("_", " ")
										newActionname = newActionname.replace("_", " ")
										newActionname = newActionname.replace("_", " ")
										newActionname = newActionname.replace("_", " ")
										newActionname = newActionname.charAt(0).toUpperCase()+newActionname.substring(1)
										return (
											<MenuItem key={data.name} style={{backgroundColor: inputColor, color: "white"}} value={data}>
												{newActionname}

											</MenuItem>
										)
									})}
							</Select>
							: 
							<div style={{marginTop: 10}}>
								There are no actions defined for this app.
							</div>
						}
					</div>

					{selectedAction.parameters !== undefined && selectedAction.parameters !== null ? 
						<div style={{marginTop: 15, marginBottom: 15}}>
							<b>Arguments</b>
							{selectedAction.parameters.map(data => {
									var itemColor = "#f85a3e"
									if (!data.required) {
										itemColor = "#ffeb3b"
									}

									const circleSize = 10
									return (
										<MenuItem key={data.name} style={{backgroundColor: inputColor, color: "white"}} value={data}>
											<div style={{width: circleSize, height: circleSize, borderRadius: circleSize / 2, backgroundColor: itemColor, marginRight: "10px"}}/>
											{data.name}

										</MenuItem>
									)
								})}
						</div>
					: null}
					{selectedAction.description !== undefined && selectedAction.description !== null && selectedAction.description.length > 0 ? 
						<div>
							<b>Action Description</b><div/>
							{selectedAction.description}
						</div>
						: null}
					<GetAppExample />
				</div>
			</div>
			: 
			null

		return(
			<div style={{}}>
				<Paper square style={uploadViewPaperStyle}>
					<div style={{width: "100%", margin: 25}}>
						<h2>App Creator</h2>
						<a href="https://shuffler.io/docs/apps" style={{textDecoration: "none", color: "#f85a3e"}} target="_blank">How it works</a>
						&nbsp;- <a href="https://github.com/frikky/security-openapis" style={{textDecoration: "none", color: "#f85a3e"}} target="_blank">Security API's</a>
						&nbsp;- <a href="https://apis.guru/browse-apis/" style={{textDecoration: "none", color: "#f85a3e"}} target="_blank">OpenAPI directory</a>
						&nbsp;- <a href="https://editor.swagger.io/" style={{textDecoration: "none", color: "#f85a3e"}} target="_blank">OpenAPI Validator</a>
						<div/>
						Apps interact with eachother in workflows. They are created with the app creator, using OpenAPI specification or manually in python. The links above are references to OpenAPI tools and other app repositories. There's thousands of them.
						<div/>
						<Divider style={{height: 1, backgroundColor: dividerColor, marginTop: 20, marginBottom: 20}} />
						<div style={{}}>
							<Button
								variant="contained"
								component="label"
								color="primary"
								style={{marginRight: 10, }}
								onClick={() => {
									setOpenApiModal(true)
								}}
							>
								<PublishIcon  style={{marginRight: 5}} /> Create from OpenAPI 	
							</Button>
							&nbsp;OR&nbsp;
							<Link to="/apps/new" style={{marginLeft: 5, textDecoration: "none", color: "#f85a3e"}}>
								<Button
									variant="text"
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

	const handleSearchChange = (search) => {
		if (apps === undefined || apps === null || apps.length === 0) {
			return
		}

		const searchfield = search.toLowerCase()
		var newapps = apps.filter(data => data.name.toLowerCase().includes(searchfield) || data.description.toLowerCase().includes(searchfield))
		var tmpapps = searchableApps.filter(data => data.name.toLowerCase().includes(searchfield) || data.description.toLowerCase().includes(searchfield))
		newapps.push(...tmpapps) 

		setFilteredApps(newapps)
		//if ((newapps.length === 0 || searchBackend) && !appSearchLoading) {

		//	//setAppSearchLoading(true)
		//	//runAppSearch(searchfield)
		//} else {
		//}
	}

	const uploadFile = (e) => {
		const isDropzone = e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
		const files = isDropzone ? e.dataTransfer.files : e.target.files;
		
    const reader = new FileReader();

    reader.addEventListener('load', (e) => {
      const content = e.target.result;
			setOpenApiData(content);
			setIsDropzone(isDropzone);
			setOpenApiModal(true)
    })

		reader.readAsText(files[0]);
  };

  useEffect(() => {
    if (openApiData.length > 0) {
      setOpenApiError('');
      validateOpenApi(openApiData);
		}
	}, [openApiData]);
	
	useEffect(() => {
		if (appValidation && isDropzone) {
			redirectOpenApi();
			setIsDropzone(false);
		}
  }, [appValidation, isDropzone]);

	const appView = isLoggedIn ? 
		<Dropzone style={{maxWidth: window.innerWidth > 1366 ? 1366 : 1200, margin: "auto", padding: 20 }} onDrop={uploadFile}>
			<div style={appViewStyle}>	
				<div style={{flex: 1}}>
					<Breadcrumbs aria-label="breadcrumb" separator="›" style={{color: "white",}}>
						<Link to="/apps" style={{textDecoration: "none", color: "inherit",}}>
							<h2 style={{color: "rgba(255,255,255,0.5)"}}>
								<AppsIcon style={{marginRight: 10}} />
								App upload
							</h2>
						</Link>
						{selectedApp.activated && selectedApp.private_id !== undefined && selectedApp.private_id.length > 0 && selectedApp.generated ?
							<Link to={`/apps/edit/${selectedApp.id}`} style={{textDecoration: "none", color: "inherit",}}>
								<h2>
									{selectedApp.name}
								</h2>
							</Link>
						: null}
					</Breadcrumbs>
					<UploadView/>
				</div>
				<Divider style={{marginBottom: 10, marginTop: 10, height: "100%", width: 1, backgroundColor: dividerColor}}/>
				<div style={{flex: 1, marginLeft: 10, marginRight: 10}}>
					<div style={{display: "flex", minHeight: 84.81}}>
						<div style={{flex: 1}}>
							<h2>Your apps ({apps.length+searchableApps.length})</h2> 
						</div>
						{isCloud ? null : 
						<span>
							<Tooltip title={"Reload apps locally"} style={{marginTop: "28px", width: "100%"}} aria-label={"Upload"}>
								<Button
									variant="outlined"
									component="label"
									color="primary"
									style={{margin: 5, maxHeight: 50, marginTop: 10}}
									onClick={() => {
										hotloadApps()
									}}
								>
									<CachedIcon />
								</Button>
							</Tooltip>
							<Tooltip title={"Download from Github"} style={{marginTop: "28px", width: "100%"}} aria-label={"Upload"}>
								<Button
									variant="outlined"
									component="label"
									color="primary"
									style={{margin: 5, maxHeight: 50, marginTop: 10}}
									onClick={() => {
										setOpenApi(baseRepository)
										setLoadAppsModalOpen(true)
									}}
								>
									<CloudDownloadIcon />
								</Button>
							</Tooltip>
						</span>
					}
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
							handleSearchChange(event.target.value)
							setCursearch(event.target.value)
						}}
					/>
					<div style={{marginTop: 15}}>
						{apps.length > 0 ? 
							filteredApps.length > 0 ? 
								<div style={{height: "75vh", overflowY: "scroll"}}>
									{filteredApps.map(app => {
										return (
											appPaper(app)
										)
									})}
									{cursearch.length > 0 ? null : 
										searchableApps.map(app => {
											return (
												appPaper(app)
											)
										})
									}
								</div>
							: 
							<Paper square style={uploadViewPaperStyle}>
								<h4 style={{margin: 10, }}>
									Try a broader search term, e.g. http, alert, ticket etc. 
								</h4>
								<div/>

								{appSearchLoading ? 
									<CircularProgress color="primary" style={{margin: "auto"}}/>
									: null
								}
							</Paper>
						: 
						isLoading ? 
							<CircularProgress style={{width: 40, height: 40, margin: "auto"}}/>
							:
							<Paper square style={uploadViewPaperStyle}>
								<h4 style={{margin: 10}}>
									No apps have been created, uploaded or downloaded yet. Click "Load existing apps" above to get the baseline. This may take a while as its building docker images.
								</h4>
							</Paper>
						}
					</div>
				</div>
			</div>
		</Dropzone>
		: 
		null

	// Load data e.g. from github
	const getSpecificApps = (url, forceUpdate) => {
		setValidation(true)

		setIsLoading(true)
		start()

		const parsedData = {
			"url": url,
		}

		if (field1.length > 0) {
			parsedData["field_1"] = field1
		}

		if (field2.length > 0) {
			parsedData["field_2"] = field2
		}

		parsedData["force_update"] = forceUpdate

		alert.success("Getting specific apps from your URL.")
		var cors = "cors"
		fetch(globalUrl+"/api/v1/apps/get_existing", {
    	method: "POST",
			mode: "cors",
			headers: {
				'Accept': 'application/json',
			},
			body: JSON.stringify(parsedData),
	  	credentials: "include",
		})
		.then((response) => {
			if (response.status === 200) {
				alert.success("Loaded existing apps!")
			}
			setIsLoading(false)
			stop()

			return response.json()
		})
    .then((responseJson) => {
				console.log("DATA: ", responseJson)
				if (responseJson.reason !== undefined) {
					alert.error("Failed loading: "+responseJson.reason)
				}
		})
		.catch(error => {
			console.log("ERROR: ", error.toString())
			alert.error(error.toString())
		})
	}

	// Locally hotloads app from folder
	const hotloadApps = () => {
		alert.info("Hotloading apps from location in .env")
		setIsLoading(true)
		fetch(globalUrl+"/api/v1/apps/run_hotload", {
			mode: "cors",
			headers: {
				'Accept': 'application/json',
			},
	  	credentials: "include",
		})
		.then((response) => {
			setIsLoading(false)
			if (response.status === 200) {
				alert.success("Hotloaded apps!")
				getApps()
			}

			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.reason !== undefined && responseJson.reason.length > 0) {
				alert.info("Hotloading: ", responseJson.reason)
			}
    })
		.catch(error => {
			alert.error(error.toString())
		});
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

	const updateAppField = (app_id, fieldname, fieldvalue) => {
		const data = {}
		data[fieldname] = fieldvalue

		fetch(globalUrl+"/api/v1/apps/"+app_id, {
    	method: 'PATCH',
			headers: {
				'Accept': 'application/json',
			},
			body: JSON.stringify(data),
	  	credentials: "include",
		})
		.then((response) => {
			//setAppSearchLoading(false)
			return response.json()
		})
    .then((responseJson) => {
			//console.log(responseJson)
			//alert.info(responseJson)
			if (responseJson.success) {
				alert.info("Success")
			} else {
				alert.error("Error updating app")
			}
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const runAppSearch = (searchterm) => {
		const data = {"search": searchterm}

		fetch(globalUrl+"/api/v1/apps/search", {
    	method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: JSON.stringify(data),
	  	credentials: "include",
		})
		.then((response) => {
			setAppSearchLoading(false)
			return response.json()
		})
    .then((responseJson) => {
			if (responseJson.success) {
				if (responseJson.reason !== undefined && responseJson.reason.length > 0) {
					setSearchableApps(responseJson.reason)
					//setFilteredApps(responseJson.reason)
				}
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
			setValidation(false)
			if (response.status !== 200) {
				return response.json()	
			} 

			return response.text()
		})
    .then((responseJson) => {
			if (typeof(responseJson) !== "string" && !responseJson.success) {
				console.log(responseJson.reason)
				if (responseJson.reason !== undefined) {
					setOpenApiError(responseJson.reason)
				} else {
					setOpenApiError("Undefined issue with OpenAPI validation")
				}
				return
			}

			console.log("Validating response!")
			validateOpenApi(responseJson)
    })
		.catch(error => {
			alert.error(error.toString())
			setOpenApiError(error.toString())
		});
	}

	const escapeApiData = (apidata) => {
		//console.log(apidata)
		try {
			return JSON.stringify(JSON.parse(apidata))
		} catch(error) {
			console.log("JSON DECODE ERROR - TRY YAML")
		}


		try {
			const parsed = YAML.parse(YAML.stringify(apidata))
			//const parsed = YAML.parse(apidata))
			return YAML.stringify(parsed)
		} catch(error) {
			console.log("YAML DECODE ERROR - TRY SOMETHING ELSE?: "+error)
			setOpenApiError("Local error: "+ error.toString())
		}

		return ""
	}

	// Sends the data to backend, which should return a version 3 of the same API
	// If 200 - continue, otherwise, there's some issue somewhere
	const validateOpenApi = (openApidata) => {
		var newApidata = escapeApiData(openApidata)
		if (newApidata === "") {
			// Used to return here
			newApidata = openApidata
			return
		}

		//console.log(newApidata)

		setValidation(true)
		fetch(globalUrl+"/api/v1/validate_openapi", {
    	method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: openApidata,
	  	credentials: "include",
		})
		.then((response) => {
			setValidation(false)
			return response.json()
		})
    .then((responseJson) => {
			if (responseJson.success) {
				setAppValidation(responseJson.id);
			} else {
				if (responseJson.reason !== undefined) {
					setOpenApiError(responseJson.reason)
				}
				alert.error("An error occurred in the response")
			}
    	})
		.catch(error => {
			setValidation(false)
			alert.error(error.toString())
			setOpenApiError(error.toString())
		});
	}

	const redirectOpenApi = () => {
		window.location.href = "/apps/new?id="+appValidation
	}

	const handleGithubValidation = (forceUpdate) => {
		getSpecificApps(openApi, forceUpdate)
		setLoadAppsModalOpen(false)
	}

	const deleteModal = deleteModalOpen ? 
		<Dialog 
			open={deleteModalOpen}
			onClose={() => {
				setDeleteModalOpen(false)
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 500,
				},
			}}
		>
			<DialogTitle>
				<div style={{textAlign: "center", color: "rgba(255,255,255,0.9)"}}>
					Are you sure? <div/>Some workflows may stop working.
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)", textAlign: "center"}}>
				<Button style={{}} onClick={() => {deleteApp(selectedApp.id); setDeleteModalOpen(false)}} color="primary">
					Yes
				</Button>
				<Button variant="outlined" style={{}} onClick={() => {setDeleteModalOpen(false)}} color="primary">
					No
				</Button>
			</DialogContent>
			
		</Dialog>
	: null

	const circularLoader = validation ? <CircularProgress color="primary" /> : null
	const appsModalLoad = loadAppsModalOpen ? 
		<Dialog 
			open={loadAppsModalOpen}
			onClose={() => {
				setOpenApi("")
				setLoadAppsModalOpen(false)
				setField1("")
				setField2("")
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle>
				<div style={{color: "rgba(255,255,255,0.9)"}}>
					Load from github repo 
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)"}}>
				Repository (supported: github, gitlab, bitbucket)
				<TextField
					style={{backgroundColor: inputColor}}
					variant="outlined"
					margin="normal"
					defaultValue="https://github.com/frikky/shuffle-apps"
					InputProps={{
						style:{
							color: "white",
							height: "50px",
							fontSize: "1em",
						},
					}}
					onChange={e => setOpenApi(e.target.value)}
					placeholder="https://github.com/frikky/shuffle-apps"
					fullWidth
					/>

				<span style={{marginTop: 10}}>Authentication (optional - private repos etc):</span>
				<div style={{display: "flex"}}>
					<TextField
						style={{flex: 1, backgroundColor: inputColor}}
						variant="outlined"
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								height: "50px",
								fontSize: "1em",
							},
						}}
						onChange={e => setField1(e.target.value)}
						type="username"
						placeholder="Username / APIkey (optional)"
						fullWidth
						/>
					<TextField
						style={{flex: 1, backgroundColor: inputColor}}
						variant="outlined"
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								height: "50px",
								fontSize: "1em",
							},
						}}
						onChange={e => setField2(e.target.value)}
						type="password"
						placeholder="Password (optional)"
						fullWidth
						/>
				</div>
			</DialogContent>
			<DialogActions>
				{circularLoader}
				<Button style={{borderRadius: "0px"}} onClick={() => setLoadAppsModalOpen(false)} color="primary">
					Cancel
				</Button>
	      <Button style={{borderRadius: "0px"}} disabled={openApi.length === 0 || !openApi.includes("http")} onClick={() => {
					handleGithubValidation(true) 
				}} color="primary">
	      	Force update	
	      </Button>
	      <Button variant="outlined" style={{float: "left", borderRadius: "0px"}} disabled={openApi.length === 0 || !openApi.includes("http")} onClick={() => {
					handleGithubValidation(false) 
				}} color="primary">
	        Submit	
	      </Button>
			</DialogActions>
		</Dialog>
		: null

	const errorText = openApiError.length > 0 ? <div style={{marginTop: 10}}>Error: {openApiError}</div> : null
	const modalView = openApiModal ? 
		<Dialog 
			open={openApiModal}
			onClose={() => {
				setOpenApiModal(false)
			}}
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
							endAdornment: <Button style={{borderRadius: "0px", marginTop: "0px", height: "50px"}} variant="contained" disabled={openApi.length === 0 || appValidation.length > 0} color="primary" 
							onClick={() => {
								setOpenApiError("")
								validateRemote()
							}}>Validate</Button>
						}}
						onChange={e => {
							setOpenApi(e.target.value)
						}}
						helperText={<span style={{color:"white", marginBottom: "2px",}}>Must point to a version 2 or 3 OpenAPI specification.</span>}
						placeholder="OpenAPI URI"
						fullWidth
					  />
						{/*
					  <div style={{marginTop: "15px"}}/>
					  Example: 
					  <div />
					  https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/json/uber.json
						*/}
					  <p>Or upload a YAML or JSON specification</p>
          <input
            hidden
            type="file"
            ref={upload}
            accept="application/JSON, text/yaml, text/x-yaml, application/x-yaml, application/vnd.yaml"
            multiple={false}
            onChange={uploadFile}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => upload.current.click()}
          >
            Upload
          </Button>
					  {errorText}
				</DialogContent>
				<DialogActions>
					{circularLoader}
					<Button style={{borderRadius: "0px"}} onClick={() => {
						setOpenApiModal(false)
						setAppValidation("")
						setOpenApiError("")
						setOpenApi("")
						setOpenApiData("")
					}} color="primary">
						Cancel
					</Button>
	      	<Button variant="contained" style={{borderRadius: "0px"}} disabled={appValidation.length === 0} onClick={() => {
						redirectOpenApi()
					}} color="primary">
	        	Continue	
	        </Button>
				</DialogActions>
			</FormControl>
		</Dialog>
		: null


	const loadedCheck = isLoaded && !firstrequest ?  
		<div>
			{appView}
			{modalView}
			{appsModalLoad}
			{deleteModal}
		</div>
		:
		<div>
		</div>

	// Maybe use gridview or something, idk
	return loadedCheck
}

export default Apps 
