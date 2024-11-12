import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import theme from "../theme.jsx";
import { BrowserView, MobileView } from "react-device-detect";

import { useNavigate, Link } from "react-router-dom";
import ReactGA from "react-ga4";
import LicencePopup from "../components/LicencePopup.jsx";
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
  ButtonGroup,
  Grid,
  IconButton,
  Divider,
  LinearProgress,
  AppBar,
  Dialog,
  DialogTitle,
} from "@mui/material";
import { makeStyles } from "@mui/styles";

import {
  Close as CloseIcon,
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
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from "@mui/icons-material";
import zIndex from "@mui/material/styles/zIndex.js";

const useStyles = makeStyles((theme) => ({
  menuButton: {
    textTransform: "none !important",
    fontStyle: "normal",
    color: "#333",
    textAlign: "center",
    fontSize: "16px !important",
    fontWeight: "500 !important",
    display: "flex",
    alignItems: "center",
    '&:hover': {
      backgroundColor: "transparent",
    },
  },
  dropdownMenu: {
    borderRadius: "12px !important",
    zIndex: 10,
    "& .MuiPaper-root": {
      border: "1px solid #f85a3e",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      borderRadius: "12px !important",
      top: -10,
      overflow: "visible",
      background: "#1A1A1A",
      "&::before": {
        content: '""',
        display: "block",
        position: "absolute",
        top: -10,
        left: "82%",
        borderLeft: "10px solid transparent",
        borderRight: "10px solid transparent",
        borderBottom: "10px solid #f85a3e",
      },
    },
  },
  dropdownMenuItem: {
    fontSize: "16px",
    fontWeight: 400,
    color: "#fff",
    background: "#1A1A1A",
    borderRadius: 16, // Ensure the border radius matches the container
    transition: "background-color 0.3s, color 0.3s",
    '&:hover': {
      color: "#1A73E8",
      background: "#3c3c3c",
    },
  },
  menuList: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    margin: 0,
    listStyle: "none",
    textTransform: "none",
  },
  cssStcg3yMenuList: {
    borderRadius: "12px !important",
  },
  divider: {
    width: "80%",
    border: "0.5px solid #494949",
    backgroundColor: "#fff",
    alignItems: "center",
    marginLeft: 17
  },
}));

