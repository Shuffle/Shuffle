import React, { useState, useEffect } from "react";

import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import TextField from "@material-ui/core/TextField";

const bodyDivStyle = {
  margin: "auto",
  textAlign: "center",
  width: "768px",
};

const boxStyle = {
  flex: "1",
  marginLeft: "10px",
  marginRight: "10px",
  paddingLeft: "30px",
  paddingRight: "30px",
  paddingBottom: "30px",
  paddingTop: "30px",
  backgroundColor: "#e8eaf6",
  display: "flex",
  flexDirection: "column",
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
const Settings = (props) => {
  const { globalUrl, isLoaded } = props;

  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [passwordFormMessage, setPasswordFormMessage] = useState("");

  const onPasswordChange = () => {
    const data = {
      newpassword: newPassword,
      newpassword2: newPassword2,
      reference: props.match.params.key,
    };
    const url = globalUrl + "/api/v1/passwordreset";
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
            setPasswordFormMessage(responseJson["reason"]);
          }
        })
      )
      .catch((error) => {
        setPasswordFormMessage("Something went wrong.");
      });
  };

  // This should "always" have data
  useEffect(() => {});

  // Random names for type & autoComplete. Didn't research :^)
  const landingpageData = (
    <div style={{ display: "flex", marginTop: "80px" }}>
      <Paper style={boxStyle}>
        <h2>Password Reset</h2>
        <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
          <TextField
            required
            style={{ flex: "1" }}
            fullWidth={true}
            placeholder="New password"
            type="password"
            id="standard-required"
            autoComplete="password"
            margin="normal"
            variant="outlined"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            required
            style={{ flex: "1" }}
            fullWidth={true}
            type="password"
            placeholder="Repeat new password"
            id="standard-required"
            margin="normal"
            variant="outlined"
            onChange={(e) => setNewPassword2(e.target.value)}
          />
        </div>
        <Button
          disabled={
            newPassword.length < 10 ||
            newPassword2.length < 10 ||
            newPassword !== newPassword2
          }
          style={{ width: "100%", height: "60px", marginTop: "10px" }}
          variant="contained"
          color="primary"
          onClick={() => onPasswordChange()}
        >
          Submit password change
        </Button>
        <h3>{passwordFormMessage}</h3>
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
