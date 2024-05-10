import React, { useEffect } from "react";

import { makeStyles } from "@mui/styles";
import theme from '../theme.jsx';
import { toast } from "react-toastify"
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import AuthenticationData  from "./AuthenticationWindow";

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
});

const OrgHeaderexpanded = (props) => {
  const {
    userdata,
    selectedOrganization,
    setSelectedOrganization,
    globalUrl,
    isCloud,
		adminTab,
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

  const [workflows, setWorkflows] = React.useState([])
  const [workflow, setWorkflow] = React.useState({})

  //   notification workflow
	const [notificationWorkflowModal, setNotificationWorkflowModal] = React.useState(false);
	const [selectedAppDetails, setSelectedAppDetails] = React.useState({});
	const [notificationWorkflowTestModal, setNotificationWorkflowTestModal] = React.useState(false);
	const [selectedAuth, setSelectedAuth] = React.useState('');
	const [emailData,setEmailData] = React.useState([]);
	const [notificationAppDetails, setNotificationAppDetails] = React.useState([]);
	const [generatedWorkflow, setGeneatedWorkflow] = React.useState({});


	// for jira & email modal
	const [textFieldValue, setTextFieldValue] = React.useState("");
	const [textFieldOneValue, setTextFieldOneValue] = React.useState("");

	useEffect(() => {
		let nameList = notificationAppList.length > 0? notificationAppList.map(item => item.name): ["email"];
		prepareNotificationAppList(nameList)
	  }, [notificationAppList,workflows]);

  const  getAvailableWorkflows =  (trigger_index) => {
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
            }
          )
        }
      >
        <SaveIcon />
      </Button>
	  </div>
    </Tooltip>
  );

  const getAppIDs = async (appList) => {
	fetch(globalUrl + "/api/v1/apps", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		credentials: "include",
	}).then((response) => {
			if (response.status !== 200) {
				toast("Failed getting app ids: ", response.reason);
				console.log("Status not 200 for app ids :O!");
				return;
			}
			return response.json();
		}).then((responseJson) => {
			if (responseJson !== undefined) {
				// console.log("App ids: ", responseJson)
				// console.log("App list: ", appList)
				const filteredApps = responseJson.filter(app => appList.includes(app.name));
    			const appDetails = filteredApps.map(app => ({ name: app.name, id: app.id }));
				return appDetails
				// console.log("App IDs: ", appDetails)
			}
		}).catch((error) => {
			console.log("Error getting app ids: " + error);
		})
}

  // getting comms & cases app from app framework
	var notificationAppList = [];
	if (selectedOrganization.security_framework.cases && selectedOrganization.security_framework.cases.name.length > 0) {
	notificationAppList = notificationAppList.concat(selectedOrganization.security_framework.cases);
	}
	if (selectedOrganization.security_framework.communication && selectedOrganization.security_framework.communication.name.length > 0) {
	notificationAppList = notificationAppList.concat(selectedOrganization.security_framework.communication);
	}

	const mergeAuthData = (result, responseJson) => {
		const updatedResult = result.map(item => {
		  const matches = responseJson.filter(authItem => authItem.app.name === item.name);
		  return {
			...item,
			authentication_data: matches.length > 0 ? matches : null
		  };
		});
		return updatedResult;
	  };	  

	const prepareNotificationAppList = async (appList) => {
		// getting App ID,Authentication fields and saved auths for each app
		var result = []
			fetch(globalUrl + "/api/v1/apps", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				credentials: "include",
			}).then((response) => {
				if (response.status !== 200) {
					toast("Failed getting app ids: ", response.reason);
					console.log("Status not 200 for app ids :O!");
					return;
				}
				return response.json();
			}).then((responseJson) => {
				if (responseJson !== undefined) {
					const filteredApps = responseJson.filter(app => appList.includes(app.name));
					const emailData = responseJson.filter(app => app.name === "email")
					setEmailData(emailData)
					const appDetails = filteredApps.map(app => ({ name: app.name, id: app.id })); //mapped apps with IDs as sometime Ids were not correct in security framework
					// console.log("appDetails: ", appDetails)
					// result = appDetails

					fetch(globalUrl + "/api/v1/apps/authentication", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						credentials: "include",
					})
						.then((response) => {
							if (response.status !== 200) {
								toast(`Failed getting auth for : `, response.reason);
								console.log("Status not 200 for app auth :O!");
								return;
							}
							return response.json();
						}).then(async (responseJson) => {
							if (!responseJson.success) {
								console.log("Could not get app auth")
								return;
							}
							// console.log("responseJson of auth: ", responseJson.data)
							result = await mergeAuthData(appDetails, responseJson.data)
							// console.log("merged auth data: ", result)
							// console.log("result", result)
							result.map(item => {
								fetch(globalUrl + `/api/v1/apps/${item.id}/config`, {
									method: "GET",
									headers: {
										"Content-Type": "application/json",
										Accept: "application/json",
									},
									credentials: "include",
								}).then((response) => {
									if (response.status !== 200) {
										toast(`Failed getting config for ${item.id}: `, response.reason);
										console.log("Status not 200 for app config :O!");
										return;
									}
									return response.json();
								}).then((responseJson) => {
									if (!responseJson.success) {
										console.log("Could not get app config")
										return;
									}
									var decodedString = JSON.parse(atob(responseJson.app));
									// console.log("dcodedString: ",decodedString)
									item.auth_config = decodedString.authentication
									item.large_image = decodedString.large_image
									setNotificationAppDetails(result)
									console.log("notificationAppDetails: ", notificationAppDetails)
								}).then(async()=>{
									await checkIfAlreadyGenerated(appList,workflows);
									
								}).catch((error) => {
									console.log("Error getting app config: " + error);
									toast("Error getting app config: " + error);
								})
							})
						})
				}
			}).catch((error) => {
				console.log("Error getting app ids: " + error);
			})		
	}


  const executeTestWorkflow = async (workflowid) => {
	const data = { "execution_argument": '{"title":"THIS IS TEST ALERT","description":"TEST ALERT FROM SHUFFLE","reference_url": "shuffler.io"}' }
	fetch(globalUrl + `/api/v1/workflows/${workflowid}/execute`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(data),
		credentials: "include",
	})
		.then((response) => {
			if (response.status !== 200) {
				toast("Failed setting notification workflow: ", response.reason);
				console.log("Status not 200 for workflows :O!");
				return;
			}
			toast("Notification workflow ran successfully");
			return response.json();
		}).catch((error) => {
			console.log("Error getting workflows: " + error);
		})
}

