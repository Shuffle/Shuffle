import React, { useEffect, useRef, useState, useContext, useCallback, useMemo, memo } from "react";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  GridView as GridViewIcon,
  ShieldOutlined as ShieldOutlinedIcon,
  Add as AddIcon,
  BorderColor,
  Close as CloseIcon,
  ConstructionOutlined as ConstructionOutlinedIcon,
  Toc as TocIcon,
  Settings as SettingsIcon 
} from "@mui/icons-material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MonitorIcon from '@mui/icons-material/Monitor';


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
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import RecentWorkflow from "../components/RecentWorkflow.jsx";

import { useNavigate } from "react-router";
import { getTheme } from "../theme.jsx";

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
  const {setLeftSideBarOpenByClick, leftSideBarOpenByClick, setSearchBarModalOpen, searchBarModalOpen, logoutUrl, themeMode, handleThemeChange,  isDocSearchModalOpen, setIsDocSearchModalOpen, supportEmail} = useContext(Context);
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
  const params = new URLSearchParams(window.location.search);
  const [currentSelectedTheme, setCurrentSelectedTheme] = useState(themeMode);
  const tab = params.get("tab");
  const currentPath = tab ? `${window.location.pathname}?tab=${tab}` : window.location.pathname;
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

  const theme = getTheme(themeMode);
  const darkText = "#0F1419"
  const lightText = "#CDCDCD"
  const lightHoverColor = "#D6D6D6"
  const darkHoverColor = "#2F2F2F"

	//With this code it is opening search bar on google chrome search bar as well which is not required
	useEffect(() => {
	  const handleKeyDown = (event) => {
		if ((event.ctrlKey || event.metaKey) && event.key === "k") {
		  event.preventDefault();
		  setSearchBarModalOpen((prev)=> !prev);
		}
	  };

	  window.addEventListener("keydown", handleKeyDown);

	  return () => {
		window.removeEventListener("keydown", handleKeyDown);
	  };
	}, [setSearchBarModalOpen]);

  useEffect(() => {
    if (userdata && userdata?.active_org?.branding?.theme?.length > 0) {
      setCurrentSelectedTheme(userdata?.active_org?.branding?.theme);
    }else if (userdata && userdata?.theme?.length > 0) {
      setCurrentSelectedTheme(userdata?.theme);
    }
  }, [userdata]);
  
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
            backgroundColor: theme.palette.backgroundColor,
            color: theme.palette.text.primary,
            opacity: 1,
            "& .MuiAutocomplete-listbox": {
              backgroundColor: theme.palette.backgroundColor,
              color: theme.palette.text.primary,
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
            scrollbarWidth: "thin",
            scrollbarColor: theme.palette.scrollbarColorTransparent,
            color: theme.palette.text.primary,
            "& .MuiAutocomplete-listbox": {
              backgroundColor:theme.palette.backgroundColor,
              color: theme.palette.text.primary,
              padding: 0,
              margin: 0,
              borderRadius: "4px",
            },
          }}
        >
          {props.children}
        </Box>

        <Link to="/admin?tab=tenants" style={hrefStyle}>
			<Box
				sx={{
				  width: "100%",
				  padding: "12px 8px",
				  textAlign: "center",
				  color: theme.palette.text.primary,
				  fontSize: "16px",
				  cursor: "pointer",
				  borderTop: "1px solid #444444",
				  "&:hover": {
					  backgroundColor: theme.palette.hoverColor,
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
        } else if ((lastTabOpenByUser === "usecases" && currentPath.includes("/usecases")) || currentPath.includes("/usecases")) {
      setOpenautomateTab(true);
      setOpenSecurityTab(false);
      setCurrentOpenTab("usecases");
        } else if ((lastTabOpenByUser === "workflows" && currentPath === "/workflows") || currentPath === "/workflows") {
      setOpenautomateTab(true);
      setOpenSecurityTab(false);
      setCurrentOpenTab("workflows");
        } else if ((lastTabOpenByUser === "apps" && currentPath.includes("/apps")) || currentPath.includes("/apps")) {
      setOpenautomateTab(true);
      setOpenSecurityTab(false);
      setCurrentOpenTab("apps");
        } else if ((lastTabOpenByUser === "forms" && currentPath.includes("/forms")) || currentPath.includes("/forms")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(true);
      setCurrentOpenTab("forms");
        } else if ((lastTabOpenByUser === "datastore" && currentPath.includes("/admin?tab=datastore")) || currentPath.includes("/admin?tab=datastore")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(true);
      setCurrentOpenTab("datastore");
    } else if ((lastTabOpenByUser === "files" && currentPath.includes("/admin?tab=files")) || currentPath.includes("/admin?tab=files")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(true);
      setCurrentOpenTab("files");
    }
    else if ((lastTabOpenByUser === "locations" && currentPath.includes("/admin?tab=locations")) || currentPath.includes("/admin?tab=locations")) {
      setOpenautomateTab(false);
      setOpenSecurityTab(true);
      setCurrentOpenTab("locations");
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
    UpdateTabStatus()
	
    const expandLeftNav1 = localStorage.getItem("expandLeftNav")
    if (expandLeftNav1 === "false") {
      setLeftSideBarOpenByClick(false)
    } else {
		const currentLocation = window?.location?.pathname
		if (currentLocation?.includes('/workflows/')) {
		} else {
			setLeftSideBarOpenByClick(true)
			setExpandLeftNav(true)
		}
    }
  }, [])

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

  const handleChangeTheme = (newTheme) => {


    const data = {
      	  "org_id": userdata?.active_org?.id,
  	};

    data["branding"]  = {
			"theme": newTheme,
			"enable_chat": userdata?.active_org?.branding?.enable_chat || false,
			"home_url": userdata.active_org?.branding?.home_url || "",
			"brand_color": userdata?.active_org?.branding?.brand_color || theme.palette.primary.main,
			"brand_name": userdata?.active_org?.branding?.brand_name || "",
			"logout_url": userdata?.active_org?.branding?.logout_url || "",
			"support_email": userdata?.active_org?.branding?.support_email || "",
		}

		data["editing_branding"] = true;

    const url = globalUrl + `/api/v1/orgs/${userdata?.active_org?.id}`;
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
                    toast("Failed updating org: ", responseJson.reason);
                }
                })
  	      ) 
            .catch((error) => {
              console.log("Error changing theme: ", error);
            });
  };

  
  const handleUpdateTheme = (newTheme) => {
    handleThemeChange(newTheme);
    setCurrentSelectedTheme(newTheme)
    
    const data = {
      "user_id": userdata?.id,
      "theme": newTheme,
    }

    const url = globalUrl + `/api/v1/users/updateuser`;
    fetch(url, {
      mode: "cors",
      method: "PUT",
      body: JSON.stringify(data),
      credentials: "include",
      crossDomain: true,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    }).then((response) =>
      response.json().then((responseJson) => {
        if (responseJson["success"] === false) {
          toast("Failed saving your theme: ", responseJson.reason);
        }
      })
    ).catch((error) => {
      console.log("Error saving your theme: ", error);
    }); 
  };
    

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

        if(userdata?.org_status?.includes("integration_partner") && logoutUrl?.length > 0){
          window.location.href = logoutUrl
        } else {
          window.location.pathname = "/";
        }
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
          color: themeMode === "dark" ? lightText : darkText,
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
            backgroundColor: theme.palette.backgroundColor,
            color: theme.palette.text.primary,
            borderRadius: theme.palette.borderRadius/3,
          },
          "& .MuiList-root": {
            backgroundColor: theme.palette.backgroundColor,
          },
          "& .MuiMenuItem-root": {
            color: theme.palette.text.primary,
            "&:hover": {
              backgroundColor: theme.palette.hoverColor,
            },
          },
          "& .MuiDivider-root": {
            backgroundColor: "#555555",
          },
        }}
      >
        {userdata && (userdata?.org_status?.includes("integration_partner") && userdata?.org_status?.includes("sub_org")) ? null : (
          <>
            <ToggleButtonGroup
      value={currentSelectedTheme}
      exclusive
      onChange={(event, newTheme) => {
        if (newTheme === null) {
          return;
        }
        if (newTheme === currentSelectedTheme) {
          return;
        }
        handleThemeChange(newTheme)
        setCurrentSelectedTheme(newTheme);
        if (userdata?.org_status?.includes("integration_partner")){
            handleChangeTheme(newTheme);
        } else {

          handleUpdateTheme(newTheme);
        }
      }}
      aria-label="theme"
      style={{display: 'flex', justifyContent: "center", marginBottom: 10,  }}
      >

      <ToggleButton value="light" aria-label="light theme" style={{ backgroundColor: currentSelectedTheme === "light" ? theme.palette.hoverColor : theme.palette.backgroundColor }}>
        <LightModeIcon style={{ color: themeMode === "light" ? darkText : lightText }} />
      </ToggleButton>
      <ToggleButton value="dark" aria-label="dark theme" style={{ backgroundColor: currentSelectedTheme === "dark" ? theme.palette.hoverColor : theme.palette.backgroundColor }}>
        <DarkModeIcon style={{ color: themeMode === "light" ? darkText : lightText }} />
      </ToggleButton>
      <ToggleButton value="system" aria-label="system theme" style={{ backgroundColor: currentSelectedTheme === "system" ? theme.palette.hoverColor : theme.palette.backgroundColor }}>
        <MonitorIcon style={{ color: themeMode === "light" ? darkText : lightText }} />
      </ToggleButton>
      </ToggleButtonGroup>
      <Divider style={{ marginTop: 10, marginBottom: 10, color: theme.palette.defaultBorder }} />
          </>
        )}
        <Link to="/admin" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
            style={{fontSize: 18}}
          >
            <BusinessIcon style={{ marginRight: 5 }} /> Org Admin 
          </MenuItem>
        </Link>
        <Link to="/settings" style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
            style={{fontSize: 18}}
          >
            <SettingsIcon style={{ marginRight: 5 }} /> User Account
          </MenuItem>
        </Link>

        <Divider style={{ marginTop: 10, marginBottom: 10, }} />

	  	{/*
		<Link to="/admin?admin_tab=notifications" style={hrefStyle}>
		  <MenuItem
			onClick={(event) => {
			  handleClose();
			}}
      style={{fontSize: 18}}
		  >
			<NotificationsIcon style={{ marginRight: 5 }} /> Org Notifications ({
				notifications === undefined || notifications === null ? 0 : 
				notifications?.filter((notification) => notification.read === false).length
			}) 
		  </MenuItem>
		</Link>

        <Divider style={{ marginTop: 10, marginBottom: 10, }} />
	  	*/}

        <Link to={userdata && userdata?.org_status?.includes("integration_partner") && userdata?.active_org?.branding?.documentation_link?.length > 0 ? userdata?.active_org?.branding?.documentation_link : "/docs" } target={userdata?.active_org?.branding?.documentation_link?.length > 0 && userdata?.org_status?.includes("integration_partner") ? "_blank" : "_self" } style={hrefStyle}>
          <MenuItem
            onClick={(event) => {
              handleClose();
            }}
            style={{fontSize: 18}}
          >
            <HelpOutlineIcon style={{ marginRight: 5 }} /> About
          </MenuItem>
        </Link>
        <MenuItem
          style={{ fontSize: 18 }}
          onClick={(event) => {
            handleClickLogout();
            event.preventDefault();
            handleClose();
          }}
          
        >
          <MeetingRoomIcon style={{ marginRight: 5 }} /> &nbsp;Logout
        </MenuItem>
        <Divider style={{ marginBottom: 10, }} />

        <Typography color="textSecondary" align="center" style={{ marginTop: 5, marginBottom: 5, fontSize: 18 }}>
          Version: 2.1.0-rc2
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

    if (userdata?.active_org?.id === orgId) {
      return
    }

    localStorage.setItem("globalUrl", "");
    localStorage.setItem("getting_started_sidebar", "open");
    localStorage.removeItem("workflows");
    localStorage.removeItem("apps");

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
              `Failed changing org. Try again or contact ${supportEmail} if this persists.`
            );
          }
        }
      })
      .catch((error) => {
        console.log("error changing: ", error);
      });
};

  const getRegionTag = (region_url) => {
    let regiontag = "UK";
    //let regiontag = "EU";
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
          regiontag = "US";
        } else if (regiontag === "frankfurt") {
          regiontag = "EU-2";
        } else if (regiontag === "ca"){
          regiontag = "CA";
        }
      }
    }

    return regiontag;
  };

  useEffect(() => {

    if(activeOrgName !== userdata?.active_org?.name){
      setActiveOrgName(userdata?.active_org?.name || "Select Organization");
    }
  }, [userdata]);

  const CheckOrgStates = useCallback(() => {
    setOrgOptions(
      userdata?.orgs?.map((org) => {
        let skipOrg = false;
  
        if (
          org.creator_org !== undefined &&
          org.creator_org !== null &&
          org.creator_org.length > 0
        ) {
          // Finds the parent org
          for (let key in userdata.child_orgs) {
            if (userdata.child_orgs[key].id === org.creator_org) {
              skipOrg = true;
              break;
            }
          }
  
          if (skipOrg) {
            return null; // Skip this org
          }
        }
  
        return {
          id: org.id,
          name: org.name,
          image: org.image,
          region_url: getRegionTag(org.region_url),
          margin_left:
            org.creator_org !== undefined &&
            org.creator_org !== null &&
            org.creator_org.length > 0 ? 20 : 0,
        };
      }) || []
    );
  
    setActiveOrgName(userdata?.active_org?.name || "Select Organization");
    setSelectedOrg(userdata?.active_org?.name || "Select Organization");
  }, [userdata]);
  

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
    color: openautomatetab ? "#F1F1F1" : themeMode === "dark" ? lightText : darkText,
    textTransform: "none",
    "& .MuiButton-root	": {
      width: expandLeftNav ? "100%" : 30,
      padding: 0,
    },
    fontSize: 18
  };

  const getRegionFlag = (region_url) => {
    var region = "UK";
    const regionMapping = {
			"US": "us",
			"EU": "eu",
			"CA": "ca",
			"UK": "gb",
      "au": "au",
		};

    region = regionMapping[region_url] || "eu";
    
    return `https://flagcdn.com/48x36/${region}.png`;
  };

  useEffect(() => {
    if (window?.location?.pathname?.includes("/workflows/")) {
      setExpandLeftNav(false);
    }

  }, [window?.location?.pathname]);

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const showPartnerLogo = userdata?.org_status?.includes("integration_partner") && userdata?.active_org?.image !== undefined && userdata?.active_org?.image !== null && userdata?.active_org?.image.length > 0 

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: expandLeftNav ? 260 : 80,
        borderRadius: 8,
        backgroundColor: theme.palette.backgroundColor,
        position: "relative",
        transition: "width 0.3s ease",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)" ,
        resize: 'both',
        zoom: isSafari ? undefined : 0.8,
        transform: isSafari ? "scale(0.8)" : undefined,
        transformOrigin: isSafari ? "top left" : undefined,
        height: "calc((100vh - 32px)*1.2)",
      }}
    >
      {searchBarModalOpen && !isDocSearchModalOpen ? <ModalView serverside={serverside} userdata={userdata} searchBarModalOpen={searchBarModalOpen} setSearchBarModalOpen={setSearchBarModalOpen} globalUrl={globalUrl} isDocSearchModalOpen={isDocSearchModalOpen} /> : null}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 16px 24px 27px",
        }}
        onMouseOver={()=>{
          if(window?.location?.pathname?.includes("/workflows/")) {
            setExpandLeftNav(true)
          }
        }}

        onMouseLeave={()=>{
          if(window?.location?.pathname?.includes("/workflows/")) {
            setExpandLeftNav(false)
          }
        }}
      >  
        <Tooltip 
          title="Go to Home" 
          placement="top"
          arrow  
          componentsProps={{
            tooltip: {
              sx: {
                backgroundColor: "rgba(33, 33, 33, 1)",
                color: "rgba(241, 241, 241, 1)",
                fontSize: 12,
                border: "1px solid rgba(73, 73, 73, 1)",
                fontFamily: theme?.typography?.fontFamily,
              }
            },
            popper: {
              sx: {
                zIndex: 1000019,
              }
            }
          }}
        >
          <Link to={isCloud && !showPartnerLogo ? "/" : "/workflows"}>
            <img
              src={
				  showPartnerLogo ? userdata?.active_org?.image : ShuffleLogo
			  }
              alt="Shuffle Logo"
              style={{ width: showPartnerLogo ? 30 : 24, height: showPartnerLogo ? 30 : 24 }}
            />
          </Link>
        </Tooltip>
        <Box
          sx={{
            display: "flex",
            // alignItems: "center",
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
          <svg
              style={{
                transform: expandLeftNav ? "" : "rotate(180deg)",
                transition: "transform 0.3s ease"
              }}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="12"
                transform="matrix(-1 0 0 1 24 0)"
                fill={themeMode === "dark" ? "#2F2F2F" : "#D0D0D0"}
              />
              <path
                d="M14 18L8 12L14 6"
                stroke={themeMode === "dark" ? "#F1F1F1" : "#2F2F2F"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", width:"100%", height: "100%", overflowY: "auto", overflowX: "hidden",transition: 'display 0.3s ease',paddingTop: 0.5 }} onMouseOver={()=>{(!leftSideBarOpenByClick || window?.location?.pathname?.includes("/workflows/")) && setExpandLeftNav(true)}} onMouseLeave={()=>{(!leftSideBarOpenByClick || window?.location?.pathname?.includes("/workflows/")) && setExpandLeftNav(false);setOpenAutocomplete(false)}}>
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
                    placeholder="Search"
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
                          display: "block",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#A9A9A9",
                        },
                      },
                      "& input": {
                        padding: "8px 14px",
                        fontSize: "14px",
                        color: themeMode === "dark" ? lightText : darkText,
                      },
                      backgroundColor: "transparent",
                    }}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <SearchIcon style={{ color: themeMode === "dark" ? lightText : darkText, width: 24, height: 24, marginLeft: 16 }} />
                      ),
                      endAdornment: (
                        <span
                          style={{
                            color: themeMode === "dark" ? lightText : darkText,
                            fontSize: "12px",
                            marginRight: 16,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <kbd>Ctrl</kbd>+<kbd>K</kbd>
                        </span>
                      ),
                      disableUnderline: true,
                    }}
                    onClick={() => {
                      setSearchBarModalOpen(true);
                      setIsDocSearchModalOpen(false);
                    }}
                    onChange={() => {
                      setSearchBarModalOpen(true);
                      setIsDocSearchModalOpen(false);
                    }}
                  />
            </Fade>
            ):(
            <>
            <Fade in={!expandLeftNav} timeout={500}>
              <Button style={{color: themeMode === "dark" ? lightText : darkText, backgroundColor: "transparent", marginBottom: 5, borderRadius: 8, marginTop: 5 }} onClick={()=>{setSearchBarModalOpen(true)}} onMouseOver={(event)=>{event.currentTarget.style.backgroundColor = "#2f2f2f"}} onMouseLeave={(event)=> {event.currentTarget.style.backgroundColor = "transparent"}} disableElevation disableRipple><SearchIcon style={{width: 24, height: 24}}/></Button>
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
              scrollbarColor: theme.palette.scrollbarColorTransparent,
              overflowX: "hidden",
            }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            padding: expandLeftNav ? "0 16px" : "0px 8px",
            gap: 1.2,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row", marginTop: 2.5, width: expandLeftNav ? "100%" : 48, padding: "0px", }}>
            <Button
              component={Link}
              to="/usecases"
              onClick={(event) => {
                setOpenautomateTab(true);
                setOpenSecurityTab(false);
                setCurrentOpenTab("usecases");
                localStorage.setItem("lastTabOpenByUser", "usecases");
              }}
              variant="text"
              style={{
                ...ButtonStyle,
                backgroundColor: ((currentOpenTab === "automate") || (!expandLeftNav && (currentPath === "/workflows" || currentPath === "/usecases" || currentPath.includes("/search"))))? themeMode === "dark" ? darkHoverColor : lightHoverColor : "transparent",
              }}
              onMouseOver={(event)=>{
                event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
              }}
              onMouseOut={(event)=>{
                event.currentTarget.style.backgroundColor = ((currentOpenTab === "automate")|| (!expandLeftNav && (currentPath === "/workflows" || currentPath === "/usecases" || currentPath.includes("/search"))))? themeMode === "dark" ? darkHoverColor : lightHoverColor : "transparent";
              }}
            >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      marginRight: expandLeftNav ? 10 : 0,
                    }}
                  >
                    <path
                      d="M7.99935 6.83317C8.73573 6.83317 9.33268 6.23622 9.33268 5.49984C9.33268 4.76346 8.73573 4.1665 7.99935 4.1665C7.26297 4.1665 6.66602 4.76346 6.66602 5.49984C6.66602 6.23622 7.26297 6.83317 7.99935 6.83317Z"
                      stroke={themeMode === "dark" ? lightText : darkText}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.8269 2.67329C11.1988 3.04478 11.4938 3.48593 11.6951 3.97153C11.8964 4.45712 12 4.97763 12 5.50329C12 6.02895 11.8964 6.54946 11.6951 7.03505C11.4938 7.52064 11.1988 7.9618 10.8269 8.33329M5.17354 8.32662C4.80163 7.95513 4.5066 7.51398 4.3053 7.02838C4.104 6.54279 4.00039 6.02228 4.00039 5.49662C4.00039 4.97096 4.104 4.45045 4.3053 3.96486C4.5066 3.47927 4.80163 3.03811 5.17354 2.66662M12.7135 0.786621C13.9633 2.03681 14.6654 3.73219 14.6654 5.49995C14.6654 7.26772 13.9633 8.9631 12.7135 10.2133M3.28687 10.2133C2.03706 8.9631 1.33496 7.26772 1.33496 5.49995C1.33496 3.73219 2.03706 2.03681 3.28687 0.786621"
                      stroke={themeMode === "dark" ? lightText : darkText}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  marginRight: "auto",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: themeMode === "dark" ? lightText : darkText
                }}
              >
                Automate
              </span>
            </Button>
            <IconButton
              onClick={() => {
                setOpenautomateTab((prev) => !prev);
                setOpenSecurityTab(false);
              }}
              style={{
                  color: themeMode === "dark" ? lightText : darkText,
                  marginLeft: 0.625,
              }}
              onMouseOver={(event)=>{
                event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
              }}
              onMouseOut={(event)=>{
                event.currentTarget.style.backgroundColor = "transparent";
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
              gap: 10,
            }}
          >
            <Button
              component={Link}
              to="/usecases"
              onClick={(event) => {
                setCurrentOpenTab("usecases");
                localStorage.setItem("lastTabOpenByUser", "usecases");
              }}
              style={{
                width: "100%",
                height: 35,
                color: themeMode === "dark" ? lightText : darkText,
                justifyContent: "flex-start",
                fontSize: 18,
                textTransform: "none",
                backgroundColor: currentOpenTab === "usecases" && expandLeftNav ? themeMode === "dark"? darkHoverColor : lightHoverColor : "transparent",
                marginLeft: 16
              }}
              onMouseOver={(event)=>{
                event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
              }}
              onMouseOut={(event)=>{
                event.currentTarget.style.backgroundColor = currentOpenTab === "usecases" && expandLeftNav ? themeMode === "dark"? darkHoverColor : lightHoverColor : "transparent";
              }}
              disableRipple={expandLeftNav ? false : true}
            >
              <span style={{display: expandLeftNav ? "inline" : "none",opacity: expandLeftNav ? 1 : 0, transition: "opacity 0.3s ease", position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 18 }}>•</span>{" "}
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: themeMode === "dark" ? currentOpenTab === "usecases" ? theme.palette.text.primary : lightText : darkText,
                }}
              >
                Usecases
              </span>
            </Button>
            <Button
              component={Link}
              to="/workflows"
              onClick={(event) => {
                setCurrentOpenTab("workflows");
                localStorage.setItem("lastTabOpenByUser", "workflows");
              }}
              style={{
                width: "100%",
                height: 35,
                color: themeMode === "dark" ? lightText : darkText,
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor: currentOpenTab === "workflows" && expandLeftNav? themeMode === "dark"? darkHoverColor : lightHoverColor : "transparent",
                marginLeft: 16,
                fontSize: 18
              }}
              disableRipple={expandLeftNav ? false : true}
              onMouseOver={(event)=>{
                event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
              }}
              onMouseOut={(event)=>{
                event.currentTarget.style.backgroundColor = currentOpenTab === "workflows" && expandLeftNav? themeMode === "dark"? darkHoverColor : lightHoverColor : "transparent";
              }}
            >
              <span style={{display: expandLeftNav ? "inline" : "none", opacity: expandLeftNav ? 1 : 0, transition: "opacity 0.3s ease", position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 18 }}>•</span>{" "}
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: themeMode === "dark" ? currentOpenTab === "workflows" ? theme.palette.text.primary : lightText : darkText,
                }}
              >
                Workflows
              </span>
            </Button>
            <Button
              component={Link}
              to="/apps"
              onClick={(event) => {
                setCurrentOpenTab("apps");
                localStorage.setItem("lastTabOpenByUser", "apps");
              }}
              style={{
                width: "100%",
                height: 35,
                color: themeMode === "dark" ? lightText : darkText,
                justifyContent: "flex-start",
                textTransform: "none",
                backgroundColor: currentOpenTab === "apps" && expandLeftNav  ? themeMode === "dark"? darkHoverColor : lightHoverColor : "transparent",
                marginLeft: 16,
                fontSize: 18
              }}
              onMouseOver={(event)=>{
                event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
              }}
              onMouseOut={(event)=>{
                event.currentTarget.style.backgroundColor = currentOpenTab === "apps" && expandLeftNav ? themeMode === "dark"? darkHoverColor : lightHoverColor  : "transparent";
              }}
              disableRipple={expandLeftNav ? false : true}
            >
              <span style={{display: expandLeftNav ? "inline" : "none",opacity: expandLeftNav ? 1 : 0, transition: "opacity 0.3s ease", position: 'relative', left: !expandLeftNav ? 10: 0, marginRight: 10, fontSize: 18 }}>•</span>{" "}
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  opacity: expandLeftNav ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  color: themeMode === "dark" ? currentOpenTab === "apps" ? theme.palette.text.primary : lightText : darkText,
                }}
              >
                Apps
              </span>
            </Button>
          </Box>
          </Collapse>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              marginTop: 0
            }}
          >
	  		<span style={{ display: "inline-block", width: "100%" }}> 
            <Button
              component={Link}
              to="/forms"
              onClick={(event) => {
                setOpenSecurityTab(true);
                setOpenautomateTab(false);
                setCurrentOpenTab("forms");
                localStorage.setItem("lastTabOpenByUser", "forms");
              }}
              style={{
                ...ButtonStyle,
              }}
              onMouseOver={(event)=>{
                event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
              }}
              onMouseOut={(event)=>{
                event.currentTarget.style.backgroundColor = currentOpenTab === "security"
                  ? themeMode === "dark"? darkHoverColor : lightHoverColor
                  : "transparent";
              }}
            >
              <TocIcon 
                style={{
                  width: 18,
                  height: 18,
                  marginRight: expandLeftNav ? 10 : 0,
                  color: themeMode === "dark" ? lightText : darkText 
                }}
              />
              <span
                style={{
                  display: expandLeftNav ? "inline" : "none",
                  marginRight: "auto",
                  fontSize: 18,
                  color: themeMode === "dark" ? lightText : darkText
                }}
              >
	  			Content
              </span>
            </Button>
        </span>

            <IconButton
              onClick={() => {
                setOpenSecurityTab((prev) => !prev);
                setOpenautomateTab(false);
              }}
              style={{
                marginLeft: 0.625,
                color: themeMode === "dark" ? lightText : darkText,
              }}
              onMouseOver={(event)=>{
                event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
              }}
              onMouseOut={(event)=>{
                event.currentTarget.style.backgroundColor = "transparent";
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

          <Collapse in={openSecurityTab} timeout="auto" unmountOnExit >
              <Box
                style={{
                  maxHeight: openSecurityTab && expandLeftNav ? 250 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease, opacity 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  paddingLeft: 16,
                  gap: "2px",
                }}
                disableRipple={expandLeftNav ? false : true}
              >
                <span style={{ display: "inline-block", width: "100%" }}>
                <Button
                  component={Link}
                  to="/forms"
                  onClick={() => {
                    setCurrentOpenTab("forms");
                    localStorage.setItem("lastTabOpenByUser", "forms");
                  }}
                  sx={{
                    width: "100%",
                    height: 35,
                    color: themeMode === "dark" ? lightText : darkText,
                    justifyContent: "flex-start",
                    textTransform: "none",
                    backgroundColor:
                      currentOpenTab === "forms" || currentPath.includes("/forms")
                        ? themeMode === "dark" ? darkHoverColor : lightHoverColor
                        : "transparent",
                    "&:hover": {
                      backgroundColor: themeMode === "dark" ? darkHoverColor : lightHoverColor,
                    },
                    cursor: "pointer",
                  }}
                >
                  <span style={{ position: "relative", left: !expandLeftNav ? 10 : 0, marginRight: 10, fontSize: 18 }}>
                    •
                  </span>
                  <span
                    style={{
                      display: expandLeftNav ? "inline" : "none",
                      opacity: expandLeftNav ? 1 : 0,
                      transition: "opacity 0.3s ease",
                      fontSize: 18,
                      color: themeMode === "dark" ? currentOpenTab === "forms" ? theme.palette.text.primary : lightText : darkText,
                    }}
                  >
                    Forms
                  </span>
                </Button>
                </span>
				{userdata && (userdata?.support || userdata?.active_org?.role === "admin") ? (
          <>
            <span style={{ display: "inline-block", width: "100%" }}>
          <Button
          component={Link}
          to="/admin?tab=datastore"
            onClick={(event) => {
              setCurrentOpenTab("datastore");
              localStorage.setItem("lastTabOpenByUser", "datastore");
            }}
            sx={{
              width: "100%",
              height: 35,
              justifyContent: "flex-start",
              textTransform: "none",
              backgroundColor:
                currentOpenTab === "datastore"
                  ? themeMode === "dark" ? darkHoverColor : lightHoverColor
                  : "transparent",
              "&:hover": {
                backgroundColor: themeMode === "dark" ? darkHoverColor : lightHoverColor,
              },
              cursor: "pointer", 
            }}
          >
            <span style={{ position: "relative", left: !expandLeftNav ? 10 : 0, marginRight: 10, fontSize: 18 }}>
              •
            </span>
            <span
              style={{
                display: expandLeftNav ? "inline" : "none",
                opacity: expandLeftNav ? 1 : 0,
                transition: "opacity 0.3s ease",
                fontSize: 18,
                color: themeMode === "dark" ? currentOpenTab === "datastore" ? theme.palette.text.primary : lightText : darkText
              }}
            >
               Datastore	
            </span>
          </Button>
      </span>

      <span style={{ display: "inline-block", width: "100%" }}>
          <Button
            component={Link}
            to="/admin?tab=files"
            onClick={(event) => {
              setCurrentOpenTab("files");
              localStorage.setItem("lastTabOpenByUser", "files");
            }}
            sx={{
              width: "100%",
              height: 35,
              color: themeMode === "dark" ? lightText : darkText, 
              justifyContent: "flex-start",
              textTransform: "none",
              backgroundColor:
              currentOpenTab === "files"
              ? themeMode === "dark" ? darkHoverColor : lightHoverColor
              : "transparent",
              "&:hover": {
                backgroundColor: themeMode === "dark" ? darkHoverColor : lightHoverColor,
              },
              cursor: "pointer", 
            }}
          >
            <span style={{ position: "relative", left: !expandLeftNav ? 10 : 0, marginRight: 10, fontSize: 18 }}>
              •
            </span>
            <span
              style={{
                display: expandLeftNav ? "inline" : "none",
                opacity: expandLeftNav ? 1 : 0,
                transition: "opacity 0.3s ease",
                fontSize: 18,
                color: themeMode === "dark" ? currentOpenTab === "files" ? theme.palette.text.primary : lightText : darkText
              }}
            >
               Files	
            </span>
          </Button>
      </span>

      		<span style={{ display: "inline-block", width: "100%" }}>
			  <Button
			   component={Link}
			   to="/admin?admin_tab=notifications"
				onClick={(event) => {
				  setCurrentOpenTab("notifications");
				  localStorage.setItem("lastTabOpenByUser", "notifications");
				}}
				variant="text"
				sx={{
				  width: "100%",
				  height: 35,
				  color: themeMode === "dark" ? lightText : darkText, 
				  justifyContent: "flex-start",
				  textTransform: "none",
				  backgroundColor:
					currentOpenTab === "notifications"
					  ? themeMode === "dark" ? darkHoverColor : lightHoverColor
					  : "transparent",
				  "&:hover": {
					backgroundColor: themeMode === "dark" ? darkHoverColor : lightHoverColor,
				  },
				  cursor: "pointer", 
				}}
			  >
				<span style={{ position: "relative", left: !expandLeftNav ? 10 : 0, marginRight: 10, fontSize: 18 }}>
				  •
				</span>
				<span
				  style={{
					display: expandLeftNav ? "inline" : "none",
					opacity: expandLeftNav ? 1 : 0,
					transition: "opacity 0.3s ease",
					fontSize: 18,
					color: themeMode === "dark" ? currentOpenTab === "notifications" ? theme.palette.text.primary : lightText : darkText,
				  }}
				>
					Notifications
				</span>
			  </Button>
          </span>

      		<span style={{ display: "inline-block", width: "100%" }}>
			  <Button
			   component={Link}
			   to="/admin?tab=locations"
				onClick={(event) => {
				  setCurrentOpenTab("locations");
				  localStorage.setItem("lastTabOpenByUser", "locations");
				}}
				variant="text"
				sx={{
				  width: "100%",
				  height: 35,
				  color: themeMode === "dark" ? lightText : darkText, 
				  justifyContent: "flex-start",
				  textTransform: "none",
				  backgroundColor:
					currentOpenTab === "locations"
					  ? themeMode === "dark" ? darkHoverColor : lightHoverColor
					  : "transparent",
				  "&:hover": {
					backgroundColor: themeMode === "dark" ? darkHoverColor : lightHoverColor,
				  },
				  cursor: "pointer", 
				}}
			  >
				<span style={{ position: "relative", left: !expandLeftNav ? 10 : 0, marginRight: 10, fontSize: 18 }}>
				  •
				</span>
				<span
				  style={{
					display: expandLeftNav ? "inline" : "none",
					opacity: expandLeftNav ? 1 : 0,
					transition: "opacity 0.3s ease",
					fontSize: 18,
					color: themeMode === "dark" ? currentOpenTab === "locations" ? theme.palette.text.primary : lightText : darkText,
				  }}
				>
					Runtime Locations
				</span>
			  </Button>
          </span>

          <span style={{ display: "inline-block", width: "100%" }}>
          <Button
           component={Link}
           to="/partners"
            onClick={(event) => {
              setCurrentOpenTab("partners");
              localStorage.setItem("lastTabOpenByUser", "partners");
            }}
            variant="text"
            sx={{
              width: "100%",
              height: 35,
              color: themeMode === "dark" ? lightText : darkText, 
              justifyContent: "flex-start",
              textTransform: "none",
              backgroundColor:
                currentOpenTab === "partners"
                  ? themeMode === "dark" ? darkHoverColor : lightHoverColor
                  : "transparent",
              "&:hover": {
                backgroundColor: themeMode === "dark" ? darkHoverColor : lightHoverColor,
              },
              cursor: "pointer", 
            }}
          >
            <span style={{ position: "relative", left: !expandLeftNav ? 10 : 0, marginRight: 10, fontSize: 18 }}>
              •
            </span>
            <span
              style={{
                display: expandLeftNav ? "inline" : "none",
                opacity: expandLeftNav ? 1 : 0,
                transition: "opacity 0.3s ease",
                fontSize: 18,
                color: themeMode === "dark" ? currentOpenTab === "locations" ? theme.palette.text.primary : lightText : darkText,
              }}
            >
    Partners
            </span>
          </Button>
          </span>
          </>): null}
              </Box>
            </Collapse>

          <Button
            component={Link}
            to={userdata?.org_status?.includes("integration_partner") && userdata?.active_org?.branding?.documentation_link?.length > 0 ? userdata?.active_org?.branding?.documentation_link : "/docs"}
            target={userdata?.org_status?.includes("integration_partner") && userdata?.active_org?.branding?.documentation_link?.length > 0 ? "_blank" : "_self"}
            onClick={(event) => {
              setCurrentOpenTab("docs");
              localStorage.setItem("lastTabOpenByUser", "docs");
            }}
            style={{
              ...ButtonStyle,
              marginTop: 5,
              backgroundColor: currentOpenTab === "docs" ? themeMode === 'dark' ? darkHoverColor : lightHoverColor : "transparent",
            }}
            onMouseOver={(event)=>{
              event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
            }}
            onMouseOut={(event)=>{
              event.currentTarget.style.backgroundColor = currentOpenTab === "docs" ? themeMode === 'dark' ? darkHoverColor : lightHoverColor : "transparent";
            }}
          >
            <svg
                width="18"
                height="18"
                viewBox="0 0 14 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: expandLeftNav ? 10 : 0 }}
              >
                <path
                  d="M7.75 1H2.5C2.10218 1 1.72064 1.15804 1.43934 1.43934C1.15804 1.72064 1 2.10218 1 2.5V14.5C1 14.8978 1.15804 15.2794 1.43934 15.5607C1.72064 15.842 2.10218 16 2.5 16H11.5C11.8978 16 12.2794 15.842 12.5607 15.5607C12.842 15.2794 13 14.8978 13 14.5V6.25L7.75 1Z"
                  stroke={themeMode === "dark" ? lightText : darkText} 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.75 1V6.25H13"
                  stroke={themeMode === "dark" ? lightText : darkText} 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            <span
              style={{
                display: expandLeftNav ? "inline" : "none",
                color: themeMode === "dark" ? currentOpenTab === "docs" ? theme.palette.text.primary : lightText : darkText
              }}
            >
              Documentation
            </span>
          </Button>


          <Button
            component={Link}
            to={isCloud ? "/admin" : "/admin"}
            onClick={(event) => {
              setCurrentOpenTab("admin");
              localStorage.setItem("lastTabOpenByUser", "admin");
            }}
            style={{
              ...ButtonStyle,
              marginTop: 8,
              backgroundColor: currentOpenTab === "admin" ? themeMode === 'dark' ? darkHoverColor : lightHoverColor : "transparent",
            }}
            onMouseOver={(event)=>{
              event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
            }}
            onMouseOut={(event)=>{
              event.currentTarget.style.backgroundColor = currentOpenTab === "admin" ? themeMode === "dark" ? darkHoverColor : lightHoverColor : "transparent";
            }}
          >
			<BusinessIcon style={{ width: 16, height: 16, marginRight: expandLeftNav ? 10 : 0, color: themeMode === 'dark' ? lightText : darkText }} />
            <span
              style={{
                display: expandLeftNav ? "inline" : "none",
                color: themeMode === "dark" ? currentOpenTab === "admin" ? theme.palette.text.primary : lightText : darkText
              }}
            >
	  		  Admin
            </span>
          </Button>
        </Box>

        {recentworkflows?.length > 0 ? 
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
              fontSize: 18,
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
		: null }

      </Box>
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 10,
          marginLeft: 5,
        }}
      >
	  	
	  	{userdata?.licensed !== true && !userdata?.org_status?.includes("integration_partner") && expandLeftNav &&
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", }}>
      <Button
	  		variant="outlined"
	  		style={{marginBottom: 15, borderWidth: 2, }}
	  		onClick={() => {
				window.open("https://shuffler.io/contact?category=book_a_demo", "_blank")
			}}
	  	>
	  		Book a Demo
      </Button>
      </div>
		}
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
                  minWidth: "250px",
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
                  marginLeft: option.margin_left ? option.margin_left : 0,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = theme.palette.hoverColor;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = option.name === selectedOrg ? theme.palette.hoverColor : "transparent";
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
                    {
                      isCloud ? (
                          <span
                      style={{
                        color: theme.palette.text.primary,
                        fontSize: "16px",
                        marginRight: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img src={getRegionFlag(option.region_url)} alt={option.region_url} style={{ width: 24, height: 24, marginRight: 12, borderRadius: "50%" }} />
                      {option.region_url}
                    </span>
                    ) : null
                    }
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
                        color: theme.palette.text.primary,
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
              const normalize = (str) => str.toLowerCase().replace(/[\s-]+/g, "");
              const input = normalize(params.inputValue);
            
              return options.filter((option) =>
                normalize(option.name).includes(input) || 
                normalize(option.region_url).includes(input)
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
                      border: theme.palette.defaultBorder,
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
                        color: themeMode === "dark" ? lightText : darkText,
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
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: expandLeftNav ? 0 : 10,
            height: 55,
            borderRadius: 8,
          }}
          onMouseOver={(event) => {
            event.currentTarget.style.backgroundColor = themeMode === "dark" ? darkHoverColor : lightHoverColor;
            setHoverOnAvatar(true);
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "transparent";
            setHoverOnAvatar(false);
          }}
        >
          {expandLeftNav ? (
            <>
              <Button
                onClick={(event) => {
                  if (anchorElAvatar) {
                    setAnchorElAvatar(null);
                  } else {
                    setAnchorElAvatar(event.currentTarget);
                  }
                  setOpenAutocomplete(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  minWidth: 0,
                  gap: 10,
                  marginLeft: 8,
                }}
                disableElevation
                disableRipple
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: themeMode === 'dark' ? darkHoverColor : lightHoverColor,
                    color: themeMode === 'dark' ? lightText : darkText,
                    fontSize: 30,
                    fontStyle: "bold",
                    border: hoverOnAvatar ? (themeMode === 'dark' ? "1px solid #494949" : '1px solid #5A5A5A') : "none",
                  }}
                >
                  {userdata?.username?.substring(0, 1).toUpperCase()}
                </Avatar>
                <Typography
                  style={{
                    color: themeMode === "dark" ? lightText : darkText,
                    fontSize: 18,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 150,
                  }}
                >
                  {userdata?.username}
                </Typography>
              </Button>
              {avatarMenu}
            </>
          ) : (
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
                border: hoverOnAvatar ? theme.palette.defaultBorder: "none",
              }}
              disableElevation
              disableRipple
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: themeMode === "dark" ? darkHoverColor : lightHoverColor,
                  color: theme.palette.text.primary,
                  fontSize: 30,
                }}
              >
                {userdata?.username?.substring(0, 1).toUpperCase()}
              </Avatar>
            </Button>
          )}
        </Box>
      </Box>
      </Box>
     </div>
  );
};

