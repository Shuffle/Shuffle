import React, {  useState } from "react";

import { Typography, CircularProgress } from "@mui/material";

const SetAuthentication = (props) => {
  const { globalUrl } = props;

  const [firstRequest, setFirstRequest] = useState(true);
  const [finished, setFinished] = useState(false);
  const [response, setResponse] = useState("");
  const [failed, setFailed] = useState(false);

  if (firstRequest) {
    setFirstRequest(false);

    //code
    //session_state
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    // const authenticationStore = [];
    var appAuthData = {
      label: "",
      app: {
        name: "",
        id: "",
        app_version: "",
      },
      fields: [],
      type: "oauth2",
    };

    if (window !== undefined && window !== null) {
      console.log(window.location);
      appAuthData.fields.push({
        key: "redirect_uri",
        value: window.location.origin + window.location.pathname,
      });
    }

    if (params.code !== undefined && params.code !== null) {
      appAuthData.fields.push({ key: "code", value: params.code });
    }

    if (params.session_state !== undefined && params.session_state !== null) {
      appAuthData.fields.push({
        key: "session_state",
        value: params.session_state,
      });
    }

    if (params.state !== undefined && params.state !== null) {
      const paramsplit = params.state.split("&");
      console.log(paramsplit);
      for (var key in paramsplit) {
        const query = paramsplit[key].split("=");
        console.log(query);

        if (query.length !== 2) {
          console.log("INVALID QUERY: ", query);
          continue;
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
        }

        if (query[0] === "client_id") {
          appAuthData.fields.push({ key: "client_id", value: query[1] });
        }

        if (query[0] === "client_secret") {
          appAuthData.fields.push({ key: "client_secret", value: query[1] });
        }
      }
    }

    console.log(appAuthData);

    fetch(globalUrl + "/api/v1/apps/authentication", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(appAuthData),
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for oauth2 authentication");
          setFailed(true);
        }

        return response.json();
      })
      .then((responseJson) => {
        //setUserSettings(responseJson)
        console.log("Resp: ", responseJson);
        setFinished(true);
        setResponse(responseJson.reason);

        setTimeout(() => {
          window.close();
        }, 1000);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <div style={{ width: 1000, margin: "auto", itemAlign: "center" }}>
      <Typography
        variant="h6"
        style={{ marginLeft: "auto", marginRight: "auto", marginTop: 200 }}
      >
        {!finished ? (
          <CircularProgress />
        ) : (
          "DONE WITH AUTH - this will close soon!!"
        )}
        <div />
        {failed ? "Failed setup. Error: " : ""} {response}
      </Typography>
    </div>
  );
};

export default SetAuthentication;
