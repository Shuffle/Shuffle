import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { useTheme } from "@material-ui/core/styles";

import { v4 as uuidv4 } from "uuid";
import {
  ListItemText,
  TextField,
  Drawer,
  Button,
  Paper,
  Grid,
  Tabs,
  InputAdornment,
  Tab,
  ButtonBase,
  Tooltip,
  Select,
  MenuItem,
  Divider,
  Dialog,
  Modal,
  DialogActions,
  DialogTitle,
  InputLabel,
  DialogContent,
  FormControl,
  IconButton,
  Menu,
  Input,
  FormGroup,
  FormControlLabel,
  Typography,
  Checkbox,
  Breadcrumbs,
  CircularProgress,
  Switch,
  Fade,
} from "@material-ui/core";
import { LockOpen as LockOpenIcon } from "@material-ui/icons";

const ITEM_HEIGHT = 55;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      minWidth: 500,
      maxWidth: 500,
      scrollX: "auto",
    },
  },
  variant: "menu",
  getContentAnchorEl: null,
};

const AuthenticationOauth2 = (props) => {
  const {
    saveWorkflow,
    selectedApp,
    workflow,
    selectedAction,
    authenticationType,
    getAppAuthentication,
    appAuthentication,
    setSelectedAction,
    setNewAppAuth,
    setAuthenticationModalOpen,
  } = props;
  const theme = useTheme();

  //const [update, setUpdate] = React.useState("|")
  const [defaultConfigSet, setDefaultConfigSet] = React.useState(
    authenticationType.client_id !== undefined &&
      authenticationType.client_id !== null &&
      authenticationType.client_id.length > 0 &&
      authenticationType.client_secret !== undefined &&
      authenticationType.client_secret !== null &&
      authenticationType.client_secret.length > 0
  );
  const [clientId, setClientId] = React.useState(
    defaultConfigSet ? authenticationType.client_id : ""
  );
  const [clientSecret, setClientSecret] = React.useState(
    defaultConfigSet ? authenticationType.client_secret : ""
  );
  const [oauthUrl, setOauthUrl] = React.useState("");
  const [buttonClicked, setButtonClicked] = React.useState(false);
  const [selectedScopes, setSelectedScopes] = React.useState([]);
  const [offlineAccess, setOfflineAccess] = React.useState(true);
  const allscopes =
    authenticationType.scope !== undefined ? authenticationType.scope : [];

  const [manuallyConfigure, setManuallyConfigure] = React.useState(
    defaultConfigSet ? false : true
  );
  const [authenticationOption, setAuthenticationOptions] = React.useState({
    app: JSON.parse(JSON.stringify(selectedApp)),
    fields: {},
    label: "",
    usage: [
      {
        workflow_id: workflow.id,
      },
    ],
    id: uuidv4(),
    active: true,
  });

  if (selectedApp.authentication === undefined) {
    return null;
  }

  const handleOauth2Request = (client_id, client_secret, oauth_url, scopes) => {
    setButtonClicked(true);
    console.log("SCOPES: ", scopes);

		client_id = client_id.trim()
		client_secret = client_secret.trim()
		oauth_url = oauth_url.trim()

    var resources = "";
    if (scopes !== undefined && (scopes !== null) & (scopes.length > 0)) {
			if (offlineAccess === true && !scopes.includes("offline_access")) {
				if (authenticationType.redirect_uri.includes("microsoft")) {
					console.log("Appending offline access")
					scopes.push("offline_access")
				}
			}

      resources = scopes.join(" ");
      //resources = scopes.join(",");
    }

    const authentication_url = authenticationType.token_uri;
    //console.log("AUTH: ", authenticationType)
    //console.log("SCOPES2: ", resources)
    const redirectUri = `${window.location.protocol}//${window.location.host}/set_authentication`;
    var state = `workflow_id%3D${workflow.id}%26reference_action_id%3d${selectedAction.app_id}%26app_name%3d${selectedAction.app_name}%26app_id%3d${selectedAction.app_id}%26app_version%3d${selectedAction.app_version}%26authentication_url%3d${authentication_url}%26scope%3d${resources}%26client_id%3d${client_id}%26client_secret%3d${client_secret}`;
    if (oauth_url !== undefined && oauth_url !== null && oauth_url.length > 0) {
      state += `%26oauth_url%3d${oauth_url}`;
      console.log("ADDING OAUTH2 URL: ", state);
    }

    if (
      authenticationType.refresh_uri !== undefined &&
      authenticationType.refresh_uri !== null &&
      authenticationType.refresh_uri.length > 0
    ) {
      state += `%26refresh_uri%3d${authenticationType.refresh_uri}`;
    } else {
      state += `%26refresh_uri%3d${authentication_url}`;
    }

    const url = `${authenticationType.redirect_uri}?client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${resources}&prompt=consent&state=${state}&access_type=offline`;

    //const url = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${client_id}&scope=AaaServer.profile.Read&redirect_uri=${redirectUri}&prompt=consent`
    //console.log("Full URI: ", url)
    //console.log("Redirect Uri: ", redirectUri)
    // &resource=https%3A%2F%2Fgraph.microsoft.com&

    // FIXME: Awful, but works for prototyping
    // How can we get a callback properly realtime?
    // How can we properly try-catch without breaks on error?
    try {
      var newwin = window.open(url, "", "width=800,height=600");
      //console.log(newwin)

      var open = true;
      const timer = setInterval(() => {
        if (newwin.closed) {
          setButtonClicked(false);
          clearInterval(timer);
          //alert('"Secure Payment" window closed!');

          getAppAuthentication(true, true);
        }
      }, 1000);
      //do {
      //	setTimeout(() => {
      //		console.log(newwin)
      //		console.log("CLOSED", newwin.closed)
      //		if (newwin.closed) {

      //			open = false
      //		}
      //	}, 1000)
      //}
      //while(open === true)
    } catch (e) {
      alert.error(
        "Failed authentication - probably bad credentials. Try again"
      );
      setButtonClicked(false);
    }

    return;
    //do {
    //} while (
  };

  authenticationOption.app.actions = [];

  for (var key in selectedApp.authentication.parameters) {
    if (
      authenticationOption.fields[
        selectedApp.authentication.parameters[key].name
      ] === undefined
    ) {
      authenticationOption.fields[
        selectedApp.authentication.parameters[key].name
      ] = "";
    }
  }

  const handleSubmitCheck = () => {
    console.log("NEW AUTH: ", authenticationOption);
    if (authenticationOption.label.length === 0) {
      authenticationOption.label = `Auth for ${selectedApp.name}`;
      //alert.info("Label can't be empty")
      //return
    }

    // Automatically mapping fields that already exist (predefined).
    // Warning if fields are NOT filled
    for (var key in selectedApp.authentication.parameters) {
      if (
        authenticationOption.fields[
          selectedApp.authentication.parameters[key].name
        ].length === 0
      ) {
        if (
          selectedApp.authentication.parameters[key].value !== undefined &&
          selectedApp.authentication.parameters[key].value !== null &&
          selectedApp.authentication.parameters[key].value.length > 0
        ) {
          authenticationOption.fields[
            selectedApp.authentication.parameters[key].name
          ] = selectedApp.authentication.parameters[key].value;
        } else {
          if (
            selectedApp.authentication.parameters[key].schema.type === "bool"
          ) {
            authenticationOption.fields[
              selectedApp.authentication.parameters[key].name
            ] = "false";
          } else {
            alert.info(
              "Field " +
                selectedApp.authentication.parameters[key].name +
                " can't be empty"
            );
            return;
          }
        }
      }
    }

    console.log("Action: ", selectedAction);
    selectedAction.authentication_id = authenticationOption.id;
    selectedAction.selectedAuthentication = authenticationOption;
    if (
      selectedAction.authentication === undefined ||
      selectedAction.authentication === null
    ) {
      selectedAction.authentication = [authenticationOption];
    } else {
      selectedAction.authentication.push(authenticationOption);
    }

    setSelectedAction(selectedAction);

    var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
    var newFields = [];
    for (const key in newAuthOption.fields) {
      const value = newAuthOption.fields[key];
      newFields.push({
        key: key,
        value: value,
      });
    }

    console.log("FIELDS: ", newFields);
    newAuthOption.fields = newFields;
    setNewAppAuth(newAuthOption);
    //appAuthentication.push(newAuthOption)
    //setAppAuthentication(appAuthentication)
    //

    //if (configureWorkflowModalOpen) {
    //	setSelectedAction({})
    //}
    //setUpdate(authenticationOption.id)

    /*
			{selectedAction.authentication.map(data => (
			<MenuItem key={data.id} style={{backgroundColor: inputColor, color: "white"}} value={data}>
		*/
  };

  const handleScopeChange = (event) => {
    const {
      target: { value },
    } = event;

    console.log("VALUE: ", value);

    // On autofill we get a the stringified value.
    setSelectedScopes(typeof value === "string" ? value.split(",") : value);
  };

  if (
    authenticationOption.label === null ||
    authenticationOption.label === undefined
  ) {
    authenticationOption.label = selectedApp.name + " authentication";
  }

  //console.log(
  return (
    <div>
      <DialogTitle>
        <div style={{ color: "white" }}>
          Authentication for {selectedApp.name}
        </div>
      </DialogTitle>
      <DialogContent>
        <span style={{}}>
            Oauth2 requires a client ID and secret to authenticate, defined in the remote system. Your redirect URL is <b>https://shuffler.io/set_authentication</b>.
          <a
            target="_blank"
            rel="norefferer"
            href="https://shuffler.io/docs/apps#authentication"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            {" "}
            Learn more about Oauth2 with Shuffle
          </a>
          <div />
        </span>
        {/*<TextField
						style={{backgroundColor: theme.palette.inputColor, borderRadius: theme.palette.borderRadius,}} 
						InputProps={{
							style:{
								color: "white",
								marginLeft: "5px",
								maxWidth: "95%",
								height: 50, 
								fontSize: "1em",
							},
						}}
						fullWidth
						color="primary"
						placeholder={"Auth july 2020"}
						defaultValue={`Auth for ${selectedApp.name}`}
						onChange={(event) => {
							authenticationOption.label = event.target.value
						}}
					/>
				<Divider style={{marginTop: 15, marginBottom: 15, backgroundColor: "rgb(91, 96, 100)"}}/>
				*/}

        {!manuallyConfigure ? null : (
          <span>
            {selectedApp.authentication.parameters.map((data, index) => {
              //console.log(data, index)
              if (data.name === "client_id" || data.name === "client_secret") {
                return null;
              }

              if (data.name !== "url") {
                return null;
              }

              if (oauthUrl.length === 0) {
                setOauthUrl(data.value);
              }

              return (
                <div key={index} style={{ marginTop: 10 }}>
                  <LockOpenIcon style={{ marginRight: 10 }} />
                  <b>{data.name}</b>

                  {data.schema !== undefined &&
                  data.schema !== null &&
                  data.schema.type === "bool" ? (
                    <Select
                      SelectDisplayProps={{
                        style: {
                          marginLeft: 10,
                        },
                      }}
                      defaultValue={"false"}
                      fullWidth
                      onChange={(e) => {
                        console.log("Value: ", e.target.value);
                        authenticationOption.fields[data.name] = e.target.value;
                      }}
                      style={{
                        backgroundColor: theme.palette.surfaceColor,
                        color: "white",
                        height: 50,
                      }}
                    >
                      <MenuItem
                        key={"false"}
                        style={{
                          backgroundColor: theme.palette.inputColor,
                          color: "white",
                        }}
                        value={"false"}
                      >
                        false
                      </MenuItem>
                      <MenuItem
                        key={"true"}
                        style={{
                          backgroundColor: theme.palette.inputColor,
                          color: "white",
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
                        borderRadius: theme.palette.borderRadius,
                      }}
                      InputProps={{
                        style: {
                          color: "white",
                          marginLeft: "5px",
                          maxWidth: "95%",
                          height: 50,
                          fontSize: "1em",
                        },
                      }}
                      fullWidth
                      type={
                        data.example !== undefined &&
                        data.example.includes("***")
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
                        console.log("Setting oauth url");
                        setOauthUrl(event.target.value);
                        //const [oauthUrl, setOauthUrl] = React.useState("")
                      }}
                    />
                  )}
                </div>
              );
            })}
            <TextField
              style={{
                marginTop: 20,
                backgroundColor: theme.palette.inputColor,
                borderRadius: theme.palette.borderRadius,
              }}
              InputProps={{
                style: {
                  color: "white",
                  marginLeft: "5px",
                  maxWidth: "95%",
                  fontSize: "1em",
                  height: "50px",
                },
              }}
              fullWidth
              color="primary"
              placeholder={"Client ID"}
              onChange={(event) => {
                setClientId(event.target.value);
                //authenticationOption.label = event.target.value
              }}
            />
            <TextField
              style={{
                backgroundColor: theme.palette.inputColor,
                borderRadius: theme.palette.borderRadius,
								marginBottom: 10, 
              }}
              InputProps={{
                style: {
                  color: "white",
                  marginLeft: "5px",
                  maxWidth: "95%",
                  fontSize: "1em",
                  height: "50px",
                },
              }}
              fullWidth
              color="primary"
              placeholder={"Client Secret"}
              onChange={(event) => {
                setClientSecret(event.target.value);
                //authenticationOption.label = event.target.value
              }}
            />
            {allscopes.length === 0 ? null : (
							<div style={{width: "100%", marginTop: 10, display: "flex"}}>
								<span>
									Scopes
									<Select
										multiple
										value={selectedScopes}
										style={{
											backgroundColor: theme.palette.inputColor,
											color: "white",
											padding: 5, 
											minWidth: 300,
											maxWidth: 300,
										}}
										onChange={(e) => {
											handleScopeChange(e)
										}}
										fullWidth
										input={<Input id="select-multiple-native" />}
										renderValue={(selected) => selected.join(", ")}
										MenuProps={MenuProps}
									>
										{allscopes.map((data, index) => {
											return (
												<MenuItem key={index} value={data}>
													<Checkbox checked={selectedScopes.indexOf(data) > -1} />
													<ListItemText primary={data} />
												</MenuItem>
											);
										})}
									</Select>
								</span>
								<span>
									<Tooltip
										color="primary"
										title={"Automatic Refresh (default: true)"}
										placement="top"
									>
										<Checkbox style={{paddingTop: 20}} color="secondary" checked={offlineAccess} onClick={() => {
											setOfflineAccess(!offlineAccess)
										}}/>
									</Tooltip>
								</span>
							</div>
            )}
          </span>
        )}
        <Button
          style={{
            marginBottom: 40,
            marginTop: 20,
            borderRadius: theme.palette.borderRadius,
          }}
          disabled={
            clientSecret.length === 0 || clientId.length === 0 || buttonClicked || selectedScopes.length === 0
          }
          variant="contained"
          fullWidth
          onClick={() => {
            handleOauth2Request(
              clientId,
              clientSecret,
              oauthUrl,
              selectedScopes
            );
          }}
          color="primary"
        >
          {buttonClicked ? (
            <CircularProgress style={{ color: "white" }} />
          ) : (
            "Oauth2 request"
          )}
        </Button>

        {defaultConfigSet ? (
          <span style={{}}>
            ... or
            <Button
              style={{
                marginLeft: 10,
                borderRadius: theme.palette.borderRadius,
              }}
              disabled={clientSecret.length === 0 || clientId.length === 0}
              variant="text"
              onClick={() => {
                setManuallyConfigure(!manuallyConfigure);

                if (manuallyConfigure) {
                  setClientId(authenticationType.client_id);
                  setClientSecret(authenticationType.client_secret);
                } else {
                  setClientId("");
                  setClientSecret("");
                }
              }}
              color="primary"
            >
              {manuallyConfigure
                ? "Use auto-config"
                : "Manually configure Oauth2"}
            </Button>
          </span>
        ) : null}
      </DialogContent>
    </div>
  );
};

export default AuthenticationOauth2;
