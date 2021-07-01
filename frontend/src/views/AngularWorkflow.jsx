import React, {useRef, useState, useEffect, useLayoutEffect} from 'react';
import { useInterval } from 'react-powerhooks';
import { useTheme } from '@material-ui/core/styles';

import uuid from "uuid";
import {Link} from 'react-router-dom';
import { Prompt } from 'react-router'
import { useBeforeunload } from 'react-beforeunload';
import ReactJson from 'react-json-view'
import NestedMenuItem from "material-ui-nested-menu-item";


import {TextField, Drawer, Button, Paper, Grid, Tabs, InputAdornment, Tab, ButtonBase, Tooltip, Select, MenuItem, Divider, Dialog, Modal, DialogActions, DialogTitle, InputLabel, DialogContent, FormControl, IconButton, Menu, Input, FormGroup, FormControlLabel, Typography, Checkbox, Breadcrumbs, CircularProgress, Switch, Fade} from '@material-ui/core';
import {OpenInNew as OpenInNewIcon,Undo as UndoIcon, FileCopy as FileCopyIcon, GetApp as GetAppIcon, Search as SearchIcon, ArrowUpward as ArrowUpwardIcon, Visibility as VisibilityIcon, Done as DoneIcon, Close as CloseIcon, Error as ErrorIcon, FindReplace as FindreplaceIcon, ArrowLeft as ArrowLeftIcon, Cached as CachedIcon, DirectionsRun as DirectionsRunIcon, Add as AddIcon, Polymer as PolymerIcon, FormatListNumbered as FormatListNumberedIcon, Create as CreateIcon, PlayArrow as PlayArrowIcon, AspectRatio as AspectRatioIcon, MoreVert as MoreVertIcon, Apps as AppsIcon, Schedule as ScheduleIcon, FavoriteBorder as FavoriteBorderIcon, Pause as PauseIcon, Delete as DeleteIcon, AddCircleOutline as AddCircleOutlineIcon, Save as SaveIcon, KeyboardArrowLeft as KeyboardArrowLeftIcon, KeyboardArrowRight as KeyboardArrowRightIcon, ArrowBack as ArrowBackIcon, Settings as SettingsIcon, LockOpen as LockOpenIcon, ExpandMore as ExpandMoreIcon, VpnKey as VpnKeyIcon} from '@material-ui/icons';

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
import { validateJson, GetIconInfo } from "./Workflows.jsx";
import { GetParsedPaths } from "./Apps.jsx";
import ConfigureWorkflow from '../components/ConfigureWorkflow.jsx';
import ParsedAction from '../components/ParsedAction.jsx';
import Scroll from 'react-scroll'
import { Element as ScrollElement, animateScroll as scroll, scrollSpy, scroller } from 'react-scroll'

const surfaceColor = "#27292D"
const inputColor = "#383B40"

// http://apps.cytoscape.org/apps/yfileslayoutalgorithms
cytoscape.use(edgehandles);
cytoscape.use(clipboard);
cytoscape.use(undoRedo);
cytoscape.use(cxtmenu);

// Adds specific text to items
//import popper from 'cytoscape-popper';
//cytoscape.use(popper);


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

export function sortByKey(array, key) {
	if (array === undefined) {
		return []
	}

	if (key.startsWith("-") && key.length > 2) {
		key = key.slice(1, key.length)
		return array.sort(function(a, b) {
			var x = a[key]; var y = b[key]
			return ((x < y) ? -1 : ((x > y) ? 1 : 0))
		}).reverse()
	}

	return array.sort(function(a, b) {
		var x = a[key]; var y = b[key]
		return ((x < y) ? -1 : ((x > y) ? 1 : 0))
	})
}

function removeParam(key, sourceURL) {
	if (sourceURL === undefined) {
		return
	}

	var rtn = sourceURL.split("?")[0],
		param,
		params_arr = [],
		queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";

	if (queryString !== "") {
			params_arr = queryString.split("&");
			for (var i = params_arr.length - 1; i >= 0; i -= 1) {
					param = params_arr[i].split("=")[0];
					if (param === key) {
							params_arr.splice(i, 1);
					}
			}
			rtn = rtn + "?" + params_arr.join("&");
	}

	if (rtn === "?") {
		return ""
	}

	return rtn;
}

const splitter = "|~|"
const svgSize = 24 
//const referenceUrl = "https://shuffler.io/functions/webhooks/"
//const referenceUrl = window.location.origin+"/api/v1/hooks/"

function useTraceUpdate(props) {
  const prev = useRef(props)
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});
    if (Object.keys(changedProps).length > 0) {
      console.log('Changed props:', changedProps);
    }
    prev.current = props;
  });
}