export default LeftSideBar;
const ModalView = memo(({searchBarModalOpen, setSearchBarModalOpen, globalUrl, serverside, userdata, isDocSearchModalOpen}) => {
  const {themeMode}  = useContext(Context);
  const theme = getTheme(themeMode);
  return (
    (
      <Dialog
        open={searchBarModalOpen && !isDocSearchModalOpen}
        onClose={() => {
          setSearchBarModalOpen(false);
        }}
        PaperProps={{
          sx: {
            color: theme.palette.text.primary,
            minWidth: "750px",
            height: "785px",
            borderRadius: "16px",
            border: "1px solid var(--Container-Stroke, #494949)",
            background: theme?.palette?.DialogStyle?.backgroundColor,
            boxShadow: "0px 16px 24px 8px rgba(0, 0, 0, 0.25)",
            zIndex: 13000,
            paddingTop: "20px",
            '& .MuiDialogContent-root': {
              backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
            },
          },
        }}
      >
        <DialogContent className='dialog-content' style={{backgroundColor: theme.palette.DialogStyle.backgroundColor}}>
          <SearchBox globalUrl={globalUrl} serverside={serverside} userdata={userdata} />
        </DialogContent>
        <Divider style={{overflow: "hidden"}}/>
        <span style={{display:"flex", width:"100%", height:30}}>
        </span>
      </Dialog>
    )
  )
});
