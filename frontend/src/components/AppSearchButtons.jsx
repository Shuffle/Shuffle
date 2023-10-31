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

const AppSearchButtons = (props) => {
    const { userdata, globalUrl, appFramework, defaultSearch, finishedApps, onNodeSelect, setDiscoveryData, appName, AppImage, setDefaultSearch, discoveryData } = props
    const ref = useRef()
    const [moreButton, setMoreButton] = useState(false);
    let navigate = useNavigate();

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

    const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";

    const mouseOver = (e) => {
        e.target.style.border = "1px solid #f85a3e";
    }
    const mouseOut = (e) => {
        e.target.style.border = "1px solid rgb(33, 33, 33)";
    }

    return (
        <Grid item xs={11} style={{ display: "flex" }}>

            {/*<FormLabel style={{ color: "#B9B9BA" }}>Find your integrations!</FormLabel>*/}
            {/* <div style={{ display: "flex", width: 510, height:100 }}>
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
                                border: "1px solid rgba(33, 33, 33, 1)" ,
                            }}
                            onMouseOver={mouseOver} 
                            onMouseOut={mouseOut}
                            // startIcon = {defaultSearch === "CASES" ? newSelectedApp.image_url : <LightbulbIcon/>}
                            onClick={(event) => {
                                onNodeSelect("CASES");
                                setDefaultSearch(discoveryData.label)
                            }}
                        >
                            {appFramework === undefined || appFramework.cases === undefined || appFramework.cases.large_image === undefined ||
                                appFramework === null || appFramework.cases === null || appFramework.cases.large_image === null || appFramework.cases.large_image.length === 0 ?
                                <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                <LightbulbIcon style={{ marginTop: 6 }} />
                                </div>
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={AppImage} />}
                                <div style={{marginLeft: 8, }}>
                                    <Typography style={{display:"flex",border:"none"}} >Case Management</Typography>
                                    {appFramework === undefined || appFramework.cases === undefined || appFramework.cases.name === undefined ||
                                    appFramework === null || appFramework.cases === null || appFramework.cases.name === null || appFramework.cases.name.length === 0 ?
                                    "":<Typography style={{fontSize: 12, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{AppName}</Typography>}
                                </div>
                        </Button>
                    </div>
                    <div style={{ display: "flex", width: 510, height: 100 }}>
                        <Button
                            disabled={finishedApps.includes("SIEM")}
                            variant={
                                defaultSearch === "SIEM" ? "contained" : "outlined"
                            }
                            style={buttonStyle}
                            // startIcon={<SearchIcon />}
                            onMouseOver={mouseOver} 
                            onMouseOut={mouseOut}
                            color="secondary"
                            onClick={(event) => {
                                onNodeSelect("SIEM");
                                setDefaultSearch(discoveryData.label)
                            }}
                        >
                            {appFramework === undefined || appFramework.siem === undefined || appFramework.siem.large_image === undefined ||
                                appFramework === null || appFramework.siem === null || appFramework.siem.large_image === null || appFramework.siem.large_image.length === 0 ?
                                <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                <SearchIcon style={{ marginTop: 6 }} />
                                </div>
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.siem.large_image} />}
                            <div style={{marginLeft: 8,}}>
                            <Typography style={{display:"flex",}}>SIEM</Typography>
                            {appFramework === undefined || appFramework.siem === undefined || appFramework.siem.name === undefined ||
                                appFramework === null || appFramework.siem === null || appFramework.siem.name === null || appFramework.siem.name.length === 0 ?
                                    "":<Typography style={{fontSize: 12, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{appFramework.siem.name.split('_').join(' ')}</Typography>}
                            </div>
                        </Button>
                        <Button
                            disabled={
                                finishedApps.includes("EDR & AV") ||
                                finishedApps.includes("ERADICATION")
                            }
                            onMouseOver={mouseOver} 
                            onMouseOut={mouseOut}
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
                            {appFramework === undefined || appFramework.edr === undefined || appFramework.edr.large_image === undefined ||
                                appFramework === null || appFramework.edr === null || appFramework.edr.large_image === null || appFramework.edr.large_image.length === 0 ?
                                <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                <NewReleasesIcon style={{marginTop: 8 }} />
                                </div>
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.edr.large_image} />}
                            <div style={{marginLeft: 8,}}>
                            <Typography style={{display:"flex",}}>Endpoint</Typography>
                            {appFramework === undefined || appFramework.edr === undefined || appFramework.edr.name === undefined ||
                                appFramework === null || appFramework.edr === null || appFramework.edr.name === null || appFramework.edr.name.length === 0 ?
                                    "":<Typography style={{fontSize: 12, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{appFramework.edr.name.split('_').join(' ')}</Typography>}
                            </div>
                        </Button>
                    </div>
                    <div style={{ display: "flex", width: 510, height: 100 }}>
                        <Button
                            disabled={finishedApps.includes("INTEL")}
                            variant={
                                defaultSearch === "INTEL" ? "contained" : "outlined"
                            }
                            onMouseOver={mouseOver} 
                            onMouseOut={mouseOut}
                            style={buttonStyle}
                            // startIcon={<ExtensionIcon />}
                            color="secondary"
                            onClick={(event) => {
                                onNodeSelect("INTEL");
                            }}
                        >
                            {appFramework === undefined || appFramework.intel === undefined || appFramework.intel.large_image === undefined ||
                                appFramework === null || appFramework.intel === null || appFramework.intel.large_image === null || appFramework.intel.large_image.length === 0 ?
                                <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                <ExtensionIcon style={{ marginTop: 8 }} />
                                </div>
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.intel.large_image} />}
                            <div style={{marginLeft: 8,}}>
                            <Typography style={{display:"flex",}}>Intel</Typography>
                            {appFramework === undefined || appFramework.intel === undefined || appFramework.intel.name === undefined ||
                                appFramework === null || appFramework.intel === null || appFramework.intel.name === null || appFramework.intel.name.length === 0 ?
                                    "":<Typography style={{fontSize: 12, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{appFramework.intel.name.split('_').join(' ')}</Typography>}
                            </div>
                        </Button>
                        <Button
                            disabled={
                                finishedApps.includes("COMMS") ||
                                finishedApps.includes("EMAIL")
                            }
                            variant={
                                defaultSearch === "EMAIL" ? "contained" : "outlined"
                            }
                            onMouseOver={mouseOver} 
                            onMouseOut={mouseOut}
                            style={buttonStyle}
                            // startIcon={<EmailIcon />}
                            color="secondary"
                            onClick={(event) => {
                                onNodeSelect("EMAIL");
                            }}
                        >
                            {appFramework === undefined || appFramework.communication === undefined || appFramework.communication.large_image === undefined ||
                                appFramework === null || appFramework.communication === null || appFramework.communication.large_image === null || appFramework.communication.large_image.length === 0 ?
                                <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                <EmailIcon style={{ marginTop: 8 }} />
                                </div>
                                : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.communication.large_image} />}
                            <div style={{marginLeft: 8,}}>
                            <Typography style={{display:"flex",}}>Email</Typography>
                            {appFramework === undefined || appFramework.communication === undefined || appFramework.communication.name === undefined ||
                                appFramework === null || appFramework.communication === null || appFramework.communication.name === null || appFramework.communication.name.length === 0 ?
                                    "":<Typography style={{fontSize: 12, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{appFramework.communication.name.split('_').join(' ')}</Typography>}
                            </div>
                        </Button>
                    </div>
                    {moreButton ? (
                        <div style={{ display: "flex", width: 510, height: 100, marginBottom: 20 }}>
                            <Button
                                disabled={finishedApps.includes("NETWORK")}
                                variant={
                                    defaultSearch === "NETWORK" ? "contained" : "outlined"
                                }
                                onMouseOver={mouseOver}
                                onMouseOut={mouseOut}
                                style={buttonStyle}
                                // startIcon={<ExtensionIcon />}
                                color="secondary"
                                onClick={(event) => {
                                    onNodeSelect("NETWORK");
                                }}
                            >
                                {appFramework === undefined || appFramework.network === undefined || appFramework.network.large_image === undefined ||
                                    appFramework === null || appFramework.network === null || appFramework.network.large_image === null || appFramework.network.large_image.length === 0 ?
                                    <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                    <ShowChartIcon style={{ marginTop: 8 }} />
                                    </div>
                                    : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.network.large_image} />}
                                <div style={{marginLeft: 8,}}>
                            <Typography style={{display:"flex",}}>Network</Typography>
                            {appFramework === undefined || appFramework.network === undefined || appFramework.network.name === undefined ||
                                appFramework === null || appFramework.network === null || appFramework.network.name === null || appFramework.network.name.length === 0 ?
                                    "":<Typography style={{fontSize: 10, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{appFramework.network.name}</Typography>}
                            </div>
                            </Button>
                            <Button
                                disabled={
                                    finishedApps.includes("ASSETS")
                                }
                                variant={
                                    defaultSearch === "ASSETS" ? "contained" : "outlined"
                                }
                                onMouseOver={mouseOver}
                                onMouseOut={mouseOut}
                                style={buttonStyle}
                                // startIcon={<EmailIcon />}
                                color="secondary"
                                onClick={(event) => {
                                    onNodeSelect("ASSETS");
                                }}
                            >
                                {appFramework === undefined || appFramework.assets === undefined || appFramework.assets.large_image === undefined ||
                                    appFramework === null || appFramework.assets === null || appFramework.assets.large_image === null || appFramework.assets.large_image.length === 0 ?
                                    <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                    <ExploreIcon style={{ marginTop: 8 }} />
                                    </div>
                                    : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.assets.large_image} />}
                                <div style={{marginLeft: 8,}}>
                            <Typography style={{display:"flex",}}>Assets</Typography>
                            {appFramework === undefined || appFramework.assets === undefined || appFramework.assets.name === undefined ||
                                appFramework === null || appFramework.assets === null || appFramework.assets.name === null || appFramework.assets.name.length === 0 ?
                                    "":<Typography style={{fontSize: 10, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{appFramework.assets.name}</Typography>}
                            </div>
                            </Button>
                            <Button
                                disabled={
                                    finishedApps.includes("IAM")
                                }
                                variant={
                                    defaultSearch === "IAM" ? "contained" : "outlined"
                                }
                                onMouseOver={mouseOver}
                                onMouseOut={mouseOut}
                                style={buttonStyle}
                                // startIcon={<EmailIcon />}
                                color="secondary"
                                onClick={(event) => {
                                    onNodeSelect("IAM");
                                }}
                            >
                                {appFramework === undefined || appFramework.iam === undefined || appFramework.iam.large_image === undefined ||
                                    appFramework === null || appFramework.iam === null || appFramework.iam.large_image === null || appFramework.iam.large_image.length === 0 ?
                                    <div style={{width: 40, border: "1px solid rgba(33, 33, 33, 1) !importent", height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign:"center"}}>
                                    <FingerprintIcon style={{ marginTop: 8 }} />
                                    </div>
                                    : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={appFramework.iam.large_image} />}
                                <div style={{marginLeft: 8,}}>
                            <Typography style={{display:"flex",}}>IAM</Typography>
                            {appFramework === undefined || appFramework.iam === undefined || appFramework.iam.name === undefined ||
                                appFramework === null || appFramework.iam === null || appFramework.iam.name === null || appFramework.iam.name.length === 0 ?
                                    "":<Typography style={{fontSize: 8, textAlign:"left", color:"var(--label-grey-text, #9E9E9E)" }} >{appFramework.iam.name}</Typography>}
                            </div>
                            </Button>
                        </div>
                    )
                        :
                        <div style={{ display: "flex", width: 510, paddingLeft: 165,  }}>
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
                        </div>} */}
            <div style={{ display: "flex", width: 510, height: 64, borderRadius: 8, background: "var(--Container, #212121)" }}
            >
                <div
                    onMouseOver={mouseOver}
                    onMouseOut={mouseOut}
                    disabled={finishedApps.includes("CASES")}
                    variant={
                        defaultSearch === "CASES" ? "contained" : "outlined"
                    }
                    color="secondary"
                    style={{
                        flex: 1,
                        width: "100%",
                        margin: buttonMargin,
                        fontSize: 18,
                        color: "var(--White-text, #F1F1F1)",
                        fontWeight: 400,
                        background: "rgba(33, 33, 33, 1)",
                        borderRadius: 8,
                        textTransform: 'capitalize',
                    }}
                    // startIcon = {defaultSearch === "CASES" ? newSelectedApp.image_url : <LightbulbIcon/>}
                    onClick={(event) => {
                        onNodeSelect("CASES");
                        setDefaultSearch(discoveryData.label)
                    }}
                >
                    <div style={{marginLeft: 20, display:"flex", textAlign:"center", alignItems:"center", marginLeft: 100, width: 320, marginRight: "auto" }}>
                    {AppImage === undefined || AppImage === undefined || 
                                AppImage === null || AppImage === null || AppImage.length === 0 ?
                            <div style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign: "center" }}>
                                <LightbulbIcon style={{ marginTop: 6 }} />
                            </div>
                            : <img style={{ marginRight: 8, width: 40, height: 40, flexShrink: 0, borderRadius: 40, }} src={AppImage} />}
                        <div style={{ marginLeft: 8, }}>
                            <Typography style={{ display: "flex", border: "none" }} >Case Management</Typography>
                            {appName === undefined || appName === undefined || 
                                appName === null || appName === null || appName.length === 0 ?
                                ""
                                :
                                <Typography style={{ fontSize: 12, textAlign: "left", color: "var(--label-grey-text, #9E9E9E)" }} >{appName}</Typography>}
                        </div>

                    </div>
                </div>
            </div>
        </Grid>
    )
}
export default AppSearchButtons
