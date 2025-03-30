import React, { memo, useEffect, useState } from "react";

import { makeStyles } from "@mui/styles";
import { toast } from "react-toastify"
import theme from '../theme.jsx';
//import { useAlert 

import {
	FormControl,
	InputLabel,
	Paper,
	OutlinedInput,
	Checkbox,
	Card,
	Tooltip,
	FormControlLabel,
	Chip,
	Link,
	Typography,
	Switch,
	Select,
	MenuItem,
	Divider,
	ListItemText,
	TextField,
	Button,
	Tabs,
	Tab,
	Grid,
	Autocomplete,
} from "@mui/material";

import {
	Icon as IconButton,
	ExpandLess as ExpandLessIcon,
	ExpandMore as ExpandMoreIcon,
	Save as SaveIcon,
	CookieSharp,
} from "@mui/icons-material";
import CloudSyncTab from "./CloudSyncTab.jsx";

const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important",
	},
});

const OrgHeaderexpandedNew = (props) => {
	const {
		userdata,
		selectedOrganization,
		setSelectedOrganization,
		globalUrl,
		isCloud,
		adminTab,
		selectedStatus,
		setSelectedStatus,
		isEditOrgTab
	} = props;

	const classes = useStyles();
	const defaultBranch = "main";
	const ITEM_HEIGHT = 48;
	const ITEM_PADDING_TOP = 8;
	const MenuProps = {
		PaperProps: {
			style: {
				maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
				width: 300,
				borderRadius: 20,
				overflowY: "scroll",
			},
		},
		getContentAnchorEl: () => null,
	};

	const [orgName, setOrgName] = useState(selectedOrganization?.name);
	const [orgDescription, setOrgDescription] = React.useState(
		selectedOrganization.description
	);

	const [appDownloadUrl, setAppDownloadUrl] = React.useState(
		selectedOrganization.defaults === undefined
			? "https://github.com/frikky/shuffle-apps"
			: selectedOrganization.defaults.app_download_repo === undefined ||
				selectedOrganization.defaults.app_download_repo.length === 0
				? "https://github.com/frikky/shuffle-apps"
				: selectedOrganization.defaults.app_download_repo
	);

	const [openNotification, setOpenNotification] = React.useState(false);

	const handleStatusChange = (event) => {
		const { value } = event.target;
		handleEditOrg(
			orgName,
			orgDescription,
			selectedOrganization.id,
			selectedOrganization?.image,
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
				newsletter: selectedOrganization?.defaults?.newsletter,
				weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
			},
			{
				sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
				sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
				client_id: selectedOrganization?.sso_config?.client_id,
				client_secret: selectedOrganization?.sso_config?.client_secret,
				openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
				openid_token: selectedOrganization?.sso_config?.openid_token,
				SSORequired: selectedOrganization?.sso_config?.SSORequired,
				auto_provision: selectedOrganization?.sso_config?.auto_provision,
			},
			value.length === 0 ? ["none"] : value,
		)
	}
	const [appDownloadBranch, setAppDownloadBranch] = React.useState(
		selectedOrganization.defaults === undefined
			? defaultBranch
			: selectedOrganization.defaults.app_download_branch === undefined ||
				selectedOrganization.defaults.app_download_branch.length === 0
				? defaultBranch
				: selectedOrganization.defaults.app_download_branch
	);
	const [workflowDownloadUrl, setWorkflowDownloadUrl] = React.useState(
		selectedOrganization.defaults === undefined
			? "https://github.com/frikky/shuffle-apps"
			: selectedOrganization.defaults.workflow_download_repo === undefined ||
				selectedOrganization.defaults.workflow_download_repo.length === 0
				? "https://github.com/frikky/shuffle-workflows"
				: selectedOrganization.defaults.workflow_download_repo
	);
	const [workflowDownloadBranch, setWorkflowDownloadBranch] = React.useState(
		selectedOrganization.defaults === undefined
			? defaultBranch
			: selectedOrganization.defaults.workflow_download_branch === undefined ||
				selectedOrganization.defaults.workflow_download_branch.length === 0
				? defaultBranch
				: selectedOrganization.defaults.workflow_download_branch
	);

	const [documentationReference, setDocumentationReference] = React.useState(
		selectedOrganization.defaults === undefined
			? ""
			: selectedOrganization.defaults.documentation_reference === undefined ||
				selectedOrganization.defaults.documentation_reference.length === 0
				? ""
				: selectedOrganization.defaults.documentation_reference
	);
	const [newsletter, setNewsletter] = React.useState(
		selectedOrganization.defaults === undefined
			? true
			: selectedOrganization.defaults.newsletter === undefined ||
				selectedOrganization.defaults.newsletter.length === 0
				? true
				: !selectedOrganization.defaults.newsletter
	)

	const [weeklyRecommendations, setWeeklyRecommendations] = React.useState(
		selectedOrganization.defaults === undefined
			? true
			: selectedOrganization.defaults.weekly_recommendations === undefined ||
				selectedOrganization.defaults.weekly_recommendations.length === 0
				? true
				: !selectedOrganization.defaults.weekly_recommendations
	)

	const [uploadRepo, setUploadRepo] = React.useState(selectedOrganization.defaults === undefined ? "" : selectedOrganization.defaults.workflow_upload_repo === undefined || selectedOrganization.defaults.workflow_upload_repo.length === 0 ? "" : selectedOrganization.defaults.workflow_upload_repo)
	const [uploadBranch, setUploadBranch] = React.useState(selectedOrganization.defaults === undefined ? defaultBranch : selectedOrganization.defaults.workflow_upload_branch === undefined || selectedOrganization.defaults.workflow_upload_branch.length === 0 ? defaultBranch : selectedOrganization.defaults.workflow_upload_branch)
	const [uploadUsername, setUploadUsername] = React.useState(selectedOrganization.defaults === undefined ? "" : selectedOrganization.defaults.workflow_upload_username === undefined || selectedOrganization.defaults.workflow_upload_username.length === 0 ? "" : selectedOrganization.defaults.workflow_upload_username)
	const [uploadToken, setUploadToken] = React.useState(selectedOrganization.defaults === undefined ? "" : selectedOrganization.defaults.workflow_upload_token === undefined || selectedOrganization.defaults.workflow_upload_token.length === 0 ? "" : selectedOrganization.defaults.workflow_upload_token)
	const [regionStatus, setRegionStatus] = useState();

	useEffect(() => {

		if (documentationReference !== selectedOrganization?.defaults?.documentation_reference) {
			setDocumentationReference(selectedOrganization?.defaults?.documentation_reference)
		}

		if (uploadRepo !== selectedOrganization?.defaults?.workflow_upload_repo) {
			setUploadRepo(selectedOrganization?.defaults?.workflow_upload_repo)
		}

		if (uploadBranch !== selectedOrganization?.defaults?.workflow_upload_branch) {
			setUploadBranch(selectedOrganization?.defaults?.workflow_upload_branch)
		}

		if (uploadUsername !== selectedOrganization?.defaults?.workflow_upload_username) {
			setUploadUsername(selectedOrganization?.defaults?.workflow_upload_username)
		}

		if (uploadToken !== selectedOrganization?.defaults?.workflow_upload_token) {
			setUploadToken(selectedOrganization?.defaults?.workflow_upload_token)
		}
	}, [selectedOrganization])

	useEffect(() => {
		if (selectedOrganization !== undefined && selectedOrganization !== null) {
			if ((orgName === undefined || orgName === null || orgName.length === 0) && selectedOrganization?.name !== orgName) {
				setOrgName(selectedOrganization?.name)
			}
			if ((orgDescription === undefined || orgDescription === null || orgDescription.length === 0) && selectedOrganization?.description !== orgDescription) {
				setOrgDescription(selectedOrganization?.description)
			}
		}
	}, [selectedOrganization])

	const handleEditOrg = (
		name,
		description,
		orgId,
		image,
		defaults,
		sso_config,
		lead_info,
	) => {
		const data = {
			name: name,
			description: description,
			org_id: orgId,
			image: image,
			defaults: defaults,
			sso_config: sso_config,
			lead_info: lead_info,
			mfa_required: selectedOrganization?.mfa_required,
			Billing: selectedOrganization?.Billing,
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
						toast("Successfully edited org!");
					}
				})
			)
			.catch((error) => {
				toast("Err: " + error.toString());
			});
	}

	const handleSendChangeRegionMail = (region) => {
		if (selectedOrganization === undefined || selectedOrganization === null) {
			toast.error("Failed to send request for changing region. Please contact support@shuffler.io.")
			return
		}

		const regionToCloudRegion = {
			'US': 'us-west2',
			'EU': 'europe-west3',
			'CA': 'northamerica-northeast1',
			'UK': 'europe-west2',
			'EU-2': 'europe-west3'
		};

		const destinationRegion = regionToCloudRegion[region] || region;

		var data = {
			dst_region: destinationRegion
		}

		toast.info("Sending request for changing region to " + region)

		fetch(`${globalUrl}/api/v1/orgs/${selectedOrganization?.id}/change/region/request`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify(data),
		}).then((response) => {
			if (response.status !== 200) {
				toast.error("Failed to send request for changing region. Please contact support@shuffler.io.")
			} else {
				toast.success("Successfully sent request for region change. We will process the move and contact you shortly.")
			}
		}).catch((err) => {
			console.log(err)
			toast.error("Failed to send request for changing region. Please contact support@shuffler.io.")
		})
	}

	const setSelectedRegion = (region) => {

		// send a POST request to /api/v1/orgs/{org_id}/region with the region as the body
		const regionMap = {
			"US": "us-west2",
			"EU": "europe-west2",
			"CA": "northamerica-northeast1",
			"UK": "europe-west2",
			"EU-2": "europe-west3",
			"AUS": "australia-southeast1"
		  };

		region = regionMap[region] || region;

		var data = {
			dst_region: region
		}

		toast.info("Changing region to " + region + "...This may take a few minutes.")

		fetch(`${globalUrl}/api/v1/orgs/${selectedOrganization.id}/change/region`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify(data),
			timeOut: 1000
		}).then((response) => {
			if (response.status !== 200) {
				response.json().then((reason) => {
					toast.error("Failed to change region: " + reason.reason)
				}).catch((err) => {
					toast.error("Failed to change region")
				});
			}
			else {
				toast("Region changed successfully! Reloading in 5 seconds..")
				// Reload the page in 2 seconds
				setTimeout(() => {
					window.location.reload()
				}, 5000)

			}

			// return responseJson
		})
	}


	const orgSaveButton = (
		<Tooltip title="Save any unsaved data" placement="bottom">
			<Button
				style={{ width: 244, height: 51, display: 'flex', justifyContent: 'center', textTransform: 'capitalize', padding: "16px, 24px, 16px, 24px", borderRadius: 4, backgroundColor: "#ff8544", color: "#1a1a1a", fontSize: 16, }}
				variant="contained"
				color="primary"
				disabled={
					userdata === undefined ||
					userdata === null ||
					userdata.admin !== "true"
				}
				onClick={() =>
					handleEditOrg(
						orgName,
						orgDescription,
						selectedOrganization.id,
						selectedOrganization.image,
						{
							app_download_repo: appDownloadUrl,
							app_download_branch: appDownloadBranch,
							workflow_download_repo: workflowDownloadUrl,
							workflow_download_branch: workflowDownloadBranch,
							notification_workflow: selectedOrganization?.defaults?.notification_workflow,
							documentation_reference: documentationReference,
							workflow_upload_repo: uploadRepo,
							workflow_upload_branch: uploadBranch,
							workflow_upload_username: uploadUsername,
							workflow_upload_token: uploadToken,

							newsletter: !newsletter,
							weekly_recommendations: !weeklyRecommendations,
						},
						{
							sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
							sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
							client_id: selectedOrganization?.sso_config?.client_id,
							client_secret: selectedOrganization?.sso_config?.client_secret,
							openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
							openid_token: selectedOrganization?.sso_config?.openid_token,
							SSORequired: selectedOrganization?.sso_config?.SSORequired,
							auto_provision: selectedOrganization?.sso_config?.auto_provision,
						}
					)
				}
			>
				Save Changes
				{/* <SaveIcon /> */}
			</Button>
		</Tooltip>
	);

	return (
		<div style={{ textAlign: "left", maxWidth: "95%" }}>

			{/*
			<Grid container spacing={3} style={{ textAlign: "left" }}>
				<Grid item xs={12} style={{}}>
					<Typography variant="body1">
						Email settings	
					</Typography>
					<Typography variant="body2" color="textSecondary" style={{marginBottom: 5, }}>	
						Enable or disable email notifications for your organization.
					</Typography>

					<div style={{display: "flex", }}>
					  <ListItemText primary={"Newsletter: "} style={{maxWidth: 90, marginTop: 10, }}/>
					  <Checkbox checked={newsletter} style={{marginTop: 3, }} 
						onChange={(e) => {
							setNewsletter(e.target.checked)
						}}
						disabled={!isCloud}
					  />

					  <ListItemText primary={"Weekly Recommendations: "} style={{marginLeft: 50, marginTop: 10, maxWidth: 225, }}/>
					  <Checkbox checked={weeklyRecommendations} style={{marginTop: 3, }}
						onChange={(e) => {
							setWeeklyRecommendations(e.target.checked)
						}}
						disabled={!isCloud}
					  />
					</div>
				</Grid> 
			</Grid> 
			*/}

			<Grid container spacing={3} style={{ textAlign: "left", marginTop: 5, }}>
				<Grid item xs={12} style={{}}>
					<span>
						<div style={{}}>
							<div style={{ flex: "3", color: "white" }}>
								<div style={{ marginTop: 8, display: "flex" }} />
								<div style={{ display: "flex" }}>
									<div style={{ width: "100%", maxWidth: 434, marginRight: 10 }}>
										Name
										<TextField
											required
											style={{
												flex: "1",
												display: "flex",
												height: 35,
												width: "100%",
												maxWidth: 434,
												marginTop: "5px",
												marginRight: "15px",
												backgroundColor: isEditOrgTab ? "#212121" : theme.palette.inputColor,
											}}
											fullWidth={true}
											placeholder="Name"
											type="name"
											id="standard-required"
											margin="normal"
											variant="outlined"
											value={orgName}
											onBlur={() => {
												if ((orgName !== selectedOrganization?.name) && (orgName !== "")) {
													handleEditOrg(
														orgName,
														orgDescription,
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
															newsletter: !newsletter,
															weekly_recommendations: !weeklyRecommendations,
														},
														{
															sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
															sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
															client_id: selectedOrganization?.sso_config?.client_id,
															client_secret: selectedOrganization?.sso_config?.client_secret,
															openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
															openid_token: selectedOrganization?.sso_config?.openid_token,
															SSORequired: selectedOrganization?.sso_config?.SSORequired,
															auto_provision: selectedOrganization?.sso_config?.auto_provision,
														}
													)
												}
											}}
											onChange={(e) => {
												if (e.target.value.length > 100) {
													toast("Choose a shorter name.");
													return;
												}

												setOrgName(e.target.value);
											}}
											color="primary"
											InputProps={{
												style: {
													color: "white",
													height: "35px",
													fontSize: "1em",
													borderRadius: 4,
												},
												classes: {
													notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
												},
											}}
										/>
									</div>
									{userdata?.support ? (
										<div style={{ alignItems: 'center' }}>
											<div style={{ marginRight: '12px', color: 'white' }}>Status</div>
											<FormControl style={{ width: 220, height: 35 }}>
												<Select
													style={{ minWidth: 220, marginTop: 5, maxWidth: 220, height: 35, borderRadius: 4 }}
													id="multiselect-status"
													multiple
													value={selectedStatus}
													onChange={(event) => { handleStatusChange(event); setSelectedStatus(event.target.value) }}
													input={<OutlinedInput />}
													renderValue={(selected) => selected.join(', ')}
													MenuProps={MenuProps}
												>
													{["contacted", "lead", "demo done", "pov", "customer", "open source", "student", "internal", "creator", "tech partner", "integration partner", "distribution partner", "service partner", "old customer", "old lead"].map((name) => (
														<MenuItem key={name} value={name}>
															<Checkbox checked={selectedStatus.indexOf(name) > -1} />
															<ListItemText primary={name} />
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</div>
									) : null}


									{isCloud ? (
										<div style={{ marginLeft: 13, fontSize: 16, color: "#9E9E9E" }} >
											Change Region
											<RegionChangeModal selectedOrganization={selectedOrganization} setSelectedRegion={setSelectedRegion} userdata={userdata} handleSendChangeRegionMail={handleSendChangeRegionMail} />
										</div>
									) : null}
								</div>
								<div style={{ marginTop: "10px" }} />
								About
								<div style={{ display: "flex" }}>
									<TextField
										required
										multiline
										rows={3}
										style={{
											flex: "1",
											marginTop: "5px",
											marginRight: "15px",
											backgroundColor: isEditOrgTab ? "#212121" : theme.palette.inputColor,
											height: 89,
											borderRadius: 4,
										}}
										fullWidth={true}
										type="name"
										id="outlined-with-placeholder"
										margin="normal"
										variant="outlined"
										placeholder="A description for the organization"
										value={orgDescription}
										onBlur={() => {
											if ((orgDescription !== selectedOrganization?.description) && (orgDescription !== "")) {
												handleEditOrg(
													orgName,
													orgDescription,
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
														newsletter: !newsletter,
														weekly_recommendations: !weeklyRecommendations,
													},
													{
														sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
														sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
														client_id: selectedOrganization?.sso_config?.client_id,
														client_secret: selectedOrganization?.sso_config?.client_secret,
														openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
														openid_token: selectedOrganization?.sso_config?.openid_token,
														SSORequired: selectedOrganization?.sso_config?.SSORequired,
														auto_provision: selectedOrganization?.sso_config?.auto_provision,
													}
												)
											}
										}}
										onChange={(e) => {
											setOrgDescription(e.target.value);
										}}
										InputProps={{
											classes: {
												notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
											},
											style: {
												color: "white",
												height: 89,
												borderRadius: 4,
											},
										}}
									/>
								</div>
								<div>

								</div>
							</div>
							<Typography variant="h5" style={{ color: "rgba(241, 241, 241, 1)", fontSize: 24, fontWeight: 600, marginTop: 40, textAlign: "left" }}>
								Preferences
							</Typography>

							{/*isCloud ? 
								<Chip
									label="Disabled on shuffler.io for now. Contact us for more info"
									color="secondary"
									style={{ marginLeft: 30, height: 30, }}
								/>
							: null*/}
						</div>
						{/*
						<Typography variant="body2" color="textSecondary">
							Add a Workflow that receives notifications from Shuffle when an error occurs in one of your workflows
						</Typography>
						*/}
					</span>
				</Grid>
				<Grid item xs={12}>
					<span>
						<Typography style={{ fontWeight: 400, fontSize: 16 }}>Org Documentation reference</Typography>

						<Typography variant="body2" color="textSecondary" style={{ fontWeight: 400, fontSize: 16, marginTop: 8 }}>
							Add a URL that is added as a link, pointing to any external documentation page you want.
						</Typography>

						<TextField
							required
							style={{
								flex: "1",
								marginTop: "16px",
								marginRight: "15px",
								height: 35,
								fontSize: 16,
								borderRadius: 4,
								backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
							}}
							fullWidth={true}
							type="name"
							id="outlined-with-placeholder"
							margin="normal"
							variant="outlined"
							placeholder="Paste a URL to an external reference for this implementation"
							value={documentationReference}
							onBlur={() => {
								if (documentationReference !== selectedOrganization?.defaults?.documentation_reference) {
									handleEditOrg(
										orgName,
										orgDescription,
										selectedOrganization.id,
										selectedOrganization.image,
										{
											app_download_repo: selectedOrganization?.defaults?.app_download_repo,
											app_download_branch: selectedOrganization?.defaults?.app_download_branch,
											workflow_download_repo: selectedOrganization?.defaults?.workflow_download_repo,
											workflow_download_branch: selectedOrganization?.defaults?.workflow_download_branch,
											notification_workflow: selectedOrganization?.defaults?.notification_workflow,
											documentation_reference: documentationReference,
											workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
											workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
											workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
											workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
											newsletter: !newsletter,
											weekly_recommendations: !weeklyRecommendations,
										},
										{
											sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
											sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
											client_id: selectedOrganization?.sso_config?.client_id,
											client_secret: selectedOrganization?.sso_config?.client_secret,
											openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
											openid_token: selectedOrganization?.sso_config?.openid_token,
											SSORequired: selectedOrganization?.sso_config?.SSORequired,
											auto_provision: selectedOrganization?.sso_config?.auto_provision,
										}
									)
								}
							}}
							onChange={(e) => {
								setDocumentationReference(e.target.value);
							}}
							InputProps={{
								classes: {
									notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
								},
								style: {
									color: "white",

									fontWeight: 400,
									fontSize: 16,
									borderRadius: 4,
									height: 35
								},
							}}
						/>
					</span>
				</Grid>
				<CloudSyncTab
					globalUrl={globalUrl}
					userdata={userdata}
					serverside={false}
				/>
				<Grid item xs={12} style={{ marginTop: 20, }}>
					<Typography variant="h4" style={{ textAlign: "left", color: "rgba(241, 241, 241, 1)", fontSize: 24, fontWeight: 600, }}>Workflow Backup Repository</Typography>
					<Typography variant="body2" style={{ textAlign: "left", marginTop: 8, color: "#9E9E9E", fontSize: 16, fontWeight: 400 }}>
						Decide where workflows are backed up in a Git repository. Will create logs and notifications if upload fails. The repository and branch must already have been initialized. Files will show up in the repo root in the /orgId/workflow-status/workflowId.json format. <b>MSSP:</b> If suborg exists, this will automatically be applied for them as well (not retroactive). <a href="/docs/configuration#environment-variables" style={{ textDecoration: "none", color: "#f86a3e" }} target="_blank">Credentials are encrypted.</a>
					</Typography>
					<Grid container style={{ marginTop: 10, }} spacing={2}>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontWeight: 400, fontSize: 16 }}>Repository for workflow backup</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "8px",
										marginRight: "16px",
										height: 35,
										backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									}}
									fullWidth={true}
									type="name"
									multiline={true}
									rows={1}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									placeholder="Ex: github/com/shuffle/workflowbackup "
									value={uploadRepo}
									onChange={(e) => {
										setUploadRepo(e.target.value);
									}}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: "white",

											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
											height: 35,
										},
									}}
								/>
							</span>
						</Grid>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontWeight: 400, fontSize: 16 }}>Branch</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "8px",
										marginRight: "16px",
										height: 35,
										backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									}}
									fullWidth={true}
									type="name"
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									multiline={true}
									rows={1}
									placeholder="The branch to use for backup of workflows"
									value={uploadBranch}
									onChange={(e) => {
										setUploadBranch(e.target.value);
									}}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: "white",

											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
											height: 35,
										},
									}}
								/>
							</span>
						</Grid>
					</Grid>
					<Grid container style={{ marginTop: 10, }} spacing={2}>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontWeight: 400, fontSize: 16 }}>Username for backup of workflows</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "8px",
										marginRight: "16px",
										height: 35,
										backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									}}
									fullWidth={true}
									type="name"
									multiline={true}
									rows={1}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									placeholder="Enter Username"
									value={uploadUsername}
									onChange={(e) => {
										setUploadUsername(e.target.value);
									}}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: "white",

											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
											height: 35,
										},
									}}
								/>
							</span>
						</Grid>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography style={{ fontWeight: 400, fontSize: 16 }}>Git token/password</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "8px",
										marginRight: "16px",
										height: 35,
										backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									}}
									fullWidth={true}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									multiline={true}
									rows={1}
									placeholder="The token to use for backup of workflows."
									value={uploadToken}
									onChange={(e) => {
										setUploadToken(e.target.value);
									}}
									InputProps={{
										classes: {
											notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
										},
										style: {
											color: "white",

											fontWeight: 400,
											fontSize: 16,
											borderRadius: 4,
											height: 35,
										},
									}}
									type="password"
								/>
							</span>
						</Grid>
					</Grid>
				</Grid>
				{/*isCloud ? null : */}

				{isCloud ? null : (
					<Grid item xs={6} style={{}}>
						<span>
							<Typography>App Download URL</Typography>
							<TextField
								required
								style={{
									flex: "1",
									marginTop: "8px",
									marginRight: "16px",
									height: 35,
									backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
								}}
								fullWidth={true}
								type="name"
								id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder="A description for the organization"
								value={appDownloadUrl}
								onChange={(e) => {
									setAppDownloadUrl(e.target.value);
								}}
								InputProps={{
									classes: {
										notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
									},
									style: {
										color: "white",

										fontWeight: 400,
										fontSize: 16,
										borderRadius: 4,
										height: 35,
									},
								}}
							/>
						</span>
					</Grid>
				)}
				{isCloud ? null : (
					<Grid item xs={6} style={{}}>
						<span>
							<Typography>App Download Branch</Typography>
							<TextField
								required
								style={{
									flex: "1",
									marginTop: "8px",
									marginRight: "15px",
									backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									height: 35,
								}}
								fullWidth={true}
								type="name"
								id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder="A description for the organization"
								value={appDownloadBranch}
								onChange={(e) => {
									setAppDownloadBranch(e.target.value);
								}}
								InputProps={{
									classes: {
										notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
									},
									style: {
										color: "white",

										fontWeight: 400,
										fontSize: 16,
										borderRadius: 4,
										height: 35,
									},
								}}
							/>
						</span>
					</Grid>
				)}
				{isCloud ? null : (
					<Grid item xs={6} style={{}}>
						<span>
							<Typography>Workflow Download URL</Typography>
							<TextField
								required
								style={{
									flex: "1",
									marginTop: "5px",
									marginRight: "15px",
									backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									height: 35,
								}}
								fullWidth={true}
								type="name"
								id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder="A description for the organization"
								value={workflowDownloadUrl}
								onChange={(e) => {
									setWorkflowDownloadUrl(e.target.value);
								}}
								InputProps={{
									classes: {
										notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
									},
									style: {
										color: "white",

										fontWeight: 400,
										fontSize: 16,
										borderRadius: 4,
										height: 35,
									},
								}}
							/>
						</span>
					</Grid>
				)}
				{isCloud ? null : (
					<Grid item xs={6} style={{}}>
						<span>
							<Typography>Workflow Download Branch</Typography>
							<TextField
								required
								style={{
									flex: "1",
									marginTop: "5px",
									marginRight: "15px",
									backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									height: 35,
								}}
								fullWidth={true}
								type="name"
								id="outlined-with-placeholder"
								margin="normal"
								variant="outlined"
								placeholder="A description for the organization"
								value={workflowDownloadBranch}
								onChange={(e) => {
									setWorkflowDownloadBranch(e.target.value);
								}}
								InputProps={{
									classes: {
										notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
									},
									style: {
										color: "white",

										fontWeight: 400,
										fontSize: 16,
										borderRadius: 4,
										height: 35,
									},
								}}
							/>
						</span>
					</Grid>
				)}
				{/*
					<span style={{textAlign: "center"}}>
						{expanded ? 
							<ExpandLessIcon />
							:
							<ExpandMoreIcon />
						}
					</span>
					*/}
			</Grid>
			<div style={{ textalign: "center", marginTop: "20px", display: 'flex', width: '100%', justifyContent: 'center' }}>
				{orgSaveButton}
			</div>
		</div>
	)
}

