import React, { useState, useEffect } from "react";
import ReactGA from 'react-ga4';
import theme from "../theme";

import { useTheme } from "@material-ui/core/styles";
import {
	Paper,
  Typography,
	Divider,
	Button,
	Grid,
	Card,
} from "@material-ui/core";

import { useAlert } from "react-alert";

const Branding = (props) => {
  const { globalUrl, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, } = props;
  const alert = useAlert();
	const [publishingInfo, setPublishingInfo] = useState("");

	// Should enable / disable org branding
  const handleChangePublishing = () => {
		console.log("Handle change publishing");
	}

	const isOrganizationReady = () => {
		// A simple checklist to ensure the button shows up properly
		if (selectedOrganization.name === selectedOrganization.org) {
			return false;
		}

		if (selectedOrganization.large_image === "" || selectedOrganization.large_image === theme.palette.defaultImage) {
			return false;
		}

		return true
	}

	return (
		<div>
			<Typography variant="h6" style={{ marginTop: 20, marginBottom: 10 }}>
				Branding	
			</Typography>
			<Typography variant="body1" color="textSecondary" style={{ marginTop: 20, marginBottom: 10 }}>
				You can customize your organization's branding by uploading a logo, changing the color scheme and a lot more. 
			</Typography>

			<Divider style={{marginTop: 50, marginBottom: 50, }} />
			<h2>
				Creator Network 
			</h2>
			<div style={{ display: "flex", width: 700, }}>
				<div>
					<span>
						<Typography variant="body1" color="textSecondary">
							By changing publishing settings, you agree to our <a href="/docs/terms_of_service" target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>Terms of Service</a>, and acknowledge that your organization's non-sensitive data will be turned into a <a target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}} href="https://shuffler.io/creators">creator account</a>. Support: support@shuffler.io

						</Typography>
						<Button
							style={{ height: 40, marginTop: 10, width: 300,  }}
							variant="outlined"
							color="primary"
							disabled={() => {
								return isOrganizationReady()
							}}
							onClick={() => {
								handleChangePublishing();
							}}
						>
							Join Creator Network 
						</Button>
						<Typography variant="body1" color="textSecondary" style={{ marginTop: 20, marginBottom: 10 }}>
							{publishingInfo}
						</Typography>
					</span>
				</div>
			</div>
		</div>
	)
}

export default Branding;
