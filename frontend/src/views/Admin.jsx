import React, { useState, useEffect } from "react";

import theme from "../theme.jsx";
import { makeStyles } from "@mui/styles";

import { useNavigate, Link } from "react-router-dom";
import countries from "../components/Countries.jsx";
import CodeEditor from "../components/ShuffleCodeEditor.jsx";
import getLocalCodeData from "../components/ShuffleCodeEditor.jsx";
import CacheView from "../components/CacheView.jsx";

import {
  FormControl,
  InputLabel,
  Paper,
  OutlinedInput,
  Checkbox,
  Card,
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
  Autocomplete 
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

  FmdGood as FmdGoodIcon,
} from "@mui/icons-material";

//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import Dropzone from "../components/Dropzone.jsx";
import HandlePaymentNew from "../views/HandlePaymentNew.jsx";
import OrgHeader from "../components/OrgHeader.jsx";
import OrgHeaderexpanded from "../components/OrgHeaderexpanded.jsx";
import Billing from "../components/Billing.jsx";
import Priorities from "../components/Priorities.jsx";
import Branding from "../components/Branding.jsx";
import Files from "../components/Files.jsx";
import { display, style } from "@mui/system";
//import EnvironmentStats from "../components/EnvironmentStats.jsx";

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
  console.log("isset value" , isSet);
  if (isSet){
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
    )}
  }