export default OrgHeaderexpandedNew;

const RegionChangeModal = memo(({ selectedOrganization, setSelectedRegion, userdata, handleSendChangeRegionMail }) => {
	// Show from options: "us-west2", "europe-west2", "europe-west3", "northamerica-northeast1"
	// var regions = ["us-west2", "europe-west2", "europe-west3", "northamerica-northeast1"]
	const regionMapping = {
		"US": "us",
		"EU-2": "eu",
		"CA": "ca",
		"UK": "gb",
		"AUS": "au",
	};

	//let regiontag = "UK";
	let regiontag = "UK";
	let regionCode = "gb";

	const regionsplit = selectedOrganization?.region_url?.split(".");

	if (regionsplit?.length > 2 && !regionsplit[0]?.includes("shuffler")) {
		const namesplit = regionsplit[0]?.split("/");
		regiontag = namesplit[namesplit.length - 1];

		if (regiontag === "california") {
			regiontag = "US";
			regionCode = "us";
		} else if (regiontag === "frankfurt") {
			regiontag = "EU-2";
			regionCode = "eu";
		} else if (regiontag === "ca") {
			regiontag = "CA";
			regionCode = "ca";
		} else if (regiontag === "austrailia") {
			regiontag = "AUS";
			regionCode = "au"
		}
	}

	return (
		<FormControl style={{ display: "flex", flexDirection: "column", marginTop: 5, alignItems: "center" }} >
			{/* <InputLabel id="demo-simple-select-label">Region</InputLabel> */}
			<Select
				labelId="demo-simple-select-label"
				id="demo-simple-select"
				value={regiontag}
				style={{ minWidth: 120, height: 35, borderRadius: 4 }}
				onChange={(e) => {
					// if (userdata?.support) {
					// 	setSelectedRegion(e.target.value)
					// } else {
					// 	handleSendChangeRegionMail(e.target.value)
					// }
					setSelectedRegion(e.target.value)
				}}
			>
				{Object.keys(regionMapping).map((region, index) => {
					const regionImageCode = regionMapping[region];
					// Set the default region if selectedOrganization.region is not set
					if (selectedOrganization.region === undefined) {
						selectedOrganization.region = "europe-west2";
					}

					if (region === "AUS") {
						region = "AUS (test)"
					}

					// Check if the current region matches the selected region
					if (region === selectedOrganization.region) {
						// If the region matches, set the MenuItem as selected
						return (
							<MenuItem value={region} key={index} disabled>
								{/* show region image through cdn */}
								<img src={`https://flagcdn.com/48x36/${regionImageCode}.png`} alt={region} style={{ marginRight: 10 }} />
								{region}
							</MenuItem>
						);
					} else {
						return <MenuItem sx={{ display: 'flex' }} key={index} value={region}>
							<img
								src={`https://flagcdn.com/48x36/${regionImageCode}.png`}
								alt={region}
								style={{ marginRight: 10, width: 20, height: 18, }}
							/>
							{region}
						</MenuItem>;
					}
				})}
			</Select>
		</FormControl>
	);
})
