import React, { useState, useEffect } from "react";
import { useInterval } from "react-powerhooks";
import { toast } from 'react-toastify';
import theme from "../theme.jsx";
import WorkflowValidationTimeline from "../components/WorkflowValidationTimeline.jsx"

import {
  InputAdornment,
  Tooltip,
  TextField,
  CircularProgress,
  ButtonGroup,
  Button,
  Avatar,
  ListItemAvatar,
  Typography,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
} from "@mui/material";

import { 
	FavoriteBorder as FavoriteBorderIcon,
	Error as ErrorIcon,
	CheckCircleRounded as CheckCircleRoundedIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
	Check as CheckIcon,
	Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { FixName } from "../views/Apps.jsx";
import aa from 'search-insights'

import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";

// Handles workflow updates on first open to highlight the issues of the workflow
// Variables
// Action (exists, missing fields)
// Action auth
// Triggers
//
// Specifically used for UNSAVED workflows only?
const ConfigureWorkflow = (props) => {
  const {
    apps,
    isCloud,
    workflow,
	userdata,
    globalUrl,
    newWebhook,
    referenceUrl,
    saveWorkflow,
	showTriggers,
    submitSchedule,
    setSelectedApp,
    selectedAction,
    appAuthentication,
    setSelectedAction,
	workflowExecutions,
	getWorkflowExecution,
    setAuthenticationType,
    setAuthenticationModalOpen,
    setConfigureWorkflowModalOpen,

	setConfigurationFinished,
  } = props;

  const [requiredActions, setRequiredActions] = React.useState([]);
  const [requiredVariables, setRequiredVariables] = React.useState([]);
  const [requiredTriggers, setRequiredTriggers] = React.useState([]);
  const [previousAuth, setPreviousAuth] = React.useState(appAuthentication);
  const [itemChanged, setItemChanged] = React.useState(false);
  const [firstLoad, setFirstLoad] = React.useState("");
  const [showFinalizeAnimation, setShowFinalizeAnimation] = React.useState(false);
  const [loopRunning, setLoopRunning] = useState(false)
  const [checkStarted, setCheckStarted] = React.useState(false);

  useEffect(() => { 
	  if (requiredActions.length === 0) { 
		  if (setConfigurationFinished !== undefined) {
		      setConfigurationFinished(true)
		  }
	  }
  }, [requiredActions])

  const stop = () => {
	  setLoopRunning(false)
  }

  const start = () => {
	  setLoopRunning(true)
  }


  useEffect(() => {
	  if (loopRunning) {
		  const intervalId = setInterval(() => {
			  if (!loopRunning) {
        		clearInterval(intervalId);
      		  }


			  if (getWorkflowExecution !== undefined && workflowExecutions !== undefined) {
			  	const paramkey = workflow.id
			  	getWorkflowExecution(paramkey)
			  } else {
			  	console.log("Executions or getWorkflowExecutions not defined")
			  }
		  }, 3000)

		  return () => clearInterval(intervalId);
	  }
  }, [loopRunning])

	/*
	const { start, stop } = useInterval({
		duration: 3000,
		startImmediate: false,
		callback: () => {
			if (getWorkflowExecution !== undefined && workflowExecutions !== undefined) {
				const paramkey = workflow.id
				getWorkflowExecution(paramkey)
			} else {
				console.log("Executions or getWorkflowExecutions not defined")
			}
		},
	});
	*/

	// ONLY when component is being unloaded, run stop() function
	// This is to prevent the interval from running when the component is not being used
	
	/*
	useEffect(() => {
		return () => {
			stop()
		}
	}, [])
	*/

	// Where is this from?
  if (workflow === undefined || workflow === null || workflow.id === undefined) {
	//console.log("Workflow is undefined or null: ", workflow)
    return null
  }

  if (apps === undefined || apps === null) {
	  //console.log("Apps is undefined or null: ", apps)
      return null
  }

  if (appAuthentication === undefined || appAuthentication === null) {
	  //console.log("App authentication is undefined or null: ", appAuthentication)
      return null
  }

  const getApp = (actionId, appId) => {
    fetch(globalUrl + "/api/v1/apps/" + appId + "/config?openapi=false", {
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          //toast("Successfully GOT app "+appId)
        } else {
          toast("Failed getting app");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (
          responseJson.actions !== undefined &&
          responseJson.actions !== null
        ) {
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  if (firstLoad.length === 0 || firstLoad !== workflow.id) {
    if (apps === undefined || apps === null || apps.length === 0) {
      console.log("No apps loaded: ", apps);

	  if (setConfigureWorkflowModalOpen !== undefined) {
      	setConfigureWorkflowModalOpen(false)
	  }

      return null;
    }

    setFirstLoad(workflow.id)

    const newactions = [];
    for (let [key, keyval] in Object.entries(workflow.actions)) {

      var action = JSON.parse(JSON.stringify(workflow.actions[key]))
      var newaction = {
        large_image: action.large_image,
        app_name: action.app_name,
        app_version: action.app_version,
        activation_done: false,
        must_activate: false,
        must_authenticate: false,
        auth_done: false,
        action_ids: [],
        action: action,
		update_version: action.app_version,
        app: {},
		steps: [],
		show_steps: false,
      }

	  if (action.app_name.toLowerCase().endsWith("_api")) {
		  action.app_name = action.app_name.slice(0, -4)
	  }

	  if (action.app_name === "Integration Framework") {
		  var selected_app = ""
		  for (var paramkey in action.parameters) {
			  const param = action.parameters[paramkey]

			  if (param.name === "app_name") {
				  selected_app = param.value
				  break
			  }
		  }

		  for (var appauth in appAuthentication) {
			  if (appAuthentication[appauth].app.name.toLowerCase() === selected_app.toLowerCase()) {
				  newaction.auth_done = true
				  break
			  }
		  }

		  if (newaction.auth_done) {
			  continue
		  }

		  for (var appkey in apps) {
			  if (apps[appkey].name.toLowerCase() === selected_app.toLowerCase()) {
				  newaction.app_name = apps[appkey].name
				  newaction.app_version = apps[appkey].app_version
				  newaction.app = apps[appkey]
				  newaction.app_id = apps[appkey].id

				  newaction.must_activate = false 
				  newaction.must_authenticate = true

				  newaction.steps.push({
					"title": "Authenticate app",
					"type": "authenticate",
					"required": true,
				  })

		  		  action.app_id = apps[appkey].id
				  action.authentication_id = ""
				  action.authentication = {
					  "required": true,
				  }

				  break
			  }
		  }

		  if (newaction.app.id === undefined) {
			  console.log("Failed to find app: ", selected_app)
			  continue
		  }

		  newaction.update_version = "1.1.0"
	  }

	  // ID match OR name match + version match 
      //const app = apps.find((app) => app.id === action.app_id || (app.name === action.app_name && (app.app_version === action.app_version || (app.loop_versions !== null && app.loop_versions.includes(action.app_version)))))

	  // without version match
	  const newappname = action.app_name.toLowerCase().replaceAll(" ", "_")
      var app = apps.find((app) => app.id === action.app_id || app.name.toLowerCase().replaceAll(" ", "_") === newappname)

      if (app === undefined || app === null) {

      	const subapp = apps.find(app => app.name === action.app_name)
		if (subapp !== undefined && subapp !== null) {
			newaction.update_version = "1.1.0"
		}

        newaction.must_activate = true;
		newaction.steps.push({
			"title": "Activate app",
			"type": "activate",
			"required": true,
		})
      } else {
        if (action.authentication_id !== "" && app.authentication.required === true) {
			var authFound = false
			for (var authkey in appAuthentication) {
				if (appAuthentication[authkey].id === action.authentication_id) {
					authFound = true
					break
				}
			}

			if (!authFound) {
				action.authentication_id = ""
			}
		}

        if (action?.authentication_id === "" && app?.authentication?.required === true && action.parameters !== undefined && action.parameters !== null) {
		  // Check if configuration is filled or not
          var filled = true;
          for (let [key,keyval] in Object.entries(action.parameters)) {
            if (action.parameters[key].configuration) {
              if (action.parameters[key].value === null || action.parameters[key].value.length === 0) {
                filled = false;
                break;
              }
            }
          }

		  if (app.authentication.type === "oauth2" || app.authentication.type === "oauth2-app") {
			  filled = false
			
			  action.auth_type = "oauth2"
		  }

		  newaction.steps.push({
		  	"title": "Authenticate app",
		  	"type": "authenticate",
		  	"required": true,
			"auth_type": app.authentication.type,
		  })

          if (!filled) {
            newaction.must_authenticate = true;
            newaction.action_ids.push(action.id);
          }

        } else if (action.authentication_id !== undefined && action.authentication_id !== null && action.authentication_id !== "" && app.authentication.required === true) {
			console.log("FIXME: Should verify authentication ID ", action.authentication_id)
		}

        newaction.app = app;
      }


      if (newaction.errors !== undefined && newaction.errors !== null && newaction.errors.length > 0) {
        //console.log("Node has errors!: ", action.errors)
      }

	  //console.log(newaction.app_name,"AUTH: ", newaction.must_authenticate, " ACTIVATE: ", newaction.must_activate)
		  
      if (newaction.must_authenticate) {

        var authenticationOptions = []
        for (let [key,keyval] in Object.entries(appAuthentication)) {
          const auth = appAuthentication[key]

          if (auth.app.name === app.name && auth.active) {
            //console.log("Found auth: ", auth)
            authenticationOptions.push(auth);
            newaction.authenticationId = auth.id;
            break;
          }
        }

        if (
          newaction.authenticationId === null ||
          newaction.authenticationId === undefined ||
          newaction.authenticationId.length === ""
        ) {
          //console.log("FAILED to authenticate node!")

          if (
            newactions.find(
              (tmpaction) =>
                tmpaction.app_id === newaction.app_id &&
                tmpaction.app_name === newaction.app_name
            ) !== undefined
          ) {
            //console.log("Action already found.");
          } else {
            newactions.push(newaction);
          }
        } else {
          //console.log("Skipping node as it's already authenticated.")
          newaction.authentication = authenticationOptions;
          workflow.actions[key] = newaction;
        }
      } else if (newaction.must_activate) {
        if (
          newactions.find(
            (tmpaction) =>
              tmpaction.app_id === newaction.app_id &&
              tmpaction.app_name === newaction.app_name
          ) !== undefined
        ) {
          console.log("Action already found.");
        } else {
          newactions.push(newaction);
        }
      }
    }

	if (workflow.workflow_variables !== undefined && workflow.workflow_variables !== null && workflow.workflow_variables.length !== 0) {
		for (let [key,keyval] in Object.entries(workflow.workflow_variables)) {
		  const variable = workflow.workflow_variables[key];

		  if (variable.value === undefined || variable.value === undefined || variable.value.length === 0) {
			variable.value = "";
			requiredVariables.push(variable);
		  }

		  variable.index = key;
		}
	}

	if (workflow.triggers !== undefined && workflow.triggers !== null && workflow.triggers.length !== 0) {
		for (let [key,keyval] in Object.entries(workflow.triggers)) {
		  var trigger = workflow.triggers[key];
		  trigger.index = key;

		  if (trigger.trigger_type === "WEBHOOK") {

		  	if (trigger.app_association !== undefined && trigger.app_association.name !== null && trigger.app_association.name !== "") {
		  		const findapp = trigger.app_association.name.toLowerCase()
		  		const foundindex = newactions.findIndex(action => action.app_name.toLowerCase() === findapp)

		  		// Adding webhook to start of it
		  		if (foundindex >= 0) {
		  			const tmpsteps = newactions[foundindex].steps
		  			newactions[foundindex].steps = [
		  				{
		  					"title": "Configure Webhook",
		  					"type": "webhook",
		  					"required": true,
		  				}
		  			]

		  			for (let [subkey,subkeyval] in Object.entries(tmpsteps)) {
		  				newactions[foundindex].steps.push(tmpsteps[subkey])
		  			}
		  	
		  			newactions[foundindex].show_steps = true

		  			continue
		  		}
		  	}
		  }

			  if (trigger.status === "running") {
				continue;
			  }

			  if (
				trigger.trigger_type === "SUBFLOW" ||
				trigger.trigger_type === "USERINPUT"
			  ) {
				continue;
			  }

			  requiredTriggers.push(trigger)
			}
		}

		if (setConfigureWorkflowModalOpen !== undefined && requiredTriggers.length === 0 && requiredVariables.length === 0 && newactions.length === 0 ) {
		  console.log("No required triggers, variables or actions. Closing modal.")
		  setConfigureWorkflowModalOpen(false)
		}

		//setRequiredTriggers(requiredTriggers)
		setRequiredVariables(requiredVariables)
		setRequiredActions(newactions)
	}

    if (appAuthentication !== undefined && previousAuth !== undefined && appAuthentication.length !== previousAuth.length) {
      var newactions = []
      for (let [actionkey, actionkeyval] in Object.entries(requiredActions)) {
        var newaction = requiredActions[actionkey];
        const app = newaction.app;

        for (let [key,keyval] in Object.entries(appAuthentication)) {
          const auth = appAuthentication[key];

      			// Does this account for all the different ones of the same? 
          if (auth.app.name === app.name && auth.active === true) {
            newaction.auth_done = true;
            break;
          }
        }

        newactions.push(newaction);
      }

      setRequiredActions(newactions);
      setPreviousAuth(appAuthentication);
      // Set auth done to true
      //"auth_done": false
  }

  const TriggerSection = (props) => {
    const { trigger } = props

    return (
      <ListItem style={{padding: 0, }}>
        <ListItemAvatar>
          <Avatar variant="rounded">
            <img
              alt={trigger.label}
              src={trigger.large_image}
              style={{ width: 50 }}
            />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={trigger.name}
          secondary={trigger.description}
          style={{}}
        />
        {trigger.trigger_type === "WEBHOOK" && trigger.status !== "running" ? (
          <Button
            disabled={trigger.status === "running"}
            color="primary"
            variant="contained"
            onClick={() => {
              workflow.triggers[trigger.index].status = "running";
              if (workflow.triggers[trigger.index].parameters === null) {
                workflow.triggers[trigger.index].parameters = [
                  {
                    name: "url",
                    value: referenceUrl + "webhook_" + trigger.id,
                  },
                  { name: "tmp", value: "webhook_" + trigger.id },
                ];
              }

              newWebhook(workflow.triggers[trigger.index]);
              saveWorkflow(workflow);
              setItemChanged(true);
            }}
          >
            {trigger.status !== "running" ? "Start" : "Running"}
          </Button>
        ) : trigger.trigger_type === "SCHEDULE" &&
          trigger.status !== "running" ? (
          <Button
            disabled={trigger.status === "running"}
            color="primary"
            variant="contained"
            onClick={() => {
              workflow.triggers[trigger.index].status = "running";
              if (workflow.triggers[trigger.index].parameters === null) {
                workflow.triggers[trigger.index].parameters = [
                  { name: "cron", value: isCloud ? "*/15 * * * *" : "120" },
                  {
                    name: "execution_argument",
                    value: '{"example": {"json": "is cool"}}',
                  },
                ];
              }

              submitSchedule(workflow.triggers[trigger.index], trigger.index);
              saveWorkflow(workflow);
              setItemChanged(true);
            }}
          >
            {trigger.status !== "running" ? "Start" : "Running"}
          </Button>
        ) : null}
      </ListItem>
    );
  };

  const VariableSection = (props) => {
    const { variable } = props;

    //<Typography variant="body2">Name: {variable.name} - {variable.value}. </Typography>
    return (
      <ListItem style={{padding: 0, }}>
        <ListItemAvatar>
          <Avatar>
            <FavoriteBorderIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={variable.name}
          secondary={variable.description}
          style={{}}
        />
        <ListItemText
          primary={
            <TextField
              style={{
                backgroundColor: theme.palette.inputColor,
                borderRadius: theme.palette?.borderRadius,
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end"></InputAdornment>,
              }}
              fullWidth
              color="primary"
              type={"text"}
              placeholder={`New value for ${variable.name}`}
              onChange={(event) => {
                console.log(
                  "NEW VALUE ON INDEX",
                  variable.index,
                  variable.value
                );
              }}
              onBlur={(event) => {
                workflow.workflow_variables[variable.index].value =
                  event.target.value;
              }}
            />
          }
          style={{}}
        />
      </ListItem>
    );
  };

  const activateApp = (app_id, app_name, app_version) => {

		if (aa !== undefined) {
			aa('init', {
					appId: "JNSS5CFDZZ",
					apiKey: "db08e40265e2941b9a7d8f644b6e5240",
			})

			const timestamp = new Date().getTime()
			aa('sendEvents', [
				{
					eventType: 'conversion',
					eventName: 'Public App Activated',
					index: 'appsearch',
					objectIDs: [app_id],
					timestamp: timestamp,
					userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
				}
			])
		}

    fetch(
      `${globalUrl}/api/v1/apps/${app_id}/activate?app_name=${app_name}&app_version=${app_version}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status !== 200) {
          //window.location.pathname = "/search"
          //toast("Failed to find this app. Is it public?")
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === false) {
        	if (responseJson.reason !== undefined) {
				toast("Failed to activate the app: "+responseJson.reason);
			} else {
				toast("Failed to activate the app");
			}
        } else {
          toast("App activated for your organization!");
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };


  const AppSectionSelfcontained = (props) => {
    const { action } = props;

	const [opened, setOpened] = useState(false);
    const [filled, setFilled] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [finalized, setFinalized] = useState(false);

	const [authFields, setAuthFields] = useState([])
	const [sensitiveFields, setSensitiveFields] = useState([])

	//console.log("ACTION", action)
									
	useEffect(() => {
		if (finalized === true) {
			setOpened(false)
			setFilled(true)
		}
	}, [finalized])

	if (authFields.length === 0 && opened === true) {
		// Loop through fields of the action
			  

		var newfields = []

		var index = 0
		var sensitiveIndexes = []
		const params = action.action.parameters
		for (let key in params) {
			const param = params[key]

			if (param.configuration === true) {
				if (param.name.toLowerCase().includes("key") || param.name.toLowerCase().includes("token") || param.name.toLowerCase().includes("password")) {
					sensitiveIndexes.push(index)
				}

				newfields.push({
					"key": param.name,
					"example": param.example === undefined ? "" : param.example,
					"value": param.name === "url" ? param.example : "",
				})

				index += 1
			}
		}

		if (newfields.length > 0) {
			setSensitiveFields(sensitiveIndexes)
			setAuthFields(newfields)
		}
	}


	  const submitLocalAuth = (app, fields) => {
		const appAuthData = {
			active: true,
			app: app,
			fields: fields,
			label: "Authentication for " + app.name,
			usage: [{"workflow_id": workflow.id}],
			auto_distribute: true,
		}


		fetch(globalUrl + "/api/v1/apps/authentication", {
		  method: "PUT",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  body: JSON.stringify(appAuthData),
		  credentials: "include",
		})
		  .then((response) => {
			if (response.status !== 200) {
			  console.log("Status not 200 for setting app auth :O!");
			}
    		
		    setSubmitted(false)

			return response.json();
		  })
		  .then((responseJson) => {
			if (!responseJson.success) {
			  toast("Failed to set app authentication: " + responseJson.reason);
			} else {
			  toast("App authentication set for app " + app.name.replace("_", " "));
			  setFinalized(true)
			  setOpened(false)
			}
		  })
		  .catch((error) => {
		    setSubmitted(false)
			//toast(error.toString());
			console.log("New auth error: ", error.toString());
		  });
	  }

	var parsedName = action.app_name.replaceAll("_", " ");
	if (action.app_name.toLowerCase().endsWith("_api")) {
		parsedName = parsedName.substring(0, parsedName.length - 4);
	}

	// Remove _basic at the end if it exists
	if (parsedName.toLowerCase().endsWith("_basic")) {
		parsedName = parsedName.substring(0, parsedName.length - 6);
	}

	parsedName = (parsedName.charAt(0).toUpperCase() + parsedName.slice(1)).replaceAll("_", " ");
	return (
		<ListItem 
			style={{padding: 0, display: "flex", flexDirection: "column", }}
		>
			<div 
				style={{
					border: filled ? `1px solid ${theme.palette.green}` : "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette?.borderRadius, width: "100%", padding: 12, cursor: "pointer", 
				}}
				id="app-config"
			>
				<div style={{display: "flex", }}
					onClick={() => {
						setOpened(!opened);

						// Scroll to it
						const element = document.getElementById("app-config");
						if (element) {
							// Scroll down 100px 
							setTimeout(() => {
								element.scrollIntoView({
									behavior: "smooth",
									top: 100,
								})

								//element.scrollIntoView({ 
								//	behavior: "smooth", 
								//	block: "center", 
								//	inline: "center" 
								//});
							}, 250)
						}

					}}
				>
					<div style={{display: "flex", flex: 7, }}>
						<span style={{marginTop: 10, marginRight: 10, }}>
							{!opened ? <ExpandMoreIcon /> : <ExpandLessIcon />}
						</span>
						<img
							alt={parsedName}
							style={{ margin: 4, minHeight: 40, maxHeight: 40, borderRadius: 30, }}
							src={action.large_image}
						/>
						<Typography style={{ marginLeft: 10, marginTop: 10, }} variant="body1">
							<b>{finalized ? "Authenticated" : `Configure ${parsedName}`}</b>
						</Typography>
					</div>
					{filled ?
						<CheckIcon style={{color: theme.palette.green, marginLeft: 10, marginTop: 10, flex: 1, }} />
						: null}
				</div>

				{opened ?
					<div style={{padding: 12, }}>
	
						{action.app.authentication.type === "oauth2-app" || action.app.authentication.type === "oauth2" || action.auth_type === "oauth2" ?
							<div>
								<AuthenticationOauth2
									selectedApp={action.app}
									selectedAction={{
										"app_name": action.app.name,
										"app_id": action.app.id,
										"app_version": action.app.version,
										"large_image": action.app.large_image,
									}}
									authenticationType={action.app.authentication}
									isCloud={isCloud}
									authButtonOnly={true}

									isLoggedIn={true}
									getAppAuthentication={undefined}

									setFinalized={setFinalized}
								/>
							</div>
							: 
						authFields.map((field, index) => {
							console.log("THESE FIELDS?: ", field)

							var parsedName = field.key
							// Remove _basic at the end if it exists
							if (parsedName.toLowerCase().endsWith("_basic")) {
								parsedName = parsedName.substring(0, parsedName.length - 6);
							}

							parsedName = (parsedName.charAt(0).toUpperCase() + parsedName.slice(1)).replaceAll("_", " ");

							return (
								<div key={index} style={{marginBottom: 15, marginLeft: 10, marginRight: 10, }}>
									<Typography style={{ }} variant="body1">
										{parsedName}
									</Typography>
									<TextField
										style={{
											backgroundColor: theme.palette.inputColor,
										}}
										defaultValue={field.value}
										onChange={(event) => {
											event.preventDefault();
											authFields[index].value = event.target.value;
											setAuthFields(authFields);

											var allFilled = true;
											authFields.forEach((field) => {
												if (field.value.length === 0) {
													allFilled = false;
												} else {
													//console.log("Field is not filled: "+field.key)
												}
											})

											if (allFilled) {
												console.log("Should test the fields, and submit them")
												setFilled(true);
											} else {
												if (filled) {
													setFilled(false);
												}
											}
										}}

										endAdornment={
											// Show item that can show field value if password
											//field.name.toLowerCase().includes("key") || field.name.toLowerCase().includes("token") || field.name.toLowerCase().includes("password") ?
											field.key.toLowerCase().includes("key") || field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("password") ?
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={() => {
															setSensitiveFields(sensitiveFields.filter((item) => item !== index))
														}}
														onMouseDown={(event) => {
															event.preventDefault();
														}}
													>	
														<VisibilityIcon />
													</IconButton>
												</InputAdornment>
											: null
										}
										fullWidth
										color="primary"
										type={sensitiveFields.includes(index) ? "password" : "text"}
										placeholder={field.example ? field.example : `Enter your ${field.key}`}
										data-lpignore="true"
										dataLPIgnore="true"
										autocomplete="off"
									/>
								</div>
							)
						})}

						{action.app.authentication.type !== "oauth2-app" && action.app.authentication.type !== "oauth2" ?  
							<Button
								variant="contained"
								color="primary"
								style={{
									marginTop: 15,
									width: 150,
									marginLeft: 135, 
								}}
								disabled={!filled || submitted}
								onClick={() => {
									setSubmitted(true);

									// const submitLocalAuth = (app, fields) => {
									submitLocalAuth({"id": action.app.id, "name": action.app.name, "version": action.app.version, "large_image": action.large_image, }, authFields);
										
								}}
							>
								{submitted ? <CircularProgress style={{color: theme.palette.primary.main, }} /> : "Submit"}
							</Button>
						: null}
					</div>
				: null}
			</div>
		</ListItem>
	)
  }

  const AppSection = (props) => {
    const { action } = props;

    var parsedName = action.app_name.replaceAll("_", " ");
    if (action.app_name.toLowerCase().endsWith("_api")) {
		parsedName = parsedName.substring(0, parsedName.length - 4);
	}


    return (
      <ListItem>
        {action.must_authenticate ? 
			<Button
			  fullWidth
			  variant="contained"
			  disabled={action.auth_done}
			  style={{
				flex: 1,
				textTransform: "none",
				textAlign: "left",
				justifyContent: "flex-start",
				backgroundColor: action.auth_done ? theme.palette.surfaceColor : theme.palette.inputColor,
				color: action.auth_done ? "#686a6c" : "#ffffff",
				borderRadius: theme.palette?.borderRadius,
				minWidth: 350, 
				maxHeight: 50,
				overflow: "hidden",
				border: `1px solid ${theme.palette.inputColor}`,
			  }}
			  color="primary"
			  onClick={() => {
				  if (setAuthenticationType !== undefined) {
					  setAuthenticationType(action.app.authentication.type === "oauth2" && action.app.authentication.redirect_uri !== undefined && action.app.authentication.redirect_uri !== null
							? 
							{
								type: "oauth2",
								redirect_uri: action.app.authentication.redirect_uri,
								token_uri: action.app.authentication.token_uri,
								scope: action.app.authentication.scope,
							}
							: 
							{
								type: "",
							}
					  )
					}

					setItemChanged(true);
					if (setSelectedAction !== undefined) {
						setSelectedAction(action.action);
					}

					if (setSelectedApp !== undefined) {
						setSelectedApp(action.app);
					}

					if (setAuthenticationModalOpen !== undefined) {
						setAuthenticationModalOpen(true);
					}
			  }}
		>
			<img
				alt={action.app_name}
				style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette?.borderRadius, }}
				src={action.large_image}
			/>
			<Typography style={{ margin: 0, marginLeft: 10 }} variant="body1">
				{action.auth_done ? "Authenticated" : `Authenticate ${action.app_name.replaceAll("_", " ")}`}
			</Typography>
		</Button>
         : null}
				{action.update_version !== action.app_version ? 
          			<Button
						fullWidth
						variant="contained"
						disabled={action.auth_done}
						style={{
							flex: 1,
							textTransform: "none",
							textAlign: "left",
							justifyContent: "flex-start",
							backgroundColor: action.auth_done ? theme.palette.surfaceColor : theme.palette.inputColor,
							color: action.auth_done ? "#686a6c" : "#ffffff",
							borderRadius: theme.palette?.borderRadius,
							minWidth: 350, 
							maxHeight: 50,
							overflow: "hidden",
							border: `1px solid ${theme.palette.inputColor}`,
						}}
						color="primary"
						onClick={(event) => {
							event.preventDefault()
							console.log("Set version to: ", action.update_version)

							if (workflow.actions !== null) {
								//console.log(workflow.actions)
								toast("Setting action to version "+action.update_version)
								for (let [key,keyval] in Object.entries(workflow.actions)) {
									if (workflow.actions[key].app_name === action.app_name && workflow.actions[key].app_version === action.app_version) {
										workflow.actions[key].app_version = action.update_version

										if (!itemChanged) {
											setItemChanged(true)
										}
									}
								}

								action.must_activate = false
								action.update_version = action.app_version
							}
            }}
          >
						<img
							alt={action.app_name}
							style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette?.borderRadius, }}
							src={action.large_image}
						/>
						<Typography style={{ margin: 0, marginLeft: 10 }} variant="body1">
							Update to version {action.update_version}
						</Typography>
          </Button>
					: 
					action.must_activate ? 
						<Button
							fullWidth
							variant="contained"
							disabled={action.auth_done}
							style={{
								flex: 1,
								textTransform: "none",
								textAlign: "left",
								justifyContent: "flex-start",
								backgroundColor: action.auth_done ? theme.palette.surfaceColor : theme.palette.inputColor,
								color: action.auth_done ? "#686a6c" : "#ffffff",
								borderRadius: theme.palette?.borderRadius,
								minWidth: 350, 
								maxHeight: 50,
								overflow: "hidden",
								border: `1px solid ${theme.palette.inputColor}`,
							}}
							color="primary"
							onClick={() => {
								console.log("ACTION: ", action)
								activateApp(action.action.app_id, action.app_name, action.app_version);
								setItemChanged(true);
							}}
					>
						<img
							alt={action.app_name}
							style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette?.borderRadius, }}
							src={action.large_image}
						/>
						<Typography style={{ margin: 0, marginLeft: 10 }} variant="body1">
							Activate {action.app_name.replaceAll("_", " ")}
						</Typography>
					</Button>
				: 
				null
        }
      </ListItem>
    );
  }
									
	// Based on the color here. Default: #f86a3e
	//backgroundColor: selectedUsecaseCategory === usecase.name ? usecase.color : theme.palette.surfaceColor,

	const BoxHighlight = (props) => {
		const {data, appname, appinfo, index, activeStep, setActiveStep, filled, } = props

		const [hovered, setHovered] = useState(false)
		const [isOpen, setIsOpen] = useState(false)
		const [isLoading, setIsLoading] = useState(false)

		// This kind of just works for new workflows..
		// What if we try many times?	
		var webhook = {
			"name": "Testhook",
			"description": `A Webhook Trigger has been started and is ready to receive events from ${appname}. Click to copy the URL to send events to.`,
			"url": "",
		}

		useEffect(() => {
			if (data.type === "webhook" && !filled) {
				if (!checkStarted) {
					setCheckStarted(true)
  					start()
				}
			}
		}, [])

		// Load webhook docs from the app itself (Wazuh)
		// Add a "sample" for what the event is supposed to look like
		// Have a listener for when ACTUALLY is received 
		// INJECT the URL into the documentation when loading it in
		// How can we load it in? Should we just use the app name & get docs -> parse?
		if (data.type === "webhook" && workflow.triggers !== undefined && workflow.triggers !== null) {
			//console.log("Find webhook in the workflow!")
			for (var key in workflow.triggers) {
				if (workflow.triggers[key].trigger_type !== "WEBHOOK") {
					continue
				}

				for (var subkey in workflow.triggers[key].parameters) {
					const param = workflow.triggers[key].parameters[subkey]
					if (param.name === "url") {
						webhook.url = param.value

						if (isLoading === false) {
							setIsLoading(true)
						}
						break
					}
				}
			}
		} else if (data.type == "authenticate") {
			//console.log("Handle app authentication in the workflow!")
		}
	
		return (
			<div style={{backgroundColor: hovered ? theme.palette.inputColor : "inherit", padding: "10px 15px 10px 15px", borderTop: "1px solid rgba(255,255,255,0.15)",}} 
				onClick={() => {
					setIsOpen(!isOpen)
					setActiveStep(index)
				}}
				onMouseOver={() => {
					setHovered(true);
				}}
				onMouseOut={() => {
					setHovered(false);
				}}
			>

				<div style={{display: "flex"}}>
					<Typography variant="h6" style={{flex: 10, }}>{data.title}</Typography>
					{filled ?
						<CheckCircleRoundedIcon style={{color: "#0f9d58", flex: 1, }} />
						:
						<ErrorIcon style={{color: "#ffd300", flex: 1, }} />
					}
				</div>

				{activeStep === index ? 
					<div>
						{data.type === "webhook" ?
							<div onClick={(event) => {
								event.preventDefault()
								console.log("Clicked Webhook")

								var copyText = document.getElementById("copy_element_shuffle")
								if (copyText !== undefined && copyText !== null) {
									console.log("NAVIGATOR: ", navigator);
									const clipboard = navigator.clipboard;
									if (clipboard === undefined) {
										toast("Can only copy over HTTPS (port 3443)");
										return;
									}

									navigator.clipboard.writeText(webhook.url);
									copyText.select();
									copyText.setSelectionRange(
										0,
										99999
									); /* For mobile devices */

									/* Copy the text inside the text field */
									document.execCommand("copy");
									toast("Copied Webhook URL");
								}
							}}>
								<Typography variant="body2" color="textSecondary">{webhook.description}</Typography>
								{/*<Typography variant="body2" color="textSecondary">{webhook.url}</Typography>*/}
								{isLoading && filled === false ? 
									<div style={{margin: "auto", width: 60, height: 60, marginTop: 5, }}>
										<CircularProgress  /> 
									</div>
									: 
									null
								}
							</div>
						: 
							setConfigureWorkflowModalOpen !== undefined ?
								<AppSection key={index} action={appinfo} />
								:
  								<AppSectionSelfcontained key={index} action={appinfo} />
						}
					</div>
				: null}

			</div>
		)
	}

	const AppWrapper = (props) => {
		const {data, parentindex} = props
		const [clicked, setClicked] = useState(true)
		const [hovered, setHovered] = useState(false)
		const [activeStep, setActiveStep] = useState(0)
		const [firstRun, setFirstRun] = useState(true)
		const [finishCount, setFinishCount] = useState(0)

		return (
			<div style={{backgroundColor: hovered ? theme.palette.inputColor : "inherit", border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette?.borderRadius, cursor: "pointer", }} 
			>
				<div style={{display: "flex", marginLeft: 15, marginTop: 15, marginBottom: 15, }} 
					onClick={() => {
						//setClicked(!clicked)
					}}
					onMouseOver={() => {
						setHovered(true);
					}}
					onMouseOut={() => {
						setHovered(false);
					}}
				>
					<Avatar variant="rounded" style={{}}>
						<img
							alt={data.label}
							src={data.large_image}
							style={{ width: 50, }}
						/>
					</Avatar>
					<Typography variant="h6" style={{marginLeft: 15, }}>
						Configure {data.app_name.replaceAll("_", " ")}
					</Typography>
				</div>
				{clicked === true ? 
					data.steps.map((step, index) => {
						var filled = false
						if (step.type === "activate") {
							if (data.activation_done === true) {
								filled = true

								if (index === activeStep && firstRun === true) {
									setActiveStep(activeStep+1)
								}
						
								if (firstRun) {
									setFinishCount(finishCount+1)
								}
							}
						}

						if (step.type === "authenticate") {
							if (data.must_authenticate === true ) {
								filled = false
							} else {
								if (data.activation_done === true && data.auth_done === true) {
									filled = true 

									if (firstRun) {
										setFinishCount(finishCount+1)
									}

									if (index === activeStep && firstRun === true) {
										setActiveStep(activeStep+1)
									}
								}
							}
						}

						if (step.type === "webhook") {
							for (var key in workflowExecutions) {
								const exec = workflowExecutions[key]
								if (exec.execution_argument !== undefined && exec.execution_argument !== null && exec.execution_argument.length > 0 && exec.execution_source === "webhook") {
									//console.log("Done: ", exec)

									filled = true
									if (index === activeStep && firstRun === true) {
										setActiveStep(activeStep+1)
									
									}

									if (firstRun) {
										setFinishCount(finishCount+1)
									}

									// Finished + source = webhook

									stop()
									//if (isLoading === true) {
									//	setIsLoading(false)
									//}
									

									break
								}
							}
						}

						if (firstRun === true && index === data.steps.length-1) {
							setFirstRun(false)
						}

						return (
							<BoxHighlight appinfo={data} appname={"Wazuh"} key={index} data={step} index={index} activeStep={activeStep} setActiveStep={setActiveStep} filled={filled} />
						)
					})
				: null}
			</div>
		)
	}

  return (
    <div>
		<div style={{margin: setConfigureWorkflowModalOpen !== undefined ? "0px 50px 0px 50px" : "35px 0px 0px 0px", maxHeight: 475, }}>
			

	  	{setConfigureWorkflowModalOpen !== undefined ? 
      		<Typography variant="h6">
				{workflow.name}
			</Typography>
			: null
		}

	    <div style={{marginTop: 10, }} />

	  	{/*
	    <WorkflowValidationTimeline 
			workflow={workflow}

			apps={apps}

			getParents={undefined}
			execution={undefined}
		  />
	    <div style={{marginBottom: 10, }} />
		*/}

      	{requiredActions.length > 0 ? (
      	  <span>
			<Typography variant="body2" color="textSecondary">
			  Please configure the following steps to help us complete your workflow. This can also be done later.
			</Typography>

			{setConfigureWorkflowModalOpen !== undefined ?
				<Typography variant="body1" style={{ marginTop: 10, }}>
				  Required Actions
				</Typography>
			: null}

      	    <List style={{paddingBottom: window.location.pathname.includes("/workflows/") ? 0 : 350, }}>
      	      {requiredActions.map((data, index) => {

				// AppWrapper = Default in a workflow, only shows with steps
				// AppSection = 
				// AppSectionSelfcontained = default for template generator

      	        return (
					<div key={index} style={{marginBottom: 10, }}>
						{data.steps !== undefined && data.steps !== null && data.show_steps === true && setConfigureWorkflowModalOpen !== undefined ?
							<AppWrapper data={data} parentindex={index} />
						: 
							setConfigureWorkflowModalOpen !== undefined ?
								<AppSection key={index} action={data} />
								:
  								<AppSectionSelfcontained key={index} action={data} />
						}
					</div>
				)
      	      })}
      	    </List>
      	  </span>
      	) : null}

      	{setConfigureWorkflowModalOpen !== undefined && requiredVariables.length > 0 ? (
      	  <span>
      	    <Typography variant="body1" style={{ marginTop: 10 }}>
      	      Variables
      	    </Typography>
      	    <List>
      	      {requiredVariables.map((data, index) => {
      	        return <VariableSection key={index} variable={data} />;
      	      })}
      	    </List>
      	  </span>
      	) : null}

      	{setConfigureWorkflowModalOpen !== undefined && requiredTriggers.length > 0 && showTriggers !== false ? (
      	  <span>
      	    <Typography variant="body1" style={{ marginTop: 10 }}>
      	      Triggers
      	    </Typography>
      	    <List>
      	      {requiredTriggers.map((data, index) => {
      	        return <TriggerSection key={index} trigger={data} />;
      	      })}
      	    </List>
      	  </span>
      	) : null}
	  {setConfigureWorkflowModalOpen !== undefined ?
		<div style={{ textAlign: "left", display: "flex", marginTop: 20 }}>
			{showFinalizeAnimation ? 
				<img id="finalize_gif" src="/images/finalize.gif" alt="finalize workflow animation" style={{width: 150, margin: "auto",}} onLoad={() => {
					console.log("Img loaded.")
					setTimeout(() => {
						console.log("Img closing.")
						setConfigureWorkflowModalOpen(false);
					}, 1250)
						
				}}/>
				:
				<ButtonGroup style={{ margin: "auto" }}>
					{/*
					<Button color="primary" variant={"outlined"} style={{
					}} onClick={() => {
						setConfigureWorkflowModalOpen(false)
					}}>
						Skip 
					</Button>
					*/}
					<Button
						variant={"outlined"}
						style={{}}
						onClick={() => {
							stop()
							setShowFinalizeAnimation(true)
							setTimeout(() => {
								if (itemChanged) {
									if (saveWorkflow !== undefined) {
										saveWorkflow(workflow);
										window.location.reload();
									}

								} else {
								}
							}, 1000)
						}}
					>
						Finalize	
					</Button>
				</ButtonGroup>
			}
		</div>
	  : null}
	</div>
    </div>
  );
};

export default ConfigureWorkflow;