const generateNotificationWorkflow = async (appname,appImage,appAuthId,projectId,issuetype) => {
	//currently only supports JIRA figure out a way to support more apps
	var workflowName = `[GENERATED] ${appname} notification workflow`
	var workflowDescription = "Generated by Shuffle for sending info/error notifications."
	var data = {
		"name": workflowName,
		"description": workflowDescription,
	}

	fetch(globalUrl + "/api/v1/workflows", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(data),
		credentials: "include",
	})
		.then((response) => {
			if (response.status !== 200) {
				toast("Failed setting notification workflow: ", response.reason);
				console.log("Status not 200 for workflows :O!");
				return;
			}
			return response.json();
		}).then((responseJson)=>{
			if (responseJson !== undefined) {
				console.log("Notification workflow created successfully")
				var workflow_id = responseJson.id
				if (appname.toLowerCase() === "jira"){
					console.log("updating workflow for JIRA")
					var workflowBody = {
						"name": workflowName,
						"Description": workflowDescription,
						"id": workflow_id,
						"actions": [
							{
								"app_name": "Jira",
								"name": "post_create_issue",
								"authentication_id":appAuthId,
								"large_image":appImage,
								"isStartNode": true,
								"label": "create_issue",
								"app_version": "1.1.0",
								"parameters": [
									{
										"name": "body",
										"value": `{"fields": { "project": {"key": "${projectId}"},"summary": "$exec.title","issuetype": {"name": "${issuetype}"},"description": {"content": [{"content":[{"type":"text","text":"$exec.description"}],"type": "paragraph"}],"type": "doc","version": 1}}}`
									},
									{
										"name": "username_basic",
										"value": ""
									},
									{
										"name": "password_basic",
										"value": ""
									},
									{
										"name": "url",
										"value": ""
									},
									{
										"name": "headers",
										"value": "Content-type=application/json \nAccept=application/json"
									},
									{
										"name": "queries",
										"value": ""
									},
									{
										"name": "ssl_verify",
										"value": "False"
									}
								]
							}
						]
					}
				} 
				fetch(globalUrl + `/api/v1/workflows/${workflow_id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(workflowBody),
					credentials: "include",
				})
					.then((response) => {
						if (response.status !== 200) {
							toast("Failed setting notification workflow: ", response.reason);
							console.log("Status not 200 for workflows :O!");
							return;
						}
						return response.json();
					}).then((responseJson)=>{
						if (responseJson !== undefined) {
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
									notification_workflow: workflow_id,
									documentation_reference: documentationReference,
								},
								{
									sso_entrypoint: ssoEntrypoint,
									sso_certificate: ssoCertificate,
									client_id: openidClientId,
									client_secret: openidClientSecret,
									openid_authorization: openidAuthorization,
									openid_token: openidToken,
								}
							)
							console.log("Notification workflow updated successfully")
							toast("Notification workflow updated successfully")
						}
					})
			}
		}).catch((error) => {
			console.log("Error setting workflows: " + error);
		})
}

const generateEmailNotificationWorkflow = async (appname,appImage,shuffleAPIKey,recepients) => {
	//currently only supports  figure out a way to support more apps
	var workflowName = `[GENERATED] ${appname} notification workflow`
	var workflowDescription = "Generated by Shuffle for sending info/error notifications."
	var data = {
		"name": workflowName,
		"description": workflowDescription,
	}

	fetch(globalUrl + "/api/v1/workflows", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(data),
		credentials: "include",
	})
		.then((response) => {
			if (response.status !== 200) {
				toast("Failed setting notification workflow: ", response.reason);
				console.log("Status not 200 for workflows :O!");
				return;
			}
			return response.json();
		}).then((responseJson)=>{
			if (responseJson !== undefined) {
				console.log("Notification workflow created successfully")
				var workflow_id = responseJson.id
				if (appname.toLowerCase() === "email"){
					console.log("updating workflow for email")
					var workflowBody = {
						"name": workflowName,
						"Description": workflowDescription,
						"id": workflow_id,
						"actions": [
							{
								"app_name": "email",
								"name": "send_email_shuffle",
								"large_image":appImage,
								"isStartNode": true,
								"label": "send_email_shuffle",
								"app_version": "1.3.0",
								"parameters": [
									{
										"name": "apikey",
										"value": shuffleAPIKey
									},
									{
										"name": "recipients",
										"value": recepients
									},
									{
										"name": "subject",
										"value": "$exec.title"
									},
									{
										"name":"body",
										"value":"$exec.description"
									}
								]
							}
						]
					}
				} 
				fetch(globalUrl + `/api/v1/workflows/${workflow_id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(workflowBody),
					credentials: "include",
				})
					.then((response) => {
						if (response.status !== 200) {
							toast("Failed setting notification workflow: ", response.reason);
							console.log("Status not 200 for workflows :O!");
							return;
						}
						return response.json();
					}).then((responseJson)=>{
						if (responseJson !== undefined) {
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
									notification_workflow: workflow_id,
									documentation_reference: documentationReference,
								},
								{
									sso_entrypoint: ssoEntrypoint,
									sso_certificate: ssoCertificate,
									client_id: openidClientId,
									client_secret: openidClientSecret,
									openid_authorization: openidAuthorization,
									openid_token: openidToken,
								}
							)
							console.log("Notification workflow updated successfully")
							toast("Notification workflow updated successfully")
						}
					})
			}
		}).catch((error) => {
			console.log("Error setting workflows: " + error);
		})
}


