import React, { useState } from "react";
import { toast } from "react-toastify";
import theme from "../theme.jsx";
import { BrowserView, MobileView } from "react-device-detect";

import { useNavigate, Link } from "react-router-dom";
import ReactGA from "react-ga4";
import SearchField from "../components/Searchfield.jsx";
import {
  Paper,
  Typography,
  Badge,
  Tooltip,
  List,
  ListItem,
  Avatar,
  Menu,
  MenuItem,
  Select,
  Button,
  Grid,
  IconButton,
  Divider,
  LinearProgress,

  AppBar,
} from "@mui/material";

import {
  MeetingRoom as MeetingRoomIcon,
  HelpOutline as HelpOutlineIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Apps as AppsIcon,
  Description as DescriptionIcon,
  EmojiObjects as EmojiObjectsIcon,
  Business as BusinessIcon,
  Polyline as PolylineIcon,
} from "@mui/icons-material";

import {
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
} from "@mui/icons-material";

const hoverColor = "#f85a3e";
const hoverOutColor = "#e8eaf6";

const Header = (props) => {
  const {
    globalUrl,
    setNotifications,
    notifications,
	isLoaded,
    isLoggedIn,
    removeCookie,
    homePage,
    userdata,
	isMobile,
    serverside,
  } = props;

  const [HomeHoverColor, setHomeHoverColor] = useState(hoverOutColor);
  const [SoarHoverColor, setSoarHoverColor] = useState(hoverOutColor);
  const [LoginHoverColor, setLoginHoverColor] = useState(hoverOutColor);
  const [DocsHoverColor, setDocsHoverColor] = useState(hoverOutColor);
  const [HelpHoverColor, setHelpHoverColor] = useState(hoverOutColor);
  const [isHeader, setIsHeader] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorElAvatar, setAnchorElAvatar] = React.useState(null);
  const [subAnchorEl, setSubAnchorEl] = React.useState(null);
  let navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setAnchorElAvatar(null);
  };
  // Should be based on some path
	const logoCheck = !homePage ?  null : null

  const hrefStyle = {
    color: hoverOutColor,
    textDecoration: "none",
  };

  const menuText = {
	textTransform: "none",
	color: "#FFF",
	textAlign: "center",
	fontSize: 16,
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "normal",
  }

  const isCloud =
    serverside === true || typeof window === "undefined"
      ? true
      : window.location.host === "localhost:3002" ||
        window.location.host === "shuffler.io";

  const clearNotifications = () => {
    // Don't really care about the logout
    
    toast("Clearing notifications")
    fetch(`${globalUrl}/api/v1/notifications/clear`, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        if (response.status !== 200) {
          console.log("Error in response");
        }

        return response.json();
      })
      .then(function (responseJson) {
        if (responseJson.success === true) {
          setNotifications([]);
          handleClose();
        } else {
          toast("Failed dismissing notifications. Please try again later.");
        }
      })
      .catch((error) => {
        console.log("error in notification dismissal: ", error);
        //removeCookie("session_token", {path: "/"})
      });
  };

  const dismissNotification = (alert_id) => {
    // Don't really care about the logout
    fetch(`${globalUrl}/api/v1/notifications/${alert_id}/markasread`, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        if (response.status !== 200) {
          console.log("Error in response");
        }

        return response.json();
      })
      .then(function (responseJson) {
        if (responseJson.success === true) {
          const newNotifications = notifications.filter(
            (data) => data.id !== alert_id
          );
          console.log("NEW NOTIFICATIONS: ", newNotifications);
          setNotifications(newNotifications);
        } else {
          toast("Failed dismissing notification. Please try again later.");
        }
      })
      .catch((error) => {
        console.log("error in notification dismissal: ", error);
        //removeCookie("session_token", {path: "/"})
      });
  };

  // DEBUG HERE
  const handleClickLogout = () => {
    console.log("SHOULD LOG OUT");

    // Don't really care about the logout
    fetch(globalUrl + "/api/v1/logout", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        // Log out anyway
        removeCookie("session_token", { path: "/" });
        removeCookie("session_token", { path: "/" });
        removeCookie("session_token", { path: "/" });
        removeCookie("session_token", { path: "/" });
        window.location.pathname = "/";
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Rofl this is weird
  const handleDocsHover = () => {
    setDocsHoverColor(hoverColor);
  };

  const handleDocsHoverOut = () => {
    setDocsHoverColor(hoverOutColor);
  };

  const handleHomeHover = () => {
    setHomeHoverColor(hoverColor);
  };

  const handleHelpHover = () => {
    setHelpHoverColor(hoverColor);
  };

  const handleHelpHoverOut = () => {
    setHelpHoverColor(hoverOutColor);
  };

  const handleSoarHover = () => {
    setSoarHoverColor(hoverColor);
  };

  const handleSoarHoverOut = () => {
    setSoarHoverColor(hoverOutColor);
  };

  const handleHomeHoverOut = () => {
    setHomeHoverColor(hoverOutColor);
  };

  const handleLoginHover = () => {
    setLoginHoverColor(hoverColor);
  };

  const handleLoginHoverOut = () => {
    setLoginHoverColor(hoverOutColor);
  };

	const notificationWidth = 335
	const imagesize = 22;
  	const boxColor = "#86c142";

	const NotificationItem = (props) => {
		const {data} = props

    var image = "";
    var orgName = "";
    var orgId = "";
    if (userdata.orgs !== undefined) {
      const foundOrg = userdata.orgs.find((org) => org.id === data["org_id"]);
      if (foundOrg !== undefined && foundOrg !== null) {
        //position: "absolute", bottom: 5, right: -5,
        const imageStyle = {
          width: imagesize,
          height: imagesize,
          pointerEvents: "none",
          marginLeft:
            data.creator_org !== undefined && data.creator_org.length > 0
              ? 20
              : 0,
          borderRadius: 10,
          border:
            foundOrg.id === userdata.active_org.id
              ? `3px solid ${boxColor}`
              : null,
          cursor: "pointer",
          marginRight: 10,
        };

        image =
          foundOrg.image === "" ? (
            <img
              alt={foundOrg.name}
              src={theme.palette.defaultImage}
              style={imageStyle}
            />
          ) : (
            <img
              alt={foundOrg.name}
              src={foundOrg.image}
              style={imageStyle}
              onClick={() => {}}
            />
          );

        orgName = foundOrg.name;
        orgId = foundOrg.id;
      }
    }

    return (
      <Paper
        style={{
          backgroundColor: theme.palette.surfaceColor,
          width: notificationWidth,
          padding: 25,
          borderBottom: "1px solid rgba(255,255,255,0.4)",
        }}
      >
		{data.reference_url !== undefined && data.reference_url !== null && data.reference_url.length > 0 ?
			<Link to={data.reference_url} style={{color: "#f86a3e", textDecoration: "none",}}>
				<Typography variant="body1">
					{data.title} ({data.amount})
				</Typography >
			</Link>
		: 
			<Typography variant="body1" color="textSecondary">
				{data.title}
			</Typography >
		}

		{data.image !== undefined && data.image !== null && data.image.length > 0 ? 
			<img alt={data.title} src={data.image} style={{height: 100, width: 100, }} />
			: 
			null
		}
		<Typography variant="body2" style={{marginTop: 10, maxHeight: 200, overflowX: "hidden", overflowY: "auto", }}>
			{data.description}
		</Typography >
        <div style={{ display: "flex" }}>
          {data.read === false ? (
            <Button
              color="primary"
              variant="contained"
              style={{ marginTop: 15 }}
              onClick={() => {
                dismissNotification(data.id);
              }}
            >
              Dismiss
            </Button>
          ) : null}
          <Tooltip title={`Org "${orgName}"`} placement="bottom">
            <div
              style={{ cursor: "pointer", marginLeft: 10, marginTop: 20 }}
              onClick={() => {}}
            >
              {image}
            </div>
          </Tooltip>
        </div>
      </Paper>
    );
  };

  const notificationMenu = (
    <span style={{}}>
      <IconButton
        color="primary"
        style={{}}
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}
      >
        <Badge badgeContent={notifications.filter((n) => n.read === false).length} color="primary">
          <NotificationsIcon
            color="secondary"
            style={{ height: 30, width: 30 }}
            alt="Your username here"
            src=""
          />
        </Badge>
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        style={{
          zIndex: 10002,
          maxHeight: "80vh",
          overflowX: "hidden",
          overflowY: "auto",
        }}
        PaperProps={{
          style: {
            backgroundColor: theme.palette.surfaceColor,
          },
        }}
        onClose={() => {
          handleClose();
        }}
      >
        <Paper
          style={{
            backgroundColor: theme.palette.surfaceColor,
            width: notificationWidth,
            padding: 25,
            borderBottom: "3px solid rgba(255,255,255,0.4)",
          }}
        >
          <div style={{ display: "flex", marginBottom: 5 }}>
            <Typography variant="body1">
              Your Notifications ({notifications.filter((data) => !data.read).length})
            </Typography>
            {notifications.length > 1 ? (
              <Button
                color="primary"
                variant="contained"
				disabled={notifications.filter((data) => !data.read).length === 0}
                style={{ marginLeft: 30, }}
                onClick={() => {
                  clearNotifications();
                }}
              >
                Flush
              </Button>
            ) : null}
          </div>
          <Typography variant="body2">
            Notifications generated made by Shuffle to help you discover issues or 
            improvements. <a href="/docs/organizations#notifications" target="_blank" rel="noopener noreferrer" style={{color: "#f86a3e", textDecoration: "none", }}>
	  		Learn more</a>
          </Typography>
        </Paper>
        {notifications.map((data, index) => {
			if (data.read) {
				return null
			}

          	return <NotificationItem data={data} key={index} />;
        })}
      </Menu>
    </span>
  );

  const handleClickChangeOrg = (orgId) => {
    // Don't really care about the logout
    //name: org.name,
    //orgId = "asd"
    const data = {
      org_id: orgId,
    };

    localStorage.setItem("globalUrl", "");
    localStorage.setItem("getting_started_sidebar", "open");

    fetch(`${globalUrl}/api/v1/orgs/${orgId}/change`, {
      mode: "cors",
      credentials: "include",
      crossDomain: true,
      method: "POST",
      body: JSON.stringify(data),
      withCredentials: true,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then(function (response) {
        if (response.status !== 200) {
          console.log("Error in response");
        }

        return response.json();
      })
      .then(function (responseJson) {
	    console.log("In here?")
        if (responseJson.success === true) {
          if (responseJson.region_url !== undefined && responseJson.region_url !== null && responseJson.region_url.length > 0) {
            console.log("Region Change: ", responseJson.region_url);
            localStorage.setItem("globalUrl", responseJson.region_url);
            //globalUrl = responseJson.region_url
          }

          setTimeout(() => {
            window.location.reload();
          }, 2000);

          toast("Successfully changed active organization - refreshing!");
        } else {
		  if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason.length > 0) {
		    toast(responseJson.reason);
		  } else {
          	toast("Failed changing org. Try again or contact support@shuffler.io if this persists.");
		  }
        }
      })
      .catch((error) => {
        console.log("error changing: ", error);
        //removeCookie("session_token", {path: "/"})
      });
  };

  const supportMenu = (
    <span style={{ marginTop: 0 }}>
      <a
        href="https://discord.gg/B2CBzUm"
        style={{ textDecoration: "none", color: "#f85a3e" }}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Tooltip color="primary" title={"Join the community"} placement="left">
          <IconButton
            color="primary"
            style={{}}
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={(event) => {}}
          >
            <img
              alt="Discord Community Join"
              src={"/images/social/resized/discord.png"}
              style={{ height: 30, width: 30 }}
            />
          </IconButton>
        </Tooltip>
      </a>
    </span>
  );

  // Should be based on some path
  const parsedAvatar =
    userdata.avatar !== undefined &&
    userdata.avatar !== null &&
    userdata.avatar.length > 0
      ? userdata.avatar
      : "";

  const avatarMenu = (
    <span>
      <IconButton
        color="primary"
        style={{ marginRight: 5 }}
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event) => {
          setAnchorElAvatar(event.currentTarget);
        }}
      >
        <Avatar
          style={{ height: 30, width: 30 }}
          alt="Your username here"
          src={parsedAvatar}
        />
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorElAvatar}
        keepMounted
        open={Boolean(anchorElAvatar)}
        style={{ zIndex: 10012 }}
        onClose={() => {
          handleClose();
        }}
      >
        <Link to="/admin" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <BusinessIcon style={{ marginRight: 5 }} /> Admin
          </MenuItem>
        </Link>
        <Divider />
        <Link to="/docs" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <HelpOutlineIcon style={{ marginRight: 5 }} /> About
          </MenuItem>
        </Link>
        {/*
				<Link to="/getting-started" style={hrefStyle}>
					<MenuItem
						onClick={(event) => {
							handleClose();
						}}
					>
            <AnalyticsIcon style={{marginRight: 5 }}/> Get Started 
        	</MenuItem>
				</Link>
				*/}
        <Link to="/usecases" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <LightbulbIcon style={{ marginRight: 5 }} /> Use Cases
          </MenuItem>
        </Link>
        <Divider />
        <Link to={`/creators/${userdata.public_username}`} style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <EmojiObjectsIcon style={{ marginRight: 5 }} /> Creator page
          </MenuItem>
        </Link>
        <Link to="/settings" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <SettingsIcon style={{ marginRight: 5 }} /> Settings
          </MenuItem>
        </Link>
        <Divider />
        <MenuItem
          style={{ color: "white" }}
          onClick={(event) => {
            handleClickLogout();
            event.preventDefault();
            handleClose();
          }}
        >
          <MeetingRoomIcon style={{ marginRight: 5 }} /> &nbsp;Logout
        </MenuItem>
        <Divider style={{marginBottom: 10, }}/>

	  	<Typography variant="body2" color="textSecondary" align="center" style={{marginTop: 5, marginBottom: 5,}}>
	  		Version: 1.3.3
	  	</Typography>
      </Menu>
    </span>
  );

  const listItemStyle = {
    textAlign: "center",
    marginTop: "auto",
    marginBottom: "auto",
    marginRight: 10,
  };
  
  // Handle top bar or something
  const defaultTop = -2
  const loginTextBrowser = !isLoggedIn ? (
    <div
      style={{
        display: "flex",
        minWidth: 1250,
        maxWidth: 1250,
        margin: "auto",
        textAlign: "center",
      }}
    >
        <List style={{ flex: 2, display: "flex", flexDirection: "row", }} component="nav">
          <ListItem
            style={{ textAlign: "center", marginLeft: "0px", paddingRight: 0 }}
          >
            <Link to="/" style={hrefStyle}>
              <Grid
                variant="text"
                color="secondary"
                style={{ textTransform: "none", display: "flex" }}
                onClick={() => {
                  if (isCloud) {
                    ReactGA.event({
                      category: "header",
                      action: "home_click",
                      label: "",
                    });
                  }
                }}
              >
                <img
                  src={"/images/logos/topleft_logo.svg"}
                  alt="shuffle logo"
                  style={{ height: 25, }}
                />
              </Grid>
            </Link>
          </ListItem>
        </List>
        <List style={{ flex: 1.5, display: "flex", flexDirect: "row", marginTop: 10, itemAlign: "center", }} component="nav">
          <ListItem style={{ textAlign: "center", marginLeft: "0px" }}>
            <Link to="/usecases" style={hrefStyle}>
              <Button
                variant="text"
                color="secondary"
                style={menuText}
                onClick={() => {
                  if (isCloud) {
                    ReactGA.event({
                      category: "header",
                      action: "usecases_click",
                      label: "",
                    });
                  }
                }}
              >
                Usecases
              </Button>
            </Link>
          </ListItem>
          {isCloud ? (
            <ListItem
              style={{
                textAlign: "center",
                marginLeft: "0px",
                paddingRight: 0,
              }}
            >
              <Link to="/pricing" style={hrefStyle}>
                <Button
                  variant="text"
                  color="secondary"
                  style={menuText}
                  onClick={() => {
                    ReactGA.event({
                      category: "header",
                      action: "pricing_click",
                      label: "",
                    });
                  }}
                >
                  Pricing
                </Button>
              </Link>
            </ListItem>
          ) : null}
            <ListItem
              style={{
                textAlign: "center",
                marginLeft: 0, 
                paddingRight: 0,
              }}
            >
              <Link rel="noopener noreferrer" to="/docs" style={hrefStyle}>
                <Button
                  variant="text"
                  color="secondary"
                  style={menuText}
                  onClick={() => {}}
                >
                 	Docs 
                </Button>
              </Link>
            </ListItem>
        </List>
        <List
          style={{ flex: 2, display: "flex", alignItems: "flex-start",  }}
          component="nav"
        >
	  	  <div style={{maxWidth: 70, minWidth: 70, }}/>
	  	  <span style={{marginTop: 8, marginRight: 15, }}>
		  	<SearchField isHeader={true} isLoggedIn={isLoggedIn} isLoaded={isLoaded} serverside={serverside} userdata={userdata} small={true} rounded={true} />
	  	  </span>
		    <Link to="/register" style={hrefStyle}>
		      <Button
		        variant="contained"
		        color="primary"
		        style={{
					marginTop: 13, 
					minWidth: 100,
					maxWidth: 100,
					padding: "7px 14px 7px 14px",
					borderRadius: 25,
					textTransform: "none",
					backgroundImage: "linear-gradient(to right, #f86a3e, #f34079)",
					color: "white",
		        }}
		        onClick={() => {
					if (isCloud) {
						ReactGA.event({
						  category: "header",
						  action: "register_click",
						  label: "",
						});
					}
		        }}
		      >
		        Sign Up
		      </Button>
		    </Link>
            <Link to="/login" style={hrefStyle}>
              <Button
                style={{
				  marginTop: 12, 
                  textTransform: "none",
                  borderRadius: 25,
				  color:"white",
				  fontWeight: 400,
				  fontSize: 16,
                  padding: "7px 14px 7px 14px",
                  maxWidth: 100,
                  minWidth: 100,
                }}
                onClick={() => {
                  if (isCloud) {
                    ReactGA.event({
                      category: "header",
                      action: "signin_click",
                      label: "",
                    });
                  }
                }}
              >
                Login
              </Button>
            </Link>

        </List>
    </div>
  ) : (
    <div style={{ display: "flex" }}>
      <div
        style={{
          minWidth: 1250,
          maxWidth: 1250,
          display: "flex",
          margin: "auto",
        }}
      >
        <div style={{ flexDirection: "row" }}>
          <List
            style={{
              height: 56,
              marginTop: "auto",
              marginBottom: "auto",
              display: "flex",
              flexDirect: "row",
              alignItems: "baseline",
              maxWidth: 340,
            }}
            component="nav"
          >
            <ListItem style={{ textAlign: "center", justifyContent: "center" }}>
              <Link to="/" style={hrefStyle}>
                <div
                  onMouseOver={handleHomeHover}
                  onMouseOut={handleHomeHoverOut}
                  style={{ color: HomeHoverColor, cursor: "pointer" }}
                >
                  <Grid container direction="row" alignItems="center">
                    <Grid item style={{  }}>
                      <img
                        src={"/images/logos/orange_logo.svg"}
                        alt="logo"
                        style={{ height: 20, width: 20, marginTop: 10 }}
                      />
                    </Grid>
                  </Grid>
                </div>
              </Link>
              <ListItem style={listItemStyle}>
              <Link to="/workflows" style={hrefStyle}>
                <div
                  onMouseOver={handleSoarHover}
                  onMouseOut={handleSoarHoverOut}
                  style={{
                    color: SoarHoverColor,
                    cursor: "pointer",
                    display: "flex",
                    marginLeft: 25,
                  }}
                >
                  {/*
										<PolylineIcon style={{marginRight: "5px"}} />
										*/}
                  <Typography style={{ marginTop: defaultTop, marginRight: 8 }}>
                    Workflows
                  </Typography>
                </div>
              </Link>
            </ListItem>
            <ListItem style={listItemStyle}>
              <Link to="/apps" style={hrefStyle}>
                <div
                  onMouseOver={handleHelpHover}
                  onMouseOut={handleHelpHoverOut}
                  style={{
                    color: HelpHoverColor,
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  {/*
											<AppsIcon style={{marginRight: "5px"}} />
											*/}
                  <Typography style={{ marginTop: defaultTop, marginRight: 5 }}>
                    Apps
                  </Typography>
                </div>
              </Link>
            </ListItem>
            {/*
							<ListItem style={{textAlign: "center"}}>
								<Link to="/dashboard" style={hrefStyle}>
										<div onMouseOver={handleDocsHover} onMouseOut={handleDocsHoverOut} style={{color: DocsHoverColor, cursor: "pointer"}}>Dashboard</div> 
								</Link>
      	 			</ListItem>
							*/}
            <ListItem style={listItemStyle}>
              <Link to="/docs" style={hrefStyle}>
                <div
                  onMouseOver={handleDocsHover}
                  onMouseOut={handleDocsHoverOut}
                  style={{
                    color: DocsHoverColor,
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  {/*
											<DescriptionIcon style={{marginRight: "5px"}} />
											*/}
                  <Typography style={{ marginTop: defaultTop }}>
                    Docs
                  </Typography>
                </div>
              </Link>
            </ListItem>
            </ListItem>
          </List>
        </div>
        <div style={{ flex: 1, marginTop: 10, }}>
          <SearchField isHeader={true} isLoggedIn={isLoggedIn} isLoaded={isLoaded} serverside={serverside} userdata={userdata} hidemargins={true}/>
        </div>
        <div style={{ flex:  isLoggedIn ? null : 1, display: "flex", flexDirection: "row-reverse" }}>
          <List
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              marginRight: 0,
              paddingRight: 0,
              paddingTop: "auto",
            }}
            component="nav"
          >
            <span
              style={{
                display: "flex",
                paddingTop: 5,
                flexDirection: "row-reverse",
              }}
            >
              {avatarMenu}
              {notificationMenu}
              {/*supportMenu*/}
              {logoCheck}
            </span>

            {userdata === undefined ||
            userdata.orgs === undefined ||
            userdata.orgs === null ||
            userdata.orgs.length <= 1 ? null : (
              <span style={{ paddingTop: 5 }}>
                <Select
                  disableUnderline
                  SelectDisplayProps={{
                    style: {
                      maxWidth: 50,
                      overflow: "hidden",
                      paddingLeft: 8,
                    },
                  }}
                  MenuProps={{
                    style: {
                      zIndex: 15000,
                    },
                  }}
                  style={{
                    borderRadius: theme.palette.borderRadius,
                    backgroundColor: theme.palette.surfaceColor,
                    marginRight: 15,
                    color: "white",
                    height: 45,
                    width: 85,
                  }}
                  value={userdata.active_org.id}
                  fullWidth
                  onChange={(e) => {
                    handleClickChangeOrg(e.target.value);
                  }}
                >
                  {userdata.orgs.map((data, index) => {
                    if (
                      data.name === undefined ||
                      data.name === null ||
                      data.name.length === 0
                    ) {
                      return null;
                    }

                    const imagesize = 22;
                    var skipOrg = false;
                    if (
                      data.creator_org !== undefined &&
                      data.creator_org !== null &&
                      data.creator_org.length > 0
                    ) {
                      // Finds the parent org
                      for (var key in userdata.child_orgs) {
                        if (data.child_orgs[key].id === data.creator_org) {
                          skipOrg = true;
                          break;
                        }
                      }

                      if (skipOrg) {
                        return null;
                      }
                    }

                    const imageStyle = {
                      width: imagesize,
                      height: imagesize,
                      pointerEvents: "none",
                      marginRight: 10,
                      marginLeft:
                        data.creator_org !== undefined &&
                        data.creator_org !== null &&
                        data.creator_org.length > 0
                          ? data.id === userdata.active_org.id
                            ? 0
                            : 20
                          : 0,
                    };

                    const parsedTitle =
                      data.creator_org !== undefined &&
                      data.creator_org !== null &&
                      data.creator_org.length > 0
                        ? `Suborg of ${data.creator_org}`
                        : "";

                    const image =
                      data.image === "" ? (
                        <img
                          alt={data.name}
                          src={theme.palette.defaultImage}
                          style={imageStyle}
                        />
                      ) : (
                        <img
                          alt={data.name}
                          src={data.image}
                          style={imageStyle}
                        />
                      );

                    var regiontag = "eu";
                    if (
                      data.region_url !== undefined &&
                      data.region_url !== null &&
                      data.region_url.length > 0
                    ) {
                      const regionsplit = data.region_url.split(".");
                      if (
                        regionsplit.length > 2 &&
                        !regionsplit[0].includes("shuffler")
                      ) {
                        const namesplit = regionsplit[0].split("/");

                        regiontag = namesplit[namesplit.length - 1];
                      }
                    }

                    return (
                      <MenuItem
                        key={index}
                        disabled={data.id === userdata.active_org.id}
                        style={{
                          backgroundColor: theme.palette.inputColor,
                          color: "white",
                          height: 40,
                          zIndex: 10003,
                        }}
                        value={data.id}
                      >
                        <Tooltip
                          color="primary"
                          title={parsedTitle}
                          placement="left"
                        >
                          <div style={{ display: "flex" }}>
                            {isCloud ? (
                              <Typography
                                variant="body2"
                                style={{
                                  borderRadius: theme.palette.borderRadius,
                                  float: "left",
                                  margin: "0 0 0 0",
                                  marginRight: 25,
                                }}
                              >
                                {regiontag}
                              </Typography>
                            ) : null}{" "}
                            {image}{" "}
                            <span style={{ marginLeft: 8 }}>{data.name}</span>
                          </div>
                        </Tooltip>
                      </MenuItem>
                    );
                  })}
                </Select>
              </span>
            )}

            {/* Show on cloud, if not suborg and if not customer/pov/internal */}
            {isCloud &&
            (userdata.org_status === undefined ||
              userdata.org_status === null ||
              userdata.org_status.length === 0) ? (
              <ListItem
                style={{
                  textAlign: "center",
                  marginLeft: 0,
                  marginRight: 7,
                  marginTop: 0,
                }}
              >
                <Link to="/pricing?tab=cloud&highlight=true" style={hrefStyle}>
                  <Button
                    variant="contained"
                    color="primary"
                    style={{ textTransform: "none" }}
                    onClick={() => {
						if (isCloud) {
						  ReactGA.event({
							category: "header",
							action: "pricing_upgrade_click",
							label: "",
						  });
						}
                    }}
                  >
                    Upgrade
                  </Button>
                </Link>
              </ListItem>
            ) : null}

            {userdata === undefined ||
            userdata.app_execution_limit === undefined ||
            userdata.app_execution_usage === undefined ||
            userdata.app_execution_usage < 1000 ? null : (
              <Tooltip
                title={`Amount of executions left: ${userdata.app_execution_usage} / ${userdata.app_execution_limit}. When the limit is reached, you can still use Shuffle normally, but your Workflow triggers may stop working. Reach out to support@shuffler.io to extend this limit.`}
              >
                <div
                  style={{
                    maxHeight: 30,
                    minHeight: 30,
                    padding: 8,
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: theme.palette.borderRadius,
                    marginRight: 10,
                    marginTop: 5,
                    backgroundColor: theme.palette.surfaceColor,
                    minWidth: 60,
                    maxWidth: 60,
                    border:
                      userdata.app_execution_usage /
                        userdata.app_execution_limit >=
                      0.9
                        ? "#f86a3e"
                        : null,
                  }}
                  onClick={() => {
                    console.log(
                      userdata.appe_execution_usage /
                        userdata.app_execution_limit
                    );
                    if (window.drift !== undefined) {
                      window.drift.api.startInteraction({
                        interactionId: 326905,
                      });
                      navigate("/pricing");
                    } else {
                      console.log(
                        "Couldn't find drift in window.drift and not .drift-open-chat with querySelector: ",
                        window.drift
                      );
                    }
                  }}
                >
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    style={{ fontSize: 12, color: "#f86a3e" }}
                  >
                    <b>
                      {(
                        (userdata.app_execution_usage /
                          userdata.app_execution_limit) *
                        100
                      ).toFixed(0)}
                      %
                    </b>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    style={{ marginTop: 5 }}
                    value={(
                      (userdata.app_execution_usage /
                        userdata.app_execution_limit) *
                      100
                    ).toFixed(0)}
                  />
                </div>
              </Tooltip>
            )}
          </List>
        </div>
      </div>
    </div>
  );

  const loginTextMobile = !isLoggedIn ? (
    <div style={{ display: "flex" }}>
      <List style={{ display: "flex", flexDirection: "row" }} component="nav">
        <ListItem style={{ textAlign: "center" }}>
          <Link to="/" style={hrefStyle}>
            <div
              onMouseOver={handleHomeHover}
              onMouseOut={handleHomeHoverOut}
              style={{ color: HomeHoverColor, cursor: "pointer" }}
            >
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <img
                    src={"/images/logos/orange_logo.svg"}
                    alt="logo"
                    style={{
                      height: 20,
                      width: 20,
                      marginTop: 3,
                      marginRight: 5,
                    }}
                  />
                </Grid>
              </Grid>
            </div>
          </Link>
        </ListItem>
        <ListItem style={{ textAlign: "center" }}>
          <Link to="/docs" style={hrefStyle}>
            <div
              onMouseOver={handleSoarHover}
              onMouseOut={handleSoarHoverOut}
              style={{ color: SoarHoverColor, cursor: "pointer" }}
            >
              About
            </div>
          </Link>
        </ListItem>
        <ListItem style={{ textAlign: "center", marginLeft: "0px" }}>
          <Link to="/contact" style={hrefStyle}>
            <Button
              variant="text"
              color="secondary"
              style={{ textTransform: "none" }}
            >
              Contact
            </Button>
          </Link>
        </ListItem>
        <ListItem
          style={{ textAlign: "center", marginLeft: "0px", paddingLeft: 0 }}
        >
          <Link to="/pricing" style={hrefStyle}>
            <Button
              variant="text"
              color="secondary"
              style={{ textTransform: "none" }}
            >
              Pricing
            </Button>
          </Link>
        </ListItem>
      </List>
    </div>
  ) : (
    <div style={{ display: "flex" }}>
      <div style={{ flex: "1", flexDirection: "row" }}>
        <List
          style={{ display: "flex", flexDirect: "row", flex: "1" }}
          component="nav"
        >
          <ListItem style={{ textAlign: "center" }}>
            <Link to="/" style={hrefStyle}>
              <div
                onMouseOver={handleHomeHover}
                onMouseOut={handleHomeHoverOut}
                style={{ color: HomeHoverColor, cursor: "pointer" }}
              >
                <Grid container direction="row" alignItems="center">
                  <Grid item>
                    <HomeIcon
                      style={{ marginTop: "3px", marginRight: "5px" }}
                    />
                  </Grid>
                </Grid>
              </div>
            </Link>
          </ListItem>
          <ListItem style={{ textAlign: "center", marginLeft: "0px" }}>
            <Link to="/contact" style={hrefStyle}>
              <Button
                variant="text"
                color="secondary"
                style={{ textTransform: "none" }}
              >
                Contact
              </Button>
            </Link>
          </ListItem>
          <ListItem style={{ textAlign: "center", marginLeft: "0px" }}>
            <Link to="/pricing" style={hrefStyle}>
              <Button
                variant="text"
                color="secondary"
                style={{ textTransform: "none" }}
              >
                Pricing
              </Button>
            </Link>
          </ListItem>
        </List>
      </div>
      <div
        style={{ flex: "10", display: "flex", flexDirection: "row-reverse" }}
      >
        <List
          style={{ display: "flex", flexDirection: "row-reverse" }}
          component="nav"
        >
          <ListItem style={{ flex: "1", textAlign: "center" }}>
            <div
              onMouseOver={handleLoginHover}
              onMouseOut={handleLoginHoverOut}
              onClick={handleClickLogout}
              style={{ color: LoginHoverColor, cursor: "pointer" }}
            >
              Logout
            </div>
          </ListItem>
          {logoCheck}
          <ListItem></ListItem>
        </List>
      </div>
    </div>
  );

  // <Divider style={{height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
	//
	/*
	  !isLoggedIn ? 
		<div style={{minHeight: 68, maxHeight: 68, backgroundColor: theme.palette.backgroundColor, }}>
		  <BrowserView style={{position: "sticky", top: 0, }}>
			{loginTextBrowser}
		  </BrowserView>
		</div>
		:
		*/
  return !isMobile ? 
	  <AppBar 
	  	position="sticky"
		color="transparent" 
		elevation={0}
	  	style={{backgroundColor: "transparent", boxShadow: "none", minHeight: 68, maxHeight: 68, backgroundColor: theme.palette.backgroundColor, }}
	  >
		  <BrowserView style={{position: "sticky", top: 0, }}>
			{loginTextBrowser}
		  </BrowserView>
	  </AppBar>
	  :
      <MobileView>{loginTextMobile}</MobileView>
};

export default Header;