const AngularWorkflow = (props) => {
  const { globalUrl, isLoggedIn, isLoaded, userdata } = props;
	const referenceUrl = globalUrl+"/api/v1/hooks/"
	const alert = useAlert()
	const theme = useTheme();
	const green = "#86c142"
	const yellow = "#FECC00"

	const [bodyWidth, bodyHeight] = useWindowSize();

	var to_be_copied = ""
	const [cystyle, ] = useState(cytoscapestyle) 
	const [cy, setCy] = React.useState()
		
	const [currentView, setCurrentView] = React.useState(0)
	const [triggerAuthentication, setTriggerAuthentication] = React.useState({})
	const [triggerFolders, setTriggerFolders] = React.useState([])
	const [workflows, setWorkflows] = React.useState([])
	const [showEnvironment, setShowEnvironment] = React.useState(false)

	const [workflow, setWorkflow] = React.useState({});
	const [userSettings, setUserSettings] = React.useState({});
	const [subworkflow, setSubworkflow] = React.useState({});
	const [subworkflowStartnode, setSubworkflowStartnode] = React.useState("");
	const [leftViewOpen, setLeftViewOpen] = React.useState(true);
	const [leftBarSize, setLeftBarSize] = React.useState(350)
	const [executionText, setExecutionText] = React.useState("");
	const [executionRequestStarted, setExecutionRequestStarted] = React.useState(false);
	const [scrollConfig, setScrollConfig] = React.useState({
		top: 0,
		left: 0,
		selected: "",
	})

	const [history, setHistory] = React.useState([])
	const [historyIndex, setHistoryIndex] = React.useState(history.length)

	const [appAuthentication, setAppAuthentication] = React.useState([]);
	const [variablesModalOpen, setVariablesModalOpen] = React.useState(false);
	const [executionVariablesModalOpen, setExecutionVariablesModalOpen] = React.useState(false);
	const [authenticationModalOpen, setAuthenticationModalOpen] = React.useState(false);
	const [conditionsModalOpen, setConditionsModalOpen] = React.useState(false);
	const [newVariableName, setNewVariableName] = React.useState("");
	const [newVariableDescription, setNewVariableDescription] = React.useState("");
	const [newVariableValue, setNewVariableValue] = React.useState("");
	const [workflowDone, setWorkflowDone] = React.useState(false)
	const [authLoaded, setAuthLoaded] = React.useState(false)
	const [localFirstrequest, setLocalFirstrequest] = React.useState(true)
	const [requiresAuthentication, setRequiresAuthentication] = React.useState(false)
	const [rightSideBarOpen, setRightSideBarOpen] = React.useState(false)
	const [showSkippedActions, setShowSkippedActions] = React.useState(false)
	const [lastExecution, setLastExecution] = React.useState("")
	const [configureWorkflowModalOpen, setConfigureWorkflowModalOpen] = React.useState(false)
	const [curpath, setCurpath] = useState(typeof window === 'undefined' || window.location === undefined ? "" : window.location.pathname)

	// 0 = normal, 1 = just done, 2 = normal
	const [savingState, setSavingState] = React.useState(0)

	const [selectedResult, setSelectedResult] = React.useState({})
	const [codeModalOpen, setCodeModalOpen] = React.useState(false);

	const [variableAnchorEl, setVariableAnchorEl] = React.useState(null)

	const [sourceValue, setSourceValue] = React.useState({})
	const [destinationValue, setDestinationValue] = React.useState({})
	const [conditionValue, setConditionValue] = React.useState({})
	const [dragging, setDragging] = React.useState(false)
	const [dragPosition, setDragPosition] = React.useState({
		x: 0,
		y: 0,
	})

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

	// This should all be set once, not on every iteration
	// Use states and don't update lol
	const cloudSyncEnabled = props.userdata !== undefined && props.userdata.active_org !== null && props.userdata.active_org !== undefined ? props.userdata.active_org.cloud_sync === true : false 
	//const triggerEnvironments = cloudSyncEnabled ? ["cloud", "onprem"] : environments
	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" 
	const appBarSize = isCloud ? 75 : 60
	const triggerEnvironments = isCloud ? ["cloud"] : ["onprem", "cloud"] 
	const unloadText = 'Are you sure you want to leave without saving (CTRL+S)?'

	useBeforeunload(() => {
		if (!lastSaved) {
			return unloadText
		}
	})

	const [elements, setElements] = useState([])
	// No point going as fast, as the nodes aren't realtime anymore, but bulk updated. 
	// Set it from 2500 to 6000 to reduce overall load
	const { start, stop } = useInterval({
		duration: 3000,
		startImmediate: false,
		callback: () => {
			fetchUpdates()
		}
	})

	const getAvailableWorkflows = (trigger_index) => {
		fetch(globalUrl+"/api/v1/workflows", {
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
				return 
			}
			return response.json()
		})
    .then((responseJson) => {
			if (responseJson !== undefined) {
				setWorkflows(responseJson)

				// Sets up subflow trigger with the right info
				if (trigger_index > -1) {
					var outersub = {}
					const trigger = workflow.triggers[trigger_index]
					if (trigger.parameters.length >= 3) {
						for (var key in trigger.parameters) {
							const param = trigger.parameters[key]
							if (param.name === "workflow") {
								if (param.value === workflow.id) {
									setSubworkflow(workflow)
									outersub = workflow 
								} else {
									const sub = responseJson.find(data => data.id === param.value)
									if (sub !== undefined && subworkflow.id !== sub.id) { 
										setSubworkflow(sub)
										outersub = sub
									}
								}
							}

							if (param.name === "startnode" && outersub.id !== undefined) {
								console.log("SHOULD SET STARTNODE IN SUBFLOW SELECTION: ", outersub)
								const innernode = outersub.actions.find(action => action.id === param.value)
								console.log("FOUND NODE: ", innernode)
								if (innernode !== undefined && subworkflowStartnode.id !== innernode.id) { 
									setSubworkflowStartnode(innernode)
								}
								/*
								const sub = responseJson.find(data => data.id === param.value)
									setSubworkflow(sub)
								}
								*/
							}
						}
					}
				}
			} 
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const generateApikey = () => {
		fetch(globalUrl+"/api/v1/generateapikey", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for APIKEY gen :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			setUserSettings(responseJson)
    })
		.catch(error => {
    		console.log(error)
		});
	}

	const getSettings = () => {
		fetch(globalUrl+"/api/v1/getsettings", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
				credentials: "include",
			})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for get settings :O!")
			}

			return response.json()
		})
    .then((responseJson) => {
			if (responseJson.apikey === undefined || responseJson.apikey.length === 0 || responseJson.apikey === null) {
				generateApikey()
			}
			setUserSettings(responseJson)
    })
		.catch(error => {
    	console.log(error)
		});
	}

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
				getAppAuthentication(true) 
				setAuthenticationModalOpen(false) 

				// Needs a refresh with the new authentication..
				//alert.success("Successfully saved new app auth")
			}
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const getWorkflowExecution = (id, execution_id) => {
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
				
				// - means it's opposite
				const newkeys = sortByKey(responseJson, "-started_at")
				setWorkflowExecutions(newkeys)
				//console.log("NEWKEYS: ", newkeys)
				//setWorkflowExecutions(responseJson)

				const cursearch = typeof window === 'undefined' || window.location === undefined ? "" : window.location.search
				var tmpView = new URLSearchParams(cursearch).get("execution_id")
				if (execution_id !== undefined && execution_id !== null && execution_id.length > 0 && (tmpView === undefined || tmpView === null || tmpView.length === 0)) {
					tmpView = execution_id
				}
					
				if (tmpView !== undefined && tmpView !== null && tmpView.length > 0) {
					const execution = responseJson.find(data => data.execution_id === tmpView)
					if (execution !== null && execution !== undefined) {
						setExecutionData(execution)
						setExecutionModalView(1)
						start()

						setExecutionRequest({
							"execution_id": execution.execution_id,
							"authorization": execution.authorization,
						})

						const newitem = removeParam("execution_id", cursearch) 
						props.history.push(curpath+newitem)
					}
				}
			}

			//alert.info("Loaded executions")
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
			handleUpdateResults(responseJson, executionRequest)
		})
		.catch(error => {
			console.log("Error: ", error)
			//alert.error(error.toString())
			stop()
		})
	}

	const abortExecution = () => {
		setExecutionRunning(false)

		//alert.info("Aborting execution")
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
				console.log("Status not 200 for ABORT EXECUTION :O!")
			} else {
				//alert.success("Execution aborted")
			}

			return response.json()
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	// Controls the colors and direction of execution results.
	// Style is in defaultCytoscapeStyle.js
	const handleUpdateResults = (responseJson, executionRequest) => {
		//console.log(responseJson)
		// Loop nodes and find results
		// Update on every interval? idk

		if (JSON.stringify(responseJson) !== JSON.stringify(executionData)) {
			// FIXME: If another is selected, don't edit.. 
			// Doesn't work because this is some async garbage
			if (executionData.execution_id === undefined || (responseJson.execution_id === executionData.execution_id && responseJson.results !== undefined && responseJson.results !== null)) {

				if (executionData.status !== responseJson.status || executionData.result !== responseJson.result || executionData.results.length !== responseJson.results.length) {
					//console.log("Updated state with this data:")
					//console.log(responseJson)
					//console.log(executionData)
					setExecutionData(responseJson)
				} else {
					console.log("NOT updating state.")
				}
			}
		} else {
			//console.log("JSON is same")
		}

		//console.log("PRE LOOPING RESULTS: !", responseJson.execution_id, executionRequest.execution_id)

		if (responseJson.execution_id !== executionRequest.execution_id) {
			cy.elements().removeClass('success-highlight failure-highlight executing-highlight')
			return
		}

		//console.log("LOOPING RESULTS!")

		if (responseJson.results !== null && responseJson.results.length > 0) {
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
								//alert.show("WAITING FOR "+item.action.label+" with result "+item.result)
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
						incomingEdges.addClass('success-highlight')
						outgoingEdges.addClass('success-highlight')

						if (visited !== undefined && visited !== null && !visited.includes(item.action.label)) {
							if (executionRunning) {
								//alert.show("Success in node "+item.action.label)
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
						//When status comes as failure, allow user to start workflow execution
						if (executionRunning) {
							setExecutionRunning(false)
						}

						currentnode.removeClass('not-executing-highlight')
						currentnode.removeClass('executing-highlight')
						currentnode.removeClass('success-highlight')
						currentnode.removeClass('awaiting-data-highlight')
						currentnode.removeClass('shuffle-hover-highlight')
						currentnode.addClass('failure-highlight')

						if (!visited.includes(item.action.label)) {
							if (item.action.result !== undefined && item.action.result !== null && !item.action.result.includes("failed condition")) {
								alert.error("Error for "+item.action.label+" with result "+item.result)
							}
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

			if (executionRunning) {
				setExecutionRunning(false)
			}

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

			getWorkflowExecution(props.match.params.key, "")
		} else if (responseJson.status === "FINISHED") {
			//console.log("STOPPING BECAUSE ITS OVAH!")
			setExecutionRunning(false)
			stop()
			getWorkflowExecution(props.match.params.key, "")
			setUpdate(Math.random())
		} else {
			//console.log("Nothing to update")
		}
	}

	const saveWorkflow = (curworkflow) => {
		var success = false

		if (isCloud && !isLoggedIn) {
			console.log("Should redirect to register with redirect.")
			window.location.href = `/register?view=/workflows/${props.match.params.key}&message=You need sign up to use workflows with Shuffle`
			return
		}

		setSavingState(2)

		// This might not be the right course of action, but seems logical, as items could be running already 
		// Makes it possible to update with a version in current render
		stop()
		var useworkflow = workflow
		if (curworkflow !== undefined) {
			useworkflow = curworkflow 
		} else {
			//alert.info("Saving workflow")
		}

		var cyelements = cy.elements()
		var newActions = []
		var newTriggers = []
		var newBranches = []
		var newVBranches = []
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
					decorator: cyelements[key].data().decorator,
				}

				if (parsedElement.decorator) {
					newVBranches.push(parsedElement)
				} else {
					newBranches.push(parsedElement)
				}
			} else {
				if (type === "ACTION") {
					const cyelement = cyelements[key].data()
					const elementid = cyelement.id === undefined || cyelement.id === null ? cyelement["_id"] : cyelement.id
				
					var curworkflowAction = useworkflow.actions.find(a => a !== undefined && (a["id"] === elementid || a["_id"] === elementid))
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
					
					// Cleans up OpenAPI items
					var newparams = []
					for (var key in curworkflowAction.parameters) {
						const thisitem = curworkflowAction.parameters[key]
						if (thisitem.name.startsWith("${") && thisitem.name.endsWith("}")) {
							continue
						}

						newparams.push(thisitem)
					}

					curworkflowAction.parameters = newparams
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
		useworkflow.visual_branches = newVBranches

		// Errors are backend defined
		useworkflow.errors = []
		useworkflow.previously_saved = true

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
			setSavingState(0)
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
				if (responseJson.new_id !== undefined && responseJson.new_id !== null) {
					window.location.pathname = "/workflows/"+responseJson.new_id
				}

				success = true
				if (responseJson.errors !== undefined) {
					//console.log(responseJson)
					workflow.errors = responseJson.errors
					if (responseJson.errors.length === 0) {
						workflow.isValid = true
						workflow.is_valid = true

						//console.log("ELEMENTS: ", cy.elements())
						//const setupGraph = () => {
						const cyelements = cy.elements()
						for (var i = 0; i < cyelements.length; i++) {
							cyelements[i].removeStyle()
							cyelements[i].data().is_valid = true
							cyelements[i].data().errors = []
						}

						for (var key in workflow.actions) {
							workflow.actions[key].is_valid = true
							workflow.actions[key].errors = [] 
						}
					}

					for (var key in workflow.errors) {
						//console.log("Error: ", workflow.errors[key])
						alert.info(workflow.errors[key])
					}

					setWorkflow(workflow)
				}

				//alert.success("Successfully saved workflow")
				setSavingState(1)
				setTimeout(() => {
					setSavingState(0)
				}, 1500);
			}
		})
		.catch(error => {
			setSavingState(0)
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

	const executeWorkflow = (executionArgument, startNode) => {
		if (!lastSaved) {
			//alert.error("You might have forgotten to save before executing.")
			console.log("FIXME: Might have forgotten to save before executing.")
		}

		if (workflow.public) {
			alert.info("Save it to get a new version")
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

		if (executionArgument !== undefined && executionArgument !== null && executionArgument.length > 0) { 
			//alert.success("Starting execution WITH an execution argument")
		} else {
			//alert.success("Starting execution")
		}

		const data = {"execution_argument": executionArgument, "start": startNode}
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

			if (responseJson.execution_id === "" || responseJson.execution_id === undefined || responseJson.authorization === "" || responseJson.authorization === undefined ) {
				alert.error("Something went wrong during execution startup")
				console.log("BAD RESPONSE FOR EXECUTION: ", responseJson)
				setExecutionRunning(false)
				setExecutionRequestStarted(false)
				stop()

				for (var i = 0; i < curelements.length; i++) {
					curelements[i].removeClass("not-executing-highlight")
				}
				return
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
	//"Testing",
	const internalIds = [
		"Shuffle Tools",
		"http",
	]

	const getAppAuthentication = (reset) => {
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
			}

			return response.json()
		})
    .then((responseJson) => {
			if (responseJson.success) {
				var newauth = []
				for (var key in responseJson.data) {
					if (responseJson.data[key].defined === false) {
						continue
					}

					newauth.push(responseJson.data[key])
				}

				if (cy !== undefined) {
					console.log("NEW AUTH = reset cy's onnodeselect")

					// Remove the old listener for select, run with new one 
					cy.removeListener('select')
					cy.on('select', 'node', (e) => onNodeSelect(e, newauth))
					cy.on('select', 'edge', (e) => onEdgeSelect(e))
				}

				setAppAuthentication(newauth)
				setAuthLoaded(true)
			} else {
				setAuthLoaded(true)
				//alert.error("Failed getting authentications")
			}
		})
		.catch(error => {
			setAuthLoaded(true)
			alert.error("Auth loading error: "+error.toString())
		})
	}


	const getApps = () => {
		fetch(globalUrl+"/api/v1/apps", {
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
			console.log("APPS: ", responseJson)
			setApps(responseJson)

			if (isCloud) {
				setFilteredApps(responseJson.filter(app => !internalIds.includes(app.name)))
				setPrioritizedApps(responseJson.filter(app => internalIds.includes(app.name)))
			} else {
				setFilteredApps(responseJson.filter(app => !internalIds.includes(app.name) && !(!app.activated && app.generated)))
				setPrioritizedApps(responseJson.filter(app => internalIds.includes(app.name)))
			}
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}
	
	const getWorkflow = (workflow_id, sourcenode) => {
		console.log(`Getting workflow ${workflow_id} with append value ${sourcenode}`)

		fetch(globalUrl+"/api/v1/workflows/"+workflow_id, {
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

			if (responseJson.public) {
				alert.info("This workflow is public. You will have to save it to make it your own!") 
				//setLastSaved(false)
			}

			// Appends SUBFLOWS. Does NOT run during normal grabbing of workflows.
			if (sourcenode.id !== undefined) {
				console.log("WORKFLOW: ", responseJson)

				var nodefound = false
				const target = sourcenode.parameters.find(item => item.name === "startnode")
				console.log(sourcenode.parameters)
				console.log(target)
				const target_id = target === undefined ? "" : target.value
				const actions = responseJson.actions.map(action => {
					const node = {
						group: "nodes",
					}

					// Set it dynamically?
					node.position = {
						x: sourcenode.position.x+action.position.x,
						y: sourcenode.position.y+action.position.y,
					}

					node.data = action

					node.data._id = action["id"]
					node.data.type = "ACTION"
					node.data.source_workflow = responseJson.id
					if (action.id === target_id) {
						nodefound = true
					}

					var example = ""
					if (action.example !== undefined && action.example !== null && action.example.length > 0) {
						example = action.example
					}

					node.data.example = example
					return node;
				})

				var edges = responseJson.branches.map((branch, index) => {
					const edge = { };
					var conditions = responseJson.branches[index].conditions
					if (conditions === undefined || conditions === null) {
						conditions = []
					}

					var label = ""
					if (conditions.length === 1) {
						label = conditions.length+" condition"
					} else if (conditions.length > 1) {
						label = conditions.length+" conditions"
					}

					const sourceFound = actions.findIndex(action => action.data.id === branch.source_id) 
					if (sourceFound < 0) {
						return null
					}

					const destinationFound = actions.findIndex(action => action.data.id === branch.destination_id) 
					if (destinationFound < 0) {
						return null
					}

					edge.data = {
						id: branch.id,
						_id: branch.id,
						source: branch.source_id,
						target: branch.destination_id,
						label: label,
						conditions: conditions,
						hasErrors: branch.has_errors,
						decorator: false,
						source_workflow: responseJson.id,
					}

					return edge;
				})


				//console.log("Adding node: ", node)
				//cy.on('add', 'node', (e) => onNodeAdded(e))
				edges = edges.filter(edge => edge !== null)
				cy.removeListener('add')
				cy.add(actions)
				cy.add(edges)

				if (nodefound === true) {
					const newId = uuid.v4()
					cy.add({
						group: "edges",
						data: {
							id: newId,
							_id: newId,
							source: sourcenode.id,
							target: target_id,
							label: "Subflow",
							decorator: true,
							source_workflow: responseJson.id,
						}
					})
				}

				cy.fit(null, 100)
				//cy.zoom(2.0)
				cy.on('add', 'node', (e) => onNodeAdded(e))
				cy.on('add', 'edge', (e) => onEdgeAdded(e))

				//for (var key in 
			} else {
				setWorkflow(responseJson)
				setWorkflowDone(true)

				//console.log(responseJson)
				// Add error checks
				console.log("Workflow: ", responseJson)
				if (!responseJson.public) {
					if ((!responseJson.previously_saved || (!responseJson.is_valid || (responseJson.errors !== undefined || responseJson.errors !== null || responseJson.errors !== responseJson.errors.length > 0)))) {
						setConfigureWorkflowModalOpen(true)
					}
				}
			}
    })
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const onUnselect = (event) => {
		console.time("UNSELECT")

		const nodedata = event.target.data()
		if (nodedata.app_name === undefined && nodedata.source === undefined) {
			return
		}
		event.target.removeClass("selected")


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
		setScrollConfig({
			top: 0,
			left: 0,
			selected: "",
		})
		console.timeEnd("UNSELECT")
	}

	const onEdgeSelect = (event) => {
		setRightSideBarOpen(true)
		setLastSaved(false)

		/*
		 // Used to not be able to edit trigger-based branches. 
			const triggercheck = workflow.triggers.find(trigger => trigger.id === event.target.data()["source"])
			if (triggercheck === undefined) {
		*/
		//console.log(event.target.data())
		if (event.target.data().decorator) {
			alert.info("This edge can't be edited.")
		} else {
			setSelectedEdgeIndex(workflow.branches.findIndex(data => data.id === event.target.data()["id"]))
			setSelectedEdge(event.target.data())
		}

		/*
		} else {
			//alert.info("Can't edit branches from triggers") 
			console.log("IN HERE: !", triggercheck)
		}
		*/

		setSelectedAction({})
		setSelectedTrigger({})
	}

	// Comparing locations between nodes and setting views
	var styledElements = []
	var originalLocation = {
		x: 0,
		y: 0,
	}


	const onCtxTap = (event) => {
		const nodedata = event.target.data()
		console.log(nodedata)
		if (nodedata.type === "TRIGGER" && nodedata.app_name === "Shuffle Workflow") {
			if (nodedata.parameters === null) {
				alert.error("Set a workflow first")
				return
			}

			const workflow_id = nodedata.parameters.find(param => param.name === "workflow")
			if (workflow.id === workflow_id.valu) {
				return
			}

			cy.animation({ 
				zoom: 0,
				center: {
					eles: event.target,
				},
			})
			.play()
			.promise()
			.then( () => {
				console.log("DONE: ", workflow_id)
				//cy.elements().remove()
				getWorkflow(workflow_id.value, nodedata)
				cy.fit(null, 50)
				//props.match.params.key
				//cy.animation({ 
				//	zoom: 500,
				//	center: {
				//		eles: cy.nodes(),
				//	},
				//})
				//.play()
				//.promise()
			})

			//const animationDuration = 150
			//style: {
			//maxZoom={2.00}
			//cy.animate({
			//	fit: 100,
			//}, {
			//	duration: 500,	
			//})
		}
	}
	//cy.on('cxttap', "node", (e) => onCtxTap(e))

	var hiddenNodes = []
	const onNodeDragStop = (event, selectedAction) => {
		const nodedata = event.target.data()
		console.log("IN NODE DRAG STOP: ", nodedata)
		if (nodedata.id === selectedAction.id) {
			return
		}

		if (nodedata.finished === false) {
			return
		}

		//console.log("Drag: ", nodedata)
		//return 

		//console.log("DRAGGED NODE: ", nodedata)
		//console.log("TARGET NODE: ", selectedAction)
		if (styledElements.length === 1) {
			console.log("Should reset location and autofill: ", styledElements, selectedAction)
			//event.target.position = originalLocation
			//curworkflowTrigger.position = cyelements[key].position()
			if (originalLocation.x !== 0 || originalLocation.y !== 0) {
				const currentnode = cy.getElementById(nodedata.id)
				if (currentnode !== null && currentnode !== undefined) {
					//currentnode.position = originalLocation
					currentnode.position("x", originalLocation.x)
					currentnode.position("y", originalLocation.y)
				}

				originalLocation = {x: 0, y: 0}
			}

			const curElement = document.getElementById(styledElements[0])
			if (curElement !== null && curElement !== undefined) {
				//console.log("ELE: ", curElement)
				curElement.style.border = curElement.style.original_border
				var newValue = "$"+nodedata.label.toLowerCase().replaceAll(" ", "_")
				var paramname = ""
				var idnumber = -1
				if (curElement.id.startsWith("rightside_field_")) {
					console.log("FOUND FIELD WITH NUMBER: ", curElement.id)
					const idsplit = curElement.id.split("_")
					console.log(idsplit)
					if (idsplit.length === 3 && !isNaN(idsplit[2])) {
						console.log("ADDING TO PARAM ", idsplit[2])
						console.log("PARAM: ", selectedAction)
					
						selectedAction.parameters[idsplit[2]].value = newValue
						paramname = selectedAction.parameters[idsplit[2]].name
						idnumber = idsplit[2]
					}
				}

				if (idnumber >= 0 && paramname.length > 0) {
					const exampledata = GetExampleResult(nodedata) 
					const parsedname = paramname.toLowerCase().trim().replaceAll("_", " ")

					const foundresult = GetParamMatch(parsedname, exampledata, "")
					if (foundresult.length > 0) {
						console.log("FOUND RESULT: ", paramname, foundresult)
						newValue = `${newValue}${foundresult}`
					} 

					selectedAction.parameters[idnumber].value = newValue
				}

				curElement.value = newValue
			}
		}

		const skipnames = []
		if (nodedata.app_name !== undefined && ((
			nodedata.app_name !== "Shuffle Tools" &&
			nodedata.app_name !== "Testing" &&
			nodedata.app_name !== "Shuffle Workflow" &&
			nodedata.app_name !== "User Input" &&
			nodedata.app_name !== "Webhook" &&
			nodedata.app_name !== "Schedule" &&
			nodedata.app_name !== "Email") || nodedata.isStartNode) 
		) {
			const allNodes = cy.nodes().jsons()
			var found = false
			for (var key in allNodes) {
				const currentNode = allNodes[key]
				if (currentNode.data.attachedTo === nodedata.id && currentNode.data.isDescriptor) {
					found = true 
					console.log("FOUND THE NODE!")
					break
				}
			}

			// Readding the icon after moving the node
			if (!found) {
				//console.log("Node wasn't found")
				const iconInfo = GetIconInfo(nodedata)
				const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
				const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)

				const offset = nodedata.isStartNode ? 36 : 44
				//console.log(event.target.position())
				const decoratorNode = {
					position: {
						x: event.target.position().x+offset,
						y: event.target.position().y+offset,
					},
					locked: true,
					data: {
						"isDescriptor": true,
						"isValid": true,
						"is_valid": true,
						"label": "",
						"image": svgpin_Url,
						"imageColor": iconInfo.iconBackgroundColor,
						"attachedTo": nodedata.id,
					},
				}

				cy.add(decoratorNode).unselectify()
			} else {
				console.log("Node already exists - don't add descriptor node")
			}
		} else {
			//console.log("Shouldnt re-add info? ")
		}

		originalLocation = {
			x: 0,
			y: 0,
		}
	}

	const onNodeDrag = (event, selectedAction) => {
		//if (Object.getOwnPropertyNames(selectedAction).length === 0) {
		//	return
		//}
		const nodedata = event.target.data()
		//console.log("Dragging: ", nodedata)
		if (nodedata.finished === false) {
			return
		}

		//console.log("Dragging node!!")
		if (nodedata.app_name == "Shuffle Tools" || nodedata.app_name == "Testing") {
			//console.log("NODE: ", 
			//selector: `node[app_name="Shuffle Tools"]`,
			//console.log(event.target)

			// 1. Find location of node
			// 2. Check if it's within view of another node (inside)
			// 3. If it is, then hide text
		}

		if (nodedata.app_name !== undefined) {
			//console.log("Trying to remove friendly nodes")
			const allNodes = cy.nodes().jsons()
			for (var key in allNodes) {
				const currentNode = allNodes[key]
				if (currentNode.data.attachedTo === nodedata.id) {
					cy.getElementById(currentNode.data.id).remove()
				}
			}
		} else {
			console.log("No appid? ", nodedata)
		}

		if (nodedata.id === selectedAction.id) {
			return
		}

		if (originalLocation.x === 0 && originalLocation.y === 0 && nodedata.position !== undefined) {
			//console.log("Updating location!: ", nodedata) 
			originalLocation.x = nodedata.position.x 
			originalLocation.y = nodedata.position.y
		}

		// Part of autocomplete. Styles elements in frontend to indicate 
		// what and where we may input data for the user.
		const onMouseUpdate = (e) => {
			const x = e.pageX;
			const y = e.pageY;

			const elementMouseIsOver = document.elementFromPoint(x, y)
			if (elementMouseIsOver !== undefined && elementMouseIsOver !== null) {
				// Color for #f85a3e translated to rgb
				const newBorder = "3px solid rgb(248, 90, 62)"
				if (elementMouseIsOver.style.border != newBorder && elementMouseIsOver.id.includes("rightside")) {
					//console.log(elementMouseIsOver.style.border)
					if (elementMouseIsOver.style.border !== undefined) {
						elementMouseIsOver.style.original_border = elementMouseIsOver.style.border 
					} else {
						elementMouseIsOver.style.original_border = ""
					}

					elementMouseIsOver.style.border = newBorder
					console.log("STYLED: ", styledElements)
					for (var key in styledElements) {
						const curElement = document.getElementById(styledElements[key])
						if (curElement !== null && curElement !== undefined) {
							curElement.style.border = curElement.style.original_border
						}
					}

					styledElements = []
					styledElements.push(elementMouseIsOver.id)
				} else if (elementMouseIsOver.id === "cytoscape_view" || elementMouseIsOver.id === "") {
					for (var key in styledElements) {
						const curElement = document.getElementById(styledElements[key])
						if (curElement !== null && curElement !== undefined) {
							curElement.style.border = curElement.style.original_border
						}
					}

					styledElements = []
				}
			}

			// Ensure it only happens once
			document.removeEventListener('mousemove', onMouseUpdate, false)
		}

		document.addEventListener('mousemove', onMouseUpdate, false);

		/*
		event.target.animate({
			style: {
				"border-width": "12px",
				"border-opacity": ".7",
			}
		}, {
			duration: animationDuration,	
		})
		event.target.animate({
			style: {
				"border-width": "12px",
				"border-opacity": ".7",
			}
		}, {
			duration: animationDuration,	
		})
		*/
	}

	// Nodeselectbatching:
	// https://stackoverflow.com/questions/16677856/cy-onselect-callback-only-once
	const onNodeSelect = (event, newAppAuth) => {
		const data = event.target.data()
		if (data.isButton) {
			//console.log("BUTTON CLICKED: ", data)
			if (data.buttonType === "delete") {
				//console.log("DELETE!")
				const parentNode = cy.getElementById(data.attachedTo)
				if (parentNode !== null && parentNode !== undefined) {
					parentNode.remove()
				}

				//for (var key in allNodes) {
				//	const currentNode = allNodes[key]
				//	if (currentNode.data.attachedTo === data.attachedTo) {
				//		cy.getElementById(currentNode.data.id).remove()
				//	}
				//}
			} else if (data.buttonType === "copy") {
				console.log("COPY!")
				// 1. Find parent
				// 2. Find branches for parent
				// 3. Make a new node that's moved a little bit
				const parentNode = cy.getElementById(data.attachedTo)
				if (parentNode !== null && parentNode !== undefined) {
					//parentNode.data()
					var newNodeData = JSON.parse(JSON.stringify(parentNode.data()))
					newNodeData.id = uuid.v4()
					if (newNodeData.position !== undefined) {
						newNodeData.position = {
							"x": newNodeData.position.x+100,
							"y": newNodeData.position.y+100,
						}
					}

					newNodeData.isStartNode = false
					newNodeData.errors = []
					newNodeData.is_valid = true
					newNodeData.isValid = true

					cy.add({
							group: 'nodes',
							data:  newNodeData,
							position: newNodeData.position,
					})

					// Readding the icon after moving the node
					//console.log("Node wasn't found")
					if (newNodeData.app_name !== "Testing" || newNodeData.app_name !== "Shuffle Workflow") {
					} else {
						const iconInfo = GetIconInfo(newNodeData)
						const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
						const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)

						const offset = newNodeData.isStartNode ? 36 : 44
						//console.log(event.target.position())
						const decoratorNode = {
							position: {
								x: newNodeData.position.x+offset,
								y: newNodeData.position.y+offset,
							},
							locked: true,
							data: {
								"isDescriptor": true,
								"isValid": true,
								"is_valid": true,
								"label": "",
								"image": svgpin_Url,
								"imageColor": iconInfo.iconBackgroundColor,
								"attachedTo": newNodeData.id,
							},
						}

						cy.add(decoratorNode).unselectify()
					}

					workflow.actions.push(newNodeData)

					const sourcebranches = workflow.branches.filter(foundbranch => foundbranch.source_id === parentNode.data("id"))
					const destinationbranches = workflow.branches.filter(foundbranch => foundbranch.destination_id === parentNode.data("id"))

					//for (var key in sourcebranches) {
					//	var newbranch = JSON.parse(JSON.stringify(sourcebranches[key]))
					//	newbranch.id = uuid.v4()
					//	newbranch.source_id = newNodeData.id
					//	cy.add({
					//		group: "edges",
					//		data: newbranch,
					//	})
					//}

					for (var key in sourcebranches) {
						var newbranch = JSON.parse(JSON.stringify(sourcebranches[key]))
						newbranch.id = uuid.v4()
						newbranch.source_id = newNodeData.id

						newbranch._id = newbranch.id
						newbranch.source = newbranch.source_id
						newbranch.target = newbranch.destination_id
						cy.add({
							group: "edges",
							data: newbranch,
						})
					}

					for (var key in destinationbranches) {
						var newbranch = JSON.parse(JSON.stringify(destinationbranches[key]))
						newbranch.id = uuid.v4()
						newbranch.destination_id = newNodeData.id

						newbranch._id = newbranch.id
						newbranch.source = newbranch.source_id
						newbranch.target = newbranch.destination_id
						cy.add({
							group: "edges",
							data: newbranch,
						})
					}
				}
			}

			event.target.unselect()
			return
		} else if (data.isDescriptor) {
			console.log("Can't select descriptor")
			event.target.unselect()
			return
		}

		//const node = cy.getElementById(data.id)
		//if (node.length > 0) {
		//	node.addClass('shuffle-hover-highlight')
		//}

		//const branch = workflow.branches.filter(branch => branch.source_id === data.id || branch.destination_id === data.id)
		//console.log("APPAUTH: ", newAppAuth)
		//console.log("BRANCHES: ", branch)

		if (data.type === "ACTION") {
			var curaction = workflow.actions.find(a => a.id === data.id)
			//console.log("INSIDE CURACTION: ", curaction)
			if (!curaction || curaction === undefined) { 
				//event.target.unselect()
				//alert.error("Action not found. Please remake it.")
				return
			}

			const curapp = apps.find(a => a.name === curaction.app_name && ((a.app_version === curaction.app_version || (a.loop_versions !== null && a.loop_versions.includes(curaction.app_version)))))
			//console.log("APP: ", curapp)
			if (!curapp || curapp === undefined) {
				alert.error(`App ${curaction.app_name}:${curaction.app_version} not found. Is it activated?`)

				const tmpapp = {
					name: curaction.app_name,
					app_name: curaction.app_name, 
					app_version: curaction.app_version, 
					id: curaction.app_id,
					actions: [curaction],
				}

				console.log(tmpapp)
				console.log(curaction)
				setSelectedApp(tmpapp)
				//setSelectedAction(JSON.parse(JSON.stringify(curaction)))
				setSelectedAction(curaction)
				//return
			} else {

				//console.log("AUTHENTICATION: ", curapp.authentication)
				setRequiresAuthentication(curapp.authentication.required && curapp.authentication.parameters !== undefined && curapp.authentication.parameters !== null)
				if (curapp.authentication.required) {
					//console.log("App requires auth.")
					// Setup auth here :)
					const authenticationOptions = []
					var findAuthId = ""
					if (curaction.authentication_id !== null && curaction.authentication_id !== undefined && curaction.authentication_id.length > 0) {
						findAuthId = curaction.authentication_id
					}

					var tmpAuth = JSON.parse(JSON.stringify(newAppAuth))
					//console.log("FOUND AUTH: ", tmpAuth)

					//console.log("Checking authentication: ", tmpAuth)
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

					//console.log("OPTIONS: ", authenticationOptions)
					curaction.authentication = authenticationOptions
					//console.log("Authentication: ", authenticationOptions)
					if (curaction.selectedAuthentication === null || curaction.selectedAuthentication === undefined || curaction.selectedAuthentication.length === "") {
						curaction.selectedAuthentication = {}
					}
				} else {
					curaction.authentication = []
					curaction.authentication_id = ""
					curaction.selectedAuthentication = {}
				}

				//setSelectedAction(JSON.parse(JSON.stringify(curaction)))
				//console.log("CURAPP: ", curapp, selectedApp)
				setSelectedApp(curapp)
				setSelectedAction(curaction)

				cy.removeListener('drag')
				cy.removeListener('free')
				cy.on('drag', 'node', (e) => onNodeDrag(e, curaction))
				cy.on('free', 'node', (e) => onNodeDragStop(e, curaction))
			}

			if (environments !== undefined && environments !== null) {
				var env = environments.find(a => a.Name === curaction.environment)
				if (!env || env === undefined) {
					env = environments[defaultEnvironmentIndex]
				}

				setSelectedActionEnvironment(env)
			}

		} else if (data.type === "TRIGGER") {
			//console.log("Should handle trigger "+data.triggertype)
			//console.log(data)
			const trigger_index = workflow.triggers.findIndex(a => a.id === data.id)
			setSelectedTriggerIndex(trigger_index)
			setSelectedTrigger(data)
			setSelectedActionEnvironment(data.env)

			if (data.app_name === "Shuffle Workflow") {
				getAvailableWorkflows(trigger_index) 
				getSettings() 
			}
		} else {
			alert.error("Can't handle "+data.type)
		}

		//console.log("BAR: ", rightSideBarOpen, "SAVE: ", lastSaved)
		setRightSideBarOpen(true)
		setLastSaved(false)

		// Refresh listeners
		//cy.removeListener('select')
		//cy.on('select', 'node', (e) => onNodeSelect(e, newAppAuth, curapp, rightSideBarOpen, lastSaved))
		//cy.on('select', 'edge', (e) => onEdgeSelect(e))

		setScrollConfig({
			top: 0,
			left: 0,
			selected: "",
		})
	}

	const GetExampleResult = (item) => {
		var exampledata = item.example === undefined ? "" : item.example
		if (workflowExecutions.length > 0) {
			// Look for the ID
			const found = false
			for (var key in workflowExecutions) {
				if (workflowExecutions[key].results === undefined || workflowExecutions[key].results === null) {
					continue
				}

				var foundResult = {"result": ""}
				if (item.id === "exec") {
					//console.log("EXEC: ", workflowExecutions[key].execution_argument)
					if (workflowExecutions[key].execution_argument !== undefined && workflowExecutions[key].execution_argument !== null && workflowExecutions[key].execution_argument.length > 0) {
						foundResult.result = workflowExecutions[key].execution_argument
					} else {
						continue
					}
				} else {
					foundResult = workflowExecutions[key].results.find(result => result.action.id === item.id)
					if (foundResult === undefined) {
						continue
					}
				}

				foundResult.result = foundResult.result.trim()
				foundResult.result = foundResult.result.split(" None").join(" \"None\"")
				foundResult.result = foundResult.result.split(" False").join(" false")
				foundResult.result = foundResult.result.split(" True").join(" true")

				var jsonvalid = true
				try {
					const tmp = String(JSON.parse(foundResult.result))
					if (!foundResult.result.includes("{") && !foundResult.result.includes("[")) {
						jsonvalid = false
					}
				} catch (e) {
					try {
						foundResult.result = foundResult.result.split("\'").join("\"")
						const tmp = String(JSON.parse(foundResult.result))
						if (!foundResult.result.includes("{") && !foundResult.result.includes("[")) {
							jsonvalid = false
						}
					} catch (e) {
						jsonvalid = false
					}
				}

				// Finds the FIRST json only
				if (jsonvalid) {
					//console.log("VALID!")
					exampledata = JSON.parse(foundResult.result)
					break
				} else {
					//console.log("INVALID: ", foundResult.result)
				}
			}
		}

		//console.log("EXAMPLE: ", exampledata)
		return exampledata
	}

	const GetParamMatch = (paramname, exampledata, basekey) => {
		const splitkey = "."
		//console.log(typeof(exampledata))
		//console.log("MATCHING WITH: ", exampledata)
		if (typeof(exampledata) !== "object") {
			return ""
		}

		if (exampledata === null) {
			return ""
		}

		// Basically just a stupid if-else :)
		const synonyms = {
			"id": ["id", "ref", "sourceref", "reference", "sourcereference", "alert id", "case id", "incident id", "service id", "sid", "uid", "uuid", "team id"],
			"title": ["title", "name", "message"],
			"description": ["description", "explanation", "story", "details",],
			"email": ["mail", "email", "sender", "receiver", "recipient"],
			"data": ["data", "ip", "domain", "url", "hash", "md5", "sha2", "sha256", "value", "item",],
		}

		// 1. Find the right synonym
		// 2. 
		var selectedsynonyms = [paramname]
		for (const [key, value] of Object.entries(synonyms)) {
			if (key === paramname || value.includes(paramname)) {
				if (!value.includes(key)) {
					value.push(key.toLowerCase())
				}

				selectedsynonyms = value
				break	
			}
		}
		//console.log("SELECTED: ", selectedsynonyms)

		//console.log("SYNONYMS FOR ", paramname, selectedsynonyms)
		var toreturn = ""

		for (const [key, value] of Object.entries(exampledata)) {
			// Check if loop or JSON
			const extra = basekey.length > 0 ? splitkey : ""
			const basekeyname = `${basekey.slice(1, basekey.length).split(".").join(splitkey)}${extra}${key}`

			// Handle direct loop!
			//if (!isNaN(key) && basekey === "") {
			//	//console.log("Handling direct loop: ", key, value)
			//	//parsedValues.push({"type": "object", "name": "Node", "autocomplete": `${basekey}`})
			//	//parsedValues.push({"type": "list", "name": `${splitkey}list`, "autocomplete": `${basekey}.#`})
			//	//for (var subkey in returnValues) {
			//	//	parsedValues.push(returnValues[subkey])
			//	//}

			//	toreturn = GetParsedPaths(paramname, value, `${basekey}.#`)
			//	console.log("LIST, TORETURN: ", value, toreturn)
			//	if (toreturn.length > 0) {
			//		break
			//	}
			//}

			//console.log("KEY: ", key, "VALUE: ", value, "BASEKEY: ", basekeyname)
			if (typeof(value) === 'object') {
				if (Array.isArray(value)) {
					//console.log("LIST!!: ", value, key)
					var selectedkey = ""
					if (isNaN(key)) {
						selectedkey = `.${key}`
					}

					for (var subitem in value) {
						toreturn = GetParamMatch(paramname, value[subitem], `${basekey}${selectedkey}.#`)
						if (toreturn.length > 0) {
							break
						}
					}

					if (toreturn.length > 0) {
						break
					}
				} else {
					var selectedkey = ""
					if (isNaN(key)) {
						selectedkey = `.${key}`
					}

					toreturn = GetParamMatch(paramname, value, `${basekey}${selectedkey}`)
					//console.log("OBJECT: ", value, toreturn, key)
					if (toreturn.length > 0) {
						break
					}
				}
				//console.log("VALUE IS OBJECT: ", key, value)
			} else {
				//console.log("SINGLE ITEM: ", key)
				if (selectedsynonyms.includes(key.toLowerCase())) {
					//parsedValues.push({"type": "value", "name": basekeyname, "autocomplete": `${basekey}.${key}`, "value": value,})
					//console.log("STRING: ", key, value)
					toreturn = `${basekey}.${key}`
					//toreturn = basekeyname
					break
				}
			}
		}

		return toreturn
	}

	// Takes an action as input, then runs through and updates the relevant fields
	// based on previous actions' 
	const RunAutocompleter = (dstdata) => {
		// **PS: The right action should already be set here**
		// 1. Check execution argument
		// 2. Check parents in order
		var exampledata = GetExampleResult({"id": "exec", "name": "exec",})
		//console.log("EXAMPLE RETURN: ", exampledata)
		var parentlabel = "exec"
		for (var paramkey in dstdata.parameters) {
			const param = dstdata.parameters[paramkey]
			// Skip authentication params
			if (param.configuration) {
				continue
			}

			const paramname = param.name.toLowerCase().trim().replaceAll("_", " ")
			//console.log("PARAM: ", param)
			//console.log("PARAMNAME: ", paramname)

			const foundresult = GetParamMatch(paramname, exampledata, "")
			if (foundresult.length > 0) {
				//console.log("FOUND: ", paramname, foundresult)

				if (dstdata.parameters[paramkey].value.length === 0) {
					dstdata.parameters[paramkey].value = `$${parentlabel}${foundresult}`
				} else {
					//console.log("Skipping ", dstdata.parameters[paramkey], " because it already has a value")
				}
			}
		}
		
		var parents = getParents(dstdata)
		//console.log("PARENTS: ", parents)
		if (parents.length > 1) {
			for (var key in parents) {
				const item = parents[key]
				if (item.label === "Execution Argument") {
					continue
				}

				parentlabel = item.label.toLowerCase().trim().replaceAll(" ", "_")
				exampledata = GetExampleResult(item)
				for (var paramkey in dstdata.parameters) {
					const param = dstdata.parameters[paramkey]
					// Skip authentication params
					if (param.configuration) {
						continue
					}

					const paramname = param.name.toLowerCase().trim().replaceAll("_", " ")
					//console.log("PARAM: ", param)
					//console.log("PARAMNAME: ", paramname)

					const foundresult = GetParamMatch(paramname, exampledata, "")
					if (foundresult.length > 0) {
						//console.log("FOUND: ", paramname, foundresult)

						if (dstdata.parameters[paramkey].value.length === 0) {
							dstdata.parameters[paramkey].value = `$${parentlabel}${foundresult}`
						} else {
							//console.log("Skipping ", dstdata.parameters[paramkey], " because it already has a value")
						}
					}
				}
				// Check agains every param 
			}
		}

		return dstdata
	}

	//const FixNameUpdater = (sourcenode) => {
	//}

	// Checks for errors in edges when they're added 
	const onEdgeAdded = (event) => {
		const edge = event.target.data()
		console.log("EDGE ADDED: ", edge)
		//setLastSaved(false)
		var targetnode = workflow.triggers.findIndex(data => data.id === edge.target)
		if (targetnode !== -1) {
			console.log("TARGETNODE: ", targetnode)
			if (workflow.triggers[targetnode].app_name === "User Input" || workflow.triggers[targetnode].app_name === "Shuffle Workflow") {
			} else {
				alert.error("Can't have triggers as target of branch")
				event.target.remove()
			}
		}

		console.log("TARGET: ", event.target.target().data())
		if (event.target.target().data("isButton") === true || event.target.target().data("isDescriptor") === true) {
			event.target.remove()
			return
		}

		targetnode = -1
		var sourcenode = workflow.triggers.findIndex(data => data.id === edge.source)
		console.log("SOURCENODE: ", sourcenode)
		if (sourcenode !== -1) {
			if (workflow.triggers[sourcenode].app_name === "User Input" || workflow.triggers[sourcenode].app_name === "Shuffle Workflow") {
				//console.log("NORMAL TRIGGER")
			} else {
				//var currentnode = cy.getElementById(workflow.triggers[sourcenode].id)
				//console.log("NODE: ", currentnode)
				//if (currentnode !== null && currentnode !== undefined) {
				//	console.log("SHOULD CHECK IF TRIGGER HAS MULTIPLE EDGES: ", currentnode)
				//if (workflow.branches !== undefined && workflow.branches !== null) {
				//	const found_branches = workflow.branches.filter(branch => branch.source == workflow.triggers[sourcenode].id)
				//	console.log("FOUND BRANCHES: ", found_branches)
				//	if (found_branches.length > 0) {
				//		alert.error("Can't have multiple branches from this trigger")
				//		event.target.remove()	
				//	}
				//}

				//if (cy.edges().size() === 1) {
				// https://js.cytoscape.org/#edges.connectedNodes
				//console.log("CURRENTNODE: ", currentnode)
				//console.log("EDGES: ", currentnode.connectedEdges(`node[id=${workflow.triggers[sourcenode].id}]`))
				//console.log("EDGES2: ", currentnode.connectedEdges())
				//currentnode.connectedEdges().animate({style: {lineColor: "red"}})
				//console.log("OUTGOERS: ", currentnode.outgoers())

				//console.log("LEN2: ", currentnode.edges().length)
				//if (currentnode.connectedNodes().length > 0) {
				//	alert.error("Can't have multiple branches from this trigger")
				//	event.target.remove()
				//} 
			} 
		}


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
				targetnode = workflow.triggers.findIndex(data => data.id === edge.source)
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
				//console.log("INSIDE LAST CHECK: ", edge)

				// Find the targetnode and check if its a trigger 
				// FIXME - do this for both actions and other types?
				/*
				targetnode = workflow.triggers.findIndex(data => data.id === edge.target)
				if (targetnode !== -1) {
					console.log("TARGETNODE: ", targetnode)
					if (workflow.triggers[targetnode].app_name === "User Input" || workflow.triggers[targetnode].app_name === "Shuffle Workflow") {
					} else {
						alert.error("Can't have triggers as target of branch")
						event.target.remove()
						found = true
						break
					}
				} 
				*/

				
			}
		}


		// 1. Guess what the next node's action should be
		// 2. Get result from previous nodes (if any)
		// 3. TRY to automatically map them in based on synonyms
		const newsource = cy.getElementById(edge.source)
		const newdst = cy.getElementById(edge.target)
		if (newsource !== undefined && newsource !== null && newdst !== undefined && newdst !== null) {
			//const srcdata = newsource.data()
			//console.log("EDGE: ", edge)
			const dstdata = RunAutocompleter(newdst.data())
			console.log("DST: ", dstdata)
		}

		var newbranch = { 
			"source_id": edge.source,
			"destination_id": edge.target,
			"id_": edge.id,
			"id": edge.id,
			"hasErrors": false,
			"decorator": false,
		}

		if (!found) {
			newbranch["hasErrors"] = false

			workflow.branches.push(newbranch)
			setWorkflow(workflow)
		}

		history.push({
			"type": "edge",
			"action": "added",
			"data": edge,
		})
		setHistory(history)
		setHistoryIndex(history.length)
	}

	const onNodeAdded = (event) => {
		const node = event.target
		const nodedata = event.target.data()
		if (nodedata.finished === false || (nodedata.id !== undefined && nodedata.is_valid === undefined)) {
			console.log("RETURNING (NOT ADDING) NODE ADD FOR: ", nodedata)
			return
		}

		//console.log("IS IT ADDED TO THE WORKFLOW?: ", nodedata)
		if (node.isNode() && cy.nodes().size() === 1) {
			//setStartNode(node.data('id'))
			workflow.start = node.data('id')
			nodedata.isStartNode = true
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
		}

		if (nodedata.type === "ACTION") {
			if (workflow.actions.length === 1 && workflow.actions[0].id === workflow.start) {
				const newEdgeUuid = uuid.v4()
				const newcybranch = { 
					"source": workflow.start,
					"target": nodedata.id,
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

			if (nodedata.app_name === "Shuffle Tools") {
				const iconInfo = GetIconInfo(nodedata)
				const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
				const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)
				nodedata.large_image = svgpin_Url
				nodedata.fillGradient = iconInfo.fillGradient
				nodedata.fillstyle = "solid"
				if (nodedata.fillGradient !== undefined && nodedata.fillGradient !== null && nodedata.fillGradient.length > 0) {
					nodedata.fillstyle = 'linear-gradient'
				} else {
					nodedata.iconBackground = iconInfo.iconBackgroundColor
				}
			}

			if (workflow.actions === undefined || workflow.actions === null) {
				workflow.actions = [nodedata]
			} else {
				workflow.actions.push(nodedata)
			}

			setWorkflow(workflow)
		} else if (nodedata.type === "TRIGGER") {
			if (workflow.triggers === undefined) {
				workflow.triggers = [nodedata]
			} else {
				workflow.triggers.push(nodedata)
			}

			const newEdgeUuid = uuid.v4()
			const newcybranch = { 
				"source": nodedata.id,
				"target": workflow.start,
				"source_id": nodedata.id,
				"destination_id": workflow.start,
				"_id": newEdgeUuid,
				"id": newEdgeUuid,
				"hasErrors": false,
				"decorator": false,
			}

			const edgeToBeAdded = {
				group: "edges",
				data: newcybranch,
			}

			if (nodedata.name !== "User Input" && nodedata.name !== "Shuffle Workflow") {
				//workflow.branches.push(newbranch)
				if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
					cy.add(edgeToBeAdded)
				}
			}

			//if (data.trigger_type === "WEBHOOK") {
			//	newWebhook(newAppData)
			//	saveWorkflow(workflow)
			//}

			setWorkflow(workflow)
		}


		if (nodedata.app_name !== undefined) {
			history.push({
				"type": "node",
				"action": "added",
				"data": nodedata,
			})
			setHistory(history)
			setHistoryIndex(history.length)
		}

		//if (nodedata.app_name !== undefined && ((
		//	nodedata.app_name !== "Shuffle Tools" &&
		//	nodedata.app_name !== "Testing" &&
		//	nodedata.app_name !== "Shuffle Workflow" &&
		//	nodedata.app_name !== "User Input" &&
		//	nodedata.app_name !== "Webhook" &&
		//	nodedata.app_name !== "Schedule" &&
		//	nodedata.app_name !== "Email") || nodedata.isStartNode) 
		//) {
		//	const allNodes = cy.nodes().jsons()
		//	var found = false
		//	for (var key in allNodes) {
		//		const currentNode = allNodes[key]
		//		if (currentNode.data.attachedTo === nodedata.id && currentNode.data.isDescriptor) {
		//			found = true 
		//			console.log("FOUND THE NODE!")
		//			break
		//		}
		//	}

		//	// Readding the icon after moving the node
		//	if (!found) {
		//		console.log("Node wasn't found")
		//		const iconInfo = GetIconInfo(nodedata)
		//		const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
		//		const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)

		//		const offset = nodedata.isStartNode ? 36 : 44
		//		const decoratorNode = {
		//			position: {
		//				x: event.target.position().x+offset,
		//				y: event.target.position().y+offset,
		//			},
		//			locked: true,
		//			data: {
		//				"isDescriptor": true,
		//				"isValid": true,
		//				"is_valid": true,
		//				"label": "",
		//				"image": svgpin_Url,
		//				"imageColor": iconInfo.iconBackgroundColor,
		//				"attachedTo": nodedata.id,
		//			},
		//		}

		//		cy.add(decoratorNode)
		//	} else {
		//		console.log("Node already exists - don't add descriptor node")
		//	}
		//} else {
		//	//console.log("Shouldnt re-add info? ")
		//}
		
	}

	const onEdgeRemoved = (event) => {
		setLastSaved(false)
		const edge = event.target

		workflow.branches = workflow.branches.filter(a => a.id !== edge.data().id)
		setWorkflow(workflow)
		event.target.remove()

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

		if (edge.data().source !== undefined) {
			history.push({
				"type": "edge",
				"action": "removed",
				"data": edge.data().source,
			})
			setHistory(history)
			setHistoryIndex(history.length)
		}
	}

	const onNodeRemoved = (event) => {
		const node = event.target
		const data = node.data()

		if (data.finished === false) {
			return
		}

		//setLastSaved(false)

		workflow.actions = workflow.actions.filter(a => a.id !== data.id)
		workflow.triggers = workflow.triggers.filter(a => a.id !== data.id)
		if (workflow.start === data.id && workflow.actions.length > 0) {
			// FIXME - should check branches connected to startnode, as picking random
			// is just confusing
			if (workflow.actions[0].id !== data.id) {
				const ele = cy.getElementById(workflow.actions[0].id)
				if (ele !== undefined && ele !== null) {
					ele.data("isStartNode", true)
					workflow.start = ele.id()
				}
			} else {
				if (workflow.actions.length > 1) {
					const ele = cy.getElementById(workflow.actions[1].id)
					if (ele !== undefined && ele !== null) {
						ele.data("isStartNode", true)
						workflow.start = ele.id()
					}
				}
			}

			//cy.nodes().some(function( ele ) {
			//	if (ele.id() !== workflow.start && ele.data()["label"] !== undefined) {
			//		//alert.success("Changed startnode to "+ele.data()["label"])
			//		ele.data("isStartNode", true)
			//		workflow.start = ele.id()
			//		throw BreakException
			//		return false 
			//	}
			//})
		}

		if (data.app_name !== undefined) {
			//console.log("Trying to remove friendly nodes")
			const allNodes = cy.nodes().jsons()
			//console.log("NOT UNDEFINED IN HOVEROUT!", allNodes)
			for (var key in allNodes) {
				const currentNode = allNodes[key]
				if (currentNode.data.attachedTo === data.id) {
					cy.getElementById(currentNode.data.id).remove()
				}
			}

			history.push({
				"type": "node",
				"action": "removed",
				"data": data,
			})
			setHistory(history)
			setHistoryIndex(history.length)
		}


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
					if (configureWorkflowModalOpen === true) {
						setConfigureWorkflowModalOpen(false)
					}
	        break;
			case 46:
				//removeNode()		
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
					//handleHistoryUndo() 
				}

	      break;
			case 67:
				if (previouskey === 17) {
					console.log("CTRL+C")
					const filteredelements = cy.filter(function(element, i){
						return element.hasClass('selected')
					})

					for (var key in filteredelements) {
					}

					var copyText = document.getElementById("copy_element_shuffle")
					if (copyText !== undefined && copyText !== null) {
						const clipboard = navigator.clipboard
						if (clipboard === undefined) {
							alert.error("Can only copy over HTTPS (port 3443)")
							return
						}
					}
					console.log("FILTERED: ", filteredelements)
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
				//if (previouskey === 17) {
				//	event.preventDefault()
				//	cy.fit(null, 50)
				//}
	      //break;
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


	if (!firstrequest && graphSetup && established && props.match.params.key !== workflow.id && workflow.id !== undefined && workflow.id !== null && workflow.id.length > 0) {
		//console.log(props.match.params.key, workflow.id)
		//getWorkflow()
		//setCy()
		//getWorkflowExecution(props.match.params.key, "")
		//setEstablished(false)
		//setGraphSetup(false)
		window.location.pathname = "/workflows/"+props.match.params.key
	}

	useEffect(() => {
		if (firstrequest) {
			setFirstrequest(false)
			getWorkflow(props.match.params.key, {})
			getApps()
			getAppAuthentication()
			getEnvironments()
			getWorkflowExecution(props.match.params.key, "")
			getAvailableWorkflows(-1) 
			getSettings() 

			const cursearch = typeof window === 'undefined' || window.location === undefined ? "" : window.location.search
			const tmpView = new URLSearchParams(cursearch).get("view")
			if (tmpView !== undefined && tmpView !== null && tmpView === "executions") {
				setExecutionModalOpen(true)

				const newitem = removeParam("view", cursearch) 
				props.history.push(curpath+newitem)
			}
			return
		} 


		// App length necessary cus of cy initialization
		//console.log("PRE ELEMENTS: !", workflow.actions, graphSetup, apps, authLoaded, cy)
		if (elements.length === 0 && workflow.actions !== undefined && !graphSetup && Object.getOwnPropertyNames(workflow).length > 0) {
			setGraphSetup(true)
			setupGraph()

			//console.log("IN ELEMENT CHECK!")
		} else if (!established && cy !== undefined && apps !== null && apps !== undefined && apps.length > 0 && Object.getOwnPropertyNames(workflow).length > 0 && authLoaded){
			//This part has to load LAST, as it's kind of not async. 
			//This means we need everything else to happen first.
			//
			//console.log("IN THIS PART AGAIN")
			
			//console.log("IN ESTABLISHED!")

			setEstablished(true)
			// Validate if the node is just a node lol
			console.log("CY: ", cy)
			//console.log("CY: ", cy.edgehandles())
			//try {
			cy.edgehandles({
				handleNodes: (el) => el.isNode() && !el.data("isButton") && !el.data("isDescriptor"),
				preview: false,
				toggleOffOnLeave: false,
				loopAllowed: function( node ){
					return false;
				},
			})
			//} catch (e) {
			//	console.log("Error in edgehandles: ", e)
			//}

			cy.fit(null, 200)

			cy.on('boxselect', 'node', (e) => {
				if (e.target.data("isButton") || e.target.data("isDescriptor")) {
					e.target.unselect()
				}

				e.target.addClass("selected")
			})

			cy.on('boxstart', (e) => {
				console.log("START")
				cy.removeListener('select')
				//onNodeSelect(e, appAuthentication)
			})
			cy.on('boxend', (e) => {
				console.log("END")
				cy.removeListener('select')
				//onNodeSelect(e, appAuthentication)
			})

			cy.on('select', 'node', (e) => {
				onNodeSelect(e, appAuthentication)
			})
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

			// Handles dragging
			cy.on('drag', 'node', (e) => onNodeDrag(e, selectedAction))
			cy.on('free', 'node', (e) => onNodeDragStop(e, selectedAction))

			cy.on('cxttap', "node", (e) => onCtxTap(e))

			//let popper2 = cy.popper({
			//  content: () => {
			//    let div = document.createElement('div');
			//
			//    div.innerHTML = 'Popper content'
			//
			//    document.body.appendChild(div)
			//
			//    return div
			//  },
			//  renderedPosition: () => ({ x: 100, y: 200 }),
			//  popper: {} // my popper options here
			//});

			//let popper1 = cy.nodes()[0].popper({
			//  content: () => {
			//    let div = document.createElement('div')
			//
			//    div.innerHTML = 'Popper content'
			//    document.body.appendChild(div)
			//
			//    return div
			//  },
			//  popper: {} // my popper options here
			//})
			//let update = () => {
			//  popper.update()
			//}

			//let node = cy.nodes().first()
			//node.on('position', update)


			


			//cy.on('mouseover', 'node', () => $(targetElement).addClass('mouseover'));

			//cy.on('cxttapstart', 'node', (e) => edgeHandler.start(e.target))
			//cy.on('cxttapend', 'node', (e) => edgeHandler.stop())
			//cy.on('cxtdragover', 'node', (e) => edgeHandler.preview(e.target))
			//cy.on('cxtdragout', 'node', (e) => edgeHandler.unpreview(e.target))

			document.title = "Workflow - "+workflow.name
			registerKeys()
			//setStartNode(workflow.start)
		} else if (established) {
			//console.log("established - should fix colors of things")	
			//console.log(cy.elements())	
		}
	})

	//}, [selectedAction])

	var previousnodecolor = ""
	//var previousedgecolor = ""
	const animationDuration = 150
	const onNodeHoverOut = (event) => {
		const nodedata = event.target.data()
		if (nodedata.app_name !== undefined) {
			const allNodes = cy.nodes().jsons()
			for (var key in allNodes) {
				const currentNode = allNodes[key]
				if (currentNode.data.isButton && currentNode.data.attachedTo !== nodedata.id) {
					cy.getElementById(currentNode.data.id).remove()
				}
			}
		}

		var parsedStyle = {
			"border-width": "1px",
			'font-size': '18px',
		}

		if ((nodedata.app_name === "Testing" || nodedata.app_name === "Shuffle Tools") && !nodedata.isStartNode) {
			parsedStyle = {
				"border-width": "1px",
				'font-size': '0px',
			}
		}

		event.target.animate({
			style: parsedStyle,
		}, {
			duration: animationDuration,	
		})
	}

	const buttonColor = "rgba(255,255,255,0.9)"
	const buttonBackgroundColor = "#1f2023"
	const addCopyButton = (event) => {
		var parentNode = cy.$('#' + event.target.data("id"));
		if (parentNode.data('isButton') || parentNode.data('buttonId'))
			return

		//parentNode.lock()
		const px = parentNode.position('x') - 65
		const py = parentNode.position('y') - 25
		const circleId = newNodeId = uuid.v4()

		parentNode.data('circleId', circleId)

		const iconInfo = {
			"icon": "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm-1 4l6 6v10c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h7zm-1 7h5.5L14 6.5V12z",
			"iconColor": buttonColor,
			"iconBackgroundColor": buttonBackgroundColor,
		}

		const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
		const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)

		cy.add({
				group: 'nodes',
				data: { 
					weight: 30, 
					id: circleId, 
					name: "TEEEXT", 
					isButton: true, 
					buttonType: "copy",
					attachedTo: event.target.data("id"),
					icon: svgpin_Url,
					iconBackground: iconInfo.iconBackgroundColor,
					is_valid: true,
				},
				position: { x: px, y: py },
				locked: true
		})
		//.unselectify()
	}

	const addDeleteButton = (event) => {
		var parentNode = cy.$('#' + event.target.data("id"));
		if (parentNode.data('isButton') || parentNode.data('buttonId'))
			return

		//parentNode.lock()
		const px = parentNode.position('x') - 65
		const py = parentNode.position('y') + 25
		const circleId = newNodeId = uuid.v4()

		parentNode.data('circleId', circleId)

		const iconInfo = {
			"icon": "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
			"iconColor": buttonColor,
			"iconBackgroundColor": buttonBackgroundColor,
		}
		const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
		const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)

		cy.add({
				group: 'nodes',
				data: { 
					weight: 30, 
					id: circleId, 
					name: "TEEEXT", 
					isButton: true, 
					buttonType: "delete",
					attachedTo: event.target.data("id"),
					icon: svgpin_Url,
					iconBackground: iconInfo.iconBackgroundColor,
					is_valid: true,
				},
				position: { x: px, y: py },
				locked: true
		})
		//.unselectify()
	}

	const onNodeHover = (event) => {
		//console.log("TAR: ", event.target)
		const nodedata = event.target.data()
		if (nodedata.finished === false) {
			return
		}

		var parentNode = cy.$('#' + event.target.data("id"));
		if (parentNode.data('isButton') || parentNode.data('buttonId'))
			return

		if (nodedata.app_name !== undefined) { 
			const allNodes = cy.nodes().jsons()

			var found = false
			for (var key in allNodes) {
				const currentNode = allNodes[key]
				if (currentNode.data.isButton && currentNode.data.attachedTo !== nodedata.id) {
					cy.getElementById(currentNode.data.id).remove()
				} 

				if (currentNode.data.isButton && currentNode.data.attachedTo === nodedata.id) {
					found = true
				}
			}

			if (!found) {
				addDeleteButton(event)
				addCopyButton(event) 
			}
		}


		const parsedStyle = {
			"border-width": "7px",
			"border-opacity": ".7",
			'font-size': '25px',
			'color': 'white',
		}

		event.target.animate({
			style: parsedStyle
		}, {
			duration: animationDuration,	
		})

		previousnodecolor = event.target.style("border-color")
	}

	const onEdgeHoverOut = (event) => {
		if (event === null || event === undefined) {
			event.target.removeStyle()
			return 
		}

		const edgeData = event.target.data()
		if (edgeData.decorator === true) {
			return
		}

		event.target.removeStyle()
	}

	// This is here to have a proper transition for lines
	const onEdgeHover = (event) => {
		if (event === null || event === undefined) {
			return 
		}

		const edgeData = event.target.data()
		if (edgeData.decorator === true) {
			return
		}

		const sourcecolor = cy.getElementById(event.target.data("source")).style("border-color")
		const targetcolor = cy.getElementById(event.target.data("target")).style("border-color")
		if (sourcecolor !== null && sourcecolor !== undefined && targetcolor !== null && targetcolor !== undefined) {
			event.target.animate({
				style: {
					'target-arrow-color': targetcolor,
					"line-fill": "linear-gradient",
					"line-gradient-stop-colors": [sourcecolor, targetcolor],
					"line-gradient-stop-positions": [0, 1],
				},
				duration: 0,
			})
		}
	}

	const setupGraph = () => {
		const actions = workflow.actions.map(action => {
			const node = {}

			if (!action.isStartNode && action.app_name === "Shuffle Tools") {
				const iconInfo = GetIconInfo(action)
				const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
				const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)
				action.large_image = svgpin_Url
				action.fillGradient = iconInfo.fillGradient
				action.fillstyle = "solid"
				if (action.fillGradient !== undefined && action.fillGradient !== null && action.fillGradient.length > 0) {
					action.fillstyle = 'linear-gradient'
					//console.log("GRADIENT!: ", action)
					//action.fillstyle = 
					//'background-fill': 'data(fillstyle)',
				} else {
					action.iconBackground = iconInfo.iconBackgroundColor
				}
				//console.log("FOUND NODE INFO: ", action)
			}

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

		const decoratorNodes = workflow.actions.map(action => {
			if (!action.isStartNode) {
				if (action.app_name === "Testing") {
					return null
				} else if (action.app_name === "Shuffle Tools") {
					return null
				}
			}

			const iconInfo = GetIconInfo(action)
			const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
			const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)

			const offset = action.isStartNode ? 36 : 44
			const decoratorNode = {
				position: {
					x: action.position.x+offset,
					y: action.position.y+offset,
				},
				locked: true,
				data: {
					"isDescriptor": true,
					"isValid": true,
					"is_valid": true,
					"label": "",
					"image": svgpin_Url,
					"imageColor": iconInfo.iconBackgroundColor,
					"attachedTo": action.id,
				},
			}
			return decoratorNode
			return null
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
		var insertedNodes = [].concat(actions, triggers, decoratorNodes)
		insertedNodes = insertedNodes.filter(node => node !== null)

		var edges = workflow.branches.map((branch, index) => {
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
				hasErrors: branch.has_errors,
				decorator: false,
			}

			// This is an attempt at prettier edges. The numbers are weird to work with.
			/*
			//http://manual.graphspace.org/projects/graphspace-python/en/latest/demos/edge-types.html
			const sourcenode = actions.find(node => node.data._id === branch.source_id)
			const destinationnode = actions.find(node => node.data._id === branch.destination_id)
			if (sourcenode !== undefined && destinationnode !== undefined && branch.source_id !== branch.destination_id) { 
				//node.data._id = action["id"]
				console.log("SOURCE: ", sourcenode.position)
				console.log("DESTINATIONNODE: ", destinationnode.position)

				var opposite = true 
				if (sourcenode.position.x > destinationnode.position.x) {
					opposite = false 
				} else {
					opposite = true 
				}

				edge.style = {
					'control-point-distance': opposite ? ["25%", "-75%"] : ["-10%", "90%"],
					'control-point-weight': ['0.3', '0.7'],
				}
			}
			*/

			return edge;
		})

		if (workflow.visual_branches !== undefined && workflow.visual_branches !== null && workflow.visual_branches.length > 0) {
			const visualedges = workflow.visual_branches.map((branch, index) => {
				const edge = { };

				if (workflow.branches[index] === undefined) {
					return {}
				}

				var conditions = workflow.branches[index].conditions
				if (conditions === undefined || conditions === null) {
					conditions = []
				}

				const label = "Subflow"
				edge.data = {
					id: branch.id,
					_id: branch.id,
					source: branch.source_id,
					target: branch.destination_id,
					label: label,
					decorator: true,
				}

				return edge;
			})

			edges = edges.concat(visualedges)
		}

		setWorkflow(workflow)

		// Verifies if a branch is valid and skips others
		var newedges = []
		for (var key in edges) {
			var item = edges[key]
			if (item.data === undefined) {
				continue
			}

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

		if (selectedNode.data().decorator === true) {
			alert.info("This edge can't be deleted.")
		} else { 
			selectedNode.remove()
		}

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
				if (responseJson.reason !== undefined) {
					alert.error("Failed to stop schedule: " + responseJson.reason)
				}
			} else {
				alert.success("Successfully stopped schedule")
			}

			workflow.triggers[triggerindex].status = "stopped" 
			trigger.status = "stopped" 
			setSelectedTrigger(trigger)
			setWorkflow(workflow)
			saveWorkflow(workflow)
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


	const paperAppStyle = {
		borderRadius: theme.palette.borderRadius,
		minHeight: 100,
		maxHeight: 100,
		minWidth: "100%",
		maxWidth: "100%",
		marginTop: "5px",
		color: "white",
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
	}

	const paperVariableStyle = {
		borderRadius: theme.palette.borderRadius,
		minHeight: 50,
		maxHeight: 50,
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
			console.log("Delete:" ,variableName)
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
						What are <a rel="norefferer" target="_blank" href="https://shuffler.io/docs/workflows#workflow_variables" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>WORKFLOW variables?</a>
					{workflow.workflow_variables === null ? 
					null : workflow.workflow_variables.map((variable, index) => {
						return (
							<div key={index} >
								<Paper square style={paperVariableStyle} onClick={() => {
								}}>
									<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: "2px", backgroundColor: yellow, marginRight: "5px"}} />
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
						What are <a rel="norefferer" target="_blank" href="https://shuffler.io/docs/workflows#execution_variables" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>EXECUTION variables?</a>
					{workflow.execution_variables === null || workflow.execution_variables === undefined ? 
					null : workflow.execution_variables.map(variable=> {
						return (
							<div>
								<Paper square style={paperVariableStyle} onClick={() => {
								}}>
									<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: "2px", backgroundColor: yellow, marginRight: "5px"}} />
									<div style={{display: "flex", width: "100%"}}>
										<div style={{flex: "10", marginTop: "15px", marginLeft: "10px", overflow: "hidden"}} onClick={() => {
											setNewVariableName(variable.name)
											setExecutionVariablesModalOpen(true)
										}}>
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
		var thisview = <AppView allApps={apps} prioritizedApps={prioritizedApps} filteredApps={filteredApps} />
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
			"large_image": 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4wYNAxEP4A5uKQAAGipJREFUeNrtXHt4lNWZf8853zf3SSZDEgIJJtxCEnLRLSkXhSKgTcEL6yLK1hZWWylVbO1q7SKsSu3TsvVZqF2g4haoT2m9PIU+gJVHtFa5NQRD5FICIUAumBAmc81cvss5Z/845MtkAskEDJRu3r8Y8n3nfc/vvOe9zyDOOQxScoRvtAA3Ew2C1Q8aBKsfNAhWP2gQrH7QIFj9oEGw+kGDYPWDBsHqBw2C1Q+SbrQAPSg+/ULoRkvTjf4uwOKMAeeAEMI4AaBuf7rRhG5kIs05Zxxh1AUQ5yymUkVFgLBFxhZzbw///wGLUyZ2zikLn2oIVJ3o+NtZ5Xyb5u/gmgYAyCTLLqdlRKajaFRqeZFtTA7C+BJk5MZo2Y0Ai3EOHGGshyIX393btnNv5FQjjSoIYyQRRDBgdOkxyriuc8aJzeIozMu4d2rG16YQm4UzhtANULHrDRZnDGHMGW/b9lHzxh3RxlZslrHFjDAG4JxziBcHAUIIAHHGWFRhqmYblZ3z7bmZc24HAM75dTZk1xUsThkiWPn84umVv/btrSF2K7aYOGPA+pYBYQQIs5hCo8qQGRNGP/9vpky3WPAfECyxseCntSef+6Xq8UupDk4Z9Jc7QohgzR+yDMsY9/OlzpIx1xOv6wSW2JJvb03tM78AxrHVzHWaiAJGAMA5F4p2KYzgnHMG3WVEEqGRGDbJhWt+kFpedN3wuh5gCTsVPHzyb9/9L845Nkmcsm5CEMw0yiIxzhg2ycgkAQemqFyniBBiMyOJXOYVRcNmuXjDMntBnmBx84PFOSCktvmOLHxR9fiJ1Ry/bYQxZ0wPhk3pLtek4tQJhda84cRpA8Y0bzBS3xz4tDZYXav5QlKKXTwcjxcNxyy3ZJVufkFKtQtG/whg1f77Lzy7K+U0Z/ztQwTTiIJN0rAFdw97+G5TRlrihjkAAuVzT8tbu1ve3s01SmzdsZaI5g1m/cudY158/Doo18CCJTbg2V158plfXLLocUjpoYhtdE7+T5bYx+WKaJNR2mW8GOMciERESBWuPXdq2brIuRbJYU3QTRqOFq37oWtSyUDjNZBHwQFhzCk9v3knkqV4Iy2QcpaMKfnf5fZxuZxSRhlgREwykSVMCCaEyLJkkhHGlFKuU3tBXvH/LncU5Okd0QRzzjk/v2kngAjKBpAGULPEOXv/8umJ7/+3lGLvUgeMuKKZhrpLNv6nKcPFKeUIYYxVVa2srKyurm5ra+Ocp6enl5WVTZo0yW63M8YQ40giyueeo4+u1HwhJEtG2IEwohFl/Gv/kTqhcECVa8CrDhd3HUhw/MCBUzbquYXxSFVVVb322mv19fWcc0IIAFBKt2/fnp2dvWjRorvuuosBA52ah6ePfPYbtc++KpnkrmNGiGm65739qRMKYSAt8ICBxTnCWPd3hGrqsNXEO2N0RLAeDKffNTHtjjLOmEBq+/bta9askSQpJSUFRKjVeafa29tXrlx57ty5b3/72wwYMDZkZrl76q3eTw5LDptwjpxxYjEFDp2gkRixWQbOLQ6UxooNh+sa1Yu++CvDOUeEDJ03AwAYYxjjysrKNWvW2Gw2i8VCKaWUMsYYY+LfJpPJ7Xa/8cYbW7duxRgzygAga96M7k6TI5OstHgi9ecN1jcTWOI6hOuamKp12V2EWEyz5g1LuTUfAIgkqaq6YcMGSZIwxoyxnssI4FJSUjZv3nz+/HkiSxwg5bYCS3YGUzUDMoQRjamR+maD9U0FFgAAKOfb4j8ijLiq2gvzsNlENR0A/vrXv545c8ZqtV4WqUuwcy5JUiAQePfddwGA6TpxWO1jb2GKGuf+EHDeye6m0ywEAKB6At19E+KM20ZmCwwA4NChQ8ncGsaY2WyuqakBAIwwAFhGZHLGoOsuckBIC3R08b6ZwAIEACyqAEJxJ80BITnNCSJPBmhpaSGEJIMXIcTr9YZCIRFkSSkO4Im4cI32uc7fJ1gCMdTjUvD4/I5Smnwk2R3TnvhybJYHdDcDBxYHAOKwivwu/r/VNp+xc5fL1Yu1iidKqdvtdjgcwBgA6MEIksilAjQAAAIO8pDUK+D4dw4WBwAwZ6bF6xFwQBIJ1zaI3QFAfn5+Msol4vuioiKEEKUMAMKnGvVAB4sqAIAIRhghgq25WWAsfTOBBQAA1lHZ8QER54xYzKEjdbHzF4kkAcC0adNSU1P7xIsxJsvytGnToNPYDX/kazmP3WcdORwY1/whzRfEZpM9PxcGMkMcqAheSOwoHNmtSMAByUT1Bi5s+yj3yflU1YYPH37fffdt3rw5IyND07TLLoUxjkQixcXFZWVlAIAJBoC020vTbi/llEbPtgQ/O+X75DAgZM0bBgBxd/MmAUtIbBuTYxuT03H8LLaZRbGYMyY5bK1v7U6/a5J93C3A2KJFi86ePfvxxx+73W6EEO8kYyURZ/l8Pr/f73K5OOcIIc4YcECECBZZ/zIjsU49AERefPHFAVpatFH1QNi3t4ZYLV1FAkJoROk4Vp9RMRmbTRjgjqlTFUU5fvx4OBxmjBFCJEmKx0uW5ZaWFoTQhAkTRJKEuspeHBgDQNehDD+AYCEEgJBleMbFXQeYonRFp5xjsxxrbus4cTZ9ZjkyyRjQpMmTJk2a5HA4CCHBYDAYDJrNXb17zrnZbD516tTkyZPdbrdQrk4uCGE80JWsAQdLtOYlp412RPz7jxK7pas/yDmxWiKnmwNVf3NNKpZTHUyn6RkZEyZMqKiomDlzJqX02LFjstwVNxFCOjo6gsHgV77ylXiwricNJFidymUvHOn96FPNF8Iy6YqBOCdWS6y5zbPrgGVYhn3sCM454xwB2Gy2iRMnyrJ84MABi8Ui7iPn3GKxnD59urCwMCcnh4kO/j8SWIAQZ4xYTObsjIvv7sMmU7euKufEYqJR5eJ7+yOnmx35t5jcKUh08TkvLS2tra09d+6c2Ww2Klyapn3++ecVFRX4RkwgDXyvDWPOmHvabTmL7lG9ASSR+L9yypAkSU57+wdVNQ8tC59sAIRwZ1S5cOFCWe6qiDLG7Hb70aNH33vvPQCgdMDd3/UGS+AFnOc+9VBGxRTN40+skXMOCBBBriml9nG5wAEwEuWtwsLCmTNnhkIhUWgWeFkslt///vfBYDDJDPwmA6sTMzT25e+4Z5TTmJI43kcZtphzn3jwEnaXHkcAsGDBApfLpeu6+CjcYlNT0zvvvCOwS2DSM0z7uwNLVIF7ExEhTimxmrMeuJPTbrYZEaIHw8Mevts2dgSnzIi/EUKU0pycnHvuuaejo8MwUowxh8Oxffv2pqYmQohRiTbsmiDOuZAqyUR9wMHinAuMMMaEkN7dEyKEa3rz5h0ovm6DEI0ptlHZ2YvuATFXFC8cxgDw4IMPZmdnK4piKJckScFg8Le//a1AhxAiwlRKaSwWi8ViQhOFVBhjQ85rBOvq0x3hvAkhuq7X1tZ++OGHxcXFM2fOFBF2IqyUIYJb3v4gWH1STnMa2SLCiCvaiMUPSE5bz2EYsf/U1NSHHnpo9erVZrNZGHVKqcPh+Oijj2bNmjV06NCqqqqzZ8+2trYGAgFFUcRVTU1NzcrKys/PLykpycvLEwbusrIlT1fTZBVGAWOsKMr777+/Y8eOc+fOeb3emTNnrlq16jICcQ4IKa3tRx75T70jiiQiDJPoS6fdXlr0Pz/svX+l6/rSpUtPnz4dX60XKqZpWjgcRgiJrodgLVRJ3EGbzTZ69OhZs2bNmjXL4XCI168Osn6DZSB18ODB1157ra6uzmw2WywW4dc3bNhg5LpdrzCGMD790uutf/hIdjl5nMvnjJX8eoWjaOSlSeTLkUB///79K1asEN3pS6IjZGi3IVjXxhASMlBKFUVRVTU7O3vBggWzZ88mhFydivXvBYECY2z9+vXPPfdcY2Ojy+Uym82Ct8fjOXnyJHSv/wqkAlV/a9uxV0qxG0hdsuvzZjqKRl6aXL6SiBhzzqdMmTJ58uR4S28cSbyNN8joPAKA1Wp1uVxer/fnP//5s88+29zcjDG+ijCtH2AJ4SKRyIoVK7Zs2eJwOERb1HBDlFLRgOl2whhzxhrXvgPxCQpCLKZYc4flPHYf9LDrl2UNAN/85jeFCvd3kwI4WZbdbndNTc3SpUurqqqEJx0QsARSsVhs+fLl+/btGzJkiGh/xj9gsVg+++wzADBiSGHIW9/5MFBdSzq77QIdqqgjFv+z5HJyyvrstosYNT8/v6KioqOjw1i/60jifJ+4gD0dNOdc13Wn0xmLxZ5//vmPP/64v3j17xquWrWqqqoqLS1N1/WEzXDOI5GI1+v1+/1CMuAcEay2+Zp/vZ3YrF1ICbs+pSzz3qnimWRYGzGqqKkaKAhQdF0PhUJ+vz8cDiuKEovFxEdVVRMgEyomy/JPfvKTQ4cOCfuV5PaTMvDCJG3ZsuVXv/qV2+1OQIoQEo1GAWDOnDmPPPJIenr6pWImZYjg+pc3try9W3aldLPrlJX8erlj/Khe7HpPopQSQt56661169aJthBCKBqNapqWlZVVXFxcVFSUk5PjcDgope3t7bW1tZWVlWfPnrVarbIsx4MiOiB2u/2Xv/zl8OHDk6z59A2WQOrUqVPf+973hJLHvyJqdaNGjXr66adLSkqEQgHnopETrD55bPFPsVmOL5NqvmD2wntGPvP1/k4Ziy0pivLEE080NzcDgKIo48ePv/fee6dMmeJ0Onu+oqrqn//8502bNnk8HgFivOShUKi8vHzVqlVJgtW3rGKVTZs2xWKxhNwVYxwIBO666661a9eWlJRQTeeMI4wRJqK60LD2HR7fuUGIKYr1lqycbyVl13tKIvr43/jGN/x+//Dhw1944YVXX331q1/9ak+kdF3XNE2W5YqKivXr1992220i9zYeoJQ6nc7Kyspdu3aJlfsWoHfNEmpVXV397LPP2my2BE0OBoMPP/zwkiVLOOeMUiJJwHnH8TO+/UeiDa1Ki6fj+JluI3oEa/6O/Je/k3nftGsZXldVdffu3VOnTk1JSaGUCn1vbW09d+5cOBx2OBy5ublZWVnQOYQjYteXXnpp37594hUDfVVVc3Jy1q9fbzKZ+tSvpNKdnTt3JgBPCAkEAnPnzl2yZAljDBgnktRx4lzDq28Gqk4wRUUYIUnCVnPcMCPWO6JpU0oy75uWvF2/LMmyPGfOHM650J36+vrNmzfX1NSIfgfG2OFwFBUVPfzww7feeit0th2XL1/+gx/8oK6uzkgDhAc/c+bM/v37p0+f3idYvUksIvW2trbDhw8b5V2hU+FwuLS0dOmTS4WRwhK5+O7eo4te8h84hq0mOS1FSnUQmxl6qO2wf60A0ZK5NtJ1Xdd1WZb37Nnz5JNP7tmzR6QQTqfTbrfrun7w4MGnn3769ddfN3Jsi8Xy/e9/32QyJUQ8CKEPP/wwGaa9gSUWPXLkiNfrja9YiqTs8ccfl2SJ6RQT4v3o01PPr0cESyl2YJxTyinrhghCTNflNKejIA/6b60SSKQ4Aqkf//jHACDmK1knIYQcDofD4di0adPatWtF2EUp7RmpCeWqra31er0iALpKsAQdO3as2wsYh8Ph8vLykpISRimRJc0XPLPqDWySESH8ijEeRwhxnTJNv/yfe6WEhzVNa2xsXLt27cqVKyVJkiSpZ2wpUov09PS33nrrk08+MZz47Nmz7Xa78bw4eK/XW1dXB32NWPZms0QW1tDQEN/yFI7jjjvuABGgE3Lhjx/Hmi/IQ1J76wlzQBLR/aHQkTpLdgZw0HTtpZdeunDhgqGz8ZoLcSMLRj3PCFxCodCFCxcikYhwgldyZAJok8n05ptvTps2Texi9OjRY8eOPXbsmOGvEEK6rp85c2bixIlXCZYR1Hi93viIgVJqs9ny8/MBQMQH/n2fYbOczHcGOQf/viMZX5sCCBBAQ0NDY2OjyMMNXC4rSYJUGGNZlsVESe8cRc3+9OnTtbW1BQUFlFJJkvLz82tqarpVaxFqaWnpU/4+vGEsFotGo0aiLyyl3W53uVwAgDGm4ZjS6kXdu+1XQh+bpGhDi1iIcS5JktVqFT4brnwFeiIoVCbJtE7U3c6ePVtQUCBOJTs7O1EwjEWWdk2hA6XUaBYYS4uzvfSRMZ5kbsUBEKLRGNN0LEuqoookySif94JyUuv3SqFQyPh3zwhWdCT7BKsPA08Iib+D4hCi0WhHR4f4KDltl8rEffo3BMA5sVmQLAFAIBgIh8M9HRBOmvrVkbbZbMa/e842iX31uUgfmmWxWGw2WyAQiIcvHA6fP38+JyeH6TqRZcf40aGj9cRm4dDbvUAIMVW3jc4RW2xtbY1EIglZAQBEo9FkWvPC5ffp7MWTsizn5nbNuXk8noS3OOd2ux3iCor9A0v4HbPZ7Ha7m5ubDdcrzNaRI0cmTpwoBhIzKiZf+MOfk/i2M0IYDZn5ZfHh5MmT8ZUWQ+hx48bFB8BXIoxxXV2dqMD08rDwUSNGjCgoKIDOQlt9fX38W8K/Z2RkwLWEDmJUatSoUdXV1cauGGMmk+ngwYOLFi2SZZkzlvJP49Lvnti2Y4+c7uJXCKOQLGntAff0L6XdUSbKMtXV1fGBrrAamZmZr7zyitVq7f2ERU6za9eun/70p737REJIJBKZO3euLMuiwhMMBk+cOGHMTxjcher1cUJ9PlFaWhpflhH6X19ff+DAAQBgjAPAyB9+016Qp3mDSJa6RecIxE9baN6AbXTOmBWPcgCEUV1d3fHjx+NrxMJnFRUVWa1WsfleYlShCxUVFXPnzvV4PKKv01OnJElqb2+/884777//fuP/9+3b19raGn9OIhgaM2YMXIuBFxKUlZVlZmYmXBlRC1RVlUiEMyanOYvW/tBVXqRe9NGoIhwfIMQp18NRzRtMu71s/Gv/Ycp0i2+hbNu2LRqNxhdMBARixBbiAtFeiHP+1FNPPfDAA+3t7bFYTJRMBWGMNU3zeDzTp09ftmyZWJ8QEovFtm7dmqDRqqrm5uaOHDkS+mqR9TZyJA7QarU2NzcfO3ZM3A7oHDg4f/68pmnl5eWMMQQgOW0Zs6eYh6Vr7UE9GGaKyhmT7NaU0rF5Tz2Uu/QhyWnTNU2S5YMHD77++uvxpt0olSxevFiSJKOL1QsZKnb77bePGDGiqanJ4/FEIhHRkWaMDRs27Fvf+tbixYvFRJy4uZs2bfrLX/5idA+h01/df//9ZWVlotrTC9Ok6lmnT59eunRpwkIY446OjieeeGLevHmMMc4YxgRhxClTWjxaewAINg8dYspwAQCjjDEqyXJTU9Mzzzzj9/vjj5cQ4vf7n3zyyfnz5wvL0jtSRtdPhKaiXFVbW1tfX9/R0WGz2UaOHFlYWGhcc1HS2r1796pVq4wjN0CXJGn9+vXJFJeTLSuvXr1627ZtLpcrvnIGAOFweMGCBY899pjwL1TTESGks1bFAZiuIwBECELoxIkTK1eu9Hg88dbKMO3r1693OBy9SywagoSQ999/v7m5+ZFHHjFKLglnKXA0ksrdu3e/8sorwrolHNK8efOWLl2aTNu1b7CE9F6v97vf/a7P54uvBwlRgsFgUVHRwoULy8vLeyqFeP3ixYtbt27dtm2bqAvHx1aijvjCCy/MmDGjd4kNULZs2bJx40Zd10ePHj1//vzp06dbLBYDSsFRHJ5o3/3mN795++23E+IykT87nc5169YZTZZrBctQrn379okGekLZRLhnSunYsWPLy8sLCgoyMzOtVquu636/v6Gh4bPPPqupqfH5fA6HI+FLmGLAfc6cOc8991zvSInNqKq6Zs2anTt3ulwukUsoipKXlzdt2rSJEyfm5eWJ2FLI3NLScuDAgR07djQ0NIgUJ0HsQCCwbNmyu+++O8lufrKzDmK53/3ud+vWrXO73QkJneAUi8UURcEYm81mSZIYY6qqappGCLFarT2rTuIrl+PHj+8zthJ/8vl8K1eurK6uNqyBuGLCqJvN5vT09IyMDNHF8Xq9LS0twWDQYrGIznkC6/b29vnz5yd5AfsHloHXhg0b3njjjbS0tJ5lOSF6fMXOqED1fFiSJL/fn5+fv2rVqoTR9ssiFYlEHn/88aampiFDhqiq2pMvY0zTNF3XjWkRWZbFmfVk3d7ePmvWrBUrViTjeQ3qx7SyiCQmTJhgNpsPHDggiko9k6wEX9MTJoGg1+udMGHCyy+/LPS0l7MVcJtMJrvdXl1dLZQoIaMULAghpk4yRmsSWAOAz+ebPXv2j370I/FM8mD1e+RIuPa9e/euXr3a4/E4nU5xqsmsI2AKh8MA8OCDDz722GOiUZzMLRD6dfz48Z/97GeNjY0pKSn9moQRrCORCAAsWrTo61//ekI9dkDAMvDyeDwbN2784IMPFEWx2Wwi9rvs3RQC6bouClhlZWWPPvpoaWmpuC/JiytgDYVCGzdu/NOf/iT678LrXbZUD3GWQdjT4uLiJUuWFBcX95f11YMFnTOSCKFTp0798Y9/rKysbG9vFwGeMcoCnbM+uq5zzlNSUkpLS++9994vf/nLQhmvQlzjrZMnT7755ptVVVWhUEiWZXHv4hcUcZamaaqqSpI0ZsyYBx54YMaMGcKKXafJP4PEYRpW4PDhw0ePHhXzkiKSEG4xLS1txIgR48eP/9KXvjRs2LCEF6+Rb1NT0549ew4dOtTY2BgMBjVNM7YjSZLNZhs6dGhxcfHUqVNLS0tFw+JaWF/rD/f0jJ5VVY1EIrquY4ytVqvVau3l4S+Kr8/na2lpuXjxomhKWywWt9udlZU1dOhQw9KL0P9amH4xv3IkRIFOO9pzY+I8v/CvJiWzskh6vpAT+uJ/Eqqngf9i178S0wQbb1RyvkAuN/S3lW82uvE/hX0T0SBY/aBBsPpBg2D1gwbB6gcNgtUPGgSrHzQIVj9oEKx+0CBY/aD/A/ORNiwv2PAfAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTA2LTEzVDAzOjE3OjE2LTA0OjAwj3mANAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wNi0xM1QwMzoxNzoxNS0wNDowMM/MIhUAAAAASUVORK5CYII=',
			"is_valid": true,
			"label": "Webhook",
			"environment": "onprem",
			"description": "Simple HTTP webhook",
			"long_description": "Execute a workflow with an unauthicated POST request",
		}, 
		{
			"name": "Shuffle Workflow",	
			"type": "TRIGGER",
			"status": "uninitialized",
			"trigger_type": "SUBFLOW",
			"errors": null,
			"large_image": 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAK4AAACuCAYAAACvDDbuAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAACE4AAAhOAFFljFgAAAAB3RJTUUH5AsGCjIrX+G1HgAAMc5JREFUeNrtfW2stll11rWec78jztjOaIFAES2R0kGpP0q1NFKIiX/EpNE0/GgbRUzUaERj8CM2qUZN+s+ayA9jTOyY2JqItU2jnabBRKCJQKExdqRQPoZgUiylgFPnhXnfc87yx3N/7PW97uc8Z/5wdjLvnGff+2PttddeH9fe974JzXT1tx8F3/s6cD09BvAbAHwfgDcBeBLAKwH6ZjAmAOC1Fh3/x+DjDwpaJ4DHeqr+2qioL9qcf4DZ6cPWBWtaOKJtfkYACwI1bbaPYfwbfaZfr96Wx5Khtl+ioR1nbA3a3LbHRxzUxcKTgndbugTwHED/B8CvAfjvAD4I4H8dLqbnLx8+wBNPfQ6dRFWBy79/D7gkgPhbALwNwNsB/HEALwVwETGGG4w5DpzWXI5IcgXPKcuBALCTN7bD+YJyx5W2r2hbBZf8xRnQxwCIM75Ynox9EM/s5Vxow/Zd3sTKhHW5hC/zQr5ixm8R6KMA/iPATz94ePnFe4/cw+P/5jPIUiq4l3/3Hpj5UQL+LEB/DUeBfaQirr3i2RmsnollCsRDh1nuyo/pO2rnjA0zg3n7JSaYR/5TWHerF42v0mYJfY7Aj1lHoY/HppWKaY7zugs/CGjVXfi+ds2i/kMAHwPjXzDwcwA9/8RTn0aUXMG9fvdL8PDe13FxOb0OwI8AeDtAj1pKvNWm3QOvGykUbpnKxInBB+UqbVm5B4acbn0tuLW29OvdZGxevSEvFdrCivDpWnoUWLd9xn0AP8PAP2bmTx0OBzz+E58yJQ864+G77+Hzv/m7cHF1760AfgrAO4zQcs747Qe5TGfWQqsH7ra3/mZTJJ5YXpvcIXQsXGeYcXBVfxufL7RBPVPE4R/PKiFqamVO0q/yh3cJLU4WWh7+zdKjAH6YQP/+QIe3fO3qs/i/7/xDObcevvseplc9xNVvTH8GwHsAvCbwrVZt6mqFhnsQ+rWBP0uGcRGTC22UBhP+GFg2FoxtyNvhl471cgsSj01o58z9KFyLHn39eMDwhPbUJwB4FuB3PXj4xH955N5X8PhTn9GtAtd/7xFcXV2BDoe3gPkpuELrRbCKURvjrF/KurqOkGPGWeG5JfTANNkR+oa/fqzPGwygxla5TdR1D0R96YOnwVgieJVrsPEujkUqhREHqM8CeCdA7weusfi9BwDgf/h7cX19DSJ6HZj/OSJNuxKwMI22ToX9dkaZCa1h/NhSEIm7dQM4RzLXZ5zS6IxNMKijZUv6CFZo81YEbdypYVwLR2hJWC8x4LStFu+M0DIKt7AOMl8D4J8B/DqA8KW/dPRaDwBwdf93MPuxPwrguxANjG22pN3zaQEwqepRIKEZQLY0h0KhmtR+aeEeJBozNZHLwMil1h+vQ5Pv09rYdllQCj3gCgEYf7es1/CcM6ENhR7qmWe98wU5yMsbAfwIMz86Xb3qmHP5d+6BjjbshwD61zg6x+GATZRc4LRLMLb5tPuiX+m7BQzIBr/DRMULq3YPDFyW1t34EtHtj42GOUAudAZjJd1ywhu/XznOhC9oYNAdf32se0Qb/gqAnwSAwzGIppcD9C6MQuswMxZaHz3Qfq0bAUfC7g7AEQrWzW51S6E1OUEfBU8WpvfrUj42l1lwhDZK2vWxtoCtlRoQlK2e1u6x0A7tzchH6Eu7gZgWWtEeADwK0F8F8FKAcJixqbcB/MZogkafj4Iy7uAzjbIEHM7kRK3CzxN+VRkgjfUHjWlgoQry41G+HKFraKPctSB2FQOPdRH2Mf6WCE7ATxCtfVaavJzXxXGiRn3ysxfYT1ra7wHoT4OBAxE9BtAPAHRPMImle+D6R5awY2gpcEx3cKxWncBLBb0eEyv0oMRZq7rRxFHIePkz0UZzH2PwJ4kht+ERgt3qkioq6XPdMvYESvZpsd1kLJr8aFwO3/XYVPseOvEIgLeD8NjEjDcA+O6tFRaa1dUK6eaB61zrug7ntp5S/43NfC6jZGahXJzKFnUQ5wcaGGoNeSVaHoX74ga/kWuWj81UCefMBHCCd4QhRKmgSlb/H/Nd5avm3LXUJu+PAfjOCcCbAbxMF+W4YsCohkbmG9T1J4YCuMwXWuMNnyoUgQl08u25iKXwPl864YGif+u3os3rbwGaBxm00Ib6LXxnV1/Ewd5Gei20M9dexsCbJwDfi/WUVzq4gdtGIBe3LYmuo/ajnSndu55sI7Dkn76a+zXoQVdr2ejfRr5x3aWsCWzF2GhsdOblEKw0cdCyn4TmtIvEiuToRqT0NB93zAVwQeDvmQA8WZr3NSPsYP3HmN/OwE7Km58wmGcNGwqTo2nTiVL1FxW0MLm3sSFNaNgfGxpJCDwD7OyaRXzhvTxlGXTbICl0m3hj5L4+pUeRaFqRv/GEQU9OYLyy7LSLtc55HW1kEYosmHLIWZhO5BExP/ecq52LSgSZHZ+2D79l5ldMbgbwYwjkDW26j3he3TnLFwtxZ/WnLlgyNlFERloEfOsE0DfLajuCFdNxL4jjgVlLDOkyoTo70NRE48TuCcRUsO2XyVIaiHWDqUC4ncUsYa/aXeC2MG19S1XQ5Ut3MVeadqX7myZgfN3Gq2j4gtHviwch/LaQuOPcdqPzHeiGItwlo+pDmviNB0WEvndvXqM4vENox3mLNwc0S6jwlfJAjLPxB/Ot8HmHBit74U4a497k0mAbNCqsNPMdn2wRHq7qbYPItxFtfR/O60BWhmYPV7TlMgsUaOnFQWcxSz0UoBq/Q58YUO02qanf6dNaZIz8Bw79gdACmLVtixCGMM2clWv5w1QzGVaj0LJaw0GPZZuIxdgHNxCAcmwRX/x+rSceWKBhJuMD6rH5HnmpnaGw37HpHRj0xkWyspLjtHDlWvF96gLcTBiO9wXl3B0tJ3Bw/dmob91edDRwPwSkf9tXZsKxrZPefSm00khMdb1tJ8AxoQ1tqRQC5XVl3mbp9vDUE0Dze4VS3dYC2ibboCm0+iMpThvkkdYoHiFu393of843zqjyyzKGM9TCL5ECrf7C8Z9izbK6rs9eCS1XizpZVNliueGiXZuNtG085zzZjg2nHJ+o57sJjdKcXD+Yyhjvuy/CbW6cVQ3py3z12XzHC8M+CMdXBLFjXs0bD8rLeafrjnT23xQOshoLclRwjU0NmiRTNPApB+F2ykH7xn0KhDuBvMgELKpHE13nDI1o2yLe7sbE1kwYLLpu084glm1dwQ6ulcBoe7r+vlU2SaGhXwFvejzReYpHgQIYJGwrq4IzkkI7+DWp31euqB7eas1RtiI6JqkwkQLSUyaq4XOiLbTzUf3lcYU81CQ3+EkIi3b84SzmCOZbLpCuFRE/j/txsk93vqeeAEREe5qrP9AQRJ8Zy06ZmL5Tg7NIE+YYar64YlMY8G8eehQongbnlb6923Y2jlwYWzzJ0QMqfX0Jh/nEFZrPqdl5R58Ce9AUvN6xyaKNDM6rNV7oNhU+I8J6dvYXoRM7fh34MA1ivfEde1lC+9TE7xHaBuQ1jtNpyPJqoG9KGp9j3f4WsEEdUthrZFuH8bF2lw59r76bFwYa8mgi75zYlS9NZERj19sf8Rg8we4GgK1g7ySh9ZCXY75ldQtVYYCIVlTBHyyhKbT+nVA1YewyvR8l06AtupsLcR9x35v7EqQCUdn63ulWNGgbaege69Sk0w0WpKGlEe/sFtpt3tZgTPi4edDgE7H8m2sGn3Gr4IU4puLw0CvvmdzVg5RBUkVfT+DjPGsJgrouOoIiU9alcDEiVSQplNcW2pq+vTBqNgyG2oCIg4G6sapTVYVkP2YAMljJfO6GULH4p8e89WyEM8Yc7hna2GFFQv5l7kWF07q3y3jQWm9Bem8Ld11Cb/vdXzQ25vCan9LB14yXTNkc/0UPmF550X0iQDK8FQ7Uhg96fh8Acw3p1kTvRkifeVHdTENJfzblnRjb8acbKLrY+vKYmCoBMHXJLzf01UGP5vyonHBv3UBsvG4D/bk5lvVRhagxzTih0rTgFYMn5NpkqD+yO/C5KaobjiPBMlvXfBrmngYLLWNb/XZeeKMFz0c/+q6FLeP4tM68LQ06GDtX7Uuqt7nz5sxLsT88uUxuDLyOdvWwx2FUg5bReD+YInjbPTSu7gxYd5vZCXk1gsQsws5vNJT8qfkR9733FR/eRl4qpZHH7hrI+q0s1fE5T1mnQw75g+35bsbEZ2mYlE0bsWo3G5Q9RtcW2k5wejKkJAstOsxObKWIim3pxF9PhZbrJjnUyI12OqjKMH8e1jK27bgKpgMBi+WRsh9wSKe8oRWgzUzDqpi+9mmlUvBab7pG7dvJ7gut9IcbxKd998/xSquXIg+Khl3vEyrejchBUpc6xxrXXF6KNT8Swkr0OJ581oGcu2NE+YpNB5tMTmf8/ux1DuXkfHFpcfPcAGd4HJvvLfiLBpaPa5uDvsU9RYGweDJAlw7fp6qxHiGxCV0ibM4HQHLFBuUi6Kj0t26iLQHvyiYhQDs2F3bdVrk4lhwJbRSXyPwQQ434XObFUF4vWByUDW+SIpTjyAOn7nAe14M8dGjkNBS4DKvK3+kPdfBRM3iH0m5dGupHEaxDolLzta+/+LSp8Om8obBLX4Z9A7teukx9S4+AQGjVgvabHJ5pVCXh+9rUcQNCMn7dHCAjfD3za8H6IDBTg+KhrG2sF+xEAw1TFv0Gq31REAVOOwS0FvLa+q98WuspBvGFENo8PqgRII+WPCmLsPGGvHJzEfJlg8oFCbbHGme7XUBjw1qRrfsRYjBQNbE6iEsYzaTfHbTlAmY7whBuXui8FipybFGAsKd8LspTCEnAIyZ22dwJzy6wbtbRlk7gJECx9RHp0tHRxG0IBidP+WkYRYD1cduaK/NvGtiubOoEfyv03ZAKhdQKmwYV5Rx/UY6tNz6XvlaQGFnXnE9S+FpWRLoWBQ90sDgK3yqxrm+4KSqwo+TKfgf65ufmWKP0UfY79DTSFpVT6EEXy+R5YGY4RpjGFmkdsdXOOmolWxccbP2OdUeKttj4GJhyo67t0zTnlTOraeRlzJdFsC23imA3c602RTLMPUVlTnNJBrlYX90xZpq6GlOJUbid5+N9emBpP0rOaHoJcDEFuLFleLTKrYviGOXsWw4u7ST/Va/zuaacxzo+77LAjoqgBpBRPK6vwA9fSOYghqySFArtXkRKdzgu3UXjqmsT9qMHpXvASTMR0eNvVjTSARd/6q/j4vV/Eri+Slts99lzunakOqg8uY2gWU/3e20RHXD5uWfwwk//OPjBCwhx4E5glgmeypNaPkAsliKsTxFuaZoxScrpK3zGUmgrl6PWFPIHASAcXvkdOLz2TRVn71KQmK+BwwTghVLTDnaHpLLqdOR9tSfGgpc/Mmh0EtHgCTtitaatzGNU0TNTfe1zlxppp4Vh7etUUJuDLDWFdrawFChUWk+HUaZV87xMmHTE2twiHeuwzr1Lt5fiQCyB4qK6zNkdb5TUhxODqzJTqvFMcEvh86huWKQBmY2Hze+07S0mDvSWB5U1tPQCDlvX1V8Yoi4vjqDenJBaOrit0V9REiqLyLa7NwaEL4Q2vXt3qdtGPe5SmsIg/IQXNof67hFYsVsa7w3Ux2cJwXlcZojvKiggKf0Cufwz3DkKGMCZlh8F/uwIwDd6quaISp5vCse5qsB0Yv0F/xWftV+x9RudDhNCK/7eEUyNxOQ7Ttos5OXu0jlTB1/va1ovrsnqjruYNaFmA6IYlBqYW451zk5Tk8Ex0cDutO6Zk9kBLcvFAjvnFRivZ5GFkgz2s6YSQy335v3dFdIZEbzFGvt2/BuXi4Q7DXzzFPE9trBBOa9MZ2Oi8R0Oj+jgJhu98jKfVhz6gTH72Vbf2ISnZcNlfyew50x7b7AZKmLX+4S24zWYchcQAd5dcURIXk8vj571Btbf/vOK3Pm5L0rycNVobnmskriDiWwMdU0sJRWWd2bk+EjguNbXSNyDIdLrH9+TBI7nqHonxDbk4Q4NO1Ny4bAEjpqFirrtBW3lb8Z47ohsY9oednfEvPMDUYQZ1FWBWHU6S5dbzkfcxWbnSI1zJEviolxxyivavrVtB8k71pgTMFYOxiEyY58pwPf6jBw2J+6U7k3TuEWk8dLx+ZZ3qj+cHZjJ6kV5E3eFlhuENAIxdzcsrTs/Ni7NGcT2+grg65u3c440mhOdT065KlFR9uICuLr02rVWlAPLuoumBqKQ3Uau8p17FXLCQtiq2gLmTNN2NyVk2Zu6Cpcf/Clc/ur7ALpo0AP4t6En5VUd82g+sL+4PhEP/Mr2uZRx/7DS9vgAfu7L80Hy0j1guCe1egF66IaKxWXPxsR8Sb8smTHvjJrWY6pugfeYmn66+t8fx+WvPA06TL4gbpliu3Ecb32IRJZtXaIcRNUCYhTaSfTrngdwNwWInEU7jndFAChUIIFm30iTAknQ97jFi4+Tc9zJBgSsmQonh5yaJGY2FLwAPbCHeW7Boz0cQIcL4HDh45HmxkSPB0UQKyZtmWWqv7dwrCuEcKvtwFFCMrX26vJ97VsIloHUG9v+R23pbjqVwG/5YgKqY41DBwuj7AJzGU8LAal7EJiZVSFEk8trF2dIm78cCK071oW5QoMEvJOkqy+lR2SJgfvxBbPXiNSE5uBKyDutkCJIqrbA6WcDUmQiyneCs7Bipv6BfMUO0EccxNksvapT9+BMWJgfE9UTu2g7jmdYjc3i112Xa6TR7GRqi6QEY+Fp+/yAE8+IPivBczeuakHc5r3y648p/FzUJkjeu7Gx0K4LOjLxQRAiNELRx1mTcGW28Yd9pmas4AsKCxRpT0FqT4BOWZDjhpBsq9lnZeIrZVNesbr1HV56pxGYTbBywohQ31kV5bGjUXTZlqlpJk9AS03epW0ru9w0IF4ND8av8xtumVNfa1p3XHL/seJ9KXQFfZlCGrD5egv5+FteCGLgCO3TeUmuWPIIdH0x8cTRfKqPW9smWxjTCbKCuMINYhX5KZqAcnzWIg20qXxDjm/lHEL0JSFN96C1mCOrQKuFLpAdjPyfbAeD898izmFuK4o9Rq8tedyLcXbTOkt9xtvtacs/UX7VJt0DKf7i4Gjx8tiM49Z1DoEHfWY46kgXcaIp3f5UG9GOncP7paVJE21NGXJtEK0UUdePX2j44ZupPav7hNS1IthxpxrUW7EE+J88cqEip1RyU84Si2wIx8DLBv8CLd1VXJsVCfoI+BsEYi6C4tel7X5cV3DSQElhdm45n4g1Ih/a70ysKXdj98EYVPJW+x6hHVsrN00CBMCMN/HFxwB6hBGzG8pl9zY4qwRveeaf6pvJKQO1nqxE1mA4HVbTajoooZ2EUS1nX/Z7a27uOoAdzCyQh8bmQjG2xI1wrNRYrGW52lirU44TtKkQ2s7mwkhf5PdOsVZtmZn5Sp4OHpncDngC487mMYQ4KHklg9XTdWliYSQR2+ZB0RbMdPtQAxlci1rLKo3s1h1GYMe+zlZxTerA33pc0+LDSfA/rqg+Xkdm3YVXhOo/wgGYeuTVb2N+RSKvz3G7YHQdc/eFUrooXHCDAg141NDm1YSLdhN0JKqr+oiVD3mN1Is+fT/MHkSaRHtNWzwS3UMeOrBKB/iv+jkhLZPBIodqYbIMiYsM7Svfub1BcNLGzI68arGQp2UdPsocmv+h3thi+dXoRvFJVH9gIbTTMqMljrkpc13tXFpWdauCyyCKseNg5uCKU18QjPWgi2GYfbO/YboMXF/b8luddZNBaMjVRBBwuOjhtNHcBgtq7HgQRgt5qfZEkJkEp+o8bi5kPkwiHqosqoDaYwwq+zFVjsSfX2iFFwD4GiW8wfIaF698LS7+8Jsh5mKHD3z5yQ/j6vOfAOgQ8nAMgOVpMMbFK16D6Q1/wnF3yPwh2wFAB1z/9hfw4H98ALi8NMW3biKjE+O0i6p1XBqreUP0xruVf6s7+QJrG26ZwbHTcrAAXBPimKRbEVrLIAO1JSfQ+PoaF9/2nXjJD/4ocDic1PPXfvKf4upzHwcudP0GFHh9jcMffD1+9w//g+PbDCeky4//Mh4+8yHw5aXfJ2tsV9EXIkdH18J5vmnc3a6fLDN1TFSKRxa+0dISe5/piSL3+Z82dHIrqUY3bgzPWf8avlAkFuHmBNig0YWiFG2OVzXAB1FdZzIDaxEJ9tzJ6OMGqyHoL/R7XJyR6vYAjCft02+AMW73/fQEVVn/uU3XZUujXyyD6AULumFi/3eJK3OsyMpLDkN0w8iUP9EsBddVf63BztXdhesxIPCHZaUMrKWzCA8LaVgyT8NGb546sNV5FwsvwxVdH5dDrt2D+BUFtjwUbH7B3dXQDOdzUYuap6heITAcqfjlN9vmqDIPzu9zyBA1csxjYd5vKkiqnWo3jdOfp42fNwO2BGI5xFkpk6BsBuct8QRV5TaeiC1fqS39igkL1CmhPk7bwIK5tj+npgFZSCAsB/g/L03BhCmorubUri43dcuty+e6cc6eNL/+lPHSaX8+ZEPR86Fyx+9zBrz8FiDzoGWR1Vv7pmbJXanlTwPBwfjbcLI3fq7RfART8nmszrG14pBTgh6sCFekbdPdujWPTL2hI89pnMZJc1d3yJ1I2BXYXL3FuzbS39GJBf/8KX+d/OZpxLqFwC7jDybgVpT9Nmr1UC6oJJiCLzvduCGSO7uwDkt58iqvv/24zW4VO2BzoivJC44Cxh7/i8DwU1O0qBbzuYzz9hbJqCyMUBga41k6L0VzUgpF9MnOTlFuRdnkZZNIi9z5bU4pvLNuGxpVrj7S1ooQoVcOE9CJ4gdYbVsxtzJz0qc9jnOHS3NC8ncjqWnpbkaHFUnfvIssxSvV2nIa163AocDGFj7ii3+TjRRG63+sUWjNEneglQmpvs5y1mQ1G9f0vQh0iSTxzDM5t6sSGHcJqyCxUjQKGTBZTdor3TS5jjnFqrzUtC7G19Va5D70txvPJDiOOYy12Yuw6eBrIxFQrPSdRYDrceZCp9xDjuqX/vAsq9H6lG1Opi02MrNqvhyjbRG3q24TpD5bWg6HtOg7F44rCIgx00UprijDbfAhGBMhQTdE3S2v9ua6QJFRogwQTXVjO7RlgAB4A8vqxsjG+TWeRje697+eRW54+C/DSGnByG/RPeF4e/UEiznwqLG55CI3od9LgLhmNN8N24ZURo7WN01nuRDajFGLCbg+8Y7b+fKtFPLKFuPZUh/8jwGym/RNwHb/kIIBGoulinVKoU14GtSd7ENZaHWu14MdcaS3VOK2tixci4wpzHj43/4dLp/5ALbLmeO63iRcP/s/gcNht0+7oBx8dQV+8LXjsca90nQ4zBcrd/o9e1wWpcC5VUXU+1tj1TbGu+X5lwYWdSf4V0GuRfWB4Ay2iffWe2aFkgnzBnb16x8Bf/LDCoVYmiOXGZLXF1gPcQd9aFrWrMMBV5/8CO6/52/ktAbBCoFw9YXPOmd5Ny2VL6gI49yXvPibQxW4GFPfpO8S2i3QpLRckOff1jiLQXoe1gkkfNijZ35HO8VBGTueA4hWXHkT3uCAOob2j1YkhByLLWwARLj+6hdx/eXfdPsJA9mRL3RA69WdMu/0tFrTpdlw3nKsdcO+e66Fvyh7rgVDXXq3vt3qz+YgGD5x6dah/j30YffmvbrLatpo1Y2vGxWBGRtpTDHodG9+aI9o2Xs0def1FFih2rL45N0CmqAtJhGNW9ARfZ4FJspft9m3BZzzZHKqJlyLOjSfl0S48nj8vwL9wwBQC7yvKbPrMDeoS/Ub9TPk2T161Bo5YmGV5ui+tkDnS5pvIU+40UYxXh8ma/JPfy7K36UrBE+UGb8RkPulegBSlvLBH4VPrg+zYRAwl0z5mLYlb6Ex78NObGgGKwB/VnljF2tbmvCzCfJsp/iQN2kX/RBUtQMxXwEkFnLrTAdnUJelZaasML8lLKLyskDP1Atgk3wXaQh0Gguj5GdzXMZdDHlTjy/i/bkw3YV/qZuntnDnp1QpC13XFqWThBYgdZA8cq5Lnw8r422yvotdcbHvtpmWZKISgV99rvYrOclFHZ2Ay+ujsSD7KQDpX6S0yFmsrHYEmaXViMscXYUMgG+B4165xmoMB7/Vt4FCRZvXbsftUUFii0bkGqWhZdnmyrKNHafzpkZkD6B1VoQjNxQtgc++/TbtvfZeRJEZ1uhuke7Aaf0+paUqNk7i5Ne1B46ixUdCyrk1Dvt7wXOlP4tAC3eRh5ukOsbolDsWphle14vZi/H3xwNTR42PWmGErWKh3XyXLcDRAtXwS+sR+o92atpjlsR592CKfvuB7zwg7qSrvAi4rW2b5vnKfVpRp9xcILMoRTnJU+GZuZtyTr+tu8O0j1muPDO/qgXfzIjdLitIkjFZCgOrhibzhdY30fvcl3k8K2GBZUghp4VLowq5QRLOqu5f3UKp8tzxKr60kKZx76IKUIeegu+c2YrWd0s0NfllcjzS/+JgjTx4g+3eIt4N+IRfAKSLKumT92pWb8GQL3CnJKvyQz75c2eElhG9RFpq6YpA+UAKbnJuIStjBJS93EbddGLDMRSDj9oL4Bm3nZweWvhUCJPFnmv6trrRpsm5Exk6yw9kD6q1di2a+G7EvCU42x6sGnsFlesI2W+cvPoVVBbirBEDPOb14ajAHCkkzDODEqddGS4bNJpnxMd3R9i3JanGFfIsZC9oV8xjZB+uFp1INmGQvzlnzjMbEKLBefail797guF+gyCbHNpAZlcbRXWvr4931ApOI8CF9UJ0R7ihFbSV0QLqaz9SP3aeUxj8Q+rUvbo6/RyyOw+BW9KuL+auA+2IOZBGWvDEJcL9eroRnqY2s/3UsEYsCNXACRdPvgmHl38b9Hlct1rrHbUYCajK5HzSwyE9U41ARo2DrzG99o/i3PeSbG5CIxBTgpLPXTfAzdGcRcYmXWDwb4ZzmbWW6Puluq71hKFXnq7PAA6Ee2/9Qdx70/cPgvuNlujGgjvGeSPq03LzjPDlMcK4C3pi8LxiKlNUaLvLqY+FyucFQ90jcOOo4kHw0Mbx/6ddrHyX5jR65M0dMZvqAHP5/lp49LEMbmmVeOHj5js3EYHeAfIaPciZkgjt7YbU36Bpnv82etB9R2zInnUlVy6Ek7dq6kHDi50zAnqXfHQGoOu26ozkSXRD0kZNn/Uu1WlRWh1lkyizRCDX3bAaB/aT80nZya/XiXxjJnRYleyGpXAUtRfLXWqlHcB/L5Cy9Vec2zbnfPi4R8sk+s1WlQrEOCnjdjpDVL16lo79GxN3aVdad74cJkdy0TH77nkOBdon7mXkvky50ObQBDp1h/r9vf2t36Xp9cPVuEu3mMjMGwlXcrb6PQUS7wdU9WrXIvmWL8QqjJ3xXL0fR3oaMrENoP9ttbt0QvJ2LllOvNnFbymzxL0QD+2xAgcmHuvw1PAr4vfJbiS0dd2YKTfHL+/SmAj9eKJ39gDq9VenrtnK1e5gsilD8b0KQWPbg14U2tSUAvEYNyGTIO4unSVFgVhnzp3dsBXyGjVLsr0uMrqvtzfO49oD4GgLbcAR9cyerlk0tbvaXWm+S6el7vmEZl77XgVb36/nTfSxnvu5qK0fGp/MmXkwtfO8gDAnPLRRQi93wnsLqZrbIHFdJBRaRv0GtuM2qvO44/8cX6PyS5Phx+ZCHwvcw7w7t+HGaVE23H81HlE527YDLEjFRsFJPkmfzGOsFwhZh9vqxphgBuZ7uAJtG+JYtESuJmgVfbj174T2HKnYxSw1LcuvNrGoT6QwTOsjn3pl07S82Kjrn3L2IA7EHIKxqdsYG3SPRdoPWt+lGyT7xkNXq7JVVPJgVnE0sefu+cpwuR+XCc4XZqqNBSC/0bEj8OFlIDJ/YOj6ctrVp3/leE1ncqA6hvI6TMvGVrWzb21Z3JKKsyM37JMOuPz8Z44H0oVw9NyD9GxDFoSFPDOK0GwGj/TR//vLv59DQkr4w9uWRa2lF4c8K6cG5zNquKazPCrnoSMFncM4e8FmBg9ltAV0sNGAjOCl0nF8K2s77/gJ4ppCm30adyUggNmau6zVYlmPNVrwQQT7ElgAzOVzISFD3rLaKK4YDtinj4FrDuqPSLeqLfrwQsptr5lVW3ldVucxCMM1QQPg7vcZv2kxVzVvZA5v3w7XE7DUILIt3s62GA5XcQQX870iPsn8o4NoFpsQDJ7cK3Jkx6Qrjvu/icC75HBWLjchsztjGGV2YMZ6ngnOGJUfvxzlztMIqyHz6lFUT/JnH44qlFvvpNd6AqHNkyGvruen0UXI3bdtvtmRvcVdnESlUMWfvCMm6uZ3lHmMECsvcvxdobW6pqFRQgy6EWFvvFEWavzT9+cXC9bb1w/orHYUt6/qKIOXugebenY9FGdXN5qLhjbvuW3H/02iTnl+IHv/vaqblHOI7n62KZrchc5E1gbbiiRRNKmqtbWpQBXHQhsqAmdc4vscaCoBtQUrXZmknouze23HvDlVaA3SNCweQHx1J3eY8w2rmAH55kJhAptlxzG4roFvCaQyXkNU8ttPUhqsCPqCnz0TD/s2NO2oW5fxlUrCg0xoOYItc6ENfFoz1qk78ErT5IRl9eWfvkanuC1OmwySw5SIcWXkXy2oRIjcuyTyic0DG6uhFkext5hlv/3Loz3+YbfQxlVtmanUKumKo5CTp3w+lbJBeIyuAqkWXrinrh5jN9DzSjjXiwZ13Wi8c8NMFQwl+VwJT+r69ayjba7fln86bN5jZmf5GMZ1BDRgqC7TC4oGrDBqLkx5ENfSZEs57izGLVATweIJmx8bfb0AJr/tMuNJ5voUfJkFMnXzBFRHbUujK/jf8iUQR5sLQL2iduehqfW03x0cU8+0ES8ckJp2jxlNEQAJlxk59YUvX4VCaBvBaXpFVGVgK/dFWTkZypGD9aoOqeZvfD3WNjZ5k8YShnMkEAgYJ9GD+M0HS7Rvkhz4zvFzdwutaobMg5U+9sa2PKlhK3KfEjfoW4EJHdCfpgV9+oKxwfvwysAw5R5I5MYVSIueue6LCoijoQ6Lyvi4oUNegOd6Qs2qcwBA55BGM0r2XIsGTjuYMss8t+Jm6rfFGOO0YaC38KelaUctTXRUI1RdpMFqbHv5WV4G4vNp89d990NNFCUtIY6nHOsqNyB2p9MiQszLyjVHxkHqCC1gX3HKTagp5wcbQ2c0quGgjy7y4tPn+5sNVcub67M/EGsIbYbccPEmrxqb2hgaJq1WmGMwaz6J6lcOGb86zCl/q12fouxp6IEtVwcqETmVY2jLxNF/2LcJ5FrCV1nCqF46/nQxD3UDyxe0PY5LKoF8nKxyVsENjyYmGxOzrY/HPgws51OCTggl2voizlyjAznUrgWH9c3ECkrZ/BH3MeQTl+V810dqMQr63xk8V0Lb8qWbFplFrVWYPfdoyZqi7+JWK3muk6yYGBskZBdLSB+R1ORsfbMX6JDXXs8L8nxGiz4EC1kILSGyQDQWEO2J7PaNidLnrmOF7ZmPyMzNBOZzmY/+QSDJk5AfXiOcNAZ9BZNlitfRkX6KyngEGU3WInDUIONc+99bMFqWI0EuNa3jV4lyhTZq0rf8RSyyKQBffSsieJlZL6ctN7glp73RJdz5jpgZm2SUn7hWNpNfwB/sYodjE4pQW0jhc828yYtRioLeWeVxVS5gpis3DaHtuxZrPrnCk9FYmeDdmwu++6ELcTZnSXtmzqtxNhds6ztnq+4TkFcHPTArO9aCTp4RoIYJjWErlEwvv7JZCm3fhJ7yNaPR+sjhnCq0Td64b+uqPjIoUJaLrxSrNi+GPAWHeW5n1/zUvJilliXE45sZBZscmZ5BZbauEtp8oR2H38CCozG69TzzcQKEOAiFBphLt2Qpy8VWrJM3uC7U1YT52Gb/0muLg2aEqd7amtyCutNU024d6zxPM7hCq3SjcRGqcxGDUJg+GVrJu7FCuo3rCN24sMpjjWpREUax7sB5nibrfUdh4V8PspJCRuDsfbkCg03RA5E/fibW1A9YO0UNtiPH4v2i7sDCa5fqk/2CXqlVXIE3UuyD6F0s08uMg5UxK/Wlxdgq2nz68jew4/qrkst5T2E9r6gbz/gLMuPdklIfl9bBe5VjgaegvYh5MvKsUgqz1ZZB9W398FwoVo05093Zxo2cOmvm/brj0x6PEJzUyi3DtqC6vno8F6JMIbTZ+GXbGw+mkBO7fLIof5+JryPsnFF7gpX0CtSkzxijVf16xmmsX/qMQQDY0bauJjMNBYEyHNOdIw/bcDsBZ8RTtMous+YfawxNVMzQxcy3iQiYRyFWKOolgyZHcHwm135fLwj1eOcFVAvwn/KzCnR8gXVHnJvfHCXYAz/2gj5/jHtchAUrOmrcoYAcfRKEEYy2zBkcEqbA9wgLVfFcZ/cmEj7ONCZKoS3fesC2kE2T7YVAkdKOK0D6tL4q9WmOg8Rc0+blghT5tY2+R5dLfnWnq2nZtFnQLOsujNJASSsgdH23bWcnrdsx8UG5BVLysu3Au0KbT05nYlcCFF/aboUl1H9Gti677WXta6ssEIohw7YpFRwN53GdYCAf2M39XCHwHQCeDb4784EonZwZElu/t5WOTQrEqD2daFk9oKDZtgUy/ZS3dCMO/jJ+jrQRa7e2hx4ZXobnaROBN9LvoC/OopoAXIIxpUFHAN7XsEdnhUZ5eRnuV5y1ZeWLBeEIY7jnzCl7U6Gdf0eQV5ZPQwGLzHTgPFosoC+0wYLSC/r4sJYd1/oot1NSd1y0zpxdHgA8d2w0GlhsCuRfEewBP18xz/axMZ7nNvyF0lssIRkZ1rk8iwPFRHkPYwj4NxLlOiGGaIuMpH0kmtzPQNiWdAcJYrFxxr+YfkWjJc+Mfa3/3IEZv7H3vqqRp2SYpDpZH6uJZDhCZ/sdEQv5wFtQjosQuiCUCy2ixewRa8/ECkZ59A35yv1xaLJjI+6V8zjLoULab/lyTZto25U3azmphvM3K75wAOgTLnFqtbsKAN69UORU2Lcw9MAic5lpDO4gDxFyACzXTTngm9Vmo5lmh3chjWpij7zMLchSrwerWeHpnG3YFnzVR65pBzZIMczmzX1s6Pu1A4APA7jKGHXUeYGab0SstbZUddXV+sb7TBi/CV3CVEcTr9nDMy4HFPRBQYaD8Rr/rYRAywJaWQhjTJXQulrSKZng7Azz6v92FLYKonn1u/2YiHEF4EMHAn4JwG/FBEUaj+zvYWLW1Q2ludgbvhRanmdQQyB9rBEZzVxKR3O8ngVK3YN1/N7mRwO6YjC5k0/HxZ5gkQwCU+MMiWMhfZ82Qh4CFyT2V49VmRqLkoCjrP7SAUS/CtAvr4GOE+XJoLow0yxXysznAJ9T7c0Vwy+kN7QFZYzjufmhORY/EvPo+EpyCVKtTVCc7E+w4HliKa0f1W3MWRQPsF6w6U3jqBfGrjw3JvgoM545gPE8mN8LxoNocLnQFnDH8ssPxByKOyvWlouRh5hWGv72t+0bWnChL1MWHP1sa1pd2qOPwhKu41j4rzov89tn14yzulkfFca9WYFLAD9NRM8fZkjlaRx9XctQn0lu3qKfdc3+5XBd2CbUZrLkslgCwdmHta59SH5WsFU4aVEZO7ZxA6TCacfnDApe1fEie5lVBn9LeQ5cpnL8s1xwVVfw5KMAfh4ADnOlLzHwrxi4bwfgMckhJAs4TIphoRwHdXwj2d8wAznjN01U+F8O43P8sjM2OGX8Z8ZUG9dH9rm4dey2nfuQIX3JKa8URKuEFqXAj4/vM/AeBr5IBByeeOrTy9OfAei9pR82dqCYZyanEgrIumpkoXlaJmVDAJzJJfU7G0fEdAfyEmPL2ks1rWcJrCJwr6hqjaFvQTxNLV/0TXiX+bWVe9Dj3VjwPwH4WQD41v/8i8dL776ObwJA9wH8GAMfy5kcd+r6X1FafdJIKGKNuQWLlfn1gg2s4L2ll1RTW6Qr+mRnoTi02LFFlksHQImpToSdh/pwSgu+WKwVRojduMT0MXCogNY4a1NTLNr6GDP+CQH3n3v+nnz61Xd8+/LrrQB+AqDXpIxyfKN1chvf/PUu+ognCCzQgNY7Xr7QRs90v8fxlJp2HrbPF8GTpY9OkGQ02UlCa8txUVeMKhfaekE6/cS8dy4hWX9+lhnvPBwOH7i6usSrn34fgOGa0Sf+7afAIDz+4PB+AO8C8GwdcMgVqwjjsG6FZdp8oQp9sY2F9hSIZuxlG5ERMvL4IngyttLBMmMPKaT3JkJr8yIUB0i36Dlvk5FAlcbUrQv/WQb+5u/7PS/9wNX11Sq07ii+8hdfh/uPXuKx56e3APhxAG/0iNv9JUqhRU6AnsLgD4rRQfQ7lzEaUNG3LKiBmuAyDB+yCgPUQlv6Vxu5ykJaH8WbsC7ZcqG75QqtHZuwSJlPvwVa5PLeH8PHGHj3l164fv+3PHLAq3/+F6PRbekr73gSwBUIh28H8I8A/DkAjw7E2deSuCeM7st/RV0ZOPRMqDTTidlTTOfhSYyoKNaFyEND4LEtqj3tj30QgPSbG87RwsUvzXmJVaBqly4P4lKrJ4X2PoD3MuPHDtPFr189eIhX/8L7vFbj9NW/8B0A+DEQfT8Yf4tB30XAPUFv6LcMmqGCyhqarL7bNvBpgfaiCieoEDyfxtpXX2jr+fkxpJSMzfjgvsaLFufGu+a8MVRn8sulqZV6AOAjAP4lM/8sge6/SmnZYhZk+vKffz2mi4e4up5eTsDbGPgBAN8N4GUAXaSabCX+mFdrS8uA3uZF4NNWgZhiXh1MxYuqDsJk/djS5P2uNLbeGJH5oZuWfIjF8qTBl4WfVSDKuALoSzgK7H8A8PQ1X//2vekeXvFzTyNLpeAu6Ss/9CToEYAv8RgIfwRE3wfG9wJ4EsArADwOfTU/R8zqRNdorvbAp638PqeN3L2ING34HlXabw/Os2UCgZeaPPE3e3i0zA/NfHjB4XZ7m1JUDwH8DhhfANEnAP4QGB8E8AxNh+cvn7/EH3jff0Un/X9D3uNHk45pqgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0xMS0wNlQxMDo1MDo1NSswMTowMKO0v5oAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMTEtMDZUMTA6NTA6NDMrMDE6MDB9kzKCAAAAAElFTkSuQmCC',
			"is_valid": true,
			"label": "Subflow",
			"environment": "onprem",
			"description": "Control another workflow",
			"long_description": "Execute another workflow from this workflow",
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
			"environment": "onprem",
			"long_description": "Create a schedule based on cron",
		},
		{
			"name": "Email",	
			"type": "TRIGGER",
			"status": "uninitialized",
			"description": "Add your email provider",
			"trigger_type": "EMAIL",
			"errors": null,
			"is_valid": cloudSyncEnabled || isCloud ? true : false,
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
							<img alt="" style={{width: "80px", pointerEvents: "none", }} />
							: 
							<img alt="" src={trigger.large_image} style={{width: 80, height: 80, pointerEvents: "none", }} />

						const color = trigger.is_valid ? green : yellow
						return(
							<Draggable 
								key={index}
								onDrag={(e) => {handleTriggerDrag(e, trigger)}}
								onStop={(e) => {
									handleDragStop(e)
								}}
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
	var parsedApp = {}
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
				if (workflow.start === "" || workflow.start === undefined) {
					alert.error("Define a starting action first.")
					return
				}

				if (data.is_valid === false) {
					alert.error(data.name+" requires hybrid version of Shuffle")
					return
				}

				const triggerLabel = getNextActionName(data.name)

				newNodeId = uuid.v4()
				const newposition = {
					"x": e.pageX-cycontainer.offsetLeft,
					"y": e.pageY-cycontainer.offsetTop,
				}

				const newAppData = {
					app_name: data.name,
					app_version: "1.0.0",
					environment: isCloud ? "cloud" : data.environment,
					description: data.description,
					long_description: data.long_description,
					errors: [],
					id_: newNodeId,
					_id_: newNodeId,
					id: newNodeId,
					finished: false,
					label: triggerLabel,
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
				parsedApp = nodeToBeAdded
				return
			}
		}
	}

	const handleDragStop = (e, app) => {
		//console.log("STOP!: ", e)
		//console.log("APP!: ", parsedApp)
		//const onNodeAdded = (event) => {
		//const node = event.target
		//const nodedata = event.target.data()
		var currentnode = cy.getElementById(newNodeId)
		if (currentnode === undefined || currentnode === null || currentnode.length === 0) {
			return
		}

		// Using remove & replace, as this triggers the function
		// onNodeAdded() with this node after it's added 
		
		currentnode.remove()
		parsedApp.data.finished = true
		parsedApp.data.position = currentnode.renderedPosition()
		parsedApp.position = currentnode.renderedPosition()
		parsedApp.renderedPosition = currentnode.renderedPosition()

		var newAppData = parsedApp.data
		if (newAppData.type === "ACTION") {
			// AUTHENTICATION
			if (app.authentication.required) {
				// Setup auth here :)
				const authenticationOptions = []
				var findAuthId = ""
				if (newAppData.authentication_id !== null && newAppData.authentication_id !== undefined && newAppData.authentication_id.length > 0) {
					findAuthId = newAppData.authentication_id
				}

				var tmpAuth = JSON.parse(JSON.stringify(appAuthentication))
				for (var key in tmpAuth) {
					var item = tmpAuth[key]

					const newfields = {}
					for (var filterkey in item.fields) {
						newfields[item.fields[filterkey].key] = item.fields[filterkey].value
					}

					item.fields = newfields
					if (item.app.name === app.name) {
						authenticationOptions.push(item)
						if (item.id === findAuthId) {
							newAppData.selectedAuthentication = item
						}
					}
				}

				if (authenticationOptions !== undefined && authenticationOptions !== null && authenticationOptions.length > 0) {
					for (var key in authenticationOptions) {
						const option = authenticationOptions[key]
						if (option.active) {
							newAppData.selectedAuthentication = option 
							newAppData.authentication_id = option.id
							break
						}
					}
				}

				//newAppData.authentication = authenticationOptions
				//if (newAppData.selectedAuthentication === null || newAppData.selectedAuthentication === undefined || newAppData.selectedAuthentication.length === "") {
				//	newAppData.selectedAuthentication = {}
				//} else {
				//	console.log("CAN WE SELECT AUTH?: ", authenticationOptions)
				//}
				//
				//

				//console.log(parsedApp)			
			} else {
				newAppData.authentication = []
				newAppData.authentication_id = ""
				newAppData.selectedAuthentication = {}
			}

			parsedApp.data = newAppData
			cy.add(parsedApp)
		} else if (newAppData.type === "TRIGGER") {
			cy.add(parsedApp)

		}

		newNodeId = ""
		parsedApp = {}
	}

	const appScrollStyle = {
		overflow: "scroll",
		maxHeight: bodyHeight-appBarSize-55-50,
		minHeight: bodyHeight-appBarSize-55-50,
		marginTop: 1,
		overflowY: "auto",
		overflowX: "hidden",
	}

	const handleAppDrag = (e, app) => {
		const cycontainer = cy.container()

		// Chrome lol
		//if (e.srcElement !== undefined && e.srcElement.localName === "canvas") {
		if (e.pageX > cycontainer.offsetLeft && e.pageX < cycontainer.offsetLeft+cycontainer.offsetWidth && e.pageY > cycontainer.offsetTop && e.pageY < cycontainer.offsetTop+cycontainer.offsetHeight) {
			if (newNodeId.length > 0) {
				var currentnode = cy.getElementById(newNodeId)
				if (currentnode === undefined || currentnode === null || currentnode.length === 0) {
					return
				}

				currentnode[0].renderedPosition("x", e.pageX-cycontainer.offsetLeft)
				currentnode[0].renderedPosition("y", e.pageY-cycontainer.offsetTop)
			} else {
				if (workflow.public) {
					console.log("workflow is public - not adding")
					return
				}

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
				
				const parsedEnvironments = environments === null || environments === [] ? "cloud" : environments[defaultEnvironmentIndex] === undefined ? "cloud" : environments[defaultEnvironmentIndex].Name
				const newAppData = {
					app_name: app.name,
					app_version: app.app_version, 
					app_id: app.id,
					sharing: app.sharing,
					private_id: app.private_id,	
					environment: parsedEnvironments,
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
					category: app.categories !== null && app.categories !== undefined && app.categories.length > 0 ? app.categories[0] : "",
					authentication_id: "",
					finished: false,
				}

				// FIXME: overwrite category if the ACTION chosen has a different category

				// const image = "url("+app.large_image+")"
				// FIXME - find the cytoscape offset position 
				// Can this be done with zoom calculations?
				const nodeToBeAdded = {
					group: "nodes",
					data: newAppData,
					renderedPosition: {
						//x: e.layerX,
						//y: e.layerY,
						x: e.pageX-cycontainer.offsetLeft,
						y: e.pageY-cycontainer.offsetTop,
					}
				}

				parsedApp = nodeToBeAdded
				cy.add(nodeToBeAdded)
				return
				}
			}
		}

	const AppView = (props) => {
  	const { allApps, prioritizedApps, filteredApps } = props;
		const [visibleApps, setVisibleApps] = React.useState(prioritizedApps.concat(filteredApps.filter(innerapp => !internalIds.includes(innerapp.id))))	

		const ParsedAppPaper = (props) => {
			const app = props.app
			const [hover, setHover] = React.useState(false)

			const maxlen = 24
			var newAppname = app.name
			newAppname = newAppname.charAt(0).toUpperCase()+newAppname.substring(1)
			if (newAppname.length > maxlen) {
				newAppname = newAppname.slice(0, maxlen)+".."
			}
			newAppname = newAppname.replaceAll("_", " ")

			//const image = "url("+app.large_image+")"
			const image = app.large_image
			const newAppStyle = JSON.parse(JSON.stringify(paperAppStyle))
			const pixelSize = !hover ? "2px" : "4px"
			newAppStyle.borderLeft = app.is_valid ? `${pixelSize} solid ${green}` : `${pixelSize} solid ${yellow}`

			return (
				<Draggable 
						onDrag={(e) => {handleAppDrag(e, app)}}
						onStop={(e) => {
							handleDragStop(e, app)
						}}
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
								<img alt={newAppname} src={image} style={{pointerEvents: "none", userDrag: "none", userSelect: "none", borderRadius: theme.palette.borderRadius, height: 80, width: 80,}} />
							</Grid>
							<Grid style={{display: "flex", flexDirection: "column", marginLeft: "20px", minWidth: 185, maxWidth: 185, overflow: "hidden", maxHeight: 77, }}>
								<Grid item style={{flex: 1}}>
									<Typography variant="body1" style={{marginBottom: 0, marginTop: 5}}>
										{newAppname}
									</Typography>
								</Grid>
								<Grid item style={{flex: 1}}>
									<Typography variant="body2" color="textSecondary"> 
										Version: {app.app_version}	
									</Typography>
								</Grid>
								<Grid item style={{flex: 1, width: "100%", maxHeight: 27, overflow: "hidden",}}>
									<Typography variant="body2" color="textSecondary"> 
										{app.description}
									</Typography>
								</Grid>
							</Grid>
						</Grid>
					</Paper>
				</Draggable>
				)
		}

		const runSearch = (value) => {
			if (value.length > 0) {
				var newApps = allApps.filter(app => (app.name.toLowerCase().includes(value.trim().toLowerCase() || app.description.toLowerCase().includes(value.trim().toLowerCase()))) && !(!app.activated && app.generated))

				// Extend search
				if (newApps.length === 0) {
					const searchvalue = value.trim().toLowerCase()
					newApps = allApps.filter(app => {
						for (var key in app.actions) {
							const inneraction = app.actions[key]
							if (inneraction.name.toLowerCase().includes(searchvalue)) {
								return true
							}
						}

						return false
					})
				}

				//setFilteredApps(responseJson.filter(app => !internalIds.includes(app.name) && !(!app.activated && app.generated)))
				//console.log("FOUND: ", newApps)
				setVisibleApps(newApps)
			} else {
				setVisibleApps(prioritizedApps.concat(filteredApps.filter(innerapp => !internalIds.includes(innerapp.id))))
			}
		}

		return(
			<div style={appViewStyle}>
				<div style={{flex: "1"}}>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius, marginTop: 5, marginRight: 10,}} 
						InputProps={{
							style:{
								color: "white",
								minHeight: 50, 
								marginLeft: "5px",
								maxWidth: "95%",
								fontSize: "1em",
							},
							endAdornment: (
								<InputAdornment position="end">
									<Tooltip title="Run search" placement="top">
										<SearchIcon style={{cursor: "pointer"}} />
									</Tooltip>
								</InputAdornment>
							)
						}}
						fullWidth
						color="primary"
						placeholder={"Search Active Apps"}
						id="appsearch"
						onKeyPress={(event) => {
							if (event.key === "Enter") {
								event.target.blur(event)
							}
						}}
						onBlur={(event) => {
							console.log("BLUR: ", event.target.value)
							runSearch(event.target.value)
						}}
					/>
					{visibleApps.length > 0 ?
						<div style={appScrollStyle}>
							{visibleApps.map((app, index) => {	
								if (app.invalid) {
									return null
								}

								return(
									<ParsedAppPaper key={index} app={app} />	
								)
							})}
						</div>
						:
						apps.length > 0 ? 
							<div style={{textAlign: "center", width: leftBarSize, marginTop: 10, }}>
								<Typography variant="body1" color="textSecondary">
									Couldn't find app. Is it active?	
								</Typography>
							</div>
						:
							<div style={{textAlign: "center", width: leftBarSize}}>
								<CircularProgress style={{marginTop: 25, height: 35, width: 35, marginLeft: "auto", marginRight: "auto", }} /> 
								<Typography variant="body1" color="textSecondary">
									Loading apps
								</Typography>
							</div>
					}
				</div>
			</div>
		)
	}

	const getNextActionName = (appName) => {
		var highest = ""
		//label = name + _number
		const allitems = workflow.actions.concat(workflow.triggers)
		for (var key in allitems) {
			const item = allitems[key]
			if (item.app_name === appName && item.label !== undefined && item.label !== null) {
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
		if (newaction === undefined || newaction === null) {
			alert.error("Failed to find the action")
			return
		}

		// Does this one find the wrong one?
		var newSelectedAction = selectedAction
		newSelectedAction.name = newaction.name
		newSelectedAction.parameters = JSON.parse(JSON.stringify(newaction.parameters))
		newSelectedAction.errors = []
		newSelectedAction.isValid = true
		newSelectedAction.is_valid = true

		if (newSelectedAction.app_name === "Shuffle Tools") {
			const iconInfo = GetIconInfo(newSelectedAction)
			console.log("ICONINFO: ", iconInfo)
			const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
			const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)
			newSelectedAction.large_image = svgpin_Url
			newSelectedAction.fillGradient = iconInfo.fillGradient
			newSelectedAction.fillstyle = "solid"
			if (newSelectedAction.fillGradient !== undefined && newSelectedAction.fillGradient !== null && newSelectedAction.fillGradient.length > 0) {
				newSelectedAction.fillstyle = 'linear-gradient'
				console.log("GRADIENT!: ", newSelectedAction)
				//action.fillstyle = 
				//'background-fill': 'data(fillstyle)',
			} else {
				newSelectedAction.iconBackground = iconInfo.iconBackgroundColor
			}

			const foundnode = cy.getElementById(newSelectedAction.id)
			if (foundnode !== null && foundnode !== undefined) {
				console.log("UPDATING NODE!")
				foundnode.data(newSelectedAction)
			}
		}

		// Takes an action as input, then runs through and updates the relevant fields
		// based on previous actions' 
		newSelectedAction = RunAutocompleter(newSelectedAction)

		console.log("ACTION: ", newSelectedAction)

		if (newaction.returns.example !== undefined && newaction.returns.example !== null && newaction.returns.example.length > 0) {
			newSelectedAction.example = newaction.returns.example 
		}

		// FIXME - this is broken sometimes lol
		//var env = environments.find(a => a.Name === newaction.environment)
		//if ((!env || env === undefined) && selectedAction.environment === undefined ) {
		//	env = environments[defaultEnvironmentIndex]
		//} 
		//setSelectedActionEnvironment(env)
		
		setSelectedAction(newSelectedAction)
		setUpdate(Math.random())

		// FIXME - should change icon-node (descriptor) as well 
		const allNodes = cy.nodes().jsons()
		for (var key in allNodes) {
			const currentNode = allNodes[key]
			if (currentNode.data.attachedTo === selectedAction.id && currentNode.data.isDescriptor) {
				const foundnode = cy.getElementById(currentNode.data.id)
				if (foundnode !== null && foundnode !== undefined) {
					const iconInfo = GetIconInfo(newaction)
					const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`
					const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)
					foundnode.data("image", svgpin_Url)
					foundnode.data("imageColor", iconInfo.iconBackgroundColor) 
				}

				break
			}
		}
	}

	// APPSELECT at top
	// appname & version 
	// description
	// ACTION select
	//
	const selectedNameChange = (event) => {
		//console.log("OLDNAME: ", selectedAction.name)
		event.target.value = event.target.value.replaceAll("(", "")
		event.target.value = event.target.value.replaceAll(")", "")
		event.target.value = event.target.value.replaceAll("]", "")
		event.target.value = event.target.value.replaceAll("[", "")
		event.target.value = event.target.value.replaceAll("{", "")
		event.target.value = event.target.value.replaceAll("}", "")
		event.target.value = event.target.value.replaceAll("*", "")
		event.target.value = event.target.value.replaceAll("!", "")
		event.target.value = event.target.value.replaceAll("@", "")
		event.target.value = event.target.value.replaceAll("#", "")
		event.target.value = event.target.value.replaceAll("$", "")
		event.target.value = event.target.value.replaceAll("%", "")
		event.target.value = event.target.value.replaceAll("&", "")
		event.target.value = event.target.value.replaceAll("#", "")
		event.target.value = event.target.value.replaceAll(".", "")
		event.target.value = event.target.value.replaceAll(",", "")
		event.target.value = event.target.value.replaceAll(" ", "_")
		selectedAction.label = event.target.value
		setSelectedAction(selectedAction)

		//console.log("SHOULD CHANGE NAME EVERYWHERE ITS USED TOO BASED ON OLD NAME!")

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

	// Starts on current node and climbs UP the tree to the root object. 
	// Sends back everything in it's path
	const getParents = (action) => {
		var allkeys = [action.id]
		var handled = []
		var results = []

		// maxiter = max amount of parent nodes to loop
		// also handles breaks if there are issues
		var iterations = 0
		var maxiter = 10
		while(true) {
			for (var key in allkeys) {
				var currentnode = cy.getElementById(allkeys[key])
				if (currentnode === undefined || currentnode === null) {
					continue
				} 
				
				if (currentnode.data() === undefined) {
					//console.log("Node doesn't have any data (getParents)! Probably a trigger.")
					handled.push(allkeys[key])
					results.push({"id": allkeys[key], "type": "TRIGGER"})
				} else {
					if (handled.includes(currentnode.data().id)) {
						continue
					} else {
						handled.push(currentnode.data().id)
						results.push(currentnode.data())
					}
				}

				// Get the name / label here too?
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

			if (results.length === allkeys.length || iterations === maxiter) {
				break
			}

			iterations += 1
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

	var rightsidebarStyle = {
		position: "fixed", 
		right: 0, 
		top: appBarSize+1,
		height: "100%",
		bottom: 0,
		minWidth: 350, 
		maxWidth: 350, 
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
		//console.log("IN APPACTIONARG: ", selectedEdge)
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
				//console.log(destAction.data())
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
				style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
				InputProps={{
					style:{
						color: "white",
						minHeight: 50, 
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
				helperText={data.value !== undefined && data.value !== null && data.value.includes(".#") ? 
					<span style={{color:"white", marginBottom: 5, marginleft: 5,}}>
						Use "Shuffle Tools" app with "Filter List" action to handle loops 
					</span>
					: null
				}
				onClick={() => {
					//console.log("CHANGE FIELD")
				}}
				onBlur={(e) => {
					changeActionVariable(data.action_field, e.target.value)
					setUpdate(Math.random())
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
		<span style={{position: "absolute", bottom: 10, left: 10, color: "rgba(255,255,255,0.6)",}}>
			Conditions can't be used for loops [ .# ] <a rel="norefferer" target="_blank" href="https://shuffler.io/docs/workflows#conditions" style={{textDecoration: "none", color: "#f85a3e"}}>Learn more</a> 
		</span>
		<FormControl>
			<DialogTitle><span style={{color:"white"}}>Condition</span>
			</DialogTitle>
				<DialogContent style={{}}>

					<div style={{display: "flex"}}>
					<Tooltip color="primary" title={conditionValue.configuration ? "Negated" : "Default"} placement="top">
						<span style={{margin: "auto", height: 50, marginBottom: "auto", marginTop: "auto", marginRight: 5}}>
							<Button color="primary" variant={conditionValue.configuration ? "contained" : "outlined"} style={{margin: "auto", height: 50, marginBottom: "auto", marginTop: "auto", marginRight: 5}} onClick={(e) => {
								conditionValue.configuration = !conditionValue.configuration
								setConditionValue(conditionValue)
								setUpdate(Math.random())
							}}>
								{conditionValue.configuration ? "!" : "="}
							</Button>
						</span>
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
								conditionValue.value = "contains"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"contains"}>contains</MenuItem>
							<MenuItem style={menuItemStyle} onClick={(e) => {
								conditionValue.value = "contains_any_of"
								setConditionValue(conditionValue)
								setVariableAnchorEl(null)
							}} key={"contains_any_of"}>contains any of</MenuItem>
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

							var label = ""
							if (selectedEdge.conditions.length === 1) {
								label = selectedEdge.conditions.length+" condition"
							} else if (selectedEdge.conditions.length > 1) {
								label = selectedEdge.conditions.length+" conditions"
							}

							var currentedge = cy.getElementById(selectedEdge.id)
							if (currentedge !== undefined && currentedge !== null) {
								currentedge.data().label = label
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

			const duplicateCondition = (conditionIndex) => {
				
				var newEdge = JSON.parse(JSON.stringify(selectedEdge.conditions[conditionIndex]))
				const newUuid = uuid.v4()
				newEdge.condition.id = newUuid
				newEdge.source.id = newUuid
				newEdge.destination.id = newUuid
				selectedEdge.conditions.push(newEdge)

				setUpdate(Math.random())
			}

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
				<Paper key={condition.condition.id} square style={paperVariableStyle} onClick={() => {}}>
					<div style={{marginLeft: "10px", marginTop: "5px", marginBottom: "5px", width: "2px", backgroundColor: yellow, marginRight: "5px"}} />
					<div style={{display: "flex", width: "100%"}}>
						<div style={{flex: "10", display: "flex"}} onClick={() => {
								setSourceValue(condition.source)
								setConditionValue(condition.condition)
								setDestinationValue(condition.destination)
								setConditionsModalOpen(true)
							}}>
							<div style={{flex: 1, textAlign: "left", marginTop: "15px", marginLeft: "10px", overflow: "hidden", maxWidth: 72, }}>
								{condition.source.value} 
							</div>
							<Divider style={{height: "100%", width: "1px", marginLeft: "5px", marginRight: "5px", backgroundColor: "rgb(91, 96, 100)"}}/>
							<div style={{flex: 1, textAlign: "center", marginTop: "15px", overflow: "hidden", maxWidth: 72,}} onClick={() => {}}>
								{condition.condition.value}
							</div>
							<Divider style={{height: "100%", width: "1px", marginLeft: "5px", marginRight: "5px", backgroundColor: "rgb(91, 96, 100)"}}/>
							<div style={{flex: 1, textAlign: "left", marginTop: "auto", marginBottom: "auto", marginLeft: "10px", overflow: "hidden", maxWidth: 72, }}>
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
								duplicateCondition(index)
							}} key={"Duplicate"}>{"Duplicate"}</MenuItem>
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
						<a rel="norefferer" target="_blank" href="https://shuffler.io/docs/workflows#conditions" style={{textDecoration: "none", color: "#f85a3e"}}>What are conditions?</a>
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
			fetch(globalUrl+"/api/v1/triggers/outlook/getFolders?trigger_id="+selectedTrigger.id, {
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
				if (responseJson !== null && responseJson.success !== false) {
					setTriggerFolders(responseJson)
				}

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
			fetch(globalUrl+"/api/v1/triggers/outlook/"+selectedTrigger.id, {
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
			<Button 
				fullWidth
				variant="contained" 
				style={{flex: "1",}} 
				color="primary"
				onClick={() => {
					const redirectUri = isCloud ? "https%3A%2F%2Fshuffler.io%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister" : "http%3A%2F%2Flocalhost:5001%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister"
					//const redirectUri = isCloud ? "http%3A%2F%2Flocalhost:5002%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister" : "http%3A%2F%2Flocalhost:5001%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister"

					const client_id = "fd55c175-aa30-4fa6-b303-09a29fb3f750"
					const username = isCloud ? userdata.username : userdata.id
					console.log(redirectUri)
					console.log("USER: ", username, userdata)

					const branch = workflow.branches.find(branch => branch.source_id === selectedTrigger.id)
					if (branch === undefined || branch === null) {
						alert.error("No startnode connected to node. Connect it to an action.")	
						return
					}

					console.log("BRANCH: ", branch)
					const startnode = branch.destination_id
					const url = "https://login.microsoftonline.com/common/oauth2/authorize?client_id="+client_id+"&redirect_uri="+redirectUri+"&resource=https%3A%2F%2Fgraph.microsoft.com&response_type=code&scope=Mail.Read+User.Read+https%3A%2F%2Foutlook.office.com%2Fmail.read&state=workflow_id%3D"+props.match.params.key+"%26trigger_id%3D"+selectedTrigger.id+"%26username%3D"+username+"%26type%3Doutlook%26start%3d"+startnode
					console.log("URL: ", url)

					var newwin = window.open(url, "", "width=200,height=100")

					// Check whether we got a callback somewhere
					var id = setInterval(function () {
						fetch(globalUrl+"/api/v1/triggers/outlook/"+selectedTrigger.id, {
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

					saveWorkflow(workflow)
				}} >
				Microsoft Outlook
			</Button>


		// FIXME - set everything in here to multifolder etc
		var triggerInfo = "SET UP BUT NO TYPE :)"
		if (Object.getOwnPropertyNames(triggerAuthentication).length > 0) {
			// Should get the folders if they don't already exist

			if (triggerAuthentication.type === "outlook") {
				triggerInfo = <div>
						{selectedTrigger.status === "running" ? null : 
							<span>
								<div style={{marginTop: 20, marginBottom: 7, display: "flex"}}>
									<div style={{width: 17, height: 17, borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: 10}}/>
									<div style={{flex: "10"}}> 
										<b>Login </b> 
									</div>
								</div>
								{outlookButton}
							</span>
						}

						{triggerFolders === undefined || triggerFolders === null ? 
							null :
							<span>
								<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
									<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
									<div style={{flex: "10"}}> 
										<b>Select a folder </b>
									</div>
								</div>
								<Select
									multiple
									native
									rows="10"
									value={selectedTrigger.parameters[0].value.split(splitter)}
									style={{backgroundColor: inputColor, color: "white", height: 50,}}
									disabled={selectedTrigger.status === "running"}
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
										//console.log("FOLDER: ", folder)
										//var folderItem = <option key={folder.displayName} value={folder.displayName} style={{marginLeft: 10, fontSize: "1.2em", backgroundColor: inputColor,}}>
										var folderItem = <option key={folder.displayName} style={{backgroundColor: inputColor, fontSize: "1.2em"}} value={folder.displayName}>
											{folder.displayName}
										</option>

										if (folder.childFolderCount > 0) {
											// Here to handle subfolders sometime later	
											folderItem = 
												<option key={folder.displayName} value={folder.displayName} style={{marginLeft: "10px", }}>
													{folder.displayName}
												</option>
										}

										return folderItem
									})}
								</Select>
							</span>
					}
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
						<b>Login to either </b> 
					</div>
				</div>
				{outlookButton}	
				{/*
				<Button variant="contained" style={{marginLeft: "5px", flex: "1",}} onClick={() => {
					alert.error("REMOVE THIS FIELD FOR GMAIL - make it oAuth something")
				}} color="primary">
					Gmail	
				</Button>
				*/}
			</div>
		
		return(
			<div style={appApiViewStyle}>
				<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
					<div style={{flex: "1"}}>
						<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}: {selectedTrigger.status}</h3>
						<a rel="norefferer" target="_blank" href="https://shuffler.io/docs/triggers#email" style={{textDecoration: "none", color: "#f85a3e"}}>What are email triggers?</a>
					</div>
				</div>
				<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
				<div>
					Name
				</div>
				<TextField
					style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
					InputProps={{
						style:{
							color: "white",
							marginLeft: "5px",
							maxWidth: "95%",
							height: 50, 
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
						style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
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

	const SubflowSidebar = () => {
		const [menuPosition, setMenuPosition] = useState(null)
		const [showDropdown, setShowDropdown] = React.useState(false)
		const [showDropdownNumber, setShowDropdownNumber] = React.useState(0)
		const [showAutocomplete, setShowAutocomplete] = React.useState(false)
		const [actionlist, setActionlist] = React.useState([])

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

			var parents = getParents(selectedAction)
			if (parents.length > 1) {
				for (var key in parents) {
					const item = parents[key]
					if (item.label === "Execution Argument") {
						continue
					}

					var exampledata = item.example === undefined ? "" : item.example
					// Find previous execution and their variables
					//exampledata === "" && 
					if (workflowExecutions.length > 0) {
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

							var jsonvalid = true
							try {
								const tmp = String(JSON.parse(foundResult.result))
								if (!foundResult.result.includes("{") && !foundResult.result.includes("[")) {
									jsonvalid = false
								}
							} catch (e) {
								try {
									foundResult.result = foundResult.result.split("\'").join("\"")
									const tmp = String(JSON.parse(foundResult.result))
									if (!foundResult.result.includes("{") && !foundResult.result.includes("[")) {
										jsonvalid = false
									}
								} catch (e) {
									jsonvalid = false
								}
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

			//console.log("ACTIONS: ", actionlist)
			setActionlist(actionlist)
		}

		// Shows nested list of nodes > their JSON lists
		const ActionlistWrapper = (props) => {
  		const { data } = props;

			const handleMenuClose = () => {
				setShowAutocomplete(false)

				//if (!selectedActionParameters[count].value[selectedActionParameters[count].value.length-1] === "$") {
				//	setShowDropdown(false)
				//}

				setUpdate(Math.random())
				setMenuPosition(null)
			}

			const handleItemClick = (values) => {
				if (values === undefined || values === null || values.length === 0) {
					return
				}

				var toComplete = workflow.triggers[selectedTriggerIndex].parameters[1].value.trim().endsWith("$") ? values[0].autocomplete : "$"+values[0].autocomplete
				for (var key in values) {
					if (key == 0 || values[key].autocomplete.length === 0) {
						continue
					}

					toComplete += values[key].autocomplete
				}

				// Handles the fields under OpenAPI body to be parsed.
				if (data.name.startsWith("${") && data.name.endsWith("}")) {
					console.log("INSIDE VALUE REPLACE: ", data.name, toComplete)
					// PARAM FIX - Gonna use the ID field, even though it's a hack
					const paramcheck = selectedAction.parameters.find(param => param.name === "body")
					if (paramcheck !== undefined) {
						if (paramcheck["value_replace"] === undefined || paramcheck["value_replace"] === null) {
							paramcheck["value_replace"] = [{
								"key": data.name,
								"value": toComplete,
							}]

						} else {
							const subparamindex = paramcheck["value_replace"].findIndex(param => param.key === data.name)
							if (subparamindex === -1) {
								paramcheck["value_replace"].push({
									"key": data.name,
									"value": toComplete,
								})
							} else {
								paramcheck["value_replace"][subparamindex]["value"] += toComplete
							}
						}
						
						workflow.triggers[selectedTriggerIndex].parameters[1]["value_replace"] = paramcheck
						setSelectedAction(selectedAction)
						setUpdate(Math.random())

						setShowDropdown(false)
						setMenuPosition(null)
						return
					}
				}

				//workflow.triggers[selectedTriggerIndex].parameters[1].value = selectedActionParameters[count].value 
				setSelectedAction(selectedAction)
				setUpdate(Math.random())

				setShowDropdown(false)
				setMenuPosition(null)
			}

			const iconStyle = {
				marginRight: 15,
			}

			return (
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

								if (cy !== undefined) {
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
					}

					const handleActionHover = (inside, actionId) => {
						if (cy !== undefined) {
							var node = cy.getElementById(actionId)
							if (node.length > 0) {
								if (inside) {
									node.addClass('shuffle-hover-highlight')
								} else {
									node.removeClass('shuffle-hover-highlight')
								}
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
								style={{backgroundColor: theme.palette.inputColor, color: "white", minWidth: 250,}}
								onClick={() => {
									handleItemClick([innerdata])
								}}
							>
								{parsedPaths.map((pathdata, index) => {
									// FIXME: Should be recursive in here
									const icon = pathdata.type === "value" ? <VpnKeyIcon style={iconStyle} /> : pathdata.type === "list" ? <FormatListNumberedIcon style={iconStyle} /> : <ExpandMoreIcon style={iconStyle} /> 
									return (
										<MenuItem key={pathdata.name} style={{backgroundColor: theme.palette.inputColor, color: "white", minWidth: 250, }} value={pathdata} onMouseOver={() => {}}
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
							<MenuItem key={innerdata.name} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={innerdata} onMouseOver={() => handleMouseover()} onMouseOut={() => {handleMouseOut()}} 
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
			)
		}

		if (Object.getOwnPropertyNames(selectedTrigger).length > 0) {
			if (workflow.triggers[selectedTriggerIndex] === undefined) {
				return null
			}

			if (workflow.triggers[selectedTriggerIndex].parameters === undefined || workflow.triggers[selectedTriggerIndex].parameters === null || workflow.triggers[selectedTriggerIndex].parameters.length === 0) {
				workflow.triggers[selectedTriggerIndex].parameters = []
				workflow.triggers[selectedTriggerIndex].parameters[0] = {"name": "workflow", "value": ""}
				workflow.triggers[selectedTriggerIndex].parameters[1] = {"name": "argument", "value": ""}
				workflow.triggers[selectedTriggerIndex].parameters[2] = {"name": "user_apikey", "value": ""}
				workflow.triggers[selectedTriggerIndex].parameters[3] = {"name": "startnode", "value": ""}
				workflow.triggers[selectedTriggerIndex].parameters[4] = {"name": "check_result", "value": "true"}

				console.log("SETTINGS: ", userSettings)
				if (userSettings !== undefined && userSettings !== null && userSettings.apikey !== null && userSettings.apikey !== undefined && userSettings.apikey.length > 0) {
					workflow.triggers[selectedTriggerIndex].parameters[2] = {"name": "user_apikey", "value": userSettings.apikey}
				}
			} 

			return(
				<div style={appApiViewStyle}>					
					<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
						<div style={{flex: "1"}}>
							<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}</h3>
							<a rel="norefferer" target="_blank" href="https://shuffler.io/docs/triggers#subflow" style={{textDecoration: "none", color: "#f85a3e"}}>What are subflows?</a>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div>
						Name
					</div>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={selectedTrigger.label}
						onChange={selectedTriggerChange}
					/>
					<FormControlLabel
						control={
							<Checkbox 
								checked={workflow.triggers[selectedTriggerIndex].parameters[4] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[4].value === "true"} 
								onChange={() => {
									const newvalue = workflow.triggers[selectedTriggerIndex].parameters[4] === undefined || workflow.triggers[selectedTriggerIndex].parameters[4].value === "false" ? "true" : "false"
									workflow.triggers[selectedTriggerIndex].parameters[4] = {
										"name": "check_result",
										"value": newvalue,
									}

									setWorkflow(workflow)
									setUpdate(Math.random())
								}} 
								color="primary"
								value="Wait for results" 
							/>
						}
						style={{marginTop: 10}}
						label={<div style={{color: "white"}}>Wait for results</div>}
					/>
					<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div style={{flex: "6", marginTop: "20px"}}>
						<div>
							<b>Parameters</b>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Select a workflow to execute </b> 
								</div>
							</div>
							{workflows === undefined || workflows === null || workflows.length === 0 ? null : 
								<Select
									value={subworkflow}
									SelectDisplayProps={{
										style: {
											marginLeft: 10,

										}
									}}
									fullWidth
									onChange={(e) => {
										setUpdate(Math.random())
										workflow.triggers[selectedTriggerIndex].parameters[0].value = e.target.value.id
										setSubworkflowStartnode(e.target.value.start)

										// Sets the startnode
										if (e.target.value.id !== workflow.id) {
											console.log("WORKFLOW: ", e.target.value)

											setSubworkflow(e.target.value)
											const startnode = e.target.value.actions.find(action => action.id === e.target.value.start)
											if (startnode !== undefined && startnode !== null) {
												//ddsetSubworkflowStartnode(innernode)
												setSubworkflowStartnode(startnode)

												try {
													workflow.triggers[selectedTriggerIndex].parameters[3].value = e.target.value.id
												} catch {
													workflow.triggers[selectedTriggerIndex].parameters[3] = {
														"name": "startnode",
														"value": e.target.value.id,
													}
												}
											}
											console.log("STARTNODE: ", startnode)
										} else {
											console.log("WORKFLOW: ", workflow)
											setSubworkflow(e.target.value)
										}

										setWorkflow(workflow)
									}}
									style={{backgroundColor: inputColor, color: "white", height: 50}}
								>
									{workflows.map((data, index) => {
										if (data.id === workflow.id) {
											//return null	
											data = workflow
										}

										return (
											<MenuItem key={index} style={{backgroundColor: inputColor, color: data.id === workflow.id ? "red" : "white"}} value={data}>
												{data.name}
											</MenuItem>
										)
									})}
								</Select>
							}
							{workflow.triggers[selectedTriggerIndex].parameters[0].value.length === 0 ? null : 
								workflow.triggers[selectedTriggerIndex].parameters[0].value === props.match.params.key ? null :
								<span style={{marginTop: 5}}><a rel="norefferer" href={`/workflows/${workflow.triggers[selectedTriggerIndex].parameters[0].value}`} target="_blank" style={{textDecoration: "none", color: "#f85a3e", marginLeft: 5,}}>Explore selected workflow</a></span>
							}

							{subworkflow === undefined || subworkflow === null || subworkflow.id === undefined || subworkflow.actions === null || subworkflow.actions === undefined || subworkflow.actions.length === 0 ? null : 
								<span>
									<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
										<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
										<div style={{flex: "10"}}> 
											<b>Select the Startnode</b> 
										</div>
									</div>
										<Select
										value={subworkflowStartnode}
										SelectDisplayProps={{
											style: {
												marginLeft: 10,

											}
										}}
										fullWidth
										onChange={(e) => {
											setSubworkflowStartnode(e.target.value)
											//console.log("WF: ", workflow)

											const branchId = uuid.v4()
											const newbranch = {
												"source_id": workflow.triggers[selectedTriggerIndex].id,
												"destination_id": e.target.value.id,
												"source": workflow.triggers[selectedTriggerIndex].id,
												"target": e.target.value.id,
												"has_errors": false,
												"id": branchId,
												"_id": branchId,
												"label": "Subflow",
												"decorator": true,
											}

											if (workflow.visual_branches !== undefined) {
												if (workflow.visual_branches === null) {
													workflow.visual_branches = [newbranch]
												} else if (workflow.visual_branches.length === 0) {
													workflow.visual_branches.push(newbranch)
												} else {
													const foundIndex = workflow.visual_branches.findIndex(branch => branch.source_id === newbranch.source_id) 
													if (foundIndex !== -1) {
														const currentEdge = cy.getElementById(workflow.visual_branches[foundIndex].id)
														if (currentEdge !== undefined && currentEdge !== null) {
															currentEdge.remove()
														}
													}
							
													workflow.visual_branches.splice(foundIndex, 1)
													workflow.visual_branches.push(newbranch)
												}
											}

											if (workflow.id == subworkflow.id) {
												const cybranch = {
													group: "edges",
													source: newbranch.source_id,
													target: newbranch.destination_id,
													id: branchId,
													data: newbranch,
												}

												cy.add(cybranch)
											}

											try {
												workflow.triggers[selectedTriggerIndex].parameters[3].value = e.target.value.id
											} catch {
												workflow.triggers[selectedTriggerIndex].parameters[3] = {
													"name": "startnode",
													"value": e.target.value.id,
												}
											}

											setWorkflow(workflow)
											//setUpdate(Math.random())
										}}
										style={{backgroundColor: inputColor, color: "white", height: 50}}
									>
										{subworkflow.actions.map((action, index) => {
											//console.log(action)
											return (
												<MenuItem  key={index} style={{backgroundColor: inputColor, color: getParents(selectedTrigger).find(parent => parent.id === action.id) ? "red" : "white"}} value={action}>
													{action.label}
												</MenuItem>
											)
										})}
									</Select>
								</span>
							}
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Execution Argument</b> 
								</div>
							</div>
							<TextField
								style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										marginLeft: "5px",
										maxWidth: "95%",
										fontSize: "1em",
									},
									endAdornment: (
										<InputAdornment position="end">
											<Tooltip title="Autocomplete text" placement="top">
												<AddCircleOutlineIcon style={{cursor: "pointer"}} onClick={(event) => {
													setMenuPosition({
														top: event.pageY+10,
														left: event.pageX+10,
													})
													//setShowDropdownNumber(3)
													setShowDropdown(true)
													setShowAutocomplete(true)
												}}/>
											</Tooltip>
										</InputAdornment>
									)
								}}
								rows="6"
								multiline
								fullWidth
								color="primary"
								placeholder="Some execution data"
								defaultValue={workflow.triggers[selectedTriggerIndex].parameters[1].value}
								onBlur={(e) => {
									console.log("DATA: ", e.target.value)	
									workflow.triggers[selectedTriggerIndex].parameters[1].value = e.target.value
									setWorkflow(workflow)
								}}
							/>
							{showDropdown ?
								<ActionlistWrapper actionlist={actionlist} data={workflow.triggers[selectedTriggerIndex]} />
							: null}
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>API-key </b> 
								</div>
							</div>
							<TextField
								style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										marginLeft: "5px",
										maxWidth: "95%",
										fontSize: "1em",
										height: 50,
									},
								}}
								fullWidth
								color="primary"
								placeholder="Your apikey"
								defaultValue={workflow.triggers[selectedTriggerIndex].parameters[2].value}
								onBlur={(e) => {
									workflow.triggers[selectedTriggerIndex].parameters[2].value = e.target.value
									setWorkflow(workflow)
								}}
							/>
						</div>
					</div>
				</div> 
			)
		}

		return null 
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
				workflow.triggers[selectedTriggerIndex].parameters[2] = {"name": "auth_headers", "value": ""}
				setWorkflow(workflow)
			}

			const trigger_header_auth = workflow.triggers[selectedTriggerIndex].parameters.length > 2 ? workflow.triggers[selectedTriggerIndex].parameters[2].value : ""
			//const cronValue = "*/15 * * * *"

			return(
				<div style={appApiViewStyle}>
					<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
						<div style={{flex: "1"}}>
							<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}: {selectedTrigger.status}</h3>
							<a rel="norefferer" target="_blank" href="https://shuffler.io/docs/triggers#webhook" style={{textDecoration: "none", color: "#f85a3e"}}>What are webhooks?</a>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div>
						Name
					</div>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
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
								style={{backgroundColor: inputColor, color: "white", height: 50}}
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
							<b>Parameters</b>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Webhook URI </b> 
								</div>
							</div>
							<TextField
								style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
								id="webhook_uri_field"
								onClick={() => {
  								var copyText = document.getElementById("webhook_uri_field")
									if (copyText !== undefined && copyText !== null) {
										console.log("NAVIGATOR: ", navigator)
										const clipboard = navigator.clipboard
										if (clipboard === undefined) {
											alert.error("Can only copy over HTTPS (port 3443)")
											return
										} 

										navigator.clipboard.writeText(copyText.value)
										copyText.select()
										copyText.setSelectionRange(0, 99999) /* For mobile devices */

										/* Copy the text inside the text field */
										document.execCommand("copy")
										alert.success("Copied Webhook URL")
									} else {
										console.log("Couldn't find webhook URI field: ", copyText)
									}
								}}
								InputProps={{
									style:{
										color: "white",
										height: 50, 
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
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: yellow, marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Required headers</b> 
								</div>
							</div>
							<div>
								<TextField
									style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
									id="webhook_uri_header"
									onClick={() => {}}
									InputProps={{
										style:{
											color: "white",
											marginLeft: "5px",
											maxWidth: "95%",
											fontSize: "1em",
										},
									}}
									fullWidth
									multiline
									rows="4"
									defaultValue={trigger_header_auth}
									color="primary"
									disabled={selectedTrigger.status === "running"}
									placeholder={"AUTH_HEADER=AUTH_VALUE1"}
									onBlur={(e) => {
										const value = e.target.value
										if (selectedTrigger.parameters === null) {
											selectedTrigger.parameters = []
										} 

										workflow.triggers[selectedTriggerIndex].parameters[2] = {"value": value, "name": "auth_headers"}
										//setSelectedTrigger(workflow.triggers[selectedTr
										setWorkflow(workflow)
									}}
								/>
							</div>
							<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<Button variant="contained" style={{flex: "1",}} disabled={selectedTrigger.status === "running"} onClick={() => {
									newWebhook(workflow.triggers[selectedTriggerIndex])
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
	//	})
	//}

	const stopMailSub = (trigger, triggerindex) => {
		// DELETE		
		if (trigger.id === undefined) {
			return
		}
		alert.info("Deleting mail trigger")

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

		if (triggerFolders === null || triggerFolders === undefined) {
			return null
		}

		const splitItem = workflow.triggers[selectedTriggerIndex].parameters[0].value.split(splitter)
		for (var key in splitItem) {
			const item = splitItem[key] 
			const curfolder = triggerFolders.find(a => a.displayName === item)	
			if (curfolder === undefined) {
				alert.error("Something went wrong with outlook folder: "+item)
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

		const param = trigger.parameters.find(param => param.name === "auth_headers")
		console.log("PARAM: ", param)
		var auth = ""	
		if (param !== undefined && param !== null) {
			auth = param.value
		}

		console.log("TRIG: ", trigger)
		const data = {
			"name": hookname, 
			"type": "webhook", 
			"id": trigger.id, 
			"workflow": workflow.id,
			"start": startNode,
			"environment": trigger.environment,
			"auth": auth,
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
			if (workflow.triggers[triggerindex] !== undefined) {
				workflow.triggers[triggerindex].status = "stopped"
			}

			if (responseJson.success) {
				//alert.success("Successfully stopped webhook")
				// Set the status
				saveWorkflow(workflow)
			} else {
				if (responseJson.reason !== undefined) {
					alert.error("Failed stopping webhook: "+responseJson.reason)
				}
			}

			trigger.status = "stopped"
			setWorkflow(workflow)
			setSelectedTrigger(trigger)
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const UserinputSidebar = () => {
		if (Object.getOwnPropertyNames(selectedTrigger).length > 0 && workflow.triggers[selectedTriggerIndex] !== undefined) {
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
							<a rel="norefferer" target="_blank" href="https://shuffler.io/docs/triggers#user_input" style={{textDecoration: "none", color: "#f85a3e"}}>What is the user input trigger?</a>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div>
						Name
					</div>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
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
							style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
							InputProps={{
								style:{
									color: "white",
									marginLeft: "5px",
									maxWidth: "95%",
									height: 50, 
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
						<b>Parameters</b>
						<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
							<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
							<div style={{flex: "10"}}> 
								<b>Information: </b> 
							</div>
						</div>
						<TextField
							style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
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
								style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										marginLeft: "5px",
										maxWidth: "95%",
										height: 50, 
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
								style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										marginLeft: "5px",
										maxWidth: "95%",
										height: 50, 
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
				workflow.triggers[selectedTriggerIndex].parameters[0] = {"name": "cron", "value": isCloud ? "*/15 * * * *" : "120"}
				workflow.triggers[selectedTriggerIndex].parameters[1] = {"name": "execution_argument", "value": '{"example": {"json": "is cool"}}'}
				setWorkflow(workflow)
			}

			return(
				<div style={appApiViewStyle}>
					<div style={{display: "flex", height: "40px", marginBottom: "30px"}}>
						<div style={{flex: "1"}}>
							<h3 style={{marginBottom: "5px"}}>{selectedTrigger.app_name}: {selectedTrigger.status}</h3>
							<a rel="norefferer" target="_blank" href="https://shuffler.io/docs/triggers#schedule" style={{textDecoration: "none", color: "#f85a3e"}}>What are schedules?</a>
						</div>
					</div>
					<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
					<div>
						Name
					</div>
					<TextField
						style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
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
									workflow.triggers[selectedTriggerIndex].parameters[0].value = "*/15 * * * *" 

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
							style={{backgroundColor: inputColor, color: "white", height: 50}}
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
							<b>Parameters</b>
							<div style={{marginTop: "20px", marginBottom: "7px", display: "flex"}}>
								<div style={{width: "17px", height: "17px", borderRadius: 17 / 2, backgroundColor: "#f85a3e", marginRight: "10px"}}/>
								<div style={{flex: "10"}}> 
									<b>Interval (seconds) </b> 
								</div>
							</div>
							<TextField
								style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
								InputProps={{
									style:{
										color: "white",
										height: 50, 
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
								style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
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

	const cytoscapeViewWidths = 800
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
		left: leftBarSize+20,
		top: appBarSize+20, 
		/*
		minWidth: cytoscapeViewWidths, 
		maxWidth: cytoscapeViewWidths,
		*/
	}

	const TopCytoscapeBar = (props) => {
		return (
			<div style={topBarStyle}>	
				<div style={{margin: "0px 10px 0px 10px", }}>
					<Breadcrumbs aria-label="breadcrumb" separator="›" style={{color: "white",}}>
						<Link to="/workflows" style={{textDecoration: "none", color: "inherit",}}>
							<h2 style={{color: "rgba(255,255,255,0.5)", margin: "0px 0px 0px 0px"}}>
								<PolymerIcon style={{marginRight: 10}} />
								Workflows
							</h2>
						</Link>
						<h2 style={{margin: 0,}}>
							{workflow.name}
						</h2>

						{workflow.public ? 
							<h2 style={{margin: 0,}}>
								Public Workflow PREVIEW
							</h2>
							:
							null
						}
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
		const [newAnchor, setNewAnchor] = React.useState(null)
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
					<span>	
					<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={(event) => {
						setShowShuffleMenu(!showShuffleMenu)
						setNewAnchor(event.currentTarget)
					}}>
						<SettingsIcon />
					</Button>
					</span>	
				</Tooltip>
			</div>
		)
	}

	const WorkflowMenu = () => {
		const [newAnchor, setNewAnchor] = React.useState(null)
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
					<span>	
					<Button disabled={workflow.public} color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={(event) => {
						setShowShuffleMenu(!showShuffleMenu)
						setNewAnchor(event.currentTarget)
					}}>
						<SettingsIcon />
					</Button>
					</span>	
				</Tooltip>
			</div>
		)
	}

	const handleHistoryUndo = () => {
		console.log("history: ", history, "index: ", historyIndex)
		var item = history[historyIndex-1]
		if (historyIndex === 0) {
			item = history[historyIndex]
		}

		if (item === undefined) {
			console.log("Couldn't find the action you're looking for")
			return
		}

		console.log("HANDLE: ", item)
		if (item.type === "node" && item.action === "removed") {
			// Re-add the node 
				
			cy.add({
					group: 'nodes',
					data: item.data,
					position: item.data.position,
			})
		} else if (item.action === "added") {
			console.log("Should remove item!")
			const currentitem = cy.getElementById(item.data.id)
			if (currentitem !== undefined && currentitem !== null) {
				currentitem.remove()
			}
		}

		if (historyIndex > 0) {
			setHistoryIndex(historyIndex-1)
		}
	}

	const BottomCytoscapeBar = () => {
		const [anchorEl, setAnchorEl] = React.useState(null)

		const boxSize = 100
		const executionButton = executionRunning ? 
			<Tooltip color="primary" title="Stop execution" placement="top">
				<span>	
				<Button style={{height: boxSize, width: boxSize}} color="secondary" variant="contained" onClick={() => {
					abortExecution()
				}}>
					<PauseIcon style={{ fontSize: 60}} />
				</Button> 
				</span>	
			</Tooltip>
			:
			<Tooltip color="primary" title="Test Execution" placement="top">
				<span>
					<Button disabled={workflow.public || executionRequestStarted || !workflow.isValid} style={{height: boxSize, width: boxSize}} color="primary" variant="contained" onClick={() => {
						executeWorkflow(executionText, workflow.start)
					}}>
						<PlayArrowIcon style={{ fontSize: 60}} />
					</Button> 				
				</span>
			</Tooltip>

		return(
			<div style={bottomBarStyle}>	
				{executionButton} 
				<div style={{marginLeft: "10px", left: boxSize, bottom: 0, position: "absolute"}}>
					{workflow.public ? null :
						<Tooltip color="primary" title="An argument to be used for execution. This is a variable available to every node in your workflow." placement="top">
							<TextField
								id="execution_argument_input_field"
								style={theme.palette.textFieldStyle} 
								disabled={workflow.public}
								InputProps={{
									style: theme.palette.innerTextfieldStyle, 
								}}
								color="secondary"
								placeholder={"Execution Argument"}
								defaultValue={executionText}
								onBlur={(e) => {
									setExecutionText(e.target.value)
								}}
							/>
						</Tooltip>
					}
					<Tooltip color="primary" title="Save (ctrl+s)" placement="top">
						<span>
							<Button disabled={savingState !== 0} color="primary" style={{height: workflow.public ? 100 : 50, width: workflow.public ? 100 : 64, marginLeft: 10, }} variant={lastSaved && !(workflow.public) ? "outlined" : "contained"} onClick={() => saveWorkflow()}>
								{savingState === 2 ? <CircularProgress style={{height: 35, width: 35}} /> : savingState === 1 ? <DoneIcon style={{color: green}} /> : <SaveIcon /> }
							</Button> 				
						</span>
					</Tooltip>
					{workflow.public ? 
						<Tooltip color="secondary" title="Download workflow" placement="top-start">
							<span>
							<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={() => {
								//setExecutionModalOpen(true)
								//getWorkflowExecution(props.match.params.key, "")
								//data = sanitizeWorkflow(workflow)	
								const data = workflow
								let exportFileDefaultName = data.name+'.json';

								let dataStr = JSON.stringify(data)
								let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
								let linkElement = document.createElement('a')
								linkElement.setAttribute('href', dataUri)
								linkElement.setAttribute('download', exportFileDefaultName)
								linkElement.click()
							}}>
								<GetAppIcon />
							</Button>
							</span>
						</Tooltip>
					: null}
					<Tooltip color="secondary" title="Fit to screen (ctrl+f)" placement="top">
						<span>
							<Button color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={() => cy.fit(null, 50)}>
								<AspectRatioIcon />  
							</Button> 				
						</span>
					</Tooltip>
					<Tooltip color="secondary" title="Undo" placement="top-start">
						<span>	
						<Button disabled={history.length === 0} color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={(event) => {
							handleHistoryUndo(history)
						}}>
							<UndoIcon />
						</Button>
						</span>	
					</Tooltip>
					<Tooltip color="secondary" title="Remove selected item (del)" placement="top-start">
						<span>
						<Button color="primary" disabled={workflow.public} style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={() => {
							removeNode()		
						}}>
							<DeleteIcon /> 
						</Button>
						</span>
					</Tooltip>
					<Tooltip color="secondary" title="Show executions" placement="top-start">
						<span>
						<Button disabled={workflow.public} color="primary" style={{height: 50, marginLeft: 10, }} variant="outlined" onClick={() => {
							setExecutionModalOpen(true)
							getWorkflowExecution(props.match.params.key, "")
						}}>
							<DirectionsRunIcon />
						</Button>
						</span>
					</Tooltip>	
					{/* <FileMenu />	*/}
					{workflow.configuration !== null && workflow.configuration !== undefined && workflow.configuration.exit_on_error !== undefined ? <WorkflowMenu />	 : null}
				</div>
			</div>
		)
	}

	const RightSideBar = (props) => {
		const {workflow, setWorkflow, setAction, setSelectedAction, setUpdate, appActionArguments, selectedApp, workflowExecutions, setSelectedResult, selectedAction, setSelectedApp, setSelectedTrigger, setSelectedEdge, setCurrentView, cy, setAuthenticationModalOpen,setVariablesModalOpen, setCodeModalOpen, selectedNameChange, rightsidebarStyle, showEnvironment, selectedActionEnvironment, environments, setNewSelectedAction, appApiViewStyle, globalUrl, setSelectedActionEnvironment, requiresAuthentication, hideExtraTypes, scrollConfig, setScrollConfig } = props

		if (!rightSideBarOpen) {
			return null
		}

		if (Object.getOwnPropertyNames(selectedAction).length > 0) {
			if (Object.getOwnPropertyNames(selectedAction).length === 0) {
				return null
			} 

			return (
				<div id="rightside_actions" style={rightsidebarStyle}>
					<ParsedAction 
						id="rightside_subactions"
						scrollConfig={scrollConfig}
						setScrollConfig={setScrollConfig}
						selectedAction={selectedAction}
						workflow={workflow} 
						setWorkflow={setWorkflow} 
						setSelectedAction={setSelectedAction}
						setUpdate={setUpdate}
						selectedApp={selectedApp}
						workflowExecutions={workflowExecutions}
						setSelectedResult={setSelectedResult}
						setSelectedApp={setSelectedApp}
						setSelectedTrigger={setSelectedTrigger}
						setSelectedEdge={setSelectedEdge}
						setCurrentView={setCurrentView}
						cy={cy}
						setAuthenticationModalOpen={setAuthenticationModalOpen}

						setVariablesModalOpen={setVariablesModalOpen}
						setLastSaved={setLastSaved}
						setCodeModalOpen={setCodeModalOpen}
						selectedNameChange={selectedNameChange}
						rightsidebarStyle={rightsidebarStyle}
						showEnvironment={showEnvironment}
						selectedActionEnvironment={selectedActionEnvironment}
						environments={environments}
						setNewSelectedAction={setNewSelectedAction}
						sortByKey={sortByKey}
						
						appApiViewStyle={appApiViewStyle}
						globalUrl={globalUrl}
						setSelectedActionEnvironment={setSelectedActionEnvironment}
						requiresAuthentication={requiresAuthentication}
					/>
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
			} else if (selectedTrigger.trigger_type === "SUBFLOW") {
				return(
					<div style={rightsidebarStyle}>	
						<SubflowSidebar />
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
	
	const leftView = leftViewOpen ? 
		<div style={{minWidth: leftBarSize, maxWidth: leftBarSize, borderRight: "1px solid rgb(91, 96, 100)"}}>	
			<HandleLeftView />
		</div> 
		: 
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
		const validate = validateJson(showResult)


		if (validate.valid) {
			if (typeof(validate.result) === "string") {
				try {
					validate.result = JSON.parse(validate.result)
				} catch(e) {
					console.log("Error: ", e)
					validate.valid = false
				}
			}

			return (
				<ReactJson 
					src={validate.result} 
					theme="solarized" 
					collapsed={true}
					displayDataTypes={false}
					enableClipboard={(copy) => {
						handleReactJsonClipboard(copy)
					}}
					onSelect={(select) => {
						HandleJsonCopy(showResult, select, "exec")
						console.log("SELECTED!: ", select)	
					}}
					name={"Execution Argument"}
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
		} else if (execution.execution_source === "outlook") {
			return <img alt={"email"} src={triggers.find(trigger => trigger.trigger_type === "EMAIL").large_image} style={{width: size, height: size}} />
		} else if (execution.execution_source === "schedule") {
			return <img alt={"schedule"} src={triggers.find(trigger => trigger.trigger_type === "SCHEDULE").large_image} style={{width: size, height: size}} />
		} else if (execution.execution_source === "EMAIL") {
			return <img alt={"email"} src={triggers.find(trigger => trigger.trigger_type === "EMAIL").large_image} style={{width: size, height: size}} />
		}

		if (execution.execution_parent !== null && execution.execution_parent !== undefined && execution.execution_parent.length > 0) {
			return <img alt={"parent workflow"} src={triggers.find(trigger => trigger.trigger_type === "SUBFLOW").large_image} style={{width: size, height: size}} />
		}

		return (
			<img alt={execution.execution_source} src={defaultImage} style={{width: size, height: size}} />
		)
	}

	const handleReactJsonClipboard = (copy) => {
		console.log("COPY: ", copy)

		const elementName = "copy_element_shuffle"
		var copyText = document.getElementById(elementName);
		if (copyText !== null && copyText !== undefined) {
			if (copy.namespace !== undefined && copy.name !== undefined && copy.src !== undefined) {
				copy = copy.src
			}

			console.log("NEW: ", copy)
			console.log("NAVIGATOR: ", navigator)

			const clipboard = navigator.clipboard
			if (clipboard === undefined) {
				alert.error("Can only copy over HTTPS (port 3443)")
				return
			} 

			navigator.clipboard.writeText(JSON.stringify(copy))
			copyText.select()
			copyText.setSelectionRange(0, 99999) /* For mobile devices */

			/* Copy the text inside the text field */
			document.execCommand("copy")
			//alert.success("Copied data")
		} else {
			console.log("Failed to copy from "+elementName+": ", copyText)
		}
	}

	const HandleJsonCopy = (base, copy, base_node_name) => {
		if (typeof(copy.name) === "string") {
			copy.name = copy.name.replaceAll(" ", "_")
		}

		console.log("COPY: ", copy)
		var newitem = JSON.parse(base)
		to_be_copied = "$"+base_node_name.toLowerCase().replaceAll(" ", "_")
		for (var key in copy.namespace) {
			if (copy.namespace[key].includes("Results for")) {
				continue
			}

			if (newitem !== undefined && newitem !== null) {
				newitem = newitem[copy.namespace[key]]
				if (!isNaN(copy.namespace[key])) {
					to_be_copied += ".#"
				} else {
					to_be_copied += "."+copy.namespace[key]
				}
			}
		}

		if (newitem !== undefined && newitem !== null) {
			newitem = newitem[copy.name]
			if (!isNaN(copy.name)) {
				to_be_copied += ".#"
			} else {
				to_be_copied += "."+copy.name
			}
		}

		//console.log(document.activeElement)
		//if (document.activeElement.nodeName == 'TEXTAREA' || document.activeElement.nodeName == 'INPUT') {
		//	console.log("HANDLE INPUT FIELD FOR COPY!")
		//}

		to_be_copied.replaceAll(" ", "_")
		const elementName = "copy_element_shuffle"
  	var copyText = document.getElementById(elementName)
		if (copyText !== null && copyText !== undefined) {
			console.log("NAVIGATOR: ", navigator)
			const clipboard = navigator.clipboard
			if (clipboard === undefined) {
				alert.error("Can only copy over HTTPS (port 3443)")
				return
			} 

			navigator.clipboard.writeText(to_be_copied)
			copyText.select()
			copyText.setSelectionRange(0, 99999); /* For mobile devices */

			/* Copy the text inside the text field */
			document.execCommand("copy");
			//alert.success("Copied "+to_be_copied)
			console.log("COPYING!")
		} else {
			console.log("Couldn't find element ", elementName)
		}

	}
	
	const executionModal = 
		<Drawer anchor={"right"} open={executionModalOpen} onClose={() => setExecutionModalOpen(false)} style={{resize: "both", overflow: "auto",}} PaperProps={{style: {resize: "both", overflow: "auto", minWidth: 400, maxWidth: 400, backgroundColor: "#1F2023", color: "white", fontSize: 18}}}>
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
					variant="outlined"
					onClick={() => {
						getWorkflowExecution(props.match.params.key, "")
					}} color="primary">
					<CachedIcon style={{marginRight: 10}}/>
					Refresh	executions
				</Button>
				<Divider style={{backgroundColor: "rgba(255,255,255,0.5)", marginTop: 10, marginBottom: 10,}}/>
				{workflowExecutions.length > 0 ? 
					<div>
						{workflowExecutions.map((data, index) => {
							const statusColor = data.status === "FINISHED" ? green : data.status === "ABORTED" || data.status === "FAILED" ? "red" : yellow
							const timeElapsed = data.completed_at-data.started_at
							const resultsLength = data.results !== undefined && data.results !== null ? data.results.length : 0

							const timestamp = new Date(data.started_at*1000).toISOString().split('.')[0].split("T").join(" ")

							var calculatedResult = data.workflow.actions !== undefined && data.workflow.actions !== null ? data.workflow.actions.length : 0
							for (var key in data.workflow.triggers) {
								const trigger = data.workflow.triggers[key]
								if ((trigger.app_name === "User Input" && trigger.trigger_type === "USERINPUT") || (trigger.app_name === "Shuffle Workflow" && trigger.trigger_type === "SUBFLOW")) {
									calculatedResult += 1
								}
							}

							return (
								<Tooltip key={data.execution_id} title={data.result} placement="left-start">
								<Paper elevation={5} key={data.execution_id} square style={executionPaperStyle} onMouseOver={() => {}} onMouseOut={() => {}} onClick={() => {

									if ((data.result === undefined || data.result === null || data.result.length === 0) && data.status !== "FINISHED" && data.status !== "ABORTED") {

										start()
										setExecutionRunning(true)
										setExecutionRequestStarted(false)
									}
									
									const cur_execution = {
										"execution_id": data.execution_id,
										"authorization": data.authorization,
									}
									setExecutionRequest(cur_execution)
									setExecutionModalView(1)
									setExecutionData(data)
									handleUpdateResults(data, cur_execution)
								}}>
									<div style={{display: "flex", flex: 1}}>
										<div style={{marginLeft: 0, width: lastExecution === data.execution_id ? 4 : 2, backgroundColor: statusColor, marginRight: 5}} />
										<div style={{height: "100%", width: 40, borderColor: "white", marginRight: 15}}>
											{getExecutionSourceImage(data)}
										</div>
										<div style={{ marginTop: "auto", marginBottom: "auto", marginRight: 15, fontSize: 13, }}>
											{timestamp}
										</div>
										{data.workflow.actions !== null ? 
											<Tooltip color="primary" title={resultsLength+" actions ran"} placement="top">
												<div style={{marginRight: 10, marginTop: "auto", marginBottom: "auto",}}>
													{resultsLength}/{calculatedResult}
												</div>
											</Tooltip>
											: null}
									</div>
									<Tooltip title={"Inspect execution"} placement="top">
										{lastExecution === data.execution_id ?
											<KeyboardArrowRightIcon style={{color: "#f85a3e", marginTop: "auto", marginBottom: "auto"}}/>
											:
											<KeyboardArrowRightIcon style={{marginTop: "auto", marginBottom: "auto"}}/>
										}
									</Tooltip>
								</Paper>
								</Tooltip>
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
					<span style={{color: "rgba(255,255,255,0.5)", display: "flex"}} onClick={() => {
							setExecutionRunning(false)
							stop()
							getWorkflowExecution(props.match.params.key, "")
							setExecutionModalView(0)
							setLastExecution(executionData.execution_id)
					}}>
						<IconButton style={{paddingLeft: 0, marginTop: "auto", marginBottom: "auto", }} onClick={() => {}}>
							<ArrowBackIcon style={{color: "rgba(255,255,255,0.5)",}} />
						</IconButton>
						<h2 style={{color: "rgba(255,255,255,0.5)", cursor: "pointer"}} onClick={() => {
						}}>
							See other Executions	
						</h2>
					</span>
				</Breadcrumbs>
				<Divider style={{backgroundColor: "rgba(255,255,255,0.6)", marginTop: 10, marginBottom: 10,}}/>
					<div style={{display: "flex"}}>
						<h2>Executing Workflow</h2>		
						<Tooltip color="primary" title="Rerun workflow" placement="top">
							<span style={{}}>
								<Button color="primary" style={{float: "right", marginTop: 20, marginLeft: 10,}} onClick={() => {
									console.log("DATA: ", executionData)
									executeWorkflow(executionData.execution_argument, executionData.start)
									setExecutionModalOpen(false)
									//executionText, workflow.start)
								}}>
									<CachedIcon style={{}}/>
								</Button>
							</span>
						</Tooltip>
						{executionData.status === "EXECUTING" ? 
							<Tooltip color="primary" title="Abort workflow" placement="top">
								<span style={{}}>
									<Button color="primary" style={{float: "right", marginTop: 20, marginLeft: 10,}} onClick={() => {
										abortExecution()
									}}>
										<PauseIcon style={{}} />
									</Button>
								</span>
							</Tooltip>
						: null}
					</div>
					{executionData.status !== undefined && executionData.status.length > 0 ?
						<div style={{display: "flex"}}>
							<Typography variant="body1">
								<b>Status &nbsp;&nbsp;</b>
							</Typography>
							<Typography variant="body1" color="textSecondary">
								{executionData.status} 
							</Typography>
						</div>
						: null
					}
					{executionData.execution_source !== undefined && executionData.execution_source !== null && executionData.execution_source.length > 0 && executionData.execution_source !== "default" ?
						<div style={{display: "flex"}}>
							<Typography variant="body1">
								<b>Source &nbsp;&nbsp;</b>
							</Typography>
							<Typography variant="body1" color="textSecondary">
								{executionData.execution_parent !== null && executionData.execution_parent !== undefined && executionData.execution_parent.length > 0 ? 
									executionData.execution_source  === props.match.params.key ? 

										<span  style={{cursor: "pointer", color: "#f85a3e"}} onClick={(event) => {
											getWorkflowExecution(props.match.params.key, executionData.execution_parent) 
										}}>
											Parent Execution 
										</span>

										:
										<a rel="norefferer" href={`/workflows/${executionData.execution_source}?view=executions&execution_id=${executionData.execution_parent}`} target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>Parent Workflow</a>
									:
									executionData.execution_source
								} 
							</Typography>
						</div>
						: null
					}
					{executionData.started_at !== undefined ?
						<div style={{display: "flex"}}>
							<Typography variant="body1">
								<b>Started &nbsp;&nbsp;</b>
							</Typography> 
							<Typography variant="body1" color="textSecondary">
								{new Date(executionData.started_at*1000).toISOString()} 
							</Typography>
						</div>
						: null
					}
					{executionData.completed_at !== undefined && executionData.completed_at !== null && executionData.completed_at > 0 ?
						<div style={{display: "flex"}}>
							<Typography variant="body1">
								<b>Finished &nbsp;</b>
							</Typography>
							<Typography variant="body1" color="textSecondary">
								{new Date(executionData.completed_at*1000).toISOString()} 
							</Typography>
						</div>
						: null
					}
					<div style={{marginTop: 10}}/>
					{executionData.execution_argument !== undefined && executionData.execution_argument.length > 0 ?
						parsedExecutionArgument()
					: null }
					<Divider style={{backgroundColor: "rgba(255,255,255,0.6)", marginTop: 15, marginBottom: 30,}}/>
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
							{executionData.status !== undefined && executionData.status !== "ABORTED" && executionData.status !== "FINISHED" && executionData.status !== "FAILURE" && executionData.status !== "WAITING" && !(executionData.results === undefined || executionData.results === null || executionData.results.length === 0 && executionData.status === "EXECUTING")? <CircularProgress style={{marginLeft: 20}}/> : null}
						</div>
					</div>
					{executionData.results === undefined || executionData.results === null || executionData.results.length === 0 && executionData.status === "EXECUTING" ?
						<CircularProgress />
						:
						executionData.results.map((data, index) => {
							if (executionData.results.length !== 1 && !showSkippedActions && (data.status === "SKIPPED" || data.status === "FAILURE")) {
								return null
							}

							// FIXME: The latter replace doens't really work if ' is used in a string
							var showResult = data.result.trim()
							const validate = validateJson(showResult)
							
							const curapp = apps.find(a => a.name === data.action.app_name && a.app_version === data.action.app_version)
							const imgsize = 50
							const statusColor = data.status === "FINISHED" || data.status === "SUCCESS" ? green : data.status === "ABORTED" || data.status === "FAILURE" ? "red" : yellow
			
							var imgSrc = curapp === undefined ? "" : curapp.large_image
							if (imgSrc.length === 0 && workflow.actions !== undefined && workflow.actions !== null) {
								// Look for the node in the workflow
								const action = workflow.actions.find(action => action.id === data.action.id)
								if (action !== undefined && action !== null) {
									imgSrc = action.large_image
								}

								/*
								if (imgSrc.length === 0) {
									console.log("CHECK IF ITS A 
								}
								*/
							}

							var actionimg = curapp === null ? 
								null :
								<img alt={data.action.app_name} src={imgSrc} style={{marginRight: 20, width: imgsize, height: imgsize, border: `2px solid ${statusColor}`, borderRadius: executionData.start === data.action.id ? 25 : 5}} />

							if (triggers.length > 2) {
								if (data.action.app_name === "shuffle-subflow") {
									const parsedImage = triggers[1].large_image
									actionimg = <img alt={"Shuffle Subflow"} src={parsedImage} style={{marginRight: 20, width: imgsize, height: imgsize, border: `2px solid ${statusColor}`, borderRadius: executionData.start === data.action.id ? 25 : 5}} />
								}	

								if (data.action.app_name === "User Input") {
									actionimg = <img alt={"Shuffle Subflow"} src={triggers[2].large_image} style={{marginRight: 20, width: imgsize, height: imgsize, border: `2px solid ${statusColor}`, borderRadius: executionData.start === data.action.id ? 25 : 5}} />
								}	
							}

							if (data.action.app_name === "Shuffle Tools") {
								//console.log("APP (TOOLS): ", data.action)

								const nodedata = cy.getElementById(data.action.id).data()
								if (nodedata !== undefined && nodedata !== null && nodedata.fillstyle === "linear-gradient") {
									//console.log("LINEAR :D")
									var imgStyle = {
										marginRight: 20, 
										width: imgsize, 
										height: imgsize, 
										border: `2px solid ${statusColor}`, 
										borderRadius: executionData.start === data.action.id ? 25 : 5,
										background: `linear-gradient(to right, ${nodedata.fillGradient})`
									}

									//console.log("STYLE: ", imgStyle)

									actionimg = <img alt={nodedata.label} src={nodedata.large_image} style={imgStyle} />
								}
							}	

						
							if (validate.valid && typeof(validate.result) === "string") {
								validate.result = JSON.parse(validate.result)
							}  
							
							if (validate.valid && typeof(validate.result) === "object") {
								if (validate.result.result !== undefined && validate.result.result !== null) {
									try {
										validate.result.result = JSON.parse(validate.result.result)
									} catch (e) {
										//console.log("ERROR PARSING: ", e)
									}
								}
							}

							return (
								<div key={index} style={{marginBottom: 40, border: data.action.sub_action === true ? "1px solid rgba(255,255,255,0.3)" : null, borderRadius: theme.palette.borderRadius,}} onMouseOver={() => {
									var currentnode = cy.getElementById(data.action.id)
									if (currentnode.length !== 0) {
										currentnode.addClass('shuffle-hover-highlight')
									}
								}} onMouseOut={() => {
									var currentnode = cy.getElementById(data.action.id)
									if (currentnode.length !== 0) {
										currentnode.removeClass('shuffle-hover-highlight')
									}
								}}>
									<div style={{display: "flex", }}>
										<div style={{display: "flex", marginBottom: 15,}}>
											<IconButton style={{marginTop: "auto", marginBottom: "auto", height: 30, paddingLeft: 0, width: 30}} onClick={() => {
												setSelectedResult(data)
												setCodeModalOpen(true)
											}}>
												<Tooltip color="primary" title="Expand result window" placement="top">
													<ArrowLeftIcon style={{color: "white"}}/>
												</Tooltip>
											</IconButton>
											{actionimg}
											<div>
												<div style={{fontSize: 24, marginTop: "auto", marginBottom: "auto"}}><b>{data.action.label}</b></div>
												<div style={{fontSize: 14}}>
													<Typography variant="body2" color="textSecondary">
														{data.action.name}
													</Typography>
												</div>
											</div>
										</div>
										{data.action.app_name === "shuffle-subflow" && validate.result.success !== undefined && validate.result.success === true ?
											<span style={{flex: 10, float: "right", textAlign: "right",}}>
												{validate.valid && data.action.parameters !== undefined && data.action.parameters !== null ? 
													data.action.parameters[0].value === props.match.params.key ?
														<span style={{cursor: "pointer", color: "#f85a3e"}} onClick={(event) => {
															getWorkflowExecution(props.match.params.key, validate.result.execution_id) 
														}}>
														See sub-execution
														</span>
													:
													<a rel="norefferer" href={`/workflows/${data.action.parameters[0].value}?view=executions&execution_id=${validate.result.execution_id}`} target="_blank" style={{textDecoration: "none", color: "#f85a3e"}} onClick={(event) => {
													}}>
													<OpenInNewIcon />
													</a>
												: 
													"TBD: Load subexecution result for"
												}
											</span>
											: null
										}
									</div>
									<div style={{marginBottom: 5, display: "flex",}}>
										<Typography variant="body1">
											<b>Status&nbsp;</b> 
										</Typography>
										<Typography variant="body1" color="textSecondary">
											{data.status}
										</Typography>
									</div>
									{validate.valid ? <span>
										<ReactJson 
											src={validate.result} 
											theme="solarized" 
											collapsed={true}
											enableClipboard={(copy) => {
												handleReactJsonClipboard(copy)
											}}
											displayDataTypes={false}
											onSelect={(select) => {
												HandleJsonCopy(showResult, select, data.action.label)
												console.log("SELECTED!: ", select)	
											}}
											name={"Results for "+data.action.label}
										/>
										</span>
									: 
									<div style={{maxHeight: 250, overflowX: "hidden", overflowY: "auto", whiteSpace: "pre-wrap", }}>
										<Typography variant="body1" style={{display: 'inline-block'}}>
											<b>Result</b>&nbsp;
										</Typography> 
										<Typography variant="body1" color="textSecondary" style={{display: 'inline-block'}}>
											{data.result}
										</Typography>
									</div>
									}
								</div>
							)
						})
					}
				</div>
			}
			</Drawer>

	// This sucks :)
	const curapp = !codeModalOpen ? {} : selectedResult.action.app_name === "shuffle-subflow" ? triggers[1] : selectedResult.action.app_name === "User Input" ? triggers[2] : apps.find(a => a.name === selectedResult.action.app_name && a.app_version === selectedResult.action.app_version)
	const imgsize = 50
	const statusColor = !codeModalOpen ? "red" : selectedResult.status === "FINISHED" || selectedResult.status === "SUCCESS" ? green : selectedResult.status === "ABORTED" || selectedResult.status === "FAILURE" ? "red" : yellow
	const validate = !codeModalOpen ? "" : validateJson(selectedResult.result.trim())
	if (validate.valid && typeof(validate.result) === "string") {
		validate.result = JSON.parse(validate.result)
	}

	//if (codeModalOpen && selectedResult.result.includes("file_id")) {
	//	console.log("SHOW RESULT WITH FILES: ", selectedResult.result)
	//	//const regex = "\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b"
	//	//const regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/i
	//	const regex = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i
	//	//const found = selectedResult.result.match(regex)
	//	const found = "hello how are you cf80fa70-65cf-4963-b474-b459a6dead81 what".match(regex)
	//	const regex = /\${(\w{8}-\w{4}-\w{3}-\w{3}-\w)}/g
	//	const found = placeholder.match(regex)

	//	console.log("FOUND: ", found)

	//	//cf80fa70-65cf-4963-b474-b459a6dead81
	//}

	const codePopoutModal = !codeModalOpen ? null : 
		<Draggable
			onDrag={(e) => {
				if (!dragging) {
					setDragging(true)
				}
			}}
			onStop={(e) => {
				if (!dragging) {
					return
				}

				setDragging(false)

				const newoffsetX = parseInt(dragPosition.x)-parseInt(e.layerX-e.offsetX)
				const newoffsetY = parseInt(dragPosition.y)-parseInt(e.layerY-e.offsetY)
				if ((newoffsetX <= 40 && newoffsetX >= -40) && (newoffsetY <= 40 && newoffsetY >= -40)) {
					console.log("SKIP X & Y")
					return
				}

				setDragPosition({
					x: e.layerX-e.offsetX,
					y: e.layerY-e.offsetY,
				})
			}}
			position={dragPosition}
		>
			<Dialog 
				disableEnforceFocus={true}
				style={{pointerEvents: "none"}}
				hideBackdrop={true}
				open={codeModalOpen} 
				PaperProps={{
					style: {
						pointerEvents: "auto",
						backgroundColor: inputColor,
						color: "white",
						minWidth: 750,
						padding: 30, 
						maxHeight: 700,
						overflowY: "auto",
						overflowX: "hidden",
						//boxShadow: "none",
					},
				}}
			>
				<Tooltip title="Find successful execution" placement="top">
					<IconButton style={{zIndex: 5000, position: "absolute", top: 34, right: 170,}} onClick={(e) => {
						e.preventDefault()
						for (var key in workflowExecutions) {
							const execution = workflowExecutions[key]
							//console.log(execution.results[0])
							const result = execution.results.find(data => data.status === "SUCCESS" && data.action.id === selectedResult.action.id)
							if (result !== undefined) {
								setSelectedResult(result)
								setUpdate(Math.random())
								break
							}
						}
					}}>
						<DoneIcon style={{color: "white"}}/>
					</IconButton>
				</Tooltip>
				<Tooltip title="Find failed execution" placement="top">
					<IconButton style={{zIndex: 5000, position: "absolute", top: 34, right: 136,}} onClick={(e) => {
						e.preventDefault()
						for (var key in workflowExecutions) {
							const execution = workflowExecutions[key]
							//console.log(execution.results[0])
							const result = execution.results.find(data => data.action.id === selectedResult.action.id && data.status !== "SUCCESS" && data.status !== "SKIPPED" && data.status !== "WAITING")
							if (result !== undefined) {
								setSelectedResult(result)
								setUpdate(Math.random())
								break
							}
						}
					}}>
						<ErrorIcon style={{color: "white"}}/>
					</IconButton>
				</Tooltip>
				<Tooltip title="Explore execution" placement="top">
					<IconButton style={{zIndex: 5000, position: "absolute", top: 34, right: 98,}} onClick={(e) => {
						e.preventDefault()
						const executionIndex = workflowExecutions.findIndex(data => data.execution_id === selectedResult.execution_id)
						if (executionIndex !== -1) {
							setExecutionModalOpen(true)
							setExecutionModalView(1)
							setExecutionData(workflowExecutions[executionIndex])
						}
					}}>
						<VisibilityIcon style={{color: "white"}}/>
					</IconButton>
				</Tooltip>
				<Tooltip title="Close window" placement="top">
					<IconButton style={{zIndex: 5000, position: "absolute", top: 34, right: 34,}} onClick={(e) => {
						e.preventDefault()
						//console.log("CLICKING EXIT")
						setCodeModalOpen(false)
					}}>
						<CloseIcon style={{color: "white"}}/>
					</IconButton>
				</Tooltip>
				<div style={{marginBottom: 40,}}>
					<div style={{display: "flex", marginBottom: 15,}}>
						{curapp === null ? null : <img alt={selectedResult.app_name} src={curapp === undefined ? "" : curapp.large_image} style={{marginRight: 20, width: imgsize, height: imgsize, border: `2px solid ${statusColor}`}} />}

						<div>
							<div style={{fontSize: 24, marginTop: "auto", marginBottom: "auto"}}><b>{selectedResult.action.label}</b></div>
							<div style={{fontSize: 14}}>{selectedResult.action.name}</div>
						</div>
					</div>
					<div style={{marginBottom: 5}}><b>Status </b> {selectedResult.status}</div>
					{validate.valid ? <ReactJson 
							src={validate.result} 
							theme="solarized" 
							collapsed={selectedResult.result.length < 10000 ? false : true}
							displayDataTypes={false}
							enableClipboard={(copy) => {
								handleReactJsonClipboard(copy)
							}}
							onSelect={(select) => {
								HandleJsonCopy(JSON.stringify(validate.result), select, selectedResult.action.label)
							}}
							name={"Results for "+selectedResult.action.label}
						/>
					: 
					<div>
						<b>Result</b>&nbsp;
						<span onClick={() => {
							console.log("IN HERE TO CLICK")
							to_be_copied = selectedResult.result
							var copyText = document.getElementById("copy_element_shuffle");
							console.log("PRECOPY: ", to_be_copied)
							if (copyText !== null && copyText !== undefined) {
								console.log("COPY: ", copyText)
								console.log("NAVIGATOR: ", navigator)
								const clipboard = navigator.clipboard
								if (clipboard === undefined) {
									alert.error("Can only copy over HTTPS (port 3443)")
									return
								} 

								navigator.clipboard.writeText(to_be_copied)

								copyText.select();
								copyText.setSelectionRange(0, 99999); /* For mobile devices */

								/* Copy the text inside the text field */
								document.execCommand("copy");
								//alert.success("Copied "+to_be_copied)
							} else {
								console.log("Failed to copy. copy_element_shuffle is undefined")
							}
						}}>{selectedResult.result}</span>
					</div>
					}
				</div>
			</Dialog> 
		</Draggable> 
	
	const newView = 
		<div style={{color: "white"}}>
			<div style={{display: "flex", borderTop: "1px solid rgba(91, 96, 100, 1)"}}>
				{leftView}
				<CytoscapeComponent 
					elements={elements} 
					minZoom={0.35}
					maxZoom={2.00}
					style={{width: bodyWidth-leftBarSize-15, height: bodyHeight-appBarSize-5, backgroundColor: surfaceColor}} 
					stylesheet={cystyle}
					boxSelectionEnabled={true}
					autounselectify={false}
					showGrid={true}
					id="cytoscape_view"
					cy={(incy) => {
						// FIXME: There's something specific loading when
						// you do the first hover of a node. Why is this different?
						//console.log("CY: ", incy)
						setCy(incy)
					}}
				/>
			</div>
			{executionModal}
			<RightSideBar 
				scrollConfig={scrollConfig}
				setScrollConfig={setScrollConfig}
				selectedAction={selectedAction}
				workflow={workflow} 
				setWorkflow={setWorkflow} 
				setSelectedAction={setSelectedAction}
				setUpdate={setUpdate}
				selectedApp={selectedApp}
				workflowExecutions={workflowExecutions}
				setSelectedResult={setSelectedResult}
				setSelectedApp={setSelectedApp}
				setSelectedTrigger={setSelectedTrigger}
				setSelectedEdge={setSelectedEdge}
				setCurrentView={setCurrentView}
				cy={cy}
				setAuthenticationModalOpen={setAuthenticationModalOpen}

				setVariablesModalOpen={setVariablesModalOpen}
				setLastSaved={setLastSaved}
				setCodeModalOpen={setCodeModalOpen}
				selectedNameChange={selectedNameChange}
				rightsidebarStyle={rightsidebarStyle}
				showEnvironment={showEnvironment}
				selectedActionEnvironment={selectedActionEnvironment}
				environments={environments}
				setNewSelectedAction={setNewSelectedAction}
				sortByKey={sortByKey}
				
				appApiViewStyle={appApiViewStyle}
				globalUrl={globalUrl}
				setSelectedActionEnvironment={setSelectedActionEnvironment}
				requiresAuthentication={requiresAuthentication}
			/>
			<BottomCytoscapeBar />
			<TopCytoscapeBar />
		</div> 

		/*
		: 
		<div style={{color: "white"}}>
			TMP FOR NOT LOGGED IN 
		</div>
		*/

	
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
					Execution Variables are TEMPORARY variables that you can ony be set and used during execution. Learn more <a rel="norefferer" href="https://shuffler.io/docs/workflows#execution_variables" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>here</a>
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
		<Dialog 
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
				authenticationOption.label = `Auth for ${selectedApp.name}`
				//alert.info("Label can't be empty")
				//return
			}

			// Automatically mapping fields that already exist (predefined). 
			// Warning if fields are NOT filled
			for (var key in selectedApp.authentication.parameters) {
				if (authenticationOption.fields[selectedApp.authentication.parameters[key].name].length === 0) {
					if (selectedApp.authentication.parameters[key].value !== undefined && selectedApp.authentication.parameters[key].value !== null && selectedApp.authentication.parameters[key].value.length > 0) {
						authenticationOption.fields[selectedApp.authentication.parameters[key].name] = selectedApp.authentication.parameters[key].value
					} else {
						alert.info("Field "+selectedApp.authentication.parameters[key].name+" can't be empty")
						return
					}
				} 
			}

			console.log("Action: ", selectedAction)
			selectedAction.authentication_id = authenticationOption.id
			selectedAction.selectedAuthentication = authenticationOption
			if (selectedAction.authentication === undefined || selectedAction.authentication === null) {
				selectedAction.authentication = [authenticationOption]
			} else {
				selectedAction.authentication.push(authenticationOption)
			}

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
			//appAuthentication.push(newAuthOption)
			//setAppAuthentication(appAuthentication)
			//
			
			if (configureWorkflowModalOpen) {
				setSelectedAction({})
			}

			setUpdate(authenticationOption.id)

			/*
				{selectedAction.authentication.map(data => (
				<MenuItem key={data.id} style={{backgroundColor: inputColor, color: "white"}} value={data}>
			*/

		}

		if (authenticationOption.label === null || authenticationOption.label === undefined) {
			authenticationOption.label = selectedApp.name+" authentication"
		}

		return (
			<div>
				<DialogContent>
					<a target="_blank" rel="norefferer" href="https://shuffler.io/docs/apps#authentication" style={{textDecoration: "none", color: "#f85a3e"}}>What is this?</a><div/>
					These are required fields for authenticating with {selectedApp.name} 
					<div style={{marginTop: 15}}/>
					<b>Name - what is this used for?</b>
					<TextField
							style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
							InputProps={{
								style:{
									color: "white",
									marginLeft: "5px",
									maxWidth: "95%",
									height: 50, 
									fontSize: "1em",
								},
							}}
							fullWidth
							color="primary"
							placeholder={"Auth july 2020"}
							defaultValue={`Auth for ${selectedApp.name}`}
							onChange={(event) => {
								authenticationOption.label = event.target.value
							}}
						/>
					<Divider style={{marginTop: 15, marginBottom: 15, backgroundColor: "rgb(91, 96, 100)"}}/>
					{/*selectedApp.link.length > 0 ? <div style={{marginTop: 15}}><EndpointData /></div> : null*/}
					<div style={{}}/>
						{selectedApp.authentication.parameters.map((data, index) => { 
							//console.log("AUTH: ", data)

							return (
								<div key={index} style={{marginTop: 10}}>
									<LockOpenIcon style={{marginRight: 10}}/>
									<b>{data.name}</b>

									{data.schema !== undefined && data.schema !== null && data.schema.type === "bool" ? 
										<Select
												SelectDisplayProps={{
													style: {
														marginLeft: 10,
													}
												}}
												defaultValue={"false"}
												fullWidth
												onChange={(e) => {
													authenticationOption.fields[data.name] = e.target.value
												}}
												style={{backgroundColor: theme.palette.surfaceColor, color: "white", height: 50}}
												>
													<MenuItem key={"false"} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={"false"}>
														false
													</MenuItem>
													<MenuItem key={"true"} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={"true"}>
														true
													</MenuItem>
											</Select>
										: 
											<TextField
												style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
												InputProps={{
													style:{
														color: "white",
														marginLeft: "5px",
														maxWidth: "95%",
														height: 50, 
														fontSize: "1em",
													},
												}}
												fullWidth
												type={data.example !== undefined && data.example.includes("***") ? "password" : "text"}
												color="primary"
												defaultValue={data.value !== undefined && data.value !== null ? data.value : ""}
												placeholder={data.example} 
												onChange={(event) => {
													authenticationOption.fields[data.name] = event.target.value
												}}
											/>
									}
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
						setAuthenticationOptions(authenticationOption)
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
					style={{backgroundColor: inputColor, borderRadius: theme.palette.borderRadius,}} 
					InputProps={{
						style:{
							color: "white",
							height: 50, 
							fontSize: "1em",
						},
					}}
					fullWidth
					type="text"
					color="primary"
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

	const configureWorkflowModal = configureWorkflowModalOpen && apps.length !== 0 ? 
		<Dialog 
			open={configureWorkflowModalOpen} 
			onClose={() => {
				//setConfigureWorkflowModalOpen(false)
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 600,
					padding: 50, 
				},
			}}
		>
			<IconButton style={{zIndex: 5000, position: "absolute", top: 14, right: 14, color: "grey"}} onClick={() => {
				setConfigureWorkflowModalOpen(false)
			}}>
				<CloseIcon  />
			</IconButton>
			<ConfigureWorkflow theme={theme} globalUrl={globalUrl} workflow={workflow} setSelectedAction={setSelectedAction} setSelectedApp={setSelectedApp} setAuthenticationModalOpen={setAuthenticationModalOpen} appAuthentication={appAuthentication} selectedAction={selectedAction} apps={apps} setConfigureWorkflowModalOpen={setConfigureWorkflowModalOpen} saveWorkflow={saveWorkflow} newWebhook={newWebhook} submitSchedule={submitSchedule} referenceUrl={referenceUrl} isCloud={isCloud} />
		</Dialog>
		: null
	

	// This whole part is redundant. Made it part of Arguments instead.
	const authenticationModal = authenticationModalOpen ? 
		<Dialog 
			open={authenticationModalOpen} 
			onClose={() => {
				//setAuthenticationModalOpen(false)
				//
				if (configureWorkflowModalOpen) {
					setSelectedAction({})
				}
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
			<IconButton style={{zIndex: 5000, position: "absolute", top: 14, right: 14, color: "grey"}} onClick={() => {
				setAuthenticationModalOpen(false)
				if (configureWorkflowModalOpen) {
					setSelectedAction({})
				}
			}}>
				<CloseIcon  />
			</IconButton>
			<DialogTitle><div style={{color: "white"}}>Authentication for {selectedApp.name}</div></DialogTitle>
			<AuthenticationData app={selectedApp} />	
		</Dialog> : null

	//const loadedCheck = isLoaded && isLoggedIn && workflowDone ? 
	const loadedCheck = isLoaded && workflowDone ? 
		<div>
			{newView}
			{variablesModal}
			{executionVariableModal} 
			{conditionsModal}
			{authenticationModal}
			{codePopoutModal}
			{configureWorkflowModal}
			<TextField
				id="copy_element_shuffle"
				value={to_be_copied}
				style={{display: "none", }}
			/>
		</div>
		:
		<div>
		</div>

		// Awful way of handling scroll
		if (scrollConfig !== undefined && setScrollConfig !== undefined && Object.getOwnPropertyNames(selectedAction).length !== 0) {
			//console.log("SET CONFIG: ", scrollConfig)
			const rightSideActionView = document.getElementById("rightside_actions")
			if (rightSideActionView !== undefined && rightSideActionView !== null) {
				//console.log("FOUND RIGHTSIDE: ", rightSideActionView.scrollTop, scrollConfig)
				if (scrollConfig.top !== 0 && scrollConfig.top !== undefined && scrollConfig.top !== 0) {
					//console.log("SCROLL IS NOT 0: ", scrollConfig.top)
					//rightSideActionView.scrollTop = scrollConfig.top
					setTimeout(() => {
						scroller.scrollTo('elements_wrapper', {
							containerId: 'rightside_actions',
							offset: scrollConfig.top, 
						})

						if (scrollConfig.selected !== undefined && scrollConfig.selected !== null) {
							const selectedField = document.getElementById(scrollConfig.selected)
							if (selectedField !== undefined && selectedField !== null) {
								selectedField.focus()
								//const val = selectedField.value
								//console.log("VAL: ", val)
								//selectedField.value = ''
								//selectedField.value = val
							}
						}
					}, 5)
				} else {
					//console.log("SCROLL IS 0: ", scrollConfig.top, rightSideActionView.scrollTop)
					if (rightSideActionView.scrollTop !== scrollConfig.top) {
						setScrollConfig({
							top: rightSideActionView.scrollTop,
							left: 0,
							selected: "",
						})
					}
				}
			}	
		}

	return (
		<div>	
			<ScrollElement name="elements_wrapper">
				<Prompt
					when={!lastSaved}
					message={unloadText}
				/>
				{loadedCheck}
			</ScrollElement>
		</div>	
	)
}

export default AngularWorkflow 
