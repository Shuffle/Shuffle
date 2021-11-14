/* eslint-disable react/no-multi-comp */
import React, { useState } from "react";

import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

const LoginDialog = (props) => {
  const {
    classes,
    onClose,
    open,
    globalUrl,
    isLoggedIn,
    setIsLoggedIn,
    ...other
  } = props;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  //const [selectedValue, setSelectedValue] = useState(false);

  // Used to swap from login to register. True = login, false = register
  const [loginCheck, setLoginCheck] = useState(true);

  // Error messages etc
  const [loginInfo, setLoginInfo] = useState("");

  const handleValidateForm = () => {
    return username.length > 1 && password.length > 8;
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // Just use this one?
    var data =
      '{"username": "' + username + '", "password": "' + password + '"}';
    var baseurl = globalUrl;
    if (loginCheck) {
      var url = baseurl + "/login";
      fetch(url, {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) =>
          response.json().then((responseJson) => {
            console.log(responseJson);
            //console.log(e)
            if (responseJson["success"] === false) {
              setLoginInfo(responseJson["reason"]);
            } else {
              setLoginInfo("Successful login :)");
              onClose();
              setIsLoggedIn(true);
            }
          })
        )
        .catch((error) => {
          setLoginInfo("Error in userdata");
        });
    } else {
      url = baseurl + "/register";
      fetch(url, {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) =>
          response.json().then((responseJson) => {
            if (responseJson["success"] === false) {
              setLoginInfo(responseJson["reason"]);
            } else {
              setLoginInfo("Successful register. Please check your mail :)");
              onClose();
              setIsLoggedIn(true);
            }
          })
        )
        .catch((error) => {
          setLoginInfo("Error in userdata");
        });
    }
  };

  const onChangeUser = (e) => {
    setUsername(e.target.value);
  };

  const onChangePass = (e) => {
    setPassword(e.target.value);
  };

  const onClickRegister = () => {
    setLoginCheck(!loginCheck);
  };

  //var loginChange = loginCheck ? (<div><p onClick={setLoginCheck(false)}>Want to register? Click here.</p></div>) : (<div><p onClick={setLoginCheck(true)}>Go back to login? Click here.</p></div>);
  var formtitle = loginCheck ? <div>Login</div> : <div>Register</div>;
  var formButton = loginCheck ? (
    <div>Click to Register</div>
  ) : (
    <div>Click to Login</div>
  );

  return (
    <Dialog modal open={open} onClose={onClose} {...other}>
      <DialogTitle>{formtitle}</DialogTitle>
      <form onSubmit={onSubmit} style={{ margin: "15px 15px 15px 15px" }}>
        Username
        <div>
          <TextField
            required
            id="standard-required"
            autoComplete="username"
            margin="normal"
            variant="outlined"
            onChange={onChangeUser}
          />
        </div>
        Password
        <div>
          <TextField
            id="outlined-password-input"
            type="password"
            autoComplete="current-password"
            margin="normal"
            variant="outlined"
            onChange={onChangePass}
          />
        </div>
        <div style={{ display: "flex", marginTop: "15px" }}>
          <Button
            color="secondary"
            variant="contained"
            type="submit"
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
        {loginInfo}
      </form>
      <div style={{ display: "flex" }}>
        <Button
          color="secondary"
          variant="contained"
          onClick={onClickRegister}
          type="button"
          style={{ flex: "1" }}
        >
          {formButton}
        </Button>
      </div>
    </Dialog>
  );
};

export default LoginDialog;
