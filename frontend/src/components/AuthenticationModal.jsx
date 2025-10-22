import React, { useState, useEffect, useContext, memo } from "react";
import { CodeHandler, Img, OuterLink, } from '../views/Docs.jsx'
import { getTheme } from "../theme.jsx";
import { isMobile } from "react-device-detect"
import Markdown from "react-markdown";
import { Context } from '../context/ContextApi.jsx';
import PaperComponent from "../components/PaperComponent.jsx";
import { toast } from "react-toastify";
import { v4 as uuidv4} from "uuid";
import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";

import {
    Edit as EditIcon,
	DragIndicator as DragIndicatorIcon,
	Close as CloseIcon,
	LockOpen as LockOpenIcon,
} from "@mui/icons-material";

import {
	Button,
	Typography,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	MenuItem,
	Select,
	TextField,
	IconButton,
	Tooltip,
	Divider,
} from "@mui/material";

const AuthenticationModal = (props) => { 
	const {
		globalUrl,
		userdata, 

		selectedAppData, 
		getAppAuthentication, 
		appAuthentication, 
		setSelectedAction, 

		selectedMeta, 
		setSelectedMeta,

		setAppAuthentication,
	} = props;

  	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "migration.shuffler.io";
    const [selectedAuthentication, setSelectedAuthentication] = React.useState({});
	const [authenticationModalOpen, setAuthenticationModalOpen] = React.useState(false);
	const [authenticationType, setAuthenticationType] = React.useState({})

    const [appid, setAppId] = useState("")

    //const [appAuthentication, setAppAuthentication] = useState([]);

  	const { themeMode, supportEmail, brandColor } = useContext(Context)
	const theme = getTheme(themeMode, brandColor)

	useEffect(() => { 
		if (selectedAppData === undefined || selectedAppData === null || Object.getOwnPropertyNames(selectedAppData).length === 0) {
			return
		}

		if (selectedAppData.authentication === undefined || selectedAppData.authentication === null) {
		  setAuthenticationType({
			  type: "",
		  })

		  selectedAppData.authentication = {
			type: "",
			required: false,
		  }
		} else {
		  setAuthenticationType(
			selectedAppData.authentication.type === "oauth2-app" || (selectedAppData.authentication.type === "oauth2" && selectedAppData.authentication.redirect_uri !== undefined && selectedAppData.authentication.redirect_uri !== null) ? {
			type: selectedAppData.authentication.type,
			redirect_uri: selectedAppData.authentication.redirect_uri,
			refresh_uri: selectedAppData.authentication.refresh_uri,
			token_uri: selectedAppData.authentication.token_uri,
			scope: selectedAppData.authentication.scope,
			client_id: selectedAppData.authentication.client_id,
			client_secret: selectedAppData.authentication.client_secret,
			grant_type: selectedAppData.authentication.grant_type,
		  } : {
			type: "",
		  }
		  )
		}
	}, [selectedAppData])

	if (selectedAppData === undefined || selectedAppData === null || Object.getOwnPropertyNames(selectedAppData).length === 0) {
		console.log("No app data for authentication modal");
		return null
	}

	if (authenticationModalOpen === false) {
		return (
			<Button
				fullWidth
				variant="contained"
				style={{
					marginBottom: 20, 
					marginTop: 20, 
					flex: 1,
					textTransform: "none",
					textAlign: "left",
					justifyContent: "flex-start",
					backgroundColor: "#ffffff",
					color: "#2f2f2f",
					borderRadius: theme.palette?.borderRadius,
					minWidth:  275, 
					maxWidth: 275,
					maxHeight: 50,
					overflow: "hidden",
					border: `1px solid ${theme.palette.inputColor}`,
				}}
				color="primary"
				fullWidth
				onClick={() => {
					setAppId(selectedAppData?.id)
					setAuthenticationModalOpen(true)
				}}
				color="primary"
			>
				<span style={{display: "flex"}}>
					<img
						alt={selectedAppData?.name}
						style={{ margin: 4, minHeight: 30, maxHeight: 30, borderRadius: theme.palette?.borderRadius, }}
						src={selectedAppData?.large_image}
					/>
					<Typography style={{ margin: 0, marginLeft: 10, marginTop: 8, color: "#2f2f2f",}} variant="body1">
						Authenticate {selectedAppData?.name?.replaceAll("_", " ", -1)}
					</Typography>
				</span>
			</Button>
		)
	}

    function Heading(props) {
      const element = React.createElement(
        `h${props.level}`,
        { style: { marginTop: 40 } },
        props.children
      );
      return (
        <Typography>
          {props.level !== 1 ? (
            <Divider
              style={{
                width: "90%",
                marginTop: 40,
                backgroundColor: theme.palette.inputColor,
              }}
            />
          ) : null}
          {element}
        </Typography>
      );
    }

    const UpdateAppAuthentication = (data) => {
      if (data === undefined || data === null) {
        return;
      }

      const filteredData = data.filter((appAuth) => appAuth?.app?.id === appid);
      if (filteredData.length === 0) {
        setAppAuthentication([]);
        setSelectedAuthentication({});
      } else {
        setAppAuthentication(filteredData);
        setSelectedAuthentication(filteredData[0]); 
      }
    };

    const HandleAppAuthentication = () => {

      const url = `${globalUrl}/api/v1/apps/authentication`;

      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }).then((response) => {
        if (response.status !== 200) {
          return;
        }
        return response.json();
      }).then((responseJson) => {
        if (responseJson.success === true) {
          UpdateAppAuthentication(responseJson.data);
        } else {
          toast.error("Failed to get app authentication data");
        }
      }).catch((error) => {
        console.error("error for app is :", error);
      });
    }

	const AuthenticationData = (props) => {
		const selectedApp = props.app;

		const [authenticationOption, setAuthenticationOptions] = React.useState({
		  app: JSON.parse(JSON.stringify(selectedApp)),
		  fields: {},
		  label: "",
		  usage: [
			{
			  // workflow_id: workflow.id,
			},
		  ],
		  id: uuidv4(),
		  active: true,
		});

		if (
		  selectedApp.authentication === undefined ||
		  selectedApp.authentication.parameters === null ||
		  selectedApp.authentication.parameters === undefined ||
		  selectedApp.authentication.parameters.length === 0
		) {
		  return (
			<DialogContent style={{ textAlign: "center", marginTop: 50 }}>
			  <Typography variant="h4" id="draggable-dialog-title" style={{ cursor: "move", }}>
				{selectedApp.name} does not require authentication
			  </Typography>
			</DialogContent>
		  );
		}

		authenticationOption.app.actions = [];

		for (let paramkey in selectedApp.authentication.parameters) {
		  if (
			authenticationOption.fields[
			selectedApp.authentication.parameters[paramkey].name
			] === undefined
		  ) {
			authenticationOption.fields[
			  selectedApp.authentication.parameters[paramkey].name
			] = "";
		  }
		}
    
		const setNewAppAuth = (appAuthData, refresh) => {
		  setSelectedAuthentication(appAuthData);
		  var headers = {
			"Content-Type": "application/json",
			"Accept": "application/json",
		  }
		
			headers["Org-Id"] = userdata?.active_org?.id
		
			fetch(globalUrl + "/api/v1/apps/authentication", {
			  method: "PUT",
			  headers: headers,
			  body: JSON.stringify(appAuthData),
			  credentials: "include",
			})
			  .then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for setting app auth :O!");
		
			  if (response.status === 400) {
				toast.error("Failed setting new auth. Please try again", {
				  "autoClose": true,
				})
			  }
			}
		
				return response.json();
			  })
			  .then((responseJson) => {
				if (!responseJson.success) {
				  toast.error("Error: " + responseJson.reason, {
			  "autoClose": false,
			  })
		
				} else {
				  HandleAppAuthentication()
				  setAuthenticationModalOpen(false)
				  getAppAuthentication()
				}
			  })
			  .catch((error) => {
				console.log("New auth error: ", error.toString());
			  });
		  };

		const handleSubmitCheck = () => {
		  if (authenticationOption.label.length === 0) {
			authenticationOption.label = `Auth for ${selectedApp.name}`;
		  }
		  for (let paramkey in selectedApp.authentication.parameters) {
			if (
			  authenticationOption.fields[
				selectedApp.authentication.parameters[paramkey].name
			  ].length === 0
			) {
			  if (
				selectedApp.authentication.parameters[paramkey].value !== undefined &&
				selectedApp.authentication.parameters[paramkey].value !== null &&
				selectedApp.authentication.parameters[paramkey].value.length > 0
			  ) {
				authenticationOption.fields[
				  selectedApp.authentication.parameters[paramkey].name
				] = selectedApp.authentication.parameters[paramkey].value;
			  } else {
				if (
				  selectedApp.authentication.parameters[paramkey].schema.type === "bool"
				) {
				  authenticationOption.fields[
					selectedApp.authentication.parameters[paramkey].name
				  ] = "false";
				} else {
				  toast(
					"Field " +
					selectedApp.authentication.parameters[paramkey].name +
					" can't be empty"
				  );
				  return;
				}
			  }
			}
		  }

		  var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
		  var newFields = [];
		  for (let authkey in newAuthOption.fields) {
			const value = newAuthOption.fields[authkey];
			newFields.push({
			  "key": authkey,
			  "value": value,
			});
		  }

		  newAuthOption.fields = newFields
		  setNewAppAuth(newAuthOption)
    }

	if (authenticationOption.label === null || authenticationOption.label === undefined) {
    	authenticationOption.label = selectedApp.name + " authentication";
    }

    return (
      <div>
        <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
          <div style={{ color: theme.palette.textColor }}>
            Authentication for {selectedApp.name.replaceAll("_", " ", -1)}
          </div>
        </DialogTitle>
        <DialogContent>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://shuffler.io/docs/apps#authentication"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            What is app authentication?
          </a>
          <div />
          These are required fields for authenticating with {selectedApp.name}
          <div style={{ marginTop: 15 }} />
          <b>Label for you to remember</b>
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
              },
            }}
            fullWidth
            color="primary"
            placeholder={"Auth july 2020"}
            defaultValue={`Auth for ${selectedApp.name}`}
            onChange={(event) => {
              authenticationOption.label = event.target.value;
            }}
          />
          <Divider
            style={{
              marginTop: 15,
              marginBottom: 15,
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div />
          {selectedApp.authentication.parameters.map((data, index) => {
      if (data.value === "" || data.value === null || data.value === undefined || data.name === "url") {
      }


            return (
              <div key={index} style={{ marginTop: 10 }}>
                <LockOpenIcon style={{ marginRight: 10 }} />
                <b>{data.name}</b>

                {data.schema !== undefined &&
                  data.schema !== null &&
                  data.schema.type === "bool" ? (
                  <Select
                    MenuProps={{
                      disableScrollLock: true,
                    }}
                    SelectDisplayProps={{
                      style: {
                      },
                    }}
                    defaultValue={"false"}
                    fullWidth
                    onChange={(e) => {
                      authenticationOption.fields[data.name] = e.target.value;
                    }}
                    style={{
                      backgroundColor: theme.palette.surfaceColor,
                      color: theme.palette.textColor,
                      height: 50,
                    }}
                  >
                    <MenuItem
                      key={"false"}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: theme.palette.textColor,
                      }}
                      value={"false"}
                    >
                      false
                    </MenuItem>
                    <MenuItem
                      key={"true"}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: theme.palette.textColor,
                      }}
                      value={"true"}
                    >
                      true
                    </MenuItem>
                  </Select>
                ) : (
                  <TextField
                    style={{
                      backgroundColor: theme.palette.inputColor,
                      borderRadius: theme.palette?.borderRadius,
                    }}
                    InputProps={{
                      style: {
                      },
                    }}
                    fullWidth
                    type={
                      data.example !== undefined && data.example.includes("***")
                        ? "password"
                        : "text"
                    }
                    color="primary"
                    defaultValue={
                      data.value !== undefined && data.value !== null
                        ? data.value
                        : ""
                    }
                    placeholder={data.example}
                    onChange={(event) => {
                      authenticationOption.fields[data.name] =
                        event.target.value;
                    }}
                  />
                )}
              </div>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button
            style={{}}
            onClick={() => {
              setAuthenticationModalOpen(false);
            }}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            style={{}}
      variant="outlined"
            onClick={() => {
              setAuthenticationOptions(authenticationOption);
              handleSubmitCheck()
            }}
            color="primary"
          >
            Submit
          </Button>
        </DialogActions>
      </div>
    );
  };

	const authenticationModal = authenticationModalOpen ? (
		<Dialog
		  PaperComponent={PaperComponent}
		  aria-labelledby="draggable-dialog-title"
		  hideBackdrop={true}
		  disableEnforceFocus={true}
		  disableBackdropClick={true}
		  style={{ pointerEvents: "none" }}
		  open={authenticationModalOpen}
		  onClose={() => {setSelectedMeta(undefined)}}
		  PaperProps={{
			style: {
			  pointerEvents: "auto",
			  color: theme.palette.textColor,
			  minWidth: 1100,
			  minHeight: 800,
			  maxHeight: 800,
			  padding: 15,
			  overflow: "hidden",
			  zIndex: 10012,
			  border: theme.palette.defaultBorder,
			},
		  }}
		>
		  <div
			style={{
			  zIndex: 5000,
			  position: "absolute",
			  top: 20,
			  right: 75,
			  height: 50,
			  width: 50,
			}}
		  >
			{ selectedAppData.reference_info === undefined ||
			  selectedAppData.reference_info === null ||
			  selectedAppData.reference_info.github_url === undefined ||
			  selectedAppData.reference_info.github_url === null ||
			  selectedAppData.reference_info.github_url.length === 0 ? (

			  <a
				rel="noopener noreferrer"
				target="_blank"
				href={"https://github.com/shuffle/python-apps"}
				style={{ textDecoration: "none", color: "#f86a3e" }}
			  >
				<img
				  alt={`Documentation image for ${selectedAppData.name}`}
				  src={selectedAppData.large_image}
				  style={{
					width: 30,
					height: 30,
					border: "2px solid rgba(255,255,255,0.6)",
					borderRadius: theme.palette?.borderRadius,
					maxHeight: 30,
					maxWidth: 30,
					overflow: "hidden",
					fontSize: 8,
				  }}
				/>
			  </a>
			) : (
			  <a
				rel="noopener noreferrer"
				target="_blank"
				href={selectedAppData.reference_info.github_url}
				style={{ textDecoration: "none", color: "#f86a3e" }}
			  >
				<img
				  alt={`Documentation image for ${selectedAppData.name}`}
				  src={selectedAppData.large_image}
				  style={{
					width: 30,
					height: 30,
					border: "2px solid rgba(255,255,255,0.6)",
					borderRadius: theme.palette?.borderRadius,
					maxWidth: 30,
					maxHeight: 30,
					overflow: "hidden",
					fontSize: 8,
				  }}
				/>
			  </a>
			)}
		  </div>
		<Tooltip
		color="primary"
		title={`Move window`}
		placement="left"
		>
		  <IconButton
		  id="draggable-dialog-title"
		  style={{
			zIndex: 5000,
			position: "absolute",
			top: 14,
			right: 50,
			color: "grey",

			cursor: "move", 
		  }}
		  >
		  <DragIndicatorIcon />
		  </IconButton>
		</Tooltip>
		  <IconButton
			style={{
			  zIndex: 5000,
			  position: "absolute",
			  top: 14,
			  right: 18,
			  color: "grey",
			}}
			onClick={() => {
			  setAuthenticationModalOpen(false);
			}}
		  >
			<CloseIcon />
		  </IconButton>
		  <div style={{ display: "flex", flexDirection: "row" }}>
			<div
			  style={{
				flex: 2,
				padding: 0,
				minHeight: isMobile ? "90%" : 800,
				maxHeight: isMobile ? "90%" : 800,
				overflowY: "auto",
				overflowX: isMobile ? "auto" : "hidden",
			  }}
			>
			  {authenticationType?.type === "oauth2" || authenticationType?.type === "oauth2-app"  ? 
				<AuthenticationOauth2
				  selectedApp={selectedAppData}
				  selectedAction={{
					"app_name": selectedAppData.name,
					"app_id": selectedAppData.id,
					"app_version": selectedAppData.version,
					"large_image": selectedAppData.large_image,
				  }}
				  authenticationType={authenticationType}
				  getAppAuthentication={getAppAuthentication}
				  appAuthentication={appAuthentication}
				  setAuthenticationModalOpen={setAuthenticationModalOpen}
				  isCloud={isCloud}
				  org_id={userdata?.active_org?.id}
				  setSelectedAction={setSelectedAction}
				/>
			   : 
				<AuthenticationData app={selectedAppData} />
			  }
			</div>
			<div
			  style={{
				flex: 3,
				borderLeft: `1px solid ${theme.palette.inputColor}`,
				padding: "70px 30px 30px 30px",
				maxHeight: 630,
				minHeight: 630,
				overflowY: "auto",
				overflowX: "hidden",
			  }}
			>
			  {selectedAppData?.documentation === undefined ||
				selectedAppData?.documentation === null ||
				selectedAppData?.documentation.length === 0 ? (
				<span 
			style={{ textAlign: "center" }}
		  >
			<div style={{textAlign: "left", }}>
			  <Markdown
			  components={{
				img: Img,
				code: CodeHandler,
				h1: Heading,
				h2: Heading,
				h3: Heading,
				h4: Heading,
				h5: Heading,
				h6: Heading,
				a: OuterLink,
			  }}
			  id="markdown_wrapper"
			  escapeHtml={false}
			  style={{
				maxWidth: "100%", 
				minWidth: "100%", 
				textAlign: "left", 
			  }}
			  >
			  {selectedAppData?.description}
			  </Markdown>
			</div>
				  <Divider
					style={{
					  marginTop: 25,
					  marginBottom: 25,
					  backgroundColor: "rgba(255,255,255,0.6)",
					}}
				  />

			<div
						style={{
							backgroundColor: theme.palette.inputColor,
							padding: 15,
							borderRadius: theme.palette?.borderRadius,
							marginBottom: 30,
						}}
					>
			  <Typography variant="h6" style={{marginBottom: 25, }}>
			  There is no Shuffle-specific documentation for this app yet outside of the general description above. Documentation is written for each api, and is a community effort. We hope to see your contribution!
			  </Typography>
			  <Button 
				variant="contained" 
				color="primary"
				onClick={() => {
				  toast.success("Opening remote Github documentation link. Thanks for contributing!")

				  setTimeout(() => {
					window.open(`https://github.com/Shuffle/openapi-apps/new/master/docs?filename=${selectedAppData.name.toLowerCase()}.md`, "_blank")
				  }, 2500)
				}}
			   >
				<EditIcon /> &nbsp;&nbsp;Create Docs
			   </Button>
					</div>

				  <Typography variant="body1" style={{ marginTop: 25 }}>
					Want to help the making of, or improve this app?{" "}
			<br />
					<a
					  rel="noopener noreferrer"
					  target="_blank"
					  href="https://discord.gg/B2CBzUm"
					  style={{ textDecoration: "none", color: "#f86a3e" }}
					>
					  Join the community on Discord!
					</a>
				  </Typography>

				  <Typography variant="h6" style={{ marginTop: 50 }}>
					Want to help change this app directly?
				  </Typography>
				  {selectedAppData.reference_info === undefined ||
					selectedAppData.reference_info === null ||
					selectedAppData.reference_info.github_url === undefined ||
					selectedAppData.reference_info.github_url === null ||
					selectedAppData.reference_info.github_url.length === 0 ? (
					<span>
					  <Typography variant="body1" style={{ marginTop: 25 }}>
						<a
						  rel="noopener noreferrer"
						  target="_blank"
						  href={"https://github.com/shuffle/python-apps"}
						  style={{ textDecoration: "none", color: "#f86a3e" }}
						>
						  Check it out on Github!
						</a>
					  </Typography>
					</span>
				  ) : (
					<span>
					  <Typography variant="body1" style={{ marginTop: 25 }}>
						<a
						  rel="noopener noreferrer"
						  target="_blank"
						  href={selectedAppData.reference_info.github_url}
						  style={{ textDecoration: "none", color: "#f86a3e" }}
						>
						  Check it out on Github!
						</a>
					  </Typography>
					</span>
				  )}
				</span>
			  ) : (
		  <div>
			{selectedMeta !== undefined && selectedMeta !== null && Object.getOwnPropertyNames(selectedMeta).length > 0 && selectedMeta.name !== undefined && selectedMeta.name !== null ? 
			<div
			  style={{
				backgroundColor: theme.palette.inputColor,
				padding: 15,
				borderRadius: theme.palette?.borderRadius,
				marginBottom: 30,
				display: "flex",
			  }}
			>
			<div style={{ flex: 3, display: "flex", vAlign: "center", position: "sticky", top: 50, }}>
			  {isMobile ? null : (
				<Typography style={{ display: "inline", marginTop: 6 }}>
				  <a
					rel="noopener noreferrer"
					target="_blank"
					href={selectedMeta.link}
					style={{ textDecoration: "none", color: "#f85a3e" }}
				  >
					<Button style={{ color: theme.palette.textColor, }} variant="outlined" color="secondary">
					  <EditIcon /> &nbsp;&nbsp;Edit
					</Button>
				  </a>
				</Typography>
			  )}
			  {isMobile ? null : (
				<div
				  style={{
					height: "100%",
					width: 1,
					backgroundColor: theme.palette.textColor,
					marginLeft: 50,
					marginRight: 50,
				  }}
				/>
			  )}
			  <Typography style={{ display: "inline", marginTop: 11 }}>
				{selectedMeta.read_time} minute
				{selectedMeta.read_time === 1 ? "" : "s"} to read
			  </Typography>
			</div>
			<div style={{ flex: 2 }}>
			  {isMobile ||
				selectedMeta.contributors === undefined ||
				selectedMeta.contributors === null ? (
				""
			  ) : (
				<div style={{ margin: 10, height: "100%", display: "inline" }}>
				  {selectedMeta.contributors.slice(0, 7).map((data, index) => {
					return (
					  <a
						key={index}
						rel="noopener noreferrer"
						target="_blank"
						href={data.url}
						style={{ textDecoration: "none", color: "#f85a3e" }}
					  >
						<Tooltip title={data.url} placement="bottom">
						  <img
							alt={data.url}
							src={data.image}
							style={{
							  marginTop: 5,
							  marginRight: 10,
							  height: 40,
							  borderRadius: 40,
							}}
						  />
						</Tooltip>
					  </a>
					);
				  })}
				</div>
			  )}
			</div>
		  </div>
			: null}

			<Markdown
			  components={{
				img: Img,
				code: CodeHandler,
				h1: Heading,
				h2: Heading,
				h3: Heading,
				h4: Heading,
				h5: Heading,
				h6: Heading,
				a: OuterLink,
			  }}
			  id="markdown_wrapper"
			  escapeHtml={false}
			  style={{
				maxWidth: "100%", minWidth: "100%", 
			  }}
			>
			{selectedAppData.documentation}
			</Markdown>
		  </div>
			  )}
			</div>
		  </div>
		</Dialog>
	) : null;

	return authenticationModal
}

export default AuthenticationModal;
