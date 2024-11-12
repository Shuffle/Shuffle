import React, { useEffect, useRef, useState, useContext, useCallback, useMemo } from "react";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  GridView as GridViewIcon,
  ShieldOutlined as ShieldOutlinedIcon,
  Add as AddIcon,
  BorderColor,
  Close as CloseIcon,
} from "@mui/icons-material";
import SearchBox from "./SearchData.jsx";
import {
  Button,
  Typography,
  Autocomplete,
  TextField,
  Popper,
  Avatar,
  Menu,
  IconButton,
  MenuItem,
  Divider,
  Box,
  Dialog,
  DialogContent,
  Fade,
  Portal,
  Collapse,
} from "@mui/material";
import theme from "../theme.jsx";
import { 
	Settings as SettingsIcon 
} from "@mui/icons-material";
import RecentWorkflow from "../components/RecentWorkflow.jsx";

import { useNavigate } from "react-router";

import { Link } from "react-router-dom";
import {
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  HelpOutline as HelpOutlineIcon,
  MeetingRoom as MeetingRoomIcon,
  Lightbulb as LightbulbIcon,
  Search as SearchIcon
} from "@mui/icons-material";

import { toast } from "react-toastify";
import { Context } from "../context/ContextApi.jsx";

const ShuffleLogo = "/images/Shuffle_logo.png";
const detectionIcon = "/icons/detection.svg";
const documentationIcon = "/icons/documentation.svg";
const ExpandMoreAndLessIcon = "/icons/expandMoreIcon.svg";

