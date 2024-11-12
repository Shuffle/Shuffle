/* eslint-disable react/no-multi-comp */
import React, {useState, useEffect} from 'react';
import ReactDOM from "react-dom"

import ReactJson from "react-json-view-ssr";
import { green, yellow, red, grey} from "./AngularWorkflow.jsx";
import { CodeHandler, Img, OuterLink, } from "../views/Docs.jsx";
import { useNavigate, Link, useParams } from "react-router-dom";
import { validateJson, collapseField, GetIconInfo } from "./Workflows.jsx";
import EditWorkflow from "../components/EditWorkflow.jsx"
import { toast } from "react-toastify" 
import { makeStyles } from '@mui/material/styles';
import { useInterval } from "react-powerhooks";
import { isMobile } from "react-device-detect";
import Markdown from "react-markdown";
import theme from '../theme.jsx';
import rehypeRaw from "rehype-raw";
import RecentWorkflow from "../components/RecentWorkflow.jsx";

import {
  	Tooltip,
	Select,
	IconButton,
	CircularProgress, 
	TextField, 
	Button, 
	ButtonGroup, 
	Paper, 
	Typography,
	Divider,

	Dialog,
	DialogTitle,
	DialogContent,
	MenuItem,
} from '@mui/material';

import {
  Preview as PreviewIcon,
  ContentCopy as ContentCopyIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const hrefStyle = {
	color: "white", 
	textDecoration: "none"
}


const RunWorkflow = (defaultprops) => {
  const { globalUrl, userdata, isLoaded, isLoggedIn, setIsLoggedIn, setCookie, register, serverside } = defaultprops;

  let navigate = useNavigate();
  const [_, setUpdate] = useState(""); // Used to force rendring, don't remove
  const [explorerUi, setExplorerUi] = useState(false)
  const [message, setMessage] = useState("");
  const [workflow, setWorkflow] = React.useState({});
  const [executionRequest, setExecutionRequest] = React.useState({});
  const [executionArgument, setExecutionArgument] = useState("");
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionData, setExecutionData] = React.useState({});
  const [executionRunning, setExecutionRunning] = useState(false);
  const [workflowQuestion, setWorkflowQuestion] = useState("");
  const [selectedOrganization, setSelectedOrganization] = React.useState(undefined);
  const [apps, setApps] = React.useState([]);
  const [buttonClicked, setButtonClicked] = React.useState("");
  const [foundSourcenode, setFoundSourcenode] = React.useState(undefined);
  const [editWorkflowModalOpen, setEditWorkflowModalOpen] = React.useState(false)
  const [sharingOpen, setSharingOpen] = React.useState(false)
  const [realtimeMarkdown, setRealtimeMarkdown] = React.useState("")
  const [forms, setForms] = React.useState([])
  const [boxWidth, setBoxWidth] = React.useState(500)

	const IframeWrapper = (props) => {
		var propsCopy = JSON.parse(JSON.stringify(props))
		propsCopy.width = 400 
		propsCopy.height = 225 

		return <iframe {...propsCopy} style={{width: propsCopy.width, height: propsCopy.height, }} />
	}

	const ImgWrapper = (props) => {
		var propsCopy = JSON.parse(JSON.stringify(props))
		if (propsCopy.width === undefined || propsCopy.width === null) {
			propsCopy.width = 400 
			propsCopy.height = "auto"

			propsCopy.margin = "auto"
		}

		return Img(propsCopy)
	}

	const bodyDivStyle = {
		margin: "auto",
		width: isMobile? "100%" : boxWidth,
		position: "relative", 

		paddingBottom: 250,
	}

	const boxStyle = {
		color: "white",
		padding: "25px 50px 50px 50px", 
		backgroundColor: theme.palette.surfaceColor,
		borderRadius: 25, 
		minHeight: 500, 
	}

    const params = useParams();
    var props = JSON.parse(JSON.stringify(defaultprops))
    props.match = {}
    props.match.params = params

	const defaultTitle = workflow.name !== undefined ? "Shuffle - Form for " + workflow.name : "Shuffle - Form to Run Workflows"
	if (document != undefined && document.title != defaultTitle) {
		document.title = defaultTitle
	}

	const parsedsearch = serverside === true ? "" : window.location.search
	if (serverside !== true) {
		const tmpMessage = new URLSearchParams(window.location.search).get("message")
		if (tmpMessage !== undefined && tmpMessage !== null && message !== tmpMessage) {
			setMessage(tmpMessage)
		}
	}

  // Used to swap from login to register. True = login, false = register

	// Error messages etc
	const [executionInfo, setExecutionInfo] = useState("");

	const handleValidateForm = (executionArgument) => {
		// Check if every field exists
		if (executionArgument === undefined || executionArgument === null) {
			return true 
		}

		for (var key in executionArgument) {
			if (executionArgument[key] === undefined || executionArgument[key] === null || executionArgument[key] === "") {
				return false
			}
		}

		return true
	}

	const loadForms = (orgId) => {
		const url = `${globalUrl}/api/v1/orgs/${orgId}/forms`
		fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for org forms");
			}

			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.success === false) {
				toast.error("Failed saving workflow. Please try again.")
			} else {
				if (responseJson?.length > 0) {
					// Sort them by name
					responseJson.sort((a, b) => a.name.localeCompare(b.name))
					setForms(responseJson)
				}
			}
		})
		.catch((error) => {
			//toast.error("Load form error: " + error)
		})
	}

	const saveWorkflow = (workflow) => {
		const url = `${globalUrl}/api/v1/workflows/${workflow.id}`
		fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify(workflow),
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!");
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.success === false) {
				toast.error("Failed saving workflow. Please try again.")
			}
			//toast.success("Saved workflow")
		})
		.catch((error) => {
			toast.error("Save workflow error: " + error)
		});

	}

	const getApps = () => {
		fetch(globalUrl + "/api/v1/apps", {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for apps :O!");
			}

			return response.json();
		})
		.then((responseJson) => {
			setApps(responseJson)
		})
		.catch(error => {
			console.log("App error: ", error);
		})
	}

	const ShowExecutionResults = (props) => {
		const { executionData } = props;

		if (executionData === undefined || executionData === null || executionData === {}) {
			return null
		}

		const executionMargin = 20 
		const defaultReturn = null
		/*
			<div style={{marginTop: executionMargin, }}>
				<Typography variant="h6" style={{color: theme.palette.primaryColor}}>
					No results yet
				</Typography>
			</div>
		*/

		if (executionData.results === undefined || executionData.results === null)  {
			return defaultReturn
		}

		const validate = validateJson(executionData.result)

		return (
			<div style={{marginTop: executionMargin, }}>
				<Divider style={{marginTop: 20, marginBottom: 20, }}/>

				{validate.valid === false ?
					<div style={{marginTop: 20, }}>
						<Divider />
						<Markdown
						  components={{
							img: Img,
							code: CodeHandler,
							a: OuterLink,
						  }}
						  id="markdown_wrapper"
						  escapeHtml={false}
						  style={{
							maxWidth: "100%", 
							minWidth: "100%", 
							overflowX: "hidden",
							overflowY: "auto",
						  }}
						>
							{validate.result}
		    			</Markdown>
					</div> 
				: 
					<ReactJson
						src={validate.result}
						theme={theme.palette.jsonTheme}
						style={theme.palette.reactJsonStyle}
						collapsed={false}
						iconStyle={theme.palette.jsonIconStyle}
						collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
					    shouldCollapse={(jsonField) => {
							return collapseField(jsonField)
						}}
						displayArrayKey={false}
						enableClipboard={(copy) => {
						  //handleReactJsonClipboard(copy);
						}}
						displayDataTypes={false}
						onSelect={(select) => {
						  //HandleJsonCopy(validate.result, select, "exec");
						}}
						name={false}
					  />
				}

			</div>
		)
	}

	const onSubmit = (event, execution_id, authorization, answer) => {
		if (event !== null) {
			event.preventDefault()
		}

		stop()
  	    setMessage("")
  	    setExecutionLoading(true)
		setExecutionData({})
		setExecutionInfo("")

		var data = {
			"execution_argument": executionArgument,
			"execution_source": "form",
		}

		if (workflow.input_questions !== undefined && workflow.input_questions !== null && workflow.input_questions.length > 0) {
			try {
				data["execution_argument"] = JSON.stringify(executionArgument)
			} catch (e) {
				console.log("Error parsing execution argument: ", e)
			}
		}

		if (workflow.start !== undefined && workflow.start !== null && workflow.start.length > 0) {
			//data.start = workflow.start
	 	} else {
			/*
			if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
				for (let actionkey in workflow.actions) {
        			if (workflow.actions[actionkey].isStartNode) {
						data.start = workflow.actions[actionkey].id
						break
					}
				}
			}
			*/
		}

		var url = `${globalUrl}/api/v1/workflows/${props.match.params.key}/run`
		var fetchBody = {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
			mode: 'cors',
			credentials: 'include',
			crossDomain: true,
			withCredentials: true,
		}

		if (answer !== undefined && execution_id !== undefined && authorization !== undefined) {
			url += `?reference_execution=${execution_id}&authorization=${authorization}&answer=${answer}`
			data = {}
			fetchBody.method = "GET"

			if (executionArgument !== undefined && executionArgument !== null) {
				try {
					if (typeof executionArgument === "string") {
						url += "&note=" + executionArgument
					} else {
						url += "&note=" + JSON.stringify(executionArgument)
					}
				} catch (e) {
					url += "&note=" + executionArgument
				}
			}

		} else {
			fetchBody.method = "POST"
			fetchBody.body = JSON.stringify(data)
		}

		// IF there is an execution argument, we should use it
		fetch(url, fetchBody)
		.then((response) => {
			if (response.status !== 200 && response.status !== 201) {

				if (answer !== undefined && execution_id !== undefined && authorization !== undefined) {
					setExecutionLoading(false)
					setExecutionRunning(true);
					setExecutionRequest({
						"execution_id": execution_id,
						"authorization": authorization,
					})

					start();
					return response.json()
				}
			}

			if (response.status === 401 || response.status === 403) {
				toast("This Form is not available for you to run. If you this is an error, contact support@shuffler.io with a link to this form")
			}

			return response.json()
		})
		.then(responseJson => {
			setExecutionLoading(false)
			if (responseJson.execution_id !== undefined && responseJson.execution_id !== null && responseJson.execution_id.length > 0) {
				navigate(`?execution_id=${responseJson.execution_id}`)
			}

			if (responseJson.success === false) {
				console.log("Failed sending execution request")
				if (responseJson.reason !== undefined && responseJson.reason !== null) {
					toast.warn(responseJson.reason)
				}

				stop()
				setMessage("")
				setExecutionData({})
				setExecutionInfo("")
				setExecutionRunning(false)
				setExecutionRequest({})
			} else {
				console.log("Started execution")

				if (answer !== undefined && answer !== null) {
					console.log("Skipping start")
				} else {
					setExecutionRunning(true);
					setExecutionRequest(responseJson)
					start()
				}
			}
		})
		.catch(error => {
			//setExecutionInfo("Error in workflow startup: " + error)
			toast.warn("Error submitting form. Please try again.")

			stop()
			setMessage("")
			setExecutionData({})
			setExecutionInfo("")

			setExecutionLoading(false)
		})
	}

    const { start, stop } = useInterval({
      duration: 1500,
      startImmediate: true,
      callback: () => {
        fetchUpdates(executionRequest.execution_id, executionRequest.authorization)
      },
    })

	const handleExecutionLoader = () => {
	  if (window === undefined || window === null) {
		  console.log("No window")
		  return
	  }

	  const urlParams = new URLSearchParams(window.location.search)
	  if (urlParams === undefined || urlParams === null) {
		  console.log("No search params")
		  return
	  }

	  const execution = urlParams.get("execution_id")
	  if (execution === undefined || execution === null || execution.length === 0) {
		  console.log("No execution")
	  }

	  // Only works if you're logged in
      fetchUpdates(execution, "")
	}

	const loadInputWorkflowData = (workflow_id, inputWorkflow) => {

		const url = `${globalUrl}/api/v1/workflows/${workflow_id}/run`
		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!");
			}

			return response.json()
		})
		.then((responseJson) => {
			// Timeout after 5 seconds (max load time)
			if (responseJson.execution_id !== undefined && responseJson.execution_id !== null && responseJson.execution_id.length > 0 && responseJson.authorization !== undefined && responseJson.authorization !== null && responseJson.authorization.length > 0) {
	
				//for (var key in responseJson.results) {
				for (let i = 0; i < 5; i++) {
					setTimeout(() => {
						fetchUpdates(responseJson.execution_id, responseJson.authorization, false, true)
					}, i * 1000)
				}
			} else {
				// Replace the markdown with the result
				if (realtimeMarkdown !== undefined && realtimeMarkdown !== null && realtimeMarkdown.length > 0) {
					const newmarkdown = realtimeMarkdown.replace(`{{ ${workflow_id} }}`, "", -1)
					setRealtimeMarkdown(newmarkdown)
				} else if (inputWorkflow.form_control.input_markdown !== undefined && inputWorkflow.form_control.input_markdown !== null && inputWorkflow.form_control.input_markdown.length > 0) {
					const newmarkdown = inputWorkflow.form_control.input_markdown.replace(`{{ ${workflow_id} }}`, "", -1)
					setRealtimeMarkdown(newmarkdown)
				}
			}

		})
		.catch((error) => {
			console.log("Get workflow error: ", error.toString())

			if (realtimeMarkdown !== undefined && realtimeMarkdown !== null && realtimeMarkdown.length > 0) {
				const newmarkdown = inputWorkflow.form_control.input_markdown.replace(`{{ ${workflow_id} }}`, "", -1)
				setRealtimeMarkdown(newmarkdown)
			} else if (inputWorkflow.form_control.input_markdown !== undefined && inputWorkflow.form_control.input_markdown !== null && inputWorkflow.form_control.input_markdown.length > 0) {
				const newmarkdown = inputWorkflow.form_control.input_markdown.replace(`{{ ${workflow_id} }}`, "", -1)
				setRealtimeMarkdown(newmarkdown)
			}
		})
	}

	const getWorkflow = (workflow_id, selectedNode) => {
  		setRealtimeMarkdown("")

		const url = `${globalUrl}/api/v1/workflows/${workflow_id}`
		fetch(url, {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  credentials: "include",
		})
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflows :O!");
        }

		if (response.status === 401 || response.status === 403) {
			toast("This Form is not available to you. If you think this is an error, please contact support@shuffler.io with the URL.")
		}

        return response.json()
      })
      .then((responseJson) => {
        // Not sure why this is necessary.
        if (responseJson.isValid === undefined) {
          responseJson.isValid = true;
        }

        if (responseJson.errors === undefined) {
          responseJson.errors = [];
        }

        if (responseJson.actions === undefined || responseJson.actions === null) {
          responseJson.actions = [];
        }

        if (responseJson.triggers === undefined || responseJson.triggers === null) {
          responseJson.triggers = [];
        }

		if (responseJson.input_questions !== undefined && responseJson.input_questions !== null && responseJson.input_questions.length > 0) {

			var newexec = {}
			for (let questionkey in responseJson.input_questions) {
				const question = responseJson.input_questions[questionkey]

				var multiChoiceOptions = question.value !== undefined && question.value !== null && question.value.length > 0 && question.value.includes(";") ? question.value.split(";") : []
				if (multiChoiceOptions.length > 1) {
					newexec[multiChoiceOptions[0]] = ""
				} else {
					newexec[question.value] = ""
				}
			}

			setExecutionArgument(newexec)
		}

		if (selectedNode !== undefined && selectedNode !== null && selectedNode.length > 0) {

			var found = false
			for (var actionkey in responseJson.actions) {
				if (responseJson.actions[actionkey].id === selectedNode) {
					found = true
					setFoundSourcenode(responseJson.actions[actionkey])
					break
				}
			}

			if (!found) {
				for (var triggerkey in responseJson.triggers) {
					if (responseJson.triggers[triggerkey].id !== selectedNode) {
						continue
					}
		

					setFoundSourcenode(responseJson.triggers[triggerkey])

					if (responseJson.input_questions !== undefined && responseJson.input_questions !== null && responseJson.input_questions.length > 0 && responseJson.triggers[triggerkey].trigger_type === "USERINPUT") {

						// Look for input questions param
						for (var paramkey in responseJson.triggers[triggerkey].parameters) {
							if (responseJson.triggers[triggerkey].parameters[paramkey].name === "input_questions") {

								var relevantquestions = []
								for (var questionkey in responseJson.input_questions) {
									if (responseJson.triggers[triggerkey].parameters[paramkey].value.includes(responseJson.input_questions[questionkey].name)) {
										relevantquestions.push(responseJson.input_questions[questionkey])
									}
								}

								responseJson.input_questions = relevantquestions
							}
						}
					}


					break
				}
			}
		}

		if (responseJson.form_control.input_markdown !== undefined && responseJson.form_control.input_markdown !== null && responseJson.form_control.input_markdown.length > 0) {
			// Look for {{ uuid }} format, and try to run that workflow with their account
			// This is a hack, but a fun one.
			var newmarkdown = responseJson.form_control.input_markdown.replace("", "")
			
			const uuidRegex = /{{\s[a-f0-9-]+\s}}/g
			const found = newmarkdown.match(uuidRegex)
			if (found !== undefined && found !== null && found.length > 0) {
				var handled = []
				for (var foundkey in found) {
					const uuid = found[foundkey].replace("{{", "").replace("}}", "").trim()

					if (handled.includes(uuid)) {
						continue
					}

					handled.push(uuid)

					const storageKey = `workflowresult_${uuid}`
					const value = localStorage.getItem(storageKey)

					var runWorkflow = false
					if (value !== undefined && value !== null && value.length > 0) {
						// Check if timestamp with new Date().getTime() is more than 10 minutes ago
						const parsedValue = JSON.parse(value)
						if (parsedValue.timestamp !== undefined && parsedValue.timestamp !== null) {
							// 1 min = 60000ms -> 5 min = 300000ms
							const now = new Date().getTime()
							if (now - parsedValue.timestamp > 300000) {
								localStorage.removeItem(storageKey)
								runWorkflow = true 
							} else {
								newmarkdown = newmarkdown.replace(`{{ ${uuid} }}`, parsedValue.result, -1)
							}
						} else {
							runWorkflow = true
						}
					} else {
						runWorkflow = true
					}

					if (runWorkflow) {
						loadInputWorkflowData(uuid, responseJson)
					}

				}

				setRealtimeMarkdown(newmarkdown)
			}
		}


		handleExecutionLoader()

		handleGetOrg(responseJson.org_id)

		if (responseJson.form_control === undefined || responseJson.form_control === null) {
			responseJson.form_control = {
				"input_markdown": "",
				"output_yields": [],
				"form_width": 500,
			}
		}


		if (responseJson.form_control.form_width !== undefined && responseJson.form_control.form_width !== null && responseJson.form_control.form_width > 300) {
			setBoxWidth(responseJson.form_control.form_width)
		}

		setWorkflow(responseJson)
      })
      .catch((error) => {
        console.log("Get workflow error: ", error.toString());
      });
  };


  const handleUpdateResults = (responseJson, executionRequest) => {
		if (responseJson === undefined || responseJson === null || responseJson.success === false) {
			return
		}

		//console.log("Got response: ", responseJson)

		ReactDOM.unstable_batchedUpdates(() => {
		  if (JSON.stringify(responseJson) !== JSON.stringify(executionData)) {
			// FIXME: If another is selected, don't edit..
			// Doesn't work because this is some async garbage
			if (executionData.execution_id === undefined || (responseJson.execution_id === executionData.execution_id && responseJson.results !== undefined && responseJson.results !== null)) {
			  if (executionData.status !== responseJson.status || executionData.result !== responseJson.result || (executionData.results !== undefined && responseJson.results !== null && executionData.results.length !== responseJson.results.length)) {

				if (responseJson.result !== undefined && responseJson.result !== null && responseJson.result.length > 0) {
					if (responseJson.result.startsWith("[") && responseJson.result.endsWith("]")) { 
						try {
							responseJson.result = JSON.parse(responseJson.result).length
						} catch (e) {
							console.log("Error parsing length: ", e)
						}
					}
				}

				//console.log("Updating data!")
				setExecutionData(responseJson)

				for (var key in responseJson.results) {
					if (responseJson.results[key].status === "WAITING") {
						const validate = validateJson(responseJson.results[key].result)
						if (validate.valid && typeof validate.result === "string") {
							validate.result = JSON.parse(validate.result)
						} 

						if (validate.result["information"] !== undefined && validate.result["information"] !== null) {
							setWorkflowQuestion(validate.result["information"])
						}

						break
					}
				}
          } else {
            console.log("NOT updating executiondata state.");
          }
        }
      }

      if (responseJson.status === "ABORTED" || responseJson.status === "STOPPED" || responseJson.status === "FAILURE" || responseJson.status === "WAITING") {
        stop();

        if (executionRunning) {
          setExecutionRunning(false);
        }

        //getWorkflowExecution(props.match.params.key, "");
      } else if (responseJson.status === "FINISHED") {
        setExecutionRunning(false)
        stop();
        //getWorkflowExecution(props.match.params.key, "");
      }
		})
	}

  const handleGetOrg = (orgId, execution_id, authorization) => {
    if (orgId === undefined || orgId === null || orgId.length === 0) {
      return
    }

    // Just use this one?
    var url = execution_id !== undefined && authorization !== undefined ?  `${globalUrl}/api/v1/orgs/${orgId}?reference_execution=${execution_id}&authorization=${authorization}` : `${globalUrl}/api/v1/orgs/${orgId}`;

	loadForms(orgId)

    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 401) {
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson["success"] === false) {
        } else {
          if (responseJson.sync_features === undefined || responseJson.sync_features === null) {
          }

		  if (document != undefined && document.title != defaultTitle) {
		  	document.title = responseJson.name + " - " + defaultTitle
		  }

		  if (responseJson.image !== undefined && responseJson.image !== null && responseJson.image.length > 0) {
		  } else {
			  responseJson.image = theme.palette.defaultImage
		  }
          setSelectedOrganization(responseJson)
        }
      })
      .catch((error) => {
        console.log("Error getting org: ", error);
      });
  };

	const fetchUpdates = (execution_id, authorization, getorg, replaceMarkdown) => {
		if (execution_id === undefined || execution_id === null || execution_id === "") {
			console.log("No execution id: ", execution_id)
			stop()
			return
		}

		const innerRequest = {
			"execution_id": execution_id,
			"authorization": authorization === undefined || authorization === null ? "" : authorization,
		}

		if (executionRequest.execution_id !== innerRequest.execution_id && replaceMarkdown !== true) {
			setExecutionRequest(innerRequest)
		}

		if (execution_id === "") {
			console.log("No execution id or authorization")
  			setExecutionLoading(false)
			setExecutionRunning(false)
			stop()
			return
		}

		fetch(globalUrl + "/api/v1/streams/results", {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  body: JSON.stringify(innerRequest),
		  credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!");
			}
		
			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.success == false) {
				return
			}

			if (replaceMarkdown === true) {
				if (responseJson.result.length > 0) {
					// Set local storage for the workflow id
					const storageKey = `workflowresult_${responseJson.workflow.id}`
					const value = {
						"timestamp": new Date().getTime(),
						"result": responseJson.result,
					}

					localStorage.setItem(storageKey, JSON.stringify(value))
				}

				if (realtimeMarkdown !== undefined && realtimeMarkdown !== null && realtimeMarkdown.length > 0) {
					const newmarkdown = realtimeMarkdown.replace(`{{ ${responseJson.workflow.id} }}`, responseJson.result, -1)
					setRealtimeMarkdown(newmarkdown)

				} else if (workflow.form_control.input_markdown !== undefined && workflow.form_control.input_markdown !== null && workflow.form_control.input_markdown.length > 0) {
					const newmarkdown = workflow.form_control.input_markdown.replace(`{{ ${responseJson.workflow.id} }}`, responseJson.result, -1)
					setRealtimeMarkdown(newmarkdown)
				}

			} else {
				if (getorg === true) {
					handleGetOrg(responseJson.org_id, execution_id, authorization)
				}

				handleUpdateResults(responseJson, executionRequest);
			}
		})
		.catch((error) => {
			console.log("Execution result Error: ", error);
		});
  };

	const searchParams = new URLSearchParams(window.location.search)
	const answer = searchParams.get("answer")
	const execution_id = searchParams.get("reference_execution")
	const authorization = searchParams.get("authorization")
	const sourceNode = searchParams.get("source_node")

	useEffect(() => {
		if (!isLoaded) {
			return
		}

		if (props.match.params.key === undefined) {
  			setExplorerUi(true)

			if (isLoggedIn) {
				loadForms(userdata.active_org.id)
				handleGetOrg(userdata.active_org.id)
			}

			return
		} 

		getWorkflow(props.match.params.key, sourceNode) 
		if (execution_id !== undefined && execution_id !== null && authorization !== undefined && authorization !== null) {
			console.log("Get execution: ", execution_id)
			fetchUpdates(execution_id, authorization, true)
		}

		if (answer !== undefined && answer !== null) {
			console.log("Got answer: ", answer)
		}
	}, [isLoaded])

	useEffect(() => {
		if (executionData === undefined || executionData === null || executionData === {}) {
			return
		}

		if (foundSourcenode === undefined || foundSourcenode === null || foundSourcenode === {}) {
			return
		}

		if (foundSourcenode.trigger_type !== "USERINPUT") {
			return
		}

		if (executionData.results === undefined || executionData.results === null || executionData.results.length === 0) {
			return
		}

		for (var resultkey in executionData.results) {
			const result = executionData.results[resultkey]
			if (result.action.id !== foundSourcenode.id) {
				continue
			}

			var parsedresult = result.result
			try {
				parsedresult = JSON.parse(parsedresult)
			} catch (e) {
				console.log("Error parsing result: ", e)
			}

			if (result.status !== "WAITING") {
				if (parsedresult.click_info !== undefined && parsedresult.click_info !== null) {
					if (parsedresult.click_info.user !== undefined && parsedresult.click_info.user !== null && parsedresult.click_info.user.length > 0) {
						setMessage("Already answered by " + parsedresult.click_info.user)
					}
				} else {
					setMessage("Answered.")
				}

			}

			break
		}

	}, [executionData, foundSourcenode])

	const buttonBackground = "linear-gradient(to right, #f86a3e, #f34079)"
	const buttonStyle = {borderRadius: 25, height: 50, fontSize: 18, backgroundImage: handleValidateForm(executionArgument) || executionLoading ? buttonBackground : "grey", color: "white"}
	
	//const disabledButtons = message.length > 0 || executionData.status === "FINISHED" || executionData.status === "ABORTED"
	const disabledButtons = executionLoading || executionRunning

	const organization = selectedOrganization !== undefined && selectedOrganization !== null ? selectedOrganization.name : "Unknown"
	const contact = selectedOrganization !== undefined && selectedOrganization !== null && selectedOrganization.org !== undefined && selectedOrganization.org !== null? selectedOrganization.org : "support@shuffler.io"
	//const contact = selectedOrganization !== undefined && selectedOrganization !== null && selectedOrganization.contact !== undefined && selectedOrganization.contact !== null? selectedOrganization.contact : "support@shuffler.io"
	
	const image = selectedOrganization !== undefined && selectedOrganization !== null && selectedOrganization.image !== undefined && selectedOrganization.image !== null && selectedOrganization.image !== "" ? selectedOrganization.image : theme.palette.defaultImage

	//console.log("IMG: ", image, "ORG: ", selectedOrganization)

	if (!disabledButtons && answer !== undefined && answer !== null && organization !== "Unknown" && buttonClicked.length === 0) {
		console.log("Finding button!")
		// Find the button
		var buttonid = ""
		if (answer === "false") {
			buttonid = "abort_execution"
		} else if (answer === "true") {
			buttonid = "continue_execution"
		}

		if (buttonid !== "") {
			const foundButton = document.getElementById(buttonid)
			console.log("Button: ", foundButton)
			if (foundButton !== undefined && foundButton !== null) {
				foundButton.click()
			}
		}
	}

	const FormList = () => {
		return (
			<div>
				{forms.map((form, formIndex) => {
					if (form.id === undefined || form.id === null) {
						return null
					}

					return (
						<div key={formIndex} style={{marginBottom: 10, }}>
							<RecentWorkflow 
								workflow={form}
								onclickHandler={() => {
									navigate(`/forms/${form.id}`)
									getWorkflow(form.id, sourceNode) 
									setExplorerUi(false)
								}}
								currentWorkflowId={workflow.id}
							/>
						</div>
					)
				})}
			</div>
		)
	}
	
	const ExplorerUi = () => {
		return (
			<div style={{paddingTop: 50, marginTop: 50, width: 250, itemAlign: "center", textAlign: "center", margin: "auto", }}>

				{forms !== undefined && forms !== null && forms.length > 0 ?
					<div>
						<Typography variant="h6" style={{marginBottom: 20, }}>
							Available forms
						</Typography>
						<FormList />
					</div>
					: 
					<Typography variant="h6" style={{marginTop: 100, marginBottom: 20, }}>
						No Form Found
					</Typography>
				}
			</div> 
		)
	}

	var validResults = 0
	const basedata = 
		<div style={bodyDivStyle}>
			<Paper style={boxStyle}>
				{explorerUi === true ? 
					<ExplorerUi />
					:
					workflow.id === undefined || workflow.id === null ?
					<div style={{paddingTop: 150, marginTop: 150, width: 250, itemAlign: "center", textAlign: "center", margin: "auto", }}>
						<CircularProgress />
						<Typography variant="body1" style={{marginTop: 20, }}>
							Loading Form Details...
						</Typography>
					</div>
				: 
				<div>
					{workflow.form_control.input_markdown !== undefined && workflow.form_control.input_markdown !== null && workflow.form_control.input_markdown.length > 0 ? 
						<div style={{marginBottom: 20, }}>
							<Markdown
							  components={{
								iframe: IframeWrapper,
								img: ImgWrapper,
								code: CodeHandler,
								a: OuterLink,
							  }}
							  id="markdown_wrapper"
							  escapeHtml={false}
							  style={{
								maxWidth: "100%", minWidth: "100%", 
							  }}
							  rehypePlugins={[rehypeRaw]}
							>
							  {realtimeMarkdown !== undefined && realtimeMarkdown !== null && realtimeMarkdown.length > 0 ? realtimeMarkdown : workflow.form_control.input_markdown}
		    				</Markdown>
						</div> 
					: null}

      				<form onSubmit={(e) => {onSubmit(e)}} style={{margin: "25px 0px 15px 0px",}}>
						{workflow.form_control.input_markdown !== undefined && workflow.form_control.input_markdown !== null && workflow.form_control.input_markdown.length > 0 ? null : 
						<div>
							<img
								alt={workflow.name}
								src={image}
								style={{
									marginRight: 20,
									width: 100,
									height: 100,
									border: `2px solid ${green}`,
									borderRadius: 50,
									position: "absolute",
									top: -50,
									left: 200,
								}}
							/>

							<Typography variant="h6" style={{marginBottom: 10, marginTop: 50, textAlign: "center", }}>
								{organization}
							</Typography>
							<Divider style={{marginTop: 20, marginBottom: 20, }}/>

							{disabledButtons && message.length > 0 ? null : 
								<Typography color="textSecondary" style={{textAlign: "center", }}>
									{message}
								</Typography>
							}

							{answer !== undefined && answer !== null ? null :
								<Typography variant="h6" style={{marginBottom: 15, textAlign: "center", }}><b>{workflow.name}</b></Typography>
							}

							{workflowQuestion.length > 0 ?
								<div style={{
									backgroundColor: theme.palette.inputColor,
									padding: 20,
									borderRadius: theme.palette?.borderRadius,
									marginBottom: 35, 
									marginTop: 30, 
								}}>
									<Typography variant="body1"  style={{ marginRight: 15, textAlign: "center", whiteSpace: "pre-line", }}>
										{workflowQuestion}
									</Typography>
								</div>
							: null}

							</div>
						}
							
						{workflow.input_questions !== undefined && workflow.input_questions !== null && workflow.input_questions.length > 0 ?
							<div style={{marginBottom: 5, }}>
								{workflow.input_questions.map((question, index) => {

									// Multiple choice checks for semicolon-splits
									var multiChoiceOptions = question.value !== undefined && question.value !== null && question.value.length > 0 && question.value.includes(";") ? question.value.split(";") : []
									// Remove empty keys from array
									multiChoiceOptions = multiChoiceOptions.filter(function(e) { return e !== "" })
									if (multiChoiceOptions.length > 1 && (executionArgument[multiChoiceOptions[0]] === undefined || executionArgument[multiChoiceOptions[0]] === null || executionArgument[multiChoiceOptions[0]] === "")) {
										// Set the first item to be default
										executionArgument[multiChoiceOptions[0]] = multiChoiceOptions[1]
									}

									return (
										<div style={{marginBottom: 10}} key={index}>

											{multiChoiceOptions.length > 1 ?
												<div>
													{question.name}
													<Select
														disabled={disabledButtons}
														fullWidth
														required
														label={multiChoiceOptions[0]}
														value={executionArgument[multiChoiceOptions[0]]}
														onChange={(e) => {
															const curQuestion = multiChoiceOptions[0]
															executionArgument[curQuestion] = e.target.value
															setUpdate(Math.random())
														}}
													>

														{multiChoiceOptions.map((option, menuIndex) => {
															if (menuIndex === 0) {
																return null
															}

															return (
																<MenuItem 
																	key={menuIndex}
																	value={option}
																>
																	{option}
																</MenuItem>
															)
														})}
													</Select>
												</div>
												:
												<TextField
													color="primary"
													style={{
														backgroundColor: theme.palette.inputColor, 
														marginTop: 5, 
													}}
													label={question.value.charAt(0).toUpperCase() + question.value.slice(1)}
													required

													disabled={disabledButtons}
													fullWidth={true}
													placeholder=""
													id="emailfield"
													margin="normal"
													variant="outlined"
													onChange={(e) => {
														executionArgument[question.value] = e.target.value
														setExecutionArgument(executionArgument)
														setUpdate(Math.random())
													}}
												/>
											}
										</div>
									)
								})}
							</div>
						: 
						answer !== undefined && answer !== null ? null :
							<span>
								Runtime Argument
								<div style={{marginBottom: 5}}>
									<TextField
										color="primary"
										style={{backgroundColor: theme.palette.inputColor, marginTop: 5, }}
										multiLine
										maxRows={2}
										InputProps={{
											style:{
												height: "50px", 
												color: "white",
												fontSize: "1em",
											},
										}}
										fullWidth={true}
										placeholder=""
										id="emailfield"
										margin="normal"
										variant="outlined"
										onChange={(e) => {
											setExecutionArgument(e.target.value)	
										}}
									/>
								</div>
							</span>
						}

						

						{executionRunning ?
							<span style={{width: 50, height: 50, margin: "auto", alignItems: "center", justifyContent: "center", textAlign: "center", }}>
								<CircularProgress style={{marginTop: 20, marginBottom: 20, marginLeft: 185, }}/>

								{/*executionData.status !== undefined && executionData.status !== null && executionData.status !== "" ?
									<Typography variant="body2" style={{margin: "auto", marginTop: 20, marginBottom: 20, textAlign: "center", alignItem: "center", }} color="textSecondary">
										Status: {executionData.status}
									</Typography>
								: null*/}
							</span>
							:
							((answer !== undefined && answer !== null) || (foundSourcenode !== undefined && foundSourcenode !== null)) ? 
								<span style={{marginTop: 20, }}>

									{disabledButtons && message.length > 0 ?
										<Typography variant="body1"  style={{textAlign: "center", marginTop: 30, marginBottom: 20,  }}>
											{message}. You may close this window.
										</Typography>
									: 
										<Typography variant="body1" style={{textAlign: "center", marginTop: 30, marginBottom: 20, }}>
											{disabledButtons ? "Answered. You may close this window." : ""}
										</Typography>
									}

									{disabledButtons ? null :
										<Typography variant="body2" color="textSecondary" style={{textAlign: "center", marginTop: 10, }}>
											What do you want to do?
										</Typography>
									}
									<div fullWidth style={{width: "100%", marginTop: 10, marginBottom: 10, display: "flex", }}>
										<Button fullWidth id="continue_execution" variant="contained" disabled={disabledButtons} color="primary" style={{flex: 1,}} onClick={() => {
											onSubmit(null, execution_id, authorization, true) 

											setButtonClicked("FINISHED")
											setExecutionData({
												status: "FINISHED",
											})
										}}>Continue</Button>
										<Typography variant="body1" style={{marginLeft: 3, marginRight: 3, marginTop: 3, }}>
											&nbsp;or&nbsp;
										</Typography>
										<Button fullWidth id="abort_execution" variant="contained" color="primary" disabled={disabledButtons} style={{ flex: 1, }} onClick={() => {
											onSubmit(null, execution_id, authorization, false) 

											setButtonClicked("ABORTED")
											setExecutionData({
												status: "ABORTED",
											})
										}}>Stop</Button>
									</div>
								</span>
							:
							<div style={{display: "flex", marginTop: "15px"}}>
								<Button 
									variant={executionData.result !== undefined && executionData.result !== null && executionData.result.length > 0 ? "outlined" : "contained"}
									type="submit" 
									color="primary" 
									fullWidth 
									disabled={!handleValidateForm(executionArgument) || executionLoading}
								>
									{executionLoading ? 
										<CircularProgress color="secondary" style={{color: "white",}} /> 
										: 
										executionData.result !== undefined && executionData.result !== null && executionData.result.length > 0 ? "Run Again" 
											:
											"Submit"
										}
								</Button> 				
							</div>
						}


						{workflow.form_control.output_yields !== undefined && workflow.form_control.output_yields !== null && workflow.form_control.output_yields.length > 0 ?
							<div style={{marginTop: 20, }}>
								{workflow.form_control.output_yields.map((yieldItem, index) => {
									if (executionData.results === undefined || executionData.results === null || executionData.results.length === 0) {
										return null
									}

									const foundresult = executionData.results.find((result) => {
										return result.action.id === yieldItem
									})

									if (foundresult === undefined || foundresult === null) {
										return null
									}

									if (foundresult.status === "SKIPPED") {
										return null
									}

									const validate = validateJson(foundresult.result)
									validResults += 1
									var appendedDetails = foundresult.result
									if (validate.valid) { 
										appendedDetails = <ReactJson
											src={validate.result}
											theme={theme.palette.jsonTheme}
											style={theme.palette.reactJsonStyle}
											collapsed={false}
					    					shouldCollapse={(jsonField) => {
												return collapseField(jsonField)
											}}
											iconStyle={theme.palette.jsonIconStyle}
											collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
											displayArrayKey={false}
											enableClipboard={(copy) => {
											  //handleReactJsonClipboard(copy);
											}}
											displayDataTypes={false}
											onSelect={(select) => {
											  //HandleJsonCopy(validate.result, select, "exec");
											}}
											name={false}
										  />
									}

									return (
										<div style={{marginBottom: 10, }}>
											{foundresult?.action?.label?.replaceAll("_", " ")} - {foundresult.status}:
											<br />

											{appendedDetails}
										</div>
									)
								})}
							</div>
						: null}

						<div style={{marginTop: "10px"}}>
							{executionInfo}
						</div>
	
						{answer !== undefined && answer !== null ? null :
							<ShowExecutionResults executionData={executionData} />
						}

						
					</form>
				</div>
				}
			</Paper>
			<Typography variant="body2" color="textSecondary" align="center" style={{marginTop: 10, }} >
				Forms are in Beta. Form submission data includes your Organization's unique ID while logged in, or a unique identifier for your browser otherwise. Your input will be automatically sanitized.
			</Typography>
		</div>


    // const isCorrectOrg = userdata.active_org.id === undefined || userdata.active_org.id === null || workflow.org_id === null || workflow.org_id === undefined || workflow.org_id.length === 0 || userdata.active_org.id === workflow.org_id 
	const loadedCheck = isLoaded ? 
		<div>
			{editWorkflowModalOpen === true ?
			  <EditWorkflow
				saveWorkflow={saveWorkflow}
				workflow={workflow}
				setWorkflow={setWorkflow}
				modalOpen={editWorkflowModalOpen}
				setModalOpen={setEditWorkflowModalOpen}
				isEditing={true}
				userdata={userdata}
				usecases={undefined}

				expanded={true}
				setRealtimeMarkdown={setRealtimeMarkdown}
				boxWidth={boxWidth}
				setBoxWidth={setBoxWidth}
				scrollTo={"form_fill"}
			  />
			: null}

			<Dialog
			  open={sharingOpen}
			  onClose={() => {
				setSharingOpen(false);
			  }}
			  PaperProps={{
				style: {
				  color: "white",
				  minWidth: isMobile ? "90%" : 500,
				  maxWidth: isMobile ? "90%" : 500,
				  minHeight: 400,
				  maxHeight: 400, 
				  padding: 25, 
				  borderRadius: theme.palette?.borderRadius,
				  //minWidth: isMobile ? "90%" : newWorkflow === true ? 1000 : 550,
				  //maxWidth: isMobile ? "90%" : newWorkflow === true ? 1000 : 550,
				},
			  }}
			>
			  	<DialogTitle style={{padding: 30, paddingLeft: 20, paddingBottom: 0, zIndex: 1000,}}>
					Form Sharing Options for '{workflow.name}'
			  	</DialogTitle>
        		<DialogContent style={{marginTop: 20,}}>
					<Typography variant="body1">
						<b>General Access</b>
					</Typography>

					<Typography variant="body2" color="textSecondary">
						Form sharing and workflow sharing are not the same. By sharing a form, you are enabling anyone with the link to fill out the form AND run the workflow. They will NOT have access to seeing workflow details. By default, anyone with access to an organization can use a form.
					</Typography>

					<div />
					{workflow !== undefined && workflow !== null && workflow.sharing !== undefined && workflow.sharing !== null ?
						<Select
							fullWidth
							style={{marginTop: 25, }}
							value={workflow.sharing === "" ? "private" : workflow.sharing}
							onChange={(e) => {
								console.log("SHARING: ", e.target.value)

								workflow.sharing = e.target.value
								setWorkflow(workflow)
								saveWorkflow(workflow) 
								setUpdate(Math.random())

								toast("Form sharing updated.")
							}}
						>
							<MenuItem 
								value={"private"}
							>
								Organization only
							</MenuItem>
							<Divider />
							<MenuItem 
								value={"form"}
							>
								Anyone with the link
							</MenuItem>
						</Select>
					: null}
				</DialogContent>
			</Dialog>

			{isLoggedIn && userdata?.active_org?.id === workflow?.org_id ?
				<div style={{position: "fixed", top: 10, right: 20, }}>

					<Button
						variant={"outlined"}
						color={"secondary"}
						style={{marginRight: 10, }}
						onClick={() => {
							window.open(`/workflows/${workflow.id}`, "_blank")
						}}
					>
						<OpenInNewIcon style={{marginRight: 5, }}/>
						Workflow	
					</Button>

					<Button
						variant={workflow.sharing === "form" ? "outlined" : "contained"}
						color={"secondary"}
						style={{marginRight: 10, }}
						onClick={() => {
							setSharingOpen(true)
						}}
					>
						{workflow.sharing === "form" ?
							<LockOpenIcon style={{marginRight: 5, }} /> 
							:
							<LockIcon style={{marginRight: 5, }} /> 
						}

						{workflow.sharing === "form" ?
							"Unshare"
							:
							"Share"
						}
					</Button>

					<Button
						variant={"contained"}
						color={"primary"}
						style={{}}
						onClick={() => {
							setEditWorkflowModalOpen(true)
						}}
					>
						<EditIcon style={{marginRight: 5, }} /> Edit Form 
					</Button>
				</div> 
			: null}

      		{basedata}
		</div>
		:
		<div style={{width: 100, itemAlign: "center", textAlign: "center", margin: "auto", }}>
			<CircularProgress />
		</div>

	// Check width
	const overlap = window !== undefined && window.innerWidth !== undefined && window.innerWidth < 1300 

	const formSidebar = explorerUi === true || !isLoaded || overlap || !(forms !== undefined && forms !== null && forms.length > 1) ? null :
		<div style={{
			minWidth: 215, 
			maxWidth: 215,
			overflowX: "hidden",
			overflowY: "auto",
			minHeight: 500,
			maxHeight: 500, 
			position: "absolute", 
			left: 150, 
			top: 0, 
			border: "1px solid rgba(255,255,255,0.3)",
			borderRadius: theme.palette?.borderRadius,

			padding: 25, 

			backgroundColor: theme.palette.inputColor,
			zIndex: 1000, 
		}}>
			{selectedOrganization !== undefined && selectedOrganization !== null ?
				<div style={{display: "flex", marginBottom: 20, }}>
					<img src={selectedOrganization.image} style={{width: 40, height: 40, borderRadius: theme.palette?.borderRadius, }} />
					<Typography variant="body1" style={{marginTop: 7, marginLeft: 10, }}>
						{selectedOrganization.name}
					</Typography>
					<Divider style={{marginTop: 10, marginBottom: 10, }}/>
				</div>
			: null}

			{forms !== undefined && forms !== null && forms.length > 0 ?
				<FormList />
			: 
				<div>
					No forms loaded
				</div>
			}
		</div>


	return (
		<div style={{position: "relative", }}>
			{loadedCheck}
			{formSidebar}
		</div>
	)
}

export default RunWorkflow
