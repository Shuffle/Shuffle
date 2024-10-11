import React, { useState, useEffect, useRef } from "react";
import theme from '../theme.jsx';
import ReactGA from 'react-ga4';
import { useNavigate, Link, } from 'react-router-dom';
import { isMobile } from "react-device-detect";
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppSearch from "../components/Appsearch.jsx";
import AppSearchButtons from "../components/AppSearchButtons.jsx";
import { toast } from 'react-toastify';
import {
    Zoom,
    Grid,
    Paper,
    TextField,
    Collapse,
    Fade,
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
		setAppFramework, 
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
    const [lastPosted, setLastPosted] = useState([])
    const [apps, setApps] = useState([])
    const [appName, setAppName] = React.useState();
    const [moreButton, setMoreButton] = useState(false);

    // const [mouseHoverIndex, setMouseHoverIndex] = useState(-1)
  	document.title = "Choose your apps"
    const ref = useRef()
    let navigate = useNavigate();
    const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");

    useEffect(() => {
        if (newSelectedApp === undefined || newSelectedApp.objectID === undefined || newSelectedApp.objectID === undefined || newSelectedApp.objectID.length === 0) {
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

        setFrameworkItem(submitNewApp)
        setSelectionOpen(false)

		if (setAppFramework !== undefined) {
			setAppFramework(appFramework)
		}
		GetApps()
    }, [newSelectedApp]);

	const reloadAppButtons = (framework) => {
		var tempApps = []
		const lastApps = {}
		let endTypes = ["network", "assets", "iam"]

		if (framework === undefined || framework === null || Object.keys(framework).length === 0) {
			//window.location.href = "/welcome"
			return
		}

		Object.entries(framework).forEach(([key, value]) => {
			// Overwrrite email properly
			if (key.toLowerCase() === "communication") {
				value["type"] = "email"
				framework["email"] = value
				return
			}

			if (key.toLowerCase() === "other") {
				return
			}

			value.type = key;
			if (endTypes.includes(value.type.toLowerCase())) {
				lastApps[value.type] = value
				return
			}

			if (lastPosted.type === value.type) {
				value = lastPosted
			}

			tempApps.push(JSON.parse(JSON.stringify(value)));
		});

		tempApps.sort((a, b) => {
			if (a.type.length > b.type.length) {
				return -1;
			} else if (a.type.length < b.type.length) {
				return 1;
			}
		});

		let lastType = lastPosted.type === undefined ? "" : lastPosted.type.toLowerCase()
		if (endTypes.includes(lastType)) {
			lastApps[lastPosted.type] = lastPosted
		}

		if (moreButton) {
			tempApps.push(JSON.parse(JSON.stringify(lastApps["network"])))
			tempApps.push(JSON.parse(JSON.stringify(lastApps["assets"])))
			tempApps.push(JSON.parse(JSON.stringify(lastApps["iam"])))
		}

		setAppButtons(tempApps)
	}

    useEffect(() => {
		reloadAppButtons(appFramework)	
    }, [lastPosted, moreButton])

    if (appFramework === undefined || appFramework === null || Object.keys(appFramework).length === 0) {
        //window.location.href = "/welcome"
        return null
    }

    const setFrameworkItem = (data) => {
        fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
        })
            .then(async (response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for framework!");
                }

                if (checkLogin !== undefined) {
                    checkLogin()
                }

                let resp = response.json();
                let respAwaited = await resp;

                if (respAwaited.success === true) {
                    setLastPosted(data)
                }
                return resp;
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
		.then((response) => {
			return response.json()
		})
		.then((responseJson) => {
			if (responseJson === null || responseJson === undefined) {
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

			if (setAppFramework !== undefined) {
				setAppFramework(responseJson)
			}

			setApps(responseJson)
			reloadAppButtons(responseJson)
		})
		.catch((error) => {
			console.log("App loading error: " + error.toString());
		})
    }

    const onNodeSelect = (label) => {
        if (isCloud) {
            ReactGA.event({
                category: "welcome",
                action: `click_${label}`,
                label: "",
            });
        }

        setDiscoveryData(label)
        setSelectionOpen(true)
        setDefaultSearch(label.charAt(0).toUpperCase() + (label.substring(1)).toLowerCase())

        setNewSelectedApp(undefined)
    };



    // const sizing = moreButton ? 510 : 480;
    const buttonWidth = 450;
    const buttonMargin = 10;
    const bottomButtonStyle = {
        borderRadius: 200,
        marginTop: moreButton ? 44 : "",
        height: 51,
        width: isMobile ? 250 : 500,
        fontSize: 16,
        background: "linear-gradient(90deg, #F86744 0%, #F34475 100%)",
        padding: "16px 24px",
        textTransform: 'capitalize',
        itemAlign: "center",
    };

    return (
        <Fade in={true} timeout={1250}>
			<div>
				{/*
            	<Tooltip
            	    title="Back"
            	    placement="top"
            	    style={{ zIndex: 10011 }}
            	>
            	    <IconButton
            	        style={{
            	        }}
            	        onClick={() => {
            	            navigate('/welcome');
            	            window.location.reload();
            	        }}
            	    >
            	        <ArrowBackIcon style={{ width: 20 }} />
            	        <Typography style={{fontSize : 16, marginLeft : 2}}>Back</Typography>
            	    </IconButton>
            	</Tooltip>
				*/}
            	<div
            	    style={{
            	        // minHeight: sizing,
            	        // maxHeight: sizing,
            	        marginTop: 10,
            	        width: isMobile ? 350 : 500,
            	        marginBottom: 25,
            	        textAlign: isMobile ? "center" : null,
            	    }}
            	>
            	    {selectionOpen ? (
            	        <div
            	            style={{
            	                width: isMobile ? 225 : 319,
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

												position: "absolute",
												top: 0,
												right: 6,
            	                            }}
            	                            onClick={() => {
            	                                setSelectionOpen(false)
            	                            }}
            	                        >
            	                            <CloseIcon style={{ width: 16 }} />
            	                        </IconButton>
            	                    </Tooltip>
            	                    <Tooltip
            	                        title="Remove selection"
            	                        placement="bottom"
            	                        style={{ zIndex: 10011 }}
            	                    >
            	                        <IconButton
            	                            style={{ zIndex: 12501, position: "absolute", top: 26, right: 6, }}
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
            	                                }, 200)
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
            	            marginTop: isMobile ? null : 40,
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
            	    <Grid rowSpacing={1} columnSpacing={2} container >
            	        {appButtons.map((appData, index) => {
            	            // This is here due to a memory issue with setting apps properly
            	            if (appData.id === "remove") {
            	                appData = {
            	                    "count": 0,
            	                    "description": "",
            	                    "id": "",
            	                    "large_image": "",
            	                    "name": "",
            	                    "type": appData.type,
            	                }
            	            }


							if (appData === undefined || appData === null || appData.name === undefined || appData.name === "") {
								appData = {
									"count": 0,
									"description": "",
									"id": "",
									"large_image": "",
									"name": "",
									"type": appData.type,
								}
							}

							//console.log("APP: ", appData)

            	            const appName = appData.name
            	            const AppImage = appData.large_image
            	            const appType = appData.type

            	            return (
            	                <AppSearchButtons
            	                    appFramework={appFramework}
            	                    index={index}
            	                    totalApps={appButtons.length}

            	                    appName={appName}
            	                    appType={appType}
            	                    AppImage={AppImage}

            	                    defaultSearch={defaultSearch}
            	                    finishedApps={finishedApps}
            	                    onNodeSelect={onNodeSelect}
            	                    discoveryData={discoveryData}
            	                    setDiscoveryData={setDiscoveryData}
            	                    setDefaultSearch={setDefaultSearch}
            	                    apps={apps}
            	                    setMoreButton={setMoreButton}
            	                    moreButton={moreButton}
            	                />
            	            )
            	        })}
            	    </Grid>
            	</div>
            	{!moreButton ? (
            	    <div style={{ width: "100%", marginLeft: isMobile ? 80 : 200, marginBottom: 20, textAlign: isMobile ? "center" : null }}>
            	        <Link style={{ color: "#FF8444" }} onClick={() => {
            	            setMoreButton(true)

            	            setTimeout(() => {
            	                navigate("/welcome?tab=2")
            	            }, 250)
            	        }}
            	        >See More Apps</Link>
            	    </div>) : ""}

            	<div style={{ flexDirection: "row", width: isMobile ? 340 : null, textAlign: isMobile ? "center" : null }}>
            	    <Button variant="contained" type="submit" fullWidth style={bottomButtonStyle} onClick={() => {
            	        navigate("/usecases2")
            	        setActiveStep(2)
            	    }}>
						See usecases
            	    </Button>
            	</div>
			</div>
        </Fade>
    )
}

export default AppSelection;
