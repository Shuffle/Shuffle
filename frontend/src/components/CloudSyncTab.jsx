import React, { useEffect, useState, useContext } from "react";
import {
    FormControl,
    Card,
    Tooltip,
    Typography,
    TextField,
    Button,
    Grid,
    ListItem,
    ListItemText,
    ListItemAvatar,
    IconButton,
    Avatar,
    Zoom,
    InputAdornment,
    Switch,
    Skeleton
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import {
    Edit as EditIcon,
    Polyline as PolylineIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import theme from "../theme.jsx";
import { styled } from '@mui/styles';
import { Context } from "../context/ContextApi.jsx";

const CloudSyncTab = (props) => {
    const {
        userdata,
        globalUrl,
        serverside
    } = props;
    const [cloudSyncApikey, setCloudSyncApikey] = useState("");
    const [loading, setLoading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [orgSyncResponse, setOrgSyncResponse] = React.useState("");
    const [organizationFeatures, setOrganizationFeatures] = React.useState({});
    const [selectedOrganization, setSelectedOrganization] = React.useState({});
    const [selectedStatus, setSelectedStatus] = React.useState([]);
    const [orgRequest, setOrgRequest] = React.useState(true);
    const [userSettings, setUserSettings] = React.useState({});
    const [, forceUpdate] = React.useState();
    const itemColor = "white";
    const isCloud = window?.location?.host === "localhost:3002" || window?.location?.host === "shuffler.io";
    useEffect(() => { getSettings(); }, []);
    const GridItem = (props) => {
        const [expanded, setExpanded] = React.useState(false);
        const [showEdit, setShowEdit] = React.useState(false);
        const [newValue, setNewValue] = React.useState(-100);

        const primary = props.data.primary;
        const secondary = props.data.secondary;
        const primaryIcon = props.data.icon;
        const secondaryIcon = props.data.active ?
            <CheckCircleIcon style={{ color: "green" }} />
            :
            <CloseIcon style={{ color: "red" }} />
           
        const submitFeatureEdit = (sync_features) => {
            if (!userdata.support) {
                console.log("User does not have support access and can't edit features");
                return
            }

            sync_features.editing = true
            const data = {
                org_id: selectedOrganization.id,
                sync_features: sync_features,
            };
            console.log("sync_features: ", sync_features);
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
                    })
                )
                .catch((error) => {
                    toast("Err: " + error.toString());
                });
        }

        const enableFeature = () => {
            console.log("Enabling " + primary)

            console.log(selectedOrganization.sync_features)
            // Check if primary is in sync_features
            var tmpprimary = primary.replaceAll(" ", "_")
            if (!(tmpprimary in selectedOrganization.sync_features)) {
                console.log("Primary not in sync_features: " + tmpprimary)
                return
            }

            if (props.data.active) {
                selectedOrganization.sync_features[tmpprimary].active = false
            } else {
                selectedOrganization.sync_features[tmpprimary].active = true
            }

            setSelectedOrganization(selectedOrganization)
            forceUpdate(Math.random())
            submitFeatureEdit(selectedOrganization.sync_features)
        }

        const submitEdit = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Check if primary is in sync_features
            var tmpprimary = primary.replaceAll(" ", "_")
            if (!(tmpprimary in selectedOrganization.sync_features)) {
                console.log("Primary not in sync_features: " + tmpprimary)
                return
            }

            // Make it into a number
            var tmp = parseInt(newValue)
            if (isNaN(tmp)) {
                console.log("Not a number: " + newValue)
                return
            }

            selectedOrganization.sync_features[tmpprimary].limit = tmp

            setSelectedOrganization(selectedOrganization)
            forceUpdate(Math.random())
            submitFeatureEdit(selectedOrganization.sync_features)
        }
        const handleToggleFeature = (e) => {
            // Your logic for toggling the feature's active state
            console.log(`Toggling ${primary}`);
            if (!isCloud || userdata.support !== true) {
                return
            }

            e.preventDefault();
            e.stopPropagation();

            enableFeature()
        };

        return (
            <Grid
                item
                xs={4}
            >
                <div
                    style={{
                        margin: 4,
                        backgroundColor: "#1a1a1a",
                        borderRadius: 8,
                        color: "white",
                        minHeight: expanded ? 250 : "inherit",
                        maxHeight: expanded ? 300 : "inherit",
                        boxShadow: "none",
                    }}
                >
                    <ListItem
                        style={{ cursor: "pointer", }}
                        onClick={() => {
                            setExpanded(prev => !prev);
                            if(showEdit){
                                setShowEdit(false)
                            }
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar>{primaryIcon}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            style={{ textTransform: "capitalize", color: "#F1F1F1", fontSize: 14, fontWeight: 400, }}
                            primary={primary}
                        />
                        {isCloud && userdata.support === true ?
                            <Tooltip title="Edit features (support users only)">
                                <EditIcon
                                    color="secondary"
                                    style={{ marginRight: 10, cursor: "pointer", }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('expanded', expanded)
                                        if (expanded){
                                            setExpanded(false)
                                        }
                                        if (showEdit) {
                                            setShowEdit(false)
                                            return
                                        }

                                        console.log("Edit")

                                        setShowEdit(true)
                                    }}
                                />
                            </Tooltip>
                            : null}
                        {userdata.support === true ?(
                            <Tooltip title={props.data.active ? 'Disable feature' : 'Enable feature'}>
                            <Switch
                                checked={props.data.active}
                                onChange={handleToggleFeature}
                                color="primary"
                                inputProps={{ 'aria-label': 'feature toggle' }}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#FFFFFF',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: props.data.active ? '#2BC07E' : "#9e9e9e",
                                    },
                                    "& .MuiSwitch-track": {
                                        backgroundColor: props.data.active ? '#2BC07E' : "#9e9e9e"
                                    }
                                }}
                            />
                        </Tooltip>
                        ):(
                            <Tooltip title={props.data.active ? "Disable feature" : "Enable feature"}>
                            <span
                                style={{ cursor: "pointer", marginTop: 5, }}
                                onClick={(e) => {
                                    if (!isCloud || userdata.support !== true) {
                                        return
                                    }

                                    e.preventDefault();
                                    e.stopPropagation();

                                    enableFeature()
                                }}
                            >
                                {secondaryIcon}
                            </span>
                        </Tooltip>
                        )}
                        
                    </ListItem>
                    {expanded ?
                        <div style={{ padding: 15 }}>
                            <Typography>
                                <b>Usage:&nbsp;</b>
                                {props.data.limit === 0 ? (
                                    "Unlimited"
                                ) : (
                                    <span>
                                        {props.data.usage} / {props.data.limit === "" ? "Unlimited" : props.data.limit}
                                    </span>
                                )}
                            </Typography>
                            {/*<Typography>
                Data sharing: {props.data.data_collection}
              </Typography>*/}
                            <Typography style={{ maxHeight: 150, overflowX: "hidden", overflowY: "auto" }}><b>Description:</b> {secondary}</Typography>
                        </div>
                        : null}


                    {showEdit ?
                        <FormControl fullWidth onSubmit={(e) => {
                            console.log("Submit")
                            submitEdit(e)
                        }}>
                            <span style={{ display: "flex",}}>

                                <TextField
                                    style={{ flex: 3, }}
                                    color="primary"
                                    label={"Edit value"}
                                    defaultValue={props.data.limit}
                                    sx={{
                                        marginTop: 0.5,
                                        marginBottom: 0.5
                                    }}
                                    onChange={(event) => {
                                        setNewValue(event.target.value)
                                    }}
                                />
                                <Button
                                    style={{ flex: 1, }}
                                    variant="contained"
                                    disabled={newValue < -1}
                                    onClick={(e) => {
                                        console.log("Submit 2")
                                        submitEdit(e)
                                    }}
                                    sx={{
                                        marginTop: 0.5,
                                        maarginBottom: 0.5
                                    }}
                                >
                                    Submit
                                </Button>
                            </span>
                        </FormControl>
                        : null}
                </div>
            </Grid>
        );
    };
    const handleGetOrg = (orgId) => {

        if (serverside !== true && window.location.search !== undefined && window.location.search !== null) {
            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());
            const foundorgid = params["org_id"];
            if (foundorgid !== undefined && foundorgid !== null) {
                orgId = foundorgid;
            }
        }

        if (orgId.length === 0) {
            toast("Organization ID not defined. Please contact us on https://shuffler.io if this persists logout.");
            return;
        }

        // Just use this one?

        fetch(`${globalUrl}/api/v1/orgs/${orgId}`, {
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
                    toast("Failed getting your org. If this persists, please contact support.");
                } else {
                    if (
                        responseJson.sync_features === undefined ||
                        responseJson.sync_features === null
                    ) {
                        responseJson.sync_features = {};
                    }

                    setSelectedOrganization(responseJson)
                    var lists = {
                        active: {
                            triggers: [],
                            features: [],
                            sync: [],
                        },
                        inactive: {
                            triggers: [],
                            features: [],
                            sync: [],
                        },
                    };
                    setOrganizationFeatures(lists);
                }
            })
            .catch((error) => {
                console.log("Error getting org: ", error);
                toast("Error getting current organization");
            });
    };
    const handleStopOrgSync = (org_id) => {
        if (org_id === undefined || org_id === null) {
            toast("Couldn't get org " + org_id);
            return;
        }

        const data = {};

        const url = globalUrl + "/api/v1/orgs/" + org_id + "/stop_sync";
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
                if (response.status === 200) {
                    console.log("Cloud sync success?");
                    toast("Successfully stopped cloud sync");
                } else {
                    console.log("Cloud sync fail?");
                    toast(
                        "Failed stopping sync. Try again, and contact support if this persists."
                    );
                }

                return response.json();
            })
            .then((responseJson) => {
                setTimeout(() => {
                    handleGetOrg(org_id);
                }, 1000);
            })
            .catch((error) => {
                toast("Err: " + error.toString());
            });
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
                    //getOrgs(); API no longer in use, as it's in handleInfo request
                    if (disableSync) {
                        toast("Successfully disabled sync!");
                        setOrgSyncResponse("Successfully disabled syncronization");
                    } else {
                        toast("Cloud Syncronization successfully set up!");
                        setOrgSyncResponse(
                            "Successfully started syncronization. Cloud features you now have access to can be seen below."
                        );
                    }

                    selectedOrganization.cloud_sync = !selectedOrganization.cloud_sync;
                    setSelectedOrganization(selectedOrganization);
                    setCloudSyncApikey("");

                    handleGetOrg(userdata.active_org.id);
                }
            })
            .catch((error) => {
                setLoading(false);
                toast("Err: " + error.toString());
            });
    };
    const getSettings = () => {
        fetch(globalUrl + "/api/v1/getsettings", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 when getting settings :O!");
                }

                return response.json();
            })
            .then((responseJson) => {
                setUserSettings(responseJson);
            })
            .catch((error) => {
                console.log(error);
            });
    };
    if (
        selectedOrganization.id === undefined &&
        userdata !== undefined &&
        userdata.active_org !== undefined &&
        orgRequest === true
    ) {
        setOrgRequest(false);
        handleGetOrg(userdata.active_org.id);
    }
    
    return (
            <div style={{padding: "27px 10px 19px 27px",}}>
            <div style={{ marginBottom: 20 }}>
                <h2
                    style={{ marginBottom: 8, marginTop: 0, color: "#ffffff" }}
                >
                    Cloud syncronization
                </h2>
                <span style={{ color: "#C8C8C8", fontSize: 16, fontWeight: 400, }}>
                    What does <a href="/docs/organizations#cloud_sync" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255, 132, 68, 1)", fontSize: 16, textDecoration: 'none', }}>cloud sync</a> do? Cloud synchronization is a way of getting more out of Shuffle. Shuffle will ALWAYS make every option open source, but features relying on other users can't be done without a collaborative approach.
                    </span>
            </div>

            {isCloud ? (
                <div style={{ marginTop: 15, display: "flex" }}>
                    <div style={{ flex: 1 }}>
                        <Typography style={{fontWeight: 400, fontSize: 16, color: "#F1F1F1"}}>
                            Currently syncronizing:{" "}
                            {selectedOrganization.cloud_sync_active === true
                                ? <span style={{ color: "#4CFD72", fontSize: 16, marginLeft: 16}}>True</span>
                                : <span style={{ color: "#FD4C62", fontSize: 16, marginLeft: 16 }}>False</span>}
                        </Typography>
                        {selectedOrganization.cloud_sync_active ? (
                            <Typography style={{}}>
                                Syncronization interval:{" "}
                                {selectedOrganization.sync_config.interval === 0
                                    ? "60"
                                    : selectedOrganization.sync_config.interval}
                            </Typography>
                        ) : null}
                        <Typography
                            style={{
                                whiteSpace: "nowrap",
                                marginTop: 25,
                                marginRight: 10,
                                fontSize: 16, 
                                fontWeight: 400,
                                fontFamily: theme.typography.fontFamily,
                            }}
                        >
                            Your Api key
                        </Typography>
                        {userSettings?.apikey === undefined || userSettings?.apikey === null || userSettings?.apikey?.length <=0 ? (
                                <Skeleton variant="rectangular" animation="wave" sx={{backgroundColor: '#212121', border: '1px solid #646464', width: 500, height: 50, marginTop: 2 }}/>
                        ):
                        <div style={{ display: "flex" }}>
                            <TextField
                                color="primary"
                                style={{
                                    backgroundColor: theme.palette.inputColor,
                                    maxWidth: 500,
                                    height: 35
                                }}
                                InputProps={{
                                    sx: {
                                        height: "35px",
                                        color: "white",
                                        fontSize: "1em",
                                        backgroundColor: '#212121',
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => {
                                                    setShowApiKey(!showApiKey)
                                                }}
                                            >
                                                {showApiKey ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                required
                                fullWidth={true}
                                disabled={true}
                                autoComplete="cloud apikey"
                                id="apikey_field"
                                margin="normal"
                                placeholder="Cloud Apikey"
                                variant="outlined"
                                value={userSettings?.apikey}
                                defaultValue={userSettings?.apikey}
                                type={!isCloud || showApiKey ? "text" : "password"}
                            />
                            {selectedOrganization.cloud_sync_active ? (
                                <Button
                                    style={{
                                        width: 150,
                                        height: 50,
                                        marginLeft: 10,
                                        marginTop: 17,
                                    }}
                                    variant={
                                        selectedOrganization.cloud_sync_active === true
                                            ? "outlined"
                                            : "contained"
                                    }
                                    color="primary"
                                    onClick={() => {
                                        handleStopOrgSync(selectedOrganization.id);
                                    }}
                                >
                                    Stop Sync
                                </Button>
                            ) : null}
                        </div>}
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{ display: "flex", marginBottom: 20 }}>
                        <TextField
                            color="primary"
                            style={{
                                backgroundColor: "#1a1a1a",
                                marginRight: 10,
                                height: 35,
                            }}
                            InputProps={{
                                style: {
                                    height: "35px",
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
                            style={{ marginTop: 15, height: 35, width: 150, textTransform: 'none', fontSize: 16, color:  (!selectedOrganization.cloud_sync &&
                                cloudSyncApikey.length === 0) ||
                            loading ? null : "#1a1a1a", backgroundColor:  (!selectedOrganization.cloud_sync &&
                                cloudSyncApikey.length === 0) ||
                            loading? null : "#FF8544" }}
                            onClick={() => {
                                setLoading(true);
                                enableCloudSync(
                                    cloudSyncApikey,
                                    selectedOrganization,
                                    selectedOrganization.cloud_sync
                                );
                            }}
                            color="primary"
                            variant={
                                selectedOrganization.cloud_sync === true
                                    ? "outlined"
                                    : "contained"
                            }
                        >
                            {selectedOrganization.cloud_sync
                                ? "Stop sync"
                                : "Start sync"}
                        </Button>
                    </div>
                    {orgSyncResponse.length > 0 ? (
                        <Typography style={{ marginTop: 5, marginBottom: 10 }}>
                            Message from Shuffle Cloud: <b>{orgSyncResponse}</b>
                        </Typography>
                    ) : null}
                </div>
            )}

            <h2 style={{ marginLeft: 5, marginTop: 40, marginBottom: 5 }}>
                Features
            </h2>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24, fontSize: 16, fontWeight: 400, marginLeft: 5, color: "#C8C8C8" }}>
              Features and Limitations that are currently available to you in your Cloud or Hybrid Organization. App Executions (App Runs) reset monthly. If the organization is a customer or in a trial, these features limitations are not always enforced.            </Typography>
            <Grid container style={{ width: "100%", marginBottom: 15,  }}>

                {selectedOrganization.sync_features === undefined ||
                    selectedOrganization.sync_features === null
                    ? <Grid container spacing={2} justifyContent="center">
                    {[...Array(18)].map((_, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <div
                                style={{
                                    margin: 4,
                                    borderRadius: 8,
                                    minHeight: "inherit",
                                    maxHeight: "inherit",
                                    boxShadow: "none",
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Skeleton
                                    variant="rectangular"
                                    height={50}
                                    width={343}
                                    sx={{ backgroundColor: '#1a1a1a', display: 'flex', borderRadius: 1 }}
                                    animation="wave"
                                />
                            </div>
                        </Grid>
                    ))}
                </Grid>                
                    : Object.keys(selectedOrganization.sync_features).map(function (
                        key,
                        index
                    ) {

                        if (key === "schedule" || key === "apps" || key === "updates" || key === "editing") {
                            return null;
                        }

                        const item = selectedOrganization.sync_features[key];
                        if (item === null) {
                            return null
                        }

                        const newkey = key.replaceAll("_", " ");
                        const griditem = {
                            primary: newkey,
                            secondary:
                                item.description === undefined ||
                                    item.description === null ||
                                    item.description.length === 0
                                    ? "Not defined yet"
                                    : item.description,
                            limit: item.limit,
                            usage: item.usage === undefined ||
                                item.usage === null ? 0 : item.usage,
                            data_collection: "None",
                            active: item.active,
                            icon: <PolylineIcon style={{ color: "#1a1a1a" }} />,
                        };

                        return (
                            <Zoom key={index}>
                                <GridItem data={griditem} />
                            </Zoom>
                        );
                    })}
            </Grid>
            </div>
    );
};

export default CloudSyncTab;