const testWorkflowModal = notificationWorkflowTestModal ?
	(<Dialog
		open={notificationWorkflowTestModal}
		PaperProps={{
			style: {
				backgroundColor: theme.palette.surfaceColor,
				color: "white",
				minWidth: 500,
			},
		}}
		onClose={() => {
			setNotificationWorkflowTestModal(false);
		}}
	>
		<FormControl>
			{/* <DialogTitle>
		  <div style={{ color: "rgba(255,255,255,0.9)" }}>
			Notification workflow
		  </div>
		</DialogTitle> */}
			<DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
				We have updated the Notification workflow. Do you want to test it?
			</DialogContent>
			<DialogActions>
				<Button
					style={{ borderRadius: "0px" }}
					onClick={() => {
						setNotificationWorkflowTestModal(false);
					}}
					color="primary"
				>
					No
				</Button>
				<Button
					variant="contained"
					style={{ borderRadius: "0px" }}
					onClick={() => {
						executeTestWorkflow(selectedOrganization.defaults.notification_workflow);
						setNotificationWorkflowTestModal(false);
					}}
					color="primary"
				>
					Yes
				</Button>
			</DialogActions>
		</FormControl>
	</Dialog>) : null

const modalView = notificationWorkflowModal ? (
	<Dialog
		open={notificationWorkflowModal}
		PaperProps={{
			style: {
				backgroundColor: theme.palette.grey,
				minWidth: 500,
			},
		}}
		onClose={() => {
			setNotificationWorkflowModal(false);
		}}
	>
		<FormControl>
			<DialogTitle>
				<div style={{ color: "rgba(255,255,255,0.9)" }}>
					{`Configure ${selectedAppDetails.name} workflow`}
				</div>
			</DialogTitle>
			<DialogContent style={{ color: "rgba(255,255,255,0.65)", overflowY: 'auto', maxHeight: '450px' }}>
				<Divider style={{ marginBottom: '1em', backgroundColor: 'rgba(255,255,255,0.12)' }} />
				{console.log("len Selected app details: ", selectedAppDetails)}
				{(selectedAppDetails.authentication_data || (selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false) || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false)) ?
					<>
						<Box mb={2}>
							{(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false)) ? "No authentication required":
							<>
							<Typography variant="body1" style={{ marginBottom: '0.5rem' }}>
								Pick an authentication method from the list
							</Typography>
							<FormControl fullWidth style={{ marginBottom: 10 }}>
								<InputLabel id="demo-simple-select-label">Available authentications</InputLabel>
								<Select
									labelId="demo-simple-select-label"
									id="demo-simple-select"
									value={selectedAuth}
									disabled = {(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false))} 
									onChange={(event) => {setSelectedAuth(event.target.value)
										console.log("event.target.value: ",event.target.value)
										console.log("Selected auth: ", selectedAuth)
									}}
									label="Available authentications"
									required={true}
								>
									{(selectedAppDetails.auth_config && selectedAppDetails.auth_config.required == false || (selectedAppDetails.authentication && selectedAppDetails.authentication.required == false))  ?  "No authentication required" : selectedAppDetails.authentication_data.map((option) => (
										<MenuItem key={option.id} value={option.id}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
												<Chip label={option.app.app_version} variant="outlined" />
												{option.label}
											</div>
										</MenuItem>))}
								</Select>
							</FormControl></>}
						</Box>
						<Box mt={2}>
							<Typography variant="body1">
								Provide additional required details:
							</Typography>
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
								placeholder={ selectedAppDetails.name.toLowerCase() === "jira" ? "Project key" : "Shuffle API key"}
								// value={webhookInputValue}
								onChange={(e) => {
									setTextFieldOneValue(e.target.value)
								}}
								InputProps={{
									classes: {
										notchedOutline: classes.notchedOutline,
									},
									style: {
										color: "white",
									},
								}} />
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
								placeholder={selectedAppDetails.name.toLowerCase() === "jira" ? "Issue type" : "Recepients (comma separated)"}
								// value={webhookInputValue}
								onChange={(e) => {
									setTextFieldValue(e.target.value)
								}}
								InputProps={{
									classes: {
										notchedOutline: classes.notchedOutline,
									},
									style: {
										color: "white",
									},
								}} />			
						</Box>
					</> : 
					<>
					<AuthenticationData
						app={selectedAppDetails}
						// globalUrl={globalUrl}
						authenticationModalOpen={(selectedAppDetails.authentication_data && selectedAppDetails.authentication_data.length > 0) ? false : true}
						// // setAuthenticationModalOpen={false}
						selectedApp={{...selectedAppDetails,authentication: selectedAppDetails.auth_config}}
						// getAppAuthentication={selectedAppDetails.name}
					/>
					</>
				}
			</DialogContent>
			<DialogActions>
				<Button
					style={{ borderRadius: "0px" }}
					onClick={() => {
						setNotificationWorkflowModal(false);
					}}
					color="primary"
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					style={{ borderRadius: "0px" }}
					// disabled={(authOptions.length > 0 ? false : true) || !notificationWorkflowModalValid}
					onClick={async () => {
						// var workflowUpdate = await setTeamsWorkflow(webhookInputValue)
						console.log("Selectedappdetails: ", selectedAppDetails)
						selectedAppDetails.name == "email" ? generateEmailNotificationWorkflow(selectedAppDetails.name, selectedAppDetails.large_image,textFieldOneValue, textFieldValue) :
						generateNotificationWorkflow(selectedAppDetails.name, selectedAppDetails.large_image,selectedAuth, textFieldOneValue, textFieldValue)
						setNotificationWorkflowModal(false);
					}}
					color="primary"
				>
					Submit
				</Button>
			</DialogActions>
		</FormControl>
	</Dialog >
) : null


	const checkIfAlreadyGenerated = async (appList, workflows) => { // fixxxxxxxxxxxxxxxxxxxxx	

		var workflowName = workflows.find(workflow => workflow.id === notificationWorkflow)
		if (workflowName) {
			workflowName = workflowName.name
		}
		else {
			console.log("no workflow set")
			return
		}
		if (workflowName) {
			const parts = workflowName.split(' ');
			console.log("parts", parts)
			if (parts[0].toString() === "[GENERATED]" && parts.length > 1) {
				console.log("parts1", parts[1])
				if ((appList.includes(parts[1]))) {
					console.log("workflow already generated")
					setGeneatedWorkflow({"app_name": parts[1]})
				}
			}
		}
		else {
			return
		}
	}