const Header = (props) => {
  const {
    globalUrl,
    isLoaded,
    isLoggedIn,
    removeCookie,
    homePage,
    userdata,
    isMobile,
    serverside,
    billingInfo,

	notifications,
  } = props;
  const [isHeader, setIsHeader] = React.useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorElAvatar, setAnchorElAvatar] = React.useState(null);
  const [subAnchorEl, setSubAnchorEl] = React.useState(null);
  const [upgradeHovered, setUpgradeHovered] = React.useState(false);
  const [showTopbar, setShowTopbar] = useState(false) // Set to true to show top bar
  const stripeKey = typeof window === 'undefined' || window.location === undefined ? "" : window.location.origin === "https://shuffler.io" ? "pk_live_51PXYYMEJjT17t98N20qEqItyt1fLQjrnn41lPeG2PjnSlZHTDNKHuisAbW00s4KAn86nGuqB9uSVU4ds8MutbnMU00DPXpZ8ZD" : "pk_test_51PXYYMEJjT17t98NbDkojZ3DRvsFUQBs35LGMx3i436BXwEBVFKB9nCvHt0Q3M4MG3dz4mHheuWvfoYvpaL3GmsG00k1Rb2ksO"
  let navigate = useNavigate();
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleTooltipClose = () => {
    setTooltipOpen(false);
  };

  const handleTooltipOpen = () => {
    setTooltipOpen(true);
  };

  const topbar_var = "topbar_closed5"
  useEffect(() => {
	// Manually setShowTopbar(true) to show topbar by default
    const topbar = localStorage.getItem(topbar_var)
    if (topbar === "true") {
      setShowTopbar(false)
    } 
  }, [])

  const hoverColor = "#f85a3e";
  const hoverOutColor = "#e8eaf6";

  const handleHover = (event) => {
    event.target.style.color = hoverColor;
  };

  const handleHoverOut = (event) => {
    event.target.style.color = hoverOutColor;
  };

  const handleClose = () => {
    setAnchorEl(null);
    setAnchorElAvatar(null);
  };
  // Should be based on some path
  const logoCheck = !homePage ? null : null

  const hrefStyle = {
    color: hoverOutColor,
    textDecoration: "none",
    textTransform: "none",
    fontStyle: "normal",
    width: "100%",
    fontSize: "16px",
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
      window.location.host === "shuffler.io" ||
      window.location.host === "localhost:5002";

  const curpath = (typeof window !== "undefined" && window.location && typeof window.location.pathname === "string")
    ? window.location.pathname
    : "";

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

        removeCookie("__session", { path: "/" });
        removeCookie("__session", { path: "/" });
        removeCookie("__session", { path: "/" });

        removeCookie("__session", { path: "/" });
        window.location.pathname = "/";

        localStorage.setItem("globalUrl", "")

        // Delete userinfo from localstorage
        localStorage.removeItem("apps")
        localStorage.removeItem("workflows")
        localStorage.removeItem("userinfo")
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const notificationWidth = 335
  const imagesize = 22;
  const boxColor = "#86c142";

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
        } else {
          localStorage.removeItem("apps");
          localStorage.removeItem("workflows");
          localStorage.removeItem("userinfo");
        }

        return response.json();
      })
      .then(function (responseJson) {
        console.log("In here?");
        if (responseJson.success === true) {
          if (
            responseJson.region_url !== undefined &&
            responseJson.region_url !== null &&
            responseJson.region_url.length > 0
          ) {
            console.log("Region Change: ", responseJson.region_url);
            localStorage.setItem("globalUrl", responseJson.region_url);
            //globalUrl = responseJson.region_url
          }

          if (responseJson["reason"] === "SSO_REDIRECT") {
            toast.info("Redirecting to SSO login page as SSO is required for this organization.")
            setTimeout(() => {
              toast.info(
                "Redirecting to SSO login page as SSO is required for this organization."
              );
              window.location.href = responseJson["url"];
              return;
            }, 2000);
          } else {
            toast("Successfully changed active organization - refreshing!");
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } else {
          if (
            responseJson.reason !== undefined &&
            responseJson.reason !== null &&
            responseJson.reason.length > 0
          ) {
            toast(responseJson.reason);
          } else {
            toast(
              "Failed changing org. Try again or contact support@shuffler.io if this persists."
            );
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
        <Tooltip color="primary" title={"Shuffle is Open Source, and has a thriving Discord Automation Community"} placement="left">
          <IconButton
            color="primary"
            style={{}}
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={(event) => { }}
          >
            <svg viewBox="0 0 256 199" width="256" height="199" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" style={{ height: 30, width: 30, }}><path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" fill="#dadae1" /></svg>
            {/*#f865f2*/}
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
      : ""

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
        <ExpandMoreIcon style={{ color: "rgba(255,255,255,0.4)", }} />
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
            <BusinessIcon style={{ marginRight: 5 }} /> Organization
          </MenuItem>
        </Link>
        <Link to="/settings" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <SettingsIcon style={{ marginRight: 5 }} /> Account
          </MenuItem>
        </Link>

        <Divider style={{ marginTop: 10, marginBottom: 10, }} />
		<Link to="/admin?admin_tab=priorities" style={hrefStyle}>
		  <MenuItem
			onClick={(event) => {
			  handleClose();
			}}
		  >
			<NotificationsIcon style={{ marginRight: 5 }} /> Notifications ({
				notifications === undefined || notifications === null ? 0 : 
				notifications?.filter((notification) => notification.read === false).length
			}) 
		  </MenuItem>
		</Link>
        <Link to="/usecases2" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <LightbulbIcon style={{ marginRight: 5 }} /> Use Cases
          </MenuItem>
        </Link>

        <Divider style={{ marginTop: 10, marginBottom: 10, }} />

        <Link to="/docs" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
          >
            <HelpOutlineIcon style={{ marginRight: 5 }} /> About
          </MenuItem>
        </Link>
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
        <Divider style={{ marginBottom: 10, }} />

        <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: 5, marginBottom: 5, }}>
          Version: 1.4.5
        </Typography>
      </Menu>
    </span>
  );

  const listItemStyle = {
    textAlign: "center",
    marginTop: "auto",
    marginBottom: "auto",
    // marginRight: 10,
  };

  const modalView =
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      PaperProps={{
        style: {
          color: "white",
          minWidth: 850,
          minHeight: 370,
          padding: 20,
          backgroundColor: "rgba(0, 0, 0, 1)",
          borderRadius: theme.palette?.borderRadius,
        },
      }}
    >
      <DialogTitle style={{ display: "flex" }}>
        <span style={{ color: "white", fontSize: 24 }}>
          Upgrade your plan
        </span>
        <IconButton
          onClick={() => {
            if (isCloud) {
              ReactGA.event({
                category: "header",
                action: "close_Upgread_popup",
                label: "",
              })
            };
            setModalOpen(false);
          }}
          style={{
            marginLeft: "auto",
            position: "absolute",
            top: 20,
            right: 20,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
        <LicencePopup
          serverside={serverside}
          removeCookie={removeCookie}
          isLoaded={isLoaded}
          isLoggedIn={isLoggedIn}
          globalUrl={globalUrl}

          billingInfo={billingInfo}

          userdata={userdata}
          stripeKey={stripeKey}
          setModalOpen={setModalOpen}
          {...props}
        />
      </div>
    </Dialog>

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
      <List className={classes.menuList} component="nav">
        <ListItem style={{ textAlign: "center", marginLeft: "0px" }}>
          <Link to="/usecases2" style={hrefStyle}>
            <Button
              variant="text"
              color="secondary"
              className={classes.menuButton}
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
        <ListItem style={{ textAlign: "center", marginLeft: 0, paddingRight: 0 }}>
          <Link rel="noopener noreferrer" to="/docs" style={hrefStyle}>
            <Button
              variant="text"
              color="secondary"
              className={classes.menuButton}
              onClick={() => { }}
            >
              Docs
            </Button>
          </Link>
        </ListItem>
        <ListItem
          style={{ textAlign: "center", marginLeft: "0px", paddingRight: 0 }}
        // onMouseEnter={handleMenuOpen}
        // onMouseLeave={handleMenuClose}
        >
          <Button
            variant="text"
            color="secondary"
            className={classes.menuButton}
            style={{ width: 200 }}
            onClick={handleMenuOpen}
          >
            Pricing & Services
            <KeyboardArrowDownIcon style={{ marginLeft: 4 }} />
          </Button>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            className={classes.dropdownMenu}
            classes={{ paper: classes.dropdownMenu }}
            MenuListProps={{ className: classes.cssStcg3yMenuList }}
          >
            {isCloud && (
              <MenuItem className={classes.dropdownMenuItem} onClick={() => handleMenuItemClick('/pricing')}>
                <Link to="/pricing" style={hrefStyle}>
                  Pricing
                </Link>
              </MenuItem>
            )}
            <div className={classes.divider} />
            <MenuItem className={classes.dropdownMenuItem} onClick={() => handleMenuItemClick('/professional-services')}>
              <Link to="/professional-services" style={hrefStyle}>
                Professional Services
              </Link>
            </MenuItem>
            <div className={classes.divider} />
            <MenuItem className={classes.dropdownMenuItem} onClick={() => handleMenuItemClick('/training')}>
              <Link to="/training" style={hrefStyle}>
                Training Courses
              </Link>
            </MenuItem>
            <div className={classes.divider} />
            <MenuItem className={classes.dropdownMenuItem} onClick={() => handleMenuItemClick('/partners')}>
              <Link to="/partners" style={hrefStyle}>
                Partner Program
              </Link>
            </MenuItem>
          </Menu>
        </ListItem>



        {/* <ListItem style={{ textAlign: "center", marginLeft: 0, paddingRight: 0 }}>
          <Link rel="noopener noreferrer" to="/training" style={hrefStyle}>
            <Button
              variant="text"
              color="secondary"
              className={classes.menuButton}
              onClick={() => { }}
            >
              Training
            </Button>
          </Link>
        </ListItem> */}
      </List>
      <List
        style={{ flex: 2, display: "flex", alignItems: "flex-start", padding: 0, }}
        component="nav"
      >
        <div style={{ maxWidth: 70, minWidth: 70, }} />
        <span style={{ marginTop: 8, marginRight: 15, }}>
          <SearchField globalUrl={globalUrl} isHeader={true} isLoggedIn={isLoggedIn} isLoaded={isLoaded} serverside={serverside} userdata={userdata} small={true} rounded={true} />
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
              color: "white",
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
        <div style={{ flexDirection: "row", marginLeft: 0 }}>
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
                  onMouseOver={handleHover}
                  onMouseOut={handleHoverOut}
                  style={{ cursor: "pointer" }}
                >
                  <Grid container direction="row" alignItems="center">
                    <Grid item style={{}}>
                      <img
                        src={"/images/logos/orange_logo.svg"}
                        alt="logo"
                        style={{ height: 20, width: 20, marginTop: 4 }}
                      />
                    </Grid>
                  </Grid>
                </div>
              </Link>
              <ListItem style={listItemStyle}>
                <Link to="/workflows" style={hrefStyle}>
                  <div
                    onMouseOver={handleHover}
                    onMouseOut={handleHoverOut}
                    style={{
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
                    onMouseOver={handleHover}
                    onMouseOut={handleHoverOut}
                    style={{
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
                    onMouseOver={handleHover}
                    onMouseOut={handleHoverOut}
                    style={{
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
              {/*
              <ListItem style={listItemStyle}>
                <Link to="/admin?admin_tab=billing" style={hrefStyle}>
                  <div
                    onMouseOver={handleHover}
                    onMouseOut={handleHoverOut}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      width:170
                    }}
                  >
                    <Typography style={{ marginTop: defaultTop }}>
                    Pricing & Services
                    </Typography>
                  </div>
                </Link>
              </ListItem>
			*/}
            </ListItem>
          </List>
        </div>
        <div style={{ flex: 1, marginTop: 10, }}>
          <SearchField globalUrl={globalUrl} isHeader={true} isLoggedIn={isLoggedIn} isLoaded={isLoaded} serverside={serverside} userdata={userdata} hidemargins={true} />
        </div>
        <div style={{ flex: isLoggedIn ? null : 1, display: "flex", flexDirection: "row-reverse" }}>
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
              {supportMenu}
              {logoCheck}
            </span>

            {userdata === undefined ||
              userdata.orgs === undefined ||
              userdata.orgs === null ||
              userdata.orgs.length <= 0 ? null : (
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
                    borderRadius: theme.palette?.borderRadius,
                    backgroundColor: theme.palette.surfaceColor,
                    marginRight: 15,
                    color: "white",
                    height: 45,
                    width: 85,
                  }}
                  value={userdata.active_org.id}
                  fullWidth
                  onChange={(e) => {
                    if (e.target.value === undefined || e.target.value === "create_new_suborgs") {
                      return
                    }

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
                      )

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

                        if (regiontag === "california") {
                          regiontag = "us"
                        } else if (regiontag === "frankfurt") {
                          regiontag = "fr"
                        }
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
                                  borderRadius: theme.palette?.borderRadius,
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
                  <Divider />
                  <Link to="/admin?tab=suborgs" style={hrefStyle}>
                    <MenuItem
                      key={"add suborgs"}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: "white",
                        height: 40,
                        zIndex: 10003,
                      }}
                      value={"create_new_suborgs"}
                    >
                      <Tooltip
                        color="primary"
                        title={""}
                        placement="left"
                      >
                        <div style={{ display: "flex", marginLeft: 50, marginRight: 50, }}>
                          <AddIcon />
                          <span style={{ marginLeft: 8 }}>
                            Add suborgs
                          </span>
                        </div>
                      </Tooltip>
                    </MenuItem>
                  </Link>
                </Select>
              </span>
            )}

            {/* Show on cloud, if not suborg and if not customer/pov/internal */}
            {
              userdata.licensed !== undefined &&
                userdata.licensed !== null &&
                userdata.licensed === false ?
                <ListItem
                  style={{
                    textAlign: "center",
                    marginLeft: 0,
                    marginRight: 7,
                    marginTop: 0,
                  }}
                  title={upgradeHovered ? "Upgrade License" : ""}
                  open={tooltipOpen}
                  onClose={handleTooltipClose}
                >
                  <Link style={hrefStyle}>
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ textTransform: "none" }}
                      onMouseOver={() => { setUpgradeHovered(true); handleTooltipOpen(); }}
                      onMouseOut={() => { setUpgradeHovered(false); handleTooltipClose(); }}
                      onClick={() => {
                        if (isCloud) {
                          ReactGA.event({
                            category: "header",
                            action: "upgrade_popup_click",
                          })
                        }

                        setModalOpen(true)
                      }}
                    >
                      {/* {upgradeHovered ?
                        "Upgrade License"
                        : */}
                      Upgrade
                      {/* } */}

                    </Button>
                  </Link>
                </ListItem>
                : null}

            {userdata === undefined ||
              userdata.app_execution_limit === undefined ||
              userdata.app_execution_usage === undefined ||
              userdata.app_execution_usage < 1000 ? null : (
              <Tooltip
                title={
					<Typography variant="body1" style={{margin: 10, }}>
						<b>App Runs used</b>: {userdata.app_execution_usage} / {userdata.app_execution_limit}. When the limit is reached, you can still use Shuffle normally, but your Workflow triggers will stop workflows from starting. Reach out to support@shuffler.io to extend this limit. Customer workflows are NOT stopped this way.
					</Typography>
				}
              >
                <div
                  style={{
                    maxHeight: 30,
                    minHeight: 30,
                    padding: 8,
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: theme.palette?.borderRadius,
                    marginTop: 5,
                    backgroundColor: theme.palette.surfaceColor,
                    minWidth: 60,
                    maxWidth: 60,
                    border:
                      userdata.app_execution_usage /
                        userdata.app_execution_limit >=
                        0.9
                        ? "2px solid #f86a3e"
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
              onMouseOver={handleHover}
              onMouseOut={handleHoverOut}
              style={{ cursor: "pointer" }}
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
              onMouseOver={handleHover}
              onMouseOut={handleHoverOut}
              style={{ cursor: "pointer" }}
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
                style={{ cursor: "pointer" }}
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
              onMouseOver={handleHover}
              onMouseOut={handleHoverOut}
              onClick={handleClickLogout}
              style={{ cursor: "pointer" }}
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

  const topbarHeight = showTopbar ? 40 : 0
  const topbar = !isCloud || !showTopbar ? null :
    curpath === "/" || curpath.includes("/docs") || curpath === "/pricing" || curpath === "/contact" || curpath === "/search" || curpath === "/usecases" || curpath === "/usecases2" || curpath === "/training" || curpath === "/professional-services" ?
      <span style={{ zIndex: 50001, }}>
        <div style={{ position: "relative", height: topbarHeight, backgroundImage: "linear-gradient(to right, #f86a3e, #f34079)", overflow: "hidden", }}>
          <Typography style={{ paddingTop: 7, fontSize:16, margin: "auto", textAlign: "center", color: "white", }}>
            {/* Shuffle 1.4.0 is out! Read more about&nbsp; */}
            New&nbsp;
            <u>
              <span onClick={() => {
                ReactGA.event({
                  category: "landingpage",
                  action: "click_header_training",
                  label: "",
                })

                navigate("/training")

              }} style={{ cursor: "pointer", textDecoration: "none", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                Public Training
              </span>
            </u>
            &nbsp;Dates Released! 
          </Typography>
          <IconButton color="secondary" style={{ position: "absolute", top: -3, right: 20, }} onClick={(event) => {
            setShowTopbar(false)

            // Set storage that it's clicked
            localStorage.setItem(topbar_var, "true")
          }}>
            <CloseIcon />
          </IconButton>
        </div>
      </span>
      :
      null

  return !isMobile ? (
    <div style={{ marginTop: 0 }}>
      <AppBar
        color="transparent"
        elevation={0}
        style={{
          backgroundColor: "transparent",
          boxShadow: "none",
          minHeight: 68,
          maxHeight: 68,
          backgroundColor: theme.palette.backgroundColor,
        }}
      >
        {topbar}
        <div
          style={{
            position: "sticky",
            top: 0,
            minHeight: 68,
            maxHeight: 68,
            backgroundColor: theme.palette.backgroundColor,
          }}
        >
          {loginTextBrowser}
        </div>
        {modalView}
      </AppBar>
    </div>
  ) : (
    <MobileView>{loginTextMobile}</MobileView>
  );
};

export default Header;
