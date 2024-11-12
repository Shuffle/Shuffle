import React, { useState, useEffect } from "react";

import theme from "../theme.jsx";
import { makeStyles } from "@mui/styles";

import { useNavigate, Link } from "react-router-dom";
import countries from "../components/Countries.jsx";
import CacheView from "../components/CacheView.jsx";
import { CopyToClipboard } from "../views/Docs.jsx";

import {
  FormControl,
  InputLabel,
  Paper,
  OutlinedInput,
  Checkbox,
  Card,
  Chip,
  Tooltip,
  FormControlLabel,
  Typography,
  Switch,
  Select,
  MenuItem,
  Divider,
  TextField,
  Button,
  ButtonGroup,
  Tabs,
  Tab,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Zoom,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  Box,
  InputAdornment,
  Autocomplete,
  Modal
} from "@mui/material";

import {
  Add as AddIcon,
  Clear as ClearIcon,
  Storage as StorageIcon,
  Edit as EditIcon,
  FileCopy as FileCopyIcon,
  SelectAll as SelectAllIcon,
  OpenInNew as OpenInNewIcon,
  CloudDownload as CloudDownloadIcon,
  Description as DescriptionIcon,
  Polyline as PolylineIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Apps as AppsIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Cached as CachedIcon,
  AccessibilityNew as AccessibilityNewIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  Cloud as CloudIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Cancel as CancelIcon,
  Dns as DnsIcon,
  Help as HelpIcon,
  Flag as FlagIcon,
  FmdGood as FmdGoodIcon,
  Warning as WarningIcon,
	
  ExpandLess as ExpandLessIcon, 
  ExpandMore as ExpandMoreIcon, 
} from "@mui/icons-material";

//import { useAlert
import { ToastContainer, toast } from "react-toastify";
import Dropzone from "../components/Dropzone.jsx";
import HandlePaymentNew from "../views/HandlePaymentNew.jsx";
import OrgHeader from "../components/OrgHeader.jsx";
import OrgHeaderexpanded from "../components/OrgHeaderexpanded.jsx";
import Billing from "../components/Billing.jsx";
import Priorities from "../components/Priorities.jsx";
import Branding from "../components/Branding.jsx";
import Files from "../components/Files.jsx";
import { display, style } from "@mui/system";

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 500,
    },
  },
  getContentAnchorEl: () => null,
};

const FileCategoryInput = (props) => {
  const isSet = props.isSet;
  console.log("inside filecategoryinput");
  console.log("isset value", isSet);
  if (isSet) {
    return (
      <TextField
        onBlur={""}
        InputProps={{
          style: {
            color: "white",
          },
        }}
        color="primary"
        placeholder="File category name"
        required
        margin="dense"
        defaultValue={""}
        autoFocus
        fullWidth
      />
    );
  }
};

