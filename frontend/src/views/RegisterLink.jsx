import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import Paper from "@material-ui/core/Paper";

const bodyDivStyle = {
  margin: "auto",
  textAlign: "center",
  width: "768px",
};

//const tmpdata = {
//	"username": "frikky",
//	"firstname": "fred",
//	"lastname": "ode",
//	"title": "topkek",
//	"companyname": "company here",
//	"email": "your email pls",
//	"phone": "PHONE!!",
//}

// FIXME - add fetch for data fields
// FIXME - remove tmpdata
// FIXME: Use isLoggedIn :)
const Settings = (defaultprops) => {
  const { globalUrl, isLoaded, surfaceColor } = defaultprops;

	const params = useParams();
	var props = JSON.parse(JSON.stringify(defaultprops))
	props.match = {}
	props.match.params = params

  const [firstRequest, setFirstRequest] = useState(true);
  const boxStyle = {
    flex: "1",
    marginLeft: "10px",
    marginRight: "10px",
    paddingLeft: "30px",
    paddingRight: "30px",
    paddingBottom: "30px",
    paddingTop: "30px",
    backgroundColor: surfaceColor,
    color: "white",
    display: "flex",
    flexDirection: "column",
  };

  const registerCall = () => {
    const url = globalUrl + "/api/v1/register/" + props.match.params.key;
    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          console.log(responseJson);
        })
      )
      .catch((error) => {
        console.log("SOMETHING WRONG");
      });
  };

  // This should "always" have data
  useEffect(() => {
    if (firstRequest) {
      setFirstRequest(false);
      registerCall();
    }
  });

  // Random names for type & autoComplete. Didn't research :^)
  const landingpageData = (
    <div style={{ display: "flex", marginTop: "80px" }}>
      <Paper style={boxStyle}>
        <h2>Registration verification</h2>
        <p>Thanks for verifying, redirecting you to our login!</p>
      </Paper>
    </div>
  );

  const loadedCheck = isLoaded ? (
    <div style={bodyDivStyle}>{landingpageData}</div>
  ) : (
    <div></div>
  );

  return <div>{loadedCheck}</div>;
};
export default Settings;