const LeftSideBar = ({ userdata, serverside, globalUrl, notifications, }) => {

  const navigate = useNavigate();
  const {setLeftSideBarOpenByClick, leftSideBarOpenByClick, setSearchBarModalOpen, searchBarModalOpen} = useContext(Context);
  const [expandLeftNav, setExpandLeftNav] = useState(false);
  const [activeOrgName, setActiveOrgName] = useState(
    userdata?.active_org?.name || "Select Organziation"
  );
  const [openAutocomplete, setOpenAutocomplete] = useState(false);
  const [autocompleteValue, setAutocompleteValue] = useState("");
  const [openautomatetab, setOpenautomateTab] = useState(false);
  const [openSecurityTab, setOpenSecurityTab] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(activeOrgName);
  const [anchorElAvatar, setAnchorElAvatar] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [recentworkflows, setRecentworkflows] = useState(null);
  const [usersWorkFlows, setUsersWorkFlows] = useState([]);
  const [currentOpenTab, setCurrentOpenTab] = useState("");
  const currentPath = window.location.pathname;
  const [hoverOnAvatar, setHoverOnAvatar] = useState(false);
  const [orgOptions, setOrgOptions] = useState(
    userdata?.orgs?.map((org) => ({
      id: org.id,
      name: org.name,
      image: org.image,
      region_url: org.region_url,
    })) || []
  );
  const userOrgs = React.useMemo(() => {
    return orgOptions.find((option) => option.name === selectedOrg);
  }, [selectedOrg, orgOptions]);


  
  const CustomPopper = (props) => {
    return (
      <Portal>
        <Popper
          {...props}
          open={openAutocomplete}
          anchorEl={autocompleteRef.current}
          placement="top-start"
          modifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 8],
                boundariesElement: "viewport"
              },
            },
          ]}
          style={{
            zIndex: 1000015,
          }}
          sx={{
            zIndex: 1000015,
            backgroundColor: "#1f1f1f",
            opacity: 1,
            "& .MuiAutocomplete-listbox": {
              backgroundColor: "#1f1f1f",
              padding: 0,
              margin: 0,
              borderRadius: "4px",
              height: "100%",
              width: "100%"
            },
            outline: "1px solid #555555",
            borderRadius: 1,
            overflow: 'hidden'
            
          }}
        >
          <Box
          sx={{
            maxHeight: 250,
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#494949 transparent",
            "& .MuiAutocomplete-listbox": {
              backgroundColor: "#1f1f1f",
              padding: 0,
              margin: 0,
              borderRadius: "4px",
            },
          }}
        >
          {props.children}
        </Box>
        <Link to="/admin2" style={hrefStyle}>
			<Box
				sx={{
				  width: "100%",
				  padding: "12px 8px",
				  textAlign: "center",
				  color: "#fff",
				  fontSize: "16px",
				  cursor: "pointer",
				  borderTop: "1px solid #444444",
				  "&:hover": {
					backgroundColor: "#444444",
				  },
				  textTransform: 'none'
				}}
				onClick={(e)=>{
				  setSelectedOrg(userdata?.active_org?.name);
				  setOpenAutocomplete(false)
				}}
			  >
				Add suborg
			</Box>
		</Link>
        </Popper>
      </Portal>
    );
  };

  const iconRef = useRef(null);
  
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
  const parsedAvatar =
    userdata?.avatar !== undefined &&
    userdata?.avatar !== null &&
    userdata?.avatar.length > 0
      ? userdata?.avatar
      : "";

  const autocompleteRef = useRef(null);
  const hoverOutColor = "#e8eaf6";

  const handleClose = () => {
    setAnchorEl(null);
    setAnchorElAvatar(null);
  };

  const hrefStyle = {
    color: hoverOutColor,
    textDecoration: "none",
    textTransform: "none",
    fontStyle: "normal",
    width: "100%",
    fontSize: "16px",
  };

  const isCloud =
    serverside === true || typeof window === "undefined"
      ? true
      : window.location.host === "localhost:3002" ||
        window.location.host === "shuffler.io" ||
        window.location.host === "localhost:5002";

  const UpdateTabStatus  = useCallback(() => {  
    const lastTabOpenByUser = localStorage.getItem("lastTabOpenByUser");
    if ((lastTabOpenByUser === "automate" && currentPath.includes("/dashboards/automate")) || currentPath.includes("/dashboards/automate")) {
      setOpenautomateTab(true);
      setCurrentOpenTab("automate");
      setOpenSecurityTab(false);
        } else if ((lastTabOpenByUser === "security" && currentPath.includes("/dashboards/security")) || currentPath.includes("/dashboards/security")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(true);
      setCurrentOpenTab("security");
        } else if ((lastTabOpenByUser === "usecases" && currentPath.includes("/usecases2")) || currentPath.includes("/usecases2")) {
      setOpenautomateTab(true);
      setOpenSecurityTab(false);
      setCurrentOpenTab("usecases");
        } else if ((lastTabOpenByUser === "workflows" && currentPath === "/workflows") || currentPath === "/workflows") {
      setOpenautomateTab(true);
      setOpenSecurityTab(false);
      setCurrentOpenTab("workflows");
        } else if ((lastTabOpenByUser === "apps" && currentPath.includes("/search")) || currentPath.includes("/search")) {
      setOpenautomateTab(true);
      setOpenSecurityTab(false);
      setCurrentOpenTab("apps");
        } else if ((lastTabOpenByUser === "detection" && currentPath.includes("/detections")) || currentPath.includes("/detections")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(true);
      setCurrentOpenTab("detection");
        } else if ((lastTabOpenByUser === "response" && currentPath.includes("/response")) || currentPath.includes("/response")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(true);
      setCurrentOpenTab("response");
        } else if ((lastTabOpenByUser === "docs" || currentPath.includes("/docs")) || currentPath.includes("/docs")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(false);
      setCurrentOpenTab("docs");
        } else {
      setOpenautomateTab(true);
      setOpenSecurityTab(false);
      setCurrentOpenTab("");
        }
  },[currentPath]);

  useEffect(() => {
    UpdateTabStatus();
    const expandLeftNav1 = localStorage.getItem("expandLeftNav");
    if (expandLeftNav1 === "false") {
      setLeftSideBarOpenByClick(false);
      setLeftSideBarOpenByClick(false);
    } else {
      setLeftSideBarOpenByClick(true);
      setLeftSideBarOpenByClick(true);
      setExpandLeftNav(true);
    }
  }, []);

  const getAvailableWorkflows = useCallback((amount) => {
  
    var url = `${globalUrl}/api/v1/workflows`
    if (amount !== undefined && amount !== null) {
      url += `?top=${amount}`
    }
  
      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.status !== 200) {
            toast("Failed getting workflows. Are you logged in?");
            return
          }
  
          return response.json();
        })
        .then((responseJson) => {
          if (responseJson !== undefined) {
  
        var newarray = []
        for (var wfkey in responseJson) {
          const wf = responseJson[wfkey]
          if (wf.public === true || wf.hidden === true) {
            continue
          }
  
          newarray.push(wf)
        }
  
        var actionnamelist = [];
        var parsedactionlist = [];
        for (var key in newarray) {
          for (var actionkey in newarray[key].actions) {
            const action = newarray[key].actions[actionkey];
            if (actionnamelist.includes(action.app_name)) {
              continue;
            }
  
            actionnamelist.push(action.app_name);
            parsedactionlist.push(action);
          }
        }
  
        if (newarray.length > 0) {
          try {
            localStorage.setItem("workflows", JSON.stringify(newarray))
          } catch (e) {
            console.log("Failed to set workflows in localstorage: ", e)
          }
        }
  
          setTimeout(() => {
          setUsersWorkFlows(newarray);
          if (newarray.length === 0) {
            setUsersWorkFlows([]);
          }
        }, 250)
  
          } 
        })
        .catch((error) => {
          toast(error.toString());
        });
    }, [usersWorkFlows]);

  useEffect(() => {
    const fetchData = async () => {
      if (recentworkflows === null || recentworkflows === undefined || recentworkflows?.length === 0) {
        await delay(2000);
      }

      const storagewf = localStorage.getItem("workflows");
      const storageWorkflows = JSON.parse(storagewf);

      if (storageWorkflows) {
        setUsersWorkFlows(storageWorkflows);
      } else {
        getAvailableWorkflows();
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (usersWorkFlows) {
      const recentWorkflow = HandleGetUsersRecentWorkflows(usersWorkFlows);
      setRecentworkflows(recentWorkflow);
    }
  }, [usersWorkFlows]); 

  const removeCookie = (name, path = "/") => {
    document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
  };

  const handleClickLogout = () => {
    // Logout API call
    fetch(`${globalUrl}/api/v1/logout`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status !== 200) {
          toast.error("Failed to logout. Please try again.");
          return;
        }

        // Remove cookies
        removeCookie("session_token", { path: "/" });
        removeCookie("__session", { path: "/" });

        // Clear localStorage
        localStorage.clear();

        // Redirect to home immediately
        window.location.href = "/";
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const avatarMenu = (
    <span>
      <IconButton
        style={{
          marginRight: 5,
          color: theme.palette.primary.contrastText,
        }}
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event) => {
          setAnchorElAvatar(event.currentTarget);
        }}
        disableRipple
        disableElevation
      >
        <SettingsIcon
          style={{ height: 24, width: 24 }}
          alt="Your username here"
          src={parsedAvatar}
        />
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorElAvatar}
        keepMounted
        open={Boolean(anchorElAvatar)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        sx={{
          zIndex: 1000015,
          "& .MuiPaper-root": {
            backgroundColor: "#1F1F1F",
            color: "#FFFFFF",
            borderRadius: 1,
          },
          "& .MuiList-root": {
            backgroundColor: "#1F1F1F",
          },
          "& .MuiMenuItem-root": {
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#333333",
            },
          },
          "& .MuiDivider-root": {
            backgroundColor: "#555555",
          },
        }}
      >
        <Link to="/admin2" style={hrefStyle}>
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
		<Link to="/admin2?admin_tab=priorities" style={hrefStyle}>
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
          Version: 2.0.0-beta
        </Typography>
      </Menu>
    </span>
  );

  const getWorkflowAppgroup = (data) => {
    if (!data.actions) {
      return [];
    }

    let appsFound = [];
    Object.keys(data.actions).forEach((key) => {
      const parsedAction = data.actions[key];

      if (!parsedAction.large_image) {
        return;
      }

      if (
        appsFound.findIndex((app) => app.app_name === parsedAction.app_name) < 0
      ) {
        appsFound.push(parsedAction);
      }
    });

    return appsFound;
  };

  const HandleGetUsersRecentWorkflows = useCallback(() => {
    if (!usersWorkFlows) {
      return [];
    }

    let groupedWorkflows = [];

    usersWorkFlows.forEach((workflow) => {
      const apps = getWorkflowAppgroup(workflow);
      if (apps.length > 0) {
        groupedWorkflows.push({
          name: workflow.name,
          id: workflow.id,
          apps: apps,
        });
      }
    });

    return groupedWorkflows;
  },[usersWorkFlows]);

  const handleClickChangeOrg = (orgId) => {

    toast.info("Changing active organization - please wait!");

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
          localStorage.removeItem("lastTabOpenByUser");
        }

        return response.json();
      })
      .then(function (responseJson) {
        if (responseJson.success === true) {
          if (
            responseJson?.region_url !== undefined &&
            responseJson?.region_url !== null &&
            responseJson?.region_url.length > 0
          ) {
            localStorage.setItem("globalUrl", responseJson.region_url);
          }

          if (responseJson["reason"] === "SSO_REDIRECT") {
            setTimeout(() => {
              toast.info(
                "Redirecting to SSO login page as SSO is required for this organization."
              );
              window.location.href = responseJson["url"];
              return;
            }, 2000);
          } else {
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }

          toast.success("Successfully changed active organization - refreshing!");
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
      });
};

  const getRegionTag = (region_url) => {
    let regiontag = "eu";
    if (
      region_url !== undefined &&
      region_url !== null &&
      region_url.length > 0
    ) {
      const regionsplit = region_url.split(".");
      if (regionsplit.length > 2 && !regionsplit[0].includes("shuffler")) {
        const namesplit = regionsplit[0].split("/");
        regiontag = namesplit[namesplit.length - 1];

        if (regiontag === "california") {
          regiontag = "us";
        } else if (regiontag === "frankfurt") {
          regiontag = "fr";
        }
      }
    }
    return regiontag;
  };

  const CheckOrgStates = useCallback(() => {
    setOrgOptions(
      userdata?.orgs?.map((org) => ({
        id: org.id,
        name: org.name,
        image: org.image,
        region_url: getRegionTag(org.region_url),
      })) || []
    );
    setActiveOrgName(userdata?.active_org?.name || "Select Organization");
    setSelectedOrg(userdata?.active_org?.name || "Select Organization");
  },[orgOptions, activeOrgName, selectedOrg]);

  useEffect(() => {
    if (typeof userdata?.id === "string" && userdata?.id?.length > 0) {
      CheckOrgStates();
      setAutocompleteValue(userdata?.active_org?.name || "");
    }
  }, []);

  const ButtonStyle = {
    width: expandLeftNav ? "100%" : 30,
    justifyContent: expandLeftNav ? "flex-start" : "center",
    height: 35,
    color: openautomatetab ? "#F1F1F1" : "#C8C8C8",
    textTransform: "none",
    "& .MuiButton-root	": {
      width: expandLeftNav ? "100%" : 30,
      padding: 0,
    },
  };

  const modalView = (
		<Dialog
			open={searchBarModalOpen}
			onClose={() => {
				setSearchBarModalOpen(false);
			}}
			PaperProps={{
				style: {
					color: "white",
					minWidth: 750,
					height: 785,
					borderRadius: 16,
					border: "1px solid var(--Container-Stroke, #494949)",
					background: "var(--Container, #000000)",
					boxShadow: "0px 16px 24px 8px rgba(0, 0, 0, 0.25)",
					zIndex: 13000,
          			paddingTop: 20,
				},
			}}
		>
			<DialogContent className='dialog-content' style={{}}>
				<SearchBox globalUrl={globalUrl} serverside={serverside} userdata={userdata} />
			</DialogContent>
			<Divider style={{overflow: "hidden"}}/>
			<span style={{display:"flex", width:"100%", height:30}}>
			</span>
		</Dialog>
	);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: expandLeftNav ? 260 : 80,
        height: "calc(100vh - 60px)",
        borderRadius: 8,
        backgroundColor: "#212121",
        position: "relative",
        transition: "width 0.3s ease",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)" ,
        resize: 'both',
      }}
    >
      {modalView}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 16px 24px 27px",
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <img
            src={ShuffleLogo}
            alt="Shuffle Logo"
            style={{ width: 24, height: 24 }}
          />
        </a>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            right: !expandLeftNav && 8,
          }}
        >
          <Button
            onClick={() => {
              setExpandLeftNav(prev => !prev);
              setLeftSideBarOpenByClick((prev) => !prev);
              localStorage.setItem("expandLeftNav", !expandLeftNav)
            }}
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              left: 1,
              justifyContent: "center",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "transparent",
              },
            }}
            disableElevation
            disableRipple
          >
            <img
              src={ExpandMoreAndLessIcon}
              style={{
                transform: expandLeftNav ? "rotate(-180deg)" : "",
                transition: "transform 0.3s ease",
              }}
              alt="Expand/Collapse Icon"          
            />
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", width:"100%", height: "100%", overflowY: "auto", overflowX: "hidden",transition: 'display 0.3s ease' }} onMouseOver={()=>{!leftSideBarOpenByClick && setExpandLeftNav(true);}} onMouseLeave={()=>{!leftSideBarOpenByClick && setExpandLeftNav(false);setOpenAutocomplete(false);}}>
      <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: 228,
              height: 35,
              marginLeft: 'auto',
              marginRight: 'auto',
              paddingBottom: 1,
              justifyContent:'center',
              alignItems: 'center',
            }}
          >
            {expandLeftNav ? (
              <Fade in={expandLeftNav} timeout={500}>
                <TextField
                id="sidebar-search"
              placeholder= "Search"
              sx={{
                width: "100%",
                maxWidth: 228,
                "& .MuiInputBase-root": {
                  height: 35,
                  padding: 0,
                },
                "& .MuiOutlinedInput-root": {
                  cursor: "pointer",
                  width: 228,
                  "& fieldset": {
                    borderColor: "#494949",
                  },
                  "&:hover fieldset": {
                    borderColor: "#ffffff",
                    display: "block"
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#A9A9A9",
                  },
                },
                "& input": {
                  padding: "8px 14px",
                  fontSize: "14px",
                  color: "#C8C8C8",
                },
                backgroundColor: "transparent",
              }}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <SearchIcon style={{ color: "#CDCDCD", width: 24, height: 24, marginLeft: 16}} />
                ),
                disableUnderline: true,
              }}
              onClick={()=>{setSearchBarModalOpen(true)}}
              onChange={()=> {setSearchBarModalOpen(true)}}
            />
            </Fade>
            ):(
            <>
            <Fade in={!expandLeftNav} timeout={500}>
              <Button style={{color: "#CDCDCD", backgroundColor: "transparent", marginBottom: 5, borderRadius: 8, marginTop: 5 }} onClick={()=>{setSearchBarModalOpen(true)}} onMouseOver={(event)=>{event.currentTarget.style.backgroundColor = "#2f2f2f"}} onMouseLeave={(event)=> {event.currentTarget.style.backgroundColor = "transparent"}} disableElevation disableRipple><SearchIcon style={{width: 24, height: 24}}/></Button>
            </Fade>
            </>)}
            <span style={{display: expandLeftNav ? "none": "inline", border: "1px solid #494949", width: 48, marginLeft: 14, marginRight: 14}}></span>
      </Box>
      <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              height: "100%",
              overflowY: expandLeftNav ? "auto" : "hidden",
              scrollbarWidth: 'thin', 
              scrollbarColor: "#494949 transparent",
              overflowX: "hidden",
            }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            padding: expandLeftNav ? "0 16px" : "0px 8px",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row", marginTop: 2.5, width: expandLeftNav ? "100%" : 48, padding: "0px", }}>
	  		<Link to="/dashboards/automate" style={hrefStyle}>
            <Button
              onClick={(event) => {
                setOpenautomateTab(true);
                setOpenSecurityTab(false);
                setCurrentOpenTab("automate");
                localStorage.setItem("lastTabOpenByUser", "automate");
              }}
              sx={{
                ...ButtonStyle,
                backgroundColor: ((currentOpenTab === "automate" && currentPath.includes("/dashboards/automate"))|| (!expandLeftNav && (currentPath === "/workflows" || currentPath === "/usecases2" || currentPath.includes("/search"))))? "#2f2f2f": "transparent",
                "&:hover": { backgroundColor: "#2f2f2f" },
              }}
            >
              <img
                src={detectionIcon}
                style={{ width: 16, height: 16, marginRight: expandLeftNav ? 10 : 0 }}
                alt="Automate Icon"
              />
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  marginRight: "auto",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: currentOpenTab === "automate" && currentPath.includes("/dashboards/automate") ? "#F1F1F1" : "#C8C8C8",
                }}
              >
                Automate
              </span>
            </Button>
	  		</Link> 
            <IconButton
              onClick={() => {
                setOpenautomateTab((prev) => !prev);
                setOpenSecurityTab(false);
              }}
              sx={{
                marginLeft: 0.625,
              }}
            >
              {openautomatetab ? (
                <ExpandLessIcon
                  style={{
                    display: expandLeftNav ? "flex" : "none",
                    opacity: expandLeftNav ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
              ) : (
                <ExpandMoreIcon
                  style={{
                    display: expandLeftNav ? "flex" : "none",
                    opacity: expandLeftNav ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
              )}
            </IconButton>
          </Box>
          <Collapse in={openautomatetab} timeout="auto" unmountOnExit>
          <Box
            style={{
              maxHeight: expandLeftNav ? 150 : 0,
              overflow: "hidden",
              display:  "flex",
              flexDirection: "column",
              paddingLeft: 16,
              gap: 4,
              marginTop: expandLeftNav ? 16 : 0,
            }}
          >
	  		<Link to="/usecases2" style={hrefStyle}>
            <Button
              onClick={(event) => {
                setCurrentOpenTab("usecases");
                localStorage.setItem("lastTabOpenByUser", "usecases");
              }}
              sx={{
                width: "100%",
                height: 35,
                color: "#C8C8C8",
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor: currentOpenTab === "usecases" && expandLeftNav && currentPath.includes("/usecases2")? "#2f2f2f": "transparent",
                "&:hover": { backgroundColor: "#2f2f2f" },
              }}
              disableRipple={expandLeftNav ? false : true}
            >
              <span style={{display: expandLeftNav ? "inline" : "none",opacity: expandLeftNav ? 1 : 0, transition: "opacity 0.3s ease", position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 16 }}>•</span>{" "}
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: currentOpenTab === "usecases" && currentPath.includes("/usecases3") ? "#F1F1F1" : "#C8C8C8",
                }}
              >
                Usecases
              </span>
            </Button>
	  		</Link>
	  		<Link to="/workflows" style={hrefStyle}>
            <Button
              onClick={(event) => {
                setCurrentOpenTab("workflows");
                localStorage.setItem("lastTabOpenByUser", "workflows");
              }}
              sx={{
                width: "100%",
                height: 35,
                color: "#C8C8C8",
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor: currentOpenTab === "workflows" && currentPath === "/workflows" && expandLeftNav? "#2f2f2f": "transparent",
                "&:hover": { backgroundColor: "#2f2f2f" },
              }}
              disableRipple={expandLeftNav ? false : true}
            >
              <span style={{display: expandLeftNav ? "inline" : "none", opacity: expandLeftNav ? 1 : 0, transition: "opacity 0.3s ease", position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 16 }}>•</span>{" "}
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: currentOpenTab === "workflows" && currentPath === "/workflows"  ? "#F1F1F1" : "#C8C8C8",
                }}
              >
                Workflows
              </span>
            </Button>
	  		</Link> 
	  		<Link to="/search?tab=org_apps" style={hrefStyle}>
            <Button
              onClick={(event) => {
                setCurrentOpenTab("apps");
                localStorage.setItem("lastTabOpenByUser", "apps");
              }}
              sx={{
                width: "100%",
                height: 35,
                color: "#C8C8C8",
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor: currentOpenTab === "apps" && expandLeftNav && currentPath.includes("/search") ? "#2f2f2f": "transparent",
                "&:hover": { backgroundColor: "#2f2f2f" },
              }}
              disableRipple={expandLeftNav ? false : true}
            >
              <span style={{display: expandLeftNav ? "inline" : "none",opacity: expandLeftNav ? 1 : 0, transition: "opacity 0.3s ease", position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 16 }}>•</span>{" "}
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: currentOpenTab === "apps" && currentPath.includes("/search") ? "#F1F1F1" : "#C8C8C8",
                }}
              >
                Apps
              </span>
            </Button>
	  		</Link> 
          </Box>
          </Collapse>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              marginTop: 2.5,
            }}
          >
	  		<Link to="/dashboards/security" style={hrefStyle}>
            <Button
              onClick={(event) => {
                setOpenSecurityTab(true);
                setOpenautomateTab(false);
                setCurrentOpenTab("security");
                localStorage.setItem("lastTabOpenByUser", "security");
              }}
              sx={{
                ...ButtonStyle,
                backgroundColor: ((currentOpenTab === "security" && currentPath.includes("/security")) || ((!expandLeftNav) && (currentPath.includes("detections") || currentPath.includes("response")))) ? "#2f2f2f": "transparent",
                "&:hover": { backgroundColor: "#2f2f2f" },
              }}
            >
              <ShieldOutlinedIcon
                style={{ width: 16, height: 16, marginRight: expandLeftNav ? 10 : 0 }}
              />
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  marginRight: "auto",
                  color: currentOpenTab === "security" && currentPath.includes("/security") ? "#F1F1F1" : "#C8C8C8",
                }}
              >
                Security
              </span>
            </Button>
	  		</Link> 
            <IconButton
              onClick={() => {
                setOpenSecurityTab((prev) => !prev);
                setOpenautomateTab(false);
              }}
              sx={{
                marginLeft: 0.625,
              }}
            >
              {openSecurityTab ? (
                <ExpandLessIcon
                  style={{
                    display: expandLeftNav ? "flex" : "none",
                  }}
                />
              ) : (
                <ExpandMoreIcon
                  style={{
                    display: expandLeftNav ? "flex" : "none",
                  }}
                />
              )}
            </IconButton>
          </Box>
          <Collapse in={openSecurityTab} timeout="auto" unmountOnExit>
          <Box
            style={{
              maxHeight: openSecurityTab && expandLeftNav ? 100 : 0,
              overflow: "hidden",
              transition: "max-height 0.3s ease, opacity 0.3s ease",
              display: "flex",
              flexDirection: "column",
              paddingLeft: 16,
              gap: 4,
              marginTop: expandLeftNav ? 16 : 0,
            }}
            disableRipple={expandLeftNav ? false : true}
          >
	  		<Link to="/detections" style={hrefStyle}>
            <Button
              onClick={(event) => {
                setCurrentOpenTab("detection");
                localStorage.setItem("lastTabOpenByUser", "detection");
              }}
              sx={{
                width: "100%",
                height: 35,
                color: "#C8C8C8",
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor: currentOpenTab === "detection" && currentPath.includes("/detection")? "#2f2f2f": "transparent",
                "&:hover": { backgroundColor: "#2f2f2f" },
              }}
              disableRipple={expandLeftNav ? false : true}
            >
              <span style={{position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 16 }}>•</span>
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color:
                    currentOpenTab === "detection" && currentPath.includes("/detection") ? "#F1F1F1" : "#C8C8C8",
                }}
              >
                Detection
              </span>
            </Button>
	  		</Link> 
	  		<Link to="/response" style={hrefStyle}>
            <Button
              onClick={(event) => {
                setCurrentOpenTab("response");
                localStorage.setItem("lastTabOpenByUser", "response");
              }}
              sx={{
                width: "100%",
                height: 35,
                color: "#C8C8C8",
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor: currentOpenTab === "response" && currentPath.includes("/response") ? "#2f2f2f": "transparent",
                "&:hover": { backgroundColor: "#2f2f2f" },
              }}
              disableRipple={expandLeftNav ? false : true}
            >
              <span style={{position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 16 }}>•</span>
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: currentOpenTab === "response" && currentPath.includes("/response")? "#F1F1F1" : "#C8C8C8",
                }}
              >
                Response
              </span>
            </Button>
	  		</Link> 
          </Box>
          </Collapse>

	  	  <Link to="/docs" style={hrefStyle}>
          <Button
            onClick={(event) => {
              setCurrentOpenTab("docs");
              localStorage.setItem("lastTabOpenByUser", "docs");
            }}
            sx={{
              ...ButtonStyle,
              marginTop: 2,
              backgroundColor: currentOpenTab === "docs" && currentPath.includes("/docs") ? "#2f2f2f": "transparent",
              "&:hover": { backgroundColor: "#2f2f2f" },
            }}
          >
            <img
              src={documentationIcon}
              style={{ width: 16, height: 16, marginRight: expandLeftNav ? 10 : 0 }}
              alt="Documentation Icon"
            />
            <span
              style={{
                display: expandLeftNav ? "inline" : "none",
                color: currentOpenTab === "docs" && currentPath.includes("/docs") ? "#F1F1F1" : "#C8C8C8",
              }}
            >
              Documentation
            </span>
          </Button>
	  	  </Link>
        </Box>
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            padding: 16,
            marginTop: "auto",
            marginBottom: "auto",
            opacity: expandLeftNav ? 1 : 0,
            height: expandLeftNav ? "auto" : 0,
            transition: expandLeftNav ? "opacity 0.3s ease" : "none",
            pointerEvents: expandLeftNav ? "auto" : "none",
            transform: expandLeftNav ? "scale(1)" : "scale(0.95)",
            overflow: !expandLeftNav && "hidden",
            paddingTop: expandLeftNav ? 30 : 0,
          }}
        >
          <Typography
            style={{
              color: "#CDCDCD",
              fontSize: 14,
              padding: "8px 8px",
              marginBottom: 10,
            }}
          >
            Recent Workflows
          </Typography>
          <Box
            style={{
              opacity: expandLeftNav ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
              {recentworkflows?.slice(0, 2).map((workflow, index) => {
                return (
                  <RecentWorkflow 
                    key={index}
                    workflow={workflow}
                    leftNavOpen={expandLeftNav}
                  />
                )
              }) }
          </Box>
        </Box>
      </Box>
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 10,
          marginLeft: 5,
        }}
      >
        <Box ref={autocompleteRef}>
          <Autocomplete
            disablePortal
            options={useMemo(() => orgOptions, [orgOptions])}
            getOptionLabel={(option) => option.name}
            PopperComponent={CustomPopper}
            open={openAutocomplete}
            onOpen={() => setOpenAutocomplete(true)}
            renderOption={(props, option, { selected, index }) => (
              <li
                {...props}
                key={option.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    option.id === "add_suborg" ? "center" : "flex-start",
                  backgroundColor:
                    option.id === "add_suborg"
                      ? "transparent"
                      : option.name === selectedOrg
                      ? "#696969"
                      : "transparent",
                  padding: option.id === "add_suborg" ? "0" : "12px 16px",
                  marginTop: index !== 0 ? 8 : 0,
                  borderRadius: 6,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#444444";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = option.name === selectedOrg ? "#696969" : "transparent";
                }}
                onClick={(e) => {
                    if (option.id !== userdata?.active_org?.id) {
                      setSelectedOrg(option.name);
                      handleClickChangeOrg(option.id);
                    } else {
                      setSelectedOrg(userdata?.active_org?.name);
                    }
                    setOpenAutocomplete(false);
                }}
              >
                    <span
                      style={{
                        color: "#bbb",
                        fontSize: "16px",
                        marginRight: 12,
                      }}
                    >
                      {option.region_url}
                    </span>
                    <img
                      src={option.image ? option.image : "/images/no_image.png"}
                      alt={option.name}
                      style={{
                        width: 24,
                        height: 24,
                        marginRight: 12,
                        borderRadius: "50%",
                      }}
                    />
                    <span
                      style={{
                        color: "#fff",
                        fontSize: "16px",
                      }}
                    >
                      {option.name}
                    </span>
              </li>
            )}
            onChange={(event, newValue) => {
              if (newValue) {
                  if (userdata?.active_org?.id !== newValue.id) {
                    setSelectedOrg(newValue.name);
                    handleClickChangeOrg(newValue.id);
                  } else {
                    setSelectedOrg(userdata?.active_org?.name);
                  }
                  setOpenAutocomplete(false);
              }
            }}
            onInputChange={(event, newInputValue) => {
              setAutocompleteValue(newInputValue);
            }}
            filterOptions={(options, params) => {
              return options.filter((option) =>
                option.name
                  .toLowerCase()
                  .includes(params.inputValue.toLowerCase())
              );
            }}
            value={userOrgs}
            renderInput={(params) => (
              <Box
                style={{
                  display: "flex",
                  width: expandLeftNav ? 230 : 48,
                  height: 51,
                  justifyContent: "center",
                  alignItems: "center",
                  transition:
                    "width 0.3s ease, opacity 0.3s ease",
                }}
              >
                {expandLeftNav ? (
                  <TextField
                    {...params}
                    ref={iconRef}
                    value={autocompleteValue}
                    sx={{
                      opacity: 1,
                      width: "100%",
                      height: 51,
                      transition: "opacity 0.4s ease-in-out",
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          border: "1px solid #494949",
                        },
                        "&:hover fieldset": {
                          border: "1px solid #494949",
                        },
                        "&.Mui-focused fieldset": {
                          border: "1px solid #494949",
                        },
                      },
                    }}
                  />
                ) : (
                  <Box
                    style={{
                      display: "flex",
                      width: 48,
                      height: 51,
                      border: "1px solid #494949",
                      borderRadius: 8,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <TextField {...params} style={{ display: "none" }} />
                    <ExpandMoreIcon
                      ref={iconRef}
                      onClick={() => setOpenAutocomplete((prev) => !prev)}
                      style={{
                        cursor: "pointer",
                        fontSize: "24px",
                        opacity: expandLeftNav ? 0 : 1,
                        transition: "opacity 0.3s ease",
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}
          />
        </Box>
        <Box
          style={{
            display: "flex",
            flexDirection: expandLeftNav ? "row" : "column",
            width: "100%",
            marginTop: 16,
            gap: 10,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: expandLeftNav ? 0 : 10,
            height: 55,
            borderRadius: 8,
          }}
          onMouseOver ={(event)=>{event.currentTarget.style.backgroundColor = "#2f2f2f";setHoverOnAvatar(true)}}
          onMouseLeave ={(event)=>{event.currentTarget.style.backgroundColor = "transparent";setHoverOnAvatar(false)}}
        >
          {expandLeftNav ? (
            <>
              <Button
                style={{
                  width: "100%",
                  height: 24,
                  display: "flex",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                  transition: "opacity 0.3s ease",
                  textTransform: "none",
                  fontSize: 16,
                }}
                disableElevation
                disableRipple
                onClick={(event) => {
                  if (anchorElAvatar) {
                    setAnchorElAvatar(null);
                  } else {
                    setAnchorElAvatar(event.currentTarget);
                  }
                  setOpenAutocomplete(false)
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#2F2F2F",
                    color: "#FFFFFF",
                    fontSize: 30,
                    fontStyle: "bold",
                    border: hoverOnAvatar ? "1px solid #494949" : "none",
                  }}
                >
                  {userdata?.username?.substring(0, 1).toUpperCase()}
                </Avatar>
                <Typography
                  style={{
                    color: "#CDCDCD",
                    margin: "0 5px",
                    fontSize: 16,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 150,
                    textAlign: "center",
                    marginLeft: 10,
                  }}
                >
                  {userdata?.username}
                </Typography>
                {avatarMenu}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={(event) => {
                  if (anchorElAvatar) {
                    setAnchorElAvatar(null);
                  } else {
                    setAnchorElAvatar(event.currentTarget);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: 'column',
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  padding: 5,
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                  border: hoverOnAvatar ? "1px solid #494949" : "none",
                }}
                disableElevation
                disableRipple
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#2F2F2F",
                    color: "#FFFFFF",
                    fontSize: 30,
                  }}
                >
                  {userdata?.username?.substring(0, 1).toUpperCase()}
                </Avatar>
              </Button>
            </>
          )}
        </Box>
      </Box>
      </Box>
     </div>
  );
};

export default LeftSideBar;
