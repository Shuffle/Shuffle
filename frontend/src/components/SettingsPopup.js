import React, { useState } from "react";

import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";

const SettingsDialog = (props) => {
  const {
    classes,
    onClose,
    settingsOpen,
    settingsData,
    globalUrl,
    isLoggedIn,
    setIsLoggedIn,
    ...other
  } = props;

  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [password3, setPassword3] = useState("");

  const handleValidateForm = () => {
    var passlength = 10;
    if (
      password1 === password2 &&
      password1.length >= passlength &&
      password3.length >= passlength
    ) {
      return true;
    }

    return false;
  };

  const onChangePass1 = (e) => {
    setPassword1(e.target.value);
  };

  const onChangePass2 = (e) => {
    setPassword2(e.target.value);
  };

  const onChangePass3 = (e) => {
    setPassword3(e.target.value);
  };

  const onSubmitPassReset = () => {
    console.log("Should change password");
    // Rofl, this can't possibly be typesafe
    var data =
      '{"password1": "' +
      password1 +
      '", "password2": "' +
      password2 +
      '", "password3": "' +
      password3 +
      '"}';

    fetch(globalUrl + "/passwordreset", {
      body: data,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
        if (responseJson.status === true) {
          console.log("SUCCESS");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  //PaperProps={{style: {minWidth: "500px"}}
  return (
    <Dialog open={settingsOpen} onClose={() => onClose()} {...other}>
      <DialogTitle>Settings</DialogTitle>
      <Divider />
      <div style={{ marginLeft: "15px", marginRight: "15px" }}>
        <h3>Username</h3>
        {settingsData.username}
      </div>
      <div
        style={{
          marginLeft: "15px",
          marginRight: "15px",
          marginBottom: "15px",
        }}
      >
        <h3>ApiKey</h3>
        <TextField
          id="outlined-read-only-input"
          defaultValue={settingsData.apikey}
          value={settingsData.apikey}
          style={{ width: 320 }}
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
        />
      </div>
      <Divider />
      <form style={{ margin: "15px 15px 15px 15px" }}>
        <h3>Change password</h3>
        <div>
          <TextField
            id="standard-password-input"
            label="Current password"
            type="password"
            name="password"
            style={{ width: 320 }}
            placeholder="********************************"
            autoComplete="current-password"
            margin="normal"
            variant="outlined"
            onChange={onChangePass1}
          />
        </div>
        <div>
          <TextField
            label="Confirm current password"
            type="password"
            placeholder="********************************"
            name="password"
            style={{ width: 320 }}
            autoComplete="current-password"
            margin="normal"
            variant="outlined"
            onChange={onChangePass2}
          />
        </div>
        <div>
          <TextField
            label="New password"
            type="password"
            name="password"
            placeholder="********************************"
            style={{ width: 320 }}
            margin="normal"
            variant="outlined"
            onChange={onChangePass3}
          />
        </div>
        <div style={{ display: "flex", marginTop: "10px" }}>
          <Button
            color="secondary"
            variant="contained"
            onClick={onSubmitPassReset}
            type="button"
            style={{ flex: "1", marginRight: "5px" }}
            disabled={!handleValidateForm()}
          >
            SUBMIT
          </Button>
          <Button
            color="primary"
            variant="contained"
            type="button"
            style={{ flex: "1" }}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default SettingsDialog;
