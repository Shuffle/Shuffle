import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';

import ReactGA from 'react-ga4';
import theme from "../theme.jsx";
import { useNavigate, Link } from "react-router-dom";
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
  const { globalUrl, userdata, serverside, priority, checkLogin, setAdminTab, setCurTab, } = props;


  	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
	let navigate = useNavigate();
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


	return (
		<div style={{border: priority.active === false ? "1px solid #000000" :  priority.severity === 1 ? "1px solid #f85a3e" : "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette.borderRadius, marginTop: 10, marginBottom: 10, padding: 15, textAlign: "center", minHeight: 70, maxHeight: 70, textAlign: "left", backgroundColor: theme.palette.surfaceColor, display: "flex", }}>
			<div style={{flex: 2, overflow: "hidden",}}>
				<span style={{display: "flex", }}>
					{priority.type === "usecase" || priority.type == "apps" ? <AutoFixHighIcon style={{height: 19, width: 19, marginLeft: 3, marginRight: 10, }}/> : null} 
					<Typography variant="body1" >
						{priority.name}
					</Typography>
				</span>
				{priority.type === "usecase" && priority.description.includes("&") ?
					<span style={{display: "flex", marginTop: 10,  }}>
						<img src={priority.description.split("&")[1]} alt={priority.name} style={{height: 30, width: 30, marginRight: 5,	borderRadius: theme.palette.borderRadius, marginRight: 10, }} />
						<Typography variant="body2" color="textSecondary" style={{marginTop: 3, }}>
							{priority.description.split("&")[0]} 
						</Typography>

						{priority.description.split("&").length > 3 ?
							<span style={{display: "flex", }}>
								<ArrowForwardIcon style={{marginLeft: 15, marginRight: 15, }}/>
								<img src={priority.description.split("&")[3]} alt={priority.name+"2"} style={{height: 30, width: 30, borderRadius: theme.palette.borderRadius, marginRight: 10, }} />
								<Typography variant="body2" color="textSecondary" style={{marginTop: 3}}>
									{priority.description.split("&")[2]} 
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
				<Button style={{height: 50, borderRadius: 25,  marginTop: 8, width: 175, marginRight: 10, color: priority.active === false ? "white" : "black", backgroundColor: priority.active === false ? theme.palette.inputColor : "rgba(255,255,255,0.8)", }} variant="contained" color="secondary" onClick={() => {

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
					<Button style={{borderRadius: 25, width: 100, height: 50, marginTop: 8, }} variant="text" color="secondary" onClick={() => {
						// dismiss -> get envs
						changeRecommendation(priority, "dismiss")
					}}>
						Dismiss	
					</Button>
				: null }
			</div> 
		</div>
	)
}

export default Priority;