const Admin = (props) => {
  const { globalUrl, userdata, serverside, checkLogin } = props;

  var to_be_copied = "";
  const classes = useStyles();
  let navigate = useNavigate();

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
  const [organizationFeatures, setOrganizationFeatures] = React.useState({});
  const [loginInfo, setLoginInfo] = React.useState("");
  const [curTab, setCurTab] = React.useState(0);
  const [users, setUsers] = React.useState([]);
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
  const [selectedUserModalOpen, setSelectedUserModalOpen] = React.useState(false);
  const [selectedAuthentication, setSelectedAuthentication] = React.useState({});
  const [selectedAuthenticationModalOpen, setSelectedAuthenticationModalOpen] = React.useState(false);
  const [authenticationFields, setAuthenticationFields] = React.useState([]);
  const [showArchived, setShowArchived] = React.useState(false);
  const [isDropzone, setIsDropzone] = React.useState(false);

  const [image2FA, setImage2FA] = React.useState("");
  const [value2FA, setValue2FA] = React.useState("");
  const [secret2FA, setSecret2FA] = React.useState("");
  const [show2faSetup, setShow2faSetup] = useState(false);

  const [adminTab, setAdminTab] = React.useState(2);
	const [showApiKey, setShowApiKey] = useState(false);
  const [billingInfo, setBillingInfo] = React.useState({});
	const [selectedStatus, setSelectedStatus] = React.useState([]);

  useEffect(() => {
		getUsers()
  }, []);


  useEffect(() => {
    if (isDropzone) {
      //redirectOpenApi();
      setIsDropzone(false);
    }
  }, [isDropzone]);

  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";

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
		console.log("value: ", value)

		setSelectedStatus(value);

		
		handleEditOrg(
			"",
			"",
			selectedOrganization.id,
			"",
			{},
			{},
			value.length === 0 ? ["none"] : value,
		)	
	}

	// Basically just a simple way to get a generated email
	// This also may help understand how to communicate with users 
	// both inside and outside Shuffle
	// This could also be generated on the backend
	const mailsendingButton = (org) => {
		if (org === undefined || org === null) {
			return ""
		}

		if (users.length === 0) {
			return ""
		}

		// 1 mail based on users that have only apps
		// Another based on those doing workflows
		// Another based on those trying usecases(?) or templates
		//
		// Start based on edr, siem & ticketing
		// Talk about enrichment?
		// Check suggested usecases
		// Check suggested workflows 
		var your_apps = "- Connecting "

		var subject_add = 0
		var subject = "Want to automate "

		if (org.security_framework !== undefined && org.security_framework !== null) {
			if (org.security_framework.cases.name !== undefined && org.security_framework.cases.name !== null && org.security_framework.cases.name !== "") {
				your_apps += org.security_framework.cases.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

				if (subject_add < 2) {
					if (subject_add === 1) {
						subject += " and "
					}

					subject_add += 1 
					subject += org.security_framework.cases.name.replace("_", " ", -1).replace(" API", "", -1) 
				}
			}

			if (org.security_framework.siem.name !== undefined && org.security_framework.siem.name !== null && org.security_framework.siem.name !== "") {
				your_apps += org.security_framework.siem.name.replace("_", " ", -1).replace(" API", "", -1) + ", "
				if (subject_add < 2) {
					if (subject_add === 1) {
						subject += " and "
					}

					subject_add += 1 
					subject += org.security_framework.siem.name.replace("_", " ", -1).replace(" API", "", -1)
				}
			}

			if (org.security_framework.communication.name !== undefined && org.security_framework.communication.name !== null && org.security_framework.communication.name !== "") {
				your_apps += org.security_framework.communication.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

				if (subject_add < 2) {
					if (subject_add === 1) {
						subject += " and "
					}

					subject_add += 1 
					subject += org.security_framework.communication.name.replace("_", " ", -1).replace(" API", "", -1)
				}
			}

			if (org.security_framework.edr.name !== undefined && org.security_framework.edr.name !== null && org.security_framework.edr.name !== "") {
				your_apps += org.security_framework.edr.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

				if (subject_add < 2) {
					if (subject_add === 1) {
						subject += " and "
					}

					subject_add += 1 
					subject += org.security_framework.edr.name.replace("_", " ", -1).replace(" API", "", -1)
				}
			}

			if (org.security_framework.intel.name !== undefined && org.security_framework.intel.name !== null && org.security_framework.intel.name !== "") {
				your_apps += org.security_framework.intel.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

				if (subject_add < 2) {
					if (subject_add === 1) {
						subject += " and "
					}

					subject_add += 1 
					subject += org.security_framework.intel.name.replace("_", " ", -1).replace(" API", "", -1)
				}
			}


			// Remove comma
			subject += "?"
			your_apps = your_apps.substring(0, your_apps.length - 2)
		}


		// Add usecases they may not have tried (from recommendations): org.priorities where item type is usecase
		var usecases = "- Building usecases like "
		const active_usecase = org.priorities.filter((item) => item.type === "usecase" && item.active === true)
		if (active_usecase.length > 0) {
			for (var i = 0; i < active_usecase.length; i++) {
				if (active_usecase[i].name.includes("Suggested Usecase: ")) {
					usecases += active_usecase[i].name.replace("Suggested Usecase: ", "", -1) + ", "
				} else {
					usecases += active_usecase[i].name + ", "
				}
			}

			usecases = usecases.substring(0, usecases.length - 2)
		}

		if (your_apps.length <= 15) {
			your_apps = ""
		} 

		if (usecases.length <= 30) {
			usecases = ""
		}

		var workflow_amount = "a few"
		var admins = "" 

		// Loop users
		for (var i = 0; i < users.length; i++) {
			if (users[i].role === "admin") {
				admins += users[i].username + ","
			}
		}

		// Remove last comma
		admins = admins.substring(0, admins.length - 1)

		if (your_apps.length > 5) {
			your_apps += "%0D%0A"
		}

		if (usecases.length > 5) {
			usecases += "%0D%0A"
		}

		// Get drift username from userdata.username before @ in email
		const username = userdata.username.substring(0, userdata.username.indexOf("@"))

		var body = `Hey,%0D%0A%0D%0AI saw you trying to use Shuffle, and thought we may be able to help. Right now, it looks like you have ${workflow_amount} workflows made, but it still doesn't look like you are getting the most out of Shuffle. If you're interested, I'd love to set up a quick call to see if we can help you get more out of Shuffle. %0D%0A%0D%0A

Some of the things we can help with:%0D%0A
${your_apps}
- Configuring and authenticating your apps%0D%0A
${usecases}
- Creating special usecases and apps%0D%0A%0D%0A

Let me know if you're interested, or set up a call here: https://drift.me/${username}`

		return `mailto:${admins}?bcc=frikky@shuffler.io,binu@shuffler.io&subject=${subject}&body=${body}`
	}

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
        })
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
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
            setTimeout(() => {
              getSchedules();
            }, 1500);
            //toast("Successfully stopped schedule!")
          }
        })
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };


	if (userdata.support === true && selectedOrganization.id !== "" && selectedOrganization.id !== undefined && selectedOrganization.id !== null && selectedOrganization.id !== userdata.active_org.id) {
		toast("Refreshing window to fix org support access")
		window.location.reload()
		return null
	}

  const handleVerify2FA = (userId, code) => {
    const data = {
      code: code,
      user_id: userId,
    };

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
          toast("Successfully enabled 2fa");

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
            "Failed stopping sync. Try again, and contact support if this persists."
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
              "Successfully started syncronization. Cloud features you now have access to can be seen below."
            );
          }

          selectedOrganization.cloud_sync = !selectedOrganization.cloud_sync;
          setSelectedOrganization(selectedOrganization);
          setCloudSyncApikey("");

          handleGetOrg(userdata.active_org.id);
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
            toast("Failed changing authentication");
          } else {
            //toast("Successfully password!")
            setSelectedUserModalOpen(false);
            getAppAuthentication();
          }
        })
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
						if (lead_info === undefined || lead_info === null || lead_info === []) {
            	toast("Successfully edited org!");
						}
          }
        })
      )
      .catch((error) => {
        toast("Err: " + error.toString());
      });
  };

  const editAuthenticationConfig = (id) => {
    const data = {
      id: id,
      action: "assign_everywhere",
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
            toast("Failed overwriting appauth in workflows");
          } else {
            toast("Successfully updated auth everywhere!");
            setSelectedUserModalOpen(false);
            setTimeout(() => {
              getAppAuthentication();
            }, 1000);
          }
        })
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
            toast(
              "Successfully created suborg. Reloading in 3 seconds!"
            );
            setSelectedUserModalOpen(false);

            setTimeout(() => {
              window.location.reload();
            }, 2500);
          }

          setOrgName("");
          setModalOpen(false);
        })
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
        })
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
			const foundorgid = params["org_id"];
			if (foundorgid !== undefined && foundorgid !== null) {
				orgId = foundorgid;
			}
		}

    if (orgId.length === 0) {
      toast("Organization ID not defined. Please contact us on https://shuffler.io if this persists logout.");
      return;
    }

    // Just use this one?
    
    fetch(`${globalUrl}/api/v1/orgs/${orgId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 401) {
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson["success"] === false) {
          toast("Failed getting your org. If this persists, please contact support.");
        } else {
          if (
            responseJson.sync_features === undefined ||
            responseJson.sync_features === null
          ) {
            responseJson.sync_features = {};
          }

					if (responseJson.lead_info !== undefined && responseJson.lead_info !== null) {
						var leads = []
						if (responseJson.lead_info.contacted) {
							leads.push("contacted")
						}

						if (responseJson.lead_info.customer) {
							leads.push("customer")
						}

						if (responseJson.lead_info.demo_done) {
							leads.push("demo done")
						}

						if (responseJson.lead_info.pov) {
							leads.push("pov")
						}

						if (responseJson.lead_info.lead) {
							leads.push("lead")
						}

						if (responseJson.lead_info.student) {
							leads.push("student")
						}

						if (responseJson.lead_info.internal) {
							leads.push("internal")
						}

						if (responseJson.lead_info.sub_org) {
							leads.push("sub_org")
						}

						setSelectedStatus(leads)
					}

          setSelectedOrganization(responseJson)
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
    				toast("Failed to send email (2). Please try again and contact support if this persists.")
          } else {
            setLoginInfo("");
            setModalOpen(false);
            setTimeout(() => {
              getUsers();
            }, 1000);
    				
						toast("Invite sent! They will show up in the list when they have accepted the invite.")
          }
        })
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
    		toast("Failed to send email. Please try again and contact support if this persists.")
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
        })
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  // Horrible frontend fix for environments
  const setDefaultEnvironment = (environment) => {
    // FIXME - add more checks to this
    toast("Setting default env to " + environment.name);
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
        })
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
        })
      )
      .catch((error) => {
        console.log("Error when deleting: ", error);
      });
  };

  const rerunCloudWorkflows = (environment) => {
		toast("Starting execution reruns. This can run in the background.") 
    fetch(
      `${globalUrl}/api/v1/environments/${environment.id}/rerun`,
      {
        method: "GET",
        credentials: "include",
      }
    )
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

    fetch(
      `${globalUrl}/api/v1/environments/${environment.id}/stop?deleteall=true`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          toast("Failed aborting dangling workflows");
          return;
        } else {
          toast("Aborted all dangling workflows");
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
        })
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
        })
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  var localData = "";


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
    5: "schedules",
    6: "environments",
    7: "suborgs",
  };

  const admin_views = {
    0: "organization",
    1: "cloud_sync",
		2: "priorities",
    3: "billing",
    4: "branding",
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
  }

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

  if (
    selectedOrganization.id === undefined &&
    userdata !== undefined &&
    userdata.active_org !== undefined &&
    orgRequest
  ) {
    setOrgRequest(false);
    handleGetOrg(userdata.active_org.id);
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
        } else {
          //toast("Set the user field " + field + " to " + value);
          toast("Successfully updated user field " + field)

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

	console.log(user, userdata)

    var fetchdata = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    }

    if (userId === userdata.id) {
		fetchdata.method = "GET"
	} else {
      	fetchdata.body = JSON.stringify(data)
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
          Edit authentication for {selectedAuthentication.app.name} (
          {selectedAuthentication.label})
        </span>
      </DialogTitle>
      <DialogContent>
        {selectedAuthentication.fields.map((data, index) => {
          //console.log("DATA: ", data, selectedAuthentication)
          return (
            <div key={index}>
              <Typography style={{ marginBottom: 0, marginTop: 10 }}>
                {data.key}
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
                placeholder={data.key}
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
            for (var key in authenticationFields) {
              const item = authenticationFields[key];
              if (item.value.length === 0) {
                console.log("ITEM: ", item);
                //var currentnode = cy.getElementById(data.id)
                var textfield = document.getElementById(
                  `authentication-${key}`
                );
                if (textfield !== null && textfield !== undefined) {
                  console.log("HANDLE ERROR FOR KEY ", key);
                }
                error = true;
              }
            }

            if (error) {
              toast("All fields must have a new value");
            } else {
              toast("Saving new version of this authentication");
              selectedAuthentication.fields = authenticationFields;
              saveAuthentication(selectedAuthentication);
              setSelectedAuthentication({});
              setSelectedAuthenticationModalOpen(false);
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
          backgroundColor: theme.palette.surfaceColor,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
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
        </div>
        {show2faSetup ? (
          <div
            style={{
              margin: "auto",
              maxWidth: 300,
              minWidth: 300,
              marginTop: 25,
            }}
          >
            {/*<Divider style={{marginTop: 20, marginBottom: 20}} />*/}

            {secret2FA !== undefined &&
            secret2FA !== null &&
            secret2FA.length > 0 ? (
              <span>
                <Typography variant="body2" color="textSecondary">
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
                alt={"2 factor img"}
                src={image2FA}
                style={{
                  margin: "auto",
                  marginTop: 25,
                  maxHeight: 200,
                  maxWidth: 200,
                  minWidth: 200,
                  maxWidth: 200,
                }}
              />
            ) : (
              <CircularProgress />
            )}

            <Typography variant="body2" color="textSecondary">
              After scanning the QR code image, the app will display a code that
              you can enter below.
            </Typography>
            <div style={{ display: "flex" }}>
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
              />
              <Button
                disabled={value2FA.length !== 6}
                variant="contained"
                style={{ marginTop: 15, height: 50, flex: 1 }}
                onClick={() => {
                  handleVerify2FA(userdata.id, value2FA);
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

    const primary = props.data.primary;
    const secondary = props.data.secondary;
    const primaryIcon = props.data.icon;
    const secondaryIcon = props.data.active ? (
      <CheckCircleIcon style={{ color: "green" }} />
    ) : (
      <CloseIcon style={{ color: "red" }} />
    )

    return (
      <Grid
        item
        xs={4}
        style={{ cursor: "pointer" }}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <Card
          style={{
            margin: 4,
            backgroundColor: theme.palette.surfaceColor,
            color: "white",
            minHeight: expanded ? 250 : "inherit",
            maxHeight: expanded ? 250 : "inherit",
          }}
        >
          <ListItem>
            <ListItemAvatar>
              <Avatar>{primaryIcon}</Avatar>
            </ListItemAvatar>
            <ListItemText
              style={{ textTransform: "capitalize" }}
              primary={primary}
            />
            {secondaryIcon}
          </ListItem>
          {expanded ? (
            <div style={{ padding: 15 }}>
              <Typography>
                <b>Usage:&nbsp;</b>
                {props.data.limit === 0 ? (
                  "Unlimited"
                ) : (
                  <span>
                    {props.data.usage} / {props.data.limit === "" ? "Unlimited" : props.data.limit}
                  </span>
                )}
              </Typography>
              {/*<Typography>
                Data sharing: {props.data.data_collection}
              </Typography>*/}
              <Typography style={{maxHeight: 150, overflowX: "hidden", overflowY: "auto"}}><b>Description:</b> {secondary}</Typography>
            </div>
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
                selectedOrganization.cloud_sync
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


  
  const organizationView =
    curTab === 0 && selectedOrganization.id !== undefined ? (
      <div style={{ position: "relative" }}>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Organization overview</h2>
          <span style={{ marginLeft: 25 }}>
            On this page you can configure individual parts of your
            organization.{" "}
            <a
              target="_blank"
							rel="noopener noreferrer"
              href="/docs/organizations#organization"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              Learn more
            </a>
          </span>
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

						{userdata.support === true ? 
							<span style={{display: "flex", top: -10, right: -50, position: "absolute"}}>
								{/*<a href={mailsendingButton(selectedOrganization)} target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}} disabled={selectedStatus.length !== 0}>*/}
								<Button
									variant="outlined"
									color="primary"
									disabled={selectedStatus.length !== 0}
									style={{ minWidth: 80, maxWidth: 80, height: "100%", }} 
									onClick={() => {
											console.log("Should send mail to admins of org with context")
											handleStatusChange({target: {value: ["contacted"]}})
											// Open a new tab
											window.open(mailsendingButton(selectedOrganization), "_blank")
									}}
								>
									Sales mail
								</Button>
								<FormControl sx={{ m: 1, width: 300, }} style={{}}>
									<InputLabel id="">Status</InputLabel>
									<Select
										style={{minWidth: 150, maxWidth: 150, }}
										labelId="multiselect-status"
										id="multiselect-status"
										multiple
										value={selectedStatus}
										onChange={handleStatusChange}
										input={<OutlinedInput label="Status" />}
										renderValue={(selected) => selected.join(', ')}
										MenuProps={MenuProps}
									>
										{["contacted", "lead", "pov", "demo done", "customer", "student", "internal"].map((name) => (
											<MenuItem key={name} value={name}>
												<Checkbox checked={selectedStatus.indexOf(name) > -1} />
												<ListItemText primary={name} />
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</span>
						: null}

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
                      99999
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
						{selectedOrganization.defaults !== undefined && selectedOrganization.defaults.documentation_reference !== undefined && selectedOrganization.defaults.documentation_reference !== null && selectedOrganization.defaults.documentation_reference.includes("http") ?
							<Tooltip
								title={"Open Organization Documentation"}
                style={{ top: -10, right: 50, position: "absolute" }}
								aria-label={"Open org docs"}
							>
								<a href={selectedOrganization.defaults.documentation_reference} target="_blank" style={{ textDecoration: "none", }} rel="noopener noreferrer">
									<IconButton
                		style={{ top: -10, right: 50, position: "absolute" }}
									>
										<DescriptionIcon style={{ color: "rgba(255,255,255,0.8)" }} />
									</IconButton>
								</a>
							</Tooltip>
						: null}
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
							value={adminTab}
							indicatorColor="primary"
							textColor="secondary"
							style={{marginTop: 20, }}
							onChange={(event, inputValue) => {
    						const newValue = parseInt(inputValue);
								setAdminTab(newValue);

  							//const setConfig = (event, inputValue) => {
    						navigate(`/admin?admin_tab=${admin_views[newValue]}`);
							}}
							aria-label="disabled tabs example"
						>
							<Tab
								label=<span>
									Edit Details
								</span>
							/>
							<Tab
								label=<span>
									Cloud Synchronization	
								</span>
							/>
							<Tab
								label=<span>
									Priorities	
								</span>
							/>
							<Tab
								label=<span>
									Licensing (Beta)
								</span>
							/>
							<Tab
								disabled={!isCloud}
								label=<span>
									Branding (Beta)
								</span>
							/>
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
						)
						: adminTab === 1 ? (
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
            		do? Cloud syncronization is a way of getting more out of Shuffle.
            		Shuffle will <b>ALWAYS</b> make every option open source, but
            		features relying on other users can't be done without a
            		collaborative approach.
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
																		setShowApiKey(!showApiKey)
																	}}
																>
																	{showApiKey ? <VisibilityIcon /> : <VisibilityOffIcon />}
																</IconButton>
															</InputAdornment>
														)
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
            		            selectedOrganization.cloud_sync
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
            		<Typography variant="h6" style={{ marginLeft: 5, marginTop: 40, marginBottom: 5 }}>
            		  Cloud sync features 
            		</Typography>
            		<Typography variant="body2" color="textSecondary" style={{marginBottom: 10, marginLeft: 5, }}>
									If not otherwise specified, Usage will reset monthly
            		</Typography>
            		<Grid container style={{ width: "100%", marginBottom: 15 }}>

            		  {selectedOrganization.sync_features === undefined ||
            		  selectedOrganization.sync_features === null
            		    ? null
            		    : Object.keys(selectedOrganization.sync_features).map(function (
            		        key,
            		        index
            		      ) {
												// unnecessary parts
            		        if (key === "schedule" || key === "apps" || key === "updates") {
            		          return null;
            		        }

            		        const item = selectedOrganization.sync_features[key];
												if (item === null) {
													return null
												}

            		        const newkey = key.replaceAll("_", " ");
            		        const griditem = {
            		          primary: newkey,
            		          secondary:
            		            item.description === undefined ||
            		            item.description === null ||
            		            item.description.length === 0
            		              ? "Not defined yet"
            		              : item.description,
            		          limit: item.limit,
            		          usage: item.usage === undefined ||
            		            item.usage === null ? 0 : item.usage,
            		          data_collection: "None",
            		          active: item.active,
            		          icon: <PolylineIcon style={{ color: itemColor }} />,
            		        };

            		        return (
            		          <Zoom key={index}>
            		            <GridItem data={griditem} />
            		          </Zoom>
            		        );
            		      })}
            		</Grid>
							</div>
							)
						: adminTab === 2 ? 
							<Priorities
								isCloud={isCloud}
								userdata={userdata}
								adminTab={adminTab}
								globalUrl={globalUrl}
								checkLogin={checkLogin}
								setAdminTab={setAdminTab}
								setCurTab={setCurTab}
							/>
						: adminTab === 3 ? 
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
						: adminTab === 4 ? 
							<Branding
								isCloud={isCloud}
								userdata={userdata}
								adminTab={adminTab}
								globalUrl={globalUrl}
								handleGetOrg={handleGetOrg}
								selectedOrganization={selectedOrganization}
								setSelectedOrganization={setSelectedOrganization}
							/>
							: null
						}
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
          {curTab === 1 ? "Add user" : curTab === 7 ? "Add Sub-Organization" : "Add environment"}
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

  const usersView =
    curTab === 1 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>User management</h2>
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
        <div />
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
              primary="Username"
              style={{ minWidth: 350, maxWidth: 350 }}
            />

            <ListItemText
              primary="API key"
              style={{
                marginleft: 10,
                minWidth: 100,
                maxWidth: 100,
                overflow: "hidden",
              }}
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
              style={{ minWidth: 180, maxWidth: 180 }}
            />
          </ListItem>
          {users === undefined || users === null
            ? null
            : users.map((data, index) => {
                var bgColor = "#27292d";
                if (index % 2 === 0) {
                  bgColor = "#1f2023";
                }

                return (
                  <ListItem key={index} style={{ backgroundColor: bgColor }}>
                    <ListItemText
                      primary={data.username}
                      style={{
                        minWidth: 350,
                        maxWidth: 350,
                        overflow: "hidden",
                      }}
                    />

                    <ListItemText
                      style={{ marginLeft: 10, maxWidth: 100, minWidth: 100 }}
                      primary={
                        data.apikey === undefined ||
                        data.apikey.length === 0 ? (
                          ""
                        ) : (
                          <Tooltip
                            title={"Copy Api Key"}
                            style={{}}
                            aria-label={"Copy APIkey"}
                          >
                            <IconButton
                              style={{}}
                              onClick={() => {
                                const elementName = "copy_element_shuffle";
                                var copyText =
                                  document.getElementById(elementName);
                                if (
                                  copyText !== null &&
                                  copyText !== undefined
                                ) {
                                  const clipboard = navigator.clipboard;
                                  if (clipboard === undefined) {
                                    toast(
                                      "Can only copy over HTTPS (port 3443)"
                                    );
                                    return;
                                  }

                                  navigator.clipboard.writeText(data.apikey);
                                  copyText.select();
                                  copyText.setSelectionRange(
                                    0,
                                    99999
                                  ); /* For mobile devices */

                                  /* Copy the text inside the text field */
                                  document.execCommand("copy");

                                  toast("Apikey copied to clipboard");
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
                    <ListItemText style={{ display: "flex" }}>
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
                                  (item) => item.id === userdata.orgs[key].id
                                );
                              if (found !== null && found !== undefined) {
                                if (
                                  data.orgs === undefined ||
                                  data.orgs === null
                                ) {
                                  continue;
                                }

                                const subfound = data.orgs.find(
                                  (item) => item === found.id
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
                  </ListItem>
                );
              })}
        </List>
      </div>
    ) : null;

  const run2FASetup = (data) => {
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



  const filesView = curTab !== 3 ? null : 
		<Files 
			isCloud={isCloud}
			globalUrl={globalUrl}
			userdata={userdata}
			serverside={serverside} 
			selectedOrganization={selectedOrganization}
		/>

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
              href="/docs/organizations#schedules"
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
          </ListItem>
          {schedules === undefined || schedules === null
            ? null
            : schedules.map((schedule, index) => {
                var bgColor = "#27292d";
                if (index % 2 === 0) {
                  bgColor = "#1f2023";
                }

                return (
                  <ListItem key={index} style={{ backgroundColor: bgColor }}>
                    <ListItemText
                      style={{ maxWidth: 200, minWidth: 200 }}
                      primary={
                        schedule.environment === "cloud" || schedule.environment === "" || schedule.frequency.length > 0 ? 
                          schedule.frequency
                         : 
                          <span>{schedule.seconds} seconds</span>
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
                      primary={schedule.argument.replaceAll('\\\"', '\"')}
                      style={{
                        minWidth: 300,
                        maxWidth: 300,
                        overflow: "hidden",
                      }}
                    />
                    <ListItemText>
                      <Button
                        style={{}}
                        variant="contained"
                        color="primary"
                        onClick={() => deleteSchedule(schedule)}
                      >
                        Stop schedule
                      </Button>
                    </ListItemText>
                  </ListItem>
                );
              })}
        </List>
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

  const authenticationView =
    curTab === 2 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>App Authentication</h2>
          <span style={{ marginLeft: 25 }}>
            Control the authentication options for individual apps. 
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
              style={{ minWidth: 125, maxWidth: 125, overflow: "hidden" }}
            />
            <ListItemText
              primary="Created"
              style={{ minWidth: 230, maxWidth: 230, overflow: "hidden" }}
            />
            <ListItemText primary="Actions" />
          </ListItem>
          {authentication === undefined || authentication === null
            ? null
            : authentication.map((data, index) => {
                var bgColor = "#27292d";
                if (index % 2 === 0) {
                  bgColor = "#1f2023";
                }

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
                  <ListItem key={index} style={{ backgroundColor: bgColor }}>
                    <ListItemText
                      primary=<img
                        alt=""
                        src={data.app.large_image}
                        style={{
                          maxWidth: 50,
                          borderRadius: theme.palette.borderRadius,
                        }}
                      />
                      style={{ minWidth: 75, maxWidth: 75 }}
                    />
                    <ListItemText
                      primary={data.label}
                      style={{
                        minWidth: 225,
                        maxWidth: 225,
                        overflow: "hidden",
                      }}
                    />
                    <ListItemText
                      primary={data.app.name}
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
                        minWidth: 125,
                        maxWidth: 125,
                        overflow: "hidden",
                      }}
                    />
                    <ListItemText
                      style={{
                        maxWidth: 230,
                        minWidth: 230,
                        overflow: "hidden",
                      }}
                      primary={new Date(data.created * 1000).toISOString()}
                    />
                    <ListItemText>
                      <IconButton
                        onClick={() => {
                          updateAppAuthentication(data);
                        }}
                      >
                        <EditIcon color="primary" />
                      </IconButton>
                      {data.defined ? (
                        <Tooltip
                          color="primary"
                          title="Set in EVERY workflow"
                          placement="top"
                        >
                          <IconButton
                            style={{ marginRight: 10 }}
                            disabled={data.defined === false}
                            onClick={() => {
                              editAuthenticationConfig(data.id);
                            }}
                          >
                            <SelectAllIcon
                              color={data.defined ? "primary" : "secondary"}
                            />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip
                          color="primary"
                          title="Must edit before you can set in all workflows"
                          placement="top"
                        >
                          <IconButton
                            style={{ marginRight: 10 }}
                            onClick={() => {}}
                          >
                            <SelectAllIcon
                              color={data.defined ? "primary" : "secondary"}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton
                        onClick={() => {
                          deleteAuthentication(data);
                        }}
                      >
                        <DeleteIcon color="primary" />
                      </IconButton>
                    </ListItemText>
                  </ListItem>
                );
              })}
        </List>
      </div>
    ) : null;

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
						checkLogin()
  					getEnvironments()
					}
        } else {
        	if (responseJson.success === false && responseJson.reason !== undefined) {
          	toast("Failed change recommendation: ", responseJson.reason)
        	} else {
          	toast("Failed change recommendation");
					}
        }
      })
      .catch((error) => {
        toast("Failed dismissing alert. Please contact support@shuffler.io if this persists.");
      });
	}

  const environmentView =
    curTab === 6 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Environments</h2>
          <span style={{ marginLeft: 25 }}>
            Decides what Orborus environment to execute an action in a workflow
            in.{" "}
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
          Add environment
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
          <ListItem>
            <ListItemText
              primary="Name"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="Orborus running"
              style={{ minWidth: 200, maxWidth: 200 }}
            />
            <ListItemText
              primary="Command"
              style={{ minWidth: 100, maxWidth: 100 }}
            />
            <ListItemText
              primary="Type"
              style={{ minWidth: 125, maxWidth: 125 }}
            />
            <ListItemText
              primary="Default"
              style={{ minWidth: 125, maxWidth: 125 }}
            />
            <ListItemText
              primary="Disabled"
              style={{ minWidth: 100, maxWidth: 100 }}
            />
            <ListItemText
              primary="Last Edited"
              style={{ minWidth: 170, maxWidth: 170 }}
            />
            <ListItemText
              primary="Actions"
              style={{ minWidth: 150, maxWidth: 150 }}
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
								var showCPUAlert = false	
								var foundIndex = -1
								if (userdata !== undefined && userdata !== null && userdata.priorities !== undefined && userdata.priorities !== null && userdata.priorities.length > 0) {
									foundIndex = userdata.priorities.findIndex(prio => prio.name.includes("CPU") && prio.active === true)

									if (foundIndex >= 0 && userdata.priorities[foundIndex].name.endsWith(environment.Name)) {
											showCPUAlert = true
									}
								}

								console.log("Show CPU alert: ", showCPUAlert)

                return (
									<span key={index}>
                  	<ListItem key={index} style={{ backgroundColor: bgColor }}>
                  	  <ListItemText
                  	    primary={environment.Name}
                  	    style={{
                  	      minWidth: 150,
                  	      maxWidth: 150,
                  	      overflow: "hidden",
                  	    }}
                  	  />
                  	  <ListItemText
                  	    primary={
                  	      environment.Type !== "cloud"
                  	        ? environment.running_ip === undefined ||
                  	          environment.running_ip === null ||
                  	          environment.running_ip.length === 0
                  	          ? 
															<div>
																Not running
															</div>
                  	          : environment.running_ip.split(":")[0] 
                  	        : "N/A"
                  	    }
                  	    style={{
                  	      minWidth: 200,
                  	      maxWidth: 200,
                  	      overflow: "hidden",
                  	    }}
                  	  />

                  	  <ListItemText
                  	    style={{ minWidth: 100, maxWidth: 100 }}
                  	    primary={
													<Tooltip
														title={"Copy Orborus command"}
														style={{}}
														aria-label={"Copy orborus command"}
													>
														<IconButton
															style={{}}
															disabled={environment.Type === "cloud"}
															onClick={() => {
																if (environment.Type === "cloud") {
																	toast("No Orborus necessary for environment cloud. Create and use a different environment to run executions on-premises.")
																	return
																}

																const elementName = "copy_element_shuffle";
																const auth = environment.auth === "" ? 'cb5st3d3Z!3X3zaJ*Pc' : environment.auth
																const commandData = `docker run --volume "/var/run/docker.sock:/var/run/docker.sock" -e ENVIRONMENT_NAME="${environment.Name}" -e 'AUTH=${auth}' -e ORG="${props.userdata.active_org.id}" -e DOCKER_API_VERSION=1.40 -e BASE_URL="${globalUrl}" --name="shuffle-orborus" -d ghcr.io/shuffle/shuffle-orborus:latest`
																var copyText = document.getElementById(elementName);
																if (copyText !== null && copyText !== undefined) {
																	const clipboard = navigator.clipboard;
																	if (clipboard === undefined) {
																		toast("Can only copy over HTTPS (port 3443)");
																		return;
																	}

																	navigator.clipboard.writeText(commandData);
																	copyText.select();
																	copyText.setSelectionRange(
																		0,
																		99999
																	); /* For mobile devices */

																	/* Copy the text inside the text field */
																	document.execCommand("copy");

																	toast("Orborus command copied to clipboard");
																}
															}}
														>
															<FileCopyIcon disabled={environment.Type === "cloud"} style={{ color: environment.Type === "cloud" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.8)" }} />
														</IconButton>
													</Tooltip>
												}
                  	  />

                  	  <ListItemText
                  	    primary={environment.Type}
                  	    style={{ minWidth: 125, maxWidth: 125 }}
                  	  />
                  	  <ListItemText
                  	    style={{
                  	      minWidth: 125,
                  	      maxWidth: 125,
                  	      overflow: "hidden",
                  	    }}
                  	    primary={environment.default ? "true" : null}
                  	  >
                  	    {environment.default ? null : (
                  	      <Button
                  	        variant="outlined"
                  	        style={{ marginRight: 5 }}
                  	        onClick={() => setDefaultEnvironment(environment)}
                  	        color="primary"
                  	      >
                  	        Make default
                  	      </Button>
                  	    )}
                  	  </ListItemText>
                  	  <ListItemText
                  	    style={{
                  	      minWidth: 100,
                  	      maxWidth: 100,
                  	      overflow: "hidden",
                  	      marginLeft: 10,
                  	    }}
                  	    primary={environment.archived.toString()}
                  	  />
                  	  <ListItemText
                  	    style={{
                  	      minWidth: 150,
                  	      maxWidth: 150,
                  	      overflow: "hidden",
                  	    }}
                  	    primary={
                  	      environment.edited !== undefined &&
                  	      environment.edited !== null &&
                  	      environment.edited !== 0
                  	        ? new Date(environment.edited * 1000).toISOString()
                  	        : 0
                  	    }
                  	  />
                  	  <ListItemText
                  	    style={{
                  	      minWidth: 300,
                  	      maxWidth: 300,
                  	      overflow: "hidden",
                  	      marginLeft: 10,
                  	    }}
                  	  >
                  	    <div style={{ display: "flex" }}>
													<ButtonGroup style={{borderRadius: "5px 5px 5px 5px",}}>
														<Button
															variant={environment.archived ? "contained" : "outlined"}
															style={{ }}
															onClick={() => deleteEnvironment(environment)}
															color="primary"
														>
															{environment.archived ? "Activate" : "Disable"}
														</Button>
														<Button
															variant={"outlined"}
															style={{ }}
															disabled={isCloud && environment.Name.toLowerCase() !== "cloud"}
															onClick={() => {
																console.log("Should clear executions for: ", environment);

																if (isCloud && environment.Name.toLowerCase() === "cloud") {
																	rerunCloudWorkflows(environment);
																} else { 
																	abortEnvironmentWorkflows(environment);
																}
															}}
															color="primary"
														>
															{isCloud && environment.Name.toLowerCase() === "cloud" ? "Rerun" : "Clear"}
														</Button>
													</ButtonGroup>
                  	    </div>
                  	  </ListItemText>
                  	</ListItem>
										{showCPUAlert === false ? null : 
                  		<ListItem key={index+"_cpu"} style={{ backgroundColor: bgColor }}>
												<div style={{border: "1px solid #f85a3e", borderRadius: theme.palette.borderRadius, marginTop: 10, marginBottom: 10, padding: 15, textAlign: "center", height: 70, textAlign: "left", backgroundColor: theme.palette.surfaceColor, display: "flex", }}>
													<div style={{flex: 2, overflow: "hidden",}}>
														<Typography variant="body1" >
															90% CPU the server(s) hosting the Shuffle App Runner (Orborus) was found.  
														</Typography>
														<Typography variant="body2" color="textSecondary">
															Need help with High Availability and Scale? <a href="/docs/configuration#scale" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#f85a3e" }}>Read documentation</a> and <a href="https://shuffler.io/contact" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#f85a3e" }}>Get in touch</a>.  
														</Typography>
													</div>
													<div style={{flex: 1, display: "flex", marginLeft: 30, }}>
														<Button style={{borderRadius: 25, width: 200, height: 50, marginTop: 8, }} variant="outlined" color="secondary" onClick={() => {
															// dismiss -> get envs
														 	changeRecommendation(userdata.priorities[foundIndex], "dismiss")
														}}>
															Dismiss	
														</Button>
													</div> 
												</div>
											</ListItem>
										}
									</span>
                );
              })}
        </List>
				{/*<EnvironmentStats />*/}
      </div>
    ) : null;

  const organizationsTab =
    curTab === 7 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Organizations</h2>
          <span style={{ marginLeft: 25 }}>
            Global admin: control organizations
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
              style={{ minWidth: 250, maxWidth: 250 }}
            />
            <ListItemText
              primary="Your role"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="id"
              style={{ minWidth: 400, maxWidth: 400 }}
            />
            <ListItemText
              primary="Selected"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="Cloud Sync"
              style={{ minWidth: 150, maxWidth: 150 }}
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

                const imagesize = 40;
                const imageStyle = {
                  width: imagesize,
                  height: imagesize,
                  pointerEvents: "none",
                };
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
                      style={{ minWidth: 250, maxWidth: 250 }}
                    />
                    <ListItemText
                      primary={data.role}
                      style={{ minWidth: 150, maxWidth: 150 }}
                    />
                    <ListItemText
                      primary={data.id}
                      style={{ minWidth: 400, maxWidth: 400 }}
                    />
                    <ListItemText
                      primary={isSelected}
                      style={{ minWidth: 150, maxWidth: 150 }}
                    />
                    <ListItemText
                      primary=<Switch
                        checked={data.cloud_sync}
                        onChange={() => {
                          setCloudSyncModalOpen(true);
                          setSelectedOrganization(data);
                          console.log("INVERT CLOUD SYNC");
                        }}
                      />
                      style={{ minWidth: 150, maxWidth: 150 }}
                    />
                  </ListItem>
                );
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
        <CacheView
					globalUrl={globalUrl}
					orgId = {selectedOrganization.id}
        />
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
              App Authentication
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
              Schedules
            </span>
          />
          <Tab
            disabled={userdata.admin !== "true"}
            label=<span>
              <FmdGoodIcon style={iconStyle} />
              Environments
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
    <div>
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
