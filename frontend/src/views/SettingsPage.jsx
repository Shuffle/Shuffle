import React, { useState, useEffect } from "react";

import {
  Grid,
  Typography,
  Paper,
  Button,
  Divider,
  TextField,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { useAlert } from "react-alert";
import { useTheme } from "@material-ui/core/styles";

import detectEthereumProvider from "@metamask/detect-provider";

const Settings = (props) => {
  const { globalUrl, isLoaded, userdata, setUserData } = props;
  const theme = useTheme();
  const alert = useAlert();

  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [title, setTitle] = useState("");
  const [companyname, setCompanyname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [file, setFile] = React.useState("");
  const [fileBase64, setFileBase64] = React.useState(
    userdata.image === undefined || userdata.image === null
      ? theme.palette.defaultImage
      : userdata.image
  );
  const [loadedValidationWorkflows, setLoadedValidationWorkflows] =
    React.useState([]);
  const [selfOwnedWorkflows, setSelfOwnedWorkflows] = React.useState([]);
  const [loadedWorkflowCollections, setLoadedWorkflowCollections] =
    React.useState([]);

  // Used for error messages etc
  const [formMessage] = useState("");
  const [passwordFormMessage, setPasswordFormMessage] = useState("");

  const [firstrequest, setFirstRequest] = useState(true);

  const [userSettings, setUserSettings] = useState({});

  /*
	const [userdata.eth_info, setEthInfo] = useState(userdata.eth_info !== undefined && userdata.eth_info.account !== undefined && userdata.eth_info.account.length > 0 ? userdata.eth_info : {
		"account": "",
		"balance": "", 
	})
	*/

  /*
	console.log(userdata.eth_info)
	if (userdata.eth_info.account.length === 0 && userdata.eth_info !== undefined && userdata.eth_info.account !== undefined && userdata.eth_info.account.length > 0) {
		setEthInfo(userdata.eth_info)
	} else if (userdata.eth_info.balance.length > 0 && userdata.eth_info.parsed_balance === undefined) {
		//console.log(window.ethereum)
		//console.log(window.ethereum.utils.formatEther(userdata.eth_info.balance))
		const parsed_balance = parseInt(userdata.eth_info.balance, 16)/1000000000000000000
		console.log("Parsed balance: ", parsed_balance)
		userdata.eth_info.parsed_balance = parsed_balance
		userdata.eth_info.parsed_balance = parsed_balance
		setEthInfo(userdata.eth_info)
	} else if (userdata.eth_info !== undefined && userdata.eth_info.balance !== userdata.eth_info.balance) {
		console.log("Updating balance: ", userdata.eth_info)
		setEthInfo(userdata.eth_info)
	}
	*/

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
            alert.success("Changed password!");
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

  const registerProviders = (userdata) => {
    // Register hooks here
    detectEthereumProvider().then((provider) => {
      if (provider) {
        if (!provider.isMetaMask) {
          alert.error("Only MetaMask is supported as of now.");
          return;
        }

        // Find the ethereum network
        // Get the users' account(s)
        //alert.info("Connecting to MetaMask")
        //console.log("Connected: ", provider.isConnected())

        if (!provider.isConnected()) {
          alert.error("Metamask is not connected.");
          return;
        }

        provider.on("message", (event) => {
          alert.info("Ethereum message: ", event);
        });

        provider.on("chainChanged", (chainId) => {
          console.log("Changed chain to: ", chainId);

          const method = "eth_getBalance";
          const params = [userdata.eth_info.account, "latest"];
          provider
            .request({
              method: method,
              params,
            })
            .then((result) => {
              console.log("Got result: ", result);
              if (result !== undefined && result !== null) {
                userdata.eth_info.balance = result;
                userdata.eth_info.parsed_balance = result / 1000000000000000000;
                console.log("INFO: ", userdata);
                setUserData(userdata);
              } else {
                alert.error("Couldn't find balance: ", result);
              }
            })
            .catch((error) => {
              // If the request fails, the Promise will reject with an error.
              alert.error("Failed getting info from ethereum API: " + error);
            });
        });
      }
    });
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
      borderRadius: theme.palette.borderRadius,
    };

    const currentOwner = checkOwner(data, userdata);
    if (currentOwner === true) {
      innerPaperStyle.border = "3px solid #f86a3e";
    }

    return (
      <Grid item xs={4} style={{ borderRadius: theme.palette.borderRadius }}>
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
      style={{
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
    <div style={{ display: "flex", marginTop: 120 }}>
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
        <TextField
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
        <Divider style={{ marginTop: "40px" }} />
        <h2>Platform Earnings</h2>
        <div style={{ display: runFlex ? "flex" : "", width: "100%" }}>
					<div>
  					{isCloud ?
							<span>
								<Typography variant="body1" color="textSecondary">
									By connecting your Github account, you agree to our <a href="/docs/terms_of_service" target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>Terms of Service</a>, and acknowledge that your non-sensitive data will be turned into a <a target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}} href="https://shuffler.io/search?tab=creators">creator account</a>. This enables you to earn a passive income from Shuffle. This IS reversible.
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
                      borderRadius: theme.palette.borderRadius,
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
                  borderRadius: theme.palette.borderRadius,
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
          {userdata !== undefined &&
            userdata.eth_info !== undefined &&
            userdata.eth_info.account !== undefined &&
            userdata.eth_info.account.length > 0 ? (
              <div style={{ width: "100%", textAlign: "left" }}>
                <Typography variant="body2">Network: TBD</Typography>
                <Typography variant="body2">
                  Address: {userdata.eth_info.account}
                </Typography>
                {loadedWorkflowCollections.length > 0 ? (
                  <Typography variant="body2">
                    Collections:&nbsp;
                    {loadedWorkflowCollections.map((data, index) => {
                      var collectionname = data.toLowerCase();
                      collectionname = collectionname.replaceAll("#", "");
                      collectionname = collectionname.replaceAll(" ", "-");

                      return (
                        <span key={index}>
                          <a
                            rel="noopener noreferrer"
                            target="_blank"
                            href={`https://opensea.io/collection/${collectionname}`}
                            style={{ textDecoration: "none", color: "#f85a3e" }}
                          >
                            {data}
                          </a>
                          &nbsp;
                        </span>
                      );
                    })}
                  </Typography>
                ) : null}
                <Button
                  style={{ height: 40, marginTop: 10 }}
                  variant="contained"
                  color="primary"
                  fullWidth={true}
                  onClick={() => {
                    //handleEthereumTokenCreation()
                    loadWorkflowOwnership();
                  }}
                >
                  Validate ownership
                </Button>
              </div>
            ) : (
              <Button
                style={{ height: 40, marginTop: 10 }}
                variant="outlined"
                color="primary"
                fullWidth={true}
                onClick={() => {
                  handleEthereumConnection();
                }}
              >
                Authenticate Metamask Wallet
              </Button>
            )}
          </div>
        </div>

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
          alert.error("Failed updating user: " + responseJson.reason);
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

  const handleEthereumTokenCreation = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      console.log("Please install MetaMask!");
      alert.error(
        "Please download the MetaMask browser extension to authenticate fully!"
      );
      return;
    }

    if (!provider.isMetaMask) {
      alert.error("Only MetaMask is supported as of now.");
      return;
    }

    if (!provider.isConnected()) {
      alert.error("Metamask is not connected.");
      return;
    }

    console.log("Should make a token");
  };

  const handleEthereumConnection = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      console.log("Please install MetaMask!");
      alert.error(
        "Please download the MetaMask browser extension to authenticate fully!"
      );
      return;
    }

    if (!provider.isMetaMask) {
      alert.error("Only MetaMask is supported as of now.");
      return;
    }

    // Find the ethereum network
    // Get the users' account(s)
    //alert.info("Connecting to MetaMask")
    //console.log("Connected: ", provider.isConnected())

    if (!provider.isConnected()) {
      alert.error("Metamask is not connected.");
      return;
    }

    provider.on("message", (event) => {
      alert.info("Ethereum message: ", event);
    });

    /*
		params: [
			{
				from: '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
				to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
				gas: '0x76c0', // 30400
				gasPrice: '0x9184e72a000', // 10000000000000
				value: '0x9184e72a', // 2441406250
				data:
					'0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
			},
		]
		*/

    // https://docs.metamask.io/guide/rpc-api.html
    // Gets accounts - requires previous permissions
    //const method = "eth_accounts"
    //const params = []
    //
    // Asks for permission, and gets the accounts
    var method = "eth_requestAccounts";
    var params = [];
    provider
      .request({
        method: method,
        params,
      })
      .then((result) => {
        if (result !== undefined && result !== null && result.length > 0) {
          userdata.eth_info.account = result[0];

          // Getting and setting balance for the current user
          method = "eth_getBalance";
          params = [userdata.eth_info.account, "latest"];
          provider
            .request({
              method: method,
              params,
            })
            .then((result) => {
              if (
                result !== undefined &&
                result !== null &&
                result.length > 0
              ) {
                userdata.eth_info.balance = result;
                userdata.eth_info.parsed_balance = result / 1000000000000000000;
                console.log(userdata.eth_info);
                setUserData(userdata.eth_info);

                // Updating
                //if (userdata.eth_info !== userdata.userdata.eth_info) {
                //}

                setUser(userdata.id, "eth_info", userdata.eth_info);
                userdata.userdata.eth_info = userdata.eth_info;
              } else {
                alert.error("Couldn't find balance: ", result);
              }
              // The result varies by RPC method.
              // For example, this method will return a transaction hash hexadecimal string on success.
            })
            .catch((error) => {
              // If the request fails, the Promise will reject with an error.
              //setEthInfo(userdata.eth_info)
              alert.error("Failed getting info from ethereum API: " + error);
            });
        } else {
          alert.error("Couldn't find any user: ", result);
        }
      })
      .catch((error) => {
        // If the request fails, the Promise will reject with an error.
        alert.error("Failed getting info from ethereum API: " + error);
      });

    // Gets the users' balance in WEI (one quintilionth ETH)
  };

  const loadedCheck =
    isLoaded && !firstrequest ? (
      <div style={bodyDivStyle}>{landingpageData}</div>
    ) : (
      <div></div>
    );

  return <div>{loadedCheck}</div>;
};
export default Settings;
