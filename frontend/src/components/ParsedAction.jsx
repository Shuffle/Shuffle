import React, {useState, useEffect, useLayoutEffect} from 'react';
import { makeStyles, createStyles } from '@material-ui/core/styles';

import { GetParsedPaths } from "../views/Apps.jsx";
import { GetIconInfo } from "../views/Workflows.jsx";
import { sortByKey } from "../views/AngularWorkflow.jsx";
import { useTheme } from '@material-ui/core/styles';
import NestedMenuItem from "material-ui-nested-menu-item";
//import NestedMenuItem from "./NestedMenu.jsx";

import {Popper, TextField, Drawer, Button, Paper, Grid, Tabs, InputAdornment, Tab, ButtonBase, Tooltip, Select, MenuItem, Divider, Dialog, Modal, DialogActions, DialogTitle, InputLabel, DialogContent, FormControl, IconButton, Menu, Input, FormGroup, FormControlLabel, Typography, Checkbox, Breadcrumbs, CircularProgress, Switch, Fade} from '@material-ui/core';
import {GetApp as GetAppIcon, Search as SearchIcon, ArrowUpward as ArrowUpwardIcon, Visibility as VisibilityIcon, Done as DoneIcon, Close as CloseIcon, Error as ErrorIcon, FindReplace as FindreplaceIcon, ArrowLeft as ArrowLeftIcon, Cached as CachedIcon, DirectionsRun as DirectionsRunIcon, Add as AddIcon, Polymer as PolymerIcon, FormatListNumbered as FormatListNumberedIcon, Create as CreateIcon, PlayArrow as PlayArrowIcon, AspectRatio as AspectRatioIcon, MoreVert as MoreVertIcon, Apps as AppsIcon, Schedule as ScheduleIcon, FavoriteBorder as FavoriteBorderIcon, Pause as PauseIcon, Delete as DeleteIcon, AddCircleOutline as AddCircleOutlineIcon, Save as SaveIcon, KeyboardArrowLeft as KeyboardArrowLeftIcon, KeyboardArrowRight as KeyboardArrowRightIcon, ArrowBack as ArrowBackIcon, Settings as SettingsIcon, LockOpen as LockOpenIcon, ExpandMore as ExpandMoreIcon, VpnKey as VpnKeyIcon} from '@material-ui/icons';
import Autocomplete from '@material-ui/lab/Autocomplete';


const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important"
	},
	root: {
		"& .MuiAutocomplete-listbox": {
			border: "2px solid grey",
			color: "white",
			fontSize: 18,
			"& li:nth-child(even)": { 
				backgroundColor: "#CCC" 
			},
			"& li:nth-child(odd)": { 
				backgroundColor: "#FFF" 
			}
		}
	},
	inputRoot: {
		color: "white",
		// This matches the specificity of the default styles at https://github.com/mui-org/material-ui/blob/v4.11.3/packages/material-ui-lab/src/Autocomplete/Autocomplete.js#L90
		"&:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: "#f86a3e"
		},
	}
})
//const useStyles = makeStyles((theme) =>
//  createStyles({
//		notchedOutline: {
//			borderColor: "#f85a3e !important"
//		},
//)