const renderChips = (apps) => {
	return (
		<Stack direction="row" spacing={1}>
			{apps.map((app) => (
				<Chip
					key={app.id}
					label={app.name}
					variant={generatedWorkflow.app_name === app.name? "filled":"outlined"}
					disabled={generatedWorkflow.app_name === app.name ? true:false}
					onClick={() => {
						console.log(`Clicked ${app.name}`)
						console.log("app: ",app)
						setSelectedAppDetails(app)
						if (app.authentication_data && app.authentication_data.length > 0){ //fixxxxxxxx
							console.log("authdata: ",app.authentication_data[0])
							setSelectedAuth(app.authentication_data[app.authentication_data.length-1].id)
						}
						setNotificationWorkflowModal(true)
						// getAppAuth(app.name)
						console.log("selectedAppDEtails",selectedAppDetails)
					}}
					avatar={<img src={app.large_image} alt={app.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />}

				/>
			))}
		</Stack>
	);
};

	return (
		<div style={{ textAlign: "center" }}>
			<Grid container spacing={3} style={{ textAlign: "left" }}>
				<Grid item xs={12} style={{}}>
					<span>
						<Typography>Notification Workflow</Typography>
						{modalView}
					{/*{testWorkflowModal} */}
					<div style={{ marginBottom: '10px' }}>
						{renderChips(notificationAppDetails.length > 0 ? notificationAppDetails : emailData)}
					</div>
						<div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
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
                				    borderRadius: theme.palette.borderRadius,
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
                				            <img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette.borderRadius, }} />
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
                				          borderRadius: theme.palette.borderRadius,
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
						<div style={{minWidth: 150, maxWidth: 150, marginTop: 5, marginLeft: 10,  }}>
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
				{isCloud ? null : 
				<Grid item xs={12} style={{marginTop: 50 }}>
					<Typography variant="h4" style={{textAlign: "center",}}>OpenID connect</Typography>
					<Grid container style={{marginTop: 10, }}>
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
					<Grid container style={{marginTop: 10, }}>
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
										setOpenidAuthorization(e.target.value)
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
										setOpenidToken(e.target.value)
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
				}
				{/*isCloud ? null : */}
				<Grid item xs={12} style={{marginTop: 50,}}>
					<Typography variant="h4" style={{textAlign: "center",}}>SAML SSO (v1.1)</Typography>
					<Grid container style={{marginTop: 20, }}>
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
					{isCloud ? 
						<Typography variant="body2" style={{textAlign: "left",}} color="textSecondary">
							IdP URL for Shuffle: https://shuffler.io/api/v1/login_sso
						</Typography>
					: null}
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

				<div style={{ margin: "auto", textalign: "center", marginTop: 15, marginBottom: 15, }}>
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
	)
}

export default OrgHeaderexpanded;
