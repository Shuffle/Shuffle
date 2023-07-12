/* eslint-disable react/no-multi-comp */
import React, { useState } from "react";
import { makeStyles } from "@mui/styles";

import {
  CircularProgress,
  TextField,
  Button,
  Paper,
  Typography,
} from "@mui/material";

const bodyDivStyle = {
  margin: "auto",
  marginTop: "100px",
  width: "500px",
};

const surfaceColor = "#27292D";
const inputColor = "#383B40";

const boxStyle = {
  paddingLeft: "30px",
  paddingRight: "30px",
  paddingBottom: "30px",
  paddingTop: "30px",
  backgroundColor: surfaceColor,
};

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
});

const AdminAccount = (props) => {
  const { globalUrl, isLoaded, isLoggedIn } = props;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstRequest, setFirstRequest] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // Used to swap from login to register. True = login, false = register
  const register = true;

  const classes = useStyles();
  // Error messages etc
  const [loginInfo, setLoginInfo] = useState("");

  const handleValidateForm = () => {
    return username.length > 1 && password.length > 1;
  };

  if (isLoggedIn === true) {
    window.location.pathname = "/workflows";
  }

  const checkAdmin = () => {
    const url = globalUrl + "/api/v1/checkusers";
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            setLoginInfo(responseJson["reason"]);
          } else {
            if (responseJson.reason === "redirect") {
              window.location.pathname = "/login";
            }
          }
        })
      )
      .catch((error) => {
        setLoginInfo("Error in userdata: ", error);
      });
  };

  if (firstRequest) {
    setFirstRequest(false);
    checkAdmin();
  }

  const onSubmit = (e) => {
    setLoginLoading(true);
    e.preventDefault();
    // FIXME - add some check here ROFL

    // Just use this one?
    var data = { username: username, password: password };
    var baseurl = globalUrl;
    const url = baseurl + "/api/v1/register";
    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          setLoginLoading(false);
          if (responseJson["success"] === false) {
            setLoginInfo(responseJson["reason"]);
          } else {
            setLoginInfo("Successful register :)");
            window.location.pathname = "/login";
          }
        })
      )
      .catch((error) => {
        setLoginLoading(false);
        setLoginInfo("Error in userdata: ", error);
      });
  };

  const onChangeUser = (e) => {
    setUsername(e.target.value);
  };

  const onChangePass = (e) => {
    setPassword(e.target.value);
  };

  //const onClickRegister = () => {
  //	if (props.location.pathname === "/login") {
  //		window.location.pathname = "/register"
  //	} else {
  //		window.location.pathname = "/login"
  //	}

  //	setLoginCheck(!register)
  //}

  //var loginChange = register ? (<div><p onClick={setLoginCheck(false)}>Want to register? Click here.</p></div>) : (<div><p onClick={setLoginCheck(true)}>Go back to login? Click here.</p></div>);
  var formtitle = register ? <div>Login</div> : <div>Register</div>;

  formtitle = "Create administrator account";

  const basedata = (
    <div style={bodyDivStyle}>
      <Paper style={boxStyle}>
        <form
          onSubmit={onSubmit}
          style={{ color: "white", margin: "15px 15px 15px 15px" }}
        >
          <h2>{formtitle}</h2>
          Username
          <div>
            <TextField
              color="primary"
              style={{ backgroundColor: inputColor }}
              autoFocus
              InputProps={{
                classes: {
                  notchedOutline: classes.notchedOutline,
                },
                style: {
                  height: "50px",
                  color: "white",
                  fontSize: "1em",
                },
              }}
              required
              fullWidth={true}
              autoComplete="username"
              placeholder="username@example.com"
              id="emailfield"
              margin="normal"
              variant="outlined"
              onChange={onChangeUser}
            />
          </div>
          Password
          <div>
            <TextField
              color="primary"
              style={{ backgroundColor: inputColor }}
              InputProps={{
                classes: {
                  notchedOutline: classes.notchedOutline,
                },
                style: {
                  height: "50px",
                  color: "white",
                  fontSize: "1em",
                },
              }}
              required
              id="outlined-password-input"
              fullWidth={true}
              type="password"
              autoComplete="current-password"
              placeholder="**********"
              margin="normal"
              variant="outlined"
              onChange={onChangePass}
            />
          </div>
          <div style={{ display: "flex", marginTop: "15px" }}>
            <Button
              color="primary"
              variant="contained"
              type="submit"
              style={{ flex: "1", marginRight: "5px" }}
              disabled={!handleValidateForm() || loginLoading}
            >
              {loginLoading ? (
                <CircularProgress
                  color="secondary"
                  style={{ color: "white" }}
                />
              ) : (
                "SUBMIT"
              )}
            </Button>
          </div>
          <div style={{ marginTop: "10px" }}>{loginInfo}</div>
        </form>
      </Paper>
    </div>
  );

  const loadedCheck = isLoaded ? <div>{basedata}</div> : <div></div>;

  return <div>{loadedCheck}</div>;
};

export default AdminAccount;
