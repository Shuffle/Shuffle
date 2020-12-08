import React, {useState, useEffect, useLayoutEffect} from 'react';
import { useInterval } from 'react-powerhooks';

import uuid from "uuid";

import {Link} from 'react-router-dom';
import { Prompt } from 'react-router'
import TextField from '@material-ui/core/TextField';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import InputAdornment from '@material-ui/core/InputAdornment';
import Tab from '@material-ui/core/Tab';
import ButtonBase from '@material-ui/core/ButtonBase';
import Tooltip from '@material-ui/core/Tooltip';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputLabel from '@material-ui/core/InputLabel';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import Input from '@material-ui/core/Input';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import CircularProgress from '@material-ui/core/CircularProgress';
import Switch from '@material-ui/core/Switch';
import ReactJson from 'react-json-view'
import { useBeforeunload } from 'react-beforeunload';
import NestedMenuItem from "material-ui-nested-menu-item";

import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';
import DirectionsRunIcon from '@material-ui/icons/DirectionsRun';
import PolymerIcon from '@material-ui/icons/Polymer';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import CreateIcon from '@material-ui/icons/Create';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import AspectRatioIcon from '@material-ui/icons/AspectRatio';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AppsIcon from '@material-ui/icons/Apps';
import ScheduleIcon from '@material-ui/icons/Schedule';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import PauseIcon from '@material-ui/icons/Pause';
import DeleteIcon from '@material-ui/icons/Delete';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import SaveIcon from '@material-ui/icons/Save';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SettingsIcon from '@material-ui/icons/Settings';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

import * as cytoscape from 'cytoscape';
import * as edgehandles from 'cytoscape-edgehandles';
import * as clipboard from 'cytoscape-clipboard';
import CytoscapeComponent from 'react-cytoscapejs';
import undoRedo from 'cytoscape-undo-redo';
import Draggable from 'react-draggable';

import cytoscapestyle from '../defaultCytoscapeStyle';
import cxtmenu from 'cytoscape-cxtmenu';

import { w3cwebsocket as W3CWebSocket } from "websocket";
import { useAlert } from "react-alert";
import { GetParsedPaths } from "./Apps";

const surfaceColor = "#27292D"
const inputColor = "#383B40"

// http://apps.cytoscape.org/apps/yfileslayoutalgorithms
cytoscape.use(edgehandles);
cytoscape.use(clipboard);
cytoscape.use(undoRedo);
cytoscape.use( cxtmenu );

// https://stackoverflow.com/questions/19014250/rerender-view-on-browser-resize-with-react
function useWindowSize() {
	const [size, setSize] = useState([0, 0]);
	useLayoutEffect(() => {
		function updateSize() {
			setSize([window.innerWidth, window.innerHeight]);
		}
		window.addEventListener('resize', updateSize);
		updateSize();
		return () => window.removeEventListener('resize', updateSize);
	}, []);
	return size;
}

const splitter = "|~|"
//const referenceUrl = "https://shuffler.io/functions/webhooks/"
//const referenceUrl = window.location.origin+"/api/v1/hooks/"

