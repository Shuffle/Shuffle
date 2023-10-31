import React, { useState, useEffect, useRef } from "react";
import theme from '../theme.jsx';
import ReactGA from 'react-ga4';
import { useNavigate, Link } from 'react-router-dom';

import { Search as Searchicon, CloudQueue as CloudQueueicon, Code as Codeicon, Close as Closeicon, Folder as Foldericon, LibraryBooks as LibraryBooksicon } from '@mui/icons-material';
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
} from '@mui/material';

const AppSearchButtons = (props) => {
    const { userdata, globalUrl, appFramework, finishedApps, appType, totalApps, index, onNodeSelect, setDiscoveryData, appName, AppImage, setDefaultSearch, discoveryData } = props

    const ref = useRef()
    let navigate = useNavigate();

    const [isHover, setIsHover] = useState(false);
    const [localSearchOpen, setLocalSearchOpen] = useState(false)

	if (appType === undefined) {
		console.log("Apptype is required in AppSearchButtons")
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
		console.log("AppSearchButtons: App not found in appFramework")
		return null
	}

	const icon = foundApp.large_image
    let xsValue = 12;
    if (index !== undefined && index !== 0) {
        xsValue = 6;
    }

    if (index === totalApps - 4 && totalApps % 2 === 1) {
        xsValue = 12;
    }

    if (index === totalApps - 1 || index === totalApps - 2 || index === totalApps - 3) {
        xsValue = 4;
    }

    return (
        <Grid item xs={xsValue} style={{ alignItems: "center", marginTop: 5, }} 
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
        >
            <div style={{ display: "flex", height: 70, border: isHover ? "1px solid #f85a3e" : "var(--Container, #212121)", borderRadius: 8, background: isHover ? "var(--Container, #212121)":"var(--Container, #212121)",  
                        alignItems: "center", justifyContent: "center",}}
            >
                <Button
                fullWidth
                    color="secondary"
                    style={{
                        height:"100%",
                        width:"100%",
                        display:"grid"
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
                    <div style={{ display:"flex", textAlign:"center", justifyContent: "center", alignItems:"center",  marginRight: "auto" }}>
                    {AppImage === undefined ||  AppImage === null || AppImage.length === 0 ?
                            <div style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: "#2F2F2F", textAlign: "center" }}>
								<img style={{paddingLeft: 11, paddingTop: 11, width: 40, height: 40, flexShrink: 0, }} src={icon} />
                            </div>
                            : 
							<img style={{ marginRight: 8, width: 35, height: 35, flexShrink: 0, borderRadius: 40, }} src={AppImage} />
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
