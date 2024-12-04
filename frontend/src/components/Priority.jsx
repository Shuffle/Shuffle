import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';

import ReactGA from 'react-ga4';
import theme from "../theme.jsx";
import { useNavigate, Link } from "react-router-dom";
import { findSpecificApp } from "../components/AppFramework.jsx"
import {
	Paper,
  Typography,
	Divider,
	Button,
	Grid,
	Card,
} from "@mui/material";

// import magic wand icon from material ui icons 
import {
	AutoFixHigh as AutoFixHighIcon, 
	ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
//import { useAlert 

const Priority = (props) => {
  	const { globalUrl, clickedFromOrgTab,userdata, serverside, priority, checkLogin, setAdminTab, setCurTab, appFramework, } = props;

  	const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
	let navigate = useNavigate();

	if (window.location.pathname === "/workflows") {
		const hidePriorities = localStorage.getItem("hidePriorities", "true")
		if (hidePriorities === "true") {
			return null
		}
	}

	var realignedSrc = false
	var realignedDst = false
	let newdescription = priority.description
	const descsplit = priority.description.split("&")
	if (appFramework !== undefined && descsplit.length === 5 && priority.description.includes(":default")) {
		if (descsplit[1] === "") {
			const item = findSpecificApp(appFramework, descsplit[0])

			if (item !== null) {
				descsplit[1] = item.large_image

				console.log("DESCSPLIT name: ", descsplit[0])

				if (descsplit[0].includes(":default")) {
					realignedSrc = true 
				}

				descsplit[0] = descsplit[0].split(":")[0]
			}
		}

		if (descsplit[3] === "") {
			const item = findSpecificApp(appFramework, descsplit[2])
			//console.log("item: ", item)
			realignedDst = true 
			if (item !== null) {
				descsplit[3] = item.large_image

				if (descsplit[2].includes(":default")) {
					realignedDst = true 
				}

				descsplit[2] = descsplit[2].split(":")[0]
			}

		}

		newdescription = descsplit.join("&")
	}

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
				if (checkLogin !== undefined) {
					checkLogin()
				}
    	    } else {
    	    	if (responseJson.success === false && responseJson.reason !== undefined) {
    	      		toast("Failed change recommendation: ", responseJson.reason)
    	    	} else {
    	      		toast("Failed change recommendation");
				}
    	    }
    	  })
    	  .catch((error) => {
    	    toast("Failed dismissing alert. Please contact support@shuffler.io if this persists.");
    	  });
	}


	const srcSize = realignedSrc ? 35 : 30 
	const dstSize = realignedDst ? 35 : 30
	return (
		<div style={{border: priority.active === false ? "1px solid #000000" :  priority.severity === 1 ? "1px solid #f85a3e" :  clickedFromOrgTab ?null:"1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette?.borderRadius, marginTop: 10, marginBottom: 10, padding:  clickedFromOrgTab ? 24:15, textAlign: "center", minHeight: isCloud ? 70 : 100, maxHeight: isCloud ? 70 : 100, textAlign: "left", backgroundColor: clickedFromOrgTab ?  "#1A1A1A": theme.palette.surfaceColor, display: "flex", }}>
			<div style={{flex: 2, overflow: "hidden",}}>
				<span style={{display: "flex", }}>
					{priority.type === "usecase" || priority.type == "apps" ? <AutoFixHighIcon style={{height: 19, width: 19, marginLeft: 3, marginRight: 10, }}/> : null} 
					<Typography variant="body1" >
						{priority.name}
					</Typography>
				</span>
				{priority.type === "usecase" && priority.description.includes("&") ?
					<span style={{display: "flex", marginTop: 10,  }}>
						<img src={newdescription.split("&")[1]} alt={priority.name} style={{height: srcSize, width: srcSize, marginRight: realignedSrc ? isCloud ? 0 : -10 : 10, borderRadius: theme.palette?.borderRadius-3, marginTop: realignedSrc ?  5 : 0 }} />
						<Typography variant="body2" color="textSecondary" style={{marginTop: 3, }}>
							{newdescription.split("&")[0]} 
						</Typography>

						{newdescription.split("&").length > 3 ?
							<span style={{display: "flex", }}>
								<ArrowForwardIcon style={{marginLeft: 15, marginRight: 15, }}/>
								<img src={newdescription.split("&")[3]} alt={priority.name+"2"} style={{height: dstSize, width: dstSize, marginRight: realignedDst ? -5 : 10,	borderRadius: theme.palette?.borderRadius-3, marginTop: realignedDst ? 5 : 0 }} />
								<Typography variant="body2" color="textSecondary" style={{marginTop: 3}}>
									{newdescription.split("&")[2]} 
								</Typography>
							</span>
						: null}
							
					</span>
				:
					<Typography variant="body2" color="textSecondary">
						{priority.description}
					</Typography>
				}
			</div>
			<div style={{flex: 1, display: "flex", marginLeft: 30, }}>
				<Button style={{height: 50, borderRadius: 25, fontSize:16, boxShadow: clickedFromOrgTab ? "none":null,textTransform: clickedFromOrgTab ? 'capitalize':null, marginTop: 8, width: 175, marginRight: 10, color: priority.active === false ? "white" :clickedFromOrgTab ?"#FF8444": "black", backgroundColor: priority.active === false ? theme.palette.inputColor :clickedFromOrgTab?"rgba(255, 132, 68, 0.2)":"rgba(255,255,255,0.8)", }} variant="contained" color="secondary" onClick={() => {

					if (isCloud) {
						ReactGA.event({
							category: "recommendation",
							action: `click_${priority.name}`,
							label: "",
						})
					}

					navigate(priority.url)

					if (setAdminTab !== undefined && setCurTab !== undefined) {
						if (priority.description.toLowerCase().includes("notification workflow")) {
							setCurTab(0)
							setAdminTab(0)
						}

						if (priority.description.toLowerCase().includes("hybrid shuffle")) {
							setCurTab(6)
						}
					}
				}}>
					Explore		
				</Button>
				{priority.active === true ?
					<Button style={{borderRadius: 25, fontSize:16, boxShadow: clickedFromOrgTab ? "none":null,textTransform: clickedFromOrgTab ? 'capitalize':null, width: 100, height: 50, marginTop: 8, }} variant="text" color="secondary" onClick={() => {
						// dismiss -> get envs
						changeRecommendation(priority, "dismiss")

						// Check window location if it's /workflows
						if (window.location.pathname === "/workflows") {
							// Set local storage to hide priorities for now
							localStorage.setItem("hidePriorities", "true")
						}

						if (isCloud) {
							ReactGA.event({
								category: "recommendation",
								action: `dismiss_${priority.name}`,
								label: "",
							})
						}
					}}>
						Dismiss	
					</Button>
				: null }
			</div> 
		</div>
	)
}

export default Priority;
