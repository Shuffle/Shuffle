import React, { memo, useContext, useEffect, useState } from 'react';
import {
    Edit as EditIcon,
    SelectAll as SelectAllIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    DragIndicator as DragIndicatorIcon,
    Close as CloseIcon,  
    LockOpen as LockOpenIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import theme from "../theme.jsx";
import Markdown from "react-markdown";
import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import { isMobile } from "react-device-detect"
import PaperComponent from "../components/PaperComponent.jsx";
import { CodeHandler, Img, OuterLink, } from '../views/Docs.jsx'
import { v4 as uuidv4} from "uuid";

import {
    Divider, 
	List, 
	ListItem, 
	ListItemText, 
	IconButton, 
	Tooltip, 
	Chip, 
	Checkbox,
    Typography,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Select,
    FormControl,
    InputLabel,
    MenuItem,
    FormControlLabel,
    InputAdornment,
    Grid,
    Zoom,
    Paper,
    Skeleton,
	Link,
} from "@mui/material";

import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Configure,
  connectSearchBox,
  connectHits,
  connectHitInsights,
  RefinementList,
  ClearRefinements,
  connectStateResults
} from "react-instantsearch-dom";
import aa from "search-insights";
import { Context } from '../context/ContextApi.jsx';

const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
)

const AppAuthTab = memo((props) => {
    const { globalUrl, userdata, isCloud, selectedOrganization } = props;
    const [selectedAuthentication, setSelectedAuthentication] = React.useState({});
    const [authentication, setAuthentication] = React.useState([]);
    const [selectedUserModalOpen, setSelectedUserModalOpen] = React.useState(false);
    const [authenticationFields, setAuthenticationFields] = React.useState([]);
    const [selectedAuthenticationModalOpen, setSelectedAuthenticationModalOpen] = React.useState(false);
    const [appAuthenticationGroupEnvironment, setAppAuthenticationGroupEnvironment] = React.useState("");
    const [environments, setEnvironments] = React.useState([]);
    const [listItemExpanded, setListItemExpanded] = React.useState(-1);
    const [appAuthenticationGroupModalOpen, setAppAuthenticationGroupModalOpen] = React.useState(false);
    const [appAuthenticationGroupId, setAppAuthenticationGroupId] = React.useState("");
    const [appAuthenticationGroups, setAppAuthenticationGroups] = React.useState([]);
    const [appAuthenticationGroupName, setAppAuthenticationGroupName] = React.useState("");
    const [appAuthenticationGroupDescription, setAppAuthenticationGroupDescription] = React.useState("");
    const [appsForAppAuthGroup, setAppsForAppAuthGroup] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showAppModal, setShowAppModal] = useState(false)
    const [showAuthenticationLoader, setShowAuthenticationLoader] = useState(true)
    const [showAppAuthGroupLoader, setShowAppAuthGroupLoader] = useState(true)
    const changeDistribution = (data) => {
        //changeDistributed(data, !isDistributed)
        editAuthenticationConfig(data.id, "suborg_distribute")
    }
    
    useEffect(() => {
        getAppAuthentication();
        getAppAuthenticationGroups();
        getEnvironments();
    }, [])

    const getAppAuthentication = () => {
        fetch(globalUrl + "/api/v1/apps/authentication", {
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
                if (responseJson.success === true) {
                    setAuthentication(responseJson.data);
                    setShowAuthenticationLoader(false)
                } else {
                    toast("Failed getting authentications");
                }
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const updateAppAuthentication = (field) => {
        setSelectedAuthenticationModalOpen(true);
        setSelectedAuthentication(field);
        //{selectedAuthentication.fields.map((data, index) => {
        var newfields = [];
        for (var key in field.fields) {
            newfields.push({
                key: field.fields[key].key,
                value: "",
            });
        }
        setAuthenticationFields(newfields);
    };
    const saveAuthentication = (authentication) => {
        const data = authentication;
        const url = globalUrl + "/api/v1/apps/authentication";

        fetch(url, {
            mode: "cors",
            method: "PUT",
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
                        // Check if .reason exists
                        if (responseJson.reason !== undefined) {
                            toast("Failed changing authentication: " + responseJson.reason);
                        } else {
                            toast("Failed changing authentication");
                        }
                    } else {
                        getAppAuthentication();


                        setSelectedAuthentication({});
                        setSelectedAuthenticationModalOpen(false);
                    }
                })
            )
            .catch((error) => {
                toast("Err: " + error.toString());
            });
    };

    const deleteAuthentication = (data) => {
        toast("Deleting auth " + data.label);

        // Just use this one?
        const url = globalUrl + "/api/v1/apps/authentication/" + data.id;
        console.log("URL: ", url);
        fetch(url, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) =>
                response.json().then((responseJson) => {
                    if (responseJson.success === false) {
                        toast("Failed deleting auth");
                    } else {
                        // Need to wait because query in ES is too fast
                        setTimeout(() => {
                            getAppAuthentication();
                        }, 1000);
                        //toast("Successfully deleted authentication!")
                    }
                })
            )
            .catch((error) => {
                console.log("Error in userdata: ", error);
            });
    };

    const editAuthenticationConfig = (id, parentAction) => {
        const data = {
            id: id,
            action: parentAction !== undefined && parentAction !== null ? parentAction : "assign_everywhere",
        }

        const url = globalUrl + "/api/v1/apps/authentication/" + id + "/config";

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
                        toast("Failed overwriting appauth");
                    } else {
                        toast("Successfully updated auth!");
                        setSelectedUserModalOpen(false);
                        setTimeout(() => {
                            getAppAuthentication();
                        }, 1000);
                    }
                })
            )
            .catch((error) => {
                toast("Err: " + error.toString());
            });
    };

    const editAuthenticationModal = selectedAuthenticationModalOpen ? (
        <Dialog
            open={selectedAuthenticationModalOpen}
            onClose={() => {
                setSelectedAuthenticationModalOpen(false);
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
                    Edit authentication for {selectedAuthentication.app.name.replaceAll("_", " ")} (
                    {selectedAuthentication.label})
                </span>
                <Typography variant="body1" color="textSecondary" style={{ marginTop: 10 }}>
                    You can <b>not</b> see the previous values for an authentication while editing. This is to keep your data secure. You can overwrite one- or multiple fields at a time.
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography style={{ marginBottom: 0, marginTop: 10 }}>
                    Authentication Label
                </Typography>
                <TextField
                    style={{
                        backgroundColor: theme.palette.innerTextfieldStyle.backgroundColor,
                        marginTop: 0,
                    }}
                    InputProps={{
                        style: {
                            height: 50,
                            color: "white",
                        },
                    }}
                    color="primary"
                    required
                    fullWidth={true}
                    placeholder={selectedAuthentication.label}
                    defaultValue={selectedAuthentication.label}
                    type="text"
                    margin="normal"
                    variant="outlined"
                    onChange={(e) => {
                        selectedAuthentication.label = e.target.value
                    }}
                />

                <Divider />
                {selectedAuthentication.type === "oauth" || selectedAuthentication.type === "oauth2" || selectedAuthentication.type === "oauth2-app" ?
                    <div>
                        <Typography variant="body1" color="textSecondary" style={{ marginBottom: 0, marginTop: 10 }}>
                            Only the name and url can be modified for Oauth2/OpenID connect. Please remake the authentication if you want to change the other fields like Client ID, Secret, Scopes etc.
                        </Typography>
                    </div>
                    : null}

                {selectedAuthentication.fields.map((data, index) => {
                    var fieldname = data.key.replaceAll("_", " ")
                    if (fieldname.endsWith(" basic")) {
                        fieldname = fieldname.substring(0, fieldname.length - 6)
                    }

                    if (selectedAuthentication.type === "oauth" || selectedAuthentication.type === "oauth2" || selectedAuthentication.type === "oauth2-app") {
                        if (selectedAuthentication.fields[index].key !== "url") {
                            return null
                        }
                    }


                    //console.log("DATA: ", data, selectedAuthentication)
                    return (
                        <div key={index}>
                            <Typography style={{ marginBottom: 0, marginTop: 10 }}>
                                {fieldname}
                            </Typography>
                            <TextField
                                style={{
                                    backgroundColor: theme.palette.innerTextfieldStyle.backgroundColor,
                                    marginTop: 0,
                                }}
                                InputProps={{
                                    style: {
                                        height: 50,
                                        color: "white",
                                    },
                                }}
                                color="primary"
                                required
                                fullWidth={true}
                                placeholder={fieldname}
                                type="text"
                                id={`authentication-${index}`}
                                margin="normal"
                                variant="outlined"
                                onChange={(e) => {
                                    authenticationFields[index].value = e.target.value;
                                    setAuthenticationFields(authenticationFields);
                                }}
                            />
                        </div>
                    );
                })}
            </DialogContent>
            <DialogActions>
                <Button
                    style={{ borderRadius: "2px", textTransform: "none", fontSize: 16 }}
                    onClick={() => setSelectedAuthenticationModalOpen(false)}
                    color="primary"
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "2px", textTransform: "none", fontSize: 16, color: "#1a1a1a", backgroundColor: "#FF8444" }}
                    onClick={() => {
                        var error = false;
                        var fails = 0
                        for (var key in authenticationFields) {
                            const item = authenticationFields[key];
                            if (item.value.length === 0) {
                                fails += 1
                                console.log("ITEM: ", item);
                                // var currentnode = cy.getElementById(data.id)
                                var textfield = document.getElementById(
                                    `authentication-${key}`
                                );
                                if (textfield !== null && textfield !== undefined) {
                                    console.log("HANDLE ERROR FOR KEY ", key);
                                }
                                error = true;
                            }
                        }

                        if (selectedAuthentication.type === "oauth" || selectedAuthentication.type === "oauth2" || selectedAuthentication.type === "oauth2-app") {
                            selectedAuthentication.fields = []
                        }

                        if (error && fails === authenticationFields.length) {
                            toast("Updating auth with new name only")
                            saveAuthentication(selectedAuthentication);
                        } else {
                            toast("Saving new version of this authentication");
                            selectedAuthentication.fields = authenticationFields;
                            saveAuthentication(selectedAuthentication);
                        }
                    }}
                    color="primary"

                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    ) : null;

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
    
            // Helper info for users in case they have a large queue and don't know about queue flushing
            if (responseJson !== undefined && responseJson !== null && responseJson.length > 0) {
              if (responseJson.length === 1 && responseJson[0].Type !== "cloud") {
                  setListItemExpanded(0)
              }
    
              for (var i = 0; i < responseJson.length; i++) {
                const env = responseJson[i];
    
                // Check if queuesize is too large
                if (
                  env.queue !== undefined &&
                  env.queue !== null &&
                  env.queue > 100
                ) {
                  toast(
                    "Queue size for " +
                      env.name +
                      " is very large. We recommend you to reduce it by flushing the queue before continuing.",
                  );
                  break;
                }
              }
            }
          })
          .catch((error) => {
            toast(error.toString());
          });
      };
    
    const getAppAuthenticationGroups = () => {
    //console.log("DEBUG: Skipping app auth group loading")
    //return

    fetch(globalUrl + "/api/v1/authentication/group", {
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
        if (responseJson.success === true) {
            setAppAuthenticationGroups(responseJson.data);
            setShowAppAuthGroupLoader(false)
        }
        })
        .catch((error) => {
        toast(error.toString());
        });
    };

      const deleteAppAuthenticationGroup = (appAuthGroupId) => { 
        const url = `${globalUrl}/api/v1/authentication/group/${appAuthGroupId}`
        fetch(url, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          if (response.status !== 200) {
            console.log("Status not 200 for deleting app auth group");
          }
  
          return response.json();
        })
        .then((responseJson) => {
          if (responseJson.success === false) {
            toast("Failed to delete app authentication group");
          } else {
            toast("App authentication group deleted")
            getAppAuthenticationGroups()
          }
        })
        .catch((error) => {
          toast(error.toString())
        })
    }

    const createAppAuthenticationGroup = (name, environment, description, appAuthIds) => {
        // Makes list of ids into a full-on list of auth, but just with the ID
        // The backend fills in the rest
        console.log("INput auth: ", appAuthIds)
        let app_auths = appAuthIds.map((appAuthId) => {
          return { id: appAuthId };
        })
    
        var parsedAppGroup = {
            label: name,
            environment: environment,
            description: description,
            app_auths: app_auths
          }
    
        if (appAuthenticationGroupId !== undefined && appAuthenticationGroupId !== null && appAuthenticationGroupId !== "") {
            parsedAppGroup.id = appAuthenticationGroupId
        }
    
        fetch(globalUrl + "/api/v1/authentication/group", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(parsedAppGroup),
        })
          .then((response) => {
            if (response.status !== 200) {
              throw new Error("Failed to create app authentication group");
            }
    
            return response.json();
          })
          .then((responseJson) => {
            if (responseJson.success === false) {
                toast("Failed to create. Please try again, or contact support@shuffler.io")
            } else {
                // Close the modal
                setAppAuthenticationGroupModalOpen(false)
    
                toast("App authentication group created")
                getAppAuthenticationGroups()
            }
          })
          .catch((error) => {
            toast(error.toString());
          });
      };

      const handleAppAuthGroupCheckbox = (data) => {
        //let groupApp = data.app.id
        var newappauth = appsForAppAuthGroup
        if (appsForAppAuthGroup.includes(data.app.id)) {
            newappauth = newappauth.filter((item) => item !== data.app.id)
        }
    
        if (appsForAppAuthGroup.includes(data.id)) {
            // Remove app from app auth group
            newappauth = newappauth.filter((item) => item !== data.id)
            setAppsForAppAuthGroup(newappauth)
            return
        }
    
        for (var i = 0; i < authentication.length; i++) {
            if (authentication[i].id === data.id) {
                continue
            }
    
            if (!appsForAppAuthGroup.includes(authentication[i].id)) {
                continue
            }
    
            if (authentication[i].app.id === data.app.id) {
                // Remove app from app auth group
                newappauth = newappauth.filter((item) => item !== authentication[i].id)
                toast(`App ${data.app.name} is already in this group`)
            }
        }
    
        setAppsForAppAuthGroup(newappauth.concat(data.id))
      }
  
    const authenticationView = appAuthenticationGroupModalOpen ? 
    (
        <div>
          {/* (appAuthenticationGroupModalOpen : { */}
          {appAuthenticationGroupModalOpen && (
            <Dialog
              open={appAuthenticationGroupModalOpen}
              onClose={() => {
                setAppAuthenticationGroupModalOpen(false);
    
                  setAppAuthenticationGroupId("")
                setAppAuthenticationGroupName("")
                setAppAuthenticationGroupEnvironment("")
                setAppAuthenticationGroupDescription("")
                setAppsForAppAuthGroup([])
              }}
              PaperProps={{
                sx: {
                    borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                    border: theme?.palette?.DialogStyle?.border,
                    minWidth: "1000px",
                    padding: "25px", 
                    paddingLeft: "50px", 
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
              sx={{
                "& .MuiDialog-paper": {
                  backgroundColor: "rgb(26, 26, 26)",
                },
              }}
            >
              <DialogTitle>
                <span style={{ color: "white" }}>App Authentication Groups</span>
              </DialogTitle>
    
              <DialogContent style={{marginLeft: 0, paddingLeft: 0, }}>
                <div style={{display: "flex", position: "sticky", top: 0, zIndex: 1, backgroundColor: theme.palette.surfaceColor, borderRadius: theme.palette?.borderRadius, padding: 20, marginBottom: 10, }}>
                      <div style={{marginRight: 50, minWidth: 250, }}>
                      <Typography style={{marginTop: 10, }}>
                          Name
                      </Typography>
                      <TextField
                        color="primary"
                        label="Name"
                        style={{ backgroundColor: theme.palette.inputColor }}
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
                        placeholder="Name"
                        id="namefield"
                        margin="normal"
                        variant="outlined"
                          defaultValue={appAuthenticationGroupName}
                        onChange={(event) => {
                          setAppAuthenticationGroupName(event.target.value);
                        }}
                      />
                  </div>
                    <div style={{marginRight: 50, }}>
                    <Typography style={{marginTop: 10, marginBottom: 10}}>
                      Evironment
                    </Typography>
                    {environments !== undefined && environments !== null && environments.length > 0 ?
                      <Select
                        defaultValue={appAuthenticationGroupEnvironment === "" ? environments[0].Name : appAuthenticationGroupEnvironment}
                        onChange={(e) => {
                          setAppAuthenticationGroupEnvironment(e.target.value);
                        }}
                      >
                        {environments.map((env, index) => {
                            return (
                                <MenuItem key={index} value={env.Name}>
                                    {env.Name}
                                </MenuItem>
                            )
                        })}
                      </Select>
                  : 
                    <Typography>
                          Locations failed to load. Please try again 
                    </Typography>
                  }
                </div>
                <div style={{marginTop: 65, }}>
                  <Button
                    style={{}}
                      disabled={appAuthenticationGroupName === "" || appAuthenticationGroupEnvironment === "" || appsForAppAuthGroup.length === 0}
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      createAppAuthenticationGroup(
                        appAuthenticationGroupName,
                        appAuthenticationGroupEnvironment,
                        appAuthenticationGroupDescription,
                        appsForAppAuthGroup,
                      );
                    }}
                  >
                    Set Group
                  </Button>
                </div>
                </div>
    
                  <Divider style={{marginTop: 10, marginBottom: 10, }}/>
    
                <div style={{marginLeft: 25, }}>
                  {/* Show a check box list of all app authentications to add to the auth group */}
                  <div>
                  {authentication.map((data, index) => {
                    var checked = data.checked
                    if (data.label !== undefined && data.label !== null && data.label.toLowerCase() === "kms shuffle storage") {
                        return null
                    }
    
                    if (checked === undefined || checked === null) {
                        checked = false
                    }
    
                    if (appsForAppAuthGroup.includes(data.id)) { 
                        checked = true
                    }
    
                    return (
                        <div key={index}>
                          <FormControlLabel
                            control={
                                <Tooltip
                                  title={data.app.name}
                                  placement="left"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', marginLeft: '5px', }}>
                                      <img 
                                        src={data.app.large_image ? data.app.large_image : '/images/no_image.png'}
                                        alt=""
                                        style={{ borderRadius: theme.palette?.borderRadius, width: 50, height: 50, marginRight: 10 }} 
                                      />
                                      <Checkbox
                                        checked={checked}
                                        onChange={(event) => {
                                          handleAppAuthGroupCheckbox(data)
                                        }}
                                        name={data.label}
                                        disabled={data.app.id in appsForAppAuthGroup}
                                      />
                                  </div>
                                </Tooltip>
                            }
                            label={data.label}
                          />
                        </div>
                      )
                  })}
                </div>
            </div>
    
    
              </DialogContent>
            </Dialog>
          )}

          
        </div>
    ): null

   

    const appModal = showAppModal ? (
      <Dialog
        open={showAppModal}
        onClose={() => {
          setShowAppModal(false);
        }}
        PaperProps={{
          sx: {
              borderRadius: theme?.palette?.DialogStyle?.borderRadius,
              border: theme?.palette?.DialogStyle?.border,
              width: '700px',
              maxWidth: '700px',
              overflowY: 'hidden',
              height: "600px",
              maxHeight: "600px",
              fontFamily: theme?.typography?.fontFamily,
              zIndex: 1000,
              '& .MuiDialogContent-root': {
                padding: '30px',
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
        <div style={{ overflowY: 'hidden',  }}>
          <DialogContent>
			  <Typography style={{ marginBottom: 0, fontSize: 24, textAlign: 'center', }}>
				Add App Authentication
			  </Typography>
          <InstantSearch searchClient={searchClient} indexName="appsearch">
            <CustomSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <CustomHits
              hitsPerPage={5}
              searchQuery={searchQuery}
              globalUrl={globalUrl}
              isCloud={isCloud !== true}
              userdata={userdata}
              getAppAuthentication={getAppAuthentication}
            />
          </InstantSearch>
          </DialogContent>
        </div>
      </Dialog>
    ) : null;    
    
    return (
        <div style={{width: "100%", minHeight: 1100, maxHeight: 1700, overflowY: "auto", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin',boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: '#212121',borderTopRightRadius: '8px', borderBottomRightRadius: 8, borderLeft: "1px solid #494949", }}>
          {appModal}
            <div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
            <div style={{ width: 'auto', display:'flex',}}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <h2 style={{ marginBottom: 8, marginTop: 0, color: "#FFFFFF" }}>App Authentication</h2>
                   <div>
                    <span style={{}}>
                      Control the authentication options for individual apps.
                      </span>
                      &nbsp;
                      <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href="/docs/organizations#app_authentication"
                          style={{ color: "#FF8444" }}
                      >
                          Learn more about App Authentication
                      </a>
                   </div>
                </div>

				{isCloud ? 
					<Button
						style={{ color: '#1a1a1a', textTransform: 'none', backgroundColor: "#FF8444", marginLeft:"auto", borderRadius: 4,fontSize: 16, minWidth: 162, height: 40, boxShadow:'none', }}
						variant="contained"
						color="primary"
						disabled={!isCloud}
						onClick={() => setShowAppModal(true)}
					>
						Add App Auth
					</Button>
				: null}
            </div>
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
                borderRadius: 4,
                    width: '100%', 
                    tableLayout: "auto", 
                    display: "table", 
                    minWidth: 800,
                    overflowX: "auto",
                    paddingBottom: 0
            }}>
                
                
                <ListItem style={{ width: "100%", paddingTop: 10, paddingBottom: 10, paddingRight: 10,  borderBottom: "1px solid #494949", display: 'table-row'}}>
                    
                {["Valid", "Label", "App Name", "Workflows", "Fields", "Edited", "Actions", "Distribution"].map((header, index) => (
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

                {showAuthenticationLoader
                    ? 
                    [...Array(6)].map((_, rowIndex) => (
                      <ListItem
                          key={rowIndex}
                          style={{
                              display: "table-row",
                              backgroundColor: "#212121",
                          }}
                      >
                          {Array(8)
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
                    : authentication?.length === 0 ? (
                        <div style={{ textAlign: 'center'}}>
                          <Typography style={{ color: "#FFFFFF", textAlign: 'center', padding: 20}}>
                          No authentication found. 
                      </Typography>
                        </div>
                    ):authentication.map((data, index) => {
                      var bgColor = "#212121";
                      if (index % 2 === 0) {
                          bgColor = "#1A1A1A";
                      }

                      //console.log("Auth data: ", data)
                      if (data.type === "oauth2") {
                          data.fields = [
                              {
                                  key: "url",
                                  value: "Secret. Replaced during app execution!",
                              },
                              {
                                  key: "client_id",
                                  value: "Secret. Replaced during app execution!",
                              },
                              {
                                  key: "client_secret",
                                  value: "Secret. Replaced during app execution!",
                              },
                              {
                                  key: "scope",
                                  value: "Secret. Replaced during app execution!",
                              },
                          ];
                      }

                      const isDistributed = data.suborg_distributed === true ? true : false;
                      var validIcon = <CheckCircleIcon style={{ color: "green" }} />
                      if (data.validation !== null && data.validation !== undefined && data.validation.valid === false) {

                          if (data.validation.changed_at === 0) {
                              validIcon = "" 
                          } else {
                              validIcon = <CancelIcon style={{ color: "red" }} />
                          }
                      }
                      return (
                        <ListItem key={index} style={{ backgroundColor: bgColor, borderBottomLeftRadius: authentication?.length - 1 === index ? 8 : 0, borderBottomRightRadius: authentication?.length - 1 === index ? 8 : 0, display: 'table-row' }}>
                              <ListItemText
                                  primary= {(
                                    <Tooltip title={data.validation !== null && data.validation !== undefined && data.validation.valid === true ? "Valid. Click to explore." : "Configuration failed. Click to learn why"} placement="top">
                                          <IconButton>
                                              {validIcon}
                                          </IconButton>
                                      </Tooltip>
                                  )}
                                  style={{ display: "table-cell", verticalAlign: 'middle', minWidth: 60 }}
                                  primaryTypographyProps={{
                                    style: {
                                      padding: "8px 8px 8px 15px",
                                    }
                                  }}
                                  onClick={() => {
                                      if (data.validation === null || data.validation === undefined) {
                                          return
                                      }

                                      if (data.validation.workflow_id === undefined || data.validation.workflow_id === null || data.validation.workflow_id.length === 0) {
                                          toast.warn("No workflow runs found for this auth yet. Check back later.")
                                          return
                                      }

                                      const url = `/workflows/${data.validation.workflow_id}?execution_id=${data.validation.execution_id}&node=${data.validation.node_id}`
                                      window.open(url, "_blank")
                                  }}
                              />
                              <ListItemText
                                  primary={data.label}
                                  style={{
                                      overflowX: "auto",
                                      display: "table-cell",
                                      verticalAlign: 'middle', 
                                      maxWidth: 250,
                                  }}
                                  primaryTypographyProps={{
                                    style: {
                                      padding: 8
                                    }
                                  }}
                              />
                              <ListItemText
                                  primary={
									  <Tooltip title={"Try the app in our API explorer"} placement="top">
										  <a href={`/apis/${data.app.id}`} style={{ color: "#FF8444", textDecoration: "none", cursor: "pointer", }} target="_blank" rel="noopener noreferrer">
											  {data?.app?.name?.replaceAll("_", " ")}
										  </a>
									  </Tooltip>
								  }
                                  primaryTypographyProps={{
                                    style: {
                                      padding: 8
                                    }
                                  }}
                                  style={{ marginLeft: 10, display: "table-cell", textAlign: 'center', verticalAlign: 'middle', padding: 8 }}
                              />
                              <ListItemText
                                  primary={
                                      data.workflow_count === null ? 0 : data.workflow_count
                                  }
                                  primaryTypographyProps={{
                                    style: {
                                      padding: 8
                                    }
                                  }}
                                  style={{
                                      display: "table-cell",
                                      textAlign: "center",
                                      overflow: "hidden",
                                      verticalAlign: 'middle',
                                  }}
                              />
                              <ListItemText
                                  primary={
                                      data.fields === null || data.fields === undefined
                                          ? ""
                                          : data.fields
                                              .map((data) => {
                                                  return data.key;
                                              })
                                              .join(", ")
                                  }
                                  primaryTypographyProps={{
                                    style: {
                                      padding: 8
                                    }
                                  }}
                                  style={{
                                      overflow: "auto",
                                      display: "table-cell",
                                      verticalAlign: 'middle'
                                  }}
                              />
                              <ListItemText
                                  style={{
                                      overflow: "hidden",
                                      display: "table-cell",
                                      verticalAlign: 'middle'
                                  }}
                                  primaryTypographyProps={{
                                    style: {
                                      padding: 8
                                    }
                                  }}
                                  primary={new Date(data.edited * 1000).toISOString()}
                              />
                              <ListItemText
                                style={{
                                  display: "table-cell",
                                  verticalAlign: 'middle'
                                }}
                                primaryTypographyProps={{ style: { display: "flex", flexDirection: 'row', padding: 8 } }}
                              >
                                <IconButton
                                  onClick={() => {
                                    updateAppAuthentication(data);
                                  }}
                                  disabled={data.org_id !== selectedOrganization.id}
                                >
                                  <img src="/icons/editIcon.svg" alt="Edit icon" color="secondary" />
                                </IconButton>
                                {data.defined ? (
                                  <Tooltip
                                    color="primary"
                                    title="Set for EVERY instance of this App being used in this organization"
                                    placement="top"
                                  >
                                    <IconButton
                                      style={{ }}
                                      disabled={
                                        data.defined === false || data.org_id !== selectedOrganization.id
                                      }
                                      onClick={() => {
                                        editAuthenticationConfig(data.id);
                                      }}
                                    >
                                      <SelectAllIcon color="secondary" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip
                                    color="primary"
                                    title="Must edit before you can set in all workflows"
                                    placement="top"
                                  >
                                    <IconButton
                                      onClick={() => {}}
                                      disabled={data.org_id !== selectedOrganization.id}
                                    >
                                      <SelectAllIcon color="secondary" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <IconButton
                                  style={{ }}
                                  disabled={data.org_id !== selectedOrganization.id}
                                  onClick={() => {
                                    deleteAuthentication(data);
                                  }}
                                >
                                  <img src='/icons/deleteIcon.svg' alt='delete icon' color="secondary" />
                                </IconButton>
                              </ListItemText>
                              <ListItemText primaryTypographyProps={{
                                    style: {
                                      padding: 8
                                    }
                                  }} style={{ display: "table-cell", textAlign: 'center', verticalAlign: 'middle'}} >
                                  {selectedOrganization.id !== undefined && data.org_id !== selectedOrganization.id ?
                                      <Tooltip
                                          title="Parent organization controlled auth. You can use, but not modify this auth. Contact an admin of your parent organization if you need changes to this."
                                          placement="top"
                                      >
                                          <Chip
                                              label={"Parent"}
                                              variant="contained"
                                              color="secondary"
                                              style={{display: "table-cell",}}
                                          />
                                      </Tooltip>
                                      :
                                      <Tooltip
                                          title="Distributed to sub-organizations. This means the sub organizations can use this authentication, but not modify it."
                                          placement="top"
                                      >
                                          <Checkbox
                                              disabled={selectedOrganization.creator_org !== undefined && selectedOrganization.creator_org !== null && selectedOrganization.creator_org !== "" ? true : false}
                                              checked={isDistributed}
                                              style={{ }}
                                              color="secondary"
                                              onClick={() => {
                                                  changeDistribution(data, !isDistributed)
                                              }}
                                          />
                                      </Tooltip>
                                  }
                              </ListItemText>
                          </ListItem>
                      );
                  })}
            </List>
            </div>
            {editAuthenticationModal}
            {authenticationView}
            <div style={{marginTop: 50, }}>

		{/*
        <div style={{ marginTop: 150, marginBottom: 20 }}>
          <h2 style={{ color: "#FFFFFF" }}>App Authentication Groups</h2>
          <span style={{ marginLeft: 0 }}>
            <b>Disabled until further notice</b>. Makes a workflow run replicate across all relevant authentications in an app auth group. Useful when the EXACT same workflow is supposed to run many times from one single input. {" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/organizations#app_authentication_groups"
              style={{ textDecoration: "none", color: "#FF8444" }}
            >
                Learn more about App Authentication Groups  
            </a>
          </span>

		  <br />
          <Button
            style={{ marginTop: 20, backgroundColor: "grey", color: "#1a1a1a", borderRadius: 4, fontSize: 16, boxShadow: "none", textTransform: "none" }}
            variant="contained"
            color="primary"
            onClick={() => {
			  if (environments !== undefined && environments !== null && environments.length > 0) {
				  setAppAuthenticationGroupEnvironment(environments[0].Name)
			  }

              setAppAuthenticationGroupModalOpen(true)
            }}
            disabled={true}
          >
            Add Group
          </Button>
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
            }}
        >
            <ListItem style={{ width: "100%", borderBottom: "1px solid #494949", display: "table-row" }}>
                    {["Label", "Environment", "App Auth", "Created At", "Actions"].map((header, index) => (
                        <ListItemText
                            key={index}
                            primary={header}
                            style={{
                              display: "table-cell",
                              padding: index === 0 ? "0px 8px 8px 15px": "0px 8px 8px 8px",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              borderBottom: "1px solid #494949",
                              position: "sticky",}}
                        />
                    ))}
                </ListItem>
            {showAppAuthGroupLoader ? 
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
                  : appAuthenticationGroups.length === 0 ? (
                    <div style={{ textAlign: 'center'}}>
                        <Typography style={{ color: "#FFFFFF", textAlign: 'center', padding: 20}}>
                            No authentication groups found.
                        </Typography>
                    </div>
            ): appAuthenticationGroups.map((data, index) => {
              var bgColor = "#212121";
              if (index % 2 === 0) {
                  bgColor = "#1A1A1A";
              }

			  if (data.app_auths === undefined || data.app_auths === null) {
				  data.app_auths = []
			  }

              return (
                <ListItem key={index} style={{display: 'table-row', padding: 8, backgroundColor: bgColor, borderBottomLeftRadius: appAuthenticationGroups?.length - 1 === index ? 8 : 0, borderBottomRightRadius: appAuthenticationGroups?.length - 1 === index ? 8 : 0 }}>
                  <ListItemText
                    primary={data.label}
                    style={{ display:'table-cell', verticalAlign: 'middle' }}
                    primaryTypographyProps={{
                      style: {
                        padding: "8px 8px 8px 15px",
                      }
                    }}
                  />
                  <ListItemText
                    primary={data.environment}
                    style={{ display:'table-cell', verticalAlign: 'middle'  }}
                  />
                  <ListItemText
                    primary={
                      <div style={{ display: 'flex' }}>
                        {data.app_auths.map((appAuth, index) => {
							if (appAuth.app.large_image === undefined || appAuth.app.large_image === null || appAuth.app.large_image === "") {
								const foundImage = authentication.find((auth) => auth.app.id === appAuth.app.id)
								if (foundImage !== undefined) {
									appAuth.app.large_image = foundImage.app.large_image

									appAuth.app.name = foundImage.app.name
								}
							}

							const tooltip = `${appAuth.app.name.replaceAll("_", " ")} (authname: ${appAuth.label})`

							return (
							  <Tooltip
								title={tooltip}
							  >
								<img
								  key={index}
								  src={appAuth.app.large_image}
								  alt={appAuth.app.name}
								  style={{ width: 30, height: 30, marginRight: 5 }}
								/>
							  </Tooltip>
                        	)
						})}
                      </div>
                    }
                    style={{ display:'table-cell', verticalAlign: 'middle'  }}
                  />
                  <ListItemText
                    primary={new Date(data.created * 1000).toLocaleDateString('en-GB')}
                    style={{ display:'table-cell', verticalAlign: 'middle'  }}
                  />
                  <ListItemText
                    primary={
                      <div style={{ display: 'flex' }}>
                        <IconButton
                          onClick={() => {
							  setAppAuthenticationGroupId(data.id)

							  setAppAuthenticationGroupName(data.label)
							  setAppAuthenticationGroupDescription(data.description)

							  setAppsForAppAuthGroup(data.app_auths.map((appAuth) => appAuth.id))
				  			  setAppAuthenticationGroupEnvironment(data.environment)
              				  setAppAuthenticationGroupModalOpen(true)
                          }}
                        >
                          <img src='/icons/editIcon.svg' alt='edit icon' style={{width: 24, height: 24}} />
                        </IconButton>
                        <IconButton
                          onClick={() => {
  							deleteAppAuthenticationGroup(data.id) 
                          }}
                        >
                          <img src='/icons/deleteIcon.svg' alt='delete icon' style={{width: 24, height: 24}}/>
                        </IconButton>
                      </div>
                    }
                    style={{ display:'table-cell', verticalAlign: 'middle'  }}
                  />

                </ListItem>
              );
            }
          )}
          		</List>
			  </div>
			
			</div>
			*/}
		  </div> 
		</div>
	  </div>
    );
});

export default AppAuthTab;


const SearchBox = ({ currentRefinement, refine, isSearchStalled, searchQuery, setSearchQuery }) => {
  const handleSearch = (e) => {
    refine(searchQuery.trim());
  };

  return (
    <form noValidate action="" role="search">
      <TextField
        value={searchQuery}
        fullWidth
        style={{
          backgroundColor: theme.palette.textFieldStyle.backgroundColor,
          marginTop: 20,
          borderRadius: 4,
          fontSize: 16,
        }}
        InputProps={{
          style: {
            color: "white",
            fontSize: "1em",
            height: 50,
            borderRadius: 4,
            backgroundColor: theme.palette.textFieldStyle.backgroundColor
          },
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon style={{ marginLeft: 5 }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {searchQuery?.length > 0 && (
                <ClearIcon
                  style={{
                    color: "white",
                    cursor: "pointer",
                    marginRight: 10
                  }}
                  onClick={() => {
                    setSearchQuery('')
                    // removeQuery("q");
                    refine('')
                  }}
                />
              )}
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgb(248, 106, 62), rgb(243, 64, 121))",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  width: 100,
                  height: 35,
                  borderRadius: 17.5,
                  cursor: "pointer",
                }}
              >
                Search
              </button>
            </InputAdornment>
          ),

        }}
        autoComplete="off"
        color="primary"
        placeholder="Search more than 2500 Apps"
        id="shuffle_search_field"
        onChange={(event) => {
          setSearchQuery(event.currentTarget.value);
          // removeQuery("q");
          refine(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if(event.key === "Enter") {
            event.preventDefault();
          }
        }}
        limit={5}
      />
      {/*isSearchStalled ? 'My search is stalled' : ''*/}
    </form>
  );
};

const Hits = ({
  hits,
  insights,
  setIsAnyAppActivated,
  searchQuery,
  isCloud,
  globalUrl,
  userdata,
  getAppAuthentication
}) => {
  const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
  const [selectedAppData, setSelectedAppData] = useState({})
  const [appid, setAppId] = useState("")
  const [selectedAuthentication, setSelectedAuthentication] = useState({})
  const [authenticationModalOpen, setAuthenticationModalOpen] = useState(false)
  const [authenticationType, setAuthenticationType] = React.useState("");
  const [appAuthentication, setAppAuthentication] = useState([]);
  const [selectedMeta, setSelectedMeta] = useState(undefined);
  const [selectedAction, setSelectedAction] = useState(
    {
      "app_name": selectedAppData.name,
      "app_id": selectedAppData.id,
      "app_version": selectedAppData.version,
      "large_image": selectedAppData.large_image,
    }
  )
  const navigate = useNavigate();

  const normalizedString = (name) => {
    if (typeof name === 'string') {
      return name.replace(/_/g, ' ');
    } else {
      return name;
    }
  };


  let workflowDelay = 0;
  const isHeader = true;
  const paperStyle = {
    color: "rgba(241, 241, 241, 1)",
    padding: isHeader ? null : 15,
    cursor: "pointer",
    width: '100%',
    maxHeight: 96,
    borderRadius: 4,
    transition: 'background-color 0.3s ease',
  };

  const base64_decode = (str) => {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  };

  const handleAppAuthenticationType = (selectedAppData)=> {

    if (selectedAppData.authentication === undefined || selectedAppData.authentication === null) {
      setAuthenticationType({
      type: "",
      })

      selectedAppData.authentication = {
        type: "",
        required: false,
      }
    } else {
      setAuthenticationType(
        selectedAppData.authentication.type === "oauth2-app" || (selectedAppData.authentication.type === "oauth2" && selectedAppData.authentication.redirect_uri !== undefined && selectedAppData.authentication.redirect_uri !== null) ? {
        type: selectedAppData.authentication.type,
        redirect_uri: selectedAppData.authentication.redirect_uri,
        refresh_uri: selectedAppData.authentication.refresh_uri,
        token_uri: selectedAppData.authentication.token_uri,
        scope: selectedAppData.authentication.scope,
        client_id: selectedAppData.authentication.client_id,
        client_secret: selectedAppData.authentication.client_secret,
        grant_type: selectedAppData.authentication.grant_type,
      } : {
        type: "",
      }
      )
    }
  }

  function Heading(props) {
    const element = React.createElement(
      `h${props.level}`,
      { style: { marginTop: 40 } },
      props.children
    );
    return (
      <Typography>
        {props.level !== 1 ? (
          <Divider
            style={{
              width: "90%",
              marginTop: 40,
              backgroundColor: theme.palette.inputColor,
            }}
          />
        ) : null}
        {element}
      </Typography>
    );
  }

  const getAppDocs = (appname, location, version) => {
    fetch(`${globalUrl}/api/v1/docs/${appname}?location=${location}&version=${version}`, {
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          //toast("Successfully GOT app "+appId)
        } else {
          //toast("Failed getting app");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
		  if (responseJson.meta !== undefined && responseJson.meta !== null && Object.getOwnPropertyNames(responseJson.meta).length > 0) {
			  setSelectedMeta(responseJson.meta)
		  }

          if (responseJson.reason !== undefined && responseJson.reason !== undefined && responseJson.reason.length > 0) {
            if (!responseJson.reason.includes("404: Not Found") && responseJson.reason.length > 25) {
			  // Translate <img> into markdown ![]()
			  const imgRegex = /<img.*?src="(.*?)"/g;
			  const newdata = responseJson.reason.replace(imgRegex, '![]($1)');
              setSelectedAppData(prevState => ({
                ...prevState,
                documentation: newdata,
              }));
            }
          }
        }

      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const handleDecodeOfOpenApiData = (data) => {
    var appexists = false;
    var parsedapp = {};

    if (data.app !== undefined && data.app !== null) {
      var parsedBaseapp = "";
      try {
        parsedBaseapp = base64_decode(data.app);
      } catch (e) {
        parsedBaseapp = data;
      }

      parsedapp = JSON.parse(parsedBaseapp);
      parsedapp.name = parsedapp.name.replaceAll("_", " ");

      appexists =
        parsedapp.name !== undefined &&
        parsedapp.name !== null &&
        parsedapp.name.length !== 0;
      if(parsedapp?.id.length > 0){
        setSelectedAppData(parsedapp)
        handleAppAuthenticationType(parsedapp)
        const apptype = selectedAppData?.generated === false ? "python" : "openapi"
        getAppDocs(parsedapp.name, apptype, parsedapp.version);
        setAuthenticationModalOpen(true);
      }
    }

    if (data.openapi === undefined || data.openapi === null) {
      return;
    }

    var parsedDecoded = "";
    try {
      parsedDecoded = base64_decode(data.openapi);
    } catch (e) {
      parsedDecoded = data;
    }

    parsedapp = JSON.parse(parsedDecoded);
    data =
      parsedapp.body === undefined ? parsedapp : JSON.parse(parsedapp.body);
  };

  const getAppData = (appid) => {
    if (appid === undefined || appid === null || appid.length === 0) {
      return;
    }
    const url = `${globalUrl}/api/v1/apps/${appid}/config`;

    fetch(url, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status !== 200) {
          toast.error("Failed to get app data or App doesn't. Please contact support@shuffler.io");
          return;
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          handleDecodeOfOpenApiData(responseJson);
        } else {
          toast.error("Failed to get app data or App doesn't exist");
        }
      })
      .catch((error) => {
        console.error("error for app is :", error);
      });
  };

  const UpdateAppAuthentication = (data) => {
    if (data === undefined || data === null) {
      return;
    }
    const filteredData = data.filter((appAuth) => appAuth?.app?.id === appid);
    if (filteredData.length === 0) {
      setAppAuthentication([]);
      setSelectedAuthentication({});
    } else {
      setAppAuthentication(filteredData);
      setSelectedAuthentication(filteredData[0]); 
    }
  };

  const HandleAppAuthentication = ()=>{

    const url = `${globalUrl}/api/v1/apps/authentication`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then((response) => {
      if (response.status !== 200) {
        return;
      }
      return response.json();
    }).then((responseJson) => {
      if (responseJson.success === true) {
        UpdateAppAuthentication(responseJson.data);
      } else {
        toast.error("Failed to get app authentication data");
      }
    }).catch((error) => {
      console.error("error for app is :", error);
    });
  }

  const handleAppAuthenticationNew = (data) => () => {

    const appid = data.objectID;
    if (appid > 0) {
      setAppId(appid);
    }
    if (appid.length > 0) {
      toast.info(`Getting authentication for ${data.name}. Please wait...`);
      getAppData(appid);
      HandleAppAuthentication();
    }
  }

  const AuthenticationData = (props) => {
    const selectedApp = props.app;

    const [authenticationOption, setAuthenticationOptions] = React.useState({
      app: JSON.parse(JSON.stringify(selectedApp)),
      fields: {},
      label: "",
      usage: [
        {
          // workflow_id: workflow.id,
        },
      ],
      id: uuidv4(),
      active: true,
    });

    if (
      selectedApp.authentication === undefined ||
      selectedApp.authentication.parameters === null ||
      selectedApp.authentication.parameters === undefined ||
      selectedApp.authentication.parameters.length === 0
    ) {
      return (
        <DialogContent style={{ textAlign: "center", marginTop: 50 }}>
          <Typography variant="h4" id="draggable-dialog-title" style={{ cursor: "move", }}>
            {selectedApp.name} does not require authentication
          </Typography>
        </DialogContent>
      );
    }

    authenticationOption.app.actions = [];

    for (let paramkey in selectedApp.authentication.parameters) {
      if (
        authenticationOption.fields[
        selectedApp.authentication.parameters[paramkey].name
        ] === undefined
      ) {
        authenticationOption.fields[
          selectedApp.authentication.parameters[paramkey].name
        ] = "";
      }
    }
    
    const setNewAppAuth = (appAuthData, refresh) => {
      setSelectedAuthentication(appAuthData);
      var headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      }
    
        headers["Org-Id"] = userdata?.active_org?.id
    
        fetch(globalUrl + "/api/v1/apps/authentication", {
          method: "PUT",
          headers: headers,
          body: JSON.stringify(appAuthData),
          credentials: "include",
        })
          .then((response) => {
            if (response.status !== 200) {
                console.log("Status not 200 for setting app auth :O!");
    
          if (response.status === 400) {
            toast.error("Failed setting new auth. Please try again", {
              "autoClose": true,
            })
          }
        }
    
            return response.json();
          })
          .then((responseJson) => {
            if (!responseJson.success) {
              toast.error("Error: " + responseJson.reason, {
          "autoClose": false,
          })
    
            } else {
              HandleAppAuthentication()
              setAuthenticationModalOpen(false)
              getAppAuthentication()
            }
          })
          .catch((error) => {
            console.log("New auth error: ", error.toString());
          });
      };

    const handleSubmitCheck = () => {
      if (authenticationOption.label.length === 0) {
        authenticationOption.label = `Auth for ${selectedApp.name}`;
      }
      for (let paramkey in selectedApp.authentication.parameters) {
        if (
          authenticationOption.fields[
            selectedApp.authentication.parameters[paramkey].name
          ].length === 0
        ) {
          if (
            selectedApp.authentication.parameters[paramkey].value !== undefined &&
            selectedApp.authentication.parameters[paramkey].value !== null &&
            selectedApp.authentication.parameters[paramkey].value.length > 0
          ) {
            authenticationOption.fields[
              selectedApp.authentication.parameters[paramkey].name
            ] = selectedApp.authentication.parameters[paramkey].value;
          } else {
            if (
              selectedApp.authentication.parameters[paramkey].schema.type === "bool"
            ) {
              authenticationOption.fields[
                selectedApp.authentication.parameters[paramkey].name
              ] = "false";
            } else {
              toast(
                "Field " +
                selectedApp.authentication.parameters[paramkey].name +
                " can't be empty"
              );
              return;
            }
          }
        }
      }

      var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
      var newFields = [];
      for (let authkey in newAuthOption.fields) {
        const value = newAuthOption.fields[authkey];
        newFields.push({
          "key": authkey,
          "value": value,
        });
      }

      newAuthOption.fields = newFields
      setNewAppAuth(newAuthOption)
    }

  if (authenticationOption.label === null || authenticationOption.label === undefined) {
    authenticationOption.label = selectedApp.name + " authentication";
    }

    return (
      <div>
        <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
          <div style={{ color: "white" }}>
            Authentication for {selectedApp.name.replaceAll("_", " ", -1)}
          </div>
        </DialogTitle>
        <DialogContent>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://shuffler.io/docs/apps#authentication"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            What is app authentication?
          </a>
          <div />
          These are required fields for authenticating with {selectedApp.name}
          <div style={{ marginTop: 15 }} />
          <b>Label for you to remember</b>
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
              },
            }}
            fullWidth
            color="primary"
            placeholder={"Auth july 2020"}
            defaultValue={`Auth for ${selectedApp.name}`}
            onChange={(event) => {
              authenticationOption.label = event.target.value;
            }}
          />
          <Divider
            style={{
              marginTop: 15,
              marginBottom: 15,
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div />
          {selectedApp.authentication.parameters.map((data, index) => {
      if (data.value === "" || data.value === null || data.value === undefined || data.name === "url") {
      }


            return (
              <div key={index} style={{ marginTop: 10 }}>
                <LockOpenIcon style={{ marginRight: 10 }} />
                <b>{data.name}</b>

                {data.schema !== undefined &&
                  data.schema !== null &&
                  data.schema.type === "bool" ? (
                  <Select
                    MenuProps={{
                      disableScrollLock: true,
                    }}
                    SelectDisplayProps={{
                      style: {
                      },
                    }}
                    defaultValue={"false"}
                    fullWidth
                    onChange={(e) => {
                      authenticationOption.fields[data.name] = e.target.value;
                    }}
                    style={{
                      backgroundColor: theme.palette.surfaceColor,
                      color: "white",
                      height: 50,
                    }}
                  >
                    <MenuItem
                      key={"false"}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: "white",
                      }}
                      value={"false"}
                    >
                      false
                    </MenuItem>
                    <MenuItem
                      key={"true"}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: "white",
                      }}
                      value={"true"}
                    >
                      true
                    </MenuItem>
                  </Select>
                ) : (
                  <TextField
                    style={{
                      backgroundColor: theme.palette.inputColor,
                      borderRadius: theme.palette?.borderRadius,
                    }}
                    InputProps={{
                      style: {
                      },
                    }}
                    fullWidth
                    type={
                      data.example !== undefined && data.example.includes("***")
                        ? "password"
                        : "text"
                    }
                    color="primary"
                    defaultValue={
                      data.value !== undefined && data.value !== null
                        ? data.value
                        : ""
                    }
                    placeholder={data.example}
                    onChange={(event) => {
                      authenticationOption.fields[data.name] =
                        event.target.value;
                    }}
                  />
                )}
              </div>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button
            style={{}}
            onClick={() => {
              setAuthenticationModalOpen(false);
            }}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            style={{}}
      variant="outlined"
            onClick={() => {
              setAuthenticationOptions(authenticationOption);
              handleSubmitCheck()
            }}
            color="primary"
          >
            Submit
          </Button>
        </DialogActions>
      </div>
    );
  };

  const authenticationModal = authenticationModalOpen ? (
    <Dialog
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      hideBackdrop={true}
      disableEnforceFocus={true}
      disableBackdropClick={true}
      style={{ pointerEvents: "none" }}
      open={authenticationModalOpen}
      onClose={() => {setSelectedMeta(undefined)}}
      PaperProps={{
        style: {
          pointerEvents: "auto",
          color: "white",
          minWidth: 1100,
          minHeight: 700,
          maxHeight: 700,
          padding: 15,
          overflow: "hidden",
          zIndex: 10012,
          border: theme.palette.defaultBorder,
        },
      }}
    >
      <div
        style={{
          zIndex: 5000,
          position: "absolute",
          top: 20,
          right: 75,
          height: 50,
          width: 50,
        }}
      >
        { selectedAppData.reference_info === undefined ||
          selectedAppData.reference_info === null ||
          selectedAppData.reference_info.github_url === undefined ||
          selectedAppData.reference_info.github_url === null ||
          selectedAppData.reference_info.github_url.length === 0 ? (

          <a
            rel="noopener noreferrer"
            target="_blank"
            href={"https://github.com/shuffle/python-apps"}
            style={{ textDecoration: "none", color: "#f86a3e" }}
          >
            <img
              alt={`Documentation image for ${selectedAppData.name}`}
              src={selectedAppData.large_image}
              style={{
                width: 30,
                height: 30,
                border: "2px solid rgba(255,255,255,0.6)",
                borderRadius: theme.palette?.borderRadius,
                maxHeight: 30,
                maxWidth: 30,
                overflow: "hidden",
                fontSize: 8,
              }}
            />
          </a>
        ) : (
          <a
            rel="noopener noreferrer"
            target="_blank"
            href={selectedAppData.reference_info.github_url}
            style={{ textDecoration: "none", color: "#f86a3e" }}
          >
            <img
              alt={`Documentation image for ${selectedAppData.name}`}
              src={selectedAppData.large_image}
              style={{
                width: 30,
                height: 30,
                border: "2px solid rgba(255,255,255,0.6)",
                borderRadius: theme.palette?.borderRadius,
                maxWidth: 30,
                maxHeight: 30,
                overflow: "hidden",
                fontSize: 8,
              }}
            />
          </a>
        )}
      </div>
    <Tooltip
    color="primary"
    title={`Move window`}
    placement="left"
    >
      <IconButton
      id="draggable-dialog-title"
      style={{
        zIndex: 5000,
        position: "absolute",
        top: 14,
        right: 50,
        color: "grey",

        cursor: "move", 
      }}
      >
      <DragIndicatorIcon />
      </IconButton>
    </Tooltip>
      <IconButton
        style={{
          zIndex: 5000,
          position: "absolute",
          top: 14,
          right: 18,
          color: "grey",
        }}
        onClick={() => {
          setAuthenticationModalOpen(false);
        }}
      >
        <CloseIcon />
      </IconButton>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            flex: 2,
            padding: 0,
            minHeight: isMobile ? "90%" : 700,
            maxHeight: isMobile ? "90%" : 700,
            overflowY: "auto",
            overflowX: isMobile ? "auto" : "hidden",
          }}
        >
          {authenticationType.type === "oauth2" || authenticationType.type === "oauth2-app"  ? 
            <AuthenticationOauth2
              selectedApp={selectedAppData}
              selectedAction={{
                "app_name": selectedAppData.name,
                "app_id": selectedAppData.id,
                "app_version": selectedAppData.version,
                "large_image": selectedAppData.large_image,
              }}
              authenticationType={authenticationType}
              getAppAuthentication={getAppAuthentication}
              appAuthentication={appAuthentication}
              setAuthenticationModalOpen={setAuthenticationModalOpen}
              isCloud={isCloud}
              org_id={userdata?.active_org?.id}
              setSelectedAction={setSelectedAction}
            />
           : 
            <AuthenticationData app={selectedAppData} />
          }
        </div>
        <div
          style={{
            flex: 3,
            borderLeft: `1px solid ${theme.palette.inputColor}`,
            padding: "70px 30px 30px 30px",
            maxHeight: 630,
            minHeight: 630,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {selectedAppData.documentation === undefined ||
            selectedAppData.documentation === null ||
            selectedAppData.documentation.length === 0 ? (
            <span 
        style={{ textAlign: "center" }}
      >
        <div style={{textAlign: "left", }}>
          <Markdown
          components={{
            img: Img,
            code: CodeHandler,
            h1: Heading,
            h2: Heading,
            h3: Heading,
            h4: Heading,
            h5: Heading,
            h6: Heading,
            a: OuterLink,
          }}
          id="markdown_wrapper"
          escapeHtml={false}
          style={{
            maxWidth: "100%", 
            minWidth: "100%", 
            textAlign: "left", 
          }}
          >
          {selectedAppData?.description}
          </Markdown>
        </div>
              <Divider
                style={{
                  marginTop: 25,
                  marginBottom: 25,
                  backgroundColor: "rgba(255,255,255,0.6)",
                }}
              />

        <div
                    style={{
                        backgroundColor: theme.palette.inputColor,
                        padding: 15,
                        borderRadius: theme.palette?.borderRadius,
                        marginBottom: 30,
                    }}
                >
          <Typography variant="h6" style={{marginBottom: 25, }}>
          There is no Shuffle-specific documentation for this app yet outside of the general description above. Documentation is written for each api, and is a community effort. We hope to see your contribution!
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              toast.success("Opening remote Github documentation link. Thanks for contributing!")

              setTimeout(() => {
                window.open(`https://github.com/Shuffle/openapi-apps/new/master/docs?filename=${selectedAppData.name.toLowerCase()}.md`, "_blank")
              }, 2500)
            }}
           >
            <EditIcon /> &nbsp;&nbsp;Create Docs
           </Button>
                </div>

              <Typography variant="body1" style={{ marginTop: 25 }}>
                Want to help the making of, or improve this app?{" "}
        <br />
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="https://discord.gg/B2CBzUm"
                  style={{ textDecoration: "none", color: "#f86a3e" }}
                >
                  Join the community on Discord!
                </a>
              </Typography>

              <Typography variant="h6" style={{ marginTop: 50 }}>
                Want to help change this app directly?
              </Typography>
              {selectedAppData.reference_info === undefined ||
                selectedAppData.reference_info === null ||
                selectedAppData.reference_info.github_url === undefined ||
                selectedAppData.reference_info.github_url === null ||
                selectedAppData.reference_info.github_url.length === 0 ? (
                <span>
                  <Typography variant="body1" style={{ marginTop: 25 }}>
                    <a
                      rel="noopener noreferrer"
                      target="_blank"
                      href={"https://github.com/shuffle/python-apps"}
                      style={{ textDecoration: "none", color: "#f86a3e" }}
                    >
                      Check it out on Github!
                    </a>
                  </Typography>
                </span>
              ) : (
                <span>
                  <Typography variant="body1" style={{ marginTop: 25 }}>
                    <a
                      rel="noopener noreferrer"
                      target="_blank"
                      href={selectedAppData.reference_info.github_url}
                      style={{ textDecoration: "none", color: "#f86a3e" }}
                    >
                      Check it out on Github!
                    </a>
                  </Typography>
                </span>
              )}
            </span>
          ) : (
      <div>
        {selectedMeta !== undefined && selectedMeta !== null && Object.getOwnPropertyNames(selectedMeta).length > 0 && selectedMeta.name !== undefined && selectedMeta.name !== null ? 
        <div
          style={{
            backgroundColor: theme.palette.inputColor,
            padding: 15,
            borderRadius: theme.palette?.borderRadius,
            marginBottom: 30,
            display: "flex",
          }}
        >
        <div style={{ flex: 3, display: "flex", vAlign: "center", position: "sticky", top: 50, }}>
          {isMobile ? null : (
            <Typography style={{ display: "inline", marginTop: 6 }}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={selectedMeta.link}
                style={{ textDecoration: "none", color: "#f85a3e" }}
              >
                <Button style={{ color: "white", }} variant="outlined" color="secondary">
                  <EditIcon /> &nbsp;&nbsp;Edit
                </Button>
              </a>
            </Typography>
          )}
          {isMobile ? null : (
            <div
              style={{
                height: "100%",
                width: 1,
                backgroundColor: "white",
                marginLeft: 50,
                marginRight: 50,
              }}
            />
          )}
          <Typography style={{ display: "inline", marginTop: 11 }}>
            {selectedMeta.read_time} minute
            {selectedMeta.read_time === 1 ? "" : "s"} to read
          </Typography>
        </div>
        <div style={{ flex: 2 }}>
          {isMobile ||
            selectedMeta.contributors === undefined ||
            selectedMeta.contributors === null ? (
            ""
          ) : (
            <div style={{ margin: 10, height: "100%", display: "inline" }}>
              {selectedMeta.contributors.slice(0, 7).map((data, index) => {
                return (
                  <a
                    key={index}
                    rel="noopener noreferrer"
                    target="_blank"
                    href={data.url}
                    style={{ textDecoration: "none", color: "#f85a3e" }}
                  >
                    <Tooltip title={data.url} placement="bottom">
                      <img
                        alt={data.url}
                        src={data.image}
                        style={{
                          marginTop: 5,
                          marginRight: 10,
                          height: 40,
                          borderRadius: 40,
                        }}
                      />
                    </Tooltip>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
        : null}

        <Markdown
          components={{
            img: Img,
            code: CodeHandler,
            h1: Heading,
            h2: Heading,
            h3: Heading,
            h4: Heading,
            h5: Heading,
            h6: Heading,
            a: OuterLink,
          }}
          id="markdown_wrapper"
          escapeHtml={false}
          style={{
            maxWidth: "100%", minWidth: "100%", 
          }}
        >
        {selectedAppData.documentation}
        </Markdown>
      </div>
          )}
        </div>
      </div>
    </Dialog>
) : null;

  return (
    <div>
      {authenticationModal}
      {hits.length === 0 && searchQuery.length >= 0 ? (
        <div style={{minWidth: 500, minHeight: 500, textAlign: 'center'}}>
          <Typography variant="body1" style={{ marginTop: '30%' }}>
          No Apps Found
        </Typography>
        </div>
      ) : (
        <Grid container spacing={2} style={{ marginTop: 16,  }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              marginLeft: 24,
              height: 480,
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#494949 #2f2f2f",
              width: "100%",
            }}
          >
            {hits.map((data, index) => {
              const appUrl = isCloud
                ? `/apps/${data.objectID}?queryID=${data.__queryID}`
                : `https://shuffler.io/apps/${data.objectID}?queryID=${data.__queryID}`;
  
              return (
                <Zoom
                  key={index}
                  in={true}
                  style={{
                    transitionDelay: `${workflowDelay}ms`,
                  }}
                >
                  <Grid item>
                    <a
                      href={appUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                      style={{
                        textDecoration: "none",
                        color: "#f85a3e",
                      }}
                    >
                      <Paper
                        elevation={0}
                        style={{
                          ...paperStyle,
                          backgroundColor: mouseHoverIndex === index ? "#2F2F2F" : "rgba(26, 26, 26, 1)",
                          width: "100%",
                        }}
                        onMouseEnter={() => setMouseHoverIndex(index)}
                        onMouseLeave={() => setMouseHoverIndex(-1)}
                      >
                        <button
                          style={{
                            borderRadius: 4,
                            fontSize: 16,
                            display: "flex",
                            alignItems: "flex-start",
                            padding: 0,
                            border: "none",
                            width: "100%",
                            height: 96,
                            cursor: "pointer",
                            color: "rgba(26, 26, 26, 1)",
                            backgroundColor: "transparent",
                          }}
                        >
                          <img
                            id={`image_${index}`}
                            alt={data.name}
                            src={data.image_url || "/images/no_image.png"}
                            onError={(e) => {
                              const foundImage = document.getElementById(`image_${index}`);
                              if (foundImage) {
                                foundImage.src = "/images/defaultImage.png"; 
                              }
                            }}
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 4,
                              margin: 8,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: 4,
                              width: '100%',
                              overflow: "hidden",
                              margin: "12px 0",
                              marginLeft: 8,
                              fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                overflow: "hidden",
                                gap: 8,
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: "#F1F1F1",
                              }}
                            >
                              {normalizedString(data.name)}
                            </div>
                            <div
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: "rgba(158, 158, 158, 1)",
                                marginTop: 5,
                              }}
                            >
                              {data.categories ? normalizedString(data.categories).join(", ") : "NA"}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                textAlign: "start",
                                color: "rgba(158, 158, 158, 1)",
                              }}
                            >
                              <div style={{ marginBottom: 15 }}>
                                  <div
                                    style={{
                                      width: "100%",
                                      textOverflow: "ellipsis",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                      maxWidth: "300px"
                                    }}
                                  >
                                    {data.tags?.map((tag, tagIndex) => (
                                      <span key={tagIndex}>
                                        {normalizedString(tag)}
                                        {tagIndex < data.tags.length - 1 ? ", " : ""}
                                      </span>
                                    ))}
                                  </div>
                              </div>
                              	<Button style={{position: 'relative', borderRadius: 6, bottom: 10, marginRight: 10, fontSize: 16, backgroundColor: '#ff8544', color: "#1a1a1a", textTransform:'none', marginLeft: 'auto'}} onClick={(e)=> {e.preventDefault();e.stopPropagation();handleAppAuthenticationNew(data)()}}>
				  					Authenticate app
				  				</Button>
                            </div>
                          </div>
                        </button>
                      </Paper>
                    </a>
                  </Grid>
                </Zoom>
              );
            })}
          </div>
        </Grid>
      )}
    </div>
  );
  
};

const CustomSearchBox = connectSearchBox(SearchBox);
const CustomHits = connectHits(Hits);
