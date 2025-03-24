import React, { useState, useEffect, useContext } from "react";

import theme from "../theme.jsx";
import ReactGA from "react-ga4";
import Markdown from "react-markdown";
import algoliasearch from "algoliasearch/lite";
import ReactJson from "react-json-view-ssr";
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import { makeStyles, createStyles } from "@mui/styles";
import { useParams, useNavigate, Link } from "react-router-dom";

import {
  Autocomplete,
  Box,
  Zoom,
  Card,
  CardActionArea,
  Fade,
  Tabs,
  Tab,
  CircularProgress,
  DialogActions,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  IconButton,
  Menu,
  Paper,
  Button,
  Typography,
  Divider,
  MenuItem,
  Avatar,
  TextField,
  Breadcrumbs,
  Checkbox,
  Chip,
  Select,
} from "@mui/material";

import {
  Business as BusinessIcon,
  Edit as EditIcon,
  CloudDownload as CloudDownloadIcon,
  Warning as WarningIcon,
  VerifiedUser as VerifiedUserIcon,
  Close as CloseIcon,
  LockOpen as LockOpenIcon,
  PlayArrow as PlayArrowIcon,
  GetApp as GetAppIcon,
  Apps as AppsIcon,
  Description as DescriptionIcon,
  ShowChart as ShowChartIcon,
  Person as PersonIcon,
  Polyline as PolylineIcon,
  OpenInNew as OpenInNewIcon, 
} from "@mui/icons-material";

import ForkRightIcon from '@mui/icons-material/ForkRight';

import Alert from "@mui/material/Alert";
import { Context } from "../context/ContextApi.jsx";

import {
  SearchBox,
  StaticRefinementList,
  RefinementList,
  InstantSearch,
  connectSearchBox,
  connectHits,
  Index,
} from "react-instantsearch-dom";
import AppStats from "../components/AppStats.jsx";
import ParsedAction from "../components/ParsedAction.jsx";
import { validateJson, GetIconInfo } from "../views/Workflows.jsx";
import { base64_decode, appCategories } from "../views/AppCreator.jsx";
import { triggers as workflowTriggers } from "../views/AngularWorkflow.jsx";
import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import AuthenticationWindow from "../components/AuthenticationWindow.jsx";
import { CodeHandler, Img, OuterLink, CopyToClipboard, } from "../views/Docs.jsx";
import { useStyles, } from "../components/ParsedAction.jsx";
import { sortByKey } from "../views/AngularWorkflow.jsx";

import { v4 as uuidv4 } from "uuid";
import aa from "search-insights";

const surfaceColor = "#27292D";
const inputColor = "#383B40";

const chipStyle = {
  marginTop: 5,
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

const actionListStyle = {
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 10,
  marginTop: 5,
  backgroundColor: inputColor,
  display: "flex",
  color: "white",
  maxWidth: 350,
  minWidth: 350,
  maxHeight: 54,
  overflow: "hidden",
};

const boxStyle = {
  color: "white",
  flex: "3",
  margin: 10,
  paddingLeft: 30,
  paddingRight: 30,
  paddingBottom: 30,
  paddingTop: 30,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  maxHeight: 180,
  overflow: "hidden",
};

const buttonBackground = "linear-gradient(to right, #f86a3e, #f34079)";


// AppTypes:
// 0 = OpenAPI (VALID)
// 1 = Normal app (Python)
// 2 = OpenAPI (Invalid)
const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
)

