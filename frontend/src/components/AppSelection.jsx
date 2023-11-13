import React, { useState, useEffect, useRef } from "react";
import theme from '../theme.jsx';
import ReactGA from 'react-ga4';
import { useNavigate, Link } from 'react-router-dom';

import { Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon, Close as CloseIcon, Folder as FolderIcon, LibraryBooks as LibraryBooksIcon } from '@mui/icons-material';
import aa from 'search-insights'
import DeleteIcon from '@mui/icons-material/Delete';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ExploreIcon from '@mui/icons-material/Explore';
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import ExtensionIcon from "@mui/icons-material/Extension";
import EmailIcon from "@mui/icons-material/Email";
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AppSearch from "../components/Appsearch.jsx";
import AppSearchButtons from "../components/AppSearchButtons.jsx";
import { toast } from 'react-toastify';
import {
    Zoom,
    Grid,
    Paper,
    TextField,
    Collapse,
    IconButton,
    Avatar,
    ButtonBase,
    InputAdornment,
    Typography,
    Button,
    Tooltip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from '@mui/material';

const AppSelection = props => {
    const {
        userdata,
        globalUrl,
        appFramework,
        setActiveStep,
        defaultSearch,
        setDefaultSearch,
        checkLogin,
    } = props;
    const [discoveryData, setDiscoveryData] = React.useState({})
    const [selectionOpen, setSelectionOpen] = React.useState(false)
    const [newSelectedApp, setNewSelectedApp] = React.useState({})
    const [finishedApps, setFinishedApps] = React.useState([])
    const [appButtons, setAppButtons] = useState([])
    const [apps, setApps] = useState([])
    const [appName, setAppName] = React.useState();
    const [moreButton, setMoreButton] = useState(false);

    // const [mouseHoverIndex, setMouseHoverIndex] = useState(-1)
    const ref = useRef()
    let navigate = useNavigate();
    const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";


    const setFrameworkItem = (data) => {
        console.log("Setting framework item: ", data, isCloud)
        // if (!isCloud) {
        //   activateApp(data.id)
        // }

        fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
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
                    console.log("Status not 200 for framework!");
                }

                if (checkLogin !== undefined) {
                    checkLogin()
                }

                return response.json();
            })
            .then((responseJson) => {
                if (responseJson.success === false) {
                    if (responseJson.reason !== undefined) {
                        toast("Failed updating: " + responseJson.reason)
                    } else {
                        toast("Failed to update framework for your org.")

                    }
                }
                //setFrameworkLoaded(true)
                //setFrameworkData(responseJson)
            })
            .catch((error) => {
                if (checkLogin !== undefined) {
                    checkLogin()
                }

                toast(error.toString());
                //setFrameworkLoaded(true)
            })
    }
    const GetApps = (data) => {
        console.log("Setting framework item: ", data, isCloud)
        // if (!isCloud) {
        //   activateApp(data.id)
        // }

        fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
        })
            .then((responseJson) => {
                if (responseJson === null) {
                    console.log("null-response from server")
                    const pretend_apps = [{
                        "description": "TBD",
                        "id": "TBD",
                        "large_image": "",
                        "name": "TBD",
                        "type": "TBD"
                    }]

                    setApps(pretend_apps)
                    return
                }

                if (responseJson.success === false) {
                    console.log("error loading apps: ", responseJson)
                    return
                }

                setApps(responseJson);
            })
            .catch((error) => {
                console.log("App loading error: " + error.toString());
            })
    }

    const onNodeSelect = (label) => {
        // if (setDiscoveryWrapper !== undefined) {
        //     setDiscoveryWrapper({ id: label });
        // }

        if (isCloud) {
            ReactGA.event({
                category: "welcome",
                action: `click_${label}`,
                label: "",
            });
        }
        setDiscoveryData(label)
        setSelectionOpen(true)
        setNewSelectedApp({})
        setDefaultSearch(label.charAt(0).toUpperCase() + (label.substring(1)).toLowerCase())
    };

    useEffect(() => {
        var tempApps = []
        if (tempApps.length === 0) {
            const tempApps =
                [{
                    "description": newSelectedApp.description,
                    "id": newSelectedApp.objectID,
                    "large_image": newSelectedApp.image_url,
                    "name": newSelectedApp.name,
                    "type": discoveryData
                },
                    //{
                    // 	// description: newSelectedApp.siem.description,
                    //     id: newSelectedApp.siem.objectID,
                    //     large_image: newSelectedApp.siem.image_url,
                    //     name: newSelectedApp.siem.name,
                    //     type: discoveryData.siem
                    // },{
                    // 	// description: newSelectedApp.edr.description,
                    //     id: newSelectedApp.edr.objectID,
                    //     large_image: newSelectedApp.edr.image_url,
                    //     name: newSelectedApp.edr.name,
                    //     type: discoveryData.edr
                    // }
                ]
            setAppButtons(tempApps)
            GetApps()
        }
    }, [])

    useEffect(() => {
        if (newSelectedApp.objectID === undefined || newSelectedApp.objectID === undefined || newSelectedApp.objectID.length === 0) {
            return
        }
        const submitNewApp = {
            description: newSelectedApp.description,
            id: newSelectedApp.objectID,
            large_image: newSelectedApp.image_url,
            name: newSelectedApp.name,
            type: discoveryData
        }
        if (discoveryData === "CASES") {
            appFramework.cases = submitNewApp
        }
        else if (discoveryData === "SIEM") {
            appFramework.siem = submitNewApp
        }
        else if (discoveryData === "ERADICATION") {
            appFramework.edr = submitNewApp
        }
        else if (discoveryData === "INTEL") {
            appFramework.intel = submitNewApp
        }
        else if (discoveryData === "EMAIL") {
            appFramework.communication = submitNewApp
        }
        else if (discoveryData === "NETWORK") {
            appFramework.network = submitNewApp
        }
        else if (discoveryData === "ASSETS") {
            appFramework.assets = submitNewApp
        }
        else if (discoveryData === "IAM") {
            appFramework.iam = submitNewApp
        }
        setFrameworkItem(submitNewApp);
        setSelectionOpen(false);
        console.log("Selected app changed (effect)");
    }, [newSelectedApp]);

    const sizing = moreButton ? 510 : 480;
    const buttonWidth = 450;
    const buttonMargin = 10;
    const bottomButtonStyle = {
        borderRadius: 200,
        marginTop: moreButton ? 44 : "",
        height: 51,
        width: 510,
        fontSize: 16,
        // background: "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)",
        background: "linear-gradient(90deg, #F86744 0%, #F34475 100%)",
        padding: "16px 24px",
        // top: 20,
        // margin: "auto",
        textTransform: 'capitalize',
        itemAlign: "center",
        // marginTop: 25
        // marginLeft: "65px",
    };
    const buttonStyle = {
        flex: 1,
        width: 224,
        padding: 25,
        margin: buttonMargin,
        color: "var(--White-text, #F1F1F1)",
        fontWeight: 400,
        fontSize: 17,
        background: "rgba(33, 33, 33, 1)",
        textTransform: 'capitalize',
        border: "1px solid rgba(33, 33, 33, 1)",
        borderRadius: 8,
        marginRight: 8,
    };
    // console.log("appFramework",appFramework.cases.name)
    return (
        <Collapse in={true}>
            <div
                style={{
                    minHeight: sizing,
                    maxHeight: sizing,
                    marginTop: 10,
                    width: 500,
                }}
            >
                {selectionOpen ? (
                    <div
                        style={{
                            width: 319,
                            height: 395,
                            flexShrink: 0,
                            marginLeft: 70,
                            marginTop: 68,
                            position: "absolute",
                            zIndex: 100,
                            borderRadius: 6,
                            border: "1px solid var(--Container-Stroke, #494949)",
                            background: "var(--Container, #212121)",
                            boxShadow: "8px 8px 32px 24px rgba(0, 0, 0, 0.16)",
                        }}
                    >
                        <div style={{ display: "flex" }}>
                            <div style={{ display: "flex", textAlign: "center", textTransform: "capitalize" }}>
                                <Typography style={{ padding: 16, color: "#FFFFFF", textTransform: "capitalize" }}> {discoveryData} </Typography>
                            </div>
                            <div style={{ display: "flex" }}>
                                <Tooltip
                                    title="Close"
                                    placement="top"
                                    style={{ zIndex: 10011 }}
                                >
                                    <IconButton
                                        style={{
                                            flex: 1,
                                            // width: 224,
                                            marginLeft: discoveryData === ('ERADICATION') ? 120 : 177,
                                            width: "100%",
                                            marginBottom: 23,
                                            fontSize: 16,
                                            background: "rgba(33, 33, 33, 1)",
                                            borderColor: "rgba(33, 33, 33, 1)",
                                            borderRadius: 8,
                                        }}
                                        onClick={() => {
                                            setSelectionOpen(false)
                                        }}
                                    >
                                        <CloseIcon style={{ width: 16 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip
                                    title="Delete app"
                                    placement="bottom"
                                    style={{ zIndex: 10011 }}
                                >
                                    <IconButton
                                        style={{ zIndex: 12501, position: "absolute", top: 32, right: 16 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectionOpen(false)
                                            setDefaultSearch("")
                                            const submitDeletedApp = {
                                                "description": "",
                                                "id": "remove",
                                                "name": "",
                                                "type": discoveryData
                                            }
                                            setFrameworkItem(submitDeletedApp)
                                            setNewSelectedApp({})
                                            setTimeout(() => {
                                                setDiscoveryData({})
                                                setFrameworkItem(submitDeletedApp)
                                                setNewSelectedApp({})
                                            }, 1000)
                                            //setAppName(discoveryData.cases.name)
                                        }}
                                    >
                                        <DeleteIcon style={{ color: "white", height: 15, width: 15, }} />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>
                        <div
                            style={{ width: "100%", border: "1px #494949 solid" }}
                        />
                        <AppSearch
                            defaultSearch={defaultSearch}
                            newSelectedApp={newSelectedApp}
                            setNewSelectedApp={setNewSelectedApp}
                            userdata={userdata}
                        // cy={cy}
                        />
                    </div>
                ) : null}
                <Typography
                    variant="h4"
                    style={{
                        marginLeft: 8,
                        marginTop: 40,
                        marginRight: 30,
                        marginBottom: 0,
                    }}
                    color="rgba(241, 241, 241, 1)"
                >
                    Find your apps
                </Typography>
                <Typography
                    variant="body2"
                    style={{
                        marginLeft: 8,
                        marginTop: 10,
                        marginRight: 30,
                        marginBottom: 40,
                    }}
                    color="rgba(158, 158, 158, 1)"
                >
                    Select the apps you work with and we will connect them for you.
                </Typography>
                {appButtons.map((appData, index) => {

                    const appName = appData.name
                    const AppImage = appData.large_image
                    const appType = appData.type

                    return (

                        <AppSearchButtons
                            appFramework={appFramework}
                            appName={appName}
                            appType = {appType}
                            AppImage={AppImage}
                            defaultSearch={defaultSearch}
                            finishedApps={finishedApps}
                            onNodeSelect={onNodeSelect}
                            discoveryData={discoveryData}
                            setDiscoveryData={setDiscoveryData}
                            setDefaultSearch={setDefaultSearch}
                            apps={apps}
                        />
                    )
                })}
            </div>
            <div style={{ flexDirection: "row", }}>
                <Button variant="contained" type="submit" fullWidth style={bottomButtonStyle} onClick={() => {
                    navigate("/welcome?tab=3")
                    setActiveStep(2)
                }}>
                    Continue
                </Button>
            </div>
        </Collapse>
    )
}

export default AppSelection;
