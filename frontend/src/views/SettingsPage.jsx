import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import theme from '../theme.jsx';
import {
  Grid,
  Typography,
  Paper,
  Button,
  Divider,
  TextField,
  Modal,
  Switch,
} from "@mui/material";
//import { useAlert
import { ToastContainer, toast } from "react-toastify";
import "../codeeditor-index.css";

import { FileCopy, Visibility, VisibilityOff } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import { Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Box } from "@mui/system";
import CircularProgress from "@mui/material/CircularProgress";


const Settings = (props) => {
  const { globalUrl, isLoaded, userdata, setUserData } = props;
  //const alert = useAlert();
	let navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState({});
  const [MFARequired, setMFARequired] = React.useState(false);
  const [image2FA, setImage2FA] = React.useState("");
  const [value2FA, setValue2FA] = React.useState("");

  // const [file, setFile] = React.useState("");
  // const [fileBase64, setFileBase64] = React.useState(
  //   userdata.image === undefined || userdata.image === null
  //     ? theme.palette.defaultImage
  //     : userdata.image
  // );
  const [loadedValidationWorkflows, setLoadedValidationWorkflows] =
    React.useState([]);
  const [selfOwnedWorkflows, setSelfOwnedWorkflows] = React.useState([]);
  const [loadedWorkflowCollections, setLoadedWorkflowCollections] =
    React.useState([]);

  // Used for error messages etc
  const [passwordFormMessage, setPasswordFormMessage] = useState("");
  const [firstrequest, setFirstRequest] = useState(true);
  const [userSettings, setUserSettings] = useState({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const [accountDeleteButtonClicked, setAccountDeleteButtonClicked] = useState(false);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(userSettings.apikey);
    setApiKeyCopied(true);
    setTimeout(() => {
      setApiKeyCopied(false);
    }, 2000);
  }

  //Returns the value from a storage position at a given address.
  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io"

  const bodyDivStyle = {
    margin: "auto",
    textAlign: "center",
    width: "1100px",
  };

  const boxStyle = {
    flex: "1",
    color: "white",
    position: "relative",
    marginLeft: "10px",
    marginRight: "10px",
    paddingLeft: "30px",
    paddingRight: "30px",
    paddingBottom: "30px",
    paddingTop: "30px",
    backgroundColor: theme.palette.surfaceColor,
    display: "flex",
    flexDirection: "column",
  };

  useEffect(() => {
    if (userdata.active_org === undefined || userdata.active_org === null || userdata.active_org.id === undefined || userdata.active_org.id === null) {
      return;
    }

    fetch(`${globalUrl}/api/v1/orgs/${userdata.active_org.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        console.log("Received response:", response);
        if (response.status !== 200) {
          console.error("Status not 200:", response.status);
          throw new Error(`Status not 200: ${response.status}`);
        }
        return response.json();
      })
      .then((responseJson) => {
        setSelectedOrganization(responseJson);
        setMFARequired(responseJson.mfa_required);
      })
      .catch((error) => {
        console.error("Error fetching organization:", error);
      });
  }, [userdata]);

  const UpdateMFAInUserOrg = (org_id) => {

    if (MFARequired === false) {
      toast("Making MFA required for your organization. Please wait...");
    } else {
      toast("Making MFA optional for your organization. Please wait...");
    }

    const data = {
      mfa_required: !selectedOrganization.mfa_required,
      org_id: selectedOrganization.id,
    }

    const url = globalUrl + `/api/v1/orgs/${selectedOrganization.id}`;
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
          console.log(responseJson)
          if (responseJson["success"] === false) {
            toast.error("Failed updating org: ", responseJson.reason);
          } else {
            if (MFARequired === false) {
              setMFARequired(true)
              toast.success("Successfully make MFA required for your organization!");
            } else {
              setMFARequired(false)
              toast.success("Successfully make MFA optional for your organization!")
            }
          }
        }),
      )
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  }

  const checkOwner = (data, userdata) => {
    var currentOwner = false;
    if (data.owner.address === userdata.eth_info.account) {
      currentOwner = true;
    } else {
      if (
        data.top_ownerships !== undefined &&
        data.top_ownerships !== null &&
        data.top_ownerships.length === 1
      ) {
        for (var key in data.top_ownerships) {
          if (
            data.top_ownerships[key].owner.address === userdata.eth_info.account
          ) {
            currentOwner = true;
            break;
          }
        }
      }
    }

    return currentOwner;
  };

  const handleAccountDelete = () => {
    setAccountDeleteButtonClicked(true);
  };

  const DeleteAccountPopUp = () => {
    const [userDeleteAccepted, setUserDeleteAccepted] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [open, setOpen] = useState(true);

    const boxStyling = {
      position: "relative",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "9999",
      backgroundColor: "#1a1a1a",
      color: "white",
      padding: 20,
      borderRadius: 5,
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
      width: 430,
      height: 430,
    };

    const closeIconButtonStyling = {
      color: "white",
      border: "none",
      backgroundColor: "transparent",
      marginLeft: "90%",
      width: 20,
      height: 20,
      cursor: "pointer",
    };

    const handlePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const buttonStyle = {
      marginTop: 20,
      height: 50,
      border: "none",
      width: "100%",
      fontSize: 16,
      backgroundColor: disabled ? "gray" : "red",
      color: "white",
      cursor: disabled === false && "pointer",
    };
    const checkboxStyle = {
      position: "relative",
      cursor: "pointer",
      display: "inline-block",
      width: 20,
      height: 20,
      backgroundColor: "#ccc",
      borderRadius: 4,
    };

    const checkmarkStyle = {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      content: "",
      width: 10,
      height: 10,
      backgroundColor: "#fff",
      borderRadius: 2,
      display: "none",
    };


    const handlePasswordChange = (e) => {
      setPassword(e.target.value);
    };

    const handleCheckBoxEvent = () => {
      setUserDeleteAccepted(!userDeleteAccepted);
    };

    useEffect(() => {
      if (password.length > 8 && userDeleteAccepted) {
        setDisabled(false);
      } else {
        setDisabled(true);
      }
    }, [password, userDeleteAccepted]);

    function removeAllCookies() {
      
      var cookies = document.cookie.split(";");
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    }

    const handleDeleteAccount = () => {
      const baseURL = globalUrl;
      const userID = userdata.id;

      const url = `${baseURL}/api/v1/users/${userID}/remove`;

      fetch(url, {
        mode: "cors",
        method: "DELETE",
        body: JSON.stringify({ password }),
        credentials: "include",
        crossDomain: true,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            toast.success(
              "Your account delete successfully! redirecting in 3 sec.."
            );
            removeAllCookies();

            window.location.pathname = "/";
          } else {
            toast.error(`${data.reason}`);
          }
        })
        .catch((error) => {
          console.error(
            "There was a problem with your fetch operation:",
            error
          );
        });
    };

    return (
      <Modal open= {open} >
      <div style={boxStyling}>
        <button
          style={closeIconButtonStyling}
          onClick={() => setAccountDeleteButtonClicked(false)}
        >
          <CloseIcon />
        </button>
        <h1 style={{textAlign:"center", margin : "0 0 20px 0"}}>Account</h1>
      {/* <div style={{paddingLeft: 15}} > */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
            // paddingLeft: 15
            // marginLeft: 20
          }}
        >
          <label>If you delete your account then:</label>
          <ul style={{ textAlign: "left" }}>
            <li>
              <label>
                Your Account information will be removed from our Database
                permanently.
              </label>
            </li>
            <li>
              <label>This action cannot be reversed.</label>
            </li>
          </ul>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input
              checked={userDeleteAccepted}
              type="checkbox"
              className="ais-RefinementList-checkbox"
              onClick={handleCheckBoxEvent}
            />
            <label style={{ fontSize: "16px", color: "white" }}>
              I have read the above information and I agree to it completely
            </label>
          </div>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label>Enter password to delete your account</label>
            <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  flex: "1",
                }}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                placeholder="Password"
                id="standard-required"
                autoComplete="off"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handlePasswordVisibility}
                      style={{color:"white"}}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
          </div>
          <button
            style={buttonStyle}
            disabled={disabled}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
        </div>
      </div>
      </Modal>
    );
  };

  const onPasswordChange = () => {
    const data = {
      username: userSettings.username,
      currentpassword: currentPassword,
      newpassword: newPassword,
      newpassword2: newPassword2,
    };
    const url = globalUrl + "/api/v1/passwordchange";
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
          } else {
            toast("Changed password!");
            setPasswordFormMessage("");
          }
        })
      )
      .catch((error) => {
        setPasswordFormMessage("Something went wrong.");
      });
  };

  const loadWorkflowOwnership = () => {
    fetch(
      globalUrl + "/api/v1/workflows/collections/untitled-collection-103712081",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("Values: ", responseJson)

        //	const [selfOwnedWorkflows, setSelfOwnedWorkflows] = React.useState([])
        if (responseJson !== undefined && responseJson !== null) {
          const filteredOwnerships = responseJson.filter(
            (data) => checkOwner(data, userdata) === true
          );
          if (
            filteredOwnerships !== undefined &&
            filteredOwnerships !== null &&
            filteredOwnerships.length > 0
          ) {
            setSelfOwnedWorkflows(filteredOwnerships);
          }

          var collections = [];
          for (var key in responseJson) {
            var collectionname = responseJson[key].collection.name;
            if (!collections.includes(collectionname)) {
              collections.push(collectionname);
            }
          }

          console.log(collections);
          setLoadedWorkflowCollections(collections);
          setLoadedValidationWorkflows(responseJson);

          setTimeout(() => {
            window.scrollTo({
              top: document.body.scrollHeight,
              left: 0,
              behavior: "smooth",
            });
          }, 250);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const generateApikey = () => {
    fetch(globalUrl + "/api/v1/generateapikey", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        setUserSettings(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getSettings = () => {
    fetch(globalUrl + "/api/v1/getsettings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        }


        return response.json();
      })
      .then((responseJson) => {
        setUserSettings(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Gotta be a better way of doing this rofl
  const setFields = () => {
    if (userdata.username !== undefined) {
      if (userdata.username.length > 0) {
        setUsername(userdata.username);
      }
      //if (userdata.firstname.length > 0) {
      //	setFirstname(userdata.firstname)
      //}
      //if (userdata.lastname.length > 0) {
      //	setLastname(userdata.lastname)
      //}
      //if (userdata.title.length > 0) {
      //	setTitle(userdata.title)
      //}
      //if (userdata.companyname.length > 0) {
      //	setCompanyname(userdata.companyname)
      //}
      //if (userdata.phone.length > 0) {
      //	setPhone(userdata.phone)
      //}
      //if (userdata.email.length > 0) {
      //	setEmail(userdata.email)
      //}
    }
  };

  // This should "always" have data
  useEffect(() => {
    if (firstrequest) {
      setFirstRequest(false);
      getSettings();
      //registerProviders(userdata)
    }

    if (
      Object.getOwnPropertyNames(userdata).length > 0 &&
      username === "" &&
      email === ""
    ) {
      setFields();
    }
  });

  const ParsedWorkflowView = (props) => {
    const { data } = props;

    var innerPaperStyle = {
      backgroundColor: theme.palette.inputColor,
      display: "flex",
      flexDirection: "column",
      padding: "0px 0px 12px 0px",
      borderRadius: theme.palette?.borderRadius,
    };

    const currentOwner = checkOwner(data, userdata);
    if (currentOwner === true) {
      innerPaperStyle.border = "3px solid #f86a3e";
    }

    return (
      <Grid item xs={4} style={{ borderRadius: theme.palette?.borderRadius }}>
        <Paper style={innerPaperStyle}>
          <img
            src={data.image}
            alt={data.name}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <Typography variant="body2" color="textSecondary">
            {data.collection}
          </Typography>
          <Typography variant="body2">{data.name}</Typography>
        </Paper>
      </Grid>
    );
  };


	const runFlex = userdata.eth_info !== undefined && userdata.eth_info.account !== undefined &&
		userdata.eth_info.account.length > 0 && userdata.eth_info.parsed_balance !== undefined 

  // Random names for type & autoComplete. Didn't research :^)
  //var imageData = file.length > 0 ? file : fileBase64;
  //imageData = imageData === undefined || imageData.length === 0
  //    ? theme.palette.defaultImage
  //    : imageData;

	const imageData = userSettings.image === undefined || userSettings.image == null || userSettings.image.length === 0 ? theme.palette.defaultImage : userSettings.image
  const imageInfo = (
    <img
      src={imageData}
      alt="Click to upload an image (174x174)"
      id="logo"
			onClick={() => {
				if (imageData !== theme.palette.defaultImage) {
					navigate(`/creators/${userdata.public_username}`)
				} else {
					navigate(`/creators`)
				}
			}}
      style={{
				cursor: "pointer",
        maxWidth: 100,
        maxHeight: 100,
        minWidth: 100,
        minHeight: 100,
        position: "absolute",
        top: -80,
        left: 1020 / 2 - 25,
        borderRadius: 50,
        objectFit: "contain",
        border: "2px solid rgba(255,255,255,0.7)",
      }}
    />
  );

  const landingpageData = (
    <div style={{ display: "flex", paddingTop: 120 }}>
      <Paper style={boxStyle}>
        {imageInfo}
        <h2>Settings</h2>
        <div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
          <TextField
            style={{ backgroundColor: theme.palette.inputColor, flex: "1" }}
            InputProps={{
              style: {
                height: "50px",
                color: "white",
              },
            }}
            color="primary"
            required
            disabled
            fullWidth={true}
            value={username}
            placeholder="Username"
            type="username"
            id="standard-required"
            autoComplete="username"
            margin="normal"
            variant="outlined"
            //onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              flex: "1",
              marginRight: "15px",
            }}
            InputProps={{
              style: {
                height: "50px",
                color: "white",
              },
            }}
            color="primary"
            required
            fullWidth={true}
            value={firstname}
            placeholder="First Name"
            type="firstname"
            disabled
            id="standard-required"
            autoComplete="firstname"
            margin="normal"
            variant="outlined"
            onChange={(e) => setFirstname(e.target.value)}
          />
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              flex: "1",
              marginLeft: "15px",
            }}
            InputProps={{
              style: {
                height: "50px",
                color: "white",
              },
            }}
            color="primary"
            required
            value={lastname}
            fullWidth={true}
            placeholder="Last Name"
            disabled
            type="lastname"
            id="standard-required"
            autoComplete="lastname"
            margin="normal"
            variant="outlined"
            onChange={(e) => setLastname(e.target.value)}
          />
        </div>
        <h2>APIKEY</h2>
        <a
          target="_blank"
          href="/docs/API#authentication"
          style={{ textDecoration: "none", color: "#f85a3e" }}
        >
          What is the API key used for?
        </a>
        {/* <TextField
          style={{ backgroundColor: theme.palette.inputColor, flex: "1" }}
          InputProps={{
            style: {
              height: "50px",
              color: "white",
            },
          }}
          color="primary"
          value={userSettings.apikey}
          required
          disabled
          fullWidth={true}
          placeholder="APIKEY"
          id="standard-required"
          margin="normal"
          variant="outlined"
        /> */}
        <TextField
        style={{ backgroundColor: theme.palette.inputColor, flex: "1" }}
        InputProps={{
          style: {
            height: "50px",
            color: "white",
          },
          endAdornment: (
            <>
            <Tooltip title={showApiKey ? "Hide API Key" : "Show API Key"}>
              <IconButton
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Tooltip title={apiKeyCopied ? "API Key copied!" : "Copy API Key"}>
              <IconButton
                onClick={handleCopyApiKey}
              >
                <FileCopy />
              </IconButton>
            </Tooltip>
          </>
          ),
        }}
        color="primary"
        value={showApiKey ? userSettings.apikey : '*'.repeat(36)} // Show API key if showApiKey is true, else show asterisks
        required
        disabled
        fullWidth
        placeholder="APIKEY"
        id="standard-required"
        margin="normal"
        variant="outlined"
      />
        <Button
          style={{ width: "100%", height: "40px", marginTop: "10px" }}
          variant="outlined"
          color="primary"
          onClick={() => generateApikey()}
        >
          Re-Generate APIKEY
        </Button>
        <Divider style={{ marginTop: "40px" }} />
        {/*
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginRight: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							placeholder="Job Title"
							value={title}
							type="jobtitle"
						  	id="standard-required"
							autoComplete="jobtitle"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setTitle(e.target.value)}
						/>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginLeft: "15px"}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							type="companyname"
							value={companyname}
							placeholder="Company Name"
						  	id="standard-required"
							autoComplete="companyname"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setCompanyname(e.target.value)}
						/>
					</div>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginRight: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							placeholder="Email"
							type="email"
							value={email}
						  	id="standard-required"
							autoComplete="email"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setEmail(e.target.value)}
						/>
						<TextField
							style={{backgroundColor: theme.palette.inputColor, flex: "1", marginLeft: "15px",}}
							InputProps={{
								style:{
									height: "50px", 
									color: "white",
								},
							}}
							color="primary"
							required
							fullWidth={true}
							type="phone"
							value={phone}
							placeholder="Phone number"
						  	id="standard-required"
							autoComplete="phone"
							margin="normal"
							variant="outlined"
      	 					onChange={e => setPhone(e.target.value)}
						/>
					</div>
					<Button
						disabled={firstname.length <= 0 || lastname.length <= 0 || title.length <= 0 || companyname.length <= 0 || email.length <= 0 || phone.length <= 0}
						style={{width: "100%", height: "40px", marginTop: "10px"}}
						variant="contained"
						color="primary"
						onClick={() => console.log("SUBMIT NORMAL INFO!!")}
					>
					Submit	
					</Button>
					<h3>{formMessage}</h3>
					<Divider />
					*/}
        <h2>Password</h2>
        <div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
          <TextField
            style={{ backgroundColor: theme.palette.inputColor, flex: "1" }}
            InputProps={{
              style: {
                height: "50px",
                color: "white",
              },
            }}
            color="primary"
            required
            fullWidth={true}
            placeholder="Current Password"
            type="password"
            id="standard-required"
            autoComplete="password"
            margin="normal"
            variant="outlined"
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              flex: "1",
              marginRight: "15px",
            }}
            InputProps={{
              style: {
                height: "50px",
                color: "white",
              },
            }}
            color="primary"
            required
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
            style={{
              backgroundColor: theme.palette.inputColor,
              flex: "1",
              marginLeft: "15px",
            }}
            InputProps={{
              style: {
                height: "50px",
                color: "white",
              },
            }}
            color="primary"
            required
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
            (isCloud &&
              (newPassword.length < 10 ||
                newPassword2.length < 10 ||
                currentPassword.length < 10)) ||
            newPassword !== newPassword2 ||
            newPassword.length === 0
          }
          style={{ width: "100%", height: "60px", marginTop: "10px" }}
          variant="contained"
          color="primary"
          onClick={() => onPasswordChange()}
        >
          Submit password change
        </Button>
        <h3>{passwordFormMessage}</h3>

        {isCloud && (
          <>
            <Divider style={{ marginTop: "40px" }} />
            <h2>Creator Incentive Program</h2>
          </>
        )}

        <div style={{ display: runFlex ? "flex" : "", width: "100%" }}>
			<div>
			{isCloud ?
					<span>
						<Typography variant="body1" color="textSecondary">
							By <a href="/creators" target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>joining the Creator Incentive Program</a> and connecting your Github account, you agree to our <a href="/docs/terms_of_service" target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>Terms of Service</a>, and acknowledge that your non-sensitive data will be turned into a <a target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}} href="https://shuffler.io/creators">creator account</a>. This enables you to earn a passive income from Shuffle. This IS reversible. Support: support@shuffler.io
						</Typography>
						<Button
							style={{ height: 40, marginTop: 10 }}
							variant="outlined"
							color="primary"
							fullWidth={true}
							onClick={() => {
								handleGithubConnection();
							}}
						>
							Connect to Github
						</Button>
					</span>
				: null}
			</div>
          <div style={{ flex: 1, display: "flex" }}>
            <div>
              {userdata.eth_info !== undefined &&
              userdata.eth_info.account !== undefined &&
              userdata.eth_info.account.length > 0 &&
              userdata.eth_info.parsed_balance !== undefined ? (
                <div
                  style={{ marginTop: 10, display: "flex", maxHeight: 163.75 }}
                >
                  <Paper
                    square
                    style={{
                      borderRadius: theme.palette?.borderRadius,
                      padding: 50,
                      backgroundColor: theme.palette.inputColor,
                    }}
                  >
                    <Typography>
                      <img
                        src="/images/social/ethereum.png"
                        alt="ethereum-icon"
                        style={{ height: 30 }}
                      />
                    </Typography>
                    <Typography>
                      {/*window.ethereum.fromWei(userdata.eth_info.balance, "ether")*/}
                      {userdata.eth_info.parsed_balance.toFixed(4)} ETH
                    </Typography>
                  </Paper>
                </div>
              ) : null}
            </div>
						{userdata.eth_info !== undefined &&
						userdata.eth_info.account !== undefined &&
						userdata.eth_info.account.length > 0 &&
						userdata.eth_info.parsed_balance !== undefined ? (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                maxHeight: 163.75,
                marginLeft: 10,
              }}
            >
              <Paper
                square
                style={{
                  borderRadius: theme.palette?.borderRadius,
                  padding: 50,
                  backgroundColor: theme.palette.inputColor,
                }}
              >
                <Typography variant="body2">Owned Workflows</Typography>
                <Typography variant="h6">
                  {selfOwnedWorkflows.length}
                </Typography>
              </Paper>
            </div>
						) : null}
          </div>
          <div style={{ flex: 1, marginTop: 20 }}>
          </div>
        </div>

	  	<h2>Danger Area</h2>
        <Button
          style={{
            width: "100%",
            height: "60px",
            marginTop: "10px",
            backgroundColor: "#d52b2b",
            color: "white",
          }}
          // variant="contained"
          // color="primary"
          onClick={handleAccountDelete}
        >
          Delete Account
        </Button>

        {loadedValidationWorkflows !== undefined &&
        loadedValidationWorkflows !== null
          ? loadedValidationWorkflows.map((data, index) => {
              return (
                <Grid container spacing={3} style={{ marginTop: 15 }}>
                  <ParsedWorkflowView key={index} data={data} />
                </Grid>
              );
            })
          : null}
      </Paper>
      {accountDeleteButtonClicked && <DeleteAccountPopUp/>}
    </div>
  );

  /*
		0x1	1	Ethereum Main Network (Mainnet)
		0x3	3	Ropsten Test Network
		0x4	4	Rinkeby Test Network
		0x5	5	Goerli Test Network
		0x2a	42	Kovan Test Network
	*/
  const setUser = (userId, field, value) => {
    const data = { user_id: userId };
    data[field] = value;

    fetch(globalUrl + "/api/v1/users/updateuser", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success && responseJson.reason !== undefined) {
          toast("Failed updating user: " + responseJson.reason);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleGithubConnection = () => {
		console.log("GITHUB CONNECT WOO: ", isCloud)
  	//result = RestClient.post('https://github.com/login/oauth/access_token',

		console.log("HOST: ", window.location.host);
		console.log("Location: ", window.location);
		const redirectUri = isCloud
			? window.location.host === "localhost:3002"
				? "http%3A%2F%2Flocalhost:3002%2Fset_authentication"
				: "https%3A%2F%2Fshuffler.io%2Fset_authentication"
			: window.location.protocol === "http:" ? 
				`http%3A%2F%2F${window.location.host}%2Fset_authentication`
				:
				`https%3A%2F%2F${window.location.host}%2Fset_authentication`

		console.log("redirect: ", redirectUri)

    const client_id = "3d272b1b782b100b1e61"
    const username = userdata.id;
    const scopes = "read:user";

    const url = `https://github.com/login/oauth/authorize?access_type=offline&prompt=consent&client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=username%3D${username}%26type%3Dgithub`

    console.log("URL: ", url);

    var newwin = window.open(url, "", "width=800,height=600");

    // Check whether we got a callback somewhere
    //var id = setInterval(function () {
    //	fetch(
    //		globalUrl + "/api/v1/triggers/gmail/" + selectedTrigger.id,
    //		{
    //			method: "GET",
    //			headers: { "content-type": "application/json" },
    //			credentials: "include",
    //		}
    //	)
    //		.then((response) => {
    //			if (response.status !== 200) {
    //				throw new Error("No trigger info :o!");
    //			}

    //			return response.json();
    //		})
    //		.then((responseJson) => {
    //			console.log("RESPONSE: ");
    //			setTriggerAuthentication(responseJson);
    //			clearInterval(id);
    //			newwin.close();
    //			setGmailFolders();
    //		})
    //		.catch((error) => {
    //			console.log(error.toString());
    //		});
    //}, 2500);

    //saveWorkflow(workflow);
  }

  const loadedCheck =
    isLoaded && !firstrequest ? (
      <div style={bodyDivStyle}>{landingpageData}</div>
    ) : (
      <div></div>
    );

  return <div>{loadedCheck}</div>;
};
export default Settings;
