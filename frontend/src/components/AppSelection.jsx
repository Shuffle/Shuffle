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
    const [moreButton, setMoreButton] = useState(false);
    const [mouseHoverIndex, setMouseHoverIndex] = useState(-1)
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
            appFramework.eradication = submitNewApp
        }
        else if (discoveryData === "INTEL") {
            appFramework.intel = submitNewApp
        }
        else if (discoveryData === "EMAIL") {
            appFramework.email = submitNewApp
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

    const sizing = 510;
    const buttonWidth = 450;
  const buttonMargin = 10;
    const bottomButtonStyle = {
        borderRadius: 200,
        marginTop: moreButton ? 44 : "",
        height: 51,
        width: 464,
        fontSize: 16,
        // background: "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)",
        background: "linear-gradient(90deg, #F86744 0%, #F34475 100%)",
        padding: "16px 24px",
        // top: 20,
        // margin: "auto",
        itemAlign: "center",
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
        border: mouseHoverIndex ? "1px solid rgba(33, 33, 33, 1)" : "1px solid #f85a3e",
        borderRadius: 8,
        marginRight: 8,
    };

    return (
        <Collapse in={true}>
            <div
                style={{
                    minHeight: sizing,
                    maxHeight: sizing,
                    marginTop: 20,
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
                            <div style={{ display: "flex", textAlign: "center" }}>
                                <Typography style={{ padding: 16 }}> {discoveryData} </Typography>
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
                    Select the apps you work with and we will connect the for you.
                </Typography>
                <Grid item xs={11} style={{}}>
                    {/*<FormLabel style={{ color: "#B9B9BA" }}>Find your integrations!</FormLabel>*/}
                    <div style={{ display: "flex", width: 464 }}
                        onMouseOver={() => {
                            setMouseHoverIndex()
                        }} onMouseOut={() => {
                            setMouseHoverIndex(-1)
                        }}
                    >
                        <Button
                            disabled={finishedApps.includes("CASES")}
                            variant={
                                defaultSearch === "CASES" ? "contained" : "outlined"
                            }
                            color="secondary"
                            style={{
                                flex: 1,
                                width: "100%",
                                padding: 25,
                                margin: buttonMargin,
                                fontSize: 18,
                                color: "var(--White-text, #F1F1F1)",
                                fontWeight: 400,
                                background: "rgba(33, 33, 33, 1)",
                                borderRadius: 8,
                                textTransform: 'capitalize',
                                border: mouseHoverIndex ? "1px solid rgba(33, 33, 33, 1)" : "1px solid #f85a3e",
                            }}
                            // startIcon = {defaultSearch === "CASES" ? newSelectedApp.image_url : <LightbulbIcon/>}
                            onClick={(event) => {
                                onNodeSelect("CASES");
                                setDefaultSearch(discoveryData.label)
                            }}
                        >
                            {appFramework === undefined || appFramework.cases === undefined || appFramework.cases.large_image === undefined ||
                                appFramework === null || appFramework.cases === null || appFramework.cases.large_image === null || appFramework.cases.large_image.length === 0 ?
                                <LightbulbIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.cases.large_image} />}
                                <div >
                                    <Typography style={{display:"flex"}}>Case Management</Typography>
                                    <Typography style={{fontSize: 12, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }}>{newSelectedApp.name}</Typography>
                                </div>
                        </Button>
                    </div>
                    <div style={{ display: "flex", width: 464 }}>
                        <Button
                            // disabled={finishedApps.includes("SIEM")}
                            variant={
                                defaultSearch === "SIEM" ? "contained" : "outlined"
                            }
                            style={buttonStyle}

                            // startIcon={<SearchIcon />}
                            color="secondary"
                            onClick={(event) => {
                                onNodeSelect("SIEM");
                                setDefaultSearch(discoveryData.label)
                            }}
                        >
                            {appFramework === undefined || appFramework.siem === undefined || appFramework.siem.large_image === undefined ||
                                appFramework === null || appFramework.siem === null || appFramework.siem.large_image === null || appFramework.siem.large_image.length === 0 ?
                                <SearchIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.siem.large_image} />}
                            SIEM
                        </Button>
                        <Button
                            disabled={
                                finishedApps.includes("EDR & AV") ||
                                finishedApps.includes("ERADICATION")
                            }
                            variant={
                                defaultSearch === "Eradication" ? "contained" : "outlined"
                            }
                            style={buttonStyle}
                            // startIcon={<NewReleasesIcon />}
                            color="secondary"
                            onClick={(event) => {
                                onNodeSelect("ERADICATION");
                            }}
                        >
                            {appFramework === undefined || appFramework.eradication === undefined || appFramework.eradication.large_image === undefined ||
                                appFramework === null || appFramework.eradication === null || appFramework.eradication.large_image === null || appFramework.eradication.large_image.length === 0 ?
                                <NewReleasesIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.eradication.large_image} />}
                            Endpoint
                        </Button>
                    </div>
                    <div style={{ display: "flex", width: 464 }}>
                        <Button
                            disabled={finishedApps.includes("INTEL")}
                            variant={
                                defaultSearch === "INTEL" ? "contained" : "outlined"
                            }
                            style={buttonStyle}
                            // startIcon={<ExtensionIcon />}
                            color="secondary"
                            onClick={(event) => {
                                onNodeSelect("INTEL");
                            }}
                        >
                            {appFramework === undefined || appFramework.intel === undefined || appFramework.intel.large_image === undefined ||
                                appFramework === null || appFramework.intel === null || appFramework.intel.large_image === null || appFramework.intel.large_image.length === 0 ?
                                <ExtensionIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.intel.large_image} />}
                            Intel
                        </Button>
                        <Button
                            disabled={
                                finishedApps.includes("COMMS") ||
                                finishedApps.includes("EMAIL")
                            }
                            variant={
                                defaultSearch === "EMAIL" ? "contained" : "outlined"
                            }
                            style={buttonStyle}
                            // startIcon={<EmailIcon />}
                            color="secondary"
                            onClick={(event) => {
                                onNodeSelect("EMAIL");
                            }}
                        >
                            {appFramework === undefined || appFramework.email === undefined || appFramework.email.large_image === undefined ||
                                appFramework === null || appFramework.email === null || appFramework.email.large_image === null || appFramework.email.large_image.length === 0 ?
                                <EmailIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.email.large_image} />}
                            Email
                        </Button>
                    </div>
                    {moreButton ? (
                        <div style={{ display: "flex", width: 464 }}
                            onMouseOver={() => {
                                setMouseHoverIndex()
                            }} onMouseOut={() => {
                                setMouseHoverIndex(-1)
                            }}
                        >
                            <Button
                                disabled={finishedApps.includes("NETWORK")}
                                variant={
                                    defaultSearch === "NETWORK" ? "contained" : "outlined"
                                }
                                style={buttonStyle}
                                // startIcon={<ExtensionIcon />}
                                color="secondary"
                                onClick={(event) => {
                                    onNodeSelect("NETWORK");
                                }}
                            >
                                {appFramework === undefined || appFramework.network === undefined || appFramework.network.large_image === undefined ||
                                    appFramework === null || appFramework.network === null || appFramework.network.large_image === null || appFramework.network.large_image.length === 0 ?
                                    <ShowChartIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                    : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.network.large_image} />}
                                Network
                            </Button>
                            <Button
                                disabled={
                                    finishedApps.includes("ASSETS")
                                }
                                variant={
                                    defaultSearch === "ASSETS" ? "contained" : "outlined"
                                }
                                style={buttonStyle}
                                // startIcon={<EmailIcon />}
                                color="secondary"
                                onClick={(event) => {
                                    onNodeSelect("ASSETS");
                                }}
                            >
                                {appFramework === undefined || appFramework.assets === undefined || appFramework.assets.large_image === undefined ||
                                    appFramework === null || appFramework.assets === null || appFramework.assets.large_image === null || appFramework.assets.large_image.length === 0 ?
                                    <ExploreIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                    : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.assets.large_image} />}
                                Assets
                            </Button>
                            <Button
                                disabled={
                                    finishedApps.includes("IAM")
                                }
                                variant={
                                    defaultSearch === "IAM" ? "contained" : "outlined"
                                }
                                style={buttonStyle}
                                // startIcon={<EmailIcon />}
                                color="secondary"
                                onClick={(event) => {
                                    onNodeSelect("IAM");
                                }}
                            >
                                {appFramework === undefined || appFramework.iam === undefined || appFramework.iam.large_image === undefined ||
                                    appFramework === null || appFramework.iam === null || appFramework.iam.large_image === null || appFramework.iam.large_image.length === 0 ?
                                    <FingerprintIcon style={{ marginRight: 8, borderRadius: 40, }} />
                                    : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.iam.large_image} />}
                                IAM
                            </Button>
                        </div>
                    )
                        :
                        <div style={{ display: "flex", width: 464, paddingLeft: 140, paddingTop: 25 }}>
                            <Button
                                style={{ color: "#f86a3e", textTransform: 'capitalize', border: 2, backgroundColor: "var(--Background-color, #1A1A1A)" }}
                                className="btn btn-primary"
                                onClick={(event) => {
                                    setMoreButton(true);
                                }}
                            >
                                <Typography style={{ textDecorationLine: 'underline', }}>
                                    See more Categories
                                </Typography>
                            </Button>
                        </div>}

                    {/* <FormControl>
                                <FormLabel style={{ color: "#B9B9BA" }}>What do you want to automate first ?</FormLabel>
                                <FormGroup>
                                    <FormControlLabel
                                        value="Email"
                                        control={<Checkbox style={{ color: "#F85A3E" }} onChange={(event) => { onNodeSelect("Email") }} />}
                                        label="Email"
                                        labelPlacement="Email"
                                    />
                                    <FormControlLabel
                                        value="SIEM"
                                        control={<Checkbox style={{ color: "#F85A3E" }} onChange={(event) => { onNodeSelect("SIEM") }} />}
                                        label="SIEM"
                                        labelPlacement="SIEM"
                                    />
                                    <FormControlLabel
                                        value="EDR"
                                        control={<Checkbox style={{ color: "#F85A3E" }} onChange={(event) => { onNodeSelect("EDR") }} />}
                                        label="EDR"
                                        labelPlacement="EDR"
                                    />
                                </FormGroup>
                            </FormControl> */}
                </Grid>
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
