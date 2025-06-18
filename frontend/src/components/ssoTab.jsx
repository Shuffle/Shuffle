import { useEffect, useContext } from "react";
import React from "react";
import { 
    Typography, 
    Switch, 
    Button, 
    Tooltip, 
    TextField, 
    Grid, 
    Checkbox
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Link } from "react-router-dom";
import theme from "../theme.jsx";
import { toast } from "react-toastify";
import { Context } from "../context/ContextApi.jsx";
import { getTheme } from "../theme.jsx";

const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important",
	},
});


const SSOTab = ({selectedOrganization, userdata, isEditOrgTab, globalUrl, handleEditOrg})=>{

    const classes = useStyles();
    const [show2faSetup, setShow2faSetup] = React.useState(false);
	const [autoPrivision, setAutoProvision] = React.useState(selectedOrganization?.sso_config?.auto_provision)
	const [roleRequired, setRoleRequired] = React.useState(selectedOrganization?.sso_config?.role_required || false);
	const [showOpenIdCred, setShowOpenIdCred] = React.useState(false);
	const [showSamlCred, setShowSamlCred] = React.useState(false);
	const [skipSSOForAdmin, setSkipSSOForAdmin] = React.useState(
		selectedOrganization?.sso_config === undefined
			? false
			: selectedOrganization?.sso_config?.skip_sso_for_admins === undefined
				? false
				: selectedOrganization?.sso_config?.skip_sso_for_admins
	);
    const [ssoEntrypoint, setSsoEntrypoint] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.sso_entrypoint === undefined ||
				selectedOrganization.sso_config.sso_entrypoint.length === 0
				? ""
				: selectedOrganization.sso_config.sso_entrypoint
	);
	const [SSORequired, setSSORequired] = React.useState(selectedOrganization.sso_config === undefined
		? false
		: selectedOrganization.sso_config.SSORequired === undefined
			? false
			: selectedOrganization.sso_config.SSORequired);

	const [ssoCertificate, setSsoCertificate] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.sso_certificate === undefined ||
				selectedOrganization.sso_config.sso_certificate.length === 0
				? ""
				: selectedOrganization.sso_config.sso_certificate
	);

    const [openidClientId, setOpenidClientId] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.client_id === undefined ||
				selectedOrganization.sso_config.client_id.length === 0
				? ""
				: selectedOrganization.sso_config.client_id
	);
	const [openidClientSecret, setOpenidClientSecret] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.client_secret === undefined ||
				selectedOrganization.sso_config.client_secret.length === 0
				? ""
				: selectedOrganization.sso_config.client_secret
	);
	const [openidAuthorization, setOpenidAuthorization] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.openid_authorization === undefined ||
				selectedOrganization.sso_config.openid_authorization.length === 0
				? ""
				: selectedOrganization.sso_config.openid_authorization
	);
	const [openidToken, setOpenidToken] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.openid_token === undefined ||
				selectedOrganization.sso_config.openid_token.length === 0
				? ""
				: selectedOrganization.sso_config.openid_token
	)

	const { themeMode, supportEmail, brandColor } = useContext(Context);
	const theme = getTheme(themeMode, brandColor);

    useEffect(()=>{
        
		if (openidClientSecret !== selectedOrganization?.sso_config?.client_secret) {
			setOpenidClientSecret(selectedOrganization?.sso_config?.client_secret)
		}

		if (openidClientId !== selectedOrganization?.sso_config?.client_id) {
			setOpenidClientId(selectedOrganization?.sso_config?.client_id)
		}

		if (openidAuthorization !== selectedOrganization?.sso_config?.openid_authorization) {
			setOpenidAuthorization(selectedOrganization?.sso_config?.openid_authorization)
		}

		if (openidToken !== selectedOrganization?.sso_config?.openid_token) {
			setOpenidToken(selectedOrganization?.sso_config?.openid_token)
		}

		if (ssoCertificate !== selectedOrganization?.sso_config?.sso_certificate) {
			setSsoCertificate(selectedOrganization?.sso_config?.sso_certificate)
		}

		if (ssoEntrypoint !== selectedOrganization?.sso_config?.sso_entrypoint) {
			setSsoEntrypoint(selectedOrganization?.sso_config?.sso_entrypoint)
		}

		if (SSORequired !== selectedOrganization?.sso_config?.SSORequired) {
			setSSORequired(selectedOrganization?.sso_config?.SSORequired)
		}
		if (autoPrivision !== selectedOrganization?.sso_config?.auto_provision) {
			setAutoProvision(selectedOrganization?.sso_config?.auto_provision)
		}

		if (roleRequired !== selectedOrganization?.sso_config?.role_required) {
			setRoleRequired(selectedOrganization?.sso_config?.role_required)
		}

		if (skipSSOForAdmin !== selectedOrganization?.sso_config?.skip_sso_for_admins) {
			setSkipSSOForAdmin(selectedOrganization?.sso_config?.skip_sso_for_admins)
		}

    },[selectedOrganization])

    const orgSaveButton = (
		<Tooltip title="Save any unsaved data" placement="bottom">
			<Button
				style={{ width: 244, height: 51, flex: 1, textTransform: 'capitalize', padding: "16px, 24px, 16px, 24px", borderRadius: 4,  fontSize: 16, }}
				variant="contained"
				color="primary"
				disabled={
					userdata === undefined ||
					userdata === null ||
					userdata.admin !== "true"
				}
				onClick={() =>
					handleEditOrg(
						selectedOrganization?.name,
						selectedOrganization?.description,
						selectedOrganization.id,
						selectedOrganization.image,
						{
							app_download_repo: selectedOrganization?.defaults?.app_download_repo,
							app_download_branch: selectedOrganization?.defaults?.app_download_branch,
							workflow_download_repo: selectedOrganization?.defaults?.workflow_download_repo,
							workflow_download_branch: selectedOrganization?.defaults?.workflow_download_branch,
							notification_workflow: selectedOrganization?.defaults?.notification_workflow,
							documentation_reference: selectedOrganization?.defaults?.documentation_reference,
							workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
							workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
							workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
							workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
							newsletter: !selectedOrganization?.defaults?.newsletter,
							weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
						},
						{
							sso_entrypoint: ssoEntrypoint,
							sso_certificate: ssoCertificate,
							client_id: openidClientId,
							client_secret: openidClientSecret,
							openid_authorization: openidAuthorization,
							openid_token: openidToken,
							SSORequired: SSORequired,
							auto_provision: autoPrivision,
							role_required: roleRequired,
							skip_sso_for_admins: skipSSOForAdmin,
						},
						undefined, 
						{},     
						"sso_config"
					)
				}

			>
				Save Changes
				{/* <SaveIcon /> */}
			</Button>
		</Tooltip>
	);

	const toggleBetweenRequiredOrOptional = (event) => {
		if (
		  ssoEntrypoint === "" &&
		  openidAuthorization === "" &&
		  openidToken === ""
		) {
		  if (!SSORequired) {
			toast.error(
			  "Please fill in fields for either OpenID connect or SSO before continuing. "
			);
			return;
		  }
		} else {
		  toast.info("Toggled SSO. Remember to save.");
		}
	
		setSSORequired(event.target.checked);
	};

	const handleChangeAutoProvision = (event) => {

		if (
			ssoEntrypoint === "" &&
			openidAuthorization === "" &&
			openidToken === ""
		) {
			toast.error(
				"Please fill in fields for either OpenID connect or SSO before continuing. "
			);
		} else {
			setAutoProvision((prev)=> !prev);
			toast.info("Toggled Auto Provisioning. Remember to save.");
		}
	};

	const handleChangeRoleRequired = (event) => {
		if (
			openidAuthorization?.length === 0 &&
			openidToken?.length === 0
		) {
			toast.error(
				"Please fill in fields for OpenID connect before continuing. "
			);
			return;
		} else {
			setRoleRequired((prev)=> !prev);
			toast.info("Toggled Role Required. Remember to save.");
		}
	}

	const handlechangeSkipSSOForAdmin = (event) => {
		
		setSkipSSOForAdmin((prev) => !prev);
		toast.info("Toggled Skip SSO for Admins. Remember to save.");
	};	
	
	const HandleTestSSO = () => {
		const url = `${globalUrl}/api/v1/orgs/${selectedOrganization?.id}/change`;
		const data = {
			org_id: selectedOrganization?.id,
			sso_test: true,
		};
		
		fetch(url, {
			mode: "cors",
			credentials: "include",
			crossDomain: true,
			method: "POST",
			body: JSON.stringify(data),
			withCredentials: true,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		})
			.then((response) => {
				if (response.status !== 200) {
					toast.error(
						`Failed to test SSO. Please try again later or contact ${supportEmail} if issue persists.`,
						{ duration: 3000 }
					);
					return null;
				}
				return response.json();
			})
			.then((responjson) => {
				if (!responjson) return;
	
				if (responjson["reason"] === "SSO_REDIRECT") {
					toast.info(
						"Redirecting to SSO login page as SSO is required for this organization.",
						{
							duration: 3000,
							onClose: () => {
								window.location.href = responjson["url"];
							}
						}
					);
				} else {
					toast.error(
						"No SSO found for this org. Please set up SSO for this org.",
						{ duration: 3000 }
					);
				}
			})
			.catch((error) => {
				console.error("Error for SSO test:", error);
				toast.error(
					"An error occurred while testing SSO. Please try again.",
					{ duration: 3000 }
				);
			});
	};

    return (
        <div style={{ width: "100%", height: "100%",boxSizing: 'border-box', padding: "27px 10px 19px 27px",  backgroundColor: theme.palette.platformColor , borderRadius: '16px',  }}>
			<div style={{ height: "100%", width: "100%", overflowX: 'hidden', scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin'}} >
             <div style={{ width: "100%", overflowX: 'hidden', maxWidth: 883}}>
			 <Typography variant="h5" style={{ width: "100%",  fontWeight: 500, fontSize: 24}}>
					SSO Configuration
				</Typography>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
                        justifyContent: 'flex-start',
						marginTop: 20
					}}
					>
					<Typography
						variant="body2"
						color="textSecondary"
						style={{ marginTop: 5, marginBottom: 5, fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400 }}
					>
						Make SAML SSO or OpenID Authentication Required or Optional for Your Organization.
					</Typography>
					<div>
						<Switch
						checked={SSORequired}
						onChange={toggleBetweenRequiredOrOptional}
                        sx={{marginBottom: 0.6, marginTop: 0.6}}
						name="onOffSwitch"
						color="primary"
						title="Make SAML SSO or OpenID Authentication Required or Optional for Your Organization"
						/>
						{SSORequired ? "Required" : "Optional"}
					</div>

				</div>
				{/* auto privisiong in sso */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
                        justifyContent: 'flex-start',
						marginTop: 30
					}}
					>
					<Typography
						variant="body2"
						color="textSecondary"
						style={{ marginTop: 5, marginBottom: 5, fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400 }}
					>
						Auto-provisioning of users in SSO. By default, users are auto-provisioned in SSO when they login. If you enable this, no new user will be added in your organization when they login via SSO.
					</Typography>
					<div>
						<Switch
						checked={autoPrivision}
						onChange={handleChangeAutoProvision}
                        sx={{marginBottom: 0.6, marginTop: 0.6}}
						name="onOffSwitch"
						color="primary"
						title="Disable auto-provisioning of users in SSO"
						/>
					</div>
					
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
                        justifyContent: 'flex-start',
						marginTop: 30
					}}
					>
					<Typography
						variant="body2"
						color="textSecondary"
						style={{ marginTop: 5, marginBottom: 5, color: "rgba(158, 158, 158, 1)", fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400 }}
					>
						Restrict user login to SSO if no valid role is assigned by the SSO provider. When enabled, users will not be allowed to log in via SSO if their assigned role doesn't matches one of the following: shuffle-user, shuffle-admin, or shuffle-org-reader. Currently, available for OpenId Connect only. 
						<a href="https://shuffler.io/docs/extensions#how-to-assign-a-role-to-a-new-user-from-an-sso-provider-(openid-connect)-in-shuffle" target="_blank" style={{ color: theme.palette.linkColor }}> Learn more</a>
						 </Typography>
					<div>
						<Switch
						checked={roleRequired}
						onChange={handleChangeRoleRequired}
                        sx={{marginBottom: 0.6, marginTop: 0.6}}
						name="onOffSwitch"
						color="primary"
						title="Disable auto-provisioning of users in SSO"
						/>
					</div>
					
				</div>
				{userdata && userdata?.active_org?.creator_org?.length > 0 ? null : 
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
                        justifyContent: 'flex-start',
						marginTop: 30
					}}
					>
					<Typography
						variant="body2"
						color="textSecondary"
						style={{ marginTop: 5, marginBottom: 5, color: "rgba(158, 158, 158, 1)", fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400 }}
					>
						Skip SSO for Admins. When enabled, parent org admins will be able switch to the sub-organization without SSO. 	
					</Typography>
					<div>
						<Switch
						checked={skipSSOForAdmin}
						onChange={handlechangeSkipSSOForAdmin}
                        sx={{marginBottom: 0.6, marginTop: 0.6}}
						name="onOffSwitch"
						color="primary"
						title="Disable auto-provisioning of users in SSO"
						/>
					</div> 
				</div>
				}

					<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginTop: 30,
						width: "100%",
						paddingBottom: 10,
					}}
					>
					<Typography variant="body2" color="textSecondary" style={{ margin: "5px 0px 5px 0px", fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}>
						You can test your SSO configuration by clicking the button below.
						Before testing, ensure you have set Open ID Connect or SAML SSO
						credentials.
					</Typography>
					<Tooltip
						title={
						!(
							ssoEntrypoint?.length > 0 ||
							ssoCertificate?.length > 0 ||
							openidAuthorization?.length > 0 ||
							openidClientId?.length > 0
						)
							? "Please ensure all SSO credentials are set before testing."
							: ""
						}
					>
						<span style={{ width: 100 }}>
						<Button
							variant="outlined"
							color="primary"
							style={{ width: 100, textTransform: "none", margin: "10px 10px 10px 0px", whiteSpace: "nowrap" }}
							disabled={
							!(
								ssoEntrypoint?.length > 0 ||
								ssoCertificate?.length > 0 ||
								openidAuthorization?.length > 0 ||
								openidClientId?.length > 0
							)
							}
							onClick={HandleTestSSO}
						>
							Test SSO
						</Button>
						</span>
					</Tooltip>
					</div>
				<Grid item xs={12} sx={{marginTop: 2}}>
					<span style={{ display: "flex", flexDirection: "column" }}>
						<Typography variant="h5" color="textPrimary" style={{ textAlign: "left", fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontSize: 24, fontWeight: 500, }}>OpenID connect</Typography>
						<span style={{ marginTop: 8, color: theme.palette.text.secondary, fontSize: 16,  fontWeight: 400 }}>
							Configure and Authorize SAML / SSO or OpenID connect. {" "}
							<a
								target="_blank"
								href="/docs/extensions#single-signon"
								style={{ color: theme.palette.linkColor }}
							>
								Learn more
							</a>
						</span>
					</span>
					<Typography variant="body2" color="tehttp://localhost:5002/api/v1/login_openidxtSecondary" style={{ textAlign: "left", fontSize: 16, marginTop: 8,  fontWeight: 400 }}>
						IdP URL for Shuffle OpenID: <Link to={`${globalUrl}/api/v1/login_openid`} target="_blank" style={{ color: theme.palette.text.secondary, textDecoration: "none", fontSize: 16,}}>{`${globalUrl}/api/v1/login_openid`}</Link>
						</Typography>
						<div style={{ display: 'flex', marginTop: 10, }}>
							<Typography
								color="textSecondary"
								style={{
								textAlign: "left",
								fontSize: 16,
								marginTop: 8,
								fontWeight: 400,
								}}
							>
								Show OpenID Credentials
							</Typography>
							<Checkbox
								checked={showOpenIdCred}
								onChange={(e) => setShowOpenIdCred(e.target.checked)}
								name="showOpenIdCred"
								color="primary"
							/>
							</div>
					<Grid container style={{ marginTop: 8, }} spacing={2}>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400, }}>Client ID</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? theme.palette.textFieldStyle.backgroundColor : theme.palette.inputColor,
									}}
									fullWidth={true}
									multiline={true}
									rows={2}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									placeholder="The OpenID client ID from the identity provider"
									value={showOpenIdCred ? openidClientId : openidClientId?.length > 0 ? "•".repeat(50) : ""}
										onChange={(e) => setOpenidClientId(e.target.value)}
										onFocus={(e) => setShowOpenIdCred(true)}
										onBlur={(e) => setShowOpenIdCred(false)}
									InputProps={{
										classes: {
										notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
										color: theme.palette.textFieldStyle.color,
										fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
										fontWeight: 400,
										fontSize: 16,
										borderRadius: theme.palette.textFieldStyle.borderRadius,
										},
									}}
									/>
							</span>
						</Grid>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400, }}>Client Secret</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? theme.palette.textFieldStyle.backgroundColor : theme.palette.inputColor,
									}}
									fullWidth={true}
									type={showOpenIdCred ? "text" : "password"}
									multiline={true}
									rows={2}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									placeholder="The OpenID client secret - DONT use this if dealing with implicit auth / PKCE"
									value={showOpenIdCred ? openidClientSecret : openidClientSecret?.length > 0 ? "•".repeat(50) : ""}
									onChange={(e) => {
										setOpenidClientSecret(e.target.value);
										}}
										onFocus={(e) => setShowOpenIdCred(true)}
										onBlur={(e) => setShowOpenIdCred(false)}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: theme.palette.textFieldStyle.color,
											fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
											fontWeight: 400,
											fontSize: 16,
											borderRadius: theme.palette.textFieldStyle.borderRadius,
										},
									}}
								/>
							</span>
						</Grid>
					</Grid>
					<Grid container style={{ marginTop: 10, }} spacing={2}>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400, fontSize: 16 }}>Authorization URL</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? theme.palette.textFieldStyle.backgroundColor : theme.palette.inputColor,
									}}
									fullWidth={true}
									type={showOpenIdCred ? "text" : "password"}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									multiline={true}
									rows={2}
									placeholder="The OpenID authorization URL (usually ends with /authorize)"
									value={showOpenIdCred ? openidAuthorization : openidAuthorization?.length > 0 ? "•".repeat(50) : ""}
									onChange={(e) => {
										setOpenidAuthorization(e.target.value)
										}}
										onFocus={(e) => setShowOpenIdCred(true)}
										onBlur={(e) => setShowOpenIdCred(false)}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: theme.palette.textFieldStyle.color,
											fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
										},
									}}
								/>
							</span>
						</Grid>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{  fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400, }}>Token URL</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? theme.palette.textFieldStyle.backgroundColor : theme.palette.inputColor,
									}}
									fullWidth={true}
									type={showOpenIdCred ? "text" : "password"}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									multiline={true}
									rows={2}
									placeholder="The OpenID token URL (usually ends with /token)"
									value={showOpenIdCred ? openidToken : openidToken?.length > 0 ? "•".repeat(50) : ""}
									onChange={(e) => {
										setOpenidToken(e.target.value)
										}}
										onFocus={(e) => setShowOpenIdCred(true)}
										onBlur={(e) => setShowOpenIdCred(false)}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color:theme.palette.textFieldStyle.color,
											fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
										},
									}}
								/>
							</span>
						</Grid>
					</Grid>
				</Grid>
				{/**/}
				{/*isCloud ? null : */}
				<Grid item xs={12} sx={{ marginTop: 3.5 }} >
					<Typography variant="h5" color="textPrimary" style={{ textAlign: "left", fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontSize: 24, fontWeight: 500, }}>SAML SSO (v1.1)</Typography>
					<Typography variant="body2" color="textSecondary"  style={{  textAlign: "left", marginTop: 8, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontSize: 16, fontWeight: 400, }}>
						IdP URL for Shuffle SAML/SSO: <Link to={`${globalUrl}/api/v1/login_sso`} target="_blank" style={{ color: theme.palette.text.secondary, textDecoration: "none" }}>{`${globalUrl}/api/v1/login_sso`}</Link>
						</Typography>
						<div style={{ display: 'flex', marginTop: 10, }}>
							<Typography
								color="textSecondary"
								style={{
									textAlign: "left",
									fontSize: 16,
									marginTop: 8,
									fontWeight: 400,
								}}
							>
								Show SAML Credentials
							</Typography>
							<Checkbox
								checked={showSamlCred}
								onChange={(e) => setShowSamlCred(e.target.checked)}
								name="showSamlCred"
								color="primary"
							/>
						</div>
					<Grid container style={{ marginTop: 10, }} spacing={2}>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400, }}>SSO Entrypoint (IdP)</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? theme.palette.textFieldStyle.backgroundColor : theme.palette.inputColor,
									}}
									fullWidth={true}
									type={showSamlCred ? "text" : "password"}
									multiline={true}
									rows={2}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									placeholder="The entrypoint URL from your provider"
									value={showSamlCred ? ssoEntrypoint : ssoEntrypoint?.length > 0 ? "•".repeat(50) : ""}
									onChange={(e) => {
										setSsoEntrypoint(e.target.value);
										}}
										onFocus={(e) => setShowSamlCred(true)}
										onBlur={(e) => setShowSamlCred(false)}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: theme.palette.textFieldStyle.color,
											fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
										},
									}}
								/>
							</span>
						</Grid>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)", fontWeight: 400, fontSize: 16 }}>SSO Certificate (X509)</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? theme.palette.textFieldStyle.backgroundColor: theme.palette.inputColor,
									}}
									fullWidth={true}
									type={showSamlCred ? "text" : "password"}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									multiline={true}
									rows={2}
									placeholder="The X509 certificate to use"
										value={showSamlCred ? ssoCertificate : ssoCertificate?.length > 0 ? "•".repeat(50) : ""}
										onFocus={(e) => setShowSamlCred(true)}
										onBlur={(e) => setShowSamlCred(false)}
									onChange={(e) => {
										setSsoCertificate(e.target.value);
									}}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: theme.palette.textFieldStyle.color,
											fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
										},
									}}
								/>
							</span>
						</Grid>
					</Grid>
				</Grid>
                <div style={{ textAlign: "center", margin: "50px auto 0px auto", }}>
				    {orgSaveButton}
			    </div>
			 </div>
				</div>
		</div>
    )
}

export default SSOTab
