import React, { useState, useEffect } from "react";
import { useInterval } from "react-powerhooks";

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
  Fade,
} from "@material-ui/core";
import { 
	FavoriteBorder as FavoriteBorderIcon,
	Error as ErrorIcon,
	CheckCircleRounded as CheckCircleRoundedIcon,
} from "@mui/icons-material";
import { FixName } from "../views/Apps.jsx";
import aa from 'search-insights'

// Handles workflow updates on first open to highlight the issues of the workflow
// Variables
// Action (exists, missing fields)
// Action auth
// Triggers
//
// Specifically used for UNSAVED workflows only?
const ConfigureWorkflow = (props) => {
  const {
		userdata,
    globalUrl,
    theme,
    workflow,
    appAuthentication,
    setSelectedAction,
    setAuthenticationModalOpen,
    setSelectedApp,
    apps,
    selectedAction,
    setConfigureWorkflowModalOpen,
    saveWorkflow,
    newWebhook,
    submitSchedule,
    referenceUrl,
    isCloud,
    setAuthenticationType,
    alert,
		showTriggers,
		workflowExecutions,
		getWorkflowExecution,
  } = props;

  const [requiredActions, setRequiredActions] = React.useState([]);
  const [requiredVariables, setRequiredVariables] = React.useState([]);
  const [requiredTriggers, setRequiredTriggers] = React.useState([]);
  const [previousAuth, setPreviousAuth] = React.useState(appAuthentication);
  const [itemChanged, setItemChanged] = React.useState(false);
  const [firstLoad, setFirstLoad] = React.useState("");
  const [showFinalizeAnimation, setShowFinalizeAnimation] = React.useState(false);

	const [checkStarted, setCheckStarted] = React.useState(false);

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

	// Where is this from?
  if (workflow === undefined || workflow === null) {
    return null;
  }

  if (apps === undefined || apps === null) {
    return null;
  }

  if (appAuthentication === undefined || appAuthentication === null) {
    return null;
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
          //alert.success("Successfully GOT app "+appId)
        } else {
          alert.error("Failed getting app");
        }

        return response.json();
      })
      .then((responseJson) => {
        console.log("ACTION: ", responseJson);
        if (
          responseJson.actions !== undefined &&
          responseJson.actions !== null
        ) {
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  if (firstLoad.length === 0 || firstLoad !== workflow.id) {
    if (apps === undefined || apps === null || apps.length === 0) {
      console.log("No apps loaded: ", apps);
      setConfigureWorkflowModalOpen(false);
      return null;
    }

    setFirstLoad(workflow.id)
    const newactions = [];
    for (let [key, keyval] in Object.entries(workflow.actions)) {
      const action = workflow.actions[key];
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
      };

      const app = apps.find(
        (app) =>
          app.name === action.app_name &&
          (app.app_version === action.app_version ||
            (app.loop_versions !== null &&
              app.loop_versions.includes(action.app_version)))
      )

			//newaction.steps = wazuhSteps
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
        if (action.authentication_id === "" && app.authentication.required === true && action.parameters !== undefined && action.parameters !== null) {
          // Check if configuration is filled or not
          var filled = true;
          for (let [key,keyval] in Object.entries(action.parameters)) {
            if (action.parameters[key].configuration) {
              //console.log("Found config: ", action.parameters[key])
              if (
                action.parameters[key].value === null ||
                action.parameters[key].value.length === 0
              ) {
                filled = false;
                break;
              }
            }
          }

					newaction.steps.push({
						"title": "Authenticate app",
						"type": "authenticate",
						"required": true,
					})

          if (!filled) {
            newaction.must_authenticate = true;
            newaction.action_ids.push(action.id);
          }
        } else if (action.authentication_id !== "" && app.authentication.required === true) {
					console.log("Should verify authentication ID ", action.authentication_id)

				}

        newaction.app = app;
      }

      if (
        action.errors !== undefined &&
        action.errors !== null &&
        action.errors.length > 0
      ) {
        //console.log("Node has errors!: ", action.errors)
      }

      if (newaction.must_authenticate) {
        var authenticationOptions = [];
        for (let [key,keyval] in Object.entries(appAuthentication)) {
          const auth = appAuthentication[key];
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
      if (
        variable.value === undefined ||
        variable.value === undefined ||
        variable.value.length < 2
      ) {
        variable.value = "";
        variable.index = key;
        requiredVariables.push(variable);
      }
    }
	  }

	if (workflow.triggers !== undefined && workflow.triggers !== null && workflow.triggers.length !== 0) {
    for (let [key,keyval] in Object.entries(workflow.triggers)) {
      var trigger = workflow.triggers[key];
      trigger.index = key;

			if (trigger.trigger_type === "WEBHOOK") {
				console.log("Found webhook: ", trigger)
				if (trigger.app_association !== undefined && trigger.app_association.name !== null && trigger.app_association.name !== "") {
					console.log("Actions: ", newactions)
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

						console.log("CHANGED ACTION: ", newactions[foundindex])
						//console.log("Index: ", newactions[foundindex])

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

      requiredTriggers.push(trigger);
    }
}

    if (
      requiredTriggers.length === 0 &&
      requiredVariables.length === 0 &&
      newactions.length === 0
    ) {
      setConfigureWorkflowModalOpen(false);
    }

    setRequiredTriggers(requiredTriggers);
    setRequiredVariables(requiredVariables);
    setRequiredActions(newactions);
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
      <ListItem>
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
        {/*
					<ListItemText
						primary={
							<TextField
								style={{backgroundColor: theme.palette.inputColor, borderRadius: 5,}} 
								InputProps={{
									style:{
										color: "white",
										minHeight: 50, 
										marginLeft: 5,
										maxWidth: "95%",
										fontSize: "1em",
									},
									endAdornment: (
										<InputAdornment position="end">
										</InputAdornment>
									)
								}}
								fullWidth
								color="primary"
								type={"text"}
								placeholder={`New value for ${trigger.name}`}
								onChange={(event) => {
									console.log("NEW VALUE ON INDEX", trigger.value)
								}}
								onBlur={(event) => {
									//workflow.variables[variable.index] = event.target.value
								}}
							/>
							}
							style={{}}
						/>
						*/}
      </ListItem>
    );
  };

  const VariableSection = (props) => {
    const { variable } = props;

    //<Typography variant="body2">Name: {variable.name} - {variable.value}. </Typography>
    return (
      <ListItem>
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
                borderRadius: 5,
              }}
              InputProps={{
                style: {
                  color: "white",
                  minHeight: 50,
                  marginLeft: 5,
                  maxWidth: "95%",
                  fontSize: "1em",
                },
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
          //alert.error("Failed to find this app. Is it public?")
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === false) {
        	if (responseJson.reason !== undefined) {
          	alert.error("Failed to activate the app: "+responseJson.reason);
					} else {
          	alert.error("Failed to activate the app");
					}
        } else {
          alert.success("App activated for your organization!");
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };



  const AppSection = (props) => {
    const { action } = props;

    return (
      <ListItem>
				{/*
        <ListItemAvatar>
          <Avatar variant="rounded">
            <img
              alt={action.app_name}
              src={action.large_image}
              style={{ width: 50 }}
            />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={FixName(action.app_name)}
          secondary={action.app_version}
          style={{}}
        />
				*/}
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
								borderRadius: theme.palette.borderRadius,
								minWidth: 350, 
								maxHeight: 50,
								overflow: "hidden",
								border: `1px solid ${theme.palette.inputColor}`,
        		  }}
        		  color="primary"
        		  onClick={() => {
        		      setAuthenticationType(
                  action.app.authentication.type === "oauth2" &&
                    action.app.authentication.redirect_uri !== undefined &&
                    action.app.authentication.redirect_uri !== null
                    ? {
                        type: "oauth2",
                        redirect_uri: action.app.authentication.redirect_uri,
                        token_uri: action.app.authentication.token_uri,
                        scope: action.app.authentication.scope,
                      }
                    : {
                        type: "",
                      }
                )

                setItemChanged(true);

								if (setSelectedAction !== undefined) {
                	setSelectedAction(action.action);
								}

								if (setSelectedApp !== undefined) {
                	setSelectedApp(action.app);
								}

                setAuthenticationModalOpen(true);
        		  }}
            >
						<img
							alt={action.app_name}
							style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette.borderRadius, }}
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
							borderRadius: theme.palette.borderRadius,
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
								alert.info("Setting action to version "+action.update_version)
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
							style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette.borderRadius, }}
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
									borderRadius: theme.palette.borderRadius,
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
							style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette.borderRadius, }}
							src={action.large_image}
						/>
						<Typography style={{ margin: 0, marginLeft: 10 }} variant="body1">
							Activate
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
		const {data, appname, appinfo, index, activeStep, setActiveStep, finished, } = props

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
			if (data.type === "webhook" && !finished) {
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
					{finished ?
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
										alert.error("Can only copy over HTTPS (port 3443)");
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
									alert.success("Copied Webhook URL");
								}
							}}>
								<Typography variant="body2" color="textSecondary">{webhook.description}</Typography>
								{/*<Typography variant="body2" color="textSecondary">{webhook.url}</Typography>*/}
								{isLoading && finished === false ? 
									<div style={{margin: "auto", width: 60, height: 60, marginTop: 5, }}>
										<CircularProgress  /> 
									</div>
									: 
									null
								}
							</div>
						: 
							<AppSection key={index} action={appinfo} />
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
			<div style={{backgroundColor: hovered ? theme.palette.inputColor : "inherit", border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette.borderRadius, cursor: "pointer", }} 
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
						var finished = false
						if (step.type === "activate") {
							if (data.activation_done === true) {
								finished = true

								if (index === activeStep && firstRun === true) {
									setActiveStep(activeStep+1)
								}
						
								if (firstRun) {
									setFinishCount(finishCount+1)
								}
							}
						}

						if (step.type === "authenticate") {
							console.log("AUTH STEP: ", step)
							if (data.must_authenticate === true ) {
								finished = false
							} else {
								if (data.activation_done === true && data.auth_done === true) {
									finished = true 

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

									finished = true
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
							<BoxHighlight appinfo={data} appname={"Wazuh"} key={index} data={step} index={index} activeStep={activeStep} setActiveStep={setActiveStep} finished={finished} />
						)
					})
				: null}
			</div>
		)
	}

	const topColor = "#f86a3e, #fc3922"
  return (
    <div>
			<div style={{height: 75, width: "100%", background: `linear-gradient(to right, ${topColor}`, position: "relative",}}>
			</div>
			<div style={{margin: "25px 50px 50px 50px", maxHeight: 475, }}>
      	<Typography variant="h6">{workflow.name}</Typography>
      	<Typography variant="body2" color="textSecondary">
      	  The following configuration makes the workflow ready immediately.
      	</Typography>
      	{requiredActions.length > 0 ? (
      	  <span>
      	    <Typography variant="body1" style={{ marginTop: 10, }}>
      	      Required Actions
      	    </Typography>

      	    <List>
      	      {requiredActions.map((data, index) => {
      	        return (
									<div>
										{data.steps !== undefined && data.steps !== null && data.show_steps === true ?
											<AppWrapper data={data} parentindex={index} />
										: 
											<AppSection key={index} action={data} />
										}
									</div>
								)
      	      })}
      	    </List>
      	  </span>
      	) : null}

      	{requiredVariables.length > 0 ? (
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

      	{requiredTriggers.length > 0 && showTriggers !== false ? (
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

				<div style={{ textAlign: "center", display: "flex", marginTop: 20 }}>
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
								color="textSecondary"
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
			</div>
    </div>
  );
};

export default ConfigureWorkflow;
