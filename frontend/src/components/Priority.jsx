import React, { useState, useEffect } from "react";

import theme from "../theme.jsx";
import { useNavigate, Link } from "react-router-dom";
import {
	Paper,
  Typography,
	Divider,
	Button,
	Grid,
	Card,
} from "@material-ui/core";

import { useAlert } from "react-alert";

const Priority = (props) => {
  const { globalUrl, userdata, serverside, priority, checkLogin, } = props;


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
          	alert.error("Failed change recommendation: ", responseJson.reason)
        	} else {
          	alert.error("Failed change recommendation");
					}
        }
      })
      .catch((error) => {
        alert.info("Failed dismissing alert. Please contact support@shuffler.io if this persists.");
      });
	}

	return (
		<div style={{border: priority.active === false ? "1px solid #000000" :  priority.severity === 1 ? "1px solid #f85a3e" : "1px solid rgba(255,255,255,0.3)", borderRadius: theme.palette.borderRadius, marginTop: 10, marginBottom: 10, padding: 15, textAlign: "center", height: 70, textAlign: "left", backgroundColor: theme.palette.surfaceColor, display: "flex", }}>
			<div style={{flex: 2, overflow: "hidden",}}>
				<Typography variant="body1" >
					{priority.name}
				</Typography>
				<Typography variant="body2" color="textSecondary">
					{priority.description}
				</Typography>
			</div>
			<div style={{flex: 1, display: "flex", marginLeft: 30, }}>
				<Button style={{height: 50, borderRadius: 25,  marginTop: 8, width: 200, marginRight: 10, color: priority.active === false ? "white" : "black", backgroundColor: priority.active === false ? theme.palette.inputColor : "white", }} variant="contained" color="secondary" onClick={() => {navigate(priority.url)}}>
					explore		
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