const ParsedAction = (props) => {
	const {workflow, setWorkflow, setAction, setSelectedAction, setUpdate, appActionArguments, selectedApp, workflowExecutions, setSelectedResult, selectedAction, setSelectedApp, setSelectedTrigger, setSelectedEdge, setCurrentView, cy, setAuthenticationModalOpen,setVariablesModalOpen, setCodeModalOpen, selectedNameChange, rightsidebarStyle, showEnvironment, selectedActionEnvironment, environments, setNewSelectedAction, appApiViewStyle, globalUrl, setSelectedActionEnvironment, requiresAuthentication, hideExtraTypes, scrollConfig, setScrollConfig } = props

	const theme = useTheme();
	const classes = useStyles()
	const keywords = ["len(", "lower(", "upper(", "trim(", "split(", "length(", "number(", "parse(", "join("]
	const getParents = (action) => {
		if (cy === undefined) {
			return []
		}

		var allkeys = [action.id]
		var handled = []
		var results = []

		while(true) {
			for (var key in allkeys) {
				var currentnode = cy.getElementById(allkeys[key])
				if (currentnode === undefined) {
					continue
				}

				if (handled.includes(currentnode.data("id"))) {
					continue
				} else {
					// Get the name / label here too?
					handled.push(currentnode.data("id"))
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

		// Some obscure bug made this have to be done.. zz
		results = results.filter(data => data !== undefined && action !== undefined && data.id !== action.id) 
		results = results.filter(data => data !== undefined && data.type !== "TRIGGER") 
		results.push({"label": "Execution Argument", "type": "INTERNAL"})
		return results
	}


	const getApp = (appId, setApp) => {
		fetch(globalUrl+"/api/v1/apps/"+appId+"/config?openapi=false", {
			headers: {
				'Accept': 'application/json',
			},
	  	credentials: "include",
		})
		.then((response) => {
			if (response.status === 200) {
				//alert.success("Successfully GOT app "+appId)		
			} else {
				alert.error("Failed getting app")		
			}

			return response.json()
		})
    .then((responseJson) => {
			console.log("RESPONSE: ", responseJson)

			const parsedapp = responseJson.app !== undefined && responseJson.app !== null ? JSON.parse(atob(responseJson.app)) : {}
			console.log("PARSED: ", parsedapp)
			//data = parsedapp.body === undefined ? parsedapp : parsedapp.body

			if (setApp && parsedapp.actions !== undefined && parsedapp.actions !== null) {
				console.log("Inside first if")
				if (selectedApp.versions !== undefined && selectedApp.versions !== null) {
					parsedapp.versions = selectedApp.versions
				}

				if (selectedApp.loop_versions !== undefined && selectedApp.loop_versions !== null) {
					parsedapp.loop_versions = selectedApp.loop_versions
				}

				// Find authentication, and if it works?
				// If authentication has less OR more fields, it has to change
				//console.log(selected

				console.log("Inside first if2")
				var foundAction = parsedapp.actions.find(action => action.name.toLowerCase() === selectedAction.name.toLowerCase())
				console.log("FOUNDACTION: ", foundAction)
				if (foundAction !== null && foundAction !== undefined) {
					var foundparams = []
					for (var paramkey in foundAction.parameters) {
						const param = foundAction.parameters[paramkey]

						const foundParam = selectedAction.parameters.find(item => item.name.toLowerCase() === param.name.toLowerCase())
						if (foundParam === undefined) {
							console.log("COULDNT find Param: ", param)
						} else {
							foundAction.parameters[paramkey] = foundParam 
						}
						//foundparams.push(param.name)
					}
				} else {
					alert.error("Couldn't find action "+selectedAction.name)
				}


				selectedAction.errors = []
				selectedAction.is_valid = true

				// Updating params for the new action 
				selectedAction.parameters = foundAction.parameters
				selectedAction.app_id = appId
				selectedAction.app_version = parsedapp.app_version

				setSelectedAction(selectedAction)
				setSelectedApp(parsedapp)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	const defineStartnode = () => {
		if (cy === undefined) {
			return
		}

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

	const AppActionArguments = (props) => {
		const [selectedActionParameters, setSelectedActionParameters] = React.useState([])
		const [selectedVariableParameter, setSelectedVariableParameter] = React.useState("")
		const [actionlist, setActionlist] = React.useState([])
		const [jsonList, setJsonList] = React.useState([])
		const [showDropdown, setShowDropdown] = React.useState(false)
		const [showDropdownNumber, setShowDropdownNumber] = React.useState(0)
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

				setActionlist(actionlist)
			}
		})

		const changeActionParameter = (event, count, data) => {
			if (data.name.startsWith("${") && data.name.endsWith("}")) {
				// PARAM FIX - Gonna use the ID field, even though it's a hack
				const paramcheck = selectedAction.parameters.find(param => param.name === "body")
				if (paramcheck !== undefined) {
					// Escapes all double quotes
					const toReplace = event.target.value.trim().replaceAll("\\\"", "\"").replaceAll("\"", "\\\"")
					console.log("REPLACE WITH: ", toReplace)
					if (paramcheck["value_replace"] === undefined || paramcheck["value_replace"] === null) {
						paramcheck["value_replace"] = [{
							"key": data.name,
							"value": toReplace,
						}]

						console.log("IN IF: ", paramcheck)

					} else {
						const subparamindex = paramcheck["value_replace"].findIndex(param => param.key === data.name)
						if (subparamindex === -1) {
							paramcheck["value_replace"].push({
								"key": data.name,
								"value": toReplace,
							})
						} else {
							paramcheck["value_replace"][subparamindex]["value"] = toReplace 
						}

						console.log("IN ELSE: ", paramcheck)
					}
					//console.log("PARAM: ", paramcheck)
					//if (paramcheck.id === undefined) {
					//	console.log("Normal paramcheck")
					//} else {
					//	selectedActionParameters[count]["value_replace"] = paramcheck
					//	selectedAction.parameters[count]["value_replace"] = paramcheck
					//}

					if (paramcheck["value_replace"] === undefined) {
						selectedActionParameters[count]["value_replace"] = paramcheck
						selectedAction.parameters[count]["value_replace"] = paramcheck
					} else {
						selectedActionParameters[count]["value_replace"] = paramcheck["value_replace"]
						selectedAction.parameters[count]["value_replace"] = paramcheck["value_replace"]
					}
					console.log("RESULT: ", selectedAction)
					setSelectedAction(selectedAction)
					//setUpdate(Math.random())
					return
				}
			}

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

				//console.log("CURSTRING: ", curstring)
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
			//setUpdate(Math.random())
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
			setSelectedApp(selectedApp)

			setSelectedAction(selectedAction)
			setUpdate(Math.random())
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
			setSelectedAction({})

			if (setSelectedTrigger !== undefined) {
				setSelectedTrigger({})
				setSelectedApp({})
				setSelectedEdge({})
			}
			// FIXME - check if startnode

			// Set value 
			setSelectedApp(selectedApp)
			setSelectedAction(selectedAction)
			setUpdate(Math.random())
		}

		// FIXME: Issue #40 - selectedActionParameters not reset
		if (Object.getOwnPropertyNames(selectedAction).length > 0 && selectedActionParameters.length > 0) {
			var authWritten = false
			return (
				<div style={{marginTop: hideExtraTypes ? 10 : 30}}>	
					<b>Parameters</b>
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
							//setUpdate(Math.random())
							
							if (authWritten) {
								return null
							}

							authWritten = true
							return (
								<Typography key={count} id="skip_auth" variant="body2" color="textSecondary" style={{marginTop: 5,}}>
									Authentication fields are hidden
								</Typography>
							)
						}

						var staticcolor = "inherit"
						var actioncolor = "inherit"
						var varcolor = "inherit"
						var multiline
						if (data.multiline !== undefined && data.multiline !== null && data.multiline === true) {
							multiline = true
						}

						if (data.value !== undefined && data.value !== null && data.value.startsWith("{") && data.value.endsWith("}")) {
							multiline = true
						}

						var placeholder = "Static value"
						if (data.example !== undefined && data.example !== null && data.example.length > 0) {
							placeholder = data.example
						}

						if (data.name.startsWith("${") && data.name.endsWith("}")) {
							const paramcheck = selectedAction.parameters.find(param => param.name === "body")
							if (paramcheck !== undefined && paramcheck !== null) {
								if (paramcheck["value_replace"] !== undefined && paramcheck["value_replace"] !== null) {
									//console.log("IN THE VALUE REPLACE: ", paramcheck["value_replace"])
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
						if (selectedApp.generated && data.name === "url" && data.required && data.configuration && hideExtraTypes) {
							console.log("GENERATED WITH DATA: ", data)
							return null
						}

						if (selectedApp.generated && data.name === "headers") {
							//console.log("HEADER: ", data)
							//if (data.value.length === 0) {

							//}
							//setSelectedActionParameters(selectedActionParameters)
						}

						if (selectedApp.generated && data.name === "body") {
							const regex = /\${(\w+)}/g
							const found = placeholder.match(regex)
							if (found === null) {
								//setExtraBodyFields([])
							} else {
								rows = "1"
								disabled = true
								openApiHelperText = "OpenAPI spec: fill the following fields."
								//console.log("SHOULD ADD TO selectedActionParameters!: ", found, selectedActionParameters)
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
										//console.log("SKIPPING ", tmpitem)
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

								return <Divider key={Math.random()} /> 
							}
						}

						const clickedFieldId = "rightside_field_"+count
						var datafield = 
							<TextField
								disabled={disabled}
								style={{backgroundColor: theme.palette.inputColor, borderRadius: theme.palette.borderRadius, border: selectedActionParameters[count].required || selectedActionParameters[count].configuration ? "2px solid #f85a3e" : "",}} 
								InputProps={{
									style:{
										color: "white",
										minHeight: 50, 
										marginLeft: 5,
										maxWidth: "95%",
										fontSize: "1em",
									},
									endAdornment: (
										hideExtraTypes ? null :
											<InputAdornment position="end">
												<Tooltip title="Autocomplete text" placement="top">
													<AddCircleOutlineIcon style={{cursor: "pointer"}} onClick={(event) => {
														setMenuPosition({
															top: event.pageY+10,
															left: event.pageX+10,
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
								onClick={() => {
									//console.log("Clicked field: ", clickedFieldId)
									if (setScrollConfig !== undefined && scrollConfig !== null && scrollConfig !== undefined && scrollConfig.selected !== clickedFieldId) {
										scrollConfig.selected = clickedFieldId
										setScrollConfig(scrollConfig)
										//console.log("Change field id!")
									}
								}}
								id={clickedFieldId}
								rows={rows}
								color="primary"
								defaultValue={data.value}
								type={placeholder.includes("***") || (data.configuration && (data.name.toLowerCase().includes("api") || data.name.toLowerCase().includes("key") || data.name.toLowerCase().includes("pass"))) ? "password" : "text"}
								placeholder={placeholder}
								onChange={(event) => {
										changeActionParameter(event, count, data)
								}}
								helperText={selectedApp.generated && selectedApp.activated && data.name === "body" ? 
									<span style={{color:"white", marginBottom: 5, marginleft: 5,}}>
										{openApiHelperText}
									</span>
									: 
									data.name.startsWith("${") && data.name.endsWith("}") ?
										<span style={{color:"white", marginBottom: 5, marginLeft: 5}}>
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

						//console.log("FIELD VALUE: ", data.value)
            //const regexp = new RegExp("\W+\.", "g")
						//let match
						//while ((match = regexp.exec(data.value)) !== null) {
						//	console.log(`Found ${match[0]} start=${match.index} end=${regexp.lastIndex}.`);
						//}

						//const str = = data.value.search(submatch)
						//console.log("FOUND? ", n)
						//for (var key in keywords) {
						//	const keyword = keywords[key]
						//	if (data.value.includes(keyword)) {
						//		console.log("INCLUDED: ", keyword)
						//	}
						//}

						//const keywords = ["len", "lower", "upper", "trim", "split", "length", "number", "parse", "join"]
						if (selectedActionParameters[count].schema !== undefined && selectedActionParameters[count].schema !== null && selectedActionParameters[count].schema.type === "file") {
							datafield = 
								<TextField
									style={{backgroundColor: theme.palette.inputColor, borderRadius: theme.palette.borderRadius,}} 
									InputProps={{
										style:{
											color: "white",
											minHeight: 50, 
											marginLeft: "5px",
											maxWidth: "95%",
											fontSize: "1em",
										},
										endAdornment: (
											hideExtraTypes ? null :
												<InputAdornment position="end">
													<Tooltip title="Autocomplete text" placement="top">
														<AddCircleOutlineIcon style={{cursor: "pointer"}} onClick={(event) => {
															setMenuPosition({
																top: event.pageY+10,
																left: event.pageX+10,
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
									id={"rightside_field_"+count}
									onChange={(event) => {
										changeActionParameter(event, count, data)
									}}
									onBlur={(event) => {
									}}
								/>
							//const fileId = "6daabec1-892b-469c-b603-c902e47223a9"
							//datafield = `SHOW FILES FROM OTHER NODES? Filename: ${selectedActionParameters[count].value}`	
							/*
							if (selectedActionParameters[count].value != fileId) {
								changeActionParameter(fileId, count, data)
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

								changeActionParameter(e, count, data)
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
									id={"rightside_field_"+count}
									onChange={(e) => {
										changeActionParameter(e, count, data)
										setUpdate(Math.random())
									}}
									style={{backgroundColor: theme.palette.surfaceColor, color: "white", height: "50px", borderRadius: theme.palette.borderRadius,}}
									>
									{selectedActionParameters[count].options.map((data, index) => {
										const split_data = data.split("||")
										var viewed_data = data
										if (split_data.length > 1) {
											viewed_data = split_data[0]
										}

										return (
											<MenuItem key={data} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data}>
												{viewed_data}
											</MenuItem>
										)
									})}
								</Select>

						} else if (data.variant === "STATIC_VALUE") {
							staticcolor = "#f85a3e"	
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

								console.log("AUTOCOMPLETE1: ", values)

								var toComplete = selectedActionParameters[count].value.trim().endsWith("$") ? values[0].autocomplete : "$"+values[0].autocomplete
								toComplete = toComplete.toLowerCase().replaceAll(" ", "_")
								console.log("AUTOCOMPLETE: ", toComplete)
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

										
										selectedActionParameters[count]["value_replace"] = paramcheck
										selectedAction.parameters[count]["value_replace"] = paramcheck
										setSelectedAction(selectedAction)
										setUpdate(Math.random())

										setShowDropdown(false)
										setMenuPosition(null)
										return
									}
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
								<Menu
									anchorReference="anchorPosition"
									anchorPosition={menuPosition}
									onClose={() => {
										handleMenuClose()
									}}
									open={!!menuPosition}
									style={{
										color: "white", 
										marginTop: 2,
										maxHeight: 650, 
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
												style={{backgroundColor: theme.palette.inputColor, color: "white", minWidth: 250, maxWidth: 250, maxHeight: 650, scrollX: "", }}
												//PaperProps={{
												//	style: {
												//		maxHeight: 400, 
												//		width: 250, 
												//	}
												//}}
												onClick={() => {
													console.log("CLICKED: ", innerdata)
													handleItemClick([innerdata])
												}}
											>
												{parsedPaths.map((pathdata, index) => {
													// FIXME: Should be recursive in here
													const icon = pathdata.type === "value" ? <VpnKeyIcon style={iconStyle} /> : pathdata.type === "list" ? <FormatListNumberedIcon style={iconStyle} /> : <ExpandMoreIcon style={iconStyle} /> 
													return (
														<MenuItem key={pathdata.name} style={{backgroundColor: theme.palette.inputColor, color: "white", minWidth: 250, maxWidth: 250, }} value={pathdata} onMouseOver={() => {console.log("HOVER: ", pathdata)}}
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
											<MenuItem key={innerdata.name} style={{backgroundColor: theme.palette.inputColor, color: "white", minWidth: 250, maxWidth: 250, marginRight: 250, }} value={innerdata} onMouseOver={() => handleMouseover()} onMouseOut={() => {handleMouseOut()}} 
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


						var tmpitem = data.name.valueOf()
						if (data.name.startsWith("${") && data.name.endsWith("}")) {
							tmpitem = tmpitem.slice(2, data.name.length-1)
						}
						
						tmpitem = (tmpitem.charAt(0).toUpperCase()+tmpitem.substring(1)).replaceAll("_", " ")
						const description = data.description === undefined ? "" : data.description 
						const tooltipDescription = 
							<span>
								<Typography variant="body2">- Required: {data.required === true || data.configuration === true ? "True" : "False"}</Typography>
								<Typography variant="body2">- Example: {data.example}</Typography>
								<Typography variant="body2">- Description: {description}</Typography>
							</span>

						//var itemColor = "#f85a3e"
						//if (!data.required) {
						//	itemColor = "#ffeb3b"
						//}
						{/*<div style={{width: 17, height: 17, borderRadius: 17 / 2, backgroundColor: itemColor, marginRight: 10, marginTop: 2, marginTop: "auto", marginBottom: "auto",}}/>*/}
						return (
						<div key={data.name}>	
							<div style={{marginTop: 20, marginBottom: 0, display: "flex"}}>
								{data.configuration === true ? 
									<Tooltip color="primary" title={`Authenticate ${selectedApp.name}`} placement="top">
										<LockOpenIcon style={{cursor: "pointer", width: 24, height: 24, marginRight: 10, }} onClick={() => {
											setAuthenticationModalOpen(true)
										}}/>
									</Tooltip>
								:
									null
								}
								<div style={{flex: "10", marginTop: "auto", marginBottom: "auto",}}> 
									<Tooltip title={tooltipDescription} placement="top">
										<b>{tmpitem} </b> 
									</Tooltip>
								</div>

								{/*selectedActionParameters[count].options !== undefined && selectedActionParameters[count].options !== null && selectedActionParameters[count].options.length > 0  ? null : 
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
							*/}
							{(selectedActionParameters[count].options !== undefined && selectedActionParameters[count].options !== null && selectedActionParameters[count].options.length > 0 && selectedActionParameters[count].required === true && selectedActionParameters[count].unique_toggled !== undefined) || hideExtraTypes ? null : 
								<div style={{display: "flex"}}>
									<Tooltip color="secondary" title="Value must be unique" placement="top">
										<div style={{cursor: "pointer", color: staticcolor}} onClick={(e) => {}}>
          						<Checkbox
          						  checked={selectedActionParameters[count].unique_toggled}
												style={{
													color: theme.palette.primary.secondary,
												}}
          						  onChange={(event) => {
													//console.log("CHECKED!: ", selectedActionParameters[count])
          						  	selectedActionParameters[count].unique_toggled = !selectedActionParameters[count].unique_toggled
													selectedAction.parameters[count].unique_toggled = selectedActionParameters[count].unique_toggled
          						  	setSelectedActionParameters(selectedActionParameters)
													setSelectedAction(selectedAction)
													setUpdate(Math.random())
												}}
          						  name="requires_unique"
          						/>
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
										style={{color: "white", height: 50, marginTop: 2, borderRadius: theme.palette.borderRadius,}}
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
												<MenuItem key={data.name} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data} onMouseOver={() => {}}>
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

	//const CustomPopper = function (props) {
	//	const classes = useStyles()
	//	return <Popper {...props} className={classes.root} placement="bottom" />
	//}

	const baselabel = selectedAction.label
	return ( 
		<div style={appApiViewStyle} id="parsed_action_view">
			{hideExtraTypes === true ? null : 
				<span>
				<div style={{display: "flex", minHeight: 40, marginBottom: 30}}>
					<div style={{flex: 1}}>
						<h3 style={{marginBottom: 5}}>{(selectedAction.app_name.charAt(0).toUpperCase()+selectedAction.app_name.substring(1)).replaceAll("_", " ")}</h3>
						<div style={{display: "flex",}}>
							<IconButton style={{marginTop: "auto", marginBottom: "auto", height: 30, paddingLeft: 0, paddingRight: 0}} onClick={() => {
								console.log("FIND EXAMPLE RESULTS FOR ", selectedAction) 
								if (workflowExecutions.length > 0) {
									// Look for the ID
									const found = false
									for (var key in workflowExecutions) {
										if (workflowExecutions[key].results === undefined || workflowExecutions[key].results === null) {
											continue
										}

										var foundResult = workflowExecutions[key].results.find(result => result.action.id === selectedAction.id)
										if (foundResult === undefined || foundResult === null) {
											continue
										}

										setSelectedResult(foundResult)

										if (setCodeModalOpen !== undefined) {
											setCodeModalOpen(true)
										}
										break
									}
								}
							}}>
								<Tooltip color="primary" title="See previous results for this action" placement="top">
									<ArrowLeftIcon style={{color: "white"}}/>
								</Tooltip>
							</IconButton>
							<span style={{}}>
								<Typography style={{marginTop: 5,}}><a rel="norefferer" href="https://shuffler.io/docs/workflows#nodes" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>What are actions?</a></Typography>
								{selectedAction.errors !== undefined && selectedAction.errors !== null && selectedAction.errors.length > 0 ? 
									<div>
										Errors: {selectedAction.errors.join("\n")}
									</div>
									: null
								}
							</span>
						</div>
					</div>
					<div style={{display: "flex", flexDirection: "column",}}>
						{selectedAction.id === workflow.start ? null : 
							<Tooltip color="primary" title={"Make this node the start action"} placement="top">
								<Button style={{zIndex: 5000, marginTop: 10,}} color="primary" variant="outlined" onClick={(e) => {
									defineStartnode(e)	
								}}>
									<KeyboardArrowRightIcon />
								</Button> 				
							</Tooltip>
						}
						{selectedApp.versions !== null && selectedApp.versions !== undefined && selectedApp.versions.length > 1 ? 
							<Select
								defaultValue={selectedAction.app_version}
								onChange={(event) => {
									const newversion = selectedApp.versions.find(tmpApp => tmpApp.version == event.target.value)
									console.log("NEWVERSION: ", newversion)
									if (newversion !== undefined && newversion !== null) {
										getApp(newversion.id, true) 
									}
								}}
								style={{marginTop: 10, backgroundColor: theme.palette.surfaceColor, backgroundColor: theme.palette.inputColor, color: "white", height: 35, marginleft: 10, borderRadius: theme.palette.borderRadius,}}
								SelectDisplayProps={{
									style: {
										marginLeft: 10,
									}
								}}
							>
								{selectedApp.versions.map((data, index) => {
									return (
										<MenuItem key={index} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data.version}>
											{data.version}

										</MenuItem>
									)
								})}
							</Select>
						: null }
					</div>
				</div>
				<Divider style={{marginBottom: "10px", marginTop: "10px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
				<Typography>
					Name
				</Typography>
				<TextField
					style={theme.palette.textFieldStyle} 
					InputProps={{
						style: theme.palette.innerTextfieldStyle, 
					}}
					fullWidth
					color="primary"
					placeholder={selectedAction.label}
					onChange={selectedNameChange}
					onBlur={(e) => {
						const name = e.target.value
						console.log("CHANGED FROM2: ", baselabel)
						console.log("CHANGED TO: ", name)
						for (var key in workflow.actions) {
							for (var subkey in workflow.actions[key].parameters) {
								const param = workflow.actions[key].parameters[subkey]
								if (param.value.includes(baselabel)) {
									//if (param.value.toLowerCase().includes(baselabel)) {
									console.log("FOUND: ", param)
									workflow.actions[key].parameters[subkey].value.replaceAll(baselabel, e.target.value)
								}
							}
						}

						console.log("DID REPLACE ACTUALLY WORK?? - Something is buggy.")
						setWorkflow(workflow)
					}}
				/>
				</span>
			}
			{selectedApp.name !== undefined && selectedAction.authentication !== null && selectedAction.authentication !== undefined && selectedAction.authentication.length === 0 && requiresAuthentication ?
				<div style={{marginTop: 15}}>
					<Tooltip color="primary" title={"Add authentication option"} placement="top">
						<span>
							<Button color="primary" style={{}} fullWidth variant="contained" onClick={() => {
								setAuthenticationModalOpen(true)
							}}>
								<AddIcon style={{marginRight: 10, }}/> Authenticate {selectedApp.name}
							</Button> 				
						</span>
					</Tooltip>
				</div>
			: null}
			{selectedAction.authentication !== undefined && selectedAction.authentication !== null && selectedAction.authentication.length > 0 ? 
				<div style={{marginTop: 15, }}>
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
								//console.log("CHOSE AN AUTHENTICATION OPTION: ", e.target.value)
								selectedAction.selectedAuthentication = e.target.value
								selectedAction.authentication_id = e.target.value.id
								setSelectedAction(selectedAction)
								setUpdate(Math.random())
							}}
							style={{backgroundColor: theme.palette.inputColor, color: "white", height: 50, maxWidth: rightsidebarStyle.maxWidth-80, borderRadius: theme.palette.borderRadius,}}	
						>
							{selectedAction.authentication.map(data => {
								//console.log("AUTH DATA: ", data)
								return(
									<MenuItem key={data.id} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data}>
										{data.label} - ({data.app.app_version})
									</MenuItem>
								)
							})}
						</Select>

						{/*

						<Button fullWidth style={{margin: "auto", marginTop: "10px",}} color="primary" variant="contained" onClick={() => setAuthenticationModalOpen(true)}>
							AUTHENTICATE
						</Button>
						curaction.authentication = authenticationOptions
							if (curaction.selectedAuthentication === null || curaction.selectedAuthentication === undefined || curaction.selectedAuthentication.length === "")
						*/}
						<Tooltip color="primary" title={"Add authentication option"} placement="top">
							<IconButton color="primary" style={{}} onClick={() => {
								setAuthenticationModalOpen(true)
							}}>
								<AddIcon />
							</IconButton> 				
						</Tooltip>
					</div>
				</div>
				: null}

			{showEnvironment !== undefined && showEnvironment ? 
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
						style={{backgroundColor: theme.palette.inputColor, color: "white", height: "50px", borderRadius: theme.palette.borderRadius,}}
					>
						{environments.map(data => {
							if (data.archived) {
								return null
							}
							
							return (
								<MenuItem key={data.Name} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data.Name}>
									{data.Name}
								</MenuItem>
							)
						})}
					</Select>
				</div>
				: null}

			{workflow.execution_variables !== undefined && workflow.execution_variables !== null && workflow.execution_variables.length > 0 ?
				<div style={{marginTop: "20px"}}>
					<Typography>
						Set execution variable (optional) 
					</Typography>
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
						style={{backgroundColor: theme.palette.inputColor, color: "white", height: "50px", borderRadius: theme.palette.borderRadius,}}
					>
							<MenuItem style={{backgroundColor: theme.palette.inputColor, color: "white"}} value="No selection">
								<em>No selection</em>
							</MenuItem>
							<Divider />
							{workflow.execution_variables.map(data => (
								<MenuItem style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data.name}>
									{data.name}
								</MenuItem>
							))}
					</Select>
				</div>
				: null}

			<Divider style={{marginTop: "20px", height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
			<div style={{flex: "6", marginTop: "20px"}}>
				{/*hideExtraTypes ? null : 
					<div style={{marginBottom: 5}}>
						<b>Actions</b>
					</div>
				*/}

				{setNewSelectedAction !== undefined ? 
					<Autocomplete
  					id="action_search"
						autoHighlight
						value={selectedAction}
						classes={{inputRoot: classes.inputRoot}}
						ListboxProps={{
							style: {
								backgroundColor: theme.palette.inputColor,
								color: "white",
							}
						}}
						getOptionLabel={(option) => {
							if (option === undefined || option === null || option.name === undefined || option.name === undefined) {
								return null
							}

							const newname = (option.name.charAt(0).toUpperCase()+option.name.substring(1)).replaceAll("_", " ")
							return newname
						}}
	  				options={sortByKey(selectedApp.actions, "label")}
						fullWidth
						style={{backgroundColor: theme.palette.inputColor, height: 50, borderRadius: theme.palette.borderRadius,}}
						onChange={(event, newValue) => {
							// Workaround with event lol
							if (newValue !== undefined && newValue !== null) {
								setNewSelectedAction({"target": {"value": newValue.name}}) 
							} 

						}}
						renderOption={(data) => {
							var newActionname = data.name
							if (data.label !== undefined && data.label !== null && data.label.length > 0) {
								newActionname = data.label
							}

							const iconInfo = GetIconInfo({"name": data.name})
							const useIcon = iconInfo.originalIcon

							newActionname = (newActionname.charAt(0).toUpperCase()+newActionname.substring(1)).replaceAll("_", " ")

							return (
								<div style={{display: "flex"}}>
									<span style={{marginRight: 10, marginTop: "auto", marginBottom: "auto",}}>{useIcon}</span> 
									<span style={{}}>{newActionname}</span>
								</div>
							)
						}}
				  	renderInput={(params) => {
							return (
								<TextField 
									style={{backgroundColor: theme.palette.inputColor, borderRadius: theme.palette.borderRadius, }} 
									{...params} 
									label="Find Actions" 
									variant="outlined" 
								/>
							)
						}}
					/>

				: null}

				{/*setNewSelectedAction !== undefined ? 
					<Select
						value={selectedAction.name}
						fullWidth
						onChange={setNewSelectedAction}
						style={{backgroundColor: theme.palette.inputColor, color: "white", height: 50, borderRadius: theme.palette.borderRadius,}}
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

							const iconInfo = GetIconInfo({"name": data.name})
							const useIcon = iconInfo.originalIcon

							// ROFL FIXME - loop
							newActionname = newActionname.replaceAll("_", " ")
							newActionname = newActionname.charAt(0).toUpperCase()+newActionname.substring(1)
							return (
								<MenuItem key={data.name} style={{maxWidth: 400, overflowX: "hidden", backgroundColor: theme.palette.inputColor, color: "white", display: "flex",}} value={data.name}>
									<span style={{marginRight: 10, marginTop: "auto", marginBottom: "auto",}}>{useIcon}</span> 
									<span style={{}}>{newActionname}</span>
								</MenuItem>
							)
						})}
					</Select>
				: null*/}

				{selectedAction.description !== undefined && selectedAction.description.length > 0 && hideExtraTypes !== true ?
				<div style={{marginTop: 10, marginBottom: 10, maxHeight: 60, overflow: "hidden"}}>
					{selectedAction.description}
				</div> : null}

				<div style={{marginTop: "10px", borderColor: "white", borderWidth: "2px", marginBottom: hideExtraTypes ? 50 : 200 ,}}>
					<AppActionArguments key={selectedAction.id} selectedAction={selectedAction} />
				</div>
			</div>
		</div>
		)
	}


export default ParsedAction;