const AngularWorkflow = (props) => {
  const { globalUrl, isLoggedIn, isLoaded } = props;
	const referenceUrl = globalUrl+"/api/v1/hooks/"
	const alert = useAlert()
	const borderRadius = 3

	const [bodyWidth, bodyHeight] = useWindowSize();
	const appBarSize = 74
	const [cystyle, ] = useState(cytoscapestyle) 
	const [cy, setCy] = React.useState()
		
	const [appSearch, setAppSearch] = React.useState("")
	const [currentView, setCurrentView] = React.useState(0)
	const [triggerAuthentication, setTriggerAuthentication] = React.useState({})
	const [triggerFolders, setTriggerFolders] = React.useState([])
	const [showEnvironment, setShowEnvironment] = React.useState(false)

	const [workflow, setWorkflow] = React.useState({});
	const [leftViewOpen, setLeftViewOpen] = React.useState(true);
	const [leftBarSize, setLeftBarSize] = React.useState(350)
	const [executionText, setExecutionText] = React.useState("");
	const [executionRequestStarted, setExecutionRequestStarted] = React.useState(false);

	const [appAuthentication, setAppAuthentication] = React.useState([]);
	const [variablesModalOpen, setVariablesModalOpen] = React.useState(false);
	const [executionVariablesModalOpen, setExecutionVariablesModalOpen] = React.useState(false);
	const [authenticationModalOpen, setAuthenticationModalOpen] = React.useState(false);
	const [conditionsModalOpen, setConditionsModalOpen] = React.useState(false);
	const [newVariableName, setNewVariableName] = React.useState("");
	const [newVariableDescription, setNewVariableDescription] = React.useState("");
	const [newVariableValue, setNewVariableValue] = React.useState("");
	const [workflowDone, setWorkflowDone] = React.useState(false)
	const [localFirstrequest, setLocalFirstrequest] = React.useState(true)
	const [requiresAuthentication, setRequiresAuthentication] = React.useState(false)
	const [rightSideBarOpen, setRightSideBarOpen] = React.useState(false)
	const [showSkippedActions, setShowSkippedActions] = React.useState(false)

	const [variableAnchorEl, setVariableAnchorEl] = React.useState(null)

	const [sourceValue, setSourceValue] = React.useState({})
	const [destinationValue, setDestinationValue] = React.useState({})
	const [conditionValue, setConditionValue] = React.useState({})

	// Trigger stuff
	const [selectedTrigger, setSelectedTrigger] = React.useState({});
	const [selectedTriggerIndex, setSelectedTriggerIndex] = React.useState({});
	const [selectedEdge, setSelectedEdge] = React.useState({});
	const [selectedEdgeIndex, setSelectedEdgeIndex] = React.useState({});


	const [visited, setVisited] = React.useState([]);
	//const [workflow, setWorkflow] = React.useState(workflowdata);
	
	const [apps, setApps] = React.useState([]);
	const [filteredApps, setFilteredApps] = React.useState([]);
	const [prioritizedApps, setPrioritizedApps] = React.useState([]);
	const [firstrequest, setFirstrequest] = React.useState(true)
	//const [apps, setApps] = React.useState(appdata);
	//const [filteredApps, setFilteredApps] = React.useState();
	
	const [environments, setEnvironments] = React.useState([]);
	const [established, setEstablished] = React.useState(false);

	const [graphSetup, setGraphSetup] = React.useState(false);

	const [selectedApp, setSelectedApp] = React.useState({});
	const [selectedAction, setSelectedAction] = React.useState({});
	const [selectedActionName, setSelectedActionName] = React.useState({});
	const [selectedActionEnvironment, setSelectedActionEnvironment] = React.useState({});

	const [executionRequest, setExecutionRequest] = React.useState({})

	const [, setExecutingNodes] = React.useState([])
	const [executionRunning, setExecutionRunning] = React.useState(false)
	const [executionModalOpen, setExecutionModalOpen] = React.useState(false)
	const [executionModalView, setExecutionModalView] = React.useState(0)
	const [executionData, setExecutionData] = React.useState({})

	const [lastSaved, setLastSaved] = React.useState(true)

	const [appAdded, setAppAdded] = useState(false)
	const [update, setUpdate] = useState("");
	const [workflowExecutions, setWorkflowExecutions] = React.useState([]);
	const [defaultEnvironmentIndex, setDefaultEnvironmentIndex] = React.useState(0)

	const cloudSyncEnabled = props.userdata !== undefined && props.userdata.active_org !== null && props.userdata.active_org !== undefined ? props.userdata.active_org.cloud_sync === true : false 
	//const triggerEnvironments = cloudSyncEnabled ? ["cloud", "onprem"] : environments
	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" 
	const triggerEnvironments = isCloud ? ["cloud"] : ["cloud", "onprem"] 

	const unloadText = 'Are you sure you want to leave without saving (CTRL+S)?'
	useBeforeunload(() => {
		if (!lastSaved) {
			return unloadText
		}
	})

	const [elements, setElements] = useState([])
	const { start, stop } = useInterval({
	  	duration: 2500,
	  	startImmediate: false,
	  	callback: () => {
				fetchUpdates()
	  	}
	})

	const setNewAppAuth = (appAuthData) => {
		console.log("DAta: ", appAuthData)
		fetch(globalUrl+"/api/v1/apps/authentication", {
    	  method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(appAuthData),
	  		credentials: "include",
    	})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for setting app auth :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (!responseJson.success) {
				alert.error("Failed to set app auth: "+responseJson.reason)
			} else {
				setAuthenticationModalOpen(false) 
				alert.success("Successfully saved new app auth")
			}
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const getWorkflowExecution = (id) => {
		fetch(globalUrl+"/api/v1/workflows/"+id+"/executions", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.length > 0) {
				// FIXME: Sort this by time
				setWorkflowExecutions(responseJson)
			}
			//setWorkflowExecutions(responseJson)
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const debugView = workflowExecutions.length > 0 ? 
		<Draggable> 
			<div style={{color: "white", position: "fixed", top: appBarSize+65, left: leftBarSize+20, zIndex: 5000, minHeight: 100, padding: 15, maxHeight: 100, maxWidth: 500, overflowX: "hidden",}}>
				{workflowExecutions.slice(0,15).map((data, index) => {
					return (
						<div key={index}>
							{new Date(data.started_at*1000).toISOString()}
							, {data.status}
							{data.result.length > 0 ? ", "+data.result : ", "}
							{data.execution_argument.length > 0 ? ", "+data.execution_argument : ", "}
							<Divider style={{backgroundColor: "white"}}/>
						</div>
					)
					return 
				})}
			</div>
		</Draggable>
		: null

	const fetchUpdates = () => {
		fetch(globalUrl+"/api/v1/streams/results", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify(executionRequest),
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!")
				stop()
			}

			return response.json()
		})
		.then((responseJson) => {
			handleUpdateResults(responseJson)
		})
		.catch(error => {
			alert.error(error.toString())
			stop()
		});
	}

	const abortExecution = () => {
		setExecutionRunning(false)

		alert.info("Aborting execution")
		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key+"/executions/"+executionRequest.execution_id+"/abort", {
    	  	method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			} else {
				alert.success("Execution aborted")
			}

			return response.json()
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	// Controls the colors and direction of execution results.
	// Style is in defaultCytoscapeStyle.js
	const handleUpdateResults = (responseJson) => {
		//console.log(responseJson)
		// Loop nodes and find results
		// Update on every interval? idk

		if (JSON.stringify(responseJson) !== JSON.stringify(executionData)) {
			// FIXME: If another is selected, don't edit.. 
			// Doesn't work because this is some async garbage
			if (executionData.execution_id === undefined || responseJson.execution_id === executionData.execution_id) {
				setExecutionData(responseJson)
			}
		}
		if (responseJson.execution_id !== executionRequest.execution_id) {
			cy.elements().removeClass('success-highlight failure-highlight executing-highlight')
			return
		}

		if (responseJson.results !== null && responseJson.results !== []) {
			for (var key in responseJson.results) {
				var item = responseJson.results[key]
				var currentnode = cy.getElementById(item.action.id)
				if (currentnode.length === 0) {
					continue
				}

				currentnode = currentnode[0]
				const outgoingEdges = currentnode.outgoers('edge')
				const incomingEdges = currentnode.incomers('edge')

				//currentnode.removeClass('success-highlight failure-highlight executing-highlight')
				switch (item.status) {
					case "EXECUTING": 
						currentnode.removeClass('not-executing-highlight')
						currentnode.removeClass('success-highlight')
						currentnode.removeClass('failure-highlight')
						currentnode.removeClass('shuffle-hover-highlight')
						currentnode.removeClass('awaiting-data-highlight')
						incomingEdges.addClass('success-highlight')
						currentnode.addClass('executing-highlight')
						break
					case "SKIPPED": 
						currentnode.removeClass('not-executing-highlight')
						currentnode.removeClass('success-highlight')
						currentnode.removeClass('failure-highlight')
						currentnode.removeClass('shuffle-hover-highlight')
						currentnode.removeClass('awaiting-data-highlight')
						currentnode.removeClass('executing-highlight')
						currentnode.addClass('skipped-highlight')
						break
					case "WAITING": 
						currentnode.removeClass('not-executing-highlight')
						currentnode.removeClass('success-highlight')
						currentnode.removeClass('failure-highlight')
						currentnode.removeClass('shuffle-hover-highlight')
						currentnode.removeClass('awaiting-data-highlight')
						currentnode.addClass('executing-highlight')

						if (!visited.includes(item.action.label)) {
							if (executionRunning) {
								alert.show("WAITING FOR "+item.action.label+" with result "+item.result)
								visited.push(item.action.label)
								setVisited(visited)
							}
						}

						// FIXME - add outgoing nodes to executing
						//const outgoingNodes = outgoingEdges.find().data().target
						if (outgoingEdges.length > 0) {
							outgoingEdges.addClass('success-highlight')
						}
						break
					case "SUCCESS": 
						currentnode.removeClass('not-executing-highlight')
						currentnode.removeClass('executing-highlight')
						currentnode.removeClass('failure-highlight')
						currentnode.removeClass('shuffle-hover-highlight')
						currentnode.removeClass('awaiting-data-highlight')
						currentnode.addClass('success-highlight')

						if (!visited.includes(item.action.label)) {
							if (executionRunning) {
								alert.show("Success in node "+item.action.label)
								//+" with result "+item.result)
								visited.push(item.action.label)
								setVisited(visited)
							}
						}

						// FIXME - add outgoing nodes to executing
						//const outgoingNodes = outgoingEdges.find().data().target
						if (outgoingEdges.length > 0) {
							for (var i = 0; i < outgoingEdges.length; i++) {
								const edge = outgoingEdges[i]
								const targetnode = cy.getElementById(edge.data().target)
								if (targetnode !== undefined && !targetnode.classes().includes("success-highlight") && !targetnode.classes().includes("failure-highlight")) {
									targetnode.removeClass('not-executing-highlight')
									targetnode.removeClass('success-highlight')
									targetnode.removeClass('shuffle-hover-highlight')
									targetnode.removeClass('failure-highlight')
									targetnode.removeClass('awaiting-data-highlight')
									targetnode.addClass('executing-highlight')
								}
							}

							// const outgoingEdges = currentnode.outgoers('edge')
						}
						break
					case "FAILURE": 
						currentnode.removeClass('not-executing-highlight')
						currentnode.removeClass('executing-highlight')
						currentnode.removeClass('success-highlight')
						currentnode.removeClass('awaiting-data-highlight')
						currentnode.removeClass('shuffle-hover-highlight')
						currentnode.addClass('failure-highlight')

						if (!visited.includes(item.action.label)) {
							alert.error("Success for "+item.action.label+" with result "+item.result)
							visited.push(item.action.label)
							setVisited(visited)
						}
						break
					case "AWAITING_DATA": 
						currentnode.removeClass('not-executing-highlight')
						currentnode.removeClass('executing-highlight')
						currentnode.removeClass('success-highlight')
						currentnode.removeClass('failure-highlight')
						currentnode.removeClass('shuffle-hover-highlight')
						currentnode.addClass('awaiting-data-highlight')
						break
					default:
						console.log("DEFAULT?")
						break
				}
			}
		}

		if (responseJson.status === "ABORTED" || responseJson.status === "STOPPED" || responseJson.status === "FAILURE" || responseJson.status == "WAITING") {
			stop()

			setExecutionRunning(false)
			var curelements = cy.elements()
			for (var i = 0; i < curelements.length; i++) {
				if (curelements[i].classes().includes("executing-highlight")) {
					curelements[i].removeClass("executing-highlight")	
					curelements[i].addClass("failure-highlight")	
				} else {
					//curelements[i].removeClass('not-executing-highlight')
					//curelements[i].removeClass('executing-highlight')
					//curelements[i].removeClass('success-highlight')
					//curelements[i].removeClass('awaiting-data-highlight')
					//curelements[i].removeClass('failure-highlight')
				}
			}

			getWorkflowExecution(props.match.params.key)
		} else if (responseJson.status === "FINISHED") {
			setExecutionRunning(false)
			stop()
			getWorkflowExecution(props.match.params.key)
		}
	}

	const saveWorkflow = (curworkflow) => {
		var success = false

		// This might not be the right course of action, but seems logical, as items could be running already 
		// Makes it possible to update with a version in current render
		stop()
		var useworkflow = workflow
		if (curworkflow !== undefined) {
			useworkflow = curworkflow 
		} else {
			alert.info("Saving workflow")
		}

		var cyelements = cy.elements()
		var newActions = []
		var newTriggers = []
		var newBranches = []
		for (var key in cyelements) {
			if (cyelements[key].data === undefined) {
				continue
			}

			var type = cyelements[key].data()["type"]
			if (type === undefined) {
				if (cyelements[key].data().source === undefined || 
					cyelements[key].data().target === undefined) {
					continue
				}

				var parsedElement = {
					id: cyelements[key].data().id,
					source_id: cyelements[key].data().source,
					destination_id: cyelements[key].data().target,
					conditions: cyelements[key].data().conditions,
				}

				newBranches.push(parsedElement)
			} else {
				if (type === "ACTION") {
					// FIXME - check whether position is new to not fuck up params etc.
					var curworkflowAction = useworkflow.actions.find(a => a.id === cyelements[key].data()["id"])
					if (curworkflowAction === undefined)  {
						curworkflowAction = cyelements[key].data() 
					} 

					curworkflowAction.position = cyelements[key].position()

					// workaround to fix some edgecases
					if (curworkflowAction.parameters === "" || curworkflowAction.parameters === null) {
						curworkflowAction.parameters = []
					}

					if (curworkflowAction.example === undefined || curworkflowAction.example === "" || curworkflowAction.example === null) {
						if (cyelements[key].data().example !== undefined) {
							curworkflowAction.example = cyelements[key].data().example 
						}
					}

					// Override just in this place
					curworkflowAction.errors = []
					curworkflowAction.isValid = true

					newActions.push(curworkflowAction)
				} else if (type === "TRIGGER") {
					//console.log("TRIGGER")
					var curworkflowTrigger = useworkflow.triggers.find(a => a.id === cyelements[key].data()["id"])
					if (curworkflowTrigger === undefined)  {
						curworkflowTrigger = cyelements[key].data() 
					} 

					curworkflowTrigger.position = cyelements[key].position()
					//console.log(curworkflowTrigger)

					newTriggers.push(curworkflowTrigger)
				}
			}
		}

		useworkflow.actions = newActions
		useworkflow.triggers = newTriggers
		useworkflow.branches = newBranches

		// Errors are backend defined
		useworkflow.errors = []

		setLastSaved(true)
		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key, {
    	  method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(useworkflow),
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for setting workflows :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (!responseJson.success) {
				console.log(responseJson)
				alert.error("Failed to save: "+responseJson.reason)
			} else {
				success = true
				if (responseJson.errors !== undefined) {
					console.log(responseJson)
					workflow.errors = responseJson.errors
					if (responseJson.errors.length === 0) {
						workflow.isValid = true
					}

					setWorkflow(workflow)
				}
				alert.success("Successfully saved workflow")
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});

		return success
	}

	const monitorUpdates = () => {
		const firstnode = cy.getElementById(workflow.start)
		if (firstnode.length === 0) {
			return false
		}

		cy.elements().removeClass('success-highlight failure-highlight executing-highlight')
		firstnode[0].addClass('executing-highlight')

		return true
	}

	const executeWorkflow = () => {
		if (!lastSaved) {
			//alert.error("You might have forgotten to save before executing.")
			console.log("FIXME: Might have forgotten to save before executing.")
		}

		var returncheck = monitorUpdates()
		if (!returncheck) {
			alert.error("No startnode set.")
			return
		}

		setVisited([])
		setExecutionRequest({})
		setExecutionRequestStarted(true)
		stop()

		var curelements = cy.elements()
		for (var i = 0; i < curelements.length; i++) {
			curelements[i].addClass("not-executing-highlight")
		}

		if (executionText.length > 0) { 
			alert.success("Starting execution with an execution argument")
		} else {
			alert.success("Starting execution")
		}

		const data = {"execution_argument": executionText, "start": workflow.start}
		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key+"/execute", {
    	  method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
				body: JSON.stringify(data),
    	})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (!responseJson.success) {
				alert.error("Failed to start: "+responseJson.reason)
				setExecutionRunning(false)
				setExecutionRequestStarted(false)
				stop()

				for (var i = 0; i < curelements.length; i++) {
					curelements[i].removeClass("not-executing-highlight")
				}
				return	
			} else {
				setExecutionRunning(true)
				setExecutionRequestStarted(false)
			}

			setExecutionRequest({
				"execution_id": responseJson.execution_id,
				"authorization": responseJson.authorization,
			})
			setExecutingNodes([workflow.start])
			setExecutionData({})
			setExecutionModalOpen(true)
			setExecutionModalView(1)
			start()
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	//const handleAppVersioning = (apps) => {
	//	var newapps = []
	//	for (var key in apps) {
	//		var item = apps[key]
	//		const previtem = newapps.findIndex(data => data.name === item.name)
	//		if (previtem === -1) {
	//			item["versions"] = [item.app_version]
	//			newapps.push(item)
	//			continue
	//		}

	//		// THere might be duplicates for some reason..
	//		if (!newapps[previtem]["versions"].includes(item.app_version)) {
	//			newapps[previtem]["versions"].push(item.app_version)
	//		}
	//	}
	//	
	//	// FIXME - handle this, as we can't have more than one of each :)
	//	//setVersionedApps(newapps)
	//}
	
	// Builtin actions that should ran in Worker and not apps	
	const getExtraApps = () => {
		const data = [{
			name: "Filter",
			is_valid: true,
			id: "0ca8887e-b4af-4e3e-887c-87e9d3bc3d3e",
			link: "https://shuffler.io",
			app_version: "1.0.0",
			generated: true,
			downloaded: false,
			sharing: false,
			verified: false,
			tested: false,
			owner: "",
			private_id: "",
			description: "Filter",
			environment: "Shuffle",
			small_image: "",
			large_image: "",
			contact_info: {name: "", url: ""},
			authentication: {required: false, parameters: [],},
			actions: [{
				description: "Filter cases",
				id: "",
				name: "filter_cases",
				node_type: "action",
				environment: "Shuffle",
				sharing: false,
				private_id: "",
				app_id: "",
				authentication: null,
				tested: true,
				parameters: [{
					description: "",
					id: "",
					name: "Field to look for",
					example: "$testing_1.#.id",
					value: "",
					multiline: true,
					action_field: "",
					variant: "",
					required: true,
					schema: {type: "string"},
				}]
			}],
		}]

		return data
	}

	// This can be used to only show prioritzed ones later
	// Right now, it can prioritize authenticated ones
	const internalIds = [
		"Shuffle Tools",
		"Testing",
		"Http",
	]

	const getAppAuthentication = () => {
		fetch(globalUrl+"/api/v1/apps/authentication", {
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
				return
			}

			return response.json()
		})
    .then((responseJson) => {
			if (responseJson.success) {
				setAppAuthentication(responseJson.data)
			} else {
				alert.error("Failed getting authentications")
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
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
			// FIXME - handle versions on left bar
			//handleAppVersioning(responseJson)
			//var tmpapps = []
			//tmpapps = tmpapps.concat(getExtraApps())
			//tmpapps = tmpapps.concat(responseJson)
			setApps(responseJson)
			getAppAuthentication() 

			setFilteredApps(responseJson.filter(app => !internalIds.includes(app.name)))
			setPrioritizedApps(responseJson.filter(app => internalIds.includes(app.name)))
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}
	
	const getWorkflow = () => {
		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key, {
    	  	method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!")
				window.location.pathname = "/workflows"
			}

			return response.json()
		})
    .then((responseJson) => {
			// Not sure why this is necessary.
			if (responseJson.isValid === undefined) {
				responseJson.isValid = true
			}
			if (responseJson.errors === undefined) {
				responseJson.errors = []
			}

			setWorkflow(responseJson)
			setWorkflowDone(true)
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const onUnselect = (event) => {
		console.time("UNSELECT")

		// Attempt at rewrite of name in other actions in following nodes.
		// Should probably be done in the onBlur for the textfield instead
		/*
		if (event.target.data().type === "ACTION") {
			const nodeaction = event.target.data()
			const curaction = workflow.actions.find(a => a.id === nodeaction.id)
			console.log("workflowaction: ", curaction)
			console.log("nodeaction: ", nodeaction)
			if (nodeaction.label !== curaction.label) {
				console.log("BEACH!")

				var params = []
				const fixedName = "$"+curaction.label.toLowerCase().replace(" ", "_")
				for (var actionkey in workflow.actions) {
					if (workflow.actions[actionkey].id === curaction.id) {
						continue
					}

					for (var paramkey in workflow.actions[actionkey].parameters) {
						const param = workflow.actions[actionkey].parameters[paramkey]
						if (param.value === null || param.value === undefined || !param.value.includes("$")) {
							continue
						}

						const innername = param.value.toLowerCase().replace(" ", "_")
						if (innername.includes(fixedName)) {
							//workflow.actions[actionkey].parameters[paramkey].replace(
							//console.log("FOUND!: ", innername)
						}
					}
				}
			}
		}
		*/

		// FIXME - check if they have value before overriding like this for no reason.
		// Would save a lot of time (400~ ms -> 30ms)
		//console.log("ACTION: ", selectedAction)
		//console.log("APP: ", selectedApp)
		setSelectedAction({})
		setSelectedApp({})
		setSelectedTrigger({})
		//setSelectedEdge({})

		// setSelectedTriggerIndex(-1)	
		//setSelectedActionEnvironment({})
		setSelectedEdge({})
		//setTriggerAuthentication({})	
		//setSelectedTriggerIndex(-1)	
		//setTriggerFolders([])	

		// Can be used for right side view
		setRightSideBarOpen(false)
		console.timeEnd("UNSELECT")
	}

	const onEdgeSelect = (event) => {
		setRightSideBarOpen(true)
		setLastSaved(false)

		const triggercheck = workflow.triggers.find(trigger => trigger.id === event.target.data()["source"])
		if (triggercheck === undefined) {
			setSelectedEdgeIndex(workflow.branches.findIndex(data => data.id === event.target.data()["id"]))
			setSelectedEdge(event.target.data())

		} else {
			//alert.info("Can't edit branches from triggers") 
		}

		setSelectedAction({})
		setSelectedTrigger({})
	}

	const onNodeSelect = (event) => {
		const data = event.target.data()
		setLastSaved(false)
		const branch = workflow.branches.filter(branch => branch.source_id === data.id || branch.destination_id === data.id)
		console.log("NODE: ", data)
		console.log("BRANCHES: ", branch)

		if (data.type === "ACTION") {
			// FIXME - unselect
			//console.log(cy.elements('[_id!="${data._id}"]`))
			// Does it choose the wrong action?
			var curaction = workflow.actions.find(a => a.id === data.id)
			if (!curaction || curaction === undefined) { 
				//alert.error("Action not found. Please remake it.")
				return
			}

			const curapp = apps.find(a => a.name === curaction.app_name && a.app_version === curaction.app_version)
			if (!curapp || curapp === undefined) {
				alert.error("App "+curaction.app_name+" not found. Did someone delete it?")
				//return
			} else {
				setRequiresAuthentication(curapp.authentication.required && curapp.authentication.parameters !== undefined && curapp.authentication.parameters !== null)
				if (curapp.authentication.required) {
					// Setup auth here :)
					const authenticationOptions = []
					var findAuthId = ""
					if (curaction.authentication_id !== null && curaction.authentication_id !== undefined && curaction.authentication_id.length > 0) {
						findAuthId = curaction.authentication_id
					}

					var tmpAuth = JSON.parse(JSON.stringify(appAuthentication))
					for (var key in tmpAuth) {
						var item = tmpAuth[key]

						const newfields = {}
						for (var filterkey in item.fields) {
							newfields[item.fields[filterkey].key] = item.fields[filterkey].value
						}

						item.fields = newfields
						if (item.app.name === curapp.name) {
							authenticationOptions.push(item)
							if (item.id === findAuthId) {
								curaction.selectedAuthentication = item
							}
						}
					}

					curaction.authentication = authenticationOptions
					if (curaction.selectedAuthentication === null || curaction.selectedAuthentication === undefined || curaction.selectedAuthentication.length === "") {
						curaction.selectedAuthentication = {}
					}
				} else {
					curaction.authentication = []
					curaction.authentication_id = ""
					curaction.selectedAuthentication = {}
				}

				setSelectedApp(curapp)
			}

			if (environments !== undefined) {
				var env = environments.find(a => a.Name === curaction.environment)
				if (!env || env === undefined) {
					env = environments[defaultEnvironmentIndex]
				}

				setSelectedActionEnvironment(env)
			}

			setSelectedActionName(curaction.name)	
			setSelectedAction(curaction)

			/*
			var params = []
			const fixedName = "$"+curaction.label.toLowerCase().replace(" ", "_")
			for (var actionkey in workflow.actions) {
				if (workflow.actions[actionkey].id === curaction.id) {
					continue
				}

				for (var paramkey in workflow.actions[actionkey].parameters) {
					const param = workflow.actions[actionkey].parameters[paramkey]
					if (param.value === null || param.value === undefined || !param.value.includes("$")) {
						continue
					}

					const innername = param.value.toLowerCase().replace(" ", "_")
					if (innername.includes(fixedName)) {
						console.log("FOUND!: ", innername)
					}
				}
			}
			*/
		} else if (data.type === "TRIGGER") {
			//console.log("Should handle trigger "+data.triggertype)
			//console.log(data)

			setSelectedTriggerIndex(workflow.triggers.findIndex(a => a.id === data.id))
			setSelectedTrigger(data)
			setSelectedActionName(data.name)
			setSelectedActionEnvironment(data.env)
		} else {
			alert.error("Can't handle "+data.type)
		}

		setRightSideBarOpen(true)
	}

	// Checks for errors in edges when they're added 
	const onEdgeAdded = (event) => {
		setLastSaved(false)
		const edge = event.target.data()
		//console.log(workflow.branches)

		// Check if: 
		// dest == source && source == dest
		// dest == dest && source == source
		// backend: check all children? to stop recursion
		var found = false
		for (var key in workflow.branches) {
			if (workflow.branches[key].destination_id === edge.source && workflow.branches[key].source_id === edge.target) {
				alert.error("A branch in the opposite direction already exists")
				event.target.remove()
				found = true
				break
			} else if (workflow.branches[key].destination_id === edge.target && workflow.branches[key].source_id === edge.source) {
				console.log(edge.source)
				alert.error("That branch already exists")
				event.target.remove()
				found = true
				break
			} else if (edge.target === workflow.start) {
				var targetnode = workflow.triggers.findIndex(data => data.id === edge.source)
				if (targetnode === -1) {
					alert.error("Can't make arrow to starting node")
					event.target.remove()
					found = true
					break
				}
			} else if (edge.source === workflow.branches[key].source_id) {
				// FIXME: Verify multi-target for triggers
				// 1. Check if destination exists 
				// 2. Check if source is a trigger
				// targetnode = workflow.triggers.findIndex(data => data.id === edge.source)
				// console.log("Destination: ", edge.target)
				// console.log("CHECK SOURCE IF ITS A TRIGGER: ", targetnode)
				// if (targetnode !== -1) {
				// 	alert.error("Triggers can only target one target (startnode)")
				// 	event.target.remove()
				// 	found = true
				// 	break
				// }
			} else {
				// Find the targetnode and check if its a trigger 
				// FIXME - do this for both actions and other types?
				targetnode = workflow.triggers.findIndex(data => data.id === edge.target)
				if (targetnode !== -1) {
					if (workflow.triggers[targetnode].app_name !== "User Input") {

						alert.error("Can't have triggers as target of branch")
						event.target.remove()
						found = true
						break
					}
				} 
			}
		}

		var newbranch = { 
			"source_id": edge.source,
			"destination_id": edge.target,
			"id_": edge.id,
			"id": edge.id,
			"hasErrors": false,
		}

		if (!found) {
			newbranch["hasErrors"] = false

			workflow.branches.push(newbranch)
			setWorkflow(workflow)
		}
	}

	const onNodeAdded = (event) => {
		setLastSaved(false)
		const node = event.target

		if (node.isNode() && cy.nodes().size() === 1) {
			//setStartNode(node.data('id'))
			workflow.start = node.data('id')
			setWorkflow(workflow)
		} else {
			if (workflow.actions === null) {
				return
			}

			// Remove bad startnode
			const startnode_exists = false
			for (var key in workflow.actions) {
				const action = workflow.actions[key]
				if (action.isStartNode && workflow.start !== action.id) {
					action.isStartNode = false
				}
			}

			setWorkflow(workflow)
		}
	}

	const onEdgeRemoved = (event) => {
		setLastSaved(false)
		const edge = event.target

		workflow.branches = workflow.branches.filter(a => a.id !== edge.data().id)
		setWorkflow(workflow)

		// trigger as source check
		const indexcheck = workflow.triggers.findIndex(data => edge.data()["source"] === data.id)
		if (indexcheck !== -1) {
			//alert.error("Can't remove edge from a trigger")
			console.log("Shouldnt remove edge from trigger")
			//const edgeToBeAdded = {
			//	group: "edges",
			//	data: newcybranch,
			//}
		}
	}

	const onNodeRemoved = (event) => {
		const node = event.target
		const data = node.data()
		setLastSaved(false)

		//var currentnode = cy.getElementById(data.id)
		//if (currentnode.length === 0) {
		//}
		if (workflow.start === data.id && workflow.actions.length > 1) {
			// FIXME - should check branches connected to startnode, as picking random
			// might just be confusing
			cy.nodes().forEach(function( ele ) {
				if (ele.id() !== workflow.start && ele.data()["label"] !== undefined) {
					alert.success("Changed startnode to "+ele.data()["label"])
					ele.data("isStartNode", true)
					workflow.start = ele.id()
					return true
				}
			});
		}


		workflow.actions = workflow.actions.filter(a => a.id !== data.id)
		workflow.triggers = workflow.triggers.filter(a => a.id !== data.id)

		setWorkflow(workflow)
		if (data.type === "TRIGGER") {
			saveWorkflow(workflow)
		}
	}

	var previouskey = 0
	const handleKeyDown = (event) => {
		// SHIFT = 16
		// CTRL = 17
		//console.log(event.keyCode)
	    switch( event.keyCode ) {
	        case 27:
				console.log("ESCAPE")
	            break;
			case 46:
				removeNode()		
				console.log("DELETE")
	            break;
			case 38:
				console.log("UP")
	            break;
			case 37:
				console.log("LEFT")
	            break;
			case 40:
				console.log("DOWN")
	            break;
			case 39:
				console.log("RIGHT")
	            break;
			case 90:
				if (previouskey === 17) {
					console.log("CTRL+Z")
				}
	            break;
			case 67:
				if (previouskey === 17) {
					console.log("CTRL+C")
				}
	            break;
			case 86:
				if (previouskey === 17) {
					console.log("CTRL+V")
				}
	            break;
			case 88:
				if (previouskey === 17) {
					console.log("CTRL+V")
				}
	            break;
			case 83:
				if (previouskey === 17) {
					event.preventDefault()
					saveWorkflow()
				}
	            break;
			case 70:
				if (previouskey === 17) {
					event.preventDefault()
					cy.fit(null, 50)
				}
	      break;
			case 65:
				// As a poweruser myself, I found myself hitting this a few
				// too many times to just edit text. Need a better bind
				//
				//if (previouskey === 17) {
				//	event.preventDefault()
				//	if (executionRunning || executionRequestStarted) {
				//		abortExecution()		
				//	} else {
				//		executeWorkflow()		
				//	}
				//	cy.fit(null, 50)
				//}
	            break;
	        default: 
				//console.log(event.keyCode)
	            break;
	    }

		previouskey = event.keyCode
	}

	const registerKeys = () => {
		document.addEventListener("keydown", handleKeyDown);
	}

	const getEnvironments = () => {
		fetch(globalUrl+"/api/v1/getenvironments", {
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
				if (isCloud) {
					setEnvironments({"name": "Cloud", "type": "cloud"})
				} else {
					setEnvironments({"name": "Onprem", "type": "onprem"})
				}

				return
			}

			return response.json()
		})
    .then((responseJson) => {
			var found = false
			var showEnvCnt = 0 
			for (var key in responseJson) {
				if (responseJson[key].default) {
					setDefaultEnvironmentIndex(key)
					found = true
				}

				if (responseJson[key].archived === false) {
					showEnvCnt += 1
				}
			}

			if (showEnvCnt > 1) {
				setShowEnvironment(true)
			}

			if (!found) {
				for (var key in responseJson) {
					if (!responseJson[key].archived) {
						setDefaultEnvironmentIndex(key)
						break
					}
				}
			}

			setEnvironments(responseJson)
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	useEffect(() => {
		if (firstrequest) {
			setFirstrequest(false)
			getWorkflow()
			getApps()
			getAppAuthentication()
			getEnvironments()
			getWorkflowExecution(props.match.params.key)
			return
		} 

		// App length necessary cus of cy initialization
		if (elements.length === 0 && !graphSetup && Object.getOwnPropertyNames(workflow).length > 0) {
			setGraphSetup(true)
			setupGraph()
		} else if (!established && cy !== undefined && apps.length > 0 && Object.getOwnPropertyNames(workflow).length > 0){
			setEstablished(true)
			cy.edgehandles({
				handleNodes: (el) => el.isNode(),
				preview: false,
				toggleOffOnLeave: false,
				loopAllowed: function( node ){
					return false;
				},
			})

			cy.fit(null, 200)

			cy.on('select', 'node', (e) => onNodeSelect(e))
			cy.on('select', 'edge', (e) => onEdgeSelect(e))
			cy.on('unselect', (e) => onUnselect(e))

			cy.on('add', 'node', (e) => onNodeAdded(e))
			cy.on('add', 'edge', (e) => onEdgeAdded(e))
			cy.on('remove', 'node', (e) => onNodeRemoved(e))
			cy.on('remove', 'edge', (e) => onEdgeRemoved(e))

			cy.on('mouseover', 'edge', (e) => onEdgeHover(e))
			cy.on('mouseout', 'edge', (e) => onEdgeHoverOut(e))
			cy.on('mouseover', 'node', (e) => onNodeHover(e))
			cy.on('mouseout', 'node', (e) => onNodeHoverOut(e))

			//cy.on('mouseover', 'node', () => $(targetElement).addClass('mouseover'));

			//cy.on('cxttapstart', 'node', (e) => edgeHandler.start(e.target))
			//cy.on('cxttapend', 'node', (e) => edgeHandler.stop())
			//cy.on('cxtdragover', 'node', (e) => edgeHandler.preview(e.target))
			//cy.on('cxtdragout', 'node', (e) => edgeHandler.unpreview(e.target))

			// RIGHT HERE..?
			// This is wrong sometimes.. I'm mad
			document.title = "Workflow - "+workflow.name
			registerKeys()
			//setStartNode(workflow.start)
		} else if (established) {
			//console.log("established - should fix colors of things")	
			//console.log(cy.elements())	
		}
	})

	var previousnodecolor = ""
	//var previousedgecolor = ""
	const animationDuration = 150
	const onNodeHoverOut = (event) => {
		event.target.animate({
			style: {
				"border-width": "1px",
			}
		}, {
			duration: animationDuration,	
		})
	}

	const onNodeHover = (event) => {
		event.target.animate({
			style: {
				"border-width": "5px",
				"border-opacity": ".7",
			}
		}, {
			duration: animationDuration,	
		})

		previousnodecolor = event.target.style("border-color")
	}

	const onEdgeHoverOut = (event) => {
		event.target.removeStyle()
	}

	// This is here to have a proper transition for lines
	const onEdgeHover = (event) => {
		const sourcecolor = cy.getElementById(event.target.data("source")).style("border-color")
		const targetcolor = cy.getElementById(event.target.data("target")).style("border-color")
		event.target.animate({
			style: {
				"line-fill": "linear-gradient",
				'target-arrow-color': targetcolor,
				"line-gradient-stop-colors": [sourcecolor, targetcolor],
				"line-gradient-stop-positions": [0, 1],
			},
			duration: 0,
		})
	}


	const setupGraph = () => {
		const actions = workflow.actions.map(action => {
			const node = {}
			node.position = action.position
			node.data = action

			node.data._id = action["id"]
			node.data.type = "ACTION"
			node.isStartNode = action["id"] === workflow.start

			var example = ""
			if (action.example !== undefined && action.example !== null && action.example.length > 0) {
				example = action.example
			}

			node.data.example = example

			return node;
		})

		const triggers = workflow.triggers.map(trigger => {
			const node = {}
			node.position = trigger.position
			node.data = trigger 

			node.data._id = trigger["id"]
			node.data.type = "TRIGGER"

			return node;
		})

		// FIXME - tmp branch update
		var insertedNodes = [].concat(actions, triggers)
		const edges = workflow.branches.map((branch, index) => {
			//workflow.branches[index].conditions = [{

			const edge = { };
			var conditions = workflow.branches[index].conditions
			if (conditions === undefined || conditions === null) {
				conditions = []
			}

			var label = ""
			if (conditions.length === 1) {
				label = conditions.length+" condition"
			} else if (conditions.length > 1) {
				label = conditions.length+" conditions"
			}

			edge.data = {
				id: branch.id,
				_id: branch.id,
				source: branch.source_id,
				target: branch.destination_id,
				label: label,
				conditions: conditions,
				hasErrors: branch.has_errors
			};
			return edge;
		})

		setWorkflow(workflow)

		// Verifies if a branch is valid and skips others
		var newedges = []
		for (var key in edges) {
			var item = edges[key]

			const sourcecheck = insertedNodes.find(data => data.data.id === item.data.source)
			const destcheck = insertedNodes.find(data => data.data.id === item.data.target)
			if (sourcecheck === undefined || destcheck === undefined) {
				continue
			}

			newedges.push(item)
		}

		insertedNodes = insertedNodes.concat(newedges)
		setElements(insertedNodes)
	}

	const removeNode = () => {
		setSelectedApp({})
		setSelectedAction({})
		setSelectedActionName("")

		const selectedNode = cy.$(':selected')
		if (selectedNode.data() === undefined) {
			return
		}

		if (selectedNode.data().type === "TRIGGER") {
			console.log("Should remove trigger!")
			console.log(selectedNode.data())
			const triggerindex = workflow.triggers.findIndex(data => data.id === selectedNode.data().id)
			setSelectedTriggerIndex(triggerindex)
			if (selectedNode.data().trigger_type === "SCHEDULE") {
				setSelectedTrigger(selectedNode.data())
				stopSchedule(selectedNode.data(), triggerindex)
			} else if (selectedNode.data().trigger_type === "WEBHOOK") {
				setSelectedTrigger(selectedNode.data())
				deleteWebhook(selectedNode.data(), triggerindex)
			} else if (selectedNode.data().trigger_type === "EMAIL") {
				setSelectedTrigger(selectedNode.data())
				stopMailSub(selectedTrigger, triggerindex)
			}

		} 

		selectedNode.remove()
		setSelectedTrigger({})
		setSelectedTriggerIndex({})
	}

	const stopSchedule = (trigger, triggerindex) => {
		alert.info("Stopping schedule")
		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key+"/schedule/"+trigger.id, {
    	  	method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			// No matter what, it's being stopped.
			if (!responseJson.success) {
				alert.error("Failed to stop schedule: " + responseJson.reason)

				workflow.triggers[triggerindex].status = "stopped" 
				trigger.status = "stopped" 
				setSelectedTrigger(trigger)
				setWorkflow(workflow)
				saveWorkflow(workflow)
			} else {
				alert.success("Successfully stopped schedule")
				workflow.triggers[triggerindex].status = "stopped" 
				trigger.status = "stopped" 
				setSelectedTrigger(trigger)
				setWorkflow(workflow)
				saveWorkflow(workflow)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	//const submitSchedule = (id, name, frequency, executionArg) => {
	const submitSchedule = (trigger, triggerindex) => {
		//const cronSplit = workflow.triggers[triggerindex].parameters[0].value.split("*")
		//if (cronSplit.length <= 5 || cronSplit.length > 6) {
		//	alert.error("Error: Bad cron, example run every 1 minute: */1 * * * *")
		//	return
		//}

		if (trigger.name.length <= 0) {
			alert.error("Error: name can't be empty")
			return
		}

		alert.info("Attempting to create schedule with name " + trigger.name)
		const data = {
			"name": trigger.name,
			"frequency": workflow.triggers[triggerindex].parameters[0].value,
			"execution_argument": workflow.triggers[triggerindex].parameters[1].value,
			"environment": workflow.triggers[triggerindex].environment,
			"id": trigger.id,
		}

		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key+"/schedule", {
    	  	method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(data),
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (!responseJson.success) {
				alert.error("Failed to set schedule: " + responseJson.reason)
			} else {
				alert.success("Successfully created schedule")
				workflow.triggers[triggerindex].status = "running" 
				trigger.status = "running" 
				setSelectedTrigger(trigger)
				setWorkflow(workflow)
				console.log("Should set the status to running and save")
				saveWorkflow(workflow)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const appViewStyle = {
		marginLeft: 5,
		marginRight: 5,
		display: "flex",
		flexDirection: "column",
		height: "100%",
	}

	const scrollStyle = {
		marginTop: 10,
		overflow: "scroll",
		height: "100%",
		overflowX: "auto",
		overflowY: "auto",
	}

	const paperAppStyle = {
		borderRadius: borderRadius,
		minHeight: "100px",
		maxHeight: "100px",
		minWidth: "100%",
		maxWidth: "100%",
		marginTop: "5px",
		color: "white",
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
	}

	const paperVariableStyle = {
		borderRadius: borderRadius,
		minHeight: "50px",
		maxHeight: "50px",
		minWidth: "100%",
		maxWidth: "100%",
		marginTop: "5px",
		color: "white",
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
	}
	
	const VariablesView = () => {
		const [open, setOpen] = React.useState(false);
		const [anchorEl, setAnchorEl] = React.useState(null);

		const menuClick = (event) => {
			setOpen(!open)
			setAnchorEl(event.currentTarget);
		}

		const deleteVariable = (variableName) => {
			workflow.workflow_variables = workflow.workflow_variables.filter(data => data.name !== variableName)
			setWorkflow(workflow)
		}

		const deleteExecutionVariable = (variableName) => {
			workflow.execution_variables = workflow.execution_variables.filter(data => data.name !== variableName)
			setWorkflow(workflow)
		}

		const variableScrollStyle = {
			margin: 15,
			overflow: "scroll",
			height: "66vh",
			overflowX: "auto",
			overflowY: "auto",
			flex: "10",
		}

		return (
			<div style={appViewStyle}>
				<div style={variableScrollStyle}>
						What are <a href="https://shuffler.io/docs/workflows#workflow_variables" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>WORKFLOW variables?</a>
					{workflow.workflow_variables === null ? 
					null : workflow.workflow_variables.map(variable=> {
						return (
							<div key={variable.name} >
								<Paper square style={paperVariableStyle} onClick={() => {
								}}>
									<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: "2px", backgroundColor: "orange", marginRight: "5px"}} />
									<div style={{display: "flex", width: "100%"}}>
										<div style={{flex: "10", marginTop: "15px", marginLeft: "10px", overflow: "hidden"}} onClick={() => {
										setNewVariableName(variable.name)
										setNewVariableDescription(variable.description)
										setNewVariableValue(variable.value)
										setVariablesModalOpen(true)}}>
											Name: {variable.name} 
										</div>
										<div style={{flex: "1", marginLeft: "0px"}}>
											<IconButton
												aria-label="more"
												aria-controls="long-menu"
												aria-haspopup="true"
												onClick={menuClick}
												style={{color: "white"}}
											  >
												<MoreVertIcon />
											</IconButton>
											<Menu
      										id="long-menu"
											  	anchorEl={anchorEl}
													keepMounted
													open={open}
						  					  PaperProps={{
						  					    style: {
						  					    	backgroundColor: surfaceColor,
						  					    }
						  					  }}
											  onClose={() => {
												  setOpen(false)
												  setAnchorEl(null)
											  }}
      										>

											<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
												setOpen(false)
												setNewVariableName(variable.name)
												setNewVariableDescription(variable.description)
												setNewVariableValue(variable.value)
												setVariablesModalOpen(true)
											}} key={"Edit"}>{"Edit"}</MenuItem>
											<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
												deleteVariable(variable.name)
												setOpen(false)
											}} key={"Delete"}>{"Delete"}</MenuItem>
											</Menu>
										</div>
									</div>
								</Paper>
							</div>
						)
					})}
					<div style={{flex: "1"}}>
						<Button fullWidth style={{margin: "auto", marginTop: "10px",}} color="primary" variant="outlined" onClick={() => {
							setVariablesModalOpen(true)
							setLastSaved(false)
						}}>New workflow variable</Button> 				
					</div>
					<Divider style={{marginBottom: 20, marginTop: 20, height: 1, width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
						What are <a href="https://shuffler.io/docs/workflows#execution_variables" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>EXECUTION variables?</a>
					{workflow.execution_variables === null || workflow.execution_variables === undefined ? 
					null : workflow.execution_variables.map(variable=> {
						return (
							<div>
								<Paper square style={paperVariableStyle} onClick={() => {
								}}>
									<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: "2px", backgroundColor: "orange", marginRight: "5px"}} />
									<div style={{display: "flex", width: "100%"}}>
										<div style={{flex: "10", marginTop: "15px", marginLeft: "10px", overflow: "hidden"}} onClick={() => {
										setNewVariableName(variable.name)
										setExecutionVariablesModalOpen(true)}}>
											Name: {variable.name} 
										</div>
										<div style={{flex: "1", marginLeft: "0px"}}>
											<IconButton
												aria-label="more"
												aria-controls="long-menu"
												aria-haspopup="true"
												onClick={menuClick}
												style={{color: "white"}}
											  >
												<MoreVertIcon />
											</IconButton>
											<Menu
      										id="long-menu"
											  	anchorEl={anchorEl}
													keepMounted
													open={open}
						  					  PaperProps={{
						  					    style: {
						  					    	backgroundColor: surfaceColor,
						  					    }
						  					  }}
											  onClose={() => {
												  setOpen(false)
												  setAnchorEl(null)
											  }}
      										>

											<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
												setOpen(false)
												setNewVariableName(variable.name)
												setExecutionVariablesModalOpen(true)
											}} key={"Edit"}>{"Edit"}</MenuItem>
											<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
												deleteExecutionVariable(variable.name)
												setOpen(false)
											}} key={"Delete"}>{"Delete"}</MenuItem>
											</Menu>
										</div>
									</div>
								</Paper>
							</div>
						)
					})}
					<div style={{flex: "1"}}>
						<Button fullWidth style={{margin: "auto", marginTop: "10px",}} color="primary" variant="outlined" onClick={() => {
							setExecutionVariablesModalOpen(true)
							setLastSaved(false)
						}}>New execution variable</Button> 				
					</div>
				</div>
			</div>
		)
	}

	const curTab = 0
	const handleSetTab = (event, newValue) => {
		setCurrentView(newValue)
	}
	
	const HandleLeftView = () => {
		// Defaults to apps.
		var thisview = <AppView />
		if (currentView === 1) {
			thisview = <TriggersView />
		} else if (currentView === 2) {
			thisview = <VariablesView />
		}

		const tabStyle = {
			maxWidth: leftBarSize/3,
			minWidth: leftBarSize/3,
			flex: 1,
			textTransform: "none",
		}

		const iconStyle = {
			marginTop: 3,
			marginRight: 5,
		}

		return(
			<div>
				<div style={{minHeight: bodyHeight-appBarSize-50, maxHeight: bodyHeight-appBarSize-50}}>	
					{thisview}
				</div>
				<Divider style={{backgroundColor: "rgb(91, 96, 100)"}}/>
				<Tabs
					value={currentView}
					indicatorColor="primary"
					onChange={handleSetTab}
					aria-label="Left sidebar tab"
				>
					<Tab label={
						<Grid container direction="row" alignItems="center">
							<Grid item>
								<AppsIcon style={iconStyle} />
							</Grid>
							<Grid item>
								Apps
							</Grid>
						</Grid>
					} style={tabStyle} />
					<Tab label={
						<Grid container direction="row" alignItems="center">
								<Grid item>
								<ScheduleIcon style={iconStyle} />
							</Grid>
							<Grid item>
								Triggers
							</Grid>
						</Grid>
					}	style={tabStyle} />
					<Tab label={
						<Grid container direction="row" alignItems="center">
								<Grid item>
								<FavoriteBorderIcon style={iconStyle} />
							</Grid>
							<Grid item>
								Variables
							</Grid>
						</Grid>
					}style={tabStyle} />
				</Tabs>
			</div>
		)
	}

	const triggers = [{
			"name": "Webhook",	
			"type": "TRIGGER",
			"status": "uninitialized",
			"trigger_type": "WEBHOOK",
			"errors": null,
			"large_image": 'data:image/png;base64,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',
			"is_valid": true,
			"label": "Webhook",
			"environment": "cloud",
			"description": "Simple HTTP webhook",
			"long_description": "Execute a workflow with an unauthicated POST request",
		}, 
		{
			"name": "User Input",	
			"type": "TRIGGER",
			"status": "running",
			"large_image": "data:image/png;base64,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",
			"description": "Wait for user input",
			"trigger_type": "USERINPUT",
			"errors": null,
			"is_valid": true,
			"label": "User input",
			"environment": "cloud",
			"long_description": "Take user input to continue execution",
		}, 
		{
			"name": "Schedule",	
			"type": "TRIGGER",
			"status": "uninitialized",
			"description": "Schedule execution time",
			"trigger_type": "SCHEDULE",
			"errors": null,
			"large_image": "data:image/png;base64,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",
			"label": "Schedule",
			"is_valid": true,
			"environment": "cloud",
			"long_description": "Create a schedule based on cron",
		},
		{
			"name": "Email",	
			"type": "TRIGGER",
			"status": "uninitialized",
			"description": "Add your email provider",
			"trigger_type": "EMAIL",
			"errors": null,
			"is_valid": true ? false : cloudSyncEnabled,
			"label": "Email",
			"environment": "cloud",
			"large_image": 'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/hAytodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Nzg4QTJBMjVEMDI1MTFFN0EwQUVDODc5QjYyQkFCMUQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Nzg4QTJBMjZEMDI1MTFFN0EwQUVDODc5QjYyQkFCMUQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3ODhBMkEyM0QwMjUxMUU3QTBBRUM4NzlCNjJCQUIxRCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3ODhBMkEyNEQwMjUxMUU3QTBBRUM4NzlCNjJCQUIxRCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/bAEMAAwICAgICAwICAgMDAwMEBgQEBAQECAYGBQYJCAoKCQgJCQoM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',
			"long_description": "Execute a workflow when you get an email",
		}]

	const TriggersView = () => {
		const triggersViewStyle = {
			marginLeft: "10px",
			marginRight: "10px",
			display: "flex",
			flexDirection: "column",
		}

		// Predefined hurr	

		return (
			<div style={triggersViewStyle}>
				<div style={appScrollStyle}>
					{triggers.map((trigger, index) => {
						var imageline = trigger.large_image.length === 0 ?
							<img alt="" style={{width: "80px"}} />
							: 
							<img alt="" src={trigger.large_image} style={{width: 80, height: 80}} />

						const color = trigger.is_valid ? "green" : "orange"
						return(
							<Draggable 
								key={index}
								onDrag={(e) => {handleTriggerDrag(e, trigger)}}
								onStop={(e) => {handleDragStop(e)}}
								dragging={false}
								position={{
									x: 0,
									y: 0,
								}}
							>
							<Paper square style={paperAppStyle} onClick={() => {}}>
								<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: "2px", backgroundColor: color, marginRight: "5px"}}>
								</div>
								<Grid container style={{margin: "10px 10px 10px 10px", flex: "10"}}>
									<Grid item>
										<ButtonBase>
											{imageline}
										</ButtonBase>
									</Grid>
									<Grid style={{display: "flex", flexDirection: "column", marginLeft: "20px"}}>
										<Grid item style={{flex: "1"}}>
											<h3 style={{marginBottom: "0px", marginTop: "10px"}}>{trigger.name}</h3>
										</Grid>
										<Grid item style={{flex: "1"}}>
											{trigger.description}	
										</Grid>
									</Grid>
								</Grid>
							</Paper>
							</Draggable>
						)
					})}
				</div>
			</div>
		)
	}

	var newNodeId = ""
	const handleTriggerDrag = (e, data) => {
		const cycontainer = cy.container()
		// Chrome lol
		//if (e.srcElement !== undefined && e.srcElement.localName === "canvas") {
		if (e.pageX > cycontainer.offsetLeft && e.pageX < cycontainer.offsetLeft+cycontainer.offsetWidth && e.pageY > cycontainer.offsetTop && e.pageY < cycontainer.offsetTop+cycontainer.offsetHeight) {
			if (newNodeId.length > 0) {
				var currentnode = cy.getElementById(newNodeId)
				if (currentnode.length === 0) {
					return
				}

				currentnode[0].renderedPosition("x", e.pageX-cycontainer.offsetLeft)
				currentnode[0].renderedPosition("y", e.pageY-cycontainer.offsetTop)
			} else{
				console.log(workflow)
				if (workflow.start === "" || workflow.start === undefined) {
					alert.error("Define a starting action first.")
					return
				}

				if (data.is_valid === false) {
					alert.error(data.name+" is only available on https://shuffler.io so far")
					return
				}

				newNodeId = uuid.v4()
				const newposition = {
					"x": e.pageX-cycontainer.offsetLeft,
					"y": e.pageY-cycontainer.offsetTop,
				}

				console.log(data)
				const newAppData = {
					app_name: data.name,
					app_version: "1.0.0",
					environment: data.environment,
					description: data.description,
					long_description: data.long_description,
					errors: [],
					id_: newNodeId,
					_id_: newNodeId,
					id: newNodeId,
					label: data.label,
					type: data.type,
					is_valid: true,
					trigger_type: data.trigger_type,
					large_image: data.large_image,
					status: "uninitialized",
					name: data.name,
					isStartNode: false,
					position: newposition,
				}

				//if (data.trigger_type === "WEBHOOK") {
				//	newAppData.status = "running"
				//}

				// Can all the data be in here? hmm
				const nodeToBeAdded = {
					group: "nodes",
					data: newAppData,
					renderedPosition: newposition,
				}

				cy.add(nodeToBeAdded)

				if (workflow.triggers === undefined) {
					workflow.triggers = [newAppData]
				} else {
					workflow.triggers.push(newAppData)
				}

				const newEdgeUuid = uuid.v4()
				const newbranch = { 
					"source_id": newNodeId,
					"destination_id": workflow.start,
					"id_": newEdgeUuid,
					"id": newEdgeUuid,
					"hasErrors": false,
				}

				const newcybranch = { 
					"source": newNodeId,
					"target": workflow.start,
					"_id": newEdgeUuid,
					"id": newEdgeUuid,
					"hasErrors": false,
				}

				const edgeToBeAdded = {
					group: "edges",
					data: newcybranch,
				}

				if (data.name !== "User Input") {
					//workflow.branches.push(newbranch)
					cy.add(edgeToBeAdded)
				}

				setWorkflow(workflow)
				//if (data.trigger_type === "WEBHOOK") {
				//	newWebhook(newAppData)
				//	saveWorkflow(workflow)
				//}
			}
		}
	}

	const handleAppDrag = (e, app) => {
		const cycontainer = cy.container()
		// Chrome lol
		//if (e.srcElement !== undefined && e.srcElement.localName === "canvas") {
		if (e.pageX > cycontainer.offsetLeft && e.pageX < cycontainer.offsetLeft+cycontainer.offsetWidth && e.pageY > cycontainer.offsetTop && e.pageY < cycontainer.offsetTop+cycontainer.offsetHeight) {
			if (newNodeId.length > 0) {
				var currentnode = cy.getElementById(newNodeId)
				if (currentnode.length === 0) {
					return
				}

				currentnode[0].renderedPosition("x", e.pageX-cycontainer.offsetLeft)
				currentnode[0].renderedPosition("y", e.pageY-cycontainer.offsetTop)
			} else{
				if (app.actions === undefined || app.actions === null || app.actions.length === 0) {
					alert.error("App "+app.name+" currently has no actions to perform. Please go to https://shuffler.io/apps to edit it.")
					return
				}

				newNodeId = uuid.v4()
				const actionType = "ACTION"
				const actionLabel = getNextActionName(app.name)
				var parameters = null
				var example = ""

				if (app.actions[0].parameters !== null && app.actions[0].parameters.length > 0) {
					parameters = app.actions[0].parameters
				}
				if (app.actions[0].returns.example !== undefined && app.actions[0].returns.example !== null && app.actions[0].returns.example.length > 0) {
					example = app.actions[0].returns.example
				}
				
				var newAppPopup = false

				/*
				 FIXME: Add auth.
						selectedAction.selectedAuthentication = e.target.value
						selectedAction.authentication_id = e.target.value.id
						setSelectedAction(selectedAction)
						setUpdate(Math.random())
				*/

				const newAppData = {
					app_name: app.name,
					app_version: app.app_version, 
					app_id: app.id,
					sharing: app.sharing,
					private_id: app.private_id,	
					environment: environments[defaultEnvironmentIndex].Name,
					errors: [],
					id_: newNodeId,
					_id_: newNodeId,
					id: newNodeId,
					is_valid: true,
					label: actionLabel,
					type: actionType,
					name: app.actions[0].name,
					parameters: parameters,
					isStartNode: false,
					large_image: app.large_image,
					authentication: [],
					execution_variable: undefined,
					example: example,
				}

				// const image = "url("+app.large_image+")"

				// FIXME - find the cytoscape offset position 
				// Can this be done with zoom calculations?
				const nodeToBeAdded = {
					group: "nodes",
					data: newAppData,
					renderedPosition: {
						x: e.layerX,
						y: e.layerY,
					}
				}

				cy.add(nodeToBeAdded)

				if (workflow.actions === undefined || workflow.actions.length === 0) {
					workflow.start = newAppData.id
					workflow.actions = []
					newAppData.isStartNode = true
					//setStartNode(newAppData.id)
				}

				if (workflow.actions.length > 0 && elements.length === 0) {
					const actions = workflow.actions.map(action => {
						const node = {}
						node.position = action.position
						node.data = action

						node.data._id = action["id"]
						node.data.type = "ACTION"
						node.isStartNode = action["id"] === workflow.start

						return node
					})

					const tmpelements = [].concat(actions)
					setElements(tmpelements)
				}

				if (workflow.actions.length === 1 && workflow.actions[0].id === workflow.start) {
					const newEdgeUuid = uuid.v4()
					const newcybranch = { 
						"source": workflow.start,
						"target": newNodeId,
						"_id": newEdgeUuid,
						"id": newEdgeUuid,
						"hasErrors": false,
					}

					const edgeToBeAdded = {
						group: "edges",
						data: newcybranch,
					}
					console.log("SHOULD STITCH WITH STARTNODE")
					cy.add(edgeToBeAdded)
				}

				workflow.actions.push(newAppData)
				setWorkflow(workflow)

				if (newAppPopup) {
					//alert.error("SHOULD MAKE USER AUTHENTICATE THE APP OR SET hasError")
					//alert.info("Remember: set the authentication for the user itself, not the app") 
				}
			}
		}
	}

	const handleDragStop = (e, app) => {
		newNodeId = ""
		console.log("STOP!: ", e)
		console.log("APP!: ", app)
	}

	const appScrollStyle = {
		overflow: "scroll",
		maxHeight: bodyHeight-appBarSize-55,
		minHeight: bodyHeight-appBarSize-55,
		overflowY: "auto",
		overflowX: "hidden",
	}

	const runAppSearch = (event) => {
		setAppSearch(event.target.value)
		setFilteredApps(apps.filter(app => app.name.toLowerCase().includes(event.target.value.trim().toLowerCase())))
	}

	const ParsedAppPaper = (props) => {
		const app = props.app
		const [hover, setHover] = React.useState(false)

		// FIXME - add label to apps, as this might be slow with A LOT of apps
		var newAppname = app.name
		newAppname = newAppname.replace("_", " ").charAt(0).toUpperCase()+newAppname.substring(1)
		const maxlen = 24
		if (newAppname.length > maxlen) {
			newAppname = newAppname.slice(0, maxlen)+".."
		}

		const image = "url("+app.large_image+")"
		const newAppStyle = JSON.parse(JSON.stringify(paperAppStyle))
		const pixelSize = !hover ? "2px" : "4px"
		newAppStyle.borderLeft = app.is_valid ? `${pixelSize} solid green` : `${pixelSize} solid orange`
	

		return (
			<Draggable 
					onDrag={(e) => {handleAppDrag(e, app)}}
					onStop={(e) => {handleDragStop(e, app)}}
					key={app.id}
					dragging={false}
					position={{
						x: 0,
						y: 0,
					}}
				>
				<Paper square style={newAppStyle} onMouseOver={() => {setHover(true)}} onMouseOut={() => {setHover(false)}}>
					<Grid container style={{margin: "10px 10px 10px 15px", flex: "10"}}>
						<Grid item>
							<div style={{borderRadius: borderRadius, height: 80, width: 80, backgroundImage: image, backgroundSize: "cover", backgroundRepeat: "no-repeat"}} />
						</Grid>
						<Grid style={{display: "flex", flexDirection: "column", marginLeft: "20px", minWidth: 185, maxWidth: 185, overflow: "hidden", maxHeight: 80, }}>
							<Grid item style={{flex: 1}}>
								<h4 style={{marginBottom: 0, marginTop: 5}}>{newAppname}</h4>
							</Grid>
							<Grid item style={{flex: 1}}>
								Version: {app.app_version}	
							</Grid>
							<Grid item style={{flex: 1, width: "100%", maxHeight: 27, overflow: "hidden",}}>
								{app.description}
							</Grid>
						</Grid>
					</Grid>
					</Paper>
				</Draggable>
			)
	}

	const AppView = () => {
		return(
			<div style={appViewStyle}>
				<div style={{flex: "1"}}>
					<div style={appScrollStyle}>
					{/*
					<TextField
						style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
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
							runAppSearch(event)
						}}
					/>
					*/}
					{prioritizedApps.map((app, index) => {	
						return(
							<ParsedAppPaper key={index} app={app} />	
						)
					})}
					{filteredApps.filter(innerapp => !internalIds.includes(innerapp.id)).map((app, index) => {	
						return(
							<ParsedAppPaper key={index} app={app} />	
						)
					})}
					</div>
				</div>
			</div>
		)
	}

	const getNextActionName = (appName) => {
		var highest = ""
		//label = name + _number
		for (var key in workflow.actions) {
			const item = workflow.actions[key]
			if (item.app_name === appName) {
				var number = item.label.split("_")
				if (isNaN(number[-1]) && parseInt(number[number.length-1]) > highest) {
					highest = number[number.length-1]
				}
			}
		}

		if (highest) {
			return appName+"_"+(parseInt(highest)+1)
		} else {
			return appName+"_"+1
		}
	}

	const setNewSelectedAction = (e) => {
		const newaction = selectedApp.actions.find(a => a.name === e.target.value)

		// Does this one find the wrong one?
		selectedAction.name = newaction.name
		selectedAction.parameters = JSON.parse(JSON.stringify(newaction.parameters))

		if (newaction.returns.example !== undefined && newaction.returns.example !== null && newaction.returns.example.length > 0) {
			selectedAction.example = newaction.returns.example 
		}

		// FIXME - this is broken sometimes lol
		//var env = environments.find(a => a.Name === newaction.environment)
		//if ((!env || env === undefined) && selectedAction.environment === undefined ) {
		//	env = environments[defaultEnvironmentIndex]
		//} 
		//setSelectedActionEnvironment(env)
		
		setSelectedAction(selectedAction)
		setSelectedActionName(e.target.value)
	}

	// APPSELECT at top
	// appname & version 
	// description
	// ACTION select
	//
	const selectedNameChange = (event) => {
		console.log("OLDNAME: ", selectedActionName)
		event.target.value = event.target.value.replace("(", "")
		event.target.value = event.target.value.replace(")", "")
		event.target.value = event.target.value.replace("$", "")
		event.target.value = event.target.value.replace("#", "")
		event.target.value = event.target.value.replace(".", "")
		event.target.value = event.target.value.replace(",", "")
		event.target.value = event.target.value.replace(" ", "_")
		selectedAction.label = event.target.value
		setSelectedAction(selectedAction)

		/*
		if (nodeaction.label !== curaction.label) {
			console.log("BEACH!")

			var params = []
			const fixedName = "$"+curaction.label.toLowerCase().replace(" ", "_")
			for (var actionkey in workflow.actions) {
				if (workflow.actions[actionkey].id === curaction.id) {
					continue
				}

				for (var paramkey in workflow.actions[actionkey].parameters) {
					const param = workflow.actions[actionkey].parameters[paramkey]
					if (param.value === null || param.value === undefined || !param.value.includes("$")) {
						continue
					}

					const innername = param.value.toLowerCase().replace(" ", "_")
					if (innername.includes(fixedName)) {
						//workflow.actions[actionkey].parameters[paramkey].replace(
						//console.log("FOUND!: ", innername)
					}
				}
			}
		}
		*/
	}

	const selectedTriggerChange = (event) => {
		selectedTrigger.label = event.target.value
		setSelectedTrigger(selectedTrigger)
	}

	const getParents = (action) => {
		var allkeys = [action.id]
		var handled = []
		var results = []

		while(true) {
			for (var key in allkeys) {
				var currentnode = cy.getElementById(allkeys[key])
				if (handled.includes(currentnode.data().id)) {
					continue
				} else {
					// Get the name / label here too?
					handled.push(currentnode.data().id)
					results.push(currentnode.data())
				}

				if (currentnode.length === 0) {
					continue
				}

				const incomingEdges = currentnode.incomers('edge')
				if (incomingEdges.length === 0) {
					continue
				}

				for (var i = 0; i < incomingEdges.length; i++) {
					var tmp = incomingEdges[i]
					if (!allkeys.includes(tmp.data().source)) {
						allkeys.push(tmp.data().source)
					}
				}
			}
			if (results.length === allkeys.length) {
				break
			}
		}

		// Remove self
		results = results.filter(data => data.id !== action.id) 
		results = results.filter(data => data.type !== "TRIGGER") 
		results.push({"label": "Execution Argument", "type": "INTERNAL"})
		return results
	}

	// BOLD name: type: required? 
	// FORM
	// Dropdown -> static, action, local env, global env
	// VALUE (JSON)
	// {data.name}, {data.description}, {data.required}, {data.schema.type}
	const AppActionArguments = (props) => {
		const [selectedActionParameters, setSelectedActionParameters] = React.useState([])
		const [selectedVariableParameter, setSelectedVariableParameter] = React.useState("")
		const [showDropdown, setShowDropdown] = React.useState(false)
		const [showDropdownNumber, setShowDropdownNumber] = React.useState(0)
		const [actionlist, setActionlist] = React.useState([])
		const [jsonList, setJsonList] = React.useState([])
		const [showAutocomplete, setShowAutocomplete] = React.useState(false)
		const [menuPosition, setMenuPosition] = useState(null)

		useEffect(() => {
			if (selectedActionParameters !== null && selectedActionParameters.length === 0) {
				if (selectedAction.parameters !== null && selectedAction.parameters.length > 0) {
					setSelectedActionParameters(selectedAction.parameters)
				}
			}
			
			if ((selectedVariableParameter === null || selectedVariableParameter === undefined) && (workflow.workflow_variables !== null && workflow.workflow_variables.length > 0)) {
				// FIXME - this is the bad thing
				setSelectedVariableParameter(workflow.workflow_variables[0].name)
			} 

			if (actionlist.length === 0) {
				// FIXME: Have previous execution values in here
				actionlist.push({"type": "Execution Argument", "name": "Execution Argument", "value": "$exec", "highlight": "exec", "autocomplete": "exec", "example": "hello"})
				if (workflow.workflow_variables !== null && workflow.workflow_variables !== undefined && workflow.workflow_variables.length > 0) {
					for (var key in workflow.workflow_variables) {
						const item = workflow.workflow_variables[key]
						actionlist.push({"type": "workflow_variable", "name": item.name, "value": item.value, "id": item.id, "autocomplete": `${item.name.split(" ").join("_")}`, "example": item.value})
					}
				}

				// FIXME: Add values from previous executions if they exist
				if (workflow.execution_variables !== null && workflow.execution_variables !== undefined && workflow.execution_variables.length > 0) {
					for (var key in workflow.execution_variables) {
						const item = workflow.execution_variables[key]
						actionlist.push({"type": "execution_variable", "name": item.name, "value": item.value, "id": item.id, "autocomplete": `${item.name.split(" ").join("_")}`, "example": ""})
					}
				}

				// Loops parent nodes' old results to fix autocomplete
				var parents = getParents(selectedAction)
				if (parents.length > 1) {
					for (var key in parents) {
						const item = parents[key]
						if (item.label === "Execution Argument") {
							continue
						}

						var exampledata = item.example === undefined ? "" : item.example
						// Find previous execution and their variables
						if (exampledata === "" && workflowExecutions.length > 0) {
							// Look for the ID
							const found = false
							for (var key in workflowExecutions) {
								if (workflowExecutions[key].results === undefined || workflowExecutions[key].results === null) {
									continue
								}

								var foundResult = workflowExecutions[key].results.find(result => result.action.id === item.id)
								if (foundResult === undefined) {
									continue
								}

								foundResult.result = foundResult.result.trim()
								foundResult.result = foundResult.result.split(" None").join(" \"None\"")
								foundResult.result = foundResult.result.split(" False").join(" false")
								foundResult.result = foundResult.result.split(" True").join(" true")
								foundResult.result = foundResult.result.split("\'").join("\"")

								var jsonvalid = true
								try {
									const tmp = String(JSON.parse(foundResult.result))
									if (!foundResult.result.includes("{") && !foundResult.result.includes("[")) {
										jsonvalid = false
									}
								} catch (e) {
									jsonvalid = false
								}

								// Finds the FIRST json only
								if (jsonvalid) {
									exampledata = JSON.parse(foundResult.result)
									break
								} 
								//else {
								//	console.log("Invalid JSON: ", foundResult.result)
								//}
							}
						}

						// 1. Take 
						const actionvalue = {"type": "action", "id": item.id, "name": item.label, "autocomplete": `${item.label.split(" ").join("_")}`, "example": exampledata}
						actionlist.push(actionvalue)
					}
				}

				setActionlist(actionlist)
			}
		})

		const changeActionParameter = (event, count) => {
			if (event.target.value[event.target.value.length-1] === "$") {
				if (!showDropdown) {
					setShowAutocomplete(false)
					setShowDropdown(true)
					setShowDropdownNumber(count)
				}
			} else {
				if (showDropdown) {
					setShowDropdown(false)
				}
			}

			// bad detection mechanism probably
			if (event.target.value[event.target.value.length-1] === "." && actionlist.length > 0) {
				console.log("GET THE LAST ARGUMENT FOR NODE!")
				// THIS IS AN EXAMPLE OF SHOWING IT 
				/*
				const inputdata = {"data": "1.2.3.4", "dataType": "4.5.6.6"}
				setJsonList(GetParsedPaths(inputdata, ""))
				if (!showDropdown) {
					setShowAutocomplete(false)
					setShowDropdown(true)
					setShowDropdownNumber(count)
				}
				console.log(jsonList)
				*/

				// Search for the item backwards
				// 1. Reverse search backwards from . -> $
				// 2. Search the actionlist for the item  
				// 3. Find the data for the specific item

				var curstring = ""
				var record = false
				for (var key in selectedActionParameters[count].value) {
					const item = selectedActionParameters[count].value[key]
					if (record) {
						curstring += item
					}

					if (item === "$") {
						record = true
						curstring = ""
					}
				}

				if (curstring.length > 0 && actionlist !== null) {
					// Search back in the action list
					curstring = curstring.split(" ").join("_").toLowerCase()
					var actionItem = actionlist.find(data => data.autocomplete.split(" ").join("_").toLowerCase() === curstring)
					if (actionItem !== undefined) {
						console.log("Found item: ", actionItem)

						//actionItem.example = actionItem.example.trim()
						//actionItem.example = actionItem.example.split(" None").join(" \"None\"")
						//actionItem.example  = actionItem.example.split("\'").join("\"")

						var jsonvalid = true
						try {
							const tmp = String(JSON.parse(actionItem.example))
							if (!actionItem.example.includes("{") && !actionItem.example.includes("[")) {
								jsonvalid = false
							}
						} catch (e) {
							jsonvalid = false
						}

						if (jsonvalid) {
							setJsonList(GetParsedPaths(JSON.parse(actionItem.example), ""))

							if (!showDropdown) {
								setShowAutocomplete(false)
								setShowDropdown(true)
								setShowDropdownNumber(count)
							}
						}
					}
				}
			} else {
				if (jsonList.length > 0) {
					setJsonList([])
				}
			}

			selectedActionParameters[count].value = event.target.value
			selectedAction.parameters[count].value = event.target.value
			setSelectedAction(selectedAction)
			//setUpdate(event.target.value)
		}

		const changeActionParameterVariable = (fieldvalue, count) => {
			//console.log("CALLED THIS ONE WITH VALUE!", fieldvalue)
			//if (selectedVariableParameter === fieldvalue) {
			//	return
			//}

			setSelectedVariableParameter(fieldvalue)

			selectedActionParameters[count].action_field = fieldvalue 
			selectedAction.parameters = selectedActionParameters

			setSelectedActionName(selectedActionName)
			setSelectedApp(selectedApp)
			setSelectedAction(selectedAction)
			setUpdate(fieldvalue)
		}

		// Sets ACTION_RESULT things
		const changeActionParameterActionResult = (fieldvalue, count) => {
			//cy.nodes().forEach(function( ele ) {
			//	if (ele.data()["label"] === fieldvalue) {
			//		selectedActionParameters[count].action_field = ele.id()
			//		return
			//	}
			//});

			selectedActionParameters[count].action_field = fieldvalue
			selectedAction.parameters = selectedActionParameters

			// FIXME - check if startnode

			// Set value 
			setSelectedActionName(selectedActionName)
			setSelectedApp(selectedApp)

			setSelectedAction(selectedAction)
			setUpdate(fieldvalue)
		}

		const changeActionParameterVariant = (data, count) => {
			selectedActionParameters[count].variant = data
			selectedActionParameters[count].value = "" 

			if (data === "ACTION_RESULT") {
				var parents = getParents(selectedAction)
				if (parents.length > 0) {
					selectedActionParameters[count].action_field = parents[0].label
				} else {
					selectedActionParameters[count].action_field = ""
				}
			} else if (data === "WORKFLOW_VARIABLE") {
				if (workflow.workflow_variables !== null && workflow.workflow_variables !== undefined && workflow.workflow_variables.length > 0) {
					selectedActionParameters[count].action_field = workflow.workflow_variables[0].name
				}
			}
			
			selectedAction.parameters = selectedActionParameters

			// This is a stupid workaround to make it refresh rofl
			setSelectedActionName({})
			setSelectedAction({})
			setSelectedTrigger({})
			setSelectedApp({})
			setSelectedEdge({})
			// FIXME - check if startnode

			// Set value 
			setSelectedActionName(selectedActionName)
			setSelectedApp(selectedApp)
			setSelectedAction(selectedAction)
		}

		// FIXME: Issue #40 - selectedActionParameters not reset
		if (Object.getOwnPropertyNames(selectedAction).length > 0 && selectedActionParameters.length > 0) {
			return (
				<div style={{marginTop: "30px"}}>	
					<b>Arguments</b>
					{selectedActionParameters.map((data, count) => {
						if (data.variant === "") {
							data.variant = "STATIC_VALUE"
						}


						// selectedAction.selectedAuthentication = e.target.value
						// selectedAction.authentication_id = e.target.value.id
						if (!selectedAction.auth_not_required && selectedAction.selectedAuthentication !== undefined && selectedAction.selectedAuthentication.fields !== undefined && selectedAction.selectedAuthentication.fields[data.name] !== undefined) {
							// This sets the placeholder in the frontend. (Replaced in backend)
							selectedActionParameters[count].value = selectedAction.selectedAuthentication.fields[data.name]
							selectedAction.parameters[count].value = selectedAction.selectedAuthentication.fields[data.name]
							setSelectedAction(selectedAction)

							return null	
						}

						var staticcolor = "inherit"
						var actioncolor = "inherit"
						var varcolor = "inherit"
						var multiline
						if (data.multiline !== undefined && data.multiline !== null && data.multiline === true) {
							multiline = true
						}

						if (data.value !== undefined && data.value.startsWith("{") && data.value.endsWith("}")) {
							multiline = true
						}

						var placeholder = "Static value"
						if (data.example !== undefined && data.example !== null && data.example.length > 0) {
							placeholder = data.example
						}

						if (data.name.startsWith("${") && data.name.endsWith("}")) {
							const paramcheck = selectedAction.parameters.find(param => param.name === "body")
							if (paramcheck !== undefined) {
								if (paramcheck["value_replace"] !== undefined) {
									console.log("IN THE VALUE REPLACE: ", paramcheck["value_replace"])
									const subparamindex = paramcheck["value_replace"].findIndex(param => param.key === data.name)
									if (subparamindex !== -1) {
										data.value = paramcheck["value_replace"][subparamindex]["value"]
									}
								}
							}
						}

						var disabled = false
						var rows = "5"
						var openApiHelperText = "This is an OpenAPI specific field"
						if (selectedApp.generated && selectedApp.activated && data.name === "body") {
							const regex = /\${(\w+)}/g
							const found = placeholder.match(regex)
							console.log("THERE MAY BE THINGS INSIDE THE BODY, NO: ", found)
							if (found === null) {
								//setExtraBodyFields([])
							} else {
								rows = "1"
								disabled = true
								openApiHelperText = "OpenAPI spec: fill the following fields."
								console.log("SHOULD ADD TO selectedActionParameters!: ", found, selectedActionParameters)
								var changed = false
								for (var specKey in found) {
									const tmpitem = found[specKey]
									var skip = false
									for (var innerkey in selectedActionParameters) {
										if (selectedActionParameters[innerkey].name === tmpitem) {
											skip = true
											break
										}
									}

									if (skip) {
										console.log("SKIPPING ", tmpitem)
										continue 
									}

									changed = true 
									selectedActionParameters.push({
										action_field: "",
										configuration: false,
										description: "Generated by OpenAPI body example",
										example: "",
										id: "",
										multiline: false,
										name: tmpitem,
										options: null,
										required: false,
										schema: {type: "string"},
										skip_multicheck: false,
										tags: null,
										value: "",
										variant: "STATIC_VALUE",
									})
								}

								if (changed) {
									setSelectedActionParameters(selectedActionParameters)
								}
							}
						}

						console.log("Data: ", data)
						var datafield = 
							<TextField
								disabled={disabled}
								style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										minHeight: "50px", 
										marginLeft: "5px",
										maxWidth: "95%",
										fontSize: "1em",
									},
									endAdornment: (
										<InputAdornment position="end">
											<Tooltip title="Autocomplete text" placement="top">
												<AddCircleOutlineIcon style={{cursor: "pointer"}} onClick={(event) => {
													setMenuPosition({
														top: event.pageY,
														left: event.pageX,
													})
													setShowDropdownNumber(count)
													setShowDropdown(true)
													setShowAutocomplete(true)
												}}/>
											</Tooltip>
										</InputAdornment>
									)
								}}
								fullWidth
								multiline={multiline}
								rows={rows}
								color="primary"
								defaultValue={data.value}
								type={placeholder.includes("***") ? "password" : "text"}
								placeholder={placeholder}
								onChange={(event) => {
									if (data.name.startsWith("${") && data.name.endsWith("}")) {
										// PARAM FIX - Gonna use the ID field, even though it's a hack
										const paramcheck = selectedAction.parameters.find(param => param.name === "body")
										if (paramcheck !== undefined) {
											if (paramcheck["value_replace"] === undefined) {
												paramcheck["value_replace"] = [{
													"key": data.name,
													"value": event.target.value,
												}]

											} else {
												const subparamindex = paramcheck["value_replace"].findIndex(param => param.key === data.name)
												if (subparamindex === -1) {
													paramcheck["value_replace"].push({
														"key": data.name,
														"value": event.target.value,
													})
												} else {
													paramcheck["value_replace"][subparamindex]["value"] = event.target.value
												}
											}
											//console.log("PARAM: ", paramcheck)
										}
									} else {
										changeActionParameter(event, count)
									}
								}}
								helperText={selectedApp.generated && selectedApp.activated && data.name === "body" ? 
									<span style={{color:"white", marginBottom: 5,}}>
										{openApiHelperText}
									</span>
									: 
									data.name.startsWith("${") && data.name.endsWith("}") ?
										<span style={{color:"white", marginBottom: 5,}}>
											OpenAPI helperfield	
										</span>
									:
									null
								}
								onBlur={(event) => {
									// Super basic check
									//if (event.target.value.startsWith("{")) {
									//	console.log("VALIDATING JSON")
									//	try {
									//		JSON.parse(event.target.value)
									//	} catch (e) {
									//		alert.error("Failed to parse json: ", e)
									//	}
									//}
								}}
							/>

						if (selectedActionParameters[count].schema !== undefined && selectedActionParameters[count].schema !== null && selectedActionParameters[count].schema.type === "file") {
							datafield = 
								<TextField
									style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
									InputProps={{
										style:{
											color: "white",
											minHeight: "50px", 
											marginLeft: "5px",
											maxWidth: "95%",
											fontSize: "1em",
										},
										endAdornment: (
											<InputAdornment position="end">
												<Tooltip title="Autocomplete text" placement="top">
													<AddCircleOutlineIcon style={{cursor: "pointer"}} onClick={(event) => {
														setMenuPosition({
															top: event.pageY,
															left: event.pageX,
														})
														setShowDropdownNumber(count)
														setShowDropdown(true)
														setShowAutocomplete(true)
													}}/>
												</Tooltip>
											</InputAdornment>
										)
									}}
									fullWidth
									multiline={multiline}
									rows="5"
									color="primary"
									defaultValue={data.value}
									type={"text"}
									placeholder={"The file ID to get"}
									onChange={(event) => {
										changeActionParameter(event, count)
									}}
									onBlur={(event) => {
									}}
								/>
							//const fileId = "6daabec1-892b-469c-b603-c902e47223a9"
							//datafield = `SHOW FILES FROM OTHER NODES? Filename: ${selectedActionParameters[count].value}`	
							/*
							if (selectedActionParameters[count].value != fileId) {
								changeActionParameter(fileId, count)
								setUpdate(Math.random())

							}
							*/
						} else if (selectedActionParameters[count].options !== undefined && selectedActionParameters[count].options !== null && selectedActionParameters[count].options.length > 0) {
							if (selectedActionParameters[count].value === "" && selectedActionParameters[count].required) {
								// Rofl, dirty workaround :)
								const e = {
									target: {
										value: selectedActionParameters[count].options[0],
									}
								}

								changeActionParameter(e, count)
							}

							datafield =
								<Select
									SelectDisplayProps={{
										style: {
											marginLeft: 10,
										}
									}}
									value={selectedActionParameters[count].value}
									fullWidth
									onChange={(e) => {
										console.log("VAL: ", e.target.value)
										changeActionParameter(e, count)
										setUpdate(Math.random())
									}}
									style={{backgroundColor: surfaceColor, color: "white", height: "50px"}}
									>
									{selectedActionParameters[count].options.map(data => (
										<MenuItem key={data} style={{backgroundColor: inputColor, color: "white"}} value={data}>
											{data}
										</MenuItem>
									))}
								</Select>

						} else if (data.variant === "STATIC_VALUE") {
							staticcolor = "#f85a3e"	
						} else if (data.variant === "ACTION_RESULT") {
							// Gets the parents of the current node
							var parents = getParents(selectedAction)
							actioncolor = "#f85a3e"
							// set the datafield
							//var datafieldvalue = "Error: No parents. Action not eligible"
							//if (parents.length > 0) {
							//	datafieldvalue = parents[0].label
							//}
							const fixedActionText = selectedActionParameters[count].value 

							datafield = 
							<div>
								<Select
									SelectDisplayProps={{
										style: {
											marginLeft: 10,
										}
									}}
									value={selectedActionParameters[count].action_field}
									fullWidth
									onChange={(e) => {
										changeActionParameterActionResult(e.target.value, count) 
									}}
									style={{backgroundColor: surfaceColor, color: "white", height: "50px"}}
									>
									{parents.map(data => (
										<MenuItem key={data.label} style={{backgroundColor: inputColor, color: "white"}} value={data.label}>
											{data.label}
										</MenuItem>
									))}
								</Select>
								<TextField
									style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
									InputProps={{
										style:{
											color: "white",
											marginLeft: "5px",
											maxWidth: "95%",
											height: "50px", 
											fontSize: "1em",
										},
									}}
									fullWidth
									color="primary"
									defaultValue={data.value}
									helperText={<div style={{marginLeft: "5px", color:"white", marginBottom: "2px",}}>Example: $.body will get "data" from {'{"body": "data"}'}</div>}
									placeholder="Action variable ($.)" 
									onChange={(event) => {
										changeActionParameter(event, count)
									}}
								/>
							</div>

						} else if (data.variant === "WORKFLOW_VARIABLE") {
							varcolor = "#f85a3e"
							if ((workflow.workflow_variables === null || workflow.workflow_variables === undefined || workflow.workflow_variables.length === 0) && (workflow.execution_variables === null || workflow.execution_variables === undefined || workflow.execution_variables.length === 0)) {
								setCurrentView(2)
								datafield = 
								<div>
								<div>
									Looks like you don't have any variables yet.  
								</div>
								<div style={{width: "100%", margin: "auto"}}>
									<Button style={{margin: "auto", marginTop: "10px"}} color="primary" variant="outlined" onClick={() => {
										setVariablesModalOpen(true)
										setLastSaved(false)
									}}>New workflow variable</Button> 				
								</div>
								</div>
							} else {
								// FIXME - this is a shitty solution that needs re-renders all the time
								datafield = 
								<Select
									SelectDisplayProps={{
										style: {
											marginLeft: 10,
										}
									}}
									fullWidth
									value={selectedAction.parameters[count].action_field}
									onChange={(e) => {
										console.log(e.target.value)
										changeActionParameterVariable(e.target.value, count) 
									}}
									style={{backgroundColor: inputColor, color: "white", height: "50px"}}
									>
									{workflow.workflow_variables !== undefined && workflow.workflow_variables !== null ? workflow.workflow_variables.map(data => (
										<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={data.name}>
											{data.name}
										</MenuItem>
									)) : null}
									<Divider />
									{workflow.execution_variables !== undefined && workflow.execution_variables !== null ? workflow.execution_variables.map(data => (
										<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={data.name}>
											{data.name}
										</MenuItem>
									)) : null}
								</Select>
							}
						}

						// Shows nested list of nodes > their JSON lists
						const ActionlistWrapper = (props) => {

							const handleMenuClose = () => {
								setShowAutocomplete(false)

								if (!selectedActionParameters[count].value[selectedActionParameters[count].value.length-1] === "$") {
									setShowDropdown(false)
								}

								setUpdate(Math.random())
								setMenuPosition(null)
							}

							const handleItemClick = (values) => {
								if (values === undefined || values === null || values.length === 0) {
									return
								}

								var toComplete = selectedActionParameters[count].value.trim().endsWith("$") ? values[0].autocomplete : "$"+values[0].autocomplete
								for (var key in values) {
									if (key == 0 || values[key].autocomplete.length === 0) {
										continue
									}

									toComplete += values[key].autocomplete
								}

								selectedActionParameters[count].value += toComplete
								selectedAction.parameters[count].value = selectedActionParameters[count].value 
								setSelectedAction(selectedAction)
								setUpdate(Math.random())

								setShowDropdown(false)
								setMenuPosition(null)
							}

							const iconStyle = {
								marginRight: 15,
							}

							return (
							  <div >
									<Menu
										anchorReference="anchorPosition"
										anchorPosition={menuPosition}
										onClose={() => {
											handleMenuClose()
										}}
										open={!!menuPosition}
										style={{
											border: `2px solid #f85a3e`, 
											color: "white", 
											marginTop: 2,
										}}
									>
									{actionlist.map(innerdata => {
										const icon = innerdata.type === "action" ? <AppsIcon style={{marginRight: 10}} /> : innerdata.type === "workflow_variable" || innerdata.type === "execution_variable" ? <FavoriteBorderIcon style={{marginRight: 10}} /> : <ScheduleIcon style={{marginRight: 10}} /> 

										const handleExecArgumentHover = (inside) => {
											var exec_text_field = document.getElementById("execution_argument_input_field")
											if (exec_text_field !== null) {
												if (inside) {
													exec_text_field.style.border = "2px solid #f85a3e"
												} else {
													exec_text_field.style.border = ""
												}
											}

											// Also doing arguments
											if (workflow.triggers !== undefined && workflow.triggers !== null && workflow.triggers.length > 0) {
												for (var key in workflow.triggers) {
													const item = workflow.triggers[key]

													var node = cy.getElementById(item.id)
													if (node.length > 0) {
														if (inside) {
															node.addClass('shuffle-hover-highlight')
														} else {
															node.removeClass('shuffle-hover-highlight')
														}
													}

												}
											}
										}

										const handleActionHover = (inside, actionId) => {
											var node = cy.getElementById(actionId)
											if (node.length > 0) {
												if (inside) {
													node.addClass('shuffle-hover-highlight')
												} else {
													node.removeClass('shuffle-hover-highlight')
												}
											}
										}

										const handleMouseover = () => {
											if (innerdata.type === "Execution Argument") {
													handleExecArgumentHover(true)
												} else if (innerdata.type === "action") {
													handleActionHover(true, innerdata.id)
												}
											} 
											
										const handleMouseOut = () => {
											if (innerdata.type === "Execution Argument") {
												handleExecArgumentHover(false)
											} else if (innerdata.type === "action") {
												handleActionHover(false, innerdata.id)
											}
										}

										var parsedPaths = [] 
										if (typeof(innerdata.example) === "object") {
											parsedPaths = GetParsedPaths(innerdata.example, "")
										}

										return (
											parsedPaths.length > 0 ?
												<NestedMenuItem
													key={innerdata.name}
													label={
														<div style={{display: "flex"}}>
															{icon} {innerdata.name}
														</div>
													}
													parentMenuOpen={!!menuPosition}
													style={{backgroundColor: inputColor, color: "white", minWidth: 250,}}
													onClick={() => {
														handleItemClick([innerdata])
													}}
												>
													{parsedPaths.map((pathdata, index) => {
														// FIXME: Should be recursive in here
														const icon = pathdata.type === "value" ? <VpnKeyIcon style={iconStyle} /> : pathdata.type === "list" ? <FormatListNumberedIcon style={iconStyle} /> : <ExpandMoreIcon style={iconStyle} /> 
														return (
															<MenuItem key={pathdata.name} style={{backgroundColor: inputColor, color: "white", minWidth: 250,}} value={pathdata} onMouseOver={() => {}}
																onClick={() => {
																	handleItemClick([innerdata, pathdata])
																}}
															>
																<Tooltip color="primary" title={`Ex. value: ${pathdata.value}`} placement="left">
																	<div style={{display: "flex"}}>
																		{icon} {pathdata.name}
																	</div>
																</Tooltip>
															</MenuItem>
														)

													})}
												</NestedMenuItem>
											: 
												<MenuItem key={innerdata.name} style={{backgroundColor: inputColor, color: "white"}} value={innerdata} onMouseOver={() => handleMouseover()} onMouseOut={() => {handleMouseOut()}} 
													onClick={() => {
														handleItemClick([innerdata])
													}}
												>
													<Tooltip color="primary" title={`Value: ${innerdata.value}`} placement="left">
														<div style={{display: "flex"}}>
															{icon} {innerdata.name}
														</div>
													</Tooltip>
												</MenuItem>
											
										)
									})}	
								</Menu>
      				</div>
							)
						}

						var itemColor = "#f85a3e"
						if (!data.required) {
							itemColor = "#ffeb3b"
						}
						return (
						<div key={data.name}>	
							<div style={{marginTop: 20, marginBottom: 7, display: "flex"}}>


								{data.configuration === true ? 
									<Tooltip color="primary" title={`Authenticate ${selectedApp.name}`} placement="top">
										<LockOpenIcon style={{cursor: "pointer", width: 24, height: 24, marginRight: 10, }} onClick={() => {
											setAuthenticationModalOpen(true)
										}}/>
									</Tooltip>
								:
									<div style={{width: 17, height: 17, borderRadius: 17 / 2, backgroundColor: itemColor, marginRight: 10}}/>
								}
								<div style={{flex: "10"}}> 
									<b>{data.name.charAt(0).toUpperCase()+data.name.substring(1)} </b> 
								</div>

								{selectedActionParameters[count].options !== undefined && selectedActionParameters[count].options !== null && selectedActionParameters[count].options.length > 0  ? null : 
								<div style={{display: "flex"}}>
									<Tooltip color="primary" title="Static data" placement="top">
										<div style={{cursor: "pointer", color: staticcolor}} onClick={(e) => {
												e.preventDefault()
												changeActionParameterVariant("STATIC_VALUE", count) 
											}}>
											<CreateIcon />
										</div>
									</Tooltip>
									&nbsp;|&nbsp;
									<Tooltip color="primary" title="Data from previous action" placement="top">
										<div style={{cursor: "pointer", color: actioncolor}} onClick={(e) => {
											e.preventDefault()
											changeActionParameterVariant("ACTION_RESULT", count) 
										}}>
											<AppsIcon />
										</div>
									</Tooltip>
									&nbsp;|&nbsp;
									<Tooltip color="primary" title="Use local variable" placement="top">
										<div style={{cursor: "pointer", color: varcolor}} onClick={(e) => {
											e.preventDefault()
											changeActionParameterVariant("WORKFLOW_VARIABLE", count) 
										}}>
											<FavoriteBorderIcon />
										</div>
									</Tooltip>
								</div>	
							}
							</div>	
							{datafield}
							{showDropdown && showDropdownNumber === count && data.variant === "STATIC_VALUE" && jsonList.length > 0 ?
							  <FormControl fullWidth style={{marginTop: 0}}>
									<InputLabel id="action-autocompleter" style={{marginLeft: 10, color: "white"}}>Autocomplete</InputLabel>
									<Select
									  labelId="action-autocompleter"
										SelectDisplayProps={{
											style: {
												marginLeft: 10,
											}
										}}
										onClose={() => {
											setShowAutocomplete(false)

											if (!selectedActionParameters[count].value[selectedActionParameters[count].value.length-1] === ".") {
												setShowDropdown(false)
											}

											setUpdate(Math.random())
										}}
										onClick={() => setShowAutocomplete(true)}
										fullWidth
										open={showAutocomplete}
										style={{border: `2px solid #f85a3e`, color: "white", height: "50px", marginTop: 2,}}
										onChange={(e) => {
											if (selectedActionParameters[count].value[selectedActionParameters[count].value.length-1] === ".") {
												e.target.value.autocomplete = e.target.value.autocomplete.slice(1, e.target.value.autocomplete.length)
											}

											selectedActionParameters[count].value += e.target.value.autocomplete
											selectedAction.parameters[count].value = selectedActionParameters[count].value 
											setSelectedAction(selectedAction)
											setUpdate(Math.random())

											setShowDropdown(false)
										}}
									>
										{jsonList.map(data => {
											const iconStyle = {
												marginRight: 15,
											}

											const icon = data.type === "value" ? <VpnKeyIcon style={iconStyle} /> : data.type === "list" ? <FormatListNumberedIcon style={iconStyle} /> : <ExpandMoreIcon style={iconStyle} /> 
											return (
												<MenuItem key={data.name} style={{backgroundColor: inputColor, color: "white"}} value={data} onMouseOver={() => {}}>
													<Tooltip color="primary" title={`Ex. value: ${data.value}`} placement="left">
														<div style={{display: "flex"}}>
															{icon} {data.name}
														</div>
													</Tooltip>
												</MenuItem>
											)
										})}
									</Select>
      					</FormControl>
							: null}
							{showDropdown && showDropdownNumber === count && data.variant === "STATIC_VALUE" && jsonList.length === 0 ?
									<ActionlistWrapper actionlist={actionlist} />
							: null}


						</div>
					)})}
				</div>
				)
			} 
		return null
	}

	//height: "100%",
	const appApiViewStyle = {
		display: "flex", 
		flexDirection: "column", 
		backgroundColor: "#1F2023", 
		color: "white",
		paddingRight: 15,
		paddingLeft: 15,
		minHeight: "100%",
		zIndex: 1000,
		resize: "vertical",
		overflow: "auto",
	}

	const defineStartnode = () => {
		var oldstartnode = cy.getElementById(workflow.start)
		if (oldstartnode.length > 0) {
			oldstartnode[0].data("isStartNode", false)
			var oldnodecnt = workflow.actions.findIndex(a => a.id === workflow.start)
			if (workflow.actions[oldnodecnt] !== undefined) {
				workflow.actions[oldnodecnt].isStartNode = false
			}
		}

		var newstartnode = cy.getElementById(selectedAction.id)
		if (newstartnode.length > 0) {
			newstartnode[0].data("isStartNode", true)
			var newnodecnt = workflow.actions.findIndex(a => a.id === selectedAction.id)
			console.log("NEW NODE CNT: ", newnodecnt)
			if (workflow.actions[newnodecnt] !== undefined) {
				workflow.actions[newnodecnt].isStartNode = true
				console.log(workflow.actions[newnodecnt])
			}
		}

		// Find branches with triggers as source nodes
		// Move these targets to be the new node
		// Set arrows pointing to new startnode with errors
		//for (var key in workflow.branches) {
		//	var item = workflow.branches[key]	
		//	if (item.destination_id === oldstartnode[0].data()["id"]) {
		//		var curbranch = cy.getElementById(item.id)
		//		if (curbranch.length > 0) {
		//			//console.log(curbranch[0].data())
		//			//curbranch[0].data("target", selectedAction.id)
		//			//curbranch[0].data("hasErrors", true)
		//			//workflow.branches[key].destination_id = selectedAction.id
		//			//console.log(curbranch[0].data())
		//		}
		//	}
		//}

		setUpdate("start_node"+selectedAction.id)
		workflow.start = selectedAction.id
		setWorkflow(workflow)
		//setStartNode(selectedAction.id)
	}

	function sortByKey(array, key) {
		if (array === undefined) {
			return []
		}

	  return array.sort(function(a, b) {
			var x = a[key]; var y = b[key]
			return ((x < y) ? -1 : ((x > y) ? 1 : 0))
		})
	}

	const appApiView = Object.getOwnPropertyNames(selectedAction).length > 0 ? 
		<div style={appApiViewStyle}>
			<div style={{display: "flex", minHeight: 40, marginBottom: 30}}>
				<div style={{flex: 1}}>
					<h3 style={{marginBottom: 5}}>{selectedAction.app_name}</h3>
					<a href="https://shuffler.io/docs/workflows#nodes" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>What are actions?</a>
					{selectedAction.errors !== null && selectedAction.errors.length > 0 ? 
						<div>
							Errors: {selectedAction.errors.join("\n")}
						</div>
						: null
					}
				</div>
				<div style={{flex: "1"}}>
					<Button disabled={selectedAction.id === workflow.start} style={{zIndex: 5000, marginTop: "15px",}} color="primary" variant="outlined" onClick={(e) => {
						defineStartnode(e)	
					}}>Set startnode</Button> 				
				</div>
			</div>
			<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
			<Typography>
				Name
			</Typography>
			<TextField
				style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
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
				placeholder={selectedAction.label}
				onChange={selectedNameChange}
			/>
			{selectedApp.name !== undefined && selectedAction.authentication !== undefined && selectedAction.authentication.length === 0 && requiresAuthentication  ?
				<div style={{marginTop: 15}}>
					Authenticate {selectedApp.name}: 
					<Tooltip color="primary" title={"Add authentication option"} placement="top">
						<Button color="primary" style={{}} variant="text" onClick={() => {
							setAuthenticationModalOpen(true)
						}}>
							<AddIcon />
						</Button> 				
					</Tooltip>
				</div>
			: null}
			{selectedAction.authentication !== undefined && selectedAction.authentication.length > 0 ? 
				<div style={{marginTop: "20px"}}>
					Authentication
					<div style={{display: "flex"}}>
						<Select
							labelId="select-app-auth"
							value={selectedAction.selectedAuthentication}
							SelectDisplayProps={{
								style: {
									marginLeft: 10,
								}
							}}
							fullWidth
							onChange={(e) => {
								console.log("CHOSE AN AUTHENTICATION OPTION: ", e.target.value)
								selectedAction.selectedAuthentication = e.target.value
								selectedAction.authentication_id = e.target.value.id
								setSelectedAction(selectedAction)
								setUpdate(Math.random())
							}}
							style={{backgroundColor: inputColor, color: "white", height: "50px"}}
						>
							{selectedAction.authentication.map(data => (
								<MenuItem key={data.id} style={{backgroundColor: inputColor, color: "white"}} value={data}>
									{data.label} - ({data.app.app_version})
								</MenuItem>
							))}
						</Select>

						{/*

						<Button fullWidth style={{margin: "auto", marginTop: "10px",}} color="primary" variant="contained" onClick={() => setAuthenticationModalOpen(true)}>
							AUTHENTICATE
						</Button>
						curaction.authentication = authenticationOptions
							if (curaction.selectedAuthentication === null || curaction.selectedAuthentication === undefined || curaction.selectedAuthentication.length === "")
						*/}
					 	<Tooltip color="primary" title={"Add authentication option"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => {
								setAuthenticationModalOpen(true)
							}}>
								<AddIcon />
							</Button> 				
						</Tooltip>
					</div>
				</div>
				: null}
			{showEnvironment ? 
				<div style={{marginTop: "20px"}}>
					<Typography>
						Environment
					</Typography>
					<Select
						value={selectedActionEnvironment === undefined || selectedActionEnvironment.Name === undefined ? "" : selectedActionEnvironment.Name}
						SelectDisplayProps={{
							style: {
								marginLeft: 10,

							}
						}}
						fullWidth
						onChange={(e) => {
							const env = environments.find(a => a.Name === e.target.value)
							setSelectedActionEnvironment(env) 
							selectedAction.environment = env.Name
							setSelectedAction(selectedAction)
						}}
						style={{backgroundColor: inputColor, color: "white", height: "50px"}}
					>
						{environments.map(data => {
							if (data.archived) {
								return null
							}
							
							return (
								<MenuItem key={data.Name} style={{backgroundColor: inputColor, color: "white"}} value={data.Name}>
									{data.Name}
								</MenuItem>
							)
						})}
					</Select>
				</div>
				: null}
			{workflow.execution_variables !== undefined && workflow.execution_variables !== null && workflow.execution_variables.length > 0 ?
				<div style={{marginTop: "20px"}}>
					Set execution variable (optional) 
					<Select
						value={selectedAction.execution_variable !== undefined ? selectedAction.execution_variable.name : "No selection"}
						SelectDisplayProps={{
							style: {
								marginLeft: 10,
							}
						}}
						fullWidth
						onChange={(e) => {
							if (e.target.value === "No selection") {
								selectedAction.execution_variable = {"name": "No selection"}
							} else {
								const value = workflow.execution_variables.find(a => a.name === e.target.value)
								selectedAction.execution_variable = value
							}
							setSelectedAction(selectedAction)
							setUpdate(Math.random())
						}}
						style={{backgroundColor: inputColor, color: "white", height: "50px"}}
					>
							<MenuItem style={{backgroundColor: inputColor, color: "white"}} value="No selection">
								<em>No selection</em>
							</MenuItem>
							<Divider />
							{workflow.execution_variables.map(data => (
								<MenuItem style={{backgroundColor: inputColor, color: "white"}} value={data.name}>
									{data.name}
								</MenuItem>
							))}
					</Select>
				</div>
				: null}
			<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
			<div style={{flex: "6", marginTop: "20px"}}>
				<div style={{marginBottom: 5}}>
					<b>Actions</b>
				</div>
				<Select
					value={selectedActionName}
					fullWidth
					onChange={setNewSelectedAction}
					style={{backgroundColor: inputColor, color: "white", height: 50}}
					SelectDisplayProps={{
						style: {
							marginLeft: 10,
							maxHeight: 200,
						}
					}}
				>
					{sortByKey(selectedApp.actions, "label").map(data => {
						var newActionname = data.name
						if (data.label !== undefined && data.label !== null && data.label.length > 0) {
							newActionname = data.label
						}
						// ROFL FIXME - loop
						newActionname = newActionname.replace("_", " ")
						newActionname = newActionname.replace("_", " ")
						newActionname = newActionname.replace("_", " ")
						newActionname = newActionname.replace("_", " ")
						newActionname = newActionname.charAt(0).toUpperCase()+newActionname.substring(1)
						return (
						<MenuItem key={data.name} style={{maxWidth: 400, overflowX: "hidden", backgroundColor: inputColor, color: "white"}} value={data.name}>
							{newActionname}

						</MenuItem>
						)
					})}
				</Select>
				{selectedAction.description !== undefined && selectedAction.description.length > 0 ?
				<div style={{marginTop: 10, marginBottom: 10, maxHeight: 60, overflow: "hidden"}}>
					{selectedAction.description}
				</div> : null}
				<div style={{marginTop: "10px", borderColor: "white", borderWidth: "2px", marginBottom: 200}}>
					<AppActionArguments key={selectedAction.id} selectedAction={selectedAction} />

				</div>
				<div style={{}}>
						
				</div> 
			</div>
		</div> 
		: null 


	const headerSize = 68
	const rightsidebarStyle = {
		position: "fixed", 
		right: 0, 
		top: headerSize+1,
		height: "100%",
		bottom: 0,
		minWidth: "350px", 
		maxWidth: "350px", 
		borderLeft: "1px solid rgb(91, 96, 100)",
		overflow: "scroll",
		overflowX: "auto",
		overflowY: "auto",
		zIndex: 1000,
	}

	const setTriggerFolderWrapperMulti = event => {
	    const { options } = event.target
	    const value = []
	    for (let i = 0, l = options.length; i < l; i += 1) {
	      if (options[i].selected) {
	        value.push(options[i].value)
	      }
	    }

		if (selectedTrigger.parameters === null) {
			selectedTrigger.parameters = [[]] 
			workflow.triggers[selectedTriggerIndex].parameters = [[]]
		} 

		// This is a dirty workaround for the static values in the go backend and datastore db
		const fixedValue = value.join(splitter)
		selectedTrigger.parameters[0] = {"value": fixedValue, "name": "outlookfolder"}
		workflow.triggers[selectedTriggerIndex].parameters[0] = {"value": fixedValue, "name": "outlookfolder"}

		// This resets state for some reason (:
		setSelectedActionName({})
		setSelectedAction({})
		setSelectedTrigger({})
		setSelectedApp({})
		setSelectedEdge({})

		// Set value 
		setSelectedTrigger(selectedTrigger)
		setWorkflow(workflow)
	};

	//const setTriggerFolderWrapper = (event) => {
	//	if (selectedTrigger.parameters === null) {
	//		selectedTrigger.parameters = [] 
	//		workflow.triggers[selectedTriggerIndex].parameters = []
	//	} 

	//	const folder = triggerFolders.find(a => a.displayName === event.target.value)
	//	console.log(event.target.value)
	//	console.log(folder)
	//
	//	if (folder !== undefined) {
	//		workflow.triggers[selectedTriggerIndex].parameters[0] = {"value": folder.displayName, "name": "outlookfolder", "id": folder.id}
	//		selectedTrigger.parameters[0] = {"value": folder.displayName, "name": "outlookfolder", "id": folder.id}
	//		setWorkflow(workflow)

	//		// This resets state for some reason (:
	//		setSelectedActionName({})
	//		setSelectedActionEnvironment({})
	//		setSelectedAction({})
	//		setSelectedTrigger({})
	//		setSelectedApp({})
	//		setSelectedEdge({})

	//		// Set value 
	//		setSelectedTrigger(selectedTrigger)

	//	} else {
	//		alert.error("Some error occurred with folder "+event.target.value)
	//	}
	//}

	const setTriggerCronWrapper = (value) => {
		if (selectedTrigger.parameters === null) {
			selectedTrigger.parameters = []
		} 

		workflow.triggers[selectedTriggerIndex].parameters[0] = {"value": value, "name": "cron"}
		setWorkflow(workflow)
	}

	const setTriggerOptionsWrapper = (value) => {
		if (selectedTrigger.parameters === null) {
			selectedTrigger.parameters = []
		} 

		const splitItems = workflow.triggers[selectedTriggerIndex].parameters[2].value.split(",")
		console.log(splitItems)
		if (splitItems.includes(value)) {
			for( var i = 0; i < splitItems.length; i++){ 
			   	if (splitItems[i] === value) {
			     	splitItems.splice(i, 1) 
			   	}
			}

		} else {
			splitItems.push(value)
		}

		for( var i = 0; i < splitItems.length; i++){ 
			if (splitItems[i] === "") {
				splitItems.splice(i, 1) 
			}
		}
		
		workflow.triggers[selectedTriggerIndex].parameters[2].value = splitItems.join(",")

		console.log(splitItems)
		setWorkflow(workflow)
		setLocalFirstrequest(!localFirstrequest)
	}

	const setTriggerTextInformationWrapper = (value) => {
		if (selectedTrigger.parameters === null) {
			selectedTrigger.parameters = []
		} 

		workflow.triggers[selectedTriggerIndex].parameters[0] = {"value": value, "name": "alertinfo"}
		setWorkflow(workflow)
	}

	const setTriggerBodyWrapper = (value) => {
		if (selectedTrigger.parameters === null) {
			selectedTrigger.parameters = []
			workflow.triggers[selectedTriggerIndex].parameters[0] = {"value": value, "name": "cron"}
		} 

		workflow.triggers[selectedTriggerIndex].parameters[1] = {"value": value, "name": "execution_argument"}
		setWorkflow(workflow)
	}

	const AppConditionHandler = (props) => {
  	const { tmpdata, type } = props
		const [data, ] = useState(tmpdata)
		const [multiline, setMultiline] = useState(false)
		const [showAutocomplete, setShowAutocomplete] = React.useState(false)
		const [actionlist, setActionlist] = React.useState([])

		if (tmpdata === undefined) {
			return tmpdata
		}

		if (data.variant === "") {
			data.variant = "STATIC_VALUE"
		}


		// Set actions based on NEXT node, since it should be able to involve those two
		console.log("IN APPACTIONARG: ", selectedEdge)
		if (actionlist.length === 0) {
				// FIXME: Have previous execution values in here
				actionlist.push({"type": "Execution Argument", "name": "Execution Argument", "value": "$exec", "highlight": "exec", "autocomplete": "exec", "example": "hello"})

				if (workflow.workflow_variables !== null && workflow.workflow_variables !== undefined && workflow.workflow_variables.length > 0) {
					for (var key in workflow.workflow_variables) {
						const item = workflow.workflow_variables[key]
						actionlist.push({"type": "workflow_variable", "name": item.name, "value": item.value, "id": item.id, "autocomplete": `${item.name.split(" ").join("_")}`, "example": item.value})
					}
				}

				// FIXME: Add values from previous executions if they exist
				if (workflow.execution_variables !== null && workflow.execution_variables !== undefined && workflow.execution_variables.length > 0) {
					for (var key in workflow.execution_variables) {
						const item = workflow.execution_variables[key]
						actionlist.push({"type": "execution_variable", "name": item.name, "value": item.value, "id": item.id, "autocomplete": `${item.name.split(" ").join("_")}`, "example": ""})
					}
				}

				const destAction = cy.getElementById(selectedEdge.target)
				console.log(destAction.data())
				var parents = getParents(destAction.data())
				if (parents.length > 1) {
					for (var key in parents) {
						const item = parents[key]
						if (item.label === "Execution Argument") {
							continue
						}

						// 1. Take 
						const actionvalue = {"type": "action", "id": item.id, "name": item.label, "autocomplete": `${item.label.split(" ").join("_")}`, "example": item.example === undefined ? "" : item.example}
						actionlist.push(actionvalue)
					}
				}

				setActionlist(actionlist)
		}

		var staticcolor = "inherit"
		var actioncolor = "inherit"
		var varcolor = "inherit"
		if (data.multiline !== undefined && data.multiline !== null && data.multiline === true) {
			setMultiline(true)
		}

		var placeholder = "Static value"
		if (data.example !== undefined && data.example !== null && data.example.length > 0) {
			placeholder = data.example
		}

		var datafield = 
			<TextField
				style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
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
				multiline={multiline}
				rows={5}
				color="primary"
				defaultValue={data.value}
				placeholder={placeholder}
				onClick={() => {
					console.log("CHANGE FIELD")
				}}
				onBlur={(e) => {
					changeActionVariable(data.action_field, e.target.value)
				}}
			/>

		const changeActionVariable = (variable, value) => {
			// set the name
			data.value = value
			data.action_field = variable 

			//setConditionValue({})

			if (type === "source") {
				setSourceValue(data)
				//setDestinationValue(destinationValue)
			} else if (type === "destination") {
				setDestinationValue(data)
				//setSourceValue(sourceValue)
			}
		}

		const changeActionParameterVariant = (variant) => {
			if (data.variant === variant) {
				return
			}

			data.variant = variant 
			data.value = "" 

			if (variant === "ACTION_RESULT") {
				console.log("SHOULD FIND PARENTS OF EDGE")

				// Uses the target's parents, as the target should be executing the checks (I think) 
				var parents = getParents(workflow.actions.find(a => a.id === selectedEdge["target"]))
				if (parents.length > 0) {
					data.action_field = parents[0].label
				} else {
					data.action_field = ""
				}
			} else if (variant === "WORKFLOW_VARIABLE") {
				if (workflow.workflow_variables !== null && workflow.workflow_variables !== undefined && workflow.workflow_variables.length > 0) {
					data.action_field = workflow.workflow_variables[0].name
				}
			}

			setSourceValue({})
			setConditionValue({})
			setDestinationValue({})

			if (type === "source") {
				setSourceValue(data)
				setDestinationValue(destinationValue)
			} else if (type === "destination") {
				setDestinationValue(data)
				setSourceValue(sourceValue)
			}
		}

		return (
			<div>
				<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
					<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
					<div style={{flex: "10"}}> 
						<b>{data.name} </b> 
					</div>
				</div>	
				{datafield}
				{actionlist.length === 0 ? null : 
					<FormControl fullWidth>
						<InputLabel id="action-autocompleter" style={{marginLeft: 10, color: "white"}}>Autocomplete</InputLabel>
						<Select
							labelId="action-autocompleter"
							SelectDisplayProps={{
								style: {
									marginLeft: 10,
								}
							}}
							onClose={() => {
								setShowAutocomplete(false)

								//if (!selectedActionParameters[count].value[selectedActionParameters[count].value.length-1] === "$") {
								//	setShowDropdown(false)
								//}

								setUpdate(Math.random())
							}}
							onClick={() => {
								setShowAutocomplete(true)
							}}
							open={showAutocomplete}
							fullWidth
							style={{borderBottom: `1px solid #f85a3e`, color: "white", height: 50, marginTop: 2,}}
							onChange={(e) => {
								const autocomplete = e.target.value.autocomplete
								const newValue = autocomplete.startsWith("$") ? data.value+autocomplete : `${data.value}$${autocomplete}`

								changeActionVariable(data.action_field, newValue)
							}}
							>
							{actionlist.map(data => {
								const icon = data.type === "action" ? <AppsIcon style={{marginRight: 10}} /> : data.type === "workflow_variable" || data.type === "execution_variable" ? <FavoriteBorderIcon style={{marginRight: 10}} /> : <ScheduleIcon style={{marginRight: 10}} /> 

								const handleExecArgumentHover = (inside) => {
									var exec_text_field = document.getElementById("execution_argument_input_field")
									if (exec_text_field !== null) {
										if (inside) {
											exec_text_field.style.border = "2px solid #f85a3e"
										} else {
											exec_text_field.style.border = ""
										}
									}

									// Also doing arguments
									if (workflow.triggers !== undefined && workflow.triggers !== null && workflow.triggers.length > 0) {
										for (var key in workflow.triggers) {
											const item = workflow.triggers[key]

											var node = cy.getElementById(item.id)
											if (node.length > 0) {
												if (inside) {
													node.addClass('shuffle-hover-highlight')
												} else {
													node.removeClass('shuffle-hover-highlight')
												}
											}

										}
									}
								}

								const handleActionHover = (inside, actionId) => {
									var node = cy.getElementById(actionId)
									if (node.length > 0) {
										if (inside) {
											node.addClass('shuffle-hover-highlight')
										} else {
											node.removeClass('shuffle-hover-highlight')
										}
									}
								}

								return (
									<MenuItem key={data.name} style={{backgroundColor: inputColor, color: "white"}} value={data} onMouseOver={() => {
										if (data.type === "Execution Argument") {
											handleExecArgumentHover(true)
										} else if (data.type === "action") {
											handleActionHover(true, data.id)
										}
									}} onMouseOut={() => {
										if (data.type === "Execution Argument") {
											handleExecArgumentHover(false)
										} else if (data.type === "action") {
											handleActionHover(false, data.id)
										}
									}}>
										<Tooltip color="primary" title={`Value: ${data.value}`} placement="left">
											<div style={{display: "flex"}}>
												{icon} {data.name}
											</div>
										</Tooltip>
									</MenuItem>
								)
							})}
						</Select>
					</FormControl>
				}
			</div>
		)
	}


	const menuItemStyle = {
		color: "white",
		backgroundColor: inputColor
	}

	const conditionsModal = 
		<Dialog modal 
			open={conditionsModalOpen} 
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 800,
				},
			}}
			onClose={() => {
				setConditionsModalOpen(false)
				setSourceValue({})
				setConditionValue({})
				setDestinationValue({})
			}}
		>
		<FormControl>
			<DialogTitle><div style={{color:"white"}}>Condition</div></DialogTitle>
				<DialogContent style={{display: "flex"}}>
					<Tooltip color="primary" title={conditionValue.configuration ? "Negated" : "Default"} placement="top">
						<Button color="primary" variant={conditionValue.configuration ? "contained" : "outlined"} style={{margin: "auto", height: 50, marginBottom: "auto", marginTop: "auto", marginRight: 5}} onClick={(e) => {
							conditionValue.configuration = !conditionValue.configuration
							setConditionValue(conditionValue)
							setUpdate(Math.random())
						}}>
							{conditionValue.configuration ? "!" : "="}
						</Button>
					</Tooltip>
					<div style={{flex: "2"}}>
						<AppConditionHandler tmpdata={sourceValue} setData={setSourceValue} type={"source"} />
					</div>
					<div style={{flex: "1", margin: "auto", marginBottom: 0, marginLeft: 5, marginRight: 5,}}>
					  <Button color="primary" variant="outlined" style={{margin: "auto", height: 50, marginBottom: 50,}} fullWidth aria-haspopup="true" onClick={(e) => {setVariableAnchorEl(e.currentTarget)}}>
							{conditionValue.value}	
						</Button>
						<Menu
						  id="simple-menu"
						  keepMounted
						  open={Boolean(variableAnchorEl)}
						  anchorEl={variableAnchorEl}
						  PaperProps={{
							style: {
								backgroundColor: surfaceColor,
							}
						  }}

						  onClose={() => {
							  setVariableAnchorEl(null)
						  }}
						>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "equals"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"equals"}>equals</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "does not equal"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"does not equal"}>does not equal</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "startswith"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"starts with"}>starts with</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "endswith"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"ends with"}>ends with</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "endswith"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"ends with"}>ends with</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "contains"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"contains"}>contains</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "matches regex"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"matches regex"}>matches regex</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "larger than"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"larger than"}>larger than</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "less than"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"less than"}>less than</MenuItem>
						</Menu>
					</div>	
					<div style={{flex: "2"}}>
						<AppConditionHandler tmpdata={destinationValue} setData={setDestinationValue} type={"destination"} />
					</div>
				</DialogContent>
				<DialogActions>
	      <Button 
					style={{borderRadius: "0px"}}
					onClick={() => {
						setSelectedEdge({})

						var data = {
							condition: conditionValue,
							source: sourceValue,
							destination: destinationValue,
						}
						
						setConditionsModalOpen(false)
						if (selectedEdge.conditions === undefined) {
							selectedEdge.conditions = [data]
						} else {
							const curedgeindex = selectedEdge.conditions.findIndex(data => data.source.id === sourceValue.id)
							if (curedgeindex < 0) {
								selectedEdge.conditions.push(data)
							} else {
								selectedEdge.conditions[curedgeindex] = data
							}
						}

						setSelectedEdge(selectedEdge)
						workflow.branches[selectedEdgeIndex] = selectedEdge
						setWorkflow(workflow)
					}} color="primary">
	        	    	Submit	
	        	  	</Button>
				</DialogActions>
			</FormControl>
		</Dialog>

	const EdgeSidebar = () => {
		const ConditionHandler = (condition, index) => {
			const [open, setOpen] = React.useState(false)
			const [anchorEl, setAnchorEl] = React.useState(null)

			const deleteCondition = (conditionIndex) => {
				console.log(selectedEdge)
				if (selectedEdge.conditions.length === 1) {
					selectedEdge.conditions = []
				} else {
					selectedEdge.conditions.splice(conditionIndex, 1) 
				}

				setSelectedEdge(selectedEdge)
				setOpen(false)
				setUpdate(Math.random())
			}

			const paperVariableStyle = {
				minHeight: 75,
				maxHeight: 75,
				minWidth: "100%",
				maxWidth: "100%",
				marginTop: "5px",
				color: "white",
				backgroundColor: surfaceColor,
				cursor: "pointer",
				display: "flex",
			}

			const menuClick = (event) => {
				console.log("MENU CLICK")
				setOpen(!open)
				setAnchorEl(event.currentTarget)
			}

			return (
				<Paper square style={paperVariableStyle} onClick={() => {}}>
					<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: "2px", backgroundColor: "orange", marginRight: "5px"}} />
					<div style={{display: "flex", width: "100%"}}>
						<div style={{flex: "10", display: "flex"}} onClick={() => {
								setSourceValue(condition.source)
								setConditionValue(condition.condition)
								setDestinationValue(condition.destination)
								setConditionsModalOpen(true)
							}}>
							<div style={{flex: 1, textAlign: "left", marginTop: "15px", marginLeft: "10px", overflow: "hidden"}}>
								{condition.source.value} 
							</div>
							<Divider style={{height: "100%", width: "1px", marginLeft: "5px", marginRight: "5px", backgroundColor: "rgb(91, 96, 100)"}}/>
							<div style={{flex: 1, textAlign: "center", marginTop: "15px", overflow: "hidden"}} onClick={() => {}}>
								{condition.condition.value}
							</div>
							<Divider style={{height: "100%", width: "1px", marginLeft: "5px", marginRight: "5px", backgroundColor: "rgb(91, 96, 100)"}}/>
							<div style={{flex: 1, textAlign: "left", marginTop: "auto", marginBottom: "auto", marginLeft: "10px", overflow: "hidden"}}>
								{condition.destination.value} 
							</div>
						</div>
						<div style={{flex: "1", marginLeft: "0px"}}>
							<IconButton
								aria-label="more"
								aria-controls="long-menu"
								aria-haspopup="true"
								onClick={menuClick}
								style={{color: "white",}}
							  >
								<MoreVertIcon />
							</IconButton>
							<Menu
							  id="long-menu"
							  anchorEl={anchorEl}
							  keepMounted
							  open={open}
							  PaperProps={{
							  	style: {
							  		backgroundColor: surfaceColor,
							  	}
							  }}
							  onClose={() => {
								  setOpen(false)
								  setAnchorEl(null)
							  }}
							>
							<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
								setOpen(false)
								deleteCondition(index)
							}} key={"Delete"}>{"Delete"}</MenuItem>
							</Menu>
						</div>
					</div>
				</Paper>
			)
		}

		var injectedData = 
			<div>
			</div>

		if (selectedEdge.conditions !== undefined && selectedEdge.conditions !== null && selectedEdge.conditions.length > 0) {
			injectedData = selectedEdge.conditions.map((condition, index) => {
				return ConditionHandler(condition, index)
			})
		}

		// FIXME - remove index
		const conditionId = uuid.v4()
		return(
			<div style={appApiViewStyle}>
				<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
					<div style={{flex: "1"}}>
						<h3 style={{marginBottom: "5px"}} >Branch: Conditions - {selectedEdgeIndex}</h3>
						<a href="https://shuffler.io/docs/conditions" style={{textDecoration: "none", color: "#f85a3e"}}>What are conditions?</a>
					</div>
				</div>
				<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
				<div>
					Conditions	
				</div>
				{injectedData}	
				
				<Button style={{margin: "auto", marginTop: "10px",}} color="primary" variant="outlined" onClick={() => {
					setSourceValue({"name": "source", "value": "", "variant": "STATIC_VALUE", "action_field": "", "id": conditionId})
					setConditionValue({"name": "condition", "value": "equals", "id": conditionId})
					setDestinationValue({"name": "destination", "value": "", "variant": "STATIC_VALUE", "action_field": "", "id": conditionId})
					setConditionsModalOpen(true)
				}} fullWidth>New condition</Button> 				
			</div> 
		)
	}

	// 1. GET the trigger authentication data
	// 2. Parse the fields that are used (outlook & gmail)
	// 3. Parse the folders that are selected
	// 4. Start / stop
	const EmailSidebar = () => {
		if (Object.getOwnPropertyNames(selectedTrigger).length === 0) {
			return null
		}

		if (workflow.triggers[selectedTriggerIndex] === undefined) {
			return null
		}

		if (workflow.triggers[selectedTriggerIndex].parameters === undefined || workflow.triggers[selectedTriggerIndex].parameters === null || workflow.triggers[selectedTriggerIndex].parameters.length === 0) {
			workflow.triggers[selectedTriggerIndex].parameters = [{"value": "No folders selected yet", "name": "outlookfolder"}]
			selectedTrigger.parameters = [{"value": "No folders selected yet", "name": "outlookfolder"}]
			setWorkflow(workflow)
			setSelectedTrigger(selectedTrigger)
		} 

		const setFolders = () => {
			fetch(globalUrl+"/functions/outlook/getFolders?trigger_id="+selectedTrigger.id, {
				method: "GET",
				headers: {"content-type": "application/json"},
				credentials: "include",
			})
			.then((response) => {
				if (response.status !== 200) {
					throw new Error("No folders :o!")
				}

				return response.json()
			})
			.then((responseJson) => {
				setTriggerFolders(responseJson)
				if (workflow.triggers[selectedTriggerIndex].parameters.length === 0 && responseJson.length > 0) {
					workflow.triggers[selectedTriggerIndex].parameters = [{"value": responseJson[0].displayName, "name": "outlookfolder", "id": responseJson[0].id}]
					selectedTrigger.parameters = [{"value": responseJson[0].displayName, "name": "outlookfolder", "id": responseJson[0].id}]
					setWorkflow(workflow)
					setSelectedTrigger(selectedTrigger)
				}
			})
			.catch(error => {
				console.log(error.toString())
			})
		}

		const getTriggerAuth = () => {
			fetch(globalUrl+"/api/v1/triggers/"+selectedTrigger.id, {
				method: "GET",
				headers: {"content-type": "application/json"},
				credentials: "include",
			})
			.then((response) => {
				if (response.status !== 200) {
					throw new Error("No trigger info :o!")
				}

				return response.json()
			})
			.then((responseJson) => {
				setTriggerAuthentication(responseJson)	
			})
			.catch(error => {
				console.log(error.toString())
			})
		}

		// Getting the triggers and the folders if they exist
		// This is horrible hahah
		if (localFirstrequest) {
			getTriggerAuth()
			setFolders()	
			setLocalFirstrequest(false)
		}

		const outlookButton = 
			<Button variant="contained" style={{flex: "1",}} onClick={() => {
				// When window closes, it should get all the folders for the user from backend
				const redirectUri = "http%3A%2F%2Fshuffler.io"
				const url = "https://login.microsoftonline.com/common/oauth2/authorize?client_id=70e37005-c954-4290-b573-d4b94e484336&redirect_uri="+redirectUri+"%2Ffunctions%2Foutlook%2Fregister&resource=https%3A%2F%2Fgraph.microsoft.com&response_type=code&scope=Mail.Read+User.Read+https%3A%2F%2Foutlook.office.com%2Fmail.read&state=workflow_id%3D"+props.match.params.key+"%26trigger_id%3D"+selectedTrigger.id+"%26username%3Drheyix.yt@gmail.com%26type%3Doutlook"

				var newwin = window.open(url, "", "width=200,height=100")
				var data = {}

				// Check whether we got a callback somewhere
				var id = setInterval(function () {
					fetch(globalUrl+"/api/v1/triggers/"+selectedTrigger.id, {
						method: "GET",
						headers: {"content-type": "application/json"},
						credentials: "include",
					})
					.then((response) => {
						if (response.status !== 200) {
							throw new Error("No trigger info :o!")
						}

						return response.json()
					})
					.then((responseJson) => {
						setTriggerAuthentication(responseJson)	
						clearInterval(id)
						newwin.close()
						setFolders()
					})
					.catch(error => {
						console.log(error.toString())
					})
				}, 2500)

				console.log(data)
				saveWorkflow(workflow)
			}} color="primary">
				Outlook
			</Button>


		// FIXME - set everything in here to multifolder etc
		var triggerInfo = "SET UP BUT NO TYPE :)"
		if (Object.getOwnPropertyNames(triggerAuthentication).length > 0) {
			// Should get the folders if they don't already exist

			if (triggerAuthentication.type === "outlook") {
				triggerInfo = <div>
						<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
							<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
							<div style={{flex: "10"}}> 
								<b>Login: </b> 
							</div>
						</div>
						{outlookButton}

						<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
							<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
							<div style={{flex: "10"}}> 
								<b>Folders: </b>(hold CTRL to select multiple)
							</div>
						</div>
						<Select
							multiple
							native
							rows="10"
							value={selectedTrigger.parameters[0].value.split(splitter)}
							style={{backgroundColor: inputColor, color: "white"}}
							SelectDisplayProps={{
								style: {
									marginLeft: 10,
								}
							}}
							onChange={(e) => {
								//setTriggerFolderWrapper(e)
								setTriggerFolderWrapperMulti(e)
							}}
							fullWidth
							input={<Input id="select-multiple-native" />}
							key={selectedTrigger}
						>
						{triggerFolders.map(folder => {
							var folderItem = <option key={folder.displayName} value={folder.displayName} style={{marginLeft: "10px", fontSize: "1.2em"}}>
								{folder.displayName}
							</option>
							if (folder.childFolderCount > 0) {
								// Here to handle subfolders sometime later	
								folderItem = 
								<option key={folder.displayName} value={folder.displayName} style={{marginLeft: "10px", fontSize: "1.2em"}}>
									{folder.displayName}
								</option>
							}

							return folderItem
						})}
						</Select>
					</div>
			} else if (triggerAuthentication.type === "gmail") {
				triggerInfo = "SPECIAL GMAIL"
			}
		}

		
		// Check
		const argumentView = Object.getOwnPropertyNames(triggerAuthentication).length > 0 ?
			<div>
				{triggerInfo}
			</div>
			: 
			<div>
				<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
					<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
					<div style={{flex: "10"}}> 
						<b>Login to either: </b> 
					</div>
				</div>
				{outlookButton}	
				<Button variant="contained" style={{marginLeft: "5px", flex: "1",}} onClick={() => {
					alert.error("REMOVE THIS FIELD FOR GMAIL - make it oAuth something")
				}} color="primary">
					Gmail	
				</Button>
			</div>
		
		return(
			<div style={appApiViewStyle}>
				<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
					<div style={{flex: "1"}}>
						<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}: {selectedTrigger.status}</h3>
						<a href="https://shuffler.io/docs/triggers#email" style={{textDecoration: "none", color: "#f85a3e"}}>What are email triggers?</a>
					</div>
				</div>
				<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
				<div>
					Name
				</div>
				<TextField
					style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
					InputProps={{
						style:{
							color: "white",
							marginLeft: "5px",
							maxWidth: "95%",
							height: "50px", 
							fontSize: "1em",
						},
					}}
					fullWidth
					color="primary"
					placeholder={selectedTrigger.label}
					onChange={selectedTriggerChange}
				/>

				<div style={{marginTop: "20px"}}>
					Environment:
					<TextField
						style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: "50px", 
								fontSize: "1em",
							},
						}}
						required
						disabled
						fullWidth
						color="primary"
						value={selectedTrigger.environment}
					/>
				</div>
				<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
				{argumentView}
				<div style={{flex: "6", marginTop: "20px"}}>
					<div>
						<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
						<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
							<Button style={{flex: "1",}} disabled={selectedTrigger.status === "running"} onClick={() => {
								startMailSub(selectedTrigger, selectedTriggerIndex)
							}} color="primary">
								Start	
							</Button>
							<Button style={{flex: "1",}} disabled={selectedTrigger.status !== "running" } onClick={() => {
								stopMailSub(selectedTrigger, selectedTriggerIndex)
							}} color="primary">
								Stop	
							</Button>
						</div>
					</div>
				</div>
			</div> 
		)
	}

	const WebhookSidebar = () => {
		if (Object.getOwnPropertyNames(selectedTrigger).length > 0) {
			if (workflow.triggers[selectedTriggerIndex] === undefined) {
				return null
			}

			if (workflow.triggers[selectedTriggerIndex].parameters === undefined || workflow.triggers[selectedTriggerIndex].parameters === null || workflow.triggers[selectedTriggerIndex].parameters.length === 0) {
				workflow.triggers[selectedTriggerIndex].parameters = []
				workflow.triggers[selectedTriggerIndex].parameters[0] = {"name": "url", "value": referenceUrl+"webhook_"+selectedTrigger.id}
				workflow.triggers[selectedTriggerIndex].parameters[1] = {"name": "tmp", "value": "webhook_"+selectedTrigger.id}
				setWorkflow(workflow)
			}
			//const cronValue = "*/15 * * * *"

			return(
				<div style={appApiViewStyle}>
					<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
						<div style={{flex: "1"}}>
							<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}: {selectedTrigger.status}</h3>
							<a href="https://shuffler.io/docs/triggers#webhook" style={{textDecoration: "none", color: "#f85a3e"}}>What are webhooks?</a>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div>
						Name
					</div>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: "50px", 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={selectedTrigger.label}
						onChange={selectedTriggerChange}
					/>
						<div style={{marginTop: "20px"}}>
							<Typography>
								Environment
							</Typography>
							<Select
								value={selectedTrigger.environment}
								disabled={selectedTrigger.status === "running"}
								SelectDisplayProps={{
									style: {
										marginLeft: 10,

									}
								}}
								fullWidth
								onChange={(e) => {
									selectedTrigger.environment = e.target.value
									setSelectedTrigger(selectedTrigger)
									if (e.target.value === "cloud") {
										var tmpvalue = workflow.triggers[selectedTriggerIndex].parameters[0].value.split("/")
										const urlpath = tmpvalue.slice(3, tmpvalue.length)
										const newurl = "https://shuffler.io/"+urlpath.join("/")
										workflow.triggers[selectedTriggerIndex].parameters[0].value = newurl
									} else {
										var tmpvalue = workflow.triggers[selectedTriggerIndex].parameters[0].value.split("/")
										const urlpath = tmpvalue.slice(3, tmpvalue.length)
										const newurl = window.location.origin+"/"+urlpath.join("/")
										workflow.triggers[selectedTriggerIndex].parameters[0].value = newurl
									}

									setWorkflow(workflow)
									setUpdate(Math.random())
								}}
								style={{backgroundColor: inputColor, color: "white", height: "50px"}}
							>
								{triggerEnvironments.map(data => {
									if (data.archived) {
										return null
									}
									
									return (
										<MenuItem key={data} style={{backgroundColor: inputColor, color: "white"}} value={data}>
											{data}
										</MenuItem>
									)
								})}
							</Select>
						</div>
					<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div style={{flex: "6", marginTop: "20px"}}>
						<div>
							<b>Arguments</b>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Webhook URI: </b> 
								</div>
							</div>
							<TextField
								style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
								onClick={() => {
									//alert.info("Saved URI to clipboard")
									console.log("Copy to clipboooooard")
								}}
								InputProps={{
									style:{
										color: "white",
										height: "50px", 
										marginLeft: "5px",
										maxWidth: "95%",
										fontSize: "1em",
									},
								}}
								fullWidth
								disabled
								defaultValue={workflow.triggers[selectedTriggerIndex].parameters[0].value}
								color="primary"
								placeholder="defaultValue"
								onBlur={(e) => {
									setTriggerCronWrapper(e.target.value)
								}}
							/>
							<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<Button variant="contained" style={{flex: "1",}} disabled={selectedTrigger.status === "running"} onClick={() => {
									newWebhook(selectedTrigger)
								}} color="primary">
	    		    	    		Start	
	    		    	  		</Button>
								<Button variant="contained" style={{flex: "1",}} disabled={selectedTrigger.status !== "running"} onClick={() => {
									deleteWebhook(selectedTrigger, selectedTriggerIndex)
								}} color="primary">
	    		    	    		Stop	
	    		    	  		</Button>
							</div>
						</div>
					</div>
				</div> 
			)
		}

		return null 
	}
	
	//const getTriggerAuth = (trigger_id) => {
	//	fetch(globalUrl+"/api/v1/triggers/"+trigger_id, {
	//		method: "GET",
	//		headers: {"content-type": "application/json"},
	//  		credentials: "include",
    //	})
	//	.then((response) => response.json())
    //	.then((responseJson) => {
	//		if (responseJson.success) {
	//			console.log("SUCCESS")
	//			console.log(responseJson)
	//		} else {
	//			console.log("FAIL")
	//		}
	//	})
	//	.catch(error => {
    //		console.log(error.toString())
	//	});
	//}

	const stopMailSub = (trigger, triggerindex) => {
		// DELETE		
		if (trigger.id === undefined) {
			return
		}
		alert.info("Stopping trigger")

		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key+"/outlook/"+trigger.id, {
    	  	method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				throw new Error("Status not 200 for stream results :O!")
			}

			return response.json()
		})
    	.then((responseJson) => {
			if (responseJson.success) {
				alert.success("Successfully stopped trigger")
				// Set the status
				workflow.triggers[triggerindex].status = "stopped"
				trigger.status = "stopped"
				setWorkflow(workflow)
				setSelectedTrigger(trigger)
				saveWorkflow(workflow)
			} else {
				alert.error("Failed stopping trigger: "+responseJson.reason)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const startMailSub = (trigger, triggerindex) => {
		var folders = []

		const splitItem = workflow.triggers[selectedTriggerIndex].parameters[0].value.split(splitter)
		for (var key in splitItem) {
			const item = splitItem[key] 
			const curfolder = triggerFolders.find(a => a.displayName === item)	
			if (curfolder === undefined) {
				alert.error("Something went wrong with outlook folder "+item)
				return
			}

			folders.push(curfolder.id)
		}

		alert.info("Creating outlook subscription with name " + trigger.name)
		const data = {
			"name": trigger.name,
			"folders": folders,
			"id": trigger.id,
		}

		fetch(globalUrl+"/api/v1/workflows/"+props.match.params.key+"/outlook", {
    	  	method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(data),
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (!responseJson.success) {
				alert.error("Failed to start outlook: " + responseJson.reason)
			} else {
				alert.success("Successfully started outlook sub")

				workflow.triggers[triggerindex].status = "running"
				trigger.status = "running"
				setWorkflow(workflow)
				setSelectedTrigger(trigger)
				saveWorkflow(workflow)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const newWebhook = (trigger) => {
		const hookname = trigger.label
		if (hookname.length === 0) {
			alert.error("Missing name")
			return
		}
		
		if (trigger.id.length !== 36) {
			alert.error("Missing id")
			return
		}

		// Check the node it's connected to
		var startNode = workflow.start
		const branch = workflow.branches.find(branch => branch.source_id === trigger.id)
		if (branch === undefined && (workflow.start === undefined || workflow.start === null || workflow.start.length === 0)) {
			alert.error("No webhook node defined")	
		}

		alert.info("Starting webhook")
		if (branch !== undefined) {
			startNode = branch.destination_id
		}

		const data = {
			"name": hookname, 
			"type": "webhook", 
			"id": trigger.id, 
			"workflow": workflow.id,
			"start": startNode,
			"environment": trigger.environment,
		}

		fetch(globalUrl+"/api/v1/hooks/new", {
			method: "POST",
			headers: {"content-type": "application/json"},
			body: JSON.stringify(data),
	  		credentials: "include",
    	})
		.then((response) => response.json())
    	.then((responseJson) => {
			if (responseJson.success) {
				// Set the status
				alert.success("Successfully started webhook")
				trigger.status = "running"
				setSelectedTrigger(trigger)
				workflow.triggers[selectedTriggerIndex].status = "running"
				setWorkflow(workflow)
				saveWorkflow(workflow)
			} else {
				alert.error("Failed starting webhook: "+responseJson.reason)
			}
    	})
		.catch(error => {
    		console.log(error.toString())
		})
	}

	const deleteWebhook = (trigger, triggerindex) => {
		if (trigger.id === undefined) {
			return
		}
		alert.info("Stopping webhook")

		fetch(globalUrl+"/api/v1/hooks/"+trigger.id+"/delete", {
    	  method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			workflow.triggers[triggerindex].status = "stopped"
			trigger.status = "stopped"
			setWorkflow(workflow)
			setSelectedTrigger(trigger)

			if (responseJson.success) {
				//alert.success("Successfully stopped webhook")
				// Set the status
				saveWorkflow(workflow)
			} else {
				alert.error("Failed stopping webhook: "+responseJson.reason)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const UserinputSidebar = () => {
		if (Object.getOwnPropertyNames(selectedTrigger).length > 0 && workflow.triggers[selectedTriggerIndex] !== undefined) {
			console.log(workflow.triggers[selectedTriggerIndex])
			console.log(selectedTrigger)
			if (workflow.triggers[selectedTriggerIndex].parameters === undefined || workflow.triggers[selectedTriggerIndex].parameters === null || workflow.triggers[selectedTriggerIndex].parameters.length === 0) {
				workflow.triggers[selectedTriggerIndex].parameters = []
				workflow.triggers[selectedTriggerIndex].parameters[0] = {"name": "alertinfo", "value": "hello this is an alert"}

				// boolean, 
				workflow.triggers[selectedTriggerIndex].parameters[1] = {"name": "options", "value": "boolean"}

				// email,sms,app ...
				workflow.triggers[selectedTriggerIndex].parameters[2] = {"name": "type", "value": "email"}

				workflow.triggers[selectedTriggerIndex].parameters[3] = {"name": "email", "value": "test@test.com"}
				workflow.triggers[selectedTriggerIndex].parameters[4] = {"name": "sms", "value": "0000000"}
				setWorkflow(workflow)
			}

			return(
				<div style={appApiViewStyle}>
					<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
						<div style={{flex: "1"}}>
							<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}: {selectedTrigger.status}</h3>
							<a href="https://shuffler.io/docs/triggers#user_input" style={{textDecoration: "none", color: "#f85a3e"}}>What is the user input trigger?</a>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div>
						Name
					</div>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: "50px", 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={selectedTrigger.label}
						onChange={selectedTriggerChange}
					/>

					<div style={{marginTop: "20px"}}>
						Environment:
						<TextField
							style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
							InputProps={{
								style:{
									color: "white",
									marginLeft: "5px",
									maxWidth: "95%",
									height: "50px", 
									fontSize: "1em",
								},
							}}
							required
							disabled
							fullWidth
							color="primary"
							value={selectedTrigger.environment}
						/>
					</div>
					<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div style={{flex: "6", marginTop: "20px"}}>
						<b>Arguments</b>
						<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
							<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
							<div style={{flex: "10"}}> 
								<b>Information: </b> 
							</div>
						</div>
						<TextField
							style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
							InputProps={{
								style:{
									color: "white",
									marginLeft: "5px",
									maxWidth: "95%",
									marginTop: "3px",
									fontSize: "1em",
								},
							}}
							fullWidth
							rows="4"
							multiline
							defaultValue={workflow.triggers[selectedTriggerIndex].parameters[0].value}
							color="primary"
							placeholder="defaultValue"
							onBlur={(e) => {
								setTriggerTextInformationWrapper(e.target.value)
							}}
						/>
						<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
							<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
							<div style={{flex: "10"}}> 
								<b>Contact options: </b> 
							</div>
						</div>
						<FormGroup style={{paddingLeft: 10, backgroundColor: inputColor}} row>
							<FormControlLabel
								control={
									<Checkbox 
										checked={workflow.triggers[selectedTriggerIndex].parameters[2] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("email")} 
										onChange={() => {
											setTriggerOptionsWrapper("email")
										}} 
										color="primary"
										value="email" 
									/>
								}
								label={<div style={{color: "white"}}>Email</div>}
							/>
							<FormControlLabel
								control={
									<Checkbox 
										checked={workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("sms")} 
										onChange={() => {
											setTriggerOptionsWrapper("sms")
										}} 
										color="primary"
										value="sms" 
									/>
								}
								label={<div style={{color: "white"}}>SMS</div>}
							/>
						</FormGroup>
						{workflow.triggers[selectedTriggerIndex].parameters[2] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("email") ?
							<TextField
								style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										marginLeft: "5px",
										maxWidth: "95%",
										height: "50px", 
										fontSize: "1em",
									},
								}}
								fullWidth
								color="primary"
								placeholder={"mail1@company.com,mail2@company.com"}
								defaultValue={workflow.triggers[selectedTriggerIndex].parameters[3].value}
								onBlur={(event) => {
									workflow.triggers[selectedTriggerIndex].parameters[3].value = event.target.value
									setWorkflow(workflow)
									setUpdate(Math.random())
								}}
							/>
							: null
						}
						{workflow.triggers[selectedTriggerIndex].parameters[2] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("sms") ?
							<TextField
								style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										marginLeft: "5px",
										maxWidth: "95%",
										height: "50px", 
										fontSize: "1em",
									},
								}}
								fullWidth
								color="primary"
								placeholder={"+474823212,+460203042"}
								defaultValue={workflow.triggers[selectedTriggerIndex].parameters[4].value}
								onBlur={(event) => {
									workflow.triggers[selectedTriggerIndex].parameters[4].value = event.target.value
									setWorkflow(workflow)
									setUpdate(Math.random())
								}}
							/>
							: null
						}
					</div>
				</div> 
			)
		}

		return null 
	}

	const ScheduleSidebar = () => {
		if (Object.getOwnPropertyNames(selectedTrigger).length > 0 && workflow.triggers[selectedTriggerIndex] !== undefined) {
			if (workflow.triggers[selectedTriggerIndex].parameters === undefined || workflow.triggers[selectedTriggerIndex].parameters === null || workflow.triggers[selectedTriggerIndex].parameters.length === 0) {
				workflow.triggers[selectedTriggerIndex].parameters = []
				workflow.triggers[selectedTriggerIndex].parameters[0] = {"name": "cron", "value": "*/2 * * * *"}
				workflow.triggers[selectedTriggerIndex].parameters[1] = {"name": "execution_argument", "value": '{"example": {"json": "is cool"}}'}
				setWorkflow(workflow)
			}

			return(
				<div style={appApiViewStyle}>
					<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
						<div style={{flex: "1"}}>
							<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}: {selectedTrigger.status}</h3>
							<a href="https://shuffler.io/docs/triggers#schedule" style={{textDecoration: "none", color: "#f85a3e"}}>What are schedules?</a>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div>
						Name
					</div>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: "50px", 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={selectedTrigger.label}
						onChange={selectedTriggerChange}
					/>
					<div style={{marginTop: "20px"}}>
						<Typography>
							Environment
						</Typography>
						<Select
							value={selectedTrigger.environment}
							disabled={selectedTrigger.status === "running"}
							SelectDisplayProps={{
								style: {
									marginLeft: 10,

								}
							}}
							fullWidth
							onChange={(e) => {
								selectedTrigger.environment = e.target.value
								setSelectedTrigger(selectedTrigger)
								if (e.target.value === "cloud") {
									console.log("Set cloud config")
									workflow.triggers[selectedTriggerIndex].parameters[0].value = "*/2 * * * *" 

									//var tmpvalue = workflow.triggers[selectedTriggerIndex].parameters[0].value.split("/")
									//const urlpath = tmpvalue.slice(3, tmpvalue.length)
									//const newurl = "https://shuffler.io/"+urlpath.join("/")
									//workflow.triggers[selectedTriggerIndex].parameters[0].value = newurl
								} else {
									console.log("Set cloud config")
									//var tmpvalue = workflow.triggers[selectedTriggerIndex].parameters[0].value.split("/")
									//const urlpath = tmpvalue.slice(3, tmpvalue.length)
									//const newurl = window.location.origin+"/"+urlpath.join("/")
									workflow.triggers[selectedTriggerIndex].parameters[0].value = "120" 
								}

								setWorkflow(workflow)
								setUpdate(Math.random())
							}}
							style={{backgroundColor: inputColor, color: "white", height: "50px"}}
						>
							{triggerEnvironments.map(data => {
								if (data.archived) {
									return null
								}
								
								return (
									<MenuItem key={data} style={{backgroundColor: inputColor, color: "white"}} value={data}>
										{data}
									</MenuItem>
								)
							})}
						</Select>
					</div>
					<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div style={{flex: "6", marginTop: "20px"}}>
						<div>
							<b>Arguments</b>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Interval (seconds) </b> 
								</div>
							</div>
							<TextField
								style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										height: "50px", 
										marginLeft: "5px",
										maxWidth: "95%",
										fontSize: "1em",
									},
								}}
								fullWidth
								disabled={workflow.triggers[selectedTriggerIndex].status === "running"}
								defaultValue={workflow.triggers[selectedTriggerIndex].parameters[0].value}
								color="primary"
								placeholder="defaultValue"
								onBlur={(e) => {
									setTriggerCronWrapper(e.target.value)
								}}
							/>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Execution argument: </b> 
								</div>
							</div>
							<TextField
								style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										marginLeft: "5px",
										maxWidth: "95%",
										marginTop: "3px",
										fontSize: "1em",
									},
								}}
								disabled={workflow.triggers[selectedTriggerIndex].status === "running"}
								fullWidth
								rows="6"
								multiline
								color="primary"
								defaultValue={workflow.triggers[selectedTriggerIndex].parameters[1].value}
								placeholder='{"example": {"json": "is cool"}}'
								onBlur={(e) => {
									setTriggerBodyWrapper(e.target.value)
								}}
							/>
							<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<Button style={{flex: "1",}} variant="contained" disabled={selectedTrigger.status === "running"} onClick={() => {
									submitSchedule(selectedTrigger, selectedTriggerIndex)
								}} color="primary">
	    		    	    		Start	
	    		    	  		</Button>
								<Button style={{flex: "1",}} variant="contained" disabled={selectedTrigger.status !== "running"} onClick={() => {
									stopSchedule(selectedTrigger, selectedTriggerIndex)
								}} color="primary">
	    		    	    		Stop	
	    		    	  		</Button>
							</div>
						</div>
					</div>
				</div> 
			)
		}

		return null 
	}

	const cytoscapeViewWidths = 750
	const bottomBarStyle = {
		position: "fixed", 
		right: 20, 
		left: leftBarSize,
		bottom: 0, 
		minWidth: cytoscapeViewWidths, 
		maxWidth: cytoscapeViewWidths,
		marginLeft: 20,
		marginBottom: 20,
		zIndex: 10, 
	}

	const topBarStyle= {
		position: "fixed", 
		right: 0, 
		left: leftBarSize,
		top: appBarSize, 
		minWidth: cytoscapeViewWidths, 
		maxWidth: cytoscapeViewWidths,
		marginLeft: 20,
		marginBottom: 20,
	}

	const TopCytoscapeBar = () => {
		return (
			<div style={topBarStyle}>	
				<div style={{margin: 10}}>
					<Breadcrumbs aria-label="breadcrumb" separator="›" style={{color: "white",}}>
						<Link to="/workflows" style={{textDecoration: "none", color: "inherit",}}>
							<h2 style={{color: "rgba(255,255,255,0.5)"}}>
								<PolymerIcon style={{marginRight: 10}} />
								Workflows
							</h2>
						</Link>
						<h2>
							{workflow.name}
						</h2>
					</Breadcrumbs>
				</div>
			</div>
		)
	}

	const NoActionsBar = () => {
		if (workflow.actions.length === 0 || !appAdded) {
			return (
				<div style={{position: "fixed", width: "100%", top: 300}}>
					<div style={{width: 300, margin: "auto"}}>
						<h3></h3>
					</div>
				</div>
			)
		} 

		return null
	}

	const FileMenu = () => {
		const [newAnchor, setNewAnchor] = React.useState(null);
		const [showShuffleMenu, setShowShuffleMenu] = React.useState(false)

		{ /*const [showShuffleMenu, setShowShuffleMenu] = React.useState(true) */}
		return (
			<div style={{"display": "inline-block"}}>
				<Menu
					id="long-menu"
					anchorEl={newAnchor}
					open={showShuffleMenu}
					onClose={() => {
						setShowShuffleMenu(false)
					}}
				>
					<div style={{margin: 15, color: "white", maxWidth: 250, minWidth: 250, }}>
						<h4>This menu is used to control the workflow itself.</h4>
						<Divider style={{backgroundColor: "white", marginTop: 10, marginBottom: 10,}}/>
						<FormControlLabel
							style={{marginBottom: 15, color: "white",}}
							label={<div style={{color: "white"}}>Exit on Error</div>}
							control={
								<Switch checked={workflow.configuration.exit_on_error} onChange={() => {
									workflow.configuration.exit_on_error = !workflow.configuration.exit_on_error
									setWorkflow(workflow)
									setUpdate("exit_on_error_"+workflow.configuration.exit_on_error ? "true" : "false")
									setShowShuffleMenu(false)
								}} />
							}
						/>
						<FormControlLabel
							style={{marginBottom: 15, color: "white",}}
							label={<div style={{color: "white"}}>Start from top</div>}
							control={
								<Switch checked={workflow.configuration.start_from_top} onChange={() => {
									workflow.configuration.start_from_top = !workflow.configuration.start_from_top
									setWorkflow(workflow)
									setUpdate("start_from_top_"+workflow.configuration.start_from_top ? "true" : "false")
									setShowShuffleMenu(false)
								}} />
							}
						/>
					</div>
				</Menu>
				<Tooltip color="secondary" title="Workflow settings" placement="top-start">
					<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={(event) => {
						setShowShuffleMenu(!showShuffleMenu)
						setNewAnchor(event.currentTarget)
					}}>
						<SettingsIcon />
					</Button>
				</Tooltip>
			</div>
		)
	}

	const WorkflowMenu = () => {
		const [newAnchor, setNewAnchor] = React.useState(null);
		const [showShuffleMenu, setShowShuffleMenu] = React.useState(false)

		{ /*const [showShuffleMenu, setShowShuffleMenu] = React.useState(true) */}
		return (
			<div style={{"display": "inline-block"}}>
				<Menu
					id="long-menu"
					anchorEl={newAnchor}
					open={showShuffleMenu}
					onClose={() => {
						setShowShuffleMenu(false)
					}}
				>
					<div style={{margin: 15, color: "white", maxWidth: 250, minWidth: 250, }}>
						<h4>This menu is used to control the workflow itself.</h4>
						<Divider style={{backgroundColor: "white", marginTop: 10, marginBottom: 10,}}/>
						<FormControlLabel
							style={{marginBottom: 15, color: "white",}}
							label={<div style={{color: "white"}}>Exit on Error</div>}
							control={
								<Switch checked={workflow.configuration.exit_on_error} onChange={() => {
									workflow.configuration.exit_on_error = !workflow.configuration.exit_on_error
									setWorkflow(workflow)
									setUpdate("exit_on_error_"+workflow.configuration.exit_on_error ? "true" : "false")
									setShowShuffleMenu(false)
								}} />
							}
						/>
						<FormControlLabel
							style={{marginBottom: 15, color: "white",}}
							label={<div style={{color: "white"}}>Start from top</div>}
							control={
								<Switch checked={workflow.configuration.start_from_top} onChange={() => {
									workflow.configuration.start_from_top = !workflow.configuration.start_from_top
									setWorkflow(workflow)
									setUpdate("start_from_top_"+workflow.configuration.start_from_top ? "true" : "false")
									setShowShuffleMenu(false)
								}} />
							}
						/>
					</div>
				</Menu>
				<Tooltip color="secondary" title="Workflow settings" placement="top-start">
					<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={(event) => {
						setShowShuffleMenu(!showShuffleMenu)
						setNewAnchor(event.currentTarget)
					}}>
						<SettingsIcon />
					</Button>
				</Tooltip>
			</div>
		)
	}

	const BottomCytoscapeBar = () => {
		const [anchorEl, setAnchorEl] = React.useState(null);

		const boxSize = 100
		const executionButton = executionRunning ? 
			<Tooltip color="primary" title="Stop execution" placement="top">
				<Button style={{height: boxSize, width: boxSize}} color="secondary" variant="contained" onClick={() => {
					abortExecution()
				}}>
					<PauseIcon style={{ fontSize: 60}} />
				</Button> 
			</Tooltip>
			:
			<Tooltip color="primary" title="Test execution" placement="top">
				<Button disabled={executionRequestStarted || !workflow.isValid} style={{height: boxSize, width: boxSize}} color="primary" variant="contained" onClick={() => {
					executeWorkflow()
				}}>
					<PlayArrowIcon style={{ fontSize: 60}} />
				</Button> 				
			</Tooltip>

		return(
			<div style={bottomBarStyle}>	
				{executionButton} 
				<div style={{marginLeft: "10px", left: boxSize, bottom: 0, position: "absolute"}}>
					<Tooltip color="primary" title="An argument to be used for execution. This is a variable available to every node in your workflow." placement="top">
						<TextField
							id="execution_argument_input_field"
							style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
							InputProps={{
								style:{
									height: 50,
									color: "white",
									marginLeft: 5,
									maxWidth: "95%",
									fontSize: "1em",
								},
							}}
							color="secondary"
							placeholder={"Execution Argument"}
							defaultValue={executionText}
							onBlur={(e) => {
								setExecutionText(e.target.value)
							}}
						/>
					</Tooltip>
					<Tooltip color="primary" title="Save (ctrl+s)" placement="top">
						<Button color="primary" style={{height: 50, marginLeft: 10, }} variant={lastSaved ? "outlined" : "contained"} onClick={() => saveWorkflow()}>
							<SaveIcon /> 
						</Button> 				
					</Tooltip>
					<Tooltip color="secondary" title="Fit to screen (ctrl+f)" placement="top">
						<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={() => cy.fit(null, 50)}>
							<AspectRatioIcon />  
						</Button> 				
					</Tooltip>
					<Tooltip color="secondary" title="Remove selected item (del)" placement="top-start">
						<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={() => {
							removeNode()		
						}}>
							<DeleteIcon /> 
						</Button>
					</Tooltip>
					<Tooltip color="secondary" title="Show executions" placement="top-start">
						<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={() => {
							setExecutionModalOpen(true)
							getWorkflowExecution(props.match.params.key)
						}}>
							<DirectionsRunIcon />
						</Button>
					</Tooltip>
					{/* <FileMenu />	*/}
					<WorkflowMenu />	
				</div>
			</div>
		)
	}

	const RightSideBar = () => {
		if (!rightSideBarOpen) {
			return null
		}

		if (Object.getOwnPropertyNames(selectedAction).length > 0) {
			//console.time('ACTIONSTART')
			return(
				<div style={rightsidebarStyle}>	
					{appApiView}
				</div>
			)
		} else if (Object.getOwnPropertyNames(selectedTrigger).length > 0) {
			if (selectedTrigger.trigger_type === "SCHEDULE") {
				//console.log("SCHEDULE")
				return(
					<div style={rightsidebarStyle}>	
						<ScheduleSidebar />
					</div>
				)
			} else if (selectedTrigger.trigger_type === "WEBHOOK") {
				return(
					<div style={rightsidebarStyle}>	
						<WebhookSidebar />
					</div>
				)
			} else if (selectedTrigger.trigger_type === "EMAIL") {
				return(
					<div style={rightsidebarStyle}>	
						<EmailSidebar />
					</div>
				)
			} else if (selectedTrigger.trigger_type === "USERINPUT") {
				return(
					<div style={rightsidebarStyle}>	
						<UserinputSidebar />
					</div>
				)
			} else if (selectedTrigger.trigger_type === undefined) {
				return null
			} else {
				console.log("Unable to handle invalid trigger type "+selectedTrigger.trigger_type)
				return null
			}
		} else if (Object.getOwnPropertyNames(selectedEdge).length > 0) {
			return(
				<div style={rightsidebarStyle}>	
					<EdgeSidebar />
				</div>
			)
		}

		return(
			null
		)
	}

	// This can execute a workflow with firestore. Used for test, as datastore is old and stuff
	// Too much work to move everything over alone, so won't touch it for now
	//<Button style={{borderRadius: "0px"}} color="primary" variant="contained" onClick={() => {
	//	executeWorkflowWebsocket()
	//}}>Execute websocket</Button> 				
	//
	
	const leftView = leftViewOpen ? <div style={{minWidth: leftBarSize, maxWidth: leftBarSize, borderRight: "1px solid rgb(91, 96, 100)"}}>	
		<HandleLeftView />
	</div> : 
		<div style={{minWidth: leftBarSize, maxWidth: leftBarSize, borderRight: "1px solid rgb(91, 96, 100)"}}>	
			<div style={{cursor: "pointer", height: 20, marginTop: 10, marginLeft: 10}} onClick={() => {
					setLeftViewOpen(true)
					setLeftBarSize(350)
				}}>
					<Tooltip color="primary" title="Maximize" placement="top">
						<KeyboardArrowRightIcon />
					</Tooltip>
				</div>
		</div>

	const executionPaperStyle = {
		minWidth: "95%",
		maxWidth: "95%",
		marginTop: "5px",
		color: "white",
		marginBottom: 10,
		padding: 5,
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
		minHeight: 40, 
		maxHeight: 40,
	}

	const parsedExecutionArgument = () => {
		var showResult = executionData.execution_argument.trim()
		showResult = showResult.split(" None").join(" \"None\"")
		showResult = showResult.split("\'").join("\"")
		showResult = showResult.split(" False").join(" false")
		showResult = showResult.split(" True").join(" true")

		var jsonvalid = true
		try {
			const tmp = String(JSON.parse(showResult))
			if (!showResult.includes("{") && !showResult.includes("[")) {
				jsonvalid = false
			}
		} catch (e) {
			jsonvalid = false
		}

		if (jsonvalid) {
			return (
				<ReactJson 
						src={JSON.parse(showResult)} 
						theme="solarized" 
						collapsed={true}
						displayDataTypes={false}
						name={"Execution argument"}
					/>
			)
		} 

		return (
			<div>
				<h3>Execution Argument</h3>
				<div style={{maxHeight: 200, overflowY: "scroll",}}>
					{executionData.execution_argument}
				</div>
			</div>
		)
	}


	const getExecutionSourceImage = (execution) => {
		// This is the playbutton at 150x150
		const defaultImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACOCAMAAADkWgEmAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAWlBMVEX4Wj69TDgmKCvkVTwlJyskJiokJikkJSkjJSn4Ykf+6+f5h3L////8xLr5alH/9fT7nYz4Wz/919H5cVn/+vr8qpv4XUL94d35e2X//v38t6v4YUbkVDy8SzcVIzHLAAAAAWJLR0QMgbNRYwAAAAlwSFlzAAARsAAAEbAByCf1VAAAAAd0SU1FB+QGGgsvBZ/GkmwAAAFKSURBVHja7dlrTgMxDEXhFgpTiukL2vLc/zbZQH5N7MmReu4KPmlGN4m9WgGzfhgtaOZxM1rQztNoQDvPowHtTKMB7WxHA2TJkiVLlixIZMmSRYgsWbIIkSVLFiGyZMkiRNZirBcma/eKZEW87ZGsOBxPRFbE+R3Jio/LlciKuH0iWfH1/UNkRSR3RRYruSvyWKldkcjK7IpUVl5X5LLSuiKbldQV6aycrihgZXRFCau/K2pY3V1RxersijJWX1cUsnq6opLV0RW1rNldUc2a2RXlrHldsQBrTlfcLwv5EZm/PLIgkHXKPHyQRzXzYoO8BjIvzcgnBvJBxny+Ih/7zNEIcpDEHLshh5TIkS5zAI5cFzCXK8hVFHNxh1xzQpfC0BV6XWTJkkWILFmyCJElSxYhsmTJIkSWLFmEyJIlixBZsmQB8stk/U3/Yb49pVcDMg4AAAAldEVYdGRhdGU6Y3JlYXRlADIwMjAtMDYtMjZUMTE6NDc6MDUrMDI6MDD8QCPmAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIwLTA2LTI2VDExOjQ3OjA1KzAyOjAwjR2bWgAAAABJRU5ErkJggg=="
		const size = 40
		if (execution.execution_source === undefined || execution.execution_source === null || execution.execution_source.length === 0) {
			return <img alt="default" src={defaultImage} style={{width: size, height: size}} />
		}

		if (execution.execution_source === "webhook") {
			return <img alt={"webhook"} src={triggers.find(trigger => trigger.trigger_type === "WEBHOOK").large_image} style={{width: size, height: size}} />
		}

		if (execution.execution_source === "schedule") {
			return <img alt={"schedule"} src={triggers.find(trigger => trigger.trigger_type === "SCHEDULE").large_image} style={{width: size, height: size}} />
		}

		if (execution.execution_source === "EMAIL") {
			return <img alt={"email"} src={triggers.find(trigger => trigger.trigger_type === "EMAIL").large_image} style={{width: size, height: size}} />
		}


		return (
			<img alt={execution.execution_source} src={defaultImage} style={{width: size, height: size}} />
		)
	}

	const executionModal = 
		<Drawer  anchor={"right"} open={executionModalOpen} onClose={() => setExecutionModalOpen(false)} PaperProps={{style: {minWidth: 375, maxWidth: 375, backgroundColor: "#1F2023", color: "white", fontSize: 18}}}>
			{executionModalView === 0 ?
			<div style={{padding: 25, }}>
				<Breadcrumbs aria-label="breadcrumb" separator="›" style={{color: "white", fontSize: 16}}>
					<h2 style={{color: "rgba(255,255,255,0.5)"}}>
						<DirectionsRunIcon  style={{marginRight: 10}} />
						All Executions	
					</h2>
				</Breadcrumbs>	
				<Button 
					style={{borderRadius: "0px"}}
					onClick={() => {
						getWorkflowExecution(props.match.params.key)
					}} color="primary">
					<CachedIcon style={{marginRight: 10}}/>
					Refresh	executions
				</Button>
				<Divider style={{backgroundColor: "white", marginTop: 10, marginBottom: 10,}}/>
				{workflowExecutions.length > 0 ? 
					<div>
						{workflowExecutions.map(data => {
							const statusColor = data.status === "FINISHED" ? "green" : data.status === "ABORTED" ? "red" : "orange"
							const timeElapsed = data.completed_at-data.started_at
							const resultsLength = data.results !== undefined && data.results !== null ? data.results.length : 0

							const timestamp = new Date(data.started_at*1000).toISOString().split('.')[0].split("T").join(" ")

							return (
								<Paper elevation={5} key={data.execution_id} square style={executionPaperStyle} onMouseOver={() => {}} onMouseOut={() => {}} onClick={() => {
									setExecutionModalView(1)
									setExecutionData(data)
								}}>
									<div style={{display: "flex", flex: 1}}>
										<div style={{marginLeft: 5, width: 2, backgroundColor: statusColor, marginRight: 5}} />
										<div style={{height: "100%", width: 40, borderColor: "white", marginRight: 15}}>
											{getExecutionSourceImage(data)}
										</div>
										<div style={{ marginTop: "auto", marginBottom: "auto", marginRight: 15, fontSize: 13, }}>
											{timestamp}
										</div>
										{data.workflow.actions !== null ? 
											<Tooltip color="primary" title={resultsLength+" actions ran"} placement="top">
												<div style={{marginRight: 10, marginTop: "auto", marginBottom: "auto",}}>
													{resultsLength}/{data.workflow.actions.length}
												</div>
											</Tooltip>
											: null}
									</div>
									<Tooltip title={"Inspect execution"} placement="top">
										<KeyboardArrowRightIcon style={{marginTop: "auto", marginBottom: "auto"}}/>
									</Tooltip>
								</Paper>
							)
							return 
						})}
					</div>
					: 
					<div>
						There are no executions yet
					</div>
				}
			</div>
			:
			<div style={{padding: 25, maxWidth: 365, overflowX: "hidden",}}>
				<Breadcrumbs aria-label="breadcrumb" separator="›" style={{color: "white", fontSize: 16}}>
					<h2 style={{color: "rgba(255,255,255,0.5)", cursor: "pointer"}} onClick={() => {setExecutionModalView(0)}}>
						<ArrowBackIcon style={{marginRight: 7, }} />
						See other Executions	
					</h2>
				</Breadcrumbs>
				<Divider style={{backgroundColor: "white", marginTop: 10, marginBottom: 10,}}/>
					<h2>Executing Workflow</h2>		
					{executionData.status !== undefined && executionData.status.length > 0 ?
						<div>
							<b>Status: </b>{executionData.status} 
						</div>
						: null
					}
					{executionData.started_at !== undefined ?
						<div>
							<b>Started: </b>{new Date(executionData.started_at*1000).toISOString()} 
						</div>
						: null
					}
					{executionData.completed_at !== undefined && executionData.completed_at !== null && executionData.completed_at > 0 ?
						<div>
							<b>Finished: </b>{new Date(executionData.completed_at*1000).toISOString()} 
						</div>
						: null
					}
					{executionData.execution_source !== undefined && executionData.execution_source.length > 0 ?
						<div>
							<b>Source: </b>{executionData.execution_source} 
						</div>
						: null
					}
					{executionData.execution_argument !== undefined && executionData.execution_argument.length > 0 ?
						parsedExecutionArgument()
					: null }
					<Divider style={{backgroundColor: "white", marginTop: 30, marginBottom: 30,}}/>
					{executionData.results !== undefined && executionData.results !== null && executionData.results.length > 1 && executionData.results.find(result => result.status === "SKIPPED" || result.status === "FAILURE") ?
						<FormControlLabel
							style={{color: "white", marginBottom: 10, }}
							label={<div style={{color: "white"}}>Show failed / skipped actions</div>}
							control={
								<Switch checked={showSkippedActions} onChange={() => {setShowSkippedActions(!showSkippedActions)}} />
							}
						/>
						: 
						null
					}
					<div style={{display: "flex", marginTop: 10, marginBottom: 30,}}>

						<b>Actions</b>
						<div>
							{executionData.status !== undefined && executionData.status !== "ABORTED" && executionData.status !== "FINISHED" && executionData.status !== "FAILURE" && executionData.status !== "WAITING" ? <CircularProgress style={{marginLeft: 20}}/> : null}
						</div>
					</div>
					{executionData.results === undefined || executionData.results === null || executionData.results.length === 0 && executionData.status === "EXECUTING" ?
						<CircularProgress />
						:
						executionData.results.map((data, index) => {
							if (executionData.results.length !== 1 && !showSkippedActions && (data.status === "SKIPPED" || data.status === "FAILURE")) {
								return null
							}


							// showResult = replaceAll(showResult, " None", " \"None\"")
							// Super basic check.
							//
							// FIXME: The latter replace doens't really work if ' is used in a string
							var showResult = data.result.trim()
							showResult = showResult.split(" None").join(" \"None\"")
							showResult = showResult.split(" False").join(" false")
							showResult = showResult.split(" True").join(" true")
							showResult = showResult.split("\'").join("\"")

							var jsonvalid = true
							try {
								const tmp = String(JSON.parse(showResult))
								if (!showResult.includes("{") && !showResult.includes("[")) {
									//console.log("IN HERE: ", tmp)
									jsonvalid = false
								}
							} catch (e) {
								//console.log("Error: ", e)
								jsonvalid = false
							}

							const curapp = apps.find(a => a.name === data.action.app_name && a.app_version === data.action.app_version)
							const imgsize = 50
							const statusColor = data.status === "FINISHED" || data.status === "SUCCESS" ? "green" : data.status === "ABORTED" || data.status === "FAILURE" ? "red" : "orange"
							const actionimg = curapp === null ? 
								null :
								<img alt={data.action.app_name} src={curapp === undefined ? "" : curapp.large_image} style={{marginRight: 20, width: imgsize, height: imgsize, border: `2px solid ${statusColor}`}} />

							return (
								<div key={index} style={{marginBottom: 40,}}>
									<div style={{display: "flex", marginBottom: 15,}}>
										{actionimg}
										<div>
											<div style={{fontSize: 24, marginTop: "auto", marginBottom: "auto"}}><b>{data.action.label}</b></div>
											<div style={{fontSize: 14}}>{data.action.name}</div>
										</div>
									</div>
									<div style={{marginBottom: 5}}><b>Status </b> {data.status}</div>
									{jsonvalid ? <ReactJson 
											src={JSON.parse(showResult)} 
											theme="solarized" 
											collapsed={true}
											displayDataTypes={false}
											name={"Results for "+data.action.label}
										/>
									: 
									<div>
										<b>Result</b>&nbsp;
										{data.result}
									</div>
									}
								</div>
							)
						})
					}
				</div>
			}
			</Drawer>
	
	const newView = isLoggedIn ?
		<div style={{color: "white"}}>
			<div style={{display: "flex", borderTop: "1px solid rgba(91, 96, 100, 1)"}}>
				{leftView}
				<CytoscapeComponent 
					elements={elements} 
					minZoom={0.35}
					maxZoom={2.00}
					style={{width: bodyWidth-leftBarSize-15, height: bodyHeight-appBarSize-1, backgroundColor: surfaceColor}} 
					stylesheet={cystyle}
					boxSelectionEnabled={true}
					autounselectify={false}
					cy={(incy) => {
						// FIXME: There's something specific loading when
						// you do the first hover of a node. Why is this different?
						//console.log("CY: ", incy)
						setCy(incy)
					}}
				/>
			</div>
			{executionModal}
			<RightSideBar />
			<BottomCytoscapeBar />
			<TopCytoscapeBar />
		</div> 
		: 
		<div style={{color: "white"}}>
			TMP FOR NOT LOGGED IN 
		</div>

	const executionVariableModal = executionVariablesModalOpen ? 
		<Dialog modal 
			open={executionVariablesModalOpen} 
			onClose={() => {
				setNewVariableName("")
				setExecutionVariablesModalOpen(false)
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
				},
			}}
		>
		<FormControl>
			<DialogTitle><span style={{color: "white"}}>Execution Variable</span></DialogTitle>
				<DialogContent>
					Execution Variables are TEMPORARY variables that you can ony be set and used during execution. Learn more <a href="https://shuffler.io/docs/workflow#execution_variables" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>here</a>
					<TextField
						onBlur={(event) => setNewVariableName(event.target.value)}
						color="primary"
						placeholder="Name"
						style={{marginTop: 25}}
						InputProps={{
							style:{
								color: "white"
							}
						}}
						margin="dense"
						fullWidth
						defaultValue={newVariableName}
					  />
				</DialogContent>
				<DialogActions>
	        <Button 
						style={{borderRadius: "0px"}}
						onClick={() => {
							setNewVariableName("")
							setExecutionVariablesModalOpen(false)
						}} color="primary">
								Cancel
	        </Button>
					<Button style={{borderRadius: "0px"}} disabled={newVariableName.length === 0} onClick={() => {
						console.log("VARIABLES! ", newVariableName)
						if (workflow.execution_variables === undefined || workflow.execution_variables === null) {
							workflow.execution_variables = []
						}

						// try to find one with the same name
						const found = workflow.execution_variables.findIndex(data => data.name === newVariableName)
						//console.log(found)
						if (found !== -1) {
							if (newVariableName.length > 0) {
								workflow.execution_variables[found].name = newVariableName
							} 
						} else {
							workflow.execution_variables.push({
								"name": newVariableName,		
								"description": "An execution variable",		
								"value": "",
								"id": uuid.v4(),
							})
						}

					setExecutionVariablesModalOpen(false)
					setNewVariableName("")
					setWorkflow(workflow)
				}} color="primary">
						Submit	
					</Button>
				</DialogActions>
				{workflowExecutions.length > 0 ? 
					<DialogContent>
						<Divider style={{backgroundColor: "white", marginTop: 15, marginBottom: 15,}}/>
						<b style={{marginBottom: 10}}>Values from last 3 executions</b>
						{workflowExecutions.slice(0,3).map((execution, index) => {
							if (execution.execution_variables === undefined || execution.execution_variables === null || execution.execution_variables === 0) {
								return null
							}

							const variable = execution.execution_variables.find(data => data.name === newVariableName)
							if (variable === undefined || variable.value === undefined) {
								return null
							}

							return (
								<div>
									{index+1}: {variable.value}
								</div>
							)
						})}
					</DialogContent>
				: null
			}
			</FormControl>
		</Dialog>
		: null
	
	const variablesModal = variablesModalOpen ? 
		<Dialog modal 
			open={variablesModalOpen} 
			onClose={() => {
				setNewVariableName("")
				setNewVariableDescription("")
				setNewVariableValue("")
				setVariablesModalOpen(false)
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
				},
			}}
		>
		<FormControl>
			<DialogTitle><span style={{color: "white"}}>Workflow Variable</span></DialogTitle>
				<DialogContent>
					<TextField
						onBlur={(event) => setNewVariableName(event.target.value)}
						color="primary"
						placeholder="Name"
						InputProps={{
							style:{
								color: "white"
							}
						}}
						margin="dense"
						fullWidth
						defaultValue={newVariableName}
					  />
					<TextField
						onBlur={(event) => setNewVariableDescription(event.target.value)}
						color="primary"
						placeholder="Description"
						margin="dense"
						fullWidth
						InputProps={{
							style:{
								color: "white"
							}
						}}
						defaultValue={newVariableDescription}
					  />
					<TextField
						onChange={(event) => setNewVariableValue(event.target.value)}
						rows="6"
						multiline
						color="primary"
						placeholder="Value"
						margin="dense"
						InputProps={{
							style:{
								color: "white"
							}
						}}
						fullWidth
						defaultValue={newVariableValue}
					  />
				</DialogContent>
				<DialogActions>
	        <Button 
					style={{borderRadius: "0px"}}
					onClick={() => {
						setNewVariableName("")
						setNewVariableDescription("")
						setNewVariableValue("")
						setVariablesModalOpen(false)
					}} color="primary">
	        	    	Cancel
	        	  	</Button>
	        	<Button style={{borderRadius: "0px"}} disabled={newVariableName.length === 0 || newVariableValue.length === 0} onClick={() => {
						if (workflow.workflow_variables === undefined || workflow.workflow_variables === null) {
							workflow.workflow_variables = []
						}

						// try to find one with the same name
						const found = workflow.workflow_variables.findIndex(data => data.name === newVariableName)
						//console.log(found)
						if (found !== -1) {
							if (newVariableName.length > 0) {
								workflow.workflow_variables[found].name = newVariableName
							} 
							if (newVariableDescription.length > 0) {
								workflow.workflow_variables[found].description = newVariableDescription
							}
							if (newVariableValue.length > 0) {
								workflow.workflow_variables[found].value = newVariableValue
							}
						} else {
							workflow.workflow_variables.push({
								"name": newVariableName,		
								"description": newVariableDescription,		
								"value": newVariableValue,
								"id": uuid.v4(),
							})
						}

						setWorkflow(workflow)
						setVariablesModalOpen(false)
						setNewVariableName("")
						setNewVariableDescription("")
						setNewVariableValue("")
					}} color="primary">
	        	    	Submit	
	        	  	</Button>
				</DialogActions>
			</FormControl>
		</Dialog>
		: null


	const AuthenticationData = (props) => {
		const selectedApp = props.app

		const [authenticationOption, setAuthenticationOptions] = React.useState({
			app: JSON.parse(JSON.stringify(selectedApp)),
			fields: {},
			label: "",
			usage: [{
				workflow_id: workflow.id,
			}],
			id: uuid.v4(),
			active: true,
		})

		if (selectedApp.authentication === undefined) {
			return null
		}

		if (selectedApp.authentication.parameters === null || selectedApp.authentication.parameters === undefined || selectedApp.authentication.parameters.length === 0) {
			return null
		}

		authenticationOption.app.actions = []

		for (var key in selectedApp.authentication.parameters) {
			if (authenticationOption.fields[selectedApp.authentication.parameters[key].name] === undefined) {
				authenticationOption.fields[selectedApp.authentication.parameters[key].name] = ""
			}
		}

		const handleSubmitCheck = () => {
			console.log("NEW AUTH: ", authenticationOption)
			if (authenticationOption.label.length === 0) {
				alert.info("Label can't be empty")
				return
			}

			for (var key in selectedApp.authentication.parameters) {
				if (authenticationOption.fields[selectedApp.authentication.parameters[key].name].length === 0) {
					alert.info("Field "+selectedApp.authentication.parameters[key].name+" can't be empty")
					return
				} 
			}

			selectedAction.authentication_id = authenticationOption.id
			selectedAction.selectedAuthentication = authenticationOption
			selectedAction.authentication.push(authenticationOption)
			setSelectedAction(selectedAction)

			var newAuthOption = JSON.parse(JSON.stringify(authenticationOption))
			var newFields = []
			for (const key in newAuthOption.fields) {
				const value = newAuthOption.fields[key]
				newFields.push({
					key: key,
					value: value,
				})
			}

			console.log("FIELDS: ", newFields)
			newAuthOption.fields = newFields
			setNewAppAuth(newAuthOption)
			appAuthentication.push(newAuthOption)
			setAppAuthentication(appAuthentication)
			getAppAuthentication() 
			setUpdate(authenticationOption.id)

			/*
				{selectedAction.authentication.map(data => (
				<MenuItem key={data.id} style={{backgroundColor: inputColor, color: "white"}} value={data}>
			*/

		}

		return (
			<div>
				<DialogContent>
					<a href="https://shuffler.io/docs/apps#authentication" style={{textDecoration: "none", color: "#f85a3e"}}>What is this?</a><div/>
					These are required fields for authenticating with {selectedApp.name} 
					<div style={{marginTop: 15}}/>
					<b>Name - what is this used for?</b>
					<TextField
							style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
							InputProps={{
								style:{
									color: "white",
									marginLeft: "5px",
									maxWidth: "95%",
									height: "50px", 
									fontSize: "1em",
								},
							}}
							fullWidth
							color="primary"
							placeholder={"Auth july 2020"}
							onChange={(event) => {
								authenticationOption.label = event.target.value
							}}
						/>
					{selectedApp.link.length > 0 ? <div style={{marginTop: 15}}><EndpointData /></div> : null}
					<Divider style={{marginTop: 15, marginBottom: 15, backgroundColor: "rgb(91, 96, 100)"}}/>
					<div style={{}}/>
						{selectedApp.authentication.parameters.map((data, index) => { 
						return (
							<div key={index} style={{marginTop: 10}}>
								<LockOpenIcon style={{marginRight: 10}}/>
								<b>{data.name}</b>
								<TextField
										style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
										InputProps={{
											style:{
												color: "white",
												marginLeft: "5px",
												maxWidth: "95%",
												height: "50px", 
												fontSize: "1em",
											},
										}}
										fullWidth
										type={data.example !== undefined && data.example.includes("***") ? "password" : "text"}
										color="primary"
										placeholder={data.example} 
										onChange={(event) => {
											authenticationOption.fields[data.name] = event.target.value
										}}
									/>
							</div>
						)
					})}
				</DialogContent>
				<DialogActions>
				<Button 
					style={{borderRadius: "0px"}}
					onClick={() => {
						setAuthenticationModalOpen(false)
					}} color="primary">
						Cancel
					</Button>
					<Button style={{borderRadius: "0px"}} onClick={() => {
						handleSubmitCheck() 	
					}} color="primary">
						Submit	
					</Button>
				</DialogActions>	
			</div>
		)
	}

	const EndpointData = () => {
		const [tmpVar, setTmpVar] = React.useState("")

		return (
			<div>
				The API endpoint to use (URL) - predefined in the app
				<TextField
					style={{backgroundColor: inputColor, borderRadius: borderRadius,}} 
					InputProps={{
						style:{
							color: "white",
							height: "50px", 
							fontSize: "1em",
						},
					}}
					fullWidth
					type="text"
					color="primary"
					disabled={true}
					placeholder="Bearer token" 
					defaultValue={selectedApp.link}
					onChange={(event) => {
						setTmpVar(event.target.value)
					}}
					onBlur={() => {
						selectedApp.link = tmpVar
						console.log("LINK: ", selectedApp.link)
						setSelectedApp(selectedApp)
					}}
				/>
			</div>
		)
	}

	// This whole part is redundant. Made it part of Arguments instead.
	const authenticationModal = authenticationModalOpen ? 
		<Dialog 
			open={authenticationModalOpen} 
			onClose={() => {
				//setAuthenticationModalOpen(false)
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 600,
					padding: 15, 
				},
			}}
		>
			<DialogTitle><div style={{color: "white"}}>Authentication for {selectedApp.name}</div></DialogTitle>
			<AuthenticationData app={selectedApp} />	
		</Dialog> : null

	const loadedCheck = isLoaded && isLoggedIn && workflowDone ? 
		<div>
			{newView}
			{variablesModal}
			{executionVariableModal} 
			{conditionsModal}
			{authenticationModal}
		</div>
		:
		<div>
		</div>


	return (
		<div>	
		  <Prompt
				when={!lastSaved}
				message={unloadText}
			/>
			{loadedCheck}
		</div>	
	)
}

export default AngularWorkflow 
