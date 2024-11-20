import React, { useState } from "react";

import { Typography, CircularProgress } from "@mui/material";
import theme from '../theme.jsx';

import { red,  } from "../views/AngularWorkflow.jsx"

const SetAuthentication = (props) => {
  const { globalUrl } = props;

	var headers = {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}

  const [firstRequest, setFirstRequest] = useState(true);
  const [finished, setFinished] = useState(false);
  const [response, setResponse] = useState("");
  const [failed, setFailed] = useState(false);
  const [requestHeaders, setRequestHeaders] = useState(headers);

  if (firstRequest) {
    setFirstRequest(false);

    //code
    //session_state
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
		console.log("PARAMS: ", params)



    //const authenticationStore = [];
    var appAuthData = {
      label: "",
      app: {
        name: "",
        id: "",
        app_version: "",
      },
      fields: [],
      type: "oauth2",
    }

    if (window !== undefined && window !== null) {
      //console.log(window.location);
      appAuthData.fields.push({
        key: "redirect_uri",
        value: window.location.origin + window.location.pathname,
      });
    }

    if (params.session_state !== undefined && params.session_state !== null) {
      appAuthData.fields.push({
        key: "session_state",
        value: params.session_state,
      });
    }

		var externalData = {
			handleExternal: false,
			user: "",
			type: "",
			code: "",
		}

    if (params.code !== undefined && params.code !== null) {
      appAuthData.fields.push({ key: "code", value: params.code });
			externalData.code = params.code
    }

		var foundScope = ""
    if (params.state !== undefined && params.state !== null) {
      const paramsplit = params.state.split("&");
      console.log(paramsplit);
      for (var key in paramsplit) {
        const query = paramsplit[key].split("=");
        console.log("K:V: ", key, query);
				if (query.length > 1) {
					if (query[0] === "type" && query[1] === "github"){ 
						externalData.handleExternal = true 
						externalData.type = "github" 
					}

					if (query[0] === "username" || query[0] === "user"){ 
						externalData.user = query[1] 
					}
				}

        if (query.length !== 2) {
          console.log("INVALID QUERY: ", query);
          continue;
        }

				if (query[0] === "org_id") {
					headers["Org-Id"] = query[1]
				}

				if (query[0] === "authorization") {
					headers["Authorization"] = "Bearer " + query[1]
				}

        if (query[0] === "workflow_id") {
          appAuthData.reference_workflow = query[1];
        }

        if (query[0] === "reference_action_id") {
          //appAuthData.ReferenceWorkflow = query[1]
        }

        if (query[0] === "app_name") {
          appAuthData.app.name = query[1];
          appAuthData.label = "Oauth2 for " + query[1];
        }

        if (query[0] === "app_id") {
          appAuthData.app.id = query[1];
        }

        if (query[0] === "app_version") {
          appAuthData.app.app_version = query[1];
        }

        if (query[0] === "authentication_url") {
          appAuthData.fields.push({
            key: "authentication_url",
            value: query[1],
          });
        }

        if (query[0] === "scope") {
          appAuthData.fields.push({ key: "scope", value: query[1] });
					foundScope = query[1]
        }

        if (query[0] === "client_id") {
          appAuthData.fields.push({ key: "client_id", value: query[1] });
        }

        if (query[0] === "client_secret") {
          appAuthData.fields.push({ key: "client_secret", value: query[1] });
        }

        if (query[0] === "oauth_url") {
          appAuthData.fields.push({ key: "oauth_url", value: query[1] });
        }

        if (query[0] === "refresh_uri") {
          appAuthData.fields.push({ key: "refresh_uri", value: query[1] });
        }

        if (query[0] === "refresh_url") {
          appAuthData.fields.push({ key: "refresh_url", value: query[1] });
        }
      }

  		setRequestHeaders(headers)
    }

		if (foundScope !== undefined && foundScope !== null && foundScope.length > 0) {
			appAuthData.label = `${foundScope}`
		}

		var foundTab = params["error"];
		if (foundTab !== null && foundTab !== undefined && foundTab.length > 0) {
			console.log("Found error: ", foundTab, "! Skipping Shuffle requests to validate Oauth2")
			var errorDesc = params["error_description"]
			if (errorDesc !== null && errorDesc !== undefined && errorDesc.length > 0) {
				foundTab += "\n\n"+errorDesc
			}

			setFailed(true)
			setResponse(`${foundTab}`)
		} else {

			if (externalData.handleExternal) {
					console.log("RUN EXTERNAL!!: ", externalData)
					
					fetch(globalUrl + "/api/v1/triggers/github/register", {
						method: "PUT",
						headers: requestHeaders,
						credentials: "include",
						body: JSON.stringify(externalData),
					})
					.then((response) => {
							const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
							const tmpView = new URLSearchParams(cursearch).get("state");
							if (
								tmpView !== undefined &&
								tmpView !== null &&
								tmpView.length > 0
							) {
								console.log("State to find app name from: ", tmpView)
							}

						if (response.status !== 200) {
							console.log("Status not 200 for oauth2 authentication");
							setFailed(true);
						} else {
							setFinished(true);
							//setTimeout(() => {
							//	window.close();
							//}, 2500);
						}

						return response.json();
					})
					.then((responseJson) => {
						//setUserSettings(responseJson)
						console.log("Resp: ", responseJson);

						if (responseJson.reason !== undefined) {
							setResponse(responseJson.reason);
							setFinished(true);

						} else {
							const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
							var tmpView = new URLSearchParams(cursearch).get("error_description");
							if (
								tmpView !== undefined &&
								tmpView !== null &&
								tmpView.length > 0
							) {
								setResponse(tmpView)
							} else {
								tmpView = new URLSearchParams(cursearch).get("error");
								if (
									tmpView !== undefined &&
									tmpView !== null &&
									tmpView.length > 0
								) {
									setResponse(tmpView)
								}
							}
						}

					})
					.catch((error) => {
						console.log(error);
					});

				return
			}

    	fetch(globalUrl + "/api/v1/apps/authentication", {
    	  method: "PUT",
    	  headers: requestHeaders,
    	  credentials: "include",
    	  body: JSON.stringify(appAuthData),
    	})
    	  .then((response) => {
					const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
					const tmpView = new URLSearchParams(cursearch).get("state");
					if (tmpView !== undefined && tmpView !== null && tmpView.length > 0) {
						console.log("State to find app name from: ", tmpView)
					}

    	    if (response.status !== 200) {
    	      console.log("Status not 200 for oauth2 authentication");
    	      setFailed(true);
    	    } else {
    	    	setFinished(true);
						setTimeout(() => {
							window.close();
						}, 2500);
					}

    	    return response.json();
    	  })
    	  .then((responseJson) => {
    	    //setUserSettings(responseJson)
					if (responseJson.reason !== undefined) {
    	    	setResponse(responseJson.reason);
    	    	setFinished(true);

					} else {
    	      const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
						var tmpView = new URLSearchParams(cursearch).get("error_description");
    	  		if (
    	  		  tmpView !== undefined &&
    	  		  tmpView !== null &&
    	  		  tmpView.length > 0
    	  		) {
							setResponse(tmpView)
    	  		} else {
							tmpView = new URLSearchParams(cursearch).get("error");
    	  			if (
    	  			  tmpView !== undefined &&
    	  			  tmpView !== null &&
    	  			  tmpView.length > 0
    	  			) {
								setResponse(tmpView)
							}
						}
					}

    	  })
    	  .catch((error) => {
    	    console.log(error);
    	  });
			}
  }

  return (
    <div style={{ padding: 50, border: failed === true ? `1px solid ${red}` : "1px solid rgba(255,255,255,0.6)", borderRadius: theme.palette?.borderRadius,  width: 500, margin: "auto", marginTop: 50, itemAlign: "center", textAlign: "center",}}>
      <Typography
        variant="h4"
        style={{ marginLeft: "auto", marginRight: "auto", marginTop: 50}}
      >
		Oauth2 setup
      </Typography>
      <Typography
        variant="h6"
        style={{ marginLeft: "auto", marginRight: "auto", marginTop: 50}}
      >
        {!finished ? 
			failed ? 
				null :
          	<CircularProgress />
         : 
			failed ? 
				null
				:
          		"Done - this window should close within 3 seconds."
        }

        <div style={{marginTop: 10, }} />
        <b>{failed ? "Failed auth. Error: " : ""}</b> {response}
				<br/>
				<br/>
        {failed ? "If the error persists, try to use fewer scopes. Contact support@shuffler.io if you need further assistance, and include the current URL and a screenshot. You may now close this window." : ""}
      </Typography>
    </div>
  );
};

export default SetAuthentication;
