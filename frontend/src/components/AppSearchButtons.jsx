import React, { useState, useEffect, useRef } from "react";
import theme from '../theme.jsx';
import ReactGA from 'react-ga4';
import { useNavigate, Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import { Search as Searchicon, CloudQueue as CloudQueueicon, Code as Codeicon, Close as Closeicon, Folder as Foldericon, LibraryBooks as LibraryBooksicon, Delete as DeleteIcon, Close as CloseIcon, } from '@mui/icons-material';
import aa from 'search-insights'
import Deleteicon from '@mui/icons-material/Delete';
import ShowCharticon from '@mui/icons-material/ShowChart';
import Exploreicon from '@mui/icons-material/Explore';
import Lightbulbicon from "@mui/icons-material/Lightbulb";
import NewReleasesicon from "@mui/icons-material/NewReleases";
import Extensionicon from "@mui/icons-material/Extension";
import Emailicon from "@mui/icons-material/Email";
import Fingerprinticon from '@mui/icons-material/Fingerprint';
import AppSearch from "../components/Appsearch.jsx";
import { toast } from 'react-toastify';
import { findSpecificApp } from "../components/AppFramework.jsx";
import {
    Zoom,
    Grid,
    Paper,
    TextField,
    Collapse,
    iconButton,
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
    IconButton,
} from '@mui/material';

const AppSearchButtons = (props) => {
    const { userdata, globalUrl, appFramework, moreButton, finishedApps, appType, totalApps, index, onNodeSelect, setDiscoveryData, appName, AppImage, setDefaultSearch, discoveryData, checkLogin, setMissing, getAppFramework, } = props

    const ref = useRef()
    let navigate = useNavigate();

    const [isHover, setIsHover] = useState(false);
    const [localSearchOpen, setLocalSearchOpen] = useState(false)
    const [newSelectedApp, setNewSelectedApp] = useState(undefined)

    useEffect(() => {
		console.log("UPDATED APP: ", newSelectedApp)

        if (newSelectedApp !== undefined && setMissing != undefined) {
            const submitAppFramework = {
                "description": newSelectedApp.description,
                "id": newSelectedApp.objectID,
                "name": newSelectedApp.name,
                "type": appType,
                "large_image": newSelectedApp.image_url,
            }

            setFrameworkItem(submitAppFramework)
            setMissing(newSelectedApp)

			if (getAppFramework !== undefined) {
				setTimeout(() => {
					getAppFramework()
				}, 1000)
			}
        }
    }, [newSelectedApp])

    if (appType === undefined) {
        //console.log("Apptype is required in AppSearchButtons")
        return null;
    }

    const buttonWidth = 450;
    const buttonMargin = 10;

    const handleMouseEnter = () => {
        setIsHover(true);
    };

    const handleMouseLeave = () => {
        setIsHover(false);
    };


    const foundApp = findSpecificApp(appFramework, appType)
    if (foundApp === undefined || foundApp === null) {
        console.log("AppSearchButtons: App not found in appFramework: " + appType)
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
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for framework!");
                }

                if (checkLogin !== undefined) {
                    checkLogin()
                }

                return response;
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

    const icon = foundApp.large_image
	var foundAppImage = AppImage
	if (foundApp.name !== undefined && foundApp.name !== null && foundApp.name.length > 0 && !foundApp.name.includes(":default")) {

		if (AppImage === undefined || AppImage === null || AppImage.length < 10) {
			foundAppImage = foundApp.large_image
		}
	} else {
		const newapp = findSpecificApp(appFramework, appType) 
    	// const { userdata, globalUrl, appFramework, moreButton, finishedApps, appType, totalApps, index, onNodeSelect, setDiscoveryData, appName, AppImage, setDefaultSearch, discoveryData, checkLogin, setMissing, getAppFramework, } = props
	}

    let xsValue = 12;
    if (index === totalApps - 1 || index === totalApps - 2 || index === totalApps - 3 || index === totalApps - 4) {
        xsValue = 6;
    } 
    if (index === totalApps - 5) {
        xsValue = 12;
    }

	// This is silly huh
    if (moreButton) {
        switch (index) {
          case totalApps - 1:
          case totalApps - 2:
          case totalApps - 3:
            xsValue = 4;
            break;
          case totalApps - 4:
          case totalApps - 5:
          case totalApps - 6:
          case totalApps - 7:
            xsValue = 6;
            break;
          case totalApps - 8:
            xsValue = 12;
            break;
          default:
        }
      }
      

    return (
        <Grid item xs={xsValue} style={{ alignItems: "center", marginTop: 5, }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {localSearchOpen ? (
                <div
                    style={{
                        width: 319,
                        height: 395,
                        flexShrink: 0,
                        marginLeft: isMobile? null:70,
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
										right: 0, 
										top: 10, 
										height: 10, 

                                        // width: 224,
                                        //marginLeft: discoveryData === ("communication") ? 112 : 200,
                                        //width: "100%",
                                        marginBottom: 23,
                                        fontSize: 16,
                                        background: "rgba(33, 33, 33, 1)",
                                        borderColor: "rgba(33, 33, 33, 1)",
                                        borderRadius: 8,
                                    }}
                                    onClick={() => {
                                        setLocalSearchOpen(false)
                                    }}
                                >
                                    <Closeicon style={{ width: 16 }} />
                                </IconButton>
                            </Tooltip>
							{/*
                            <Tooltip
                                title="Delete app"
                                placement="bottom"
                                style={{ zIndex: 10011 }}
                            >
                                <IconButton
                                    style={{ zIndex: 12501, position: "absolute", top: 32, right: 16 }}
									disabled
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setLocalSearchOpen(false)

                                        const submitDeletedApp = {
                                            "description": "",
                                            "id": "remove",
                                            "name": "",
                                            "type": discoveryData
                                        }
                                        setFrameworkItem(submitDeletedApp)
                                        setNewSelectedApp({})

										if (setDefaultSearch !== undefined) {
                                        	setDefaultSearch("")
										}

                                        setTimeout(() => {
											if (setDiscoveryData !== undefined) {
                                            	setDiscoveryData({})
											}

                                            setFrameworkItem(submitDeletedApp)
                                            //setNewSelectedApp({})
                                        }, 1000)
                                        //setAppName(discoveryData.cases.name)
                                    }}
                                >
                                    <DeleteIcon style={{ height: 15, width: 15, }} />
                                </IconButton>
                            </Tooltip>
							*/}
                        </div>
                    </div>
                    <div
                        style={{ width: "100%", border: "1px #494949 solid" }}
                    />
                    <AppSearch
                        defaultSearch={appType}
                        userdata={userdata}
                        newSelectedApp={newSelectedApp}
                        setNewSelectedApp={setNewSelectedApp}
                    />
                </div>
            ) : null}
            <div style={{
                display: "flex", height: 70, border: isHover ? "1px solid #f85a3e" : "var(--Container, #212121)", borderRadius: 8, background: isHover ? "var(--Container, #212121)" : "var(--Container, #212121)",
                alignItems: "center", justifyContent: "center",
            }}
            >
                <Button
                    fullWidth
                    color="secondary"
                    style={{
                        height: "100%",
                        width: "100%",
                        display: "grid"
                    }}
                    onClick={(event) => {
                        if (onNodeSelect !== undefined) {
                            onNodeSelect(appType);
                        } else {
                            setLocalSearchOpen(true)
                        }

                        if (setDefaultSearch !== undefined) {
                            setDefaultSearch(appType)
                        }
                    }}
                >
                    <div style={{ display: "flex", textAlign: "center", justifyContent: "center", alignItems: "center", marginRight: "auto" }}>
                        {foundAppImage === undefined || foundAppImage === null || foundAppImage.length === 0 ?
                            <div style={{ width: 40, height: 40, borderRadius: 40, backgroundColor: "#2F2F2F", textAlign: "center" }}>
                                <img style={{ paddingLeft: 11, paddingTop: 11, width: 40, height: 40, flexShrink: 0, }} src={icon} />
                            </div>
                            :
                            <img style={{ marginRight: 8, width: 35, height: 35, flexShrink: 0, borderRadius: 40, }} src={foundAppImage} />
                        }
                        <div style={{ marginLeft: 8, }}>
                            <Typography style={{
                                display: "flex",
                                border: "none",
                                fontSize: 16,
                                textTransform: ["siem", "edr", "iam"].includes(appType.toLowerCase()) ? "uppercase" : 'capitalize'
                            }} >
                                {appType}
                            </Typography>
                            {appName === undefined || appName === undefined ||
                                appName === null || appName === null || appName.length === 0 ?
                                ""
                                :
                                <Typography style={{ fontSize: 12, textAlign: "left", color: "var(--label-grey-text, #9E9E9E)", textTransform: "lowercase" }} >{appName.split('_').join(' ')}</Typography>}
                        </div>

                    </div>
                </Button>
            </div>
        </Grid>
    )
}
export default AppSearchButtons
