import React, { useState } from "react";
import { BrowserView, MobileView } from "react-device-detect";

import { Link } from "react-router-dom";

import { useTheme } from "@material-ui/core/styles";

import {
  Chip,
  Badge,
  Typography,
  Paper,
  Tooltip,
  List,
  Avatar,
  Menu,
  ListItem,
  MenuItem,
  Select,
  Button,
  IconButton,
  Grid,
} from "@material-ui/core";

import {
  MeetingRoom as MeetingRoomIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Polymer as PolymerIcon,
  Apps as AppsIcon,
  Description as DescriptionIcon,
	HelpOutline as HelpOutlineIcon,
} from "@material-ui/icons";

import {
	Analytics as AnalyticsIcon,
	Lightbulb as LightbulbIcon,
} from "@mui/icons-material";
//import LogoutIcon from '@mui/icons-material/Logout';
import { useAlert } from "react-alert";

const hoverColor = "#f85a3e";
const hoverOutColor = "#e8eaf6";

const Header = (props) => {
  const {
    globalUrl,
    setNotifications,
    notifications,
    isLoggedIn,
    removeCookie,
    homePage,
    isLoaded,
    userdata,
    cookies,
  } = props;
  const theme = useTheme();

  const [HomeHoverColor, setHomeHoverColor] = useState(hoverOutColor);
  const [SoarHoverColor, setSoarHoverColor] = useState(hoverOutColor);
  const [LoginHoverColor, setLoginHoverColor] = useState(hoverOutColor);
  const [DocsHoverColor, setDocsHoverColor] = useState(hoverOutColor);
  const [HelpHoverColor, setHelpHoverColor] = useState(hoverOutColor);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorElAvatar, setAnchorElAvatar] = React.useState(null);
  const alert = useAlert();

  const hrefStyle = {
    color: hoverOutColor,
    textDecoration: "none",
  };

  const handleClose = () => {
    setAnchorEl(null);
    setAnchorElAvatar(null);
  };

  const clearNotifications = () => {
    // Don't really care about the logout
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
          alert.error(
            "Failed dismissing notifications. Please try again later."
          );
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
          alert.error(
            "Failed dismissing notification. Please try again later."
          );
        }
      })
      .catch((error) => {
        console.log("error in notification dismissal: ", error);
        //removeCookie("session_token", {path: "/"})
      });
  };

  // DEBUG HERE
  const handleClickLogout = () => {
    console.log("COOKIES: ", cookies, "Remover: ", removeCookie);
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
        //cookies.remove("session_token")
        //window.location.pathname = "/"
        console.log("Should've logged out");
        removeCookie("session_token", { path: "/" });
        removeCookie("session_token", { path: "/workflows" });
        window.location.reload();
      })
      .catch((error) => {
        console.log("Error in logout: ", error);
        removeCookie("session_token", { path: "/" });
        window.location.reload();
        //removeCookie("session_token", {path: "/"})
      });
  };

  const handleClickChangeOrg = (orgId) => {
    // Don't really care about the logout
    //name: org.name,
    //orgId = "asd"
    const data = {
      org_id: orgId,
    };

    fetch(`${globalUrl}/api/v1/orgs/${orgId}/change`, {
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
      .then(function (response) {
        if (response.status !== 200) {
          console.log("Error in response");
        }

        return response.json();
      })
      .then(function (responseJson) {
        if (responseJson.success !== undefined && responseJson.success) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          alert.success(
            "Successfully changed active organization - refreshing!"
          );
        } else {
          alert.error("Failed changing org: ", responseJson.reason);
        }
      })
      .catch((error) => {
        console.log("error changing: ", error);
        //removeCookie("session_token", {path: "/"})
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

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const chipStyle = {
    backgroundColor: "#3d3f43",
    height: 30,
    marginRight: 5,
    paddingLeft: 5,
    paddingRight: 5,
    height: 28,
    cursor: "pointer",
    borderColor: "#3d3f43",
    color: "white",
  };

  const notificationWidth = 350;
  const NotificationItem = (props) => {
    const { data } = props;

    return (
      <Paper
        style={{
          backgroundColor: theme.palette.surfaceColor,
          width: notificationWidth,
          padding: 25,
          borderBottom: "1px solid rgba(255,255,255,0.4)",
        }}
      >
        {/*<Typography variant="h6">
					{new Date(data.updated_at).toISOString()}
				</Typography >*/}
        {data.reference_url !== undefined &&
        data.reference_url !== null &&
        data.reference_url.length > 0 ? (
          <Link
            to={data.reference_url}
            style={{ color: "#f86a3e", textDecoration: "none" }}
          >
            <Typography variant="h6">{data.title}</Typography>
          </Link>
        ) : (
          <Typography variant="h6">{data.title}</Typography>
        )}

        {data.image !== undefined &&
        data.image !== null &&
        data.image.length > 0 ? (
          <img
            alt={data.title}
            src={data.image}
            style={{ height: 100, width: 100 }}
          />
        ) : null}
        <Typography variant="body1">{data.description}</Typography>
        {/*data.tags !== undefined && data.tags !== null && data.tags.length > 0 ? 
					data.tags.map((tag, index) => {
						return (
							<Chip
								key={index}
								style={chipStyle}
								label={tag}
								onClick={() => {
								}}
								variant="outlined"
								color="primary"
							/>
						)
					})
				: null */}
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
      </Paper>
    );
  };

  const notificationMenu = (
    <span style={{ zIndex: 10001 }}>
      <IconButton
        color="primary"
        style={{ zIndex: 10001, marginRight: 15 }}
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}
      >
        <Badge badgeContent={notifications.length} color="primary">
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
          maxHeight: "90vh",
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
            <Typography variant="h6">
              Your Notifications ({notifications.length})
            </Typography>
            {notifications.length > 1 ? (
              <Button
                color="primary"
                variant="contained"
                style={{ marginLeft: 30 }}
                onClick={() => {
                  clearNotifications();
                }}
              >
                Flush
              </Button>
            ) : null}
          </div>
          <Typography variant="body2">
            Notifications are made by Shuffle to help you discover issues or
            improvements.
          </Typography>
        </Paper>
        {notifications.map((data, index) => {
          return <NotificationItem data={data} key={index} />;
        })}
      </Menu>
    </span>
  );

  // Should be based on some path
  const avatarMenu = (
    <span style={{ zIndex: 10001 }}>
      <IconButton
        color="primary"
        style={{ zIndex: 10001, marginRight: 15 }}
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event) => {
          setAnchorElAvatar(event.currentTarget);
        }}
      >
        <Avatar
          style={{ height: 30, width: 30 }}
          alt="Your username here"
          src=""
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
        <MenuItem
          onClick={(event) => {
            event.preventDefault();
            handleClose();
          }}
        >
          <Link to="/docs" style={hrefStyle}>
            <HelpOutlineIcon style={{marginRight: 5 }}/> About 
          </Link>
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            event.preventDefault();
            handleClose();
          }}
        >
          <Link to="/getting-started" style={hrefStyle}>
            <AnalyticsIcon style={{marginRight: 5 }}/> Get Started 
          </Link>
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            event.preventDefault();
            handleClose();
          }}
        >
          <Link to="/usecases" style={hrefStyle}>
            <LightbulbIcon style={{marginRight: 5 }}/> Use Cases 
          </Link>
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            event.preventDefault();
            handleClose();
          }}
        >
          <Link to="/settings" style={hrefStyle}>
            <SettingsIcon style={{marginRight: 5 }}/> Settings
          </Link>
        </MenuItem>
        <MenuItem
          style={{ color: "white" }}
          onClick={(event) => {
            event.preventDefault();
            handleClose();
            handleClickLogout();
          }}
        >
          <MeetingRoomIcon style={{marginRight: 5 }}/> &nbsp;Logout
        </MenuItem>
      </Menu>
    </span>
  );

  // Handle top bar or something
  const logoCheck = !homePage ? null : null;
  //<div style={{position: "fixed", top: 0, left: 0, display: "flex"}}>
  const loginTextBrowser = !isLoggedIn ? (
    <div style={{ display: "flex" }}>
      <List style={{ display: "flex", flexDirect: "row" }} component="nav">
        <ListItem style={{ textAlign: "center", marginLeft: "0px" }}>
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
      </List>
      <div style={{ flex: "7", display: "flex", flexDirection: "row-reverse" }}>
        <List
          style={{ display: "flex", flexDirection: "row-reverse" }}
          component="nav"
        >
          <ListItem style={{ flex: "1", textAlign: "center" }}>
            <Link to="/login" style={hrefStyle}>
              <div
                onMouseOver={handleLoginHover}
                onMouseOut={handleLoginHoverOut}
                style={{ color: LoginHoverColor, cursor: "pointer" }}
              >
                Login
              </div>
            </Link>
          </ListItem>
        </List>
      </div>
    </div>
  ) : (
    <div style={{ display: "flex" }}>
      <div style={{ flex: "1", flexDirection: "row" }}>
        <List
          style={{ display: "flex", flexDirect: "row", flex: "1" }}
          component="nav"
        >
          <ListItem style={{ textAlign: "center" }}>
            <Link to="/workflows" style={hrefStyle}>
              <div
                onMouseOver={handleSoarHover}
                onMouseOut={handleSoarHoverOut}
                style={{
                  color: SoarHoverColor,
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <PolymerIcon style={{ marginRight: "5px" }} />
                <span style={{ marginTop: 2 }}>Workflows</span>
              </div>
            </Link>
          </ListItem>
          <ListItem style={{ textAlign: "center" }}>
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
                <AppsIcon style={{ marginRight: "5px" }} />
                <span style={{ marginTop: 2 }}>Apps</span>
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
          <ListItem style={{ textAlign: "center" }}>
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
                <DescriptionIcon style={{ marginRight: "5px" }} />
                <span style={{ marginTop: 2 }}>Docs</span>
              </div>
            </Link>
          </ListItem>
          {/*
       			<ListItem style={{textAlign: "center"}}>
							<Link to="/pricing" style={hrefStyle}>
									<div onMouseOver={handleDocsHover} onMouseOut={handleDocsHoverOut} style={{color: DocsHoverColor, cursor: "pointer", display: "flex"}}>
										<DescriptionIcon style={{marginRight: "5px"}} />
										<span style={{marginTop: 2}}>Pricing</span>
									</div>
							</Link>
       			</ListItem>
						*/}
          {/*
       				<ListItem style={{textAlign: "center"}}>
						<Link to="/configurations" style={hrefStyle}>
    						<div onMouseOver={handleCredentialHover} onMouseOut={handleCredentialHoverOut} style={{color: CredentialHoverColor, cursor: "pointer"}}>Configure</div> 
						</a>
       				</ListItem>
					*/}
        </List>
      </div>
      <div
        style={{ flex: "10", display: "flex", flexDirection: "row-reverse" }}
      >
        {avatarMenu}
        {notificationMenu}
        {userdata === undefined ||
        userdata.admin === undefined ||
        userdata.admin === null ||
        !userdata.admin ? null : (
          <Link to="/admin" style={hrefStyle}>
            <Button
              color="primary"
              variant="outlined"
              style={{ marginRight: 15, marginTop: 12 }}
            >
              Admin
            </Button>
          </Link>
        )}
        {userdata === undefined ||
        userdata.orgs === undefined ||
        userdata.orgs === null ||
        userdata.orgs.length <= 1 ? null : (
          <Select
            SelectDisplayProps={{
              style: {
                marginLeft: 10,
                maxWidth: 200,
                overflow: "hidden",
              },
            }}
            value={userdata.active_org.id}
            fullWidth
            style={{
              zIndex: 10012,
              marginTop: 5,
              backgroundColor: theme.palette.surfaceColor,
              marginRight: 15,
              color: "white",
              height: 50,
              width: 200,
            }}
            MenuProps={{
              style: { zIndex: 10012 },
            }}
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

								const imagesize = 22

								//if (data.creator_org !== undefined && data.creator_org !== null && data.creator_org.length > 0 && data.fixed !== true) {
								var skipOrg = false 
								if (data.creator_org !== undefined && data.creator_org !== null && data.creator_org.length > 0) {
									// Finds the parent org
									for (var key in userdata.child_orgs) {
										if (data.child_orgs[key].id === data.creator_org) {
											skipOrg = true 
											break
										}
									}

									if (skipOrg) {
										return null
									}
								}

								// Reordering to have suborgs with access under original org
								if (data.child_orgs !== undefined && data.child_orgs !== null) {
									var cnt = 0
									for (var key in data.child_orgs) {
										const childorg = data.child_orgs[key]
										const foundIndex = userdata.orgs.findIndex(item => item.id === childorg.id)
										if (foundIndex !== -1) {
											const newindex = parseInt(index)+parseInt(cnt)

											var newitem = userdata.orgs[foundIndex]
											newitem.fixed = true
											userdata.orgs.splice(newindex+1, 0, newitem)
											userdata.orgs.splice(foundIndex+1, 1)
										} else {
											console.log("ORG NOT FOUND IN LIST: ", childorg)

										}

										// This is stupid :)
										cnt += 1
									}
								}

								//console.log("ORG: ", data)
								const imageStyle = {
									width: imagesize, 
									height: imagesize, 
									pointerEvents: "none", 
									marginRight: 10, 
									marginLeft: data.creator_org !== undefined && data.creator_org !== null && data.creator_org.length > 0 ? 20 : 0,
								}

								const parsedTitle = data.creator_org !== undefined && data.creator_org !== null && data.creator_org.length > 0 ? `Suborg of ${data.creator_org}` : ""

								const image = data.image === "" ? 
									<img alt={data.name} src={theme.palette.defaultImage} style={imageStyle} />
									:
									<img alt={data.name} src={data.image} style={imageStyle} />

								return (
									<MenuItem key={index} disabled={data.id === userdata.active_org.id} style={{backgroundColor: theme.palette.inputColor, color: "white", height: 40,}} value={data.id}>

										<Tooltip color="primary" title={parsedTitle} placement="left">
											<div style={{display: "flex"}}>
												{image} {data.name}
											</div>
										</Tooltip>
									</MenuItem>
								)
            })}
          </Select>
        )}
      </div>
    </div>
  );

  //console.log("USR: ", userdata.orgs)

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
                  <HomeIcon style={{ marginTop: "3px", marginRight: "5px" }} />
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
                Shuffle
              </div>
            </Link>
          </ListItem>
          <ListItem style={{ textAlign: "center" }}>
            <Link to="/workflows" style={hrefStyle}>
              <div
                onMouseOver={handleSoarHover}
                onMouseOut={handleSoarHoverOut}
                style={{ color: SoarHoverColor, cursor: "pointer" }}
              >
                Workflows
              </div>
            </Link>
          </ListItem>
          <ListItem style={{ textAlign: "center" }}>
            <Link to="/apps" style={hrefStyle}>
              <div
                onMouseOver={handleHelpHover}
                onMouseOut={handleHelpHoverOut}
                style={{ color: HelpHoverColor, cursor: "pointer" }}
              >
                Apps
              </div>
            </Link>
          </ListItem>
          {/*
       				<ListItem style={{textAlign: "center"}}>
						<Link to="/configurations" style={hrefStyle}>
    						<div onMouseOver={handleCredentialHover} onMouseOut={handleCredentialHoverOut} style={{color: CredentialHoverColor, cursor: "pointer"}}>Configure</div> 
						</a>
       				</ListItem>
					*/}
        </List>
      </div>
      <div
        style={{ flex: "10", display: "flex", flexDirection: "row-reverse" }}
      >
        {avatarMenu}
      </div>
    </div>
  );

  // <Divider style={{height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
  const loadedCheck = (
    <div style={{ minHeight: 60 }}>
      <BrowserView>{loginTextBrowser}</BrowserView>
      <MobileView>{loginTextMobile}</MobileView>
    </div>
  );
  // <div style={{backgroundImage: "linear-gradient(-90deg,#342f78 0,#29255e 50%,#1b1947 100%"}}>
  return (
    <div
      style={{
        width: "100%",
        position: "fixed",
        minHeight: 60,
        top: 0,
        zIndex: 10000,
        backgroundColor: "inherit",
      }}
    >
      {loadedCheck}
    </div>
  );
};

export default Header;
