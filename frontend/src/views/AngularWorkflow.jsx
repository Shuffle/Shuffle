import React, { useState, useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom"
import { useInterval } from "react-powerhooks";
import { makeStyles, useTheme } from "@material-ui/core/styles";

import { v4 as uuidv4 } from "uuid";
import { useNavigate, Link, useParams } from "react-router-dom";
// import { Prompt } from "react-router"; // FIXME
import { useBeforeunload } from "react-beforeunload";
import ReactJson from "react-json-view";
import NestedMenuItem from "material-ui-nested-menu-item";
import ReactMarkdown from "react-markdown";
import { useAlert } from "react-alert";
import theme from '../theme';
import { isMobile } from "react-device-detect" 

import {
	Zoom,
	Avatar,
	Popover,
  TextField,
  Drawer,
  Button,
  Paper,
  Grid,
  Tabs,
  InputAdornment,
  Tab,
  ButtonBase,
  Tooltip,
  Select,
  MenuItem,
  Divider,
  Dialog,
  DialogActions,
  DialogTitle,
  InputLabel,
  DialogContent,
  FormControl,
  IconButton,
  Menu,
  Input,
	Fade,
  FormGroup,
  FormControlLabel,
  Typography,
  Checkbox,
  Breadcrumbs,
  CircularProgress,
	SwipeableDrawer,
  Switch,
	Chip,
} from "@material-ui/core";

import {
	AvatarGroup,
} from "@mui/material"

import {
  OpenInNew as OpenInNewIcon,
  Undo as UndoIcon,
  GetApp as GetAppIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  ArrowLeft as ArrowLeftIcon,
  Cached as CachedIcon,
  DirectionsRun as DirectionsRunIcon,
  Polymer as PolymerIcon,
  FormatListNumbered as FormatListNumberedIcon,
  PlayArrow as PlayArrowIcon,
  AspectRatio as AspectRatioIcon,
  MoreVert as MoreVertIcon,
  Apps as AppsIcon,
  Schedule as ScheduleIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Save as SaveIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  LockOpen as LockOpenIcon,
  ExpandMore as ExpandMoreIcon,
  VpnKey as VpnKeyIcon,
  AddComment as AddCommentIcon,
	Edit as EditIcon,
} from "@material-ui/icons";

import {
		Preview as PreviewIcon,
} from '@mui/icons-material';

import Autocomplete from "@material-ui/lab/Autocomplete";
import * as cytoscape from "cytoscape";
import * as edgehandles from "cytoscape-edgehandles";
import * as clipboard from "cytoscape-clipboard";
import CytoscapeComponent from "react-cytoscapejs";
import undoRedo from "cytoscape-undo-redo";
import Draggable from "react-draggable";

import cytoscapestyle from "../defaultCytoscapeStyle";
import cxtmenu from "cytoscape-cxtmenu";

import { validateJson, GetIconInfo } from "./Workflows.jsx";
import { GetParsedPaths } from "./Apps.jsx";
import ConfigureWorkflow from "../components/ConfigureWorkflow.jsx";
import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import ParsedAction from "../components/ParsedAction.jsx";
import PaperComponent from "../components/PaperComponent.jsx"

const surfaceColor = "#27292D";
const inputColor = "#383B40";

// http://apps.cytoscape.org/apps/yfileslayoutalgorithms
cytoscape.use(edgehandles);
cytoscape.use(clipboard);
cytoscape.use(undoRedo);
cytoscape.use(cxtmenu);

// Adds specific text to items
//import popper from 'cytoscape-popper';
//cytoscape.use(popper);

// https://stackoverflow.com/questions/19014250/rerender-view-on-browser-resize-with-react
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

export function sortByKey(array, key) {
  if (array === undefined) {
    return [];
  }

  if (key.startsWith("-") && key.length > 2) {
    key = key.slice(1, key.length);
    return array
      .sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return x < y ? -1 : x > y ? 1 : 0;
      })
      .reverse();
  }

  if (array === undefined || array === null) {
    return [];
  }

  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

function removeParam(key, sourceURL) {
  if (sourceURL === undefined) {
    return;
  }

  var rtn = sourceURL.split("?")[0],
    param,
    params_arr = [],
    queryString = sourceURL.indexOf("?") !== -1 ? sourceURL.split("?")[1] : "";

  if (queryString !== "") {
    params_arr = queryString.split("&");
    for (var i = params_arr.length - 1; i >= 0; i -= 1) {
      param = params_arr[i].split("=")[0];
      if (param === key) {
        params_arr.splice(i, 1);
      }
    }
    rtn = rtn + "?" + params_arr.join("&");
  }

  if (rtn === "?") {
    return "";
  }

  return rtn;
}

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
  root: {
    "& .MuiAutocomplete-listbox": {
      border: "2px solid #f85a3e",
      color: "white",
      fontSize: 18,
      "& li:nth-child(even)": {
        backgroundColor: "#CCC",
      },
      "& li:nth-child(odd)": {
        backgroundColor: "#FFF",
      },
    },
  },
  inputRoot: {
    color: "white",
    // This matches the specificity of the default styles at https://github.com/mui-org/material-ui/blob/v4.11.3/packages/material-ui-lab/src/Autocomplete/Autocomplete.js#L90
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#f86a3e",
    },
  },
});

const splitter = "|~|";
const svgSize = 24;
//const referenceUrl = "https://shuffler.io/functions/webhooks/"
//const referenceUrl = window.location.origin+"/api/v1/hooks/"

const AngularWorkflow = (defaultprops) => {
  const { globalUrl, isLoggedIn, isLoaded, userdata } = defaultprops;
  const referenceUrl = globalUrl + "/api/v1/hooks/";
  const alert = useAlert()
	let navigate = useNavigate();

	const params = useParams();
	var props = JSON.parse(JSON.stringify(defaultprops))
	props.match = {}
	props.match.params = params

  const green = "#86c142";
  const yellow = "#FECC00";
  //const theme = useTheme();

  const [bodyWidth, bodyHeight] = useWindowSize();

  var to_be_copied = "";
  const [firstrequest, setFirstrequest] = React.useState(true);
  const [cystyle] = useState(cytoscapestyle);
  const [cy, setCy] = React.useState();

  const [currentView, setCurrentView] = React.useState(0);
  const [triggerAuthentication, setTriggerAuthentication] = React.useState({});
  const [triggerFolders, setTriggerFolders] = React.useState([]);
  const [workflows, setWorkflows] = React.useState([]);
  const [showEnvironment, setShowEnvironment] = React.useState(false);
  const [editWorkflowDetails, setEditWorkflowDetails] = React.useState(false);

  const [workflow, setWorkflow] = React.useState({});
  const [userSettings, setUserSettings] = React.useState({});
  const [subworkflow, setSubworkflow] = React.useState({});
  const [subworkflowStartnode, setSubworkflowStartnode] = React.useState("");
  const [leftViewOpen, setLeftViewOpen] = React.useState(isMobile ? false : true);
  const [leftBarSize, setLeftBarSize] = React.useState(isMobile ? 0 : 350);
  const [creatorProfile, setCreatorProfile] = React.useState({});
  const [appGroup, setAppGroup] = React.useState([]);
  const [triggerGroup, setTriggerGroup] = React.useState([]);
  const [executionText, setExecutionText] = React.useState("");
  const [executionRequestStarted, setExecutionRequestStarted] =
    React.useState(false);
  const [scrollConfig, setScrollConfig] = React.useState({
    top: 0,
    left: 0,
    selected: "",
  });

  const [history, setHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(history.length);
	const [variableInfo, setVariableInfo] = React.useState({})

  const [appAuthentication, setAppAuthentication] = React.useState([]);
  const [variablesModalOpen, setVariablesModalOpen] = React.useState(false);
  const [executionVariablesModalOpen, setExecutionVariablesModalOpen] =
    React.useState(false);
  const [authenticationModalOpen, setAuthenticationModalOpen] =
    React.useState(false);
  const [conditionsModalOpen, setConditionsModalOpen] = React.useState(false);
  const [authenticationType, setAuthenticationType] = React.useState("");


  const [workflowDone, setWorkflowDone] = React.useState(false);
  const [authLoaded, setAuthLoaded] = React.useState(false);
  const [localFirstrequest, setLocalFirstrequest] = React.useState(true);
  const [requiresAuthentication, setRequiresAuthentication] =
    React.useState(false);
  const [rightSideBarOpen, setRightSideBarOpen] = React.useState(false);
  const [showSkippedActions, setShowSkippedActions] = React.useState(false);
  const [lastExecution, setLastExecution] = React.useState("");
  const [configureWorkflowModalOpen, setConfigureWorkflowModalOpen] =
    React.useState(false);

  const curpath =
    typeof window === "undefined" || window.location === undefined
      ? ""
      : window.location.pathname;

  // 0 = normal, 1 = just done, 2 = normal
  const [savingState, setSavingState] = React.useState(0);

  const [selectedResult, setSelectedResult] = React.useState({});
  const [codeModalOpen, setCodeModalOpen] = React.useState(false);

  const [variableAnchorEl, setVariableAnchorEl] = React.useState(null);

  const [sourceValue, setSourceValue] = React.useState({});
  const [destinationValue, setDestinationValue] = React.useState({});
  const [conditionValue, setConditionValue] = React.useState({});
  const [dragging, setDragging] = React.useState(false);
  const [dragPosition, setDragPosition] = React.useState({
    x: 0,
    y: 0,
  });

  // Trigger stuff
  const [selectedComment, setSelectedComment] = React.useState({});
  const [selectedTrigger, setSelectedTrigger] = React.useState({});
  const [selectedTriggerIndex, setSelectedTriggerIndex] = React.useState({});
  const [selectedEdge, setSelectedEdge] = React.useState({});
  const [selectedEdgeIndex, setSelectedEdgeIndex] = React.useState({});

  const [visited, setVisited] = React.useState([]);

  const [apps, setApps] = React.useState([]);
  const [filteredApps, setFilteredApps] = React.useState([]);
  const [prioritizedApps, setPrioritizedApps] = React.useState([]);

  const [environments, setEnvironments] = React.useState([]);
  const [established, setEstablished] = React.useState(false);

  const [graphSetup, setGraphSetup] = React.useState(false);

  const [selectedApp, setSelectedApp] = React.useState({});
  const [selectedAction, setSelectedAction] = React.useState({});
  const [selectedActionEnvironment, setSelectedActionEnvironment] =
    React.useState({});

  const [executionRequest, setExecutionRequest] = React.useState({});

  const [executionRunning, setExecutionRunning] = React.useState(false);
  const [executionModalOpen, setExecutionModalOpen] = React.useState(false);
  const [executionModalView, setExecutionModalView] = React.useState(0);
  const [executionData, setExecutionData] = React.useState({});
  const [appsLoaded, setAppsLoaded] = React.useState(false);

  const [lastSaved, setLastSaved] = React.useState(true);

  // eslint-disable-next-line no-unused-vars
  const [_, setUpdate] = useState(""); // Used for rendring, don't remove

  const [workflowExecutions, setWorkflowExecutions] = React.useState([]);
  const [defaultEnvironmentIndex, setDefaultEnvironmentIndex] = React.useState(0);

  // This should all be set once, not on every iteration
  // Use states and don't update lol
  const cloudSyncEnabled =
    props.userdata !== undefined &&
    props.userdata.active_org !== null &&
    props.userdata.active_org !== undefined
      ? props.userdata.active_org.cloud_sync === true
      : false;
  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";
  const appBarSize = isCloud ? 75 : 60;
  const triggerEnvironments = isCloud ? ["cloud"] : ["onprem", "cloud"];
  const unloadText = "Are you sure you want to leave without saving (CTRL+S)?";
  const classes = useStyles();
	const cytoscapeWidth = isMobile ? bodyWidth - leftBarSize : bodyWidth - leftBarSize - 25


  const [elements, setElements] = useState([]);
  // No point going as fast, as the nodes aren't realtime anymore, but bulk updated.
  // Set it from 2500 to 6000 to reduce overall load
  const { start, stop } = useInterval({
    duration: 3000,
    startImmediate: false,
    callback: () => {
      fetchUpdates();
    },
  });

  const getAvailableWorkflows = (trigger_index) => {
    fetch(globalUrl + "/api/v1/workflows", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflows :O!");
          return;
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson !== undefined) {
          setWorkflows(responseJson);

          // Sets up subflow trigger with the right info
          if (trigger_index > -1) {
						var baseSubflow = {}
            const trigger = workflow.triggers[trigger_index];
            if (trigger.parameters.length >= 3) {
              for (var key in trigger.parameters) {
                const param = trigger.parameters[key];

                if (param.name === "workflow") {
                  if (param.value === workflow.id) {
                    setSubworkflow(workflow);
										baseSubflow = workflow
                  } else {
                    const sub = responseJson.find(
                      (data) => data.id === param.value
                    );
                    if (sub !== undefined && subworkflow.id !== sub.id) {
											baseSubflow = sub
                      setSubworkflow(sub);
                    }
                  }
                }

                if (
                  param.name === "startnode" &&
                  param.value !== undefined &&
                  param.value !== null
                ) {
      						if (Object.getOwnPropertyNames(baseSubflow).length > 0) {
										const foundAction = baseSubflow.actions.find(action => action.id === param.value)
										if (foundAction !== null && foundAction !== undefined) {
                  		setSubworkflowStartnode(foundAction);
										}
									} else {
                  	setSubworkflowStartnode(param.value);
									}
                }
              }
            }
          }
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  function OuterLink(props) {
    if (props.href.includes("http") || props.href.includes("mailto")) {
      return (
        <a
          href={props.href}
          style={{ color: "#f85a3e", textDecoration: "none" }}
        >
          {props.children}
        </a>
      );
    }
    return (
      <Link
        to={props.href}
        style={{ color: "#f85a3e", textDecoration: "none" }}
      >
        {props.children}
      </Link>
    );
  }

  function Img(props) {
    return <img style={{ maxWidth: "100%" }} alt={props.alt} src={props.src} />;
  }

  function CodeHandler(props) {
    return (
      <pre
        style={{
          padding: 15,
          minWidth: "50%",
          maxWidth: "100%",
          backgroundColor: theme.palette.inputColor,
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <code>{props.value}</code>
      </pre>
    );
  }

  function Heading(props) {
    const element = React.createElement(
      `h${props.level}`,
      { style: { marginTop: 40 } },
      props.children
    );
    return (
      <Typography>
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
      </Typography>
    );
  }

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
          console.log("Status not 200 for APIKEY gen :O!");
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
          console.log("Status not 200 for get settings :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (
					responseJson.success === true &&
          (responseJson.apikey === undefined ||
          responseJson.apikey.length === 0 ||
          responseJson.apikey === null)
        ) {
          generateApikey();
        }

				if (responseJson.success === true) {
        	setUserSettings(responseJson)
				}
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const setNewAppAuth = (appAuthData) => {
    console.log("DAta: ", appAuthData);
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
          alert.error("Failed to set app auth: " + responseJson.reason);
        } else {
          getAppAuthentication(true, false);
          setAuthenticationModalOpen(false);

          // Needs a refresh with the new authentication..
          //alert.success("Successfully saved new app auth")
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const getWorkflowExecution = (id, execution_id) => {
    fetch(globalUrl + "/api/v1/workflows/" + id + "/executions", {
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
        if (responseJson.length > 0) {
          // FIXME: Sort this by time

          // - means it's opposite
          const newkeys = sortByKey(responseJson, "-started_at");
          setWorkflowExecutions(newkeys);

          const cursearch =
            typeof window === "undefined" || window.location === undefined
              ? ""
              : window.location.search;

          var tmpView = new URLSearchParams(cursearch).get("execution_id");
          if (
            execution_id !== undefined &&
            execution_id !== null &&
            execution_id.length > 0 &&
            (tmpView === undefined || tmpView === null || tmpView.length === 0)
          ) {
            tmpView = execution_id;
          }

          if (tmpView !== undefined && tmpView !== null && tmpView.length > 0) {
            const execution = responseJson.find(
              (data) => data.execution_id === tmpView
            );

            if (execution !== null && execution !== undefined) {
              setExecutionData(execution);
              setExecutionModalView(1);
              start();

              setExecutionRequest({
                execution_id: execution.execution_id,
                authorization: execution.authorization,
              });

              const newitem = removeParam("execution_id", cursearch);
							navigate(curpath + newitem)
              //props.history.push(curpath + newitem);
            } else {
							console.log("Couldn't find execution for execution ID. Retrying as user to get ", tmpView)

    	  			//setExecutionRequestStarted(true);
            	const cur_execution = {
              	execution_id: tmpView,
            		//authorization: data.authorization,
              }
              setExecutionModalView(1);
              setExecutionRequest(cur_execution);
    	    		start();

              const newitem = removeParam("execution_id", cursearch);
							navigate(curpath + newitem)

							setTimeout(() => {
								stop()
							}, 5000);
						}
          }
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const fetchUpdates = () => {
    fetch(globalUrl + "/api/v1/streams/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(executionRequest),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
          stop();
        }

        return response.json();
      })
      .then((responseJson) => {
				//console.log("RESPONSE: ", responseJson)
        handleUpdateResults(responseJson, executionRequest);
      })
      .catch((error) => {
        console.log("Error: ", error);
        stop();
      });
  };

  const abortExecution = () => {
    setExecutionRunning(false);

    fetch(
      globalUrl +
        "/api/v1/workflows/" +
        props.match.params.key +
        "/executions/" +
        executionRequest.execution_id +
        "/abort",
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
          console.log("Status not 200 for ABORT EXECUTION :O!");
        }

        return response.json();
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  // Controls the colors and direction of execution results.
  // Style is in defaultCytoscapeStyle.js
  const handleUpdateResults = (responseJson, executionRequest) => {
    //console.log(responseJson)
    // Loop nodes and find results
    // Update on every interval? idk

		ReactDOM.unstable_batchedUpdates(() => {
    	if (JSON.stringify(responseJson) !== JSON.stringify(executionData)) {
    	  // FIXME: If another is selected, don't edit..
    	  // Doesn't work because this is some async garbage
    	  if (
    	    executionData.execution_id === undefined ||
    	    (responseJson.execution_id === executionData.execution_id &&
    	      responseJson.results !== undefined &&
    	      responseJson.results !== null)
    	  ) {
    	    if (
    	      executionData.status !== responseJson.status ||
    	      executionData.result !== responseJson.result ||
    	      executionData.results.length !== responseJson.results.length
    	    ) {
    	      setExecutionData(responseJson);
    	    } else {
    	      console.log("NOT updating state.");
    	    }
    	  }
    	}

    	if (responseJson.execution_id !== executionRequest.execution_id) {
    	  cy.elements().removeClass(
    	    "success-highlight failure-highlight executing-highlight"
    	  );
    	  return;
    	}

    	if (responseJson.results !== null && responseJson.results.length > 0) {
    	  for (var key in responseJson.results) {
    	    var item = responseJson.results[key];
    	    var currentnode = cy.getElementById(item.action.id);
    	    if (currentnode.length === 0) {
    	      continue;
    	    }

    	    currentnode = currentnode[0];
    	    const outgoingEdges = currentnode.outgoers("edge");
    	    const incomingEdges = currentnode.incomers("edge");

    	    switch (item.status) {
    	      case "EXECUTING":
    	        currentnode.removeClass("not-executing-highlight");
    	        currentnode.removeClass("success-highlight");
    	        currentnode.removeClass("failure-highlight");
    	        currentnode.removeClass("shuffle-hover-highlight");
    	        currentnode.removeClass("awaiting-data-highlight");
    	        incomingEdges.addClass("success-highlight");
    	        currentnode.addClass("executing-highlight");
    	        break;
    	      case "SKIPPED":
    	        currentnode.removeClass("not-executing-highlight");
    	        currentnode.removeClass("success-highlight");
    	        currentnode.removeClass("failure-highlight");
    	        currentnode.removeClass("shuffle-hover-highlight");
    	        currentnode.removeClass("awaiting-data-highlight");
    	        currentnode.removeClass("executing-highlight");
    	        currentnode.addClass("skipped-highlight");
    	        break;
    	      case "WAITING":
    	        currentnode.removeClass("not-executing-highlight");
    	        currentnode.removeClass("success-highlight");
    	        currentnode.removeClass("failure-highlight");
    	        currentnode.removeClass("shuffle-hover-highlight");
    	        currentnode.removeClass("awaiting-data-highlight");
    	        currentnode.addClass("executing-highlight");

    	        if (!visited.includes(item.action.label)) {
    	          if (executionRunning) {
    	            visited.push(item.action.label);
    	            setVisited(visited);
    	          }
    	        }

    	        // FIXME - add outgoing nodes to executing
    	        //const outgoingNodes = outgoingEdges.find().data().target
    	        if (outgoingEdges.length > 0) {
    	          outgoingEdges.addClass("success-highlight");
    	        }
    	        break;
    	      case "SUCCESS":
    	        currentnode.removeClass("not-executing-highlight");
    	        currentnode.removeClass("executing-highlight");
    	        currentnode.removeClass("failure-highlight");
    	        currentnode.removeClass("shuffle-hover-highlight");
    	        currentnode.removeClass("awaiting-data-highlight");
    	        currentnode.addClass("success-highlight");
    	        incomingEdges.addClass("success-highlight");
    	        outgoingEdges.addClass("success-highlight");

    	        if (
    	          visited !== undefined &&
    	          visited !== null &&
    	          !visited.includes(item.action.label)
    	        ) {
    	          if (executionRunning) {
    	            visited.push(item.action.label);
    	            setVisited(visited);
    	          }
    	        }

    	        // FIXME - add outgoing nodes to executing
    	        //const outgoingNodes = outgoingEdges.find().data().target
    	        if (outgoingEdges.length > 0) {
    	          for (var i = 0; i < outgoingEdges.length; i++) {
    	            const edge = outgoingEdges[i];
    	            const targetnode = cy.getElementById(edge.data().target);
    	            if (
    	              targetnode !== undefined &&
    	              !targetnode.classes().includes("success-highlight") &&
    	              !targetnode.classes().includes("failure-highlight")
    	            ) {
    	              targetnode.removeClass("not-executing-highlight");
    	              targetnode.removeClass("success-highlight");
    	              targetnode.removeClass("shuffle-hover-highlight");
    	              targetnode.removeClass("failure-highlight");
    	              targetnode.removeClass("awaiting-data-highlight");
    	              targetnode.addClass("executing-highlight");
    	            }
    	          }
    	        }
    	        break;
    	      case "FAILURE":
    	        //When status comes as failure, allow user to start workflow execution
    	        if (executionRunning) {
    	          setExecutionRunning(false);
    	        }

    	        currentnode.removeClass("not-executing-highlight");
    	        currentnode.removeClass("executing-highlight");
    	        currentnode.removeClass("success-highlight");
    	        currentnode.removeClass("awaiting-data-highlight");
    	        currentnode.removeClass("shuffle-hover-highlight");
    	        currentnode.addClass("failure-highlight");

    	        if (!visited.includes(item.action.label)) {
    	          if (
    	            item.action.result !== undefined &&
    	            item.action.result !== null &&
    	            !item.action.result.includes("failed condition")
    	          ) {
    	            alert.error(
    	              "Error for " +
    	                item.action.label +
    	                " with result " +
    	                item.result
    	            );
    	          }
    	          visited.push(item.action.label);
    	          setVisited(visited);
    	        }
    	        break;
    	      case "AWAITING_DATA":
    	        currentnode.removeClass("not-executing-highlight");
    	        currentnode.removeClass("executing-highlight");
    	        currentnode.removeClass("success-highlight");
    	        currentnode.removeClass("failure-highlight");
    	        currentnode.removeClass("shuffle-hover-highlight");
    	        currentnode.addClass("awaiting-data-highlight");
    	        break;
    	      default:
    	        console.log("DEFAULT?");
    	        break;
    	    }
    	  }
    	}

    	if (
    	  responseJson.status === "ABORTED" ||
    	  responseJson.status === "STOPPED" ||
    	  responseJson.status === "FAILURE" ||
    	  responseJson.status === "WAITING"
    	) {
    	  stop();

    	  if (executionRunning) {
    	    setExecutionRunning(false);
    	  }

    	  var curelements = cy.elements();
    	  for (var i = 0; i < curelements.length; i++) {
    	    if (curelements[i].classes().includes("executing-highlight")) {
    	      curelements[i].removeClass("executing-highlight");
    	      curelements[i].addClass("failure-highlight");
    	    }
    	  }

    	  getWorkflowExecution(props.match.params.key, "");
    	} else if (responseJson.status === "FINISHED") {
    	  setExecutionRunning(false);
    	  stop();
    	  getWorkflowExecution(props.match.params.key, "");
    	  setUpdate(Math.random());
    	}
		})
  };

	const sendStreamRequest = (body) => {
		console.log("Stream not activated yet.")
		return
		// Session may be important here huh 
		body.user_id = userdata.id

		fetch(globalUrl + "/api/v1/workflows/" + props.match.params.key + "/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    })
		.then((response) => {
			setSavingState(0);
			if (response.status !== 200) {
				console.log("Status not 200 for setting workflows :O!");
			}

			return response.json();
		})
    .then((responseJson) => {
			console.log("RESP: ", responseJson)
		})
		.catch((error) => {
			console.log("Stream error: ", error.toString())
			//alert.error(error.toString());
		})

	}

  const saveWorkflow = (curworkflow, executionArgument, startNode) => {
    var success = false;

    if (isCloud && !isLoggedIn) {
      console.log("Should redirect to register with redirect.");
      window.location.href = `/register?view=/workflows/${props.match.params.key}&message=You need sign up to use workflows with Shuffle`;
      return;
    }

    	setSavingState(2);

    	// This might not be the right course of action, but seems logical, as items could be running already
    	// Makes it possible to update with a version in current render
    	stop();
    	var useworkflow = workflow;
    	if (curworkflow !== undefined) {
    	  useworkflow = curworkflow;
    	}

    	var cyelements = cy.elements();
    	var newActions = [];
    	var newTriggers = [];
    	var newBranches = [];
    	var newVBranches = [];
    	var newComments = [];
    	for (var key in cyelements) {
    	  if (cyelements[key].data === undefined) {
    	    continue;
    	  }

    	  var type = cyelements[key].data()["type"];
    	  if (type === undefined) {
    	    if (
    	      cyelements[key].data().source === undefined ||
    	      cyelements[key].data().target === undefined
    	    ) {
    	      continue;
    	    }

    	    var parsedElement = {
    	      id: cyelements[key].data().id,
    	      source_id: cyelements[key].data().source,
    	      destination_id: cyelements[key].data().target,
    	      conditions: cyelements[key].data().conditions,
    	      decorator: cyelements[key].data().decorator,
    	    };

    	    if (parsedElement.decorator) {
    	      newVBranches.push(parsedElement);
    	    } else {
    	      newBranches.push(parsedElement);
    	    }
    	  } else {
    	    if (type === "ACTION") {
    	      const cyelement = cyelements[key].data();
    	      const elementid =
    	        cyelement.id === undefined || cyelement.id === null
    	          ? cyelement["_id"]
    	          : cyelement.id;

    	      var curworkflowAction = useworkflow.actions.find(
    	        (a) =>
    	          a !== undefined &&
    	          (a["id"] === elementid || a["_id"] === elementid)
    	      );
    	      if (curworkflowAction === undefined) {
    	        curworkflowAction = cyelements[key].data();
    	      }

    	      curworkflowAction.position = cyelements[key].position();

    	      // workaround to fix some edgecases
    	      if (
    	        curworkflowAction.parameters === "" ||
    	        curworkflowAction.parameters === null
    	      ) {
    	        curworkflowAction.parameters = [];
    	      }

    	      if (
    	        curworkflowAction.example === undefined ||
    	        curworkflowAction.example === "" ||
    	        curworkflowAction.example === null
    	      ) {
    	        if (cyelements[key].data().example !== undefined) {
    	          curworkflowAction.example = cyelements[key].data().example;
    	        }
    	      }

    	      // Override just in this place
    	      curworkflowAction.errors = [];
    	      curworkflowAction.isValid = true;

    	      // Cleans up OpenAPI items
    	      var newparams = [];
    	      for (var key in curworkflowAction.parameters) {
    	        const thisitem = curworkflowAction.parameters[key];
    	        if (thisitem.name.startsWith("${") && thisitem.name.endsWith("}")) {
    	          continue;
    	        }

    	        newparams.push(thisitem);
    	      }

    	      curworkflowAction.parameters = newparams;
    	      newActions.push(curworkflowAction);
    	    } else if (type === "TRIGGER") {
    	      if (useworkflow.triggers === undefined || useworkflow.triggers === null) {
    	        useworkflow.triggers = [];
    	      }

    	      var curworkflowTrigger = useworkflow.triggers.find(
    	        (a) => a.id === cyelements[key].data()["id"]
    	      );
    	      if (curworkflowTrigger === undefined) {
    	        curworkflowTrigger = cyelements[key].data();
    	      }

    	      curworkflowTrigger.position = cyelements[key].position();

    	      newTriggers.push(curworkflowTrigger);
    	    } else if (type === "COMMENT") {
    	      if (useworkflow.comments === undefined || useworkflow.comments === null) {
    	        useworkflow.comments = [];
    	      }

    	      var curworkflowComment = useworkflow.comments.find(
    	        (a) => a.id === cyelements[key].data()["id"]
    	      )

    	      if (curworkflowComment === undefined) {
    	        curworkflowComment = cyelements[key].data();
							try {
								curworkflowComment.position.x = parseInt(curworkflowComment.position.x)
							} catch (e) {
								console.log("Failed to parse position Y of comment: ", curworkflowComment.position.x)
							}

							try {
								curworkflowComment.position.y = parseInt(curworkflowComment.position.y)
							} catch (e) {
								console.log("Failed to parse position Y of comment: ", curworkflowComment.position.y)
							}
    	      }

						const parsedHeight = parseInt(curworkflowComment["height"])
						if (!isNaN(parsedHeight)) {
							curworkflowComment.height = parsedHeight
						} else {
							curworkflowComment.width = 150 
						}

						const parsedWidth = parseInt(curworkflowComment["width"])
						if (!isNaN(parsedWidth)) {
							curworkflowComment.width = parsedWidth
						} else {
							curworkflowComment.width = 200
						}

    	      curworkflowComment.position = cyelements[key].position();
						//console.log(curworkflowComment)

    	      newComments.push(curworkflowComment);
    	    } else {
    	      alert.info("No handler for type: " + type);
    	    }
    	  }
    	}

    	useworkflow.actions = newActions;
    	useworkflow.triggers = newTriggers;
    	useworkflow.branches = newBranches;
    	useworkflow.comments = newComments;
    	useworkflow.visual_branches = newVBranches;

    	// Errors are backend defined
    	useworkflow.errors = [];
    	useworkflow.previously_saved = true;

			if (cy !== undefined) {
				// scale: 0.3,
				// bg: "#27292d",
				const cyImageData = cy.png({
					output: "base64uri",
					maxWidth: 480,
					maxHeight: 270,
				})

				if (cyImageData !== undefined && cyImageData !== null && cyImageData.length > 0) {
					useworkflow.image = cyImageData
				}
			}

    	setLastSaved(true);
    	fetch(globalUrl + "/api/v1/workflows/" + props.match.params.key, {
    	  method: "PUT",
    	  headers: {
    	    "Content-Type": "application/json",
    	    Accept: "application/json",
    	  },
    	  body: JSON.stringify(useworkflow),
    	  credentials: "include",
    	})
    	  .then((response) => {
    	    setSavingState(0);
    	    if (response.status !== 200) {
    	      console.log("Status not 200 for setting workflows :O!");
    	    }

    	    return response.json();
    	  })
    	  .then((responseJson) => {
    	    if (executionArgument !== undefined && startNode !== undefined) {
    	      //console.log("Running execution AFTER saving");
    	      executeWorkflow(executionArgument, startNode, true);
    	      return;
    	    }

    	    if (!responseJson.success) {
    	      console.log(responseJson);
						if (responseJson.reason !== undefined && responseJson.reason !== null) {
    	      	alert.error("Failed to save: " + responseJson.reason);
						} else {
    	      	alert.error("Failed to save. Please contact your admin if this is unexpected.")
						}
    	    } else {
    	      if (
    	        responseJson.new_id !== undefined &&
    	        responseJson.new_id !== null
    	      ) {
    	        window.location.pathname = "/workflows/" + responseJson.new_id;
    	      }

    	      success = true;
    	      if (responseJson.errors !== undefined) {
    	        workflow.errors = responseJson.errors;
    	        if (responseJson.errors.length === 0) {
    	          workflow.isValid = true;
    	          workflow.is_valid = true;

    	          const cyelements = cy.elements();
    	          
    	          for (var i = 0; i < cyelements.length; i++) {
									//cyelements[i].removeStyle();
    	            cyelements[i].data().is_valid = true;
    	            cyelements[i].data().errors = [];
    	          }

    	          for (var key in workflow.actions) {
    	            workflow.actions[key].is_valid = true;
    	            workflow.actions[key].errors = [];
    	          }
    	        }

    	        for (var key in workflow.errors) {
    	          alert.info(workflow.errors[key]);
    	        }

    	        setWorkflow(workflow);
    	      }

    	      setSavingState(1);
    	      setTimeout(() => {
    	        setSavingState(0);
    	      }, 1500);
    	    }
    	  })
    	  .catch((error) => {
    	    setSavingState(0);
    	    alert.error(error.toString());
    	  });

    return success;
  };

  const monitorUpdates = () => {
    var firstnode = cy.getElementById(workflow.start);
    if (firstnode.length === 0) {
      var found = false;
      for (var key in workflow.actions) {
        if (workflow.actions[key].isStartNode) {
          console.log("Updating startnode");
          workflow.start = workflow.actions[key].id;
          firstnode = cy.getElementById(workflow.actions[key].id);
          found = true;
          break;
        }
      }

      if (!found) {
        return false;
      }
    }

    cy.elements().removeClass(
      "success-highlight failure-highlight executing-highlight"
    );
    firstnode[0].addClass("executing-highlight");

    return true;
  };

  const executeWorkflow = (executionArgument, startNode, hasSaved) => {
		ReactDOM.unstable_batchedUpdates(() => {
    	if (hasSaved === false) {
    	  setExecutionRequestStarted(true);
    	  saveWorkflow(workflow, executionArgument, startNode);
    	  console.log("FIXME: Might have forgotten to save before executing.");
    	  return;
    	}

    	if (workflow.public) {
    	  alert.info("Save it to get a new version");
    	}

    	var returncheck = monitorUpdates();
    	if (!returncheck) {
    	  alert.error("No startnode set.");
    	  return;
    	}

    	setVisited([]);
    	setExecutionRequest({});
    	stop();

    	var curelements = cy.elements();
    	for (var i = 0; i < curelements.length; i++) {
    	  curelements[i].addClass("not-executing-highlight");
    	}

    	const data = { execution_argument: executionArgument, start: startNode };
    	fetch(
    	  globalUrl + "/api/v1/workflows/" + props.match.params.key + "/execute",
    	  {
    	    method: "POST",
    	    headers: {
    	      "Content-Type": "application/json",
    	      Accept: "application/json",
    	    },
    	    credentials: "include",
    	    body: JSON.stringify(data),
    	  }
    	)
    	  .then((response) => {
    	    if (response.status !== 200) {
    	      console.log("Status not 200 for WORKFLOW EXECUTION :O!");
    	    }

    	    return response.json();
    	  })
    	  .then((responseJson) => {
    	    if (!responseJson.success) {
    	      alert.error("Failed to start: " + responseJson.reason);
    	      setExecutionRunning(false);
    	      setExecutionRequestStarted(false);
    	      stop();

    	      for (var i = 0; i < curelements.length; i++) {
    	        curelements[i].removeClass("not-executing-highlight");
    	      }
    	      return;
    	    } else {
    	      setExecutionRunning(true);
    	      setExecutionRequestStarted(false);
    	    }

    	    if (
    	      responseJson.execution_id === "" ||
    	      responseJson.execution_id === undefined ||
    	      responseJson.authorization === "" ||
    	      responseJson.authorization === undefined
    	    ) {
    	      alert.error("Something went wrong during execution startup");
    	      console.log("BAD RESPONSE FOR EXECUTION: ", responseJson);
    	      setExecutionRunning(false);
    	      setExecutionRequestStarted(false);
    	      stop();

    	      for (var i = 0; i < curelements.length; i++) {
    	        curelements[i].removeClass("not-executing-highlight");
    	      }
    	      return;
    	    }

    	    setExecutionRequest({
    	      execution_id: responseJson.execution_id,
    	      authorization: responseJson.authorization,
    	    });
    	    setExecutionData({});
    	    setExecutionModalOpen(true);
    	    setExecutionModalView(1);
    	    start();
    	  })
    	  .catch((error) => {
    	    alert.error(error.toString());
    	  });
			})
  };

  // This can be used to only show prioritzed ones later
  // Right now, it can prioritize authenticated ones
  //"Testing",
  const internalIds = ["Shuffle Tools", "http", "email"];

  const getAppAuthentication = (reset, updateAction) => {
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
        if (responseJson.success) {
          var newauth = [];
          for (var key in responseJson.data) {
            if (responseJson.data[key].defined === false) {
              continue;
            }

            newauth.push(responseJson.data[key]);
          }

          if (cy !== undefined) {
            console.log("NEW AUTH = reset cy's onnodeselect");

            // Remove the old listener for select, run with new one
            cy.removeListener("select");
            cy.on("select", "node", (e) => onNodeSelect(e, newauth));
            cy.on("select", "edge", (e) => onEdgeSelect(e));
          }

          setAppAuthentication(newauth);
          setAuthLoaded(true);

          if (updateAction === true) {
            if (selectedApp.authentication.required) {
              // Setup auth here :)
              var appUpdates = false;
              const authenticationOptions = [];

              var tmpAuth = JSON.parse(JSON.stringify(responseJson.data));
              var latest = 0;
              for (var key in tmpAuth) {
                var item = tmpAuth[key];

                const newfields = {};
                for (var filterkey in item.fields) {
                  newfields[item.fields[filterkey].key] =
                    item.fields[filterkey].value;
                }

                item.fields = newfields;
                if (item.app.name === selectedApp.name) {
                  authenticationOptions.push(item);

                  // Always becoming the last one
                  if (item.edited > latest) {
                    latest = item.edited;
                    selectedAction.selectedAuthentication = item;

                    for (var key in workflow.actions) {
                      if (workflow.actions[key].app_name === selectedApp.name) {
                        workflow.actions[key].selectedAuthentication = item;
                        workflow.actions[key].authentication_id = item.id;
                        appUpdates = true;
                      }
                    }
                  }
                }
              }

              selectedAction.authentication = authenticationOptions;
              if (
                selectedAction.selectedAuthentication === null ||
                selectedAction.selectedAuthentication === undefined ||
                selectedAction.selectedAuthentication.length === ""
              ) {
                selectedAction.selectedAuthentication = {};
              }

              if (appUpdates === true) {
                setAuthenticationModalOpen(false);
                setSelectedAction(selectedAction);
                setWorkflow(workflow);
                saveWorkflow(workflow);
                alert.info("Added and updated authentication!");
              } else {
                alert.error("Failed to find new authentication - did it work?");
              }
            } else {
              alert.info("No authentication to update");
            }
          }
        } else {
          setAuthLoaded(true);
        }
      })
      .catch((error) => {
        setAuthLoaded(true);
        alert.error("Auth loading error: " + error.toString());
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
				setAppsLoaded(true)
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
				if (responseJson === null) {
					console.log("No response")
					const pretend_apps = [{
						"name": "TBD",
						"app_name": "TBD",
						"app_version": "TBD",
						"description": "TBD",
						"version": "TBD",
						"large_image": "",
					}]
					setApps(pretend_apps)
					setFilteredApps(pretend_apps)
          setPrioritizedApps(pretend_apps);
					return
				}

				if (responseJson.success === false) {
					return
				}

        // FIXME - handle versions on left bar
        //handleAppVersioning(responseJson)
        //var tmpapps = []
        //tmpapps = tmpapps.concat(getExtraApps())
        //tmpapps = tmpapps.concat(responseJson)
        setApps(responseJson);

        if (isCloud) {
          setFilteredApps(
            responseJson.filter((app) => !internalIds.includes(app.name))
          );
          setPrioritizedApps(
            responseJson.filter((app) => internalIds.includes(app.name))
          );
        } else {
          //setFilteredApps(
          //  responseJson.filter(
          //    (app) =>
          //      !internalIds.includes(app.name) &&
          //      !(!app.activated && app.generated)
          //  )
          //);

					var tmpFiltered = responseJson.filter((app) => !internalIds.includes(app.name))
					//tmpFiltered = sortByKey(tmpFiltered, "activated")
          setFilteredApps(tmpFiltered)

        	//!(!app.activated && app.generated)
          setPrioritizedApps(
            responseJson.filter((app) => internalIds.includes(app.name))
          );
        }
      })
      .catch((error) => {
				setAppsLoaded(true)
        alert.error("App loading error: "+error.toString());
      });
  };

	// Searhc by username, userId, workflow, appId should all work
	const getUserProfile = (username) => {
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
				console.log("Found creator: ", responseJson)
				setCreatorProfile(responseJson)
			}
		})
		.catch((error) => {
			console.log(error);
		})
  }

  const getWorkflow = (workflow_id, sourcenode) => {
    console.log(
      //`Getting workflow ${workflow_id} with append value ${sourcenode}`
    );

    fetch(globalUrl + "/api/v1/workflows/" + workflow_id, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflows :O!");
          window.location.pathname = "/workflows";
        }

        return response.json();
      })
      .then((responseJson) => {
        // Not sure why this is necessary.
        if (responseJson.isValid === undefined) {
          responseJson.isValid = true;
        }

        if (responseJson.errors === undefined) {
          responseJson.errors = [];
        }

        if (responseJson.actions === undefined || responseJson.actions === null) {
          responseJson.actions = [];
        }

        if (responseJson.triggers === undefined || responseJson.triggers === null) {
          responseJson.triggers = [];
        }

        if (responseJson.public) {
          alert.info("This workflow is public. Save the workflow to use it in your organization.");
				
					console.log("RESP: ", responseJson)
					if (Object.getOwnPropertyNames(creatorProfile).length === 0) {
						//getUserProfile("frikky") 
						getUserProfile(responseJson.id) 
					}

					//{appGroup.map((data, index) => {
					//const [appGroup, setAppGroup] = React.useState([]);
					var appsFound = []
					for (var key in responseJson.actions) {
						const parsedAction = responseJson.actions[key]
						if (parsedAction.large_image === undefined || parsedAction.large_image === null || parsedAction.large_image === "") {
							continue
						}
						if (appsFound.findIndex(data => data.app_name === parsedAction.app_name) < 0){
							appsFound.push(parsedAction)
						}
					}

					setAppGroup(appsFound)

					appsFound = []
					for (var key in responseJson.triggers) {
						const parsedAction = responseJson.triggers[key]
						if (appsFound.findIndex(data => data.app_name === parsedAction.app_name) < 0){
							appsFound.push(parsedAction)
						}
					}

					setTriggerGroup(appsFound)
        }


        // Appends SUBFLOWS. Does NOT run during normal grabbing of workflows.
        if (sourcenode.id !== undefined) {
          console.log("WORKFLOW: ", responseJson);

          var nodefound = false;
          const target = sourcenode.parameters.find(
            (item) => item.name === "startnode"
          );
          console.log(sourcenode.parameters);
          console.log(target);
          const target_id = target === undefined ? "" : target.value;
          const actions = responseJson.actions.map((action) => {
            const node = {
              group: "nodes",
            };

            // Set it dynamically?
            node.position = {
              x: sourcenode.position.x + action.position.x,
              y: sourcenode.position.y + action.position.y,
            };

            node.data = action;

            node.data._id = action["id"];
            node.data.type = "ACTION";
            node.data.source_workflow = responseJson.id;
            if (action.id === target_id) {
              nodefound = true;
            }

            var example = "";
            if (
              action.example !== undefined &&
              action.example !== null &&
              action.example.length > 0
            ) {
              example = action.example;
            }

            node.data.example = example;
            return node;
          });

          var edges = responseJson.branches.map((branch, index) => {
            const edge = {};
            var conditions = responseJson.branches[index].conditions;
            if (conditions === undefined || conditions === null) {
              conditions = [];
            }

            var label = "";
            if (conditions.length === 1) {
              label = conditions.length + " condition";
            } else if (conditions.length > 1) {
              label = conditions.length + " conditions";
            }

            const sourceFound = actions.findIndex(
              (action) => action.data.id === branch.source_id
            );
            if (sourceFound < 0) {
              return null;
            }

            const destinationFound = actions.findIndex(
              (action) => action.data.id === branch.destination_id
            );
            if (destinationFound < 0) {
              return null;
            }

            edge.data = {
              id: branch.id,
              _id: branch.id,
              source: branch.source_id,
              target: branch.destination_id,
              label: label,
              conditions: conditions,
              hasErrors: branch.has_errors,
              decorator: false,
              source_workflow: responseJson.id,
            };

            return edge;
          });

          edges = edges.filter((edge) => edge !== null);
          cy.removeListener("add");
          cy.add(actions);
          cy.add(edges);

          if (nodefound === true) {
            const newId = uuidv4();
            cy.add({
              group: "edges",
              data: {
                id: newId,
                _id: newId,
                source: sourcenode.id,
                target: target_id,
                label: "Subflow",
                decorator: true,
                source_workflow: responseJson.id,
              },
            });
          }

          cy.fit(null, 100);
          cy.on("add", "node", (e) => onNodeAdded(e));
          cy.on("add", "edge", (e) => onEdgeAdded(e));
        } else {
          setWorkflow(responseJson);
          setWorkflowDone(true);

          // Add error checks
          console.log("Workflow: ", responseJson);
          if (!responseJson.public) {
            if (
              !responseJson.previously_saved ||
              !responseJson.is_valid ||
              responseJson.errors !== undefined ||
              responseJson.errors !== null ||
              responseJson.errors !== // what
                responseJson.errors.length > 0
            ) {
              setConfigureWorkflowModalOpen(true);
            }
          }
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const onUnselect = (event) => {
    const nodedata = event.target.data();
    console.log("UNSELECT: ", nodedata);
		//if (nodedata.type === "ACTION") {
		//	setLastSelected(nodedata)
		//}
		//

		// Wait for new node to possibly be selected
		//setTimeout(() => {
		const typeIds = cy.elements('node:selected').jsons();
		console.log("Found: ", typeIds)
		for (var idkey in typeIds) {
			const item = typeIds[idkey]
			console.log("items: ", item)
			if (item.data.isButton === true) {
				console.log("Reselect old node & return - or just return?")
				
				if (item.data.buttonType === "delete" && item.data.attachedTo === nodedata.id) {
					console.log("delete of same node!")
				}
				return
			}
		}

		//if (nodedata.app_name === undefined && nodedata.source === undefined) {
		//  return;
		//}
		//event.target.removeClass("selected");
		//





		//// If button is clicked, select current node

		// Attempt at rewrite of name in other actions in following nodes.
		// Should probably be done in the onBlur for the textfield instead
		/*
		if (event.target.data().type === "ACTION") {
			const nodeaction = event.target.data()
			const curaction = workflow.actions.find(a => a.id === nodeaction.id)
			console.log("workflowaction: ", curaction)
			console.log("nodeaction: ", nodeaction)
			if (nodeaction.label !== curaction.label) {
				console.log("BEACH!")

				var params = []
				const fixedName = "$"+curaction.label.toLowerCase().replace(" ", "_")
				for (var actionkey in workflow.actions) {
					if (workflow.actions[actionkey].id === curaction.id) {
						continue
					}

					for (var paramkey in workflow.actions[actionkey].parameters) {
						const param = workflow.actions[actionkey].parameters[paramkey]
						if (param.value === null || param.value === undefined || !param.value.includes("$")) {
							continue
						}

						const innername = param.value.toLowerCase().replace(" ", "_")
						if (innername.includes(fixedName)) {
							//workflow.actions[actionkey].parameters[paramkey].replace(
							//console.log("FOUND!: ", innername)
						}
					}
				}
			}
		}
		*/

		//cy.removeListener("select");
		//cy.on("select", "node", (e) => onNodeSelect(e, appAuthentication));
		//cy.on("select", "edge", (e) => onEdgeSelect(e));


		// FIXME - check if they have value before overriding like this for no reason.
		// Would save a lot of time (400~ ms -> 30ms)
		//console.log("ACTION: ", selectedAction)
		//console.log("APP: ", selectedApp)

		ReactDOM.unstable_batchedUpdates(() => {
			setSelectedAction({});
			setSelectedApp({});
			setSelectedTrigger({});
			setSelectedComment({})
			setSelectedEdge({});

			setSelectedEdge({})
			setSelectedActionEnvironment({})
			setTriggerAuthentication({})
			setSelectedTriggerIndex(-1)
			setTriggerFolders([])
			setSubworkflow({})

			// Can be used for right side view
			setRightSideBarOpen(false);
			setScrollConfig({
				top: 0,
				left: 0,
				selected: "",
			});
				//console.timeEnd("UNSELECT");
		})
		//}, 150)
  };

  const onEdgeSelect = (event) => {
		ReactDOM.unstable_batchedUpdates(() => {
    	setRightSideBarOpen(true);
    	setLastSaved(false);

    	/*
			 // Used to not be able to edit trigger-based branches. 
				const triggercheck = workflow.triggers.find(trigger => trigger.id === event.target.data()["source"])
				if (triggercheck === undefined) {
			*/
    	if (
    	  event.target.data("type") !== "COMMENT" &&
    	  event.target.data().decorator
    	) {
    	  alert.info("This edge can't be edited.");
    	} else {
    	  //console.log("DATA: ", event.target.data())
    	  const destinationId = event.target.data("target");
    	  //console.log("DATA: ", event.target.data())
    	  const curaction = workflow.actions.find((a) => a.id === destinationId);
    	  //console.log("ACTION: ", curaction)
    	  if (curaction !== undefined && curaction !== null) {
    	    if (
    	      curaction.app_name === "Shuffle Tools" &&
    	      curaction.name === "router"
    	    ) {
    	      alert.info("Router action can't have incoming conditions");
    	      event.target.unselect();
    	      return;
    	    }
    	  }

    	  setSelectedEdgeIndex(
    	    workflow.branches.findIndex(
    	      (data) => data.id === event.target.data()["id"]
    	    )
    	  );
    	  setSelectedEdge(event.target.data());
    	}

    	setSelectedAction({});
    	setSelectedTrigger({});
		})
  };

  // Comparing locations between nodes and setting views
  var styledElements = [];
  var originalLocation = {
    x: 0,
    y: 0,
  };

  const onCtxTap = (event) => {
    const nodedata = event.target.data();
    console.log(nodedata);
    if (
      nodedata.type === "TRIGGER" &&
      nodedata.app_name === "Shuffle Workflow"
    ) {
      if (nodedata.parameters === null) {
        alert.error("Set a workflow first");
        return;
      }

      const workflow_id = nodedata.parameters.find(
        (param) => param.name === "workflow"
      );
      if (workflow.id === workflow_id.valu) {
        return;
      }

      cy.animation({
        zoom: 0,
        center: {
          eles: event.target,
        },
      })
        .play()
        .promise()
        .then(() => {
          console.log("DONE: ", workflow_id);
          getWorkflow(workflow_id.value, nodedata);
          cy.fit(null, 50);
        });
    }
  };

  const onNodeDragStop = (event, selectedAction) => {
    const nodedata = event.target.data();
    if (nodedata.id === selectedAction.id) {
      return;
    }

    if (nodedata.finished === false) {
      return;
    }

		const connected = event.target.connectedEdges().jsons()
		for (var key in connected) {
			const edge = connected[key]
			//console.log("EDGE:", edge)

			//const edge = edgeBase.json()

      const sourcenode = cy.getElementById(edge.data.source)
      const destinationnode = cy.getElementById(edge.data.target)
			if (sourcenode === undefined || sourcenode === null || destinationnode === undefined || destinationnode === null) {
				continue
			}

			const edgeCurve = calculateEdgeCurve(sourcenode.position(), destinationnode.position()) 
      const currentedge = cy.getElementById(edge.data.id)
			if (currentedge !== undefined && currentedge !== null) {
				currentedge.style('control-point-distance', edgeCurve.distance)
				currentedge.style('control-point-weight', edgeCurve.weight)
			}
		}

    if (styledElements.length === 1) {
      console.log(
        "Should reset location and autofill: ",
        styledElements,
        selectedAction
      );
      if (originalLocation.x !== 0 || originalLocation.y !== 0) {
        const currentnode = cy.getElementById(nodedata.id);
        if (currentnode !== null && currentnode !== undefined) {
          currentnode.position("x", originalLocation.x);
          currentnode.position("y", originalLocation.y);
        }

        originalLocation = { x: 0, y: 0 };
      }

      const curElement = document.getElementById(styledElements[0]);
      if (curElement !== null && curElement !== undefined) {
        curElement.style.border = curElement.style.original_border;
        var newValue = "$" + nodedata.label.toLowerCase().replaceAll(" ", "_");
				if (nodedata.type === "TRIGGER") {
					if (nodedata.trigger_type === "WEBHOOK" || nodedata.trigger_type === "SCHEDULE" || nodedata.trigger_type === "EMAIL") {
        		var newValue = "$exec"
					}
				}
        var paramname = "";
        var idnumber = -1;
        if (curElement.id.startsWith("rightside_field_")) {
          console.log("FOUND FIELD WITH NUMBER: ", curElement.id);


					// Find exact position to put the text

          const idsplit = curElement.id.split("_");
          console.log(idsplit);
          if (idsplit.length === 3 && !isNaN(idsplit[2])) {
            console.log("ADDING TO PARAM ", idsplit[2]);

            selectedAction.parameters[idsplit[2]].value += newValue;
            paramname = selectedAction.parameters[idsplit[2]].name;
            idnumber = idsplit[2];
          }
        }

        if (idnumber >= 0 && paramname.length > 0) {
          const exampledata = GetExampleResult(nodedata);
          const parsedname = paramname
            .toLowerCase()
            .trim()
            .replaceAll("_", " ");

          const foundresult = GetParamMatch(parsedname, exampledata, "");
          if (foundresult.length > 0) {
            console.log("FOUND RESULT: ", paramname, foundresult);
            newValue = `${newValue}${foundresult}`;
          }

          selectedAction.parameters[idnumber].value = newValue;
        }

        curElement.value = newValue;
      }
    }

    if (
      nodedata.app_name !== undefined &&
      ((nodedata.app_name !== "Shuffle Tools" &&
        nodedata.app_name !== "Testing" &&
        nodedata.app_name !== "Shuffle Workflow" &&
        nodedata.app_name !== "User Input" &&
        nodedata.app_name !== "Webhook" &&
        nodedata.app_name !== "Schedule" &&
        nodedata.app_name !== "Email") ||
        nodedata.isStartNode)
    ) {
      const allNodes = cy.nodes().jsons();
      var found = false;
      for (var key in allNodes) {
        const currentNode = allNodes[key];
        if (
          currentNode.data.attachedTo === nodedata.id &&
          currentNode.data.isDescriptor
        ) {
          found = true;
          console.log("FOUND THE NODE!");
          break;
        }
      }

      // Readding the icon after moving the node
      if (!found) {
        const iconInfo = GetIconInfo(nodedata);
        const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
        const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

        const offset = nodedata.isStartNode ? 36 : 44;
        const decoratorNode = {
          position: {
            x: event.target.position().x + offset,
            y: event.target.position().y + offset,
          },
          locked: true,
          data: {
            isDescriptor: true,
            isValid: true,
            is_valid: true,
            label: "",
            image: svgpin_Url,
            imageColor: iconInfo.iconBackgroundColor,
            attachedTo: nodedata.id,
          },
        };

        cy.add(decoratorNode).unselectify();
      } else {
        console.log("Node already exists - don't add descriptor node");
      }
    }
    originalLocation = {
      x: 0,
      y: 0,
    };

		sendStreamRequest({
			"item": "node", 
			"type": "move", 
			"id": nodedata.id, 
			"location": {"x": event.target.position("x"), "y": event.target.position("y")}
		})
  };

  const onNodeDrag = (event, selectedAction) => {
    const nodedata = event.target.data();
    if (nodedata.finished === false) {
			console.log("NOT FINISHED - ADD EXAMPLE BRANCHES TO CLOSEST!!")
			return
    }

    if (nodedata.app_name !== undefined) {
      const allNodes = cy.nodes().jsons();
      for (var key in allNodes) {
        const currentNode = allNodes[key];
        if (currentNode.data.attachedTo === nodedata.id) {
          cy.getElementById(currentNode.data.id).remove();
        }

				// Calculate location
				//currentNode.position.x > 
				//if (nodedata.position.x > 0 && nodedata.position.y > 0) {
				//	console.log("Positive both")
				//}

				//console.log(currentNode.position)
				//console.log(nodedata.position)
      }
    } else {
      //console.log("No appid? ", nodedata)
    }

    if (nodedata.id === selectedAction.id) {
      return;
    }



    /*
		// Tried looking for the closest node by position. aStar path not working entirely.
		console.log("NODE: ", event.target)
		const closestNode = cy.elements().aStar({
			root: nodedata.id,
			goal: 'node',
			directed: false,
		})

		if (closestNode.found) {
			console.log("No closest node found for: ", nodedata.id)
		} else {
			console.log("Closest: ", closestNode)
		}
		*/

    if (
      originalLocation.x === 0 &&
      originalLocation.y === 0 &&
      nodedata.position !== undefined
    ) {
      originalLocation.x = nodedata.position.x;
      originalLocation.y = nodedata.position.y;
    }

    // Part of autocomplete. Styles elements in frontend to indicate
    // what and where we may input data for the user.
    const onMouseUpdate = (e) => {
      const x = e.pageX;
      const y = e.pageY;

      const elementMouseIsOver = document.elementFromPoint(x, y);
      if (elementMouseIsOver !== undefined && elementMouseIsOver !== null) {
        // Color for #f85a3e translated to rgb
        const newBorder = "3px solid rgb(248, 90, 62)";
        if (
          elementMouseIsOver.style.border !== newBorder &&
          elementMouseIsOver.id.includes("rightside")
        ) {
          if (elementMouseIsOver.style.border !== undefined) {
            elementMouseIsOver.style.original_border =
              elementMouseIsOver.style.border;
          } else {
            elementMouseIsOver.style.original_border = "";
          }

          elementMouseIsOver.style.border = newBorder;
          console.log("STYLED: ", styledElements);
          for (var key in styledElements) {
            const curElement = document.getElementById(styledElements[key]);
            if (curElement !== null && curElement !== undefined) {
              curElement.style.border = curElement.style.original_border;
            }
          }

          styledElements = [];
          styledElements.push(elementMouseIsOver.id);
        } else if (
          elementMouseIsOver.id === "cytoscape_view" ||
          elementMouseIsOver.id === ""
        ) {
          for (var key in styledElements) {
            const curElement = document.getElementById(styledElements[key]);
            if (curElement !== null && curElement !== undefined) {
              curElement.style.border = curElement.style.original_border;
            }
          }

          styledElements = [];
        }
      }

      // Ensure it only happens once
      document.removeEventListener("mousemove", onMouseUpdate, false);
    };

    document.addEventListener("mousemove", onMouseUpdate, false);
  };


  useBeforeunload(() => {
    if (!lastSaved) {
      return unloadText;
    } else {
			if (workflow.public === false) {
				//document.removeEventListener("mousemove", onMouseUpdate, true);
				document.removeEventListener("keydown", handleKeyDown, true);
				document.removeEventListener("paste", handlePaste, true);
			}
		}
  });

  // Nodeselectbatching:
  // https://stackoverflow.com/questions/16677856/cy-onselect-callback-only-once
	// onNodeClick
  const onNodeSelect = (event, newAppAuth) => {
		// Otherwise everything is SUPER slow
		ReactDOM.unstable_batchedUpdates(() => {
    	const data = event.target.data();
    	if (data.isButton) {
    	  if (data.buttonType === "delete") {
    	    const parentNode = cy.getElementById(data.attachedTo);
    	    if (parentNode !== null && parentNode !== undefined) {
  					removeNode(data.attachedTo) 
    	      //parentNode.remove()
    	    }

					return
    	  } else if (data.buttonType === "set_startnode" && data.type !== "TRIGGER") {
    	    const parentNode = cy.getElementById(data.attachedTo);
    	    if (parentNode !== null && parentNode !== undefined) {
    	      var oldstartnode = cy.getElementById(workflow.start);
    	      if (
    	        oldstartnode !== null &&
    	        oldstartnode !== undefined &&
    	        oldstartnode.length > 0
    	      ) {
    	        try {
    	          oldstartnode[0].data("isStartNode", false);
    	        } catch (e) {
    	          console.log("Startnode error: ", e);
    	        }
    	      }

    	      workflow.start = parentNode.data("id");
    	      setLastSaved(false);
    	      parentNode.data("isStartNode", true);
    	    }
    	
					//event.target.unselect();
					setRightSideBarOpen(true);
					return
    	  } else if (data.buttonType === "copy") {
    	    console.log("COPY!");

    	    // 1. Find parent
    	    // 2. Find branches for parent
    	    // 3. Make a new node that's moved a little bit
    	    const parentNode = cy.getElementById(data.attachedTo);
    	    if (parentNode !== null && parentNode !== undefined) {
    	      var newNodeData = JSON.parse(JSON.stringify(parentNode.data()));
    	      newNodeData.id = uuidv4();
    	      if (newNodeData.position !== undefined) {
    	        newNodeData.position = {
    	          x: newNodeData.position.x + 100,
    	          y: newNodeData.position.y + 100,
    	        };
    	      }

    	      newNodeData.isStartNode = false;
    	      newNodeData.errors = [];
    	      newNodeData.is_valid = true;
    	      newNodeData.isValid = true;
    	      newNodeData.label = parentNode.data("label") + "_copy";

    	      cy.add({
    	        group: "nodes",
    	        data: newNodeData,
    	        position: newNodeData.position,
    	      });

    	      // Readding the icon after moving the node
    	      if (
    	        newNodeData.app_name !== "Testing" ||
    	        newNodeData.app_name !== "Shuffle Workflow"
    	      ) {
    	      } else {
    	        const iconInfo = GetIconInfo(newNodeData);
    	        const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
    	        const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

    	        const offset = newNodeData.isStartNode ? 36 : 44;
    	        const decoratorNode = {
    	          position: {
    	            x: newNodeData.position.x + offset,
    	            y: newNodeData.position.y + offset,
    	          },
    	          locked: true,
    	          data: {
    	            isDescriptor: true,
    	            isValid: true,
    	            is_valid: true,
    	            label: "",
    	            image: svgpin_Url,
    	            imageColor: iconInfo.iconBackgroundColor,
    	            attachedTo: newNodeData.id,
    	          },
    	        };

    	        cy.add(decoratorNode).unselectify();
    	      }

    	      workflow.actions.push(newNodeData);

    	      const sourcebranches = workflow.branches.filter(
    	        (foundbranch) => foundbranch.source_id === parentNode.data("id")
    	      );
    	      const destinationbranches = workflow.branches.filter(
    	        (foundbranch) =>
    	          foundbranch.destination_id === parentNode.data("id")
    	      );

    	      for (var key in sourcebranches) {
    	        var newbranch = JSON.parse(JSON.stringify(sourcebranches[key]));
    	        newbranch.id = uuidv4();
    	        newbranch.source_id = newNodeData.id;

    	        newbranch._id = newbranch.id;
    	        newbranch.source = newbranch.source_id;
    	        newbranch.target = newbranch.destination_id;
    	        cy.add({
    	          group: "edges",
    	          data: newbranch,
    	        });
    	      }

    	      for (var key in destinationbranches) {
    	        var newbranch = JSON.parse(
    	          JSON.stringify(destinationbranches[key])
    	        );
    	        newbranch.id = uuidv4();
    	        newbranch.destination_id = newNodeData.id;

    	        newbranch._id = newbranch.id;
    	        newbranch.source = newbranch.source_id;
    	        newbranch.target = newbranch.destination_id;
    	        cy.add({
    	          group: "edges",
    	          data: newbranch,
    	        });
    	      }

    	  		//event.target.unselect();
						return
    	    }
    	  }

    	  return;
    	} else if (data.isDescriptor) {
    	  console.log("Can't select descriptor");
    	  event.target.unselect();
    	  return;
    	}

    	if (data.type === "ACTION") {
				setSelectedComment({})
				//var curaction = JSON.parse(JSON.stringify(data))
				// FIXME: Trust it to just work?
				//event.target.data()
    	  var curaction = workflow.actions.find((a) => a.id === data.id);
    	  if (!curaction || curaction === undefined) {
					console.log("NOT FOUND DATA: ", event.target.data())
					if (data.id !== undefined && data.app_name !== undefined) {
						workflow.actions.push(data)
						setWorkflow(workflow)
						curaction = data
					} else {
    				if (workflow.public !== true) {
    	    		alert.error("Action not found. Please remake it.");
						}

						event.target.remove();
						return;
					}
    	  }

				//var newapps = JSON.parse(JSON.stringify(apps))
				var newapps = apps
				if (apps === null || apps === undefined || apps.length === 0) {
					newapps = filteredApps
				}

    	  const curapp = newapps.find(
    	    (a) =>
    	      a.name === curaction.app_name &&
    	      (a.app_version === curaction.app_version ||
    	        (a.loop_versions !== null &&
    	          a.loop_versions.includes(curaction.app_version)))
    	  );
    	  if (!curapp || curapp === undefined) {
					console.log("APPS: ", newapps)
    	    //alert.error(`App ${curaction.app_name}:${curaction.app_version} not found. Is it activated?`);

    	    const tmpapp = {
    	      name: curaction.app_name,
    	      app_name: curaction.app_name,
    	      app_version: curaction.app_version,
    	      id: curaction.app_id,
    	      actions: [curaction],
    	    };

    	    setSelectedApp(tmpapp);
    	    setSelectedAction(curaction);
    	  } else {
    	    setAuthenticationType(
    	      curapp.authentication.type === "oauth2" &&
    	        curapp.authentication.redirect_uri !== undefined &&
    	        curapp.authentication.redirect_uri !== null
    	        ? {
    	            type: "oauth2",
    	            redirect_uri: curapp.authentication.redirect_uri,
    	            refresh_uri: curapp.authentication.refresh_uri,
    	            token_uri: curapp.authentication.token_uri,
    	            scope: curapp.authentication.scope,
    	            client_id: curapp.authentication.client_id,
    	            client_secret: curapp.authentication.client_secret,
    	          }
    	        : {
    	            type: "",
    	          }
    	    );

    	    const requiresAuth = curapp.authentication.required; //&& ((curapp.authentication.parameters !== undefined && curapp.authentication.parameters !== null) || (curapp.authentication.type === "oauth2" && curapp.authentication.redirect_uri !== undefined && curapp.authentication.redirect_uri !== null))
    	    setRequiresAuthentication(requiresAuth);
    	    if (curapp.authentication.required) {
    	      //console.log("App requires auth.")
    	      // Setup auth here :)
    	      const authenticationOptions = [];
    	      var findAuthId = "";
    	      if (
    	        curaction.authentication_id !== null &&
    	        curaction.authentication_id !== undefined &&
    	        curaction.authentication_id.length > 0
    	      ) {
    	        findAuthId = curaction.authentication_id;
    	      }

    	      var tmpAuth = JSON.parse(JSON.stringify(newAppAuth));

    	      for (var key in tmpAuth) {
    	        var item = tmpAuth[key];

    	        const newfields = {};
    	        for (var filterkey in item.fields) {
    	          newfields[item.fields[filterkey].key] =
    	            item.fields[filterkey].value;
    	        }

    	        item.fields = newfields;
    	        if (item.app.name === curapp.name) {
    	          authenticationOptions.push(item);
    	          if (item.id === findAuthId) {
    	            curaction.selectedAuthentication = item;
    	          }
    	        }
    	      }

    	      curaction.authentication = authenticationOptions;
    	      if (
    	        curaction.selectedAuthentication === null ||
    	        curaction.selectedAuthentication === undefined ||
    	        curaction.selectedAuthentication.length === ""
    	      ) {
    	        curaction.selectedAuthentication = {};
    	      }
    	    } else {
    	      curaction.authentication = [];
    	      curaction.authentication_id = "";
    	      curaction.selectedAuthentication = {};
    	    }

    	    if (
    	      curaction.parameters !== undefined &&
    	      curaction.parameters !== null &&
    	      curaction.parameters.length > 0
    	    ) {
    	      for (var key in curaction.parameters) {
    	        if (
    	          curaction.parameters[key].options !== undefined &&
    	          curaction.parameters[key].options !== null &&
    	          curaction.parameters[key].options.length > 0 &&
    	          curaction.parameters[key].value === ""
    	        ) {
    	          curaction.parameters[key].value =
    	            curaction.parameters[key].options[0];
    	        }
    	      }
    	    }

					console.log("ACTION: ", curaction)
    	    setSelectedApp(curapp);
    	    setSelectedAction(curaction);

    	    cy.removeListener("drag");
    	    cy.removeListener("free");
    	    cy.on("drag", "node", (e) => onNodeDrag(e, curaction));
    	    cy.on("free", "node", (e) => onNodeDragStop(e, curaction));
    	  }

				console.log("Object: ", environments)
    	  if (environments !== undefined && environments !== null && (typeof environments === "array" || typeof environments === "object")) {
					var parsedenv = environments
					if (typeof environments === "object") {
						parsedenv = [environments]
					}

    	    var env = parsedenv.find((a) => a.Name === curaction.environment);
    	    if (!env || env === undefined) {
    	      env = parsedenv[defaultEnvironmentIndex];
    	    }

    	    setSelectedActionEnvironment(env);
    	  }
    	} else if (data.type === "TRIGGER") {
				setSelectedComment({})
				if (workflow.triggers === null) {
					workflow.triggers = []
				}

    	  var trigger_index = workflow.triggers.findIndex(
    	    (a) => a.id === data.id
    	  );

				//console.log("Trigger: ", data, trigger_index)
				if (trigger_index === -1) {
					workflow.triggers.push(data)
					trigger_index = workflow.triggers.length-1
					setWorkflow(workflow)
				}

				//console.log("Trigger2: ", data, trigger_index)
				//if (data.id !== undefined && data.app_name !== undefined) {
				//	//newapps.push(data)
				//	workflow.actions.push(data)
				//	curaction = data
				//} else {
				//	alert.error("Action not found. Please remake it.");
				//	event.target.remove();
				//	return;
				//}

    	  if (data.app_name === "Shuffle Workflow") {
    	    getAvailableWorkflows(trigger_index);
    	    getSettings();
    	  } else if (data.app_name === "Webhook") {
    	    if (workflow.triggers[trigger_index].parameters !== undefined) {
    	      workflow.triggers[trigger_index].parameters[0] = {
    	        name: "url",
    	        value: referenceUrl + "webhook_" + workflow.triggers[trigger_index].id,
    	      };
    	    }
    	  }

				console.log("DATA: ", data)
    	  setSelectedTriggerIndex(trigger_index);
    	  setSelectedTrigger(data);
    	  setSelectedActionEnvironment(data.env);
    	} else if (data.type === "COMMENT") {
    	  setSelectedComment(data);
    	} else {
    	  alert.error("Can't handle " + data.type);
    	  return;
    	}

    	setRightSideBarOpen(true);
    	setLastSaved(false);
    	setScrollConfig({
    	  top: 0,
    	  left: 0,
    	  selected: "",
    	});
		})
  }

	const activateApp = (appid) => {
		fetch(globalUrl+"/api/v1/apps/"+appid+"/activate", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  		credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Failed to activate")
			}

			return response.json()
		})
		.then((responseJson) => {
			if (responseJson.success === false) {
				alert.error("Failed to activate the app")
			} else {
				alert.success("App activated for your organization!")
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

  const GetExampleResult = (item) => {
    var exampledata = item.example === undefined ? "" : item.example;
    if (workflowExecutions.length > 0) {
      // Look for the ID
      for (var key in workflowExecutions) {
        if (
          workflowExecutions[key].results === undefined ||
          workflowExecutions[key].results === null
        ) {
          continue;
        }

        var foundResult = { result: "" };
        if (item.id === "exec") {
          if (
            workflowExecutions[key].execution_argument !== undefined &&
            workflowExecutions[key].execution_argument !== null &&
            workflowExecutions[key].execution_argument.length > 0
          ) {
            foundResult.result = workflowExecutions[key].execution_argument;
          } else {
            continue;
          }
        } else {
          foundResult = workflowExecutions[key].results.find(
            (result) => result.action.id === item.id
          );
          if (foundResult === undefined) {
            continue;
          }
        }

        foundResult.result = foundResult.result.trim();
        foundResult.result = foundResult.result.split(" None").join(' "None"');
        foundResult.result = foundResult.result.split(" False").join(" false");
        foundResult.result = foundResult.result.split(" True").join(" true");

        var jsonvalid = true;
        try {
          if (
            !foundResult.result.includes("{") &&
            !foundResult.result.includes("[")
          ) {
            jsonvalid = false;
          }
        } catch (e) {
          try {
            foundResult.result = foundResult.result.split("'").join('"');
            if (
              !foundResult.result.includes("{") &&
              !foundResult.result.includes("[")
            ) {
              jsonvalid = false;
            }
          } catch (e) {
            jsonvalid = false;
          }
        }

        // Finds the FIRST json only
        if (jsonvalid) {
					try {
          	exampledata = JSON.parse(foundResult.result)
    			} catch (e) {
						console.log("Result: ", exampledata)

					}

          break;
        }
      }
    }

    return exampledata;
  };

  const GetParamMatch = (paramname, exampledata, basekey) => {
    if (typeof exampledata !== "object") {
      return "";
    }

    if (exampledata === null) {
      return "";
    }

		console.log("NOT REPLACING ON PURPOSE!!")
		return ""

    // Basically just a stupid if-else :)
    const synonyms = {
      id: [
        "id",
        "ref",
        "sourceref",
        "reference",
        "sourcereference",
        "alert id",
        "case id",
        "incident id",
        "service id",
        "sid",
        "uid",
        "uuid",
        "team id",
      ],
      title: ["title", "name", "message"],
      description: ["description", "explanation", "story", "details"],
      email: ["mail", "email", "sender", "receiver", "recipient"],
      data: [
        "data",
        "ip",
        "domain",
        "url",
        "hash",
        "md5",
        "sha2",
        "sha256",
        "value",
        "item",
      ],
    };

    // 1. Find the right synonym
    // 2.
    var selectedsynonyms = [paramname];
    for (const [key, value] of Object.entries(synonyms)) {
      if (key === paramname || value.includes(paramname)) {
        if (!value.includes(key)) {
          value.push(key.toLowerCase());
        }

        selectedsynonyms = value;
        break;
      }
    }

    var toreturn = "";

    for (const [key, value] of Object.entries(exampledata)) {
      // Check if loop or JSON

      if (typeof value === "object") {
        if (Array.isArray(value)) {
          var selectedkey = "";
          if (isNaN(key)) {
            selectedkey = `.${key}`;
          }

          for (var subitem in value) {
            toreturn = GetParamMatch(
              paramname,
              value[subitem],
              `${basekey}${selectedkey}.#`
            );
            if (toreturn.length > 0) {
              break;
            }
          }

          if (toreturn.length > 0) {
            break;
          }
        } else {
          var selectedkey = "";
          if (isNaN(key)) {
            selectedkey = `.${key}`;
          }

          toreturn = GetParamMatch(
            paramname,
            value,
            `${basekey}${selectedkey}`
          );
          if (toreturn.length > 0) {
            break;
          }
        }
      } else {
        if (selectedsynonyms.includes(key.toLowerCase())) {
          toreturn = `${basekey}.${key}`;
          break;
        }
      }
    }

    return toreturn;
  };

  // Takes an action as input, then runs through and updates the relevant fields
  // based on previous actions'
	// Uses lots of synonyms 
	// autocomplete
  const RunAutocompleter = (dstdata) => {
    // **PS: The right action should already be set here**
    // 1. Check execution argument
    // 2. Check parents in order
    var exampledata = GetExampleResult({ id: "exec", name: "exec" });
    var parentlabel = "exec";
    for (var paramkey in dstdata.parameters) {
      const param = dstdata.parameters[paramkey];
      // Skip authentication params
      if (param.configuration) {
        continue;
      }

      const paramname = param.name.toLowerCase().trim().replaceAll("_", " ");

      const foundresult = GetParamMatch(paramname, exampledata, "");
      if (foundresult.length > 0) {
        if (dstdata.parameters[paramkey].value.length === 0) {
          dstdata.parameters[paramkey].value = `$${parentlabel}${foundresult}`;
        }
      }
    }

    var parents = getParents(dstdata);
    if (parents.length > 1) {
      for (var key in parents) {
        const item = parents[key];
        if (item.label === "Execution Argument") {
          continue;
        }

        parentlabel =
          item.label === undefined
            ? ""
            : item.label.toLowerCase().trim().replaceAll(" ", "_");
        exampledata = GetExampleResult(item);
        for (var paramkey in dstdata.parameters) {
          const param = dstdata.parameters[paramkey];
          // Skip authentication params
          if (param.configuration) {
            continue;
          }

          const paramname = param.name
            .toLowerCase()
            .trim()
            .replaceAll("_", " ");

          const foundresult = GetParamMatch(paramname, exampledata, "");
          if (foundresult.length > 0) {
            if (dstdata.parameters[paramkey].value.length === 0) {
              dstdata.parameters[
                paramkey
              ].value = `$${parentlabel}${foundresult}`;
            } else {
              dstdata.parameters[
                paramkey
              ].value = `$${parentlabel}${foundresult}`;
            }
          }
        }
        // Check agains every param
      }
    }

    return dstdata;
  };

  // Checks for errors in edges when they're added
  const onEdgeAdded = (event) => {
    setLastSaved(false);
    const edge = event.target.data();

		const sourcenode = cy.getElementById(edge.source)
		const destinationnode = cy.getElementById(edge.target)
		if (sourcenode === undefined || sourcenode === null || destinationnode === undefined || destinationnode === null) {
		} else {
			const edgeCurve = calculateEdgeCurve(sourcenode.position(), destinationnode.position()) 
			const currentedge = cy.getElementById(edge.id)
			if (currentedge !== undefined && currentedge !== null) {
				currentedge.style('control-point-distance', edgeCurve.distance)
				currentedge.style('control-point-weight', edgeCurve.weight)
			}
		}

    var targetnode = workflow.triggers.findIndex(
      (data) => data.id === edge.target
    );
    if (targetnode !== -1) {
      console.log("TARGETNODE: ", targetnode);
      if (
        workflow.triggers[targetnode].app_name === "User Input" ||
        workflow.triggers[targetnode].app_name === "Shuffle Workflow"
      ) {
      } else {
        alert.error("Can't have triggers as target of branch");
        event.target.remove();
      }
    }

		const eventTarget = event.target.target()
		console.log("BUTTON! Find parent from: ", eventTarget)
    if (eventTarget.data("isButton") === true) {
			console.log("ACTUALLY A BUTTON!")
    	const parentNode = cy.getElementById(eventTarget.data("attachedTo"))
			event.target.remove()
			console.log("Setting it to parentnode: ", parentNode.data())
			if (parentNode !== undefined && parentNode !== null) {
				//event.target.data("target", eventTarget.data("attachedTo"))

        const newEdgeUuid = uuidv4()
        const newcybranch = {
          source: event.target.data("source"),
          target: eventTarget.data("attachedTo"),
          _id: newEdgeUuid,
          id: newEdgeUuid,
          hasErrors: event.target.data("hasErrors"),
        };

        const edgeToBeAdded = {
          group: "edges",
          data: newcybranch,
        }

        cy.add(edgeToBeAdded);
			}
		}

    if (
      eventTarget.data("isDescriptor") === true ||
			eventTarget.data("type") === "COMMENT" 
    ) {
			console.log("Removing because of descriptor or comment")
      event.target.remove();
      return;
    }

    targetnode = -1;

    // Check if:
    // dest == source && source == dest
    // dest == dest && source == source
    // backend: check all children? to stop recursion
    var found = false;
    for (var key in workflow.branches) {
      if (
        workflow.branches[key].destination_id === edge.source &&
        workflow.branches[key].source_id === edge.target
      ) {
        alert.error("A branch in the opposite direction already exists");
        event.target.remove();
        found = true;
        break;
      } else if (
        workflow.branches[key].destination_id === edge.target &&
        workflow.branches[key].source_id === edge.source
      ) {
        console.log(edge.source);
        alert.error("That branch already exists");
        event.target.remove();
        found = true;
        break;
      } else if (edge.target === workflow.start) {
        targetnode = workflow.triggers.findIndex(
          (data) => data.id === edge.source
        );
        if (targetnode === -1) {
					if (targetnode.type !== "TRIGGER") {
						alert.error("Can't make arrow to starting node");
						event.target.remove();
						break;
					}
						
					found = true;
        }
      } else if (edge.source === workflow.branches[key].source_id) {
        // FIXME: Verify multi-target for triggers
        // 1. Check if destination exists
        // 2. Check if source is a trigger
        // targetnode = workflow.triggers.findIndex(data => data.id === edge.source)
        // console.log("Destination: ", edge.target)
        // console.log("CHECK SOURCE IF ITS A TRIGGER: ", targetnode)
        // if (targetnode !== -1) {
        // 	alert.error("Triggers can only target one target (startnode)")
        // 	event.target.remove()
        // 	found = true
        // 	break
        // }
      } else {
        //console.log("INSIDE LAST CHECK: ", edge)
        // Find the targetnode and check if its a trigger
        // FIXME - do this for both actions and other types?
        /*
				targetnode = workflow.triggers.findIndex(data => data.id === edge.target)
				if (targetnode !== -1) {
					console.log("TARGETNODE: ", targetnode)
					if (workflow.triggers[targetnode].app_name === "User Input" || workflow.triggers[targetnode].app_name === "Shuffle Workflow") {
					} else {
						alert.error("Can't have triggers as target of branch")
						event.target.remove()
						found = true
						break
					}
				} 
				*/
      }
    }

    // 1. Guess what the next node's action should be
    // 2. Get result from previous nodes (if any)
    // 3. TRY to automatically map them in based on synonyms
    const newsource = cy.getElementById(edge.source);
    const newdst = cy.getElementById(edge.target);
    if (
      newsource !== undefined &&
      newsource !== null &&
      newdst !== undefined &&
      newdst !== null
    ) {
      const dstdata = RunAutocompleter(newdst.data());
      console.log("DST: ", dstdata);
    }

    var newbranch = {
      source_id: edge.source,
      destination_id: edge.target,
      id_: edge.id,
      id: edge.id,
      hasErrors: false,
      decorator: false,
    };

    if (!found) {
      newbranch["hasErrors"] = false;

      workflow.branches.push(newbranch);
      setWorkflow(workflow);
    }

    history.push({
      type: "edge",
      action: "added",
      data: edge,
    });
    setHistory(history);
    setHistoryIndex(history.length);
  };

  const onNodeAdded = (event) => {
    const node = event.target;
    const nodedata = event.target.data();

    if (nodedata.finished === false || (nodedata.id !== undefined && nodedata.is_valid === undefined)
    ) {
			//if (nodedata.app_id === undefined) {
			console.log("Returning because node is not valid: ", nodedata)
      return;
    }


		// DONT MOVE THIS LINE RIGHT HERE v
    setLastSaved(false)
		// Dont move the line above. May break stuff.


    if (node.isNode() && cy.nodes().size() === 1) {
      workflow.start = node.data("id");
      nodedata.isStartNode = true;
    } else {
      if (workflow.actions === null) {
				console.log("Returning because node has no value")
        return;
      }

      // Remove bad startnode
      for (var key in workflow.actions) {
        const action = workflow.actions[key];
        if (action.isStartNode && workflow.start !== action.id) {
          action.isStartNode = false;
        }
      }
    }

    if (nodedata.type === "ACTION") {
				/*
				var curaction = workflow.actions.find((a) => a.id === nodedata.id);
				if (curaction === null || curaction === undefined) {
          alert.error("Node not found. Please remake it.")
        	event.target.remove();
				}
				*/
      if (
        workflow.actions.length === 1 &&
        workflow.actions[0].id === workflow.start
      ) {
        const newEdgeUuid = uuidv4();
        const newcybranch = {
          source: workflow.start,
          target: nodedata.id,
          _id: newEdgeUuid,
          id: newEdgeUuid,
          hasErrors: false,
        };

        const edgeToBeAdded = {
          group: "edges",
          data: newcybranch,
        };

        console.log("SHOULD STITCH WITH STARTNODE");
        cy.add(edgeToBeAdded);
      }

      if (nodedata.app_name === "Shuffle Tools") {
        const iconInfo = GetIconInfo(nodedata);
        const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
        const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);
        nodedata.large_image = svgpin_Url;
        nodedata.fillGradient = iconInfo.fillGradient;
        nodedata.fillstyle = "solid";
        if (
          nodedata.fillGradient !== undefined &&
          nodedata.fillGradient !== null &&
          nodedata.fillGradient.length > 0
        ) {
          nodedata.fillstyle = "linear-gradient";
        } else {
          nodedata.iconBackground = iconInfo.iconBackgroundColor;
        }
      }


      if (
        nodedata.parameters !== undefined &&
        nodedata.parameters !== null &&
        !nodedata.label.endsWith("_copy")
      ) {
        var newparameters = [];

        for (var subkey in nodedata.parameters) {
          var newparam = JSON.parse(
            JSON.stringify(nodedata.parameters[subkey])
          );
          newparam.id = uuidv4();

					if (newparam.value === undefined || newparam.value === null) {
          	newparam.value = "";
					} else {
          	newparam.value = newparam.value;
					}

          newparameters.push(newparam);
        }

        nodedata.parameters = newparameters;
      }

      if (workflow.actions === undefined || workflow.actions === null) {
        workflow.actions = [nodedata];
      } else {
        workflow.actions.push(nodedata);
      }

      setWorkflow(workflow);
    } else if (nodedata.type === "TRIGGER") {
      if (nodedata.is_valid === false) {
        alert.info("This trigger is not available to you");
        node.remove();
        return;
      }

      if (workflow.triggers === undefined) {
        workflow.triggers = [nodedata];
      } else {
        workflow.triggers.push(nodedata);
      }

      const newEdgeUuid = uuidv4();
      const newcybranch = {
        source: nodedata.id,
        target: workflow.start,
        source_id: nodedata.id,
        destination_id: workflow.start,
        _id: newEdgeUuid,
        id: newEdgeUuid,
        hasErrors: false,
        decorator: false,
      };

      const edgeToBeAdded = {
        group: "edges",
        data: newcybranch,
      };

      if (
        nodedata.name !== "User Input" &&
        nodedata.name !== "Shuffle Workflow"
      ) {
        if (
          workflow.actions !== undefined &&
          workflow.actions !== null &&
          workflow.actions.length > 0
        ) {
          cy.add(edgeToBeAdded);
        }
      }

      setWorkflow(workflow);
    }

    if (nodedata.app_name !== undefined) {
      history.push({
        type: "node",
        action: "added",
        data: nodedata,
      });
      setHistory(history);
      setHistoryIndex(history.length);
    }
  };

  const onEdgeRemoved = (event) => {
    setLastSaved(false);


    const edge = event.target;
    if (edge.data("decorator") === true) {
      return;
    }

    workflow.branches = workflow.branches.filter(
      (a) => a.id !== edge.data().id
    );
    setWorkflow(workflow);
    event.target.remove();

    // trigger as source check
    const indexcheck = workflow.triggers.findIndex(
      (data) => edge.data()["source"] === data.id
    );
    if (indexcheck !== -1) {
      console.log("Shouldnt remove edge from trigger");
    }

    if (edge.data().source !== undefined) {
      history.push({
        type: "edge",
        action: "removed",
        data: edge.data(),
      });

      setHistory(history);
      setHistoryIndex(history.length);
    }
  };

  const onNodeRemoved = (event) => {
    const node = event.target;
    const data = node.data();

    if (data.finished === false) {
      return
    }

    workflow.actions = workflow.actions.filter((a) => a.id !== data.id);
    workflow.triggers = workflow.triggers.filter((a) => a.id !== data.id);
    if (workflow.start === data.id && workflow.actions.length > 0) {
      // FIXME - should check branches connected to startnode, as picking random
      // is just confusing
      if (workflow.actions[0].id !== data.id) {
        const ele = cy.getElementById(workflow.actions[0].id);
        if (ele !== undefined && ele !== null) {
          ele.data("isStartNode", true);
          workflow.start = ele.id();
        }
      } else {
        if (workflow.actions.length > 1) {
          const ele = cy.getElementById(workflow.actions[1].id);
          if (ele !== undefined && ele !== null) {
            ele.data("isStartNode", true);
            workflow.start = ele.id();
          }
        }
      }
    }

    if (data.app_name !== undefined) {
      const allNodes = cy.nodes().jsons();
      for (var key in allNodes) {
        const currentNode = allNodes[key];
        if (currentNode.data.attachedTo === data.id) {
          cy.getElementById(currentNode.data.id).remove();
        }
      }

      history.push({
        type: "node",
        action: "removed",
        data: data,
      })

			//console.log("REMOVED: ", data)
      setHistory(history);
      setHistoryIndex(history.length);
    }

    setWorkflow(workflow);
    if (data.type === "TRIGGER") {
      saveWorkflow(workflow);
    }
  };

  //var previouskey = 0
  const handleKeyDown = (event) => {
    switch (event.keyCode) {
      case 27:
        if (configureWorkflowModalOpen === true) {
          setConfigureWorkflowModalOpen(false);
        }
        break;
      case 46:
        console.log("DELETE");
        break;
      case 38:
        //console.log("UP");
        break;
      case 37:
        //console.log("LEFT");
        break;
      case 40:
        //console.log("DOWN");
        break;
      case 39:
        //console.log("RIGHT");
        break;
      case 90:
        if (event.ctrlKey) {
          console.log("CTRL+Z");
        }

        break;
      case 67:
        if (event.ctrlKey && !event.shiftKey) {
          if (
            event.path !== undefined &&
            event.path !== null &&
            event.path.length > 0
          ) {
            if (event.path[0].localName !== "body") {
              console.log("Skipping because body is not targeted");
              return;
            }
          }

					if (
    			  event.target !== undefined &&
    			  event.target !== null
    			) {
    			  if (event.target.localName !== "body") {
    			    console.log("Skipping because body is not targeted")
    			    return;
    			  }
					}

          console.log("CTRL+C");
          if (cy !== undefined) {
            var cydata = cy.$(":selected").jsons();
            if (cydata !== undefined && cydata !== null && cydata.length > 0) {
              console.log(cydata);

              const elementName = "copy_element_shuffle";
              var copyText = document.getElementById(elementName);
              if (copyText !== null && copyText !== undefined) {
                const clipboard = navigator.clipboard;
                if (clipboard === undefined) {
                  alert.error("Can only copy over HTTPS (port 3443)");
                  return;
                }

                navigator.clipboard.writeText(JSON.stringify(cydata));
                copyText.select();
                copyText.setSelectionRange(0, 99999); /* For mobile devices */
                document.execCommand("copy");
                alert.success(`Copied ${cydata.length} element(s)`);
              }
            }
          }
        }
        break;
      case 86:
        if (event.ctrlKey) {
          //console.log("CTRL+V")
          // The below parts are handled in the function handlePaste()
          /*
					const clipboard = navigator.clipboard
					if (clipboard === undefined || window === undefined || window === null) {
						alert.error("Can only use cliboard over HTTPS (port 3443)")
						return
					} 

					console.log("CLIPBOARD: ", window.clipboardData)
					const pastedData = window.clipboardData.getData('Text');
					console.log("PASTED: ", pastedData)

					
					//var tmpAuth = JSON.parse(JSON.stringify(appAuthentication))
					var jsonvalid = true
					var parsedjson = []
					*/
        }
        break;
      case 88:
        if (event.ctrlKey) {
          console.log("CTRL+X");
        }
        break;
      case 83:
        break;
      case 70:
        break;
      case 65:
        // As a poweruser myself, I found myself hitting this a few
        // too many times to just edit text. Need a better bind, which does NOT work while inside a field
        break;
      default:
        break;
    }

    //previouskey = event.keyCode
  };

  const handlePaste = (event) => {
    //console.log("EV: ", event)
    if (
      event.path !== undefined &&
      event.path !== null &&
      event.path.length > 0
    ) {
      //console.log("PATH: ", event.path[0])
      if (event.path[0].localName !== "body") {
        //console.log("Skipping because body is not targeted")
        return;
      }
    } 
		
		//console.log("PATH2: ", event.target)
		if (
      event.target !== undefined &&
      event.target !== null
    ) {
      if (event.target.localName !== "body") {
        //console.log("Skipping because body is not targeted")
        return;
      }
		}


    event.preventDefault();
    const clipboard = (event.originalEvent || event).clipboardData.getData(
      "text/plain"
    );
    //console.log("Text: ", clipboard)
    //window.document.execCommand('insertText', false, text);
    //
    try {
      const parsedjson = JSON.parse(clipboard);
      //console.log("Parsed: ", parsedjson)

      for (var key in parsedjson) {
        const item = parsedjson[key];
        console.log("Adding: ", item);
    		item.data.id = uuidv4()

        cy.add({
          group: item.group,
          data: item.data,
          position: item.position,
        });
      }
    } catch (e) {
      console.log("Error pasting: ", e);
      //alert.info("Failed parsing clipboard: ", e)
    }
  };

  const registerKeys = () => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);
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
          console.log("Status not 200 for envs :O!");
          if (isCloud) {
            setEnvironments([{ Name: "Cloud", Type: "cloud" }]);
          } else {
            setEnvironments([{ Name: "Onprem", Type: "onprem" }]);
          }

          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        var found = false;
        var showEnvCnt = 0;
        for (var key in responseJson) {
          if (responseJson[key].default) {
            setDefaultEnvironmentIndex(key);
            found = true;
          }

          if (responseJson[key].archived === false) {
            showEnvCnt += 1;
          }
        }

        if (showEnvCnt > 1) {
          setShowEnvironment(true);
        }

        if (!found) {
          for (var key in responseJson) {
            if (!responseJson[key].archived) {
              setDefaultEnvironmentIndex(key);
              break;
            }
          }
        }

				// FIXME: Don't allow multiple in cloud yet. Cloud -> Onprem isn't stable.
				if (isCloud) {
					console.log("Envs: ", responseJson)
					if (responseJson !== undefined && responseJson !== null && responseJson.length > 0) {
        		setEnvironments(responseJson);
					} else {
          	setEnvironments([{ Name: "Cloud", Type: "cloud" }]);
					}
				} else {
        	setEnvironments(responseJson);
				}
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  if (
    !firstrequest &&
    graphSetup &&
    established &&
    props.match.params.key !== workflow.id &&
    workflow.id !== undefined &&
    workflow.id !== null &&
    workflow.id.length > 0
  ) {
    window.location.pathname = "/workflows/" + props.match.params.key;
  }

  const animationDuration = 150;
  const onNodeHoverOut = (event) => {
    const nodedata = event.target.data();
    if (nodedata.app_name !== undefined) {
      const allNodes = cy.nodes().jsons();
      for (var key in allNodes) {
        const currentNode = allNodes[key];
        if (
          currentNode.data.isButton &&
          currentNode.data.attachedTo !== nodedata.id
        ) {
          cy.getElementById(currentNode.data.id).remove();
        }
      }
    }

		const cytoscapeElement = document.getElementById("cytoscape_view")
		if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
			cytoscapeElement.style.cursor = "default"
		}

		// Skipping node editing if it's the selected one
		if (cy !== undefined) {
			const typeIds = cy.elements('node:selected').jsons();
			for (var idkey in typeIds) {
				const item = typeIds[idkey]
				if (item.data.id === nodedata.id) {
					console.log("items: ", item.data.id, nodedata.id)
					return
				}
			}
		}
		//if (nodedata.id === selectedAction.id || nodedata.id === selectedTrigger.id) {
		//	return
		//}

    var parsedStyle = {
      "border-width": "1px",
      "font-size": "18px",
			//"cursor": "default",
    }

    if ((nodedata.app_name === "Testing" || nodedata.app_name === "Shuffle Tools") && !nodedata.isStartNode) {
      parsedStyle = {
        "border-width": "1px",
        "font-size": "0px",
      };
    }

    event.target.animate(
      {
        style: parsedStyle,
      },
      {
        duration: animationDuration,
      }
    );

    const outgoingEdges = event.target.outgoers("edge");
    const incomingEdges = event.target.incomers("edge");
    if (outgoingEdges.length > 0) {
      outgoingEdges.removeClass("hover-highlight");
    }

    if (incomingEdges.length > 0) {
      outgoingEdges.removeClass("hover-highlight");
    }
  };

  const buttonColor = "rgba(255,255,255,0.9)";
  const buttonBackgroundColor = "#1f2023";
  const addStartnodeButton = (event) => {
    var parentNode = cy.$("#" + event.target.data("id"));
    if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

    if (parentNode.data("isStartNode")) {
      return;
    }

    const px = parentNode.position("x") - 65;
    const py = parentNode.position("y") - 45;
    const circleId = (newNodeId = uuidv4());

    parentNode.data("circleId", circleId);

    const iconInfo = {
      icon: "M9.4 2H15V12H8L7.6 10H2V17H0V0H9L9.4 2ZM9 10H11V8H13V6H11V4H9V6L8 4V2H6V4H4V2H2V4H4V6H2V8H4V6H6V8H8V6L9 8V10ZM6 6V4H8V6H6ZM9 6H11V8H9V6Z",
      iconColor: buttonColor,
      iconBackgroundColor: buttonBackgroundColor,
    };

    const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
    const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

    cy.add({
      group: "nodes",
      data: {
        weight: 30,
        id: circleId,
        name: "TEEEXT",
        isButton: true,
        buttonType: "set_startnode",
        attachedTo: event.target.data("id"),
        icon: svgpin_Url,
        iconBackground: iconInfo.iconBackgroundColor,
        is_valid: true,
      },
      position: { x: px, y: py },
      locked: true,
    });
  };

  const addCopyButton = (event) => {
    var parentNode = cy.$("#" + event.target.data("id"));
    if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

    const px = parentNode.position("x") - 65;
    const py = parentNode.position("y") - 5;
    const circleId = (newNodeId = uuidv4());

    parentNode.data("circleId", circleId);

    const iconInfo = {
      icon: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm-1 4l6 6v10c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h7zm-1 7h5.5L14 6.5V12z",
      iconColor: buttonColor,
      iconBackgroundColor: buttonBackgroundColor,
    };

    const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
    const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

    cy.add({
      group: "nodes",
      data: {
        weight: 30,
        id: circleId,
        name: "TEEEXT",
        isButton: true,
        buttonType: "copy",
        attachedTo: event.target.data("id"),
        icon: svgpin_Url,
        iconBackground: iconInfo.iconBackgroundColor,
        is_valid: true,
      },
      position: { x: px, y: py },
      locked: true,
    });
  };

	const addSuggestionButtons = (event) => {
    var parentNode = cy.$("#" + event.target.data("id"));
    if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

    const px = parentNode.position("x") + 300;
    const py = parentNode.position("y") + 0;
    const circleId = (newNodeId = uuidv4());

    parentNode.data("circleId", circleId);

		var appid = "1234"
		var suggestions = [{
				app_name: "TheHive",
				app_version: "1.1.0",
				app_id: appid,
				sharing: false,
				private_id: false,
				isStartNode: false,
				label: "Suggestion 1",
				large_image: "data:image/png;base64,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",
				finished: false,
        is_valid: true,
				isSuggestion: true,
        attachedTo: event.target.data("id"),
		}]
    //isButton: true,

    cy.add({
      group: "nodes",
      data: suggestions[0],
    	position: { x: px, y: py },
      locked: true,
    });
  }

  const addDeleteButton = (event) => {
    var parentNode = cy.$("#" + event.target.data("id"));
    if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

    const px = parentNode.position("x") - 65;
    const py = parentNode.position("y") + 35;
    const circleId = (newNodeId = uuidv4());

    parentNode.data("circleId", circleId);

    const iconInfo = {
      icon: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
      iconColor: buttonColor,
      iconBackgroundColor: buttonBackgroundColor,
    };
    const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
    const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

    cy.add({
      group: "nodes",
      data: {
        weight: 30,
        id: circleId,
        name: "TEEEXT",
        isButton: true,
        buttonType: "delete",
        attachedTo: event.target.data("id"),
        icon: svgpin_Url,
        iconBackground: iconInfo.iconBackgroundColor,
        is_valid: true,
      },
      position: { x: px, y: py },
      locked: true,
    });
  };

  const onNodeHover = (event) => {
    const nodedata = event.target.data();

    if (nodedata.finished === false) {
			console.log("NODE: ", nodedata)
      return;
    }

		const cytoscapeElement = document.getElementById("cytoscape_view")
		if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
			cytoscapeElement.style.cursor = "pointer"
		}

    //var parentNode = cy.$("#" + event.target.data("id"));
    //if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

    if (nodedata.app_name !== undefined && !workflow.public === true) {
      const allNodes = cy.nodes().jsons();

      var found = false;
      for (var key in allNodes) {
        const currentNode = allNodes[key];
        if (
          currentNode.data.isButton &&
          currentNode.data.attachedTo !== nodedata.id
        ) {
          cy.getElementById(currentNode.data.id).remove();
        }

        if (
          currentNode.data.isButton &&
          currentNode.data.attachedTo === nodedata.id
        ) {
          found = true;
        }
      }

      if (!found) {
        addDeleteButton(event);

				if (nodedata.type === "TRIGGER") {
					if (nodedata.trigger_type === "SUBFLOW" || nodedata.trigger_type === "USERINPUT") {
						addCopyButton(event);
					}
				} else { 
					addCopyButton(event);
					addStartnodeButton(event);
				}

				//addSuggestionButtons(event)
      }
    }

    var parsedStyle = {
      "border-width": "7px",
      "border-opacity": ".7",
      "font-size": "25px",
			//"cursor": "pointer",
    }

		const typeIds = cy.elements('node:selected').jsons();
		for (var idkey in typeIds) {
			const item = typeIds[idkey]
			if (item.data.id === nodedata.id) {
				//console.log("items: ", item.data.id, nodedata.id)
				parsedStyle["border-width"] = "12px"
				break
			}
		}

    if (nodedata.type !== "COMMENT") {
      parsedStyle.color = "white";
    }

		if (event.target !== undefined && event.target !== null) {
			event.target.animate(
				{
					style: parsedStyle,
				},
				{
					duration: animationDuration,
				}
			);
		}

    const outgoingEdges = event.target.outgoers("edge");
    const incomingEdges = event.target.incomers("edge");
    if (outgoingEdges.length > 0) {
      outgoingEdges.addClass("hover-highlight");
    }

    if (incomingEdges.length > 0) {
      outgoingEdges.addClass("hover-highlight");
    }
  };

  const onEdgeHoverOut = (event) => {
    if (event === null || event === undefined) {
      event.target.removeStyle();
      return;
    }

    const edgeData = event.target.data();
    if (edgeData.decorator === true) {
      return;
    }

    //event.target.removeStyle();
  };

  // This is here to have a proper transition for lines
  const onEdgeHover = (event) => {
    if (event === null || event === undefined) {
      return;
    }

    const edgeData = event.target.data();
    if (edgeData.decorator === true) {
      return;
    }

    const sourcecolor = cy
      .getElementById(event.target.data("source"))
      .style("border-color");
    const targetcolor = cy
      .getElementById(event.target.data("target"))
      .style("border-color");

		//console.log(sourcecolor, targetcolor)
    if (
      sourcecolor !== null &&
      sourcecolor !== undefined &&
      targetcolor !== null &&
      targetcolor !== undefined && 
			!sourcecolor.includes("rgb") &&
			!targetcolor.includes("rgb") 
    ) {
			console.log(sourcecolor)
			console.log(targetcolor)

			if (event.target !== null && event.target.value !== null) {
				event.target.animate({
					style: {
						"target-arrow-color": targetcolor,
						"line-fill": "linear-gradient",
						"line-gradient-stop-colors": [sourcecolor, targetcolor],
						"line-gradient-stop-positions": [0, 1],
					},
					duration: animationDuration,
				})
			} else {
				event.target.animate({
					style: {
						"target-arrow-color": targetcolor,
						"line-fill": "linear-gradient",
      			"line-gradient-stop-colors": ["#41dcab", "#41dcab"],
						"line-gradient-stop-positions": [0, 1],
					},
					duration: animationDuration,
				})

			}
    }
  }

	// Thanks :)
	// https://codepen.io/guillaumethomas/pen/xxbbBKO
	const calculateEdgeCurve = (sourcenodePosition, destinationnodePosition) => {
		const xParsed = destinationnodePosition.x - sourcenodePosition.x
		const yParsed = destinationnodePosition.y - sourcenodePosition.y

		const z = Math.sqrt(xParsed * xParsed + yParsed * yParsed);
		const costheta = xParsed / z;
		const alpha = 0.25;
		var controlPointDistance = [-alpha * yParsed * costheta, alpha * yParsed * costheta];
		var controlPointWeight = [alpha, 1-alpha]

		//'control-point-weight': ['0.33', '0.66'],
		//var controlPointWeight = ["0.33", "0.66"]
		//var controlPointDistance = ["33%", "-66%"]
		//var controlPointWeight = ["0.00", "1.00"]
		/*
		if (yParsed !== 0) {
			//const degreeFound = Math.atan2(xParsed / yParsed)
			const degreeFound = Math.atan2(xParsed, yParsed) * 180 / Math.PI

			if (degreeFound > 90 && degreeFound < 180) {
				console.log("TOPRIGHT")
			} else if (degreeFound < 90 && degreeFound > 0) {
				console.log("BOTTOMRIGHT")
			} else if (degreeFound < 0 && degreeFound > -90) {
				console.log("BOTTOMLEFT")
				//controlPointWeight = ["0.20", "0.80"]
				//controlPointWeight = "0.7"
				//controlPointDistance = "50%" 

			} else if (degreeFound < -90 && degreeFound > -180) {
				console.log("TOPLEFT")
			} else {
				console.log("STRAIGHT!")
			}
		}
		*/

		return {
			"distance": controlPointDistance,
			"weight": controlPointWeight,
		}
	}

  const setupGraph = () => {
    const actions = workflow.actions.map((action) => {
      const node = {};

      if (!action.isStartNode && action.app_name === "Shuffle Tools") {
        const iconInfo = GetIconInfo(action);
        const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
        const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);
        action.large_image = svgpin_Url;
        action.fillGradient = iconInfo.fillGradient;
        action.fillstyle = "solid";
        if (
          action.fillGradient !== undefined &&
          action.fillGradient !== null &&
          action.fillGradient.length > 0
        ) {
          action.fillstyle = "linear-gradient";
        } else {
          action.iconBackground = iconInfo.iconBackgroundColor;
        }
      }

      node.position = action.position;
      node.data = action;

      node.data._id = action["id"];
      node.data.type = "ACTION";
      node.isStartNode = action["id"] === workflow.start;

      var example = "";
      if (
        action.example !== undefined &&
        action.example !== null &&
        action.example.length > 0
      ) {
        example = action.example;
      }

      node.data.example = example;

      return node;
    });

    const decoratorNodes = workflow.actions.map((action) => {
      if (!action.isStartNode) {
        if (action.app_name === "Testing") {
          return null;
        } else if (action.app_name === "Shuffle Tools") {
          return null;
        }
      }

      const iconInfo = GetIconInfo(action);
      const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
      const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

      const offset = action.isStartNode ? 36 : 44;
      const decoratorNode = {
        position: {
          x: action.position.x + offset,
          y: action.position.y + offset,
        },
        locked: true,
        data: {
          isDescriptor: true,
          isValid: true,
          is_valid: true,
          label: "",
          image: svgpin_Url,
          imageColor: iconInfo.iconBackgroundColor,
          attachedTo: action.id,
        },
      };
      return decoratorNode;
    });

    const triggers = workflow.triggers.map((trigger) => {
      const node = {};
      node.position = trigger.position;
      node.data = trigger;

      node.data._id = trigger["id"];
      node.data.type = "TRIGGER";

      return node;
    });

    var comments = [];
    if (
      workflow.comments !== undefined &&
      workflow.comments !== null &&
      workflow.comments.length > 0
    ) {
      comments = workflow.comments.map((comment) => {
        const node = {};
        node.position = comment.position;
        node.data = comment;

        node.data._id = comment["id"];
        node.data.type = "COMMENT";

        return node;
      });
    }

    // FIXME - tmp branch update
    var insertedNodes = [].concat(actions, triggers, decoratorNodes, comments);
    insertedNodes = insertedNodes.filter((node) => node !== null);

    var edges = workflow.branches.map((branch, index) => {
      const edge = {};
      var conditions = workflow.branches[index].conditions;
      if (conditions === undefined || conditions === null) {
        conditions = [];
      }

      var label = "";
      if (conditions.length === 1) {
        label = conditions.length + " condition";
      } else if (conditions.length > 1) {
        label = conditions.length + " conditions";
      }

      edge.data = {
        id: branch.id,
        _id: branch.id,
        source: branch.source_id,
        target: branch.destination_id,
        label: label,
        conditions: conditions,
        hasErrors: branch.has_errors,
        decorator: false,
      };

      // This is an attempt at prettier edges. The numbers are weird to work with.
			// Bezier curves
			//http://manual.graphspace.org/projects/graphspace-python/en/latest/demos/edge-types.html
			const sourcenode = actions.find(node => node.data._id === branch.source_id)
			const destinationnode = actions.find(node => node.data._id === branch.destination_id)
			if (sourcenode !== undefined && destinationnode !== undefined && branch.source_id !== branch.destination_id) { 
				//node.data._id = action["id"]
				//console.log("SOURCE: ", sourcenode.position)
				//console.log("DESTINATIONNODE: ", destinationnode.position)

				const edgeCurve = calculateEdgeCurve(sourcenode.position, destinationnode.position)
				edge.style = {
					'control-point-distance':  edgeCurve.distance,
					'control-point-weight': edgeCurve.weight,
				}
			} else {
				console.log("FAILED node curve handling")
			}

      return edge;
    });

    if (
      workflow.visual_branches !== undefined &&
      workflow.visual_branches !== null &&
      workflow.visual_branches.length > 0
    ) {
      const visualedges = workflow.visual_branches.map((branch, index) => {
        const edge = {};

        if (workflow.branches[index] === undefined) {
          return {};
        }

        var conditions = workflow.branches[index].conditions;
        if (conditions === undefined || conditions === null) {
          conditions = [];
        }

        const label = "Subflow";
        edge.data = {
          id: branch.id,
          _id: branch.id,
          source: branch.source_id,
          target: branch.destination_id,
          label: label,
          decorator: true,
        };

        return edge;
      });

      edges = edges.concat(visualedges);
    }

    setWorkflow(workflow);

    // Verifies if a branch is valid and skips others
    var newedges = [];
    for (var key in edges) {
      var item = edges[key];
      if (item.data === undefined) {
        continue;
      }

      const sourcecheck = insertedNodes.find(
        (data) => data.data.id === item.data.source
      );
      const destcheck = insertedNodes.find(
        (data) => data.data.id === item.data.target
      );
      if (sourcecheck === undefined || destcheck === undefined) {
        continue;
      }

      newedges.push(item);
    }

    insertedNodes = insertedNodes.concat(newedges);
    setElements(insertedNodes);
  };

  const removeNode = (nodeId) => {
    const selectedNode = cy.getElementById(nodeId);
    if (selectedNode.data() === undefined) {
			console.log("No node to remove")
      return;
    }

		//console.log("Removing node: ", selectedNode.data("id"), "Action: ", selectedAction.id)

		// Get selected node

    if (selectedNode.data().type === "TRIGGER") {
      console.log("Should remove trigger!");
      console.log(selectedNode.data());
      const triggerindex = workflow.triggers.findIndex(
        (data) => data.id === selectedNode.data().id
      );
      setSelectedTriggerIndex(triggerindex);
      if (selectedNode.data().trigger_type === "SCHEDULE") {
        setSelectedTrigger(selectedNode.data());
        stopSchedule(selectedNode.data(), triggerindex);
      } else if (selectedNode.data().trigger_type === "WEBHOOK") {
        setSelectedTrigger(selectedNode.data());
        deleteWebhook(selectedNode.data(), triggerindex);
      } else if (selectedNode.data().trigger_type === "EMAIL") {
        setSelectedTrigger(selectedNode.data());
        stopMailSub(selectedTrigger, triggerindex);
      }
    }

		//if (selectedNode.data("id") === selectedAction.id) {
		//	setSelectedApp({});
		//	setSelectedAction({});
    //setSelectedTrigger({});
    //setSelectedTriggerIndex({});
		//}
		const parsedSelection = cy.$(":selected");
    if (selectedNode.data().decorator === true && selectedNode.data("type") !== "COMMENT") {
      alert.info("This node can't be deleted.");
    } else {
      selectedNode.remove();
    }

		// An attempt at NOT unselecting when removing
		/*
		setTimeout(() => {
			if (parsedSelection.data() !== undefined) {
				if (parsedSelection.data("id") !== selectedNode.data("id")) {
					console.log("SHOULD SELECT SINCE ID IS DIFFERENT")

					parsedSelection.select()
				}
			}

			console.log("Parsed: ", parsedSelection.data("id"), selectedNode.data("id"))
		}, 2500)
		*/
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  //useEffect(() => {
    if (firstrequest) {
      setFirstrequest(false);
      getWorkflow(props.match.params.key, {});
      getApps();
      getAppAuthentication();
      getEnvironments();
      getWorkflowExecution(props.match.params.key, "");
      getAvailableWorkflows(-1);
      getSettings();

      const cursearch =
        typeof window === "undefined" || window.location === undefined
          ? ""
          : window.location.search;

			// FIXME: Don't check specific one here
			const tmpExec = new URLSearchParams(cursearch).get("execution_highlight");
      if (
        tmpExec !== undefined &&
        tmpExec !== null &&
        tmpExec === "executions"
      ) {
        setExecutionModalOpen(true)
        const newitem = removeParam("execution_highlight", cursearch);
				navigate(curpath + newitem)
        //props.history.push(curpath + newitem);
			}

      const tmpView = new URLSearchParams(cursearch).get("view");
      if (
        tmpView !== undefined &&
        tmpView !== null &&
        tmpView === "executions"
      ) {
        setExecutionModalOpen(true);

        const newitem = removeParam("view", cursearch);
				navigate(curpath + newitem)
				//navigate(`?execution_highlight=${parsed_url}`)
        //props.history.push(curpath + newitem);
      }
      return;
    }

    // App length necessary cus of cy initialization
    if (
			// First load - gets the workflow
      elements.length === 0 &&
      workflow.actions !== undefined &&
      !graphSetup &&
      Object.getOwnPropertyNames(workflow).length > 0
    ) {

      setGraphSetup(true);
      setupGraph();
			console.log("In graph setup")
    } else if (
			// 2nd load - configures cytoscape
			//
      !established &&
      cy !== undefined &&
      ((apps !== null &&
      apps !== undefined &&
      apps.length > 0) || workflow.public === true) &&
      Object.getOwnPropertyNames(workflow).length > 0 &&
      authLoaded
    ) {
			
			console.log("In POST graph setup!")
      //This part has to load LAST, as it's kind of not async.
      //This means we need everything else to happen first.

      setEstablished(true);
      // Validate if the node is just a node lol
      cy.edgehandles({
        handleNodes: (el) => {
					if (el.isNode() &&
					!el.data("isButton") &&
					!el.data("isDescriptor") &&
					!el.data("isSuggestion") &&
					el.data("type") !== "COMMENT") {
							return true 
					}

					return false
				},
        preview: true,
        toggleOffOnLeave: true,
        loopAllowed: function (node) {
          return false;
        },
      });

      cy.fit(null, 200);

      cy.on("boxselect", "node", (e) => {
        if (e.target.data("isButton") || e.target.data("isDescriptor") || e.target.data("isSuggestion")) {
          e.target.unselect();
        }

        e.target.addClass("selected");
      });

      cy.on("boxstart", (e) => {
        console.log("START");
        cy.removeListener("select");
      });

      cy.on("boxend", (e) => {
				console.log("END: ", cy)
				var cydata = cy.$(":selected").jsons();
				if (cydata !== undefined && cydata !== null && cydata.length > 0) {
        	alert.success(`Selected ${cydata.length} element(s). CTRL+C to copy them.`);
				}
      });

      cy.on("select", "node", (e) => {
      	onNodeSelect(e, appAuthentication);
      });
      cy.on("select", "edge", (e) => onEdgeSelect(e));

      cy.on("unselect", (e) => onUnselect(e));

      cy.on("add", "node", (e) => onNodeAdded(e));
      cy.on("add", "edge", (e) => onEdgeAdded(e));
      cy.on("remove", "node", (e) => onNodeRemoved(e));
      cy.on("remove", "edge", (e) => onEdgeRemoved(e));

      cy.on("mouseover", "edge", (e) => onEdgeHover(e));
      cy.on("mouseout", "edge", (e) => onEdgeHoverOut(e));
      cy.on("mouseover", "node", (e) => onNodeHover(e));
      cy.on("mouseout", "node", (e) => onNodeHoverOut(e));

      // Handles dragging
      cy.on("drag", "node", (e) => onNodeDrag(e, selectedAction));
      cy.on("free", "node", (e) => onNodeDragStop(e, selectedAction));

      cy.on("cxttap", "node", (e) => onCtxTap(e));

      document.title = "Workflow - " + workflow.name;
      registerKeys();
    }
  //})

  const stopSchedule = (trigger, triggerindex) => {
    fetch(
      globalUrl +
        "/api/v1/workflows/" +
        props.match.params.key +
        "/schedule/" +
        trigger.id,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        // No matter what, it's being stopped.
        if (!responseJson.success) {
          if (responseJson.reason !== undefined) {
            alert.error("Failed to stop schedule: " + responseJson.reason);
          }
        } else {
          alert.success("Successfully stopped schedule");
        }

        workflow.triggers[triggerindex].status = "stopped";
        trigger.status = "stopped";
        setSelectedTrigger(trigger);
        setWorkflow(workflow);
        saveWorkflow(workflow);
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const submitSchedule = (trigger, triggerindex) => {
    if (trigger.name.length <= 0) {
      alert.error("Error: name can't be empty");
      return;
    }

    alert.info("Attempting to create schedule with name " + trigger.name);
    const data = {
      name: trigger.name,
      frequency: workflow.triggers[triggerindex].parameters[0].value,
      execution_argument: workflow.triggers[triggerindex].parameters[1].value,
      environment: workflow.triggers[triggerindex].environment,
      id: trigger.id,
    };

    fetch(
      globalUrl + "/api/v1/workflows/" + props.match.params.key + "/schedule",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          alert.error("Failed to set schedule: " + responseJson.reason);
        } else {
          alert.success("Successfully created schedule");
          workflow.triggers[triggerindex].status = "running";
          trigger.status = "running";
          setSelectedTrigger(trigger);
          setWorkflow(workflow);
          console.log("Should set the status to running and save");
          saveWorkflow(workflow);
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const appViewStyle = {
    marginLeft: 5,
    marginRight: 5,
    display: "flex",
    flexDirection: "column",
    minHeight: isMobile ? bodyHeight-appBarSize*4 : "100%",
    maxHeight: isMobile ? bodyHeight-appBarSize*4 : "100%",
  };

  const paperAppStyle = {
    borderRadius: theme.palette.borderRadius,
    minHeight: isMobile ? 50 : 100,
    maxHeight: isMobile ? 50 : 100,
    minWidth: isMobile ? 50 : "100%",
    maxWidth: isMobile ? 50 : "100%",
    marginTop: "5px",
    color: "white",
    backgroundColor: surfaceColor,
    cursor: "pointer",
    display: "flex",
  };

  const paperVariableStyle = {
    borderRadius: theme.palette.borderRadius,
    minHeight: 50,
    maxHeight: 50,
    minWidth: "100%",
    maxWidth: "100%",
    marginTop: "5px",
    color: "white",
    backgroundColor: surfaceColor,
    cursor: "pointer",
    display: "flex",
  };

  const VariablesView = () => {
    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const menuClick = (event) => {
      setOpen(!open);
      setAnchorEl(event.currentTarget);
    };

    const deleteVariable = (variableIndex) => {
      //console.log("Delete:", variableName);
			if (workflow.workflow_variables !== undefined && workflow.workflow_variables !== null && workflow.workflow_variables.length > variableIndex) {
				workflow.workflow_variables.splice(variableIndex, 1)
			}

      //workflow.workflow_variables = workflow.workflow_variables.filter(
      //  (data) => data.name !== variableName
      //);
      setWorkflow(workflow);
    };

    const deleteExecutionVariable = (variableIndex) => {
			if (workflow.execution_variables !== undefined && workflow.execution_variables !== null && workflow.execution_variables.length > variableIndex) {
				workflow.execution_variables.splice(variableIndex, 1)
			}

      //workflow.execution_variables = workflow.execution_variables.filter(
      //  (data) => data.name !== variableName
      //);
      setWorkflow(workflow);
    };

    const variableScrollStyle = {
      margin: 15,
      overflow: "scroll",
      height: isMobile ? "100%" : "66vh",
      overflowX: "auto",
      overflowY: "auto",
      flex: "10",
    };

    return (
      <div style={appViewStyle}>
        <div style={variableScrollStyle}>
          What are{" "}
          <a
            rel="noopener noreferrer"
            href="https://shuffler.io/docs/workflows#workflow_variables"
            target="_blank"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            WORKFLOW variables?
          </a>
          {workflow.workflow_variables === null
            ? null
            : workflow.workflow_variables.map((variable, index) => {
                return (
                  <div key={index}>
                    <Paper square style={paperVariableStyle} onClick={() => {}}>
                      <div
                        style={{
                          marginLeft: "10px",
                          marginTop: "5px",
                          marginBottom: "5px",
                          width: "2px",
                          backgroundColor: yellow,
                          marginRight: "5px",
                        }}
                      />
                      <div style={{ display: "flex", width: "100%" }}>
                        <div
                          style={{
                            flex: "10",
                            marginTop: "15px",
                            marginLeft: "10px",
                            overflow: "hidden",
                          }}
                          onClick={() => {
														setVariableInfo({
															"name": variable.name,
															"description": variable.description,
															"value": variable.value,
															"index": index,
														})
                            setVariablesModalOpen(true);
                          }}
                        >
                          Name: {variable.name}
                        </div>
                        <div style={{ flex: "1", marginLeft: "0px" }}>
                          <IconButton
                            aria-label="more"
                            aria-controls="long-menu"
                            aria-haspopup="true"
                            onClick={menuClick}
                            style={{ color: "white" }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            id="long-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={open}
                            PaperProps={{
                              style: {
                                backgroundColor: surfaceColor,
                              },
                            }}
                            onClose={() => {
                              setOpen(false);
                              setAnchorEl(null);
                            }}
                          >
                            <MenuItem
                              style={{
                                backgroundColor: inputColor,
                                color: "white",
                              }}
                              onClick={() => {
                                setOpen(false);
																setVariableInfo({
																	"name": variable.name,
																	"description": variable.description,
																	"value": variable.value,
																	"index": index,
																})
                                setVariablesModalOpen(true);
                              }}
                              key={"Edit"}
                            >
                              {"Edit"}
                            </MenuItem>
                            <MenuItem
                              style={{
                                backgroundColor: inputColor,
                                color: "white",
                              }}
                              onClick={() => {
                                deleteVariable(index);
                                setOpen(false);
                              }}
                              key={"Delete"}
                            >
                              {"Delete"}
                            </MenuItem>
                          </Menu>
                        </div>
                      </div>
                    </Paper>
                  </div>
                );
              })}
          <div style={{ flex: "1" }}>
            <Button
              fullWidth
              style={{ margin: "auto", marginTop: "10px" }}
              color="primary"
              variant="outlined"
              onClick={() => {
                setVariablesModalOpen(true);
                setLastSaved(false);
              }}
            >
              New workflow variable
            </Button>
          </div>
          <Divider
            style={{
              marginBottom: 20,
              marginTop: 20,
              height: 1,
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          What are{" "}
          <a
            rel="noopener noreferrer"
            href="https://shuffler.io/docs/workflows#execution_variables"
            target="_blank"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            EXECUTION variables?
          </a>
          {workflow.execution_variables === null ||
          workflow.execution_variables === undefined
            ? null
            : workflow.execution_variables.map((variable, index) => {
                return (
                  <div>
                    <Paper square style={paperVariableStyle} onClick={() => {}}>
                      <div
                        style={{
                          marginLeft: "10px",
                          marginTop: "5px",
                          marginBottom: "5px",
                          width: "2px",
                          backgroundColor: yellow,
                          marginRight: "5px",
                        }}
                      />
                      <div style={{ display: "flex", width: "100%" }}>
                        <div
                          style={{
                            flex: "10",
                            marginTop: "15px",
                            marginLeft: "10px",
                            overflow: "hidden",
                          }}
                          onClick={() => {
                            //setNewVariableName(variable.name);
														setVariableInfo({
															"name": variable.name,
															"description": variable.description,
															"value": variable.value,
															"index": index,
														})
                            setExecutionVariablesModalOpen(true);
                          }}
                        >
                          Name: {variable.name}
                        </div>
                        <div style={{ flex: "1", marginLeft: "0px" }}>
                          <IconButton
                            aria-label="more"
                            aria-controls="long-menu"
                            aria-haspopup="true"
                            onClick={menuClick}
                            style={{ color: "white" }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            id="long-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={open}
                            PaperProps={{
                              style: {
                                backgroundColor: surfaceColor,
                              },
                            }}
                            onClose={() => {
                              setOpen(false);
                              setAnchorEl(null);
                            }}
                          >
                            <MenuItem
                              style={{
                                backgroundColor: inputColor,
                                color: "white",
                              }}
                              onClick={() => {
                                setOpen(false);
                                //setNewVariableName(variable.name);
																setVariableInfo({
																	"name": variable.name,
																	"description": variable.description,
																	"value": variable.value,
																	"index": index,
																})
                                setExecutionVariablesModalOpen(true);
                              }}
                              key={"Edit"}
                            >
                              {"Edit"}
                            </MenuItem>
                            <MenuItem
                              style={{
                                backgroundColor: inputColor,
                                color: "white",
                              }}
                              onClick={() => {
                                deleteExecutionVariable(index);
                                setOpen(false);
                              }}
                              key={"Delete"}
                            >
                              {"Delete"}
                            </MenuItem>
                          </Menu>
                        </div>
                      </div>
                    </Paper>
                  </div>
                );
              })}
          <div style={{ flex: "1" }}>
            <Button
              fullWidth
              style={{ margin: "auto", marginTop: "10px" }}
              color="primary"
              variant="outlined"
              onClick={() => {
                setExecutionVariablesModalOpen(true);
                setLastSaved(false);
              }}
            >
              New execution variable
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleSetTab = (event, newValue) => {
    setCurrentView(newValue);
  };

  const HandleLeftView = () => {
    // Defaults to apps.
    var thisview = (
      <AppView
        allApps={apps}
        prioritizedApps={prioritizedApps}
        filteredApps={filteredApps}
      />
    );
    if (currentView === 1) {
      thisview = <TriggersView />;
    } else if (currentView === 2) {
      thisview = <VariablesView />;
    }

    const tabStyle = {
      maxWidth: isMobile ? leftBarSize : leftBarSize / 3,
      minWidth: isMobile ? leftBarSize : leftBarSize / 3,
      flex: 1,
      textTransform: "none",
    };

    const iconStyle = {
      marginTop: 3,
      marginRight: 5,
    };

		const parsedHeight = isMobile ? bodyHeight - appBarSize*4 : bodyHeight - appBarSize - 50
    return (
      <div>
        <div
          style={{
            minHeight: parsedHeight, 
            maxHeight: parsedHeight, 
						overflow: "hidden",
          }}
        >
          {thisview}
        </div>
        <Divider style={{ backgroundColor: "rgb(91, 96, 100)" }} />
        <Tabs
          value={currentView}
          indicatorColor="primary"
          onChange={handleSetTab}
          aria-label="Left sidebar tab"
					orientation={isMobile ? "vertical" : "horizontal"}
					style={{}}
        >
          <Tab
            label={
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <AppsIcon style={iconStyle} />
                </Grid>
                {isMobile ? null : <Grid item>Apps</Grid>}
              </Grid>
            }
            style={tabStyle}
          />
          <Tab
            label={
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <ScheduleIcon style={iconStyle} />
                </Grid>
                {isMobile ? null : <Grid item>Triggers</Grid>}
              </Grid>
            }
            style={tabStyle}
          />
          <Tab
            label={
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <FavoriteBorderIcon style={iconStyle} />
                </Grid>
                {isMobile ? null : <Grid item>Variables</Grid>}
              </Grid>
            }
            style={tabStyle}
          />
        </Tabs>
      </div>
    );
  };

  const triggers = [
    {
      name: "Webhook",
      type: "TRIGGER",
      status: "uninitialized",
      trigger_type: "WEBHOOK",
      errors: null,
      large_image:
        "data:image/png;base64,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",
      is_valid: true,
      label: "Webhook",
      environment: "onprem",
      description: "Simple HTTP webhook",
      long_description: "Execute a workflow with an unauthicated POST request",
    },
    {
      name: "Schedule",
      type: "TRIGGER",
      status: "uninitialized",
      description: "Schedule execution time",
      trigger_type: "SCHEDULE",
      errors: null,
      large_image:
        "data:image/png;base64,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",
      label: "Schedule",
      is_valid: true,
      environment: "onprem",
      long_description: "Create a schedule based on cron",
    },
    {
      name: "Shuffle Workflow",
      type: "TRIGGER",
      status: "uninitialized",
      trigger_type: "SUBFLOW",
      errors: null,
      large_image:
        "data:image/png;base64,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",
      is_valid: true,
      label: "Subflow",
      environment: "onprem",
      description: "Control another workflow",
      long_description: "Execute another workflow from this workflow",
    },
    {
      name: "User Input",
      type: "TRIGGER",
      status: "running",
      large_image:
        "data:image/png;base64,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",
      description: "Wait for user input",
      trigger_type: "USERINPUT",
      errors: null,
      is_valid: cloudSyncEnabled || isCloud ? true : false,
      label: "User input",
      environment: "cloud",
      long_description: "Take user input to continue execution",
    },
    {
      name: "Office365",
      type: "TRIGGER",
      status: "uninitialized",
      description: "Starts upon O365 email",
      trigger_type: "EMAIL",
      errors: null,
      is_valid: cloudSyncEnabled || isCloud ? true : false,
      label: "Email",
      environment: "cloud",
      large_image:
        "data:image/jpg;base64,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",
      long_description: "Execute a workflow when you get an email",
    },
    {
      name: "Gmail",
      type: "TRIGGER",
      status: "uninitialized",
      description: "Trigger based on Gmail",
      trigger_type: "EMAIL",
      errors: null,
      is_valid: cloudSyncEnabled || isCloud ? true : false,
      label: "Email",
      environment: "cloud",
      large_image:
        "data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/hAzFodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QTIyMjgyMEYwMDJDMTFFQkJBOEE5OUJBM0MzMTA2RDIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTIyMjgyMTAwMDJDMTFFQkJBOEE5OUJBM0MzMTA2RDIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozQTMwMDQxRTAwMEUxMUVCQkE4QTk5QkEzQzMxMDZEMiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBMjIyODIwRTAwMkMxMUVCQkE4QTk5QkEzQzMxMDZEMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/bAEMAAwICAwICAwMCAwMDAwMEBwUEBAQECQYHBQcKCQsL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",
      long_description: "Execute a workflow when you get an email",
    },
  ];

  const TriggersView = () => {
    const triggersViewStyle = {
      marginLeft: "10px",
      marginRight: "10px",
      display: "flex",
      flexDirection: "column",
    };

    // Predefined hurr

    return (
      <div style={triggersViewStyle}>
        <div style={appScrollStyle}>
          {triggers.map((trigger, index) => {
            var imageline =
              trigger.large_image.length === 0 ? (
                <img alt="" style={{ width: isMobile ? 40 : 80, pointerEvents: "none" }} />
              ) : (
                <img
                  alt=""
                  src={trigger.large_image}
                  style={{ width: isMobile ? 40 : 80, height: isMobile ? 40 : 80, pointerEvents: "none" }}
                />
              );

            const color = trigger.is_valid ? green : yellow;
            return (
              <Draggable
                key={index}
                onDrag={(e) => {
                  handleTriggerDrag(e, trigger);
                }}
                onStop={(e) => {
                  handleDragStop(e);
                }}
                dragging={false}
                position={{
                  x: 0,
                  y: 0,
                }}
              >
                <Paper square style={paperAppStyle} onClick={() => {}}>
                  <div
                    style={{
                      marginLeft: isMobile ? 0 : "10px",
                      marginTop: isMobile ? 10 : "5px",
                      marginBottom: "5px",
                      width: "2px",
                      backgroundColor: color,
                      marginRight: "5px",
                    }}
                  ></div>
                  <Grid
                    container
                    style={{ margin: isMobile ? "10px 0px 0px 0px" : "10px 10px 10px 10px", flex: "10" }}
                  >
                    <Grid item>
                      <ButtonBase>{imageline}</ButtonBase>
                    </Grid>
										{isMobile ? null : 
											<Grid
												style={{
													display: "flex",
													flexDirection: "column",
													marginLeft: "20px",
												}}
											>
												<Grid item style={{ flex: "1" }}>
													<h3 style={{ marginBottom: "0px", marginTop: "10px" }}>
														{trigger.name}
													</h3>
												</Grid>
												<Grid item style={{ flex: "1" }}>
													{trigger.description}
												</Grid>
											</Grid>
										}
									</Grid>
                </Paper>
              </Draggable>
            );
          })}
        </div>
      </div>
    );
  };

  var newNodeId = "";
  var parsedApp = {};
  const handleTriggerDrag = (e, data) => {
    const cycontainer = cy.container();
    // Chrome lol
    if (
      e.pageX > cycontainer.offsetLeft &&
      e.pageX < cycontainer.offsetLeft + cycontainer.offsetWidth &&
      e.pageY > cycontainer.offsetTop &&
      e.pageY < cycontainer.offsetTop + cycontainer.offsetHeight
    ) {
      if (newNodeId.length > 0) {
        var currentnode = cy.getElementById(newNodeId);
        if (currentnode.length === 0) {
          return;
        }

        currentnode[0].renderedPosition("x", e.pageX - cycontainer.offsetLeft);
        currentnode[0].renderedPosition("y", e.pageY - cycontainer.offsetTop);
      } else {
        if (workflow.start === "" || workflow.start === undefined) {
          alert.error("Define a starting action first.");
          return;
        }

        const triggerLabel = getNextActionName(data.name);

        newNodeId = uuidv4();
        const newposition = {
          x: e.pageX - cycontainer.offsetLeft,
          y: e.pageY - cycontainer.offsetTop,
        };

        const newAppData = {
          app_name: data.name,
          app_version: "1.0.0",
          environment: isCloud ? "cloud" : data.environment,
          description: data.description,
          long_description: data.long_description,
          errors: [],
          id_: newNodeId,
          _id_: newNodeId,
          id: newNodeId,
          finished: false,
          label: triggerLabel,
          type: data.type,
          is_valid: true,
          trigger_type: data.trigger_type,
          large_image: data.large_image,
          status: "uninitialized",
          name: data.name,
          isStartNode: false,
          position: newposition,
        };

        // Can all the data be in here? hmm
        const nodeToBeAdded = {
          group: "nodes",
          data: newAppData,
          renderedPosition: newposition,
        };

        cy.add(nodeToBeAdded);
        parsedApp = nodeToBeAdded;
        return;
      }
    }
  };

  const handleDragStop = (e, app) => {
    var currentnode = cy.getElementById(newNodeId);
    if (
      currentnode === undefined ||
      currentnode === null ||
      currentnode.length === 0
    ) {
      return;
    }

    // Using remove & replace, as this triggers the function
    // onNodeAdded() with this node after it's added

    currentnode.remove();
    parsedApp.data.finished = true;
    parsedApp.data.position = currentnode.renderedPosition();
    parsedApp.position = currentnode.renderedPosition();
    parsedApp.renderedPosition = currentnode.renderedPosition();

    var newAppData = parsedApp.data;
    if (newAppData.type === "ACTION") {
	
			//const activateApp = (appid) => {
			if (newAppData.activated === false) {
				console.log("SHOULD ACTIVATE!")
				activateApp(newAppData.app_id) 
			}

      // AUTHENTICATION
      if (app.authentication.required) {
				console.log("App auth is required!")

        // Setup auth here :)
        const authenticationOptions = [];
        var findAuthId = "";
        if (
          newAppData.authentication_id !== null &&
          newAppData.authentication_id !== undefined &&
          newAppData.authentication_id.length > 0
        ) {
          findAuthId = newAppData.authentication_id;
        }

				console.log("Found auth: ", findAuthId)
        var tmpAuth = JSON.parse(JSON.stringify(appAuthentication));
        for (var key in tmpAuth) {
          var item = tmpAuth[key];

          const newfields = {};
          for (var filterkey in item.fields) {
            newfields[item.fields[filterkey].key] =
              item.fields[filterkey].value;
          }

          item.fields = newfields;
          if (item.app.name === app.name) {
            authenticationOptions.push(item);
            if (item.id === findAuthId) {
              newAppData.selectedAuthentication = item;
            }
          }
        }

        if (
          authenticationOptions !== undefined &&
          authenticationOptions !== null &&
          authenticationOptions.length > 0
        ) {
          for (var key in authenticationOptions) {
            const option = authenticationOptions[key];
            if (option.active) {
              newAppData.selectedAuthentication = option;
              newAppData.authentication_id = option.id;
              break;
            }
          }
        }
      } else {
        newAppData.authentication = [];
        newAppData.authentication_id = "";
        newAppData.selectedAuthentication = {};
      }

      parsedApp.data = newAppData;
      cy.add(parsedApp);
    } else if (newAppData.type === "TRIGGER") {
      cy.add(parsedApp);
    }

    newNodeId = "";
    parsedApp = {};
  };

  const appScrollStyle = {
    overflow: "scroll",
    maxHeight: isMobile ? bodyHeight-appBarSize*4 : bodyHeight - appBarSize - 55 - 50,
    minHeight: isMobile ? bodyHeight-appBarSize*4 : bodyHeight - appBarSize - 55 - 50,
    marginTop: 1,
    overflowY: "auto",
    overflowX: "hidden",
  };

  const handleAppDrag = (e, app) => {
    const cycontainer = cy.container();

		//console.log("e: ", e)
		//console.log("Offset: ", cycontainer)

    // Chrome lol
    if (
      e.pageX > cycontainer.offsetLeft &&
      e.pageX < cycontainer.offsetLeft + cycontainer.offsetWidth &&
      e.pageY > cycontainer.offsetTop &&
      e.pageY < cycontainer.offsetTop + cycontainer.offsetHeight
    ) {
      if (newNodeId.length > 0) {
        var currentnode = cy.getElementById(newNodeId);
        if (
          currentnode === undefined ||
          currentnode === null ||
          currentnode.length === 0
        ) {
          return;
        }

        currentnode[0].renderedPosition("x", e.pageX - cycontainer.offsetLeft);
        currentnode[0].renderedPosition("y", e.pageY - cycontainer.offsetTop);
      } else {
        if (workflow.public) {
          console.log("workflow is public - not adding");
          return;
        }

        if (
          app.actions === undefined ||
          app.actions === null ||
          app.actions.length === 0
        ) {
          alert.error(
            "App " +
              app.name +
              " currently has no actions to perform. Please go to https://shuffler.io/apps to edit it."
          );
          return;
        }

        newNodeId = uuidv4();
        const actionType = "ACTION";
        const actionLabel = getNextActionName(app.name);
        var parameters = null;
        var example = "";
				var description = ""

        if (
          app.actions[0].parameters !== null &&
          app.actions[0].parameters.length > 0
        ) {
          parameters = app.actions[0].parameters;
        }

        if (
          app.actions[0].returns.example !== undefined &&
          app.actions[0].returns.example !== null &&
          app.actions[0].returns.example.length > 0
        ) {
          example = app.actions[0].returns.example;
        }

        if (
          app.actions[0].description !== undefined &&
          app.actions[0].description !== null &&
          app.actions[0].description.length > 0
        ) {
					description = app.actions[0].description
        }

        const parsedEnvironments =
          environments === null || environments === []
            ? "cloud"
            : environments[defaultEnvironmentIndex] === undefined
            ? "cloud"
            : environments[defaultEnvironmentIndex].Name;

      	// activated: app.generated === true ? app.activated === false ? false : true : true,
        const newAppData = {
          app_name: app.name,
          app_version: app.app_version,
          app_id: app.id,
          sharing: app.sharing,
          private_id: app.private_id,
					description: description,
          environment: parsedEnvironments,
          errors: [],
					finished: false,
          id_: newNodeId,
          _id_: newNodeId,
          id: newNodeId,
          is_valid: true,
          label: actionLabel,
          type: actionType,
          name: app.actions[0].name,
          parameters: parameters,
          isStartNode: false,
          large_image: app.large_image,
					run_magic_output: false,
          authentication: [],
          execution_variable: undefined,
          example: example,
          category:
            app.categories !== null &&
            app.categories !== undefined &&
            app.categories.length > 0
              ? app.categories[0]
              : "",
          authentication_id: "",
          finished: false,
        };

        // FIXME: overwrite category if the ACTION chosen has a different category

        // const image = "url("+app.large_image+")"
        // FIXME - find the cytoscape offset position
        // Can this be done with zoom calculations?
        const nodeToBeAdded = {
          group: "nodes",
          data: newAppData,
          renderedPosition: {
            x: e.pageX - cycontainer.offsetLeft,
            y: e.pageY - cycontainer.offsetTop,
          },
        };

        parsedApp = nodeToBeAdded;
        cy.add(nodeToBeAdded);
        return;
      }
    }
  };

  const AppView = (props) => {
    const { allApps, prioritizedApps, filteredApps } = props;
    const [visibleApps, setVisibleApps] = React.useState(
      prioritizedApps.concat(
        filteredApps.filter((innerapp) => !internalIds.includes(innerapp.id))
      )
    );

		var delay = -75
		var runDelay = false

    const ParsedAppPaper = (props) => {
      const app = props.app;
      const [hover, setHover] = React.useState(false);

      const maxlen = 24;
      var newAppname = app.name;
      newAppname = newAppname.charAt(0).toUpperCase() + newAppname.substring(1);
      if (newAppname.length > maxlen) {
        newAppname = newAppname.slice(0, maxlen) + "..";
      }

      newAppname = newAppname.replaceAll("_", " ");

      const image = app.large_image;
      const newAppStyle = JSON.parse(JSON.stringify(paperAppStyle));
      const pixelSize = !hover ? "2px" : "4px";
      //newAppStyle.borderLeft = app.is_valid && app.actions !== null && app.actions !== undefined && app.actions.length > 0 && !(app.activated && app.generated)
      newAppStyle.borderLeft = app.is_valid && app.actions !== null && app.actions !== undefined && app.actions.length > 0 
        ? `${pixelSize} solid ${green}`
        : `${pixelSize} solid ${yellow}`;

			if (!app.activated && app.generated) {
        newAppStyle.borderLeft = `${pixelSize} solid ${yellow}`;
			}

      return (
        <Draggable
          onDrag={(e) => {
            handleAppDrag(e, app);
          }}
          onStop={(e) => {
            handleDragStop(e, app);
          }}
          key={app.id}
          dragging={false}
          position={{
            x: 0,
            y: 0,
          }}
        >
          <Paper
            square
            style={newAppStyle}
            onMouseOver={() => {
              setHover(true);
            }}
            onMouseOut={() => {
              setHover(false);
            }}
						onClick={() => {
							if (isMobile) {
        				newNodeId = uuidv4();
        				const actionType = "ACTION";
        				const actionLabel = getNextActionName(app.name);
        				var parameters = null;
        				var example = "";
								var description = ""

        				if (
        				  app.actions[0].parameters !== null &&
        				  app.actions[0].parameters.length > 0
        				) {
        				  parameters = app.actions[0].parameters;
        				}

        				if (
        				  app.actions[0].returns.example !== undefined &&
        				  app.actions[0].returns.example !== null &&
        				  app.actions[0].returns.example.length > 0
        				) {
        				  example = app.actions[0].returns.example;
        				}

        				if (
        				  app.actions[0].description !== undefined &&
        				  app.actions[0].description !== null &&
        				  app.actions[0].description.length > 0
        				) {
									description = app.actions[0].description
        				}

        				const parsedEnvironments =
        				  environments === null || environments === []
        				    ? "cloud"
        				    : environments[defaultEnvironmentIndex] === undefined
        				    ? "cloud"
        				    : environments[defaultEnvironmentIndex].Name;

      					// activated: app.generated === true ? app.activated === false ? false : true : true,
        				const newAppData = {
        				  app_name: app.name,
        				  app_version: app.app_version,
        				  app_id: app.id,
        				  sharing: app.sharing,
        				  private_id: app.private_id,
									description: description,
        				  environment: parsedEnvironments,
        				  errors: [],
									finished: false,
        				  id_: newNodeId,
        				  _id_: newNodeId,
        				  id: newNodeId,
        				  is_valid: true,
        				  label: actionLabel,
        				  type: actionType,
        				  name: app.actions[0].name,
        				  parameters: parameters,
        				  isStartNode: false,
        				  large_image: app.large_image,
									run_magic_output: false,
        				  authentication: [],
        				  execution_variable: undefined,
        				  example: example,
        				  category:
        				    app.categories !== null &&
        				    app.categories !== undefined &&
        				    app.categories.length > 0
        				      ? app.categories[0]
        				      : "",
        				  authentication_id: "",
        				  finished: false,
        				};

								const nodeToBeAdded = {
        				  group: "nodes",
        				  data: newAppData,
        				  renderedPosition: {
        				    x: 100,
        				    y: 100,
        				  },
        				};

        				parsedApp = nodeToBeAdded;
        				cy.add(nodeToBeAdded);

							}
						}}
          >
            <Grid
              container
              style={{ margin: "10px 10px 10px 15px", flex: "10" }}
            >
              <Grid item>
                <img
                  alt={newAppname}
                  src={image}
                  style={{
                    pointerEvents: "none",
                    userDrag: "none",
                    userSelect: "none",
                    borderRadius: theme.palette.borderRadius,
                    height: isMobile ? 40 : 80,
                    width: isMobile ? 40 : 80,
                  }}
                />
              </Grid>
							{isMobile ? null : 
								<Grid
									style={{
										display: "flex",
										flexDirection: "column",
										marginLeft: "20px",
										minWidth: 185,
										maxWidth: 185,
										overflow: "hidden",
										maxHeight: 77,
									}}
								>
									<Grid item style={{ flex: 1 }}>
										<Typography
											variant="body1"
											style={{ marginBottom: 0, marginTop: 5 }}
										>
											{newAppname}
										</Typography>
									</Grid>
									<Grid item style={{ flex: 1 }}>
										<Typography variant="body2" color="textSecondary">
											Version: {app.app_version}
										</Typography>
									</Grid>
									<Grid
										item
										style={{
											flex: 1,
											width: "100%",
											maxHeight: 27,
											overflow: "hidden",
										}}
									>
										<Typography variant="body2" color="textSecondary">
											{app.description}
										</Typography>
									</Grid>
								</Grid>
							}
            </Grid>
          </Paper>
        </Draggable>
      );
    };

    const runSearch = (value) => {
      if (value.length > 0) {
        var newApps = allApps.filter(
          (app) =>
            app.name
              .toLowerCase()
              .includes(
                value.trim().toLowerCase() ||
                  app.description
                    .toLowerCase()
                    .includes(value.trim().toLowerCase())
              ) && !(!app.activated && app.generated)
        );

        // Extend search
        if (newApps.length === 0) {
          const searchvalue = value.trim().toLowerCase();
          newApps = allApps.filter((app) => {
            for (var key in app.actions) {
              const inneraction = app.actions[key];
              if (inneraction.name.toLowerCase().includes(searchvalue)) {
                return true;
              }
            }

            return false;
          });
        }

        setVisibleApps(newApps);
      } else {
        setVisibleApps(
          prioritizedApps.concat(
            filteredApps.filter(
              (innerapp) => !internalIds.includes(innerapp.id)
            )
          )
        );
      }
    };

    return (
      <div style={appViewStyle}>
        <div style={{ flex: "1" }}>
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette.borderRadius,
              marginTop: 5,
              marginRight: 10,
            }}
            InputProps={{
              style: {
                color: "white",
                minHeight: 50,
                marginLeft: "5px",
                maxWidth: "95%",
                fontSize: "1em",
              },
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Run search" placement="top">
                    <SearchIcon style={{ cursor: "pointer" }} />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            fullWidth
            color="primary"
            placeholder={"Search Active Apps"}
            id="appsearch"
            onKeyPress={(event) => {
              if (event.key === "Enter") {
                event.target.blur(event);
              }
            }}
            onBlur={(event) => {
              console.log("BLUR: ", event.target.value);
              runSearch(event.target.value);
            }}
          />
          {visibleApps.length > 0 ? (
            <div style={appScrollStyle}>
              {visibleApps.map((app, index) => {
                if (app.invalid) {
                  return null;
                }

								var extraMessage = ""
								if (index == 2) {
									extraMessage = <div style={{marginTop: 5}} />
								}

								delay += 75
                return (
									runDelay ? 
										<Zoom key={index} in={true} style={{ transitionDelay: `${delay}ms` }}>
											<div>
												<ParsedAppPaper key={index} app={app} />
											</div>
										</Zoom>
									: 
									<div key={index}>
										{extraMessage}
										<ParsedAppPaper key={index} app={app} />
									</div>
								)
              })}
            </div>
          ) : apps.length > 0 ? (
            <div
              style={{ textAlign: "center", width: leftBarSize, marginTop: 10 }}
            >
              <Typography variant="body1" color="textSecondary">
                Couldn't find app. Is it active?
              </Typography>
            </div>
          ) : (
            <div style={{ textAlign: "center", width: leftBarSize }}>
              <CircularProgress
                style={{
                  marginTop: "27vh",
                  height: 35,
                  width: 35,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              />
              <Typography variant="body1" color="textSecondary">
                Loading Apps
              </Typography>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getNextActionName = (appName) => {
    var highest = "";
    const allitems = workflow.actions.concat(workflow.triggers);
    for (var key in allitems) {
      const item = allitems[key];
      if (
        item.app_name === appName &&
        item.label !== undefined &&
        item.label !== null
      ) {
        var number = item.label.split("_");
        if (
          isNaN(number[-1]) &&
          parseInt(number[number.length - 1]) > highest
        ) {
          highest = number[number.length - 1];
        }
      }
    }

    if (highest) {
      return appName + "_" + (parseInt(highest) + 1);
    } else {
      return appName + "_" + 1;
    }
  };

  const setNewSelectedAction = (e) => {
		if (selectedApp.actions === undefined || selectedApp.actions === null) {
			return
		}

    const newaction = selectedApp.actions.find(
      (a) => a.name === e.target.value
    );

    if (newaction === undefined || newaction === null) {
      alert.error("Failed to find the action");
      return;
    }

		if (workflow.actions !== undefined && workflow.actions !== null) {
			const foundInfo = workflow.actions.find(ac => ac.id === selectedAction.id)
			console.log("aigo: ", foundInfo)
		}

		console.log("PRe: ", selectedAction)

    // Does this one find the wrong one?
    //var newSelectedAction = JSON.parse(JSON.stringify(selectedAction))
    var newSelectedAction = selectedAction
    newSelectedAction.name = newaction.name;
    newSelectedAction.parameters = JSON.parse(JSON.stringify(newaction.parameters))
    newSelectedAction.errors = [];
    newSelectedAction.isValid = true;
    newSelectedAction.is_valid = true;
		//console.log(newSelectedAction)

		// Simmple action swap autocompleter
		if (selectedAction.parameters !== undefined && newSelectedAction.parameters !== undefined && selectedAction.id === newSelectedAction.id) {
			console.log("OLD: ", selectedAction, "NEW: ", newSelectedAction)
			for (var paramkey in selectedAction.parameters) {
				const param = selectedAction.parameters[paramkey];

				if (param.value === null || param.value === undefined || param.value.length === 0) {
					continue
				}

				if (param.name === "body") {
					//console.log("Param: ", param)
					continue
				}

				if (param.name === "headers") {
					console.log("Swap header?")
					//newSelectedAction.parameters[newParamIndex].value = param.value
				}

				const newParamIndex = newSelectedAction.parameters.findIndex(paramdata => paramdata.name === param.name)
				if (newParamIndex < 0) {
					continue
				}

				newSelectedAction.parameters[newParamIndex].value = param.value
			}
		}

    if (newSelectedAction.app_name === "Shuffle Tools") {
      const iconInfo = GetIconInfo(newSelectedAction);
      console.log("ICONINFO: ", iconInfo);
      const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
      const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);
      newSelectedAction.large_image = svgpin_Url;
      newSelectedAction.fillGradient = iconInfo.fillGradient;
      newSelectedAction.fillstyle = "solid";
      if (
        newSelectedAction.fillGradient !== undefined &&
        newSelectedAction.fillGradient !== null &&
        newSelectedAction.fillGradient.length > 0
      ) {
        newSelectedAction.fillstyle = "linear-gradient";
        console.log("GRADIENT!: ", newSelectedAction);
      } else {
        newSelectedAction.iconBackground = iconInfo.iconBackgroundColor;
      }

      const foundnode = cy.getElementById(newSelectedAction.id);
      if (foundnode !== null && foundnode !== undefined) {
        console.log("UPDATING NODE!");
        foundnode.data(newSelectedAction);
      }
    }


    // Takes an action as input, then runs through and updates the relevant fields
    // based on previous actions'
    newSelectedAction = RunAutocompleter(newSelectedAction);

    if (
      newaction.returns.example !== undefined &&
      newaction.returns.example !== null &&
      newaction.returns.example.length > 0
    ) {
      newSelectedAction.example = newaction.returns.example;
    }

    if (
      newaction.description !== undefined &&
      newaction.description !== null &&
      newaction.description.length > 0
    ) {
      newSelectedAction.description = newaction.description
    }

    // FIXME - this is broken sometimes lol
    //var env = environments.find(a => a.Name === newaction.environment)
    //if ((!env || env === undefined) && selectedAction.environment === undefined ) {
    //	env = environments[defaultEnvironmentIndex]
    //}
    //setSelectedActionEnvironment(env)


    console.log("NEW ACTION: ", newSelectedAction);
    setSelectedAction(newSelectedAction);
		if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
			const foundActionIndex = workflow.actions.findIndex(actiondata => actiondata.id === newSelectedAction.id)
			console.log("Found action on index ", foundActionIndex)
			if (foundActionIndex >= 0) {
				workflow.actions[foundActionIndex] = newSelectedAction
				setWorkflow(workflow)
			}
		}
    setUpdate(Math.random());

    // FIXME - should change icon-node (descriptor) as well
    const allNodes = cy.nodes().jsons();
    for (var key in allNodes) {
      const currentNode = allNodes[key];
      if (
        currentNode.data.attachedTo === selectedAction.id &&
        currentNode.data.isDescriptor
      ) {
        const foundnode = cy.getElementById(currentNode.data.id);
        if (foundnode !== null && foundnode !== undefined) {
          const iconInfo = GetIconInfo(newaction);
          const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
          const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);
          foundnode.data("image", svgpin_Url);
          foundnode.data("imageColor", iconInfo.iconBackgroundColor);
        }

        break;
      }
    }
  };

  // APPSELECT at top
  // appname & version
  // description
  // ACTION select
  const selectedNameChange = (event) => {
    event.target.value = event.target.value.replaceAll("(", "");
    event.target.value = event.target.value.replaceAll(")", "");
    event.target.value = event.target.value.replaceAll("]", "");
    event.target.value = event.target.value.replaceAll("[", "");
    event.target.value = event.target.value.replaceAll("{", "");
    event.target.value = event.target.value.replaceAll("}", "");
    event.target.value = event.target.value.replaceAll("*", "");
    event.target.value = event.target.value.replaceAll("!", "");
    event.target.value = event.target.value.replaceAll("@", "");
    event.target.value = event.target.value.replaceAll("#", "");
    event.target.value = event.target.value.replaceAll("$", "");
    event.target.value = event.target.value.replaceAll("%", "");
    event.target.value = event.target.value.replaceAll("&", "");
    event.target.value = event.target.value.replaceAll("#", "");
    event.target.value = event.target.value.replaceAll(".", "");
    event.target.value = event.target.value.replaceAll(",", "");
    event.target.value = event.target.value.replaceAll(" ", "_");

    selectedAction.label = event.target.value;
    setSelectedAction(selectedAction);
  };

	const actionDelayChange = (event) => {
		if (isNaN(event.target.value)) {
			console.log("NAN: ", event.target.value)
			return
		}

		const parsedNumber = parseInt(event.target.value)
		if (parsedNumber > 86400) {
			console.log("Max number is 1 day (86400)")
			return
		}

		selectedAction.execution_delay = parsedNumber
    setSelectedAction(selectedAction)
	}

  const selectedTriggerChange = (event) => {
    selectedTrigger.label = event.target.value;
    setSelectedTrigger(selectedTrigger);
  };

  // Starts on current node and climbs UP the tree to the root object.
  // Sends back everything in it's path
  const getParents = (action) => {
		if (action === undefined || action === null) {
			return []
		}

    var allkeys = [action.id];
    var handled = [];
    var results = [];

    // maxiter = max amount of parent nodes to loop
    // also handles breaks if there are issues
    var iterations = 0;
    var maxiter = 10;
    while (true) {
      for (var key in allkeys) {
        var currentnode = cy.getElementById(allkeys[key]);
        if (currentnode === undefined || currentnode === null) {
          continue;
        }

        if (currentnode.data() === undefined) {
          handled.push(allkeys[key]);
          results.push({ id: allkeys[key], type: "TRIGGER" });
        } else {
          if (handled.includes(currentnode.data().id)) {
            continue;
          } else {
            handled.push(currentnode.data().id);
            results.push(currentnode.data());
          }
        }

        // Get the name / label here too?
        if (currentnode.length === 0) {
          continue;
        }

        const incomingEdges = currentnode.incomers("edge");
        if (incomingEdges.length === 0) {
          continue;
        }

        for (var i = 0; i < incomingEdges.length; i++) {
          var tmp = incomingEdges[i];
					if (tmp.data("decorator")) {
						continue
					}

          if (!allkeys.includes(tmp.data("source"))) {
            allkeys.push(tmp.data("source"));
          }
        }
      }

      if (results.length === allkeys.length || iterations === maxiter) {
        break;
      }

      iterations += 1;
    }

    // Remove on the end as we don't want to remove everything
    results = results.filter((data) => data.id !== action.id);
    results = results.filter((data) => data.type === "ACTION" || data.app_name === "Shuffle Workflow" || data.app_name === "User Input");
    results.push({ label: "Execution Argument", type: "INTERNAL" });
    return results;
  };

  // BOLD name: type: required?
  // FORM
  // Dropdown -> static, action, local env, global env
  // VALUE (JSON)
  // {data.name}, {data.description}, {data.required}, {data.schema.type}

  //height: "100%",
  const appApiViewStyle = {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#1F2023",
    color: "white",
    paddingRight: 15,
    paddingLeft: 15,
    minHeight: "100%",
    zIndex: 1000,
    resize: "vertical",
    overflow: "auto",
  };

  var rightsidebarStyle = {
    position: "fixed",
    top: appBarSize + 25,
    right: 25,
    height: "80vh",
    width: isMobile ? "100%" : 365,
    minWidth: 200,
    maxWidth: 600,
    maxHeight: "100vh",
    border: "1px solid rgb(91, 96, 100)",
    zIndex: 1000,
    borderRadius: theme.palette.borderRadius,
    resize: "both",
    overflow: "auto",
  };

  const setTriggerFolderWrapperMulti = (event) => {
    const { options } = event.target;
    var value = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }

    if (selectedTrigger.parameters === null) {
      selectedTrigger.parameters = [[]];
      workflow.triggers[selectedTriggerIndex].parameters = [[]];
    }

		// Max 1 folder for office for some reason. MailFolders('MAILBOX_ID') in resource 
		// Can't parse URL with multiple folders.
		if (selectedTrigger.name === "Office365" & value !== undefined && value !== null && value.length > 1) {
			alert.info("Max 1 folder at a time allowed for Office365")
			console.log("VALUE: ", value)
			value = [value[0]]
		}

    // This is a dirty workaround for the static values in the go backend and datastore db
    const fixedValue = value.join(splitter);
    selectedTrigger.parameters[0] = {
      value: fixedValue,
      name: "outlookfolder",
    };
    workflow.triggers[selectedTriggerIndex].parameters[0] = {
      value: fixedValue,
      name: "outlookfolder",
    };

    // This resets state for some reason (:
    setSelectedAction({});
    setSelectedTrigger({});
    setSelectedApp({});
    setSelectedEdge({});

    // Set value
    setSelectedTrigger(selectedTrigger);
    setWorkflow(workflow);
  };

  const setTriggerCronWrapper = (value) => {
    if (selectedTrigger.parameters === null) {
      selectedTrigger.parameters = [];
    }

    workflow.triggers[selectedTriggerIndex].parameters[0] = {
      value: value,
      name: "cron",
    };
    setWorkflow(workflow);
  };

  const setTriggerOptionsWrapper = (value) => {
    if (selectedTrigger.parameters === null) {
      selectedTrigger.parameters = [];
    }

    const splitItems =
      workflow.triggers[selectedTriggerIndex].parameters[2].value.split(",");
    console.log(splitItems);
    if (splitItems.includes(value)) {
      for (var i = 0; i < splitItems.length; i++) {
        if (splitItems[i] === value) {
          splitItems.splice(i, 1);
        }
      }
    } else {
      splitItems.push(value);
    }

    for (var i = 0; i < splitItems.length; i++) {
      if (splitItems[i] === "") {
        splitItems.splice(i, 1);
      }
    }

    workflow.triggers[selectedTriggerIndex].parameters[2].value =
      splitItems.join(",");

    console.log(splitItems);
    setWorkflow(workflow);
    setLocalFirstrequest(!localFirstrequest);
  };

  const setTriggerTextInformationWrapper = (value) => {
    if (selectedTrigger.parameters === null) {
      selectedTrigger.parameters = [];
    }

    workflow.triggers[selectedTriggerIndex].parameters[0] = {
      value: value,
      name: "alertinfo",
    };
    setWorkflow(workflow);
  };

  const setTriggerBodyWrapper = (value) => {
    if (selectedTrigger.parameters === null) {
      selectedTrigger.parameters = [];
      workflow.triggers[selectedTriggerIndex].parameters[0] = {
        value: value,
        name: "cron",
      };
    }

    workflow.triggers[selectedTriggerIndex].parameters[1] = {
      value: value,
      name: "execution_argument",
    };
    setWorkflow(workflow);
  };

  const AppConditionHandler = (props) => {
    const { tmpdata, type } = props;
    const [data] = useState(tmpdata);
    const [multiline, setMultiline] = useState(false);
    const [showAutocomplete, setShowAutocomplete] = React.useState(false);
    const [actionlist, setActionlist] = React.useState([]);

    if (tmpdata === undefined) {
      return tmpdata;
    }

    if (data.variant === "") {
      data.variant = "STATIC_VALUE";
    }

    // Set actions based on NEXT node, since it should be able to involve those two
    if (actionlist.length === 0) {
      // FIXME: Have previous execution values in here
      actionlist.push({
        type: "Execution Argument",
        name: "Execution Argument",
        value: "$exec",
        highlight: "exec",
        autocomplete: "exec",
        example: "tmp",
      })
      actionlist.push({
        type: "Shuffle DB",
        name: "Shuffle DB",
        value: "$shuffle_cache",
        highlight: "shuffle_cache",
        autocomplete: "shuffle_cache",
        example: "tmp",
      })

      if (
        workflow.workflow_variables !== null &&
        workflow.workflow_variables !== undefined &&
        workflow.workflow_variables.length > 0
      ) {
        for (var key in workflow.workflow_variables) {
          const item = workflow.workflow_variables[key];
          actionlist.push({
            type: "workflow_variable",
            name: item.name,
            value: item.value,
            id: item.id,
            autocomplete: `${item.name.split(" ").join("_")}`,
            example: item.value,
          });
        }
      }

      // FIXME: Add values from previous executions if they exist
      if (
        workflow.execution_variables !== null &&
        workflow.execution_variables !== undefined &&
        workflow.execution_variables.length > 0
      ) {
        for (var key in workflow.execution_variables) {
          const item = workflow.execution_variables[key];
          actionlist.push({
            type: "execution_variable",
            name: item.name,
            value: item.value,
            id: item.id,
            autocomplete: `${item.name.split(" ").join("_")}`,
            example: "",
          });
        }
      }

      const destAction = cy.getElementById(selectedEdge.target);
      var parents = getParents(destAction.data());
      if (parents.length > 1) {
        for (var key in parents) {
          const item = parents[key];
          if (item.label === "Execution Argument") {
            continue;
          }

          // 1. Take
          const actionvalue = {
            type: "action",
            id: item.id,
            name: item.label,
            autocomplete: `${item.label.split(" ").join("_")}`,
            example: item.example === undefined ? "" : item.example,
          };
          actionlist.push(actionvalue);
        }
      }

      setActionlist(actionlist);
    }

    if (
      data.multiline !== undefined &&
      data.multiline !== null &&
      data.multiline === true
    ) {
      setMultiline(true);
    }

    var placeholder = "Static value";
    if (
      data.example !== undefined &&
      data.example !== null &&
      data.example.length > 0
    ) {
      placeholder = data.example;
    }

    var datafield = (
      <TextField
        style={{
          backgroundColor: inputColor,
          borderRadius: theme.palette.borderRadius,
        }}
        InputProps={{
          style: {
            color: "white",
            minHeight: 50,
            marginLeft: "5px",
            maxWidth: "95%",
            fontSize: "1em",
          },
        }}
        fullWidth
        multiline={multiline}
        color="primary"
        defaultValue={data.value}
        placeholder={placeholder}
        helperText={
          data.value !== undefined &&
          data.value !== null &&
          data.value.includes(".#") ? (
            <span style={{ color: "white", marginBottom: 5, marginleft: 5 }}>
              Use "Shuffle Tools" app with "Filter List" action to handle loops
            </span>
          ) : null
        }
        onBlur={(e) => {
          changeActionVariable(data.action_field, e.target.value);
          setUpdate(Math.random());
        }}
      />
    );

    const changeActionVariable = (variable, value) => {
      // set the name
      data.value = value;
      data.action_field = variable;

      if (type === "source") {
        setSourceValue(data);
      } else if (type === "destination") {
        setDestinationValue(data);
      }
    };

    return (
      <div>
        <div
          style={{ marginTop: "20px", marginBottom: "7px", display: "flex" }}
        >
          <div
            style={{
              width: "17px",
              height: "17px",
              borderRadius: 17 / 2,
              backgroundColor: "#f85a3e",
              marginRight: "10px",
            }}
          />
          <div style={{ flex: "10" }}>
            <b>{data.name} </b>
          </div>
        </div>
        {datafield}
        {actionlist.length === 0 ? null : (
          <FormControl fullWidth>
            <InputLabel
              id="action-autocompleter"
              style={{ marginLeft: 10, color: "white" }}
            >
              Autocomplete
            </InputLabel>
            <Select
							MenuProps={{
								disableScrollLock: true,
							}}
              labelId="action-autocompleter"
              SelectDisplayProps={{
                style: {
                  marginLeft: 10,
                },
              }}
              onClose={() => {
                setShowAutocomplete(false);

                setUpdate(Math.random());
              }}
              onClick={() => {
                setShowAutocomplete(true);
              }}
              open={showAutocomplete}
              fullWidth
              style={{
                borderBottom: `1px solid #f85a3e`,
                color: "white",
                height: 50,
                marginTop: 2,
              }}
              onChange={(e) => {
                const autocomplete = e.target.value.autocomplete;
                const newValue = autocomplete.startsWith("$")
                  ? data.value + autocomplete
                  : `${data.value}$${autocomplete}`;
                changeActionVariable(data.action_field, newValue);
              }}
            >
              {actionlist.map((data) => {
                const icon =
                  data.type === "action" ? (
                    <AppsIcon style={{ marginRight: 10 }} />
                  ) : data.type === "workflow_variable" ||
                    data.type === "execution_variable" ? (
                    <FavoriteBorderIcon style={{ marginRight: 10 }} />
                  ) : (
                    <ScheduleIcon style={{ marginRight: 10 }} />
                  );

                const handleExecArgumentHover = (inside) => {
                  var exec_text_field = document.getElementById(
                    "execution_argument_input_field"
                  );
                  if (exec_text_field !== null) {
                    if (inside) {
                      exec_text_field.style.border = "2px solid #f85a3e";
                    } else {
                      exec_text_field.style.border = "";
                    }
                  }

                  // Also doing arguments
                  if (
                    workflow.triggers !== undefined &&
                    workflow.triggers !== null &&
                    workflow.triggers.length > 0
                  ) {
                    for (var key in workflow.triggers) {
                      const item = workflow.triggers[key];

                      var node = cy.getElementById(item.id);
                      if (node.length > 0) {
                        if (inside) {
                          node.addClass("shuffle-hover-highlight");
                        } else {
                          node.removeClass("shuffle-hover-highlight");
                        }
                      }
                    }
                  }
                };

                const handleActionHover = (inside, actionId) => {
                  var node = cy.getElementById(actionId);
                  if (node.length > 0) {
                    if (inside) {
                      node.addClass("shuffle-hover-highlight");
                    } else {
                      node.removeClass("shuffle-hover-highlight");
                    }
                  }
                };

                return (
                  <MenuItem
                    key={data.name}
                    style={{ backgroundColor: inputColor, color: "white" }}
                    value={data}
                    onMouseOver={() => {
                      if (data.type === "Execution Argument") {
                        handleExecArgumentHover(true);
                      } else if (data.type === "action") {
                        handleActionHover(true, data.id);
                      }
                    }}
                    onMouseOut={() => {
                      if (data.type === "Execution Argument") {
                        handleExecArgumentHover(false);
                      } else if (data.type === "action") {
                        handleActionHover(false, data.id);
                      }
                    }}
                  >
                    <Tooltip
                      color="primary"
                      title={`Value: ${data.value}`}
                      placement="left"
                    >
                      <div style={{ display: "flex" }}>
                        {icon} {data.name}
                      </div>
                    </Tooltip>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}
      </div>
    );
  };

  const menuItemStyle = {
    color: "white",
    backgroundColor: inputColor,
  };

  const conditionsModal = (
    <Dialog
      PaperComponent={PaperComponent}
      disableEnforceFocus={true}
      hideBackdrop={true}
			disableBackdropClick={true}
      style={{ pointerEvents: "none" }}
      PaperComponent={PaperComponent}
			aria-labelledby="draggable-dialog-title"
      open={conditionsModalOpen}
      PaperProps={{
        style: {
          pointerEvents: "auto",
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: isMobile ? "90%" : 800,
					border: theme.palette.defaultBorder,
        },
      }}
      onClose={() => {
      }}
    >
      <span
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        Conditions can't be used for loops [ .# ]{" "}
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://shuffler.io/docs/workflows#conditions"
          style={{ textDecoration: "none", color: "#f85a3e" }}
        >
          Learn more
        </a>
      </span>
      <FormControl>
    		<DialogTitle id="draggable-dialog-title" style={{cursor: "move",}}>
          <span style={{ color: "white" }}>Condition</span>
        </DialogTitle>
        <DialogContent style={{}}>
          <div style={{ display: "flex" }}>
            <Tooltip
              color="primary"
              title={conditionValue.configuration ? "Negated" : "Default"}
              placement="top"
            >
              <span
                style={{
                  margin: "auto",
                  height: 50,
                  marginBottom: "auto",
                  marginTop: "auto",
                  marginRight: 5,
                }}
              >
                <Button
                  color="primary"
                  variant={
                    conditionValue.configuration ? "contained" : "outlined"
                  }
                  style={{
                    margin: "auto",
                    height: 50,
                    marginBottom: "auto",
                    marginTop: "auto",
                    marginRight: 5,
                  }}
                  onClick={(e) => {
                    conditionValue.configuration =
                      !conditionValue.configuration;
                    setConditionValue(conditionValue);
                    setUpdate(Math.random());
                  }}
                >
                  {conditionValue.configuration ? "!" : "="}
                </Button>
              </span>
            </Tooltip>
            <div style={{ flex: "2" }}>
              <AppConditionHandler
                tmpdata={sourceValue}
                setData={setSourceValue}
                type={"source"}
              />
            </div>
            <div
              style={{
                flex: "1",
                margin: "auto",
                marginBottom: 0,
                marginLeft: 5,
                marginRight: 5,
              }}
            >
              <Button
                color="primary"
                variant="outlined"
                style={{ margin: "auto", height: 50, marginBottom: 50 }}
                fullWidth
                aria-haspopup="true"
                onClick={(e) => {
                  setVariableAnchorEl(e.currentTarget);
                }}
              >
                {conditionValue.value}
              </Button>
              <Menu
                id="simple-menu"
                keepMounted
                open={Boolean(variableAnchorEl)}
                anchorEl={variableAnchorEl}
                PaperProps={{
                  style: {
                    backgroundColor: surfaceColor,
                  },
                }}
                onClose={() => {
                  setVariableAnchorEl(null);
                }}
              >
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "equals";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"equals"}
                >
                  equals
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "does not equal";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"does not equal"}
                >
                  does not equal
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "startswith";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"starts with"}
                >
                  starts with
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "endswith";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"ends with"}
                >
                  ends with
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "contains";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"contains"}
                >
                  contains
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "contains_any_of";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"contains_any_of"}
                >
                  contains any of
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "matches regex";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"matches regex"}
                >
                  matches regex
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "larger than";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"larger than"}
                >
                  larger than
                </MenuItem>
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "less than";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"less than"}
                >
                  less than
                </MenuItem>
              </Menu>
            </div>
            <div style={{ flex: "2" }}>
              <AppConditionHandler
                tmpdata={destinationValue}
                setData={setDestinationValue}
                type={"destination"}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
					<Button
            style={{ borderRadius: "0px" }}
						variant="text"
            onClick={() => {
        			setConditionsModalOpen(false);
        			setSourceValue({});
        			setConditionValue({});
        			setDestinationValue({});
            }}
            color="secondary"
          >
           	Cancel 
          </Button>
          <Button
            style={{ borderRadius: "0px" }}
						variant="contained"
            onClick={() => {
              setSelectedEdge({});

              var data = {
                condition: conditionValue,
                source: sourceValue,
                destination: destinationValue,
              };

              setConditionsModalOpen(false);
              if (selectedEdge.conditions === undefined) {
                selectedEdge.conditions = [data];
              } else {
                const curedgeindex = selectedEdge.conditions.findIndex(
                  (data) => data.source.id === sourceValue.id
                );
                if (curedgeindex < 0) {
                  selectedEdge.conditions.push(data);
                } else {
                  selectedEdge.conditions[curedgeindex] = data;
                }
              }

              var label = "";
              if (selectedEdge.conditions.length === 1) {
                label = selectedEdge.conditions.length + " condition";
              } else if (selectedEdge.conditions.length > 1) {
                label = selectedEdge.conditions.length + " conditions";
              }

              var currentedge = cy.getElementById(selectedEdge.id);
              if (currentedge !== undefined && currentedge !== null) {
                currentedge.data().label = label;
              }

              setSelectedEdge(selectedEdge);
              workflow.branches[selectedEdgeIndex] = selectedEdge;
              setWorkflow(workflow);
            }}
            color="primary"
          >
            Submit
          </Button>
        </DialogActions>
      </FormControl>
    </Dialog>
  );

  const EdgeSidebar = () => {
    const ConditionHandler = (condition, index) => {
      const [open, setOpen] = React.useState(false);
      const [anchorEl, setAnchorEl] = React.useState(null);

      const duplicateCondition = (conditionIndex) => {
        var newEdge = JSON.parse(
          JSON.stringify(selectedEdge.conditions[conditionIndex])
        );
        const newUuid = uuidv4();
        newEdge.condition.id = newUuid;
        newEdge.source.id = newUuid;
        newEdge.destination.id = newUuid;
        selectedEdge.conditions.push(newEdge);

        setUpdate(Math.random());
      };

      const deleteCondition = (conditionIndex) => {
        console.log(selectedEdge);
        if (selectedEdge.conditions.length === 1) {
          selectedEdge.conditions = [];
        } else {
          selectedEdge.conditions.splice(conditionIndex, 1);
        }

        setSelectedEdge(selectedEdge);
        setOpen(false);
        setUpdate(Math.random());
      };

      const paperVariableStyle = {
        minHeight: 75,
        maxHeight: 75,
        minWidth: "100%",
        maxWidth: "100%",
        marginTop: "5px",
        color: "white",
        backgroundColor: surfaceColor,
        cursor: "pointer",
        display: "flex",
      };

      const menuClick = (event) => {
        console.log("MENU CLICK");
        setOpen(!open);
        setAnchorEl(event.currentTarget);
      };

      return (
        <Paper
          key={condition.condition.id}
          square
          style={paperVariableStyle}
          onClick={() => {}}
        >
          <div
            style={{
              marginLeft: "10px",
              marginTop: "5px",
              marginBottom: "5px",
              width: "2px",
              backgroundColor: yellow,
              marginRight: "5px",
            }}
          />
          <div style={{ display: "flex", width: "100%" }}>
            <div
              style={{ flex: "10", display: "flex" }}
              onClick={() => {
                setSourceValue(condition.source);
                setConditionValue(condition.condition);
                setDestinationValue(condition.destination);
                setConditionsModalOpen(true);
              }}
            >
              <div
                style={{
                  flex: 1,
                  textAlign: "left",
                  marginTop: "15px",
                  marginLeft: "10px",
                  overflow: "hidden",
                  maxWidth: 72,
                }}
              >
                {condition.source.value}
              </div>
              <Divider
                style={{
                  height: "100%",
                  width: "1px",
                  marginLeft: "5px",
                  marginRight: "5px",
                  backgroundColor: "rgb(91, 96, 100)",
                }}
              />
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  marginTop: "15px",
                  overflow: "hidden",
                  maxWidth: 72,
                }}
                onClick={() => {}}
              >
                {condition.condition.value}
              </div>
              <Divider
                style={{
                  height: "100%",
                  width: "1px",
                  marginLeft: "5px",
                  marginRight: "5px",
                  backgroundColor: "rgb(91, 96, 100)",
                }}
              />
              <div
                style={{
                  flex: 1,
                  textAlign: "left",
                  marginTop: "auto",
                  marginBottom: "auto",
                  marginLeft: "10px",
                  overflow: "hidden",
                  maxWidth: 72,
                }}
              >
                {condition.destination.value}
              </div>
            </div>
            <div style={{ flex: "1", marginLeft: "0px" }}>
              <IconButton
                aria-label="more"
                aria-controls="long-menu"
                aria-haspopup="true"
                onClick={menuClick}
                style={{ color: "white" }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                id="long-menu"
                anchorEl={anchorEl}
                keepMounted
                open={open}
                PaperProps={{
                  style: {
                    backgroundColor: surfaceColor,
                  },
                }}
                onClose={() => {
                  setOpen(false);
                  setAnchorEl(null);
                }}
              >
                <MenuItem
                  style={{ backgroundColor: inputColor, color: "white" }}
                  onClick={() => {
                    duplicateCondition(index);
                  }}
                  key={"Duplicate"}
                >
                  {"Duplicate"}
                </MenuItem>
                <MenuItem
                  style={{ backgroundColor: inputColor, color: "white" }}
                  onClick={() => {
                    setOpen(false);
                    deleteCondition(index);
                  }}
                  key={"Delete"}
                >
                  {"Delete"}
                </MenuItem>
              </Menu>
            </div>
          </div>
        </Paper>
      );
    };

    var injectedData = <div></div>;

    if (
      selectedEdge.conditions !== undefined &&
      selectedEdge.conditions !== null &&
      selectedEdge.conditions.length > 0
    ) {
      injectedData = selectedEdge.conditions.map((condition, index) => {
        return ConditionHandler(condition, index);
      });
    }

    // FIXME - remove index
    const conditionId = uuidv4();
    return (
      <div style={appApiViewStyle}>
        <div style={{ display: "flex", height: "40px", marginBottom: "30px" }}>
          <div style={{ flex: "1" }}>
            <h3 style={{ marginBottom: "5px" }}>
              Branch: Conditions - {selectedEdgeIndex}
            </h3>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://shuffler.io/docs/workflows#conditions"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              What are conditions?
            </a>
          </div>
        </div>
        <Divider
          style={{
            marginBottom: "10px",
            marginTop: "10px",
            height: "1px",
            width: "100%",
            backgroundColor: "rgb(91, 96, 100)",
          }}
        />
        <div>Conditions</div>
        {injectedData}

        <Button
          style={{ margin: "auto", marginTop: "10px" }}
          color="primary"
          variant="outlined"
          onClick={() => {
						if (conditionsModalOpen) {
							return
						}

            setSourceValue({
              name: "source",
              value: "",
              variant: "STATIC_VALUE",
              action_field: "",
              id: conditionId,
            });
            setConditionValue({
              name: "condition",
              value: "equals",
              id: conditionId,
            });
            setDestinationValue({
              name: "destination",
              value: "",
              variant: "STATIC_VALUE",
              action_field: "",
              id: conditionId,
            });

            setConditionsModalOpen(true);
          }}
          fullWidth
        >
          New condition
        </Button>
      </div>
    );
  };

  // 1. GET the trigger authentication data
  // 2. Parse the fields that are used (outlook & gmail)
  // 3. Parse the folders that are selected
  // 4. Start / stop
  const EmailSidebar = () => {
    if (Object.getOwnPropertyNames(selectedTrigger).length === 0) {
      return null;
    }

    if (workflow.triggers[selectedTriggerIndex] === undefined) {
      return null;
    }

    if (
      workflow.triggers[selectedTriggerIndex].parameters === undefined ||
      workflow.triggers[selectedTriggerIndex].parameters === null ||
      workflow.triggers[selectedTriggerIndex].parameters.length === 0
    ) {
      workflow.triggers[selectedTriggerIndex].parameters = [
        { value: "No folders selected yet", name: "outlookfolder" },
      ];
      selectedTrigger.parameters = [
        { value: "No folders selected yet", name: "outlookfolder" },
      ];
      setWorkflow(workflow);
      setSelectedTrigger(selectedTrigger);
    }

    const setGmailFolders = () => {
      console.log("In set gmail folders");
      fetch(
        globalUrl +
          "/api/v1/triggers/gmail/getFolders?trigger_id=" +
          selectedTrigger.id,
        {
          method: "GET",
          headers: { "content-type": "application/json" },
          credentials: "include",
        }
      )
        .then((response) => {
          if (response.status !== 200) {
            throw new Error("No folders :o!");
          }

          return response.json();
        })
        .then((responseJson) => {
          if (
            responseJson !== undefined &&
            responseJson !== null &&
            responseJson.success !== false &&
            responseJson.length > 0
          ) {
            setTriggerFolders(responseJson);
          }

          if (
            workflow.triggers[selectedTriggerIndex].parameters.length === 0 &&
            responseJson.length > 0
          ) {
            workflow.triggers[selectedTriggerIndex].parameters = [
              {
                value: responseJson[0].displayName,
                name: "outlookfolder",
                id: responseJson[0].id,
              },
            ];
            selectedTrigger.parameters = [
              {
                value: responseJson[0].displayName,
                name: "outlookfolder",
                id: responseJson[0].id,
              },
            ];
            setWorkflow(workflow);
            setSelectedTrigger(selectedTrigger);
          }
        })
        .catch((error) => {
          console.log(error.toString());
        });
    };

    const setOutlookFolders = () => {
      fetch(
        globalUrl +
          "/api/v1/triggers/outlook/getFolders?trigger_id=" +
          selectedTrigger.id,
        {
          method: "GET",
          headers: { "content-type": "application/json" },
          credentials: "include",
        }
      )
        .then((response) => {
          if (response.status !== 200) {
            throw new Error("No folders :o!");
          }

          return response.json();
        })
        .then((responseJson) => {
          if (
            responseJson !== null &&
            responseJson.success !== false &&
            responseJson.length > 0
          ) {
            setTriggerFolders(responseJson);
          }

          if (
            workflow.triggers[selectedTriggerIndex].parameters.length === 0 &&
            responseJson.length > 0
          ) {
            workflow.triggers[selectedTriggerIndex].parameters = [
              {
                value: responseJson[0].displayName,
                name: "outlookfolder",
                id: responseJson[0].id,
              },
            ];
            selectedTrigger.parameters = [
              {
                value: responseJson[0].displayName,
                name: "outlookfolder",
                id: responseJson[0].id,
              },
            ];
            setWorkflow(workflow);
            setSelectedTrigger(selectedTrigger);
          }
        })
        .catch((error) => {
          console.log(error.toString());
        });
    };

    const getTriggerAuth = () => {
      fetch(globalUrl + "/api/v1/triggers/outlook/" + selectedTrigger.id, {
        method: "GET",
        headers: { "content-type": "application/json" },
        credentials: "include",
      })
        .then((response) => {
          if (response.status !== 200) {
            throw new Error("No trigger info :o!");
          }

          return response.json();
        })
        .then((responseJson) => {
          setTriggerAuthentication(responseJson);
        })
        .catch((error) => {
          console.log(error.toString());
        });
    };

    // Getting the triggers and the folders if they exist
    // This is horrible hahah
    if (localFirstrequest) {
      getTriggerAuth();
      setOutlookFolders();
      setGmailFolders();
      setLocalFirstrequest(false);
    }

    const gmailButton =
      selectedTrigger.name !== "Gmail" ? null : (
        <Button
          fullWidth
          variant="contained"
          style={{
            flex: 1,
            textTransform: "none",
            textAlign: "left",
            justifyContent: "flex-start",
            marginTop: 10,
            padding: 0,
            backgroundColor: "#4285f4",
            color: "white",
          }}
          color="primary"
          onClick={() => {
            console.log("HOST: ", window.location.host);
            console.log("HOST: ", window.location);
            const redirectUri = isCloud
              ? window.location.host === "localhost:3002"
                ? "http%3A%2F%2Flocalhost:5002%2Fapi%2Fv1%2Ftriggers%2Fgmail%2Fregister"
                : "https%3A%2F%2Fshuffler.io%2Fapi%2Fv1%2Ftriggers%2Fgmail%2Fregister"
              : window.location.protocol === "http:" ? 
								`http%3A%2F%2F${window.location.host}%2Fapi%2Fv1%2Ftriggers%2Fgmail%2Fregister`
								:
								`https%3A%2F%2F${window.location.host}%2Fapi%2Fv1%2Ftriggers%2Fgmail%2Fregister`

            const client_id =
              "253565968129-c0a35knic7q1pdk6i6qk9gdkvr07ci49.apps.googleusercontent.com";
            const username = userdata.id;
            console.log(redirectUri);
            console.log("USER: ", username, userdata);

            const branch = workflow.branches.find(
              (branch) => branch.source_id === selectedTrigger.id
            );
            if (branch === undefined || branch === null) {
              alert.error(
                "No startnode connected to node. Connect it to an action."
              );
              return;
            }

            console.log("BRANCH: ", branch);
            const startnode = branch.destination_id;
            const scopes = "https://www.googleapis.com/auth/gmail.readonly";
            const url = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=workflow_id%3D${props.match.params.key}%26trigger_id%3D${selectedTrigger.id}%26username%3D${username}%26type%3Dgmail%26start%3d${startnode}`;
            console.log("URL: ", url);

            var newwin = window.open(url, "", "width=800,height=600");

            // Check whether we got a callback somewhere
            var id = setInterval(function () {
              fetch(
                globalUrl + "/api/v1/triggers/gmail/" + selectedTrigger.id,
                {
                  method: "GET",
                  headers: { "content-type": "application/json" },
                  credentials: "include",
                }
              )
                .then((response) => {
                  if (response.status !== 200) {
                    throw new Error("No trigger info :o!");
                  }

                  return response.json();
                })
                .then((responseJson) => {
                  //console.log("RESPONSE: ");
                  setTriggerAuthentication(responseJson);
                  clearInterval(id);
                  newwin.close();
                  setGmailFolders();
                })
                .catch((error) => {
                  console.log(error.toString());
                });
            }, 2500);

            saveWorkflow(workflow);
          }}
        >
          <img
            alt=""
            style={{ margin: 0 }}
            src="/images/btn_google_light_focus_ios.svg"
          />
          <Typography style={{ margin: 0, marginLeft: 10 }} variant="body1">
            Sign in with Google
          </Typography>
        </Button>
      );

    const outlookButton =
      selectedTrigger.name !== "Office365" ? null : (
        <Button
          fullWidth
          variant="contained"
          style={{
            flex: 1,
            textTransform: "none",
            textAlign: "left",
            justifyContent: "flex-start",
            marginTop: 10,
            backgroundColor: "#2f2f2f",
            color: "white",
						padding: "5px 5px 5px 10px", 
          }}
          color="primary"
          onClick={() => {
						console.log(window.location)
            const redirectUri = isCloud
              ? window.location.host === "localhost:3002"
                ? "http%3A%2F%2Flocalhost:5002%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister"
                : "https%3A%2F%2Fshuffler.io%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister"
              : window.location.protocol === "http:" ? 
								`http%3A%2F%2F${window.location.host}%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister`
								:
								`https%3A%2F%2F${window.location.host}%2Fapi%2Fv1%2Ftriggers%2Foutlook%2Fregister`

            //const client_id = "fd55c175-aa30-4fa6-b303-09a29fb3f750"
            const client_id = "bb4bff85-0d0b-4f5d-8a69-3cee8029b11a";

            const username = userdata.id;
            console.log(redirectUri);
            console.log("USER: ", username, userdata);

            const branch = workflow.branches.find(
              (branch) => branch.source_id === selectedTrigger.id
            );
            if (branch === undefined || branch === null) {
              alert.error(
                "No startnode connected to node. Connect it to an action."
              );
              return;
            }

            console.log("BRANCH: ", branch);
            const startnode = branch.destination_id;
            const url = `https://login.microsoftonline.com/common/oauth2/authorize?access_type=offline&client_id=${client_id}&redirect_uri=${redirectUri}&resource=https%3A%2F%2Fgraph.microsoft.com&response_type=code&scope=Mail.Read+User.Read+https%3A%2F%2Foutlook.office.com%2Fmail.read&prompt=login&state=workflow_id%3D${props.match.params.key}%26trigger_id%3D${selectedTrigger.id}%26username%3D${username}%26type%3Doutlook%26start%3d${startnode}`;
            //const url = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=workflow_id%3D${props.match.params.key}%26trigger_id%3D${selectedTrigger.id}%26username%3D${username}%26type%3Dgmail%26start%3d${startnode}`

            //const scopes = "https://www.googleapis.com/auth/gmail.readonly"
            //const url = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=workflow_id%3D${props.match.params.key}%26trigger_id%3D${selectedTrigger.id}%26username%3D${username}%26type%3Dgmail%26start%3d${startnode}`

            console.log("URL: ", url);

            var newwin = window.open(url, "", "width=800,height=600");

            // Check whether we got a callback somewhere
            var id = setInterval(function () {
              fetch(
                globalUrl + "/api/v1/triggers/outlook/" + selectedTrigger.id,
                {
                  method: "GET",
                  headers: { "content-type": "application/json" },
                  credentials: "include",
                }
              )
                .then((response) => {
                  if (response.status !== 200) {
                    throw new Error("No trigger info :o!");
                  }

                  return response.json();
                })
                .then((responseJson) => {
                  setTriggerAuthentication(responseJson);
                  clearInterval(id);
                  newwin.close();
                  setOutlookFolders();
                })
                .catch((error) => {
                  console.log(error.toString());
                });
            }, 2500);

            saveWorkflow(workflow);
          }}
        >
          <img
            alt=""
            style={{ margin: 0 }}
            src="/images/ms_symbol_dark.svg"
          />
          <Typography style={{ margin: 0, marginLeft: 10 }} variant="body1">
          	Sign in with Microsoft 
          </Typography>
        </Button>
      );

    // FIXME - set everything in here to multifolder etc
    var triggerInfo = "SET UP BUT NO TYPE :)";
    if (Object.getOwnPropertyNames(triggerAuthentication).length > 0) {
      // Should get the folders if they don't already exist

      if (
        triggerAuthentication.type === "outlook" ||
        triggerAuthentication.type === "gmail"
      ) {
        triggerInfo = (
          <div>
            {selectedTrigger.status === "running" ? null : (
              <span>
                <div
                  style={{ marginTop: 20, marginBottom: 7, display: "flex" }}
                >
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 17 / 2,
                      backgroundColor: "#f85a3e",
                      marginRight: 10,
                    }}
                  />
                  <div style={{ flex: "10" }}>
                    <b>Change auth </b>
                  </div>
                </div>
                {outlookButton}
                {gmailButton}
								<Typography variant="body2" color="textSecondary" style={{marginTop: 5}}>
									If you have trouble using this trigger, please <a href="https://shuffler.io/contact" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>contact us</a> to get access
								</Typography>
              </span>
            )}

            {triggerFolders === undefined || triggerFolders === null ? null : (
              <span>
                <div
                  style={{
                    marginTop: "20px",
                    marginBottom: "7px",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: "17px",
                      height: "17px",
                      borderRadius: 17 / 2,
                      backgroundColor: "#f85a3e",
                      marginRight: "10px",
                    }}
                  />
                  <div style={{ flex: "10" }}>
                    <b>Select {triggerAuthentication.type === "gmail" ? "labels" : "folders"} (CTRL+click)</b>
                  </div>
                </div>
                <Select
									MenuProps={{
										disableScrollLock: true,
									}}
                  multiple
                  native
                  rows="10"
                  value={selectedTrigger.parameters[0].value.split(splitter)}
                  style={{ backgroundColor: inputColor, color: "white" }}
                  disabled={selectedTrigger.status === "running"}
                  SelectDisplayProps={{
                    style: {
                      marginLeft: 10,
                    },
                  }}
                  onChange={(e) => {
                    setTriggerFolderWrapperMulti(e)
                  }}
                  fullWidth
                  input={<Input id="select-multiple-native" />}
                  key={selectedTrigger}
                >
                  {triggerFolders.map((folder) => {
                    var folderItem = (
                      <option
                        key={folder.displayName}
                        style={{
                          backgroundColor: inputColor,
                          fontSize: "1.2em",
                        }}
                        value={folder.displayName}
                      >
                        {folder.displayName}
                      </option>
                    );

                    if (folder.childFolderCount > 0) {
                      // Here to handle subfolders sometime later
                      folderItem = (
                        <option
                          key={folder.displayName}
                          value={folder.displayName}
                          style={{ marginLeft: "10px" }}
                        >
                          {folder.displayName}
                        </option>
                      );
                    }

                    return folderItem;
                  })}
                </Select>
              </span>
            )}
          </div>
        );
      } else if (triggerAuthentication.type === "gmail") {
        console.log("AUTH: ", triggerAuthentication);
        triggerInfo = "SPECIAL GMAIL";
      }
    }

    // Check
    const argumentView =
      Object.getOwnPropertyNames(triggerAuthentication).length > 0 ? (
        <div>{triggerInfo}</div>
      ) : (
        <div>
          <div
            style={{ marginTop: "20px", marginBottom: "7px", display: "flex" }}
          >
            <div
              style={{
                width: "17px",
                height: "17px",
                borderRadius: 17 / 2,
                backgroundColor: "#f85a3e",
                marginRight: "10px",
              }}
            />
            <div style={{ flex: "10" }}>
              <b>Login</b>
            </div>
          </div>
          {outlookButton}
          {gmailButton}
        </div>
      );

    return (
      <div style={appApiViewStyle}>
        <div style={{ display: "flex", height: "40px", marginBottom: "30px" }}>
          <div style={{ flex: "1" }}>
            <h3 style={{ marginBottom: "5px" }}>
              {selectedTrigger.app_name}: {selectedTrigger.status}
            </h3>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://shuffler.io/docs/triggers#email"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              What are email triggers?
            </a>
          </div>
        </div>
        <Divider
          style={{
            marginBottom: "10px",
            marginTop: "10px",
            height: "1px",
            width: "100%",
            backgroundColor: "rgb(91, 96, 100)",
          }}
        />
        <div>Name</div>
        <TextField
          style={{
            backgroundColor: inputColor,
            borderRadius: theme.palette.borderRadius,
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
          placeholder={selectedTrigger.label}
          onChange={selectedTriggerChange}
        />

        <div style={{ marginTop: "20px" }}>
          Environment:
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette.borderRadius,
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
            required
            disabled
            fullWidth
            color="primary"
            value={selectedTrigger.environment}
          />
        </div>
        <Divider
          style={{
            marginTop: "20px",
            height: "1px",
            width: "100%",
            backgroundColor: "rgb(91, 96, 100)",
          }}
        />
        {argumentView}
        <div style={{ flex: "6", marginTop: "20px" }}>
          <div>
            <Divider
              style={{
                marginTop: "20px",
                height: "1px",
                width: "100%",
                backgroundColor: "rgb(91, 96, 100)",
              }}
            />
            <div
              style={{
                marginTop: "20px",
                marginBottom: "7px",
                display: "flex",
              }}
            >
              <Button
                variant="contained"
                style={{ flex: "1" }}
                disabled={
                  selectedTrigger.status === "running" ||
                  triggerFolders === undefined ||
                  triggerFolders === null ||
                  triggerFolders.length === 0
                }
                onClick={() => {
                  startMailSub(selectedTrigger, selectedTriggerIndex);
                }}
                color="primary"
              >
                Start
              </Button>
              <Button
                variant="outlined"
                style={{ flex: "1" }}
                disabled={selectedTrigger.status !== "running"}
                onClick={() => {
                  stopMailSub(selectedTrigger, selectedTriggerIndex);
                }}
                color="primary"
              >
                Stop
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SubflowSidebar = () => {
    const [menuPosition, setMenuPosition] = useState(null);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [actionlist, setActionlist] = React.useState([]);

    if (actionlist.length === 0) {
      // FIXME: Have previous execution values in here
      actionlist.push({
        type: "Execution Argument",
        name: "Execution Argument",
        value: "$exec",
        highlight: "exec",
        autocomplete: "exec",
        example: "hello",
      })
      actionlist.push({
        type: "Shuffle Database",
        name: "Shuffle Database",
        value: "$shuffle_cache",
        highlight: "shuffle_db",
        autocomplete: "shuffle_cache",
        example: "hello",
      })
      if (
        workflow.workflow_variables !== null &&
        workflow.workflow_variables !== undefined &&
        workflow.workflow_variables.length > 0
      ) {
        for (var key in workflow.workflow_variables) {
          const item = workflow.workflow_variables[key];
          actionlist.push({
            type: "workflow_variable",
            name: item.name,
            value: item.value,
            id: item.id,
            autocomplete: `${item.name.split(" ").join("_")}`,
            example: item.value,
          });
        }
      }

      // FIXME: Add values from previous executions if they exist
      if (
        workflow.execution_variables !== null &&
        workflow.execution_variables !== undefined &&
        workflow.execution_variables.length > 0
      ) {
        for (var key in workflow.execution_variables) {
          const item = workflow.execution_variables[key];
          actionlist.push({
            type: "execution_variable",
            name: item.name,
            value: item.value,
            id: item.id,
            autocomplete: `${item.name.split(" ").join("_")}`,
            example: "",
          });
        }
      }

      var parents = getParents(selectedTrigger);
      if (parents.length > 1) {
        for (var key in parents) {
          const item = parents[key];
          if (item.label === "Execution Argument") {
            continue;
          }

          var exampledata = item.example === undefined ? "" : item.example;
          // Find previous execution and their variables
          if (workflowExecutions.length > 0) {
            // Look for the ID
            for (var key in workflowExecutions) {
              if (
                workflowExecutions[key].results === undefined ||
                workflowExecutions[key].results === null
              ) {
                continue;
              }

              var foundResult = workflowExecutions[key].results.find(
                (result) => result.action.id === item.id
              );
              if (foundResult === undefined) {
                continue;
              }

							const validated = validateJson(foundResult.result) 
							if (validated.valid) {
								exampledata = validateJson.result
								break
							}
            }
          }

          // 1. Take
          const actionvalue = {
            type: "action",
            id: item.id,
            name: item.label,
            autocomplete: `${item.label.split(" ").join("_")}`,
            example: exampledata,
          }
          actionlist.push(actionvalue);
        }
      }

      setActionlist(actionlist);
    }

    // Shows nested list of nodes > their JSON lists
    const ActionlistWrapper = (props) => {
      const { data } = props;

      const handleMenuClose = () => {
        setUpdate(Math.random());
        setMenuPosition(null);
      };

      const handleItemClick = (values) => {
				console.log("VALUES: ", values)
        if (values === undefined || values === null || values.length === 0) {
          return;
        }


				/*
				workflow.triggers[selectedTriggerIndex].parameters[1].value
          .trim()
          .endsWith("$")
          ? values[0].autocomplete
          : "$" + values[0].autocomplete;

        for (var key in values) {
          if (key === 0 || values[key].autocomplete.length === 0) {
            continue;
          }

          toComplete += values[key].autocomplete
        }
				*/

				console.log("SELECTED TRIGGER: ", selectedTrigger)
				if (selectedTrigger.name === "Shuffle Workflow") {
        	const toComplete = selectedTrigger.parameters[1].value + "$" + values[0].autocomplete
					selectedTrigger.parameters[1].value = toComplete
					setSelectedTrigger(selectedTrigger)
				}

        setUpdate(Math.random());
        setShowDropdown(false);
        setMenuPosition(null);
      };

      const iconStyle = {
        marginRight: 15,
      };

      return (
        <Menu
          anchorReference="anchorPosition"
          anchorPosition={menuPosition}
          onClose={() => {
            handleMenuClose();
          }}
          open={!!menuPosition}
          style={{
            border: `2px solid #f85a3e`,
            color: "white",
            marginTop: 2,
          }}
        >
          {actionlist.map((innerdata) => {
            const icon =
              innerdata.type === "action" ? (
                <AppsIcon style={{ marginRight: 10 }} />
              ) : innerdata.type === "workflow_variable" ||
                innerdata.type === "execution_variable" ? (
                <FavoriteBorderIcon style={{ marginRight: 10 }} />
              ) : (
                <ScheduleIcon style={{ marginRight: 10 }} />
              );

            const handleExecArgumentHover = (inside) => {
              var exec_text_field = document.getElementById(
                "execution_argument_input_field"
              );
              if (exec_text_field !== null) {
                if (inside) {
                  exec_text_field.style.border = "2px solid #f85a3e";
                } else {
                  exec_text_field.style.border = "";
                }
              }

              // Also doing arguments
              if (
                workflow.triggers !== undefined &&
                workflow.triggers !== null &&
                workflow.triggers.length > 0
              ) {
                for (var key in workflow.triggers) {
                  const item = workflow.triggers[key];

                  if (cy !== undefined) {
                    var node = cy.getElementById(item.id);
                    if (node.length > 0) {
                      if (inside) {
                        node.addClass("shuffle-hover-highlight");
                      } else {
                        node.removeClass("shuffle-hover-highlight");
                      }
                    }
                  }
                }
              }
            }

            const handleActionHover = (inside, actionId) => {
              if (cy !== undefined) {
                var node = cy.getElementById(actionId);
                if (node.length > 0) {
                  if (inside) {
                    node.addClass("shuffle-hover-highlight");
                  } else {
                    node.removeClass("shuffle-hover-highlight");
                  }
                }
              }
            };

            const handleMouseover = () => {
              if (innerdata.type === "Execution Argument") {
                handleExecArgumentHover(true);
              } else if (innerdata.type === "action") {
                handleActionHover(true, innerdata.id);
              }
            };

            const handleMouseOut = () => {
              if (innerdata.type === "Execution Argument") {
                handleExecArgumentHover(false);
              } else if (innerdata.type === "action") {
                handleActionHover(false, innerdata.id);
              }
            };

            var parsedPaths = [];
            if (typeof innerdata.example === "object") {
              parsedPaths = GetParsedPaths(innerdata.example, "");
            }

            return parsedPaths.length > 0 ? (
              <NestedMenuItem
                key={innerdata.name}
                label={
                  <div style={{ display: "flex" }}>
                    {icon} {innerdata.name}
                  </div>
                }
                parentMenuOpen={!!menuPosition}
                style={{
                  backgroundColor: theme.palette.inputColor,
                  color: "white",
                  minWidth: 250,
                }}
                onClick={() => {
                  handleItemClick([innerdata]);
                }}
              >
                {parsedPaths.map((pathdata, index) => {
                  // FIXME: Should be recursive in here
                  const icon =
                    pathdata.type === "value" ? (
                      <VpnKeyIcon style={iconStyle} />
                    ) : pathdata.type === "list" ? (
                      <FormatListNumberedIcon style={iconStyle} />
                    ) : (
                      <ExpandMoreIcon style={iconStyle} />
                    )

                  return (
                    <MenuItem
                      key={pathdata.name}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: "white",
                        minWidth: 250,
                      }}
                      value={pathdata}
                      onMouseOver={() => {}}
                      onClick={() => {
                        handleItemClick([innerdata, pathdata]);
                      }}
                    >
                      <Tooltip
                        color="primary"
                        title={`Ex. value: ${pathdata.value}`}
                        placement="left"
                      >
                        <div style={{ display: "flex" }}>
                          {icon} {pathdata.name}
                        </div>
                      </Tooltip>
                    </MenuItem>
                  );
                })}
              </NestedMenuItem>
            ) : (
              <MenuItem
                key={innerdata.name}
                style={{
                  backgroundColor: theme.palette.inputColor,
                  color: "white",
                }}
                value={innerdata}
                onMouseOver={() => handleMouseover()}
                onMouseOut={() => {
                  handleMouseOut();
                }}
                onClick={() => {
                  handleItemClick([innerdata]);
                }}
              >
                <Tooltip
                  color="primary"
                  title={`Value: ${innerdata.value}`}
                  placement="left"
                >
                  <div style={{ display: "flex" }}>
                    {icon} {innerdata.name}
                  </div>
                </Tooltip>
              </MenuItem>
            );
          })}
        </Menu>
      );
    };

    if (Object.getOwnPropertyNames(selectedTrigger).length > 0) {
      if (workflow.triggers[selectedTriggerIndex] === undefined) {
        return null;
      }

      if (
        workflow.triggers[selectedTriggerIndex].parameters === undefined ||
        workflow.triggers[selectedTriggerIndex].parameters === null ||
        workflow.triggers[selectedTriggerIndex].parameters.length === 0
      ) {
        workflow.triggers[selectedTriggerIndex].parameters = [];
        workflow.triggers[selectedTriggerIndex].parameters[0] = {
          name: "workflow",
          value: "",
        };
        workflow.triggers[selectedTriggerIndex].parameters[1] = {
          name: "argument",
          value: "",
        };
        workflow.triggers[selectedTriggerIndex].parameters[2] = {
          name: "user_apikey",
          value: "",
        };
        workflow.triggers[selectedTriggerIndex].parameters[3] = {
          name: "startnode",
          value: "",
        };
        workflow.triggers[selectedTriggerIndex].parameters[4] = {
          name: "check_result",
          value: "false",
        };

				/*
				// API-key has been replaced by auth key for the execution. 
				// Parents can now automatically execute children without auth from a user, as long as the subflow in question is owned by the same org and the subflow is actually referencing it during checkin.
        console.log("SETTINGS: ", userSettings);
        if (
          userSettings !== undefined &&
          userSettings !== null &&
          userSettings.apikey !== null &&
          userSettings.apikey !== undefined &&
          userSettings.apikey.length > 0
        ) {
          workflow.triggers[selectedTriggerIndex].parameters[2] = {
            name: "user_apikey",
            value: userSettings.apikey,
          };
        }
				*/
      }

			const handleSubflowStartnodeSelection = (e) => {
				setSubworkflowStartnode(e.target.value);

				if (e.target.value === null || e.target.value === undefined) {
					return
				}

				const branchId = uuidv4();
				const newbranch = {
					source_id: workflow.triggers[selectedTriggerIndex].id,
					destination_id: e.target.value.id,
					source: workflow.triggers[selectedTriggerIndex].id,
					target: e.target.value.id,
					has_errors: false,
					id: branchId,
					_id: branchId,
					label: "Subflow",
					decorator: true,
				};

				if (workflow.visual_branches !== undefined) {
					if (workflow.visual_branches === null) {
						workflow.visual_branches = [newbranch];
					} else if (workflow.visual_branches.length === 0) {
						workflow.visual_branches.push(newbranch);
					} else {
						const foundIndex = workflow.visual_branches.findIndex(
							(branch) => branch.source_id === newbranch.source_id
						);
						if (foundIndex !== -1) {
							const currentEdge = cy.getElementById(
								workflow.visual_branches[foundIndex].id
							);
							if (
								currentEdge !== undefined &&
								currentEdge !== null
							) {
								currentEdge.remove();
							}
						}

						workflow.visual_branches.splice(foundIndex, 1);
						workflow.visual_branches.push(newbranch);
					}
				}

				if (workflow.id === subworkflow.id) {
					const cybranch = {
						group: "edges",
						source: newbranch.source_id,
						target: newbranch.destination_id,
						id: branchId,
						data: newbranch,
					};

					cy.add(cybranch);
				}

				console.log("Value to be set: ", e.target.value);
				try {
					workflow.triggers[
						selectedTriggerIndex
					].parameters[3].value = e.target.value.id;
				} catch {
					workflow.triggers[selectedTriggerIndex].parameters[3] =
						{
							name: "startnode",
							value: e.target.value.id,
						};
				}

				setWorkflow(workflow);
			}

			const handleWorkflowSelectionUpdate = (e) => {
				setUpdate(Math.random());

				if (e.target.value === undefined || e.target.value === null || e.target.value.id === undefined) {
					return null
				}

				workflow.triggers[
					selectedTriggerIndex
				].parameters[0].value = e.target.value.id;
				setSubworkflow(e.target.value);

				// Sets the startnode
				if (e.target.value.id !== workflow.id) {
					console.log("WORKFLOW: ", e.target.value);

					const startnode = e.target.value.actions.find(
						(action) => action.id === e.target.value.start
					);
					if (startnode !== undefined && startnode !== null) {
						console.log("STARTNODE: ", startnode);
						setSubworkflowStartnode(startnode);

						try {
							workflow.triggers[
								selectedTriggerIndex
							].parameters[3].value = startnode.id;
						} catch {
							workflow.triggers[
								selectedTriggerIndex
							].parameters[3] = {
								name: "startnode",
								value: startnode.id,
							};
						}

						setWorkflow(workflow);
					}
					console.log("STARTNODE: ", startnode);
				} else {
					console.log("WORKFLOW: ", workflow);
				}

				setWorkflow(workflow);
			}

      return (
        <div style={appApiViewStyle}>
          <div
            style={{ display: "flex", height: "40px", marginBottom: "30px" }}
          >
            <div style={{ flex: "1" }}>
              <h3 style={{ marginBottom: "5px" }}>
                {selectedTrigger.app_name}
              </h3>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://shuffler.io/docs/triggers#subflow"
                style={{ textDecoration: "none", color: "#f85a3e" }}
              >
                What are subflows?
              </a>
            </div>
          </div>
          <Divider
            style={{
              marginBottom: "10px",
              marginTop: "10px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
					<div style={{display: "flex"}}>
						<div style={{flex: 5}}>
          		<Typography>Name</Typography>
							<TextField
								style={{
									backgroundColor: inputColor,
									borderRadius: theme.palette.borderRadius,
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
								placeholder={selectedTrigger.label}
								onChange={selectedTriggerChange}
							/>
						</div>
						<div>
							<div style={{flex: 1, marginLeft: 5,}}>
								<Tooltip
									color="primary"
									title={"Delay before action executes (in seconds)"}
									placement="top"
								>
									<span>
										<Typography>Delay</Typography>
										<TextField
											style={{
												backgroundColor: theme.palette.inputColor,
												borderRadius: theme.palette.borderRadius,
												color: "white",
												width: 50,
												height: 50,
												fontSize: "1em",
											}}
											InputProps={{
												style: theme.palette.innerTextfieldStyle,
											}}
											placeholder={selectedTrigger.execution_delay}
											defaultValue={selectedAction.execution_delay}
											onChange={(event) => {
												if (isNaN(event.target.value)) {
													console.log("NAN: ", event.target.value)
													return
												}

												const parsedNumber = parseInt(event.target.value)
												if (parsedNumber > 86400) {
													console.log("Max number is 1 day (86400)")
													return
												}

												selectedTrigger.execution_delay = parseInt(event.target.value)
												setSelectedTrigger(selectedTrigger)
											}}
										/>
									</span>
								</Tooltip>
							</div>
						</div>
					</div>
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  workflow.triggers[selectedTriggerIndex].parameters[4] !==
                    undefined &&
                  workflow.triggers[selectedTriggerIndex].parameters[4]
                    .value === "true"
                }
                onChange={() => {
                  const newvalue =
                    workflow.triggers[selectedTriggerIndex].parameters[4] ===
                      undefined ||
                    workflow.triggers[selectedTriggerIndex].parameters[4]
                      .value === "false"
                      ? "true"
                      : "false";
                  workflow.triggers[selectedTriggerIndex].parameters[4] = {
                    name: "check_result",
                    value: newvalue,
                  };

                  setWorkflow(workflow);
                  setUpdate(Math.random());
                }}
                color="primary"
                value="Wait for results"
              />
            }
            style={{ marginTop: 10 }}
            label={<div style={{ color: "white" }}>Wait for results</div>}
          />
          <Divider
            style={{
              marginTop: "20px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div style={{ flex: "6", marginTop: "20px" }}>
            <div>
							<div style={{display: "flex"}}>
								<div
									style={{
										marginTop: "20px",
										marginBottom: "7px",
										display: "flex",
										flex: 5,
									}}
								>
									<div style={{ flex: "10" }}>
										<b>Select a workflow to execute </b>
									</div>
								</div>
              		{workflow.triggers[selectedTriggerIndex].parameters[0].value
              		  .length === 0 ? null : workflow.triggers[selectedTriggerIndex]
              		    .parameters[0].value === props.match.params.key ? null : (
										<div style={{marginLeft: 5, flex: 1}}>
											<a
												rel="noopener noreferrer"
												href={`/workflows/${workflow.triggers[selectedTriggerIndex].parameters[0].value}`}
												target="_blank"
												style={{
													textDecoration: "none",
													color: "#f85a3e",
													marginLeft: 5,
													marginTop: 10,
												}}
											>
												<OpenInNewIcon />
											</a>
										</div>
              		)}
							</div>
						{workflows === undefined ||
						workflows === null ||
						workflows.length === 0 ? null : (
							<Autocomplete
          		  id="subflow_search"
          		  autoHighlight
                value={subworkflow}
          		  classes={{ inputRoot: classes.inputRoot }}
          		  ListboxProps={{
          		    style: {
          		      backgroundColor: theme.palette.inputColor,
          		      color: "white",
          		    },
          		  }}
								getOptionSelected={(option, value) => option.id === value.id}
          		  getOptionLabel={(option) => {
          		    if (
          		      option === undefined ||
          		      option === null ||
          		      option.name === undefined ||
          		      option.name === null 
          		    ) {
          		      return "No Workflow Selected";
          		    }

          		    const newname = (
          		      option.name.charAt(0).toUpperCase() + option.name.substring(1)
          		    ).replaceAll("_", " ");
          		    return newname;
          		  }}
          		  options={workflows}
          		  fullWidth
          		  style={{
          		    backgroundColor: theme.palette.inputColor,
          		    height: 50,
          		    borderRadius: theme.palette.borderRadius,
          		  }}
          		  onChange={(event, newValue) => {
									handleWorkflowSelectionUpdate({ target: { value: newValue} })
          		  }}
          		  renderOption={(data, index) => {
									if (data.id === workflow.id) {
										data = workflow;
									}

									//key={index}
									return (
											<Tooltip arrow placement="left" title={
												<span style={{}}>
													{data.image !== undefined && data.image !== null && data.image.length > 0 ? 
														<img src={data.image} alt={data.name} style={{backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette.borderRadius, }} />
													: null}
													<Typography>
														Choose {data.name}
													</Typography>
												</span>
											} placement="bottom">
											<MenuItem
												style={{
													backgroundColor: theme.palette.inputColor,
													color: data.id === workflow.id ? "red" : "white",
												}}
												key={index}
												value={data}
											>
												{data.name}
											</MenuItem>
										</Tooltip>
									)
          		  }}
          		  renderInput={(params) => {
          		    return (
											<TextField
												style={{
													backgroundColor: theme.palette.inputColor,
													borderRadius: theme.palette.borderRadius,
												}}
												{...params}
												label="Find your workflow"
												variant="outlined"
          		      	/>
          		    );
          		  }}
          		/>
              )}

              {subworkflow === undefined ||
              subworkflow === null ||
              subworkflow.id === undefined ||
              subworkflow.actions === null ||
              subworkflow.actions === undefined ||
              subworkflow.actions.length === 0 ? null : (
                <span>
                  <div
                    style={{
                      marginTop: "20px",
                      marginBottom: "7px",
                      display: "flex",
                    }}
                  >
                    <div style={{ flex: "10" }}>
                      <b>Select the Startnode</b>
                    </div>
                  </div>
									<Autocomplete
          				  id="subflow_node_search"
          				  autoHighlight
                    value={subworkflowStartnode}
          				  classes={{ inputRoot: classes.inputRoot }}
          				  ListboxProps={{
          				    style: {
          				      backgroundColor: theme.palette.inputColor,
          				      color: "white",
          				    },
          				  }}
										getOptionSelected={(option, value) => option.id === value.id}
          				  getOptionLabel={(option) => {
          				    if (
          				      option === undefined ||
          				      option === null ||
          				      option.label === undefined ||
          				      option.label === null 
          				    ) {
												if (option.length === 36) {

												}

          				      return "TMP";
          				    }

          				    const newname = (
          				      option.label.charAt(0).toUpperCase() + option.label.substring(1)
          				    ).replaceAll("_", " ");
          				    return newname;
          				  }}
                    options={subworkflow.actions}
          				  fullWidth
          				  style={{
          				    backgroundColor: theme.palette.inputColor,
          				    height: 50,
          				    borderRadius: theme.palette.borderRadius,
          				  }}
          				  onChange={(event, newValue) => {
											handleSubflowStartnodeSelection({ target: { value: newValue} }) 
          				  }}
          				  renderOption={(action) => {
											const isParent = getParents(selectedTrigger).find(
                        (parent) => parent.id === action.id
                      )

                      return (
                        <MenuItem
                  		    onMouseOver={() => {
														if (subworkflow.id === workflow.id) {
															handleActionHover(true, action.id) 
														}
													}}
                  		    onMouseOut={() => {
														if (subworkflow.id === workflow.id) {
															handleActionHover(false, action.id) 
														}
													}}
                          disabled={isCloud && isParent}
                          style={{
                            backgroundColor: theme.palette.inputColor,
                            color: isParent ? "red" : "white",
                          }}
                          value={action}
                        >
                          {action.label}
                        </MenuItem>
                      );
          				  }}
          				  renderInput={(params) => {
          				    return (
													<TextField
														style={{
															backgroundColor: theme.palette.inputColor,
															borderRadius: theme.palette.borderRadius,
														}}
														{...params}
														label="Find your start-node"
														variant="outlined"
          				      	/>
          				    );
          				  }}
          				/>
                </span>
              )}
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <div style={{ flex: "10" }}>
                  <b>Execution Argument</b>
                </div>
              </div>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette.borderRadius,
                }}
                InputProps={{
                  style: {
                    color: "white",
                    marginLeft: "5px",
                    maxWidth: "95%",
                    fontSize: "1em",
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Autocomplete text" placement="top">
                        <AddCircleOutlineIcon
                          style={{ cursor: "pointer" }}
                          onClick={(event) => {
                            setMenuPosition({
                              top: event.pageY + 10,
                              left: event.pageX + 10,
                            });
                            //setShowDropdownNumber(3)
                            setShowDropdown(true);
                          }}
                        />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                rows="6"
                multiline
                fullWidth
                color="primary"
                placeholder="Some execution data"
                defaultValue={
                  workflow.triggers[selectedTriggerIndex].parameters[1].value
                }
                onBlur={(e) => {
                  console.log("DATA: ", e.target.value);
                  workflow.triggers[selectedTriggerIndex].parameters[1].value =
                    e.target.value;
                  setWorkflow(workflow);
                }}
              />
              {showDropdown ? (
                <ActionlistWrapper
                  actionlist={actionlist}
                  data={workflow.triggers[selectedTriggerIndex]}
                />
              ) : null}
							{/*
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <div style={{ flex: "10" }}>
                  <b>API-key </b>
                </div>
              </div>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette.borderRadius,
                }}
                InputProps={{
                  style: {
                    color: "white",
                    marginLeft: "5px",
                    maxWidth: "95%",
                    fontSize: "1em",
                    height: 50,
                  },
                }}
                fullWidth
                color="primary"
                placeholder="Your apikey"
                defaultValue={
                  workflow.triggers[selectedTriggerIndex].parameters[2].value
                }
                onBlur={(e) => {
                  workflow.triggers[selectedTriggerIndex].parameters[2].value =
                    e.target.value;
                  setWorkflow(workflow);
                }}
              />
							*/}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const CommentSidebar = () => {
    if (Object.getOwnPropertyNames(selectedComment).length > 0) {
      /*
			if (workflow.triggers[selectedTriggerIndex] === undefined) {
				return null
			}

			if (workflow.triggers[selectedTriggerIndex].parameters === undefined || workflow.triggers[selectedTriggerIndex].parameters === null || workflow.triggers[selectedTriggerIndex].parameters.length === 0) {
				workflow.triggers[selectedTriggerIndex].parameters = []
				workflow.triggers[selectedTriggerIndex].parameters[0] = {"name": "url", "value": referenceUrl+"webhook_"+selectedTrigger.id}
				workflow.triggers[selectedTriggerIndex].parameters[1] = {"name": "tmp", "value": "webhook_"+selectedTrigger.id}
				workflow.triggers[selectedTriggerIndex].parameters[2] = {"name": "auth_headers", "value": ""}
				setWorkflow(workflow)
			} else {
				if (selectedTrigger.environment !== "cloud") {
					const newUrl = referenceUrl+"webhook_"+selectedTrigger.id
					if (newUrl !== workflow.triggers[selectedTriggerIndex].parameters[0].value) {
						console.log("Url is wrong - should update. This functionality is temporarily disabled.")
						//workflow.triggers[selectedTriggerIndex].parameters[0].value = newUrl
						//setWorkflow(workflow)
					}
				}
			}

			const trigger_header_auth = workflow.triggers[selectedTriggerIndex].parameters.length > 2 ? workflow.triggers[selectedTriggerIndex].parameters[2].value : ""
			*/

      return (
        <div style={appApiViewStyle}>
          <div
            style={{ display: "flex", height: "40px", marginBottom: "30px" }}
          >
            <div style={{ flex: "1" }}>
              <h3 style={{ marginBottom: "5px" }}>Comment</h3>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://shuffler.io/docs/workflows#comments"
                style={{ textDecoration: "none", color: "#f85a3e" }}
              >
                What are comments?
              </a>
            </div>
          </div>
          <Divider
            style={{
              marginBottom: 10,
              marginTop: 10,
              height: 1,
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div>Name</div>
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette.borderRadius,
            }}
            InputProps={{
              style: {
                color: "white",
                marginLeft: "5px",
                maxWidth: "95%",
                fontSize: "1em",
              },
            }}
            multiline
            rows="4"
            fullWidth
            color="primary"
            defaultValue={selectedComment.label}
            placeholder="Comment"
            onChange={(event) => {
              selectedComment.label = event.target.value;
              setSelectedComment(selectedComment);
            }}
          />
          <div style={{ display: "flex", marginTop: 10 }}>
            <div>
              <div>Height</div>
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
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
								placeholder={"150"}
                defaultValue={selectedComment.height}
                onChange={(event) => {
                  selectedComment.height = event.target.value;
                  setSelectedComment(selectedComment);
                }}
              />
            </div>
            <div style={{marginLeft: 5 }}>
              <div>Width</div>
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
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
								placeholder={"200"}
                defaultValue={selectedComment.width}
                onChange={(event) => {
                  selectedComment.width = event.target.value;
                  setSelectedComment(selectedComment);
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 10 }}>
            <div>
              <div>Background</div>
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
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
								placeholder={"#1f2023"}
                defaultValue={selectedComment["backgroundcolor"]}
                onChange={(event) => {
                  selectedComment.backgroundcolor = event.target.value;
                  setSelectedComment(selectedComment);
                }}
              />
            </div>
            <div style={{marginLeft: 5}}>
              <div>Text Color</div>
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
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
								placeholder={"#ffffff"}
                defaultValue={selectedComment.color}
                onChange={(event) => {
                  selectedComment.color = event.target.value;
                  setSelectedComment(selectedComment);
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const WebhookSidebar = () => {
    if (Object.getOwnPropertyNames(selectedTrigger).length > 0) {
      if (workflow.triggers[selectedTriggerIndex] === undefined) {
        return null;
      }

      if (
        workflow.triggers[selectedTriggerIndex].parameters === undefined ||
        workflow.triggers[selectedTriggerIndex].parameters === null ||
        workflow.triggers[selectedTriggerIndex].parameters.length === 0
      ) {
        workflow.triggers[selectedTriggerIndex].parameters = [];
        workflow.triggers[selectedTriggerIndex].parameters[0] = {
          name: "url",
          value: referenceUrl + "webhook_" + selectedTrigger.id,
        };
        workflow.triggers[selectedTriggerIndex].parameters[1] = {
          name: "tmp",
          value: "webhook_" + selectedTrigger.id,
        };
        workflow.triggers[selectedTriggerIndex].parameters[2] = {
          name: "auth_headers",
          value: "",
        };
        workflow.triggers[selectedTriggerIndex].parameters[3] = {
          name: "custom_response_body",
          value: "",
        };
        setWorkflow(workflow);
      } else {
        // Always update
        const newUrl = referenceUrl + "webhook_" + selectedTrigger.id;
        //console.log("Validating webhook url: ", newUrl);
				if (selectedTrigger.environment !== "cloud") {
					if (newUrl !== workflow.triggers[selectedTriggerIndex].parameters[0].value) {
						console.log("Url is wrong. NOT updating because of hybrid.");
						//workflow.triggers[selectedTriggerIndex].parameters[0].value = newUrl;
						//setWorkflow(workflow);
					}
				}
      }

      const trigger_header_auth =
        workflow.triggers[selectedTriggerIndex].parameters.length > 2
          ? workflow.triggers[selectedTriggerIndex].parameters[2].value
          : "";

      return (
        <div style={appApiViewStyle}>
          <div
            style={{ display: "flex", height: "40px", marginBottom: "30px" }}
          >
            <div style={{ flex: "1" }}>
              <h3 style={{ marginBottom: "5px" }}>
                {selectedTrigger.app_name}: {selectedTrigger.status}
              </h3>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://shuffler.io/docs/triggers#webhook"
                style={{ textDecoration: "none", color: "#f85a3e" }}
              >
                What are webhooks?
              </a>
            </div>
          </div>
          <Divider
            style={{
              marginBottom: "10px",
              marginTop: "10px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div>Name</div>
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette.borderRadius,
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
            placeholder={selectedTrigger.label}
            onChange={selectedTriggerChange}
          />
          <div style={{ marginTop: "20px" }}>
            <Typography>Environment</Typography>
            <Select
							MenuProps={{
								disableScrollLock: true,
							}}
              value={selectedTrigger.environment}
              disabled={selectedTrigger.status === "running"}
              SelectDisplayProps={{
                style: {
                  marginLeft: 10,
                },
              }}
              fullWidth
              onChange={(e) => {
                selectedTrigger.environment = e.target.value;
                if (e.target.value === "cloud") {
                  const tmpvalue = workflow.triggers[selectedTriggerIndex].parameters[0].value.split("/");
                  const urlpath = tmpvalue.slice(3, tmpvalue.length);
                  const newurl = "https://shuffler.io/" + urlpath.join("/");
                  workflow.triggers[selectedTriggerIndex].parameters[0].value = newurl;
                } else {
                  const tmpvalue = workflow.triggers[selectedTriggerIndex].parameters[0].value.split("/");
                  const urlpath = tmpvalue.slice(3, tmpvalue.length);
                  const newurl = window.location.origin + "/" + urlpath.join("/");
                  workflow.triggers[selectedTriggerIndex].parameters[0].value = newurl;
                }

								console.log("New value: ", workflow.triggers[selectedTriggerIndex].parameters[0])
								selectedTrigger.parameters[0] = workflow.triggers[selectedTriggerIndex].parameters[0]
                setSelectedTrigger(selectedTrigger);
                setWorkflow(workflow);
                setUpdate(Math.random());
              }}
              style={{
                backgroundColor: inputColor,
                color: "white",
                height: 50,
              }}
            >
              {triggerEnvironments.map((data) => {
                if (data.archived) {
                  return null;
                }

                return (
                  <MenuItem
                    key={data}
                    style={{ backgroundColor: inputColor, color: "white" }}
                    value={data}
                  >
                    {data}
                  </MenuItem>
                );
              })}
            </Select>
          </div>
          <Divider
            style={{
              marginTop: "20px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div style={{ flex: "6", marginTop: "20px" }}>
            <div>
              <b>Parameters</b>
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "17px",
                    height: "17px",
                    borderRadius: 17 / 2,
                    backgroundColor: "#f85a3e",
                    marginRight: "10px",
                  }}
                />
                <div style={{ flex: "10" }}>
                  <b>Webhook URI </b>
                </div>
              </div>
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
                }}
                id="webhook_uri_field"
                onClick={() => {
                  var copyText = document.getElementById("webhook_uri_field");
                  if (copyText !== undefined && copyText !== null) {
                    console.log("NAVIGATOR: ", navigator);
                    const clipboard = navigator.clipboard;
                    if (clipboard === undefined) {
                      alert.error("Can only copy over HTTPS (port 3443)");
                      return;
                    }

                    navigator.clipboard.writeText(copyText.value);
                    copyText.select();
                    copyText.setSelectionRange(
                      0,
                      99999
                    ); /* For mobile devices */

                    /* Copy the text inside the text field */
                    document.execCommand("copy");
                    alert.success("Copied Webhook URL");
                  } else {
                    console.log("Couldn't find webhook URI field: ", copyText);
                  }
                }}
                helperText={
                  workflow.triggers[selectedTriggerIndex].parameters[0].value !== undefined &&
                  workflow.triggers[selectedTriggerIndex].parameters[0].value !== null &&
                  (workflow.triggers[
                    selectedTriggerIndex
                  ].parameters[0].value.includes("localhost") ||
                    workflow.triggers[
                      selectedTriggerIndex
                    ].parameters[0].value.includes("127.0.0.1")) ? (
                    <span
                      style={{ color: "white", marginBottom: 5, marginleft: 5 }}
                    >
                      PS: This does NOT work with localhost. Use your local IP
                      instead.
                    </span>
                  ) : null
                }
                InputProps={{
                  style: {
                    color: "white",
                    height: 50,
                    marginLeft: "5px",
                    maxWidth: "95%",
                    fontSize: "1em",
                  },
                }}
                fullWidth
                disabled
                value={
                  workflow.triggers[selectedTriggerIndex].parameters[0].value
                }
                color="primary"
                placeholder="defaultValue"
                onBlur={(e) => {
                  setTriggerCronWrapper(e.target.value);
                }}
              /> 
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <Button
                  variant="contained"
                  style={{ flex: "1" }}
                  disabled={selectedTrigger.status === "running"}
                  onClick={() => {
                    newWebhook(workflow.triggers[selectedTriggerIndex]);
                  }}
                  color="primary"
                >
                  Start
                </Button>
                <Button
                  variant="contained"
                  style={{ flex: "1" }}
                  disabled={selectedTrigger.status !== "running"}
                  onClick={() => {
                    deleteWebhook(selectedTrigger, selectedTriggerIndex);
                  }}
                  color="primary"
                >
                  Stop
                </Button>
              </div>
              <Divider
                style={{
                  marginTop: "20px",
                  height: "1px",
                  width: "100%",
                  backgroundColor: "rgb(91, 96, 100)",
                }}
              />
							<div
                style={{
                  marginTop: 25,
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "17px",
                    height: "17px",
                    borderRadius: 17 / 2,
                    backgroundColor: yellow,
                    marginRight: "10px",
                  }}
                />
                <div style={{ flex: "10" }}>
                  <b>Authentication headers</b>
                </div>
              </div>
              <div>
                <TextField
                  style={{
                    backgroundColor: inputColor,
                    borderRadius: theme.palette.borderRadius,
                  }}
                  id="webhook_uri_header"
                  onClick={() => {}}
                  InputProps={{
                    style: {
                      color: "white",
                      marginLeft: "5px",
                      maxWidth: "95%",
                      fontSize: "1em",
                    },
                  }}
                  fullWidth
                  multiline
                  rows="4"
                  defaultValue={trigger_header_auth}
                  color="primary"
                  disabled={selectedTrigger.status === "running"}
                  placeholder={"AUTH_HEADER=AUTH_VALUE1"}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (selectedTrigger.parameters === null) {
                      selectedTrigger.parameters = [];
                    }

                    workflow.triggers[selectedTriggerIndex].parameters[2] = {
                      value: value,
                      name: "auth_headers",
                    };
                    setWorkflow(workflow);
                  }}
                />
              </div>
							<div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "17px",
                    height: "17px",
                    borderRadius: 17 / 2,
                    backgroundColor: yellow,
                    marginRight: "10px",
                  }}
                />
                <div style={{ flex: "10" }}>
                  <b>Custom Response</b>
                </div>
              </div>
              <div style={{marginBottom: 20, }}>
                <TextField
                  style={{
                    backgroundColor: inputColor,
                    borderRadius: theme.palette.borderRadius,
                  }}
                  id="webhook_uri_header"
                  onClick={() => {}}
                  InputProps={{
                    style: {
                      color: "white",
                      marginLeft: "5px",
                      maxWidth: "95%",
                      fontSize: "1em",
                    },
                  }}
                  fullWidth
                  multiline
                  rows="4"
                  defaultValue={trigger_header_auth}
                  color="primary"
                  disabled={selectedTrigger.status === "running"}
                  placeholder={"OK"}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (selectedTrigger.parameters === null) {
                      selectedTrigger.parameters = [];
                    }

                    workflow.triggers[selectedTriggerIndex].parameters[3] = {
                      value: value,
                      name: "custom_response_body",
                    };
                    setWorkflow(workflow);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const stopMailSub = (trigger, triggerindex) => {
    // DELETE
    if (trigger.id === undefined) {
      return;
    }

    alert.info("Stopping mail trigger");
    const requesttype = triggerAuthentication.type;
    fetch(
      `${globalUrl}/api/v1/workflows/${props.match.params.key}/${requesttype}/${trigger.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status !== 200) {
          throw new Error("Status not 200 for stream results :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success) {
          alert.success("Successfully stopped trigger");
          // Set the status
          workflow.triggers[triggerindex].status = "stopped";
          trigger.status = "stopped";
          setWorkflow(workflow);
          setSelectedTrigger(trigger);
          saveWorkflow(workflow);
        } else {
          alert.error("Failed stopping trigger: " + responseJson.reason);
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const startMailSub = (trigger, triggerindex) => {
    var folders = [];

    if (triggerFolders === null || triggerFolders === undefined) {
      return null;
    }

    const splitItem =
      workflow.triggers[selectedTriggerIndex].parameters[0].value.split(
        splitter
      );
    for (var key in splitItem) {
      const item = splitItem[key];
      const curfolder = triggerFolders.find((a) => a.displayName === item);
      if (curfolder === undefined) {
        alert.error("Something went wrong with folder selection: " + item);
        return;
      }

      folders.push(curfolder.id);
    }

    const data = {
      name: trigger.name,
      folders: folders,
      id: trigger.id,
    };

    const requesttype = triggerAuthentication.type;
    alert.info(
      "Creating " + requesttype + " subscription with name " + trigger.name
    );

    fetch(
      globalUrl +
        "/api/v1/workflows/" +
        props.match.params.key +
        "/" +
        requesttype,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for stream results :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          alert.error("Failed to start trigger: " + responseJson.reason);
        } else {
          alert.success(
            "Successfully started folder subscription trigger. Test it by sending yoursend an email"
          );

          workflow.triggers[triggerindex].status = "running";
          trigger.status = "running";
          setWorkflow(workflow);
          setSelectedTrigger(trigger);
          saveWorkflow(workflow);
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const newWebhook = (trigger) => {
    const hookname = trigger.label;
    if (hookname.length === 0) {
      alert.error("Missing name");
      return;
    }

    if (trigger.id.length !== 36) {
      alert.error("Missing id");
      return;
    }

    // Check the node it's connected to
    var startNode = workflow.start;
    const branch = workflow.branches.find(
      (branch) => branch.source_id === trigger.id
    );
    if (
      branch === undefined &&
      (workflow.start === undefined ||
        workflow.start === null ||
        workflow.start.length === 0)
    ) {
      alert.error("No webhook node defined");
    }

    alert.info("Starting webhook");
    if (branch !== undefined) {
      startNode = branch.destination_id;
    }

    const param = trigger.parameters.find(
      (param) => param.name === "auth_headers"
    );
    var auth = "";
    if (param !== undefined && param !== null) {
      auth = param.value;
    }

		const customRespParam = trigger.parameters.find(
      (param) => param.name === "custom_response_body"
    )
    var custom_response = "";
    if (customRespParam !== undefined && customRespParam !== null) {
      custom_response = customRespParam.value;
    }

    console.log("TRIG: ", trigger);
    const data = {
      name: hookname,
      type: "webhook",
      id: trigger.id,
      workflow: workflow.id,
      start: startNode,
      environment: trigger.environment,
      auth: auth,
			custom_response: custom_response,
    };

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
          alert.success("Successfully started webhook");
          trigger.status = "running";
          setSelectedTrigger(trigger);
          workflow.triggers[selectedTriggerIndex].status = "running";
          setWorkflow(workflow);
          saveWorkflow(workflow);
        } else {
          alert.error("Failed starting webhook: " + responseJson.reason);
        }
      })
      .catch((error) => {
        console.log(error.toString());
      });
  };

  const deleteWebhook = (trigger, triggerindex) => {
    if (trigger.id === undefined) {
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
        if (workflow.triggers[triggerindex] !== undefined) {
          workflow.triggers[triggerindex].status = "stopped";
        }

        if (responseJson.success) {
          // Set the status
          saveWorkflow(workflow);
        } else {
          if (responseJson.reason !== undefined) {
            alert.error("Failed stopping webhook: " + responseJson.reason);
          }
        }

        trigger.status = "stopped";
        setWorkflow(workflow);
        setSelectedTrigger(trigger);
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const UserinputSidebar = () => {
    if (
      Object.getOwnPropertyNames(selectedTrigger).length > 0 &&
      workflow.triggers[selectedTriggerIndex] !== undefined
    ) {
      if (
        workflow.triggers[selectedTriggerIndex].parameters === undefined ||
        workflow.triggers[selectedTriggerIndex].parameters === null ||
        workflow.triggers[selectedTriggerIndex].parameters.length === 0
      ) {
        workflow.triggers[selectedTriggerIndex].parameters = [];
        workflow.triggers[selectedTriggerIndex].parameters[0] = {
          name: "alertinfo",
          value: "hello this is an alert",
        };

        // boolean,
        workflow.triggers[selectedTriggerIndex].parameters[1] = {
          name: "options",
          value: "boolean",
        };

        // email,sms,app ...
        workflow.triggers[selectedTriggerIndex].parameters[2] = {
          name: "type",
          value: "email",
        };

        workflow.triggers[selectedTriggerIndex].parameters[3] = {
          name: "email",
          value: "test@test.com",
        };
        workflow.triggers[selectedTriggerIndex].parameters[4] = {
          name: "sms",
          value: "0000000",
        };
        workflow.triggers[selectedTriggerIndex].parameters[5] = {
          name: "subflow",
          value: "",
        };

        setWorkflow(workflow);
      }

      return (
        <div style={appApiViewStyle}>
          <div
            style={{ display: "flex", height: "40px", marginBottom: "30px" }}
          >
            <div style={{ flex: "1" }}>
              <h3 style={{ marginBottom: "5px" }}>
                {selectedTrigger.app_name}: {selectedTrigger.status}
              </h3>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://shuffler.io/docs/triggers#user_input"
                style={{ textDecoration: "none", color: "#f85a3e" }}
              >
                What is the user input trigger?
              </a>
            </div>
          </div>
          <Divider
            style={{
              marginBottom: "10px",
              marginTop: "10px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div>Name</div>
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette.borderRadius,
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
            placeholder={selectedTrigger.label}
            onChange={selectedTriggerChange}
          />

          <div style={{ marginTop: "20px" }}>
            Environment:
            <TextField
              style={{
                backgroundColor: inputColor,
                borderRadius: theme.palette.borderRadius,
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
              required
              disabled
              fullWidth
              color="primary"
              value={selectedTrigger.environment}
            />
          </div>
          <Divider
            style={{
              marginTop: "20px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div style={{ flex: "6", marginTop: "20px" }}>
            <b>Parameters</b>
            <div
              style={{
                marginTop: "20px",
                marginBottom: "7px",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: "17px",
                  height: "17px",
                  borderRadius: 17 / 2,
                  backgroundColor: "#f85a3e",
                  marginRight: "10px",
                }}
              />
              <div style={{ flex: "10" }}>
                <b>Information</b>
              </div>
            </div>
            <TextField
              style={{
                backgroundColor: inputColor,
                borderRadius: theme.palette.borderRadius,
              }}
              InputProps={{
                style: {
                  color: "white",
                  marginLeft: "5px",
                  maxWidth: "95%",
                  marginTop: "3px",
                  fontSize: "1em",
                },
              }}
              fullWidth
              rows="4"
              multiline
              defaultValue={
                workflow.triggers[selectedTriggerIndex].parameters[0].value
              }
              color="primary"
              placeholder="defaultValue"
              onBlur={(e) => {
                setTriggerTextInformationWrapper(e.target.value);
              }}
            />
            <div
              style={{
                marginTop: "20px",
                marginBottom: "7px",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: "17px",
                  height: "17px",
                  borderRadius: 17 / 2,
                  backgroundColor: "#f85a3e",
                  marginRight: "10px",
                }}
              />
              <div style={{ flex: "10" }}>
                <b>Contact options</b>
              </div>
            </div>
            <FormGroup
              style={{ paddingLeft: 10, backgroundColor: inputColor }}
              row
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      workflow.triggers[selectedTriggerIndex].parameters[2] !==
                        undefined &&
                      workflow.triggers[
                        selectedTriggerIndex
                      ].parameters[2].value.includes("subflow")
                    }
                    onChange={() => {
                      setTriggerOptionsWrapper("subflow");
                    }}
                    color="primary"
                    value="subflow"
										disabled
                  />
                }
                label={<div style={{ color: "white" }}>Subflow</div>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      workflow.triggers[selectedTriggerIndex].parameters[2] !==
                        undefined &&
                      workflow.triggers[
                        selectedTriggerIndex
                      ].parameters[2].value.includes("email")
                    }
                    onChange={() => {
                      setTriggerOptionsWrapper("email");
                    }}
                    color="primary"
                    value="email"
                  />
                }
                label={<div style={{ color: "white" }}>Email</div>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={workflow.triggers[
                      selectedTriggerIndex
                    ].parameters[2].value.includes("sms")}
                    onChange={() => {
                      setTriggerOptionsWrapper("sms");
                    }}
                    color="primary"
                    value="sms"
                  />
                }
                label={<div style={{ color: "white" }}>SMS</div>}
              />
            </FormGroup>
            {workflow.triggers[selectedTriggerIndex].parameters[2] !==
              undefined &&
            workflow.triggers[
              selectedTriggerIndex
            ].parameters[2].value.includes("email") ? (
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
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
								required
                placeholder={"mail1@company.com,mail2@company.com"}
                defaultValue={
                  workflow.triggers[selectedTriggerIndex].parameters[3].value
                }
                onBlur={(event) => {
                  workflow.triggers[selectedTriggerIndex].parameters[3].value =
                    event.target.value;
                  setWorkflow(workflow);
                  setUpdate(Math.random());
                }}
              />
            ) : null}
            {workflow.triggers[selectedTriggerIndex].parameters[2] !==
              undefined &&
            workflow.triggers[
              selectedTriggerIndex
            ].parameters[2].value.includes("sms") ? (
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
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
                placeholder={"+474823212132,+46020304242"}
                defaultValue={
                  workflow.triggers[selectedTriggerIndex].parameters[4].value
                }
                onBlur={(event) => {
                  workflow.triggers[selectedTriggerIndex].parameters[4].value =
                    event.target.value;
                  setWorkflow(workflow);
                  setUpdate(Math.random());
                }}
              />
            ) : null}
						{workflow.triggers[selectedTriggerIndex].parameters[2] !==
              undefined &&
            workflow.triggers[
              selectedTriggerIndex
            ].parameters[2].value.includes("subflow") ? (
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
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
                placeholder={"ID of another workflow"}
                defaultValue={
                  workflow.triggers[selectedTriggerIndex].parameters[5].value
                }
                onBlur={(event) => {
                  workflow.triggers[selectedTriggerIndex].parameters[5].value =
                    event.target.value;
                  setWorkflow(workflow);
                  setUpdate(Math.random());
                }}
              />
            ) : null}
          </div>
        </div>
      );
    }

    return null;
  };

  const ScheduleSidebar = () => {
    if (
      Object.getOwnPropertyNames(selectedTrigger).length > 0 &&
      workflow.triggers[selectedTriggerIndex] !== undefined
    ) {
      if (
        workflow.triggers[selectedTriggerIndex].parameters === undefined ||
        workflow.triggers[selectedTriggerIndex].parameters === null ||
        workflow.triggers[selectedTriggerIndex].parameters.length === 0
      ) {
        workflow.triggers[selectedTriggerIndex].parameters = [];
        workflow.triggers[selectedTriggerIndex].parameters[0] = {
          name: "cron",
          value: isCloud ? "*/25 * * * *" : "60",
        };
        workflow.triggers[selectedTriggerIndex].parameters[1] = {
          name: "execution_argument",
          value: '{"example": {"json": "is cool"}}',
        };
        setWorkflow(workflow);
      }

      return (
        <div style={appApiViewStyle}>
          <div
            style={{ display: "flex", height: "40px", marginBottom: "30px" }}
          >
            <div style={{ flex: "1" }}>
              <h3 style={{ marginBottom: "5px" }}>
                {selectedTrigger.app_name}: {selectedTrigger.status}
              </h3>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://shuffler.io/docs/triggers#schedule"
                style={{ textDecoration: "none", color: "#f85a3e" }}
              >
                What are schedules?
              </a>
            </div>
          </div>
          <Divider
            style={{
              marginBottom: "10px",
              marginTop: "10px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div>Name</div>
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette.borderRadius,
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
            placeholder={selectedTrigger.label}
            onChange={selectedTriggerChange}
          />
          <div style={{ marginTop: "20px" }}>
            <Typography>Environment</Typography>
            <Select
							MenuProps={{
								disableScrollLock: true,
							}}
              value={selectedTrigger.environment}
              disabled={selectedTrigger.status === "running"}
              SelectDisplayProps={{
                style: {
                  marginLeft: 10,
                },
              }}
              fullWidth
              onChange={(e) => {
                selectedTrigger.environment = e.target.value;
                setSelectedTrigger(selectedTrigger);
                if (e.target.value === "cloud") {
                  console.log("Set cloud config");
                  workflow.triggers[selectedTriggerIndex].parameters[0].value =
                    "*/25 * * * *";
                } else {
                  console.log("Set cloud config");

                  workflow.triggers[selectedTriggerIndex].parameters[0].value =
                    "60";
                }

                setWorkflow(workflow);
                setUpdate(Math.random());
              }}
              style={{
                backgroundColor: inputColor,
                color: "white",
                height: 50,
              }}
            >
              {triggerEnvironments.map((data) => {
                if (data.archived) {
                  return null;
                }

                return (
                  <MenuItem
                    key={data}
                    style={{ backgroundColor: inputColor, color: "white" }}
                    value={data}
                  >
                    {data}
                  </MenuItem>
                );
              })}
            </Select>
          </div>
          <Divider
            style={{
              marginTop: "20px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div style={{ flex: "6", marginTop: "20px" }}>
            <div>
              <b>Parameters</b>
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "17px",
                    height: "17px",
                    borderRadius: 17 / 2,
                    backgroundColor: "#f85a3e",
                    marginRight: "10px",
                  }}
                />
                <div style={{ flex: "10" }}>
                  <b>Interval (UTC) </b>
                </div>
              </div>
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
                }}
                InputProps={{
                  style: {
                    color: "white",
                    height: 50,
                    marginLeft: "5px",
                    maxWidth: "95%",
                    fontSize: "1em",
                  },
                }}
                fullWidth
                disabled={
                  workflow.triggers[selectedTriggerIndex].status === "running"
                }
                defaultValue={
                  workflow.triggers[selectedTriggerIndex].parameters[0].value
                }
                color="primary"
                placeholder="defaultValue"
                onBlur={(e) => {
                  setTriggerCronWrapper(e.target.value);
                }}
              />
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "17px",
                    height: "17px",
                    borderRadius: 17 / 2,
                    backgroundColor: "#f85a3e",
                    marginRight: "10px",
                  }}
                />
                <div style={{ flex: "10" }}>
                  <b>Execution argument: </b>
                </div>
              </div>
              <TextField
                style={{
                  backgroundColor: inputColor,
                  borderRadius: theme.palette.borderRadius,
                }}
                InputProps={{
                  style: {
                    color: "white",
                    marginLeft: "5px",
                    maxWidth: "95%",
                    marginTop: "3px",
                    fontSize: "1em",
                  },
                }}
                disabled={
                  workflow.triggers[selectedTriggerIndex].status === "running"
                }
                fullWidth
                rows="6"
                multiline
                color="primary"
                defaultValue={
                  workflow.triggers[selectedTriggerIndex].parameters[1].value
                }
                placeholder='{"example": {"json": "is cool"}}'
                onBlur={(e) => {
                  setTriggerBodyWrapper(e.target.value);
                }}
              />
              <Divider
                style={{
                  marginTop: "20px",
                  height: "1px",
                  width: "100%",
                  backgroundColor: "rgb(91, 96, 100)",
                }}
              />
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "7px",
                  display: "flex",
                }}
              >
                <Button
                  style={{ flex: "1" }}
                  variant="contained"
                  disabled={selectedTrigger.status === "running"}
                  onClick={() => {
                    submitSchedule(selectedTrigger, selectedTriggerIndex);
                  }}
                  color="primary"
                >
                  Start
                </Button>
                <Button
                  style={{ flex: "1" }}
                  variant="contained"
                  disabled={selectedTrigger.status !== "running"}
                  onClick={() => {
                    stopSchedule(selectedTrigger, selectedTriggerIndex);
                  }}
                  color="primary"
                >
                  Stop
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const cytoscapeViewWidths = isMobile ? 50 : 850;
  const bottomBarStyle = {
    position: "fixed",
    right: isMobile ? 20 : 20,
    bottom: isMobile ? undefined : 0,
		top: isMobile ? appBarSize + 55 : undefined,
    left: isMobile ? undefined : leftBarSize,
    minWidth: cytoscapeViewWidths,
    maxWidth: cytoscapeViewWidths,
    marginLeft: 20,
    marginBottom: 20,
    zIndex: 10,
  };

  const topBarStyle = {
    position: "fixed",
    right: 0,
    left: isMobile ? 20 : leftBarSize + 20,
    top: isMobile ? 30 : appBarSize + 20,
  };

  const TopCytoscapeBar = (props) => {
		if (workflow.public === true) {
			return null
		}

    return (
      <div style={topBarStyle}>
        <div style={{ margin: "0px 10px 0px 10px" }}>
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="›"
            style={{ color: "white" }}
          >
            <Link
              to="/workflows"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h2
                style={{
                  color: "rgba(255,255,255,0.5)",
                  margin: "0px 0px 0px 0px",
                }}
              >
                <PolymerIcon style={{ marginRight: 10 }} />
                Workflows
              </h2>
            </Link>
            <h2 style={{ margin: 0 }}>{workflow.name}</h2>
          </Breadcrumbs>
        </div>
      </div>
    );
  };

  const WorkflowMenu = () => {
    const [newAnchor, setNewAnchor] = React.useState(null);
    const [showShuffleMenu, setShowShuffleMenu] = React.useState(false);

    return (
      <div style={{ display: "inline-block" }}>
        <Menu
          id="long-menu"
          anchorEl={newAnchor}
          open={showShuffleMenu}
          onClose={() => {
            setShowShuffleMenu(false);
          }}
        >
          <div
            style={{ margin: 15, color: "white", maxWidth: 250, minWidth: 250 }}
          >
            <h4>This menu is used to control the workflow itself.</h4>
            <Divider
              style={{
                backgroundColor: "white",
                marginTop: 10,
                marginBottom: 10,
              }}
            />

            <FormControlLabel
              style={{ marginBottom: 15, color: "white" }}
              label={<div style={{ color: "white" }}>Skip Notifications</div>}
              control={
                <Switch
                  checked={workflow.configuration.skip_notifications}
                  onChange={() => {
                    workflow.configuration.skip_notifications =
                      !workflow.configuration.skip_notifications;
                    setWorkflow(workflow);
                    setUpdate(
                      "skip_notifications" +
                        workflow.configuration.skip_notification
                        ? "true"
                        : "false"
                    );
                  }}
                />
              }
            />
            <FormControlLabel
              style={{ marginBottom: 15, color: "white" }}
              label={<div style={{ color: "white" }}>Exit on Error</div>}
              control={
                <Switch
                  checked={workflow.configuration.exit_on_error}
                  onChange={() => {
                    workflow.configuration.exit_on_error =
                      !workflow.configuration.exit_on_error;
                    setWorkflow(workflow);
                    setUpdate(
                      "exit_on_error_" + workflow.configuration.exit_on_error
                        ? "true"
                        : "false"
                    );
                  }}
                />
              }
            />
            <FormControlLabel
              style={{ marginBottom: 15, color: "white" }}
              label={<div style={{ color: "white" }}>Start from top</div>}
              control={
                <Switch
                  checked={workflow.configuration.start_from_top}
                  onChange={() => {
                    workflow.configuration.start_from_top =
                      !workflow.configuration.start_from_top;
                    setWorkflow(workflow);
                    setUpdate(
                      "start_from_top_" + workflow.configuration.start_from_top
                        ? "true"
                        : "false"
                    );
                  }}
                />
              }
            />
          </div>
        </Menu>
        <Tooltip
          color="secondary"
          title="Workflow settings"
          placement="top-start"
        >
          <span>
            <Button
              disabled={workflow.public}
              color="primary"
              style={{ height: 50, marginLeft: 10 }}
              variant="outlined"
              onClick={(event) => {
                setShowShuffleMenu(!showShuffleMenu);
                setNewAnchor(event.currentTarget);
              }}
            >
              <SettingsIcon />
            </Button>
          </span>
        </Tooltip>
				{isMobile ? 
					<Tooltip
						color="secondary"
						title="Show apps"
						placement="top-start"
					>
						<span>
							<Button
								disabled={workflow.public}
								color="primary"
								style={{ height: 50, marginLeft: 10 }}
								variant="outlined"
								onClick={(event) => {
									console.log("Show apps!")
  								setLeftBarSize(leftViewOpen ? 0 : 60)
  								setLeftViewOpen(!leftViewOpen)
								}}
							>
                <AppsIcon />
							</Button>
						</span>
					</Tooltip>
				: null}
			</div>
    );
  };

	const handleActionHover = (inside, actionId) => {
		if (cy !== undefined) {
			var node = cy.getElementById(actionId);
			if (node.length > 0) {
				if (inside) {
					node.addClass("shuffle-hover-highlight");
				} else {
					node.removeClass("shuffle-hover-highlight");
				}
			}
		}
	}

  const handleHistoryUndo = () => {
    //console.log("history: ", history, "index: ", historyIndex);
    var item = history[historyIndex - 1];
    if (historyIndex === 0) {
      item = history[historyIndex];
    }

    if (item === undefined) {
      console.log("Couldn't find the action you're looking for");
      return;
    }

    //console.log("HANDLE: ", item);
    if (item.type === "node" && item.action === "removed") {
      // Re-add the node
			console.log("Item: ", item.data)

    	const edge = cy.getElementById(item.data.id).json()
			if (edge !== null && edge !== undefined) {
				console.log("Couldn't add node as it exists")
				return
			}

      cy.add({
        group: "nodes",
        data: item.data,
        position: item.data.position,
      });
    } else if (item.action === "added") {
      //console.log("Should remove item!");
      const currentitem = cy.getElementById(item.data.id);
      if (currentitem !== undefined && currentitem !== null) {
        currentitem.remove();
      }

    } else if (item.type === "edge" && item.action === "removed") {
    	const sourcenode = cy.getElementById(item.data.source)
    	const targetnode = cy.getElementById(item.data.target)
			if (sourcenode === undefined || sourcenode === null || targetnode === undefined || targetnode === null) {
				console.log("Can't readd bad edge!")
				return
			}

    	const edge = cy.getElementById(item.data.id).json()
			if (edge !== null && edge !== undefined) {
				console.log("Couldn't add edge as it exists")
				return
			}

			cy.add({
				group: "edges",
				data: item.data,
			});

    } else {
			console.log("UNHANDLED: ", item)
		}

    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const BottomCytoscapeBar = () => {
    if (
      workflow.id === undefined ||
      workflow.id === null ||
      apps.length === 0
    ) {
      return null;
    }

    const boxSize = isMobile ? 50 : 100;
    const executionButton = executionRunning ? (
      <Tooltip color="primary" title="Stop execution" placement="top">
        <span>
          <Button
            style={{ height: boxSize, width: boxSize }}
            color="secondary"
            variant="contained"
            onClick={() => {
              abortExecution();
            }}
          >
            <PauseIcon style={{ fontSize: isMobile ? 30 : 60 }} />
          </Button>
        </span>
      </Tooltip>
    ) : (
      <Tooltip color="primary" title="Test Execution" placement="top">
        <span>
          <Button
            disabled={
              workflow.public || executionRequestStarted || !workflow.isValid
            }
            style={{ height: boxSize, width: boxSize }}
            color="primary"
            variant="contained"
            onClick={() => {
              executeWorkflow(executionText, workflow.start, lastSaved);
            }}
          >
            <PlayArrowIcon style={{ fontSize: isMobile ? 30 : 60 }} />
          </Button>
        </span>
      </Tooltip>
    );

    return (
      <div style={bottomBarStyle}>
        {executionButton}
        <div
          style={{
            marginLeft: isMobile ? 0 : 10,
						marginTop: isMobile ? 5 : 0,
            left: isMobile ? -10 : boxSize,
						top: isMobile ? boxSize : undefined,
            bottom: 0,
            position: "absolute",
						display: "flex",
						flexDirection: isMobile ? "column" : "row",
          }}
        >
          {isMobile || workflow.public ? null : (
            <Tooltip
              color="primary"
              title="An argument to be used for execution. This is a variable available to every node in your workflow."
              placement="top"
            >
              <TextField
                id="execution_argument_input_field"
                style={theme.palette.textFieldStyle}
                disabled={workflow.public}
                InputProps={{
                  style: theme.palette.innerTextfieldStyle,
                }}
                color="secondary"
                placeholder={"Execution Argument"}
                defaultValue={executionText}
                onBlur={(e) => {
                  setExecutionText(e.target.value);
                }}
              />
            </Tooltip>
          )}
					{/*userdata.avatar === creatorProfile.github_avatar ? null :*/}
          	<Tooltip color="primary" title="Save (ctrl+s)" placement="top">
          	  <span>
          	    <Button
          	      disabled={savingState !== 0}
          	      color="primary"
          	      style={{
          	        height: workflow.public ? 100 : 50,
          	        width: workflow.public ? 100 : 64,
          	        marginLeft: 10,
          	      }}
          	      variant={
          	        lastSaved && !workflow.public ? "outlined" : "contained"
          	      }
          	      onClick={() => saveWorkflow()}
          	    >
          	      {savingState === 2 ? (
          	        <CircularProgress style={{ height: 35, width: 35 }} />
          	      ) : savingState === 1 ? (
          	        <DoneIcon style={{ color: green }} />
          	      ) : (
          	        <SaveIcon />
          	      )}
          	    </Button>
          	  </span>
          	</Tooltip>
          {workflow.public ? (
            <Tooltip
              color="secondary"
              title="Download workflow"
              placement="top-start"
            >
              <span>
                <Button
                  color="primary"
                  style={{ height: 50, marginLeft: 10 }}
                  variant="outlined"
                  onClick={() => {
                    const data = workflow;
                    let exportFileDefaultName = data.name + ".json";

                    let dataStr = JSON.stringify(data);
                    let dataUri =
                      "data:application/json;charset=utf-8," +
                      encodeURIComponent(dataStr);
                    let linkElement = document.createElement("a");
                    linkElement.setAttribute("href", dataUri);
                    linkElement.setAttribute("download", exportFileDefaultName);
                    linkElement.click();
                  }}
                >
                  <GetAppIcon />
                </Button>
              </span>
            </Tooltip>
          ) : null}
          <Tooltip
            color="secondary"
            title="Fit to screen (ctrl+f)"
            placement="top"
          >
            <span>
              <Button
                color="primary"
                style={{ height: 50, marginLeft: 10 }}
                variant="outlined"
                onClick={() => cy.fit(null, 50)}
              >
                <AspectRatioIcon />
              </Button>
            </span>
          </Tooltip>
          <Tooltip color="secondary" title="Undo" placement="top-start">
            <span>
              <Button
                disabled={history.length === 0}
                color="primary"
                style={{ height: 50, marginLeft: 10 }}
                variant="outlined"
                onClick={(event) => {
                  handleHistoryUndo(history);
                }}
              >
                <UndoIcon />
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            color="secondary"
            title="Remove selected item (del)"
            placement="top-start"
          >
            <span>
              <Button
                color="primary"
                disabled={workflow.public}
                style={{ height: 50, marginLeft: 10 }}
                variant="outlined"
                onClick={() => {
    							const selectedNode = cy.$(":selected");
    							if (selectedNode.data() === undefined) {
    							  return
    							}

                  removeNode(selectedNode.data("id"))
                }}
              >
                <DeleteIcon />
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            color="secondary"
            title="Show executions"
            placement="top-start"
          >
            <span>
              <Button
                disabled={workflow.public}
                color="primary"
                style={{ height: 50, marginLeft: 10 }}
                variant="outlined"
                onClick={() => {
                  setExecutionModalOpen(true);
                  getWorkflowExecution(props.match.params.key, "");
                }}
              >
                <DirectionsRunIcon />
              </Button>
            </span>
          </Tooltip>
          <Tooltip color="secondary" title="Add comment" placement="top-start">
            <span>
              <Button
                disabled={workflow.public}
                color="primary"
                style={{ height: 50, marginLeft: 10 }}
                variant="outlined"
                onClick={() => {
                  addCommentNode();
                }}
              >
                <AddCommentIcon />
              </Button>
            </span>
          </Tooltip>
          {workflow.configuration !== null &&
          workflow.configuration !== undefined &&
          workflow.configuration.exit_on_error !== undefined ? (
            <WorkflowMenu />
          ) : null}
        </div>
      </div>
    );
  };

  const addCommentNode = () => {
    const newId = uuidv4();
    const position = {
      x: 300,
      y: 300,
    };
    cy.add({
      group: "nodes",
      data: {
        id: newId,
        label: "Your comment :)",
        type: "COMMENT",
        is_valid: true,
        decorator: true,
        width: 250,
        height: 150,
        position: position,
        backgroundcolor: "#1f2023",
        color: "#ffffff",
      },
      position: position,
    });
  };

  const RightSideBar = (props) => {
    const {
      workflow,
      setWorkflow,
      setSelectedAction,
      setUpdate,
      selectedApp,
      workflowExecutions,
      setSelectedResult,
      selectedAction,
      setSelectedApp,
      setSelectedTrigger,
      setSelectedEdge,
      setCurrentView,
      cy,
      setAuthenticationModalOpen,
      setVariablesModalOpen,
      setCodeModalOpen,
      selectedNameChange,
      rightsidebarStyle,
      showEnvironment,
      selectedActionEnvironment,
      environments,
      setNewSelectedAction,
      appApiViewStyle,
      globalUrl,
      setSelectedActionEnvironment,
      requiresAuthentication,
      scrollConfig,
      setScrollConfig,
    } = props;

    if (!rightSideBarOpen) {
      return null;
    }

		var defaultReturn = null
    if (Object.getOwnPropertyNames(selectedAction).length > 0) {
      if (Object.getOwnPropertyNames(selectedAction).length === 0) {
        return null;
      }

			defaultReturn = <ParsedAction
				id="rightside_subactions"
				isCloud={isCloud}
				getParents={getParents}
				actionDelayChange={actionDelayChange}
				getAppAuthentication={getAppAuthentication}
				appAuthentication={appAuthentication}
				authenticationType={authenticationType}
				scrollConfig={scrollConfig}
				setScrollConfig={setScrollConfig}
				selectedAction={selectedAction}
				workflow={workflow}
				setWorkflow={setWorkflow}
				setSelectedAction={setSelectedAction}
				setUpdate={setUpdate}
				selectedApp={selectedApp}
				workflowExecutions={workflowExecutions}
				setSelectedResult={setSelectedResult}
				setSelectedApp={setSelectedApp}
				setSelectedTrigger={setSelectedTrigger}
				setSelectedEdge={setSelectedEdge}
				setCurrentView={setCurrentView}
				cy={cy}
				setAuthenticationModalOpen={setAuthenticationModalOpen}
				setVariablesModalOpen={setVariablesModalOpen}
				setLastSaved={setLastSaved}
				setCodeModalOpen={setCodeModalOpen}
				selectedNameChange={selectedNameChange}
				rightsidebarStyle={rightsidebarStyle}
				showEnvironment={showEnvironment}
				selectedActionEnvironment={selectedActionEnvironment}
				environments={environments}
				setNewSelectedAction={setNewSelectedAction}
				sortByKey={sortByKey}
				appApiViewStyle={appApiViewStyle}
				globalUrl={globalUrl}
				setSelectedActionEnvironment={setSelectedActionEnvironment}
				requiresAuthentication={requiresAuthentication}
				setLastSaved={setLastSaved}
				lastSaved={lastSaved}
			/>

    } else if (Object.getOwnPropertyNames(selectedComment).length > 0) {
			defaultReturn = <CommentSidebar />
    } else if (Object.getOwnPropertyNames(selectedTrigger).length > 0) {
      if (selectedTrigger.trigger_type === "SCHEDULE") {
				defaultReturn = <ScheduleSidebar />
      } else if (selectedTrigger.trigger_type === "WEBHOOK") {
				defaultReturn = <WebhookSidebar />
      } else if (selectedTrigger.trigger_type === "SUBFLOW") {
				defaultReturn = <SubflowSidebar />
      } else if (selectedTrigger.trigger_type === "EMAIL") {
				defaultReturn = <EmailSidebar />
      } else if (selectedTrigger.trigger_type === "USERINPUT") {
				defaultReturn = <UserinputSidebar />
      } else if (selectedTrigger.trigger_type === undefined) {
				//defaultReturn = <UserinputSidebar />
        return null;
      } else {
        console.log(
          "Unable to handle invalid trigger type " +
            selectedTrigger.trigger_type
        );
        return null;
      }
    } else if (Object.getOwnPropertyNames(selectedEdge).length > 0) {
			defaultReturn = <EdgeSidebar />
    }

		const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

		const drawerBleeding = 56;
		if (defaultReturn === undefined || defaultReturn === null) {
			return null
		}

		return (
			isMobile ? 
				<SwipeableDrawer
					anchor={"bottom"}
					disableBackdropTransition={!iOS} 
					disableDiscovery={iOS}
					open={true}
					onClose={() => {
						console.log("Close!")
						//setRightSideBarOpen(false)
						cy.elements().unselect()
					}}
					disableSwipeToOpen={false}
					ModalProps={{
						keepMounted: true,
					}}
					PaperProps={{
						style: {
							maxHeight: "70%",
							overflow: "auto",
						}
					}}
				>
					{defaultReturn}
				</SwipeableDrawer>
			: 
				<Fade in={true} style={{ transitionDelay: `$0ms` }}>
					<div id="rightside_actions" style={rightsidebarStyle}>
						{defaultReturn}
					</div>
				</Fade>
		);

    //return null;
  };

  // This can execute a workflow with firestore. Used for test, as datastore is old and stuff
  // Too much work to move everything over alone, so won't touch it for now
  //<Button style={{borderRadius: "0px"}} color="primary" variant="contained" onClick={() => {
  //	executeWorkflowWebsocket()
  //}}>Execute websocket</Button>
  //
		
	
  const leftView = workflow.public === true ? 
			<div style={{minHeight: "80vh", height: "100%", minWidth: leftBarSize-70, maxWidth: leftBarSize-70, zIndex: 0, padding: 35, borderRight: "1px solid rgba(91,96,100,1)",}}> 
				<Typography variant="h6" color="textPrimary" style={{
						margin: "0px 0px 0px 0px",
					}}
				>
        	{workflow.name}
        </Typography>
				<Typography variant="body2" color="textSecondary">
					This workflow is public	and <span style={{color: "#f86a3e", cursor: "pointer", }} onClick={() => {
            saveWorkflow()
					}}>must be saved</span> to be used in your organization.
				</Typography>
				{Object.getOwnPropertyNames(creatorProfile).length !== 0 && creatorProfile.github_avatar !== undefined  && creatorProfile.github_avatar !== null ? 
					<div style={{display: "flex", marginTop: 10, }}>
						<IconButton color="primary" style={{padding: 0, marginRight: 10, }} aria-controls="simple-menu" aria-haspopup="true" onClick={(event) => {
						}}>
							<Link to={`/creators/${creatorProfile.github_username}`} style={{textDecoration: "none", color: "#f86a3e"}}>
								<Avatar style={{height: 30, width: 30,}} alt={"Workflow creator"} src={creatorProfile.github_avatar} />
							</Link>
						</IconButton>
						<Typography variant="body1" color="textSecondary" style={{color: ""}}>
							Shared by <Link to={`/creators/${creatorProfile.github_username}`} style={{textDecoration: "none", color: "#f86a3e"}}>{creatorProfile.github_username}</Link>
						</Typography>
					</div>
				: null}
			<div style={{marginTop: 15}} />
			{workflow.tags !== undefined && workflow.tags !== null && workflow.tags.length > 0 ?
				<div style={{display: "flex", overflow: "hidden",marginTop: 5, }}>
					<Typography variant="body1" style={{marginRight: 10, }}>
						Tags
					</Typography>
					<div style={{display: "flex"}}>
						{workflow.tags.map((tag, index) => {
							if (index >= 3) {
								return null;
							}

							return (
								<Chip
									key={index}
									style={{backgroundColor: "#3d3f43", height: 30, marginRight: 5, paddingLeft: 5, paddingRight: 5, height: 28, cursor: "pointer", borderColor: "#3d3f43", color: "white",}}
									label={tag}
									variant="outlined"
									color="primary"
								/>
							);
						})}
					</div>
				</div>
			: null }
			{appGroup.length > 0 ? 
				<div style={{display: "flex", marginTop: 10, }}>
					<Typography variant="body1">
						Apps
					</Typography>
					<AvatarGroup max={6} style={{marginLeft: 10, }}>
						{appGroup.map((data, index) => {
							return (
								<Link key={index} to={`/apps/${data.app_id}`}>
									<Avatar alt={data.app_name} src={data.large_image} style={{width: 30, height: 30}}/>
								</Link>
							)
						})}
					</AvatarGroup>
				</div>
			: null}
			{triggerGroup.length > 0 ? 
				<div style={{display: "flex", marginTop: 10, }}>
					<Typography variant="body1">
						Triggers	
					</Typography>
					<AvatarGroup max={6} style={{marginLeft: 10, }}>
						{triggerGroup.map((data, index) => {
							return (
								<Avatar key={index} alt={data.app_name} src={data.large_image} style={{width: 30, height: 30}}/>
							)
						})}
					</AvatarGroup>
				</div>
			: null}

			<div style={{display: "flex", marginTop: 10, }}>
				<Typography variant="body1">
					Mitre Att&ck:&nbsp; 
				</Typography>
				<Typography variant="body1" color="textSecondary">
					TBD
				</Typography>
			</div>
			{/*
			<div style={{display: "flex", marginTop: 10, }}>
				<Typography variant="body1">
					Related Workflows:
				</Typography>
				<Typography variant="body1" color="textSecondary">
					TBD
				</Typography>
			</div>
			*/}
			{workflow.description !== undefined && workflow.description !== null && workflow.description.length > 0 ?
				<div style={{marginTop: 5, }}>
					<Typography variant="body1">
						Description 
					</Typography>
					<Typography variant="body1" color="textSecondary">
						{workflow.description} 
					</Typography>
				</div>
			: null}
			{userdata.avatar === creatorProfile.github_avatar ? 
				<div style={{marginTop: 50, }}>
					<Button
						color="primary"
						variant="contained"
						fullWidth
						style={{marginTop: 15, }}
						onClick={() => {
							//setEditWorkflowDetails(true)
							workflow.public = false
							setWorkflow(workflow)
							setUpdate(Math.random());
						}}
					>
						Edit Workflow 
					</Button>
					<Button
						color="secondary"
						disabled
						variant="outlined"
						fullWidth
						style={{marginTop: 15, }}
						onClick={() => {
							// setEditWorkflowDetails(true)
							// workflow.public = false
							// setWorkflow(workflow)
							// setUpdate(Math.random());
						}}
					>
						Unpublish Workflow	
					</Button>
				</div>
			: null}
		</div>
	: isMobile && leftViewOpen ? 
		<div
			style={{
				borderRight: "1px solid rgb(91, 96, 100)",
			}}
		>
				<HandleLeftView />
		</div>
	: leftViewOpen ? (
		<div
			style={{
				minWidth: leftBarSize,
				maxWidth: leftBarSize,
				borderRight: "1px solid rgb(91, 96, 100)",
			}}
		>
				<HandleLeftView />
		</div>
	) : (
	<div
		style={{
			minWidth: leftBarSize,
			maxWidth: leftBarSize,
			borderRight: "1px solid rgb(91, 96, 100)",
		}}
	>
		<div
			style={{ cursor: "pointer", height: 20, marginTop: 10, marginLeft: 10 }}
			onClick={() => {
				setLeftViewOpen(true);
				setLeftBarSize(350);
			}}
		>
			<Tooltip color="primary" title="Maximize" placement="top">
				<KeyboardArrowRightIcon />
			</Tooltip>
		</div>
	</div>
);

const executionPaperStyle = {
	minWidth: "95%",
	maxWidth: "95%",
	marginTop: "5px",
	color: "white",
	marginBottom: 10,
	padding: 5,
	backgroundColor: surfaceColor,
	cursor: "pointer",
	display: "flex",
	minHeight: 40,
	maxHeight: 40,
};

const parsedExecutionArgument = () => {
	var showResult = executionData.execution_argument.trim();
	const validate = validateJson(showResult);

	if (validate.valid) {
		if (typeof validate.result === "string") {
			try {
				validate.result = JSON.parse(validate.result);
			} catch (e) {
				console.log("Error: ", e);
				validate.valid = false;
			}
		}

      return (
				<div style={{display: "flex"}}>
					<IconButton
						style={{
							marginTop: "auto",
							marginBottom: "auto",
							height: 30,
							paddingLeft: 0,
							width: 30,
						}}
						onClick={() => {
							setSelectedResult({
								"action": {
									"label": "Execution Argument",
									"name": "Execution Argument",
      						"large_image": theme.palette.defaultImage,
      						"image": theme.palette.defaultImage,
								},
								"result": validate.valid ? JSON.stringify(validate.result) : validate.result,
								"status": "SUCCESS" 
							})
							setCodeModalOpen(true);
						}}
					>
						<Tooltip
							color="primary"
							title="Expand result window"
							placement="top"
							style={{ zIndex: 10011 }}
						>
							<ArrowLeftIcon style={{ color: "white" }} />
						</Tooltip>
					</IconButton>
					<ReactJson
							src={validate.result}
							theme={theme.palette.jsonTheme}
							style={theme.palette.reactJsonStyle}
							collapsed={true}
							enableClipboard={(copy) => {
								handleReactJsonClipboard(copy);
							}}
							displayDataTypes={false}
							onSelect={(select) => {
								HandleJsonCopy(validate.result, select, "exec");
							}}
							name={"Execution Argument"}
						/>
				</div>
      )
    }

    return (
      <div>
        <h3>Execution Argument</h3>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {executionData.execution_argument}
        </div>
      </div>
    );
  };

  const getExecutionSourceImage = (execution) => {
    // This is the playbutton at 150x150
    const defaultImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACOCAMAAADkWgEmAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAWlBMVEX4Wj69TDgmKCvkVTwlJyskJiokJikkJSkjJSn4Ykf+6+f5h3L////8xLr5alH/9fT7nYz4Wz/919H5cVn/+vr8qpv4XUL94d35e2X//v38t6v4YUbkVDy8SzcVIzHLAAAAAWJLR0QMgbNRYwAAAAlwSFlzAAARsAAAEbAByCf1VAAAAAd0SU1FB+QGGgsvBZ/GkmwAAAFKSURBVHja7dlrTgMxDEXhFgpTiukL2vLc/zbZQH5N7MmReu4KPmlGN4m9WgGzfhgtaOZxM1rQztNoQDvPowHtTKMB7WxHA2TJkiVLlixIZMmSRYgsWbIIkSVLFiGyZMkiRNZirBcma/eKZEW87ZGsOBxPRFbE+R3Jio/LlciKuH0iWfH1/UNkRSR3RRYruSvyWKldkcjK7IpUVl5X5LLSuiKbldQV6aycrihgZXRFCau/K2pY3V1RxersijJWX1cUsnq6opLV0RW1rNldUc2a2RXlrHldsQBrTlfcLwv5EZm/PLIgkHXKPHyQRzXzYoO8BjIvzcgnBvJBxny+Ih/7zNEIcpDEHLshh5TIkS5zAI5cFzCXK8hVFHNxh1xzQpfC0BV6XWTJkkWILFmyCJElSxYhsmTJIkSWLFmEyJIlixBZsmQB8stk/U3/Yb49pVcDMg4AAAAldEVYdGRhdGU6Y3JlYXRlADIwMjAtMDYtMjZUMTE6NDc6MDUrMDI6MDD8QCPmAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIwLTA2LTI2VDExOjQ3OjA1KzAyOjAwjR2bWgAAAABJRU5ErkJggg==";
    const size = 40;
    if (
      execution.execution_source === undefined ||
      execution.execution_source === null ||
      execution.execution_source.length === 0
    ) {
      return (
        <img
          alt="default"
          src={defaultImage}
          style={{ width: size, height: size }}
        />
      );
    }

    if (execution.execution_source === "webhook") {
      return (
        <img
          alt={"webhook"}
          src={
            triggers.find((trigger) => trigger.trigger_type === "WEBHOOK")
              .large_image
          }
          style={{ width: size, height: size }}
        />
      );
    } else if (execution.execution_source === "outlook") {
      return (
        <img
          alt={"email"}
          src={
            triggers.find((trigger) => trigger.trigger_type === "EMAIL")
              .large_image
          }
          style={{ width: size, height: size }}
        />
      );
    } else if (execution.execution_source === "schedule") {
      return (
        <img
          alt={"schedule"}
          src={
            triggers.find((trigger) => trigger.trigger_type === "SCHEDULE")
              .large_image
          }
          style={{ width: size, height: size }}
        />
      );
    } else if (execution.execution_source === "EMAIL") {
      return (
        <img
          alt={"email"}
          src={
            triggers.find((trigger) => trigger.trigger_type === "EMAIL")
              .large_image
          }
          style={{ width: size, height: size }}
        />
      );
    }

    if (
      execution.execution_parent !== null &&
      execution.execution_parent !== undefined &&
      execution.execution_parent.length > 0
    ) {
      return (
        <img
          alt={"parent workflow"}
          src={
            triggers.find((trigger) => trigger.trigger_type === "SUBFLOW")
              .large_image
          }
          style={{ width: size, height: size }}
        />
      );
    }

    return (
      <img
        alt={execution.execution_source}
        src={defaultImage}
        style={{ width: size, height: size }}
      />
    );
  };

  const handleReactJsonClipboard = (copy) => {
    console.log("COPY: ", copy);

    const elementName = "copy_element_shuffle";
    var copyText = document.getElementById(elementName);
    if (copyText !== null && copyText !== undefined) {
      if (
        copy.namespace !== undefined &&
        copy.name !== undefined &&
        copy.src !== undefined
      ) {
        copy = copy.src;
      }

      const clipboard = navigator.clipboard;
      if (clipboard === undefined) {
        alert.error("Can only copy over HTTPS (port 3443)");
        return;
      }

      var stringified = JSON.stringify(copy);
      if (stringified.startsWith('"') && stringified.endsWith('"')) {
        stringified = stringified.substring(1, stringified.length - 1);
      }

      navigator.clipboard.writeText(stringified);
      copyText.select();
      copyText.setSelectionRange(0, 99999); /* For mobile devices */

      /* Copy the text inside the text field */
      document.execCommand("copy");

      console.log("COPYING!");
			alert.info("Copied value to clipboard, NOT json path.")
    } else {
      console.log("Failed to copy from " + elementName + ": ", copyText);
    }
  };

  const HandleJsonCopy = (base, copy, base_node_name) => {
    if (typeof copy.name === "string") {
      copy.name = copy.name.replaceAll(" ", "_");
    }

		//lol
		if (typeof base === 'object' || typeof base === 'dict') {
			base = JSON.stringify(base)
		} 

		if (base_node_name === "execution_argument" || base_node_name === "Execution Argument") {
			base_node_name = "exec"
		}

    console.log("COPY: ", base_node_name, copy);

    //var newitem = JSON.parse(base);
		var newitem = validateJson(base).result

    to_be_copied = "$" + base_node_name.toLowerCase().replaceAll(" ", "_");
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

    if (newitem !== undefined && newitem !== null) {
      newitem = newitem[copy.name];
      if (!isNaN(copy.name)) {
        to_be_copied += ".#";
      } else {
        to_be_copied += "." + copy.name;
      }
    }

    to_be_copied.replaceAll(" ", "_");
    const elementName = "copy_element_shuffle";
    var copyText = document.getElementById(elementName);
    if (copyText !== null && copyText !== undefined) {
      console.log("NAVIGATOR: ", navigator);
      const clipboard = navigator.clipboard;
      if (clipboard === undefined) {
        alert.error("Can only copy over HTTPS (port 3443)");
        return;
      }

      navigator.clipboard.writeText(to_be_copied);
      copyText.select();
      copyText.setSelectionRange(0, 99999); /* For mobile devices */

      /* Copy the text inside the text field */
      document.execCommand("copy");
      console.log("COPYING!");
			alert.info("Copied JSON path to clipboard.")
    } else {
      console.log("Couldn't find element ", elementName);
    }
  }

	// Not used because of issue with state updates.
	const ShowReactJsonField = (props) => {
		const { validate, jsonValue, collapsed, label, autocomplete } = props

		const [parsedCollapse, setParsedCollapse] = React.useState(collapsed)
		const [open, setOpen] = React.useState(false);
		const [anchorPosition, setAnchorPosition] = React.useState({
			top: 750,
			left: 16,
		});

		const isFirstRender = React.useRef(true)
  	useEffect(() => {
			console.log("IN useeffectt "+autocomplete)

			if (isFirstRender.current) {
				isFirstRender.current = false;
				console.log("IN useeffectt (2)"+collapsed)
				return;
			}
		})
		/*
		componentWillUpdate = (nextProps, nextState) => {
			console.log(nextProps, nextState)
			  //nextState.value = nextProps.a + nextProps.b;
		}
		*/

		const jsonRef = React.useRef()

		return (
			<span>
				<ReactJson
					ref={jsonRef}
					src={validate.result}
					theme={theme.palette.jsonTheme}
					style={theme.palette.reactJsonStyle}
					collapsed={parsedCollapse}
					shouldCollapse={(field) => {
						console.log("FIELD: ", field)	
					}}
					enableClipboard={(copy) => {
						handleReactJsonClipboard(copy);
					}}
					displayDataTypes={false}
					onClick={(event) => {
						const pos = {
							top: event.screenX,
							left: event.screenY,
						}

						console.log("POS CLICK: ", pos)

						setAnchorPosition(pos)
					}}
					onSelect={(select) => {
						setOpen(true)
        	
						setTimeout(() => {
							setOpen(false)
						}, 2500)

						//setAnchorPosition({
						//	top: 300,
						//	right: 300,
						//})
						//setAnchorEl(jsonRef.current)
						HandleJsonCopy(jsonValue, select, autocomplete);
						console.log("SELECTED!: ", select);
					}}
					name={label}
				/>
				{anchorPosition !== null ?
					<Popover
						id="mouse-over-popover-right"
						sx={{
							pointerEvents: 'none',
						}}
						open={open}
						anchorReference="anchorPosition"
						anchorPosition={anchorPosition}
						style={{zIndex: 50000,}}
						onClose={(event) => {
							setAnchorPosition({
								top: 750,
								left: 16,
							})
						}}
						disableRestoreFocus
					>
						<Typography style={{padding: 5 }}>
							Copying 
						</Typography>
					</Popover>
				: null}
			</span>
		)
	}

	const ShowCopyingTooltip = () => {
    const [showCopying, setShowCopying] = React.useState(true)

		if (!showCopying) {
			return false	
		}
		
		return (
			<Tooltip title={"Copying"} placement="left-start">
				<div />
			</Tooltip>
		)
	}

	var executionDelay = -75
  const executionModal = (
		<Drawer
      anchor={"right"}
      open={executionModalOpen}
      onClose={() => {
				setExecutionModalOpen(false)
			}}
      style={{ resize: "both", overflow: "auto", zIndex: 10005 }}
      hideBackdrop={false}
			variant="temporary"
			BackdropProps={{
				style: {
					backgroundColor: "transparent",
				}
			}}
      PaperProps={{
        style: {
          resize: "both",
          overflow: "auto",
          minWidth: isMobile ? "100%" : 420,
          maxWidth: isMobile ? "100%" : 420,
          backgroundColor: "#1F2023",
          color: "white",
          fontSize: 18,
          zIndex: 10005,
					borderLeft: theme.palette.defaultBorder,
        },
      }}
    >
			{isMobile ? 
				<Tooltip
					title="Close window"
					placement="top"
					style={{ zIndex: 10011 }}
				>
					<IconButton
						style={{ zIndex: 5000, position: "absolute", top: 10 , right: 10 }}
						onClick={(e) => {
							e.preventDefault();
							setExecutionModalOpen(false)
						}}
					>
						<CloseIcon style={{ color: "white" }} />
					</IconButton>
				</Tooltip>
			: null}
      {executionModalView === 0 ? (
        <div style={{ padding: isMobile ? "0px 0px 0px 10px" : 25 }}>
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="›"
            style={{ color: "white", fontSize: 16 }}
          >
            <h2 style={{ color: "rgba(255,255,255,0.5)" }}>
              <DirectionsRunIcon style={{ marginRight: 10 }} />
              All Executions
            </h2>
          </Breadcrumbs>
          <Button
            style={{ borderRadius: "0px" }}
            variant="outlined"
            fullWidth
            onClick={() => {
              getWorkflowExecution(props.match.params.key, "");
            }}
            color="primary"
          >
            <CachedIcon style={{ marginRight: 10 }} />
            Refresh executions
          </Button>
          <Divider
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              marginTop: 10,
              marginBottom: 10,
            }}
          />
          {workflowExecutions.length > 0 ? (
            <div>
              {workflowExecutions.map((data, index) => {
								executionDelay += 50

                const statusColor =
                  data.status === "FINISHED"
                    ? green
                    : data.status === "ABORTED" || data.status === "FAILED"
                    ? "red"
                    : yellow;
                const resultsLength =
                  data.results !== undefined && data.results !== null
                    ? data.results.length
                    : 0;

                const timestamp = new Date(data.started_at * 1000)
                  .toISOString()
                  .split(".")[0]
                  .split("T")
                  .join(" ");

                var calculatedResult =
                  data.workflow.actions !== undefined &&
                  data.workflow.actions !== null
                    ? data.workflow.actions.length
                    : 0;
                for (var key in data.workflow.triggers) {
                  const trigger = data.workflow.triggers[key];
                  if (
                    (trigger.app_name === "User Input" &&
                      trigger.trigger_type === "USERINPUT") ||
                    (trigger.app_name === "Shuffle Workflow" &&
                      trigger.trigger_type === "SUBFLOW")
                  ) {
                    calculatedResult += 1;
                  }
                }

                return (
									<Zoom key={index} in={true} style={{ transitionDelay: `${executionDelay}ms` }}>
										<div>
                  		<Tooltip
                  		  key={data.execution_id}
                  		  title={data.result}
                  		  placement="left-start"
                  		  style={{ zIndex: 10010 }}
                  		>
                  		  <Paper
                  		    elevation={5}
                  		    key={data.execution_id}
                  		    square
                  		    style={executionPaperStyle}
                  		    onMouseOver={() => {}}
                  		    onMouseOut={() => {}}
                  		    onClick={() => {
                  		      if (
                  		        (data.result === undefined ||
                  		          data.result === null ||
                  		          data.result.length === 0) &&
                  		        data.status !== "FINISHED" &&
                  		        data.status !== "ABORTED"
                  		      ) {
                  		        start();
                  		        setExecutionRunning(true);
                  		        setExecutionRequestStarted(false);
                  		      }

														// Ensuring we have the latest version of the result.
														// Especially important IF the result is > 1 Mb in cloud
														var checkStarted = false
														if (isCloud && data.results !== undefined && data.results !== null && data.results.length > 0) {

															if (data.execution_argument !== undefined && data.execution_argument !== null && data.execution_argument.includes("too large")) {
																setExecutionData({});
																checkStarted = true 
																start();
																setExecutionRunning(true);
																setExecutionRequestStarted(false);
															} else {
															for (var key in data.results) {
																if (data.results[key].status !== "SUCCESS") {
																	continue
																}

																if (data.results[key].result.includes("too large")) {
                  		      			setExecutionData({});
																	checkStarted = true 
																	start();
																	setExecutionRunning(true);
																	setExecutionRequestStarted(false);
																	break
																}
															}
															}
														}

                  		      const cur_execution = {
                  		        execution_id: data.execution_id,
                  		        authorization: data.authorization,
                  		      };
                  		      setExecutionRequest(cur_execution);
                  		      setExecutionModalView(1);

														if (!checkStarted) {
                  		      	handleUpdateResults(data, cur_execution);
                  		      	setExecutionData(data);
														}
                  		    }}
                  		  >
                  		    <div style={{ display: "flex", flex: 1 }}>
                  		      <div
                  		        style={{
                  		          marginLeft: 0,
                  		          width: lastExecution === data.execution_id ? 4 : 2,
                  		          backgroundColor: statusColor,
                  		          marginRight: 5,
                  		        }}
                  		      />
                  		      <div
                  		        style={{
                  		          height: "100%",
                  		          width: 40,
                  		          borderColor: "white",
                  		          marginRight: 15,
                  		        }}
                  		      >
                  		        {getExecutionSourceImage(data)}
                  		      </div>
                  		      <div
                  		        style={{
                  		          marginTop: "auto",
                  		          marginBottom: "auto",
                  		          marginRight: 15,
                  		          fontSize: 13,
                  		        }}
                  		      >
                  		        {timestamp}
                  		      </div>
                  		      {data.workflow.actions !== null ? (
                  		        <Tooltip
                  		          color="primary"
                  		          title={resultsLength + " actions ran"}
                  		          placement="top"
                  		        >
                  		          <div
                  		            style={{
                  		              marginRight: 10,
                  		              marginTop: "auto",
                  		              marginBottom: "auto",
                  		            }}
                  		          >
                  		            {resultsLength}/{calculatedResult}
                  		          </div>
                  		        </Tooltip>
                  		      ) : null}
                  		    </div>
                  		    <Tooltip title={"Inspect execution"} placement="top">
                  		      {lastExecution === data.execution_id ? (
                  		        <KeyboardArrowRightIcon
                  		          style={{
                  		            color: "#f85a3e",
                  		            marginTop: "auto",
                  		            marginBottom: "auto",
                  		          }}
                  		        />
                  		      ) : (
                  		        <KeyboardArrowRightIcon
                  		          style={{ marginTop: "auto", marginBottom: "auto" }}
                  		        />
                  		      )}
                  		    </Tooltip>
                  		  </Paper>
                  		</Tooltip>
										</div>
									</Zoom>
                );
              })}
            </div>
          ) : (
            <div>There are no executions yet</div>
          )}
        </div>
      ) : (
        <div style={{ padding: isMobile ? "0px 10px 25px 10px" : "25px 15px 25px 15px", maxWidth: isMobile ? "100%" : 365, overflowX: "hidden" }}>
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="›"
            style={{ color: "white", fontSize: 16 }}
          >
            <span
              style={{ color: "rgba(255,255,255,0.5)", display: "flex" }}
              onClick={() => {
                setExecutionRunning(false);
                stop();
                getWorkflowExecution(props.match.params.key, "");
                setExecutionModalView(0);
                setLastExecution(executionData.execution_id);
              }}
            >
              <IconButton
                style={{
                  paddingLeft: 0,
                  marginTop: "auto",
                  marginBottom: "auto",
                }}
                onClick={() => {}}
              >
                <ArrowBackIcon style={{ color: "rgba(255,255,255,0.5)" }} />
            	</IconButton>
							<h2
								style={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
								onClick={() => {}}
							>
								See other Executions
							</h2>
            </span>
          </Breadcrumbs>
          <Divider
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              marginTop: 10,
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", marginLeft: 10, }}>
            <h2>Execution info</h2>
            <Tooltip
              color="primary"
              title="Rerun workflow"
              placement="top"
              style={{ zIndex: 50000}}
            >
              <span style={{}}>
                <Button
                  color="primary"
                  style={{ float: "right", marginTop: 20, marginLeft: 10 }}
                  onClick={() => {
                    //console.log("DATA: ", executionData);
                    executeWorkflow(
                      executionData.execution_argument,
                      executionData.start,
                      lastSaved
                    );
                    setExecutionModalOpen(false);
                  }}
                >
                  <CachedIcon style={{}} />
                </Button>
              </span>
            </Tooltip>
            {executionData.status === "EXECUTING" ? (
              <Tooltip
                color="primary"
                title="Abort workflow"
                placement="top"
                style={{ zIndex: 50000 }}
              >
                <span style={{}}>
                  <Button
                    color="primary"
                    style={{ float: "right", marginTop: 20, marginLeft: 10 }}
                    onClick={() => {
                      abortExecution();
                    }}
                  >
                    <PauseIcon style={{}} />
                  </Button>
                </span>
              </Tooltip>
            ) : null}
          </div>
          {executionData.status !== undefined &&
          executionData.status.length > 0 ? (
            <div style={{ display: "flex", marginLeft: 10, }}>
              <Typography variant="body1">
                <b>Status &nbsp;&nbsp;</b>
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {executionData.status}
              </Typography>
            </div>
          ) : null}
          {executionData.execution_source !== undefined &&
          executionData.execution_source !== null &&
          executionData.execution_source.length > 0 &&
          executionData.execution_source !== "default" ? (
            <div style={{ display: "flex", marginLeft: 10, }}>
              <Typography variant="body1">
                <b>Source &nbsp;&nbsp;</b>
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {executionData.execution_parent !== null &&
                executionData.execution_parent !== undefined &&
                executionData.execution_parent.length > 0 ? (
                  executionData.execution_source === props.match.params.key ? (
                    <span
                      style={{ cursor: "pointer", color: "#f85a3e" }}
                      onClick={(event) => {
                        getWorkflowExecution(
                          props.match.params.key,
                          executionData.execution_parent
                        );
                      }}
                    >
                      Parent Execution
                    </span>
                  ) : (
                    <a
                      rel="noopener noreferrer"
                      href={`/workflows/${executionData.execution_source}?view=executions&execution_id=${executionData.execution_parent}`}
                      target="_blank"
                      style={{ textDecoration: "none", color: "#f85a3e" }}
                    >
                      Parent Workflow
                    </a>
                  )
                ) : (
                  executionData.execution_source
                )}
              </Typography>
            </div>
          ) : null}
          {executionData.started_at !== undefined ? (
            <div style={{ display: "flex", marginLeft: 10,  }}>
              <Typography variant="body1">
                <b>Started &nbsp;&nbsp;</b>
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {new Date(executionData.started_at * 1000).toISOString()}
              </Typography>
            </div>
          ) : null}
          {executionData.completed_at !== undefined &&
          executionData.completed_at !== null &&
          executionData.completed_at > 0 ? (
            <div style={{ display: "flex", marginLeft: 10, }}>
              <Typography variant="body1" onClick={() => {
								console.log(executionData)	
							}}>
                <b>Finished &nbsp;</b>
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {new Date(executionData.completed_at * 1000).toISOString()}
              </Typography>
            </div>
          ) : null}
          <div style={{ marginTop: 10 }} />
          {executionData.execution_argument !== undefined &&
          executionData.execution_argument.length > 0
            ? parsedExecutionArgument()
            : null}
          <Divider
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              marginTop: 15,
              marginBottom: 30,
            }}
          />
          {executionData.results !== undefined &&
          executionData.results !== null &&
          executionData.results.length > 1 &&
          executionData.results.find(
            (result) =>
              result.status === "SKIPPED" 
          ) ? (
            <FormControlLabel
              style={{ color: "white", marginBottom: 10 }}
              label={
                <div style={{ color: "white" }}>
                  Show skipped actions
                </div>
              }
              control={
                <Switch
                  checked={showSkippedActions}
                  onChange={() => {
                    setShowSkippedActions(!showSkippedActions);
                  }}
                />
              }
            />
          ) : null}
          <div style={{ display: "flex", marginTop: 10, marginBottom: 30 }}>
            <div>
              {executionData.status !== undefined &&
              executionData.status !== "ABORTED" &&
              executionData.status !== "FINISHED" &&
              executionData.status !== "FAILURE" &&
              executionData.status !== "WAITING" &&
              !(
                executionData.results === undefined ||
                executionData.results === null ||
                (executionData.results.length === 0 && // probably ment to be around the or's
                  executionData.status === "EXECUTING")
              ) ? (
                <CircularProgress style={{ marginLeft: 20 }} />
              ) : null}
            </div>
          </div>
          {executionData.results === undefined ||
          executionData.results === null ||
          (executionData.results.length === 0 &&
            executionData.status === "EXECUTING") ? (
            <CircularProgress />
          ) : (
            executionData.results.map((data, index) => {
              if (executionData.results.length !== 1 && !showSkippedActions && (data.status === "SKIPPED") ) {
                return null;
              }

              // FIXME: The latter replace doens't really work if ' is used in a string
              var showResult = data.result.trim();
              const validate = validateJson(showResult);

              const curapp = apps.find(
                (a) =>
                  a.name === data.action.app_name &&
                  a.app_version === data.action.app_version
              );
              const imgsize = 50;
              const statusColor =
                data.status === "FINISHED" || data.status === "SUCCESS"
                  ? green
                  : data.status === "ABORTED" || data.status === "FAILURE"
                  ? "red"
                  : yellow;

              var imgSrc = curapp === undefined ? "" : curapp.large_image;
              if (
                imgSrc.length === 0 &&
                workflow.actions !== undefined &&
                workflow.actions !== null
              ) {
                // Look for the node in the workflow
                const action = workflow.actions.find(
                  (action) => action.id === data.action.id
                );
                if (action !== undefined && action !== null) {
                  imgSrc = action.large_image;
                }
              }

              var actionimg =
                curapp === null ? null : (
                  <img
                    alt={data.action.app_name}
                    src={imgSrc}
                    style={{
                      marginRight: 20,
                      width: imgsize,
                      height: imgsize,
                      border: `2px solid ${statusColor}`,
                      borderRadius:
                        executionData.start === data.action.id ? 25 : 5,
                    }}
                  />
                );

              if (triggers.length > 2) {
                if (data.action.app_name === "shuffle-subflow") {
                  const parsedImage = triggers[2].large_image;
                  actionimg = (
                    <img
                      alt={"Shuffle Subflow"}
                      src={parsedImage}
                      style={{
                        marginRight: 20,
                        width: imgsize,
                        height: imgsize,
                        border: `2px solid ${statusColor}`,
                        borderRadius:
                          executionData.start === data.action.id ? 25 : 5,
                      }}
                    />
                  );
                }

                if (data.action.app_name === "User Input") {
                  actionimg = (
                    <img
                      alt={"Shuffle Subflow"}
                      src={triggers[3].large_image}
                      style={{
                        marginRight: 20,
                        width: imgsize,
                        height: imgsize,
                        border: `2px solid ${statusColor}`,
                        borderRadius:
                          executionData.start === data.action.id ? 25 : 5,
                      }}
                    />
                  );
                }
              }

              if (
                data.action.app_name === "Shuffle Tools" &&
                data.action.id !== undefined &&
                cy !== undefined
              ) {
                const nodedata = cy.getElementById(data.action.id).data();
                if (
                  nodedata !== undefined &&
                  nodedata !== null &&
                  nodedata.fillstyle === "linear-gradient"
                ) {
                  var imgStyle = {
                    marginRight: 20,
                    width: imgsize,
                    height: imgsize,
                    border: `2px solid ${statusColor}`,
                    borderRadius:
                      executionData.start === data.action.id ? 25 : 5,
                    background: `linear-gradient(to right, ${nodedata.fillGradient})`,
                  };

                  actionimg = (
                    <img
                      alt={nodedata.label}
                      src={nodedata.large_image}
                      style={imgStyle}
                    />
                  );
                }
              }

              if (validate.valid && typeof validate.result === "string") {
                validate.result = JSON.parse(validate.result);
              }

              if (validate.valid && typeof validate.result === "object") {
                if (
                  validate.result.result !== undefined &&
                  validate.result.result !== null
                ) {
                  try {
                    validate.result.result = JSON.parse(validate.result.result);
                  } catch (e) {
                    //console.log("ERROR PARSING: ", e)
                  }
                }
              }


							var similarActionsView = null
							if (data.similar_actions !== undefined && data.similar_actions !== null) {
								var minimumMatch = 85
								var matching_executions = []
								for (var k in data.similar_actions){
									if (data.similar_actions.hasOwnProperty(k)) {
										if (data.similar_actions[k].similarity > minimumMatch) {
											matching_executions.push(data.similar_actions[k].execution_id)
										}
									}
								}

								if (matching_executions.length !== 0) {
									var parsed_url = matching_executions.join(",")

									similarActionsView = 
										<Tooltip
											color="primary"
											title="See executions with similar results (not identical)"
											placement="top"
											style={{ zIndex: 50000, marginLeft: 50,}}
										>
											<IconButton
													style={{
														marginTop: "auto",
														marginBottom: "auto",
														height: 30,
														paddingLeft: 0,
														width: 30,
													}}
													onClick={() => {
														navigate(`?execution_highlight=${parsed_url}`)
													}}
												>
													<PreviewIcon style={{ color: "rgba(255,255,255,0.5)" }}/>
											</IconButton>
										</Tooltip>
								}
							}


              return (
                <div
                  key={index}
                  style={{
                    marginBottom: 20,
                    border:
                      data.action.sub_action === true
                        ? "1px solid rgba(255,255,255,0.3)" 
                        : "1px solid rgba(255,255,255, 0.3)",
                    borderRadius: theme.palette.borderRadius,
                    backgroundColor: theme.palette.inputColor,
										padding: "15px 10px 10px 10px", 
										overflow: "hidden",
                  }}
                  onMouseOver={() => {
                    var currentnode = cy.getElementById(data.action.id);
                    if (currentnode !== undefined && currentnode !== null && currentnode.length !== 0) {
                      currentnode.addClass("shuffle-hover-highlight");
                    }

										// Add a hover highlight

										//var copyText = document.getElementById(
										//	"copy_element_shuffle"
										//)
                  }}
                  onMouseOut={() => {
                    var currentnode = cy.getElementById(data.action.id);
                    if (currentnode.length !== 0) {
                      currentnode.removeClass("shuffle-hover-highlight");
                    }
                  }}
                >
                  <div style={{ display: "flex" }}>
                    <div style={{ display: "flex", marginBottom: 15 }}>
                      <IconButton
                        style={{
                          marginTop: "auto",
                          marginBottom: "auto",
                          height: 30,
                          paddingLeft: 0,
                          width: 30,
                        }}
                        onClick={() => {
                          setSelectedResult(data);
                          setCodeModalOpen(true);
                        }}
                      >
                        <Tooltip
                          color="primary"
                          title="Expand result window"
                          placement="top"
                          style={{ zIndex: 50000 }}
                        >
                          <ArrowLeftIcon style={{ color: "white" }} />
                        </Tooltip>
                      </IconButton>
                      {actionimg}
                      <div>
                        <div
                          style={{
                            fontSize: 24,
                            marginTop: "auto",
                            marginBottom: "auto",
                          }}
                        >
                          <b>{data.action.label}</b>
                        </div>
                        <div style={{ fontSize: 14 }}>
                          <Typography variant="body2" color="textSecondary">
                            {data.action.name}
                          </Typography>
                        </div>
                      </div>
                    </div>
                    {data.action.app_name === "shuffle-subflow" &&
                    validate.result.success !== undefined &&
                    validate.result.success === true ? (
                      <span
                        style={{ flex: 10, float: "right", textAlign: "right" }}
                      >
                        {validate.valid &&
                        data.action.parameters !== undefined &&
                        data.action.parameters !== null &&
                        data.action.parameters.length > 0 ? (
                          data.action.parameters[0].value ===
                          props.match.params.key ? (
                            <span
                              style={{ cursor: "pointer", color: "#f85a3e" }}
                              onClick={(event) => {
                                getWorkflowExecution(
                                  props.match.params.key,
                                  validate.result.execution_id
                                );
                              }}
                            >
                            	<OpenInNewIcon />
                            </span>
                          ) : (
                            <a
                              rel="noopener noreferrer"
                              href={`/workflows/${data.action.parameters[0].value}?view=executions&execution_id=${validate.result.execution_id}`}
                              target="_blank"
                              style={{
                                textDecoration: "none",
                                color: "#f85a3e",
                              }}
                              onClick={(event) => {}}
                            >
                              <OpenInNewIcon />
                            </a>
                          )
                        ) : (
                          ""
                        )}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ marginBottom: 5, display: "flex" }}>
                    <Typography variant="body1">
                      <b>Status&nbsp;</b>
                    </Typography>
                    <Typography variant="body1" color="textSecondary" style={{marginRight: 15,}}>
                      {data.status}
                    </Typography>
										{similarActionsView}
                  </div>
                  {validate.valid ? (
                    <span>
											<ReactJson
												src={validate.result}
												theme={theme.palette.jsonTheme}
												style={theme.palette.reactJsonStyle}
												collapsed={true}
												enableClipboard={(copy) => {
													handleReactJsonClipboard(copy);
												}}
												displayDataTypes={false}
												onSelect={(select) => {
													HandleJsonCopy(showResult, select, data.action.label);
													console.log("SELECTED!: ", select);
												}}
												name={"Results for " + data.action.label}
											/>

                    </span>
                  ) : (
                    <div
                      style={{
                        maxHeight: 250,
                        overflowX: "hidden",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <Typography
                        variant="body1"
                        style={{ display: "inline-block" }}
                      >
                        <b>Result</b>&nbsp;
                      </Typography>
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        style={{ display: "inline-block" }}
                      >
                        {data.result}
                      </Typography>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
		</Drawer>
  );

  // This sucks :)
  const curapp = !codeModalOpen
    ? {}
    : selectedResult.action.app_name === "shuffle-subflow"
    ? triggers[2]
    : selectedResult.action.app_name === "User Input"
    ? triggers[3]
    : apps.find(
        (a) =>
          a.name === selectedResult.action.app_name &&
          a.app_version === selectedResult.action.app_version
      );
  const imgsize = 50;
  const statusColor = !codeModalOpen
    ? "red"
    : selectedResult.status === "FINISHED" ||
      selectedResult.status === "SUCCESS"
    ? green
    : selectedResult.status === "ABORTED" || selectedResult.status === "FAILURE"
    ? "red"
    : yellow;

  const validate = !codeModalOpen
    ? ""
    : validateJson(selectedResult.result.trim());

  if (validate.valid && typeof validate.result === "string") {
    validate.result = JSON.parse(validate.result);
  }

	const AppResultVariable = ({data}) => {
		const [open, setOpen] = React.useState(false)
		const showVariable = data.value.length < 60

		return (
			<div style={{maxWidth: 600, overflowX: "hidden", }}>
				{data.value.length > 60 ? 
					<IconButton
						style={{
							marginBottom: 0, marginTop: 5, cursor: "pointer", 
							padding: 3,
							border: "1px solid rgba(255,255,255,0.3)",
							borderRadius: theme.palette.borderRadius,
						}}
						onClick={() => {
							if (!showVariable) {
								setOpen(!open)
							}
						}}
					>
						<Typography
							variant="body1"
							style={{}}
						>
							<b>{data.name}</b> {showVariable ? data.value : null}
						</Typography>
					</IconButton>
				: 
					<Typography
						variant="body1"
						style={{}}
					>
						<b>{data.name}</b>: {showVariable ? data.value : null}
					</Typography>
				}
				{open ? 
					<Typography
						variant="body2"
						style={{
							whiteSpace: 'pre-line',
						}}
						color="textSecondary"
					>
						{data.value}
					</Typography>
				: null}
			</div>
		)
	}

  var draggingDisabled = false;
  const codePopoutModal = !codeModalOpen ? null : (
      <Dialog
				PaperComponent={PaperComponent}
				aria-labelledby="draggable-dialog-title"
        disableEnforceFocus={true}
        style={{ pointerEvents: "none" }}
        hideBackdrop={true}
        open={codeModalOpen}
        PaperProps={{
          style: {
            pointerEvents: "auto",
            backgroundColor: inputColor,
            color: "white",
            minWidth: isMobile ? "90%" : 650,
            padding: 30,
            maxHeight: 550,
            overflowY: "auto",
            overflowX: "hidden",
            zIndex: 10012,
						border: theme.palette.defaultBorder,
          },
        }}
      >
        <span id="top_bar">
          <Tooltip
            title="Find successful execution"
            placement="top"
            style={{ zIndex: 50000 }}
          >
            <IconButton
              style={{
                zIndex: 5000,
                position: "absolute",
                top: 34,
                right: 170,
              }}
              onClick={(e) => {
                e.preventDefault();
                for (var key in workflowExecutions) {
                  const execution = workflowExecutions[key];
                  const result = execution.results.find(
                    (data) =>
                      data.status === "SUCCESS" &&
                      data.action.id === selectedResult.action.id
                  );
                  if (result !== undefined) {
                    setSelectedResult(result);
                    setUpdate(Math.random());
                    break;
                  }
                }
              }}
            >
              <DoneIcon style={{ color: "white" }} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title="Find failed execution"
            placement="top"
            style={{ zIndex: 50000 }}
          >
            <IconButton
              style={{
                zIndex: 5000,
                position: "absolute",
                top: 34,
                right: 136,
              }}
              onClick={(e) => {
                e.preventDefault();
                for (var key in workflowExecutions) {
                  const execution = workflowExecutions[key];
                  const result = execution.results.find(
                    (data) =>
                      data.action.id === selectedResult.action.id &&
                      data.status !== "SUCCESS" &&
                      data.status !== "SKIPPED" &&
                      data.status !== "WAITING"
                  );
                  if (result !== undefined) {
                    setSelectedResult(result);
                    setUpdate(Math.random());
                    break;
                  }
                }
              }}
            >
              <ErrorIcon style={{ color: "white" }} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title="Explore execution"
            placement="top"
            style={{ zIndex: 10011 }}
          >
            <IconButton
              style={{ zIndex: 5000, position: "absolute", top: 34, right: 98 }}
              onClick={(e) => {
                e.preventDefault();
                const executionIndex = workflowExecutions.findIndex(
                  (data) => data.execution_id === selectedResult.execution_id
                );
                if (executionIndex !== -1) {
                  setExecutionModalOpen(true);
                  setExecutionModalView(1);
                  setExecutionData(workflowExecutions[executionIndex]);
                }
              }}
            >
              <VisibilityIcon style={{ color: "white" }} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title="Close window"
            placement="top"
            style={{ zIndex: 10011 }}
          >
            <IconButton
              style={{ zIndex: 5000, position: "absolute", top: 34, right: 34 }}
              onClick={(e) => {
                e.preventDefault();
                setCodeModalOpen(false);
              }}
            >
              <CloseIcon style={{ color: "white" }} />
            </IconButton>
          </Tooltip>
        </span>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", marginBottom: 15 }}>
            {curapp === null ? null : (
              <img
                alt={selectedResult.app_name}
                src={curapp === undefined ? theme.palette.defaultImage : curapp.large_image}
                style={{
                  marginRight: 20,
                  width: imgsize,
                  height: imgsize,
                  border: `2px solid ${statusColor}`,
                }}
              />
            )}

            <div>
              <div
    						id="draggable-dialog-title"
                style={{
                  fontSize: 24,
                  marginTop: "auto",
                  marginBottom: "auto",
									cursor: "move",
                }}
              >
                <b>{selectedResult.action.label}</b>
              </div>
              <div style={{ fontSize: 14 }}>{selectedResult.action.name}</div>
            </div>
          </div>
          <div style={{ marginBottom: 5 }}>
            <b>Status </b> {selectedResult.status}
          </div>
          {validate.valid ? (
						<ReactJson
							src={validate.result}
							theme={theme.palette.jsonTheme}
							style={theme.palette.reactJsonStyle}
							collapsed={selectedResult.result.length < 10000 ? false : true}
							enableClipboard={(copy) => {
								handleReactJsonClipboard(copy);
							}}
							displayDataTypes={false}
							onSelect={(select) => {
								HandleJsonCopy(validate.result, select, selectedResult.action.label);
							}}
							name={"Results for " + selectedResult.action.label}
						/>
          ) : (
            <div>
              <b>Result</b>&nbsp;
              <span
                onClick={() => {
                  console.log("IN HERE TO CLICK");
                  to_be_copied = selectedResult.result;
                  var copyText = document.getElementById(
                    "copy_element_shuffle"
                  );
                  console.log("PRECOPY: ", to_be_copied);
                  if (copyText !== null && copyText !== undefined) {
                    console.log("COPY: ", copyText);
                    console.log("NAVIGATOR: ", navigator);
                    const clipboard = navigator.clipboard;
                    if (clipboard === undefined) {
                      alert.error("Can only copy over HTTPS (port 3443)");
                      return;
                    }

                    navigator.clipboard.writeText(to_be_copied);

                    copyText.select();
                    copyText.setSelectionRange(
                      0,
                      99999
                    ); /* For mobile devices */

                    /* Copy the text inside the text field */
                    document.execCommand("copy");
                  } else {
                    console.log(
                      "Failed to copy. copy_element_shuffle is undefined"
                    );
                  }
                }}
              >
                {selectedResult.result}
              </span>
            </div>
          )}
          <div>
            {selectedResult.action.parameters !== null &&
            selectedResult.action.parameters !== undefined ? (
              <div>
                <Divider
                  style={{
                    backgroundColor: theme.palette.surfaceColor,
                    marginTop: 15,
                    marginBottom: 15,
                  }}
                />
                <Typography
                  variant="h6"
                  style={{ marginBottom: 0, marginTop: 0 }}
                >
                  Variables <span style={{fontSize: 10}}>(click to expand)</span>
                </Typography>
                {selectedResult.action.parameters.map((data, index) => {
                  if (data.value.length === 0) {
                    return null;
                  }

                  if (
                    data.example !== undefined &&
                    data.example !== null &&
                    data.example.includes("***")
                  ) {
                    return null;
                  }

                  return (
										<AppResultVariable key={index} data={data}/>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </Dialog>
  );

  const newView = (
    <div style={{ color: "white" }}>
			<div
				style={{ display: "flex", borderTop: "1px solid rgba(91, 96, 100, 1)" }}
			>
				{/*isMobile ? null : leftView*/}
				{leftView}
				{workflow.id === undefined ||
				workflow.id === null ||
				appsLoaded === false ? (
					<div
						style={{
							width: bodyWidth - leftBarSize - 15,
							height: 150,
							textAlign: "center",
						}}
					>
						<CircularProgress
							style={{
								marginTop: "30vh",
								height: 35,
								width: 35,
								marginLeft: "auto",
								marginRight: "auto",
							}}
						/>
						<Typography variant="body1" color="textSecondary">
							Loading Workflow
						</Typography>
					</div>
				) : (
					<Fade in={true} timeout={1000} style={{ transitionDelay: `${150}ms` }}>
						<CytoscapeComponent
							elements={elements}
							minZoom={0.35}
							maxZoom={2.0}
							wheelSensitivity={0.25}
							style={{
								width: cytoscapeWidth,
								height: bodyHeight - appBarSize - 5,
								backgroundColor: surfaceColor,
							}}
							stylesheet={cystyle}
							boxSelectionEnabled={true}
							autounselectify={false}
							showGrid={true}
							id="cytoscape_view"
							cy={(incy) => {
								// FIXME: There's something specific loading when
								// you do the first hover of a node. Why is this different?
								//console.log("CY: ", incy)
								setCy(incy);
							}}
						/>
					</Fade>
				)}
			</div>
			{executionModal}
			<RightSideBar
				scrollConfig={scrollConfig}
				setScrollConfig={setScrollConfig}
				selectedAction={selectedAction}
				workflow={workflow}
				setWorkflow={setWorkflow}
				setSelectedAction={setSelectedAction}
				setUpdate={setUpdate}
				selectedApp={selectedApp}
				workflowExecutions={workflowExecutions}
				setSelectedResult={setSelectedResult}
				setSelectedApp={setSelectedApp}
				setSelectedTrigger={setSelectedTrigger}
				setSelectedEdge={setSelectedEdge}
				setCurrentView={setCurrentView}
				cy={cy}
				setAuthenticationModalOpen={setAuthenticationModalOpen}
				setVariablesModalOpen={setVariablesModalOpen}
				setLastSaved={setLastSaved}
				setCodeModalOpen={setCodeModalOpen}
				selectedNameChange={selectedNameChange}
				rightsidebarStyle={rightsidebarStyle}
				showEnvironment={showEnvironment}
				selectedActionEnvironment={selectedActionEnvironment}
				environments={environments}
				setNewSelectedAction={setNewSelectedAction}
				sortByKey={sortByKey}
				appApiViewStyle={appApiViewStyle}
				globalUrl={globalUrl}
				setSelectedActionEnvironment={setSelectedActionEnvironment}
				requiresAuthentication={requiresAuthentication}
			/>
			<BottomCytoscapeBar />
			<TopCytoscapeBar />
    </div>
  );

	const editWorkflowModal = 
		<Dialog
    	  open={editWorkflowDetails}
				PaperComponent={PaperComponent}
				hideBackdrop={true}
				disableEnforceFocus={true}
				disableBackdropClick={true}
				style={{ pointerEvents: "none" }}
				aria-labelledby="draggable-dialog-title"
    	  onClose={() => {
					setEditWorkflowDetails(false)
    	  }}
    	  PaperProps={{
    	    style: {
          	pointerEvents: "auto",
    	      backgroundColor: surfaceColor,
    	      color: "white",
						border: theme.palette.defaultBorder,
						maxWidth: "100%",
						padding: 50, 
    	    },
    	  }}
    	>
				Edit workflow!
		</Dialog>

  const ExecutionVariableModal = (props) => {
		const { variableInfo } = props

		const [newVariableName, setNewVariableName] = React.useState(variableInfo.name !== undefined ? variableInfo.name : "");
		const [newVariableDescription, setNewVariableDescription] = React.useState(variableInfo.description !== undefined ? variableInfo.description : "");
		const [newVariableValue, setNewVariableValue] = React.useState(variableInfo.value !== undefined ? variableInfo.value : "");

		if (!executionVariablesModalOpen) {
			return null
		}

		return (
    	<Dialog
    	  open={executionVariablesModalOpen}
				PaperComponent={PaperComponent}
				hideBackdrop={true}
				disableEnforceFocus={true}
				disableBackdropClick={true}
				style={{ pointerEvents: "none" }}
				aria-labelledby="draggable-dialog-title"
    	  onClose={() => {
    	    setNewVariableName("");
    	    setExecutionVariablesModalOpen(false);
    	  }}
    	  PaperProps={{
    	    style: {
          	pointerEvents: "auto",
    	      backgroundColor: surfaceColor,
    	      color: "white",
						border: theme.palette.defaultBorder,
						maxWidth: "100%",
    	    },
    	  }}
    	>
    	  <FormControl>
    			<DialogTitle id="draggable-dialog-title" style={{cursor: "move",}}>
    	      <span style={{ color: "white" }}>Execution Variable</span>
    	    </DialogTitle>
    	    <DialogContent>
    	      Execution Variables are TEMPORARY variables that you can ony be set
    	      and used during execution. Learn more{" "}
    	      <a
    	        rel="noopener noreferrer"
    	        href="https://shuffler.io/docs/workflows#execution_variables"
    	        target="_blank"
    	        style={{ textDecoration: "none", color: "#f85a3e" }}
    	      >
    	        here
    	      </a>
    	      <TextField
    	        onBlur={(event) => setNewVariableName(event.target.value)}
    	        color="primary"
    	        placeholder="Name"
    	        style={{ marginTop: 25 }}
    	        InputProps={{
    	          style: {
    	            color: "white",
    	          },
    	        }}
    	        margin="dense"
    	        fullWidth
    	        defaultValue={newVariableName}
    	      />
    	    </DialogContent>
    	    <DialogActions>
    	      <Button
    	        style={{ borderRadius: "0px" }}
    	        onClick={() => {
    	          setNewVariableName("");
    	          setExecutionVariablesModalOpen(false);
    	        }}
    	        color="primary"
    	      >
    	        Cancel
    	      </Button>
    	      <Button
    	        style={{ borderRadius: "0px" }}
    	        disabled={newVariableName.length === 0}
							variant="contained"
    	        onClick={() => {
    	          console.log("VARIABLES! ", newVariableName);
    	          if (
    	            workflow.execution_variables === undefined ||
    	            workflow.execution_variables === null
    	          ) {
    	            workflow.execution_variables = [];
    	          }

    	          // try to find one with the same name
    	          const found = workflow.execution_variables.findIndex(
    	            (data) => data.name === newVariableName
    	          );
    	          //console.log(found)
    	          if (found !== -1) {
    	            if (newVariableName.length > 0) {
    	              workflow.execution_variables[found].name = newVariableName;
    	            }
    	          } else {
    	            workflow.execution_variables.push({
    	              name: newVariableName,
    	              description: "An execution variable",
    	              value: "",
    	              id: uuidv4(),
    	            });
    	          }

    	          setExecutionVariablesModalOpen(false);
    	          setNewVariableName("");
    	          setWorkflow(workflow);
    	        }}
    	        color="primary"
    	      >
    	        Submit
    	      </Button>
    	    </DialogActions>
    	    {workflowExecutions.length > 0 ? (
    	      <DialogContent>
    	        <Divider
    	          style={{
    	            backgroundColor: "white",
    	            marginTop: 15,
    	            marginBottom: 15,
    	          }}
    	        />
    	        <b style={{ marginBottom: 10 }}>Values from last 3 executions</b>
    	        {workflowExecutions.slice(0, 3).map((execution, index) => {
    	          if (
    	            execution.execution_variables === undefined ||
    	            execution.execution_variables === null ||
    	            execution.execution_variables === 0
    	          ) {
    	            return null;
    	          }

    	          const variable = execution.execution_variables.find(
    	            (data) => data.name === newVariableName
    	          );
    	          if (variable === undefined || variable.value === undefined) {
    	            return null;
    	          }

    	          return (
    	            <div>
    	              {index + 1}: {variable.value}
    	            </div>
    	          );
    	        })}
    	      </DialogContent>
    	    ) : null}
    	  </FormControl>
    	</Dialog>
		)
	}

  const VariablesModal = (props) => {
		const { setVariableInfo, variableInfo } = props

		const [newVariableName, setNewVariableName] = React.useState(variableInfo.name !== undefined ? variableInfo.name : "");
		const [newVariableDescription, setNewVariableDescription] = React.useState(variableInfo.description !== undefined ? variableInfo.description : "");
		const [newVariableValue, setNewVariableValue] = React.useState(variableInfo.value !== undefined ? variableInfo.value : "");

		if (!variablesModalOpen) {
			return null
		}

		return (
    	<Dialog
				PaperComponent={PaperComponent}
				aria-labelledby="draggable-dialog-title"
				hideBackdrop={true}
				disableEnforceFocus={true}
				disableBackdropClick={true}
				style={{ pointerEvents: "none" }}
    	  open={variablesModalOpen}
    	  onClose={() => {
    	    setNewVariableName("");
    	    setNewVariableDescription("");
    	    setNewVariableValue("");
    	    setVariablesModalOpen(false);
    	  }}
    	  PaperProps={{
    	    style: {
          	pointerEvents: "auto",
    	      backgroundColor: surfaceColor,
    	      color: "white",
						border: theme.palette.defaultBorder,
						maxWidth: isMobile ? bodyWidth-100 : "100%",
    	    },
    	  }}
    	>
    	  <FormControl>
    	    <DialogTitle id="draggable-dialog-title" style={{cursor: "move",}}>
    	      <span style={{ color: "white" }}>Workflow Variable</span>
    	    </DialogTitle>
    	    <DialogContent>
    	      <TextField
    	        onBlur={(event) => setNewVariableName(event.target.value)}
    	        color="primary"
    	        placeholder="Name"
    	        InputProps={{
    	          style: {
    	            color: "white",
    	          },
    	        }}
    	        margin="dense"
    	        fullWidth
    	        defaultValue={newVariableName}
    	      />
    	      <TextField
    	        onBlur={(event) => setNewVariableDescription(event.target.value)}
    	        color="primary"
    	        placeholder="Description"
    	        margin="dense"
    	        fullWidth
    	        InputProps={{
    	          style: {
    	            color: "white",
    	          },
    	        }}
    	        defaultValue={newVariableDescription}
    	      />
    	      <TextField
    	        onChange={(event) => setNewVariableValue(event.target.value)}
    	        rows="6"
    	        multiline
    	        color="primary"
    	        placeholder="Value"
    	        margin="dense"
    	        InputProps={{
    	          style: {
    	            color: "white",
    	          },
    	        }}
    	        fullWidth
    	        defaultValue={newVariableValue}
    	      />
    	    </DialogContent>
    	    <DialogActions>
    	      <Button
    	        style={{ borderRadius: "0px" }}
    	        onClick={() => {
    	          setNewVariableName("");
    	          setNewVariableDescription("");
    	          setNewVariableValue("");
    	          setVariablesModalOpen(false);
    	        }}
    	        color="primary"
    	      >
    	        Cancel
    	      </Button>
    	      <Button
    	        style={{ borderRadius: "0px" }}
    	        disabled={
    	          newVariableName.length === 0 || newVariableValue.length === 0
    	        }
    	        variant={"contained"}
    	        onClick={() => {
								var handled = false
    	          if (
    	            workflow.workflow_variables === undefined ||
    	            workflow.workflow_variables === null
    	          ) {
    	            workflow.workflow_variables = [];
    	          } else {
									if (variableInfo.index !== undefined && variableInfo.index !== null && variableInfo.index >= 0) {
										if (newVariableName.length > 0) {
											workflow.workflow_variables[variableInfo.index].name = newVariableName;
										}
										if (newVariableDescription.length > 0) {
											workflow.workflow_variables[variableInfo.index].description =
												newVariableDescription;
										}
										if (newVariableValue.length > 0) {
											workflow.workflow_variables[variableInfo.index].value = newVariableValue;
										}

										handled = true 
									}
								}

								if (!handled) {
    	          	// try to find one with the same name
    	          	const found = workflow.workflow_variables.findIndex(
    	          	  (data) => data.name === newVariableName
    	          	);
    	          	if (found !== -1) {
    	          	  if (newVariableName.length > 0) {
    	          	    workflow.workflow_variables[found].name = newVariableName;
    	          	  }
    	          	  if (newVariableDescription.length > 0) {
    	          	    workflow.workflow_variables[found].description =
    	          	      newVariableDescription;
    	          	  }
    	          	  if (newVariableValue.length > 0) {
    	          	    workflow.workflow_variables[found].value = newVariableValue;
    	          	  }
    	          	} else {
    	          	  workflow.workflow_variables.push({
    	          	    name: newVariableName,
    	          	    description: newVariableDescription,
    	          	    value: newVariableValue,
    	          	    id: uuidv4(),
    	          	  });
    	          	}
								}

								setVariableInfo({})
    	          setWorkflow(workflow);
    	          setVariablesModalOpen(false);
    	          setNewVariableName("");
    	          setNewVariableDescription("");
    	          setNewVariableValue("");
    	        }}
    	        color="primary"
    	      >
    	        Submit
    	      </Button>
    	    </DialogActions>
    	  </FormControl>
    	</Dialog>
		)
	}

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

    if (
      selectedApp.authentication === undefined ||
      selectedApp.authentication.parameters === null ||
      selectedApp.authentication.parameters === undefined ||
      selectedApp.authentication.parameters.length === 0
    ) {
      return (
        <DialogContent style={{ textAlign: "center", marginTop: 50 }}>
          <Typography variant="h4" id="draggable-dialog-title" style={{cursor: "move",}}>
            {selectedApp.name} does not require authentication
          </Typography>
        </DialogContent>
      );
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
      console.log("NEW AUTH: ", authenticationOption);
      if (authenticationOption.label.length === 0) {
        authenticationOption.label = `Auth for ${selectedApp.name}`;
      }

      // Automatically mapping fields that already exist (predefined).
      // Warning if fields are NOT filled
      for (var key in selectedApp.authentication.parameters) {
        if (
          authenticationOption.fields[
            selectedApp.authentication.parameters[key].name
          ].length === 0
        ) {
          if (
            selectedApp.authentication.parameters[key].value !== undefined &&
            selectedApp.authentication.parameters[key].value !== null &&
            selectedApp.authentication.parameters[key].value.length > 0
          ) {
            authenticationOption.fields[
              selectedApp.authentication.parameters[key].name
            ] = selectedApp.authentication.parameters[key].value;
          } else {
            if (
              selectedApp.authentication.parameters[key].schema.type === "bool"
            ) {
              authenticationOption.fields[
                selectedApp.authentication.parameters[key].name
              ] = "false";
            } else {
              alert.info(
                "Field " +
                  selectedApp.authentication.parameters[key].name +
                  " can't be empty"
              );
              return;
            }
          }
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

      if (configureWorkflowModalOpen) {
        setSelectedAction({});
      }

      setUpdate(authenticationOption.id);
    };

    if (
      authenticationOption.label === null ||
      authenticationOption.label === undefined
    ) {
      authenticationOption.label = selectedApp.name + " authentication";
    }

    return (
      <div>
    	  <DialogTitle id="draggable-dialog-title" style={{cursor: "move",}}>
          <div style={{ color: "white" }}>
            Authentication for {selectedApp.name}
          </div>
        </DialogTitle>
        <DialogContent>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://shuffler.io/docs/apps#authentication"
            style={{ textDecoration: "none", color: "#f85a3e" }}
          >
            What is app authentication?
          </a>
          <div />
          These are required fields for authenticating with {selectedApp.name}
          <div style={{ marginTop: 15 }} />
          <b>Name - what is this used for?</b>
          <TextField
            style={{
              backgroundColor: inputColor,
              borderRadius: theme.palette.borderRadius,
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
          <Divider
            style={{
              marginTop: 15,
              marginBottom: 15,
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div />
          {selectedApp.authentication.parameters.map((data, index) => {
            return (
              <div key={index} style={{ marginTop: 10 }}>
                <LockOpenIcon style={{ marginRight: 10 }} />
                <b>{data.name}</b>

                {data.schema !== undefined &&
                data.schema !== null &&
                data.schema.type === "bool" ? (
                  <Select
										MenuProps={{
											disableScrollLock: true,
										}}
                    SelectDisplayProps={{
                      style: {
                        marginLeft: 10,
                      },
                    }}
                    defaultValue={"false"}
                    fullWidth
                    onChange={(e) => {
                      console.log("Value: ", e.target.value);
                      authenticationOption.fields[data.name] = e.target.value;
                    }}
                    style={{
                      backgroundColor: theme.palette.surfaceColor,
                      color: "white",
                      height: 50,
                    }}
                  >
                    <MenuItem
                      key={"false"}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: "white",
                      }}
                      value={"false"}
                    >
                      false
                    </MenuItem>
                    <MenuItem
                      key={"true"}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: "white",
                      }}
                      value={"true"}
                    >
                      true
                    </MenuItem>
                  </Select>
                ) : (
                  <TextField
                    style={{
                      backgroundColor: inputColor,
                      borderRadius: theme.palette.borderRadius,
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
                      data.example !== undefined && data.example.includes("***")
                        ? "password"
                        : "text"
                    }
                    color="primary"
                    defaultValue={
                      data.value !== undefined && data.value !== null
                        ? data.value
                        : ""
                    }
                    placeholder={data.example}
                    onChange={(event) => {
                      authenticationOption.fields[data.name] =
                        event.target.value;
                    }}
                  />
                )}
              </div>
            );
          })}
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
              setAuthenticationOptions(authenticationOption);
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

  const configureWorkflowModal =
    configureWorkflowModalOpen && apps.length !== 0 ? (
      <Dialog
        open={configureWorkflowModalOpen}
        PaperProps={{
          style: {
            backgroundColor: surfaceColor,
            color: "white",
            minWidth: 600,
            padding: 50,
						border: theme.palette.defaultBorder,
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
            setConfigureWorkflowModalOpen(false);
          }}
        >
          <CloseIcon />
        </IconButton>
        <ConfigureWorkflow
          alert={alert}
          theme={theme}
          setAuthenticationType={setAuthenticationType}
          globalUrl={globalUrl}
          workflow={workflow}
          setSelectedAction={setSelectedAction}
          setSelectedApp={setSelectedApp}
          setAuthenticationModalOpen={setAuthenticationModalOpen}
          appAuthentication={appAuthentication}
          selectedAction={selectedAction}
          apps={apps}
          setConfigureWorkflowModalOpen={setConfigureWorkflowModalOpen}
          saveWorkflow={saveWorkflow}
          newWebhook={newWebhook}
          submitSchedule={submitSchedule}
          referenceUrl={referenceUrl}
          isCloud={isCloud}
        />
      </Dialog>
    ) : null;

  // This whole part is redundant. Made it part of Arguments instead.
  const authenticationModal = authenticationModalOpen ? (
    <Dialog
      PaperComponent={PaperComponent}
			aria-labelledby="draggable-dialog-title"
      hideBackdrop={true}
      disableEnforceFocus={true}
			disableBackdropClick={true}
      style={{ pointerEvents: "none" }}
      open={authenticationModalOpen}
      onClose={() => {
        //if (configureWorkflowModalOpen) {
        //  setSelectedAction({});
        //}
      }}
      PaperProps={{
        style: {
					pointerEvents: "auto",
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: 1100,
          minHeight: 700,
          maxHeight: 700,
          padding: 15,
          overflow: "hidden",
          zIndex: 10012,
					border: theme.palette.defaultBorder,
        },
      }}
    >
      <div
        style={{
          zIndex: 5000,
          position: "absolute",
          top: 20,
          right: 54,
          height: 50,
          width: 50,
        }}
      >
        {selectedApp.reference_info === undefined ||
        selectedApp.reference_info === null ||
        selectedApp.reference_info.github_url === undefined ||
        selectedApp.reference_info.github_url === null ||
        selectedApp.reference_info.github_url.length === 0 ? (
          <a
            rel="noopener noreferrer"
            target="_blank"
            href={"https://github.com/shuffle/python-apps"}
            style={{ textDecoration: "none", color: "#f86a3e" }}
          >
            <img
              alt={`Documentation image for ${selectedApp.name}`}
              src={selectedApp.large_image}
              style={{
                width: 30,
                height: 30,
                border: "2px solid rgba(255,255,255,0.6)",
                borderRadius: theme.palette.borderRadius,
                maxHeight: 30,
                maxWidth: 30,
                overflow: "hidden",
                fontSize: 8,
              }}
            />
          </a>
        ) : (
          <a
            rel="noopener noreferrer"
            target="_blank"
            href={selectedApp.reference_info.github_url}
            style={{ textDecoration: "none", color: "#f86a3e" }}
          >
            <img
              alt={`Documentation image for ${selectedApp.name}`}
              src={selectedApp.large_image}
              style={{
                width: 30,
                height: 30,
                border: "2px solid rgba(255,255,255,0.6)",
                borderRadius: theme.palette.borderRadius,
                maxWidth: 30,
                maxHeight: 30,
                overflow: "hidden",
                fontSize: 8,
              }}
            />
          </a>
        )}
      </div>
      <IconButton
        style={{
          zIndex: 5000,
          position: "absolute",
          top: 14,
          right: 18,
          color: "grey",
        }}
        onClick={() => {
          setAuthenticationModalOpen(false);
          if (configureWorkflowModalOpen) {
            setSelectedAction({});
          }
        }}
      >
        <CloseIcon />
      </IconButton>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            flex: 2,
            padding: 0,
            minHeight: isMobile ? "90%" : 650,
            maxHeight: isMobile ? "90%" : 650,
            overflowY: "auto",
            overflowX: isMobile ? "auto" : "hidden",
          }}
        >
          {authenticationType.type === "oauth2" ? (
            <AuthenticationOauth2
              saveWorkflow={saveWorkflow}
              selectedApp={selectedApp}
              workflow={workflow}
              selectedAction={selectedAction}
              authenticationType={authenticationType}
              getAppAuthentication={getAppAuthentication}
              appAuthentication={appAuthentication}
              setSelectedAction={setSelectedAction}
              setNewAppAuth={setNewAppAuth}
              setAuthenticationModalOpen={setAuthenticationModalOpen}
            />
          ) : (
            <AuthenticationData app={selectedApp} />
          )}
        </div>
        <div
          style={{
            flex: 3,
            borderLeft: `1px solid ${inputColor}`,
            padding: "70px 30px 30px 30px",
            maxHeight: 630,
            minHeight: 630,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {selectedApp.documentation === undefined ||
          selectedApp.documentation === null ||
          selectedApp.documentation.length === 0 ? (
            <span style={{ textAlign: "center" }}>
              <Typography
                variant="body1"
                style={{ marginLeft: 25, marginRight: 25 }}
              >
                {selectedApp.description}
              </Typography>
              <Divider
                style={{
                  marginTop: 25,
                  marginBottom: 25,
                  backgroundColor: inputColor,
                }}
              />
              <Typography variant="h6">
                There is currently no extended documentation available for this
                app.
              </Typography>
              <Typography variant="body1" style={{ marginTop: 25 }}>
                Want help help making or using this app?{" "}
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="https://discord.gg/B2CBzUm"
                  style={{ textDecoration: "none", color: "#f86a3e" }}
                >
                  Join the community on Discord!
                </a>
              </Typography>

              <Typography variant="h6" style={{ marginTop: 50 }}>
                Want to help change this app directly?
              </Typography>
              {selectedApp.reference_info === undefined ||
              selectedApp.reference_info === null ||
              selectedApp.reference_info.github_url === undefined ||
              selectedApp.reference_info.github_url === null ||
              selectedApp.reference_info.github_url.length === 0 ? (
                <span>
                  <Typography variant="body1" style={{ marginTop: 25 }}>
                    <a
                      rel="noopener noreferrer"
                      target="_blank"
                      href={"https://github.com/shuffle/python-apps"}
                      style={{ textDecoration: "none", color: "#f86a3e" }}
                    >
                      Check it out on Github!
                    </a>
                  </Typography>
                </span>
              ) : (
                <span>
                  <Typography variant="body1" style={{ marginTop: 25 }}>
                    <a
                      rel="noopener noreferrer"
                      target="_blank"
                      href={selectedApp.reference_info.github_url}
                      style={{ textDecoration: "none", color: "#f86a3e" }}
                    >
                      Check it out on Github!
                    </a>
                  </Typography>
                </span>
              )}
            </span>
          ) : (
            <ReactMarkdown
              id="markdown_wrapper"
              escapeHtml={true}
              source={selectedApp.documentation}
              renderers={{
                link: OuterLink,
                image: Img,
                code: CodeHandler,
                heading: Heading,
              }}
            />
          )}
        </div>
      </div>
    </Dialog>
  ) : null;

  const loadedCheck =
    isLoaded && workflowDone ? (
      <div>
        {newView}
        <VariablesModal variableInfo={variableInfo} setVariableInfo={setVariableInfo} />
        <ExecutionVariableModal variableInfo={variableInfo} setVariableInfo={setVariableInfo} />
        {conditionsModal}
        {authenticationModal}
        {codePopoutModal}
        {configureWorkflowModal}
				{editWorkflowModal}
        <TextField
          id="copy_element_shuffle"
          value={to_be_copied}
          style={{ display: "none" }}
        />
      </div>
    ) : (
      <div></div>
    );

  // Awful way of handling scroll
  if (
    scrollConfig !== undefined &&
    setScrollConfig !== undefined &&
    Object.getOwnPropertyNames(selectedAction).length !== 0
  ) {
    const rightSideActionView = document.getElementById("rightside_actions");
    if (rightSideActionView !== undefined && rightSideActionView !== null) {
      if (
        scrollConfig.top !== 0 &&
        scrollConfig.top !== undefined &&
        scrollConfig.top !== 0
      ) {
        setTimeout(() => {
          if (
            scrollConfig.selected !== undefined &&
            scrollConfig.selected !== null
          ) {
            const selectedField = document.getElementById(
              scrollConfig.selected
            );
            if (selectedField !== undefined && selectedField !== null) {
              selectedField.focus();
            }
          }
        }, 5);
      } else {
        if (rightSideActionView.scrollTop !== scrollConfig.top) {
          setScrollConfig({
            top: rightSideActionView.scrollTop,
            left: 0,
            selected: "",
          });
        }
      }
    }
  }

  return (
    <div>
      {/* Removed due to missing react router features
				<Prompt when={!lastSaved} message={unloadText} />
			*/}
      {loadedCheck}
    </div>
  );
};

export default AngularWorkflow;