const AppExplorer = (props) => {
  const {
    globalUrl,
    userdata,
    setUserData,
    checkLogin,
    isLoaded,
    selectedApp,
    serverside,
    isMobile,
    isLoggedIn,
    selectedDoc,
    secondApp,
  } = props;

  //const alert = useAlert();
  const classes = useStyles()
  let navigate = useNavigate()

  const { leftSideBarOpenByClick, } = useContext(Context);

  const params = useParams();
  //var props = JSON.parse(JSON.stringify(defaultprops))
  //props.match = {}
  //params = params

  const bodyDivStyle = {
    margin: "auto",
    maxWidth: isMobile ? "100%" : 1350,
    scrollX: "hidden",
    overflowX: "hidden",
  };

  var upload = "";
  const actionNonBodyRequest = ["GET", "HEAD", "DELETE", "CONNECT"];
  const authenticationOptions = [
    "No authentication",
    "API key",
    "Bearer auth",
    "Basic auth",
  ];
  const apikeySelection = ["Header", "Query"];

  const [app, setApp] = useState({});

  const [openapi, setOpenapi] = useState({});
  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [contact, setContact] = useState("");
  const [file] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [, setDescription] = useState("");
  const [, setBaseUrl] = useState("");
  const [, setAuthenticationRequired] = useState(false);
  const [, setAuthenticationOption] = useState(authenticationOptions[0]);
  const [newWorkflowTags, setNewWorkflowTags] = React.useState([]);
  const [, setParameterName] = useState("");
  const [, setParameterLocation] = useState(
    apikeySelection.length > 0 ? apikeySelection[0] : ""
  );
  const [, setUrlPath] = useState("");
  const [urlPathQueries, setUrlPathQueries] = useState([]);
  const [, setBasedata] = React.useState({});
  const [actions, setActions] = useState([]);
  const [errorCode] = useState("");
  const [reloadUrl, setReloadUrl] = React.useState(
    serverside === true ? "" : window.location.href
  );
  const [relatedWorkflows, setRelatedWorkflows] = useState(0);
  const [relatedApps, setRelatedApps] = useState(0);
  const [appAuthentication, setAppAuthentication] = React.useState([]);
  const [authLoaded, setAuthLoaded] = useState(false);
  const baseResult = "The execution result will show up here";
  const [anchorElAvatar, setAnchorElAvatar] = React.useState(null);
  const [executionResult, setExecutionResult] = useState({
    valid: false,
    result: baseResult,
  });
  const [executing, setExecuting] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [creatorProfile, setCreatorProfile] = React.useState({});
  const [selectedTab, setSelectedTab] = React.useState(0);
  const defaultDocs = `\n\n## No Shuffle-specific app documentation is available yet.\n\n## Need more information about the app? [Contact us](/contact) and [Join the Community](https://discord.gg/B2CBzUm) and find others using this app.`
  const [sharingConfiguration, setSharingConfiguration] = React.useState("you");
  const [appdata, setAppData] = React.useState({});
  const [appDocumentation, setAppDocumentation] = useState(defaultDocs)
  const [secondaryApp, setSecondaryApp] = useState({});
  const [firstRequest, setFirstRequest] = useState(true);
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);

  const [categories, setCategories] = useState(appCategories)
  const [newWorkflowCategories, setNewWorkflowCategories] = React.useState([]);
  const [update, setUpdate] = useState("");
  const [triggers, setTriggers] = useState([])
  const [selectedOrganization, setSelectedOrganization] = React.useState(undefined)
  const [selectedValidationAction, setSelectedValidationAction] = React.useState({})

  const [selectedMeta, setSelectedMeta] = React.useState({
    link: "https://github.com/Shuffle/openapi-apps/new/master/docs",
    read_time: 1,
  })

  const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");


  // FIXME: This is used, as useEffect() creates an issue with apps not loading at all
  var to_be_copied = "";

  // 0 = VALID OpenAPI, 1 = Python, 2 = INVALID OpenAPI
  const [appType, setAppType] = React.useState(0);

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }


  const loadOrganization = (orgId) => {
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
		}

        return response.json();
      })
      .then((responseJson) => {
		  if (responseJson.success === false) {

		  } else {
		  	setSelectedOrganization(responseJson)
		  }
	  })
	  .catch((error) => {
		  console.log("Error in fetching organization: ", error)
	  })
  }


 useEffect(() => {
    if (selectedApp !== undefined && selectedApp !== null && Object.getOwnPropertyNames(selectedApp).length > 0) {
      //console.log("Firstrequest!!!")
    } else {
      if (serverside) {
        console.log("Not getting app because serverside.");
      } else {
        if (params.appid.length === 32 || params.appid.length === 36) {
          handleEditApp(params.appid);
          runAlgoliaAppSearch(params.appid, false, true);
        } else {
          runAlgoliaAppSearch(params.appid);

          //handleEditApp()
        }
      }
      //parseIncomingOpenapiData(YAML.parse(data))
    }

    if (serverside !== true) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const queries = Object.fromEntries(urlSearchParams.entries());
      const foundTab = queries["tab"];
      console.log("PROPS: ", queries);

      if (params.integrationid !== undefined) {
        console.log(
          "Should search for connection integration with ",
          params.integrationid
        );
        setSelectedTab(3);

        runAlgoliaAppSearch(params.integrationid, false);
      } else if (foundTab !== null && foundTab !== undefined) {
        if (foundTab === "stats") {
          setSelectedTab(2);
        } else if (foundTab === "run") {
          setSelectedTab(1);
        } else if (foundTab === "docs" || foundTab === "documentation") {
          setSelectedTab(0);
        }
      } else {
        //setSelectedTab(1);
      }

    }
  }, []);

  if (serverside === false && firstRequest && isLoggedIn === true && selectedOrganization === undefined && userdata !== undefined && userdata.active_org !== undefined && userdata.active_org !== null && userdata.active_org.id !== undefined && userdata.active_org.id !== null) {
  	  loadOrganization(userdata.active_org.id) 
  }

  var activateButton = (
    <Link to={`/apps/new?id=${appId}`} style={{ textDecoration: "none" }}>
      <Button
        variant="contained"
        component="label"
        color="primary"
        onClick={() => {
          ReactGA.event({
            category: "Appexplorer",
            action: "app_build",
            label: params.appid,
          });
          toast("INTERESTED!");
        }}
        style={{
          padding: 15,
          marginTop: 15,
          borderRadius: 25,
          height: 50,
          margin: "15px 0px 15px 0px",
          fontSize: 14,
          color: "white",
          backgroundImage: buttonBackground,
          width: "200px",
        }}
      >
        I'm interested
      </Button>
    </Link>
    );

  const Heading = (props) => {
    const element = React.createElement(`h${props.level}`,{ style: { marginTop: props.level === 1 ? 20 : 50 } },props.children);
    
    const [hover, setHover] = useState(false);

    var extraInfo = "";
    if (props.level === 1) {
      extraInfo = (
        <div
          style={{
            backgroundColor: theme.palette.inputColor,
            padding: 15,
            borderRadius: theme.palette?.borderRadius,
            marginBottom: 30,
            display: "flex",
          }}
        >
          <div
            style={{
              flex: 3,
              display: "flex",
              vAlign: "center",
              position: "sticky",
              top: 50,
            }}
          >
            {isMobile === true ? null : (
              <Typography style={{ display: "inline", marginTop: 6 }}>
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href={selectedMeta.link}
                  style={{ textDecoration: "none", color: "#f85a3e" }}
				  onClick={() => {
					ReactGA.event({
						category: "Appexplorer",
						action: "github_docs_edit_click",
						label: params.appid,
					});
				  }}
                >
                  <Button style={{}} variant="outlined">
                    <EditIcon /> &nbsp;&nbsp;Edit
                  </Button>
                </a>
              </Typography>
            )}
            {isMobile === true ? null : (
              <div
                style={{
                  height: "100%",
                  width: 1,
                  backgroundColor: "white",
                  marginLeft: 50,
                  marginRight: 50,
                }}
              />
            )}
            <Typography style={{ display: "inline", marginTop: 11 }}>
              {selectedMeta.read_time} minute
              {selectedMeta.read_time === 1 ? "" : "s"} to read
            </Typography>
          </div>

          <div style={{ flex: 2 }}>
            {isMobile === true ||
            selectedMeta.contributors === undefined ||
            selectedMeta.contributors === null ? (
              ""
            ) : (
              <div style={{ margin: 10, height: "100%", display: "inline" }}>
                {selectedMeta.contributors.slice(0, 7).map((data, index) => {
                  return (
                    <a
                      key={index}
                      rel="noopener noreferrer"
                      target="_blank"
                      href={data.url}
                      target="_blank"
                      style={{ textDecoration: "none", color: "#f85a3e" }}
                    >
                      <Tooltip title={data.url} placement="bottom">
                        <img
                          alt={data.url}
                          src={data.image}
                          style={{
                            marginTop: 5,
                            marginRight: 10,
                            height: 40,
                            borderRadius: 40,
                          }}
                        />
                      </Tooltip>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

		// Still inside Heading
		
		// Find appCategory in appCategories
		const appCategory = newWorkflowCategories.length === 0 ? "" : (newWorkflowCategories[0]).toLowerCase();
		const foundCategory = appCategories.find((category) => {
			if (category.name.toLowerCase() === appCategory) {
				return category
			}
		})
		const bgColor = foundCategory === undefined ? "" : foundCategory.color

		const getAllLabels = () => {
			const actionLabels = actions.filter((input_action) => {
				return input_action.action_label !== undefined && input_action.action_label !== null && input_action.action_label !== "No Label"
			})

			var labels = []
			actionLabels.forEach((action) => {
				labels.push(action.action_label)
			})

			return labels
		}

		const allLabels = getAllLabels()

		const findRelevantAction = (action_label) => {
			const foundAction = actions.find((input_action) => {
				if (input_action.action_label.toLowerCase() === action_label.toLowerCase()) {
					return input_action
				}
			})

			if (foundAction !== undefined) {
				setCurrentAction(foundAction)
				setCurrentActionMethod(foundAction.method);
				setSelectedTab(1);
			} else {
				console.log("Could not find action with label: ", action_label)
			}
		}

		// Parses out extra category info and such for the app
		const extraAppInfo = props.level === 1 ? 
			<div style={{marginBottom: 15, }}>
				{/*
				<div style={{display: "flex" }}>
					<Typography style={{width: 100, }}>
						Category: 
					</Typography>
					<Chip
						style={{
							backgroundColor: bgColor,
							color: "white",
							borderRadius: 5,
							minWidth: 80,
							marginRight: 10,
							marginTop: 2,
							cursor: "pointer",
							fontSize: 14,
						}}
						label={appCategory}
					/>
				</div>
				*/}
				{triggers.length === 0 ? null :
					<div style={{display: "flex", marginTop: 10,  }}>
						{triggers.map((trigger, index) => {

							return (
								<Chip
									key={index}
									onClick={() => {
										console.log("Clicked: ", trigger.name)
									}}
									style={{
										cursor: "pointer", 
										color: "white",
										borderRadius: 40,
										minWidth: 80,
										marginRight: 10,
										marginTop: 2,
										fontSize: 14,
									}}
									avatar={<Avatar alt={trigger.name} src={trigger.large_image} />}
									label={trigger.name}
								/>
							)
						})}
					</div>
				}

				{serverside === false && foundCategory !== undefined && foundCategory !== null && foundCategory.action_labels.length > 0 ?
					<div style={{display: "flex", marginTop: 10,  }}>
						{foundCategory.action_labels.slice(0,5).map((action_label, index) => {
							const included = allLabels.includes(action_label)
              const iconInfo = GetIconInfo({ name: action_label });
              const useIcon = iconInfo.originalIcon;

							return (
								<Chip
									key={index}
									onClick={() => {
										findRelevantAction(action_label)
									}}
									disabled={included === false}
									style={{
										cursor: included ? "pointer" : "default",
										color: "white",
										borderRadius: 40,
										minWidth: 80,
										marginRight: 10,
										marginTop: 2,
										fontSize: 14,
										textDecoration: included ? "none" : "line-through",
									}}
									avatar={useIcon}
									label={action_label}
								/>
							)
						})}
					</div>
				: null}
			</div>
			: null

    return (
      <Typography
        onMouseOver={() => {
          setHover(true);
        }}
      >
        {props.level !== 1 ? (
          <Divider
            style={{
              width: "90%",
              marginTop: 40,
              backgroundColor: theme.palette.inputColor,
            }}
          />
        ) : null}
        {element}
		{extraAppInfo}
        {extraInfo}
      </Typography>
    );
  };

  const [, setCurrentActionMethod] = useState(actionNonBodyRequest[0]);

  // Selectedaction = Shuffle style action
  // Currentaction = OpenAPI style
  const [selectedAction, setSelectedAction] = useState({});
  const [currentAction, setCurrentAction] = useState({
    name: "",
    description: "",
    url: "",
    headers: "",
    paths: [],
    queries: [],
    body: "",
    errors: [],
    method: actionNonBodyRequest[0],
  });

  if (params.appid === "new") {
    return null;
  }

  const WorkflowHits = ({ hits }) => {
    //console.log("WORKFLOWS: ", hits)

    setRelatedWorkflows(hits.length);
    return hits.length;
  };

  const AppHits = ({ hits }) => {
    if (hits.length >= 1) {
      setRelatedApps(hits.length - 1);

      return hits.length - 1;
    } else {
      setRelatedApps(0);
      return 0;
    }
  };

  const getUserProfile = (username) => {
    if (serverside === true) {
      return;
    }

    fetch(`${globalUrl}/api/v1/users/creators/${username}`, {
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
        if (responseJson.success !== false) {
          setCreatorProfile(responseJson);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const SearchBox = ({ currentRefinement, refine, isSearchStalled }) => {
    return null;
  };

  const CustomWorkflowHits = connectHits(WorkflowHits);
  const CustomAppHits = connectHits(AppHits);
  const CustomSearchBox = connectSearchBox(SearchBox);

  const HandleJsonCopy = (base, copy, base_node_name) => {
    console.log("COPY: ", copy);
    var newitem = JSON.parse(base);
    to_be_copied = "$" + base_node_name;
    for (var key in copy.namespace) {
      if (copy.namespace[key].includes("Results for")) {
        continue;
      }

      if (newitem !== undefined && newitem !== null) {
        newitem = newitem[copy.namespace[key]];
        if (!isNaN(copy.namespace[key])) {
          to_be_copied += ".#";
        } else {
          to_be_copied += "." + copy.namespace[key];
        }
      }
    }
  };

  const handleReactJsonClipboard = (copy) => {
    console.log("COPY: ", copy);

    const elementName = "copy_element_shuffle";
    var copyText = document.getElementById(elementName);
    if (copyText !== null && copyText !== undefined) {
      navigator.clipboard.writeText(JSON.stringify(copy));
      copyText.select();
      copyText.setSelectionRange(0, 99999); /* For mobile devices */

      /* Copy the text inside the text field */
      document.execCommand("copy");
      toast("Copied data");
    }
  };

  const activateApp = (action) => {
    if (serverside === true) {
      return
    }

	const appExists = userdata.active_apps !== undefined && userdata.active_apps !== null && userdata.active_apps.includes(appId)
	var url = appExists ? `${globalUrl}/api/v1/apps/${appId}/deactivate` : `${globalUrl}/api/v1/apps/${appId}/activate`
	if (action !== undefined && action !== null) {
		url = `${globalUrl}/api/v1/apps/${appId}/${action}`
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
          console.log("Failed to activate");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === false) {
			if (action === undefined || action === null) {
				if (responseJson.reason !== undefined) {
					toast("Failed to activate the app: "+responseJson.reason);
				} else {
					toast("Failed to activate the app");
				}
			} else {
				if (responseJson.reason !== undefined) {
					toast("Failed to perform action: "+responseJson.reason);
				} else {
					toast("Failed to perform action. Please try again or contact support@shuffler.io");
				}
			}
      } else {
          if (checkLogin !== undefined && checkLogin !== null) {
            checkLogin()
          }

		  if (action === undefined || action === null) {
			  if (appExists) {
				toast("App deactivated for your organization! Existing workflows with the app will continue to work.")
			  } else {
				toast("App activated for your organization!")
			  }
		  } else {
		  }
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const handleEditApp = (appid) => {
    if (serverside === true) {
      return;
    }

		setAppId(appid)

    fetch(globalUrl + "/api/v1/apps/" + appid + "/config", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          //console.log("App doesn't exist or isn't available to you.")
          //toast("Something went wrong - this app is not available to you. Redirecting you back to search.")
          ReactGA.event({
            category: "appexplorer",
            action: `app_not_found`,
            label: appid,
          });
        } else {
          ReactGA.event({
            category: "appexplorer",
            action: `app_found`,
            label: appid,
          });
        }

        return response.json();
      })
      .then((responseJson) => {
        if (
          responseJson.success === false ||
          responseJson.success === undefined
        ) {
          toast("Failed to get the app")
          setIsAppLoaded(true)
          setTimeout(() => {
          	navigate("/search")
          }, 1000);
          return;
        } else {
          parseIncomingOpenapiData(responseJson);
        }
      })
      .catch((error) => {
        toast("Error in app fetch: " + error.toString());
      });
  };

  const parseIncomingAppdata = (data, openapiExists) => {
    document.title = data.name + " App - OpenAPI and API";

	

    setExecutionResult({
      valid: false,
      result: baseResult,
    });

    setName((data.name.charAt(0).toUpperCase() + data.name.substring(1)).replaceAll("_"," "));
    
    setDescription(data.description);
    setFileBase64(data.large_image);
    setContact(data.contact_info);

	if (data.categories !== undefined && data.categories !== null) {
		setNewWorkflowCategories(data.categories);
	}
    setAppType(1);

    if (data.owner !== undefined && data.owner !== null) {
      getUserProfile(data.owner);
      //console.log("DATA: ", data)
    }

    setAppData(data)
	if (data.reference_info.triggers !== undefined && data.reference_info.triggers !== null && data.reference_info.triggers.length > 0) {
		var parsedtriggers = []
		for (var key in data.reference_info.triggers) {
			const curtrigger = data.reference_info.triggers[key]

			const foundTrigger = workflowTriggers.find((trigger) => trigger.name.toLowerCase() === curtrigger.toLowerCase())
			if (foundTrigger !== undefined && foundTrigger !== null) {
				parsedtriggers.push(foundTrigger)
			}
		}

		setTriggers(parsedtriggers)
	}

    var newactions = [];
    if (!openapiExists) {
      console.log("Skipping openapi");
      for (var key in data.actions) {
        const action = data.actions[key];
        newactions.push({
          name: action.name,
          description: action.description,
          url: "",
          headers: "",
          paths: [],
          queries: [],
          body: "",
          errors: [],
          method: "CUSTOM",
        });
      }
    }


    if (newactions.length > 0) {
      setCurrentAction(newactions[0]);

      if (data.actions !== undefined) {
        //var methodName = `${data.method}_${data.name}`.toLowerCase()
        //if (data.name.toLowerCase().startsWith(data.method.toLowerCase())) {
        //	methodName = data.name.toLowerCase()
        //}
        //var newselectedaction = data.actions.find(item => item.name.toLowerCase() === methodName)
        //if (newselectedaction === undefined || newselectedaction === null) {
        //	toast(`Name ${methodName} not found. Please contact us.`)
        //	return
        //}

        //var newselectedaction = data.actions.find(item => item.name.toLowerCase() === )
        const newselectedaction = data.actions[0];
        newselectedaction.app_id = data.id;
        newselectedaction.app_name = data.name;
        newselectedaction.app_version = data.app_version;

        newselectedaction.authentication = selectedAction.authentication;

        newselectedaction.authentication_id = selectedAction.authentication_id;
        newselectedaction.selectedAuthentication = selectedAction.selectedAuthentication;
          
        if (
          data.authentication.required &&
          newselectedaction.authentication_id !== undefined &&
          newselectedaction.authentication_id !== null &&
          newselectedaction.authentication_id.length === 0
        ) {
          const tmpParams = selectedAction.parameters;
          selectedAction.parameters = [];

          for (let paramkey in data.authentication.parameters) {
            var item = data.authentication.parameters[paramkey];
						console.log("PARAM1: ", item)
            item.configuration = true;

            const found = selectedAction.parameters.find((param) => param.name === item.name);
            
            if (found === null || found === undefined) {
              selectedAction.parameters.push(item);
            }
          }

          for (let paramkey in tmpParams) {
            var item = tmpParams[paramkey];
						console.log("PARAM2: ", item)
            //item.configuration = true
            const found = selectedAction.parameters.find((param) => param.name === item.name);
            
            if (found === null || found === undefined) {
              selectedAction.parameters.push(item);
            }
          }
        }

        setSelectedAction(newselectedaction);
      }


		const firstActions = newactions.filter(data => data.action_label !== undefined && data.action_label !== null && data.action_label !== "No Label")
		//console.log("First actions: ", firstActions)
		const secondActions = newactions.filter(data => data.action_label === undefined || data.action_label === null || data.action_label === "No Label")
		const newActions = firstActions.concat(secondActions)
      setActions(newActions);
    }

    setIsAppLoaded(true);
  };

  // Sets the data up as it should be at later points
  // This is the data FROM the database, not what's being saved
  const parseIncomingOpenapiData = (data) => {
    var appexists = false;
    var nameExists = false;
    var parsedapp = {};
    if (data.app !== undefined && data.app !== null) {
      // Should basically always be true if openapi exists too
	  var parsedBaseapp = ""
	  try { 
	  	parsedBaseapp = base64_decode(data.app)
	  } catch (e) {
	  	console.log("Failed JSON parsing: ", e)
	  	parsedBaseapp = data
	  }

	  parsedapp = JSON.parse(parsedBaseapp)
	  parsedapp.name = parsedapp.name.replaceAll("_", " ");

	  setAppDocumentation("# "+parsedapp.name+defaultDocs);
	  setApp(parsedapp);
    setSharingConfiguration(parsedapp.sharing === true ? "public" : "you")

      appexists =
        parsedapp.name !== undefined &&
        parsedapp.name !== null &&
        parsedapp.name.length !== 0;

      if (appexists) {
        getAppDocs(parsedapp.name, "python", parsedapp.app_version);
      }

      if (data.openapi === undefined || data.openapi === null) {
		console.log("Parsed app: ", parsedapp)
        parseIncomingAppdata(parsedapp, false);
      } else {
        parseIncomingAppdata(parsedapp, true);
      }
    }

    if (data.openapi === undefined || data.openapi === null) {
      return;
    }

		var parsedDecoded = ""
		try { 
			parsedDecoded = base64_decode(data.openapi)
    } catch (e) {
			console.log("Failed JSON parsing: ", e)
			parsedDecoded = data
		}

    setAppType(0);
    parsedapp = JSON.parse(parsedDecoded);
    data = parsedapp.body === undefined ? parsedapp : JSON.parse(parsedapp.body);
    setOpenapi(data);

    getAppDocs(data.info.title, "openapi", data.app_version);

    setBasedata(data);
    if (!appexists) {
      setName(
        (
          data.info.title.charAt(0).toUpperCase() + data.info.title.substring(1)
        ).replaceAll("_", " ")
      );
      setDescription(data.info.description);

      console.log("Found name: ", data.info.title);
    }

    if (serverside !== true) {
			var doctitle = "Shuffle App for " + data.info.title 
			if (!data.info.title.toLowerCase().includes("api")) {
				doctitle += " API"
			}

      document.title = doctitle
    }

    if (data.info !== null && data.info !== undefined) {
      if (data.info["x-logo"] !== undefined) {
        setFileBase64(data.info["x-logo"]);
      }

      if (data.info.contact !== undefined) {
        setContact(data.info.contact);
      }

      if (data.info["x-categories"] !== undefined && data.info["x-categories"].length > 0) {
        setNewWorkflowCategories(data.info["x-categories"]);
      }
    }

    if (data.tags !== undefined && data.tags.length > 0) {
      for (var key in data.tags) {
        newWorkflowTags.push(data.tags[key].name);
      }

      setNewWorkflowTags(newWorkflowTags);
    }

    var securitySchemes = data?.components?.securityDefinitions;
    if (securitySchemes === undefined) {
      securitySchemes = data?.securitySchemes;
    }

    if (securitySchemes === undefined) {
      securitySchemes = data?.components?.securitySchemes;
    }

    const allowedfunctions = [
      "GET",
      "CONNECT",
      "HEAD",
      "DELETE",
      "POST",
      "PATCH",
      "PUT",
    ];

    // FIXME - headers?
    var newActions = [];
    var wordlist = {};
    if (data.paths !== null && data.paths !== undefined) {
      for (let [path, pathvalue] of Object.entries(data.paths)) {
        if (path === "tmp0") {
          setAppType(2);
        }

        for (let [method, methodvalue] of Object.entries(pathvalue)) {
          if (methodvalue === null) {
            toast("Skipped method " + method);
            continue;
          }

          if (!allowedfunctions.includes(method.toUpperCase())) {
            continue;
          }

          var tmpname = methodvalue.summary;
          if (
            methodvalue.operationId !== undefined &&
            methodvalue.operationId !== null &&
            methodvalue.operationId.length > 0
          ) {
            tmpname = methodvalue.operationId;
          }

          var newaction = {
            name: tmpname,
            description: methodvalue.description,
            url: path,
            method: method.toUpperCase(),
            headers: "",
            queries: [],
            paths: [],
            body: "",
            errors: [],
            example_response: "",
			action_label: "No Label",
			required_bodyfields: [],
          }

			// Related to Label Management
			if (methodvalue["x-label"] !== undefined && methodvalue["x-label"] !== null) {
				// Check if there are commas in it then loop and find the correct one
				// Should ignore 'No Label' and 'No label'
				var correctlabel = "" 
				const labels = methodvalue["x-label"].split(",")
				for (let labelkey in labels) {
					var label = labels[labelkey].trim()
					if (label.toLowerCase() === "no label") {
						continue
					}

					// Remove quotes and escapes
					label = label.replace(/['"]+/g, '')
					label = label.replace(/\\/g, '')

					//label = label.replace("_", " ", -1)
					//label = label.charAt(0).toUpperCase() + label.slice(1)

					correctlabel = label
					break
				}

				// FIX: Map labels only if they're actually in the category list
				newaction.action_label = correctlabel
			}

			if (methodvalue["x-required-fields"] !== undefined && methodvalue["x-required-fields"] !== null) {
				newaction.required_bodyfields = methodvalue["x-required-fields"]
			}

          for (key in methodvalue.parameters) {
            const parameter = methodvalue.parameters[key];
            if (parameter.in === "query") {
              var tmpaction = {
                description: parameter.description,
                name: parameter.name,
                required: parameter.required,
                in: "query",
              };

              if (parameter.required === undefined) {
                tmpaction.required = false;
              }

              newaction.queries.push(tmpaction);
            } else if (parameter.in === "path") {
              // FIXME - parse this to the URL too
              newaction.paths.push(parameter.name);

              // FIXME: This doesn't follow OpenAPI3 exactly.
              // https://swagger.io/docs/specification/describing-request-body/
              // https://swagger.io/docs/specification/describing-parameters/
              // Need to split the data.
            } else if (parameter.in === "body") {
              // FIXME: Add tracking for components
              // E.G: https://raw.githubusercontent.com/owentl/Shuffle/master/gosecure.yaml
              if (parameter.example !== undefined) {
                newaction.body = parameter.example;
              }
            } else if (parameter.in === "header") {
              newaction.headers += `${parameter.name}=${parameter.example}\n`;
            }
          }

          if (newaction.name === "" || newaction.name === undefined) {
            // Find a unique part of the string
            // FIXME: Looks for length between /, find the one where they differ
            // Should find others with the same START to their path
            // Make a list of reserved names? Aka things that show up only once
            if (Object.getOwnPropertyNames(wordlist).length === 0) {
              for (let [newpath] of Object.entries(data.paths)) {
                const newpathsplit = newpath.split("/");
                for (key in newpathsplit) {
                  const pathitem = newpathsplit[key].toLowerCase();
                  if (wordlist[pathitem] === undefined) {
                    wordlist[pathitem] = 1;
                  } else {
                    wordlist[pathitem] += 1;
                  }
                }
              }
            }

            //console.log("WORDLIST: ", wordlist)

            // Remove underscores and make it normal with upper case etc
            const urlsplit = path.split("/");
            if (urlsplit.length > 0) {
              var curname = "";
              for (key in urlsplit) {
                var subpath = urlsplit[key];
                if (wordlist[subpath] > 2 || subpath.length < 1) {
                  continue;
                }

                curname = subpath;
                break;
              }

              // FIXME: If name exists,
              // FIXME: Check if first part of parsedname is verb, otherwise use method
              const parsedname = curname
                .split("_")
                .join(" ")
                .split("-")
                .join(" ")
                .split("{")
                .join(" ")
                .split("}")
                .join(" ")
                .trim();
              if (parsedname.length === 0) {
                newaction.errors.push("Missing name");
              } else {
                const newname =
                  method.charAt(0).toUpperCase() +
                  method.slice(1) +
                  " " +
                  parsedname;
                const searchactions = newActions.find(
                  (data) => data.name === newname
                );
                //console.log("SEARCH: ", searchactions);
                if (searchactions !== undefined) {
                  newaction.errors.push("Missing name");
                } else {
                  newaction.name = newname;
                }
              }
            } else {
              newaction.errors.push("Missing name");
            }
          }
          newActions.push(newaction);
        }

        if (data.servers !== undefined && data.servers.length > 0) {
          var firstUrl = data.servers[0].url;
          if (
            firstUrl.includes("{") &&
            firstUrl.includes("}") &&
            data.servers[0].variables !== undefined
          ) {
            const regex = /{\w+}/g;
            const found = firstUrl.match(regex);
            if (found !== null) {
              for (key in found) {
                const item = found[key].slice(1, found[key].length - 1);
                const foundVar = data.servers[0].variables[item];
                if (foundVar["default"] !== undefined) {
                  firstUrl = firstUrl.replaceAll(
                    found[key],
                    foundVar["default"]
                  );
                }
              }
            }
          }

          if (firstUrl.endsWith("/")) {
            setBaseUrl(firstUrl.slice(0, firstUrl.length - 1));
          } else {
            setBaseUrl(firstUrl);
          }
        }
      }
    }

    // FIXME: Have multiple authentication options?
    if (securitySchemes !== undefined) {
      for (const [, value] of Object.entries(securitySchemes)) {
        if (value.scheme === "bearer") {
          setAuthenticationOption("Bearer auth");
          setAuthenticationRequired(true);
          break;
        } else if (value.type === "apiKey") {
          setAuthenticationOption("API key");

          value.in = value.in.charAt(0).toUpperCase() + value.in.slice(1);
          setParameterLocation(value.in);
          if (!apikeySelection.includes(value.in)) {
            //console.log("APIKEY SELECT: ", apikeySelection)
            toast("Might be error in setting up API key authentication");
          }

          //console.log("PARAM NAME: ", value.name)
          setParameterName(value.name);
          setAuthenticationRequired(true);
          break;
        } else if (value.scheme === "basic") {
          setAuthenticationOption("Basic auth");
          setAuthenticationRequired(true);
          break;
        }
      }
    }

		const firstActions = newActions.filter(data => data.action_label !== undefined && data.action_label !== null && data.action_label !== "No Label")
		//console.log("First actions: ", firstActions)
		const secondActions = newActions.filter(data => data.action_label === undefined || data.action_label === null || data.action_label === "No Label")
		newActions = firstActions.concat(secondActions)
    setActions(newActions);
    setIsAppLoaded(true);

    if (newActions.length > 0) {
      setCurrentAction(newActions[0]);
      setCurrentActionMethod(newActions[0].method);
      setUrlPathQueries(newActions[0].queries);
      setUrlPath(newActions[0].url);
      //setActionsModalOpen(true)
    }
  };

  const getAppDocs = (appname, location, version) => {
    if (serverside === true) {
      return;
    }

    fetch(
      `${globalUrl}/api/v1/docs/${appname}?location=${location}&version=${version}`,
      {
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status === 200) {
          //toast("Successfully GOT app "+appId)
        } else {
          //toast("Failed getting app");
        }

        return response.json();
      })
      .then((responseJson) => {
				var setMeta = false
        if (responseJson.success === true) {
          if (responseJson.reason !== undefined && responseJson.reason !== undefined && responseJson.reason.length > 0) {
          
            if (!responseJson.reason.includes("404: Not Found") && responseJson.reason.length > 25) {
			  const imgRegex = /<img.*?src="(.*?)"/g;
			  const newdata = responseJson.reason.replace(imgRegex, '![]($1)');

              setAppDocumentation(newdata)

              const urlSearchParams = new URLSearchParams(
                window.location.search
              );
              const queries = Object.fromEntries(urlSearchParams.entries());
              const foundTab = queries["tab"];
              if (foundTab !== null && foundTab !== undefined) {

              } else {
                if (params.integrationid === undefined) {
                  setSelectedTab(0);
                }
              }

							if (responseJson.meta !== undefined) {
								setSelectedMeta(responseJson.meta);
								setMeta = true 
							} 
            }
          }
        } else {
        }

				if (!setMeta) {
					setSelectedMeta({
  					"name": appname,
  					"contributors": [],
  					"edited": "",
  					"read_time": 1,
						"link": `https://github.com/Shuffle/openapi-apps/new/master/docs?filename=${appname.toLowerCase().replaceAll(" ", "_").replaceAll("%20", "_")}.md`,
					})
				}
      })
      .catch((error) => {
        toast("Error in doc loading: " + error.toString());
      });
  };

  const runAlgoliaAppSearch = (appname, isOriginal, triggerOnly) => {
    const index = searchClient.initIndex("appsearch");

    console.log("Running appsearch for: ", appname);


    index
      .search(appname)
      .then(({ hits }) => {
        const appsearchname = appname.replaceAll("_", " ").toLowerCase();
		var found = false

		if (hits !== undefined && hits !== null && hits.length === 1) {
			found = true
			if (isOriginal !== false) {
				handleEditApp(hits[0].objectID)
			} else {
				setSecondaryApp(hits[0])
			}
		}

        for (var key in hits) {
          const hit = hits[key];

          if (hit["name"] === null || hit["name"] === undefined) {
            continue;
          }

          if (hit["name"].replaceAll("_", " ").toLowerCase().includes(appsearchname) || hit["objectID"] === appname) {
			  /*
			if (hit.triggers !== undefined && hit.triggers !== null && hit.triggers.length > 0) {
				var parsedtriggers = []
				for (var key in hit.triggers) {
					const curtrigger = hit.triggers[key].toLowerCase()

					const foundTrigger = workflowTriggers.find((trigger) => trigger.name.toLowerCase() === curtrigger)
					if (foundTrigger !== undefined && foundTrigger !== null) {
						parsedtriggers.push(foundTrigger)
					}
				}

				setTriggers(parsedtriggers)
			}
			*/

			if (triggerOnly === true) {

			} else {
				if (isOriginal !== false) {
					found = true
					handleEditApp(hit.objectID);
				} else {
					console.log("Found second app: ", hit);
					hit.name = hit.name.charAt(0).toUpperCase() + hit.name.slice(1);
					setSecondaryApp(hit);
				}
			}

            break;
          }
        }

	    if (!found) {
			if (hits.length > 0) {
				if (isOriginal !== false) {
					handleEditApp(hits[0].objectID)
				} else {
					setSecondaryApp(hits[0]);
				}

				return
			}

			//navigate("/search?message=App not found&q=" + appname + "&tab=apps")
			//toast("App not found. Please contact support@shuffler.io if you believe this is an error.")
			return
		}
      })
      .catch((err) => {
        console.log(err);
      });
  };


  

  if (serverside === true && firstRequest) {
    setFirstRequest(false);
    if (
      selectedApp !== undefined &&
      selectedApp !== null &&
      Object.getOwnPropertyNames(selectedApp).length > 0
    ) {
      parseIncomingOpenapiData(selectedApp);
    }

    if (
      selectedDoc !== undefined &&
      selectedDoc !== null &&
      Object.getOwnPropertyNames(selectedDoc).length > 0
    ) {
      setAppDocumentation(selectedDoc.reason);
      setSelectedTab(0);
    }

    if (
      secondApp !== undefined &&
      secondApp !== null &&
      Object.getOwnPropertyNames(secondApp).length > 0
    ) {
      setSelectedTab(3);
      setSecondaryApp(secondApp);
    }
  }

  //, [])

  if (serverside !== true && window.location.href !== reloadUrl) {
    setReloadUrl(window.location.href);
    setAppDocumentation(defaultDocs);
	setTriggers([])
    //handleEditApp(params.appid)

    if (params.appid.length === 32 || params.appid.length === 36) {
      handleEditApp(params.appid);
			runAlgoliaAppSearch(params.appid, false, true);
    } else {
      runAlgoliaAppSearch(params.appid);
    }
  }

  const loopQueries =
    urlPathQueries === undefined ||
    urlPathQueries === null ||
    urlPathQueries.length === 0 ? null : (
      <div>
        <Divider
          style={{
            marginBottom: "10px",
            marginTop: "30px",
            height: "1px",
            width: "100%",
            backgroundColor: "grey",
          }}
        />
        Queries
        {urlPathQueries.map((data, index) => {
          return (
            <Paper key={index} style={actionListStyle}>
              <div style={{ marginLeft: "5px", width: "100%" }}>
                <TextField
                  required
                  fullWidth={true}
                  defaultValue={data.name}
                  placeholder={"Query name"}
                  onBlur={(e) => {
                    //urlPathQueries[index].name = e.target.value
                    //setUrlPathQueries(urlPathQueries)
                  }}
                  InputProps={{
                    style: {
                      color: "white",
                    },
                  }}
                />
              </div>
            </Paper>
          );
        })}
        <Divider
          style={{
            marginBottom: "10px",
            marginTop: "30px",
            height: "1px",
            width: "100%",
            backgroundColor: "grey",
          }}
        />
      </div>
    );

  const executeSingleAction = (appid, thisaction) => {
    if (serverside === true) {
      return;
    }

	if (isCloud) {
		thisaction.environment = "Cloud"
	} else {
		thisaction.environment = "Shuffle"
	}

    setExecutionResult({
      valid: false,
      result: baseResult,
    });

    setExecuting(true);

    fetch(globalUrl + "/api/v1/apps/" + appid + "/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(thisaction),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("RESPONSE: ", responseJson)
        if (
          responseJson.success === true &&
          responseJson.result !== null &&
          responseJson.result !== undefined &&
          responseJson.result.length > 0
        ) {
          const result = responseJson.result.slice(0, 50) + "...";
          //toast("SUCCESS: "+result)

          const validate = validateJson(responseJson.result);
          setExecutionResult(validate);
        } else if (
          responseJson.success === false &&
          responseJson.reason !== undefined &&
          responseJson.reason !== null
        ) {
          toast(responseJson.reason);
          setExecutionResult({ valid: false, result: responseJson.reason });
        } else if (responseJson.success === true) {
          setExecutionResult({
            valid: false,
            result:
              "Couldn't finish execution. Please fill all the required fields, and retry the execution.",
          });
        } else {
          setExecutionResult({
            valid: false,
            result:
              "Couldn't finish execution OR no result was returned (2). Please fill all the required fields, and validate the execution.",
          });
        }

        setExecuting(false);
      })
      .catch((error) => {
        toast("Execution error: " + error.toString());
        setExecuting(false);
      });
  };

  const MethodWrapper = (props) => {
    const { data } = props;

    var bgColor = "#61afee";
    if (data.method === "POST") {
      bgColor = "#49cc90";
    } else if (data.method === "PUT") {
      bgColor = "#fca130";
    } else if (data.method === "PATCH") {
      bgColor = "#50e3c2";
    } else if (data.method === "DELETE") {
      bgColor = "#f93e3e";
    } else if (data.method === "HEAD") {
      bgColor = "#9012fe";
    }

    return (
      <Chip
        style={{
          backgroundColor: bgColor,
          color: "white",
          borderRadius: theme.palette?.borderRadius,
          minWidth: 80,
          marginRight: 10,
          marginTop: 2,
          cursor: "pointer",
          fontSize: 14,
        }}
        label={data.method}
      />
    );
  };

  const parseName = (name, length) => {
		if (name === undefined || name === null) {
			return ""
		}

    var parsedName = name.charAt(0).toUpperCase() + name.slice(1);
    parsedName = parsedName.replaceAll("_", " ");
    if (
      length !== undefined &&
      length !== null &&
      length > 3 &&
      length < parsedName.length
    ) {
      parsedName = parsedName.slice(0, length) + "..";
    }

    return parsedName;
  };

	const SubAction = (props) => {
		const { data, selected, hovered, index } = props;

    const [hoveredItem, setHoveredItem] = useState(true);

		var urlPath = data.url !== undefined && data.url !== null && data.url.length > 0 ? data.url : ""
		var wrappedStyle = JSON.parse(JSON.stringify(actionListStyle));
		wrappedStyle.backgroundColor = selected || hovered ? theme.palette.platformColor : theme.palette.inputColor;
		wrappedStyle.paddingBottom = urlPath.length > 0 ? 0 : 10
		wrappedStyle.border = selected || hovered ? "1px solid rgba(255,255,255,0.3)" : ""

		var methodName = `${data.method}_${data.name}`;
		if ((data.name !== undefined && data.name !== null && data.method !== undefined && data.method !== null ) && (data.method.toLowerCase() === "custom" || data.name.toLowerCase().startsWith(data.method.toLowerCase()))) {
			methodName = data.name;
		}

		const invalid_keys = [".", "(", ")", "'", ",", "[", "]"];
		methodName = methodName.toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");

		for (var key in invalid_keys) {
			methodName = methodName.replaceAll(invalid_keys[key], "");
		}

		const parsedName = parseName(data.name, 35);
		if (parsedName.length === 0) {
			return null
		}

		const actionLabels = foundCategory !== undefined && foundCategory !== null && foundCategory.name !== "Other" && foundCategory.action_labels.length > 0 ? ["No Label"].concat(foundCategory.action_labels) : []

		var bgColor = "#61afee";
		if (data.method === "POST") {
			bgColor = "#49cc90";
		} else if (data.method === "PUT") {
			bgColor = "#fca130";
		} else if (data.method === "PATCH") {
			bgColor = "#50e3c2";
		} else if (data.method === "DELETE") {
			bgColor = "#f93e3e";
		} else if (data.method === "HEAD") {
			bgColor = "#9012fe";
		}

		//console.log("Category: ", foundCategory, actionLabels)

		return (
			<Paper
				style={wrappedStyle}
				onMouseOver={() => {
					setHoveredItem(true);
				}}
				onMouseOut={() => {
					setHoveredItem(false);
				}}
			>
				<Tooltip
					title={data.description === null || data.description === undefined ? urlPath : <Typography variant="body2"> {parsedName} <br/><br/>{data.method} {urlPath}<br/><br />{data.description}
					</Typography>
					}
					placement="left"
				>
					<div
						style={{
							marginLeft: 10,
							width: "100%",
							cursor: "pointer",
							maxWidth: 725,
							overflowX: "hidden",
							overflowY: "hidden",
						}}
						onClick={() => {
							if (app.actions !== undefined) {
								var newselectedaction = app.actions.find((item) => item.name.toLowerCase().replaceAll(" ", "_").replaceAll(".", "").replaceAll("(", "").replaceAll(")", "") === methodName)
								
								if (newselectedaction === undefined || newselectedaction === null) {
									newselectedaction = app.actions.find((item) => item.name.toLowerCase().replaceAll(" ", "_").replaceAll(".", "").replaceAll("(", "").replaceAll(")", "") === data.name.toLowerCase().replaceAll(" ", "_").replaceAll(".", "").replaceAll("(", "").replaceAll(")", ""))
									if (newselectedaction === undefined || newselectedaction === null) {
										for (var key in app.actions) {
											console.log(methodName, app.actions[key].name.toLowerCase().replaceAll(" ", "_"));
										}

										toast(`Name ${methodName} not found. Please contact us.`);
										return;
									}
								}

								newselectedaction.app_id = app.id;
								newselectedaction.app_name = app.name;
								newselectedaction.app_version = app.app_version;

								newselectedaction.authentication = selectedAction.authentication;
								newselectedaction.authentication_id =  selectedAction.authentication_id;
								newselectedaction.selectedAuthentication = selectedAction.selectedAuthentication;
									
								if (
									app.authentication.required &&
									newselectedaction.authentication_id !== undefined &&
									newselectedaction.authentication_id !== null &&
									newselectedaction.authentication_id.length === 0
								) {
									const tmpParams = selectedAction.parameters;
									selectedAction.parameters = [];

									for (var paramkey in app.authentication.parameters) {
										var item = app.authentication.parameters[paramkey];
										item.configuration = true;

										const found = selectedAction.parameters.find(
											(param) => param.name === item.name
										);
										if (found === null || found === undefined) {
											selectedAction.parameters.push(item);
										}
									}

									for (var paramkey in tmpParams) {
										var item = tmpParams[paramkey];
										//item.configuration = true

										const found = selectedAction.parameters.find(
											(param) => param.name === item.name
										);
										if (found === null || found === undefined) {
											selectedAction.parameters.push(item);
										}
									}
								}

								setSelectedAction(newselectedaction);
							}

							setCurrentAction(data);
							setCurrentActionMethod(data.method);
							setUrlPathQueries(data.queries);
							setUrlPath(data.url);

							/*
							if (selectedTab !== 1) {
								setSelectedTab(1);
							}
							*/
						}}
					>
						<div style={{ display: "flex", marginBottom: 5 }}>
							<MethodWrapper data={data} />
							<span style={{maxWidth: 175, minWidth: 175, overflow: "hidden", marginRight: 5, }}>
								<Typography
									variant="body1"
									style={{
										marginTop: urlPath.length > 0 ? "auto" : 3,
										marginBottom: "auto",
										textAlign: "left",
										overflow: "hidden",
										maxHeight: 27,
										maxWidth: 175,
									}}
								>
									{parsedName}
								</Typography>
								{urlPath.length > 0 ? 
									<Typography variant="body2" color="textSecondary"> 
										{urlPath}
									</Typography>
								: null}
							</span>
							{actionLabels.length > 0 && newWorkflowCategories !== undefined && newWorkflowCategories !== null && newWorkflowCategories.length > 0 && categories.length > 0 ? 
								<Select
									fullWidth
									onChange={(e) => {
										console.log("Should change: ", e.target.value, " Index: ", index)

										const foundIndex = actions.findIndex((action) => action.name === data.name)
										console.log("Found index: ", foundIndex)
										if (foundIndex !== undefined && foundIndex !== null && foundIndex >= 0) {
											actions[foundIndex].action_label = e.target.value
											setActions(actions)
											setUpdate(Math.random())

											// Should send recommendations to the owner
												
											if (creatorProfile.github_username !== undefined && creatorProfile.github_username !== null && creatorProfile.github_username.length > 0) {
												const labelData = {
													"app_id": app.id,
													"action_name": data.name,
													"label": e.target.value
												}

												// Should send recommendations to the owner
												var url = `${globalUrl}/api/v1/apps/label`;
												fetch(url, {
													method: "POST",
													headers: {
													  "Content-Type": "application/json",
													  "Accept": "application/json",
													},
													body: JSON.stringify(labelData),
													credentials: "include",
												})
													.then((response) => response.json())
													.then((responseJson) => {
														if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason.length > 0) {
															toast(responseJson.reason)
														}
													})
													.catch((error) => {
														console.log("Error: ", error)
													});

											}
										}
									}}
									value={data.action_label.toLowerCase().replaceAll(" ", "_")}
									style={{
										border: data.action_label === undefined || data.action_label === "No Label" ? "" : `2px solid ${bgColor}`,
										borderRadius: theme.shape.borderRadius,
										backgroundColor: inputColor,
										paddingLeft: 10,
										color: "white",
										height: 30,
										maxWidth: 35, 
										marginLeft: 10, 
										marginRight: 10, 
										overflow: "hidden",
									}}
									inputProps={{
										name: "Method",
										id: "method-option",
									}}
								>
									{actionLabels.map((label, labelindex) => {
										//label = label.toLowerCase().replaceAll(" ", "_")
										if (label === undefined || label === null) {
											return null
										}

										return (
											<MenuItem
												key={labelindex}
												value={label.toLowerCase().replaceAll(" ", "_")}
												style={{ 
												}}
											>
												{label}
											</MenuItem>
										)
									})}
									<Divider />
									<MenuItem
										key={"app_validation"}
										value={"app_validation"}
										style={{ 
										}}
									>
										App Validation
									</MenuItem>
								</Select>
							: null}
						</div>
					</div>
				</Tooltip>
			</Paper>
		);
	};

	const foundCategory = newWorkflowCategories !== undefined && newWorkflowCategories !== null && newWorkflowCategories.length > 0 ? categories.find((x) => x.name === newWorkflowCategories[0]) : undefined
  const LoopActions = (props) => {
    const { actions } = props;

    //const [activeActions] = useState(actions === undefined ? [] : actions);

    if (actions === undefined || actions === null || actions.length === 0) {
      return null;
    }

    return (
      <div>
        {actions.map((data, index) => {
					if (data.action_label === undefined || data.action_label === null || data.action_label.length === 0) {
						data.action_label = "No Label"
					}

          return (
            <SubAction
              key={index}
              data={data}
              selected={currentAction.name === data.name}
              index={index}
            />
          );
        })}
      </div>
    );
    //</Scrollbars>
  };

  const ParsedActionHandler = () => {
    const passedOrg = { id: "", name: "" };
    const owner = "";
    const passedTags = ["single test"];

    const [, setUpdate] = useState();
    const [authenticationModalOpen, setAuthenticationModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState({
      versions: [
        {
          id: selectedAction.app_id,
          version: selectedAction.app_version,
        },
      ],
      loop_versions: [selectedAction.app_version],
      id: selectedAction.app_id,
      name: selectedAction.app_name,
      version: selectedAction.app_version,
    });

    const [requiresAuthentication, setRequiresAuthentication] = useState(
      app.authentication.required &&
        app.authentication.parameters !== undefined &&
        app.authentication.parameters !== null
    );
    const [workflow, setWorkflow] = useState({
      name: "",
      description: "",
      actions: [selectedAction],
      start: selectedAction.id,
      tags: passedTags,
      execution_org: passedOrg,
      org_id: passedOrg.id,
      id: uuidv4(),
      isValid: true,
      owner: owner,
      created: Date.now(),
    });

    const EndpointData = () => {
      const [tmpVar, setTmpVar] = React.useState("");

      return (
        <div>
          The API endpoint to use (URL) - predefined in the app
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
                color: "white",
                height: 50,
                fontSize: "1em",
              },
            }}
            fullWidth
            type="text"
            color="primary"
            disabled={true}
            placeholder="Bearer token"
            defaultValue={selectedApp.link}
            onChange={(event) => {
              setTmpVar(event.target.value);
            }}
            onBlur={() => {
              selectedApp.link = tmpVar;
              console.log("LINK: ", selectedApp.link);
              setSelectedApp(selectedApp);
            }}
          />
        </div>
      );
    };

    const setAppActionAuthentication = (newauth) => {
      if (app.authentication.required) {
        var findAuthId = "";
        if (
          selectedAction.authentication_id !== null &&
          selectedAction.authentication_id !== undefined &&
          selectedAction.authentication_id.length > 0
        ) {
          findAuthId = selectedAction.authentication_id;
        }

        var baseAuthOptions = [];
        for (var key in newauth) {
          var item = newauth[key];

          const newfields = {};
          for (var filterkey in item.fields) {
            newfields[item.fields[filterkey].key] = item.fields[filterkey].value;
          }

          item.fields = newfields;
          if (item.app.name === app.name) {
            baseAuthOptions.push(item);

            if (item.id === findAuthId) {
              selectedAction.selectedAuthentication = item;
            }
          }
        }

        selectedAction.authentication = baseAuthOptions;
        //console.log("Authentication: ", authenticationOptions)
        if (
          selectedAction.selectedAuthentication === null ||
          selectedAction.selectedAuthentication === undefined ||
          selectedAction.selectedAuthentication.length === ""
        ) {
          selectedAction.selectedAuthentication = {};
        }
      } else {
        selectedAction.authentication = [];
        selectedAction.authentication_id = "";
        selectedAction.selectedAuthentication = {};
      }

      setSelectedAction(selectedAction);
      console.log("Action: ", selectedAction);
    };

    //{selectedAction.authentication !== undefined && selectedAction.authentication.length > 0 ?
    const getAppAuthentication = () => {
      if (serverside === true) {
        return;
      }

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
            console.log("Status not 200 for app auth :O!");
          }

          return response.json();
        })
        .then((responseJson) => {
          if (responseJson.success && responseJson.data !== undefined && responseJson.data !== null && responseJson.data.length !== 0) {
            var newauth = [];

			//console.log("Got auth. Trying to map to selectedAction appname: ", selectedAction)
			var authUpdate = false;
			const appname = selectedAction.app_name.toLowerCase().replaceAll(" ", "_")
			selectedAction.authentication = []

            for (var key in responseJson.data) {
              if (responseJson.data[key].defined === false) {
                continue;
              }

              if (responseJson.data[key].active === false) {
                continue;
              }

              newauth.push(responseJson.data[key]);

				if (responseJson.data[key].app === undefined || responseJson.data[key].app === null) {
					continue
				}

				if (responseJson.data[key].app.name.toLowerCase().replaceAll(" ", "_") === appname) {
					console.log("Found matching app name: ", responseJson.data[key].app.name)
					selectedAction.authentication.push(responseJson.data[key])
					selectedAction.authentication_id = responseJson.data[key].id
					selectedAction.selectedAuthentication = responseJson.data[key]
					authUpdate = true;
				}
}

			console.log("New auth: ", newauth)
			if (authUpdate === true) {
				setSelectedAction(selectedAction)
			}

						//setUpdate(Math.random())
            setAppAuthentication(newauth);
            setAppActionAuthentication(newauth);
          } else {
            if (app.authentication.required) {
              const tmpParams = selectedAction.parameters;
              selectedAction.parameters = [];

              for (var paramkey in app.authentication.parameters) {
                var item = app.authentication.parameters[paramkey];
                item.configuration = true;

                const found = selectedAction.parameters.find(
                  (param) => param.name === item.name
                );
                if (found === null || found === undefined) {
                  selectedAction.parameters.push(item);
                }
              }

              for (var paramkey in tmpParams) {
                var item = tmpParams[paramkey];
                //item.configuration = true

                const found = selectedAction.parameters.find((param) => param.name === item.name);
                
                if (found === null || found === undefined) {
                  selectedAction.parameters.push(item);
                }
              }

              setSelectedAction(selectedAction);
            }

            //toast("Failed getting authentications")
          }
        })
        .catch((error) => {
          toast("Auth loading error: " + error.toString());
        });
    };

    if (!authLoaded && appAuthentication.length === 0 && selectedAction.id !== undefined) {
      setAuthLoaded(true);
      getAppAuthentication();
    } else if (
      selectedAction.id === undefined &&
      currentAction.name !== undefined &&
      currentAction.name !== null &&
      currentAction.name.length > 0
    ) {
      var methodName = `${currentAction.method}_${currentAction.name}`;
      if (
        currentAction.method.toLowerCase() === "custom" ||
        currentAction.name
          .toLowerCase()
          .startsWith(currentAction.method.toLowerCase())
      ) {
        methodName = currentAction.name;
      }

      methodName = methodName.toLowerCase().replaceAll(" ", "_");
      if (app.actions !== null && app.actions !== undefined) {
        var newselectedaction = app.actions.find(
          (item) => item.name.toLowerCase().replaceAll(" ", "_") === methodName
        );
        if (newselectedaction !== undefined && newselectedaction !== null) {
          newselectedaction.app_id = app.id;
          newselectedaction.app_name = app.name;
          newselectedaction.app_version = app.app_version;
          newselectedaction.authentication = [];
          newselectedaction.authentication_id = "";
          newselectedaction.selectedAuthentication = {};
          setSelectedAction(newselectedaction);
        }
      }
    }

    const setNewAppAuth = (appAuthData) => {
      if (serverside === true) {
        return;
      }

      //console.log("DAta: ", appAuthData)
      fetch(globalUrl + "/api/v1/apps/authentication", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(appAuthData),
        credentials: "include",
      })
        .then((response) => {
          if (response.status !== 200) {
            console.log("Status not 200 for setting app auth :O!");
          }

          return response.json();
        })
        .then((responseJson) => {
          if (!responseJson.success) {
            toast("Failed to set app auth: " + responseJson.reason);
          } else {
            getAppAuthentication(true);
            setAuthenticationModalOpen(false);

            // Needs a refresh with the new authentication..
            //toast("Successfully saved new app auth")
          }
        })
        .catch((error) => {
          toast("Auth error: ", error.toString());
        });
    };

    const AuthenticationData = (props) => {
      const selectedApp = props.app;

      const [authenticationOption, setAuthenticationOptions] = React.useState({
        app: JSON.parse(JSON.stringify(selectedApp)),
        fields: {},
        label: "",
        usage: [
          {
            workflow_id: workflow.id,
          },
        ],
        id: uuidv4(),
        active: true,
      });

      if (selectedApp.authentication === undefined) {
        return null;
      }

      if (
        selectedApp.authentication.parameters === null ||
        selectedApp.authentication.parameters === undefined ||
        selectedApp.authentication.parameters.length === 0
      ) {
        return null;
      }

      authenticationOption.app.actions = [];

      for (var key in selectedApp.authentication.parameters) {
        if (
          authenticationOption.fields[
            selectedApp.authentication.parameters[key].name
          ] === undefined
        ) {
          authenticationOption.fields[
            selectedApp.authentication.parameters[key].name
          ] = "";
        }
      }

      const handleSubmitCheck = () => {
        if (authenticationOption.label.length === 0) {
          authenticationOption.label = `Auth for ${selectedApp.name}`;
          //toast("Label can't be empty")
          //return
        }

        for (var key in selectedApp.authentication.parameters) {
          if (
            authenticationOption.fields[
              selectedApp.authentication.parameters[key].name
            ].length === 0
          ) {
            toast(
              "Field " +
                selectedApp.authentication.parameters[key].name +
                " can't be empty"
            );
            return;
          }
        }

        console.log("Action: ", selectedAction);
        selectedAction.authentication_id = authenticationOption.id;
        selectedAction.selectedAuthentication = authenticationOption;
        if (
          selectedAction.authentication === undefined ||
          selectedAction.authentication === null
        ) {
          selectedAction.authentication = [authenticationOption];
        } else {
          selectedAction.authentication.push(authenticationOption);
        }

        setSelectedAction(selectedAction);

        var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
        var newFields = [];
        for (const key in newAuthOption.fields) {
          const value = newAuthOption.fields[key];
          newFields.push({
            key: key,
            value: value,
          });
        }

        console.log("FIELDS: ", newFields);
        newAuthOption.fields = newFields;
        setNewAppAuth(newAuthOption);
        //appAuthentication.push(newAuthOption)
        //setAppAuthentication(appAuthentication)
        //

        setUpdate(authenticationOption.id);

        /*
					{selectedAction.authentication.map(data => (
					<MenuItem key={data.id} style={{backgroundColor: inputColor, color: "white"}} value={data}>
				*/
      };

      if (
        authenticationOption.label === null ||
        authenticationOption.label === undefined
      ) {
        authenticationOption.label = selectedApp.name + " authentication";
      }

      return (
        <div>
          <DialogContent>
            <a
              target="_blank"
              rel="norefferer"
              href="https://shuffler.io/docs/apps#authentication"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              What is this?
            </a>
            <div />
            These are required fields for authenticating with {selectedApp.name}
            <div style={{ marginTop: 15 }} />
            <b>Name - what is this used for?</b>
            <TextField
              style={{
                backgroundColor: inputColor,
                borderRadius: theme.palette?.borderRadius,
              }}
              InputProps={{
                style: {
                  color: "white",
                  marginLeft: "5px",
                  maxWidth: "95%",
                  height: 50,
                  fontSize: "1em",
                },
              }}
              fullWidth
              color="primary"
              placeholder={"Auth july 2020"}
              defaultValue={`Auth for ${selectedApp.name}`}
              onChange={(event) => {
                authenticationOption.label = event.target.value;
              }}
            />
            {selectedApp.link.length > 0 ? (
              <div style={{ marginTop: 15 }}>
                <EndpointData />
              </div>
            ) : null}
            <Divider
              style={{
                marginTop: 15,
                marginBottom: 15,
                backgroundColor: "rgb(91, 96, 100)",
              }}
            />
            <div style={{}} />
            {selectedApp.authentication.parameters !== undefined &&
            selectedApp.authentication.parameters !== null
              ? selectedApp.authentication.parameters.map((data, index) => {
                  return (
                    <div key={index} style={{ marginTop: 10 }}>
                      <LockOpenIcon style={{ marginRight: 10 }} />
                      <b>{data.name}</b>
                      <TextField
                        style={{
                          backgroundColor: inputColor,
                          borderRadius: theme.palette?.borderRadius,
                        }}
                        InputProps={{
                          style: {
                            color: "white",
                            marginLeft: "5px",
                            maxWidth: "95%",
                            height: 50,
                            fontSize: "1em",
                          },
                        }}
                        fullWidth
                        type={
                          data.example !== undefined &&
                          data.example.includes("***")
                            ? "password"
                            : "text"
                        }
                        color="primary"
                        placeholder={data.example}
                        onChange={(event) => {
                          authenticationOption.fields[data.name] =
                            event.target.value;
                        }}
                      />
                    </div>
                  );
                })
              : null}
          </DialogContent>
          <DialogActions>
            <Button
              style={{ borderRadius: "0px" }}
              onClick={() => {
                setAuthenticationModalOpen(false);
              }}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              style={{ borderRadius: "0px" }}
              onClick={() => {
                handleSubmitCheck();
              }}
              color="primary"
            >
              Submit
            </Button>
          </DialogActions>
        </div>
      );
    };

    const authenticationModal = authenticationModalOpen ? (
      <Dialog
        open={authenticationModalOpen}
        onClose={() => {
          //setAuthenticationModalOpen(false)
        }}
        PaperProps={{
          style: {
            backgroundColor: surfaceColor,
            color: "white",
            minWidth: 600,
            padding: 15,
          },
        }}
      >
        <IconButton
          style={{
            zIndex: 5000,
            position: "absolute",
            top: 14,
            right: 14,
            color: "grey",
          }}
          onClick={() => {
            setAuthenticationModalOpen(false);
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle>
          <div style={{ color: "white" }}>
            Authentication for {selectedApp.name}
          </div>
        </DialogTitle>

        {/*<AuthenticationData app={app} />*/}

				{app.authentication.type === "oauth2" || app.authentication.type === "oauth2-app" ?
					<AuthenticationOauth2
						selectedApp={app}
						selectedAction={{
							"app_name": app.name,
							"app_id": app.id,
							"app_version": app.version,
							"large_image": app.large_image,
						}}
						authenticationType={app.authentication}
						isCloud={true}
						authButtonOnly={true}
						getAppAuthentication={getAppAuthentication}
    					isLoggedIn={isLoggedIn}
					/>
					:
					<AuthenticationWindow
						selectedApp={app}
						globalUrl={globalUrl}
						getAppAuthentication={getAppAuthentication}
						appAuthentication={appAuthentication}
						authenticationModalOpen={authenticationModalOpen}
						setAuthenticationModalOpen={setAuthenticationModalOpen}
    				isLoggedIn={isLoggedIn}
					/>
				}
      </Dialog>
    ) : null;

    const selectedNameChange = (event) => {
	  if (event.target === undefined || event.target === null || event.target.value === undefined || event.target.value === null || event.target.value.length === 0) {
		  return 
	  }


      //console.log("OLDNAME: ", selectedAction.name)
      event.target.value = event.target.value.replaceAll("(", "");
      event.target.value = event.target.value.replaceAll(")", "");
      event.target.value = event.target.value.replaceAll("$", "");
      event.target.value = event.target.value.replaceAll("#", "");
      event.target.value = event.target.value.replaceAll(".", "");
      event.target.value = event.target.value.replaceAll(",", "");
      event.target.value = event.target.value.replaceAll(" ", "_");
      selectedAction.label = event.target.value;
      setSelectedAction(selectedAction);
    };

    const actionStyling = {
      width: "100%",
    };

    //backgroundColor: "#1F2023",
    const appApiViewStyle = {
      display: "flex",
      flexDirection: "column",
      color: "white",
      minHeight: "100%",
      zIndex: 1000,
      resize: "vertical",
      overflowY: "auto",
      overflowX: "hidden",
      maxHeight: 680,
      paddingRight: 7,
    };
		// maxWidth: 420,

    return (
      <span>
        {authenticationModal}

        {selectedAction.id !== undefined ? (
          <ParsedAction
            selectedAction={selectedAction}
            workflow={workflow}
            setWorkflow={setWorkflow}
            setSelectedAction={setSelectedAction}
            setUpdate={setUpdate}
            selectedApp={app}
            setAuthenticationModalOpen={setAuthenticationModalOpen}
            selectedNameChange={selectedNameChange}
            appApiViewStyle={appApiViewStyle}
            globalUrl={globalUrl}
            requiresAuthentication={requiresAuthentication}
            hideExtraTypes={true}
            setNewSelectedAction={undefined}
            environments={[]}
            selectedActionEnvironment={undefined}
            setSelectedActionEnvironment={undefined}
            showEnvironment={false}
            rightsidebarStyle={actionStyling}
            setCodeModalOpen={undefined}
            setLastSaved={undefined}
            setVariablesModalOpen={undefined}
            setCurrentView={undefined}
            setSelectedTrigger={undefined}
            setSelectedEdge={undefined}
            setSelectedApp={setSelectedApp}
            getParents={undefined}
            setSelectedResult={undefined}
            cy={undefined}
            workflowExecutions={[]}
          />
        ) : null}
      </span>
    );
  };

  const SelectedActionView = (props) => {
    const { action } = props;
    //console.log("Parsedaction: ", selectedAction)
    const parsedName = parseName(action.name);
    const splitHeaders = action.headers === undefined || action.headers === null ? [] : action.headers.split("\n");

    return (
      <div style={{ minWidth: 400, maxWidth: 400, marginLeft: 10, marginRight: 20, }}>
        <div style={{ display: "flex", marginTop: 10 }}>
          <MethodWrapper data={action} />
          <Typography variant="body1" style={{ marginTop: 5 }}>
            {parsedName}
          </Typography>
        </div>

        <ParsedActionHandler />
      </div>
    );
  };


	const AppDetails = (props) => {
		const { title, inputTitle } = props

		const [details, setDetails] = useState("")


		return (
			<span>
				<TextField
					fullWidth
					margin="dense"
					id="outlined-basic"
					label={title}
					variant="outlined"
					defaultValue={inputTitle}
					style={{ 
						minWidth: 600,
						maxWidth: 600,
						marginRight: 10,
					}}
					// endornament for submit
					onChange={(event) => {
						setDetails(event.target.value)
					}}
					onBlur={(event) => {
						submitAppDetails(title.toLowerCase().replaceAll(" ", "_"), details)
					}}
				/>
			</span>
		)
	}

  const imageStyle = {
    borderRadius: theme.palette?.borderRadius,
    border: "1px solid rgba(255,255,255,0.6)",
    minWidth: 100,
    maxWidth: 100,
    minhHight: 100,
    maxHeight: 100,
  };

  const textStyle = {
    marginLeft: 15,
    marginTop: 15,
  };

	const submitAppDetails = (field, value) => {
		console.log("To submit. Skipping if value is empty: ", field, value)

		if (value === undefined || value === null || (value.length === 0 && field !== "triggers")) {
			return
		}

		//toast("Submitting details for field", field)
		const data = {
			field: field,
			value: value,
			app_id: app.id,
		}

		fetch(globalUrl + "/api/v1/apps/label", {
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
			  if (responseJson.success === false) {
				  if (responseJson.reason === undefined) {
					toast("Failed to submit details for field ", field, " because ", responseJson.reason)
				  } else {
					toast("Failed to submit details for field ", field, " because ", responseJson.reason)
				  }
			  } else {
				toast("Successfully submitted details for field ", field)
			  }
		  })
		  .catch((error) => {
			  console.log("Error: ", error)
			  toast("Error submitting details for field ", field)
		  })
	}

  const editTrigger = (triggerName) => {
	  console.log("Editing trigger: ", triggerName)

	  var found = false
	  for (var i = 0; i < triggers.length; i++) {
		  if (triggers[i].name === triggerName) {
			  found = true
			  break
		  }
	  }

	  var newtriggers = JSON.parse(JSON.stringify(triggers))
	  if (!found) {
		  // Find the trigger with the same name in imported workflowTriggers
		  var importedTrigger = undefined
		  for (var i = 0; i < workflowTriggers.length; i++) {
			  if (workflowTriggers[i].name.toLowerCase() === triggerName.toLowerCase()) {
				  newtriggers.push(workflowTriggers[i])
				  break
			  }
		  }

	  } else {
		  // Remove
		  newtriggers = newtriggers.filter((trigger) => trigger.name !== triggerName)
	  }

	  console.log("Triggers: ", newtriggers)
	  setTriggers(newtriggers)

	  var parsedtriggers = []
	  for (var i = 0; i < newtriggers.length; i++) {
		  parsedtriggers.push(newtriggers[i].name)
	  }

	  submitAppDetails("triggers", parsedtriggers.join(","))
  }

  	const removeAppFromSearchEngine = (appID) => { 
	  	toast(`Removing app ${appId} from search engine`)

		const field = "public"
	  	const data = {
			field: field,
			value: "false",
			app_id: appID,
		}

		fetch(globalUrl + "/api/v1/apps/label", {
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
			  if (responseJson.success === false) {
				  if (responseJson.reason === undefined) {
					toast.error("Failed removing app from search engine.") 
				  } else {
					toast.error("Failed to remove app from search engine because: " + responseJson.reason)
				  }
			  } else {
				toast.info("Successfully unpublished app. It can still be accessed by direct link.")
			  }
		  })
		  .catch((error) => {
			  console.log("Error: ", error)
			  toast.info("Error when removing app from search engine.")
		  })
  }

  const deduplicateByName = (array) => {
    const uniqueNames = {};
    return array.filter(item => {
		if (!item?.hasOwnProperty('name') || !item?.name?.length) {
		  return true
		}
		if (!uniqueNames[item.name]) {
		  uniqueNames[item.name] = true
		  return true
		}
		return false
    })
  }

	const ActionSelectOption = (actionprops) => {
		const { option, newActionname, newActiondescription, useIcon, extraDescription, } = actionprops;
  		const [hover, setHover] = React.useState(false);

		return (
			<Tooltip
			  color="secondary"
			  title={newActiondescription}
			  placement="left"
			>
				<div style={{
					cursor: "pointer", 
					padding: 8, 
					paddingLeft: 14, 
					paddingBottom: 4,
					backgroundColor: hover ? theme.palette.surfaceColor : theme.palette.inputColor,
				}} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
				onClick={(event) => {
					console.log("Clicked on action: ", option)


					if (option !== undefined && option !== null) { 
						setSelectedValidationAction(option)

						const labelData = {
							"app_id": app.id,
							"action_name": option.name,
							"label": "app_validation",
						}

						// Should send recommendations to the owner
						var url = `${globalUrl}/api/v1/apps/label`;
						fetch(url, {
							method: "POST",
							headers: {
							  "Content-Type": "application/json",
							  "Accept": "application/json",
							},
							body: JSON.stringify(labelData),
							credentials: "include",
						})
						.then((response) => response.json())
						.then((responseJson) => {
							if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason.length > 0) {
								toast(responseJson.reason)
							}
						})
						.catch((error) => {
							console.log("Error: ", error)
						})

						// Update the app itself?
						/*
                		setNewSelectedAction({ 
							target: { 
								value: option.name 
							} 
						});
						*/
              		}
				}}
				>
					<div style={{ display: "flex", marginBottom: 0,}}>
						<span
							style={{
								marginRight: 10,
								marginTop: "auto",
								marginBottom: 0,
							}}
						>
							{useIcon}
						</span>
						<span style={{marginBottom: 0, marginTop: 3, }}>{newActionname}</span>
					</div>
					{extraDescription.length > 0 ? 
						<Typography variant="body2" color="textSecondary" style={{marginTop: 0, overflow: "hidden", whiteSpace: "nowrap", display: "block",}}>
							{extraDescription}	
						</Typography>
					: null}
				</div>
			</Tooltip>
		)
	}

  const userRoles = ["you", "public"];

  const updateAppField = (app_id, fieldname, fieldvalue) => {
      const data = {};
      data[fieldname] = fieldvalue;
  
  
      console.log("DATA: ", data);
  
      fetch(globalUrl + "/api/v1/apps/" + app_id, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      })
        .then((response) => {
          //setAppSearchLoading(false)
          return response.json();
        })
        .then((responseJson) => {
          //console.log(responseJson)
          //toast(responseJson)
          if (responseJson.success) {
            toast("Successfully updated app configuration");
          } else {
            if (responseJson.reason !== undefined && responseJson.reason !== null) {
              toast("Error: "+responseJson.reason);
            } else {
              toast("Error updating app configuration. Are you the owner of this app?");
        }
          }
        })
        .catch((error) => {
          toast(error.toString());
        });
    };

  const sortByCategoryLabel = (a, b) => {
	  const aHasCategoryLabel = a.category_label !== undefined && a.category_label !== null && a.category_label.length > 0
	  const bHasCategoryLabel = b.category_label !== undefined && b.category_label !== null && b.category_label.length > 0

	  // Sort by existence and length of "category_label"
	  if (aHasCategoryLabel && !bHasCategoryLabel) {
		return -1
	  } else if (!aHasCategoryLabel && bHasCategoryLabel) {
		return 1
	  } else {
		return 0
	  }
  }

  const getDownloadUrl = () => {

	  console.log("APP: ", app)

	  const appEnding = app?.public === true ? app?.app_version : app?.id

	  return `curl -L \ \\\n    "${globalUrl}/api/v1/download_docker_image?image=frikky/shuffle:${app?.name.toLowerCase().replaceAll(' ', '_')}_${appEnding}" \\\n    -H \"Authorization: Bearer APIKEY" \\\n    -o image.zip; \\\n    docker load -i image.zip`
  }

  const renderedActionOptions = deduplicateByName((
	  actions === undefined || actions === null ? [] : 
	  actions.filter((a) => 
		  a.category_label !== undefined && a.category_label !== null && a.category_label.length > 0).concat(sortByKey(actions, "label"))
      ).sort(sortByCategoryLabel))

  const actionView =
    actions === undefined || actions === null ? null : (
      <div style={{ color: "white" }}>
        <div style={{ display: "flex" }}>

          {isMobile || appType === 0 || appType === 2 ? null : (
			<span style={{maxWidth: 350, minWidth: 350, marginRight: 10, marginLeft: 10, marginTop: 10, }}>
				<div
					style={{
						maxHeight: 800,
						overflowY: "auto",
						overflowX: "hidden",
					}}
				>
					<LoopActions actions={actions} />
				</div>
			</span>
          )}

          <Paper
            style={{
              flex: 6,
              margin: 10,
              padding: 30,
              backgroundColor: boxStyle.backgroundColor,
              color: "white",
              textAlign: "left",
              paddingBottom: 50,
              overflow: "hidden",

			  margin: "auto",
            }}
          >
            <Tabs
			  color="secondary"
              indicatorColor="primary"
			  textColor="secondary"
			  variant="fullWidth"
              value={selectedTab}
              onChange={(event, newValue) => {
				if (newValue === 1 && appType === 0 || appType === 2) {
					window.open(`/apis/${app.id}`, "_blank")
				} else {
                	setSelectedTab(newValue)
				}
              }}
              style={{ marginBottom: 0, marginLeft: 0, marginRight: 0, minWidth: 800, maxWidth: 800, margin: "auto", }}
              aria-label="disabled tabs example"
            >
              <Tab style={{marginLeft: 0, }} icon={<DescriptionIcon />} label="Docs" />
              <Tab icon={appType === 0 || appType === 2 ? <OpenInNewIcon /> : <AppsIcon />} label={appType === 0 || appType === 2 ? "Explore the API" : "Try it out"} />

              <Tab icon={<ShowChartIcon />} label="Stats" />
              <Tab icon={<PolylineIcon />} disabled label="Integrations" />
              <Tab icon={<PersonIcon />} disabled={userdata.support !== true} label="Creator" value={4}  />
            </Tabs>
            <div style={{ marginTop: 25 }}>
              {selectedTab === 1 && app.skipped_build == false ? (
                <div style={{ display: "flex", marginLeft: 25,  }}>
                  <div style={{ }}>
                    <SelectedActionView action={currentAction} />
                  </div>
                  <div style={{ marginLeft: 25, maxWidth: 350 }}>
										{currentAction.description !== undefined && currentAction.description !== null && currentAction.description !== "" ? 
											<div
                        style={{
                          maxHeight: 175,
                          overflowX: "hidden",
                          overflowY: "auto",
                          marginBottom: 25,
                        }}
                      >
                        <Typography variant="h6" style={{ flex: 10 }}>
                          Action Description
                        </Typography>
                        <Typography
                          variant="body1"
                          color="textSecondary"
                          style={{ maxWidth: 350, minWidth: 350 }}
                        >
                          {currentAction.description}
                        </Typography>
                      </div>
                    : app.description !== undefined &&
											app.description !== null &&
											app.description.length > 0 ? 
                      <div
                        style={{
                          maxHeight: 175,
                          overflowX: "hidden",
                          overflowY: "auto",
                          marginBottom: 25,
                        }}
                      >
                        <Typography variant="h6" style={{ flex: 10 }}>
                          App Description
                        </Typography>
                        <Typography
                          variant="body1"
                          color="textSecondary"
                          style={{ maxWidth: 350, minWidth: 350 }}
                        >
                          {app.description}
                        </Typography>
                      </div>
                     : null}
                    <div style={{ display: "flex" }}>
                      <Typography variant="h6" style={{ flex: 10 }}>
                        Result
                      </Typography>
                      <IconButton
                        disabled={executing || appType === 2}
                        color="primary"
                        style={{
                          border: `1px solid ${theme.palette.primary.main}`,
                        }}
                        variant="contained"
                        onClick={() => {
                          executeSingleAction(
                            selectedAction.app_id,
                            selectedAction
                          );
                        }}
                      >
                        <Tooltip title="Run Action" placement="top">
                          <PlayArrowIcon />
                        </Tooltip>
                      </IconButton>
                    </div>
                    {executing ? (
                      <div style={{ textAlign: "center", width: "100%" }}>
							{serverside === true ? null : 
								<CircularProgress
									style={{
										marginTop: 25,
										height: 35,
										width: 35,
										marginLeft: "auto",
										marginRight: "auto",
									}}
								/>
							}
                      </div>
                    ) : (
                      <div>
                        {executionResult.valid ? (
                          <ReactJson
                            src={executionResult.result}
                            theme={theme.palette.jsonTheme}
                            style={theme.palette.reactJsonStyle}
                            collapsed={false}
                            displayDataTypes={false}
                            enableClipboard={(copy) => {
                              handleReactJsonClipboard(copy);
                            }}
                            onSelect={(select) => {
                              HandleJsonCopy(
                                executionResult.result,
                                select,
                                "exec"
                              );
                              console.log("SELECTED!: ", select);
                            }}
                            name={"Result"}
                          />
                        ) : (
                          <Typography variant="body2">
                            {executionResult.result}
                          </Typography>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedTab === 2 && app.id !== undefined ? (
                <div>

				  <Typography variant="h4">
				  	Use the App onprem (hybrid)
				  </Typography> 
				  <Typography variant="body2" color="textSecondary" style={{marginTop: 5, }}>
				  	Due to using docker containers with privately uploaded containers, we had to use a custom registry. Use the command below to download the image to the server if it fails to run.

				  	It will authenticate and authorize you, before redirecting to a Signed URL on https://storage.googleapis.com

				  	<b>&nbsp;Now also works for ARM containers!</b>
				  </Typography> 

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
					  <code
						style={{
							// Wrap if larger than X
							whiteSpace: "pre",
							overflow: "auto",
							marginRight: 40,
						}}
					  >
						{getDownloadUrl()}
					  </code>
				  </div>
				  <CopyToClipboard
				  	text={getDownloadUrl()}
				  />

				  <div style={{marginTop: 50, }}>
					  <AppStats
						globalUrl={globalUrl}
						appId={app.id}
						{...props}
					  />
				  </div>
                </div>
              ) : selectedTab === 0 ? (
                <div
                  style={{ minWidth: "100%", maxWidth: "100%", margin: "auto" }}
                >
                  <Markdown
					components={{
						img: Img,
						code: CodeHandler,
						h1: Heading,
						h2: Heading,
						h3: Heading,
						h4: Heading,
						h5: Heading,
						h6: Heading,
						a: OuterLink,
					}}
					id="markdown_wrapper"
					escapeHtml={false}
					style={{
						maxWidth: "100%", minWidth: "100%", 
					}}
                  >
				  	{appDocumentation}
				  </Markdown>
                </div>
              ) : selectedTab === 3 && secondaryApp.objectID !== undefined && app.name !== undefined ? (
                <div
                  style={{
                    maxWidth: "100%",
                    minWidth: "100%",
                    margin: "auto",
                    marginTop: 50,
                  }}
                >
                  <Typography
                    variant="h1"
                    style={{ textAlign: "center", fontSize: 22 }}
                  >
                    Connect {app.name.replaceAll("_", " ")} and{" "}
					{secondaryApp.name.replaceAll("_", " ")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    style={{ textAlign: "center" }}
                  >
                    Using Shuffle, you can connect{" "}
                    {app.name.replaceAll("_", " ")} and{" "}
                    {secondaryApp.name.replaceAll("_", " ")} with no code.
                  </Typography>
                  <div style={{ display: "flex", marginTop: 25 }}>
                    <div
                      style={{
                        flex: 2,
                        display: "flex",
                        maxHeight: 100,
                        minHeight: 100,
                        border: "1px solid rgba(255,255,255,0.3",
                        marginRight: 10,
                        borderRadius: theme.palette?.borderRadius,
                      }}
                    >
                      <img
                        src={app.large_image}
                        alt={app.name}
                        id="logo"
                        style={imageStyle}
                      />
                      <Typography variant="h6" style={textStyle}>
                        {app.name.replaceAll("_", " ")}
                      </Typography>
                    </div>
                    <div
                      style={{
                        flex: 2,
                        display: "flex",
                        maxHeight: 100,
                        minHeight: 100,
                        border: "1px solid rgba(255,255,255,0.3",
                        marginleft: 10,
                        borderRadius: theme.palette?.borderRadius,
                      }}
                    >
                      <img
                        src={secondaryApp.image_url}
                        alt={secondaryApp.name}
                        id="logo"
                        style={imageStyle}
                      />
                      <Typography variant="h6" style={textStyle}>
                        {secondaryApp.name.replaceAll("_", " ")}
                      </Typography>
                    </div>

                  </div>
                  <div style={{ textAlign: "center", marginTop: 25 }}>
                    <Link
                      rel="noopener noreferrer"
                      to={`/register?app_one=${app.name}&app_two=${secondaryApp.name}&message=You need to login first to connect ${app.name} and ${secondaryApp.name}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => {
													const allapps = [app.name, secondaryApp.name].sort()

                          ReactGA.event({
                            category: "Appexplorer",
                            action: "app_connect_click",
                            label: `${allapps[0]}_and_${allapps[1]}`,
                          })
                        }}
                        style={{
                          padding: 15,
                          marginTop: 15,
                          borderRadius: 25,
                          height: 50,
                          margin: "15px 0px 15px 0px",
                          fontSize: 14,
                          color: "white",
                          backgroundImage: buttonBackground,
                          marginRight: 10,
                        }}
                      >
                        Connect {app.name.replaceAll("_", " ")} and{" "}
                        {secondaryApp.name.replaceAll("_", " ")}
                      </Button>
                    </Link>
                  </div>


                  <Divider style={{ marginTop: 50, marginBottom: 50 }} />
                  <div
                    style={{
                      minWidth: "100%",
                      maxWidth: "100%",
                      margin: "auto",
                    }}
                  >
                  	<Markdown
				  	  components={{
				  	  	img: Img,
				  	  	code: CodeHandler,
				  	  	h1: Heading,
				  	  	h2: Heading,
				  	  	h3: Heading,
				  	  	h4: Heading,
				  	  	h5: Heading,
				  	  	h6: Heading,
				  	  	a: OuterLink,
				  	  }}
				  	  id="markdown_wrapper"
				  	  escapeHtml={false}
				  	  style={{
				  	  	maxWidth: "100%", minWidth: "100%", 
				  	  }}
                  	>
				  		{appDocumentation}
				  	</Markdown>
                  </div>
                </div>
              ) : 
			  	selectedTab === 4 ? 
					<div>
						<Typography variant="h4">
							App Details
						</Typography> 
						<Typography variant="body2" style={{marginTop: 20, marginBottom: 10, }} color="textSecondary">
							Add more details about your app here. This is to help both the Shuffle team, and the public get easier access to this information. Data from these will be used to track app "completeness" for recommendation systems.
						</Typography> 
				  		<Divider style={{marginTop: 10, marginBottom: 10, }}/>
				  		<Typography variant="h6" style={{marginTop: 20, marginBottom: 10, }}>
				  			Validation Action
				  		</Typography>
						<Typography variant="body2" style={{marginBottom: 20, }} color="textSecondary">
				  			The validation action is the action that is used to validate the app. This is used both when a user wants to validate their auth, as well as when Shuffle runs automatic tests of the app. It is recommended that the action should be a GET request. Validation is decided based on whether the action is ran successfully in a workflow.
						</Typography> 

						<Autocomplete
							id="action_search"
							value={selectedValidationAction}
							classes={{ inputRoot: classes.inputRoot }}
							groupBy={(option) => {
								// Most popular
								// Is categorized
								// Uncategorized
								return option.category_label !== undefined && option.category_label !== null && option.category_label.length > 0 ? "Most used" : "All Actions";
							}}
							renderGroup={(params) => {

								return (
									<li key={params.key}>
										<Typography variant="body1" style={{textAlign: "center", marginLeft: 10, marginTop: 25, marginBottom: 10, }}>{params.group}</Typography>
										<Typography variant="body2">{params.children}</Typography>
									</li>
								)	
							}}
							options={renderedActionOptions}
							ListboxProps={{
							  style: {
								backgroundColor: theme.palette.surfaceColor,
								color: "white",
							  },
							}}
							filterOptions={(options, { inputValue }) => {
								const lowercaseValue = inputValue === null ? "" : inputValue.toLowerCase()
								options = options.filter((x) => {
									if (x.name === undefined || x.name === null) {
										x.name = ""
									}

									if (x.description === undefined || x.description === null) {
										x.description = ""
									}

									if (x.method !== "GET") {
										return null
									}

									return x.name.replaceAll("_", " ").toLowerCase().includes(lowercaseValue) || x.description.toLowerCase().includes(lowercaseValue)
								})

								return options
							}}
							getOptionLabel={(option) => {
							  if (option === undefined || option === null || option.name === undefined || option.name === null ) {
								return null;
							  }

							  const newname = (
								option.name.charAt(0).toUpperCase() + option.name.substring(1)
							  ).replaceAll("_", " ");

							  return newname;
							}}
							fullWidth
							style={{
							  backgroundColor: theme.palette.inputColor,
							  height: 50,
							  borderRadius: theme.palette?.borderRadius,
							}}
							onChange={(event, newValue) => {
							  // Workaround with event lol
							  console.log("Changed to: ", event, newValue)
							  toast("Changed validation action") 
							  if (newValue !== undefined && newValue !== null) {
								/*
								setNewSelectedAction({ 
									target: { 
										value: newValue.name 
									} 
								})
								*/
							  }
							}}
							renderOption={(props, option, state) => {
							  var newActionname = option.name;
							  if (option.label !== undefined && option.label !== null && option.label.length > 0) {
								newActionname = option.label;
							  }

							  var newActiondescription = option.description;
							  //console.log("DESC: ", newActiondescription)
							  if (option.description === undefined || option.description === null) {
								newActiondescription = "Description: No description defined for this action"
							  } else {
								newActiondescription = "Description: "+newActiondescription
							  }

							  const iconInfo = GetIconInfo({ name: option.name });
							  const useIcon = iconInfo.originalIcon;

							  if (newActionname === undefined || newActionname === null) {
								  newActionname = "No name"
								  option.name = "No name"
								  option.label = "No name"
							  }

							  newActionname = (newActionname.charAt(0).toUpperCase() + newActionname.substring(1)).replaceAll("_", " ");

								var method = ""
								var extraDescription = ""
								if (option.name.includes("get_")) {
									method = "GET"
								} else if (option.name.includes("post_")) {
									method = "POST"
								} else if (option.name.includes("put_")) {
									method = "PUT"
								} else if (option.name.includes("patch_")) {
									method = "PATCH"
								} else if (option.name.includes("delete_")) {
									method = "DELETE"
								} else if (option.name.includes("options_")) {
									method = "OPTIONS"
								} else if (option.name.includes("connect_")) {
									method = "CONNECT"
								}

								// FIXME: Should it require a base URL?
								if (method.length > 0 && option.description !== undefined && option.description !== null && option.description.includes("http")) {
									var extraUrl = ""
									const descSplit = option.description.split("\n")
									// Last line of descSplit
									if (descSplit.length > 0) {
										extraUrl = descSplit[descSplit.length-1]
									} 

									if (extraUrl.length > 0) {
										if (extraUrl.includes(" ")) {
											extraUrl = extraUrl.split(" ")[0]
										}

										if (extraUrl.includes("#")) {
											extraUrl = extraUrl.split("#")[0]
										}

										extraDescription = `${method} ${extraUrl}`
									} else {
										//console.log("No url found. Check again :)")
									}
								}

							  return (
								<ActionSelectOption
								  {...props}
									option={option}
									newActiondescription={newActiondescription}
									useIcon={useIcon}
									newActionname={newActionname}
									extraDescription={extraDescription}
								/>
							  );
							}}
							renderInput={(params) => {
								if (params.inputProps?.value) {
									const prefixes = ["Post", "Put", "Patch"];
									for (let prefix of prefixes) {
										if (params.inputProps.value.startsWith(prefix)) {
											let newValue = params.inputProps.value.replace(prefix + " ", "");
											if (newValue.length > 1) {
												newValue = newValue.charAt(0).toUpperCase() + newValue.substring(1);
											}
											// Set the new value without mutating inputProps
											params = { ...params, inputProps: { ...params.inputProps, value: newValue } };
											break;
										}
									}
									// Check if it starts with "Get List" and method is "Get"
									if (params.inputProps.value.startsWith("Get List")) {
										console.log("Get List")
									}
								}

								const actionDescription = ""
								const isIntegration = false

								  return (
									  <Tooltip title={actionDescription}
										placement="right" 
										open={false}
										PopperProps={{
											sx: {
											'& .MuiTooltip-tooltip': {
												backgroundColor: 'transparent',
												boxShadow: 'none',
											},
											'& .MuiTooltip-arrow': {
												color: 'transparent',
											},
											},
										}}
										>
											<TextField
											{...params}

											data-lpignore="true"
											autocomplete="off"
											dataLPIgnore="true"
											autoComplete="off"

											color="primary"
											id="checkbox-search"
											variant="body1"
											style={{
												backgroundColor: theme.palette.inputColor,
												borderRadius: theme.palette?.borderRadius,
											}}
											label={"Select Validation Action"}
											variant="outlined"
											name={`disable_autocomplete_${Math.random()}`}
											/>	
										</Tooltip>
								  )
								}}
						/>

				  		<Divider style={{marginTop: 30, marginBottom: 10, }}/>
				  		<Typography variant="h6" style={{marginTop: 20, marginBottom: 10, }}>
				  			Triggers
				  		</Typography>
						<div style={{display: "flex", }}>
							<Typography variant="body1" color="textSecondary" style={{marginTop: 7, }}>
								Schedule:
							</Typography>
							<Checkbox
								checked={triggers === undefined ? false : triggers.find(trigger => trigger.name === "Schedule") !== undefined}
								label="Schedule"
								onChange={(e) => {
									editTrigger("Schedule")

								}}
							/>
							<Typography variant="body1" color="textSecondary" style={{marginTop: 7, marginLeft: 20, }}>
								Webhook:
							</Typography>
							<Checkbox
								checked={triggers === undefined ? false : triggers.find(trigger => trigger.name === "Webhook") !== undefined}
								label="Webhook"
								onChange={() => {
									editTrigger("Webhook")

								}}
							/>
						</div>
				  		{triggers === undefined || triggers === null || triggers.find(trigger => trigger.name === "Webhook") === undefined ? null : 
							<TextField 
								label="Webhook Example response"
								variant="outlined"
								disabled
								fullWidth
								multiline
								style={{
									maxHeight: 200,
								}}

								onBlur={(e) => {
									submitAppDetails("extra_value", e.target.value)
								}}
							/>
						}
				  		<Divider />
				  		<Typography variant="h6" style={{marginTop: 20, marginBottom: 10, }}>
				  			External info	
				  		</Typography>
						<AppDetails 
							title="External Documentation URL"
							inputTitle={app.reference_info.documentation_url === undefined ? "" : app.reference_info.documentation_url}
						/>
						<AppDetails 
							title="Blogpost"
							inputTitle={app.blogpost === undefined ? "" : app.blogpost}
						/>
						<AppDetails 
							title="Video"
							inputTitle={app.video === undefined ? "" : app.video}
						/>

						<Typography variant="h6" style={{marginTop: 20, marginBottom: 10, }}>
							Partner Details
						</Typography> 
						<AppDetails 
							title="Partner Website"
							inputTitle={app.company_url === undefined ? "" : app.company_url}
						/>
						<AppDetails 
							title="Partner Contacts"
							inputTitle={app.reference_info.partner_contacts === undefined ? "" : app.reference_info.partner_contacts}
						/>

				  		<Divider style={{marginTop: 20, }} />

						<Typography variant="h6" style={{marginTop: 20, marginBottom: 10, }}>
				  			Public Status
						</Typography> 
				  		<Button
				  			style={{marginTop: 10, }}
				  			variant="outlined"
							onClick={() => {
								removeAppFromSearchEngine(app.id)
							}}
				  		>
				  			Unpublish App from Search Engine 
				  		</Button>

					</div>
				:
			  (
                <div>
                  <Typography
                    variant="h1"
					color="textSecondary"
                    style={{
					  margin: "auto",
                      textAlign: "center",
                      fontSize: 22,
                      marginTop: 20,
                      paddingTop: 20,
					  maxWidth: 550,
					  minWidth: 550,
                    }}
                  >
                    This app is currently in Beta, but is usable. Interested in using this app? Click the button below or contact us.
                    <div style={{ marginTop: 10 }}>
                    {activateButton}
                    </div>
                  </Typography>

					{app.description !== undefined && 
						app.description !== null &&
						app.description !== "" ? 
							<span style={{textAlign: "center", }}>
								<Typography variant="h6" style={{ marginTop: 50, }}>
									More about the app 
								</Typography>
								<Typography
									variant="body1"
									color="textSecondary"
									style={{ maxWidth: 550, minWidth: 550, margin: "auto", marginTop: 10,  }}
								>
									{app.description}
								</Typography>
							</span>
					: null}
                </div>
              )}
            </div>
          </Paper>
        </div>
      </div>
    );

  // Random names for type & autoComplete. Didn't research :^)
  const imageData = file.length > 0 ? file : fileBase64;
  const height = 100;
  const imageInfo = (
    <img
      src={imageData}
      alt=""
      id="logo"
      style={{
        borderRadius: theme.palette?.borderRadius,
        border: "1px solid rgba(255,255,255,0.6)",
        maxWidth: height,
        maxHeight: height,
        minWidth: height,
        minHeight: height,
        objectFit: "contain",
      }}
    />
  );

  const publishModal = publishModalOpen ? (
    <Dialog
      open={publishModalOpen}
      onClose={() => {
        setPublishModalOpen(false);
      }}
      PaperProps={{
        sx: {
          borderRadius: theme?.palette?.DialogStyle?.borderRadius,
          border: theme?.palette?.DialogStyle?.border,
          minWidth: '500px',
          fontFamily: theme?.typography?.fontFamily,
          backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
          zIndex: 1000,
          '& .MuiDialogContent-root': {
            backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
          },
          '& .MuiDialogTitle-root': {
            backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
          },
        }
      }}
    >
      <DialogTitle style={{ marginBottom: 0, padding: 50,  paddingBottom: 0, }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
          Are you sure you want to PUBLISH this app?
        </div>
      </DialogTitle>
      <DialogContent
        style={{ color: "rgba(255,255,255,0.65)", textAlign: "center", padding: 50, }}
      >
        <div>
          <Typography variant="body1" style={{ marginBottom: 20 }}>
            Before publishing, make sure to sanitize the App for anything you don't want public. 
          </Typography>
          <Typography variant="body1" style={{ marginBottom: 20 }}>
			The published App is yours, and you can always change your public Apps after they are released.
          </Typography>
        </div>
        <Button
          variant="contained"
          style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#1a1a1a", backgroundColor: "#ff8544" }}
          onClick={() => {
			updateAppField(selectedApp.id, "sharing", true);
            setPublishModalOpen(false);
          }}
          color="primary"
        >
          Yes
        </Button>
        <Button
          style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#ff8544", marginLeft: 5 }}
          onClick={() => {
            setPublishModalOpen(false);
          }}
          color="primary"
        >
          No
        </Button>
      </DialogContent>
    </Dialog>
  ) : null;

  const landingpageDataBrowser = (
    <div
      style={{
        paddingTop: isMobile ? 0 : 25,
        paddingBottom: 100,
        color: "white",
      }}
    >
      {publishModal}
      <div style={{ display: "flex", position: "relative" }}>
        {isMobile ? null : (
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="›"
            style={{ color: "white", marginLeft: 15, flex: 100 }}
          >
            <Link
              to="/search"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h2 style={{ color: "rgba(255,255,255,0.5)" }}>
                <AppsIcon style={{ marginRight: 10 }} />
                Apps
              </h2>
            </Link>
            <Link
              to={`/apps/${params.appid}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h2>{name}</h2>
            </Link>
          </Breadcrumbs>
        )}
        <div
          style={{ position: "absolute", top: 40, right: 10, display: "flex", gap: "10px",}}
        >
          {app.documentation_download_url !== undefined &&
          app.documentation_download_url !== null &&
          app.documentation_download_url.length > 0 ? (
            <IconButton
              color="primary"
              style={{ marginRight: 20 }}
              variant="contained"
              onClick={() => {
                const data = openapi;

                let linkElement = document.createElement("a");
                linkElement.setAttribute("target", "_blank");
                linkElement.setAttribute(
                  "href",
                  app.documentation_download_url
                );
                linkElement.setAttribute(
                  "download",
                  app.documentation_download_url
                );
                linkElement.click();
              }}
            >
              <Tooltip title="Download Documentation" placement="top">
                <DescriptionIcon color="secondary" />
              </Tooltip>
            </IconButton>
          ) : null}
          {appType === 0 || appType === 2 ? (
            <IconButton
              color="primary"
              style={{ marginRight: 20 }}
              variant="contained"
              onClick={() => {
                const data = openapi;
                let exportFileDefaultName = name + ".json";

                let dataStr = JSON.stringify(data);
                let dataUri =
                  "data:application/json;charset=utf-8," +
                  encodeURIComponent(dataStr);
                let linkElement = document.createElement("a");
                linkElement.setAttribute("href", dataUri);
                linkElement.setAttribute("download", exportFileDefaultName);
                linkElement.click();

                const tmpurl = new URL(window.location.href);
                const searchParams = tmpurl.searchParams;
                const queryID = searchParams.get("queryID");

                if (queryID !== undefined && queryID !== null) {
                  aa("init", {
                    appId: "JNSS5CFDZZ",
                    apiKey: "db08e40265e2941b9a7d8f644b6e5240",
                  });

                  const timestamp = new Date().getTime();
                  aa("sendEvents", [
                    {
                      eventType: "conversion",
                      eventName: "Public App Downloaded",
                      index: "appsearch",
                      objectIDs: [app.id],
                      timestamp: timestamp,
                      queryID: queryID,
                      userToken:
                        userdata === undefined ||
                        userdata === null ||
                        userdata.id === undefined
                          ? "unauthenticated"
                          : userdata.id,
                    },
                  ]);
                } else {
                  console.log("No query to handle when downloading");
                }
              }}
            >
              <Tooltip title="Download OpenAPI" placement="top">
                <CloudDownloadIcon color="secondary" />
              </Tooltip>
            </IconButton>
          ) : null}

	  	  {selectedOrganization !== undefined && selectedOrganization !== null && selectedOrganization.id !== undefined && userdata.support === true ?
			// Iconbutton for authentication with just an icon. Link to /apps/authentication?app_id=app.id
			<IconButton
				color="secondary"
			  	variant="contained"
			    style={{marginRight: 20, }}
			  	onClick={() => {
					window.open(`/appauth?app_id=${app.id}&auth=${selectedOrganization.org_auth.token}`, "_blank")
				}}
			>
				<Tooltip title="Public Authentication link for the current Organization. Times out every 24 hours." placement="top">
				  	<LockOpenIcon />
				</Tooltip>
			</IconButton>
		  : null}

	  	  {isMobile || userdata?.active_apps === undefined || userdata?.active_apps === null || !userdata?.active_apps?.includes(appId) ? null :
            <Button
			  variant={userdata.active_apps !== undefined && userdata.active_apps !== null && userdata.active_apps.includes(appId) ? "outlined": "contained"}
              component="label"
              color="primary"
              onClick={() => {
				if (!isLoggedIn) {
					//navigate("/login?message=You must be logged in to activate this app&view=/apps/" + params.appid);
					toast("You must be logged in to activate apps! Go to /login first.") 
					return;
				}

				toast.info("Sending download job to relevant runtime locations")
                
				activateApp("distribute")

              }}
              style={{ height: 40, marginTop: 5 }}
            >
				Push Image
            </Button>
          }

          {isMobile ? null : (
            <Button
			  variant={userdata.active_apps !== undefined && userdata.active_apps !== null && userdata.active_apps.includes(appId) ? "outlined": "contained"}
              component="label"
              color="primary"
              onClick={() => {
				if (!isLoggedIn) {
					//navigate("/login?message=You must be logged in to activate this app&view=/apps/" + params.appid);
					toast("You must be logged in to activate apps! Go to /login first.") 
					return;
				}

                const tmpurl = new URL(window.location.href);
                const searchParams = tmpurl.searchParams;
                const queryID = searchParams.get("queryID");

                if (queryID !== undefined && queryID !== null) {
                  aa("init", {
                    appId: "JNSS5CFDZZ",
                    apiKey: "db08e40265e2941b9a7d8f644b6e5240",
                  });

                  const timestamp = new Date().getTime();
                  aa("sendEvents", [
                    {
                      eventType: "conversion",
                      eventName: "Public App Activated",
                      index: "appsearch",
                      objectIDs: [app.id],
                      timestamp: timestamp,
                      queryID: queryID,
                      userToken:
                        userdata === undefined ||
                        userdata === null ||
                        userdata.id === undefined
                          ? "unauthenticated"
                          : userdata.id,
                    },
                  ]);
                } else {
                  console.log("No query to handle when activating");
                }

                activateApp();
              }}
              style={{ height: 40, marginTop: 5 }}
            >
			  {userdata.active_apps !== undefined && userdata.active_apps !== null && userdata.active_apps.includes(appId) ?
				  "Deactivate App"
				  :
				  "Activate App"
			  }
            </Button>
          )}
			{appType === 1 ? null : 
  				userdata?.support || userdata?.id === app?.owner || (userdata?.admin === "true" && userdata?.active_org?.id === app?.reference_org) || app?.contributors?.includes(userdata?.id) || creatorProfile?.self === true ?
				<Tooltip title="Edit App" placement="top">
					<Button
						variant="outlined"
						component="label"
						color="secondary"
						onClick={() => {
							navigate(`/apps/edit/${appId}`)
						}}
						style={{ height: 40, marginTop: 5, marginLeft: 5, }}
					>
						<EditIcon style={{marginRight: 10, }}/> Edit 
					</Button>
				</Tooltip>
  			: isMobile || !isLoggedIn ? null : 
				<Tooltip title="Fork this app to edit it for yourself" placement="top">
					<Button
						variant="outlined"
						component="label"
						color="secondary"
						onClick={() => {
							navigate(`/apps/new?id=${appId}`)
						}}
						style={{ height: 40, marginTop: 5, marginLeft: 5, }}
					>
						<ForkRightIcon style={{marginRight: 10, }}/> Fork
					</Button>
				</Tooltip>
          }

          {appType === 0 || appType === 2 ? (
			<div style={{display: "flex", alignItems: 'center',gap: 10 }}>
				<a
				  rel="noopener noreferrer"
				  href={`/apis/${app.id}`}
				  target="_blank"
				  style={{ textDecoration: "none", color: "#f85a3e", }}
				>
				  <Button
					variant="outlined"
					color="secondary"
			  		style={{ height: 40, marginTop: 5, marginLeft: 5, }}
				  >
  					<OpenInNewIcon style={{marginRight: 5, }}/>
					Explore API
				  </Button>
				</a>
                <Select
                  value={sharingConfiguration}
			  	  disabled={!isCloud}
                  onChange={(event) => {
                    if ((appdata.owner !== userdata.id) && (!userdata.support)) {
                      toast("You're not the owner of this app. You can't update it.");
                      return;
                    }
                    setSharingConfiguration(event.target.value);
                    if (event.target.value === "you") {
                      toast("Changing sharing to " + event.target.value);
                      updateAppField(appdata.id, "sharing", false);
                    } else if (
                      event.target.value === "everyone" ||
                      event.target.value === "public"
                    ) {
  
                    if (!isCloud) {
                        setPublishModalOpen(true)
                    } else {
                        updateAppField(appdata.id, "sharing", true);
                      }
                    } else {
                      console.log(
                        "Can't handle value for sharing: ",
                        event.target.value
                      );
                    }
                  }}
                  style={{
                    width: 150,
                    backgroundColor: theme.palette.surfaceColor,
                    color: "white",
                    height: 40,
                    marginTop: 5
                  }}
                  SelectDisplayProps={{
                    style: {
                      marginLeft: 10,
                      display: 'flex'
                    },
                  }}
                >
                  {userRoles.map((data) => {
                    return (
                      <MenuItem
                        key={data}
                        style={{ backgroundColor: inputColor, color: "white", display: 'flex' }}
                        value={data}
                      >
                        {data}
                      </MenuItem>
                    );
                  })}
                </Select>
			</div>
          ) : (
            <a
              rel="noopener noreferrer"
              href={"https://shuffler.io/docs/app_creation#python---building-apps-manually"}
              target="_blank"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              <img
                src={"/images/frameworks/python.jpeg"}
                alt="Python integration for Shuffle"
                id="logo"
                style={{
                  marginTop: 5,
                  marginLeft: 15,
                  height: 35,
                  borderRadius: theme.palette?.borderRadius,
                }}
              />
            </a>
          )}
        </div>
      </div>
      <div
        style={{ display: "flex", flexDirection: isMobile ? "column" : "row" }}
      >
        <Paper style={boxStyle}>
          <div
            style={{
              color: "white",
              flex: 1,
              display: "flex",
              flexDirection: "row",
            }}
          >
            <div
              style={{
                flex: 1,
                margin: 10,
                cursor: "pointer",
                backgroundColor: inputColor,
                maxWidth: height,
                maxHeight: height,
              }}
              onClick={() => {
                upload.click();
              }}
            >
              {imageInfo}
            </div>
            <div style={{ marginLeft: 15, color: "white" }}>
							<div style={{display: "flex", marginTop: 5, }}>
              	<Typography variant="h6" style={{  }}>
									{name}
								</Typography>
                <span style={{ marginTop: "auto", marginBottom: "auto" }}>
                  {(app.public || appType === 0) && app.skipped_build == false ? (
                    <Tooltip title="This app is verified" placement="top">
                      <VerifiedUserIcon style={{marginLeft: 10, }} />
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title="This app may not work, and can't be tested yet"
                      placement="top"
                    >
                      <WarningIcon />
                    </Tooltip>
                  )}
                </span>

								{/* Handles category changing, but looks like shit. Should probably work as a suggestion */}
								{/*
								<Select
									onChange={(e) => {
										console.log("Changed: ", e.target.value)
          					setNewWorkflowCategories([e.target.value]);
									}}
        					value={newWorkflowCategories.length === 0 ? "Select a category" : newWorkflowCategories[0]}
        					style={{ 
										flexAlign: "right",
										color: "white", 
										height: 40,
										width: 150,
										borderRadius: 20,
										marginLeft: 200, 
									}}
								>
									{categories.map((category, categoryIndex) => {
										if (category === undefined || category === null || category === "") {
											return null
										}

										return (
											<MenuItem
												key={categoryIndex}
												value={category}
												style={{ 
												}}
											>
												{category.name}
											</MenuItem>
										)
									})}
								</Select>
								*/}
              </div>
              <div style={{ marginTop: 5 }}>
                <Typography variant="body1" color="textSecondary">
                 Version - {app?.app_version}
                </Typography>
              </div>
              <div style={{ marginTop: 5 }} />
              {Object.getOwnPropertyNames(creatorProfile).length !== 0 &&
				  creatorProfile.github_avatar !== undefined &&
				  creatorProfile.github_avatar !== null ? (
                <div style={{ display: "flex" }}>
                  <IconButton
                    color="primary"
                    style={{ padding: 0, marginRight: 10 }}
                    aria-controls="simple-menu"
                    aria-haspopup="true"
                    onClick={(event) => {
                      setAnchorElAvatar(event.currentTarget);
                    }}
                  >
                    <Link
                      to={`/creators/${creatorProfile.github_username}`}
                      style={{ textDecoration: "none", color: "#f86a3e" }}
                    >
                      <Avatar
                        style={{ height: 30, width: 30 }}
                        alt={contact.name}
                        src={creatorProfile.github_avatar}
                      />
                    </Link>
                  </IconButton>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    style={{ color: "" }}
                  >
                    Shared by{" "}
                    <Link
                      to={`/creators/${creatorProfile.github_username}`}
                      style={{ textDecoration: "none", color: "#f86a3e" }}
                    >
                      {creatorProfile.github_username}
                    </Link>
                    <Button
                      style={{
                        borderRadius: 25,
                        fontSize: 11,
                        color: "white",
                        backgroundColor: "rgba(255,255,255,0)",
                        border: "1px solid #ddf4e1",
                        textTransform: "none",
                        marginLeft: 4,
                        padding: 1,
                      }}
                      onClick={() => {
                        ReactGA.event({
                          category: "hiring_button",
                          action: `${creatorProfile.github_username}_app_click`,
                          label: name,
                        });

                        if (window.drift !== undefined) {
                          window.drift.api.startInteraction({
                            interactionId: 342345,
                          });
                        } else {
                          console.log(
                            "Couldn't find drift in window.drift and not .drift-open-chat with querySelector: ",
                            window.drift
                          );
                          toast(
                            `Thanks for showing interest in getting help from ${creatorProfile.github_username}`
                          );
                        }
                      }}
                    >
                      Get help
                    </Button>
				{contact.name !== undefined &&
                    contact.name !== null &&
                    !contact.name.includes("frikky") &&
                    contact.name.length > 0 &&
                    contact.name.toLowerCase() !==
                      creatorProfile.github_username.toLowerCase() &&
                    !(
                      contact.name.toLowerCase().includes("anon") &&
                      creatorProfile.github_username.length > 0
                    ) ? (
                      <span style={{ marginLeft: 15 }}>
                        {" "}
                        •&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Created by {contact.name}
                      </span>
                    ) : (
                      ""
                    )}
                  </Typography>
                </div>
              ) : contact.name !== undefined &&
                contact.name !== null &&
                contact.name.length > 0 ? (
                <Typography
                  variant="body1"
                  color="textSecondary"
                  style={{ color: "" }}
                >
                  Created by {contact.name}
                </Typography>
              ) : null}
              <div
                style={{
                  marginTop: 5,
                  minHeight: 30,
                  maxHeight: 30,
                  overflow: "hidden",
                }}
              >
                {newWorkflowTags.map((tag, index) => {
                  return (
                    <Chip
                      key={index}
                      style={chipStyle}
                      variant="outlined"
                      label={tag}
                      color="primary"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Paper>
        {isMobile || serverside ? null : (
          <Card
          style={{
            flex: 1,
            margin: 10,
            backgroundColor: boxStyle.backgroundColor,
            color: "white",
            textAlign: "center",
          }}
        >
          <CardActionArea
            component={Link}
            to={"/search?tab=workflows&q=" + name.split(" ")[0]}
            style={{ height: "100%" }}
          >
            <div style={{ padding: "50px 0" }}>
              <Typography variant="h4">
                {relatedWorkflows !== 0 ? (
                  relatedWorkflows
                ) : (
                  <InstantSearch
                    searchClient={searchClient}
                    indexName="workflows"
                  >
                    <CustomSearchBox defaultRefinement={name.split(" ")[0]} />
                    <CustomWorkflowHits />
                  </InstantSearch>
                )}
              </Typography>
              <Typography
                variant="h6"
                color="textSecondary"
                style={{ marginTop: 5 }}
              >
                Workflows
              </Typography>
            </div>
          </CardActionArea>
        </Card>
        
        )}
        {app.video !== undefined &&
        app.video !== null &&
        app.video.includes("http") ? (
          <div style={{ margin: 10 }}>
            {app.video.includes("loom.com/share") &&
            app.video.split("/").length > 4 ? (
              <div>
                <iframe
                  src={`https://www.loom.com/embed/${app.video.split("/")[4]}`}
                  frameBorder={false}
                  webkitallowFullscreen={true}
                  mozallowFullscreen={true}
                  allowFullScreen={true}
                  style={{
                    marginTop: 15,
                    top: 0,
                    left: 0,
                    maxWidth: 230,
                    minWidth: 230,
                  }}
                />
              </div>
            ) : app.video.includes("youtube.com") &&
              app.video.split("/").length > 3 &&
              app.video.includes("v=") ? (
              <div>
                <iframe
                  src={`https://www.youtube.com/embed/${new URL(
                    app.video
                  ).searchParams.get("v")}`}
                  frameBorder={false}
                  webkitallowFullscreen={true}
                  mozallowFullscreen={true}
                  allowFullScreen={true}
                  style={{
                    top: 0,
                    left: 0,
                    maxWidth: 230,
                    minWidth: 230,
                  }}
                />
              </div>
            ) : (
              <Typography variant="body1">{app.video}</Typography>
            )}
          </div>
        ) : isMobile || serverside ? null : (
          <Card
            style={{
              flex: 1,
              margin: 10,
              backgroundColor: boxStyle.backgroundColor,
              color: "white",
              textAlign: "center",
            }}
          >
            <CardActionArea
              component={Link}
              to={"/search?tab=apps&q=" + name.split(" ")[0]}
              style={{
                height: "100%",
              }}
            >
              <div style={{ padding: "50px 0" }}>
                <Typography variant="h4">
                  {relatedApps !== 0 ? (
                    relatedApps
                  ) : (
                    <InstantSearch
                      searchClient={searchClient}
                      indexName="appsearch"
                    >
                      <CustomSearchBox defaultRefinement={name.split(" ")[0]} />
                      <CustomAppHits />
                    </InstantSearch>
                  )}
                </Typography>
                <Typography
                  variant="h6"
                  color="textSecondary"
                  style={{ marginTop: 5 }}
                >
                  Related apps
                </Typography>
              </div>
            </CardActionArea>
          </Card>

        )}
      </div>
      <div>
        <div style={{}}>{actionView}</div>
        {errorCode.length > 0 ? `Error: ${errorCode}` : null}
      </div>
    </div>
  );
  const loadedCheck =
    (isLoaded && isAppLoaded) || serverside === true ? (
      <div>
        {serverside === true ? (
          <div style={bodyDivStyle}>{landingpageDataBrowser}</div>
        ) : (
          <Fade
            in={true}
            timeout={1000}
            style={{ transitionDelay: `${150}ms` }}
          >
            <div style={bodyDivStyle}>{landingpageDataBrowser}</div>
          </Fade>
        )}
        <TextField
          id="copy_element_shuffle"
          value={to_be_copied}
          style={{ display: "none" }}
        />
      </div>
    ) : (
      <div>
		{serverside === true ? null : 
        	<div style={{ margin: "auto", textAlign: "center", width: 250 }}>
				<CircularProgress
					style={{
						marginTop: "27vh",
						minHeight: 35,
						maxHeight: 35,
						minWidth: 35,
						maxWidth: 35, 
						marginLeft: "auto",
						marginRight: "auto",
					}}
				/>
				<Typography variant="body1" color="textSecondary">
					Loading App
				</Typography>
			</div>
				}
      </div>
    );

  return <div style={{ marginLeft: !isLoggedIn || !isLoaded ? 0 : leftSideBarOpenByClick ? 280 : 80, transition: 'margin-left 0.3s ease'}}>{loadedCheck}</div>;
};
export default AppExplorer;
