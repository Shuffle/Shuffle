import React, { useEffect } from "react";

import { makeStyles } from "@mui/styles";
import theme from '../theme.jsx';
import { toast } from "react-toastify"
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import SubflowSuggestions from "../components/SubflowSuggestions.jsx";

import {
	FormControl,
	InputLabel,
	Paper,
	OutlinedInput,
	Checkbox,
	Card,
	Tooltip,
	FormControlLabel,
	Typography,
	Switch,
	Select,
	MenuItem,
	Divider,
	TextField,
	Button,
	Tabs,
	Tab,
	Grid,
	IconButton,
	Autocomplete,
	Dialog,
	DialogTitle,
	DialogActions,
	DialogContent,
	Box
} from "@mui/material";

import {
	ExpandLess as ExpandLessIcon,
	ExpandMore as ExpandMoreIcon,
	Save as SaveIcon,
} from "@mui/icons-material";

const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important",
	},
})

const OrgHeaderexpanded = (props) => {
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
	const defaultBranch = "master";

	const [orgName, setOrgName] = React.useState(selectedOrganization.name);
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
	const [ssoEntrypoint, setSsoEntrypoint] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.sso_entrypoint === undefined ||
				selectedOrganization.sso_config.sso_entrypoint.length === 0
				? ""
				: selectedOrganization.sso_config.sso_entrypoint
	);
	const [ssoCertificate, setSsoCertificate] = React.useState(
		selectedOrganization.sso_config === undefined
			? ""
			: selectedOrganization.sso_config.sso_certificate === undefined ||
				selectedOrganization.sso_config.sso_certificate.length === 0
				? ""
				: selectedOrganization.sso_config.sso_certificate
	);
	const [SSORequired, setSSORequired] = React.useState(selectedOrganization.sso_config === undefined
		? false
		: selectedOrganization.sso_config.SSORequired === undefined
			? false
			: selectedOrganization.sso_config.SSORequired);

	const [notificationWorkflow, setNotificationWorkflow] = React.useState(
		selectedOrganization.defaults === undefined
			? ""
			: selectedOrganization.defaults.notification_workflow === undefined ||
				selectedOrganization.defaults.notification_workflow.length === 0
				? ""
				: selectedOrganization.defaults.notification_workflow
	);

	const [documentationReference, setDocumentationReference] = React.useState(
		selectedOrganization.defaults === undefined
			? ""
			: selectedOrganization.defaults.documentation_reference === undefined ||
				selectedOrganization.defaults.documentation_reference.length === 0
				? ""
				: selectedOrganization.defaults.documentation_reference
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

	const [uploadRepo, setUploadRepo] = React.useState(selectedOrganization.defaults === undefined ? "" : selectedOrganization.defaults.workflow_upload_repo === undefined || selectedOrganization.defaults.workflow_upload_repo.length === 0 ? "" : selectedOrganization.defaults.workflow_upload_repo)
	const [uploadBranch, setUploadBranch] = React.useState(selectedOrganization.defaults === undefined ? defaultBranch : selectedOrganization.defaults.workflow_upload_branch === undefined || selectedOrganization.defaults.workflow_upload_branch.length === 0 ? defaultBranch : selectedOrganization.defaults.workflow_upload_branch)
	const [uploadUsername, setUploadUsername] = React.useState(selectedOrganization.defaults === undefined ? "" : selectedOrganization.defaults.workflow_upload_username === undefined || selectedOrganization.defaults.workflow_upload_username.length === 0 ? "" : selectedOrganization.defaults.workflow_upload_username)
	const [uploadToken, setUploadToken] = React.useState(selectedOrganization.defaults === undefined ? "" : selectedOrganization.defaults.workflow_upload_token === undefined || selectedOrganization.defaults.workflow_upload_token.length === 0 ? "" : selectedOrganization.defaults.workflow_upload_token)

	const [workflows, setWorkflows] = React.useState([])
	const [workflow, setWorkflow] = React.useState({})

	const getAvailableWorkflows = (trigger_index) => {
		fetch(globalUrl + "/api/v1/workflows", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for workflows :O!");
					return;
				}
				return response.json();
			})
			.then((responseJson) => {
				if (responseJson !== undefined) {
					setWorkflows(responseJson)

					if (selectedOrganization.defaults !== undefined && selectedOrganization.defaults.notification_workflow !== undefined) {

						const workflow = responseJson.find((workflow) => workflow.id === selectedOrganization.defaults.notification_workflow)
						if (workflow !== undefined && workflow !== null) {
							setWorkflow(workflow)
						}
					}
				}
			})
			.catch((error) => {
				console.log("Error getting workflows: " + error);
			})
	}

	useEffect(() => {
		getAvailableWorkflows()
	}, [])

	const handleEditOrg = (
		name,
		description,
		orgId,
		image,
		defaults,
		sso_config
	) => {

		const data = {
			name: name,
			description: description,
			org_id: orgId,
			image: image,
			defaults: defaults,
			sso_config: sso_config,
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
	};


	const handleWorkflowSelectionUpdate = (e, isUserinput) => {
		if (e.target.value === undefined || e.target.value === null || e.target.value.id === undefined) {
			console.log("Returning as there's no id")
			return null
		}

		setWorkflow(e.target.value)
		setNotificationWorkflow(e.target.value.id)
		toast("Updated notification workflow. Don't forget to save!")
	}

	const orgSaveButton = (
		<Tooltip title="Save any unsaved data" placement="bottom">
			<div>
				<Button
					style={{ width: 150, height: 55, flex: 1 }}
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
								notification_workflow: notificationWorkflow,
								documentation_reference: documentationReference,
							},
							{
								sso_entrypoint: ssoEntrypoint,
								sso_certificate: ssoCertificate,
								client_id: openidClientId,
								client_secret: openidClientSecret,
								openid_authorization: openidAuthorization,
								openid_token: openidToken,
								SSORequired: SSORequired,
							}
						)
					}
				>
					<SaveIcon />
				</Button>
			</div>
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
            "Failed to test sso. Please try again later or contact support@shuffler.io if issue persist."
          );
          return;
        }
        return response.json();
      })
      .then((responjson) => {
        if (responjson["reason"] === "SSO_REDIRECT") {
          setTimeout(() => {
            toast.info(
              "Redirecting to SSO login page as SSO is required for this organization."
            );
            window.location.href = responjson["url"];
            return;
          }, 2000);
        } else {
          toast.error(
            "No SSO found for this org. Please set up sso for this org."
          );
        }
      })
      .catch((err) => {
        console.log("error for sso test is: ", err);
      })
    }

	return (
		<div style={{ textAlign: "center" }}>
			<Grid container spacing={3} style={{ textAlign: "left" }}>
				<Grid item xs={12} style={{}}>
					<span>
						<Typography>Notification Workflow</Typography>

						{/*
						<SubflowSuggestions
							globalUrl={globalUrl}
							selectedOrganization={selectedOrganization}
							workflows={workflows}
  							notificationWorkflow={notificationWorkflow}
							type={"notification"}
						/>
						*/}


						<div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
							{workflows !== undefined && workflows !== null && workflows.length > 0 ?
								<Autocomplete
									id="notification_workflow_search"
									autoHighlight
									freeSolo
									//autoSelect
									value={workflow}
									classes={{ inputRoot: classes.inputRoot }}
									ListboxProps={{
										style: {
											backgroundColor: theme.palette.inputColor,
											color: "white",
										},
									}}
									getOptionLabel={(option) => {
										if (
											option === undefined ||
											option === null ||
											option.name === undefined ||
											option.name === null
										) {
											return "No Workflow Selected";
										}

										const newname = (
											option.name.charAt(0).toUpperCase() + option.name.substring(1)
										).replaceAll("_", " ");
										return newname;
									}}
									options={workflows}
									fullWidth
									style={{
										backgroundColor: theme.palette.inputColor,
										height: 50,
										borderRadius: theme.palette?.borderRadius,
									}}
									onChange={(event, newValue) => {
										console.log("Found value: ", newValue)

										var parsedinput = { target: { value: newValue } }

										// For variables
										if (typeof newValue === 'string' && newValue.startsWith("$")) {
											parsedinput = {
												target: {
													value: {
														"name": newValue,
														"id": newValue,
														"actions": [],
														"triggers": [],
													}
												}
											}
										}

										handleWorkflowSelectionUpdate(parsedinput)
									}}
									renderOption={(props, data, state) => {
										if (data.id === workflow.id) {
											data = workflow;
										}

										return (
											<Tooltip arrow placement="left" title={
												<span style={{}}>
													{data.image !== undefined && data.image !== null && data.image.length > 0 ?
														<img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette?.borderRadius, }} />
														: null}
													<Typography>
														Choose {data.name}
													</Typography>
												</span>
											} placement="bottom">
												<MenuItem
													style={{
														backgroundColor: theme.palette.inputColor,
														color: data.id === workflow.id ? "red" : "white",
													}}
													value={data}
													onClick={(e) => {
														var parsedinput = { target: { value: data } }
														handleWorkflowSelectionUpdate(parsedinput)
													}}
												>
													{data.name}
												</MenuItem>
											</Tooltip>
										)
									}}
									renderInput={(params) => {
										return (
											<TextField
												style={{
													backgroundColor: theme.palette.inputColor,
													borderRadius: theme.palette?.borderRadius,
												}}
												{...params}
												label="Find a notification workflow"
												variant="outlined"
											/>
										);
									}}
								/>
								:
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: theme.palette.inputColor,
									}}
									fullWidth={true}
									type="name"
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									placeholder="ID of the workflow to receive notifications"
									value={notificationWorkflow}
									onChange={(e) => {
										setNotificationWorkflow(e.target.value);
									}}
									InputProps={{
										classes: {
											notchedOutline: classes.notchedOutline,
										},
										style: {
											color: "white",
										},
									}}
								/>
							}
							<div style={{ minWidth: 150, maxWidth: 150, marginTop: 5, marginLeft: 10, }}>
								{orgSaveButton}
							</div>
						</div>
					</span>
				</Grid>
				<Grid item xs={12} style={{}}>
					<span>
						<Typography>Org Documentation reference</Typography>
						<TextField
							required
							style={{
								flex: "1",
								marginTop: "5px",
								marginRight: "15px",
								backgroundColor: theme.palette.inputColor,
							}}
							fullWidth={true}
							type="name"
							id="outlined-with-placeholder"
							margin="normal"
							variant="outlined"
							placeholder="URL to an external reference for this implementation"
							value={documentationReference}
							onChange={(e) => {
								setDocumentationReference(e.target.value);
							}}
							InputProps={{
								classes: {
									notchedOutline: classes.notchedOutline,
								},
								style: {
									color: "white",
								},
							}}
						/>
					</span>
				</Grid>

				<Grid item xs={12} style={{ marginTop: 50, }}>
					<Typography variant="h4" style={{ textAlign: "left", }}>Workflow Backup Repository</Typography>
					<Typography variant="body2" style={{ textAlign: "left", marginTop: 5, }} color="textSecondary">
						Decide where workflows are backed up in a Git repository. Will create logs and notifications if upload fails. The repository and branch must already have been initialized. Files will show up in the root folder in the format 'status_workflowid.json'
					</Typography>
					<Grid container style={{ marginTop: 10, }} spacing={2}>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography>Repository for workflow backup</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
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
										},
									}}
								/>
							</span>
						</Grid>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography>Branch</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
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
										},
									}}
								/>
							</span>
						</Grid>
					</Grid>
					<Grid container style={{ marginTop: 10, }} spacing={2}>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography>Username</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									}}
									fullWidth={true}
									type="name"
									multiline={true}
									rows={1}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									placeholder="The username to use for backup of workflows"
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
										},
									}}
								/>
							</span>
						</Grid>
						<Grid item xs={6} style={{}}>
							<span>
								<Typography>Git token/password</Typography>
								<TextField
									required
									style={{
										flex: "1",
										marginTop: "5px",
										marginRight: "15px",
										backgroundColor: isEditOrgTab ? "rgba(33, 33, 33, 1)" : theme.palette.inputColor,
									}}
									fullWidth={true}
									id="outlined-with-placeholder"
									margin="normal"
									variant="outlined"
									multiline={true}
									rows={1}
									placeholder="The token to use for backup of workflows. PS: This will be stored in cleartext in the database for now."
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
										},
									}}
									type="password"
								/>
							</span>
						</Grid>
					</Grid>
				</Grid>

				<Typography variant="h4" style={{ marginLeft: 20, paddingTop: 100, borderTop: "1px solid rgba(255, 255, 255, 0.12)", width: "100%", marginTop: 50, }}>
					SSO Configuration
				</Typography>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: 10,
            width: "100%",
          }}
        >
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ margin: "5px 0px 5px 10px" }}
          >
            Make SAML SSO or OpenID Authentication Required or Optional for Your
            Organization.
          </Typography>
          <div>
            <Switch
              checked={SSORequired}
              onChange={toggleBetweenRequiredOrOptional}
              name="onOffSwitch"
              color="primary"
              title="Make SAML SSO or OpenID Authentication Required or Optional for Your Organization"
            />
            {SSORequired ? "Required" : "Optional"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 20,
            marginLeft: 10,
            width: "100%",
            borderBottom: "1px solid #414347",
            paddingBottom: 10,
          }}
        >
          <Typography variant="body1" style={{ margin: "5px 0px 5px 10px" }}>
            You can test your SSO configuration by clicking the button below.
            Before testing, ensure you have set Open ID Connect or SAML SSO
            credentials.
          </Typography>
          <Tooltip
            title={
              !(
                ssoEntrypoint.length > 0 ||
                ssoCertificate.length > 0 ||
                openidAuthorization.length > 0 ||
                openidClientId.length > 0
              )
                ? "Please ensure all SSO credentials are set before testing."
                : ""
            }
          >
            <span style={{ width: 100 }}>
              <Button
                variant="outlined"
                color="primary"
                style={{ width: 100, textTransform: "none", margin: 10 }}
                disabled={
                  !(
                    ssoEntrypoint.length > 0 ||
                    ssoCertificate.length > 0 ||
                    openidAuthorization.length > 0 ||
                    openidClientId.length > 0
                  )
                }
                onClick={HandleTestSSO}
              >
                Test SSO
              </Button>
            </span>
          </Tooltip>
        </div>
        <div></div>
        <Grid item xs={12} style={{}}>
          <Typography variant="h6" style={{ textAlign: "center" }}>
            OpenID connect
          </Typography>
          <Grid container style={{ marginTop: 10 }}>
            <Grid item xs={6} style={{}}>
              <span>
                <Typography>Client ID</Typography>
                <TextField
                  required
                  style={{
                    flex: "1",
                    marginTop: "5px",
                    marginRight: "15px",
                    backgroundColor: theme.palette.inputColor,
                  }}
                  fullWidth={true}
                  type="name"
                  multiline={true}
                  rows={2}
                  disabled={
                    selectedOrganization.manager_orgs !== undefined &&
                    selectedOrganization.manager_orgs !== null &&
                    selectedOrganization.manager_orgs.length > 0
                  }
                  id="outlined-with-placeholder"
                  margin="normal"
                  variant="outlined"
                  placeholder="The OpenID client ID from the identity provider"
                  value={openidClientId}
                  onChange={(e) => {
                    setOpenidClientId(e.target.value);
                  }}
                  InputProps={{
                    classes: {
                      notchedOutline: classes.notchedOutline,
                    },
                    style: {
                      color: "white",
                    },
                  }}
                />
              </span>
            </Grid>
            <Grid item xs={6} style={{}}>
              <span>
                <Typography>Client Secret (optional)</Typography>
                <TextField
                  required
                  style={{
                    flex: "1",
                    marginTop: "5px",
                    marginRight: "15px",
                    backgroundColor: theme.palette.inputColor,
                  }}
                  fullWidth={true}
                  type="name"
                  multiline={true}
                  rows={2}
                  disabled={
                    selectedOrganization.manager_orgs !== undefined &&
                    selectedOrganization.manager_orgs !== null &&
                    selectedOrganization.manager_orgs.length > 0
                  }
                  id="outlined-with-placeholder"
                  margin="normal"
                  variant="outlined"
                  placeholder="The OpenID client secret - DONT use this if dealing with implicit auth / PKCE"
                  value={openidClientSecret}
                  onChange={(e) => {
                    setOpenidClientSecret(e.target.value);
                  }}
                  InputProps={{
                    classes: {
                      notchedOutline: classes.notchedOutline,
                    },
                    style: {
                      color: "white",
                    },
                  }}
                />
              </span>
            </Grid>
          </Grid>
          <Grid container style={{ marginTop: 10 }}>
            <Grid item xs={6} style={{}}>
              <span>
                <Typography>Authorization URL</Typography>
                <TextField
                  required
                  style={{
                    flex: "1",
                    marginTop: "5px",
                    marginRight: "15px",
                    backgroundColor: theme.palette.inputColor,
                  }}
                  fullWidth={true}
                  type="name"
                  id="outlined-with-placeholder"
                  margin="normal"
                  variant="outlined"
                  multiline={true}
                  rows={2}
                  placeholder="The OpenID authorization URL (usually ends with /authorize)"
                  value={openidAuthorization}
                  onChange={(e) => {
                    setOpenidAuthorization(e.target.value);
                  }}
                  InputProps={{
                    classes: {
                      notchedOutline: classes.notchedOutline,
                    },
                    style: {
                      color: "white",
                    },
                  }}
                />
              </span>
            </Grid>
            <Grid item xs={6} style={{}}>
              <span>
                <Typography>Token URL</Typography>
                <TextField
                  required
                  style={{
                    flex: "1",
                    marginTop: "5px",
                    marginRight: "15px",
                    backgroundColor: theme.palette.inputColor,
                  }}
                  fullWidth={true}
                  type="name"
                  id="outlined-with-placeholder"
                  margin="normal"
                  variant="outlined"
                  multiline={true}
                  rows={2}
                  placeholder="The OpenID token URL (usually ends with /token)"
                  value={openidToken}
                  onChange={(e) => {
                    setOpenidToken(e.target.value);
                  }}
                  InputProps={{
                    classes: {
                      notchedOutline: classes.notchedOutline,
                    },
                    style: {
                      color: "white",
                    },
                  }}
                />
              </span>
            </Grid>
          </Grid>
        </Grid>
        {/* } */}
        {/*isCloud ? null : */}
        <Grid item xs={12} style={{ marginTop: 50 }}>
          <Typography variant="h6" style={{ textAlign: "center" }}>
            SAML SSO (v1.1)
          </Typography>
          <Grid container style={{ marginTop: 20 }}>
            <Grid item xs={6} style={{}}>
              <span>
                <Typography>SSO Entrypoint (IdP)</Typography>
                <TextField
                  required
                  style={{
                    flex: "1",
                    marginTop: "5px",
                    marginRight: "15px",
                    backgroundColor: theme.palette.inputColor,
                  }}
                  fullWidth={true}
                  type="name"
                  multiline={true}
                  rows={2}
                  disabled={
                    selectedOrganization.manager_orgs !== undefined &&
                    selectedOrganization.manager_orgs !== null &&
                    selectedOrganization.manager_orgs.length > 0
                  }
                  id="outlined-with-placeholder"
                  margin="normal"
                  variant="outlined"
                  placeholder="The entrypoint URL from your provider"
                  value={ssoEntrypoint}
                  onChange={(e) => {
                    setSsoEntrypoint(e.target.value);
                  }}
                  InputProps={{
                    classes: {
                      notchedOutline: classes.notchedOutline,
                    },
                    style: {
                      color: "white",
                    },
                  }}
                />
              </span>
            </Grid>
            <Grid item xs={6} style={{}}>
              <span>
                <Typography>SSO Certificate (X509)</Typography>
                <TextField
                  required
                  style={{
                    flex: "1",
                    marginTop: "5px",
                    marginRight: "15px",
                    backgroundColor: theme.palette.inputColor,
                  }}
                  fullWidth={true}
                  type="name"
                  id="outlined-with-placeholder"
                  margin="normal"
                  variant="outlined"
                  multiline={true}
                  rows={2}
                  placeholder="The X509 certificate to use"
                  value={ssoCertificate}
                  onChange={(e) => {
                    setSsoCertificate(e.target.value);
                  }}
                  InputProps={{
                    classes: {
                      notchedOutline: classes.notchedOutline,
                    },
                    style: {
                      color: "white",
                    },
                  }}
                />
              </span>
            </Grid>
          </Grid>
          {isCloud ? (
            <Typography
              variant="body2"
              style={{ textAlign: "left" }}
              color="textSecondary"
            >
              IdP URL for Shuffle: https://shuffler.io/api/v1/login_sso
            </Typography>
          ) : null}
        </Grid>
        {isCloud ? null : (
          <Grid item xs={6} style={{}}>
            <span>
              <Typography>App Download URL</Typography>
              <TextField
                required
                style={{
                  flex: "1",
                  marginTop: "5px",
                  marginRight: "15px",
                  backgroundColor: theme.palette.inputColor,
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
                    notchedOutline: classes.notchedOutline,
                  },
                  style: {
                    color: "white",
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
                  marginTop: "5px",
                  marginRight: "15px",
                  backgroundColor: theme.palette.inputColor,
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
                    notchedOutline: classes.notchedOutline,
                  },
                  style: {
                    color: "white",
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
                  backgroundColor: theme.palette.inputColor,
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
                    notchedOutline: classes.notchedOutline,
                  },
                  style: {
                    color: "white",
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
                  backgroundColor: theme.palette.inputColor,
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
                    notchedOutline: classes.notchedOutline,
                  },
                  style: {
                    color: "white",
                  },
                }}
              />
            </span>
          </Grid>
        )}

        <div
          style={{
            margin: "auto",
            textalign: "center",
            marginTop: 15,
            marginBottom: 15,
          }}
        >
          {orgSaveButton}
        </div>
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
    </div>
  );
};

export default OrgHeaderexpanded;
