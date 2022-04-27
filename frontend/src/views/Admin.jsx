import React, { useState, useEffect } from "react";

import { makeStyles } from "@material-ui/styles";
import { useTheme } from "@material-ui/core/styles";
import { useNavigate, Link } from "react-router-dom";

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
} from "@material-ui/core";

import {
  Edit as EditIcon,
  FileCopy as FileCopyIcon,
  Publish as PublishIcon,
  SelectAll as SelectAllIcon,
  OpenInNew as OpenInNewIcon,
  CloudDownload as CloudDownloadIcon,
  Description as DescriptionIcon,
  Polymer as PolymerIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Apps as AppsIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Cached as CachedIcon,
  AccessibilityNew as AccessibilityNewIcon,
  Lock as LockIcon,
  Eco as EcoIcon,
  Schedule as ScheduleIcon,
  Cloud as CloudIcon,
  Business as BusinessIcon,
} from "@material-ui/icons";

import { useAlert } from "react-alert";
import Dropzone from "../components/Dropzone";
import HandlePayment from "./HandlePayment";
import OrgHeader from "../components/OrgHeader.jsx";

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
}


const Admin = (props) => {
  const { globalUrl, userdata, serverside} = props;

  var upload = "";
  var to_be_copied = "";
  const theme = useTheme();
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
  const [files, setFiles] = React.useState([]);
  const [selectedNamespace, setSelectedNamespace] = React.useState("default");
  const [fileNamespaces, setFileNamespaces] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState({});
  const [newUsername, setNewUsername] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [selectedUserModalOpen, setSelectedUserModalOpen] =
    React.useState(false);
  const [selectedAuthentication, setSelectedAuthentication] = React.useState(
    {}
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

  useEffect(() => {
    if (isDropzone) {
      //redirectOpenApi();
      setIsDropzone(false);
    }
  }, [isDropzone]);

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

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
          //alert.info(responseJson.reason)
          setImage2FA(responseJson.reason);
          setSecret2FA(responseJson.extra);
        }
      })
      .catch((error) => {
        alert.error(error.toString());
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
        alert.error(error.toString());
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

  const alert = useAlert();

  const deleteAuthentication = (data) => {
    alert.info("Deleting auth " + data.label);

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
          console.log("RESP: ", responseJson);
          if (responseJson["success"] === false) {
            alert.error("Failed deleting auth");
          } else {
            // Need to wait because query in ES is too fast
            setTimeout(() => {
              getAppAuthentication();
            }, 1000);
            //alert.success("Successfully deleted authentication!")
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
            alert.error("Failed stopping schedule");
          } else {
            setTimeout(() => {
              getSchedules();
            }, 1500);
            //alert.success("Successfully stopped schedule!")
          }
        })
      )
      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

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
          //alert.info("Wrong code sent.")
          //alert.info("Wrong code sent. Please try again.")
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          alert.info("Successfully enabled 2fa");

          setTimeout(() => {
            getUsers();

            setImage2FA("");
            setValue2FA("");
            setSecret2FA("");
            setShow2faSetup(false);
            setSelectedUserModalOpen(false);
          }, 1000);
        } else {
          alert.info("Wrong code sent. Please try again.");
          //alert.error("Failed setting 2fa: ", responseJson.reason)
        }
      })
      .catch((error) => {
        alert.info("Wrong code sent. Please try again.");
        //alert.error("Err: " + error.toString())
      });
  };

  const handleStopOrgSync = (org_id) => {
    if (org_id === undefined || org_id === null) {
      alert.error("Couldn't get org " + org_id);
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
          alert.success("Successfully stopped cloud sync");
        } else {
          console.log("Cloud sync fail?");
          alert.error(
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
        alert.error("Err: " + error.toString());
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
          alert.error("Failed to handle sync: " + responseJson.reason);
        } else if (!responseJson.success) {
          alert.error("Failed to handle sync.");
        } else {
          getOrgs();
          if (disableSync) {
            alert.success("Successfully disabled sync!");
            setOrgSyncResponse("Successfully disabled syncronization");
          } else {
            alert.success("Cloud Syncronization successfully set up!");
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
        alert.error("Err: " + error.toString());
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
            alert.error("Failed changing authentication");
          } else {
            //alert.success("Successfully password!")
            setSelectedUserModalOpen(false);
            getAppAuthentication();
          }
        })
      )
      .catch((error) => {
        alert.error("Err: " + error.toString());
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
            alert.error("Failed overwriting appauth in workflows");
          } else {
            alert.success("Successfully updated auth everywhere!");
            setSelectedUserModalOpen(false);
            setTimeout(() => {
              getAppAuthentication();
            }, 1000);
          }
        })
      )
      .catch((error) => {
        alert.error("Err: " + error.toString());
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
              alert.error(responseJson.reason);
            } else {
              alert.error("Failed creating suborg. Please try again");
            }
          } else {
            alert.success("Successfully created suborg. Reloading in 3 seconds!");
            setSelectedUserModalOpen(false);

            setTimeout(() => {
							window.location.reload()
            }, 2500);
          }

          setOrgName("");
          setModalOpen(false);
        })
      )
      .catch((error) => {
        alert.error("Err: " + error.toString());
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
              alert.error(responseJson.reason);
            } else {
              alert.error("Failed setting new password");
            }
          } else {
            alert.success("Successfully updated password!");
            setSelectedUserModalOpen(false);
          }
        })
      )
      .catch((error) => {
        alert.error("Err: " + error.toString());
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
          alert.error("Failed to deactivate user: " + responseJson.reason);
        } else {
          alert.success("Changed activation for user " + data.id);
        }
      })

      .catch((error) => {
        console.log("Error in userdata: ", error);
      });
  };

  const handleGetOrg = (orgId) => {
    if (orgId.length === 0) {
      alert.error(
        "Organization ID not defined. Please contact us on https://shuffler.io if this persists logout."
      );
      return;
    }

    // Just use this one?
    var baseurl = globalUrl;
    const url = baseurl + "/api/v1/orgs/" + orgId;
    fetch(url, {
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
          alert.error("Failed getting org: ", responseJson.readon);
        } else {
          if (
            responseJson.sync_features === undefined ||
            responseJson.sync_features === null
          ) {
            responseJson.sync_features = {};
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
        alert.error("Error getting current organization");
      });
  };

  const inviteUser = (data) => {
    console.log("INPUT: ", data);
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
    alert.info("Setting default env to " + environment.name);
    var newEnv = [];
    for (var key in environments) {
      if (environments[key].id == environment.id) {
        if (environments[key].archived) {
          alert.error("Can't set archived to default");
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
            alert.error(responseJson.reason);
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
            alert.error(responseJson.reason);
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

  const abortEnvironmentWorkflows = (environment) => {
    //console.log("Aborting all workflows started >10 minutes ago, not finished");

    fetch(`${globalUrl}/api/v1/environments/${environment.id}/stop?deleteall=true`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
					alert.error("Failed aborting dangling workflows")
          return;
        } else {
					alert.info("Aborted all dangling workflows")
				}

        return response.json();
      })
      .then((responseJson) => {
        console.log("Got response for execution: ", responseJson);
        //console.log("RESPONSE: ", responseJson)
        //setFiles(responseJson)
      })
      .catch((error) => {
        //alert.error(error.toString())
      });
  };

  const deleteEnvironment = (environment) => {
    // FIXME - add some check here ROFL
    //const name = environment.name

    //alert.info("Modifying environment " + name)
    //var newEnv = []
    //for (var key in environments) {
    //	if (environments[key].Name == name) {
    //		if (environments[key].default) {
    //			alert.error("Can't modify the default environment")
    //			return
    //		}

    //		if (environments[key].type === "cloud" && !environments[key].archived) {
    //			alert.error("Can't modify cloud environments")
    //			return
    //		}

    //		environments[key].archived = !environments[key].archived
    //	}

    //	newEnv.push(environments[key])
    //}
    const id = environment.id;

    //alert.info("Modifying environment " + environment.Name)
    var newEnv = [];
    for (var key in environments) {
      if (environments[key].id == id) {
        if (environments[key].default) {
          alert.error("Can't modify the default environment");
          return;
        }

        if (environments[key].type === "cloud" && !environments[key].archived) {
          alert.error("Can't modify cloud environments");
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
            alert.error(responseJson.reason);
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

  const handleFileUpload = (file_id, file) => {
    //console.log("FILE: ", file_id, file)
    fetch(`${globalUrl}/api/v1/files/${file_id}/upload`, {
      method: "POST",
      credentials: "include",
      body: file,
    })
      .then((response) => {
        if (response.status !== 200 && response.status !== 201) {
          console.log("Status not 200 for apps :O!");
          alert.error("File was created, but failed to upload.")
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("RESPONSE: ", responseJson)
        //setFiles(responseJson)
      })
      .catch((error) => {
        alert.error(error.toString())
      });
  };

  const handleCreateFile = (filename, file) => {
    var data = {
      filename: filename,
      org_id: selectedOrganization.id,
      workflow_id: "global",
    };

		if (selectedNamespace !== undefined && selectedNamespace !== null && selectedNamespace.length > 0 && selectedNamespace !== "default") {
			data.namespace = selectedNamespace
		}

    fetch(globalUrl + "/api/v1/files/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("RESP: ", responseJson)
        if (responseJson.success === true) {
          handleFileUpload(responseJson.id, file);
        } else {
          alert.error("Failed to upload file ", filename);
        }
      })
      .catch((error) => {
				alert.error("Failed to upload file ", filename)
        console.log(error.toString());
      });
  };

  const getFiles = () => {
    fetch(globalUrl + "/api/v1/files", {
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
        if (responseJson.files !== undefined && responseJson.files !== null) {
          setFiles(responseJson.files);
        } else {
          setFiles([]);
        }

        console.log("NAMESPACES: ", responseJson.namespaces);
        if (
          responseJson.namespaces !== undefined &&
          responseJson.namespaces !== null
        ) {
          setFileNamespaces(responseJson.namespaces);
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const deleteFile = (file) => {
    fetch(globalUrl + "/api/v1/files/" + file.id, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for file delete :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
				if (responseJson.success) {
					alert.info("Successfully deleted file "+file.name)
					
				} else if (responseJson.reason !== undefined && responseJson.reason !== null) {
					alert.error("Failed to delete file: " + responseJson.reason)

				}
				setTimeout(() => {
					getFiles();
				}, 1500);

        console.log(responseJson)
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const downloadFile = (file) => {
    fetch(globalUrl + "/api/v1/files/" + file.id + "/content", {
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
          return "";
        }

        return response.text();
      })
      .then((respdata) => {
        if (respdata.length === 0) {
					alert.error("Failed getting file. Is it deleted?");
					return;
        }

        var blob = new Blob([respdata], {
          type: "application/octet-stream",
        });

        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${file.filename}`);
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
          "click",
          true,
          true,
          window,
          1,
          0,
          0,
          0,
          0,
          false,
          false,
          false,
          false,
          0,
          null
        );
        link.dispatchEvent(event);

        //return response.json()
      })
      .then((responseJson) => {
        //console.log(responseJson)
        //setSchedules(responseJson)
      })
      .catch((error) => {
        alert.error(error.toString());
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
        alert.error(error.toString());
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
        if (responseJson.success) {
          //console.log(responseJson.data)
          //console.log(responseJson)
          setAuthentication(responseJson.data);
        } else {
          alert.error("Failed getting authentications");
        }
      })
      .catch((error) => {
        alert.error(error.toString());
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
        alert.error(error.toString());
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
        alert.error(error.toString());
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
        alert.error(error.toString());
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
    4: "schedules",
    5: "environments",
    6: "suborgs",
  };
  const setConfig = (event, inputValue) => {
		const newValue = parseInt(inputValue)

    setCurTab(newValue)
    if (newValue === 1) {
      document.title = "Shuffle - admin - users";
      getUsers();
    } else if (newValue === 2) {
      document.title = "Shuffle - admin - app authentication";
      getAppAuthentication();
    } else if (newValue === 3) {
      document.title = "Shuffle - admin - files";
      getFiles();
    } else if (newValue === 4) {
      document.title = "Shuffle - admin - schedules";
      getSchedules();
    } else if (newValue === 5) {
      document.title = "Shuffle - admin - environments";
      getEnvironments();
    } else if (newValue === 6) {
      document.title = "Shuffle - admin - orgs";
      getOrgs();
    } else {
      document.title = "Shuffle - admin";
    }

  	console.log("NEWVALUE: ", newValue)

    if (newValue === 6) {
      console.log("Should get apps for categories.");
    }

		console.log("PROPS: ", props)

		navigate(`/admin?tab=${views[newValue]}`)

    setModalUser({});
  };

  if (firstRequest) {
    setFirstRequest(false);
    document.title = "Shuffle - admin";
    if (!isCloud) {
      getUsers();
    } else {
      getSettings();
    }	

		if (serverside !== true && window.location.search !== undefined && window.location.search !== null) {
			const urlSearchParams = new URLSearchParams(window.location.search)
			const params = Object.fromEntries(urlSearchParams.entries())
			const foundTab = params["tab"]
			if (foundTab !== null && foundTab !== undefined) {
				for (var key in Object.keys(views)) {
					const value = views[key]
					console.log(key, value)
					if (value === foundTab) {
						setConfig("", key)
						break
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
          alert.error("Failed setting user: " + responseJson.reason);
        } else {
          alert.success("Set the user field " + field + " to " + value);

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

    fetch(globalUrl + "/api/v1/generateapikey", {
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
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        } else {
          getUsers();
        }

        return response.json();
      })
      .then((responseJson) => {
        console.log("RESP: ", responseJson);
        if (!responseJson.success && responseJson.reason !== undefined) {
          alert.error("Failed getting new: " + responseJson.reason);
        } else {
          alert.success("Got new API key");
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
              alert.error("All fields must have a new value");
            } else {
              alert.success("Saving new version of this authentication");
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
			alert.info("Can't remove orgs from yourself")
			return
		}

		console.log("event: ", event.target.value)
		setMatchingOrganizations(event.target.value)
		// Workaround for empty orgs
		if (event.target.value.length === 0) {
			event.target.value.push("REMOVE")
		}

  	setUser(selectedUser.id, "suborgs", event.target.value)
  	//setUser(selectedUser.id, "suborgs", matchingOrganizations)
	}

	const userOrgEdit = selectedUser.id !== undefined && selectedUser.orgs !== undefined && selectedUser.orgs !== null && selectedOrganization.child_orgs !== undefined && selectedOrganization.child_orgs !== null && selectedOrganization.child_orgs.length > 0 ?
		<FormControl fullWidth sx={{ m: 1,}}>
			<InputLabel id="demo-multiple-checkbox-label" style={{padding: 5}}>Accessible Sub-Organizations ({selectedUser.orgs? selectedUser.orgs.length-1 : 0})</InputLabel>
			<Select
				fullWidth
				style={{width: "100%", }}
				disabled={selectedUser.id === userdata.id}
				labelId="demo-multiple-checkbox-label"
				id="demo-multiple-checkbox"
				multiple
				value={matchingOrganizations}
				onChange={handleOrgEditChange}
				input={
					<OutlinedInput label="Tag" />
				}
				renderValue={(selected) => {
					return selected.join(', ')
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
		: null

  const editUserModal = (
    <Dialog
      open={selectedUserModalOpen}
      onClose={() => {
        setSelectedUserModalOpen(false);
				setImage2FA("");
				setSecret2FA("");
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
							deleteUser(selectedUser)
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
              (selectedUser.role === "admin" && selectedUser.username !== userdata.username)
            }
            variant="outlined"
            color="primary"
          >
            { selectedUser.mfa_info !== undefined &&
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
    );

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
            backgroundColor: theme.palette.inputColor,
            color: "white",
            minHeight: expanded ? 200 : "inherit",
            maxHeight: expanded ? 200 : "inherit",
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
                Usage:{" "}
                {props.data.limit === 0 ? (
                  "Infinite"
                ) : (
                  <span>
                    {props.data.usage} / {props.data.limit}
                  </span>
                )}
              </Typography>
              <Typography>
                Data sharing: {props.data.data_collection}
              </Typography>
              <Typography>Description: {secondary}</Typography>
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
      icon: <PolymerIcon style={{ color: itemColor }} />,
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
      <DialogContent>
        What does{" "}
        <a
          href="https://shuffler.io/docs/organizations#cloud_sync"
          target="_blank"
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

  const cancelSubscriptions = (subscription_id) => {
    console.log(selectedOrganization);
    const orgId = selectedOrganization.id;
    const data = {
      subscription_id: subscription_id,
      action: "cancel",
      org_id: selectedOrganization.id,
    };

    const url = globalUrl + `/api/v1/orgs/${orgId}`;
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
      .then(function (response) {
        if (response.status !== 200) {
          console.log("Error in response");
        }

        handleGetOrg(selectedOrganization.id);
        return response.json();
      })
      .then(function (responseJson) {
        if (responseJson.success !== undefined && responseJson.success) {
          alert.success("Successfully stopped subscription!");
        } else {
          alert.error("Failed stopping subscription. Please contact us.");
        }
      })
      .catch(function (error) {
        console.log("Error: ", error);
        alert.error("Failed stopping subscription. Please contact us.");
      });
  };

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
              href="https://shuffler.io/docs/organizations#organization"
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
                      alert.error("Can only copy over HTTPS (port 3443)");
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

                    alert.info(org_id + " copied to clipboard");
                  }
                }}
              >
                <FileCopyIcon style={{ color: "rgba(255,255,255,0.8)" }} />
              </IconButton>
            </Tooltip>
            {selectedOrganization.name.length > 0 ? (
              <OrgHeader
                isCloud={isCloud}
                userdata={userdata}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
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
            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />
            <Typography
              variant="h6"
              style={{ marginBottom: "10px", color: "white" }}
            >
              Cloud syncronization
            </Typography>
            What does{" "}
            <a
              href="https://shuffler.io/docs/organizations#cloud_sync"
              target="_blank"
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
                      disabled={true}
                      autoComplete="cloud apikey"
                      id="apikey_field"
                      margin="normal"
                      placeholder="Cloud Apikey"
                      variant="outlined"
                      defaultValue={userSettings.apikey}
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
            <Typography
              style={{ marginTop: 40, marginLeft: 10, marginBottom: 5 }}
            >
              Cloud sync features
            </Typography>
            <Grid container style={{ width: "100%", marginBottom: 15 }}>
              {selectedOrganization.sync_features === undefined ||
              selectedOrganization.sync_features === null
                ? null
                : Object.keys(selectedOrganization.sync_features).map(function (
                    key,
                    index
                  ) {
                    if (key === "schedule") {
                      return null;
                    }

                    const item = selectedOrganization.sync_features[key];
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
                      usage: 0,
                      data_collection: "None",
                      active: item.active,
                      icon: <PolymerIcon style={{ color: itemColor }} />,
                    };

                    return (
                      <Zoom key={index}>
                        <GridItem data={griditem} />
                      </Zoom>
                    );
                  })}
            </Grid>
            <Divider
              style={{
                marginTop: 20,
                marginBottom: 20,
                backgroundColor: theme.palette.inputColor,
              }}
            />
            {isCloud &&
            selectedOrganization.subscriptions !== undefined &&
            selectedOrganization.subscriptions !== null &&
            selectedOrganization.subscriptions.length > 0 ? (
              <div style={{ marginTop: 30, marginBottom: 20 }}>
                <Typography
                  style={{ marginTop: 40, marginLeft: 10, marginBottom: 5 }}
                >
                  Your subscription
                  {selectedOrganization.subscriptions.length > 1 ? "s" : ""}
                </Typography>
                <Grid container spacing={3} style={{ marginTop: 15 }}>
                  {selectedOrganization.subscriptions
                    .reverse()
                    .map((sub, index) => {
                      return (
                        <Grid item key={index} xs={4}>
                          <Card
                            elevation={6}
                            style={{
                              backgroundColor: theme.palette.inputColor,
                              color: "white",
                              padding: 25,
                              textAlign: "left",
                            }}
                          >
                            <b>Type</b>: {sub.level}
                            <div />
                            <b>Recurrence</b>: {sub.recurrence}
                            <div />
                            {sub.active ? (
                              <div>
                                <b>Started</b>:{" "}
                                {new Date(sub.startdate * 1000).toISOString()}
                                <div />
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  style={{ marginTop: 15 }}
                                  onClick={() => {
                                    cancelSubscriptions(sub.reference);
                                  }}
                                >
                                  Cancel subscription
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <b>Cancelled</b>:{" "}
                                {new Date(
                                  sub.cancellationdate * 1000
                                ).toISOString()}
                                <div />
                                <Typography color="textSecondary">
                                  <b>Status</b>: Deactivated
                                </Typography>
                              </div>
                            )}
                          </Card>
                        </Grid>
                      );
                    })}
                </Grid>
                <Divider
                  style={{
                    marginTop: 20,
                    backgroundColor: theme.palette.inputColor,
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        <div style={{ backgroundColor: "#1f2023", paddingTop: 25 }}>
          <HandlePayment
            theme={theme}
            stripeKey={props.stripeKey}
            userdata={userdata}
            globalUrl={globalUrl}
            {...props}
          />
        </div>
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
            : curTab === 6
            ? "Add Sub-Organization"
            : "Add environment"}
        </span>
      </DialogTitle>
      <DialogContent>
        {curTab === 1 && isCloud ? (
          <Typography variant="body1" style={{ marginBottom: 10 }}>
            We'll send an email to invite them to your organization.
          </Typography>
        ) : curTab === 6 ? (
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
        ) : curTab === 6 ? (
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
        ) : curTab === 5 ? (
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
            } else if (curTab === 6) {
              createSubOrg(selectedOrganization.id, orgName);
            } else if (curTab === 5) {
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
              href="https://shuffler.io/docs/organizations#user_management"
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
						{selectedOrganization.child_orgs !== undefined && selectedOrganization.child_orgs !== null && selectedOrganization.child_orgs.length > 0 ?
							<ListItemText
								primary="Suborgs"
								style={{ minWidth: 100, maxWidth: 100 }}
							/>
						: null}
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
                                    alert.error(
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

                                  alert.info("Apikey copied to clipboard");
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
										{selectedOrganization.child_orgs !== undefined && selectedOrganization.child_orgs !== null && selectedOrganization.child_orgs.length > 0 ?
											<ListItemText 
												style={{ display: "flex" }}
                      	primary={data.orgs === undefined || data.orgs === null ? 0 : data.orgs.length-1}
											/>
										: null}
										<ListItemText style={{ display: "flex" }}>
                      <IconButton
                        onClick={() => {
                          setSelectedUserModalOpen(true);
                          setSelectedUser(data);

													// Find matching orgs between current org and current user's access to those orgs
          								if (userdata.orgs !== undefined && userdata.orgs !== null && userdata.orgs.length > 0 && selectedOrganization.child_orgs !== undefined && selectedOrganization.child_orgs !== null && selectedOrganization.child_orgs.length > 0) {
														console.log("In here?")
														var active = []
														for (var key in userdata.orgs) {
															console.log("ORG: ", userdata.orgs[key])
															const found = selectedOrganization.child_orgs.find(item => item.id === userdata.orgs[key].id)
															if (found !== null && found !== undefined) {

																if (data.orgs === undefined || data.orgs === null) {
																	continue
																} 

																const subfound = data.orgs.find(item => item === found.id)
																if (subfound !== null && subfound !== undefined) {
																	active.push(subfound)
																}
															}
														}

														setMatchingOrganizations(active)
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
    console.log("2fa: ", data, show2faSetup);
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

  const uploadFiles = (files) => {
    for (var key in files) {
      try {
        const filename = files[key].name;
        var filedata = new FormData();
        filedata.append("shuffle_file", files[key]);

        if (typeof files[key] === "object") {
          handleCreateFile(filename, filedata);
        }

        /*
				reader.addEventListener('load', (e) => {
					var data = e.target.result;
					setIsDropzone(false)
					console.log(filename)	
					console.log(data)
					console.log(files[key])
				})
				reader.readAsText(files[key])
				*/
      } catch (e) {
        console.log("Error in dropzone: ", e);
      }
    }

    setTimeout(() => {
      getFiles();
    }, 2500);
  };

  const uploadFile = (e) => {
    const isDropzone =
      e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
    const files = isDropzone ? e.dataTransfer.files : e.target.files;

    //const reader = new FileReader();
    //alert.info("Starting fileupload")
    uploadFiles(files);
  };

  const filesView =
    curTab === 3 ? (
      <Dropzone
        style={{
          maxWidth: window.innerWidth > 1366 ? 1366 : 1200,
          margin: "auto",
          padding: 20,
        }}
        onDrop={uploadFile}
      >
        <div>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <h2 style={{ display: "inline" }}>Files</h2>
            <span style={{ marginLeft: 25 }}>
              Files from Workflows.{" "}
              <a
                target="_blank"
                href="https://shuffler.io/docs/organizations#files"
                style={{ textDecoration: "none", color: "#f85a3e" }}
              >
                Learn more
              </a>
            </span>
          </div>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              upload.click();
            }}
          >
            <PublishIcon /> Upload files
          </Button>
          <input
            hidden
            type="file"
            multiple
            ref={(ref) => (upload = ref)}
            onChange={(event) => {
              //const file = event.target.value
              //const fileObject = URL.createObjectURL(actualFile)
              //setFile(fileObject)
              //const files = event.target.files[0]
              uploadFiles(event.target.files);
            }}
          />
          <Button
            style={{ marginLeft: 5, marginRight: 15 }}
            variant="contained"
            color="primary"
            onClick={() => getFiles()}
          >
            <CachedIcon />
          </Button>

          {fileNamespaces !== undefined &&
          fileNamespaces !== null &&
          fileNamespaces.length > 1 ? (
            <FormControl style={{minWidth: 150, maxWidth: 150,}}>
              <InputLabel id="input-namespace-label">File Category</InputLabel>
              <Select
                labelId="input-namespace-select-label"
                id="input-namespace-select-id"
                style={{ color: "white", minWidth: 150, maxWidth: 150, float: "right" }}
                value={selectedNamespace}
                onChange={(event) => {
                  console.log("CHANGE NAMESPACE: ", event.target);
                  setSelectedNamespace(event.target.value);
                }}
              >
                {fileNamespaces.map((data, index) => {
                  return (
                    <MenuItem
                      key={index}
                      value={data}
                      style={{ color: "white" }}
                    >
                      {data}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          ) : null}

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
                primary="Created"
                style={{ maxWidth: 225, minWidth: 225 }}
              />
              <ListItemText
                primary="Name"
                style={{
                  maxWidth: 150,
                  minWidth: 150,
                  overflow: "hidden",
                  marginLeft: 10,
                }}
              />
              <ListItemText
                primary="Workflow"
                style={{ maxWidth: 100, minWidth: 100, overflow: "hidden" }}
              />
              <ListItemText
                primary="Md5"
                style={{ minWidth: 300, maxWidth: 300, overflow: "hidden" }}
              />
              <ListItemText
                primary="Status"
                style={{ minWidth: 75, maxWidth: 75, marginLeft: 10 }}
              />
              <ListItemText
                primary="Filesize"
                style={{ minWidth: 125, maxWidth: 125 }}
              />
              <ListItemText primary="Actions" />
            </ListItem>
            {files === undefined || files === null || files.length === 0
              ? null
              : files.map((file, index) => {
                  if (file.namespace === "") {
                    file.namespace = "default";
                  }

                  if (file.namespace !== selectedNamespace) {
                    return null;
                  }

                  var bgColor = "#27292d";
                  if (index % 2 === 0) {
                    bgColor = "#1f2023";
                  }

                  return (
                    <ListItem key={index} style={{ backgroundColor: bgColor, maxHeight: 100, overflow: "hidden",}}>
                      <ListItemText
                        style={{
                          maxWidth: 225,
                          minWidth: 225,
                          overflow: "hidden",
                        }}
                        primary={new Date(file.created_at * 1000).toISOString()}
                      />
                      <ListItemText
                        style={{
                          maxWidth: 150,
                          minWidth: 150,
                          overflow: "hidden",
                          marginLeft: 10,
                        }}
                        primary={file.filename}
                      />
                      <ListItemText
                        primary={
                          file.workflow_id === "global" ? (
                            <IconButton
                              disabled={file.workflow_id === "global"}
                            >
                              <OpenInNewIcon
                                style={{
                                  color:
                                    file.workflow_id !== "global"
                                      ? "white"
                                      : "grey",
                                }}
                              />
                            </IconButton>
                          ) : (
                            <Tooltip
                              title={"Go to workflow"}
                              style={{}}
                              aria-label={"Download"}
                            >
                              <span>
                                <a
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: "#f85a3e",
                                  }}
                                  href={`/workflows/${file.workflow_id}`}
                                  target="_blank"
                                >
                                  <IconButton
                                    disabled={file.workflow_id === "global"}
                                  >
                                    <OpenInNewIcon
                                      style={{
                                        color:
                                          file.workflow_id !== "global"
                                            ? "white"
                                            : "grey",
                                      }}
                                    />
                                  </IconButton>
                                </a>
                              </span>
                            </Tooltip>
                          )
                        }
                        style={{
                          minWidth: 100,
                          maxWidth: 100,
                          overflow: "hidden",
                        }}
                      />
                      <ListItemText
                        primary={file.md5_sum}
                        style={{
                          minWidth: 300,
                          maxWidth: 300,
                          overflow: "hidden",
                        }}
                      />
                      <ListItemText
                        primary={file.status}
                        style={{
                          minWidth: 75,
                          maxWidth: 75,
                          overflow: "hidden",
                          marginLeft: 10,
                        }}
                      />
                      <ListItemText
                        primary={file.filesize}
                        style={{
                          minWidth: 125,
                          maxWidth: 125,
                          overflow: "hidden",
                        }}
                      />
                      <ListItemText
                        primary=
												<span style={{display: "flex"}}>
													<Tooltip
														title={"Download file"}
														style={{}}
														aria-label={"Download"}
													>
                          <span>
                            <IconButton
                              disabled={file.status !== "active"}
                              onClick={() => {
                                downloadFile(file);
                              }}
                            >
                              <CloudDownloadIcon
                                style={{
                                  color:
                                    file.status === "active" ? "white" : "grey",
                                }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>
												<Tooltip
                          title={"Delete file"}
                          style={{}}
                          aria-label={"Delete"}
                        >
                          <span>
                            <IconButton
                              disabled={file.status !== "active"}
                              onClick={() => {
                                deleteFile(file);
                              }}
                            >
                              <DeleteIcon
                                style={{
                                  color:
                                    file.status === "active" ? "white" : "grey",
                                }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>
												<Tooltip
                          title={"Copy file ID"}
                          style={{}}
                          aria-label={"copy"}
                        >
													<IconButton
														onClick={() => {
															const elementName = "copy_element_shuffle";
															var copyText = document.getElementById(elementName);
															if (copyText !== null && copyText !== undefined) {
																const clipboard = navigator.clipboard;
																if (clipboard === undefined) {
																	alert.error(
																		"Can only copy over HTTPS (port 3443)"
																	);
																	return;
																}

																navigator.clipboard.writeText(file.id);
																copyText.select();
																copyText.setSelectionRange(
																	0,
																	99999
																); /* For mobile devices */

																/* Copy the text inside the text field */
																document.execCommand("copy");

																alert.info(file.id + " copied to clipboard");
															}
														}}
													>
														<FileCopyIcon style={{ color: "white" }} />
													</IconButton>
												</Tooltip>
												</span>
                        style={{
                          minWidth: 150,
                          maxWidth: 150,
                          overflow: "hidden",
                        }}
                      />
                    </ListItem>
                  );
                })}
          </List>
        </div>
      </Dropzone>
    ) : null;

  const schedulesView =
    curTab === 4 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Schedules</h2>
          <span style={{ marginLeft: 25 }}>
            Schedules used in Workflows. Makes locating and control easier.{" "}
            <a
              target="_blank"
              href="https://shuffler.io/docs/organizations#schedules"
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
                        schedule.environment === "cloud" ? (
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
                        >
                          {schedule.workflow_id}
                        </a>
                      }
                    />
                    <ListItemText
                      primary={schedule.argument}
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
    curTab === 7 ? (
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
            Control the authentication options for individual apps.{" "}
            PS: Actions performed here can be destructive!
          </span>
          &nbsp;
          <a
            target="_blank"
            href="https://shuffler.io/docs/organizations#app_authentication"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            Learn more about authentication
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
										"key": "url",
										"value": "Secret. Replaced during app execution!",
									},
									{
										"key": "client_id",
										"value": "Secret. Replaced during app execution!",
									},
									{
										"key": "client_secret",
										"value": "Secret. Replaced during app execution!",
									},
									{
										"key": "scope",
										"value": "Secret. Replaced during app execution!",
									}]
								}

                return (
                  <ListItem key={index} style={{ backgroundColor: bgColor }}>
                    <ListItemText
                      primary=<img
                        alt=""
                        src={data.app.large_image}
                        style={{ maxWidth: 50, borderRadius: theme.palette.borderRadius, }}
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

  const environmentView =
    curTab === 5 ? (
      <div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ display: "inline" }}>Environments</h2>
          <span style={{ marginLeft: 25 }}>
            Decides what Orborus environment to execute an action in a workflow
            in.{" "}
            <a
              target="_blank"
              href="https://shuffler.io/docs/organizations#environments"
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
              primary="Type"
              style={{ minWidth: 150, maxWidth: 150 }}
            />
            <ListItemText
              primary="Default"
              style={{ minWidth: 125, maxWidth: 125}}
            />
            <ListItemText
              primary="Disabled"
              style={{ minWidth: 100, maxWidth: 100 }}
            />
            <ListItemText
              primary="Last Changed"
              style={{ minWidth: 170, maxWidth: 170}}
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
                  getEnvironments();
                  return null;
                }

                var bgColor = "#27292d";
                if (index % 2 === 0) {
                  bgColor = "#1f2023";
                }

                return (
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
                            ? "Not running"
                            : environment.running_ip
                          : "N/A"
                      }
                      style={{
                        minWidth: 200,
                        maxWidth: 200,
                        overflow: "hidden",
                      }}
                    />
                    <ListItemText
                      primary={environment.Type}
                      style={{ minWidth: 150, maxWidth: 150 }}
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
                          style={{ borderRadius: "0px", marginRight: 5,}}
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
                        <Button
                          variant={
                            environment.archived ? "contained" : "outlined"
                          }
                          style={{ borderRadius: "0px" }}
                          onClick={() => deleteEnvironment(environment)}
                          color="primary"
                        >
                          {environment.archived ? "Activate" : "Disable"}
                        </Button>
                        <Button variant={"outlined"} style={{borderRadius: "0px"}} onClick={() => {
														console.log("Should clear executions for: ", environment)
														abortEnvironmentWorkflows(environment)
												}} color="primary">Clear executions</Button>
                      </div>
                    </ListItemText>
                  </ListItem>
                );
              })}
        </List>
      </div>
    ) : null;

  const organizationsTab =
    curTab === 6 ? (
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
    curTab === 7 ? (
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
              primary="Orborus running"
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

  // primary={environment.Registered ? "true" : "false"}

  const iconStyle = { marginRight: 10 };
  const data =  (
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
						disabled={userdata.admin !== "true"}
            label=<span>
              <ScheduleIcon style={iconStyle} />
              Schedules
            </span>
          />
					<Tab
						index={5}
						disabled={userdata.admin !== "true"}
						label=<span>
							<EcoIcon style={iconStyle} />
							Environments
						</span>
					/>
					<Tab
						index={6}
						value={6}
						label=<span>
							<BusinessIcon style={iconStyle} /> Organizations
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
