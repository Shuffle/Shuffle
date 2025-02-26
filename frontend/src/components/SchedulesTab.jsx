import React, { forwardRef, memo, useContext, useEffect } from 'react';
import theme from "../theme.jsx";
import { toast } from "react-toastify" ;
import { 
	Divider, 
	List, 
	ListItem, 
	ListItemText, 
	Button, 
	Tooltip, 
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
} from '@mui/material';

import {
  FileCopy as FileCopyIcon,
  OpenInNew as OpenInNewIcon,
  Padding,
} from "@mui/icons-material"
import { Box, Skeleton, Typography } from '@mui/material';
import { Context } from '../context/ContextApi.jsx';

const SchedulesTab = memo((props) => {
  const {globalUrl, users, } = props;
  const [webHooks, setWebHooks] = React.useState([]);
  const [allSchedules, setAllSchedules] = React.useState([]);
  const [pipelines, setPipelines] = React.useState([]);
  const [showLoader, setShowLoader] = React.useState(true);
  const [pipelineModalOpen, setPipelineModalOpen] = React.useState(false);
  const [newPipelineValue, setNewPipelineValue] = React.useState("export | sigma /tmp/sigma_rules | to SHUFFLE_WEBHOOK");

  useEffect(() => {
    if (allSchedules.length === 0 && webHooks.length === 0 && pipelines.length === 0) {
      handleGetAllTriggers()
    }
  }, []) 
  
  const textColor = "#9E9E9E !important";

  const changePipelineState = (pipeline, state) => {
    if (state.trim() === "") {
      toast("state is not defined");
      return;
    }
  
    const data = {
      name: pipeline.name,
      id: pipeline.id,
      type: state,
	  command: pipeline.definition,
      environment: pipeline.environment,
    };
  
    if (state === "start") toast("starting the pipeline");
    else toast.info("Stopping the pipeline. This may take a few minutes to propagate.")
  
    const url = `${globalUrl}/api/v1/triggers/pipeline`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
          toast("Failed to update the pipeline state");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          toast.error("Failed to update the pipeline: " + responseJson.reason);
        } else {
			setTimeout(() => {
				handleGetAllTriggers()
			}, 5000)

			setTimeout(() => {
				handleGetAllTriggers()
			}, 10000)

			setTimeout(() => {
				handleGetAllTriggers()
			}, 20000)

			setTimeout(() => {
				handleGetAllTriggers()
			}, 120000)
			/*
          if (state === "start") {
			  toast("Successfully created pipeline");
		  } else {
          	toast("Sucessfully stopped the pipeline");
		  }
		  */
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Get schedule error: ", error.toString());
      })
    } 

	const submitPipelineWrapper = (pipelineValue) => {
		submitPipeline(pipelineValue)
	}

	const NewPipelineView = (
        <Dialog
            open={pipelineModalOpen}
            onClose={() => {
                setPipelineModalOpen(false)
            }}
            PaperProps={{
              sx: {
                  borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                  border: theme?.palette?.DialogStyle?.border,
                  minWidth: "800px",
                  minHeight: "320px",
                  fontFamily: theme?.typography?.fontFamily,
                  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                  zIndex: 1000,
                  '& .MuiDialogContent-root': {
                    backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                  },
                  '& .MuiDialogTitle-root': {
                    backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                  },
                  '& .MuiDialogActions-root': {
                    backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                  },
              },
          }}
        >
            <DialogTitle>
                <span style={{ color: "white" }}>
					Run a Tenzir pipeline
				</span>
				<Typography variant="body2" color="textSecondary" style={{marginTop: 10, }}>
					Alpha feature. Deploys to the first available Orborus location. <a href="https://docs.tenzir.com/pipelines" target="_blank" rel="noopener noreferrer" style={{ color: "#ff8544" }}>Explore Tenzir Pipelines</a>. The example below exports everything in the Tenzir database, runs Sigma rules on it, and forwards the results to a Shuffle webhook.
				</Typography>
            </DialogTitle>
            <DialogContent>
                <div>
                    <TextField
                        color="primary"
                        style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor,}}
                        autoFocus
						label="Pipeline to run"
						multiline={true}
						minRows={4}
                        required
                        fullWidth={true}
						defaultValue="export | sigma /tmp/sigma_rules | to SHUFFLE_WEBHOOK"
                        placeholder="export | sigma /tmp/sigma_rules | to SHUFFLE_WEBHOOK"
                        id="environment_name"
                        margin="normal"
                        variant="outlined"
                        onChange={(event) =>
							setNewPipelineValue(event.target.value)
                        }
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    style={{ borderRadius: "2px", fontSize: 16, textTransform: "none", color: "#ff8544" }}
                    onClick={() => {
						setPipelineModalOpen(false)
					}}
                    color="primary"
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "2px", fontSize: 16, textTransform: "none", backgroundColor: "#ff8544", color: "#1a1a1a" }}
                    onClick={() => {
                        submitPipelineWrapper(newPipelineValue)
                    }}
                    color="primary"
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    )

  const submitPipeline = (pipeline, environment) => {
	var pipelineConfig = {
	  command: pipeline,
	  name: pipeline,
	  type: "create",
	  environment: "",

	  workflow_id: "",
	  trigger_id: "",
	  start_node: "",
	}

	if (environment !== undefined && environment !== "") {
		pipelineConfig.environment = environment
	}

    const url = `${globalUrl}/api/v1/triggers/pipeline`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(pipelineConfig),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success && pipelineConfig.type !== "delete") {
          toast("Failed to set pipeline: " + responseJson.reason);
        } else {
          if (pipelineConfig.type === "create") {
            toast("Pipeline will be created: " + responseJson.reason)
            setPipelineModalOpen(false)

          } else if (pipelineConfig.type === "stop") {
             toast("Pipeline will be stopped: " + responseJson.reason)
             setPipelineModalOpen(false)

          } else {
			  toast("Unknown pipeline type: " + pipelineConfig.type)
          }
		}

		setTimeout(() => {
			handleGetAllTriggers()
		}, 5000)

		setTimeout(() => {
			handleGetAllTriggers()
		}, 10000)

		setTimeout(() => {
			handleGetAllTriggers()
		}, 15000)

		setTimeout(() => {
			handleGetAllTriggers()
		}, 20000)
      })
      .catch((error) => {
        console.log("Get pipeline error: ", error.toString());
      });
  }

  const deleteSchedule = (data) => {
    // FIXME - add some check here ROFL
    console.log("INPUT: ", data);

    
    // Just use this one?
    const url =
      globalUrl +
      "/api/v1/workflows/" +
      data["workflow_id"] +
      "/schedule/" +
      data.id;
    fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            toast("Failed stopping schedule");
          } else {
            setTimeout(() => {
              handleGetAllTriggers();
            }, 1500);
            //toast("Successfully stopped schedule!")
          }
        })
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  const deleteWebhook = (trigger) => {
    if (trigger === undefined) {
      return;
    }
  
    fetch(globalUrl + "/api/v1/hooks/" + trigger.id + "/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success) {
          toast("Successfully stopped webhook");
        } else {
          if (responseJson.reason !== undefined) {
            toast("Failed stopping webhook: " + responseJson.reason);
          }
        }
        setTimeout(handleGetAllTriggers, 1000);
      })
      .catch((error) => {
        toast(
          "Delete webhook error. Contact support or check logs if this persists.",
        );
      });
  };

  

  const handleGetAllTriggers = () => {
    fetch(globalUrl + "/api/v1/triggers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for getting all triggers");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        setWebHooks(responseJson.webhooks || []);
        setAllSchedules(responseJson.schedules || []);
        setPipelines(responseJson.pipelines || []);
        setShowLoader(false);
      })
      .catch((error) => {
        // toast(error.toString());
      });
  };

  const startSchedule = (trigger) => {
    if (trigger.name.length <= 0) {
      toast("Error: name can't be empty");
      return;
    }

    toast("Creating schedule");
    const data = {
      name: trigger.name,
      frequency: trigger.frequency,
      execution_argument: trigger.argument,
      environment: trigger.environment,
      id: trigger.id,
      start: trigger.start_node,
    };
  
    fetch(`${globalUrl}/api/v1/workflows/${trigger.workflow_id}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          toast("Failed to set schedule: " + responseJson.reason);
        } else {
          toast("Successfully created schedule");
        }
        setTimeout(handleGetAllTriggers, 1000);
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Get schedule error: ", error.toString());
      });
  };
  
  const startWebHook = (trigger) => {
    const hookname = trigger.info.name;
    if (hookname.length === 0) {
      toast("Missing name");
      return;
    }
  
    if (trigger.id.length !== 36) {
      toast("Missing id");
      return;
    }
  
    toast("Starting webhook");
  
    const data = {
      name: hookname,
      type: "webhook",
      id: trigger.id,
      workflow: trigger.workflows[0],
      start: trigger.start,
      environment: trigger.environment,
      auth: trigger.auth,
      custom_response: trigger.custom_response,
      version: trigger.version,
      version_timeout: 15,
    };
  
  
    fetch(globalUrl + "/api/v1/hooks/new", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.success) {
          // Set the status
          toast("Successfully started webhook");
        } else {
          toast("Failed starting webhook: " + responseJson.reason);
        }
        setTimeout(handleGetAllTriggers, 1000);
      })
      .catch((error) => {
        //console.log(error.toString());
        console.log("New webhook error: ", error.toString());
      });
  };
  
  return (
    <div style={{
      width: "100%",
      minHeight: 1100,
      boxSizing: 'border-box',
      height: "100%",
      transition: 'width 0.3s ease',
      padding: '27px 10px 27px 27px',
      backgroundColor: '#212121',
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
      borderLeft: '1px solid #494949',
    }}>

	  {NewPipelineView} 

      <div style={{height: "100%", maxHeight: 1700, overflowY: "auto", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
      <h2 style={{ marginBottom: 8, marginTop: 0, color: "#FFFFFF"  }}>
	  	Triggers	
	  </h2>
      <Typography variant="body1" style={{ marginBottom: 50, marginTop: 0, }} color="textSecondary">
	  	Triggers are Automatic Workflow starters. <b>Status: Schedules ({allSchedules.length}), Webhooks ({webHooks.length}), Pipelines ({pipelines.length})</b>
	  </Typography>

      <div>
        <h4 style={{ marginBottom: 8, marginTop: 0, color: "#FFFFFF"  }}>
	  		Schedules
	  	</h4>
        <span style={{color:textColor}}>
          Schedules used in Workflows. Makes locating and control easier.{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="/docs/organizations#schedules"
            style={{ color:"#FF8444" }}
          >
            Learn more
          </a>
        </span>
      </div>
      <div style={{height: "100%", width: "calc(100% - 20px)", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
      <div
        style={{
          borderRadius: 4,
          marginTop: 24,
          border: "1px solid #494949",
          width: "100%",
          overflowX: "auto", 
          paddingBottom: 0,
      }}
      >
        <List 
          style={{
            borderRadius: 4,
                width: '100%', 
                tableLayout: "auto", 
                display: "table", 
                minWidth: 800,
                overflowX: "auto",
                paddingBottom: 0
        }}>
          <ListItem style={{width: "100%", paddingTop: 10, paddingBottom: 10, paddingRight: 10,  borderBottom: "1px solid #494949", display: 'table-row'}}>
          {["Name", "Interval", "Environment", "Workflow", "Argument", "Action"].map((header, index) => (
                          <ListItemText
                              key={index}
                              primary={header}
                              style={{
                                display: "table-cell",
                                padding: index === 0 ? "0px 8px 8px 15px": "0px 8px 8px 8px",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                borderBottom: "1px solid #494949",
                              }}
                          />
                      ))}
          </ListItem>
          {showLoader ? (
            [...Array(6)].map((_, rowIndex) => (
              <ListItem
                  key={rowIndex}
                  style={{
                      display: "table-row",
                      backgroundColor: "#212121",
                  }}
              >
                  {Array(6)
                      .fill()
                      .map((_, colIndex) => (
                          <ListItemText
                              key={colIndex}
                              style={{
                                  display: "table-cell",
                                  padding: "8px",
                              }}
                          >
                              <Skeleton
                                  variant="text"
                                  animation="wave"
                                  sx={{
                                      backgroundColor: "#1a1a1a",
                                      height: "20px",
                                      borderRadius: "4px",
                                  }}
                              />
                          </ListItemText>
                      ))}
              </ListItem>
          ))
          ):(
            allSchedules?.length === 0 ? (
              <div style={{ textAlign: 'center'}}>
                <Typography style={{color: "#FFFFFF", fontSize: 16, padding: 20, textAlign: 'center'}}>No schedules found</Typography>
              </div>
            ):(
              allSchedules.map((schedule, index) => {
                var bgColor = "#212121"
                if (index % 2 === 0) {
                  bgColor = "#1a1a1a";
                }
        
                return (
                  <ListItem
                  key={index}
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: index === allSchedules?.length - 1 ? 8 : 0,
                    display: 'table-row',
                  }}
                >
                  <ListItemText
                    style={{
                      display: 'table-cell',
                      verticalAlign: 'middle',
                      padding: "8px 8px 8px 15px",
                      minWidth: 100,
                    }}
                    primary={schedule.name}
                  />
                  <ListItemText
                    style={{
                      display: 'table-cell',
                      verticalAlign: 'middle',
                      padding: "8px 8px 8px 15px",
                      minWidth: 80,
                    }}
                    primary={
                      schedule.environment === "cloud" ||
                      schedule.environment === "" ||
                      schedule.frequency.length > 0 ? (
                        schedule.frequency
                      ) : (
                        <span>{schedule.seconds} seconds</span>
                      )
                    }
                  />
                  <ListItemText
                    style={{
                      display: 'table-cell',
                      verticalAlign: 'middle',
                      padding: 8,
                      minWidth: 100,
                    }}
                    primary={schedule.environment}
                  />
                  <ListItemText
                    style={{
                      display: 'table-cell',
                      verticalAlign: 'middle',
                      minWidth: 100,
                    }}
                    primary={
                      <Tooltip
                              title={"Go to workflow"}
                              style={{}}
                              aria-label={"Download"}
                            >
                              <span>
                                <a
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: "#f85a3e",
                                  }}
                                  href={`/workflows/${schedule.workflow_id}`}
                                  target="_blank"
                                >
                                  <IconButton
                                    disabled={schedule.workflow_id === "global"}
                                    style={{marginLeft: 10}}
                                  >
                                    <OpenInNewIcon
                                      style={{
                                        color:
                                          schedule.workflow_id !== "global"
                                            ? "#FF8444"
                                            : "grey",
                                      }}
                                    />
                                  </IconButton>
                                </a>
                              </span>
                        </Tooltip>
                    }
                  />
                  <ListItemText
                    primary={schedule.wrapped_argument.replaceAll('\\"', '"')}
                    style={{
                      display: 'table-cell',
                      wordWrap: "break-word",
                      maxWidth: 200,
                      whiteSpace: "normal",
                      maxHeight: 200,
                      overflow: "auto",
                      padding: 8,
                      verticalAlign: 'middle',
                    }}
                  />
                  <ListItemText
                    style={{
                      display: 'table-cell',
                      verticalAlign: 'middle',
                    }}
                    primary={(
                      <Box
                        style={{
                          display: 'table-cell',
                          verticalAlign: 'middle',
                          padding: 8
                        }}
                      >
                        <Button
                          style={{
                            textTransform: 'none',
                            fontSize: 16,
                            color: schedule.status === "running" ? '#1a1a1a' : null,
                            backgroundColor: schedule.status === "running" ? '#ff8544' : null,
                          }}
                          color={schedule.status === "running" ? "secondary" : "primary"}
                          variant={schedule.status === "running" ? "contained" : "outlined"}
                          disabled={schedule.status === "uninitialized"}
                          onClick={() => {
                            if (schedule.status === "running") {
                              deleteSchedule(schedule);
                            } else startSchedule(schedule);
                          }}
                        >
                          {schedule.status === "running" ? "Stop Schedule" : "Start Schedule"}
                        </Button>
                      </Box>
                    )}
                  />
                </ListItem>

                );
              })
            )
          )}
        </List>
      </div>

        <div style={{ marginTop: 50, marginBottom: 20 }}>
          <h4 style={{color: "#FFFFFF"}} >Webhooks</h4>
          <span> Webhooks used in Shuffle workflows.&nbsp;
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/triggers#webhooks"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              Learn more
            </a>
          </span>
        </div>
        <div
              style={{
              borderRadius: 4,
              marginTop: 24,
              border: "1px solid #494949",
              width: "100%",
              overflowX: "auto", 
              paddingBottom: 0,
              }}
            >
            <List 
              style={{
                borderRadius: 4,
                    width: '100%', 
                    tableLayout: "auto", 
                    display: "table", 
                    overflowX: "auto",
                    paddingBottom: 0,
                    minWidth: 600,
            }}>
        <ListItem style={{width:"100%", borderBottom:"1px solid #494949", display: "table-row"}}>
        {["Name", "Environment", "Workflow", "URL", "Action"].map((header, index) => (
                <ListItemText
                    key={index}
                    primary={header}
                    style={{
                      display: "table-cell",
                      padding: index === 0 ? "0px 8px 8px 15px": "0px 8px 8px 8px",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      borderBottom: "1px solid #494949",
                      position: "sticky",
                    }}
                />
            ))}
        </ListItem>
        {showLoader ? (
          [...Array(6)].map((_, rowIndex) => (
            <ListItem
                key={rowIndex}
                style={{
                    display: "table-row",
                    backgroundColor: "#212121",
                }}
            >
                {Array(5)
                    .fill()
                    .map((_, colIndex) => (
                        <ListItemText
                            key={colIndex}
                            style={{
                                display: "table-cell",
                                padding: "8px",
                            }}
                        >
                            <Skeleton
                                variant="text"
                                animation="wave"
                                sx={{
                                    backgroundColor: "#1a1a1a",
                                    height: "20px",
                                    borderRadius: "4px",
                                }}
                            />
                        </ListItemText>
                    ))}
            </ListItem>
        ))
        ):(
           webHooks?.length === 0 ? (
              <div style={{textAlign: "center"}}>
                  <Typography style={{color: "#FFFFFF", padding: 20, fontSize: 16, textAlign: 'center'}}>No webhooks found</Typography>
              </div>
          ):(
            webHooks.map((webhook, index) => {
              var bgColor = "#212121"
              if (index % 2 === 0) {
                bgColor = "#1a1a1a";
              }
  
              return (
                <ListItem key={index} style={{ backgroundColor: bgColor, borderRadius: index === webHooks.length - 1 ? 8 : 0, display: 'table-row', }} >
                  <ListItemText
                    style={{ display:'table-cell', padding: "8px 8px 8px 15px" }}
                    primary={webhook.info.name}
                  />
                  <ListItemText
                    style={{ display:'table-cell', padding: 8 }}
                    primary={webhook.environment}
                  />
                  <ListItemText
                    style={{ display:'table-cell',  }}
                    primary={
                      <Tooltip
														title={"Go to workflow"}
														style={{}}
														aria-label={"Download"}
													>
														<span>
															<a
																rel="noopener noreferrer"
																style={{
																	textDecoration: "none",
																	color: "#f85a3e",
																}}
																href={`/workflows/${webhook.workflows[0]}`}
																target="_blank"
															>
																<IconButton
																	disabled={webhook.workflows[0].workflow_id === "global"}
																	style={{marginLeft: 10}}
																>
																	<OpenInNewIcon
																		style={{
																			color:
                                      webhook.workflows[0].workflow_id !== "global"
																					? "#FF8444"
																					: "grey",
																		}}
																	/>
																</IconButton>
															</a>
														</span>
                      </Tooltip>
                    }
                  />
  
                  <ListItemText
                    style={{ display:'table-cell', padding: 8}}
                    primary={
                      webhook.info.url === undefined || webhook.info.url === 0 ? (
                        ""
                      ) : (
                        <Tooltip
                          title={"Copy URL"}
                          style={{}}
                          aria-label={"Copy URL"}
                        >
                          <IconButton
                            style={{}}
                            onClick={() => {
                               const copyText = navigator?.clipboard?.writeText(webhook.info.url);
                               if(copyText){
                                toast.success("URL copied to clipboard");
                                }else{
                                  toast.error("Failed to copy URL");
                                }
                            }}
                          >
                            <img src='/icons/copyIcon.svg' alt='copy'
                              style={{ color: "rgba(255,255,255,0.8)" }}
                            />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  />
  
                  <ListItemText style={{display:'table-cell', verticalAlign: 'middle', padding: 8}}
                   primary={(
                    <Box display="table-cell">
                      <Button
                        style={{
                          textTransform: 'none',
                          fontSize: 16,
                          color:webhook.status === "running" ? '#1a1a1a' : null,
                          backgroundColor: webhook.status === "running" ? '#ff8544' : null,
                        }}
                        color={webhook.status === "running" ? "secondary" : "primary"}
                        variant={webhook.status === "running" ? "contained" : "outlined"}
                        disabled={webhook.status === "uninitialized"}
                        onClick={() => {
                          if (webhook.status === "running") {
                            deleteWebhook(webhook);
                          } else startWebHook(webhook);
                        }}
                      >
                        {webhook.status === "running" ? "Stop webhook" : "Start Webhook"}
                      </Button>
                    </Box>
                   )}
                  />
                    
                </ListItem>
              );
            })
          )
          )}
          </List>
        </div>
        <div style={{ marginTop: 50, marginBottom: 20 }}>
          <h4 style={{color: "#FFFFFF"}}>Pipelines</h4>

          <span>
            Controls Pipelines on your Orborus Runners, e.g. for Log Ingestion, MQ subscriptions or Sigma Detections.{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/triggers#pipelines"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              Learn more
            </a>
          </span>

	  	  <div style={{marginBottom: 10, marginTop: 10,  }}/>

		  <Button
		  	style={{ backgroundColor: '#ff8544', color: "#1a1a1a", borderRadius: 4, textTransform: "capitalize", fontSize: 16,  }}
		  	variant="contained"
		  	color="primary"
		  	onClick={() => setPipelineModalOpen(true)}
		  >
		  	Deploy New Pipeline 
		  </Button>

        </div> 
        <div
              style={{
              borderRadius: 4,
              marginTop: 24,
              border: "1px solid #494949",
              width: "100%",
              overflowX: pipelines?.length === 0 ? "hidden" : "auto", 
              paddingBottom: 0,
              }}
            >
          <List 
              style={{
                borderRadius: 4,
                    width: '100%', 
                    tableLayout: "auto", 
                    display: "table", 
                    minWidth: pipelines?.length === 0 ? "auto" : 800,
                    overflowX: "auto",
                    paddingBottom: 0
            }}>
            <ListItem style={{width:"100%", borderBottom:"1px solid #494949", display: "table-row"}}>
            {["Command", "Environment", "Total Runs", "Actions"].map((header, index) => (
                    <ListItemText
                        key={index}
                        primary={header}
                        style={{
                          display: "table-cell",
                          padding: index === 0 ? "0px 8px 8px 15px": "0px 8px 8px 8px",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          borderBottom: "1px solid #494949",
                          position: "sticky",
                        }}
                    />
                ))}
          </ListItem>
            {showLoader ? (
              [...Array(6)].map((_, rowIndex) => {
				  return (
					<ListItem
						key={rowIndex}
						style={{
							display: "table-row",
							backgroundColor: "#212121",
						}}
					>
						{Array(5)
							.fill()
							.map((_, colIndex) => {
								return (
									<ListItemText
										key={colIndex}
										style={{
											display: "table-cell",
											padding: "8px",
										}}
									>
										<Skeleton
											variant="text"
											animation="wave"
											sx={{
												backgroundColor: "#1a1a1a",
												height: "20px",
												borderRadius: "4px",
											}}
										/>
									</ListItemText>
								)
							})}
					</ListItem>
					)
			  }
              )  

            ): (
              pipelines?.length === 0 ? ( 
                <div style={{width: "100%", textAlign: "center", }}>
                  <Typography style={{color: "#FFFFFF", padding: 20,width: "100%", fontSize: 16, textAlign: 'center'}}>No pipeline trigger found</Typography>
                </div>

              ):(
                pipelines.map((pipeline, index) => {
                  var bgColor = "#212121"
                  if (index % 2 === 0) {
                    bgColor = "#1a1a1a";
                  }

                  return (
                    <ListItem key={index} style={{ backgroundColor: bgColor, borderRadius: index === pipelines.length - 1 ? 8 : 0, display: 'table-row', }} >
                      <ListItemText
                        style={{ display:'table-cell', padding: "8px 8px 8px 15px" }}
                        primary={pipeline.definition}
                      />
                      <ListItemText
                        style={{ display:'table-cell', padding: 8 }}
                        primary={pipeline.environment}
                      />
                      <ListItemText
                        style={{ display:'table-cell',  }}
                        primary={pipeline.total_runs}
                      />
                      <ListItemText
                        style={{ display:'table-cell',  }}
                        primary={(
                          <Box display="table-cell">
                            <Button
                              style={{
                                textTransform: 'none',
                                fontSize: 16,
                              }}
                              variant={"outlined"}
                              disabled={pipeline.status === "uninitialized"}
                              onClick={() => {
                                changePipelineState(pipeline, "stop");
								/*
                                if (pipeline.status === "running") {
                                  changePipelineState(pipeline, "stop");
                                } else changePipelineState(pipeline, "start");
								*/
                              }}
                            >
							  Stop Pipeline
                            </Button>
                          </Box>
                        )}
                      />
                    </ListItem>
                  );
                })
              )
              )}
          </List>
          </div>
      </div>
        </div>
    </div>
  );
});

export default SchedulesTab;