const Admin = (props) => {
  const {
    globalUrl,
    userdata,
    serverside,
    checkLogin,
    notifications,
    setNotifications,
  } = props;

  var to_be_copied = "";
  const classes = useStyles();
  let navigate = useNavigate();

  const [logsViewModal, setLogsViewModal] = React.useState(false);
  const [userLogViewing, setUserLogViewing] = React.useState({});
  const [ipSelected, setIpSelected] = React.useState("");
  const [logsLoading, setLogsLoading] = React.useState(true);
  const [logs, setLogs] = React.useState([]);
  const [firstRequest, setFirstRequest] = React.useState(true);
  const [orgRequest, setOrgRequest] = React.useState(true);
  const [modalUser, setModalUser] = React.useState({});
  const [orgName, setOrgName] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);

  const [cloudSyncModalOpen, setCloudSyncModalOpen] = React.useState(false);
  const [cloudSyncApikey, setCloudSyncApikey] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [selectedOrganization, setSelectedOrganization] = React.useState({});

  //console.log("Selected: ", selectedOrganization)
  const [appAuthenticationGroupModalOpen, setAppAuthenticationGroupModalOpen] = React.useState(false);
  const [appsForAppAuthGroup, setAppsForAppAuthGroup] = React.useState([]);
  const [appAuthenticationGroupId, setAppAuthenticationGroupId] = React.useState("");
  const [appAuthenticationGroupName, setAppAuthenticationGroupName] = React.useState("");
  const [appAuthenticationGroupEnvironment, setAppAuthenticationGroupEnvironment] = React.useState("");
  const [appAuthenticationGroupDescription, setAppAuthenticationGroupDescription] = React.useState("");
  const [appAuthenticationGroups, setAppAuthenticationGroups] = React.useState([]);
  const [organizationFeatures, setOrganizationFeatures] = React.useState({});
  const [loginInfo, setLoginInfo] = React.useState("");
  const [curTab, setCurTab] = React.useState(0);
  const [users, setUsers] = React.useState([]);
  const [subOrgs, setSubOrgs] = useState([]);
  const [parentOrg, setParentOrg] = React.useState(null);
  const [organizations, setOrganizations] = React.useState([]);
  const [orgSyncResponse, setOrgSyncResponse] = React.useState("");
  const [userSettings, setUserSettings] = React.useState({});
  const [matchingOrganizations, setMatchingOrganizations] = React.useState([]);

  const [environments, setEnvironments] = React.useState([]);
  const [authentication, setAuthentication] = React.useState([]);
  const [schedules, setSchedules] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState({});
  const [newUsername, setNewUsername] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [selectedUserModalOpen, setSelectedUserModalOpen] =
    React.useState(false);
  const [selectedAuthentication, setSelectedAuthentication] = React.useState(
    {},
  );
  const [selectedAuthenticationModalOpen, setSelectedAuthenticationModalOpen] =
    React.useState(false);
  const [authenticationFields, setAuthenticationFields] = React.useState([]);
  const [showArchived, setShowArchived] = React.useState(false);
  const [isDropzone, setIsDropzone] = React.useState(false);

  const [image2FA, setImage2FA] = React.useState("");
  const [value2FA, setValue2FA] = React.useState("");
  const [secret2FA, setSecret2FA] = React.useState("");
  const [show2faSetup, setShow2faSetup] = useState(false);

  const [adminTab, setAdminTab] = React.useState(3);
  const [showApiKey, setShowApiKey] = useState(false);
  const [billingInfo, setBillingInfo] = React.useState({});
  const [selectedStatus, setSelectedStatus] = React.useState([]);
  const [webHooks, setWebHooks] = React.useState([]);
  const [allSchedules, setAllSchedules] = React.useState([]);
  const [pipelines, setPipelines] = React.useState([]);
  const [, forceUpdate] = React.useState();
  const [MFARequired, setMFARequired] = React.useState(selectedOrganization.mfa_required === undefined ? false : selectedOrganization.mfa_required);
  const [listItemExpanded, setListItemExpanded] = React.useState(-1);
  const [installationTab, setInstallationTab] = React.useState(0);
  const [commandController, setCommandController] = React.useState({
	  pipelines: false,
	  proxies: false,
  })
  const [, setUpdate] = React.useState(0);

  useEffect(() => {
    if (selectedOrganization.mfa_required !== undefined) {
      setMFARequired(selectedOrganization.mfa_required);
    }
  }, [selectedOrganization.mfa_required]);

  const [showDeleteAccountTextbox, setShowDeleteAccountTextbox] =
    React.useState(false);
  const [deleteAccountText, setDeleteAccountText] = React.useState("");
  const [regionChangeModalOpen, setRegionChangeModalOpen] =
    React.useState(false);

  useEffect(() => {
    getUsers();

    setTimeout(() => {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());

	  const foundOrgID = params["org_id"]
	  if (foundOrgID !== null && foundOrgID !== undefined) {
  		handleClickChangeOrg(foundOrgID)
	  }
	

	  const foundTab = params["admin_tab"]
	  if (foundTab !== null && foundTab !== undefined) {
		  if (adminTab === 3) {
			window.scroll({
			  top: 450,
			  left: 0,
			  behavior: "smooth",
			});
		  }
	  }
    }, 1500);
  }, []);

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
	const foundTab = params["admin_tab"]
	if (foundTab !== null && foundTab !== undefined) {
		window.scroll({
		  top: 450,
		  left: 0,
		  behavior: "smooth",
		})
	}
  }, [adminTab]);

  useEffect(() => {
    if (isDropzone) {
      //redirectOpenApi();
      setIsDropzone(false);
    }
  }, [isDropzone]);

  useEffect(() => {
    if (
      userdata.orgs !== undefined &&
      userdata.orgs !== null &&
      userdata.orgs.length > 0
    ) {
      handleGetSubOrgs(userdata.active_org.id);
    } else console.log("error in user data");
  }, [userdata]); 
  
  useEffect(() => {
    handleGetAllTriggers()
  }, []); 

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

  const setSelectedRegion = (region) => {
    // send a POST request to /api/v1/orgs/{org_id}/region with the region as the body
    var data = {
      dst_region: region,
    };

    toast("Changing region to " + region + "...This may take a few minutes.");

    fetch(`${globalUrl}/api/v1/orgs/${selectedOrganization.id}/change/region`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
      timeOut: 1000,
    }).then((response) => {
      if (response.status !== 200) {
        toast("Failed to change region!");
      } else {
        toast("Region changed successfully! Reloading in 5 seconds..");
        // Reload the page in 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }

      return response.json();
    });
  };

  const RegionChangeModal = () => {
    // Show from options: "us-west2", "europe-west2", "europe-west3", "northamerica-northeast1"
    var regions = [
      "us-west2",
      "europe-west2",
      "europe-west3",
      "northamerica-northeast1",
    ];
    return (
      <Dialog
        open={regionChangeModalOpen}
        onClose={() => setRegionChangeModalOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Change region</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Region</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={""}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setRegionChangeModalOpen(false);
              }}
            >
              {regions.map((region) => {
                // Set the default region if selectedOrganization.region is not set
                if (selectedOrganization.region.length === 0) {
                  selectedOrganization.region = "europe-west2";
                }

                // Check if the current region matches the selected region
                if (region === selectedOrganization.region) {
                  // If the region matches, set the MenuItem as selected
                  return (
                    <MenuItem value={region} disabled>
                      {region}
                    </MenuItem>
                  );
                } else {
                  // Otherwise, render a regular MenuItem
                  return <MenuItem value={region}>{region}</MenuItem>;
                }
              })}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRegionChangeModalOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const get2faCode = (userId) => {
    fetch(`${globalUrl}/api/v1/users/${userId}/get2fa`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("RESPONSE: ", responseJson)
        if (responseJson.success === true) {
          //toast(responseJson.reason)
          setImage2FA(responseJson.reason);
          setSecret2FA(responseJson.extra);
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const getApps = () => {
    fetch(globalUrl + "/api/v1/apps", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        console.log("apps: ", responseJson);
        //setApps(responseJson)
        //setFilteredApps(responseJson)
        //if (responseJson.length > 0) {
        //	setSelectedApp(responseJson[0])
        //	if (responseJson[0].actions !== null && responseJson[0].actions.length > 0) {
        //		setSelectedAction(responseJson[0].actions[0])
        //	} else {
        //		setSelectedAction({})
        //	}
        //}
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const deleteAppAuthenticationGroup = (appAuthGroupId) => { 
	  const url = `${globalUrl}/api/v1/authentication/group/${appAuthGroupId}`
	  fetch(url, {
		method: "DELETE",
		credentials: "include",
		headers: {
		  "Content-Type": "application/json",
		},
	  })
	  .then((response) => {
		if (response.status !== 200) {
		  console.log("Status not 200 for deleting app auth group");
		}

		return response.json();
	  })
	  .then((responseJson) => {
		if (responseJson.success === false) {
		  toast("Failed to delete app authentication group");
		} else {
		  toast("App authentication group deleted")
		  getAppAuthenticationGroups()
		}
	  })
	  .catch((error) => {
		toast(error.toString())
	  })
  }

  const createAppAuthenticationGroup = (name, environment, description, appAuthIds) => {
	// Makes list of ids into a full-on list of auth, but just with the ID
	// The backend fills in the rest
	console.log("INput auth: ", appAuthIds)
    let app_auths = appAuthIds.map((appAuthId) => {
      return { id: appAuthId };
    })

	var parsedAppGroup = {
        label: name,
		environment: environment,
        description: description,
        app_auths: app_auths
      }

	if (appAuthenticationGroupId !== undefined && appAuthenticationGroupId !== null && appAuthenticationGroupId !== "") {
		parsedAppGroup.id = appAuthenticationGroupId
	}

    fetch(globalUrl + "/api/v1/authentication/group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(parsedAppGroup),
    })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error("Failed to create app authentication group");
        }

        return response.json();
      })
      .then((responseJson) => {
		if (responseJson.success === false) {
			toast("Failed to create. Please try again, or contact support@shuffler.io")
		} else {
			// Close the modal
			setAppAuthenticationGroupModalOpen(false)

        	toast("App authentication group created")
        	getAppAuthenticationGroups()
		}
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const categories = [
    {
      name: "Ticketing",
      apps: ["TheHive", "Service-Now", "SecureWorks"],
      categories: ["tickets", "ticket", "ticketing"],
    },
  ];
  /*
		"SIEM",
		"Active Directory",
		"Firewalls", 
		"Proxies web",
		"SIEM", 
		"SOAR",
		"Mail",
		"EDR",
		"AV", 
		"MDM/MAM",
		"DNS",
		"Ticketing platform",
		"TIP",
		"Communication", 
		"DDOS protection",
		"VMS",
	]
	*/

  //const alert = useAlert();
  const handleStatusChange = (event) => {
    const { value } = event.target;
    setSelectedStatus(value);

    handleEditOrg(
      "",
      "",
      selectedOrganization.id,
      "",
      {},
      {},
      value.length === 0 ? ["none"] : value,
    );
  };

  // Basically just a simple way to get a generated email
  // This also may help understand how to communicate with users
  // both inside and outside Shuffle
  // This could also be generated on the backend
  const mailsendingButton = (org) => {
    if (org === undefined || org === null) {
      return "";
    }

    if (users.length === 0) {
      return "";
    }

    // 1 mail based on users that have only apps
    // Another based on those doing workflows
    // Another based on those trying usecases(?) or templates
    //
    // Start based on edr, siem & ticketing
    // Talk about enrichment?
    // Check suggested usecases
    // Check suggested workflows
    var your_apps = "- Connecting ";

    var subject_add = 0;
    var subject = "POC to automate ";

    if (
      org.security_framework !== undefined &&
      org.security_framework !== null
    ) {
      if (
        org.security_framework.cases.name !== undefined &&
        org.security_framework.cases.name !== null &&
        org.security_framework.cases.name !== ""
      ) {
        your_apps +=
          org.security_framework.cases.name
            .replace("_", " ", -1)
            .replace(" API", "", -1) + ", ";

        if (subject_add < 2) {
          if (subject_add === 1) {
            subject += " and ";
          }

          subject_add += 1;
          subject += org.security_framework.cases.name
            .replace("_", " ", -1)
            .replace(" API", "", -1);
        }
      }

      if (
        org.security_framework.siem.name !== undefined &&
        org.security_framework.siem.name !== null &&
        org.security_framework.siem.name !== ""
      ) {
        your_apps +=
          org.security_framework.siem.name
            .replace("_", " ", -1)
            .replace(" API", "", -1) + ", ";
        if (subject_add < 2) {
          if (subject_add === 1) {
            subject += " and ";
          }

          subject_add += 1;
          subject += org.security_framework.siem.name
            .replace("_", " ", -1)
            .replace(" API", "", -1);
        }
      }

      if (
        org.security_framework.communication.name !== undefined &&
        org.security_framework.communication.name !== null &&
        org.security_framework.communication.name !== ""
      ) {
        your_apps +=
          org.security_framework.communication.name
            .replace("_", " ", -1)
            .replace(" API", "", -1) + ", ";

        if (subject_add < 2) {
          if (subject_add === 1) {
            subject += " and ";
          }

          subject_add += 1;
          subject += org.security_framework.communication.name
            .replace("_", " ", -1)
            .replace(" API", "", -1);
        }
      }

      if (
        org.security_framework.edr.name !== undefined &&
        org.security_framework.edr.name !== null &&
        org.security_framework.edr.name !== ""
      ) {
        your_apps +=
          org.security_framework.edr.name
            .replace("_", " ", -1)
            .replace(" API", "", -1) + ", ";

        if (subject_add < 2) {
          if (subject_add === 1) {
            subject += " and ";
          }

          subject_add += 1;
          subject += org.security_framework.edr.name
            .replace("_", " ", -1)
            .replace(" API", "", -1);
        }
      }

      if (
        org.security_framework.intel.name !== undefined &&
        org.security_framework.intel.name !== null &&
        org.security_framework.intel.name !== ""
      ) {
        your_apps +=
          org.security_framework.intel.name
            .replace("_", " ", -1)
            .replace(" API", "", -1) + ", ";

        if (subject_add < 2) {
          if (subject_add === 1) {
            subject += " and ";
          }

          subject_add += 1;
          subject += org.security_framework.intel.name
            .replace("_", " ", -1)
            .replace(" API", "", -1);
        }
      }

      // Remove comma
      //subject += "?"
      your_apps = your_apps.substring(0, your_apps.length - 2);
    }

    // Add usecases they may not have tried (from recommendations): org.priorities where item type is usecase
    var usecases = "- Building usecases like ";
    const active_usecase = org.priorities.filter(
      (item) => item.type === "usecase" && item.active === true,
    );
    if (active_usecase.length > 0) {
      for (var i = 0; i < active_usecase.length; i++) {
        if (active_usecase[i].name.includes("Suggested Usecase: ")) {
          usecases +=
            active_usecase[i].name.replace("Suggested Usecase: ", "", -1) +
            ", ";
        } else {
          usecases += active_usecase[i].name + ", ";
        }
      }

      usecases = usecases.substring(0, usecases.length - 2);
    }

    if (your_apps.length <= 15) {
      your_apps = "";
    }

    if (usecases.length <= 30) {
      usecases = "";
    }

    var workflow_amount = "a few";
    var admins = "";

    // Loop users
    var lastLogin = 0;
    for (var i = 0; i < users.length; i++) {
      if (users[i].username.includes("shuffler")) {
        continue;
      }

      if (users[i].role === "admin") {
        admins += users[i].username + ",";
      }

      const data = users[i];
      for (var i = 0; i < data.login_info.length; i++) {
        if (data.login_info[i].timestamp > lastLogin) {
          lastLogin = data.login_info[i].timestamp;
        }
      }
    }

    // Remove last comma
    admins = admins.substring(0, admins.length - 1);

    if (your_apps.length > 5) {
      your_apps += "%0D%0A";
    }

    if (usecases.length > 5) {
      usecases += "%0D%0A";
    }

    // Get drift username from userdata.username before @ in email
    const username = userdata.username.substring(
      0,
      userdata.username.indexOf("@"),
    );

    // Check if timestamp is more than 2 weeks ago and add "a while back" to the message
    const timeComparison = 1209600;
    const extra_timestamp_text =
      lastLogin === 0
        ? 0
        : Date.now() / 1000 - lastLogin > timeComparison
          ? " a while back"
          : "";
    console.log("LAST LOGIN: " + lastLogin, extra_timestamp_text);

    // Check if cloud sync is active, and if so, add a message about it
    const cloudSyncInfo =
      selectedOrganization.cloud_sync === true
        ? "- Scale your onprem installation"
        : "";

    var body = `Hey,%0D%0A%0D%0AI noticed you tried to use Shuffle${extra_timestamp_text}, and thought you may be interested in a POC. It looks like you have ${workflow_amount} workflows made, but it still doesn't look like you are getting what you wanted out of  Shuffle. If you're interested, I'd love to set up a quick call to see if we can help you get more out of Shuffle. %0D%0A%0D%0A

Some of the things we can help with:%0D%0A
${your_apps}
- Configuring and authenticating your apps%0D%0A
${usecases}
- Multi-Tenancy and creating special usecases%0D%0A
${cloudSyncInfo}%0D%0A

If you're interested, please let me know a time that works for you, or set up a call here: https://drift.me/${username}`;

    return `mailto:${admins}?bcc=frikky@shuffler.io,binu@shuffler.io&subject=${subject}&body=${body}`;
  };

  const changeDistribution = (data) => {
    //changeDistributed(data, !isDistributed)
    console.log("Should change distribution to be shared among suborgs");

    editAuthenticationConfig(data.id, "suborg_distribute");
  };

  const deleteAuthentication = (data) => {
    toast("Deleting auth " + data.label);

    // Just use this one?
    const url = globalUrl + "/api/v1/apps/authentication/" + data.id;
    console.log("URL: ", url);
    fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson.success === false) {
            toast("Failed deleting auth");
          } else {
            // Need to wait because query in ES is too fast
            setTimeout(() => {
              getAppAuthentication();
            }, 1000);
            //toast("Successfully deleted authentication!")
          }
        }),
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  const handleGetAllTriggers = () => {
    fetch(globalUrl + "/api/v1/triggers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for getting all triggers");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        setWebHooks(responseJson.webhooks || []); // Handling the case where the result is null or undefined
        setAllSchedules(responseJson.schedules || []);
        setPipelines(responseJson.pipelines || []);
      })
      .catch((error) => {
        // toast(error.toString());
      });
  };

  const deleteSchedule = (data) => {
    // FIXME - add some check here ROFL
    console.log("INPUT: ", data);

    // Just use this one?
    const url =
      globalUrl +
      "/api/v1/workflows/" +
      data["workflow_id"] +
      "/schedule/" +
      data.id;
    console.log("URL: ", url);
    fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          console.log("RESP: ", responseJson);
          if (responseJson["success"] === false) {
            toast("Failed stopping schedule");
          } else {
            toast("Successfully stopped schedule!");
          }
      
          setTimeout(handleGetAllTriggers, 1000);

        }),
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  const startSchedule = (trigger) => {
    if (trigger.name.length <= 0) {
      toast("Error: name can't be empty");
      return;
    }

    toast("Creating schedule");
    const data = {
      name: trigger.name,
      frequency: trigger.frequency,
      execution_argument: trigger.argument,
      environment: trigger.environment,
      id: trigger.id,
      start: trigger.start_node,
    };
  
    fetch(`${globalUrl}/api/v1/workflows/${trigger.workflow_id}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          toast("Failed to set schedule: " + responseJson.reason);
        } else {
          toast("Successfully created schedule");
        }
        setTimeout(handleGetAllTriggers, 1000);
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Get schedule error: ", error.toString());
      });
  };
  
  const deleteWebhook = (trigger) => {
    if (trigger === undefined) {
      return;
    }
  
    fetch(globalUrl + "/api/v1/hooks/" + trigger.id + "/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success) {
          toast("Successfully stopped webhook");
        } else {
          if (responseJson.reason !== undefined) {
            toast("Failed stopping webhook: " + responseJson.reason);
          }
        }
        setTimeout(handleGetAllTriggers, 1000);
      })
      .catch((error) => {
        toast(
          "Delete webhook error. Contact support or check logs if this persists.",
        );
      });
  };
  
  const startWebHook = (trigger) => {
    const hookname = trigger.info.name;
    if (hookname.length === 0) {
      toast("Missing name");
      return;
    }
  
    if (trigger.id.length !== 36) {
      toast("Missing id");
      return;
    }
  
    toast("Starting webhook");
  
    const data = {
      name: hookname,
      type: "webhook",
      id: trigger.id,
      workflow: trigger.workflows[0],
      start: trigger.start,
      environment: trigger.environment,
      auth: trigger.auth,
      custom_response: trigger.custom_response,
      version: trigger.version,
      version_timeout: 15,
    };
  
    console.log("Trigger data: ", data);
  
    fetch(globalUrl + "/api/v1/hooks/new", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.success) {
          // Set the status
          toast("Successfully started webhook");
        } else {
          toast("Failed starting webhook: " + responseJson.reason);
        }
        setTimeout(handleGetAllTriggers, 1000);
      })
      .catch((error) => {
        //console.log(error.toString());
        console.log("New webhook error: ", error.toString());
      });
  };

  const changePipelineState = (pipeline, state) => {
    if (state.trim() === "") {
      toast("state is not defined");
      return;
    }
  
    const data = {
      name: pipeline.name,
      id: pipeline.id,
      type: state,
	  command: pipeline.definition,
      environment: pipeline.environment,
    };
  
    if (state === "start") toast("starting the pipeline");
    else toast.info("Stopping the pipeline. This may take a few minutes to propagate.")
  
    const url = `${globalUrl}/api/v1/triggers/pipeline`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
          toast("Failed to update the pipeline state");
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          toast.error("Failed to update the pipeline: " + responseJson.reason);
        } else {
			setTimeout(() => {
				handleGetAllTriggers()
			}, 5000)

			setTimeout(() => {
				handleGetAllTriggers()
			}, 20000)

			setTimeout(() => {
				handleGetAllTriggers()
			}, 120000)
			/*
          if (state === "start") {
			  toast("Successfully created pipeline");
		  } else {
          	toast("Sucessfully stopped the pipeline");
		  }
		  */
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Get schedule error: ", error.toString());
      });
  };  
  
  if (
    userdata.support === true &&
    selectedOrganization.id !== "" &&
    selectedOrganization.id !== undefined &&
    selectedOrganization.id !== null &&
    selectedOrganization.id !== userdata.active_org.id
  ) {
    toast("Refreshing window to fix org support access");
    window.location.reload();
    return null;
  }

  const handleVerify2FA = (userId, code) => {
    const data = {
      code: code,
      user_id: userId,
    };
    toast("Verifying 2fa code. Please wait...");

    fetch(`${globalUrl}/api/v1/users/${userId}/set2fa`, {
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
      .then((response) => {
        if (response.status === 200) {
        } else {
          //toast("Wrong code sent.")
          //toast("Wrong code sent. Please try again.")
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          if (responseJson.MFAActive === true) {
            toast.success("Successfully enabled 2fa");
          }
          if (responseJson.MFAActive === false) {
            toast.success("Successfully disabled 2fa");
          }

          setTimeout(() => {
            getUsers();
            setImage2FA("");
            setValue2FA("");
            setSecret2FA("");
            setShow2faSetup(false);
            setSelectedUserModalOpen(false);
          }, 1000);
        } else {
          toast("Wrong code sent. Please try again.");
          //toast("Failed setting 2fa: ", responseJson.reason)
        }
      })
      .catch((error) => {
        toast("Wrong code sent. Please try again.");
        //toast("Err: " + error.toString())
      });
  };

  const handleStopOrgSync = (org_id) => {
    if (org_id === undefined || org_id === null) {
      toast("Couldn't get org " + org_id);
      return;
    }

    const data = {};

    const url = globalUrl + "/api/v1/orgs/" + org_id + "/stop_sync";
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
      .then((response) => {
        if (response.status === 200) {
          console.log("Cloud sync success?");
          toast("Successfully stopped cloud sync");
        } else {
          console.log("Cloud sync fail?");
          toast(
            "Failed stopping sync. Try again, and contact support if this persists.",
          );
        }

        return response.json();
      })
      .then((responseJson) => {
        setTimeout(() => {
          handleGetOrg(org_id);
        }, 1000);
      })
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  };

  const enableCloudSync = (apikey, organization, disableSync) => {
    setOrgSyncResponse("");

    const data = {
      apikey: apikey,
      organization: organization,
      disable: disableSync,
    };

    const url = globalUrl + "/api/v1/cloud/setup";
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
      .then((response) => {
        setLoading(false);
        if (response.status === 200) {
          console.log("Cloud sync success?");
        } else {
          console.log("Cloud sync fail?");
        }

        return response.json();
        //setTimeout(() => {
        //}, 1000)
      })
      .then((responseJson) => {
        console.log("RESP: ", responseJson);
        if (
          responseJson.success === false &&
          responseJson.reason !== undefined
        ) {
          setOrgSyncResponse(responseJson.reason);
          toast("Failed to handle sync: " + responseJson.reason);
        } else if (!responseJson.success) {
          toast("Failed to handle sync.");
        } else {
          getOrgs();
          if (disableSync) {
            toast("Successfully disabled sync!");
            setOrgSyncResponse("Successfully disabled syncronization");
          } else {
            toast("Cloud Syncronization successfully set up!");
            setOrgSyncResponse(
              "Successfully started syncronization. Cloud features you now have access to can be seen below.",
            );
          }

          selectedOrganization.cloud_sync = !selectedOrganization.cloud_sync;
          setSelectedOrganization(selectedOrganization)
          setCloudSyncApikey("")

          handleGetOrg(userdata.active_org.id)
        }
      })
      .catch((error) => {
        setLoading(false);
        toast("Err: " + error.toString());
      });
  };

  const saveAuthentication = (authentication) => {
    const data = authentication;
    const url = globalUrl + "/api/v1/apps/authentication";

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
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            // Check if .reason exists
            if (responseJson.reason !== undefined) {
              toast("Failed changing authentication: " + responseJson.reason);
            } else {
              toast("Failed changing authentication");
            }
          } else {
            //toast("Successfully password!")
            setSelectedUserModalOpen(false);
            getAppAuthentication();

            setSelectedAuthentication({});
            setSelectedAuthenticationModalOpen(false);
          }
        }),
      )
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  };

  const handleEditOrg = (
    name,
    description,
    orgId,
    image,
    defaults,
    sso_config,
    lead_info,
  ) => {
    const data = {
      name: name,
      description: description,
      org_id: orgId,
      image: image,
      defaults: defaults,
      sso_config: sso_config,
      lead_info: lead_info,
    };

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
          if (responseJson["success"] === false) {
            toast("Failed updating org: ", responseJson.reason);
          } else {
            if (
              lead_info === undefined ||
              lead_info === null ||
              lead_info === []
            ) {
              toast("Successfully edited org!");
            }
          }
        }),
      )
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  };

  const editAuthenticationConfig = (id, parentAction) => {
    const data = {
      id: id,
      action:
        parentAction !== undefined && parentAction !== null
          ? parentAction
          : "assign_everywhere",
    };

    const url = globalUrl + "/api/v1/apps/authentication/" + id + "/config";

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
            toast("Failed overwriting appauth");
          } else {
            toast("Successfully updated auth!");
            setSelectedUserModalOpen(false);
            setTimeout(() => {
              getAppAuthentication();
            }, 1000);
          }
        }),
      )
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  };

  const createSubOrg = (currentOrgId, name) => {
    const data = { name: name, org_id: currentOrgId };
    console.log(data);
    const url = globalUrl + `/api/v1/orgs/${currentOrgId}/create_sub_org`;

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
            if (responseJson.reason !== undefined) {
              toast(responseJson.reason);
            } else {
              toast("Failed creating suborg. Please try again");
            }
          } else {
            toast("Successfully created suborg. Reloading in 3 seconds!");
            setSelectedUserModalOpen(false);

            setTimeout(() => {
              window.location.reload();
            }, 2500);
          }

          setOrgName("");
          setModalOpen(false);
        }),
      )
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  };

  const onPasswordChange = () => {
    const data = { username: selectedUser.username, newpassword: newPassword };
    const url = globalUrl + "/api/v1/users/passwordchange";

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
            if (responseJson.reason !== undefined) {
              toast(responseJson.reason);
            } else {
              toast("Failed setting new password");
            }
          } else {
            toast("Successfully updated password!");
            setSelectedUserModalOpen(false);
          }
        }),
      )
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  };

  const deleteUser = (data) => {
    // Just use this one?
    const userId = data.id;

    const url = globalUrl + "/api/v1/users/" + userId;
    fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 200) {
          getUsers();
        }

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success && responseJson.reason !== undefined) {
          toast("Failed to deactivate user: " + responseJson.reason);
        } else if (responseJson.success === false) {
          toast(
            "Failed to deactivate user. Please contact support@shuffler.io if this persists.",
          );
        } else {
          toast("Changed activation for user " + data.id);
        }
      })

      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  const handleGetOrg = (orgId) => {
    if (serverside !== true && window.location.search !== undefined && window.location.search !== null) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());
      const foundorgid = params["org_id"]
      if (foundorgid !== undefined && foundorgid !== null && foundorgid.length === 36) {
        orgId = foundorgid
      }
    }

    if (orgId.length === 0) {
      toast("Organization ID not defined. Please contact us on https://shuffler.io if this persists logout.")
      return;
    }

    // Just use this one?
	localStorage.setItem("globalUrl", "");
	localStorage.setItem("getting_started_sidebar", "open");

    fetch(`${globalUrl}/api/v1/orgs/${orgId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 401) {
        } else {
		  localStorage.removeItem("apps")
		  localStorage.removeItem("workflows")
	      localStorage.removeItem("userinfo")
		}

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson["success"] === false) {
          toast(
            "Failed getting your org. If this persists, please contact support.",
          );
        } else {
          if (
            responseJson.sync_features === undefined ||
            responseJson.sync_features === null
          ) {
            responseJson.sync_features = {};
          }

          if (
            responseJson.lead_info !== undefined &&
            responseJson.lead_info !== null
          ) {
            var leads = [];
            if (responseJson.lead_info.testing_shuffle) {
              leads.push("testing shuffle");
            }

            if (responseJson.lead_info.contacted) {
              leads.push("contacted");
            }

            if (responseJson.lead_info.customer) {
              leads.push("customer");
            }

            if (responseJson.lead_info.old_customer) {
              leads.push("old customer");
            }

            if (responseJson.lead_info.old_lead) {
              leads.push("old lead");
            }

            if (responseJson.lead_info.tech_partner) {
              leads.push("tech partner");
            }

            if (responseJson.lead_info.creator) {
              leads.push("creator");
            }

            if (responseJson.lead_info.opensource) {
              leads.push("open source");
            }

            if (responseJson.lead_info.demo_done) {
              leads.push("demo done");
            }

            if (responseJson.lead_info.pov) {
              leads.push("pov");
            }

            if (responseJson.lead_info.lead) {
              leads.push("lead");
            }

            if (responseJson.lead_info.student) {
              leads.push("student");
            }

            if (responseJson.lead_info.internal) {
              leads.push("internal");
            }

            if (responseJson.lead_info.sub_org) {
              leads.push("sub_org");
            }

            setSelectedStatus(leads);
          }

          setSelectedOrganization(responseJson);
          var lists = {
            active: {
              triggers: [],
              features: [],
              sync: [],
            },
            inactive: {
              triggers: [],
              features: [],
              sync: [],
            },
          };

          // FIXME: Set up features
          //Object.keys(responseJson.sync_features).map(function(key, index) {
          //	//console.log(responseJson.sync_features[key])
          //})

          //setOrgName(responseJson.name)
          //setOrgDescription(responseJson.description)
          setOrganizationFeatures(lists);
        }
      })
      .catch((error) => {
        console.log("Error getting org: ", error);
        toast("Error getting current organization");
      });
  };

  const handleGetSubOrgs = (orgId) => {
    if (orgId.length === 0) {
      toast(
        "Organization ID not defined. Please contact us on https://shuffler.io if this persists logout.",
      );
      return;
    }

    fetch(`${globalUrl}/api/v1/orgs/${orgId}/suborgs`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch sub organizations");
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === false) {
          //toast("Failed getting your org. If this persists, please contact support.");
        } else {
          const { subOrgs, parentOrg } = responseJson;
          setSubOrgs(subOrgs);
          setParentOrg(parentOrg);
        }
      })
      .catch((error) => {
        console.log("Error getting sub orgs: ", error);
        //toast("Error getting sub organizations");
      });
  };

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
		  localStorage.removeItem("apps")
		  localStorage.removeItem("workflows")
	      localStorage.removeItem("userinfo")
		}

        return response.json();
      })
      .then(function (responseJson) {
        if (responseJson.success === true) {
          if (responseJson.region_url !== undefined && responseJson.region_url !== null && responseJson.region_url.length > 0) {
            localStorage.setItem("globalUrl", responseJson.region_url)
            //globalUrl = responseJson.region_url
          }

          setTimeout(() => {
            window.location.reload()
          }, 2000);
          toast("Successfully changed active organization - refreshing!");
        } else {
			if (responseJson.reason !== undefined && responseJson.reason !== null) {
				if (!responseJson.reason.includes("already")) {
          			toast("Failed changing org: " + responseJson.reason);
				}
			} else {
          		toast("Failed changing org")
			}
        }
      })
      .catch((error) => {
        console.log("error changing: ", error);
        //removeCookie("session_token", {path: "/"})
      });
  };

  const inviteUser = (data) => {
    //console.log("INPUT: ", data);
    setLoginInfo("");

    // Just use this one?
    var data = {
      username: data.Username,
      type: "invite",
      org_id: selectedOrganization.id,
    };
    var baseurl = globalUrl;
    const url = baseurl + "/api/v1/users/register_org";

    fetch(url, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            setLoginInfo("Error: " + responseJson.reason);
            toast(
              "Failed to send email (2). Please try again and contact support if this persists.",
            );
          } else {
            setLoginInfo("");
            setModalOpen(false);
            setTimeout(() => {
              getUsers();
            }, 1000);

            toast(
              "Invite sent! They will show up in the list when they have accepted the invite.",
            );
          }
        }),
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
        toast(
          "Failed to send email. Please try again and contact support if this persists.",
        );
      });
  };

  const submitUser = (data) => {
    console.log("INPUT: ", data);
    setLoginInfo("");

    // Just use this one?
    var data = { username: data.Username, password: data.Password };
    var baseurl = globalUrl;
    const url = baseurl + "/api/v1/users/register";

    fetch(url, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            setLoginInfo("Error: " + responseJson.reason);
          } else {
            setLoginInfo("");
            setModalOpen(false);
            setTimeout(() => {
              getUsers();
            }, 1000);
          }
        }),
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  // Horrible frontend fix for environments
  const setDefaultEnvironment = (environment) => {
    // FIXME - add more checks to this
    toast("Changing default env") 
    var newEnv = [];
    for (var key in environments) {
      if (environments[key].id == environment.id) {
        if (environments[key].archived) {
          toast("Can't set archived to default");
          return;
        }

        environments[key].default = true;
      } else if (
        environments[key].default == true &&
        environments[key].id !== environment.id
      ) {
        environments[key].default = false;
      }

      newEnv.push(environments[key]);
    }

    // Just use this one?
    const url = globalUrl + "/api/v1/setenvironments";
    fetch(url, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(newEnv),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            toast(responseJson.reason);
            setTimeout(() => {
              getEnvironments();
            }, 1500);
          } else {
            setLoginInfo("");
            setModalOpen(false);
            setTimeout(() => {
              getEnvironments();
            }, 1500);
          }
        }),
      )
      .catch((error) => {
        console.log("Error in backend data: ", error);
      });
  };

  const flushQueue = (name) => {
    // Just use this one?
    const url = globalUrl + "/api/v1/flush_queue";
    fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            toast(responseJson.reason);
            getEnvironments();
          } else {
            setLoginInfo("");
            setModalOpen(false);
            getEnvironments();
          }
        }),
      )
      .catch((error) => {
        console.log("Error when deleting: ", error);
      });
  };

  const rerunCloudWorkflows = (environment) => {
    toast("Starting execution reruns. This runs in the background. Check the /debug view to see the progress.");
    fetch(`${globalUrl}/api/v1/environments/${environment.id}/rerun`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        } else {
          toast(response.reason);
          //toast("Aborted all dangling workflows");
        }

        return response.json();
      })
      .then((responseJson) => {
        console.log("Got response for execution: ", responseJson);
        //console.log("RESPONSE: ", responseJson)
        //setFiles(responseJson)
      })
      .catch((error) => {
        //toast(error.toString())
      });
  };

  const abortEnvironmentWorkflows = (environment) => {
    //console.log("Aborting all workflows started >10 minutes ago, not finished");
    toast(
      "Clearing the queue - this may take some time. A new will show up when finished.",
    );

    fetch(
      `${globalUrl}/api/v1/environments/${environment.id}/stop?deleteall=true`,
      {
        method: "GET",
        credentials: "include",
      },
    )
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          toast("Failed aborting dangling workflows");
          return;
        } else {
          toast("Successfully cleared the queue");

          getEnvironments();
        }

        return response.json();
      })
      .then((responseJson) => {
        console.log("Got response for execution: ", responseJson);
        //console.log("RESPONSE: ", responseJson)
        //setFiles(responseJson)
      })
      .catch((error) => {
        //toast(error.toString())
      });
  };

  const deleteEnvironment = (environment) => {
    // FIXME - add some check here ROFL
    //const name = environment.name

    //toast("Modifying environment " + name)
    //var newEnv = []
    //for (var key in environments) {
    //	if (environments[key].Name == name) {
    //		if (environments[key].default) {
    //			toast("Can't modify the default environment")
    //			return
    //		}

    //		if (environments[key].type === "cloud" && !environments[key].archived) {
    //			toast("Can't modify cloud environments")
    //			return
    //		}

    //		environments[key].archived = !environments[key].archived
    //	}

    //	newEnv.push(environments[key])
    //}
    const id = environment.id;

    //toast("Modifying environment " + environment.Name)
    var newEnv = [];
    for (var key in environments) {
      if (environments[key].id == id) {
        if (environments[key].default) {
          toast("Can't modify the default environment");
          return;
        }

        if (environments[key].type === "cloud" && !environments[key].archived) {
          toast("Can't modify cloud environments");
          return;
        }

        environments[key].archived = !environments[key].archived;
      }

      newEnv.push(environments[key]);
    }

    // Just use this one?
    const url = globalUrl + "/api/v1/setenvironments";
    fetch(url, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(newEnv),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            toast(responseJson.reason);
            getEnvironments();
          } else {
            setLoginInfo("");
            setModalOpen(false);
            getEnvironments();
          }
        }),
      )
      .catch((error) => {
        console.log("Error when deleting: ", error);
      });
  };

  const submitEnvironment = (data) => {
    // FIXME - add some check here ROFL
    environments.push({
      name: data.environment,
      type: "onprem",
    });

    // Just use this one?
    var baseurl = globalUrl;
    const url = baseurl + "/api/v1/setenvironments";
    fetch(url, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(environments),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            setLoginInfo("Error in input: " + responseJson.reason);
            getEnvironments();
          } else {
            setLoginInfo("");
            setModalOpen(false);
            getEnvironments();
          }
        }),
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  var localData = "";

  const handleDeleteAccount = (userID) => {
    if (userID === undefined || userID === null || userID === "") {
      return;
    }

    const url = `${globalUrl}/api/v1/users/${userID}/remove`;
    fetch(url, {
      mode: "cors",
      method: "DELETE",
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
            "Deleted their account. Would reload users in a few seconds.",
          );

          setTimeout(() => {
            getUsers();
          });
        } else {
          toast.error(`${data.reason}`);
        }
      })
      .catch((error) => {
        console.error(
          "There was a problem with deleting the account. Please try again:",
          error,
        );
        toast.error(
          "There was a problem with the delete request. Please try again",
        );
      });
  };

  const getSchedules = () => {
    fetch(globalUrl + "/api/v1/workflows/schedules", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        setSchedules(responseJson);
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const getAppAuthenticationGroups = () => {
	//console.log("DEBUG: Skipping app auth group loading")
    //return

    fetch(globalUrl + "/api/v1/authentication/group", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          setAppAuthenticationGroups(responseJson.data);
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const getAppAuthentication = () => {
    fetch(globalUrl + "/api/v1/apps/authentication", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          //console.log(responseJson.data)
          //console.log(responseJson)
          setAuthentication(responseJson.data);
        } else {
          toast("Failed getting authentications");
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const getEnvironments = () => {
    fetch(globalUrl + "/api/v1/getenvironments", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        setEnvironments(responseJson);

        // Helper info for users in case they have a large queue and don't know about queue flushing
        if (responseJson !== undefined && responseJson !== null && responseJson.length > 0) {
		  if (responseJson.length === 1 && responseJson[0].Type !== "cloud") {
  			setListItemExpanded(0)
		  }

          for (var i = 0; i < responseJson.length; i++) {
            const env = responseJson[i];

            // Check if queuesize is too large
            if (
              env.queue !== undefined &&
              env.queue !== null &&
              env.queue > 100
            ) {
              toast(
                "Queue size for " +
                  env.name +
                  " is very large. We recommend you to reduce it by flushing the queue before continuing.",
              );
              break;
            }
          }
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const getOrgs = () => {
    // API no longer in use, as it's in handleInfo request
    return;

    fetch(globalUrl + "/api/v1/orgs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        setOrganizations(responseJson);
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const getUsers = () => {
    fetch(globalUrl + "/api/v1/getusers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          // Ahh, this happens because they're not admin
          // window.location.pathname = "/workflows"
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        setUsers(responseJson);
      })
      .catch((error) => {
        toast(error.toString());
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
          console.log("Status not 200 when getting settings :O!");
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

  const views = {
    0: "organization",
    1: "users",
    2: "app_auth",
    3: "files",
    4: "cache",
    5: "triggers",
    6: "locations",
    7: "suborgs",
  };

  const admin_views = {
    0: "organization",
    1: "cloud_sync",
    2: "priorities",
    3: "billing",
    4: "partner",
  };

  const setConfig = (event, inputValue) => {
    const newValue = parseInt(inputValue);

    setCurTab(newValue);
    if (newValue === 1) {
      document.title = "Shuffle - admin - users";
      getUsers();
    } else if (newValue === 2) {
      document.title = "Shuffle - admin - app authentication";
      getAppAuthentication();
      getAppAuthenticationGroups();
    } else if (newValue === 3) {
      document.title = "Shuffle - admin - Files";
    } else if (newValue === 4) {
      document.title = "Shuffle - admin - Datastore";

      //listOrgCache("3fd181b9-fb29-41b7-b2f5-15292265d420");
    } else if (newValue === 5) {
      document.title = "Shuffle - admin - schedules";
      getSchedules();
    } else if (newValue === 6) {
      document.title = "Shuffle - admin - environments";
      getEnvironments();
    } else if (newValue === 7) {
      document.title = "Shuffle - admin - orgs";
      getOrgs();
    } else {
      document.title = "Shuffle - admin";
    }

    if (newValue === 8) {
      console.log("Should get apps for categories.");
    }

    navigate(`/admin?tab=${views[newValue]}`);
    setModalUser({});
  };

  if (firstRequest) {
    setFirstRequest(false);
    document.title = "Shuffle - admin";

    getEnvironments();
    if (!isCloud) {
      getUsers();
    } else {
      getSettings();
    }

    if (
      serverside !== true &&
      window.location.search !== undefined &&
      window.location.search !== null
    ) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());

      const adminTab = params["admin_tab"];
      if (adminTab !== null && adminTab !== undefined) {
        for (var key in Object.keys(admin_views)) {
          const value = admin_views[key];
          if (value === adminTab) {
            setAdminTab(parseInt(key));
            setConfig("", 0);
            break;
          }
        }
      } else {
        const foundTab = params["tab"];
        if (foundTab !== null && foundTab !== undefined) {
          for (var key in Object.keys(views)) {
            const value = views[key];
            if (value === foundTab) {
              setConfig("", key);
              break;
            }
          }
        }
      }
    }
  }

  if ( selectedOrganization.id === undefined && userdata !== undefined && userdata.active_org !== undefined && orgRequest) {
    setOrgRequest(false);
    handleGetOrg(userdata.active_org.id)
  }

  const paperStyle = {
    maxWidth: 1250,
    margin: "auto",
    color: "white",
    backgroundColor: theme.palette.surfaceColor,
    marginBottom: 10,
    padding: 20,
  };

  const changeModalData = (field, value) => {
    modalUser[field] = value;
  };

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
        } else {
          getUsers();
        }

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success && responseJson.reason !== undefined) {
          toast("Failed setting user: " + responseJson.reason);
        } else if (responseJson.success === false) {
          toast("Failed to update user");
        } else {
          //toast("Set the user field " + field + " to " + value);
          toast("Successfully updated user field " + field);

          if (field !== "suborgs") {
            setSelectedUserModalOpen(false);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const generateApikey = (user) => {
    const userId = user.id;
    const data = { user_id: userId };

    toast("Generating new API key");

    var fetchdata = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    };

    if (userId === userdata.id) {
      fetchdata.method = "GET";
    } else {
      fetchdata.body = JSON.stringify(data);
    }

    fetch(globalUrl + "/api/v1/generateapikey", fetchdata)
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        } else {
          getUsers();
        }

        return response.json();
      })
      .then((responseJson) => {
        console.log("RESP: ", responseJson);
        if (!responseJson.success && responseJson.reason !== undefined) {
          toast("Failed getting new: " + responseJson.reason);
        } else {
          toast("Got new API key");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const editAuthenticationModal = selectedAuthenticationModalOpen ? (
    <Dialog
      open={selectedAuthenticationModalOpen}
      onClose={() => {
        setSelectedAuthenticationModalOpen(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.surfaceColor,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
        },
      }}
    >
      <DialogTitle>
        <span style={{ color: "white" }}>
          Edit authentication for{" "}
          {selectedAuthentication.app.name.replaceAll("_", " ")} (
          {selectedAuthentication.label})
        </span>
        <Typography
          variant="body1"
          color="textSecondary"
          style={{ marginTop: 10 }}
        >
          You can <b>not</b> see the previous values for an authentication while
          editing. This is to keep your data secure. You can overwrite one- or
          multiple fields at a time.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography style={{ marginBottom: 0, marginTop: 10 }}>
          Authentication Label
        </Typography>
        <TextField
          style={{
            backgroundColor: theme.palette.inputColor,
            marginTop: 0,
          }}
          InputProps={{
            style: {
              height: 50,
              color: "white",
            },
          }}
          color="primary"
          required
          fullWidth={true}
          placeholder={selectedAuthentication.label}
          defaultValue={selectedAuthentication.label}
          type="text"
          margin="normal"
          variant="outlined"
          onChange={(e) => {
            selectedAuthentication.label = e.target.value;
          }}
        />

        <Divider />
        {selectedAuthentication.type === "oauth" ||
        selectedAuthentication.type === "oauth2" ||
        selectedAuthentication.type === "oauth2-app" ? (
          <div>
            <Typography
              variant="body1"
              color="textSecondary"
              style={{ marginBottom: 0, marginTop: 10 }}
            >
              Only the name and url can be modified for Oauth2/OpenID connect.
              Please remake the authentication if you want to change the other
              fields like Client ID, Secret, Scopes etc.
            </Typography>
          </div>
        ) : null}

        {selectedAuthentication.fields.map((data, index) => {
          var fieldname = data.key.replaceAll("_", " ");
          if (fieldname.endsWith(" basic")) {
            fieldname = fieldname.substring(0, fieldname.length - 6);
          }

          if (
            selectedAuthentication.type === "oauth" ||
            selectedAuthentication.type === "oauth2" ||
            selectedAuthentication.type === "oauth2-app"
          ) {
            if (selectedAuthentication.fields[index].key !== "url") {
              return null;
            }
          }

          //console.log("DATA: ", data, selectedAuthentication)
          return (
            <div key={index}>
              <Typography style={{ marginBottom: 0, marginTop: 10 }}>
                {fieldname}
              </Typography>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  marginTop: 0,
                }}
                InputProps={{
                  style: {
                    height: 50,
                    color: "white",
                  },
                }}
                color="primary"
                required
                fullWidth={true}
                placeholder={fieldname}
                type="text"
                id={`authentication-${index}`}
                margin="normal"
                variant="outlined"
                onChange={(e) => {
                  authenticationFields[index].value = e.target.value;
                  setAuthenticationFields(authenticationFields);
                }}
              />
            </div>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button
          style={{ borderRadius: "0px" }}
          onClick={() => setSelectedAuthenticationModalOpen(false)}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          style={{ borderRadius: "0px" }}
          onClick={() => {
            var error = false;
            var fails = 0;
            for (var key in authenticationFields) {
              const item = authenticationFields[key];
              if (item.value.length === 0) {
                fails += 1;
                console.log("ITEM: ", item);
                //var currentnode = cy.getElementById(data.id)
                var textfield = document.getElementById(
                  `authentication-${key}`,
                );
                if (textfield !== null && textfield !== undefined) {
                  console.log("HANDLE ERROR FOR KEY ", key);
                }
                error = true;
              }
            }

            if (
              selectedAuthentication.type === "oauth" ||
              selectedAuthentication.type === "oauth2" ||
              selectedAuthentication.type === "oauth2-app"
            ) {
              selectedAuthentication.fields = [];
            }

            if (error && fails === authenticationFields.length) {
              toast("Updating auth with new name only");
              saveAuthentication(selectedAuthentication);
            } else {
              toast("Saving new version of this authentication");
              selectedAuthentication.fields = authenticationFields;
              saveAuthentication(selectedAuthentication);
            }
          }}
          color="primary"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  const handleOrgEditChange = (event) => {
    if (userdata.id === selectedUser.id) {
      toast("Can't remove orgs from yourself");
      return;
    }

    console.log("event: ", event.target.value);
    setMatchingOrganizations(event.target.value);
    // Workaround for empty orgs
    if (event.target.value.length === 0) {
      event.target.value.push("REMOVE");
    }

    setUser(selectedUser.id, "suborgs", event.target.value);
    //setUser(selectedUser.id, "suborgs", matchingOrganizations)
  };

  const userOrgEdit =
    selectedUser.id !== undefined &&
    selectedUser.orgs !== undefined &&
    selectedUser.orgs !== null &&
    selectedOrganization.child_orgs !== undefined &&
    selectedOrganization.child_orgs !== null &&
    selectedOrganization.child_orgs.length > 0 ? (
      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel id="demo-multiple-checkbox-label" style={{ padding: 5 }}>
          Accessible Sub-Organizations (
          {selectedUser.orgs ? selectedUser.orgs.length - 1 : 0})
        </InputLabel>
        <Select
          fullWidth
          style={{ width: "100%" }}
          disabled={selectedUser.id === userdata.id}
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={matchingOrganizations}
          onChange={handleOrgEditChange}
          input={<OutlinedInput label="Tag" />}
          renderValue={(selected) => {
            return selected.join(", ");
          }}
          MenuProps={MenuProps}
        >
          {selectedOrganization.child_orgs.map((org, index) => (
            <MenuItem key={index} value={org.id}>
              <Checkbox checked={matchingOrganizations.indexOf(org.id) > -1} />
              <ListItemText primary={org.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ) : null;

  const editUserModal = (
    <Dialog
      open={selectedUserModalOpen}
      onClose={() => {
        setSelectedUserModalOpen(false);

        setImage2FA("");
        setValue2FA("");
        setSecret2FA("");
        setShow2faSetup(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.platformColor,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
		  padding: 50, 
        },
      }}
    >
      <DialogTitle style={{ maxWidth: 450, margin: "auto" }}>
        <span style={{ color: "white" }}>
          <EditIcon style={{ marginTop: 5 }} /> Editing {selectedUser.username}
        </span>
      </DialogTitle>
      <DialogContent>
        {isCloud ? null : (
          <div style={{ display: "flex" }}>
            <TextField
              style={{
                marginTop: 0,
                backgroundColor: theme.palette.inputColor,
                flex: 3,
                marginRight: 10,
              }}
              InputProps={{
                style: {
                  height: 50,
                  color: "white",
                },
              }}
              color="primary"
              required
              fullWidth={true}
              placeholder="New username"
              type="text"
              id="standard-required"
              autoComplete="username"
              margin="normal"
              variant="outlined"
              defaultValue={selectedUser.username}
              onChange={(e) => {
                setNewUsername(e.target.value);
              }}
            />
            <Button
              style={{ maxHeight: 50, flex: 1 }}
              variant="outlined"
              color="primary"
              disabled={selectedUser.role === "admin"}
              onClick={() => {
                setUser(selectedUser.id, "username", newUsername);
              }}
            >
              Submit
            </Button>
          </div>
        )}

        {isCloud ? null : (
          <div style={{ display: "flex" }}>
            <TextField
              style={{
                marginTop: 0,
                backgroundColor: theme.palette.inputColor,
                flex: 3,
                marginRight: 10,
              }}
              InputProps={{
                style: {
                  height: 50,
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
            <Button
              style={{ maxHeight: 50, flex: 1 }}
              variant="outlined"
              color="primary"
              disabled={selectedUser.role === "admin"}
              onClick={() => onPasswordChange()}
            >
              Submit
            </Button>
          </div>
        )}

        {userOrgEdit}
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        <div style={{ margin: "auto", maxWidth: 450 }}>
          <Button
            style={{}}
            variant="outlined"
            color="primary"
            disabled={selectedUser.username === userdata.username}
            onClick={() => {
              deleteUser(selectedUser);
              setSelectedUserModalOpen(false);
            }}
          >
            {selectedUser.active ? "Delete from org" : "Delete from org"}
          </Button>
          <Button
            style={{}}
            variant="outlined"
            color="primary"
            disabled={
              selectedUser.role === "admin" &&
              selectedUser.username !== userdata.username
            }
            onClick={() => generateApikey(selectedUser)}
          >
            Renew API-key
          </Button>
          <Button
            onClick={() => {
              run2FASetup(userdata);
            }}
            disabled={
              selectedUser.role === "admin" &&
              selectedUser.username !== userdata.username
            }
            variant="outlined"
            color="primary"
          >
            {selectedUser.mfa_info !== undefined &&
              selectedUser.mfa_info !== null &&
              selectedUser.mfa_info.active === true
              ? "Disable 2FA"
              : "Enable 2FA"}
          </Button>

          {isCloud && userdata.support && selectedUser.id != userdata.id ? (
            <Button
              style={{
                width: "100%",
                height: 60,
                marginTop: 50,
                border: "1px solid #d52b2b",
                textTransform: "none",
                color:
                  showDeleteAccountTextbox === true &&
                  deleteAccountText.length > 0 &&
                  deleteAccountText === selectedUser.username
                    ? "white"
                    : "#d52b2b",
                backgroundColor:
                  showDeleteAccountTextbox === true &&
                  deleteAccountText.length > 0 &&
                  deleteAccountText === selectedUser.username
                    ? "#d52b2b"
                    : "transparent",
              }}
              disabled={
                showDeleteAccountTextbox === false
                  ? false
                  : showDeleteAccountTextbox === true &&
                      deleteAccountText.length > 0 &&
                      deleteAccountText === selectedUser.username
                    ? false
                    : true
              }
              onClick={() => {
                if (
                  deleteAccountText.length > 0 &&
                  deleteAccountText === selectedUser.username
                ) {
                  console.log("Should delete: ", selectedUser.username);
                  handleDeleteAccount(selectedUser.id);

                  setShowDeleteAccountTextbox(false);
                  setDeleteAccountText("");
                  setSelectedUserModalOpen(false);
                } else {
                  setShowDeleteAccountTextbox(true);
                }
              }}
            >
              Delete Account Permanently <br />
              (support users - confirmation needed)
            </Button>
          ) : null}

          {showDeleteAccountTextbox ? (
            <TextField
              style={{
                marginTop: 10,
              }}
              InputProps={{
                style: {
                  height: 50,
                  color: "white",
                },
              }}
              color="primary"
              required
              fullWidth={true}
              label="Type the users' username"
              placeholder="username@example.com"
              value={deleteAccountText}
              onChange={(e) => {
                setDeleteAccountText(e.target.value);
              }}
            />
          ) : null}
        </div>
        {show2faSetup ? (
          <div
            style={{
              margin: "auto",
              maxWidth: 300,
              minWidth: 300,
              marginTop: 25,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {secret2FA !== undefined &&
              secret2FA !== null &&
              secret2FA.length > 0 ? (
              <span>
                <Typography variant="body2" color="textSecondary" style={{ textAlign: 'left' }}>
                  Scan the image below with the two-factor authentication app on
                  your phone. If you can’t use a QR code, use the code{" "}
                  {secret2FA} instead.
                </Typography>
              </span>
            ) : null}
            {image2FA !== undefined &&
              image2FA !== null &&
              image2FA.length > 0 ? (
              <img
                alt="2 factor img"
                src={image2FA}
                style={{
                  margin: "15px auto",
                  maxHeight: 200,
                  maxWidth: 200,
                  display: 'block',
                }}
              />
            ) : (
              <CircularProgress />
            )}

            <Typography variant="body2" color="textSecondary">
              After scanning the QR code image, the app will display a code that
              you can enter below.
            </Typography>
            <div style={{ display: "flex", width: '100%', marginTop: 10 }}>
              <TextField
                color="primary"
                style={{
                  flex: 2,
                  backgroundColor: theme.palette.inputColor,
                  marginRight: 10,
                }}
                InputProps={{
                  style: {
                    height: 50,
                    color: "white",
                    fontSize: "1em",
                  },
                  maxLength: 6,
                }}
                required
                fullWidth={true}
                id="2fa_key"
                margin="normal"
                placeholder="6-digit code"
                variant="outlined"
                onChange={(event) => {
                  if (event.target.value.length > 6) {
                    return;
                  }

                  setValue2FA(event.target.value);
                }}
                onKeyPress={(event) => {
                  if (event.key === 'Enter' && event.target.value.length === 6) {
                    handleVerify2FA(userdata.id, event.target.value, false);
                  }
                }}
              />
              <Button
                disabled={value2FA.length !== 6}
                variant="contained"
                style={{ marginTop: 15, height: 50, flex: 1 }}
                onClick={() => {
                  handleVerify2FA(userdata.id, value2FA, false);
                }}
                color="primary"
              >
                Submit
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  const GridItem = (props) => {
    const [expanded, setExpanded] = React.useState(false);
    const [showEdit, setShowEdit] = React.useState(false);
    const [newValue, setNewValue] = React.useState(-100);

    const primary = props.data.primary;
    const secondary = props.data.secondary;
    const primaryIcon = props.data.icon;
    const secondaryIcon = props.data.active ? (
      <CheckCircleIcon style={{ color: "green" }} />
    ) : (
      <CloseIcon style={{ color: "red" }} />
    );

    const submitFeatureEdit = (sync_features) => {
      if (!userdata.support) {
        console.log(
          "User does not have support access and can't edit features",
        );
        return;
      }

      sync_features.editing = true;
      const data = {
        org_id: selectedOrganization.id,
        sync_features: sync_features,
      };

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
            if (responseJson["success"] === false) {
              toast("Failed updating org: ", responseJson.reason);
            } else {
              toast("Successfully edited org!");
            }
          }),
        )
        .catch((error) => {
          toast("Err: " + error.toString());
        });
    };

    const enableFeature = () => {
      console.log("Enabling " + primary);

      console.log(selectedOrganization.sync_features);
      // Check if primary is in sync_features
      var tmpprimary = primary.replaceAll(" ", "_");
      if (!(tmpprimary in selectedOrganization.sync_features)) {
        console.log("Primary not in sync_features: " + tmpprimary);
        return;
      }

      if (props.data.active) {
        selectedOrganization.sync_features[tmpprimary].active = false;
      } else {
        selectedOrganization.sync_features[tmpprimary].active = true;
      }

      setSelectedOrganization(selectedOrganization);
      forceUpdate(Math.random());
      submitFeatureEdit(selectedOrganization.sync_features);
    };

    const submitEdit = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if primary is in sync_features
      var tmpprimary = primary.replaceAll(" ", "_");
      if (!(tmpprimary in selectedOrganization.sync_features)) {
        console.log("Primary not in sync_features: " + tmpprimary);
        return;
      }

      // Make it into a number
      var tmp = parseInt(newValue);
      if (isNaN(tmp)) {
        console.log("Not a number: " + newValue);
        return;
      }

      selectedOrganization.sync_features[tmpprimary].limit = tmp;

      setSelectedOrganization(selectedOrganization);
      forceUpdate(Math.random());
      submitFeatureEdit(selectedOrganization.sync_features);
    };

    return (
      <Grid item xs={4}>
        <Card
          style={{
            margin: 4,
            backgroundColor: theme.palette.platformColor,
            borderRadius: theme.palette?.borderRadius,
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            minHeight: expanded ? 250 : "inherit",
            maxHeight: expanded ? 300 : "inherit",
          }}
        >
          <ListItem
            style={{ cursor: "pointer" }}
            onClick={() => {
              setExpanded(!expanded);
            }}
          >
            <ListItemAvatar>
              <Avatar>{primaryIcon}</Avatar>
            </ListItemAvatar>
            <ListItemText
              style={{ textTransform: "capitalize" }}
              primary={props.data.newname ? props.data.newname : primary}
            />
            {isCloud && userdata.support === true ? (
              <Tooltip title="Edit features (support users only)">
                <EditIcon
                  color="secondary"
                  style={{ marginRight: 10, cursor: "pointer" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (showEdit) {
                      setShowEdit(false);
                      return;
                    }

                    console.log("Edit");

                    setShowEdit(true);
                  }}
                />
              </Tooltip>
            ) : null}
            <Tooltip
              title={props.data.active ? "Disable feature" : "Enable feature"}
            >
              <span
                style={{ cursor: "pointer", marginTop: 5 }}
                onClick={(e) => {
                  if (!isCloud || userdata.support !== true) {
                    return;
                  }

                  e.preventDefault();
                  e.stopPropagation();

                  enableFeature();
                }}
              >
                {secondaryIcon}
              </span>
            </Tooltip>
          </ListItem>
          {expanded ? (
            <div style={{ padding: 15 }}>
              <Typography>
                <b>Usage:&nbsp;</b>
                {props.data.limit === 0 ? (
                  "Unlimited"
                ) : (
                  <span>
                    {props.data.usage} /{" "}
                    {props.data.limit === "" ? "Unlimited" : props.data.limit}
                  </span>
                )}
              </Typography>
              {/*<Typography>
                Data sharing: {props.data.data_collection}
              </Typography>*/}
              <Typography
                style={{
                  maxHeight: 150,
                  overflowX: "hidden",
                  overflowY: "auto",
                }}
              >
                <b>Description:</b> {secondary}
              </Typography>
            </div>
          ) : null}

          {showEdit ? (
            <FormControl
              fullWidth
              onSubmit={(e) => {
                console.log("Submit");
                submitEdit(e);
              }}
            >
              <span style={{ display: "flex" }}>
                <TextField
                  style={{ flex: 3 }}
                  color="primary"
                  label={"Edit value"}
                  defaultValue={props.data.limit}
                  style={{}}
                  onChange={(event) => {
                    setNewValue(event.target.value);
                  }}
                />
                <Button
                  style={{ flex: 1 }}
                  variant="contained"
                  disabled={newValue < -1}
                  onClick={(e) => {
                    console.log("Submit 2");
                    submitEdit(e);
                  }}
                >
                  Submit
                </Button>
              </span>
            </FormControl>
          ) : null}
        </Card>
      </Grid>
    );
  };

  const itemColor = "black";
  var syncList = [
    {
      primary: "Workflows",
      secondary: "",
      active: true,
      icon: <PolylineIcon style={{ color: itemColor }} />,
    },
    {
      primary: "Apps",
      secondary: "",
      active: true,
      icon: <AppsIcon style={{ color: itemColor }} />,
    },
    {
      primary: "Organization",
      secondary: "",
      active: true,
      icon: <BusinessIcon style={{ color: itemColor }} />,
    },
  ];

  const cloudSyncModal = (
    <Dialog
      open={cloudSyncModalOpen}
      onClose={() => {
        setCloudSyncModalOpen(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.surfaceColor,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
        },
      }}
    >
      <DialogTitle>
        <span style={{ color: "white" }}>Enable cloud features</span>
      </DialogTitle>
      <DialogContent color="textSecondary">
        What does{" "}
        <a
          href="/docs/organizations#cloud_sync"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "#f85a3e" }}
        >
          cloud sync
        </a>{" "}
        do?
        <div style={{ display: "flex", marginBottom: 20 }}>
          <TextField
            color="primary"
            style={{
              backgroundColor: theme.palette.inputColor,
              marginRight: 10,
            }}
            InputProps={{
              style: {
                height: "50px",
                color: "white",
                fontSize: "1em",
              },
            }}
            required
            fullWidth={true}
            disabled={selectedOrganization.cloud_sync}
            autoComplete="cloud apikey"
            id="apikey_field"
            margin="normal"
            placeholder="Cloud Apikey"
            variant="outlined"
            onChange={(event) => {
              setCloudSyncApikey(event.target.value);
            }}
          />
          <Button
            disabled={
              (!selectedOrganization.cloud_sync &&
                cloudSyncApikey.length === 0) ||
              loading
            }
            style={{ marginLeft: 15, height: 50, borderRadius: "0px" }}
            onClick={() => {
              setLoading(true);
              enableCloudSync(
                cloudSyncApikey,
                selectedOrganization,
                selectedOrganization.cloud_sync,
              );
            }}
            color="primary"
            variant={
              selectedOrganization.cloud_sync === true
                ? "outlined"
                : "contained"
            }
          >
            {selectedOrganization.cloud_sync ? "Stop sync" : "Start sync"}
          </Button>
        </div>
        {orgSyncResponse.length > 0 ? (
          <Typography style={{ marginTop: 5, marginBottom: 10 }}>
            Error: {orgSyncResponse}
          </Typography>
        ) : null}
        <Grid container style={{ width: "100%", marginBottom: 15 }}>
          {syncList.map((data, index) => {
            return <GridItem key={index} data={data} />;
          })}
        </Grid>
        * New triggers (userinput, hotmail realtime)
        <div />
        * Execute in the cloud rather than onprem
        <div />
        * Apps can be built in the cloud
        <div />
        * Easily share apps and workflows
        <div />* Access to powerful cloud search
      </DialogContent>
    </Dialog>
  );

  var regiontag = "eu";
  if (
    userdata.region_url !== undefined &&
    userdata.region_url !== null &&
    userdata.region_url.length > 0
  ) {
    const regionsplit = userdata.region_url.split(".");
    if (regionsplit.length > 2 && !regionsplit[0].includes("shuffler")) {
      const namesplit = regionsplit[0].split("/");

      regiontag = namesplit[namesplit.length - 1];
      if (regiontag === "california") {
        regiontag = "us";
      }
    }
  }

  const organizationView =
    curTab === 0 && selectedOrganization.id !== undefined ? (
      <div style={{ position: "relative" }}>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Organization overview</h2>
          <Typography
            variant="body1"
            color="textSecondary"
            style={{ marginLeft: 0 }}
          >
            On this page organization admins can configure organizations, and
            sub-orgs (MSSP).{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/organizations#organization"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              Learn more
            </a>
          </Typography>
        </div>
        {selectedOrganization.id === undefined ? (
          <div
            style={{
              paddingTop: 250,
              width: 250,
              margin: "auto",
              textAlign: "center",
            }}
          >
            <CircularProgress />
            <Typography>Loading Organization</Typography>
          </div>
        ) : (
          <div>
            {/*
						<Tooltip
              title={"Go to Organization document"}
              style={{}}
              aria-label={"Organization doc"}
            >
              <IconButton
                style={{ top: -10, right: 50, position: "absolute" }}
                onClick={() => {
									console.log("Should go to icon")
                }}
              >
                <FileCopyIcon style={{ color: "rgba(255,255,255,0.8)" }} />
              </IconButton>
            </Tooltip>
						*/}

            {userdata.support === true ? (
              <span
                style={{
                  display: "flex",
                  top: -10,
                  right: -50,
                  position: "absolute",
                }}
              >
                {/*<a href={mailsendingButton(selectedOrganization)} target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}} disabled={selectedStatus.length !== 0}>*/}
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={selectedStatus.length !== 0}
                  style={{ minWidth: 80, maxWidth: 80, height: "100%" }}
                  onClick={() => {
                    console.log(
                      "Should send mail to admins of org with context",
                    );
                    handleStatusChange({ target: { value: ["contacted"] } });
                    // Open a new tab
                    window.open(
                      mailsendingButton(selectedOrganization),
                      "_blank",
                    );
                  }}
                >
                  Sales mail
                </Button>
                <FormControl sx={{ m: 1, width: 300 }} style={{}}>
                  <InputLabel id="">Status</InputLabel>
                  <Select
                    style={{ minWidth: 150, maxWidth: 150, }}
                    labelId="multiselect-status"
                    id="multiselect-status"
                    multiple
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    input={<OutlinedInput label="Status" />}
                    renderValue={(selected) => selected.join(", ")}
                    MenuProps={MenuProps}
                  >
                    {[
                      "testing shuffle",
                      "contacted",
                      "lead",
                      //"demo done",
                      "pov",
                      "customer",
                      "open source",
                      "student",
                      "internal",
                      "creator",
                      "tech partner",
                      "old customer",
                      "old lead",
                    ].map((name) => (
                      <MenuItem key={name} value={name}>
                        <Checkbox checked={selectedStatus.indexOf(name) > -1} />
                        <ListItemText primary={name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </span>
            ) : null}
            {isCloud ? (
              <Tooltip
                title={`Your organization is in ${regiontag}. Click to change!`}
                style={{}}
              >
                <Avatar
                  style={{
                    cursor: "pointer",
                    top: -10,
                    right: 50,
                    position: "absolute",
                  }}
                  onClick={() => {
                    if (userdata.support === false) {
                      toast(
                        "Region change is not directly implemented yet, and requires support help.",
                      );

                      if (window.drift !== undefined) {
                        window.drift.api.startInteraction({
                          interactionId: 386411,
                        });
                      }
                    } else {
                      // Show region change modal
                      console.log("Should open region change modal");
                      setRegionChangeModalOpen(true);
                    }
                  }}
                >
                  {regiontag}
                </Avatar>
              </Tooltip>
            ) : null}

            <RegionChangeModal />

            <Tooltip
              title={"Copy Organization ID"}
              style={{}}
              aria-label={"Copy orgid"}
            >
              <IconButton
                style={{ top: -10, right: 0, position: "absolute" }}
                onClick={() => {
                  const elementName = "copy_element_shuffle";
                  const org_id = selectedOrganization.id;
                  var copyText = document.getElementById(elementName);
                  if (copyText !== null && copyText !== undefined) {
                    const clipboard = navigator.clipboard;
                    if (clipboard === undefined) {
                      toast("Can only copy over HTTPS (port 3443)");
                      return;
                    }

                    navigator.clipboard.writeText(org_id);
                    copyText.select();
                    copyText.setSelectionRange(
                      0,
                      99999,
                    ); /* For mobile devices */

                    /* Copy the text inside the text field */
                    document.execCommand("copy");

                    toast(org_id + " copied to clipboard");
                  }
                }}
              >
                <FileCopyIcon style={{ color: "rgba(255,255,255,0.8)" }} />
              </IconButton>
            </Tooltip>
            {selectedOrganization.defaults !== undefined &&
            selectedOrganization.defaults.documentation_reference !==
              undefined &&
            selectedOrganization.defaults.documentation_reference !== null &&
            selectedOrganization.defaults.documentation_reference.includes(
              "http",
            ) ? (
              <Tooltip
                title={"Open Organization Documentation"}
                style={{ top: -10, right: 50, position: "absolute" }}
                aria-label={"Open org docs"}
              >
                <a
                  href={selectedOrganization.defaults.documentation_reference}
                  target="_blank"
                  style={{ textDecoration: "none" }}
                  rel="noopener noreferrer"
                >
                  <IconButton
                    style={{ top: -10, right: 50, position: "absolute" }}
                  >
                    <DescriptionIcon
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    />
                  </IconButton>
                </a>
              </Tooltip>
            ) : null}
            {selectedOrganization.name.length > 0 ? (
              <OrgHeader
                isCloud={isCloud}
                userdata={userdata}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
                adminTab={adminTab}
                handleEditOrg={handleEditOrg}
              />
            ) : (
              <div
                style={{
                  paddingTop: 250,
                  width: 250,
                  margin: "auto",
                  textAlign: "center",
                }}
              >
                <CircularProgress />
                <Typography>Loading Organization</Typography>
              </div>
            )}

            <Tabs
              id="admin_tabs"
              value={adminTab}
              indicatorColor="primary"
              textColor="secondary"
              style={{ marginTop: 50 }}
              onChange={(event, inputValue) => {
                const newValue = parseInt(inputValue);
                setAdminTab(newValue);

                //const setConfig = (event, inputValue) => {
                navigate(`/admin?admin_tab=${admin_views[newValue]}`);
              }}
              aria-label="disabled tabs example"
            >
              <Tab label=<span>Edit Details</span> />
              <Tab label=<span>Limits & Cloud Sync</span> />
              <Tab label=<span>Notifications</span> />
              <Tab label=<span>Billing & Stats</span> />
              <Tab disabled={!isCloud} label=<span>Partner</span> />
            </Tabs>

            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />

            {adminTab === 0 ? (
              <OrgHeaderexpanded
                isCloud={isCloud}
                userdata={userdata}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
                adminTab={adminTab}
              />
            ) : adminTab === 1 ? (
              <div>
                <Typography
                  variant="h6"
                  style={{ marginBottom: "10px", color: "white" }}
                >
                  Cloud syncronization
                </Typography>
                What does{" "}
                <a
                  href="/docs/organizations#cloud_sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "#f85a3e" }}
                >
                  cloud sync
                </a>{" "}
                do? Cloud syncronization is a way of getting more out of
                Shuffle. Shuffle will <b>ALWAYS</b> make every option open
                source, but features relying on other users can't be done
                without a collaborative approach.
                {isCloud ? (
                  <div style={{ marginTop: 15, display: "flex" }}>
                    <div style={{ flex: 1 }}>
                      <Typography style={{}}>
                        Currently syncronizing:{" "}
                        {selectedOrganization.cloud_sync_active === true
                          ? "True"
                          : "False"}
                      </Typography>
                      {selectedOrganization.cloud_sync_active ? (
                        <Typography style={{}}>
                          Syncronization interval:{" "}
                          {selectedOrganization.sync_config.interval === 0
                            ? "60"
                            : selectedOrganization.sync_config.interval}
                        </Typography>
                      ) : null}
                      <Typography
                        style={{
                          whiteSpace: "nowrap",
                          marginTop: 25,
                          marginRight: 10,
                        }}
                      >
                        Your Apikey
                      </Typography>
                      <div style={{ display: "flex" }}>
                        <TextField
                          color="primary"
                          style={{
                            backgroundColor: theme.palette.inputColor,
                            maxWidth: 500,
                          }}
                          InputProps={{
                            style: {
                              height: "50px",
                              color: "white",
                              fontSize: "1em",
                            },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => {
                                    setShowApiKey(!showApiKey);
                                  }}
                                >
                                  {showApiKey ? (
                                    <VisibilityIcon />
                                  ) : (
                                    <VisibilityOffIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          required
                          fullWidth={true}
                          disabled={true}
                          autoComplete="cloud apikey"
                          id="apikey_field"
                          margin="normal"
                          placeholder="Cloud Apikey"
                          variant="outlined"
                          defaultValue={userSettings.apikey}
                          type={!isCloud || showApiKey ? "text" : "password"}
                        />
                        {selectedOrganization.cloud_sync_active ? (
                          <Button
                            style={{
                              width: 150,
                              height: 50,
                              marginLeft: 10,
                              marginTop: 17,
                            }}
                            variant={
                              selectedOrganization.cloud_sync_active === true
                                ? "outlined"
                                : "contained"
                            }
                            color="primary"
                            onClick={() => {
                              handleStopOrgSync(selectedOrganization.id);
                            }}
                          >
                            Stop Sync
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", marginBottom: 20 }}>
                      <TextField
                        color="primary"
                        style={{
                          backgroundColor: theme.palette.inputColor,
                          marginRight: 10,
                        }}
                        InputProps={{
                          style: {
                            height: "50px",
                            color: "white",
                            fontSize: "1em",
                          },
                        }}
                        required
                        fullWidth={true}
                        disabled={selectedOrganization.cloud_sync}
                        autoComplete="cloud apikey"
                        id="apikey_field"
                        margin="normal"
                        placeholder="Cloud Apikey"
                        variant="outlined"
                        onChange={(event) => {
                          setCloudSyncApikey(event.target.value);
                        }}
                      />
                      <Button
                        disabled={
                          (!selectedOrganization.cloud_sync &&
                            cloudSyncApikey.length === 0) ||
                          loading
                        }
                        style={{ marginTop: 15, height: 50, width: 150 }}
                        onClick={() => {
                          setLoading(true);
                          enableCloudSync(
                            cloudSyncApikey,
                            selectedOrganization,
                            selectedOrganization.cloud_sync,
                          );
                        }}
                        color="primary"
                        variant={
                          selectedOrganization.cloud_sync === true
                            ? "outlined"
                            : "contained"
                        }
                      >
                        {selectedOrganization.cloud_sync
                          ? "Stop sync"
                          : "Start sync"}
                      </Button>
                    </div>
                    {orgSyncResponse.length > 0 ? (
                      <Typography style={{ marginTop: 5, marginBottom: 10 }}>
                        Message from Shuffle Cloud: <b>{orgSyncResponse}</b>
                      </Typography>
                    ) : null}
                  </div>
                )}
                <Typography
                  variant="h6"
                  style={{ marginLeft: 5, marginTop: 40, marginBottom: 5 }}
                >
                  Features
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{ marginBottom: 10, marginLeft: 5 }}
                >
                  Features and Limitations that are currently available to you
                  in your Cloud or Hybrid Organization. App Executions (App
                  Runs) reset monthly. If the organization is a customer or in a
                  trial, these features limitations are not always enforced.
                </Typography>
                <Grid
                  container
                  style={{
                    width: "100%",
                    marginBottom: 15,
                    paddingBottom: 150,
                  }}
                >
                  {selectedOrganization.sync_features === undefined ||
                  selectedOrganization.sync_features === null
                    ? null
                    : Object.keys(selectedOrganization.sync_features).map(
                        function (key, index) {
                          if (
                            key === "schedule" ||
                            key === "apps" ||
                            key === "updates" ||
                            key === "editing"
                          ) {
                            return null;
                          }

                          const item = selectedOrganization.sync_features[key];
                          if (item === null || item === undefined) {
                            return null;
                          }

                          const newkey = key.replaceAll("_", " ");
                          // Name rewrites as these are structs
                          var newname = "";
                          if (newkey.toLowerCase() === "shuffle gpt") {
                            newname = "Shuffle AI";
                          }

                          const griditem = {
                            primary: newkey,
                            secondary:
                              item.description === undefined ||
                              item.description === null ||
                              item.description.length === 0
                                ? "Not defined yet"
                                : item.description,
                            limit: item.limit,
                            usage:
                              item.usage === undefined || item.usage === null
                                ? 0
                                : item.usage,
                            data_collection: "None",
                            active: item.active,
                            icon: <PolylineIcon style={{ color: itemColor }} />,

                            newname: newname,
                          };

                          return (
                            <Zoom key={index}>
                              <GridItem data={griditem} />
                            </Zoom>
                          );
                        },
                      )}
                </Grid>
              </div>
            ) : adminTab === 2 ? (
              <Priorities
                isCloud={isCloud}
                userdata={userdata}
                adminTab={adminTab}
                globalUrl={globalUrl}
                checkLogin={checkLogin}
                setAdminTab={setAdminTab}
                setCurTab={setCurTab}
                notifications={notifications}
                setNotifications={setNotifications}
              />
            ) : adminTab === 3 ? (
              <Billing
                isCloud={isCloud}
                userdata={userdata}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
                adminTab={adminTab}
                billingInfo={billingInfo}
                selectedOrganization={selectedOrganization}
                stripeKey={props.stripeKey}
                handleGetOrg={handleGetOrg}
              />
            ) : adminTab === 4 ? (
              <Branding
                isCloud={isCloud}
                userdata={userdata}
                adminTab={adminTab}
                globalUrl={globalUrl}
                handleGetOrg={handleGetOrg}
                selectedOrganization={selectedOrganization}
                setSelectedOrganization={setSelectedOrganization}
              />
            ) : null}
            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />
          </div>
        )}
      </div>
    ) : null;

  const modalView = (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.surfaceColor,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
        },
      }}
    >
      <DialogTitle>
        <span style={{ color: "white" }}>
          {curTab === 1
            ? "Add user"
            : curTab === 7
              ? "Add Sub-Organization"
              : "Add environment"}
        </span>
      </DialogTitle>
      <DialogContent>
        {curTab === 1 && isCloud ? (
          <Typography variant="body1" style={{ marginBottom: 10 }}>
            We will send an email to invite them to your organization.
          </Typography>
        ) : curTab === 7 ? (
          <Typography variant="body1" style={{ marginBottom: 10 }}>
            The organization created will become a child of your current
            organization, and be available to you.
          </Typography>
        ) : null}
        {curTab === 1 ? (
          <div>
            Username
            <TextField
              color="primary"
              style={{ backgroundColor: theme.palette.inputColor }}
              autoFocus
              InputProps={{
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
              onChange={(event) =>
                changeModalData("Username", event.target.value)
              }
            />
            {isCloud ? null : (
              <span>
                Password
                <TextField
                  color="primary"
                  style={{ backgroundColor: theme.palette.inputColor }}
                  InputProps={{
                    style: {
                      height: "50px",
                      color: "white",
                      fontSize: "1em",
                    },
                  }}
                  required
                  fullWidth={true}
                  autoComplete="password"
                  type="password"
                  placeholder="********"
                  id="pwfield"
                  margin="normal"
                  variant="outlined"
                  onChange={(event) =>
                    changeModalData("Password", event.target.value)
                  }
                />
              </span>
            )}
          </div>
        ) : curTab === 7 ? (
          <div>
            Name
            <TextField
              color="primary"
              style={{ backgroundColor: theme.palette.inputColor }}
              autoFocus
              InputProps={{
                style: {
                  height: "50px",
                  color: "white",
                  fontSize: "1em",
                },
              }}
              required
              fullWidth={true}
              placeholder={`${selectedOrganization.name} Copycat Inc.`}
              id="orgname"
              margin="normal"
              variant="outlined"
              onChange={(event) => {
                setOrgName(event.target.value);
              }}
            />
          </div>
        ) : curTab === 6 ? (
          <div>
            Environment Name
            <TextField
              color="primary"
              style={{ backgroundColor: theme.palette.inputColor }}
              autoFocus
              InputProps={{
                style: {
                  height: "50px",
                  color: "white",
                  fontSize: "1em",
                },
              }}
              required
              fullWidth={true}
              placeholder="datacenter froglantern"
              id="environment_name"
              margin="normal"
              variant="outlined"
              onChange={(event) =>
                changeModalData("environment", event.target.value)
              }
            />
          </div>
        ) : null}
        {loginInfo}
      </DialogContent>
      <DialogActions>
        <Button
          style={{ borderRadius: "0px" }}
          onClick={() => setModalOpen(false)}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          style={{ borderRadius: "0px" }}
          onClick={() => {
            if (curTab === 1) {
              if (isCloud) {
                inviteUser(modalUser);
              } else {
                submitUser(modalUser);
              }
            } else if (curTab === 7) {
              createSubOrg(selectedOrganization.id, orgName);
            } else if (curTab === 6) {
              submitEnvironment(modalUser);
            }
          }}
          color="primary"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );

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

  const usersView =
    curTab === 1 ? (
      <div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', }}>
            <div>
              <h2 style={{ display: "inline" }}>User Management</h2>
              <span style={{ marginLeft: 25 }}>
                Add, edit, block or change passwords.{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="/docs/organizations#user_management"
                  style={{ textDecoration: "none", color: "#f85a3e" }}
                >
                  Learn more
                </a>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20, }}>
              <Button
                style={{}}
                variant="contained"
                color="primary"
                onClick={() => setModalOpen(true)}
              >
                Add user
              </Button>
              <Button
                style={{ marginLeft: 5, marginRight: 15 }}
                variant="contained"
                color="primary"
                onClick={() => getUsers()}
              >
                <CachedIcon />
              </Button>
            </div>
          </div>
          <div />

          <div style={{ marginleft: 20, maxWidth: 500 }}>
            <Typography variant="body1">MFA Required</Typography>
            <Switch
              checked={MFARequired}
              onChange={(event) => {
                UpdateMFAInUserOrg(selectedOrganization.id);
              }}
            />
          </div>
        </div>
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />

        {logsViewModal ? (
          <Dialog
            open={logsViewModal}
            onClose={() => {
              setLogsViewModal(false);
            }}
            PaperProps={{
              style: {
                backgroundColor: theme.palette.surfaceColor,
                color: "white",
                minWidth: "1200px",
                minHeight: "320px",
              },
            }}
          >
            <DialogTitle>
              <span style={{ color: "white" }}>User Logs</span>
            </DialogTitle>
            <DialogContent>
              {/* ask user for which IP they want to see logs for by iterating of user.login_info */}
              <FormControl fullWidth>
                <InputLabel
                  style={{ size: 10 }}
                  id="user-ip-simple-select-label"
                >
                  User IP
                </InputLabel>

                <Select
                  labelId="user-ip-simple-select-label"
                  id="user-ip-simple-select"
                  onChange={(event) => {
                    setIpSelected(event.target.value);
                    getLogs(event.target.value, userLogViewing.id);


                  }}
                >
                  {(() => {
                    const uniqueIPs = new Set();

                    return userLogViewing.login_info.map((data, index) => {
                      if (
                        data.ip.includes("127.0.0.1") ||
                        uniqueIPs.has(data.ip)
                      ) {
                        return null;
                      }

                      uniqueIPs.add(data.ip);

                      return (
                        <MenuItem key={index} value={data.ip}>
                          {data.ip}
                        </MenuItem>
                      );
                    });
                  })()}
                </Select>
              </FormControl>

              {logsLoading && ipSelected.length !== 0 ? (
                <div
                  style={{
                    marginTop: 20,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CircularProgress style={{ marginRight: 10 }} />
                  <Typography>Loading logs</Typography>
                </div>
              ) : null}

              <List>
                  <ListItem>
                    <ListItemText
                      primary={
						"Timestamp"
                      }
                      style={{
                        minWidth: 200,
                        maxWidth: 200,
                      }}
                    />
                    <ListItemText
                      primary={"Referer"}
                      style={{
                        minWidth: 300,
                        maxWidth: 300,
                        overflow: "hidden",
                      }}
                    />
                    <ListItemText
                      primary={"URL"}
                      style={{
                        minWidth: 700,
                        maxWidth: 700,
                        overflow: "hidden",
                        marginLeft: 10,
                      }}
                    />
                  </ListItem>
                {logs.map((data, index) => {
					//console.log("LOG: ", data)

					return (
                  // redirect user to logs
                  // using request id or trace id
                  <ListItem
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#1f2023" : "#27292d",
                    }}
                  >
                    <ListItemText
                      primary={new Date(
                        data.timestamp * 1000,
                      ).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                      style={{
                        minWidth: 200,
                        maxWidth: 200,
                      }}
                    />
                    <ListItemText
                      primary={data.referer}
                      style={{
                        minWidth: 300,
                        maxWidth: 300,
                        overflow: "hidden",
                      }}
                    />
                    <ListItemText
                      primary={data.url}
                      style={{
                        minWidth: 700,
                        maxWidth: 700,
                        overflow: "hidden",
                        marginLeft: 10,
                      }}
                    />
                  </ListItem>
                )})}
              </List>
            </DialogContent>
          </Dialog>
        ) : null}

        <List>
          <ListItem>
            <ListItemText
              primary="Username"
              style={{ minWidth: 350, maxWidth: 350 }}
            />

            <ListItemText
              primary="Role"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="Active"
              style={{ minWidth: 100, maxWidth: 100, marginLeft: 5 }}
            />
            <ListItemText
              primary="Type"
              style={{ minWidth: 100, maxWidth: 100 }}
            />
            <ListItemText
              primary="MFA"
              style={{ minWidth: 100, maxWidth: 100 }}
            />
            {selectedOrganization.child_orgs !== undefined &&
            selectedOrganization.child_orgs !== null &&
            selectedOrganization.child_orgs.length > 0 ? (
              <ListItemText
                primary="Suborgs"
                style={{ minWidth: 100, maxWidth: 100 }}
              />
            ) : null}
            <ListItemText
              primary="Actions"
              style={{ minWidth: 100, maxWidth: 100 }}
            />
            <ListItemText
              primary="Last Login"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
          </ListItem>
          {users === undefined || users === null
            ? null
            : users.map((data, index) => {
                var bgColor = "#27292d";
                if (index % 2 === 0) {
                  bgColor = "#1f2023";
                }

                const timeNow = new Date().getTime();

                // Get the highest timestamp in data.login_info
                var lastLogin = "N/A";
                if (data.login_info !== undefined && data.login_info !== null) {
                  var loginInfo = 0;
                  for (var i = 0; i < data.login_info.length; i++) {
                    if (data.login_info[i].timestamp > loginInfo) {
                      loginInfo = data.login_info[i].timestamp;
                    }
                  }

                  if (loginInfo > 0) {
                    lastLogin =
                      new Date(loginInfo * 1000).toISOString().slice(0, 10) +
                      " (" +
                      data.login_info.length +
                      ")";
                  }
                }

                var userData = data.username;
                if (userdata.support === true) {
                  userData = (
                    <a
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        textDecorationColor: "#F76742",
                        color: "#F76742",
                      }}
                      onClick={() => {
                        setLogsViewModal(true);
                        setUserLogViewing(data);

						if (userLogViewing.login_info !== undefined && userLogViewing.login_info !== null && userLogViewing.login_info.length > 0) {
							getLogs(userLogViewing.login_info[0].ip, userLogViewing.id)
                    		setIpSelected(userLogViewing.login_info[0].ip);
						}
                      }}
                    >
                      {data.username}
                    </a>
                  );
                }

                return (
                  <ListItem key={index} style={{ backgroundColor: bgColor }}>
                    <ListItemText
                      primary={userData}
                      style={{
                        minWidth: 350,
                        maxWidth: 350,
                        overflow: "hidden",
                      }}
                    />

                    <ListItemText
                      primary={
                        <Select
                          SelectDisplayProps={{
                            style: {
                              marginLeft: 10,
                            },
                          }}
                          value={data.role}
                          fullWidth
                          onChange={(e) => {
                            console.log("VALUE: ", e.target.value);
                            setUser(data.id, "role", e.target.value);
                          }}
                          style={{
                            backgroundColor: theme.palette.surfaceColor,
                            color: "white",
                            height: "50px",
                          }}
                        >
                          <MenuItem
                            style={{
                              backgroundColor: theme.palette.inputColor,
                              color: "white",
                            }}
                            value={"admin"}
                          >
                            Org Admin
                          </MenuItem>
                          <MenuItem
                            style={{
                              backgroundColor: theme.palette.inputColor,
                              color: "white",
                            }}
                            value={"user"}
                          >
                            Org User
                          </MenuItem>
                          <MenuItem
                            style={{
                              backgroundColor: theme.palette.inputColor,
                              color: "white",
                            }}
                            value={"org-reader"}
                          >
                            Org Reader
                          </MenuItem>
                        </Select>
                      }
                      style={{ minWidth: 135, maxWidth: 135, marginRight: 15 }}
                    />
                    <ListItemText
                      primary={data.active ? "True" : "False"}
                      style={{ minWidth: 100, maxWidth: 100 }}
                    />
                    <ListItemText
                      primary={
                        data.login_type === undefined ||
                        data.login_type === null ||
                        data.login_type.length === 0
                          ? "Normal"
                          : data.login_type
                      }
                      style={{ minWidth: 100, maxWidth: 100 }}
                    />
                    <ListItemText
                      primary={
                        data.mfa_info !== undefined &&
                        data.mfa_info !== null &&
                        data.mfa_info.active === true
                          ? "Active"
                          : "Inactive"
                      }
                      style={{ minWidth: 100, maxWidth: 100 }}
                    />
                    {selectedOrganization.child_orgs !== undefined &&
                    selectedOrganization.child_orgs !== null &&
                    selectedOrganization.child_orgs.length > 0 ? (
                      <ListItemText
                        style={{ display: "flex" }}
                        primary={
                          data.orgs === undefined || data.orgs === null
                            ? 0
                            : data.orgs.length - 1
                        }
                      />
                    ) : null}
                    <ListItemText
                      style={{ display: "flex", minWidth: 100, maxWidth: 100 }}
                    >
                      <IconButton
                        onClick={() => {
                          setSelectedUserModalOpen(true);
                          setSelectedUser(data);

                          // Find matching orgs between current org and current user's access to those orgs
                          if (
                            userdata.orgs !== undefined &&
                            userdata.orgs !== null &&
                            userdata.orgs.length > 0 &&
                            selectedOrganization.child_orgs !== undefined &&
                            selectedOrganization.child_orgs !== null &&
                            selectedOrganization.child_orgs.length > 0
                          ) {
                            var active = [];
                            for (var key in userdata.orgs) {
                              const found =
                                selectedOrganization.child_orgs.find(
                                  (item) => item.id === userdata.orgs[key].id,
                                );
                              if (found !== null && found !== undefined) {
                                if (
                                  data.orgs === undefined ||
                                  data.orgs === null
                                ) {
                                  continue;
                                }

                                const subfound = data.orgs.find(
                                  (item) => item === found.id,
                                );
                                if (
                                  subfound !== null &&
                                  subfound !== undefined
                                ) {
                                  active.push(subfound);
                                }
                              }
                            }

                            setMatchingOrganizations(active);
                          }
                        }}
                      >
                        <EditIcon color="primary" />
                      </IconButton>
                      {/*<Button
        onClick={() => {
          generateApikey(data)
        }}
        disabled={data.role === "admin" && data.username !== userdata.username}
        variant="outlined"
        color="primary"
      >
        New apikey 
      </Button>*/}
                    </ListItemText>
                    <ListItemText
                      style={{ minWidth: 150, maxWidth: 150 }}
                      primary={lastLogin}
                    >
                      <span />
                    </ListItemText>
                  </ListItem>
                );
              })}
        </List>
      </div>
    ) : null;

  const run2FASetup = (data) => {

    if (MFARequired === true && (selectedUser.mfa_info && selectedUser.mfa_info.active === true)) {
      toast("MFA is required for your organization. You can't disable it.");
      return;
    }

    if (!show2faSetup) {
      get2faCode(data.id);
    } else {
      // Should remove?
      setImage2FA("");
      setSecret2FA("");
    }

    setShow2faSetup(!show2faSetup);
    //setShow2faSetup(true);
  };

  const filesView =
    curTab !== 3 ? null : (
      <Files
        isCloud={isCloud}
        globalUrl={globalUrl}
        userdata={userdata}
        serverside={serverside}
        selectedOrganization={selectedOrganization}
      />
    );

    const schedulesView =
    curTab === 5 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Schedules</h2>
          <span style={{ marginLeft: 25 }}>
            Schedules used in Workflows. Makes locating and control easier.{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/triggers#schedules"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              Learn more
            </a>
          </span>
        </div>
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        {allSchedules === undefined ||
        allSchedules === null ||
        allSchedules.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#666",
              borderRadius: "5px",
            }}
          >
            No schedules found.
          </div>
        ) : (
          <List>
            <ListItem>
              <ListItemText
                primary="Interval"
                style={{ maxWidth: 200, minWidth: 200 }}
              />
              <ListItemText
                primary="Environment"
                style={{ maxWidth: 150, minWidth: 150 }}
              />
              <ListItemText
                primary="Workflow"
                style={{ maxWidth: 315, minWidth: 315 }}
              />
              <ListItemText
                primary="Argument"
                style={{ minWidth: 300, maxWidth: 300, overflow: "hidden" }}
              />
              <ListItemText primary="Actions" />
              <ListItemText primary="Delegation" />
            </ListItem>
            {allSchedules.map((schedule, index) => {
              var bgColor = "#27292d";
              if (index % 2 === 0) {
                bgColor = "#1f2023";
              }
  
              return (
                <ListItem key={index} style={{ backgroundColor: bgColor }}>
                  <ListItemText
                    style={{ maxWidth: 200, minWidth: 200 }}
                    primary={
                      schedule.environment === "cloud" ||
                      schedule.environment === "" ||
                      schedule.frequency.length > 0 ? (
                        schedule.frequency
                      ) : (
                        <span>{schedule.seconds} seconds</span>
                      )
                    }
                  />
                  <ListItemText
                    style={{ maxWidth: 150, minWidth: 150 }}
                    primary={schedule.environment}
                  />
                  <ListItemText
                    style={{ maxWidth: 315, minWidth: 315 }}
                    primary={
                      <a
                        style={{ textDecoration: "none", color: "#f85a3e" }}
                        href={`/workflows/${schedule.workflow_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {schedule.workflow_id}
                      </a>
                    }
                  />
                  <ListItemText
                    primary={schedule.wrapped_argument.replaceAll('\\"', '"')}
                    style={{
                      minWidth: 300,
                      maxWidth: 300,
                      overflow: "hidden",
                    }}
                  />
                  <ListItemText>
                    <Button
                      style={{}}
                      variant={
                        schedule.status === "running" ? "contained" : "outlined"
                      }
                      disabled={schedule.status === "uninitialized"}
                      onClick={() => {
                        if (schedule.status === "running") {
                          deleteSchedule(schedule);
                        } else startSchedule(schedule);
                      }}
                    >
                      {schedule.status === "running"
                        ? "Stop Schedule"
                        : "Start Schedule"}
                    </Button>
                  </ListItemText>
                </ListItem>
              );
            })}
          </List>
        )}

        <div style={{ marginTop: 50, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Webhooks</h2>
          <span style={{ marginLeft: 25 }}>
			Webhooks used in Shuffle workflows.&nbsp;
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/triggers#webhooks"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              Learn more
            </a>
          </span>
        </div>
  
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        {webHooks === undefined || webHooks === null || webHooks.length === 0 ? (
          <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "#666",
            borderRadius: "5px",
          }}
        >
            No webhooks found.
          </div>
        ) : (
          <List>
            <ListItem>
              <ListItemText
                primary="Name"
                style={{ maxWidth: 200, minWidth: 200 }}
              />
              <ListItemText
                primary="Environment"
                style={{ maxWidth: 150, minWidth: 150 }}
              />
              <ListItemText
                primary="Workflow"
                style={{ maxWidth: 315, minWidth: 315 }}
              />
              <ListItemText
                primary="Url"
                style={{ minWidth: 300, maxWidth: 300, overflow: "hidden" }}
              />
              <ListItemText primary="Actions" />
            </ListItem>
            {webHooks.map((webhook, index) => {
              var bgColor = "#27292d";
              if (index % 2 === 0) {
                bgColor = "#1f2023";
              }
  
              return (
                <ListItem key={index} style={{ backgroundColor: bgColor }}>
                  <ListItemText
                    style={{ maxWidth: 200, minWidth: 200 }}
                    primary={webhook.info.name}
                  />
                  <ListItemText
                    style={{ maxWidth: 150, minWidth: 150 }}
                    primary={webhook.environment}
                  />
                  <ListItemText
                    style={{ maxWidth: 315, minWidth: 315 }}
                    primary={
                      <a
                        style={{ textDecoration: "none", color: "#f85a3e" }}
                        href={`/workflows/${webhook.workflows[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {webhook.workflows[0]}
                      </a>
                    }
                  />
  
                  <ListItemText
                    style={{ marginLeft: 10, maxWidth: 100, minWidth: 100 }}
                    primary={
                      webhook.info.url === undefined || webhook.info.url === 0 ? (
                        ""
                      ) : (
                        <Tooltip
                          title={"Copy URL"}
                          style={{}}
                          aria-label={"Copy URL"}
                        >
                          <IconButton
                            style={{}}
                            onClick={() => {
                              const elementName = "copy_element_shuffle";
                              var copyText = document.getElementById(elementName);
                              if (copyText !== null && copyText !== undefined) {
                                const clipboard = navigator.clipboard;
                                if (clipboard === undefined) {
                                  toast("Can only copy over HTTPS (port 3443)");
                                  return;
                                }
  
                                navigator.clipboard.writeText(webhook.info.url);
                                copyText.select();
                                copyText.setSelectionRange(
                                  0,
                                  99999,
                                ); /* For mobile devices */
  
                                /* Copy the text inside the text field */
                                document.execCommand("copy");
  
                                toast("URL copied to clipboard");
                              }
                            }}
                          >
                            <FileCopyIcon
                              style={{ color: "rgba(255,255,255,0.8)" }}
                            />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  />
  
                  <ListItemText>
                    <Button
                      style={{ marginLeft: "18%" }}
                      variant={
                        webhook.status === "running" ? "contained" : "outlined"
                      }
                      disabled={webhook.status === "uninitialized"}
                      onClick={() => {
                        if (webhook.status === "running") {
                          deleteWebhook(webhook);
                        } else startWebHook(webhook);
                      }}
                    >
                      {webhook.status === "running"
                        ? "Stop webhook"
                        : "Start Webhook"}
                    </Button>
                  </ListItemText>
                </ListItem>
              );
            })}
          </List>
        )}
  
        <div style={{ marginTop: 50, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Pipelines</h2>
          <span style={{ marginLeft: 25 }}>
            Controls a pipeline to run things.{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/triggers#pipelines"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              Learn more
            </a>
          </span>
        </div>
  
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        {pipelines === undefined ||
			pipelines === null ||
			pipelines.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#666",
              borderRadius: "5px",
            }}
          >
            No pipelines found.
          </div>
        ) : (
          <List>
            <ListItem>
              <ListItemText
                primary="Name"
                style={{ maxWidth: 250, minWidth: 250 }}
              />
              <ListItemText
                primary="Environment"
                style={{ maxWidth: 150, minWidth: 150 }}
              />
              <ListItemText
                primary="Total Runs"
                style={{ maxWidth: 150, minWidth: 150}}
              />
              <ListItemText
                primary="Pipeline"
                style={{ maxWidth: 300, minWidth: 300,}}
              />
              <ListItemText
                primary="Actions"
                style={{ maxWidth: 180, minWidth: 180,}}
              />
            </ListItem>
            {pipelines.map((pipeline, index) => {
              var bgColor = "#27292d";
              if (index % 2 === 0) {
                bgColor = "#1f2023";
              }
  
              return (
                <ListItem key={index} style={{ backgroundColor: bgColor }}>
                  <ListItemText
                    style={{ maxWidth: 250, minWidth: 250, }}
                    primary={pipeline.name}
                  />
                  <ListItemText
                    style={{ maxWidth: 150, minWidth: 150 }}
                    primary={pipeline.environment}
                  />
                  <ListItemText
                    style={{ maxWidth: 150, minWidth: 150 }}
                    primary={pipeline.total_runs}
                  />
                  <ListItemText
                    style={{ maxWidth: 300, minWidth: 300}}
                    primary={pipeline.definition}
                  />
                  <ListItemText
                    style={{ marginleft: 30, }}
				  >
                    <Button
                      style={{}}
                      variant={
                        "outlined"
                      }
                      disabled={pipeline.status === "uninitialized"}
                      onClick={() => {
                          changePipelineState(pipeline, "stop")
                      }}
                    >
                    	Stop pipeline
                    </Button>
                  </ListItemText>
                </ListItem>
              );
            })}
          </List>
        )}
      </div>
    ) : null;

  const appCategoryView =
    curTab === 8 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Categories</h2>
          <span style={{ marginLeft: 25 }}>
            Categories are the categories supported by Shuffle, which are mapped
            to apps and workflows
          </span>
        </div>
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        <List>
          <ListItem>
            <ListItemText
              primary="Category"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="Apps"
              style={{ minWidth: 250, maxWidth: 250 }}
            />
            <ListItemText
              primary="Workflows"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="Authentication"
              style={{ minWidth: 150, maxWidth: 150, overflow: "hidden" }}
            />
            <ListItemText
              primary="Actions"
              style={{ minWidth: 150, maxWidth: 150, overflow: "hidden" }}
            />
          </ListItem>
          {categories.map((data, index) => {
            if (data.apps.length === 0) {
              return null;
            }

            return (
              <ListItem key={index}>
                <ListItemText
                  primary={data.name}
                  style={{ minWidth: 150, maxWidth: 150 }}
                />
                <ListItemText
                  primary={""}
                  style={{ minWidth: 250, maxWidth: 250 }}
                />
                <ListItemText
                  primary={""}
                  style={{ minWidth: 150, maxWidth: 150 }}
                />
                <ListItemText
                  primary={""}
                  style={{ minWidth: 150, maxWidth: 150, overflow: "hidden" }}
                />
                <ListItemText
                  style={{ minWidth: 150, maxWidth: 150, overflow: "hidden" }}
                >
                  <Button
                    style={{}}
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      console.log("Show apps with this category");
                    }}
                  >
                    Find app ({data.apps === null ? 0 : data.apps.length})
                  </Button>
                </ListItemText>
              </ListItem>
            );
          })}
        </List>
      </div>
    ) : null;

  const updateAppAuthentication = (field) => {
    setSelectedAuthenticationModalOpen(true);
    setSelectedAuthentication(field);
    //{selectedAuthentication.fields.map((data, index) => {
    var newfields = [];
    for (var key in field.fields) {
      newfields.push({
        key: field.fields[key].key,
        value: "",
      });
    }
    setAuthenticationFields(newfields);
  };


  const handleAppAuthGroupCheckbox = (data) => {
    //let groupApp = data.app.id
	var newappauth = appsForAppAuthGroup
	if (appsForAppAuthGroup.includes(data.app.id)) {
		newappauth = newappauth.filter((item) => item !== data.app.id)
	}

	if (appsForAppAuthGroup.includes(data.id)) {
		// Remove app from app auth group
		newappauth = newappauth.filter((item) => item !== data.id)
		setAppsForAppAuthGroup(newappauth)
		return
	}

	for (var i = 0; i < authentication.length; i++) {
		if (authentication[i].id === data.id) {
			continue
		}

		if (!appsForAppAuthGroup.includes(authentication[i].id)) {
			continue
		}

		if (authentication[i].app.id === data.app.id) {
			// Remove app from app auth group
			newappauth = newappauth.filter((item) => item !== authentication[i].id)
			toast(`App ${data.app.name} is already in this group`)
		}
	}

    setAppsForAppAuthGroup(newappauth.concat(data.id))
  }

  const KMSItem = (props) => {
	const { 
		data, 
		index,
	} = props

    const [showEnvironmentDropdown, setShowEnvironmentDropdown] = React.useState(false)

	var bgColor = "#27292d";
	if (index % 2 === 0) {
	  bgColor = "#1f2023";
	}

	const isDistributed =
	  data.suborg_distributed === true ? true : false;

	const isKms = data.label !== undefined && data.label !== null && data.label.toLowerCase() === "kms shuffle storage"

	var selectedEnvironment = ""
	if (data.environment !== undefined && data.environment !== null && data.environment.length > 0) {
		selectedEnvironment = data.environment
	}

	if (selectedEnvironment === "" && environments !== undefined && environments !== null && environments.length > 0) {
		for (var i = 0; i < environments.length; i++) {
			if (environments[i].default === true) {
				selectedEnvironment = environments[i].Name
				break
			}
		}
	}

	var validIcon = <CheckCircleIcon style={{ color: "green" }} />
	if (data.validation !== null && data.validation !== undefined && data.validation.valid === false) {

		if (data.validation.changed_at === 0) {
			// Warning
			validIcon = "" // <WarningIcon style={{ color: "" }} />
		} else {
	  		validIcon = <CancelIcon style={{ color: "red" }} />
		}
	}

	return (
	  <ListItem key={index} style={{ backgroundColor: bgColor }}>
		<ListItemText
			primary=
				<Tooltip title={data.validation !== null && data.validation !== undefined && data.validation.valid === true ? "Valid. Click to explore." : "Configuration failed. Click to learn why"} placement="top">
					<IconButton>
						{validIcon}
					</IconButton>
				</Tooltip>
		  	style={{ minWidth: 65, maxWidth: 65, }}
			onClick={() => {
				if (data.validation === null || data.validation === undefined) {
					return
				}

				if (data.validation.workflow_id === undefined || data.validation.workflow_id === null || data.validation.workflow_id.length === 0) {
					toast.warn("No workflow runs found for this auth yet. Check back later.")
					return
				}

				const url = `/workflows/${data.validation.workflow_id}?execution_id=${data.validation.execution_id}&node=${data.validation.node_id}`
				window.open(url, "_blank")
			}}
		/>
		<ListItemText
		  primary=<img
			alt=""
			src={data.app.large_image}
			style={{
			  maxWidth: 50,
			  borderRadius: theme.palette?.borderRadius,
			}}
		  />
		  style={{ minWidth: 75, maxWidth: 75 }}
		/>
		<ListItemText
		  primary={!isKms ? data.label : 
			<div style={{display: "flex", flexDirection: "column", maxWidth: 200, }}>
			  <Chip
				label={"KMS Shuffle Storage"}
				variant="contained"
				color="secondary"
				style={{cursor: "pointer"}}
				onClick={() => {
    				setShowEnvironmentDropdown(true)

					if (environments === undefined || environments === null || environments.length === 0) {
						toast.error("No environments found. Please try again in a second, or reload to configure environment to use for KMS")
					}
				}}
			  />
			  {showEnvironmentDropdown === true && environments !== undefined && environments !== null && environments.length > 0 ?
				  <FormControl fullWidth sx={{ m: 1 }}>
					<InputLabel id="envselect" style={{ padding: 5 }}>
				  		Environment
					</InputLabel>
					<Select
						labelId="envselect"
						defaultValue={selectedEnvironment}
						onChange={(e) => {
							if (e.target.value === "") {
								return
							}

							if (e.target.value === selectedEnvironment) {
								return
							}

							toast.info("Updating environment KMS runs on to " + e.target.value)
							data.environment = e.target.value
							const envIndex = environments.findIndex((env) => env.Name === e.target.value)
							if (envIndex === -1) {
								toast.error("Environment not found")
								return
							}

							environments[envIndex].environment = e.target.value
							setEnvironments(environments)
							setShowEnvironmentDropdown(false)
  
							saveAuthentication(data)
						}}
					  >
						{environments.map((env, index) => {
							if (env.archived === true) {
								return null
							}

							return (
								<MenuItem key={index} value={env.Name}>
									{env.default === true ? "Default - " : ""}{env.Name}
								</MenuItem>
							)
						})}
					</Select>
				  </FormControl>
			  : null}
			</div>
		  }
		  style={{
			minWidth: 225,
			maxWidth: 225,
			overflow: "hidden",
		  }}
		/>
		<ListItemText
		  primary={data.app.name.replaceAll("_", " ")}
		  style={{ minWidth: 175, maxWidth: 175, marginLeft: 10 }}
		/>
		{/*
		<ListItemText
		  primary={data.defined === false ? "No" : "Yes"}
		  style={{ minWidth: 100, maxWidth: 100, }}
		/>
							*/}
		<ListItemText
		  primary={
			data.workflow_count === null ? 0 : data.workflow_count
		  }
		  style={{
			minWidth: 100,
			maxWidth: 100,
			textAlign: "center",
			overflow: "hidden",
		  }}
		/>
		{/*
		<ListItemText
		  primary={data.node_count}
		  style={{
			minWidth: 110,
			maxWidth: 110,
									textAlign: "center",
			overflow: "hidden",
		  }}
		/>
							*/}
		<ListItemText
		  primary={
			data.fields === null || data.fields === undefined
			  ? ""
			  : data.fields
				  .map((data) => {
					return data.key;
				  })
				  .join(", ")
		  }
		  style={{
			minWidth: 140,
			maxWidth: 140,
			overflow: "auto",
			marginRight: 10,
		  }}
		/>
		<ListItemText
		  style={{
			maxWidth: 150,
			minWidth: 150,
			overflow: "auto",
		  }}
		  primary={new Date(data.edited * 1000).toISOString()}
		/>
		<ListItemText>
		  <IconButton
			onClick={() => {
			  updateAppAuthentication(data);
			}}
			disabled={
			  data.org_id !== selectedOrganization.id ? true : false
			}
		  >
			<EditIcon color="secondary" />
		  </IconButton>
		  {data.defined ? (
			<Tooltip
			  color="primary"
			  title="Set for EVERY instance of this App being used in this organization"
			  placement="top"
			>
			  <IconButton
				style={{ marginRight: 10 }}
				disabled={
				  data.defined === false ||
				  data.org_id !== selectedOrganization.id
					? true
					: false
				}
				onClick={() => {
				  editAuthenticationConfig(data.id);
				}}
			  >
				<SelectAllIcon color={"secondary"} />
			  </IconButton>
			</Tooltip>
		  ) : (
			<Tooltip
			  color="primary"
			  title="Must edit before you can set in all workflows"
			  placement="top"
			>
			  <IconButton
				style={{}}
				onClick={() => {}}
				disabled={
				  data.org_id !== selectedOrganization.id
					? true
					: false
				}
			  >
				<SelectAllIcon color="secondary" />
			  </IconButton>
			</Tooltip>
		  )}
		  <IconButton
			style={{ marginLeft: 0 }}
			disabled={
			  data.org_id !== selectedOrganization.id ? true : false
			}
			onClick={() => {
			  deleteAuthentication(data);
			}}
		  >
			<DeleteIcon color="secondary" />
		  </IconButton>
		</ListItemText>
		<ListItemText>
		  {selectedOrganization.id !== undefined &&
		  data.org_id !== selectedOrganization.id ? (
			<Tooltip
			  title="Parent organization controlled auth. You can use, but not modify this auth. Contact an admin of your parent organization if you need changes to this."
			  placement="top"
			>
			  <Chip
				label={"Parent"}
				variant="contained"
				color="secondary"
			  />
			</Tooltip>
		  ) : (
			<Tooltip
			  title="Distributed to sub-organizations. This means the sub organizations can use this authentication, but not modify it."
			  placement="top"
			>
			  <Checkbox
				disabled={
				  selectedOrganization.creator_org !== undefined &&
				  selectedOrganization.creator_org !== null &&
				  selectedOrganization.creator_org !== ""
					? true
					: false
				}
				checked={isDistributed}
				color="secondary"
				onClick={() => {
				  changeDistribution(data, !isDistributed);
				}}
			  />
			</Tooltip>
		  )}
		</ListItemText>
	  </ListItem>
	)
  }

  const authenticationView =
    curTab === 2 ? (

    <div>
      {/* (appAuthenticationGroupModalOpen : { */}
      {appAuthenticationGroupModalOpen && (
        <Dialog
          open={appAuthenticationGroupModalOpen}
          onClose={() => {
            setAppAuthenticationGroupModalOpen(false);

  			setAppAuthenticationGroupId("")
			setAppAuthenticationGroupName("")
			setAppAuthenticationGroupEnvironment("")
			setAppAuthenticationGroupDescription("")
			setAppsForAppAuthGroup([])
          }}
          PaperProps={{
            style: {
              backgroundColor: theme.palette.surfaceColor,
              color: "white",
              minWidth: "1000px",
              minHeight: "320px",
			  padding: 25, 
			  paddingLeft: 50, 
            },
          }}
        >
          <DialogTitle>
            <span style={{ color: "white" }}>App Authentication Groups</span>
          </DialogTitle>

          <DialogContent style={{marginLeft: 0, paddingLeft: 0, }}>
            <div style={{display: "flex", position: "sticky", top: 0, zIndex: 1, backgroundColor: theme.palette.surfaceColor, borderRadius: theme.palette?.borderRadius, padding: 20, marginBottom: 10, }}>
		  		<div style={{marginRight: 50, minWidth: 250, }}>
				  <Typography style={{marginTop: 10, }}>
		  			Name
				  </Typography>
				  <TextField
					color="primary"
					label="Name"
					style={{ backgroundColor: theme.palette.inputColor }}
					autoFocus
					InputProps={{
					  style: {
						height: "50px",
						color: "white",
						fontSize: "1em",
					  },
					}}
					required
					fullWidth={true}
					placeholder="Name"
					id="namefield"
					margin="normal"
					variant="outlined"
		  			defaultValue={appAuthenticationGroupName}
					onChange={(event) => {
					  setAppAuthenticationGroupName(event.target.value);
					}}
				  />
			  </div>
		  	  <div style={{marginRight: 50, }}>
		  	  <Typography style={{marginTop: 10, marginBottom: 10}}>
		  		Evironment
		  	  </Typography>
		  	  {environments !== undefined && environments !== null && environments.length > 0 ?
				  <Select
					defaultValue={appAuthenticationGroupEnvironment === "" ? environments[0].Name : appAuthenticationGroupEnvironment}
					onChange={(e) => {
					  setAppAuthenticationGroupEnvironment(e.target.value);
					}}
				  >
					{environments.map((env, index) => {
						return (
							<MenuItem key={index} value={env.Name}>
								{env.Name}
							</MenuItem>
						)
					})}
				  </Select>
			  : 
				<Typography>
				  	Locations failed to load. Please try again 
				</Typography>
			  }
            </div>
            <div style={{marginTop: 65, }}>
              <Button
                style={{}}
		  		disabled={appAuthenticationGroupName === "" || appAuthenticationGroupEnvironment === "" || appsForAppAuthGroup.length === 0}
                variant="contained"
                color="primary"
                onClick={() => {
                  createAppAuthenticationGroup(
                    appAuthenticationGroupName,
                    appAuthenticationGroupEnvironment,
                    appAuthenticationGroupDescription,
                    appsForAppAuthGroup,
                  );
                }}
              >
                Set Group
              </Button>
            </div>
            </div>

		  	<Divider style={{marginTop: 10, marginBottom: 10, }}/>

            <div style={{marginLeft: 25, }}>
              {/* Show a check box list of all app authentications to add to the auth group */}
              <div>
              {authentication.map((data, index) => {
				var checked = data.checked
				if (data.label !== undefined && data.label !== null && data.label.toLowerCase() === "kms shuffle storage") {
					return null
				}

				if (checked === undefined || checked === null) {
					checked = false
				}

				if (appsForAppAuthGroup.includes(data.id)) { 
					checked = true
				}

				return (
					<div key={index}>
					  <FormControlLabel
						control={
							<Tooltip
							  title={data.app.name}
							  placement="left"
							>
							  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', marginLeft: '5px', }}>
								  <img 
									src={data.app.large_image ? data.app.large_image : '/images/no_image.png'}
									alt=""
									style={{ borderRadius: theme.palette?.borderRadius, width: 50, height: 50, marginRight: 10 }} 
								  />
								  <Checkbox
									checked={checked}
									onChange={(event) => {
									  handleAppAuthGroupCheckbox(data)
									}}
									name={data.label}
									disabled={data.app.id in appsForAppAuthGroup}
								  />
							  </div>
							</Tooltip>
						}
					    label={data.label}
					  />
					</div>
              	)
			  })}
            </div>
        </div>


          </DialogContent>
        </Dialog>
      )}


      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>App Authentication</h2>
          <span style={{ marginLeft: 25 }}>
            Control the authentication options for individual apps. App Groups are farther down on this page.
          </span>
          &nbsp;
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="/docs/organizations#app_authentication"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            Learn more about App Authentication
          </a>
        </div>
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        <List>
          <ListItem>
            <ListItemText
              primary="Valid"
              style={{ minWidth: 65, maxWidth: 65 }}
            />
            <ListItemText
              primary="Icon"
              style={{ minWidth: 75, maxWidth: 75 }}
            />
            <ListItemText
              primary="Label"
              style={{ minWidth: 225, maxWidth: 225 }}
            />
            <ListItemText
              primary="App Name"
              style={{ minWidth: 175, maxWidth: 175, marginLeft: 10 }}
            />
            {/*<ListItemText
              primary="Ready"
              style={{ minWidth: 100, maxWidth: 100 }}
            />*/}
            <ListItemText
              primary="Workflows"
              style={{ minWidth: 100, maxWidth: 100, overflow: "hidden" }}
            />
            {/*
            <ListItemText
              primary="App Usage"
              style={{ minWidth: 100, maxWidth: 100, overflow: "hidden" }}
            />
						*/}
            <ListItemText
              primary="Fields"
              style={{ minWidth: 140, maxWidth: 140, overflow: "hidden" }}
            />
            <ListItemText
              primary="Edited"
              style={{ minWidth: 150, maxWidth: 150, overflow: "hidden" }}
            />
            <ListItemText
              primary="Actions"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText primary="Distribution" />
          </ListItem>
          {authentication === undefined || authentication === null
            ? null
            : authentication.map((data, index) => {
                //console.log("Auth data: ", data)
                if (data.type === "oauth2") {
                  data.fields = [
                    {
                      key: "url",
                      value: "Secret. Replaced during app execution!",
                    },
                    {
                      key: "client_id",
                      value: "Secret. Replaced during app execution!",
                    },
                    {
                      key: "client_secret",
                      value: "Secret. Replaced during app execution!",
                    },
                    {
                      key: "scope",
                      value: "Secret. Replaced during app execution!",
                    },
                  ];
                }

                return (
				  <KMSItem
					data={data}
					index={index}
				  />
				)

				
              })}
        </List>
      </div>

	  <Divider
		style={{
		  marginTop: 20,
		  marginBottom: 20,
		  backgroundColor: theme.palette.inputColor,
		}}
	  />

      <div style={{marginTop: 50, }}>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ }}>App Authentication Groups</h2>
          <span style={{ marginLeft: 0 }}>
            Groups of authentication options for subflows.{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/docs/organizations#app_authentication_groups"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
                Learn more about App Authentication Groups  
            </a>
          </span>

		  <br />
          <Button
            style={{ marginTop: 20 }}
            variant="contained"
            color="primary"
            onClick={() => {

			  if (environments !== undefined && environments !== null && environments.length > 0) {
				  setAppAuthenticationGroupEnvironment(environments[0].Name)
			  }

              setAppAuthenticationGroupModalOpen(true)
            }}
          >
            Add Group
          </Button>

          <List style={{marginTop: 25, }}>
            <ListItem>
              <ListItemText
                primary="Label"
                style={{ minWidth: 250, maxWidth: 250}}
              />
              <ListItemText
                primary="Environment"
                style={{ minWidth: 150, maxWidth: 150 }}
              />
              <ListItemText
                primary="App Auth"
                style={{ minWidth: 250, maxWidth: 250 }}
              />
              <ListItemText
                primary="Created At"
                style={{ minWidth: 150, maxWidth: 150 }}
              />
              <ListItemText 
                primary="Actions"
                style={{ minWidth: 150, maxWidth: 150 }}
              />
            </ListItem>

            {appAuthenticationGroups.map((data, index) => {
              var bgColor = "#27292d";
              if (index % 2 === 0) {
                bgColor = "#1f2023";
              }

			  if (data.app_auths === undefined || data.app_auths === null) {
				  data.app_auths = []
			  }

              return (
                <ListItem key={index} style={{ backgroundColor: bgColor }}>
                  <ListItemText
                    primary={data.label}
                    style={{ minWidth: 250, maxWidth: 250, }}
                  />
                  <ListItemText
                    primary={data.environment}
                    style={{ minWidth: 150, maxWidth: 150, }}
                  />
                  <ListItemText
                    primary={
                      <div style={{ display: 'flex' }}>
                        {data.app_auths.map((appAuth, index) => {
							if (appAuth.app.large_image === undefined || appAuth.app.large_image === null || appAuth.app.large_image === "") {
								const foundImage = authentication.find((auth) => auth.app.id === appAuth.app.id)
								if (foundImage !== undefined) {
									appAuth.app.large_image = foundImage.app.large_image

									appAuth.app.name = foundImage.app.name
								}
							}

							const tooltip = `${appAuth.app.name.replaceAll("_", " ")} (authname: ${appAuth.label})`

							return (
							  <Tooltip
								title={tooltip}
							  >
								<img
								  key={index}
								  src={appAuth.app.large_image}
								  alt={appAuth.app.name}
								  style={{ width: 30, height: 30, marginRight: 5 }}
								/>
							  </Tooltip>
                        	)
						})}
                      </div>
                    }
                    style={{ minWidth: 250, maxWidth: 250 }}
                  />
                  <ListItemText
                    primary={new Date(data.created * 1000).toLocaleDateString('en-GB')}
                    style={{ minWidth: 150, maxWidth: 150 }}
                  />
                  <ListItemText
                    primary={
                      <div style={{ display: 'flex' }}>
                        <IconButton
                          onClick={() => {
							  setAppAuthenticationGroupId(data.id)

							  setAppAuthenticationGroupName(data.label)
							  setAppAuthenticationGroupDescription(data.description)

							  setAppsForAppAuthGroup(data.app_auths.map((appAuth) => appAuth.id))
				  			  setAppAuthenticationGroupEnvironment(data.environment)
              				  setAppAuthenticationGroupModalOpen(true)
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
  							deleteAppAuthenticationGroup(data.id) 
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    }
                    style={{ minWidth: 150, maxWidth: 150 }}
                  />

                </ListItem>
              );
            }
          )}
          </List>

        
        </div>
      </div> 
    </div>
    ) : null;

  const getLogs = (ip, userId) => {
    setLogsLoading(true);
    console.log("logs loading: ", logsLoading);
    fetch(`${globalUrl}/api/v1/users/${userId}/audit?user_ip=${ip}`, {
      mode: "cors",
      method: "GET",
      credentials: "include",
      crossDomain: true,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        console.log("ResponseJSON: ", responseJson);
        if (responseJson.success === true) {
          setLogs(responseJson.logs);
        } else {
          if (
            responseJson.success === false ||
            responseJson.reason !== undefined
          ) {
            console.log("Reason given: ", responseJson.reason);
            toast("Failed getting logs: " + responseJson.reason);
            setLogs([]);
          } else {
            toast("Failed getting logs");
          }
        }
        console.log("logs loading now: ", logsLoading);
        setLogsLoading(false);
      })
      .catch((error) => {
        console.log("Error: ", error);
        toast("Failed getting logs. Please contact: ", error);
        console.log("logs loading now: ", logsLoading);
        setLogsLoading(false);
      });
  };

  const changeRecommendation = (recommendation, action) => {
    const data = {
      action: action,
      name: recommendation.name,
    };

    fetch(`${globalUrl}/api/v1/recommendations/modify`, {
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
      .then((response) => {
        if (response.status === 200) {
        } else {
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          if (checkLogin !== undefined) {
            checkLogin();
            getEnvironments();
          }
        } else {
          if (
            responseJson.success === false &&
            responseJson.reason !== undefined
          ) {
            toast("Failed change recommendation: ", responseJson.reason);
          } else {
            toast("Failed change recommendation");
          }
        }
      })
      .catch((error) => {
        toast(
          "Failed dismissing alert. Please contact support@shuffler.io if this persists.",
        );
      });
  };


  const getOrborusCommand = (environment) => {
	if (environment.Type === "cloud") {
	  //toast("No Orborus necessary for environment cloud. Create and use a different environment to run executions on-premises.",)
	  return
	}

	if (
	  props.userdata.active_org === undefined ||
	  props.userdata.active_org === null
	) {
	  toast(
		"No active organization yet. Are you logged in?",
	  );
	  return;
	}

	const elementName = "copy_element_shuffle";
	const auth =
	  environment.auth === ""
		? "cb5st3d3Z!3X3zaJ*Pc"
		: environment.auth;
	const newUrl =
	  globalUrl === "https://shuffler.io"
		? "https://shuffle-backend-stbuwivzoq-nw.a.run.app"
		: globalUrl;

    var skipPipeline = false
    if (commandController.pipelines === true) {
        skipPipeline = true
    }

	var addProxy = false
    if (commandController.proxies === true) {
		addProxy = true
    }

	if (installationTab === 1) {
		return (`docker run -d \\
	--restart=always \\
	--name="shuffle-orborus" \\
	--pull=always \\
	--volume "/var/run/docker.sock:/var/run/docker.sock" \\
	-e AUTH="d85b017c-7f47-4d3a-bb20-9b00731bc397" \\
	-e ENVIRONMENT_NAME="swarm testing" \\
	-e ORG="9c4e7cd9-cfa4-457b-9ee5-3a9faa6e8c3c" \\
	-e SHUFFLE_WORKER_IMAGE="ghcr.io/shuffle/shuffle-worker:nightly" \\
	-e SHUFFLE_SWARM_CONFIG=run \\
	-e SHUFFLE_LOGS_DISABLED=true \\
	-e BASE_URL="${newUrl}" \\${addProxy ? "\n        -e HTTPS_PROXY=IP:PORT \\" : ""}${skipPipeline ? "\n        -e SHUFFLE_SKIP_PIPELINES=true \\" : ""}
	ghcr.io/shuffle/shuffle-orborus:latest
		`)
	} else if (installationTab === 2) {
		return `https://shuffler.io/docs/configuration#kubernetes`
	}

	const commandData = `docker rm shuffle-orborus --force; \\\ndocker run -d \\
	--restart=always \\
	--name="shuffle-orborus" \\
	--pull=always  \\
	--volume "/var/run/docker.sock:/var/run/docker.sock" \\
	-e AUTH="${auth}" \\
	-e ENVIRONMENT_NAME="${environment.Name}" \\
	-e ORG="${props.userdata.active_org.id}" \\
	-e BASE_URL="${newUrl}" \\${addProxy ? "\n        -e HTTPS_PROXY=IP:PORT \\" : ""}${skipPipeline ? "\n        -e SHUFFLE_SKIP_PIPELINES=true \\" : ""}
	ghcr.io/shuffle/shuffle-orborus:latest`

	return commandData


	var copyText =
	  document.getElementById(elementName);
	if (
	  copyText !== null &&
	  copyText !== undefined
	) {
	  const clipboard = navigator.clipboard;
	  if (clipboard === undefined) {
		toast(
		  "Can only copy over HTTPS (port 3443)",
		);
		return;
	  }

	  navigator.clipboard.writeText(commandData);
	  copyText.select();
	  copyText.setSelectionRange(
		0,
		99999,
	  ); /* For mobile devices */

	  /* Copy the text inside the text field */
	  document.execCommand("copy");

	  toast("Orborus command copied to clipboard");
	}
  }

const environmentView =
curTab === 6 ? (
  <div>
	<div style={{ marginTop: 20, marginBottom: 20 }}>
	  <h2 style={{ display: "inline" }}>Locations</h2>
	  <span style={{ marginLeft: 25 }}>
		Decides where to run your workflows and actions. Uses Shuffle's Orborus runner to handle queued jobs. Previously "Environments".

		If you have scale problems, talk to our team: support@shuffler.io.&nbsp;
		<a
		  target="_blank"
		  rel="noopener noreferrer"
		  href="/docs/organizations#environments"
		  style={{ textDecoration: "none", color: "#f85a3e" }}
		>
		  Learn more
		</a>
	  </span>
	</div>
	<Button
	  style={{}}
	  variant="contained"
	  color="primary"
	  onClick={() => setModalOpen(true)}
	>
	  Add location 
	</Button>
	<Button
	  style={{ marginLeft: 5, marginRight: 15 }}
	  variant="contained"
	  color="primary"
	  onClick={() => getEnvironments()}
	>
	  <CachedIcon />
	</Button>
	<Switch
	  checked={showArchived}
	  onChange={() => {
		setShowArchived(!showArchived);
	  }}
	/>{" "}
	Show disabled
	<Divider
	  style={{
		marginTop: 20,
		marginBottom: 20,
		backgroundColor: theme.palette.inputColor,
	  }}
	/>
	<List>
	  <ListItem style={{ paddingLeft: 10 }}>
		<ListItemText
		  primary="Type"
		  style={{ minWidth: 50, maxWidth: 50 }}
		/>
		<ListItemText
		  primary="Scale"
		  style={{ minWidth: 60, maxWidth: 60}}
		/>
		<ListItemText
		  primary="Lake"
		  style={{ minWidth: 60, maxWidth: 60 }}
		/>
		<ListItemText
		  primary="Name"
		  style={{ minWidth: 200, maxWidth: 200}}
		/>
		<ListItemText
		  primary="Status"
		  style={{ minWidth: 150, maxWidth: 150, marginRight: 10, }}
		/>
		<ListItemText
		  primary="Type"
		  style={{ minWidth: 100, maxWidth: 100 }}
		/>
		<ListItemText
		  primary={"Queue"}
		  style={{ minWidth: 80, maxWidth: 80}}
		/>
		<ListItemText
		  primary="Actions"
		  style={{ minWidth: 200, maxWidth: 200 }}
		/>
	  </ListItem>
	  {environments === undefined || environments === null
		? null
		: environments.map((environment, index) => {
			if (!showArchived && environment.archived) {
			  return null;
			}

			if (environment.archived === undefined) {
			  return null;
			}

			var bgColor = "#27292d";
			if (index % 2 === 0) {
			  bgColor = "#1f2023";
			}

			// Check if there's a notification for it in userdata.priorities
			var showCPUAlert = false;
			var foundIndex = -1;
			if (
			  userdata !== undefined &&
			  userdata !== null &&
			  userdata.priorities !== undefined &&
			  userdata.priorities !== null &&
			  userdata.priorities.length > 0
			) {
			  foundIndex = userdata.priorities.findIndex(
				(prio) => prio.name.includes("CPU") && prio.active === true,
			  );

			  if (
				foundIndex >= 0 &&
				userdata.priorities[foundIndex].name.endsWith(
				  environment.Name,
				)
			  ) {
				showCPUAlert = true;
			  }
			}

			const queueSize =
			  environment.queue !== undefined && environment.queue !== null
				? environment.queue < 0
				  ? 0
				  : environment.queue > 1000
					? ">1000"
					: environment.queue
				: 0;


			const orborusCommandWrapper = () => {
				// Check the current text 
				const orborusCommand = document.getElementById("orborus_command")
				if (orborusCommand === undefined || orborusCommand === null) {
					return getOrborusCommand(environment)
				}

				return orborusCommand.textContent
			}

			return (
			  <span key={index}>
				<ListItem
				  key={index}
				  style={{ cursor: "pointer", backgroundColor: bgColor, marginLeft: 0 }}
				  onClick={() => {
					if (environment.Type === "cloud") {
						toast("Cloud environments are not configurable. To see what is possible, create a new environment.")
						return
					}

					setListItemExpanded(listItemExpanded === index ? -1 : index)
				  }}
				>
				  <ListItemText
					primary={
					  environment.run_type === "cloud" ||
					  environment.name === "Cloud" ? (
						<Tooltip title="Cloud" placement="top">
						  <CloudIcon
							style={{ color: "rgba(255,255,255,0.8)" }}
						  />
						</Tooltip>
					  ) : environment.run_type === "docker" ? (
						<Tooltip title="Docker" placement="top">
						  <img
							src="/icons/docker.svg"
							style={{ width: 30, height: 30 }}
						  />
						</Tooltip>
					  ) : environment.run_type === "k8s" ? (
						<Tooltip title="Kubernetes" placement="top">
						  <img
							src="/icons/k8s.svg"
							style={{ width: 30, height: 30 }}
						  />
						</Tooltip>
					  ) : (
						<Tooltip title="Unknown" placement="top">
						  <HelpIcon
							style={{ color: "rgba(255,255,255,0.8)" }}
						  />
						</Tooltip>
					  )
					}
					style={{
					  minWidth: 50,
					  maxWidth: 50,
					  overflow: "hidden",
					}}
				  />
				  <ListItemText
					primary={
					  environment.licensed ? (
						<Tooltip title="Scale configured (auto on cloud)" placement="top">
                              <CheckCircleIcon style={{ color: "#4caf50" }} />
                            </Tooltip>
                          ) : (
                            <Tooltip
                              title="In Verbose mode. Set SHUFFLE_SWARM_CONFIG=run to Scale. This will not be as verbose. Details: https://shuffler.io/docs/configuration#scaling-shuffle"
                              placement="top"
                            >
                              <a
                                href="/docs/configuration#scaling-shuffle"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <CancelIcon style={{ color: "#f85a3e" }} />
                              </a>
                            </Tooltip>
                          )
                        }
                        style={{
                          minWidth: 60,
                          maxWidth: 60,
                          overflow: "hidden",
                        }}
                      />
					  <ListItemText
                        primary={
						  environment.Type === "cloud" ? 

                            <Tooltip title={"Make a new environment to set up a Datalake node. Please contact support@shuffler.io if this is something you want to see on Cloud directly."} placement="top">
                              <CancelIcon style={{ color: "rgba(255,255,255,0.3)" }} />
                            </Tooltip>
						  :
                          environment?.data_lake?.enabled ? (
                              <a
                                href="/detections/Sigma"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
								<Tooltip title={"Data Lake node enabled. Check /detections/Sigma to learn more"} placement="top">
								  <CheckCircleIcon style={{ color: "#4caf50" }} />
								</Tooltip>
							  </a>
                          ) : (
                            <Tooltip
                              title="Data Lake node disabled. Click to enable."
                              placement="top"
							  onClick={(e) => {
								  e.preventDefault()
								  e.stopPropagation()

								  window.open("/detections/Sigma", "_blank")
							  }}
                            >
                              <a
                                href="/detections/Sigma"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <CancelIcon style={{ color: "#f85a3e" }} />
                              </a>
                            </Tooltip>
                          )
                        }
                        style={{
                          minWidth: 60,
                          maxWidth: 60,
                          overflow: "hidden",
                        }}
                      />
                      <ListItemText
                        primary={environment.Name}
                        style={{
                          minWidth: 200,
                          maxWidth: 200,
                          overflow: "hidden",
                        }}
                      />
                      <ListItemText
                        primary={
                          environment.Type !== "cloud" ? (
                            environment.running_ip === undefined ||
                            environment.running_ip === null ||
                            environment.running_ip.length === 0 ? (
                              <div>Not running</div>
                            ) : (
                              environment.running_ip.split(":")[0]
                            )
                          ) : (
                            "N/A"
                          )
                        }
                        style={{
                          minWidth: 150,
                          maxWidth: 150,
						  marginRight: 10, 
                          overflow: "hidden",
                        }}
                      />

                      <ListItemText
                        primary={environment.Type}
                        style={{ minWidth: 100, maxWidth: 100 }}
                      />
                      <ListItemText
                        style={{
                          minWidth: 60,
                          maxWidth: 60,
                          overflow: "hidden",
                          marginLeft: 0,
                        }}
                        primary={queueSize}
                      />
                      <ListItemText
                        style={{
                          minWidth: 330,
                          maxWidth: 330,
                          overflow: "hidden",
                          marginLeft: 10,
                        }}
                      >
                        <div style={{ display: "flex" }}>
                          <ButtonGroup
                            style={{ borderRadius: "5px 5px 5px 5px" }}
                          >
							  <Button
								variant="outlined"
								disabled={environment.default}
								style={{
								  marginLeft: 0,
								  marginRight: 0,
								  maxWidth: 150,
								}}
								onClick={() => setDefaultEnvironment(environment)}
								color="primary"
							  >
								Make Default
							  </Button>
                            <Button
                              variant={
                                environment.archived ? "contained" : "outlined"
                              }
                              style={{}}
                              onClick={() => deleteEnvironment(environment)}
                              color="primary"
                            >
                              {environment.archived ? "Activate" : "Disable"}
                            </Button>
                            <Button
                              variant={"outlined"}
                              style={{}}
                              onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()

                                console.log(
                                  "Should clear executions for: ",
                                  environment,
                                );

                                if (
                                  isCloud &&
                                  environment.Name.toLowerCase() === "cloud"
                                ) {
                                  rerunCloudWorkflows(environment);
                                } else {
                                  abortEnvironmentWorkflows(environment);
                                }
                              }}
                              color="primary"
                            >
                              {isCloud &&
                              environment.Name.toLowerCase() === "cloud"
                                ? "Rerun"
                                : "Clear"}
                            </Button>
                          </ButtonGroup>
                        </div>

                      </ListItemText>
						<IconButton
							disabled={environment.Type === "cloud"}
						>
							{listItemExpanded === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</IconButton>
                    </ListItem>
					  {listItemExpanded === index ? (
						  <div style={{minHeight: 250, width: "100%", backgroundColor: bgColor, }}>
						  	<div style={{width: 775, margin: "auto", paddingTop: 50, paddingBottom: 100, }}>
						  		<Typography variant="h6">
						  			Your Onprem Orborus instance
						  		</Typography>
						  		<Typography variant="body2" color="textSecondary">
						  			Orborus is the Shuffle queue handler that runs your hybrid workflows and manages pipelines. It can be run in Docker/k8s container on your server or in your cluster. Follow the steps below, and configure as need be.
						  		</Typography>

								<Tabs
								  value={installationTab}
								  indicatorColor="primary"
								  textColor="secondary"
								  onChange={(e, inputValue) => {
									  setInstallationTab(inputValue)
								  }}
								  aria-label="disabled tabs example"
								  variant="scrollable"
								  scrollButtons="auto"
						  		  style={{textAlign: "center", marginTop: 25, }}
								>
								  <Tab
						  			value={0}
									label=<span>
									  <img
										src="/icons/docker.svg"
										style={{ width: 20, height: 20, marginRight: 10, }}
									  /> Verbose (default)
									</span>
								  />
								  <Tab
						  			value={1}
									label=<span>
									  <img
										src="/icons/docker.svg"
										style={{ width: 20, height: 20, marginRight: 10, }}
									  /> Scale
									</span>
								  />
								  <Tab
						  			value={2}
									label=<span>
									  <img
										src="/icons/k8s.svg"
										style={{ width: 20, height: 20, marginRight: 10, }}
									  /> k8s 
									</span>
								  />
						  		</Tabs>
						  		<Typography variant="body1" color="textSecondary" style={{marginTop: 15, }}>
						  			{installationTab === 2 ?
										<span>
						  					Check our <a href="https://docs.docker.com/get-started/get-docker/" target="_blank" rel="noopener noreferrer" style={{textDecoration: "none", color: "#f85a3e",}}>Kubernetes documentation</a> for more information on how to run Shuffle on Kubernetes. The status of the node will change when connected.
										</span>
										:
										<span>
						  					1. <a href="https://docs.docker.com/get-started/get-docker/" target="_blank" rel="noopener noreferrer" style={{textDecoration: "none", color: "#f85a3e",}}>Ensure Docker is installed</a> and the target server can reach '{globalUrl}'
										</span>
									}

						  		</Typography>
						  		<Typography variant="body1" color="textSecondary">
						  			{installationTab === 2 ? null : 
						  			"2. Run this command on the server you want to run workflows or store Pipeline data on"}
						  		</Typography>

						  		{installationTab === 2 ? null : 
									<div
										style={{
											marginTop: 10, 
											padding: 15,
											minWidth: "50%",
											maxWidth: "100%",
											backgroundColor: theme.palette.inputColor,
											overflowY: "auto",
											// Have it inline
											borderRadius: theme.palette?.borderRadius,
										}}
									>
										<div style={{ display: "flex", position: "relative", }}>
											<code
												contenteditable="true"
												id="orborus_command"
												style={{
													// Wrap if larger than X
													whiteSpace: "pre-wrap",
													overflow: "auto",
													marginRight: 30,
												}}
											>
												{getOrborusCommand(environment)}
											</code>
											<CopyToClipboard
												text={orborusCommandWrapper()}
											/>
										</div>

										<Divider style={{marginTop: 25, marginBottom: 10, }}/>
										Configure HTTP Proxies: <Checkbox 
											id="shuffle_skip_proxies"
											onClick={() => {
												if (commandController.proxies === undefined) { 
													commandController.proxies = true 
												} else {
													commandController.proxies = !commandController.proxies
												}

												setCommandController(commandController)
              									setUpdate(Math.random())
											}}
										/>
										<div />
										Disable Pipelines & Data Lake: <Checkbox 
											id="shuffle_skip_pipelines"
											onClick={() => {
												if (commandController.pipelines === undefined) { 
													commandController.pipelines = true 
												} else {
													commandController.pipelines = !commandController.pipelines
												}
												setCommandController(commandController)
              									setUpdate(Math.random())
											}}
										/>
						  			</div>
								}

						  		<Typography variant="body1" color="textSecondary" style={{marginTop: 15, }}>
						  			{installationTab === 2 ? null : 
										<span>
						  					3. Verify if the node is running. Try to refresh the page a little while after running the command.
										</span>
					  				}
						  		</Typography>
						    </div>
						  </div>
					  ) : null}

                    {showCPUAlert === false ? null : (
                      <ListItem
                        key={index + "_cpu"}
                        style={{ backgroundColor: bgColor }}
                      >
                        <div
                          style={{
                            border: "1px solid #f85a3e",
                            borderRadius: theme.palette?.borderRadius,
                            marginTop: 10,
                            marginBottom: 10,
                            padding: 15,
                            textAlign: "center",
                            height: 70,
                            textAlign: "left",
                            backgroundColor: theme.palette.surfaceColor,
                            display: "flex",
                          }}
                        >
                          <div style={{ flex: 2, overflow: "hidden" }}>
                            <Typography variant="body1">
                              90% CPU the server(s) hosting the Shuffle App
                              Runner (Orborus) was found.
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Need help with High Availability and Scale?{" "}
                              <a
                                href="/docs/configuration#scale"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  textDecoration: "none",
                                  color: "#f85a3e",
                                }}
                              >
                                Read documentation
                              </a>{" "}
                              and{" "}
                              <a
                                href="https://shuffler.io/contact"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  textDecoration: "none",
                                  color: "#f85a3e",
                                }}
                              >
                                Get in touch
                              </a>
                              .
                            </Typography>
                          </div>
                          <div
                            style={{ flex: 1, display: "flex", marginLeft: 30 }}
                          >
                            <Button
                              style={{
                                borderRadius: 25,
                                width: 200,
                                height: 50,
                                marginTop: 8,
                              }}
                              variant="outlined"
                              color="secondary"
                              onClick={() => {
                                // dismiss -> get envs
                                changeRecommendation(
                                  userdata.priorities[foundIndex],
                                  "dismiss",
                                );
                              }}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </ListItem>
                    )}
                  </span>
                );
              })}
        </List>
        {/*<EnvironmentStats />*/}
      </div>
    ) : null;

  const imagesize = 40;
  const imageStyle = {
    width: imagesize,
    height: imagesize,
    pointerEvents: "none",
  };

  const organizationsTab =
    curTab === 7 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Organizations</h2>
          <span style={{ marginLeft: 25 }}>
            Control sub organizations (tenants)!{" "}
            {isCloud
              ? "You can only make a sub organization if you are a customer of shuffle or running a POC of the platform. Please contact support@shuffler.io to try it out."
              : ""}
            .{" "}
            <a
              href="/docs/organizations"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                color: theme.palette.primary.main,
              }}
            >
              Learn more
            </a>
          </span>
        </div>
        <Button
          style={{}}
          variant="contained"
          color="primary"
          disabled={userdata.admin !== "true"}
          onClick={() => {
            setModalOpen(true);
          }}
        >
          Add suborganization
        </Button>

        {parentOrg ? (
          <span>
            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />

            <div
              style={{
                textAlign: "center",
                width: "100%",
                padding: "10px",
                marginTop: 20,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                }}
              >
                {" "}
                Your Parent Organization
              </h3>
            </div>
            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />
            {(() => {
              const image =
                parentOrg.image === "" ? (
                  <img
                    alt={parentOrg.name}
                    src={theme.palette.defaultImage}
                    style={imageStyle}
                  />
                ) : (
                  <img
                    alt={parentOrg.name}
                    src={parentOrg.image}
                    style={imageStyle}
                  />
                );
              const bgColor = "#27292d";

              return (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Logo"
                      style={{ minWidth: 100, maxWidth: 100 }}
                    />
                    <ListItemText
                      primary="Name"
                      style={{ minWidth: 350, maxWidth: 350 }}
                    />
                    <ListItemText
                      primary="id"
                      style={{ minWidth: 400, maxWidth: 400 }}
                    />
                  </ListItem>
                  <ListItem style={{ backgroundColor: bgColor }}>
                    <ListItemText
                      primary={image}
                      style={{ minWidth: 100, maxWidth: 100 }}
                    />
                    <ListItemText
                      primary={parentOrg.name}
                      style={{ minWidth: 350, maxWidth: 350 }}
                    />
                    <ListItemText
                      primary={parentOrg.id}
                      style={{ minWidth: 400, maxWidth: 400 }}
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      disabled={parentOrg.id === selectedOrganization.id}
                      onClick={() => {
                        handleClickChangeOrg(parentOrg.id);
                      }}
                    >
                      Switch to Parent
                    </Button>
                  </ListItem>
                </List>
              );
            })()}
          </span>
        ) : null}

        {subOrgs.length > 0 ? (
          <span>
            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />
            <div
              style={{
                textAlign: "center",
                width: "100%",
                padding: "10px",
                marginTop: 20,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                }}
              >
                Sub Organizations of the Current Organization ({subOrgs.length})
              </h3>
            </div>

            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />

            <List>
              <ListItem>
                <ListItemText
                  primary="Logo"
                  style={{ minWidth: 100, maxWidth: 100 }}
                />
                <ListItemText
                  primary="Name"
                  style={{ minWidth: 350, maxWidth: 350 }}
                />
                <ListItemText
                  primary="id"
                  style={{ minWidth: 400, maxWidth: 400 }}
                />
              </ListItem>
              <span>
                {subOrgs.map((data, index) => {
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

                  var bgColor = "#27292d";
                  if (index % 2 === 0) {
                    bgColor = "#1f2023";
                  }

                  return (
                    <ListItem key={index} style={{ backgroundColor: bgColor }}>
                      <ListItemText
                        primary={image}
                        style={{ minWidth: 100, maxWidth: 100 }}
                      />
                      <ListItemText
                        primary={data.name}
                        style={{ minWidth: 350, maxWidth: 350 }}
                      />
                      <ListItemText
                        primary={data.id}
                        style={{ minWidth: 400, maxWidth: 400 }}
                      />

                      <Button
                        variant="outlined"
                        color="primary"
                        disabled={data.id === selectedOrganization.id}
                        onClick={() => {
                          handleClickChangeOrg(data.id);
                        }}
                      >
                        Change Active Org
                      </Button>
                    </ListItem>
                  );
                })}
              </span>
            </List>
          </span>
        ) : null}

        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />

        <div
          style={{
            textAlign: "center",
            width: "100%",
            padding: "10px",
            marginTop: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            All Your Organizations 
          </h3>
        </div>

        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        <List>
          <ListItem>
            <ListItemText
              primary="Logo"
              style={{ minWidth: 100, maxWidth: 100 }}
            />
            <ListItemText
              primary="Name"
              style={{ minWidth: 350, maxWidth: 350 }}
            />
            <ListItemText
              primary="id"
              style={{ minWidth: 400, maxWidth: 400 }}
            />
            <ListItemText
              primary="action"
              style={{ minWidth: 200, maxWidth: 200 }}
            />
          </ListItem>
          {userdata.orgs !== undefined &&
          userdata.orgs !== null &&
          userdata.orgs.length > 0 ? (
            <span>
              {userdata.orgs.map((data, index) => {
                const isSelected =
                  props.userdata.active_org.id === undefined
                    ? "False"
                    : props.userdata.active_org.id === data.id
                      ? "True"
                      : "False";

                const image =
                  data.image === "" ? (
                    <img
                      alt={data.name}
                      src={theme.palette.defaultImage}
                      style={imageStyle}
                    />
                  ) : (
                    <img alt={data.name} src={data.image} style={imageStyle} />
                  );

                var bgColor = "#27292d";
                if (index % 2 === 0) {
                  bgColor = "#1f2023";
                }

                return (
                  <ListItem key={index} style={{ backgroundColor: bgColor }}>
                    <ListItemText
                      primary={image}
                      style={{ minWidth: 100, maxWidth: 100 }}
                    />
                    <ListItemText
                      primary={data.name}
                      style={{ minWidth: 350, maxWidth: 350}}
                    />
                    <ListItemText
                      primary={data.id}
                      style={{ minWidth: 400, maxWidth: 400}}
                    />
                    <ListItemText
                      style={{ minWidth: 200, maxWidth: 200 }}
                      primary={
						  <Button
							variant="outlined"
							color="primary"
							disabled={data.id === selectedOrganization.id}
							onClick={() => {
							  handleClickChangeOrg(data.id)
							}}
						  >
							Change Active Org
						  </Button>
					  }
					/>
				  </ListItem>
                )
              })}
            </span>
          ) : null}
        </List>
      </div>
    ) : null;

  const hybridTab =
    curTab === 8 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Hybrid</h2>
          <span style={{ marginLeft: 25 }}></span>
        </div>
        <Divider
          style={{
            marginTop: 20,
            marginBottom: 20,
            backgroundColor: theme.palette.inputColor,
          }}
        />
        <List>
          <ListItem>
            <ListItemText
              primary="Name"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="Orborus source"
              style={{ minWidth: 200, maxWidth: 200 }}
            />
            <ListItemText
              primary="Actions"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Enabled"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="false"
              style={{ minWidth: 200, maxWidth: 200 }}
            />
            <ListItemText
              primary=<Switch
                checked={false}
                onChange={() => {
                  console.log("INVERT");
                }}
              />
              style={{ minWidth: 150, maxWidth: 150 }}
            />
          </ListItem>
        </List>
      </div>
    ) : null;

  const cacheOrgView =
    curTab === 4 ? (
      <div>
        <CacheView globalUrl={globalUrl} orgId={selectedOrganization.id} />
      </div>
    ) : null;

  // primary={environment.Registered ? "true" : "false"}

  const iconStyle = { marginRight: 10 };
  const data = (
    <div
      style={{
        width: 1300,
        margin: "auto",
        overflowX: "hidden",
        marginTop: 25,
      }}
    >
      <Paper style={paperStyle}>
        <Tabs
          value={curTab}
          indicatorColor="primary"
          textColor="secondary"
          onChange={setConfig}
          aria-label="disabled tabs example"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label=<span>
              <BusinessIcon style={iconStyle} /> Organization
            </span>
          />
          <Tab
            disabled={userdata.admin !== "true"}
            label=<span>
              <AccessibilityNewIcon style={iconStyle} />
              Users
            </span>
          />
          <Tab
            label=<span>
              <LockIcon style={iconStyle} />
              App Auth
            </span>
          />
          <Tab
            disabled={userdata.admin !== "true"}
            label=<span>
              <DescriptionIcon style={iconStyle} />
              Files
            </span>
          />
          <Tab
            label=<span>
              <StorageIcon style={iconStyle} /> Datastore
            </span>
          />
          <Tab
            disabled={userdata.admin !== "true"}
            label=<span>
              <ScheduleIcon style={iconStyle} />
              Triggers
            </span>
          />
          <Tab
            disabled={userdata.admin !== "true"}
            label=<span>
              <FmdGoodIcon style={iconStyle} />
              Locations 
            </span>
          />
          <Tab
            label=<span>
              <BusinessIcon style={iconStyle} /> Tenants
            </span>
          />

          {/*window.location.protocol == "http:" && window.location.port === "3000" ? <Tab label=<span><CloudIcon style={iconStyle} /> Hybrid</span>/> : null*/}
          {/*window.location.protocol === "http:" && window.location.port === "3000" ? <Tab label=<span><LockIcon style={iconStyle} />Categories</span>/> : null*/}
        </Tabs>
        <Divider
          style={{
            marginTop: 0,
            marginBottom: 10,
            backgroundColor: "rgb(91, 96, 100)",
          }}
        />
        <div style={{ padding: 15 }}>
          {organizationView}
          {authenticationView}
          {usersView}
          {environmentView}
          {schedulesView}
          {filesView}
          {hybridTab}
          {organizationsTab}
          {appCategoryView}
          {cacheOrgView}
        </div>
      </Paper>
    </div>
  );

  return (
    <div style={{}} >
	  &nbsp;
      {modalView}
      {cloudSyncModal}
      {editUserModal}
      {editAuthenticationModal}
      {data}
      <TextField
        id="copy_element_shuffle"
        value={to_be_copied}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default Admin;
