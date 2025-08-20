import React, { memo, useContext, useEffect, useState } from 'react';
import {getTheme} from "../theme.jsx";
import { Context } from '../context/ContextApi.jsx';
import {
    FormControl,
    Card,
    Tooltip,
    Typography,
    Switch,
    Divider,
    TextField,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Skeleton,
    IconButton,
    Modal,
    Checkbox,
  } from "@mui/material";
  
  import {
    Edit as EditIcon,
    Polyline as PolylineIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Apps as AppsIcon,
    Business as BusinessIcon,
    Flag,
	ArrowDropDown as ArrowDropDownIcon,
    VisibilityOff,
    Visibility,

  } from "@mui/icons-material";

import { toast } from 'react-toastify';

const TenantsTab = memo((props) => {
    const {
        globalUrl,
        isCloud,
        userdata,
        selectedOrganization,
        setSelectedOrganization,
        checkLogin
    } = props;
    const imageStyle = { width: 50, height: 50 };
    // const [selectedOrganization, setSelectedOrganization] = React.useState({});
    const [subOrgs, setSubOrgs] = useState([]);
    const [cloudSyncApikey, setCloudSyncApikey] = React.useState("");
    const [orgName, setOrgName] = React.useState("");
    const [orgSyncResponse, setOrgSyncResponse] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    // const [loginInfo, setLoginInfo] = React.useState("");
    const [cloudSyncModalOpen, setCloudSyncModalOpen] = React.useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [parentOrg, setParentOrg] = React.useState(null);
    const [parentOrgFlag, setParentOrgFlag] = React.useState("gb");
    const [parentOrgRegionName, setParentOrgRegionName] = React.useState("UK");
    const [loadOrgs, setLoadOrgs] = React.useState(true);
    const [, forceUpdate] = React.useState();
    const [suborglistOpen, setSuborglistOpen] = React.useState(false);
    const [allTenantsOpen, setAllTenantsOpen] = React.useState(false);
    const itemColor = "black";
    const { themeMode, supportEmail, brandColor } = useContext(Context);
    const theme = getTheme(themeMode, brandColor);
    const [accountDeleteButtonClicked, setAccountDeleteButtonClicked] = useState(false);
    const [selectedSuborg, setSelectedSuborg] = useState(null);
    useEffect(() => {
        if(parentOrg !== null && parentOrgFlag === null) {
            let regiontag = "UK";
            let regionCode = "gb";

            if (parentOrg?.region_url?.length > 0) {
                const regionsplit = parentOrg?.region_url.split(".");
                if (regionsplit.length > 2 && !regionsplit[0].includes("shuffler")) {
                    const namesplit = regionsplit[0].split("/");
                    regiontag = namesplit[namesplit.length - 1];

                    if (regiontag === "california") {
						regiontag = "US";
						regionCode = "us";
                    } else if (regiontag === "frankfurt") {
						regiontag = "EU-2";
						regionCode = "eu";
                    } else if (regiontag === "ca") {
						regiontag = "CA";
						regionCode = "ca";
                    }else if (regiontag === "au") {
                        regiontag = "AUS";
                        regionCode = "au"
                    }
                }
                setParentOrgFlag(regionCode);
                setParentOrgRegionName(regiontag);
        }
    }
    }, [parentOrg, parentOrgFlag]);
    
    var syncList = [
        {
            primary: "Workflows",
            secondary: "",
            active: true,
            icon: <PolylineIcon style={{ color: itemColor }} />,
        },
        {
            primary: "Apps",
            secondary: "",
            active: true,
            icon: <AppsIcon style={{ color: itemColor }} />,
        },
        {
            primary: "Organization",
            secondary: "",
            active: true,
            icon: <BusinessIcon style={{ color: itemColor }} />,
        },
    ];

    useEffect(() => {
        if (userdata.orgs !== undefined && userdata.orgs !== null && userdata.orgs.length > 0) {
            handleGetSubOrgs(userdata.active_org.id);
        }
        else console.log("error in user data")
    }, [userdata]);

    const handleGetSubOrgs = (orgId) => {

        if (orgId.length === 0) {
            toast("Organization ID not defined. Please contact us on https://shuffler.io if this persists logout.");
            return;
        }

        fetch(`${globalUrl}/api/v1/orgs/${orgId}/suborgs`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch sub organizations');
                }
                return response.json();
            })
            .then((responseJson) => {
                if (responseJson.success === false) {
                    setLoadOrgs(false)
                    //toast("Failed getting your org. If this persists, please contact support.");
                } else {
                    const { subOrgs, parentOrg } = responseJson;
                    setLoadOrgs(false)
                    setSubOrgs(subOrgs);
                    setParentOrg(parentOrg);

                    let regiontag = "UK";
                    let regionCode = "gb";

                    if (parentOrg?.region_url?.length > 0) {
                    const regionsplit = parentOrg?.region_url.split(".");
                    if (regionsplit.length > 2 && !regionsplit[0].includes("shuffler")) {
                        const namesplit = regionsplit[0].split("/");
                        regiontag = namesplit[namesplit.length - 1];

                        if (regiontag === "california") {
							regiontag = "US";
							regionCode = "us";
                        } else if (regiontag === "frankfurt") {
							regiontag = "EU-2";
							regionCode = "eu";
                        } else if (regiontag === "ca") {
							regiontag = "CA";
							regionCode = "ca";
                        }else if (regiontag === "au") {
                            regiontag = "AUS";
                            regionCode = "au"
                        }
                    }
                        setParentOrgFlag(regionCode);
                        setParentOrgRegionName(regiontag);
                }
                }
            })
            .catch((error) => {
                console.log("Error getting sub orgs: ", error);
                //toast("Error getting sub organizations");
                setLoadOrgs(false)
            });
    };

    const GridItem = (props) => {
        const [expanded, setExpanded] = React.useState(false);
        const [showEdit, setShowEdit] = React.useState(false);
        const [newValue, setNewValue] = React.useState(-100);

        const primary = props.data.primary;
        const secondary = props.data.secondary;
        const primaryIcon = props.data.icon;
        const secondaryIcon = props.data.active ? (
            <CheckCircleIcon style={{ color: "green" }} />
        ) : (
            <CloseIcon style={{ color: "red" }} />
        );

        const submitFeatureEdit = (sync_features) => {
            if (!userdata.support) {
                console.log(
                    "User does not have support access and can't edit features",
                );
                return;
            }

            sync_features.editing = true;
            const data = {
                org_id: selectedOrganization.id,
                sync_features: sync_features,
            };

            const url = globalUrl + `/api/v1/orgs/${selectedOrganization.id}`;
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
                            toast("Failed updating org: ", responseJson.reason);
                        } else {
                            toast("Successfully edited org!");
                        }
                    }),
                )
                .catch((error) => {
                    toast("Err: " + error.toString());
                });
        };

        const enableFeature = () => {
            console.log("Enabling " + primary);

            console.log(selectedOrganization.sync_features);
            // Check if primary is in sync_features
            var tmpprimary = primary.replaceAll(" ", "_");
            if (!(tmpprimary in selectedOrganization.sync_features)) {
                console.log("Primary not in sync_features: " + tmpprimary);
                return;
            }

            if (props.data.active) {
                selectedOrganization.sync_features[tmpprimary].active = false;
            } else {
                selectedOrganization.sync_features[tmpprimary].active = true;
            }

            // setSelectedOrganization(selectedOrganization);
            forceUpdate(Math.random());
            submitFeatureEdit(selectedOrganization.sync_features);
        };

        const submitEdit = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Check if primary is in sync_features
            var tmpprimary = primary.replaceAll(" ", "_");
            if (!(tmpprimary in selectedOrganization.sync_features)) {
                console.log("Primary not in sync_features: " + tmpprimary);
                return;
            }

            // Make it into a number
            var tmp = parseInt(newValue);
            if (isNaN(tmp)) {
                console.log("Not a number: " + newValue);
                return;
            }

            selectedOrganization.sync_features[tmpprimary].limit = tmp;

            // setSelectedOrganization(selectedOrganization);
            forceUpdate(Math.random());
            submitFeatureEdit(selectedOrganization.sync_features);
        };

        return (
            <Grid item xs={4}>
                <Card
                    style={{
                        margin: 4,
                        backgroundColor: theme.palette.platformColor,
                        borderRadius: theme.palette?.borderRadius,
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        minHeight: expanded ? 250 : "inherit",
                        maxHeight: expanded ? 300 : "inherit",
                    }}
                >
                    <ListItem
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            setExpanded(!expanded);
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar>{primaryIcon}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            style={{ textTransform: "capitalize" }}
                            primary={props.data.newname ? props.data.newname : primary}
                        />
                        {isCloud && userdata.support === true ? (
                            <Tooltip title="Edit features (support users only)">
                                <EditIcon
                                    color="secondary"
                                    style={{ marginRight: 10, cursor: "pointer" }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        if (showEdit) {
                                            setShowEdit(false);
                                            return;
                                        }

                                        console.log("Edit");

                                        setShowEdit(true);
                                    }}
                                />
                            </Tooltip>
                        ) : null}
                        <Tooltip
                            title={props.data.active ? "Disable feature" : "Enable feature"}
                        >
                            <span
                                style={{ cursor: "pointer", marginTop: 5 }}
                                onClick={(e) => {
                                    if (!isCloud || userdata.support !== true) {
                                        return;
                                    }

                                    e.preventDefault();
                                    e.stopPropagation();

                                    enableFeature();
                                }}
                            >
                                {secondaryIcon}
                            </span>
                        </Tooltip>
                    </ListItem>
                    {expanded ? (
                        <div style={{ padding: 15 }}>
                            <Typography>
                                <b>Usage:&nbsp;</b>
                                {props.data.limit === 0 ? (
                                    "Unlimited"
                                ) : (
                                    <span>
                                        {props.data.usage} /{" "}
                                        {props.data.limit === "" ? "Unlimited" : props.data.limit}
                                    </span>
                                )}
                            </Typography>
                            {/*<Typography>
                    Data sharing: {props.data.data_collection}
                  </Typography>*/}
                            <Typography
                                style={{
                                    maxHeight: 150,
                                    overflowX: "hidden",
                                    overflowY: "auto",
                                }}
                            >
                                <b>Description:</b> {secondary}
                            </Typography>
                        </div>
                    ) : null}

                    {showEdit ? (
                        <FormControl
                            fullWidth
                            onSubmit={(e) => {
                                console.log("Submit");
                                submitEdit(e);
                            }}
                        >
                            <span style={{ display: "flex" }}>
                                <TextField
                                    style={{ flex: 3 }}
                                    color="primary"
                                    label={"Edit value"}
                                    defaultValue={props.data.limit}
                                    style={{}}
                                    onChange={(event) => {
                                        setNewValue(event.target.value);
                                    }}
                                />
                                <Button
                                    style={{ flex: 1 }}
                                    variant="contained"
                                    disabled={newValue < -1}
                                    onClick={(e) => {
                                        console.log("Submit 2");
                                        submitEdit(e);
                                    }}
                                >
                                    Submit
                                </Button>
                            </span>
                        </FormControl>
                    ) : null}
                </Card>
            </Grid>
        );
    };

    const enableCloudSync = (apikey, organization, disableSync) => {
        setOrgSyncResponse("");

        const data = {
            apikey: apikey,
            organization: organization,
            disable: disableSync,
        };

        const url = globalUrl + "/api/v1/cloud/setup";
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
            .then((response) => {
                setLoading(false);
                if (response.status === 200) {
                    console.log("Cloud sync success?");
                } else {
                    console.log("Cloud sync fail?");
                }

                return response.json();
                //setTimeout(() => {
                //}, 1000)
            })
            .then((responseJson) => {
                console.log("RESP: ", responseJson);
                if (
                    responseJson.success === false &&
                    responseJson.reason !== undefined
                ) {
                    setOrgSyncResponse(responseJson.reason);
                    toast("Failed to handle sync: " + responseJson.reason);
                } else if (!responseJson.success) {
                    toast("Failed to handle sync.");
                } else {
                    //   getOrgs();
                    if (disableSync) {
                        toast("Successfully disabled sync!");
                        setOrgSyncResponse("Successfully disabled syncronization");
                    } else {
                        toast("Cloud Syncronization successfully set up!");
                        setOrgSyncResponse(
                            "Successfully started syncronization. Cloud features you now have access to can be seen below.",
                        );
                    }

                    selectedOrganization.cloud_sync = !selectedOrganization.cloud_sync;
                    // setSelectedOrganization(selectedOrganization);
                    setCloudSyncApikey("");

                    //   handleGetOrg(userdata.active_org.id);
                }
            })
            .catch((error) => {
                setLoading(false);
                toast("Err: " + error.toString());
            });
    };

    const createSubOrg = (currentOrgId, name) => {
        const data = { name: name, org_id: currentOrgId };
        const url = globalUrl + `/api/v1/orgs/${currentOrgId}/create_sub_org`;
		setSuborglistOpen(true)

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
                        if (responseJson.reason !== undefined) {
                            toast.error(responseJson.reason, {
								autoClose: 5000,
							})
                        } else {
                            toast("Failed creating suborg. Please try again");
                        }
                    } else {
                        toast("Successfully created suborg. Reloading in 3 seconds!");
                        // setSelectedUserModalOpen(false);

                        setTimeout(() => {
                            window.location.reload();
                        }, 2500);
                    }

                    setOrgName("");
                    setModalOpen(false);
                }),
            )
            .catch((error) => {
                toast("Err: " + error.toString());
            });
    };

    const handleClickChangeOrg = (orgId) => {
        // Don't really care about the logout
        //name: org.name,
        //orgId = "asd"
        const data = {
            org_id: orgId,
        };

        localStorage.setItem("globalUrl", "");
        localStorage.setItem("getting_started_sidebar", "open");

        fetch(`${globalUrl}/api/v1/orgs/${orgId}/change`, {
            mode: "cors",
            credentials: "include",
            crossDomain: true,
            method: "POST",
            body: JSON.stringify(data),
            withCredentials: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        })
            .then(function (response) {
                if (response.status !== 200) {
                    console.log("Error in response");
                } else {
					localStorage.setItem("apps", [])
				}

                return response.json();
            })
            .then(function (responseJson) {
                if (responseJson.success === true) {
                    if (
                        responseJson.region_url !== undefined &&
                        responseJson.region_url !== null &&
                        responseJson.region_url.length > 0
                    ) {
                        localStorage.setItem("globalUrl", responseJson.region_url);
                        //globalUrl = responseJson.region_url
                    }

                    checkLogin()
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                    toast("Successfully changed active organization - refreshing!");
                } else {
                    toast("Failed changing org: " + responseJson.reason);
                }
            })
            .catch((error) => {
                console.log("error changing: ", error);
                //removeCookie("session_token", {path: "/"})
            });
    };

    const DeleteAccountPopUp = () => {
        const [userDeleteAccepted, setUserDeleteAccepted] = useState(false);
        const [password, setPassword] = useState("");
        const [showPassword, setShowPassword] = useState(false);
        const [disabled, setDisabled] = useState(true);
        const [open, setOpen] = useState(true);
        const boxStyling = {
          position: "relative",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "9999",
          backgroundColor: theme.palette.backgroundColor,
          color: theme.palette.text.primary,
          padding: 20,
          borderRadius: 5,
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
          width: 430,
          height: 430,
        };
    
        const closeIconButtonStyling = {
          color: theme.palette.text.primary,
          border: "none",
          backgroundColor: "transparent",
          position: 'relative',
          width: 20,
          height: 20,
          cursor: "pointer",
          left: "calc(100% - 30px)",
        };
    
        const handlePasswordVisibility = () => {
          setShowPassword(!showPassword);
        };
    
        const buttonStyle = {
          marginTop: 20,
          height: 50,
          border: "none",
          width: "100%",
          fontSize: 16,
          backgroundColor: disabled ? "gray" : "red",
          color: theme.palette.text.primary,
          cursor: disabled === false && "pointer",
        };    
    
        const handlePasswordChange = (e) => {
          setPassword(e.target.value);
        };
    
        const handleCheckBoxEvent = () => {
          setUserDeleteAccepted((prev) => !prev);
        };
    
        useEffect(() => {
          if (password.length > 8 && userDeleteAccepted) {
            setDisabled(false);
          } else {
            setDisabled(true);
          }
        }, [password, userDeleteAccepted]);

    
        const handleDeleteAccount = () => {
          const baseURL = globalUrl;
    
          const url = `${baseURL}/api/v1/orgs/${selectedSuborg?.id}`;

          const data = {
            password: password,
          };

          fetch(url, {
            mode: "cors",
            method: "DELETE",
            body: JSON.stringify(data),
            credentials: "include",
            crossDomain: true,
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                toast.success(
                  "Suborg deleted"
                );
                handleGetSubOrgs(userdata.active_org.id);
                setAccountDeleteButtonClicked(false);

              } else {
                if (data.reason) {
                  toast.error(data.reason);
                }else {
                    toast.error("Failed to delete suborg. Please try again or contact support@shuffler.io for help.");
                }
              }
            })
            .catch((error) => {
              console.error(
                "There was a problem with your fetch operation:",
                error
              );
            });
        };
    
        return (
          <Modal open= {open} >
          <div style={boxStyling}>
            <IconButton
                style={closeIconButtonStyling}
                onClick={() => {
                    setAccountDeleteButtonClicked(false);
                    setSelectedSuborg(null);
                }}
            >
              <CloseIcon />
            </IconButton>
            <h1 style={{textAlign:"center", margin : "0 0 20px 0"}}>Sub-Organization</h1>
          {/* <div style={{paddingLeft: 15}} > */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
                // paddingLeft: 15
                // marginLeft: 20
              }}
            >
              <label>If you delete your suborg then:</label>
              <ul style={{ textAlign: "left" }}>
                <li>
                  <label>
                    Your suborg information will be removed from our Database
                    permanently.
                  </label>
                </li>
                <li>
                  <label>This action cannot be reversed.</label>
                </li>
              </ul>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Checkbox
                  checked={userDeleteAccepted}
                  onChange={handleCheckBoxEvent}
                  size="medium"
                />
                <label style={{ fontSize: "16px", color: theme.palette.text.primary }}>
                  I have read the above information and I agree to it completely
                </label>
              </div>
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <label>Enter password to delete suborg {" " + selectedSuborg?.name}</label>
                <TextField
                    style={{
                      backgroundColor: theme.palette.inputColor,
                      flex: "1",
                    }}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Password"
                    id="standard-required"
                    autoComplete="off"
                    InputProps={{
                        style: {
                            color: theme.palette.textFieldStyle.color,
                            backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                            height: "45px",
                            fontSize: "1em",
                            borderRadius: theme.palette.textFieldStyle.borderRadius,
                        },
                      endAdornment: (
                        <IconButton
                          onClick={handlePasswordVisibility}
                          style={{color:theme.palette.text.primary}}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
              </div>
              <button
                style={buttonStyle}
                disabled={disabled}
                onClick={handleDeleteAccount}
              >
                Delete Suborg
              </button>
            </div>
          </div>
          </Modal>
        );
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
                <Typography variant='h5' color="textPrimary">Add Sub-Organization</Typography>
            </DialogTitle>
            <DialogContent>
                <div>
                    Name
                    <TextField
                        color="primary"
                        style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
                        autoFocus
                        InputProps={{
                            style: {
                                height: "50px",
                                color: theme.palette.textFieldStyle.color,
                                fontSize: "1em",
                            },
                        }}
                        required
                        fullWidth={true}
                        placeholder={`${selectedOrganization.name} Copycat Inc.`}
                        id="orgname"
                        margin="normal"
                        variant="outlined"
                        onChange={(event) => {
                            setOrgName(event.target.value);
                        }}
                    />
                </div>
                {/* {loginInfo} */}
            </DialogContent>
            <DialogActions>
                <Button
                    style={{ borderRadius: "2px", fontSize: 16, textTransform: "none", color: theme.palette.primary.main }}
                    onClick={() => setModalOpen(false)}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "2px", fontSize: 16, textTransform: "none",}}
                    onClick={() => {
                        createSubOrg(selectedOrganization.id, orgName);
                    }}
                    color="primary"
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );

    const cloudSyncModal = (
        <Dialog
            open={cloudSyncModalOpen}
            onClose={() => {
                setCloudSyncModalOpen(false);
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
                <span style={{ color: "white" }}>Enable cloud features</span>
            </DialogTitle>
            <DialogContent color="textSecondary">
                What does{" "}
                <a
                    href="/docs/organizations#cloud_sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "#f85a3e" }}
                >
                    cloud sync
                </a>{" "}
                do?
                <div style={{ display: "flex", marginBottom: 20 }}>
                    <TextField
                        color="primary"
                        style={{
                            backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                            marginRight: 10,
                        }}
                        InputProps={{
                            style: {
                                height: "50px",
                                color: "white",
                                fontSize: "1em",
                            },
                        }}
                        required
                        fullWidth={true}
                        disabled={selectedOrganization.cloud_sync}
                        autoComplete="cloud apikey"
                        id="apikey_field"
                        margin="normal"
                        placeholder="Cloud Apikey"
                        variant="outlined"
                        onChange={(event) => {
                            setCloudSyncApikey(event.target.value);
                        }}
                    />
                    <Button
                        disabled={
                            (!selectedOrganization.cloud_sync &&
                                cloudSyncApikey.length === 0) ||
                            loading
                        }
                        style={{ marginLeft: 15, height: 50, borderRadius: "2px", color: "#1a1a1a", backgroundColor: (!selectedOrganization.cloud_sync &&
                            cloudSyncApikey.length === 0) ||
                        loading ? "rgba(200, 200, 200, 0.5)" : theme.palette.primary.main, fontSize: 16, textTransform: "none" }}
                        onClick={() => {
                            setLoading(true);
                            enableCloudSync(
                                cloudSyncApikey,
                                selectedOrganization,
                                selectedOrganization.cloud_sync,
                            );
                        }}
                        color="primary"
                        variant={
                            selectedOrganization.cloud_sync === true
                                ? "outlined"
                                : "contained"
                        }
                    >
                        {selectedOrganization.cloud_sync ? "Stop sync" : "Start sync"}
                    </Button>
                </div>
                {orgSyncResponse.length > 0 ? (
                    <Typography style={{ marginTop: 5, marginBottom: 10 }}>
                        Error: {orgSyncResponse}
                    </Typography>
                ) : null}
                <Grid container style={{ width: "100%", marginBottom: 15 }}>
                    {syncList.map((data, index) => {
                        return <GridItem key={index} data={data} />;
                    })}
                </Grid>
                * New triggers (userinput, hotmail realtime)
                <div />
                * Execute in the cloud rather than onprem
                <div />
                * Apps can be built in the cloud
                <div />
                * Easily share apps and workflows
                <div />* Access to powerful cloud search
            </DialogContent>
        </Dialog>
    );


    const textColor = "#9E9E9E !important";

    return (
        <div style={{ width: "100%", minHeight: 1100, boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: theme.palette.platformColor, borderTopRightRadius: '8px', borderBottomRightRadius: 8, borderLeft: theme.palette.defaultBorder,}}>
            {modalView}
            {cloudSyncModal}
             {accountDeleteButtonClicked && <DeleteAccountPopUp/>}
            <div style={{height: "100%", maxHeight: 1700, overflowY: "auto",overflowX: 'hidden', scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin'}}>
                <div style={{ height: "100%", width: "calc(100% - 20px)",  scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin' }}>   
                <div style={{ marginBottom: 20 }}>
                    <Typography variant='h5' color="textPrimary" style={{ marginBottom: 8, marginTop: 0 }}>Tenants</Typography>
                    <Typography variant='body2' color="textSecondary">
                        Create, manage and change to sub-organizations (tenants)! {" "}
                        {isCloud
                            ? `You can only make a sub organization if you are a customer of shuffle or running a POC of the platform. Please contact ${supportEmail} to try it out.`
                            : ''}&nbsp;
                        <a
                            href="/docs/organizations"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: theme.palette.linkColor }}
                        >
                            Learn more
                        </a>
                    </Typography>
                </div>

                <Button
                    style={{ textTransform: 'none', fontSize: 16, borderRadius: 4, width: 212, height: 40 }}
                    variant="contained"
                    color="primary"
                    disabled={userdata.admin !== 'true'}
                    onClick={() => {
                        setModalOpen(true);
                    }}
                >
                    Add suborganization
                </Button>

                <Divider
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                        backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                    }}
                />

                <div
                    style={{
                        textAlign: 'left',
                        width: '100%',
                        padding: '10px',
                        marginTop: 20,
                    }}
                >
                    <Typography 
                        variant='h6'
                        color="textPrimary"
                        style={{
                            margin: 0,
                        }}
                    >
                        Your Parent Organization
                    </Typography>
                </div>
                    <div>
                        

                        {/* <Divider
                            style={{
                                marginTop: 20,
                                marginBottom: 20,
                                backgroundColor: theme.palette.inputColor,
                            }}
                        /> */}


                    <div style={{ borderRadius: 4, marginTop: 24, border: theme.palette.defaultBorder, width: "100%", overflowX: "auto", paddingBottom: 0 }}>
                    <List
                        style={{
                        width: "100%",
                        tableLayout: "fixed",
                        display: "table",
                        minWidth: 800,
                        overflowX: "auto",
                        paddingBottom: 0,
                        }}
                    >
                        <ListItem
                            style={{
                                width: "100%",
                                display: "table-row",
                                padding: "0px 8px 8px 8px",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                verticalAlign: "middle",
                            }}
                        >
                        <ListItemText
                            primary="Logo"
                            style={{
                                width: 100,
                                minWidth: 100,
                                maxWidth: 100,
                                paddingLeft: 20,
                                display: "table-cell",
                                padding: "0px 8px 8px 8px",
                                textAlign: "center",
                                borderBottom: theme.palette.defaultBorder,
                                verticalAlign: "middle",
                            }}
                        />
                        <ListItemText
                            primary="Name"
                            style={{
                            minWidth: 100,
                            maxWidth: 300,
                            display: "table-cell",
                            padding: "0px 8px 8px 8px",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            borderBottom: theme.palette.defaultBorder,
                            verticalAlign: "middle",
                            textAlign: "center",
                            }}
                        />
                        {isCloud && (
                            <ListItemText
                            primary="Region"
                            style={{
                                minWidth: 100,
                                maxWidth: 100,
                                display: "table-cell",
                                borderBottom: theme.palette.defaultBorder,
                                padding: "0px 8px 8px 8px",
                            }}
                            />
                        )}
                        <ListItemText
                            primary="id"
                            style={{
                            minWidth: 400,
                            maxWidth: 400,
                            display: "table-cell",
                            padding: "0px 8px 8px 8px",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            borderBottom: theme.palette.defaultBorder,
                            verticalAlign: "middle",
                            }}
                        />
                        <ListItemText
                            primary="Action"
                            style={{
                            minWidth: 400,
                            maxWidth: 400,
                            display: "table-cell",
                            padding: "0px 8px 8px 8px",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            borderBottom: theme.palette.defaultBorder,
                            verticalAlign: "middle",
                            }}
                        />
                        </ListItem>

                        {loadOrgs ? (
                            [...Array(3)].map((_, rowIndex) => (
                                <ListItem
                                key={rowIndex}
                                style={{
                                    display: "flex",
                                    backgroundColor: theme.palette.platformColor,
                                    height: 30,
                                }}
                                >
                                {[
                                    { width: 100, minWidth: 100, maxWidth: 100 },
                                    { width: 250, minWidth: 50, maxWidth: 250 },
                                    { width: 400, minWidth: 400, maxWidth: 400 },
                                    { width: "28%", minWidth: "28%" },
                                    { width: 400, minWidth: 400, maxWidth: 400 },
                                ].map((style, colIndex) => (
                                    <ListItemText
                                    key={colIndex}
                                    style={{
                                        padding: "8px",
                                        ...style,
                                    }}
                                    >
                                    <Skeleton
                                        variant="text"
                                        animation="wave"
                                        sx={{
                                        backgroundColor: theme.palette.loaderColor,
                                        borderRadius: "4px",
                                        }}
                                    />
                                    </ListItemText>
                                ))}
                                </ListItem>
                            ))
                        ) : parentOrg?.id?.length > 0 ? (
                    <ListItem
                        style={{
                            backgroundColor: theme.palette.platformColor,
                            display: "table-row",
                            padding: 8,
                            verticalAlign: "middle",
                        }}
                    >
                        <ListItemText
                        primary={
                            <img
                            alt={parentOrg?.name}
                            src={parentOrg?.image || theme?.palette?.defaultImage}
                            style={imageStyle}
                            />
                        }
                        style={{
                            width: 100,
                            minWidth: 100,
                            maxWidth: 100,
                            display: "table-cell",
                            padding: "8px 8px 8px 20px",
                            textAlign: "center",
                        }}
                        />
                        <ListItemText
                        primary={parentOrg?.name}
                        style={{
                            minWidth: 100,
                            maxWidth: 300,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            display: "table-cell",
                            padding: 8,
                            verticalAlign: "middle",
                            textAlign: "center",
                        }}
                        />
                        {isCloud && (
                        <ListItemText
                            primary={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <img
                                alt={parentOrgFlag}
                                src={`https://flagcdn.com/w20/${parentOrgFlag}.png`}
                                style={{ width: "30px", height: "20px", marginRight: "5px" }}
                                />
                                <ListItemText primary={parentOrgRegionName?.toUpperCase()} />
                            </div>
                            }
                            style={{ display: "table-cell", padding: 8, verticalAlign: "middle" }}
                        />
                        )}
                        <ListItemText
                        primary={parentOrg?.id}
                        style={{
                            minWidth: 300,
                            maxWidth: 300,
                            display: "table-cell",
                            padding: 8,
                            verticalAlign: "middle",
                        }}
                        />
                        <ListItemText
                        primary={
                            <Tooltip
                            title={
                                parentOrg?.id === userdata?.active_org?.id
                                ? "You are already in parent organization."
                                : ""
                            }
                            >
                            <span>
                                <Button
                                variant="outlined"
                                sx={{
                                    boxShadow: "none",
                                    textTransform: "capitalize",
                                    fontSize: 16,
                                    transition: "width 0.3s ease",
                                    "&.Mui-disabled": {
                                    backgroundColor: "rgba(200, 200, 200, 0.5)",
                                    color: "#A9A9A9",
                                    },
                                }}
                                color="primary"
                                disabled={parentOrg?.id === userdata?.active_org?.id}
                                onClick={() => {
                                    handleClickChangeOrg(parentOrg?.id);
                                }}
                                >
                                Switch to Parent
                                </Button>
                            </span>
                            </Tooltip>
                        }
                        style={{ display: "table-cell", verticalAlign: "middle" }}
                        />
                    </ListItem>
                        ): (
                        <ListItem style={{ display: "table-row" }}>
                            {Array(5).fill().map((_, index) => (
                                <ListItemText
                                    key={index}
                                    style={{
                                        display: "table-cell",
                                        padding: "10px",
                                        whiteSpace: "nowrap",
                                    }}
                                    primary={index === 1 ? `Parent Organization not found or May be you are not part of parent org. Please contact ${supportEmail}` : null}
                                    colSpan={index === 0 ? 5 : undefined}
                                />
                            ))}
                        </ListItem>
                        )}
                    </List>
                    </div>
                    </div>

                {subOrgs.length > 0 && (
                    <div>
                        <Divider
                            style={{
                                marginTop: 20,
                                marginBottom: 20,
                                backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                            }}
                        />

                        <div
                            style={{
                                textAlign: 'left',
                                width: '100%',
                                padding: '10px',
                                marginTop: 20,
                            }}
                        >
                            <Typography
                                variant='h6'
                                color="textPrimary"
                                style={{
                                    margin: 0,
                                }}
                            >
                                Sub Organizations of the Current Organization ({subOrgs.length})
                            </Typography>
                        </div>

                        {/* <Divider
                            style={{
                                marginTop: 20,
                                marginBottom: 20,
                                backgroundColor: theme.palette.inputColor,
                            }}
                        /> */}

                        <div style={{borderRadius: 4, marginTop: 24, border: theme.palette.defaultBorder, width: "100%", overflowX: "auto", paddingBottom: 0 }}>
                        <List 
                            style={{
                                width: '100%', 
                                tableLayout: "fixed", 
                                display: "table", 
                                minWidth: 800,
                                overflowX: "auto", 
                                paddingBottom: 0,
                            }}>
							{!suborglistOpen ?
								<ListItem
									style={{
										width: "100%",
										display: "table-row",
										padding: "0px 8px 8px 8px",
										whiteSpace: "nowrap",
										textOverflow: "ellipsis",
										verticalAlign: "middle",
										itemAlign: "center",

									}}
								>
									<ListItemText 
										primary={
											<Button 
												fullWidth 
												variant="secondary" 
												style={{
													textTransform: 'none',
												}} 
												onClick={() => setSuborglistOpen(true)}
											>
												Show Sub-Organizations <ArrowDropDownIcon />
											</Button>
										}
										style={{
											width: 100,
											minWidth: 100,
											maxWidth: 100,
											paddingLeft: 20,
											display: "table-cell",
											padding: "0px 8px 8px 8px",
											textAlign: "center",
											borderBottom: theme.palette.defaultBorder,
											verticalAlign: "middle",
										}} 
									/>
								</ListItem>
							: 
							<span>
                            	<ListItem 
                            	    style={{
                            	        width: "100%",
                            	        display: "table-row",
                            	        padding: "0px 8px 8px 8px",
                            	        whiteSpace: "nowrap",
                            	        textOverflow: "ellipsis",
                            	        verticalAlign: "middle",
                            	    }}>
                            	    <ListItemText 
                            	        primary="Logo" 
                            	        style={{
                            	            width: 100,
                            	            minWidth: 100,
                            	            maxWidth: 100,
                            	            paddingLeft: 20,
                            	            display: "table-cell",
                            	            padding: "0px 8px 8px 8px",
                            	            textAlign: "center",
                            	            borderBottom: theme.palette.defaultBorder,
                            	            verticalAlign: "middle",
                            	        }} />
                            	    <ListItemText 
                            	            primary="Name" 
                            	            style={{
                            	                minWidth: 100,
                            	                maxWidth: 300,
                            	                display: "table-cell",
                            	                padding: "0px 8px 8px 8px",
                            	                whiteSpace: "nowrap",
                            	                textOverflow: "ellipsis",
                            	                borderBottom: theme.palette.defaultBorder,
                            	                verticalAlign: "middle",
                            	                textAlign: "center",
                            	            }} />
                            	        {isCloud && (
                            	            <ListItemText
                            	            primary="Region"
                            	            style={{
                            	                minWidth: 100,
                            	                maxWidth: 100,
                            	                display: "table-cell",
                            	                borderBottom: theme.palette.defaultBorder,
                            	                padding: "0px 8px 8px 8px",
                            	            }}
                            	            />
                            	        )}
                            	    <ListItemText
                            	        primary="id"
                            	        style={{
                            	        minWidth: 400,
                            	        maxWidth: 400,
                            	        display: "table-cell",
                            	        padding: "0px 8px 8px 8px",
                            	        whiteSpace: "nowrap",
                            	        textOverflow: "ellipsis",
                            	        borderBottom: theme.palette.defaultBorder,
                            	        verticalAlign: "middle",
                            	        }}
                            	    />
                            	    <ListItemText
                            	        primary="Action"
                            	        style={{
                            	        minWidth: 400,
                            	        maxWidth: 400,
                            	        display: "table-cell",
                            	        padding: "0px 8px 8px 8px",
                            	        whiteSpace: "nowrap",
                            	        textOverflow: "ellipsis",
                            	        borderBottom: theme.palette.defaultBorder,
                            	        verticalAlign: "middle",
                            	        }}
                            	    />
                            	</ListItem>
                            	{subOrgs.map((data, index) => {
									let regiontag = "UK";
									let regionCode = "gb";

									if (data.region_url?.length > 0) {
										const regionsplit = data.region_url.split(".");
										if (regionsplit.length > 2 && !regionsplit[0].includes("shuffler")) {
											const namesplit = regionsplit[0].split("/");
											regiontag = namesplit[namesplit.length - 1];
											if (regiontag === "california") {
												regiontag = "US";
												regionCode = "us";
											} else if (regiontag === "frankfurt") {
												regiontag = "EU-2";
												regionCode = "eu";
											} else if (regiontag === "ca") {
												regiontag = "CA";
												regionCode = "ca";
											}
										}
									}
                                    var bgColor = themeMode === "dark" ? "#212121" : "#FFFFFF";
                                    if (index % 2 === 0) {
                                        bgColor = themeMode === "dark" ? "#1A1A1A" :  "#EAEAEA";
                                    }

									return (
                            	    <ListItem key={index} style={{ backgroundColor: bgColor, width: "100%", borderBottomLeftRadius: 8, display:'table-row', borderBottomRightRadius: 8 }}>
                            	        <ListItemText primary={<img alt={data?.name} src={data.image || theme.palette.defaultImage} style={imageStyle} />} style={{ width: 100,
                            	    minWidth: 100,
                            	    maxWidth: 100,
                            	    display: "table-cell",
                            	    padding: "8px 8px 8px 20px",
                            	    textAlign: "center", }} />
                            	        <ListItemText primary={data.name} style={{ minWidth: 100,
                            	    maxWidth: 300,
                            	    overflow: "hidden",
                            	    whiteSpace: "nowrap",
                            	    textOverflow: "ellipsis",
                            	    display: "table-cell",
                            	    padding: 8,
                            	    verticalAlign: "middle",
                            	    textAlign: "center", }} />

                            	    {isCloud && (
                            	        <ListItemText
                            	            primary={
                            	            <div style={{ display: "flex", alignItems: "center" }}>
                            	                <img
                            	                alt={regiontag}
                            	                src={`https://flagcdn.com/w20/${regionCode}.png`}
                            	                style={{ width: "30px", height: "20px", marginRight: "5px" }}
                            	                />
                            	                <ListItemText primary={regiontag?.toUpperCase()} />
                            	            </div>
                            	            }
                            	            style={{ display: "table-cell", padding: 8, verticalAlign: "middle" }}
                            	        />
                            	        )}
                            	        <ListItemText primary={data.id} style={{ minWidth: 300,
											maxWidth: 300,
											display: "table-cell",
											padding: 8,
											verticalAlign: "middle", }} />

                            	        <ListItemText
                            			primary={
                            	    		<>
                                                <Tooltip title={data.id === userdata?.active_org?.id ? "You are already in this organization." : ""} disableInteractive>
                            	            <Button
                            	                color="primary"
                            	                variant='outlined'
                            	                disabled={data.id === userdata?.active_org?.id}
                            	                onClick={() => {
                            	                    handleClickChangeOrg(data.id);
                            	                }}
                            	                sx={{ 
                            	                    boxShadow:"none", textTransform:"capitalize", 
                            	                    fontSize:16, 
                            	                    '&.Mui-disabled': {
                            	                    backgroundColor: 'rgba(200, 200, 200, 0.5)',
                            	                    color: '#A9A9A9',
                            	                    },
                            	                }}
                            	            >
                            	                Change Active Org
                            	            </Button>
                                            
                            	        </Tooltip>
                                        {selectedOrganization?.creator_org?.length > 0 ? null : 
                                        <Button
                                            variant="outlined"
                                            sx={{
                                                whiteSpace: "nowrap",
                                                textTransform: "none",
                                                fontSize: "16px",
                                                color: "red",
                                                marginLeft: "5px",
                                                borderColor: "red",
                                                "&:hover": {
                                                    color: theme.palette.text.primary,
                                                    backgroundColor: "red",
                                                },

                                            }}
                                            disabled={data?.id === userdata?.active_org?.id}
                                            onClick={() => {
                                                setAccountDeleteButtonClicked(true);
                                                setSelectedSuborg(data);
                                            }}
                                            >
                                            Delete Org
                                            </Button>}

                                        </>
                            	}
                            	style={{ display: "table-cell", verticalAlign: "middle" }}
                            	/>
                            	    </ListItem>
                            	)})}

							</span>}

                        </List>
                        </div>
                    </div>
                )}

                <Divider
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                        backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                    }}
                />

                <div style={{ textAlign: 'left', width: '100%', padding: '10px', marginTop: 20 }}>
                    <Typography
                        variant='h6'
                        color="textPrimary"
                        style={{
                            margin: 0,
                        }}
                    >
                        All Tenants
                    </Typography>
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
                    border: theme.palette.defaultBorder,
                    width: "100%",
                    overflowX: "auto",
                    paddingBottom: 0,
                }}
                >
                <List
                    style={{
                    width: "100%",
                    tableLayout: "fixed",
                    display: "table",
                    minWidth: 800,
                    overflowX: "auto",
                    paddingBottom: 0,
                    }}
                >
					{!allTenantsOpen ?
						<ListItem
							style={{
								width: "100%",
								display: "table-row",
								padding: "0px 8px 8px 8px",
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								verticalAlign: "middle",
								itemAlign: "center",

							}}
						>
							<ListItemText 
								primary={
									<Button 
										fullWidth 
										variant="secondary" 
										style={{
											textTransform: 'none',
										}} 
										onClick={() => setAllTenantsOpen(true)}
									>
										Show ALL your tenants <ArrowDropDownIcon />
									</Button>
								}
								style={{
									width: 100,
									minWidth: 100,
									maxWidth: 100,
									paddingLeft: 20,
									display: "table-cell",
									padding: "0px 8px 8px 8px",
									textAlign: "center",
									borderBottom: theme.palette.defaultBorder,
									verticalAlign: "middle",
								}} 
							/>
						</ListItem>
					: 
					<span>
                    	<ListItem
                    	style={{
                    	    width: "100%",
                    	    display: "table-row",
                    	    padding: "0px 8px 8px 8px",
                    	    whiteSpace: "nowrap",
                    	    textOverflow: "ellipsis",
                    	    verticalAlign: "middle",
                    	}}
                    	>
                    	<ListItemText
                    	    primary="Logo"
                    	    style={{
                    	    width: 100,
                    	    minWidth: 100,
                    	    maxWidth: 100,
                    	    paddingLeft: 20,
                    	    display: "table-cell",
                    	    padding: "0px 8px 8px 8px",
                    	    textAlign: "center",
                    	    borderBottom: theme.palette.defaultBorder,
                    	    verticalAlign: "middle",
                    	    }}
                    	/>
                    	<ListItemText
                    	    primary="Name"
                    	    style={{
                    	    minWidth: 100,
                    	    maxWidth: 300,
                    	    display: "table-cell",
                    	    padding: "0px 8px 8px 8px",
                    	    whiteSpace: "nowrap",
                    	    textOverflow: "ellipsis",
                    	    borderBottom: theme.palette.defaultBorder,
                    	    verticalAlign: "middle",
                    	    textAlign: "center",
                    	    }}
                    	/>
                    	{isCloud && (
                    	    <ListItemText
                    	    primary="Region"
                    	    style={{
                    	        minWidth: 100,
                    	        maxWidth: 100,
                    	        display: "table-cell",
                    	        borderBottom: theme.palette.defaultBorder,
                    	        padding: "0px 8px 8px 8px",
                    	    }}
                    	    />
                    	)}
                    	<ListItemText
                    	    primary="id"
                    	    style={{
                    	    minWidth: 400,
                    	    maxWidth: 400,
                    	    display: "table-cell",
                    	    padding: "0px 8px 8px 8px",
                    	    whiteSpace: "nowrap",
                    	    textOverflow: "ellipsis",
                    	    borderBottom: theme.palette.defaultBorder,
                    	    verticalAlign: "middle",
                    	    }}
                    	/>
                    	<ListItemText
                    	    primary="Action"
                    	    style={{
                    	    minWidth: 400,
                    	    maxWidth: 400,
                    	    display: "table-cell",
                    	    padding: "0px 8px 8px 8px",
                    	    whiteSpace: "nowrap",
                    	    textOverflow: "ellipsis",
                    	    borderBottom: theme.palette.defaultBorder,
                    	    verticalAlign: "middle",
                    	    }}
                    	/>
                    	</ListItem>

                    	{userdata?.orgs?.length <= 0 ? (
                    	[...Array(6)].map((_, rowIndex) => (
                    	    <ListItem
                    	    key={rowIndex}
                    	    style={{
                    	        display: "table-row",
                    	        backgroundColor: "#212121",
                    	    }}
                    	    >
                    	    {Array(7)
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
                    	) : (
                    	userdata?.orgs?.length > 0 &&
                    	userdata.orgs.map((data, index) => {
                    	    let regiontag = "UK";
                    	    let regionCode = "gb";

                    	    if (data.region_url?.length > 0) {
								const regionsplit = data.region_url.split(".");
								if (regionsplit.length > 2 && !regionsplit[0].includes("shuffler")) {
									const namesplit = regionsplit[0].split("/");
									regiontag = namesplit[namesplit.length - 1];

									if (regiontag === "california") {
									regiontag = "US";
									regionCode = "us";
									} else if (regiontag === "frankfurt") {
									regiontag = "EU-2";
									regionCode = "eu";
									} else if (regiontag === "ca") {
									regiontag = "CA";
									regionCode = "ca";
									}
								}
                    	    }

                            var bgColor = themeMode === "dark" ? "#212121" : "#FFFFFF";
                            if (index % 2 === 0) {
                                bgColor = themeMode === "dark" ? "#1A1A1A" :  "#EAEAEA";
                            }

                    	    return (
                    	    <ListItem
                    	        key={index}
                    	        style={{
                    	        display: "table-row",
                    	        verticalAlign: "middle",
                    	        padding: 8,
                    	        backgroundColor: bgColor,
                    	        borderBottomLeftRadius:
                    	            userdata?.orgs?.length - 1 === index ? 8 : 0,
                    	        borderBottomRightRadius:
                    	            userdata?.orgs?.length - 1 === index ? 8 : 0,
                    	        }}
                    	    >
                    	        <ListItemText
                    	        primary={
                    	            <img
                    	            alt={data.name}
                    	            src={data.image || theme.palette.defaultImage}
                    	            style={imageStyle}
                    	            />
                    	        }
                    	        style={{
                    	            width: 100,
                    	            minWidth: 100,
                    	            maxWidth: 100,
                    	            display: "table-cell",
                    	            padding: "8px 8px 8px 20px",
                    	            textAlign: "center",
                    	        }}
                    	        />
                    	        <ListItemText
                    	        primary={data?.name}
                    	        style={{
                    	            minWidth: 100,
                    	            maxWidth: 300,
                    	            overflow: "hidden",
                    	            whiteSpace: "nowrap",
                    	            textOverflow: "ellipsis",
                    	            display: "table-cell",
                    	            padding: 8,
                    	            verticalAlign: "middle",
                    	            textAlign: "center",
                    	        }}
                    	        ></ListItemText>
                    	        {isCloud ? (
                    	        <ListItemText
                    	            primary={
                    	            <div style={{ display: "flex", alignItems: "center" }}>
                    	                <img
                    	                alt={regiontag}
                    	                src={`https://flagcdn.com/w20/${regionCode}.png`}
                    	                style={{
                    	                    display: "table-cell",
                    	                    padding: 8,
                    	                    verticalAlign: "middle",
                    	                }}
                    	                />

                    	                <ListItemText primary={regiontag} />
                    	            </div>
                    	            }
                    	            style={{
                    	            display: "table-cell",
                    	            padding: 8,
                    	            verticalAlign: "middle",
                    	            }}
                    	        ></ListItemText>
                    	        ) : null}
                    	        <ListItemText
                    	        primary={data.id}
                    	        style={{
                    	            minWidth: 300,
                    	            maxWidth: 300,
                    	            display: "table-cell",
                    	            padding: 8,
                    	            verticalAlign: "middle",
                    	        }}
                    	        />
                    	        <ListItemText
                    	        primary={
                    	            <Button
                    	            variant="outlined"
                    	            style={{
                    	                whiteSpace: "nowrap",
                    	                textTransform: "none",
                    	                fontSize: 16,
                    	            }}
                    	            disabled={data?.id === userdata?.active_org?.id}
                    	            onClick={() => {
                    	                handleClickChangeOrg(data?.id);
                    	            }}
                    	            >
                    	            Change Active Org
                    	            </Button>
                    	        }
                    	        style={{
                    	            display: "table-cell",
                    	            padding: 8,
                    	            verticalAlign: "middle",
                    	        }}
                    	        ></ListItemText>
                    	    </ListItem>
                    	    );
                    	})
                    	)}
					</span>}
                </List>
                </div>
                </div>
            </div>

        </div>
    );
});

export default TenantsTab;
