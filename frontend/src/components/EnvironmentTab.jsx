import React, { memo, useContext, useEffect, useState } from 'react';
import theme from "../theme.jsx";
import {
    Tooltip,
    Typography,
    Switch,
    TextField,
    Button,
    ButtonGroup,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Checkbox,
    Divider,
    Tab,
    Tabs,
    Collapse,
    Skeleton,
    Grid,
	Chip,
  MenuItem,
} from "@mui/material";
import { CopyToClipboard } from "../views/Docs.jsx"
import {
    FileCopy as FileCopyIcon,
    CheckCircle as CheckCircleIcon,
    Cached as CachedIcon,
    Cloud as CloudIcon,
    Cancel as CancelIcon,
    Help as HelpIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { toast } from 'react-toastify';
import { Context } from '../context/ContextApi.jsx';
import { green, red } from '../views/AngularWorkflow.jsx'
import AppSearch from "../components/AppSearch1.jsx";

const EnvironmentTab = memo((props) => {
    const { globalUrl, isCloud, userdata, selectedOrganization } = props;
    const [environments, setEnvironments] = React.useState([]);
    const [showArchived, setShowArchived] = React.useState(false);
    const [modalUser, setModalUser] = React.useState({});
    const [loginInfo, setLoginInfo] = React.useState("");
    const [modalOpen, setModalOpen] = React.useState(false);
    const [showLoader, setShowLoader] = useState(true)
    const [commandController, setCommandController] = React.useState({
        pipelines: false,
        proxies: false,
    })
    const [installationTab, setInstallationTab] = React.useState(0);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [listItemExpanded, setListItemExpanded] = React.useState(-1);
    const [, setUpdate] = React.useState(0);
    const [showDistributionPopup, setShowDistributionPopup] = React.useState(false);
    const [selectedEnvironment, setSelectedEnvironment] = React.useState(null);
    const [selectedSubOrg, setSelectedSubOrg] = React.useState([]);
	const [showLocationActionModal, setShowLocationActionModal] = React.useState(undefined)


    useEffect(() => {
        getEnvironments();
        setModalUser({});
    }, []);

    const changeModalData = (field, value) => {
        modalUser[field] = value;
    };

    // Horrible frontend fix for environments
    const setDefaultEnvironment = (environment) => {
        // FIXME - add more checks to this
        toast("Setting default location to " + environment.Name);
        var newEnv = [];
        for (var key in environments) {
            if (environments[key].id == environment.id) {
                if (environments[key].archived) {
                    toast("Can't set archived to default");
                    return;
                }

                environments[key].default = true;
            } else if (
                environments[key].default == true &&
                environments[key].id !== environment.id
            ) {
                environments[key].default = false;
            }

            newEnv.push(environments[key]);
        }

        // Just use this one?
        const url = globalUrl + "/api/v1/setenvironments";
        fetch(url, {
            method: "PUT",
            credentials: "include",
            body: JSON.stringify(newEnv),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) =>
                response.json().then((responseJson) => {
                    if (responseJson["success"] === false) {
                        toast(responseJson.reason);
                        setTimeout(() => {
                            getEnvironments();
                        }, 1500);
                    } else {
                        setLoginInfo("");
                        setModalOpen(false);
                        setTimeout(() => {
                            getEnvironments();
                        }, 1500);
                    }
                }),
            )
            .catch((error) => {
                console.log("Error in backend data: ", error);
            });
    };

    const rerunCloudWorkflows = (environment) => {
        toast("Starting execution reruns. This can run in the background.");
        fetch(`${globalUrl}/api/v1/environments/${environment.id}/rerun`, {
            method: "GET",
            credentials: "include",
        })
          .then((response) => {
            if (response.status !== 200) {
              console.log("Status not 200 for apps :O!");
              return;
            } else {
              toast(response.reason);
              //toast("Aborted all dangling workflows");
            }
    
            return response.json();
          })
          .then((responseJson) => {
            console.log("Got response for execution: ", responseJson);
            //console.log("RESPONSE: ", responseJson)
            //setFiles(responseJson)
          })
          .catch((error) => {
            //toast(error.toString())
          });
    }

    const getEnvironments = () => {
        fetch(globalUrl + "/api/v1/getenvironments", {
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
                    return;
                }

                return response.json();
            })
            .then((responseJson) => {
                setEnvironments(responseJson);
                setShowLoader(false)
                // Helper info for users in case they have a large queue and don't know about queue flushing
                if (responseJson !== undefined && responseJson !== null && responseJson.length > 0) {
                    if (responseJson.length === 1 && responseJson[0].Type !== "cloud") {
                        setListItemExpanded(0)
                    }
                    for (var i = 0; i < responseJson.length; i++) {
                        const env = responseJson[i];

                        // Check if queuesize is too large
                        if (env.queue !== undefined && env.queue !== null && env.queue > 100) {
                            toast("Queue size for " + env.name + " is very large. We recommend you to reduce it by flushing the queue before continuing.");
                            break
                        }
                    }
                }
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const flushQueue = (name) => {
        // Just use this one?
        const url = globalUrl + "/api/v1/flush_queue";
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
                        toast(responseJson.reason);
                        getEnvironments();
                    } else {
                        setLoginInfo("");
                        setModalOpen(false);
                        getEnvironments();
                    }
                }),
            )
            .catch((error) => {
                console.log("Error when deleting: ", error);
            });
    };


    const deleteEnvironment = (environment) => {
        // FIXME - add some check here ROFL
        //const name = environment.name

        //toast("Modifying environment " + name)
        //var newEnv = []
        //for (var key in environments) {
        //	if (environments[key].Name == name) {
        //		if (environments[key].default) {
        //			toast("Can't modify the default environment")
        //			return
        //		}

        //		if (environments[key].type === "cloud" && !environments[key].archived) {
        //			toast("Can't modify cloud environments")
        //			return
        //		}

        //		environments[key].archived = !environments[key].archived
        //	}

        //	newEnv.push(environments[key])
        //}
        const id = environment.id;

        //toast("Modifying environment " + environment.Name)
        var newEnv = [];
        for (var key in environments) {
            if (environments[key].id == id) {
                if (environments[key].default) {
                    toast("Can't modify the default environment. Change the default environment first.");
                    return;
                }

                if (environments[key].type === "cloud" && !environments[key].archived) {
                    toast("Can't modify cloud environments");
                    return;
                }

                environments[key].archived = !environments[key].archived;
            }

            newEnv.push(environments[key]);
        }

        // Just use this one?
        const url = globalUrl + "/api/v1/setenvironments";
        fetch(url, {
            method: "PUT",
            credentials: "include",
            body: JSON.stringify(newEnv),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) =>
                response.json().then((responseJson) => {
                    if (responseJson["success"] === false) {
                        toast(responseJson.reason);
                        getEnvironments();
                    } else {
                        setLoginInfo("");
                        setModalOpen(false);
                        getEnvironments();
                    }
                }),
            )
            .catch((error) => {
                console.log("Error when deleting: ", error);
            });
    };

    const abortEnvironmentWorkflows = (environment) => {
        //console.log("Aborting all workflows started >10 minutes ago, not finished");
        toast(
            "Clearing the queue - this may take some time. A new will show up when finished.",
        );

        fetch(
            `${globalUrl}/api/v1/environments/${environment.id}/stop?deleteall=true`,
            {
                method: "GET",
                credentials: "include",
            },
        )
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for apps :O!");
                    toast("Failed aborting dangling workflows");
                    return;
                } else {
                    toast("Successfully cleared the queue");

                    getEnvironments();
                }

                return response.json();
            })
            .then((responseJson) => {
                console.log("Got response for execution: ", responseJson);
                //console.log("RESPONSE: ", responseJson)
                //setFiles(responseJson)
            })
            .catch((error) => {
                //toast(error.toString())
            });
    };

    const changeRecommendation = (recommendation, action) => {
        const data = {
          action: action,
          name: recommendation.name,
        };
    
        fetch(`${globalUrl}/api/v1/recommendations/modify`, {
          mode: "cors",
          method: "POST",
          body: JSON.stringify(data),
          credentials: "include",
          crossDomain: true,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        })
          .then((response) => {
            if (response.status === 200) {
            } else {
            }
    
            return response.json();
          })
          .then((responseJson) => {
            if (responseJson.success === true) {
                getEnvironments();
            } else {
              if (
                responseJson.success === false &&
                responseJson.reason !== undefined
              ) {
                toast("Failed change recommendation: ", responseJson.reason);
              } else {
                toast("Failed change recommendation");
              }
            }
          })
          .catch((error) => {
            toast(
              "Failed dismissing alert. Please contact support@shuffler.io if this persists.",
            );
          });
      };

    const getOrborusCommand = (environment) => {
        if (environment.Type === "cloud") {
          //toast("No Orborus necessary for environment cloud. Create and use a different environment to run executions on-premises.",)
          return
        }
    
        if (
          props.userdata.active_org === undefined ||
          props.userdata.active_org === null
        ) {
          return;
        }
    
        const elementName = "copy_element_shuffle";
        var auth =
          environment.auth === ""
            ? "cb5st3d3Z!3X3zaJ*Pc"
            : environment.auth

		// Escape exclamation marks for copying
		auth = auth.replace("\\!", "!").replace(/!/g, "\\!")

        const newUrl =
          globalUrl === "https://shuffler.io"
            ? "https://shuffle-backend-stbuwivzoq-nw.a.run.app"
            : globalUrl;
    
        var skipPipeline = false
        if (commandController.pipelines === true) {
            skipPipeline = true
        }
    
        var addProxy = false
        if (commandController.proxies === true) {
            addProxy = true
        }
    
        if (installationTab === 1) {
            return (`docker run -d \\
        --restart=always \\
        --name="shuffle-orborus" \\
        --pull=always \\
        --volume "/var/run/docker.sock:/var/run/docker.sock" \\
        -e AUTH="${auth}" \\
        -e ENVIRONMENT_NAME="${environment.Name}" \\
        -e ORG="${environment.org_id}" \\
        -e SHUFFLE_WORKER_IMAGE="ghcr.io/shuffle/shuffle-worker:latest" \\
        -e SHUFFLE_SWARM_CONFIG=run \\
        -e SHUFFLE_LOGS_DISABLED=true \\
        -e BASE_URL="${newUrl}" \\${addProxy ? `
		-e HTTPS_PROXY=IP:PORT \\` : ""}${skipPipeline ? `
		-e SHUFFLE_SKIP_PIPELINES=true \\` : ""}
        ghcr.io/shuffle/shuffle-orborus:latest
            `)
        } else if (installationTab === 2) {
            return `https://shuffler.io/docs/configuration#kubernetes`
        }
    
        const commandData = `docker rm shuffle-orborus --force; \\\ndocker run -d \\
        --restart=always \\
        --name="shuffle-orborus" \\
        --pull=always  \\
        --volume "/var/run/docker.sock:/var/run/docker.sock" \\
        -e AUTH="${auth}" \\
        -e ENVIRONMENT_NAME="${environment.Name}" \\
        -e ORG="${props.userdata.active_org.id}" \\
        -e BASE_URL="${newUrl}" \\${addProxy ? `
		-e HTTPS_PROXY=IP:PORT \\` : ""}${skipPipeline ? `
		-e SHUFFLE_SKIP_PIPELINES=true \\` : ""}
        ghcr.io/shuffle/shuffle-orborus:latest`
    
        return commandData
      };

    const submitEnvironment = (data) => {
        // FIXME - add some check here ROFL
        environments.push({
            name: data.environment,
            type: "onprem",
        });

        // Just use this one?
        var baseurl = globalUrl;
        const url = baseurl + "/api/v1/setenvironments";
        fetch(url, {
            method: "PUT",
            credentials: "include",
            body: JSON.stringify(environments),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) =>
                response.json().then((responseJson) => {
                    if (responseJson["success"] === false) {
                        setLoginInfo("Error in input: " + responseJson.reason);
                        getEnvironments();
                    } else {
                        setLoginInfo("");
                        setModalOpen(false);
                        getEnvironments();
                    }
                }),
            )
            .catch((error) => {
                console.log("Error in userdata: ", error);
            });
    };

    const modalView = (
        <Dialog
            open={modalOpen}
            onClose={() => {
                setModalOpen(false);
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
                <span style={{ color: "white" }}>Add Location</span>
            </DialogTitle>
            <DialogContent>
                <div>
                    Location Name
                    <TextField
                        color="primary"
                        style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor,}}
                        autoFocus
                        InputProps={{
                            style: {
                                height: "50px",
                                color: "white",
                                fontSize: "1em",
                            },
                        }}
                        required
                        fullWidth={true}
                        placeholder="datacenter froglantern"
                        id="environment_name"
                        margin="normal"
                        variant="outlined"
                        onChange={(event) =>
                            changeModalData("environment", event.target.value)
                        }
                    />
                </div>
                {loginInfo} {/* Assuming loginInfo is part of the relevant content */}
            </DialogContent>
            <DialogActions>
                <Button
                    style={{ borderRadius: "2px", fontSize: 16, textTransform: "none", color: "#ff8544" }}
                    onClick={() => setModalOpen(false)}
                    color="primary"
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "2px", fontSize: 16, textTransform: "none", backgroundColor: "#ff8544", color: "#1a1a1a" }}
                    onClick={() => {
                        submitEnvironment(modalUser); // Assuming modalUser is available
                    }}
                    color="primary"
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );


    const textColor = "#9E9E9E !important";

    const handleSelectSubOrg = (id, action) => {
      if (action === "all") {
          const childOrgs = userdata.orgs.filter(
              (data) => data.creator_org === userdata.active_org.id
          );
          setSelectedSubOrg((prev) => {
              if (prev.length === childOrgs.length) {
                  // If all child orgs are already selected, clear the selection
                  return [];
              } else {
                  // Otherwise, select all child org IDs
                  return childOrgs.map((data) => data.id);
              }
          });
      } else if (action === "none") {
          setSelectedSubOrg([]);
      } else {
          setSelectedSubOrg((prev) => {
              if (prev.includes(id)) {
                  return prev.filter((data) => data !== id);
              } else {
                  return [...prev, id];
              }
          });
      }
  };

    const queueSizeText = (queue) => {
        if (queue === undefined || queue === null) return 0;
        if (queue < 0) return 0;
        if (queue > 1000) return ">1000";
        return queue;
    };

	const LocationActionModal = (props) => {
		const { showLocationActionModal } = props

    	const [searchQuery, setSearchQuery] = React.useState("");

		if (showLocationActionModal === undefined || showLocationActionModal === null) {
			return null
		}

		if (showLocationActionModal?.open !== true) {
			return null
		}



		return (
			<Dialog
			  open={true}
			  onClose={() => {
				  setShowLocationActionModal(undefined)
			  }}
			  PaperProps={{
				sx: {
				  borderRadius: theme?.palette?.DialogStyle?.borderRadius,
				  border: theme?.palette?.DialogStyle?.border,
				  fontFamily: theme?.typography?.fontFamily,
				  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
				  zIndex: 1000,
				  minWidth: 600,
				  minHeight: 500,
				  overflow: "auto",
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
				<div style={{ color: "rgba(255,255,255,0.9)" }}>
					Select a job to send
				</div>
			  </DialogTitle>
			  <DialogContent style={{ backgroundColor: theme.palette.backgroundColor }}>
				  <Checkbox
					checked={true}
					disabled={true}
				  />
				  <span style={{ marginLeft: 8 }}>
					Find app to re-download
				  </span>

				  <AppSearch 
				  />
			  </DialogContent>
			</Dialog>
		)
	}

    const editEnvironmentConfig = (id, selectedSubOrg, cacheKey) => {
                    const data = {
                        action: "suborg_distribute",
                        selected_suborgs: selectedSubOrg,
                    }
                    
                    const url = `${globalUrl}/api/v1/environments/${id}/config`;
        
                    fetch(url, {
                        mode: "cors",
                        method: "POST",
                        body: JSON.stringify(data),
                        credentials: "include",
                        crossDomain: true,
                        withCredentials: true,
                        headers: {
                            "Content-Type": "application/json; charset=utf-8",
                        },
                    })
                        .then((response) =>
                            response.json().then((responseJson) => {
                                if (responseJson["success"] === false) {
                                    toast("Failed overwriting environments");
                                } else {
                                    toast("Successfully updated environments!");
                                    setTimeout(() => {
                                        getEnvironments();
                                        setShowDistributionPopup(false);
                                    }, 1000);
                                }
                            })
                        )
                        .catch((error) => {
                            toast("Err: " + error.toString());
                        });
            };

    const changeDistribution = (id, selectedSubOrg) => {	

      editEnvironmentConfig(id, [...new Set(selectedSubOrg)])
    }

    const EnvironmentDistributionModal = showDistributionPopup ? (
      <Dialog
          open={showDistributionPopup}
          onClose={() => setShowDistributionPopup(false)}
          PaperProps={{
            sx: {
              borderRadius: theme?.palette?.DialogStyle?.borderRadius,
              border: theme?.palette?.DialogStyle?.border,
              fontFamily: theme?.typography?.fontFamily,
              backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
              zIndex: 1000,
              minWidth: "600px",
              minHeight: "320px",
              overflow: "auto",
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
    <div style={{ color: "rgba(255,255,255,0.9)" }}>
      Select sub-org to distribute Environments
    </div>
  </DialogTitle>
  <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
    <MenuItem value="none" onClick={()=> {handleSelectSubOrg(null, "none")}}>None</MenuItem>
    <MenuItem value="all" onClick={()=> {handleSelectSubOrg(null, "all")}}>All</MenuItem>
    {userdata.orgs.map((data, index) => {
      if (data.creator_org !== userdata.active_org.id) {
        return null;
      }

      const imagesize = 22;
      const imageStyle = {
        width: imagesize,
        height: imagesize,
        pointerEvents: "none",
        marginRight: 10,
        marginLeft: data.id === userdata.active_org.id ? 0 : 20,
      };

      const image = data.image === "" ? (
        <img alt={data.name} src={theme.palette.defaultImage} style={imageStyle} />
      ) : (
        <img alt={data.name} src={data.image} style={imageStyle} />
      );

      return (
        <MenuItem
          key={index}
          value={data.id}
          onClick={() => handleSelectSubOrg(data.id)}
          style={{ display: "flex", alignItems: "center" }}
        >
          <Checkbox
            checked={selectedSubOrg.includes(data.id)}
          />
          {image}
          <span style={{ marginLeft: 8 }}>{data.name}</span>
        </MenuItem>
      );
    })}

    <div style={{ display: "flex", marginTop: 20 }}>
      <Button
        style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#ff8544"  }}
        onClick={() => setShowDistributionPopup(false)}
        color="primary"
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#1a1a1a", backgroundColor: "#ff8544", marginLeft: 10 }}
        onClick={() => {
          changeDistribution(selectedEnvironment, selectedSubOrg);
        }}
        color="primary"
      >
        Submit
      </Button>
    </div>
  </DialogContent>
  </Dialog>
  ) : null;

    return (
        <div style={{ width: "100%", minHeight: 1100, boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: '#212121',borderTopRightRadius: '8px', borderBottomRightRadius: 8, borderLeft: "1px solid #494949", }}>
            {modalView}
            {EnvironmentDistributionModal}
            <div style={{ height: "100%", maxHeight: 1700, overflowY: "auto", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin' }}>
              <div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ marginBottom: 8, marginTop: 0, color: "#ffffff" }}>Runtime Locations</h2>
                <span style={{ color: textColor }}>
                    Decides which Orborus <b>runtime location</b> to run your workflows in. Previously called Environments. <br /> If you have scale problems, <a href="https://shuffler.io/docs/configuration#high-availability" target="_blank" rel="noopener noreferrer" style={{ color: "#FF8444" }}>check the docs</a> or talk to our team: support@shuffler.io.&nbsp;
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="/docs/organizations#locations"
                        style={{ color: "#FF8444" }}
                    >
                        Learn more
                    </a>
                </span>
            </div>
            <Button
                style={{ backgroundColor: '#ff8544', color: "#1a1a1a", borderRadius: 4, textTransform: "capitalize", fontSize: 16,  }}
                variant="contained"
                color="primary"
                onClick={() => setModalOpen(true)}
            >
                Add Location
            </Button>
            <Button
                style={{ backgroundColor: "#2F2F2F", borderRadius: 4, width: 81, height: 40, marginLeft: 16, marginRight: 15 }}
                variant="contained"
                color="primary"
                onClick={getEnvironments}
            >
                <CachedIcon />
            </Button>
            <Switch
                checked={showArchived}
                onChange={() => setShowArchived(!showArchived)}
            />{" "}
            Show disabled
            {/* <Divider
        style={{
          marginTop: 20,
          marginBottom: 20,
          backgroundColor: theme.palette.inputColor,
        }}
      /> */}
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
                    width: '100%', 
                    tableLayout: "auto", 
                    display:  "grid", 
                    minWidth: 800,
                    paddingBottom: 0,
                }}
            >
                <ListItem 
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 80px 80px 120px 120px 120px 120px 350px 150px", 
                    width: "100%",
                    minWidth: 800,
                    paddingBottom: 0,
                    borderBottom: "1px solid #494949",    
                  }}
              >
                    {["Type", "Status", "Scale", "Pipeline", "Name", "Type", "Queue", "Actions", "Distribution"].map((header, index) => {

						return (
							<ListItemText
								key={index}
								primary={header}
								style={{
								  padding: "0px 8px 8px 8px",
								  whiteSpace: "nowrap",
								  textOverflow: "ellipsis",
								  overflow: "hidden",
								  fontWeight: "bold",
								  textAlign: header === "Actions" ? "left" : header === "Distribution" ? "right" : "center",                
								}}
							/>
                    	)
					})}
                </ListItem>
                {showLoader
    ? [...Array(6)].map((_, rowIndex) => (
      <ListItem
        key={rowIndex}
        style={{
          display: "grid",
          gridTemplateColumns: "80px 80px 80px 120px 120px 120px 120px 350px 150px",
          backgroundColor: "#212121",
          height: 40,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {Array(9).fill(null).map((_, colIndex) => (
          <ListItemText
            key={colIndex}
            style={{
              padding: "0px 8px",
              textAlign: "center", // Optional
            }}
          >
            <Skeleton
              variant="text"
              animation="wave"
              sx={{
                backgroundColor: "#1a1a1a",
                borderRadius: "4px",
              }}
            />
          </ListItemText>
        ))}
      </ListItem>
      ))
		: environments?.length === 0 ? (
      <Typography style={{padding: 20, textAlign: 'center', fontSize: 16}}>
        No Locations Found
      </Typography>
    ):(
      environments?.map((environment, index) => {
        if (!showArchived && environment.archived) {
          return null;
        }
  
        if (environment.archived === undefined) {
          return null;
        }
  
        var bgColor = "#212121";
        if (index % 2 === 0) {
          bgColor = "#1A1A1A";
        }
  
        // Check if there's a notification for it in userdata.priorities
        var showCPUAlert = false;
        var foundIndex = -1;
        if (
          userdata !== undefined &&
          userdata !== null &&
          userdata.priorities !== undefined &&
          userdata.priorities !== null &&
          userdata.priorities.length > 0
        ) {
          foundIndex = userdata.priorities.findIndex(
          (prio) => prio.name.includes("CPU") && prio.active === true,
          );
  
          if (
          foundIndex >= 0 &&
          userdata.priorities[foundIndex].name.endsWith(
            environment.Name,
          )
          ) {
          showCPUAlert = true;
          }
        }
  
        const queueSize =
          environment.queue !== undefined && environment.queue !== null
          ? environment.queue < 0
            ? 0
            : environment.queue > 1000
            ? ">1000"
            : environment.queue
          : 0;
  
  
        const orborusCommandWrapper = () => {
          // Check the current text 
          const orborusCommand = document.getElementById("orborus_command")
          if (orborusCommand === undefined || orborusCommand === null) {
            return getOrborusCommand(environment)
          }
  
          return orborusCommand.textContent
        }

        const isDistributed = environment?.suborg_distribution?.length > 0 ? true : false;
  
        return ( 
         <>

           <ListItem
            key={index}
            style={{ cursor: "pointer", backgroundColor: bgColor, marginLeft: 0, borderBottomLeftRadius: environments?.length - 1 === index ? 8 : 0, borderBottomRightRadius: environments?.length - 1 === index ? 8 : 0, display: 'grid', gridTemplateColumns: "80px 80px 80px 120px 120px 120px 120px 405px 125px", }}
            onClick={() => {
            if (environment.Type === "cloud") {
              toast("Cloud environments are not configurable. To see what is possible, create a new environment.")
              return
            }
  
            setListItemExpanded(listItemExpanded === index ? -1 : index)
            }}
          >
            <ListItemText
            primary={
              environment.run_type === "cloud" ||
              environment.name === "Cloud" ? (
              <Tooltip title="Cloud" placement="top">
                <CloudIcon
                style={{ color: "rgba(255,255,255,0.8)" }}
                />
              </Tooltip>
              ) : environment.run_type === "docker" ? (
              <Tooltip title="Docker" placement="top">
                <img
                src="/icons/docker.svg"
                style={{ width: 30, height: 30 }}
                />
              </Tooltip>
              ) : environment.run_type === "k8s" ? (
              <Tooltip title="Kubernetes" placement="top">
                <img
                src="/icons/k8s.svg"
                style={{ width: 30, height: 30 }}
                />
              </Tooltip>
              ) : (
              <Tooltip title="Unknown" placement="top">
                <HelpIcon
                style={{ color: "rgba(255,255,255,0.8)" }}
                />
              </Tooltip>
              )
            }
            style={{
              minWidth: 80,
              padding: "8px 8px 8px 0",
              overflow: "hidden",
              whiteSpace: "normal", 
              wordWrap: "break-word",
              textAlign: "center",
              display: "table-cell",
            }}
            />

				<ListItemText
				  primaryTypographyProps={{
					style: {
					  marginLeft: -10, 
					  maxWidth: 100,
					  overflow: "hidden",
					  whiteSpace: "nowrap",
					  textOverflow: "ellipsis",
					  padding: "8px 0px 8px 0px",
					  transition: "all 0.3s ease",
					  textAlign: "center",
					},
				  }}
				  style={{minWidth:120, display: "table-cell",}}
				  primary={
					<Tooltip title={
						<Typography variant="body1" style={{margin: 10, }}>
						{environment.Type !== "cloud"
						  ? environment.running_ip === undefined ||
							environment.running_ip === null ||
							environment.running_ip.length === 0
							? 
							"Not running. Click to get the start command that can be ran on your server."
							: 
							<span>IP / label: {environment?.running_ip?.split(":")[0]}. May stay running up to a minute after stopping Orborus.</span>
						  : 
							"Cloud is automatically configured. Reachout to support@shuffler.io if you have any questions."
						}

						<br />
						<br />

						Last checkin: {environment?.checkin !== undefined && environment.checkin !== null && environment?.checkin > 0 ? new Date(environment?.checkin * 1000).toLocaleString() : "Never"}
						</Typography>
					} placement="top">
					  <Typography
					  style={{
						minWidth: 100,
						overflow: "hidden",
						whiteSpace: "nowrap",
						textOverflow: "ellipsis",
						wordWrap: "break-word",
						fontSize: 16,
						transition: "all 0.3s ease",
					  }}
					  variant="body2"
					>
					  {environment.Type !== "cloud" &&  
						(environment.running_ip === undefined ||
						  environment.running_ip === null ||
						  environment.running_ip.length === 0)
						  ? 
						  <Chip
        	                key={index}
        	                style={{
								color: red,
								borderColor: red,
							}}
        	                label={"Stopped"}
        	                onClick={() => {
        	                  //handleChipClick
        	                }}
        	                variant="outlined"
        	                color="primary"
        	              />
						  : 
        	              <Chip
        	                key={index}
        	                style={{
								color: green,
								borderColor: green,
							}}
        	                label={"Running"}
        	                onClick={() => {
        	                  //handleChipClick
        	                }}
        	                variant="outlined"
        	                color="primary"
        	              />
						}
					</Typography>
					</Tooltip>
				  }
				/>

            <ListItemText
            primary={
              environment.licensed ? (
              <Tooltip title="Scale configured (auto on cloud)" placement="top">
                                <CheckCircleIcon style={{ color: "#4caf50" }} />
                              </Tooltip>
                            ) : (
                              <Tooltip
                                title="In Verbose mode. Set SHUFFLE_SWARM_CONFIG=run to Scale. This will not be as verbose. Details: https://shuffler.io/docs/configuration#scaling-shuffle"
                                placement="top"
                              >
                                <a
                                  href="/docs/configuration#scaling-shuffle"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <CancelIcon style={{ color: "#f85a3e" }} />
                                </a>
                              </Tooltip>
                            )
                          }
                          style={{
                            minWidth: 60,
							marginLeft: 20, 
                            overflow: "hidden",
                            whiteSpace: "normal", 
                            wordWrap: "break-word",
                            padding: 8,
                            display: "table-cell",
                          }}
                        />

              		<ListItemText
                    	primary={
                			environment.Type === "cloud" ? 
                              <Tooltip title={"Make a new environment to set up a Datalake node. Please contact support@shuffler.io if this is something you want to see on Cloud directly."} placement="top">
                                <CancelIcon style={{ color: "rgba(255,255,255,0.3)" }} />
                              </Tooltip>
                		:
                            environment?.data_lake?.enabled && environment?.archived !== true ? (
                                <a
                                  href="/detections/Sigma"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >

                  		<Tooltip title={"Data Lake node enabled. Check /detections/Sigma to learn more"} placement="top">
                    		<CheckCircleIcon style={{ color: "#4caf50" }} />
                  		</Tooltip>
                  	</a>
                	) : (
					  <Tooltip
						title="Data Lake node disabled. Click to enable."
                        placement="top"
						  onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
		  
							window.open("/detections/Sigma", "_blank")
                  		}}
                              >
                                <a
                                  href="/detections/Sigma"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <CancelIcon style={{ color: "#f85a3e" }} />
                                </a>
                              </Tooltip>
                            )
                          }
                          style={{
                            minWidth: 60,
							marginLeft: 40, 
                            overflow: "hidden",
                            whiteSpace: "normal", 
                            wordWrap: "break-word",
                            display: "table-cell",
                          }}
                        />

                        <ListItemText
                          primary={(
                            <Tooltip title={environment.Name} placement="top">
                              {environment.Name}
                            </Tooltip>
                          )}
                          primaryTypographyProps={{
                            style:{
                              maxWidth: 150,
                              whiteSpace: 'nowrap',
                              overflow: "hidden",
                              textOverflow: 'ellipsis',
                              wordWrap: "break-word",
                              transition: "all 0.3s ease",
                            }}}
                            style={{
                              minWidth: 120,
                              maxWidth: 150,
                              display: "table-cell",
                            }}
                        />

                        <ListItemText
                          primary={environment.Type}
                          primaryTypographyProps={{
                            style:{
                              minWidth:  70,
                              overflow: "hidden",
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              wordWrap: "break-word",
                              transition: "all 0.3s ease",
                              textAlign: "center",
                            }}}
                            style={{display: "table-cell",}}
                        />
                        <ListItemText
                          primaryTypographyProps={{
                            style:{
                              minWidth: 82,
                              overflow: "hidden",
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              wordWrap: "break-word",
                              transition: "all 0.3s ease",
                              textAlign: "center",
                            }}}
                          primary={queueSize}
                          style={{display: "table-cell",}}
                        />
                        <ListItemText
                            style={{
                              minWidth: 300,
                              overflow: "hidden",
                            }}
                          >
                            <div style={{ display: "flex", flexWrap: "nowrap" }}>
                              <ButtonGroup
                                style={{ borderRadius: "5px 5px 5px 5px", flexWrap: "nowrap" }}
                              >
                                <Button
                                  variant="outlined"
                                  disabled={environment.default || selectedOrganization.id !== environment.org_id}
                                  style={{
                                    marginLeft: 0,
                                    marginRight: 0,
                                    maxWidth: 150,
                                    fontSize: 16,
                                    textTransform: 'none',
                                    display: "table-cell",
                                    whiteSpace: "nowrap", // Prevent text wrapping
                                  }}
                                  onClick={(e) => {
									  e.preventDefault();
									  e.stopPropagation();
									  setDefaultEnvironment(environment)
								  }}
                                  color="primary"
                                >
                                  Make Default
                                </Button>
                                <Button
                                  variant={environment.archived ? "contained" : "outlined"}
                                  disabled={selectedOrganization.id !== environment.org_id}
                                  style={{
                                    fontSize: 16,
                                    textTransform: 'none',
                                    whiteSpace: "nowrap", // Prevent text wrapping
                                  }}
                                  onClick={(e) => {
									  e.preventDefault();
									  e.stopPropagation();
									  deleteEnvironment(environment)
								  }}
                                  color="primary"
                                >
                                  {environment.archived ? "Activate" : "Disable"}
                                </Button>

                                <Button
                                  variant={"outlined"}
                                  disabled={selectedOrganization.id !== environment.org_id}
                                  style={{
                                    fontSize: 16,
                                    textTransform: 'none',
                                    whiteSpace: "nowrap", // Prevent text wrapping
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    console.log("Should clear executions for: ", environment);

                                    if (isCloud && environment.Name.toLowerCase() === "cloud") {
                                      rerunCloudWorkflows(environment);
                                    } else {
                                      abortEnvironmentWorkflows(environment);
                                    }
                                  }}
                                  color="primary"
                                >
                                  {isCloud && environment.Name.toLowerCase() === "cloud"
                                    ? "Rerun"
                                    : "Clear"}
                                </Button>

								{environment.Type === "cloud" ? null : 
									<Button
									  variant={"outlined"}
									  style={{
										fontSize: 16,
										textTransform: 'none',
										whiteSpace: "nowrap", // Prevent text wrapping
									  }}
									  onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();

										toast.info("Please choose an app you want to re-distribute to this environment")
										setShowLocationActionModal({
											environment: environment,
											open: true,
										})
                                		setUpdate(Math.random())
									  }}
									  color="primary"
									>
										Send Job	
									</Button>
								}

                              </ButtonGroup>

                              <IconButton disabled={environment.Type === "cloud"} onClick={()=> {setIsExpanded(prev => !prev)}}>
                                {listItemExpanded === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </div>
                          </ListItemText>
                          {selectedOrganization.id !== undefined && environment?.org_id !== selectedOrganization.id ?
                                <ListItemText
                                  primary={
                                      <Tooltip
                                    title="Parent organization controlled environments. You can use, but not modify this environments. Contact an admin of your parent organization if you need changes to this."
                                    placement="top"
                                >
                                    <Chip
                                        label={"Parent"}
                                        variant="contained"
                                        color="secondary"
                                    />
                                </Tooltip>
                                  }
                                  style={{ textAlign: 'center', verticalAlign: 'middle', }}
                                  />
                                :
                                <Tooltip
                                    title={environment.Name === "Cloud" ? "Cloud environments cannot be distributed" : "Distributed to sub-organizations. This means the sub organizations can use this environment, but can not modify it."}
                                    placement="top"
                                >
                                    <IconButton
                                      sx={{":hover": {backgroundColor: "transparent"}}}
                                      disabled={ environment.Name === "Cloud" || userdata?.active_org?.role !== "admin" || (selectedOrganization.creator_org !== undefined && selectedOrganization.creator_org !== null && selectedOrganization.creator_org !== "" )? true : false}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowDistributionPopup(true)
                                        if(environment?.suborg_distribution?.length > 0){
                                          setSelectedSubOrg(environment.suborg_distribution)
                                        }else{
                                          setSelectedSubOrg([])
                                        }
                                        setSelectedEnvironment(environment.id)
                                      }}>
                                      <Checkbox
                                        disabled={ environment.Name === "Cloud" || userdata?.active_org?.role !== "admin" || (selectedOrganization.creator_org !== undefined && selectedOrganization.creator_org !== null && selectedOrganization.creator_org !== "" )? true : false}
                                        checked={isDistributed}
                                        style={{ }}
                                        color="secondary"
                                    />
                                    </IconButton>
                                </Tooltip>
                          }
          </ListItem>
          <Collapse in={listItemExpanded === index} timeout="auto" unmountOnExit>
          	<Grid container justifyContent="center" style={{minWidth: 850, maxWidth: 850, }}>
    			<Grid item xs={12} sm={8} md={6}>
                    <div style={{minWidth: 750, maxWidth: 750, minHeight: 350, display: 'flex', justifyContent: "center", backgroundColor: "transparent", }}>
                        <div style={{ paddingTop: 50, paddingBottom: 100, }}>
                          <Typography variant="h6">
                            Self-Hosted Orborus instance
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Orborus is the Shuffle queue handler that runs your hybrid workflows and manages pipelines. It can be run in Docker/k8s container on your server or in your cluster. Follow the steps below, and configure as need be.
                          </Typography>
        
                        <Tabs
                          value={installationTab}
                          indicatorColor="primary"
                          textColor="secondary"
                          onChange={(e, inputValue) => {
                            setInstallationTab(inputValue)
                          }}
                          aria-label="disabled tabs example"
                          variant="scrollable"
                          scrollButtons="auto"
                            style={{textAlign: "center", marginTop: 25, }}
                        >
                          <Tab
                            value={0}
                          label=<span>
                            <img
                            src="/icons/docker.svg"
                            style={{ width: 20, height: 20, marginRight: 10, }}
                            /> Verbose (default)
                          </span>
                          />
                          <Tab
                            value={1}
                          label=<span>
                            <img
                            src="/icons/docker.svg"
                            style={{ width: 20, height: 20, marginRight: 10, }}
                            /> Scale
                          </span>
                          />
                          <Tab
                            value={2}
                          label=<span>
                            <img
                            src="/icons/k8s.svg"
                            style={{ width: 20, height: 20, marginRight: 10, }}
                            /> k8s 
                          </span>
                          />
                          </Tabs>
                          <Typography variant="body1" color="textSecondary" style={{marginTop: 15, }}>
                            {installationTab === 2 ?
                            <span>
                                Check our <a href="https://docs.docker.com/get-started/get-docker/" target="_blank" rel="noopener noreferrer" style={{textDecoration: "none", color: "#f85a3e",}}>Kubernetes documentation</a> for more information on how to run Shuffle on Kubernetes. The status of the node will change when connected.
                            </span>
                            :
                            <span>
                                1. <a href="https://docs.docker.com/get-started/get-docker/" target="_blank" rel="noopener noreferrer" style={{textDecoration: "none", color: "#f85a3e",}}>Ensure Docker is installed</a> and the target server can reach '{globalUrl}'
                            </span>
                          }
        
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            {installationTab === 2 ? null : 
                            "2. Run this command on the server you want to run workflows or store Pipeline data on"}
                          </Typography>
        
                          {installationTab === 2 ? null : 
                          <div
                            style={{
                              marginTop: 10, 
                              padding: 15,
                              minWidth: "50%",
                              maxWidth: "100%",
                              backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                              overflowY: "auto",
                              // Have it inline
                              borderRadius: theme.palette?.borderRadius,
                            }}
                          >
                            <div style={{ display: "flex", position: "relative", }}>
                              <code
                                contenteditable="true"
                                id="orborus_command"
                                style={{
                                  // Wrap if larger than X
                                  whiteSpace: "pre-wrap",
                                  overflow: "auto",
                                  marginRight: 30,
                                }}
                              >
                                {getOrborusCommand(environment)}
                              </code>

        						<div
        						    style={{
										position: "absolute",
        								right: 0,
        								top: -10,
									}}
        						>
        						    <IconButton
        						        onClick={() => {
        						            navigator.clipboard.writeText(orborusCommandWrapper())
        						            toast("Copied to clipboard")
        						        }}
        						    >
        						        <FileCopyIcon />
        						    </IconButton>
        						</div>
                            </div>
        
                            <Divider style={{marginTop: 25, marginBottom: 10, }}/>
                            Configure HTTP Proxies: <Checkbox 
                              id="shuffle_skip_proxies"
                              onClick={() => {
                                if (commandController.proxies === undefined) { 
                                  commandController.proxies = true 
                                } else {
                                  commandController.proxies = !commandController.proxies
                                }
        
                                setCommandController(commandController)
                                setUpdate(Math.random())
                              }}
                            />
                            <div />
                            Disable Pipelines & Data Lake: <Checkbox 
                              id="shuffle_skip_pipelines"
                              onClick={() => {
                                if (commandController.pipelines === undefined) { 
                                  commandController.pipelines = true 
                                } else {
                                  commandController.pipelines = !commandController.pipelines
                                }
                                setCommandController(commandController)
                                        setUpdate(Math.random())
                              }}
                            />
                            </div>
                        }
        
                          <Typography variant="body1" color="textSecondary" style={{marginTop: 15, }}>
                            {installationTab === 2 ? null : 
                            <span>
                                3. Verify if the node is running. Try to refresh the page a little while after running the command.
                            </span>
                            }
                          </Typography>
                        </div>
                      </div>
                      </Grid>
                      </Grid>
                    </Collapse>
        
                            {showCPUAlert === false ? null : (
                              <ListItem
                                key={index + "_cpu"}
                                style={{ backgroundColor: bgColor }}
                              >
                                <div
                                  style={{
                                    border: "1px solid #f85a3e",
                                    borderRadius: theme.palette?.borderRadius,
                                    marginTop: 10,
                                    marginBottom: 10,
                                    padding: 15,
                                    textAlign: "center",
                                    height: 70,
                                    backgroundColor: theme.palette.surfaceColor,
                                    display: "flex",
                                  }}
                                >
                                  <div style={{ flex: 2, overflow: "hidden" }}>
                                    <Typography variant="body1">
                                      90% CPU the server(s) hosting the Shuffle App
                                      Runner (Orborus) was found.
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      Need help with High Availability and Scale?{" "}
                                      <a
                                        href="/docs/configuration#scale"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          textDecoration: "none",
                                          color: "#f85a3e",
                                        }}
                                      >
                                        Read documentation
                                      </a>{" "}
                                      and{" "}
                                      <a
                                        href="https://shuffler.io/contact"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          textDecoration: "none",
                                          color: "#f85a3e",
                                        }}
                                      >
                                        Get in touch
                                      </a>
                                      .
                                    </Typography>
                                  </div>
                                  <div
                                    style={{ flex: 1, display: "flex", marginLeft: 30 }}
                                  >
                                    <Button
                                      style={{
                                        borderRadius: 25,
                                        width: 200,
                                        height: 50,
                                        marginTop: 8,
                                      }}
                                      variant="outlined"
                                      color="secondary"
                                      onClick={() => {
                                        // dismiss -> get envs
                                        changeRecommendation(
                                          userdata.priorities[foundIndex],
                                          "dismiss",
                                        );
                                      }}
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              </ListItem>
                            )}
         </>
                  );
                })
    ) }
            </List>
            </div>
          </div>
        </div>

		{showLocationActionModal !== undefined && showLocationActionModal !== null && showLocationActionModal?.open === true ? 
			<div>
				<LocationActionModal 
					showLocationActionModal={showLocationActionModal}
				/>
			</div>

		: null }
    </div>


    )
});

export default EnvironmentTab;
