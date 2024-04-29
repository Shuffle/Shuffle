import React, { useState, useEffect } from "react";
import ReactGA from 'react-ga4';
import theme from "../theme.jsx";
import { ToastContainer, toast } from "react-toastify" 

import {
	Paper,
  Typography,
	Divider,
	Button,
	Grid,
	Card,
} from "@mui/material";

//import { useAlert 

const Branding = (props) => {
    const { globalUrl, userdata, serverside, billingInfo,clickedFromOrgTab, stripeKey, selectedOrganization, handleGetOrg, } = props;
    //const alert = useAlert();
    const [publishingInfo, setPublishingInfo] = useState("");
	const [publishRequirements, setPublishRequirements] = useState([])


  	const handleEditOrg = (joinStatus) => {
  	  const data = {
      	  "org_id": selectedOrganization.id,
		  "creator_config": joinStatus,
  	  };

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
				if (joinStatus == "join") {
					setPublishingInfo("Your organization is now part of the Creator Incentive Program. You can now create and publish content to your organization's page. You can also create a creator account to manage your organization's content.")
				} else {
					setPublishingInfo("Your organization is no longer part of the Creator Incentive Program. You can still create a creator account to manage your organization's content.")
				}
          		handleGetOrg(selectedOrganization.id);
  	        }
  	      })
  	    )
  	    .catch((error) => {
  	      toast("Err: " + error.toString());
  	    });
  	};

    // Should enable / disable org branding
    const handleChangePublishing = () => {
      console.log("Handle change publishing");

	  if (selectedOrganization.creator_id == "") {
	  	handleEditOrg("join")
	  } else {
	  	handleEditOrg("leave")
	  }
    }

	const isOrganizationReady = () => {
		console.log("Is organization ready?")

		// A simple checklist to ensure the button shows up properly
		if (selectedOrganization.name === selectedOrganization.org) {
			const comment = "Change the name of your organization"
			if (!publishRequirements.includes(comment)) {
				setPublishRequirements([...publishRequirements, comment])
			}

			return false;
		}

		// Check if it's a suborg
		if (selectedOrganization.creator_org !== "") {
			const comment = "Child orgs can't become creators"
			if (!publishRequirements.includes(comment)) {
				setPublishRequirements([...publishRequirements, comment])
			}
			return false;
		}

		if (selectedOrganization.large_image === "" || selectedOrganization.large_image === theme.palette.defaultImage) {
			const comment = "Add a logo for your organization"
			if (!publishRequirements.includes(comment)) {
				setPublishRequirements([...publishRequirements, comment])
			}
			return false;
		}

		return true
	}

	return (
		<div style={{ width: clickedFromOrgTab? 1030: "auto", padding: 27, height: "auto", backgroundColor: '#212121', borderRadius: '16px', }}>
			<h2 style={{marginTop: clickedFromOrgTab ?0:null,}}>
				Branding
			</h2>
			<Typography variant="body1" color="textSecondary" style={{ marginTop: 20, marginBottom: 10 }}>
				You can customize your organization's branding by uploading a logo, changing the color scheme and a lot more. 
			</Typography>

			<Divider style={{marginTop: 50, marginBottom: 50, }} />
			<h2>
				Creator Incentive Program 
			</h2>
			<div style={{ display: "flex", width: 900, }}>
				<div>
					<span>
						<Typography variant="body1" color="textSecondary">
							By changing publishing settings, you agree to our <a href="/docs/terms_of_service" target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>Terms of Service</a>, and acknowledge that your organization's non-sensitive data will be added as a <a target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}} href="https://shuffler.io/creators">creator account</a>. None of your existing workflows, apps, or other stored data will be published. Any admin in your organization can manage the creator configuration. Becoming a creator organization is reversible.<div/>Support: <a href="mailto:support@shuffler.io"target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>support@shuffler.io</a>
						</Typography>
						{selectedOrganization.creator_id == "" ? 
							<Typography variant="h6" color="textSecondary" style={{ marginTop: 20, marginBottom: 10, color: "grey", }}>
								&nbsp;
							</Typography>
						:
							<Typography variant="h6" color="textSecondary" style={{ marginTop: 20, marginBottom: 10, color: "grey", }}>
								 
								<a href={`/creators/${selectedOrganization.creator_id}`} target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>Modify your creator organization</a>
							</Typography>
						}

						<Button
							style={{ height: 40, marginTop: 10, width: 300,  }}
							variant={selectedOrganization.creator_id == "" ? "contained" : "outlined"}
							color={selectedOrganization.creator_id == "" ? "primary" : "secondary"}
							disabled={!isOrganizationReady()}
							onClick={() => {
								handleChangePublishing();
							}}
						>
							{selectedOrganization.creator_id == "" ? "Join" : "Leave"} Creators 
							
						</Button>
						<Typography variant="body1" color="textSecondary" style={{ marginTop: 20, marginBottom: 10, color: "white", }}>
							{publishingInfo}
						</Typography>
						<Typography variant="body1" color="textSecondary" style={{ marginTop: 20, marginBottom: 10, color: "grey", }}>
							{publishRequirements.map((item) => {
								return (
									<div>
										Required: {item}
									</div>
								)
							})}
						</Typography>
					</span>
				</div>
			</div>
		</div>
	)
}

export default Branding;
