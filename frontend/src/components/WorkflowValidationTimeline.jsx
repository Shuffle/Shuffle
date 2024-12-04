import React, { useState, } from "react";
import { makeStyles, createStyles } from "@mui/styles";
import { toast } from "react-toastify" 

import { 
	Tooltip,
	Chip,
	Typography,
	IconButton,

	Avatar,
	AvatarGroup,
} from "@mui/material"

import {
	ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material"

import {
	green,
	yellow,
	red,
	grey,
} from "../views/AngularWorkflow.jsx"

import WorkflowTemplatePopup2 from "../components/WorkflowTemplatePopup2.jsx"
import { validateJson, GetIconInfo } from "../views/Workflows.jsx";
import theme from "../theme.jsx";
const itemHeight = 24

export const getParentNodes = (workflow, action) => {
    if (action === undefined || action === null) {
      return []
    }

	if (workflow.actions === undefined || workflow.actions === null) {
		workflow.actions = []
	}

	if (workflow.triggers === undefined || workflow.triggers === null) {
		workflow.triggers = []
	}

	if (workflow.branches === undefined || workflow.branches === null) {
		workflow.branches = []
	}

    var allkeys = [action.id];
    var handled = [];
    var results = [];

    // maxiter = max amount of parent nodes to loop
    // also handles breaks if there are issues
    var iterations = 0;
    var maxiter = 10;
    while (true) {
      for (let parentkey in allkeys) {
		if (allkeys[parentkey] === undefined) {
			continue
		}

		var currentnode = workflow.actions.find((element) => element.id === allkeys[parentkey])
		if (currentnode === undefined) {
			currentnode = workflow.triggers.find((element) => element.id === allkeys[parentkey])

			if (currentnode === undefined) {
				//console.log("Could not find parent node for: ", allkeys[parentkey])
				continue
			}
		}

	    if (handled.includes(currentnode.id)) {
	      continue
	    } else {
	      handled.push(currentnode.id);
	      results.push(currentnode);
	    }

        // Get the name / label here too?
        if (currentnode.length === 0) {
          continue;
        }

		// FIXME: This part is only handling first level,
		// but needs to recurse 
		var incomingEdges = []
		for (var branchkey in workflow.branches) {
			const branch = workflow.branches[branchkey]
			if (branch.destination_id !== currentnode.id) {
				continue
			}

			// Go up in the levels
			const parents = getParentNodes(workflow, {
				id: branch.source_id,
			})
			if (parents.length > 0) {
				incomingEdges = incomingEdges.concat(parents)
			}

			incomingEdges.push(branch)
		}

        for (let i = 0; i < incomingEdges.length; i++) {
          var tmp = incomingEdges[i];
          if (tmp.decorator === true) {
            continue
          }

          if (!allkeys.includes(tmp.source_id)) {
            allkeys.push(tmp.source_id)
          }
        }
      }

      if (results.length === allkeys.length || iterations === maxiter) {
        break
      }

      iterations += 1
    }

    // Remove on the end as we don't want to remove everything
    results = results.filter((data) => data.id !== action.id)
    results = results.filter((data) => data.type === "ACTION" || data.app_name === "Shuffle Workflow" || data.app_name === "User Input" || data.app_name === "shuffle-subflow")
    results.push({ label: "Execution Argument", type: "INTERNAL" })

    return results
}

const WorkflowValidationTimeline = (props) => {
	const { globalUrl, userdata, workflow, originalWorkflow, apps, getParents, execution, showHoverColor, } = props

	const [hovering, setHovering] = useState(false)
	const [decidedColor, setDecidedColor] = useState(grey)
	const [isClicked, setIsClicked] = useState(false)

	const showMiddle = false
	if (workflow === undefined || workflow === null) {
		return null
	}

	if (workflow.validation === undefined || workflow.validation === null) {
		return null
	}

	if (workflow.actions === undefined || workflow.actions === null) {
		workflow.actions = []
	}

	if (workflow.triggers === undefined || workflow.triggers === null) {
		workflow.triggers = []	
	}

	if (workflow.branches === undefined || workflow.branches === null) {
		workflow.branches = []	
	}

	var results = []
	if (execution !== undefined) {
		results = execution.results
	}

	// 1. Find startnode
	// 2. Map childnodes from it
	var startnodeId = workflow.start	

	if (execution !== undefined && execution !== null) {
		startnodeId = execution.start
	}

	// Find parent of startnodeId and if it's a webhook
	var relevantactions = []
	for (var key in workflow.branches) {
		const branch = workflow.branches[key]
		if (branch.destination_id !== startnodeId) {
			continue
		}

		for (var triggerkey in workflow.triggers) {
			const trigger = workflow.triggers[triggerkey]
			if (trigger.trigger_type !== "WEBHOOK") {
				continue
			}

			if (trigger.id === branch.source_id) {
				trigger.order = -1
				relevantactions.push(trigger)
				break
			}
		}
	}

	for (var key in workflow.actions) {
		const action = workflow.actions[key]
		if (action.id === startnodeId) {
			action.order = 0
			relevantactions.push(action)
			continue
		}

		var parents = []
		if (getParents !== undefined) {
			parents = getParents(action)
		} else {
			parents = getParentNodes(workflow, action)
		}

		if (action.app_name === "Integration Framework" || action.app_name === "Integration") {
			for (var paramkey in action.parameters) {
				const param = action.parameters[paramkey]
				if (param.name === "app_name") {
					action.app_name = param.value.charAt(0).toUpperCase() + param.value.slice(1)
				}
			}
		}

		//const parents = getParentNodes(workflow, action)
		//console.log("PARENTS", key, parents)
		if (parents !== undefined && parents !== null && parents.length > 0) {
			const parentfound = parents.find((element) => element.id === startnodeId)
			if (parentfound !== undefined) {

				// FIXME: add order here based on how many steps away from the startnode
				// This just has the parent count
				action.order = parents.length

				relevantactions.push(action)
			}
		}
	}

	if (getParents === undefined) {
		var newactions = []
		for (var key in workflow.triggers) {
			const trigger = workflow.triggers[key]
			if (trigger.trigger_type !== "SUBFLOW" && trigger.trigger_type !== "USERINPUT") {
				continue
			}

			for (var branchkey in workflow.branches) {
				const branch = workflow.branches[branchkey]

				// Checking for OUTBOUND branches from it. 
				// This will mean it's NOT the last node and is easy to visualize
				if (branch.source_id !== trigger.id) {
					continue
				}

				trigger.order = 2
			}


			// Just in case (:
			if (workflow.actions.find((element) => element.id === trigger.id) === undefined) {
				newactions.push(trigger)
				//workflow.actions.push(trigger)
			}
		}

		relevantactions.push(...newactions)
	}

	if (relevantactions.length <= 1) {
		return null
	}

	// Sort according to how many parents a node has. MAY be wrong~
	relevantactions.sort((a, b) => {
		if (a.order === undefined) {
			return 1
		}

		if (b.order === undefined) {
			return -1
		}

		return a.order - b.order
	})

	// FIXME: Add other relevant items as well from subflows (?)
	var nodecolor = grey
	var branchcolor = grey
	var skipped = false

	var previousTools = false
	var scheduleNotStarted = false

	if (workflow.validation !== undefined && workflow.validation !== null && workflow.validation.validation_ran === false) {
		console.log("Validation didn't run. Why?")
		return null
	}

	if (workflow.validation !== undefined && workflow.validation !== null && workflow.validation.errors !== undefined && workflow.validation.errors !== null && workflow.validation.errors.length > 0) {
		var newErrors = []
		for (var key in workflow.validation.errors) {
			const error = workflow.validation.errors[key]
			if (error.type === "SCHEDULE") {
				scheduleNotStarted = true 
				continue
			}

			newErrors.push(error)
		}

		workflow.validation.errors = newErrors
	}

	// Use this variable to control visualization
	//const showMiddle = false
	// border: workflow.validation.valid ? `2px solid ${green}` : "1px solid rgba(255,255,255,0.4)",
	var middleError = ""
	var startBranchColor = ""
	var middleBranchColor = ""


	const showHoverForClick = showHoverColor === true ? true : false
	return (
		<div 
			style={{ 
				padding: "10px 5px 10px 5px", 
				borderRadius: theme.palette?.borderRadius, 

				border: hovering === true && showHoverForClick === true ? `1px solid ${decidedColor}` : "1px solid rgba(255,255,255,0.0)",
				cursor: hovering === true && showHoverForClick === true ? "pointer" : "default",
			}}
			onMouseEnter={() => {
				if (isClicked === false) {
					setHovering(true)
				}
			}}
			onMouseLeave={() => {
				if (isClicked === false) {
					setHovering(false)
				}
			}}
			onClick={() => {
				if (showHoverForClick === true) {
					setIsClicked(true)
				}
			}}
		>

			{isClicked === false ? null :
				<WorkflowTemplatePopup2 
					globalUrl={globalUrl}
					userdata={userdata}

					isModalOpenDefault={isClicked}
					workflowBuilt={true}
					setIsClicked={setIsClicked}
					inputWorkflowId={workflow.id}	
				/>
			}

			<div style={{display: "flex", justifyContent: "center", alignItems: "center"}}> 

			  {scheduleNotStarted === true ?  
				  null
			  : null}

			  {relevantactions.map((action, index) => {
				action.result = {}
				if (results !== undefined) {
					const foundResult = results.find((element) => element.action.id === action.id)
					if (foundResult !== undefined) {
						action.result = foundResult

						action.status = foundResult.status
					} 
				}

				const lastitem = index === relevantactions.length - 1
				if (!lastitem) {
					if (action.app_name === "Shuffle Tools") {
						if (action.status === "SUCCESS") {
							branchcolor = red

							// Check action.result for the actual status
							const validate = validateJson(action.result.result)
    						if (validate.valid) {
								if (validate.result.success === true) {
									nodecolor = green
									branchcolor = green
								} else {
									nodecolor = grey 
									branchcolor = grey 
								}
							}


						} else if (action.status === "SKIPPED") {
							branchcolor = grey
						} else {
							// FIXME: How do we handle this? 
							if (action.status === undefined) {
								nodecolor = grey 
								branchcolor = grey 
							} else {
								nodecolor = red 
								branchcolor = red
							}
						}

						previousTools = true 

						if (startnodeId !== action.id) {
							//return null
						}
					} else {
						if (action.status === "SUCCESS") {
							nodecolor = green
						} else if (action.status === "SKIPPED") {
							nodecolor = grey
						} else {
							if (action.status === undefined) {
								nodecolor = green
							} else {
								nodecolor = red
							}
						}
					}
				} else {
					nodecolor = grey
				}

				if (action.status === "SKIPPED") {
					skipped = true
				}

				var image = ""
				if (action.large_image !== undefined && action.large_image !== null && action.large_image !== "") {
					image = action.large_image
				} else {
					if (originalWorkflow !== undefined) {
						for (var key in originalWorkflow.actions) {
							if (originalWorkflow.actions[key].id === action.id) {
								image = originalWorkflow.actions[key].large_image
								break
							}
						}

						if (image === "") {
							for (var key in originalWorkflow.triggers) {
								if (originalWorkflow.triggers[key].id === action.id) {
									image = originalWorkflow.triggers[key].large_image
									break
								}
							}

						}
					}
				}

				var founderror = ""
				//console.log("WORKFLOW VALIDATION: ", workflow.validation)
				if (workflow.validation !== undefined && workflow.validation !== null && workflow.validation.errors !== undefined && workflow.validation.errors !== null) {
					const foundError = workflow.validation.errors.find((element) => element.action_id === action.id)
					if (foundError !== undefined) {
						founderror = foundError.error
						nodecolor = red 
						branchcolor = red 
					} else {
						//console.log("NO ERROR: ", action.id)
					}
				}

				var appgroup = []
				if (action.app_name === "shuffle-subflow") {
					if (action.status === "SUCCESS") {
						nodecolor = green
						branchcolor = green
					}

					if (workflow.validation.subflow_apps !== undefined && workflow.validation.subflow_apps !== null && workflow.validation.subflow_apps.length > 0) {
						nodecolor = red
						branchcolor = red

						for (var subflowkey in workflow.validation.subflow_apps) {
							const subflowApp = workflow.validation.subflow_apps[subflowkey]
							founderror += "- " + subflowApp.error+"\n"

							if (subflowApp.error === action.id) {
								appgroup.push(subflowApp)
							}
						}
					}
				}

				if (!showMiddle && relevantactions.length > 2 && index > 0 && index === relevantactions.length - 2) {
					if (founderror.length > 0) {
						middleError += founderror+"\n"

						middleBranchColor = branchcolor
					}

					if (index === relevantactions.length-2 && relevantactions.length > 2) {

						const selectedIcon = middleError.length > 0 ? 
							<Tooltip title={
								<Typography variant="body1" style={{margin: 5, whiteSpace: "pre-line", }}>
									{middleError}
								</Typography>
							}>
								<IconButton style={{width: 30, height: 30, backgroundColor: "rgba(255,255,255,0.0)", borderRadius: 30, marginTop: 2, }}>
									<ErrorOutlineIcon style={{color: "red", }} /> 
								</IconButton>
							</Tooltip>
						: null

						return selectedIcon
					} else {
						return null
					}
				}

				// Returns for anything non-middle
				if (relevantactions.length > 2 && index >= 1 && index < relevantactions.length - 2) {
					if (founderror.length > 0) {
						middleError += founderror+"\n"
					}

					return null
				}

				if (skipped && !lastitem) {
					nodecolor = grey
					branchcolor = grey
				}

				if (previousTools) {
					previousTools = false
				} else {
					branchcolor = nodecolor
				}

				if (action.trigger_type === "WEBHOOK") {
					nodecolor = green
					branchcolor = green
				} 
				


				var flex = index !== 0 && index !== relevantactions.length - 1 ? 1 : 3
				if (nodecolor === green) {
					branchcolor = green
				} else if (nodecolor === yellow) {
					branchcolor = yellow
				} else if (nodecolor === red) {
					branchcolor = red
				}

				if (index === 0) {
					startBranchColor = branchcolor
				} else if (index !== 0 && index !== relevantactions.length - 1) {
					// FIXME: This doesn't work yet
					middleBranchColor = branchcolor
				}

				if (lastitem) {	
					if (middleError.length === 0) {
						branchcolor = startBranchColor
					} else {
						//branchcolor = middleBranchColor 
					}

					if (founderror === "") {
						nodecolor = green
					}
				}

				// FIXME: This could mean the workflow hasn't ran yet
				if (workflow.validation.valid === false && (workflow.validation.errors === undefined || workflow.validation.errors === null || workflow.validation.errors.length == 0) && (workflow.validation.subflow_apps === undefined || workflow.validation.subflow_apps === null || workflow.validation.subflow_apps.length == 0)) {
					nodecolor = grey 
					branchcolor = grey
				} 

				const branchTooltip = branchcolor === yellow ? "Check nodes for errors" : ""
				const appname = action.app_name.replaceAll('_', ' ').slice(0, 16)

				const chipBackground = nodecolor === green ? "rgba(2,203,112, 0.2)" : nodecolor === grey ? "#494949": "rgba(245,52,52,0.8)" 
				const chipColor = nodecolor === green ? "#02cb70" : nodecolor === grey ? "#CDCDCD" : "white" 

				//const ballcolor = lastitem ? nodecolor : branchcolor 
				const ballcolor = branchcolor 
				const ballsize = 8
				const topMargin = 20

				const chipStyle = {
					height: 40, 
					minWidth: 125, 
					maxWidth: 125, 
					borderRadius: 50, 
					color: chipColor, 
					backgroundColor: chipBackground,

					//border: `2px solid ${chipBackground}`, 
					//backgroundColor: "rgba(0,0,0,0.0)", 
				}

				if (image === "") {
					console.log("MISSING IMAGE: ", appname, image, action)
				}

				if (decidedColor === grey && nodecolor === green) {
					setDecidedColor(red)
				}

				if (decidedColor !== red && nodecolor === red) {
					setDecidedColor(red)
				}

				return (
					<div style={{display: "flex", flex: flex, justifyContent: "right", }}> 
						{lastitem ? 
							<Tooltip title={branchTooltip}>
								<div style={{display: "flex", width: "100%", position: "relative",}}>
									<div style={{marginLeft: 0, marginRight: 0, marginTop: topMargin, height: 3, width: "100%", backgroundColor: branchcolor, }} />
									<div style={{position: "absolute", right: -3, top: topMargin-2.5, backgroundColor: ballcolor, width: ballsize, height: ballsize, borderRadius: 10, }}/>
								</div>
							</Tooltip>
						: null}

						{appgroup.length > 0 ? 
							<AvatarGroup max={4} style={{height: itemHeight+8, }}> 
								{appgroup.map((subflowApp, subflowIndex) => {
									var appimage = ""
									if (apps !== undefined && apps !== null && apps.length > 0) {
										for (var key in apps) {
											const app = apps[key]
											if (app.name === subflowApp.app_name) {
												appimage = apps[key].large_image
												break
											}
										}
									}

									return ( 
										<Tooltip title={`App: ${subflowApp.app_name} - subflow app`}>
										<Avatar
											style={{ 
												border: `4px solid ${nodecolor}`,
											}}
											src={appimage}
										/>
										</Tooltip>
									)
								})}
							</AvatarGroup>
						: 
							<Tooltip title={
								<Typography variant="body1" style={{margin: 5, color: "white", }}>
									{founderror.length > 0 ? founderror : `App: ${appname} - Action: ${action.label}`} 
								</Typography>
							} placement="top">

								<Chip label={`${appname}`} style={chipStyle}  icon={
									<Avatar
										variant="round"
										sx={{ backgroundColor: nodecolor, width: itemHeight, height: itemHeight, borderRadius: 50, border: `1px solid ${nodecolor}`,}}
									>
										{image !== "" ? 
											<img 
												src={image} 
												style={{
													width: itemHeight, 
													height: itemHeight,  
												}} 
											/> 
										: null}
									</Avatar>
								} />

							</Tooltip>
						}

						{lastitem ? null :
							<Tooltip title={branchTooltip}>
								<div style={{display: "flex", width: "100%", position: "relative",}}>
									<div style={{position: "absolute", left: -3, top: topMargin-2.5, backgroundColor: ballcolor, color: ballcolor, width: ballsize, height: ballsize, borderRadius: 10, }}/>
									<div style={{marginLeft: 0, marginRight: 0, marginTop: 20, height: 3, width: "100%", backgroundColor: branchcolor, }} />
								</div>
							</Tooltip>
						}
					</div>
				)
			  })}
			</div>

		</div>
	)
}

export default WorkflowValidationTimeline
