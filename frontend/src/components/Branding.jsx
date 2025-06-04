import React, { useState, useEffect, useContext } from "react";
import ReactGA from 'react-ga4';
import {getTheme} from "../theme.jsx";
import { ToastContainer, toast } from "react-toastify" 
import {
	CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import {
	Paper,
  Typography,
	Divider,
	Button,
	Tooltip,
	ToggleButtonGroup,
	ToggleButton,
	useMediaQuery,
	TextField,
	Box,
} from "@mui/material";

import {
	red,
	green,
} from "../views/AngularWorkflow.jsx"
import { Context } from "../context/ContextApi.jsx";

//import { useAlert 

const Branding = (props) => {
    const { globalUrl, userdata, serverside, billingInfo,clickedFromOrgTab, stripeKey, selectedOrganization, handleGetOrg, } = props;
	const { themeMode, handleThemeChange, supportEmail, setSupportEmail, logoutUrl, setLogoutUrl, brandColor, setBrandColor, setBrandName } = useContext(Context)
    //const alert = useAlert();
    const [publishingInfo, setPublishingInfo] = useState("");
	const [publishRequirements, setPublishRequirements] = useState([])
	const [currentSelectedTheme, setCurrentSelectedTheme] = useState(themeMode);
	const [integrationPartner, setIntegrationPartner] = useState(false);
	const [changingTheme, setChangingTheme] = useState(false);
	const theme = getTheme(themeMode, brandColor)
	const [selectedBrandColor, setSelectedBrandColor] = useState(theme?.palette?.main || "#FF8544")
	const [selectedBrandName, setSelectedBrandName] = useState(selectedOrganization?.branding?.brand_name || "")

	const [isLoading,setIsLoading] = useState(false);

	const handleEditOrg = (joinStatus) => {
	setIsLoading(true)
  	  const data = {
      	  "org_id": selectedOrganization.id,
  	  };

	  if (joinStatus === "join" || joinStatus === "leave") {
		data["creator_config"]  = joinStatus
	  }

	if (joinStatus === "light" || joinStatus === "dark" || joinStatus === "system") {
		data["branding"]  = {
			"theme": joinStatus,
			"enable_chat": selectedOrganization?.branding?.enable_chat || false,
			"home_url": selectedOrganization?.branding?.home_url || "",
			"brand_color": selectedOrganization?.branding?.brand_color || theme.palette.primary.main,
			"brand_name": selectedOrganization?.branding?.brand_name || "",
			"logout_url": selectedOrganization?.branding?.logout_url || "",
			"support_email": selectedOrganization?.branding?.support_email || "",
		}

		data["editing_branding"] = true;
	}

	if (joinStatus === "brand_color") {
		data["branding"]  = {
			"theme": selectedOrganization?.branding?.theme || "dark",
			"enable_chat": selectedOrganization?.branding?.enable_chat || false,
			"home_url": selectedOrganization?.branding?.home_url || "",
			"brand_color": selectedBrandColor,
			"brand_name": selectedOrganization?.branding?.brand_name || "",
			"logout_url": selectedOrganization?.branding?.logout_url || "",
			"support_email": selectedOrganization?.branding?.support_email || "",
		}

		data["editing_branding"] = true;
	}

	if (joinStatus === "brand_name") {
		data["branding"]  = {
			"theme": selectedOrganization?.branding?.theme || "dark",
			"enable_chat": selectedOrganization?.branding?.enable_chat || false,
			"home_url": selectedOrganization?.branding?.home_url || "",
			"brand_color": selectedOrganization?.branding?.brand_color || theme.palette.primary.main,
			"brand_name": selectedBrandName,
			"logout_url": selectedOrganization?.branding?.logout_url || "",
			"support_email": selectedOrganization?.branding?.support_email || "",
		}
		toast.info("Updating brand name to " + selectedBrandName + ". Please wait a moment.")
		data["editing_branding"] = true;
	}

	if (joinStatus === "support_email") {
		data["branding"]  = {
			"theme": selectedOrganization?.branding?.theme || "dark",
			"enable_chat": selectedOrganization?.branding?.enable_chat || false,
			"home_url": selectedOrganization?.branding?.home_url || "",
			"brand_color": selectedOrganization?.branding?.brand_color || theme.palette.primary.main,
			"brand_name": selectedOrganization?.branding?.brand_name || "",
			"support_email": supportEmail,
			"logout_url": selectedOrganization?.branding?.logout_url || "",
		}
		data["editing_branding"] = true;
	}

	if (joinStatus === "logout_url") {
		data["branding"]  = {
			"theme": selectedOrganization?.branding?.theme || "dark",
			"enable_chat": selectedOrganization?.branding?.enable_chat || false,
			"home_url": selectedOrganization?.branding?.home_url || "",
			"brand_color": selectedOrganization?.branding?.brand_color || theme.palette.primary.main,
			"brand_name": selectedOrganization?.branding?.brand_name || "",
			"support_email": selectedOrganization?.branding?.support_email || "",
			"logout_url": logoutUrl,
		}
		data["editing_branding"] = true;
	}


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
				if (joinStatus === "join" || joinStatus === "leave") {
					if (joinStatus === "join") {
						setPublishingInfo("Your organization is now part of the Partner Program. You can now create, publish and manage content for your organization's public page.")
					} else {
						setPublishingInfo("Your organization is no longer part of the Creator Incentive Program. You can still create a creator account to manage your organization's content.")
					}
				}

				if (joinStatus === "light" || joinStatus === "dark" || joinStatus === "system") {
					handleThemeChange(joinStatus)
					setChangingTheme(false)
					setCurrentSelectedTheme(joinStatus)
				}

				if (joinStatus === "support_email") {
					toast.info("Support email updated successfully.")
					if (supportEmail?.length > 0) {
						setSupportEmail(supportEmail)
					}else {
						setSupportEmail("support@shuffler.io")
					}
				}

				if (joinStatus === "logout_url") {
					toast.info("Logout URL updated successfully.")
					setLogoutUrl(logoutUrl)
				}

				if (joinStatus === "brand_color") {
					toast.info("Brand color updated successfully.")
					setBrandColor(selectedBrandColor)
					localStorage.setItem("brandColor", selectedBrandColor)
				}

				if (joinStatus === "brand_name") {
					toast.info("Brand name updated successfully.")
					setBrandName(selectedBrandName)
					localStorage.setItem("brandName", selectedBrandName)
				}

          		handleGetOrg(selectedOrganization.id);

				setIsLoading(false)
				}
  	      })
  	    )
  	    .catch((error) => {
  	      toast("Err: " + error.toString());
			setIsLoading(false)
  	    })
  	};

	useEffect(() => {
		if (userdata && userdata?.active_org && userdata?.active_org?.branding?.theme?.length > 0) {
			console.log("Setting current selected theme from userdata", userdata?.active_org?.branding?.theme);	
			setCurrentSelectedTheme(userdata?.active_org?.branding?.theme);
		}
	},[userdata]);

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

		// Check if it's a suborg
		if (selectedOrganization.creator_org !== "") {
			const comment = "Child orgs can't become creators"
			if (!publishRequirements.includes(comment)) {
				setPublishRequirements([...publishRequirements, comment])
			}
			return false;
		}

		// A simple checklist to ensure the button shows up properly
		if (selectedOrganization.name === selectedOrganization.org) {
			const comment = "Change the name of your organization"
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

	const isPublished = selectedOrganization.creator_id === "" 
	const leadinfo = selectedOrganization.lead_info === undefined || selectedOrganization.lead_info === null || selectedOrganization.lead_info === "" ? "" : JSON.stringify(selectedOrganization.lead_info)
	const isPartner = leadinfo.includes("partner")

	
	useEffect(() => {
		if (selectedOrganization?.branding?.theme && selectedOrganization?.creator_org?.length === 0) {
			setCurrentSelectedTheme(selectedOrganization.branding.theme);
		}

		if (selectedOrganization?.creator_org?.length > 0 && userdata?.active_org?.branding.theme) {
			setCurrentSelectedTheme(userdata?.active_org?.branding.theme);
		}

		if (
			selectedOrganization &&
			selectedOrganization?.branding?.brand_color &&
			selectedOrganization?.branding?.brand_color !== selectedBrandColor
		  ) {
			setSelectedBrandColor(selectedOrganization.branding.brand_color);
		  }

		if (selectedOrganization?.branding?.brand_name && selectedOrganization?.branding?.brand_name !== selectedBrandName) {
			setSelectedBrandName(selectedOrganization.branding.brand_name);
		}

	}, [selectedOrganization, userdata]);
	
	useEffect(() => {
		if ((userdata && userdata?.org_status?.includes("integration_partner") && !integrationPartner && !userdata?.org_status?.includes("sub_org")) || userdata?.support) {
			setIntegrationPartner(true)
		}

	},[userdata, integrationPartner]);

	const handleColorChange = (e) => {
		setSelectedBrandColor(e.target.value);
	};

	const saveColorChanges = () => {
		toast.info("Updating brand color to " + selectedBrandColor + ". Please wait a moment.")
		handleEditOrg("brand_color");
	};


	return (
		<div style={{ width: clickedFromOrgTab? "100%": "auto", height: "100%", minHeight: 1100, boxSizing: 'border-box', transition: "width 0.3s ease", padding: "27px 10px 19px 27px", backgroundColor: theme.palette.platformColor, borderRadius: '16px', scrollbarWidth: "thin", scrollbarColor: theme.palette.scrollbarColorTransparent, }}>
			<div style={{ overflowY: "auto",}}>
				<div style={{width: "100%", overflowX: 'hidden', }}>
				<Typography style={{fontSize: 24, fontWeight: "bold", marginTop: clickedFromOrgTab ?0:null,}}>
				Partner Status & Branding
			</Typography>
			<Typography variant="body1" color="textSecondary" style={{ marginTop: 10, marginBottom: 10, fontSize: 16 }}>
				Please note that same theme settings are applied to all sub organizations for partners.
			</Typography>

			<Typography variant="body1" color="textSecondary" style={{display: 'flex', marginTop: 20, marginBottom: 10 }}>
					{isPublished ? <CheckCircleIcon style={{color: red, }} /> : <CheckCircleIcon style={{color: green, }} />}
		<span style={{marginLeft: 10, color: isPublished ? red : green, fontSize: 16 }}>{isPublished ? "Not Published" : "Published"}</span>
			</Typography>

			<a href="https://shuffler.io/partners" target="_blank" style={{ textDecoration: "none", }}>
				<Typography variant="body1" color="textSecondary" style={{display: 'flex', marginTop: 20, marginBottom: 10 }}>
					{!isPartner ? <CheckCircleIcon style={{color: red, }} /> : <CheckCircleIcon style={{color: green, }} />}
					<Tooltip title="Official Partner Program (manual verification)" placement="top" arrow>
						<span style={{marginLeft: 10, color: !isPartner ? red : green, fontSize: 16}}>{!isPartner? "Not Officially Partnered" : "Officially Partnered"}</span>
					</Tooltip>
				</Typography>
			</a>

			{!isPublished ? (
					<a 
						href={`/partners/${selectedOrganization.creator_id}/edit`} 
						target="_blank"
						style={{ textDecoration: "none" }} // Optional: remove underline
					>
						<Button 
								variant="contained" 
								color="primary"
						style={{
							marginTop: 20, 
							marginBottom: 10, 
							textTransform: 'none', 
							fontSize: 16 
						}}
						>
						Modify Public Partner Details
						</Button>
					</a>
					) : (
					<Button 
						disabled 
						variant="contained" 
						style={{
						marginTop: 20, 
						marginBottom: 10, 
						textTransform: 'none', 
						fontSize: 16 
						}}
					>
						Modify Public Partner Details
					</Button>
					)}

			<Divider style={{marginTop: 50, marginBottom: 50, color: theme.palette.defaultBorder}} />
			<Typography style={{fontSize: 24, fontWeight: "bold"}}>
				Public Partner Program 
			</Typography>
			<div style={{ display: "flex", width: 900, marginTop: 10}}>
				<div>
					<span>
						<Typography variant="body2" color="textSecondary">
							By changing publishing settings, you agree to our <a href="/docs/terms_of_service" target="_blank" style={{ textDecoration: "none", color: theme.palette.linkColor}}>Terms of Service</a>, and acknowledge that your organization's non-sensitive data will be added as a <a target="_blank" style={{ textDecoration: "none", color: theme.palette.linkColor}} href="https://shuffler.io/creators">creator account</a>. None of your existing workflows, apps, or other stored data will be published. Any admin in your organization can manage the creator configuration. Becoming a creator organization IS reversible.<div/>Support: <a href={`mailto:${supportEmail}`} target="_blank" style={{ textDecoration: "none", color: theme.palette.linkColor}}>{supportEmail}</a>
						</Typography>
						{selectedOrganization.creator_id == "" ? 
							<Typography variant="h6" color="textSecondary" style={{ marginTop: 20, marginBottom: 10, color: "grey", }}>
								&nbsp;
							</Typography>
						:
							null
						}

						<Button
							variant="contained"
							color="primary"
							style={{ height: 40, marginTop: 10, width: 300, textTransform: 'none', fontSize: 18, }}
							variant={selectedOrganization.creator_id == "" ? "contained" : "outlined"}
							color={selectedOrganization.creator_id == "" ? "primary" : "secondary"}
							disabled={!isOrganizationReady()}
							onClick={() => {
								handleChangePublishing();
							}}
						>
							{selectedOrganization.creator_id == "" ? "Join" : "Leave"} Partner Program 
							
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


				{integrationPartner ? (
					<>
					<Divider style={{marginTop: 50, marginBottom: 50, color: theme.palette.defaultBorder}} />
					<Typography style={{fontSize: 24, fontWeight: "bold"}}>
						Parent & Sub Organization Branding
					</Typography>
					<Typography variant="body1" color="textSecondary" style={{ marginTop: 10, marginBottom: 10, fontSize: 16 }}>
						Sub organizations are not allowed to change their branding. The branding is inherited from the parent organization.
					</Typography>
							<ToggleButtonGroup
							value={currentSelectedTheme}
							exclusive
							disabled={isLoading}
							onChange={(event, newTheme) => {
								if (newTheme === null) {
									return;
								}
								if (newTheme === currentSelectedTheme) {
									return;
								}
								if (changingTheme === true) {
									return
								}
								setChangingTheme(true)
								handleEditOrg(newTheme);
							}}
							aria-label="theme"
							style={{ justifyContent: "flex-start", marginBottom: 10, marginTop: 20 }}
							>
							<ToggleButton value="light" aria-label="light theme" style={{ backgroundColor: currentSelectedTheme === "light" ? theme.palette.hoverColor : theme.palette.backgroundColor }}>
								Light
							</ToggleButton>
							<ToggleButton value="dark" aria-label="dark theme" style={{ backgroundColor: currentSelectedTheme === "dark" ? theme.palette.hoverColor : theme.palette.backgroundColor }}>
								Dark
							</ToggleButton>
							<ToggleButton value="system" aria-label="system theme" style={{ backgroundColor: currentSelectedTheme === "system" ? theme.palette.hoverColor : theme.palette.backgroundColor }}>
								System
							</ToggleButton>
							</ToggleButtonGroup>
					</>
				): null}

				{integrationPartner ? <>
						<Divider style={{marginTop: 50, marginBottom: 50, color: theme.palette.defaultBorder}} />
							<Typography variant="text" style={{color: theme.palette.text.primary, fontFamily: theme.typography.fontFamily,}}>Brand Name</Typography>
							<div style={{ display: "flex", alignItems: 'center', justifyContent: 'flex-start', marginBottom: 10, gap: 15,  maxWidth: 434 }}>
							  <TextField
							   	type="text"
								id="brandName"
								value={selectedBrandName}
								onChange={(e) => {
									const value = e.target.value;
									setSelectedBrandName(value);
								}}
								size="small"
								PaperProps={{ style: { backgroundColor: theme.palette.backgroundColor, borderRadius: 4, border: `1px solid ${theme.palette.defaultBorder}` } }}
								style={{ 
									height: 36, 
									borderRadius: 4, 
									border: `1px solid ${theme.palette.defaultBorder}`,
									width: 300
								}}
								/>
								<Button 
								onClick={()=>{
									if (selectedBrandName !== selectedOrganization.branding.brandName) {
										handleEditOrg("brand_name");
									}
								}}
								disabled={isLoading}
								variant="contained"
								color="primary"
								style={{ fontSize: 16, textTransform: 'capitalize',  boxShadow: "none", borderRadius: 4, width: 110, height: 35 }}
								>
									Update 
								</Button>
							</div>	
				</>: null}
				
				{integrationPartner ? <>
							<Typography variant="text" style={{color: theme.palette.text.primary, fontFamily: theme.typography.fontFamily}}>Brand Color</Typography>
							<div style={{ display: "flex", alignItems: 'center', justifyContent: 'flex-start', marginBottom: 10, gap: 15,  maxWidth: 434 }}>
							<input 
								type="color" 
								id="color" 
								name="color" 
								value={selectedBrandColor} 
								onChange={handleColorChange} 
								style={{ 
								width: 50, 
								height: 50, 
								minWidth: 50,
								minHeight: 50,
								cursor: "pointer",
								borderRadius: 5, 
								border: "none"
								}} 
							/>
							<TextField 
								type="text" 
								id="colorCode" 
								value={selectedBrandColor}
								size="small"
								fullWidth={true}
								PaperProps={{ style: { backgroundColor: theme.palette.backgroundColor, borderRadius: 4, border: `1px solid ${theme.palette.defaultBorder}` } }}
								style={{ 
									height: 36, 
									padding: "0 10px", 
									borderRadius: 4, 
									border: `1px solid ${theme.palette.defaultBorder}`,
									width: 260
								}} 
								/>
							<Button
							onClick={()=>{saveColorChanges();}}
							disabled={isLoading}
							variant="contained"
							color="primary"
							style={{ fontSize: 16, textTransform: 'capitalize',  boxShadow: "none", borderRadius: 4, width: 110, height: 35 }}
							>
							 Update
							</Button>
							</div>	
				</>: null}


				{integrationPartner ? (
					<div style={{ width: "100%", maxWidth: 434, marginRight: 10, marginTop: 20 }}>
					<Typography variant="text" style={{color: theme.palette.text.primary, fontFamily: theme.typography.fontFamily}}>Support Email</Typography>
					<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
					>
						<TextField
						required
						style={{
							flex: "1",
							display: "flex",
							height: 35,
							width: "100%",
							maxWidth: 434,
							fontFamily: theme.typography.fontFamily,
							marginTop: "5px",
							marginRight: "15px",
							color: theme.palette.textFieldStyle.color,
							backgroundColor: theme.palette.textFieldStyle.backgroundColor,
						}}
						fullWidth={true}
						placeholder="Support Email"
						type="email"
						id="standard-required"
						margin="normal"
						variant="outlined"
						value={supportEmail}
						onChange={(e) => {
							setSupportEmail(e.target.value)
						}}
						color="primary"
						InputProps={{
							style: {
								color: theme.palette.textFieldStyle.color,
								height: "35px",
								fontSize: "1em",
								borderRadius: 4,
								backgroundColor: theme.palette.textFieldStyle.backgroundColor,
							},
						}}
					/>
					  <Button
						style={{ fontSize: 16, textTransform: 'capitalize',  boxShadow: "none", borderRadius: 4, width: 110, height: 35 }}
						variant="contained"
						color="primary"
						disabled={isLoading}
						onClick={() => {
							toast.info("Updating support email..")
							handleEditOrg("support_email")
						}}
						>
							Update
					</Button>
					</Box>
					</div>
				) : null}

                {integrationPartner ? (
					<div style={{ width: "100%", maxWidth: 434, marginRight: 10, marginTop: 20 }}>
					<Typography variant="text" style={{color: theme.palette.text.primary, fontFamily: theme.typography.fontFamily}}>Logout URL</Typography>
					<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
					>
						<TextField
						required
						style={{
							flex: "1",
							display: "flex",
							height: 35,
							width: "100%",
							maxWidth: 434,
							fontFamily: theme.typography.fontFamily,
							marginTop: "5px",
							marginRight: "15px",
							color: theme.palette.textFieldStyle.color,
							backgroundColor: theme.palette.textFieldStyle.backgroundColor,
						}}
						fullWidth={true}
						placeholder="Logout URL"
						type="text"
						id="standard-required"
						margin="normal"
						variant="outlined"
						value={logoutUrl}
						onChange={(e) => {
							setLogoutUrl(e.target.value)
						}}
						color="primary"
						InputProps={{
							style: {
								color: theme.palette.textFieldStyle.color,
								height: "35px",
								fontSize: "1em",
								borderRadius: 4,
								backgroundColor: theme.palette.textFieldStyle.backgroundColor,
							},
						}}
					/>
					  <Button
						style={{ fontSize: 16, textTransform: 'capitalize',  boxShadow: "none", borderRadius: 4, width: 110, height: 35 }}
						variant="contained"
						color="primary"
						disabled={isLoading}
						onClick={() => {
							toast.info("Updating logout url..")
							handleEditOrg("logout_url")
						}}
						>
							Update
					</Button>
					</Box>
				</div>
				) : null}
			</div>
		</div>
	)
}

export default Branding;
