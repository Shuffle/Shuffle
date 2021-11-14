/* eslint-disable react/no-multi-comp */
import React, { useState } from "react";

import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";

const bodyDivStyle = {
  margin: "auto",
  marginTop: "100px",
  width: "500px",
};

const ForgotPassword = (props) => {
  const { globalUrl, isLoaded, isLoggedIn, surfaceColor, inputColor } = props;

  const boxStyle = {
    paddingLeft: "30px",
    paddingRight: "30px",
    paddingBottom: "30px",
    paddingTop: "30px",
    backgroundColor: surfaceColor,
  };

  const [username, setUsername] = useState("");
  const [resetInfo, setResetInfo] = useState(
    "You will receive an email with instructions shortly."
  );

  const handleValidateForm = () => {
    return username.length > 3;
  };

  if (isLoggedIn === true) {
    window.location.pathname = "/";
  }

  const onSubmit = (e) => {
    e.preventDefault();
    // FIXME - add some check here ROFL

    // Just use this one?
    var data = { username: username };
    var baseurl = globalUrl;
    var url = baseurl + "/api/v1/passwordresetmail";
    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            setResetInfo(responseJson["reason"]);
          }
        })
      )
      .catch((error) => {
        setResetInfo("Error in userdata: " + error);
      });
  };

  const onChangeUser = (e) => {
    setUsername(e.target.value);
  };

  const data = (
    <div style={bodyDivStyle}>
      <Paper style={boxStyle}>
        <form onSubmit={onSubmit} style={{ margin: "15px 15px 15px 15px" }}>
          <h2>Password reset</h2>
          <div>
            <TextField
              required
              fullWidth={true}
              color="primary"
              style={{ backgroundColor: inputColor }}
              InputProps={{
                style: {
                  height: "50px",
                  color: "white",
                  fontSize: "1em",
                },
              }}
              type="username"
              placeholder="Username / Email"
              id="standard-required"
              autoComplete="username"
              margin="normal"
              variant="outlined"
              onChange={onChangeUser}
            />
          </div>
          <div style={{ display: "flex", marginTop: "15px" }}>
            <Button
              color="primary"
              variant="contained"
              type="submit"
              style={{ flex: "1", marginRight: "5px" }}
              disabled={!handleValidateForm()}
            >
              SUBMIT
            </Button>
          </div>
          <div style={{ marginTop: "20px" }}>{resetInfo}</div>
        </form>
      </Paper>
    </div>
  );

  const loadedCheck = isLoaded ? <div>{data}</div> : <div></div>;

  return <div>{loadedCheck}</div>;
};

export default ForgotPassword;
